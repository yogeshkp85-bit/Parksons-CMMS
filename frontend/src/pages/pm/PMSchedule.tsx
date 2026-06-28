import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, CalendarDays, Plus, Edit2, Trash2, Loader } from 'lucide-react';
import api from '../../services/api';

export const PMSchedule: React.FC = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Execution Modal (for completing a schedule)
  const [activeSchedule, setActiveSchedule] = useState<any | null>(null);
  const [remarks, setRemarks] = useState('');
  const [completedAt, setCompletedAt] = useState('');
  const [checklist, setChecklist] = useState<{item: string, passed: boolean | null, notes: string}[]>([]);

  // CRUD Modals State (for managing schedules)
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [crudFormData, setCrudFormData] = useState({
    departmentId: '',
    machineId: '',
    dueDates: [new Date().toISOString().split('T')[0]], // Array of dates
    status: 'PENDING'
  });

  // Reference Data Lists
  const [departments, setDepartments] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);

  useEffect(() => {
    fetchSchedules();
    fetchReferenceData();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pm/schedules');
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      // Filter out deleted schedules
      setSchedules(data.filter((s: any) => !s.deletedAt));
    } catch (err) {
      console.error('Failed to load PM schedules');
    } finally {
      setLoading(false);
    }
  };

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

  const openExecuteModal = (schedule: any) => {
    setActiveSchedule(schedule);
    setRemarks('');
    setCompletedAt(new Date().toISOString().split('T')[0]);
    
    // Parse checkpoints
    const cpString = schedule.pmTask?.checkpoints || '';
    const parsed = cpString.split('\n').filter((s: string) => s.trim().length > 0).map((s: string) => ({
      item: s.trim(),
      passed: null as boolean | null,
      notes: ''
    }));
    setChecklist(parsed);
  };

  const updateChecklist = (index: number, field: 'passed' | 'notes', value: any) => {
    const updated = [...checklist];
    updated[index] = { ...updated[index], [field]: value };
    setChecklist(updated);
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchedule) return;

    // Validate checkpoints
    const uncompleted = checklist.some(c => c.passed === null);
    if (uncompleted && checklist.length > 0) {
      alert('Please mark Pass or Fail for all checkpoints.');
      return;
    }

    try {
      await api.put(`/pm/schedules/${activeSchedule.id}/complete`, {
        completionRemarks: remarks,
        checkpointsResult: checklist,
        completedAt: completedAt ? new Date(completedAt).toISOString() : new Date().toISOString()
      });
      alert('PM Schedule completed successfully');
      setActiveSchedule(null);
      setRemarks('');
      setCompletedAt('');
      setChecklist([]);
      fetchSchedules();
    } catch (err) {
      alert('Failed to complete schedule');
    }
  };

  // CRUD Actions
  const handleOpenAddModal = () => {
    setEditingScheduleId(null);
    setCrudFormData({
      departmentId: '',
      machineId: '',
      dueDates: [new Date().toISOString().split('T')[0]],
      status: 'PENDING'
    });
    setIsCrudModalOpen(true);
  };

  const handleOpenEditModal = (schedule: any) => {
    setEditingScheduleId(schedule.id);
    
    setCrudFormData({
      departmentId: '',
      machineId: schedule.machineId || '',
      dueDates: schedule.dueDate ? [new Date(schedule.dueDate).toISOString().split('T')[0]] : [],
      status: schedule.status || 'PENDING'
    });
    setIsCrudModalOpen(true);
  };

  const handleCrudSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (crudFormData.dueDates.length === 0) {
      alert('Please add at least one due date.');
      return;
    }
    
    try {
      const payload = {
        machineId: crudFormData.machineId,
        status: crudFormData.status,
        dueDates: crudFormData.dueDates,
        dueDate: crudFormData.dueDates[0] // fallback for edit
      };

      if (editingScheduleId) {
        await api.put(`/pm/schedules/${editingScheduleId}`, payload);
        alert('PM Schedule updated successfully');
      } else {
        await api.post('/pm/schedules', payload);
        alert('PM Schedule(s) added successfully');
      }
      setIsCrudModalOpen(false);
      fetchSchedules();
    } catch (err) {
      alert('Failed to save PM schedule');
    }
  };

  const handleCloseModal = () => setIsCrudModalOpen(false);

  // Filter machines based on selected department
  const filteredMachines = crudFormData.departmentId 
    ? machines.filter(m => m.departmentId === crudFormData.departmentId)
    : machines;

  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this PM Schedule?')) return;
    try {
      await api.delete(`/pm/schedules/${id}`);
      alert('PM Schedule deleted successfully');
      fetchSchedules();
    } catch (err) {
      alert('Failed to delete PM schedule');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Preventive Maintenance Schedules</h1>
          <p className="text-sm text-gray-400 mt-1">Execute and monitor scheduled machine maintenance.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="glow-btn-primary flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
        >
          <Plus size={18} /> Add Schedule
        </button>
      </div>

      <div className="glass-panel border border-white/5 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
              <th className="p-4">Machine</th>
              <th className="p-4">Task</th>
              <th className="p-4">Due Date</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500"><Loader className="animate-spin inline mr-2 text-cyan-400" size={16} /> Loading schedules...</td></tr>
            ) : schedules.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No schedules found.</td></tr>
            ) : (
              schedules.map(s => (
                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-gray-200">
                    <div className="font-medium">{s.machine?.machineName || s.machine?.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{s.machine?.machineCode || s.machine?.code}</div>
                  </td>
                  <td className="p-4 text-gray-300">
                    {s.pmTask ? (
                      <>
                        <div>{s.pmTask?.name}</div>
                        <div className="text-[10px] text-cyan-400">{s.pmTask?.frequency?.name}</div>
                      </>
                    ) : (
                      <div className="text-gray-400 italic text-xs">General Machine PM</div>
                    )}
                  </td>
                  <td className="p-4 text-gray-400">
                    <div className="flex items-center gap-1"><CalendarDays size={14}/> {new Date(s.dueDate).toLocaleDateString()}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-medium border ${
                      s.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      new Date(s.dueDate) < new Date() ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {s.status === 'PENDING' && new Date(s.dueDate) < new Date() ? 'OVERDUE' : s.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      {s.status === 'PENDING' && (
                        <button 
                          onClick={() => openExecuteModal(s)}
                          className="p-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold cursor-pointer"
                        >
                          <CheckCircle size={14} /> Execute
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditModal(s)}
                        className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition cursor-pointer"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(s.id)}
                        className="p-1.5 bg-red-500/5 hover:bg-red-500/10 text-red-500 hover:text-red-400 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Execution Modal */}
      {activeSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6">
            <h3 className="text-white font-bold text-lg mb-4">Execute PM Task</h3>
            <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/5">
              <div className="text-sm font-medium text-gray-200">{activeSchedule.pmTask?.name}</div>
              <div className="text-xs text-gray-400 mt-1">{activeSchedule.pmTask?.description}</div>
              <div className="mt-3 text-xs text-cyan-400 font-mono">Machine: {activeSchedule.machine?.machineName || activeSchedule.machine?.name}</div>
            </div>
            
            <form onSubmit={handleComplete} className="space-y-4">
              {checklist.length > 0 ? (
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-2">Digital Checklist</label>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {checklist.map((cp, idx) => (
                      <div key={idx} className="bg-[#0a0d14] p-3 rounded-lg border border-white/5 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-sm text-gray-300 flex-1">{cp.item}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <button type="button" onClick={() => updateChecklist(idx, 'passed', true)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${cp.passed === true ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>Pass</button>
                            <button type="button" onClick={() => updateChecklist(idx, 'passed', false)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${cp.passed === false ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>Fail</button>
                          </div>
                        </div>
                        {cp.passed === false && (
                          <input 
                            type="text" 
                            placeholder="Add failure notes..." 
                            value={cp.notes} 
                            onChange={(e) => updateChecklist(idx, 'notes', e.target.value)}
                            className="w-full bg-[#0f172a] border border-rose-500/30 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                            required
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Instructions</label>
                  <div className="text-sm text-gray-300 whitespace-pre-wrap bg-[#0a0d14] p-3 rounded-lg border border-white/5">
                    No checkpoints specified for this task.
                  </div>
                </div>
              )}
              
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

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Completion Remarks (Optional)</label>
                <textarea 
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-lg text-sm text-gray-200" 
                  rows={3} 
                  placeholder="Enter notes about the maintenance performed..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setActiveSchedule(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white cursor-pointer">Cancel</button>
                <button type="submit" className="glow-btn-primary px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2 cursor-pointer">
                  <CheckCircle size={16} /> Mark Completed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRUD Schedule Add/Edit Modal */}
      {isCrudModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl p-6">
            <h3 className="text-white font-bold text-lg mb-4">
              {editingScheduleId ? 'Edit PM Schedule' : 'New PM Schedule'}
            </h3>
            
            <form onSubmit={handleCrudSubmit} className="space-y-4">
              
              {/* Select Department */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Department</label>
                <select
                  value={crudFormData.departmentId}
                  onChange={e => setCrudFormData({ ...crudFormData, departmentId: e.target.value, machineId: '' })}
                  className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200 bg-[#0f172a]"
                >
                  <option value="">Select Department...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Select Machine */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Machine *</label>
                <select
                  required
                  value={crudFormData.machineId}
                  onChange={e => setCrudFormData({ ...crudFormData, machineId: e.target.value })}
                  className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200 bg-[#0f172a]"
                  disabled={!crudFormData.departmentId && !editingScheduleId}
                >
                  <option value="">Select Machine...</option>
                  {(editingScheduleId ? machines : filteredMachines).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Due Dates (Multi-Select) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Due Date(s) *</label>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                  {crudFormData.dueDates.map((date, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={e => {
                          const newDates = [...crudFormData.dueDates];
                          newDates[idx] = e.target.value;
                          setCrudFormData({ ...crudFormData, dueDates: newDates });
                        }}
                        className="glass-input flex-1 px-3 py-2 rounded-lg text-xs text-gray-200 bg-[#0f172a]"
                      />
                      {crudFormData.dueDates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newDates = crudFormData.dueDates.filter((_, i) => i !== idx);
                            setCrudFormData({ ...crudFormData, dueDates: newDates });
                          }}
                          className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {!editingScheduleId && (
                  <button
                    type="button"
                    onClick={() => {
                      setCrudFormData({ 
                        ...crudFormData, 
                        dueDates: [...crudFormData.dueDates, new Date().toISOString().split('T')[0]] 
                      });
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 mt-1 cursor-pointer w-max"
                  >
                    <Plus size={12} /> Add another date
                  </button>
                )}
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Status *</label>
                <select
                  required
                  value={crudFormData.status}
                  onChange={e => setCrudFormData({ ...crudFormData, status: e.target.value })}
                  className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200 bg-[#0f172a]"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glow-btn-primary px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
