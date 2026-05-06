const mongoose = require('mongoose');

// 조과 기록 (낙시 기록실)
const catchRecordSchema = new mongoose.Schema({
  author:       { type: String, required: true },
  author_email: { type: String, required: true },
  fish:         { type: String, required: true },    // 어종
  // ✅ 27TH-C2: size/weight Mixed 타입 — 기존 String 데이터 호환 유지 + 숫자 입력 허용
  // 신규 저장 시 API 레이어에서 parseFloat() 정규화 권장 (문자열 정렬 오류 방지)
  size:         { type: mongoose.Schema.Types.Mixed, default: '' }, // 사이즈 (cm) — String | Number
  weight:       { type: mongoose.Schema.Types.Mixed, default: '' }, // 무게 (kg) — String | Number
  location:     { type: String, default: '' },        // 장소
  bait:         { type: String, default: '' },        // 미끼/루어  ✅ BUG-61: '미끄' 오타 수정
  weather:      { type: String, default: '' },        // 날씨
  wind:         { type: String, default: '' },        // 풍속
  wave:         { type: String, default: '' },        // 파도
  memo:         { type: String, default: '' },        // 메모
  // ✅ BUG-45/46: img → image 필드명 통일 (CatchDetail.jsx와 API 응답 일치)
  image:        { type: String, default: null },      // 사진 URL (기존 'img' 필드명에서 변경)
  date:         { type: String, default: '' },        // 날짜 (YYYY-MM-DD)
  time:         { type: String, default: '' },        // 시간
  pointId:      { type: String, default: null },      // 연결된 포인트 ID
  createdAt:    { type: Date, default: Date.now },
});

// ✅ BUG-45: 쿼리 성능 인덱스 추가
catchRecordSchema.index({ author_email: 1, createdAt: -1 }); // 내 기록 조회
catchRecordSchema.index({ pointId: 1, createdAt: -1 });      // 포인트 별 조회

module.exports = mongoose.model('CatchRecord', catchRecordSchema);
