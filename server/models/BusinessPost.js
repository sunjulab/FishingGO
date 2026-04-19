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
  price:       { type: String, default: '' },
  phone:       { type: String, default: '' },
  content:     { type: String, required: true },
  cover:       { type: String, default: '' },     // 대표 이미지 URL
  isPinned:    { type: Boolean, default: false }, // VVIP 스폰서 여부
  harborId:    { type: String, default: null },   // VVIP 연결 항구 ID
  expiresAt:   { type: Date, default: null },     // VVIP 만료일
  createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('BusinessPost', businessPostSchema);
