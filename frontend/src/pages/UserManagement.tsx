import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users, UserPlus, Trash2, ShieldCheck, ShieldAlert, Edit2, X, Save, Eye, EyeOff
} from 'lucide-react';

interface UserRecord {
  id?: string;
  name: string;
  email: string;
  level: string;
  permissions?: any;
}

const ROLES = [
  { value: 'superadmin', label: 'Super Admin',  color: 'bg-red-500/10 border-red-500/20 text-red-400' },
  { value: 'admin',      label: 'Admin',         color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  { value: 'manager',    label: 'Manager',       color: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
  { value: 'supervisor', label: 'Supervisor',    color: 'bg-sky-500/10 border-sky-500/20 text-sky-400' },
  { value: 'technician', label: 'Technician',    color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  { value: 'viewer',     label: 'Viewer',        color: 'bg-slate-800 border-slate-700 text-slate-400' },
];

const MODULES = [
  'Dashboard',
  'Breakdown',
  'Preventive Maintenance',
  'Planning',
  'Corrective Maintenance',
  'Approval Queue',
  'Reports',
  'Analytics',
  'Inventory',
  'Master Setup',
  'Administration',
  'Mobile API',
  'User Management'
];

const ACTIONS = [
  'View',
  'Create',
  'Edit',
  'Delete',
  'Approve',
  'Export',
  'Import'
];

const getRoleStyle = (level: string) =>
  ROLES.find(r => r.value === level)?.color || 'bg-slate-800 border-slate-700 text-slate-400';

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [level, setLevel] = useState('technician');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editLevel, setEditLevel] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPermissions, setEditPermissions] = useState<Record<string, string[]>>({});
  const [isEditSaving, setIsEditSaving] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/users');
      if (res.data?.success && res.data?.data?.users) {
        setUsers(res.data.data.users);
      }
    } catch {
      setError('Unable to load user accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const showMsg = (msg: string, isError = false) => {
    if (isError) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(null); setSuccess(null); }, 4000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !level) {
      showMsg('All fields are required.', true); return;
    }
    if (password.length < 6) {
      showMsg('Password must be at least 6 characters.', true); return;
    }
    setIsSubmitting(true);
    try {
      // Default initial permission presets for role
      const defaultPerms: Record<string, string[]> = {};
      if (level === 'superadmin') {
        MODULES.forEach(m => defaultPerms[m] = ACTIONS);
      } else if (level === 'admin') {
        MODULES.forEach(m => {
          if (m !== 'User Management') defaultPerms[m] = ACTIONS;
        });
      } else if (level === 'technician') {
        defaultPerms['Dashboard'] = ['View'];
        defaultPerms['Breakdown'] = ['View', 'Create'];
        defaultPerms['Preventive Maintenance'] = ['View'];
      } else {
        defaultPerms['Dashboard'] = ['View'];
        defaultPerms['Preventive Maintenance'] = ['View'];
      }

      await api.post('/auth/register', { 
        name, 
        email, 
        password, 
        level, 
        plantCode: 'PUNE',
        permissions: defaultPerms
      });
      showMsg(`User "${name}" created successfully.`);
      setName(''); setEmail(''); setPassword(''); setLevel('technician');
      fetchUsers();
    } catch (err: any) {
      showMsg(err.response?.data?.message || 'Failed to create user.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (u: UserRecord) => {
    setEditUser(u);
    setEditName(u.name);
    setEditLevel(u.level);
    setEditPassword('');
    setEditPermissions(u.permissions || {});
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setIsEditSaving(true);
    try {
      const payload: any = { 
        name: editName, 
        level: editLevel,
        permissions: editPermissions
      };
      if (editPassword.trim().length >= 6) payload.password = editPassword;
      else if (editPassword.trim().length > 0 && editPassword.trim().length < 6) {
        showMsg('New password must be at least 6 characters.', true);
        setIsEditSaving(false); return;
      }
      await api.put(`/users/${editUser.email}`, payload);
      showMsg(`User "${editName}" updated successfully.`);
      setEditUser(null);
      fetchUsers();
    } catch (err: any) {
      showMsg(err.response?.data?.message || 'Failed to update user.', true);
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!window.confirm(`Permanently delete user "${email}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${email}`);
      showMsg('User removed.');
      fetchUsers();
    } catch {
      showMsg('Failed to remove user.', true);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Users size={18} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-100">User Management</h1>
            <p className="text-xs text-gray-500">Manage user accounts and role assignments</p>
          </div>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono">
          {users.length} accounts
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
          <ShieldAlert size={15} /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm">
          <ShieldCheck size={15} /> {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create User Form */}
        <div className="glass-panel p-5 rounded-xl lg:col-span-1">
          <h2 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2">
            <UserPlus size={15} className="text-cyan-400" /> Add New User
          </h2>
          <form onSubmit={handleCreateUser} className="space-y-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Full Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Full name" required
                className="glass-input px-3 py-2.5 w-full rounded-lg text-xs text-gray-200" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="user@parksons.com" required
                className="glass-input px-3 py-2.5 w-full rounded-lg text-xs text-gray-200" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Password *</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters" required
                  className="glass-input px-3 py-2.5 w-full rounded-lg text-xs text-gray-200 pr-9" />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer">
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Role *</label>
              <select value={level} onChange={e => setLevel(e.target.value)}
                className="glass-input px-3 py-2.5 w-full rounded-lg text-xs text-gray-200 cursor-pointer">
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <p className="text-[9px] text-gray-500 mt-1">
                {level === 'technician' && 'Can view Dashboard, enter Breakdowns, execute PM tasks'}
                {level === 'supervisor' && 'Technician access + can approve breakdown entries'}
                {level === 'manager' && 'Can view Dashboard, Reports, approve entries'}
                {level === 'admin' && 'Full access except User Management'}
                {level === 'superadmin' && 'Complete system access including all settings'}
                {level === 'viewer' && 'Read-only access to Dashboard and Reports'}
              </p>
            </div>
            <button type="submit" disabled={isSubmitting}
              className="w-full py-2.5 text-xs font-semibold text-white glow-btn-primary rounded-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
              {isSubmitting
                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <UserPlus size={13} />}
              Create User
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="glass-panel rounded-xl overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-200">All User Accounts</h2>
            <span className="text-[10px] text-gray-500 font-mono">Click Edit to change role, password or permissions</span>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-500 text-sm">
              <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-900/30 text-[10px] uppercase tracking-wider text-gray-400">
                    <th className="py-3 px-5 text-left">Name</th>
                    <th className="py-3 px-4 text-left">Email</th>
                    <th className="py-3 px-4 text-left">Role</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const isProtected = u.email === currentUser?.email || u.email === 'yogeshkp85@gmail.com';
                    return (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                        <td className="py-3 px-5 font-semibold text-gray-200">{u.name}</td>
                        <td className="py-3 px-4 font-mono text-gray-400 text-[11px]">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getRoleStyle(u.level)}`}>
                            {ROLES.find(r => r.value === u.level)?.label || u.level.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isProtected ? (
                              <>
                                <button onClick={() => openEdit(u)}
                                  className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded cursor-pointer transition-colors"
                                  title="Edit user">
                                  <Edit2 size={12} />
                                </button>
                                <button onClick={() => handleDeleteUser(u.email)}
                                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded cursor-pointer transition-colors"
                                  title="Delete user">
                                  <Trash2 size={12} />
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-gray-600 font-mono italic">Protected</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                <Edit2 size={14} className="text-emerald-400" /> Edit User & Permissions
              </h3>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-200 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Basics */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Email (read-only)</label>
                  <div className="glass-input px-3 py-2 rounded-lg text-xs text-gray-500 font-mono">{editUser.email}</div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                    className="glass-input px-3 py-2 w-full rounded-lg text-xs text-gray-200" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Role</label>
                  <select value={editLevel} onChange={e => setEditLevel(e.target.value)}
                    className="glass-input px-3 py-2 w-full rounded-lg text-xs text-gray-200 cursor-pointer bg-[#0f172a]">
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    New Password <span className="text-gray-600 font-normal normal-case">(leave blank to keep current)</span>
                  </label>
                  <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)}
                    placeholder="Enter new password or leave blank"
                    className="glass-input px-3 py-2 w-full rounded-lg text-xs text-gray-200" />
                </div>
              </div>

              {/* Granular Module Permissions */}
              <div className="flex flex-col">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Module-Level Access Control</label>
                <div className="flex-1 max-h-80 overflow-y-auto border border-white/5 rounded-lg custom-scrollbar">
                  <table className="w-full text-[10px] text-left">
                    <thead>
                      <tr className="bg-slate-900/50 text-gray-400 sticky top-0 backdrop-blur">
                        <th className="p-2 font-semibold">Module</th>
                        {ACTIONS.map(act => <th key={act} className="p-2 font-semibold text-center">{act}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {MODULES.map(mod => {
                        const modulePerms = editPermissions[mod] || [];
                        return (
                          <tr key={mod} className="hover:bg-white/[0.01]">
                            <td className="p-2 font-medium text-gray-300">{mod}</td>
                            {ACTIONS.map(act => {
                              const isChecked = modulePerms.includes(act);
                              return (
                                <td key={act} className="p-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={e => {
                                      let updatedActions = [...modulePerms];
                                      if (e.target.checked) {
                                        updatedActions.push(act);
                                      } else {
                                        updatedActions = updatedActions.filter(a => a !== act);
                                      }
                                      setEditPermissions({
                                        ...editPermissions,
                                        [mod]: updatedActions
                                      });
                                    }}
                                    className="w-3.5 h-3.5 rounded bg-gray-800 border-gray-600 text-cyan-500 focus:ring-0 cursor-pointer"
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-white/5">
              <button onClick={() => setEditUser(null)}
                className="flex-1 py-2 text-xs text-gray-400 border border-white/10 rounded-lg cursor-pointer hover:text-gray-200">
                Cancel
              </button>
              <button onClick={handleEditSave} disabled={isEditSaving}
                className="flex-1 py-2 text-xs font-semibold text-white glow-btn-primary rounded-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                {isEditSaving
                  ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Save size={12} />}
                Save Changes & Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
