const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  plan: { type: String, enum: ['Free', 'Pro', 'Premium'], default: 'Free' },
  paymentStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  selectedPlan: { type: String, default: null },
  transactionId: { type: String, default: null },
  messagesUsed: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
