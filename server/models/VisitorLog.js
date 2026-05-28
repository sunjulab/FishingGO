const mongoose = require('mongoose');

// ─── 방문자 로그 스키마 ────────────────────────────────────────────────────
// - ipHash : SHA-256 해시 (개인정보 비식별화)
// - date   : 'YYYY-MM-DD' KST 기준 날짜
// - userId : 로그인 유저 이메일 (미로그인 시 null)
// - unique index {ipHash, date} → 하루 IP당 1건만 upsert
// ─────────────────────────────────────────────────────────────────────────────
const VisitorLogSchema = new mongoose.Schema(
  {
    ipHash: { type: String, required: true, index: true },
    date:   { type: String, required: true },     // KST YYYY-MM-DD
    userId: { type: String, default: null },       // 로그인 이메일 (옵션)
  },
  { timestamps: true }
);

// 하루 한 번만 기록 (IP + 날짜 복합 유니크)
VisitorLogSchema.index({ ipHash: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('VisitorLog', VisitorLogSchema);
