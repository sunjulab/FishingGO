const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  content:   { type: String, required: true },
  isPinned:  { type: Boolean, default: false },
  // ✅ POPUP-CTRL: 홈화면 팝업 노출 여부 — 작성/수정 시 체크박스로 명시 지정
  isPopup:   { type: Boolean, default: false },
  author:    { type: String, default: 'MASTER' },
  views:     { type: Number, default: 0 },
  // ✅ POPUP: 공지 이미지 (base64) — isPopup=true인 공지의 팝업 이미지
  image:     { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

// ✅ 28TH-B2: 쿼리 성능 인덱스 — 고정공지 우선 + 최신순
noticeSchema.index({ isPinned: -1, createdAt: -1 });
noticeSchema.index({ isPopup: 1, createdAt: -1 }); // 팝업 쿼리용
noticeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notice', noticeSchema);

