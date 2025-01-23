const express = require('express');
const { getNewsletters, createNewsletter, updateNewsletter, deleteNewsletter, getMonthlyNewsletterCounts, getTotalNewslettersCount, sendNewsletter, scheduleBlogNewsletter, getScheduledNewsletters, cancelScheduledNewsletter, sendAnnouncement,
    getMonthlyAnnouncementCount,
    getTotalAnnouncementCount,
    getAllNewsletters,
 } = require('../controllers/newsLetterControllers');
const router = express.Router();
const upload = require('../middlewares/multerConfig');

router.get('/', getNewsletters); // Get all newsletters
router.post('/', createNewsletter); // Create a newsletter
router.put('/:id', updateNewsletter); // Update a newsletter by ID
router.delete('/:id', deleteNewsletter); // Delete a newsletter by ID
router.post('/:id/send', sendNewsletter); // New route for sending newsletter


// New routes for counts
router.get('/counts/total', getTotalNewslettersCount); // Get total count of newsletters
router.get('/counts/monthly/:year', getMonthlyNewsletterCounts); // Get monthly counts for a selected year

// New routes for scheduled blog newsletters
router.post('/schedule-blog', scheduleBlogNewsletter);
router.get('/scheduled', getScheduledNewsletters);
router.post('/cancel/:id', cancelScheduledNewsletter);

// New route for sending announcements
router.post('/send-announcement', upload.array('images', 5), sendAnnouncement);




// Route to get monthly announcement count for a specific year
router.get('/announcement-count/:year', getMonthlyAnnouncementCount);

// Route to get total count of all newsletters
router.get('/announcement-count', getTotalAnnouncementCount);

// Route to get all newsletters
router.get('/newsletters', getAllNewsletters);

module.exports = router;
