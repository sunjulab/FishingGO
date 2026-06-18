require('dotenv').config({ path: require('path').join(__dirname, 'server', '.env') });
const mongoose = require('mongoose');

const MONGO_URI = `mongodb+srv://fishinggo:${encodeURIComponent(process.env.MONGO_PASS)}@cluster0.cyqhznd.mongodb.net/fishinggo?appName=Cluster0`;

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
