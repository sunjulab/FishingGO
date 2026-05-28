const mongoose = require('mongoose');

// 크루 채팅 메시지 영구 보존
const chatMessageSchema = new mongoose.Schema({
  crewId:      { type: String, required: true, index: true },
  sender:      { type: String, required: true },
  text:        { type: String, default: '' },       // 일반 텍스트 메시지
  time:        { type: String, default: '' },
  // ✅ POST-SHARE 필드 (type='post_share' 일 때 사용)
  type:        { type: String, default: 'text' },   // 'text' | 'post_share'
  postId:      { type: String, default: '' },
  postTitle:   { type: String, default: '' },
  postPreview: { type: String, default: '' },
  postImage:   { type: String, default: '' },
  postCategory:{ type: String, default: '' },
  // 발신자 레벨 뱃지
  senderLevel: { type: String, default: '' },
  senderEmoji: { type: String, default: '' },
  senderTitle: { type: String, default: '' },
  // ✅ REPLY: 답장 대상 (카카오톡/인스타 스타일 인용)
  replyTo: {
    sender: { type: String, default: '' },
    text:   { type: String, default: '' },
  },
}, { timestamps: true }); // ✅ TECH-DEBT: 수동 createdAt 제거 — Mongoose timestamps 자동 관리 (TTL 인덱스 정상 작동)

// 채팅은 최근 30일만 보존 (TTL 인덱스)
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
