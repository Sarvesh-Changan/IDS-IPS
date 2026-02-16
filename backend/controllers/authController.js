const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AuthLog = require('../models/AuthLog');

const generateToken = (id, role, csrf) => {
  return jwt.sign({ id, role, csrf }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

const register = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return res.status(400).json({ message: 'Invalid email' });
    if (password.length < 8) return res.status(400).json({ message: 'Password too short' });
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ username, email, password, role: role || 'analyst' });
    const csrfToken = crypto.randomBytes(24).toString('hex');
    await AuthLog.create({
      actor: user._id,
      event: 'user_create',
      success: true,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: { selfRegister: true }
    });
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role, csrfToken),
      csrfToken
    });
  } catch (err) {
    try {
      await AuthLog.create({
        event: 'user_create',
        success: false,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: { error: err.message }
      });
    } catch (_) {}
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
    if (!emailOk || !password) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      try {
        await AuthLog.create({
          event: 'login_fail',
          success: false,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          details: { email }
        });
      } catch (_) {}
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const csrfToken = crypto.randomBytes(24).toString('hex');
    try {
      await AuthLog.create({
        actor: user._id,
        event: 'login_success',
        success: true,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: {}
      });
    } catch (_) {}
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role, csrfToken),
      csrfToken
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = { register, login, getMe };
