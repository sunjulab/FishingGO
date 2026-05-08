/**
 * 크루 limit 일괄 마이그레이션 스크립트
 * 실행: node migrate_crew_limit.js
 * MongoDB에 직접 연결하여 limit <= 100 인 크루를 1000으로 업데이트합니다.
 */

// ✅ DNS 강제 설정 (index.js와 동일 — 통신사 DNS의 SRV 차단 우회)
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) { console.warn('DNS 설정 실패:', e.message); }

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');

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

const crewSchema = new mongoose.Schema({
  name:       String,
  members:    Number,
  limit:      Number,
  owner:      String,
  ownerName:  String,
  isPrivate:  Boolean,
  createdAt:  Date,
}, { strict: false });

async function run() {
  console.log('MongoDB 연결 중...');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000, family: 4 });
  console.log('✅ MongoDB 연결 성공');

  const Crew = mongoose.model('Crew', crewSchema);

  // 현재 상태 조회
  const allCrews = await Crew.find({}, 'name members limit').lean();
  console.log('\n📋 현재 크루 목록:');
  allCrews.forEach(c => {
    console.log(`  - ${c.name}: 현재인원 ${c.members ?? 1}, 정원 ${c.limit ?? '미설정'}`);
  });

  // limit <= 100 또는 미설정인 크루 업데이트
  const result = await Crew.updateMany(
    { $or: [{ limit: { $lte: 100 } }, { limit: { $exists: false } }, { limit: null }] },
    { $set: { limit: 1000 } }
  );

  console.log(`\n✅ 마이그레이션 완료: ${result.modifiedCount}개 크루의 정원을 1000명으로 업데이트했습니다.`);

  // 결과 확인
  const updatedCrews = await Crew.find({}, 'name members limit').lean();
  console.log('\n📋 업데이트 후 크루 목록:');
  updatedCrews.forEach(c => {
    console.log(`  - ${c.name}: 현재인원 ${c.members ?? 1}, 정원 ${c.limit}`);
  });

  await mongoose.disconnect();
  console.log('\n✅ 마이그레이션 완료. MongoDB 연결 종료.');
}

run().catch(err => {
  console.error('❌ 마이그레이션 실패:', err.message);
  process.exit(1);
});
