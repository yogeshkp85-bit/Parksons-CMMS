import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import logger from '../utils/logger';

/**
 * Middleware factory to restrict endpoint access based on role permissions
 * @param requiredPermission Code of the permission required (e.g., 'BREAKDOWN_CREATE')
 */
export const authorize = (requiredPermission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'User authentication context missing. Register/login first.'
        });
      }

      // Bypass checks for Super Admin
      if (user.role === 'SUPER_ADMIN') {
        return next();
      }

      // Check if user has the required permission code
      const hasPermission = user.permissions.includes(requiredPermission);
      if (!hasPermission) {
        logger.warn(`User ${user.email} denied access to permission ${requiredPermission}`);
        return res.status(403).json({
          status: 'error',
          message: `Access denied. Requiring permission: ${requiredPermission}`
        });
      }

      next();
    } catch (error: any) {
      logger.error(`Authorization middleware error: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server permission mapping error.'
      });
    }
  };
};
