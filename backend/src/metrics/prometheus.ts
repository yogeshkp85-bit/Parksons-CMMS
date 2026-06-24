import client from 'prom-client';

// Collect default metrics (CPU, Memory, Event Loop Lag, etc.)
client.collectDefaultMetrics();

// 1. HTTP Metrics
export const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status'],
});

export const httpRequestDurationHistogram = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 3, 5],
});

// 2. CMMS Application Metrics
export const breakdownCreatedCounter = new client.Counter({
  name: 'cmms_breakdown_created_total',
  help: 'Total number of breakdown logs created',
});

export const breakdownApprovedCounter = new client.Counter({
  name: 'cmms_breakdown_approved_total',
  help: 'Total number of breakdown logs approved',
});

export const notificationSentCounter = new client.Counter({
  name: 'cmms_notification_sent_total',
  help: 'Total number of Socket.IO notifications sent',
});

// 3. Socket.IO Metrics
export const activeSocketConnectionsGauge = new client.Gauge({
  name: 'socket_active_connections',
  help: 'Number of active Socket.IO connections',
});

// 4. Database Query Performance Metrics
export const prismaQueryDurationHistogram = new client.Histogram({
  name: 'prisma_query_duration_ms',
  help: 'Duration of Prisma database queries in milliseconds',
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000],
});

export const register = client.register;
export default client;
