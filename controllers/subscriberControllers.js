const Subscriber = require('../models/Subscriber');

// Add Subscriber
exports.addSubscriber = async (req, res) => {
    try {
        const { name,email } = req.body;
        const subscriber = new Subscriber({ name,email });
        await subscriber.save();
        res.status(201).json({ message: 'Subscriber added successfully', subscriber });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Fetch All Subscribers
exports.getSubscribers = async (req, res) => {
    try {
        const subscribers = await Subscriber.find();
        res.status(200).json(subscribers);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update Subscriber
exports.updateSubscriber = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedSubscriber = await Subscriber.findByIdAndUpdate(id, updates, { new: true });
        res.status(200).json(updatedSubscriber);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete Subscriber
exports.deleteSubscriber = async (req, res) => {
    try {
        const { id } = req.params;
        await Subscriber.findByIdAndDelete(id);
        res.status(200).json({ message: 'Subscriber deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};



// Unsubscribe Subscriber
exports.unsubscribeSubscriber = async (req, res) => {
    try {
        const { email } = req.body; // Use email to identify the subscriber
        const subscriber = await Subscriber.findOne({ email });

        if (!subscriber) {
            return res.status(404).json({ error: 'Subscriber not found' });
        }

        if (subscriber.status === 'Unsubscribed') {
            return res.status(400).json({ message: 'Subscriber is already unsubscribed' });
        }

        subscriber.status = 'Unsubscribed'; // Update the status
        await subscriber.save();

        res.status(200).json({ message: 'Subscriber unsubscribed successfully', subscriber });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Total subscribers counts
exports.getTotalCounts = async (req, res) => {
    try {
        const total = await Subscriber.countDocuments();
        const active = await Subscriber.countDocuments({ status: 'Subscribed' });
        const inactive = await Subscriber.countDocuments({ status: 'Unsubscribed' });

        res.status(200).json({ total, active, inactive });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Count of Current year all months
exports.getMonthlyCounts = async (req, res) => {
    try {
        const selectedYear = parseInt(req.params.year, 10) || new Date().getFullYear(); // Extract year from route parameter
        const monthlyCounts = [];

        for (let month = 0; month < 12; month++) {
            const start = new Date(selectedYear, month, 1);
            const end = new Date(selectedYear, month + 1, 1);

            const total = await Subscriber.countDocuments({ subscribedAt: { $gte: start, $lt: end } });
            const active = await Subscriber.countDocuments({ subscribedAt: { $gte: start, $lt: end }, status: 'Subscribed' });
            const inactive = await Subscriber.countDocuments({ subscribedAt: { $gte: start, $lt: end }, status: 'Unsubscribed' });

            monthlyCounts.push({ month: month + 1, total, active, inactive });
        }

        res.status(200).json(monthlyCounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Counts between dates
exports.getCountsBetweenDates = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        const total = await Subscriber.countDocuments({ subscribedAt: { $gte: start, $lt: end } });
        const active = await Subscriber.countDocuments({ subscribedAt: { $gte: start, $lt: end }, status: 'Subscribed' });
        const inactive = await Subscriber.countDocuments({ subscribedAt: { $gte: start, $lt: end }, status: 'Unsubscribed' });

        res.status(200).json({ total, active, inactive });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// Get the 5 most recent subscribers
exports.getRecentSubscribers = async (req, res) => {
    try {
        const recentSubscribers = await Subscriber.find()
            .sort({ subscribedAt: -1 }) // Sort by subscribedAt in descending order
            .limit(5); // Limit the results to 5

        res.status(200).json(recentSubscribers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
