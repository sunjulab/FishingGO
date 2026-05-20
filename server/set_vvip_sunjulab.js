/**
 * set_vvip_sunjulab.js
 * sunjulab 계정의 VVIP 상태를 MongoDB에 직접 설정
 * 실행: node set_vvip_sunjulab.js
 */

// ✅ DNS 강제 설정 (index.js와 동일)
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) {}

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');

// migrate_crew_limit.js와 동일한 buildMongoUri 사용
const buildMongoUri = () => {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  const pass = process.env.MONGO_PASS;
  const host = process.env.MONGO_HOST || 'cluster0.cyqhznd.mongodb.net';
  const user = process.env.MONGO_USER || 'fishinggo';
  const db   = process.env.MONGO_DB   || 'fishinggo';
  if (pass) {
    const enc = encodeURIComponent(pass);
    return `mongodb+srv://${user}:${enc}@${host}/${db}?appName=Cluster0`;
  }
  return '';
};

const MONGO_URI = buildMongoUri();
if (!MONGO_URI) {
  console.error('❌ MONGO_URI 또는 MONGO_PASS 환경변수가 없습니다. .env 파일을 확인하세요.');
  process.exit(1);
}

const userSchema = new mongoose.Schema({}, { strict: false });

async function run() {
  console.log('MongoDB 연결 중...');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000, family: 4 });
  console.log('✅ MongoDB 연결 성공');

  const User = mongoose.model('User', userSchema);

  // 현재 상태 확인
  const before = await User.findOne(
    { $or: [{ email: 'sunjulab' }, { name: 'sunjulab' }] }
  ).lean();

  if (!before) {
    console.log('❌ sunjulab 계정을 찾을 수 없습니다. (email 또는 name = "sunjulab")');
    await mongoose.disconnect();
    return;
  }

  console.log('\n📋 현재 상태:');
  console.log(`  email       : ${before.email}`);
  console.log(`  name        : ${before.name}`);
  console.log(`  tier        : ${before.tier}`);
  console.log(`  vvipHarborId: ${before.vvipHarborId || '(없음)'}`);
  console.log(`  vvipExpiresAt: ${before.vvipExpiresAt || '(없음)'}`);

  // 30일 후 만료
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const result = await User.findOneAndUpdate(
    { $or: [{ email: 'sunjulab' }, { name: 'sunjulab' }] },
    {
      $set: {
        tier: 'BUSINESS_VIP',
        vvipHarborId: 'gangneung',
        vvipExpiresAt: expiresAt,
      }
    },
    { new: true }
  ).lean();

  if (result) {
    console.log('\n✅ MongoDB 업데이트 성공:');
    console.log(`  tier        : ${result.tier}`);
    console.log(`  vvipHarborId: ${result.vvipHarborId}`);
    console.log(`  vvipExpiresAt: ${result.vvipExpiresAt}`);
    console.log(`  만료일       : ${expiresAt.toLocaleDateString('ko-KR')}`);
    console.log('\n→ 다음 단계: Render 서버 Manual Deploy 후 sunjulab 재로그인');
  } else {
    console.log('❌ 업데이트 실패');
  }

  await mongoose.disconnect();
}

run().catch(e => {
  console.error('오류:', e.message);
  process.exit(1);
});
