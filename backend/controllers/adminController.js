const User = require('../models/User');
const bcrypt = require('bcryptjs');
const AuthLog = require('../models/AuthLog');

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createUser = async (req, res) => {
  const { username, email, password, role, accessLevel } = req.body;
  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return res.status(400).json({ message: 'Invalid email' });
    if (password.length < 8) return res.status(400).json({ message: 'Password too short' });
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const user = new User({ username, email, password, role: role || 'analyst', accessLevel: accessLevel || 'standard' });
    await user.save();
    await AuthLog.create({
      actor: req.user?._id,
      event: 'user_create',
      success: true,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: { targetUserId: user._id, role: user.role, accessLevel: user.accessLevel }
    });
    res.status(201).json({ message: 'User created', user: { id: user._id, username, email, role: user.role, accessLevel: user.accessLevel } });
  } catch (err) {
    try {
      await AuthLog.create({
        actor: req.user?._id,
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

const updateUser = async (req, res) => {
  const { username, email, role, password, accessLevel } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;
    if (accessLevel) user.accessLevel = accessLevel;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    await AuthLog.create({
      actor: req.user?._id,
      event: 'user_update',
      success: true,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: { targetUserId: user._id }
    });
    res.json({ message: 'User updated', user: { id: user._id, username: user.username, email: user.email, role: user.role, accessLevel: user.accessLevel } });
  } catch (err) {
    try {
      await AuthLog.create({
        actor: req.user?._id,
        event: 'user_update',
        success: false,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: { error: err.message }
      });
    } catch (_) {}
    res.status(500).json({ message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    await user.deleteOne();
    await AuthLog.create({
      actor: req.user?._id,
      event: 'user_delete',
      success: true,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: { targetUserId: req.params.id }
    });
    res.json({ message: 'User deleted' });
  } catch (err) {
    try {
      await AuthLog.create({
        actor: req.user?._id,
        event: 'user_delete',
        success: false,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: { error: err.message }
      });
    } catch (_) {}
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
