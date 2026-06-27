import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import app from './app';
import { initializeSocket } from './services/socket.service';

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:8082'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  path: '/socket.io',
});

// Initialize socket authentication, room logic, and event handlers
initializeSocket(io);

httpServer.listen(PORT, () => {
  console.log(`\n=========================================`);
  console.log(`🚀 Parksons CMMS Backend is running!`);
  console.log(`🔌 API:    http://localhost:${PORT}/api`);
  console.log(`⚡ Socket: http://localhost:${PORT}/socket.io`);
  console.log(`🌍 Env:    ${process.env.NODE_ENV || 'development'}`);
  console.log(`=========================================\n`);
});

// ==========================================
// SCHEDULED JOBS
// ==========================================
// Register after server starts so that any startup errors don't
// prevent the HTTP server from coming up.
import { registerSyncJob } from './jobs/syncJob';
import { registerDailyReportJob } from './jobs/dailyReportJob';

registerSyncJob();
registerDailyReportJob();
