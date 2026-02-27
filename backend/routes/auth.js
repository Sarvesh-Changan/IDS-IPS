const express = require('express');
const { register, login, getMe, updateTheme } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', getMe);
router.put('/theme', updateTheme);

module.exports = router;