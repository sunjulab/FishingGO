/**
 * 테스트 계정 티어 시드 스크립트
 * 사용: node server/seedTiers.js
 */
require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');

const buildMongoUri = () => {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  const pass = process.env.MONGO_PASS;
  const host = process.env.MONGO_HOST || 'cluster0.cyqhznd.mongodb.net';
  const user = process.env.MONGO_USER || 'fishinggo';
  const db   = process.env.MONGO_DB   || 'fishinggo';
  if (!pass) { console.error('MONGO_PASS 없음'); process.exit(1); }
  return `mongodb+srv://${user}:${encodeURIComponent(pass)}@${host}/${db}?appName=Cluster0`;
};

// 업데이트할 계정 목록
const TIER_UPDATES = [
  { email: 'sunjulab.k',  tier: 'MASTER'        },  // 마스터
  { email: 'sunjulab',    tier: 'BUSINESS_VIP'  },  // VIP
  { email: 'sunjulab.a1', tier: 'PRO'           },  // PRO
  { email: 'sunjulab.a2', tier: 'BUSINESS_LITE' },  // 라이트
];

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

async function run() {
  await mongoose.connect(buildMongoUri());
  console.log('✅ MongoDB 연결 완료');

  for (const { email, tier } of TIER_UPDATES) {
    const result = await User.updateOne({ email }, { $set: { tier } });
    if (result.matchedCount > 0) {
      console.log(`✅ ${email} → ${tier} (수정: ${result.modifiedCount})`);
    } else {
      console.log(`⚠️  ${email} 계정 없음 — MongoDB에 없습니다`);
    }
  }

  await mongoose.disconnect();
  console.log('✅ 완료');
}

run().catch(e => { console.error(e); process.exit(1); });
