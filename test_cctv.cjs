const { CCTV_MAP } = require('./server/cctvMapping');
const http = require('http');

async function testAll() {
  console.log('--- 전수조사 시작 ---');
  let total = 0;
  let alive = 0;
  let dead = 0;
  
  for (const [obsCode, info] of Object.entries(CCTV_MAP)) {
    if (info.type === 'mof' && info.beachCode != null) {
      total++;
      const url = `http://220.95.232.18/camera/${info.beachCode}_0.jpg`;
      try {
        const statusCode = await new Promise((resolve) => {
          const req = http.get(url, (res) => {
            resolve(res.statusCode);
          });
          req.on('error', () => resolve('ERROR'));
          req.setTimeout(5000, () => {
            req.destroy();
            resolve('TIMEOUT');
          });
        });
        
        if (statusCode === 200) {
          console.log(`[OK] ${obsCode} (${info.areaName}, beachCode: ${info.beachCode})`);
          alive++;
        } else {
          console.log(`[FAIL] ${obsCode} (${info.areaName}, beachCode: ${info.beachCode}) - Status: ${statusCode}`);
          dead++;
        }
      } catch (e) {
        console.log(`[FAIL] ${obsCode} (${info.areaName}, beachCode: ${info.beachCode}) - Error: ${e.message}`);
        dead++;
      }
    }
  }
  
  console.log(`\n--- 전수조사 결과 ---`);
  console.log(`총 ${total}개 검사 중 정상 ${alive}개, 실패 ${dead}개`);
}

testAll();
