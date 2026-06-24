import React, { useState, useEffect } from 'react';
import { History, CalendarDays } from 'lucide-react';
import api from '../../services/api';

export const PMHistory: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/pm/schedules'); // Re-using schedules endpoint, but we filter for COMPLETED
      setHistory(data.filter((s: any) => s.status === 'COMPLETED'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">PM History</h1>
          <p className="text-sm text-gray-400 mt-1">Review previously executed preventive maintenance tasks.</p>
        </div>
      </div>

      <div className="glass-panel border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
              <th className="p-4">Machine</th>
              <th className="p-4">Task</th>
              <th className="p-4">Completed On</th>
              <th className="p-4">Completed By</th>
              <th className="p-4">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading history...</td></tr>
            ) : history.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No completed tasks found.</td></tr>
            ) : (
              history.map(s => (
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
                    <div className="flex items-center gap-1"><CalendarDays size={14}/> {new Date(s.completedAt).toLocaleDateString()}</div>
                  </td>
                  <td className="p-4 text-gray-300">
                    {s.completedBy?.name || s.completedBy?.email || 'System'}
                  </td>
                  <td className="p-4 text-gray-400 text-xs italic max-w-[200px] truncate">
                    {s.completionRemarks || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
