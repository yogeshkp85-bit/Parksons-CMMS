import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  ShieldCheck, 
  Wrench, 
  AlertTriangle,
  ClipboardList,
  Edit2,
  ThumbsUp,
  ThumbsDown,
  X
} from 'lucide-react';

interface LogItem {
  id: string;
  breakdownNumber: string;
  date: string;
  shift: { id: string; name: string };
  department: { id: string; name: string; code: string };
  machine: { id: string; name: string };
  unit?: { id: string; name: string } | null;
  category: { id: string; name: string };
  problemCategory: { id: string; name: string };
  problemDescription: string;
  startTime: string;
  endTime?: string | null;
  durationMin?: number | null;
  createdBy: { name: string };
  remarks?: string | null;
  actionTaken?: string | null;
  rootCause?: string | null;
}

interface MasterOption {
  id: string;
  name: string;
}

const STATIC_ROOT_CAUSE_CATEGORIES = [
  { id: 'Normal Wear & Tear', name: 'Normal Wear & Tear' },
  { id: 'Lack of Lubrication', name: 'Lack of Lubrication' },
  { id: 'Operator Negligence', name: 'Operator Negligence' },
  { id: 'Design Defect', name: 'Design Defect' },
  { id: 'Material Fatigue', name: 'Material Fatigue' },
  { id: 'External Factor', name: 'External Factor' },
  { id: 'Utility Trip', name: 'Utility Trip' }
];

const STATIC_ACTION_CATEGORIES = [
  { id: 'Part Replaced', name: 'Part Replaced' },
  { id: 'Component Calibrated', name: 'Component Calibrated' },
  { id: 'Temporary Repair', name: 'Temporary Repair' },
  { id: 'Overhauled', name: 'Overhauled' },
  { id: 'Lubricated & Cleaned', name: 'Lubricated & Cleaned' },
  { id: 'Wiring Fixed', name: 'Wiring Fixed' },
  { id: 'Reset System', name: 'Reset System' }
];

export const AdminApproval: React.FC = () => {
  const [pendingLogs, setPendingLogs] = useState<LogItem[]>([]);
  const [actionCategories] = useState<MasterOption[]>(STATIC_ACTION_CATEGORIES);
  const [rootCauseCategories] = useState<MasterOption[]>(STATIC_ROOT_CAUSE_CATEGORIES);
  
  // Selection/Editing states
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);
  const [actionCatId, setActionCatId] = useState('');
  const [actionDesc, setActionDesc] = useState('');
  const [rootCauseCatId, setRootCauseCatId] = useState('');
  const [rootCauseDesc, setRootCauseDesc] = useState('');
  const [logRemarks, setLogRemarks] = useState('');

  // UX states
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load reviews
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const pendingRes = await api.get('/breakdowns/pending');

      if (pendingRes.data?.data?.all) {
        const pendingItems = pendingRes.data.data.all
          .filter((item: any) => item.status === 'PENDING_REVIEW')
          .map((item: any) => ({
            id: item.refId,
            breakdownNumber: item.refId,
            date: item.date,
            shift: { id: item.shift, name: item.shift },
            department: { id: item.machineType, name: item.machineType, code: item.machineType },
            machine: { id: item.machineName, name: item.machineName },
            unit: item.unit ? { id: item.unit, name: item.unit } : null,
            category: { id: item.category, name: item.category },
            problemCategory: { id: item.problemType, name: item.problemType },
            problemDescription: item.description || '',
            startTime: item.timeStart || '',
            endTime: item.timeEnd || '',
            durationMin: item.duration ? parseInt(item.duration, 10) : 0,
            createdBy: { name: item.submittedBy || 'N/A' },
            remarks: item.remarks || '',
            actionTaken: item.actionTaken || '',
            rootCause: item.rootCause || ''
          }));
        setPendingLogs(pendingItems);
      }
    } catch (err) {
      console.error('Failed to load pending queue data', err);
      setError('Connection failure: Unable to download pending review dataset.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectLog = (log: LogItem) => {
    setSelectedLog(log);
    setActionCatId('');
    setActionDesc(log.actionTaken || '');
    setRootCauseCatId('');
    setRootCauseDesc(log.rootCause || '');
    setLogRemarks(log.remarks || '');
    setError(null);
  };

  const handleApprove = async () => {
    if (!selectedLog) return;
    setIsProcessing(true);
    setError(null);
    try {
      // 1. Save edits first via PUT /breakdowns/update
      await api.put('/breakdowns/update', {
        refId: selectedLog.id,
        actionTaken: actionDesc || undefined,
        rootCause: rootCauseDesc || undefined,
        remarks: logRemarks || undefined
      });

      // 2. Call approvals approve endpoint
      await api.post('/approvals/approve', {
        refId: selectedLog.id
      });
      
      setSuccessMsg(`Incident ${selectedLog.breakdownNumber} APPROVED successfully.`);
      setSelectedLog(null);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve incident.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedLog) return;
    setIsProcessing(true);
    setError(null);
    try {
      await api.post('/approvals/reject', {
        refId: selectedLog.id
      });
      
      setSuccessMsg(`Incident ${selectedLog.breakdownNumber} REJECTED successfully.`);
      setSelectedLog(null);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject incident.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-bold font-display text-gray-100 flex items-center gap-2">
            <ClipboardList size={22} className="text-emerald-500" />
            <span>Admin Review Panel</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">Review active breakdowns, append details, and approve OEE logs.</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono">
          Pending Verification: {pendingLogs.length} entries
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-xs animate-fade-in">
          <ShieldCheck size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-xs animate-fade-in">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Pending Table + Editing Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pending Table */}
        <div className="glass-panel rounded-2xl border-white/5 lg:col-span-2 overflow-hidden flex flex-col min-h-[400px]">
          <div className="px-6 py-4 border-b border-white/5 bg-[#0f172a]/10">
            <h3 className="text-xs font-bold font-display text-gray-300 uppercase tracking-wider">
              Pending Log Queue
            </h3>
          </div>

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-xs text-gray-500 font-mono">Loading pending log entries...</p>
            </div>
          ) : pendingLogs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-500 text-xs">
              <ShieldCheck size={40} className="text-emerald-500/30 mb-3" />
              <p>All breakdown log entries are reviewed. Zero items pending.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0f172a]/20 text-gray-400 font-semibold text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">Ref ID</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Equipment</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Attended By</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pendingLogs.map((log) => (
                    <tr 
                      key={log.id} 
                      className={`hover:bg-white/2 cursor-pointer transition-colors ${
                        selectedLog?.id === log.id ? 'bg-emerald-500/5' : ''
                      }`}
                      onClick={() => handleSelectLog(log)}
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-gray-300">{log.breakdownNumber}</td>
                      <td className="py-3 px-3 text-gray-400">{new Date(log.date).toLocaleDateString('en-GB')}</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-gray-200">{log.machine.name}</span>
                        <span className="block text-[9px] text-gray-500">{log.unit?.name || 'Whole Machine'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-500/20">
                          {log.category.name}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-gray-200">
                        {log.durationMin ? `${log.durationMin} mins` : '--'}
                      </td>
                      <td className="py-3 px-3 text-gray-400">{log.createdBy.name}</td>
                      <td className="py-3 px-4 text-right">
                        <button className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 cursor-pointer">
                          <Edit2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Editing / Approval Sidebar Card */}
        <div className="glass-panel rounded-2xl border-white/5 p-6 flex flex-col justify-between min-h-[400px]">
          {selectedLog ? (
            <div className="space-y-5 animate-fade-in flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h4 className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <Wrench size={14} className="text-emerald-400" />
                    <span>Review: {selectedLog.breakdownNumber}</span>
                  </h4>
                  <button 
                    onClick={() => setSelectedLog(null)}
                    className="text-gray-400 hover:text-gray-200 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Details list */}
                <div className="grid grid-cols-2 gap-3 text-[10px] text-gray-400 mt-4 border-b border-white/5 pb-3 font-mono">
                  <div>
                    <span className="block text-[8px] text-gray-500 uppercase tracking-wider">Date/Shift</span>
                    <span>{new Date(selectedLog.date).toLocaleDateString('en-GB')} ({selectedLog.shift.name})</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-gray-500 uppercase tracking-wider">Asset/Unit</span>
                    <span className="text-gray-300">{selectedLog.machine.name} - {selectedLog.unit?.name || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[8px] text-gray-500 uppercase tracking-wider">Problem Description</span>
                    <p className="text-xs text-gray-300 font-sans mt-0.5 line-clamp-2">{selectedLog.problemDescription}</p>
                  </div>
                </div>

                {/* Approvals inputs */}
                <div className="space-y-4 mt-4">
                  {/* Root Cause Category */}
                  <div>
                    <label className="block text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Root Cause Category
                    </label>
                    <select
                      value={rootCauseCatId}
                      onChange={(e) => setRootCauseCatId(e.target.value)}
                      className="glass-input px-3 py-1.5 block w-full rounded-lg text-xs text-gray-200 bg-transparent cursor-pointer"
                    >
                      <option value="" className="bg-slate-950 text-gray-500">Select Root Cause Category</option>
                      {rootCauseCategories.map((rc) => (
                        <option key={rc.id} value={rc.id} className="bg-slate-950 text-gray-200">
                          {rc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Root Cause Description */}
                  <div>
                    <label className="block text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Root Cause Details
                    </label>
                    <textarea
                      rows={2}
                      value={rootCauseDesc}
                      onChange={(e) => setRootCauseDesc(e.target.value)}
                      placeholder="e.g. Wear and tear on bearings, voltage spike..."
                      className="glass-input px-3 py-1.5 block w-full rounded-lg text-xs text-gray-200"
                    />
                  </div>

                  {/* Action Taken Category */}
                  <div>
                    <label className="block text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Action Taken Category
                    </label>
                    <select
                      value={actionCatId}
                      onChange={(e) => setActionCatId(e.target.value)}
                      className="glass-input px-3 py-1.5 block w-full rounded-lg text-xs text-gray-200 bg-transparent cursor-pointer"
                    >
                      <option value="" className="bg-slate-950 text-gray-500">Select Action Taken Category</option>
                      {actionCategories.map((at) => (
                        <option key={at.id} value={at.id} className="bg-slate-950 text-gray-200">
                          {at.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Taken Description */}
                  <div>
                    <label className="block text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Action Taken Details
                    </label>
                    <textarea
                      rows={2}
                      value={actionDesc}
                      onChange={(e) => setActionDesc(e.target.value)}
                      placeholder="e.g. Replaced bearing, re-wired thermal sensor..."
                      className="glass-input px-3 py-1.5 block w-full rounded-lg text-xs text-gray-200"
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleReject}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                >
                  <ThumbsDown size={14} />
                  Reject Log
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleApprove}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold text-white glow-btn-primary rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <ThumbsUp size={14} />
                      Approve Log
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 text-xs p-6">
              <ClipboardList size={30} className="text-gray-600 mb-2" />
              <p>Select a pending incident row from the queue to start reviewing.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
