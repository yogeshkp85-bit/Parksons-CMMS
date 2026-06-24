import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#07090e] bg-radial-at-t from-[#1e1515] via-[#07090e] to-[#05060b] flex flex-col items-center justify-center p-6 text-center">
      <div className="glass-panel max-w-md p-10 rounded-2xl border border-red-500/10 shadow-2xl relative overflow-hidden animate-fade-in">
        
        {/* Glow backdrop decorative effect */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />
        
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse">
          <ShieldAlert size={32} />
        </div>
        
        <h2 className="text-2xl font-bold font-display text-gray-100 mb-3 tracking-wide">
          Access Denied
        </h2>
        
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          You do not have permission to view this page. If you believe this is an error, please contact your administrator.
        </p>

        <div className="space-y-3">
          <Link
            to="/"
            className="w-full py-2.5 rounded-lg text-xs font-semibold text-white glow-btn-primary flex items-center justify-center gap-2 cursor-pointer"
          >
            Return to Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full py-2.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-white/5 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
          >
            <ArrowLeft size={14} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
