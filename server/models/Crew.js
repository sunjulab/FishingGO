const mongoose = require('mongoose');

const crewSchema = new mongoose.Schema({
  name:      { type: String, trim: true, required: true },
  region:    { type: String, trim: true, default: '전국' },
  isPrivate: { type: Boolean, default: false },
  password: { type: String, trim: true, select: false, default: null },      // 비공개 크루 입장코드
  owner:     { type: String, trim: true, required: true },      // 생성자 email
  ownerName: { type: String, trim: true, required: true },
  members:   { type: Number, default: 1 },
  // ✅ BUG-52: limit 필드 추가 (CreateCrew.jsx에서 이미 전송 중이었지만 모델에 누락 → 저장 안 됨 버그)
  limit:     { type: Number, default: 100 },        // 최대 인원 (기본 100명)
  lastActive:{ type: Date,   default: null },       // ✅ 복원: 마지막 활동 시각
  logo:      { type: String, trim: true, default: null },       // ✅ CREW-LOGO: 원형 크루 로고 (base64)
  // ✅ CREW-ENH: 실제 멤버 목록 — 기존 members(숫자)는 카운트 캐시로 유지
  memberList: [{
    email: { type: String, trim: true, lowercase: true, required: true },
    name:     { type: String, trim: true, required: true },
    role:     { type: String, trim: true, enum: ['owner', 'officer', 'member'], default: 'member' }, // ✅ officer(간부) 추가
    joinedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true }); // ✅ TECH-DEBT: 수동 createdAt 제거 — Mongoose timestamps 자동 관리

// ✅ 쿼리 성능 인덱스
crewSchema.index({ owner: 1 });           // 내 크루 조회
crewSchema.index({ name: 1 });            // 크루명 검색
crewSchema.index({ region: 1 });          // 지역 필터

module.exports = mongoose.model('Crew', crewSchema);
