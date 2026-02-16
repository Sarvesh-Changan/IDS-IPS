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
      Object.entries(features).forEach(([ key, value ], idx) => {
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
    <div className="forensic-root mt-4 px-4 py-6 text-slate-100 md:px-8">
      <div className="forensic-header mb-4">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">Forensic Analysis</h1>
        <p className="text-sm text-slate-400">
          Enter an IP address to view forensic features and history.
        </p>
      </div>

      <div className="forensic-controls mb-4 flex flex-wrap items-center gap-3">
        <input
          className="forensic-input w-72 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
          placeholder="Enter IP (e.g. 203.0.113.5)"
          value={ip}
          onChange={(e) => setIp(e.target.value.replace(/[^0-9.]/g, ''))}
        />
        <button
          className="analyze-btn rounded-lg bg-gradient-to-r from-sky-400 to-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow hover:brightness-95"
          onClick={handleAnalyze}
        >
          Analyze
        </button>
        {features && (
          <>
            <select
              className="time-range-select min-w-[130px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-100 outline-none ring-sky-400 transition focus:border-sky-400 focus:ring-1"
              value={timeRange}
              onChange={handleTimeRangeChange}
            >
              <option value={1}>1 Day</option>
              <option value={7}>7 Days</option>
              <option value={15}>15 Days</option>
              <option value={30}>1 Month</option>
              <option value={90}>3 Months</option>
            </select>
            
            <div className="export-dropdown-container relative">
              <button
                className="export-btn min-w-[120px] rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-400 hover:bg-slate-900 hover:text-sky-300"
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                ⬇ Export
              </button>
              {showExportMenu && (
                <div className="export-menu absolute right-0 top-11 z-20 min-w-[190px] overflow-hidden rounded-lg border border-slate-700 bg-slate-950 shadow-xl">
                  <button
                    className="export-option block w-full border-b border-slate-800 px-4 py-2 text-left text-sm text-slate-200 hover:bg-sky-500/10 hover:text-sky-300"
                    onClick={exportAsCSV}
                  >
                    📄 Export as CSV
                  </button>
                  <button
                    className="export-option block w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-sky-500/10 hover:text-sky-300"
                    onClick={exportAsPDF}
                  >
                    📑 Export as PDF
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {features && (
        <div className="forensic-body flex flex-col gap-4">
          <div className="forensic-meta flex flex-wrap gap-4 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm">
            <div className="text-slate-200">
              <strong>IP:</strong> {ip}
            </div>
            <div className="text-slate-200">
              <strong>Origin:</strong> {meta?.origin}
            </div>
            <div className="text-slate-200">
              <strong>Registered To:</strong> {meta?.company}
            </div>
            <div className="text-slate-200">
              <strong>Times Seen:</strong> {totalIncidents}
            </div>
          </div>

          <div
            className="forensic-chart rounded-lg border border-slate-800 bg-slate-950 px-4 py-3"
            ref={chartRef}
          >
            <div className="chart-title mb-2 text-sm font-semibold text-slate-200">
              Occurrences over time
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={timeseries} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#00bfff" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            className="forensic-details rounded-lg border border-slate-800 bg-slate-950 px-4 py-3"
            ref={detailsRef}
          >
            <div className="details-title mb-2 text-sm font-semibold text-slate-200">
              Detailed Feature Values
            </div>
            <div className="details-columns flex flex-col gap-4 md:flex-row">
              <table className="details-table w-full border-collapse text-sm md:w-auto">
                <tbody>
                  {leftEntries.map(([k, v]) => (
                    <tr key={k}>
                      <td className="feat-key w-1/2 border-b border-slate-900 px-3 py-2 text-sm text-sky-300">
                        {k}
                      </td>
                      <td className="feat-val w-1/2 border-b border-slate-900 px-3 py-2 text-right text-sm text-slate-100">
                        {v}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <table className="details-table w-full border-collapse text-sm md:w-auto">
                <tbody>
                  {rightEntries.map(([k, v]) => (
                    <tr key={k}>
                      <td className="feat-key w-1/2 border-b border-slate-900 px-3 py-2 text-sm text-sky-300">
                        {k}
                      </td>
                      <td className="feat-val w-1/2 border-b border-slate-900 px-3 py-2 text-right text-sm text-slate-100">
                        {v}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
