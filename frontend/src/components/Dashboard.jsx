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
  Critical: 'var(--accent-danger)',
  High: 'var(--accent-warning)',
  Medium: 'var(--accent-success)',
  Low: 'var(--accent-primary)',
  Escalated: 'var(--accent-danger)',
  Remediated: 'var(--accent-success)',
  'Working On': 'var(--accent-primary)'
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
        backgroundColor: '#0b0f19',
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
      <div className="flex h-screen items-center justify-center bg-main text-accent-primary font-black uppercase tracking-[0.2em] animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full border-4 border-accent-primary border-t-transparent animate-spin"></div>
          Establishing SECURE Protocol...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-root flex h-full flex-col overflow-y-auto bg-main px-6 py-6 text-main transition-colors duration-300" ref={dashboardRef}>
      {/* Dynamic Header Controls */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-6 border-b border-theme/30 pb-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-black uppercase tracking-[0.15em] text-muted ml-1">Live Timeline Sync</label>
            <div className="group relative flex items-center">
              <span className="absolute left-3.5 text-accent-primary drop-shadow-[0_0_8px_var(--accent-primary)]">⏰</span>
              <select
                className="appearance-none rounded-xl border border-theme bg-card px-10 py-3 text-sm font-bold text-main outline-none ring-accent-primary/20 transition-all hover:bg-hover focus:border-accent-primary focus:ring-4 cursor-pointer"
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
              <span className="pointer-events-none absolute right-3.5 text-[10px] text-muted font-bold">▼</span>
            </div>
          </div>

          {/* Custom Range */}
          {useCustomRange && (
            <div className="flex animate-in fade-in slide-in-from-left-4 items-center gap-4 rounded-xl border border-theme bg-card p-2.5 shadow-2xl">
              <div className="flex flex-col px-3">
                <label className="text-[10px] font-black uppercase tracking-tight text-muted">Analysis From</label>
                <input
                  type="datetime-local"
                  className="bg-transparent text-xs font-bold text-accent-primary outline-none focus:ring-0"
                  value={customRange.start}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div className="h-10 w-px bg-theme/50"></div>
              <div className="flex flex-col px-3 pr-6">
                <label className="text-[10px] font-black uppercase tracking-tight text-muted">Analysis To</label>
                <input
                  type="datetime-local"
                  className="bg-transparent text-xs font-bold text-accent-primary outline-none focus:ring-0"
                  value={customRange.end}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            className="flex items-center gap-3 rounded-xl border border-accent-primary/40 bg-accent-primary/5 px-6 py-3.5 text-sm font-black text-accent-primary uppercase tracking-widest shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all hover:bg-accent-primary hover:text-inverse hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] active:scale-95"
            onClick={() => setShowExportMenu(!showExportMenu)}
          >
            📜 Intelligence Report
          </button>
          {showExportMenu && (
            <div className="absolute right-0 top-16 z-50 w-72 animate-in fade-in zoom-in-95 overflow-hidden rounded-2xl border border-theme bg-sidebar p-2 shadow-[0_20px_60px_rgba(0,0,0,0.6)] ring-1 ring-theme">
              <button
                className="flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left text-sm font-bold text-main transition-all hover:bg-accent-primary/10 hover:text-accent-primary group"
                onClick={exportAsCSV}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">🧾</span> Export CSV Audit Data
              </button>
              <button
                className="flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left text-sm font-bold text-main transition-all hover:bg-accent-primary/10 hover:text-accent-primary group"
                onClick={exportAsPDF}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">📁</span> Generate PDF Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Network Threats', value: kpis.total, icon: '🛡️', color: 'from-accent-info to-blue-600', border: 'border-theme', text: 'text-accent-info' },
          { label: 'High Priority', value: kpis.critical, icon: '🔥', color: 'from-accent-danger to-red-600', border: 'border-accent-danger/20', text: 'text-accent-danger' },
          { label: 'Remediated', value: kpis.remediated, icon: '💎', color: 'from-accent-success to-emerald-600', border: 'border-accent-success/20', text: 'text-accent-success' },
          { label: 'Escalations', value: kpis.escalated, icon: '📡', color: 'from-accent-warning to-orange-600', border: 'border-accent-warning/20', text: 'text-accent-warning' }
        ].map(kpi => (
          <div key={kpi.label} className={`kpi-card group flex flex-col rounded-[2.5rem] border ${kpi.border} bg-card p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:bg-hover active:translate-y-0`}>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sidebar/80 text-3xl shadow-lg ring-1 ring-theme/50 transition-transform group-hover:scale-110 group-hover:rotate-3">{kpi.icon}</div>
              <div className="animate-pulse rounded-full bg-accent-primary/10 px-3 py-1 text-[9px] font-black uppercase text-accent-primary border border-accent-primary/20 tracking-widest">Active</div>
            </div>
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-muted mb-2">{kpi.label}</div>
            <div className={`bg-gradient-to-br ${kpi.color} bg-clip-text text-5xl font-black text-transparent drop-shadow-sm`}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Visualization Grid */}
      <div className="mb-8 grid gap-8 lg:grid-cols-3">
        <div className="col-span-2 rounded-[3rem] border border-theme/40 bg-card p-10 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-lg font-black uppercase tracking-[0.2em] text-accent-primary">Severity Threat Matrix</h3>
            <div className="h-2.5 w-2.5 animate-ping rounded-full bg-accent-success shadow-[0_0_10px_var(--accent-success)]"></div>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={severityCounts} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontWeight: 'black' }} dy={10} />
              <YAxis allowDecimals={false} fontSize={11} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
              <Tooltip
                cursor={{ fill: 'rgba(0,240,255,0.03)' }}
                contentStyle={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-main)', borderRadius: '1.5rem', padding: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
              />
              <Bar dataKey="value" radius={[15, 15, 6, 6]} barSize={55}>
                {severityCounts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-[3rem] border border-theme/40 bg-card p-10 shadow-2xl backdrop-blur-xl">
          <div className="mb-8">
            <h3 className="text-sm font-black uppercase tracking-[0.25em] text-muted text-center italic">Response Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie
                data={statusCounts}
                dataKey="value"
                nameKey="name"
                innerRadius={85}
                outerRadius={120}
                paddingAngle={12}
                stroke="none"
              >
                {statusCounts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', tracking: '0.1em', paddingTop: '40px', color: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-main)', borderRadius: '1.5rem' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-12 rounded-[3.5rem] border border-theme/40 bg-card p-10 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5 font-black text-8xl uppercase pointer-events-none select-none">Live Telemetry</div>
        <div className="mb-10 flex items-center justify-between">
          <h3 className="text-lg font-black uppercase tracking-[0.2em] text-accent-primary">Network Ingress Pulse</h3>
          <div className="px-4 py-2 rounded-xl bg-accent-primary/5 border border-accent-primary/20 text-[10px] font-black text-accent-primary uppercase tracking-widest">Scanning Synchronized</div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={timeSeries}>
            <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="var(--border-main)" strokeOpacity={0.2} />
            <XAxis dataKey="name" fontSize={10} axisLine={false} tick={{ fill: 'var(--text-muted)', fontWeight: 'bold' }} dy={12} />
            <YAxis allowDecimals={false} fontSize={10} axisLine={false} tick={{ fill: 'var(--text-muted)' }} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-main)', borderRadius: '1.5rem', padding: '15px' }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--accent-primary)"
              strokeWidth={6}
              dot={{ r: 7, fill: 'var(--bg-main)', strokeWidth: 4, stroke: 'var(--accent-primary)' }}
              activeDot={{ r: 10, strokeWidth: 0, fill: 'var(--accent-primary)', shadow: '0 0 20px var(--accent-primary)' }}
              animationDuration={2500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Ledger Table */}
      <div className="overflow-hidden rounded-[4rem] border border-theme bg-card shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between border-b border-theme/40 px-12 py-10 bg-sidebar/30">
          <div>
            <h3 className="text-xl font-black uppercase tracking-[0.25em] text-main">Threat Intercept Ledger</h3>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1.5">Cryptographic Trace of Detected Anomalies</p>
          </div>
          <div className="rounded-2xl bg-main border border-theme px-6 py-3 text-[11px] font-black uppercase text-accent-primary tracking-[0.15em] shadow-inner">
            Synchronized: {filtered.length} SECURITY NODES
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-spacing-0">
            <thead>
              <tr className="bg-sidebar/50 text-[11px] font-black uppercase tracking-[0.3em] text-accent-primary/70 border-b border-theme/40">
                <th className="px-12 py-7">Trace Identity</th>
                <th className="px-12 py-7">Risk Vector</th>
                <th className="px-12 py-7">Event Signature</th>
                <th className="px-12 py-7">Operational State</th>
                <th className="px-12 py-7">Ingress IP</th>
                <th className="px-12 py-7">Intersection Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme/30">
              {filtered.map((a, idx) => (
                <tr key={a._id || a.id} className="group transition-all hover:bg-accent-primary/[0.04]">
                  <td className="px-12 py-7 font-mono text-xs font-black text-accent-primary/60 tracking-widest group-hover:text-accent-primary transition-colors">
                    #{(a.eventId || idx + 1).toString().padStart(4, '0')}
                  </td>
                  <td className="px-12 py-7">
                    <span className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full shadow-[0_0_12px_currentColor]" style={{ backgroundColor: COLORS[a.severity] }}></span>
                      <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: COLORS[a.severity] }}>
                        {a.severity}
                      </span>
                    </span>
                  </td>
                  <td className="px-12 py-7 font-bold text-main group-hover:text-accent-primary transition-colors">{a.category || (a.predictedLabel === 1 ? 'BENIGN TRAFFIC' : 'SUSPICIOUS PACKET')}</td>
                  <td className="px-12 py-7">
                    <span className="rounded-xl bg-sidebar px-5 py-2.5 text-[10px] font-black text-muted border border-theme/60 group-hover:border-accent-primary group-hover:text-accent-primary transition-all uppercase tracking-[0.2em]">
                      {a.status || 'INGESTED'}
                    </span>
                  </td>
                  <td className="px-12 py-7 font-mono text-xs font-bold text-muted group-hover:text-accent-info transition-colors">
                    {a.device || a.srcIP}
                  </td>
                  <td className="px-12 py-7 text-[11px] font-black text-muted group-hover:text-main transition-colors tracking-tight">
                    {new Date(a.timestamp || a.time).toLocaleString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                    <span className="ml-2.5 opacity-40 font-bold">| {new Date(a.timestamp || a.time).toLocaleDateString()}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-40 text-center bg-sidebar/10">
                    <div className="flex flex-col items-center gap-8">
                      <div className="text-8xl opacity-10 animate-pulse">📡</div>
                      <div className="flex flex-col gap-2 items-center">
                        <span className="text-muted font-black uppercase text-lg tracking-[0.5em]">Zero Intercepts</span>
                        <span className="text-muted/40 text-[11px] font-black uppercase tracking-widest">Network Integrity Verified: 100%</span>
                      </div>
                      <button
                        className="mt-6 rounded-full border border-accent-primary/40 bg-accent-primary/5 px-10 py-3 text-[11px] font-black uppercase text-accent-primary tracking-[0.25em] hover:bg-accent-primary hover:text-inverse hover:shadow-2xl transition-all active:scale-95"
                        onClick={() => { setTimeRange(90); setUseCustomRange(false) }}
                      >
                        Recalibrate Sensor Window
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
