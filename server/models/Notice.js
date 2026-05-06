const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  content:   { type: String, required: true },
  isPinned:  { type: Boolean, default: false },
  author:    { type: String, default: 'MASTER' },
  views:     { type: Number, default: 0 },
  // ✅ POPUP: 공지 이미지 (base64) — 작성 시 첨부한 첫 이미지가 앱 시작 팝업 이미지로 자동 사용
  image:     { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

// ✅ 28TH-B2: 쿼리 성능 인덱스 — 고정공지 우선 + 최신순
noticeSchema.index({ isPinned: -1, createdAt: -1 });
noticeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notice', noticeSchema);
