const mongoose = require('mongoose');

// 조과 기록 (낚시 기록실)
const catchRecordSchema = new mongoose.Schema({
  author:       { type: String, required: true },
  author_email: { type: String, required: true },
  fish:         { type: String, required: true },    // 어종
  size:         { type: String, default: '' },        // 사이즈 (cm)
  weight:       { type: String, default: '' },        // 무게 (kg)
  location:     { type: String, default: '' },        // 장소
  bait:         { type: String, default: '' },        // 미끼/루어
  weather:      { type: String, default: '' },        // 날씨
  wind:         { type: String, default: '' },        // 풍속
  wave:         { type: String, default: '' },        // 파도
  memo:         { type: String, default: '' },        // 메모
  img:          { type: String, default: null },      // 사진 URL
  date:         { type: String, default: '' },        // 날짜 (YYYY-MM-DD)
  time:         { type: String, default: '' },        // 시간
  pointId:      { type: String, default: null },      // 연결된 포인트 ID
  createdAt:    { type: Date, default: Date.now },
});

module.exports = mongoose.model('CatchRecord', catchRecordSchema);
