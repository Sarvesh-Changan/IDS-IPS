const express = require('express');
const { getAttacks, getAttackById, updateAttack, takeAction } = require('../controllers/attackController');
const router = express.Router();

// Logic simplified for public access as per request to remove auth
router.route('/')
  .get(getAttacks);

router.route('/:id')
  .get(getAttackById)
  .patch(updateAttack);

router.post('/:id/action', takeAction);

module.exports = router;
