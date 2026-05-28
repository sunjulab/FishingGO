/**
 * 낚시 포인트 좌표 검증 스크립트
 * Nominatim(OpenStreetMap) 역지오코딩으로 좌표 → 행정구역 확인
 * 기대 지역과 불일치 시 "의심" 플래그
 */
import { ALL_FISHING_POINTS, SECRET_FISHING_POINTS } from '../src/constants/fishingData.js';
import { FRESHWATER_FISHING_POINTS } from '../src/constants/freshwaterData.js';
import https from 'https';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// 기대 지역 키워드 매핑
const REGION_KEYWORDS = {
  '강원': ['Gangwon', 'Gangneung', 'Sokcho', 'Donghae', 'Samcheok', 'Goseong', 'Yangyang', 'Taebaek', 'Wonju', 'Inje', 'Hwacheon', 'Chuncheon'],
  '경북': ['Gyeongbuk', 'Gyeongsangbuk', 'Pohang', 'Uljin', 'Ulchin', 'Yeongdeok', 'Gyeongju', 'Andong', 'Gumi', 'Sangju'],
  '경남': ['Gyeongnam', 'Gyeongsangnam', 'Geoje', 'Tongyeong', 'Sacheon', 'Namhae', 'Hadong', 'Changwon', 'Jinju', 'Goeje'],
  '전남': ['Jeollanam', 'Yeosu', 'Wando', 'Mokpo', 'Goheung', 'Boseong', 'Jindo', 'Sinan', 'Gangjin', 'Haenam', 'Hwasun'],
  '전북': ['Jeollabuk', 'Gunsan', 'Buan', 'Wido', 'Gochang', 'Iksan'],
  '충남': ['Chungnam', 'Chungcheongnam', 'Boryeong', 'Seocheon', 'Taean', 'Dangjin', 'Seosan', 'Hongseong'],
  '충북': ['Chungbuk', 'Chungcheongbuk', 'Cheongju', 'Chungju', 'Danyang', 'Jecheon', 'Goesan', 'Jeungpyeong'],
  '인천': ['Incheon', 'Ongjin', 'Ganghwa'],
  '부산': ['Busan', 'Yeongdo', 'Gijang', 'Saha', 'Seo-gu'],
  '울산': ['Ulsan', 'Ulju'],
  '제주': ['Jeju', 'Seogwipo', 'Jeju-si'],
  '서울': ['Seoul'],
  '경기': ['Gyeonggi', 'Gapyeong', 'Yangpyeong', 'Yangju', 'Pocheon', 'Gapyeong', 'Paju', 'Gimpo', 'Ansan', 'Siheung'],
  '강원내륙': ['Gangwon', 'Inje', 'Hwacheon', 'Yanggu', 'Chuncheon', 'Wonju', 'Hoengseong'],
  '경북내륙': ['Gyeongbuk', 'Andong', 'Mungyeong', 'Sangju', 'Uiseong'],
  '경남내륙': ['Gyeongnam', 'Hapcheon', 'Changwon', 'Jinju', 'Miryang', 'Hamyang'],
  '전북내륙': ['Jeollabuk', 'Imsil', 'Jinan', 'Muju', 'Jangsu'],
  '전남내륙': ['Jeollanam', 'Gurye', 'Gokseong', 'Damyang', 'Jangseong'],
};


function reverseGeocode(lat, lng) {
  return new Promise((resolve) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`;
    const options = {
      headers: { 'User-Agent': 'FishingGO-Coord-Verifier/1.0' }
    };
    const req = https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(10000, () => { req.destroy(); resolve(null); });
  });
}

function checkRegionMatch(result, expectedRegion) {
  if (!result || !result.address) return { match: false, found: 'API 오류' };
  
  const addrStr = JSON.stringify(result.address).toLowerCase();
  const dispName = result.display_name || '';
  const combined = (addrStr + dispName).toLowerCase();
  
  const keywords = REGION_KEYWORDS[expectedRegion] || [];
  const matched = keywords.some(k => combined.includes(k.toLowerCase()));
  
  // 실제 위치 요약
  const addr = result.address;
  const found = [
    addr.city || addr.county || addr.state_district || addr.state,
    addr.state
  ].filter(Boolean).join(', ');
  
  return { match: matched, found };
}

async function verifyPoints(points, label) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${label} (${points.length}개)`);
  console.log('='.repeat(60));
  
  const issues = [];
  
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    await sleep(1200); // Nominatim rate limit: 1req/sec
    
    const result = await reverseGeocode(p.lat, p.lng);
    const { match, found } = checkRegionMatch(result, p.region);
    
    const status = match ? '✅' : '⚠️ ';
    const msg = `${status} [${p.region}] ${p.name} (${p.lat}, ${p.lng}) → ${found}`;
    console.log(`[${i+1}/${points.length}] ${msg}`);
    
    if (!match) {
      issues.push({ ...p, foundLocation: found });
    }
  }
  
  return issues;
}

(async () => {
  console.log('🗺️  낚시 포인트 좌표 자동 검증 시작...\n');
  
  const SEA_ONLY = ALL_FISHING_POINTS.filter(p => !FRESHWATER_FISHING_POINTS.find(f => f.id === p.id));
  
  // 나머지 해수 포인트 (31~끝)
  const seaIssues2 = await verifyPoints(SEA_ONLY.slice(30), `해수 포인트 (31~${SEA_ONLY.length})`);
  
  // 비밀 포인트 전체
  const secretIssues = await verifyPoints(SECRET_FISHING_POINTS, '비밀 포인트');

  const allIssues = [...seaIssues2, ...secretIssues];
  
  console.log('\n\n' + '='.repeat(60));
  console.log('⚠️  의심 좌표 최종 목록:');
  console.log('='.repeat(60));
  
  if (allIssues.length === 0) {
    console.log('✅ 모든 좌표 정확합니다!');
  } else {
    allIssues.forEach(p => {
      console.log(`  ID:${p.id} ${p.name}`);
      console.log(`    기대: ${p.region} | 실제: ${p.foundLocation}`);
      console.log(`    좌표: (${p.lat}, ${p.lng})`);
      console.log('');
    });
  }
  
  const total = SEA_ONLY.slice(30).length + SECRET_FISHING_POINTS.length;
  console.log(`\n총 검사: ${total}개 | 의심: ${allIssues.length}개`);
})();

