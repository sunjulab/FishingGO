// render-set-env.cjs — Render.com API로 환경변수 자동 설정
const https = require('https');
const fs = require('fs');

const RENDER_API_KEY = 'rnd_G35wIPYtAt0y59ficIJKoC0Ftz4b';
const SERVICE_ID = 'srv-d7cjb3v7f7vs739h54r0'; // web 서버

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.render.com',
      path,
      method,
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // 1. 현재 환경변수 목록 조회
  console.log('📋 현재 환경변수 조회 중...');
  const listRes = await request('GET', `/v1/services/${SERVICE_ID}/env-vars`);
  if (listRes.status !== 200) {
    console.error('❌ 조회 실패:', listRes.status, JSON.stringify(listRes.body));
    process.exit(1);
  }

  const existingVars = listRes.body.map(item => ({
    key: item.envVar.key,
    value: item.envVar.value,
  }));
  console.log(`✅ 기존 환경변수 ${existingVars.length}개 확인`);

  // 2. Firebase 서비스 계정 읽기
  const serviceAccount = fs.readFileSync(
    './android/app/fishing-go-28dfe-firebase-adminsdk-fbsvc-c8ede27ec2.json',
    'utf8'
  );
  const serviceAccountMinified = JSON.stringify(JSON.parse(serviceAccount));

  // 3. FIREBASE_SERVICE_ACCOUNT 추가 (기존 값 대체)
  const newVars = existingVars.filter(v => v.key !== 'FIREBASE_SERVICE_ACCOUNT');
  newVars.push({ key: 'FIREBASE_SERVICE_ACCOUNT', value: serviceAccountMinified });

  console.log(`🔧 환경변수 ${newVars.length}개 업데이트 중...`);

  // 4. PUT으로 전체 업데이트
  const putRes = await request('PUT', `/v1/services/${SERVICE_ID}/env-vars`, newVars);
  if (putRes.status === 200 || putRes.status === 204) {
    console.log('✅ FIREBASE_SERVICE_ACCOUNT 설정 완료!');
    console.log('🔄 Render 서버 자동 재시작 중...');
  } else {
    console.error('❌ 설정 실패:', putRes.status, JSON.stringify(putRes.body).slice(0, 200));
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
