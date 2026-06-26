import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  enqueueOffline,
  flushOfflineQueue,
  getOfflineQueueCount,
  registerOnlineListener
} from '../services/offlineQueue';
import { 
  Calendar, 
  Clock, 
  Wrench, 
  Settings, 
  AlertTriangle, 
  CheckCircle,
  Briefcase,
  User,
  Users,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  WifiOff,
  X,
  Check
} from 'lucide-react';
import {
  MACHINES,
  DEPARTMENTS,
  getMachineNames,
  getUnits,
  TECHNICIANS as MASTER_TECHNICIANS,
  SHIFTS as MASTER_SHIFTS,
  PROBLEM_TYPES,
  CATEGORIES as MASTER_CATEGORIES,
  detectCurrentShift,
  isTimeValidForShift,
  type ShiftConfig,
} from '../config/masterConfig';

// Machine/department/shift types come from masterConfig.ts

export const BreakdownEntry: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Helper: current time string HH:MM
  const getCurrentTimeString = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  };

  // Use masterConfig shift detection (mirrors Form.html logic exactly)
  const initDetails = detectCurrentShift();

  // Master lists now come from masterConfig — no state needed, they are constants
  // Cascading state: machine names and units derive from selected department/machine
  const [machineNames, setMachineNames] = useState<string[]>([]);
  const [unitList, setUnitList] = useState<string[]>([]);

  // Form input states
  const [date, setDate] = useState(initDetails.shiftDateStr);
  const [shiftId, setShiftId] = useState(initDetails.shiftId);
  const [timeStart, setTimeStart] = useState(getCurrentTimeString);
  const [shiftTimeError, setShiftTimeError] = useState<string | null>(null);
  
  // Support for 24hr/48hr+ multi-day breakdowns
  const [dateEnd, setDateEnd] = useState(initDetails.shiftDateStr);
  const [timeEnd, setTimeEnd] = useState('');
  
  const [departmentId, setDepartmentId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [unitId, setUnitId] = useState('');
  
  const [problemCategoryId, setProblemCategoryId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [actionTakenDescription, setActionTakenDescription] = useState('');
  const [rootCauseDescription, setRootCauseDescription] = useState('');
  
  const [attendedBy, setAttendedBy] = useState('');
  const [additionalTeam, setAdditionalTeam] = useState<string[]>([]); // Multiple co-workers
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [submittedBy, setSubmittedBy] = useState('');
  const [spareConsumed, setSpareConsumed] = useState(''); // Free text; will link to spare module later
  const [problemReported, setProblemReported] = useState(''); // Step 5: Problem Reported field
  const [remarks, setRemarks] = useState('');

  // Offline queue state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(getOfflineQueueCount);

  // Auto detect shift text banner
  const shiftBannerText = (() => {
    const parts = initDetails.shiftDateStr.split('-');
    const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    const shiftDef = MASTER_SHIFTS.find(s => s.id === initDetails.shiftId);
    return `Auto-detected: ${shiftDef?.name || 'Third Shift'} based on current time — Shift Date: ${formattedDate}`;
  })();

  // Master data now comes from masterConfig.ts — no local static lists needed

  // On mount: preselect defaults from masterConfig (no API call needed for master data)
  useEffect(() => {
    // Default problem type and category
    setProblemCategoryId(PROBLEM_TYPES[0]);
    setCategoryId(MASTER_CATEGORIES[0]);

    // Preselect logged-in user's name if it matches a technician
    if (user?.name) {
      const matchedTech = MASTER_TECHNICIANS.find(t => t.toLowerCase() === user.name.toLowerCase());
      if (matchedTech) {
        setSubmittedBy(matchedTech);
        setAttendedBy(matchedTech);
        localStorage.setItem('ppl_lastSubmittedBy', matchedTech);
      }
    } else {
      const saved = localStorage.getItem('ppl_lastSubmittedBy');
      if (saved && MASTER_TECHNICIANS.includes(saved)) setSubmittedBy(saved);
    }

    setIsLoadingMetadata(false);
  }, [user]);

  // Offline queue: monitor connectivity and flush queue when back online
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineQueue().then(({ sent }) => {
        if (sent > 0) setOfflineCount(0);
      });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // UX helper: Auto-advance Date End when Date Start changes
  const handleStartDateChange = (val: string) => {
    setDate(val);
    setDateEnd(val);
  };

  // Bug 2 fix: Validate start time against selected shift (S1: 07–14:59, S2: 15–22:59, S3: 23:xx or 00-06:59)
  const handleTimeStartChange = (val: string) => {
    setTimeStart(val);
    if (shiftId && val && !isTimeValidForShift(shiftId, val)) {
      const shiftDef = MASTER_SHIFTS.find(s => s.id === shiftId);
      if (shiftId === 'SHIFT_3') {
        setShiftTimeError('Third Shift start time must be 23:00–23:59 or 00:00–06:59');
      } else {
        setShiftTimeError(`Start time for ${shiftDef?.name} must be ${shiftDef?.startTimeMin} – ${shiftDef?.startTimeMax}`);
      }
    } else {
      setShiftTimeError(null);
    }
  };

  // Clear shift time error when shift changes
  const handleShiftChange = (val: string) => {
    setShiftId(val);
    setShiftTimeError(null);
    // Re-validate current timeStart against new shift
    if (timeStart && val && !isTimeValidForShift(val, timeStart)) {
      const shiftDef = MASTER_SHIFTS.find(s => s.id === val);
      setShiftTimeError(val === 'SHIFT_3'
        ? 'Third Shift start time must be 23:00–23:59 or 00:00–06:59'
        : `Start time for ${shiftDef?.name} must be ${shiftDef?.startTimeMin} – ${shiftDef?.startTimeMax}`
      );
    }
  };

  // Cascading: Department → Machine Names (from masterConfig, instant, no API)
  useEffect(() => {
    if (departmentId) {
      setMachineNames(getMachineNames(departmentId));
    } else {
      setMachineNames([]);
    }
    setMachineId('');
    setUnitId('');
    setUnitList([]);
  }, [departmentId]);

  // Cascading: Machine Name → Units (from masterConfig, instant, no API)
  useEffect(() => {
    if (departmentId && machineId) {
      const units = getUnits(departmentId, machineId);
      // Always clear first (fixes Bug 5 — repeated unit lists)
      setUnitList([]);
      setUnitId('');
      // Then set fresh list
      setUnitList(units);
      if (units.length === 1) setUnitId(units[0]);
    } else {
      setUnitList([]);
      setUnitId('');
    }
  }, [machineId, departmentId]);

  // Duration calculation
  const getCalculatedDurationInfo = () => {
    if (!date || !timeStart || !dateEnd || !timeEnd) {
      return { text: 'Enter start and end date/time', minutes: 0 };
    }
    const startObj = new Date(`${date}T${timeStart}:00`);
    const endObj = new Date(`${dateEnd}T${timeEnd}:00`);
    const diffMs = endObj.getTime() - startObj.getTime();
    const diffMin = Math.round(diffMs / 60000);

    if (isNaN(diffMin)) {
      return { text: 'Invalid date/time inputs', minutes: 0 };
    }
    if (diffMin <= 0) {
      return { text: 'End date/time must be after start date/time', minutes: 0 };
    }

    const days = Math.floor(diffMin / 1440);
    const hours = Math.floor((diffMin % 1440) / 60);
    const mins = diffMin % 60;

    let label = '';
    if (days > 0) label += `${days} day${days > 1 ? 's' : ''} `;
    if (hours > 0) label += `${hours} hr `;
    label += `${mins} min`;

    return { text: `${label} (${diffMin} minutes)`, minutes: diffMin };
  };

  const durationInfo = getCalculatedDurationInfo();

  // Progress calculations (16 required fields including new ones)
  const totalRequired = 16; 
  const doneCount = [
    !!date,
    !!shiftId,
    !!timeStart,
    !!dateEnd,
    !!timeEnd,
    !!departmentId,
    !!machineId,
    (unitList.length === 0 || !!unitId),
    !!problemCategoryId,
    !!categoryId,
    !!attendedBy,
    !!submittedBy,
    problemDescription.trim().length >= 5,
    actionTakenDescription.trim().length >= 5,
    problemReported.trim().length >= 3,   // Step 5: Problem Reported
    true                                   // spareConsumed is optional
  ].filter(Boolean).length;

  const percentComplete = Math.round((doneCount / totalRequired) * 100);

  // Steps matching Form.html progress indicators (mapped to 14 total checks)
  const step1Done = doneCount >= 3;
  const step2Done = doneCount >= 6;
  const step3Done = doneCount >= 10;
  const step4Done = doneCount >= 14;

  // Active shift object helper for header badge
  const activeShift = MASTER_SHIFTS.find(s => s.id === shiftId);
  const getShiftBadgeClass = () => {
    if (!activeShift) return 'bg-slate-800 border-slate-700 text-slate-400';
    if (activeShift && activeShift.name.includes('First')) return 'bg-sky-500/10 border-sky-500/20 text-sky-400';
    if (activeShift && activeShift.name.includes('Second')) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    return 'bg-violet-500/10 border-violet-500/20 text-violet-400';
  };

  // UX states
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successRef, setSuccessRef] = useState('-');

  const handleClearForm = () => {
    const currentDetails = detectCurrentShift();
    setDate(currentDetails.shiftDateStr);
    setDateEnd(currentDetails.shiftDateStr);
    setShiftId(currentDetails.shiftId);
    setShiftTimeError(null);
    setTimeStart(getCurrentTimeString());
    setTimeEnd('');
    setDepartmentId('');
    setMachineId('');
    setUnitId('');
    setProblemCategoryId(problemCategories[0]?.id || '');
    
    const bdCat = categories.find(c => c.name === 'Breakdown');
    setCategoryId(bdCat?.id || categories[0]?.id || '');
    
    setProblemDescription('');
    setActionTakenDescription('');
    setRootCauseDescription('');
    setProblemReported('');
    setSpareConsumed('');
    setAdditionalTeam([]);
    setRemarks('');
    setError(null);

    if (user?.name && technicians.length > 0) {
      const matchedTech = technicians.find(t => t.toLowerCase() === user.name.toLowerCase());
      if (matchedTech) {
        setSubmittedBy(matchedTech);
        setAttendedBy(matchedTech);
      } else {
        setSubmittedBy('');
        setAttendedBy('');
      }
    } else {
      const savedSubmittedBy = localStorage.getItem('ppl_lastSubmittedBy');
      if (savedSubmittedBy && technicians.includes(savedSubmittedBy)) {
        setSubmittedBy(savedSubmittedBy);
      } else {
        setSubmittedBy('');
      }
      setAttendedBy('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation matching Form.html
    const errors: string[] = [];
    if (!date) errors.push('Start Date is required');
    if (!shiftId) errors.push('Shift is required');
    if (!timeStart) errors.push('Start time is required');
    if (!dateEnd) errors.push('End Date is required');
    if (!timeEnd) errors.push('End time is required');
    if (!departmentId) errors.push('Machine Type is required');
    if (!machineId) errors.push('Machine Name is required');
    if (unitList.length > 0 && !unitId) errors.push('Unit / Section is required');
    if (!problemCategoryId) errors.push('Type of Problem is required');
    if (!categoryId) errors.push('Category is required');
    if (!attendedBy) errors.push('Attended By is required');
    if (!submittedBy) errors.push('Submitted By is required');

    if (problemReported.trim().length < 3) {
      errors.push('Problem Reported is required (min 3 chars)');
    }
    if (problemDescription.trim().length < 5) {
      errors.push('Description of Problem is required (min 5 chars)');
    }
    if (actionTakenDescription.trim().length < 5) {
      errors.push('Action Taken is required (min 5 chars)');
    }

    if (date && timeStart && dateEnd && timeEnd) {
      const startObj = new Date(`${date}T${timeStart}:00`);
      const endObj = new Date(`${dateEnd}T${timeEnd}:00`);
      if (endObj.getTime() <= startObj.getTime()) {
        errors.push('End date/time must be after start date/time');
      }
    }

    if (shiftTimeError) {
      errors.push(shiftTimeError);
    }

    if (errors.length > 0) {
      setError(errors.join(' | '));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedTimeStart = timeStart.includes(':') && timeStart.split(':').length === 2 ? `${timeStart}:00` : timeStart;
      const formattedTimeEnd = timeEnd.includes(':') && timeEnd.split(':').length === 2 ? `${timeEnd}:00` : timeEnd;

      const payload = {
        date: date,
        shift: shiftId,
        machineType: departmentId,
        machineName: machineId,
        unit: unitId,
        problemType: problemCategoryId,
        category: categoryId,
        problemReported: problemReported.trim(),
        description: problemDescription.trim(),
        actionTaken: actionTakenDescription.trim(),
        rootCause: rootCauseDescription.trim() || null,
        timeStart: formattedTimeStart,
        timeEnd: formattedTimeEnd,
        dateEnd: dateEnd,
        durationMin: String(durationInfo.minutes),
        attendedBy,
        additionalTeam: additionalTeam.join(', ') || null, // "Sandip, Ravi, Krishna"
        submittedBy,
        spareConsumed: spareConsumed.trim() || null,  // e.g. "Bearing 6205 x2, Belt B-68 x1"
        remarks: remarks.trim() || null
      };

      // If offline, save to queue and show success without API call
      if (!isOnline) {
        enqueueOffline(payload);
        setOfflineCount(getOfflineQueueCount());
        setSuccessRef('OFFLINE-QUEUED');
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsSubmitting(false);
        return;
      }

      const response = await api.post('/breakdowns/create', payload);

      if (response.data?.data) {
        setSuccessRef(response.data.data.refId || '-');
      }

      // Save submission preference locally
      localStorage.setItem('ppl_lastSubmittedBy', submittedBy);

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to submit the incident log.';
      setError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto py-12 animate-fade-in">
        <div className="glass-panel p-8 rounded-2xl border-emerald-500/20 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-6 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <CheckCircle size={36} />
          </div>
          <h2 className="text-xl font-bold font-display text-gray-100 mb-2">Submitted Successfully!</h2>
          <p className="text-gray-400 text-xs leading-relaxed mb-4">
            Your maintenance log has been recorded under status <strong className="text-amber-400">PENDING_REVIEW</strong>. It will appear in the review sheet shortly.
          </p>
          
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 mb-6 text-left">
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Reference ID</div>
            <div className="text-sm font-mono font-bold text-emerald-400 mt-1">{successRef}</div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setSuccess(false);
                handleClearForm();
              }}
              className="w-full py-2.5 rounded-lg text-xs font-semibold text-white glow-btn-primary cursor-pointer"
            >
              + Submit Another Entry
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-white/5 cursor-pointer transition-colors"
            >
              Go to Dashboard Overview
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-2 animate-fade-in">
      
      {/* HEADER */}
      <div className="glass-panel p-4 rounded-t-2xl border-b border-white/5 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Wrench size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold font-display text-gray-100 leading-tight">Maintenance Log Entry</h1>
            <p className="text-[10px] text-gray-400">Parksons Packaging &mdash; FO/PRO-32</p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getShiftBadgeClass()}`}>
          {activeShift ? activeShift.name : '-'}
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="glass-panel p-4 border-t-0 border-b border-white/5 bg-[#0f172a]/20">
        <div className="flex gap-1.5 mb-2">
          <div className={`flex-1 h-1 rounded-full transition-colors duration-300 ${step1Done ? 'bg-emerald-500' : percentComplete > 10 ? 'bg-cyan-500' : 'bg-slate-800'}`} />
          <div className={`flex-1 h-1 rounded-full transition-colors duration-300 ${step2Done ? 'bg-emerald-500' : percentComplete > 35 ? 'bg-cyan-500' : 'bg-slate-800'}`} />
          <div className={`flex-1 h-1 rounded-full transition-colors duration-300 ${step3Done ? 'bg-emerald-500' : percentComplete > 70 ? 'bg-cyan-500' : 'bg-slate-800'}`} />
          <div className={`flex-1 h-1 rounded-full transition-colors duration-300 ${step4Done ? 'bg-emerald-500' : percentComplete >= 100 ? 'bg-cyan-500' : 'bg-slate-800'}`} />
        </div>
        <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
          <span>{percentComplete}% complete</span>
          <span>{doneCount} / {totalRequired} fields completed</span>
        </div>
      </div>

      {/* OFFLINE BANNER */}
      {!isOnline && (
        <div className="my-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl flex items-center gap-2.5 text-xs animate-fade-in">
          <WifiOff size={14} className="shrink-0" />
          <span>You are offline. Submission will be saved locally and auto-synced when connection restores.</span>
        </div>
      )}
      {isOnline && offlineCount > 0 && (
        <div className="my-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl flex items-center gap-2.5 text-xs animate-fade-in">
          <Check size={14} className="shrink-0" />
          <span>Back online — {offlineCount} queued {offlineCount === 1 ? 'entry' : 'entries'} will sync automatically.</span>
        </div>
      )}

      {/* ERROR NOTICE */}
      {error && (
        <div className="my-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-start gap-2.5 text-xs animate-fade-in">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span className="leading-normal">{error}</span>
        </div>
      )}

      {/* LOADING STATE */}
      {isLoadingMetadata ? (
        <div className="glass-panel rounded-b-2xl border-t-0 p-12 flex flex-col items-center justify-center min-h-[300px]">
          <RefreshCw size={24} className="text-emerald-500 animate-spin mb-3" />
          <p className="text-[10px] text-gray-500 font-mono">Loading entry form models...</p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>

          {/* SECTION 1: WHEN */}
          <div className="glass-panel border-t-0 p-5 space-y-4 shadow-md">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 border-b border-white/5 pb-2 uppercase tracking-wider font-mono">
              <Calendar size={13} className="text-emerald-500" />
              <span>When</span>
            </div>

            {/* Shift auto-detect banner */}
            <div className="bg-sky-950/20 border border-sky-500/15 rounded-xl p-3 flex items-start gap-2 text-[10px] text-sky-400 leading-normal">
              <Clock size={14} className="shrink-0 mt-0.5" />
              <span>{shiftBannerText}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="glass-input px-3 py-2.5 block w-full rounded-lg text-xs text-gray-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                  Shift <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={shiftId}
                  onChange={(e) => handleShiftChange(e.target.value)}
                  className="glass-input px-3 py-2.5 block w-full rounded-lg text-xs text-gray-200 appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select shift</option>
                  {MASTER_SHIFTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                  Time Start <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={timeStart}
                  onChange={(e) => handleTimeStartChange(e.target.value)}
                  className={`glass-input px-3 py-2.5 block w-full rounded-lg text-xs text-gray-200 ${shiftTimeError ? 'border-red-500/50' : ''}`}
                />
                {shiftTimeError && (
                  <p className="text-[9px] text-red-400 mt-1 font-mono">{shiftTimeError}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                  Time End <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={timeEnd}
                  onChange={(e) => setTimeEnd(e.target.value)}
                  className="glass-input px-3 py-2.5 block w-full rounded-lg text-xs text-gray-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="glass-input px-3 py-2.5 block w-full rounded-lg text-xs text-gray-200"
              />
              <div className="text-[9px] text-gray-500 mt-1 font-mono">
                Allows entering downtime events carrying over 24 hrs to 48 hrs+.
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 font-mono">
                Calculated Downtime Duration
              </label>
              <div className="bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3 text-center text-xs font-mono font-bold text-amber-400">
                {durationInfo.text}
              </div>
            </div>
          </div>

          {/* SECTION 2: MACHINE */}
          <div className="glass-panel p-5 space-y-4 shadow-md">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 border-b border-white/5 pb-2 uppercase tracking-wider font-mono">
              <Settings size={13} className="text-emerald-500" />
              <span>Machine</span>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                Machine Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="glass-input px-3 py-2.5 block w-full rounded-lg text-xs text-gray-200 appearance-none cursor-pointer"
              >
                <option value="" disabled>Select machine type / department</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                Machine Name <span className="text-red-500">*</span>
              </label>
              <select
                required
                disabled={!departmentId}
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                className="glass-input px-3 py-2.5 block w-full rounded-lg text-xs text-gray-200 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  {departmentId ? 'Select machine name' : 'Select machine type first'}
                </option>
                {machineNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                Unit / Section <span className="text-red-500">*</span>
              </label>
              <select
                required={unitList.length > 0}
                disabled={!machineId || unitList.length === 0}
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="glass-input px-3 py-2.5 block w-full rounded-lg text-xs text-gray-200 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  {!machineId ? 'Select machine name first' : unitList.length === 0 ? 'No units defined' : 'Select unit / section'}
                </option>
                {unitList.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SECTION 3: PROBLEM DETAILS */}
          <div className="glass-panel p-5 space-y-4 shadow-md">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 border-b border-white/5 pb-2 uppercase tracking-wider font-mono">
              <Briefcase size={13} className="text-emerald-500" />
              <span>Problem Details</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                  Type of Problem <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={problemCategoryId}
                  onChange={(e) => setProblemCategoryId(e.target.value)}
                  className="glass-input px-3 py-2.5 block w-full rounded-lg text-xs text-gray-200 appearance-none bg-slate-900 cursor-pointer"
                >
                  <option value="" disabled>Select problem type</option>
                  {PROBLEM_TYPES.map((pt) => (
                    <option key={pt} value={pt}>{pt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="glass-input px-3 py-2.5 block w-full rounded-lg text-xs text-gray-200 appearance-none bg-slate-900 cursor-pointer"
                >
                  <option value="" disabled>Select category</option>
                  {MASTER_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-semibold text-gray-300 uppercase tracking-wide">
                  Description of Problem <span className="text-red-500">*</span>
                </label>
                <span className={`text-[9px] font-mono ${problemDescription.length > 270 ? 'text-red-400' : 'text-gray-500'}`}>
                  {problemDescription.length} / 300
                </span>
              </div>
              <textarea
                required
                rows={3}
                maxLength={300}
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Describe what happened..."
                className="glass-input px-3 py-2 block w-full rounded-lg text-xs text-gray-200 resize-y"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-semibold text-gray-300 uppercase tracking-wide">
                  Action Taken <span className="text-red-500">*</span>
                </label>
                <span className={`text-[9px] font-mono ${actionTakenDescription.length > 270 ? 'text-red-400' : 'text-gray-500'}`}>
                  {actionTakenDescription.length} / 300
                </span>
              </div>
              <textarea
                required
                rows={3}
                maxLength={300}
                value={actionTakenDescription}
                onChange={(e) => setActionTakenDescription(e.target.value)}
                placeholder="What was done to fix it..."
                className="glass-input px-3 py-2 block w-full rounded-lg text-xs text-gray-200 resize-y"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-semibold text-gray-300 uppercase tracking-wide">
                  Root Cause of Problem
                </label>
                <span className={`text-[9px] font-mono ${rootCauseDescription.length > 180 ? 'text-red-400' : 'text-gray-500'}`}>
                  {rootCauseDescription.length} / 200
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={200}
                value={rootCauseDescription}
                onChange={(e) => setRootCauseDescription(e.target.value)}
                placeholder="Root cause (if identified)..."
                className="glass-input px-3 py-2 block w-full rounded-lg text-xs text-gray-200 resize-y"
              />
            </div>
          </div>

          {/* SECTION 4: TIME, TEAM & RESOURCES */}
          <div className="glass-panel p-5 space-y-4 shadow-md">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 border-b border-white/5 pb-2 uppercase tracking-wider font-mono">
              <User size={13} className="text-emerald-500" />
              <span>Team & Resources</span>
            </div>

            {/* Primary Attended By */}
            <div>
              <label className="block text-[10px] font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                Attended By (Primary) <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={attendedBy}
                onChange={(e) => setAttendedBy(e.target.value)}
                className="glass-input px-3 py-2.5 block w-full rounded-lg text-xs text-gray-200 appearance-none bg-slate-900 cursor-pointer"
              >
                <option value="" disabled>Select primary technician</option>
                {MASTER_TECHNICIANS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Additional Team Members */}
            <div>
              <label className="block text-[10px] font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                Additional Team Members <span className="text-[9px] text-gray-500 font-sans normal-case font-normal">(optional — for PM or multi-person jobs)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowTeamModal(true)}
                className="w-full glass-input px-3 py-2.5 rounded-lg text-xs text-left flex items-center justify-between gap-2 cursor-pointer hover:border-emerald-500/30 transition-colors"
              >
                <span className={additionalTeam.length > 0 ? 'text-gray-200' : 'text-gray-500'}>
                  {additionalTeam.length > 0
                    ? additionalTeam.join(', ')
                    : 'Tap to select co-workers...'}
                </span>
                <Users size={13} className="text-gray-500 shrink-0" />
              </button>
              {additionalTeam.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {additionalTeam.map((name) => (
                    <span key={name} className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full">
                      {name}
                      <button type="button" onClick={() => setAdditionalTeam(prev => prev.filter(n => n !== name))}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submitted By */}
            <div>
              <label className="block text-[10px] font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                Submitted By <span className="text-red-500">*</span> <span className="text-[9px] text-gray-500 font-sans normal-case font-normal">(your name)</span>
              </label>
              <select
                required
                value={submittedBy}
                onChange={(e) => setSubmittedBy(e.target.value)}
                className="glass-input px-3 py-2.5 block w-full rounded-lg text-xs text-gray-200 appearance-none bg-slate-900 cursor-pointer"
              >
                <option value="" disabled>Select your name</option>
                {MASTER_TECHNICIANS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Spare Consumed */}
            <div>
              <label className="block text-[10px] font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                Spare Parts Consumed <span className="text-[9px] text-gray-500 font-sans normal-case font-normal">(optional — free text, e.g. Bearing 6205 x2)</span>
              </label>
              <input
                type="text"
                value={spareConsumed}
                onChange={(e) => setSpareConsumed(e.target.value)}
                placeholder="e.g. Bearing 6205 x2, V-Belt B-68 x1, Relay 24V x1"
                className="glass-input px-3 py-2.5 block w-full rounded-lg text-xs text-gray-200"
              />
              <p className="text-[9px] text-gray-500 mt-1 font-mono">Will link to Spare Parts module in future release.</p>
            </div>
          </div>

          {/* SECTION 5: PROBLEM REPORTED, ACTION & ROOT CAUSE */}
          <div className="glass-panel p-5 space-y-4 shadow-md">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 border-b border-white/5 pb-2 uppercase tracking-wider font-mono">
              <Briefcase size={13} className="text-emerald-500" />
              <span>Problem, Action & Resolution</span>
            </div>

            {/* Problem Reported */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-semibold text-gray-300 uppercase tracking-wide">
                  Problem Reported <span className="text-red-500">*</span>
                </label>
                <span className={`text-[9px] font-mono ${problemReported.length > 180 ? 'text-red-400' : 'text-gray-500'}`}>
                  {problemReported.length} / 200
                </span>
              </div>
              <textarea
                required
                rows={2}
                maxLength={200}
                value={problemReported}
                onChange={(e) => setProblemReported(e.target.value)}
                placeholder="What problem was reported by operator / supervisor..."
                className="glass-input px-3 py-2 block w-full rounded-lg text-xs text-gray-200 resize-y"
              />
            </div>

            {/* Action Taken */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-semibold text-gray-300 uppercase tracking-wide">
                  Action Taken <span className="text-red-500">*</span>
                </label>
                <span className={`text-[9px] font-mono ${actionTakenDescription.length > 270 ? 'text-red-400' : 'text-gray-500'}`}>
                  {actionTakenDescription.length} / 300
                </span>
              </div>
              <textarea
                required
                rows={3}
                maxLength={300}
                value={actionTakenDescription}
                onChange={(e) => setActionTakenDescription(e.target.value)}
                placeholder="What was done to fix it..."
                className="glass-input px-3 py-2 block w-full rounded-lg text-xs text-gray-200 resize-y"
              />
            </div>

            {/* Root Cause */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-semibold text-gray-300 uppercase tracking-wide">
                  Root Cause of Problem
                </label>
                <span className={`text-[9px] font-mono ${rootCauseDescription.length > 180 ? 'text-red-400' : 'text-gray-500'}`}>
                  {rootCauseDescription.length} / 200
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={200}
                value={rootCauseDescription}
                onChange={(e) => setRootCauseDescription(e.target.value)}
                placeholder="Root cause (if identified)..."
                className="glass-input px-3 py-2 block w-full rounded-lg text-xs text-gray-200 resize-y"
              />
            </div>

            {/* Additional Remarks */}
            <div>
              <label className="block text-[10px] font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                Additional Remarks <span className="text-[9px] text-gray-500 font-sans normal-case font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Any additional notes..."
                className="glass-input px-3 py-2 block w-full rounded-lg text-xs text-gray-200 resize-y"
              />
            </div>
          </div>

          {/* SUBMIT BUTTONS & LINKS */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white glow-btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              ) : (
                'Submit Maintenance Log'
              )}
            </button>

            <button
              type="button"
              onClick={handleClearForm}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-transparent hover:bg-red-500/5 text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/10 cursor-pointer transition-all"
            >
              Clear Form
            </button>

            {/* Permissions-based helper buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                to="/audit"
                className="py-2 px-3 border border-sky-500/20 hover:border-sky-500/40 bg-sky-500/5 hover:bg-sky-500/10 text-sky-400 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <span>🔓 Approval Panel</span>
                <ExternalLink size={10} />
              </Link>
              <Link
                to="/"
                className="py-2 px-3 border border-violet-500/20 hover:border-violet-500/40 bg-violet-500/5 hover:bg-violet-500/10 text-violet-400 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <span>📊 Back to Dashboard</span>
                <ChevronRight size={10} />
              </Link>
            </div>
          </div>

        </form>
      )}

      {/* TEAM SELECTION MODAL */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                <Users size={16} className="text-emerald-400" />
                Select Team Members
              </h3>
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="text-gray-400 hover:text-gray-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mb-3">Select all co-workers involved. Primary attended-by is separate.</p>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {MASTER_TECHNICIANS
                .filter((t: string) => t !== attendedBy && t !== submittedBy)
                .map((tech: string) => {
                  const isSelected = additionalTeam.includes(tech);
                  return (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => {
                        setAdditionalTeam(prev =>
                          isSelected ? prev.filter(n => n !== tech) : [...prev, tech]
                        );
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-colors text-left ${
                        isSelected
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                          : 'hover:bg-white/5 border border-transparent text-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600'
                      }`}>
                        {isSelected && <Check size={10} className="text-white" />}
                      </div>
                      {tech}
                    </button>
                  );
                })}
            </div>
            <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setAdditionalTeam([])}
                className="flex-1 py-2 text-xs text-gray-400 hover:text-gray-200 border border-white/5 rounded-lg cursor-pointer transition-colors"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-white glow-btn-primary rounded-lg cursor-pointer"
              >
                Confirm ({additionalTeam.length} selected)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
