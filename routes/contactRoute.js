const express = require('express');
const { createContact, getContacts, getContactCounts, markAsSeen } = require('../controllers/contactController');
const authenticateUser = require('../middlewares/authMiddleware');
const router = express.Router();

// Route to submit contact form
router.post('/', createContact);

// Route to get all contacts 
router.get('/', authenticateUser, getContacts);

// New routes for contact counts and marking as seen
router.get('/counts', authenticateUser, getContactCounts);
router.patch('/:id/seen', authenticateUser, markAsSeen);

module.exports = router;
