const express = require('express');
const { createContact, getContacts } = require('../controllers/contactController');
const router = express.Router();

// Route to submit contact form
router.post('/', createContact);

// Route to get all contacts (optional - for admin purposes)
router.get('/', getContacts);

module.exports = router;
