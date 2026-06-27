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
  permissions?: any;
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

  const mapLevelToRoleAndPermissions = (level: string, dynamicPerms?: any) => {
    const normalized = String(level || '').trim().toLowerCase().replace('_', '');
    
    let role = { name: 'Viewer', code: 'viewer' };
    if (normalized === 'superadmin') {
      role = { name: 'Super Admin', code: 'superadmin' };
    } else if (normalized === 'admin') {
      role = { name: 'Admin', code: 'admin' };
    } else if (normalized === 'manager') {
      role = { name: 'Manager', code: 'manager' };
    } else if (normalized === 'supervisor') {
      role = { name: 'Supervisor', code: 'supervisor' };
    } else if (normalized === 'technician') {
      role = { name: 'Technician', code: 'technician' };
    }

    let permissionsList: string[] = [];
    if (normalized === 'superadmin') {
      permissionsList = ['Dashboard', 'Create', 'Edit', 'Delete', 'Approve', 'Reports', 'Masters', 'Users', 'PreventiveMaintenance'];
    } else if (dynamicPerms && typeof dynamicPerms === 'object') {
      if ((dynamicPerms['Dashboard'] || []).includes('View')) permissionsList.push('Dashboard');
      if ((dynamicPerms['Breakdown'] || []).includes('Create')) permissionsList.push('Create');
      if ((dynamicPerms['Breakdown'] || []).includes('Edit')) permissionsList.push('Edit');
      if ((dynamicPerms['Breakdown'] || []).includes('Delete')) permissionsList.push('Delete');
      if ((dynamicPerms['Approval Queue'] || []).includes('Approve')) permissionsList.push('Approve');
      if ((dynamicPerms['Reports'] || []).includes('View')) permissionsList.push('Reports');
      if ((dynamicPerms['Master Setup'] || []).includes('View')) permissionsList.push('Masters');
      if ((dynamicPerms['User Management'] || []).includes('View')) permissionsList.push('Users');
      if ((dynamicPerms['Preventive Maintenance'] || []).includes('View')) permissionsList.push('PreventiveMaintenance');
    } else {
      // Legacy presets fallback if no dynamic permissions matrix is defined
      if (normalized === 'admin') {
        permissionsList = ['Dashboard', 'Create', 'Edit', 'Delete', 'Approve', 'Reports', 'Masters', 'Users', 'PreventiveMaintenance'];
      } else if (normalized === 'manager') {
        permissionsList = ['Dashboard', 'Approve', 'Reports', 'PreventiveMaintenance'];
      } else if (normalized === 'supervisor') {
        permissionsList = ['Dashboard', 'Create', 'Edit', 'Approve', 'Reports', 'PreventiveMaintenance'];
      } else if (normalized === 'technician') {
        permissionsList = ['Dashboard', 'Create', 'PreventiveMaintenance'];
      } else {
        permissionsList = ['Dashboard', 'PreventiveMaintenance'];
      }
    }

    return { role, permissions: permissionsList };
  };

  const handleLogoutCleanup = () => {
    localStorage.removeItem('cmms_user');
    localStorage.removeItem('cmms_token'); 
    setAccessToken(null);
    setAccessTokenState(null);
    setUser(null);
    setPermissions([]);
  };

  const checkSession = async () => {
    try {
      const storedUser = localStorage.getItem('cmms_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const mapped = mapLevelToRoleAndPermissions(parsedUser.role?.code || 'viewer', parsedUser.permissions);
        setUser(parsedUser);
        setPermissions(mapped.permissions);
        try {
          const refreshRes = await api.post('/auth/refresh');
          if (refreshRes.data?.data?.token) {
            setAccessToken(refreshRes.data.data.token);
            setAccessTokenState(refreshRes.data.data.token);
          }
        } catch {
          handleLogoutCleanup();
        }
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
        const mapped = mapLevelToRoleAndPermissions(userData.level, userData.permissions);
        
        const fullUser: User = {
          id: userData.email,
          name: userData.name,
          email: userData.email,
          role: mapped.role,
          plantId: 'PUNE', // Set plant context default to PUNE
          permissions: userData.permissions
        };

        localStorage.setItem('cmms_user', JSON.stringify(fullUser));
        setAccessToken(token);
        setAccessTokenState(token);
        setUser(fullUser);
        setPermissions(mapped.permissions);
        setIsLoading(false);
        return; 
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
