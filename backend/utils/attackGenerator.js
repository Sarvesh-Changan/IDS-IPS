// utils/attackGenerator.js
const Attack = require('../models/Attack');
const { classifyAttack } = require('./mlMock');
const { getIO } = require('../socket');

let intervalId = null;
const INTERVAL_MS = parseInt(process.env.ATTACK_INTERVAL_MS || '50000', 10);

function startAttackGenerator() {
  if (intervalId) clearInterval(intervalId);
  console.log(`[AttackGenerator] Starting with interval ${INTERVAL_MS}ms`);
  intervalId = setInterval(async () => {
    const srcIP = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    const dstIP = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    const newAttackData = classifyAttack({ srcIP, dstIP });

    try {
      // Find the last sequential ID
      const lastAttack = await Attack.findOne().sort('-eventId');
      const nextEventId = (lastAttack && lastAttack.eventId) ? lastAttack.eventId + 1 : 1;

      // Save to database
      const attack = new Attack({ ...newAttackData, eventId: nextEventId });
      await attack.save();

      // Populate assignedTo if needed (none yet)
      const populated = await Attack.findById(attack._id).populate('assignedTo', 'username email');

      // Emit via socket
      const io = getIO();
      io.emit('new-attack', populated);
      console.log('New attack saved and emitted', attack._id);
    } catch (err) {
      console.error('Error saving attack:', err);
    }
  }, INTERVAL_MS);
}

function stopAttackGenerator() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

module.exports = { startAttackGenerator, stopAttackGenerator };
