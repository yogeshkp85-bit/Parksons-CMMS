import { PrismaClient } from '@prisma/client';
import logger from './logger';
import { prismaQueryDurationHistogram } from '../metrics/prometheus';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
  ],
});

// Intercept database queries and pipe them into the Winston logger & Prometheus metrics
prisma.$on('query', (e) => {
  // Track DB query latency
  prismaQueryDurationHistogram.observe(e.duration);

  if (process.env.NODE_ENV === 'development') {
    logger.debug(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
  }
});

prisma.$on('error', (e) => {
  logger.error(`Prisma Error: ${e.message}`);
});

prisma.$on('warn', (e) => {
  logger.warn(`Prisma Warning: ${e.message}`);
});

prisma.$on('info', (e) => {
  logger.info(`Prisma Info: ${e.message}`);
});

export default prisma;
