/**
 * MachineMaster.tsx
 * Three-level cascading machine hierarchy manager.
 * Department → Machine → Unit/Sub-Assembly
 * Non-technical users can add/edit/deactivate machines.
 */

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Plus, ChevronRight, Edit2, Trash2, AlertTriangle, CheckCircle, X, Save, Wrench } from 'lucide-react';

interface Dept  { id: string; name: string; code: string; isActive: boolean; }
interface Mach  { id: string; name: string; machineId: string; isActive: boolean; }
interface Unit  { id: string; name: string; isActive: boolean; }

export default function MachineMasterPage() {
  const [depts,       setDepts]       = useState<Dept[]>([]);
  const [machines,    setMachines]    = useState<Mach[]>([]);
  const [units,       setUnits]       = useState<Unit[]>([]);
  const [selDept,     setSelDept]     = useState<Dept | null>(null);
  const [selMachine,  setSelMachine]  = useState<Mach | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [notice,      setNotice]      = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Add/edit modal
  const [modal, setModal] = useState<{
    level: 'dept' | 'machine' | 'unit';
    record: any | null;
    name: string;
    code: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const showNotice = (type: 'ok' | 'err', msg: string) => {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 3000);
  };

  // Load departments
  const loadDepts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/masters/department');
      setDepts(res.data.data || []);
    } catch { showNotice('err', 'Failed to load departments'); }
    finally { setIsLoading(false); }
  }, []);

  // Load machines for selected dept
  const loadMachines = useCallback(async (dept: Dept) => {
    try {
      const res = await api.get(`/machines?departmentId=${dept.id}`);
      setMachines(res.data.data || res.data || []);
    } catch { setMachines([]); }
  }, []);

  // Load units for selected machine
  const loadUnits = useCallback(async (machine: Mach) => {
    try {
      const res = await api.get(`/machines/${machine.id}/sub-assemblies`);
      setUnits(res.data.data || res.data || []);
    } catch { setUnits([]); }
  }, []);

  useEffect(() => { loadDepts(); }, [loadDepts]);

  const selectDept = (dept: Dept) => {
    setSelDept(dept);
    setSelMachine(null);
    setUnits([]);
    setMachines([]);
    loadMachines(dept);
  };

  const selectMachine = (machine: Mach) => {
    setSelMachine(machine);
    setUnits([]);
    loadUnits(machine);
  };

  const openModal = (level: 'dept' | 'machine' | 'unit', record: any = null) => {
    setModal({ level, record, name: record?.name || '', code: record?.machineId || record?.code || '' });
  };

  const saveModal = async () => {
    if (!modal) return;
    if (!modal.name.trim()) { showNotice('err', 'Name is required'); return; }
    setIsSaving(true);
    try {
      if (modal.level === 'dept') {
        if (modal.record) {
          await api.put(`/masters/department/${modal.record.id}`, { name: modal.name });
        } else {
          // Need plantId — use first plant
          const pRes = await api.get('/masters/plant');
          const plantId = pRes.data.data[0]?.id;
          const code = modal.name.replace(/[^A-Z0-9]/gi, '').toUpperCase().substring(0, 12);
          await api.post('/masters/department', { name: modal.name, code, plantId });
        }
        await loadDepts();
      } else if (modal.level === 'machine' && selDept) {
        if (modal.record) {
          await api.put(`/masters/machine/${modal.record.id}`, { name: modal.name });
        } else {
          // Get section for this dept
          const sRes = await api.get(`/masters/section`);
          const section = sRes.data.data.find((s: any) => s.departmentId === selDept.id);
          const catRes = await api.get('/masters/machineCategory');
          const cat = catRes.data.data.find((c: any) => c.code === selDept.code) || catRes.data.data[0];
          const machineId = `${selDept.code.substring(0,4)}-${modal.name.replace(/[^A-Z0-9]/gi,'').toUpperCase().substring(0,8)}`;
          await api.post('/machines', {
            name: modal.name, machineId,
            sectionId: section?.id, machineCategoryId: cat?.id,
            status: 'ACTIVE', criticality: 'MEDIUM'
          });
        }
        await loadMachines(selDept);
      } else if (modal.level === 'unit' && selMachine) {
        if (modal.record) {
          await api.put(`/masters/subAssembly/${modal.record.id}`, { name: modal.name });
        } else {
          await api.post(`/machines/${selMachine.id}/sub-assemblies`, { name: modal.name });
        }
        await loadUnits(selMachine);
      }
      setModal(null);
      showNotice('ok', `${modal.level === 'dept' ? 'Department' : modal.level === 'machine' ? 'Machine' : 'Unit'} ${modal.record ? 'updated' : 'added'}`);
    } catch (err: any) {
      showNotice('err', err.response?.data?.message || 'Save failed');
    } finally { setIsSaving(false); }
  };

  const deactivate = async (level: 'dept' | 'machine' | 'unit', record: any) => {
    if (!window.confirm(`Deactivate "${record.name}"?`)) return;
    try {
      if (level === 'dept')    await api.delete(`/masters/department/${record.id}`);
      if (level === 'machine') await api.delete(`/machines/${record.id}`);
      if (level === 'unit')    await api.delete(`/masters/subAssembly/${record.id}`);
      if (level === 'dept')   { await loadDepts(); setSelDept(null); setMachines([]); setUnits([]); }
      if (level === 'machine') { if (selDept) await loadMachines(selDept); setSelMachine(null); setUnits([]); }
      if (level === 'unit')    { if (selMachine) await loadUnits(selMachine); }
      showNotice('ok', `"${record.name}" deactivated`);
    } catch { showNotice('err', 'Deactivate failed'); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
          <Wrench size={18} className="text-emerald-400" /> Machine Master
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">Department → Machine → Unit/Section hierarchy. Click a department to see its machines.</p>
      </div>

      {notice && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${notice.type === 'ok' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {notice.type === 'ok' ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
          {notice.msg}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Column 1: Departments */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-900/30">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Departments</span>
            <button onClick={() => openModal('dept')} className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded cursor-pointer" title="Add Department">
              <Plus size={13} />
            </button>
          </div>
          {isLoading ? (
            <div className="p-4 text-xs text-gray-500 text-center">Loading...</div>
          ) : depts.length === 0 ? (
            <div className="p-4 text-xs text-gray-500 text-center">No departments. Run seed first.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {depts.filter(d => d.isActive).map(dept => (
                <div key={dept.id}
                  onClick={() => selectDept(dept)}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-white/3 transition-colors ${selDept?.id === dept.id ? 'bg-emerald-500/10 border-l-2 border-emerald-400' : ''}`}
                >
                  <span className="text-xs text-gray-300 font-medium">{dept.name}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={e => { e.stopPropagation(); openModal('dept', dept); }} className="p-1 text-gray-500 hover:text-emerald-400 cursor-pointer rounded"><Edit2 size={11} /></button>
                    <ChevronRight size={11} className={`text-gray-500 ${selDept?.id === dept.id ? 'text-emerald-400' : ''}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Machines */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-900/30">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              {selDept ? `${selDept.name} Machines` : 'Machines'}
            </span>
            {selDept && (
              <button onClick={() => openModal('machine')} className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded cursor-pointer" title="Add Machine">
                <Plus size={13} />
              </button>
            )}
          </div>
          {!selDept ? (
            <div className="p-4 text-xs text-gray-500 text-center">← Select a department</div>
          ) : machines.length === 0 ? (
            <div className="p-4 text-xs text-gray-500 text-center">No machines. Click + to add.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {machines.map(machine => (
                <div key={machine.id}
                  onClick={() => selectMachine(machine)}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-white/3 transition-colors ${selMachine?.id === machine.id ? 'bg-emerald-500/10 border-l-2 border-emerald-400' : ''}`}
                >
                  <span className="text-xs text-gray-300">{machine.name}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={e => { e.stopPropagation(); openModal('machine', machine); }} className="p-1 text-gray-500 hover:text-emerald-400 cursor-pointer rounded"><Edit2 size={11} /></button>
                    <button onClick={e => { e.stopPropagation(); deactivate('machine', machine); }} className="p-1 text-gray-500 hover:text-red-400 cursor-pointer rounded"><Trash2 size={11} /></button>
                    <ChevronRight size={11} className={`text-gray-500 ${selMachine?.id === machine.id ? 'text-emerald-400' : ''}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 3: Units */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-900/30">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              {selMachine ? `${selMachine.name} Units` : 'Units / Sections'}
            </span>
            {selMachine && (
              <button onClick={() => openModal('unit')} className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded cursor-pointer" title="Add Unit">
                <Plus size={13} />
              </button>
            )}
          </div>
          {!selMachine ? (
            <div className="p-4 text-xs text-gray-500 text-center">← Select a machine</div>
          ) : units.length === 0 ? (
            <div className="p-4 text-xs text-gray-500 text-center">No units. Click + to add.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {units.map(unit => (
                <div key={unit.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/3">
                  <span className="text-xs text-gray-300">{unit.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openModal('unit', unit)} className="p-1 text-gray-500 hover:text-emerald-400 cursor-pointer rounded"><Edit2 size={11} /></button>
                    <button onClick={() => deactivate('unit', unit)} className="p-1 text-gray-500 hover:text-red-400 cursor-pointer rounded"><Trash2 size={11} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-100">
                {modal.record ? 'Edit' : 'Add'} {modal.level === 'dept' ? 'Department' : modal.level === 'machine' ? 'Machine' : 'Unit'}
              </h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-200 cursor-pointer"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Name <span className="text-red-400">*</span></label>
                <input type="text" value={modal.name}
                  onChange={e => setModal(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder={modal.level === 'dept' ? 'e.g. PRINTING' : modal.level === 'machine' ? 'e.g. PrintKBA4' : 'e.g. Feeder'}
                  className="glass-input px-3 py-2 w-full rounded-lg text-xs text-gray-200" autoFocus />
              </div>
            </div>
            <div className="flex gap-3 mt-5 pt-4 border-t border-white/5">
              <button onClick={() => setModal(null)} className="flex-1 py-2 text-xs text-gray-400 border border-white/10 rounded-lg cursor-pointer">Cancel</button>
              <button onClick={saveModal} disabled={isSaving}
                className="flex-1 py-2 text-xs font-semibold text-white glow-btn-primary rounded-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                {isSaving ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={12} />}
                {modal.record ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
