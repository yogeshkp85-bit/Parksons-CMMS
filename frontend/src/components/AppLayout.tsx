import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  LayoutDashboard, 
  Wrench, 
  CalendarDays, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  User, 
  FileText,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, permissions, logout } = useAuth();
  const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mastersOpen, setMastersOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to logout', err);
    }
  };

  // Define sidebar navigation links and their required permission codes
  const navigationItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: <LayoutDashboard size={18} />, 
      permission: 'Dashboard' 
    },
    { 
      name: 'Breakdown Entry', 
      path: '/breakdowns', 
      icon: <Wrench size={18} />, 
      permission: 'Create' 
    },
    { 
      name: 'Approval Queue', 
      path: '/audit', 
      icon: <FileText size={18} />, 
      permission: 'Approve' 
    },
    { 
      name: 'Reports', 
      path: '/reports', 
      icon: <FileText size={18} />, 
      permission: 'Reports' 
    },
    { 
      name: 'Preventive Maint.', 
      path: '/pm', 
      icon: <CalendarDays size={18} />, 
      permission: 'PreventiveMaintenance' 
    },
    { 
      name: 'User Management', 
      path: '/users', 
      icon: <User size={18} />, 
      permission: 'Users' 
    },
    { 
      name: 'Settings', 
      path: '/settings', 
      icon: <Settings size={18} />, 
      permission: 'Masters' 
    }
  ];

  // Filter links: user must be Super Admin (bypasses all) OR have the permission code
  const isSuperAdmin = user?.role?.code === 'superadmin' || user?.role?.code === 'SUPER_ADMIN';
  const visibleNavItems = navigationItems.filter(item => 
    isSuperAdmin || permissions.includes(item.permission)
  );

  // Helper to determine active path
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNotificationClick = async (notif: any) => {
    await markAsRead(notif.id);
    setNotificationsOpen(false);
    if (notif.type === 'BREAKDOWN_CREATED') {
      navigate('/audit');
    } else {
      navigate('/breakdowns');
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const now = new Date();
      const past = new Date(isoString);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return past.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex text-gray-100 font-sans">
      
      {/* 1. Mobile Sidebar Backdrop Overlay */}
      {!sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(true)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden cursor-pointer"
        />
      )}

      {/* 2. Sidebar Navigation Panel */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 glass-panel border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        {/* Sidebar Header Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#0f172a]/20">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.68-.34-1.44-.06-1.78.62L7.5 18.62a2.25 2.25 0 11-4.02-2.02l1.06-2.1c.3-.6.18-1.34-.3-1.8l-1.61-1.62a2.25 2.25 0 113.18-3.18l1.62 1.61c.47.47 1.2.6 1.8.3l2.1-1.06a2.25 2.25 0 112.02 4.02l-2.16 1.08c-.68.34-.96 1.1-.62 1.78l1.08 2.16a2.25 2.25 0 11-4.02 2.02l-1.08-2.16z" />
              </svg>
            </div>
            <span className="font-extrabold font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              PARKSONS CMMS
            </span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400 hover:text-gray-200 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md shadow-emerald-950/20 font-semibold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className={isActive(item.path) ? 'text-emerald-400' : 'text-gray-400'}>
                {item.icon}
              </span>
              {item.name}
            </Link>
          ))}

          {/* Master Setup Grouped Collapsible Menus */}
          {(isSuperAdmin || permissions.includes('Masters')) && (
            <div className="space-y-1 pt-2">
              <button
                type="button"
                onClick={() => setMastersOpen(!mastersOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">
                    <Settings size={18} />
                  </span>
                  <span>Master Setup</span>
                </div>
                {mastersOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              
              {mastersOpen && (
                <div className="pl-6 space-y-3.5 mt-1.5 border-l border-white/5 ml-6">
                  {/* Organization Group */}
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold px-2">Organization</p>
                    <Link to="/mdm/mst_plant" className={`block px-2 py-1 text-xs rounded transition-colors ${isActive('/mdm/mst_plant') ? 'text-emerald-400 font-semibold bg-emerald-500/5' : 'text-gray-400 hover:text-gray-200'}`}>Plant Master</Link>
                    <Link to="/mdm/mst_department" className={`block px-2 py-1 text-xs rounded transition-colors ${isActive('/mdm/mst_department') ? 'text-emerald-400 font-semibold bg-emerald-500/5' : 'text-gray-400 hover:text-gray-200'}`}>Department Master</Link>
                    <Link to="/machines" className={`block px-2 py-1 text-xs rounded transition-colors ${isActive('/machines') ? 'text-emerald-400 font-semibold bg-emerald-500/5' : 'text-gray-400 hover:text-gray-200'}`}>Section Master</Link>
                  </div>
                  
                  {/* Machine Config Group */}
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold px-2">Machine Config</p>
                    <Link to="/mdm/mst_machine_type" className={`block px-2 py-1 text-xs rounded transition-colors ${isActive('/mdm/mst_machine_type') ? 'text-emerald-400 font-semibold bg-emerald-500/5' : 'text-gray-400 hover:text-gray-200'}`}>Machine Type</Link>
                    <Link to="/mdm/mst_machine" className={`block px-2 py-1 text-xs rounded transition-colors ${isActive('/mdm/mst_machine') ? 'text-emerald-400 font-semibold bg-emerald-500/5' : 'text-gray-400 hover:text-gray-200'}`}>Machine Master</Link>
                    <Link to="/mdm/mst_machine_unit" className={`block px-2 py-1 text-xs rounded transition-colors ${isActive('/mdm/mst_machine_unit') ? 'text-emerald-400 font-semibold bg-emerald-500/5' : 'text-gray-400 hover:text-gray-200'}`}>Machine Unit</Link>
                  </div>

                  {/* Maintenance Config Group */}
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold px-2">Maintenance</p>
                    <Link to="/mdm/mst_problem_type" className={`block px-2 py-1 text-xs rounded transition-colors ${isActive('/mdm/mst_problem_type') ? 'text-emerald-400 font-semibold bg-emerald-500/5' : 'text-gray-400 hover:text-gray-200'}`}>Problem Type</Link>
                    <Link to="/mdm/mst_wo_category" className={`block px-2 py-1 text-xs rounded transition-colors ${isActive('/mdm/mst_wo_category') ? 'text-emerald-400 font-semibold bg-emerald-500/5' : 'text-gray-400 hover:text-gray-200'}`}>WO Category</Link>
                    <Link to="/mdm/mst_status" className={`block px-2 py-1 text-xs rounded transition-colors ${isActive('/mdm/mst_status') ? 'text-emerald-400 font-semibold bg-emerald-500/5' : 'text-gray-400 hover:text-gray-200'}`}>Status Master</Link>
                    <Link to="/mdm/mst_priority" className={`block px-2 py-1 text-xs rounded transition-colors ${isActive('/mdm/mst_priority') ? 'text-emerald-400 font-semibold bg-emerald-500/5' : 'text-gray-400 hover:text-gray-200'}`}>Priority Master</Link>
                  </div>

                  {/* Administration Group */}
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold px-2">Administration</p>
                    <Link to="/mdm/mst_employee" className={`block px-2 py-1 text-xs rounded transition-colors ${isActive('/mdm/mst_employee') ? 'text-emerald-400 font-semibold bg-emerald-500/5' : 'text-gray-400 hover:text-gray-200'}`}>Employee Master</Link>
                    <Link to="/mdm/mst_shift" className={`block px-2 py-1 text-xs rounded transition-colors ${isActive('/mdm/mst_shift') ? 'text-emerald-400 font-semibold bg-emerald-500/5' : 'text-gray-400 hover:text-gray-200'}`}>Shift Master</Link>
                  </div>

                  {/* ── Additional Masters — existing DB models ── */}
                  <div className="space-y-1 mt-2 pt-2 border-t border-white/5">
                    <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold px-2">Additional Masters</p>
                    <Link to="/masters" className={`block px-2 py-1 text-xs rounded transition-colors ${isActive('/masters') ? 'text-emerald-400 font-semibold bg-emerald-500/5' : 'text-gray-400 hover:text-gray-200'}`}>Technicians &amp; Shifts</Link>
                    <Link to="/masters" className={`block px-2 py-1 text-xs rounded transition-colors ${isActive('/masters') ? 'text-emerald-400 font-semibold bg-emerald-500/5' : 'text-gray-400 hover:text-gray-200'}`}>Financial Years</Link>
                    <Link to="/masters" className={`block px-2 py-1 text-xs rounded transition-colors ${isActive('/masters') ? 'text-emerald-400 font-semibold bg-emerald-500/5' : 'text-gray-400 hover:text-gray-200'}`}>Categories &amp; PM Freq</Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-white/5 bg-[#0b0f19]/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <User size={16} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-gray-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-400 font-mono truncate">{user?.role?.name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-white/5 hover:border-red-500/20 bg-white/3 hover:bg-red-500/5 text-gray-400 hover:text-red-400 text-xs font-medium transition-all cursor-pointer"
          >
            <LogOut size={14} />
            Logout Session
          </button>
        </div>
      </aside>

      {/* 3. Main Work Area Container */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        
        {/* Top Header Navbar */}
        <header className="h-16 border-b border-white/5 glass-panel sticky top-0 z-30 flex items-center justify-between px-6 bg-[#090d16]/80">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-gray-200 cursor-pointer lg:hidden"
            >
              <Menu size={22} />
            </button>
            
            {/* Dynamic Breadcrumbs / Header Location Info */}
            <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-gray-400">
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-emerald-500" />
                <span>Plant: Daman Assembly</span>
                <span className="text-white/20">/</span>
                <span className="text-emerald-400 font-semibold">{user?.role?.name} Interface</span>
              </div>
              <div className="flex items-center gap-1.5 border-l border-white/10 pl-4">
                {isConnected ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Offline
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileDropdownOpen(false);
                }}
                className="p-2 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-lg relative cursor-pointer"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 
                    text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-md shadow-red-500/30">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 glass-panel border-white/10 rounded-xl shadow-xl z-20 overflow-hidden animate-fade-in">
                    <div className="px-4 py-3 border-b border-white/5 bg-[#0f172a]/20 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-200">Alert Notification Hub</span>
                      {unreadCount > 0 && (
                        <span 
                          onClick={markAllAsRead}
                          className="text-[10px] text-emerald-400 font-semibold cursor-pointer hover:underline"
                        >
                          Mark all read
                        </span>
                      )}
                    </div>
                    <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-500">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((notif) => (
                          <div 
                            key={notif.id} 
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-4 hover:bg-white/3 transition-colors cursor-pointer flex gap-3 ${
                              !notif.read ? 'bg-emerald-500/[0.02]' : ''
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {notif.type === 'BREAKDOWN_CREATED' && (
                                <AlertTriangle size={15} className="text-amber-500" />
                              )}
                              {notif.type === 'BREAKDOWN_APPROVED' && (
                                <CheckCircle2 size={15} className="text-emerald-500" />
                              )}
                              {notif.type === 'BREAKDOWN_REJECTED' && (
                                <XCircle size={15} className="text-red-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs ${!notif.read ? 'text-gray-100 font-semibold' : 'text-gray-400'}`}>
                                {notif.message}
                              </p>
                              {notif.remarks && (
                                <p className="text-[11px] text-gray-500 italic mt-1 bg-white/2 p-1.5 rounded border border-white/5">
                                  Remarks: {notif.remarks}
                                </p>
                              )}
                              <span className="text-[10px] text-gray-500 font-mono mt-1 block">
                                {formatRelativeTime(notif.timestamp)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown Menu */}
            <div className="relative">
              <button 
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-semibold">
                  {user?.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="hidden md:inline text-xs font-semibold text-gray-300">
                  {user?.name}
                </span>
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 glass-panel border-white/10 rounded-xl shadow-xl z-20 py-2 animate-fade-in text-xs">
                    <div className="px-4 py-2.5 border-b border-white/5 bg-[#0f172a]/10">
                      <p className="font-semibold text-gray-200">{user?.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono truncate">{user?.email}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <div className="px-2 py-1.5 text-gray-400 flex items-center gap-2">
                        <MapPin size={13} className="text-cyan-400" />
                        <span>Daman Plant Location</span>
                      </div>
                      <div className="px-2 py-1.5 text-gray-400 flex items-center gap-2">
                        <Settings size={13} className="text-cyan-400" />
                        <span>Permission Nodes: {permissions.length}</span>
                      </div>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-2 py-2 text-red-400 hover:bg-red-500/5 hover:text-red-300 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut size={13} />
                        <span>Close Console</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Outlet View */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
};
