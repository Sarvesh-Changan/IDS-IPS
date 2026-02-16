const express = require('express');
const { getAttacks, getAttackById, updateAttack, takeAction } = require('../controllers/attackController');
const { protect } = require('../middleware/auth');
const { requireCsrf } = require('../middleware/csrf');
const router = express.Router();

router.route('/')
  .get(protect, getAttacks);

router.route('/:id')
  .get(protect, getAttackById)
  .patch(protect, requireCsrf, updateAttack);

router.post('/:id/action', protect, requireCsrf, takeAction);

module.exports = router;
