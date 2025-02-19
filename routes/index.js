const express = require('express');
const blogRoutes = require('./blogRoutes');
const subscriberRoutes = require('./subscriberRoutes');
const newsletterRoutes = require('./newsLetterRoutes');
const emailRoutes = require('./emailRoutes');
const careerRoutes = require('./routes/careerRoutes');

const router = express.Router();

router.use('/blogs', blogRoutes); // Routes for blogs
router.use('/subscribers', subscriberRoutes); // Routes for subscribers
router.use('/newsletters', newsletterRoutes); // Routes for newsletters
router.use('/emails', emailRoutes); // Routes for sending emails
router.use('/api/careers', careerRoutes);

module.exports = router;
