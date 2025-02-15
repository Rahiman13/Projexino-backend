require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan'); // Added for logging HTTP requests
const Newsletter = require('./models/newsletter'); // Add this line


const subscriberRoutes = require('./routes/subscriberRoutes');
const newsletterRoutes = require('./routes/newsLetterRoutes');
const emailRoutes = require('./routes/emailRoutes');

// Initialize Express App
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev')); // Log incoming requests for debugging

// MongoDB Connection function
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');
        
        // Sync indexes after connection
        await Newsletter.syncIndexes();
        console.log('Newsletter indexes synchronized');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));
// app.use('/api/newsletters', require('./routes/newsletterRoutes')); // Fixed typo from `newsLetterRoutes`
app.use('/api/subscribers', subscriberRoutes); // Routes for subscribers
app.use('/api/newsletters', newsletterRoutes); // Routes for newsletters
app.use('/api/emails', emailRoutes); // Routes for sending emails
app.use('/api/admin', require('./routes/adminRoutes'));

// Default Route for Health Check
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
