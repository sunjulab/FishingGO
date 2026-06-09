const mongoose = require('mongoose');

// 크루 채팅 메시지 영구 보존
const chatMessageSchema = new mongoose.Schema({
  crewId:      { type: String, trim: true, required: true, index: true },
  sender:      { type: String, trim: true, required: true },
  text:        { type: String, trim: true, default: '' },       // 일반 텍스트 메시지
  time:        { type: String, trim: true, default: '' },
  // ✅ POST-SHARE 필드 (type='post_share' 일 때 사용)
  type:        { type: String, trim: true, default: 'text' },   // 'text' | 'post_share'
  postId:      { type: String, trim: true, default: '' },
  postTitle:   { type: String, trim: true, default: '' },
  postPreview: { type: String, trim: true, default: '' },
  postImage:   { type: String, trim: true, default: '' },
  postCategory:{ type: String, trim: true, default: '' },
  // 발신자 레벨 뱃지
  senderLevel: { type: String, trim: true, default: '' },
  senderEmoji: { type: String, trim: true, default: '' },
  senderTitle: { type: String, trim: true, default: '' },
  // ✅ REPLY: 답장 대상 (카카오톡/인스타 스타일 인용)
  replyTo: {
    sender: { type: String, trim: true, default: '' },
    text:   { type: String, trim: true, default: '' },
  },
}, { timestamps: true }); // ✅ TECH-DEBT: 수동 createdAt 제거 — Mongoose timestamps 자동 관리 (TTL 인덱스 정상 작동)

// 채팅은 최근 30일만 보존 (TTL 인덱스)
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
