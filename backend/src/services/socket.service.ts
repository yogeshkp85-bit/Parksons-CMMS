import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import prisma from '../utils/db';
import { 
  activeSocketConnectionsGauge, 
  breakdownCreatedCounter, 
  breakdownApprovedCounter, 
  notificationSentCounter 
} from '../metrics/prometheus';

// =========================================================================
// NOTIFICATION TYPE ENUM (Standardized UPPER_CASE for Web, Mobile, Email)
// =========================================================================
export enum NotificationType {
  BREAKDOWN_CREATED  = 'BREAKDOWN_CREATED',
  BREAKDOWN_APPROVED = 'BREAKDOWN_APPROVED',
  BREAKDOWN_REJECTED = 'BREAKDOWN_REJECTED',
}

// =========================================================================
// GENERIC NOTIFICATION PAYLOAD (Mobile-ready, SaaS-ready)
// =========================================================================
export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  refId: string;
  machine: string;
  timestamp: string;
  remarks?: string;
}

// Extended payload for targeted user notifications (approval/rejection)
export interface UserNotificationPayload extends NotificationPayload {
  technicianEmail: string;
}

// =========================================================================
// MODULE STATE
// =========================================================================
let ioInstance: Server | null = null;

// Current tenant ID — single-tenant for now. When multi-tenancy arrives (Stage 10),
// this will be read from the JWT payload per-connection. Zero code changes in room logic.
const TENANT_ID = 'default';

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_for_local_development';

// Roles that join the supervisors room
const SUPERVISOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'MANAGER'];

// =========================================================================
// SOCKET INITIALIZATION (Called once from server.ts)
// =========================================================================
export function initializeSocket(io: Server): void {
  ioInstance = io;

  // Reset metrics
  activeSocketConnectionsGauge.set(0);

  // --------------------------------------------------
  // JWT HANDSHAKE AUTHENTICATION MIDDLEWARE
  // --------------------------------------------------
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token || typeof token !== 'string') {
      logger.warn(`[Socket] Connection rejected: Token missing`);
      return next(new Error('Authentication error: Token missing'));
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        logger.warn(`[Socket] Connection rejected: Invalid token — ${err.message}`);
        return next(new Error('Authentication error: Invalid token'));
      }

      // Attach decoded user data to socket for room assignment
      socket.data.user = decoded;
      next();
    });
  });

  // --------------------------------------------------
  // CONNECTION HANDLER — Room Assignment & Logging
  // --------------------------------------------------
  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    const email = user?.email || 'unknown';
    const role = (user?.role || user?.level || '').toUpperCase();

    // Increment active connections
    activeSocketConnectionsGauge.inc();

    // 1. Private user room — for targeted notifications
    socket.join(`user:${email}`);

    // 2. Tenant broadcast room — for tenant-wide announcements
    socket.join(`tenant:${TENANT_ID}`);

    // 3. Supervisor/Manager room — for breakdown alerts
    const normalizedRole = role.replace('_', '');
    const matchesSupRole = SUPERVISOR_ROLES.some(r => 
      r.replace('_', '') === normalizedRole || r === role
    );

    if (matchesSupRole) {
      socket.join(`tenant:${TENANT_ID}:supervisors`);
    }

    // Build room list for logging
    const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    logger.info(`[Socket] Connected: ${email} (${role}) → rooms: [${rooms.join(', ')}]`);

    // --------------------------------------------------
    // DISCONNECTION HANDLER
    // --------------------------------------------------
    socket.on('disconnect', (reason: string) => {
      activeSocketConnectionsGauge.dec();
      logger.info(`[Socket] Disconnected: ${email} — reason: ${reason}`);
    });

    // --------------------------------------------------
    // ERROR HANDLER
    // --------------------------------------------------
    socket.on('error', (err: Error) => {
      logger.error(`[Socket] Error for ${email}: ${err.message}`);
    });
  });

  logger.info('[Socket] Socket.IO initialized with JWT authentication and tenant room architecture');
}

// =========================================================================
// NOTIFICATION METHODS (Called from controllers/services after DB writes)
// =========================================================================

/**
 * Notify all supervisors and managers that a new breakdown has been created.
 * Target: tenant:{id}:supervisors room
 */
export async function notifyBreakdownCreated(payload: NotificationPayload): Promise<void> {
  // Track metrics
  breakdownCreatedCounter.inc();
  notificationSentCounter.inc();

  // Find all supervisors/managers to persist notifications in DB
  try {
    const supervisors = await prisma.user.findMany({
      where: {
        role: {
          code: {
            in: SUPERVISOR_ROLES
          }
        }
      },
      select: {
        email: true
      }
    });

    if (supervisors.length > 0) {
      const records = supervisors.map(sup => ({
        tenantId: TENANT_ID,
        userEmail: sup.email,
        type: NotificationType.BREAKDOWN_CREATED,
        title: payload.title,
        message: payload.message,
        refId: payload.refId,
        machine: payload.machine,
        remarks: payload.remarks
      }));

      const createdNotifications = await prisma.notification.createMany({
        data: records
      });
      logger.info(`[Socket] Persisted ${createdNotifications.count} DB notifications for supervisors`);
    }
  } catch (err: any) {
    logger.error(`[Socket] Failed to persist breakdown creation notifications: ${err.message}`);
  }

  if (!ioInstance) {
    logger.warn('[Socket] Cannot emit BREAKDOWN_CREATED — Socket.IO not initialized');
    return;
  }

  // Fetch the created notifications to get the ID for real-time payload
  // Or fallback to random ID so client always has one
  let realTimeId = Math.random().toString();
  try {
    const latest = await prisma.notification.findFirst({
      where: { refId: payload.refId, type: NotificationType.BREAKDOWN_CREATED },
      orderBy: { createdAt: 'desc' }
    });
    if (latest) realTimeId = latest.id;
  } catch {}

  ioInstance.to(`tenant:${TENANT_ID}:supervisors`).emit(NotificationType.BREAKDOWN_CREATED, {
    ...payload,
    id: realTimeId
  });
  logger.info(`[Socket] Emitted ${NotificationType.BREAKDOWN_CREATED} to tenant:${TENANT_ID}:supervisors — refId: ${payload.refId}`);
}

/**
 * Notify the technician who created the breakdown that it has been approved.
 * Target: user:{technicianEmail} room
 */
export async function notifyBreakdownApproved(payload: UserNotificationPayload): Promise<void> {
  breakdownApprovedCounter.inc();
  notificationSentCounter.inc();

  let realTimeId = Math.random().toString();
  try {
    const dbNotif = await prisma.notification.create({
      data: {
        tenantId: TENANT_ID,
        userEmail: payload.technicianEmail,
        type: NotificationType.BREAKDOWN_APPROVED,
        title: payload.title,
        message: payload.message,
        refId: payload.refId,
        machine: payload.machine,
        remarks: payload.remarks
      }
    });
    realTimeId = dbNotif.id;
    logger.info(`[Socket] Persisted DB breakdown approved notification for ${payload.technicianEmail}`);
  } catch (err: any) {
    logger.error(`[Socket] Failed to persist breakdown approval notification: ${err.message}`);
  }

  if (!ioInstance) {
    logger.warn('[Socket] Cannot emit BREAKDOWN_APPROVED — Socket.IO not initialized');
    return;
  }

  ioInstance.to(`user:${payload.technicianEmail}`).emit(NotificationType.BREAKDOWN_APPROVED, {
    ...payload,
    id: realTimeId
  });
  logger.info(`[Socket] Emitted ${NotificationType.BREAKDOWN_APPROVED} to user:${payload.technicianEmail} — refId: ${payload.refId}`);
}

/**
 * Notify the technician who created the breakdown that it has been rejected.
 * Target: user:{technicianEmail} room
 * Includes rejection remarks so the technician knows the reason.
 */
export async function notifyBreakdownRejected(payload: UserNotificationPayload): Promise<void> {
  notificationSentCounter.inc();

  let realTimeId = Math.random().toString();
  try {
    const dbNotif = await prisma.notification.create({
      data: {
        tenantId: TENANT_ID,
        userEmail: payload.technicianEmail,
        type: NotificationType.BREAKDOWN_REJECTED,
        title: payload.title,
        message: payload.message,
        refId: payload.refId,
        machine: payload.machine,
        remarks: payload.remarks
      }
    });
    realTimeId = dbNotif.id;
    logger.info(`[Socket] Persisted DB breakdown rejected notification for ${payload.technicianEmail}`);
  } catch (err: any) {
    logger.error(`[Socket] Failed to persist breakdown rejection notification: ${err.message}`);
  }

  if (!ioInstance) {
    logger.warn('[Socket] Cannot emit BREAKDOWN_REJECTED — Socket.IO not initialized');
    return;
  }

  ioInstance.to(`user:${payload.technicianEmail}`).emit(NotificationType.BREAKDOWN_REJECTED, {
    ...payload,
    id: realTimeId
  });
  logger.info(`[Socket] Emitted ${NotificationType.BREAKDOWN_REJECTED} to user:${payload.technicianEmail} — refId: ${payload.refId}, remarks: ${payload.remarks || 'none'}`);
}

