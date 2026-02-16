import React, { useEffect, useMemo, useState } from 'react';
import alertsData from '../data/alertsData';
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

function exportToCSV(rows, filename = 'alerts_export.csv') {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => '"' + String(r[h] ?? '') + '"').join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const [liveData, setLiveData] = useState(() => alertsData.slice());
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Simulate live changes: every 5s rotate and slightly mutate last alert
  useEffect(() => {
    const idMax = liveData.length;
    const iv = setInterval(() => {
      setLiveData(prev => {
        const next = prev.slice();
        // rotate: move first to end
        const first = next.shift();
        // mutate severity randomly for a small live feeling
        const severities = ['Critical', 'High', 'Medium', 'Low'];
        const last = { ...first, id: (parseInt(next[next.length - 1]?.id || idMax) % idMax) + 1 };
        last.severity = severities[Math.floor(Math.random() * severities.length)];
        last.color = COLORS[last.severity];
        next.push(last);
        return next;
      });
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  const filtered = useMemo(() => {
    const q = String(searchQuery || '').trim();
    if (!q) return liveData;
    return liveData.filter((alert, idx) => {
      const idStr = String(idx + 1).padStart(4, '0');
      return idStr.includes(q) || String(idx + 1).includes(q);
    });
  }, [liveData, searchQuery]);

  const displayed = filtered.slice(0, pageSize);

  const severityCounts = useMemo(() => {
    const map = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    liveData.forEach(a => { if (map[a.severity] !== undefined) map[a.severity]++ });
    return Object.keys(map).map(k => ({ name: k, value: map[k], fill: COLORS[k] }));
  }, [liveData]);

  const statusCounts = useMemo(() => {
    const counts = {};
    liveData.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1 });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k], fill: COLORS[k] || '#8884d8' }));
  }, [liveData]);

  const timeSeries = useMemo(() => {
    // Create simple series across the array index to look like activity over time
    const buckets = Array.from({ length: 8 }, () => 0);
    liveData.forEach((a, idx) => {
      const b = idx % buckets.length;
      buckets[b] += 1;
    });
    return buckets.map((v, i) => ({ name: `T-${buckets.length - i}`, value: v }));
  }, [liveData]);

  const kpis = useMemo(() => {
    const total = liveData.length;
    const critical = liveData.filter(a => a.severity === 'Critical').length;
    const remediated = liveData.filter(a => a.status === 'Remediated').length;
    const escalated = liveData.filter(a => a.status === 'Escalated').length;
    return { total, critical, remediated, escalated };
  }, [liveData]);

  return (
    <div className="dashboard-root mt-4 px-4 py-6 text-slate-100 md:px-8">
      <div className="dashboard-controls mb-4 flex flex-wrap items-center gap-3">
        <div className="search-box flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-slate-400">
          🔍
          <input
            placeholder="Search by Event ID (e.g. 0003 or 3)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-56 border-none bg-transparent text-sm text-slate-50 outline-none placeholder:text-slate-500"
          />
        </div>
        <div className="relative">
          <button
            className="control-btn inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-sky-400 shadow-sm hover:border-sky-400 hover:bg-slate-900"
            onClick={() => setShowFilterMenu((s) => !s)}
          >
            ⚙️ Filter
          </button>
          {showFilterMenu && (
            <div className="filter-menu absolute right-0 top-10 z-20 rounded-md border border-slate-700 bg-slate-950 px-1 py-1 shadow-xl">
              <button
                className={`filter-item block w-full rounded px-3 py-1 text-left text-sm ${
                  pageSize === 5 ? 'active bg-sky-500/15 text-sky-300' : 'text-slate-200 hover:bg-slate-900'
                }`}
                onClick={() => {
                  setPageSize(5);
                  setShowFilterMenu(false);
                }}
              >
                5 alerts
              </button>
              <button
                className={`filter-item block w-full rounded px-3 py-1 text-left text-sm ${
                  pageSize === 10 ? 'active bg-sky-500/15 text-sky-300' : 'text-slate-200 hover:bg-slate-900'
                }`}
                onClick={() => {
                  setPageSize(10);
                  setShowFilterMenu(false);
                }}
              >
                10 alerts
              </button>
              <button
                className={`filter-item block w-full rounded px-3 py-1 text-left text-sm ${
                  pageSize === 15 ? 'active bg-sky-500/15 text-sky-300' : 'text-slate-200 hover:bg-slate-900'
                }`}
                onClick={() => {
                  setPageSize(15);
                  setShowFilterMenu(false);
                }}
              >
                15 alerts
              </button>
            </div>
          )}
        </div>
        <button
          className="control-btn inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-sky-400 shadow-sm hover:border-sky-400 hover:bg-slate-900"
          onClick={() =>
            exportToCSV(
              displayed.map((a) => ({
                EventID: String(liveData.findIndex((x) => x.id === a.id) + 1).padStart(4, '0'),
                ...a,
              })),
              'alerts_page.csv',
            )
          }
        >
          ⬇️ Export
        </button>
      </div>

      <div className="kpis mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="kpi-card rounded-lg bg-slate-950 px-3 py-3 shadow">
          <div className="kpi-title text-xs font-medium uppercase tracking-wide text-slate-400">
            Total Alerts
          </div>
          <div className="kpi-value text-2xl font-bold text-slate-50">
            {kpis.total}
          </div>
        </div>
        <div className="kpi-card rounded-lg bg-slate-950 px-3 py-3 shadow">
          <div className="kpi-title text-xs font-medium uppercase tracking-wide text-slate-400">
            Critical
          </div>
          <div className="kpi-value text-2xl font-bold" style={{ color: COLORS.Critical }}>
            {kpis.critical}
          </div>
        </div>
        <div className="kpi-card rounded-lg bg-slate-950 px-3 py-3 shadow">
          <div className="kpi-title text-xs font-medium uppercase tracking-wide text-slate-400">
            Remediated
          </div>
          <div className="kpi-value text-2xl font-bold" style={{ color: COLORS.Remediated }}>
            {kpis.remediated}
          </div>
        </div>
        <div className="kpi-card rounded-lg bg-slate-950 px-3 py-3 shadow">
          <div className="kpi-title text-xs font-medium uppercase tracking-wide text-slate-400">
            Escalated
          </div>
          <div className="kpi-value text-2xl font-bold" style={{ color: COLORS.Escalated }}>
            {kpis.escalated}
          </div>
        </div>
      </div>

      <div className="charts-row mb-4 flex flex-col gap-3 lg:flex-row">
        <div className="chart-card flex-1 rounded-lg bg-slate-950 px-3 pb-3 pt-4 shadow">
          <div className="chart-title mb-2 text-sm font-semibold text-slate-200">
            Alerts by Severity
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={severityCounts} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8">
                {severityCounts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card flex-1 rounded-lg bg-slate-950 px-3 pb-3 pt-4 shadow">
          <div className="chart-title mb-2 text-sm font-semibold text-slate-200">
            Status Breakdown
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart margin={{ top: 20, right: 40, left: 0, bottom: 20 }}>
              <Pie
                data={statusCounts}
                dataKey="value"
                nameKey="name"
                innerRadius={40}
                outerRadius={80}
                label
              >
                {statusCounts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-row flex flex-col gap-3">
        <div className="chart-card wide rounded-lg bg-slate-950 px-3 pb-3 pt-4 shadow">
          <div className="chart-title mb-2 text-sm font-semibold text-slate-200">
            Alerts Over Time (simulated)
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={timeSeries} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="data-preview mt-4 rounded-lg bg-slate-950 px-3 pb-3 pt-4 shadow">
        <div className="preview-title mb-2 text-sm font-semibold text-slate-200">
          Preview (first {pageSize} records)
        </div>
        <table className="preview-table w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-slate-800 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Event ID
              </th>
              <th className="border-b border-slate-800 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Severity
              </th>
              <th className="border-b border-slate-800 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Category
              </th>
              <th className="border-b border-slate-800 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Status
              </th>
              <th className="border-b border-slate-800 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Device
              </th>
              <th className="border-b border-slate-800 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((a, idx) => (
              <tr key={a.id} className="border-b border-slate-900/80">
                <td className="px-3 py-2">
                  {String(liveData.findIndex((x) => x.id === a.id) + 1).padStart(4, '0')}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`severity-badge inline-flex rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${a.severity.toLowerCase()}`}
                    style={{ borderLeftColor: a.color }}
                  >
                    {a.severity}
                  </span>
                </td>
                <td className="px-3 py-2">{a.category}</td>
                <td className="px-3 py-2">{a.status}</td>
                <td className="px-3 py-2">{a.device}</td>
                <td className="px-3 py-2 text-xs text-slate-400">{a.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
