import { Response } from 'express';
import prisma from '../utils/db';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types/auth.types';

export class NotificationController {
  /**
   * Get paginated notifications for the authenticated user (by userEmail).
   */
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const email = req.user?.email;
      if (!email) {
        return res.status(401).json({ success: false, message: 'Unauthorized: User email missing' });
      }

      // Fetch last 50 notifications
      const notifications = await prisma.notification.findMany({
        where: { userEmail: email },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (err: any) {
      logger.error(`[NotificationController] Error in getAll: ${err.message}`);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }

  /**
   * Mark a single notification as read.
   */
  async markRead(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const email = req.user?.email;

      if (!email) {
        return res.status(401).json({ success: false, message: 'Unauthorized: User email missing' });
      }

      const existing = await prisma.notification.findFirst({
        where: { id, userEmail: email },
      });

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err: any) {
      logger.error(`[NotificationController] Error in markRead: ${err.message}`);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }

  /**
   * Mark all notifications as read for the authenticated user.
   */
  async markAllRead(req: AuthenticatedRequest, res: Response) {
    try {
      const email = req.user?.email;
      if (!email) {
        return res.status(401).json({ success: false, message: 'Unauthorized: User email missing' });
      }

      const updated = await prisma.notification.updateMany({
        where: { userEmail: email, isRead: false },
        data: { isRead: true },
      });

      return res.status(200).json({
        success: true,
        message: `${updated.count} notifications marked as read`,
      });
    } catch (err: any) {
      logger.error(`[NotificationController] Error in markAllRead: ${err.message}`);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }

  /**
   * Get the count of unread notifications for the authenticated user.
   */
  async getUnreadCount(req: AuthenticatedRequest, res: Response) {
    try {
      const email = req.user?.email;
      if (!email) {
        return res.status(401).json({ success: false, message: 'Unauthorized: User email missing' });
      }

      const count = await prisma.notification.count({
        where: { userEmail: email, isRead: false },
      });

      return res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (err: any) {
      logger.error(`[NotificationController] Error in getUnreadCount: ${err.message}`);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }
}
