const mongoose = require('mongoose');

// 선상배홍보 게시글 (선주 or VVIP)
const businessPostSchema = new mongoose.Schema({
  author:      { type: String, required: true },
  author_email:{ type: String, required: true },
  shipName:    { type: String, required: true },
  type:        { type: String, default: '선상낚시' },
  target:      { type: String, default: '다수어종' },
  region:      { type: String, default: '' },
  date:        { type: String, default: '' },
  price:       { type: mongoose.Schema.Types.Mixed, default: '' }, // ✅ 28TH-C1: String → Mixed (27TH-C2 패턴) — 금액 정렬 오류 방지, 기존 String 데이터 호환 유지
  phone:       { type: String, default: '' },
  content:     { type: String, required: true },
  cover:       { type: String, default: '' },     // 대표 이미지 URL
  isPinned:    { type: Boolean, default: false }, // VVIP 스폰서 여부
  harborId:    { type: String, default: null },   // VVIP 연결 항구 ID
  expiresAt:   { type: Date, default: null },     // VVIP 만료일
  createdAt:   { type: Date, default: Date.now },
});

// ✅ LOW-2: 쿼리 성능 인덱스 추가
// author_email: 내 게시물 조회 시 O(1) 탐색
businessPostSchema.index({ author_email: 1, createdAt: -1 });
// isPinned + expiresAt: VVIP 스폰서 정렬 최적화
businessPostSchema.index({ isPinned: -1, expiresAt: 1, createdAt: -1 });

module.exports = mongoose.model('BusinessPost', businessPostSchema);
