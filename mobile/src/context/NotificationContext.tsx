import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  refId: string;
  machine: string;
  timestamp: string;
  remarks?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  clearUnread: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let activeSocket: any = null;

    const setupSocket = async () => {
      try {
        const socket = await getSocket();
        activeSocket = socket;

        // Listener for new breakdowns
        socket.on('BREAKDOWN_CREATED', (data: Notification) => {
          handleIncomingNotification(data);
        });

        // Listener for approvals
        socket.on('BREAKDOWN_APPROVED', (data: Notification) => {
          handleIncomingNotification(data);
        });

        // Listener for rejections
        socket.on('BREAKDOWN_REJECTED', (data: Notification) => {
          handleIncomingNotification(data);
        });
      } catch (err) {
        console.error('Failed to initialize socket connection in context', err);
      }
    };

    setupSocket();

    return () => {
      if (activeSocket) {
        activeSocket.off('BREAKDOWN_CREATED');
        activeSocket.off('BREAKDOWN_APPROVED');
        activeSocket.off('BREAKDOWN_REJECTED');
      }
    };
  }, [isAuthenticated]);

  const handleIncomingNotification = (notif: Notification) => {
    setNotifications((prev) => [notif, ...prev.slice(0, 49)]); // buffer cap of 50
    setUnreadCount((c) => c + 1);

    // Show Native In-App Alert
    Alert.alert(notif.title, notif.message, [{ text: 'OK' }]);
  };

  const clearUnread = () => {
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, clearUnread }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
