const mongoose = require('mongoose');

// 앱 강제 업데이트 설정 영구 저장 (Render 재배포 후에도 유지)
const appConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // 기본 키 'global_config'
  min_version: { type: String, default: '1.0.0' },
  store_url: { type: String, default: 'https://play.google.com/apps/internaltest/4701312289208373704' }
}, { timestamps: true });

module.exports = mongoose.model('AppConfig', appConfigSchema);
