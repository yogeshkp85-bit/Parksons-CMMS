/**
 * MasterTable.tsx
 * Reusable table component for all Master Setup pages.
 * Handles: list display, search, add/edit modal, soft delete, restore.
 * Non-technical users (maintenance managers) can use this without training.
 */

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  Plus, Search, Edit2, Trash2, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, X, Save, RotateCcw
} from 'lucide-react';

export interface MasterField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean' | 'textarea';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  readOnly?: boolean;
  width?: string; // for table column width
}

interface Props {
  title: string;
  subtitle?: string;
  modelName: string;           // API model slug e.g. "technician"
  fields: MasterField[];       // columns and form fields
  nameField?: string;          // which field to use as display name (default: "name")
  showRestore?: boolean;       // show restore button for deleted records
}

interface Record {
  id: string;
  isActive?: boolean;
  deletedAt?: string | null;
  [key: string]: any;
}

export default function MasterTable({
  title, subtitle, modelName, fields, nameField = 'name', showRestore = true
}: Props) {
  const [records, setRecords] = useState<Record[]>([]);
  const [filtered, setFiltered] = useState<Record[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState<Record | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Show inactive toggle
  const [showInactive, setShowInactive] = useState(false);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/masters/${modelName}`);
      setRecords(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load records');
    } finally {
      setIsLoading(false);
    }
  }, [modelName]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  useEffect(() => {
    let data = records;
    if (!showInactive) data = data.filter(r => r.isActive !== false && !r.deletedAt);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(r =>
        fields.some(f => String(r[f.key] || '').toLowerCase().includes(q))
      );
    }
    setFiltered(data);
  }, [records, search, showInactive, fields]);

  const openCreate = () => {
    setEditRecord(null);
    const defaults: Record<string, any> = {};
    fields.forEach(f => { defaults[f.key] = ''; });
    setFormData(defaults);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (record: Record) => {
    setEditRecord(record);
    const data: Record<string, any> = {};
    fields.forEach(f => { data[f.key] = record[f.key] ?? ''; });
    setFormData(data);
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError(null);
    // Validate required fields
    const missing = fields.filter(f => f.required && !formData[f.key]);
    if (missing.length > 0) {
      setFormError(`Required: ${missing.map(f => f.label).join(', ')}`);
      return;
    }
    setIsSaving(true);
    try {
      if (editRecord) {
        await api.put(`/masters/${modelName}/${editRecord.id}`, formData);
        setSuccess(`${title} updated successfully`);
      } else {
        await api.post(`/masters/${modelName}`, formData);
        setSuccess(`${title} added successfully`);
      }
      setShowModal(false);
      fetchRecords();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (record: Record) => {
    if (!window.confirm(`Deactivate "${record[nameField]}"? It can be restored later.`)) return;
    try {
      await api.delete(`/masters/${modelName}/${record.id}`);
      setSuccess(`"${record[nameField]}" deactivated`);
      fetchRecords();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleRestore = async (record: Record) => {
    try {
      await api.put(`/masters/${modelName}/${record.id}/restore`);
      setSuccess(`"${record[nameField]}" restored`);
      fetchRecords();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('Restore failed');
    }
  };

  const activeCount  = records.filter(r => r.isActive !== false && !r.deletedAt).length;
  const totalCount   = records.length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-100">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          <div className="flex gap-3 mt-1">
            <span className="text-[10px] text-emerald-400 font-mono">{activeCount} active</span>
            {totalCount > activeCount && (
              <span className="text-[10px] text-gray-500 font-mono">{totalCount - activeCount} inactive</span>
            )}
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white glow-btn-primary rounded-lg cursor-pointer"
        >
          <Plus size={13} /> Add {title}
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-2 rounded-lg text-xs">
          <CheckCircle size={13} /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-xs">
          <AlertTriangle size={13} /> {error}
          <button onClick={() => setError(null)} className="ml-auto cursor-pointer"><X size={12} /></button>
        </div>
      )}

      {/* Search + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="glass-input pl-8 pr-3 py-2 w-full rounded-lg text-xs text-gray-200"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)}
            className="w-3 h-3"
          />
          Show inactive
        </label>
        <button
          onClick={fetchRecords}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 cursor-pointer px-2 py-1.5 rounded border border-white/5 hover:border-white/10"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-500 text-sm gap-2">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            {search ? `No results for "${search}"` : `No ${title.toLowerCase()} found. Click "+ Add" to create one.`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/30">
                  {fields.map(f => (
                    <th key={f.key} className="py-3 px-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      {f.label}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(record => {
                  const isActive = record.isActive !== false && !record.deletedAt;
                  return (
                    <tr key={record.id} className={`border-b border-white/5 hover:bg-white/2 transition-colors ${!isActive ? 'opacity-50' : ''}`}>
                      {fields.map(f => (
                        <td key={f.key} className="py-3 px-4 text-gray-300">
                          {f.type === 'boolean'
                            ? (record[f.key] ? <CheckCircle size={13} className="text-emerald-400" /> : <XCircle size={13} className="text-gray-600" />)
                            : f.type === 'date' && record[f.key]
                              ? new Date(record[f.key]).toLocaleDateString('en-IN')
                              : f.key === 'id' || (typeof record[f.key] === 'string' && record[f.key].length === 36 && record[f.key].includes('-') && f.key.toLowerCase().includes('id'))
                                ? <span className="font-mono text-[10px] text-gray-600" title={record[f.key]}>
                                    {String(record[f.key]).substring(0, 8)}...
                                  </span>
                                : String(record[f.key] ?? '—')}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-right">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-500'}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isActive ? (
                            <>
                              <button
                                onClick={() => openEdit(record)}
                                className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded cursor-pointer transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDelete(record)}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded cursor-pointer transition-colors"
                                title="Deactivate"
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          ) : showRestore && (
                            <button
                              onClick={() => handleRestore(record)}
                              className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded cursor-pointer transition-colors"
                              title="Restore"
                            >
                              <RotateCcw size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-gray-100">
                {editRecord ? `Edit ${title}` : `Add New ${title}`}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-200 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg flex items-center gap-2">
                <AlertTriangle size={12} /> {formError}
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {fields.filter(f => !f.readOnly).map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    {f.label} {f.required && <span className="text-red-400">*</span>}
                  </label>
                  {f.type === 'select' ? (
                    <select
                      value={formData[f.key] || ''}
                      onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="glass-input px-3 py-2 w-full rounded-lg text-xs text-gray-200 cursor-pointer"
                    >
                      <option value="" disabled>Select {f.label}</option>
                      {f.options?.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea
                      rows={3}
                      value={formData[f.key] || ''}
                      onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="glass-input px-3 py-2 w-full rounded-lg text-xs text-gray-200 resize-y"
                    />
                  ) : f.type === 'boolean' ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData[f.key]}
                        onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      <span className="text-xs text-gray-300">Yes</span>
                    </label>
                  ) : (
                    <input
                      type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                      value={formData[f.key] || ''}
                      onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder || f.label}
                      className="glass-input px-3 py-2 w-full rounded-lg text-xs text-gray-200"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-5 pt-4 border-t border-white/5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 text-xs text-gray-400 border border-white/10 rounded-lg cursor-pointer hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-2 text-xs font-semibold text-white glow-btn-primary rounded-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save size={12} />
                )}
                {editRecord ? 'Save Changes' : 'Add Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
