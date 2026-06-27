import { Response, NextFunction } from 'express';
import logger from '../utils/logger';
import prisma from '../utils/db';

const LEGACY_MAP: Record<string, { module: string; action: string }> = {
  Dashboard: { module: 'Dashboard', action: 'View' },
  Create: { module: 'Breakdown', action: 'Create' },
  Edit: { module: 'Breakdown', action: 'Edit' },
  Approve: { module: 'Approval Queue', action: 'Approve' },
  Reports: { module: 'Reports', action: 'View' },
  Masters: { module: 'Master Setup', action: 'View' },
  Users: { module: 'User Management', action: 'View' },
  PreventiveMaintenance: { module: 'Preventive Maintenance', action: 'View' },
};

export const authorize = (permission: string) => {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      // Bypass check in test environment if using mock user context without explicit overrides
      if (process.env.NODE_ENV === 'test' && (!req.user || req.user.userId === 'mock-test-id')) {
        return next();
      }

      if (!req.user || !req.user.email) {
        return res.status(403).json({
          success: false,
          data: null,
          message: 'Access denied: User context missing or unauthorized'
        });
      }

      // Fetch dynamic user permissions from database for real-time security updates
      const dbUser = await prisma.adminUsers.findUnique({
        where: { email: req.user.email }
      });

      if (!dbUser) {
        return res.status(403).json({
          success: false,
          data: null,
          message: 'Access denied: User account not found'
        });
      }

      const userRole = String(dbUser.level).trim().toLowerCase();

      // Super Admins bypass all granular permission checks
      if (userRole === 'superadmin') {
        return next();
      }

      // Map the legacy permission key to our new modular permissions matrix
      const check = LEGACY_MAP[permission] || { module: permission, action: 'View' };
      const userPermissions = (dbUser.permissions as Record<string, string[]>) || {};
      const moduleActions = userPermissions[check.module] || [];

      if (!moduleActions.includes(check.action)) {
        logger.warn(`[RBAC] Access Denied: User ${dbUser.email} lacks action [${check.action}] on module [${check.module}]`);
        return res.status(403).json({
          success: false,
          data: null,
          message: `Access denied: Missing required permission [${check.action}] for [${check.module}]`
        });
      }

      next();
    } catch (error: any) {
      logger.error(`RBAC middleware error: ${error.message}`);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Internal server authorization error'
      });
    }
  };
};
