import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut, PolarArea } from 'react-chartjs-2';
import { 
  Download, 
  RotateCcw, 
  Activity, 
  Cpu, 
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

// Register ChartJS elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
);

interface BreakdownRow {
  refId: string;
  date: string;
  monthYear: string;
  fy: string;
  shift: string;
  machineType: string;
  machineName: string;
  unit: string;
  problemType: string;
  category: string;
  description: string;
  actionTaken: string;
  rootCause: string;
  timeStart: string;
  timeEnd: string;
  minutes: number;
  availableMin: number;
  attendedBy: string;
}

const MONTH_ORDER = [
  'Apr-23','May-23','Jun-23','Jul-23','Aug-23','Sep-23','Oct-23','Nov-23','Dec-23',
  'Jan-24','Feb-24','Mar-24','Apr-24','May-24','Jun-24','Jul-24','Aug-24','Sep-24','Oct-24','Nov-24','Dec-24',
  'Jan-25','Feb-25','Mar-25','Apr-25','May-25','Jun-25','Jul-25','Aug-25','Sep-25','Oct-25','Nov-25','Dec-25',
  'Jan-26','Feb-26','Mar-26','Apr-26','May-26','Jun-26','Jul-26','Aug-26','Sep-26','Oct-26','Nov-26','Dec-26'
];

const PALETTE = ['#2d7bf4', '#f0a500', '#e84040', '#1fc67a', '#9b5de5', '#00d4ff', '#e05c2a', '#6b7a99', '#ffe66d', '#a8dadc', '#ff6b6b', '#4ecdc4'];
const CATEGORY_COLORS: Record<string, string> = {
  'Breakdown': '#e84040',
  'Preventive': '#2d7bf4',
  'Corrective': '#f0a500',
  'Operational': '#1fc67a',
  'Predictive': '#9b5de5',
  'Planning': '#6b7a99',
  'Planned Maintenance (PM)': '#2d7bf4',
  'Tooling Change': '#9b5de5',
  'Utility Downtime': '#00d4ff'
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  // RAW State
  const [allRows, setAllRows] = useState<BreakdownRow[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [genTime, setGenTime] = useState('--');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [fFY, setFFY] = useState('');
  const [fMonth, setFMonth] = useState('');
  const [fDept, setFDept] = useState('');
  const [fMachine, setFMachine] = useState('');
  const [fShift, setFShift] = useState('');
  const [fCat, setFCat] = useState('');
  const [fPerson, setFPerson] = useState('');

  // Load Dashboard Data
  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/breakdowns/dashboard');
      if (res.data?.data) {
        const { rows, pendingCount, generated } = res.data.data;
        
        const rowsWithFY = rows.map((r: BreakdownRow) => {
          let fy = 'Unknown';
          if (r.date) {
            const parts = r.date.split('/');
            if (parts.length === 3) {
              const month = parseInt(parts[1], 10);
              const year = parseInt(parts[2], 10);
              if (month >= 4) {
                fy = `FY ${year}-${year + 1}`;
              } else {
                fy = `FY ${year - 1}-${year}`;
              }
            }
          }
          return { ...r, fy };
        });

        setAllRows(rowsWithFY);
        setPendingCount(pendingCount);
        if (generated) {
          const formattedDate = new Date(generated).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          setGenTime(formattedDate);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      setError('Unable to retrieve maintenance datasets from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Compute select options dynamically from active dataset (like GAS)
  const filterOptions = useMemo(() => {
    const fys = new Set<string>();
    const months = new Set<string>();
    const depts = new Set<string>();
    const machines = new Set<string>();
    const shifts = new Set<string>();
    const cats = new Set<string>();
    const persons = new Set<string>();

    allRows.forEach((r) => {
      if (r.fy) fys.add(r.fy);
      if (r.monthYear) months.add(r.monthYear);
      if (r.machineType) depts.add(r.machineType);
      if (r.machineName) machines.add(r.machineName);
      if (r.shift) shifts.add(r.shift);
      if (r.category) cats.add(r.category);
      if (r.attendedBy) persons.add(r.attendedBy);
    });

    const sortMonthOptions = (arr: string[]) => {
      return arr.sort((a, b) => {
        const ia = MONTH_ORDER.indexOf(a);
        const ib = MONTH_ORDER.indexOf(b);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      });
    };

    return {
      fys: Array.from(fys).sort().reverse(),
      months: sortMonthOptions(Array.from(months)),
      depts: Array.from(depts).sort(),
      machines: Array.from(machines).sort(),
      shifts: Array.from(shifts).sort(),
      cats: Array.from(cats).sort(),
      persons: Array.from(persons).sort()
    };
  }, [allRows]);

  // Reset Filters
  const resetFilters = () => {
    setFFY('');
    setFMonth('');
    setFDept('');
    setFMachine('');
    setFShift('');
    setFCat('');
    setFPerson('');
  };

  // Filtered Rows
  const filteredRows = useMemo(() => {
    return allRows.filter((r) => {
      return (
        (!fFY || r.fy === fFY) &&
        (!fMonth || r.monthYear === fMonth) &&
        (!fDept || r.machineType === fDept) &&
        (!fMachine || r.machineName === fMachine) &&
        (!fShift || r.shift === fShift) &&
        (!fCat || r.category === fCat) &&
        (!fPerson || r.attendedBy === fPerson)
      );
    });
  }, [allRows, fFY, fMonth, fDept, fMachine, fShift, fCat, fPerson]);

  // Compute KPIs (exactly matching original GAS updateKPIs mathematical logic)
  const kpis = useMemo(() => {
    const rows = filteredRows;
    const bd = rows.filter((r) => r.category === 'Breakdown' || r.category === 'Breakdown Log');
    const bdc = bd.length;
    const totMin = rows.reduce((s, r) => s + (r.minutes || 0), 0);
    const bdMin = bd.reduce((s, r) => s + (r.minutes || 0), 0);
    
    // 1. MTTR
    const mttr = bdc > 0 ? bdMin / bdc : 0;

    // 2. MTBF per machine-month
    const mm: Record<string, { av: number; bm: number; bc: number }> = {};
    rows.forEach((r) => {
      const k = `${r.machineName}|${r.monthYear}`;
      if (!mm[k]) mm[k] = { av: r.availableMin || 44640, bm: 0, bc: 0 };
      if (r.category === 'Breakdown' || r.category === 'Breakdown Log') {
        mm[k].bm += r.minutes;
        mm[k].bc++;
      }
    });
    const mtbfL: number[] = [];
    Object.keys(mm).forEach((k) => {
      const m = mm[k];
      if (m.bc > 0) mtbfL.push((m.av - m.bm) / m.bc);
    });
    const mtbf = mtbfL.length > 0 ? mtbfL.reduce((a, b) => a + b, 0) / mtbfL.length : 0;

    // 3. Availability
    const ad: Record<string, { d: number; a: number }> = {};
    rows.forEach((r) => {
      const k = `${r.machineName}|${r.monthYear}`;
      if (!ad[k]) ad[k] = { d: 0, a: r.availableMin || 44640 };
      ad[k].d += r.minutes || 0;
    });
    const al = Object.keys(ad).map((k) => {
      const m = ad[k];
      return Math.min(100, Math.max(0, ((m.a - m.d) / m.a) * 100));
    });
    const avgA = al.length > 0 ? al.reduce((a, b) => a + b, 0) / al.length : 100;

    // 4. Breakdown % = MTTR / (MTBF + MTTR) * 100
    const bdPct = (mtbf + mttr) > 0 ? (mttr / (mtbf + mttr)) * 100 : 0;

    return {
      mttr: mttr > 0 ? Math.round(mttr) : '--',
      mtbf: mtbf > 0 ? (mtbf / 60).toFixed(1) : '--',
      downtime: (totMin / 60).toFixed(1),
      bdCount: bdc,
      availability: avgA.toFixed(2),
      bdPct: (mtbf + mttr) > 0 ? bdPct.toFixed(1) : '--',
      totalEntries: rows.length
    };
  }, [filteredRows]);

  // Compute 4 Summary Tables datasets
  const tablesData = useMemo(() => {
    const rows = filteredRows;

    // 1. Machine Availability
    const mm: Record<string, { dept: string; bc: number; d: number; entries: number; a: number; bdMin: number }> = {};
    rows.forEach((r) => {
      const mc = r.machineName || '--';
      if (!mm[mc]) mm[mc] = { dept: r.machineType || '', bc: 0, d: 0, entries: 0, a: r.availableMin || 44640, bdMin: 0 };
      mm[mc].entries++;
      if (r.category === 'Breakdown' || r.category === 'Breakdown Log') {
        mm[mc].bc++;
        mm[mc].bdMin += r.minutes || 0;
      }
      mm[mc].d += r.minutes || 0;
    });

    const machineTable = Object.keys(mm).map((name) => {
      const x = mm[name];
      const av = Math.min(100, Math.max(0, ((x.a - x.d) / x.a) * 100));
      return {
        name,
        dept: x.dept,
        bc: x.bc,
        downHrs: (x.d / 60).toFixed(1),
        entries: x.entries,
        mttr: x.bc > 0 ? Math.round(x.bdMin / x.bc) : '--',
        mtbf: x.bc > 0 ? ((x.a - x.bdMin) / x.bc / 60).toFixed(1) : '--',
        availability: av
      };
    }).sort((a, b) => parseFloat(b.downHrs) - parseFloat(a.downHrs));

    // 2. Accumulative Monthly Summary
    const monthlySum: Record<string, { entries: number; bc: number; d: number; bdMin: number; av: number; machMonths: Record<string, { av: number; bm: number; bc: number }> }> = {};
    rows.forEach((r) => {
      const mo = r.monthYear || 'Unknown';
      if (!monthlySum[mo]) monthlySum[mo] = { entries: 0, bc: 0, d: 0, bdMin: 0, av: r.availableMin || 44640, machMonths: {} };
      monthlySum[mo].entries++;
      if (r.category === 'Breakdown' || r.category === 'Breakdown Log') {
        monthlySum[mo].bc++;
        monthlySum[mo].bdMin += r.minutes || 0;
      }
      monthlySum[mo].d += r.minutes || 0;
      const k = `${r.machineName}|${mo}`;
      if (!monthlySum[mo].machMonths[k]) monthlySum[mo].machMonths[k] = { av: r.availableMin || 44640, bm: 0, bc: 0 };
      if (r.category === 'Breakdown' || r.category === 'Breakdown Log') {
        monthlySum[mo].machMonths[k].bm += r.minutes || 0;
        monthlySum[mo].machMonths[k].bc++;
      }
    });

    const monthlyTable = Object.keys(monthlySum).map((month) => {
      const x = monthlySum[month];
      const mttr = x.bc > 0 ? (x.bdMin / x.bc).toFixed(1) : '--';
      const mtbfL: number[] = [];
      Object.keys(x.machMonths).forEach((k) => {
        const m = x.machMonths[k];
        if (m.bc > 0) mtbfL.push((m.av - m.bm) / m.bc / 60);
      });
      const mtbf = mtbfL.length > 0 ? (mtbfL.reduce((a, b) => a + b, 0) / mtbfL.length).toFixed(1) : '--';
      return {
        month,
        entries: x.entries,
        bc: x.bc,
        downHrs: (x.d / 60).toFixed(1),
        mttr,
        mtbf
      };
    }).sort((a, b) => {
      const ia = MONTH_ORDER.indexOf(a.month);
      const ib = MONTH_ORDER.indexOf(b.month);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });

    // 3. Recent (Last 50)
    const recentTable = [...rows].reverse().slice(0, 50);

    // 4. Highest Downtime Events (Top 50)
    const topDownTable = [...rows].sort((a, b) => (b.minutes || 0) - (a.minutes || 0)).slice(0, 50);

    return { machineTable, monthlyTable, recentTable, topDownTable };
  }, [filteredRows]);

  // Compute 9 Charts configurations
  const chartsConfig = useMemo(() => {
    const rows = filteredRows;
    const sortMonths = (arr: string[]) => {
      return arr.sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));
    };

    // Chart 1: Monthly Downtime & Breakdown Count
    const md: Record<string, { d: number; b: number }> = {};
    rows.forEach((r) => {
      const m = r.monthYear || 'Unknown';
      if (!md[m]) md[m] = { d: 0, b: 0 };
      md[m].d += (r.minutes || 0) / 60;
      if (r.category === 'Breakdown' || r.category === 'Breakdown Log') md[m].b++;
    });
    const ms = sortMonths(Object.keys(md));

    const chartMonthlyData = {
      labels: ms,
      datasets: [
        {
          type: 'bar' as const,
          label: 'Downtime (hrs)',
          data: ms.map((m) => parseFloat(md[m].d.toFixed(1))),
          backgroundColor: 'rgba(240, 165, 0, 0.4)',
          borderColor: '#f0a500',
          borderWidth: 1.5,
          borderRadius: 3,
          yAxisID: 'y'
        },
        {
          type: 'line' as const,
          label: 'Breakdown Count',
          data: ms.map((m) => md[m].b),
          borderColor: '#e84040',
          backgroundColor: 'rgba(232, 64, 64, 0.1)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#e84040',
          fill: true,
          tension: 0.35,
          yAxisID: 'y2'
        }
      ]
    };

    const chartMonthlyOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#6b7a99', font: { size: 10 } } } },
      scales: {
        x: { ticks: { color: '#6b7a99', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.03)' } },
        y: { ticks: { color: '#6b7a99', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.03)' }, title: { display: true, text: 'Hrs', color: '#6b7a99', font: { size: 9 } } },
        y2: { position: 'right' as const, ticks: { color: '#e84040', font: { size: 9 } }, grid: { display: false }, title: { display: true, text: 'BD', color: '#e84040', font: { size: 9 } } }
      }
    };

    // Chart 2: Category distribution (Doughnut)
    const cd: Record<string, number> = {};
    rows.forEach((r) => {
      if (r.category) cd[r.category] = (cd[r.category] || 0) + 1;
    });
    const cats = Object.keys(cd);
    const chartCategoryData = {
      labels: cats,
      datasets: [
        {
          data: cats.map((c) => cd[c]),
          backgroundColor: cats.map((c) => CATEGORY_COLORS[c] || '#4ecdc4'),
          borderColor: '#111620',
          borderWidth: 1.5,
          hoverOffset: 4
        }
      ]
    };
    const chartCategoryOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'right' as const,
          labels: { color: '#6b7a99', font: { size: 9 }, boxWidth: 8, padding: 6 }
        }
      }
    };

    // Chart 3: Machine BD bar
    const mb: Record<string, number> = {};
    rows.forEach((r) => {
      if (r.category === 'Breakdown' || r.category === 'Breakdown Log') {
        const mc = r.machineName || '--';
        mb[mc] = (mb[mc] || 0) + 1;
      }
    });
    const mcL = Object.keys(mb).sort((a, b) => mb[b] - mb[a]).slice(0, 15);
    const chartMachineData = {
      labels: mcL,
      datasets: [
        {
          label: 'Breakdowns',
          data: mcL.map((m) => mb[m]),
          backgroundColor: 'rgba(155, 93, 229, 0.4)',
          borderColor: '#9b5de5',
          borderWidth: 1.5,
          borderRadius: 3
        }
      ]
    };

    // Chart 4: MTTR Monthly avg line
    const tm: Record<string, { t: number; c: number }> = {};
    rows.filter((r) => r.category === 'Breakdown' || r.category === 'Breakdown Log').forEach((r) => {
      const m = r.monthYear || 'Unknown';
      if (!tm[m]) tm[m] = { t: 0, c: 0 };
      tm[m].t += r.minutes;
      tm[m].c++;
    });
    const tl = sortMonths(Object.keys(tm));
    const chartMTTRData = {
      labels: tl,
      datasets: [
        {
          label: 'Avg MTTR (min)',
          data: tl.map((m) => (tm[m].c ? Math.round(tm[m].t / tm[m].c) : 0)),
          borderColor: '#f0a500',
          backgroundColor: 'rgba(240, 165, 0, 0.08)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#f0a500',
          fill: true,
          tension: 0.35
        }
      ]
    };

    // Chart 5: Category-wise downtime (hrs)
    const cdd: Record<string, number> = {};
    rows.forEach((r) => {
      if (r.category) cdd[r.category] = (cdd[r.category] || 0) + (r.minutes || 0) / 60;
    });
    const cdL = Object.keys(cdd).sort((a, b) => cdd[b] - cdd[a]);
    const chartCatDownData = {
      labels: cdL,
      datasets: [
        {
          label: 'Downtime (hrs)',
          data: cdL.map((c) => parseFloat(cdd[c].toFixed(1))),
          backgroundColor: cdL.map((c) => CATEGORY_COLORS[c] || '#4ecdc4'),
          borderWidth: 0,
          borderRadius: 3
        }
      ]
    };

    // Chart 6: Problem type downtime (hrs)
    const pd: Record<string, number> = {};
    rows.forEach((r) => {
      if (r.problemType) pd[r.problemType] = (pd[r.problemType] || 0) + (r.minutes || 0) / 60;
    });
    const pdL = Object.keys(pd).sort((a, b) => pd[b] - pd[a]).slice(0, 10);
    const chartProbDownData = {
      labels: pdL,
      datasets: [
        {
          label: 'Downtime (hrs)',
          data: pdL.map((p) => parseFloat(pd[p].toFixed(1))),
          backgroundColor: 'rgba(0, 212, 255, 0.4)',
          borderColor: '#00d4ff',
          borderWidth: 1,
          borderRadius: 3
        }
      ]
    };

    // Chart 7: Shift downtime (hrs)
    const sd: Record<string, number> = {};
    rows.forEach((r) => {
      const s = r.shift || 'Unknown';
      sd[s] = (sd[s] || 0) + (r.minutes || 0) / 60;
    });
    const sdL = Object.keys(sd);
    const chartShiftDownData = {
      labels: sdL,
      datasets: [
        {
          data: sdL.map((s) => parseFloat(sd[s].toFixed(1))),
          backgroundColor: ['rgba(45,123,244,0.6)', 'rgba(240,165,0,0.6)', 'rgba(232,64,64,0.6)', 'rgba(31,198,122,0.6)', 'rgba(155,93,229,0.6)'],
          borderColor: '#111620',
          borderWidth: 1.5
        }
      ]
    };

    // Chart 8: Dept downtime
    const dd: Record<string, number> = {};
    rows.forEach((r) => {
      if (r.machineType) dd[r.machineType] = (dd[r.machineType] || 0) + (r.minutes || 0) / 60;
    });
    const ddL = Object.keys(dd).sort((a, b) => dd[b] - dd[a]);
    const chartDeptDownData = {
      labels: ddL,
      datasets: [
        {
          label: 'Downtime (hrs)',
          data: ddL.map((d) => parseFloat(dd[d].toFixed(1))),
          backgroundColor: ddL.map((_, i) => PALETTE[i % PALETTE.length]),
          borderRadius: 3
        }
      ]
    };

    // Chart 9: Top 10 machines by downtime
    const t10: Record<string, number> = {};
    rows.forEach((r) => {
      if (r.machineName) t10[r.machineName] = (t10[r.machineName] || 0) + r.minutes;
    });
    const t10L = Object.keys(t10).sort((a, b) => t10[b] - t10[a]).slice(0, 10);
    const chartTop10Data = {
      labels: t10L,
      datasets: [
        {
          label: 'Downtime (min)',
          data: t10L.map((m) => t10[m]),
          backgroundColor: 'rgba(232, 64, 64, 0.5)',
          borderColor: '#e84040',
          borderWidth: 1,
          borderRadius: 3
        }
      ]
    };

    // Standard Options helper
    const getStandardOptions = (axis: 'x' | 'y' = 'x') => ({
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: axis,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#6b7a99', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.03)' } },
        y: { ticks: { color: '#6b7a99', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.03)' } }
      }
    });

    return {
      chartMonthlyData,
      chartMonthlyOptions,
      chartCategoryData,
      chartCategoryOptions,
      chartMachineData,
      chartMachineOptions: getStandardOptions('x'),
      chartMTTRData,
      chartMTTROptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#6b7a99', font: { size: 9 } } },
          y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#6b7a99', font: { size: 9 } } }
        }
      },
      chartCatDownData,
      chartCatDownOptions: getStandardOptions('y'),
      chartProbDownData,
      chartProbDownOptions: getStandardOptions('y'),
      chartShiftDownData,
      chartShiftDownOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' as const, labels: { color: '#6b7a99', font: { size: 8 }, boxWidth: 6 } } },
        scales: { r: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { display: false } } }
      },
      chartDeptDownData,
      chartDeptDownOptions: getStandardOptions('y'),
      chartTop10Data,
      chartTop10Options: getStandardOptions('y')
    };
  }, [filteredRows]);

  return (
    <div className="space-y-6 animate-fade-in text-gray-200">
      
      {/* 1. Review alerts warning banner */}
      {pendingCount > 0 && (
        <div className="bg-[#f0a50010] border border-[#f0a50040] rounded-xl p-4 flex items-center justify-between text-xs text-amber-400 animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>{pendingCount} logs are pending review — not included in dashboard calculations.</span>
          </div>
          {(user?.role.code === 'SUPER_ADMIN' || user?.role.code === 'SUPERVISOR' || user?.role.code === 'MANAGER') && (
            <Link to="/audit" className="font-semibold text-amber-400 hover:text-amber-300 underline flex items-center gap-1">
              Open Admin Review Queue <ArrowUpRight size={14} />
            </Link>
          )}
        </div>
      )}

      {/* 2. Top control panel */}
      <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-gray-100 flex items-center gap-2">
            <TrendingUp size={22} className="text-emerald-500" />
            <span>Equipment Reliability & Downtime Intelligence</span>
          </h2>
          <p className="text-[10px] text-gray-400 mt-1 font-mono uppercase tracking-widest">{genTime ? `Data Refreshed: ${genTime}` : 'Offline Mode'}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={loadDashboard}
            className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold cursor-pointer hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            &#8635; Reload Data
          </button>
          <a
            href="/api/v1/breakdowns/export"
            download
            className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
          >
            <Download size={13} />
            Export CSV
          </a>
        </div>
      </div>

      {/* 3. Dropdown Filters */}
      <div className="glass-panel p-4 rounded-xl border-white/5 flex items-center gap-3 flex-wrap">
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Filter By:</span>
        
        {/* FY */}
        <select
          value={fFY}
          onChange={(e) => setFFY(e.target.value)}
          className="glass-input px-3 py-1.5 block rounded-lg text-xs text-gray-300 bg-transparent cursor-pointer"
        >
          <option value="" className="bg-slate-950">All FYs</option>
          {filterOptions.fys.map(f => <option key={f} value={f} className="bg-slate-950">{f}</option>)}
        </select>

        {/* Month */}
        <select
          value={fMonth}
          onChange={(e) => setFMonth(e.target.value)}
          className="glass-input px-3 py-1.5 block rounded-lg text-xs text-gray-300 bg-transparent cursor-pointer"
        >
          <option value="" className="bg-slate-950">All Months</option>
          {filterOptions.months.map(m => <option key={m} value={m} className="bg-slate-950">{m}</option>)}
        </select>

        {/* Department */}
        <select
          value={fDept}
          onChange={(e) => setFDept(e.target.value)}
          className="glass-input px-3 py-1.5 block rounded-lg text-xs text-gray-300 bg-transparent cursor-pointer"
        >
          <option value="" className="bg-slate-950">All Departments</option>
          {filterOptions.depts.map(d => <option key={d} value={d} className="bg-slate-950">{d}</option>)}
        </select>

        {/* Machine */}
        <select
          value={fMachine}
          onChange={(e) => setFMachine(e.target.value)}
          className="glass-input px-3 py-1.5 block rounded-lg text-xs text-gray-300 bg-transparent cursor-pointer"
        >
          <option value="" className="bg-slate-950">All Machines</option>
          {filterOptions.machines.map(m => <option key={m} value={m} className="bg-slate-950">{m}</option>)}
        </select>

        {/* Shift */}
        <select
          value={fShift}
          onChange={(e) => setFShift(e.target.value)}
          className="glass-input px-3 py-1.5 block rounded-lg text-xs text-gray-300 bg-transparent cursor-pointer"
        >
          <option value="" className="bg-slate-950">All Shifts</option>
          {filterOptions.shifts.map(s => <option key={s} value={s} className="bg-slate-950">{s}</option>)}
        </select>

        {/* Category */}
        <select
          value={fCat}
          onChange={(e) => setFCat(e.target.value)}
          className="glass-input px-3 py-1.5 block rounded-lg text-xs text-gray-300 bg-transparent cursor-pointer"
        >
          <option value="" className="bg-slate-950">All Categories</option>
          {filterOptions.cats.map(c => <option key={c} value={c} className="bg-slate-950">{c}</option>)}
        </select>

        {/* Attended By */}
        <select
          value={fPerson}
          onChange={(e) => setFPerson(e.target.value)}
          className="glass-input px-3 py-1.5 block rounded-lg text-xs text-gray-300 bg-transparent cursor-pointer"
        >
          <option value="" className="bg-slate-950">All Persons</option>
          {filterOptions.persons.map(p => <option key={p} value={p} className="bg-slate-950">{p}</option>)}
        </select>

        <button 
          onClick={resetFilters}
          className="px-3 py-1.5 rounded-lg border border-white/5 hover:border-emerald-500/30 text-gray-400 hover:text-emerald-400 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1"
        >
          <RotateCcw size={11} /> Reset
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-xs text-gray-500 font-mono">Aggregating breakdown logs OEE calculations...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl flex flex-col items-center text-center max-w-md mx-auto">
          <ShieldAlert size={40} className="mb-4 text-red-500" />
          <p className="font-semibold">{error}</p>
        </div>
      ) : allRows.length === 0 ? (
        <div className="glass-panel p-24 rounded-2xl border-white/5 text-center text-gray-500 text-sm">
          <Activity size={40} className="mx-auto text-gray-600 mb-3" />
          No approved records logged. Go to Breakdown Logs page to enter one.
        </div>
      ) : (
        <>
          {/* 4. 7 KPIs Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            
            {/* Avg MTTR */}
            <div className="glass-panel p-4 rounded-xl border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500" />
              <span className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest">Avg MTTR</span>
              <h3 className="text-2xl font-bold font-display text-amber-500 mt-2">{kpis.mttr}</h3>
              <span className="text-[9px] text-gray-500 block mt-1">minutes (Breakdown)</span>
            </div>

            {/* Avg MTBF */}
            <div className="glass-panel p-4 rounded-xl border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />
              <span className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest">Avg MTBF</span>
              <h3 className="text-2xl font-bold font-display text-blue-400 mt-2">{kpis.mtbf}</h3>
              <span className="text-[9px] text-gray-500 block mt-1">hours intervals</span>
            </div>

            {/* Total Downtime */}
            <div className="glass-panel p-4 rounded-xl border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500" />
              <span className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest">Total Downtime</span>
              <h3 className="text-2xl font-bold font-display text-red-500 mt-2">{kpis.downtime}</h3>
              <span className="text-[9px] text-gray-500 block mt-1">hours logged</span>
            </div>

            {/* Breakdown Count */}
            <div className="glass-panel p-4 rounded-xl border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-purple-500" />
              <span className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest">Breakdown Count</span>
              <h3 className="text-2xl font-bold font-display text-purple-400 mt-2">{kpis.bdCount}</h3>
              <span className="text-[9px] text-gray-500 block mt-1">active events</span>
            </div>

            {/* Avg Availability */}
            <div className="glass-panel p-4 rounded-xl border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />
              <span className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest">Avg Availability</span>
              <h3 className="text-2xl font-bold font-display text-emerald-400 mt-2">{kpis.availability}%</h3>
              <span className="text-[9px] text-gray-500 block mt-1">uptime availability</span>
            </div>

            {/* Breakdown % */}
            <div className="glass-panel p-4 rounded-xl border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-500" />
              <span className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest">Breakdown %</span>
              <h3 className="text-2xl font-bold font-display text-cyan-400 mt-2">{kpis.bdPct}%</h3>
              <span className="text-[9px] text-gray-500 block mt-1">MTTR / (MTBF + MTTR)</span>
            </div>

            {/* Total Entries */}
            <div className="glass-panel p-4 rounded-xl border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-500" />
              <span className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest">Total Entries</span>
              <h3 className="text-2xl font-bold font-display text-gray-300 mt-2">{kpis.totalEntries}</h3>
              <span className="text-[9px] text-gray-500 block mt-1">approved logs</span>
            </div>

          </div>

          {/* 5. Trend Analysis Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            
            {/* Chart 1: Monthly Downtime */}
            <div className="glass-panel p-5 rounded-2xl border-white/5 h-80 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Monthly Downtime & Breakdown Count</span>
                <span className="text-[9px] bg-slate-900 px-2 py-0.5 text-gray-500 font-semibold rounded">BAR+LINE</span>
              </div>
              <div className="flex-1 relative">
                <Bar data={chartsConfig.chartMonthlyData as any} options={chartsConfig.chartMonthlyOptions as any} />
              </div>
            </div>

            {/* Chart 2: Category distribution */}
            <div className="glass-panel p-5 rounded-2xl border-white/5 h-80 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category Distribution</span>
                <span className="text-[9px] bg-slate-900 px-2 py-0.5 text-gray-500 font-semibold rounded">DOUGHNUT</span>
              </div>
              <div className="flex-1 relative">
                <Doughnut data={chartsConfig.chartCategoryData} options={chartsConfig.chartCategoryOptions} />
              </div>
            </div>

            {/* Chart 3: Machine BD bar */}
            <div className="glass-panel p-5 rounded-2xl border-white/5 h-80 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Machine-wise Breakdown Count</span>
                <span className="text-[9px] bg-slate-900 px-2 py-0.5 text-gray-500 font-semibold rounded">BAR</span>
              </div>
              <div className="flex-1 relative">
                <Bar data={chartsConfig.chartMachineData} options={chartsConfig.chartMachineOptions} />
              </div>
            </div>

            {/* Chart 4: MTTR Line */}
            <div className="glass-panel p-5 rounded-2xl border-white/5 h-80 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">MTTR Trend (Monthly Avg)</span>
                <span className="text-[9px] bg-slate-900 px-2 py-0.5 text-gray-500 font-semibold rounded">LINE</span>
              </div>
              <div className="flex-1 relative">
                <Line data={chartsConfig.chartMTTRData} options={chartsConfig.chartMTTROptions} />
              </div>
            </div>

            {/* Chart 5: Category-wise downtime */}
            <div className="glass-panel p-5 rounded-2xl border-white/5 h-80 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category-wise Downtime</span>
                <span className="text-[9px] bg-slate-900 px-2 py-0.5 text-gray-500 font-semibold rounded">HORIZONTAL BAR</span>
              </div>
              <div className="flex-1 relative">
                <Bar data={chartsConfig.chartCatDownData} options={chartsConfig.chartCatDownOptions} />
              </div>
            </div>

            {/* Chart 6: Problem type downtime */}
            <div className="glass-panel p-5 rounded-2xl border-white/5 h-80 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Problem Type Downtime</span>
                <span className="text-[9px] bg-slate-900 px-2 py-0.5 text-gray-500 font-semibold rounded">HORIZONTAL BAR</span>
              </div>
              <div className="flex-1 relative">
                <Bar data={chartsConfig.chartProbDownData} options={chartsConfig.chartProbDownOptions} />
              </div>
            </div>

            {/* Chart 7: Shift downtime */}
            <div className="glass-panel p-5 rounded-2xl border-white/5 h-80 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Downtime by Shift</span>
                <span className="text-[9px] bg-slate-900 px-2 py-0.5 text-gray-500 font-semibold rounded">POLAR AREA</span>
              </div>
              <div className="flex-1 relative">
                <PolarArea data={chartsConfig.chartShiftDownData} options={chartsConfig.chartShiftDownOptions} />
              </div>
            </div>

            {/* Chart 8: Department downtime */}
            <div className="glass-panel p-5 rounded-2xl border-white/5 h-80 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Downtime by Department</span>
                <span className="text-[9px] bg-slate-900 px-2 py-0.5 text-gray-500 font-semibold rounded">HORIZONTAL BAR</span>
              </div>
              <div className="flex-1 relative">
                <Bar data={chartsConfig.chartDeptDownData} options={chartsConfig.chartDeptDownOptions} />
              </div>
            </div>

            {/* Chart 9: Top 10 machines by downtime */}
            <div className="glass-panel p-5 rounded-2xl border-white/5 h-80 md:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Top 10 Machines by Downtime</span>
                <span className="text-[9px] bg-slate-900 px-2 py-0.5 text-gray-500 font-semibold rounded">HORIZONTAL BAR</span>
              </div>
              <div className="flex-1 relative">
                <Bar data={chartsConfig.chartTop10Data} options={chartsConfig.chartTop10Options} />
              </div>
            </div>

          </div>

          {/* 6. Machine Availability Summary Table */}
          <div className="glass-panel rounded-2xl border-white/5 overflow-hidden mt-6 shadow-xl">
            <div className="px-6 py-4 border-b border-white/5 bg-[#0f172a]/10 flex items-center gap-2">
              <Cpu size={16} className="text-emerald-400 animate-pulse" />
              <h3 className="text-xs font-bold font-display text-gray-300 uppercase tracking-wider">
                Machine Availability Summary
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0f172a]/20 text-gray-400 font-semibold text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-5">Machine</th>
                    <th className="py-3 px-3">Dept</th>
                    <th className="py-3 px-3 text-center">BD Count</th>
                    <th className="py-3 px-3 text-center">Down Hrs</th>
                    <th className="py-3 px-3 text-center">Entries</th>
                    <th className="py-3 px-3 text-center">MTTR (min)</th>
                    <th className="py-3 px-3 text-center">MTBF (hrs)</th>
                    <th className="py-3 px-5">Availability %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tablesData.machineTable.map((item, index) => {
                    const av = item.availability;
                    const colorClass = av >= 99 ? 'text-emerald-400' : av >= 97 ? 'text-amber-400' : 'text-red-400';
                    const fillBg = av >= 99 ? 'bg-emerald-500' : av >= 97 ? 'bg-amber-500' : 'bg-red-500';
                    return (
                      <tr key={index} className="hover:bg-white/2 transition-colors">
                        <td className="py-3.5 px-5"><strong>{item.name}</strong></td>
                        <td className="py-3.5 px-3 text-gray-400">{item.dept}</td>
                        <td className="py-3.5 px-3 text-center text-red-400 font-semibold">{item.bc}</td>
                        <td className="py-3.5 px-3 text-center">{item.downHrs} hrs</td>
                        <td className="py-3.5 px-3 text-center text-gray-500">{item.entries}</td>
                        <td className="py-3.5 px-3 text-center">{item.mttr}</td>
                        <td className="py-3.5 px-3 text-center">{item.mtbf}</td>
                        <td className="py-3.5 px-5 min-w-[150px]">
                          <div className={`font-bold flex items-center justify-between ${colorClass}`}>
                            <span>{av.toFixed(2)}%</span>
                          </div>
                          <div className="h-1 bg-slate-800 rounded-full overflow-hidden mt-1 w-full">
                            <div className={`h-full ${fillBg} rounded-full`} style={{ width: `${av}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 7. Accumulative Monthly Summary Table */}
          <div className="glass-panel rounded-2xl border-white/5 overflow-hidden mt-6 shadow-xl">
            <div className="px-6 py-4 border-b border-white/5 bg-[#0f172a]/10 flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-blue-400" />
              <h3 className="text-xs font-bold font-display text-gray-300 uppercase tracking-wider">
                Accumulative Monthly Summary
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0f172a]/20 text-gray-400 font-semibold text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-5">Month</th>
                    <th className="py-3 px-3 text-center">Total Entries</th>
                    <th className="py-3 px-3 text-center">Breakdown Count</th>
                    <th className="py-3 px-3 text-center">Total Downtime (hrs)</th>
                    <th className="py-3 px-3 text-center">Avg MTTR (min)</th>
                    <th className="py-3 px-3 text-center">Avg MTBF (hrs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tablesData.monthlyTable.map((item, index) => (
                    <tr key={index} className="hover:bg-white/2 transition-colors">
                      <td className="py-3.5 px-5"><strong>{item.month}</strong></td>
                      <td className="py-3.5 px-3 text-center">{item.entries}</td>
                      <td className="py-3.5 px-3 text-center text-red-400 font-semibold">{item.bc}</td>
                      <td className="py-3.5 px-3 text-center">{item.downHrs} hrs</td>
                      <td className="py-3.5 px-3 text-center text-amber-500 font-semibold">{item.mttr}</td>
                      <td className="py-3.5 px-3 text-center text-blue-400 font-semibold">{item.mtbf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 8. Recent Entries (Last 50) */}
          <div className="glass-panel rounded-2xl border-white/5 overflow-hidden mt-6 shadow-xl">
            <div className="px-6 py-4 border-b border-white/5 bg-[#0f172a]/10 flex items-center gap-2">
              <Activity size={16} className="text-cyan-400" />
              <h3 className="text-xs font-bold font-display text-gray-300 uppercase tracking-wider">
                Recent Entries (Last 50)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0f172a]/20 text-gray-400 font-semibold text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Machine</th>
                    <th className="py-3 px-3">Dept</th>
                    <th className="py-3 px-3">Unit</th>
                    <th className="py-3 px-3">Shift</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Problem Type</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3 text-center">Duration (min)</th>
                    <th className="py-3 px-4">Attended By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {tablesData.recentTable.map((item, index) => (
                    <tr key={index} className="hover:bg-white/2 transition-colors">
                      <td className="py-3 px-4 text-gray-500">{item.date}</td>
                      <td className="py-3 px-3"><strong>{item.machineName}</strong></td>
                      <td className="py-3 px-3 text-gray-400">{item.machineType}</td>
                      <td className="py-3 px-3 text-gray-400 text-[11px]">{item.unit || '--'}</td>
                      <td className="py-3 px-3">{item.shift}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          item.category === 'Breakdown' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-400">{item.problemType}</td>
                      <td className="py-3 px-3 truncate max-w-[150px]" title={item.description}>{item.description}</td>
                      <td className="py-3 px-3 text-center font-bold text-gray-200">{item.minutes}</td>
                      <td className="py-3 px-4 text-gray-400">{item.attendedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 9. Highest Downtime Events (Top 50) */}
          <div className="glass-panel rounded-2xl border-white/5 overflow-hidden mt-6 shadow-xl">
            <div className="px-6 py-4 border-b border-white/5 bg-[#0f172a]/10 flex items-center gap-2">
              <ShieldAlert size={16} className="text-red-500 animate-pulse" />
              <h3 className="text-xs font-bold font-display text-gray-300 uppercase tracking-wider">
                Highest Downtime Events (Top 50)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0f172a]/20 text-gray-400 font-semibold text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Machine</th>
                    <th className="py-3 px-3">Dept</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Problem Type</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3 text-center">Duration (min)</th>
                    <th className="py-3 px-4">Attended By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {tablesData.topDownTable.map((item, index) => (
                    <tr key={index} className="hover:bg-white/2 transition-colors">
                      <td className="py-3 px-4 text-gray-500">{item.date}</td>
                      <td className="py-3 px-3"><strong>{item.machineName}</strong></td>
                      <td className="py-3 px-3 text-gray-400">{item.machineType}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          item.category === 'Breakdown' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-400">{item.problemType}</td>
                      <td className="py-3 px-3 truncate max-w-[150px]" title={item.description}>{item.description}</td>
                      <td className="py-3 px-3 text-center font-bold text-red-400">{item.minutes}</td>
                      <td className="py-3 px-4 text-gray-400">{item.attendedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </>
      )}

    </div>
  );
};
