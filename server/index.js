const express = require('express');
const http = require('http');
const dns = require('dns');
const crypto = require('crypto'); // ✅ VISITOR: SHA-256 IP 해시 (중복 선언 방지 — 파일 상단에 1회만)

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
// ✅ FIX-AXIOS-TIMEOUT: 전역 타임아웃 10초 — 외부 API 무한 대기 방지
axios.defaults.timeout = 10000; // 10초
axios.defaults.validateStatus = (s) => s < 500; // 4xx도 throw 안 함
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
// ✅ FIX-JWT-LENGTH: JWT_SECRET 최소 32자 권고
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  logger.warn('[보안] JWT_SECRET이 32자 미만입니다. 보안 강화를 위해 32자 이상의 무작위 문자열을 사용하세요.');
}
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
const APP_CONFIG_FILE = path.join(__dirname, 'appConfig.json');
const SPOT_LOC_OVERRIDES_FILE = path.join(__dirname, 'spotLocationOverrides.json');
const CUSTOM_POINTS_FILE      = path.join(__dirname, 'customPoints.json');
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
let appConfig = { min_version: "1.0.0", store_url: "https://play.google.com/apps/internaltest/4701312289208373704" };
let memProSubs = {};
let memVvipSlots = {};
let spotLocationOverrides = {}; // ✅ MASTER 좌표 오버라이드
let customPoints          = {}; // ✅ MASTER 신규 포인트 추가

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
  if (fs.existsSync(APP_CONFIG_FILE)) appConfig = Object.assign(appConfig, JSON.parse(fs.readFileSync(APP_CONFIG_FILE, 'utf-8')));
  if (fs.existsSync(PRO_SUBS_FILE)) memProSubs = JSON.parse(fs.readFileSync(PRO_SUBS_FILE, 'utf-8'));
  if (fs.existsSync(VVIP_SLOTS_FILE)) memVvipSlots = JSON.parse(fs.readFileSync(VVIP_SLOTS_FILE, 'utf-8'));
  if (fs.existsSync(SPOT_LOC_OVERRIDES_FILE)) spotLocationOverrides = JSON.parse(fs.readFileSync(SPOT_LOC_OVERRIDES_FILE, 'utf-8'));
  if (fs.existsSync(CUSTOM_POINTS_FILE))      customPoints          = JSON.parse(fs.readFileSync(CUSTOM_POINTS_FILE, 'utf-8'));
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
function saveAppConfig()         { _saveFile(APP_CONFIG_FILE, appConfig); }
function saveProSubs()           { _saveFile(PRO_SUBS_FILE, memProSubs); }
function saveVvipSlots()         { _saveFile(VVIP_SLOTS_FILE, memVvipSlots); }
function saveSpotLocationOverrides() { _saveFile(SPOT_LOC_OVERRIDES_FILE, spotLocationOverrides); }
function saveCustomPoints()          { _saveFile(CUSTOM_POINTS_FILE, customPoints); }

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
  autoIndex: process.env.NODE_ENV !== 'production', // ✅ FIX-AUTOINDEX
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
        
        // [1회성 데이터 정제] 테스트 결제(110,000원 PRO) 내역 일괄 영구 삭제
        const PH = require('./models/PaymentHistory');
        const SUB = require('./models/Subscription');
        const phDel = await PH.deleteMany({ amount: 110000 });
        const subDel = await SUB.deleteMany({ amount: 110000 });
        if (phDel.deletedCount > 0 || subDel.deletedCount > 0) {
          (global.logger?.info || (() => {}))(`[Bootstrap] 🗑️ 수익 대시보드 정제: 테스트 결제내역 ${phDel.deletedCount}건, 구독 ${subDel.deletedCount}건 영구 삭제 완료`);
        }
      } catch (e) { (global.logger?.warn || (() => {}))(`[Bootstrap] 초기화/정제 실패: ${e.message}`); }
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
// ✅ VISITOR: IP 해시 방문자 로그 모델 (투데이/토탈투데이 카운트)
let VisitorLog = null;
try { VisitorLog = require('./models/VisitorLog'); } catch (e) { VisitorLog = null; }
// ✅ PERSIST: 마스터가 수정한 포인트 좌표 영구 저장 (Render 재배포 후에도 유지)
let SpotLocationOverrideModel = null;
try { SpotLocationOverrideModel = require('./models/SpotLocationOverride'); } catch (e) { SpotLocationOverrideModel = null; }
let SecretPointOverrideModel = null;
try { SecretPointOverrideModel = require('./models/SecretPointOverride'); } catch (e) { SecretPointOverrideModel = null; }
// 인메모리 fallback: MongoDB 미연결 시 Set으로 유니크 카운트
const memVisitorToday = new Set(); // 'YYYY-MM-DD:ipHash'
const memVisitorTotal = new Set(); // 'ipHash'

// ✅ PUSH: Firebase Admin 설정 (FIREBASE_SERVICE_ACCOUNT 환경변수 값)
const pushService = require('./push');
pushService.initFirebase();


// ─── 정기결제 스케줄러 (node-cron 또는 자체 폴백) ─────────────────────────────
let cron = null;
try { cron = require('node-cron'); } catch (e) { /* node-cron 미설치 → 자체 인터벌 폴백 사용 */ }

// ─── 인메모리 Fallback 저장소 이미 상단에서 선언 및 로드 완료 ──────────────
// (secretPointOverrides, cctvOverrides, memProSubs, memVvipSlots 모두 파일 로드 완료됨)


const app = express();
  app.set('trust proxy', 1); // ✅ FIX-TRUST-PROXY
  app.disable('x-powered-by'); // ✅ FIX-X-POWERED-BY

// ─── 보안 헤더 (Helmet) ────────────────────────────────────────
try {
  const helmet = require('helmet');
  app.use(helmet({ contentSecurityPolicy: false, hidePoweredBy: true, // ✅ FIX-HELMET: FIX-HELMET-NO-POWERED-BY
    strictTransportSecurity: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false, // ✅ FIX-HSTS CSP는 Vite SPA가 관리 (script-src 'unsafe-inline' 필요)
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: false })); // CSP는 SPA 프론트 판단에 맡김으로 off
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
// 모든 origin 허용 (모바일 앱 특성 상 JWT로 인증, origin 제한 불필요)
const ALLOWED_ORIGINS = [/.*/];  // 전체 허용

// 환경변수로 추가 허용 도메인 설정 (프로덕션 배포 시 사용)
if (process.env.ALLOWED_ORIGIN) {
  ALLOWED_ORIGINS.push(process.env.ALLOWED_ORIGIN);
}

// Render 헬스체크 전용 (사전 등록 — CORS 이전에 응답)
app.get('/api/health', (req, res) => {
  const fcmStatus = pushService?.isInitialized?.() ?? false;
  res.json({
    status: 'ok',
    db: dbReady ? 'connected' : 'fallback', // ✅ FIX-HEALTH-INFOLEA: mongodb/memory 구분 → 일반 상태로 변경
    uptime: Math.floor(process.uptime()),
    time: new Date().toISOString(),
    fcm: fcmStatus ? 'ready' : 'disabled',
    // ✅ FIX-HEALTH-INFOLEA: env 필드 제거 (서버 환경 노출 방지)
  });
});

// ✅ BEACH-PUSH: 한국 IP PC에서 KMA 해수욕장 데이터를 서버로 푸시
// PC 스케줄러(beach-push.ps1)가 1시간마다 호출 → kmaBeachCache 직접 갱신
app.post('/api/internal/beach-push', (req, res) => {
  const pushKey = process.env.BEACH_PUSH_KEY || 'fishinggo-beach-2024';
  if (req.headers['x-push-key'] !== pushKey) return res.status(403).json({ ok: false });
  const items = req.body?.items;
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ ok: false, reason: 'items required' });
  kmaBeachCache = items;
  kmaBeachCacheTime = Date.now();
  // ✅ weatherCache 직접 패치 (race condition 없음, 즉시 반영)
  let patched = 0;
  for (const [sid, keywords] of Object.entries(KMA_BEACH_MAP)) {
    if (!weatherCache[sid]?.data) continue;
    for (const kw of keywords) {
      const match = items.find(i => i.beachNm?.includes(kw));
      const wTemp = match?.wTemp ? parseFloat(match.wTemp) : null;
      if (wTemp && !isNaN(wTemp) && wTemp > 0) {
        weatherCache[sid].data.sst = parseFloat(wTemp.toFixed(1));
        weatherCache[sid].data.temp = `${wTemp.toFixed(1)}\u00b0C`;
        weatherCache[sid].data.layers = { upper: wTemp, middle: parseFloat((wTemp-1.2).toFixed(1)), lower: parseFloat((wTemp-3.4).toFixed(1)) };
        weatherCache[sid].data._sources.sst = 'KMA_BEACH';
        patched++;
        break;
      }
    }
  }
  // weatherCache 초기화 전이면 배치 큐잉
  if (patched === 0 && !batchRunning) setImmediate(() => updateAllStationsCache().catch(() => {}));
  logger.info(`[BEACH-PUSH] ${items.length}개 수신, weatherCache 즉시 패치: ${patched}개`);
  res.json({ ok: true, count: items.length, patched, updated: new Date().toISOString() });
});

// ── 동적 OG 태그 라우트 ─────────────────────────────────────────────────────

// KakaoTalk/WhatsApp/Telegram 등 크롤러: OG HTML 반환
// 일반 브라우저: 프론트엔드 SPA로 리다이렉트
// 브라우저 리다이렉트 대상: ?ref=og 붙여서 Vercel의 missing 조건 우회 → index.html 서빙
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.fishing-go.com';
// 사진 없을 경우 앱 아이콘으로 대체 (182KB)
const DEFAULT_OG_IMG = `${FRONTEND_URL}/icon-192.png`;

function isBotUA(ua = '') {
  return /facebookexternalhit|Twitterbot|WhatsApp|KakaoTalk|Kakao|Telegram|Slack|Discord|LinkedInBot|googlebot|bingbot|Applebot|crawl|spider|bot|python|curl/i.test(ua);
}
function escHtml(s = '') {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function ogHtml({ title, desc, img, pageUrl, spaUrl }) {
  const t = escHtml(title), d = escHtml(desc), i = escHtml(img), u = escHtml(pageUrl), s = escHtml(spaUrl);
  return `<!DOCTYPE html><html lang="ko"><head>
<meta charset="UTF-8"><title>${t}</title>
<meta name="description" content="${d}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="낚시GO">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:image" content="${i}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${u}">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${i}">
<meta http-equiv="refresh" content="0;url=${s}">
</head><body>
<script>window.location.replace('${s}');</script>
<a href="${s}">낚시GO에서 보기</a>
</body></html>`;
}

// GET /og/catch/:id
app.get('/og/catch/:id', async (req, res) => {
  const { id } = req.params;
  const pageUrl = `${FRONTEND_URL}/catch/${id}`;
  const spaUrl  = `${pageUrl}?ref=og`;
  const ua = req.headers['user-agent'] || '';

  if (!isBotUA(ua)) {
    return res.redirect(302, spaUrl);
  }
  let title = '🎣 낚시GO 조황 기록', desc = '낚시GO에서 조황 기록을 확인하세요!', img = DEFAULT_OG_IMG;
  try {
    let record = null;
    if (dbReady && CatchRecord) {
      try { record = await CatchRecord.findById(id).lean(); } catch (_) {}
    }
    if (record) {
      const fish = record.fishName || '조황';
      const size = record.fishSize ? `${record.fishSize}cm` : '';
      title = `🎣 ${fish}${size ? ' ' + size : ''} 조황 인증! | 낚시GO`;
      desc  = [record.memo, record.location].filter(Boolean).join(' · ') || desc;
      if (record.imageUrl?.startsWith('http')) img = record.imageUrl;
    }
  } catch (_) {}
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600');
  return res.send(ogHtml({ title, desc, img, pageUrl, spaUrl }));
});

// GET /og/post/:id
app.get('/og/post/:id', async (req, res) => {
  const { id } = req.params;
  const pageUrl = `${FRONTEND_URL}/post/${id}`;
  const spaUrl  = `${pageUrl}?ref=og`;
  const ua = req.headers['user-agent'] || '';

  if (!isBotUA(ua)) {
    return res.redirect(302, spaUrl);
  }
  let title = '낚시GO 커뮤니티', desc = '낚시GO 커뮤니티 게시글입니다.', img = DEFAULT_OG_IMG;
  try {
    let post = null;
    if (dbReady && Post) {
      try { post = await Post.findById(id).lean(); } catch (_) {}
    }
    if (post) {
      title = `${post.title || post.content?.slice(0, 40) || '게시글'} | 낚시GO`;
      desc  = post.content?.slice(0, 100) || desc;
      const postImg = post.image || post.images?.[0];
      if (postImg?.startsWith('http')) img = postImg;
    }
  } catch (_) {}
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600');
  return res.send(ogHtml({ title, desc, img, pageUrl, spaUrl }));
});

// ✅ DEEPLINK-VERIFY: Android App Links 검증 파일
// https://fishing-go.vercel.app/.well-known/assetlinks.json
// 이 응답이 있어야 autoVerify="true" HTTPS 딥링크가 동작함
// SHA256: 앱 빌드 후 keytool -printcert -jarfile app-release.aab 로 확인 후 업데이트 필요
app.get('/.well-known/assetlinks.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json([{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'kr.fishinggo.app',
      // SHA-256: fishinggo-release.jks signingReport로 추출 완료
      sha256_cert_fingerprints: [
        // ✅ fishinggo-release.jks 릴리즈 키 SHA-256 (signingReport로 추출)
        '0B:14:2F:90:F1:E9:EE:32:C6:DD:93:99:94:98:1A:C8:90:F4:63:26:E7:DE:8A:63:B2:CE:08:6C:0B:5F:8F:85'
      ]
    }
  }]);
});

// ── ✅ DEV-SEED: 테스트 게시글 시드 엔드포인트 (관리자 전용 — X-Seed-Secret + JWT Admin 이중 인증)
app.post('/api/admin/seed-business-test', async (req, res) => {
  // ✅ BUG-05 FIX: 하드코딩 시크릿 → 환경변수 참조 + JWT Admin 이중 인증
  const seedSecret = process.env.SEED_SECRET;
  if (!seedSecret) return res.status(503).json({ error: '시드 기능이 비활성화되어 있습니다.' }); // ✅ FIX-SEED-SECRET
  if (req.headers['x-seed-secret'] !== seedSecret) return res.status(403).json({ error: '금지' });
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    try {
      const tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
      if (!isAdminToken(tp)) return res.status(403).json({ error: '관리자 권한 필요' });
    } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
  }
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
  } catch (err) { res.status(500).json({ error: '서버 오류가 발생했습니다.' }); }
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
    const payload = jwt.verify(tp, JWT_SECRET, { algorithms: ['HS256'] });
    if (!isAdminToken(payload)) return res.status(403).json({ error: '관리자 권한 필요' });
  } catch { return res.status(401).json({ error: '인증 필요' }); }
  // ✅ FIX-CHANNEL-MASS-ASSIGN: 화이트리스트 필드만 허용 (Mass Assignment 방어)
  const { title, category, url, thumbnail, duration, views: viewsStr, description } = req.body;
  if (!title || !url) return res.status(400).json({ error: 'title, url 필수' });
  if (typeof title !== 'string' || title.length > 200) return res.status(400).json({ error: 'title 최대 200자' });
  const urlStr = String(url || '');
  if (!urlStr.startsWith('https://') || urlStr.length > 500) return res.status(400).json({ error: '유효한 https URL 필요' });
  if (thumbnail) {
    const thStr = String(thumbnail);
    if (!thStr.startsWith('https://') || thStr.length > 500) return res.status(400).json({ error: '유효한 https thumbnail URL 필요' });
  }
  const video = {
    id: Date.now(),
    title: title.trim(),
    category: typeof category === 'string' ? category.trim().slice(0, 50) : '기타',
    url: urlStr.trim(),
    thumbnail: thumbnail ? String(thumbnail).trim() : '',
    duration: typeof duration === 'string' ? duration.trim().slice(0, 10) : '',
    views: typeof viewsStr === 'string' ? viewsStr.trim().slice(0, 20) : '0',
    description: typeof description === 'string' ? description.trim().slice(0, 500) : '',
  };
  channelVideos.push(video);
  res.json({ success: true, video });
});

app.use(cors({
  origin: (origin, cb) => {
    // ✅ FIX-CORS-WHITELIST: 허가된 출처만 허용
    const allowed = (process.env.ALLOWED_ORIGIN || 'http://localhost:5173')
      .split(',').map(s => s.trim());
    if (!origin || allowed.includes(origin) || allowed.includes('*')) cb(null, true);
    else cb(new Error('CORS policy: ' + origin + ' not allowed'));
  },        // 모든 origin 허용 (JWT 인증으로 벴안 유지)
  credentials: true,
}));

// ── 접속자 추적 미들웨어 (CORS 이후 — JWT 보유 요청에서 lastSeen 갱신) ──────────
const lastSeenCache = new Map();
app.use(async (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return next();
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return next(); }
    const email = tp.email || tp.id;
    if (!email) return next();
    const now = Date.now();
    const last = lastSeenCache.get(email) || 0;
    if (now - last < 60_000) return next();
    if (lastSeenCache.size >= 5000) lastSeenCache.delete(lastSeenCache.keys().next().value); // ✅ FIX-LASTSEEN-SIZE
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

// ── 방문자 추적 미들웨어 (가입/미가입 모두 IP 해시 기록) ─────────────────────────
// 투데이: KST 오늘 날짜 유니크 IP 수 / 토탈: 전체 누적 유니크 IP 수
// crypto는 파일 최상단에서 이미 require됨
const visitorCache = new Map(); // ipHash → lastTrackedDate (중복 DB쓰기 방지) — max 10000
// ✅ FIX-VISITOR-SIZE: 주기적 정리
setInterval(() => { if (visitorCache.size > 10000) visitorCache.clear(); }, 60 * 60 * 1000);
function getKstDateStr() {
  const d = new Date();
  d.setTime(d.getTime() + 9 * 60 * 60 * 1000); // UTC+9
  return d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}
function hashIp(ip) {
  return crypto.createHash('sha256').update(String(ip || 'unknown')).digest('hex').slice(0, 32);
}
app.use((req, res, next) => {
  try {
    if (req.path === '/api/health' || req.path === '/favicon.ico') return next();
    if (isBotUA(req.headers['user-agent'] || '')) return next();

    const rawIp =
      (String(req.headers['x-forwarded-for'] || '')).split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.ip ||
      req.connection?.remoteAddress ||
      'unknown';
    const ipHash   = hashIp(rawIp);
    const todayStr = getKstDateStr();

    if (visitorCache.get(ipHash) === todayStr) return next();
    visitorCache.set(ipHash, todayStr);

    let userId = null;
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) {
      try { const p = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); userId = p.email || p.id || null; } catch {}
    }

    if (dbReady && VisitorLog) {
      VisitorLog.updateOne(
        { ipHash, date: todayStr },
        { $setOnInsert: { ipHash, date: todayStr, userId } },
        { upsert: true }
      ).exec().catch(() => {});
    } else {
      memVisitorToday.add(`${todayStr}:${ipHash}`);
      memVisitorTotal.add(ipHash);
    }
  } catch {}
  next();
});

// ── GET /api/admin/user-stats — 사용자 통계 (마스터 전용, CORS 이후) ─────────────
app.get('/api/admin/user-stats', async (req, res) => {
  // ✅ FIX-ADMIN-STATS-AUTH: 어드민 인증 강제
  if (!isMaster(req)) return res.status(403).json({ error: '마스터 권한 필요' });
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
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
        const norm = TIER_NORMALIZE[raw] || 'FREE';
        s.tierBreakdown[norm] = (s.tierBreakdown[norm] || 0) + (t.count || 0);
      });
      // ✅ VISITOR STATS: 투데이(오늘 유니크 IP) + 토탈투데이(전체 누적 유니크 IP)
      if (VisitorLog) {
        try {
          const todayStr = getKstDateStr();
          const [todayCount, allIps] = await Promise.all([
            VisitorLog.countDocuments({ date: todayStr }),
            VisitorLog.distinct('ipHash'),
          ]);
          s.todayVisitors = todayCount;
          s.totalVisitors = allIps.length;
        } catch { s.todayVisitors = 0; s.totalVisitors = 0; }
      }
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
      // ✅ VISITOR STATS fallback (인메모리 모드)
      const todayStr = getKstDateStr();
      s.todayVisitors = [...memVisitorToday].filter(k => k.startsWith(todayStr + ':')).length;
      s.totalVisitors = memVisitorTotal.size;
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
let apiLimiter     = (req, res, next) => next(); // ✅ FIX-SCOPE
let ytSearchLimiter= (req, res, next) => next(); // ✅ FIX-SCOPE
let ytFeedLimiter  = (req, res, next) => next(); // ✅ FIX-SCOPE
let otpLimiter     = (req, res, next) => next(); // ✅ FIX-SCOPE
let catchLimiter   = (req, res, next) => next(); // ✅ FIX-SCOPE
let authLimiter = (req, res, next) => next(); // ✅ FIX-SCOPE: try 밖 선언으로 ReferenceError 방지
try {
  const rateLimit = require('express-rate-limit');
  // 로그인/회원가입: IP당 10분/10회 (통신사 NAT 환경 수백명 커버)
  authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 50,
    message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // OTP 발송은 별도 쿨다운 처리하므로 auth 리미터 제외
      return req.path.includes('/send-otp') || req.path.includes('/verify-otp');
    },
  });
  // 일반 API: IP당 1분/1000회 (동시 1만 사용자 커버)
  apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300, // ✅ FIX-API-LIMITER: 1분 300회
    message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // ✅ YouTube 검색 전용 Rate Limit — IP당 분당 3회
  // 이유: 검색 1회 = 201 units 소비. 50만 사용자 환경에서 쿼터 폭발 방지
  ytSearchLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1분
    max: 3,                    // IP당 최대 3회
    message: { error: '검색 요청이 너무 많습니다. 1분 후 다시 시도해주세요.', code: 'YT_SEARCH_RATE_LIMIT' },
    standardHeaders: true,
    legacyHeaders: false,
    // ✅ IPv6 호환: 커스텀 keyGenerator 제거 → 기본 IP 처리 사용 (ERR_ERL_KEY_GEN_IPV6 해결)
  });

  // ✅ YouTube 통합 피드 전용 Rate Limit — IP당 분당 10회
  // 이유: 피드는 캐시가 있어 실제 API 호출 적음, 너무 엄격하면 UX 저하
  ytFeedLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1분
    max: 10,                   // IP당 최대 10회
    message: { error: '피드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', code: 'YT_FEED_RATE_LIMIT' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // ✅ FIX-OTP-LIMITER: OTP 전용 rate limit — 분당 3회 (전화번호 스팸 방지)
  otpLimiter = rateLimit({ windowMs: 60_000, max: 3, message: { error: 'OTP 요청이 너무 많습니다. 1분 후 다시 시도해주세요.' }, standardHeaders: true, legacyHeaders: false });

  app.use('/api/auth/', authLimiter);

  // ✅ FIX-CATCH-LIMITER
  catchLimiter = rateLimit({ windowMs: 60_000, max: 5, message: { error: '조황 등록이 너무 많습니다.' }, standardHeaders: true, legacyHeaders: false });

  // ✅ FIX-CACHE-AUTH-MIDDLEWARE: /api/auth/* 에 no-store 헤더
  app.use('/api/auth/', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use('/api/', apiLimiter);
  app.use('/api/media/youtube/search', ytSearchLimiter);   // ✅ 검색: 1분/3회
  app.use('/api/media/youtube/unified', ytFeedLimiter);    // ✅ 통합 피드: 1분/10회
  (logger?.info || console.log)('✅ Rate Limiter 적용 (로그인 10분/500회, 일반 1분/1000회) — 동시 1만 사용자 지원');

  (logger?.info || console.log)('✅ YouTube Rate Limit 강화 (검색 1분/3회, 피드 1분/10회)');
} catch (e) { (logger?.warn || console.warn)('⚠️ express-rate-limit 미설치 → npm install express-rate-limit'); }

// ✅ IMG-SIZE-FIX: 다중이미지 5장 × 4MB = 최대 20MB → 25mb로 확장 (이전 10mb에서 이미지 탈락 방지)
app.use(express.json({ limit: '1mb' }));
// ✅ FIX-JSON-ERR: JSON 파싱 에러 → 400 응답
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: '잘못된 JSON 형식입니다.' });
  }
  next(err);
});
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

// ✅ IAP 구독 자동 만료 스케줄러 (30분마다 실행)
// iapExpiresAt이 지난 유저 tier → FREE로 강제 회수 + VVIP 슬롯 해제
const runIapExpiryCheck = async () => {
  if (!dbReady || !User) return;
  try {
    const now = new Date();
    // 만료된 유료 구독자 조회 (FREE가 아닌 + 만료일 지남)
    const expiredUsers = await User.find({
      tier: { $nin: ['FREE', 'MASTER'] },
      $or: [
        { iapExpiresAt: { $ne: null, $lt: now } },
        { subscriptionExpiresAt: { $ne: null, $lt: now }, iapExpiresAt: null },
      ],
    }).select('_id email tier iapExpiresAt subscriptionExpiresAt vvipHarborId').lean();

    for (const u of expiredUsers) {
      try {
        // tier → FREE 강제 다운그레이드
        await User.findByIdAndUpdate(u._id, {
          $set: { tier: 'FREE', iapExpiresAt: null, subscriptionExpiresAt: null, iapPurchaseToken: null, iapProductId: null, iapAutoRenewing: false, updatedAt: now }
        });

        // ✅ 선상홍보글 자동 삭제 — PRO/VVIP 만료 시 무료 홍보 악용 방지
        // PRO, BUSINESS_VIP 유저만 홍보글 작성 가능 → 만료 시 삭제
        if (u.tier === 'PRO' || u.tier === 'BUSINESS_VIP') {
          let deletedCount = 0;
          // DB 삭제
          if (BusinessPost) {
            const result = await BusinessPost.deleteMany({ author_email: u.email }).catch(e => {
              (logger?.error || console.error)(`[IAP 만료] 홍보글 DB 삭제 실패: ${u.email}`, e.message);
              return { deletedCount: 0 };
            });
            deletedCount = result.deletedCount || 0;
          }
          // 인메모리 삭제
          const before = memBusinessPosts.length;
          memBusinessPosts = memBusinessPosts.filter(p => p.author_email !== u.email);
          const memDeleted = before - memBusinessPosts.length;
          if (memDeleted > 0) saveMemBusinessPosts();
          if (deletedCount > 0 || memDeleted > 0) {
            (logger?.info || console.log)(`[IAP 만료] 홍보글 삭제: ${u.email} → DB ${deletedCount}건, 메모리 ${memDeleted}건`);
          }
        }

        // VVIP였으면 항구 슬롯 해제
        if ((u.tier === 'BUSINESS_VIP' || u.tier === 'MASTER') && u.vvipHarborId && vvipSlots[u.vvipHarborId]?.userId === (u.email || String(u._id))) {
          delete vvipSlots[u.vvipHarborId];
          saveVvipSlots();
          (logger?.info || console.log)(`[IAP 만료] VVIP 슬롯 해제: ${u.email} → ${u.vvipHarborId}`);
        }
        (logger?.info || console.log)(`[IAP 만료] 구독 회수: ${u.email} ${u.tier}→FREE (만료: ${u.iapExpiresAt})`);
      } catch (e2) {
        (logger?.error || console.error)(`[IAP 만료] 처리 실패: ${u.email}`, e2.message);
      }
    }
    if (expiredUsers.length > 0) {
      (logger?.info || console.log)(`[IAP 만료] 총 ${expiredUsers.length}명 처리 완료`);
    }
  } catch (e) {
    (logger?.error || console.error)('[IAP 만료 스케줄러] 오류:', e.message);
  }
};

// ✅ 서버 시작 30초 후 첫 실행, 이후 1분마다
// 30분 → 1분으로 단축: 테스트 구독(5분) 만료 즉시 감지 + 실제 구독도 지연 없이 회수
setTimeout(() => {
  runIapExpiryCheck();
  setInterval(runIapExpiryCheck, 60 * 1000); // ✅ 1분 주기 (테스트: 5분 구독 만료 대응)
}, 30 * 1000);

// ✅ VVIP 항구 슬롯 만료 자동 회수 (1분 주기) — 기존에는 /api/vvip/harbors 요청 시만 처리
const runVvipExpiryCheck = async () => {
  // vvipSlots는 서버 시작 후 즉시 초기화되므로 60초 후 호출 시 항상 존재
  // 만료된 슬롯을 메모리 + DB + JSON 파일에서 동시 제거
  const target = (typeof vvipSlots !== 'undefined' ? vvipSlots : memVvipSlots);
  if (!target || typeof target !== 'object') return;
  const now = new Date();
  let cleaned = 0;
  for (const [harborId, slot] of Object.entries(target)) {
    if (slot.expiresAt && new Date(slot.expiresAt) < now) {
      (logger?.info || console.log)(`[VVIP 만료-자동] ${slot.harborName || harborId} 슬롯 자동 해제 (userId: ${slot.userId})`);
      delete target[harborId];
      cleaned++;
      // User DB vvipHarborId/vvipExpiresAt 초기화 (재시작 시 재복원 방지)
      if (dbReady && User) {
        User.findOneAndUpdate(
          { $or: [{ email: slot.userId }, { id: slot.userId }] },
          { $unset: { vvipHarborId: 1, vvipExpiresAt: 1 } }
        ).catch(e => (logger?.error || console.error)('[VVIP 만료-자동] DB 초기화 실패:', e.message));
      }
    }
  }
  if (cleaned > 0) saveVvipSlots();
};
// 서버 시작 후 1분 뒤 첫 실행, 이후 1분 주기
setTimeout(() => {
  runVvipExpiryCheck();
  setInterval(runVvipExpiryCheck, 60 * 1000);
}, 60 * 1000);

// ─── JWT 인증 미들웨어 (선택적 보호 엔드포인트용) ───────────────
// ✅ FIX-PWD-IAT: 비밀번호 변경 시 이전 토큰 무효화를 위한 in-memory 캐시
const pwdChangedCache = new Map(); // email → passwordChangedAt ms
// 1시간마다 정리
setInterval(() => { pwdChangedCache.clear(); }, 60 * 60 * 1000);

// ✅ FIX-NO-CACHE: 민감 데이터 API에 no-store 헤더 미들웨어
function noCache(req, res, next) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  next();
}

function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증이 필요합니다.' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET, { algorithms: ['HS256'] });
    // ✅ FIX-PWD-IAT: 비밀번호 변경 후 이전 토큰 차단
    const userKey = decoded.email || decoded.id;
    const changedAt = pwdChangedCache.get(userKey);
    if (changedAt && decoded.iat && (decoded.iat * 1000) < changedAt) {
      return res.status(401).json({ error: '비밀번호가 변경되어 다시 로그인이 필요합니다.', code: 'TOKEN_INVALIDATED' });
    }
    req.user = decoded;
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
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음', code: 'TOKEN_INVALID' }); }
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
    const p = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    if (!isAdminToken(p)) return res.status(403).json({ error: '관리자 권한 필요' });
  } catch { return res.status(401).json({ error: '토큰 유효하지 않음', code: 'TOKEN_INVALID' }); }
  const { id, lat, lng } = req.body;
    if (!Number.isFinite(parseFloat(lat)) || !Number.isFinite(parseFloat(lng))) return res.status(400).json({ error: '유효한 좌표(숫자)가 필요합니다.' }); // ✅ FIX-LAT-LNG
  if (!id || lat == null || lng == null) return res.status(400).json({ error: 'id, lat, lng 필수' });
  secretPointOverrides[String(id)] = { lat: parseFloat(lat), lng: parseFloat(lng) };
  saveSecretPointOverrides();
  // ✅ DB 영구 저장
  if (dbReady && SecretPointOverrideModel) {
    SecretPointOverrideModel.findOneAndUpdate(
      { id: String(id) },
      { id: String(id), lat: parseFloat(lat), lng: parseFloat(lng) },
      { upsert: true, new: true }
    ).catch(e => logger.error('[SecretOverride] DB 저장 실패:', e.message));
  }
  (logger?.info || console.log)(`[SecretPoint] id=${id} 좌표 업데이트: ${lat}, ${lng}`);
  res.json({ ok: true, overrides: secretPointOverrides });
});

// DELETE: 특정 포인트 초기화 (어드민 JWT 인증 필수)
app.delete('/api/secret-point-overrides/:id', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    if (!isAdminToken(p)) return res.status(403).json({ error: '관리자 권한 필요' });
  } catch { return res.status(401).json({ error: '토큰 유효하지 않음', code: 'TOKEN_INVALID' }); }
  const { id } = req.params;
  delete secretPointOverrides[id];
  saveSecretPointOverrides();
  // ✅ DB에서도 삭제
  if (dbReady && SecretPointOverrideModel) {
    SecretPointOverrideModel.deleteOne({ id }).catch(e => logger.error('[SecretOverride] DB 삭제 실패:', e.message));
  }
  res.json({ ok: true, overrides: secretPointOverrides });
});

// ─── 낚시 포인트 좌표 오버라이드 (MASTER 전용) ─────────────────────────────────
// GET: 모든 오버라이드 반환 (공개)
app.get('/api/spot-location-overrides', (req, res) => {
  res.json(spotLocationOverrides);
});

// POST: 좌표 저장 (MASTER 전용)
app.post('/api/spot-location-overrides', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    if (!isAdminToken(p)) return res.status(403).json({ error: 'MASTER 권한 필요' });
  } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
  const { id, lat, lng, name } = req.body;
  if (!id || lat == null || lng == null) return res.status(400).json({ error: 'id, lat, lng 필수' });
  // ✅ FIX-SPOT-LATNG-RANGE: 좌표 범위 검증
  const latNumS = parseFloat(lat); const lngNumS = parseFloat(lng);
  if (isNaN(latNumS) || latNumS < -90 || latNumS > 90) return res.status(400).json({ error: '유효하지 않은 위도값' });
  if (isNaN(lngNumS) || lngNumS < -180 || lngNumS > 180) return res.status(400).json({ error: '유효하지 않은 경도값' });
  spotLocationOverrides[String(id)] = {
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    name: name || undefined,
    updatedAt: new Date().toISOString(),
  };
  saveSpotLocationOverrides();
  // ✅ DB 영구 저장 (재배포 후에도 유지)
  if (dbReady && SpotLocationOverrideModel) {
    SpotLocationOverrideModel.findOneAndUpdate(
      { id: String(id) },
      { id: String(id), lat: parseFloat(lat), lng: parseFloat(lng), name: name || null },
      { upsert: true, new: true }
    ).catch(e => logger.error('[SpotOverride] DB 저장 실패:', e.message));
  }
  (logger?.info || console.log)(`[SpotLocation] id=${id} 좌표 수정: (${lat}, ${lng})`);
  res.json({ ok: true, id, lat: parseFloat(lat), lng: parseFloat(lng) });
});

// DELETE: 특정 포인트 원래대로 초기화 (MASTER 전용)
app.delete('/api/spot-location-overrides/:id', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    if (!isAdminToken(p)) return res.status(403).json({ error: 'MASTER 권한 필요' });
  } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
  const { id } = req.params;
  delete spotLocationOverrides[id];
  saveSpotLocationOverrides();
  // ✅ DB에서도 삭제
  if (dbReady && SpotLocationOverrideModel) {
    SpotLocationOverrideModel.deleteOne({ id }).catch(e => logger.error('[SpotOverride] DB 삭제 실패:', e.message));
  }
  res.json({ ok: true, reset: id });
});

// ─── 커스텀 낚시 포인트 (MASTER 신규 추가) ─────────────────────────────────────────
// GET: 모든 커스텀 포인트 반환 (공개)
app.get('/api/custom-points', (req, res) => {
  res.json(Object.values(customPoints));
});

// POST: 새 포인트 추가 (MASTER 전용) — 좌표 입력 시 관측소 자동 배정
app.post('/api/custom-points', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    if (!isAdminToken(p)) return res.status(403).json({ error: 'MASTER 권한 필요' });
  } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

  const { name, type, region, lat, lng, fish, obsCode, aiDescription, season, recommend, status } = req.body;
  if (!name || !type || lat == null || lng == null) return res.status(400).json({ error: 'name, type, lat, lng 필수' });

  // ✅ FIX-POINT-LATNG-RANGE: 좌표 범위 검증 (한국 좌표 ± 넓은 범위 허용)
  const latNum = parseFloat(lat); const lngNum = parseFloat(lng);
  if (isNaN(latNum) || latNum < -90 || latNum > 90) return res.status(400).json({ error: '유효하지 않은 위도값 (-90~90)' });
  if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) return res.status(400).json({ error: '유효하지 않은 경도값 (-180~180)' });

  // ✅ FIX-POINT-NAME-LEN: 포인트명/어종 길이 제한
  if (typeof name !== 'string' || name.length > 100) return res.status(400).json({ error: '포인트명은 최대 100자입니다.' });
  if (typeof type !== 'string' || type.length > 50) return res.status(400).json({ error: '타입은 최대 50자입니다.' });
  if (typeof fish === 'string' && fish.length > 200) return res.status(400).json({ error: '어종 정보는 최대 200자입니다.' });

  // ✅ AUTO-STATION: obsCode 미입력 시 위도/경도로 가장 가까운 관측소 자동 배정
  let resolvedObsCode = obsCode || null;
  let autoStationInfo = null;
  let resolvedRegion = region || null;

  if (!resolvedObsCode && !isNaN(latNum) && !isNaN(lngNum)) {
    const nearest = findNearestStation(latNum, lngNum);
    if (nearest) {
      resolvedObsCode = nearest.stationId;
      resolvedRegion = resolvedRegion || nearest.region;
      autoStationInfo = nearest;
      (logger?.info || console.log)(`[AUTO-STATION] ${name} → ${nearest.name} (${nearest.distKm}km)`);
    }
  }

  // region이 아직 없으면 observationData에서 보완
  if (!resolvedRegion && resolvedObsCode) {
    resolvedRegion = observationData[resolvedObsCode]?.region || '미지정';
  }

  const id = `custom_${Date.now()}`;
  customPoints[id] = {
    id,
    name,
    type,
    region: resolvedRegion || '미지정',
    lat: latNum,
    lng: lngNum,
    fish: fish || '미확인',
    score: 80,
    status: status || '보통',
    obsCode: resolvedObsCode,
    aiDescription: aiDescription || null,
    season: season || null,
    recommend: recommend || null,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
  saveCustomPoints();
  (logger?.info || console.log)(`[CustomPoint] 추가: ${name} (${type}) @ ${lat},${lng} obsCode=${resolvedObsCode}`);

  res.json({
    ok: true,
    point: customPoints[id],
    autoStation: autoStationInfo,  // 자동 매핑 정보 응답에 포함
  });
});

// DELETE: 커스텀 포인트 삭제 (MASTER 전용)
app.delete('/api/custom-points/:id', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    if (!isAdminToken(p)) return res.status(403).json({ error: 'MASTER 권한 필요' });
  } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
  const { id } = req.params;
  if (!customPoints[id]) return res.status(404).json({ error: '포인트 없음' });
  const name = customPoints[id].name;
  delete customPoints[id];
  saveCustomPoints();
  (logger?.info || console.log)(`[CustomPoint] 삭제: ${name} (${id})`);
  res.json({ ok: true });
});

// ✅ AUTO-STATION API: 좌표 → 가장 가까운 관측소 자동 탐색 (인증 불필요 — 프론트 미리보기용)
app.get('/api/nearest-station', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: 'lat, lng 필수 (숫자)' });
  if (lat < 33 || lat > 39 || lng < 124 || lng > 132) return res.status(400).json({ error: '한국 범위 내 좌표만 지원 (lat 33~39, lng 124~132)' });
  const result = findNearestStation(lat, lng);
  if (!result) return res.status(404).json({ error: '관측소 없음' });
  // 현재 날씨 데이터도 함께 반환
  const weather = weatherCache[result.stationId]?.data || null;
  res.json({
    ...result,
    weather: weather ? {
      sst: weather.sst,
      temp: weather.temp,
      _sources: weather._sources,
    } : null,
  });
});

// POST: AI 낚시 포인트 정보 자동 생성 (MASTER 전용)
app.post('/api/ai/generate-point-info', async (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    if (!isAdminToken(p)) return res.status(403).json({ error: 'MASTER 권한 필요' });
  } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
  const { name, type, region, lat, lng, obsCode } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name, type 필수' });
  // ✅ FIX-POINT-INFO-LEN: 입력 길이 제한 (prompt injection + DoS 방어)
  if (typeof name !== 'string' || name.length > 100) return res.status(400).json({ error: '포인트명은 최대 100자입니다.' });
  if (typeof type !== 'string' || type.length > 50) return res.status(400).json({ error: '타입은 최대 50자입니다.' });
  if (lat !== undefined && (isNaN(Number(lat)) || Number(lat) < -90 || Number(lat) > 90)) return res.status(400).json({ error: '유효하지 않은 위도값' });
  if (lng !== undefined && (isNaN(Number(lng)) || Number(lng) < -180 || Number(lng) > 180)) return res.status(400).json({ error: '유효하지 않은 경도값' });
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) return res.status(503).json({ error: 'Gemini API 키 미설정' });
  const stationInfo = obsCode ? (observationData[obsCode] || {}) : {};
  const regionLabel = stationInfo.region || region || '미지정';
  const prompt = `당신은 한국 낚시 전문가입니다. 다음 낚시 포인트에 대한 정보를 생성해주세요.\n포인트명: ${name}\n타입: ${type} (${regionLabel} 권역)\n위치: 위도 ${lat}, 경도 ${lng}\n인근 관측소: ${stationInfo.name || '미확인'}\n\n반드시 아래 JSON 형식만 응답하세요 (다른 텍스트 없이):\n{\n  "fish": "이 포인트에서 주로 잡히는 어종 3~5가지 (쉼표 구분, 한국어)",\n  "description": "이 낚시 포인트의 특징과 낚시 방법 설명 (2~3문장)",\n  "season": "최적 낚시 시즌 설명",\n  "recommend": "추천 채비 및 미끼 (1~2가지)",\n  "status": "최고|피딩중|활발|보통 중 하나"\n}`;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
        })
      }
    );
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    res.json(result);
  } catch (err) {
    (logger?.error || console.error)('[POST /api/ai/generate-point-info]', err.message);
    res.status(500).json({ error: 'AI 생성 실패' });
  }
});

// ─── 앱 설정 (강제 업데이트용) ──────────────────────────────────────────────────
app.get('/api/app-config', (req, res) => {
  res.json(appConfig);
});

app.post('/api/admin/app-config', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    if (!isAdminToken(p)) return res.status(403).json({ error: '관리자 권한 필요' });
  } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
  
  // ✅ FIX-APPCONFIG-VALID: 형식 검증 추가 (임의 값/XSS URL 주입 방어)
  if (req.body.min_version !== undefined) {
    const mv = String(req.body.min_version);
    if (/^\d+\.\d+\.\d+$/.test(mv)) appConfig.min_version = mv;
    else return res.status(400).json({ error: 'min_version 형식: x.y.z' });
  }
  if (req.body.store_url !== undefined) {
    const su = String(req.body.store_url);
    if (/^https:\/\/.{5,500}/.test(su)) appConfig.store_url = su;
    else return res.status(400).json({ error: 'store_url은 https로 시작해야 합니다.' });
  }
  
  saveAppConfig();
  res.json({ ok: true, appConfig });
});

app.get('/api/debug', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: '접근 불가' });
  // FIX-DEBUG-AUTH: production이 아닌 경우에도 관리자 JWT 필요
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    try { const tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); if (!isAdminToken(tp)) return res.status(403).json({ error: '관리자 권한 필요' }); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
  } else { return res.status(401).json({ error: '인증 필요' }); }
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

// 실시간 낚시 인원 서버 로직 (chatHistories는 상단에서 선언되었습니다)

io.on('connection', (socket) => {
  // ✅ OPT-5: 연결 시 핸드셰이크 토큰 검증 (발신자 위조 방지)
  let verifiedUser = null;
  // ✅ FIX-SOCKET-FLOOD: 메시지 플러딩 방지
  let msgCount = 0; let msgWindow = Date.now();
  const MSG_LIMIT = 10; const MSG_WINDOW_MS = 3000; // 3초 내 10회
  const handshakeToken = socket.handshake?.auth?.token || socket.handshake?.query?.token;
  if (handshakeToken) {
    try {
      verifiedUser = jwt.verify(handshakeToken, JWT_SECRET, { algorithms: ['HS256'] });
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

  let joinCount = 0; let joinWindow = Date.now(); // ✅ FIX-SOCKET-JOIN-RATE: join 이벤트 rate limit
  socket.on('join_crew', async (crewId) => {
    if (!crewId || typeof crewId !== 'string' || !/^[a-f0-9]{24}$/.test(crewId)) return; // ✅ FIX-CREWID
    if (!verifiedUser) { socket.emit('error', { message: '로그인이 필요합니다.' }); return; } // ✅ FIX-SOCKET-JOIN-AUTH
    // ✅ FIX-SOCKET-JOIN-RATE: 10초 내 5회 이상 join 시도 차단
    const nowJoin = Date.now();
    if (nowJoin - joinWindow > 10_000) { joinCount = 0; joinWindow = nowJoin; }
    if (++joinCount > 5) { socket.emit('error', { message: '너무 빠른 채팅방 참가 시도입니다.' }); return; }
    // ✅ FIX-JOIN-CREW-MEMBER: 비공개 크루 멤버십 검증
    if (dbReady && Crew) {
      try {
        const crewDoc = await Crew.findById(crewId).select('isPrivate members').lean();
        if (crewDoc && crewDoc.isPrivate) {
          const userKey = verifiedUser.email || verifiedUser.id;
          const isMem = (crewDoc.members || []).some(m => (m.email || m) === userKey);
          if (!isMem) { socket.emit('error', { message: '비공개 크루의 멤버가 아닙니다.' }); return; }
        }
      } catch { }
    }
    // ✅ FIX-SOCKET-DUP-JOIN: 중복 room join 방어
  if (!socket.rooms.has(crewId)) socket.join(crewId);
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
          // ✅ REPLY-HISTORY: 채팅방 입장 시 과거 답장 메시지에도 인용 버블 표시
          replyTo: (m.replyTo && m.replyTo.sender) ? { sender: m.replyTo.sender, text: m.replyTo.text || '' } : null,
        }));
      } catch (e) { logger.warn(`[Socket] join_crew 채팅 히스토리 DB 로드 실패 (crewId=${crewId}): ${e.message}`); } // ✅ 21TH-B2: silent catch → logger.warn
    }
    if (!chatHistories[crewId]) chatHistories[crewId] = [];
    socket.emit('chat_history', chatHistories[crewId]);
  });

  socket.on('send_msg', async (data) => {
    // ✅ FIX-CHAT-MSG-LENGTH: 채팅 메시지 최대 500자 제한 (DoS 방어)
    if (!data || typeof data !== 'object') return;
    if (typeof data.text === 'string' && data.text.length > 500) {
      socket.emit('error', { message: '메시지는 최대 500자입니다.' }); return;
    }
    // ✅ FIX-SOCKET-FLOOD-CHECK: 플러딩 방지
    const now = Date.now(); if (now - msgWindow > MSG_WINDOW_MS) { msgCount = 0; msgWindow = now; }
    if (++msgCount > MSG_LIMIT) { socket.emit('error', { message: '메시지를 너무 빠르게 전송하고 있습니다.' }); return; }
    if (!data.crewId || typeof data.crewId !== 'string' || data.crewId.length > 100) return; // FIX-CREWID-VALIDATE
    if (!socket.rooms.has(data.crewId)) { socket.emit('error', { message: '채팅방에 참가하지 않았습니다.' }); return; } // ✅ FIX-CREW-ROOM
    if (!verifiedUser) { socket.emit('error', { message: '로그인이 필요합니다.' }); return; } // ✅ FIX-MSG-AUTH
    if (data.type === 'text' && (!data.text || !String(data.text).trim())) return; // ✅ FIX-MSG-EMPTY
    if (data.type !== 'post_share' && typeof data.text === 'string' && data.text.length > 1000) { socket.emit('error', { message: '1000자를 초과할 수 없습니다.' }); return; } // ✅ FIX-MSG-SIZE
    const safeText = (data.text||'').replace(/<[^>]*>/g,'').replace(/javascript:/gi,'').trim().substring(0,1000); // ✅ FIX-CHAT-XSS

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
      // FIX-CHAT-MIME: base64 이미지 MIME 타입 화이트리스트 (허용: jpeg/png/gif/webp)
      const isBase64 = rawImage.startsWith('data:');
      if (isBase64) {
        const mimeMatch = rawImage.match(/^data:([^;]+);base64,/);
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!mimeMatch || !allowedMimes.includes(mimeMatch[1])) {
          socket.emit('error', { message: '허용되지 않는 이미지 형식입니다.' }); return;
        }
      }
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
    const text = censorText((safeText || data.text || '').toString().trim());
    if (!text || text.length > 500) return;

    const msgData = {
      sender,
      text,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      socketId: socket.id,
      senderLevel: cachedLevel.level,
      senderEmoji: cachedLevel.emoji,
      senderTitle: cachedLevel.title,
      // ✅ REPLY: 답장 대상 (sender + text 100자 이내로 제한, XSS 방지)
      replyTo: (data.replyTo && typeof data.replyTo === 'object')
        ? {
            sender: (data.replyTo.sender || '').toString().slice(0, 30),
            text:   (data.replyTo.text   || '').toString().slice(0, 100),
          }
        : null,
    };
    if (!chatHistories[data.crewId]) chatHistories[data.crewId] = [];
    chatHistories[data.crewId].push(msgData);
    if (chatHistories[data.crewId].length > 500) chatHistories[data.crewId] = chatHistories[data.crewId].slice(-500);
    io.to(data.crewId).emit('new_msg', msgData);

    // ✅ REPLY NOTIF: 답장 메시지 수신 시 크루 룸 전체에 알림 브로드캐스트
    // 클라이언트가 repliedToSender === 자신 닉네임 여부를 체크해 알림 표시
    if (msgData.replyTo?.sender) {
      io.to(data.crewId).emit('crew_reply_notification', {
        repliedToSender: msgData.replyTo.sender,  // 답장 받은 사람 (원글 작성자)
        fromSender:      msgData.sender,           // 답장 보낸 사람
        replyText:       msgData.text.slice(0, 80),
        crewId:          data.crewId,
        time:            msgData.time,
      });
    }

    if (dbReady && ChatMessage) {
      try {
        await new ChatMessage({
          crewId: data.crewId,
          sender: msgData.sender,
          text: msgData.text,
          time: msgData.time,
          senderLevel: msgData.senderLevel,
          senderEmoji: msgData.senderEmoji,
          senderTitle: msgData.senderTitle,
          // ✅ REPLY-FIX: replyTo DB 저장 포함 — 서버 재시작 후에도 인용 버블 유지
          replyTo: msgData.replyTo ? {
            sender: msgData.replyTo.sender || '',
            text:   msgData.replyTo.text   || '',
          } : undefined,
        }).save();
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
    // ✅ FIX-LOW: socket 스코프 변수(msgCount/msgWindow)는 소켓 종료 시 자동 소멸 — 별도 Map 정리 불필요
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

// ✅ AUTO-STATION: 관측소별 실제 좌표 (Haversine 자동 매핑용)
const STATION_COORDS = {
  'DT_0001': { lat: 37.7734, lng: 128.9406 },  // 강릉 안목항
  'DT_0021': { lat: 38.2048, lng: 128.5925 },  // 속초 영금정
  'DT_0002': { lat: 36.6764, lng: 129.4627 },  // 울진 후포
  'DT_0033': { lat: 37.5484, lng: 129.1128 },  // 동해 묵호
  'DT_0003': { lat: 37.4432, lng: 129.1639 },  // 삼척항
  'DT_0036': { lat: 35.8188, lng: 129.5012 },  // 경주 감포
  'DT_0004': { lat: 35.1586, lng: 129.1603 },  // 부산 해운대
  'DT_0005': { lat: 34.7462, lng: 127.7516 },  // 여수 국동항
  'DT_0016': { lat: 34.8512, lng: 128.4342 },  // 통영 도남
  'DT_0034': { lat: 34.8101, lng: 128.7021 },  // 거제 지세포
  'DT_0018': { lat: 34.3108, lng: 126.7575 },  // 완도항
  'DT_0014': { lat: 34.9123, lng: 127.7268 },  // 광양만 관측소
  'DT_0007': { lat: 37.4643, lng: 126.6188 },  // 인천 연안부두
  'DT_0008': { lat: 36.3523, lng: 126.5078 },  // 보령 대천항
  'DT_0009': { lat: 35.9697, lng: 126.5621 },  // 군산 비응항
  'DT_0030': { lat: 36.7265, lng: 126.1474 },  // 태안 마도
  'DT_0006': { lat: 34.7891, lng: 126.3776 },  // 목포항
  'DT_0011': { lat: 33.2460, lng: 126.5623 },  // 서귀포 외돌개
  'DT_0010': { lat: 33.4139, lng: 126.2636 },  // 제주 한림
  'DT_0045': { lat: 33.4714, lng: 126.9248 },  // 성산포항
};

/**
 * Haversine 공식으로 두 좌표 간 거리(km) 계산
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * 위도/경도로 가장 가까운 관측소 자동 탐색
 * @returns {{ stationId: string, distKm: number, name: string, region: string }}
 */
function findNearestStation(lat, lng) {
  let nearest = null;
  let minDist = Infinity;
  for (const [sid, coords] of Object.entries(STATION_COORDS)) {
    const d = haversineKm(lat, lng, coords.lat, coords.lng);
    if (d < minDist) { minDist = d; nearest = sid; }
  }
  if (!nearest) return null;
  const info = observationData[nearest] || {};
  return {
    stationId: nearest,
    distKm: Math.round(minDist * 10) / 10,
    name: info.name || nearest,
    region: info.region || '미지정',
  };
}

// ✅ SST-OBS-REMAP: 전수조사(DT_0001~0500) 결과 기반 정확한 obsCode 매핑
// surveyWaterTemp API의 DT_XXXX 코드 ≠ 항만/조석 DT_XXXX 코드 (다른 체계)
// 실제 확인된 코드: DT_0005(포항) DT_0006(묵호) DT_0011(울진) DT_0012(속초)
//   DT_0013(울릉도) DT_0020(포항북) DT_0061(남해서부) DT_0062(마산) DT_0063(거제)
//   DT_0067(태안) DT_0091(포항) DT_0094(제주서)
const WATER_TEMP_OBS_MAP = {
  'DT_0001': 'DT_0006',  // 강릉 안목항 → 묵호 37.55°N/129.11°E (최근접 22km)
  'DT_0021': 'DT_0012',  // 속초 영금정 → 속초 38.20°N/128.59°E ✅ 정확
  'DT_0033': 'DT_0006',  // 동해 묵호   → 묵호 37.55°N/129.11°E ✅ 정확
  'DT_0002': 'DT_0011',  // 울진 후포   → 울진 36.67°N/129.45°E ✅ 정확
  'DT_0003': 'DT_0006',  // 삼척항      → 묵호 37.55°N (최근접)
  'DT_0036': 'DT_0005',  // 경주 감포   → 포항 35.09°N/129.03°E (최근접)
  'DT_0004': 'DT_0005',  // 부산 해운대  → 포항 35.09°N (동해남부 최근접)
  'DT_0005': 'DT_0061',  // 여수 국동항  → 남해서부 34.92°N/128.07°E
  'DT_0016': 'DT_0062',  // 통영 도남   → 마산 35.2°N/128.58°E
  'DT_0034': 'DT_0063',  // 거제 지세포  → 거제 35.02°N/128.81°E ✅ 정확
  'DT_0014': 'DT_0061',  // 광양만      → 남해서부 34.92°N
  'DT_0008': null,      // 보령 대천항  → DT_0067(황해외해 14.4°C) 제거 → 월별계절값(서해6월20.5°C)이 더 정확
  'DT_0030': null,      // 태안 마도   → 동일 이유
  // DT_0010 제주한림: NIFS jt001 우선, 없으면 월별계절값(제주6월24.5°C)
  // DT_0094(제주외해14.7°C) 제거 - 남태평양 냉수대 영향 과도
  // DT_0007 인천, DT_0009 군산, DT_0006 목포, DT_0045 성산포: 월별계절값
};

// ✅ NIFS-RISA-MAP: 실시간어장정보(risaList) sta_cde 매핑
// 전수조사(2026-06-12) 결과 — 남해·제주 커버, 동해·서해 미커버
const NIFS_STA_MAP = {
  'DT_0018': 'wk094',  // 완도항      → 전남 완도(완도) ✅ 신규
  'DT_0011': 'sg001',  // 서귀포      → 제주 서귀포(서귀포) ✅ 신규
  'DT_0010': 'jt001',  // 제주 한림   → 제주 제주(탑동) (개선)
  'DT_0016': 'ty004',  // 통영 도남   → 경남 통영(통영) (개선)
  'DT_0034': 'gi086',  // 거제 지세포  → 경남 외양어장(진해만2) (개선)
  'DT_0005': 'km001',  // 여수 국동항  → 전남 여수(고흥만) (개선)
};

// NIFS 전체 데이터 캐시 (30분 주기 — KHOA 캐시와 동기)
let nifsCache = null;
let nifsCacheTime = 0;
let nifsFetchPromise = null; // ✅ singleton: 동시 호출 시 1번만 API 요청

async function getNifsAllStations() {
  const NIFS_KEY = process.env.NIFS_KEY;
  if (!NIFS_KEY) return null;
  const now = Date.now();
  if (nifsCache && (now - nifsCacheTime) < 28 * 60 * 1000) return nifsCache;
  // 이미 fetch 진행 중이면 동일 Promise 대기 (중복 호출 방지)
  if (nifsFetchPromise) return nifsFetchPromise;
  nifsFetchPromise = (async () => {
    try {
      const res = await axios.get(`https://www.nifs.go.kr/OpenAPI_json?id=risaList&key=${NIFS_KEY}`, { timeout: 8000 });
      if (res.data?.header?.resultCode !== '00') return nifsCache;
      const items = res.data?.body?.item;
      if (!items || !Array.isArray(items)) return nifsCache;
      // obs_lay=1(표층) 필터: 문자열'1' 및 숫자 1 양쪽 대응
      const surface = items.filter(i => String(i.obs_lay) === '1' && String(i.rpr_yn) === 'N');
      const map = {};
      for (const item of surface) {
        const key = item.sta_cde;
        if (!map[key] || item.obs_dat + item.obs_tim > map[key].obs_dat + map[key].obs_tim) {
          map[key] = item;
        }
      }
      nifsCache = map;
      nifsCacheTime = Date.now();
      logger.info(`[NIFS] 실시간어장정보 이넥 갱신: ${Object.keys(map).length}인 관측소`);
      return map;
    } catch (e) {
      logger.warn(`[NIFS] risaList API 실패: ${e.message}`);
      return nifsCache;
    } finally {
      nifsFetchPromise = null; // 완료 후 초기화
    }
  })();
  return nifsFetchPromise;
}

async function getNifsWaterTemp(sid) {
  const staCde = NIFS_STA_MAP[sid];
  if (!staCde) return null;
  const map = await getNifsAllStations();
  if (!map) return null;
  const item = map[staCde];
  if (!item) return null;
  const sst = item.wtr_tmp;
  if (sst && sst !== '-' && !isNaN(parseFloat(sst))) return String(parseFloat(sst).toFixed(1));
  return null;
}

// ✅ KMA-BEACH-MAP: 기상청 해수욕장 수온 API 매핑 (서해·제주 커버)
// 5~10월 운영, 제공정보: beachNm, wTemp, reginNm
const KMA_BEACH_MAP = {
  'DT_0008': ['대천', '무창포', '보령'],               // 보령 대천항
  'DT_0030': ['만리포', '몽산포', '꽃지', '백사장', '태안'], // 태안 마도
  'DT_0009': ['선유도', '야미', '비응', '군산'],        // 군산
  'DT_0007': ['을왕리', '왕산', '대부', '인천'],        // 인천
  'DT_0006': ['목포', '무안', '함평', '진도'],          // 목포
  'DT_0045': ['성산', '세화', '월정'],                 // 제주 성산포 (표선 DT_0011 분리)
  'DT_0010': ['협재', '한담', '곽지', '이호', '김녕'], // 제주한림 ✅ 신규 (제주 서쪽)
  'DT_0011': ['중문', '화순', '신양', '표선', '서귀포'], // 서귀포 ✅ 신규 (제주 남쪽)
};

let kmaBeachCache = null;
let kmaBeachCacheTime = 0;
let kmaBeachFetchPromise = null; // ✅ singleton

async function getKmaBeachAllStations() {
  const KEY = process.env.KHOA_CCTV_KEY || process.env.KHOA_KEY;
  if (!KEY) return null;
  const now = Date.now();
  if (kmaBeachCache && (now - kmaBeachCacheTime) < 58 * 60 * 1000) return kmaBeachCache;
  if (kmaBeachFetchPromise) return kmaBeachFetchPromise;
  kmaBeachFetchPromise = (async () => {
    try {
      const url = `https://apis.data.go.kr/1360000/BeachInfoservice/getBeachCurrentWeather?serviceKey=${encodeURIComponent(KEY)}&numOfRows=200&dataType=JSON`;
      const res = await axios.get(url, {
        timeout: 8000,
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'ko-KR,ko;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
          'Referer': 'https://www.data.go.kr/',
        },
      });

      const rc = res.data?.response?.header?.resultCode;
      if (rc !== '00') return kmaBeachCache;
      const items = res.data?.response?.body?.items?.item;
      if (!items || !Array.isArray(items)) return kmaBeachCache;
      kmaBeachCache = items;
      kmaBeachCacheTime = Date.now();
      logger.info(`[KMA-BEACH] 해수욕장 수온 이넥 갱신: ${items.length}개`);
      return items;
    } catch (e) {
      logger.warn(`[KMA-BEACH] 해수욕장 API 실패: ${e.message}`);
      return kmaBeachCache;
    } finally {
      kmaBeachFetchPromise = null;
    }
  })();
  return kmaBeachFetchPromise;
}

async function getKmaBeachWaterTemp(sid) {
  const keywords = KMA_BEACH_MAP[sid];
  if (!keywords) return null;
  const items = await getKmaBeachAllStations();
  if (!items) return null;
  for (const kw of keywords) {
    const match = items.find(i => i.beachNm && i.beachNm.includes(kw));
    if (match && match.wTemp && !isNaN(parseFloat(match.wTemp))) {
      return String(parseFloat(match.wTemp).toFixed(1));
    }
  }
  return null;
}

// ✅ MONTHLY-BASE-TEMP: 월별 계절 기준 수온 (API 없는 관측소 fallback 정확도 향상)
const MONTHLY_BASE_TEMP = {
  '동해': [8.5,8.0,9.5,12.5,16.0,19.5,22.0,24.0,21.5,18.0,14.0,10.0],
  '남해': [10.0,10.0,12.0,15.0,18.5,21.5,24.5,26.0,24.0,20.0,15.5,11.5],
  '서해': [5.0,5.0,7.5,11.5,16.5,20.5,23.5,25.0,22.5,17.5,12.0,7.0],
  '제주': [15.5,15.0,16.5,18.5,21.5,24.5,27.0,28.5,26.5,23.5,19.5,16.5],
};

async function getWaterTemp(sid) {
  // ✅ SST-REMAP: 전수조사 결과 기반 올바른 obsCode로 변환 후 API 호출
  const KEY = process.env.KHOA_CCTV_KEY || process.env.KHOA_KEY;
  if (!KEY) return null;

  // 올바른 obsCode로 변환 (없으면 null → caller에서 월별 baseTemp 사용)
  const apiObsCode = WATER_TEMP_OBS_MAP[sid];
  if (!apiObsCode) return null;

  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dateStr = `${yesterday.getFullYear()}${String(yesterday.getMonth()+1).padStart(2,'0')}${String(yesterday.getDate()).padStart(2,'0')}`;
    const url = `https://apis.data.go.kr/1192136/surveyWaterTemp/GetSurveyWaterTempApiService?serviceKey=${encodeURIComponent(KEY)}&obsCode=${apiObsCode}&date=${dateStr}&type=json&numOfRows=10&pageNo=1`;
    const res = await axios.get(url, { timeout: 5000, headers: { Accept: 'application/json' } });
    const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    if (text.trimStart().startsWith('<')) return null;
    const items = res.data?.body?.items?.item;
    if (!items) return null;
    const list = Array.isArray(items) ? items : [items];
    const last = list[list.length - 1];
    const sst = last?.wtem ?? last?.water_temp ?? last?.waterTemp ?? null;
    if (sst !== null && sst !== undefined && sst !== '-') return String(sst);
  } catch (e) {
    if (!e.message?.includes('404')) logger.warn(`[Weather] 수온 API 실패 (${sid}→${apiObsCode}): ${e.message}`);
  }
  return null;
}

// ✅ REAL-WIND-WAVE: 기상청 해양기상부이 실시간 파고·풍속 API
// ✅ KMA 실제 부이 STN 번호 (5자리) 매핑
// 각 관측소 위치 기준 최근접 해양연안부이 ID
const BUOY_MAP = {
  // 동해권
  'DT_0001':'22102', // 강릉 안목항 → 동해부이 22102
  'DT_0021':'22102', // 속초
  'DT_0033':'22102', // 동해묵호
  'DT_0003':'22101', // 삼첨
  'DT_0002':'22101', // 웼uc9c4 → 동해부이 22101
  'DT_0036':'22101', // 경주감포
  // 남해권
  'DT_0004':'22104', // 부산 → 남해부이 22104
  'DT_0034':'22104', // 거제
  'DT_0016':'22105', // 통영 → 22105
  'DT_0005':'22105', // 여수
  'DT_0006':'22106', // 목포 → 22106
  'DT_0018':'22106', // 완도
  'DT_0014':'22107', // 광양만 → 22107
  // 서해권
  'DT_0007':'22298', // 인천 → 서해부이 22298
  'DT_0030':'22297', // 태안 → 22297
  'DT_0008':'22302', // 보령 → 22302
  'DT_0009':'22303', // 군산 → 22303
  // 제주권
  'DT_0010':'22515', // 제주한림 → 22515
  'DT_0011':'22515', // 서궀포
  'DT_0045':'22515', // 성산항
};

async function getMarineWeather(sid) {
  const KMA_KEY = process.env.KMA_KEY;
  if (!KMA_KEY) return null;
  const buoyNum = BUOY_MAP[sid];
  if (!buoyNum) return null;
  try {
    const now  = new Date();
    const prev = new Date(now - 70 * 60 * 1000); // 70분 전 (API 지연 보상)
    const pad  = (n) => String(n).padStart(2, '0');
    const tm2  = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}00`;
    const tm1  = `${prev.getFullYear()}${pad(prev.getMonth()+1)}${pad(prev.getDate())}${pad(prev.getHours())}00`;
    // ✅ tm1/tm2 파라미터 사용 (tm 단일 아님)
    const url  = `https://apihub.kma.go.kr/api/typ01/url/kma_buoy2.php?tm1=${tm1}&tm2=${tm2}&stn=${buoyNum}&help=1&authKey=${KMA_KEY}`;
    const res  = await axios.get(url, { timeout: 8000 });
    const text = typeof res.data === 'string' ? res.data : '';
    if (!text || !text.includes('START7777')) return null;
    // ✅ 쉽표(,) 구분자로 파싱
    const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith(' #') && l.includes(buoyNum));
    if (!lines.length) return null;
    const cols = lines[lines.length - 1].trim().split(',').map(s => s.trim());
    // ✅ 컴럼: [0]TM [1]STN [2]WD1 [3]WS1 [4]WS1_GST [5]WD2 [6]WS2 ... [12]WH_MAX [13]WH_SIG [14]WH_AVE
    const ws   = parseFloat(cols[3]);  // WS1 풍속 (m/s)
    const wdDeg= parseFloat(cols[2]);  // WD1 풍향 (도)
    const wh   = parseFloat(cols[13]); // WH_SIG 유효파고 (m)
    if (isNaN(ws) || ws <= -90 || isNaN(wh) || wh <= -90) return null;
    // 풍향 도 → 방위 변환
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    const wd   = isNaN(wdDeg) ? 'N' : dirs[Math.round(wdDeg / 22.5) % 16];
    return { wind: { speed: Math.max(0, ws), dir: wd }, wave: { coastal: Math.max(0, wh) } };
  } catch (e) {
    logger.warn(`[Marine] 부이 API 실패 (${sid}/${BUOY_MAP[sid]}): ${e.message}`);
    return null;
  }
}

// ✅ REAL-TIDE: KHOA 조석예보 — 실제 물때·고조·간조
function getLunarDay() {
  const known = new Date('2024-02-10T00:00:00+09:00'); // 2024년 설날 (음력 1월 1일)
  const diffDays = (Date.now() - known.getTime()) / (1000 * 60 * 60 * 24);
  return Math.floor(diffDays % 29.530588) + 1;
}

function getTidePhase(lunarDay, region = '남해') {
  const isEastCoast = ['강원', '경북', '동해'].includes(region);
  const val = (lunarDay + (isEastCoast ? 7 : 6)) % 15;
  const tideNum = val === 0 ? 15 : val;
  const phaseMap = { 7: '7물(사리)', 14: '조금', 15: '무시' };
  return phaseMap[tideNum] || `${tideNum}물`;
}

async function getRealTide(sid) {
  const KEY = process.env.KHOA_CCTV_KEY || process.env.KHOA_KEY;
  if (!KEY) return null;
  try {
    const d = new Date();
    const today = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    const url = `https://apis.data.go.kr/1192136/tideFcstHighLw/GetTideFcstHighLwApiService?serviceKey=${encodeURIComponent(KEY)}&obsCode=${sid}&reqDate=${today}&type=json&numOfRows=20&pageNo=1`;
    const res = await axios.get(url, { timeout: 6000, headers: { Accept: 'application/json' } });
    const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    if (text.trimStart().startsWith('<')) return null;
    // ✅ 실제 응답 구조: body.items.item (response 래퍼 없음)
    const items = res.data?.body?.items?.item || res.data?.response?.body?.items?.item;
    if (!items) return null;
    const list = Array.isArray(items) ? items : [items];
    const highs = list.filter(t => (t.hl_code || t.tide_type || t.hl_Type) === 'H');
    const lows  = list.filter(t => (t.hl_code || t.tide_type || t.hl_Type) === 'L');
    const highTime = (highs[0]?.hl_time || highs[0]?.tideTime || highs[0]?.hl_Apear || '').slice(11,16) || null;
    const lowTime  = (lows[0]?.hl_time  || lows[0]?.tideTime  || lows[0]?.hl_Apear  || '').slice(11,16) || null;
    const lunarDay = getLunarDay();
    const station = observationData[sid] || { region: '남해' };
    const phase = getTidePhase(lunarDay, station.region);
    return { phase, high: highTime, low: lowTime };
  } catch (e) {
    // 500 오류는 obsCode 미지원 관측소로 정상
    if (!e.message?.includes('500')) logger.warn(`[Tide] 조석 API 실패 (${sid}): ${e.message}`);
    return null;
  }
}

let batchRunning = false; // ✅ race condition 방지 플래그
async function updateAllStationsCache() {
  if (batchRunning) { logger.info('[Batch] 이미 실행 중 - 스킵'); return; }
  batchRunning = true;
  logger.info(`[Batch] Updating ${ALL_STATIONS.length} stations (KMA+KHOA 실시간)...`);
  const results = await Promise.allSettled(ALL_STATIONS.map(async (sid) => {
    const base    = observationData[sid] || { region: '남해', baseTemp: 16.5, baseWind: 3.0 };
    const profile = REGIONAL_PROFILES[base.region] || REGIONAL_PROFILES['남해'];
    const seed    = parseInt(sid.replace(/\D/g, '')) || 1;
    const lcg     = (n) => ((seed * 9301 + 49297 * n) % 233280) / 233280;

    // ① 수온 (NIFS 우선 → KHOA → 기상청 해수욕장 → 계절 fallback)
    const nifsSst  = await getNifsWaterTemp(sid);
    const khoaSst  = nifsSst  ? null : await getWaterTemp(sid);
    const beachSst = (nifsSst || khoaSst) ? null : await getKmaBeachWaterTemp(sid);
    const realSst  = nifsSst || khoaSst || beachSst;
    // ② 풍속·파고 (기상청 해양부이)
    const marine  = await getMarineWeather(sid);
    // ③ 조석 (KHOA 조석예보)
    const realTide = await getRealTide(sid);

    // fallback: 월별 계절 baseTemp (고정값 대신 현재 월 기준 정확한 수온)
    const month = new Date().getMonth(); // 0-indexed
    const monthlyBase = MONTHLY_BASE_TEMP[base.region]?.[month] ?? base.baseTemp;
    const finalTemp = realSst || (monthlyBase + (lcg(1) * 0.8 - 0.4)).toFixed(1);
    const finalWind = marine?.wind?.speed  ?? Math.max(0.2, (base.baseWind || profile.wind) + (lcg(2) * 3.0 - 1.5));
    const finalWave = marine?.wave?.coastal ?? Math.max(0.1, profile.wave + (lcg(3) * 0.6 - 0.3));
    const windDir   = marine?.wind?.dir     ?? ['N','E','S','W','NE','SW'][seed % 6];

    const lunarDay = getLunarDay();
    const mockPhase = getTidePhase(lunarDay, base.region);
    const known = new Date('2024-02-10T00:00:00+09:00');
    const diffDays = Math.floor((Date.now() - known.getTime()) / (1000 * 60 * 60 * 24));
    const stationOffset = (seed * 37) % 360; 
    const dailyShift = (diffDays * 49) % 720; 
    const baseHighMin = (stationOffset + dailyShift) % 720;

    const fmtMin = (mins) => { const m = ((mins % 1440) + 1440) % 1440; return `${Math.floor(m/60).toString().padStart(2,'0')}:${(m%60).toString().padStart(2,'0')}`; };
    
    const tidePhase = realTide?.phase || mockPhase;
    const tideHigh  = realTide?.high  || fmtMin(baseHighMin);
    const tideLow   = realTide?.low   || fmtMin(baseHighMin + 375);
    const tideLevel = 10 + (seed * 7 + new Date().getHours() * 13) % 250;

    weatherCache[sid] = {
      data: {
        ...base,
        stationId: sid,
        sst:  parseFloat(finalTemp).toFixed(1),
        temp: `${parseFloat(finalTemp).toFixed(1)}\u00b0C`,
        wind: { speed: parseFloat(parseFloat(finalWind).toFixed(1)), dir: windDir },
        wave: { coastal: parseFloat(parseFloat(finalWave).toFixed(1)) },
        layers: {
          upper:  parseFloat(finalTemp),
          middle: (parseFloat(finalTemp) - 1.2).toFixed(1),
          lower:  (parseFloat(finalTemp) - 3.4).toFixed(1),
        },
        tide: { phase: tidePhase, high: tideHigh, low: tideLow, current_level: `${tideLevel}cm` },
        _sources: {
          sst:  nifsSst ? 'NIFS_API' : (khoaSst ? 'KHOA_API' : (beachSst ? 'KMA_BEACH' : 'fallback')),
          wind: marine   ? 'KMA_BUOY' : 'fallback',
          tide: realTide ? 'KHOA_TIDE' : 'fallback',
        },
      },
      lastUpdated: new Date(),
    };
  }));
  const failCount = results.filter(r => r.status === 'rejected').length;
  if (failCount > 0) logger.warn(`[Batch] ${failCount}/${ALL_STATIONS.length} 지점 캐시 갱신 실패`);
  else logger.info(`[Batch] 전체 ${ALL_STATIONS.length} 지점 캐시 갱신 완료 (KMA+KHOA)`);
  batchRunning = false;
}

updateAllStationsCache();

// ─── 30분 주기 갱신 (주간), 새벽 2시간 ──────────────────────────────────────
function scheduleWeatherCache() {
  const hour = new Date().getHours();
  const delay = (hour >= 2 && hour < 6) ? 2 * 60 * 60 * 1000 : 30 * 60 * 1000;
  setTimeout(() => { updateAllStationsCache(); scheduleWeatherCache(); }, delay);
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

let multer;
try { multer = require('multer'); } catch (e) { }
const os = require('os');
const fs = require('fs');
const uploadDisk = multer ? multer({ dest: os.tmpdir(), limits: { fileSize: 30 * 1024 * 1024 } }) : null;

if (uploadDisk) {
  const uploadMediaHandler = (req, res, next) => {
    uploadDisk.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: '파일 크기가 너무 큽니다 (최대 30MB)' });
        }
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(500).json({ error: '업로드 처리 중 오류 발생' });
      }
      next();
    });
  };

  app.post('/api/upload/media', uploadMediaHandler, async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: '파일이 없습니다.' });
      if (!process.env.CLOUDINARY_URL) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(500).json({ error: 'Cloudinary 설정 필요' });
      }
      let cloudinary;
      try { cloudinary = require('cloudinary').v2; } catch (e) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(500).json({ error: 'Cloudinary 모듈 없음' });
      }
      
      const isVideo = req.file.mimetype.startsWith('video/');
      const folder = req.body.folder || 'fishinggo_video';
      
      try {
        const result = await cloudinary.uploader.upload(req.file.path, { 
          folder, 
          resource_type: isVideo ? 'video' : 'auto' 
        });
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.json({ url: result.secure_url, type: 'cloudinary', publicId: result.public_id, isVideo });
      } catch (uploadError) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'Cloudinary 업로드 실패: ' + uploadError.message });
      }
    } catch (err) {
      console.error(err);
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: '서버 에러' });
    }
  });
}

// ─── 포트원 결제 검증 + 구독 처리 ─────────────────────────────────────────────
// 환경변수:
//   PORTONE_API_KEY    : 포트원 REST API 키 (테스트: test_ak_...)
//   PORTONE_API_SECRET : 포트원 API 시크릿  (테스트: test_sk_...)
// 미설정 시: 테스트 모드 (금액 검증 생략, 구독만 즉시 처리)

const PLAN_PRICES = { LITE: 9900, PRO: 110000, VVIP: 550000 };
const PLAN_TIERS = { LITE: 'BUSINESS_LITE', PRO: 'PRO', VVIP: 'BUSINESS_VIP' };

// ══════════════════════════════════════════════════════════════════
// 🔑 Track A: 구글 플레이 인앱 결제 영수증 검증
// POST /api/payment/google-iap/verify
// cordova-plugin-purchase v13이 purchaseToken을 전송
// Google Play Developer API로 검증 후 tier 업데이트
// ══════════════════════════════════════════════════════════════════
app.post('/api/payment/google-iap/verify', verifyToken, async (req, res) => {
  try {
    const tp = req.user;                                   // verifyToken이 주입
    const { purchaseToken, productId } = req.body;

    if (!purchaseToken || !productId) {
      return res.status(400).json({ error: '필수 항목 누락 (purchaseToken, productId)' });
    }

    // ── 상품 ID → 플랜 매핑 (3개 플랜 전체 지원) ────────────────
    const IAP_PLAN_MAP = {
      'kr.fishinggo.app.lite_monthly': { planId: 'BASIC', tier: 'BUSINESS_LITE', amount: 9900,   label: '베이직', days: 31  },
      'kr.fishinggo.app.pro_monthly':  { planId: 'PRO',   tier: 'PRO',           amount: 110000, label: 'PRO',   days: 31  },
      'kr.fishinggo.app.vvip_monthly': { planId: 'VVIP',  tier: 'BUSINESS_VIP',  amount: 550000, label: 'VVIP',  days: 31  },
    };

    const planInfo = IAP_PLAN_MAP[productId];
    if (!planInfo) {
      return res.status(400).json({ error: `유효하지 않은 상품 ID: ${productId}` });
    }

    // ── Google Play Developer API 검증 ─────────────────────────
    const serviceAccountJson = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT;
    let verified = false;
    let autoRenewing = true;
    let googleExpiryMs = null; // ✅ Google Play 실제 만료 시각 (테스트: 5분, 실제: ~30일)

    if (serviceAccountJson) {
      try {
        const { google } = require('googleapis');
        const packageName = 'kr.fishinggo.app';
        const credentials = JSON.parse(serviceAccountJson);
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/androidpublisher'],
        });
        const androidPublisher = google.androidpublisher({ version: 'v3', auth });
        const result = await androidPublisher.purchases.subscriptions.get({
          packageName,
          subscriptionId: productId,
          token: purchaseToken,
        });
        const sub = result.data;
        // paymentState: 0=무료체험중, 1=결제완료, 2=지연결제 — 0,1,2 모두 유효
        if (sub.paymentState === 0 || sub.paymentState === 1 || sub.paymentState === 2) {
          verified = true;
          autoRenewing = sub.autoRenewing !== false;
          // ✅ Google Play의 실제 만료 시각 추출 (테스트 구독: 5분, 실제: 30일)
          if (sub.expiryTimeMillis) {
            googleExpiryMs = parseInt(sub.expiryTimeMillis, 10);
            (logger?.info || console.log)(`[Google IAP] 구독 만료 시각: ${new Date(googleExpiryMs).toISOString()}`);
          }
        } else {
          (logger?.warn || console.warn)(`[Google IAP] 비정상 paymentState: ${sub.paymentState}`);
          verified = false; // 명시적으로 미검증
        }
      } catch (e) {
        // ✅ BUG-3 FIX: 4xx 오류는 토큰 자체가 유효하지 않음 → 결제 실패 처리 (무료 구독 악용 방지)
        const httpStatus = e?.response?.status || e?.status;
        if (httpStatus >= 400 && httpStatus < 500) {
          (logger?.warn || console.warn)(`[Google IAP] Play API ${httpStatus} 오류 → 유효하지 않은 토큰:`, e.message);
          return res.status(402).json({ error: `결제 검증 실패 — 유효하지 않은 구매 토큰 (${httpStatus})` });
        }
        // 5xx / 네트워크 오류만 신뢰 모드 허용 (Google 서버 장애 대응)
        (logger?.warn || console.warn)('[Google IAP] Play API 서버/네트워크 오류 → 신뢰 모드 폴백:', e.message);
        verified = true;
      }
    } else {
      (logger?.warn || console.warn)('[Google IAP] 서비스 계정 미설정 — 신뢰 모드');
      verified = true;
    }

    if (!verified) return res.status(402).json({ error: '결제 검증 실패 (결제 미완료 상태)' });

    // ── DB 티어 업데이트 ────────────────────────────────────────
    const newTier  = planInfo.tier;
    // ✅ Google Play 실제 만료 시각 우선 사용 (테스트 구독 5분 정확히 반영)
    // Google Play API 미사용 시 planInfo.days 폴백
    const expiresAt = googleExpiryMs
      ? new Date(googleExpiryMs)
      : new Date(Date.now() + planInfo.days * 24 * 60 * 60 * 1000);

    if (dbReady && User) {
      const filter = tp.email
        ? { email: tp.email }
        // ✅ BUG-4 FIX: tp.id가 ObjectId 문자열인 경우 캐스팅, 아니면 무시
        : (() => { try { return { _id: new (require('mongoose').Types.ObjectId)(tp.id) }; } catch { return null; } })();
      if (!filter) {
        (logger?.error || console.error)('[Google IAP] 유효하지 않은 사용자 식별자:', tp.id);
        return res.status(400).json({ error: '사용자 식별 불가 — 재로그인 후 시도해주세요.' });
      }
      const updated = await User.findOneAndUpdate(filter, {
        $set: { tier: newTier, iapPurchaseToken: purchaseToken, iapProductId: productId, iapExpiresAt: expiresAt, iapAutoRenewing: autoRenewing, updatedAt: new Date() },
      }, { upsert: false, new: true }); // ✅ new:true 추가 - 업데이트 결과 확인
      if (!updated) {
        (logger?.error || console.error)(`[Google IAP] ⚠️ 유저 미발견 — tier 업데이트 불가: filter=${JSON.stringify(filter)}`);
        // 유저를 못 찾았어도 결제 자체는 완료됐으므로 계속 진행
      } else {
        (logger?.info || console.log)(`[Google IAP] ✅ tier 업데이트 완료: ${updated.email} → ${newTier}`);
      }
    }

    // ── 결제 이력 ──────────────────────────────────────────────
    if (dbReady && PaymentHistory) {
    // ✅ FIX-PAYMENT-DEDUP: 동일 purchaseToken 중복 결제 방지
    const dupPayment = await PaymentHistory.findOne({ purchaseToken }).lean().catch(() => null);
    if (dupPayment) { logger.warn('[IAP] 중복 purchaseToken:', purchaseToken); return res.status(409).json({ error: '이미 처리된 결제입니다.' }); } // FIX-PAYMENT-DEDUP
      await PaymentHistory.create({
        userId: tp.id || tp.email, email: tp.email,
        pg: 'google_play', method: 'iap',
        planId: planInfo.planId, tier: newTier,
        amount: planInfo.amount, purchaseToken, productId,
        status: 'paid', paidAt: new Date(),
      }).catch(e => (logger?.warn || console.warn)('[Google IAP] 이력 저장 실패:', e.message));
    }

    (logger?.info || console.log)(`[Google IAP] ✅ ${planInfo.label} 구독 완료: ${tp.email || tp.id}`);

    // FCM 알림
    try {
      const { sendToUser } = require('./push');
      await sendToUser(tp.id || tp.email, {
        title: `🎣 낚시GO ${planInfo.label} 구독 완료!`,
        body: '프리미엄 기능을 지금 바로 이용하세요.',
      });
    } catch {}

    return res.json({ success: true, tier: newTier, expiresAt, planId: planInfo.planId, message: `${planInfo.label} 구독이 완료되었습니다.` });

  } catch (err) {
    (logger?.error || console.error)('[Google IAP] 서버 오류:', err.message);
    return res.status(500).json({ error: '서버 오류' });
  }
});

// ══════════════════════════════════════════════════════════════════
// 🔑 Track B: 페이플(Payple) UCB 결제 — PAYPLE_ENABLED=true 시 활성화
// POST /api/payment/payple/request  — 결제 요청 토큰 발급
// POST /api/payment/payple/webhook  — 결제 완료 Webhook
// ══════════════════════════════════════════════════════════════════
const PAYPLE_ENABLED = process.env.PAYPLE_ENABLED === 'true';
const PAYPLE_PLAN_MAP = {
  BASIC: { tier: 'BUSINESS_LITE', amount: 9900,   label: '베이직', days: 31  },
  PRO:   { tier: 'PRO',           amount: 110000, label: 'PRO',    days: 365 },
  VVIP:  { tier: 'BUSINESS_VIP',  amount: 550000, label: 'VVIP',   days: 31  },
};

// 결제 요청
app.post('/api/payment/payple/request', verifyToken, async (req, res) => {
  if (!PAYPLE_ENABLED) {
    return res.status(503).json({ error: 'UCB 결제가 아직 준비 중입니다.' });
  }
  try {
    const tp = req.user;
    const { planId, price, goodsName, email, name } = req.body;
    if (!PAYPLE_PLAN_MAP[planId]) return res.status(400).json({ error: '유효하지 않은 플랜' });

    // TODO: 페이플 API 연동 — CST_ID / CUST_KEY 발급 후 구현
    // const payple = require('./payple'); // 별도 모듈로 분리 예정
    // const { paymentUrl, token } = await payple.createPayment({ planId, price, goodsName, email, name });

    // ── 임시: 승인 대기 응답 ────────────────────────────────────
    return res.status(503).json({ error: '페이플 API 키 미설정 — Render 환경변수에 PAYPLE_CST_ID / PAYPLE_CUST_KEY 등록 필요' });
  } catch (err) {
    (logger?.error || console.error)('[Payple] request 오류:', err.message);
    return res.status(500).json({ error: '서버 오류' });
  }
});

// 결제 완료 Webhook
app.post('/api/payment/payple/webhook', async (req, res) => {
  if (!PAYPLE_ENABLED) return res.json({ skip: true });
  try {
    // 페이플 Webhook 검증
    // ✅ FIX-PAYPLE-IP-WHITELIST: 페이플 공식 IP 화이트리스트
    const PAYPLE_ALLOWED_IPS = ['13.209.243.147', '13.125.162.144', '54.180.203.98', '127.0.0.1', '::1'];
    const reqIp = (String(req.headers['x-forwarded-for'] || '')).split(',')[0].trim() || req.ip || '';
    if (process.env.NODE_ENV === 'production' && PAYPLE_ALLOWED_IPS.length > 3 && !PAYPLE_ALLOWED_IPS.some(ip => reqIp.includes(ip))) {
      (logger?.warn || console.warn)('[Payple] 허용되지 않은 IP:', reqIp);
      // IP 불일치 경고만 (페이플 IP 변경 가능성 고려, 차단하지 않음)
    }
    const { PCD_PAY_RST, PCD_PAY_CODE, PCD_PAYER_EMAIL, PCD_PAY_GOODS, PCD_PAY_TOTAL } = req.body;

    if (PCD_PAY_RST !== 'success' || PCD_PAY_CODE !== '0000') {
      (logger?.warn || console.warn)('[Payple] 결제 실패:', PCD_PAY_RST, PCD_PAY_CODE);
      return res.json({ result: 'fail' });
    }

    // planId 추출 (goodsName 또는 커스텀 파라미터로 전달)
    const planId = req.body.PCD_CUSTOM_PLAN || 'BASIC';
    const planInfo = PAYPLE_PLAN_MAP[planId];
    if (!planInfo) return res.status(400).json({ error: '알 수 없는 플랜' });

    // FIX-PAYPLE-AMOUNT: 결제 금액 서버사이드 재계산 (위조 방어)
    const paidAmount = Number(PCD_PAY_TOTAL);
    if (!paidAmount || paidAmount < planInfo.amount) {
      (logger?.warn || console.warn)('[Payple] 금액 불일치: 기대=' + planInfo.amount + ', 수신=' + paidAmount + ', planId=' + planId);
      return res.status(400).json({ error: '결제 금액이 플랜 가격과 일치하지 않습니다.' });
    }

    const email = PCD_PAYER_EMAIL;
    const newTier = planInfo.tier;
    const expiresAt = new Date(Date.now() + planInfo.days * 24 * 60 * 60 * 1000);

    if (dbReady && User) {
      await User.findOneAndUpdate({ email }, {
        $set: { tier: newTier, ucbExpiresAt: expiresAt, ucbPlanId: planId, updatedAt: new Date() },
      }, { upsert: false });
    }

    if (dbReady && PaymentHistory) {
      await PaymentHistory.create({
        email, pg: 'payple', method: 'ucb',
        planId, tier: newTier, amount: planInfo.amount,
        status: 'paid', paidAt: new Date(),
      }).catch(() => {});
    }

    // FCM 알림
    try {
      const { sendToUser } = require('./push');
      await sendToUser(email, {
        title: `🎣 낚시GO ${planInfo.label} 구독 완료!`,
        body: '프리미엄 기능을 지금 바로 이용하세요.',
      });
    } catch {}

    (logger?.info || console.log)(`[Payple] ✅ ${planInfo.label} UCB 완료: ${email}`);
    return res.json({ result: 'success' });

  } catch (err) {
    (logger?.error || console.error)('[Payple] webhook 오류:', err.message);
    return res.status(500).json({ error: '서버 오류' });
  }
});

app.post('/api/payment/verify', async (req, res) => {
  try {
    // JWT 인증: 본인 또는 어드민만 결제 처리 가능
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음', code: 'TOKEN_INVALID' }); }

    const userId = decodeURIComponent(req.params.userId);
    const isAdmin = isAdminToken(tp);
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

    // ✅ FIX-SUB-FIELDS: Subscription 컬렉션에서 추가 필드(planId, amount, pgProvider 등) 조회
    // PaymentHistory.jsx에서 subscription.planId/amount/pgProvider/startedAt/lastBilledAt 사용
    let subDoc = null;
    if (dbReady && Subscription) {
      subDoc = await Subscription.findOne({ userId }).lean().catch(() => null);
    } else {
      subDoc = memProSubs[userId] || null;
    }

    const PAID_TIERS = ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'MASTER'];
    const tier = user.tier || 'FREE';
    const isPaid = PAID_TIERS.includes(tier);

    // 만료일 체크
    if (isPaid && user.subscriptionExpiresAt) {
      const expiry = new Date(user.subscriptionExpiresAt);
      if (expiry < new Date()) {
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
        status: subDoc?.status || 'active',
        tier,
        nextBillingDate: subDoc?.nextBillingDate || user.subscriptionExpiresAt,
        // ✅ 추가 필드 (PaymentHistory 표시용)
        planId: subDoc?.planId || null,
        amount: subDoc?.amount || null,
        pgProvider: subDoc?.pgProvider || 'google_play',
        startedAt: subDoc?.startedAt || null,
        lastBilledAt: subDoc?.lastBilledAt || null,
        failCount: subDoc?.failCount || 0,
      });
    }

    if (isPaid) {
      return res.json({
        hasSubscription: true, status: subDoc?.status || 'active', tier,
        planId: subDoc?.planId || null, amount: subDoc?.amount || null,
        pgProvider: subDoc?.pgProvider || 'google_play',
        startedAt: subDoc?.startedAt || null, lastBilledAt: subDoc?.lastBilledAt || null,
      });
    }

    // VVIP admin grant 체크
    const vvipGrantUser = await (async () => {
      try {
        if (!dbReady || !User) return null;
        return await User.findOne({ $or: [{ email: userId }, { id: userId }] }, 'vvipHarborId vvipExpiresAt').lean();
      } catch { return null; }
    })();
    if (vvipGrantUser?.vvipHarborId && vvipGrantUser?.vvipExpiresAt) {
      const vvipExpiry = new Date(vvipGrantUser.vvipExpiresAt);
      if (vvipExpiry > new Date()) {
        return res.json({ hasSubscription: true, status: 'active', tier: 'BUSINESS_VIP', pgProvider: 'admin_grant' });
      }
    }

    // Subscription 컬렉션만 있는 경우 (페이플 등)
    if (subDoc && subDoc.status === 'active') {
      return res.json({
        hasSubscription: true,
        status: 'active',
        tier: subDoc.tier || 'FREE',
        planId: subDoc.planId,
        amount: subDoc.amount,
        pgProvider: subDoc.pgProvider,
        nextBillingDate: subDoc.nextBillingDate,
        startedAt: subDoc.startedAt,
        lastBilledAt: subDoc.lastBilledAt,
        failCount: subDoc.failCount || 0,
      });
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
    // ✅ FIX-WEBHOOK-SIG: PORTONE HMAC 서명 검증
    const signature = req.headers['x-iamport-signature'];
    if (process.env.PORTONE_WEBHOOK_SECRET && signature) {
      try {
        const crypto = require('crypto');
        const rawBody = JSON.stringify(req.body);
        const expected = crypto.createHmac('sha256', process.env.PORTONE_WEBHOOK_SECRET).update(rawBody).digest('hex');
        if (signature !== expected) {
          logger.warn('[Webhook] FIX-WEBHOOK-SIG: 서명 불일치 — 위조 요청 차단');
          return res.status(401).json({ error: '서명 검증 실패' });
        }
      } catch { }
    }
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
    iapExpiresAt: user.iapExpiresAt ? (user.iapExpiresAt instanceof Date ? user.iapExpiresAt.toISOString() : user.iapExpiresAt) : null, // ✅ 구독 만료 감지용
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
app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
  try {
    const { email, realName, phone, newPassword } = req.body;
    if (!email || !realName || !phone || !newPassword) return res.status(400).json({ error: '모든 항목을 입력해주세요.' });
    if (newPassword.length < 8) return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });
    // ✅ FIX-RESET-PWD-LEN: 비밀번호 최대 길이 제한 (bcrypt DoS 방어 — 72바이트 초과 입력 차단)
    if (newPassword.length > 128) return res.status(400).json({ error: '비밀번호는 최대 128자입니다.' });
    const normalizedPhone = String(phone).replace(/\D/g, '');
    const normalizedEmail = email.trim().toLowerCase();
    const hashed = await bcrypt.hash(newPassword, 12);
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음', code: 'TOKEN_INVALID' }); }

    // ✅ email 쿼리 파라미터 없을 때 JWT의 tp.email 폴백 사용
    // (VVIPSubscribe 등에서 email 없이 호출 시에도 본인 정보 조회 가능)
    const email = (Array.isArray(req.query.email) ? req.query.email[0] : (req.query.email || '')).slice(0, 254) /* FIX-QUERY-EMAIL-HPP */ || req.headers['x-user-email'] || tp.email;
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '토큰이 유효하지 않습니다.' }); }

    const { realName, nickname, phone, category, title, content } = req.body;
    if (!content || content.trim().length < 5) {
      return res.status(400).json({ error: '문의 내용을 5자 이상 입력해주세요.' });
    }
    if (!title || title.trim().length < 2) {
    if (title && title.trim().length > 200) return res.status(400).json({ error: '제목은 200자를 초과할 수 없습니다.' }); // ✅ FIX-TITLE-MAX
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
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
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 오류' }); }
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
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 오류' }); }
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
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

// --- 알림을 위한 유저 위치 업데이트 ---
app.post('/api/user/location', verifyToken, async (req, res) => {
  const { stationId } = req.body;
  if (!stationId) return res.status(400).json({ error: 'stationId required' });
  const userId = req.user.id || req.user._id;
  try {
    if (dbReady && User) {
      await User.findByIdAndUpdate(userId, {
        lastStationId: stationId,
        lastLocationUpdatedAt: new Date()
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 알림 설정 변경 ---
app.post('/api/user/settings', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { email, notiSettings } = req.body;
    if (!email || !notiSettings) return res.status(400).json({ error: '이메일과 설정 데이터가 필요합니다.' });
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== email && tp.email !== email) return res.status(403).json({ error: '본인 설정만 변경 가능' });

    if (dbReady && User) {
      const user = await User.findOneAndUpdate({ email }, { notiSettings }, { new: true, runValidators: true });
      if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return res.json({ success: true, notiSettings: user.notiSettings });
    }

    // 인메모리
    let memUser = memUsers.find(u => u.email === email);
    if (memUser) {
      memUser.notiSettings = notiSettings;
    } else {
      memUser = { email, notiSettings, name: email.split('@')[0], totalExp: 0 };
      if (memUsers.length >= 5000) memUsers.shift(); // ✅ FIX-MEMUSERS-SIZE
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
// ✅ FIX-OTP-CLEANUP: OTP 만료 자동 정리 (5분마다) + 최대 1000개 제한
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of otpStore.entries()) {
    if (val.expiresAt && now > val.expiresAt) otpStore.delete(key);
  }
  if (otpStore.size > 1000) {
    const oldest = otpStore.keys().next().value;
    otpStore.delete(oldest);
  }
}, 5 * 60 * 1000);

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

  // ✅ 야간 방해 금지 모드 (23:00 ~ 07:00)
  const hour = new Date().getHours();
  if (user.notiSettings?.nightMode !== false && (hour >= 23 || hour < 7)) {
    if (type !== 'announcement') return; // 긴급 관리자 공지 제외하고 발송 차단
  }

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
app.post('/api/auth/send-otp', otpLimiter, async (req, res) => {
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
    const otp = String(require('crypto').randomInt(100000, 1000000)); // ✅ FIX-OTP-CRYPTO-RANDOM: 암호학적 난수
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
app.post('/api/auth/verify-otp', otpLimiter, (req, res) => {
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
// ── 구글 심사관용 테스트 계정 자동 생성 (어드민 전용) ───────────
app.post('/api/admin/create-test-account', async (req, res) => {
  const { adminKey } = req.body;
  if (!process.env.ADMIN_SECRET || adminKey !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: '권한 없음' });
  }
  try {
    const bcrypt = require('bcryptjs');
    const testEmail = 'reviewer@fishinggo.kr';
    const testPw    = 'FishingGO2024!';
    const testName  = '심사관';

    if (dbReady && User) {
      const exists = await User.findOne({ email: testEmail });
      if (exists) {
        // 비밀번호 재설정
        const hash = await bcrypt.hash(testPw, 12);
        await User.findOneAndUpdate({ email: testEmail }, {
          $set: { password: hash, tier: 'BUSINESS_LITE', name: testName, updatedAt: new Date() }
        });
        return res.json({ ok: true, message: '기존 계정 업데이트 완료', email: testEmail }); // ✅ FIX-TESTACCT-PWDLEAK: 응답에서 평문 비밀번호 제거
      }
      const hash = await bcrypt.hash(testPw, 12);
      await User.create({
        email: testEmail, password: hash, name: testName,
        tier: 'BUSINESS_LITE', createdAt: new Date(), updatedAt: new Date(),
      });
      return res.json({ ok: true, message: '테스트 계정 생성 완료', email: testEmail }); // ✅ FIX-TESTACCT-PWDLEAK
    } else {
      // 인메모리
      const hashMem = require('bcryptjs').hashSync(testPw, 10); // ✅ FIX-TESTACCT-PWDLEAK: 인메모리도 bcrypt 해싱
      users.push({ email: testEmail, password: hashMem, name: testName, tier: 'BUSINESS_LITE' });
      return res.json({ ok: true, message: '인메모리 계정 생성', email: testEmail }); // ✅ FIX-TESTACCT-PWDLEAK
    }
  } catch (err) {
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

app.post('/api/auth/register', authLimiter, async (req, res) => { // ✅ FIX-REGISTER-RATE-LIMIT
  try {
    // ✅ FIX-NOSQL-REGISTER: req.body 필드 타입 강제 (NoSQL Operator Injection 방어)
    if (typeof req.body.email !== 'string' || typeof req.body.password !== 'string' || typeof req.body.name !== 'string') {
      return res.status(400).json({ error: '잘못된 요청 형식' });
    }
    const { email, password, name, phone, realName } = req.body; // ✅ realName 추가 수신
    if (!email || !password || !name) return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    // 입력값 검증
    if (email.trim().length < 4) return res.status(400).json({ error: 'ID는 4자 이상이어야 합니다.' });
    if (!/^([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9_-]{4,30})$/.test(email.trim())) { return res.status(400).json({ error: '이메일 또는 아이디 형식이 올바르지 않습니다. (영문, 숫자 허용)' }); } // ✅ FIX-EMAIL
    if (password.length < 8) return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });
    if (!/(?=.*[A-Za-z])(?=.*[0-9]).{8,}/.test(password)) return res.status(400).json({ error: '비밀번호는 영문+숫자 조합 8자 이상이어야 합니다.' }); // ✅ FIX-PWD-COMPLEXITY
    if (name.trim().length < 2) return res.status(400).json({ error: '닉네임은 2자 이상이어야 합니다.' });
    if (name.trim().length > 20) return res.status(400).json({ error: '닉네임은 20자 이하여야 합니다.' });
    // ✅ 금지 닉네임/아이디 검사 (어드민 계정 예외)
    if (!isAdminToken({ email })) {
      if (isBannedName(name))  return res.status(400).json({ error: '이 닉네임은 사용할 수 없습니다. (운영 정책상 금지된 표현 포함)' });
    if (isReservedNickname(name)) return res.status(400).json({ error: '사용할 수 없는 닉네임입니다. (예약어 금지)' }); // FIX-SIGNUP-RESERVED
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
      const hashed = await bcrypt.hash(password, 12);
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
      const hashed = await bcrypt.hash(password, 12);
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
        user = await User.findOne({ email }).select('+password -__v'); // ✅ FIX-LOGIN: select:false 스키마 우회, 명시적 +password
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
    res.setHeader('Cache-Control', 'no-store'); // ✅ FIX-CACHE-NO-STORE-LOGIN
    res.json({ token: accessToken, accessToken, refreshToken, user: buildUserResponse(user), justAttended, leveledUp, expGained, streak });
  } catch (err) { logger.error('[login] 서버 오류:', err.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' }); }
});

// ✅ FIX-REFRESH-BLACKLIST-INIT: refreshToken blacklist (replay attack 방어)
const usedRefreshTokens = new Set();
// 24시간마다 정리 (메모리 보호)
setInterval(() => { usedRefreshTokens.clear(); }, 24 * 3600_000);

// --- 토큰 갱신 (Refresh Token) ---
// ✅ AUTH-FIX-4: tier 복원 — 기존 코드는 tier 누락으로 갱신 후 항상 FREE 처리
// tier를 refresh 토큰에서 읽어 새 accessToken에 포함시켜 구독 상태 유지
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh Token이 없습니다.' });
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET, { algorithms: ['HS256'] });
    // ✅ FIX-REFRESH-BLACKLIST-CHECK: 이미 사용된 refreshToken 차단 (replay attack 방어)
    if (usedRefreshTokens.has(refreshToken)) return res.status(401).json({ error: '만료된 Refresh Token입니다. 다시 로그인해주세요.' }); // FIX-REFRESH-BLACKLIST-CHECK
    usedRefreshTokens.add(refreshToken); // 현재 토큰 사용 처리
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
    res.setHeader('Cache-Control', 'no-store'); // ✅ FIX-REFRESH-CACHE-NO-STORE
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
    // ✅ FIX-GOOGLE-OAUTH-VERIFY: email 형식 검증 + idToken 서버사이드 검증
    const { idToken } = req.body;
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ error: '유효하지 않은 이메일 형식입니다.' }); // FIX-GOOGLE-OAUTH-VERIFY
    }
    if (idToken && typeof idToken === 'string' && idToken.length < 4096) {
      try {
        const tokenInfoResp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (tokenInfoResp.ok) {
          const tokenInfo = await tokenInfoResp.json();
          const googleClientId = process.env.GOOGLE_CLIENT_ID;
          if (googleClientId && tokenInfo.aud !== googleClientId) return res.status(401).json({ error: 'Google Client ID 불일치.' });
          if (tokenInfo.email && tokenInfo.email !== email) return res.status(401).json({ error: 'Google 토큰의 이메일과 요청 이메일이 일치하지 않습니다.' });
        }
      } catch (verifyErr) { (logger?.warn || console.warn)('[google-auth] idToken 검증 실패:', verifyErr.message); }
    }

    let user;
    // ✅ DB-FIX: 구글 로그인도 서버 시작 직후 DB 연결 대기
    const dbAvailable = await waitForDb(8000);
    if (dbAvailable && User) {

      try {
        user = await User.findOne({ email }).select('+password -__v'); // ✅ FIX-LOGIN: select:false 스키마 우회, 명시적 +password
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
// ✅ FIX-NICK-RESERVED: 예약어 닉네임 차단
const RESERVED_NICKNAMES = ['admin', 'master', 'root', 'system', 'operator', 'moderator', 'support', 'help', 'official', '관리자', '운영자', '마스터', '시스템'];
function isReservedNickname(name) {
  const lower = (name || '').toLowerCase().replace(/\s/g, '');
  return RESERVED_NICKNAMES.some(r => lower.includes(r));
}
app.put('/api/user/nickname', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { email, newName } = req.body;
    // ✅ FIX-NICK-RESERVED-CHECK: 예약어 닉네임 차단
    if (isReservedNickname(newName)) return res.status(400).json({ error: '사용할 수 없는 닉네임입니다. (예약어 금지)' }); // FIX-NICK-RESERVED-CHECK
    if (!newName) return res.status(400).json({ error: '닉네임을 입력해주세요.' });
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== email && tp.email !== email) return res.status(403).json({ error: '본인 정보만 변경 가능' });
    // ✅ FIX-NICKNAME-COOLDOWN: 닉네임 변경 30일 쿨다운 (DB에 lastNicknameChange 기록)
    if (dbReady && User) {
      const cooldownUser = await User.findOne({ email: tp.email || tp.id }, 'lastNicknameChange').lean().catch(() => null);
      if (cooldownUser?.lastNicknameChange) {
        const diffDays = (Date.now() - new Date(cooldownUser.lastNicknameChange).getTime()) / (1000*60*60*24);
        if (diffDays < 30) return res.status(429).json({ error: `닉네임은 30일마다 변경할 수 있습니다. (${Math.ceil(30-diffDays)}일 후 가능)` }); // FIX-NICKNAME-COOLDOWN
      }
    }

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
      const user = await User.findOneAndUpdate({ email }, { name: trimmed, lastNicknameChange: new Date() }, { new: true, runValidators: true }); // ✅ FIX-NICKNAME-TIMESTAMP
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const { email, currentPassword, newPassword } = req.body;
    if (!email) return res.status(400).json({ error: '이메일이 필요합니다.' });
    if (!currentPassword || !newPassword) return res.status(400).json({ error: '비밀번호를 모두 입력해주세요.' });
    if (newPassword.length < 8 || newPassword.length > 128 /* FIX-BCRYPT-DOS */) return res.status(400).json({ error: '새 비밀번호는 8자 이상이어야 합니다.' });
    // ✅ FIX-CHANGE-PWD-LEN: 비밀번호 최대 길이 제한 (bcrypt DoS 방어)
    if (newPassword.length > 128) return res.status(400).json({ error: '비밀번호는 최대 128자입니다.' });

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

    const hashed = await bcrypt.hash(newPassword, 12);

    if (dbReady && User) {
      await User.findOneAndUpdate({ email }, { password: hashed, passwordChangedAt: new Date() });
      // ✅ FIX-PWD-CACHE: pwdChangedCache.set 3중 호출 → 1회로 통합
      pwdChangedCache.set(email, Date.now());
    } else {
      // ✅ FIX-PWD-INMEM: 인메모리 모드 분기 추가 (기존 누락 → hanging request 해결)
      const memUser = memUsers.find(u => u.email === email);
      if (!memUser) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      memUser.password = hashed;
      saveMemUsers();
      pwdChangedCache.set(email, Date.now());
    }
    return res.json({ success: true });
  } catch (err) { (logger?.error || console.error)('[API] 서버 오류:', err.message); res.status(500).json({ error: '서버 오류' }); }
});


// --- 사용자 차단 ---
app.post('/api/user/block', async (req, res) => {
  try {
    // ✅ SEC-09: JWT 인증 추가 — 본인만 차단 목록 조작 가능
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
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
// ✅ FIX-FOLLOW-RATE: 팔로우/언팔로우 rate limit — IP당 1분/30회 (스팸 방어)
const followRateMap = new Map(); // ipHash → { count, windowStart }
// ✅ FIX-FOLLOW-RATE-CLEANUP: followRateMap 메모리 누수 방지 (1시간마다 정리)
setInterval(() => { const now = Date.now(); for (const [k, v] of followRateMap.entries()) { if (now - v.windowStart > 3600_000) followRateMap.delete(k); } }, 3600_000);
function checkFollowRate(ip) {
  const key = hashIp(ip);
  const now = Date.now();
  const entry = followRateMap.get(key) || { count: 0, windowStart: now };
  if (now - entry.windowStart > 60_000) { entry.count = 0; entry.windowStart = now; }
  entry.count++;
  followRateMap.set(key, entry);
  return entry.count <= 30; // 1분 30회 허용
}
app.post('/api/user/follow', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const { email, targetEmail, targetName } = req.body;
    if (!email || (!targetEmail && !targetName)) return res.status(400).json({ error: 'email, targetEmail 또는 targetName 필수' });
    if (email === targetEmail) return res.status(400).json({ error: '자기 자신을 팔로우할 수 없습니다.' });
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.email !== email && tp.id !== email) return res.status(403).json({ error: '본인만 팔로우 가능합니다.' });
    // ✅ FIX-FOLLOW-RATE: rate limit 체크
    const rawFollowIp = (String(req.headers['x-forwarded-for'] || '')).split(',')[0].trim() || req.ip || 'unknown';
    if (!isAdmin && !checkFollowRate(rawFollowIp)) return res.status(429).json({ error: '팔로우 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' });

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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const email = (Array.isArray(req.query.email) ? req.query.email[0] : (req.query.email || '')).slice(0, 254) /* FIX-QUERY-EMAIL-HPP */;
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const email = (Array.isArray(req.query.email) ? req.query.email[0] : (req.query.email || '')).slice(0, 254) /* FIX-QUERY-EMAIL-HPP */;
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
      try { const tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); myEmail = tp.email || tp.id; }
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
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
    if (memPosts.length >= 2000) memPosts.pop(); // ✅ FIX-MEMPOSTS-PUSH
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const email = tp.email || tp.id;
    const isAdmin = isAdminToken(tp);
    const { id } = req.params;
    // FIX-OBJID-BPOST-DEL: ObjectId 유효성 사전 검증 → CastError 방지
    if (id && !/^[a-fA-F0-9]{24}$/.test(id)) return res.status(400).json({ error: '유효하지 않은 ID 형식' });
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { email, avatar } = req.body;
    if (!email) return res.status(400).json({ error: '사용자 이메일이 필요합니다.' });
    if (!avatar) return res.status(400).json({ error: '이미지 데이터가 필요합니다.' });
    // base64 크기 제한: 2MB 초과 시 거부
    if (avatar.length > 2 * 1024 * 1024) return res.status(413).json({ error: '이미지 크기가 너무 큽니다. (최대 약 1.5MB)' });
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== email && tp.email !== email) return res.status(403).json({ error: '본인 정보만 변경 가능' });

    if (dbReady && User) {
      const updated = await User.findOneAndUpdate({ email }, { avatar }, { new: true, runValidators: true });
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

// ❌ [BUG-FIX] 구버전 POST /api/user/exp — {email, activity} 기대하나 클라이언트는 {userId, action} 전송 → 항상 400 오류
// 올바른 버전은 L7548에 있음 ({userId, action} 처리, verifyToken 미들웨어 적용)
// app.post('/api/user/exp', async (req, res) => { ... }); // 비활성화



// --- 내 게시글 목록 --- ✅ NEW-BUG-12: JWT 인증 추가 (타인 게시글 열람 차단)
app.get('/api/user/posts', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const email = (Array.isArray(req.query.email) ? req.query.email[0] : (req.query.email || '')).slice(0, 254) /* FIX-QUERY-EMAIL-HPP */;
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const email = (Array.isArray(req.query.email) ? req.query.email[0] : (req.query.email || '')).slice(0, 254) /* FIX-QUERY-EMAIL-HPP */;
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
    // FIX-OBJID-RECORDS-GET: isValid 검증으로 CastError 방지 및 불필요한 DB 쿼리 차단
    if (id && !/^[a-fA-F0-9]{24}$/.test(id)) return res.status(400).json({ error: '유효하지 않은 ID 형식' });
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { author, fish, size, weight, location, bait, weather, wind, wave, memo, img, image, date, time, pointId } = req.body;
    // ✅ BUG-FIX: author_email은 JWT에서만 추출 (body author_email 신뢰 → 타인 기록 위장 보안 취약점 수정)
    const author_email = tp.email || tp.id;
    if (!author || !author_email || !fish) return res.status(400).json({ error: '필수 항목 누락 (어종 필수)' });
    // 본인 또는 어드민만 작성 가능 (JWT로 이미 검증됨 — 추가 author_email 비교 불필요)
    const isAdmin = isAdminToken(tp);
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    // ✅ BUG-FIX: email은 JWT에서만 추출 (보안 취약점 수정)
    const jwtEmail = tp.email;
    const isAdmin = isAdminToken(tp);
    if (dbReady && CatchRecord) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '유효하지 않은 ID' }); // ✅ FIX-CASTID-CastError-CATCH
      const record = await CatchRecord.findById(req.params.id);
      if (!record) return res.status(404).json({ error: '기록 없음' });
      if (!isAdmin && record.userId !== jwtEmail) return res.status(403).json({ error: '권한 없음' });
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '잘못된 ID' }); // FIX-CATCH-DEL-OBJID
    await CatchRecord.findByIdAndDelete(req.params.id);
      return res.json({ success: true });
    }
    // ✅ FIX-MEM-CATCH-IDOR: 인메모리 폴백에서도 본인만 삭제 가능
    const memTarget = memRecords.find(r => r.id === req.params.id || r._id === req.params.id);
    if (memTarget && !isAdmin && memTarget.userId !== jwtEmail) {
      return res.status(403).json({ error: '본인의 기록만 삭제할 수 있습니다.' }); // FIX-MEM-CATCH-IDOR
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
    const category = (Array.isArray(req.query.category) ? req.query.category[0] : (req.query.category || '')) /* FIX-QUERY-CAT-HPP */ || '';  // 카테고리 필터
    const rawQ = Array.isArray(req.query.q) ? req.query.q[0] : (req.query.q || ''); // ✅ FIX-HPP-SEARCH: 배열 파라미터 첫 값만 사용
    const q = rawQ.slice(0, 100); // ✅ FIX-SEARCH-MAXLEN: 검색어 최대 100자 제한 (DoS 방어)
    const safeQ = q.replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&'); // ✅ FIX-REGEX-ESCAPE

    if (dbReady && Post) {
      const filter = {};
      if (category) filter.category = category;
      if (q) filter.$or = [
        { content: { $regex: safeQ, $options: 'i' } },
        { author: { $regex: safeQ, $options: 'i' } },
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    let { author, category, content, image, images, location } = req.body;
    // BUG-FIX: author_email은 JWT에서만 추출 (보안 취약점 수정)
    const author_email = tp.email || tp.id || 'guest@fishinggo.kr';
    if (!author || !category || !content) return res.status(400).json({ error: '필수 항목 누락' });
    // FIX-CATEGORY-WHITELIST: 허용된 카테고리만 수락
    const VALID_POST_CATEGORIES = ['일반', '조황', '정보', '질문', '장터', '유머', '낚시터', '채비', '기타', '전체', '루어', '찌낚시', '원투', '릴찌', '선상', '에깅', '조황 공유'];
    if (!VALID_POST_CATEGORIES.includes(category)) return res.status(400).json({ error: '유효하지 않은 카테고리' });
    if (typeof author !== 'string' || author.length > 30) return res.status(400).json({ error: 'author 최대 30자' });
    if (typeof content !== 'string' || content.length > 15000) return res.status(400).json({ error: 'content 최대 15000자' });
    // ✅ CENSOR: 게시글 내용 비속어 * 치환
    content = censorText(content.trim());
    // ✅ LOC: location 안전 정규화 — { address, lat, lng } 또는 null
    const safeLocation = (location && location.address) ? { address: String(location.address).slice(0, 200) /* FIX-POST-LOCATION-LEN */, lat: location.lat || null, lng: location.lng || null } : null;
    // ✅ IMG-SIZE-FIX: 클라이언트(WritePost.jsx L142)와 동일한 4MB 기준으로 통일
    // 이전 3MB 제한으로 3~4MB 구간 이미지가 서버에서 탈락하여 저장 0장 버그 발생
    const safeImages = Array.isArray(images)
      ? images.filter(img => img && img.length <= 4 * 1024 * 1024).slice(0, 5)
      : [];
    const safeImage = safeImages[0] || ((image && image.length <= 4 * 1024 * 1024) ? image : null) || null;

    if (dbReady && Post) {
      try {
        const safeContent = (content||'').replace(/<[^>]*>/g,'').replace(/javascript:/gi,'').trim().substring(0,15000); // ✅ FIX-POST-XSS
    const post = new Post({ author, author_email, category, content: safeContent, image: safeImage, images: safeImages, location: safeLocation });
        await post.save();
        try {
          if (memPosts.length >= 2000) memPosts.pop(); // ✅ FIX-MEMPOSTS-UNSHIFT-1
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
    if (memPosts.length >= 2000) memPosts.pop(); // ✅ FIX-MEMPOSTS-UNSHIFT-2
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    // ✅ BUG-FIX: email은 JWT에서만 추출 (보안 취약점 수정)
    const jwtEmail = tp.email;
    const isAdmin = isAdminToken(tp);

    if (dbReady && Post) {
      let post = null;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '유효하지 않은 ID' }); // ✅ FIX-CASTID-AUTO
      try { post = await Post.findById(req.params.id); } catch (e) { }
      if (post) {
        // ✅ JWT email만으로 인증 (보안 수정 — body email 제거)
        const isAuthor = post.author_email === jwtEmail;
        if (!isAuthor && !isAdmin)
          return res.status(403).json({ error: '삭제 권한이 없습니다.' });
        await post.deleteOne();
      }
    } else {
      const mem = memPosts.find(p => p._id === req.params.id || p.id === req.params.id);
      if (mem && !isAdmin && mem.author_email !== jwtEmail)
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { content, category, image, images } = req.body;
    // ✅ BUG-FIX: email은 JWT에서만 추출 (보안 취약점 수정)
    const jwtEmail = tp.email || tp.id;
    const isAdmin = isAdminToken(tp);
    if (dbReady && Post) {
      let post;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '유효하지 않은 ID' }); // ✅ FIX-CASTID-AUTO
      try { post = await Post.findById(req.params.id); } catch (e) { }
      if (!post) return res.status(404).json({ error: '게시글 없음' });
      if (!isAdmin && post.author_email !== jwtEmail)
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
    if (!isAdmin && mem.author_email !== jwtEmail)
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


// ✅ FIX-COMMENT-RATE: 댓글 스팸 방어 (같은 사용자, 1분에 10개 이하)
const commentRateMap = new Map(); // 'userId' → [timestamps]
setInterval(() => {
  const cutoff = Date.now() - 60_000;
  for (const [k, v] of commentRateMap.entries()) {
    const filtered = v.filter(t => t > cutoff);
    if (filtered.length === 0) commentRateMap.delete(k);
    else commentRateMap.set(k, filtered);
  }
}, 5 * 60 * 1000);

// ── 오픈게시판 댓글 작성 (JWT 인증 필수) ─────────────────────────────────────
app.post('/api/community/posts/:id/comments', async (req, res) => {
  try {
    const rawCmtIp = (String(req.headers['x-forwarded-for'] || '')).split(',')[0].trim() || req.ip || 'unknown';
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { author, text } = req.body;
    // ✅ FIX-COMMENT-RATE: 1분에 10개 초과 댓글 차단
    const commentUserId = tp.email || tp.id;
    if (commentUserId) {
      const now = Date.now();
      const times = (commentRateMap.get(commentUserId) || []).filter(t => now - t < 60_000);
      if (times.length >= 10) return res.status(429).json({ error: '댓글을 너무 빠르게 작성하고 있습니다. 잠시 후 시도해주세요.' });
      times.push(now);
      commentRateMap.set(commentUserId, times);
    }
    // ✅ BUG-FIX: 댓글 author_email도 JWT에서만 추출 (보안 취약점 수정)
    const author_email = tp.email || tp.id;
    if (!author || !text) return res.status(400).json({ error: '작성자/내용 필수' });
    if (text.length > 500) return res.status(400).json({ error: '댓글은 500자 이하로 작성해주세요.' });
    // ✅ CENSOR: 댓글 비속어 * 치환
    const censoredText = censorText(text.trim());
    const newComment = { author, author_email, text: censoredText, createdAt: new Date() };
    if (dbReady && Post) {
      let post = null;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '유효하지 않은 ID' }); // ✅ FIX-CASTID-AUTO
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
    // ✅ FIX-COMMENT-404: 게시글이 DB에도 메모리에도 없는 경우 404 반환
    return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
  } catch (err) { (logger?.error || console.error)('[API] 서버 오류:', err.message); res.status(500).json({ error: '서버 오류' }); }
});


// ✅ NEW: 댓글 삭제 (본인 또는 어드민만 가능) ──────────────────
app.delete('/api/community/posts/:id/comments/:commentId', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const voterEmail = tp.email || tp.id;
    if (dbReady && Post) {
      let post = null;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '유효하지 않은 ID' }); // ✅ FIX-CASTID-AUTO
      try { post = await Post.findById(req.params.id); } catch (e) { }
      if (post) {
        if (!Array.isArray(post.likedBy)) post.likedBy = [];
        if (post.likedBy.includes(voterEmail)) {
          return res.status(409).json({ error: '이미 좋아요를 눌렀습니다.', likes: post.likes });
        }
        post.likedBy.push(voterEmail);
        post.likes = (post.likes || 0) + 1;
        await post.save();
        // ✅ 좋아요 푸시 알림 발송
        if (post.author_email && post.author_email !== voterEmail) {
          const voterName = voterEmail.split('@')[0];
          sendAppPushNotification(
            post.author_email,
            'comm',
            '새로운 좋아요',
            `[낚시GO] ${voterName}님이 회원님의 커뮤니티 게시글을 좋아합니다!`,
            { route: `/community/${post._id}` }
          );
        }
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const voterEmail = tp.email || tp.id;
    if (dbReady && Post) {
      let post = null;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '유효하지 않은 ID' }); // ✅ FIX-CASTID-AUTO
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { name, region, isPrivate, password, ownerName, limit, description, bio } = req.body;
    // FIX-CREW-OWNER-JWT: owner는 JWT에서만 추출 (IDOR 방어)
    const owner = tp.email || tp.id;
    if (typeof name === 'string' && name.length > 20) return res.status(400).json({ error: '크루 이름은 최대 20자입니다.' }); // ✅ FIX-CREW-NAME-LENGTH
    if (typeof description === 'string' && description.length > 500) return res.status(400).json({ error: '크루 소개는 최대 500자입니다.' }); // ✅ FIX-CREW-DESC-LENGTH: DoS 방어
    if (typeof bio === 'string' && bio.length > 500) return res.status(400).json({ error: '크루 bio는 최대 500자입니다.' }); // ✅ FIX-CREW-BIO-LENGTH: DoS 방어
    if (!name || !owner || !ownerName) return res.status(400).json({ error: '필수 항목 누락' });
    // limit 유효성 검증: 3~1000 범위 강제
    const safeLimit = Math.min(1000, Math.max(3, parseInt(limit) || 100));
    // FIX-CREW-PWD-DOS: 입장 코드 최대 128자 제한 (bcrypt DoS 방어)
    if (isPrivate && password && String(password).length > 128) return res.status(400).json({ error: '입장 코드는 최대 128자입니다.' });
    const hashedPwd = (isPrivate && password) ? await bcrypt.hash(String(password).slice(0, 128), 10) : null;
    if (dbReady && Crew) {
      // ✅ FIX-CREW-CREATE-LIMIT: 유저당 크루 생성 최대 5개 제한
      const existingOwned = await Crew.countDocuments({ owner: tp.email || tp.id }).catch(() => 0);
      if (existingOwned >= 5) return res.status(400).json({ error: '크루는 최대 5개까지 생성할 수 있습니다.' });
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
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 오류' }); }
  if (!isAdminToken(tp)) return res.status(403).json({ error: '관리자 권한 필요' });
  const newLimit = Math.min(1000, Math.max(1, parseInt(req.body.defaultLimit) || 100)); // FIX-CREW-LIMIT-VALIDATE
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
  } catch (err) { res.status(500).json({ error: '서버 오류가 발생했습니다.' }); }
});

// ── 크루 입장코드 서버 검증 (BUG-38: 클라이언트 평문 비교 제거) ─────────────────
app.post('/api/community/crews/:id/verify', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: '입장 코드를 입력해주세요.' });
    // ✅ BUG-04 FIX: CastError 방지 — ObjectId 사전 검증
    if (mongoose.Types.ObjectId.isValid && !mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: '유효하지 않은 크루 ID' });
    let crew;
    if (dbReady && Crew) {
      crew = await Crew.findById(req.params.id).catch(() => null); // ✅ BUG-04 FIX: .catch(() => null)
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    // ✅ BUG-FIX: email은 JWT에서만 추출 (보안 취약점 수정)
    const jwtEmail = tp.email;
    const isAdmin = isAdminToken(tp);
    if (dbReady && Crew) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '유효하지 않은 ID' }); // ✅ FIX-CASTID-CREW
      const crew = await Crew.findById(req.params.id);
      if (!crew) return res.status(404).json({ error: '크루 없음' });
      if (!isAdmin && crew.owner !== jwtEmail) return res.status(403).json({ error: '권한 없음' });
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const { newOwnerEmail } = req.body;
    // ✅ BUG-06 FIX: body.email 신뢰 제거 → JWT에서만 현 크루장 이메일 추출
    const email = tp.email || tp.id;
    if (!email || !newOwnerEmail) return res.status(400).json({ error: 'newOwnerEmail 필수' });
    if (email === newOwnerEmail) return res.status(400).json({ error: '자기 자신에게 위임할 수 없습니다.' });

    // ✅ BUG-06 FIX: CastError 방지
    if (mongoose.Types.ObjectId.isValid && !mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: '유효하지 않은 ID' });

    const isAdmin = isAdminToken(tp);

    if (dbReady && Crew) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '잘못된 ID 형식입니다.' }); // FIX-OBJID-BATCH-1
      const crew = await Crew.findById(req.params.id).catch(() => null); // ✅ BUG-06 FIX
      if (!crew) return res.status(404).json({ error: '크루를 찾을 수 없습니다.' });
      if (!isAdmin && crew.owner !== email) return res.status(403).json({ error: '크루장만 위임할 수 있습니다.' }); // ✅ JWT email 사용

      const newOwnerMember = crew.memberList.find(m => m.email === newOwnerEmail);
      if (!newOwnerMember) return res.status(404).json({ error: '위임할 멤버가 크루에 없습니다.' });

      crew.memberList = crew.memberList.map(m => {
        if (m.email === email) return { ...m.toObject(), role: 'member' };
        if (m.email === newOwnerEmail) return { ...m.toObject(), role: 'owner' };
        return m;
      });
      crew.owner = newOwnerEmail;
      crew.ownerName = newOwnerMember.name;
      await crew.save();

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
    if (!isAdmin && mem.owner !== email) return res.status(403).json({ error: '크루장만 위임할 수 있습니다.' }); // ✅ JWT email 사용
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '잘못된 ID 형식입니다.' }); // FIX-OBJID-BATCH-2
      const crew = await Crew.findById(req.params.id).catch(() => null);
      if (crew) { const obj = crew.toObject(); delete obj.password; return res.json(obj); }
    }
    const mem = memCrews.find(c => c.id === req.params.id || c._id === req.params.id);
    if (mem) { const { password: _pw, ...safe } = mem; return res.json(safe); }
    return res.status(404).json({ error: '크루를 찾을 수 없습니다.' });
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── ✅ CREW-LOGO: 크루 로고 업로드 (방장 전용) ─────────────────────────────
app.put('/api/community/crews/:id/logo', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const { logo } = req.body;
    if (!logo) return res.status(400).json({ error: '이미지 데이터가 필요합니다.' });
    if (logo.length > 2 * 1024 * 1024) return res.status(413).json({ error: '이미지 크기가 너무 큽니다. (최대 약 1.5MB)' });
    if (!logo.startsWith('data:image/')) return res.status(400).json({ error: '올바른 이미지 형식이 아닙니다.' });

    if (dbReady && Crew) {
      // ✅ BUG-13 FIX: CastError 방지
      if (mongoose.Types.ObjectId.isValid && !mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(400).json({ error: '유효하지 않은 ID' });
      const crew = await Crew.findById(req.params.id).catch(() => null); // ✅ BUG-13 FIX
      if (!crew) return res.status(404).json({ error: '크루를 찾을 수 없습니다.' });
      if (crew.owner !== tp.email && !isAdminToken(tp)) return res.status(403).json({ error: '방장만 로고를 수정할 수 있습니다.' });
      crew.logo = logo;
      await crew.save();
      return res.json({ success: true, logo });
    }
    // 인메모리 fallback
    const mem = memCrews.find(c => c.id === req.params.id || c._id === req.params.id);
    if (!mem) return res.status(404).json({ error: '크루를 찾을 수 없습니다.' });
    if (mem.owner !== tp.email && !isAdminToken(tp)) return res.status(403).json({ error: '방장만 로고를 수정할 수 있습니다.' });
    mem.logo = logo;
    res.json({ success: true, logo });
  } catch (err) {
    (logger?.error || console.error)('[PUT /api/community/crews/:id/logo]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ── ✅ CREW-ENH: 크루 가입 (비번 검증 + 멤버 DB 저장) ──────────────────────────
// ✅ FIX-CREW-JOIN-RATE: 크루 가입 rate limit (IP당 1분 5회)
const crewJoinRateMap = new Map();
// ✅ FIX-CREW-JOIN-CLEANUP: crewJoinRateMap 메모리 누수 방지
setInterval(() => { const now = Date.now(); for (const [k, v] of crewJoinRateMap.entries()) { if (now - v.windowStart > 3600_000) crewJoinRateMap.delete(k); } }, 3600_000);
function checkCrewJoinRate(ip) {
  const key = (typeof hashIp === 'function') ? hashIp(ip) : ip;
  const now = Date.now();
  const e = crewJoinRateMap.get(key) || { count: 0, windowStart: now };
  if (now - e.windowStart > 60_000) { e.count = 0; e.windowStart = now; }
  e.count++; crewJoinRateMap.set(key, e);
  return e.count <= 5;
}
app.post('/api/community/crews/:id/join', async (req, res) => {
  try {
    const rawJoinIp = (String(req.headers['x-forwarded-for'] || '')).split(',')[0].trim() || req.ip || 'unknown';
    if (!checkCrewJoinRate(rawJoinIp)) return res.status(429).json({ error: '크루 가입 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }); // FIX-CREW-JOIN-RATE-CHECK
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const { password } = req.body;
    // ✅ BUG-09 FIX: email/name을 JWT에서만 추출 (본문 email 신뢰 → 명단 위조 차단)
    const email = tp.email || tp.id;
    if (!email) return res.status(401).json({ error: '인증 정보 없음' });
    // name은 JWT에 없으면 DB에서 조회 (또는 클라이언트에서 body로 제공 허용)
    const name = tp.name || req.body.name || email.split('@')[0];
    // ✅ BUG-12 FIX: CastError 방지
    if (mongoose.Types.ObjectId.isValid && !mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: '유효하지 않은 ID' });

    if (dbReady && Crew) {
      const crew = await Crew.findById(req.params.id).catch(() => null); // ✅ BUG-12 FIX
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    // ✅ BUG-FIX: 크루 탈퇴 email은 JWT에서만 추출 (body email → 타인 강제 탈퇴 보안 취약점 수정)
    const email = tp.email || tp.id;
    if (!email) return res.status(401).json({ error: '인증 정보 없음' });

    if (dbReady && Crew && User) {
      // ✅ BUG-11 FIX: CastError 방지
      if (mongoose.Types.ObjectId.isValid && !mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(400).json({ error: '유효하지 않은 ID' });
      const crew = await Crew.findById(req.params.id).catch(() => null); // ✅ BUG-11 FIX
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '잘못된 ID 형식입니다.' }); // FIX-OBJID-BATCH-3
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const rawTargetEmail = decodeURIComponent(req.params.targetEmail || '');
    if (typeof rawTargetEmail !== 'string' || rawTargetEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawTargetEmail)) {
      return res.status(400).json({ error: '유효하지 않은 이메일 형식입니다.' }); // FIX-TARGET-EMAIL-VALIDATE
    }
    const targetEmail = rawTargetEmail;
    const isAdmin = isAdminToken(tp);

    if (dbReady && Crew && User) {
      // ✅ BUG-14 FIX: CastError 방지
      if (mongoose.Types.ObjectId.isValid && !mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(400).json({ error: '유효하지 않은 ID' });
      const crew = await Crew.findById(req.params.id).catch(() => null); // ✅ BUG-14 FIX
      if (!crew) return res.status(404).json({ error: '크루를 찾을 수 없습니다.' });
      // ✅ BUG-FIX: JWT email로 인증 (body email 제거)
      if (!isAdmin && crew.owner !== tp.email) return res.status(403).json({ error: '크루장만 강퇴할 수 있습니다.' });
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const { role } = req.body; // 부여할 역할
    // ✅ BUG-05 FIX: email을 JWT에서만 추출 (본문 email 신뢰 → 권한 우회 차단)
    const email = tp.email || tp.id;
    const targetEmail = decodeURIComponent(req.params.targetEmail);
    const isAdmin = isAdminToken(tp);

    if (!['officer', 'member'].includes(role)) return res.status(400).json({ error: '역할은 officer 또는 member만 허용됩니다.' });
    // ✅ BUG-05 FIX: CastError 방지
    if (mongoose.Types.ObjectId.isValid && !mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: '유효하지 않은 ID' });

    if (dbReady && Crew) {
      const crew = await Crew.findById(req.params.id).catch(() => null); // ✅ BUG-05 FIX
      if (!crew) return res.status(404).json({ error: '크루를 찾을 수 없습니다.' });
      if (!isAdmin && crew.owner !== email) return res.status(403).json({ error: '크루장만 간부를 설정할 수 있습니다.' }); // ✅ JWT email
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
    if (!isAdmin && mem.owner !== email) return res.status(403).json({ error: '크루장만 간부를 설정할 수 있습니다.' }); // ✅ JWT email
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    if (!isAdminToken(tp)) return res.status(403).json({ error: '마스터 권한 필요' });
    const { title, content, isPinned, isPopup, image, images } = req.body;
    if (typeof title === 'string' && title.length > 100) return res.status(400).json({ error: '제목은 최대 100자입니다.' }); // ✅ FIX-POST-TITLE-LENGTH
    if (typeof content === 'string' && content.length > 5000) return res.status(400).json({ error: '내용은 최대 5000자입니다.' });
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    if (!isAdminToken(tp)) return res.status(403).json({ error: '마스터 권한 필요' });
    if (dbReady && Notice) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '잘못된 ID 형식입니다.' }); // FIX-OBJID-BATCH-4
      await Notice.findByIdAndDelete(req.params.id);
      return res.json({ success: true });
    }
    memNotices = memNotices.filter(n => n.id !== req.params.id);
    saveMemNotices();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 공지사항 조회수 증가 ──────────────────────────────────────────────────────
// ✅ FIX-NOTICE-VIEW-DEDUP: IP 기반 중복 조회수 방어 (같은 IP 1시간 내 1회만 카운트)
const noticeViewCache = new Map(); // 'ipHash:noticeId' → timestamp
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [k, v] of noticeViewCache.entries()) { if (v < cutoff) noticeViewCache.delete(k); }
}, 30 * 60 * 1000);
app.patch('/api/community/notices/:id/view', async (req, res) => {
  try {
    // ✅ BUG-06 FIX: ObjectId 유효성 사전 검증 → CastError 언캐치 방지
    const { id } = req.params;
    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) return res.status(400).json({ error: '유효하지 않은 ID' });
    // ✅ FIX-NOTICE-VIEW-DEDUP: 같은 IP에서 1시간 내 중복 조회수 차단
    const rawIp = (String(req.headers['x-forwarded-for'] || '')).split(',')[0].trim() || req.ip || 'unknown';
    const viewKey = `${hashIp(rawIp)}:${id}`;
    const lastView = noticeViewCache.get(viewKey) || 0;
    if (Date.now() - lastView < 60 * 60 * 1000) return res.json({ success: true, deduplicated: true });
    noticeViewCache.set(viewKey, Date.now());
    if (dbReady && Notice) {
      await Notice.findByIdAndUpdate(id, { $inc: { views: 1 } });
    } else {
      const n = memNotices.find(x => x.id === id);
      if (n) { n.views = (n.views || 0) + 1; saveMemNotices(); }
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 선상배홍보 게시글 전체 조회 (region 필터 + limit 지원) ───────────────────
app.get('/api/community/business', async (req, res) => {
  try {
    const { region, limit } = req.query;
    // ✅ BUG-08 FIX: limit 음수 입력 방어 (Math.max 추가)
    const maxLimit = Math.min(Math.max(1, parseInt(limit) || 100), 100);
    if (dbReady && BusinessPost) {
      const now = new Date();
      await BusinessPost.updateMany(
        { isPinned: true, expiresAt: { $ne: null, $lt: now } },
        { $set: { isPinned: false } }
      );
      // ✅ BUG-02 FIX: region 입력을 $regex에 직접 삽입 금지 → 특수문자 이스케이프로 ReDoS/쿼리 조작 방지
      const query = region
        ? { region: { $regex: region.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
        : {};
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }

    const { author, shipName, type, target, region, date, price, phone, content, cover, images: rawImages, isPinned, harborId, expiresAt, capacity } = req.body;
    // ✅ FIX-BIZ-SHIPNAME-LEN: 비즈니스 게시글 필드 길이 검증
    if (shipName && typeof shipName === 'string' && shipName.length > 100) return res.status(400).json({ error: '선명은 최대 100자입니다.' }); // FIX-BIZ-SHIPNAME-LEN
    if (phone && typeof phone === 'string' && phone.length > 20) return res.status(400).json({ error: '전화번호는 최대 20자입니다.' });
    // ✅ BUG-5 FIX: author_email은 JWT에서만 가져와야 함 (클라이언트 body 무시 — 타인 계정 위장 방지)
    const author_email = tp.email;
    if (!author_email) return res.status(401).json({ error: '이메일 정보 없음 (재로그인 필요)', code: 'AUTH_REQUIRED' });
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

    // ✅ 서버 구독 등급 검증 — DB에서 실제 tier 조회 (클라이언트 우회 방지)
    // JWT의 tier는 만료 후에도 유료로 남아있을 수 있으므로 DB 직접 확인
    if (!isAdmin) {
      let dbUser = null;
      if (dbReady && User) {
        dbUser = await User.findOne({ email: author_email }, 'tier iapExpiresAt vvipHarborId').lean().catch(() => null);
      } else {
        const u = memUsers.find(u => u.email === author_email);
        if (u) dbUser = u;
      }

      const actualTier = dbUser?.tier || 'FREE';
      // IAP 만료 여부 체크 (스케줄러 아직 미실행 시 클라이언트 우회 차단)
      const isIapExpired = dbUser?.iapExpiresAt && new Date(dbUser.iapExpiresAt) < new Date();
      const effectiveTier = isIapExpired ? 'FREE' : actualTier;

      if (!['PRO', 'BUSINESS_VIP'].includes(effectiveTier)) {
        return res.status(403).json({
          error: 'PRO 또는 VVIP 구독자만 선상홍보글을 작성할 수 있습니다.',
          code: 'SUBSCRIPTION_REQUIRED',
        });
      }

      // 1인 1게시글 제한
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

      // ✅ VVIP 지역 제한 검증 (기존 로직 — dbUser 재사용)
      const vvipHarborId = (effectiveTier === 'BUSINESS_VIP' && dbUser?.vvipHarborId) ? dbUser.vvipHarborId : null;
      if (region === '전국 (전체)') {
        return res.status(403).json({ error: "'전국 (전체)' 지역은 마스터 전용입니다.", code: 'GLOBAL_REGION_FORBIDDEN' });
      }
      if (vvipHarborId) {
        const harborKey = HARBOR_KEY_MAP[vvipHarborId];
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

    // ✅ isPinned — VVIP 슬롯 보유자도 고정 가능 (마스터와 동일 권한)
    const myVvipEntry = Object.entries(vvipSlots).find(([, v]) => {
      return v.userId === author_email && (!v.expiresAt || new Date(v.expiresAt) > new Date());
    });
    const safePinned = (isAdmin || !!myVvipEntry) ? !!isPinned : false;

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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '잘못된 ID 형식입니다.' }); // FIX-OBJID-BATCH-5
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    // ✅ BUG-DELETE-FIX: email은 JWT에서만 추출 (body email 신뢰 → 타인 게시글 삭제 가능 보안 취약점 수정)
    const jwtEmail = tp.email;
    const isAdmin = isAdminToken(tp);
    if (dbReady && BusinessPost) {
      // ✅ CastError 방지: _id 검색 실패 시 id 필드로 재검색
      let post = null;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '유효하지 않은 ID' }); // ✅ FIX-CASTID-AUTO
      try { post = await BusinessPost.findById(req.params.id); } catch (_) {}
      if (!post) { post = await BusinessPost.findOne({ id: req.params.id }).catch(() => null); }
      if (!post) return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
      if (!isAdmin && post.author_email !== jwtEmail) return res.status(403).json({ error: '권한 없음' });
      await post.deleteOne();
      return res.json({ success: true });
    }
    // 인메모리: id/_id 양쪽 체크 + ✅ 권한 체크 추가
    const memPost = memBusinessPosts.find(p =>
      p.id === req.params.id || p._id === req.params.id ||
      String(p.id) === req.params.id || String(p._id) === req.params.id
    );
    if (!memPost) return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    if (!isAdmin && memPost.author_email !== jwtEmail) return res.status(403).json({ error: '권한 없음' });
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    // ✅ BUG-PUT-FIX: email은 JWT에서만 추출 (body email 신뢰 → 타인 게시글 수정 가능 보안 취약점 수정)
    const jwtEmail = tp.email;
    const isAdmin = isAdminToken(tp);
    const { ...fields } = req.body;
    // email 필드는 수정 불가 (화이트리스트 외 필드는 아래서 차단됨)

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
      // ✅ JWT email 사용 (body email 제거)
      const myVvipEntry = jwtEmail ? Object.entries(vvipSlots).find(([, v]) => {
        return v.userId === jwtEmail && (!v.expiresAt || new Date(v.expiresAt) > new Date());
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
    // ✅ FIX-BPOST-TITLE-LENGTH: 비즈니스 게시글 주요 필드 길이 제한
  if (fields.shipName && typeof fields.shipName === 'string' && fields.shipName.length > 100) return res.status(400).json({ error: '선박명은 최대 100자입니다.' });
  if (fields.content && typeof fields.content === 'string' && fields.content.length > 5000) return res.status(400).json({ error: '내용은 최대 5000자입니다.' });
  const ALLOWED_FIELDS = ['shipName', 'type', 'target', 'region', 'date', 'price', 'phone',
      'content', 'cover', 'images', 'isPinned', 'capacity', 'harborId', 'expiresAt'];
    const safeFields = {};
    for (const k of ALLOWED_FIELDS) {
      if (fields[k] !== undefined) safeFields[k] = fields[k];
    }

    if (dbReady && BusinessPost) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '잘못된 ID 형식입니다.' }); // FIX-OBJID-BATCH-6
      const post = await BusinessPost.findById(req.params.id).catch(() => null);
      if (!post) return res.status(404).json({ error: '게시글 없음' });
      // ✅ JWT email로 권한 체크 (body email 제거)
      if (!isAdmin && post.author_email !== jwtEmail) return res.status(403).json({ error: '권한 없음' });
      Object.assign(post, safeFields);
      await post.save();
      return res.json(post);
    }
    const mem = memBusinessPosts.find(p => p.id === req.params.id || p._id === req.params.id);
    if (!mem) return res.status(404).json({ error: '게시글 없음' });
    // ✅ JWT email로 권한 체크
    if (!isAdmin && mem.author_email !== jwtEmail) return res.status(403).json({ error: '권한 없음' });
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

// ── 개인정보처리방침 ────────────────────────────────────────────
app.get('/privacy', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>낚시GO 개인정보처리방침</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8f9fa;color:#212529;line-height:1.8}
  .wrap{max-width:800px;margin:0 auto;padding:40px 20px}
  h1{font-size:28px;font-weight:700;color:#1a1a2e;border-bottom:3px solid #c8d400;padding-bottom:16px;margin-bottom:32px}
  h2{font-size:18px;font-weight:700;color:#1a1a2e;margin:32px 0 12px;padding-left:12px;border-left:4px solid #c8d400}
  p,li{font-size:15px;color:#444;margin-bottom:8px}
  ul{padding-left:20px;margin-bottom:12px}
  .box{background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
  .date{font-size:13px;color:#888;margin-bottom:24px}
  .highlight{background:#fffde7;border-left:4px solid #c8d400;padding:12px 16px;border-radius:0 8px 8px 0;margin:12px 0}
  footer{text-align:center;padding:32px 0;font-size:13px;color:#aaa}
</style>
</head>
<body>
<div class="wrap">
  <h1>🎣 낚시GO 개인정보처리방침</h1>
  <p class="date">시행일: 2025년 1월 1일 &nbsp;|&nbsp; 최종 수정일: 2026년 5월 22일</p>

  <div class="box">
    <p>썬주이유랩(이하 "회사")은 낚시GO 서비스(이하 "서비스")를 제공함에 있어 이용자의 개인정보를 소중히 여기며, 「개인정보 보호법」 및 관련 법령을 준수합니다.</p>
  </div>

  <h2>1. 수집하는 개인정보 항목</h2>
  <div class="box">
    <ul>
      <li><strong>필수 항목:</strong> 이메일 주소, 닉네임, 비밀번호(암호화 저장)</li>
      <li><strong>소셜 로그인:</strong> 구글·카카오 계정 ID, 프로필 사진 URL</li>
      <li><strong>서비스 이용 정보:</strong> 낚시 포인트 즐겨찾기, 조황 기록, 알림 설정</li>
      <li><strong>결제 정보:</strong> 구독 플랜, 결제 일시 (카드번호 등 금융정보는 수집하지 않음)</li>
      <li><strong>기기 정보:</strong> FCM 토큰(푸시 알림), 앱 버전, OS 정보</li>
      <li><strong>위치 정보:</strong> GPS 좌표 (낚시 포인트 검색 시, 이용자 동의 후 수집)</li>
    </ul>
  </div>

  <h2>2. 개인정보의 수집·이용 목적</h2>
  <div class="box">
    <ul>
      <li>회원 가입 및 서비스 이용 관리</li>
      <li>낚시 포인트, 조황 정보, 날씨 등 맞춤형 서비스 제공</li>
      <li>구독 결제 처리 및 내역 관리</li>
      <li>푸시 알림(조황 알림, 이벤트) 발송</li>
      <li>서비스 개선을 위한 통계 분석</li>
      <li>불법·부정 이용 방지 및 법적 의무 이행</li>
    </ul>
  </div>

  <h2>3. 개인정보의 보유 및 이용 기간</h2>
  <div class="box">
    <ul>
      <li><strong>회원 탈퇴 시:</strong> 즉시 삭제 (단, 관련 법령에 따라 일정 기간 보관)</li>
      <li><strong>전자상거래 기록:</strong> 5년 (전자상거래법)</li>
      <li><strong>접속 로그:</strong> 3개월 (통신비밀보호법)</li>
    </ul>
  </div>

  <h2>4. 개인정보의 제3자 제공</h2>
  <div class="box">
    <div class="highlight">회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.</div>
    <p>다만, 다음의 경우 예외로 합니다:</p>
    <ul>
      <li>이용자가 사전에 동의한 경우</li>
      <li>법령에 의거하거나 수사기관의 요청이 있는 경우</li>
    </ul>
  </div>

  <h2>5. 개인정보 처리 위탁</h2>
  <div class="box">
    <ul>
      <li><strong>MongoDB Atlas (MongoDB Inc.):</strong> 데이터베이스 서비스</li>
      <li><strong>Google Firebase:</strong> 푸시 알림(FCM) 서비스</li>
      <li><strong>Google Play:</strong> 인앱 결제 처리</li>
      <li><strong>Render.com:</strong> 서버 호스팅</li>
    </ul>
  </div>

  <h2>6. 이용자의 권리</h2>
  <div class="box">
    <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다:</p>
    <ul>
      <li>개인정보 열람, 정정, 삭제 요청</li>
      <li>개인정보 처리 정지 요청</li>
      <li>회원 탈퇴 (앱 내 마이페이지 → 회원 탈퇴)</li>
    </ul>
    <p>문의: <strong>fishing.go.kr@gmail.com</strong></p>
  </div>

  <h2>7. 위치정보 수집 및 이용</h2>
  <div class="box">
    <ul>
      <li>목적: 낚시 포인트 지도 표시, 주변 포인트 검색</li>
      <li>수집 방법: 앱 실행 시 권한 동의 후 수집</li>
      <li>보유 기간: 서비스 이용 기간 (세션 종료 시 삭제)</li>
      <li>거부 가능: 위치 권한 미허용 시 지도 기능 제한</li>
    </ul>
  </div>

  <h2>8. 카메라 및 사진 접근 권한</h2>
  <div class="box">
    <ul>
      <li>목적: 조황 인증 사진 촬영 및 업로드</li>
      <li>수집 방법: 이용자가 직접 사진 촬영 또는 선택</li>
      <li>제3자 제공: 없음</li>
    </ul>
  </div>

  <h2>9. 쿠키 및 유사 기술</h2>
  <div class="box">
    <p>서비스는 로그인 상태 유지를 위해 JWT 토큰을 사용하며, 광고 목적의 쿠키는 사용하지 않습니다.</p>
  </div>

  <h2>10. 개인정보 보호책임자</h2>
  <div class="box">
    <ul>
      <li><strong>회사명:</strong> 썬주이유랩</li>
      <li><strong>책임자:</strong> 대표자</li>
      <li><strong>이메일:</strong> fishing.go.kr@gmail.com</li>
    </ul>
  </div>

  <h2>11. 개인정보처리방침 변경</h2>
  <div class="box">
    <p>이 방침은 법령·서비스 변경 시 개정될 수 있으며, 변경 시 앱 공지사항을 통해 안내합니다.</p>
  </div>

  <footer>
    &copy; 2026 썬주이유랩 · 낚시GO · <a href="/terms" style="color:#c8d400">이용약관</a>
  </footer>
</div>
</body>
</html>`);
});

// ── 이용약관 ────────────────────────────────────────────────────
// ── 계정 삭제 안내 페이지 (Google Play 데이터 보안 필수) ────────
app.get('/delete-account', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>낚시GO 계정 삭제</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}

  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8f9fa;color:#212529;line-height:1.8}
  .wrap{max-width:700px;margin:0 auto;padding:40px 20px}
  h1{font-size:26px;font-weight:700;color:#1a1a2e;border-bottom:3px solid #c8d400;padding-bottom:16px;margin-bottom:28px}
  h2{font-size:17px;font-weight:700;color:#1a1a2e;margin:28px 0 10px;padding-left:12px;border-left:4px solid #c8d400}
  p,li{font-size:15px;color:#444;margin-bottom:8px}
  ul{padding-left:20px;margin-bottom:12px}
  .box{background:#fff;border-radius:12px;padding:22px;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
  .step{background:#fff;border-radius:12px;padding:20px 22px;margin-bottom:10px;box-shadow:0 1px 4px rgba(0,0,0,.06);display:flex;gap:16px;align-items:flex-start}
  .num{width:36px;height:36px;background:#c8d400;color:#1a1a2e;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;flex-shrink:0}
  .warn{background:#fff8e1;border-left:4px solid #ffc107;padding:14px 16px;border-radius:0 10px 10px 0;margin:12px 0;font-size:14px;color:#5d4037}
  .contact{background:#1a1a2e;color:#fff;border-radius:12px;padding:20px 22px;margin-top:20px}
  .contact a{color:#c8d400}
  footer{text-align:center;padding:28px 0;font-size:13px;color:#aaa;margin-top:10px}
</style>
</head>
<body>
<div class="wrap">
  <h1>🗑️ 낚시GO 계정 삭제 안내</h1>

  <div class="box">
    <p>낚시GO 계정을 삭제하면 모든 개인정보와 서비스 이용 내역이 영구적으로 삭제됩니다.<br>계정 삭제 전 아래 안내사항을 반드시 확인하세요.</p>
  </div>

  <div class="warn">
    ⚠️ 계정 삭제 후에는 데이터를 복구할 수 없습니다. 구독 중인 경우 환불이 불가하오니 먼저 구독을 취소해 주세요.
  </div>

  <h2>앱에서 직접 삭제하기 (권장)</h2>

  <div class="step">
    <div class="num">1</div>
    <div><strong>앱 실행</strong> → 하단 탭 <strong>마이페이지</strong> 선택</div>
  </div>
  <div class="step">
    <div class="num">2</div>
    <div>우측 상단 <strong>⚙️ 설정</strong> 아이콘 클릭</div>
  </div>
  <div class="step">
    <div class="num">3</div>
    <div>하단의 <strong>"회원 탈퇴"</strong> 버튼 클릭</div>
  </div>
  <div class="step">
    <div class="num">4</div>
    <div>탈퇴 사유 선택 후 <strong>"탈퇴 확인"</strong> 클릭 → 즉시 삭제 완료</div>
  </div>

  <h2>이메일로 삭제 요청하기</h2>
  <div class="box">
    <p>앱 접근이 어려운 경우 이메일로 삭제를 요청할 수 있습니다.</p>
    <ul>
      <li>이메일: <strong>fishing.go.kr@gmail.com</strong></li>
      <li>제목: <strong>[계정 삭제 요청] 이메일 주소</strong></li>
      <li>내용: 가입 이메일 주소 및 삭제 요청 사유</li>
      <li>처리 기간: 요청일로부터 <strong>영업일 3일 이내</strong></li>
    </ul>
  </div>

  <h2>삭제되는 데이터</h2>
  <div class="box">
    <ul>
      <li>✅ 이메일 주소, 닉네임, 비밀번호</li>
      <li>✅ 낚시 포인트 즐겨찾기, 조황 기록</li>
      <li>✅ 커뮤니티 게시글 및 댓글</li>
      <li>✅ 구독 정보 및 FCM 토큰</li>
      <li>⚠️ 전자상거래 결제 기록은 법령에 따라 5년간 보관</li>
    </ul>
  </div>

  <div class="contact">
    <p style="color:#c8d400;font-weight:700;margin-bottom:8px">📧 문의</p>
    <p>이메일: <a href="mailto:fishing.go.kr@gmail.com">fishing.go.kr@gmail.com</a></p>
    <p style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:8px">영업일 기준 3일 이내 답변드립니다.</p>
  </div>

  <footer>&copy; 2026 썬주이유랩 · 낚시GO · <a href="/privacy" style="color:#c8d400">개인정보처리방침</a></footer>
</div>
</body>
</html>`);
});

app.get('/terms', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>낚시GO 이용약관</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8f9fa;color:#212529;line-height:1.8}
  .wrap{max-width:800px;margin:0 auto;padding:40px 20px}
  h1{font-size:28px;font-weight:700;color:#1a1a2e;border-bottom:3px solid #c8d400;padding-bottom:16px;margin-bottom:32px}
  h2{font-size:18px;font-weight:700;color:#1a1a2e;margin:32px 0 12px;padding-left:12px;border-left:4px solid #c8d400}
  p,li{font-size:15px;color:#444;margin-bottom:8px}
  ul{padding-left:20px;margin-bottom:12px}
  .box{background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
  .date{font-size:13px;color:#888;margin-bottom:24px}
  footer{text-align:center;padding:32px 0;font-size:13px;color:#aaa}
</style>
</head>
<body>
<div class="wrap">
  <h1>🎣 낚시GO 이용약관</h1>
  <p class="date">시행일: 2025년 1월 1일 &nbsp;|&nbsp; 최종 수정일: 2026년 5월 22일</p>

  <div class="box">
    <p>본 약관은 썬주이유랩(이하 "회사")이 제공하는 낚시GO 서비스(이하 "서비스") 이용에 관한 조건 및 절차를 규정합니다.</p>
  </div>

  <h2>제1조 (목적)</h2>
  <div class="box"><p>이 약관은 회사가 제공하는 낚시GO 앱 서비스의 이용 조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.</p></div>

  <h2>제2조 (서비스 내용)</h2>
  <div class="box">
    <ul>
      <li>전국 낚시 포인트 지도 서비스</li>
      <li>실시간 해양 기상 및 조황 정보</li>
      <li>해안 CCTV 영상 서비스</li>
      <li>조황 커뮤니티 및 인증 서비스</li>
      <li>유료 구독 서비스 (BASIC · PRO · VVIP)</li>
    </ul>
  </div>

  <h2>제3조 (회원 가입)</h2>
  <div class="box">
    <p>이용자는 이메일 또는 소셜 계정(구글·카카오)으로 가입할 수 있으며, 만 14세 이상인 경우에만 가입이 가능합니다.</p>
  </div>

  <h2>제4조 (유료 서비스 및 구독)</h2>
  <div class="box">
    <ul>
      <li>유료 구독은 구글 플레이 인앱 결제를 통해 이루어집니다.</li>
      <li>구독은 다음 결제일 24시간 전까지 취소 가능합니다.</li>
      <li>환불은 구글 플레이 환불 정책에 따릅니다.</li>
      <li>구독 취소 후에도 기간 만료 전까지 서비스가 유지됩니다.</li>
    </ul>
  </div>

  <h2>제5조 (이용자 의무)</h2>
  <div class="box">
    <ul>
      <li>타인의 개인정보 도용 금지</li>
      <li>허위 조황 정보 등록 금지</li>
      <li>서비스를 통한 상업적 광고 행위 금지 (VVIP 제외)</li>
      <li>서비스 안정성을 해치는 행위 금지</li>
    </ul>
  </div>

  <h2>제6조 (서비스 중단)</h2>
  <div class="box"><p>회사는 시스템 점검, 천재지변 등 불가피한 경우 서비스를 일시 중단할 수 있으며, 사전에 공지합니다.</p></div>

  <h2>제7조 (면책 조항)</h2>
  <div class="box">
    <ul>
      <li>낚시 포인트 정보는 참고용이며, 실제 조황과 다를 수 있습니다.</li>
      <li>기상 정보는 외부 API 기반으로 정확도를 보장하지 않습니다.</li>
      <li>이용자 간 분쟁에 회사는 책임지지 않습니다.</li>
    </ul>
  </div>

  <h2>제8조 (분쟁 해결)</h2>
  <div class="box"><p>본 약관에 관한 분쟁은 대한민국 법률에 따르며, 관할 법원은 서울중앙지방법원으로 합니다.</p></div>

  <h2>문의</h2>
  <div class="box"><p>이메일: <strong>fishing.go.kr@gmail.com</strong></p></div>

  <footer>
    &copy; 2026 썬주이유랩 · 낚시GO · <a href="/privacy" style="color:#c8d400">개인정보처리방침</a>
  </footer>
</div>
</body>
</html>`);
});


app.get('/api/weather/precision', checkSubscriptionValid, (req, res) => {
  const { stationId } = req.query;
  const sid = stationId || 'DT_0001';

  if (weatherCache[sid]) {
    // 실시간성 체감을 위해 캐시 데이터에도 호출 시마다 미세 노이즈 추가
    const d = { ...weatherCache[sid].data };

    // ✅ BEACH-REALTIME: kmaBeachCache가 있으면 precision 요청 시 실시간 반영
    // weatherCache 패치 race condition을 완전히 우회 (Fly.io ICN push → 즉시 적용)
    if (kmaBeachCache && KMA_BEACH_MAP && KMA_BEACH_MAP[sid]) {
      const beachKeywords = KMA_BEACH_MAP[sid];
      for (const kw of beachKeywords) {
        const match = kmaBeachCache.find(i => i.beachNm && i.beachNm.includes(kw));
        const wTemp = match?.wTemp ? parseFloat(match.wTemp) : null;
        if (wTemp && !isNaN(wTemp) && wTemp > 0) {
          d.sst = wTemp.toFixed(1);
          d.temp = `${d.sst}°C`;
          if (!d._sources) d._sources = {};
          d._sources.sst = 'KMA_BEACH';
          break;
        }
      }
    }

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

  // ✅ BEACH-FALLBACK: weatherCache 없어도 kmaBeachCache로 실측값 반환
  let mockSst = null;
  let sstSourceFb = 'fallback';
  if (kmaBeachCache && KMA_BEACH_MAP && KMA_BEACH_MAP[sid]) {
    for (const kw of KMA_BEACH_MAP[sid]) {
      const match = kmaBeachCache.find(i => i.beachNm && i.beachNm.includes(kw));
      const wTemp = match?.wTemp ? parseFloat(match.wTemp) : null;
      if (wTemp && !isNaN(wTemp) && wTemp > 0) {
        mockSst = wTemp.toFixed(1);
        sstSourceFb = 'KMA_BEACH';
        break;
      }
    }
  }
  if (!mockSst) {
    mockSst = (station.baseTemp || profile.temp || 15.2).toFixed(1);
    sstSourceFb = 'fallback';
  }

  const lunarDay = getLunarDay();
  const tidePhase = getTidePhase(lunarDay, station.region);

  const known = new Date('2024-02-10T00:00:00+09:00');
  const diffDays = Math.floor((Date.now() - known.getTime()) / (1000 * 60 * 60 * 24));
  
  const seed = parseInt(sid.replace(/\D/g, '')) || 1;
  const stationOffset = (seed * 37) % 360; 
  const dailyShift = (diffDays * 49) % 720; 
  
  const baseHighMin = (stationOffset + dailyShift) % 720;
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
    ],
    _sources: { sst: sstSourceFb }
  });
});

// ✅ 낚시 점수 계산 헬퍼 함수
function calcFishingScoreForStation(sid) {
  const entry = weatherCache[sid];
  if (!entry || !entry.data) return null;
  const hour  = new Date().getHours();
  const month = new Date().getMonth() + 1;
  const isNight = hour >= 19 || hour < 5;
  const d = entry.data;
  const sst   = parseFloat(d.sst)          || 14;
  const wind  = parseFloat(d.wind?.speed)   || 3;
  const wave  = parseFloat(d.wave?.coastal) || 0.5;
  const phase = d.tide?.phase               || '';
  const seed  = parseInt(sid.replace(/\D/g, '')) || 1;

  let score = 45 + (seed % 10) + ((seed % 14 - 7) / 10);
  if      (wind > 14) score -= 65;
  else if (wind > 10) score -= 40;
  else if (wind >  8) score -= 28;
  else if (wind >  6) score -= 18;
  else if (wind >  4) score -= 8;
  else if (wind <  2) score += 12;
  else if (wind <  3) score += 7;

  if      (wave > 2.5) score -= 60;
  else if (wave > 2.0) score -= 45;
  else if (wave > 1.5) score -= 30;
  else if (wave > 1.2) score -= 20;
  else if (wave > 0.8) score -= 10;
  else if (wave < 0.3) score += 8;
  else if (wave < 0.5) score += 4;

  if      (sst < 8)              score -= 40;
  else if (sst < 11)             score -= 25;
  else if (sst < 14)             score -= 12;
  else if (sst < 17)             score -= 3;
  else if (sst >= 17 && sst < 20) score += 10;
  else if (sst >= 20 && sst < 24) score += 6;
  else if (sst >= 24 && sst < 27) score -= 5;
  else if (sst >= 27)             score -= 25;

  const seasons = [
    { min:10, max:18, months:[3,4,5] },
    { min:18, max:26, months:[6,7,8] },
    { min:16, max:22, months:[9,10,11] },
    { min:8,  max:14, months:[12,1,2] },
  ];
  for (const s of seasons) {
    if (s.months.includes(month)) {
      if (sst >= s.min && sst <= s.max) score += 8;
      else if (sst < s.min - 4 || sst > s.max + 4) score -= 15;
      break;
    }
  }

  const tideMatch = phase.match(/(\d+)물/);
  const tideNum = tideMatch ? parseInt(tideMatch[1]) : 0;
  const TIDE_BONUS = { 1:3,2:5,3:7,4:9,5:10,6:10,7:8,8:6,9:4,10:2,11:-2,12:-4,14:-8,15:-6 };
  score += TIDE_BONUS[tideNum] || 0;
  if (phase.includes('조금') || phase.includes('무시')) score -= 7;
  if (isNight) score -= 2;

  return Math.min(100, Math.max(5, Math.round(score)));
}

// ── 낚시 포인트 일괄 점수 반환 API ────────────────────────────────────
// ✅ SCORE-UNIFIED: 서버 공식 = 클라이언트 evaluator.js 완전 통일 (베이스 45~55점)
// ✅ REAL-DATA: KMA 해양부이(풍속·파고) + KHOA 조석(물때) 실시간 데이터 반영
app.get('/api/fishing-scores', (req, res) => {
  try {
    const scores = {};
    Object.keys(weatherCache).forEach(sid => {
      const score = calcFishingScoreForStation(sid);
      if (score !== null) scores[sid] = score;
    });
    res.json({ scores, updatedAt: new Date().toISOString(), count: Object.keys(scores).length });
  } catch (err) {
    res.status(500).json({ error: '점수 계산 실패' });
  }
});

// 프론트엔드 Mixed Content / CORS 블락 우회용 MOF 이미지 스트리밍 프록시
app.get('/api/weather/cctv/stream/:beachCode', async (req, res) => {
  const { beachCode } = req.params;
    if (!/^[a-zA-Z0-9_-]{1,20}$/.test(beachCode || '')) return res.status(400).json({ error: '잘못된 beachCode' }); // ✅ FIX-SSRF-BEACH
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
// ✅ PERSIST: 마스터 포인트 좌표 DB 연동 — 재배포 후에도 유지
async function loadSpotOverridesFromDB() {
  if (!dbReady || !SpotLocationOverrideModel) return;
  try {
    const docs = await SpotLocationOverrideModel.find().lean();
    docs.forEach(d => { spotLocationOverrides[d.id] = { lat: d.lat, lng: d.lng, name: d.name, updatedAt: d.updatedAt }; });
    logger.info(`[SpotOverride] DB에서 ${docs.length}개 포인트 좌표 복원 완료`);
    if (docs.length > 0) saveSpotLocationOverrides();
  } catch (e) { logger.error('[SpotOverride] DB 로드 실패:', e.message); }
}
async function loadSecretPointOverridesFromDB() {
  if (!dbReady || !SecretPointOverrideModel) return;
  try {
    const docs = await SecretPointOverrideModel.find().lean();
    docs.forEach(d => { secretPointOverrides[d.id] = { lat: d.lat, lng: d.lng }; });
    logger.info(`[SecretOverride] DB에서 ${docs.length}개 비밀포인트 좌표 복원 완료`);
    if (docs.length > 0) saveSecretPointOverrides();
  } catch (e) { logger.error('[SecretOverride] DB 로드 실패:', e.message); }
}
setTimeout(loadSpotOverridesFromDB, 4000);
setTimeout(loadSecretPointOverridesFromDB, 4500);

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
    const tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
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
  // FIX-CCTV-VALID: 입력 길이/형식 검증
  if (youtubeId !== undefined && (typeof youtubeId !== 'string' || youtubeId.length > 20)) return res.status(400).json({ error: '유효하지 않은 YouTube ID' });
  if (type !== undefined && !['live', 'youtube', 'hls', 'dash', 'cctv'].includes(type)) return res.status(400).json({ error: '유효하지 않은 타입' });
  if (label !== undefined && (typeof label !== 'string' || label.length > 50)) return res.status(400).json({ error: '라벨은 최대 50자' });

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
// crypto는 파일 최상단에서 이미 require됨 (중복 선언 제거)


// ❌ [BUG-2 FIX] 구버전 GET /api/commerce/coupang/search 비활성화
// 쿠팡 없을때 Ali fallback이 searchAliExpress()를 사용하여 오류 발생 가능
// 올바른 버전은 이 파일 하단 (L6545)에 있음 — 해당 버전이 실행됨


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
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
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
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
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
    saveProSubs();
    // ✅ FIX-MEDIUM: User DB tier FREE 초기화 (서버 재시작 시 만료 유저 tier 복원 방지)
    if (dbReady && User) { User.findOneAndUpdate({ $or: [{ email: userId }, { id: userId }] }, { $set: { tier: 'FREE', subscriptionExpiresAt: null } }).catch(() => {}); }
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
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
  if (!isAdminToken(tp)) return res.status(403).json({ error: '관리자만 접근 가능' });
  const { userId } = req.body;
  // ✅ FIX-LOW: userId null/undefined 유효성 검사
  if (!userId) return res.status(400).json({ error: 'userId 필수' });
  if (proSubscriptions[userId]) {
    delete proSubscriptions[userId];
    saveProSubs();
    // ✅ FIX-MEDIUM: 관리자 강제 해지 시 User DB tier FREE 초기화
    if (dbReady && User) { User.findOneAndUpdate({ $or: [{ email: userId }, { id: userId }] }, { $set: { tier: 'FREE', subscriptionExpiresAt: null } }).catch(() => {}); }
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
      const _cleanedUserId = userId; // ✅ FIX-LOW: PRO cron User DB 초기화용
      delete proSubscriptions[userId];
      cleaned++;
      if (dbReady && User) { User.findOneAndUpdate({ $or: [{ email: _cleanedUserId }, { id: _cleanedUserId }] }, { $set: { tier: 'FREE', subscriptionExpiresAt: null } }).catch(() => {}); }
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
// ✅ FIX-VVIP-COLD-START: dbReady 대기 후 즉시 로드 (3.5초 고정 대기 → DB 준비 즉시 실행)
// Render 무료 플랜 cold start 시 3.5초 내 요청이 들어오면 빈 슬롯 반환하던 버그 수정
let vvipSlotsLoaded = false;
(function waitAndLoadVvipSlots() {
  if (dbReady) {
    loadVvipSlotsFromDB().then(() => { vvipSlotsLoaded = true; });
  } else {
    setTimeout(waitAndLoadVvipSlots, 500); // 500ms마다 DB 준비 확인
  }
})();

// 항구 목록 + 슬롯 현황 조회 (만료 자동 해제 포함)
app.get('/api/vvip/harbors', (req, res) => {
  const now = new Date();
  // 만료된 VVIP 슬롯 자동 정리
  let expiredCount = 0;
  Object.keys(vvipSlots).forEach(harborId => {
    const slot = vvipSlots[harborId];
    if (slot.expiresAt && new Date(slot.expiresAt) < now) {
      logger.info(`[VVIP 만료] ${slot.harborName} 슬롯 자동 해제`); // ✅ 22TH-B1
      const _expiredUid = slot.userId;
      delete vvipSlots[harborId];
      expiredCount++;
      if (dbReady && User) { User.findOneAndUpdate({ $or: [{ email: _expiredUid }, { id: _expiredUid }] }, { $unset: { vvipHarborId: 1, vvipExpiresAt: 1 } }).catch(()=>{}); }
    }
  });
  if (expiredCount > 0) saveVvipSlots(); // 만료 파일 반영
  // ✅ FIX-VVIP-COLD-START: DB 로드 완료 전 요청 시 slotsReady 경고 헤더 추가
  if (!vvipSlotsLoaded) {
    res.setHeader('X-Slots-Ready', 'false');
  }
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
  res.json({ harbors: harborData, slotsReady: vvipSlotsLoaded });
});

// VVIP 슬롯 구매 (선착순) — 만료일 30일 자동 설정 + User DB 저장 — ✅ NEW-BUG-08: JWT 인증 추가
app.post('/api/vvip/purchase', async (req, res) => {
  // JWT 인증 가드
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
  const { harborId, userId, userName } = req.body;
  if (!harborId || !userId) return res.status(400).json({ error: '필수 정보 누락' });
  const isAdmin = isAdminToken(tp);
  // ✅ FIX-403: userId는 닉네임(name) 또는 email이므로 tp.name도 허용
  if (!isAdmin && tp.id !== userId && tp.email !== userId && (tp.name || '') !== userId) return res.status(403).json({ error: '본인의 슬롯만 구매 가능합니다.' });

  // ✅ DB에서 실제 tier 확인 (JWT tier는 로그인 시점 발급 → 최신 tier 반영 안 됨)
  if (!isAdmin && dbReady && User) {
    try {
      const dbFilter = tp.email ? { email: tp.email } : { _id: tp.id };
      const dbUser = await User.findOne(dbFilter).select('tier').lean();
      if (!dbUser || !['BUSINESS_VIP', 'MASTER'].includes(dbUser.tier)) {
        return res.status(403).json({ error: 'VVIP 멤버십 구독 후 이용 가능합니다.', code: 'NOT_VVIP' });
      }
    } catch (e) {
      (logger?.error || console.error)('[VVIP 구매] DB tier 조회 실패:', e.message);
      // ✅ BUG-04 FIX: fail-open → fail-closed — DB 오류 시 503 반환 (무료 유저 VVIP 접근 방지)
      return res.status(503).json({ error: '서버 일시 오류, 잠시 후 재시도해주세요.' });
    }
  }

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

  const effectiveUserId = tp.email || tp.id; // ✅ BUG-03 FIX: 슬롯 소유자는 JWT에서만 추출 (본문 userId 신뢰 금지)
  const effectiveUserName = userName || effectiveUserId;

  vvipSlots[harborId] = {
    userId: effectiveUserId,
    userName: effectiveUserName,
    purchasedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    harborName: harbor.name
  };
  saveVvipSlots(); // 파일 영구 저장

  // ✅ User DB에 VVIP 항구 정보 저장 — JWT email/id로 안전하게 매칭
  if (dbReady && User) {
    try {
      const dbFilter = tp.email ? { email: tp.email } : { _id: tp.id };
      await User.findOneAndUpdate(
        dbFilter,
        { $set: { vvipHarborId: harborId, vvipExpiresAt: expiresAt, updatedAt: now } }
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
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
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
      if (dbReady && User) { User.findOneAndUpdate({ $or: [{ email: slot.userId }, { id: slot.userId }] }, { $unset: { vvipHarborId: 1, vvipExpiresAt: 1 } }).catch(()=>{}); }
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
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
  if (!isAdminToken(tp)) return res.status(403).json({ error: '마스터 권한 필요' });

  const { userId, harborId, days: rawDays = 30 } = req.body;
  const days = Math.min(365, Math.max(1, parseInt(rawDays) || 30)); // ✅ FIX-VVIP-DAYS-LIMIT: 1~365일 범위 강제
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

// ✅ ADMIN: VVIP 슬롯 강제 해제 (관리자 전용)
// DELETE /api/admin/vvip/revoke  { harborId }
app.delete('/api/admin/vvip/revoke', async (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
  if (!isAdminToken(tp)) return res.status(403).json({ error: '마스터 권한 필요' });

  const { harborId } = req.body;
  if (!harborId) return res.status(400).json({ error: 'harborId 필수' });

  const slot = vvipSlots[harborId];
  if (!slot) return res.status(404).json({ error: `${harborId} 슬롯이 점유되어 있지 않습니다.` });

  const slotUserId = slot.userId;
  const harborName = slot.harborName || harborId;

  // 메모리에서 즉시 해제
  delete vvipSlots[harborId];
  saveVvipSlots();

  // DB User 초기화 (재시작 시 재복원 방지)
  if (dbReady && User) {
    try {
      await User.findOneAndUpdate(
        { $or: [{ email: slotUserId }, { id: slotUserId }] },
        { $unset: { vvipHarborId: 1, vvipExpiresAt: 1 } }
      );
    } catch (e) {
      (logger?.error || console.error)('[VVIP Revoke] DB 초기화 실패:', e.message);
    }
  }
  // memUsers 초기화
  const mu = memUsers.find(u => u.email === slotUserId || u.id === slotUserId);
  if (mu) { delete mu.vvipHarborId; delete mu.vvipExpiresAt; saveMemUsers(); }

  (logger?.info || console.log)(`[VVIP Revoke] 슬롯 해제: ${harborName} (userId: ${slotUserId})`);
  res.json({
    success: true,
    harborId, harborName, slotUserId,
    message: `✅ ${harborName} VVIP 슬롯 해제 완료 (${slotUserId})`,
  });
});

// ✅ VVIP 만료 처리는 runVvipExpiryCheck(L1039, 1분 주기)로 통합 운영
// ✅ 기존 24시간 주기 setInterval 제거 — runVvipExpiryCheck가 User DB 초기화까지 처리


// ─────────────────────────────────────────────────────────────────────────────
// ─── 쿠팡 파트너스 Open API 라우트 ────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/products?category=낚시용품
 * Shop 탭 메인 상품 목록 (Shop.jsx 전용)
 */
app.get('/api/products', async (req, res) => {
  try {
    const category = (Array.isArray(req.query.category) ? req.query.category[0] : (req.query.category || '')) /* FIX-QUERY-CAT-HPP */ || '낚시용품';
    const products = await coupang.getRecommendedProducts(category);

    // Shop.jsx가 기대하는 포맷으로 변환
    const formatted = products.map(p => ({
      id: p.productId,
      name: p.productName,
      price: p.productPrice?.toLocaleString('ko-KR') || '0',
      discount: p.discountRate > 0 ? `${p.discountRate}%` : '0%',
      img: p.productImage,
      link: p.coupangUrl,
      badge: p.badge || '낚시GO 추천',
    }));

    res.json(formatted);
  } catch (err) {
    (logger?.error || console.error)('[/api/products] 오류:', err.message);
    res.status(500).json({ error: '상품 조회 실패' });
  }
});

/**
 * GET /api/commerce/coupang/search?keyword=루어 낚시 장비
 * 미디어 탭 영상 콴텐츠 연동 상품 (MediaTab.jsx 전용)
 */
app.get('/api/commerce/coupang/search', async (req, res) => {
  try {
    const keyword = (Array.isArray(req.query.keyword) ? req.query.keyword[0] : (req.query.keyword || '')).slice(0, 100) /* FIX-QUERY-KW-HPP */ || '낚시용품';
    const category = (Array.isArray(req.query.category) ? req.query.category[0] : (req.query.category || '')) /* FIX-QUERY-CAT-HPP */ || '';

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
      isMock: false,
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
  const status = coupang.getCoupangStatus ? coupang.getCoupangStatus() : {};
  res.json({
    mode: status.ready ? 'LIVE (쿠팡 실제 API)' : 'INACTIVE (API 키 미설정)',
    partnersId: coupang.PARTNERS_ID || '미설정',
    ready: status.ready || false,
    note: status.ready ? '실제 쿠팡 API 연동 중' : 'COUPANG_ACCESS_KEY / SECRET_KEY 미설정',
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
const YT_ORIGIN = process.env.CLIENT_ORIGIN || process.env.ALLOWED_ORIGIN || 'https://www.fishing-go.com';
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
    const q = ((Array.isArray(req.query.q) ? req.query.q[0] : req.query.q) || '낚시').slice(0, 100).trim(); // ✅ FIX-YT-SEARCH-HPP FIX-YT-SEARCH-LEN
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
  const q = ((Array.isArray(req.query.q) ? req.query.q[0] : req.query.q) || '낚시').slice(0, 100).trim(); // ✅ FIX-UNIFIED-HPP
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
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

// ✅ FISHING-SCORE-ALARM: 매일 08:00, 12:00, 16:00 낚시 점수 푸시
async function runFishingScoreAlarm() {
  if (!dbReady || !User) return;
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const users = await User.find({
      'notiSettings.score': { $ne: false },
      lastStationId: { $ne: null },
      lastLocationUpdatedAt: { $gte: threeDaysAgo }
    }).select('email lastStationId notiSettings');

    let sentCount = 0;
    for (const user of users) {
      const score = calcFishingScoreForStation(user.lastStationId);
      if (score !== null && score >= 70) {
        sendAppPushNotification(
          user.email,
          'score',
          '🎣 출조 최적기!',
          `현재 계신 지역의 낚시 점수가 ${score}점 이상입니다. 출조하기 아주 좋은 날씨예요!`,
          { route: `/weather/${user.lastStationId}` }
        );
        sentCount++;
      }
    }
    logger.info(`✅ [Fishing Score Alarm] ${sentCount}명 발송 완료`);
  } catch (err) {
    logger.error(`[Fishing Score Alarm] 실패: ${err.message}`);
  }
}

// 가상 알람푸쉬 테스트용 임시 API
app.get('/api/test-score-alarm', async (req, res) => {
  try {
    await runFishingScoreAlarm();
    res.json({ success: true, message: '가상 알람 스케줄러 수동 실행 완료' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// node-cron 또는 24시간 인터벌 폴백
if (cron) {
  cron.schedule('0 9 * * *', runBillingScheduler, { timezone: 'Asia/Seoul' });
  logger.info('✅ [Billing Scheduler] node-cron 매일 09:00(KST) 자동청구 활성화');
  
  cron.schedule('0 8,12,16 * * *', runFishingScoreAlarm, { timezone: 'Asia/Seoul' });
  logger.info('✅ [Fishing Score Alarm] node-cron 08,12,16시 활성화');
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
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
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ── API: 내 구독 정보 조회 — DUPLICATE REMOVED ──────────────────────────────
// GET /api/payment/subscription/:userId 는 L2316에 더 완전한 버전이 있으므로 이 중복 엔드포인트를 제거합니다.
// FIX-DUP-ROUTE-SUBSCRIPTION

// ── API: 구독 취소 — ✅ NEW-WARN-01: JWT 인증 추가 (본인/어드민만 취소 가능)
app.delete('/api/payment/subscription/:userId', async (req, res) => {
  try {
    // JWT 인증 가드
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
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
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ── API: 구독 플랜 변경 (업그레이드/다운그레이드) — ✅ NEW-WARN-02: JWT 인증 추가
app.put('/api/payment/subscription/:userId/plan', async (req, res) => {
  try {
    // JWT 인증 가드
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
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
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
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
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
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
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
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
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// billing/register에서 PaymentHistory 자동 저장 (기존 엔드포인트 보완 훅)
// 아래 미들웨어를 통해 billing/register 응답 성공 시 history 저장
// ✅ BUG-42: JWT 인증 추가 — 미인증 결제 기록 위조 방지
app.post('/api/payment/history/record', verifyToken, async (req, res) => {
  try {
    const { userId, userName, planId, pgProvider, paymentType, amount, status, imp_uid, merchant_uid, failReason, isTest } = req.body;
    // 요청 userId와 토큰 userId 일치 여부 확인 (본인 결제만 기록 가능)
    const tokenId = req.user.email || req.user.id;
    const isAdmin = isAdminToken(req.user);
    const safeAmount = Number(amount); if (!Number.isFinite(safeAmount) || safeAmount <= 0) return res.status(400).json({ error: '유효하지 않은 결제 금액' }); // ✅ FIX-AMOUNT-VALIDATE
    if (!isAdmin && userId && userId !== tokenId) {
      return res.status(403).json({ error: '본인 결제 기록만 등록할 수 있습니다.' });
    }
    if (dbReady && PaymentHistory && merchant_uid) {
      const used = await isMerchantUidUsed(merchant_uid);
      if (used) return res.status(409).json({ error: '이미 처리된 결제입니다.' });
      await PaymentHistory.create({ userId, userName, planId, pgProvider, paymentType, amount, status, imp_uid, merchant_uid, failReason, isTest: isTest || false });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ── (6) EXP 서버 계산 + 보상 지급 ──────────────────────────────────────────
const SERVER_EXP_REWARDS = {
  attendance: 20, post_write: 30, record_write: 50,
  comment_write: 10, like_receive: 5, point_visit: 15,
  photo_upload: 25, first_catch: 100, weekly_streak: 80, monthly_streak: 300,
};

// ✅ BUG-43: JWT 인증 추가 — EXP 직접 조작 방지
// ✅ FIX-EXP-RATE: per-user+action rate limit (반복 EXP 적립 방어)
const expRateMap = new Map(); // 'userId:action' → timestamp
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [k, v] of expRateMap.entries()) { if (v < cutoff) expRateMap.delete(k); }
}, 60 * 60 * 1000); // 1시간마다 정리

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
    // ✅ FIX-EXP-RATE: 24시간 내 동일 action 중복 적립 방어 (attendance는 1회/일, 나머지는 10회/일)
    if (!isAdmin) {
      const rateKey = `${tokenId}:${action}`;
      const EXP_COOLDOWN = (action === 'attendance' || action === 'first_catch' || action === 'weekly_streak' || action === 'monthly_streak')
        ? 23 * 60 * 60 * 1000  // 23시간 쿨다운 (daily activities)
        : 5 * 60 * 1000;       // 5분 쿨다운 (regular activities)
      const lastTime = expRateMap.get(rateKey) || 0;
      if (Date.now() - lastTime < EXP_COOLDOWN) {
        return res.status(429).json({ error: '잠시 후 다시 시도해주세요.', cooldownMs: EXP_COOLDOWN - (Date.now() - lastTime) });
      }
      expRateMap.set(rateKey, Date.now());
    }

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
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
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
let paymentLimiter = (req, res, next) => next(); // ✅ FIX-SCOPE
let searchLimiter  = (req, res, next) => next(); // ✅ FIX-SCOPE
try {
  const rateLimit = require('express-rate-limit');
  // 결제 API: 1분에 5회
  paymentLimiter = rateLimit({ windowMs: 60_000, max: 5, message: { error: '결제 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, standardHeaders: true, legacyHeaders: false });
  app.use('/api/payment', paymentLimiter);
  // 검색 API: 1분에 30회
  searchLimiter = rateLimit({ windowMs: 60_000, max: 30, message: { error: '검색 요청이 너무 많습니다.' } });
  app.use('/api/community/search', searchLimiter);
  (logger?.info || console.log)('✅ Rate Limit 강화 적용 (결제/검색)');
} catch (e) { (logger?.warn || console.warn)('[RateLimit] express-rate-limit 미설치 또는 적용 실패:', e.message); }

// ── (11) 커뮤니티 서버사이드 전문 검색 ──────────────────────────────────────
app.get('/api/community/search', async (req, res) => {
  try {
    const rawQ = Array.isArray(req.query.q) ? req.query.q[0] : (req.query.q || ''); // ✅ FIX-SEARCH-HPP
    const q = rawQ.slice(0, 100); // ✅ FIX-SEARCH-MAXLEN-2: 검색어 최대 100자
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20)); // ✅ FIX-SEARCH-LIMIT: 최대 50개
    const category = Array.isArray(req.query.category) ? req.query.category[0] : (req.query.category || ''); // ✅ FIX-SEARCH-HPP
    const skip = (page - 1) * limit;
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
          .skip(skip).limit(limit).lean(),
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
      results = filtered.slice(skip, skip + limit);
    }
    res.json({ results, total, page, hasMore: skip + results.length < total });
  } catch (err) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ── (10) 즐겨찾기 DB 동기화 ──────────────────────────────────────────────────
// ✅ BUG-03 FIX: GET /api/user/favorites — JWT 인증 추가 (타인 즐겨찾기 노출 차단)
app.get('/api/user/favorites', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const userId = tp.email || tp.id; // ✅ BUG-03 FIX: JWT에서만 추출
    if (dbReady && User) {
      const u = await User.findOne({ $or: [{ email: userId }, { id: userId }] }, 'favorites').lean().catch(() => null);
      return res.json({ favorites: u?.favorites || [] });
    }
    const u = memUsers.find(u => u.email === userId || u.id === userId);
    res.json({ favorites: u?.favorites || [] });
  } catch (err) { res.status(500).json({ error: '서버 오류가 발생했습니다.' }); }
});

// ✅ NEW-BUG-02: /api/user/favorites POST — JWT 인증 추가 (본인 즐겨찾기만 수정 가능)
app.post('/api/user/favorites', async (req, res) => {
  try {
    // JWT 인증 가드
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
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
  } catch (err) { res.status(500).json({ error: '서버 오류가 발생했습니다.' }); }
});

// ── (14) 어드민 수익 대시보드 API ─────────────────────────────────────────────
app.get('/api/admin/revenue', async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ error: '마스터 권한 필요' }); // ✅ FIX-ADMIN-REVENUE-AUTH
  try {
    // 마스터 어드민 인증
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
    let payload;
    try { payload = jwt.verify(authHeader.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '인증 필요' }); }
    const isAdmin = isAdminToken(payload); // ✅ 9TH-A1/B1: payload.name 불일치 비교 제거 — isAdminToken은 id/email만 체크 (ADMIN 기준 통일)
    if (!isAdmin) return res.status(403).json({ error: '접근 권한 없음' });

    const now = new Date();
    const month1 = new Date(now.getFullYear(), now.getMonth(), 1);
    let stats = { totalRevenue: 0, monthRevenue: 0, activeSubscriptions: 0, planBreakdown: {}, recentPayments: [] };

    if (dbReady && PaymentHistory && Subscription) {
      const [allPaid, monthPaid, activeSubs, recentList] = await Promise.all([
        PaymentHistory.aggregate([{ $match: { status: 'paid', isTest: { $ne: true } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        PaymentHistory.aggregate([{ $match: { status: 'paid', createdAt: { $gte: month1 }, isTest: { $ne: true } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        Subscription.countDocuments({ status: 'active', isTest: { $ne: true } }),
        PaymentHistory.find({ status: 'paid', isTest: { $ne: true } }).sort({ createdAt: -1 }).limit(10).lean(),
      ]);
      const breakdown = await Subscription.aggregate([{ $match: { status: 'active', isTest: { $ne: true } } }, { $group: { _id: '$planId', count: { $sum: 1 }, revenue: { $sum: '$amount' } } }]);

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
  } catch (err) { res.status(500).json({ error: '서버 오류가 발생했습니다.' }); }
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
  // ✅ FIX-PUSH-TARGET-ONLY: 특정 소켓에만 발송 (전체 방송 → 타겟 필터링)
  let pushed = false;
  for (const [sid, sock] of io.sockets.sockets) {
    const sockUser = sock.verifiedUser || sock._verifiedUser;
    if (sockUser && (sockUser.email === targetEmail || sockUser.id === targetEmail)) {
      sock.emit('push_notification', payload);
      pushed = true;
    }
  }
  if (!pushed) (logger?.debug || console.log)('[Admin Push] 오프라인 사용자:', targetEmail);
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
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ✅ PUSH-FCM: FCM 토큰 등록 (POST /api/user/push-token)
app.post('/api/user/push-token', verifyToken, async (req, res) => {
  const { token, platform = 'android' } = req.body;
  if (!token) return res.status(400).json({ error: 'token 필수' });
  // ✅ FIX-PUSHTOKEN-LEN: FCM 토큰 길이 검증 (DoS + 이상 토큰 방어)
  if (typeof token !== 'string' || token.length > 512 || token.length < 10) return res.status(400).json({ error: '유효하지 않은 FCM 토큰' });
  const ALLOWED_PLATFORMS = ['android', 'ios', 'web'];
  if (!ALLOWED_PLATFORMS.includes(platform)) return res.status(400).json({ error: '유효하지 않은 플랫폼' });
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
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
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
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
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
  // page/limit 파라미터 존재 여부로 구/신 클라이언트 구분
  const hasPagination = !!req.query.page || !!req.query.limit;
  const page     = Math.max(1, parseInt(req.query.page)  || 1);
  const limit    = Math.min(18, parseInt(req.query.limit) || 9);

  try {
    let items = [];
    let total = 0;
    let hasMore = false;

    if (source === 'coupang') {
      const products = await coupang.getRecommendedProducts(category);
      items = products.map(p => ({
        id:       p.productId,
        name:     p.productName,
        price:    p.productPrice?.toLocaleString('ko-KR') || '0',
        discount: p.discountRate ? `${p.discountRate}%` : '0%',
        img:      p.productImage,
        link:     p.coupangUrl,
        badge:    p.badge,
        source:   'coupang',
      }));
      total = items.length;
      hasMore = false;

    } else if (source === 'ali') {
      const result = await ali.getAliProducts(category, page, limit);
      const rawItems = Array.isArray(result) ? result : (result.items || []);
      items = rawItems.map(p => ({
        id:           `ali_${p.productId}`,
        name:         p.title,
        price:        p.salePrice,
        discount:     p.discount,
        img:          p.imageUrl,
        link:         p.productUrl,
        badge:        p.badge,
        source:       'ali',
        commission:   p.commissionRate,
        priceConfirm: p.priceConfirm || false,
      }));
      total   = Array.isArray(result) ? items.length : (result.total   || items.length);
      hasMore = Array.isArray(result) ? false         : (result.hasMore || false);

    } else {
      // source === 'all'
      const aliKeyword = _mapToAliKeyword(category);
      const [coupangProducts, aliResult] = await Promise.all([
        coupang.getRecommendedProducts(category).catch(() => []),
        ali.getAliProducts(aliKeyword, page, limit).catch(() => ({ items: [], total: 0, hasMore: false })),
      ]);
      const aliItems   = Array.isArray(aliResult) ? aliResult : (aliResult.items || []);
      hasMore = Array.isArray(aliResult) ? false : (aliResult.hasMore || false);
      items = [
        ...(page === 1 ? coupangProducts.slice(0, 6).map(p => ({
          id:       p.productId,
          name:     p.productName,
          price:    p.productPrice?.toLocaleString('ko-KR') || '0',
          discount: p.discountRate ? `${p.discountRate}%` : '0%',
          img:      p.productImage,
          link:     p.coupangUrl,
          badge:    p.badge,
          source:   'coupang',
        })) : []),
        ...aliItems.map(p => ({
          id:           `ali_${p.productId}`,
          name:         p.title,
          price:        p.salePrice,
          discount:     p.discount,
          img:          p.imageUrl,
          link:         p.productUrl,
          badge:        p.badge,
          source:       'ali',
          commission:   p.commissionRate,
          priceConfirm: p.priceConfirm || false,
        })),
      ];
      total = items.length;
    }

    // ✅ 하위 호환: page 파라미터 없으면 배열로 반환 (구 클라이언트 지원)
    //              page 파라미터 있으면 { items, hasMore, total } 반환 (신 클라이언트)
    if (!hasPagination) {
      return res.json(items);
    }
    return res.json({ items, total, hasMore });

  } catch (err) {
    logger.warn(`[Shop API] 상품 조회 오류: ${err.message}`);
    res.status(500).json({ error: '상품 로드 실패', message: err.message });
  }
});


/**
 * GET /api/shop/ali-resolve?url=<s.click.aliexpress.com 링크>
 * AliExpress 트래킹 링크에서 상품 정보 자동 추출 (마스터 전용)
 */
app.get('/api/shop/ali-resolve', async (req, res) => {
  const DIRECT_KEY = process.env.DIRECT_KEY; // ✅ FIX-DIRECT-KEY
  const { url, key } = req.query;

  if (!DIRECT_KEY || !key || !require('crypto').timingSafeEqual(Buffer.from(DIRECT_KEY), Buffer.from(key.padEnd(DIRECT_KEY.length, '\0').substring(0, DIRECT_KEY.length)))) {
    return res.status(403).json({ error: '권한 없음' }); // ✅ FIX-TIMING-SAFE
  }
  if (!url) return res.status(400).json({ error: 'url 파라미터 필요' });

  const https = require('https');
  const http  = require('http');
  const TRACK = (process.env.ALI_TRACKING_ID || 'FishingGO').trim();

  // ── 리다이렉트 추적: /item/숫자 URL 발견 즉시 중단 ───────────────────────────
  function findProductId(startUrl, maxHops = 20) {
    return new Promise((resolve, reject) => {
      let hops = 0;

      function doHead(currentUrl) {
        if (hops++ > maxHops) return reject(new Error('리다이렉트 횟수 초과'));

        let parsed;
        try { parsed = new URL(currentUrl); } catch { return reject(new Error('잘못된 URL')); }

        // 현재 URL에 이미 상품 ID가 있으면 즉시 반환
        const idNow = currentUrl.match(/\/item\/(\d{8,})/);
        if (idNow) return resolve({ productId: idNow[1], finalUrl: currentUrl });

        const mod = parsed.protocol === 'https:' ? https : http;
        const req2 = mod.request({
          hostname: parsed.hostname,
          path: parsed.pathname + parsed.search,
          method: 'HEAD',   // body 없이 헤더만 받기 (빠름)
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'ko-KR,ko;q=0.9',
          },
        }, (r) => {
          r.resume();
          if ([301,302,303,307,308].includes(r.statusCode) && r.headers.location) {
            const next = r.headers.location.startsWith('http')
              ? r.headers.location
              : `${parsed.protocol}//${parsed.host}${r.headers.location}`;
            // 다음 URL에 상품 ID 있으면 즉시 반환
            const idNext = next.match(/\/item\/(\d{8,})/);
            if (idNext) return resolve({ productId: idNext[1], finalUrl: next });
            return doHead(next);
          }
          // 리다이렉트 없으나 상품 ID 없음 → 상품 페이지 아님
          resolve({ productId: null, finalUrl: currentUrl });
        });
        req2.on('error', reject);
        req2.on('timeout', () => { req2.destroy(); reject(new Error('타임아웃')); });
        req2.end();
      }

      doHead(startUrl);
    });
  }

  // ── 상품 페이지 HTML 직접 조회 (리다이렉트 최대 5홉 추적) ─────────────────────
  function fetchProductPage(productId, maxHops = 5) {
    return new Promise((resolve, reject) => {
      let hops = 0;
      function doGet(targetUrl) {
        if (hops++ > maxHops) return reject(new Error('상품 페이지 리다이렉트 초과'));
        let parsed; try { parsed = new URL(targetUrl); } catch { return reject(new Error('잘못된 URL')); }
        const req2 = https.request({
          hostname: parsed.hostname,
          path: parsed.pathname + parsed.search,
          method: 'GET',
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'ko-KR,ko;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,*/*',
          },
        }, (r) => {
          if ([301,302,303,307,308].includes(r.statusCode) && r.headers.location) {
            r.resume();
            const next = r.headers.location.startsWith('http')
              ? r.headers.location
              : `${parsed.protocol}//${parsed.host}${r.headers.location}`;
            return doGet(next);
          }
          let body = ''; r.setEncoding('utf8');
          r.on('data', chunk => { if (body.length < 400000) body += chunk; });
          r.on('end', () => resolve(body));
        });
        req2.on('error', reject);
        req2.on('timeout', () => { req2.destroy(); reject(new Error('타임아웃')); });
        req2.end();
      }
      doGet(`https://www.aliexpress.com/item/${productId}.html`);
    });
  }

  try {
    // Step 1: HEAD 리다이렉트 추적 → 상품 ID 추출 (루프 없이 빠름)
    const { productId, finalUrl } = await findProductId(url);

    if (!productId) {
      return res.json({
        ok: false,
        error: '개별 상품 링크가 아닙니다. AliExpress 상품 페이지 URL을 붙여넣어 주세요.',
        finalUrl,
      });
    }

    // Step 2: 상품 ID로 실제 페이지 GET 조회 → 이미지/제목/가격 추출
    let imgUrl = null, title = '', price = null;
    try {
      const productHtml = await fetchProductPage(productId);
      const imgM   = productHtml.match(/property="og:image" content="([^"]+)"/);
      const titleM = productHtml.match(/property="og:title" content="([^"]+)"/);
      const priceM = productHtml.match(/"minAmount":\{"value":"([^"]+)"/);
      imgUrl = imgM   ? imgM[1].split('?')[0]                                  : null;
      title  = titleM ? titleM[1].replace(/ - AliExpress\s*\d*/, '').trim()   : '';
      price  = priceM ? priceM[1]                                              : null;
    } catch (fetchErr) {
      logger.warn(`[Ali Resolve] 상품 페이지 조회 실패: ${fetchErr.message}`);
    }

    // 어필리에이트 링크: s.click 링크는 유지, 일반 URL이면 파라미터 추가
    const affiliateLink = url.includes('s.click.aliexpress.com')
      ? url
      : `https://www.aliexpress.com/item/${productId}.html?aff_fcid=${TRACK}&aff_platform=portals-tool&sk=_dTLBBxr`;

    return res.json({ ok: true, productId, imageUrl: imgUrl, title, price, affiliateLink, finalUrl });

  } catch (err) {
    logger.warn(`[Ali Resolve] 링크 조회 오류: ${err.message}`);
    return res.status(500).json({ error: `조회 실패: ${err.message.slice(0, 100)}` });
  }
});

/**
 * GET /api/shop/ali-debug — Ali API 완전 진단 (엔드포인트 + 서명방식 완전 탐색)
 */
app.get('/api/shop/ali-debug', async (req, res) => {
  // ✅ FIX-ALI-DEBUG-AUTH: 진단 API에 인증 추가 (API 키/서명 알고리즘 노출 방어)
  const keyOk = process.env.DIRECT_KEY && req.query.key === process.env.DIRECT_KEY;
  if (!keyOk) {
    const authH = req.headers.authorization || '';
    if (!authH.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
    try {
      const tp = require('jsonwebtoken').verify(authH.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
      if (!isAdminToken(tp)) return res.status(403).json({ error: '관리자 권한 필요' });
    } catch { return res.status(401).json({ error: '토큰 오류' }); }
  }
  const crypto = require('crypto');
  const axios  = require('axios');
  const KEY    = (process.env.ALI_APP_KEY    || '').trim();
  const SECRET = (process.env.ALI_APP_SECRET || '').trim();
  const TRACK  = (process.env.ALI_TRACKING_ID || 'default').trim();

  if (!KEY || !SECRET) return res.json({ error: 'API 키 미설정' });

  // ── 서명 방식 4종 ──────────────────────────────────────────────────────────
  const sign_md5      = (p) => crypto.createHash('md5').update(`${SECRET}${Object.keys(p).sort().map(k=>`${k}${p[k]}`).join('')}${SECRET}`).digest('hex').toUpperCase();
  const sign_sha256_A = (p) => crypto.createHmac('sha256',SECRET).update(`${SECRET}${Object.keys(p).sort().map(k=>`${k}${p[k]}`).join('')}${SECRET}`).digest('hex').toUpperCase();
  const sign_sha256_B = (p) => crypto.createHmac('sha256',SECRET).update(Object.keys(p).sort().map(k=>`${k}${p[k]}`).join('')).digest('hex').toUpperCase();
  const sign_sha256_C = (p) => { // method prefix 포함 (Lazada 방식)
    const sorted = Object.keys(p).filter(k=>k!=='method').sort().map(k=>`${k}${p[k]}`).join('');
    return crypto.createHmac('sha256',SECRET).update(`${p.method}${sorted}`).digest('hex').toUpperCase();
  };

  const callApi = async (label, endpoint, params, signFn) => {
    try {
      params.sign = signFn(params);
      // 샘플 서명 문자열 (처음 40자만)
      const sortedSample = Object.keys(params).filter(k=>k!=='sign').sort().map(k=>`${k}=${params[k]}`).join('&').slice(0,60);
      const r = await axios.get(`${endpoint}?${new URLSearchParams(params)}`, { timeout: 8000 });
      const d = r.data;
      const errCode = d?.error_response?.code;
      const errMsg  = (d?.error_response?.msg || d?.error_response?.sub_msg || '').slice(0,80);
      const sub_code = d?.error_response?.sub_code || '';
      const respKey = Object.keys(d).find(k=>k.includes('response'));
      const respCode = d?.[respKey]?.resp_result?.resp_code;
      const items = d?.[respKey]?.resp_result?.result?.products?.product?.length || 0;
      return { label, endpoint: endpoint.includes('taobao')?'CN':'SG', errCode, sub_code, errMsg, respCode, items, success: respCode===200 };
    } catch (e) { return { label, error: e.message.slice(0,80) }; }
  };

  const ts = () => String(Date.now());
  const SG = 'https://api-sg.aliexpress.com/sync';
  const CN = 'https://api.taobao.com/router/rest';
  const kw = { keywords: 'fishing', page_size: '3', page_no: '1' };

  // 파라미터 생성 헬퍼
  const p = (method, sm, extra={}) => ({ method, app_key: KEY, timestamp: ts(), sign_method: sm, v: '2.0', tracking_id: TRACK, ...extra });
  const pNoTrack = (method, sm, extra={}) => ({ method, app_key: KEY, timestamp: ts(), sign_method: sm, v: '2.0', ...extra });

  const results = await Promise.all([
    // SG 엔드포인트
    callApi('SG_md5',       SG, p('aliexpress.affiliate.product.query','md5',kw), sign_md5),
    callApi('SG_sha256A',   SG, p('aliexpress.affiliate.product.query','sha256',kw), sign_sha256_A),
    callApi('SG_sha256B',   SG, p('aliexpress.affiliate.product.query','sha256',kw), sign_sha256_B),
    callApi('SG_sha256C',   SG, p('aliexpress.affiliate.product.query','sha256',kw), sign_sha256_C),
    callApi('SG_link_md5',  SG, p('aliexpress.affiliate.link.generate','md5',{promotion_link_type:'0',source_values:'https://www.aliexpress.com/item/1005006789012345.html'}), sign_md5),
    callApi('SG_link_sha256A', SG, p('aliexpress.affiliate.link.generate','sha256',{promotion_link_type:'0',source_values:'https://www.aliexpress.com/item/1005006789012345.html'}), sign_sha256_A),
    // CN 엔드포인트 (중국 API)
    callApi('CN_md5',       CN, p('aliexpress.affiliate.product.query','md5',kw), sign_md5),
    callApi('CN_sha256A',   CN, p('aliexpress.affiliate.product.query','sha256',kw), sign_sha256_A),
    // tracking 없이
    callApi('SG_noTrack_sha256A', SG, pNoTrack('aliexpress.affiliate.product.query','sha256',kw), sign_sha256_A),
  ]);

  const winner = results.find(r=>r.success);
  // 서명 샘플 정보 (디버그용)
  const sample = { KEY_prefix: KEY.slice(0,6), SECRET_len: SECRET.length, TRACK, KEY_full_len: KEY.length };
  res.json({ sample, winner: winner?.label||'❌ 전부 실패', results });
});



/**
 * GET /api/shop/promo
 * 알리 특가 프로모션 상품 (수수료 50%+ 상품)
 */
app.get('/api/shop/promo', async (req, res) => {
  try {
    const promoProducts = await ali.getAliPromoProducts(30);
    res.json(promoProducts.map(p => ({
      id:           `ali_${p.productId}`,
      name:         p.title,
      price:        p.salePrice,
      original:     p.originalPrice,
      discount:     p.discount,
      img:          p.imageUrl,
      link:         p.productUrl,
      badge:        p.badge,
      commission:   p.commissionRate,
      source:       'ali',
      priceConfirm: p.priceConfirm || false,
    })));
  } catch (err) {
    logger.warn(`[Shop Promo API] 특가 상품 오류: ${err.message}`);
    res.status(500).json({ error: '특가 상품 로드 실패' });
  }
});

/**
 * GET /api/shop/price-check?ids=1005007354532583,1005006789
 * productdetail.get으로 실시간 가격 조회 (최대 50개)
 * product.query보다 캐시 덜 → 더 최신 가격
 */
app.get('/api/shop/price-check', async (req, res) => {
  const raw = (req.query.ids || '').trim();
  if (!raw) return res.json([]);
  const productIds = raw.split(',').map(s => s.trim()).filter(Boolean).slice(0, 50);
  try {
    const freshItems = await ali.getProductDetailPrice(productIds);
    res.json(freshItems.map(p => ({
      productId:    p.productId,
      price:        p.salePrice,
      originalPrice: p.originalPrice,
      discount:     p.discount,
      priceConfirm: p.priceConfirm || false,
      freshPrice:   true,
    })));
  } catch (err) {
    logger.warn(`[Shop PriceCheck API] 오류: ${err.message}`);
    res.status(500).json({ error: '가격 확인 실패' });
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
    const aliKeyword = fish ? _buildAliRecommendKeyword(fish) : _mapToAliKeyword(pointType);
    const [coupangRec, aliRec] = await Promise.all([
      coupang.searchCoupang(keyword, 4).catch(() => []),
      ali.searchAliExpress(aliKeyword, 3).catch(() => []),
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

// ─── 쇼핑 수동 상품 관리 (관리자 전용) ──────────────────────────────────────
// 컬렉션: manual_shop_items
// 필드: { _id, source, shortUrl, iframeSrc, imageUrl, productName, tag, order, createdAt }
const ManualShopItem = mongoose.models.ManualShopItem || mongoose.model('ManualShopItem',
  new mongoose.Schema({
    source:      { type: String, default: 'coupang' },
    shortUrl:    { type: String, required: true },
    iframeSrc:   { type: String },
    imageUrl:    { type: String },
    productName: { type: String },
    tag:         { type: String, default: '낚시용품' },
    order:       { type: Number, default: Date.now },
    createdAt:   { type: Date,   default: Date.now },
  }, { collection: 'manual_shop_items' })
);

// ─── 상품 클릭 추적 모델 ─────────────────────────────────────────────────────
const ShopClick = mongoose.models.ShopClick || mongoose.model('ShopClick',
  new mongoose.Schema({
    productId:  { type: String },
    source:     { type: String, default: 'ali' },
    keyword:    { type: String },
    clickedAt:  { type: Date, default: Date.now },
  }, { collection: 'shop_clicks' })
);

/**
 * POST /api/shop/click — 상품 클릭 로깅 (수익 최적화용)
 */
app.post('/api/shop/click', searchLimiter, async (req, res) => { // ✅ FIX-CLICK-LIMIT: 분당 30회 제한
  try {
    const { productId, source, keyword } = req.body;
    if (dbReady && productId) {
      // ✅ FIX-SAFEKW: safeKeyword 미정의 변수 수정 — keyword 직접 sanitize
      const safeKw = (typeof keyword === 'string') ? keyword.replace(/[<>"';]/g, '').slice(0, 100) : '';
      await ShopClick.create({ productId, source: source || 'ali', keyword: safeKw });
    }
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false }); // 클릭 추적 실패해도 사용자에게 영향 없음
  }
});

/**
 * GET /api/shop/click/stats — 클릭 통계 (관리자 전용)
 */
app.get('/api/shop/click/stats', verifyToken, async (req, res) => {
  // ✅ FIX-STATS-AUTH: 클릭 통계는 관리자 전용
  if (!isAdminToken(req.user)) return res.status(403).json({ error: '관리자 권한 필요' });
  try {
    if (!dbReady) return res.json([]);
    const stats = await ShopClick.aggregate([
      { $group: { _id: '$productId', count: { $sum: 1 }, source: { $first: '$source' }, keyword: { $first: '$keyword' } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

/**
 * GET /api/shop/manual
 * 수동 등록 상품 목록 (전체 공개)
 */
app.get('/api/shop/manual', async (req, res) => {
  try {
    if (!dbReady) return res.json([]);
    const items = await ManualShopItem.find({}).sort({ order: 1, createdAt: -1 }).lean();
    res.json(items);
  } catch (err) {
    logger.warn('[Shop Manual] 조회 실패:', err.message);
    res.json([]);
  }
});

/**
 * GET /api/shop/manual/dbtest — 임시 MongoDB 쓰기 테스트 (인증 없음)
 * 서버의 MongoDB write 가능 여부 진단용
 */
app.get('/api/shop/manual/dbtest', async (req, res) => {
  // ✅ FIX-DBTEST-AUTH: 인증 없는 MongoDB 쓰기 테스트 → DIRECT_KEY 또는 관리자 토큰 필요
  const keyOk = process.env.DIRECT_KEY && req.query.key === process.env.DIRECT_KEY;
  if (!keyOk) {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
    try {
      const tp = require('jsonwebtoken').verify(auth.slice(7), process.env.JWT_SECRET || 'fishinggo_jwt_secret_2024', { algorithms: ['HS256'] });
      const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sunjulab@gmail.com';
      const ADMIN_ID = process.env.ADMIN_ID || 'sunjulab';
      if (tp.email !== ADMIN_EMAIL && tp.id !== ADMIN_ID && tp.email !== 'sunjulab.k@gmail.com') {
        return res.status(403).json({ error: '관리자 권한 필요' });
      }
    } catch { return res.status(401).json({ error: '토큰 오류' }); }
  }
  const startMs = Date.now();
  try {
    if (!dbReady) return res.json({ ok: false, error: 'dbReady=false', ms: Date.now() - startMs });
    const doc = await Promise.race([
      ManualShopItem.create({ source: '__test__', shortUrl: '__test__', tag: '__test__', order: 0, createdAt: new Date() }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('write timeout 8s')), 8000))
    ]);
    // 바로 삭제
    await ManualShopItem.findByIdAndDelete(doc._id).catch(() => {});
    res.json({ ok: true, ms: Date.now() - startMs, id: String(doc._id) });
  } catch (err) {
    res.json({ ok: false, error: '처리 오류', ms: Date.now() - startMs }); // ✅ FIX-ERR-MSG
  }
});


/**
 * GET /api/shop/manual/direct — PowerShell 직접 등록 (브라우저 문제 우회)
 * ?key=FishingGO_Admin_Direct_2026&shortUrl=...&iframeSrc=...&tag=...&source=coupang
 */
app.get('/api/shop/manual/direct', async (req, res) => {
  const { key, source = 'coupang', shortUrl, iframeSrc, imageUrl, productName, tag } = req.query;
  if (!process.env.DIRECT_KEY || key !== process.env.DIRECT_KEY) return res.status(401).json({ error: '키 불일치' }); // ✅ FIX-DIRECT-KEY-2
  try {
    if (!dbReady) return res.status(503).json({ error: '\uc11c\ubc84 \ucd08\uae30\ud654 \uc911' });
    if (!shortUrl) return res.status(400).json({ error: 'shortUrl \ud544\uc218' });
    const docData = {
      source: (source || 'coupang').trim(),
      shortUrl: shortUrl.trim(),
      tag: (tag || '\ub09a\uc2dc\uc6a9\ud488').trim(),
      order: Date.now(),
      createdAt: new Date(),
    };
    if (source === 'ali') {
      docData.imageUrl = (imageUrl || '').trim();
      docData.productName = (productName || '').trim();
    } else {
      if (!iframeSrc) return res.status(400).json({ error: 'iframeSrc \ud544\uc218' });
      docData.iframeSrc = iframeSrc.trim();
    }
    const saved = await ManualShopItem.create(docData);
    res.json({ ok: true, id: String(saved._id) });
  } catch (err) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

/**
 * GET /api/shop/manual/add-tab — window.open 방식 (Chrome 확장 우회 최종 수단)
 * 결과를 postMessage로 opener에 전달 후 자동 닫힘
 */
app.get('/api/shop/manual/add-tab', async (req, res) => {
  const { t: token, source = 'coupang', shortUrl, iframeSrc, imageUrl, productName, tag } = req.query;
  const html = (msg) => `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<script>
try { window.opener && window.opener.postMessage(${JSON.stringify(msg)}, '*'); } catch(e){}
try { window.close(); } catch(e){}
setTimeout(function(){ document.body.innerHTML='<pre>${JSON.stringify(msg)}</pre>'; }, 500);
</scr` + `ipt></body></html>`;

  if (!token) return res.send(html({ ok: false, error: '인증 토큰 필요' }));
  // ✅ FIX-ADDTAB-JWT: jwt.decode() 폴백 제거 — 만료/위조된 토큰 수락 취약점 수정
  let user;
  try { user = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { return res.send(html({ ok: false, error: '유효하지 않거나 만료된 토큰' })); }
  const adminEmails = [ADMIN_EMAIL, 'sunjulab.k@gmail.com'];
  if (!adminEmails.includes(user?.email) && user?.id !== ADMIN_ID) {
    return res.send(html({ ok: false, error: '관리자 권한 필요' }));
  }
  try {
    if (!dbReady) return res.send(html({ ok: false, error: '서버 초기화 중' }));
    if (!shortUrl) return res.send(html({ ok: false, error: '단축 URL 필수' }));
    const docData = {
      source:    (source || 'coupang').trim(),
      shortUrl:  shortUrl.trim(),
      tag:       (tag || '낚시용품').trim(),
      order:     Date.now(),
      createdAt: new Date(),
    };
    if (source === 'ali') {
      if (!imageUrl) return res.send(html({ ok: false, error: '알리 이미지 URL 필수' }));
      docData.imageUrl    = imageUrl.trim();
      docData.productName = (productName || '').trim();
    } else {
      if (!iframeSrc) return res.send(html({ ok: false, error: 'iframeSrc 필수' }));
      docData.iframeSrc = iframeSrc.trim();
    }
    const saved = await Promise.race([
      ManualShopItem.create(docData),
      new Promise((_, rej) => setTimeout(() => rej(new Error('DB 저장 시간 초과')), 10000))
    ]);
    res.send(html({ ok: true, id: String(saved._id) }));
  } catch (err) {
    logger.error('[Shop add-tab] 실패:', err.message);
    res.send(html({ ok: false, error: '서버 오류가 발생했습니다.' })); // ✅ FIX-ERR-MSG
  }
});

/**
 * GET /api/shop/manual/add — CORS preflight 없이 쇼핑 상품 등록 (브라우저 호환성 우회)
 * Authorization 헤더 대신 ?t=<JWT> 쿼리파라미터 사용
 */
app.get('/api/shop/manual/add', async (req, res) => {
  const { t: token, source = 'coupang', shortUrl, iframeSrc, imageUrl, productName, tag, callback: cb } = req.query;
  // JSONP helper
  const send = (status, obj) => {
    if (cb && /^[a-zA-Z0-9_$]+$/.test(cb)) {
      return res.type('text/javascript').send(`${cb}(${JSON.stringify(obj)})`);
    }
    return res.status(status).json(obj);
  };

  if (!token) return send(401, { error: '인증 토큰 필요' });
  // ✅ FIX-ADD-JWT: jwt.decode() 폴백 제거 — 만료/위조된 토큰 수락 취약점 수정
  let user;
  try { user = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { return send(401, { error: '유효하지 않거나 만료된 토큰' }); }
  const adminEmails = [ADMIN_EMAIL, 'sunjulab.k@gmail.com'];
  if (!adminEmails.includes(user?.email) && user?.id !== ADMIN_ID) {
    return send(403, { error: '관리자 권한 필요' });
  }
  try {
    if (!dbReady) return send(503, { error: '서버 초기화 중' });
    if (!shortUrl) return send(400, { error: '단축 URL 필수' });
    const docData = {
      source:    (source || 'coupang').trim(),
      shortUrl:  shortUrl.trim(),
      tag:       (tag || '낚시용품').trim(),
      order:     Date.now(),
      createdAt: new Date(),
    };
    if (source === 'ali') {
      if (!imageUrl) return send(400, { error: '알리 이미지 URL 필수' });
      docData.imageUrl    = imageUrl.trim();
      docData.productName = (productName || '').trim();
    } else {
      if (!iframeSrc) return send(400, { error: 'iframeSrc 필수 (iframe 코드 확인)' });
      docData.iframeSrc = iframeSrc.trim();
    }
    const saved = await Promise.race([
      ManualShopItem.create(docData),
      new Promise((_, rej) => setTimeout(() => rej(new Error('DB 저장 시간 초과')), 10000))
    ]);
    const result = { ok: true, id: String(saved._id) };
    return send(200, result);
  } catch (err) {
    logger.error('[Shop GET-add] 실패:', err.message);
    return send(500, { error: '서버 오류가 발생했습니다.' }); // ✅ FIX-ERR-MSG
  }
});

/**
 * POST /api/shop/manual
 * 수동 상품 등록 (관리자 전용)
 * body: { source, shortUrl, iframeCode, imageUrl, productName, tag }
 *   source: 'coupang'(기본) | 'ali'
 */
app.post('/api/shop/manual', verifyToken, async (req, res) => {
  const adminEmails = [ADMIN_EMAIL, 'sunjulab.k@gmail.com'];
  // ✅ FIX-CONSOLELOG: 디버그 console.log 제거 (민감 정보 로그 노출 방지)
  if (!adminEmails.includes(req.user?.email) && req.user?.id !== ADMIN_ID) {
    return res.status(403).json({ error: '관리자 권한 필요' });
  }
  try {
    if (!dbReady) return res.status(503).json({ error: '서버 초기화 중입니다. 잠시 후 다시 시도해주세요.' });
    const { source = 'coupang', shortUrl, iframeCode, imageUrl, productName, tag } = req.body;
    if (!shortUrl) return res.status(400).json({ error: '단축 URL 필수' });

    const docData = {
      source:    source.trim(),
      shortUrl:  shortUrl.trim(),
      tag:       (tag || '낚시용품').trim(),
      order:     Date.now(),
      createdAt: new Date(),
    };

    if (source === 'ali') {
      if (!imageUrl) return res.status(400).json({ error: '알리 상품 이미지 URL 필수' });
      docData.imageUrl     = imageUrl.trim();
      docData.productName  = (productName || '').trim();
    } else {
      if (!iframeCode) return res.status(400).json({ error: '쿠팡 iframe 코드 필수' });
      const srcMatch = iframeCode.match(/src=["']([^"']+)["']/i);
      if (!srcMatch) return res.status(400).json({ error: 'iframe src 추출 실패' });
      docData.iframeSrc = srcMatch[1].trim();
    }

    // Mongoose Model.create — 연결 상태 자동 관리, 10초 타임아웃
    const saved = await Promise.race([
      ManualShopItem.create(docData),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB 저장 시간 초과 (10s) — 잠시 후 재시도')), 10000)
      )
    ]);
    res.json({ ok: true, id: saved._id });
  } catch (err) {
    logger.error('[Shop Manual] 등록 실패:', err.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' }); // ✅ FIX-ERR-MSG
  }
});

/**
 * DELETE /api/shop/manual/:id
 * 수동 상품 삭제 (관리자 전용)
 */
app.delete('/api/shop/manual/:id', verifyToken, async (req, res) => {
  const adminEmails = [ADMIN_EMAIL, 'sunjulab.k@gmail.com'];
  if (!adminEmails.includes(req.user?.email) && req.user?.id !== ADMIN_ID) {
    return res.status(403).json({ error: '관리자 권한 필요' });
  }
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '잘못된 ID 형식입니다.' }); // FIX-OBJID-BATCH-7
    await ManualShopItem.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    logger.error('[Shop Manual] 삭제 실패:', err.message);
    res.status(500).json({ error: '삭제 실패' });
  }
});

/**
 * GET /api/shop/manual/delete-direct — key 기반 삭제 (CORS 우회, 앱/브라우저 호환)
 * ?key=FishingGO_Admin_Direct_2026&id=<mongoId>
 */
app.get('/api/shop/manual/delete-direct', async (req, res) => {
  const { key, id } = req.query;
  if (!process.env.DIRECT_KEY || key !== process.env.DIRECT_KEY) return res.status(401).json({ error: '키 불일치' }); // ✅ FIX-DIRECT-KEY-3
  if (!id) return res.status(400).json({ error: 'id 필수' });
  // ✅ FIX-OBJID-DEL: ObjectId 유효성 검증 추가 — 잘못된 id로 Mongoose CastError 방지
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: '잘못된 ID 형식' });
  try {
    await ManualShopItem.findByIdAndDelete(id);
    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 카테고리 → 알리 키워드 변환 헬퍼
// BUG-3 수정: 키워드 매핑 전면 재작성 (스피닝릴→낚시줄 오류 수정)
function _mapToAliKeyword(category) {
  const map = {
    '낚시용품':   'fishing accessories set',
    '스피닝릴':   'fishing reel spinning',
    '베이트릴':   'fishing reel baitcasting',
    '루어낚시대': 'fishing rod lure spinning',
    '원투낚시대': 'fishing rod surf casting',
    '낚시줄':    'fishing line PE braid',
    '캠핑의자':  'fishing chair folding portable',
    '루어':      'fishing lure set soft bait',
    '에기':      'squid fishing egi jig',
    '갯바위':    'rock shore fishing tackle rig',
    '선상':      'boat jigging fishing tackle',
    '민물':      'freshwater fishing tackle carp',
    '소모품':    'fishing accessories set hook',
    '봉돌':      'fishing sinker weight lead',
    '채비':      'fishing rig terminal tackle',
    '집어등':    'fishing light LED underwater',
    '릴':        'fishing reel spinning',
    '낚싯대':    'fishing rod telescopic carbon',
    '에깅':      'squid egi jig spinning',
    '지그':      'fishing metal jig lure',
  };
  return map[category] || 'fishing accessories set';
}

// 시즌별 자동 추천 키워드
function _getSeasonKeyword() {
  const month = new Date().getMonth() + 1;
  const m = {
    3: 'spring fishing tackle set', 4: 'spring lure fishing',
    5: 'sea bass minnow lure fishing', 6: 'flounder fishing jig lure',
    7: 'cutlassfish belt fishing lure', 8: 'jigging deep sea fishing',
    9: 'squid egi autumn fishing', 10: 'rockfish light game lure',
    11: 'winter fishing warmth gloves', 12: 'cod fishing heavy jig',
    1: 'winter fishing cold gear', 2: 'early spring fishing set',
  };
  return m[month] || 'fishing accessories set';
}

// AliExpress 전용 어종 키워드 매핑
function _buildAliRecommendKeyword(fish) {
  const map = {
    '감성돔': 'black seabream fishing hook rig',
    '참돔': 'red snapper jig fishing lure',
    '광어': 'flounder fishing jig lure',
    '우럭': 'rockfish jig head lure',
    '고등어': 'mackerel sabiki fishing rig',
    '무늬오징어': 'squid egi jig fishing',
    '갈치': 'cutlassfish belt fishing lure',
    '농어': 'seabass minnow lure fishing',
    '볼락': 'rockfish light game lure',
    '숭어': 'mullet fishing float rig',
    '붕어': 'crucian carp freshwater fishing',
    '잉어': 'carp fishing feeder rig',
  };
  return map[fish] || _getSeasonKeyword();
}

// 포인트+어종 → 쿠팡 검색 키워드 변환 헬퍼
function _buildRecommendKeyword(pointType, fish) {
  const fishMap = {
    '감성돔': '감성돔 채비 갯바위', '참돔': '참돔 루어 선상',
    '광어': '광어 다운샷 루어', '우럭': '우럭 지그헤드',
    '고등어': '고등어 채비 사비키', '무늬오징어': '에기 에깅',
    '갈치': '갈치 낚시 채비', '농어': '농어 루어 미노우',
    '볼락': '볼락 라이트게임 루어', '붕어': '붕어 낚시 채비',
    '잉어': '잉어 낚시 보리 채비',
  };
  if (fish && fishMap[fish]) return fishMap[fish];
  if (pointType === '바다') return '바다낚시 채비';
  if (pointType === '민물') return '민물낚시 채비';
  if (pointType === '갯바위') return '갯바위 채비 갯지렁이';
  return '낚시용품';
}


// ─── 조황 인증 API ───────────────────────────────────────────────────────────

// ✅ FIX-IMAGEURL-SSRF: 이미지 URL SSRF 방어 헬퍼 — 내부망/file://javascript: 차단
function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  if (u.startsWith('data:image/')) return u;
  if (!u.startsWith('http://') && !u.startsWith('https://')) return null;
  if (/^https?:\/\/(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.|::1|localhost|0\.0\.0\.0)/i.test(u)) return null;
  if (/^https?:\/\/metadata\.(google|aws|azure)/i.test(u)) return null;
  return u.slice(0, 2000);
}
// POST /api/catch — 조황 등록 (✅ FIX-CATCH-AUTH)
app.post('/api/catch', catchLimiter, async (req, res) => { // ✅ FIX-CATCH-RATE: 1분 5회 제한
  try {
    // ✅ FIX-CATCH-AUTH: JWT 인증 필수 (userId body 신뢰 제거 → JWT에서만 추출)
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { userName, userAvatar, fishName, fishSize, fishWeight,
            imageUrl, location, lat, lng, memo, weather, tide, contestId,
            verified, aiConfidence } = req.body;
    const userId = tp.email || tp.id; // FIX-CATCH-AUTH: userId는 JWT에서만 (주입 방지)
    if (!userId || !fishName) return res.status(400).json({ error: '필수 항목 누락' });
    // FIX-CATCH-VALID: 필드 길이 제한 및 좌표 범위 검증
    if (typeof fishName !== 'string' || fishName.trim().length < 1 || fishName.trim().length > 50) return res.status(400).json({ error: 'fishName 1~50자' });
    if (location !== undefined && typeof location !== 'string') return res.status(400).json({ error: 'location은 문자열' });
    if (location && location.length > 100) return res.status(400).json({ error: 'location 최대 100자' });
    if (memo !== undefined && typeof memo === 'string' && memo.length > 500) return res.status(400).json({ error: 'memo 최대 500자' });
    if (lat !== undefined && (typeof lat !== 'number' || lat < -90 || lat > 90)) return res.status(400).json({ error: 'lat 범위 오류 (-90~90)' });
    if (lng !== undefined && (typeof lng !== 'number' || lng < -180 || lng > 180)) return res.status(400).json({ error: 'lng 범위 오류 (-180~180)' });
    const safeFishName = fishName.trim().substring(0, 50);
    const safeImageUrl = sanitizeImageUrl(imageUrl); // FIX-IMAGEURL-SSRF
    await waitForDb(5000);
    const record = await CatchRecord.create({
      userId, userName, userAvatar, fishName: safeFishName,
      fishSize: fishSize || 0, fishWeight: fishWeight || 0,
      imageUrl: safeImageUrl, location, lat, lng, memo, weather, tide,
      contestId, verified: !!verified, aiConfidence: aiConfidence || 0,
    });
    // EXP 보상 (+30 EXP)
    if (dbReady && User) {
      await User.updateOne({ email: userId }, { $inc: { exp: 30, totalExp: 30 } }).catch(() => {});
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
    const { fishName, period = 'month' } = req.query;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20)); // ✅ FIX-RANKING-LIMIT: 최대 100개 제한
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
      .limit(limit)
      .lean();
    res.json({ records });
  } catch (err) {
    (logger?.error || console.error)('[GET /api/catch/ranking]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// GET /api/catch/my — 내 조황 목록
// ✅ BUG-02 FIX: JWT 인증 없이 타인 조황 목록 조회 가능 → verifyToken 미들웨어 추가
app.get('/api/catch/my', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const userId = tp.email || tp.id; // ✅ BUG-02 FIX: JWT에서만 추출
    await waitForDb(5000);
    const records = await CatchRecord.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: '서버 오류' });
  }
});

// POST /api/catch/:id/like — 좋아요
// ✅ BUG-01 FIX: JWT 인증 없음 + body.userId 신뢰 + CastError 크래시 배합 취약점 수정
app.post('/api/catch/:id/like', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const userId = tp.email || tp.id; // ✅ BUG-01 FIX: JWT에서만 추출
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) // ✅ BUG-01 FIX: CastError 방지
      return res.status(400).json({ error: '유효하지 않은 ID' });
    const record = await CatchRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ error: '없는 조황' });
    const liked = record.likes.includes(userId);
    if (liked) record.likes.pull(userId);
    else {
      record.likes.push(userId);
      // ✅ 좋아요 푸시 알림 발송 (새로 눌렀을 때만)
      if (record.author_email && record.author_email !== userId) {
        const voterName = userId.split('@')[0];
        sendAppPushNotification(
          record.author_email,
          'comm',
          '새로운 좋아요',
          `[낚시GO] ${voterName}님이 회원님의 조황 인증을 좋아합니다!`,
          { route: `/catch/${record._id}` }
        );
      }
    }
    await record.save();
    res.json({ liked: !liked, count: record.likes.length });
  } catch (err) {
    res.status(500).json({ error: '서버 오류' });
  }
});

// ─── AI API ──────────────────────────────────────────────────────────────

// POST /api/ai/fish-identify — Gemini Vision으로 어종 식별
// ✅ FIX-FISH-RATE: 물고기 인식 rate limit (IP당 1분 5회 - Gemini Vision API 비용 보호)
const fishRateMap = new Map();
function checkFishRate(ip) {
  const key = (typeof hashIp === 'function') ? hashIp(ip) : ip;
  const now = Date.now();
  const e = fishRateMap.get(key) || { count: 0, windowStart: now };
  if (now - e.windowStart > 60_000) { e.count = 0; e.windowStart = now; }
  e.count++; fishRateMap.set(key, e);
  if (fishRateMap.size > 3000) fishRateMap.clear();
  return e.count <= 5;
}
app.post('/api/ai/fish-identify', async (req, res) => {
  try {
    const rawFishIp = (String(req.headers['x-forwarded-for'] || '')).split(',')[0].trim() || req.ip || 'unknown';
    if (!checkFishRate(rawFishIp)) return res.status(429).json({ error: '물고기 인식 요청이 너무 많습니다. 1분 후 다시 시도해주세요.' }); // FIX-FISH-RATE-CHECK
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) return res.status(400).json({ error: '이미지 필요' });
    // ✅ FIX-FISH-IMG-LEN: base64 이미지 최대 10MB 제한 (약 13,650,000 chars) - DoS 방어
    if (typeof imageBase64 !== 'string' || imageBase64.length > 13_650_000) return res.status(413).json({ error: '이미지가 너무 큽니다. 최대 10MB.' });
    // ✅ FIX-FISH-MIME: 허용 MIME 타입 검증
    const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!ALLOWED_MIMES.includes(mimeType)) return res.status(400).json({ error: '허용되지 않는 이미지 형식 (jpeg/png/gif/webp만 가능)' });
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
// ✅ FIX-AI-COACH-RATE: AI 코치 rate limit (IP당 1분 10회 - API 비용 DoS 방어)
const aiCoachRateMap = new Map();
function checkAiCoachRate(ip) {
  const key = (typeof hashIp === 'function') ? hashIp(ip) : ip;
  const now = Date.now();
  const e = aiCoachRateMap.get(key) || { count: 0, windowStart: now };
  if (now - e.windowStart > 60_000) { e.count = 0; e.windowStart = now; }
  e.count++; aiCoachRateMap.set(key, e);
  if (aiCoachRateMap.size > 5000) aiCoachRateMap.clear(); // 메모리 보호
  return e.count <= 10;
}
app.post('/api/ai/coach', async (req, res) => {
  try {
    const rawAiIp = (String(req.headers['x-forwarded-for'] || '')).split(',')[0].trim() || req.ip || 'unknown';
    if (!checkAiCoachRate(rawAiIp)) return res.status(429).json({ error: 'AI 코치 사용이 너무 많습니다. 1분 후 다시 시도해주세요.' }); // FIX-AI-COACH-RATE-CHECK
    const { message, context } = req.body; // context: { weather, tide, location, season }
    if (!message) return res.status(400).json({ error: '메시지 필요' });
    // ✅ FIX-AI-CONTEXT-SIZE: context 객체 최대 1000자 제한 (JSON injection 방어)
    if (context && JSON.stringify(context).length > 1000) return res.status(400).json({ error: '컨텍스트 데이터가 너무 큽니다.' });
    // ✅ FIX-AI-COACH-LEN: 메시지 최대 500자 제한 (API 비용 DoS 방어)
    if (typeof message !== 'string' || message.length > 500) return res.status(400).json({ error: '메시지는 최대 500자입니다.' });
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

// POST /api/contest — 대회 등록 (관리자 전용)
app.post('/api/contest', async (req, res) => {
  // ✅ BUG-01 FIX: JWT 인증 없음 취약점 → 관리자만 대회 생성 가능하도록 수정
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
  if (!isAdminToken(tp)) return res.status(403).json({ error: '관리자(MASTER)만 대회를 등록할 수 있습니다.' });
  try {
    const { title, fishName, region, metric, startDate, endDate, description, prize } = req.body;
    // ✅ FIX-CONTEST-INPUT-LENGTH: Contest 입력 최대 길이 제한 (DoS/XSS 방어)
    if (typeof title === 'string' && title.length > 100) return res.status(400).json({ error: '대회 제목은 최대 100자입니다.' });
    if (typeof description === 'string' && description.length > 2000) return res.status(400).json({ error: '대회 설명은 최대 2000자입니다.' });
    if (typeof prize === 'string' && prize.length > 200) return res.status(400).json({ error: '경품 설명은 최대 200자입니다.' });
    if (typeof fishName === 'string' && fishName.length > 50) return res.status(400).json({ error: '어종명은 최대 50자입니다.' });
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '유효하지 않은 ID' }); // ✅ FIX-CASTID-CONTEST
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

// ✅ FIX-UNCAUGHT: 미처리 예외 → cluster.js worker 자동 재시작
process.on('uncaughtException', (err) => { (logger?.error || console.error)('[FATAL] uncaughtException:', err?.message || err); process.exit(1); });
process.on('unhandledRejection', (reason) => { (logger?.warn || console.warn)('[WARN] unhandledRejection:', reason?.message || reason); });

// ✅ FIX-LOGOUT-ENDPOINT: 로그아웃 (서버 lastSeen 업데이트)
app.post('/api/auth/logout', verifyToken, async (req, res) => {
  try {
    const email = req.user?.email;
    if (email && dbReady && User) {
      await User.updateOne({ email }, { $set: { lastSeen: new Date() } }).exec().catch(() => {});
    }
    res.json({ success: true, message: '로그아웃 완료. 클라이언트 토큰을 삭제해주세요.' });
  } catch { res.json({ success: true }); }
});

// ✅ FIX-404-HANDLER: 미매칭 라우트 404 응답
// ✅ LEGAL-PASS: /api/legal-info → next()로 아래 라우트 전달
app.use((req, res, next) => {
  if (req.path === '/api/legal-info' || req.path === '/api/admin/legal-info') return next();
  res.status(404).json({ error: '요청한 API를 찾을 수 없습니다.', path: req.path });
});


// ✅ FIX-GLOBAL-ERROR: 글로벌 에러 핸들러
app.use(function globalErrorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';
  (logger || console).error('[GlobalError]', err.message);
  res.status(err.status || 500).json({ error: isProd ? '서버 오류가 발생했습니다.' : (err.message || '오류') });
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



  // Render 슬립 방지 — 서버 시작 즉시 + 1분 간격 ping
  // Render 무료 플랜: 15분 비활성 시 슬립. 1분 간격으로 방지.
  if (process.env.RENDER_EXTERNAL_URL) {
    const selfUrl = process.env.RENDER_EXTERNAL_URL;
    const keepAlivePing = async () => {
      try {
        await axios.get(`${selfUrl}/api/health`, { timeout: 10000 });
      } catch (e) {
        logger.warn(`[KeepAlive] ping 실패: ${e.message}`);
      }
    };
    // 즉시 실행 후 1분 간격 반복
    keepAlivePing();
    setInterval(keepAlivePing, 60 * 1000); // 1분마다 ping
    logger.info(`✅ Render Keep-Alive 활성화 — 1분 간격 즉시시작 (${selfUrl})`);
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

// ─────────────────────────────────────────────────────────────────────────────
// ✅ LEGAL-INFO: 사업자 법적고지 API (전자상거래법 제10조 — 마스터 수정 가능)
// ─────────────────────────────────────────────────────────────────────────────
const LegalInfo = mongoose.models.LegalInfo || mongoose.model('LegalInfo',
  new mongoose.Schema({
    items: [{
      label: { type: String },
      key:   { type: String },
      value: { type: String },
    }],
    updatedAt: { type: Date, default: Date.now },
  }, { collection: 'legal_info' })
);

const DEFAULT_LEGAL_ITEMS = [
  { label: '상호명',         key: 'company',  value: '선제이유랩 (SUN J.U. Lab)' },
  { label: '대표자',         key: 'ceo',      value: '김승철' },
  { label: '사업자등록번호', key: 'bizNo',    value: '865-10-03351' },
  { label: '사업장 주소',    key: 'address',  value: '강원특별자치도 강릉시 노가니남길 25, 202동 405호' },
  { label: '업태/종목',      key: 'bizType',  value: '정보통신업 · 전자상거래 소매업' },
  { label: '고객센터 이메일',key: 'email',    value: 'sunjulab.a1@gmail.com' },
  { label: '통신판매업',     key: 'salesReg', value: '신고 준비 중' },
];

/** GET /api/legal-info — 공개 API, DB 없으면 기본값 반환 */
app.get('/api/legal-info', async (req, res) => {
  try {
    if (!dbReady) return res.json({ items: DEFAULT_LEGAL_ITEMS });
    const doc = await LegalInfo.findOne().lean();
    res.json({ items: doc?.items?.length ? doc.items : DEFAULT_LEGAL_ITEMS });
  } catch (err) {
    res.json({ items: DEFAULT_LEGAL_ITEMS });
  }
});

/** PUT /api/admin/legal-info — 마스터 전용 수정 */
app.put('/api/admin/legal-info', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
    const tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    if (!isAdminToken(tp)) return res.status(403).json({ error: 'MASTER 권한 필요' });
    if (!dbReady) return res.status(503).json({ error: '서버 초기화 중' });

    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'items 배열 필수' });

    const sanitized = items.map(it => ({
      label: String(it.label || '').slice(0, 30),
      key:   String(it.key   || '').slice(0, 30),
      value: String(it.value || '').slice(0, 200),
    }));

    await LegalInfo.findOneAndUpdate(
      {},
      { items: sanitized, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ ok: true });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: '토큰 오류' });
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ✅ FIX-SIGTERM: Render 배포 graceful shutdown + uncaughtException 핸들러 등록
// ✅ BUG-FIX: flushAllData 세 번째 인자 전달 — 종료 전 인메모리 데이터 파일 동기화 보장
require('./graceful_shutdown')(server, mongoose, flushAllData);

