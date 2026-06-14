const mongoose = require('mongoose');

/**
 * Subscription ???뺢린寃곗젣(鍮뚮쭅) 援щ룆 紐⑤뜽
 * ?ы듃??customer_uid(鍮뚮쭅?? 湲곕컲 ?먮룞 ??泥?뎄
 */
const subscriptionSchema = new mongoose.Schema({
  userId:          { type: String, trim: true, required: true, unique: true }, // user email or id
  userName:        { type: String, trim: true, default: '' },
  planId:          { type: String, trim: true, enum: ['LITE', 'BUSINESS_LITE', 'PRO', 'VVIP', 'BUSINESS_VIP'], required: true }, // ??27TH-B1: BUSINESS_LITE 異붽? ??25TH-C4 payment.js PLAN_LABEL ?숆린??(?꾨씫 ??ValidationError 諛쒖깮)
  tier:            { type: String, trim: true, required: true },
  amount:          { type: Number, required: true },            // ??泥?뎄 湲덉븸(??
  isTest:          { type: Boolean, default: false },           // 테스트 결제 여부

  // ?ы듃??鍮뚮쭅???뺣낫
  customerUid:     { type: String, trim: true, required: true },           // ?ы듃??customer_uid
  pgProvider:      { type: String, trim: true, default: 'kakaopay' },      // 'kakaopay' | 'naverpay' | 'tosspayments'

  // 援щ룆 ?곹깭
  status:          { type: String, trim: true, enum: ['active', 'pending', 'failed', 'cancelled', 'paused'], default: 'active' },

  // 寃곗젣 ?쇱젙
  startedAt:       { type: Date, default: Date.now },
  nextBillingDate: { type: Date },                             // ?ㅼ쓬 寃곗젣??
  lastBilledAt:    { type: Date },                             // 留덉?留??깃났 寃곗젣??
  billingDay:      { type: Number, default: 1 },               // 留ㅼ썡 紐??쇱뿉 泥?뎄 (1~28)

  // ?ㅽ뙣 ?ъ떆??
  failCount:       { type: Number, default: 0 },               // ?곗냽 ?ㅽ뙣 ?잛닔
  lastFailedAt:    { type: Date },
  lastFailReason:  { type: String, trim: true },

  // 痍⑥냼
  cancelledAt:     { type: Date },
  cancelReason:    { type: String, trim: true },

  // VVIP ??뎄
  harborId:        { type: String, trim: true, default: null },
});

subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ status: 1, nextBillingDate: 1 }); // ?ㅼ?以꾨윭 議고쉶??

module.exports = mongoose.model('Subscription', subscriptionSchema);
