const mongoose = require('mongoose');

// 마스터가 수정한 비밀포인트 좌표 영구 저장 (Render 재배포 후에도 유지)
const secretPointOverrideSchema = new mongoose.Schema({
  id:  { type: String, required: true, unique: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('SecretPointOverride', secretPointOverrideSchema);
