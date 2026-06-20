import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PermissionRoute } from './components/PermissionRoute';
import { AppLayout } from './components/AppLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { BreakdownEntry } from './pages/BreakdownEntry';
import { AdminApproval } from './pages/AdminApproval';
import { ShieldAlert } from 'lucide-react';

// Stub components for future modules to verify routing and permissions
const PmPlaceholder: React.FC = () => (
  <div className="glass-panel p-8 rounded-2xl border-white/5 animate-fade-in">
    <h2 className="text-xl font-bold font-display text-gray-100 mb-2">Preventive Maintenance Schedules</h2>
    <p className="text-xs text-gray-400 mb-6">Manage recurring PM schedules, frequency intervals, and task execution lists.</p>
    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-16 text-center text-gray-500 text-xs font-mono">
      [PM Schedules Module - Component Loaded successfully. Integration coming in Phase 5]
    </div>
  </div>
);

const MachinePlaceholder: React.FC = () => (
  <div className="glass-panel p-8 rounded-2xl border-white/5 animate-fade-in">
    <h2 className="text-xl font-bold font-display text-gray-100 mb-2">Machine Master Configuration</h2>
    <p className="text-xs text-gray-400 mb-6">Add machinery details, sub-assemblies, category filters, and print QR codes.</p>
    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-16 text-center text-gray-500 text-xs font-mono">
      [Machine Master Module - Component Loaded successfully. Master listings active]
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
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Secure App Shell Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard (requires DASHBOARD_VIEW) */}
            <Route
              index
              element={
                <PermissionRoute requiredPermission="DASHBOARD_VIEW">
                  <Dashboard />
                </PermissionRoute>
              }
            />

            {/* Breakdowns Module (requires BREAKDOWN_VIEW) */}
            <Route
              path="breakdowns"
              element={
                <PermissionRoute requiredPermission="BREAKDOWN_VIEW">
                  <BreakdownEntry />
                </PermissionRoute>
              }
            />

            {/* PM Module (requires PM_VIEW) */}
            <Route
              path="pm"
              element={
                <PermissionRoute requiredPermission="PM_VIEW">
                  <PmPlaceholder />
                </PermissionRoute>
              }
            />

            {/* Machine Master (requires MACHINE_VIEW) */}
            <Route
              path="machines"
              element={
                <PermissionRoute requiredPermission="MACHINE_VIEW">
                  <MachinePlaceholder />
                </PermissionRoute>
              }
            />

            {/* Audit Logs (requires AUDIT_VIEW) */}
            <Route
              path="audit"
              element={
                <PermissionRoute requiredPermission="AUDIT_VIEW">
                  <AdminApproval />
                </PermissionRoute>
              }
            />
          </Route>

          {/* Catch-all Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
