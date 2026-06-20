import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the redirect path from router state, default to root dashboard
  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
      console.log('[Login] Successfully logged in. Redirecting to:', from);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('[Login] Exception:', err);
      const msg = err.response?.data?.message || 'Login failed. Please verify your credentials.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060810] bg-radial-at-t from-[#0d222b] via-[#060810] to-[#05060b] flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Animated App Logo Header */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-3 shadow-lg shadow-emerald-500/10 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.68-.34-1.44-.06-1.78.62L7.5 18.62a2.25 2.25 0 11-4.02-2.02l1.06-2.1c.3-.6.18-1.34-.3-1.8l-1.61-1.62a2.25 2.25 0 113.18-3.18l1.62 1.61c.47.47 1.2.6 1.8.3l2.1-1.06a2.25 2.25 0 112.02 4.02l-2.16 1.08c-.68.34-.96 1.1-.62 1.78l1.08 2.16a2.25 2.25 0 11-4.02 2.02l-1.08-2.16z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        
        <h2 className="text-4xl font-extrabold tracking-tight font-display text-gray-100 glow-text">
          PARKSONS CMMS
        </h2>
        <p className="mt-2 text-sm text-gray-400 font-sans tracking-wide">
          Enterprise Digital Maintenance Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="glass-panel py-8 px-6 sm:px-10 rounded-2xl border-white/5 shadow-2xl relative overflow-hidden animate-pulse-border">
          <h3 className="text-xl font-bold font-display text-gray-200 mb-6">
            Sign In
          </h3>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-start gap-2.5 text-xs animate-fade-in">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@parksons.com"
                  className="glass-input pl-10 pr-4 py-2.5 block w-full rounded-lg text-sm text-gray-200 placeholder-gray-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input pl-10 pr-10 py-2.5 block w-full rounded-lg text-sm text-gray-200 placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white glow-btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Access Console'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-white/5 pt-6 text-center">
            <p className="text-xs text-gray-400">
              New employee account?{' '}
              <Link to="/register" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                Request access register
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials Helper Card */}
        <div className="mt-4 glass-panel p-4 rounded-xl text-xs text-gray-400 border-white/5">
          <p className="font-semibold text-gray-200 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Super Admin</span>
              <span className="font-mono text-gray-300">yogeshkp85@gmail.com</span>
            </div>
            <div>
              <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Password</span>
              <span className="font-mono text-gray-300">PKS@2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
