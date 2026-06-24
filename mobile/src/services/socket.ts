import { io, Socket } from 'socket.io-client';
import { getStoredToken, getStoredServerIp } from './api';
import { getSocketUrl } from '../config';

let socketInstance: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  const customIp = await getStoredServerIp();
  const socketUrl = getSocketUrl(customIp || undefined);
  const token = await getStoredToken();

  if (socketInstance) {
    socketInstance.disconnect();
  }

  socketInstance = io(socketUrl, {
    auth: {
      token: token || undefined,
    },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
