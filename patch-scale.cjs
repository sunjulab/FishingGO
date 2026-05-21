// patch-scale.cjs — 서버 확장 설정 일괄 적용
const fs = require('fs');

// ── 1. package.json start 스크립트: cluster.js 사용 ──────────────
const pkgPath = 'server/package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.scripts.start = 'node --max-old-space-size=1024 cluster.js';
pkg.scripts['start:single'] = 'node --max-old-space-size=512 index.js';
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
console.log('✅ 1. package.json start → cluster.js 변경 완료');

// ── 2. server/index.js: MongoDB 풀 크기 증가 ──────────────────────
let c = fs.readFileSync('server/index.js', 'utf8');
const hasCRLF = c.includes('\r\n');
let text = c.replace(/\r\n/g, '\n');

// MongoDB 커넥션 풀 5(기본) → 100
const OLD_MONGO = `  mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    family: 4, // IPv4 강제 (DNS SRV 에러 방지용)
    heartbeatFrequencyMS: 10000, // 10초마다 heartbeat
  })`;

const NEW_MONGO = `  mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    family: 4,                  // IPv4 강제 (DNS SRV 에러 방지용)
    heartbeatFrequencyMS: 10000,// 10초마다 heartbeat
    // ✅ SCALE: 커넥션 풀 증가 (기본 5 → 100) — 동시 1만 사용자 DB 쿼리 처리
    maxPoolSize: 100,
    minPoolSize: 10,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    waitQueueTimeoutMS: 30000,  // 풀 대기 최대 30초
  })`;

if (!text.includes('    serverSelectionTimeoutMS: 10000,\n    family: 4,')) {
  console.error('❌ MongoDB connect 패턴 없음');
  process.exit(1);
}
text = text.replace(OLD_MONGO, NEW_MONGO);
console.log('✅ 2. MongoDB 커넥션 풀 100으로 증가 완료');

// ── 3. HTTP Keep-Alive + 서버 타임아웃 최적화 ──────────────────────
// 서버 시작 listen 부분 찾아서 Keep-Alive 추가
const OLD_LISTEN = `server.listen(PORT,`;
if (text.includes(OLD_LISTEN)) {
  text = text.replace(
    /server\.listen\(PORT,([^;]+);/,
    (match) => {
      return match + `\n// ✅ SCALE: Keep-Alive 최적화 — 연결 재사용으로 핸드셰이크 비용 절감\nserver.keepAliveTimeout = 65000;  // 65초 (로드밸런서 60초보다 길게)\nserver.headersTimeout = 66000;    // keepAlive보다 1초 더 길게`;
    }
  );
  console.log('✅ 3. HTTP Keep-Alive 최적화 완료');
} else {
  console.log('⚠️ 3. Keep-Alive: listen 패턴 다름 — 수동 추가 필요');
}

// ── 4. 자주 조회되는 API 응답 캐싱 (메모리 캐시) ──────────────────
// 기존 캐시 변수 확인
if (!text.includes('responseCache')) {
  // Rate Limiter 섹션 앞에 캐시 미들웨어 추가
  const CACHE_INSERT_AFTER = `app.use(express.urlencoded({ limit: '25mb', extended: true }));`;
  if (text.includes(CACHE_INSERT_AFTER)) {
    text = text.replace(
      CACHE_INSERT_AFTER,
      `${CACHE_INSERT_AFTER}

// ✅ SCALE: API 응답 캐시 (메모리) — 날씨/물때/포인트 등 자주 변하지 않는 데이터
const responseCache = new Map();
const CACHE_TTL = {
  weather: 5 * 60 * 1000,   // 날씨: 5분
  tide:    10 * 60 * 1000,  // 물때: 10분
  default: 2 * 60 * 1000,   // 기본: 2분
};
function getCached(key, type = 'default') {
  const item = responseCache.get(key);
  if (!item) return null;
  if (Date.now() - item.ts > (CACHE_TTL[type] || CACHE_TTL.default)) {
    responseCache.delete(key);
    return null;
  }
  return item.data;
}
function setCache(key, data) {
  if (responseCache.size > 1000) {
    // 가장 오래된 항목 200개 삭제
    const keys = [...responseCache.keys()].slice(0, 200);
    keys.forEach(k => responseCache.delete(k));
  }
  responseCache.set(key, { data, ts: Date.now() });
}
// 주기적 캐시 정리 (10분마다)
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of responseCache.entries()) {
    if (now - v.ts > 15 * 60 * 1000) responseCache.delete(k);
  }
}, 10 * 60 * 1000);`
    );
    console.log('✅ 4. 응답 캐시 시스템 추가 완료');
  } else {
    console.log('⚠️ 4. 캐시: 삽입 위치 다름');
  }
} else {
  console.log('ℹ️  4. responseCache 이미 존재');
}

if (hasCRLF) text = text.replace(/\n/g, '\r\n');
fs.writeFileSync('server/index.js', text, 'utf8');
console.log('\n🎉 모든 확장 설정 적용 완료!');
console.log('   - cluster.js: 멀티코어 클러스터링');
console.log('   - MongoDB 풀: 5 → 100');
console.log('   - Keep-Alive: 65초');
console.log('   - 응답 캐시: 메모리 TTL 캐시');
