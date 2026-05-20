const mongoose = require('mongoose');

// CCTV 관리자 오버라이드를 DB에 영구 저장
const cctvOverrideSchema = new mongoose.Schema({
  obsCode:   { type: String, required: true, unique: true },
  youtubeId: { type: String, default: null },
  type:      { type: String, default: 'youtube' },
  label:     { type: String, default: null },
  areaName:  { type: String, default: null },
  // ✅ BUG-FIX: updatedAt을 수동 default: Date.now로 관리하면 findOneAndUpdate 시 자동 갱신 안 됨
  // → Mongoose timestamps 옵션으로 createdAt/updatedAt 자동 관리
}, { timestamps: true });

module.exports = mongoose.model('CctvOverride', cctvOverrideSchema);
