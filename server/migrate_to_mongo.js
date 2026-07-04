/**
 * migrate_to_mongo.js
 * customPoints.json + spotLocationOverrides.json -> MongoDB 일괄 이전 스크립트
 * 실행: node server/migrate_to_mongo.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const fs       = require("fs");
const path     = require("path");

const MONGO_URI = process.env.MONGO_URI || (() => {
  const pass = process.env.MONGO_PASS;
  const host = process.env.MONGO_HOST || "cluster0.cyqhznd.mongodb.net";
  const user = process.env.MONGO_USER || "fishinggo";
  const db   = process.env.MONGO_DB   || "fishinggo";
  if (pass) return `mongodb+srv://${user}:${encodeURIComponent(pass)}@${host}/${db}?retryWrites=true&w=majority`;
  return null;
})();

if (!MONGO_URI) {
  console.error("MONGO_URI 또는 MONGO_PASS 환경변수가 없습니다.");
  process.exit(1);
}

const CustomPoint          = require("./models/CustomPoint");
const SpotLocationOverride = require("./models/SpotLocationOverride");

const CUSTOM_POINTS_FILE      = path.join(__dirname, "customPoints.json");
const SPOT_LOC_OVERRIDES_FILE = path.join(__dirname, "spotLocationOverrides.json");

async function migrate() {
  console.log("MongoDB 연결 중...");
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log("MongoDB 연결 완료\n");

  // 1. customPoints
  console.log("[1/2] customPoints.json -> MongoDB 이전 시작...");
  let cpSuccess = 0, cpSkip = 0, cpFail = 0;
  if (fs.existsSync(CUSTOM_POINTS_FILE)) {
    const raw = JSON.parse(fs.readFileSync(CUSTOM_POINTS_FILE, "utf8"));
    const entries = Object.values(raw);
    console.log("  JSON 파일에서 " + entries.length + "건 발견");
    for (const pt of entries) {
      if (!pt.id || !pt.name || !pt.type || pt.lat == null || pt.lng == null) {
        console.log("  SKIP (필수값 누락): " + JSON.stringify(pt));
        cpSkip++; continue;
      }
      try {
        await CustomPoint.findOneAndUpdate(
          { id: pt.id },
          { $set: {
            id: pt.id, name: pt.name, type: pt.type,
            region: pt.region || "미지정",
            lat: parseFloat(pt.lat), lng: parseFloat(pt.lng),
            fish: pt.fish || "미확인", score: pt.score || 80,
            status: pt.status || "보통", obsCode: pt.obsCode || null,
            aiDescription: pt.aiDescription || null,
            season: pt.season || null, recommend: pt.recommend || null,
            isCustom: true,
          }},
          { upsert: true, new: true }
        );
        console.log("  OK: " + pt.name + " (" + pt.id + ")");
        cpSuccess++;
      } catch (e) {
        console.error("  FAIL: " + pt.name + " - " + e.message);
        cpFail++;
      }
    }
  } else {
    console.log("  customPoints.json 없음 - 건너뜀");
  }
  console.log("\n  [customPoints] OK:" + cpSuccess + " SKIP:" + cpSkip + " FAIL:" + cpFail + "\n");

  // 2. spotLocationOverrides
  console.log("[2/2] spotLocationOverrides.json -> MongoDB 이전 시작...");
  let spSuccess = 0, spSkip = 0, spFail = 0;
  if (fs.existsSync(SPOT_LOC_OVERRIDES_FILE)) {
    const raw = JSON.parse(fs.readFileSync(SPOT_LOC_OVERRIDES_FILE, "utf8"));
    const entries = Object.entries(raw);
    console.log("  JSON 파일에서 " + entries.length + "건 발견");
    for (const [id, data] of entries) {
      if (!id) { spSkip++; continue; }
      try {
        await SpotLocationOverride.findOneAndUpdate(
          { id: String(id) },
          { $set: {
            id: String(id),
            lat: data.lat != null ? parseFloat(data.lat) : 0,
            lng: data.lng != null ? parseFloat(data.lng) : 0,
            name: data.name || null, type: data.type || null,
            targets: data.targets || [], isDeleted: data.isDeleted || false,
          }},
          { upsert: true, new: true }
        );
        console.log("  OK: id=" + id + " (" + (data.name || "이름없음") + ")");
        spSuccess++;
      } catch (e) {
        console.error("  FAIL: id=" + id + " - " + e.message);
        spFail++;
      }
    }
  } else {
    console.log("  spotLocationOverrides.json 없음 - 건너뜀");
  }
  console.log("\n  [spotLocationOverrides] OK:" + spSuccess + " SKIP:" + spSkip + " FAIL:" + spFail + "\n");

  console.log("전체 마이그레이션 완료! 서버 재시작 후 MongoDB에서 자동 로드됩니다.");
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(err => {
  console.error("마이그레이션 실패:", err.message);
  process.exit(1);
});
