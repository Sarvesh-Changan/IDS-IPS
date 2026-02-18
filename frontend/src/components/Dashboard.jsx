import React, { useEffect, useMemo, useState, useRef } from 'react';
import alertsData from '../data/alertsData';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { fetchAttacks } from '../services/api';
import socket from '../socket';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from 'recharts';

const COLORS = {
  Critical: '#ef5350',
  High: '#ff6b6b',
  Medium: '#4caf50',
  Low: '#fdd835',
  Escalated: '#ff6b6b',
  Remediated: '#4db8a8',
  'Working On': '#42a5f5'
};

export default function Dashboard() {
  const [liveData, setLiveData] = useState([]);
  const [timeRange, setTimeRange] = useState(1); // Default to Last 24 Hours
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const dashboardRef = useRef(null);

  // Fetch initial data from API
  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Fetch a large enough sample for the dashboard (e.g., last 200 attacks)
      const { data } = await fetchAttacks(1, 200);
      // Combine API data with mock data (mock data is usually older or for fill)
      const combined = [...data.attacks, ...alertsData];
      // De-duplicate by _id if necessary
      const unique = Array.from(new Map(combined.map(item => [item._id || item.id, item])).values());
      setLiveData(unique);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setLiveData(alertsData); // Fallback to mock data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Listen for real-time new attacks
    socket.on('new-attack', (newAttack) => {
      setLiveData(prev => {
        // Avoid duplicates if socket pulse happens twice
        if (prev.find(a => (a._id || a.id) === (newAttack._id || newAttack.id))) return prev;
        return [newAttack, ...prev];
      });
    });

    return () => socket.off('new-attack');
  }, []);

  // Filtered data based on time (Reactive to liveData updates)
  const filtered = useMemo(() => {
    const now = new Date();

    return liveData.filter(a => {
      const timestamp = a.timestamp || a.time;
      const alertTime = new Date(timestamp);
      if (isNaN(alertTime.getTime())) return false;

      if (useCustomRange) {
        if (!customRange.start || !customRange.end) return true;
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        return alertTime >= start && alertTime <= end;
      } else {
        // Precise window: now minus X days
        const startDate = new Date(now.getTime() - timeRange * 86400000);
        return alertTime >= startDate;
      }
    });
  }, [liveData, timeRange, customRange, useCustomRange]);

  const severityCounts = useMemo(() => {
    const map = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    filtered.forEach(a => { if (map[a.severity] !== undefined) map[a.severity]++ });
    return Object.keys(map).map(k => ({ name: k, value: map[k], fill: COLORS[k] }));
  }, [filtered]);

  const statusCounts = useMemo(() => {
    const counts = {};
    filtered.forEach(a => {
      const s = a.status || 'New';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k], fill: COLORS[k] || '#8884d8' }));
  }, [filtered]);

  const timeSeries = useMemo(() => {
    const buckets = Array.from({ length: 12 }, (_, i) => ({ name: `T-${11 - i}`, value: 0 }));
    filtered.forEach((a, idx) => {
      const b = idx % buckets.length;
      buckets[b].value += 1;
    });
    return buckets;
  }, [filtered]);

  const kpis = useMemo(() => {
    return {
      total: filtered.length,
      critical: filtered.filter(a => a.severity === 'Critical' || a.severity === 'High').length, // Grouping severe items
      remediated: filtered.filter(a => a.status === 'Remediated' || a.status === 'remediated').length,
      escalated: filtered.filter(a => a.status === 'Escalated' || a.status === 'escalated').length
    };
  }, [filtered]);

  const exportAsCSV = () => {
    if (!filtered || filtered.length === 0) return;
    const headers = ['Event ID', 'Timestamp', 'Severity', 'Category', 'Status', 'Device'];
    const csvContent = [
      headers.join(','),
      ...filtered.map((a, idx) => [
        String(a.eventId || idx + 1).padStart(4, '0'),
        new Date(a.timestamp || a.time).toLocaleString(),
        a.severity,
        a.category || (a.predictedLabel === 1 ? 'Benign' : 'Malicious'),
        a.status || 'New',
        a.device || a.srcIP
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ids_live_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  const exportAsPDF = async () => {
    if (!dashboardRef.current) return;
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        backgroundColor: '#020617',
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ids_security_audit_${new Date().toISOString().slice(0, 10)}.pdf`);
      setShowExportMenu(false);
    } catch (err) {
      console.error('PDF Export Error:', err);
    }
  };

  if (loading && liveData.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-sky-500 font-bold uppercase tracking-widest animate-pulse">
        Establishing Secure Stream...
      </div>
    );
  }

  return (
    <div className="dashboard-root flex h-full flex-col overflow-y-auto bg-slate-950 px-6 py-6 text-slate-100" ref={dashboardRef}>
      {/* Dynamic Header Controls */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-6 border-b border-slate-800/60 pb-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Live Timeline Sync</label>
            <div className="group relative flex items-center">
              <span className="absolute left-3 text-sky-500">⏰</span>
              <select
                className="appearance-none rounded-xl border border-slate-800 bg-slate-900/80 pb-2.5 pl-10 pr-10 pt-2.5 text-sm font-semibold text-slate-100 outline-none ring-sky-500/20 transition-all hover:bg-slate-800 focus:border-sky-500 focus:ring-4"
                value={useCustomRange ? 'custom' : timeRange}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setUseCustomRange(true);
                  } else {
                    setUseCustomRange(false);
                    setTimeRange(parseFloat(e.target.value));
                  }
                }}
              >
                <option value={1}>Last 24 Hours (Realtime)</option>
                <option value={7}>Last 7 Days</option>
                <option value={15}>Last 15 Days</option>
                <option value={30}>Current Month</option>
                <option value={90}>Last 3 Months</option>
                <option value="custom">🔍 Manual Period Selection</option>
              </select>
              <span className="pointer-events-none absolute right-3 text-[10px] text-slate-500">▼</span>
            </div>
          </div>

          {/* Custom Range Separated to the Right */}
          {useCustomRange && (
            <div className="flex animate-in fade-in slide-in-from-left-4 items-center gap-4 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-2 shadow-2xl">
              <div className="flex flex-col px-3">
                <label className="text-[10px] font-black uppercase tracking-tight text-slate-500">Analysis From</label>
                <input
                  type="datetime-local"
                  className="bg-transparent text-xs font-bold text-sky-400 outline-none"
                  value={customRange.start}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div className="h-8 w-px bg-slate-700"></div>
              <div className="flex flex-col px-3 pr-6">
                <label className="text-[10px] font-black uppercase tracking-tight text-slate-500">Analysis To</label>
                <input
                  type="datetime-local"
                  className="bg-transparent text-xs font-bold text-sky-400 outline-none"
                  value={customRange.end}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            className="flex items-center gap-2.5 rounded-xl border border-sky-500/30 bg-sky-500/5 px-6 py-3.5 text-sm font-bold text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.05)] transition-all hover:bg-sky-500/15 hover:shadow-[0_0_30px_rgba(56,189,248,0.2)]"
            onClick={() => setShowExportMenu(!showExportMenu)}
          >
            <span className="text-xl">📜</span> Intelligence Report
          </button>
          {showExportMenu && (
            <div className="absolute right-0 top-16 z-50 w-72 animate-in fade-in zoom-in-95 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-slate-800">
              <button
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm font-semibold text-slate-300 transition-colors hover:bg-sky-500/10 hover:text-sky-400"
                onClick={exportAsCSV}
              >
                <span className="text-2xl">🧾</span> Export CSV Audit Data
              </button>
              <button
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm font-semibold text-slate-300 transition-colors hover:bg-sky-500/10 hover:text-sky-400"
                onClick={exportAsPDF}
              >
                <span className="text-2xl">📁</span> Generate PDF Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Redesigned KPIs with High Definition */}
      <div className="mb-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Network Threats', value: kpis.total, icon: '🛡️', color: 'from-slate-300 to-slate-500', border: 'border-slate-800/80', shadow: 'shadow-slate-500/5' },
          { label: 'High Priority', value: kpis.critical, icon: '🔥', color: 'from-red-400 to-red-600', border: 'border-red-500/30', shadow: 'shadow-red-500/10' },
          { label: 'Remediated', value: kpis.remediated, icon: '💎', color: 'from-emerald-400 to-emerald-600', border: 'border-emerald-500/30', shadow: 'shadow-emerald-500/10' },
          { label: 'Escalations', value: kpis.escalated, icon: '📡', color: 'from-orange-400 to-orange-600', border: 'border-orange-500/30', shadow: 'shadow-orange-500/10' }
        ].map(kpi => (
          <div key={kpi.label} className={`kpi-card group flex flex-col rounded-[2.5rem] border ${kpi.border} bg-[#060b18] p-8 transition-all duration-300 hover:-translate-y-2 hover:bg-[#080f22] ${kpi.shadow}`}>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-slate-900/80 text-3xl shadow-lg ring-1 ring-slate-800/50">{kpi.icon}</div>
              <div className="animate-pulse rounded-full bg-sky-500/20 px-3 py-1 text-[9px] font-black uppercase text-sky-400">Live</div>
            </div>
            <div className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 mb-1.5">{kpi.label}</div>
            <div className={`bg-gradient-to-br ${kpi.color} bg-clip-text text-5xl font-black text-transparent`}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Ultra Modern Visualization Grid */}
      <div className="mb-8 grid gap-8 lg:grid-cols-3">
        <div className="col-span-2 rounded-[3rem] border border-slate-800/30 bg-[#060b18] p-10 shadow-sm backdrop-blur-xl">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-300">Severity Threat Matrix</h3>
            <div className="h-2 w-2 animate-ping rounded-full bg-emerald-500"></div>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={severityCounts} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 'bold' }} dy={10} />
              <YAxis allowDecimals={false} fontSize={12} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <Tooltip
                cursor={{ fill: 'rgba(56,189,248,0.02)' }}
                contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '20px', padding: '15px' }}
              />
              <Bar dataKey="value" radius={[15, 15, 5, 5]} barSize={60}>
                {severityCounts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-[3rem] border border-slate-800/30 bg-[#060b18] p-10 shadow-sm backdrop-blur-xl">
          <div className="mb-8">
            <h3 className="text-base font-black uppercase tracking-widest text-slate-400 text-center">Status Overview</h3>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie
                data={statusCounts}
                dataKey="value"
                nameKey="name"
                innerRadius={90}
                outerRadius={125}
                paddingAngle={10}
                stroke="none"
              >
                {statusCounts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '30px', color: '#94a3b8' }} />
              <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-12 rounded-[3rem] border border-slate-800/30 bg-[#060b18] p-10 shadow-sm">
        <div className="mb-8">
          <h3 className="text-lg font-black uppercase tracking-tight text-slate-300">Live Traffic Pulse</h3>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={timeSeries}>
            <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#1e293b" strokeOpacity={0.5} />
            <XAxis dataKey="name" fontSize={11} axisLine={false} tick={{ fill: '#475569' }} dy={10} />
            <YAxis allowDecimals={false} fontSize={11} axisLine={false} tick={{ fill: '#475569' }} />
            <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '24px' }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#38bdf8"
              strokeWidth={5}
              dot={{ r: 6, fill: '#38bdf8', strokeWidth: 3, stroke: '#020617' }}
              activeDot={{ r: 10, strokeWidth: 0 }}
              animationDuration={2000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Elite Event Ledger */}
      <div className="overflow-hidden rounded-[3rem] border border-slate-800/30 bg-[#060b18] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800/30 px-10 py-8">
          <h3 className="text-lg font-black uppercase tracking-tight text-slate-300">Recent Security Triggers</h3>
          <div className="rounded-full bg-slate-900 border border-slate-800 px-5 py-2 text-[10px] font-black uppercase text-slate-500 tracking-widest shadow-inner">
            Analysis of {filtered.length} Events
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-spacing-0">
            <thead>
              <tr className="bg-slate-900/30 text-[10px] font-black uppercase tracking-[0.25em] text-sky-500/60">
                <th className="px-10 py-6">Trace ID</th>
                <th className="px-10 py-6">Risk Factor</th>
                <th className="px-10 py-6">Event Classifier</th>
                <th className="px-10 py-6">System State</th>
                <th className="px-10 py-6">Source IP</th>
                <th className="px-10 py-6">Intercept Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {filtered.map((a, idx) => (
                <tr key={a._id || a.id} className="group transition-all hover:bg-sky-500/[0.03]">
                  <td className="px-10 py-6 font-mono text-xs font-black text-sky-400/80 tracking-widest group-hover:text-sky-400">
                    #{String(a.eventId || idx + 1).padStart(4, '0')}
                  </td>
                  <td className="px-10 py-6">
                    <span className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full shadow-lg" style={{ backgroundColor: COLORS[a.severity] }}></span>
                      <span className="text-[11px] font-black uppercase tracking-tight" style={{ color: COLORS[a.severity] }}>
                        {a.severity}
                      </span>
                    </span>
                  </td>
                  <td className="px-10 py-6 font-bold text-slate-100">{a.category || (a.predictedLabel === 1 ? 'Benign' : 'Malicious Activity')}</td>
                  <td className="px-10 py-6">
                    <span className="rounded-xl bg-slate-950 px-4 py-2 text-[10px] font-black text-slate-400 border border-slate-800/50 group-hover:border-sky-500/30 group-hover:text-slate-200 transition-all uppercase tracking-widest leading-none">
                      {a.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-10 py-6 font-mono text-xs font-semibold text-slate-500 group-hover:text-slate-300">
                    {a.device || a.srcIP}
                  </td>
                  <td className="px-10 py-6 text-[11px] font-black text-slate-600 group-hover:text-slate-400 tracking-tighter">
                    {new Date(a.timestamp || a.time).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    <span className="ml-2 opacity-50 font-normal">| {new Date(a.timestamp || a.time).toLocaleDateString()}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-32 text-center">
                    <div className="flex flex-col items-center gap-5">
                      <div className="text-6xl grayscale opacity-20">📡</div>
                      <div className="flex flex-col gap-1 items-center">
                        <span className="text-slate-400 font-black uppercase text-sm tracking-[0.3em]">No Intercepts Detected</span>
                        <span className="text-slate-600 text-[10px] font-bold">Scanning for network anomalies...</span>
                      </div>
                      <button
                        className="mt-4 rounded-full border border-sky-500/30 bg-sky-500/5 px-8 py-2 text-[11px] font-black uppercase text-sky-400 tracking-widest hover:bg-sky-500/10 transition-all"
                        onClick={() => { setTimeRange(90); setUseCustomRange(false) }}
                      >
                        Reset Analysis Window
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
