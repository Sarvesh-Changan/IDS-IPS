const mongoose = require('mongoose');

const AttackSchema = new mongoose.Schema({
  // Network flow features (from your Excel)
  dstPort: Number,
  flowDuration: Number,
  totFwdPkts: Number,
  totBwdPkts: Number,
  totLenFwdPkts: Number,
  totLenBwdPkts: Number,
  fwdPktLenMax: Number,
  fwdPktLenMean: Number,
  bwdPktLenMean: Number,
  bwdPktLenStd: Number,
  flowBytsPerSec: Number,
  flowPktsPerSec: Number,
  flowIATMean: Number,
  flowIATStd: Number,
  flowIATMax: Number,
  fwdIATMean: Number,
  bwdIATStd: Number,
  finFlagCnt: Number,
  synFlagCnt: Number,
  rstFlagCnt: Number,
  ackFlagCnt: Number,
  fwdSegSizeAvg: Number,
  initFwdWinByts: Number,
  initBwdWinByts: Number,
  protocol: Number,        // 6=TCP,17=UDP,10=ICMP

  // ML output
  predictedLabel: { type: Number, required: true },  // 1..11 as per your mapping
  confidence: { type: Number, min: 0, max: 1 },
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High'] },

  // Attack metadata
  srcIP: { type: String, required: true },
  dstIP: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },

  // SOC workflow
  status: { 
    type: String, 
    enum: ['new', 'working', 'escalated', 'remediated'], 
    default: 'new' 
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  analystNotes: String,
  actions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ActionLog' }]
});

module.exports = mongoose.model('Attack', AttackSchema);