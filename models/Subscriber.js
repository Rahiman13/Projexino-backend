const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    subscribedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['Subscribed', 'Unsubscribed'], default: 'Subscribed' },
});

const Subscriber = mongoose.model('Subscriber', subscriberSchema);
module.exports = Subscriber;
