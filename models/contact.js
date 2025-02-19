const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true 
    },
    message: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Middleware to send email after saving new contact
contactSchema.post('save', async function(doc) {
    const transporter = require('../utils/transporter');
    
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'becproject99@gmail.com',
            subject: 'New Contact Form Submission',
            html: `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
                        
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                            font-family: 'Plus Jakarta Sans', sans-serif;
                        }
                        
                        .wrapper {
                            max-width: 600px;
                            margin: 0 auto;
                            background: #f8fafc;
                        }
                        
                        .banner {
                            background: linear-gradient(135deg, #2b5a9e 0%, #19234d 100%);
                            padding: 40px;
                            border-radius: 16px 16px 0 0;
                            position: relative;
                            overflow: hidden;
                        }
                        
                        .banner::before {
                            content: '';
                            position: absolute;
                            top: -50%;
                            left: -50%;
                            width: 200%;
                            height: 200%;
                            background: repeating-linear-gradient(
                                45deg,
                                rgba(255, 255, 255, 0.1) 0px,
                                rgba(255, 255, 255, 0.1) 1px,
                                transparent 1px,
                                transparent 10px
                            );
                            animation: patternMove 20s linear infinite;
                        }
                        
                        @keyframes patternMove {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        
                        .banner h2 {
                            color: #ffffff;
                            font-size: 28px;
                            font-weight: 700;
                            margin-bottom: 10px;
                            position: relative;
                            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
                        }
                        
                        .content {
                            background: #ffffff;
                            padding: 40px;
                            border-radius: 0 0 16px 16px;
                            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                        }
                        
                        .field {
                            margin-bottom: 24px;
                            padding-bottom: 24px;
                            border-bottom: 1px solid #e2e8f0;
                        }
                        
                        .field:last-child {
                            border-bottom: none;
                            margin-bottom: 0;
                            padding-bottom: 0;
                        }
                        
                        .label {
                            color: #64748b;
                            font-size: 14px;
                            font-weight: 500;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            margin-bottom: 8px;
                        }
                        
                        .value {
                            color: #1e293b;
                            font-size: 16px;
                            line-height: 1.6;
                        }
                        
                        .timestamp {
                            font-size: 14px;
                            color: #94a3b8;
                            margin-top: 30px;
                            text-align: center;
                            font-style: italic;
                        }
                    </style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="banner">
                            <h2>🎉 New Contact Form Submission</h2>
                        </div>
                        <div class="content">
                            <div class="field">
                                <div class="label">Name</div>
                                <div class="value">${doc.name}</div>
                            </div>
                            <div class="field">
                                <div class="label">Email</div>
                                <div class="value">${doc.email}</div>
                            </div>
                            <div class="field">
                                <div class="label">Message</div>
                                <div class="value">${doc.message}</div>
                            </div>
                            <div class="timestamp">
                                Submitted at ${doc.createdAt.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </body>
            </html>
            `
        });
    } catch (error) {
        console.error('Error sending contact notification email:', error);
    }
});

const Contact = mongoose.model('Contact', contactSchema);
module.exports = Contact;
