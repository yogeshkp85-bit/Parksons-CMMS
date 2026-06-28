import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import api from '../../services/api';

export const PMCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  useEffect(() => {
    fetchMonthSchedules();
  }, [month, year]);

  const fetchMonthSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/pm/compliance?month=${month}&year=${year}`);
      setSchedules(res.data?.data?.schedules || []);
    } catch (err) {
      console.error('Failed to load calendar data', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar Math
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);
  const startDayOfWeek = startOfMonth.getDay(); // 0: Sun, 1: Mon, etc.
  const daysInMonth = endOfMonth.getDate();

  const renderCells = () => {
    const cells = [];
    const todayStr = new Date().toDateString();

    // Empty slots before 1st day
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(<div key={`empty-${i}`} className="bg-white/[0.01] border border-white/5 rounded-lg min-h-[120px]"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month - 1, day);
      const isToday = dateObj.toDateString() === todayStr;
      
      // Get schedules for this specific day
      const daySchedules = schedules.filter(s => {
        const d = new Date(s.dueDate);
        return d.getDate() === day && d.getMonth() + 1 === month && d.getFullYear() === year;
      });

      cells.push(
        <div key={`day-${day}`} className={`flex flex-col border border-white/5 rounded-lg p-2 min-h-[120px] transition hover:bg-white/[0.02] ${isToday ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-[#0f172a]'}`}>
          <div className="flex justify-between items-center mb-1">
            <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-cyan-500 text-white' : 'text-gray-400'}`}>
              {day}
            </span>
            {daySchedules.length > 0 && (
              <span className="text-[9px] font-medium text-gray-500 px-1 bg-white/5 rounded">{daySchedules.length}</span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1 max-h-[90px]">
            {daySchedules.map(s => {
              let badgeColor = 'bg-gray-500/20 text-gray-400 border-gray-500/20';
              if (s.status === 'COMPLETED') {
                badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
              } else if (s.status === 'PENDING') {
                if (new Date(s.dueDate) < new Date()) {
                  badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20'; // Overdue
                } else {
                  badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20'; // Upcoming Pending
                }
              }

              return (
                <div key={s.id} className={`text-[10px] p-1 border rounded cursor-pointer hover:opacity-80 leading-tight ${badgeColor}`} title={`${s.machine?.name || s.machine?.machineName}\n${s.pmTask?.name || 'General PM'}\nStatus: ${s.status}`}>
                  <div className="font-bold truncate">{s.machine?.name || s.machine?.machineName || 'Unknown'}</div>
                  <div className="truncate opacity-80 text-[9px]">{s.pmTask?.name || 'General PM'}</div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Fill remaining days to complete the last row
    const remainingCells = (7 - ((startDayOfWeek + daysInMonth) % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
      cells.push(<div key={`empty-end-${i}`} className="bg-white/[0.01] border border-white/5 rounded-lg min-h-[120px]"></div>);
    }

    return cells;
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon size={20} className="text-cyan-400" /> PM Calendar
          </h2>
          <p className="text-sm text-gray-400">Monthly overview of preventive maintenance schedules.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={handleToday} className="btn-ghost text-xs py-1.5">Today</button>
          <div className="flex items-center bg-[#0f172a] rounded-lg border border-white/5 p-1">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-white/10 rounded-md text-gray-400 transition"><ChevronLeft size={18} /></button>
            <div className="w-32 text-center text-sm font-bold text-white">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
            <button onClick={handleNextMonth} className="p-1 hover:bg-white/10 rounded-md text-gray-400 transition"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-xl border border-white/5">
        {loading && schedules.length === 0 ? (
          <div className="py-32 flex justify-center text-gray-500">
            <Clock className="animate-spin mr-2" size={20} /> Loading Calendar...
          </div>
        ) : (
          <div>
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider py-2">
                  {day}
                </div>
              ))}
            </div>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {renderCells()}
            </div>
            
            {/* Legend */}
            <div className="flex gap-4 mt-6 border-t border-white/5 pt-4">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50 block"></span> Completed
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50 block"></span> Pending (Upcoming)
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/50 block"></span> Overdue
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
