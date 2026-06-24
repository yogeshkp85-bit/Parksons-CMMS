import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, QrCode, Trash2, Printer, FileDown } from 'lucide-react';
import QRCode from 'react-qr-code';
import api from '../services/api';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const MachineMaster: React.FC = () => {
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Masters for dropdowns
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; machine: any | null }>({ isOpen: false, machine: null });
  
  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<any | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    categoryId: '',
    unitId: '',
    sectionId: '',
    parentMachineId: '',
    isSubAssembly: false,
    status: 'ACTIVE'
  });

  

  useEffect(() => {
    fetchMachines();
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await api.get('/config/masters');
      if (data) {
        setCategories(data.categories || []);
        setUnits(data.units || []);
      }
    } catch (err) {
      console.error('Failed to load config masters', err);
    }
  };

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/machines');
      setMachines(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load machines', 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  const filtered = machines.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.unit?.section?.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const printQR = () => {
    const printContents = document.getElementById('qr-print-area')?.innerHTML;
    const originalContents = document.body.innerHTML;
    if (printContents) {
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  const exportPDF = async () => {
    const input = document.getElementById('machine-table');
    if (!input) return;
    try {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.text("Machine Master Registry", 14, 15);
      pdf.addImage(imgData, 'PNG', 0, 25, pdfWidth, pdfHeight);
      pdf.save('Machine_Master_Export.pdf');
    } catch (err) {
      console.error('Failed to export PDF', err);
      alert('Failed to export PDF', 'ERROR');
    }
  };

  const handleOpenModal = (machine: any = null) => {
    if (machine) {
      setEditingMachine(machine);
      setFormData({
        code: machine.code || '',
        name: machine.name || '',
        categoryId: machine.machineCategoryId || '',
        unitId: machine.unitId || '',
        sectionId: machine.sectionId || '',
        parentMachineId: machine.parentMachineId || '',
        isSubAssembly: !!machine.isSubAssembly,
        status: machine.status || 'ACTIVE'
      });
    } else {
      setEditingMachine(null);
      setFormData({
        code: '',
        name: '',
        categoryId: '',
        unitId: '',
        sectionId: '',
        parentMachineId: '',
        isSubAssembly: false,
        status: 'ACTIVE'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMachine) {
        await api.put(`/machines/${editingMachine.id}`, formData);
        alert('Machine updated successfully', 'SUCCESS');
      } else {
        await api.post('/machines', formData);
        alert('Machine created successfully', 'SUCCESS');
      }
      setIsModalOpen(false);
      fetchMachines();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save machine', 'ERROR');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this machine?')) return;
    try {
      await api.delete(`/machines/${id}`);
      alert('Machine deleted successfully', 'SUCCESS');
      fetchMachines();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete machine', 'ERROR');
    }
  };

  // Helper to derive sections from selected unit
  const activeUnit = units.find(u => u.id === formData.unitId);
  const activeSections = activeUnit?.section ? [activeUnit.section] : [];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Machine Master</h1>
          <p className="text-gray-400 text-sm mt-1">Manage factory machines, sub-assemblies, and generate QR codes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportPDF}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all border border-cyan-500/20"
          >
            <FileDown size={18} />
            Export PDF
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="glow-btn-primary flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
          >
            <Plus size={18} />
            Add Machine
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 rounded-xl border border-white/5 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search by Machine Name, Code or Dept..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel border border-white/5 rounded-xl overflow-hidden" id="machine-table">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse bg-[#0b0f19]">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Machine Name</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Code</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Department/Unit</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Hierarchy</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right" data-html2canvas-ignore>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">Loading machines...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No machines found.</td>
                </tr>
              ) : (
                filtered.map(m => (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-gray-200 font-medium">
                      {m.name}
                      {m.isSubAssembly && <span className="ml-2 text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full">Sub-Assembly</span>}
                    </td>
                    <td className="p-4 text-gray-400 font-mono text-xs">{m.code}</td>
                    <td className="p-4 text-gray-400">
                      <div className="text-sm">{m.unit?.section?.department?.name || 'Unknown Dept'}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{m.unit?.name || 'No Unit'}</div>
                    </td>
                    <td className="p-4 text-gray-400 text-xs">
                      {m.parentMachine ? `Child of ${m.parentMachine.name}` : 'Parent'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium tracking-wide border ${
                        m.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-2" data-html2canvas-ignore>
                      <button 
                        onClick={() => setQrModal({ isOpen: true, machine: m })}
                        className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-md transition-colors"
                        title="Generate QR"
                      >
                        <QrCode size={16} />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(m)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors" 
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" 
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal */}
      {qrModal.isOpen && qrModal.machine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-white font-medium">Machine QR Code</h3>
              <button onClick={() => setQrModal({ isOpen: false, machine: null })} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="p-8 flex flex-col items-center justify-center bg-white" id="qr-print-area">
              <QRCode 
                value={JSON.stringify({
                  machineId: qrModal.machine.id,
                  machineCode: qrModal.machine.code,
                  machineName: qrModal.machine.name
                })}
                size={200}
                level="H"
              />
              <div className="mt-4 text-center">
                <p className="text-gray-900 font-bold text-lg">{qrModal.machine.code}</p>
                <p className="text-gray-600 text-sm">{qrModal.machine.name}</p>
              </div>
            </div>

            <div className="p-4 border-t border-white/5 flex justify-end gap-3 bg-[#0a0d14]">
              <button onClick={() => setQrModal({ isOpen: false, machine: null })} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={printQR} className="glow-btn-primary px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2">
                <Printer size={16} /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Machine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#0a0d14]">
              <h3 className="text-white font-bold text-lg">
                {editingMachine ? 'Edit Machine Configuration' : 'Add New Machine'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="machine-form" onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">Machine Code *</label>
                  <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-sm text-gray-200" placeholder="e.g. M-101" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">Machine Name *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-sm text-gray-200" placeholder="e.g. Heidelberg CD 102" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">Category *</label>
                  <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-sm text-gray-200 bg-[#0b0f19]">
                    <option value="" disabled>Select Category</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">Unit *</label>
                  <select required value={formData.unitId} onChange={e => {
                      const uid = e.target.value;
                      const selUnit = units.find(u => u.id === uid);
                      setFormData({...formData, unitId: uid, sectionId: selUnit?.sectionId || ''});
                    }} className="glass-input w-full px-3 py-2 rounded-lg text-sm text-gray-200 bg-[#0b0f19]">
                    <option value="" disabled>Select Unit</option>
                    {units.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                    <input type="checkbox" checked={formData.isSubAssembly} onChange={e => setFormData({...formData, isSubAssembly: e.target.checked})} className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900" />
                    <span className="text-sm font-medium text-gray-200">Is this a Sub-Assembly?</span>
                  </label>
                </div>

                {formData.isSubAssembly && (
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-cyan-400">Select Parent Machine *</label>
                    <select required={formData.isSubAssembly} value={formData.parentMachineId} onChange={e => setFormData({...formData, parentMachineId: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-sm text-cyan-100 bg-cyan-900/20 border border-cyan-500/30">
                      <option value="" disabled>Select Parent</option>
                      {machines.filter(m => !m.isSubAssembly && m.id !== editingMachine?.id).map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-400">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="glass-input w-full px-3 py-2 rounded-lg text-sm text-gray-200 bg-[#0b0f19]">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SCRAPPED">SCRAPPED</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-white/5 flex justify-end gap-3 bg-[#0a0d14]">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button form="machine-form" type="submit" className="glow-btn-primary px-5 py-2.5 rounded-lg text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all">
                {editingMachine ? 'Save Changes' : 'Create Machine'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
