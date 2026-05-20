/**
 * 선상배 홍보 테스트 게시글 API 시드 (올바른 server/.env 로드)
 */
const path = require('path');
const fs   = require('fs');
const http = require('http');
const jwt  = require('jsonwebtoken');

// server/.env에서 JWT_SECRET 로드
const envPath  = path.join(__dirname, '.env');
const envLines = fs.readFileSync(envPath, 'utf-8').split('\n');
let JWT_SECRET = 'fishinggo_secret_2024';
for (const line of envLines) {
  const m = line.match(/^JWT_SECRET=(.+)/);
  if (m) { JWT_SECRET = m[1].trim(); break; }
}
console.log('[시드] JWT_SECRET:', JWT_SECRET.slice(0, 15) + '...');

const token = jwt.sign(
  { email: 'sunjulab.k@gmail.com', name: '낚시GO 관리자', tier: 'MASTER' },
  JWT_SECRET,
  { expiresIn: '2h' }
);

const HARBORS = [
  { label: '강릉·강문',       key: '강원 강릉' },
  { label: '주문진',          key: '강원 주문진' },
  { label: '속초',            key: '강원 속초' },
  { label: '고성(거진)',      key: '강원 고성' },
  { label: '양양(낙산·남애)', key: '강원 양양' },
  { label: '동해·묵호',       key: '강원 동해' },
  { label: '삼척',            key: '강원 삼척' },
  { label: '구룡포(포항)',    key: '경북 구룡포' },
  { label: '감포(경주)',      key: '경북 감포' },
  { label: '강구(영덕)',      key: '경북 강구' },
  { label: '후포(울진)',      key: '경북 후포' },
  { label: '죽변(울진)',      key: '경북 죽변' },
  { label: '통영',            key: '경남 통영' },
  { label: '거제(대포·금포)', key: '경남 거제' },
  { label: '남해(미조·상주)', key: '경남 남해' },
  { label: '고성',            key: '경남 고성' },
  { label: '여수(국동)',      key: '전남 여수' },
  { label: '목포',            key: '전남 목포' },
  { label: '완도',            key: '전남 완도' },
  { label: '고흥(나로도)',    key: '전남 고흥' },
  { label: '진도',            key: '전남 진도' },
  { label: '군산(비응·야미도)', key: '전북 군산' },
  { label: '부안(격포·위도)', key: '전북 부안' },
  { label: '태안(안흥·마검포)', key: '충남 태안' },
  { label: '보령(무창포·오천)', key: '충남 보령' },
  { label: '서산(삼길포)',    key: '충남 서산' },
  { label: '남항부두',        key: '인천 남항부두' },
  { label: '연안부두',        key: '인천 연안부두' },
  { label: '기장',            key: '부산 기장' },
  { label: '다대포',          key: '부산 다대포' },
  { label: '용호부두',        key: '부산 용호부두' },
  { label: '도두항',          key: '제주 도두항' },
  { label: '애월항',          key: '제주 애월항' },
  { label: '서귀포',          key: '제주 서귀포' },
  { label: '모슬포',          key: '제주 모슬포' },
  { label: '성산항',          key: '제주 성산항' },
];

const TARGETS = ['감성돔','참돔','방어','부시리','갈치','대구','오징어','농어','광어','삼치'];
const TYPES   = ['선상낚시','선상낚시','야간선상','선상낚시','선상낚시'];
const DATES   = ['매일 출항','주말 출항','예약 후 출항','상시 출항','시즌 출항'];
const PRICES  = ['50,000원','60,000원','70,000원','80,000원','45,000원','55,000원','65,000원','75,000원'];

function postJson(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opts = {
      hostname: 'localhost', port: 5000,
      path: '/api/community/business', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': 'Bearer ' + token,
      },
    };
    const req = http.request(opts, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(buf) }); }
        catch { resolve({ status: res.statusCode, data: buf }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function seed() {
  console.log('\n🚢 선상배 홍보 테스트 게시글 시드 시작');
  console.log(`📍 ${HARBORS.length}개 항구 x 2척 = ${HARBORS.length * 2}개\n`);

  let ok = 0, fail = 0;

  for (let i = 0; i < HARBORS.length; i++) {
    const h       = HARBORS[i];
    const target  = TARGETS[i % TARGETS.length];
    const type    = TYPES[i % TYPES.length];
    const date    = DATES[i % DATES.length];
    const price   = PRICES[i % PRICES.length];
    const target2 = TARGETS[(i + 5) % TARGETS.length];
    const type2   = type === '야간선상' ? '선상낚시' : '야간선상';
    const date2   = date === '매일 출항' ? '주말 출항' : '매일 출항';
    const price2  = PRICES[(i + 4) % PRICES.length];

    const posts = [
      {
        author: '낚시GO 관리자', author_email: `test1_${i}@fishinggo.test`,
        shipName: '낚시Go 테스트 1호', type, target, region: h.key,
        date, price, phone: '010-0000-0001', capacity: 20,
        content: `[테스트] ${h.label} 출항 낚시Go 테스트 1호입니다.\n주요 어종: ${target}\n출항: ${date}\n요금: ${price}/1인\n정원: 20명\n\n검색 테스트용 샘플입니다.`,
        isPinned: false, images: [], cover: '',
      },
      {
        author: '낚시GO 관리자', author_email: `test2_${i}@fishinggo.test`,
        shipName: '낚시Go 테스트 2호', type: type2, target: target2, region: h.key,
        date: date2, price: price2, phone: '010-0000-0002', capacity: 15,
        content: `[테스트] ${h.label} 출항 낚시Go 테스트 2호입니다.\n주요 어종: ${target2}\n출항: ${date2}\n요금: ${price2}/1인\n정원: 15명\n\n검색 테스트용 샘플입니다.`,
        isPinned: false, images: [], cover: '',
      },
    ];

    for (const [pi, post] of posts.entries()) {
      try {
        const r = await postJson(post);
        if (r.status === 200 || r.status === 201) {
          console.log(`  ✅ [${h.key}] 테스트 ${pi + 1}호 생성`);
          ok++;
        } else {
          console.log(`  ⚠️  [${h.key}] ${pi + 1}호 실패 (${r.status}): ${JSON.stringify(r.data).slice(0, 100)}`);
          fail++;
        }
      } catch (e) {
        console.log(`  ❌ [${h.key}] ${pi + 1}호 오류: ${e.message}`);
        fail++;
      }
      // Rate limit 우회: 400ms 간격
      await new Promise(r => setTimeout(r, 400));
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ 성공: ${ok}개  ❌ 실패: ${fail}개`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

seed().catch(console.error);
