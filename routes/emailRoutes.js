const express = require('express');
const { sendNewsletter, sendLatestBlogs } = require('../controllers/emailController');
const router = express.Router();

// Route to manually sending the latest blogs as a newsletter
router.post('/send-latest-blogs', sendLatestBlogs); 

// Route to send newsletter to all subscribers (existing route)
router.post('/send', sendNewsletter);

module.exports = router;
