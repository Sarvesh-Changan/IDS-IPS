const mongoose = require('mongoose');

const ActionLogSchema = new mongoose.Schema({
  attack: { type: mongoose.Schema.Types.ObjectId, ref: 'Attack', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actionType: { 
    type: String, 
    enum: ['status_change', 'block_ip', 'quarantine', 'throttle', 'add_note', 'escalate'],
    required: true 
  },
  details: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActionLog', ActionLogSchema);