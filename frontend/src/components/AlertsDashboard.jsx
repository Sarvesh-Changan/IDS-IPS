import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatsCards from './StatsCards';
import { fetchAttacks, updateAttack } from '../services/api';
import socket from '../socket';
import { labelNames, protocolMap } from '../utils/attackMappings'; // we'll create this

export default function AlertsDashboard() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load attacks from API
  const loadAttacks = async () => {
    setLoading(true);
    try {
      const { data } = await fetchAttacks(page, pageSize, { search: searchQuery });
      setAlerts(data.attacks);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load attacks', err);
      setError('Could not load alerts');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when page/pageSize/search changes
  useEffect(() => {
    loadAttacks();
  }, [page, pageSize, searchQuery]);

  // Listen for real-time new attacks
  useEffect(() => {
    socket.on('new-attack', (newAttack) => {
      setAlerts(prev => [newAttack, ...prev]);
      // Adjust total pages if needed, but simpler: just prepend and keep pagination as is
      // You might want to increment total count, but for simplicity we keep totalPages unchanged
    });
    return () => socket.off('new-attack');
  }, []);

  // Helper to get severity color/class based on riskLevel or predictedLabel
  const getSeverityInfo = (attack) => {
    // If riskLevel is available from ML, use it; otherwise derive from label
    const risk = attack.riskLevel || (attack.predictedLabel === 1 ? 'Low' : 'Medium');
    switch (risk) {
      case 'High':
        return { color: '#ff6b6b', class: 'high', text: 'High' };
      case 'Medium':
        return { color: '#ffb86b', class: 'medium', text: 'Medium' };
      case 'Low':
      default:
        return { color: '#4db8a8', class: 'low', text: 'Low' };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'escalated':
        return '#ff6b6b';
      case 'remediated':
        return '#4db8a8';
      case 'working':
        return '#42a5f5';
      default: // new
        return '#9e9e9e';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'escalated':
        return '⚠️';
      case 'remediated':
        return '✓';
      case 'working':
        return '🔍';
      default:
        return '•';
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAlerts(alerts.map(a => a._id));
    } else {
      setSelectedAlerts([]);
    }
  };

  const handleSelectAlert = (id) => {
    setSelectedAlerts(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleAnalyze = (id) => {
    navigate(`/analyze/${id}`);
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'escalated':
      case 'remediated':
        return '#ffffff';
      case 'working':
        return '#051225';
      default:
        return '#ffffff';
    }
  };

  const updateAlertStatus = async (id, newStatus) => {
    try {
      await updateAttack(id, { status: newStatus, actionType: 'status_change' });
      // Update local state optimistically
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, status: newStatus } : a));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const exportToCSV = (rows, filename = 'alerts_export.csv') => {
    if (!rows || rows.length === 0) return;
    // Convert rows to a flat structure for export
    const exportRows = rows.map(attack => ({
      'Event ID': String(attack.eventId || 0).padStart(4, '0'), // format as 0001
      'Timestamp': new Date(attack.timestamp).toLocaleString(),
      'Source IP': attack.srcIP,
      'Destination IP': attack.dstIP,
      'Protocol': protocolMap[attack.protocol] || attack.protocol,
      'Port': attack.dstPort,
      'Attack Type': labelNames[attack.predictedLabel] || 'Unknown',
      'Confidence': attack.confidence ? (attack.confidence * 100).toFixed(1) + '%' : '',
      'Risk Level': attack.riskLevel || '',
      'Status': attack.status,
    }));
    const headers = Object.keys(exportRows[0]);
    const csv = [
      headers.join(','),
      ...exportRows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle search with debounce? For simplicity, we trigger on every keystroke (searchQuery state changes trigger loadAttacks)
  // But we should add a small debounce to avoid too many requests.
  // We'll implement a simple debounce with useEffect cleanup.
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery !== undefined) {
        setPage(1); // reset to first page on search
        loadAttacks();
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // For now, we don't filter client-side; we rely on backend search.
  // The search input sends query to backend via fetchAttacks params.

  return (
    <div className="alerts-dashboard mt-4 flex-1 overflow-y-auto bg-slate-950 px-4 py-6 md:px-8">
      <StatsCards />

      <div className="dashboard-controls mb-6 flex flex-wrap items-center gap-3">
        <div className="search-box flex min-w-[220px] flex-1 items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-400">
          🔍
          <input
            type="text"
            placeholder="Search by IP, port, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-none bg-transparent text-sm text-slate-50 outline-none placeholder:text-slate-500"
          />
        </div>
        <div className="relative">
          <button
            className="control-btn inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-sky-400 shadow-sm transition-all hover:border-sky-400 hover:bg-slate-800 hover:shadow-md"
            onClick={() => setShowFilterMenu((s) => !s)}
          >
            ⚙️ Page Size
          </button>
          {showFilterMenu && (
            <div className="filter-menu absolute right-0 top-11 z-20 flex flex-col gap-1 rounded-md border border-slate-700 bg-slate-900 px-1 py-1 shadow-xl">
              {[5, 10, 15, 25].map(size => (
                <button
                  key={size}
                  className={`filter-item rounded px-3 py-1 text-left text-sm ${pageSize === size ? 'active bg-sky-500/15 text-sky-300' : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  onClick={() => {
                    setPageSize(size);
                    setPage(1); // reset to first page
                    setShowFilterMenu(false);
                  }}
                >
                  {size} alerts
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className="control-btn inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-sky-400 shadow-sm transition-all hover:border-sky-400 hover:bg-slate-800 hover:shadow-md"
          onClick={() => exportToCSV(alerts, 'alerts_export.csv')}
        >
          ⬇️ Export
        </button>
      </div>

      {loading && <div className="text-slate-400">Loading alerts...</div>}
      {error && <div className="text-red-500">{error}</div>}

      <div className="alerts-table-container overflow-hidden rounded-lg border border-slate-800 bg-slate-900 shadow-xl">
        <table className="alerts-table w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 text-left">Event ID</th>
              <th className="px-4 py-3 text-left">Severity</th>
              <th className="px-4 py-3 text-left">Alert Category</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Device (IP)</th>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((attack) => {
              const severity = getSeverityInfo(attack);
              const attackType = labelNames[attack.predictedLabel] || 'Unknown';
              const protocolName = protocolMap[attack.protocol] || `Proto-${attack.protocol}`;
              // Use srcIP as "device" for now; adjust if you have a device field
              const deviceIP = attack.srcIP;
              const timeStr = new Date(attack.timestamp).toLocaleString();

              return (
                <tr
                  key={attack._id}
                  className={`border-t border-slate-800/80 text-slate-200 transition-colors hover:bg-sky-500/5 ${selectedAlerts.includes(attack._id) ? 'selected bg-sky-500/10 text-sky-100' : ''
                    }`}
                >
                  <td className="px-4 py-3">
                    <span className="source-badge inline-flex rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200">
                      {String(attack.eventId || 0).padStart(4, '0')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`severity-badge inline-flex rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${severity.class}`}
                      style={{ backgroundColor: severity.color, color: '#fff' }}
                    >
                      {severity.text}
                    </span>
                  </td>
                  <td className="alert-name max-w-xs px-4 py-3">
                    <div className="break-words text-sky-400">
                      {attackType} ({protocolName}:{attack.dstPort})
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="status-select rounded-md px-2 py-1 text-xs font-semibold shadow-sm"
                      value={attack.status}
                      onChange={(e) => updateAlertStatus(attack._id, e.target.value)}
                      style={{
                        backgroundColor: getStatusColor(attack.status),
                        color: getStatusTextColor(attack.status),
                      }}
                    >
                      <option value="new">New</option>
                      <option value="working">Working On</option>
                      <option value="escalated">Escalated</option>
                      <option value="remediated">Remediated</option>
                    </select>
                  </td>
                  <td className="device-name max-w-xs px-4 py-3">
                    <span className="block truncate text-sky-400">
                      {deviceIP}
                    </span>
                  </td>
                  <td className="time whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                    {timeStr}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="action-btn rounded-md bg-gradient-to-b from-sky-400 to-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow hover:brightness-95"
                      onClick={() => handleAnalyze(attack._id)}
                    >
                      Analyse
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="table-footer flex items-center justify-between px-1 py-4 text-xs text-slate-400">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="pagination flex gap-2">
          <button
            className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-900 text-sky-400 hover:border-sky-400 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            ←
          </button>
          <button
            className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-900 text-sky-400 hover:border-sky-400 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}