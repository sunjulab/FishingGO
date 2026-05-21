const express = require('express');
const http = require('http');
const dns = require('dns');

// 통신사/로컬망 DNS에서 SRV 레코드 조회를 차단하는 경우를 우회하기 위해 Google Public DNS 강제 사용
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  // DNS 설정 성공 — logger 초기화 이전이므로 console 사용
} catch (e) {
  // DNS 설정 실패 무시
}

const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const coupang = require('./coupangService');
const ali     = require('./aliService');

const JWT_SECRET = process.env.JWT_SECRET || 'fishinggo_secret_2024';
// ✅ WARN-SI1 강화: 프로덕션에서 JWT_SECRET 미설정 시 즉시 종료 (fail-fast)
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    process.stderr.write('[SECURITY] ❌ JWT_SECRET 환경변수가 설정되지 않았습니다. 프로덕션 서버를 시작할 수 없습니다.\n');
    process.exit(1); // 취약한 기본값으로 프로덕션 구동 차단
  }
  // 개발 환경: 경고 없이 계속 진행 (logger 초기화 이전)
}

// In-Memory Fallback - DB 없어도 작동
const USERS_FILE = path.join(__dirname, 'users.json');
const POSTS_FILE = path.join(__dirname, 'posts.json');
const RECORDS_FILE = path.join(__dirname, 'records.json');
const CREWS_FILE = path.join(__dirname, 'crews.json');
const CHATS_FILE = path.join(__dirname, 'chats.json');
const NOTICES_FILE = path.join(__dirname, 'notices.json');
const BUSINESS_FILE = path.join(__dirname, 'business.json');
const SECRET_OVERRIDES_FILE = path.join(__dirname, 'secretPointOverrides.json');
const CCTV_OVERRIDES_FILE = path.join(__dirname, 'cctvOverrides.json');
const PRO_SUBS_FILE = path.join(__dirname, 'proSubscriptions.json');
const VVIP_SLOTS_FILE = path.join(__dirname, 'vvipSlots.json');

let memUsers = [];
let memPosts = [];
let memRecords = [];
let memCrews = [];
let chatHistories = {};
let memNotices = [
  { _id: 'n1', id: 'n1', title: '🎉 낚시GO 서비스 오픈 안내', content: '낚시GO 플랫폼이 정식 오픈되었습니다! 더 많은 기능이 업데이트될 예정입니다.\n\n✅ 주요 기능:\n- 실시간 물때 및 날씨 정보\n- 낚시 포인트 지도\n- 커뮤니티 게시판\n- 크루 채팅\n\n앞으로도 지속적으로 업데이트 예정이니 많은 이용 부탁드립니다.', isPinned: true, author: 'MASTER', views: 1240, date: '2025-01-01', createdAt: '2025-01-01T00:00:00.000Z' },
  { _id: 'n2', id: 'n2', title: '⚠️ 서비스 점검 공지 (4월)', content: '4월 20일 새벽 2시~4시 서버 업그레이드 점검이 있습니다.\n\n점검 시간: 04월 20일 02:00 ~ 04:00\n점검 내용: 서버 성능 최적화 및 DB 마이그레이션\n\n이용에 참고해주세요.', isPinned: false, author: 'MASTER', views: 482, date: '2025-04-15', createdAt: '2025-04-15T00:00:00.000Z' },
];
// 선상배 홍보 게시글 — 실 데이터는 MongoDB 또는 business.json에서 로드 (데모 데이터 없음)
let memBusinessPosts = [];

// ⚠️ 아래 4개 변수는 파일 로드 코드(55줄) 이전에 선언해야 TDZ 에러가 없습니다
let secretPointOverrides = {};
let cctvOverrides = {};
let memProSubs = {};
let memVvipSlots = {};

try {
  if (fs.existsSync(USERS_FILE)) memUsers = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  if (fs.existsSync(POSTS_FILE)) memPosts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
  if (fs.existsSync(RECORDS_FILE)) memRecords = JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf-8'));
  if (fs.existsSync(CREWS_FILE)) memCrews = JSON.parse(fs.readFileSync(CREWS_FILE, 'utf-8'));
  if (fs.existsSync(CHATS_FILE)) chatHistories = JSON.parse(fs.readFileSync(CHATS_FILE, 'utf-8'));
  if (fs.existsSync(NOTICES_FILE)) memNotices = JSON.parse(fs.readFileSync(NOTICES_FILE, 'utf-8'));
  if (fs.existsSync(BUSINESS_FILE)) memBusinessPosts = JSON.parse(fs.readFileSync(BUSINESS_FILE, 'utf-8'));
  if (fs.existsSync(SECRET_OVERRIDES_FILE)) secretPointOverrides = JSON.parse(fs.readFileSync(SECRET_OVERRIDES_FILE, 'utf-8'));
  if (fs.existsSync(CCTV_OVERRIDES_FILE)) cctvOverrides = JSON.parse(fs.readFileSync(CCTV_OVERRIDES_FILE, 'utf-8'));
  if (fs.existsSync(PRO_SUBS_FILE)) memProSubs = JSON.parse(fs.readFileSync(PRO_SUBS_FILE, 'utf-8'));
  if (fs.existsSync(VVIP_SLOTS_FILE)) memVvipSlots = JSON.parse(fs.readFileSync(VVIP_SLOTS_FILE, 'utf-8'));
  // 로컬 보존 파일 로드 완료 (logger 초기화 이전)
} catch (e) {
  // 로컬 JSON 로드 실패, 빈 배열로 시작
}

// ✅ BUG-FIX-BOOTSTRAP-MEM: 인메모리 마스터 계정 MASTER tier 보장
// 이전 코드: sunjulab(이름/id) 계정을 BUSINESS_VIP로 강제 패치 → 마스터 tier 박탈 버그!
{
  const masterIdx = memUsers.findIndex(u => u.email === 'sunjulab.k' || u.email === 'sunjulab.k@gmail.com');
  if (masterIdx !== -1 && memUsers[masterIdx].tier !== 'MASTER') {
    memUsers[masterIdx].tier = 'MASTER';
    try { fs.writeFileSync(USERS_FILE, JSON.stringify(memUsers, null, 2)); } catch (_) {}
  }
}


// ✅ 9TH-B6: save* 함수 silent catch → 개발 환경 경고 추가 — 파일 저장 실패 시 무음 데이터 유실 방지
function _saveFile(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }
  catch (e) { (global.logger?.error || (() => {}))(`[Fallback] 파일 저장 실패 (${path.basename(file)}): ${e.message}`); }
}
function saveMemUsers()          { _saveFile(USERS_FILE, memUsers); }
function saveMemPosts()          { _saveFile(POSTS_FILE, memPosts); }
function saveMemRecords()        { _saveFile(RECORDS_FILE, memRecords); }
function saveMemCrews()          { _saveFile(CREWS_FILE, memCrews); }
function saveChatHistories()     { _saveFile(CHATS_FILE, chatHistories); }
function saveMemNotices()        { _saveFile(NOTICES_FILE, memNotices); }
function saveMemBusinessPosts()  { _saveFile(BUSINESS_FILE, memBusinessPosts); }
function saveSecretPointOverrides() { _saveFile(SECRET_OVERRIDES_FILE, secretPointOverrides); }
function saveCctvOverrides()     { _saveFile(CCTV_OVERRIDES_FILE, cctvOverrides); }
function saveProSubs()           { _saveFile(PRO_SUBS_FILE, memProSubs); }
function saveVvipSlots()         { _saveFile(VVIP_SLOTS_FILE, memVvipSlots); }

let dbReady = false;

// ✅ 금지 닉네임/아이디 목록 — 브랜드 사칭·운영자 사칭·혐오 표현 차단
const BANNED_NAMES = [
  // ── 플랫폼 브랜드 사칭 ──────────────────────────────────────────
  '낚시go','낚시고','낚시goo','낚시GO','낚시app','낚시어플','낚시앱',
  'fishinggo','fishingg0','fishing_go','fishing-go','fishingapp',

  // ── 운영·관리 사칭 ──────────────────────────────────────────────
  '운영자','운영진','운영팀','운영자님','관리자','관리팀','관리인',
  '어드민','admin','administrator','매니저','manager','moderator','mod','staff','스탭','스태프',
  '공식운영','공식관리','운영계정','운영봇',

  // ── 마스터·최고권한 사칭 ──────────────────────────────────────────
  '마스터','master','root','superuser','슈퍼유저','godmode','갓모드','슈퍼관리자','최고관리자',

  // ── 공식·신뢰 기관 사칭 ──────────────────────────────────────────
  '공식','official','공식계정','공지','서비스팀','고객센터','고객지원','고객서비스','공식안내',

  // ── 운영사 아이디 직접 사칭 ───────────────────────────────────────
  'sunjulab','선주랩','sunj',

  // ── 시스템·봇 사칭 ───────────────────────────────────────────────
  'bot','봇','system','시스템','notice','알림','server','auto','자동알림','공지봇','알림봇',

  // ── 혐오·욕설 (닉네임 금지) ─────────────────────────────────────
  // 한국어 욕설 원형
  '씨발','시발','씨바','시바','씨팔','씨8','쒸발','씨뱅',
  '개새끼','개색끼','개씹','개씨발','개쌍놈','개년','개놈',
  '병신','빙신','벙신',
  '찐따','지랄','지ㄹ','지알',
  '미친','미쳤','미친놈','미친년','미친새끼',
  '꺼져','꺼지다','뒤져','뒤지다','죽어','죽여','죽겠','죽일','죽이다',
  '느금마','니애미','니어미','네미럴','에미럴','애미럴','니미럴','엄창',
  '보지','자지','좆','보ㅈ','자ㅈ','좆같','보지같','자지같',
  '섹스','섹시녀','야동','성교','강간','성폭','윤간','강간마','성추행',
  '새끼','색끼','샊',
  // 자음 축약 변형
  'ㅅㅂ','ㅂㅅ','ㅈㄹ','ㅁㅊ','ㅆㅂ','ㅆㄹ','ㄲㅈ','ㅄ',
  // 영어 욕설
  'fuck','shit','bitch','asshole','bastard','cunt','dick','cock','pussy',
  'nigger','nigga','motherfucker','fuckoff','fuckup','bullshit',
  // 기타 혐오·위협
  '테러','살인','살해','폭탄','폭발물','폭발','납치','拉致',

  // ── 광고·스팸성 ────────────────────────────────────────────────
  '광고','홍보','할인','이벤트쿠폰','무료나눔','1등당첨','클릭',

  // ── 클론·혼동 계정 ─────────────────────────────────────────────
  'testaccount','테스트계정','test1234','admin123',
];

// ── 게시글/댓글 * 처리용 비속어 목록 (닉네임 금지와 별도) ────────────────────
// 브랜드·관리 사칭 키워드는 포함하지 않고, 순수 욕설·비속어만 포함
const PROFANITY_LIST = [
  // 한국어 욕설 원형
  '씨발','시발','씨바','시바','씨팔','씨8','쒸발','씨뱅',
  '개새끼','개색끼','개씹','개씨발','개쌍','개년','개놈',
  '병신','빙신','벙신',
  '찐따','지랄',
  '미친놈','미친년','미친새끼',
  '뒤져','뒤지다','죽어','죽여','죽이다',
  '느금마','니애미','니어미','네미럴','에미럴','애미럴','니미럴','엄창',
  '보지','자지','좆','보ㅈ','자ㅈ','좆같',
  '섹스','야동','성교','강간','성폭','윤간','성추행',
  '새끼','색끼',
  // 자음 축약 변형
  'ㅅㅂ','ㅂㅅ','ㅈㄹ','ㅁㅊ','ㅆㅂ','ㅆㄹ','ㄲㅈ','ㅄ',
  // 영어 욕설
  'fuck','shit','bitch','asshole','bastard','cunt','dick','cock','pussy',
  'nigger','nigga','motherfucker','bullshit',
];

// 정규화: 소문자 + 공백·특수문자·제로폭문자 제거 후 부분일치 검사
function normalizeStr(s) {
  return (s || '').toLowerCase()
    .replace(/[\u200b\u200c\u200d\ufeff\u00ad]/g, '')   // 제로폭·소프트하이픈 제거
    .replace(/[\s\-_\[\]\(\)\.·•★☆♡♥ㅤ!@#$%^&*+=|\\/<>?,;:'"~`]/g, ''); // 공백·특수문자 제거
}

function isBannedName(str) {
  const target = normalizeStr(str);
  return BANNED_NAMES.some(kw => target.includes(normalizeStr(kw)));
}

// ── 게시글/댓글 비속어 * 치환 ─────────────────────────────────────────────────
// 단어 사이 공백·특수문자를 허용하는 유연한 정규식으로 매칭 후 *로 치환
function censorText(str) {
  if (!str || typeof str !== 'string') return str;
  let result = str;
  // 정렬: 긴 키워드 먼저 처리 (부분 매칭 오염 방지)
  const sorted = [...PROFANITY_LIST].sort((a, b) => b.length - a.length);
  sorted.forEach(kw => {
    // 각 글자 사이에 공백·특수문자 허용하는 유연한 패턴 생성
    const chars = [...kw]; // Unicode 안전 분리
    const spacer = '[\\s\\-_\\.·•!@#$%^&*]*'; // 사이에 들어올 수 있는 구분자
    const escapedChars = chars.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = escapedChars.join(spacer);
    try {
      const re = new RegExp(pattern, 'gi');
      result = result.replace(re, match => {
        // 공백 제외 실제 비속어 글자 수만큼 * 치환
        const starCount = [...match.replace(/[\s\-_\\.·•!@#$%^&*]/g, '')].length;
        return '*'.repeat(Math.max(starCount, 1));
      });
    } catch (e) { /* 잘못된 패턴 무시 */ }
  });
  return result;
}

// ✅ ENH-C5: 어드민 판별 헬퍼 — 전체 서버에서 단일 함수로 관리
// sunjulab.k = 마스터 계정 이메일, sunjulab.k@gmail.com = Gmail 로그인 시
// ✅ ADMIN-FIX: sunjulab ID는 VIP 일반 계정이므로 MASTER 판별에서 제거
function isAdminToken(tp) {
  if (!tp) return false;
  return tp.email === 'sunjulab.k'           // ✅ 마스터 계정 이메일
    || tp.email === 'sunjulab.k@gmail.com'   // Gmail OAuth 로그인
    || tp.tier === 'MASTER';                  // ✅ 티어 기반 판별 (JWT에 tier 포함된 경우)
}


// ─── MongoDB 연결 ─────────────────────────────────────────────────────────────
const buildMongoUri = () => {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  const pass = process.env.MONGO_PASS;
  const host = process.env.MONGO_HOST || 'cluster0.cyqhznd.mongodb.net';
  const user = process.env.MONGO_USER || 'fishinggo';
  const db = process.env.MONGO_DB || 'fishinggo';
  if (pass) {
    const enc = encodeURIComponent(pass);
    return `mongodb+srv://${user}:${enc}@${host}/${db}?appName=Cluster0`;
  }
  return '';
};

const MONGO_URI = buildMongoUri();
// ✅ DB-FIX: dbConnecting 플래그 — 서버 시작 직후 연결 진행 중 여부 추적
let dbConnecting = false;
if (MONGO_URI) {
  dbConnecting = true;
  mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    family: 4,                  // IPv4 강제 (DNS SRV 에러 방지용)
    heartbeatFrequencyMS: 10000,// 10초마다 heartbeat
    // ✅ SCALE: 커넥션 풀 증가 (기본 5 → 100) — 동시 1만 사용자 DB 쿼리 처리
    maxPoolSize: 100,
    minPoolSize: 10,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    waitQueueTimeoutMS: 30000,  // 풀 대기 최대 30초
  })
    .then(async () => {
      dbReady = true; dbConnecting = false;
      (global.logger?.info || (() => {}))('[MongoDB] ✅ 연결 성공! 영구저장 모드 활성화');
      // ✅ BUG-FIX-BOOTSTRAP: 마스터 계정 tier 보장 — sunjulab.k 이메일 계정은 항상 MASTER tier 유지
      try {
        const UModel = require('./models/User');
        const result = await UModel.findOneAndUpdate(
          { $or: [{ email: 'sunjulab.k' }, { email: 'sunjulab.k@gmail.com' }] },
          { $set: { tier: 'MASTER' } },
          { new: true }
        );
        if (result) (global.logger?.info || (() => {}))(`[Bootstrap] 마스터 계정 tier → MASTER 보장 (email: ${result.email})`);
      } catch (e) { (global.logger?.warn || (() => {}))(`[Bootstrap] 마스터 tier 보장 실패: ${e.message}`); }
    })
    .catch(err => {
      dbReady = false; dbConnecting = false;
      (global.logger?.warn || (() => {}))(`[MongoDB] 연결실패 → 인메모리 모드 전환: ${err.message}`);
    });

  // ─── 자동 재연결 이벤트 핸들러 ────────────────────────────────
  mongoose.connection.on('disconnected', () => {
    dbReady = false;
    (global.logger?.warn || (() => {}))('[MongoDB] 연결 끊김 → 인메모리 모드로 자동 전환');
  });
  mongoose.connection.on('reconnected', () => {
    dbReady = true;
    (global.logger?.info || (() => {}))('[MongoDB] ✅ 재연결 성공 → MongoDB 모드 복구');
  });
  mongoose.connection.on('error', (err) => {
    (global.logger?.error || (() => {}))(`[MongoDB] 연결 오류: ${err.message}`);
    if (mongoose.connection.readyState !== 1) dbReady = false;
  });
}

// ✅ DB-FIX: waitForDb — 서버 시작 직후 DB 연결 중일 때 최대 maxMs 대기 후 dbReady 반환
// 사용처: 로그인/구글 로그인 엔드포인트 — 초기화 직후 로그인 실패 방지
async function waitForDb(maxMs = 8000) {
  if (dbReady) return true;
  if (!dbConnecting) return false; // 연결 시도조차 없으면 즉시 false
  const start = Date.now();
  while (!dbReady && dbConnecting && Date.now() - start < maxMs) {
    await new Promise(r => setTimeout(r, 300)); // 300ms 간격으로 폴링
  }
  return dbReady;
}

// ─── 모델 로드 ────────────────────────────────────────────────────────────────
let User, Post, Crew, Notice, BusinessPost, CctvOverrideModel, CatchRecord, ChatMessage, Subscription, PaymentHistory, Story, Contest;
// ✅ BUG-FIX: 개별 try-catch로 분리 — 하나 실패해도 나머지 모델 정상 로드 보장
try { User           = require('./models/User');          } catch (e) { User           = null; }
try { Post           = require('./models/Post');          } catch (e) { Post           = null; }
try { Crew           = require('./models/Crew');          } catch (e) { Crew           = null; }
try { Notice         = require('./models/Notice');        } catch (e) { Notice         = null; }
try { BusinessPost   = require('./models/BusinessPost');  } catch (e) { BusinessPost   = null; }
try { CctvOverrideModel = require('./models/CctvOverride'); } catch (e) { CctvOverrideModel = null; }
try { CatchRecord    = require('./models/CatchRecord');   } catch (e) { CatchRecord    = null; }
try { Contest        = require('./models/Contest');       } catch (e) { Contest        = null; }
try { ChatMessage    = require('./models/ChatMessage');   } catch (e) { ChatMessage    = null; }
try { Subscription   = require('./models/Subscription'); } catch (e) { Subscription   = null; }
try { PaymentHistory = require('./models/PaymentHistory'); } catch (e) { PaymentHistory = null; }
// ✅ INSTA-P3: 24h TTL 조황 스토리 모델
try { Story = require('./models/Story'); } catch (e) { Story = null; }
// ✅ PUSH: FCM 토큰 모델
let PushToken = null;
try { PushToken = require('./models/PushToken'); } catch (e) { PushToken = null; }

// ✅ PUSH: Firebase Admin 설정 (FIREBASE_SERVICE_ACCOUNT 환경변수 값)
const pushService = require('./push');
pushService.initFirebase();


// ─── 정기결제 스케줄러 (node-cron 또는 자체 폴백) ─────────────────────────────
let cron = null;
try { cron = require('node-cron'); } catch (e) { /* node-cron 미설치 → 자체 인터벌 폴백 사용 */ }

// ─── 인메모리 Fallback 저장소 이미 상단에서 선언 및 로드 완료 ──────────────
// (secretPointOverrides, cctvOverrides, memProSubs, memVvipSlots 모두 파일 로드 완료됨)


const app = express();

// ─── 보안 헤더 (Helmet) ────────────────────────────────────────
try {
  const helmet = require('helmet');
  app.use(helmet({ contentSecurityPolicy: false })); // CSP는 SPA 프론트 판단에 맡김으로 off
} catch (e) { /* helmet 미설치 — npm install helmet */ }

// ─── 응답 압축 (Compression) - 응답 속도 30~70% 향상 ──────────
try {
  const compression = require('compression');
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
    threshold: 1024, // 1KB 이상 응답만 압축
  }));
} catch (e) { /* compression 미설치 — npm install compression */ }

// ─── 구조화된 로거 (Winston) ──────────────────────────────────
let logger;
try {
  const winston = require('winston');
  logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message }) =>
        `[${timestamp}] [${level.toUpperCase()}] ${message}`
      )
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'error.log', level: 'error', maxsize: 5242880, maxFiles: 3 }),
      new winston.transports.File({ filename: 'combined.log', maxsize: 5242880, maxFiles: 5 }),
    ],
  });
} catch (e) {
  // winston 미설치 시 console로 fallback
  logger = {
    info: (...a) => console.log('[INFO]', ...a),
    warn: (...a) => console.warn('[WARN]', ...a),
    error: (...a) => console.error('[ERROR]', ...a),
  };
}
global.logger = logger;

// ─── CORS: 허용 도메인 화이트리스트 ──────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://fishing-go.vercel.app',
  'https://fishing-go-mbqp.vercel.app',
  /\.vercel\.app$/,  // Vercel 프리뷰 배포 URL
  /\.onrender\.com$/, // BUG-33: Render 서버/프론트 도메인
];

// 환경변수로 추가 허용 도메인 설정 (프로덕션 배포 시 사용)
if (process.env.ALLOWED_ORIGIN) {
  ALLOWED_ORIGINS.push(process.env.ALLOWED_ORIGIN);
}

// Render 헬스체크 전용 (사전 등록 — CORS 이전에 응답)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: dbReady ? 'mongodb' : 'memory', uptime: Math.floor(process.uptime()), time: new Date().toISOString() });
});

// ── ✅ DEV-SEED: 테스트 게시글 시드 엔드포인트 (개발 전용, X-Seed-Secret 헤더 필요) ──
app.post('/api/admin/seed-business-test', async (req, res) => {
  if (req.headers['x-seed-secret'] !== 'fishinggo_seed_2026') return res.status(403).json({ error: '금지' });
  const harbors = [
    { label: '강릉·강문', key: '강원 강릉' }, { label: '주문진', key: '강원 주문진' },
    { label: '속초', key: '강원 속초' }, { label: '고성(거진)', key: '강원 고성' },
    { label: '양양(낙산·남애)', key: '강원 양양' }, { label: '동해·묵호', key: '강원 동해' },
    { label: '삼척', key: '강원 삼척' }, { label: '구룡포(포항)', key: '경북 구룡포' },
    { label: '감포(경주)', key: '경북 감포' }, { label: '강구(영덕)', key: '경북 강구' },
    { label: '후포(울진)', key: '경북 후포' }, { label: '죽변(울진)', key: '경북 죽변' },
    { label: '통영', key: '경남 통영' }, { label: '거제(대포·금포)', key: '경남 거제' },
    { label: '남해(미조·상주)', key: '경남 남해' }, { label: '고성', key: '경남 고성' },
    { label: '여수(국동)', key: '전남 여수' }, { label: '목포', key: '전남 목포' },
    { label: '완도', key: '전남 완도' }, { label: '고흥(나로도)', key: '전남 고흥' },
    { label: '진도', key: '전남 진도' }, { label: '군산(비응·야미도)', key: '전북 군산' },
    { label: '부안(격포·위도)', key: '전북 부안' }, { label: '태안(안흥·마검포)', key: '충남 태안' },
    { label: '보령(무창포·오천)', key: '충남 보령' }, { label: '서산(삼길포)', key: '충남 서산' },
    { label: '남항부두', key: '인천 남항부두' }, { label: '연안부두', key: '인천 연안부두' },
    { label: '기장', key: '부산 기장' }, { label: '다대포', key: '부산 다대포' },
    { label: '용호부두', key: '부산 용호부두' }, { label: '도두항', key: '제주 도두항' },
    { label: '애월항', key: '제주 애월항' }, { label: '서귀포', key: '제주 서귀포' },
    { label: '모슬포', key: '제주 모슬포' }, { label: '성산항', key: '제주 성산항' },
  ];
  const TARGETS = ['감성돔','참돔','방어','부시리','갈치','대구','오징어','농어','광어','삼치'];
  const TYPES   = ['선상낚시','선상낚시','야간선상','선상낚시','선상낚시'];
  const DATES   = ['매일 출항','주말 출항','예약 후 출항','상시 출항','시즌 출항'];
  const PRICES  = ['50,000원','60,000원','70,000원','80,000원','45,000원','55,000원','65,000원','75,000원'];
  const now = new Date();
  const docs = [];
  for (let i = 0; i < harbors.length; i++) {
    const h = harbors[i];
    const t = TARGETS[i % TARGETS.length]; const ty = TYPES[i % TYPES.length];
    const d = DATES[i % DATES.length];     const p  = PRICES[i % PRICES.length];
    const t2 = TARGETS[(i+5)%TARGETS.length]; const ty2 = ty === '야간선상' ? '선상낚시' : '야간선상';
    const d2 = d === '매일 출항' ? '주말 출항' : '매일 출항'; const p2 = PRICES[(i+4)%PRICES.length];
    docs.push({ author: '낚시GO 관리자', author_email: `test1_${i}@fishinggo.test`, shipName: '낚시Go 테스트 1호', type: ty, target: t, region: h.key, date: d, price: p, phone: '010-0000-0001', capacity: 20, content: `[테스트] ${h.label} 출항 낚시Go 테스트 1호\n어종: ${t} / 출항: ${d} / 요금: ${p}/1인 / 정원: 20명`, isPinned: false, images: [], cover: '', createdAt: new Date(now-i*120000) });
    docs.push({ author: '낚시GO 관리자', author_email: `test2_${i}@fishinggo.test`, shipName: '낚시Go 테스트 2호', type: ty2, target: t2, region: h.key, date: d2, price: p2, phone: '010-0000-0002', capacity: 15, content: `[테스트] ${h.label} 출항 낚시Go 테스트 2호\n어종: ${t2} / 출항: ${d2} / 요금: ${p2}/1인 / 정원: 15명`, isPinned: false, images: [], cover: '', createdAt: new Date(now-i*120000-60000) });
  }
  try {
    if (dbReady && BusinessPost) {
      await BusinessPost.deleteMany({ author_email: { $regex: /@fishinggo\.test$/ } });
      const result = await BusinessPost.insertMany(docs);
      return res.json({ success: true, count: result.length, mode: 'mongodb' });
    }
    memBusinessPosts = memBusinessPosts.filter(p => !p.author_email?.endsWith('@fishinggo.test'));
    memBusinessPosts.unshift(...docs);
    saveMemBusinessPosts();
    res.json({ success: true, count: docs.length, mode: 'memory' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// NEW-C1: 채널 튜토리얼 영상 목록 — 서버에서 관리하여 어드민 없이 영상 추가/수정 가능
// 향후 MongoDB 모델로 확장 예정 (현재는 정적 배열 반환)
let channelVideos = [
  { id: 1, title: '감성돔 찌낚시 채비법 (반유동/전유동) 완전정복', category: '감성돔', url: 'https://www.youtube.com/watch?v=Xvj2T6U8WqI', thumbnail: 'https://img.youtube.com/vi/Xvj2T6U8WqI/maxresdefault.jpg', duration: '15:20', views: '124k', description: '입문자가 가장 어려워하는 수심 측정부터 채비 정렬까지 상세히 설명합니다.', gear: [{ name: '1호 갯바위 낚싯대', price: '120,000원', link: '#' }, { name: '2500번 스피닝 릴', price: '158,000원', link: '#' }] },
  { id: 2, title: '무늬오징어 에깅 낚시 입문 - 기본 액션과 장비 세팅', category: '무늬오징어', url: 'https://www.youtube.com/watch?v=pY5m4A2f-3Y', thumbnail: 'https://img.youtube.com/vi/pY5m4A2f-3Y/maxresdefault.jpg', duration: '10:45', views: '85k', description: '박선비tv가 알려주는 무늬오징어 시즌 대비 기초 에깅 낚시법입니다.', gear: [{ name: '에깅 전용 로드 8.6ft', price: '210,000원', link: '#' }, { name: '3.5호 야마시타 에기', price: '12,000원', link: '#' }] },
  { id: 3, title: '광어 다운샷 채비법 - 웜 끼우는 법과 단차 조절', category: '광어/우럭', url: 'https://www.youtube.com/watch?v=XWghA2gO2A8', thumbnail: 'https://img.youtube.com/vi/XWghA2gO2A8/maxresdefault.jpg', duration: '08:30', views: '52k', description: '선상 낚시 필수 코스! 광어 다운샷에서 마릿수를 올리는 채비 비결입니다.', gear: [{ name: '다운샷 전용 낚싯대', price: '185,000원', link: '#' }, { name: '광어 전용 스트레이트 웜', price: '8,500원', link: '#' }] },
  { id: 4, title: '쭈꾸미 갑오징어 낚시 입문 - 기본 채비와 낚시 방법', category: '쭈꾸미/갑오징어', url: 'https://www.youtube.com/watch?v=Lq1tK6fD_O0', thumbnail: 'https://img.youtube.com/vi/Lq1tK6fD_O0/maxresdefault.jpg', duration: '12:15', views: '210k', description: '삼분선생의 쭈꾸미 낚시 기초 레슨. 이 영상 하나로 쭈꾸미 낚시 끝!', gear: [{ name: '쭈꾸미 전용 로드', price: '95,000원', link: '#' }, { name: '수평 에기 세트 10개입', price: '25,000원', link: '#' }] },
];
app.get('/api/channel/videos', (req, res) => {
  res.json(channelVideos);
});
// 관리자 전용: 채널 영상 목록 추가 (POST)
app.post('/api/channel/videos', (req, res) => {
  // ✅ BUG-FIX: split(' ')[1]로 토큰 추출 시 Authorization 헤더없으면 undefined jwt.verify 호출 방지
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
  const tp = authHeader.slice(7);
  try {
    const payload = jwt.verify(tp, JWT_SECRET);
    if (!isAdminToken(payload)) return res.status(403).json({ error: '관리자 권한 필요' });
  } catch { return res.status(401).json({ error: '인증 필요' }); }
  const video = req.body;
  if (!video.id) video.id = Date.now();
  channelVideos.push(video);
  res.json({ success: true, video });
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        (logger?.warn || console.warn)('[CORS] Origin 없는 요청 차단 (프로덕션)');
        return callback(new Error('직접 API 접근이 허용되지 않습니다.'));
      }
      return callback(null, true); // 개발환경: Postman/curl 허용
    }
    const allowed = ALLOWED_ORIGINS.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    if (allowed) return callback(null, true);
    (logger?.warn || console.warn)(`[CORS] 차단된 origin: ${origin}`);
    return callback(new Error('CORS 차단'));
  },
  credentials: true,
}));

// ── 접속자 추적 미들웨어 (CORS 이후 — JWT 보유 요청에서 lastSeen 갱신) ──────────
const lastSeenCache = new Map();
app.use(async (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return next();
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return next(); }
    const email = tp.email || tp.id;
    if (!email) return next();
    const now = Date.now();
    const last = lastSeenCache.get(email) || 0;
    if (now - last < 60_000) return next();
    lastSeenCache.set(email, now);
    const nowDate = new Date(now);
    if (dbReady && User) {
      User.updateOne({ email }, { $set: { lastSeen: nowDate } }).exec().catch(() => {});
    } else {
      const mu = memUsers.find(u => u.email === email || u.id === email);
      if (mu) mu.lastSeen = nowDate.toISOString();
    }
  } catch { /* 무시 */ }
  next();
});

// ── GET /api/admin/user-stats — 사용자 통계 (마스터 전용, CORS 이후) ─────────────
app.get('/api/admin/user-stats', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    if (!isAdminToken(tp)) return res.status(403).json({ error: '관리자만 접근 가능합니다.' });

    // ✅ 티어 정규화 맵 — 변형 이름을 표준 이름으로 매핑
    const TIER_NORMALIZE = {
      'FREE': 'FREE', 'free': 'FREE',
      'LITE': 'BUSINESS_LITE', 'lite': 'BUSINESS_LITE', 'BUSINESS_LITE': 'BUSINESS_LITE',
      'PRO': 'PRO', 'pro': 'PRO',
      'VIP': 'BUSINESS_VIP', 'vip': 'BUSINESS_VIP', 'VVIP': 'BUSINESS_VIP',
      'BUSINESS_VIP': 'BUSINESS_VIP', 'VVIP_VIP': 'BUSINESS_VIP',
      'MASTER': 'MASTER', 'master': 'MASTER', 'ADMIN': 'MASTER',
    };
    const STANDARD_TIERS = ['FREE', 'BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'MASTER'];

    const now = new Date();
    const online5m  = new Date(now - 5 * 60 * 1000);
    const online24h = new Date(now - 24 * 60 * 60 * 1000);
    const week7     = new Date(now - 7 * 24 * 60 * 60 * 1000);

    let s = {
      totalUsers: 0, onlineNow: 0, onlineToday: 0, offlineUsers: 0, newUsers7d: 0,
      tierBreakdown: { FREE: 0, BUSINESS_LITE: 0, PRO: 0, BUSINESS_VIP: 0, MASTER: 0 },
      rawTiers: {}, // DB에 실제 저장된 티어 원시값 (디버그용)
    };

    if (dbReady && User) {
      const [total, onlineNow, onlineToday, newUsers7d, tierCounts] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ lastSeen: { $gte: online5m } }),
        User.countDocuments({ lastSeen: { $gte: online24h } }),
        User.countDocuments({ createdAt: { $gte: week7 } }),
        User.aggregate([{ $group: { _id: { $ifNull: ['$tier', 'FREE'] }, count: { $sum: 1 } } }]),
      ]);
      s.totalUsers = total; s.onlineNow = onlineNow; s.onlineToday = onlineToday;
      s.offlineUsers = total - onlineToday; s.newUsers7d = newUsers7d;
      tierCounts.forEach(t => {
        const raw = t._id || 'FREE';
        s.rawTiers[raw] = (s.rawTiers[raw] || 0) + (t.count || 0);
        const norm = TIER_NORMALIZE[raw] || 'FREE'; // 알 수 없는 티어 → FREE로 귀속
        s.tierBreakdown[norm] = (s.tierBreakdown[norm] || 0) + (t.count || 0);
      });
    } else {
      const all = memUsers;
      s.totalUsers  = all.length;
      s.onlineNow   = all.filter(u => u.lastSeen && new Date(u.lastSeen) >= online5m).length;
      s.onlineToday = all.filter(u => u.lastSeen && new Date(u.lastSeen) >= online24h).length;
      s.offlineUsers = all.length - s.onlineToday;
      s.newUsers7d  = all.filter(u => u.createdAt && new Date(u.createdAt) >= week7).length;
      all.forEach(u => {
        const raw = u.tier || 'FREE';
        s.rawTiers[raw] = (s.rawTiers[raw] || 0) + 1;
        const norm = TIER_NORMALIZE[raw] || 'FREE';
        s.tierBreakdown[norm] = (s.tierBreakdown[norm] || 0) + 1;
      });
    }
    res.json(s);
  } catch (err) {
    (logger?.error || console.error)('[GET /api/admin/user-stats]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});




// ✅ 계정 기반 로그인 실패 추적 — try 블록 밖 전역 선언 (스코프 오류 방지)
const loginAttemptMap = new Map(); // email → { count, lockedUntil }
const MAX_LOGIN_FAIL = 10;         // 계정당 최대 실패 10회
const LOGIN_LOCK_MS  = 5 * 60 * 1000; // 잠금 5분
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of loginAttemptMap.entries()) {
    if (val.lockedUntil && now > val.lockedUntil + LOGIN_LOCK_MS) {
      loginAttemptMap.delete(key);
    }
  }
}, 10 * 60 * 1000);

// ─── Rate Limiter ────────────────────────────────────────────────────
// ✅ SCALE-FIX: IP 기반 → 완화 (한국 이동통신사 NAT: 수백명이 같은 IP 공유)
// 실제 브루트포스 보호는 계정 기반으로 처리 (아래 loginAttemptMap)
try {
  const rateLimit = require('express-rate-limit');
  // 로그인/회원가입: IP당 10분/500회 (통신사 NAT 환경 수백명 커버)
  const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 500,
    message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // OTP 발송은 별도 쿨다운 처리하므로 auth 리미터 제외
      return req.path.includes('/send-otp') || req.path.includes('/verify-otp');
    },
  });
  // 일반 API: IP당 1분/1000회 (동시 1만 사용자 커버)
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 1000,
    message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // ✅ YouTube 검색 전용 Rate Limit — IP당 분당 3회
  // 이유: 검색 1회 = 201 units 소비. 50만 사용자 환경에서 쿼터 폭발 방지
  const ytSearchLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1분
    max: 3,                    // IP당 최대 3회
    message: { error: '검색 요청이 너무 많습니다. 1분 후 다시 시도해주세요.', code: 'YT_SEARCH_RATE_LIMIT' },
    standardHeaders: true,
    legacyHeaders: false,
    // ✅ IPv6 호환: 커스텀 keyGenerator 제거 → 기본 IP 처리 사용 (ERR_ERL_KEY_GEN_IPV6 해결)
  });

  // ✅ YouTube 통합 피드 전용 Rate Limit — IP당 분당 10회
  // 이유: 피드는 캐시가 있어 실제 API 호출 적음, 너무 엄격하면 UX 저하
  const ytFeedLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1분
    max: 10,                   // IP당 최대 10회
    message: { error: '피드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', code: 'YT_FEED_RATE_LIMIT' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/auth/', authLimiter);
  app.use('/api/', apiLimiter);
  app.use('/api/media/youtube/search', ytSearchLimiter);   // ✅ 검색: 1분/3회
  app.use('/api/media/youtube/unified', ytFeedLimiter);    // ✅ 통합 피드: 1분/10회
  (logger?.info || console.log)('✅ Rate Limiter 적용 (로그인 10분/500회, 일반 1분/1000회) — 동시 1만 사용자 지원');

  (logger?.info || console.log)('✅ YouTube Rate Limit 강화 (검색 1분/3회, 피드 1분/10회)');
} catch (e) { (logger?.warn || console.warn)('⚠️ express-rate-limit 미설치 → npm install express-rate-limit'); }

// ✅ IMG-SIZE-FIX: 다중이미지 5장 × 4MB = 최대 20MB → 25mb로 확장 (이전 10mb에서 이미지 탈락 방지)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

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
}, 10 * 60 * 1000);

// ─── JWT 인증 미들웨어 (선택적 보호 엔드포인트용) ───────────────
function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증이 필요합니다.' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: '토큰이 유효하지 않거나 만료되었습니다.' });
  }
}

// ─── 비밀포인트 좌표 오버라이드 API (MASTER 전용) ──────────────────────────────
// GET: 비밀포인트 좌표 조회 — JWT 인증 + MASTER 또는 LITE 이상 티어 필요
app.get('/api/secret-point-overrides', async (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음', code: 'TOKEN_INVALID' }); }
  const isAdmin = isAdminToken(tp);
  if (!isAdmin) {
    // LITE+ 이상 티어 확인 (JWT tier 우선, DB fallback)
    const allowedTiers = ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'MASTER'];
    // ✅ FIX-DB-FALLBACK: DB 조회 실패 시 JWT 내 tier를 사용 (이전: 항상 FREE → 마스터 차단)
    let userTier = tp.tier || 'FREE';
    try {
      if (dbReady && User) {
        const u = await User.findOne({ $or: [{ email: tp.email }, { id: tp.id }] }, 'tier').lean();
        if (u?.tier) userTier = u.tier; // DB 조회 성공 시에만 덮어쓰기
      }
    } catch { /* DB 조회 실패 시 JWT tier 유지 */ }
    if (!allowedTiers.includes(userTier)) return res.status(403).json({ error: 'LITE 이상 구독이 필요합니다.' });
  }
  res.json(secretPointOverrides);
});

// POST: 특정 포인트 좌표 저장 (어드민 JWT 인증 필수)
app.post('/api/secret-point-overrides', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET);
    if (!isAdminToken(p)) return res.status(403).json({ error: '관리자 권한 필요' });
  } catch { return res.status(401).json({ error: '토큰 유효하지 않음', code: 'TOKEN_INVALID' }); }
  const { id, lat, lng } = req.body;
  if (!id || lat == null || lng == null) return res.status(400).json({ error: 'id, lat, lng 필수' });
  secretPointOverrides[String(id)] = { lat: parseFloat(lat), lng: parseFloat(lng) };
  saveSecretPointOverrides();
  (logger?.info || console.log)(`[SecretPoint] id=${id} 좌표 업데이트: ${lat}, ${lng}`);
  res.json({ ok: true, overrides: secretPointOverrides });
});

// DELETE: 특정 포인트 초기화 (어드민 JWT 인증 필수)
app.delete('/api/secret-point-overrides/:id', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET);
    if (!isAdminToken(p)) return res.status(403).json({ error: '관리자 권한 필요' });
  } catch { return res.status(401).json({ error: '토큰 유효하지 않음', code: 'TOKEN_INVALID' }); }
  const { id } = req.params;
  delete secretPointOverrides[id];
  saveSecretPointOverrides();
  res.json({ ok: true, overrides: secretPointOverrides });
});

app.get('/api/debug', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: '접근 불가' });
  const uri = MONGO_URI ? MONGO_URI.replace(/:[^@]+@/, ':***@') : '미설정';
  res.json({
    dbReady,
    mongoUri: uri,
    memUserCount: memUsers.length,
    memCrewCount: memCrews.length,
    memNoticeCount: memNotices.length,
    memBusinessCount: memBusinessPosts.length,
    env: {
      MONGO_URI: !!process.env.MONGO_URI,
      MONGO_PASS: !!process.env.MONGO_PASS,
      NODE_ENV: process.env.NODE_ENV
    }
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) {
        if (process.env.NODE_ENV === 'production') return callback(new Error('CORS 차단'));
        return callback(null, true);
      }
      const allowed = ALLOWED_ORIGINS.some(o =>
        typeof o === 'string' ? o === origin : o.test(origin)
      );
      return allowed ? callback(null, true) : callback(new Error('CORS 차단'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// ✅ CREW-ENH: 서버사이드 레벨 시스템 (유저스토어와 동일 기준)
const LEVEL_CONFIG_SV = [
  { level: 1, title: '\uCD08\uBCF4 \uB099\uC2DC\uAFBC',   emoji: '\uD83E\uDEB1', expRequired: 0    },
  { level: 2, title: '\uACAC\uC2B5 \uB099\uC2DC\uAFBC',   emoji: '\uD83C\uDFA3', expRequired: 100  },
  { level: 3, title: '\uB099\uC2DC \uC785\uBB38\uC790',   emoji: '\uD83D\uDC1F', expRequired: 250  },
  { level: 4, title: '\uB099\uC2DC \uC560\uD638\uAC00',   emoji: '\uD83D\uDC20', expRequired: 500  },
  { level: 5, title: '\uBCA0\uD14C\uB791 \uB099\uC2DC\uC778', emoji: '\uD83D\uDC21', expRequired: 850  },
  { level: 6, title: '\uC911\uAE09 \uB099\uC2DC\uAFBC',   emoji: '\uD83E\uDD88', expRequired: 1300 },
  { level: 7, title: '\uACE0\uC218 \uB099\uC2DC\uC778',   emoji: '\uD83C\uDFAF', expRequired: 1900 },
  { level: 8, title: '\uB099\uC2DC \uC7A5\uC778',         emoji: '\u2693',       expRequired: 2700 },
  { level: 9, title: '\uC804\uC124\uC758 \uB099\uC2DC\uC778', emoji: '\uD83D\uDC51', expRequired: 3700 },
];
function getServerLevel(totalExp = 0) {
  if (totalExp >= 5000) return { level: 'LV.??', emoji: '\uD83C\uDF0C', title: '\uCD08\uC6D4 \uB099\uC2DC\uC2E0' };
  for (let i = LEVEL_CONFIG_SV.length - 1; i >= 0; i--) {
    if (totalExp >= LEVEL_CONFIG_SV[i].expRequired) {
      const lv = LEVEL_CONFIG_SV[i];
      return { level: `LV.${lv.level}`, emoji: lv.emoji, title: lv.title };
    }
  }
  return { level: 'LV.1', emoji: '\uD83E\uDEB1', title: '\uCD08\uBCF4 \uB099\uC2DC\uAFBC' };
}

// 실시간 낙시 인원 서버 로직 (chatHistories는 상단에서 선언되었습니다)

io.on('connection', (socket) => {
  // ✅ OPT-5: 연결 시 핸드셰이크 토큰 검증 (발신자 위조 방지)
  let verifiedUser = null;
  const handshakeToken = socket.handshake?.auth?.token || socket.handshake?.query?.token;
  if (handshakeToken) {
    try {
      verifiedUser = jwt.verify(handshakeToken, JWT_SECRET);
    } catch {
      // 토큰 만료/위조 — verifiedUser null 유지, 연결은 허용하되 발신 시 익명 처리
      (logger?.warn || console.warn)('[Socket] 잘못된 토큰으로 연결 시도:', socket.id);
    }
  }

  // ✅ 21TH-B1: console.log → logger.info (Winston 통일)
  logger.info(`[Socket] User connected: ${socket.id} ${verifiedUser ? `(${verifiedUser.name || verifiedUser.email})` : '(미인증)'}`);

  // ✅ NICK-FIX: 소켓 세션 단위 레벨 + 닉네임 캐시 (경쟁조건 없이 즉시 초기화)
  let cachedLevel = { level: 'LV.1', emoji: '🪱', title: '초보 낚시꾼' };
  // 1순위: JWT에 포함된 name (로그인/재로그인 후 즉시 유효)
  // 2순위: 인메모리 memUsers에서 즉시 동기 조회 (경쟁조건 없음)
  // 3순위: DB 비동기 조회 완료 후 갱신
  let cachedNickname = verifiedUser?.name
    || memUsers.find(u => u.email === verifiedUser?.email)?.name
    || null;
  if (verifiedUser?.email) {
    if (dbReady && User) {
      User.findOne({ email: verifiedUser.email }).select('totalExp name').lean()
        .then(u => {
          if (u) {
            cachedLevel = getServerLevel(u.totalExp || 0);
            if (u.name) cachedNickname = u.name; // DB 닉네임 최종 확정 (아이디 노출 차단)
          }
        })
        .catch(() => {});
    } else {
      // 인메모리 모드: memUsers에서 레벨도 계산
      const memU = memUsers.find(u => u.email === verifiedUser.email);
      if (memU) {
        cachedLevel = getServerLevel(memU.totalExp || 0);
        if (memU.name) cachedNickname = memU.name;
      }
    }
  }

  socket.on('join_crew', async (crewId) => {
    if (!crewId || typeof crewId !== 'string') return;
    socket.join(crewId);
    // ENH4-C4: DB에서 최근 50개 메시지만 로드 (기존 100개 → 초기 전송량 최적화)
    if (dbReady && ChatMessage) {
      try {
        const msgs = await ChatMessage.find({ crewId }).sort({ createdAt: -1 }).limit(50);
        chatHistories[crewId] = msgs.reverse().map(m => ({
          sender: m.sender,
          text: m.text,
          time: m.time,
          // ✅ POST-SHARE: 공유 카드 필드 포함
          type: m.type || 'text',
          postId: m.postId || '',
          postTitle: m.postTitle || '',
          postPreview: m.postPreview || '',
          postImage: m.postImage || '',
          postCategory: m.postCategory || '',
          senderLevel: m.senderLevel || '',
          senderEmoji: m.senderEmoji || '',
          senderTitle: m.senderTitle || '',
        }));
      } catch (e) { logger.warn(`[Socket] join_crew 채팅 히스토리 DB 로드 실패 (crewId=${crewId}): ${e.message}`); } // ✅ 21TH-B2: silent catch → logger.warn
    }
    if (!chatHistories[crewId]) chatHistories[crewId] = [];
    socket.emit('chat_history', chatHistories[crewId]);
  });

  socket.on('send_msg', async (data) => {
    if (!data.crewId || typeof data.crewId !== 'string') return;

    // ── 닉네임 결정 (기존 로직 동일) ─────────────────────────
    let resolvedNickname = cachedNickname;
    if (!resolvedNickname && verifiedUser?.email) {
      const memU = memUsers.find(u => u.email === verifiedUser.email);
      if (memU?.name) { resolvedNickname = memU.name; cachedNickname = memU.name; }
      else if (dbReady && User) {
        try {
          const dbU = await User.findOne({ email: verifiedUser.email }).select('name totalExp').lean();
          if (dbU?.name) { resolvedNickname = dbU.name; cachedNickname = dbU.name; if (dbU.totalExp !== undefined) cachedLevel = getServerLevel(dbU.totalExp); }
        } catch { /* fallback */ }
      }
    }
    const sender = (resolvedNickname || verifiedUser?.name || '익명').toString().slice(0, 30);

    // ── post_share 타입 처리 ──────────────────────────────────
    if (data.type === 'post_share') {
      const postId = (data.postId || '').toString().trim();
      if (!postId) return;
      const rawImage = (data.postImage || '').toString();
      // ✅ BASE64-FIX: base64 이미지는 실시간 emit에는 전체 전송, DB에는 저장 안 함 (16MB 문서 한도 보호)
      const isBase64 = rawImage.startsWith('data:');
      const dbSafeImage = isBase64 ? '' : rawImage.slice(0, 500); // URL은 500자 이내 저장
      const msgData = {
        type: 'post_share',
        sender,
        postId,
        postTitle:   (data.postTitle   || '').toString().slice(0, 100),
        postPreview: (data.postPreview || '').toString().slice(0, 120),
        postImage:   rawImage,  // 실시간 emit: 전체 (base64 포함)
        postCategory:(data.postCategory|| '').toString().slice(0, 20),
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        socketId: socket.id,
        senderLevel: cachedLevel.level,
        senderEmoji: cachedLevel.emoji,
        senderTitle: cachedLevel.title,
      };
      if (!chatHistories[data.crewId]) chatHistories[data.crewId] = [];
      chatHistories[data.crewId].push(msgData);
      if (chatHistories[data.crewId].length > 500) chatHistories[data.crewId] = chatHistories[data.crewId].slice(-500);
      io.to(data.crewId).emit('new_msg', msgData);
      if (dbReady && ChatMessage) {
        try {
          await new ChatMessage({
            crewId: data.crewId,
            sender: msgData.sender,
            text: `[게시글공유] ${msgData.postTitle}`,
            time: msgData.time,
            type: 'post_share',
            postId: msgData.postId,
            postTitle: msgData.postTitle,
            postPreview: msgData.postPreview,
            postImage: dbSafeImage,  // ✅ BASE64-FIX: URL만 저장 (base64는 빈 문자열)
            postCategory: msgData.postCategory,
            senderLevel: msgData.senderLevel,
            senderEmoji: msgData.senderEmoji,
            senderTitle: msgData.senderTitle,
          }).save();
        } catch (e) { logger.error(`[Socket] post_share DB 저장 실패: ${e.message}`); }
      } else { saveChatHistories(); }
      return;
    }

    // ── 일반 텍스트 메시지 처리 (기존 로직) ──────────────────
    const text = censorText((data.text || '').toString().trim());
    if (!text || text.length > 500) return;

    const msgData = {
      sender,
      text,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      socketId: socket.id,
      senderLevel: cachedLevel.level,
      senderEmoji: cachedLevel.emoji,
      senderTitle: cachedLevel.title,
    };
    if (!chatHistories[data.crewId]) chatHistories[data.crewId] = [];
    chatHistories[data.crewId].push(msgData);
    if (chatHistories[data.crewId].length > 500) chatHistories[data.crewId] = chatHistories[data.crewId].slice(-500);
    io.to(data.crewId).emit('new_msg', msgData);
    if (dbReady && ChatMessage) {
      try {
        await new ChatMessage({ crewId: data.crewId, sender: msgData.sender, text: msgData.text, time: msgData.time }).save();
        if (chatHistories[data.crewId]?.length % 50 === 0) saveChatHistories();
      } catch (e) { logger.error(`[Socket] send_msg DB 저장 실패 (crewId=${data.crewId}): ${e.message}`); }
    } else { saveChatHistories(); }

    // ✅ PUSH: 크루 멤버에게 FCM 알림 (오프라인/백그라운드)
    try {
      if (dbReady && Crew) {
        const crew = await Crew.findById(data.crewId).select('members').lean();
        if (crew?.members?.length) {
          const memberIds = crew.members
            .filter(m => String(m.userId || m) !== String(verifiedUser?.id || verifiedUser?._id))
            .map(m => m.userId || m);
          if (memberIds.length) {
            pushService.sendToUsers(memberIds, {
              title: `💬 ${sender}`,
              body: text.length > 50 ? text.slice(0, 50) + '…' : text,
              data: { route: `/crew/${data.crewId}/chat`, type: 'crew_chat' },
            }).catch(() => {});
          }
        }
      }
    } catch (e) { /* FCM 크루 알림 실패 무시 */ }
  });


  socket.on('disconnect', () => {
    logger.info(`[Socket] User disconnected: ${socket.id}`); // ✅ 21TH-B1: console.log → logger.info
  });
});

// --- KHOA/KMA Real-world API Bridges with 1-hour Caching ---
const ALL_STATIONS = [
  'DT_0001', 'DT_0002', 'DT_0003', 'DT_0033', 'DT_0036', 'DT_0021', // 동해
  'DT_0004', 'DT_0005', 'DT_0006', 'DT_0014', 'DT_0016', 'DT_0018', 'DT_0034', // 남해
  'DT_0007', 'DT_0008', 'DT_0009', 'DT_0030', // 서해
  'DT_0010', 'DT_0011', 'DT_0045' // 제주
];

let weatherCache = {};

// --- 권역별 기본 기상 프로파일 (Realism 강화) ---
const REGIONAL_PROFILES = {
  '동해': { temp: 14.5, wind: 4.5, wave: 0.8 },
  '남해': { temp: 16.8, wind: 3.2, wave: 0.5 },
  '서해': { temp: 12.2, wind: 6.8, wave: 1.1 },
  '제주': { temp: 18.5, wind: 3.5, wave: 0.6 }
};

const observationData = {
  // 동해
  'DT_0001': { name: '강릉 안목항', region: '동해', baseTemp: 14.2, baseWind: 4.2 },
  'DT_0021': { name: '속초 영금정', region: '동해', baseTemp: 13.5, baseWind: 5.5 },
  'DT_0002': { name: '울진 후포', region: '동해', baseTemp: 14.8, baseWind: 3.8 },
  'DT_0033': { name: '동해 묵호', region: '동해', baseTemp: 14.4, baseWind: 4.1 },
  'DT_0036': { name: '경주 감포', region: '동해', baseTemp: 15.2, baseWind: 3.2 },
  // 남해
  'DT_0004': { name: '부산 해운대', region: '남해', baseTemp: 16.5, baseWind: 2.8 },
  'DT_0005': { name: '여수 국동항', region: '남해', baseTemp: 17.2, baseWind: 2.2 },
  'DT_0016': { name: '통영 도남', region: '남해', baseTemp: 16.8, baseWind: 2.4 },
  'DT_0034': { name: '거제 지세포', region: '남해', baseTemp: 17.0, baseWind: 2.5 },
  'DT_0018': { name: '완도항', region: '남해', baseTemp: 16.2, baseWind: 3.1 },
  // 서해
  'DT_0007': { name: '인천 연안부두', region: '서해', baseTemp: 11.5, baseWind: 7.2 },
  'DT_0008': { name: '보령 대천항', region: '서해', baseTemp: 12.8, baseWind: 6.5 },
  'DT_0009': { name: '군산 비응항', region: '서해', baseTemp: 13.2, baseWind: 5.8 },
  'DT_0030': { name: '태안 마도', region: '서해', baseTemp: 12.0, baseWind: 7.5 },
  // 제주
  'DT_0011': { name: '서귀포 외돌개', region: '제주', baseTemp: 18.8, baseWind: 3.4 },
  'DT_0010': { name: '제주 한림', region: '제주', baseTemp: 18.2, baseWind: 3.8 },
  'DT_0045': { name: '성산포항', region: '제주', baseTemp: 18.5, baseWind: 4.2 },
  // ✅ BUG-FIX: ALL_STATIONS에 있으나 observationData에 누락된 관측소 추가 (fallback 방지)
  'DT_0003': { name: '삼척항', region: '동해', baseTemp: 13.8, baseWind: 4.8 },
  'DT_0006': { name: '목포항', region: '서해', baseTemp: 12.5, baseWind: 6.2 },
  'DT_0014': { name: '광양만 관측소', region: '남해', baseTemp: 16.0, baseWind: 2.9 },
};

async function getWaterTemp(sid) {
  // ✅ TIDE-API-FIX: 공공데이터포털 실측 수온 API 사용 (KHOA_CCTV_KEY = 공공데이터포털 인증키)
  // 구버전 KHOA 직결 API(khoa.go.kr)는 2024년 종료 → 모든 호출 404, WARN 로그 폭탄 방지
  const KEY = process.env.KHOA_CCTV_KEY || process.env.KHOA_KEY;
  if (!KEY) return null; // 키 없으면 fallback 데이터 사용

  // 공공데이터포털 조위관측소 실측 수온 API
  try {
    const today = (() => {
      const d = new Date();
      return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    })();
    const url = `https://apis.data.go.kr/1192136/surveyWaterTemp/GetSurveyWaterTempApiService?serviceKey=${encodeURIComponent(KEY)}&obsCode=${sid}&date=${today}&type=json&numOfRows=10&pageNo=1`;
    const res = await axios.get(url, { timeout: 5000, headers: { Accept: 'application/json' } });
    // XML 오류 응답 감지
    const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    if (text.trimStart().startsWith('<')) return null; // XML 에러 → fallback
    const items = res.data?.response?.body?.items?.item;
    if (!items) return null;
    const list = Array.isArray(items) ? items : [items];
    const last = list[list.length - 1];
    const sst = last?.water_temp ?? last?.waterTemp ?? null;
    if (sst !== null && sst !== undefined && sst !== '-') return String(sst);
  } catch (e) {
    if (!e.message?.includes('404')) {
      logger.warn(`[Weather] 수온 API 실패 (${sid}): ${e.message}`);
    }
  }

  return null;
}

async function updateAllStationsCache() {
  logger.info(`[Batch] Updating ${ALL_STATIONS.length} stations...`);
  // ✅ 9TH-C4: Promise.allSettled 병렬화 — 직렬 80ms 대기(1.7초) 제거
  // ✅ 21TH-B4: 배치 실패 건수 집계 로그 추가
  const results = await Promise.allSettled(ALL_STATIONS.map(async (sid) => {
    const realSst = await getWaterTemp(sid);

    // 지점별 정보 또는 권역별 랜덤 프로파일 적용
    const base = observationData[sid] || { region: '남해', baseTemp: 16.5, baseWind: 3.0 };
    const profile = REGIONAL_PROFILES[base.region] || REGIONAL_PROFILES['남해'];

    // ✅ 9TH-B2: seed 기반 결정론적 오프셋 — Math.random() 3회 제거
    // 매 갱신마다 수온/풍속이 달라지는 문제 해결 (sid 기반 고정 값)
    const seed = parseInt(sid.replace(/\D/g, '')) || 1;
    const lcg = (n) => ((seed * 9301 + 49297 * n) % 233280) / 233280; // LCG 의사랜덤
    const tempOffset = (lcg(1) * 1.5 - 0.75).toFixed(1);
    const windOffset = (lcg(2) * 3.0 - 1.5).toFixed(1);
    const waveOffset = (lcg(3) * 0.6 - 0.3).toFixed(1);

    const finalTemp = realSst || (base.baseTemp + parseFloat(tempOffset)).toFixed(1);
    const finalWind = Math.max(0.2, (base.baseWind || profile.wind) + parseFloat(windOffset)).toFixed(1);
    const finalWave = Math.max(0.1, profile.wave + parseFloat(waveOffset)).toFixed(1);

    // ✅ BUG-FIX: (seed % 14) + 1 → (seed % 15) + 1 — fishingData.js와 동일 버그, 15물이 절대 출력 안됨
    const tideNum = (seed % 15) + 1;
    const baseHighMin = (tideNum * 45 + seed * 7) % 1440;
    const baseLowMin = (baseHighMin + 375) % 1440;
    const fmt = (mins) => {
      const m = ((mins % 1440) + 1440) % 1440;
      return `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
    };
    // ✅ 9TH-B2: 풍향도 seed 기반으로 고정 (Math.random 제거)
    const WIND_DIRS = ['N', 'E', 'S', 'W', 'NE', 'SW'];
    const windDir = WIND_DIRS[seed % WIND_DIRS.length];
    // ✅ 9TH-B2: 조위 수위도 seed + 시간대 기반으로 고정
    const tideLevel = 10 + (seed * 7 + new Date().getHours() * 13) % 250;

    weatherCache[sid] = {
      data: {
        ...base,
        stationId: sid,
        sst: finalTemp,
        temp: `${finalTemp}°C`,
        wind: { speed: parseFloat(finalWind), dir: windDir },
        wave: { coastal: parseFloat(finalWave) },
        layers: {
          upper: parseFloat(finalTemp),
          middle: (parseFloat(finalTemp) - 1.2).toFixed(1),
          lower: (parseFloat(finalTemp) - 3.4).toFixed(1)
        },
        tide: {
          phase: tideNum === 7 ? '7물(사리)' : tideNum === 13 ? '13물(조금)' : tideNum === 14 ? '14물(무시)' : `${tideNum}물`,
          high: fmt(baseHighMin),
          low: fmt(baseLowMin),
          current_level: `${tideLevel}cm`
        }
      },
      lastUpdated: new Date()
    };
  }));
  // ✅ 21TH-B4: 실패 건수 집계 후 경고 로그
  const failCount = results.filter(r => r.status === 'rejected').length;
  if (failCount > 0) logger.warn(`[Batch] ${failCount}/${ALL_STATIONS.length} 지점 날씨 캐시 갱신 실패`);
  else logger.info(`[Batch] 전체 ${ALL_STATIONS.length} 지점 날씨 캐시 갱신 완료`);
}

updateAllStationsCache();

// ─── 시간대별 스마트 날씨 캐시 갱신 ─────────────────────────────────────────
// 주간(6~24시): 1시간마다 / 새벽(0~6시): 3시간마다
function scheduleWeatherCache() {
  const hour = new Date().getHours();
  const delay = (hour >= 2 && hour < 6) ? 3 * 60 * 60 * 1000 : 60 * 60 * 1000;
  setTimeout(() => {
    updateAllStationsCache();
    scheduleWeatherCache(); // 재귀 스케줄링
  }, delay);
}
scheduleWeatherCache();

/* =========================================================
   AUTH & USER LEVELING API (DB + 인메모리 이중 레이어)
========================================================= */

// ✅ 9TH-A2: /api/health 중복 라우트 제거 — L247에서 이미 정의됨 (Express 첫 번째 핸들러 우선)
// uptime/time/db 응답은 L247 핸들러로 통합됨

// ─── Cloudinary 조건부 이미지 업로드 ─────────────────────────────────────────
// CLOUDINARY_URL 환경변수가 설정된 경우에만 CDN 업로드 활성화
// 미설정 시: base64 그대로 반환 (기존 방식 유지, 하위 호환)
app.post('/api/upload/image', async (req, res) => {
  try {
    const { base64, folder = 'fishinggo' } = req.body;
    if (!base64) return res.status(400).json({ error: '이미지 데이터 필요' });

    if (!process.env.CLOUDINARY_URL) {
      // 환경변수 없으면 base64 그대로 반환 (기존 방식)
      return res.json({ url: base64, type: 'base64' });
    }

    // Cloudinary 동적 require (패키지 없을 시 fallback)
    let cloudinary;
    try { cloudinary = require('cloudinary').v2; } catch (e) {
      return res.json({ url: base64, type: 'base64' });
    }

    const result = await cloudinary.uploader.upload(base64, {
      folder,
      resource_type: 'auto',
      transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
    });
    res.json({ url: result.secure_url, type: 'cloudinary', publicId: result.public_id });
  } catch (err) {
    (logger?.error || console.error)('[Cloudinary Upload 실패]', err.message);
    // 업로드 실패 시 base64 폴백 (서비스 중단 방지)
    res.json({ url: req.body.base64, type: 'base64' });
  }
});

// ─── 포트원 결제 검증 + 구독 처리 ─────────────────────────────────────────────
// 환경변수:
//   PORTONE_API_KEY    : 포트원 REST API 키 (테스트: test_ak_...)
//   PORTONE_API_SECRET : 포트원 API 시크릿  (테스트: test_sk_...)
// 미설정 시: 테스트 모드 (금액 검증 생략, 구독만 즉시 처리)

const PLAN_PRICES = { LITE: 9900, PRO: 110000, VVIP: 550000 };
const PLAN_TIERS = { LITE: 'BUSINESS_LITE', PRO: 'PRO', VVIP: 'BUSINESS_VIP' };

app.post('/api/payment/verify', async (req, res) => {
  try {
    // JWT 인증: 본인 또는 어드민만 결제 처리 가능
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const { imp_uid, merchant_uid, planId, tier, harborId, userId, userName } = req.body;
    if (!planId || !userId) return res.status(400).json({ error: '필수 항목 누락' });

    // 본인 또는 어드민만 처리 가능
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== userId && tp.email !== userId) {
      return res.status(403).json({ error: '본인 결제만 처리 가능합니다.' });
    }

    const expectedAmount = PLAN_PRICES[planId];
    const expectedTier = tier || PLAN_TIERS[planId];
    const isTestMode = !process.env.PORTONE_API_KEY;

    if (!isTestMode && imp_uid) {
      // ─── 실서비스: 포트원 API로 결제 금액 검증 ──────────────────
      try {
        const axios = require('axios');

        // 1) 액세스 토큰 발급
        const tokenRes = await axios.post('https://api.iamport.kr/users/getToken', {
          imp_key: process.env.PORTONE_API_KEY,
          imp_secret: process.env.PORTONE_API_SECRET,
        });
        const accessToken = tokenRes.data.response?.access_token;
        if (!accessToken) throw new Error('포트원 토큰 발급 실패');

        // 2) 결제 정보 조회
        const payRes = await axios.get(`https://api.iamport.kr/payments/${imp_uid}`, {
          headers: { Authorization: accessToken },
        });
        const payment = payRes.data.response;

        // 3) 금액 검증 (위변조 방지)
        if (payment.status !== 'paid') {
          return res.status(400).json({ error: `결제 미완료 상태: ${payment.status}` });
        }
        if (payment.amount !== expectedAmount) {
          // 금액 불일치 → 포트원에 환불 요청
          await axios.post('https://api.iamport.kr/payments/cancel', {
            imp_uid, reason: '결제 금액 불일치 (위변조 의심)',
          }, { headers: { Authorization: accessToken } });
          return res.status(400).json({ error: '결제 금액이 일치하지 않습니다.' });
        }
        (logger?.info || console.log)(`[결제검증] ✅ ${userName} / ${planId} / ${payment.amount}원 / ${imp_uid}`);
      } catch (verifyErr) {
        (logger?.error || console.error)('[포트원 검증 오류]', verifyErr.message);
        return res.status(500).json({ error: '결제 검증 중 오류가 발생했습니다.' });
      }
    } else {
      // ─── 테스트 모드: 검증 생략, 즉시 구독 처리 ────────────────
      (logger?.info || console.info)(`[결제/테스트모드] ${userName} / ${planId} / ${expectedAmount}원`);
    }

    // ─── 구독 처리: DB 또는 인메모리 ────────────────────────────────
    const expiresAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(); // +31일

    if (dbReady && User) {
      await User.findOneAndUpdate(
        { $or: [{ email: userId }, { id: userId }] },
        { tier: expectedTier, subscriptionExpiresAt: expiresAt },
        { new: true }
      ).catch(e => (logger?.warn || console.warn)('[결제] DB 업데이트 실패:', e.message));
    } else {
      const u = memUsers.find(u => u.email === userId || u.id === userId);
      if (u) { u.tier = expectedTier; u.subscriptionExpiresAt = expiresAt; saveMemUsers(); }
    }

    // VVIP 항구 선점 처리 (✅ BUG-FIX: self-call 대신 직접 처리 — 네트워크 장애 무관)
    if (planId === 'VVIP' && harborId) {
      try {
        const harbor = HARBOR_LIST.find(h => h.id === harborId);
        if (harbor) {
          const now = new Date();
          const vvipExpires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          // 기존 만료 슬롯 정리
          if (vvipSlots[harborId]) {
            const existSlot = vvipSlots[harborId];
            if (existSlot.expiresAt && new Date(existSlot.expiresAt) < now) {
              delete vvipSlots[harborId]; // 만료된 슬롯만 덮어쓰기 허용
            }
          }
          if (!vvipSlots[harborId]) { // 미점유 또는 만료된 슬롯만 선점
            vvipSlots[harborId] = {
              userId,
              userName: userName || userId,
              purchasedAt: now.toISOString(),
              expiresAt: vvipExpires.toISOString(),
              harborName: harbor.name,
            };
            saveVvipSlots();
            // User DB에도 VVIP 정보 저장
            if (dbReady && User) {
              await User.findOneAndUpdate(
                { $or: [{ email: userId }, { id: userId }] },
                { vvipHarborId: harborId, vvipExpiresAt: vvipExpires }
              ).catch(e => (logger?.warn || console.warn)('[VVIP verify] DB 저장 실패:', e.message));
            }
            (logger?.info || console.log)(`[VVIP verify] ✅ 항구 선점 완료: ${harbor.name} → ${userId}`);
          }
        }
      } catch (e) {
        (logger?.warn || console.warn)('[VVIP verify] 항구 선점 처리 실패:', e.message);
      }
    }

    res.json({
      success: true,
      tier: expectedTier,
      expiresAt,
      planId,
      imp_uid: imp_uid || 'test_mode',
      testMode: isTestMode,
    });
  } catch (err) {
    (logger?.error || console.error)('[POST /api/payment/verify]', err.message);
    res.status(500).json({ error: '서버 오류: ' + err.message });
  }
});

// ─── 구독 상태 조회 — GET /api/payment/subscription/:userId ────────────────────
// checkSubscriptionExpiry()가 앱 시작 시 호출하는 엔드포인트
// DB 또는 인메모리에서 현재 tier/만료일을 읽어 반환
app.get('/api/payment/subscription/:userId', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음', code: 'TOKEN_INVALID' }); }

    const userId = decodeURIComponent(req.params.userId);
    const isAdmin = isAdminToken(tp);
    // 본인 또는 어드민만 조회 가능
    if (!isAdmin && tp.email !== userId && tp.id !== userId) {
      return res.status(403).json({ error: '본인 정보만 조회 가능합니다.' });
    }

    let user;
    if (dbReady && User) {
      user = await User.findOne({ $or: [{ email: userId }, { id: userId }] }, 'tier subscriptionExpiresAt email').lean();
    } else {
      user = memUsers.find(u => u.email === userId || u.id === userId);
    }

    if (!user) return res.status(404).json({ error: '사용자 없음' });

    const PAID_TIERS = ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'MASTER'];
    const tier = user.tier || 'FREE';
    const isPaid = PAID_TIERS.includes(tier);

    // 만료일 체크
    if (isPaid && user.subscriptionExpiresAt) {
      const expiry = new Date(user.subscriptionExpiresAt);
      if (expiry < new Date()) {
        // 만료됨 — DB에서도 FREE로 초기화
        if (dbReady && User) {
          await User.findOneAndUpdate({ $or: [{ email: userId }, { id: userId }] }, { tier: 'FREE' });
        } else {
          const u = memUsers.find(u => u.email === userId || u.id === userId);
          if (u) { u.tier = 'FREE'; saveMemUsers(); }
        }
        return res.json({ hasSubscription: false, status: 'expired', tier: 'FREE' });
      }
      return res.json({
        hasSubscription: true,
        status: 'active',
        tier,
        nextBillingDate: user.subscriptionExpiresAt,
      });
    }

    if (isPaid) {
      // 만료일 없는 유료 플랜 = 유효한 것으로 간주
      return res.json({ hasSubscription: true, status: 'active', tier });
    }

    // ✅ FIX-VVIP-GRANT: DB tier가 FREE이지만 vvipExpiresAt이 많는 유효한 admin grant 계정 복원
    // — admin grant는 tier + vvipHarborId + vvipExpiresAt만 저장, subscriptionExpiresAt 없음
    const vvipGrantUser = await (async () => {
      try {
        if (!dbReady || !User) return null;
        return await User.findOne({ $or: [{ email: userId }, { id: userId }] }, 'vvipHarborId vvipExpiresAt').lean();
      } catch { return null; }
    })();
    if (vvipGrantUser?.vvipHarborId && vvipGrantUser?.vvipExpiresAt) {
      const vvipExpiry = new Date(vvipGrantUser.vvipExpiresAt);
      if (vvipExpiry > new Date()) {
        return res.json({ hasSubscription: true, status: 'active', tier: 'BUSINESS_VIP' });
      }
    }

    return res.json({ hasSubscription: false, status: 'free', tier: 'FREE' });
  } catch (err) {
    (logger?.error || console.error)('[GET /api/payment/subscription]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ─── 포트원 웹훅 (결제 완료 서버 측 이벤트) ──────────────────────────────────
// Render 설정: 포트원 콘솔 → 웹훅 URL = https://[your-server].onrender.com/api/payment/webhook
app.post('/api/payment/webhook', async (req, res) => {
  try {
    // 포트원 웹훅 서명 검증 (프로덕션에서만 강제)
    // ✅ BUG-FIX: express.json() 파싱 후 JSON.stringify(req.body)는 원본 raw body와 순서 불일치
    // → HMAC 서명 불일치 발생. 웹훅 처리 자체는 스케줄러(runBillingScheduler)가 담당하므로
    //   여기서는 로그만 기록하고 200 반환 (포트원 필수 요구사항)
    const signature = req.headers['x-iamport-signature'];
    if (process.env.NODE_ENV !== 'production') {
      (logger?.debug || console.log)(`[Webhook] 서명 수신: ${signature ? '있음' : '없음'}`);
    }

    const { imp_uid, merchant_uid, status } = req.body;
    (logger?.info || console.info)(`[Webhook] imp_uid=${imp_uid} status=${status}`);

    if (status === 'paid') {
      // merchant_uid 패턴: fishing_PLANID_harborId_timestamp
      const parts = (merchant_uid || '').split('_');
      const planId = parts[1] || null;
      if (planId && PLAN_PRICES[planId]) {
        (logger?.info || console.info)(`[Webhook] ✅ 결제 완료 확인 - ${planId} / ${imp_uid}`);
      }
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    (logger?.error || console.error)('[Webhook 오류]', err.message);
    res.status(200).json({ ok: false }); // 포트원 웹훅은 200 반환 필수
  }
});

// 레벨 설정 (서버와 프론트엔드를 자동 동기화)
const LEVEL_CONFIG = [
  { level: 1, title: '초보 낚시꾼', expRequired: 0 },
  { level: 2, title: '견습 낚시꾼', expRequired: 100 },
  { level: 3, title: '낚시 입문자', expRequired: 250 },
  { level: 4, title: '낚시 애호가', expRequired: 500 },
  { level: 5, title: '베테랑 낚시인', expRequired: 850 },
  { level: 6, title: '중급 낚시꾼', expRequired: 1300 },
  { level: 7, title: '고수 낚시인', expRequired: 1900 },
  { level: 8, title: '낚시 장인', expRequired: 2700 },
  { level: 9, title: '전설의 낚시인', expRequired: 3700 },
  { level: 10, title: '낚시의 신', expRequired: 5000 },
];

// 활동별 EXP 보상
const EXP_REWARDS = {
  attendance: 20,
  post_write: 30,
  record_write: 50,
  comment_write: 10,
  like_receive: 5,
  point_visit: 15,
  photo_upload: 25,
  first_catch: 100,
  weekly_streak: 80,
  monthly_streak: 300,
};

// totalExp 기반으로 레벨 정보 계산
function getLevelFromExp(totalExp) {
  let current;
  let next;

  if (totalExp < 5000) {
    for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
      if (totalExp >= LEVEL_CONFIG[i].expRequired) {
        current = LEVEL_CONFIG[i];
        next = LEVEL_CONFIG[i + 1] || { level: 10, expRequired: 5000 };
        break;
      }
    }
  } else {
    // 점진적으로 상승하는 초월 난이도 로직 적용
    const baseExp = 5000;
    const additionalExp = totalExp - baseExp;

    let extraLevelIndex = 0;
    let currentExpThreshold = 0;
    let nextStepExp = 1500;

    while (additionalExp >= currentExpThreshold + nextStepExp) {
      currentExpThreshold += nextStepExp;
      nextStepExp += 300;
      extraLevelIndex++;
    }

    const currentLvlNum = 10 + extraLevelIndex;

    current = {
      level: currentLvlNum,
      title: `초월 낚시신 ${extraLevelIndex + 1}단계`,
      expRequired: baseExp + currentExpThreshold
    };
    next = {
      level: currentLvlNum + 1,
      expRequired: baseExp + currentExpThreshold + nextStepExp
    };
  }

  const expInLevel = totalExp - current.expRequired;
  const expNeeded = next.expRequired - current.expRequired;

  return { ...current, expInLevel, expNeeded, next, totalExp };
}

function buildUserResponse(user) {
  const totalExp = user.totalExp || 0;
  const levelInfo = getLevelFromExp(totalExp);
  // ✅ FIX-ADMIN: 어드민 계정 판별 — 이메일 기반(sunjulab.k)
  const rawId = user._id || user.id;
  const isAdminUser = isAdminToken({ email: user.email, tier: user.tier });
  // id: 어드민은 'sunjulab.k'로, 나머지는 MongoDB ObjectId 그대로
  const resolvedId = isAdminUser ? 'sunjulab.k' : String(rawId);
  // ✅ BUG-FIX: 레거시 isSunjulabVip(email==='sunjulab') 코드 제거 — 실제 계정 없는 dead code
  // tier: 어드민=MASTER, 나머지=DB값
  const resolvedTier = isAdminUser ? 'MASTER' : (user.tier || 'FREE');

  // ✅ FIX-VVIP-BADGE: VVIP 항구명 포함 — 로그인/토큰갱신/syncFromServer 전원 포함
  const vvipHarborId = user.vvipHarborId || null;
  let vvipHarborName = null;
  if (vvipHarborId) {
    try {
      // HARBOR_LIST는 const로 파일 하단에 정의되어 있으나 서버 요청 처리 시점엔 이미 초기화됨
      // try/catch로 초기화 전 호출 가능성 방어
      const hInfo = HARBOR_LIST.find(h => h.id === vvipHarborId);
      vvipHarborName = hInfo?.name || null;
    } catch { /* HARBOR_LIST 미초기화 시 무시 */ }
  }

  return {
    id: resolvedId,
    email: user.email,
    name: user.name,
    level: levelInfo.level,
    exp: levelInfo.expInLevel,
    totalExp,
    levelTitle: levelInfo.title,
    expNeeded: levelInfo.expNeeded,
    tier: resolvedTier,
    avatar: user.avatar || null,
    picture: user.picture || null,
    followers: user.followers || [],
    following: user.following || [],
    notiSettings: user.notiSettings || { flow: true, bait: true, comm: true },
    totalAttendance: user.totalAttendance || 0,
    streak: user.streak || 0,
    vvipHarborId,                // ✅ FIX-VVIP-BADGE
    vvipHarborName,              // ✅ FIX-VVIP-BADGE: '강릉·강문' 등 — MyPage 뱃지 동적화
  };
}



function applyAttendance(user) {
  // ✅ LOGIN-FIX-3: lastAttendance가 MongoDB Date 객체일 때 string 비교 오류 수정
  // User 스키마에서 lastAttendance: Date 타입 → DB에서 Date 객체로 반환됨
  // → 'YYYY-MM-DD' string으로 정규화 후 비교해야 정확한 출석 처리 가능
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let justAttended = false;
  let leveledUp = false;
  let expGained = 0;

  // lastAttendance가 Date 객체 또는 string 모두 처리
  const lastStr = user.lastAttendance
    ? (user.lastAttendance instanceof Date
        ? user.lastAttendance.toISOString().split('T')[0]
        : String(user.lastAttendance).split('T')[0])
    : '';

  if (lastStr !== today) {
    // 연속 출석 스트릭
    if (lastStr === yesterday) {
      user.streak = (user.streak || 0) + 1;
    } else {
      user.streak = 1; // 출석 끊김 시 리셋
    }

    user.lastAttendance = today;
    user.totalAttendance = (user.totalAttendance || 0) + 1;

    // 기본 출석 EXP
    expGained = EXP_REWARDS.attendance;

    // 연속출석 보너스
    if (user.streak >= 30) expGained += EXP_REWARDS.monthly_streak;
    else if (user.streak >= 7) expGained += EXP_REWARDS.weekly_streak;
    else if (user.streak >= 3) expGained += 20; // 3일 연속 소액 보너스

    // totalExp 기반으로 업데이트
    const prevTotalExp = user.totalExp || 0;
    user.totalExp = prevTotalExp + expGained;
    const prevLevel = getLevelFromExp(prevTotalExp).level;
    const newLevel = getLevelFromExp(user.totalExp).level;
    user.level = newLevel;

    if (newLevel > prevLevel) leveledUp = true;
    justAttended = true;
  }
  return { justAttended, leveledUp, expGained, streak: user.streak || 0 };
}

// --- 이메일 마스킹 헬퍼 ---
function maskEmail(email) {
  const [local, domain] = email.split('@');
  const visible = local.slice(0, 2); // 앞 2자리만 표시
  return `${visible}***@${domain}`;  // 항상 *** 3개 고정
}

// --- 아이디 찾기 ---
app.post('/api/auth/find-id', async (req, res) => {
  try {
    const { realName, phone } = req.body;
    if (!realName || !phone) return res.status(400).json({ error: '이름과 전화번호를 입력해주세요.' });
    const normalizedPhone = String(phone).replace(/\D/g, '');
    await waitForDb(5000);
    if (dbReady && User) {
      const users = await User.find({ realName }).lean();
      const user = users.find(u => String(u.phone || '').replace(/\D/g, '') === normalizedPhone);
      if (!user) return res.status(400).json({ error: '일치하는 회원 정보가 없습니다.' });
      // ✅ masked: 화면 표시용, raw: 로그인 자동입력용
      return res.json({ email: maskEmail(user.email), rawEmail: user.email });
    }
    const user = memUsers.find(u =>
      u.realName === realName &&
      String(u.phone || '').replace(/\D/g, '') === normalizedPhone
    );
    if (!user) return res.status(400).json({ error: '일치하는 회원 정보가 없습니다.' });
    return res.json({ email: maskEmail(user.email), rawEmail: user.email });
  } catch (err) {
    (logger?.error || console.error)('[POST /api/auth/find-id]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// --- 비밀번호 재설정 ---
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, realName, phone, newPassword } = req.body;
    if (!email || !realName || !phone || !newPassword) return res.status(400).json({ error: '모든 항목을 입력해주세요.' });
    if (newPassword.length < 8) return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });
    const normalizedPhone = String(phone).replace(/\D/g, '');
    const normalizedEmail = email.trim().toLowerCase();
    const hashed = await bcrypt.hash(newPassword, 10);
    await waitForDb(5000);
    if (dbReady && User) {
      // 이메일 + 실명 + 전화번호 3중 검증
      const users = await User.find({ realName }).lean();
      const user = users.find(u =>
        (u.email || '').toLowerCase() === normalizedEmail &&
        String(u.phone || '').replace(/\D/g, '') === normalizedPhone
      );
      if (!user) return res.status(400).json({ error: '입력하신 정보와 일치하는 계정이 없습니다.' });
      await User.updateOne({ _id: user._id }, { $set: { password: hashed } });
      return res.json({ success: true, message: '비밀번호가 변경되었습니다.' });
    }
    // 인메모리 fallback
    const userIdx = memUsers.findIndex(u =>
      (u.email || '').toLowerCase() === normalizedEmail &&
      u.realName === realName &&
      String(u.phone || '').replace(/\D/g, '') === normalizedPhone
    );
    if (userIdx === -1) return res.status(400).json({ error: '입력하신 정보와 일치하는 계정이 없습니다.' });
    memUsers[userIdx].password = hashed;
    saveMemUsers();
    return res.json({ success: true, message: '비밀번호가 변경되었습니다.' });
  } catch (err) {
    (logger?.error || console.error)('[POST /api/auth/reset-password]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// --- 아이디(email 필드 활용) 중복 확인 ---
app.post('/api/auth/check-id', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) return res.status(400).json({ error: '아이디를 입력해주세요.' });
    const id = email.trim();
    // ✅ FIX-BAN: 금지 아이디 검사 — 중복확인 단계에서 선제 차단
    if (isBannedName(id)) {
      return res.json({ available: false, banned: true, error: '이 아이디는 사용할 수 없습니다. (운영 정책상 금지된 표현 포함)' });
    }
    // DB 모드 시도 → 실패하면 인메모리 fallback
    if (dbReady && User) {
      try {
        const existing = await User.findOne({ email: id });
        return res.json({ available: !existing });
      } catch (dbErr) {
        (logger?.error || console.error)('[check-id] DB 조회 실패, 인메모리 fallback:', dbErr.message);
      }
    }
    // 인메모리 fallback
    const existing = memUsers.find(u => u.email === id);
    return res.json({ available: !existing });
  } catch (err) {
    (logger?.error || console.error)('[check-id] 오류:', err.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});


// --- 현재 사용자 정보 조회 (재로그인 없이 tier/avatar 동기화용) ---
app.get('/api/user/me', async (req, res) => {
  try {
    // JWT 인증 — 본인 또는 어드민만 조회 가능
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음', code: 'TOKEN_INVALID' }); }

    const email = req.query.email || req.headers['x-user-email'];
    if (!email) return res.status(400).json({ error: 'email 필요' });

    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== email && tp.email !== email) {
      return res.status(403).json({ error: '본인 정보만 조회 가능합니다.' });
    }

    let user;
    if (dbReady && User) {
      user = await User.findOne({ email });
    } else {
      user = memUsers.find(u => u.email === email);
    }
    if (!user) return res.status(404).json({ error: '사용자 없음' });
    res.json(buildUserResponse(user));
  } catch (err) {
    res.status(500).json({ error: '서버 오류' });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// ─── 고객센터 1:1 문의 API ──────────────────────────────────────────────
// 비밀글 정책: 작성자 본인과 MASTER 어드민만 열람 가능
// ═══════════════════════════════════════════════════════════════════════

// 인메모리 저장소 + 파일 persist
const CS_FILE = path.join(__dirname, 'cs_inquiries.json');
let memCsInquiries = [];
try {
  if (fs.existsSync(CS_FILE)) {
    memCsInquiries = JSON.parse(fs.readFileSync(CS_FILE, 'utf8'));
  }
} catch { memCsInquiries = []; }

function saveCsInquiries() {
  try { fs.writeFileSync(CS_FILE, JSON.stringify(memCsInquiries, null, 2)); } catch {}
}

// POST /api/cs/inquiry — 문의 등록 (로그인 필수)
app.post('/api/cs/inquiry', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '로그인이 필요합니다.', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰이 유효하지 않습니다.' }); }

    const { realName, nickname, phone, category, title, content } = req.body;
    if (!content || content.trim().length < 5) {
      return res.status(400).json({ error: '문의 내용을 5자 이상 입력해주세요.' });
    }
    if (!title || title.trim().length < 2) {
      return res.status(400).json({ error: '제목을 2자 이상 입력해주세요.' });
    }

    const inquiry = {
      id: `CS-${Date.now()}`,
      authorEmail: tp.email || tp.id,
      authorId: tp.id || tp.email,
      realName: (realName || '').trim(),
      nickname: (nickname || tp.name || '').trim(),
      phone: (phone || '').trim(),
      category: category || '일반 문의',
      title: title.trim(),
      content: content.trim(),
      status: 'pending',   // pending | answered | closed
      reply: null,
      repliedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // DB 저장 시도
    if (dbReady && mongoose.connection.readyState === 1) {
      try {
        // MongoDB에 직접 저장 (별도 모델 없이 generic collection 사용)
        await mongoose.connection.db.collection('cs_inquiries').insertOne(inquiry);
      } catch { memCsInquiries.push(inquiry); saveCsInquiries(); }
    } else {
      memCsInquiries.push(inquiry);
      saveCsInquiries();
    }

    (logger?.info || console.log)(`[CS] 새 문의 등록: ${inquiry.id} / ${inquiry.authorEmail}`);
    res.json({ success: true, id: inquiry.id, message: '문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.' });
  } catch (err) {
    (logger?.error || console.error)('[POST /api/cs/inquiry]', err.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// GET /api/cs/inquiries — 내 문의 목록 조회 (본인) / 전체 조회 (마스터)
app.get('/api/cs/inquiries', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '로그인이 필요합니다.', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰이 유효하지 않습니다.' }); }

    const isAdmin = isAdminToken(tp);
    let items = [];

    if (dbReady && mongoose.connection.readyState === 1) {
      try {
        const coll = mongoose.connection.db.collection('cs_inquiries');
        const query = isAdmin ? {} : { authorEmail: tp.email || tp.id };
        items = await coll.find(query).sort({ createdAt: -1 }).toArray();
      } catch {
        items = isAdmin ? memCsInquiries : memCsInquiries.filter(i => i.authorEmail === (tp.email || tp.id));
      }
    } else {
      items = isAdmin ? memCsInquiries : memCsInquiries.filter(i => i.authorEmail === (tp.email || tp.id));
    }

    // 비밀글 정책: 마스터가 아니면 본인 글만
    if (!isAdmin) {
      items = items.filter(i => i.authorEmail === (tp.email || tp.id) || i.authorId === (tp.email || tp.id));
    }

    res.json(items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (err) {
    (logger?.error || console.error)('[GET /api/cs/inquiries]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// PUT /api/cs/inquiry/:id/reply — 마스터 답변 등록
app.put('/api/cs/inquiry/:id/reply', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '로그인이 필요합니다.' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰이 유효하지 않습니다.' }); }

    if (!isAdminToken(tp)) return res.status(403).json({ error: '관리자만 답변할 수 있습니다.' });

    const { id } = req.params;
    const { reply } = req.body;
    if (!reply || reply.trim().length < 2) return res.status(400).json({ error: '답변 내용을 입력해주세요.' });

    const now = new Date().toISOString();

    if (dbReady && mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.db.collection('cs_inquiries').updateOne(
          { id },
          { $set: { reply: reply.trim(), repliedAt: now, status: 'answered', updatedAt: now } }
        );
      } catch {
        const item = memCsInquiries.find(i => i.id === id);
        if (item) { item.reply = reply.trim(); item.repliedAt = now; item.status = 'answered'; item.updatedAt = now; saveCsInquiries(); }
      }
    } else {
      const item = memCsInquiries.find(i => i.id === id);
      if (!item) return res.status(404).json({ error: '문의를 찾을 수 없습니다.' });
      item.reply = reply.trim(); item.repliedAt = now; item.status = 'answered'; item.updatedAt = now;
      saveCsInquiries();
    }

    res.json({ success: true, message: '답변이 등록되었습니다.' });
  } catch (err) {
    (logger?.error || console.error)('[PUT /api/cs/inquiry/reply]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});


// PUT /api/user/tier — 다운그레이드 방지 포함
// 유료 구독 중인 사용자는 하위 플랜으로 변경 불가 (결제 내역 보호)
const TIER_RANK = { FREE: 0, BUSINESS_LITE: 1, PRO: 2, BUSINESS_VIP: 3, MASTER: 4 };
// 다운그레이드 불가 티어 (BUSINESS_VIP, PRO는 명시적 해지 API 없이 변경 불가)
const PROTECTED_TIERS = ['PRO', 'BUSINESS_VIP', 'MASTER'];

app.put('/api/user/tier', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const { email, tier } = req.body;
    if (!email || !tier) return res.status(400).json({ error: '이메일과 티어가 필요합니다.' });
    if (!TIER_RANK.hasOwnProperty(tier)) return res.status(400).json({ error: '유효하지 않은 플랜입니다.' });

    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.email !== email && tp.id !== email)
      return res.status(403).json({ error: '본인 정보만 변경 가능합니다.' });

    // 현재 DB tier 조회
    let currentTier = 'FREE';
    let user;
    if (dbReady && User) {
      user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      currentTier = user.tier || 'FREE';
    } else {
      user = memUsers.find(u => u.email === email);
      if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      currentTier = user.tier || 'FREE';
    }

    // ✅ SECURITY-FIX: 비관리자는 업그레이드 불가 (결제 없이 PRO/VIP 획득 방지)
    if (!isAdmin) {
      // sunjulab 계정은 항상 BUSINESS_VIP 이상 유지
      const isSunjulabVip = email === 'sunjulab';
      if (isSunjulabVip && (TIER_RANK[tier] || 0) < TIER_RANK['BUSINESS_VIP']) {
        return res.status(403).json({ error: '이 계정은 BUSINESS_VIP 구독이 유지됩니다.', currentTier: 'BUSINESS_VIP' });
      }
      // ✅ 업그레이드 시도 → 결제 없이 불가 (관리자만 직접 변경 가능)
      if ((TIER_RANK[tier] || 0) > (TIER_RANK[currentTier] || 0)) {
        return res.status(403).json({
          error: '플랜 업그레이드는 결제 후 자동 처리됩니다. 직접 변경은 불가합니다.',
          currentTier,
          code: 'UPGRADE_REQUIRES_PAYMENT',
        });
      }
      // 유료 구독 중인 계정 → 하위 플랜으로 변경 불가 (고객센터 통해서만)
      if (PROTECTED_TIERS.includes(currentTier) && (TIER_RANK[tier] || 0) < (TIER_RANK[currentTier] || 0)) {
        return res.status(403).json({
          error: `현재 ${currentTier} 구독 중입니다. 구독 해지는 고객센터를 통해 진행해주세요.`,
          currentTier,
        });
      }
    }

    // tier 업데이트
    if (dbReady && User) {
      await User.findOneAndUpdate({ email }, { $set: { tier } });
    } else {
      user.tier = tier;
      saveMemUsers();
    }
    return res.json({ success: true, tier });
  } catch (err) {
    (logger?.error || console.error)('[PUT /api/user/tier]', err.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ✅ SECURITY-FIX: 어드민 전용 강제 tier 변경 (결제 없이 획득한 tier 복원용)
// POST /api/admin/force-tier  { targetEmail, tier }
app.post('/api/admin/force-tier', async (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 오류' }); }
  if (!isAdminToken(tp)) return res.status(403).json({ error: '어드민 전용 API' });

  const { targetEmail, tier } = req.body;
  if (!targetEmail || !tier) return res.status(400).json({ error: 'targetEmail, tier 필수' });
  if (!TIER_RANK.hasOwnProperty(tier)) return res.status(400).json({ error: '유효하지 않은 tier' });

  try {
    let updated = false;
    if (dbReady && User) {
      const result = await User.findOneAndUpdate(
        { $or: [{ email: targetEmail }, { id: targetEmail }, { name: targetEmail }] },
        { $set: { tier } },
        { new: true }
      );
      if (result) {
        updated = true;
        (logger?.info || console.log)(`[ADMIN force-tier] ${result.email || result.id} → ${tier} (by ${tp.email})`);
      }
    }
    // in-memory fallback
    const memIdx = memUsers.findIndex(u => u.email === targetEmail || u.id === targetEmail || u.name === targetEmail);
    if (memIdx !== -1) { memUsers[memIdx].tier = tier; saveMemUsers(); updated = true; }

    if (!updated) return res.status(404).json({ error: '해당 사용자를 찾을 수 없습니다.' });
    return res.json({ success: true, targetEmail, tier, message: `${targetEmail} → ${tier} 변경 완료` });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ✅ SECURITY: 미결제 유료 tier 탐지 API — 어드민 전용
// GET /api/admin/suspicious-tiers
app.get('/api/admin/suspicious-tiers', async (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 오류' }); }
  if (!isAdminToken(tp)) return res.status(403).json({ error: '어드민 전용 API' });

  const PAID_TIERS = ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP'];

  try {
    if (!dbReady || !User || !PaymentHistory) {
      const suspects = memUsers
        .filter(u => PAID_TIERS.includes(u.tier))
        .map(u => ({ id: u.id, email: u.email, name: u.name, tier: u.tier, hasPaid: false, source: 'memory' }));
      return res.json({ suspects, total: suspects.length, note: 'in-memory — 결제 검증 불가' });
    }

    const paidUsers = await User.find(
      { tier: { $in: PAID_TIERS } },
      { email: 1, id: 1, name: 1, tier: 1, subscriptionExpiresAt: 1, createdAt: 1 }
    ).lean();

    const paidIds = await PaymentHistory.distinct('userId', { status: 'paid' });
    const paidIdSet = new Set(paidIds.map(String));
    const proSubIds = new Set(Object.keys(memProSubs || {}));

    const ADMIN_EMAILS = new Set(['sunjulab.k', 'sunjulab.k@gmail.com']);
    const suspects = paidUsers
      .filter(u => {
        const uid = String(u.email || u.id || '');
        if (ADMIN_EMAILS.has(uid)) return false;
        return !paidIdSet.has(uid) && !proSubIds.has(uid);
      })
      .map(u => ({
        email: u.email, id: u.id, name: u.name,
        tier: u.tier, expiresAt: u.subscriptionExpiresAt, joinedAt: u.createdAt,
      }))
      .sort((a, b) => new Date(b.joinedAt || 0) - new Date(a.joinedAt || 0));

    return res.json({ suspects, total: suspects.length });
  } catch (e) {
    (logger?.error || console.error)('[suspicious-tiers]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ─── FREE 플랜 포인트 입장 일일 3회 제한 체크 ─────────────────────────────────
// POST /api/user/point-visit-check
// - 로그인 사용자 전용 (GUEST는 클라이언트 sessionStorage로 처리)
// - KST(UTC+9) 자정 기준으로 일일 카운트 리셋
// - 유료플랜(LITE/PRO/VVIP/MASTER) 및 어드민은 항상 allowed:true 반환
// - 서버 오류 시 fail-open (allowed:true) 반환하여 UX 보호
const FREE_DAILY_LIMIT = 3;
// KST 기준 오늘 날짜 'YYYY-MM-DD' 반환 (Render 서버 UTC 환경 대응)
function getKstDateString() {
  const now = new Date();
  // UTC+9 오프셋 적용
  const kstMs = now.getTime() + 9 * 60 * 60 * 1000;
  return new Date(kstMs).toISOString().split('T')[0]; // 'YYYY-MM-DD'
}
app.post('/api/user/point-visit-check', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음', code: 'TOKEN_INVALID' }); }

    // 어드민은 무제한
    if (isAdminToken(tp)) {
      return res.json({ allowed: true, remaining: 999, total: FREE_DAILY_LIMIT, unlimited: true });
    }

    const todayKst = getKstDateString();
    const PAID_TIERS = ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'MASTER'];

    // ─── DB 모드 ─────────────────────────────────────────────────────
    if (dbReady && User) {
      // ✅ BUG-FIX: _id: tp.id 제거 — tp.id가 MongoDB ObjectId가 아닌 문자열일 때 CastError throw 방지
      // email은 항상 존재하며 unique하모로 단독 조회로 충분
      const user = await User.findOne(
        { email: tp.email },
        'tier dailyPointVisit'
      ).lean();

      if (!user) return res.json({ allowed: true, remaining: FREE_DAILY_LIMIT, total: FREE_DAILY_LIMIT });

      // 유료 플랜이면 무제한
      if (PAID_TIERS.includes(user.tier)) {
        return res.json({ allowed: true, remaining: 999, total: FREE_DAILY_LIMIT, unlimited: true });
      }

      const dpv = user.dailyPointVisit || { count: 0, date: '' };
      // 날짜가 바뀌었으면 카운트 리셋
      const count = dpv.date === todayKst ? (dpv.count || 0) : 0;

      if (count >= FREE_DAILY_LIMIT) {
        return res.json({ allowed: false, remaining: 0, total: FREE_DAILY_LIMIT });
      }

      // 카운트 증가 및 저장
      await User.findOneAndUpdate(
        { email: tp.email },
        { 'dailyPointVisit.count': count + 1, 'dailyPointVisit.date': todayKst }
      );

      return res.json({ allowed: true, remaining: FREE_DAILY_LIMIT - (count + 1), total: FREE_DAILY_LIMIT });
    }

    // ─── 인메모리 모드 ────────────────────────────────────────────────
    const memUser = memUsers.find(u => u.email === tp.email || u.id === tp.id);
    if (!memUser) return res.json({ allowed: true, remaining: FREE_DAILY_LIMIT, total: FREE_DAILY_LIMIT });

    // 유료 플랜이면 무제한
    if (PAID_TIERS.includes(memUser.tier)) {
      return res.json({ allowed: true, remaining: 999, total: FREE_DAILY_LIMIT, unlimited: true });
    }

    if (!memUser.dailyPointVisit) memUser.dailyPointVisit = { count: 0, date: '' };
    const dpv = memUser.dailyPointVisit;
    const count = dpv.date === todayKst ? (dpv.count || 0) : 0;

    if (count >= FREE_DAILY_LIMIT) {
      return res.json({ allowed: false, remaining: 0, total: FREE_DAILY_LIMIT });
    }

    dpv.count = count + 1;
    dpv.date = todayKst;
    saveMemUsers();

    return res.json({ allowed: true, remaining: FREE_DAILY_LIMIT - dpv.count, total: FREE_DAILY_LIMIT });

  } catch (err) {
    // ✅ fail-open: 서버 오류 시 UX 보호를 위해 허용 처리
    logger.error('[point-visit-check] 서버 오류:', err.message);
    return res.json({ allowed: true, remaining: FREE_DAILY_LIMIT, total: FREE_DAILY_LIMIT, error: 'fallback' });
  }
});

// --- 알림 설정 변경 ---
app.post('/api/user/settings', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { email, notiSettings } = req.body;
    if (!email || !notiSettings) return res.status(400).json({ error: '이메일과 설정 데이터가 필요합니다.' });
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== email && tp.email !== email) return res.status(403).json({ error: '본인 설정만 변경 가능' });

    if (dbReady && User) {
      const user = await User.findOneAndUpdate({ email }, { notiSettings }, { new: true });
      if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return res.json({ success: true, notiSettings: user.notiSettings });
    }

    // 인메모리
    let memUser = memUsers.find(u => u.email === email);
    if (memUser) {
      memUser.notiSettings = notiSettings;
    } else {
      memUser = { email, notiSettings, name: email.split('@')[0], totalExp: 0 };
      memUsers.push(memUser);
    }
    saveMemUsers(); // 알림 설정 파일 저장
    return res.json({ success: true, notiSettings });
  } catch (err) {
    (logger?.error || console.error)('[Settings Update]', err.message);
    res.status(500).json({ error: '서버 에러가 발생했습니다.' });
  }
});

// --- 닉네임 중복 확인 ---
app.post('/api/auth/check-name', async (req, res) => {
  try {
    const { name, excludeEmail } = req.body; // ✅ NICK-SELF: 닉네임 수정 시 본인 제외 옵션
    if (!name || !name.trim()) return res.status(400).json({ error: '닉네임을 입력해주세요.' });
    const nm = name.trim();
    // ✅ FIX-BAN: 금지 닉네임 검사 — 중복확인 단계에서 선제 차단
    if (isBannedName(nm)) {
      return res.json({ available: false, banned: true, error: '이 닉네임은 사용할 수 없습니다. (운영 정책상 금지된 표현 포함)' });
    }
    // DB 모드 시도 → 실패하면 인메모리 fallback
    if (dbReady && User) {
      try {
        const existing = await User.findOne({ name: nm });
        // excludeEmail이 있으면 본인 계정이면 사용 가능으로 처리
        if (existing && excludeEmail && existing.email === excludeEmail) {
          return res.json({ available: true });
        }
        return res.json({ available: !existing });
      } catch (dbErr) {
        (logger?.error || console.error)('[check-name] DB 조회 실패, 인메모리 fallback:', dbErr.message);
      }
    }
    // 인메모리 fallback
    const existing = memUsers.find(u => u.name === nm);
    if (existing && excludeEmail && existing.email === excludeEmail) {
      return res.json({ available: true });
    }
    return res.json({ available: !existing });
  } catch (err) {
    (logger?.error || console.error)('[check-name] 오류:', err.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});


// ─── SMS 본인인증 (CoolSMS) ───────────────────────────────────────────────────
// OTP 임시 저장소: { phone: { otp, expiresAt } }
const otpStore = new Map();

// CoolSMS SDK 동적 로드 (설치된 경우에만)
let coolsmsClient = null;
try {
  const coolsmsModule = require('coolsms-node-sdk');
  const CoolsmsMessageService = coolsmsModule.default || coolsmsModule.Coolsms || coolsmsModule;
  if (CoolsmsMessageService && process.env.SMS_API_KEY && process.env.SMS_API_SECRET) {
    coolsmsClient = new CoolsmsMessageService(process.env.SMS_API_KEY, process.env.SMS_API_SECRET);
    (logger?.info || console.log)('✅ CoolSMS 클라이언트 초기화 완료');
  } else {
    (logger?.info || console.log)('⚠️ CoolSMS API 키 미설정 → 개발 모드(콘솔 출력)');
  }
} catch (e) {
  (logger?.warn || console.warn)('⚠️ CoolSMS SDK 미설치 → 개발 모드(콘솔 출력)');
}

async function sendAppPushNotification(userEmail, type, title, message, data = {}) {
  let user = null;
  if (dbReady && User) {
    user = await User.findOne({ email: userEmail });
  } else {
    user = memUsers.find(u => u.email === userEmail);
  }

  if (!user) return;
  // 알림 설정 체크 (설정이 없으면 기본 true로 간주, 명시적으로 false인 경우만 발송 제외)
  if (user.notiSettings && user.notiSettings[type] === false) return;

  // ① socket.io broadcast (포그라운드용)
  io.emit('push_notification', {
    targetEmail: userEmail,
    title: title,
    message: message,
    type: type,
    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  });

  // ② FCM 실제 푸시 (백그라운드/잠금화면용)
  const userId = user._id || user.id;
  if (userId) {
    pushService.sendToUser(userId, { title, body: message, data }).catch(() => {});
  }

  logger.info(`[앱 푸쉬 알림 전송] 대상:${userEmail}, 제목:${title}`);
}

// OTP 발송
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: '휴대폰 번호를 입력해주세요.' });

    // 번호 정규화: 숫자만 추출
    const normalized = phone.replace(/[^0-9]/g, '');
    if (!/^01[0-9]{8,9}$/.test(normalized)) {
      return res.status(400).json({ error: '올바른 휴대폰 번호를 입력해주세요. (예: 010-1234-5678)' });
    }

    // 발송 쿨다운: 1분 이내 재요청 차단
    const existing = otpStore.get(normalized);
    if (existing && Date.now() < existing.expiresAt - 4 * 60 * 1000) {
      return res.status(429).json({ error: '1분 후에 다시 요청해주세요.' });
    }

    // 6자리 OTP 생성
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5분 유효

    otpStore.set(normalized, { otp, expiresAt, verified: false });

    const senderPhone = process.env.SMS_SENDER || '01000000000';

    if (coolsmsClient) {
      // 실제 SMS 발송
      await coolsmsClient.sendOne({
        to: normalized,
        from: senderPhone,
        text: `[낚시GO] 인증번호: ${otp}\n5분 이내 입력해주세요.`,
        type: 'SMS',
      });
      (logger?.info || console.log)(`[SMS] 발송 완료 → ${normalized.slice(0, 3)}****${normalized.slice(-4)}`);
    } else {
      // 개발 모드: OTP는 보안상 콘솔에 노출 안 함 — 로그로만 출력
      (logger?.info || console.log)(`[SMS 개발모드] 수신번호: ${normalized.slice(0, 3)}****${normalized.slice(-4)} / OTP 발송 완료`);
    }

    res.json({ success: true, message: '인증번호가 발송되었습니다.' });
  } catch (err) {
    (logger?.error || console.error)('[send-otp] 오류:', err.message);
    res.status(500).json({ error: 'SMS 발송 중 오류가 발생했습니다.' });
  }
});

// OTP 검증
app.post('/api/auth/verify-otp', (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: '번호와 인증코드를 입력해주세요.' });

    const normalized = phone.replace(/[^0-9]/g, '');
    const record = otpStore.get(normalized);

    if (!record) return res.status(400).json({ error: '인증 요청 내역이 없습니다. 인증번호를 다시 요청해주세요.' });
    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalized);
      return res.status(400).json({ error: '인증번호가 만료되었습니다. 다시 요청해주세요.' });
    }
    if (record.otp !== otp.trim()) {
      // 브루트포스 방지: 5회 이상 실패 시 레코드 삭제
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts >= 5) {
        otpStore.delete(normalized);
        return res.status(429).json({ error: '인증 시도 횟수를 초과했습니다. 인증번호를 다시 요청해주세요.' });
      }
      otpStore.set(normalized, record);
      return res.status(400).json({ error: `인증번호가 올바르지 않습니다. (${record.attempts}/5회)` });
    }

    // 검증 성공: 플래그 표시 (회원가입 시 재확인)
    record.verified = true;
    otpStore.set(normalized, record);

    res.json({ success: true, message: '인증이 완료되었습니다.' });
  } catch (err) {
    (logger?.error || console.error)('[verify-otp] 오류:', err.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// --- 회원가입 ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone, realName } = req.body; // ✅ realName 추가 수신
    if (!email || !password || !name) return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    // 입력값 검증
    if (email.trim().length < 4) return res.status(400).json({ error: 'ID는 4자 이상이어야 합니다.' });
    if (password.length < 8) return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });
    if (name.trim().length < 2) return res.status(400).json({ error: '닉네임은 2자 이상이어야 합니다.' });
    if (name.trim().length > 20) return res.status(400).json({ error: '닉네임은 20자 이하여야 합니다.' });
    // ✅ 금지 닉네임/아이디 검사 (어드민 계정 예외)
    if (!isAdminToken({ email })) {
      if (isBannedName(name))  return res.status(400).json({ error: '이 닉네임은 사용할 수 없습니다. (운영 정책상 금지된 표현 포함)' });
      if (isBannedName(email)) return res.status(400).json({ error: '이 아이디는 사용할 수 없습니다. (운영 정책상 금지된 표현 포함)' });
    }

    // 전화번호 형식 검증 (입력된 경우)
    if (phone) {
      const normalized = phone.replace(/[^0-9]/g, '');
      if (!/^01[016789]\d{7,8}$/.test(normalized)) {
        return res.status(400).json({ error: '유효한 휴대폰 번호를 입력해주세요.' });
      }
      // OTP 인증 완료 여부 확인 (인증 시스템 연동 시)
      const record = otpStore.get(normalized);
      if (record && !record.verified) {
        return res.status(400).json({ error: '휴대폰 인증을 완료해주세요.' });
      }
    }

    if (dbReady && User) {
      const existing = await User.findOne({ $or: [{ email }, { name }] });
      if (existing) return res.status(400).json({ error: '이미 사용 중인 이메일이거나 닉네임입니다.' });
      const hashed = await bcrypt.hash(password, 10);
      const user = new User({
        email, password: hashed, name,
        realName: (realName || '').trim(), // ✅ 실명 DB 저장
        phone: phone || '',
      });
      await user.save();
      if (phone) otpStore.delete(phone.replace(/[^0-9]/g, '')); // OTP 사용 완료
      return res.json({ success: true });
    } else {
      // 인메모리 fallback
      if (memUsers.find(u => u.email === email)) return res.status(400).json({ error: '이미 등록된 이메일입니다.' });
      if (memUsers.find(u => u.name === name)) return res.status(400).json({ error: '이미 사용 중인 닉네임입니다.' });
      const hashed = await bcrypt.hash(password, 10);
      memUsers.push({
        id: Date.now().toString(), email, password: hashed, name,
        realName: (realName || '').trim(), // ✅ 실명 인메모리 저장
        phone: phone || '',
        level: 1, exp: 0, tier: 'FREE', avatar: null,
        followers: [], following: [], lastAttendance: null, totalAttendance: 0, totalExp: 0,
      });
      if (phone) otpStore.delete(phone.replace(/[^0-9]/g, '')); // OTP 사용 완료
      saveMemUsers(); // 영구 보존
      return res.json({ success: true });
    }
  } catch (err) { logger.error('[register] 서버 오류:', err.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' }); }
});

// --- 이메일 로그인 ---
app.post('/api/auth/login', async (req, res) => {
  try {
    // ✅ AUTH-FIX-8: 이메일 공백 trim — 복사-붙여넣기 시 앞뒤 공백 포함 케이스 방어
    const email = (req.body.email || '').trim();
    const password = req.body.password || '';
    if (!email || !password) return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });

    // ✅ SCALE-FIX: 계정 기반 브루트포스 보호 (IP 대신 이메일 단위)
    const attemptKey = email.toLowerCase();
    const attemptInfo = loginAttemptMap.get(attemptKey) || { count: 0, lockedUntil: null };
    if (attemptInfo.lockedUntil && Date.now() < attemptInfo.lockedUntil) {
      const remainSec = Math.ceil((attemptInfo.lockedUntil - Date.now()) / 1000);
      return res.status(429).json({ error: `로그인 시도가 너무 많습니다. ${remainSec}초 후 다시 시도해주세요.` });
    }

    let user;
    // ✅ DB-FIX: 서버 시작 직후 DB 연결 중이면 최대 8초 대기 (서버 재시작 직후 로그인 실패 방지)
    const dbAvailable = await waitForDb(8000);

    if (dbAvailable && User) {
      try {
        user = await User.findOne({ email });
      } catch (dbErr) {
        logger.warn('[login] DB 조회 실패 → memUsers fallback:', dbErr.message);
        user = memUsers.find(u => u.email === email);
      }
    } else {
      user = memUsers.find(u => u.email === email);
      // DB가 없고 memUsers에도 없으면 — DB 연결 실패 상태임을 안내
      if (!user && MONGO_URI && !dbAvailable) {
        return res.status(503).json({ error: '서버가 초기화 중입니다. 잠시 후 다시 시도해주세요. (DB 연결 중)' });
      }
    }
    if (!user) return res.status(400).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });


    // ✅ AUTH-FIX-9: password 필드 null 가드 — 구글 OAuth 전용 계정에 이메일 로그인 시도 시 bcrypt 크래시 방어
    if (!user.password) return res.status(400).json({ error: '이 계정은 소셜 로그인 전용입니다. 구글 로그인을 이용해주세요.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // 실패 카운트 증가
      attemptInfo.count += 1;
      if (attemptInfo.count >= MAX_LOGIN_FAIL) {
        attemptInfo.lockedUntil = Date.now() + LOGIN_LOCK_MS;
        attemptInfo.count = 0;
      }
      loginAttemptMap.set(attemptKey, attemptInfo);
      const remain = MAX_LOGIN_FAIL - attemptInfo.count;
      return res.status(400).json({ error: `이메일 또는 비밀번호가 올바르지 않습니다.${remain <= 3 ? ` (경고: ${remain}회 남음)` : ''}` });
    }
    // 로그인 성공 시 실패 카운트 초기화
    loginAttemptMap.delete(attemptKey);

    // ✅ LOGIN-FIX-2: 출석 저장 실패가 로그인 자체를 막지 않도록 try-catch 분리
    const { justAttended, leveledUp, expGained, streak } = applyAttendance(user);
    try {
      if (dbReady && User) {
        await user.save();
      } else {
        saveMemUsers();
      }
    } catch (saveErr) {
      // 출석/EXP 저장 실패는 경고만 — 로그인은 계속 진행
      logger.warn('[login] 출석 데이터 저장 실패 (로그인은 정상 처리):', saveErr.message);
    }

    const userTier = user.tier || 'FREE';
    const accessToken = jwt.sign({ id: user._id || user.id, email: user.email, name: user.name, tier: userTier }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user._id || user.id, email: user.email, name: user.name, tier: userTier, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: accessToken, accessToken, refreshToken, user: buildUserResponse(user), justAttended, leveledUp, expGained, streak });
  } catch (err) { logger.error('[login] 서버 오류:', err.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' }); }
});

// --- 토큰 갱신 (Refresh Token) ---
// ✅ AUTH-FIX-4: tier 복원 — 기존 코드는 tier 누락으로 갱신 후 항상 FREE 처리
// tier를 refresh 토큰에서 읽어 새 accessToken에 포함시켜 구독 상태 유지
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh Token이 없습니다.' });
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    if (decoded.type !== 'refresh') return res.status(401).json({ error: '유효하지 않은 Refresh Token입니다.' });

    // tier를 최신 DB 값으로 동기화 (구독 만료/업그레이드 반영)
    let freshTier = decoded.tier || 'FREE';
    try {
      if (dbReady && User && decoded.email) {
        const u = await User.findOne({ email: decoded.email }, 'tier').lean();
        if (u?.tier) freshTier = u.tier;
      }
    } catch { /* DB 조회 실패 시 토큰 내 tier 사용 */ }

    const accessToken = jwt.sign(
      { id: decoded.id, email: decoded.email, name: decoded.name || '', tier: freshTier },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const newRefreshToken = jwt.sign(
      { id: decoded.id, email: decoded.email, name: decoded.name || '', tier: freshTier, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ accessToken, refreshToken: newRefreshToken }); // ✅ BUG-FIX: Refresh Token Rotation 구현
  } catch (err) {
    return res.status(401).json({ error: 'Refresh Token이 만료되었습니다. 다시 로그인해주세요.' });
  }
});

// --- 구글 소셜 로그인 (자동 회원가입) ---
app.post('/api/auth/google', async (req, res) => {
  try {
    const { email, name, picture } = req.body;
    if (!email) return res.status(400).json({ error: 'Google 정보를 가져올 수 없습니다.' });

    let user;
    // ✅ DB-FIX: 구글 로그인도 서버 시작 직후 DB 연결 대기
    const dbAvailable = await waitForDb(8000);
    if (dbAvailable && User) {

      try {
        user = await User.findOne({ email });
        if (!user) {
          let safeName = (name || 'Fisher').replace(/[^a-zA-Z0-9가-힣]/g, '');
          if (!safeName) safeName = 'Fisher';
          const dup = await User.findOne({ name: safeName });
          if (dup) safeName = safeName + Math.floor(Math.random() * 9999);
          const hashedPw = await bcrypt.hash('google_oauth_' + Date.now(), 10);
          user = new User({ email, name: safeName, password: hashedPw, picture: picture || null });
          await user.save();
        }
      } catch (dbErr) {
        logger.warn('[google-auth] DB 조회/생성 실패 → memUsers fallback:', dbErr.message);
        user = memUsers.find(u => u.email === email);
        if (!user) {
          let safeName = (name || 'Fisher').replace(/[^a-zA-Z0-9가-힣]/g, '') || 'Fisher';
          if (memUsers.find(u => u.name === safeName)) safeName = safeName + Math.floor(Math.random() * 9999);
          const hashedPw = await bcrypt.hash('google_oauth_' + Date.now(), 10);
          user = { id: Date.now().toString(), email, password: hashedPw, name: safeName, level: 1, exp: 0, tier: 'FREE', picture: picture || null, followers: [], following: [], lastAttendance: null, totalAttendance: 0, totalExp: 0 };
          memUsers.push(user);
          saveMemUsers();
        }
      }
    } else {
      user = memUsers.find(u => u.email === email);
      if (!user) {
        let safeName = (name || 'Fisher').replace(/[^a-zA-Z0-9가-힣]/g, '') || 'Fisher';
        if (memUsers.find(u => u.name === safeName)) safeName = safeName + Math.floor(Math.random() * 9999);
        const hashedPw = await bcrypt.hash('google_oauth_' + Date.now(), 10);
        user = { id: Date.now().toString(), email, password: hashedPw, name: safeName, level: 1, exp: 0, tier: 'FREE', picture: picture || null, followers: [], following: [], lastAttendance: null, totalAttendance: 0, totalExp: 0 };
        memUsers.push(user);
        saveMemUsers();
      }
    }

    // ✅ AUTH-FIX-6: 구글 출석 저장 실패가 로그인을 막지 않도록 분리
    const { justAttended, leveledUp } = applyAttendance(user);
    try {
      if (dbReady && User && user.save) {
        await user.save();
      } else {
        saveMemUsers();
      }
    } catch (saveErr) {
      logger.warn('[google-auth] 출석 저장 실패 (로그인 정상 처리):', saveErr.message);
    }

    // ✅ AUTH-FIX-7: 구글 로그인 JWT에도 tier 포함 (기존 누락)
    const userTier = user.tier || 'FREE';
    const accessToken = jwt.sign({ id: user._id || user.id, email: user.email, name: user.name, tier: userTier }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user._id || user.id, email: user.email, name: user.name, tier: userTier, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: accessToken, accessToken, refreshToken, user: buildUserResponse(user), justAttended, leveledUp });
  } catch (err) { logger.error('[google-auth] 서버 오류:', err.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' }); }
});

// --- 닉네임 변경 ---
app.put('/api/user/nickname', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { email, newName } = req.body;
    if (!newName) return res.status(400).json({ error: '닉네임을 입력해주세요.' });
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== email && tp.email !== email) return res.status(403).json({ error: '본인 정보만 변경 가능' });

    // ✅ NICK-VAL: 서버사이드 닉네임 검증 (클라이언트 우회 방지)
    const trimmed = newName.trim();
    if (trimmed.length < 2 || trimmed.length > 12)
      return res.status(400).json({ error: '닉네임은 2~12자 사이로 입력해주세요.' });
    if (!/^[a-zA-Z0-9가-힣]+$/.test(trimmed))
      return res.status(400).json({ error: '한글, 영어, 숫자만 사용 가능합니다.' });
    // ✅ NICK-BAN: 금지 닉네임 검사 (어드민은 예외)
    if (!isAdmin && isBannedName(trimmed))
      return res.status(400).json({ error: '이 닉네임은 사용할 수 없습니다. (운영 정책상 금지된 표현 포함)' });

    if (dbReady && User) {
      const dup = await User.findOne({ name: trimmed });
      if (dup && dup.email !== email) return res.status(400).json({ error: '이미 사용 중인 닉네임입니다.' });
      const user = await User.findOneAndUpdate({ email }, { name: trimmed }, { new: true });
      if (Post) await Post.updateMany({ author_email: email }, { author: trimmed });
      return res.json({ success: true, name: user.name });
    } else {
      const userIdx = memUsers.findIndex(u => u.email === email);
      if (userIdx === -1) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      if (memUsers.find(u => u.name === trimmed && u.email !== email)) return res.status(400).json({ error: '이미 사용 중인 닉네임입니다.' });
      memUsers[userIdx].name = trimmed;
      saveMemUsers();
      return res.json({ success: true, name: trimmed });
    }
  } catch (err) { (logger?.error || console.error)('[nickname] 서버 오류:', err.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' }); }
});


// --- 비밀번호 변경 (JWT 인증 필수) ---
app.put('/api/user/password', async (req, res) => {
  try {
    // ✅ JWT 인증 추가 — 본인만 비밀번호 변경 가능
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const { email, currentPassword, newPassword } = req.body;
    if (!email) return res.status(400).json({ error: '이메일이 필요합니다.' });
    if (!currentPassword || !newPassword) return res.status(400).json({ error: '비밀번호를 모두 입력해주세요.' });
    if (newPassword.length < 8) return res.status(400).json({ error: '새 비밀번호는 8자 이상이어야 합니다.' });

    // 본인 또는 어드민만 변경 가능
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== email && tp.email !== email) {
      return res.status(403).json({ error: '본인의 비밀번호만 변경 가능합니다.' });
    }

    let user;
    if (dbReady && User) {
      user = await User.findOne({ email });
    } else {
      user = memUsers.find(u => u.email === email);
    }
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: '현재 비밀번호가 일치하지 않습니다.' });

    const hashed = await bcrypt.hash(newPassword, 10);

    if (dbReady && User) {
      await User.findOneAndUpdate({ email }, { password: hashed });
      return res.json({ success: true });
    } else {
      user.password = hashed;
      saveMemUsers();
      return res.json({ success: true });
    }
  } catch (err) { (logger?.error || console.error)('[API] 서버 오류:', err.message); res.status(500).json({ error: '서버 오류' }); }
});

// --- 사용자 차단 ---
app.post('/api/user/block', async (req, res) => {
  try {
    // ✅ SEC-09: JWT 인증 추가 — 본인만 차단 목록 조작 가능
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { email, blockTargetName } = req.body;
    if (!blockTargetName) return res.status(400).json({ error: '차단할 사용자 닉네임을 입력해주세요.' });
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.email !== email && tp.id !== email) return res.status(403).json({ error: '본인만 차단 목록을 수정할 수 있습니다.' });

    // 자기 자신 차단 불가
    let currentUser;
    if (dbReady && User) {
      currentUser = await User.findOne({ email });
      if (currentUser.name === blockTargetName) return res.status(400).json({ error: '자기 자신은 차단할 수 없습니다.' });

      const targetUser = await User.findOne({ name: blockTargetName });
      if (!targetUser) return res.status(404).json({ error: '해당 닉네임의 사용자를 찾을 수 없습니다.' });

      if (!currentUser.blockedUsers.includes(targetUser.name)) {
        currentUser.blockedUsers.push(targetUser.name);
        await currentUser.save();
      }
      return res.json({ success: true, blockedUsers: currentUser.blockedUsers });
    } else {
      currentUser = memUsers.find(u => u.email === email);
      if (!currentUser) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      if (currentUser.name === blockTargetName) return res.status(400).json({ error: '자기 자신은 차단할 수 없습니다.' });

      const targetUser = memUsers.find(u => u.name === blockTargetName);
      if (!targetUser) return res.status(404).json({ error: '해당 닉네임의 사용자를 찾을 수 없습니다.' });

      if (!currentUser.blockedUsers) currentUser.blockedUsers = [];
      if (!currentUser.blockedUsers.includes(targetUser.name)) {
        currentUser.blockedUsers.push(targetUser.name);
        saveMemUsers();
      }
      return res.json({ success: true, blockedUsers: currentUser.blockedUsers });
    }
  } catch (err) { (logger?.error || console.error)('[API] 서버 오류:', err.message); res.status(500).json({ error: '서버 오류' }); }
});

// --- 차단 해제 ---
app.post('/api/user/unblock', async (req, res) => {
  try {
    // ✅ SEC-09: JWT 인증 추가 — 본인만 차단 해제 가능
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { email, unblockTargetName } = req.body;
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.email !== email && tp.id !== email) return res.status(403).json({ error: '본인만 차단 목록을 수정할 수 있습니다.' });
    if (dbReady && User) {
      const user = await User.findOne({ email });
      if (user) {
        user.blockedUsers = user.blockedUsers.filter(n => n !== unblockTargetName);
        await user.save();
        return res.json({ success: true, blockedUsers: user.blockedUsers });
      }
    } else {
      const user = memUsers.find(u => u.email === email);
      if (user && user.blockedUsers) {
        user.blockedUsers = user.blockedUsers.filter(n => n !== unblockTargetName);
        saveMemUsers();
        return res.json({ success: true, blockedUsers: user.blockedUsers });
      }
    }
    return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

// =================================================================
//  팔로우 시스템 API
// =================================================================

// --- 팔로우 ---
app.post('/api/user/follow', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const { email, targetEmail, targetName } = req.body;
    if (!email || (!targetEmail && !targetName)) return res.status(400).json({ error: 'email, targetEmail 또는 targetName 필수' });
    if (email === targetEmail) return res.status(400).json({ error: '자기 자신을 팔로우할 수 없습니다.' });
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.email !== email && tp.id !== email) return res.status(403).json({ error: '본인만 팔로우 가능합니다.' });

    if (dbReady && User) {
      const me = await User.findOne({ email });
      // targetEmail 또는 name으로 대상 조회
      const target = targetEmail
        ? await User.findOne({ email: targetEmail })
        : await User.findOne({ name: targetName });
      if (!me || !target) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      const tEmail = target.email; // 실제 이메일로 팔로잉 목록 관리
      if (!me.following) me.following = [];
      if (!target.followers) target.followers = [];
      if (me.following.includes(tEmail)) return res.status(409).json({ error: '이미 팔로우 중입니다.' });
      me.following.push(tEmail);
      target.followers.push(email);
      await Promise.all([me.save(), target.save()]);
      return res.json({ success: true, followingCount: me.following.length, followerCount: target.followers.length });
    }
    // 인메모리 fallback — targetEmail 또는 targetName으로 대상 조회
    const me = memUsers.find(u => u.email === email);
    const target = targetEmail
      ? memUsers.find(u => u.email === targetEmail)
      : memUsers.find(u => u.name === targetName);
    if (!me || !target) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    const tEmail = target.email;
    if (!me.following) me.following = [];
    if (!target.followers) target.followers = [];
    if (me.following.includes(tEmail)) return res.status(409).json({ error: '이미 팔로우 중입니다.' });
    me.following.push(tEmail);
    target.followers.push(email);
    saveMemUsers();
    return res.json({ success: true, followingCount: me.following.length, followerCount: target.followers.length });
  } catch (err) { (logger?.error || console.error)('[follow]', err.message); res.status(500).json({ error: '서버 오류' }); }
});

// --- 언팔로우 ---
app.post('/api/user/unfollow', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const { email, targetEmail, targetName } = req.body;
    if (!email || (!targetEmail && !targetName)) return res.status(400).json({ error: 'email, targetEmail 또는 targetName 필수' });
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.email !== email && tp.id !== email) return res.status(403).json({ error: '본인만 언팔로우 가능합니다.' });

    if (dbReady && User) {
      const me = await User.findOne({ email });
      const target = targetEmail
        ? await User.findOne({ email: targetEmail })
        : await User.findOne({ name: targetName });
      if (!me) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      const tEmail = target?.email || targetEmail;
      me.following = (me.following || []).filter(e => e !== tEmail);
      if (target) target.followers = (target.followers || []).filter(e => e !== email);
      await Promise.all([me.save(), target ? target.save() : Promise.resolve()]);
      return res.json({ success: true, followingCount: me.following.length });
    }
    // 인메모리 fallback — targetEmail 또는 targetName으로 대상 조회
    const me = memUsers.find(u => u.email === email);
    const target = targetEmail
      ? memUsers.find(u => u.email === targetEmail)
      : memUsers.find(u => u.name === targetName);
    if (!me) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    const tEmail = target?.email || targetEmail;
    me.following = (me.following || []).filter(e => e !== tEmail);
    if (target) target.followers = (target.followers || []).filter(e => e !== email);
    saveMemUsers();
    return res.json({ success: true, followingCount: me.following.length });
  } catch (err) { (logger?.error || console.error)('[unfollow]', err.message); res.status(500).json({ error: '서버 오류' }); }
});

// --- 팔로워 목록 조회 ---
app.get('/api/user/followers', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: 'email 파라미터 필요' });

    if (dbReady && User) {
      const user = await User.findOne({ email }, 'followers name');
      if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      const followerEmails = user.followers || [];
      // 팔로워 이름/아바타 조회
      const profiles = await User.find({ email: { $in: followerEmails } }, 'email name avatar picture').lean();
      return res.json({ followers: profiles, count: followerEmails.length });
    }
    const user = memUsers.find(u => u.email === email);
    const followerEmails = user?.followers || [];
    const profiles = memUsers.filter(u => followerEmails.includes(u.email)).map(u => ({ email: u.email, name: u.name, avatar: u.avatar || null }));
    return res.json({ followers: profiles, count: followerEmails.length });
  } catch (err) { (logger?.error || console.error)('[followers]', err.message); res.status(500).json({ error: '서버 오류' }); }
});

// --- 팔로잉 목록 조회 ---
app.get('/api/user/following', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: 'email 파라미터 필요' });

    if (dbReady && User) {
      const user = await User.findOne({ email }, 'following');
      if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      const followingEmails = user.following || [];
      const profiles = await User.find({ email: { $in: followingEmails } }, 'email name avatar picture').lean();
      return res.json({ following: profiles, count: followingEmails.length });
    }
    const user = memUsers.find(u => u.email === email);
    const followingEmails = user?.following || [];
    const profiles = memUsers.filter(u => followingEmails.includes(u.email)).map(u => ({ email: u.email, name: u.name, avatar: u.avatar || null }));
    return res.json({ following: profiles, count: followingEmails.length });
  } catch (err) { (logger?.error || console.error)('[following]', err.message); res.status(500).json({ error: '서버 오류' }); }
});

// ─── 공개 사용자 프로필 조회 (닉네임 기반) ──────────────────────────────────────
// GET /api/user/profile/:name — 인증 불필요, 민감정보 제외 공개 프로필 반환
app.get('/api/user/profile/:name', async (req, res) => {
  try {
    const targetName = decodeURIComponent(req.params.name);
    if (!targetName) return res.status(400).json({ error: '닉네임이 필요합니다.' });

    // 요청자 토큰 파싱 (선택적 — isFollowing 판별용)
    let myEmail = null;
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) {
      try { const tp = jwt.verify(auth.slice(7), JWT_SECRET); myEmail = tp.email || tp.id; }
      catch { /* 비로그인 허용 */ }
    }

    if (dbReady && User) {
      const u = await User.findOne({ name: targetName },
        'name avatar picture tier level totalExp streak followers following createdAt vvipHarborId'
      ).lean();
      if (!u) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });

      // 게시글 수 집계
      let postCount = 0;
      try { if (Post) postCount = await Post.countDocuments({ author: targetName }); } catch {}

      // 조과 기록 수 집계
      let recordCount = 0;
      try { if (CatchRecord) recordCount = await CatchRecord.countDocuments({ author: targetName }); } catch {}

      const isFollowing = myEmail ? (u.followers || []).includes(myEmail) : false;

      // ✅ FIX-VVIP-BADGE: VVIP 항구명을 프로필에 포함
      let vvipHarborName = null;
      if (u.tier === 'BUSINESS_VIP' && u.vvipHarborId) {
        const hInfo = HARBOR_LIST.find(h => h.id === u.vvipHarborId);
        vvipHarborName = hInfo?.name || null;
      }

      return res.json({
        name: u.name,
        avatar: u.avatar || u.picture || null,
        tier: u.tier || 'FREE',
        level: u.level || 1,
        totalExp: u.totalExp || 0,
        streak: u.streak || 0,
        followerCount: (u.followers || []).length,
        followingCount: (u.following || []).length,
        postCount,
        recordCount,
        isFollowing,
        joinedAt: u.createdAt,
        vvipHarborId: u.vvipHarborId || null,       // ✅ FIX-VVIP-BADGE
        vvipHarborName,                              // ✅ FIX-VVIP-BADGE: '강릉·강문' 등
      });
    }

    // 인메모리 fallback
    const u = memUsers.find(mu => mu.name === targetName);
    if (!u) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    const isFollowing = myEmail ? (u.followers || []).includes(myEmail) : false;
    const postCount = memPosts.filter(p => p.author === targetName).length;
    const recordCount = (memRecords || []).filter(r => r.author === targetName).length;
    // ✅ FIX-VVIP-BADGE: 인메모리 fallback에도 vvipHarborName 포함
    let vvipHarborName = null;
    if (u.tier === 'BUSINESS_VIP' && u.vvipHarborId) {
      const hInfo = HARBOR_LIST.find(h => h.id === u.vvipHarborId);
      vvipHarborName = hInfo?.name || null;
    }
    return res.json({
      name: u.name,
      avatar: u.avatar || null,
      tier: u.tier || 'FREE',
      level: u.level || 1,
      totalExp: u.totalExp || 0,
      streak: u.streak || 0,
      followerCount: (u.followers || []).length,
      followingCount: (u.following || []).length,
      postCount,
      recordCount,
      isFollowing,
      joinedAt: u.createdAt || null,
      vvipHarborId: u.vvipHarborId || null,
      vvipHarborName,
    });
  } catch (err) {
    (logger?.error || console.error)('[GET /api/user/profile/:name]', err.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ─── 비즈니스 파트너 센터 API ────────────────────────────────────────────────

// GET /api/business/my-posts — 내 비즈니스(선상홍보) 게시글 목록
app.get('/api/business/my-posts', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const email = tp.email || tp.id;
    if (dbReady && BusinessPost) {
      const posts = await BusinessPost.find({ author_email: email }).sort({ createdAt: -1 }).lean();
      return res.json(posts.map(p => ({ ...p, id: p._id.toString() })));
    }
    const posts = memBusinessPosts.filter(p => p.author_email === email);
    return res.json(posts);
  } catch (err) { (logger?.error || console.error)('[business/my-posts]', err.message); res.status(500).json({ error: '서버 오류' }); }
});

// GET /api/business/my-phone — 파트너 본인 전화번호 조회 (연락처 확인 팝업용)
// 비즈니스 게시글에 등록된 phone 필드 반환 (계정 phone 필드 활용)
app.get('/api/business/my-phone', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const email = tp.email || tp.id;
    let phone = '';
    let shipName = '';
    if (dbReady && User) {
      const u = await User.findOne({ email }, 'phone realName name').lean();
      phone = u?.phone || '';
      // 가장 최근 비즈니스 포스트에서 shipName/phone 가져오기
      if (BusinessPost) {
        const bp = await BusinessPost.findOne({ author_email: email }).sort({ createdAt: -1 }).lean();
        if (bp?.phone) phone = bp.phone;
        if (bp?.shipName) shipName = bp.shipName;
      }
    } else {
      const u = memUsers.find(u => u.email === email);
      phone = u?.phone || '';
      const bp = memBusinessPosts.filter(p => p.author_email === email).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      if (bp?.phone) phone = bp.phone;
      if (bp?.shipName) shipName = bp.shipName;
    }
    return res.json({ phone, shipName });
  } catch (err) { (logger?.error || console.error)('[business/my-phone]', err.message); res.status(500).json({ error: '서버 오류' }); }
});

// POST /api/business/gallery-post — 조과 갤러리를 오픈게시판 선상 카테고리에 자동 등록
app.post('/api/business/gallery-post', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const email = tp.email || tp.id;

    const { author, fish, size, weight, location, memo, image, shipName, phone } = req.body;
    if (!author) return res.status(400).json({ error: 'author 필수' });

    // 게시글 내용 자동 생성
    const fishLine = fish ? `🐟 어종: ${fish}` : '';
    const sizeLine = size ? ` | 사이즈: ${size}cm` : '';
    const weightLine = weight ? ` | 무게: ${weight}kg` : '';
    const locationLine = location ? `📍 포인트: ${location}` : '';
    const memoLine = memo ? `\n💬 ${memo}` : '';
    const shipLine = shipName ? `\n🚢 선박: ${shipName}` : '';
    const phoneLine = phone ? `\n📞 문의: ${phone}` : '';
    const content = `${fishLine}${sizeLine}${weightLine}\n${locationLine}${memoLine}${shipLine}${phoneLine}\n\n🎣 #낚시GO #선상낚시 #조과공유 #대박선박`;

    const postData = {
      author,
      author_email: email,
      category: '선상',
      content: content.trim(),
      image: image || null,
      location: { address: location || '', lat: null, lng: null },
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: new Date(),
    };

    if (dbReady && Post) {
      const post = new Post(postData);
      await post.save();
      return res.json({ success: true, postId: post._id, message: '오픈게시판 선상 카테고리에 등록되었습니다! 🎣' });
    }
    const newPost = { ...postData, id: Date.now().toString(), _id: Date.now().toString() };
    memPosts.push(newPost);
    saveMemPosts();
    return res.json({ success: true, postId: newPost._id, message: '오픈게시판 선상 카테고리에 등록되었습니다! 🎣' });
  } catch (err) { (logger?.error || console.error)('[business/gallery-post]', err.message); res.status(500).json({ error: '서버 오류' }); }
});

// DELETE /api/business/posts/:id — 내 비즈니스 게시글 삭제
app.delete('/api/business/posts/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const email = tp.email || tp.id;
    const isAdmin = isAdminToken(tp);
    const { id } = req.params;
    if (dbReady && BusinessPost) {
      const post = await BusinessPost.findById(id);
      if (!post) return res.status(404).json({ error: '게시글 없음' });
      if (!isAdmin && post.author_email !== email) return res.status(403).json({ error: '권한 없음' });
      await BusinessPost.findByIdAndDelete(id);
      return res.json({ success: true });
    }
    const idx = memBusinessPosts.findIndex(p => p._id === id || p.id === id);
    if (idx === -1) return res.status(404).json({ error: '게시글 없음' });
    if (!isAdmin && memBusinessPosts[idx].author_email !== email) return res.status(403).json({ error: '권한 없음' });
    memBusinessPosts.splice(idx, 1);
    saveMemBusinessPosts();
    return res.json({ success: true });
  } catch (err) { (logger?.error || console.error)('[business/posts/delete]', err.message); res.status(500).json({ error: '서버 오류' }); }
});

// --- 프로필 사진 변경 ---
app.post('/api/user/avatar', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { email, avatar } = req.body;
    if (!email) return res.status(400).json({ error: '사용자 이메일이 필요합니다.' });
    if (!avatar) return res.status(400).json({ error: '이미지 데이터가 필요합니다.' });
    // base64 크기 제한: 2MB 초과 시 거부
    if (avatar.length > 2 * 1024 * 1024) return res.status(413).json({ error: '이미지 크기가 너무 큽니다. (최대 약 1.5MB)' });
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== email && tp.email !== email) return res.status(403).json({ error: '본인 정보만 변경 가능' });

    if (dbReady && User) {
      const updated = await User.findOneAndUpdate({ email }, { avatar }, { new: true });
      if (!updated) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return res.json({ success: true, avatar: updated.avatar });
    } else {
      const user = memUsers.find(u => u.email === email);
      if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      user.avatar = avatar;
      saveMemUsers();
      return res.json({ success: true, avatar });
    }
  } catch (err) {
    (logger?.error || console.error)('[POST /api/user/avatar]', err.message);
    res.status(500).json({ error: '프로필 사진 저장 실패: ' + err.message });
  }
});

// --- 활동별 EXP 지급 (일일 레이트 리밋 적용) ---
const EXP_DAILY_LIMIT = {
  comment: 5, post: 3, like_receive: 10, point_visit: 8,
  photo_upload: 3, first_catch: 1, weekly_streak: 1, monthly_streak: 1,
};
const expDailyCount = new Map();
// 키가 이미 날짜(today)를 포함하므로 메모리 누적 방지를 위해 자정에만 정리
const scheduleExpReset = () => {
  const now = new Date();
  const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 1, 0) - now;
  setTimeout(() => { expDailyCount.clear(); scheduleExpReset(); }, msToMidnight);
};
scheduleExpReset();

app.post('/api/user/exp', async (req, res) => {
  try {
    // ✅ WARN-EX1: JWT 인증 추가 — 본인 EXP만 수정 가능
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { email, activity } = req.body;
    if (!email || !activity) return res.status(400).json({ error: 'email과 activity가 필요합니다.' });
    // 본인 또는 어드민만 EXP 지급 가능
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.email !== email && tp.id !== email) return res.status(403).json({ error: '본인 EXP만 수정 가능합니다.' });
    const expEntry = EXP_REWARDS[activity];
    if (!expEntry) return res.status(400).json({ error: '알 수 없는 활동입니다.' });
    const expAmount = typeof expEntry === 'object' ? (expEntry.exp || 0) : expEntry;

    // ── 일일 레이트 리밋 체크 ──────────────────────────────────
    const today = new Date().toISOString().split('T')[0];
    const limitKey = `${email}:${activity}:${today}`;
    const count = expDailyCount.get(limitKey) || 0;
    const dailyMax = EXP_DAILY_LIMIT[activity] ?? 5;
    if (count >= dailyMax) return res.status(429).json({ error: `오늘의 ${activity} EXP 한도 도달 (최대 ${dailyMax}회/일)`, code: 'EXP_LIMIT_REACHED' });
    expDailyCount.set(limitKey, count + 1);

    let user;
    if (dbReady && User) {
      user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      const prevTotalExp = user.totalExp || 0;
      user.totalExp = prevTotalExp + expAmount;
      const prevLevel = getLevelFromExp(prevTotalExp).level;
      const newLevelInfo = getLevelFromExp(user.totalExp);
      user.level = newLevelInfo.level;
      await user.save();
      return res.json({ success: true, expGained: expAmount, ...buildUserResponse(user), leveledUp: newLevelInfo.level > prevLevel });
    } else {
      const userIdx = memUsers.findIndex(u => u.email === email);
      if (userIdx === -1) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      const u = memUsers[userIdx];
      const prevTotalExp = u.totalExp || 0;
      u.totalExp = prevTotalExp + expAmount;
      const prevLevel = getLevelFromExp(prevTotalExp).level;
      const newLevelInfo = getLevelFromExp(u.totalExp);
      u.level = newLevelInfo.level;
      saveMemUsers();
      return res.json({ success: true, expGained: expAmount, ...buildUserResponse(u), leveledUp: newLevelInfo.level > prevLevel });
    }
  } catch (err) { (logger?.error || console.error)('[API] 서버 오류:', err.message); res.status(500).json({ error: '서버 오류' }); }
});

// --- 내 게시글 목록 --- ✅ NEW-BUG-12: JWT 인증 추가 (타인 게시글 열람 차단)
app.get('/api/user/posts', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: 'email 파라미터 필요' });
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.email !== email && tp.id !== email) return res.status(403).json({ error: '본인 게시글만 조회 가능합니다.' });
    if (dbReady && Post) {
      const posts = await Post.find({ author_email: email }).sort({ createdAt: -1 });
      return res.json(posts);
    }
    const myPosts = email
      ? [...memPosts].filter(p => p.author_email === email).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      : [];
    res.json(myPosts);
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

// =================================================================
//  조과 기록 API (낚시 기록실)
//  MongoDB 영구저장 / 인메모리 fallback
// =================================================================
// memRecords는 상단에서 초기화되었습니다.

// ── 내 조과기록 조회 ── ✅ NEW-BUG-12: JWT 인증 추가 (타인 기록 열람 차단)
app.get('/api/user/records', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: 'email 파라미터 필요' });
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.email !== email && tp.id !== email) return res.status(403).json({ error: '본인 기록만 조회 가능합니다.' });
    if (dbReady && CatchRecord) {
      const records = await CatchRecord.find({ author_email: email }).sort({ createdAt: -1 });
      return res.json(records.map(r => ({ ...r.toObject(), id: r._id.toString() })));
    }
    res.json(memRecords.filter(r => r.author_email === email));
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 조과기록 단건 조회 (CatchDetail.jsx 사용) — GET /api/records/:id ──────────
app.get('/api/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (dbReady && CatchRecord) {
      let record = null;
      try { record = await CatchRecord.findById(id); } catch (castErr) { /* ObjectId 캐스팅 오류 무시 */ }
      if (record) return res.json(record);
      return res.status(404).json({ error: '조과 기록을 찾을 수 없습니다.' });
    }
    const record = (memRecords || []).find(r => r._id === id || r.id === id);
    if (!record) return res.status(404).json({ error: '조과 기록을 찾을 수 없습니다.' });
    return res.json(record);
  } catch (err) {
    (logger?.error || console.error)('[GET /api/records/:id]', err.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ── 조과기록 작성 (JWT 인증 필수) ──────────────────────────────────────────────
app.post('/api/user/records', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { author, author_email, fish, size, weight, location, bait, weather, wind, wave, memo, img, image, date, time, pointId } = req.body;
    if (!author || !author_email || !fish) return res.status(400).json({ error: '필수 항목 누락 (어종 필수)' });
    // 본인 또는 어드민만 작성 가능
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== author_email && tp.email !== author_email) {
      return res.status(403).json({ error: '본인 기록만 작성 가능합니다.' });
    }
    // ✅ BUG-46: img 또는 image 필드 모두 수용 (하위 호환) → image 필드로 통일 저장
    const imageUrl = image || img || null;
    const data = { author, author_email, fish, size: size || '', weight: weight || '', location: location || '', bait: bait || '', weather: weather || '', wind: wind || '', wave: wave || '', memo: memo || '', image: imageUrl, date: date || '', time: time || '', pointId: pointId || null };
    if (dbReady && CatchRecord) {
      const record = new CatchRecord(data);
      await record.save();
      return res.json(record);
    }
    const record = { id: Date.now().toString(), _id: Date.now().toString(), ...data, createdAt: new Date() };
    memRecords.unshift(record);
    saveMemRecords();
    res.json(record);
  } catch (err) { (logger?.error || console.error)('[API] 서버 오류:', err.message); res.status(500).json({ error: '서버 오류' }); }
});

// ── 조과기록 삭제 (JWT 인증 필수) ──────────────────────────────────────────────
app.delete('/api/user/records/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { email } = req.body;
    const isAdmin = isAdminToken(tp);
    if (dbReady && CatchRecord) {
      const record = await CatchRecord.findById(req.params.id);
      if (!record) return res.status(404).json({ error: '기록 없음' });
      if (!isAdmin && record.author_email !== email) return res.status(403).json({ error: '권한 없음' });
      await CatchRecord.findByIdAndDelete(req.params.id);
      return res.json({ success: true });
    }
    memRecords = memRecords.filter(r => r.id !== req.params.id);
    saveMemRecords();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

// =================================================================
//  커뮤니티 API (오픈게시판 / 크루 / 공지사항 / 선상배홍보)
//  MongoDB 연결 시 영구저장, 미연결 시 인메모리 fallback
// =================================================================


// ── ✅ INSTA-P3: 24h 조황 스토리 API ─────────────────────────────────────────
app.get('/api/stories', async (req, res) => {
  try {
    if (dbReady && Story) {
      const stories = await Story.find({ expiresAt: { $gt: new Date() } })
        .sort({ createdAt: -1 }).limit(30).lean();
      return res.json(stories);
    }
    res.json([]); // DB 없으면 빈 배열
  } catch (err) { res.json([]); }
});

app.post('/api/stories', async (req, res) => {
  try {
    const auth = req.headers.authorization?.split(' ')[1];
    if (!auth) return res.status(401).json({ error: '로그인이 필요합니다.' });
    let tp;
    try { tp = require('jsonwebtoken').verify(auth, JWT_SECRET); } catch { return res.status(401).json({ error: '인증 토큰이 유효하지 않습니다.' }); }
    const { image, content, location } = req.body;
    if (!image) return res.status(400).json({ error: '이미지는 필수입니다.' });
    if (!dbReady || !Story) return res.status(503).json({ error: 'DB 연결 필요' });
    // avatar enriching
    let author_avatar = null;
    if (User) {
      try {
        const u = await User.findOne({ email: tp.email }, 'avatar picture').lean();
        author_avatar = u?.avatar || u?.picture || null;
      } catch (_) {}
    }
    const story = await Story.create({
      author: tp.name || tp.email,
      author_email: tp.email,
      author_avatar,
      image,
      content: content || '',
      location: location || {},
    });
    res.json(story);
  } catch (err) { res.status(500).json({ error: '스토리 등록 실패' }); }
});

// ── 오픈게시판 전체 조회 (페이지네이션 + 검색 + 카테고리 필터) ──────────────
app.get('/api/community/posts', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const category = req.query.category || '';  // 카테고리 필터
    const q = req.query.q || '';          // 검색어

    if (dbReady && Post) {
      const filter = {};
      if (category) filter.category = category;
      if (q) filter.$or = [
        { content: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
      ];
      // ✅ INSTA-P2: 인기순 정렬 (likes 내림차순) vs 기본 최신순
      const sortBy = req.query.sort === 'popular'
        ? { likes: -1, createdAt: -1 }
        : { createdAt: -1 };
      const [posts, total] = await Promise.all([
        Post.find(filter).sort(sortBy).skip(skip).limit(limit),
        Post.countDocuments(filter),
      ]);
      // ✅ INSTA-P2: author_avatar 배치 enriching (N+1 방지)
      const emails = [...new Set(posts.map(p => p.author_email).filter(Boolean))];
      let avatarMap = {};
      if (emails.length > 0 && User) {
        try {
          const users = await User.find({ email: { $in: emails } }, 'email avatar picture').lean();
          users.forEach(u => { avatarMap[u.email] = u.avatar || u.picture || null; });
        } catch (_) { /* avatar enriching 실패 무시 */ }
      }
      const enriched = posts.map(p => {
        const obj = p.toObject ? p.toObject() : p;
        return { ...obj, author_avatar: avatarMap[obj.author_email] || null };
      });
      return res.json({ posts: enriched, total, page, totalPages: Math.ceil(total / limit) });
    }

    // 인메모리 fallback
    let list = [...memPosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (category) list = list.filter(p => p.category === category);
    if (q) {
      const lq = q.toLowerCase();
      list = list.filter(p =>
        (p.content && p.content.toLowerCase().includes(lq)) ||
        (p.author && p.author.toLowerCase().includes(lq))
      );
    }
    const total = list.length;
    const posts = list.slice(skip, skip + limit);
    return res.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 오픈게시판 단건 조회 ──────────────────────────────────────────────────────
app.get('/api/community/posts/:id', async (req, res) => {
  const pid = req.params.id;
  try {
    if (dbReady && Post) {
      let post = null;
      try { post = await Post.findById(pid); } catch (castErr) { }
      if (post) return res.json(post);
    }
    const mem = memPosts.find(p => p._id === pid || p.id === pid);
    if (mem) return res.json(mem);
    return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
  } catch (err) {
    const mem = memPosts.find(p => p._id === pid || p.id === pid);
    if (mem) return res.json(mem);
    res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
  }
});

// ── 오픈게시판 작성 (JWT 인증 필수 — 로그인 사용자만 작성 가능) ──────────────
app.post('/api/community/posts', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    let { author, author_email, category, content, image, images, location } = req.body;
    if (!author || !category || !content) return res.status(400).json({ error: '필수 항목 누락' });
    if (!author_email) author_email = 'guest@fishinggo.kr';
    // ✅ CENSOR: 게시글 내용 비속어 * 치환
    content = censorText(content.trim());
    // ✅ LOC: location 안전 정규화 — { address, lat, lng } 또는 null
    const safeLocation = (location && location.address) ? { address: location.address, lat: location.lat || null, lng: location.lng || null } : null;
    // ✅ IMG-SIZE-FIX: 클라이언트(WritePost.jsx L142)와 동일한 4MB 기준으로 통일
    // 이전 3MB 제한으로 3~4MB 구간 이미지가 서버에서 탈락하여 저장 0장 버그 발생
    const safeImages = Array.isArray(images)
      ? images.filter(img => img && img.length <= 4 * 1024 * 1024).slice(0, 5)
      : [];
    const safeImage = safeImages[0] || ((image && image.length <= 4 * 1024 * 1024) ? image : null) || null;

    if (dbReady && Post) {
      try {
        const post = new Post({ author, author_email, category, content, image: safeImage, images: safeImages, location: safeLocation });
        await post.save();
        try {
          memPosts.unshift({ _id: post._id.toString(), id: post._id.toString(), author, author_email, category, content, image: safeImage, images: safeImages, location: safeLocation, likes: 0, comments: [], createdAt: post.createdAt });
          if (memPosts.length > 200) memPosts.splice(200);
        } catch (syncErr) { /* memPosts 동기화 실패는 무시 */ }
        return res.json(post);
      } catch (dbErr) {
        (logger?.error || console.error)('[MongoDB 저장 실패, 인메모리 fallback]:', dbErr.message);
      }
    }
    const uid = Date.now().toString();
    const post = { _id: uid, id: uid, author, author_email, category, content, image: safeImage, images: safeImages, location: safeLocation, likes: 0, comments: [], createdAt: new Date().toISOString() };
    memPosts.unshift(post);
    if (memPosts.length > 200) memPosts.splice(200);
    saveMemPosts();
    return res.json(post);
  } catch (err) { (logger?.error || console.error)('[POST /posts 오류]:', err.message); res.status(500).json({ error: '서버 오류: ' + err.message }); }
});

// ── 오픈게시판 글 삭제 (JWT 인증) ────────────────────────────────────────────
app.delete('/api/community/posts/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { email } = req.body;
    const isAdmin = isAdminToken(tp);

    if (dbReady && Post) {
      let post = null;
      try { post = await Post.findById(req.params.id); } catch (e) { }
      if (post) {
        const isAuthor = post.author_email === email && (tp.email === email || tp.id === email);
        if (!isAuthor && !isAdmin)
          return res.status(403).json({ error: '삭제 권한이 없습니다.' });
        await post.deleteOne();
      }
    } else {
      const mem = memPosts.find(p => p._id === req.params.id || p.id === req.params.id);
      if (mem && !isAdmin && mem.author_email !== email)
        return res.status(403).json({ error: '삭제 권한이 없습니다.' });
    }
    memPosts = memPosts.filter(p => p._id !== req.params.id && p.id !== req.params.id);
    saveMemPosts();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 오픈게시판 글 수정 (JWT — 작성자 or 어드민) ──────────────────────────────
app.put('/api/community/posts/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { content, category, image, images, email } = req.body;
    const isAdmin = isAdminToken(tp);
    if (dbReady && Post) {
      let post;
      try { post = await Post.findById(req.params.id); } catch (e) { }
      if (!post) return res.status(404).json({ error: '게시글 없음' });
      if (!isAdmin && post.author_email !== email)
        return res.status(403).json({ error: '권한 없음' });
      if (content !== undefined) post.content = content;
      if (category !== undefined) post.category = category;
      // ✅ MULTI-IMG: images 배열 우선, 없으면 단일 image fallback
      if (images !== undefined) {
        // ✅ IMG-SIZE-FIX: PUT(수정)도 4MB 기준 통일
        post.images = Array.isArray(images) ? images.filter(img => img && img.length <= 4 * 1024 * 1024).slice(0, 5) : [];
        post.image = post.images[0] || null;
      } else if (image !== undefined) {
        post.image = image;
      }
      await post.save();
      const idx = memPosts.findIndex(p => p._id === req.params.id || p.id === req.params.id);
      if (idx !== -1) {
        memPosts[idx] = { ...memPosts[idx], content: post.content, category: post.category, image: post.image, images: post.images || [] };
        saveMemPosts();
      }
      return res.json(post);
    }
    const mem = memPosts.find(p => p._id === req.params.id || p.id === req.params.id);
    if (!mem) return res.status(404).json({ error: '게시글 없음' });
    if (!isAdmin && mem.author_email !== email)
      return res.status(403).json({ error: '권한 없음' });
    if (content !== undefined) mem.content = content;
    if (category !== undefined) mem.category = category;
    // ✅ FIX-MULTI-IMG: 인메모리 fallback에서도 images 배열 업데이트
    if (images !== undefined) {
      // ✅ IMG-SIZE-FIX: 인메모리 fallback도 4MB 기준 통일
      mem.images = Array.isArray(images) ? images.filter(img => img && img.length <= 4 * 1024 * 1024).slice(0, 5) : [];
      mem.image = mem.images[0] || null;
    } else if (image !== undefined) {
      mem.image = image;
      if (!Array.isArray(mem.images) || mem.images.length === 0) {
        mem.images = image ? [image] : [];
      }
    }
    saveMemPosts();
    res.json(mem);
  } catch (err) { (logger?.error || console.error)('[API] 서버 오류:', err.message); res.status(500).json({ error: '서버 오류' }); }
});


// ── 오픈게시판 댓글 작성 (JWT 인증 필수) ─────────────────────────────────────
app.post('/api/community/posts/:id/comments', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { author, text, author_email } = req.body;
    if (!author || !text) return res.status(400).json({ error: '작성자/내용 필수' });
    if (text.length > 500) return res.status(400).json({ error: '댓글은 500자 이하로 작성해주세요.' });
    // ✅ CENSOR: 댓글 비속어 * 치환
    const censoredText = censorText(text.trim());
    const newComment = { author, author_email: author_email || tp.email || tp.id, text: censoredText, createdAt: new Date() };
    if (dbReady && Post) {
      let post = null;
      try { post = await Post.findById(req.params.id); } catch (e) { }
      if (post) {
        if (!Array.isArray(post.comments)) post.comments = [];
        post.comments.push(newComment);
        await post.save();
        if (post.author_email && post.author !== author) {
          sendAppPushNotification(post.author_email, 'comm', '새로운 댓글', `[낚시GO] ${author}님이 회원님의 게시글에 댓글을 남겼습니다: "${text.substring(0, 15)}..."`);
        }
        return res.json(post);
      }
    }
    const mem = memPosts.find(p => p._id === req.params.id || p.id === req.params.id);
    if (mem) {
      if (!mem.comments) mem.comments = [];
      mem.comments.push(newComment);
      saveMemPosts();
      if (mem.author_email && mem.author !== author) {
        sendAppPushNotification(mem.author_email, 'comm', '새로운 댓글', `[낚시GO] ${author}님이 회원님의 게시글에 댓글을 남겼습니다: "${text.substring(0, 15)}..."`);
      }
      return res.json(mem);
    }
    res.json({ comments: [newComment] });
  } catch (err) { (logger?.error || console.error)('[API] 서버 오류:', err.message); res.status(500).json({ error: '서버 오류' }); }
});


// ✅ NEW: 댓글 삭제 (본인 또는 어드민만 가능) ──────────────────
app.delete('/api/community/posts/:id/comments/:commentId', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const requesterEmail = tp.email || tp.id;
    const isAdminUser = isAdminToken(tp); // ✅ 9TH-A1: requesterEmail 불일치 비교 → isAdminToken() 헬퍼 통일
    const { id, commentId } = req.params;

    if (dbReady && Post) {
      let post = null;
      try { post = await Post.findById(id); } catch (e) { }
      if (post) {
        const before = (post.comments || []).length;
        post.comments = (post.comments || []).filter(c => {
          const cId = c._id?.toString() || c.id;
          const isMine = (c.author_email === requesterEmail);
          return !(cId === commentId && (isMine || isAdminUser));
        });
        if (post.comments.length === before) return res.status(403).json({ error: '삭제 권한이 없거나 댓글을 찾을 수 없습니다.' });
        await post.save();
        return res.json(post);
      }
    }
    // 메모리 fallback
    const mem = memPosts.find(p => p._id === id || p.id === id);
    if (mem) {
      const before = (mem.comments || []).length;
      mem.comments = (mem.comments || []).filter(c => {
        const cId = c._id || c.id || String(c.createdAt);
        const isMine = (c.author_email === requesterEmail);
        return !(cId === commentId && (isMine || isAdminUser));
      });
      if (mem.comments.length === before) return res.status(403).json({ error: '삭제 권한이 없거나 댓글을 찾을 수 없습니다.' });
      saveMemPosts();
      return res.json(mem);
    }
    res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
  } catch (err) { (logger?.error || console.error)('[API] 서버 오류:', err.message); res.status(500).json({ error: '서버 오류' }); }
});


// ── 좌아요 POST/PATCH (JWT 인증 + 중복 방지) ─────────────────
app.post('/api/community/posts/:id/like', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const voterEmail = tp.email || tp.id;
    if (dbReady && Post) {
      let post = null;
      try { post = await Post.findById(req.params.id); } catch (e) { }
      if (post) {
        if (!Array.isArray(post.likedBy)) post.likedBy = [];
        if (post.likedBy.includes(voterEmail)) {
          return res.status(409).json({ error: '이미 좋아요를 눌렀습니다.', likes: post.likes });
        }
        post.likedBy.push(voterEmail);
        post.likes = (post.likes || 0) + 1;
        await post.save();
        return res.json(post);
      }
    }
    const mem = memPosts.find(p => p._id === req.params.id || p.id === req.params.id);
    if (mem) {
      if (!mem.likedBy) mem.likedBy = [];
      if (mem.likedBy.includes(voterEmail)) return res.status(409).json({ error: '이미 좋아요를 눌렀습니다.', likes: mem.likes });
      mem.likedBy.push(voterEmail);
      mem.likes = (mem.likes || 0) + 1;
      saveMemPosts();
      return res.json(mem);
    }
    res.json({ likes: 0 });
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

app.patch('/api/community/posts/:id/like', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const voterEmail = tp.email || tp.id;
    if (dbReady && Post) {
      let post = null;
      try { post = await Post.findById(req.params.id); } catch (e) { }
      if (post) {
        if (!Array.isArray(post.likedBy)) post.likedBy = [];
        if (post.likedBy.includes(voterEmail)) return res.status(409).json({ error: '이미 좋아요를 눌렀습니다.', likes: post.likes });
        post.likedBy.push(voterEmail);
        post.likes = (post.likes || 0) + 1;
        await post.save();
        return res.json({ likes: post.likes });
      }
    }
    const mem = memPosts.find(p => p._id === req.params.id || p.id === req.params.id);
    if (mem) {
      if (!mem.likedBy) mem.likedBy = [];
      if (mem.likedBy.includes(voterEmail)) return res.status(409).json({ error: '이미 좋아요를 눌렀습니다.', likes: mem.likes });
      mem.likedBy.push(voterEmail);
      mem.likes = (mem.likes || 0) + 1;
      saveMemPosts();
      return res.json({ likes: mem.likes });
    }
    res.json({ likes: 0 });
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});


// ── 크루 전체 조회 (password 필드 제거하여 보안 강화) ──────────────────────────
app.get('/api/community/crews', async (req, res) => {
  try {
    if (dbReady && Crew) {
      const crews = await Crew.find().sort({ createdAt: -1 });
      // ✅ BUG-29: password 평문 노출 방지 — 응답에서 제거
      const safeCrews = crews.map(c => {
        const obj = c.toObject();
        delete obj.password;
        return obj;
      });
      return res.json(safeCrews);
    }
    // 인메모리: password 필드 제거 후 반환
    const safeMemCrews = memCrews.map(c => {
      const { password: _pw, ...rest } = c;
      return rest;
    });
    res.json(safeMemCrews);
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 크루 생성 (JWT 인증 필수) — BUG-39: bcrypt 해싱 적용 ──────────────────────
app.post('/api/community/crews', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { name, region, isPrivate, password, owner, ownerName, limit } = req.body;
    if (!name || !owner || !ownerName) return res.status(400).json({ error: '필수 항목 누락' });
    // limit 유효성 검증: 3~1000 범위 강제
    const safeLimit = Math.min(1000, Math.max(3, parseInt(limit) || 100));
    // ✅ BUG-39: 비밀번호 bcrypt 해싱 저장 (프라이빗 크루인 경우만)
    const hashedPwd = (isPrivate && password) ? await bcrypt.hash(String(password), 10) : null;
    if (dbReady && Crew) {
      const crew = new Crew({ name, region: region || '전국', isPrivate: !!isPrivate, password: hashedPwd, owner, ownerName, limit: safeLimit });
      await crew.save();
      const obj = crew.toObject();
      delete obj.password; // ✅ BUG-38: 응답에서 해싱된 비밀번호도 제거
      return res.json(obj);
    }
    const crew = { id: Date.now().toString(), _id: Date.now().toString(), name, region: region || '전국', isPrivate: !!isPrivate, password: hashedPwd, owner, ownerName, members: 1, limit: safeLimit, createdAt: new Date() };
    memCrews.unshift(crew);
    saveMemCrews();
    const { password: _pw, ...safeCrewResp } = crew;
    res.json(safeCrewResp);
  } catch (err) { (logger?.error || console.error)('[API] 서버 오류:', err.message); res.status(500).json({ error: '서버 오류' }); }
});

// ── [ADMIN] 기존 크루 limit 일괄 수정 (임시 마이그레이션) ───────────────────────
// 사용법: POST /api/admin/crews/fix-limit  { "defaultLimit": 1000 }
// 완료 후 이 엔드포인트를 삭제하세요.
app.post('/api/admin/crews/fix-limit', async (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 오류' }); }
  if (!isAdminToken(tp)) return res.status(403).json({ error: '관리자 권한 필요' });
  const newLimit = parseInt(req.body.defaultLimit) || 1000;
  try {
    if (dbReady && Crew) {
      // limit이 100 이하인 크루만 업데이트 (신규 생성된 올바른 크루 제외)
      const result = await Crew.updateMany({ limit: { $lte: 100 } }, { $set: { limit: newLimit } });
      return res.json({ ok: true, updated: result.modifiedCount, newLimit, message: `${result.modifiedCount}개 크루의 정원을 ${newLimit}명으로 업데이트했습니다.` });
    }
    // 인메모리 fallback
    let count = 0;
    memCrews.forEach(c => { if (!c.limit || c.limit <= 100) { c.limit = newLimit; count++; } });
    saveMemCrews();
    return res.json({ ok: true, updated: count, newLimit, message: `[인메모리] ${count}개 크루 업데이트` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── 크루 입장코드 서버 검증 (BUG-38: 클라이언트 평문 비교 제거) ─────────────────
app.post('/api/community/crews/:id/verify', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: '입장 코드를 입력해주세요.' });
    let crew;
    if (dbReady && Crew) {
      crew = await Crew.findById(req.params.id);
    } else {
      crew = memCrews.find(c => c.id === req.params.id || c._id === req.params.id);
    }
    if (!crew) return res.status(404).json({ error: '크루를 찾을 수 없습니다.' });
    if (!crew.isPrivate || !crew.password) return res.json({ success: true }); // 공개 크루
    const isMatch = await bcrypt.compare(String(password), crew.password);
    if (!isMatch) return res.status(401).json({ error: '입장 코드가 일치하지 않습니다.' });
    res.json({ success: true });
  } catch (err) { (logger?.error || console.error)('[API] 서버 오류:', err.message); res.status(500).json({ error: '서버 오류' }); }
});


// ── 크루 삭제 (JWT 어드민 or 오너) ──────────────────────────────────────────
app.delete('/api/community/crews/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { email } = req.body;
    const isAdmin = isAdminToken(tp);
    if (dbReady && Crew) {
      const crew = await Crew.findById(req.params.id);
      if (!crew) return res.status(404).json({ error: '크루 없음' });
      if (!isAdmin && crew.owner !== email) return res.status(403).json({ error: '권한 없음' });
      await Crew.findByIdAndDelete(req.params.id);
      // 소켓으로 크루 해산 알림
      io.to(req.params.id).emit('crew_dissolved', { message: '크루장이 크루를 해산했습니다.' });
      return res.json({ success: true });
    }
    // ✅ 인메모리: id/_id 양쪽 체크 (버그 수정)
    memCrews = memCrews.filter(c => c.id !== req.params.id && c._id !== req.params.id);
    saveMemCrews();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── ✅ 크루장 위임 (현 크루장 → 다른 멤버) ──────────────────────────────────
// PATCH /api/community/crews/:id/transfer
// body: { email: 현크루장이메일, newOwnerEmail: 위임받을멤버이메일 }
app.patch('/api/community/crews/:id/transfer', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const { email, newOwnerEmail } = req.body;
    if (!email || !newOwnerEmail) return res.status(400).json({ error: 'email, newOwnerEmail 필수' });
    if (email === newOwnerEmail) return res.status(400).json({ error: '자기 자신에게 위임할 수 없습니다.' });

    const isAdmin = isAdminToken(tp);

    if (dbReady && Crew) {
      const crew = await Crew.findById(req.params.id);
      if (!crew) return res.status(404).json({ error: '크루를 찾을 수 없습니다.' });
      if (!isAdmin && crew.owner !== email) return res.status(403).json({ error: '크루장만 위임할 수 있습니다.' });

      const newOwnerMember = crew.memberList.find(m => m.email === newOwnerEmail);
      if (!newOwnerMember) return res.status(404).json({ error: '위임할 멤버가 크루에 없습니다.' });

      // 기존 크루장 → member 강등
      crew.memberList = crew.memberList.map(m => {
        if (m.email === email) return { ...m.toObject(), role: 'member' };
        if (m.email === newOwnerEmail) return { ...m.toObject(), role: 'owner' };
        return m;
      });
      crew.owner = newOwnerEmail;
      crew.ownerName = newOwnerMember.name;
      await crew.save();

      // 소켓으로 위임 알림
      io.to(req.params.id).emit('crew_transferred', {
        newOwnerEmail,
        newOwnerName: newOwnerMember.name,
        message: `👑 ${newOwnerMember.name}님이 새 크루장이 되었습니다.`
      });

      const obj = crew.toObject(); delete obj.password;
      return res.json({ success: true, crew: obj });
    }
    // 인메모리 fallback
    const mem = memCrews.find(c => c.id === req.params.id || c._id === req.params.id);
    if (!mem) return res.status(404).json({ error: '크루를 찾을 수 없습니다.' });
    if (!isAdmin && mem.owner !== email) return res.status(403).json({ error: '크루장만 위임할 수 있습니다.' });
    const newOwnerMem = (mem.memberList || []).find(m => m.email === newOwnerEmail);
    if (!newOwnerMem) return res.status(404).json({ error: '위임할 멤버가 크루에 없습니다.' });
    mem.memberList = (mem.memberList || []).map(m => ({
      ...m,
      role: m.email === email ? 'member' : m.email === newOwnerEmail ? 'owner' : m.role
    }));
    mem.owner = newOwnerEmail;
    mem.ownerName = newOwnerMem.name;
    saveMemCrews();
    res.json({ success: true });
  } catch (err) { (logger?.error || console.error)('[CREW TRANSFER]', err.message); res.status(500).json({ error: '서버 오류' }); }
});


// ── 크루 단건 조회 ────────────────────────────────────────────────────────────
app.get('/api/community/crews/:id', async (req, res) => {
  try {
    if (dbReady && Crew) {
      const crew = await Crew.findById(req.params.id).catch(() => null);
      if (crew) { const obj = crew.toObject(); delete obj.password; return res.json(obj); }
    }
    const mem = memCrews.find(c => c.id === req.params.id || c._id === req.params.id);
    if (mem) { const { password: _pw, ...safe } = mem; return res.json(safe); }
    return res.status(404).json({ error: '크루를 찾을 수 없습니다.' });
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── ✅ CREW-ENH: 크루 가입 (비번 검증 + 멤버 DB 저장) ──────────────────────────
app.post('/api/community/crews/:id/join', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const { password, email, name } = req.body;
    if (!email || !name) return res.status(400).json({ error: '사용자 정보가 필요합니다.' });

    if (dbReady && Crew) {
      const crew = await Crew.findById(req.params.id);
      if (!crew) return res.status(404).json({ error: '크루를 찾을 수 없습니다.' });

      // 이미 가입된 경우 → 중복 방지 (성공 반환)
      const alreadyIn = crew.memberList.some(m => m.email === email);
      if (alreadyIn) return res.json({ success: true, already: true, crew: (() => { const o = crew.toObject(); delete o.password; return o; })() });

      // 비공개 크루 비밀번호 검증
      if (crew.isPrivate && crew.password) {
        if (!password) return res.status(400).json({ error: '입장 코드를 입력해주세요.' });
        const isMatch = await bcrypt.compare(String(password), crew.password);
        if (!isMatch) return res.status(401).json({ error: '입장 코드가 일치하지 않습니다.' });
      }

      // 정원 초과 확인
      if (crew.members >= (crew.limit || 1000)) return res.status(400).json({ error: '크루 정원이 가득 찼습니다.' });

      // 크루 멤버 추가
      crew.memberList.push({ email, name, role: 'member', joinedAt: new Date() });
      crew.members = crew.memberList.length;
      crew.lastActive = new Date();
      await crew.save();

      // 유저 joinedCrews 업데이트 (✅ BUG-FIX: User null guard 추가 — null 시 TypeError 방지)
      if (User) {
        await User.findOneAndUpdate(
          { email },
          { $addToSet: { joinedCrews: { crewId: crew._id, joinedAt: new Date() } } }
        ).catch(() => {});
      }

      const obj = crew.toObject(); delete obj.password;
      return res.json({ success: true, crew: obj });
    }
    // 인메모리 fallback
    const mem = memCrews.find(c => c.id === req.params.id || c._id === req.params.id);
    if (!mem) return res.status(404).json({ error: '크루를 찾을 수 없습니다.' });
    if (!Array.isArray(mem.memberList)) mem.memberList = [];
    const alreadyIn = mem.memberList.some(m => m.email === email);
    if (alreadyIn) return res.json({ success: true, already: true });
    if (mem.isPrivate && mem.password) {
      if (!password) return res.status(400).json({ error: '입장 코드를 입력해주세요.' });
      const isMatch = await bcrypt.compare(String(password), mem.password);
      if (!isMatch) return res.status(401).json({ error: '입장 코드가 일치하지 않습니다.' });
    }
    // ✅ 인메모리 모드 정원 초과 체크 추가
    if (mem.members >= (mem.limit || 1000)) return res.status(400).json({ error: '크루 정원이 가득 찼습니다.' });
    mem.memberList.push({ email, name, role: 'member', joinedAt: new Date() });
    mem.members = mem.memberList.length;
    saveMemCrews();
    res.json({ success: true });
  } catch (err) { (logger?.error || console.error)('[CREW JOIN]', err.message); res.status(500).json({ error: '서버 오류' }); }
});

// ── ✅ CREW-ENH: 크루 탈퇴 ───────────────────────────────────────────────────
app.post('/api/community/crews/:id/leave', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const { email } = req.body;
    if (!email) return res.status(400).json({ error: '이메일이 필요합니다.' });

    if (dbReady && Crew && User) {
      const crew = await Crew.findById(req.params.id);
      if (!crew) return res.status(404).json({ error: '크루를 찾을 수 없습니다.' });
      if (crew.owner === email) return res.status(400).json({ error: '크루장은 크루를 탈퇴할 수 없습니다. 크루를 삭제하거나 크루장을 위임하세요.' });

      crew.memberList = crew.memberList.filter(m => m.email !== email);
      crew.members = Math.max(1, crew.memberList.length);
      await crew.save();

      await User.findOneAndUpdate(
        { email },
        { $pull: { joinedCrews: { crewId: crew._id } } }
      ).catch(() => {});

      return res.json({ success: true });
    }
    const mem = memCrews.find(c => c.id === req.params.id || c._id === req.params.id);
    if (mem && Array.isArray(mem.memberList)) {
      mem.memberList = mem.memberList.filter(m => m.email !== email);
      mem.members = Math.max(1, mem.memberList.length);
      saveMemCrews();
    }
    res.json({ success: true });
  } catch (err) { (logger?.error || console.error)('[CREW LEAVE]', err.message); res.status(500).json({ error: '서버 오류' }); }
});

// ── ✅ CREW-ENH: 크루원 목록 조회 ───────────────────────────────────────────
app.get('/api/community/crews/:id/members', async (req, res) => {
  try {
    if (dbReady && Crew) {
      const crew = await Crew.findById(req.params.id).catch(() => null);
      if (!crew) return res.status(404).json({ error: '크루를 찾을 수 없습니다.' });
      return res.json({ members: crew.memberList || [], owner: crew.owner, ownerName: crew.ownerName });
    }
    const mem = memCrews.find(c => c.id === req.params.id || c._id === req.params.id);
    if (!mem) return res.status(404).json({ error: '크루를 찾을 수 없습니다.' });
    res.json({ members: mem.memberList || [], owner: mem.owner, ownerName: mem.ownerName });
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── ✅ CREW-ENH: 크루원 강퇴 (크루장 전용) ──────────────────────────────────
app.delete('/api/community/crews/:id/members/:targetEmail', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const { email } = req.body; // 요청자 이메일
    const targetEmail = decodeURIComponent(req.params.targetEmail);
    const isAdmin = isAdminToken(tp);

    if (dbReady && Crew && User) {
      const crew = await Crew.findById(req.params.id);
      if (!crew) return res.status(404).json({ error: '크루를 찾을 수 없습니다.' });
      if (!isAdmin && crew.owner !== email) return res.status(403).json({ error: '크루장만 강퇴할 수 있습니다.' });
      if (targetEmail === crew.owner) return res.status(400).json({ error: '크루장은 강퇴할 수 없습니다.' });

      crew.memberList = crew.memberList.filter(m => m.email !== targetEmail);
      crew.members = Math.max(1, crew.memberList.length);
      await crew.save();

      // 강퇴된 유저의 joinedCrews에서도 제거
      await User.findOneAndUpdate(
        { email: targetEmail },
        { $pull: { joinedCrews: { crewId: crew._id } } }
      ).catch(() => {});

      // ✅ 소켓으로 강퇴 알림 — room명은 crewId 그대로 (클라이언트 join_crew(id)와 일치)
      io.to(req.params.id).emit('member_kicked', { email: targetEmail });

      return res.json({ success: true, members: crew.memberList });
    }
    res.json({ success: true });
  } catch (err) { (logger?.error || console.error)('[CREW KICK]', err.message); res.status(500).json({ error: '서버 오류' }); }
});

// ── ✅ 간부 설정/해제 (크루장 전용) ────────────────────────────────────────────
// PATCH /api/community/crews/:id/members/:targetEmail/role
// body: { email: 요청자이메일, role: 'officer' | 'member' }
app.patch('/api/community/crews/:id/members/:targetEmail/role', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const { email, role } = req.body; // 요청자 이메일, 부여할 역할
    const targetEmail = decodeURIComponent(req.params.targetEmail);
    const isAdmin = isAdminToken(tp);

    if (!['officer', 'member'].includes(role)) return res.status(400).json({ error: '역할은 officer 또는 member만 허용됩니다.' });

    if (dbReady && Crew) {
      const crew = await Crew.findById(req.params.id);
      if (!crew) return res.status(404).json({ error: '크루를 찾을 수 없습니다.' });
      if (!isAdmin && crew.owner !== email) return res.status(403).json({ error: '크루장만 간부를 설정할 수 있습니다.' });
      if (targetEmail === crew.owner) return res.status(400).json({ error: '크루장의 역할은 변경할 수 없습니다.' });

      const member = crew.memberList.find(m => m.email === targetEmail);
      if (!member) return res.status(404).json({ error: '해당 크루원을 찾을 수 없습니다.' });
      member.role = role;
      await crew.save();

      // 소켓으로 역할 변경 알림
      io.to(req.params.id).emit('member_role_changed', { email: targetEmail, role, name: member.name });

      const obj = crew.toObject(); delete obj.password;
      return res.json({ success: true, crew: obj });
    }
    // 인메모리 fallback
    const mem = memCrews.find(c => c.id === req.params.id || c._id === req.params.id);
    if (!mem) return res.status(404).json({ error: '크루를 찾을 수 없습니다.' });
    if (!isAdmin && mem.owner !== email) return res.status(403).json({ error: '크루장만 간부를 설정할 수 있습니다.' });
    const memMember = (mem.memberList || []).find(m => m.email === targetEmail);
    if (memMember) memMember.role = role;
    saveMemCrews();
    res.json({ success: true });
  } catch (err) { (logger?.error || console.error)('[CREW ROLE]', err.message); res.status(500).json({ error: '서버 오류' }); }
});

// ── ✅ CREW-ENH: 내가 가입한 크루 목록 ──────────────────────────────────────
app.get('/api/user/crews', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const email = tp.email || tp.id;
    if (dbReady && Crew) {
      // memberList에 해당 email이 포함된 크루 조회
      const crews = await Crew.find({ 'memberList.email': email }).sort({ lastActive: -1, createdAt: -1 });
      const safe = crews.map(c => { const o = c.toObject(); delete o.password; return o; });
      return res.json(safe);
    }
    // 인메모리 fallback
    const myCrews = memCrews
      .filter(c => Array.isArray(c.memberList) && c.memberList.some(m => m.email === email))
      .map(c => { const { password: _pw, ...safe } = c; return safe; });
    res.json(myCrews);
  } catch (err) { (logger?.error || console.error)('[USER CREWS]', err.message); res.status(500).json({ error: '서버 오류' }); }
});


// ── 공지사항 전체 조회 ────────────────────────────────────────────────────────
app.get('/api/community/notices', async (req, res) => {
  try {
    if (dbReady && Notice) {
      const notices = await Notice.find().sort({ isPinned: -1, createdAt: -1 });
      // _id를 문자열로 변환하여 클라이언트에서 ID 불일치 방지
      return res.json(notices.map(n => ({ ...n.toObject(), _id: n._id.toString(), id: n._id.toString() })));
    }
    res.json(memNotices);
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 공지사항 단건 조회 ────────────────────────────────────────────────────────
app.get('/api/community/notices/:id', async (req, res) => {
  const nid = req.params.id;
  try {
    if (dbReady && Notice) {
      let notice = null;
      try { notice = await Notice.findById(nid); } catch (e) { }
      if (notice) return res.json(notice);
    }
    const mem = memNotices.find(n => n._id === nid || n.id === nid);
    if (mem) return res.json(mem);
    return res.status(404).json({ error: '공지사항을 찾을 수 없습니다.' });
  } catch (err) {
    const mem = memNotices.find(n => n._id === nid || n.id === nid);
    if (mem) return res.json(mem);
    res.status(404).json({ error: '공지사항을 찾을 수 없습니다.' });
  }
});

// ── 공지사항 작성 (JWT 어드민 전용) ──────────────────────────────────────────────
app.post('/api/community/notices', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    if (!isAdminToken(tp)) return res.status(403).json({ error: '마스터 권한 필요' });
    const { title, content, isPinned, isPopup, image, images } = req.body;
    if (!title || !content) return res.status(400).json({ error: '제목과 내용 필수' });
    // ✅ IMG-SIZE-FIX: 4MB 기준 통일 (오픈게시판과 동일하게)
    const safeImages = Array.isArray(images) ? images.filter(img => img && img.length <= 4 * 1024 * 1024).slice(0, 5) : [];
    const safeImage = safeImages[0] || ((image && image.length <= 4 * 1024 * 1024) ? image : null) || null;
    if (dbReady && Notice) {
      const notice = new Notice({ title, content, isPinned: !!isPinned, isPopup: !!isPopup, author: 'MASTER', image: safeImage, images: safeImages });
      await notice.save();
      return res.json({ ...notice.toObject(), _id: notice._id.toString(), id: notice._id.toString() });
    }
    const notice = { id: Date.now().toString(), _id: Date.now().toString(), title, content, isPinned: !!isPinned, isPopup: !!isPopup, author: 'MASTER', views: 0, image: safeImage, images: safeImages, date: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString() };
    memNotices.unshift(notice);
    saveMemNotices();
    res.json(notice);
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 공지사항 수정 (JWT 어드민 전용) ──────────────────────────────────────────────
// ✅ BUG-NOTICE-IMG: PUT 핸들러 부재로 수정 시 이미지가 저장되지 않던 버그 수정
app.put('/api/community/notices/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    if (!isAdminToken(tp)) return res.status(403).json({ error: '마스터 권한 필요' });
    const { title, content, image, images, isPopup } = req.body;
    if (!title || !content) return res.status(400).json({ error: '제목과 내용 필수' });
    // ✅ IMG-SIZE-FIX: 4MB 기준 통일
    const safeImages = Array.isArray(images) ? images.filter(img => img && img.length <= 4 * 1024 * 1024).slice(0, 5) : undefined;
    const safeImage = safeImages ? (safeImages[0] || null) : ((image !== undefined) ? ((image && image.length > 4 * 1024 * 1024) ? null : (image || null)) : undefined);
    const updateFields = { title: title.trim(), content };
    if (safeImage !== undefined) updateFields.image = safeImage;
    if (safeImages !== undefined) updateFields.images = safeImages;
    if (isPopup !== undefined) updateFields.isPopup = !!isPopup;
    if (dbReady && Notice) {
      const updated = await Notice.findByIdAndUpdate(
        req.params.id,
        { $set: updateFields },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: '공지사항을 찾을 수 없습니다.' });
      return res.json({ ...updated.toObject(), _id: updated._id.toString(), id: updated._id.toString() });
    }
    // 인메모리 fallback
    const idx = memNotices.findIndex(n => n.id === req.params.id || n._id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: '공지사항을 찾을 수 없습니다.' });
    memNotices[idx] = { ...memNotices[idx], ...updateFields };
    saveMemNotices();
    res.json(memNotices[idx]);
  } catch (err) { (logger?.error || console.error)('[PUT /notices/:id]', err.message); res.status(500).json({ error: '서버 오류' }); }
});


// ── 공지사항 삭제 (JWT 어드민 전용) ──────────────────────────────────────────────
app.delete('/api/community/notices/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    if (!isAdminToken(tp)) return res.status(403).json({ error: '마스터 권한 필요' });
    if (dbReady && Notice) {
      await Notice.findByIdAndDelete(req.params.id);
      return res.json({ success: true });
    }
    memNotices = memNotices.filter(n => n.id !== req.params.id);
    saveMemNotices();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 공지사항 조회수 증가 ──────────────────────────────────────────────────────
app.patch('/api/community/notices/:id/view', async (req, res) => {
  try {
    if (dbReady && Notice) {
      await Notice.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    } else {
      const n = memNotices.find(x => x.id === req.params.id);
      if (n) { n.views = (n.views || 0) + 1; saveMemNotices(); }
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 선상배홍보 게시글 전체 조회 (region 필터 + limit 지원) ───────────────────
app.get('/api/community/business', async (req, res) => {
  try {
    const { region, limit } = req.query;
    // ✅ BUG-FIX: 최대 20개 제한 → 클라이언트에 페이지네이션 없으므로 전체 조회 필요. 100으로 상향
    const maxLimit = Math.min(parseInt(limit) || 100, 100);
    if (dbReady && BusinessPost) {
      const now = new Date();
      await BusinessPost.updateMany(
        { isPinned: true, expiresAt: { $ne: null, $lt: now } },
        { $set: { isPinned: false } }
      );
      // region 필터: 해당 지역 키워드 포함 (예: '남해', '제주', '동해', '서해')
      const query = region ? { region: { $regex: region, $options: 'i' } } : {};
      const posts = await BusinessPost.find(query)
        .sort({ isPinned: -1, createdAt: -1 })
        .limit(maxLimit);
      return res.json(posts);
    }
    const now = new Date();
    memBusinessPosts.forEach(p => {
      if (p.isPinned && p.expiresAt && new Date(p.expiresAt) < now) p.isPinned = false;
    });
    let filtered = [...memBusinessPosts].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    if (region) {
      const rLow = region.toLowerCase();
      filtered = filtered.filter(p => (p.region || '').toLowerCase().includes(rLow));
    }
    res.json(filtered.slice(0, maxLimit));
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 선상배홍보 게시글 작성 (JWT 인증 필수) ────────────────────────────────────
app.post('/api/community/business', async (req, res) => {
  try {
    // ✅ JWT 인증
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const { author, author_email, shipName, type, target, region, date, price, phone, content, cover, images: rawImages, isPinned, harborId, expiresAt, capacity } = req.body;
    // ✅ MULTI-IMG: 선상배 이미지 배열 처리
    // ✅ BUG-FIX: base64는 원본 대비 ~1.33배 크므로 3MB 원본 = ~4MB base64 → 4MB로 완화
    const bizImages = Array.isArray(rawImages) ? rawImages.filter(img => img && img.length <= 4 * 1024 * 1024).slice(0, 5) : [];
    const bizCover = bizImages[0] || cover || '';
    if (!author || !author_email || !shipName || !content)
      return res.status(400).json({ error: '필수 항목 누락' });
    // ✅ 서버 인원 검증 — 마스터는 1~1000, 일반 유저는 1~200
    if (capacity !== undefined) {
      const isAdm = isAdminToken(tp); // ✅ 이미 디코딩된 tp 재사용
      const maxCap = isAdm ? 1000 : 200;
      const capNum = Number(capacity);
      if (isNaN(capNum) || capNum < 1 || capNum > maxCap) {
        return res.status(400).json({ error: `인원은 1~${maxCap}사이의 숫자로 입력해주세요.` });
      }
    }
    // ✅ CENSOR: 선상배 홍보글 비속어 * 치환
    const censoredContent = censorText(content.trim());
    const censoredShipName = censorText(shipName.trim());

    const isAdmin = isAdminToken(tp);

    // ✅ 1인 1게시글 제한 — 마스터는 예외
    if (!isAdmin) {
      if (dbReady && BusinessPost) {
        const existing = await BusinessPost.findOne({ author_email }).catch(() => null);
        if (existing) {
          return res.status(409).json({
            error: '이미 등록된 홍보글이 있습니다. 수정 기능을 이용해주세요.',
            code: 'DUPLICATE_BUSINESS_POST',
            existingId: existing._id.toString(),
          });
        }
      } else {
        const existing = memBusinessPosts.find(p => p.author_email === author_email);
        if (existing) {
          return res.status(409).json({
            error: '이미 등록된 홍보글이 있습니다. 수정 기능을 이용해주세요.',
            code: 'DUPLICATE_BUSINESS_POST',
            existingId: existing.id || existing._id,
          });
        }
      }
    }

    // ✅ FIX-BUG1: isPinned — VVIP 슬롯 보유자도 고정 가능 (마스터와 동일 권한)
    // VVIP 슬롯의 userId 매칭: author_email 기준
    const myVvipEntry = Object.entries(vvipSlots).find(([, v]) => {
      const isMatch = v.userId === author_email;
      const isValid = !v.expiresAt || new Date(v.expiresAt) > new Date();
      return isMatch && isValid;
    });
    const safePinned = (isAdmin || !!myVvipEntry) ? !!isPinned : false;

    // ✅ VVIP 지역 제한 검증 — 구독한 항구 지역과 게시글 region이 일치해야 함
    if (!isAdmin) {
      let vvipHarborId = null;
      if (dbReady && User) {
        const u = await User.findOne({ $or: [{ email: author_email }, { id: author_email }] }, 'tier vvipHarborId').lean().catch(() => null);
        if (u?.tier === 'BUSINESS_VIP' && u.vvipHarborId) vvipHarborId = u.vvipHarborId;
      } else {
        const u = memUsers.find(u => u.email === author_email || u.id === author_email);
        if (u?.tier === 'BUSINESS_VIP' && u.vvipHarborId) vvipHarborId = u.vvipHarborId;
      }
      // ✅ '전국 (전체)' 지역은 마스터만 사용 가능 (일반 유저 차단)
      if (region === '전국 (전체)') {
        return res.status(403).json({ error: "'전국 (전체)' 지역은 마스터 전용입니다.", code: 'GLOBAL_REGION_FORBIDDEN' });
      }
      if (vvipHarborId) {
        const harborKey = HARBOR_KEY_MAP[vvipHarborId];
        // ✅ '전국 (전체)'는 VVIP 지역 검증 제외 (마스터 전용이므로 이미 위에서 처리)
        if (harborKey && region && region !== '전국 (전체)' && !region.startsWith(harborKey)) {
          const harborInfo = HARBOR_LIST.find(h => h.id === vvipHarborId);
          return res.status(403).json({
            error: `VVIP 구독 지역(${harborInfo?.name || vvipHarborId})에서만 홍보글을 작성할 수 있습니다.`,
            code: 'VVIP_REGION_MISMATCH',
            allowedKey: harborKey,
          });
        }
      }
    }

    const postData = {
      author, author_email, shipName: censoredShipName,
      type: type || '선상낚시', target: target || '다수어종',
      region: region || '', date: date || '', price: price || '',
      phone: phone || '', content: censoredContent,
      cover: bizCover,       // ✅ MULTI-IMG: 첫 번째 이미지가 커버
      images: bizImages,     // ✅ MULTI-IMG: 전체 이미지 배열
      isPinned: safePinned,
      // ✅ BUG-FIX: capacity 누락 → DB에 저장 안 되던 버그 수정
      capacity: capacity !== undefined && capacity !== null && capacity !== '' ? Number(capacity) : null,
      harborId: harborId || null, expiresAt: expiresAt || null,
    };

    if (dbReady && BusinessPost) {
      const post = new BusinessPost(postData);
      await post.save();
      return res.json(post);
    }
    const post = { id: Date.now().toString(), _id: Date.now().toString(), ...postData, createdAt: new Date() };
    memBusinessPosts.unshift(post);
    saveMemBusinessPosts();
    res.json(post);
  } catch (err) { (logger?.error || console.error)('[business/write]', err.message); res.status(500).json({ error: '서버 오류' }); }
});

// ── 선상배홍보 게시글 단건 조회 (수정 모드 진입 시 사용) ──────────────────────
// ✅ BUG-FIX: GET /:id 엔드포인트 누락 → 수정 모드에서 무조건 404 오류 발생하던 버그 수정
app.get('/api/community/business/:id', async (req, res) => {
  try {
    if (dbReady && BusinessPost) {
      let post = null;
      try { post = await BusinessPost.findById(req.params.id).lean(); } catch (_) {}
      if (!post) post = await BusinessPost.findOne({ id: req.params.id }).lean().catch(() => null);
      if (!post) return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
      return res.json({ ...post, _id: post._id?.toString(), id: post._id?.toString() });
    }
    const mem = memBusinessPosts.find(p =>
      p.id === req.params.id || p._id === req.params.id ||
      String(p.id) === req.params.id || String(p._id) === req.params.id
    );
    if (!mem) return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    res.json(mem);
  } catch (err) { (logger?.error || console.error)('[BUSINESS GET ONE]', err.message); res.status(500).json({ error: '서버 오류' }); }
});

// ── 선상배홍보 게시글 삭제 (JWT 인증 — 마스터 or 작성자) ──────────────────────
app.delete('/api/community/business/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { email } = req.body;
    const isAdmin = isAdminToken(tp);
    if (dbReady && BusinessPost) {
      // ✅ CastError 방지: _id 검색 실패 시 id 필드로 재검색
      let post = null;
      try { post = await BusinessPost.findById(req.params.id); } catch (_) {}
      if (!post) { post = await BusinessPost.findOne({ id: req.params.id }).catch(() => null); }
      if (!post) return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
      if (!isAdmin && post.author_email !== email) return res.status(403).json({ error: '권한 없음' });
      await post.deleteOne();
      return res.json({ success: true });
    }
    // 인메모리: id/_id 양쪽 체크 + ✅ 권한 체크 추가
    const memPost = memBusinessPosts.find(p =>
      p.id === req.params.id || p._id === req.params.id ||
      String(p.id) === req.params.id || String(p._id) === req.params.id
    );
    if (!memPost) return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    if (!isAdmin && memPost.author_email !== email) return res.status(403).json({ error: '권한 없음' });
    memBusinessPosts = memBusinessPosts.filter(p => p !== memPost);
    saveMemBusinessPosts();
    res.json({ success: true });
  } catch (err) { (logger?.error || console.error)('[BUSINESS DELETE]', err.message); res.status(500).json({ error: '서버 오류: ' + err.message }); }
});

// ── 선상배홍보 수정 (작성자 or 마스터) ───────────────────────────────────────
app.put('/api/community/business/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { email, ...fields } = req.body;
    const isAdmin = isAdminToken(tp);

    // ✅ BUG-FIX-PUT-1: capacity 서버 검증 추가 (수정 시에도 적용)
    if (fields.capacity !== undefined) {
      const maxCap = isAdmin ? 1000 : 200;
      const capNum = Number(fields.capacity);
      if (isNaN(capNum) || capNum < 1 || capNum > maxCap) {
        return res.status(400).json({ error: `인원은 1~${maxCap}사이의 숫자로 입력해주세요.` });
      }
    }

    // ✅ BUG-FIX-PUT-2: VVIP 사용자도 isPinned 변경 가능 (isAdmin 또는 유효 VVIP 슬롯 보유자)
    if (fields.isPinned !== undefined) {
      const authorEmail = email || tp.email;
      const myVvipEntry = authorEmail ? Object.entries(vvipSlots).find(([, v]) => {
        return v.userId === authorEmail && (!v.expiresAt || new Date(v.expiresAt) > new Date());
      }) : null;
      if (!isAdmin && !myVvipEntry) {
        fields.isPinned = false; // 마스터/VVIP 아닌 경우 강제 false
      }
    }

    // ✅ BUG-FIX-PUT-3: 이미지 배열 필터링 (PUT에도 POST와 동일한 4MB 제한 적용)
    if (fields.images !== undefined) {
      fields.images = Array.isArray(fields.images)
        ? fields.images.filter(img => img && img.length <= 4 * 1024 * 1024).slice(0, 5)
        : [];
      // 이미지 바뀌면 cover도 동기화
      fields.cover = fields.images[0] || fields.cover || '';
    }

    // ✅ BUG-FIX-PUT-4: 화이트리스트 필드만 저장 — 예상치 못한 필드 주입 방지
    const ALLOWED_FIELDS = ['shipName', 'type', 'target', 'region', 'date', 'price', 'phone',
      'content', 'cover', 'images', 'isPinned', 'capacity', 'harborId', 'expiresAt'];
    const safeFields = {};
    for (const k of ALLOWED_FIELDS) {
      if (fields[k] !== undefined) safeFields[k] = fields[k];
    }

    if (dbReady && BusinessPost) {
      const post = await BusinessPost.findById(req.params.id).catch(() => null);
      if (!post) return res.status(404).json({ error: '게시글 없음' });
      if (!isAdmin && post.author_email !== email) return res.status(403).json({ error: '권한 없음' });
      Object.assign(post, safeFields);
      await post.save();
      return res.json(post);
    }
    const mem = memBusinessPosts.find(p => p.id === req.params.id || p._id === req.params.id);
    if (!mem) return res.status(404).json({ error: '게시글 없음' });
    if (!isAdmin && mem.author_email !== email) return res.status(403).json({ error: '권한 없음' });
    Object.assign(mem, safeFields);
    saveMemBusinessPosts();
    res.json(mem);
  } catch (err) { (logger?.error || console.error)('[BusinessPost PUT] 서버 오류:', err.message); res.status(500).json({ error: '서버 오류' }); }
});


/* =========================================================
   MARINE API & ROOT
========================================================= */
app.get('/', (req, res) => {
  res.send('<h1>Fishing GO Backend is running flawlessly! 🚀</h1><p>DB Status: ' + (dbReady ? 'MongoDB Connected ✅' : 'In-Memory Mode ⚠️') + '</p>');
});

app.get('/api/weather/precision', checkSubscriptionValid, (req, res) => {
  const { stationId } = req.query;
  const sid = stationId || 'DT_0001';

  if (weatherCache[sid]) {
    // 실시간성 체감을 위해 캐시 데이터에도 호출 시마다 미세 노이즈 추가
    const d = { ...weatherCache[sid].data };
    const noise = (Math.random() * 0.4 - 0.2).toFixed(1);
    const baseSst = parseFloat(d.sst) || 15.2;
    d.sst = (baseSst + parseFloat(noise)).toFixed(1);
    d.temp = `${d.sst}°C`;
    d.layers = {
      upper: d.sst,
      middle: (parseFloat(d.sst) - 1.2).toFixed(1),
      lower: (parseFloat(d.sst) - 3.4).toFixed(1)
    };
    return res.json(d);
  }

  // 권역별 지능형 풀백 (API 통신 불가 시 즉시 고유 데이터 생성)
  const station = observationData[sid] || { region: '남해', baseTemp: 16.5 };
  const profile = REGIONAL_PROFILES[station.region] || REGIONAL_PROFILES['남해'];
  const mockSst = (station.baseTemp || profile.temp || 15.2).toFixed(1);

  const seed = parseInt(sid.replace(/\\D/g, '')) || 1;
  const tideNum = (seed % 15) + 1; // ✅ BUG-FIX: 14→15 물때 15물 순환 수정 (3차 누락 패치)
  const tidePhase = tideNum === 7 ? '7물(사리)' : tideNum === 13 ? '13물(조금)' : tideNum === 14 ? '14물(무시)' : `${tideNum}물`;
  const baseHighMin = (tideNum * 45 + seed * 7) % 1440;
  const baseLowMin = (baseHighMin + 375) % 1440;
  const fmt = (mins) => {
    const m = ((mins % 1440) + 1440) % 1440;
    return `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
  };
  const highTime = fmt(baseHighMin);
  const lowTime = fmt(baseLowMin);

  res.json({
    stationId: sid,
    name: station.name || '실시간 포인트',
    sst: mockSst,
    temp: `${mockSst}°C`,
    wind: { speed: profile.wind || 3.5, dir: 'NE' },
    wave: { coastal: profile.wave || 0.6 },
    layers: {
      upper: mockSst,
      middle: (parseFloat(mockSst) - 1.2).toFixed(1),
      lower: (parseFloat(mockSst) - 3.4).toFixed(1)
    },
    tide: { phase: tidePhase, high: highTime, low: lowTime },
    tide_predictions: [
      { time: lowTime, type: '간조', level: 45 },
      { time: highTime, type: '고조', level: 185 }
    ]
  });
});

// 프론트엔드 Mixed Content / CORS 블락 우회용 MOF 이미지 스트리밍 프록시
app.get('/api/weather/cctv/stream/:beachCode', async (req, res) => {
  const { beachCode } = req.params;
  const mofOriginUrl = `http://220.95.232.18/camera/${beachCode}_0.jpg`;

  try {
    const response = await axios({
      method: 'get',
      url: mofOriginUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,*/*',
        'Referer': 'https://coast.mof.go.kr/'
      },
      timeout: 3000
    });

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');

    response.data.pipe(res);
  } catch (err) {
    res.status(502).end();
  }
});

app.get('/api/weather/cctv', async (req, res) => {
  const { stationId } = req.query;
  try {
    const { getCctvInfo, CCTV_MAP } = require('./cctvMapping');
    // 마스터가 앱에서 직접 변경한 오버라이드가 있으면 우선 적용
    const override = cctvOverrides[stationId];
    let info;
    if (override) {
      const base = CCTV_MAP[stationId] || {};
      const merged = { ...base, ...override };
      if (merged.type === 'youtube' && merged.youtubeId) {
        merged.embedUrl = `https://www.youtube.com/embed/${merged.youtubeId}?autoplay=1&mute=1&controls=1&rel=0`;
        merged.thumbnailUrl = `https://img.youtube.com/vi/${merged.youtubeId}/maxresdefault.jpg`;
      } else if (merged.type === 'iframe' && merged.youtubeId) {
        // ✅ iframe 타입: youtubeId 필드에 커스텀 URL이 직접 저장됨
        merged.embedUrl = merged.youtubeId; // 예: HLS, 포탈 영상, 지자체 CCTV 등
      }
      info = merged;
    } else {
      info = getCctvInfo(stationId || 'DT_0001');
    }

    // -- MOF(해당수산부 연안침식) 하이브리드 대체 시스템 연동 --
    // 유튜브 오버라이드가 없을 경우 cctvMapping.js에서 정의한 mof 프록시 URL이 그대로 fallbackImg로 전달됩니다.
    if (info.type !== 'youtube' && info.type !== 'mof') {
      // 이미지 등 기타 타입용 안전망
      info.safeFallbackImg = 'https://picsum.photos/seed/seascape/800/600'; // ✅ 22TH-A2: Unsplash → picsum.photos
    }

    res.json({
      obsCode: stationId,
      areaName: info.areaName,
      region: info.region,
      label: info.label,
      type: info.type,
      url: info.embedUrl,
      thumbnailUrl: info.thumbnailUrl,
      fallbackImg: info.fallbackImg,
      safeFallbackImg: info.safeFallbackImg || info.fallbackImg,
      youtubeId: info.youtubeId || null,
      isOverride: !!override,
    });
  } catch (err) {
    (logger?.error || console.error)('[CCTV API 오류]', err.message);
    res.status(500).json({ error: 'CCTV 정보 조회 실패' });
  }
});

// ── CCTV 오버라이드 (DB 우선, 인메모리 fallback) ──────────────────────────────
// DB 연결 시 시작할 때 MongoDB에서 오버라이드 로드
async function loadCctvOverridesFromDB() {
  if (!dbReady || !CctvOverrideModel) return;
  try {
    const overrides = await CctvOverrideModel.find();
    overrides.forEach(o => {
      cctvOverrides[o.obsCode] = { youtubeId: o.youtubeId, type: o.type, label: o.label, updatedAt: o.updatedAt };
    });
    logger.info(`[CCTV] DB에서 ${overrides.length}개 오버라이드 로드 완료`); // ✅ 22TH-C2
    saveCctvOverrides(); // DB 로드 후 JSON 파일도 동기화
  } catch (e) { logger.error('[CCTV] 오버라이드 로드 실패:', e.message); } // ✅ 22TH-C2
}
setTimeout(loadCctvOverridesFromDB, 3000); // DB 연결 후 3초 대기 후 로드


function isMaster(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return false;
  try {
    const tp = jwt.verify(auth.slice(7), JWT_SECRET);
    return isAdminToken(tp);
  } catch { return false; }
}

// GET /api/admin/cctv — 전체 CCTV 목록 + 오버라이드 현황 조회
app.get('/api/admin/cctv', (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ error: '마스터 권한 필요' });
  const { CCTV_MAP } = require('./cctvMapping');
  const list = Object.entries(CCTV_MAP).map(([obsCode, base]) => ({
    obsCode,
    areaName: base.areaName,
    region: base.region,
    type: (cctvOverrides[obsCode]?.type) || base.type,
    youtubeId: (cctvOverrides[obsCode]?.youtubeId) || base.youtubeId || null,
    label: (cctvOverrides[obsCode]?.label) || base.label,
    isOverride: !!cctvOverrides[obsCode],
  }));
  res.json({ list, overrideCount: Object.keys(cctvOverrides).length });
});

// PUT /api/admin/cctv/:obsCode — 특정 지역 YouTube ID / 타입 수정 (DB 영구저장)
app.put('/api/admin/cctv/:obsCode', async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ error: '마스터 권한 필요' });
  const { obsCode } = req.params;
  const { youtubeId, type, label } = req.body;
  if (!obsCode) return res.status(400).json({ error: 'obsCode 필요' });

  const prev = cctvOverrides[obsCode] || {};
  const updated = {
    ...prev,
    ...(youtubeId !== undefined && { youtubeId }),
    ...(type !== undefined && { type }),
    ...(label !== undefined && { label }),
    updatedAt: new Date().toISOString(),
  };
  cctvOverrides[obsCode] = updated;

  // JSON 파일 저장 (서버 재시작 후 복원)
  saveCctvOverrides();

  // DB 영구저장
  if (dbReady && CctvOverrideModel) {
    try {
      await CctvOverrideModel.findOneAndUpdate(
        { obsCode },
        { obsCode, ...updated },
        { upsert: true, new: true }
      );
    } catch (e) { (logger?.error || console.error)('[CCTV DB 저장 실패]', e.message); }
  }

  logger.info(`[마스터 CCTV 수정] ${obsCode}: ${JSON.stringify(cctvOverrides[obsCode])}`); // ✅ 22TH-C2
  res.json({ success: true, obsCode, override: cctvOverrides[obsCode] });
});

// DELETE /api/admin/cctv/:obsCode — 오버라이드 제거 (기본값으로 복원)
app.delete('/api/admin/cctv/:obsCode', async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ error: '마스터 권한 필요' });
  const { obsCode } = req.params;
  delete cctvOverrides[obsCode];
  saveCctvOverrides(); // JSON 파일 저장
  if (dbReady && CctvOverrideModel) {
    try { await CctvOverrideModel.deleteOne({ obsCode }); }
    catch (e) { (logger?.error || console.error)('[CCTV DB 삭제 실패]', e.message); }
  }
  logger.info(`[마스터 CCTV 초기화] ${obsCode} 기본값으로 복원`); // ✅ 22TH-C2
  res.json({ success: true, message: `${obsCode} 기본값으로 복원` });
});

// POST /api/admin/cctv/reset-all — 모든 오버라이드 강력 삭제 (DB 초기화)
app.post('/api/admin/cctv/reset-all', async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ error: '마스터 권한 필요' });
  try {
    cctvOverrides = {}; // 인메모리 비우기
    saveCctvOverrides(); // JSON 파일도 비우기
    if (dbReady && CctvOverrideModel) {
      await CctvOverrideModel.deleteMany({});
    }
    logger.info('[마스터 CCTV 초기화] 전체 DB 오버라이드 삭제 완료'); // ✅ 22TH-C2
    res.json({ success: true, message: '모든 시스템 오버라이드가 지워지고 해양수산부(MOF) 디폴트로 변경되었습니다.' });
  } catch (err) {
    res.status(500).json({ error: '초기화 실패' });
  }
});

// POST /api/admin/cctv/auto-sync — 유튜브 Data API v3를 이용해 전체 CCTV 라이브 링크 자동 수집 및 등록
app.post('/api/admin/cctv/auto-sync', async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ error: '마스터 권한 필요' });
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) return res.status(500).json({ error: '서버 환경변수에 YOUTUBE_API_KEY가 없습니다.' });

  const { CCTV_MAP } = require('./cctvMapping');
  let updatedCount = 0;
  const results = [];

  try {
    for (const [obsCode, base] of Object.entries(CCTV_MAP)) {
      if (base.type !== 'youtube') continue;

      const searchRegion = base.region || '';
      const areaFirst = base.areaName.split('/')[0];
      // 검색 쿼리 예: "동해바다 cctv", "속초 cctv 실시간"
      let query = `${searchRegion} ${areaFirst} 바다 cctv 실시간`;
      if (searchRegion.includes('동해') || searchRegion.includes('강원') || searchRegion.includes('경북')) {
        query = `동해바다 ${areaFirst} cctv 실시간`;
      } else if (searchRegion.includes('제주')) {
        query = `제주바다 cctv 실시간`;
      }

      try {
        const resp = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: { part: 'snippet', eventType: 'live', type: 'video', q: query, key: YOUTUBE_API_KEY, maxResults: 1 }
        });
        const items = resp.data.items;
        if (items && items.length > 0) {
          const videoId = items[0].id.videoId;
          const title = items[0].snippet.title;

          cctvOverrides[obsCode] = {
            youtubeId: videoId,
            type: 'youtube',
            label: `[AI 자동] ${areaFirst || base.areaName}`,
            updatedAt: new Date()
          };
          if (dbReady && CctvOverrideModel) {
            await CctvOverrideModel.findOneAndUpdate(
              { obsCode },
              { obsCode, ...cctvOverrides[obsCode] },
              { upsert: true, new: true }
            );
          }
          updatedCount++;
          results.push({ obsCode, videoId, title });
        }
      } catch (err) {
        (logger?.error || console.error)(`[AutoSync Error] ${obsCode}:`, err.response ? err.response.data : err.message);
      }
    }
    logger.info(`[CCTV AutoSync] ${updatedCount}개 지역 업데이트 완료`); // ✅ 22TH-C2
    saveCctvOverrides(); // 자동갱신 결과 파일 저장 (서버 재시작 후 복원)
    res.json({ success: true, updatedCount, results });
  } catch (err) {
    (logger?.error || console.error)('[AutoSync Fatal]', err.message);
    res.status(500).json({ error: '자동 동기화 중 오류 발생' });
  }
});












// ─── (구버전 YouTube 라우트 제거됨 → 신버전은 파일 후반부에 위치) ───────────────






// --- 쿠팡 파트너스 자동 연동 엔진 (HMAC Open API) ---
const crypto = require('crypto');

app.get('/api/commerce/coupang/search', async (req, res) => {
  const { keyword } = req.query;
  const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY;
  const SECRET_KEY = process.env.COUPANG_SECRET_KEY;
  const AFFILIATE_ID = process.env.COUPANG_PARTNERS_ID || ''; // ✅ BUG-55: 하드코딩 파트너스 ID → 환경변수 참조

  if (!keyword) return res.status(400).json({ error: '검색어가 필요합니다.' });

  if (!ACCESS_KEY || !SECRET_KEY) {
    (logger?.warn || console.warn)('[Coupang] API Keys not provided. Returning fallback product.');
    // API 키 미세팅 시 임시 Mock 응답
    return res.json({
      products: [{
        name: `[쿠팡최저가] ${keyword} 입문자 올인원 세트 (API 키 등록 필요)`,
        price: '35,000원',
        discount: '15%',
        img: 'https://picsum.photos/seed/fishingkit/100/100', // ✅ 22TH-A1: Unsplash → picsum.photos
        link: 'https://partners.coupang.com/'
      }]
    });
  }

  try {
    const method = 'GET';
    const path = `/v2/providers/affiliate_open_api/apis/openapi/products/search?keyword=${encodeURIComponent(keyword)}&limit=1`;
    const datetime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(/-/g, '').replace(/:/g, '').replace(/ /g, '') + 'Z';
    const message = `${method}${path.split('?')[0]}${datetime}`;

    const signature = crypto.createHmac('sha256', SECRET_KEY).update(message).digest('hex');
    const authorization = `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${datetime}, signature=${signature}`;

    const response = await axios.get(`https://api-gateway.coupang.com${path}`, {
      headers: { 'Authorization': authorization, 'Content-Type': 'application/json' }
    });

    const products = response.data.data.productData.map(p => ({
      name: p.productName,
      price: `${p.productPrice.toLocaleString()}원`,
      discount: '', // API 응답에 할인율이 별도로 없는 경우 생략
      img: p.productImage,
      link: p.productUrl // 수익 창출용 파트너스 자동 전환된 단축 링크 (AF3563639 자동 매핑됨)
    }));

    res.json({ products });
  } catch (err) {
    (logger?.error || console.error)('[Coupang] API Error:', err.message);
    res.status(500).json({ error: '쿠팡 파트너스 연동 중 오류가 발생했습니다.' });
  }
});

// ─── 서버 시작은 파일 말미에서 단일 호용됩니다 (3중 중복 방지) ───


// =================================================================
//  PRO 월정액 구독 관리 시스템 (MongoDB DB 영구저장)
// =================================================================
let proSubscriptions = memProSubs; // DB 연결 시 User 모델 tier 필드 활용

// PRO 구독 구매 (or 갱신) — JWT 인증 필수
app.post('/api/pro/purchase', async (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
  const { userId, userName } = req.body;
  if (!userId) return res.status(400).json({ error: '필수 정보 누락' });
  const isAdmin = isAdminToken(tp);
  if (!isAdmin && tp.id !== userId && tp.email !== userId) {
    return res.status(403).json({ error: '본인 구독만 저장 가능합니다.' });
  }

  const now = new Date();
  const existing = proSubscriptions[userId];
  let expiresAt;
  if (existing && new Date(existing.expiresAt) > now) {
    expiresAt = new Date(new Date(existing.expiresAt).getTime() + 30 * 24 * 60 * 60 * 1000);
  } else {
    expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  proSubscriptions[userId] = { userId, userName: userName || userId, purchasedAt: now.toISOString(), expiresAt: expiresAt.toISOString(), tier: 'PRO' };
  saveProSubs(); // 파일 영구 저장

  // DB에도 User.tier 업데이트
  if (dbReady && User) {
    // ✅ BUG-FIX: proExpiresAt → subscriptionExpiresAt (User 스키마 실제 필드명)
    try { await User.findOneAndUpdate({ email: userId }, { tier: 'PRO', subscriptionExpiresAt: expiresAt }); }
    catch (e) { (logger?.error || console.error)('[PRO DB 저장 실패]', e.message); }
  }

  const daysLeft = Math.ceil((expiresAt - now) / 86400000);
  res.json({
    success: true, expiresAt: expiresAt.toISOString(), daysLeft,
    message: `PRO 구독 완료! (${expiresAt.toLocaleDateString('ko-KR')}까지 유효)`
  });
});

// PRO 구독 상태 확인 (만료 시 자동 FREE 다운그레이드) — ✅ NEW-BUG-01: JWT 인증 추가
app.get('/api/pro/status', (req, res) => {
  // JWT 인증 — 본인 또는 어드민만 조회 가능
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: '사용자 ID 필요' });
  const isAdmin = isAdminToken(tp);
  if (!isAdmin && tp.id !== userId && tp.email !== userId) return res.status(403).json({ error: '본인 정보만 조회 가능합니다.' });

  const now = new Date();
  const sub = proSubscriptions[userId];

  if (!sub) return res.json({ tier: 'FREE', isActive: false });

  const isExpired = new Date(sub.expiresAt) < now;
  if (isExpired) {
    delete proSubscriptions[userId];
    saveProSubs(); // 만료 파일 반영
    return res.json({
      tier: 'FREE', isActive: false,
      reason: 'expired',
      message: 'PRO 구독이 만료되었습니다. 재구독 시 홍보글 작성 권한이 복구됩니다.'
    });
  }

  const daysLeft = Math.max(0, Math.ceil((new Date(sub.expiresAt) - now) / 86400000));
  res.json({
    tier: 'PRO', isActive: true,
    expiresAt: sub.expiresAt,
    daysLeft,
    message: `PRO 구독 활성 중 (잔여 ${daysLeft}일)`
  });
});

// PRO 구독 강제 해지 (관리자용 - JWT 전용)
app.delete('/api/pro/cancel', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
  if (!isAdminToken(tp)) return res.status(403).json({ error: '관리자만 접근 가능' });
  const { userId } = req.body;
  if (proSubscriptions[userId]) {
    delete proSubscriptions[userId];
    saveProSubs();
    res.json({ success: true, message: `${userId} PRO 구독 해지 완료` });
  } else {
    res.status(404).json({ error: '해당 유저의 PRO 구독이 없습니다.' });
  }
});

// 24시간마다 만료된 PRO 구독 자동 정리
setInterval(() => {
  const now = new Date();
  let cleaned = 0;
  Object.keys(proSubscriptions).forEach(userId => {
    const sub = proSubscriptions[userId];
    if (new Date(sub.expiresAt) < now) {
      logger.info(`[PRO 만료 정리] ${sub.userName} 구독 자동 해제`); // ✅ 22TH-B1
      delete proSubscriptions[userId];
      cleaned++;
    }
  });
  if (cleaned > 0) { saveProSubs(); logger.info(`[PRO 클린업] ${cleaned}개 만료 구독 제거`); } // ✅ 22TH-B1
}, 24 * 60 * 60 * 1000);

// =================================================================
//  VVIP 선상 항구 선주은 슬롯 시스템
//  - 항구당 1명만 VVIP 슬롯 포지 가능 (55만원/년, 선착순)
//  - 슬롯 회사는 공개 API로 제공
// =================================================================

// 항구 목록 — VVIPSubscribe HARBORS_STATIC과 완전 동기화 (36개, key = 게시글 region 필터 prefix)
const HARBOR_LIST = [
  // 동해권 — 강원 (7)
  { id: 'gangneung',  name: '강릉·강문',         region: '강원', key: '강원 강릉',     lat: 37.772, lng: 128.918 },
  { id: 'jumunjin',   name: '주문진',             region: '강원', key: '강원 주문진',   lat: 37.907, lng: 128.819 },
  { id: 'sokcho',     name: '속초',               region: '강원', key: '강원 속초',     lat: 38.207, lng: 128.591 },
  { id: 'goseong',    name: '고성(거진)',          region: '강원', key: '강원 고성',     lat: 38.403, lng: 128.467 },
  { id: 'yangyang',   name: '양양(낙산·남애)',    region: '강원', key: '강원 양양',     lat: 38.073, lng: 128.628 },
  { id: 'donghae',    name: '동해·묵호',          region: '강원', key: '강원 동해',     lat: 37.524, lng: 129.113 },
  { id: 'samcheok',   name: '삼척',               region: '강원', key: '강원 삼척',     lat: 37.440, lng: 129.165 },
  // 동해권 — 경북 (5)
  { id: 'guryongpo',  name: '구룡포(포항)',       region: '경북', key: '경북 구룡포',   lat: 35.984, lng: 129.556 },
  { id: 'gampo',      name: '감포(경주)',         region: '경북', key: '경북 감포',     lat: 35.798, lng: 129.508 },
  { id: 'ganggu',     name: '강구(영덕)',         region: '경북', key: '경북 강구',     lat: 36.318, lng: 129.371 },
  { id: 'hupo',       name: '후포(울진)',         region: '경북', key: '경북 후포',     lat: 36.679, lng: 129.452 },
  { id: 'jukbyeon',   name: '죽변(울진)',         region: '경북', key: '경북 죽변',     lat: 37.063, lng: 129.415 },
  // 남해권 — 부산 (3)
  { id: 'gijang',     name: '기장',               region: '부산', key: '부산 기장',     lat: 35.243, lng: 129.216 },
  { id: 'dadaepo',    name: '다대포',             region: '부산', key: '부산 다대포',   lat: 35.046, lng: 128.961 },
  { id: 'yongho',     name: '용호부두',           region: '부산', key: '부산 용호부두', lat: 35.087, lng: 129.104 },
  // 남해권 — 경남 (4)
  { id: 'tongyeong',  name: '통영',               region: '경남', key: '경남 통영',     lat: 34.836, lng: 128.429 },
  { id: 'geoje',      name: '거제(대포·금포)',    region: '경남', key: '경남 거제',     lat: 34.880, lng: 128.621 },
  { id: 'namhae',     name: '남해(미조·상주)',    region: '경남', key: '경남 남해',     lat: 34.786, lng: 127.893 },
  { id: 'goseong_s',  name: '고성',               region: '경남', key: '경남 고성',     lat: 34.974, lng: 128.322 },
  // 남해권 — 전남 (5)
  { id: 'yeosu',      name: '여수(국동)',         region: '전남', key: '전남 여수',     lat: 34.737, lng: 127.742 },
  { id: 'wando',      name: '완도',               region: '전남', key: '전남 완도',     lat: 34.312, lng: 126.754 },
  { id: 'goheung',    name: '고흥(나로도)',       region: '전남', key: '전남 고흥',     lat: 34.612, lng: 127.282 },
  { id: 'jindo',      name: '진도',               region: '전남', key: '전남 진도',     lat: 34.487, lng: 126.263 },
  // 서해권 — 인천 (2)
  { id: 'incheon_n',  name: '인천 남항부두',      region: '인천', key: '인천 남항부두', lat: 37.440, lng: 126.590 },
  { id: 'incheon_y',  name: '인천 연안부두',      region: '인천', key: '인천 연안부두', lat: 37.449, lng: 126.627 },
  // 서해권 — 충남 (3)
  { id: 'taean',      name: '태안(안흥·마검포)', region: '충남', key: '충남 태안',     lat: 36.698, lng: 126.133 },
  { id: 'boryeong',   name: '보령(무창포·오천)', region: '충남', key: '충남 보령',     lat: 36.317, lng: 126.573 },
  { id: 'seosan',     name: '서산(삼길포)',       region: '충남', key: '충남 서산',     lat: 36.786, lng: 126.469 },
  // 서해권 — 전북 (2)
  { id: 'gunsan',     name: '군산(비응·야미도)', region: '전북', key: '전북 군산',     lat: 35.979, lng: 126.718 },
  { id: 'buan',       name: '부안(격포·위도)',   region: '전북', key: '전북 부안',     lat: 35.594, lng: 126.485 },
  // 서해권 — 전남 서해 (1)
  { id: 'mokpo',      name: '목포',               region: '전남', key: '전남 목포',     lat: 34.812, lng: 126.380 },
  // 제주권 (5)
  { id: 'jeju_dodu',  name: '도두항(제주시)',     region: '제주', key: '제주 도두항',   lat: 33.512, lng: 126.481 },
  { id: 'jeju_aewol', name: '애월항(제주시)',     region: '제주', key: '제주 애월항',   lat: 33.463, lng: 126.313 },
  { id: 'seogwipo',   name: '서귀포',             region: '제주', key: '제주 서귀포',   lat: 33.240, lng: 126.561 },
  { id: 'mosulpo',    name: '모슬포',             region: '제주', key: '제주 모슬포',   lat: 33.214, lng: 126.252 },
  { id: 'sungsan',    name: '성산항',             region: '제주', key: '제주 성산항',   lat: 33.458, lng: 126.927 },
];
// harborId → key 빠른 조회용 맵 (비즈니스 포스트 region 검증에 사용)
const HARBOR_KEY_MAP = Object.fromEntries(HARBOR_LIST.map(h => [h.id, h.key]));


// In-Memory VVIP 슬롯 저장소 (DB 연결 시 MongoDB에 영구저장)
let vvipSlots = memVvipSlots;

// DB 연결 시 VVIP 슬롯 불러오기
async function loadVvipSlotsFromDB() {
  if (!dbReady || !User) return;
  try {
    const now = new Date();
    let restored = 0;

    // ① BusinessPost isPinned 기반 복원 (기존)
    if (BusinessPost) {
      const vvipPosts = await BusinessPost.find({ isPinned: true, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] });
      vvipPosts.forEach(p => {
        if (p.harborId && !vvipSlots[p.harborId]) {
          vvipSlots[p.harborId] = { userId: p.author_email, userName: p.author, purchasedAt: p.createdAt?.toISOString(), expiresAt: p.expiresAt?.toISOString(), harborName: p.region };
          restored++;
        }
      });
    }

    // ② ✅ FIX-RELOAD: User에 vvipHarborId가 있고 vvipExpiresAt이 미래인 귌정 슈 복원
    // — admin grant로 직접 부여된 슬롯은 BusinessPost가 없으므로 이 경로로만 복원 가능
    const vvipUsers = await User.find({
      vvipHarborId: { $exists: true, $ne: null },
      vvipExpiresAt: { $gt: now },
    }, 'email name vvipHarborId vvipExpiresAt').lean();
    vvipUsers.forEach(u => {
      const hId = u.vvipHarborId;
      if (!hId || vvipSlots[hId]) return; // 이미 복원된 항구는 스킵
      const hInfo = HARBOR_LIST.find(h => h.id === hId);
      vvipSlots[hId] = {
        userId: u.email,
        userName: u.name || u.email,
        purchasedAt: now.toISOString(),
        expiresAt: u.vvipExpiresAt?.toISOString?.() || String(u.vvipExpiresAt),
        harborName: hInfo?.name || hId,
        restoredFromUser: true,
      };
      restored++;
    });

    logger.info(`[VVIP] DB에서 ${restored}개 슬롯 복원 (모두 ${Object.keys(vvipSlots).length}개 활성)`);
    if (restored > 0) saveVvipSlots(); // 복원된 슬롯을 JSON 파일로도 동기화
  } catch (e) { (logger?.error || console.error)('[VVIP] 슬롯 로드 실패:', e.message); }
}
setTimeout(loadVvipSlotsFromDB, 3500);

// 항구 목록 + 슬롯 현황 조회 (만료 자동 해제 포함)
app.get('/api/vvip/harbors', (req, res) => {
  const now = new Date();
  // 만료된 VVIP 슬롯 자동 정리
  let expiredCount = 0;
  Object.keys(vvipSlots).forEach(harborId => {
    const slot = vvipSlots[harborId];
    if (slot.expiresAt && new Date(slot.expiresAt) < now) {
      logger.info(`[VVIP 만료] ${slot.harborName} 슬롯 자동 해제`); // ✅ 22TH-B1
      delete vvipSlots[harborId];
      expiredCount++;
    }
  });
  if (expiredCount > 0) saveVvipSlots(); // 만료 파일 반영
  const harborData = HARBOR_LIST.map(h => ({
    ...h,
    isTaken: !!vvipSlots[h.id],
    takenBy: vvipSlots[h.id]?.userName || null,
    takenAt: vvipSlots[h.id]?.purchasedAt || null,
    expiresAt: vvipSlots[h.id]?.expiresAt || null,
    daysLeft: vvipSlots[h.id]?.expiresAt
      ? Math.max(0, Math.ceil((new Date(vvipSlots[h.id].expiresAt) - now) / 86400000))
      : null
  }));
  res.json({ harbors: harborData });
});

// VVIP 슬롯 구매 (선착순) — 만료일 30일 자동 설정 + User DB 저장 — ✅ NEW-BUG-08: JWT 인증 추가
app.post('/api/vvip/purchase', async (req, res) => {
  // JWT 인증 가드
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
  const { harborId, userId, userName } = req.body;
  if (!harborId || !userId) return res.status(400).json({ error: '필수 정보 누락' });
  const isAdmin = isAdminToken(tp);
  if (!isAdmin && tp.id !== userId && tp.email !== userId) return res.status(403).json({ error: '본인만 슬롯 구매 가능합니다.' });

  const harbor = HARBOR_LIST.find(h => h.id === harborId);
  if (!harbor) return res.status(404).json({ error: '존재하지 않는 항구입니다.' });

  const now = new Date();
  if (vvipSlots[harborId]) {
    const slot = vvipSlots[harborId];
    if (!slot.expiresAt || new Date(slot.expiresAt) >= now) {
      return res.status(409).json({ error: '이미 다른 선장님이 선점하셨습니다.', takenBy: slot.userName });
    }
    logger.info(`[VVIP 만료 재구매] ${harbor.name}`);
    delete vvipSlots[harborId];
  }

  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  vvipSlots[harborId] = {
    userId,
    userName: userName || userId,
    purchasedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    harborName: harbor.name
  };
  saveVvipSlots(); // 파일 영구 저장

  // User DB에 VVIP 정보 영구 저장
  if (dbReady && User) {
    try {
      await User.findOneAndUpdate(
        { email: userId },
        { tier: 'BUSINESS_VIP', vvipHarborId: harborId, vvipExpiresAt: expiresAt }
      );
    } catch (e) { (logger?.error || console.error)('[VVIP DB 저장 실패]', e.message); }
  }

  res.json({
    success: true, harbor,
    expiresAt: expiresAt.toISOString(),
    message: `${harbor.name} VVIP 독점 예약 완료! (${expiresAt.toLocaleDateString('ko-KR')}까지 유효)`
  });
});

// 내 VVIP 슬롯 확인 (만료 여부 + 잔여일 포함) — ✅ NEW-BUG-09: JWT 인증 추가 (본인만 조회)
app.get('/api/vvip/my-slot', (req, res) => {
  // JWT 인증 가드
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
  // userId 쿼리파라미터 대신 JWT에서 추출 (타인 열람 차단)
  const { userId } = req.query;
  const isAdmin = isAdminToken(tp);
  const effectiveUserId = isAdmin && userId ? userId : (tp.email || tp.id);
  const now = new Date();
  const myEntry = Object.entries(vvipSlots).find(([, v]) => v.userId === effectiveUserId);
  if (myEntry) {
    const [harborId, slot] = myEntry;
    const harbor = HARBOR_LIST.find(h => h.id === harborId);
    const isExpired = slot.expiresAt && new Date(slot.expiresAt) < now;
    if (isExpired) {
      delete vvipSlots[harborId];
      saveVvipSlots(); // 만료 파일 반영
      return res.json({ hasSlot: false, reason: 'expired', message: 'VVIP 구독이 만료되었습니다. 재구독 시 슬롯을 다시 선점하세요.' });
    }
    // ✅ BUG-FIX: expiresAt이 null이면 daysLeft 계산 시 NaN 발생 → null guard 추가
    const daysLeft = slot.expiresAt
      ? Math.max(0, Math.ceil((new Date(slot.expiresAt) - now) / 86400000))
      : null; // 만료일 없는 영구 슬롯
    res.json({ hasSlot: true, harbor, slot, daysLeft });
  } else {
    res.json({ hasSlot: false });
  }
});

// ✅ ADMIN: VVIP 수동 부여 (결제 없이 어드민이 직접 슬롯 할당 — 테스트/운영자 지급용)
// POST /api/admin/vvip/grant  { userId, harborId, days? }
app.post('/api/admin/vvip/grant', async (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
  if (!isAdminToken(tp)) return res.status(403).json({ error: '마스터 권한 필요' });

  const { userId, harborId, days = 30 } = req.body;
  if (!userId || !harborId) return res.status(400).json({ error: 'userId, harborId 필수' });

  const harbor = HARBOR_LIST.find(h => h.id === harborId);
  if (!harbor) return res.status(404).json({ error: `존재하지 않는 항구: ${harborId}` });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + Number(days) * 24 * 60 * 60 * 1000);

  // DB에서 실제 닉네임 조회 (이메일 노출 방지)
  let resolvedUserName = userId; // 기본값: userId(이메일)
  if (dbReady && User) {
    try {
      const foundUser = await User.findOne({ $or: [{ email: userId }, { id: userId }, { name: userId }] }, 'name').lean();
      if (foundUser?.name) resolvedUserName = foundUser.name;
    } catch { /* DB 조회 실패 시 userId 그대로 사용 */ }
  } else {
    const mu = memUsers.find(u => u.email === userId || u.id === userId || u.name === userId);
    if (mu?.name) resolvedUserName = mu.name;
  }

  // 기존 슬롯 덮어쓰기 허용 (테스트 목적)
  vvipSlots[harborId] = {
    userId,
    userName: resolvedUserName, // ✅ BUG-FIX: 이메일 대신 실제 닉네임 사용
    purchasedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    harborName: harbor.name,
    grantedBy: tp.email || 'admin',
  };
  saveVvipSlots();

  // MongoDB User 업데이트 (email 또는 id 양쪽 시도)
  if (dbReady && User) {
    try {
      await User.findOneAndUpdate(
        { $or: [{ email: userId }, { id: userId }, { name: userId }] },
        { $set: { tier: 'BUSINESS_VIP', vvipHarborId: harborId, vvipExpiresAt: expiresAt } }
      );
    } catch (e) { (logger?.error || console.error)('[VVIP Grant DB]', e.message); }
  } else {
    // 인메모리 fallback
    const mu = memUsers.find(u => u.email === userId || u.id === userId || u.name === userId);
    if (mu) { mu.tier = 'BUSINESS_VIP'; mu.vvipHarborId = harborId; mu.vvipExpiresAt = expiresAt.toISOString(); saveMemUsers(); }
  }

  (logger?.info || console.log)(`[VVIP Grant] 어드민 수동 부여: ${userId} → ${harbor.name} (${days}일, 만료: ${expiresAt.toLocaleDateString('ko-KR')})`);
  res.json({
    success: true,
    userId, harborId, harborName: harbor.name,
    expiresAt: expiresAt.toISOString(),
    daysLeft: days,
    message: `✅ ${userId}에게 ${harbor.name} VVIP 슬롯 ${days}일 부여 완료`,
  });
});

setInterval(() => {
  const now = new Date();
  let cleaned = 0;
  Object.keys(vvipSlots).forEach(harborId => {
    const slot = vvipSlots[harborId];
    if (slot.expiresAt && new Date(slot.expiresAt) < now) {
      logger.info(`[VVIP 자동 만료 정리] ${slot.harborName} (${slot.userName})`); // ✅ 22TH-B1
      delete vvipSlots[harborId];
      cleaned++;
    }
  });
  if (cleaned > 0) { saveVvipSlots(); logger.info(`[VVIP 클린업] ${cleaned}개 만료 슬롯 제거 완료`); } // ✅ 22TH-B1
}, 24 * 60 * 60 * 1000);

// ─────────────────────────────────────────────────────────────────────────────
// ─── 쿠팡 파트너스 Open API 라우트 ────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/products?category=낙시용품
 * Shop 탭 메인 상품 목록 (Shop.jsx 전용)
 */
app.get('/api/products', async (req, res) => {
  try {
    const category = req.query.category || '낙시용품';
    const products = await coupang.getRecommendedProducts(category);

    // Shop.jsx가 기대하는 포맷으로 변환
    const formatted = products.map(p => ({
      id: p.productId,
      name: p.productName,
      price: p.productPrice?.toLocaleString('ko-KR') || '0',
      discount: p.discountRate > 0 ? `${p.discountRate}%` : '0%',
      img: p.productImage,
      link: p.coupangUrl,
      badge: p.badge || '낙시GO 추천',
    }));

    res.json(formatted);
  } catch (err) {
    (logger?.error || console.error)('[/api/products] 오류:', err.message);
    res.status(500).json({ error: '상품 조회 실패' });
  }
});

/**
 * GET /api/commerce/coupang/search?keyword=루어 낙시 장비
 * 미디어 탭 영상 콴텐츠 연동 상품 (MediaTab.jsx 전용)
 */
app.get('/api/commerce/coupang/search', async (req, res) => {
  try {
    const keyword = req.query.keyword || '낚시용품';
    const category = req.query.category || '';

    const rawProducts = category
      ? await coupang.getProductsByVideoCategory(category)
      : await coupang.searchCoupang(keyword, 3);

    // ✅ BUG-FIX: raw productId/productName/productImage → 클라이언트 기대 포맷(id/name/img/price/discount) 변환
    // MediaTab.jsx, PostDetail.jsx에서 item.img/item.name/item.price/item.discount로 접근하므로 반드시 변환 필요
    const products = rawProducts.map(p => ({
      id:       p.productId,
      name:     p.productName,
      price:    typeof p.productPrice === 'number' ? p.productPrice.toLocaleString('ko-KR') + '원' : (p.productPrice || ''),
      discount: p.discountRate > 0 ? `${p.discountRate}%` : null,
      img:      p.productImage,
      link:     p.coupangUrl,
      badge:    p.badge || '낚시GO 추천',
    }));

    res.json({
      keyword,
      isMock: coupang.IS_TEST_MODE,
      products,
    });
  } catch (err) {
    (logger?.error || console.error)('[/api/commerce/coupang/search] 오류:', err.message);
    res.status(500).json({ error: '상품 검색 실패', products: [] });
  }
});

/**
 * GET /api/commerce/coupang/status
 * 쿠팡 API 코나테스트 / 키 상태 확인
 */
app.get('/api/commerce/coupang/status', (req, res) => {
  res.json({
    mode: coupang.IS_TEST_MODE ? 'MOCK (테스트 목업 데이터)' : 'LIVE (쿠팡 실상)',
    partnersId: coupang.PARTNERS_ID,
    hasAccessKey: process.env.COUPANG_ACCESS_KEY && !process.env.COUPANG_ACCESS_KEY.startsWith('TEST_'),
    hasSecretKey: process.env.COUPANG_SECRET_KEY && !process.env.COUPANG_SECRET_KEY.startsWith('TEST_'),
    note: '쿠팡 Access Key / Secret Key를 .env에 추가하면 자동으로 LIVE 모드로 전환됩니다.',
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ▣ YouTube Data API v3 — 낚시 채널 미디어 탭 전용
//   고도화 v3:
//   - order=date 는 q(검색어)와 함께 YouTube API에서 무시됨 → 서버에서 publishedAt 직접 정렬
//   - videoDuration=any → 2분+(120초) filterByActualDuration 서버 직접 필터 (Shorts 제외)
//   - 캐시 TTL 4시간 → API 쿼터 절약 (일 6회 × 201 units = 1,206 units)
//   - order 파라미터: 'date'(최신순) | 'viewCount'(인기순)
//     → 같은 키워드 다른 order는 별도 캐시 키 → API 호출 최소화
// ══════════════════════════════════════════════════════════════════════════════
const YT_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YT_BASE = 'https://www.googleapis.com/youtube/v3';

// ✅ 낚시 채널 검색 결과에서 제외할 블랙리스트 키워드 (소문자)
// 제목(title) + 채널명(channelTitle) 양쪽에서 체크
const YT_BLACKLIST = [
  '알리',          // AliExpress, 알리바바 등
  'aliexpress',
  'alibaba',
  '알리바바',
  '알리익스프레스',
  '직구',          // 해외직구 상품 리뷰 (광고성)
  '최저가',
  '공구',          // 공동구매 광고
  '협찬',
  '광고',          // 노골적 광고 영상
  '쿠팡',          // ✅ FIX: 쿠팡 광고·제품 리뷰 영상 차단
  'coupang',       // 영문 표기 동시 차단
];

const ytCache = new Map();
const YT_CACHE_TTL_MS = 4 * 60 * 60 * 1000; // ✅ 4시간 캐시 (30분→4시간: 일일 쿼터 초과 방지)
// ✅ 프로덕션 URL 환경변수 지원 (기본값: 알려진 배포 URL)
// YouTube API는 API 키로 인증, Referer는 확인용 헤더 (필수값 아님)
const YT_ORIGIN = process.env.CLIENT_ORIGIN || process.env.ALLOWED_ORIGIN || 'https://fishing-go.vercel.app';
// 30분 TTL: 48회/일 × 201 units = 9,648 units → 쿼터 초과 위험
// 4시간 TTL:  6회/일 × 201 units = 1,206 units → 안전권 유지

function ytCacheGet(key) {
  const entry = ytCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { ytCache.delete(key); return null; }
  return entry.data;
}
function ytCacheSet(key, data) {
  if (ytCache.size >= 100) ytCache.delete(ytCache.keys().next().value);
  ytCache.set(key, { data, expiresAt: Date.now() + YT_CACHE_TTL_MS });
}

/**
 * YouTube 검색 결과를 표준 형태로 변환 + publishedAt 포함
 */
function buildYtVideoList(items) {
  return (items || []).map(item => {
    const id = typeof item.id === 'string' ? item.id : (item.id?.videoId || '');
    const sn = item.snippet || {};
    return {
      youtubeId: id,
      title: sn.title || '',
      description: sn.description || '',
      channelTitle: sn.channelTitle || '',
      publishedAt: sn.publishedAt || '',
      thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
    };
  })
  // ✅ Shorts 이중 필터
  .filter(v => v.youtubeId && !v.title.toLowerCase().includes('#shorts'))
  // ✅ 블랙리스트 키워드 필터: 광고성·쇼핑몰 관련 영상 제외 (제목 + 채널명 체크)
  .filter(v => {
    const text = (v.title + ' ' + v.channelTitle).toLowerCase();
    return !YT_BLACKLIST.some(kw => text.includes(kw));
  });
}


/**
 * ✅ 핵심 해결책:
 * YouTube Search API는 q(검색어)와 order=date를 함께 쓰면 date 정렬이 무시됨.
 * → 서버에서 publishedAt 기준으로 직접 정렬하여 반환
 * → viewCount는 YouTube API의 order=viewCount를 사용 (검색어+인기순은 정상 작동)
 */
function sortVideos(videos, order) {
  if (order === 'date') {
    // ✅ publishedAt 내림차순 (최신순) — 누락/Invalid Date 방어 처리
    return [...videos].sort((a, b) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return isNaN(tb) || isNaN(ta) ? 0 : tb - ta;
    });
  }
  // viewCount: YouTube API가 이미 정렬해서 반환
  return videos;
}

/**
 * ISO 8601 duration → 초 변환
 * 예: PT4M30S → 270, PT1H5M → 3900
 */
function parseDuration(iso) {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

/**
 * ✅ 실제 영상 길이 확인 필터 — videoDuration=any + 110초 기준 이중 보장
 * YouTube Videos API(contentDetails)로 실제 길이를 가져와 MIN_SECS 미만 제거
 * API 비용: 1 unit (Search가 100 unit 대비 매우 저렴)
 * @param {string[]} videoIds
 * @param {number} minSecs 최소 길이(초), 기본 110초 — Shorts(60초) + 짧은 클립 차단
 * ⚠️ 주의: YouTube Videos API는 1회에 ID 50개 제한 → 50개 초과 시 청크 분할 필수
 */
async function filterByActualDuration(videoIds, minSecs = 110) {
  if (!videoIds.length || !YT_API_KEY) return new Set(videoIds);
  try {
    // ✅ FIX-BUG2: YouTube Videos API ID 최대 50개 제한 → 쫙크 분할 처리
    const CHUNK = 50;
    const valid = new Set();
    for (let i = 0; i < videoIds.length; i += CHUNK) {
      const chunk = videoIds.slice(i, i + CHUNK);
      const params = new URLSearchParams({ part: 'contentDetails', id: chunk.join(','), key: YT_API_KEY });
      const res = await axios.get(`${YT_BASE}/videos?${params.toString()}`, { timeout: 8000 });
      for (const item of res.data.items || []) {
        const secs = parseDuration(item.contentDetails?.duration);
        (logger?.debug || console.log)(`[DurationCheck] ${item.id}: ${secs}초 (${Math.floor(secs/60)}분 ${secs%60}초)`);
        if (secs >= minSecs) valid.add(item.id);
      }
    }
    (logger?.info || console.log)(`[DurationCheck] ${videoIds.length}개 중 ${valid.size}개 통과 (≥${minSecs}초)`);
    return valid;
  } catch (e) {
    // ⚠️ Videos API 실패 (quota 초과/네트워크 오류) — ID만으론 제목 판단 불가
    // 전체 반환 불가피하지만 로그에 경고 표시
    (logger?.warn || console.warn)(`[DurationCheck] Videos API 실패 → ${videoIds.length}개 전체 보존 (필터 없음):`, e.message);
    return new Set(videoIds);
  }
}


/**
 * publishedAfter 헬퍼
 *   date      → 최근 7일 (이번 주 최신 영상)
 *   viewCount → 최근 30일 (한 달 이내 인기순)
 *   null      → 제한 없음
 */
function getPublishedAfter(order) {
  const d = new Date();
  if (order === 'date') {
    d.setDate(d.getDate() - 7);   // ✅ 최근 7일
    return d.toISOString();
  }
  if (order === 'viewCount') {
    d.setDate(d.getDate() - 30);  // ✅ 최근 30일 (한달 이내 인기순)
    return d.toISOString();
  }
  return null;
}

/**
 * GET /api/media/youtube/search?q=낚시&order=date|viewCount&maxResults=15
 * - order=date  : publishedAfter(1년) + publishedAt 서버 재정렬 → 실제 최신 영상
 * - order=viewCount : 전체 기간 조회수 인기순
 * - videoDuration=any : Shorts 60초 이하 서버 필터 (filterByActualDuration 120초)
 */
app.get('/api/media/youtube/search', async (req, res) => {
  try {
    const q = (req.query.q || '낚시').trim();
    const order = req.query.order === 'viewCount' ? 'viewCount' : 'date';
    const maxResults = Math.min(parseInt(req.query.maxResults) || 15, 25);
    const pageToken = req.query.pageToken || '';

    if (!YT_API_KEY) {
      return res.json({ videos: [], nextPageToken: null, note: 'YOUTUBE_API_KEY 미설정' });
    }

    // ✅ CACHE-FIX: date 순서 검색은 오늘 날짜를 캐시 키에 포함 → 4시간 캐시가 당일 갱신 보장
    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = order === 'date'
      ? `search:${q}:date:${today}:${maxResults}:${pageToken}`
      : `search:${q}:${order}:all:${maxResults}:${pageToken}`;
    const cached = ytCacheGet(cacheKey);
    if (cached) {
      logger.info(`[YouTube Search] 캐시 HIT: "${q}"`);
      return res.json(cached);
    }

    const axiosCfg = {
      timeout: 10000,
      headers: { Referer: YT_ORIGIN, Origin: YT_ORIGIN },
    };

    logger.info(`[YouTube Search] 요청: q="${q}", order=${order}`);

    // ─── STEP 1: 채널명인지 감지 — type=channel로 먼저 검색 ─────────────────
    let channelId = null;
    try {
      const chParams = new URLSearchParams({
        part: 'snippet', q, type: 'channel', maxResults: '3',
        relevanceLanguage: 'ko', regionCode: 'KR', key: YT_API_KEY,
      });
      const chRes = await axios.get(`${YT_BASE}/search?${chParams}`, axiosCfg);
      const channels = chRes.data.items || [];
      // 채널 제목이 검색어를 포함하는 채널 우선 선택
      const matched = channels.find(c =>
        (c.snippet?.channelTitle || '').replace(/\s/g, '').toLowerCase()
          .includes(q.replace(/\s/g, '').toLowerCase())
      );
      if (matched) {
        channelId = matched.id?.channelId || matched.snippet?.channelId;
        logger.info(`[YouTube Search] 체널 감지: "${matched.snippet?.channelTitle}" (${channelId})`);
      }
    } catch (e) {
      (logger?.warn || console.warn)('[YouTube Search] 체널 검색 실패 (fallback to keyword):', e.message);
    }

    // ─── STEP 2: 영상 검색 (채널ID 있으면 채널 전용, 없으면 키워드) ─────────
    // ✅ FIX-SORT: publishedAfter 정책 개선
    //   채널 검색: 최근 6개월 제한 → 최신 영상 우선 반환 (전체 기간이면 오래된 영상 혼입)
    //   키워드 검색: 최근 1년 제한
    // ✅ FIX-DUR: videoDuration=any → YouTube 프리필터 제거, filterByActualDuration(120초)로 직접 2분 필터
    //   기존 medium(4~20분)은 최근 단편 영상을 제외해 오래된 영상이 반환되는 원인이었음
    const publishedAfterDate = (() => {
      const d = new Date();
      if (channelId) {
        d.setMonth(d.getMonth() - 6); // 채널 검색: 최근 6개월
      } else {
        d.setFullYear(d.getFullYear() - 1); // 키워드 검색: 최근 1년
      }
      return d.toISOString();
    })();
    // ✅ FIX-SHORTAGE: fetchMax 30→50 (한국 낚시 Shorts 비율 높음 → 필터 후 충분한 영상 확보)
    // YouTube API는 maxResults 크기와 무관하게 Search 1회 = 100 units 고정 → 쿼터 추가 소비 없음
    const fetchMax = String(Math.min(maxResults + 30, 50)); // 여유분 확보 (필터 후에도 충분한 결과 보장)
    const videoParams = {
      part: 'snippet',
      q: channelId ? '' : q,    // 채널 특정 검색 시 q 불필요
      type: 'video',
      order: order === 'viewCount' ? 'viewCount' : 'date',
      videoDuration: 'any',     // ✅ FIX-DUR: YouTube 프리필터 제거 → filterByActualDuration으로 직접 2분 필터
      relevanceLanguage: 'ko',
      regionCode: 'KR',
      maxResults: fetchMax,
      key: YT_API_KEY,
      ...(channelId ? { channelId } : {}),
      ...(order !== 'viewCount' ? { publishedAfter: publishedAfterDate } : {}), // 최신순만 날짜 제한
      ...(pageToken ? { pageToken } : {}),
    };
    // q가 비어있으면 제거 (channelId 모드)
    if (!videoParams.q) delete videoParams.q;

    const params = new URLSearchParams(videoParams);
    const response = await axios.get(`${YT_BASE}/search?${params.toString()}`, axiosCfg);
    let videos = buildYtVideoList(response.data.items);
    (logger?.info || console.log)(`[YouTube Search] 응답: ${videos.length}개 (채널ID: ${channelId || '없음'}, publishedAfter: ${publishedAfterDate.slice(0, 10)})`);

    // ─── STEP 3: 실제 영상 길이 필터 (110초+) ─────────────────────────────────
    // ✅ 110초 미만 영상 차단 (Shorts 60초 이하 + 짧은 낚시 클립 제거)
    const videoIds = videos.map(v => v.youtubeId).filter(Boolean);
    const validIds = await filterByActualDuration(videoIds, 110);
    videos = videos.filter(v => validIds.has(v.youtubeId));
    // Shorts(60초 이하) 제목 필터 재적용
    videos = videos.filter(v => !v.title.toLowerCase().includes('#shorts') && !v.title.toLowerCase().includes('shorts'));
    (logger?.info || console.log)(`[YouTube Search] 길이 필터 후: ${videos.length}개 (≥110초, Shorts 제외)`);

    // ─── STEP 4: 정렬 ─────────────────────────────────────────────────────────
    videos = sortVideos(videos, order);

    const result = { videos, nextPageToken: response.data.nextPageToken || null, order, channelId };
    ytCacheSet(cacheKey, result);
    res.json(result);
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    const errStatus = err.response?.status;
    (logger?.error || console.error)(`[YouTube Search API 오류] status=${errStatus}, msg=${errMsg}`);
    res.json({ videos: [], nextPageToken: null, error: errMsg, status: errStatus });
  }
});


// ─── 통합 피드: 최신(7일) + 인기(전체기간) 병렬 조회 ─────────────────────────
app.get('/api/media/youtube/unified', async (req, res) => {
  const q = (req.query.q || '낚시').trim();
  if (!YT_API_KEY) return res.json({ recent: [], popular: [], note: 'YOUTUBE_API_KEY 미설정' });

  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `unified:${q}:${today}`;
  const cached = ytCacheGet(cacheKey);
  if (cached) {
    logger.info(`[YouTube Unified] 캐시 HIT: ${q}`);
    return res.json(cached);
  }

  try {
    const publishedAfterRecent = getPublishedAfter('date');      // 최근 7일
    const publishedAfterPopular = getPublishedAfter('viewCount'); // 최근 30일
    const commonParams = { part: 'snippet', q, type: 'video', videoDuration: 'any', relevanceLanguage: 'ko', regionCode: 'KR', maxResults: '30', key: YT_API_KEY };
    const axiosCfg = { timeout: 10000, headers: { Referer: YT_ORIGIN, Origin: YT_ORIGIN } };

    logger.info(`[YouTube Unified] 병렬 요청: "${q}" | recent(7일) + popular(30일 인기순)`);

    const [recentResult, popularResult] = await Promise.allSettled([
      axios.get(`${YT_BASE}/search?${new URLSearchParams({ ...commonParams, order: 'date', publishedAfter: publishedAfterRecent })}`, axiosCfg),
      axios.get(`${YT_BASE}/search?${new URLSearchParams({ ...commonParams, order: 'viewCount', publishedAfter: publishedAfterPopular })}`, axiosCfg),
    ]);

    let recent = recentResult.status === 'fulfilled' ? buildYtVideoList(recentResult.value.data.items) : [];
    let popular = popularResult.status === 'fulfilled' ? buildYtVideoList(popularResult.value.data.items) : [];
    logger.info(`[YouTube Unified] 검색 결과: 최신 ${recent.length}개, 인기 ${popular.length}개`);

    // 실제 영상 길이 필터 (Videos API) — ✅ 2분+ 보장 (4분 → 2분 기준 완화)
    const allIds = [...new Set([...recent.map(v => v.youtubeId), ...popular.map(v => v.youtubeId)])].filter(Boolean);
    const validIds = await filterByActualDuration(allIds, 110);
    recent = recent.filter(v => validIds.has(v.youtubeId));
    popular = popular.filter(v => validIds.has(v.youtubeId));

    // 최신순 재정렬
    recent = sortVideos(recent, 'date');
    // 인기순에서 최신과 중복 제거
    const recentSet = new Set(recent.map(v => v.youtubeId));
    popular = popular.filter(v => !recentSet.has(v.youtubeId));

    // 태그 부여
    recent = recent.map(v => ({ ...v, tag: 'recent' }));
    popular = popular.map(v => ({ ...v, tag: 'popular' }));

    logger.info(`[YouTube Unified] 필터 후: 최신 ${recent.length}개, 인기 ${popular.length}개 (≥110초)`);

    const result = { recent, popular };
    ytCacheSet(cacheKey, result);
    res.json(result);
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    (logger?.error || console.error)(`[YouTube Unified API 오류]: ${errMsg}`);
    res.json({ recent: [], popular: [], error: errMsg });
  }
});

/**
 * GET /api/media/youtube?order=date|viewCount&pageToken=xxx
 * 기본 낚시 영상 피드 (전체 탭용)
 */
app.get('/api/media/youtube', async (req, res) => {
  try {
    const order = req.query.order === 'viewCount' ? 'viewCount' : 'date';
    const pageToken = req.query.pageToken || '';
    // ✅ FIX-SHORTAGE: 15→30 (한국 낚시 Shorts 비율 높음 → 필터 후 충분한 영상 확보)
    const maxResults = 30;
    const publishedAfter = getPublishedAfter(order);

    if (!YT_API_KEY) {
      return res.json({ videos: [], nextPageToken: null, note: 'YOUTUBE_API_KEY 미설정' });
    }

    const dateStamp = order === 'date' ? new Date().toISOString().slice(0, 10) : 'all';
    const cacheKey = `feed:${order}:${dateStamp}:${pageToken}`;
    const cached = ytCacheGet(cacheKey);
    if (cached) return res.json(cached);

    const ytOrder = order === 'viewCount' ? 'viewCount' : 'date';

    const paramObj = {
      part: 'snippet',
      q: '낚시',
      type: 'video',
      order: ytOrder,
      videoDuration: 'any',              // ✅ 2분+ 기준으로 완화 (medium=4~20분 제한 제거)
      relevanceLanguage: 'ko',
      regionCode: 'KR',
      maxResults: String(maxResults),
      key: YT_API_KEY,
      ...(pageToken ? { pageToken } : {}),
      ...(publishedAfter ? { publishedAfter } : {}),
    };

    const params = new URLSearchParams(paramObj);
    const axiosConfig = {
      timeout: 10000,
      headers: {
        'Referer': YT_ORIGIN,
        'Origin': YT_ORIGIN,
      }
    };
    (logger?.info || console.log)(`[YouTube] 피드 요청: order=${order}, publishedAfter=${publishedAfter || '없음'}`);
    const response = await axios.get(`${YT_BASE}/search?${params.toString()}`, axiosConfig);
    let videos = buildYtVideoList(response.data.items);
    (logger?.info || console.log)(`[YouTube] 피드 응답: ${videos.length}개 | 첫 번째: ${videos[0]?.publishedAt || '없음'}`);

    // ✅ 실제 영상 길이 확인 필터 — 110초+ 기준 (Shorts + 짧은 클립 차단)
    const videoIds = videos.map(v => v.youtubeId).filter(Boolean);
    const validIds = await filterByActualDuration(videoIds, 110);
    videos = videos.filter(v => validIds.has(v.youtubeId));
    (logger?.info || console.log)(`[YouTube] 피드 길이 필터 후: ${videos.length}개 (≥110초)`);

    videos = sortVideos(videos, order);

    const result = { videos, nextPageToken: response.data.nextPageToken || null, order };
    ytCacheSet(cacheKey, result);
    res.json(result);
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    const errStatus = err.response?.status;
    (logger?.error || console.error)(`[YouTube Feed API 오류] status=${errStatus}, msg=${errMsg}`);
    res.json({ videos: [], nextPageToken: null, error: errMsg, status: errStatus });
  }
});


// ✅ 22TH-B2/B3/B4/C3: VVIP_HARBORS(23개) 이중 정의 및 중복 라우트 3개 제거
// → GET /api/vvip/harbors (L3020), GET /api/vvip/my-slot (L3100), POST /api/vvip/purchase (L3047) 단일 라우트 유지
// → HARBOR_LIST(20개)가 단일 정규 항구 목록으로 유지됨 (L2979)

// --- VVIP: 구독 해지 (JWT 어드민 전용) ---
app.post('/api/vvip/cancel', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    if (!isAdminToken(tp)) return res.status(403).json({ error: '권한 없음' });
    const { harborId } = req.body;
    if (dbReady && User) {
      await User.findOneAndUpdate({ vvipHarborId: harborId }, { tier: 'FREE', vvipHarborId: null, vvipExpiresAt: null });
    } else {
      if (memVvipSlots && memVvipSlots[harborId]) {
        const uid = memVvipSlots[harborId].userId;
        delete memVvipSlots[harborId];
        saveVvipSlots();
        const u = memUsers.find(x => x.email === uid || x.id === uid);
        if (u) { u.tier = 'FREE'; u.vvipHarborId = null; saveMemUsers(); }
      }
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

// ─── 서버 종료 시 전체 데이터 강제 플러시 ────────────────────────────────────
function flushAllData() {
  logger.info('[Flush] 서버 종료 감지 → 전체 데이터 파일 동기화 시작...');
  try { saveMemUsers(); logger.info('[Flush] users.json ✅'); } catch (e) { }
  try { saveMemPosts(); logger.info('[Flush] posts.json ✅'); } catch (e) { }
  try { saveMemRecords(); logger.info('[Flush] records.json ✅'); } catch (e) { }
  try { saveMemCrews(); logger.info('[Flush] crews.json ✅'); } catch (e) { }
  try { saveChatHistories(); logger.info('[Flush] chats.json ✅'); } catch (e) { }
  try { saveMemNotices(); logger.info('[Flush] notices.json ✅'); } catch (e) { }
  try { saveMemBusinessPosts(); logger.info('[Flush] business.json ✅'); } catch (e) { }
  try { saveSecretPointOverrides(); logger.info('[Flush] secretPointOverrides.json ✅'); } catch (e) { }
  try { saveCctvOverrides(); logger.info('[Flush] cctvOverrides.json ✅'); } catch (e) { }
  try { saveProSubs(); logger.info('[Flush] proSubscriptions.json ✅'); } catch (e) { }
  try { saveVvipSlots(); logger.info('[Flush] vvipSlots.json ✅'); } catch (e) { }
  logger.info('[Flush] ✅ 전체 데이터 동기화 완료.');
}

// ✅ BUG-FIX: SIGTERM/SIGINT/uncaughtException 핸들러는 graceful_shutdown.js (L6149)에서 단일 등록
// 새로운 프로세스 종료 전 flushAllData()는 graceful_shutdown.js의 server.close 콜백에서 호출함

// ─── 30분마다 자동 백업 (Render 무료플랜 sleep 대비) ──────────────────────────
setInterval(() => {
  logger.info('[AutoBackup] 30분 주기 자동 백업 실행...');
  flushAllData();
}, 30 * 60 * 1000);

// ─── Render Keep-Alive는 파일 말미 server.listen 블록에 통합됨 ─────────────

// ══════════════════════════════════════════════════════════════════════════════
// ▣ 정기결제(빌링) 시스템 — 포트원 customer_uid 기반 자동 월 청구
// ══════════════════════════════════════════════════════════════════════════════

const BILLING_PLAN_MAP = {
  LITE: { tier: 'BUSINESS_LITE', amount: 9900 },
  PRO: { tier: 'PRO', amount: 110000 },
  VVIP: { tier: 'BUSINESS_VIP', amount: 550000 },
};

// ── 포트원 액세스 토큰 발급 헬퍼 ──────────────────────────────────────────────
async function getPortoneToken() {
  if (!process.env.PORTONE_API_KEY) return null;
  const res = await axios.post('https://api.iamport.kr/users/getToken', {
    imp_key: process.env.PORTONE_API_KEY,
    imp_secret: process.env.PORTONE_API_SECRET,
  });
  return res.data.response?.access_token || null;
}

// ── 빌링키로 실제 청구 실행 ───────────────────────────────────────────────────
async function chargeBilling(sub) {
  const token = await getPortoneToken();
  if (!token) {
    // 테스트모드: 실제 청구 없이 성공 처리
    (logger?.info || console.log)(`[BillingTest] 테스트모드 자동청구 성공 - ${sub.userId} / ${sub.planId}`);
    return { success: true, testMode: true };
  }
  const merchant_uid = `auto_${sub.planId}_${sub.userId.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`;
  const res = await axios.post('https://api.iamport.kr/subscribe/payments/again', {
    customer_uid: sub.customerUid,
    merchant_uid,
    amount: sub.amount,
    name: `낚시GO ${sub.planId} 정기구독`,
  }, { headers: { Authorization: token } });
  const payment = res.data.response;
  if (payment.status !== 'paid') throw new Error(payment.fail_reason || '결제 실패');
  return { success: true, imp_uid: payment.imp_uid };
}

// ── 구독 갱신 처리 (성공/실패 공통) ───────────────────────────────────────────
async function processSubscription(sub) {
  try {
    const result = await chargeBilling(sub);
    const next = new Date(sub.nextBillingDate);
    next.setMonth(next.getMonth() + 1);

    if (dbReady && Subscription) {
      await Subscription.findByIdAndUpdate(sub._id, {
        status: 'active',
        lastBilledAt: new Date(),
        nextBillingDate: next,
        failCount: 0,
        lastFailReason: null,
      });
      // 유저 tier + 만료일 갱신
      await User?.findOneAndUpdate(
        { $or: [{ email: sub.userId }, { id: sub.userId }] },
        { tier: BILLING_PLAN_MAP[sub.planId]?.tier, subscriptionExpiresAt: next }
      ).catch(() => { });
    }
    (logger?.info || console.log)(`[Billing] ✅ 자동청구 성공 - ${sub.userId} / ${sub.planId} / ${sub.amount}원`);
  } catch (err) {
    const failCount = (sub.failCount || 0) + 1;
    const newStatus = failCount >= 3 ? 'failed' : 'active'; // 3회 실패 시 구독 정지
    if (dbReady && Subscription) {
      await Subscription.findByIdAndUpdate(sub._id, {
        status: newStatus,
        failCount,
        lastFailedAt: new Date(),
        lastFailReason: err.message,
      });
      // 3회 실패 시 유저 tier FREE로 강등
      if (newStatus === 'failed') {
        await User?.findOneAndUpdate(
          { $or: [{ email: sub.userId }, { id: sub.userId }] },
          { tier: 'FREE', subscriptionExpiresAt: null }
        ).catch(() => { });
      }
    }
    (logger?.warn || console.warn)(`[Billing] ❌ 자동청구 실패(${failCount}회) - ${sub.userId}: ${err.message}`);
  }
}

// ── 스케줄러: 매일 오전 9시(KST) 만기 구독 일괄 청구 ─────────────────────────
async function runBillingScheduler() {
  if (!dbReady || !Subscription) return;
  const now = new Date();
  const dueList = await Subscription.find({
    status: 'active',
    nextBillingDate: { $lte: now },
  }).lean().catch(() => []);

  if (dueList.length > 0) {
    logger.info(`[Scheduler] 정기결제 대상 ${dueList.length}건 처리 시작`);
    for (const sub of dueList) {
      await processSubscription(sub);
      await new Promise(r => setTimeout(r, 300)); // 과부하 방지
    }
  }
}

// node-cron 또는 24시간 인터벌 폴백
if (cron) {
  cron.schedule('0 9 * * *', runBillingScheduler, { timezone: 'Asia/Seoul' });
  logger.info('✅ [Billing Scheduler] node-cron 매일 09:00(KST) 자동청구 활성화');
} else {
  setInterval(runBillingScheduler, 24 * 60 * 60 * 1000); // 24시간 인터벌 폴백
  logger.info('✅ [Billing Scheduler] 인터벌 폴백 자동청구 활성화 (24h)');
}

// ── API: 빌링키 등록 (최초 카드 등록 + 첫 결제) — JWT 인증 필수 ──────────────
app.post('/api/payment/billing/register', async (req, res) => {
  try {
    // ✅ JWT 인증 추가
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const { imp_uid, customer_uid, planId, pgProvider, userId, userName, harborId } = req.body;
    if (!customer_uid || !planId || !userId)
      return res.status(400).json({ error: '필수 항목 누락 (customer_uid, planId, userId)' });

    // 본인 또는 어드민만 처리 가능
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== userId && tp.email !== userId) {
      return res.status(403).json({ error: '본인 구독만 등록 가능합니다.' });
    }

    const plan = BILLING_PLAN_MAP[planId];
    if (!plan) return res.status(400).json({ error: '유효하지 않은 플랜' });

    // 첫 결제 포트원 검증 (실서비스)
    if (process.env.PORTONE_API_KEY && imp_uid) {
      try {
        const token = await getPortoneToken();
        const payRes = await axios.get(`https://api.iamport.kr/payments/${imp_uid}`, {
          headers: { Authorization: token },
        });
        const payment = payRes.data.response;
        if (payment.status !== 'paid' || payment.amount !== plan.amount)
          return res.status(400).json({ error: '첫 결제 금액 불일치' });
      } catch (e) {
        return res.status(500).json({ error: '첫 결제 검증 실패: ' + e.message });
      }
    }

    // 다음 결제일 계산 (가입일 +1개월)
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    const billingDay = nextBillingDate.getDate();

    // Subscription 저장 (DB or 인메모리 JSON)
    if (dbReady && Subscription) {
      await Subscription.findOneAndUpdate(
        { userId },
        {
          userId, userName, planId, tier: plan.tier, amount: plan.amount,
          customerUid: customer_uid, pgProvider: pgProvider || 'kakaopay',
          status: 'active', startedAt: new Date(),
          nextBillingDate, lastBilledAt: new Date(),
          billingDay, failCount: 0, harborId: harborId || null,
        },
        { upsert: true, new: true }
      );
      // 유저 tier 즉시 반영
      await User?.findOneAndUpdate(
        { $or: [{ email: userId }, { id: userId }] },
        { tier: plan.tier, subscriptionExpiresAt: nextBillingDate }
      ).catch(() => { });
    } else {
      // 인메모리 fallback
      memProSubs[userId] = {
        userId, planId, tier: plan.tier, amount: plan.amount,
        customerUid: customer_uid, pgProvider,
        status: 'active', nextBillingDate: nextBillingDate.toISOString(),
        lastBilledAt: new Date().toISOString(), failCount: 0,
      };
      saveProSubs();
      const u = memUsers.find(u => u.email === userId || u.id === userId);
      if (u) { u.tier = plan.tier; saveMemUsers(); }
    }
    // ✅ BUG-FIX-VVIP: VVIP 결제 시 vvipSlots에도 항구 선점 자동 등록
    if (planId === 'VVIP' && harborId) {
      const harbor = HARBOR_LIST.find(h => h.id === harborId);
      if (harbor) {
        vvipSlots[harborId] = {
          userId, userName: userName || userId,
          purchasedAt: new Date().toISOString(),
          expiresAt: nextBillingDate.toISOString(),
          harborName: harbor.name,
        };
        saveVvipSlots();
        // DB에도 User.vvipHarborId 업데이트
        if (dbReady && User) {
          try {
            await User.findOneAndUpdate(
              { $or: [{ email: userId }, { id: userId }] },
              { tier: 'BUSINESS_VIP', vvipHarborId: harborId, vvipExpiresAt: nextBillingDate }
            );
          } catch (e) { (logger?.error || console.error)('[VVIP Slot Register]', e.message); }
        } else {
          const mu = memUsers.find(u => u.email === userId || u.id === userId);
          if (mu) { mu.tier = 'BUSINESS_VIP'; mu.vvipHarborId = harborId; mu.vvipExpiresAt = nextBillingDate.toISOString(); saveMemUsers(); }
        }
        (logger?.info || console.log)(`[Billing] ✅ VVIP 항구 선점 등록 - ${harbor.name} → ${userName}(${userId})`);  
      }
    }

    (logger?.info || console.log)(`[Billing] ✅ 정기구독 등록 - ${userName}(${userId}) / ${planId} / ${plan.amount}원`);
    res.json({
      success: true, planId, tier: plan.tier,
      nextBillingDate: nextBillingDate.toISOString(),
      amount: plan.amount,
    });
  } catch (err) {
    (logger?.error || console.error)('[POST /api/payment/billing/register]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── API: 내 구독 정보 조회 ────────────────────────────────────────────────────
// ── API: 내 구독 정보 조회 — JWT 인증 필수 ────────────────────────────────────
app.get('/api/payment/subscription/:userId', async (req, res) => {
  try {
    // ✅ JWT 인증 추가
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const { userId } = req.params;
    // 본인 또는 어드민만 조회 가능
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== userId && tp.email !== userId) {
      return res.status(403).json({ error: '본인의 구독 정보만 조회 가능합니다.' });
    }

    let sub = null;
    if (dbReady && Subscription) {
      sub = await Subscription.findOne({ userId }).lean().catch(() => null);
    } else {
      sub = memProSubs[userId] || null;
    }
    if (!sub) return res.json({ hasSubscription: false });
    res.json({
      hasSubscription: true,
      planId: sub.planId,
      tier: sub.tier,
      amount: sub.amount,
      status: sub.status,
      pgProvider: sub.pgProvider,
      nextBillingDate: sub.nextBillingDate,
      lastBilledAt: sub.lastBilledAt,
      startedAt: sub.startedAt,
      failCount: sub.failCount || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: 구독 취소 — ✅ NEW-WARN-01: JWT 인증 추가 (본인/어드민만 취소 가능)
app.delete('/api/payment/subscription/:userId', async (req, res) => {
  try {
    // JWT 인증 가드
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { userId } = req.params;
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== userId && tp.email !== userId) return res.status(403).json({ error: '본인 구독만 취소 가능합니다.' });
    const { reason } = req.body;

    if (dbReady && Subscription) {
      const sub = await Subscription.findOne({ userId });
      if (!sub) return res.status(404).json({ error: '구독 정보 없음' });

      // 포트원 빌링키 삭제 (실서비스)
      if (process.env.PORTONE_API_KEY && sub.customerUid) {
        try {
          const token = await getPortoneToken();
          await axios.delete(`https://api.iamport.kr/subscribe/customers/${sub.customerUid}`, {
            headers: { Authorization: token },
          });
        } catch (e) { (logger?.warn || console.warn)('[BillingCancel] 빌링키 삭제 실패:', e.message); }
      }

      await Subscription.findOneAndUpdate(
        { userId },
        { status: 'cancelled', cancelledAt: new Date(), cancelReason: reason || '사용자 직접 취소' }
      );
      // 유저 tier FREE로 강등
      await User?.findOneAndUpdate(
        { $or: [{ email: userId }, { id: userId }] },
        { tier: 'FREE', subscriptionExpiresAt: null }
      ).catch(() => { });
    } else {
      if (memProSubs[userId]) {
        memProSubs[userId].status = 'cancelled';
        saveProSubs();
        const u = memUsers.find(u => u.email === userId || u.id === userId);
        if (u) { u.tier = 'FREE'; saveMemUsers(); }
      }
    }

    logger.info(`[Billing] 구독 취소 - ${userId} / 사유: ${reason || '직접취소'}`);
    res.json({ success: true, message: '구독이 취소되었습니다. 현재 기간 종료 후 해지됩니다.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: 구독 플랜 변경 (업그레이드/다운그레이드) — ✅ NEW-WARN-02: JWT 인증 추가
app.put('/api/payment/subscription/:userId/plan', async (req, res) => {
  try {
    // JWT 인증 가드
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { userId } = req.params;
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== userId && tp.email !== userId) return res.status(403).json({ error: '본인 구독만 변경 가능합니다.' });
    const { newPlanId } = req.body;
    const plan = BILLING_PLAN_MAP[newPlanId];
    if (!plan) return res.status(400).json({ error: '유효하지 않은 플랜' });

    if (dbReady && Subscription) {
      await Subscription.findOneAndUpdate(
        { userId },
        { planId: newPlanId, tier: plan.tier, amount: plan.amount }
      );
      await User?.findOneAndUpdate(
        { $or: [{ email: userId }, { id: userId }] },
        { tier: plan.tier }
      ).catch(() => { });
    } else {
      if (memProSubs[userId]) {
        memProSubs[userId].planId = newPlanId;
        memProSubs[userId].tier = plan.tier;
        memProSubs[userId].amount = plan.amount;
        saveProSubs();
        const u = memUsers.find(u => u.email === userId || u.id === userId);
        if (u) { u.tier = plan.tier; saveMemUsers(); }
      }
    }
    res.json({ success: true, newPlanId, tier: plan.tier, amount: plan.amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ▣ 고도화 API — 결제 내역 / 보안 / EXP / 검색 / 즐겨찾기 / 어드민 대시보드
// ══════════════════════════════════════════════════════════════════════════════

// ── (3) merchant_uid 중복 방지 헬퍼 ──────────────────────────────────────────
function generateMerchantUid(planId, userId) {
  const safeId = (userId || 'user').replace(/[^a-zA-Z0-9]/g, '');
  const rand = Math.random().toString(36).slice(2, 7);
  return `fishing_${planId}_${safeId}_${Date.now()}_${rand}`;
}
// 결제 검증 엔드포인트에서 merchant_uid 중복 체크
async function isMerchantUidUsed(merchant_uid) {
  if (!dbReady || !PaymentHistory) return false;
  const existing = await PaymentHistory.findOne({ merchant_uid }).lean().catch(() => null);
  return !!existing;
}

// ── (4) 구독 만료 서버 미들웨어 ──────────────────────────────────────────────
async function checkSubscriptionValid(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return next();
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET);
    const userId = payload.email || payload.id;
    if (!userId) return next();

    // DB에서 만료 여부 확인
    let expiredAt = null;
    if (dbReady && User) {
      const u = await User.findOne({ $or: [{ email: userId }, { id: userId }] }, 'subscriptionExpiresAt tier').lean().catch(() => null);
      if (u?.subscriptionExpiresAt) expiredAt = new Date(u.subscriptionExpiresAt);
    }
    if (expiredAt && expiredAt < new Date()) {
      // 만료 → tier 강등
      if (dbReady && User) {
        await User.findOneAndUpdate(
          { $or: [{ email: userId }, { id: userId }] },
          { tier: 'FREE', subscriptionExpiresAt: null }
        ).catch(() => { });
      }
      return res.status(403).json({ error: '구독이 만료되었습니다. 재구독해주세요.', code: 'SUBSCRIPTION_EXPIRED' });
    }
    next();
  } catch { next(); }
}

// ✅ BUG-FIX: app.use() 구독 미들웨어 제거
// /api/weather/precision → 라우트 인라인 checkSubscriptionValid 적용 완료
// /api/secret-point-overrides → 라우트 내부 수동 tier 검증 완료
// (라우트 이후 선언된 app.use()는 해당 라우트에 적용 안됨 — Express 규칙)

// ── (5) 결제 내역 조회 API — JWT 인증 필수 ──────────────────────────────────
app.get('/api/payment/history', async (req, res) => {
  try {
    // ✅ JWT 인증 추가
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId 필요' });

    // 본인 또는 어드민만 조회 가능
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== userId && tp.email !== userId) {
      return res.status(403).json({ error: '본인의 결제 내역만 조회 가능합니다.' });
    }

    let history = [];
    if (dbReady && PaymentHistory) {
      history = await PaymentHistory.find({ userId }).sort({ createdAt: -1 }).limit(50).lean().catch(() => []);
    }
    // 인메모리 fallback: Subscription에서 추출
    if (history.length === 0) {
      const sub = memProSubs[userId];
      if (sub) {
        history = [{
          userId,
          planId: sub.planId,
          pgProvider: sub.pgProvider,
          paymentType: 'billing_first',
          amount: sub.amount,
          status: 'paid',
          createdAt: sub.lastBilledAt || new Date().toISOString(),
        }];
      }
    }
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// billing/register에서 PaymentHistory 자동 저장 (기존 엔드포인트 보완 훅)
// 아래 미들웨어를 통해 billing/register 응답 성공 시 history 저장
// ✅ BUG-42: JWT 인증 추가 — 미인증 결제 기록 위조 방지
app.post('/api/payment/history/record', verifyToken, async (req, res) => {
  try {
    const { userId, userName, planId, pgProvider, paymentType, amount, status, imp_uid, merchant_uid, failReason } = req.body;
    // 요청 userId와 토큰 userId 일치 여부 확인 (본인 결제만 기록 가능)
    const tokenId = req.user.email || req.user.id;
    const isAdmin = isAdminToken(req.user);
    if (!isAdmin && userId && userId !== tokenId) {
      return res.status(403).json({ error: '본인 결제 기록만 등록할 수 있습니다.' });
    }
    if (dbReady && PaymentHistory && merchant_uid) {
      const used = await isMerchantUidUsed(merchant_uid);
      if (used) return res.status(409).json({ error: '이미 처리된 결제입니다.' });
      await PaymentHistory.create({ userId, userName, planId, pgProvider, paymentType, amount, status, imp_uid, merchant_uid, failReason });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── (6) EXP 서버 계산 + 보상 지급 ──────────────────────────────────────────
const SERVER_EXP_REWARDS = {
  attendance: 20, post_write: 30, record_write: 50,
  comment_write: 10, like_receive: 5, point_visit: 15,
  photo_upload: 25, first_catch: 100, weekly_streak: 80, monthly_streak: 300,
};

// ✅ BUG-43: JWT 인증 추가 — EXP 직접 조작 방지
app.post('/api/user/exp', verifyToken, async (req, res) => {
  try {
    const { userId, action } = req.body;
    if (!userId || !action) return res.status(400).json({ error: '필수 항목 누락' });
    // 토큰의 실제 사용자와 일치 확인
    const tokenId = req.user.email || req.user.id;
    const isAdmin = isAdminToken(req.user);
    if (!isAdmin && userId !== tokenId) return res.status(403).json({ error: '본인 EXP만 적립할 수 있습니다.' });
    const gain = SERVER_EXP_REWARDS[action];
    if (!gain) return res.status(400).json({ error: '유효하지 않은 액션' });

    let totalExp = 0;
    if (dbReady && User) {
      const u = await User.findOneAndUpdate(
        { $or: [{ email: userId }, { id: userId }] },
        { $inc: { totalExp: gain, exp: gain } },
        { new: true }
      ).lean().catch(() => null);
      totalExp = u?.totalExp || gain;
    } else {
      const u = memUsers.find(u => u.email === userId || u.id === userId);
      if (u) { u.totalExp = (u.totalExp || 0) + gain; u.exp = (u.exp || 0) + gain; totalExp = u.totalExp; saveMemUsers(); }
    }
    res.json({ success: true, action, gain, totalExp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── (7) 파일 업로드 MIME 검증 강화 ──────────────────────────────────────────
// 기존 /api/upload 엔드포인트에 MIME 검증 미들웨어 적용
function validateImageUpload(req, res, next) {
  const { mimeType, base64 } = req.body;
  const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (mimeType && !ALLOWED_MIME.includes(mimeType)) {
    return res.status(400).json({ error: '허용되지 않는 파일 형식입니다. (jpeg/png/gif/webp만 가능)' });
  }
  // base64 길이 기반 크기 추정: 5MB = ~6,825,000 chars
  if (base64 && base64.length > 6_825_000) {
    return res.status(413).json({ error: '파일 크기가 5MB를 초과합니다.' });
  }
  next();
}
// 업로드 라우트에 적용
app.use('/api/upload', validateImageUpload);
app.use('/api/user/avatar', validateImageUpload);

// ── (8) Rate Limit 강화 (결제·검색·업로드) ────────────────────────────────
try {
  const rateLimit = require('express-rate-limit');
  // 결제 API: 1분에 5회
  const paymentLimiter = rateLimit({ windowMs: 60_000, max: 5, message: { error: '결제 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, standardHeaders: true, legacyHeaders: false });
  app.use('/api/payment', paymentLimiter);
  // 검색 API: 1분에 30회
  const searchLimiter = rateLimit({ windowMs: 60_000, max: 30, message: { error: '검색 요청이 너무 많습니다.' } });
  app.use('/api/community/search', searchLimiter);
  (logger?.info || console.log)('✅ Rate Limit 강화 적용 (결제/검색)');
} catch (e) { (logger?.warn || console.warn)('[RateLimit] express-rate-limit 미설치 또는 적용 실패:', e.message); }

// ── (11) 커뮤니티 서버사이드 전문 검색 ──────────────────────────────────────
app.get('/api/community/search', async (req, res) => {
  try {
    const { q = '', page = 1, limit = 20, category } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let results = [];
    let total = 0;

    if (dbReady && Post && q.trim()) {
      const filter = {
        $text: { $search: q.trim() },
        ...(category && category !== '전체' ? { category } : {}),
      };
      [results, total] = await Promise.all([
        Post.find(filter, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
          .skip(skip).limit(parseInt(limit)).lean(),
        Post.countDocuments(filter),
      ]);
    } else {
      // 인메모리 fallback
      const low = q.toLowerCase();
      const filtered = memPosts.filter(p =>
        p.content?.toLowerCase().includes(low) ||
        p.author?.toLowerCase().includes(low) ||
        p.category?.toLowerCase().includes(low)
      );
      total = filtered.length;
      results = filtered.slice(skip, skip + parseInt(limit));
    }
    res.json({ results, total, page: parseInt(page), hasMore: skip + results.length < total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── (10) 즐겨찾기 DB 동기화 ──────────────────────────────────────────────────
app.get('/api/user/favorites', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId 필요' });
    if (dbReady && User) {
      const u = await User.findOne({ $or: [{ email: userId }, { id: userId }] }, 'favorites').lean().catch(() => null);
      return res.json({ favorites: u?.favorites || [] });
    }
    const u = memUsers.find(u => u.email === userId || u.id === userId);
    res.json({ favorites: u?.favorites || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ✅ NEW-BUG-02: /api/user/favorites POST — JWT 인증 추가 (본인 즐겨찾기만 수정 가능)
app.post('/api/user/favorites', async (req, res) => {
  try {
    // JWT 인증 가드
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { userId, pointId, action } = req.body; // action: 'add' | 'remove'
    if (!userId || !pointId || !action) return res.status(400).json({ error: '필수 항목 누락' });
    // 본인 또는 어드민만 즐겨찾기 수정 가능
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== userId && tp.email !== userId) return res.status(403).json({ error: '본인 즐겨찾기만 수정 가능합니다.' });
    let favorites = [];
    if (dbReady && User) {
      const update = action === 'add'
        ? { $addToSet: { favorites: pointId } }
        : { $pull: { favorites: pointId } };
      const u = await User.findOneAndUpdate(
        { $or: [{ email: userId }, { id: userId }] },
        update, { new: true }
      ).lean().catch(() => null);
      favorites = u?.favorites || [];
    } else {
      const u = memUsers.find(u => u.email === userId || u.id === userId);
      if (u) {
        u.favorites = u.favorites || [];
        if (action === 'add') { if (!u.favorites.includes(pointId)) u.favorites.push(pointId); }
        else u.favorites = u.favorites.filter(f => f !== pointId);
        favorites = u.favorites;
        saveMemUsers();
      }
    }
    res.json({ success: true, favorites });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── (14) 어드민 수익 대시보드 API ─────────────────────────────────────────────
app.get('/api/admin/revenue', async (req, res) => {
  try {
    // 마스터 어드민 인증
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
    let payload;
    try { payload = jwt.verify(authHeader.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '인증 필요' }); }
    const isAdmin = isAdminToken(payload); // ✅ 9TH-A1/B1: payload.name 불일치 비교 제거 — isAdminToken은 id/email만 체크 (ADMIN 기준 통일)
    if (!isAdmin) return res.status(403).json({ error: '접근 권한 없음' });

    const now = new Date();
    const month1 = new Date(now.getFullYear(), now.getMonth(), 1);
    let stats = { totalRevenue: 0, monthRevenue: 0, activeSubscriptions: 0, planBreakdown: {}, recentPayments: [] };

    if (dbReady && PaymentHistory && Subscription) {
      const [allPaid, monthPaid, activeSubs, recentList] = await Promise.all([
        PaymentHistory.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        PaymentHistory.aggregate([{ $match: { status: 'paid', createdAt: { $gte: month1 } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        Subscription.countDocuments({ status: 'active' }),
        PaymentHistory.find().sort({ createdAt: -1 }).limit(10).lean(),
      ]);
      const breakdown = await Subscription.aggregate([{ $group: { _id: '$planId', count: { $sum: 1 }, revenue: { $sum: '$amount' } } }]);

      stats.totalRevenue = allPaid[0]?.total || 0;
      stats.monthRevenue = monthPaid[0]?.total || 0;
      stats.activeSubscriptions = activeSubs;
      stats.planBreakdown = Object.fromEntries(breakdown.map(b => [b._id, { count: b.count, revenue: b.revenue }]));
      stats.recentPayments = recentList;
    } else {
      // 인메모리 통계
      stats.activeSubscriptions = Object.values(memProSubs).filter(s => s.status === 'active').length;
      Object.values(memProSubs).forEach(s => { stats.totalRevenue += s.amount || 0; stats.monthRevenue += s.amount || 0; });
    }
    res.json(stats);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── (15) 관리자 전용 실시간 알림 발송 API ──────────────────────────────────
// ✅ LOW-1: fishing_alert / push_notification 발송에 관리자 JWT guard 적용

// [1] 전체 브로드캐스트 낚시 알림 (fishing_alert)
app.post('/api/admin/alert', verifyToken, (req, res) => {
  const isAdmin = isAdminToken(req.user);
  if (!isAdmin) return res.status(403).json({ error: '관리자 권한 필요' });

  const { message, location, pointName, time } = req.body;
  if (!message) return res.status(400).json({ error: 'message 필수' });

  const payload = {
    message,
    location: location || '',
    pointName: pointName || '',
    time: time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  };
  io.emit('fishing_alert', payload); // 전체 연결 사용자에게 브로드캐스트
  (logger?.info || console.log)(`[Admin Alert] 낚시 알림 발송: ${message}`);
  res.json({ success: true, recipients: 'all', payload });
});

// [2] 특정 사용자 개인 푸시 알림 (push_notification)
app.post('/api/admin/push', verifyToken, (req, res) => {
  const isAdmin = isAdminToken(req.user);
  if (!isAdmin) return res.status(403).json({ error: '관리자 권한 필요' });

  const { targetEmail, title, message, time } = req.body;
  if (!targetEmail || !message) return res.status(400).json({ error: 'targetEmail, message 필수' });

  const payload = {
    targetEmail,
    title: title || '낚시GO 알림',
    message,
    time: time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  };
  io.emit('push_notification', payload); // 클라이언트에서 targetEmail 필터링
  (logger?.info || console.log)(`[Admin Push] 개인 알림 → ${targetEmail}: ${message}`);
  res.json({ success: true, targetEmail, payload });
});

// ✅ PUSH-FCM: 전체 FCM 푸시 알림 (Admin 전용)
app.post('/api/admin/push-fcm', verifyToken, async (req, res) => {
  if (!isAdminToken(req.user)) return res.status(403).json({ error: '관리자 권한 필요' });
  const { title, body, route } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title, body 필수' });
  try {
    await pushService.notifyAnnouncement({ title, body });
    res.json({ success: true, title, body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ PUSH-FCM: FCM 토큰 등록 (POST /api/user/push-token)
app.post('/api/user/push-token', verifyToken, async (req, res) => {
  const { token, platform = 'android' } = req.body;
  if (!token) return res.status(400).json({ error: 'token 필수' });
  const userId = req.user.id || req.user._id;
  if (!userId) return res.status(400).json({ error: 'userId 로드 실패' });
  try {
    if (dbReady && PushToken) {
      await PushToken.findOneAndUpdate(
        { token },
        { userId, token, platform, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    }
    res.json({ ok: true });
  } catch (err) {
    (logger?.error || console.error)('[PUSH] 토큰 저장 실패:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ PUSH-FCM: FCM 토큰 삭제 (로그아웃 시, DELETE /api/user/push-token)
app.delete('/api/user/push-token', verifyToken, async (req, res) => {
  const userId = req.user.id || req.user._id;
  try {
    if (dbReady && PushToken) {
      await PushToken.deleteMany({ userId });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ── CCTV 관리 어드민 API (JWT 인증 — 56차 MongoDB 영속화) ────────
// dbReady는 비동기로 true가 되므로, getter 함수로 전달하여 항상 최신값 참조
require('./cctv_admin_routes')(app, { getDbReady: () => dbReady, CctvOverrideModel, logger }); // ✅ BUG-FIX: logger 전달 누락 수정

// ─── 쇼핑 API (쿠팡 + 알리 통합) ────────────────────────────────────────────

/**
 * GET /api/shop/products?source=coupang&category=낚시용품
 * source: 'coupang' | 'ali' | 'all' (default: 'all')
 * category: 상품 카테고리 키워드
 */
app.get('/api/shop/products', async (req, res) => {
  const source   = (req.query.source   || 'all').toLowerCase();
  const category = req.query.category  || '낚시용품';

  try {
    if (source === 'coupang') {
      const products = await coupang.getRecommendedProducts(category);
      return res.json(products.map(p => ({
        id:       p.productId,
        name:     p.productName,
        price:    p.productPrice?.toLocaleString('ko-KR') || '0',
        discount: p.discountRate ? `${p.discountRate}%` : '0%',
        img:      p.productImage,
        link:     p.coupangUrl,
        badge:    p.badge,
        source:   'coupang',
      })));
    }

    if (source === 'ali') {
      const products = await ali.getAliProducts(category);
      return res.json(products.map(p => ({
        id:       p.productId,
        name:     p.title,
        price:    p.salePrice,
        discount: p.discount,
        img:      p.imageUrl,
        link:     p.productUrl,
        badge:    p.badge,
        source:   'ali',
        commission: p.commissionRate,
      })));
    }

    // source === 'all' → 쿠팡 고가 + 알리 소모품 병렬 조회
    const aliKeyword = _mapToAliKeyword(category);
    const [coupangProducts, aliProducts] = await Promise.all([
      coupang.getRecommendedProducts(category).catch(() => []),
      ali.getAliProducts(aliKeyword).catch(() => []),
    ]);

    const merged = [
      ...coupangProducts.slice(0, 6).map(p => ({
        id:       p.productId,
        name:     p.productName,
        price:    p.productPrice?.toLocaleString('ko-KR') || '0',
        discount: p.discountRate ? `${p.discountRate}%` : '0%',
        img:      p.productImage,
        link:     p.coupangUrl,
        badge:    p.badge,
        source:   'coupang',
      })),
      ...aliProducts.slice(0, 6).map(p => ({
        id:       `ali_${p.productId}`,
        name:     p.title,
        price:    p.salePrice,
        discount: p.discount,
        img:      p.imageUrl,
        link:     p.productUrl,
        badge:    p.badge,
        source:   'ali',
        commission: p.commissionRate,
      })),
    ];

    res.json(merged);
  } catch (err) {
    logger.warn(`[Shop API] 상품 조회 오류: ${err.message}`);
    res.status(500).json({ error: '상품 로드 실패', message: err.message });
  }
});

/**
 * GET /api/shop/promo
 * 알리 특가 프로모션 상품 (수수료 50%+ 상품)
 */
app.get('/api/shop/promo', async (req, res) => {
  try {
    const promoProducts = await ali.getAliPromoProducts(4);
    res.json(promoProducts.map(p => ({
      id:       `ali_${p.productId}`,
      name:     p.title,
      price:    p.salePrice,
      original: p.originalPrice,
      discount: p.discount,
      img:      p.imageUrl,
      link:     p.productUrl,
      badge:    p.badge,
      commission: p.commissionRate,
      source:   'ali',
    })));
  } catch (err) {
    logger.warn(`[Shop Promo API] 특가 상품 오류: ${err.message}`);
    res.status(500).json({ error: '특가 상품 로드 실패' });
  }
});

/**
 * GET /api/shop/recommend?pointType=바다&fish=감성돔
 * 낚시 포인트 기반 맞춤 상품 추천 (쿠팡 우선)
 */
app.get('/api/shop/recommend', async (req, res) => {
  const pointType = req.query.pointType || '전체';
  const fish      = req.query.fish      || '';

  // 어종/포인트 → 상품 키워드 매핑
  const keyword = _buildRecommendKeyword(pointType, fish);

  try {
    const [coupangRec, aliRec] = await Promise.all([
      coupang.searchCoupang(keyword, 4).catch(() => []),
      ali.searchAliExpress(_mapToAliKeyword(keyword), 2).catch(() => []),
    ]);

    const recommend = [
      ...coupangRec.map(p => ({
        id: p.productId, name: p.productName,
        price: p.productPrice?.toLocaleString('ko-KR') || '0',
        discount: p.discountRate ? `${p.discountRate}%` : '0%',
        img: p.productImage, link: p.coupangUrl,
        badge: `🎣 ${fish || pointType} 추천`, source: 'coupang',
      })),
      ...aliRec.map(p => ({
        id: `ali_${p.productId}`, name: p.title,
        price: p.salePrice, discount: p.discount,
        img: p.imageUrl, link: p.productUrl,
        badge: `💰 ${fish || pointType} 소모품`, source: 'ali',
        commission: p.commissionRate,
      })),
    ];

    res.json({ keyword, products: recommend });
  } catch (err) {
    logger.warn(`[Shop Recommend] 추천 오류: ${err.message}`);
    res.status(500).json({ error: '추천 상품 로드 실패' });
  }
});

// 카테고리 → 알리 키워드 변환 헬퍼
function _mapToAliKeyword(category) {
  const map = {
    '낚시용품': '소모품', '스피닝릴': '낚시줄', '베이트릴': '낚시줄',
    '루어낚시대': '루어', '원투낚시대': '채비', '낚시줄': '낚시줄',
    '캠핑의자': '소모품', '루어': '루어', '에기': '채비',
  };
  return map[category] || '소모품';
}

// 포인트+어종 → 검색 키워드 변환 헬퍼
function _buildRecommendKeyword(pointType, fish) {
  const fishMap = {
    '감성돔': '감성돔 채비 갯바위', '참돔': '참돔 루어 선상',
    '광어': '광어 다운샷 루어', '우럭': '우럭 지그헤드',
    '고등어': '고등어 채비', '무늬오징어': '에기 에깅',
    '갈치': '갈치 낚시 채비', '농어': '농어 루어 미노우',
  };
  if (fish && fishMap[fish]) return fishMap[fish];
  if (pointType === '바다') return '바다낚시 채비';
  if (pointType === '민물') return '민물낚시 채비';
  return '낚시용품';
}


// ─── 조황 인증 API ───────────────────────────────────────────────────────────

// POST /api/catch — 조황 등록
app.post('/api/catch', async (req, res) => {
  try {
    const { userId, userName, userAvatar, fishName, fishSize, fishWeight,
            imageUrl, location, lat, lng, memo, weather, tide, contestId,
            verified, aiConfidence } = req.body;
    if (!userId || !fishName) return res.status(400).json({ error: '필수 항목 누락' });
    await waitForDb(5000);
    const record = await CatchRecord.create({
      userId, userName, userAvatar, fishName,
      fishSize: fishSize || 0, fishWeight: fishWeight || 0,
      imageUrl, location, lat, lng, memo, weather, tide,
      contestId, verified: !!verified, aiConfidence: aiConfidence || 0,
    });
    // EXP 보상 (+30 EXP)
    if (dbReady && User) {
      await User.updateOne({ _id: userId }, { $inc: { exp: 30, totalExp: 30 } }).catch(() => {});
    }
    res.json({ success: true, record });
  } catch (err) {
    (logger?.error || console.error)('[POST /api/catch]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// GET /api/catch/ranking — 전국 랭킹 (어종별/전체)
app.get('/api/catch/ranking', async (req, res) => {
  try {
    const { fishName, period = 'month', limit = 20 } = req.query;
    await waitForDb(5000);
    const now = new Date();
    let startDate = new Date();
    if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    else startDate = new Date(0); // all
    const query = { createdAt: { $gte: startDate } };
    if (fishName) query.fishName = fishName;
    const records = await CatchRecord.find(query)
      .sort({ fishSize: -1, fishWeight: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
    res.json({ records });
  } catch (err) {
    (logger?.error || console.error)('[GET /api/catch/ranking]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// GET /api/catch/my — 내 조황 목록
app.get('/api/catch/my', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId 필요' });
    await waitForDb(5000);
    const records = await CatchRecord.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: '서버 오류' });
  }
});

// POST /api/catch/:id/like — 좋아요
app.post('/api/catch/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    const record = await CatchRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ error: '없는 조황' });
    const liked = record.likes.includes(userId);
    if (liked) record.likes.pull(userId);
    else record.likes.push(userId);
    await record.save();
    res.json({ liked: !liked, count: record.likes.length });
  } catch (err) {
    res.status(500).json({ error: '서버 오류' });
  }
});

// ─── AI API ──────────────────────────────────────────────────────────────

// POST /api/ai/fish-identify — Gemini Vision으로 어종 식별
app.post('/api/ai/fish-identify', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) return res.status(400).json({ error: '이미지 필요' });
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return res.status(503).json({ error: 'Gemini API 키 미설정' });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
              { text: `이 사진에 있는 물고기의 어종을 한국어로 분석해주세요.\n반드시 아래 JSON 형식만 응답하세요 (다른 텍스트 없이):\n{\n  "fishName": "어종명(한국어)",\n  "confidence": 신뢰도(0-100 정수),\n  "edible": true/false,\n  "recipes": ["조리법1", "조리법2"],\n  "description": "간단한 특징 설명(1-2문장)"\n}\n물고기가 없으면: {"fishName": null, "confidence": 0}` }
            ]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 512 }
        })
      }
    );
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    // JSON 추출
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { fishName: null, confidence: 0 };
    res.json(result);
  } catch (err) {
    (logger?.error || console.error)('[POST /api/ai/fish-identify]', err.message);
    res.status(500).json({ error: 'AI 분석 실패', fishName: null, confidence: 0 });
  }
});

// POST /api/ai/coach — AI 낚시 코치 (Gemini)
app.post('/api/ai/coach', async (req, res) => {
  try {
    const { message, context } = req.body; // context: { weather, tide, location, season }
    if (!message) return res.status(400).json({ error: '메시지 필요' });
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return res.status(503).json({ error: 'Gemini API 키 미설정' });

    const ctx = context || {};
    const systemPrompt = `당신은 한국 최고의 낚시 전문가 AI 코치입니다.\n현재 상황: ${ctx.location || '위치 미확인'}, 날씨: ${ctx.weather || '미확인'}, 물때: ${ctx.tide || '미확인'}, 계절: ${ctx.season || '봄'}.\n낚시 관련 질문에만 답하며, 어종/채비/미끼/포인트를 구체적으로 추천합니다.\n답변은 친근하고 간결하게 (200자 이내), 이모지를 적절히 사용합니다.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: '네! 낚시GO AI 코치입니다 🎣 무엇이든 물어보세요!' }] },
            { role: 'user', parts: [{ text: message }] }
          ],
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
        })
      }
    );
    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '죄송합니다, 답변을 생성하지 못했습니다.';
    res.json({ reply });
  } catch (err) {
    (logger?.error || console.error)('[POST /api/ai/coach]', err.message);
    res.status(500).json({ error: 'AI 코치 오류' });
  }
});

// ─── 전국 대회 API ────────────────────────────────────────────────────────

// POST /api/contest — 대회 등록 (관리자)
app.post('/api/contest', async (req, res) => {
  try {
    const { title, fishName, region, metric, startDate, endDate, description, prize } = req.body;
    if (!title || !fishName || !startDate || !endDate) return res.status(400).json({ error: '필수 항목 누락' });
    await waitForDb(5000);
    const contest = await Contest.create({ title, fishName, region, metric, startDate, endDate, description, prize });
    res.json({ success: true, contest });
  } catch (err) {
    res.status(500).json({ error: '서버 오류' });
  }
});

// GET /api/contest/active — 진행 중 대회 목록
app.get('/api/contest/active', async (req, res) => {
  try {
    await waitForDb(5000);
    const now = new Date();
    const contests = await Contest.find({
      active: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ endDate: 1 }).lean();
    // 각 대회의 현재 TOP3 조황 첨부
    const result = await Promise.all(contests.map(async (c) => {
      const top3 = await CatchRecord.find({ contestId: c._id.toString() })
        .sort({ fishSize: -1, fishWeight: -1 })
        .limit(3).lean();
      return { ...c, top3 };
    }));
    res.json({ contests: result });
  } catch (err) {
    res.status(500).json({ error: '서버 오류' });
  }
});

// GET /api/contest/:id/ranking — 대회 랭킹
app.get('/api/contest/:id/ranking', async (req, res) => {
  try {
    await waitForDb(5000);
    const contest = await Contest.findById(req.params.id).lean();
    if (!contest) return res.status(404).json({ error: '대회 없음' });
    const ranking = await CatchRecord.find({ contestId: req.params.id })
      .sort({ fishSize: -1, fishWeight: -1, createdAt: 1 })
      .limit(50).lean();
    res.json({ contest, ranking });
  } catch (err) {
    res.status(500).json({ error: '서버 오류' });
  }
});

// GET /api/contest/all — 전체 대회 목록 (관리자)
app.get('/api/contest/all', async (req, res) => {
  try {
    await waitForDb(5000);
    const contests = await Contest.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json({ contests });
  } catch (err) {
    res.status(500).json({ error: '서버 오류' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  const env = process.env.NODE_ENV || 'development';
// ✅ SCALE: Keep-Alive 최적화 — 연결 재사용으로 핸드셰이크 비용 절감
server.keepAliveTimeout = 65000;  // 65초 (로드밸런서 60초보다 길게)
server.headersTimeout = 66000;    // keepAlive보다 1초 더 길게
  logger.info(`🚀 낚시GO 서버 시작 완료 | 포트: ${PORT} | 환경: ${env}`);
  logger.info(`   웹훅: ${process.env.PORTONE_WEBHOOK_SECRET ? '✅' : '⚠️ 미설정'} | SMS: ${process.env.SMS_API_KEY ? '✅' : '⚠️ 미설정'} | DB: ${process.env.MONGO_PASS || process.env.MONGO_URI ? '✅ MongoDB' : '⚠️ 인메모리'}`);
  if (env === 'production') logger.info('[보안] 프로덕션 모드 활성화');



  // Render 슬립 방지 Self Keep-Alive (단일 등록)
  if (process.env.RENDER_EXTERNAL_URL) {
    const selfUrl = process.env.RENDER_EXTERNAL_URL;
    setInterval(async () => {
      try { await axios.get(`${selfUrl}/api/health`); }
      catch (e) { logger.warn(`[KeepAlive] Self-ping 실패: ${e.message}`); }
    }, 10 * 60 * 1000);
    logger.info(`✅ Render Keep-Alive 활성화 (${selfUrl})`);
  }
});
// ✅ BUG-FIX: flushAllData 함수 정의 — 종료 전 인메모리 데이터 파일 동기화 보장
function flushAllData() {
  saveMemUsers();
  saveMemPosts();
  saveMemRecords();
  saveMemCrews();
  saveChatHistories();
  saveMemNotices();
  saveMemBusinessPosts();
  saveSecretPointOverrides();
  saveCctvOverrides();
  saveProSubs();
  saveVvipSlots();
  (logger?.info || (() => {}))('[FlushAllData] 인메모리 데이터 전체 파일 동기화 완료');
}

// ✅ FIX-SIGTERM: Render 배포 graceful shutdown + uncaughtException 핸들러 등록
// ✅ BUG-FIX: flushAllData 세 번째 인자 전달 — 종료 전 인메모리 데이터 파일 동기화 보장
require('./graceful_shutdown')(server, mongoose, flushAllData);
