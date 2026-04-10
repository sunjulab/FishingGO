const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true, unique: true }, // 닉네임 (중복불가)
  level: { type: Number, default: 1 },
  exp: { type: Number, default: 0 },
  lastAttendance: { type: String, default: null }, // YYYY-MM-DD
  totalAttendance: { type: Number, default: 0 },
  followers: [{ type: String }], // email or ids
  following: [{ type: String }],
  tier: { type: String, default: 'Silver' },
  avatar: { type: String, default: 'https://i.pravatar.cc/150?img=11' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
