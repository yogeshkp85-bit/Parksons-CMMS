import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, ArrowLeft, Loader } from 'lucide-react';
import api from '../../services/api';
import { mdmSchemas } from '../../config/mdm.schema';

export const DynamicMDM: React.FC = () => {
  const { tableName } = useParams<{ tableName: string }>();
  const schema = tableName ? mdmSchemas[tableName] : null;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Dropdown options for dynamic-select fields
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, { id: string; name: string }[]>>({});

  useEffect(() => {
    if (schema) {
      fetchRecords();
      loadDropdownData();
    }
  }, [tableName]);

  const fetchRecords = async () => {
    if (!schema) return;
    try {
      setLoading(true);
      const res = await api.get(`/v1/masters/generic/${schema.tableName}`);
      setData(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error('Failed to load master records:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDropdownData = async () => {
    if (!schema) return;
    const dynamicSelectFields = schema.fields.filter(f => f.type === 'dynamic-select');
    const optionsMap: Record<string, { id: string; name: string }[]> = {};

    for (const field of dynamicSelectFields) {
      if (field.endpoint) {
        try {
          const res = await api.get(field.endpoint);
          optionsMap[field.key] = res.data.data || [];
        } catch (err) {
          console.error(`Failed to load dropdown for field ${field.key}:`, err);
        }
      }
    }
    setDropdownOptions(optionsMap);
  };

  const handleOpenAddModal = () => {
    if (!schema) return;
    const initialForm: Record<string, any> = {};
    schema.fields.forEach(f => {
      if (f.type === 'checkbox') {
        initialForm[f.key] = true;
      } else if (f.type === 'number') {
        initialForm[f.key] = 0;
      } else {
        initialForm[f.key] = '';
      }
    });
    setFormData(initialForm);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: any) => {
    if (!schema) return;
    setFormData({ ...record });
    setEditingId(record[schema.primaryKey]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schema) return;

    try {
      setSaving(true);
      // Clean request payload: parse numbers
      const payload = { ...formData };
      schema.fields.forEach(f => {
        if (f.type === 'number' && payload[f.key] !== undefined) {
          payload[f.key] = Number(payload[f.key]);
        }
      });

      if (editingId) {
        await api.put(`/v1/masters/generic/${schema.tableName}/${editingId}`, payload);
      } else {
        await api.post(`/v1/masters/generic/${schema.tableName}`, payload);
      }
      handleCloseModal();
      fetchRecords();
    } catch (err) {
      console.error('Failed to save master record:', err);
      alert('Failed to save. Record code or name might be duplicate.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!schema) return;
    if (!window.confirm('Are you sure you want to delete this master record?')) return;

    try {
      await api.delete(`/v1/masters/generic/${schema.tableName}/${id}`);
      fetchRecords();
    } catch (err) {
      console.error('Failed to delete master record:', err);
      alert('Failed to delete record.');
    }
  };

  if (!schema) {
    return (
      <div className="glass-panel p-8 rounded-2xl border-white/5 text-center text-gray-400">
        Invalid Master Setup Table.
      </div>
    );
  }

  // Filter records based on search term
  const filteredData = data.filter((row: any) => {
    return schema.fields.some(f => {
      const val = row[f.key];
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">{schema.title}</h1>
          <p className="text-xs text-gray-400 mt-1">Manage system master configurations and parameters.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="glow-btn-primary flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
        >
          <Plus size={18} /> Add Record
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-xl">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#0b0f19]/40 border border-white/5 focus:border-cyan-500/30 rounded-lg text-gray-200 outline-none transition"
          />
        </div>
      </div>

      {/* Grid Table */}
      <div className="glass-panel border border-white/5 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] text-gray-400 uppercase tracking-wider">
                {schema.fields.map(f => (
                  <th key={f.key} className="p-4 font-semibold">{f.label}</th>
                ))}
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={schema.fields.length + 1} className="p-12 text-center text-gray-500">
                    <Loader className="animate-spin inline mr-2 text-cyan-400" size={16} />
                    Loading master entries...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={schema.fields.length + 1} className="p-12 text-center text-gray-500">
                    No matching master records found.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={row[schema.primaryKey] || idx} className="hover:bg-white/[0.01] transition-colors">
                    {schema.fields.map(f => {
                      let displayVal = row[f.key];
                      
                      // Format display for special input types
                      if (f.type === 'checkbox') {
                        displayVal = row[f.key] ? '✅' : '❌';
                      } else if (f.type === 'color') {
                        displayVal = (
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: row[f.key] }} />
                            <span className="font-mono text-[10px] text-gray-400">{row[f.key]}</span>
                          </div>
                        );
                      } else if (f.type === 'dynamic-select') {
                        // Find dynamic name from options loaded
                        const options = dropdownOptions[f.key] || [];
                        const opt = options.find(o => o.id === row[f.key]);
                        displayVal = opt ? opt.name : row[f.key];
                      }

                      return (
                        <td key={f.key} className="p-4 font-medium text-gray-200">
                          {displayVal === null || displayVal === undefined ? '-' : String(displayVal)}
                        </td>
                      );
                    })}
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(row)}
                          className="p-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded transition cursor-pointer"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(row[schema.primaryKey])}
                          className="p-1 bg-red-500/5 hover:bg-red-500/10 text-red-500 hover:text-red-400 rounded transition cursor-pointer"
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
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6 transform scale-100 transition-all duration-300">
            <h3 className="text-white font-bold text-lg mb-4">
              {editingId ? 'Edit Record' : 'Add New Record'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-1">
                {schema.fields
                  .filter(f => !f.hiddenInForm)
                  .map(field => {
                    const value = formData[field.key];
                    
                    return (
                      <div key={field.key} className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-400">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>

                        {/* TEXT / NUMBER */}
                        {(field.type === 'text' || field.type === 'number') && (
                          <input
                            type={field.type}
                            required={field.required}
                            value={value !== undefined ? value : ''}
                            onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                            className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200 bg-[#0f172a]"
                          />
                        )}

                        {/* STATIC SELECT */}
                        {field.type === 'static-select' && (
                          <select
                            required={field.required}
                            value={value !== undefined ? value : ''}
                            onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                            className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200 bg-[#0f172a]"
                          >
                            <option value="">Select...</option>
                            {(field.options || []).map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}

                        {/* DYNAMIC SELECT */}
                        {field.type === 'dynamic-select' && (
                          <select
                            required={field.required}
                            value={value !== undefined ? value : ''}
                            onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                            className="glass-input w-full px-3 py-2 rounded-lg text-xs text-gray-200 bg-[#0f172a]"
                          >
                            <option value="">Select...</option>
                            {(dropdownOptions[field.key] || []).map(opt => (
                              <option key={opt.id} value={opt.id}>{opt.name}</option>
                            ))}
                          </select>
                        )}

                        {/* COLOR */}
                        {field.type === 'color' && (
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              required={field.required}
                              value={value || '#000000'}
                              onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                              className="w-10 h-8 border-none bg-transparent cursor-pointer rounded overflow-hidden"
                            />
                            <span className="text-[10px] text-gray-400 font-mono">{value || '#000000'}</span>
                          </div>
                        )}

                        {/* CHECKBOX */}
                        {field.type === 'checkbox' && (
                          <label className="flex items-center gap-2 mt-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!value}
                              onChange={e => setFormData({ ...formData, [field.key]: e.target.checked })}
                              className="w-4 h-4 rounded bg-gray-800 border-gray-600 text-cyan-500 focus:ring-0"
                            />
                            <span className="text-xs text-gray-300">Active</span>
                          </label>
                        )}
                      </div>
                    );
                  })}
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
                  disabled={saving}
                  className="glow-btn-primary px-4 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader className="animate-spin" size={14} />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
