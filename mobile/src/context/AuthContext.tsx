import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { getStoredToken, storeToken, clearStoredToken, getStoredServerIp, storeServerIp } from '../services/api';
import { disconnectSocket } from '../services/socket';

interface User {
  name: string;
  email: string;
  level: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  serverIp: string;
  login: (email: string, password: string, serverIp?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateServerIp: (ip: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple base64 decoder for React Native environment compatibility
function base64Decode(input: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input.replace(/=+$/, '');
  let output = '';
  
  if (str.length % 4 === 1) {
    throw new Error('Invalid base64 string');
  }

  for (let bc = 0, bs = 0, buffer = 0, idx = 0; idx < str.length; idx++) {
    const char = str.charAt(idx);
    const charIndex = chars.indexOf(char);
    if (charIndex === -1) continue;

    buffer = bs % 4 ? buffer * 64 + charIndex : charIndex;
    if (bs++ % 4) {
      output += String.fromCharCode(255 & (buffer >> ((-2 * bs) & 6)));
    }
  }
  return output;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [serverIp, setServerIp] = useState('');

  useEffect(() => {
    // Restore session on app launch
    const bootstrapAsync = async () => {
      try {
        const ip = await getStoredServerIp();
        if (ip) {
          setServerIp(ip);
        }
        
        const token = await getStoredToken();
        if (token) {
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const decodedPayload = base64Decode(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
              const payload = JSON.parse(decodedPayload);
              setUser({
                name: payload.name || 'Technician',
                email: payload.email,
                level: payload.level || payload.role || 'technician',
              });
              setIsAuthenticated(true);
            }
          } catch (e) {
            console.error('Failed to parse token payload', e);
            await clearStoredToken();
          }
        }
      } catch (e) {
        console.warn('Session restoration failed', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (email: string, password: string, ip?: string) => {
    setIsLoading(true);
    try {
      if (ip) {
        await storeServerIp(ip);
        setServerIp(ip);
      }
      
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data.data;
      
      await storeToken(token);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed';
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await clearStoredToken();
      disconnectSocket();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updateServerIp = async (ip: string) => {
    await storeServerIp(ip);
    setServerIp(ip);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, serverIp, login, logout, updateServerIp }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
