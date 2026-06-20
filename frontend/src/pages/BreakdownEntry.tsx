import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  Wrench, 
  Settings, 
  AlertTriangle, 
  CheckCircle,
  Briefcase,
  User,
  ExternalLink,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface Shift {
  id: string;
  name: string;
  code: string;
}

interface ProblemCategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface SubAssembly {
  id: string;
  name: string;
}

interface Machine {
  id: string;
  name: string;
  machineId: string;
  departmentId: string;
  subAssemblies: SubAssembly[];
}

export const BreakdownEntry: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Helper date/time functions
  const getDetectedDateAndShift = () => {
    const now = new Date();
    const h = now.getHours();
    let detectedShiftName = 'Third Shift';
    let shiftHoursText = '11 PM - 7 AM';
    let shiftDateObj = new Date(now);

    // If time is between 12:00 AM (midnight) and 6:59 AM, roll shift date to yesterday
    if (h < 7) {
      detectedShiftName = 'Third Shift';
      shiftHoursText = '11 PM - 7 AM';
      shiftDateObj.setDate(shiftDateObj.getDate() - 1);
    } else if (h >= 7 && h < 15) {
      detectedShiftName = 'First Shift';
      shiftHoursText = '7 AM - 3 PM';
    } else if (h >= 15 && h < 23) {
      detectedShiftName = 'Second Shift';
      shiftHoursText = '3 PM - 11 PM';
    }

    const y = shiftDateObj.getFullYear();
    const m = String(shiftDateObj.getMonth() + 1).padStart(2, '0');
    const d = String(shiftDateObj.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    return {
      dateStr,
      shiftName: detectedShiftName,
      hoursText: shiftHoursText
    };
  };

  const getCurrentTimeString = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const initDetails = getDetectedDateAndShift();

  // Master lists
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [problemCategories, setProblemCategories] = useState<ProblemCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allMachines, setAllMachines] = useState<Machine[]>([]);
  const [technicians, setTechnicians] = useState<string[]>([]);
  
  // Cascading states
  const [filteredMachines, setFilteredMachines] = useState<Machine[]>([]);
  const [filteredSubAssemblies, setFilteredSubAssemblies] = useState<SubAssembly[]>([]);
  
  // Form input states
  const [date, setDate] = useState(initDetails.dateStr);
  const [shiftId, setShiftId] = useState('');
  const [timeStart, setTimeStart] = useState(getCurrentTimeString);
  
  // Support for 24hr/48hr+ multi-day breakdowns
  const [dateEnd, setDateEnd] = useState(initDetails.dateStr);
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
  const [submittedBy, setSubmittedBy] = useState('');
  const [remarks, setRemarks] = useState('');

  // Auto detect shift text banner
  const shiftBannerText = (() => {
    const parts = initDetails.dateStr.split('-');
    const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    return `Auto-detected: ${initDetails.shiftName} (${initDetails.hoursText}) based on current time (Shift Date: ${formattedDate})`;
  })();


  // Load masters on mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const res = await api.get('/breakdowns/master-data');
        if (res.data?.data) {
          const { shifts, problemCategories, categories, departments, machines, technicians } = res.data.data;
          setShifts(shifts);
          setProblemCategories(problemCategories);
          setCategories(categories);
          setDepartments(departments);
          setAllMachines(machines);
          setTechnicians(technicians || []);

          // Match the detected shift name to its ID
          const matchedShift = shifts.find((s: Shift) => s.name.toLowerCase() === initDetails.shiftName.toLowerCase());
          if (matchedShift) {
            setShiftId(matchedShift.id);
          } else if (shifts.length > 0) {
            setShiftId(shifts[0].id);
          }

          // Preselect first Problem Type
          if (problemCategories.length > 0) setProblemCategoryId(problemCategories[0].id);
          
          // Preselect "Breakdown" category by default
          const bdCat = categories.find((c: any) => c.name === 'Breakdown');
          if (bdCat) setCategoryId(bdCat.id);
          else if (categories.length > 0) setCategoryId(categories[0].id);

          // Preselect user's name if they match a technician name
          if (user?.name && technicians) {
            const matchedTech = technicians.find((t: string) => t.toLowerCase() === user.name.toLowerCase());
            if (matchedTech) {
              setSubmittedBy(matchedTech);
              setAttendedBy(matchedTech);
              localStorage.setItem('ppl_lastSubmittedBy', matchedTech);
            }
          } else {
            const savedSubmittedBy = localStorage.getItem('ppl_lastSubmittedBy');
            if (savedSubmittedBy && technicians.includes(savedSubmittedBy)) {
              setSubmittedBy(savedSubmittedBy);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load breakdown master options', err);
        setError('Connection failure: Unable to fetch form master parameters.');
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchMasterData();
  }, [user]);

  // UX helper: Auto-advance Date End when Date Start changes
  const handleStartDateChange = (val: string) => {
    setDate(val);
    // If dateEnd was the same as the old date, advance it to match the new start date
    setDateEnd(val);
  };

  // Cascading Logic: Department (Machine Type) -> Machine Name
  useEffect(() => {
    if (departmentId) {
      const matched = allMachines.filter(m => m.departmentId === departmentId);
      setFilteredMachines(matched);
      setMachineId('');
      setUnitId('');
      setFilteredSubAssemblies([]);
    } else {
      setFilteredMachines([]);
      setMachineId('');
      setUnitId('');
      setFilteredSubAssemblies([]);
    }
  }, [departmentId, allMachines]);

  // Cascading Logic: Machine Name -> Unit / Section
  useEffect(() => {
    if (machineId) {
      const selectedMachine = filteredMachines.find(m => m.id === machineId);
      if (selectedMachine) {
        const subUnits = selectedMachine.subAssemblies || [];
        setFilteredSubAssemblies(subUnits);
        if (subUnits.length === 1) {
          setUnitId(subUnits[0].id);
        } else {
          setUnitId('');
        }
      } else {
        setFilteredSubAssemblies([]);
        setUnitId('');
      }
    } else {
      setFilteredSubAssemblies([]);
      setUnitId('');
    }
  }, [machineId, filteredMachines]);

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

  // Progress calculations (14 required fields including End Date/Time)
  const totalRequired = 14; 
  const doneCount = [
    !!date,
    !!shiftId,
    !!timeStart,
    !!dateEnd,
    !!timeEnd,
    !!departmentId,
    !!machineId,
    !!unitId,
    !!problemCategoryId,
    !!categoryId,
    !!attendedBy,
    !!submittedBy,
    problemDescription.trim().length >= 5,
    actionTakenDescription.trim().length >= 5
  ].filter(Boolean).length;

  const percentComplete = Math.round((doneCount / totalRequired) * 100);

  // Steps matching Form.html progress indicators (mapped to 14 total checks)
  const step1Done = doneCount >= 3;
  const step2Done = doneCount >= 6;
  const step3Done = doneCount >= 10;
  const step4Done = doneCount >= 14;

  // Active shift object helper for header badge
  const activeShift = shifts.find(s => s.id === shiftId);
  const getShiftBadgeClass = () => {
    if (!activeShift) return 'bg-slate-800 border-slate-700 text-slate-400';
    if (activeShift.name.includes('First')) return 'bg-sky-500/10 border-sky-500/20 text-sky-400';
    if (activeShift.name.includes('Second')) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    return 'bg-violet-500/10 border-violet-500/20 text-violet-400';
  };

  // UX states
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successRef, setSuccessRef] = useState('-');

  const handleClearForm = () => {
    const currentDetails = getDetectedDateAndShift();
    setDate(currentDetails.dateStr);
    setDateEnd(currentDetails.dateStr);
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
    if (!unitId) errors.push('Unit / Section is required');
    if (!problemCategoryId) errors.push('Type of Problem is required');
    if (!categoryId) errors.push('Category is required');
    if (!attendedBy) errors.push('Attended By is required');
    if (!submittedBy) errors.push('Submitted By is required');

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

    if (errors.length > 0) {
      setError(errors.join(' | '));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const startTimeISO = new Date(`${date}T${timeStart}:00`).toISOString();
      const endTimeISO = new Date(`${dateEnd}T${timeEnd}:00`).toISOString();

      const response = await api.post('/breakdowns', {
        date,
        shiftId,
        machineId,
        unitId,
        problemCategoryId,
        categoryId,
        problemDescription: problemDescription.trim(),
        actionTakenDescription: actionTakenDescription.trim(),
        rootCauseDescription: rootCauseDescription.trim() || null,
        attendedBy,
        submittedBy,
        startTime: startTimeISO,
        endTime: endTimeISO,
        durationMin: durationInfo.minutes,
        remarks: remarks.trim() || null
      });

      if (response.data?.data) {
        setSuccessRef(response.data.data.breakdownNumber || '-');
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
                  onChange={(e) => setShiftId(e.target.value)}
                  className="glass-input px-3 py-2.5 block w-full rounded-lg text-xs text-gray-200 appearance-none bg-slate-900 cursor-pointer"
                >
                  <option value="" disabled>Select shift</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code.replace('SHIFT_', 'S')})
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
                  onChange={(e) => setTimeStart(e.target.value)}
                  className="glass-input px-3 py-2.5 block w-full rounded-lg text-xs text-gray-200"
                />
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
                className="glass-input px-3 py-2.5 block w-full rounded-lg text-xs text-gray-200 appearance-none bg-slate-900 cursor-pointer"
              >
                <option value="" disabled>Select machine type</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
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
                className="glass-input px-3 py-2.5 block w-full rounded-lg text-xs text-gray-200 appearance-none bg-slate-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  {departmentId ? 'Select machine' : 'Select machine type first'}
                </option>
                {filteredMachines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                Unit / Section <span className="text-red-500">*</span>
              </label>
              <select
                required
                disabled={!machineId || filteredSubAssemblies.length === 0}
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="glass-input px-3 py-2.5 block w-full rounded-lg text-xs text-gray-200 appearance-none bg-slate-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  {!machineId ? 'Select machine name first' : 'Select unit'}
                </option>
                {filteredSubAssemblies.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
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
                  <option value="" disabled>Select</option>
                  {problemCategories.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
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
                  <option value="" disabled>Select</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
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

          {/* SECTION 4: TEAM */}
          <div className="glass-panel p-5 space-y-4 shadow-md">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 border-b border-white/5 pb-2 uppercase tracking-wider font-mono">
              <User size={13} className="text-emerald-500" />
              <span>Team</span>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                Attended By <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={attendedBy}
                onChange={(e) => setAttendedBy(e.target.value)}
                className="glass-input px-3 py-2.5 block w-full rounded-lg text-xs text-gray-200 appearance-none bg-slate-900 cursor-pointer"
              >
                <option value="" disabled>Select technician</option>
                {technicians.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

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
                {technicians.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

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

    </div>
  );
};
