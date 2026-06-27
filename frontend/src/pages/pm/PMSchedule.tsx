import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, CalendarDays } from 'lucide-react';
import api from '../../services/api';


export const PMSchedule: React.FC = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  

  // Completion Modal
  const [activeSchedule, setActiveSchedule] = useState<any | null>(null);
  const [remarks, setRemarks] = useState('');
  const [checklist, setChecklist] = useState<{item: string, passed: boolean | null, notes: string}[]>([]);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pm/schedules');
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setSchedules(data);
    } catch (err) {
      console.error('Failed to load PM schedules');
    } finally {
      setLoading(false);
    }
  };

  const openExecuteModal = (schedule: any) => {
    setActiveSchedule(schedule);
    setRemarks('');
    
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

    // Validate that all checkpoints have been marked Pass or Fail
    const uncompleted = checklist.some(c => c.passed === null);
    if (uncompleted && checklist.length > 0) {
      console.warn('Please mark Pass or Fail for all checkpoints.');
      return;
    }

    try {
      await api.put(`/pm/schedules/${activeSchedule.id}/complete`, {
        completionRemarks: remarks,
        checkpointsResult: checklist
      });
      alert('PM Schedule completed successfully', 'SUCCESS');
      setActiveSchedule(null);
      setRemarks('');
      setChecklist([]);
      fetchSchedules();
    } catch (err) {
      alert('Failed to complete schedule', 'ERROR');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Preventive Maintenance</h1>
          <p className="text-sm text-gray-400 mt-1">Execute and monitor scheduled machine maintenance.</p>
        </div>
      </div>

      <div className="glass-panel border border-white/5 rounded-xl overflow-hidden">
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
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading schedules...</td></tr>
            ) : schedules.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No schedules found.</td></tr>
            ) : (
              schedules.map(s => (
                <tr key={s.id} className="hover:bg-white/[0.02]">
                  <td className="p-4 text-gray-200">
                    <div className="font-medium">{s.machine?.name}</div>
                    <div className="text-xs text-gray-500">{s.machine?.code}</div>
                  </td>
                  <td className="p-4 text-gray-300">
                    <div>{s.pmTask?.name}</div>
                    <div className="text-[10px] text-cyan-400">{s.pmTask?.frequency?.name}</div>
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
                    {s.status === 'PENDING' && (
                      <button 
                        onClick={() => openExecuteModal(s)}
                        className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors inline-flex items-center gap-2 px-3 text-xs font-medium"
                      >
                        <CheckCircle size={14} /> Execute
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {activeSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6">
            <h3 className="text-white font-bold text-lg mb-4">Execute PM Task</h3>
            <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/5">
              <div className="text-sm font-medium text-gray-200">{activeSchedule.pmTask?.name}</div>
              <div className="text-xs text-gray-400 mt-1">{activeSchedule.pmTask?.description}</div>
              <div className="mt-3 text-xs text-cyan-400 font-mono">Machine: {activeSchedule.machine?.name}</div>
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
              
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Completion Remarks</label>
                <textarea 
                  required
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-lg text-sm text-gray-200" 
                  rows={3} 
                  placeholder="Enter notes about the maintenance performed..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setActiveSchedule(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" className="glow-btn-primary px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2">
                  <CheckCircle size={16} /> Mark Completed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
