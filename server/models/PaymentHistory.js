const mongoose = require('mongoose');

/**
 * PaymentHistory — 결제 내역 이력 모델
 * 성공/실패 모든 결제 기록 보관
 */
const paymentHistorySchema = new mongoose.Schema({
  userId:       { type: String, required: true },
  userName:     { type: String },
  planId:       { type: String },
  pgProvider:   { type: String },           // kakaopay, naverpay, tosspayments
  paymentType:  { type: String, enum: ['one_time', 'billing_first', 'billing_auto'], default: 'one_time' },
  amount:       { type: Number, required: true },
  status:       { type: String, enum: ['paid', 'failed', 'refunded', 'cancelled'], default: 'paid' },
  imp_uid:      { type: String },
  merchant_uid: { type: String, unique: true, sparse: true },
  failReason:   { type: String },
  refundedAt:   { type: Date },
  createdAt:    { type: Date, default: Date.now },
});

paymentHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentHistory', paymentHistorySchema);
