const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title:     { type: String, trim: true, required: true },
  content:   { type: String, trim: true, required: true },
  isPinned:  { type: Boolean, default: false },
  // ✅ POPUP-CTRL: 홈화면 팝업 노출 여부 — 작성/수정 시 체크박스로 명시 지정
  isPopup:   { type: Boolean, default: false },
  author:    { type: String, trim: true, default: 'MASTER' },
  views:     { type: Number, default: 0 },
  // ✅ POPUP: 공지 이미지 (base64) — isPopup=true인 공지의 팝업 이미지
  image:     { type: String, trim: true, default: null },
  images:    { type: [String], default: [] }, // ✅ MULTI-IMG: 다중 이미지 (최대 5장)
}, { timestamps: true }); // ✅ TECH-DEBT: 수동 createdAt 제거 — Mongoose timestamps 자동 관리

// ✅ 28TH-B2: 쿼리 성능 인덱스 — 고정공지 우선 + 최신순
noticeSchema.index({ isPinned: -1, createdAt: -1 });
noticeSchema.index({ isPopup: 1, createdAt: -1 }); // 팝업 쿼리용
// ✅ BUG-FIX: 단독 createdAt 인덱스 제거 — 위 복합 인덱스가 이미 커버 (Mongoose 중복 인덱스 경고 제거)

module.exports = mongoose.model('Notice', noticeSchema);

