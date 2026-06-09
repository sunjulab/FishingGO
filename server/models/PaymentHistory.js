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
  imp_uid:      { type: String, trim: true },
  merchant_uid: { type: String, trim: true, unique: true, sparse: true }, // ✅ 10TH-C3: sparse 의도적 — 테스트모드(null)는 중복 허용, 실결제시에만 unique 강제
  failReason:   { type: String, trim: true },
  refundedAt:   { type: Date },
}, { timestamps: true }); // ✅ TECH-DEBT: 수동 createdAt 제거 — Mongoose timestamps 자동 관리

paymentHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentHistory', paymentHistorySchema);
