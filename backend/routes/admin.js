// routes/admin.js
const express = require('express');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { requireCsrf } = require('../middleware/csrf');

const router = express.Router();

// All admin routes require authentication and 'admin' role
router.use(protect);
router.use(authorize('admin'));
router.use(requireCsrf);

router.route('/users')
  .get(getUsers)
  .post(createUser);

router.route('/users/:id')
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
