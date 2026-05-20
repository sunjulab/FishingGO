/**
 * 선상배 홍보 테스트 게시글 직접 시드 (business.json 직접 쓰기)
 * 각 항구마다 낚시Go 테스트 1호, 2호 2개씩 생성 (총 36개 항구 × 2 = 72개)
 */

const path = require('path');
const fs   = require('fs');

const BUSINESS_FILE = path.join(__dirname, 'business.json');

// ── 항구 데이터 ─────────────────────────────────────────
const HARBORS = [
  // 강원
  { label: '강릉·강문', key: '강원 강릉' },
  { label: '주문진',    key: '강원 주문진' },
  { label: '속초',      key: '강원 속초' },
  { label: '고성(거진)', key: '강원 고성' },
  { label: '양양(낙산·남애)', key: '강원 양양' },
  { label: '동해·묵호', key: '강원 동해' },
  { label: '삼척',      key: '강원 삼척' },
  // 경북
  { label: '구룡포(포항)', key: '경북 구룡포' },
  { label: '감포(경주)',   key: '경북 감포' },
  { label: '강구(영덕)',   key: '경북 강구' },
  { label: '후포(울진)',   key: '경북 후포' },
  { label: '죽변(울진)',   key: '경북 죽변' },
  // 경남
  { label: '통영',          key: '경남 통영' },
  { label: '거제(대포·금포)', key: '경남 거제' },
  { label: '남해(미조·상주)', key: '경남 남해' },
  { label: '고성',          key: '경남 고성' },
  // 전남
  { label: '여수(국동)', key: '전남 여수' },
  { label: '목포',      key: '전남 목포' },
  { label: '완도',      key: '전남 완도' },
  { label: '고흥(나로도)', key: '전남 고흥' },
  { label: '진도',      key: '전남 진도' },
  // 전북
  { label: '군산(비응·야미도)', key: '전북 군산' },
  { label: '부안(격포·위도)',   key: '전북 부안' },
  // 충남
  { label: '태안(안흥·마검포)', key: '충남 태안' },
  { label: '보령(무창포·오천)', key: '충남 보령' },
  { label: '서산(삼길포)',      key: '충남 서산' },
  // 인천
  { label: '남항부두', key: '인천 남항부두' },
  { label: '연안부두', key: '인천 연안부두' },
  // 부산
  { label: '기장',    key: '부산 기장' },
  { label: '다대포',  key: '부산 다대포' },
  { label: '용호부두', key: '부산 용호부두' },
  // 제주
  { label: '도두항', key: '제주 도두항' },
  { label: '애월항', key: '제주 애월항' },
  { label: '서귀포', key: '제주 서귀포' },
  { label: '모슬포', key: '제주 모슬포' },
  { label: '성산항', key: '제주 성산항' },
];

const TARGETS = ['감성돔', '참돔', '방어', '부시리', '갈치', '대구', '오징어', '농어', '광어', '삼치'];
const TYPES   = ['선상낚시', '선상낚시', '야간선상', '선상낚시', '선상낚시'];
const DATES   = ['매일 출항', '주말 출항', '예약 후 출항', '상시 출항', '시즌 출항'];
const PRICES  = ['₩50,000', '₩60,000', '₩70,000', '₩80,000', '₩45,000', '₩55,000', '₩65,000', '₩75,000'];

// ── 기존 데이터 로드 ─────────────────────────────────────
let existing = [];
if (fs.existsSync(BUSINESS_FILE)) {
  try { existing = JSON.parse(fs.readFileSync(BUSINESS_FILE, 'utf-8')) || []; }
  catch { existing = []; }
}

// 기존 테스트 데이터 제거 (재실행 시 중복 방지)
const cleaned = existing.filter(p =>
  !p.author_email || !p.author_email.startsWith('test')
);
console.log(`기존 데이터: ${existing.length}개 → 테스트 제거 후: ${cleaned.length}개`);

// ── 새 게시글 생성 ──────────────────────────────────────
const newPosts = [];
const now = new Date();

for (let i = 0; i < HARBORS.length; i++) {
  const harbor = HARBORS[i];
  const target = TARGETS[i % TARGETS.length];
  const type   = TYPES[i % TYPES.length];
  const date   = DATES[i % DATES.length];
  const price  = PRICES[i % PRICES.length];

  const base = {
    isPinned: false,
    capacity: 20,
    images: [],
    cover: '',
    createdAt: new Date(now.getTime() - i * 60000).toISOString(), // 순차적 시간
  };

  // 1호
  newPosts.push({
    _id: `test_${Date.now()}_${i}_1`,
    id:  `test_${Date.now()}_${i}_1`,
    ...base,
    author:       '낚시GO 관리자',
    author_email: `test1_${i}@fishinggo.test`,
    shipName:     '낚시Go 테스트 1호',
    type,
    target,
    region: harbor.key,
    date,
    price,
    phone:   '010-0000-0001',
    content: `[테스트] ${harbor.label} 출항 낚시Go 테스트 1호입니다.\n\n주요 어종: ${target}\n출항 일정: ${date}\n요금: ${price}/1인\n정원: 20명\n\n낚시GO 지역 검색 테스트용 샘플 게시글입니다.`,
    capacity: 20,
  });

  // 2호
  const target2 = TARGETS[(i + 5) % TARGETS.length];
  const type2   = type === '야간선상' ? '선상낚시' : '야간선상';
  const date2   = date === '매일 출항' ? '주말 출항' : '매일 출항';
  const price2  = PRICES[(i + 4) % PRICES.length];
  newPosts.push({
    _id: `test_${Date.now()}_${i}_2`,
    id:  `test_${Date.now()}_${i}_2`,
    ...base,
    author:       '낚시GO 관리자',
    author_email: `test2_${i}@fishinggo.test`,
    shipName:     '낚시Go 테스트 2호',
    type:    type2,
    target:  target2,
    region:  harbor.key,
    date:    date2,
    price:   price2,
    phone:   '010-0000-0002',
    content: `[테스트] ${harbor.label} 출항 낚시Go 테스트 2호입니다.\n\n주요 어종: ${target2}\n출항 일정: ${date2}\n요금: ${price2}/1인\n정원: 15명\n\n낚시GO 지역 검색 테스트용 샘플 게시글입니다.`,
    capacity: 15,
  });
}

// 기존 데이터 뒤에 붙이기 (VVIP pinned 먼저 유지)
const final = [...cleaned, ...newPosts];
fs.writeFileSync(BUSINESS_FILE, JSON.stringify(final, null, 2), 'utf-8');

console.log(`\n✅ business.json 직접 저장 완료!`);
console.log(`   총 ${final.length}개 (기존 ${cleaned.length} + 새 ${newPosts.length}개)`);
console.log(`   항구별: ${HARBORS.length}개 항구 × 2척 = ${newPosts.length}개`);
console.log(`\n⚠️  서버를 재시작해야 반영됩니다 (Ctrl+C 후 재시작).`);
console.log(`   또는 서버가 MongoDB 연결 중이면 서버 재시작 불필요 - MongoDB에 API로 직접 넣어야 합니다.`);
