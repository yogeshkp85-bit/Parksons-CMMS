import React, { useState } from 'react';
import { PMMaster } from './PMMaster';
import { PMSchedule } from './PMSchedule';
import { PMHistory } from './PMHistory';
import { PMFrequencies } from './PMFrequencies';
import { PMCompliance } from './PMCompliance';
import { PMCalendar } from './PMCalendar';
import { Wrench, Calendar, History, ShieldAlert, Clock, Activity, CalendarDays } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

export const PMIndex: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'schedules' | 'master' | 'history' | 'frequencies' | 'compliance' | 'calendar'>('schedules');
  
  const isTechnician = user?.role?.code === 'technician';

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab('schedules')}
          className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-2 ${
            activeTab === 'schedules' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'
          }`}
        >
          <Calendar size={18} /> Active Schedules
        </button>
        {!isTechnician && (
          <>
            <button 
              onClick={() => setActiveTab('master')}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-2 ${
                activeTab === 'master' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              <Wrench size={18} /> Task Master
            </button>
            <button
              onClick={() => setActiveTab('frequencies')}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-2 ${
                activeTab === 'frequencies' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              <Clock size={18} /> Frequencies
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-2 ${
                activeTab === 'compliance' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              <Activity size={18} /> Compliance
            </button>
          </>
        )}
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-2 ${
            activeTab === 'history' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'
          }`}
        >
          <History size={18} /> History
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-2 ${
            activeTab === 'calendar' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'
          }`}
        >
          <CalendarDays size={18} /> Calendar
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'schedules' && <PMSchedule />}
        {activeTab === 'master' && <PMMaster />}
        {activeTab === 'history' && <PMHistory />}
        {activeTab === 'frequencies' && <PMFrequencies />}
        {activeTab === 'compliance' && <PMCompliance />}
        {activeTab === 'calendar' && <PMCalendar />}
      </div>
    </div>
  );
};
