const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email:          { type: String, required: true, unique: true },
  password:       { type: String, required: true },
  name:           { type: String, required: true, unique: true }, // 닉네임 (중복불가)
  realName:       { type: String, default: '' },                  // ✅ 실명 (회원가입 시 수집)
  phone:          { type: String, default: '' },                   // 휴대폰 번호 (SMS 발송용)
  level:          { type: Number, default: 1 },
  exp:            { type: Number, default: 0 },
  totalExp:       { type: Number, default: 0 },           // ← 누적 EXP (레벨 계산용)
  streak:         { type: Number, default: 0 },           // ← 연속 출석일수
  lastAttendance: { type: Date,   default: null },        // ✅ 10TH-C2: String → Date 타입 교체 — MongoDB 날짜 쿼리 최적화
  totalAttendance:{ type: Number, default: 0 },
  tier:           { type: String, default: 'FREE' },       // FREE | BUSINESS_LITE | PRO | BUSINESS_VIP | MASTER
  vvipHarborId:   { type: String, default: null },         // VVIP 선점 항구 ID
  vvipPurchasedAt:{ type: Date,   default: null },         // VVIP 구매일
  vvipExpiresAt:  { type: Date,   default: null },         // VVIP 만료일
  avatar:         { type: String, default: null },          // ✅ 10TH-A2: pravatar.cc 외부 CDN 의존 제거 — null 저장 후 프론트엔드 SVG fallback 사용
  picture:        { type: String, default: null },         // 구글 프로필 사진
  followers:      [{ type: String }],
  following:      [{ type: String }],
  blockedUsers:   [{ type: String }],      // 차단한 사용자 이름(또는 이메일) 목록
  notiSettings:   {
    flow: { type: Boolean, default: true },
    bait: { type: Boolean, default: true },
    comm: { type: Boolean, default: true }
  },
  favorites:           [{ type: String }],          // 즐겨찾기 낚시 포인트 ID 목록
  subscriptionExpiresAt: { type: Date, default: null }, // 구독 만료일 (checkSubscriptionValid 미들웨어 사용)
  // ✅ FREE-LIMIT: 무료 플랜 하루 포인트 입장 카운터 (KST 자정 기준 리셋)
  dailyPointVisit: {
    count: { type: Number, default: 0 },
    date:  { type: String, default: '' }, // 'YYYY-MM-DD' KST 기준
  },
  // ✅ CREW-ENH: 가입한 크루 목록 (crewId 배열)
  joinedCrews: [{
    crewId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Crew' },
    joinedAt: { type: Date, default: Date.now },
  }],
  createdAt:      { type: Date, default: Date.now },
  lastSeen:       { type: Date, default: null },       // ✅ STAT: 최근 API 요청 시각 — 접속자 통계용

});

// ✅ BUG-47: 쿼리 성능 인덱스 명시적 추가
// email, name: 스키마 레벨 unique: true로 이미 자동 생성되므로 schema.index() 중복 선언 제거 (경고 해결)
// tier + subscriptionExpiresAt: 구독 만료 배치 쿼리 최적화 (복합)
userSchema.index({ tier: 1, subscriptionExpiresAt: 1 });
// ✅ 10TH-B2: subscriptionExpiresAt 단독 인덱스 — 만료 전용 체크 쿼리 (WHERE subscriptionExpiresAt < now) 시 full-scan 방지
userSchema.index({ subscriptionExpiresAt: 1 });

module.exports = mongoose.model('User', userSchema);
