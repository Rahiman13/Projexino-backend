const express = require('express');
const router = express.Router();
const {
    createCareer,
    getCareers,
    getCareerById,
    updateCareer,
    deleteCareer,
    applyForCareer,
    getMonthlyCareerCounts,
    getAllApplications,
    getApplicationsByCareer
} = require('../controllers/careersController');
const authenticateUser = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/adminMiddleware');
const upload = require('../middlewares/multerConfig');

// Public routes
router.get('/', getCareers);
router.get('/:id', getCareerById);
router.get('/counts/:year', getMonthlyCareerCounts);

// Protected routes (require authentication)
router.post('/', authenticateUser,  createCareer);
router.put('/:id', authenticateUser,  updateCareer);
router.delete('/:id', authenticateUser,  deleteCareer);

// Application route with resume upload
router.post('/:id/apply', upload.single('resume'), applyForCareer);

// Add these routes to your existing routes
router.get('/applications', authenticateUser,  getAllApplications);
router.get('/:id/applications', authenticateUser, getApplicationsByCareer);

module.exports = router;
