import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { User, Mail, Lock, Phone, MapPin, Briefcase, AlertTriangle, ShieldCheck } from 'lucide-react';

interface RoleOption {
  id: string;
  name: string;
  code: string;
}

interface PlantOption {
  id: string;
  name: string;
  code: string;
}

export const Register: React.FC = () => {
  
  // Master data state
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [plants, setPlants] = useState<PlantOption[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  
  // Form input state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [plantId, setPlantId] = useState('');
  
  // UX states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch roles and plants on load
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await api.get('/auth/register-metadata');
        if (res.data?.data) {
          const { roles: roleList, plants: plantList } = res.data.data;
          
          // Filter out SUPER_ADMIN for public registrations if appropriate, 
          // but we will keep all standard roles. We'll pre-select standard Viewer/Technician roles.
          setRoles(roleList);
          setPlants(plantList);
          
          // Preselect Technician/Viewer role and Daman plant
          const defaultRole = roleList.find((r: any) => r.code === 'TECHNICIAN') || roleList[0];
          if (defaultRole) setRoleId(defaultRole.id);
          
          const defaultPlant = plantList.find((p: any) => p.code === 'DAMAN') || plantList[0];
          if (defaultPlant) setPlantId(defaultPlant.id);
        }
      } catch (err) {
        console.error('Failed to load registration metadata', err);
        setError('Failed to contact server to retrieve role and plant options.');
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend validations
    if (!name || !email || !password || !roleId) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/register', {
        name,
        email,
        password,
        phone: phone || undefined,
        roleId,
        plantId: plantId || undefined
      });
      setSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to complete registration. Try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#060810] bg-radial-at-t from-[#0d222b] via-[#060810] to-[#05060b] flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fade-in">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
          <div className="glass-panel py-8 px-6 sm:px-10 rounded-2xl border-emerald-500/20 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto mb-6">
              <ShieldCheck size={40} />
            </div>
            
            <h2 className="text-2xl font-bold font-display text-gray-100 mb-2">
              Registration Complete
            </h2>
            
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Your account <strong>{email}</strong> has been registered successfully. You can now use your credentials to sign in.
            </p>
            
            <Link
              to="/login"
              className="w-full inline-flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white glow-btn-primary"
            >
              Sign In Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060810] bg-radial-at-t from-[#0d222b] via-[#060810] to-[#05060b] flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-extrabold tracking-tight font-display text-gray-100 glow-text">
          PARKSONS CMMS
        </h2>
        <p className="mt-2 text-sm text-gray-400 font-sans">
          Create Employee Access Request
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="glass-panel py-8 px-6 sm:px-10 rounded-2xl border-white/5 shadow-2xl relative">
          <h3 className="text-xl font-bold font-display text-gray-200 mb-6">
            Register Account
          </h3>

          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-start gap-2.5 text-xs animate-fade-in">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isLoadingMetadata ? (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-xs text-gray-500 font-mono">Loading plant/role options...</p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <User size={15} />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="glass-input pl-9 pr-3 py-2 block w-full rounded-lg text-xs text-gray-200 placeholder-gray-600"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Mail size={15} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john.doe@parksons.com"
                      className="glass-input pl-9 pr-3 py-2 block w-full rounded-lg text-xs text-gray-200 placeholder-gray-600"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone Number */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Phone (Optional)
                  </label>
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Phone size={15} />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="glass-input pl-9 pr-3 py-2 block w-full rounded-lg text-xs text-gray-200 placeholder-gray-600"
                    />
                  </div>
                </div>

                {/* Plant Selection */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Plant Location *
                  </label>
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <MapPin size={15} />
                    </div>
                    <select
                      value={plantId}
                      onChange={(e) => setPlantId(e.target.value)}
                      className="glass-input pl-9 pr-8 py-2 block w-full rounded-lg text-xs text-gray-200 appearance-none bg-transparent cursor-pointer"
                    >
                      <option value="" disabled className="bg-slate-900 text-gray-400">Select Plant Location</option>
                      {plants.map((plant) => (
                        <option key={plant.id} value={plant.id} className="bg-slate-900 text-gray-200">
                          {plant.name} ({plant.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Requested Role *
                </label>
                <div className="relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Briefcase size={15} />
                  </div>
                  <select
                    required
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="glass-input pl-9 pr-8 py-2 block w-full rounded-lg text-xs text-gray-200 appearance-none bg-transparent cursor-pointer"
                  >
                    <option value="" disabled className="bg-slate-900 text-gray-400">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id} className="bg-slate-900 text-gray-200">
                        {role.name} ({role.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Password *
                  </label>
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock size={15} />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="glass-input pl-9 pr-3 py-2 block w-full rounded-lg text-xs text-gray-200 placeholder-gray-600"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock size={15} />
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="glass-input pl-9 pr-3 py-2 block w-full rounded-lg text-xs text-gray-200 placeholder-gray-600"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white glow-btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 border-t border-white/5 pt-6 text-center">
            <p className="text-xs text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
