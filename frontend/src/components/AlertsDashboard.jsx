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
        return { color: 'var(--accent-danger)', class: 'high', text: 'High' };
      case 'Medium':
        return { color: 'var(--accent-warning)', class: 'medium', text: 'Medium' };
      case 'Low':
      default:
        return { color: 'var(--accent-success)', class: 'low', text: 'Low' };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'escalated':
        return 'var(--accent-danger)';
      case 'remediated':
        return 'var(--accent-success)';
      case 'working':
        return 'var(--accent-primary)';
      default: // new
        return 'var(--text-muted)';
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
      case 'working':
        return 'var(--text-inverse)';
      default:
        return 'var(--text-main)';
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
    // ... (unchanged export logic)
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery !== undefined) {
        setPage(1);
        loadAttacks();
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  return (
    <div className="alerts-dashboard mt-4 flex-1 overflow-y-auto bg-main px-4 py-6 md:px-8 transition-colors duration-300">
      <StatsCards />

      <div className="dashboard-controls mb-6 flex flex-wrap items-center gap-3">
        <div className="search-box flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-theme bg-card px-4 py-2.5 text-muted shadow-sm focus-within:border-accent-primary transition-all">
          <span className="text-lg">🔍</span>
          <input
            type="text"
            placeholder="Search by IP, port, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-none bg-transparent text-sm text-main outline-none placeholder:text-muted/60 font-medium"
          />
        </div>
        <div className="relative">
          <button
            className="control-btn inline-flex items-center gap-2 rounded-lg border border-theme bg-card px-4 py-2.5 text-sm font-bold text-accent-primary shadow-sm transition-all hover:bg-accent-primary hover:text-inverse hover:shadow-lg"
            onClick={() => setShowFilterMenu((s) => !s)}
          >
            ⚙️ Page Size
          </button>
          {showFilterMenu && (
            <div className="filter-menu absolute right-0 top-12 z-20 flex flex-col gap-1 rounded-lg border border-theme bg-card p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 min-w-[140px]">
              {[5, 10, 15, 25].map(size => (
                <button
                  key={size}
                  className={`filter-item rounded-md px-4 py-2 text-left text-sm font-semibold transition-colors ${pageSize === size ? 'bg-accent-primary text-inverse' : 'text-main hover:bg-hover'
                    }`}
                  onClick={() => {
                    setPageSize(size);
                    setPage(1);
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
          className="control-btn inline-flex items-center gap-2 rounded-lg border border-theme bg-card px-4 py-2.5 text-sm font-bold text-accent-primary shadow-sm transition-all hover:bg-accent-primary hover:text-inverse hover:shadow-lg"
          onClick={() => exportToCSV(alerts, 'alerts_export.csv')}
        >
          ⬇️ Export
        </button>
      </div>

      {loading && <div className="text-muted animate-pulse font-medium mb-4">Establishing secure connection to telemetry...</div>}
      {error && <div className="text-accent-danger font-bold bg-accent-danger/10 p-3 rounded-lg border border-accent-danger/20 mb-4">⚠️ {error}</div>}

      <div className="alerts-table-container overflow-hidden rounded-xl border border-theme bg-card shadow-2xl transition-all">
        <div className="overflow-x-auto">
          <table className="alerts-table w-full border-collapse text-sm">
            <thead>
              <tr className="bg-sidebar/50 text-xs font-black uppercase tracking-widest text-muted border-b border-theme">
                <th className="px-5 py-4 text-left">Event ID</th>
                <th className="px-5 py-4 text-left">Severity</th>
                <th className="px-5 py-4 text-left">Alert Category</th>
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-left">Device (IP)</th>
                <th className="px-5 py-4 text-left">Timestamp</th>
                <th className="px-5 py-4 text-right">Operations</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((attack) => {
                const severity = getSeverityInfo(attack);
                const attackType = labelNames[attack.predictedLabel] || 'Unknown';
                const protocolName = protocolMap[attack.protocol] || `Proto-${attack.protocol}`;
                const deviceIP = attack.srcIP;
                const timeStr = new Date(attack.timestamp).toLocaleString();

                return (
                  <tr
                    key={attack._id}
                    className={`border-b border-theme/30 text-main transition-colors hover:bg-hover/50 ${selectedAlerts.includes(attack._id) ? 'bg-accent-primary/10' : ''
                      }`}
                  >
                    <td className="px-5 py-4">
                      <span className="source-badge inline-flex rounded-lg bg-sidebar px-3 py-1 text-[10px] font-black tracking-wider text-accent-primary border border-theme shadow-inner">
                        {String(attack.eventId || 0).padStart(4, '0')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="severity-badge inline-flex rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-sm"
                        style={{ backgroundColor: `${severity.color}22`, color: severity.color, border: `1px solid ${severity.color}44` }}
                      >
                        {severity.text}
                      </span>
                    </td>
                    <td className="alert-name max-w-xs px-5 py-4">
                      <div className="break-words font-bold text-main">
                        {attackType}
                        <span className="ml-2 text-[10px] text-muted font-black uppercase tracking-tight opacity-70">
                          {protocolName}:{attack.dstPort}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        className="status-select rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-md border-none cursor-pointer hover:brightness-110 transition-all outline-none"
                        value={attack.status}
                        onChange={(e) => updateAlertStatus(attack._id, e.target.value)}
                        style={{
                          backgroundColor: getStatusColor(attack.status),
                          color: getStatusTextColor(attack.status),
                        }}
                      >
                        <option value="new">New</option>
                        <option value="working">Active</option>
                        <option value="escalated">Escalated</option>
                        <option value="remediated">Resolved</option>
                      </select>
                    </td>
                    <td className="device-name max-w-xs px-5 py-4 font-mono text-xs">
                      <span className="block truncate text-accent-info font-bold">
                        {deviceIP}
                      </span>
                    </td>
                    <td className="time whitespace-nowrap px-5 py-4 text-[11px] font-medium text-muted">
                      {timeStr}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        className="action-btn min-w-[100px] rounded-xl bg-accent-primary px-5 py-2.5 text-xs font-black uppercase tracking-widest text-inverse shadow-xl transition-all hover:scale-[1.05] hover:shadow-accent-primary/40 active:scale-95 border-2 border-accent-primary/20"
                        onClick={() => handleAnalyze(attack._id)}
                      >
                        Analyze
                      </button>
                    </td>
                  </tr>
                );
              })}
              {alerts.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-muted font-bold italic bg-sidebar/20">
                    No security events detected in the current scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="table-footer flex items-center justify-between px-2 py-6 text-xs text-muted font-bold uppercase tracking-widest">
        <span className="bg-card px-3 py-1.5 rounded-lg border border-theme shadow-sm">
          Node {page} <span className="opacity-40 ml-1 mr-1">of</span> {totalPages}
        </span>
        <div className="pagination flex gap-3">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-theme bg-card text-accent-primary shadow-lg transition-all hover:bg-accent-primary hover:text-inverse disabled:opacity-20 disabled:cursor-not-allowed hover:-translate-x-0.5 active:translate-x-0 font-black text-lg"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            title="Previous Page"
          >
            ←
          </button>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-theme bg-card text-accent-primary shadow-lg transition-all hover:bg-accent-primary hover:text-inverse disabled:opacity-20 disabled:cursor-not-allowed hover:translate-x-0.5 active:translate-x-0 font-black text-lg"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            title="Next Page"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}