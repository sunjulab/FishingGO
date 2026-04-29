const mongoose = require('mongoose');

/**
 * Subscription — 정기결제(빌링) 구독 모델
 * 포트원 customer_uid(빌링키) 기반 자동 월 청구
 */
const subscriptionSchema = new mongoose.Schema({
  userId:          { type: String, required: true, unique: true }, // user email or id
  userName:        { type: String, default: '' },
  planId:          { type: String, enum: ['LITE', 'PRO', 'VVIP'], required: true },
  tier:            { type: String, required: true },
  amount:          { type: Number, required: true },            // 월 청구 금액(원)

  // 포트원 빌링키 정보
  customerUid:     { type: String, required: true },           // 포트원 customer_uid
  pgProvider:      { type: String, default: 'kakaopay' },      // 'kakaopay' | 'naverpay' | 'tosspayments'

  // 구독 상태
  status:          { type: String, enum: ['active', 'pending', 'failed', 'cancelled', 'paused'], default: 'active' },

  // 결제 일정
  startedAt:       { type: Date, default: Date.now },
  nextBillingDate: { type: Date },                             // 다음 결제일
  lastBilledAt:    { type: Date },                             // 마지막 성공 결제일
  billingDay:      { type: Number, default: 1 },               // 매월 몇 일에 청구 (1~28)

  // 실패 재시도
  failCount:       { type: Number, default: 0 },               // 연속 실패 횟수
  lastFailedAt:    { type: Date },
  lastFailReason:  { type: String },

  // 취소
  cancelledAt:     { type: Date },
  cancelReason:    { type: String },

  // VVIP 항구
  harborId:        { type: String, default: null },
});

subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ status: 1, nextBillingDate: 1 }); // 스케줄러 조회용

module.exports = mongoose.model('Subscription', subscriptionSchema);
