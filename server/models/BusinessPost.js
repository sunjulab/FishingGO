const mongoose = require('mongoose');

// 선상배홍보 게시글 (선주 or VVIP)
const businessPostSchema = new mongoose.Schema({
  author:      { type: String, trim: true, required: true },
  author_email: { type: String, trim: true, lowercase: true, required: true },
  shipName:    { type: String, trim: true, required: true },
  type:        { type: String, trim: true, default: '선상낚시' },
  target:      { type: String, trim: true, default: '다수어종' },
  region:      { type: String, trim: true, default: '' },
  date:        { type: String, trim: true, default: '' },
  price:       { type: mongoose.Schema.Types.Mixed, default: '' }, // ✅ 28TH-C1: String → Mixed (27TH-C2 패턴) — 금액 정렬 오류 방지, 기존 String 데이터 호환 유지
  phone:       { type: String, trim: true, default: '' },
  content:     { type: String, trim: true, required: true },
  cover:       { type: String, trim: true, default: '' },     // 대표 이미지 URL (images[0] 자동 동기)
  images:      { type: [String], default: [] },   // ✅ MULTI-IMG: 다중 이미지 (최대 5장)
  capacity:    { type: Number, default: null },    // 모집 인원
  isPinned:    { type: Boolean, default: false }, // VVIP 스폰서 여부
  harborId:    { type: String, trim: true, default: null },   // VVIP 연결 항구 ID
  expiresAt:   { type: Date, default: null },     // VVIP 만료일
}, { timestamps: true }); // ✅ TECH-DEBT: 수동 createdAt 제거 — Mongoose timestamps 자동 관리

// ✅ LOW-2: 쿼리 성능 인덱스 추가
// author_email: 내 게시물 조회 시 O(1) 탐색
businessPostSchema.index({ author_email: 1, createdAt: -1 });
// isPinned + expiresAt: VVIP 스폰서 정렬 최적화
businessPostSchema.index({ isPinned: -1, expiresAt: 1, createdAt: -1 });

module.exports = mongoose.model('BusinessPost', businessPostSchema);
