const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'rahiman@projexino.com',
        pass: process.env.EMAIL_APP_PASSWORD || 'fhay qjga nyjt tczq'
        // user: 'rahiman@projexino.com',
        // pass: 'fhay qjga nyjt tczq'
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify transporter configuration
transporter.verify(function (error, success) {
    if (error) {
        console.log('Transporter verification error:', error);
    } else {
        console.log('Server is ready to send emails');
    }
});

module.exports = transporter;
