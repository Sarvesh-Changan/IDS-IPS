// src/pages/Analyze.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAttackById, updateAttack, takeAction } from '../services/api';
import { labelNames, protocolMap } from '../utils/attackMappings'; // we'll create this utility
import { ArrowLeft, AlertTriangle, Shield, Activity } from 'lucide-react';

const Analyze = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attack, setAttack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const loadAttack = async () => {
      try {
        const { data } = await fetchAttackById(id);
        setAttack(data);
        setStatus(data.status);
      } catch (err) {
        setError('Failed to load attack details');
      } finally {
        setLoading(false);
      }
    };
    loadAttack();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateAttack(id, { status: newStatus, actionType: 'status_change' });
      setStatus(newStatus);
      setAttack({ ...attack, status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      await updateAttack(id, { analystNotes: note, actionType: 'add_note' });
      setAttack({ ...attack, analystNotes: note });
      setNote('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (action) => {
    try {
      await takeAction(id, action);
      alert(`${action} action recorded`);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-6 text-main">Loading...</div>;
  if (error) return <div className="p-6 text-accent-danger">{error}</div>;
  if (!attack) return <div className="p-6 text-main">No attack found</div>;

  const protocolName = protocolMap[attack.protocol] || `Unknown (${attack.protocol})`;
  const attackType = labelNames[attack.predictedLabel] || 'Unknown';

  return (
    <div className="p-8 text-main bg-main min-h-screen overflow-y-auto scroll-smooth transition-all duration-300">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-muted hover:text-accent-primary mb-8 transition-all group"
      >
        <span className="transition-transform group-hover:-translate-x-1"><ArrowLeft size={16} /></span> Return to Nexus
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card p-8 rounded-[2.5rem] border border-theme/40 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity size={80} />
            </div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-8 text-accent-primary">Attack Vector Intel</h2>
            <div className="space-y-6">
              <IntelItem label="Sequence ID" value={attack._id} />
              <IntelItem label="Temporal Stamp" value={new Date(attack.timestamp).toLocaleString()} />
              <IntelItem label="Source Coordinate" value={attack.srcIP} highlight />
              <IntelItem label="Dest Coordinate" value={attack.dstIP} />
              <IntelItem label="Protocol Layer" value={protocolName} />
              <IntelItem label="Ingress Port" value={attack.dstPort} />
            </div>
          </div>

          <div className="bg-card p-8 rounded-[2.5rem] border border-theme/40 shadow-2xl relative overflow-hidden">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-8 text-accent-primary">Neural Classification</h2>
            <div className="space-y-6">
              <IntelItem label="Threat Signature" value={`${attackType}`} />
              <IntelItem label="Cognitive Confidence" value={`${(attack.confidence * 100).toFixed(1)}%`} />
              <div className="pt-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-3 block">Risk Assessment</label>
                <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg ${attack.riskLevel === 'High' ? 'bg-accent-danger/20 text-accent-danger border border-accent-danger/30' :
                  attack.riskLevel === 'Medium' ? 'bg-accent-warning/20 text-accent-warning border border-accent-warning/30' : 'bg-accent-success/20 text-accent-success border border-accent-success/30'
                  }`}>
                  <span className={`h-2 w-2 rounded-full animate-pulse ${attack.riskLevel === 'High' ? 'bg-accent-danger' : attack.riskLevel === 'Medium' ? 'bg-accent-warning' : 'bg-accent-success'}`}></span>
                  {attack.riskLevel}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card p-8 rounded-[2.5rem] border border-theme/40 shadow-2xl">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-8 text-accent-primary">Neutralization Protocol</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-muted text-[10px] font-black uppercase tracking-widest mb-3 ml-1">Current Status</label>
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full bg-sidebar border border-theme/50 rounded-2xl p-4 text-xs font-bold text-main outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/10 transition-all cursor-pointer"
                >
                  <option value="new">NEW DISCOVERY</option>
                  <option value="working">ACTIVE ENGAGEMENT</option>
                  <option value="escalated">THREAT ESCALATED</option>
                  <option value="remediated">NEUTRALIZED</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => handleAction('block')}
                  className="flex-1 bg-accent-danger text-inverse px-4 py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-accent-danger/20 hover:scale-[1.05] active:scale-95 transition-all"
                >
                  <Shield size={16} /> Block Node
                </button>
                <button
                  onClick={() => handleAction('quarantine')}
                  className="flex-1 bg-accent-warning text-inverse px-4 py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-accent-warning/20 hover:scale-[1.05] active:scale-95 transition-all"
                >
                  <AlertTriangle size={16} /> Quarantine
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-card p-10 rounded-[3rem] border border-theme/40 shadow-2xl relative">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <Activity size={200} />
            </div>
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-accent-primary">Deep Flow Forensics</h2>
              <div className="px-4 py-1.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-[9px] font-black text-accent-primary tracking-widest">REAL-TIME DATA</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-12">
              <FeatureItem label="Flow Duration" value={attack.flowDuration} unit="µs" />
              <FeatureItem label="Fwd Packet Count" value={attack.totFwdPkts} />
              <FeatureItem label="Bwd Packet Count" value={attack.totBwdPkts} />
              <FeatureItem label="Load Fwd (Bytes)" value={attack.totLenFwdPkts} />
              <FeatureItem label="Load Bwd (Bytes)" value={attack.totLenBwdPkts} />
              <FeatureItem label="Peak Segment" value={attack.fwdPktLenMax} unit="B" />
              <FeatureItem label="Mean Pulse" value={attack.fwdPktLenMean?.toFixed(2)} unit="B" />
              <FeatureItem label="Reverse Mean" value={attack.bwdPktLenMean?.toFixed(2)} unit="B" />
              <FeatureItem label="Throughput" value={attack.flowBytsPerSec?.toFixed(2)} unit="B/s" />
              <FeatureItem label="Packet Velocity" value={attack.flowPktsPerSec?.toFixed(4)} unit="P/s" />
              <FeatureItem label="Latency Mean" value={attack.flowIATMean?.toFixed(2)} unit="µs" />
              <FeatureItem label="FIN Counter" value={attack.finFlagCnt} />
              <FeatureItem label="SYN Counter" value={attack.synFlagCnt} />
              <FeatureItem label="RST Counter" value={attack.rstFlagCnt} />
              <FeatureItem label="ACK Counter" value={attack.ackFlagCnt} />
              <FeatureItem label="Window Ingress" value={attack.initFwdWinByts} />
              <FeatureItem label="Window Egress" value={attack.initBwdWinByts} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const IntelItem = ({ label, value, highlight }) => (
  <div>
    <span className="text-muted text-[10px] font-black uppercase tracking-widest block mb-2">{label}</span>
    <span className={`text-sm font-bold block ${highlight ? 'text-accent-primary font-mono' : 'text-main'}`}>{value ?? '---'}</span>
  </div>
);

const FeatureItem = ({ label, value, unit = '' }) => (
  <div className="group">
    <span className="text-muted text-[10px] font-black uppercase tracking-widest block mb-3 opacity-60 group-hover:opacity-100 transition-opacity">{label}</span>
    <div className="text-main font-mono text-base font-black flex items-baseline gap-2 group-hover:text-accent-primary transition-colors">
      {value ?? '0'}
      {unit && <span className="text-[10px] text-muted font-bold group-hover:text-accent-primary/60 transition-colors">{unit}</span>}
    </div>
    <div className="mt-2 h-0.5 w-full bg-theme/20 rounded-full group-hover:bg-accent-primary/40 transition-all"></div>
  </div>
);

export default Analyze;