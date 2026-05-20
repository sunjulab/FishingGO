/**
 * 선상배 홍보 테스트 게시글 시드 스크립트
 * 각 항구마다 낚시Go 테스트 1호, 2호 2개씩 생성 (총 36개 항구 × 2 = 72개)
 */

const http = require('http');
const jwt  = require('jsonwebtoken');

// ── 설정 ────────────────────────────────────────────────
const SERVER = 'localhost';
const PORT   = 5000;
const JWT_SECRET = 'FishingGO_2024_Pr0d_S3cr3t!@#$xK9mQ';
const ADMIN_EMAIL = 'sunjulab.k@gmail.com';
const ADMIN_NAME  = '낚시GO 관리자';

// 어드민 JWT 생성 (tier: MASTER)
const token = jwt.sign(
  { email: ADMIN_EMAIL, name: ADMIN_NAME, tier: 'MASTER' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

// ── 항구 데이터 ─────────────────────────────────────────
const HARBORS = [
  // 강원
  { label: '강릉·강문', key: '강원 강릉',   region: '강원' },
  { label: '주문진',    key: '강원 주문진',  region: '강원' },
  { label: '속초',      key: '강원 속초',    region: '강원' },
  { label: '고성(거진)', key: '강원 고성',   region: '강원' },
  { label: '양양(낙산·남애)', key: '강원 양양', region: '강원' },
  { label: '동해·묵호', key: '강원 동해',    region: '강원' },
  { label: '삼척',      key: '강원 삼척',    region: '강원' },
  // 경북
  { label: '구룡포(포항)', key: '경북 구룡포', region: '경북' },
  { label: '감포(경주)',   key: '경북 감포',   region: '경북' },
  { label: '강구(영덕)',   key: '경북 강구',   region: '경북' },
  { label: '후포(울진)',   key: '경북 후포',   region: '경북' },
  { label: '죽변(울진)',   key: '경북 죽변',   region: '경북' },
  // 경남
  { label: '통영',          key: '경남 통영', region: '경남' },
  { label: '거제(대포·금포)', key: '경남 거제', region: '경남' },
  { label: '남해(미조·상주)', key: '경남 남해', region: '경남' },
  { label: '고성',          key: '경남 고성', region: '경남' },
  // 전남
  { label: '여수(국동)', key: '전남 여수', region: '전남' },
  { label: '목포',      key: '전남 목포', region: '전남' },
  { label: '완도',      key: '전남 완도', region: '전남' },
  { label: '고흥(나로도)', key: '전남 고흥', region: '전남' },
  { label: '진도',      key: '전남 진도', region: '전남' },
  // 전북
  { label: '군산(비응·야미도)', key: '전북 군산', region: '전북' },
  { label: '부안(격포·위도)',   key: '전북 부안', region: '전북' },
  // 충남
  { label: '태안(안흥·마검포)', key: '충남 태안', region: '충남' },
  { label: '보령(무창포·오천)', key: '충남 보령', region: '충남' },
  { label: '서산(삼길포)',      key: '충남 서산', region: '충남' },
  // 인천
  { label: '남항부두', key: '인천 남항부두', region: '인천' },
  { label: '연안부두', key: '인천 연안부두', region: '인천' },
  // 부산
  { label: '기장',    key: '부산 기장',    region: '부산' },
  { label: '다대포',  key: '부산 다대포',  region: '부산' },
  { label: '용호부두', key: '부산 용호부두', region: '부산' },
  // 제주
  { label: '도두항', key: '제주 도두항', region: '제주' },
  { label: '애월항', key: '제주 애월항', region: '제주' },
  { label: '서귀포', key: '제주 서귀포', region: '제주' },
  { label: '모슬포', key: '제주 모슬포', region: '제주' },
  { label: '성산항', key: '제주 성산항', region: '제주' },
];

// 어종 목록 (항구 인덱스로 순환)
const TARGETS = ['감성돔', '참돔', '방어', '부시리', '갈치', '대구', '오징어', '농어', '광어', '삼치'];
const TYPES   = ['선상낚시', '선상낚시', '야간선상', '선상낚시', '선상낚시'];
const DATES   = ['매일 출항', '주말 출항', '예약 후 출항', '상시 출항', '시즌 출항'];
const PRICES  = ['₩50,000', '₩60,000', '₩70,000', '₩80,000', '₩45,000', '₩55,000', '₩65,000', '₩75,000'];

function postJson(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: SERVER,
      port: PORT,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${token}`,
      },
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function seed() {
  console.log(`\n🚀 선상배 홍보 테스트 게시글 시드 시작`);
  console.log(`📍 대상: ${HARBORS.length}개 항구 × 2척 = ${HARBORS.length * 2}개 게시글\n`);

  let success = 0;
  let fail = 0;

  for (let i = 0; i < HARBORS.length; i++) {
    const harbor = HARBORS[i];
    const target = TARGETS[i % TARGETS.length];
    const type   = TYPES[i % TYPES.length];
    const date   = DATES[i % DATES.length];
    const price  = PRICES[i % PRICES.length];

    // ── 1호 ─────────────────────────────────────────────
    const post1 = {
      author:       ADMIN_NAME,
      author_email: `test1_${i}@fishinggo.test`,
      shipName:     `낚시Go 테스트 1호`,
      type,
      target,
      region:    harbor.key,
      date,
      price,
      phone:     '010-0000-0001',
      capacity:  20,
      content:   `[테스트 데이터] ${harbor.label} 출항 낚시Go 테스트 1호입니다.\n\n` +
                 `주요 어종: ${target}\n출항 일정: ${date}\n요금: ${price}/1인\n` +
                 `정원: 20명\n\n낚시GO 앱에서 지역 검색 테스트용 샘플 게시글입니다.`,
      isPinned: false,
    };

    // ── 2호 ─────────────────────────────────────────────
    const post2 = {
      author:       ADMIN_NAME,
      author_email: `test2_${i}@fishinggo.test`,
      shipName:     `낚시Go 테스트 2호`,
      type:         type === '야간선상' ? '선상낚시' : '야간선상',
      target:       TARGETS[(i + 5) % TARGETS.length],
      region:    harbor.key,
      date:      date === '매일 출항' ? '주말 출항' : '매일 출항',
      price:     PRICES[(i + 4) % PRICES.length],
      phone:     '010-0000-0002',
      capacity:  15,
      content:   `[테스트 데이터] ${harbor.label} 출항 낚시Go 테스트 2호입니다.\n\n` +
                 `주요 어종: ${TARGETS[(i + 5) % TARGETS.length]}\n출항 일정: ${date === '매일 출항' ? '주말 출항' : '매일 출항'}\n` +
                 `요금: ${PRICES[(i + 4) % PRICES.length]}/1인\n정원: 15명\n\n` +
                 `낚시GO 앱에서 지역 검색 테스트용 샘플 게시글입니다.`,
      isPinned: false,
    };

    // 1호 전송
    try {
      const r1 = await postJson('/api/community/business', post1);
      if (r1.status === 200 || r1.status === 201) {
        console.log(`  ✅ [${harbor.key}] 테스트 1호 생성`);
        success++;
      } else {
        console.log(`  ⚠️  [${harbor.key}] 테스트 1호 실패 (${r1.status}): ${JSON.stringify(r1.data).slice(0, 80)}`);
        fail++;
      }
    } catch (e) {
      console.log(`  ❌ [${harbor.key}] 테스트 1호 오류: ${e.message}`);
      fail++;
    }

    // 2호 전송
    try {
      const r2 = await postJson('/api/community/business', post2);
      if (r2.status === 200 || r2.status === 201) {
        console.log(`  ✅ [${harbor.key}] 테스트 2호 생성`);
        success++;
      } else {
        console.log(`  ⚠️  [${harbor.key}] 테스트 2호 실패 (${r2.status}): ${JSON.stringify(r2.data).slice(0, 80)}`);
        fail++;
      }
    } catch (e) {
      console.log(`  ❌ [${harbor.key}] 테스트 2호 오류: ${e.message}`);
      fail++;
    }

    // 서버 부하 방지용 딜레이
    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ 성공: ${success}개`);
  console.log(`❌ 실패: ${fail}개`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

seed().catch(console.error);
