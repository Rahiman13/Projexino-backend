const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Author', 'Reader'], default: 'Author' },
  createdAt: { type: Date, default: Date.now },
  otp: { type: String }, // OTP for password reset
  otpExpires: { type: Date }, // Expiry time for OTP
});


const User = mongoose.model('User', UserSchema);
module.exports = User;
