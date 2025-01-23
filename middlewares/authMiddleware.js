const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateUser = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Extract token from the 'Authorization' header

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token with your secret key

        // Log decoded user data to verify correct token
        console.log('Decoded user:', decoded);

        const user = await User.findById(decoded.userId); // Assuming `userId` is in the token

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user; // Attach the user to the request object for later use
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Token verification failed:', error); // Log the error for better debugging
        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = authenticateUser;
