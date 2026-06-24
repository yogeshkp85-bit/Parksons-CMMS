import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../services/api';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapLevelToRoleAndPermissions = (level: string) => {
    const normalized = String(level || '').trim().toLowerCase().replace('_', '');
    
    let role = { name: 'Viewer', code: 'viewer' };
    let permissions: string[] = ['Dashboard'];

    if (normalized === 'superadmin') {
      role = { name: 'Super Admin', code: 'superadmin' };
      permissions = ['Dashboard', 'Create', 'Edit', 'Delete', 'Approve', 'Reports', 'Masters', 'Users'];
    } else if (normalized === 'admin') {
      role = { name: 'Admin', code: 'admin' };
      permissions = ['Dashboard', 'Create', 'Edit', 'Delete', 'Approve', 'Reports', 'Masters', 'Users'];
    } else if (normalized === 'manager') {
      role = { name: 'Manager', code: 'manager' };
      permissions = ['Dashboard', 'Approve', 'Reports'];
    } else if (normalized === 'supervisor') {
      role = { name: 'Supervisor', code: 'supervisor' };
      permissions = ['Dashboard', 'Create', 'Edit', 'Approve', 'Reports'];
    } else if (normalized === 'technician') {
      role = { name: 'Technician', code: 'technician' };
      permissions = ['Dashboard', 'Create'];
    } else {
      role = { name: 'Viewer', code: 'viewer' };
      permissions = ['Dashboard'];
    }

    return { role, permissions };
  };

  const handleLogoutCleanup = () => {
    localStorage.removeItem('cmms_user');
    localStorage.removeItem('cmms_token');
    setAccessToken(null);
    setAccessTokenState(null);
    setUser(null);
    setPermissions([]);
  };

  // Perform token/session restoration from localStorage on mount
  const checkSession = async () => {
    try {
      const storedUser = localStorage.getItem('cmms_user');
      const storedToken = localStorage.getItem('cmms_token');
      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser);
        const mapped = mapLevelToRoleAndPermissions(parsedUser.role?.code || 'viewer');
        setAccessToken(storedToken);
        setAccessTokenState(storedToken);
        setUser(parsedUser);
        setPermissions(mapped.permissions);
      } else {
        handleLogoutCleanup();
      }
    } catch (err) {
      handleLogoutCleanup();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success && res.data?.data?.status === 'success') {
        const token = res.data.data.token;
        const userData = res.data.data.user;
        const mapped = mapLevelToRoleAndPermissions(userData.level);
        
        const fullUser: User = {
          id: userData.email,
          name: userData.name,
          email: userData.email,
          role: mapped.role,
          plantId: 'daman-plant'
        };

        // Cache in localStorage
        localStorage.setItem('cmms_user', JSON.stringify(fullUser));
        localStorage.setItem('cmms_token', token);

        setAccessToken(token);
        setAccessTokenState(token);
        setUser(fullUser);
        setPermissions(mapped.permissions);
        setIsLoading(false);
        return; // Login succeeded
      }
      throw new Error(res.data?.message || 'Login failed');
    } catch (error) {
      handleLogoutCleanup();
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Backend logout call skipped/failed', error);
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

  useEffect(() => {
    checkSession();
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
