import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, Clock, AlertTriangle, Download, CheckCircle2, X } from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '../../services/api';

export const PMCompliance: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({ departmentId: '', machineId: '', month: '', year: '' });
  const [departments, setDepartments] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);

  // Completion Modal
  const [completingSchedule, setCompletingSchedule] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [completedAt, setCompletedAt] = useState('');

  useEffect(() => {
    fetchReferenceData();
  }, []);

  useEffect(() => {
    fetchCompliance();
  }, [filters]);

  const fetchReferenceData = async () => {
    try {
      const treeRes = await api.get('/v1/mdm/equipment-tree');
      const plants = treeRes.data?.data || [];
      const depts: any[] = [];
      const machs: any[] = [];
      
      plants.forEach((p: any) => {
        p.departments?.forEach((d: any) => {
          depts.push({ id: d.deptId, name: d.deptName });
          d.machineTypes?.forEach((mt: any) => {
            mt.machines?.forEach((m: any) => {
              machs.push({ id: m.machineId, name: m.machineName, departmentId: d.deptId });
            });
          });
        });
      });
      
      setDepartments(depts);
      setMachines(machs);
    } catch (err) {
      console.error('Failed to load reference lists:', err);
    }
  };

  const fetchCompliance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      if (filters.machineId) params.append('machineId', filters.machineId);
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);

      const res = await api.get(`/pm/compliance?${params.toString()}`);
      setData(res.data?.data);
    } catch (err) {
      alert('Failed to load compliance data', 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/pm/schedules/${completingSchedule.id}/complete`, { 
        completionRemarks: remarks,
        completedAt: completedAt ? new Date(completedAt).toISOString() : new Date().toISOString()
      });
      setCompletingSchedule(null);
      setRemarks('');
      setCompletedAt('');
      fetchCompliance();
    } catch (err) {
      alert('Failed to complete PM Schedule');
    }
  };

  const exportCSV = () => {
    if (!data || !data.schedules) return;

    const headers = ['Department', 'Machine', 'Task', 'Due Date', 'Status', 'Completed Date', 'Days Overdue', 'Remarks'];
    const rows = data.schedules.map((s: any) => {
      const dueDate = new Date(s.dueDate);
      const completedDate = s.completedAt ? new Date(s.completedAt) : null;
      let daysOverdue = 0;
      
      if (s.status === 'COMPLETED' && completedDate) {
        if (completedDate > dueDate) {
          daysOverdue = Math.ceil((completedDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      } else if (s.status === 'PENDING') {
        const now = new Date();
        if (now > dueDate) {
          daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      // We don't have department name directly on schedule, so we find it from references
      const m = machines.find(m => m.id === s.machineId);
      const dName = departments.find(d => d.id === m?.departmentId)?.name || 'Unknown';

      return [
        dName,
        s.machine?.name || s.machine?.machineName || 'Unknown',
        s.pmTask?.name || 'General PM',
        dueDate.toLocaleDateString(),
        s.status,
        completedDate ? completedDate.toLocaleDateString() : '',
        daysOverdue,
        s.completionRemarks || ''
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pm_compliance_report_${new Date().getTime()}.csv`;
    link.click();
  };

  const filteredMachines = filters.departmentId 
    ? machines.filter(m => m.departmentId === filters.departmentId)
    : machines;

  if (loading && !data) {
    return <div className="py-20 text-center text-gray-500">Loading compliance analytics...</div>;
  }

  if (!data) {
    return <div className="py-20 text-center text-gray-500">No compliance data available.</div>;
  }

  const doughnutData = {
    labels: ['Completed', 'Pending', 'Overdue'],
    datasets: [
      {
        data: [data.completed, data.pending - data.overdue, data.overdue],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#94a3b8' } }
    },
    cutout: '75%'
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Compliance Analytics</h2>
          <p className="text-sm text-gray-400">Track and monitor Preventive Maintenance execution rates.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="btn-ghost flex items-center gap-2">
            <Download size={16} />
            <span className="hidden md:inline">Export Report</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 rounded-xl border border-white/5 flex flex-wrap gap-4">
        <select 
          value={filters.departmentId} 
          onChange={e => setFilters({ ...filters, departmentId: e.target.value, machineId: '' })}
          className="glass-input px-3 py-2 rounded-lg text-xs text-gray-200 bg-[#0f172a] flex-1 min-w-[150px]"
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        
        <select 
          value={filters.machineId} 
          onChange={e => setFilters({ ...filters, machineId: e.target.value })}
          className="glass-input px-3 py-2 rounded-lg text-xs text-gray-200 bg-[#0f172a] flex-1 min-w-[150px]"
        >
          <option value="">All Machines</option>
          {filteredMachines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>

        <select 
          value={filters.month} 
          onChange={e => setFilters({ ...filters, month: e.target.value })}
          className="glass-input px-3 py-2 rounded-lg text-xs text-gray-200 bg-[#0f172a] w-32"
        >
          <option value="">All Months</option>
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
          ))}
        </select>

        <select 
          value={filters.year} 
          onChange={e => setFilters({ ...filters, year: e.target.value })}
          className="glass-input px-3 py-2 rounded-lg text-xs text-gray-200 bg-[#0f172a] w-32"
        >
          <option value="">All Years</option>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-500" />
          <div className="flex justify-between items-start">
            <div>
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Scheduled</span>
              <h3 className="text-3xl font-bold font-display text-white mt-1">{data.totalScheduled}</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Activity size={16} />
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />
          <div className="flex justify-between items-start">
            <div>
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Completed</span>
              <h3 className="text-3xl font-bold font-display text-emerald-400 mt-1">{data.completed}</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle size={16} />
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-rose-500" />
          <div className="flex justify-between items-start">
            <div>
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Overdue</span>
              <h3 className="text-3xl font-bold font-display text-rose-400 mt-1">{data.overdue}</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
              <AlertTriangle size={16} />
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500" />
          <div className="flex justify-between items-start">
            <div>
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Compliance Rate</span>
              <h3 className="text-3xl font-bold font-display text-indigo-400 mt-1">{data.complianceRate}%</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Clock size={16} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-xl border border-white/5">
          <h3 className="text-sm font-bold text-gray-300 mb-6 uppercase tracking-wider">Status Distribution</h3>
          <div className="h-64 relative">
            <Doughnut data={doughnutData} options={chartOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white">{data.complianceRate}%</span>
              <span className="text-xs text-gray-500">Compliant</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border border-white/5 lg:col-span-2">
          <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider text-rose-400 flex items-center gap-2">
            <AlertTriangle size={16} /> Overdue Critical Schedules
          </h3>
          <div className="overflow-x-auto max-h-64 custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-gray-400">
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Task Name</th>
                  <th className="p-3">Machine</th>
                  <th className="p-3 text-right">Days Overdue</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.schedules
                  .filter((s: any) => s.status === 'PENDING' && new Date(s.dueDate) < new Date())
                  .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .map((s: any) => {
                    const diffTime = Math.abs(new Date().getTime() - new Date(s.dueDate).getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={s.id} className="hover:bg-white/[0.02] text-gray-300">
                        <td className="p-3 font-mono text-xs">{new Date(s.dueDate).toLocaleDateString()}</td>
                        <td className="p-3">{s.pmTask?.name || 'General PM'}</td>
                        <td className="p-3 text-cyan-400">{s.machine?.name || s.machine?.machineName || 'Unknown'}</td>
                        <td className="p-3 text-right font-bold text-rose-400">{diffDays} Days</td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => {
                              setCompletingSchedule(s);
                              setCompletedAt(new Date().toISOString().split('T')[0]);
                              setRemarks('');
                            }}
                            className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-md transition"
                            title="Mark Completed"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                {data.overdue === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">No overdue schedules! Excellent work.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {completingSchedule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Complete PM Schedule</h3>
              <button onClick={() => setCompletingSchedule(null)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCompleteSchedule} className="space-y-4">
              <div className="text-sm text-gray-300">
                <p><strong>Machine:</strong> {completingSchedule.machine?.name || completingSchedule.machine?.machineName}</p>
                <p><strong>Due Date:</strong> {new Date(completingSchedule.dueDate).toLocaleDateString()}</p>
                {completingSchedule.pmTask && <p><strong>Task:</strong> {completingSchedule.pmTask.name}</p>}
              </div>
              <div className="flex flex-col gap-1.5 mt-4">
                <label className="text-xs font-semibold text-gray-400">Completion Date *</label>
                <input
                  type="date"
                  required
                  value={completedAt}
                  onChange={e => setCompletedAt(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-lg text-sm text-gray-200 bg-[#1e293b]"
                />
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-xs font-semibold text-gray-400">Remarks / Reason for Overdue (Optional)</label>
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-lg text-sm text-gray-200 bg-[#1e293b] min-h-[80px] resize-none"
                  placeholder="Enter remarks..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setCompletingSchedule(null)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1 bg-emerald-500 hover:bg-emerald-600 text-white">Mark Complete</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
