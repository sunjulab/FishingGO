const mongoose = require('mongoose');
const ContestSchema = new mongoose.Schema({
  title:      { type: String, trim: true, required: true },   // 대회명
  fishName:   { type: String, trim: true, required: true },   // 대상 어종
  region:     { type: String, trim: true, default: '전국' },  // 지역 제한
  metric:     { type: String, trim: true, enum: ['size','weight'], default: 'size' }, // 측정 기준
  startDate:  { type: Date, required: true },
  endDate:    { type: Date, required: true },
  description:{ type: String, trim: true },
  prize:      { type: String, trim: true },
  active:     { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.model('Contest', ContestSchema);
