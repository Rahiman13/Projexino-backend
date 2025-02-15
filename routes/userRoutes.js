const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    deleteUserProfile,
    getAllUsers,
    forgotPassword,
    verifyOTPAndResetPassword
} = require('../controllers/userController');
const authenticateUser = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/adminMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', verifyOTPAndResetPassword);

// Protected routes
router.get('/profile', authenticateUser, getUserProfile);
router.put('/profile', authenticateUser, updateUserProfile);
router.delete('/profile', authenticateUser, deleteUserProfile);

// Admin only routes
router.get('/', authenticateUser, isAdmin, getAllUsers);
router.delete('/:userId', authenticateUser, isAdmin, deleteUserProfile);

module.exports = router;
