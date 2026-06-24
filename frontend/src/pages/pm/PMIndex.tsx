import React, { useState } from 'react';
import { PMMaster } from './PMMaster';
import { PMSchedule } from './PMSchedule';
import { PMHistory } from './PMHistory';
import { PMFrequencies } from './PMFrequencies';
import { PMCompliance } from './PMCompliance';
import { Wrench, Calendar, History, ShieldAlert, Clock, Activity } from 'lucide-react';

export const PMIndex: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schedules' | 'master' | 'history' | 'frequencies' | 'compliance'>('schedules');

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
        <button 
          onClick={() => setActiveTab('master')}
          className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-2 ${
            activeTab === 'master' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'
          }`}
        >
          <Wrench size={18} /> Task Master
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-2 ${
            activeTab === 'history' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'
          }`}
        >
          <History size={18} /> History
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
      </div>

      <div className="mt-6">
        {activeTab === 'schedules' && <PMSchedule />}
        {activeTab === 'master' && <PMMaster />}
        {activeTab === 'history' && <PMHistory />}
        {activeTab === 'frequencies' && <PMFrequencies />}
        {activeTab === 'compliance' && <PMCompliance />}
      </div>
    </div>
  );
};
