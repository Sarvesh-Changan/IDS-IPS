import React, { useMemo, useState, useRef } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import alertsData from '../data/alertsData';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SAMPLE_COMPANIES = ['Acme Networks', 'CloudGate', 'NetSecure Inc', 'Public ISP', 'DataStream Ltd'];
const SAMPLE_COUNTRIES = ['United States', 'Germany', 'India', 'Brazil', 'Japan', 'Canada'];

function isPrivateIP(ip) {
  // simple check for RFC1918 ranges
  if (!ip) return false;
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function generateTimeSeries(days = 7) {
  const arr = [];
  const now = new Date();
  const multiplier = Math.max(1, Math.floor(days / 7)); // higher count for longer periods
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const label = d.toLocaleDateString();
    arr.push({ date: label, count: Math.floor(Math.random() * (15 * multiplier)) + (2 * multiplier) });
  }
  return arr;
}

function generateFeatureValuesForTimeRange(days = 7) {
  // Multiplier based on time range (longer period = higher cumulative values)
  const multiplier = Math.max(1, Math.floor(days / 7));
  const rand = (min, max, fixed = 0) => Number((Math.random() * (max - min) + min).toFixed(fixed));

  return {
    'Flow Duration': Math.floor(rand(100, 100000 * multiplier)),
    'Total Fwd Pkts': Math.floor(rand(50, 500 * multiplier)),
    'Total Bwd Pkts': Math.floor(rand(50, 500 * multiplier)),
    'TotLen Fwd Pkts': Math.floor(rand(100, 150000 * multiplier)),
    'TotLen Bwd Pkts': Math.floor(rand(100, 150000 * multiplier)),
    'Flow Bytes/s': Math.floor(rand(100, 100000 * multiplier)),
    'Flow Pkts/s': Number(rand(0.5, 1000 * multiplier, 2)),
    'Fwd Pkt Len Mean': Number(rand(40, 1500, 2)),
    'Bwd Pkt Len Mean': Number(rand(40, 1500, 2)),
    'Pkt Len Std': Number(rand(0, 200, 2)),
    'Flow IAT Mean': Number(rand(0, 10000, 2)),
    'SYN Flag Cnt': Math.floor(rand(5, 50 * multiplier)),
    'ACK Flag Cnt': Math.floor(rand(10, 200 * multiplier)),
    'Fwd Seg Size Avg': Number(rand(0, 1500, 2))
  };
}

export default function ForensicAnalysis() {
  const [ip, setIp] = useState('');
  const [timeRange, setTimeRange] = useState(7); // days
  const [features, setFeatures] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [meta, setMeta] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const chartRef = useRef(null);
  const detailsRef = useRef(null);
  const totalIncidents = useMemo(() => timeseries.reduce((s, t) => s + (t.count || 0), 0), [timeseries]);

  const handleAnalyze = () => {
    if (!ip.trim()) return;
    const feat = generateFeatureValuesForTimeRange(timeRange);
    const ts = generateTimeSeries(timeRange);
    const origin = isPrivateIP(ip) ? 'Private Network' : SAMPLE_COUNTRIES[Math.floor(Math.random() * SAMPLE_COUNTRIES.length)];
    const company = isPrivateIP(ip) ? 'Private' : SAMPLE_COMPANIES[Math.floor(Math.random() * SAMPLE_COMPANIES.length)];
    setFeatures(feat);
    setTimeseries(ts);
    setMeta({ origin, company });
  };

  const handleTimeRangeChange = (e) => {
    const newRange = parseInt(e.target.value, 10);
    setTimeRange(newRange);
    // Re-analyze with new time range if IP is already set and analyzed
    if (features && ip.trim()) {
      const feat = generateFeatureValuesForTimeRange(newRange);
      const ts = generateTimeSeries(newRange);
      setFeatures(feat);
      setTimeseries(ts);
    }
  };

  const exportAsCSV = () => {
    if (!features || !ip) return;

    // Add feature values
    const featureHeaders = ['Feature', 'Value'];
    const featureData = Object.entries(features).map(([k, v]) => [k, v.toString()]);

    // Create CSV content with header and data
    let csv = 'IP Address,' + ip + '\n';
    csv += 'Origin,' + (meta?.origin || 'N/A') + '\n';
    csv += 'Registered To,' + (meta?.company || 'N/A') + '\n';
    csv += 'Times Seen,' + totalIncidents + '\n\n';
    csv += featureHeaders.join(',') + '\n';
    csv += featureData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `forensic-analysis-${ip}-${timeRange}days.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportAsPDF = async () => {
    if (!features || !ip) return;

    try {
      // Create a temporary container for the PDF content
      const pdfContainer = document.createElement('div');
      pdfContainer.style.position = 'absolute';
      pdfContainer.style.left = '-9999px';
      pdfContainer.style.width = '800px';
      pdfContainer.style.backgroundColor = '#0f1419';
      pdfContainer.style.color = '#fff';
      pdfContainer.style.padding = '40px';
      pdfContainer.style.fontFamily = 'Arial, sans-serif';

      // Add header
      const header = document.createElement('h1');
      header.textContent = 'Forensic Analysis Report';
      header.style.marginBottom = '20px';
      header.style.color = '#00bfff';
      pdfContainer.appendChild(header);

      // Add metadata
      const metaSection = document.createElement('div');
      metaSection.style.marginBottom = '30px';
      metaSection.style.padding = '15px';
      metaSection.style.backgroundColor = '#1a1f2e';
      metaSection.style.borderRadius = '8px';
      metaSection.innerHTML = `
        <p><strong>IP Address:</strong> ${ip}</p>
        <p><strong>Origin:</strong> ${meta?.origin || 'N/A'}</p>
        <p><strong>Registered To:</strong> ${meta?.company || 'N/A'}</p>
        <p><strong>Times Seen (Last ${timeRange} days):</strong> ${totalIncidents}</p>
      `;
      pdfContainer.appendChild(metaSection);

      // Add chart section
      const chartSection = document.createElement('div');
      chartSection.style.marginBottom = '30px';

      if (chartRef.current) {
        const chartCanvas = await html2canvas(chartRef.current, {
          backgroundColor: '#0f1419',
          scale: 2
        });
        const chartImage = document.createElement('img');
        chartImage.src = chartCanvas.toDataURL();
        chartImage.style.width = '100%';
        chartImage.style.marginBottom = '20px';
        chartSection.appendChild(chartImage);
      }
      pdfContainer.appendChild(chartSection);

      // Add details section
      const detailsSection = document.createElement('div');
      detailsSection.style.marginTop = '30px';

      const detailsTitle = document.createElement('h2');
      detailsTitle.textContent = 'Detailed Feature Values';
      detailsTitle.style.color = '#00bfff';
      detailsTitle.style.marginBottom = '15px';
      detailsSection.appendChild(detailsTitle);

      const detailsTable = document.createElement('table');
      detailsTable.style.width = '100%';
      detailsTable.style.borderCollapse = 'collapse';
      detailsTable.style.fontSize = '12px';

      // Add table headers
      const headerRow = detailsTable.insertRow();
      const th1 = document.createElement('th');
      th1.textContent = 'Feature';
      th1.style.textAlign = 'left';
      th1.style.padding = '8px';
      th1.style.borderBottom = '2px solid #2d3561';
      th1.style.backgroundColor = '#1a1f2e';

      const th2 = document.createElement('th');
      th2.textContent = 'Value';
      th2.style.textAlign = 'right';
      th2.style.padding = '8px';
      th2.style.borderBottom = '2px solid #2d3561';
      th2.style.backgroundColor = '#1a1f2e';

      headerRow.appendChild(th1);
      headerRow.appendChild(th2);

      // Add table data
      Object.entries(features).forEach(([key, value], idx) => {
        const row = detailsTable.insertRow();
        row.style.backgroundColor = idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent';

        const cell1 = row.insertCell();
        cell1.textContent = key;
        cell1.style.padding = '8px';
        cell1.style.borderBottom = '1px solid #242b3a';

        const cell2 = row.insertCell();
        cell2.textContent = value;
        cell2.style.textAlign = 'right';
        cell2.style.padding = '8px';
        cell2.style.borderBottom = '1px solid #242b3a';
      });

      detailsSection.appendChild(detailsTable);
      pdfContainer.appendChild(detailsSection);

      document.body.appendChild(pdfContainer);

      // Convert to canvas
      const canvas = await html2canvas(pdfContainer, {
        backgroundColor: '#0f1419',
        scale: 2
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`forensic-analysis-${ip}-${timeRange}days.pdf`);

      document.body.removeChild(pdfContainer);
      setShowExportMenu(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Prepare feature columns for display (split into two columns)
  const featureEntries = features ? Object.entries(features) : [];
  const half = Math.ceil(featureEntries.length / 2);
  const leftEntries = featureEntries.slice(0, half);
  const rightEntries = featureEntries.slice(half);

  return (
    <div className="forensic-root flex-1 h-full overflow-y-auto px-4 py-8 text-main md:px-10 bg-main transition-all duration-300 scroll-smooth">
      <div className="forensic-header mb-10">
        <h1 className="mb-2 text-2xl font-black uppercase tracking-tight text-accent-primary">Forensic Intelligence Analysis</h1>
        <p className="text-sm text-muted font-medium">
          Enter an IP coordinate to extract deep-flow forensic signatures and historical trajectory.
        </p>
      </div>

      <div className="forensic-controls mb-8 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <input
            className="forensic-input w-full rounded-xl border border-theme bg-card px-4 py-3 text-sm text-main outline-none placeholder:text-muted/50 focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/10 transition-all font-mono"
            placeholder="COORD-IP (e.g. 203.0.113.5)"
            value={ip}
            onChange={(e) => setIp(e.target.value.replace(/[^0-9.]/g, ''))}
          />
        </div>
        <button
          className="analyze-btn rounded-xl bg-accent-primary px-8 py-3 text-sm font-black uppercase tracking-widest text-inverse shadow-lg shadow-accent-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          onClick={handleAnalyze}
        >
          Execute Analysis
        </button>
        {features && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                className="time-range-select appearance-none min-w-[140px] rounded-xl border border-theme bg-card px-4 py-3 text-sm font-bold text-main outline-none ring-accent-primary/20 transition-all hover:bg-hover focus:border-accent-primary focus:ring-4 cursor-pointer"
                value={timeRange}
                onChange={handleTimeRangeChange}
              >
                <option value={1}>24H Window</option>
                <option value={7}>07D Window</option>
                <option value={15}>15D Window</option>
                <option value={30}>30D Cycle</option>
                <option value={90}>QTR Cycle</option>
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-muted font-bold">▼</span>
            </div>

            <div className="export-dropdown-container relative">
              <button
                className="export-btn min-w-[130px] rounded-xl border border-theme bg-card px-4 py-3 text-sm font-bold text-accent-primary transition-all hover:bg-accent-primary hover:text-inverse shadow-sm"
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                ⬇ Export Dossier
              </button>
              {showExportMenu && (
                <div className="export-menu absolute right-0 top-14 z-20 min-w-[220px] overflow-hidden rounded-2xl border border-theme bg-sidebar p-1.5 shadow-2xl animate-in fade-in zoom-in-95">
                  <button
                    className="export-option flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-main hover:bg-accent-primary hover:text-inverse transition-all"
                    onClick={exportAsCSV}
                  >
                    <span>📑</span> CSV Audit Data
                  </button>
                  <button
                    className="export-option flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-main hover:bg-accent-primary hover:text-inverse transition-all"
                    onClick={exportAsPDF}
                  >
                    <span>📁</span> PDF Intelligence Report
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {features && (
        <div className="forensic-body flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="forensic-meta grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 rounded-3xl border border-theme bg-sidebar px-6 py-5 shadow-inner">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Target Address</span>
              <span className="text-sm font-mono font-bold text-accent-primary underline decoration-accent-primary/30 underline-offset-4">{ip}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Geo Origin</span>
              <span className="text-sm font-bold text-main">{meta?.origin}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Registered Entity</span>
              <span className="text-sm font-bold text-main truncate">{meta?.company}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Threat Occurrences</span>
              <span className="text-sm font-mono font-black text-accent-danger">{totalIncidents} SEC-EVENTS</span>
            </div>
          </div>

          <div
            className="forensic-chart rounded-[2.5rem] border border-theme/40 bg-card px-8 py-8 shadow-2xl"
            ref={chartRef}
          >
            <div className="chart-header mb-6 flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-accent-primary">Temporal Threat Distribution</h3>
              <div className="px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-[9px] font-black text-accent-primary tracking-widest">LIVE PULSE</div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={timeseries} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="var(--border-main)" strokeOpacity={0.2} />
                <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontWeight: 'bold' }} dy={10} />
                <YAxis allowDecimals={false} fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,191,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-main)', borderRadius: '1.25rem', padding: '15px' }}
                />
                <Bar dataKey="count" fill="var(--accent-primary)" radius={[8, 8, 4, 4]} barSize={40} fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            className="forensic-details rounded-[2.5rem] border border-theme/40 bg-card px-8 py-8 shadow-2xl"
            ref={detailsRef}
          >
            <div className="details-header mb-8">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-accent-primary">Deep Flow Fingerprint</h3>
            </div>
            <div className="details-columns grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
              <div className="flex flex-col">
                {leftEntries.map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-3 border-b border-theme/30 group hover:bg-hover/30 px-2 rounded-lg transition-colors">
                    <span className="text-[11px] font-black uppercase tracking-tight text-muted group-hover:text-accent-primary transition-colors">{k}</span>
                    <span className="text-xs font-mono font-bold text-main">{v}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col">
                {rightEntries.map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-3 border-b border-theme/30 group hover:bg-hover/30 px-2 rounded-lg transition-colors">
                    <span className="text-[11px] font-black uppercase tracking-tight text-muted group-hover:text-accent-primary transition-colors">{k}</span>
                    <span className="text-xs font-mono font-bold text-main">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
