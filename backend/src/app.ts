import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './routes';
import { httpRequestCounter, httpRequestDurationHistogram } from './metrics/prometheus';

const app = express();

// ==========================================
// 1. GLOBAL MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Prometheus HTTP Request Metrics Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    // Avoid counting monitoring requests
    if (req.originalUrl !== '/metrics' && req.originalUrl !== '/api/health' && req.originalUrl !== '/health') {
      const duration = process.hrtime(start);
      const durationInSeconds = duration[0] + duration[1] / 1e9;
      
      const route = req.route ? req.route.path : req.path;
      httpRequestCounter.inc({ method: req.method, route, status: res.statusCode });
      httpRequestDurationHistogram.observe({ method: req.method, route, status: res.statusCode }, durationInSeconds);
    }
  });

  next();
});

// Request Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ==========================================
// 2. ROUTE REGISTRATION
// ==========================================
// All module routes prefixed with /api
app.use('/api', routes);

// ==========================================
// 3. ERROR HANDLING
// ==========================================

// 404 Fallback Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    data: null,
    message: 'API Endpoint not found'
  });
});

// Global Error Handler
import logger from './utils/logger';

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Categorize errors for structured logging
  let action = 'UNHANDLED_ERROR';
  if (err.name === 'PrismaClientKnownRequestError' || err.name === 'PrismaClientUnknownRequestError' || err.name === 'PrismaClientRustPanicError' || err.name === 'PrismaClientInitializationError' || err.name === 'PrismaClientValidationError') {
    action = 'PRISMA_DATABASE_ERROR';
    logger.error(`[Database Error] ${message}`, { 
      action, 
      code: err.code, 
      meta: err.meta,
      stack: err.stack 
    });
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    action = 'JWT_AUTHENTICATION_ERROR';
    logger.warn(`[JWT Auth Error] ${message}`, { action, stack: err.stack });
  } else if (err.name === 'ZodError' || err.name === 'ValidationError') {
    action = 'VALIDATION_ERROR';
    logger.warn(`[Validation Error] ${message}`, { action, errors: err.errors || err.details });
  } else {
    logger.error(`[Global Error] ${message}`, { action, stack: err.stack });
  }
  
  res.status(status).json({
    success: false,
    data: null,
    message: message
  });
});

export default app;
