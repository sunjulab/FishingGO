const mongoose = require('mongoose');

// 마스터가 추가한 커스텀 낚시 포인트 영구 저장 (Render 재배포 후에도 유지)
const customPointSchema = new mongoose.Schema({
  id:            { type: String, required: true, unique: true },
  name:          { type: String, required: true },
  type:          { type: String, required: true },
  region:        { type: String, default: '미지정' },
  lat:           { type: Number, required: true },
  lng:           { type: Number, required: true },
  fish:          { type: String, default: '미확인' },
  score:         { type: Number, default: 80 },
  status:        { type: String, default: '보통' },
  obsCode:       { type: String, default: null },
  aiDescription: { type: String, default: null },
  season:        { type: String, default: null },
  recommend:     { type: String, default: null },
  isCustom:      { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('CustomPoint', customPointSchema);
