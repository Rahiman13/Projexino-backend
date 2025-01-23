const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    images: [{ type: String }],
    status: { 
        type: String, 
        enum: ['Draft', 'Scheduled', 'Sent', 'Failed'],
        default: 'Draft'
    },
    sentAt: { type: Date },
    recipients: {
        total: { type: Number, default: 0 },
        successful: { type: Number, default: 0 },
        failed: { type: Number, default: 0 }
    },
    metadata: {
        scheduledFor: { type: Date },
        tags: [{ type: String }],
        category: { type: String },
        description: { type: String }
    }
}, {
    timestamps: true
});

// Create a compound index on status and scheduledFor for efficient queries
newsletterSchema.index({ status: 1, 'metadata.scheduledFor': 1 });

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

module.exports = Newsletter;
