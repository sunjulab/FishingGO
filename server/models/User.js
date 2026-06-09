const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, lowercase: true, trim: true, maxlength: 100, required: true, unique: true },
  password: { type: String, maxlength: 200, select: false, required: true },
  name: { type: String, trim: true, maxlength: 30, required: true, unique: true }, // 닉네임 (중복불가)
  realName:       { type: String, default: '' },                  // ✅ 실명 (회원가입 시 수집)
  phone:          { type: String, default: '' },                   // 휴대폰 번호 (SMS 발송용)
  level:          { type: Number, default: 1 },
  exp:            { type: Number, default: 0 },
  totalExp:       { type: Number, default: 0 },
  streak:         { type: Number, default: 0 },
  lastAttendance: { type: Date,   default: null },
  totalAttendance:{ type: Number, default: 0 },
  tier:           { type: String, default: 'FREE' },       // FREE | BUSINESS_LITE | PRO | BUSINESS_VIP | MASTER
  vvipHarborId:   { type: String, default: null },
  vvipPurchasedAt:{ type: Date,   default: null },
  vvipExpiresAt:  { type: Date,   default: null },
  avatar:         { type: String, default: null },
  picture:        { type: String, default: null },
  followers:      [{ type: String }],
  following:      [{ type: String }],
  blockedUsers:   [{ type: String }],
  notiSettings:   {
    flow: { type: Boolean, default: true },
    bait: { type: Boolean, default: true },
    comm: { type: Boolean, default: true }
  },
  favorites:           [{ type: String }],
  subscriptionExpiresAt: { type: Date, default: null },
  // ✅ IAP 인앱결제 필드 — 스키마에 없으면 Mongoose strict mode가 $set을 무시
  iapPurchaseToken: { type: String,  default: null },   // Google Play 구독 purchaseToken
  iapProductId:     { type: String,  default: null },   // 구독 상품 ID (kr.fishinggo.app.pro_monthly 등)
  iapExpiresAt:     { type: Date,    default: null },   // 구독 만료일 — 30분 스케줄러 기준
  iapAutoRenewing:  { type: Boolean, default: false },  // 자동 갱신 여부
  updatedAt:        { type: Date,    default: null },   // 마지막 업데이트 시각
  // ✅ FREE-LIMIT: 무료 플랜 하루 포인트 입장 카운터 (KST 자정 기준 리셋)
  dailyPointVisit: {
    count: { type: Number, default: 0 },
    date:  { type: String, default: '' },
  },
  // ✅ CREW-ENH: 가입한 크루 목록 (crewId 배열)
  joinedCrews: [{
    crewId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Crew' },
    joinedAt: { type: Date, default: Date.now },
  }],
  createdAt:      { type: Date, default: Date.now },
  lastSeen:       { type: Date, default: null },
});

userSchema.index({ tier: 1, subscriptionExpiresAt: 1 });
userSchema.index({ subscriptionExpiresAt: 1 });
// ✅ IAP 만료 스케줄러 복합 인덱스 — tier + iapExpiresAt 조회 최적화
userSchema.index({ tier: 1, iapExpiresAt: 1 });

module.exports = mongoose.model('User', userSchema);
