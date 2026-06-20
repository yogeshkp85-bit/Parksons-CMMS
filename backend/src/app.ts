import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRouter from './routes/auth.router';
import breakdownRouter from './routes/breakdown.router';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Logging Middlewares
app.use(helmet());
app.use(cors({
  origin: true, // Supports standard dev tools, can lock down to specific domains later
  credentials: true
}));
app.use(express.json());

// Log HTTP requests using Morgan mapped into Winston
const morganStream = {
  write: (message: string) => logger.info(message.trim())
};
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { stream: morganStream }));

// Root Route
app.get('/', (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'success',
    message: 'Parksons CMMS API Service is running.',
    version: '1.0.0'
  });
});

// Register Module Routers
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/breakdowns', breakdownRouter);

// Protected health check route to verify authorization
app.get('/api/v1/health', (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'success',
    message: 'System is healthy and database is connected.'
  });
});

// Test routes for middleware verification
import { authenticate } from './middlewares/auth.middleware';
import { authorize } from './middlewares/rbac.middleware';

// Requires USER_VIEW permission (Super Admin & some roles have this)
app.get('/api/v1/test/user-view', authenticate, authorize('USER_VIEW'), (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'success',
    message: 'Access granted: USER_VIEW permission verification passed.'
  });
});

// Requires USER_MANAGE permission (Super Admin has this, standard Supervisor does not)
app.get('/api/v1/test/user-manage', authenticate, authorize('USER_MANAGE'), (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'success',
    message: 'Access granted: USER_MANAGE permission verification passed.'
  });
});

// 404 Route handler
app.use((req: Request, res: Response) => {
  return res.status(404).json({
    status: 'error',
    message: `Resource not found on endpoint: ${req.originalUrl}`
  });
});

// Global Error Handler Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Unhandle Exception: ${err.message}`, { stack: err.stack });
  return res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'An unexpected server exception occurred.'
  });
});

// Start Server
app.listen(PORT, () => {
  logger.info(`Server successfully started on port ${PORT} in ${process.env.NODE_ENV} environment.`);
});

export default app;
