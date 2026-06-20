import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center">
        {/* Loading Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500/10"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-cyan-500 animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-400 font-display text-sm tracking-widest uppercase glow-text animate-pulse">
          Verifying Secure Session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page but save the original location we attempted to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
