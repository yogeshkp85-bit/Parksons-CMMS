import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api, { setAccessToken, AUTH_EVENTS } from '../services/api';

interface Role {
  name: string;
  code: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  plantId: string | null;
}

interface AuthContextType {
  user: User | null;
  permissions: string[];
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  registerUser: (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    roleId: string;
    plantId?: string;
  }) => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Decode helper
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<any>(null);

  // Setup refresh timer
  const scheduleTokenRefresh = (token: string) => {
    // Clear old timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) return;

    // Refresh token 1 minute before expiry (exp is in seconds)
    const expTime = decoded.exp * 1000;
    const refreshDelay = expTime - Date.now() - 60000; // 1 minute before 15m expires

    if (refreshDelay > 0) {
      refreshTimerRef.current = setTimeout(async () => {
        try {
          console.log('[AuthContext] Triggering automatic token refresh...');
          const res = await api.post('/auth/refresh');
          const newToken = res.data?.data?.token;
          if (newToken) {
            updateSession(newToken);
          }
        } catch (err) {
          console.error('[AuthContext] Automatic refresh failed, logging out.', err);
          handleLogoutCleanup();
        }
      }, refreshDelay);
    }
  };

  const updateSession = (token: string) => {
    setAccessToken(token);
    setAccessTokenState(token);
    
    const decoded = parseJwt(token);
    if (decoded) {
      setUser({
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: {
          name: decoded.role === 'SUPER_ADMIN' ? 'Super Admin' : decoded.role,
          code: decoded.role
        },
        plantId: decoded.plantId
      });
      setPermissions(decoded.permissions || []);
      scheduleTokenRefresh(token);
    }
  };

  const handleLogoutCleanup = () => {
    setAccessToken(null);
    setAccessTokenState(null);
    setUser(null);
    setPermissions([]);
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
  };

  // Perform silent token refresh check on mount
  const checkSession = async () => {
    try {
      const res = await api.post('/auth/refresh');
      const token = res.data?.data?.token;
      if (token) {
        updateSession(token);
      }
    } catch (err) {
      // Refresh failed or no cookie exists, which is expected for fresh sessions
      handleLogoutCleanup();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res.data?.data?.token;
      if (token) {
        updateSession(token);
      }
    } catch (error) {
      handleLogoutCleanup();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed', error);
    } finally {
      handleLogoutCleanup();
    }
  };

  const registerUser = async (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    roleId: string;
    plantId?: string;
  }) => {
    await api.post('/auth/register', payload);
  };

  // Listen to API events (expired session or token updates)
  useEffect(() => {
    const onSessionExpired = () => {
      console.warn('[AuthContext] Session expired event received, logging out.');
      handleLogoutCleanup();
    };

    const onTokenRefreshed = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newToken = customEvent.detail;
      if (newToken) {
        updateSession(newToken);
      }
    };

    window.addEventListener(AUTH_EVENTS.SESSION_EXPIRED, onSessionExpired);
    window.addEventListener(AUTH_EVENTS.TOKEN_REFRESHED, onTokenRefreshed);

    // Initial check
    checkSession();

    return () => {
      window.removeEventListener(AUTH_EVENTS.SESSION_EXPIRED, onSessionExpired);
      window.removeEventListener(AUTH_EVENTS.TOKEN_REFRESHED, onTokenRefreshed);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        registerUser,
        checkSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
