const express = require('express');
const { getSubscribers, addSubscriber,updateSubscriber, deleteSubscriber, unsubscribeSubscriber,
    getTotalCounts,
    getMonthlyCounts,
    getCountsBetweenDates,
    getRecentSubscribers
 } = require('../controllers/subscriberControllers');
const router = express.Router();

router.get('/', getSubscribers); // Get all subscribers
router.post('/', addSubscriber); // Add a new subscriber
router.put('/:id', updateSubscriber); // Remove a subscriber by ID
router.delete('/:id', deleteSubscriber); // Remove a subscriber by ID
router.post('/unsubscribe', unsubscribeSubscriber); // Unsubscribe a subscriber
router.get('/count/total', getTotalCounts); // Get total counts
router.get('/count/monthly/:year', getMonthlyCounts); // Get counts for each month of the selected year
router.post('/count/dates', getCountsBetweenDates); // Get counts between specific dates
router.get('/recent', getRecentSubscribers); // Get the 5 most recent subscribers



module.exports = router;
