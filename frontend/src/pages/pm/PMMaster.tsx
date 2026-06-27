import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, ShieldAlert } from 'lucide-react';
import api from '../../services/api';

export const PMMaster: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [frequencies, setFrequencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateTaskId, setGenerateTaskId] = useState<string | null>(null);
  const [generateStartDate, setGenerateStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Dropdown reference lists (loaded generic records for cascading filter)
  const [plants, setPlants] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [machineTypes, setMachineTypes] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [machineUnits, setMachineUnits] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequencyId: '',
    checkpoints: '',
    isActive: true,
    
    // Cascading path linking
    plantId: '',
    departmentId: '',
    sectionId: '',
    machineTypeId: '',
    machineId: '',
    unitId: '',

    // Advanced attributes
    estimatedTime: '',
    requiredSkill: '',
    safetyInstruction: '',
    lubricationPoint: '',
    spareRequired: '',
    sop: '',
    photoUrl: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskRes, freqRes, plantsRes, deptsRes, sectionsRes, typeRes, machRes, unitsRes] = await Promise.all([
        api.get('/pm/tasks'),
        api.get('/pm/frequencies'),
        api.get('/v1/masters/generic/mst_plant'),
        api.get('/v1/masters/generic/mst_department'),
        api.get('/masters/section'), // legacy sections list
        api.get('/v1/masters/generic/mst_machine_type'),
        api.get('/v1/masters/generic/mst_machine'),
        api.get('/v1/masters/generic/mst_machine_unit')
      ]);

      setTasks(Array.isArray(taskRes.data) ? taskRes.data : taskRes.data?.data || []);
      setFrequencies(Array.isArray(freqRes.data) ? freqRes.data : freqRes.data?.data || []);
      setPlants(plantsRes.data?.data || []);
      setDepartments(deptsRes.data?.data || []);
      setSections(sectionsRes.data?.data || []);
      setMachineTypes(typeRes.data?.data || []);
      setMachines(machRes.data?.data || []);
      setMachineUnits(unitsRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load PM Master Data', err);
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
        frequencyId: task.frequencyId,
        checkpoints: task.checkpoints,
        isActive: task.isActive,
        plantId: task.plantId || '',
        departmentId: task.departmentId || '',
        sectionId: task.sectionId || '',
        machineTypeId: task.machineTypeId || '',
        machineId: task.machineId || '',
        unitId: task.unitId || '',
        estimatedTime: task.estimatedTime !== null && task.estimatedTime !== undefined ? String(task.estimatedTime) : '',
        requiredSkill: task.requiredSkill || '',
        safetyInstruction: task.safetyInstruction || '',
        lubricationPoint: task.lubricationPoint || '',
        spareRequired: task.spareRequired || '',
        sop: task.sop || '',
        photoUrl: task.photoUrl || ''
      });
    } else {
      setEditingTask(null);
      setFormData({
        name: '',
        description: '',
        frequencyId: '',
        checkpoints: '',
        isActive: true,
        plantId: '',
        departmentId: '',
        sectionId: '',
        machineTypeId: '',
        machineId: '',
        unitId: '',
        estimatedTime: '',
        requiredSkill: '',
        safetyInstruction: '',
        lubricationPoint: '',
        spareRequired: '',
        sop: '',
        photoUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        estimatedTime: formData.estimatedTime ? Number(formData.estimatedTime) : null,
        plantId: formData.plantId || null,
        departmentId: formData.departmentId || null,
        sectionId: formData.sectionId || null,
        machineTypeId: formData.machineTypeId || null,
        machineId: formData.machineId || null,
        unitId: formData.unitId || null,
      };

      if (editingTask) {
        await api.put(`/pm/tasks/${editingTask.id}`, payload);
      } else {
        await api.post('/pm/tasks', payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save PM Task');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this PM Task?')) return;
    try {
      await api.delete(`/pm/tasks/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete task');
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
      alert(`Successfully generated ${res.data.count} schedules!`);
      setIsGenerateModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate schedules');
    }
  };

  // Cascading Filter lists
  const filteredDepartments = departments.filter(d => !formData.plantId || d.plantId === formData.plantId);
  const filteredMachineTypes = machineTypes.filter(mt => !formData.departmentId || mt.deptId === formData.departmentId);
  const filteredMachines = machines.filter(m => {
    if (formData.plantId && m.plantId !== formData.plantId) return false;
    if (formData.machineTypeId && m.machineTypeId !== formData.machineTypeId) return false;
    return true;
  });
  const filteredUnits = machineUnits.filter(u => !formData.machineId || u.machineId === formData.machineId);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Preventive Maintenance Tasks</h1>
          <p className="text-sm text-gray-400 mt-1">Configure maintenance schedules, checklists, and frequency.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="glow-btn-primary flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer"
        >
          <Plus size={18} /> Add Task
        </button>
      </div>

      <div className="glass-panel border border-white/5 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
              <th className="p-4">Task Name</th>
              <th className="p-4">Linked Asset</th>
              <th className="p-4">Frequency</th>
              <th className="p-4">Est. Time</th>
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
                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-gray-200">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{t.description || 'No description'}</div>
                  </td>
                  <td className="p-4 text-gray-400">
                    {t.machine?.machineName || t.plant?.plantName || 'Global'}
                    {t.unit && <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded ml-1 text-cyan-400">{t.unit.unitName}</span>}
                  </td>
                  <td className="p-4 text-cyan-400 text-xs font-mono">{t.frequency?.name}</td>
                  <td className="p-4 text-gray-400 text-xs font-mono">{t.estimatedTime ? `${t.estimatedTime} min` : '-'}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button 
                        onClick={() => openGenerateModal(t.id)} 
                        title="Generate Schedules"
                        className="p-1.5 text-cyan-400 hover:text-white hover:bg-cyan-500/20 rounded-md cursor-pointer"
                      >
                        <Calendar size={16} />
                      </button>
                      <button onClick={() => handleOpenModal(t)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md cursor-pointer"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-md cursor-pointer"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl p-6">
            <h3 className="text-white font-bold text-lg mb-4">{editingTask ? 'Edit PM Task' : 'New PM Task'}</h3>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-1">
              
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-semibold text-gray-400">Task Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200" placeholder="e.g. Weekly Lubrication" />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-semibold text-gray-400">Description</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200" placeholder="Optional brief description" />
              </div>

              {/* Plant */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Plant</label>
                <select value={formData.plantId} onChange={e => setFormData({...formData, plantId: e.target.value, departmentId: '', machineId: ''})} className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200 bg-[#0b0f19]">
                  <option value="">All Plants</option>
                  {plants.map(p => <option key={p.plantId} value={p.plantId}>{p.plantName}</option>)}
                </select>
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Department</label>
                <select value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value, machineTypeId: ''})} className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200 bg-[#0b0f19]">
                  <option value="">All Departments</option>
                  {filteredDepartments.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
                </select>
              </div>

              {/* Machine Type */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Machine Type</label>
                <select value={formData.machineTypeId} onChange={e => setFormData({...formData, machineTypeId: e.target.value, machineId: ''})} className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200 bg-[#0b0f19]">
                  <option value="">All Machine Types</option>
                  {filteredMachineTypes.map(mt => <option key={mt.machineTypeId} value={mt.machineTypeId}>{mt.typeName}</option>)}
                </select>
              </div>

              {/* Machine */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Machine</label>
                <select value={formData.machineId} onChange={e => setFormData({...formData, machineId: e.target.value, unitId: ''})} className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200 bg-[#0b0f19]">
                  <option value="">All Machines</option>
                  {filteredMachines.map(m => <option key={m.machineId} value={m.machineId}>{m.machineName}</option>)}
                </select>
              </div>

              {/* Machine Unit */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Machine Unit</label>
                <select value={formData.unitId} onChange={e => setFormData({...formData, unitId: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200 bg-[#0b0f19]">
                  <option value="">All Units</option>
                  {filteredUnits.map(u => <option key={u.unitId} value={u.unitId}>{u.unitName}</option>)}
                </select>
              </div>

              {/* Frequency */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Frequency *</label>
                <select required value={formData.frequencyId} onChange={e => setFormData({...formData, frequencyId: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200 bg-[#0b0f19]">
                  <option value="" disabled>Select Frequency</option>
                  {frequencies.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              {/* Advanced Fields */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Est. Duration (Minutes)</label>
                <input type="number" value={formData.estimatedTime} onChange={e => setFormData({...formData, estimatedTime: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200" placeholder="e.g. 30" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Required Skill</label>
                <input type="text" value={formData.requiredSkill} onChange={e => setFormData({...formData, requiredSkill: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200" placeholder="e.g. Mechanical Gr II" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Safety Instruction</label>
                <input type="text" value={formData.safetyInstruction} onChange={e => setFormData({...formData, safetyInstruction: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200" placeholder="e.g. LOTO Required" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Lubrication Point</label>
                <input type="text" value={formData.lubricationPoint} onChange={e => setFormData({...formData, lubricationPoint: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200" placeholder="e.g. Bearing Unit 3" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Spare Parts Required</label>
                <input type="text" value={formData.spareRequired} onChange={e => setFormData({...formData, spareRequired: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200" placeholder="e.g. Filter cartridge" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">SOP URL / Code</label>
                <input type="text" value={formData.sop} onChange={e => setFormData({...formData, sop: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200" placeholder="e.g. SOP-PM-KBA-01" />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-xs font-semibold text-gray-400">Checkpoints (One per line) *</label>
                <textarea required value={formData.checkpoints} onChange={e => setFormData({...formData, checkpoints: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200 font-mono" rows={4} placeholder="1. Check oil level&#10;2. Tighten belt&#10;3. Clean sensor" />
              </div>

              <div className="col-span-2 flex items-center mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 rounded bg-gray-800 border-gray-600 text-cyan-500" />
                  <span className="text-xs text-gray-300 font-semibold">Is Active</span>
                </label>
              </div>

              <div className="col-span-2 flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs text-gray-400 hover:text-white cursor-pointer">Cancel</button>
                <button type="submit" className="glow-btn-primary px-4 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-2 cursor-pointer">Save Task</button>
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
            
            <p className="text-xs text-gray-400 mb-4">
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
                  className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
                <button type="button" onClick={() => setIsGenerateModalOpen(false)} className="px-4 py-2 text-xs text-gray-400 hover:text-white cursor-pointer">Cancel</button>
                <button type="submit" className="glow-btn-primary px-4 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-2 cursor-pointer">
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
