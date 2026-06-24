import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '../../services/api';


export const PMCompliance: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    fetchCompliance();
  }, []);

  const fetchCompliance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pm/compliance');
      setData(res.data?.data);
    } catch (err) {
      alert('Failed to load compliance data', 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white">Compliance Analytics</h2>
        <p className="text-sm text-gray-400">Track and monitor Preventive Maintenance execution rates.</p>
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
                        <td className="p-3">{s.pmTask?.name || 'Unknown'}</td>
                        <td className="p-3 text-cyan-400">{s.machine?.name || 'Unknown'}</td>
                        <td className="p-3 text-right font-bold text-rose-400">{diffDays} Days</td>
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
    </div>
  );
};
