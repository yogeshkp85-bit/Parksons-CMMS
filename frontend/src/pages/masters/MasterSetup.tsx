/**
 * MasterSetup.tsx
 * Main Master Setup page — left nav shows sections,
 * right panel shows the selected master table.
 * All data comes from API — no hardcoded values.
 * Designed for non-technical maintenance managers.
 */

import React, { useState } from 'react';
import MasterTable, { type MasterField } from '../../components/masters/MasterTable';
import MachineMasterPage from './MachineMaster';
import {
  Building2, Wrench, Settings, Users, Calendar,
  Tag, AlertTriangle, CheckCircle, Zap, BarChart3,
  ChevronRight, Database, Clock, Package
} from 'lucide-react';

interface MasterSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: MasterItem[];
}

interface MasterItem {
  id: string;
  label: string;
  subtitle: string;
  modelName?: string;  // if undefined, uses custom component
  customComponent?: React.ReactNode;
  fields?: MasterField[];
}

const MASTER_SECTIONS: MasterSection[] = [
  {
    id: 'organisation',
    label: 'Organisation',
    icon: <Building2 size={15} />,
    items: [
      {
        id: 'plant',
        label: 'Plants',
        subtitle: 'Manage plant locations (Pune, Chakan)',
        modelName: 'plant',
        fields: [
          { key: 'name',    label: 'Plant Name',    type: 'text',   required: true,  placeholder: 'e.g. Pune Plant' },
          { key: 'code',    label: 'Plant Code',    type: 'text',   required: true,  placeholder: 'e.g. PUNE' },
          { key: 'address', label: 'Address',       type: 'textarea', placeholder: 'Plant address' },
        ],
      },
      {
        id: 'financial-year',
        label: 'Financial Years',
        subtitle: 'Indian FY (Apr–Mar). Add new year when it begins.',
        modelName: 'financialYear',
        fields: [
          { key: 'code',      label: 'FY Code',    type: 'text',    required: true, placeholder: 'e.g. 2026-27' },
          { key: 'label',     label: 'FY Label',   type: 'text',    required: true, placeholder: 'e.g. FY 2026-27' },
          { key: 'startDate', label: 'Start Date', type: 'date',    required: true },
          { key: 'endDate',   label: 'End Date',   type: 'date',    required: true },
          { key: 'isCurrent', label: 'Is Current FY', type: 'boolean' },
          { key: 'displayOrder', label: 'Display Order', type: 'number', placeholder: '1' },
        ],
      },
    ],
  },
  {
    id: 'machine',
    label: 'Machine',
    icon: <Wrench size={15} />,
    items: [
      {
        id: 'machine-master',
        label: 'Machine Master',
        subtitle: 'Department → Machine → Unit/Section hierarchy',
        // uses custom component
      },
      {
        id: 'machineCategory',
        label: 'Machine Categories',
        subtitle: 'Machine type groupings (PRINTING, CORRUGATION, etc.)',
        modelName: 'machineCategory',
        fields: [
          { key: 'name', label: 'Category Name', type: 'text', required: true, placeholder: 'e.g. PRINTING' },
          { key: 'code', label: 'Category Code', type: 'text', required: true, placeholder: 'e.g. PRINTING' },
        ],
      },
    ],
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    icon: <Settings size={15} />,
    items: [
      {
        id: 'breakdownCategory',
        label: 'Breakdown Categories',
        subtitle: 'e.g. Breakdown, Predictive, Planning, Preventive, Corrective',
        modelName: 'breakdownCategory',
        fields: [
          { key: 'name', label: 'Category Name', type: 'text', required: true, placeholder: 'e.g. Breakdown' },
        ],
      },
      {
        id: 'problemCategory',
        label: 'Problem Types',
        subtitle: 'e.g. Electrical, Mechanical, Pneumatic air, Utility',
        modelName: 'problemCategory',
        fields: [
          { key: 'name', label: 'Problem Type', type: 'text', required: true, placeholder: 'e.g. Electrical' },
        ],
      },
      {
        id: 'rootCauseCategory',
        label: 'Root Causes',
        subtitle: 'Root cause categories for breakdown analysis',
        modelName: 'rootCauseCategory',
        fields: [
          { key: 'name', label: 'Root Cause', type: 'text', required: true, placeholder: 'e.g. Wear and Tear' },
        ],
      },
      {
        id: 'actionTakenCategory',
        label: 'Action Taken',
        subtitle: 'Standard actions taken during maintenance',
        modelName: 'actionTakenCategory',
        fields: [
          { key: 'name', label: 'Action Taken', type: 'text', required: true, placeholder: 'e.g. Replaced' },
        ],
      },
    ],
  },
  {
    id: 'team',
    label: 'Team & Shifts',
    icon: <Users size={15} />,
    items: [
      {
        id: 'technician',
        label: 'Technicians',
        subtitle: 'Maintenance team members — drives Attended By dropdown in all forms',
        modelName: 'technician',
        fields: [
          { key: 'code',        label: 'Tech Code',    type: 'text', required: true, placeholder: 'e.g. TECH-021' },
          { key: 'name',        label: 'Full Name',    type: 'text', required: true, placeholder: 'e.g. Sandip' },
          { key: 'designation', label: 'Designation',  type: 'text', placeholder: 'e.g. Sr. Technician' },
          { key: 'department',  label: 'Department',   type: 'text', placeholder: 'e.g. PRINTING' },
          { key: 'phone',       label: 'Phone',        type: 'text', placeholder: '+91 XXXXX XXXXX' },
          { key: 'displayOrder',label: 'Display Order',type: 'number', placeholder: '1' },
        ],
      },
      {
        id: 'shiftMaster',
        label: 'Shifts',
        subtitle: 'Shift timing configuration (S1: 07:00–14:59, S2: 15:00–22:59, S3: 23:00–06:59)',
        modelName: 'shiftMaster',
        fields: [
          { key: 'name',      label: 'Shift Name',  type: 'text', required: true, placeholder: 'e.g. First Shift' },
          { key: 'code',      label: 'Shift Code',  type: 'text', required: true, placeholder: 'e.g. S1' },
          { key: 'startTime', label: 'Start Time',  type: 'text', required: true, placeholder: 'e.g. 07:00' },
          { key: 'endTime',   label: 'End Time',    type: 'text', required: true, placeholder: 'e.g. 14:59' },
        ],
      },
    ],
  },
  {
    id: 'spare-vendor',
    label: 'Spare Parts & Vendor',
    icon: <Package size={15} />,
    items: [
      {
        id: 'vendor',
        label: 'Vendors',
        subtitle: 'Spare parts and service vendors',
        modelName: 'vendor',
        fields: [
          { key: 'name',          label: 'Vendor Name',    type: 'text', required: true, placeholder: 'e.g. SKF India Ltd' },
          { key: 'contactPerson', label: 'Contact Person', type: 'text', placeholder: 'Contact name' },
          { key: 'email',         label: 'Email',          type: 'text', placeholder: 'email@vendor.com' },
          { key: 'phone',         label: 'Phone',          type: 'text', placeholder: '+91 XXXXX XXXXX' },
          { key: 'address',       label: 'Address',        type: 'textarea', placeholder: 'Vendor address' },
        ],
      },
    ],
  },
  {
    id: 'pm',
    label: 'Preventive Maintenance',
    icon: <Calendar size={15} />,
    items: [
      {
        id: 'pmFrequencyMaster',
        label: 'PM Frequencies',
        subtitle: 'Schedule frequency: Daily, Weekly, Monthly, Quarterly, etc.',
        modelName: 'pmFrequencyMaster',
        fields: [
          { key: 'name',         label: 'Frequency Name', type: 'text',   required: true, placeholder: 'e.g. Monthly' },
          { key: 'code',         label: 'Frequency Code', type: 'text',   required: true, placeholder: 'e.g. MONTHLY' },
          { key: 'intervalDays', label: 'Interval (Days)', type: 'number', required: true, placeholder: 'e.g. 30' },
        ],
      },
    ],
  },
];

export default function MasterSetup() {
  const [activeSection, setActiveSection] = useState('organisation');
  const [activeItem, setActiveItem] = useState('plant');

  const currentSection = MASTER_SECTIONS.find(s => s.id === activeSection);
  const currentItem = currentSection?.items.find(i => i.id === activeItem);

  const renderContent = () => {
    if (!currentItem) return null;

    // Machine Master uses custom component
    if (currentItem.id === 'machine-master') {
      return <MachineMasterPage />;
    }

    if (currentItem.modelName && currentItem.fields) {
      return (
        <MasterTable
          key={currentItem.id}
          title={currentItem.label}
          subtitle={currentItem.subtitle}
          modelName={currentItem.modelName}
          fields={currentItem.fields}
        />
      );
    }

    return <div className="text-gray-500 text-sm">Select a master from the left panel.</div>;
  };

  return (
    <div className="flex h-full min-h-screen gap-0 animate-fade-in">
      {/* Left Navigation */}
      <div className="w-56 flex-shrink-0 bg-slate-900/50 border-r border-white/5 overflow-y-auto">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Database size={15} className="text-emerald-400" />
            <span className="text-sm font-bold text-gray-100">Master Setup</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Configure system masters</p>
        </div>

        <nav className="p-2">
          {MASTER_SECTIONS.map(section => (
            <div key={section.id} className="mb-1">
              <button
                onClick={() => {
                  setActiveSection(section.id);
                  setActiveItem(section.items[0].id);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  activeSection === section.id
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {section.icon}
                {section.label}
              </button>

              {activeSection === section.id && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {section.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveItem(item.id)}
                      className={`w-full flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] cursor-pointer transition-colors text-left ${
                        activeItem === item.id
                          ? 'bg-emerald-500/15 text-emerald-300 font-medium'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/3'
                      }`}
                    >
                      <ChevronRight size={10} className={activeItem === item.id ? 'opacity-100' : 'opacity-0'} />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Tier 3 placeholder section */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-[9px] text-gray-600 uppercase tracking-wider px-3 mb-2 font-mono">Future Modules</p>
            {['Safety', 'Quality', 'HR & Attendance', 'Utilities', 'Knowledge Base'].map(m => (
              <div key={m} className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-700 cursor-not-allowed">
                <ChevronRight size={10} className="opacity-0" />
                {m}
                <span className="ml-auto text-[9px] bg-gray-800 text-gray-600 px-1.5 py-0.5 rounded font-mono">Soon</span>
              </div>
            ))}
          </div>
        </nav>
      </div>

      {/* Right Content Panel */}
      <div className="flex-1 p-6 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}
