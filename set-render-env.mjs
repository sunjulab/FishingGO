/**
 * set-render-env.mjs
 * Render API를 이용해 fishing-go-backend 서비스의 환경변수를 자동으로 설정합니다.
 *
 * 사용법:
 *   1. Render 대시보드 → Account Settings → API Keys → Create API Key
 *   2. node set-render-env.mjs --token=rnd_xxxxx
 *      또는 RENDER_API_KEY=rnd_xxxxx node set-render-env.mjs
 *
 * 동작:
 *   - 로컬 server/.env 에서 FIREBASE_SERVICE_ACCOUNT, GEMINI_API_KEY 등 값을 읽음
 *   - Render API로 fishing-go-backend 서비스를 찾아 환경변수 자동 설정
 *   - 기존 값이 있으면 업데이트, 없으면 추가
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── 1. CLI 인자 파싱 ─────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=')]; })
);

const RENDER_API_KEY = args.token || process.env.RENDER_API_KEY;
if (!RENDER_API_KEY) {
  console.error('❌ Render API Key 필요!\n사용법: node set-render-env.mjs --token=rnd_xxxxx\n또는: RENDER_API_KEY=rnd_xxxxx node set-render-env.mjs');
  process.exit(1);
}

// ── 2. 로컬 .env 파싱 ────────────────────────────────────────────────────────
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf-8');
  const result = {};
  let i = 0;
  const lines = raw.split(/\r?\n/);
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) { i++; continue; }
    const eqIdx = line.indexOf('=');
    if (eqIdx < 0) { i++; continue; }
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    // 멀티라인 큰따옴표 처리
    if (val.startsWith('"')) {
      val = val.slice(1);
      while (!val.endsWith('"') && i + 1 < lines.length) {
        i++;
        val += '\n' + lines[i];
      }
      if (val.endsWith('"')) val = val.slice(0, -1);
      // 이스케이프 해제
      val = val.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
    }
    result[key] = val;
    i++;
  }
  return result;
}

const envPath = path.join(__dirname, 'server', '.env');
const localEnv = parseEnvFile(envPath);

// ── 3. Render에 설정할 환경변수 목록 ─────────────────────────────────────────
// 로컬 .env에서 읽어서 Render에 동기화할 키 목록
const SYNC_KEYS = [
  'FIREBASE_SERVICE_ACCOUNT',  // ✅ FCM 필수
  'GEMINI_API_KEY',             // AI 가이드 (선택)
  'JWT_SECRET',
  'MONGO_PASS',
  'PORTONE_API_KEY',
  'PORTONE_API_SECRET',
  'SMS_API_KEY',
  'SMS_API_SECRET',
  'SMS_SENDER',
  'KHOA_KEY',
  'KHOA_CCTV_KEY',
  'YOUTUBE_API_KEY',
];

const toSet = SYNC_KEYS
  .filter(k => localEnv[k] && localEnv[k].trim())
  .map(k => ({ key: k, value: localEnv[k] }));

if (!toSet.length) {
  console.error('❌ 동기화할 환경변수가 없습니다. server/.env 확인 필요');
  process.exit(1);
}

console.log(`\n📦 동기화할 환경변수 ${toSet.length}개:`);
toSet.forEach(({ key, value }) => {
  const preview = value.length > 40 ? value.slice(0, 40) + '...' : value;
  console.log(`   ${key.padEnd(32)} = ${preview}`);
});

// ── 4. Render API 헬퍼 ───────────────────────────────────────────────────────
const BASE = 'https://api.render.com/v1';
const headers = {
  'Authorization': `Bearer ${RENDER_API_KEY}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

async function renderGet(path) {
  const res = await fetch(`${BASE}${path}`, { headers });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Render API ${path} → ${res.status}: ${txt.slice(0, 200)}`);
  }
  return res.json();
}

async function renderPut(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT', headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Render API PUT ${path} → ${res.status}: ${txt.slice(0, 200)}`);
  }
  return res.json();
}

// ── 5. 서비스 ID 조회 ────────────────────────────────────────────────────────
async function findService(nameSubstr) {
  console.log(`\n🔍 Render 서비스 검색 중: "${nameSubstr}"...`);
  const data = await renderGet('/services?limit=100');
  // data는 배열 또는 { services: [] } 형태
  const list = Array.isArray(data) ? data : (data.services || []);
  const match = list.find(s => {
    const name = s.service?.name || s.name || '';
    return name.toLowerCase().includes(nameSubstr.toLowerCase());
  });
  if (!match) {
    console.log('\n모든 서비스:');
    list.forEach(s => console.log('  -', s.service?.name || s.name || JSON.stringify(s).slice(0, 80)));
    throw new Error(`"${nameSubstr}" 서비스를 찾을 수 없습니다.`);
  }
  const svc = match.service || match;
  console.log(`✅ 서비스 발견: ${svc.name} (ID: ${svc.id})`);
  return svc.id;
}

// ── 6. 환경변수 설정 ─────────────────────────────────────────────────────────
async function setEnvVars(serviceId, vars) {
  console.log(`\n⚙️  환경변수 설정 중... (서비스: ${serviceId})`);

  // 기존 env vars 조회
  const existing = await renderGet(`/services/${serviceId}/env-vars`);
  const existingList = Array.isArray(existing) ? existing : (existing.envVars || []);
  // 기존 env 중 빈 값 제외 (Render API가 value=""는 400 반환)
  const existingMap = Object.fromEntries(
    existingList
      .filter(e => e.key && e.value && e.value.trim() !== '')
      .map(e => [e.key, e.value])
  );

  // 기존 + 새로운 값 병합 (기존 유지 + 업데이트)
  const merged = { ...existingMap };
  vars.forEach(({ key, value }) => { merged[key] = value; });

  // 최종 전송 전 빈 값 한번 더 제거
  const body = Object.entries(merged)
    .filter(([, value]) => value && value.trim() !== '')
    .map(([key, value]) => ({ key, value }));

  await renderPut(`/services/${serviceId}/env-vars`, body);
  console.log(`✅ ${vars.length}개 환경변수 설정 완료!`);
  vars.forEach(({ key }) => {
    const wasExisting = existingMap.hasOwnProperty(key);
    console.log(`   ${wasExisting ? '🔄 업데이트' : '➕ 신규추가'}: ${key}`);
  });
}

// ── 7. 실행 ──────────────────────────────────────────────────────────────────
(async () => {
  try {
    const serviceId = await findService('fishing-go-backend');
    await setEnvVars(serviceId, toSet);
    console.log('\n🎉 완료! Render 서비스가 자동 재배포됩니다.');
    console.log('   FCM 푸시 알림이 이제 실제 기기로 전송됩니다.\n');
  } catch (e) {
    console.error('\n❌ 오류:', e.message);
    process.exit(1);
  }
})();
