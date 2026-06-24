import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, ShieldAlert } from 'lucide-react';
import api from '../../services/api';


export const PMMaster: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [frequencies, setFrequencies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateTaskId, setGenerateTaskId] = useState<string | null>(null);
  const [generateStartDate, setGenerateStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    machineCategoryId: '',
    frequencyId: '',
    checkpoints: '',
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskRes, freqRes, confRes] = await Promise.all([
        api.get('/pm/tasks'),
        api.get('/pm/frequencies'),
        api.get('/config/masters')
      ]);
      setTasks(taskRes.data || []);
      setFrequencies(freqRes.data || []);
      setCategories(confRes.data?.categories || []);
    } catch (err) {
      alert('Failed to load PM Master Data', 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (task: any = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        name: task.name,
        description: task.description || '',
        machineCategoryId: task.machineCategoryId || '',
        frequencyId: task.frequencyId,
        checkpoints: task.checkpoints,
        isActive: task.isActive
      });
    } else {
      setEditingTask(null);
      setFormData({
        name: '', description: '', machineCategoryId: '', frequencyId: '', checkpoints: '', isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await api.put(`/pm/tasks/${editingTask.id}`, formData);
        alert('PM Task updated successfully', 'SUCCESS');
      } else {
        await api.post('/pm/tasks', formData);
        alert('PM Task created successfully', 'SUCCESS');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save PM Task', 'ERROR');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this PM Task?')) return;
    try {
      await api.delete(`/pm/tasks/${id}`);
      alert('Task deleted successfully', 'SUCCESS');
      fetchData();
    } catch (err) {
      alert('Failed to delete task', 'ERROR');
    }
  };

  const openGenerateModal = (taskId: string) => {
    setGenerateTaskId(taskId);
    setGenerateStartDate(new Date().toISOString().split('T')[0]);
    setIsGenerateModalOpen(true);
  };

  const handleGenerateSchedules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateTaskId) return;
    try {
      const res = await api.post('/pm/schedules/generate', {
        pmTaskId: generateTaskId,
        startDate: generateStartDate
      });
      alert(`Successfully generated ${res.data.count} schedules!`, 'SUCCESS');
      setIsGenerateModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate schedules', 'ERROR');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Preventive Maintenance Tasks</h1>
          <p className="text-sm text-gray-400 mt-1">Configure maintenance schedules, checklists, and frequency.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="glow-btn-primary flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
        >
          <Plus size={18} /> Add Task
        </button>
      </div>

      <div className="glass-panel border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
              <th className="p-4">Task Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Frequency</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading tasks...</td></tr>
            ) : tasks.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No PM tasks found.</td></tr>
            ) : (
              tasks.map(t => (
                <tr key={t.id} className="hover:bg-white/[0.02]">
                  <td className="p-4 text-gray-200">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{t.description}</div>
                  </td>
                  <td className="p-4 text-gray-400">{t.machineCategory?.name || 'All'}</td>
                  <td className="p-4 text-cyan-400 text-xs font-mono">{t.frequency?.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-medium border ${t.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                      {t.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end items-center gap-1">
                    <button 
                      onClick={() => openGenerateModal(t.id)} 
                      title="Generate Schedules"
                      className="p-1.5 text-cyan-400 hover:text-white hover:bg-cyan-500/20 rounded-md"
                    >
                      <Calendar size={16} />
                    </button>
                    <button onClick={() => handleOpenModal(t)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-md"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-xl rounded-2xl border border-white/10 shadow-2xl p-6">
            <h3 className="text-white font-bold text-lg mb-4">{editingTask ? 'Edit PM Task' : 'New PM Task'}</h3>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-semibold text-gray-400">Task Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-sm text-gray-200" placeholder="e.g. Weekly Lubrication" />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-semibold text-gray-400">Description</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-sm text-gray-200" placeholder="Optional brief description" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Machine Category *</label>
                <select required value={formData.machineCategoryId} onChange={e => setFormData({...formData, machineCategoryId: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-sm text-gray-200 bg-[#0b0f19]">
                  <option value="" disabled>Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Frequency *</label>
                <select required value={formData.frequencyId} onChange={e => setFormData({...formData, frequencyId: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-sm text-gray-200 bg-[#0b0f19]">
                  <option value="" disabled>Select Frequency</option>
                  {frequencies.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-xs font-semibold text-gray-400">Checkpoints (One per line) *</label>
                <textarea required value={formData.checkpoints} onChange={e => setFormData({...formData, checkpoints: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-sm text-gray-200 font-mono" rows={5} placeholder="1. Check oil level&#10;2. Tighten belt&#10;3. Clean sensor" />
              </div>

              <div className="col-span-2 flex items-center mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 rounded bg-gray-800 border-gray-600 text-cyan-500" />
                  <span className="text-sm text-gray-300">Is Active</span>
                </label>
              </div>

              <div className="col-span-2 flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" className="glow-btn-primary px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Calendar size={20} />
              </div>
              <h3 className="text-white font-bold text-lg">Generate Schedules</h3>
            </div>
            
            <p className="text-sm text-gray-400 mb-4">
              Select a start date. The system will automatically spawn PM schedules for all applicable machines based on the task's configured frequency.
            </p>

            <form onSubmit={handleGenerateSchedules} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Start Date</label>
                <input 
                  required 
                  type="date" 
                  value={generateStartDate} 
                  onChange={e => setGenerateStartDate(e.target.value)} 
                  className="glass-input w-full px-3 py-2 rounded-lg text-sm text-gray-200" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
                <button type="button" onClick={() => setIsGenerateModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" className="glow-btn-primary px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2">
                  <Calendar size={16} /> Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
