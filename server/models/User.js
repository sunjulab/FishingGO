const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  tier: { type: String, default: 'Silver' },
  avatar: { type: String, default: 'https://i.pravatar.cc/150?img=11' },
  premiumEnds: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
