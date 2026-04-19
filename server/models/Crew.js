const mongoose = require('mongoose');

const crewSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  region:    { type: String, default: '전국' },
  isPrivate: { type: Boolean, default: false },
  password:  { type: String, default: null },      // 비공개 크루 입장코드
  owner:     { type: String, required: true },      // 생성자 email
  ownerName: { type: String, required: true },
  members:   { type: Number, default: 1 },
  lastActive:{ type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Crew', crewSchema);
