const mongoose = require('mongoose');

const AuthLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  event: { type: String, enum: ['login_success', 'login_fail', 'user_create', 'user_update', 'user_delete'], required: true },
  success: { type: Boolean, default: true },
  ip: { type: String },
  userAgent: { type: String },
  details: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuthLog', AuthLogSchema);
