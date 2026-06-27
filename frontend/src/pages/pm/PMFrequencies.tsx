import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Clock, Lock } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';


export const PMFrequencies: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.code === 'superadmin';
  const [frequencies, setFrequencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    intervalDays: 7
  });

  useEffect(() => {
    fetchFrequencies();
  }, []);

  const fetchFrequencies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pm/frequencies');
      if (res.data?.data) {
        setFrequencies(res.data.data);
      }
    } catch (err) {
      alert('Failed to fetch frequencies', 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (freq?: any) => {
    if (freq) {
      setEditId(freq.id);
      setFormData({ name: freq.name, code: freq.code, intervalDays: freq.intervalDays });
    } else {
      setEditId(null);
      setFormData({ name: '', code: '', intervalDays: 7 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/pm/frequencies/${editId}`, formData);
        alert('Frequency updated successfully', 'SUCCESS');
      } else {
        await api.post('/pm/frequencies', formData);
        alert('Frequency created successfully', 'SUCCESS');
      }
      setIsModalOpen(false);
      fetchFrequencies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save frequency', 'ERROR');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this frequency? It may affect existing tasks.')) return;
    try {
      await api.delete(`/pm/frequencies/${id}`);
      alert('Frequency deleted', 'SUCCESS');
      fetchFrequencies();
    } catch (err) {
      alert('Failed to delete frequency', 'ERROR');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Frequency Master</h2>
          <p className="text-sm text-gray-400">Manage recurrences for PM tasks</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
        >
          <Plus size={18} /> Add Frequency
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-8 text-center text-gray-500">Loading frequencies...</div>
        ) : frequencies.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 border border-white/5 rounded-xl border-dashed">
            No frequencies configured.
          </div>
        ) : (
          frequencies.map(freq => (
            <div key={freq.id} className="glass-panel p-4 rounded-xl border border-white/5 relative group hover:border-cyan-500/30 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{freq.name}</h3>
                    <p className="text-xs font-mono text-gray-500 mt-0.5">{freq.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(freq)} className="text-gray-400 hover:text-cyan-400 p-1">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(freq.id)} className="text-gray-400 hover:text-rose-400 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="text-sm text-gray-400">
                  Interval: <span className="text-amber-400 font-mono font-bold ml-1">{freq.intervalDays} Days</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-lg font-bold text-white">
                {editId ? 'Edit Frequency' : 'New Frequency'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. Weekly, Monthly"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Code</label>
                <input 
                  type="text" 
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-2.5 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. WK, MO, QTR"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Interval (Days)</label>
                <input 
                  type="number" 
                  min="1"
                  value={formData.intervalDays}
                  onChange={e => setFormData({...formData, intervalDays: Number(e.target.value)})}
                  className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white font-medium text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
                >
                  <Save size={16} /> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
