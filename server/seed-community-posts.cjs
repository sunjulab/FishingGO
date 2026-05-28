/**
 * 커뮤니티 조황 게시글 테스트 시드 (사진 2-3장 포함)
 * 실행: node server/seed-community-posts.cjs
 */
const path = require('path');
const fs   = require('fs');
const https = require('https');
const jwt  = require('jsonwebtoken');

// server/.env에서 JWT_SECRET 로드
const envPath  = path.join(__dirname, '.env');
const envLines = fs.readFileSync(envPath, 'utf-8').split('\n');
let JWT_SECRET = 'fishinggo_secret_2024';
for (const line of envLines) {
  const m = line.match(/^JWT_SECRET=(.+)/);
  if (m) { JWT_SECRET = m[1].trim(); break; }
}
console.log('[시드] JWT_SECRET:', JWT_SECRET.slice(0, 10) + '...');

const token = jwt.sign(
  { email: 'ksolpark.k@gmail.com', name: '낚시GO', tier: 'MASTER' },
  JWT_SECRET,
  { expiresIn: '2h' }
);

// 무료 낚시 이미지 (Unsplash 공개 이미지)
const FISHING_IMAGES = [
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80',
  'https://images.unsplash.com/photo-1497040863541-85dd04c01f48?w=600&q=80',
  'https://images.unsplash.com/photo-1474725564813-3943bf19a9c2?w=600&q=80',
  'https://images.unsplash.com/photo-1510674863043-9f8a7cc3aaac?w=600&q=80',
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&q=80',
  'https://images.unsplash.com/photo-1543253687-c931b8e9e1bc?w=600&q=80',
  'https://images.unsplash.com/photo-1597308680317-4dc7b00a72aa?w=600&q=80',
  'https://images.unsplash.com/photo-1611069571024-0b5ac6f6d1ef?w=600&q=80',
  'https://images.unsplash.com/photo-1504198266287-1659872e6590?w=600&q=80',
  'https://images.unsplash.com/photo-1459664018906-085c36f472af?w=600&q=80',
];

function pickImages(count = 2) {
  const shuffled = [...FISHING_IMAGES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// 테스트 게시글 10개 데이터
const POSTS = [
  {
    author: '바다낚시왕',
    author_email: 'test_fisher1@fishinggo.test',
    category: '선상',
    content: '오늘 통영 선상낚시 대박났습니다! 🎣\n참돔 5마리, 방어 2마리 올렸어요.\n날씨도 맑고 파도도 잔잔해서 최고의 낚시였습니다.\n새벽 5시에 출항해서 오후 2시까지 9시간 낚시했는데 시간가는 줄 몰랐네요.\n같이 출조하신 분들 모두 대박 나셨으면 좋겠습니다! 🐟',
    location: { address: '경남 통영시 통영항', lat: 34.8544, lng: 128.4330 },
    images: pickImages(3),
  },
  {
    author: '갯바위고수',
    author_email: 'test_fisher2@fishinggo.test',
    category: '갯바위',
    content: '제주 서귀포 갯바위에서 감성돔 사냥 🎯\n아침 물때 잘 맞춰서 42cm 감성돔 3마리 올렸습니다.\n미끼는 크릴새우로 시작해서 갯지렁이로 바꿨더니 입질이 확 살아나더라고요.\n내일도 기상 좋으면 또 나올 예정입니다 ㅎㅎ',
    location: { address: '제주 서귀포시 법환동', lat: 33.2396, lng: 126.5100 },
    images: pickImages(2),
  },
  {
    author: '루어낚시마스터',
    author_email: 'test_fisher3@fishinggo.test',
    category: '루어',
    content: '동해 속초 루어낚시 쏘가리 조황 🔥\n에기로 쭈꾸미 10마리 + 무늬오징어 3마리!\n오늘따라 수온이 딱 맞아서 어디서나 입질이 오더라고요.\n오전 6시~10시 황금타임에 집중적으로 잡았습니다.\n이 정도면 오늘 회 파티 각이죠? 😄',
    location: { address: '강원 속초시 속초항', lat: 38.2061, lng: 128.5916 },
    images: pickImages(3),
  },
  {
    author: '찌낚시마니아',
    author_email: 'test_fisher4@fishinggo.test',
    category: '찌낚시',
    content: '남해 여수 찌낚시 오늘 대박 조황 보고합니다!\n감성돔 38cm, 41cm, 35cm 세 마리 + 볼락 잔뜩 ㅎㅎ\n오늘 물때가 5물 딱 맞아서 처음부터 입질이 살아있었어요.\n채비는 3B 구멍찌에 2호 목줄이었습니다.',
    location: { address: '전남 여수시 국동항', lat: 34.7604, lng: 127.6622 },
    images: pickImages(2),
  },
  {
    author: '원투낚시꾼',
    author_email: 'test_fisher5@fishinggo.test',
    category: '원투',
    content: '태안 만리포 해수욕장 원투낚시 조황\n보구치(백조기) 15마리 대박입니다! 🎣\n4m 짜리 원투대 두 대 폈는데 번갈아가며 올라오네요.\n밑걸림도 없고 파도도 적당해서 너무 좋은 포인트에요.\n새벽 3시부터 오전 9시까지 했는데 꽤 수확이 좋았습니다.',
    location: { address: '충남 태안군 만리포해수욕장', lat: 36.8018, lng: 126.1736 },
    images: pickImages(3),
  },
  {
    author: '선상전문가',
    author_email: 'test_fisher6@fishinggo.test',
    category: '선상',
    content: '거제 외도 근해 선상낚시 참돔 조황 🐟\n참돔 킹 57cm 잡았습니다!! 제 기록이에요 ㅠㅠ\n지깅으로 바닥층 노리다가 올라왔는데 한참 싸웠네요.\n같이 간 일행 6명 중 4명이 50cm 이상 잡아서 기분 좋은 날이었습니다.',
    location: { address: '경남 거제시 장승포항', lat: 34.9437, lng: 128.6985 },
    images: pickImages(2),
  },
  {
    author: '에깅마스터',
    author_email: 'test_fisher7@fishinggo.test',
    category: '에깅',
    content: '동해 강릉 에깅 오늘 조황 🦑\n무늬오징어 8마리! 최대 840g짜리도 올렸어요.\n에기는 3.5호 파란색 계열이 오늘 최고였습니다.\n저녁 7시부터 시작해서 자정까지 했는데 계속 입질이 오더라고요.\n다음주도 같은 타임에 나올 예정입니다~',
    location: { address: '강원 강릉시 안목항', lat: 37.7694, lng: 128.9554 },
    images: pickImages(3),
  },
  {
    author: '민물낚시달인',
    author_email: 'test_fisher8@fishinggo.test',
    category: '민물',
    content: '북한강 가평 배스낚시 대박 조황 보고! 🎣\n배스 7마리 + 꺽지 5마리 잡았습니다.\n오전 이른 시간에 수초 주변을 중점적으로 노렸더니 입질이 좋았어요.\n미노우 플러그 7cm 짜리가 오늘 최고의 루어였습니다.',
    location: { address: '경기 가평군 가평읍 북한강', lat: 37.8317, lng: 127.5088 },
    images: pickImages(2),
  },
  {
    author: '갈치선상꾼',
    author_email: 'test_fisher9@fishinggo.test',
    category: '선상',
    content: '목포 근해 야간 선상 갈치낚시 대조황! 🌙\n갈치 42마리!!! 손가락 4마디짜리도 여러 마리 나왔어요.\n야간 출항이라 처음엔 걱정했는데 이렇게 잘 잡힐 줄 몰랐네요.\n갈치 조림, 갈치구이 해먹으려고 다 가져왔습니다 ㅎㅎ',
    location: { address: '전남 목포시 북항', lat: 34.8118, lng: 126.3922 },
    images: pickImages(3),
  },
  {
    author: '대물낚시꾼',
    author_email: 'test_fisher10@fishinggo.test',
    category: '갯바위',
    content: '울릉도 원정낚시 후기 🏝️\n방어 68cm 대물 뜯었습니다!!! 생애 최대어입니다!!\n울릉도까지 2박 3일 갔는데 이 한 마리로 모든 게 보상됐어요.\n내년에도 꼭 다시 가고 싶은 정말 좋은 포인트예요.',
    location: { address: '경북 울릉군 도동항', lat: 37.4838, lng: 130.9057 },
    images: pickImages(2),
  },
];

function postJson(body, apiUrl) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(apiUrl);
    const opts = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': 'Bearer ' + token,
      },
    };
    const req = https.request(opts, (res) => {
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
  const API = 'https://fishing-go-backend.onrender.com/api/community/posts';
  console.log('\n🎣 커뮤니티 조황 게시글 시드 시작');
  console.log(`📝 ${POSTS.length}개 게시글 (사진 2~3장씩)\n`);

  let ok = 0, fail = 0;

  for (let i = 0; i < POSTS.length; i++) {
    const post = POSTS[i];
    try {
      const r = await postJson(post, API);
      if (r.status === 200 || r.status === 201) {
        console.log(`  ✅ [${i+1}] ${post.author} - ${post.category} (이미지 ${post.images.length}장)`);
        ok++;
      } else {
        console.log(`  ⚠️  [${i+1}] ${post.author} 실패 (${r.status}): ${JSON.stringify(r.data).slice(0, 120)}`);
        fail++;
      }
    } catch (e) {
      console.log(`  ❌ [${i+1}] ${post.author} 오류: ${e.message}`);
      fail++;
    }
    await new Promise(r => setTimeout(r, 600));
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ 성공: ${ok}개  ❌ 실패: ${fail}개`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

seed().catch(console.error);
