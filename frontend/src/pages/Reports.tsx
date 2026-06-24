import React, { useState, useEffect } from 'react';
import { FileText, FileDown, Printer, Filter } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import api from '../services/api';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export const Reports: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [kpi, setKpi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('pareto'); // pareto, mttr, mtbf, table
  const [dateFilter, setDateFilter] = useState('all');
  

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, kpiRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/reports/kpi')
      ]);
      
      if (dashRes.data?.data?.rows) {
        setData(dashRes.data.data.rows);
      }
      if (kpiRes.data?.data?.rows) {
        setKpi(kpiRes.data.data.rows);
      }
    } catch (err) {
      alert('Failed to load reports', 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (data.length === 0) return;
    const headers = ['Ref ID', 'Date', 'Shift', 'Machine Name', 'Department', 'Problem Type', 'Action Taken', 'Downtime (Min)'];
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      csvRows.push([
        row.refId || row.Ref_ID,
        row.date || row.Date,
        row.shift || row.Shift,
        row.machineName || row.Machine_Name,
        row.unit || row.Unit,
        row.problemType || row.Problem_Type,
        `"${String(row.actionTaken || row.Action_Taken || '').replace(/"/g, '""')}"`,
        row.minutes || row.Minutes || 0
      ].join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CMMS_Report_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = async () => {
    const input = document.getElementById('report-container');
    if (!input) return;
    try {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.text("CMMS Reliability Report", 14, 15);
      pdf.addImage(imgData, 'PNG', 0, 25, pdfWidth, pdfHeight);
      pdf.save(`CMMS_Reliability_Report_${Date.now()}.pdf`);
    } catch (err) {
      alert('Failed to export PDF', 'ERROR');
    }
  };

  const printReport = () => {
    const printContents = document.getElementById('report-container')?.innerHTML;
    const originalContents = document.body.innerHTML;
    if (printContents) {
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  // --- Data Transformations ---

  // Pareto Chart (Downtime by Machine)
  const downtimeByMachine = data.reduce((acc: any, row: any) => {
    const mName = row.machineName || row.Machine_Name || 'Unknown';
    const min = Number(row.minutes || row.Minutes || 0);
    acc[mName] = (acc[mName] || 0) + min;
    return acc;
  }, {});

  const paretoSorted = Object.entries(downtimeByMachine).sort((a: any, b: any) => b[1] - a[1]);
  const paretoData = {
    labels: paretoSorted.map(x => x[0]),
    datasets: [{
      label: 'Downtime (Min)',
      data: paretoSorted.map(x => x[1]),
      backgroundColor: 'rgba(6, 182, 212, 0.5)',
      borderColor: 'rgba(6, 182, 212, 1)',
      borderWidth: 1
    }]
  };

  // KPI Chart (MTTR / MTBF)
  const kpiData = {
    labels: kpi.map(k => k.Month_Year || k.monthYear || 'Unknown'),
    datasets: [
      {
        label: 'MTBF (Hours)',
        data: kpi.map(k => k.MTBF_Hrs || k.mtbf),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1
      },
      {
        label: 'MTTR (Hours)',
        data: kpi.map(k => k.MTTR_Hrs || k.mttr),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Reliability Reports</h1>
          <p className="text-sm text-gray-400 mt-1">Analyze breakdown history, Pareto metrics, MTTR and MTBF.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-all">
            <FileDown size={16} /> Excel (CSV)
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-sm font-medium hover:bg-rose-500/20 transition-all">
            <FileText size={16} /> Export PDF
          </button>
          <button onClick={printReport} className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-sm font-medium hover:bg-cyan-500/20 transition-all">
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      <div className="glass-panel p-2 flex gap-2 border border-white/5 rounded-xl overflow-x-auto">
        <button onClick={() => setReportType('pareto')} className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${reportType === 'pareto' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
          Machine Pareto
        </button>
        <button onClick={() => setReportType('mttr')} className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${reportType === 'mttr' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
          MTTR / MTBF Trends
        </button>
        <button onClick={() => setReportType('table')} className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${reportType === 'table' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
          Raw Data Table
        </button>
      </div>

      <div id="report-container" className="bg-[#0b0f19] p-6 rounded-2xl border border-white/5">
        {loading ? (
          <div className="py-20 text-center text-gray-500">Generating report...</div>
        ) : (
          <>
            {reportType === 'pareto' && (
              <div>
                <h3 className="text-white font-bold mb-4">Machine Downtime Pareto</h3>
                <div className="h-[400px]">
                  <Bar 
                    data={paretoData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { labels: { color: '#94a3b8' } } },
                      scales: {
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
                      }
                    }} 
                  />
                </div>
              </div>
            )}

            {reportType === 'mttr' && (
              <div>
                <h3 className="text-white font-bold mb-4">MTBF and MTTR Trends</h3>
                <div className="h-[400px]">
                  <Bar 
                    data={kpiData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { labels: { color: '#94a3b8' } } },
                      scales: {
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
                      }
                    }} 
                  />
                </div>
              </div>
            )}

            {reportType === 'table' && (
              <div>
                <h3 className="text-white font-bold mb-4">Historical Breakdowns</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-gray-400">
                        <th className="p-3">Ref ID</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Machine</th>
                        <th className="p-3">Problem</th>
                        <th className="p-3 text-right">Downtime (Min)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.map((r, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] text-gray-300">
                          <td className="p-3 font-mono text-xs">{r.refId || r.Ref_ID}</td>
                          <td className="p-3">{r.date || r.Date}</td>
                          <td className="p-3 font-medium text-cyan-400">{r.machineName || r.Machine_Name}</td>
                          <td className="p-3 text-xs">{r.problemType || r.Problem_Type}</td>
                          <td className="p-3 text-right font-mono text-rose-400">{r.minutes || r.Minutes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
