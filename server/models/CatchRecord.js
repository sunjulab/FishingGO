const mongoose = require('mongoose');
const CatchRecordSchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  userName:  { type: String },
  userAvatar:{ type: String },
  fishName:  { type: String, required: true },   // 어종
  fishSize:  { type: Number },                    // cm
  fishWeight:{ type: Number },                    // kg
  imageUrl:  { type: String },                    // 사진 URL
  location:  { type: String },                    // 장소명
  lat:       { type: Number },
  lng:       { type: Number },
  memo:      { type: String },
  weather:   { type: String },
  tide:      { type: String },
  likes:     { type: [String], default: [] },
  contestId: { type: String },                    // 대회 참가 시
  verified:  { type: Boolean, default: false },   // AI 인증 여부
  aiConfidence: { type: Number },                 // AI 신뢰도 %
}, { timestamps: true });
module.exports = mongoose.model('CatchRecord', CatchRecordSchema);
