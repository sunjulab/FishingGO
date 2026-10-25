require('dotenv').config({ path: require('path').join(__dirname, 'server', '.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI; // ✅ SEC: DB 비밀번호 하드코딩 제거 — server/.env의 MONGO_URI 사용
if (!MONGO_URI) { console.error('MONGO_URI 환경변수가 없습니다.'); process.exit(1); }

async function fixDB() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');
  const CctvOverride = require('./server/models/CctvOverride');
  
  const overrides = await CctvOverride.find({ type: 'mof_custom' });
  console.log('Found mof_custom overrides:', overrides);
  
  for (const doc of overrides) {
    if (doc.youtubeId.startsWith('http://220')) {
      const fullUrl = `https://coast.mof.go.kr/serviceGateway.jsp?http://10.176.62.134:9001/tilemapApi.do?url=${doc.youtubeId}`;
      console.log(`Updating ${doc.obsCode} to ${fullUrl}`);
      doc.youtubeId = fullUrl;
      await doc.save();
    }
  }
  
  console.log('Done');
  process.exit(0);
}

fixDB().catch(console.error);
