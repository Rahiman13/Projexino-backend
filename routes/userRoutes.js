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

// Register User (without image upload)
router.post('/register', registerUser);

// Login User
router.post('/login', loginUser);

// Get User Profile (Authenticated)
router.get('/profile', authenticateUser, getUserProfile);

// Update User Profile (Authenticated)
router.put('/profile', authenticateUser, updateUserProfile);

// Delete User Profile (Authenticated)
router.delete('/profile', authenticateUser, deleteUserProfile);

// Fetch All Users (Admin or Authenticated)
router.get('/', authenticateUser, getAllUsers);

// Forgot Password
router.post('/forgot-password', forgotPassword);

// Validate OTP And Reset Password
router.post('/reset-password', verifyOTPAndResetPassword);


module.exports = router;
