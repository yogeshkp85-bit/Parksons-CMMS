import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface PermissionRouteProps {
  children: React.ReactNode;
  requiredPermission: string;
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({ children, requiredPermission }) => {
  const { user, permissions } = useAuth();

  const isSuperAdmin = user?.role?.code === 'SUPER_ADMIN';
  const hasPermission = permissions.includes(requiredPermission);

  if (!isSuperAdmin && !hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[60vh] text-center animate-fade-in">
        <div className="glass-panel max-w-md p-8 rounded-2xl flex flex-col items-center border border-red-500/20 shadow-lg shadow-red-950/20">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6 animate-pulse">
            <ShieldAlert size={36} />
          </div>
          
          <h2 className="text-2xl font-bold font-display text-gray-100 mb-2">
            Access Restricted
          </h2>
          
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Your user account ({user?.role?.code || 'Viewer'}) does not possess the permissions required to view this module.
          </p>
          
          <div className="bg-red-500/5 border border-red-500/10 rounded-lg px-4 py-2 text-xs font-mono text-red-400 mb-6">
            Required Permission: {requiredPermission}
          </div>
          
          <button 
            onClick={() => window.history.back()}
            className="px-5 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition-colors cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
