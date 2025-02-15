const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Add error handling to verify configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('Transporter verification error:', error);
    } else {
        console.log('Server is ready to send emails');
    }
});

module.exports = transporter;
