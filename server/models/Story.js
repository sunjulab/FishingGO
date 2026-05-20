const mongoose = require('mongoose');

/**
 * Story 모델 — 24시간 TTL 오늘 조황 스토리 (Phase 3)
 * - expiresAt 기반 MongoDB TTL 인덱스로 자동 만료 삭제
 */
const storySchema = new mongoose.Schema({
  author:       { type: String, required: true },
  author_email: { type: String, required: true },
  author_avatar:{ type: String, default: null },
  image:        { type: String, required: true }, // 스토리는 이미지 필수
  content:      { type: String, maxlength: 200, default: '' },
  location:     {
    address: { type: String, default: '' },
    lat:     { type: Number, default: null },
    lng:     { type: Number, default: null },
  },
  views:        { type: Number, default: 0 },
  expiresAt:    { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
}, { timestamps: true });

// ✅ MongoDB TTL 인덱스: expiresAt 도달 시 자동 문서 삭제
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
storySchema.index({ author_email: 1 });
storySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Story', storySchema);
