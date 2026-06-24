import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PermissionRouteProps {
  children: React.ReactNode;
  requiredPermission: string;
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({ children, requiredPermission }) => {
  const { user, permissions } = useAuth();

  const isSuperAdmin = user?.role?.code === 'superadmin' || user?.role?.code === 'SUPER_ADMIN';
  const hasPermission = permissions.includes(requiredPermission);

  if (!isSuperAdmin && !hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
