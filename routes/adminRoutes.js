const express = require('express');
const router = express.Router();
const { deleteUser, getAllUsers } = require('../controllers/AdminController');
const authenticateUser = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/adminMiddleware');

// Admin routes (all require authentication and admin role)
router.get('/users', authenticateUser, isAdmin, getAllUsers);
router.delete('/users/:userId', authenticateUser, isAdmin, deleteUser);

module.exports = router;
