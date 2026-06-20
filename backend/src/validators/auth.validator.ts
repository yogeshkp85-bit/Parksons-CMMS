import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import logger from '../utils/logger';

// Schema for registration payload
export const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name must not exceed 100 characters'),
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must not exceed 100 characters'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters long')
    .max(100, 'Password must not exceed 100 characters'),
  phone: z.string().optional().nullable(),
  roleId: z.string().uuid('Invalid role ID format (UUID expected)'),
  plantId: z.string().uuid('Invalid plant ID format (UUID expected)').optional().nullable()
});

// Schema for login payload
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format'),
  password: z.string()
    .min(1, 'Password is required')
});

/**
 * Middleware factory to validate request body schemas
 * @param schema Zod Schema to validate
 */
export const validateBody = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        logger.warn(`Request validation failed for route ${req.originalUrl}: ${JSON.stringify(errorMessages)}`);
        return res.status(400).json({
          status: 'error',
          message: 'Invalid request body parameters.',
          errors: errorMessages
        });
      }
      
      logger.error(`Validation parser crashed: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Internal request validation failure.'
      });
    }
  };
};
