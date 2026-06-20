import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, UserPayload } from '../types/auth.types';
import logger from '../utils/logger';

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token missing or malformed. Use Bearer token.'
      });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'super-secret-cmms-jwt-key-2026-pks';

    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        logger.warn(`Failed token verification: ${err.message}`);
        return res.status(401).json({
          status: 'error',
          message: 'Invalid or expired access token.'
        });
      }

      req.user = decoded as UserPayload;
      next();
    });
  } catch (error: any) {
    logger.error(`Authentication middleware error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server authorization error.'
    });
  }
};
