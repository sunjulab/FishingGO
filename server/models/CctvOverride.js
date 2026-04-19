const mongoose = require('mongoose');

// CCTV 관리자 오버라이드를 DB에 영구 저장
const cctvOverrideSchema = new mongoose.Schema({
  obsCode:   { type: String, required: true, unique: true },
  youtubeId: { type: String, default: null },
  type:      { type: String, default: 'youtube' },
  label:     { type: String, default: null },
  areaName:  { type: String, default: null },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CctvOverride', cctvOverrideSchema);
