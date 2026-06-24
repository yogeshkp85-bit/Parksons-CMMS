import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';

export interface Notification {
  id: string;
  type: 'BREAKDOWN_CREATED' | 'BREAKDOWN_APPROVED' | 'BREAKDOWN_REJECTED';
  title: string;
  message: string;
  refId: string;
  machine: string;
  read: boolean;
  timestamp: string;
  remarks?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { accessToken } = useAuth();

  const unreadCount = notifications.filter(n => !n.read).length;

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notify.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
  };

  // Connect socket and register listeners
  useEffect(() => {
    if (!accessToken) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setIsConnected(false);
      return;
    }

    const newSocket = io({
      auth: { token: accessToken },
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Fetch initial notifications history from DB
      fetchNotificationsHistory();
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    const handleNewNotification = (payload: any) => {
      const formatted: Notification = {
        id: payload.id || Math.random().toString(),
        type: payload.type,
        title: payload.title,
        message: payload.message,
        refId: payload.refId,
        machine: payload.machine,
        read: false,
        timestamp: payload.timestamp || new Date().toISOString(),
        remarks: payload.remarks,
      };

      setNotifications(prev => {
        // Prevent duplicate real-time notifications if we have them already
        if (prev.some(p => p.refId === formatted.refId && p.type === formatted.type && p.timestamp === formatted.timestamp)) {
          return prev;
        }
        return [formatted, ...prev].slice(0, 100);
      });
      playNotificationSound();
    };

    newSocket.on('BREAKDOWN_CREATED', handleNewNotification);
    newSocket.on('BREAKDOWN_APPROVED', handleNewNotification);
    newSocket.on('BREAKDOWN_REJECTED', handleNewNotification);

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [accessToken]);

  const fetchNotificationsHistory = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.success && Array.isArray(res.data.data)) {
        const dbNotifs = res.data.data.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          refId: n.refId,
          machine: n.machine,
          read: n.isRead,
          timestamp: n.createdAt || n.timestamp,
          remarks: n.remarks,
        }));
        setNotifications(dbNotifs.slice(0, 100));
      }
    } catch (err) {
      console.error('Failed to fetch notification history', err);
    }
  };

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await api.patch('/notifications/read-all');
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
