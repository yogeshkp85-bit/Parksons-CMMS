import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

export const authenticate = (req: any, res: Response, next: NextFunction) => {
  try {
    const path = req.path;
    
    // Allow bypass only for public setup / auth endpoints, or if in test environment without authorization headers
    if (
      path === '/auth/login' || 
      path === '/auth/register' || 
      path === '/auth/register-metadata' || 
      path === '/users/init' || 
      path === '/health' ||
      path === '/metrics' ||
      (process.env.NODE_ENV === 'test' && !req.headers.authorization)
    ) {
      if (process.env.NODE_ENV === 'test' && !req.headers.authorization) {
        req.user = {
          userId: 'mock-test-id',
          email: 'yogeshkp85@gmail.com',
          level: 'superadmin'
        };
      }
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Access token missing or malformed'
      });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'test_secret_for_local_development';

    jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
      if (err) {
        logger.warn(`Failed token verification: ${err.message}`);
        return res.status(401).json({
          success: false,
          data: null,
          message: 'Invalid or expired token'
        });
      }

      req.user = decoded;
      next();
    });
  } catch (error: any) {
    logger.error(`Authentication middleware error: ${error.message}`);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Internal server authorization error'
    });
  }
};
