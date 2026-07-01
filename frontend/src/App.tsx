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
import { DynamicMDM } from './pages/masters/DynamicMDM';
import MasterSetup from './pages/masters/MasterSetup';
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

              {/* Dynamic MDM Masters — handles mst_* tables (Plant, Dept, MachineType, etc.) */}
              <Route
                path="mdm/:tableName"
                element={
                  <PermissionRoute requiredPermission="Masters">
                    <DynamicMDM />
                  </PermissionRoute>
                }
              />

              {/* Master Setup — handles existing DB models (Technicians, Shifts, FY, Categories, PM Freq) */}
              <Route
                path="masters"
                element={
                  <PermissionRoute requiredPermission="Masters">
                    <MasterSetup />
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

              {/* Settings — system info + quick links */}
              <Route
                path="settings"
                element={
                  <PermissionRoute requiredPermission="Masters">
                    <div className="space-y-6 animate-fade-in">
                      <div>
                        <h2 className="text-xl font-bold text-gray-100">System Settings</h2>
                        <p className="text-xs text-gray-500 mt-1">Application configuration and system information</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="glass-panel p-5 rounded-xl space-y-3">
                          <h3 className="text-sm font-bold text-gray-200">Quick Links</h3>
                          <p className="text-xs text-gray-400">Configure machines, departments and machine types:</p>
                          <a href="/mdm/mst_plant" className="block text-xs text-emerald-400 hover:text-emerald-300">→ Plant Master (MDM)</a>
                          <a href="/mdm/mst_department" className="block text-xs text-emerald-400 hover:text-emerald-300">→ Department Master (MDM)</a>
                          <a href="/mdm/mst_machine_type" className="block text-xs text-emerald-400 hover:text-emerald-300">→ Machine Type (MDM)</a>
                          <a href="/masters" className="block text-xs text-emerald-400 hover:text-emerald-300">→ Technicians, Shifts, Financial Years</a>
                          <a href="/users" className="block text-xs text-emerald-400 hover:text-emerald-300">→ User Management</a>
                        </div>
                        <div className="glass-panel p-5 rounded-xl space-y-3">
                          <h3 className="text-sm font-bold text-gray-200">System Information</h3>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between"><span className="text-gray-500">Application</span><span className="text-gray-300 font-mono">Parksons CMMS</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Version</span><span className="text-gray-300 font-mono">Phase 2.0 — MDM</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Backend</span><span className="text-gray-300 font-mono">Node.js + PostgreSQL</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Plant</span><span className="text-gray-300 font-mono">Pune (Primary)</span></div>
                          </div>
                        </div>
                        <div className="glass-panel p-5 rounded-xl space-y-3 md:col-span-2">
                          <h3 className="text-sm font-bold text-gray-200">Email Report Configuration</h3>
                          <p className="text-xs text-gray-400">Daily 9AM maintenance summary email is configured in the backend <code className="text-emerald-400 bg-slate-900 px-1 rounded">.env</code> file.</p>
                          <div className="text-xs text-gray-500 space-y-1 font-mono bg-slate-900/50 p-3 rounded-lg">
                            <div>SMTP_HOST=smtp.gmail.com</div>
                            <div>SMTP_PORT=587</div>
                            <div>SMTP_USER=yogeshkp85@gmail.com</div>
                            <div>REPORT_EMAILS=yogeshkp85@gmail.com,engg.cn@parksonspackaging.com</div>
                            <div>SYNC_INTERVAL_HOURS=4</div>
                          </div>
                          <p className="text-xs text-gray-500">Contact IT admin to update SMTP credentials or recipient list in the .env file.</p>
                        </div>
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
