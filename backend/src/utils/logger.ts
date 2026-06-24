import winston from 'winston';
import path from 'path';

// Custom formatter to guarantee exact structured JSON keys
const customJsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const payload = {
      timestamp: info.timestamp || new Date().toISOString(),
      level: info.level,
      message: info.stack || info.message || '',
      action: info.action || '',
      refId: info.refId || ''
    };
    
    // Include other attributes if they exist
    Object.keys(info).forEach((key) => {
      if (!['timestamp', 'level', 'message', 'action', 'refId', 'stack'].includes(key)) {
        (payload as any)[key] = info[key];
      }
    });

    return JSON.stringify(payload);
  })
);

const logFormat = winston.format.printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: customJsonFormat,
  transports: [
    new winston.transports.File({ 
      filename: path.join('logs', 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    })
  );
} else {
  // Add JSON console transport for cloud/docker logging in production
  logger.add(
    new winston.transports.Console({
      format: customJsonFormat,
    })
  );
}

export default logger;
