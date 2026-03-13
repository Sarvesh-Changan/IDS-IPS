const Attack = require('../models/Attack');
const ActionLog = require('../models/ActionLog');
const { labelNames } = require('../utils/mlMock'); // optional, for display

// @desc    Get all attacks with pagination, filtering, and search
// @route   GET /api/attacks
const getAttacks = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { status, severity, search } = req.query;

  // Build filter object
  const filter = {};
  if (status) filter.status = status;
  if (severity) filter.riskLevel = severity;

  // Search across multiple fields
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [
      { srcIP: searchRegex },
      { dstIP: searchRegex },
      { analystNotes: searchRegex },
    ];
    // If search is numeric, also match dstPort or eventId
    if (!isNaN(parseInt(search))) {
      const searchNum = parseInt(search);
      filter.$or.push({ dstPort: searchNum });
      filter.$or.push({ eventId: searchNum });
    }
    // If search matches a label name? Could be done but not necessary
  }

  try {
    const attacks = await Attack.find(filter)
      .populate('assignedTo', 'username email')
      .sort('-timestamp')
      .skip(skip)
      .limit(limit);
    const total = await Attack.countDocuments(filter);
    res.json({
      attacks,
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single attack details
// @route   GET /api/attacks/:id
const getAttackById = async (req, res) => {
  try {
    const attack = await Attack.findById(req.params.id)
      .populate('assignedTo', 'username email')
      .populate('actions');
    if (!attack) return res.status(404).json({ message: 'Attack not found' });
    res.json(attack);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update attack status / assign / add notes
// @route   PATCH /api/attacks/:id
const updateAttack = async (req, res) => {
  const { status, assignedTo, analystNotes, actionType, details } = req.body;
  try {
    const attack = await Attack.findById(req.params.id);
    if (!attack) return res.status(404).json({ message: 'Attack not found' });

    if (status) attack.status = status;
    if (assignedTo) attack.assignedTo = assignedTo;
    if (analystNotes) attack.analystNotes = analystNotes;

    await attack.save();

    // Log the action
    const log = new ActionLog({
      attack: attack._id,
      user: req.user._id,
      actionType: actionType || 'status_change',
      details: { status, assignedTo, analystNotes, ...details }
    });
    await log.save();

    // Emit update via socket
    const io = require('../socket').getIO();
    io.emit('attack-updated', attack);

    res.json(attack);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Simulate IPS action (block, quarantine, throttle)
// @route   POST /api/attacks/:id/action
const takeAction = async (req, res) => {
  const { action } = req.body; // 'block', 'quarantine', 'throttle'
  const attack = await Attack.findById(req.params.id);
  if (!attack) return res.status(404).json({ message: 'Attack not found' });

  const log = new ActionLog({
    attack: attack._id,
    user: req.user._id,
    actionType: action,
    details: req.body
  });
  await log.save();

  res.json({ message: `${action} action recorded`, attackId: attack._id });
};

module.exports = { getAttacks, getAttackById, updateAttack, takeAction };