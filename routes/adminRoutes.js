const express = require('express');
const router = express.Router();
const { deleteUser, getAllUsers } = require('../controllers/adminController');
const authenticateUser = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/adminMiddleware');

// Admin routes (all require authentication and admin role)
router.get('/users', authenticateUser,  getAllUsers);
router.delete('/users/:userId', authenticateUser,  deleteUser);

module.exports = router;
