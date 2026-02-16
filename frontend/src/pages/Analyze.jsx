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

  if (loading) return <div className="p-6 text-white">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!attack) return <div className="p-6 text-white">No attack found</div>;

  const protocolName = protocolMap[attack.protocol] || `Unknown (${attack.protocol})`;
  const attackType = labelNames[attack.predictedLabel] || 'Unknown';

  return (
    <div className="p-6 text-white">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4">
        <ArrowLeft size={20} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Basic Info & Actions */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-3">Attack Summary</h2>
            <div className="space-y-2">
              <p><span className="text-gray-400">Attack ID:</span> {attack._id}</p>
              <p><span className="text-gray-400">Timestamp:</span> {new Date(attack.timestamp).toLocaleString()}</p>
              <p><span className="text-gray-400">Source IP:</span> {attack.srcIP}</p>
              <p><span className="text-gray-400">Destination IP:</span> {attack.dstIP}</p>
              <p><span className="text-gray-400">Protocol:</span> {protocolName}</p>
              <p><span className="text-gray-400">Destination Port:</span> {attack.dstPort}</p>
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-3">ML Classification</h2>
            <div className="space-y-2">
              <p><span className="text-gray-400">Attack Type:</span> {attackType} (label {attack.predictedLabel})</p>
              <p><span className="text-gray-400">Confidence:</span> {(attack.confidence * 100).toFixed(1)}%</p>
              <p><span className="text-gray-400">Risk Level:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  attack.riskLevel === 'High' ? 'bg-red-600' : 
                  attack.riskLevel === 'Medium' ? 'bg-yellow-600' : 'bg-green-600'
                }`}>
                  {attack.riskLevel}
                </span>
              </p>
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-3">Actions</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-400 mb-1">Status</label>
                <select 
                  value={status} 
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded p-2"
                >
                  <option value="new">New</option>
                  <option value="working">Working</option>
                  <option value="escalated">Escalated</option>
                  <option value="remediated">Remediated</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Analyst Note</label>
                <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded p-2"
                  rows="2"
                  placeholder="Add a note..."
                />
                <button 
                  onClick={handleAddNote}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                >
                  Add Note
                </button>
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => handleAction('block')}
                  className="flex-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded flex items-center justify-center gap-2"
                >
                  <Shield size={16} /> Block
                </button>
                <button 
                  onClick={() => handleAction('quarantine')}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={16} /> Quarantine
                </button>
              </div>
            </div>
          </div>

          {attack.analystNotes && (
            <div className="bg-slate-800 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Analyst Notes</h3>
              <p className="text-gray-300">{attack.analystNotes}</p>
            </div>
          )}
        </div>

        {/* Right column: Detailed Features */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Detailed Flow Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureItem label="Flow Duration" value={attack.flowDuration} unit="µs" />
              <FeatureItem label="Total Fwd Packets" value={attack.totFwdPkts} />
              <FeatureItem label="Total Bwd Packets" value={attack.totBwdPkts} />
              <FeatureItem label="Total Length Fwd Packets" value={attack.totLenFwdPkts} unit="bytes" />
              <FeatureItem label="Total Length Bwd Packets" value={attack.totLenBwdPkts} unit="bytes" />
              <FeatureItem label="Fwd Packet Length Max" value={attack.fwdPktLenMax} unit="bytes" />
              <FeatureItem label="Fwd Packet Length Mean" value={attack.fwdPktLenMean?.toFixed(2)} unit="bytes" />
              <FeatureItem label="Bwd Packet Length Mean" value={attack.bwdPktLenMean?.toFixed(2)} unit="bytes" />
              <FeatureItem label="Bwd Packet Length Std" value={attack.bwdPktLenStd?.toFixed(2)} />
              <FeatureItem label="Flow Bytes/s" value={attack.flowBytsPerSec?.toFixed(2)} />
              <FeatureItem label="Flow Packets/s" value={attack.flowPktsPerSec?.toFixed(4)} />
              <FeatureItem label="Flow IAT Mean" value={attack.flowIATMean?.toFixed(2)} unit="µs" />
              <FeatureItem label="Flow IAT Std" value={attack.flowIATStd?.toFixed(2)} unit="µs" />
              <FeatureItem label="Flow IAT Max" value={attack.flowIATMax} unit="µs" />
              <FeatureItem label="Fwd IAT Mean" value={attack.fwdIATMean?.toFixed(2)} unit="µs" />
              <FeatureItem label="Bwd IAT Std" value={attack.bwdIATStd?.toFixed(2)} unit="µs" />
              <FeatureItem label="FIN Flag Count" value={attack.finFlagCnt} />
              <FeatureItem label="SYN Flag Count" value={attack.synFlagCnt} />
              <FeatureItem label="RST Flag Count" value={attack.rstFlagCnt} />
              <FeatureItem label="ACK Flag Count" value={attack.ackFlagCnt} />
              <FeatureItem label="Fwd Segment Size Avg" value={attack.fwdSegSizeAvg?.toFixed(2)} unit="bytes" />
              <FeatureItem label="Init Fwd Win Bytes" value={attack.initFwdWinByts} />
              <FeatureItem label="Init Bwd Win Bytes" value={attack.initBwdWinByts} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ label, value, unit = '' }) => (
  <div className="border-b border-slate-700 pb-2">
    <span className="text-gray-400 text-sm">{label}</span>
    <div className="text-white font-mono">{value ?? 'N/A'} {unit}</div>
  </div>
);

export default Analyze;