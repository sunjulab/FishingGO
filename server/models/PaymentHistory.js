const mongoose = require('mongoose');

/**
 * PaymentHistory — 결제 내역 이력 모델
 * 성공/실패 모든 결제 기록 보관
 */
const paymentHistorySchema = new mongoose.Schema({
  userId:       { type: String, trim: true, required: true },
  userName:     { type: String, trim: true },
  planId:       { type: String, trim: true },
  pgProvider:   { type: String, trim: true },           // kakaopay, naverpay, tosspayments
  paymentType:  { type: String, trim: true, enum: ['one_time', 'billing_first', 'billing_auto'], default: 'one_time' },
  amount:       { type: Number, required: true },
  status:       { type: String, trim: true, enum: ['paid', 'failed', 'refunded', 'cancelled'], default: 'paid' },
  isTest:       { type: Boolean, default: false }, // 테스트 결제 여부
  imp_uid:      { type: String, trim: true },
  merchant_uid: { type: String, trim: true, unique: true, sparse: true }, // ✅ 10TH-C3: sparse 의도적 — 테스트모드(null)는 중복 허용, 실결제시에만 unique 강제
  failReason:   { type: String, trim: true },
  refundedAt:   { type: Date },
  // ✅ FIX-PAYHIST-SCHEMA: IAP/UCB 결제에서 저장하던 필드가 스키마에 없어 버려지던 문제 수정 (중복결제 검사 무력화 원인)
  email:         { type: String, trim: true },
  pg:            { type: String, trim: true },          // google_play, payple, portone
  method:        { type: String, trim: true },          // iap, ucb
  tier:          { type: String, trim: true },
  productId:     { type: String, trim: true },
  purchaseToken: { type: String, trim: true, index: true }, // Google Play 구독 토큰 (중복 처리 방지)
  paidAt:        { type: Date },
}, { timestamps: true }); // ✅ TECH-DEBT: 수동 createdAt 제거 — Mongoose timestamps 자동 관리

paymentHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentHistory', paymentHistorySchema);
