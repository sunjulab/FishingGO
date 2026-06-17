const mongoose = require('mongoose');

// 마스터가 수정한 낚시 포인트 좌표 영구 저장 (Render 재배포 후에도 유지)
const spotLocationOverrideSchema = new mongoose.Schema({
  id:        { type: String, required: true, unique: true },
  lat:       { type: Number, required: true },
  lng:       { type: Number, required: true },
  name:      { type: String, default: null },
  type:      { type: String, default: null },
  targets:   { type: [String], default: [] },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('SpotLocationOverride', spotLocationOverrideSchema);
