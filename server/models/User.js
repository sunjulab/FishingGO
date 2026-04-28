const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email:          { type: String, required: true, unique: true },
  password:       { type: String, required: true },
  name:           { type: String, required: true, unique: true }, // 닉네임 (중복불가)
  phone:          { type: String, default: '' },                   // 휴대폰 번호 (SMS 발송용)
  level:          { type: Number, default: 1 },
  exp:            { type: Number, default: 0 },
  totalExp:       { type: Number, default: 0 },           // ← 누적 EXP (레벨 계산용)
  streak:         { type: Number, default: 0 },           // ← 연속 출석일수
  lastAttendance: { type: String, default: null },         // YYYY-MM-DD
  totalAttendance:{ type: Number, default: 0 },
  tier:           { type: String, default: 'FREE' },       // FREE | PRO | BUSINESS_VIP | MASTER
  proExpiresAt:   { type: Date,   default: null },         // PRO 구독 만료일
  vvipHarborId:   { type: String, default: null },         // VVIP 선점 항구 ID
  vvipPurchasedAt:{ type: Date,   default: null },         // VVIP 구매일
  vvipExpiresAt:  { type: Date,   default: null },         // VVIP 만료일
  avatar:         { type: String, default: 'https://i.pravatar.cc/150?img=11' },
  picture:        { type: String, default: null },         // 구글 프로필 사진
  followers:      [{ type: String }],
  following:      [{ type: String }],
  blockedUsers:   [{ type: String }],      // 차단한 사용자 이름(또는 이메일) 목록
  notiSettings:   {
    flow: { type: Boolean, default: true },
    bait: { type: Boolean, default: true },
    comm: { type: Boolean, default: true }
  },
  createdAt:      { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
