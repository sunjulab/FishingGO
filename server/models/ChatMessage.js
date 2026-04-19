const mongoose = require('mongoose');

// 크루 채팅 메시지 영구 보존
const chatMessageSchema = new mongoose.Schema({
  crewId:    { type: String, required: true, index: true },
  sender:    { type: String, required: true },
  text:      { type: String, required: true },
  time:      { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

// 채팅은 최근 30일만 보존 (TTL 인덱스)
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
