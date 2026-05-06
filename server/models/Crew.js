const mongoose = require('mongoose');

const crewSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  region:    { type: String, default: '전국' },
  isPrivate: { type: Boolean, default: false },
  password:  { type: String, default: null },      // 비공개 크루 입장코드
  owner:     { type: String, required: true },      // 생성자 email
  ownerName: { type: String, required: true },
  members:   { type: Number, default: 1 },
  // ✅ BUG-52: limit 필드 추가 (CreateCrew.jsx에서 이미 전송 중이었지만 모델에 누락 → 저장 안 됨 버그)
  limit:     { type: Number, default: 20 },         // 최대 인원 (기본 20명)
  lastActive:{ type: Date,   default: null }, // ✅ 28TH-B3: String → Date 타입 교체 — User.lastAttendance 10TH-C2 패턴 통일 (날짜 범위 쿼리·정렬 정확성 확보)
  createdAt: { type: Date, default: Date.now },
});

// ✅ 쿼리 성능 인덱스
crewSchema.index({ owner: 1 });           // 내 크루 조회
crewSchema.index({ name: 1 });            // 크루명 검색
crewSchema.index({ region: 1 });          // 지역 필터

module.exports = mongoose.model('Crew', crewSchema);
