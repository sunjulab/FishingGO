const mongoose = require('mongoose');
const CatchRecordSchema = new mongoose.Schema({
  userId:    { type: String, trim: true, required: true },
  userName:  { type: String, trim: true },
  userAvatar:{ type: String, trim: true },
  fishName:  { type: String, trim: true, required: true },   // 어종
  fishSize:  { type: Number },                    // cm
  fishWeight:{ type: Number },                    // kg
  imageUrl:  { type: String, trim: true },                    // 사진 URL
  location:  { type: String, trim: true },                    // 장소명
  lat:       { type: Number },
  lng:       { type: Number },
  memo:      { type: String, trim: true },
  weather:   { type: String, trim: true },
  tide:      { type: String, trim: true },
  likes:     { type: [String], default: [] },
  contestId: { type: String, trim: true },                    // 대회 참가 시
  verified:  { type: Boolean, default: false },   // AI 인증 여부
  aiConfidence: { type: Number },                 // AI 신뢰도 %
}, { timestamps: true });
module.exports = mongoose.model('CatchRecord', CatchRecordSchema);
