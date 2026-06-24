import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User as UserIcon,
  ShieldAlert
} from 'lucide-react';

interface UserRecord {
  name: string;
  email: string;
  level: string;
}

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [level, setLevel] = useState('supervisor');

  // UX states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/users');
      if (res.data?.success && res.data?.data?.users) {
        setUsers(res.data.data.users);
      }
    } catch (err: any) {
      console.error('Failed to load user list', err);
      setError('Unable to load user accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !email || !password || !level) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/users/create', {
        name,
        email,
        password,
        level
      });

      if (res.data?.success) {
        setSuccess(`User ${email} created successfully.`);
        setName('');
        setEmail('');
        setPassword('');
        setLevel('supervisor');
        fetchUsers();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create user account.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (emailToDelete: string) => {
    if (emailToDelete === currentUser?.email) {
      setError('Cannot delete your own active session account.');
      return;
    }
    if (emailToDelete === 'yogeshkp85@gmail.com') {
      setError('Cannot delete the root super admin.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${emailToDelete}?`)) {
      return;
    }

    setError(null);
    setSuccess(null);
    try {
      const res = await api.delete(`/users/${emailToDelete}`);
      if (res.data?.success) {
        setSuccess(`User account deleted.`);
        fetchUsers();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete user account.';
      setError(msg);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-bold font-display text-gray-100 flex items-center gap-2">
            <Users size={22} className="text-emerald-500" />
            <span>User Accounts Console</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">Manage corporate personnel accounts, level access roles, and security details.</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono">
          System Registry: {users.length} profiles
        </div>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-xs animate-fade-in">
          <ShieldCheck size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-xs animate-fade-in">
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Forms & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create User Form */}
        <div className="glass-panel p-6 rounded-2xl border-white/5 h-fit shadow-lg">
          <h3 className="text-sm font-bold font-display text-gray-200 mb-5 flex items-center gap-2">
            <UserPlus size={16} className="text-emerald-400" />
            <span>Create New User</span>
          </h3>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <UserIcon size={14} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Employee Name"
                  className="glass-input pl-9 pr-3 py-2.5 block w-full rounded-lg text-xs text-gray-200 placeholder-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Mail size={14} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@parksons.com"
                  className="glass-input pl-9 pr-3 py-2.5 block w-full rounded-lg text-xs text-gray-200 placeholder-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Lock size={14} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="glass-input pl-9 pr-3 py-2.5 block w-full rounded-lg text-xs text-gray-200 placeholder-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Access Level Role *
              </label>
              <select
                required
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="glass-input px-3 py-2.5 block w-full rounded-lg text-xs text-gray-200 appearance-none bg-slate-950 cursor-pointer"
              >
                <option value="superadmin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="supervisor">Supervisor</option>
                <option value="technician">Technician</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg text-xs font-semibold text-white glow-btn-primary cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Provisioning...' : 'Add Account'}
            </button>
          </form>
        </div>

        {/* User List Table */}
        <div className="glass-panel rounded-2xl border-white/5 lg:col-span-2 overflow-hidden flex flex-col min-h-[350px] shadow-lg">
          <div className="px-6 py-4 border-b border-white/5 bg-[#0f172a]/10">
            <h3 className="text-xs font-bold font-display text-gray-300 uppercase tracking-wider">
              System Accounts Index
            </h3>
          </div>

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-xs text-gray-500 font-mono">Loading user registry list...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0f172a]/20 text-gray-400 font-semibold text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-6">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role / Access Level</th>
                    <th className="py-3 px-6 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => (
                    <tr key={u.email} className="hover:bg-white/2 transition-colors">
                      <td className="py-3 px-6 font-semibold text-gray-200">{u.name}</td>
                      <td className="py-3 px-4 font-mono text-gray-400">{u.email}</td>
                      <td className="py-3 px-4 text-xs font-semibold">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] border ${
                          u.level === 'superadmin' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                          u.level === 'admin' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                          u.level === 'supervisor' ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' :
                          u.level === 'manager' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                          u.level === 'technician' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          'bg-slate-800 border-slate-700 text-slate-400'
                        }`}>
                          {u.level.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        {u.email !== currentUser?.email && u.email !== 'yogeshkp85@gmail.com' ? (
                          <button
                            onClick={() => handleDeleteUser(u.email)}
                            className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-600 font-mono italic">Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
