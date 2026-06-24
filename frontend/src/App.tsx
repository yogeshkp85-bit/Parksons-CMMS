import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PermissionRoute } from './components/PermissionRoute';
import { AppLayout } from './components/AppLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { BreakdownEntry } from './pages/BreakdownEntry';
import { AdminApproval } from './pages/AdminApproval';
import { UserManagement } from './pages/UserManagement';
import { Unauthorized } from './pages/Unauthorized';
import { MachineMaster } from './pages/MachineMaster';
import { PMIndex } from './pages/pm/PMIndex';
import { Reports } from './pages/Reports';
import { ShieldAlert } from 'lucide-react';

const SettingsPlaceholder: React.FC = () => (
  <div className="glass-panel p-8 rounded-2xl border-white/5 animate-fade-in">
    <h2 className="text-xl font-bold font-display text-gray-100 mb-2">System Settings</h2>
    <p className="text-xs text-gray-400 mb-6">Manage global application configurations and integrations.</p>
    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-16 text-center text-gray-500 text-xs font-mono">
      [System Settings Configuration Module - Component Loaded successfully. Integration coming in Phase 5]
    </div>
  </div>
);

const NotFound: React.FC = () => (
  <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-center p-6">
    <div className="glass-panel max-w-sm p-8 rounded-2xl border-white/5 shadow-2xl">
      <div className="w-14 h-14 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-6">
        <ShieldAlert size={30} />
      </div>
      <h2 className="text-2xl font-bold font-display text-gray-100 mb-2">404 - Not Found</h2>
      <p className="text-gray-400 text-xs mb-6">The resources or page you are requesting could not be found.</p>
      <Link to="/" className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white glow-btn-primary block">
        Return Home
      </Link>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Secure App Shell Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard (requires Dashboard) */}
              <Route
                index
                element={
                  <PermissionRoute requiredPermission="Dashboard">
                    <Dashboard />
                  </PermissionRoute>
                }
              />

              {/* Breakdowns Module (requires Create) */}
              <Route
                path="breakdowns"
                element={
                  <PermissionRoute requiredPermission="Create">
                    <BreakdownEntry />
                  </PermissionRoute>
                }
              />

              {/* PM Module (requires PreventiveMaintenance) */}
              <Route 
                path="pm"
                element={
                  <PermissionRoute requiredPermission="PreventiveMaintenance">
                    <PMIndex />
                  </PermissionRoute>
                }
              />

              {/* Reports Module */}
              <Route 
                path="reports"
                element={
                  <PermissionRoute requiredPermission="Reports">
                    <Reports />
                  </PermissionRoute>
                }
              />

              {/* Machine Master (requires Masters) */}
              <Route
                path="machines"
                element={
                  <PermissionRoute requiredPermission="Masters">
                    <MachineMaster />
                  </PermissionRoute>
                }
              />

              {/* Audit Logs / Approvals (requires Approve) */}
              <Route
                path="audit"
                element={
                  <PermissionRoute requiredPermission="Approve">
                    <AdminApproval />
                  </PermissionRoute>
                }
              />

              {/* User Management (requires Users) */}
              <Route
                path="users"
                element={
                  <PermissionRoute requiredPermission="Users">
                    <UserManagement />
                  </PermissionRoute>
                }
              />

              {/* Settings placeholder (requires Masters) */}
              <Route
                path="settings"
                element={
                  <PermissionRoute requiredPermission="Masters">
                    <div className="glass-panel p-8 rounded-2xl border-white/5 animate-fade-in">
                      <h2 className="text-xl font-bold font-display text-gray-100 mb-2">Configuration Settings</h2>
                      <p className="text-xs text-gray-400 mb-6">Configure system preferences, time ranges, and automated shifts.</p>
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-16 text-center text-gray-500 text-xs font-mono">
                        [System Settings Configuration Module - Success. Active]
                      </div>
                    </div>
                  </PermissionRoute>
                }
              />
            </Route>

            {/* Catch-all Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
