import { createServer } from 'http';
import { AddressInfo } from 'net';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { Server, Socket as ServerSocket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { initializeSocket, NotificationType } from '../../src/services/socket.service';

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_for_local_development';

describe('Socket.IO Infrastructure Integration Tests', () => {
  let io: Server;
  let server: any;
  let port: number;
  let validToken: string;

  beforeAll((done) => {
    server = createServer();
    io = new Server(server, {
      path: '/socket.io',
    });
    initializeSocket(io);

    server.listen(() => {
      const addr = server.address() as AddressInfo;
      port = addr.port;
      
      // Generate a valid mock JWT token
      validToken = jwt.sign(
        { email: 'technician@test.com', role: 'technician' },
        JWT_SECRET
      );
      done();
    });
  });

  afterAll((done) => {
    io.close();
    server.close(done);
  });

  it('should reject connection when token is missing', (done) => {
    const client = Client(`http://localhost:${port}`, {
      path: '/socket.io',
      autoConnect: false,
    });

    client.connect();

    client.on('connect_error', (err: Error) => {
      expect(err.message).toBe('Authentication error: Token missing');
      client.disconnect();
      setTimeout(done, 50);
    });
  });

  it('should reject connection when token is invalid', (done) => {
    const client = Client(`http://localhost:${port}`, {
      path: '/socket.io',
      auth: { token: 'invalid_token' },
      autoConnect: false,
    });

    client.connect();

    client.on('connect_error', (err: Error) => {
      expect(err.message).toBe('Authentication error: Invalid token');
      client.disconnect();
      setTimeout(done, 50);
    });
  });

  it('should accept connection with valid JWT token', (done) => {
    const client = Client(`http://localhost:${port}`, {
      path: '/socket.io',
      auth: { token: validToken },
      autoConnect: false,
    });

    client.connect();

    client.on('connect', () => {
      expect(client.connected).toBe(true);
      client.disconnect();
      setTimeout(done, 50);
    });
  });
});
