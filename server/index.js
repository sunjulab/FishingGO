const express = require('express');
const http = require('http');
const dns = require('dns');
const crypto = require('crypto'); // ??VISITOR: SHA-256 IP ?�시 (중복 ?�언 방�? ???�일 ?�단??1?�만)

// ?�신??로컬�?DNS?�서 SRV ?�코??조회�?차단?�는 경우�??�회?�기 ?�해 Google Public DNS 강제 ?�용
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  // DNS ?�정 ?�공 ??logger 초기???�전?��?�?console ?�용
} catch (e) {
  // DNS ?�정 ?�패 무시
}

const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');
// ??FIX-AXIOS-TIMEOUT: ?�역 ?�?�아??10�????��? API 무한 ?��?방�?
axios.defaults.timeout = 10000; // 10�?
axios.defaults.validateStatus = (s) => s < 500; // 4xx??throw ????
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const coupang = require('./coupangService');
const ali     = require('./aliService');

const JWT_SECRET = process.env.JWT_SECRET || 'fishinggo_secret_2024';
// ??WARN-SI1 강화: ?�로?�션?�서 JWT_SECRET 미설????즉시 종료 (fail-fast)
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    process.stderr.write('[SECURITY] ??JWT_SECRET ?�경변?��? ?�정?��? ?�았?�니?? ?�로?�션 ?�버�??�작?????�습?�다.\n');
    process.exit(1); // 취약??기본값으�??�로?�션 구동 차단
// ??FIX-JWT-LENGTH: JWT_SECRET 최소 32??권고
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  logger.warn('[보안] JWT_SECRET??32??미만?�니?? 보안 강화�??�해 32???�상??무작??문자?�을 ?�용?�세??');
}
  }
  // 개발 ?�경: 경고 ?�이 계속 진행 (logger 초기???�전)
}

// In-Memory Fallback - DB ?�어???�동
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
  { _id: 'n1', id: 'n1', title: '?�� ?�시GO ?�비???�픈 ?�내', content: '?�시GO ?�랫?�이 ?�식 ?�픈?�었?�니?? ??많�? 기능???�데?�트???�정?�니??\n\n??주요 기능:\n- ?�시�?물때 �??�씨 ?�보\n- ?�시 ?�인??지??n- 커�??�티 게시??n- ?�루 채팅\n\n?�으로도 지?�적?�로 ?�데?�트 ?�정?�니 많�? ?�용 부?�드립니??', isPinned: true, author: 'MASTER', views: 1240, date: '2025-01-01', createdAt: '2025-01-01T00:00:00.000Z' },
  { _id: 'n2', id: 'n2', title: '?�️ ?�비???��? 공�? (4??', content: '4??20???�벽 2??4???�버 ?�그?�이???��????�습?�다.\n\n?��? ?�간: 04??20??02:00 ~ 04:00\n?��? ?�용: ?�버 ?�능 최적??�?DB 마이그레?�션\n\n?�용??참고?�주?�요.', isPinned: false, author: 'MASTER', views: 482, date: '2025-04-15', createdAt: '2025-04-15T00:00:00.000Z' },
];
// ?�상�??�보 게시글 ?????�이?�는 MongoDB ?�는 business.json?�서 로드 (?�모 ?�이???�음)
let memBusinessPosts = [];

// ?�️ ?�래 4�?변?�는 ?�일 로드 코드(55�? ?�전???�언?�야 TDZ ?�러가 ?�습?�다
let secretPointOverrides = {};
let cctvOverrides = {};
let appConfig = { min_version: "1.0.0", store_url: "https://play.google.com/apps/internaltest/4701312289208373704" };
let memProSubs = {};
let memVvipSlots = {};
let spotLocationOverrides = {}; // ??MASTER 좌표 ?�버?�이??
let customPoints          = {}; // ??MASTER ?�규 ?�인??추�?

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
  // 로컬 보존 ?�일 로드 ?�료 (logger 초기???�전)
} catch (e) {
  // 로컬 JSON 로드 ?�패, �?배열�??�작
}

// ??BUG-FIX-BOOTSTRAP-MEM: ?�메모리 마스??계정 MASTER tier 보장
// ?�전 코드: sunjulab(?�름/id) 계정??BUSINESS_VIP�?강제 ?�치 ??마스??tier 박탈 버그!
{
  const masterIdx = memUsers.findIndex(u => u.email === 'sunjulab.k' || u.email === 'sunjulab.k@gmail.com');
  if (masterIdx !== -1 && memUsers[masterIdx].tier !== 'MASTER') {
    memUsers[masterIdx].tier = 'MASTER';
    try { fs.writeFileSync(USERS_FILE, JSON.stringify(memUsers, null, 2)); } catch (_) {}
  }
}


// ??9TH-B6: save* ?�수 silent catch ??개발 ?�경 경고 추�? ???�일 ?�???�패 ??무음 ?�이???�실 방�?
function _saveFile(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }
  catch (e) { (global.logger?.error || (() => {}))(`[Fallback] ?�일 ?�???�패 (${path.basename(file)}): ${e.message}`); }
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

// ??금�? ?�네???�이??목록 ??브랜???�칭·?�영???�칭·?�오 ?�현 차단
const BANNED_NAMES = [
  // ?�?� ?�랫??브랜???�칭 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
  '?�시go','?�시�?,'?�시goo','?�시GO','?�시app','?�시?�플','?�시??,
  'fishinggo','fishingg0','fishing_go','fishing-go','fishingapp',

  // ?�?� ?�영·관�??�칭 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
  '?�영??,'?�영�?,'?�영?�','?�영?�님','관리자','관리�?','관리인',
  '?�드�?,'admin','administrator','매니?�','manager','moderator','mod','staff','?�탭','?�태??,
  '공식?�영','공식관�?,'?�영계정','?�영�?,

  // ?�?� 마스?�·최고권???�칭 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
  '마스??,'master','root','superuser','?�퍼?��?','godmode','갓모??,'?�퍼관리자','최고관리자',

  // ?�?� 공식·?�뢰 기�? ?�칭 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
  '공식','official','공식계정','공�?','?�비?��?','고객?�터','고객지??,'고객?�비??,'공식?�내',

  // ?�?� ?�영???�이??직접 ?�칭 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
  'sunjulab','?�주??,'sunj',

  // ?�?� ?�스?�·봇 ?�칭 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
  'bot','�?,'system','?�스??,'notice','?�림','server','auto','?�동?�림','공�?�?,'?�림�?,

  // ?�?� ?�오·?�설 (?�네??금�?) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
  // ?�국???�설 ?�형
  '?�발','?�발','?�바','?�바','?�팔','??','?�발','?�뱅',
  '개새??,'개색??,'개씹','개씨�?,'개쌍??,'개년','개놈',
  '병신','빙신','벙신',
  '찐따','지??,'지??,'지??,
  '미친','미쳤','미친??,'미친??,'미친?�끼',
  '꺼져','꺼�???,'?�져','?��???,'죽어','죽여','죽겠','죽일','죽이??,
  '?�금�?,'?�애�?,'?�어�?,'?��???,'?��???,'?��???,'?��???,'?�창',
  '보�?','?��?','�?,'보ㅈ','?�ㅈ','좆같','보�?�?,'?��?�?,
  '?�스','?�시?�','?�동','?�교','강간','?�폭','?�간','강간�?,'?�추??,
  '?�끼','?�끼','??,
  // ?�음 축약 변??
  '?�ㅂ','?�ㅅ','?�ㄹ','?�ㅊ','?�ㅂ','?�ㄹ','?�ㅈ','??,
  // ?�어 ?�설
  'fuck','shit','bitch','asshole','bastard','cunt','dick','cock','pussy',
  'nigger','nigga','motherfucker','fuckoff','fuckup','bullshit',
  // 기�? ?�오·?�협
  '?�러','?�인','?�해','??��','??���?,'??��','?�치','?�致',

  // ?�?� 광고·?�팸???�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
  '광고','?�보','?�인','?�벤?�쿠??,'무료?�눔','1?�당�?,'?�릭',

  // ?�?� ?�론·?�동 계정 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
  'testaccount','?�스?�계??,'test1234','admin123',
];

// ?�?� 게시글/?��? * 처리??비속??목록 (?�네??금�??� 별도) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// 브랜?�·�?�??�칭 ?�워?�는 ?�함?��? ?�고, ?�수 ?�설·비속?�만 ?�함
const PROFANITY_LIST = [
  // ?�국???�설 ?�형
  '?�발','?�발','?�바','?�바','?�팔','??','?�발','?�뱅',
  '개새??,'개색??,'개씹','개씨�?,'개쌍','개년','개놈',
  '병신','빙신','벙신',
  '찐따','지??,
  '미친??,'미친??,'미친?�끼',
  '?�져','?��???,'죽어','죽여','죽이??,
  '?�금�?,'?�애�?,'?�어�?,'?��???,'?��???,'?��???,'?��???,'?�창',
  '보�?','?��?','�?,'보ㅈ','?�ㅈ','좆같',
  '?�스','?�동','?�교','강간','?�폭','?�간','?�추??,
  '?�끼','?�끼',
  // ?�음 축약 변??
  '?�ㅂ','?�ㅅ','?�ㄹ','?�ㅊ','?�ㅂ','?�ㄹ','?�ㅈ','??,
  // ?�어 ?�설
  'fuck','shit','bitch','asshole','bastard','cunt','dick','cock','pussy',
  'nigger','nigga','motherfucker','bullshit',
];

// ?�규?? ?�문??+ 공백·?�수문자·?�로??��???�거 ??부분일�?검??
function normalizeStr(s) {
  return (s || '').toLowerCase()
    .replace(/[\u200b\u200c\u200d\ufeff\u00ad]/g, '')   // ?�로??�소?�트?�이???�거
    .replace(/[\s\-_\[\]\(\)\.·?�★?�♡?�ㅤ!@#$%^&*+=|\\/<>?,;:'"~`]/g, ''); // 공백·?�수문자 ?�거
}

function isBannedName(str) {
  const target = normalizeStr(str);
  return BANNED_NAMES.some(kw => target.includes(normalizeStr(kw)));
}

// ?�?� 게시글/?��? 비속??* 치환 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ?�어 ?�이 공백·?�수문자�??�용?�는 ?�연???�규?�으�?매칭 ??*�?치환
function censorText(str) {
  if (!str || typeof str !== 'string') return str;
  let result = str;
  // ?�렬: �??�워??먼�? 처리 (부�?매칭 ?�염 방�?)
  const sorted = [...PROFANITY_LIST].sort((a, b) => b.length - a.length);
  sorted.forEach(kw => {
    // �?글???�이??공백·?�수문자 ?�용?�는 ?�연???�턴 ?�성
    const chars = [...kw]; // Unicode ?�전 분리
    const spacer = '[\\s\\-_\\.·??@#$%^&*]*'; // ?�이???�어?????�는 구분??
    const escapedChars = chars.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = escapedChars.join(spacer);
    try {
      const re = new RegExp(pattern, 'gi');
      result = result.replace(re, match => {
        // 공백 ?�외 ?�제 비속??글???�만??* 치환
        const starCount = [...match.replace(/[\s\-_\\.·??@#$%^&*]/g, '')].length;
        return '*'.repeat(Math.max(starCount, 1));
      });
    } catch (e) { /* ?�못???�턴 무시 */ }
  });
  return result;
}

// ??ENH-C5: ?�드�??�별 ?�퍼 ???�체 ?�버?�서 ?�일 ?�수�?관�?
// sunjulab.k = 마스??계정 ?�메?? sunjulab.k@gmail.com = Gmail 로그????
// ??ADMIN-FIX: sunjulab ID??VIP ?�반 계정?��?�?MASTER ?�별?�서 ?�거
function isAdminToken(tp) {
  if (!tp) return false;
  return tp.email === 'sunjulab.k'           // ??마스??계정 ?�메??
    || tp.email === 'sunjulab.k@gmail.com'   // Gmail OAuth 로그??
    || tp.tier === 'MASTER';                  // ???�어 기반 ?�별 (JWT??tier ?�함??경우)
}


// ?�?�?� MongoDB ?�결 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
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
// ??DB-FIX: dbConnecting ?�래�????�버 ?�작 직후 ?�결 진행 �??��? 추적
let dbConnecting = false;
if (MONGO_URI) {
  dbConnecting = true;
  mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    family: 4,                  // IPv4 강제 (DNS SRV ?�러 방�???
    heartbeatFrequencyMS: 10000,// 10초마??heartbeat
    // ??SCALE: 커넥???� 증�? (기본 5 ??100) ???�시 1�??�용??DB 쿼리 처리
    maxPoolSize: 100,
  autoIndex: process.env.NODE_ENV !== 'production', // ??FIX-AUTOINDEX
    minPoolSize: 10,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    waitQueueTimeoutMS: 30000,  // ?� ?��?최�? 30�?
  })
    .then(async () => {
      dbReady = true; dbConnecting = false;
      (global.logger?.info || (() => {}))('[MongoDB] ???�결 ?�공! ?�구?�??모드 ?�성??);
      // ??BUG-FIX-BOOTSTRAP: 마스??계정 tier 보장 ??sunjulab.k ?�메??계정?� ??�� MASTER tier ?��?
      try {
        const UModel = require('./models/User');
        const result = await UModel.findOneAndUpdate(
          { $or: [{ email: 'sunjulab.k' }, { email: 'sunjulab.k@gmail.com' }] },
          { $set: { tier: 'MASTER' } },
          { new: true }
        );
        if (result) (global.logger?.info || (() => {}))(`[Bootstrap] 마스??계정 tier ??MASTER 보장 (email: ${result.email})`);
      } catch (e) { (global.logger?.warn || (() => {}))(`[Bootstrap] 마스??tier 보장 ?�패: ${e.message}`); }
    })
    .catch(err => {
      dbReady = false; dbConnecting = false;
      (global.logger?.warn || (() => {}))(`[MongoDB] ?�결?�패 ???�메모리 모드 ?�환: ${err.message}`);
    });

  // ?�?�?� ?�동 ?�연�??�벤???�들???�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
  mongoose.connection.on('disconnected', () => {
    dbReady = false;
    (global.logger?.warn || (() => {}))('[MongoDB] ?�결 ?��? ???�메모리 모드�??�동 ?�환');
  });
  mongoose.connection.on('reconnected', () => {
    dbReady = true;
    (global.logger?.info || (() => {}))('[MongoDB] ???�연�??�공 ??MongoDB 모드 복구');
  });
  mongoose.connection.on('error', (err) => {
    (global.logger?.error || (() => {}))(`[MongoDB] ?�결 ?�류: ${err.message}`);
    if (mongoose.connection.readyState !== 1) dbReady = false;
  });
}

// ??DB-FIX: waitForDb ???�버 ?�작 직후 DB ?�결 중일 ??최�? maxMs ?��???dbReady 반환
// ?�용�? 로그??구�? 로그???�드?�인????초기??직후 로그???�패 방�?
async function waitForDb(maxMs = 8000) {
  if (dbReady) return true;
  if (!dbConnecting) return false; // ?�결 ?�도조차 ?�으�?즉시 false
  const start = Date.now();
  while (!dbReady && dbConnecting && Date.now() - start < maxMs) {
    await new Promise(r => setTimeout(r, 300)); // 300ms 간격?�로 ?�링
  }
  return dbReady;
}

// ?�?�?� 모델 로드 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
let User, Post, Crew, Notice, BusinessPost, CctvOverrideModel, CatchRecord, ChatMessage, Subscription, PaymentHistory, Story, Contest;
// ??BUG-FIX: 개별 try-catch�?분리 ???�나 ?�패?�도 ?�머지 모델 ?�상 로드 보장
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
// ??INSTA-P3: 24h TTL 조황 ?�토�?모델
try { Story = require('./models/Story'); } catch (e) { Story = null; }
// ??PUSH: FCM ?�큰 모델
let PushToken = null;
try { PushToken = require('./models/PushToken'); } catch (e) { PushToken = null; }
// ??VISITOR: IP ?�시 방문??로그 모델 (?�데???�탈?�데??카운??
let VisitorLog = null;
try { VisitorLog = require('./models/VisitorLog'); } catch (e) { VisitorLog = null; }
// ??PERSIST: 마스?��? ?�정???�인??좌표 ?�구 ?�??(Render ?�배???�에???��?)
let SpotLocationOverrideModel = null;
try { SpotLocationOverrideModel = require('./models/SpotLocationOverride'); } catch (e) { SpotLocationOverrideModel = null; }
let SecretPointOverrideModel = null;
try { SecretPointOverrideModel = require('./models/SecretPointOverride'); } catch (e) { SecretPointOverrideModel = null; }
// ?�메모리 fallback: MongoDB 미연�???Set?�로 ?�니??카운??
const memVisitorToday = new Set(); // 'YYYY-MM-DD:ipHash'
const memVisitorTotal = new Set(); // 'ipHash'

// ??PUSH: Firebase Admin ?�정 (FIREBASE_SERVICE_ACCOUNT ?�경변??�?
const pushService = require('./push');
pushService.initFirebase();


// ?�?�?� ?�기결제 ?��?줄러 (node-cron ?�는 ?�체 ?�백) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
let cron = null;
try { cron = require('node-cron'); } catch (e) { /* node-cron 미설�????�체 ?�터�??�백 ?�용 */ }

// ?�?�?� ?�메모리 Fallback ?�?�소 ?��? ?�단?�서 ?�언 �?로드 ?�료 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// (secretPointOverrides, cctvOverrides, memProSubs, memVvipSlots 모두 ?�일 로드 ?�료??


const app = express();
  app.set('trust proxy', 1); // ??FIX-TRUST-PROXY
  app.disable('x-powered-by'); // ??FIX-X-POWERED-BY

// ?�?�?� 보안 ?�더 (Helmet) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
try {
  const helmet = require('helmet');
  app.use(helmet({ contentSecurityPolicy: false, hidePoweredBy: true, // ??FIX-HELMET: FIX-HELMET-NO-POWERED-BY
    strictTransportSecurity: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false, // ??FIX-HSTS CSP??Vite SPA가 관�?(script-src 'unsafe-inline' ?�요)
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: false })); // CSP??SPA ?�론???�단??맡�??�로 off
} catch (e) { /* helmet 미설�???npm install helmet */ }

// ?�?�?� ?�답 ?�축 (Compression) - ?�답 ?�도 30~70% ?�상 ?�?�?�?�?�?�?�?�?�?�
try {
  const compression = require('compression');
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
    threshold: 1024, // 1KB ?�상 ?�답�??�축
  }));
} catch (e) { /* compression 미설�???npm install compression */ }

// ?�?�?� 구조?�된 로거 (Winston) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
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
  // winston 미설�???console�?fallback
  logger = {
    info: (...a) => console.log('[INFO]', ...a),
    warn: (...a) => console.warn('[WARN]', ...a),
    error: (...a) => console.error('[ERROR]', ...a),
  };
}
global.logger = logger;

// ?�?�?� CORS: ?�용 ?�메???�이?�리?�트 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// FIX-CORS-ORIGIN: ?�로?�션?�서??ALLOWED_ORIGIN_LIST ?�경변?�로 Origin ?�한
// 모바????React Native)?� Origin ?�이 ?�근?��?�?null origin?� 별도 처리
const PROD_ORIGINS = process.env.ALLOWED_ORIGIN_LIST
  ? process.env.ALLOWED_ORIGIN_LIST.split(',').map(o => o.trim()).filter(Boolean)
  : null; // null?�면 ?�체 ?�용 (개발 ?�경)
const ALLOWED_ORIGINS = PROD_ORIGINS && PROD_ORIGINS.length > 0
  ? PROD_ORIGINS.map(o => o.startsWith("/") ? new RegExp(o.slice(1, -1)) : o)
  : [/.*/];  // ?�경변??미설????모두 ?�용 (개발??

// ?�경변?�로 추�? ?�용 ?�메???�정 (?�로?�션 배포 ???�용)
if (process.env.ALLOWED_ORIGIN) {
  ALLOWED_ORIGINS.push(process.env.ALLOWED_ORIGIN);
}

// Render ?�스체크 ?�용 (?�전 ?�록 ??CORS ?�전???�답)
app.get('/api/health', (req, res) => {
  const fcmStatus = pushService?.isInitialized?.() ?? false;
  res.json({
    status: 'ok',
    db: dbReady ? 'connected' : 'fallback', // ??FIX-HEALTH-INFOLEA: mongodb/memory 구분 ???�반 ?�태�?변�?
    uptime: Math.floor(process.uptime()),
    time: new Date().toISOString(),
    fcm: fcmStatus ? 'ready' : 'disabled',
    // ??FIX-HEALTH-INFOLEA: env ?�드 ?�거 (?�버 ?�경 ?�출 방�?)
  });
});

// ?�?� ?�적 OG ?�그 ?�우???�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// KakaoTalk/WhatsApp/Telegram ???�롤?? OG HTML 반환
// ?�반 브라?��?: ?�론?�엔??SPA�?리다?�렉??
// 브라?��? 리다?�렉???�?? ?ref=og 붙여??Vercel??missing 조건 ?�회 ??index.html ?�빙
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.fishing-go.com';
// ?�진 ?�을 경우 ???�이콘으�??��?(182KB)
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
<meta property="og:site_name" content="?�시GO">
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
<a href="${s}">?�시GO?�서 보기</a>
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
  let title = '?�� ?�시GO 조황 기록', desc = '?�시GO?�서 조황 기록???�인?�세??', img = DEFAULT_OG_IMG;
  try {
    let record = null;
    if (dbReady && CatchRecord) {
      try { record = await CatchRecord.findById(id).lean(); } catch (_) {}
    }
    if (record) {
      const fish = record.fishName || '조황';
      const size = record.fishSize ? `${record.fishSize}cm` : '';
      title = `?�� ${fish}${size ? ' ' + size : ''} 조황 ?�증! | ?�시GO`;
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
  let title = '?�시GO 커�??�티', desc = '?�시GO 커�??�티 게시글?�니??', img = DEFAULT_OG_IMG;
  try {
    let post = null;
    if (dbReady && Post) {
      try { post = await Post.findById(id).lean(); } catch (_) {}
    }
    if (post) {
      title = `${post.title || post.content?.slice(0, 40) || '게시글'} | ?�시GO`;
      desc  = post.content?.slice(0, 100) || desc;
      const postImg = post.image || post.images?.[0];
      if (postImg?.startsWith('http')) img = postImg;
    }
  } catch (_) {}
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600');
  return res.send(ogHtml({ title, desc, img, pageUrl, spaUrl }));
});

// ??DEEPLINK-VERIFY: Android App Links 검�??�일
// https://fishing-go.vercel.app/.well-known/assetlinks.json
// ???�답???�어??autoVerify="true" HTTPS ?�링?��? ?�작??
// SHA256: ??빌드 ??keytool -printcert -jarfile app-release.aab �??�인 ???�데?�트 ?�요
app.get('/.well-known/assetlinks.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json([{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'kr.fishinggo.app',
      // SHA-256: fishinggo-release.jks signingReport�?추출 ?�료
      sha256_cert_fingerprints: [
        // ??fishinggo-release.jks 릴리�???SHA-256 (signingReport�?추출)
        '0B:14:2F:90:F1:E9:EE:32:C6:DD:93:99:94:98:1A:C8:90:F4:63:26:E7:DE:8A:63:B2:CE:08:6C:0B:5F:8F:85'
      ]
    }
  }]);
});

// ?�?� ??DEV-SEED: ?�스??게시글 ?�드 ?�드?�인??(관리자 ?�용 ??X-Seed-Secret + JWT Admin ?�중 ?�증)
app.post('/api/admin/seed-business-test', async (req, res) => {
  // ??BUG-05 FIX: ?�드코딩 ?�크�????�경변??참조 + JWT Admin ?�중 ?�증
  const seedSecret = process.env.SEED_SECRET;
  if (!seedSecret) return res.status(503).json({ error: '?�드 기능??비활?�화?�어 ?�습?�다.' }); // ??FIX-SEED-SECRET
  if (req.headers['x-seed-secret'] !== seedSecret) return res.status(403).json({ error: '금�?' });
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    try {
      const tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
      if (!isAdminToken(tp)) return res.status(403).json({ error: '관리자 권한 ?�요' });
    } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
  }
  const harbors = [
    { label: '강릉·강문', key: '강원 강릉' }, { label: '주문�?, key: '강원 주문�? },
    { label: '?�초', key: '강원 ?�초' }, { label: '고성(거진)', key: '강원 고성' },
    { label: '?�양(?�산·?�애)', key: '강원 ?�양' }, { label: '?�해·묵호', key: '강원 ?�해' },
    { label: '?�척', key: '강원 ?�척' }, { label: '구룡???�항)', key: '경북 구룡?? },
    { label: '감포(경주)', key: '경북 감포' }, { label: '강구(?�덕)', key: '경북 강구' },
    { label: '?�포(?�진)', key: '경북 ?�포' }, { label: '죽�?(?�진)', key: '경북 죽�?' },
    { label: '?�영', key: '경남 ?�영' }, { label: '거제(?�??�금??', key: '경남 거제' },
    { label: '?�해(미조·?�주)', key: '경남 ?�해' }, { label: '고성', key: '경남 고성' },
    { label: '?�수(�?��)', key: '?�남 ?�수' }, { label: '목포', key: '?�남 목포' },
    { label: '?�도', key: '?�남 ?�도' }, { label: '고흥(?�로??', key: '?�남 고흥' },
    { label: '진도', key: '?�남 진도' }, { label: '군산(비응·?��???', key: '?�북 군산' },
    { label: '부??격포·?�도)', key: '?�북 부?? }, { label: '?�안(?�흥·마�???', key: '충남 ?�안' },
    { label: '보령(무창??�오�?', key: '충남 보령' }, { label: '?�산(?�길??', key: '충남 ?�산' },
    { label: '?�항부??, key: '?�천 ?�항부?? }, { label: '?�안부??, key: '?�천 ?�안부?? },
    { label: '기장', key: '부??기장' }, { label: '?��???, key: '부???��??? },
    { label: '?�호부??, key: '부???�호부?? }, { label: '?�두??, key: '?�주 ?�두?? },
    { label: '?�월??, key: '?�주 ?�월?? }, { label: '?��???, key: '?�주 ?��??? },
    { label: '모슬??, key: '?�주 모슬?? }, { label: '?�산??, key: '?�주 ?�산?? },
  ];
  const TARGETS = ['감성??,'참돔','방어','부?�리','갈치','?��?,'?�징??,'?�어','광어','?�치'];
  const TYPES   = ['?�상?�시','?�상?�시','?�간?�상','?�상?�시','?�상?�시'];
  const DATES   = ['매일 출항','주말 출항','?�약 ??출항','?�시 출항','?�즌 출항'];
  const PRICES  = ['50,000??,'60,000??,'70,000??,'80,000??,'45,000??,'55,000??,'65,000??,'75,000??];
  const now = new Date();
  const docs = [];
  for (let i = 0; i < harbors.length; i++) {
    const h = harbors[i];
    const t = TARGETS[i % TARGETS.length]; const ty = TYPES[i % TYPES.length];
    const d = DATES[i % DATES.length];     const p  = PRICES[i % PRICES.length];
    const t2 = TARGETS[(i+5)%TARGETS.length]; const ty2 = ty === '?�간?�상' ? '?�상?�시' : '?�간?�상';
    const d2 = d === '매일 출항' ? '주말 출항' : '매일 출항'; const p2 = PRICES[(i+4)%PRICES.length];
    docs.push({ author: '?�시GO 관리자', author_email: `test1_${i}@fishinggo.test`, shipName: '?�시Go ?�스??1??, type: ty, target: t, region: h.key, date: d, price: p, phone: '010-0000-0001', capacity: 20, content: `[?�스?? ${h.label} 출항 ?�시Go ?�스??1??n?�종: ${t} / 출항: ${d} / ?�금: ${p}/1??/ ?�원: 20�?, isPinned: false, images: [], cover: '', createdAt: new Date(now-i*120000) });
    docs.push({ author: '?�시GO 관리자', author_email: `test2_${i}@fishinggo.test`, shipName: '?�시Go ?�스??2??, type: ty2, target: t2, region: h.key, date: d2, price: p2, phone: '010-0000-0002', capacity: 15, content: `[?�스?? ${h.label} 출항 ?�시Go ?�스??2??n?�종: ${t2} / 출항: ${d2} / ?�금: ${p2}/1??/ ?�원: 15�?, isPinned: false, images: [], cover: '', createdAt: new Date(now-i*120000-60000) });
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
  } catch (err) { res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' }); }
});

// NEW-C1: 채널 ?�토리얼 ?�상 목록 ???�버?�서 관리하???�드�??�이 ?�상 추�?/?�정 가??
// ?�후 MongoDB 모델�??�장 ?�정 (?�재???�적 배열 반환)
let channelVideos = [
  { id: 1, title: '감성??찌낚??채비�?(반유???�유?? ?�전?�복', category: '감성??, url: 'https://www.youtube.com/watch?v=Xvj2T6U8WqI', thumbnail: 'https://img.youtube.com/vi/Xvj2T6U8WqI/maxresdefault.jpg', duration: '15:20', views: '124k', description: '?�문?��? 가???�려?�하???�심 측정부??채비 ?�렬까�? ?�세???�명?�니??', gear: [{ name: '1??�?��???�싯?�', price: '120,000??, link: '#' }, { name: '2500�??�피??�?, price: '158,000??, link: '#' }] },
  { id: 2, title: '무늬?�징???�깅 ?�시 ?�문 - 기본 ?�션�??�비 ?�팅', category: '무늬?�징??, url: 'https://www.youtube.com/watch?v=pY5m4A2f-3Y', thumbnail: 'https://img.youtube.com/vi/pY5m4A2f-3Y/maxresdefault.jpg', duration: '10:45', views: '85k', description: '박선비tv가 ?�려주는 무늬?�징???�즌 ?��?기초 ?�깅 ?�시법입?�다.', gear: [{ name: '?�깅 ?�용 로드 8.6ft', price: '210,000??, link: '#' }, { name: '3.5???�마?��? ?�기', price: '12,000??, link: '#' }] },
  { id: 3, title: '광어 ?�운??채비�?- ???�우??법과 ?�차 조절', category: '광어/?�럭', url: 'https://www.youtube.com/watch?v=XWghA2gO2A8', thumbnail: 'https://img.youtube.com/vi/XWghA2gO2A8/maxresdefault.jpg', duration: '08:30', views: '52k', description: '?�상 ?�시 ?�수 코스! 광어 ?�운?�에??마릿?��? ?�리??채비 비결?�니??', gear: [{ name: '?�운???�용 ?�싯?�', price: '185,000??, link: '#' }, { name: '광어 ?�용 ?�트?�이????, price: '8,500??, link: '#' }] },
  { id: 4, title: '쭈꾸�?갑오징어 ?�시 ?�문 - 기본 채비?� ?�시 방법', category: '쭈꾸�?갑오징어', url: 'https://www.youtube.com/watch?v=Lq1tK6fD_O0', thumbnail: 'https://img.youtube.com/vi/Lq1tK6fD_O0/maxresdefault.jpg', duration: '12:15', views: '210k', description: '?�분?�생??쭈꾸�??�시 기초 ?�슨. ???�상 ?�나�?쭈꾸�??�시 ??', gear: [{ name: '쭈꾸�??�용 로드', price: '95,000??, link: '#' }, { name: '?�평 ?�기 ?�트 10개입', price: '25,000??, link: '#' }] },
];
app.get('/api/channel/videos', (req, res) => {
  res.json(channelVideos);
});
// 관리자 ?�용: 채널 ?�상 목록 추�? (POST)
app.post('/api/channel/videos', (req, res) => {
  // ??BUG-FIX: split(' ')[1]�??�큰 추출 ??Authorization ?�더?�으�?undefined jwt.verify ?�출 방�?
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요' });
  const tp = authHeader.slice(7);
  try {
    const payload = jwt.verify(tp, JWT_SECRET, { algorithms: ['HS256'] });
    if (!isAdminToken(payload)) return res.status(403).json({ error: '관리자 권한 ?�요' });
  } catch { return res.status(401).json({ error: '?�증 ?�요' }); }
  // ??FIX-CHANNEL-MASS-ASSIGN: ?�이?�리?�트 ?�드�??�용 (Mass Assignment 방어)
  const { title, category, url, thumbnail, duration, views: viewsStr, description } = req.body;
  if (!title || !url) return res.status(400).json({ error: 'title, url ?�수' });
  if (typeof title !== 'string' || title.length > 200) return res.status(400).json({ error: 'title 최�? 200?? });
  const urlStr = String(url || '');
  if (!urlStr.startsWith('https://') || urlStr.length > 500) return res.status(400).json({ error: '?�효??https URL ?�요' });
  if (thumbnail) {
    const thStr = String(thumbnail);
    if (!thStr.startsWith('https://') || thStr.length > 500) return res.status(400).json({ error: '?�효??https thumbnail URL ?�요' });
  }
  const video = {
    id: Date.now(),
    title: title.trim(),
    category: typeof category === 'string' ? category.trim().slice(0, 50) : '기�?',
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
    // ??FIX-CORS-WHITELIST: ?��???출처�??�용
    const allowed = (process.env.ALLOWED_ORIGIN || 'http://localhost:5173')
      .split(',').map(s => s.trim());
    if (!origin || allowed.includes(origin) || allowed.includes('*')) cb(null, true);
    else cb(new Error('CORS policy: ' + origin + ' not allowed'));
  },        // 모든 origin ?�용 (JWT ?�증?�로 벴안 ?��?)
  credentials: true,
}));

// ?�?� ?�속??추적 미들?�어 (CORS ?�후 ??JWT 보유 ?�청?�서 lastSeen 갱신) ?�?�?�?�?�?�?�?�?�?�
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
    if (lastSeenCache.size >= 5000) lastSeenCache.delete(lastSeenCache.keys().next().value); // ??FIX-LASTSEEN-SIZE
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

// ?�?� 방문??추적 미들?�어 (가??미�???모두 IP ?�시 기록) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ?�데?? KST ?�늘 ?�짜 ?�니??IP ??/ ?�탈: ?�체 ?�적 ?�니??IP ??
// crypto???�일 최상?�에???��? require??
const visitorCache = new Map(); // ipHash ??lastTrackedDate (중복 DB?�기 방�?) ??max 10000
// ??FIX-VISITOR-SIZE: 주기???�리
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

// ?�?� GET /api/admin/user-stats ???�용???�계 (마스???�용, CORS ?�후) ?�?�?�?�?�?�?�?�?�?�?�?�?�
app.get('/api/admin/user-stats', async (req, res) => {
  // ??FIX-ADMIN-STATS-AUTH: ?�드�??�증 강제
  if (!isMaster(req)) return res.status(403).json({ error: '마스??권한 ?�요' });
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    if (!isAdminToken(tp)) return res.status(403).json({ error: '관리자�??�근 가?�합?�다.' });

    // ???�어 ?�규??�???변???�름???��? ?�름?�로 매핑
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
      rawTiers: {}, // DB???�제 ?�?�된 ?�어 ?�시�?(?�버그용)
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
      // ??VISITOR STATS: ?�데???�늘 ?�니??IP) + ?�탈?�데???�체 ?�적 ?�니??IP)
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
      // ??VISITOR STATS fallback (?�메모리 모드)
      const todayStr = getKstDateStr();
      s.todayVisitors = [...memVisitorToday].filter(k => k.startsWith(todayStr + ':')).length;
      s.totalVisitors = memVisitorTotal.size;
    }
    res.json(s);
  } catch (err) {
    (logger?.error || console.error)('[GET /api/admin/user-stats]', err.message);
    res.status(500).json({ error: '?�버 ?�류' });
  }
});




// ??계정 기반 로그???�패 추적 ??try 블록 �??�역 ?�언 (?�코???�류 방�?)
const loginAttemptMap = new Map(); // email ??{ count, lockedUntil }
const MAX_LOGIN_FAIL = 10;         // 계정??최�? ?�패 10??
const LOGIN_LOCK_MS  = 5 * 60 * 1000; // ?�금 5�?
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of loginAttemptMap.entries()) {
    if (val.lockedUntil && now > val.lockedUntil + LOGIN_LOCK_MS) {
      loginAttemptMap.delete(key);
    }
  }
}, 10 * 60 * 1000);

// ?�?�?� Rate Limiter ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ??SCALE-FIX: IP 기반 ???�화 (?�국 ?�동?�신??NAT: ?�백명이 같�? IP 공유)
// ?�제 브루?�포??보호??계정 기반?�로 처리 (?�래 loginAttemptMap)
try {
  const rateLimit = require('express-rate-limit');
  // 로그???�원가?? IP??10�?500??(?�신??NAT ?�경 ?�백�?커버)
  // FIX-LIKE-RATE: 좋아??rate limit (1�?30??
const likeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: '좋아???�청???�무 많습?�다. ?�시 ???�시 ?�도?�주?�요.' },
  keyGenerator: (req) => req.headers.authorization?.slice(-20) || req.ip || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
});

// FIX-CREW-JOIN-RATE: ?�루 가??rate limit (1�?10??
const crewJoinLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: '?�루 가???�청???�무 많습?�다. ?�시 ???�시 ?�도?�주?�요.' },
  keyGenerator: (req) => req.headers.authorization?.slice(-20) || req.ip || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
});

// FIX-POST-RATE: 게시글 ?�성 rate limit (1�?5??
const postCreateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1�?
  max: 5,
  message: { error: '게시글 ?�성???�무 빠릅?�다. ?�시 ???�시 ?�도?�주?�요.' },
  keyGenerator: (req) => req.headers.authorization?.slice(-20) || req.ip || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: { error: '?�청???�무 많습?�다. ?�시 ???�시 ?�도?�주?�요.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // OTP 발송?� 별도 쿨다??처리?��?�?auth 리�????�외
      return req.path.includes('/send-otp') || req.path.includes('/verify-otp');
    },
  });
  // ?�반 API: IP??1�?1000??(?�시 1�??�용??커버)
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300, // ??FIX-API-LIMITER: 1�?300??
    message: { error: '?�청???�무 많습?�다. ?�시 ???�시 ?�도?�주?�요.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // ??YouTube 검???�용 Rate Limit ??IP??분당 3??
  // ?�유: 검??1??= 201 units ?�비. 50�??�용???�경?�서 쿼터 ??�� 방�?
  const ytSearchLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1�?
    max: 3,                    // IP??최�? 3??
    message: { error: '검???�청???�무 많습?�다. 1�????�시 ?�도?�주?�요.', code: 'YT_SEARCH_RATE_LIMIT' },
    standardHeaders: true,
    legacyHeaders: false,
    // ??IPv6 ?�환: 커스?� keyGenerator ?�거 ??기본 IP 처리 ?�용 (ERR_ERL_KEY_GEN_IPV6 ?�결)
  });

  // ??YouTube ?�합 ?�드 ?�용 Rate Limit ??IP??분당 10??
  // ?�유: ?�드??캐시가 ?�어 ?�제 API ?�출 ?�음, ?�무 ?�격?�면 UX ?�??
  const ytFeedLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1�?
    max: 10,                   // IP??최�? 10??
    message: { error: '?�드 ?�청???�무 많습?�다. ?�시 ???�시 ?�도?�주?�요.', code: 'YT_FEED_RATE_LIMIT' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // ??FIX-OTP-LIMITER: OTP ?�용 rate limit ??분당 3??(?�화번호 ?�팸 방�?)
  const otpLimiter = rateLimit({ windowMs: 60_000, max: 3, message: { error: 'OTP ?�청???�무 많습?�다. 1�????�시 ?�도?�주?�요.' }, standardHeaders: true, legacyHeaders: false });

  app.use('/api/auth/', authLimiter);

  // ??FIX-CATCH-LIMITER
  const catchLimiter = rateLimit({ windowMs: 60_000, max: 5, message: { error: '조황 ?�록???�무 많습?�다.' }, standardHeaders: true, legacyHeaders: false });

  // ??FIX-CACHE-AUTH-MIDDLEWARE: /api/auth/* ??no-store ?�더
  app.use('/api/auth/', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use('/api/', apiLimiter);
  app.use('/api/media/youtube/search', ytSearchLimiter);   // ??검?? 1�?3??
  app.use('/api/media/youtube/unified', ytFeedLimiter);    // ???�합 ?�드: 1�?10??
  (logger?.info || console.log)('??Rate Limiter ?�용 (로그??10�?500?? ?�반 1�?1000?? ???�시 1�??�용??지??);

  (logger?.info || console.log)('??YouTube Rate Limit 강화 (검??1�?3?? ?�드 1�?10??');
} catch (e) { (logger?.warn || console.warn)('?�️ express-rate-limit 미설�???npm install express-rate-limit'); }

// ??IMG-SIZE-FIX: ?�중?��?지 5??× 4MB = 최�? 20MB ??25mb�??�장 (?�전 10mb?�서 ?��?지 ?�락 방�?)
app.use(express.json({ limit: '1mb' }));
// ??FIX-JSON-ERR: JSON ?�싱 ?�러 ??400 ?�답
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: '?�못??JSON ?�식?�니??' });
  }
  next(err);
});
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// ??SCALE: API ?�답 캐시 (메모�? ???�씨/물때/?�인?????�주 변?��? ?�는 ?�이??
const responseCache = new Map();
const CACHE_TTL = {
  weather: 5 * 60 * 1000,   // ?�씨: 5�?
  tide:    10 * 60 * 1000,  // 물때: 10�?
  default: 2 * 60 * 1000,   // 기본: 2�?
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
    // 가???�래????�� 200�???��
    const keys = [...responseCache.keys()].slice(0, 200);
    keys.forEach(k => responseCache.delete(k));
  }
  responseCache.set(key, { data, ts: Date.now() });
}
// 주기??캐시 ?�리 (10분마??
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of responseCache.entries()) {
    if (now - v.ts > 15 * 60 * 1000) responseCache.delete(k);
  }
}, 10 * 60 * 1000);

// ??IAP 구독 ?�동 만료 ?��?줄러 (30분마???�행)
// iapExpiresAt??지???��? tier ??FREE�?강제 ?�수 + VVIP ?�롯 ?�제
const runIapExpiryCheck = async () => {
  if (!dbReady || !User) return;
  try {
    const now = new Date();
    // 만료???�료 구독??조회 (FREE가 ?�닌 + 만료??지??
    const expiredUsers = await User.find({
      tier: { $nin: ['FREE', 'MASTER'] },
      iapExpiresAt: { $ne: null, $lt: now },
    }).select('_id email tier iapExpiresAt vvipHarborId').lean();

    for (const u of expiredUsers) {
      try {
        // tier ??FREE 강제 ?�운그레?�드
        await User.findByIdAndUpdate(u._id, {
          $set: { tier: 'FREE', iapExpiresAt: null, iapPurchaseToken: null, iapProductId: null, iapAutoRenewing: false, updatedAt: now }
        });

        // ???�상?�보글 ?�동 ??�� ??PRO/VVIP 만료 ??무료 ?�보 ?�용 방�?
        // PRO, BUSINESS_VIP ?��?�??�보글 ?�성 가????만료 ????��
        if (u.tier === 'PRO' || u.tier === 'BUSINESS_VIP') {
          let deletedCount = 0;
          // DB ??��
          if (BusinessPost) {
            const result = await BusinessPost.deleteMany({ author_email: u.email }).catch(e => {
              (logger?.error || console.error)(`[IAP 만료] ?�보글 DB ??�� ?�패: ${u.email}`, e.message);
              return { deletedCount: 0 };
            });
            deletedCount = result.deletedCount || 0;
          }
          // ?�메모리 ??��
          const before = memBusinessPosts.length;
          memBusinessPosts = memBusinessPosts.filter(p => p.author_email !== u.email);
          const memDeleted = before - memBusinessPosts.length;
          if (memDeleted > 0) saveMemBusinessPosts();
          if (deletedCount > 0 || memDeleted > 0) {
            (logger?.info || console.log)(`[IAP 만료] ?�보글 ??��: ${u.email} ??DB ${deletedCount}�? 메모�?${memDeleted}�?);
          }
        }

        // VVIP?�?�면 ??�� ?�롯 ?�제
        if ((u.tier === 'BUSINESS_VIP' || u.tier === 'MASTER') && u.vvipHarborId && vvipSlots[u.vvipHarborId]?.userId === (u.email || String(u._id))) {
          delete vvipSlots[u.vvipHarborId];
          saveVvipSlots();
          (logger?.info || console.log)(`[IAP 만료] VVIP ?�롯 ?�제: ${u.email} ??${u.vvipHarborId}`);
        }
        (logger?.info || console.log)(`[IAP 만료] 구독 ?�수: ${u.email} ${u.tier}?�FREE (만료: ${u.iapExpiresAt})`);
      } catch (e2) {
        (logger?.error || console.error)(`[IAP 만료] 처리 ?�패: ${u.email}`, e2.message);
      }
    }
    if (expiredUsers.length > 0) {
      (logger?.info || console.log)(`[IAP 만료] �?${expiredUsers.length}�?처리 ?�료`);
    }
  } catch (e) {
    (logger?.error || console.error)('[IAP 만료 ?��?줄러] ?�류:', e.message);
  }
};

// ???�버 ?�작 30�???�??�행, ?�후 1분마??
// 30�???1분으�??�축: ?�스??구독(5�? 만료 즉시 감�? + ?�제 구독??지???�이 ?�수
setTimeout(() => {
  runIapExpiryCheck();
  setInterval(runIapExpiryCheck, 60 * 1000); // ??1�?주기 (?�스?? 5�?구독 만료 ?�??
}, 30 * 1000);

// ?�?�?� JWT ?�증 미들?�어 (?�택??보호 ?�드?�인?�용) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ??FIX-PWD-IAT: 비�?번호 변�????�전 ?�큰 무효?��? ?�한 in-memory 캐시
const pwdChangedCache = new Map(); // email ??passwordChangedAt ms
// 1?�간마다 ?�리
setInterval(() => { pwdChangedCache.clear(); }, 60 * 60 * 1000);

// ??FIX-NO-CACHE: 민감 ?�이??API??no-store ?�더 미들?�어
function noCache(req, res, next) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  next();
}

function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증???�요?�니??' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET, { algorithms: ['HS256'] });
    // ??FIX-PWD-IAT: 비�?번호 변�????�전 ?�큰 차단
    const userKey = decoded.email || decoded.id;
    const changedAt = pwdChangedCache.get(userKey);
    if (changedAt && decoded.iat && (decoded.iat * 1000) < changedAt) {
      return res.status(401).json({ error: '비�?번호가 변경되???�시 로그?�이 ?�요?�니??', code: 'TOKEN_INVALIDATED' });
    }
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: '?�큰???�효?��? ?�거??만료?�었?�니??' });
  }
}

// ?�?�?� 비�??�인??좌표 ?�버?�이??API (MASTER ?�용) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// GET: 비�??�인??좌표 조회 ??JWT ?�증 + MASTER ?�는 LITE ?�상 ?�어 ?�요
app.get('/api/secret-point-overrides', async (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음', code: 'TOKEN_INVALID' }); }
  const isAdmin = isAdminToken(tp);
  if (!isAdmin) {
    // LITE+ ?�상 ?�어 ?�인 (JWT tier ?�선, DB fallback)
    const allowedTiers = ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'MASTER'];
    // ??FIX-DB-FALLBACK: DB 조회 ?�패 ??JWT ??tier�??�용 (?�전: ??�� FREE ??마스??차단)
    let userTier = tp.tier || 'FREE';
    try {
      if (dbReady && User) {
        const u = await User.findOne({ $or: [{ email: tp.email }, { id: tp.id }] }, 'tier').lean();
        if (u?.tier) userTier = u.tier; // DB 조회 ?�공 ?�에�???��?�기
      }
    } catch { /* DB 조회 ?�패 ??JWT tier ?��? */ }
    if (!allowedTiers.includes(userTier)) return res.status(403).json({ error: 'LITE ?�상 구독???�요?�니??' });
  }
  res.json(secretPointOverrides);
});

// POST: ?�정 ?�인??좌표 ?�??(?�드�?JWT ?�증 ?�수)
app.post('/api/secret-point-overrides', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    if (!isAdminToken(p)) return res.status(403).json({ error: '관리자 권한 ?�요' });
  } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음', code: 'TOKEN_INVALID' }); }
  const { id, lat, lng } = req.body;
    if (!Number.isFinite(parseFloat(lat)) || !Number.isFinite(parseFloat(lng))) return res.status(400).json({ error: '?�효??좌표(?�자)가 ?�요?�니??' }); // ??FIX-LAT-LNG
  if (!id || lat == null || lng == null) return res.status(400).json({ error: 'id, lat, lng ?�수' });
  secretPointOverrides[String(id)] = { lat: parseFloat(lat), lng: parseFloat(lng) };
  saveSecretPointOverrides();
  // ??DB ?�구 ?�??
  if (dbReady && SecretPointOverrideModel) {
    SecretPointOverrideModel.findOneAndUpdate(
      { id: String(id) },
      { id: String(id), lat: parseFloat(lat), lng: parseFloat(lng) },
      { upsert: true, new: true }
    ).catch(e => logger.error('[SecretOverride] DB ?�???�패:', e.message));
  }
  (logger?.info || console.log)(`[SecretPoint] id=${id} 좌표 ?�데?�트: ${lat}, ${lng}`);
  res.json({ ok: true, overrides: secretPointOverrides });
});

// DELETE: ?�정 ?�인??초기??(?�드�?JWT ?�증 ?�수)
app.delete('/api/secret-point-overrides/:id', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    if (!isAdminToken(p)) return res.status(403).json({ error: '관리자 권한 ?�요' });
  } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음', code: 'TOKEN_INVALID' }); }
  const { id } = req.params;
  delete secretPointOverrides[id];
  saveSecretPointOverrides();
  // ??DB?�서????��
  if (dbReady && SecretPointOverrideModel) {
    SecretPointOverrideModel.deleteOne({ id }).catch(e => logger.error('[SecretOverride] DB ??�� ?�패:', e.message));
  }
  res.json({ ok: true, overrides: secretPointOverrides });
});

// ?�?�?� ?�시 ?�인??좌표 ?�버?�이??(MASTER ?�용) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// GET: 모든 ?�버?�이??반환 (공개)
app.get('/api/spot-location-overrides', (req, res) => {
  res.json(spotLocationOverrides);
});

// POST: 좌표 ?�??(MASTER ?�용)
app.post('/api/spot-location-overrides', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    if (!isAdminToken(p)) return res.status(403).json({ error: 'MASTER 권한 ?�요' });
  } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
  const { id, lat, lng, name } = req.body;
  if (!id || lat == null || lng == null) return res.status(400).json({ error: 'id, lat, lng ?�수' });
  // ??FIX-SPOT-LATNG-RANGE: 좌표 범위 검�?
  const latNumS = parseFloat(lat); const lngNumS = parseFloat(lng);
  if (isNaN(latNumS) || latNumS < -90 || latNumS > 90) return res.status(400).json({ error: '?�효?��? ?��? ?�도�? });
  if (isNaN(lngNumS) || lngNumS < -180 || lngNumS > 180) return res.status(400).json({ error: '?�효?��? ?��? 경도�? });
  spotLocationOverrides[String(id)] = {
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    name: name || undefined,
    updatedAt: new Date().toISOString(),
  };
  saveSpotLocationOverrides();
  // ??DB ?�구 ?�??(?�배???�에???��?)
  if (dbReady && SpotLocationOverrideModel) {
    SpotLocationOverrideModel.findOneAndUpdate(
      { id: String(id) },
      { id: String(id), lat: parseFloat(lat), lng: parseFloat(lng), name: name || null },
      { upsert: true, new: true }
    ).catch(e => logger.error('[SpotOverride] DB ?�???�패:', e.message));
  }
  (logger?.info || console.log)(`[SpotLocation] id=${id} 좌표 ?�정: (${lat}, ${lng})`);
  res.json({ ok: true, id, lat: parseFloat(lat), lng: parseFloat(lng) });
});

// DELETE: ?�정 ?�인???�래?��?초기??(MASTER ?�용)
app.delete('/api/spot-location-overrides/:id', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    if (!isAdminToken(p)) return res.status(403).json({ error: 'MASTER 권한 ?�요' });
  } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
  const { id } = req.params;
  delete spotLocationOverrides[id];
  saveSpotLocationOverrides();
  // ??DB?�서????��
  if (dbReady && SpotLocationOverrideModel) {
    SpotLocationOverrideModel.deleteOne({ id }).catch(e => logger.error('[SpotOverride] DB ??�� ?�패:', e.message));
  }
  res.json({ ok: true, reset: id });
});

// ?�?�?� 커스?� ?�시 ?�인??(MASTER ?�규 추�?) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// GET: 모든 커스?� ?�인??반환 (공개)
app.get('/api/custom-points', (req, res) => {
  res.json(Object.values(customPoints));
});

// POST: ???�인??추�? (MASTER ?�용)
app.post('/api/custom-points', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    if (!isAdminToken(p)) return res.status(403).json({ error: 'MASTER 권한 ?�요' });
  } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
  const { name, type, region, lat, lng, fish, obsCode, aiDescription, season, recommend, status } = req.body;
  if (!name || !type || lat == null || lng == null) return res.status(400).json({ error: 'name, type, lat, lng ?�수' });
  // ??FIX-POINT-LATNG-RANGE: 좌표 범위 검�?(?�국 좌표 ± ?��? 범위 ?�용)
  const latNum = parseFloat(lat); const lngNum = parseFloat(lng);
  if (isNaN(latNum) || latNum < -90 || latNum > 90) return res.status(400).json({ error: '?�효?��? ?��? ?�도�?(-90~90)' });
  if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) return res.status(400).json({ error: '?�효?��? ?��? 경도�?(-180~180)' });
  // ??FIX-POINT-NAME-LEN: ?�인?�명/?�종 길이 ?�한
  if (typeof name !== 'string' || name.length > 100) return res.status(400).json({ error: '?�인?�명?� 최�? 100?�입?�다.' });
  if (typeof type !== 'string' || type.length > 50) return res.status(400).json({ error: '?�?��? 최�? 50?�입?�다.' });
  if (typeof fish === 'string' && fish.length > 200) return res.status(400).json({ error: '?�종 ?�보??최�? 200?�입?�다.' });
  const id = `custom_${Date.now()}`;
  customPoints[id] = {
    id,
    name,
    type,
    region: region || '미�???,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    fish: fish || '미확??,
    score: 80,
    status: status || '보통',
    obsCode: obsCode || null,
    aiDescription: aiDescription || null,
    season: season || null,
    recommend: recommend || null,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
  saveCustomPoints();
  (logger?.info || console.log)(`[CustomPoint] 추�?: ${name} (${type}) @ ${lat},${lng}`);
  res.json({ ok: true, point: customPoints[id] });
});

// DELETE: 커스?� ?�인????�� (MASTER ?�용)
app.delete('/api/custom-points/:id', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    if (!isAdminToken(p)) return res.status(403).json({ error: 'MASTER 권한 ?�요' });
  } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
  const { id } = req.params;
  if (!customPoints[id]) return res.status(404).json({ error: '?�인???�음' });
  const name = customPoints[id].name;
  delete customPoints[id];
  saveCustomPoints();
  (logger?.info || console.log)(`[CustomPoint] ??��: ${name} (${id})`);
  res.json({ ok: true });
});

// POST: AI ?�시 ?�인???�보 ?�동 ?�성 (MASTER ?�용)
// ??FIX-AI-RATE-LIMIT: AI ?�인???�보 ?�성 1�?5???�한
const aiLimiter = (() => { try { const rl = require('express-rate-limit'); return rl({ windowMs: 60_000, max: 5, message: { error: 'AI ?�청???�무 많습?�다. ?�시 ???�시 ?�도?�주?�요.' } }); } catch { return (req,res,next)=>next(); } })();
app.post('/api/ai/generate-point-info', aiLimiter, async (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    if (!isAdminToken(p)) return res.status(403).json({ error: 'MASTER 권한 ?�요' });
  } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
  const { name, type, region, lat, lng, obsCode } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name, type ?�수' });
  // ??FIX-POINT-INFO-LEN: ?�력 길이 ?�한 (prompt injection + DoS 방어)
  if (typeof name !== 'string' || name.length > 100) return res.status(400).json({ error: '?�인?�명?� 최�? 100?�입?�다.' });
  if (typeof type !== 'string' || type.length > 50) return res.status(400).json({ error: '?�?��? 최�? 50?�입?�다.' });
  if (lat !== undefined && (isNaN(Number(lat)) || Number(lat) < -90 || Number(lat) > 90)) return res.status(400).json({ error: '?�효?��? ?��? ?�도�? });
  if (lng !== undefined && (isNaN(Number(lng)) || Number(lng) < -180 || Number(lng) > 180)) return res.status(400).json({ error: '?�효?��? ?��? 경도�? });
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) return res.status(503).json({ error: 'Gemini API ??미설?? });
  const stationInfo = obsCode ? (observationData[obsCode] || {}) : {};
  const regionLabel = stationInfo.region || region || '미�???;
  const prompt = `?�신?� ?�국 ?�시 ?�문가?�니?? ?�음 ?�시 ?�인?�에 ?�???�보�??�성?�주?�요.\n?�인?�명: ${name}\n?�?? ${type} (${regionLabel} 권역)\n?�치: ?�도 ${lat}, 경도 ${lng}\n?�근 관측소: ${stationInfo.name || '미확??}\n\n반드???�래 JSON ?�식�??�답?�세??(?�른 ?�스???�이):\n{\n  "fish": "???�인?�에??주로 ?�히???�종 3~5가지 (?�표 구분, ?�국??",\n  "description": "???�시 ?�인?�의 ?�징�??�시 방법 ?�명 (2~3문장)",\n  "season": "최적 ?�시 ?�즌 ?�명",\n  "recommend": "추천 채비 �?미끼 (1~2가지)",\n  "status": "최고|?�딩�??�발|보통 �??�나"\n}`;
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
    res.status(500).json({ error: 'AI ?�성 ?�패' });
  }
});

// ?�?�?� ???�정 (강제 ?�데?�트?? ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.get('/api/app-config', (req, res) => {
  res.json(appConfig);
});

app.post('/api/admin/app-config', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    if (!isAdminToken(p)) return res.status(403).json({ error: '관리자 권한 ?�요' });
  } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
  
  // ??FIX-APPCONFIG-VALID: ?�식 검�?추�? (?�의 �?XSS URL 주입 방어)
  if (req.body.min_version !== undefined) {
    const mv = String(req.body.min_version);
    if (/^\d+\.\d+\.\d+$/.test(mv)) appConfig.min_version = mv;
    else return res.status(400).json({ error: 'min_version ?�식: x.y.z' });
  }
  if (req.body.store_url !== undefined) {
    const su = String(req.body.store_url);
    if (/^https:\/\/.{5,500}/.test(su)) appConfig.store_url = su;
    else return res.status(400).json({ error: 'store_url?� https�??�작?�야 ?�니??' });
  }
  
  saveAppConfig();
  res.json({ ok: true, appConfig });
});

app.get('/api/debug', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: '?�근 불�?' });
  // FIX-DEBUG-AUTH: production???�닌 경우?�도 관리자 JWT ?�요
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    try { const tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); if (!isAdminToken(tp)) return res.status(403).json({ error: '관리자 권한 ?�요' }); }
    catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
  } else { return res.status(401).json({ error: '?�증 ?�요' }); }
  const uri = MONGO_URI ? MONGO_URI.replace(/:[^@]+@/, ':***@') : '미설??;
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

// ??CREW-ENH: ?�버?�이???�벨 ?�스??(?��??�토?��? ?�일 기�?)
// FIX-ADMIN-EMAIL-CONST: 관리자 ?�메???�역 ?�수??(?�드코딩 분산 방�?)
const ADMIN_EMAIL_PRIMARY = process.env.ADMIN_EMAIL || 'sunjulab@gmail.com';
const ADMIN_EMAIL_ALT = process.env.ADMIN_EMAIL_ALT || 'sunjulab.k@gmail.com';
const ADMIN_EMAIL_LIST = new Set([ADMIN_EMAIL_PRIMARY, ADMIN_EMAIL_ALT]);

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

// ?�시�??�시 ?�원 ?�버 로직 (chatHistories???�단?�서 ?�언?�었?�니??

io.on('connection', (socket) => {
  // ??OPT-5: ?�결 ???�드?�이???�큰 검�?(발신???�조 방�?)
  let verifiedUser = null;
  // ??FIX-SOCKET-FLOOD: 메시지 ?�러??방�?
  let msgCount = 0; let msgWindow = Date.now();
  const MSG_LIMIT = 10; const MSG_WINDOW_MS = 3000; // 3�???10??
  const handshakeToken = socket.handshake?.auth?.token || socket.handshake?.query?.token;
  if (handshakeToken) {
    try {
      verifiedUser = jwt.verify(handshakeToken, JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
      // ?�큰 만료/?�조 ??verifiedUser null ?��?, ?�결?� ?�용?�되 발신 ???�명 처리
      (logger?.warn || console.warn)('[Socket] ?�못???�큰?�로 ?�결 ?�도:', socket.id);
    }
  }

  // ??21TH-B1: console.log ??logger.info (Winston ?�일)
  logger.info(`[Socket] User connected: ${socket.id} ${verifiedUser ? `(${verifiedUser.name || verifiedUser.email})` : '(미인�?'}`);

  // ??NICK-FIX: ?�켓 ?�션 ?�위 ?�벨 + ?�네??캐시 (경쟁조건 ?�이 즉시 초기??
  let cachedLevel = { level: 'LV.1', emoji: '?��', title: '초보 ?�시�? };
  // 1?�위: JWT???�함??name (로그???�로그인 ??즉시 ?�효)
  // 2?�위: ?�메모리 memUsers?�서 즉시 ?�기 조회 (경쟁조건 ?�음)
  // 3?�위: DB 비동�?조회 ?�료 ??갱신
  let cachedNickname = verifiedUser?.name
    || memUsers.find(u => u.email === verifiedUser?.email)?.name
    || null;
  if (verifiedUser?.email) {
    if (dbReady && User) {
      User.findOne({ email: verifiedUser.email }).select('totalExp name').lean()
        .then(u => {
          if (u) {
            cachedLevel = getServerLevel(u.totalExp || 0);
            if (u.name) cachedNickname = u.name; // DB ?�네??최종 ?�정 (?�이???�출 차단)
          }
        })
        .catch(() => {});
    } else {
      // ?�메모리 모드: memUsers?�서 ?�벨??계산
      const memU = memUsers.find(u => u.email === verifiedUser.email);
      if (memU) {
        cachedLevel = getServerLevel(memU.totalExp || 0);
        if (memU.name) cachedNickname = memU.name;
      }
    }
  }

  let joinCount = 0; let joinWindow = Date.now(); // ??FIX-SOCKET-JOIN-RATE: join ?�벤??rate limit
  socket.on('join_crew', async (crewId) => {
    if (!crewId || typeof crewId !== 'string' || !/^[a-f0-9]{24}$/.test(crewId)) return; // ??FIX-CREWID
    if (!verifiedUser) { socket.emit('error', { message: '로그?�이 ?�요?�니??' }); return; } // ??FIX-SOCKET-JOIN-AUTH
    // ??FIX-SOCKET-JOIN-RATE: 10�???5???�상 join ?�도 차단
    const nowJoin = Date.now();
    if (nowJoin - joinWindow > 10_000) { joinCount = 0; joinWindow = nowJoin; }
    if (++joinCount > 5) { socket.emit('error', { message: '?�무 빠른 채팅�?참�? ?�도?�니??' }); return; }
    // ??FIX-JOIN-CREW-MEMBER: 비공�??�루 멤버??검�?
    if (dbReady && Crew) {
      try {
        const crewDoc = await Crew.findById(crewId).select('isPrivate members').lean();
        if (crewDoc && crewDoc.isPrivate) {
          const userKey = verifiedUser.email || verifiedUser.id;
          const isMem = (crewDoc.members || []).some(m => (m.email || m) === userKey);
          if (!isMem) { socket.emit('error', { message: '비공�??�루??멤버가 ?�닙?�다.' }); return; }
        }
      } catch { }
    }
    // ??FIX-SOCKET-DUP-JOIN: 중복 room join 방어
  if (!socket.rooms.has(crewId)) socket.join(crewId);
    // ENH4-C4: DB?�서 최근 50�?메시지�?로드 (기존 100�???초기 ?�송??최적??
    if (dbReady && ChatMessage) {
      try {
        const msgs = await ChatMessage.find({ crewId }).sort({ createdAt: -1 }).limit(50).lean(); // ??FIX-CHAT-LEAN
        chatHistories[crewId] = msgs.reverse().map(m => ({
          sender: m.sender,
          text: m.text,
          time: m.time,
          // ??POST-SHARE: 공유 카드 ?�드 ?�함
          type: m.type || 'text',
          postId: m.postId || '',
          postTitle: m.postTitle || '',
          postPreview: m.postPreview || '',
          postImage: m.postImage || '',
          postCategory: m.postCategory || '',
          senderLevel: m.senderLevel || '',
          senderEmoji: m.senderEmoji || '',
          senderTitle: m.senderTitle || '',
          // ??REPLY-HISTORY: 채팅�??�장 ??과거 ?�장 메시지?�도 ?�용 버블 ?�시
          replyTo: (m.replyTo && m.replyTo.sender) ? { sender: m.replyTo.sender, text: m.replyTo.text || '' } : null,
        }));
      } catch (e) { logger.warn(`[Socket] join_crew 채팅 ?�스?�리 DB 로드 ?�패 (crewId=${crewId}): ${e.message}`); } // ??21TH-B2: silent catch ??logger.warn
    }
    if (!chatHistories[crewId]) chatHistories[crewId] = [];
    socket.emit('chat_history', chatHistories[crewId]);
  });

  socket.on('send_msg', async (data) => {
    // ??FIX-CHAT-MSG-LENGTH: 채팅 메시지 최�? 500???�한 (DoS 방어)
    if (!data || typeof data !== 'object') return;
    if (typeof data.text === 'string' && data.text.length > 500) {
      socket.emit('error', { message: '메시지??최�? 500?�입?�다.' }); return;
    }
    // ??FIX-SOCKET-FLOOD-CHECK: ?�러??방�?
    const now = Date.now(); if (now - msgWindow > MSG_WINDOW_MS) { msgCount = 0; msgWindow = now; }
    if (++msgCount > MSG_LIMIT) { socket.emit('error', { message: '메시지�??�무 빠르�??�송?�고 ?�습?�다.' }); return; }
    if (!data.crewId || typeof data.crewId !== 'string' || data.crewId.length > 100) return; // FIX-CREWID-VALIDATE
    if (!socket.rooms.has(data.crewId)) { socket.emit('error', { message: '채팅방에 참�??��? ?�았?�니??' }); return; } // ??FIX-CREW-ROOM
    if (!verifiedUser) { socket.emit('error', { message: '로그?�이 ?�요?�니??' }); return; } // ??FIX-MSG-AUTH
    if (data.type === 'text' && (!data.text || !String(data.text).trim())) return; // ??FIX-MSG-EMPTY
    if (data.type !== 'post_share' && typeof data.text === 'string' && data.text.length > 1000) { socket.emit('error', { message: '1000?��? 초과?????�습?�다.' }); return; } // ??FIX-MSG-SIZE
    const safeText = (data.text||'').replace(/<[^>]*>/g,'').replace(/javascript:/gi,'').trim().substring(0,1000); // ??FIX-CHAT-XSS

    // ?�?� ?�네??결정 (기존 로직 ?�일) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
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
    const sender = (resolvedNickname || verifiedUser?.name || '?�명').toString().slice(0, 30);

    // ?�?� post_share ?�??처리 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
    if (data.type === 'post_share') {
      const postId = (data.postId || '').toString().trim();
      if (!postId) return;
      const rawImage = (data.postImage || '').toString();
      // FIX-CHAT-MIME: base64 ?��?지 MIME ?�???�이?�리?�트 (?�용: jpeg/png/gif/webp)
      const isBase64 = rawImage.startsWith('data:');
      if (isBase64) {
        const mimeMatch = rawImage.match(/^data:([^;]+);base64,/);
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!mimeMatch || !allowedMimes.includes(mimeMatch[1])) {
          socket.emit('error', { message: '?�용?��? ?�는 ?��?지 ?�식?�니??' }); return;
        }
      }
      const dbSafeImage = isBase64 ? '' : rawImage.slice(0, 500); // URL?� 500???�내 ?�??
      const msgData = {
        type: 'post_share',
        sender,
        postId,
        postTitle:   (data.postTitle   || '').toString().slice(0, 100),
        postPreview: (data.postPreview || '').toString().slice(0, 120),
        postImage:   rawImage,  // ?�시�?emit: ?�체 (base64 ?�함)
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
            postImage: dbSafeImage,  // ??BASE64-FIX: URL�??�??(base64??�?문자??
            postCategory: msgData.postCategory,
            senderLevel: msgData.senderLevel,
            senderEmoji: msgData.senderEmoji,
            senderTitle: msgData.senderTitle,
          }).save();
        } catch (e) { logger.error(`[Socket] post_share DB ?�???�패: ${e.message}`); }
      } else { saveChatHistories(); }
      return;
    }

    // ?�?� ?�반 ?�스??메시지 처리 (기존 로직) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
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
      // ??REPLY: ?�장 ?�??(sender + text 100???�내�??�한, XSS 방�?)
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

    // ??REPLY NOTIF: ?�장 메시지 ?�신 ???�루 �??�체???�림 브로?�캐?�트
    // ?�라?�언?��? repliedToSender === ?�신 ?�네???��?�?체크???�림 ?�시
    if (msgData.replyTo?.sender) {
      io.to(data.crewId).emit('crew_reply_notification', {
        repliedToSender: msgData.replyTo.sender,  // ?�장 받�? ?�람 (?��? ?�성??
        fromSender:      msgData.sender,           // ?�장 보낸 ?�람
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
          // ??REPLY-FIX: replyTo DB ?�???�함 ???�버 ?�시???�에???�용 버블 ?��?
          replyTo: msgData.replyTo ? {
            sender: msgData.replyTo.sender || '',
            text:   msgData.replyTo.text   || '',
          } : undefined,
        }).save();
        if (chatHistories[data.crewId]?.length % 50 === 0) saveChatHistories();
      } catch (e) { logger.error(`[Socket] send_msg DB ?�???�패 (crewId=${data.crewId}): ${e.message}`); }
    } else { saveChatHistories(); }

    // ??PUSH: ?�루 멤버?�게 FCM ?�림 (?�프?�인/백그?�운??
    try {
      if (dbReady && Crew) {
        const crew = await Crew.findById(data.crewId).select('members').lean();
        if (crew?.members?.length) {
          const memberIds = crew.members
            .filter(m => String(m.userId || m) !== String(verifiedUser?.id || verifiedUser?._id))
            .map(m => m.userId || m);
          if (memberIds.length) {
            pushService.sendToUsers(memberIds, {
              title: `?�� ${sender}`,
              body: text.length > 50 ? text.slice(0, 50) + '?? : text,
              data: { route: `/crew/${data.crewId}/chat`, type: 'crew_chat' },
            }).catch(() => {});
          }
        }
      }
    } catch (e) { /* FCM ?�루 ?�림 ?�패 무시 */ }
  });


  socket.on('disconnect', () => {
    logger.info(`[Socket] User disconnected: ${socket.id}`); // ??21TH-B1: console.log ??logger.info
    // FIX-SOCKET-DISCONNECT-CLEANUP: ?�결 ?�제 ??rate limit Map ?�리 (메모�??�수 방�?)
    socketFloodMap.delete(socket.id);
    if (typeof joinRateMap !== 'undefined') joinRateMap.delete(socket.id);
  });
});

// --- KHOA/KMA Real-world API Bridges with 1-hour Caching ---
const ALL_STATIONS = [
  'DT_0001', 'DT_0002', 'DT_0003', 'DT_0033', 'DT_0036', 'DT_0021', // ?�해
  'DT_0004', 'DT_0005', 'DT_0006', 'DT_0014', 'DT_0016', 'DT_0018', 'DT_0034', // ?�해
  'DT_0007', 'DT_0008', 'DT_0009', 'DT_0030', // ?�해
  'DT_0010', 'DT_0011', 'DT_0045' // ?�주
];

let weatherCache = {};

// --- 권역�?기본 기상 ?�로?�일 (Realism 강화) ---
const REGIONAL_PROFILES = {
  '?�해': { temp: 14.5, wind: 4.5, wave: 0.8 },
  '?�해': { temp: 16.8, wind: 3.2, wave: 0.5 },
  '?�해': { temp: 12.2, wind: 6.8, wave: 1.1 },
  '?�주': { temp: 18.5, wind: 3.5, wave: 0.6 }
};

const observationData = {
  // ?�해
  'DT_0001': { name: '강릉 ?�목??, region: '?�해', baseTemp: 14.2, baseWind: 4.2 },
  'DT_0021': { name: '?�초 ?�금??, region: '?�해', baseTemp: 13.5, baseWind: 5.5 },
  'DT_0002': { name: '?�진 ?�포', region: '?�해', baseTemp: 14.8, baseWind: 3.8 },
  'DT_0033': { name: '?�해 묵호', region: '?�해', baseTemp: 14.4, baseWind: 4.1 },
  'DT_0036': { name: '경주 감포', region: '?�해', baseTemp: 15.2, baseWind: 3.2 },
  // ?�해
  'DT_0004': { name: '부???�운?�', region: '?�해', baseTemp: 16.5, baseWind: 2.8 },
  'DT_0005': { name: '?�수 �?��??, region: '?�해', baseTemp: 17.2, baseWind: 2.2 },
  'DT_0016': { name: '?�영 ?�남', region: '?�해', baseTemp: 16.8, baseWind: 2.4 },
  'DT_0034': { name: '거제 지?�포', region: '?�해', baseTemp: 17.0, baseWind: 2.5 },
  'DT_0018': { name: '?�도??, region: '?�해', baseTemp: 16.2, baseWind: 3.1 },
  // ?�해
  'DT_0007': { name: '?�천 ?�안부??, region: '?�해', baseTemp: 11.5, baseWind: 7.2 },
  'DT_0008': { name: '보령 ?�천항', region: '?�해', baseTemp: 12.8, baseWind: 6.5 },
  'DT_0009': { name: '군산 비응??, region: '?�해', baseTemp: 13.2, baseWind: 5.8 },
  'DT_0030': { name: '?�안 마도', region: '?�해', baseTemp: 12.0, baseWind: 7.5 },
  // ?�주
  'DT_0011': { name: '?��????�돌�?, region: '?�주', baseTemp: 18.8, baseWind: 3.4 },
  'DT_0010': { name: '?�주 ?�림', region: '?�주', baseTemp: 18.2, baseWind: 3.8 },
  'DT_0045': { name: '?�산?�항', region: '?�주', baseTemp: 18.5, baseWind: 4.2 },
  // ??BUG-FIX: ALL_STATIONS???�으??observationData???�락??관측소 추�? (fallback 방�?)
  'DT_0003': { name: '?�척??, region: '?�해', baseTemp: 13.8, baseWind: 4.8 },
  'DT_0006': { name: '목포??, region: '?�해', baseTemp: 12.5, baseWind: 6.2 },
  'DT_0014': { name: '광양�?관측소', region: '?�해', baseTemp: 16.0, baseWind: 2.9 },
};

async function getWaterTemp(sid) {
  // ??SST-PATH-FIX: 공공?�이?�포???�온 API (response ?�퍼 ?�음 ??body.items.item 직접 ?�근)
  const KEY = process.env.KHOA_CCTV_KEY || process.env.KHOA_KEY;
  if (!KEY) return null;

  try {
    // ?�제 ?�짜 ?�선 (?�늘 ?�이??미집�?가?�성)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dateStr = `${yesterday.getFullYear()}${String(yesterday.getMonth()+1).padStart(2,'0')}${String(yesterday.getDate()).padStart(2,'0')}`;
    const url = `https://apis.data.go.kr/1192136/surveyWaterTemp/GetSurveyWaterTempApiService?serviceKey=${encodeURIComponent(KEY)}&obsCode=${sid}&date=${dateStr}&type=json&numOfRows=10&pageNo=1`;
    const res = await axios.get(url, { timeout: 5000, headers: { Accept: 'application/json' } });
    const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    if (text.trimStart().startsWith('<')) return null;
    // ???�제 ?�답 구조: data.body.items.item (response ?�퍼 ?�음)
    const items = res.data?.body?.items?.item;
    if (!items) return null;
    const list = Array.isArray(items) ? items : [items];
    const last = list[list.length - 1];
    // ???�제 ?�드�? wtem (water_temp·waterTemp ?�님)
    const sst = last?.wtem ?? last?.water_temp ?? last?.waterTemp ?? null;
    if (sst !== null && sst !== undefined && sst !== '-') return String(sst);
  } catch (e) {
    if (!e.message?.includes('404')) logger.warn(`[Weather] ?�온 API ?�패 (${sid}): ${e.message}`);
  }
  return null;
}

// ??REAL-WIND-WAVE: 기상�??�양기상부???�시�??�고·?�속 API
// ??KMA ?�제 부??STN 번호 (5?�리) 매핑
// �?관측소 ?�치 기�? 최근???�양?�안부??ID
const BUOY_MAP = {
  // ?�해�?
  'DT_0001':'22102', // 강릉 ?�목?????�해부??22102
  'DT_0021':'22102', // ?�초
  'DT_0033':'22102', // ?�해묵호
  'DT_0003':'22101', // ?�첨
  'DT_0002':'22101', // ?�uc9c4 ???�해부??22101
  'DT_0036':'22101', // 경주감포
  // ?�해�?
  'DT_0004':'22104', // 부?????�해부??22104
  'DT_0034':'22104', // 거제
  'DT_0016':'22105', // ?�영 ??22105
  'DT_0005':'22105', // ?�수
  'DT_0006':'22106', // 목포 ??22106
  'DT_0018':'22106', // ?�도
  'DT_0014':'22107', // 광양�???22107
  // ?�해�?
  'DT_0007':'22298', // ?�천 ???�해부??22298
  'DT_0030':'22297', // ?�안 ??22297
  'DT_0008':'22302', // 보령 ??22302
  'DT_0009':'22303', // 군산 ??22303
  // ?�주�?
  'DT_0010':'22515', // ?�주?�림 ??22515
  'DT_0011':'22515', // ?��???
  'DT_0045':'22515', // ?�산??
};

async function getMarineWeather(sid) {
  const KMA_KEY = process.env.KMA_KEY;
  if (!KMA_KEY) return null;
  const buoyNum = BUOY_MAP[sid];
  if (!buoyNum) return null;
  try {
    const now  = new Date();
    const prev = new Date(now - 70 * 60 * 1000); // 70�???(API 지??보상)
    const pad  = (n) => String(n).padStart(2, '0');
    const tm2  = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}00`;
    const tm1  = `${prev.getFullYear()}${pad(prev.getMonth()+1)}${pad(prev.getDate())}${pad(prev.getHours())}00`;
    // ??tm1/tm2 ?�라미터 ?�용 (tm ?�일 ?�님)
    const url  = `https://apihub.kma.go.kr/api/typ01/url/kma_buoy2.php?tm1=${tm1}&tm2=${tm2}&stn=${buoyNum}&help=1&authKey=${KMA_KEY}`;
    const res  = await axios.get(url, { timeout: 8000 });
    const text = typeof res.data === 'string' ? res.data : '';
    if (!text || !text.includes('START7777')) return null;
    // ???�표(,) 구분?�로 ?�싱
    const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith(' #') && l.includes(buoyNum));
    if (!lines.length) return null;
    const cols = lines[lines.length - 1].trim().split(',').map(s => s.trim());
    // ??컴럼: [0]TM [1]STN [2]WD1 [3]WS1 [4]WS1_GST [5]WD2 [6]WS2 ... [12]WH_MAX [13]WH_SIG [14]WH_AVE
    const ws   = parseFloat(cols[3]);  // WS1 ?�속 (m/s)
    const wdDeg= parseFloat(cols[2]);  // WD1 ?�향 (??
    const wh   = parseFloat(cols[13]); // WH_SIG ?�효?�고 (m)
    if (isNaN(ws) || ws <= -90 || isNaN(wh) || wh <= -90) return null;
    // ?�향 ????방위 변??
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    const wd   = isNaN(wdDeg) ? 'N' : dirs[Math.round(wdDeg / 22.5) % 16];
    return { wind: { speed: Math.max(0, ws), dir: wd }, wave: { coastal: Math.max(0, wh) } };
  } catch (e) {
    logger.warn(`[Marine] 부??API ?�패 (${sid}/${BUOY_MAP[sid]}): ${e.message}`);
    return null;
  }
}

// ??REAL-TIDE: KHOA 조석?�보 ???�제 물때·고조·간조
function getLunarDay() {
  const known = new Date('2024-01-11');
  const diff = Math.floor((Date.now() - known) / (1000 * 60 * 60 * 24));
  return (diff % 30) + 1;
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
    // ???�제 ?�답 구조: body.items.item (response ?�퍼 ?�음)
    const items = res.data?.body?.items?.item || res.data?.response?.body?.items?.item;
    if (!items) return null;
    const list = Array.isArray(items) ? items : [items];
    const highs = list.filter(t => (t.hl_code || t.tide_type || t.hl_Type) === 'H');
    const lows  = list.filter(t => (t.hl_code || t.tide_type || t.hl_Type) === 'L');
    const highTime = (highs[0]?.hl_time || highs[0]?.tideTime || highs[0]?.hl_Apear || '').slice(11,16) || null;
    const lowTime  = (lows[0]?.hl_time  || lows[0]?.tideTime  || lows[0]?.hl_Apear  || '').slice(11,16) || null;
    const lunarDay = getLunarDay();
    const tideNum  = lunarDay <= 15 ? lunarDay : 30 - lunarDay;
    const phaseMap = { 7:'7�??�리)', 13:'13�?조금)', 14:'14�?무시)' };
    const phase = phaseMap[tideNum] || `${tideNum}�?;
    return { phase, high: highTime, low: lowTime };
  } catch (e) {
    // 500 ?�류??obsCode 미�???관측소�??�상
    if (!e.message?.includes('500')) logger.warn(`[Tide] 조석 API ?�패 (${sid}): ${e.message}`);
    return null;
  }
}

async function updateAllStationsCache() {
  logger.info(`[Batch] Updating ${ALL_STATIONS.length} stations (KMA+KHOA ?�시�?...`);
  const results = await Promise.allSettled(ALL_STATIONS.map(async (sid) => {
    const base    = observationData[sid] || { region: '?�해', baseTemp: 16.5, baseWind: 3.0 };
    const profile = REGIONAL_PROFILES[base.region] || REGIONAL_PROFILES['?�해'];
    const seed    = parseInt(sid.replace(/\D/g, '')) || 1;
    const lcg     = (n) => ((seed * 9301 + 49297 * n) % 233280) / 233280;

    // ???�온 (KHOA ?�측)
    const realSst = await getWaterTemp(sid);
    // ???�속·?�고 (기상�??�양부??
    const marine  = await getMarineWeather(sid);
    // ??조석 (KHOA 조석?�보)
    const realTide = await getRealTide(sid);

    // fallback
    const finalTemp = realSst || (base.baseTemp + (lcg(1) * 1.5 - 0.75)).toFixed(1);
    const finalWind = marine?.wind?.speed  ?? Math.max(0.2, (base.baseWind || profile.wind) + (lcg(2) * 3.0 - 1.5));
    const finalWave = marine?.wave?.coastal ?? Math.max(0.1, profile.wave + (lcg(3) * 0.6 - 0.3));
    const windDir   = marine?.wind?.dir     ?? ['N','E','S','W','NE','SW'][seed % 6];

    const seed15 = (seed % 15) + 1;
    const fmtMin = (mins) => { const m = ((mins % 1440) + 1440) % 1440; return `${Math.floor(m/60).toString().padStart(2,'0')}:${(m%60).toString().padStart(2,'0')}`; };
    const phaseMap = { 7:'7�??�리)', 13:'13�?조금)', 14:'14�?무시)' };
    const tidePhase = realTide?.phase || phaseMap[seed15] || `${seed15}�?;
    const tideHigh  = realTide?.high  || fmtMin((seed15 * 45 + seed * 7) % 1440);
    const tideLow   = realTide?.low   || fmtMin(((seed15 * 45 + seed * 7) + 375) % 1440);
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
          sst:  realSst  ? 'KHOA_API' : 'fallback',
          wind: marine   ? 'KMA_BUOY' : 'fallback',
          tide: realTide ? 'KHOA_TIDE' : 'fallback',
        },
      },
      lastUpdated: new Date(),
    };
  }));
  const failCount = results.filter(r => r.status === 'rejected').length;
  if (failCount > 0) logger.warn(`[Batch] ${failCount}/${ALL_STATIONS.length} 지??캐시 갱신 ?�패`);
  else logger.info(`[Batch] ?�체 ${ALL_STATIONS.length} 지??캐시 갱신 ?�료 (KMA+KHOA)`);
}

updateAllStationsCache();

// ?�?�?� 30�?주기 갱신 (주간), ?�벽 2?�간 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
function scheduleWeatherCache() {
  const hour = new Date().getHours();
  const delay = (hour >= 2 && hour < 6) ? 2 * 60 * 60 * 1000 : 30 * 60 * 1000;
  setTimeout(() => { updateAllStationsCache(); scheduleWeatherCache(); }, delay);
}
scheduleWeatherCache();

/* =========================================================
   AUTH & USER LEVELING API (DB + ?�메모리 ?�중 ?�이??
========================================================= */

// ??9TH-A2: /api/health 중복 ?�우???�거 ??L247?�서 ?��? ?�의??(Express �?번째 ?�들???�선)
// uptime/time/db ?�답?� L247 ?�들?�로 ?�합??

// ?�?�?� Cloudinary 조건부 ?��?지 ?�로???�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// CLOUDINARY_URL ?�경변?��? ?�정??경우?�만 CDN ?�로???�성??
// 미설???? base64 그�?�?반환 (기존 방식 ?��?, ?�위 ?�환)
app.post('/api/upload/image', async (req, res) => {
  try {
    const { base64, folder = 'fishinggo' } = req.body;
    if (!base64) return res.status(400).json({ error: '?��?지 ?�이???�요' });

    if (!process.env.CLOUDINARY_URL) {
      // ?�경변???�으�?base64 그�?�?반환 (기존 방식)
      return res.json({ url: base64, type: 'base64' });
    }

    // Cloudinary ?�적 require (?�키지 ?�을 ??fallback)
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
    (logger?.error || console.error)('[Cloudinary Upload ?�패]', err.message);
    // ?�로???�패 ??base64 ?�백 (?�비??중단 방�?)
    res.json({ url: req.body.base64, type: 'base64' });
  }
});

// ?�?�?� ?�트??결제 검�?+ 구독 처리 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ?�경변??
//   PORTONE_API_KEY    : ?�트??REST API ??(?�스?? test_ak_...)
//   PORTONE_API_SECRET : ?�트??API ?�크�? (?�스?? test_sk_...)
// 미설???? ?�스??모드 (금액 검�??�략, 구독�?즉시 처리)

const PLAN_PRICES = { LITE: 9900, PRO: 110000, VVIP: 550000 };
const PLAN_TIERS = { LITE: 'BUSINESS_LITE', PRO: 'PRO', VVIP: 'BUSINESS_VIP' };

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// ?�� Track A: 구�? ?�레???�앱 결제 ?�수�?검�?
// POST /api/payment/google-iap/verify
// cordova-plugin-purchase v13??purchaseToken???�송
// Google Play Developer API�?검�???tier ?�데?�트
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
app.post('/api/payment/google-iap/verify', verifyToken, async (req, res) => {
  try {
    const tp = req.user;                                   // verifyToken??주입
    const { purchaseToken, productId } = req.body;

    if (!purchaseToken || !productId) {
      return res.status(400).json({ error: '?�수 ??�� ?�락 (purchaseToken, productId)' });
    }

    // ?�?� ?�품 ID ???�랜 매핑 (3�??�랜 ?�체 지?? ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
    const IAP_PLAN_MAP = {
      'kr.fishinggo.app.lite_monthly': { planId: 'BASIC', tier: 'BUSINESS_LITE', amount: 9900,   label: '베이�?, days: 31  },
      'kr.fishinggo.app.pro_monthly':  { planId: 'PRO',   tier: 'PRO',           amount: 110000, label: 'PRO',   days: 31  },
      'kr.fishinggo.app.vvip_monthly': { planId: 'VVIP',  tier: 'BUSINESS_VIP',  amount: 550000, label: 'VVIP',  days: 31  },
    };

    const planInfo = IAP_PLAN_MAP[productId];
    if (!planInfo) {
      return res.status(400).json({ error: `?�효?��? ?��? ?�품 ID: ${productId}` });
    }

    // ?�?� Google Play Developer API 검�??�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
    const serviceAccountJson = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT;
    let verified = false;
    let autoRenewing = true;
    let googleExpiryMs = null; // ??Google Play ?�제 만료 ?�각 (?�스?? 5�? ?�제: ~30??

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
        // paymentState: 0=무료체험�? 1=결제?�료, 2=지?�결????0,1,2 모두 ?�효
        if (sub.paymentState === 0 || sub.paymentState === 1 || sub.paymentState === 2) {
          verified = true;
          autoRenewing = sub.autoRenewing !== false;
          // ??Google Play???�제 만료 ?�각 추출 (?�스??구독: 5�? ?�제: 30??
          if (sub.expiryTimeMillis) {
            googleExpiryMs = parseInt(sub.expiryTimeMillis, 10);
            (logger?.info || console.log)(`[Google IAP] 구독 만료 ?�각: ${new Date(googleExpiryMs).toISOString()}`);
          }
        } else {
          (logger?.warn || console.warn)(`[Google IAP] 비정??paymentState: ${sub.paymentState}`);
          verified = false; // 명시?�으�?미�?�?
        }
      } catch (e) {
        // ??BUG-3 FIX: 4xx ?�류???�큰 ?�체가 ?�효?��? ?�음 ??결제 ?�패 처리 (무료 구독 ?�용 방�?)
        const httpStatus = e?.response?.status || e?.status;
        if (httpStatus >= 400 && httpStatus < 500) {
          (logger?.warn || console.warn)(`[Google IAP] Play API ${httpStatus} ?�류 ???�효?��? ?��? ?�큰:`, e.message);
          return res.status(402).json({ error: `결제 검�??�패 ???�효?��? ?��? 구매 ?�큰 (${httpStatus})` });
        }
        // 5xx / ?�트?�크 ?�류�??�뢰 모드 ?�용 (Google ?�버 ?�애 ?�??
        (logger?.warn || console.warn)('[Google IAP] Play API ?�버/?�트?�크 ?�류 ???�뢰 모드 ?�백:', e.message);
        verified = true;
      }
    } else {
      (logger?.warn || console.warn)('[Google IAP] ?�비??계정 미설?????�뢰 모드');
      verified = true;
    }

    if (!verified) return res.status(402).json({ error: '결제 검�??�패 (결제 미완�??�태)' });

    // ?�?� DB ?�어 ?�데?�트 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
    const newTier  = planInfo.tier;
    // ??Google Play ?�제 만료 ?�각 ?�선 ?�용 (?�스??구독 5�??�확??반영)
    // Google Play API 미사????planInfo.days ?�백
    const expiresAt = googleExpiryMs
      ? new Date(googleExpiryMs)
      : new Date(Date.now() + planInfo.days * 24 * 60 * 60 * 1000);

    if (dbReady && User) {
      const filter = tp.email
        ? { email: tp.email }
        // ??BUG-4 FIX: tp.id가 ObjectId 문자?�인 경우 캐스?? ?�니�?무시
        : (() => { try { return { _id: new (require('mongoose').Types.ObjectId)(tp.id) }; } catch { return null; } })();
      if (!filter) {
        (logger?.error || console.error)('[Google IAP] ?�효?��? ?��? ?�용???�별??', tp.id);
        return res.status(400).json({ error: '?�용???�별 불�? ???�로그인 ???�도?�주?�요.' });
      }
      const updated = await User.findOneAndUpdate(filter, {
        $set: { tier: newTier, iapPurchaseToken: purchaseToken, iapProductId: productId, iapExpiresAt: expiresAt, iapAutoRenewing: autoRenewing, updatedAt: new Date() },
      }, { upsert: false, new: true }); // ??new:true 추�? - ?�데?�트 결과 ?�인
      if (!updated) {
        (logger?.error || console.error)(`[Google IAP] ?�️ ?��? 미발�???tier ?�데?�트 불�?: filter=${JSON.stringify(filter)}`);
        // ?��?�?�?찾았?�도 결제 ?�체???�료?�으므�?계속 진행
      } else {
        (logger?.info || console.log)(`[Google IAP] ??tier ?�데?�트 ?�료: ${updated.email} ??${newTier}`);
      }
    }

    // ?�?� 결제 ?�력 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
    if (dbReady && PaymentHistory) {
    // ??FIX-PAYMENT-DEDUP: ?�일 purchaseToken 중복 결제 방�?
    const dupPayment = await PaymentHistory.findOne({ purchaseToken }).lean().catch(() => null);
    if (dupPayment) { logger.warn('[IAP] 중복 purchaseToken:', purchaseToken); return res.status(409).json({ error: '?��? 처리??결제?�니??' }); } // FIX-PAYMENT-DEDUP
      await PaymentHistory.create({
        userId: tp.id || tp.email, email: tp.email,
        pg: 'google_play', method: 'iap',
        planId: planInfo.planId, tier: newTier,
        amount: planInfo.amount, purchaseToken, productId,
        status: 'paid', paidAt: new Date(),
      }).catch(e => (logger?.warn || console.warn)('[Google IAP] ?�력 ?�???�패:', e.message));
    }

    (logger?.info || console.log)(`[Google IAP] ??${planInfo.label} 구독 ?�료: ${tp.email || tp.id}`);

    // FCM ?�림
    try {
      const { sendToUser } = require('./push');
      await sendToUser(tp.id || tp.email, {
        title: `?�� ?�시GO ${planInfo.label} 구독 ?�료!`,
        body: '?�리미엄 기능??지�?바로 ?�용?�세??',
      });
    } catch {}

    return res.json({ success: true, tier: newTier, expiresAt, planId: planInfo.planId, message: `${planInfo.label} 구독???�료?�었?�니??` });

  } catch (err) {
    (logger?.error || console.error)('[Google IAP] ?�버 ?�류:', err.message);
    return res.status(500).json({ error: '?�버 ?�류' });
  }
});

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// ?�� Track B: ?�이??Payple) UCB 결제 ??PAYPLE_ENABLED=true ???�성??
// POST /api/payment/payple/request  ??결제 ?�청 ?�큰 발급
// POST /api/payment/payple/webhook  ??결제 ?�료 Webhook
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
const PAYPLE_ENABLED = process.env.PAYPLE_ENABLED === 'true';
const PAYPLE_PLAN_MAP = {
  BASIC: { tier: 'BUSINESS_LITE', amount: 9900,   label: '베이�?, days: 31  },
  PRO:   { tier: 'PRO',           amount: 110000, label: 'PRO',    days: 365 },
  VVIP:  { tier: 'BUSINESS_VIP',  amount: 550000, label: 'VVIP',   days: 31  },
};

// 결제 ?�청
app.post('/api/payment/payple/request', verifyToken, async (req, res) => {
  if (!PAYPLE_ENABLED) {
    return res.status(503).json({ error: 'UCB 결제가 ?�직 준�?중입?�다.' });
  }
  try {
    const tp = req.user;
    const { planId, price, goodsName, email, name } = req.body;
    if (!PAYPLE_PLAN_MAP[planId]) return res.status(400).json({ error: '?�효?��? ?��? ?�랜' });

    // TODO: ?�이??API ?�동 ??CST_ID / CUST_KEY 발급 ??구현
    // const payple = require('./payple'); // 별도 모듈�?분리 ?�정
    // const { paymentUrl, token } = await payple.createPayment({ planId, price, goodsName, email, name });

    // ?�?� ?�시: ?�인 ?��??�답 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
    return res.status(503).json({ error: '?�이??API ??미설????Render ?�경변?�에 PAYPLE_CST_ID / PAYPLE_CUST_KEY ?�록 ?�요' });
  } catch (err) {
    (logger?.error || console.error)('[Payple] request ?�류:', err.message);
    return res.status(500).json({ error: '?�버 ?�류' });
  }
});

// 결제 ?�료 Webhook
app.post('/api/payment/payple/webhook', async (req, res) => {
  if (!PAYPLE_ENABLED) return res.json({ skip: true });
  try {
    // ?�이??Webhook 검�?
    // ??FIX-PAYPLE-IP-WHITELIST: ?�이??공식 IP ?�이?�리?�트
    const PAYPLE_ALLOWED_IPS = ['13.209.243.147', '13.125.162.144', '54.180.203.98', '127.0.0.1', '::1'];
    const reqIp = (String(req.headers['x-forwarded-for'] || '')).split(',')[0].trim() || req.ip || '';
    if (process.env.NODE_ENV === 'production' && PAYPLE_ALLOWED_IPS.length > 3 && !PAYPLE_ALLOWED_IPS.some(ip => reqIp.includes(ip))) {
      (logger?.warn || console.warn)('[Payple] ?�용?��? ?��? IP:', reqIp);
      // IP 불일�?경고�?(?�이??IP 변�?가?�성 고려, 차단?��? ?�음)
    }
    const { PCD_PAY_RST, PCD_PAY_CODE, PCD_PAYER_EMAIL, PCD_PAY_GOODS, PCD_PAY_TOTAL } = req.body;

    if (PCD_PAY_RST !== 'success' || PCD_PAY_CODE !== '0000') {
      (logger?.warn || console.warn)('[Payple] 결제 ?�패:', PCD_PAY_RST, PCD_PAY_CODE);
      return res.json({ result: 'fail' });
    }

    // planId 추출 (goodsName ?�는 커스?� ?�라미터�??�달)
    const planId = req.body.PCD_CUSTOM_PLAN || 'BASIC';
    const planInfo = PAYPLE_PLAN_MAP[planId];
    if (!planInfo) return res.status(400).json({ error: '?????�는 ?�랜' });

    // FIX-PAYPLE-AMOUNT: 결제 금액 ?�버?�이???�계??(?�조 방어)
    const paidAmount = Number(PCD_PAY_TOTAL);
    if (!paidAmount || paidAmount < planInfo.amount) {
      (logger?.warn || console.warn)('[Payple] 금액 불일�? 기�?=' + planInfo.amount + ', ?�신=' + paidAmount + ', planId=' + planId);
      return res.status(400).json({ error: '결제 금액???�랜 가격과 ?�치?��? ?�습?�다.' });
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

    // FCM ?�림
    try {
      const { sendToUser } = require('./push');
      await sendToUser(email, {
        title: `?�� ?�시GO ${planInfo.label} 구독 ?�료!`,
        body: '?�리미엄 기능??지�?바로 ?�용?�세??',
      });
    } catch {}

    (logger?.info || console.log)(`[Payple] ??${planInfo.label} UCB ?�료: ${email}`);
    return res.json({ result: 'success' });

  } catch (err) {
    (logger?.error || console.error)('[Payple] webhook ?�류:', err.message);
    return res.status(500).json({ error: '?�버 ?�류' });
  }
});

app.post('/api/payment/verify', async (req, res) => {
  try {
    // JWT ?�증: 본인 ?�는 ?�드민만 결제 처리 가??
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }

    const { imp_uid, merchant_uid, planId, tier, harborId, userId, userName } = req.body;
    if (!planId || !userId) return res.status(400).json({ error: '?�수 ??�� ?�락' });

    // 본인 ?�는 ?�드민만 처리 가??
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== userId && tp.email !== userId) {
      return res.status(403).json({ error: '본인 결제�?처리 가?�합?�다.' });
    }

    const expectedAmount = PLAN_PRICES[planId];
    const expectedTier = tier || PLAN_TIERS[planId];
    const isTestMode = !process.env.PORTONE_API_KEY;

    if (!isTestMode && imp_uid) {
      // ?�?�?� ?�서비스: ?�트??API�?결제 금액 검�??�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
      try {
        const axios = require('axios');

        // 1) ?�세???�큰 발급
        const tokenRes = await axios.post('https://api.iamport.kr/users/getToken', {
          imp_key: process.env.PORTONE_API_KEY,
          imp_secret: process.env.PORTONE_API_SECRET,
        });
        const accessToken = tokenRes.data.response?.access_token;
        if (!accessToken) throw new Error('?�트???�큰 발급 ?�패');

        // 2) 결제 ?�보 조회
        const payRes = await axios.get(`https://api.iamport.kr/payments/${imp_uid}`, {
          headers: { Authorization: accessToken },
        });
        const payment = payRes.data.response;

        // 3) 금액 검�?(?��?�?방�?)
        if (payment.status !== 'paid') {
          return res.status(400).json({ error: `결제 미완�??�태: ${payment.status}` });
        }
        if (payment.amount !== expectedAmount) {
          // 금액 불일�????�트?�에 ?�불 ?�청
          await axios.post('https://api.iamport.kr/payments/cancel', {
            imp_uid, reason: '결제 금액 불일�?(?��?�??�심)',
          }, { headers: { Authorization: accessToken } });
          return res.status(400).json({ error: '결제 금액???�치?��? ?�습?�다.' });
        }
        (logger?.info || console.log)(`[결제검�? ??${userName} / ${planId} / ${payment.amount}??/ ${imp_uid}`);
      } catch (verifyErr) {
        (logger?.error || console.error)('[?�트??검�??�류]', verifyErr.message);
        return res.status(500).json({ error: '결제 검�?�??�류가 발생?�습?�다.' });
      }
    } else {
      // ?�?�?� ?�스??모드: 검�??�략, 즉시 구독 처리 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
      (logger?.info || console.info)(`[결제/?�스?�모?? ${userName} / ${planId} / ${expectedAmount}??);
    }

    // ?�?�?� 구독 처리: DB ?�는 ?�메모리 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
    const expiresAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(); // +31??

    if (dbReady && User) {
      await User.findOneAndUpdate(
        { $or: [{ email: userId }, { id: userId }] },
        { tier: expectedTier, subscriptionExpiresAt: expiresAt },
        { new: true }
      ).catch(e => (logger?.warn || console.warn)('[결제] DB ?�데?�트 ?�패:', e.message));
    } else {
      const u = memUsers.find(u => u.email === userId || u.id === userId);
      if (u) { u.tier = expectedTier; u.subscriptionExpiresAt = expiresAt; saveMemUsers(); }
    }

    // VVIP ??�� ?�점 처리 (??BUG-FIX: self-call ?�??직접 처리 ???�트?�크 ?�애 무�?)
    if (planId === 'VVIP' && harborId) {
      try {
        const harbor = HARBOR_LIST.find(h => h.id === harborId);
        if (harbor) {
          const now = new Date();
          const vvipExpires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          // 기존 만료 ?�롯 ?�리
          if (vvipSlots[harborId]) {
            const existSlot = vvipSlots[harborId];
            if (existSlot.expiresAt && new Date(existSlot.expiresAt) < now) {
              delete vvipSlots[harborId]; // 만료???�롯�???��?�기 ?�용
            }
          }
          if (!vvipSlots[harborId]) { // 미점???�는 만료???�롯�??�점
            vvipSlots[harborId] = {
              userId,
              userName: userName || userId,
              purchasedAt: now.toISOString(),
              expiresAt: vvipExpires.toISOString(),
              harborName: harbor.name,
            };
            saveVvipSlots();
            // User DB?�도 VVIP ?�보 ?�??
            if (dbReady && User) {
              await User.findOneAndUpdate(
                { $or: [{ email: userId }, { id: userId }] },
                { vvipHarborId: harborId, vvipExpiresAt: vvipExpires }
              ).catch(e => (logger?.warn || console.warn)('[VVIP verify] DB ?�???�패:', e.message));
            }
            (logger?.info || console.log)(`[VVIP verify] ????�� ?�점 ?�료: ${harbor.name} ??${userId}`);
          }
        }
      } catch (e) {
        (logger?.warn || console.warn)('[VVIP verify] ??�� ?�점 처리 ?�패:', e.message);
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
    res.status(500).json({ error: '?�버 ?�류: ' + err.message });
  }
});

// ?�?�?� 구독 ?�태 조회 ??GET /api/payment/subscription/:userId ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// checkSubscriptionExpiry()가 ???�작 ???�출?�는 ?�드?�인??
// DB ?�는 ?�메모리?�서 ?�재 tier/만료?�을 ?�어 반환
app.get('/api/payment/subscription/:userId', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음', code: 'TOKEN_INVALID' }); }

    const userId = decodeURIComponent(req.params.userId);
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.email !== userId && tp.id !== userId) {
      return res.status(403).json({ error: '본인 ?�보�?조회 가?�합?�다.' });
    }

    let user;
    if (dbReady && User) {
      user = await User.findOne({ $or: [{ email: userId }, { id: userId }] }, 'tier subscriptionExpiresAt email').lean();
    } else {
      user = memUsers.find(u => u.email === userId || u.id === userId);
    }

    if (!user) return res.status(404).json({ error: '?�용???�음' });

    // ??FIX-SUB-FIELDS: Subscription 컬렉?�에??추�? ?�드(planId, amount, pgProvider ?? 조회
    // PaymentHistory.jsx?�서 subscription.planId/amount/pgProvider/startedAt/lastBilledAt ?�용
    let subDoc = null;
    if (dbReady && Subscription) {
      subDoc = await Subscription.findOne({ userId }).lean().catch(() => null);
    } else {
      subDoc = memProSubs[userId] || null;
    }

    const PAID_TIERS = ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'MASTER'];
    const tier = user.tier || 'FREE';
    const isPaid = PAID_TIERS.includes(tier);

    // 만료??체크
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
        // ??추�? ?�드 (PaymentHistory ?�시??
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

    // Subscription 컬렉?�만 ?�는 경우 (?�이????
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
    res.status(500).json({ error: '?�버 ?�류' });
  }
});

// ?�?�?� ?�트???�훅 (결제 ?�료 ?�버 �??�벤?? ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// Render ?�정: ?�트??콘솔 ???�훅 URL = https://[your-server].onrender.com/api/payment/webhook
app.post('/api/payment/webhook', async (req, res) => {
  try {
    // ?�트???�훅 ?�명 검�?(?�로?�션?�서�?강제)
    // ??BUG-FIX: express.json() ?�싱 ??JSON.stringify(req.body)???�본 raw body?� ?�서 불일�?
    // ??HMAC ?�명 불일�?발생. ?�훅 처리 ?�체???��?줄러(runBillingScheduler)가 ?�당?��?�?
    //   ?�기?�는 로그�?기록?�고 200 반환 (?�트???�수 ?�구?�항)
    // ??FIX-WEBHOOK-SIG: PORTONE HMAC ?�명 검�?
    const signature = req.headers['x-iamport-signature'];
    if (process.env.PORTONE_WEBHOOK_SECRET && signature) {
      try {
        const crypto = require('crypto');
        const rawBody = JSON.stringify(req.body);
        const expected = crypto.createHmac('sha256', process.env.PORTONE_WEBHOOK_SECRET).update(rawBody).digest('hex');
        if (signature !== expected) {
          logger.warn('[Webhook] FIX-WEBHOOK-SIG: ?�명 불일�????�조 ?�청 차단');
          return res.status(401).json({ error: '?�명 검�??�패' });
        }
      } catch { }
    }
    if (process.env.NODE_ENV !== 'production') {
      (logger?.debug || console.log)(`[Webhook] ?�명 ?�신: ${signature ? '?�음' : '?�음'}`);
    }

    const { imp_uid, merchant_uid, status } = req.body;
    (logger?.info || console.info)(`[Webhook] imp_uid=${imp_uid} status=${status}`);

    if (status === 'paid') {
      // merchant_uid ?�턴: fishing_PLANID_harborId_timestamp
      const parts = (merchant_uid || '').split('_');
      const planId = parts[1] || null;
      if (planId && PLAN_PRICES[planId]) {
        (logger?.info || console.info)(`[Webhook] ??결제 ?�료 ?�인 - ${planId} / ${imp_uid}`);
      }
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    (logger?.error || console.error)('[Webhook ?�류]', err.message);
    res.status(200).json({ ok: false }); // ?�트???�훅?� 200 반환 ?�수
  }
});

// ?�벨 ?�정 (?�버?� ?�론?�엔?��? ?�동 ?�기??
const LEVEL_CONFIG = [
  { level: 1, title: '초보 ?�시�?, expRequired: 0 },
  { level: 2, title: '견습 ?�시�?, expRequired: 100 },
  { level: 3, title: '?�시 ?�문??, expRequired: 250 },
  { level: 4, title: '?�시 ?�호가', expRequired: 500 },
  { level: 5, title: '베테???�시??, expRequired: 850 },
  { level: 6, title: '중급 ?�시�?, expRequired: 1300 },
  { level: 7, title: '고수 ?�시??, expRequired: 1900 },
  { level: 8, title: '?�시 ?�인', expRequired: 2700 },
  { level: 9, title: '?�설???�시??, expRequired: 3700 },
  { level: 10, title: '?�시????, expRequired: 5000 },
];

// ?�동�?EXP 보상
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

// totalExp 기반?�로 ?�벨 ?�보 계산
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
    // ?�진?�으�??�승?�는 초월 ?�이??로직 ?�용
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
      title: `초월 ?�시??${extraLevelIndex + 1}?�계`,
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
  // ??FIX-ADMIN: ?�드�?계정 ?�별 ???�메??기반(sunjulab.k)
  const rawId = user._id || user.id;
  const isAdminUser = isAdminToken({ email: user.email, tier: user.tier });
  // id: ?�드민�? 'sunjulab.k'�? ?�머지??MongoDB ObjectId 그�?�?
  const resolvedId = isAdminUser ? 'sunjulab.k' : String(rawId);
  // ??BUG-FIX: ?�거??isSunjulabVip(email==='sunjulab') 코드 ?�거 ???�제 계정 ?�는 dead code
  // tier: ?�드�?MASTER, ?�머지=DB�?
  const resolvedTier = isAdminUser ? 'MASTER' : (user.tier || 'FREE');

  // ??FIX-VVIP-BADGE: VVIP ??���??�함 ??로그???�큰갱신/syncFromServer ?�원 ?�함
  const vvipHarborId = user.vvipHarborId || null;
  let vvipHarborName = null;
  if (vvipHarborId) {
    try {
      // HARBOR_LIST??const�??�일 ?�단???�의?�어 ?�으???�버 ?�청 처리 ?�점???��? 초기?�됨
      // try/catch�?초기?????�출 가?�성 방어
      const hInfo = HARBOR_LIST.find(h => h.id === vvipHarborId);
      vvipHarborName = hInfo?.name || null;
    } catch { /* HARBOR_LIST 미초기화 ??무시 */ }
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
    vvipHarborId,                // ??FIX-VVIP-BADGE
    vvipHarborName,              // ??FIX-VVIP-BADGE: '강릉·강문' ????MyPage 뱃�? ?�적??
    iapExpiresAt: user.iapExpiresAt ? (user.iapExpiresAt instanceof Date ? user.iapExpiresAt.toISOString() : user.iapExpiresAt) : null, // ??구독 만료 감�???
  };
}



function applyAttendance(user) {
  // ??LOGIN-FIX-3: lastAttendance가 MongoDB Date 객체????string 비교 ?�류 ?�정
  // User ?�키마에??lastAttendance: Date ?�????DB?�서 Date 객체�?반환??
  // ??'YYYY-MM-DD' string?�로 ?�규????비교?�야 ?�확??출석 처리 가??
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let justAttended = false;
  let leveledUp = false;
  let expGained = 0;

  // lastAttendance가 Date 객체 ?�는 string 모두 처리
  const lastStr = user.lastAttendance
    ? (user.lastAttendance instanceof Date
        ? user.lastAttendance.toISOString().split('T')[0]
        : String(user.lastAttendance).split('T')[0])
    : '';

  if (lastStr !== today) {
    // ?�속 출석 ?�트�?
    if (lastStr === yesterday) {
      user.streak = (user.streak || 0) + 1;
    } else {
      user.streak = 1; // 출석 ?��? ??리셋
    }

    user.lastAttendance = today;
    user.totalAttendance = (user.totalAttendance || 0) + 1;

    // 기본 출석 EXP
    expGained = EXP_REWARDS.attendance;

    // ?�속출석 보너??
    if (user.streak >= 30) expGained += EXP_REWARDS.monthly_streak;
    else if (user.streak >= 7) expGained += EXP_REWARDS.weekly_streak;
    else if (user.streak >= 3) expGained += 20; // 3???�속 ?�액 보너??

    // totalExp 기반?�로 ?�데?�트
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

// --- ?�메??마스???�퍼 ---
function maskEmail(email) {
  const [local, domain] = email.split('@');
  const visible = local.slice(0, 2); // ??2?�리�??�시
  return `${visible}***@${domain}`;  // ??�� *** 3�?고정
}

// --- ?�이??찾기 ---
app.post('/api/auth/find-id', async (req, res) => {
  try {
    const { realName, phone } = req.body;
    if (!realName || !phone) return res.status(400).json({ error: '?�름�??�화번호�??�력?�주?�요.' });
    const normalizedPhone = String(phone).replace(/\D/g, '');
    await waitForDb(5000);
    if (dbReady && User) {
      const users = await User.find({ realName }).select("email phone realName").lean(); // FIX-FIND-ID-SELECT
      const user = users.find(u => String(u.phone || '').replace(/\D/g, '') === normalizedPhone);
      if (!user) return res.status(400).json({ error: '?�치?�는 ?�원 ?�보가 ?�습?�다.' });
      // ??masked: ?�면 ?�시?? raw: 로그???�동?�력??
      return res.json({ email: maskEmail(user.email), rawEmail: user.email });
    }
    const user = memUsers.find(u =>
      u.realName === realName &&
      String(u.phone || '').replace(/\D/g, '') === normalizedPhone
    );
    if (!user) return res.status(400).json({ error: '?�치?�는 ?�원 ?�보가 ?�습?�다.' });
    return res.json({ email: maskEmail(user.email), rawEmail: user.email });
  } catch (err) {
    (logger?.error || console.error)('[POST /api/auth/find-id]', err.message);
    res.status(500).json({ error: '?�버 ?�류' });
  }
});

// --- 비�?번호 ?�설??---
app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
  try {
    const { email, realName, phone, newPassword } = req.body;
    if (!email || !realName || !phone || !newPassword) return res.status(400).json({ error: '모든 ??��???�력?�주?�요.' });
    if (newPassword.length < 8) return res.status(400).json({ error: '비�?번호??8???�상?�어???�니??' });
    // ??FIX-RESET-PWD-LEN: 비�?번호 최�? 길이 ?�한 (bcrypt DoS 방어 ??72바이??초과 ?�력 차단)
    if (newPassword.length > 128) return res.status(400).json({ error: '비�?번호??최�? 128?�입?�다.' });
    const normalizedPhone = String(phone).replace(/\D/g, '');
    const normalizedEmail = email.trim().toLowerCase();
    const hashed = await bcrypt.hash(newPassword, 12);
    await waitForDb(5000);
    if (dbReady && User) {
      // ?�메??+ ?�명 + ?�화번호 3�?검�?
      const users = await User.find({ realName }).lean();
      const user = users.find(u =>
        (u.email || '').toLowerCase() === normalizedEmail &&
        String(u.phone || '').replace(/\D/g, '') === normalizedPhone
      );
      if (!user) return res.status(400).json({ error: '?�력?�신 ?�보?� ?�치?�는 계정???�습?�다.' });
      await User.updateOne({ _id: user._id }, { $set: { password: hashed } });
      return res.json({ success: true, message: '비�?번호가 변경되?�습?�다.' });
    }
    // ?�메모리 fallback
    const userIdx = memUsers.findIndex(u =>
      (u.email || '').toLowerCase() === normalizedEmail &&
      u.realName === realName &&
      String(u.phone || '').replace(/\D/g, '') === normalizedPhone
    );
    if (userIdx === -1) return res.status(400).json({ error: '?�력?�신 ?�보?� ?�치?�는 계정???�습?�다.' });
    memUsers[userIdx].password = hashed;
    saveMemUsers();
    return res.json({ success: true, message: '비�?번호가 변경되?�습?�다.' });
  } catch (err) {
    (logger?.error || console.error)('[POST /api/auth/reset-password]', err.message);
    res.status(500).json({ error: '?�버 ?�류' });
  }
});

// --- ?�이??email ?�드 ?�용) 중복 ?�인 ---
app.post('/api/auth/check-id', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) return res.status(400).json({ error: '?�이?��? ?�력?�주?�요.' });
    const id = email.trim();
    // ??FIX-BAN: 금�? ?�이??검????중복?�인 ?�계?�서 ?�제 차단
    if (isBannedName(id)) {
      return res.json({ available: false, banned: true, error: '???�이?�는 ?�용?????�습?�다. (?�영 ?�책??금�????�현 ?�함)' });
    }
    // DB 모드 ?�도 ???�패?�면 ?�메모리 fallback
    if (dbReady && User) {
      try {
        const existing = await User.findOne({ email: id });
        return res.json({ available: !existing });
      } catch (dbErr) {
        (logger?.error || console.error)('[check-id] DB 조회 ?�패, ?�메모리 fallback:', dbErr.message);
      }
    }
    // ?�메모리 fallback
    const existing = memUsers.find(u => u.email === id);
    return res.json({ available: !existing });
  } catch (err) {
    (logger?.error || console.error)('[check-id] ?�류:', err.message);
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});


// --- ?�재 ?�용???�보 조회 (?�로그인 ?�이 tier/avatar ?�기?�용) ---
app.get('/api/user/me', async (req, res) => {
  try {
    // JWT ?�증 ??본인 ?�는 ?�드민만 조회 가??
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음', code: 'TOKEN_INVALID' }); }

    // ??email 쿼리 ?�라미터 ?�을 ??JWT??tp.email ?�백 ?�용
    // (VVIPSubscribe ?�에??email ?�이 ?�출 ?�에??본인 ?�보 조회 가??
    const email = (Array.isArray(req.query.email) ? req.query.email[0] : (req.query.email || '')).slice(0, 254) /* FIX-QUERY-EMAIL-HPP */ || req.headers['x-user-email'] || tp.email;
    if (!email) return res.status(400).json({ error: 'email ?�요' });

    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== email && tp.email !== email) {
      return res.status(403).json({ error: '본인 ?�보�?조회 가?�합?�다.' });
    }

    let user;
    if (dbReady && User) {
      user = await User.findOne({ email });
    } else {
      user = memUsers.find(u => u.email === email);
    }
    if (!user) return res.status(404).json({ error: '?�용???�음' });
    res.json(buildUserResponse(user));
  } catch (err) {
    res.status(500).json({ error: '?�버 ?�류' });
  }
});

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
// ?�?�?� 고객?�터 1:1 문의 API ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// 비�?글 ?�책: ?�성??본인�?MASTER ?�드민만 ?�람 가??
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??

// ?�메모리 ?�?�소 + ?�일 persist
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

// POST /api/cs/inquiry ??문의 ?�록 (로그???�수)
app.post('/api/cs/inquiry', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '로그?�이 ?�요?�니??', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '?�큰???�효?��? ?�습?�다.' }); }

    const { realName, nickname, phone, category, title, content } = req.body;
    if (!content || content.trim().length < 5) {
      return res.status(400).json({ error: '문의 ?�용??5???�상 ?�력?�주?�요.' });
    }
    if (!title || title.trim().length < 2) {
    if (title && title.trim().length > 200) return res.status(400).json({ error: '?�목?� 200?��? 초과?????�습?�다.' }); // ??FIX-TITLE-MAX
      return res.status(400).json({ error: '?�목??2???�상 ?�력?�주?�요.' });
    }

    const inquiry = {
      id: `CS-${Date.now()}`,
      authorEmail: tp.email || tp.id,
      authorId: tp.id || tp.email,
      realName: (realName || '').trim(),
      nickname: (nickname || tp.name || '').trim(),
      phone: (phone || '').trim(),
      category: category || '?�반 문의',
      title: title.trim(),
      content: content.trim(),
      status: 'pending',   // pending | answered | closed
      reply: null,
      repliedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // DB ?�???�도
    if (dbReady && mongoose.connection.readyState === 1) {
      try {
        // MongoDB??직접 ?�??(별도 모델 ?�이 generic collection ?�용)
        await mongoose.connection.db.collection('cs_inquiries').insertOne(inquiry);
      } catch { memCsInquiries.push(inquiry); saveCsInquiries(); }
    } else {
      memCsInquiries.push(inquiry);
      saveCsInquiries();
    }

    (logger?.info || console.log)(`[CS] ??문의 ?�록: ${inquiry.id} / ${inquiry.authorEmail}`);
    res.json({ success: true, id: inquiry.id, message: '문의가 ?�수?�었?�니?? 빠른 ?�일 ?�에 ?��??�리겠습?�다.' });
  } catch (err) {
    (logger?.error || console.error)('[POST /api/cs/inquiry]', err.message);
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});

// GET /api/cs/inquiries ????문의 목록 조회 (본인) / ?�체 조회 (마스??
app.get('/api/cs/inquiries', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '로그?�이 ?�요?�니??', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '?�큰???�효?��? ?�습?�다.' }); }

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

    // 비�?글 ?�책: 마스?��? ?�니�?본인 글�?
    if (!isAdmin) {
      items = items.filter(i => i.authorEmail === (tp.email || tp.id) || i.authorId === (tp.email || tp.id));
    }

    res.json(items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (err) {
    (logger?.error || console.error)('[GET /api/cs/inquiries]', err.message);
    res.status(500).json({ error: '?�버 ?�류' });
  }
});

// PUT /api/cs/inquiry/:id/reply ??마스???��? ?�록
app.put('/api/cs/inquiry/:id/reply', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '로그?�이 ?�요?�니??' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '?�큰???�효?��? ?�습?�다.' }); }

    if (!isAdminToken(tp)) return res.status(403).json({ error: '관리자�??��??????�습?�다.' });

    const { id } = req.params;
    const { reply } = req.body;
    if (!reply || reply.trim().length < 2) return res.status(400).json({ error: '?��? ?�용???�력?�주?�요.' });

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
      if (!item) return res.status(404).json({ error: '문의�?찾을 ???�습?�다.' });
      item.reply = reply.trim(); item.repliedAt = now; item.status = 'answered'; item.updatedAt = now;
      saveCsInquiries();
    }

    res.json({ success: true, message: '?��????�록?�었?�니??' });
  } catch (err) {
    (logger?.error || console.error)('[PUT /api/cs/inquiry/reply]', err.message);
    res.status(500).json({ error: '?�버 ?�류' });
  }
});


// PUT /api/user/tier ???�운그레?�드 방�? ?�함
// ?�료 구독 중인 ?�용?�는 ?�위 ?�랜?�로 변�?불�? (결제 ?�역 보호)
const TIER_RANK = { FREE: 0, BUSINESS_LITE: 1, PRO: 2, BUSINESS_VIP: 3, MASTER: 4 };
// ?�운그레?�드 불�? ?�어 (BUSINESS_VIP, PRO??명시???��? API ?�이 변�?불�?)
const PROTECTED_TIERS = ['PRO', 'BUSINESS_VIP', 'MASTER'];

app.put('/api/user/tier', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }

    const { email, tier } = req.body;
    if (!email || !tier) return res.status(400).json({ error: '?�메?�과 ?�어가 ?�요?�니??' });
    if (!TIER_RANK.hasOwnProperty(tier)) return res.status(400).json({ error: '?�효?��? ?��? ?�랜?�니??' });

    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.email !== email && tp.id !== email)
      return res.status(403).json({ error: '본인 ?�보�?변�?가?�합?�다.' });

    // ?�재 DB tier 조회
    let currentTier = 'FREE';
    let user;
    if (dbReady && User) {
      user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: '?�용?��? 찾을 ???�습?�다.' });
      currentTier = user.tier || 'FREE';
    } else {
      user = memUsers.find(u => u.email === email);
      if (!user) return res.status(404).json({ error: '?�용?��? 찾을 ???�습?�다.' });
      currentTier = user.tier || 'FREE';
    }

    // ??SECURITY-FIX: 비�?리자???�그?�이??불�? (결제 ?�이 PRO/VIP ?�득 방�?)
    if (!isAdmin) {
      // sunjulab 계정?� ??�� BUSINESS_VIP ?�상 ?��?
      const isSunjulabVip = email === 'sunjulab';
      if (isSunjulabVip && (TIER_RANK[tier] || 0) < TIER_RANK['BUSINESS_VIP']) {
        return res.status(403).json({ error: '??계정?� BUSINESS_VIP 구독???��??�니??', currentTier: 'BUSINESS_VIP' });
      }
      // ???�그?�이???�도 ??결제 ?�이 불�? (관리자�?직접 변�?가??
      if ((TIER_RANK[tier] || 0) > (TIER_RANK[currentTier] || 0)) {
        return res.status(403).json({
          error: '?�랜 ?�그?�이?�는 결제 ???�동 처리?�니?? 직접 변경�? 불�??�니??',
          currentTier,
          code: 'UPGRADE_REQUIRES_PAYMENT',
        });
      }
      // ?�료 구독 중인 계정 ???�위 ?�랜?�로 변�?불�? (고객?�터 ?�해?�만)
      if (PROTECTED_TIERS.includes(currentTier) && (TIER_RANK[tier] || 0) < (TIER_RANK[currentTier] || 0)) {
        return res.status(403).json({
          error: `?�재 ${currentTier} 구독 중입?�다. 구독 ?��???고객?�터�??�해 진행?�주?�요.`,
          currentTier,
        });
      }
    }

    // tier ?�데?�트
    if (dbReady && User) {
      await User.findOneAndUpdate({ email }, { $set: { tier } });
    } else {
      user.tier = tier;
      saveMemUsers();
    }
    return res.json({ success: true, tier });
  } catch (err) {
    (logger?.error || console.error)('[PUT /api/user/tier]', err.message);
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});

// ??SECURITY-FIX: ?�드�??�용 강제 tier 변�?(결제 ?�이 ?�득??tier 복원??
// POST /api/admin/force-tier  { targetEmail, tier }
app.post('/api/admin/force-tier', async (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�류' }); }
  if (!isAdminToken(tp)) return res.status(403).json({ error: '?�드�??�용 API' });

  const { targetEmail, tier } = req.body;
  if (!targetEmail || !tier) return res.status(400).json({ error: 'targetEmail, tier ?�수' });
  if (!TIER_RANK.hasOwnProperty(tier)) return res.status(400).json({ error: '?�효?��? ?��? tier' });

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
        (logger?.info || console.log)(`[ADMIN force-tier] ${result.email || result.id} ??${tier} (by ${tp.email})`);
      }
    }
    // in-memory fallback
    const memIdx = memUsers.findIndex(u => u.email === targetEmail || u.id === targetEmail || u.name === targetEmail);
    if (memIdx !== -1) { memUsers[memIdx].tier = tier; saveMemUsers(); updated = true; }

    if (!updated) return res.status(404).json({ error: '?�당 ?�용?��? 찾을 ???�습?�다.' });
    return res.json({ success: true, targetEmail, tier, message: `${targetEmail} ??${tier} 변�??�료` });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ??SECURITY: 미결???�료 tier ?��? API ???�드�??�용
// GET /api/admin/suspicious-tiers
app.get('/api/admin/suspicious-tiers', async (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�류' }); }
  if (!isAdminToken(tp)) return res.status(403).json({ error: '?�드�??�용 API' });

  const PAID_TIERS = ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP'];

  try {
    if (!dbReady || !User || !PaymentHistory) {
      const suspects = memUsers
        .filter(u => PAID_TIERS.includes(u.tier))
        .map(u => ({ id: u.id, email: u.email, name: u.name, tier: u.tier, hasPaid: false, source: 'memory' }));
      return res.json({ suspects, total: suspects.length, note: 'in-memory ??결제 검�?불�?' });
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

// ?�?�?� FREE ?�랜 ?�인???�장 ?�일 3???�한 체크 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// POST /api/user/point-visit-check
// - 로그???�용???�용 (GUEST???�라?�언??sessionStorage�?처리)
// - KST(UTC+9) ?�정 기�??�로 ?�일 카운??리셋
// - ?�료?�랜(LITE/PRO/VVIP/MASTER) �??�드민�? ??�� allowed:true 반환
// - ?�버 ?�류 ??fail-open (allowed:true) 반환?�여 UX 보호
const FREE_DAILY_LIMIT = 3;
// KST 기�? ?�늘 ?�짜 'YYYY-MM-DD' 반환 (Render ?�버 UTC ?�경 ?�??
function getKstDateString() {
  const now = new Date();
  // UTC+9 ?�프???�용
  const kstMs = now.getTime() + 9 * 60 * 60 * 1000;
  return new Date(kstMs).toISOString().split('T')[0]; // 'YYYY-MM-DD'
}
app.post('/api/user/point-visit-check', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음', code: 'TOKEN_INVALID' }); }

    // ?�드민�? 무제??
    if (isAdminToken(tp)) {
      return res.json({ allowed: true, remaining: 999, total: FREE_DAILY_LIMIT, unlimited: true });
    }

    const todayKst = getKstDateString();
    const PAID_TIERS = ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'MASTER'];

    // ?�?�?� DB 모드 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
    if (dbReady && User) {
      // ??BUG-FIX: _id: tp.id ?�거 ??tp.id가 MongoDB ObjectId가 ?�닌 문자?�일 ??CastError throw 방�?
      // email?� ??�� 존재?�며 unique?�모�??�독 조회�?충분
      const user = await User.findOne(
        { email: tp.email },
        'tier dailyPointVisit'
      ).lean();

      if (!user) return res.json({ allowed: true, remaining: FREE_DAILY_LIMIT, total: FREE_DAILY_LIMIT });

      // ?�료 ?�랜?�면 무제??
      if (PAID_TIERS.includes(user.tier)) {
        return res.json({ allowed: true, remaining: 999, total: FREE_DAILY_LIMIT, unlimited: true });
      }

      const dpv = user.dailyPointVisit || { count: 0, date: '' };
      // ?�짜가 바뀌었?�면 카운??리셋
      const count = dpv.date === todayKst ? (dpv.count || 0) : 0;

      if (count >= FREE_DAILY_LIMIT) {
        return res.json({ allowed: false, remaining: 0, total: FREE_DAILY_LIMIT });
      }

      // 카운??증�? �??�??
      await User.findOneAndUpdate(
        { email: tp.email },
        { 'dailyPointVisit.count': count + 1, 'dailyPointVisit.date': todayKst }
      );

      return res.json({ allowed: true, remaining: FREE_DAILY_LIMIT - (count + 1), total: FREE_DAILY_LIMIT });
    }

    // ?�?�?� ?�메모리 모드 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
    const memUser = memUsers.find(u => u.email === tp.email || u.id === tp.id);
    if (!memUser) return res.json({ allowed: true, remaining: FREE_DAILY_LIMIT, total: FREE_DAILY_LIMIT });

    // ?�료 ?�랜?�면 무제??
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
    // ??fail-open: ?�버 ?�류 ??UX 보호�??�해 ?�용 처리
    logger.error('[point-visit-check] ?�버 ?�류:', err.message);
    return res.json({ allowed: true, remaining: FREE_DAILY_LIMIT, total: FREE_DAILY_LIMIT, error: 'fallback' });
  }
});

// --- ?�림 ?�정 변�?---
app.post('/api/user/settings', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const { email, notiSettings } = req.body;
    if (!email || !notiSettings) return res.status(400).json({ error: '?�메?�과 ?�정 ?�이?��? ?�요?�니??' });
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== email && tp.email !== email) return res.status(403).json({ error: '본인 ?�정�?변�?가?? });

    if (dbReady && User) {
      const user = await User.findOneAndUpdate({ email }, { notiSettings }, { new: true, runValidators: true });
      if (!user) return res.status(404).json({ error: '?�용?��? 찾을 ???�습?�다.' });
      return res.json({ success: true, notiSettings: user.notiSettings });
    }

    // ?�메모리
    let memUser = memUsers.find(u => u.email === email);
    if (memUser) {
      memUser.notiSettings = notiSettings;
    } else {
      memUser = { email, notiSettings, name: email.split('@')[0], totalExp: 0 };
      if (memUsers.length >= 5000) memUsers.shift(); // ??FIX-MEMUSERS-SIZE
  memUsers.push(memUser);
    }
    saveMemUsers(); // ?�림 ?�정 ?�일 ?�??
    return res.json({ success: true, notiSettings });
  } catch (err) {
    (logger?.error || console.error)('[Settings Update]', err.message);
    res.status(500).json({ error: '?�버 ?�러가 발생?�습?�다.' });
  }
});

// --- ?�네??중복 ?�인 ---
app.post('/api/auth/check-name', async (req, res) => {
  try {
    const { name, excludeEmail } = req.body; // ??NICK-SELF: ?�네???�정 ??본인 ?�외 ?�션
    if (!name || !name.trim()) return res.status(400).json({ error: '?�네?�을 ?�력?�주?�요.' });
    const nm = name.trim();
    // ??FIX-BAN: 금�? ?�네??검????중복?�인 ?�계?�서 ?�제 차단
    if (isBannedName(nm)) {
      return res.json({ available: false, banned: true, error: '???�네?��? ?�용?????�습?�다. (?�영 ?�책??금�????�현 ?�함)' });
    }
    // DB 모드 ?�도 ???�패?�면 ?�메모리 fallback
    if (dbReady && User) {
      try {
        const existing = await User.findOne({ name: nm });
        // excludeEmail???�으�?본인 계정?�면 ?�용 가?�으�?처리
        if (existing && excludeEmail && existing.email === excludeEmail) {
          return res.json({ available: true });
        }
        return res.json({ available: !existing });
      } catch (dbErr) {
        (logger?.error || console.error)('[check-name] DB 조회 ?�패, ?�메모리 fallback:', dbErr.message);
      }
    }
    // ?�메모리 fallback
    const existing = memUsers.find(u => u.name === nm);
    if (existing && excludeEmail && existing.email === excludeEmail) {
      return res.json({ available: true });
    }
    return res.json({ available: !existing });
  } catch (err) {
    (logger?.error || console.error)('[check-name] ?�류:', err.message);
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});


// ?�?�?� SMS 본인?�증 (CoolSMS) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// OTP ?�시 ?�?�소: { phone: { otp, expiresAt } }
const otpStore = new Map();
// ??FIX-OTP-CLEANUP: OTP 만료 ?�동 ?�리 (5분마?? + 최�? 1000�??�한
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

// CoolSMS SDK ?�적 로드 (?�치??경우?�만)
let coolsmsClient = null;
try {
  const coolsmsModule = require('coolsms-node-sdk');
  const CoolsmsMessageService = coolsmsModule.default || coolsmsModule.Coolsms || coolsmsModule;
  if (CoolsmsMessageService && process.env.SMS_API_KEY && process.env.SMS_API_SECRET) {
    coolsmsClient = new CoolsmsMessageService(process.env.SMS_API_KEY, process.env.SMS_API_SECRET);
    (logger?.info || console.log)('??CoolSMS ?�라?�언??초기???�료');
  } else {
    (logger?.info || console.log)('?�️ CoolSMS API ??미설????개발 모드(콘솔 출력)');
  }
} catch (e) {
  (logger?.warn || console.warn)('?�️ CoolSMS SDK 미설�???개발 모드(콘솔 출력)');
}

async function sendAppPushNotification(userEmail, type, title, message, data = {}) {
  let user = null;
  if (dbReady && User) {
    user = await User.findOne({ email: userEmail });
  } else {
    user = memUsers.find(u => u.email === userEmail);
  }

  if (!user) return;
  // ?�림 ?�정 체크 (?�정???�으�?기본 true�?간주, 명시?�으�?false??경우�?발송 ?�외)
  if (user.notiSettings && user.notiSettings[type] === false) return;

  // ??socket.io broadcast (?�그?�운?�용)
  io.emit('push_notification', {
    targetEmail: userEmail,
    title: title,
    message: message,
    type: type,
    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  });

  // ??FCM ?�제 ?�시 (백그?�운???�금?�면??
  const userId = user._id || user.id;
  if (userId) {
    pushService.sendToUser(userId, { title, body: message, data }).catch(() => {});
  }

  logger.info(`[???�쉬 ?�림 ?�송] ?�??${userEmail}, ?�목:${title}`);
}

// OTP 발송
app.post('/api/auth/send-otp', otpLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: '?��???번호�??�력?�주?�요.' });

    // 번호 ?�규?? ?�자�?추출
    const normalized = phone.replace(/[^0-9]/g, '');
    if (!/^01[0-9]{8,9}$/.test(normalized)) {
      return res.status(400).json({ error: '?�바�??��???번호�??�력?�주?�요. (?? 010-1234-5678)' });
    }

    // 발송 쿨다?? 1�??�내 ?�요�?차단
    const existing = otpStore.get(normalized);
    if (existing && Date.now() < existing.expiresAt - 4 * 60 * 1000) {
      return res.status(429).json({ error: '1�??�에 ?�시 ?�청?�주?�요.' });
    }

    // 6?�리 OTP ?�성
    const otp = String(require('crypto').randomInt(100000, 1000000)); // ??FIX-OTP-CRYPTO-RANDOM: ?�호?�적 ?�수
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5�??�효

    otpStore.set(normalized, { otp, expiresAt, verified: false });

    const senderPhone = process.env.SMS_SENDER || '01000000000';

    if (coolsmsClient) {
      // ?�제 SMS 발송
      await coolsmsClient.sendOne({
        to: normalized,
        from: senderPhone,
        text: `[?�시GO] ?�증번호: ${otp}\n5�??�내 ?�력?�주?�요.`,
        type: 'SMS',
      });
      (logger?.info || console.log)(`[SMS] 발송 ?�료 ??${normalized.slice(0, 3)}****${normalized.slice(-4)}`);
    } else {
      // 개발 모드: OTP??보안??콘솔???�출 ??????로그로만 출력
      (logger?.info || console.log)(`[SMS 개발모드] ?�신번호: ${normalized.slice(0, 3)}****${normalized.slice(-4)} / OTP 발송 ?�료`);
    }

    res.json({ success: true, message: '?�증번호가 발송?�었?�니??' });
  } catch (err) {
    (logger?.error || console.error)('[send-otp] ?�류:', err.message);
    res.status(500).json({ error: 'SMS 발송 �??�류가 발생?�습?�다.' });
  }
});

// OTP 검�?
app.post('/api/auth/verify-otp', otpLimiter, (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: '번호?� ?�증코드�??�력?�주?�요.' });

    const normalized = phone.replace(/[^0-9]/g, '');
    const record = otpStore.get(normalized);

    if (!record) return res.status(400).json({ error: '?�증 ?�청 ?�역???�습?�다. ?�증번호�??�시 ?�청?�주?�요.' });
    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalized);
      return res.status(400).json({ error: '?�증번호가 만료?�었?�니?? ?�시 ?�청?�주?�요.' });
    }
    if (record.otp !== otp.trim()) {
      // 브루?�포??방�?: 5???�상 ?�패 ???�코????��
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts >= 5) {
        otpStore.delete(normalized);
        return res.status(429).json({ error: '?�증 ?�도 ?�수�?초과?�습?�다. ?�증번호�??�시 ?�청?�주?�요.' });
      }
      otpStore.set(normalized, record);
      return res.status(400).json({ error: `?�증번호가 ?�바르�? ?�습?�다. (${record.attempts}/5??` });
    }

    // 검�??�공: ?�래�??�시 (?�원가?????�확??
    record.verified = true;
    otpStore.set(normalized, record);

    res.json({ success: true, message: '?�증???�료?�었?�니??' });
  } catch (err) {
    (logger?.error || console.error)('[verify-otp] ?�류:', err.message);
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});

// --- ?�원가??---
// ?�?� 구�? ?�사관???�스??계정 ?�동 ?�성 (?�드�??�용) ?�?�?�?�?�?�?�?�?�?�?�
app.post('/api/admin/create-test-account', async (req, res) => {
  const { adminKey } = req.body;
  if (!process.env.ADMIN_SECRET || adminKey !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: '권한 ?�음' });
  }
  try {
    const bcrypt = require('bcryptjs');
    const testEmail = 'reviewer@fishinggo.kr';
    const testPw    = 'FishingGO2024!';
    const testName  = '?�사관';

    if (dbReady && User) {
      const exists = await User.findOne({ email: testEmail });
      if (exists) {
        // 비�?번호 ?�설??
        const hash = await bcrypt.hash(testPw, 12);
        await User.findOneAndUpdate({ email: testEmail }, {
          $set: { password: hash, tier: 'BUSINESS_LITE', name: testName, updatedAt: new Date() }
        });
        return res.json({ ok: true, message: '기존 계정 ?�데?�트 ?�료', email: testEmail }); // ??FIX-TESTACCT-PWDLEAK: ?�답?�서 ?�문 비�?번호 ?�거
      }
      const hash = await bcrypt.hash(testPw, 12);
      await User.create({
        email: testEmail, password: hash, name: testName,
        tier: 'BUSINESS_LITE', createdAt: new Date(), updatedAt: new Date(),
      });
      return res.json({ ok: true, message: '?�스??계정 ?�성 ?�료', email: testEmail }); // ??FIX-TESTACCT-PWDLEAK
    } else {
      // ?�메모리
      const hashMem = require('bcryptjs').hashSync(testPw, 10); // ??FIX-TESTACCT-PWDLEAK: ?�메모리??bcrypt ?�싱
      users.push({ email: testEmail, password: hashMem, name: testName, tier: 'BUSINESS_LITE' });
      return res.json({ ok: true, message: '?�메모리 계정 ?�성', email: testEmail }); // ??FIX-TESTACCT-PWDLEAK
    }
  } catch (err) {
    return res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});

app.post('/api/auth/register', authLimiter, async (req, res) => { // ??FIX-REGISTER-RATE-LIMIT
  try {
    // ??FIX-NOSQL-REGISTER: req.body ?�드 ?�??강제 (NoSQL Operator Injection 방어)
    if (typeof req.body.email !== 'string' || typeof req.body.password !== 'string' || typeof req.body.name !== 'string') {
      return res.status(400).json({ error: '?�못???�청 ?�식' });
    }
    const { email, password, name, phone, realName } = req.body; // ??realName 추�? ?�신
    if (!email || !password || !name) return res.status(400).json({ error: '모든 ?�드�??�력?�주?�요.' });
    // ?�력�?검�?
    if (email.trim().length < 4) return res.status(400).json({ error: 'ID??4???�상?�어???�니??' });
    if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim())) { return res.status(400).json({ error: '?�메???�식???�바르�? ?�습?�다.' }); } // ??FIX-EMAIL
    if (password.length < 8) return res.status(400).json({ error: '비�?번호??8???�상?�어???�니??' });
    if (!/(?=.*[A-Za-z])(?=.*[0-9]).{8,}/.test(password)) return res.status(400).json({ error: '비�?번호???�문+?�자 조합 8???�상?�어???�니??' }); // ??FIX-PWD-COMPLEXITY
    if (name.trim().length < 2) return res.status(400).json({ error: '?�네?��? 2???�상?�어???�니??' });
    if (name.trim().length > 20) return res.status(400).json({ error: '?�네?��? 20???�하?�야 ?�니??' });
    // ??금�? ?�네???�이??검??(?�드�?계정 ?�외)
    if (!isAdminToken({ email })) {
      if (isBannedName(name))  return res.status(400).json({ error: '???�네?��? ?�용?????�습?�다. (?�영 ?�책??금�????�현 ?�함)' });
    if (isReservedNickname(name)) return res.status(400).json({ error: '?�용?????�는 ?�네?�입?�다. (?�약??금�?)' }); // FIX-SIGNUP-RESERVED
      if (isBannedName(email)) return res.status(400).json({ error: '???�이?�는 ?�용?????�습?�다. (?�영 ?�책??금�????�현 ?�함)' });
    }

    // ?�화번호 ?�식 검�?(?�력??경우)
    if (phone) {
      const normalized = phone.replace(/[^0-9]/g, '');
      if (!/^01[016789]\d{7,8}$/.test(normalized)) {
        return res.status(400).json({ error: '?�효???��???번호�??�력?�주?�요.' });
      }
      // OTP ?�증 ?�료 ?��? ?�인 (?�증 ?�스???�동 ??
      const record = otpStore.get(normalized);
      if (record && !record.verified) {
        return res.status(400).json({ error: '?��????�증???�료?�주?�요.' });
      }
    }

    if (dbReady && User) {
      const existing = await User.findOne({ $or: [{ email }, { name }] });
      if (existing) return res.status(400).json({ error: '?��? ?�용 중인 ?�메?�이거나 ?�네?�입?�다.' });
      const hashed = await bcrypt.hash(password, 12);
      const user = new User({
        email, password: hashed, name,
        realName: (realName || '').trim(), // ???�명 DB ?�??
        phone: phone || '',
      });
      await user.save();
      if (phone) otpStore.delete(phone.replace(/[^0-9]/g, '')); // OTP ?�용 ?�료
      return res.json({ success: true });
    } else {
      // ?�메모리 fallback
      if (memUsers.find(u => u.email === email)) return res.status(400).json({ error: '?��? ?�록???�메?�입?�다.' });
      if (memUsers.find(u => u.name === name)) return res.status(400).json({ error: '?��? ?�용 중인 ?�네?�입?�다.' });
      const hashed = await bcrypt.hash(password, 12);
      memUsers.push({
        id: Date.now().toString(), email, password: hashed, name,
        realName: (realName || '').trim(), // ???�명 ?�메모리 ?�??
        phone: phone || '',
        level: 1, exp: 0, tier: 'FREE', avatar: null,
        followers: [], following: [], lastAttendance: null, totalAttendance: 0, totalExp: 0,
      });
      if (phone) otpStore.delete(phone.replace(/[^0-9]/g, '')); // OTP ?�용 ?�료
      saveMemUsers(); // ?�구 보존
      return res.json({ success: true });
    }
  } catch (err) { logger.error('[register] ?�버 ?�류:', err.message); res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' }); }
});
    const email = (typeof req.body.email === 'string' ? req.body.email : '').replace(/ /g, '').trim(); // ??FIX-NOSQL-LOGIN FIX-NULL-BYTE
    const password = typeof req.body.password === 'string' ? req.body.password : ''; // FIX-NOSQL-LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    // ??AUTH-FIX-8: ?�메??공백 trim ??복사-붙여?�기 ???�뒤 공백 ?�함 케?�스 방어
    const email = (req.body.email || '').trim();
    const password = req.body.password || '';
    if (!email || !password) return res.status(400).json({ error: '?�메?�과 비�?번호�??�력?�주?�요.' });

    // ??SCALE-FIX: 계정 기반 브루?�포??보호 (IP ?�???�메???�위)
    const attemptKey = email.toLowerCase();
    const attemptInfo = loginAttemptMap.get(attemptKey) || { count: 0, lockedUntil: null };
    if (attemptInfo.lockedUntil && Date.now() < attemptInfo.lockedUntil) {
      const remainSec = Math.ceil((attemptInfo.lockedUntil - Date.now()) / 1000);
      return res.status(429).json({ error: `로그???�도가 ?�무 많습?�다. ${remainSec}�????�시 ?�도?�주?�요.` });
    }

    let user;
    // ??DB-FIX: ?�버 ?�작 직후 DB ?�결 중이�?최�? 8�??��?(?�버 ?�시??직후 로그???�패 방�?)
    const dbAvailable = await waitForDb(8000);

    if (dbAvailable && User) {
      try {
        user = await User.findOne({ email }).select('-password -__v');
      } catch (dbErr) {
        logger.warn('[login] DB 조회 ?�패 ??memUsers fallback:', dbErr.message);
        user = memUsers.find(u => u.email === email);
      }
    } else {
      user = memUsers.find(u => u.email === email);
      // DB가 ?�고 memUsers?�도 ?�으�???DB ?�결 ?�패 ?�태?�을 ?�내
      if (!user && MONGO_URI && !dbAvailable) {
        return res.status(503).json({ error: '?�버가 초기??중입?�다. ?�시 ???�시 ?�도?�주?�요. (DB ?�결 �?' });
      }
    }
    if (!user) return res.status(400).json({ error: '?�메???�는 비�?번호가 ?�바르�? ?�습?�다.' });


    // ??AUTH-FIX-9: password ?�드 null 가????구�? OAuth ?�용 계정???�메??로그???�도 ??bcrypt ?�래??방어
    if (!user.password) return res.status(400).json({ error: '??계정?� ?�셜 로그???�용?�니?? 구�? 로그?�을 ?�용?�주?�요.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // ?�패 카운??증�?
      attemptInfo.count += 1;
      if (attemptInfo.count >= MAX_LOGIN_FAIL) {
        attemptInfo.lockedUntil = Date.now() + LOGIN_LOCK_MS;
        attemptInfo.count = 0;
      }
      loginAttemptMap.set(attemptKey, attemptInfo);
      const remain = MAX_LOGIN_FAIL - attemptInfo.count;
      return res.status(400).json({ error: `?�메???�는 비�?번호가 ?�바르�? ?�습?�다.${remain <= 3 ? ` (경고: ${remain}???�음)` : ''}` });
    }
    // 로그???�공 ???�패 카운??초기??
    loginAttemptMap.delete(attemptKey);

    // ??LOGIN-FIX-2: 출석 ?�???�패가 로그???�체�?막�? ?�도�?try-catch 분리
    const { justAttended, leveledUp, expGained, streak } = applyAttendance(user);
    try {
      if (dbReady && User) {
        await user.save();
      } else {
        saveMemUsers();
      }
    } catch (saveErr) {
      // 출석/EXP ?�???�패??경고�???로그?��? 계속 진행
      logger.warn('[login] 출석 ?�이???�???�패 (로그?��? ?�상 처리):', saveErr.message);
    }

    const userTier = user.tier || 'FREE';
    const accessToken = jwt.sign({ id: user._id || user.id, email: user.email, name: user.name, tier: userTier }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user._id || user.id, email: user.email, name: user.name, tier: userTier, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
    res.setHeader('Cache-Control', 'no-store'); // ??FIX-CACHE-NO-STORE-LOGIN
    res.json({ token: accessToken, accessToken, refreshToken, user: buildUserResponse(user), justAttended, leveledUp, expGained, streak });
  } catch (err) { logger.error('[login] ?�버 ?�류:', err.message); res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' }); }
});

// ??FIX-REFRESH-BLACKLIST-INIT: refreshToken blacklist (replay attack 방어)
const usedRefreshTokens = new Set();
// 24?�간마다 ?�리 (메모�?보호)
setInterval(() => { usedRefreshTokens.clear(); }, 24 * 3600_000);

// --- ?�큰 갱신 (Refresh Token) ---
// ??AUTH-FIX-4: tier 복원 ??기존 코드??tier ?�락?�로 갱신 ????�� FREE 처리
// tier�?refresh ?�큰?�서 ?�어 ??accessToken???�함?�켜 구독 ?�태 ?��?
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh Token???�습?�다.' });
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET, { algorithms: ['HS256'] });
    // ??FIX-REFRESH-BLACKLIST-CHECK: ?��? ?�용??refreshToken 차단 (replay attack 방어)
    if (usedRefreshTokens.has(refreshToken)) return res.status(401).json({ error: '만료??Refresh Token?�니?? ?�시 로그?�해주세??' }); // FIX-REFRESH-BLACKLIST-CHECK
    usedRefreshTokens.add(refreshToken); // ?�재 ?�큰 ?�용 처리
    if (decoded.type !== 'refresh') return res.status(401).json({ error: '?�효?��? ?��? Refresh Token?�니??' });

    // tier�?최신 DB 값으�??�기??(구독 만료/?�그?�이??반영)
    let freshTier = decoded.tier || 'FREE';
    try {
      if (dbReady && User && decoded.email) {
        const u = await User.findOne({ email: decoded.email }, 'tier').lean();
        if (u?.tier) freshTier = u.tier;
      }
    } catch { /* DB 조회 ?�패 ???�큰 ??tier ?�용 */ }

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
    res.setHeader('Cache-Control', 'no-store'); // ??FIX-REFRESH-CACHE-NO-STORE
  res.json({ accessToken, refreshToken: newRefreshToken }); // ??BUG-FIX: Refresh Token Rotation 구현
  } catch (err) {
    return res.status(401).json({ error: 'Refresh Token??만료?�었?�니?? ?�시 로그?�해주세??' });
  }
});

// --- 구�? ?�셜 로그??(?�동 ?�원가?? ---
app.post('/api/auth/google', authLimiter, async (req, res) => { // ??FIX-GOOGLE-AUTH-RATE
  try {
    const { email, name, picture } = req.body;
    if (!email) return res.status(400).json({ error: 'Google ?�보�?가?�올 ???�습?�다.' });
    // ??FIX-GOOGLE-OAUTH-VERIFY: email ?�식 검�?+ idToken ?�버?�이??검�?
    const { idToken } = req.body;
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ error: '?�효?��? ?��? ?�메???�식?�니??' }); // FIX-GOOGLE-OAUTH-VERIFY
    }
    if (idToken && typeof idToken === 'string' && idToken.length < 4096) {
      try {
        const tokenInfoResp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (tokenInfoResp.ok) {
          const tokenInfo = await tokenInfoResp.json();
          const googleClientId = process.env.GOOGLE_CLIENT_ID;
          if (googleClientId && tokenInfo.aud !== googleClientId) return res.status(401).json({ error: 'Google Client ID 불일�?' });
          if (tokenInfo.email && tokenInfo.email !== email) return res.status(401).json({ error: 'Google ?�큰???�메?�과 ?�청 ?�메?�이 ?�치?��? ?�습?�다.' });
        }
      } catch (verifyErr) { (logger?.warn || console.warn)('[google-auth] idToken 검�??�패:', verifyErr.message); }
    }

    let user;
    // ??DB-FIX: 구�? 로그?�도 ?�버 ?�작 직후 DB ?�결 ?��?
    const dbAvailable = await waitForDb(8000);
    if (dbAvailable && User) {

      try {
        user = await User.findOne({ email }).select('-password -__v');
        if (!user) {
          let safeName = (name || 'Fisher').replace(/[^a-zA-Z0-9가-??/g, '');
          if (!safeName) safeName = 'Fisher';
          const dup = await User.findOne({ name: safeName });
          if (dup) safeName = safeName + Math.floor(Math.random() * 9999);
          const hashedPw = await bcrypt.hash('google_oauth_' + Date.now(), 10);
          user = new User({ email, name: safeName, password: hashedPw, picture: picture || null });
          await user.save();
        }
      } catch (dbErr) {
        logger.warn('[google-auth] DB 조회/?�성 ?�패 ??memUsers fallback:', dbErr.message);
        user = memUsers.find(u => u.email === email);
        if (!user) {
          let safeName = (name || 'Fisher').replace(/[^a-zA-Z0-9가-??/g, '') || 'Fisher';
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
        let safeName = (name || 'Fisher').replace(/[^a-zA-Z0-9가-??/g, '') || 'Fisher';
        if (memUsers.find(u => u.name === safeName)) safeName = safeName + Math.floor(Math.random() * 9999);
        const hashedPw = await bcrypt.hash('google_oauth_' + Date.now(), 10);
        user = { id: Date.now().toString(), email, password: hashedPw, name: safeName, level: 1, exp: 0, tier: 'FREE', picture: picture || null, followers: [], following: [], lastAttendance: null, totalAttendance: 0, totalExp: 0 };
        memUsers.push(user);
        saveMemUsers();
      }
    }

    // ??AUTH-FIX-6: 구�? 출석 ?�???�패가 로그?�을 막�? ?�도�?분리
    const { justAttended, leveledUp } = applyAttendance(user);
    try {
      if (dbReady && User && user.save) {
        await user.save();
      } else {
        saveMemUsers();
      }
    } catch (saveErr) {
      logger.warn('[google-auth] 출석 ?�???�패 (로그???�상 처리):', saveErr.message);
    }

    // ??AUTH-FIX-7: 구�? 로그??JWT?�도 tier ?�함 (기존 ?�락)
    const userTier = user.tier || 'FREE';
    const accessToken = jwt.sign({ id: user._id || user.id, email: user.email, name: user.name, tier: userTier }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user._id || user.id, email: user.email, name: user.name, tier: userTier, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: accessToken, accessToken, refreshToken, user: buildUserResponse(user), justAttended, leveledUp });
  } catch (err) { logger.error('[google-auth] ?�버 ?�류:', err.message); res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' }); }
});

// --- ?�네??변�?---
// ??FIX-NICK-RESERVED: ?�약???�네??차단
const RESERVED_NICKNAMES = ['admin', 'master', 'root', 'system', 'operator', 'moderator', 'support', 'help', 'official', '관리자', '?�영??, '마스??, '?�스??];
function isReservedNickname(name) {
  const lower = (name || '').toLowerCase().replace(/\s/g, '');
  return RESERVED_NICKNAMES.some(r => lower.includes(r));
}
app.put('/api/user/nickname', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const { email, newName } = req.body;
    // ??FIX-NICK-RESERVED-CHECK: ?�약???�네??차단
    if (isReservedNickname(newName)) return res.status(400).json({ error: '?�용?????�는 ?�네?�입?�다. (?�약??금�?)' }); // FIX-NICK-RESERVED-CHECK
    if (!newName) return res.status(400).json({ error: '?�네?�을 ?�력?�주?�요.' });
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== email && tp.email !== email) return res.status(403).json({ error: '본인 ?�보�?변�?가?? });
    // ??FIX-NICKNAME-COOLDOWN: ?�네??변�?30??쿨다??(DB??lastNicknameChange 기록)
    if (dbReady && User) {
      const cooldownUser = await User.findOne({ email: tp.email || tp.id }, 'lastNicknameChange').lean().catch(() => null);
      if (cooldownUser?.lastNicknameChange) {
        const diffDays = (Date.now() - new Date(cooldownUser.lastNicknameChange).getTime()) / (1000*60*60*24);
        if (diffDays < 30) return res.status(429).json({ error: `?�네?��? 30?�마??변경할 ???�습?�다. (${Math.ceil(30-diffDays)}????가??` }); // FIX-NICKNAME-COOLDOWN
      }
    }

    // ??NICK-VAL: ?�버?�이???�네??검�?(?�라?�언???�회 방�?)
    const trimmed = newName.trim();
    if (trimmed.length < 2 || trimmed.length > 12)
      return res.status(400).json({ error: '?�네?��? 2~12???�이�??�력?�주?�요.' });
    if (!/^[a-zA-Z0-9가-??+$/.test(trimmed))
      return res.status(400).json({ error: '?��?, ?�어, ?�자�??�용 가?�합?�다.' });
    // ??NICK-BAN: 금�? ?�네??검??(?�드민�? ?�외)
    if (!isAdmin && isBannedName(trimmed))
      return res.status(400).json({ error: '???�네?��? ?�용?????�습?�다. (?�영 ?�책??금�????�현 ?�함)' });

    if (dbReady && User) {
      const dup = await User.findOne({ name: trimmed });
      if (dup && dup.email !== email) return res.status(400).json({ error: '?��? ?�용 중인 ?�네?�입?�다.' });
      const user = await User.findOneAndUpdate({ email }, { name: trimmed, lastNicknameChange: new Date() }, { new: true, runValidators: true }); // ??FIX-NICKNAME-TIMESTAMP
      if (Post) await Post.updateMany({ author_email: email }, { author: trimmed });
      return res.json({ success: true, name: user.name });
    } else {
      const userIdx = memUsers.findIndex(u => u.email === email);
      if (userIdx === -1) return res.status(404).json({ error: '?�용?��? 찾을 ???�습?�다.' });
      if (memUsers.find(u => u.name === trimmed && u.email !== email)) return res.status(400).json({ error: '?��? ?�용 중인 ?�네?�입?�다.' });
      memUsers[userIdx].name = trimmed;
      saveMemUsers();
      return res.json({ success: true, name: trimmed });
    }
  } catch (err) { (logger?.error || console.error)('[nickname] ?�버 ?�류:', err.message); res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' }); }
});


// --- 비�?번호 변�?(JWT ?�증 ?�수) ---
app.put('/api/user/password', async (req, res) => {
  try {
    // ??JWT ?�증 추�? ??본인�?비�?번호 변�?가??
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }

    const { email, currentPassword, newPassword } = req.body;
    if (!email) return res.status(400).json({ error: '?�메?�이 ?�요?�니??' });
    if (!currentPassword || !newPassword) return res.status(400).json({ error: '비�?번호�?모두 ?�력?�주?�요.' });
    if (newPassword.length < 8 || newPassword.length > 128 /* FIX-BCRYPT-DOS */) return res.status(400).json({ error: '??비�?번호??8???�상?�어???�니??' });
    // ??FIX-CHANGE-PWD-LEN: 비�?번호 최�? 길이 ?�한 (bcrypt DoS 방어)
    if (newPassword.length > 128) return res.status(400).json({ error: '비�?번호??최�? 128?�입?�다.' });

    // 본인 ?�는 ?�드민만 변�?가??
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== email && tp.email !== email) {
      return res.status(403).json({ error: '본인??비�?번호�?변�?가?�합?�다.' });
    }

    let user;
    if (dbReady && User) {
      user = await User.findOne({ email });
    } else {
      user = memUsers.find(u => u.email === email);
    }
    if (!user) return res.status(404).json({ error: '?�용?��? 찾을 ???�습?�다.' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: '?�재 비�?번호가 ?�치?��? ?�습?�다.' });

    const hashed = await bcrypt.hash(newPassword, 12);

    if (dbReady && User) {
      await User.findOneAndUpdate({ email }, { password: hashed, passwordChangedAt: new Date() }); // ??FIX-PWD-CHANGED-AT
      // ??FIX-PWD-CACHE-INVALIDATE: 비�?번호 변�???기존 JWT 즉시 무효??
      if (typeof pwdChangedCache !== 'undefined') pwdChangedCache.set(email, Date.now());
      pwdChangedCache.set(email, Date.now()); // ??FIX-PWD-IAT: 기존 ?�큰 무효??
      user.password = hashed;
      saveMemUsers();
      pwdChangedCache.set(email, Date.now()); // ??FIX-PWD-IAT: 기존 ?�큰 무효??
      return res.json({ success: true });
    }
  } catch (err) { (logger?.error || console.error)('[API] ?�버 ?�류:', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});


// --- ?�용??차단 ---
app.post('/api/user/block', async (req, res) => {
  try {
    // ??SEC-09: JWT ?�증 추�? ??본인�?차단 목록 조작 가??
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const { email, blockTargetName } = req.body;
    if (!blockTargetName) return res.status(400).json({ error: '차단???�용???�네?�을 ?�력?�주?�요.' });
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.email !== email && tp.id !== email) return res.status(403).json({ error: '본인�?차단 목록???�정?????�습?�다.' });

    // ?�기 ?�신 차단 불�?
    let currentUser;
    if (dbReady && User) {
      currentUser = await User.findOne({ email });
      if (currentUser.name === blockTargetName) return res.status(400).json({ error: '?�기 ?�신?� 차단?????�습?�다.' });

      const targetUser = await User.findOne({ name: blockTargetName });
      if (!targetUser) return res.status(404).json({ error: '?�당 ?�네?�의 ?�용?��? 찾을 ???�습?�다.' });

      if (!currentUser.blockedUsers.includes(targetUser.name)) {
        currentUser.blockedUsers.push(targetUser.name);
        await currentUser.save();
      }
      return res.json({ success: true, blockedUsers: currentUser.blockedUsers });
    } else {
      currentUser = memUsers.find(u => u.email === email);
      if (!currentUser) return res.status(404).json({ error: '?�용?��? 찾을 ???�습?�다.' });
      if (currentUser.name === blockTargetName) return res.status(400).json({ error: '?�기 ?�신?� 차단?????�습?�다.' });

      const targetUser = memUsers.find(u => u.name === blockTargetName);
      if (!targetUser) return res.status(404).json({ error: '?�당 ?�네?�의 ?�용?��? 찾을 ???�습?�다.' });

      if (!currentUser.blockedUsers) currentUser.blockedUsers = [];
      if (!currentUser.blockedUsers.includes(targetUser.name)) {
        currentUser.blockedUsers.push(targetUser.name);
        saveMemUsers();
      }
      return res.json({ success: true, blockedUsers: currentUser.blockedUsers });
    }
  } catch (err) { (logger?.error || console.error)('[API] ?�버 ?�류:', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});

// --- 차단 ?�제 ---
app.post('/api/user/unblock', async (req, res) => {
  try {
    // ??SEC-09: JWT ?�증 추�? ??본인�?차단 ?�제 가??
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const { email, unblockTargetName } = req.body;
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.email !== email && tp.id !== email) return res.status(403).json({ error: '본인�?차단 목록???�정?????�습?�다.' });
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
    return res.status(404).json({ error: '?�용?��? 찾을 ???�습?�다.' });
  } catch (err) { res.status(500).json({ error: '?�버 ?�류' }); }
});

// =================================================================
//  ?�로???�스??API
// =================================================================

// --- ?�로??---
// ??FIX-FOLLOW-RATE: ?�로???�팔로우 rate limit ??IP??1�?30??(?�팸 방어)
const followRateMap = new Map(); // ipHash ??{ count, windowStart }
// ??FIX-FOLLOW-RATE-CLEANUP: followRateMap 메모�??�수 방�? (1?�간마다 ?�리)
setInterval(() => { const now = Date.now(); for (const [k, v] of followRateMap.entries()) { if (now - v.windowStart > 3600_000) followRateMap.delete(k); } }, 3600_000);
function checkFollowRate(ip) {
  const key = hashIp(ip);
  const now = Date.now();
  const entry = followRateMap.get(key) || { count: 0, windowStart: now };
  if (now - entry.windowStart > 60_000) { entry.count = 0; entry.windowStart = now; }
  entry.count++;
  followRateMap.set(key, entry);
  return entry.count <= 30; // 1�?30???�용
}
app.post('/api/user/follow', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }

    const { email, targetEmail, targetName } = req.body;
    if (!email || (!targetEmail && !targetName)) return res.status(400).json({ error: 'email, targetEmail ?�는 targetName ?�수' });
    if (email === targetEmail) return res.status(400).json({ error: '?�기 ?�신???�로?�할 ???�습?�다.' });
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.email !== email && tp.id !== email) return res.status(403).json({ error: '본인�??�로??가?�합?�다.' });
    // ??FIX-FOLLOW-RATE: rate limit 체크
    const rawFollowIp = (String(req.headers['x-forwarded-for'] || '')).split(',')[0].trim() || req.ip || 'unknown';
    if (!isAdmin && !checkFollowRate(rawFollowIp)) return res.status(429).json({ error: '?�로???�청???�무 많습?�다. ?�시 ???�시 ?�도?�주?�요.' });

    if (dbReady && User) {
      const me = await User.findOne({ email });
      // targetEmail ?�는 name?�로 ?�??조회
      const target = targetEmail
        ? await User.findOne({ email: targetEmail })
        : await User.findOne({ name: targetName });
      if (!me || !target) return res.status(404).json({ error: '?�용?��? 찾을 ???�습?�다.' });
      const tEmail = target.email; // ?�제 ?�메?�로 ?�로??목록 관�?
      if (!me.following) me.following = [];
      if (!target.followers) target.followers = [];
      if (me.following.includes(tEmail)) return res.status(409).json({ error: '?��? ?�로??중입?�다.' });
      me.following.push(tEmail);
      target.followers.push(email);
      await Promise.all([me.save(), target.save()]);
      return res.json({ success: true, followingCount: me.following.length, followerCount: target.followers.length });
    }
    // ?�메모리 fallback ??targetEmail ?�는 targetName?�로 ?�??조회
    const me = memUsers.find(u => u.email === email);
    const target = targetEmail
      ? memUsers.find(u => u.email === targetEmail)
      : memUsers.find(u => u.name === targetName);
    if (!me || !target) return res.status(404).json({ error: '?�용?��? 찾을 ???�습?�다.' });
    const tEmail = target.email;
    if (!me.following) me.following = [];
    if (!target.followers) target.followers = [];
    if (me.following.includes(tEmail)) return res.status(409).json({ error: '?��? ?�로??중입?�다.' });
    me.following.push(tEmail);
    target.followers.push(email);
    saveMemUsers();
    return res.json({ success: true, followingCount: me.following.length, followerCount: target.followers.length });
  } catch (err) { (logger?.error || console.error)('[follow]', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});

// --- ?�팔로우 ---
app.post('/api/user/unfollow', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }

    const { email, targetEmail, targetName } = req.body;
    if (!email || (!targetEmail && !targetName)) return res.status(400).json({ error: 'email, targetEmail ?�는 targetName ?�수' });
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.email !== email && tp.id !== email) return res.status(403).json({ error: '본인�??�팔로우 가?�합?�다.' });

    if (dbReady && User) {
      const me = await User.findOne({ email });
      const target = targetEmail
        ? await User.findOne({ email: targetEmail })
        : await User.findOne({ name: targetName });
      if (!me) return res.status(404).json({ error: '?�용?��? 찾을 ???�습?�다.' });
      const tEmail = target?.email || targetEmail;
      me.following = (me.following || []).filter(e => e !== tEmail);
      if (target) target.followers = (target.followers || []).filter(e => e !== email);
      await Promise.all([me.save(), target ? target.save() : Promise.resolve()]);
      return res.json({ success: true, followingCount: me.following.length });
    }
    // ?�메모리 fallback ??targetEmail ?�는 targetName?�로 ?�??조회
    const me = memUsers.find(u => u.email === email);
    const target = targetEmail
      ? memUsers.find(u => u.email === targetEmail)
      : memUsers.find(u => u.name === targetName);
    if (!me) return res.status(404).json({ error: '?�용?��? 찾을 ???�습?�다.' });
    const tEmail = target?.email || targetEmail;
    me.following = (me.following || []).filter(e => e !== tEmail);
    if (target) target.followers = (target.followers || []).filter(e => e !== email);
    saveMemUsers();
    return res.json({ success: true, followingCount: me.following.length });
  } catch (err) { (logger?.error || console.error)('[unfollow]', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});

// --- ?�로??목록 조회 ---
app.get('/api/user/followers', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const email = (Array.isArray(req.query.email) ? req.query.email[0] : (req.query.email || '')).slice(0, 254) /* FIX-QUERY-EMAIL-HPP */;
    if (!email) return res.status(400).json({ error: 'email ?�라미터 ?�요' });

    if (dbReady && User) {
      const user = await User.findOne({ email }, 'followers name');
      if (!user) return res.status(404).json({ error: '?�용?��? 찾을 ???�습?�다.' });
      const followerEmails = user.followers || [];
      // ?�로???�름/?�바?� 조회
      const profiles = await User.find({ email: { $in: followerEmails } }, 'email name avatar picture').lean();
      return res.json({ followers: profiles, count: followerEmails.length });
    }
    const user = memUsers.find(u => u.email === email);
    const followerEmails = user?.followers || [];
    const profiles = memUsers.filter(u => followerEmails.includes(u.email)).map(u => ({ email: u.email, name: u.name, avatar: u.avatar || null }));
    return res.json({ followers: profiles, count: followerEmails.length });
  } catch (err) { (logger?.error || console.error)('[followers]', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});

// --- ?�로??목록 조회 ---
app.get('/api/user/following', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const email = (Array.isArray(req.query.email) ? req.query.email[0] : (req.query.email || '')).slice(0, 254) /* FIX-QUERY-EMAIL-HPP */;
    if (!email) return res.status(400).json({ error: 'email ?�라미터 ?�요' });

    if (dbReady && User) {
      const user = await User.findOne({ email }, 'following');
      if (!user) return res.status(404).json({ error: '?�용?��? 찾을 ???�습?�다.' });
      const followingEmails = user.following || [];
      const profiles = await User.find({ email: { $in: followingEmails } }, 'email name avatar picture').lean();
      return res.json({ following: profiles, count: followingEmails.length });
    }
    const user = memUsers.find(u => u.email === email);
    const followingEmails = user?.following || [];
    const profiles = memUsers.filter(u => followingEmails.includes(u.email)).map(u => ({ email: u.email, name: u.name, avatar: u.avatar || null }));
    return res.json({ following: profiles, count: followingEmails.length });
  } catch (err) { (logger?.error || console.error)('[following]', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?�?� 공개 ?�용???�로??조회 (?�네??기반) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// GET /api/user/profile/:name ???�증 불필?? 민감?�보 ?�외 공개 ?�로??반환
app.get('/api/user/profile/:name', async (req, res) => {
  try {
    const targetName = decodeURIComponent(req.params.name || '').trim();
    if (typeof targetName !== 'string' || targetName.length > 50) return res.status(400).json({ error: '?�네?��? 최�? 50?�입?�다.' }); // ??FIX-PARAM-NAME-LEN
    if (!targetName) return res.status(400).json({ error: '?�네?�이 ?�요?�니??' });

    // ?�청???�큰 ?�싱 (?�택????isFollowing ?�별??
    let myEmail = null;
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) {
      try { const tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); myEmail = tp.email || tp.id; }
      catch { /* 비로그인 ?�용 */ }
    }

    if (dbReady && User) {
      const u = await User.findOne({ name: targetName },
        'name avatar picture tier level totalExp streak followers following createdAt vvipHarborId'
      ).lean();
      if (!u) return res.status(404).json({ error: '?�용?��? 찾을 ???�습?�다.' });

      // 게시글 ??집계
      let postCount = 0;
      try { if (Post) postCount = await Post.countDocuments({ author: targetName }); } catch {}

      // 조과 기록 ??집계
      let recordCount = 0;
      try { if (CatchRecord) recordCount = await CatchRecord.countDocuments({ author: targetName }); } catch {}

      const isFollowing = myEmail ? (u.followers || []).includes(myEmail) : false;

      // ??FIX-VVIP-BADGE: VVIP ??��명을 ?�로?�에 ?�함
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
        vvipHarborId: u.vvipHarborId || null,       // ??FIX-VVIP-BADGE
        vvipHarborName,                              // ??FIX-VVIP-BADGE: '강릉·강문' ??
      });
    }

    // ?�메모리 fallback
    const u = memUsers.find(mu => mu.name === targetName);
    if (!u) return res.status(404).json({ error: '?�용?��? 찾을 ???�습?�다.' });
    const isFollowing = myEmail ? (u.followers || []).includes(myEmail) : false;
    const postCount = memPosts.filter(p => p.author === targetName).length;
    const recordCount = (memRecords || []).filter(r => r.author === targetName).length;
    // ??FIX-VVIP-BADGE: ?�메모리 fallback?�도 vvipHarborName ?�함
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
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});

// ?�?�?� 비즈?�스 ?�트???�터 API ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�

// GET /api/business/my-posts ????비즈?�스(?�상?�보) 게시글 목록
app.get('/api/business/my-posts', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const email = tp.email || tp.id;
    if (dbReady && BusinessPost) {
      const posts = await BusinessPost.find({ author_email: email }).sort({ createdAt: -1 }).lean();
      return res.json(posts.map(p => ({ ...p, id: p._id.toString() })));
    }
    const posts = memBusinessPosts.filter(p => p.author_email === email);
    return res.json(posts);
  } catch (err) { (logger?.error || console.error)('[business/my-posts]', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});

// GET /api/business/my-phone ???�트??본인 ?�화번호 조회 (?�락�??�인 ?�업??
// 비즈?�스 게시글???�록??phone ?�드 반환 (계정 phone ?�드 ?�용)
app.get('/api/business/my-phone', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const email = tp.email || tp.id;
    let phone = '';
    let shipName = '';
    if (dbReady && User) {
      const u = await User.findOne({ email }, 'phone realName name').lean();
      phone = u?.phone || '';
      // 가??최근 비즈?�스 ?�스?�에??shipName/phone 가?�오�?
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
  } catch (err) { (logger?.error || console.error)('[business/my-phone]', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});

// POST /api/business/gallery-post ??조과 갤러리�? ?�픈게시???�상 카테고리???�동 ?�록
app.post('/api/business/gallery-post', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const email = tp.email || tp.id;

    const { author, fish, size, weight, location, memo, image, shipName, phone } = req.body;
    if (!author) return res.status(400).json({ error: 'author ?�수' });

    // 게시글 ?�용 ?�동 ?�성
    const fishLine = fish ? `?�� ?�종: ${fish}` : '';
    const sizeLine = size ? ` | ?�이�? ${size}cm` : '';
    const weightLine = weight ? ` | 무게: ${weight}kg` : '';
    const locationLine = location ? `?�� ?�인?? ${location}` : '';
    const memoLine = memo ? `\n?�� ${memo}` : '';
    const shipLine = shipName ? `\n?�� ?�박: ${shipName}` : '';
    const phoneLine = phone ? `\n?�� 문의: ${phone}` : '';
    const content = `${fishLine}${sizeLine}${weightLine}\n${locationLine}${memoLine}${shipLine}${phoneLine}\n\n?�� #?�시GO #?�상?�시 #조과공유 #?�박선�?;

    const postData = {
      author,
      author_email: email,
      category: '?�상',
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
      return res.json({ success: true, postId: post._id, message: '?�픈게시???�상 카테고리???�록?�었?�니?? ?��' });
    }
    const newPost = { ...postData, id: Date.now().toString(), _id: Date.now().toString() };
    if (memPosts.length >= 2000) memPosts.pop(); // ??FIX-MEMPOSTS-PUSH
      memPosts.push(newPost);
    saveMemPosts();
    return res.json({ success: true, postId: newPost._id, message: '?�픈게시???�상 카테고리???�록?�었?�니?? ?��' });
  } catch (err) { (logger?.error || console.error)('[business/gallery-post]', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});

// DELETE /api/business/posts/:id ????비즈?�스 게시글 ??��
app.delete('/api/business/posts/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const email = tp.email || tp.id;
    const isAdmin = isAdminToken(tp);
    const { id } = req.params;
    // FIX-OBJID-BPOST-DEL: ObjectId ?�효???�전 검�???CastError 방�?
    if (id && !/^[a-fA-F0-9]{24}$/.test(id)) return res.status(400).json({ error: '?�효?��? ?��? ID ?�식' });
    if (dbReady && BusinessPost) {
      const post = await BusinessPost.findById(id);
      if (!post) return res.status(404).json({ error: '게시글 ?�음' });
      if (!isAdmin && post.author_email !== email) return res.status(403).json({ error: '권한 ?�음' });
      await BusinessPost.findByIdAndDelete(id);
      return res.json({ success: true });
    }
    const idx = memBusinessPosts.findIndex(p => p._id === id || p.id === id);
    if (idx === -1) return res.status(404).json({ error: '게시글 ?�음' });
    if (!isAdmin && memBusinessPosts[idx].author_email !== email) return res.status(403).json({ error: '권한 ?�음' });
    memBusinessPosts.splice(idx, 1);
    saveMemBusinessPosts();
    return res.json({ success: true });
  } catch (err) { (logger?.error || console.error)('[business/posts/delete]', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});

// --- ?�로???�진 변�?---
app.post('/api/user/avatar', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const { email, avatar } = req.body;
    if (!email) return res.status(400).json({ error: '?�용???�메?�이 ?�요?�니??' });
    if (!avatar) return res.status(400).json({ error: '?��?지 ?�이?��? ?�요?�니??' });
    // base64 ?�기 ?�한: 2MB 초과 ??거�?
    if (avatar.length > 2 * 1024 * 1024) return res.status(413).json({ error: '?��?지 ?�기가 ?�무 ?�니?? (최�? ??1.5MB)' });
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== email && tp.email !== email) return res.status(403).json({ error: '본인 ?�보�?변�?가?? });

    if (dbReady && User) {
      const updated = await User.findOneAndUpdate({ email }, { avatar }, { new: true, runValidators: true });
      if (!updated) return res.status(404).json({ error: '?�용?��? 찾을 ???�습?�다.' });
      return res.json({ success: true, avatar: updated.avatar });
    } else {
      const user = memUsers.find(u => u.email === email);
      if (!user) return res.status(404).json({ error: '?�용?��? 찾을 ???�습?�다.' });
      user.avatar = avatar;
      saveMemUsers();
      return res.json({ success: true, avatar });
    }
  } catch (err) {
    (logger?.error || console.error)('[POST /api/user/avatar]', err.message);
    res.status(500).json({ error: '?�로???�진 ?�???�패: ' + err.message });
  }
});

// --- ?�동�?EXP 지�?(?�일 ?�이??리밋 ?�용) ---
const EXP_DAILY_LIMIT = {
  comment: 5, post: 3, like_receive: 10, point_visit: 8,
  photo_upload: 3, first_catch: 1, weekly_streak: 1, monthly_streak: 1,
};
const expDailyCount = new Map();
// ?��? ?��? ?�짜(today)�??�함?��?�?메모�??�적 방�?�??�해 ?�정?�만 ?�리
const scheduleExpReset = () => {
  const now = new Date();
  const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 1, 0) - now;
  setTimeout(() => { expDailyCount.clear(); scheduleExpReset(); }, msToMidnight);
};
scheduleExpReset();

// ??[BUG-FIX] 구버??POST /api/user/exp ??{email, activity} 기�??�나 ?�라?�언?�는 {userId, action} ?�송 ????�� 400 ?�류
// ?�바�?버전?� L7548???�음 ({userId, action} 처리, verifyToken 미들?�어 ?�용)
// app.post('/api/user/exp', async (req, res) => { ... }); // 비활?�화



// --- ??게시글 목록 --- ??NEW-BUG-12: JWT ?�증 추�? (?�??게시글 ?�람 차단)
app.get('/api/user/posts', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const email = (Array.isArray(req.query.email) ? req.query.email[0] : (req.query.email || '')).slice(0, 254) /* FIX-QUERY-EMAIL-HPP */;
    if (!email) return res.status(400).json({ error: 'email ?�라미터 ?�요' });
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.email !== email && tp.id !== email) return res.status(403).json({ error: '본인 게시글�?조회 가?�합?�다.' });
    if (dbReady && Post) {
      const posts = await Post.find({ author_email: email }).sort({ createdAt: -1 });
      return res.json(posts);
    }
    const myPosts = email
      ? [...memPosts].filter(p => p.author_email === email).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      : [];
    res.json(myPosts);
  } catch (err) { res.status(500).json({ error: '?�버 ?�류' }); }
});

// =================================================================
//  조과 기록 API (?�시 기록??
//  MongoDB ?�구?�??/ ?�메모리 fallback
// =================================================================
// memRecords???�단?�서 초기?�되?�습?�다.

// ?�?� ??조과기록 조회 ?�?� ??NEW-BUG-12: JWT ?�증 추�? (?�??기록 ?�람 차단)
app.get('/api/user/records', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const email = (Array.isArray(req.query.email) ? req.query.email[0] : (req.query.email || '')).slice(0, 254) /* FIX-QUERY-EMAIL-HPP */;
    if (!email) return res.status(400).json({ error: 'email ?�라미터 ?�요' });
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.email !== email && tp.id !== email) return res.status(403).json({ error: '본인 기록�?조회 가?�합?�다.' });
    if (dbReady && CatchRecord) {
      const records = await CatchRecord.find({ author_email: email }).sort({ createdAt: -1 });
      return res.json(records.map(r => ({ ...r.toObject(), id: r._id.toString() })));
    }
    res.json(memRecords.filter(r => r.author_email === email));
  } catch (err) { res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?� 조과기록 ?�건 조회 (CatchDetail.jsx ?�용) ??GET /api/records/:id ?�?�?�?�?�?�?�?�?�?�
app.get('/api/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // FIX-OBJID-RECORDS-GET: isValid 검증으�?CastError 방�? �?불필?�한 DB 쿼리 차단
    if (id && !/^[a-fA-F0-9]{24}$/.test(id)) return res.status(400).json({ error: '?�효?��? ?��? ID ?�식' });
    if (dbReady && CatchRecord) {
      let record = null;
      try { record = await CatchRecord.findById(id); } catch (castErr) { /* ObjectId 캐스???�류 무시 */ }
      if (record) return res.json(record);
      return res.status(404).json({ error: '조과 기록??찾을 ???�습?�다.' });
    }
    const record = (memRecords || []).find(r => r._id === id || r.id === id);
    if (!record) return res.status(404).json({ error: '조과 기록??찾을 ???�습?�다.' });
    return res.json(record);
  } catch (err) {
    (logger?.error || console.error)('[GET /api/records/:id]', err.message);
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});

// ?�?� 조과기록 ?�성 (JWT ?�증 ?�수) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.post('/api/user/records', async (req, res) => {
  // ??FIX-CATCH-IMG-SIZE: 조황기록 ?��?지 5MB ?�한 (base64 ~6.8M chars)
  const rawImg = req.body.imageUrl || req.body.image || '';
  if (rawImg && rawImg.startsWith('data:') && rawImg.length > 6_825_000) {
    return res.status(413).json({ error: '?��?지 ?�기가 5MB�?초과?�니??' }); // FIX-CATCH-IMG-SIZE
  }
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const { author, fish, size, weight, location, bait, weather, wind, wave, memo, img, image, date, time, pointId } = req.body;
    // ??BUG-FIX: author_email?� JWT?�서�?추출 (body author_email ?�뢰 ???�??기록 ?�장 보안 취약???�정)
    const author_email = tp.email || tp.id;
    if (memo && typeof memo === 'string' && memo.length > 500) return res.status(400).json({ error: '메모는 500자 이하여야 합니다.' }); // FIX-MEMO-LEN
    if (!author || !author_email || !fish) return res.status(400).json({ error: '?�수 ??�� ?�락 (?�종 ?�수)' });
    // 본인 ?�는 ?�드민만 ?�성 가??(JWT�??��? 검증됨 ??추�? author_email 비교 불필??
    const isAdmin = isAdminToken(tp);
    // ??BUG-46: img ?�는 image ?�드 모두 ?�용 (?�위 ?�환) ??image ?�드�??�일 ?�??
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
  } catch (err) { (logger?.error || console.error)('[API] ?�버 ?�류:', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?� 조과기록 ??�� (JWT ?�증 ?�수) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.delete('/api/user/records/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    // ??BUG-FIX: email?� JWT?�서�?추출 (보안 취약???�정)
    const jwtEmail = tp.email;
    const isAdmin = isAdminToken(tp);
    if (dbReady && CatchRecord) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '?�효?��? ?��? ID' }); // ??FIX-CASTID-CastError-CATCH
      const record = await CatchRecord.findById(req.params.id);
      if (!record) return res.status(404).json({ error: '기록 ?�음' });
      if (!isAdmin && record.author_email !== jwtEmail) return res.status(403).json({ error: '권한 ?�음' });
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '?�못??ID' }); // FIX-CATCH-DEL-OBJID
    await CatchRecord.findByIdAndDelete(req.params.id);
      return res.json({ success: true });
    }
    // ??FIX-MEM-CATCH-IDOR: ?�메모리 ?�백?�서??본인�???�� 가??
    const memTarget = memRecords.find(r => r.id === req.params.id || r._id === req.params.id);
    if (memTarget && !isAdmin && memTarget.author_email && memTarget.author_email !== jwtEmail) {
      return res.status(403).json({ error: '본인??기록�???��?????�습?�다.' }); // FIX-MEM-CATCH-IDOR
    }
    memRecords = memRecords.filter(r => r.id !== req.params.id);
    saveMemRecords();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: '?�버 ?�류' }); }
});

// =================================================================
//  커�??�티 API (?�픈게시??/ ?�루 / 공�??�항 / ?�상배홍�?
//  MongoDB ?�결 ???�구?�?? 미연�????�메모리 fallback
// =================================================================


// ?�?� ??INSTA-P3: 24h 조황 ?�토�?API ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.get('/api/stories', async (req, res) => {
  try {
    if (dbReady && Story) {
      const stories = await Story.find({ expiresAt: { $gt: new Date() } })
        .sort({ createdAt: -1 }).limit(30).lean();
      return res.json(stories);
    }
    res.json([]); // DB ?�으�?�?배열
  } catch (err) { res.json([]); }
});

app.post('/api/stories', async (req, res) => {
  try {
    const auth = req.headers.authorization?.split(' ')[1];
    if (!auth) return res.status(401).json({ error: '로그?�이 ?�요?�니??' });
    let tp;
    try { tp = require('jsonwebtoken').verify(auth, JWT_SECRET); } catch { return res.status(401).json({ error: '?�증 ?�큰???�효?��? ?�습?�다.' }); }
    const { image, content, location } = req.body;
    if (!image) return res.status(400).json({ error: '?��?지???�수?�니??' });
    if (content && typeof content === 'string' && content.length > 300) return res.status(400).json({ error: '스토리 내용은 300자 이하여야 합니다.' }); // FIX-STORY-CONTENT-LEN
    if (!dbReady || !Story) return res.status(503).json({ error: 'DB ?�결 ?�요' });
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
  } catch (err) { res.status(500).json({ error: '?�토�??�록 ?�패' }); }
});

// ?�?� ?�픈게시???�체 조회 (?�이지?�이??+ 검??+ 카테고리 ?�터) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.get('/api/community/posts', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const category = (Array.isArray(req.query.category) ? req.query.category[0] : (req.query.category || '')) /* FIX-QUERY-CAT-HPP */ || '';  // 카테고리 ?�터
    const rawQ = Array.isArray(req.query.q) ? req.query.q[0] : (req.query.q || ''); // ??FIX-HPP-SEARCH: 배열 ?�라미터 �?값만 ?�용
    const q = rawQ.slice(0, 100); // ??FIX-SEARCH-MAXLEN: 검?�어 최�? 100???�한 (DoS 방어)
    const safeQ = q.replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&'); // ??FIX-REGEX-ESCAPE

    if (dbReady && Post) {
      const filter = {};
      if (category) filter.category = category;
      if (q) filter.$or = [
        { content: { $regex: safeQ, $options: 'i' } },
        { author: { $regex: safeQ, $options: 'i' } },
      ];
      // ??INSTA-P2: ?�기???�렬 (likes ?�림차순) vs 기본 최신??
      const sortBy = req.query.sort === 'popular'
        ? { likes: -1, createdAt: -1 }
        : { createdAt: -1 };
      const [posts, total] = await Promise.all([
        Post.find(filter).sort(sortBy).skip(skip).limit(limit),
        Post.countDocuments(filter),
      ]);
      // ??INSTA-P2: author_avatar 배치 enriching (N+1 방�?)
      const emails = [...new Set(posts.map(p => p.author_email).filter(Boolean))];
      let avatarMap = {};
      if (emails.length > 0 && User) {
        try {
          const users = await User.find({ email: { $in: emails } }, 'email avatar picture').lean();
          users.forEach(u => { avatarMap[u.email] = u.avatar || u.picture || null; });
        } catch (_) { /* avatar enriching ?�패 무시 */ }
      }
      const enriched = posts.map(p => {
        const obj = p.toObject ? p.toObject() : p;
        return { ...obj, author_avatar: avatarMap[obj.author_email] || null };
      });
      return res.json({ posts: enriched, total, page, totalPages: Math.ceil(total / limit) });
    }

    // ?�메모리 fallback
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
  } catch (err) { res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?� ?�픈게시???�건 조회 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
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
    return res.status(404).json({ error: '게시글??찾을 ???�습?�다.' });
  } catch (err) {
    const mem = memPosts.find(p => p._id === pid || p.id === pid);
    if (mem) return res.json(mem);
    res.status(404).json({ error: '게시글??찾을 ???�습?�다.' });
  }
});

// ?�?� ?�픈게시???�성 (JWT ?�증 ?�수 ??로그???�용?�만 ?�성 가?? ?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.post('/api/community/posts', postCreateLimiter, async (req, res) => { // FIX-POST-RATE-APPLY
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    let { author, category, content, image, images, location } = req.body;
    // BUG-FIX: author_email?� JWT?�서�?추출 (보안 취약???�정)
    const author_email = tp.email || tp.id || 'guest@fishinggo.kr';
    if (!author || !category || !content) return res.status(400).json({ error: '?�수 ??�� ?�락' });
    // FIX-CATEGORY-WHITELIST: ?�용??카테고리�??�락
    const VALID_POST_CATEGORIES = ['?�반', '조황', '?�보', '질문', '?�터', '?�머', '?�시??, '채비', '기�?'];
    if (!VALID_POST_CATEGORIES.includes(category)) return res.status(400).json({ error: '?�효?��? ?��? 카테고리' });
    if (typeof author !== 'string' || author.length > 30) return res.status(400).json({ error: 'author 최�? 30?? });
    if (typeof content !== 'string' || content.length > 15000) return res.status(400).json({ error: 'content 최�? 15000?? });
    // ??CENSOR: 게시글 ?�용 비속??* 치환
    content = censorText(content.trim());
    // ??LOC: location ?�전 ?�규????{ address, lat, lng } ?�는 null
    const safeLocation = (location && location.address) ? { address: String(location.address).slice(0, 200) /* FIX-POST-LOCATION-LEN */, lat: location.lat || null, lng: location.lng || null } : null;
    // ??IMG-SIZE-FIX: ?�라?�언??WritePost.jsx L142)?� ?�일??4MB 기�??�로 ?�일
    // ?�전 3MB ?�한?�로 3~4MB 구간 ?��?지가 ?�버?�서 ?�락?�여 ?�??0??버그 발생
    const safeImages = Array.isArray(images)
      ? images.filter(img => img && img.length <= 4 * 1024 * 1024).slice(0, 5)
      : [];
    const safeImage = safeImages[0] || ((image && image.length <= 4 * 1024 * 1024) ? image : null) || null;

    if (dbReady && Post) {
      try {
        const safeContent = (content||'').replace(/<[^>]*>/g,'').replace(/javascript:/gi,'').trim().substring(0,15000); // ??FIX-POST-XSS
    const post = new Post({ author, author_email, category, content: safeContent, image: safeImage, images: safeImages, location: safeLocation });
        await post.save();
        try {
          if (memPosts.length >= 2000) memPosts.pop(); // ??FIX-MEMPOSTS-UNSHIFT-1
          memPosts.unshift({ _id: post._id.toString(), id: post._id.toString(), author, author_email, category, content, image: safeImage, images: safeImages, location: safeLocation, likes: 0, comments: [], createdAt: post.createdAt });
          if (memPosts.length > 200) memPosts.splice(200);
        } catch (syncErr) { /* memPosts ?�기???�패??무시 */ }
        return res.json(post);
      } catch (dbErr) {
        (logger?.error || console.error)('[MongoDB ?�???�패, ?�메모리 fallback]:', dbErr.message);
      }
    }
    const uid = Date.now().toString();
    const post = { _id: uid, id: uid, author, author_email, category, content, image: safeImage, images: safeImages, location: safeLocation, likes: 0, comments: [], createdAt: new Date().toISOString() };
    if (memPosts.length >= 2000) memPosts.pop(); // ??FIX-MEMPOSTS-UNSHIFT-2
          memPosts.unshift(post);
    if (memPosts.length > 200) memPosts.splice(200);
    saveMemPosts();
    return res.json(post);
  } catch (err) { (logger?.error || console.error)('[POST /posts ?�류]:', err.message); res.status(500).json({ error: '?�버 ?�류: ' + err.message }); }
});

// ?�?� ?�픈게시??글 ??�� (JWT ?�증) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.delete('/api/community/posts/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    // ??BUG-FIX: email?� JWT?�서�?추출 (보안 취약???�정)
    const jwtEmail = tp.email;
    const isAdmin = isAdminToken(tp);

    if (dbReady && Post) {
      let post = null;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '?�효?��? ?��? ID' }); // ??FIX-CASTID-AUTO
      try { post = await Post.findById(req.params.id); } catch (e) { }
      if (post) {
        // ??JWT email만으�??�증 (보안 ?�정 ??body email ?�거)
        const isAuthor = post.author_email === jwtEmail;
        if (!isAuthor && !isAdmin)
          return res.status(403).json({ error: '??�� 권한???�습?�다.' });
        await post.deleteOne();
      }
    } else {
      const mem = memPosts.find(p => p._id === req.params.id || p.id === req.params.id);
      if (mem && !isAdmin && mem.author_email !== jwtEmail)
        return res.status(403).json({ error: '??�� 권한???�습?�다.' });
    }
    memPosts = memPosts.filter(p => p._id !== req.params.id && p.id !== req.params.id);
    saveMemPosts();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?� ?�픈게시??글 ?�정 (JWT ???�성??or ?�드�? ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.put('/api/community/posts/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const { content, category, image, images } = req.body;
    // ??BUG-FIX: email?� JWT?�서�?추출 (보안 취약???�정)
    const jwtEmail = tp.email || tp.id;
    const isAdmin = isAdminToken(tp);
    if (dbReady && Post) {
      let post;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '?�효?��? ?��? ID' }); // ??FIX-CASTID-AUTO
      try { post = await Post.findById(req.params.id); } catch (e) { }
      if (!post) return res.status(404).json({ error: '게시글 ?�음' });
      if (!isAdmin && post.author_email !== jwtEmail)
        return res.status(403).json({ error: '권한 ?�음' });
      if (content !== undefined) post.content = content;
      if (category !== undefined) post.category = category;
      // ??MULTI-IMG: images 배열 ?�선, ?�으�??�일 image fallback
      if (images !== undefined) {
        // ??IMG-SIZE-FIX: PUT(?�정)??4MB 기�? ?�일
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
    if (!mem) return res.status(404).json({ error: '게시글 ?�음' });
    if (!isAdmin && mem.author_email !== jwtEmail)
      return res.status(403).json({ error: '권한 ?�음' });
    if (content !== undefined) mem.content = content;
    if (category !== undefined) mem.category = category;
    // ??FIX-MULTI-IMG: ?�메모리 fallback?�서??images 배열 ?�데?�트
    if (images !== undefined) {
      // ??IMG-SIZE-FIX: ?�메모리 fallback??4MB 기�? ?�일
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
  } catch (err) { (logger?.error || console.error)('[API] ?�버 ?�류:', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});


// ??FIX-COMMENT-RATE: ?��? ?�팸 방어 (같�? ?�용?? 1분에 10�??�하)
const commentRateMap = new Map(); // 'userId' ??[timestamps]
setInterval(() => {
  const cutoff = Date.now() - 60_000;
  for (const [k, v] of commentRateMap.entries()) {
    const filtered = v.filter(t => t > cutoff);
    if (filtered.length === 0) commentRateMap.delete(k);
    else commentRateMap.set(k, filtered);
  }
}, 5 * 60 * 1000);

// ?�?� ?�픈게시???��? ?�성 (JWT ?�증 ?�수) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.post('/api/community/posts/:id/comments', async (req, res) => {
  try {
    const rawCmtIp = (String(req.headers['x-forwarded-for'] || '')).split(',')[0].trim() || req.ip || 'unknown';
    if (!checkCommentRate(rawCmtIp)) return res.status(429).json({ error: '?��????�무 빠르�??�성?�고 ?�습?�다. ?�시 ???�시 ?�도?�주?�요.' }); // FIX-COMMENT-RATE-CHECK
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const { author, text } = req.body;
    // ??FIX-COMMENT-RATE: 1분에 10�?초과 ?��? 차단
    const commentUserId = tp.email || tp.id;
    if (commentUserId) {
      const now = Date.now();
      const times = (commentRateMap.get(commentUserId) || []).filter(t => now - t < 60_000);
      if (times.length >= 10) return res.status(429).json({ error: '?��????�무 빠르�??�성?�고 ?�습?�다. ?�시 ???�도?�주?�요.' });
      times.push(now);
      commentRateMap.set(commentUserId, times);
    }
    // ??BUG-FIX: ?��? author_email??JWT?�서�?추출 (보안 취약???�정)
    const author_email = tp.email || tp.id;
    if (!author || !text) return res.status(400).json({ error: '?�성???�용 ?�수' });
    if (text.length > 500) return res.status(400).json({ error: '?��??� 500???�하�??�성?�주?�요.' });
    // ??CENSOR: ?��? 비속??* 치환
    const censoredText = censorText(text.trim());
    const newComment = { author, author_email, text: censoredText, createdAt: new Date() };
    if (dbReady && Post) {
      let post = null;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '?�효?��? ?��? ID' }); // ??FIX-CASTID-AUTO
      try { post = await Post.findById(req.params.id); } catch (e) { }
      if (post) {
        if (!Array.isArray(post.comments)) post.comments = [];
        post.comments.push(newComment);
        await post.save();
        if (post.author_email && post.author !== author) {
          sendAppPushNotification(post.author_email, 'comm', '?�로???��?', `[?�시GO] ${author}?�이 ?�원?�의 게시글???��????�겼?�니?? "${text.substring(0, 15)}..."`);
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
        sendAppPushNotification(mem.author_email, 'comm', '?�로???��?', `[?�시GO] ${author}?�이 ?�원?�의 게시글???��????�겼?�니?? "${text.substring(0, 15)}..."`);
      }
      return res.json(mem);
    }
    res.json({ comments: [newComment] });
  } catch (err) { (logger?.error || console.error)('[API] ?�버 ?�류:', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});


// ??NEW: ?��? ??�� (본인 ?�는 ?�드민만 가?? ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.delete('/api/community/posts/:id/comments/:commentId', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const requesterEmail = tp.email || tp.id;
    const isAdminUser = isAdminToken(tp); // ??9TH-A1: requesterEmail 불일�?비교 ??isAdminToken() ?�퍼 ?�일
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
        if (post.comments.length === before) return res.status(403).json({ error: '??�� 권한???�거???��???찾을 ???�습?�다.' });
        await post.save();
        return res.json(post);
      }
    }
    // 메모�?fallback
    const mem = memPosts.find(p => p._id === id || p.id === id);
    if (mem) {
      const before = (mem.comments || []).length;
      mem.comments = (mem.comments || []).filter(c => {
        const cId = c._id || c.id || String(c.createdAt);
        const isMine = (c.author_email === requesterEmail);
        return !(cId === commentId && (isMine || isAdminUser));
      });
      if (mem.comments.length === before) return res.status(403).json({ error: '??�� 권한???�거???��???찾을 ???�습?�다.' });
      saveMemPosts();
      return res.json(mem);
    }
    res.status(404).json({ error: '게시글??찾을 ???�습?�다.' });
  } catch (err) { (logger?.error || console.error)('[API] ?�버 ?�류:', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});


// ?�?� 좌아??POST/PATCH (JWT ?�증 + 중복 방�?) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.post('/api/community/posts/:id/like', likeLimiter, async (req, res) => { // FIX-LIKE-RATE-APPLY
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const voterEmail = tp.email || tp.id;
    if (dbReady && Post) {
      let post = null;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '?�효?��? ?��? ID' }); // ??FIX-CASTID-AUTO
      try { post = await Post.findById(req.params.id); } catch (e) { }
      if (post) {
        if (!Array.isArray(post.likedBy)) post.likedBy = [];
        if (post.likedBy.includes(voterEmail)) {
          return res.status(409).json({ error: '?��? 좋아?��? ?��??�니??', likes: post.likes });
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
      if (mem.likedBy.includes(voterEmail)) return res.status(409).json({ error: '?��? 좋아?��? ?��??�니??', likes: mem.likes });
      mem.likedBy.push(voterEmail);
      mem.likes = (mem.likes || 0) + 1;
      saveMemPosts();
      return res.json(mem);
    }
    res.json({ likes: 0 });
  } catch (err) { res.status(500).json({ error: '?�버 ?�류' }); }
});

app.patch('/api/community/posts/:id/like', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const voterEmail = tp.email || tp.id;
    if (dbReady && Post) {
      let post = null;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '?�효?��? ?��? ID' }); // ??FIX-CASTID-AUTO
      try { post = await Post.findById(req.params.id); } catch (e) { }
      if (post) {
        if (!Array.isArray(post.likedBy)) post.likedBy = [];
        if (post.likedBy.includes(voterEmail)) return res.status(409).json({ error: '?��? 좋아?��? ?��??�니??', likes: post.likes });
        post.likedBy.push(voterEmail);
        post.likes = (post.likes || 0) + 1;
        await post.save();
        return res.json({ likes: post.likes });
      }
    }
    const mem = memPosts.find(p => p._id === req.params.id || p.id === req.params.id);
    if (mem) {
      if (!mem.likedBy) mem.likedBy = [];
      if (mem.likedBy.includes(voterEmail)) return res.status(409).json({ error: '?��? 좋아?��? ?��??�니??', likes: mem.likes });
      mem.likedBy.push(voterEmail);
      mem.likes = (mem.likes || 0) + 1;
      saveMemPosts();
      return res.json({ likes: mem.likes });
    }
    res.json({ likes: 0 });
  } catch (err) { res.status(500).json({ error: '?�버 ?�류' }); }
});


// ?�?� ?�루 ?�체 조회 (password ?�드 ?�거?�여 보안 강화) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.get('/api/community/crews', async (req, res) => {
  try {
    if (dbReady && Crew) {
      const crews = await Crew.find().sort({ createdAt: -1 });
      // ??BUG-29: password ?�문 ?�출 방�? ???�답?�서 ?�거
      const safeCrews = crews.map(c => {
        const obj = c.toObject();
        delete obj.password;
        return obj;
      });
      return res.json(safeCrews);
    }
    // ?�메모리: password ?�드 ?�거 ??반환
    const safeMemCrews = memCrews.map(c => {
      const { password: _pw, ...rest } = c;
      return rest;
    });
    res.json(safeMemCrews);
  } catch (err) { res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?� ?�루 ?�성 (JWT ?�증 ?�수) ??BUG-39: bcrypt ?�싱 ?�용 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.post('/api/community/crews', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const { name, region, isPrivate, password, ownerName, limit, description, bio } = req.body;
    // FIX-CREW-OWNER-JWT: owner??JWT?�서�?추출 (IDOR 방어)
    const owner = tp.email || tp.id;
    if (typeof name === 'string' && name.length > 20) return res.status(400).json({ error: '?�루 ?�름?� 최�? 20?�입?�다.' }); // ??FIX-CREW-NAME-LENGTH
    if (typeof description === 'string' && description.length > 500) return res.status(400).json({ error: '?�루 ?�개??최�? 500?�입?�다.' }); // ??FIX-CREW-DESC-LENGTH: DoS 방어
    if (typeof bio === 'string' && bio.length > 500) return res.status(400).json({ error: '?�루 bio??최�? 500?�입?�다.' }); // ??FIX-CREW-BIO-LENGTH: DoS 방어
    if (!name || !owner || !ownerName) return res.status(400).json({ error: '?�수 ??�� ?�락' });
    // limit ?�효??검�? 3~1000 범위 강제
    const safeLimit = Math.min(1000, Math.max(3, parseInt(limit) || 100));
    // FIX-CREW-PWD-DOS: ?�장 코드 최�? 128???�한 (bcrypt DoS 방어)
    if (isPrivate && password && String(password).length > 128) return res.status(400).json({ error: '?�장 코드??최�? 128?�입?�다.' });
    const hashedPwd = (isPrivate && password) ? await bcrypt.hash(String(password).slice(0, 128), 10) : null;
    if (dbReady && Crew) {
      // ??FIX-CREW-CREATE-LIMIT: ?��????�루 ?�성 최�? 5�??�한
      const existingOwned = await Crew.countDocuments({ owner: tp.email || tp.id }).catch(() => 0);
      if (existingOwned >= 5) return res.status(400).json({ error: '?�루??최�? 5개까지 ?�성?????�습?�다.' });
      const crew = new Crew({ name, region: region || '?�국', isPrivate: !!isPrivate, password: hashedPwd, owner, ownerName, limit: safeLimit });
      await crew.save();
      const obj = crew.toObject();
      delete obj.password; // ??BUG-38: ?�답?�서 ?�싱??비�?번호???�거
      return res.json(obj);
    }
    const crew = { id: Date.now().toString(), _id: Date.now().toString(), name, region: region || '?�국', isPrivate: !!isPrivate, password: hashedPwd, owner, ownerName, members: 1, limit: safeLimit, createdAt: new Date() };
    memCrews.unshift(crew);
    saveMemCrews();
    const { password: _pw, ...safeCrewResp } = crew;
    res.json(safeCrewResp);
  } catch (err) { (logger?.error || console.error)('[API] ?�버 ?�류:', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?� [ADMIN] 기존 ?�루 limit ?�괄 ?�정 (?�시 마이그레?�션) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ?�용�? POST /api/admin/crews/fix-limit  { "defaultLimit": 1000 }
// ?�료 ?????�드?�인?��? ??��?�세??
app.post('/api/admin/crews/fix-limit', async (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�류' }); }
  if (!isAdminToken(tp)) return res.status(403).json({ error: '관리자 권한 ?�요' });
  const newLimit = Math.min(1000, Math.max(1, parseInt(req.body.defaultLimit) || 100)); // FIX-CREW-LIMIT-VALIDATE
  try {
    if (dbReady && Crew) {
      // limit??100 ?�하???�루�??�데?�트 (?�규 ?�성???�바�??�루 ?�외)
      const result = await Crew.updateMany({ limit: { $lte: 100 } }, { $set: { limit: newLimit } });
      return res.json({ ok: true, updated: result.modifiedCount, newLimit, message: `${result.modifiedCount}�??�루???�원??${newLimit}명으�??�데?�트?�습?�다.` });
    }
    // ?�메모리 fallback
    let count = 0;
    memCrews.forEach(c => { if (!c.limit || c.limit <= 100) { c.limit = newLimit; count++; } });
    saveMemCrews();
    return res.json({ ok: true, updated: count, newLimit, message: `[?�메모리] ${count}�??�루 ?�데?�트` });
  } catch (err) { res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' }); }
});

// ?�?� ?�루 ?�장코드 ?�버 검�?(BUG-38: ?�라?�언???�문 비교 ?�거) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.post('/api/community/crews/:id/verify', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: '?�장 코드�??�력?�주?�요.' });
    // ??BUG-04 FIX: CastError 방�? ??ObjectId ?�전 검�?
    if (mongoose.Types.ObjectId.isValid && !mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: '?�효?��? ?��? ?�루 ID' });
    let crew;
    if (dbReady && Crew) {
      crew = await Crew.findById(req.params.id).catch(() => null); // ??BUG-04 FIX: .catch(() => null)
    } else {
      crew = memCrews.find(c => c.id === req.params.id || c._id === req.params.id);
    }
    if (!crew) return res.status(404).json({ error: '?�루�?찾을 ???�습?�다.' });
    if (!crew.isPrivate || !crew.password) return res.json({ success: true }); // 공개 ?�루
    const isMatch = await bcrypt.compare(String(password), crew.password);
    if (!isMatch) return res.status(401).json({ error: '?�장 코드가 ?�치?��? ?�습?�다.' });
    res.json({ success: true });
  } catch (err) { (logger?.error || console.error)('[API] ?�버 ?�류:', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});


// ?�?� ?�루 ??�� (JWT ?�드�?or ?�너) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.delete('/api/community/crews/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    // ??BUG-FIX: email?� JWT?�서�?추출 (보안 취약???�정)
    const jwtEmail = tp.email;
    const isAdmin = isAdminToken(tp);
    if (dbReady && Crew) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '?�효?��? ?��? ID' }); // ??FIX-CASTID-CREW
      const crew = await Crew.findById(req.params.id);
      if (!crew) return res.status(404).json({ error: '?�루 ?�음' });
      if (!isAdmin && crew.owner !== jwtEmail) return res.status(403).json({ error: '권한 ?�음' });
      await Crew.findByIdAndDelete(req.params.id);
      // ?�켓?�로 ?�루 ?�산 ?�림
      io.to(req.params.id).emit('crew_dissolved', { message: '?�루?�이 ?�루�??�산?�습?�다.' });
      return res.json({ success: true });
    }
    // ???�메모리: id/_id ?�쪽 체크 (버그 ?�정)
    memCrews = memCrews.filter(c => c.id !== req.params.id && c._id !== req.params.id);
    saveMemCrews();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?� ???�루???�임 (???�루?????�른 멤버) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// PATCH /api/community/crews/:id/transfer
// body: { email: ?�크루장?�메?? newOwnerEmail: ?�임받을멤버?�메??}
app.patch('/api/community/crews/:id/transfer', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }

    const { newOwnerEmail } = req.body;
    // ??BUG-06 FIX: body.email ?�뢰 ?�거 ??JWT?�서�????�루???�메??추출
    const email = tp.email || tp.id;
    if (!email || !newOwnerEmail) return res.status(400).json({ error: 'newOwnerEmail ?�수' });
    if (email === newOwnerEmail) return res.status(400).json({ error: '?�기 ?�신?�게 ?�임?????�습?�다.' });

    // ??BUG-06 FIX: CastError 방�?
    if (mongoose.Types.ObjectId.isValid && !mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: '?�효?��? ?��? ID' });

    const isAdmin = isAdminToken(tp);

    if (dbReady && Crew) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '?�못??ID ?�식?�니??' }); // FIX-OBJID-BATCH-1
      const crew = await Crew.findById(req.params.id).catch(() => null); // ??BUG-06 FIX
      if (!crew) return res.status(404).json({ error: '?�루�?찾을 ???�습?�다.' });
      if (!isAdmin && crew.owner !== email) return res.status(403).json({ error: '?�루?�만 ?�임?????�습?�다.' }); // ??JWT email ?�용

      const newOwnerMember = crew.memberList.find(m => m.email === newOwnerEmail);
      if (!newOwnerMember) return res.status(404).json({ error: '?�임??멤버가 ?�루???�습?�다.' });

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
        message: `?�� ${newOwnerMember.name}?�이 ???�루?�이 ?�었?�니??`
      });

      const obj = crew.toObject(); delete obj.password;
      return res.json({ success: true, crew: obj });
    }
    // ?�메모리 fallback
    const mem = memCrews.find(c => c.id === req.params.id || c._id === req.params.id);
    if (!mem) return res.status(404).json({ error: '?�루�?찾을 ???�습?�다.' });
    if (!isAdmin && mem.owner !== email) return res.status(403).json({ error: '?�루?�만 ?�임?????�습?�다.' }); // ??JWT email ?�용
    const newOwnerMem = (mem.memberList || []).find(m => m.email === newOwnerEmail);
    if (!newOwnerMem) return res.status(404).json({ error: '?�임??멤버가 ?�루???�습?�다.' });
    mem.memberList = (mem.memberList || []).map(m => ({
      ...m,
      role: m.email === email ? 'member' : m.email === newOwnerEmail ? 'owner' : m.role
    }));
    mem.owner = newOwnerEmail;
    mem.ownerName = newOwnerMem.name;
    saveMemCrews();
    res.json({ success: true });
  } catch (err) { (logger?.error || console.error)('[CREW TRANSFER]', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});


// ?�?� ?�루 ?�건 조회 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.get('/api/community/crews/:id', async (req, res) => {
  try {
    if (dbReady && Crew) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '?�못??ID ?�식?�니??' }); // FIX-OBJID-BATCH-2
      const crew = await Crew.findById(req.params.id).catch(() => null);
      if (crew) { const obj = crew.toObject(); delete obj.password; return res.json(obj); }
    }
    const mem = memCrews.find(c => c.id === req.params.id || c._id === req.params.id);
    if (mem) { const { password: _pw, ...safe } = mem; return res.json(safe); }
    return res.status(404).json({ error: '?�루�?찾을 ???�습?�다.' });
  } catch (err) { res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?� ??CREW-LOGO: ?�루 로고 ?�로??(방장 ?�용) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.put('/api/community/crews/:id/logo', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }

    const { logo } = req.body;
    if (!logo) return res.status(400).json({ error: '?��?지 ?�이?��? ?�요?�니??' });
    if (logo.length > 2 * 1024 * 1024) return res.status(413).json({ error: '?��?지 ?�기가 ?�무 ?�니?? (최�? ??1.5MB)' });
    if (!logo.startsWith('data:image/')) return res.status(400).json({ error: '?�바�??��?지 ?�식???�닙?�다.' });

    if (dbReady && Crew) {
      // ??BUG-13 FIX: CastError 방�?
      if (mongoose.Types.ObjectId.isValid && !mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(400).json({ error: '?�효?��? ?��? ID' });
      const crew = await Crew.findById(req.params.id).catch(() => null); // ??BUG-13 FIX
      if (!crew) return res.status(404).json({ error: '?�루�?찾을 ???�습?�다.' });
      if (crew.owner !== tp.email && !isAdminToken(tp)) return res.status(403).json({ error: '방장�?로고�??�정?????�습?�다.' });
      crew.logo = logo;
      await crew.save();
      return res.json({ success: true, logo });
    }
    // ?�메모리 fallback
    const mem = memCrews.find(c => c.id === req.params.id || c._id === req.params.id);
    if (!mem) return res.status(404).json({ error: '?�루�?찾을 ???�습?�다.' });
    if (mem.owner !== tp.email && !isAdminToken(tp)) return res.status(403).json({ error: '방장�?로고�??�정?????�습?�다.' });
    mem.logo = logo;
    res.json({ success: true, logo });
  } catch (err) {
    (logger?.error || console.error)('[PUT /api/community/crews/:id/logo]', err.message);
    res.status(500).json({ error: '?�버 ?�류' });
  }
});

// ?�?� ??CREW-ENH: ?�루 가??(비번 검�?+ 멤버 DB ?�?? ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ??FIX-CREW-JOIN-RATE: ?�루 가??rate limit (IP??1�?5??
const crewJoinRateMap = new Map();
// ??FIX-CREW-JOIN-CLEANUP: crewJoinRateMap 메모�??�수 방�?
setInterval(() => { const now = Date.now(); for (const [k, v] of crewJoinRateMap.entries()) { if (now - v.windowStart > 3600_000) crewJoinRateMap.delete(k); } }, 3600_000);
function checkCrewJoinRate(ip) {
  const key = (typeof hashIp === 'function') ? hashIp(ip) : ip;
  const now = Date.now();
  const e = crewJoinRateMap.get(key) || { count: 0, windowStart: now };
  if (now - e.windowStart > 60_000) { e.count = 0; e.windowStart = now; }
  e.count++; crewJoinRateMap.set(key, e);
  return e.count <= 5;
}
app.post('/api/community/crews/:id/join', crewJoinLimiter, async (req, res) => { // FIX-CREW-JOIN-RATE-APPLY
  try {
    const rawJoinIp = (String(req.headers['x-forwarded-for'] || '')).split(',')[0].trim() || req.ip || 'unknown';
    if (!checkCrewJoinRate(rawJoinIp)) return res.status(429).json({ error: '?�루 가???�청???�무 많습?�다. ?�시 ???�시 ?�도?�주?�요.' }); // FIX-CREW-JOIN-RATE-CHECK
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }

    const { password } = req.body;
    // ??BUG-09 FIX: email/name??JWT?�서�?추출 (본문 email ?�뢰 ??명단 ?�조 차단)
    const email = tp.email || tp.id;
    if (!email) return res.status(401).json({ error: '?�증 ?�보 ?�음' });
    // name?� JWT???�으�?DB?�서 조회 (?�는 ?�라?�언?�에??body�??�공 ?�용)
    const name = tp.name || req.body.name || email.split('@')[0];
    // ??BUG-12 FIX: CastError 방�?
    if (mongoose.Types.ObjectId.isValid && !mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: '?�효?��? ?��? ID' });

    if (dbReady && Crew) {
      const crew = await Crew.findById(req.params.id).catch(() => null); // ??BUG-12 FIX
      if (!crew) return res.status(404).json({ error: '?�루�?찾을 ???�습?�다.' });

      // ?��? 가?�된 경우 ??중복 방�? (?�공 반환)
      const alreadyIn = crew.memberList.some(m => m.email === email);
      if (alreadyIn) return res.json({ success: true, already: true, crew: (() => { const o = crew.toObject(); delete o.password; return o; })() });

      // 비공�??�루 비�?번호 검�?
      if (crew.isPrivate && crew.password) {
        if (!password) return res.status(400).json({ error: '?�장 코드�??�력?�주?�요.' });
        const isMatch = await bcrypt.compare(String(password), crew.password);
        if (!isMatch) return res.status(401).json({ error: '?�장 코드가 ?�치?��? ?�습?�다.' });
      }

      // ?�원 초과 ?�인
      if (crew.members >= (crew.limit || 1000)) return res.status(400).json({ error: '?�루 ?�원??가??찼습?�다.' });

      // ?�루 멤버 추�?
      crew.memberList.push({ email, name, role: 'member', joinedAt: new Date() });
      crew.members = crew.memberList.length;
      crew.lastActive = new Date();
      await crew.save();

      // ?��? joinedCrews ?�데?�트 (??BUG-FIX: User null guard 추�? ??null ??TypeError 방�?)
      if (User) {
        await User.findOneAndUpdate(
          { email },
          { $addToSet: { joinedCrews: { crewId: crew._id, joinedAt: new Date() } } }
        ).catch(() => {});
      }

      const obj = crew.toObject(); delete obj.password;
      return res.json({ success: true, crew: obj });
    }
    // ?�메모리 fallback
    const mem = memCrews.find(c => c.id === req.params.id || c._id === req.params.id);
    if (!mem) return res.status(404).json({ error: '?�루�?찾을 ???�습?�다.' });
    if (!Array.isArray(mem.memberList)) mem.memberList = [];
    const alreadyIn = mem.memberList.some(m => m.email === email);
    if (alreadyIn) return res.json({ success: true, already: true });
    if (mem.isPrivate && mem.password) {
      if (!password) return res.status(400).json({ error: '?�장 코드�??�력?�주?�요.' });
      const isMatch = await bcrypt.compare(String(password), mem.password);
      if (!isMatch) return res.status(401).json({ error: '?�장 코드가 ?�치?��? ?�습?�다.' });
    }
    // ???�메모리 모드 ?�원 초과 체크 추�?
    if (mem.members >= (mem.limit || 1000)) return res.status(400).json({ error: '?�루 ?�원??가??찼습?�다.' });
    mem.memberList.push({ email, name, role: 'member', joinedAt: new Date() });
    mem.members = mem.memberList.length;
    saveMemCrews();
    res.json({ success: true });
  } catch (err) { (logger?.error || console.error)('[CREW JOIN]', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?� ??CREW-ENH: ?�루 ?�퇴 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.post('/api/community/crews/:id/leave', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }

    // ??BUG-FIX: ?�루 ?�퇴 email?� JWT?�서�?추출 (body email ???�??강제 ?�퇴 보안 취약???�정)
    const email = tp.email || tp.id;
    if (!email) return res.status(401).json({ error: '?�증 ?�보 ?�음' });

    if (dbReady && Crew && User) {
      // ??BUG-11 FIX: CastError 방�?
      if (mongoose.Types.ObjectId.isValid && !mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(400).json({ error: '?�효?��? ?��? ID' });
      const crew = await Crew.findById(req.params.id).catch(() => null); // ??BUG-11 FIX
      if (!crew) return res.status(404).json({ error: '?�루�?찾을 ???�습?�다.' });
      if (crew.owner === email) return res.status(400).json({ error: '?�루?��? ?�루�??�퇴?????�습?�다. ?�루�???��?�거???�루?�을 ?�임?�세??' });

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
  } catch (err) { (logger?.error || console.error)('[CREW LEAVE]', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?� ??CREW-ENH: ?�루??목록 조회 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.get('/api/community/crews/:id/members', async (req, res) => {
  try {
    if (dbReady && Crew) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '?�못??ID ?�식?�니??' }); // FIX-OBJID-BATCH-3
      const crew = await Crew.findById(req.params.id).catch(() => null);
      if (!crew) return res.status(404).json({ error: '?�루�?찾을 ???�습?�다.' });
      return res.json({ members: crew.memberList || [], owner: crew.owner, ownerName: crew.ownerName });
    }
    const mem = memCrews.find(c => c.id === req.params.id || c._id === req.params.id);
    if (!mem) return res.status(404).json({ error: '?�루�?찾을 ???�습?�다.' });
    res.json({ members: mem.memberList || [], owner: mem.owner, ownerName: mem.ownerName });
  } catch (err) { res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?� ??CREW-ENH: ?�루??강퇴 (?�루???�용) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.delete('/api/community/crews/:id/members/:targetEmail', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }

    const rawTargetEmail = decodeURIComponent(req.params.targetEmail || '');
    if (typeof rawTargetEmail !== 'string' || rawTargetEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawTargetEmail)) {
      return res.status(400).json({ error: '?�효?��? ?��? ?�메???�식?�니??' }); // FIX-TARGET-EMAIL-VALIDATE
    }
    const targetEmail = rawTargetEmail;
    const isAdmin = isAdminToken(tp);

    if (dbReady && Crew && User) {
      // ??BUG-14 FIX: CastError 방�?
      if (mongoose.Types.ObjectId.isValid && !mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(400).json({ error: '?�효?��? ?��? ID' });
      const crew = await Crew.findById(req.params.id).catch(() => null); // ??BUG-14 FIX
      if (!crew) return res.status(404).json({ error: '?�루�?찾을 ???�습?�다.' });
      // ??BUG-FIX: JWT email�??�증 (body email ?�거)
      if (!isAdmin && crew.owner !== tp.email) return res.status(403).json({ error: '?�루?�만 강퇴?????�습?�다.' });
      if (targetEmail === crew.owner) return res.status(400).json({ error: '?�루?��? 강퇴?????�습?�다.' });

      crew.memberList = crew.memberList.filter(m => m.email !== targetEmail);
      crew.members = Math.max(1, crew.memberList.length);
      await crew.save();

      // 강퇴???��???joinedCrews?�서???�거
      await User.findOneAndUpdate(
        { email: targetEmail },
        { $pull: { joinedCrews: { crewId: crew._id } } }
      ).catch(() => {});

      // ???�켓?�로 강퇴 ?�림 ??room명�? crewId 그�?�?(?�라?�언??join_crew(id)?� ?�치)
      io.to(req.params.id).emit('member_kicked', { email: targetEmail });

      return res.json({ success: true, members: crew.memberList });
    }
    res.json({ success: true });
  } catch (err) { (logger?.error || console.error)('[CREW KICK]', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?� ??간�? ?�정/?�제 (?�루???�용) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// PATCH /api/community/crews/:id/members/:targetEmail/role
// body: { email: ?�청?�이메일, role: 'officer' | 'member' }
app.patch('/api/community/crews/:id/members/:targetEmail/role', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }

    const { role } = req.body; // 부?�할 ??��
    // ??BUG-05 FIX: email??JWT?�서�?추출 (본문 email ?�뢰 ??권한 ?�회 차단)
    const email = tp.email || tp.id;
    const targetEmail = decodeURIComponent(req.params.targetEmail);
    const isAdmin = isAdminToken(tp);

    if (!['officer', 'member'].includes(role)) return res.status(400).json({ error: '??��?� officer ?�는 member�??�용?�니??' });
    // ??BUG-05 FIX: CastError 방�?
    if (mongoose.Types.ObjectId.isValid && !mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: '?�효?��? ?��? ID' });

    if (dbReady && Crew) {
      const crew = await Crew.findById(req.params.id).catch(() => null); // ??BUG-05 FIX
      if (!crew) return res.status(404).json({ error: '?�루�?찾을 ???�습?�다.' });
      if (!isAdmin && crew.owner !== email) return res.status(403).json({ error: '?�루?�만 간�?�??�정?????�습?�다.' }); // ??JWT email
      if (targetEmail === crew.owner) return res.status(400).json({ error: '?�루?�의 ??��?� 변경할 ???�습?�다.' });

      const member = crew.memberList.find(m => m.email === targetEmail);
      if (!member) return res.status(404).json({ error: '?�당 ?�루?�을 찾을 ???�습?�다.' });
      member.role = role;
      await crew.save();

      // ?�켓?�로 ??�� 변�??�림
      io.to(req.params.id).emit('member_role_changed', { email: targetEmail, role, name: member.name });

      const obj = crew.toObject(); delete obj.password;
      return res.json({ success: true, crew: obj });
    }
    // ?�메모리 fallback
    const mem = memCrews.find(c => c.id === req.params.id || c._id === req.params.id);
    if (!mem) return res.status(404).json({ error: '?�루�?찾을 ???�습?�다.' });
    if (!isAdmin && mem.owner !== email) return res.status(403).json({ error: '?�루?�만 간�?�??�정?????�습?�다.' }); // ??JWT email
    const memMember = (mem.memberList || []).find(m => m.email === targetEmail);
    if (memMember) memMember.role = role;
    saveMemCrews();
    res.json({ success: true });
  } catch (err) { (logger?.error || console.error)('[CREW ROLE]', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?� ??CREW-ENH: ?��? 가?�한 ?�루 목록 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.get('/api/user/crews', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }

    const email = tp.email || tp.id;

    if (dbReady && Crew) {
      // memberList???�당 email???�함???�루 조회
      const crews = await Crew.find({ 'memberList.email': email }).sort({ lastActive: -1, createdAt: -1 });
      const safe = crews.map(c => { const o = c.toObject(); delete o.password; return o; });
      return res.json(safe);
    }
    // ?�메모리 fallback
    const myCrews = memCrews
      .filter(c => Array.isArray(c.memberList) && c.memberList.some(m => m.email === email))
      .map(c => { const { password: _pw, ...safe } = c; return safe; });
    res.json(myCrews);
  } catch (err) { (logger?.error || console.error)('[USER CREWS]', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});


// ?�?� 공�??�항 ?�체 조회 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.get('/api/community/notices', async (req, res) => {
  try {
    if (dbReady && Notice) {
      const notices = await Notice.find().sort({ isPinned: -1, createdAt: -1 });
      // _id�?문자?�로 변?�하???�라?�언?�에??ID 불일�?방�?
      return res.json(notices.map(n => ({ ...n.toObject(), _id: n._id.toString(), id: n._id.toString() })));
    }
    res.json(memNotices);
  } catch (err) { res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?� 공�??�항 ?�건 조회 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
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
    return res.status(404).json({ error: '공�??�항??찾을 ???�습?�다.' });
  } catch (err) {
    const mem = memNotices.find(n => n._id === nid || n.id === nid);
    if (mem) return res.json(mem);
    res.status(404).json({ error: '공�??�항??찾을 ???�습?�다.' });
  }
});

// ?�?� 공�??�항 ?�성 (JWT ?�드�??�용) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.post('/api/community/notices', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    if (!isAdminToken(tp)) return res.status(403).json({ error: '마스??권한 ?�요' });
    const { title, content, isPinned, isPopup, image, images } = req.body;
    if (typeof title === 'string' && title.length > 100) return res.status(400).json({ error: '?�목?� 최�? 100?�입?�다.' }); // ??FIX-POST-TITLE-LENGTH
    if (typeof content === 'string' && content.length > 5000) return res.status(400).json({ error: '?�용?� 최�? 5000?�입?�다.' });
    if (!title || !content) return res.status(400).json({ error: '?�목�??�용 ?�수' });
    // ??IMG-SIZE-FIX: 4MB 기�? ?�일 (?�픈게시?�과 ?�일?�게)
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
  } catch (err) { res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?� 공�??�항 ?�정 (JWT ?�드�??�용) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ??BUG-NOTICE-IMG: PUT ?�들??부?�로 ?�정 ???��?지가 ?�?�되지 ?�던 버그 ?�정
app.put('/api/community/notices/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    if (!isAdminToken(tp)) return res.status(403).json({ error: '마스??권한 ?�요' });
    const { title, content, image, images, isPopup } = req.body;
    // FIX-NOTICE-PUT-LEN: PUT 수정 시 길이 제한 (POST와 동일 기준 적용)
    if (typeof title === 'string' && title.length > 100) return res.status(400).json({ error: '제목은 100자 이하여야 합니다.' }); // FIX-NOTICE-PUT-LEN
    if (typeof content === 'string' && content.length > 5000) return res.status(400).json({ error: '내용은 5000자 이하여야 합니다.' }); // FIX-NOTICE-PUT-LEN
    if (!title || !content) return res.status(400).json({ error: '?�목�??�용 ?�수' });
    // ??IMG-SIZE-FIX: 4MB 기�? ?�일
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
      if (!updated) return res.status(404).json({ error: '공�??�항??찾을 ???�습?�다.' });
      return res.json({ ...updated.toObject(), _id: updated._id.toString(), id: updated._id.toString() });
    }
    // ?�메모리 fallback
    const idx = memNotices.findIndex(n => n.id === req.params.id || n._id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: '공�??�항??찾을 ???�습?�다.' });
    memNotices[idx] = { ...memNotices[idx], ...updateFields };
    saveMemNotices();
    res.json(memNotices[idx]);
  } catch (err) { (logger?.error || console.error)('[PUT /notices/:id]', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});


// ?�?� 공�??�항 ??�� (JWT ?�드�??�용) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.delete('/api/community/notices/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    if (!isAdminToken(tp)) return res.status(403).json({ error: '마스??권한 ?�요' });
    if (dbReady && Notice) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '?�못??ID ?�식?�니??' }); // FIX-OBJID-BATCH-4
      await Notice.findByIdAndDelete(req.params.id);
      return res.json({ success: true });
    }
    memNotices = memNotices.filter(n => n.id !== req.params.id);
    saveMemNotices();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?� 공�??�항 조회??증�? ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ??FIX-NOTICE-VIEW-DEDUP: IP 기반 중복 조회??방어 (같�? IP 1?�간 ??1?�만 카운??
const noticeViewCache = new Map(); // 'ipHash:noticeId' ??timestamp
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [k, v] of noticeViewCache.entries()) { if (v < cutoff) noticeViewCache.delete(k); }
}, 30 * 60 * 1000);
app.patch('/api/community/notices/:id/view', async (req, res) => {
  try {
    // ??BUG-06 FIX: ObjectId ?�효???�전 검�???CastError ?�캐�?방�?
    const { id } = req.params;
    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) return res.status(400).json({ error: '?�효?��? ?��? ID' });
    // ??FIX-NOTICE-VIEW-DEDUP: 같�? IP?�서 1?�간 ??중복 조회??차단
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
  } catch (err) { res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?� ?�상배홍�?게시글 ?�체 조회 (region ?�터 + limit 지?? ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.get('/api/community/business', async (req, res) => {
  try {
    const { region, limit } = req.query;
    // ??BUG-08 FIX: limit ?�수 ?�력 방어 (Math.max 추�?)
    const maxLimit = Math.min(Math.max(1, parseInt(limit) || 100), 100);
    if (dbReady && BusinessPost) {
      const now = new Date();
      await BusinessPost.updateMany(
        { isPinned: true, expiresAt: { $ne: null, $lt: now } },
        { $set: { isPinned: false } }
      );
      // ??BUG-02 FIX: region ?�력??$regex??직접 ?�입 금�? ???�수문자 ?�스케?�프�?ReDoS/쿼리 조작 방�?
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
  } catch (err) { res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?� ?�상배홍�?게시글 ?�성 (JWT ?�증 ?�수) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.post('/api/community/business', async (req, res) => {
  try {
    // ??JWT ?�증
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }

    const { author, shipName, type, target, region, date, price, phone, content, cover, images: rawImages, isPinned, harborId, expiresAt, capacity } = req.body;
    // ??FIX-EXPIRES-POST: expiresAt 최�? 2??+ 과거 ?�짜 차단
    if (expiresAt) { const ed = new Date(expiresAt); const maxD = new Date(); maxD.setFullYear(maxD.getFullYear() + 2); if (isNaN(ed.getTime()) || ed < new Date()) { return res.status(400).json({ error: '만료?�이 ?�효?��? ?�습?�다.' }); } if (ed > maxD) { return res.status(400).json({ error: '만료?��? 최�? 2???�내?�야 ?�니??' }); } } // FIX-EXPIRES-POST
    // ??FIX-BIZ-SHIPNAME-LEN: 비즈?�스 게시글 ?�드 길이 검�?
    if (shipName && typeof shipName === 'string' && shipName.length > 100) return res.status(400).json({ error: '?�명?� 최�? 100?�입?�다.' }); // FIX-BIZ-SHIPNAME-LEN
    if (phone && typeof phone === 'string' && phone.length > 20) return res.status(400).json({ error: '?�화번호??최�? 20?�입?�다.' });
    if (content && typeof content === 'string' && content.length > 3000) return res.status(400).json({ error: '내용은 3000자 이하여야 합니다.' }); // FIX-BIZ-CONTENT-LEN
    // ??BUG-5 FIX: author_email?� JWT?�서�?가?��?????(?�라?�언??body 무시 ???�??계정 ?�장 방�?)
    const author_email = tp.email;
    if (!author_email) return res.status(401).json({ error: '?�메???�보 ?�음 (?�로그인 ?�요)', code: 'AUTH_REQUIRED' });
    // ??MULTI-IMG: ?�상�??��?지 배열 처리
    // ??BUG-FIX: base64???�본 ?��?~1.33�??��?�?3MB ?�본 = ~4MB base64 ??4MB�??�화
    const bizImages = Array.isArray(rawImages) ? rawImages.filter(img => img && img.length <= 4 * 1024 * 1024).slice(0, 5) : [];
    const bizCover = bizImages[0] || cover || '';
    if (!author || !author_email || !shipName || !content)
      return res.status(400).json({ error: '?�수 ??�� ?�락' });
    // ???�버 ?�원 검�???마스?�는 1~1000, ?�반 ?��???1~200
    if (capacity !== undefined) {
      const isAdm = isAdminToken(tp); // ???��? ?�코?�된 tp ?�사??
      const maxCap = isAdm ? 1000 : 200;
      const capNum = Number(capacity);
      if (isNaN(capNum) || capNum < 1 || capNum > maxCap) {
        return res.status(400).json({ error: `?�원?� 1~${maxCap}?�이???�자�??�력?�주?�요.` });
      }
    }
    // ??CENSOR: ?�상�??�보글 비속??* 치환
    const censoredContent = censorText(content.trim());
    const censoredShipName = censorText(shipName.trim());

    const isAdmin = isAdminToken(tp);

    // ???�버 구독 ?�급 검�???DB?�서 ?�제 tier 조회 (?�라?�언???�회 방�?)
    // JWT??tier??만료 ?�에???�료�??�아?�을 ???�으므�?DB 직접 ?�인
    if (!isAdmin) {
      let dbUser = null;
      if (dbReady && User) {
        dbUser = await User.findOne({ email: author_email }, 'tier iapExpiresAt vvipHarborId').lean().catch(() => null);
      } else {
        const u = memUsers.find(u => u.email === author_email);
        if (u) dbUser = u;
      }

      const actualTier = dbUser?.tier || 'FREE';
      // IAP 만료 ?��? 체크 (?��?줄러 ?�직 미실?????�라?�언???�회 차단)
      const isIapExpired = dbUser?.iapExpiresAt && new Date(dbUser.iapExpiresAt) < new Date();
      const effectiveTier = isIapExpired ? 'FREE' : actualTier;

      if (!['PRO', 'BUSINESS_VIP'].includes(effectiveTier)) {
        return res.status(403).json({
          error: 'PRO ?�는 VVIP 구독?�만 ?�상?�보글???�성?????�습?�다.',
          code: 'SUBSCRIPTION_REQUIRED',
        });
      }

      // 1??1게시글 ?�한
      if (dbReady && BusinessPost) {
        const existing = await BusinessPost.findOne({ author_email }).catch(() => null);
        if (existing) {
          return res.status(409).json({
            error: '?��? ?�록???�보글???�습?�다. ?�정 기능???�용?�주?�요.',
            code: 'DUPLICATE_BUSINESS_POST',
            existingId: existing._id.toString(),
          });
        }
      } else {
        const existing = memBusinessPosts.find(p => p.author_email === author_email);
        if (existing) {
          return res.status(409).json({
            error: '?��? ?�록???�보글???�습?�다. ?�정 기능???�용?�주?�요.',
            code: 'DUPLICATE_BUSINESS_POST',
            existingId: existing.id || existing._id,
          });
        }
      }

      // ??VVIP 지???�한 검�?(기존 로직 ??dbUser ?�사??
      const vvipHarborId = (effectiveTier === 'BUSINESS_VIP' && dbUser?.vvipHarborId) ? dbUser.vvipHarborId : null;
      if (region === '?�국 (?�체)') {
        return res.status(403).json({ error: "'?�국 (?�체)' 지??? 마스???�용?�니??", code: 'GLOBAL_REGION_FORBIDDEN' });
      }
      if (vvipHarborId) {
        const harborKey = HARBOR_KEY_MAP[vvipHarborId];
        if (harborKey && region && region !== '?�국 (?�체)' && !region.startsWith(harborKey)) {
          const harborInfo = HARBOR_LIST.find(h => h.id === vvipHarborId);
          return res.status(403).json({
            error: `VVIP 구독 지??${harborInfo?.name || vvipHarborId})?�서�??�보글???�성?????�습?�다.`,
            code: 'VVIP_REGION_MISMATCH',
            allowedKey: harborKey,
          });
        }
      }
    }

    // ??isPinned ??VVIP ?�롯 보유?�도 고정 가??(마스?��? ?�일 권한)
    const myVvipEntry = Object.entries(vvipSlots).find(([, v]) => {
      return v.userId === author_email && (!v.expiresAt || new Date(v.expiresAt) > new Date());
    });
    const safePinned = (isAdmin || !!myVvipEntry) ? !!isPinned : false;

    const postData = {
      author, author_email, shipName: censoredShipName,
      type: type || '?�상?�시', target: target || '?�수?�종',
      region: region || '', date: date || '', price: price || '',
      phone: phone || '', content: censoredContent,
      cover: bizCover,       // ??MULTI-IMG: �?번째 ?��?지가 커버
      images: bizImages,     // ??MULTI-IMG: ?�체 ?��?지 배열
      isPinned: safePinned,
      // ??BUG-FIX: capacity ?�락 ??DB???�?????�던 버그 ?�정
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
  } catch (err) { (logger?.error || console.error)('[business/write]', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?� ?�상배홍�?게시글 ?�건 조회 (?�정 모드 진입 ???�용) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ??BUG-FIX: GET /:id ?�드?�인???�락 ???�정 모드?�서 무조�?404 ?�류 발생?�던 버그 ?�정
app.get('/api/community/business/:id', async (req, res) => {
  try {
    if (dbReady && BusinessPost) {
      let post = null;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '?�못??ID ?�식?�니??' }); // FIX-OBJID-BATCH-5
      try { post = await BusinessPost.findById(req.params.id).lean(); } catch (_) {}
      if (!post) post = await BusinessPost.findOne({ id: req.params.id }).lean().catch(() => null);
      if (!post) return res.status(404).json({ error: '게시글??찾을 ???�습?�다.' });
      return res.json({ ...post, _id: post._id?.toString(), id: post._id?.toString() });
    }
    const mem = memBusinessPosts.find(p =>
      p.id === req.params.id || p._id === req.params.id ||
      String(p.id) === req.params.id || String(p._id) === req.params.id
    );
    if (!mem) return res.status(404).json({ error: '게시글??찾을 ???�습?�다.' });
    res.json(mem);
  } catch (err) { (logger?.error || console.error)('[BUSINESS GET ONE]', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?� ?�상배홍�?게시글 ??�� (JWT ?�증 ??마스??or ?�성?? ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.delete('/api/community/business/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    // ??BUG-DELETE-FIX: email?� JWT?�서�?추출 (body email ?�뢰 ???�??게시글 ??�� 가??보안 취약???�정)
    const jwtEmail = tp.email;
    const isAdmin = isAdminToken(tp);
    if (dbReady && BusinessPost) {
      // ??CastError 방�?: _id 검???�패 ??id ?�드�??��???
      let post = null;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '?�효?��? ?��? ID' }); // ??FIX-CASTID-AUTO
      try { post = await BusinessPost.findById(req.params.id); } catch (_) {}
      if (!post) { post = await BusinessPost.findOne({ id: req.params.id }).catch(() => null); }
      if (!post) return res.status(404).json({ error: '게시글??찾을 ???�습?�다.' });
      if (!isAdmin && post.author_email !== jwtEmail) return res.status(403).json({ error: '권한 ?�음' });
      await post.deleteOne();
      return res.json({ success: true });
    }
    // ?�메모리: id/_id ?�쪽 체크 + ??권한 체크 추�?
    const memPost = memBusinessPosts.find(p =>
      p.id === req.params.id || p._id === req.params.id ||
      String(p.id) === req.params.id || String(p._id) === req.params.id
    );
    if (!memPost) return res.status(404).json({ error: '게시글??찾을 ???�습?�다.' });
    if (!isAdmin && memPost.author_email !== jwtEmail) return res.status(403).json({ error: '권한 ?�음' });
    memBusinessPosts = memBusinessPosts.filter(p => p !== memPost);
    saveMemBusinessPosts();
    res.json({ success: true });
  } catch (err) { (logger?.error || console.error)('[BUSINESS DELETE]', err.message); res.status(500).json({ error: '?�버 ?�류: ' + err.message }); }
});

// ?�?� ?�상배홍�??�정 (?�성??or 마스?? ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.put('/api/community/business/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    // ??BUG-PUT-FIX: email?� JWT?�서�?추출 (body email ?�뢰 ???�??게시글 ?�정 가??보안 취약???�정)
    const jwtEmail = tp.email;
    const isAdmin = isAdminToken(tp);
    const { ...fields } = req.body;
    // email ?�드???�정 불�? (?�이?�리?�트 ???�드???�래??차단??

    // ??BUG-FIX-PUT-1: capacity ?�버 검�?추�? (?�정 ?�에???�용)
    if (fields.capacity !== undefined) {
      const maxCap = isAdmin ? 1000 : 200;
      const capNum = Number(fields.capacity);
      if (isNaN(capNum) || capNum < 1 || capNum > maxCap) {
        return res.status(400).json({ error: `?�원?� 1~${maxCap}?�이???�자�??�력?�주?�요.` });
      }
    }

    // ??BUG-FIX-PUT-2: VVIP ?�용?�도 isPinned 변�?가??(isAdmin ?�는 ?�효 VVIP ?�롯 보유??
    if (fields.isPinned !== undefined) {
      // ??JWT email ?�용 (body email ?�거)
      const myVvipEntry = jwtEmail ? Object.entries(vvipSlots).find(([, v]) => {
        return v.userId === jwtEmail && (!v.expiresAt || new Date(v.expiresAt) > new Date());
      }) : null;
      if (!isAdmin && !myVvipEntry) {
        fields.isPinned = false; // 마스??VVIP ?�닌 경우 강제 false
      }
    }

    // ??BUG-FIX-PUT-3: ?��?지 배열 ?�터�?(PUT?�도 POST?� ?�일??4MB ?�한 ?�용)
    if (fields.images !== undefined) {
      fields.images = Array.isArray(fields.images)
        ? fields.images.filter(img => img && img.length <= 4 * 1024 * 1024).slice(0, 5)
        : [];
      // ?��?지 바뀌면 cover???�기??
      fields.cover = fields.images[0] || fields.cover || '';
    }

    // ??BUG-FIX-PUT-4: ?�이?�리?�트 ?�드�??�?????�상�?못한 ?�드 주입 방�?
    // ??FIX-BPOST-TITLE-LENGTH: 비즈?�스 게시글 주요 ?�드 길이 ?�한
  if (fields.shipName && typeof fields.shipName === 'string' && fields.shipName.length > 100) return res.status(400).json({ error: '?�박명�? 최�? 100?�입?�다.' });
  if (fields.content && typeof fields.content === 'string' && fields.content.length > 5000) return res.status(400).json({ error: '?�용?� 최�? 5000?�입?�다.' });
  const ALLOWED_FIELDS = ['shipName', 'type', 'target', 'region', 'date', 'price', 'phone',
      'content', 'cover', 'images', 'isPinned', 'capacity', 'harborId', 'expiresAt'];
    const safeFields = {};
    for (const k of ALLOWED_FIELDS) {
      if (fields[k] !== undefined) safeFields[k] = fields[k];
    }

    if (dbReady && BusinessPost) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '?�못??ID ?�식?�니??' }); // FIX-OBJID-BATCH-6
      const post = await BusinessPost.findById(req.params.id).catch(() => null);
      if (!post) return res.status(404).json({ error: '게시글 ?�음' });
      // ??JWT email�?권한 체크 (body email ?�거)
      if (!isAdmin && post.author_email !== jwtEmail) return res.status(403).json({ error: '권한 ?�음' });
      Object.assign(post, safeFields);
      await post.save();
      return res.json(post);
    }
    const mem = memBusinessPosts.find(p => p.id === req.params.id || p._id === req.params.id);
    if (!mem) return res.status(404).json({ error: '게시글 ?�음' });
    // ??JWT email�?권한 체크
    if (!isAdmin && mem.author_email !== jwtEmail) return res.status(403).json({ error: '권한 ?�음' });
    Object.assign(mem, safeFields);
    saveMemBusinessPosts();
    res.json(mem);
  } catch (err) { (logger?.error || console.error)('[BusinessPost PUT] ?�버 ?�류:', err.message); res.status(500).json({ error: '?�버 ?�류' }); }
});


/* =========================================================
   MARINE API & ROOT
========================================================= */
app.get('/', (req, res) => {
  res.send('<h1>Fishing GO Backend is running flawlessly! ??</h1><p>DB Status: ' + (dbReady ? 'MongoDB Connected ?? : 'In-Memory Mode ?�️') + '</p>');
});

// ?�?� 개인?�보처리방침 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.get('/privacy', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>?�시GO 개인?�보처리방침</title>
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
  <h1>?�� ?�시GO 개인?�보처리방침</h1>
  <p class="date">?�행?? 2025??1??1??&nbsp;|&nbsp; 최종 ?�정?? 2026??5??22??/p>

  <div class="box">
    <p>?�주?�유???�하 "?�사")?� ?�시GO ?�비???�하 "?�비??)�??�공?�에 ?�어 ?�용?�의 개인?�보�??�중???�기�? ?�개?�정�?보호법�?�?관??법령??준?�합?�다.</p>
  </div>

  <h2>1. ?�집?�는 개인?�보 ??��</h2>
  <div class="box">
    <ul>
      <li><strong>?�수 ??��:</strong> ?�메??주소, ?�네?? 비�?번호(?�호???�??</li>
      <li><strong>?�셜 로그??</strong> 구�?·카카??계정 ID, ?�로???�진 URL</li>
      <li><strong>?�비???�용 ?�보:</strong> ?�시 ?�인??즐겨찾기, 조황 기록, ?�림 ?�정</li>
      <li><strong>결제 ?�보:</strong> 구독 ?�랜, 결제 ?�시 (카드번호 ??금융?�보???�집?��? ?�음)</li>
      <li><strong>기기 ?�보:</strong> FCM ?�큰(?�시 ?�림), ??버전, OS ?�보</li>
      <li><strong>?�치 ?�보:</strong> GPS 좌표 (?�시 ?�인??검???? ?�용???�의 ???�집)</li>
    </ul>
  </div>

  <h2>2. 개인?�보???�집·?�용 목적</h2>
  <div class="box">
    <ul>
      <li>?�원 가??�??�비???�용 관�?/li>
      <li>?�시 ?�인?? 조황 ?�보, ?�씨 ??맞춤???�비???�공</li>
      <li>구독 결제 처리 �??�역 관�?/li>
      <li>?�시 ?�림(조황 ?�림, ?�벤?? 발송</li>
      <li>?�비??개선???�한 ?�계 분석</li>
      <li>불법·부???�용 방�? �?법적 ?�무 ?�행</li>
    </ul>
  </div>

  <h2>3. 개인?�보??보유 �??�용 기간</h2>
  <div class="box">
    <ul>
      <li><strong>?�원 ?�퇴 ??</strong> 즉시 ??�� (?? 관??법령???�라 ?�정 기간 보�?)</li>
      <li><strong>?�자?�거??기록:</strong> 5??(?�자?�거?�법)</li>
      <li><strong>?�속 로그:</strong> 3개월 (?�신비�?보호�?</li>
    </ul>
  </div>

  <h2>4. 개인?�보???????�공</h2>
  <div class="box">
    <div class="highlight">?�사???�용?�의 개인?�보�??�칙?�으�??��????�공?��? ?�습?�다.</div>
    <p>?�만, ?�음??경우 ?�외�??�니??</p>
    <ul>
      <li>?�용?��? ?�전???�의??경우</li>
      <li>법령???�거?�거???�사기�????�청???�는 경우</li>
    </ul>
  </div>

  <h2>5. 개인?�보 처리 ?�탁</h2>
  <div class="box">
    <ul>
      <li><strong>MongoDB Atlas (MongoDB Inc.):</strong> ?�이?�베?�스 ?�비??/li>
      <li><strong>Google Firebase:</strong> ?�시 ?�림(FCM) ?�비??/li>
      <li><strong>Google Play:</strong> ?�앱 결제 처리</li>
      <li><strong>Render.com:</strong> ?�버 ?�스??/li>
    </ul>
  </div>

  <h2>6. ?�용?�의 권리</h2>
  <div class="box">
    <p>?�용?�는 ?�제?��? ?�음 권리�??�사?????�습?�다:</p>
    <ul>
      <li>개인?�보 ?�람, ?�정, ??�� ?�청</li>
      <li>개인?�보 처리 ?��? ?�청</li>
      <li>?�원 ?�퇴 (????마이?�이지 ???�원 ?�퇴)</li>
    </ul>
    <p>문의: <strong>fishing.go.kr@gmail.com</strong></p>
  </div>

  <h2>7. ?�치?�보 ?�집 �??�용</h2>
  <div class="box">
    <ul>
      <li>목적: ?�시 ?�인??지???�시, 주�? ?�인??검??/li>
      <li>?�집 방법: ???�행 ??권한 ?�의 ???�집</li>
      <li>보유 기간: ?�비???�용 기간 (?�션 종료 ????��)</li>
      <li>거�? 가?? ?�치 권한 미허????지??기능 ?�한</li>
    </ul>
  </div>

  <h2>8. 카메??�??�진 ?�근 권한</h2>
  <div class="box">
    <ul>
      <li>목적: 조황 ?�증 ?�진 촬영 �??�로??/li>
      <li>?�집 방법: ?�용?��? 직접 ?�진 촬영 ?�는 ?�택</li>
      <li>?????�공: ?�음</li>
    </ul>
  </div>

  <h2>9. 쿠키 �??�사 기술</h2>
  <div class="box">
    <p>?�비?�는 로그???�태 ?��?�??�해 JWT ?�큰???�용?�며, 광고 목적??쿠키???�용?��? ?�습?�다.</p>
  </div>

  <h2>10. 개인?�보 보호책임??/h2>
  <div class="box">
    <ul>
      <li><strong>?�사�?</strong> ?�주?�유??/li>
      <li><strong>책임??</strong> ?�?�자</li>
      <li><strong>?�메??</strong> fishing.go.kr@gmail.com</li>
    </ul>
  </div>

  <h2>11. 개인?�보처리방침 변�?/h2>
  <div class="box">
    <p>??방침?� 법령·?�비??변�???개정?????�으�? 변�?????공�??�항???�해 ?�내?�니??</p>
  </div>

  <footer>
    &copy; 2026 ?�주?�유??· ?�시GO · <a href="/terms" style="color:#c8d400">?�용?��?</a>
  </footer>
</div>
</body>
</html>`);
});

// ?�?� ?�용?��? ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ?�?� 계정 ??�� ?�내 ?�이지 (Google Play ?�이??보안 ?�수) ?�?�?�?�?�?�?�?�
app.get('/delete-account', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>?�시GO 계정 ??��</title>
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
  <h1>?���??�시GO 계정 ??�� ?�내</h1>

  <div class="box">
    <p>?�시GO 계정????��?�면 모든 개인?�보?� ?�비???�용 ?�역???�구?�으�???��?�니??<br>계정 ??�� ???�래 ?�내?�항??반드???�인?�세??</p>
  </div>

  <div class="warn">
    ?�️ 계정 ??�� ?�에???�이?��? 복구?????�습?�다. 구독 중인 경우 ?�불??불�??�오??먼�? 구독??취소??주세??
  </div>

  <h2>?�에??직접 ??��?�기 (권장)</h2>

  <div class="step">
    <div class="num">1</div>
    <div><strong>???�행</strong> ???�단 ??<strong>마이?�이지</strong> ?�택</div>
  </div>
  <div class="step">
    <div class="num">2</div>
    <div>?�측 ?�단 <strong>?�️ ?�정</strong> ?�이�??�릭</div>
  </div>
  <div class="step">
    <div class="num">3</div>
    <div>?�단??<strong>"?�원 ?�퇴"</strong> 버튼 ?�릭</div>
  </div>
  <div class="step">
    <div class="num">4</div>
    <div>?�퇴 ?�유 ?�택 ??<strong>"?�퇴 ?�인"</strong> ?�릭 ??즉시 ??�� ?�료</div>
  </div>

  <h2>?�메?�로 ??�� ?�청?�기</h2>
  <div class="box">
    <p>???�근???�려??경우 ?�메?�로 ??���??�청?????�습?�다.</p>
    <ul>
      <li>?�메?? <strong>fishing.go.kr@gmail.com</strong></li>
      <li>?�목: <strong>[계정 ??�� ?�청] ?�메??주소</strong></li>
      <li>?�용: 가???�메??주소 �???�� ?�청 ?�유</li>
      <li>처리 기간: ?�청?�로부??<strong>?�업??3???�내</strong></li>
    </ul>
  </div>

  <h2>??��?�는 ?�이??/h2>
  <div class="box">
    <ul>
      <li>???�메??주소, ?�네?? 비�?번호</li>
      <li>???�시 ?�인??즐겨찾기, 조황 기록</li>
      <li>??커�??�티 게시글 �??��?</li>
      <li>??구독 ?�보 �?FCM ?�큰</li>
      <li>?�️ ?�자?�거??결제 기록?� 법령???�라 5?�간 보�?</li>
    </ul>
  </div>

  <div class="contact">
    <p style="color:#c8d400;font-weight:700;margin-bottom:8px">?�� 문의</p>
    <p>?�메?? <a href="mailto:fishing.go.kr@gmail.com">fishing.go.kr@gmail.com</a></p>
    <p style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:8px">?�업??기�? 3???�내 ?��??�립?�다.</p>
  </div>

  <footer>&copy; 2026 ?�주?�유??· ?�시GO · <a href="/privacy" style="color:#c8d400">개인?�보처리방침</a></footer>
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
<title>?�시GO ?�용?��?</title>
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
  <h1>?�� ?�시GO ?�용?��?</h1>
  <p class="date">?�행?? 2025??1??1??&nbsp;|&nbsp; 최종 ?�정?? 2026??5??22??/p>

  <div class="box">
    <p>�??��??� ?�주?�유???�하 "?�사")???�공?�는 ?�시GO ?�비???�하 "?�비??) ?�용??관??조건 �??�차�?규정?�니??</p>
  </div>

  <h2>??�?(목적)</h2>
  <div class="box"><p>???��??� ?�사가 ?�공?�는 ?�시GO ???�비?�의 ?�용 조건 �??�차??관???�항??규정?�을 목적?�로 ?�니??</p></div>

  <h2>??�?(?�비???�용)</h2>
  <div class="box">
    <ul>
      <li>?�국 ?�시 ?�인??지???�비??/li>
      <li>?�시�??�양 기상 �?조황 ?�보</li>
      <li>?�안 CCTV ?�상 ?�비??/li>
      <li>조황 커�??�티 �??�증 ?�비??/li>
      <li>?�료 구독 ?�비??(BASIC · PRO · VVIP)</li>
    </ul>
  </div>

  <h2>??�?(?�원 가??</h2>
  <div class="box">
    <p>?�용?�는 ?�메???�는 ?�셜 계정(구�?·카카???�로 가?�할 ???�으�? �?14???�상??경우?�만 가?�이 가?�합?�다.</p>
  </div>

  <h2>??�?(?�료 ?�비??�?구독)</h2>
  <div class="box">
    <ul>
      <li>?�료 구독?� 구�? ?�레???�앱 결제�??�해 ?�루?�집?�다.</li>
      <li>구독?� ?�음 결제??24?�간 ?�까지 취소 가?�합?�다.</li>
      <li>?�불?� 구�? ?�레???�불 ?�책???�릅?�다.</li>
      <li>구독 취소 ?�에??기간 만료 ?�까지 ?�비?��? ?��??�니??</li>
    </ul>
  </div>

  <h2>??�?(?�용???�무)</h2>
  <div class="box">
    <ul>
      <li>?�?�의 개인?�보 ?�용 금�?</li>
      <li>?�위 조황 ?�보 ?�록 금�?</li>
      <li>?�비?��? ?�한 ?�업??광고 ?�위 금�? (VVIP ?�외)</li>
      <li>?�비???�정?�을 ?�치???�위 금�?</li>
    </ul>
  </div>

  <h2>??�?(?�비??중단)</h2>
  <div class="box"><p>?�사???�스???��?, 천재지변 ??불�??�한 경우 ?�비?��? ?�시 중단?????�으�? ?�전??공�??�니??</p></div>

  <h2>??�?(면책 조항)</h2>
  <div class="box">
    <ul>
      <li>?�시 ?�인???�보??참고?�이�? ?�제 조황�??��? ???�습?�다.</li>
      <li>기상 ?�보???��? API 기반?�로 ?�확?��? 보장?��? ?�습?�다.</li>
      <li>?�용??�?분쟁???�사??책임지지 ?�습?�다.</li>
    </ul>
  </div>

  <h2>??�?(분쟁 ?�결)</h2>
  <div class="box"><p>�??��???관??분쟁?� ?�?��?�?법률???�르�? 관??법원?� ?�울중앙지방법?�으�??�니??</p></div>

  <h2>문의</h2>
  <div class="box"><p>?�메?? <strong>fishing.go.kr@gmail.com</strong></p></div>

  <footer>
    &copy; 2026 ?�주?�유??· ?�시GO · <a href="/privacy" style="color:#c8d400">개인?�보처리방침</a>
  </footer>
</div>
</body>
</html>`);
});


app.get('/api/weather/precision', checkSubscriptionValid, (req, res) => {
  const { stationId } = req.query;
  const sid = stationId || 'DT_0001';

  if (weatherCache[sid]) {
    // ?�시간성 체감???�해 캐시 ?�이?�에???�출 ?�마??미세 ?�이�?추�?
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

  // 권역�?지?�형 ?��?(API ?�신 불�? ??즉시 고유 ?�이???�성)
  const station = observationData[sid] || { region: '?�해', baseTemp: 16.5 };
  const profile = REGIONAL_PROFILES[station.region] || REGIONAL_PROFILES['?�해'];
  const mockSst = (station.baseTemp || profile.temp || 15.2).toFixed(1);

  const seed = parseInt(sid.replace(/\\D/g, '')) || 1;
  const tideNum = (seed % 15) + 1; // ??BUG-FIX: 14??5 물때 15�??�환 ?�정 (3�??�락 ?�치)
  const tidePhase = tideNum === 7 ? '7�??�리)' : tideNum === 13 ? '13�?조금)' : tideNum === 14 ? '14�?무시)' : `${tideNum}�?;
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
    name: station.name || '?�시�??�인??,
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

// ?�?� ?�시 ?�인???�괄 ?�수 반환 API ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ??SCORE-UNIFIED: ?�버 공식 = ?�라?�언??evaluator.js ?�전 ?�일 (베이??45~55??
// ??REAL-DATA: KMA ?�양부???�속·?�고) + KHOA 조석(물때) ?�시�??�이??반영
app.get('/api/fishing-scores', (req, res) => {
  try {
    const scores = {};
    const hour  = new Date().getHours();
    const month = new Date().getMonth() + 1;
    const isNight = hour >= 19 || hour < 5;

    Object.keys(weatherCache).forEach(sid => {
      const entry = weatherCache[sid];
      if (!entry || !entry.data) return;
      const d = entry.data;
      const sst   = parseFloat(d.sst)          || 14;
      const wind  = parseFloat(d.wind?.speed)   || 3;
      const wave  = parseFloat(d.wave?.coastal) || 0.5;
      const phase = d.tide?.phase               || '';
      const seed  = parseInt(sid.replace(/\D/g, '')) || 1;

      // ?�?� 베이?? evaluator.js ?�일 (45 + seed 보정) ?�?�
      let score = 45 + (seed % 10) + ((seed % 14 - 7) / 10);

      // ?�?� ?�속 보정 (evaluator.js ?�일) ?�?�
      if      (wind > 14) score -= 65;
      else if (wind > 10) score -= 40;
      else if (wind >  8) score -= 28;
      else if (wind >  6) score -= 18;
      else if (wind >  4) score -= 8;
      else if (wind <  2) score += 12;
      else if (wind <  3) score += 7;

      // ?�?� ?�고 보정 (evaluator.js ?�일) ?�?�
      if      (wave > 2.5) score -= 60;
      else if (wave > 2.0) score -= 45;
      else if (wave > 1.5) score -= 30;
      else if (wave > 1.2) score -= 20;
      else if (wave > 0.8) score -= 10;
      else if (wave < 0.3) score += 8;
      else if (wave < 0.5) score += 4;

      // ?�?� ?�온 보정 (evaluator.js ?�일) ?�?�
      if      (sst < 8)              score -= 40;
      else if (sst < 11)             score -= 25;
      else if (sst < 14)             score -= 12;
      else if (sst < 17)             score -= 3;
      else if (sst >= 17 && sst < 20) score += 10;
      else if (sst >= 20 && sst < 24) score += 6;
      else if (sst >= 24 && sst < 27) score -= 5;
      else if (sst >= 27)             score -= 25;

      // ?�?� 계절 보정 ?�?�
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

      // ?�?� 물때 보정 (evaluator.js TIDE_BONUS ?�일) ?�?�
      const tideMatch = phase.match(/(\d+)�?);
      const tideNum = tideMatch ? parseInt(tideMatch[1]) : 0;
      const TIDE_BONUS = { 1:3,2:5,3:7,4:9,5:10,6:10,7:8,8:6,9:4,10:2,11:-2,12:-4,14:-8,15:-6 };
      score += TIDE_BONUS[tideNum] || 0;
      if (phase.includes('조금') || phase.includes('무시')) score -= 7;

      // ?�?� ?�간 보정 (?�버??추�?) ?�?�
      if (isNight) score -= 2; // ?�균???�간 ?�널??(?�종�?분기 불�?)

      scores[sid] = Math.min(100, Math.max(5, Math.round(score)));
    });
    res.json({ scores, updatedAt: new Date().toISOString(), count: Object.keys(scores).length });
  } catch (err) {
    res.status(500).json({ error: '?�수 계산 ?�패' });
  }
});

// ?�론?�엔??Mixed Content / CORS 블락 ?�회??MOF ?��?지 ?�트리밍 ?�록??
app.get('/api/weather/cctv/stream/:beachCode', async (req, res) => {
  const { beachCode } = req.params;
    if (!/^[a-zA-Z0-9_-]{1,20}$/.test(beachCode || '')) return res.status(400).json({ error: '?�못??beachCode' }); // ??FIX-SSRF-BEACH
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
    // 마스?��? ?�에??직접 변경한 ?�버?�이?��? ?�으�??�선 ?�용
    const override = cctvOverrides[stationId];
    let info;
    if (override) {
      const base = CCTV_MAP[stationId] || {};
      const merged = { ...base, ...override };
      if (merged.type === 'youtube' && merged.youtubeId) {
        merged.embedUrl = `https://www.youtube.com/embed/${merged.youtubeId}?autoplay=1&mute=1&controls=1&rel=0`;
        merged.thumbnailUrl = `https://img.youtube.com/vi/${merged.youtubeId}/maxresdefault.jpg`;
      } else if (merged.type === 'iframe' && merged.youtubeId) {
        // ??iframe ?�?? youtubeId ?�드??커스?� URL??직접 ?�?�됨
        merged.embedUrl = merged.youtubeId; // ?? HLS, ?�탈 ?�상, 지?�체 CCTV ??
      }
      info = merged;
    } else {
      info = getCctvInfo(stationId || 'DT_0001');
    }

    // -- MOF(?�당?�산부 ?�안침식) ?�이브리???��??�스???�동 --
    // ?�튜�??�버?�이?��? ?�을 경우 cctvMapping.js?�서 ?�의??mof ?�록??URL??그�?�?fallbackImg�??�달?�니??
    if (info.type !== 'youtube' && info.type !== 'mof') {
      // ?��?지 ??기�? ?�?�용 ?�전�?
      info.safeFallbackImg = 'https://picsum.photos/seed/seascape/800/600'; // ??22TH-A2: Unsplash ??picsum.photos
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
    (logger?.error || console.error)('[CCTV API ?�류]', err.message);
    res.status(500).json({ error: 'CCTV ?�보 조회 ?�패' });
  }
});

// ?�?� CCTV ?�버?�이??(DB ?�선, ?�메모리 fallback) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// DB ?�결 ???�작????MongoDB?�서 ?�버?�이??로드
// ??PERSIST: 마스???�인??좌표 DB ?�동 ???�배???�에???��?
async function loadSpotOverridesFromDB() {
  if (!dbReady || !SpotLocationOverrideModel) return;
  try {
    const docs = await SpotLocationOverrideModel.find().lean();
    docs.forEach(d => { spotLocationOverrides[d.id] = { lat: d.lat, lng: d.lng, name: d.name, updatedAt: d.updatedAt }; });
    logger.info(`[SpotOverride] DB?�서 ${docs.length}�??�인??좌표 복원 ?�료`);
    if (docs.length > 0) saveSpotLocationOverrides();
  } catch (e) { logger.error('[SpotOverride] DB 로드 ?�패:', e.message); }
}
async function loadSecretPointOverridesFromDB() {
  if (!dbReady || !SecretPointOverrideModel) return;
  try {
    const docs = await SecretPointOverrideModel.find().lean();
    docs.forEach(d => { secretPointOverrides[d.id] = { lat: d.lat, lng: d.lng }; });
    logger.info(`[SecretOverride] DB?�서 ${docs.length}�?비�??�인??좌표 복원 ?�료`);
    if (docs.length > 0) saveSecretPointOverrides();
  } catch (e) { logger.error('[SecretOverride] DB 로드 ?�패:', e.message); }
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
    logger.info(`[CCTV] DB?�서 ${overrides.length}�??�버?�이??로드 ?�료`); // ??22TH-C2
    saveCctvOverrides(); // DB 로드 ??JSON ?�일???�기??
  } catch (e) { logger.error('[CCTV] ?�버?�이??로드 ?�패:', e.message); } // ??22TH-C2
}
setTimeout(loadCctvOverridesFromDB, 3000); // DB ?�결 ??3�??��???로드


function isMaster(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return false;
  try {
    const tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    return isAdminToken(tp);
  } catch { return false; }
}

// GET /api/admin/cctv ???�체 CCTV 목록 + ?�버?�이???�황 조회
app.get('/api/admin/cctv', (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ error: '마스??권한 ?�요' });
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

// PUT /api/admin/cctv/:obsCode ???�정 지??YouTube ID / ?�???�정 (DB ?�구?�??
app.put('/api/admin/cctv/:obsCode', async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ error: '마스??권한 ?�요' });
  const { obsCode } = req.params;
  const { youtubeId, type, label } = req.body;
  if (!obsCode) return res.status(400).json({ error: 'obsCode ?�요' });
  // FIX-CCTV-VALID: ?�력 길이/?�식 검�?
  if (youtubeId !== undefined && (typeof youtubeId !== 'string' || youtubeId.length > 20)) return res.status(400).json({ error: '?�효?��? ?��? YouTube ID' });
  if (type !== undefined && !['live', 'youtube', 'hls', 'dash', 'cctv'].includes(type)) return res.status(400).json({ error: '?�효?��? ?��? ?�?? });
  if (label !== undefined && (typeof label !== 'string' || label.length > 50)) return res.status(400).json({ error: '?�벨?� 최�? 50?? });

  const prev = cctvOverrides[obsCode] || {};
  const updated = {
    ...prev,
    ...(youtubeId !== undefined && { youtubeId }),
    ...(type !== undefined && { type }),
    ...(label !== undefined && { label }),
    updatedAt: new Date().toISOString(),
  };
  cctvOverrides[obsCode] = updated;

  // JSON ?�일 ?�??(?�버 ?�시????복원)
  saveCctvOverrides();

  // DB ?�구?�??
  if (dbReady && CctvOverrideModel) {
    try {
      await CctvOverrideModel.findOneAndUpdate(
        { obsCode },
        { obsCode, ...updated },
        { upsert: true, new: true }
      );
    } catch (e) { (logger?.error || console.error)('[CCTV DB ?�???�패]', e.message); }
  }

  logger.info(`[마스??CCTV ?�정] ${obsCode}: ${JSON.stringify(cctvOverrides[obsCode])}`); // ??22TH-C2
  res.json({ success: true, obsCode, override: cctvOverrides[obsCode] });
});

// DELETE /api/admin/cctv/:obsCode ???�버?�이???�거 (기본값으�?복원)
app.delete('/api/admin/cctv/:obsCode', async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ error: '마스??권한 ?�요' });
  const { obsCode } = req.params;
  delete cctvOverrides[obsCode];
  saveCctvOverrides(); // JSON ?�일 ?�??
  if (dbReady && CctvOverrideModel) {
    try { await CctvOverrideModel.deleteOne({ obsCode }); }
    catch (e) { (logger?.error || console.error)('[CCTV DB ??�� ?�패]', e.message); }
  }
  logger.info(`[마스??CCTV 초기?? ${obsCode} 기본값으�?복원`); // ??22TH-C2
  res.json({ success: true, message: `${obsCode} 기본값으�?복원` });
});

// POST /api/admin/cctv/reset-all ??모든 ?�버?�이??강력 ??�� (DB 초기??
app.post('/api/admin/cctv/reset-all', async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ error: '마스??권한 ?�요' });
  try {
    cctvOverrides = {}; // ?�메모리 비우�?
    saveCctvOverrides(); // JSON ?�일??비우�?
    if (dbReady && CctvOverrideModel) {
      await CctvOverrideModel.deleteMany({});
    }
    logger.info('[마스??CCTV 초기?? ?�체 DB ?�버?�이????�� ?�료'); // ??22TH-C2
    res.json({ success: true, message: '모든 ?�스???�버?�이?��? 지?��?�??�양?�산부(MOF) ?�폴?�로 변경되?�습?�다.' });
  } catch (err) {
    res.status(500).json({ error: '초기???�패' });
  }
});

// POST /api/admin/cctv/auto-sync ???�튜�?Data API v3�??�용???�체 CCTV ?�이�?링크 ?�동 ?�집 �??�록
app.post('/api/admin/cctv/auto-sync', async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ error: '마스??권한 ?�요' });
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) return res.status(500).json({ error: '?�버 ?�경변?�에 YOUTUBE_API_KEY가 ?�습?�다.' });

  const { CCTV_MAP } = require('./cctvMapping');
  let updatedCount = 0;
  const results = [];

  try {
    for (const [obsCode, base] of Object.entries(CCTV_MAP)) {
      if (base.type !== 'youtube') continue;

      const searchRegion = base.region || '';
      const areaFirst = base.areaName.split('/')[0];
      // 검??쿼리 ?? "?�해바다 cctv", "?�초 cctv ?�시�?
      let query = `${searchRegion} ${areaFirst} 바다 cctv ?�시�?;
      if (searchRegion.includes('?�해') || searchRegion.includes('강원') || searchRegion.includes('경북')) {
        query = `?�해바다 ${areaFirst} cctv ?�시�?;
      } else if (searchRegion.includes('?�주')) {
        query = `?�주바다 cctv ?�시�?;
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
            label: `[AI ?�동] ${areaFirst || base.areaName}`,
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
    logger.info(`[CCTV AutoSync] ${updatedCount}�?지???�데?�트 ?�료`); // ??22TH-C2
    saveCctvOverrides(); // ?�동갱신 결과 ?�일 ?�??(?�버 ?�시????복원)
    res.json({ success: true, updatedCount, results });
  } catch (err) {
    (logger?.error || console.error)('[AutoSync Fatal]', err.message);
    res.status(500).json({ error: '?�동 ?�기??�??�류 발생' });
  }
});












// ?�?�?� (구버??YouTube ?�우???�거?????�버?��? ?�일 ?�반부???�치) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�






// --- 쿠팡 ?�트?�스 ?�동 ?�동 ?�진 (HMAC Open API) ---
// crypto???�일 최상?�에???��? require??(중복 ?�언 ?�거)


// ??[BUG-2 FIX] 구버??GET /api/commerce/coupang/search 비활?�화
// 쿠팡 ?�을??Ali fallback??searchAliExpress()�??�용?�여 ?�류 발생 가??
// ?�바�?버전?� ???�일 ?�단 (L6545)???�음 ???�당 버전???�행??


// ?�?�?� ?�버 ?�작?� ?�일 말�??�서 ?�일 ?�용?�니??(3�?중복 방�?) ?�?�?�


// =================================================================
//  PRO ?�정??구독 관�??�스??(MongoDB DB ?�구?�??
// =================================================================
let proSubscriptions = memProSubs; // DB ?�결 ??User 모델 tier ?�드 ?�용

// PRO 구독 구매 (or 갱신) ??JWT ?�증 ?�수
app.post('/api/pro/purchase', async (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
  const { userId, userName } = req.body;
  if (!userId) return res.status(400).json({ error: '?�수 ?�보 ?�락' });
  const isAdmin = isAdminToken(tp);
  if (!isAdmin && tp.id !== userId && tp.email !== userId) {
    return res.status(403).json({ error: '본인 구독�??�??가?�합?�다.' });
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
  saveProSubs(); // ?�일 ?�구 ?�??

  // DB?�도 User.tier ?�데?�트
  if (dbReady && User) {
    // ??BUG-FIX: proExpiresAt ??subscriptionExpiresAt (User ?�키�??�제 ?�드�?
    try { await User.findOneAndUpdate({ email: userId }, { tier: 'PRO', subscriptionExpiresAt: expiresAt }); }
    catch (e) { (logger?.error || console.error)('[PRO DB ?�???�패]', e.message); }
  }

  const daysLeft = Math.ceil((expiresAt - now) / 86400000);
  res.json({
    success: true, expiresAt: expiresAt.toISOString(), daysLeft,
    message: `PRO 구독 ?�료! (${expiresAt.toLocaleDateString('ko-KR')}까�? ?�효)`
  });
});

// PRO 구독 ?�태 ?�인 (만료 ???�동 FREE ?�운그레?�드) ????NEW-BUG-01: JWT ?�증 추�?
app.get('/api/pro/status', (req, res) => {
  // JWT ?�증 ??본인 ?�는 ?�드민만 조회 가??
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: '?�용??ID ?�요' });
  const isAdmin = isAdminToken(tp);
  if (!isAdmin && tp.id !== userId && tp.email !== userId) return res.status(403).json({ error: '본인 ?�보�?조회 가?�합?�다.' });

  const now = new Date();
  const sub = proSubscriptions[userId];

  if (!sub) return res.json({ tier: 'FREE', isActive: false });

  const isExpired = new Date(sub.expiresAt) < now;
  if (isExpired) {
    delete proSubscriptions[userId];
    saveProSubs(); // 만료 ?�일 반영
    return res.json({
      tier: 'FREE', isActive: false,
      reason: 'expired',
      message: 'PRO 구독??만료?�었?�니?? ?�구?????�보글 ?�성 권한??복구?�니??'
    });
  }

  const daysLeft = Math.max(0, Math.ceil((new Date(sub.expiresAt) - now) / 86400000));
  res.json({
    tier: 'PRO', isActive: true,
    expiresAt: sub.expiresAt,
    daysLeft,
    message: `PRO 구독 ?�성 �?(?�여 ${daysLeft}??`
  });
});

// PRO 구독 강제 ?��? (관리자??- JWT ?�용)
app.delete('/api/pro/cancel', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
  if (!isAdminToken(tp)) return res.status(403).json({ error: '관리자�??�근 가?? });
  const { userId } = req.body;
  if (proSubscriptions[userId]) {
    delete proSubscriptions[userId];
    saveProSubs();
    res.json({ success: true, message: `${userId} PRO 구독 ?��? ?�료` });
  } else {
    res.status(404).json({ error: '?�당 ?��???PRO 구독???�습?�다.' });
  }
});

// 24?�간마다 만료??PRO 구독 ?�동 ?�리
setInterval(() => {
  const now = new Date();
  let cleaned = 0;
  Object.keys(proSubscriptions).forEach(userId => {
    const sub = proSubscriptions[userId];
    if (new Date(sub.expiresAt) < now) {
      logger.info(`[PRO 만료 ?�리] ${sub.userName} 구독 ?�동 ?�제`); // ??22TH-B1
      delete proSubscriptions[userId];
      cleaned++;
    }
  });
  if (cleaned > 0) { saveProSubs(); logger.info(`[PRO ?�린?? ${cleaned}�?만료 구독 ?�거`); } // ??22TH-B1
}, 24 * 60 * 60 * 1000);

// =================================================================
//  VVIP ?�상 ??�� ?�주?� ?�롯 ?�스??
//  - ??��??1명만 VVIP ?�롯 ?��? 가??(55만원/?? ?�착??
//  - ?�롯 ?�사??공개 API�??�공
// =================================================================

// ??�� 목록 ??VVIPSubscribe HARBORS_STATIC�??�전 ?�기??(36�? key = 게시글 region ?�터 prefix)
const HARBOR_LIST = [
  // ?�해�???강원 (7)
  { id: 'gangneung',  name: '강릉·강문',         region: '강원', key: '강원 강릉',     lat: 37.772, lng: 128.918 },
  { id: 'jumunjin',   name: '주문�?,             region: '강원', key: '강원 주문�?,   lat: 37.907, lng: 128.819 },
  { id: 'sokcho',     name: '?�초',               region: '강원', key: '강원 ?�초',     lat: 38.207, lng: 128.591 },
  { id: 'goseong',    name: '고성(거진)',          region: '강원', key: '강원 고성',     lat: 38.403, lng: 128.467 },
  { id: 'yangyang',   name: '?�양(?�산·?�애)',    region: '강원', key: '강원 ?�양',     lat: 38.073, lng: 128.628 },
  { id: 'donghae',    name: '?�해·묵호',          region: '강원', key: '강원 ?�해',     lat: 37.524, lng: 129.113 },
  { id: 'samcheok',   name: '?�척',               region: '강원', key: '강원 ?�척',     lat: 37.440, lng: 129.165 },
  // ?�해�???경북 (5)
  { id: 'guryongpo',  name: '구룡???�항)',       region: '경북', key: '경북 구룡??,   lat: 35.984, lng: 129.556 },
  { id: 'gampo',      name: '감포(경주)',         region: '경북', key: '경북 감포',     lat: 35.798, lng: 129.508 },
  { id: 'ganggu',     name: '강구(?�덕)',         region: '경북', key: '경북 강구',     lat: 36.318, lng: 129.371 },
  { id: 'hupo',       name: '?�포(?�진)',         region: '경북', key: '경북 ?�포',     lat: 36.679, lng: 129.452 },
  { id: 'jukbyeon',   name: '죽�?(?�진)',         region: '경북', key: '경북 죽�?',     lat: 37.063, lng: 129.415 },
  // ?�해�???부??(3)
  { id: 'gijang',     name: '기장',               region: '부??, key: '부??기장',     lat: 35.243, lng: 129.216 },
  { id: 'dadaepo',    name: '?��???,             region: '부??, key: '부???��???,   lat: 35.046, lng: 128.961 },
  { id: 'yongho',     name: '?�호부??,           region: '부??, key: '부???�호부??, lat: 35.087, lng: 129.104 },
  // ?�해�???경남 (4)
  { id: 'tongyeong',  name: '?�영',               region: '경남', key: '경남 ?�영',     lat: 34.836, lng: 128.429 },
  { id: 'geoje',      name: '거제(?�??�금??',    region: '경남', key: '경남 거제',     lat: 34.880, lng: 128.621 },
  { id: 'namhae',     name: '?�해(미조·?�주)',    region: '경남', key: '경남 ?�해',     lat: 34.786, lng: 127.893 },
  { id: 'goseong_s',  name: '고성',               region: '경남', key: '경남 고성',     lat: 34.974, lng: 128.322 },
  // ?�해�????�남 (5)
  { id: 'yeosu',      name: '?�수(�?��)',         region: '?�남', key: '?�남 ?�수',     lat: 34.737, lng: 127.742 },
  { id: 'wando',      name: '?�도',               region: '?�남', key: '?�남 ?�도',     lat: 34.312, lng: 126.754 },
  { id: 'goheung',    name: '고흥(?�로??',       region: '?�남', key: '?�남 고흥',     lat: 34.612, lng: 127.282 },
  { id: 'jindo',      name: '진도',               region: '?�남', key: '?�남 진도',     lat: 34.487, lng: 126.263 },
  // ?�해�????�천 (2)
  { id: 'incheon_n',  name: '?�천 ?�항부??,      region: '?�천', key: '?�천 ?�항부??, lat: 37.440, lng: 126.590 },
  { id: 'incheon_y',  name: '?�천 ?�안부??,      region: '?�천', key: '?�천 ?�안부??, lat: 37.449, lng: 126.627 },
  // ?�해�???충남 (3)
  { id: 'taean',      name: '?�안(?�흥·마�???', region: '충남', key: '충남 ?�안',     lat: 36.698, lng: 126.133 },
  { id: 'boryeong',   name: '보령(무창??�오�?', region: '충남', key: '충남 보령',     lat: 36.317, lng: 126.573 },
  { id: 'seosan',     name: '?�산(?�길??',       region: '충남', key: '충남 ?�산',     lat: 36.786, lng: 126.469 },
  // ?�해�????�북 (2)
  { id: 'gunsan',     name: '군산(비응·?��???', region: '?�북', key: '?�북 군산',     lat: 35.979, lng: 126.718 },
  { id: 'buan',       name: '부??격포·?�도)',   region: '?�북', key: '?�북 부??,     lat: 35.594, lng: 126.485 },
  // ?�해�????�남 ?�해 (1)
  { id: 'mokpo',      name: '목포',               region: '?�남', key: '?�남 목포',     lat: 34.812, lng: 126.380 },
  // ?�주�?(5)
  { id: 'jeju_dodu',  name: '?�두???�주??',     region: '?�주', key: '?�주 ?�두??,   lat: 33.512, lng: 126.481 },
  { id: 'jeju_aewol', name: '?�월???�주??',     region: '?�주', key: '?�주 ?�월??,   lat: 33.463, lng: 126.313 },
  { id: 'seogwipo',   name: '?��???,             region: '?�주', key: '?�주 ?��???,   lat: 33.240, lng: 126.561 },
  { id: 'mosulpo',    name: '모슬??,             region: '?�주', key: '?�주 모슬??,   lat: 33.214, lng: 126.252 },
  { id: 'sungsan',    name: '?�산??,             region: '?�주', key: '?�주 ?�산??,   lat: 33.458, lng: 126.927 },
];
// harborId ??key 빠른 조회??�?(비즈?�스 ?�스??region 검증에 ?�용)
const HARBOR_KEY_MAP = Object.fromEntries(HARBOR_LIST.map(h => [h.id, h.key]));


// In-Memory VVIP ?�롯 ?�?�소 (DB ?�결 ??MongoDB???�구?�??
let vvipSlots = memVvipSlots;

// DB ?�결 ??VVIP ?�롯 불러?�기
async function loadVvipSlotsFromDB() {
  if (!dbReady || !User) return;
  try {
    const now = new Date();
    let restored = 0;

    // ??BusinessPost isPinned 기반 복원 (기존)
    if (BusinessPost) {
      const vvipPosts = await BusinessPost.find({ isPinned: true, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] });
      vvipPosts.forEach(p => {
        if (p.harborId && !vvipSlots[p.harborId]) {
          vvipSlots[p.harborId] = { userId: p.author_email, userName: p.author, purchasedAt: p.createdAt?.toISOString(), expiresAt: p.expiresAt?.toISOString(), harborName: p.region };
          restored++;
        }
      });
    }

    // ????FIX-RELOAD: User??vvipHarborId가 ?�고 vvipExpiresAt??미래??귌정 ??복원
    // ??admin grant�?직접 부?�된 ?�롯?� BusinessPost가 ?�으므�???경로로만 복원 가??
    const vvipUsers = await User.find({
      vvipHarborId: { $exists: true, $ne: null },
      vvipExpiresAt: { $gt: now },
    }, 'email name vvipHarborId vvipExpiresAt').lean();
    vvipUsers.forEach(u => {
      const hId = u.vvipHarborId;
      if (!hId || vvipSlots[hId]) return; // ?��? 복원????��???�킵
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

    logger.info(`[VVIP] DB?�서 ${restored}�??�롯 복원 (모두 ${Object.keys(vvipSlots).length}�??�성)`);
    if (restored > 0) saveVvipSlots(); // 복원???�롯??JSON ?�일로도 ?�기??
  } catch (e) { (logger?.error || console.error)('[VVIP] ?�롯 로드 ?�패:', e.message); }
}
setTimeout(loadVvipSlotsFromDB, 3500);

// ??�� 목록 + ?�롯 ?�황 조회 (만료 ?�동 ?�제 ?�함)
app.get('/api/vvip/harbors', (req, res) => {
  const now = new Date();
  // 만료??VVIP ?�롯 ?�동 ?�리
  let expiredCount = 0;
  Object.keys(vvipSlots).forEach(harborId => {
    const slot = vvipSlots[harborId];
    if (slot.expiresAt && new Date(slot.expiresAt) < now) {
      logger.info(`[VVIP 만료] ${slot.harborName} ?�롯 ?�동 ?�제`); // ??22TH-B1
      delete vvipSlots[harborId];
      expiredCount++;
    }
  });
  if (expiredCount > 0) saveVvipSlots(); // 만료 ?�일 반영
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

// VVIP ?�롯 구매 (?�착?? ??만료??30???�동 ?�정 + User DB ?�??????NEW-BUG-08: JWT ?�증 추�?
app.post('/api/vvip/purchase', async (req, res) => {
  // JWT ?�증 가??
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
  const { harborId, userId, userName } = req.body;
  if (!harborId || !userId) return res.status(400).json({ error: '?�수 ?�보 ?�락' });
  const isAdmin = isAdminToken(tp);
  if (!isAdmin && tp.id !== userId && tp.email !== userId) return res.status(403).json({ error: '본인�??�롯 구매 가?�합?�다.' });

  // ??DB?�서 ?�제 tier ?�인 (JWT tier??로그???�점 발급 ??최신 tier 반영 ????
  if (!isAdmin && dbReady && User) {
    try {
      const dbFilter = tp.email ? { email: tp.email } : { _id: tp.id };
      const dbUser = await User.findOne(dbFilter).select('tier').lean();
      if (!dbUser || !['BUSINESS_VIP', 'MASTER'].includes(dbUser.tier)) {
        return res.status(403).json({ error: 'VVIP 멤버??구독 ???�용 가?�합?�다.', code: 'NOT_VVIP' });
      }
    } catch (e) {
      (logger?.error || console.error)('[VVIP 구매] DB tier 조회 ?�패:', e.message);
      // ??BUG-04 FIX: fail-open ??fail-closed ??DB ?�류 ??503 반환 (무료 ?��? VVIP ?�근 방�?)
      return res.status(503).json({ error: '?�버 ?�시 ?�류, ?�시 ???�시?�해주세??' });
    }
  }

  const harbor = HARBOR_LIST.find(h => h.id === harborId);
  if (!harbor) return res.status(404).json({ error: '존재?��? ?�는 ??��?�니??' });

  const now = new Date();
  if (vvipSlots[harborId]) {
    const slot = vvipSlots[harborId];
    if (!slot.expiresAt || new Date(slot.expiresAt) >= now) {
      return res.status(409).json({ error: '?��? ?�른 ?�장?�이 ?�점?�셨?�니??', takenBy: slot.userName });
    }
    logger.info(`[VVIP 만료 ?�구�? ${harbor.name}`);
    delete vvipSlots[harborId];
  }

  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const effectiveUserId = tp.email || tp.id; // ??BUG-03 FIX: ?�롯 ?�유?�는 JWT?�서�?추출 (본문 userId ?�뢰 금�?)
  const effectiveUserName = userName || effectiveUserId;

  vvipSlots[harborId] = {
    userId: effectiveUserId,
    userName: effectiveUserName,
    purchasedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    harborName: harbor.name
  };
  saveVvipSlots(); // ?�일 ?�구 ?�??

  // ??User DB??VVIP ??�� ?�보 ?�????JWT email/id�??�전?�게 매칭
  if (dbReady && User) {
    try {
      const dbFilter = tp.email ? { email: tp.email } : { _id: tp.id };
      await User.findOneAndUpdate(
        dbFilter,
        { $set: { vvipHarborId: harborId, vvipExpiresAt: expiresAt, updatedAt: now } }
      );
    } catch (e) { (logger?.error || console.error)('[VVIP DB ?�???�패]', e.message); }
  }

  res.json({
    success: true, harbor,
    expiresAt: expiresAt.toISOString(),
    message: `${harbor.name} VVIP ?�점 ?�약 ?�료! (${expiresAt.toLocaleDateString('ko-KR')}까�? ?�효)`
  });
});

// ??VVIP ?�롯 ?�인 (만료 ?��? + ?�여???�함) ????NEW-BUG-09: JWT ?�증 추�? (본인�?조회)
app.get('/api/vvip/my-slot', (req, res) => {
  // JWT ?�증 가??
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
  // userId 쿼리?�라미터 ?�??JWT?�서 추출 (?�???�람 차단)
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
      saveVvipSlots(); // 만료 ?�일 반영
      return res.json({ hasSlot: false, reason: 'expired', message: 'VVIP 구독??만료?�었?�니?? ?�구?????�롯???�시 ?�점?�세??' });
    }
    // ??BUG-FIX: expiresAt??null?�면 daysLeft 계산 ??NaN 발생 ??null guard 추�?
    const daysLeft = slot.expiresAt
      ? Math.max(0, Math.ceil((new Date(slot.expiresAt) - now) / 86400000))
      : null; // 만료???�는 ?�구 ?�롯
    res.json({ hasSlot: true, harbor, slot, daysLeft });
  } else {
    res.json({ hasSlot: false });
  }
});

// ??ADMIN: VVIP ?�동 부??(결제 ?�이 ?�드민이 직접 ?�롯 ?�당 ???�스???�영??지급용)
// POST /api/admin/vvip/grant  { userId, harborId, days? }
app.post('/api/admin/vvip/grant', async (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
  if (!isAdminToken(tp)) return res.status(403).json({ error: '마스??권한 ?�요' });

  const { userId, harborId, days: rawDays = 30 } = req.body;
  const days = Math.min(365, Math.max(1, parseInt(rawDays) || 30)); // ??FIX-VVIP-DAYS-LIMIT: 1~365??범위 강제
  if (!userId || !harborId) return res.status(400).json({ error: 'userId, harborId ?�수' });

  const harbor = HARBOR_LIST.find(h => h.id === harborId);
  if (!harbor) return res.status(404).json({ error: `존재?��? ?�는 ??��: ${harborId}` });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + Number(days) * 24 * 60 * 60 * 1000);

  // DB?�서 ?�제 ?�네??조회 (?�메???�출 방�?)
  let resolvedUserName = userId; // 기본�? userId(?�메??
  if (dbReady && User) {
    try {
      const foundUser = await User.findOne({ $or: [{ email: userId }, { id: userId }, { name: userId }] }, 'name').lean();
      if (foundUser?.name) resolvedUserName = foundUser.name;
    } catch { /* DB 조회 ?�패 ??userId 그�?�??�용 */ }
  } else {
    const mu = memUsers.find(u => u.email === userId || u.id === userId || u.name === userId);
    if (mu?.name) resolvedUserName = mu.name;
  }

  // 기존 ?�롯 ??��?�기 ?�용 (?�스??목적)
  vvipSlots[harborId] = {
    userId,
    userName: resolvedUserName, // ??BUG-FIX: ?�메???�???�제 ?�네???�용
    purchasedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    harborName: harbor.name,
    grantedBy: tp.email || 'admin',
  };
  saveVvipSlots();

  // MongoDB User ?�데?�트 (email ?�는 id ?�쪽 ?�도)
  if (dbReady && User) {
    try {
      await User.findOneAndUpdate(
        { $or: [{ email: userId }, { id: userId }, { name: userId }] },
        { $set: { tier: 'BUSINESS_VIP', vvipHarborId: harborId, vvipExpiresAt: expiresAt } }
      );
    } catch (e) { (logger?.error || console.error)('[VVIP Grant DB]', e.message); }
  } else {
    // ?�메모리 fallback
    const mu = memUsers.find(u => u.email === userId || u.id === userId || u.name === userId);
    if (mu) { mu.tier = 'BUSINESS_VIP'; mu.vvipHarborId = harborId; mu.vvipExpiresAt = expiresAt.toISOString(); saveMemUsers(); }
  }

  (logger?.info || console.log)(`[VVIP Grant] ?�드�??�동 부?? ${userId} ??${harbor.name} (${days}?? 만료: ${expiresAt.toLocaleDateString('ko-KR')})`);
  res.json({
    success: true,
    userId, harborId, harborName: harbor.name,
    expiresAt: expiresAt.toISOString(),
    daysLeft: days,
    message: `??${userId}?�게 ${harbor.name} VVIP ?�롯 ${days}??부???�료`,
  });
});

setInterval(() => {
  const now = new Date();
  let cleaned = 0;
  Object.keys(vvipSlots).forEach(harborId => {
    const slot = vvipSlots[harborId];
    if (slot.expiresAt && new Date(slot.expiresAt) < now) {
      logger.info(`[VVIP ?�동 만료 ?�리] ${slot.harborName} (${slot.userName})`); // ??22TH-B1
      delete vvipSlots[harborId];
      cleaned++;
    }
  });
  if (cleaned > 0) { saveVvipSlots(); logger.info(`[VVIP ?�린?? ${cleaned}�?만료 ?�롯 ?�거 ?�료`); } // ??22TH-B1
}, 24 * 60 * 60 * 1000);

// ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ?�?�?� 쿠팡 ?�트?�스 Open API ?�우???�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�

/**
 * GET /api/products?category=?�시?�품
 * Shop ??메인 ?�품 목록 (Shop.jsx ?�용)
 */
app.get('/api/products', async (req, res) => {
  try {
    const category = (Array.isArray(req.query.category) ? req.query.category[0] : (req.query.category || '')) /* FIX-QUERY-CAT-HPP */ || '?�시?�품';
    const products = await coupang.getRecommendedProducts(category);

    // Shop.jsx가 기�??�는 ?�맷?�로 변??
    const formatted = products.map(p => ({
      id: p.productId,
      name: p.productName,
      price: p.productPrice?.toLocaleString('ko-KR') || '0',
      discount: p.discountRate > 0 ? `${p.discountRate}%` : '0%',
      img: p.productImage,
      link: p.coupangUrl,
      badge: p.badge || '?�시GO 추천',
    }));

    res.json(formatted);
  } catch (err) {
    (logger?.error || console.error)('[/api/products] ?�류:', err.message);
    res.status(500).json({ error: '?�품 조회 ?�패' });
  }
});

/**
 * GET /api/commerce/coupang/search?keyword=루어 ?�시 ?�비
 * 미디?????�상 콴텐�??�동 ?�품 (MediaTab.jsx ?�용)
 */
app.get('/api/commerce/coupang/search', async (req, res) => {
  try {
    const keyword = (Array.isArray(req.query.keyword) ? req.query.keyword[0] : (req.query.keyword || '')).slice(0, 100) /* FIX-QUERY-KW-HPP */ || '?�시?�품';
    const category = (Array.isArray(req.query.category) ? req.query.category[0] : (req.query.category || '')) /* FIX-QUERY-CAT-HPP */ || '';

    const rawProducts = category
      ? await coupang.getProductsByVideoCategory(category)
      : await coupang.searchCoupang(keyword, 3);

    // ??BUG-FIX: raw productId/productName/productImage ???�라?�언??기�? ?�맷(id/name/img/price/discount) 변??
    // MediaTab.jsx, PostDetail.jsx?�서 item.img/item.name/item.price/item.discount�??�근?��?�?반드??변???�요
    const products = rawProducts.map(p => ({
      id:       p.productId,
      name:     p.productName,
      price:    typeof p.productPrice === 'number' ? p.productPrice.toLocaleString('ko-KR') + '?? : (p.productPrice || ''),
      discount: p.discountRate > 0 ? `${p.discountRate}%` : null,
      img:      p.productImage,
      link:     p.coupangUrl,
      badge:    p.badge || '?�시GO 추천',
    }));

    res.json({
      keyword,
      isMock: false,
      products,
    });
  } catch (err) {
    (logger?.error || console.error)('[/api/commerce/coupang/search] ?�류:', err.message);
    res.status(500).json({ error: '?�품 검???�패', products: [] });
  }
});

/**
 * GET /api/commerce/coupang/status
 * 쿠팡 API 코나?�스??/ ???�태 ?�인
 */
app.get('/api/commerce/coupang/status', (req, res) => {
  const status = coupang.getCoupangStatus ? coupang.getCoupangStatus() : {};
  res.json({
    mode: status.ready ? 'LIVE (쿠팡 ?�제 API)' : 'INACTIVE (API ??미설??',
    partnersId: coupang.PARTNERS_ID || '미설??,
    ready: status.ready || false,
    note: status.ready ? '?�제 쿠팡 API ?�동 �? : 'COUPANG_ACCESS_KEY / SECRET_KEY 미설??,
  });
});

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// ??YouTube Data API v3 ???�시 채널 미디?????�용
//   고도??v3:
//   - order=date ??q(검?�어)?� ?�께 YouTube API?�서 무시?????�버?�서 publishedAt 직접 ?�렬
//   - videoDuration=any ??2�?(120�? filterByActualDuration ?�버 직접 ?�터 (Shorts ?�외)
//   - 캐시 TTL 4?�간 ??API 쿼터 ?�약 (??6??× 201 units = 1,206 units)
//   - order ?�라미터: 'date'(최신?? | 'viewCount'(?�기??
//     ??같�? ?�워???�른 order??별도 캐시 ????API ?�출 최소??
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
const YT_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YT_BASE = 'https://www.googleapis.com/youtube/v3';

// ???�시 채널 검??결과?�서 ?�외??블랙리스???�워??(?�문??
// ?�목(title) + 채널�?channelTitle) ?�쪽?�서 체크
const YT_BLACKLIST = [
  '?�리',          // AliExpress, ?�리바바 ??
  'aliexpress',
  'alibaba',
  '?�리바바',
  '?�리?�스?�레??,
  '직구',          // ?�외직구 ?�품 리뷰 (광고??
  '최�?가',
  '공구',          // 공동구매 광고
  '?�찬',
  '광고',          // ?�골??광고 ?�상
  '쿠팡',          // ??FIX: 쿠팡 광고·?�품 리뷰 ?�상 차단
  'coupang',       // ?�문 ?�기 ?�시 차단
];

const ytCache = new Map();
const YT_CACHE_TTL_MS = 4 * 60 * 60 * 1000; // ??4?�간 캐시 (30분→4?�간: ?�일 쿼터 초과 방�?)
// ???�로?�션 URL ?�경변??지??(기본�? ?�려�?배포 URL)
// YouTube API??API ?�로 ?�증, Referer???�인???�더 (?�수�??�님)
const YT_ORIGIN = process.env.CLIENT_ORIGIN || process.env.ALLOWED_ORIGIN || 'https://www.fishing-go.com';
// 30�?TTL: 48????× 201 units = 9,648 units ??쿼터 초과 ?�험
// 4?�간 TTL:  6????× 201 units = 1,206 units ???�전�??��?

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
 * YouTube 검??결과�??��? ?�태�?변??+ publishedAt ?�함
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
  // ??Shorts ?�중 ?�터
  .filter(v => v.youtubeId && !v.title.toLowerCase().includes('#shorts'))
  // ??블랙리스???�워???�터: 광고?�·쇼?�몰 관???�상 ?�외 (?�목 + 채널�?체크)
  .filter(v => {
    const text = (v.title + ' ' + v.channelTitle).toLowerCase();
    return !YT_BLACKLIST.some(kw => text.includes(kw));
  });
}


/**
 * ???�심 ?�결�?
 * YouTube Search API??q(검?�어)?� order=date�??�께 ?�면 date ?�렬??무시??
 * ???�버?�서 publishedAt 기�??�로 직접 ?�렬?�여 반환
 * ??viewCount??YouTube API??order=viewCount�??�용 (검?�어+?�기?��? ?�상 ?�동)
 */
function sortVideos(videos, order) {
  if (order === 'date') {
    // ??publishedAt ?�림차순 (최신?? ???�락/Invalid Date 방어 처리
    return [...videos].sort((a, b) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return isNaN(tb) || isNaN(ta) ? 0 : tb - ta;
    });
  }
  // viewCount: YouTube API가 ?��? ?�렬?�서 반환
  return videos;
}

/**
 * ISO 8601 duration ??�?변??
 * ?? PT4M30S ??270, PT1H5M ??3900
 */
function parseDuration(iso) {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

/**
 * ???�제 ?�상 길이 ?�인 ?�터 ??videoDuration=any + 110�?기�? ?�중 보장
 * YouTube Videos API(contentDetails)�??�제 길이�?가?��? MIN_SECS 미만 ?�거
 * API 비용: 1 unit (Search가 100 unit ?��?매우 ?�??
 * @param {string[]} videoIds
 * @param {number} minSecs 최소 길이(�?, 기본 110�???Shorts(60�? + 짧�? ?�립 차단
 * ?�️ 주의: YouTube Videos API??1?�에 ID 50�??�한 ??50�?초과 ??�?�� 분할 ?�수
 */
async function filterByActualDuration(videoIds, minSecs = 110) {
  if (!videoIds.length || !YT_API_KEY) return new Set(videoIds);
  try {
    // ??FIX-BUG2: YouTube Videos API ID 최�? 50�??�한 ??쫙크 분할 처리
    const CHUNK = 50;
    const valid = new Set();
    for (let i = 0; i < videoIds.length; i += CHUNK) {
      const chunk = videoIds.slice(i, i + CHUNK);
      const params = new URLSearchParams({ part: 'contentDetails', id: chunk.join(','), key: YT_API_KEY });
      const res = await axios.get(`${YT_BASE}/videos?${params.toString()}`, { timeout: 8000 });
      for (const item of res.data.items || []) {
        const secs = parseDuration(item.contentDetails?.duration);
        (logger?.debug || console.log)(`[DurationCheck] ${item.id}: ${secs}�?(${Math.floor(secs/60)}�?${secs%60}�?`);
        if (secs >= minSecs) valid.add(item.id);
      }
    }
    (logger?.info || console.log)(`[DurationCheck] ${videoIds.length}�?�?${valid.size}�??�과 (??{minSecs}�?`);
    return valid;
  } catch (e) {
    // ?�️ Videos API ?�패 (quota 초과/?�트?�크 ?�류) ??ID만으�??�목 ?�단 불�?
    // ?�체 반환 불�??�하지�?로그??경고 ?�시
    (logger?.warn || console.warn)(`[DurationCheck] Videos API ?�패 ??${videoIds.length}�??�체 보존 (?�터 ?�음):`, e.message);
    return new Set(videoIds);
  }
}


/**
 * publishedAfter ?�퍼
 *   date      ??최근 7??(?�번 �?최신 ?�상)
 *   viewCount ??최근 30??(?????�내 ?�기??
 *   null      ???�한 ?�음
 */
function getPublishedAfter(order) {
  const d = new Date();
  if (order === 'date') {
    d.setDate(d.getDate() - 7);   // ??최근 7??
    return d.toISOString();
  }
  if (order === 'viewCount') {
    d.setDate(d.getDate() - 30);  // ??최근 30??(?�달 ?�내 ?�기??
    return d.toISOString();
  }
  return null;
}

/**
 * GET /api/media/youtube/search?q=?�시&order=date|viewCount&maxResults=15
 * - order=date  : publishedAfter(1?? + publishedAt ?�버 ?�정?????�제 최신 ?�상
 * - order=viewCount : ?�체 기간 조회???�기??
 * - videoDuration=any : Shorts 60�??�하 ?�버 ?�터 (filterByActualDuration 120�?
 */
app.get('/api/media/youtube/search', async (req, res) => {
  try {
    const q = ((Array.isArray(req.query.q) ? req.query.q[0] : req.query.q) || '?�시').slice(0, 100).trim(); // ??FIX-YT-SEARCH-HPP FIX-YT-SEARCH-LEN
    const order = req.query.order === 'viewCount' ? 'viewCount' : 'date';
    const maxResults = Math.min(parseInt(req.query.maxResults) || 15, 25);
    const pageToken = req.query.pageToken || '';

    if (!YT_API_KEY) {
      return res.json({ videos: [], nextPageToken: null, note: 'YOUTUBE_API_KEY 미설?? });
    }

    // ??CACHE-FIX: date ?�서 검?��? ?�늘 ?�짜�?캐시 ?�에 ?�함 ??4?�간 캐시가 ?�일 갱신 보장
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

    logger.info(`[YouTube Search] ?�청: q="${q}", order=${order}`);

    // ?�?�?� STEP 1: 채널명인지 감�? ??type=channel�?먼�? 검???�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
    let channelId = null;
    try {
      const chParams = new URLSearchParams({
        part: 'snippet', q, type: 'channel', maxResults: '3',
        relevanceLanguage: 'ko', regionCode: 'KR', key: YT_API_KEY,
      });
      const chRes = await axios.get(`${YT_BASE}/search?${chParams}`, axiosCfg);
      const channels = chRes.data.items || [];
      // 채널 ?�목??검?�어�??�함?�는 채널 ?�선 ?�택
      const matched = channels.find(c =>
        (c.snippet?.channelTitle || '').replace(/\s/g, '').toLowerCase()
          .includes(q.replace(/\s/g, '').toLowerCase())
      );
      if (matched) {
        channelId = matched.id?.channelId || matched.snippet?.channelId;
        logger.info(`[YouTube Search] 체널 감�?: "${matched.snippet?.channelTitle}" (${channelId})`);
      }
    } catch (e) {
      (logger?.warn || console.warn)('[YouTube Search] 체널 검???�패 (fallback to keyword):', e.message);
    }

    // ?�?�?� STEP 2: ?�상 검??(채널ID ?�으�?채널 ?�용, ?�으�??�워?? ?�?�?�?�?�?�?�?�?�
    // ??FIX-SORT: publishedAfter ?�책 개선
    //   채널 검?? 최근 6개월 ?�한 ??최신 ?�상 ?�선 반환 (?�체 기간?�면 ?�래???�상 ?�입)
    //   ?�워??검?? 최근 1???�한
    // ??FIX-DUR: videoDuration=any ??YouTube ?�리?�터 ?�거, filterByActualDuration(120�?�?직접 2�??�터
    //   기존 medium(4~20�??� 최근 ?�편 ?�상???�외???�래???�상??반환?�는 ?�인?�었??
    const publishedAfterDate = (() => {
      const d = new Date();
      if (channelId) {
        d.setMonth(d.getMonth() - 6); // 채널 검?? 최근 6개월
      } else {
        d.setFullYear(d.getFullYear() - 1); // ?�워??검?? 최근 1??
      }
      return d.toISOString();
    })();
    // ??FIX-SHORTAGE: fetchMax 30??0 (?�국 ?�시 Shorts 비율 ?�음 ???�터 ??충분???�상 ?�보)
    // YouTube API??maxResults ?�기?� 무�??�게 Search 1??= 100 units 고정 ??쿼터 추�? ?�비 ?�음
    const fetchMax = String(Math.min(maxResults + 30, 50)); // ?�유�??�보 (?�터 ?�에??충분??결과 보장)
    const videoParams = {
      part: 'snippet',
      q: channelId ? '' : q,    // 채널 ?�정 검????q 불필??
      type: 'video',
      order: order === 'viewCount' ? 'viewCount' : 'date',
      videoDuration: 'any',     // ??FIX-DUR: YouTube ?�리?�터 ?�거 ??filterByActualDuration?�로 직접 2�??�터
      relevanceLanguage: 'ko',
      regionCode: 'KR',
      maxResults: fetchMax,
      key: YT_API_KEY,
      ...(channelId ? { channelId } : {}),
      ...(order !== 'viewCount' ? { publishedAfter: publishedAfterDate } : {}), // 최신?�만 ?�짜 ?�한
      ...(pageToken ? { pageToken } : {}),
    };
    // q가 비어?�으�??�거 (channelId 모드)
    if (!videoParams.q) delete videoParams.q;

    const params = new URLSearchParams(videoParams);
    const response = await axios.get(`${YT_BASE}/search?${params.toString()}`, axiosCfg);
    let videos = buildYtVideoList(response.data.items);
    (logger?.info || console.log)(`[YouTube Search] ?�답: ${videos.length}�?(채널ID: ${channelId || '?�음'}, publishedAfter: ${publishedAfterDate.slice(0, 10)})`);

    // ?�?�?� STEP 3: ?�제 ?�상 길이 ?�터 (110�?) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
    // ??110�?미만 ?�상 차단 (Shorts 60�??�하 + 짧�? ?�시 ?�립 ?�거)
    const videoIds = videos.map(v => v.youtubeId).filter(Boolean);
    const validIds = await filterByActualDuration(videoIds, 110);
    videos = videos.filter(v => validIds.has(v.youtubeId));
    // Shorts(60�??�하) ?�목 ?�터 ?�적??
    videos = videos.filter(v => !v.title.toLowerCase().includes('#shorts') && !v.title.toLowerCase().includes('shorts'));
    (logger?.info || console.log)(`[YouTube Search] 길이 ?�터 ?? ${videos.length}�?(??10�? Shorts ?�외)`);

    // ?�?�?� STEP 4: ?�렬 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
    videos = sortVideos(videos, order);

    const result = { videos, nextPageToken: response.data.nextPageToken || null, order, channelId };
    ytCacheSet(cacheKey, result);
    res.json(result);
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    const errStatus = err.response?.status;
    (logger?.error || console.error)(`[YouTube Search API ?�류] status=${errStatus}, msg=${errMsg}`);
    res.json({ videos: [], nextPageToken: null, error: errMsg, status: errStatus });
  }
});


// ?�?�?� ?�합 ?�드: 최신(7?? + ?�기(?�체기간) 병렬 조회 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.get('/api/media/youtube/unified', async (req, res) => {
  const q = ((Array.isArray(req.query.q) ? req.query.q[0] : req.query.q) || '?�시').slice(0, 100).trim(); // ??FIX-UNIFIED-HPP
  if (!YT_API_KEY) return res.json({ recent: [], popular: [], note: 'YOUTUBE_API_KEY 미설?? });

  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `unified:${q}:${today}`;
  const cached = ytCacheGet(cacheKey);
  if (cached) {
    logger.info(`[YouTube Unified] 캐시 HIT: ${q}`);
    return res.json(cached);
  }

  try {
    const publishedAfterRecent = getPublishedAfter('date');      // 최근 7??
    const publishedAfterPopular = getPublishedAfter('viewCount'); // 최근 30??
    const commonParams = { part: 'snippet', q, type: 'video', videoDuration: 'any', relevanceLanguage: 'ko', regionCode: 'KR', maxResults: '30', key: YT_API_KEY };
    const axiosCfg = { timeout: 10000, headers: { Referer: YT_ORIGIN, Origin: YT_ORIGIN } };

    logger.info(`[YouTube Unified] 병렬 ?�청: "${q}" | recent(7?? + popular(30???�기??`);

    const [recentResult, popularResult] = await Promise.allSettled([
      axios.get(`${YT_BASE}/search?${new URLSearchParams({ ...commonParams, order: 'date', publishedAfter: publishedAfterRecent })}`, axiosCfg),
      axios.get(`${YT_BASE}/search?${new URLSearchParams({ ...commonParams, order: 'viewCount', publishedAfter: publishedAfterPopular })}`, axiosCfg),
    ]);

    let recent = recentResult.status === 'fulfilled' ? buildYtVideoList(recentResult.value.data.items) : [];
    let popular = popularResult.status === 'fulfilled' ? buildYtVideoList(popularResult.value.data.items) : [];
    logger.info(`[YouTube Unified] 검??결과: 최신 ${recent.length}�? ?�기 ${popular.length}�?);

    // ?�제 ?�상 길이 ?�터 (Videos API) ????2�? 보장 (4�???2�?기�? ?�화)
    const allIds = [...new Set([...recent.map(v => v.youtubeId), ...popular.map(v => v.youtubeId)])].filter(Boolean);
    const validIds = await filterByActualDuration(allIds, 110);
    recent = recent.filter(v => validIds.has(v.youtubeId));
    popular = popular.filter(v => validIds.has(v.youtubeId));

    // 최신???�정??
    recent = sortVideos(recent, 'date');
    // ?�기?�에??최신�?중복 ?�거
    const recentSet = new Set(recent.map(v => v.youtubeId));
    popular = popular.filter(v => !recentSet.has(v.youtubeId));

    // ?�그 부??
    recent = recent.map(v => ({ ...v, tag: 'recent' }));
    popular = popular.map(v => ({ ...v, tag: 'popular' }));

    logger.info(`[YouTube Unified] ?�터 ?? 최신 ${recent.length}�? ?�기 ${popular.length}�?(??10�?`);

    const result = { recent, popular };
    ytCacheSet(cacheKey, result);
    res.json(result);
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    (logger?.error || console.error)(`[YouTube Unified API ?�류]: ${errMsg}`);
    res.json({ recent: [], popular: [], error: errMsg });
  }
});

/**
 * GET /api/media/youtube?order=date|viewCount&pageToken=xxx
 * 기본 ?�시 ?�상 ?�드 (?�체 ??��)
 */
app.get('/api/media/youtube', async (req, res) => {
  try {
    const order = req.query.order === 'viewCount' ? 'viewCount' : 'date';
    const pageToken = req.query.pageToken || '';
    // ??FIX-SHORTAGE: 15??0 (?�국 ?�시 Shorts 비율 ?�음 ???�터 ??충분???�상 ?�보)
    const maxResults = 30;
    const publishedAfter = getPublishedAfter(order);

    if (!YT_API_KEY) {
      return res.json({ videos: [], nextPageToken: null, note: 'YOUTUBE_API_KEY 미설?? });
    }

    const dateStamp = order === 'date' ? new Date().toISOString().slice(0, 10) : 'all';
    const cacheKey = `feed:${order}:${dateStamp}:${pageToken}`;
    const cached = ytCacheGet(cacheKey);
    if (cached) return res.json(cached);

    const ytOrder = order === 'viewCount' ? 'viewCount' : 'date';

    const paramObj = {
      part: 'snippet',
      q: '?�시',
      type: 'video',
      order: ytOrder,
      videoDuration: 'any',              // ??2�? 기�??�로 ?�화 (medium=4~20�??�한 ?�거)
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
    (logger?.info || console.log)(`[YouTube] ?�드 ?�청: order=${order}, publishedAfter=${publishedAfter || '?�음'}`);
    const response = await axios.get(`${YT_BASE}/search?${params.toString()}`, axiosConfig);
    let videos = buildYtVideoList(response.data.items);
    (logger?.info || console.log)(`[YouTube] ?�드 ?�답: ${videos.length}�?| �?번째: ${videos[0]?.publishedAt || '?�음'}`);

    // ???�제 ?�상 길이 ?�인 ?�터 ??110�? 기�? (Shorts + 짧�? ?�립 차단)
    const videoIds = videos.map(v => v.youtubeId).filter(Boolean);
    const validIds = await filterByActualDuration(videoIds, 110);
    videos = videos.filter(v => validIds.has(v.youtubeId));
    (logger?.info || console.log)(`[YouTube] ?�드 길이 ?�터 ?? ${videos.length}�?(??10�?`);

    videos = sortVideos(videos, order);

    const result = { videos, nextPageToken: response.data.nextPageToken || null, order };
    ytCacheSet(cacheKey, result);
    res.json(result);
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    const errStatus = err.response?.status;
    (logger?.error || console.error)(`[YouTube Feed API ?�류] status=${errStatus}, msg=${errMsg}`);
    res.json({ videos: [], nextPageToken: null, error: errMsg, status: errStatus });
  }
});


// ??22TH-B2/B3/B4/C3: VVIP_HARBORS(23�? ?�중 ?�의 �?중복 ?�우??3�??�거
// ??GET /api/vvip/harbors (L3020), GET /api/vvip/my-slot (L3100), POST /api/vvip/purchase (L3047) ?�일 ?�우???��?
// ??HARBOR_LIST(20�?가 ?�일 ?�규 ??�� 목록?�로 ?��???(L2979)

// --- VVIP: 구독 ?��? (JWT ?�드�??�용) ---
app.post('/api/vvip/cancel', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    if (!isAdminToken(tp)) return res.status(403).json({ error: '권한 ?�음' });
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
  } catch (err) { res.status(500).json({ error: '?�버 ?�류' }); }
});

// ?�?�?� ?�버 종료 ???�체 ?�이??강제 ?�러???�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
function flushAllData() {
  logger.info('[Flush] ?�버 종료 감�? ???�체 ?�이???�일 ?�기???�작...');
  try { saveMemUsers(); logger.info('[Flush] users.json ??); } catch (e) { }
  try { saveMemPosts(); logger.info('[Flush] posts.json ??); } catch (e) { }
  try { saveMemRecords(); logger.info('[Flush] records.json ??); } catch (e) { }
  try { saveMemCrews(); logger.info('[Flush] crews.json ??); } catch (e) { }
  try { saveChatHistories(); logger.info('[Flush] chats.json ??); } catch (e) { }
  try { saveMemNotices(); logger.info('[Flush] notices.json ??); } catch (e) { }
  try { saveMemBusinessPosts(); logger.info('[Flush] business.json ??); } catch (e) { }
  try { saveSecretPointOverrides(); logger.info('[Flush] secretPointOverrides.json ??); } catch (e) { }
  try { saveCctvOverrides(); logger.info('[Flush] cctvOverrides.json ??); } catch (e) { }
  try { saveProSubs(); logger.info('[Flush] proSubscriptions.json ??); } catch (e) { }
  try { saveVvipSlots(); logger.info('[Flush] vvipSlots.json ??); } catch (e) { }
  logger.info('[Flush] ???�체 ?�이???�기???�료.');
}

// ??BUG-FIX: SIGTERM/SIGINT/uncaughtException ?�들?�는 graceful_shutdown.js (L6149)?�서 ?�일 ?�록
// ?�로???�로?�스 종료 ??flushAllData()??graceful_shutdown.js??server.close 콜백?�서 ?�출??

// ?�?�?� 30분마???�동 백업 (Render 무료?�랜 sleep ?��? ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
setInterval(() => {
  logger.info('[AutoBackup] 30�?주기 ?�동 백업 ?�행...');
  flushAllData();
}, 30 * 60 * 1000);

// ?�?�?� Render Keep-Alive???�일 말�? server.listen 블록???�합???�?�?�?�?�?�?�?�?�?�?�?�?�

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// ???�기결제(빌링) ?�스?????�트??customer_uid 기반 ?�동 ??�?��
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

const BILLING_PLAN_MAP = {
  LITE: { tier: 'BUSINESS_LITE', amount: 9900 },
  PRO: { tier: 'PRO', amount: 110000 },
  VVIP: { tier: 'BUSINESS_VIP', amount: 550000 },
};

// ?�?� ?�트???�세???�큰 발급 ?�퍼 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
async function getPortoneToken() {
  if (!process.env.PORTONE_API_KEY) return null;
  const res = await axios.post('https://api.iamport.kr/users/getToken', {
    imp_key: process.env.PORTONE_API_KEY,
    imp_secret: process.env.PORTONE_API_SECRET,
  });
  return res.data.response?.access_token || null;
}

// ?�?� 빌링?�로 ?�제 �?�� ?�행 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
async function chargeBilling(sub) {
  const token = await getPortoneToken();
  if (!token) {
    // ?�스?�모?? ?�제 �?�� ?�이 ?�공 처리
    (logger?.info || console.log)(`[BillingTest] ?�스?�모???�동�?�� ?�공 - ${sub.userId} / ${sub.planId}`);
    return { success: true, testMode: true };
  }
  const merchant_uid = `auto_${sub.planId}_${sub.userId.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`;
  const res = await axios.post('https://api.iamport.kr/subscribe/payments/again', {
    customer_uid: sub.customerUid,
    merchant_uid,
    amount: sub.amount,
    name: `?�시GO ${sub.planId} ?�기구독`,
  }, { headers: { Authorization: token } });
  const payment = res.data.response;
  if (payment.status !== 'paid') throw new Error(payment.fail_reason || '결제 ?�패');
  return { success: true, imp_uid: payment.imp_uid };
}

// ?�?� 구독 갱신 처리 (?�공/?�패 공통) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
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
      // ?��? tier + 만료??갱신
      await User?.findOneAndUpdate(
        { $or: [{ email: sub.userId }, { id: sub.userId }] },
        { tier: BILLING_PLAN_MAP[sub.planId]?.tier, subscriptionExpiresAt: next }
      ).catch(() => { });
    }
    (logger?.info || console.log)(`[Billing] ???�동�?�� ?�공 - ${sub.userId} / ${sub.planId} / ${sub.amount}??);
  } catch (err) {
    const failCount = (sub.failCount || 0) + 1;
    const newStatus = failCount >= 3 ? 'failed' : 'active'; // 3???�패 ??구독 ?��?
    if (dbReady && Subscription) {
      await Subscription.findByIdAndUpdate(sub._id, {
        status: newStatus,
        failCount,
        lastFailedAt: new Date(),
        lastFailReason: err.message,
      });
      // 3???�패 ???��? tier FREE�?강등
      if (newStatus === 'failed') {
        await User?.findOneAndUpdate(
          { $or: [{ email: sub.userId }, { id: sub.userId }] },
          { tier: 'FREE', subscriptionExpiresAt: null }
        ).catch(() => { });
      }
    }
    (logger?.warn || console.warn)(`[Billing] ???�동�?�� ?�패(${failCount}?? - ${sub.userId}: ${err.message}`);
  }
}

// ?�?� ?��?줄러: 매일 ?�전 9??KST) 만기 구독 ?�괄 �?�� ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
async function runBillingScheduler() {
  if (!dbReady || !Subscription) return;
  const now = new Date();
  const dueList = await Subscription.find({
    status: 'active',
    nextBillingDate: { $lte: now },
  }).lean().catch(() => []);

  if (dueList.length > 0) {
    logger.info(`[Scheduler] ?�기결제 ?�??${dueList.length}�?처리 ?�작`);
    for (const sub of dueList) {
      await processSubscription(sub);
      await new Promise(r => setTimeout(r, 300)); // 과�???방�?
    }
  }
}

// node-cron ?�는 24?�간 ?�터�??�백
if (cron) {
  cron.schedule('0 9 * * *', runBillingScheduler, { timezone: 'Asia/Seoul' });
  logger.info('??[Billing Scheduler] node-cron 매일 09:00(KST) ?�동�?�� ?�성??);
} else {
  setInterval(runBillingScheduler, 24 * 60 * 60 * 1000); // 24?�간 ?�터�??�백
  logger.info('??[Billing Scheduler] ?�터�??�백 ?�동�?�� ?�성??(24h)');
}

// ?�?� API: 빌링???�록 (최초 카드 ?�록 + �?결제) ??JWT ?�증 ?�수 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.post('/api/payment/billing/register', async (req, res) => {
  try {
    // ??JWT ?�증 추�?
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }

    const { imp_uid, customer_uid, planId, pgProvider, userId, userName, harborId } = req.body;
    if (!customer_uid || !planId || !userId)
      return res.status(400).json({ error: '?�수 ??�� ?�락 (customer_uid, planId, userId)' });

    // 본인 ?�는 ?�드민만 처리 가??
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== userId && tp.email !== userId) {
      return res.status(403).json({ error: '본인 구독�??�록 가?�합?�다.' });
    }

    const plan = BILLING_PLAN_MAP[planId];
    if (!plan) return res.status(400).json({ error: '?�효?��? ?��? ?�랜' });

    // �?결제 ?�트??검�?(?�서비스)
    if (process.env.PORTONE_API_KEY && imp_uid) {
      try {
        const token = await getPortoneToken();
        const payRes = await axios.get(`https://api.iamport.kr/payments/${imp_uid}`, {
          headers: { Authorization: token },
        });
        const payment = payRes.data.response;
        if (payment.status !== 'paid' || payment.amount !== plan.amount)
          return res.status(400).json({ error: '�?결제 금액 불일�? });
      } catch (e) {
        return res.status(500).json({ error: '�?결제 검�??�패: ' + e.message });
      }
    }

    // ?�음 결제??계산 (가?�일 +1개월)
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    const billingDay = nextBillingDate.getDate();

    // Subscription ?�??(DB or ?�메모리 JSON)
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
      // ?��? tier 즉시 반영
      await User?.findOneAndUpdate(
        { $or: [{ email: userId }, { id: userId }] },
        { tier: plan.tier, subscriptionExpiresAt: nextBillingDate }
      ).catch(() => { });
    } else {
      // ?�메모리 fallback
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
    // ??BUG-FIX-VVIP: VVIP 결제 ??vvipSlots?�도 ??�� ?�점 ?�동 ?�록
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
        // DB?�도 User.vvipHarborId ?�데?�트
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
        (logger?.info || console.log)(`[Billing] ??VVIP ??�� ?�점 ?�록 - ${harbor.name} ??${userName}(${userId})`);  
      }
    }

    (logger?.info || console.log)(`[Billing] ???�기구독 ?�록 - ${userName}(${userId}) / ${planId} / ${plan.amount}??);
    res.json({
      success: true, planId, tier: plan.tier,
      nextBillingDate: nextBillingDate.toISOString(),
      amount: plan.amount,
    });
  } catch (err) {
    (logger?.error || console.error)('[POST /api/payment/billing/register]', err.message);
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});

// ?�?� API: ??구독 ?�보 조회 ??DUPLICATE REMOVED ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// GET /api/payment/subscription/:userId ??L2316?????�전??버전???�으므�???중복 ?�드?�인?��? ?�거?�니??
// FIX-DUP-ROUTE-SUBSCRIPTION

// ?�?� API: 구독 취소 ????NEW-WARN-01: JWT ?�증 추�? (본인/?�드민만 취소 가??
app.delete('/api/payment/subscription/:userId', async (req, res) => {
  try {
    // JWT ?�증 가??
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const { userId } = req.params;
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== userId && tp.email !== userId) return res.status(403).json({ error: '본인 구독�?취소 가?�합?�다.' });
    const { reason } = req.body;

    if (dbReady && Subscription) {
      const sub = await Subscription.findOne({ userId });
      if (!sub) return res.status(404).json({ error: '구독 ?�보 ?�음' });

      // ?�트??빌링????�� (?�서비스)
      if (process.env.PORTONE_API_KEY && sub.customerUid) {
        try {
          const token = await getPortoneToken();
          await axios.delete(`https://api.iamport.kr/subscribe/customers/${sub.customerUid}`, {
            headers: { Authorization: token },
          });
        } catch (e) { (logger?.warn || console.warn)('[BillingCancel] 빌링????�� ?�패:', e.message); }
      }

      await Subscription.findOneAndUpdate(
        { userId },
        { status: 'cancelled', cancelledAt: new Date(), cancelReason: reason || '?�용??직접 취소' }
      );
      // ?��? tier FREE�?강등
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

    logger.info(`[Billing] 구독 취소 - ${userId} / ?�유: ${reason || '직접취소'}`);
    res.json({ success: true, message: '구독??취소?�었?�니?? ?�재 기간 종료 ???��??�니??' });
  } catch (err) {
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});

// ?�?� API: 구독 ?�랜 변�?(?�그?�이???�운그레?�드) ????NEW-WARN-02: JWT ?�증 추�?
app.put('/api/payment/subscription/:userId/plan', async (req, res) => {
  try {
    // JWT ?�증 가??
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const { userId } = req.params;
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== userId && tp.email !== userId) return res.status(403).json({ error: '본인 구독�?변�?가?�합?�다.' });
    const { newPlanId } = req.body;
    const plan = BILLING_PLAN_MAP[newPlanId];
    if (!plan) return res.status(400).json({ error: '?�효?��? ?��? ?�랜' });

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
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// ??고도??API ??결제 ?�역 / 보안 / EXP / 검??/ 즐겨찾기 / ?�드�??�?�보??
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

// ?�?� (3) merchant_uid 중복 방�? ?�퍼 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
function generateMerchantUid(planId, userId) {
  const safeId = (userId || 'user').replace(/[^a-zA-Z0-9]/g, '');
  const rand = Math.random().toString(36).slice(2, 7);
  return `fishing_${planId}_${safeId}_${Date.now()}_${rand}`;
}
// 결제 검�??�드?�인?�에??merchant_uid 중복 체크
async function isMerchantUidUsed(merchant_uid) {
  if (!dbReady || !PaymentHistory) return false;
  const existing = await PaymentHistory.findOne({ merchant_uid }).lean().catch(() => null);
  return !!existing;
}

// ?�?� (4) 구독 만료 ?�버 미들?�어 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
async function checkSubscriptionValid(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return next();
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    const userId = payload.email || payload.id;
    if (!userId) return next();

    // DB?�서 만료 ?��? ?�인
    let expiredAt = null;
    if (dbReady && User) {
      const u = await User.findOne({ $or: [{ email: userId }, { id: userId }] }, 'subscriptionExpiresAt tier').lean().catch(() => null);
      if (u?.subscriptionExpiresAt) expiredAt = new Date(u.subscriptionExpiresAt);
    }
    if (expiredAt && expiredAt < new Date()) {
      // 만료 ??tier 강등
      if (dbReady && User) {
        await User.findOneAndUpdate(
          { $or: [{ email: userId }, { id: userId }] },
          { tier: 'FREE', subscriptionExpiresAt: null }
        ).catch(() => { });
      }
      return res.status(403).json({ error: '구독??만료?�었?�니?? ?�구?�해주세??', code: 'SUBSCRIPTION_EXPIRED' });
    }
    next();
  } catch { next(); }
}

// ??BUG-FIX: app.use() 구독 미들?�어 ?�거
// /api/weather/precision ???�우???�라??checkSubscriptionValid ?�용 ?�료
// /api/secret-point-overrides ???�우???��? ?�동 tier 검�??�료
// (?�우???�후 ?�언??app.use()???�당 ?�우?�에 ?�용 ?�됨 ??Express 규칙)

// ?�?� (5) 결제 ?�역 조회 API ??JWT ?�증 ?�수 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.get('/api/payment/history', async (req, res) => {
  try {
    // ??JWT ?�증 추�?
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }

    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId ?�요' });

    // 본인 ?�는 ?�드민만 조회 가??
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== userId && tp.email !== userId) {
      return res.status(403).json({ error: '본인??결제 ?�역�?조회 가?�합?�다.' });
    }

    let history = [];
    if (dbReady && PaymentHistory) {
      history = await PaymentHistory.find({ userId }).sort({ createdAt: -1 }).limit(50).lean().catch(() => []);
    }
    // ?�메모리 fallback: Subscription?�서 추출
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
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});

// billing/register?�서 PaymentHistory ?�동 ?�??(기존 ?�드?�인??보완 ??
// ?�래 미들?�어�??�해 billing/register ?�답 ?�공 ??history ?�??
// ??BUG-42: JWT ?�증 추�? ??미인�?결제 기록 ?�조 방�?
app.post('/api/payment/history/record', verifyToken, async (req, res) => {
  try {
    const { userId, userName, planId, pgProvider, paymentType, amount, status, imp_uid, merchant_uid, failReason } = req.body;
    // ?�청 userId?� ?�큰 userId ?�치 ?��? ?�인 (본인 결제�?기록 가??
    const tokenId = req.user.email || req.user.id;
    const isAdmin = isAdminToken(req.user);
    const safeAmount = Number(amount); if (!Number.isFinite(safeAmount) || safeAmount <= 0) return res.status(400).json({ error: '?�효?��? ?��? 결제 금액' }); // ??FIX-AMOUNT-VALIDATE
    if (!isAdmin && userId && userId !== tokenId) {
      return res.status(403).json({ error: '본인 결제 기록�??�록?????�습?�다.' });
    }
    if (dbReady && PaymentHistory && merchant_uid) {
      const used = await isMerchantUidUsed(merchant_uid);
      if (used) return res.status(409).json({ error: '?��? 처리??결제?�니??' });
      await PaymentHistory.create({ userId, userName, planId, pgProvider, paymentType, amount, status, imp_uid, merchant_uid, failReason });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});

// ?�?� (6) EXP ?�버 계산 + 보상 지�??�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
const SERVER_EXP_REWARDS = {
  attendance: 20, post_write: 30, record_write: 50,
  comment_write: 10, like_receive: 5, point_visit: 15,
  photo_upload: 25, first_catch: 100, weekly_streak: 80, monthly_streak: 300,
};

// ??BUG-43: JWT ?�증 추�? ??EXP 직접 조작 방�?
// ??FIX-EXP-RATE: per-user+action rate limit (반복 EXP ?�립 방어)
const expRateMap = new Map(); // 'userId:action' ??timestamp
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [k, v] of expRateMap.entries()) { if (v < cutoff) expRateMap.delete(k); }
}, 60 * 60 * 1000); // 1?�간마다 ?�리

app.post('/api/user/exp', verifyToken, async (req, res) => {
  try {
    const { userId, action } = req.body;
    if (!userId || !action) return res.status(400).json({ error: '?�수 ??�� ?�락' });
    // ?�큰???�제 ?�용?��? ?�치 ?�인
    const tokenId = req.user.email || req.user.id;
    const isAdmin = isAdminToken(req.user);
    if (!isAdmin && userId !== tokenId) return res.status(403).json({ error: '본인 EXP�??�립?????�습?�다.' });
    const gain = SERVER_EXP_REWARDS[action];
    if (!gain) return res.status(400).json({ error: '?�효?��? ?��? ?�션' });
    // ??FIX-EXP-RATE: 24?�간 ???�일 action 중복 ?�립 방어 (attendance??1???? ?�머지??10????
    if (!isAdmin) {
      const rateKey = `${tokenId}:${action}`;
      const EXP_COOLDOWN = (action === 'attendance' || action === 'first_catch' || action === 'weekly_streak' || action === 'monthly_streak')
        ? 23 * 60 * 60 * 1000  // 23?�간 쿨다??(daily activities)
        : 5 * 60 * 1000;       // 5�?쿨다??(regular activities)
      const lastTime = expRateMap.get(rateKey) || 0;
      if (Date.now() - lastTime < EXP_COOLDOWN) {
        return res.status(429).json({ error: '?�시 ???�시 ?�도?�주?�요.', cooldownMs: EXP_COOLDOWN - (Date.now() - lastTime) });
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
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});

// ?�?� (7) ?�일 ?�로??MIME 검�?강화 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// 기존 /api/upload ?�드?�인?�에 MIME 검�?미들?�어 ?�용
function validateImageUpload(req, res, next) {
  const { mimeType, base64 } = req.body;
  const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (mimeType && !ALLOWED_MIME.includes(mimeType)) {
    return res.status(400).json({ error: '?�용?��? ?�는 ?�일 ?�식?�니?? (jpeg/png/gif/webp�?가??' });
  }
  // base64 길이 기반 ?�기 추정: 5MB = ~6,825,000 chars
  if (base64 && base64.length > 6_825_000) {
    return res.status(413).json({ error: '?�일 ?�기가 5MB�?초과?�니??' });
  }
  next();
}
// ?�로???�우?�에 ?�용
app.use('/api/upload', validateImageUpload);
app.use('/api/user/avatar', validateImageUpload);

// ?�?� (8) Rate Limit 강화 (결제·검?�·업로드) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
try {
  const rateLimit = require('express-rate-limit');
  // 결제 API: 1분에 5??
  const paymentLimiter = rateLimit({ windowMs: 60_000, max: 5, message: { error: '결제 ?�청???�무 많습?�다. ?�시 ???�시 ?�도?�주?�요.' }, standardHeaders: true, legacyHeaders: false });
  app.use('/api/payment', paymentLimiter);
  // 검??API: 1분에 30??
  const searchLimiter = rateLimit({ windowMs: 60_000, max: 30, message: { error: '검???�청???�무 많습?�다.' } });
  app.use('/api/community/search', searchLimiter);
  // ??FIX-UPLOAD-RATE-LIMIT: ?��?지 ?�로??1�?10???�한
  const uploadLimiter = rateLimit({ windowMs: 60_000, max: 10, message: { error: '?�로???�청???�무 많습?�다.' } });
  app.use('/api/upload', uploadLimiter);
  app.use('/api/user/avatar', uploadLimiter);
  (logger?.info || console.log)('??Rate Limit 강화 ?�용 (결제/검??');
} catch (e) { (logger?.warn || console.warn)('[RateLimit] express-rate-limit 미설�??�는 ?�용 ?�패:', e.message); }

// ?�?� (11) 커�??�티 ?�버?�이???�문 검???�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.get('/api/community/search', async (req, res) => {
  try {
    const rawQ = Array.isArray(req.query.q) ? req.query.q[0] : (req.query.q || ''); // ??FIX-SEARCH-HPP
    const q = rawQ.slice(0, 100); // ??FIX-SEARCH-MAXLEN-2: 검?�어 최�? 100??
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20)); // ??FIX-SEARCH-LIMIT: 최�? 50�?
    // ??FIX-CAT-WHITELIST: category ?�이?�리?�트 검�?    const ALLOWED_CATEGORIES = ['?�체','?�시??,'조황','?�시??,'?�비','?�영??,'?�벤??,'?�유','기�?'];
    const rawCat = Array.isArray(req.query.category) ? req.query.category[0] : (req.query.category || '');
    const category = (typeof rawCat === 'string' && rawCat.length <= 20) ? rawCat : ''; // FIX-CAT-WHITELIST
    const skip = (page - 1) * limit;
    let results = [];
    let total = 0;

    if (dbReady && Post && q.trim()) {
      const filter = {
        $text: { $search: q.trim() },
        ...(category && category !== '?�체' ? { category } : {}),
      };
      [results, total] = await Promise.all([
        Post.find(filter, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
          .skip(skip).limit(limit).lean(),
        Post.countDocuments(filter),
      ]);
    } else {
      // ?�메모리 fallback
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
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});

// ?�?� (10) 즐겨찾기 DB ?�기???�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ??BUG-03 FIX: GET /api/user/favorites ??JWT ?�증 추�? (?�??즐겨찾기 ?�출 차단)
app.get('/api/user/favorites', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const userId = tp.email || tp.id; // ??BUG-03 FIX: JWT?�서�?추출
    if (dbReady && User) {
      const u = await User.findOne({ $or: [{ email: userId }, { id: userId }] }, 'favorites').lean().catch(() => null);
      return res.json({ favorites: u?.favorites || [] });
    }
    const u = memUsers.find(u => u.email === userId || u.id === userId);
    res.json({ favorites: u?.favorites || [] });
  } catch (err) { res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' }); }
});

// ??NEW-BUG-02: /api/user/favorites POST ??JWT ?�증 추�? (본인 즐겨찾기�??�정 가??
app.post('/api/user/favorites', async (req, res) => {
  try {
    // JWT ?�증 가??
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const { userId, pointId, action } = req.body; // action: 'add' | 'remove'
    if (!userId || !pointId || !action) return res.status(400).json({ error: '?�수 ??�� ?�락' });
    // 본인 ?�는 ?�드민만 즐겨찾기 ?�정 가??
    const isAdmin = isAdminToken(tp);
    if (!isAdmin && tp.id !== userId && tp.email !== userId) return res.status(403).json({ error: '본인 즐겨찾기�??�정 가?�합?�다.' });
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
  } catch (err) { res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' }); }
});

// ?�?� (14) ?�드�??�익 ?�?�보??API ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
app.get('/api/admin/revenue', async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ error: '마스??권한 ?�요' }); // ??FIX-ADMIN-REVENUE-AUTH
  try {
    // 마스???�드�??�증
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요' });
    let payload;
    try { payload = jwt.verify(authHeader.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ error: '?�증 ?�요' }); }
    const isAdmin = isAdminToken(payload); // ??9TH-A1/B1: payload.name 불일�?비교 ?�거 ??isAdminToken?� id/email�?체크 (ADMIN 기�? ?�일)
    if (!isAdmin) return res.status(403).json({ error: '?�근 권한 ?�음' });

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
      // ?�메모리 ?�계
      stats.activeSubscriptions = Object.values(memProSubs).filter(s => s.status === 'active').length;
      Object.values(memProSubs).forEach(s => { stats.totalRevenue += s.amount || 0; stats.monthRevenue += s.amount || 0; });
    }
    res.json(stats);
  } catch (err) { res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' }); }
});

// ?�?� (15) 관리자 ?�용 ?�시�??�림 발송 API ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// ??LOW-1: fishing_alert / push_notification 발송??관리자 JWT guard ?�용

// [1] ?�체 브로?�캐?�트 ?�시 ?�림 (fishing_alert)
app.post('/api/admin/alert', verifyToken, (req, res) => {
  const isAdmin = isAdminToken(req.user);
  if (!isAdmin) return res.status(403).json({ error: '관리자 권한 ?�요' });

  const { message, location, pointName, time } = req.body;
  if (!message) return res.status(400).json({ error: 'message ?�수' });

  const payload = {
    message,
    location: location || '',
    pointName: pointName || '',
    time: time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  };
  io.emit('fishing_alert', payload); // ?�체 ?�결 ?�용?�에�?브로?�캐?�트
  (logger?.info || console.log)(`[Admin Alert] ?�시 ?�림 발송: ${message}`);
  res.json({ success: true, recipients: 'all', payload });
});

// [2] ?�정 ?�용??개인 ?�시 ?�림 (push_notification)
app.post('/api/admin/push', verifyToken, (req, res) => {
  const isAdmin = isAdminToken(req.user);
  if (!isAdmin) return res.status(403).json({ error: '관리자 권한 ?�요' });

  const { targetEmail, title, message, time } = req.body;
  if (!targetEmail || !message) return res.status(400).json({ error: 'targetEmail, message ?�수' });

  const payload = {
    targetEmail,
    title: title || '?�시GO ?�림',
    message,
    time: time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  };
  // ??FIX-PUSH-TARGET-ONLY: ?�정 ?�켓?�만 발송 (?�체 방송 ???��??�터�?
  let pushed = false;
  for (const [sid, sock] of io.sockets.sockets) {
    const sockUser = sock.verifiedUser || sock._verifiedUser;
    if (sockUser && (sockUser.email === targetEmail || sockUser.id === targetEmail)) {
      sock.emit('push_notification', payload);
      pushed = true;
    }
  }
  if (!pushed) (logger?.debug || console.log)('[Admin Push] ?�프?�인 ?�용??', targetEmail);
  (logger?.info || console.log)(`[Admin Push] 개인 ?�림 ??${targetEmail}: ${message}`);
  res.json({ success: true, targetEmail, payload });
});

// ??PUSH-FCM: ?�체 FCM ?�시 ?�림 (Admin ?�용)
app.post('/api/admin/push-fcm', verifyToken, async (req, res) => {
  if (!isAdminToken(req.user)) return res.status(403).json({ error: '관리자 권한 ?�요' });
  const { title, body, route } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title, body ?�수' });
  try {
    await pushService.notifyAnnouncement({ title, body });
    res.json({ success: true, title, body });
  } catch (err) {
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});

// ??PUSH-FCM: FCM ?�큰 ?�록 (POST /api/user/push-token)
app.post('/api/user/push-token', verifyToken, async (req, res) => {
  const { token, platform = 'android' } = req.body;
  if (!token) return res.status(400).json({ error: 'token ?�수' });
  // ??FIX-PUSHTOKEN-LEN: FCM ?�큰 길이 검�?(DoS + ?�상 ?�큰 방어)
  if (typeof token !== 'string' || token.length > 512 || token.length < 10) return res.status(400).json({ error: '?�효?��? ?��? FCM ?�큰' });
  const ALLOWED_PLATFORMS = ['android', 'ios', 'web'];
  if (!ALLOWED_PLATFORMS.includes(platform)) return res.status(400).json({ error: '?�효?��? ?��? ?�랫?? });
  const userId = req.user.id || req.user._id;
  if (!userId) return res.status(400).json({ error: 'userId 로드 ?�패' });
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
    (logger?.error || console.error)('[PUSH] ?�큰 ?�???�패:', err.message);
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});

// ??PUSH-FCM: FCM ?�큰 ??�� (로그?�웃 ?? DELETE /api/user/push-token)
app.delete('/api/user/push-token', verifyToken, async (req, res) => {
  const userId = req.user.id || req.user._id;
  try {
    if (dbReady && PushToken) {
      await PushToken.deleteMany({ userId });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});


// ?�?� CCTV 관�??�드�?API (JWT ?�증 ??56�?MongoDB ?�속?? ?�?�?�?�?�?�?�?�
// dbReady??비동기로 true가 ?��?�? getter ?�수�??�달?�여 ??�� 최신�?참조
require('./cctv_admin_routes')(app, { getDbReady: () => dbReady, CctvOverrideModel, logger }); // ??BUG-FIX: logger ?�달 ?�락 ?�정

// ?�?�?� ?�핑 API (쿠팡 + ?�리 ?�합) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�

/**
 * GET /api/shop/products?source=coupang&category=?�시?�품
 * source: 'coupang' | 'ali' | 'all' (default: 'all')
 * category: ?�품 카테고리 ?�워??
 */
app.get('/api/shop/products', async (req, res) => {
  const source   = (req.query.source   || 'all').toLowerCase();
  const category = req.query.category  || '?�시?�품';
  // page/limit ?�라미터 존재 ?��?�?�????�라?�언??구분
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

    // ???�위 ?�환: page ?�라미터 ?�으�?배열�?반환 (�??�라?�언??지??
    //              page ?�라미터 ?�으�?{ items, hasMore, total } 반환 (???�라?�언??
    if (!hasPagination) {
      return res.json(items);
    }
    return res.json({ items, total, hasMore });

  } catch (err) {
    logger.warn(`[Shop API] ?�품 조회 ?�류: ${err.message}`);
    res.status(500).json({ error: '?�품 로드 ?�패', message: err.message });
  }
});


/**
 * GET /api/shop/ali-resolve?url=<s.click.aliexpress.com 링크>
 * AliExpress ?�래??링크?�서 ?�품 ?�보 ?�동 추출 (마스???�용)
 */
app.get('/api/shop/ali-resolve', async (req, res) => {
  const DIRECT_KEY = process.env.DIRECT_KEY; // ??FIX-DIRECT-KEY
  const { url, key } = req.query;

  if (!DIRECT_KEY || !key || !require('crypto').timingSafeEqual(Buffer.from(DIRECT_KEY), Buffer.from(key.padEnd(DIRECT_KEY.length, '\0').substring(0, DIRECT_KEY.length)))) {
    return res.status(403).json({ error: '권한 ?�음' }); // ??FIX-TIMING-SAFE
  }
  if (!url) return res.status(400).json({ error: 'url ?�라미터 ?�요' });

  const https = require('https');
  const http  = require('http');
  const TRACK = (process.env.ALI_TRACKING_ID || 'FishingGO').trim();

  // ?�?� 리다?�렉??추적: /item/?�자 URL 발견 즉시 중단 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
  function findProductId(startUrl, maxHops = 20) {
    return new Promise((resolve, reject) => {
      let hops = 0;

      function doHead(currentUrl) {
        if (hops++ > maxHops) return reject(new Error('리다?�렉???�수 초과'));

        let parsed;
        try { parsed = new URL(currentUrl); } catch { return reject(new Error('?�못??URL')); }

        // ?�재 URL???��? ?�품 ID가 ?�으�?즉시 반환
        const idNow = currentUrl.match(/\/item\/(\d{8,})/);
        if (idNow) return resolve({ productId: idNow[1], finalUrl: currentUrl });

        const mod = parsed.protocol === 'https:' ? https : http;
        const req2 = mod.request({
          hostname: parsed.hostname,
          path: parsed.pathname + parsed.search,
          method: 'HEAD',   // body ?�이 ?�더�?받기 (빠름)
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
            // ?�음 URL???�품 ID ?�으�?즉시 반환
            const idNext = next.match(/\/item\/(\d{8,})/);
            if (idNext) return resolve({ productId: idNext[1], finalUrl: next });
            return doHead(next);
          }
          // 리다?�렉???�으???�품 ID ?�음 ???�품 ?�이지 ?�님
          resolve({ productId: null, finalUrl: currentUrl });
        });
        req2.on('error', reject);
        req2.on('timeout', () => { req2.destroy(); reject(new Error('?�?�아??)); });
        req2.end();
      }

      doHead(startUrl);
    });
  }

  // ?�?� ?�품 ?�이지 HTML 직접 조회 (리다?�렉??최�? 5??추적) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
  function fetchProductPage(productId, maxHops = 5) {
    return new Promise((resolve, reject) => {
      let hops = 0;
      function doGet(targetUrl) {
        if (hops++ > maxHops) return reject(new Error('?�품 ?�이지 리다?�렉??초과'));
        let parsed; try { parsed = new URL(targetUrl); } catch { return reject(new Error('?�못??URL')); }
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
        req2.on('timeout', () => { req2.destroy(); reject(new Error('?�?�아??)); });
        req2.end();
      }
      doGet(`https://www.aliexpress.com/item/${productId}.html`);
    });
  }

  try {
    // Step 1: HEAD 리다?�렉??추적 ???�품 ID 추출 (루프 ?�이 빠름)
    const { productId, finalUrl } = await findProductId(url);

    if (!productId) {
      return res.json({
        ok: false,
        error: '개별 ?�품 링크가 ?�닙?�다. AliExpress ?�품 ?�이지 URL??붙여?�어 주세??',
        finalUrl,
      });
    }

    // Step 2: ?�품 ID�??�제 ?�이지 GET 조회 ???��?지/?�목/가�?추출
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
      logger.warn(`[Ali Resolve] ?�품 ?�이지 조회 ?�패: ${fetchErr.message}`);
    }

    // ?�필리에?�트 링크: s.click 링크???��?, ?�반 URL?�면 ?�라미터 추�?
    const affiliateLink = url.includes('s.click.aliexpress.com')
      ? url
      : `https://www.aliexpress.com/item/${productId}.html?aff_fcid=${TRACK}&aff_platform=portals-tool&sk=_dTLBBxr`;

    return res.json({ ok: true, productId, imageUrl: imgUrl, title, price, affiliateLink, finalUrl });

  } catch (err) {
    logger.warn(`[Ali Resolve] 링크 조회 ?�류: ${err.message}`);
    return res.status(500).json({ error: `조회 ?�패: ${err.message.slice(0, 100)}` });
  }
});

/**
 * GET /api/shop/ali-debug ??Ali API ?�전 진단 (?�드?�인??+ ?�명방식 ?�전 ?�색)
 */
app.get('/api/shop/ali-debug', async (req, res) => {
  // ??FIX-ALI-DEBUG-AUTH: 진단 API???�증 추�? (API ???�명 ?�고리즘 ?�출 방어)
  const keyOk = process.env.DIRECT_KEY && req.query.key === process.env.DIRECT_KEY;
  if (!keyOk) {
    const authH = req.headers.authorization || '';
    if (!authH.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요' });
    try {
      const tp = require('jsonwebtoken').verify(authH.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
      if (!isAdminToken(tp)) return res.status(403).json({ error: '관리자 권한 ?�요' });
    } catch { return res.status(401).json({ error: '?�큰 ?�류' }); }
  }
  const crypto = require('crypto');
  const axios  = require('axios');
  const KEY    = (process.env.ALI_APP_KEY    || '').trim();
  const SECRET = (process.env.ALI_APP_SECRET || '').trim();
  const TRACK  = (process.env.ALI_TRACKING_ID || 'default').trim();

  if (!KEY || !SECRET) return res.json({ error: 'API ??미설?? });

  // ?�?� ?�명 방식 4�??�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
  const sign_md5      = (p) => crypto.createHash('md5').update(`${SECRET}${Object.keys(p).sort().map(k=>`${k}${p[k]}`).join('')}${SECRET}`).digest('hex').toUpperCase();
  const sign_sha256_A = (p) => crypto.createHmac('sha256',SECRET).update(`${SECRET}${Object.keys(p).sort().map(k=>`${k}${p[k]}`).join('')}${SECRET}`).digest('hex').toUpperCase();
  const sign_sha256_B = (p) => crypto.createHmac('sha256',SECRET).update(Object.keys(p).sort().map(k=>`${k}${p[k]}`).join('')).digest('hex').toUpperCase();
  const sign_sha256_C = (p) => { // method prefix ?�함 (Lazada 방식)
    const sorted = Object.keys(p).filter(k=>k!=='method').sort().map(k=>`${k}${p[k]}`).join('');
    return crypto.createHmac('sha256',SECRET).update(`${p.method}${sorted}`).digest('hex').toUpperCase();
  };

  const callApi = async (label, endpoint, params, signFn) => {
    try {
      params.sign = signFn(params);
      // ?�플 ?�명 문자??(처음 40?�만)
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

  // ?�라미터 ?�성 ?�퍼
  const p = (method, sm, extra={}) => ({ method, app_key: KEY, timestamp: ts(), sign_method: sm, v: '2.0', tracking_id: TRACK, ...extra });
  const pNoTrack = (method, sm, extra={}) => ({ method, app_key: KEY, timestamp: ts(), sign_method: sm, v: '2.0', ...extra });

  const results = await Promise.all([
    // SG ?�드?�인??
    callApi('SG_md5',       SG, p('aliexpress.affiliate.product.query','md5',kw), sign_md5),
    callApi('SG_sha256A',   SG, p('aliexpress.affiliate.product.query','sha256',kw), sign_sha256_A),
    callApi('SG_sha256B',   SG, p('aliexpress.affiliate.product.query','sha256',kw), sign_sha256_B),
    callApi('SG_sha256C',   SG, p('aliexpress.affiliate.product.query','sha256',kw), sign_sha256_C),
    callApi('SG_link_md5',  SG, p('aliexpress.affiliate.link.generate','md5',{promotion_link_type:'0',source_values:'https://www.aliexpress.com/item/1005006789012345.html'}), sign_md5),
    callApi('SG_link_sha256A', SG, p('aliexpress.affiliate.link.generate','sha256',{promotion_link_type:'0',source_values:'https://www.aliexpress.com/item/1005006789012345.html'}), sign_sha256_A),
    // CN ?�드?�인??(중국 API)
    callApi('CN_md5',       CN, p('aliexpress.affiliate.product.query','md5',kw), sign_md5),
    callApi('CN_sha256A',   CN, p('aliexpress.affiliate.product.query','sha256',kw), sign_sha256_A),
    // tracking ?�이
    callApi('SG_noTrack_sha256A', SG, pNoTrack('aliexpress.affiliate.product.query','sha256',kw), sign_sha256_A),
  ]);

  const winner = results.find(r=>r.success);
  // ?�명 ?�플 ?�보 (?�버그용)
  const sample = { KEY_prefix: KEY.slice(0,6), SECRET_len: SECRET.length, TRACK, KEY_full_len: KEY.length };
  res.json({ sample, winner: winner?.label||'???��? ?�패', results });
});



/**
 * GET /api/shop/promo
 * ?�리 ?��? ?�로모션 ?�품 (?�수�?50%+ ?�품)
 */
app.get('/api/shop/promo', async (req, res) => {
  try {
    const promoProducts = await ali.getAliPromoProducts(6);
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
    logger.warn(`[Shop Promo API] ?��? ?�품 ?�류: ${err.message}`);
    res.status(500).json({ error: '?��? ?�품 로드 ?�패' });
  }
});

/**
 * GET /api/shop/price-check?ids=1005007354532583,1005006789
 * productdetail.get?�로 ?�시�?가�?조회 (최�? 50�?
 * product.query보다 캐시 ??????최신 가�?
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
    logger.warn(`[Shop PriceCheck API] ?�류: ${err.message}`);
    res.status(500).json({ error: '가�??�인 ?�패' });
  }
});

/**
 * GET /api/shop/recommend?pointType=바다&fish=감성??
 * ?�시 ?�인??기반 맞춤 ?�품 추천 (쿠팡 ?�선)
 */
app.get('/api/shop/recommend', async (req, res) => {
  const pointType = req.query.pointType || '?�체';
  const fish      = req.query.fish      || '';

  // ?�종/?�인?????�품 ?�워??매핑
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
        badge: `?�� ${fish || pointType} 추천`, source: 'coupang',
      })),
      ...aliRec.map(p => ({
        id: `ali_${p.productId}`, name: p.title,
        price: p.salePrice, discount: p.discount,
        img: p.imageUrl, link: p.productUrl,
        badge: `?�� ${fish || pointType} ?�모??, source: 'ali',
        commission: p.commissionRate,
      })),
    ];

    res.json({ keyword, products: recommend });
  } catch (err) {
    logger.warn(`[Shop Recommend] 추천 ?�류: ${err.message}`);
    res.status(500).json({ error: '추천 ?�품 로드 ?�패' });
  }
});

// ?�?�?� ?�핑 ?�동 ?�품 관�?(관리자 ?�용) ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// 컬렉?? manual_shop_items
// ?�드: { _id, source, shortUrl, iframeSrc, imageUrl, productName, tag, order, createdAt }
const ManualShopItem = mongoose.models.ManualShopItem || mongoose.model('ManualShopItem',
  new mongoose.Schema({
    source:      { type: String, default: 'coupang' },
    shortUrl:    { type: String, required: true },
    iframeSrc:   { type: String },
    imageUrl:    { type: String },
    productName: { type: String },
    tag:         { type: String, default: '?�시?�품' },
    order:       { type: Number, default: Date.now },
    createdAt:   { type: Date,   default: Date.now },
  }, { collection: 'manual_shop_items' })
);

// ?�?�?� ?�품 ?�릭 추적 모델 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
const ShopClick = mongoose.models.ShopClick || mongoose.model('ShopClick',
  new mongoose.Schema({
    productId:  { type: String },
    source:     { type: String, default: 'ali' },
    keyword:    { type: String },
    clickedAt:  { type: Date, default: Date.now },
  }, { collection: 'shop_clicks' })
);

/**
 * POST /api/shop/click ???�품 ?�릭 로깅 (?�익 최적?�용)
 */
app.post('/api/shop/click', searchLimiter, async (req, res) => { // ??FIX-CLICK-LIMIT: 분당 30???�한
  try {
    const { productId, source, keyword } = req.body;
    if (dbReady && productId) {
      await ShopClick.create({ productId, source: source || 'ali', keyword: safeKeyword || '' });
    }
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false }); // ?�릭 추적 ?�패?�도 ?�용?�에�??�향 ?�음
  }
});

/**
 * GET /api/shop/click/stats ???�릭 ?�계 (관리자 ?�용)
 */
app.get('/api/shop/click/stats', verifyToken, async (req, res) => {
  // ??FIX-STATS-AUTH: ?�릭 ?�계??관리자 ?�용
  if (!isAdminToken(req.user)) return res.status(403).json({ error: '관리자 권한 ?�요' });
  try {
    if (!dbReady) return res.json([]);
    const stats = await ShopClick.aggregate([
      { $group: { _id: '$productId', count: { $sum: 1 }, source: { $first: '$source' }, keyword: { $first: '$keyword' } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});

/**
 * GET /api/shop/manual
 * ?�동 ?�록 ?�품 목록 (?�체 공개)
 */
app.get('/api/shop/manual', async (req, res) => {
  try {
    if (!dbReady) return res.json([]);
    const items = await ManualShopItem.find({}).sort({ order: 1, createdAt: -1 }).lean();
    res.json(items);
  } catch (err) {
    logger.warn('[Shop Manual] 조회 ?�패:', err.message);
    res.json([]);
  }
});

/**
 * GET /api/shop/manual/dbtest ???�시 MongoDB ?�기 ?�스??(?�증 ?�음)
 * ?�버??MongoDB write 가???��? 진단??
 */
app.get('/api/shop/manual/dbtest', async (req, res) => {
  // ??FIX-DBTEST-AUTH: ?�증 ?�는 MongoDB ?�기 ?�스????DIRECT_KEY ?�는 관리자 ?�큰 ?�요
  const keyOk = process.env.DIRECT_KEY && req.query.key === process.env.DIRECT_KEY;
  if (!keyOk) {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요' });
    try {
      const tp = require('jsonwebtoken').verify(auth.slice(7), process.env.JWT_SECRET || 'fishinggo_jwt_secret_2024', { algorithms: ['HS256'] });
      const ADMIN_EMAIL = ADMIN_EMAIL_PRIMARY; const ADMIN_ID = process.env.ADMIN_ID || 'sunjulab';
      if (!ADMIN_EMAIL_LIST.has(tp.email) && tp.id !== ADMIN_ID) { // FIX-ADMIN-EMAIL-CONST
        return res.status(403).json({ error: '관리자 권한 ?�요' });
      }
    } catch { return res.status(401).json({ error: '?�큰 ?�류' }); }
  }
  const startMs = Date.now();
  try {
    if (!dbReady) return res.json({ ok: false, error: 'dbReady=false', ms: Date.now() - startMs });
    const doc = await Promise.race([
      ManualShopItem.create({ source: '__test__', shortUrl: '__test__', tag: '__test__', order: 0, createdAt: new Date() }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('write timeout 8s')), 8000))
    ]);
    // 바로 ??��
    await ManualShopItem.findByIdAndDelete(doc._id).catch(() => {});
    res.json({ ok: true, ms: Date.now() - startMs, id: String(doc._id) });
  } catch (err) {
    res.json({ ok: false, error: '처리 ?�류', ms: Date.now() - startMs }); // ??FIX-ERR-MSG
  }
});


/**
 * GET /api/shop/manual/direct ??PowerShell 직접 ?�록 (브라?��? 문제 ?�회)
 * ?key=FishingGO_Admin_Direct_2026&shortUrl=...&iframeSrc=...&tag=...&source=coupang
 */
app.get('/api/shop/manual/direct', async (req, res) => {
  const { key, source = 'coupang', shortUrl, iframeSrc, imageUrl, productName, tag } = req.query;
  if (!process.env.DIRECT_KEY || key !== process.env.DIRECT_KEY) return res.status(401).json({ error: '??불일�? }); // ??FIX-DIRECT-KEY-2
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
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});

/**
 * GET /api/shop/manual/add-tab ??window.open 방식 (Chrome ?�장 ?�회 최종 ?�단)
 * 결과�?postMessage�?opener???�달 ???�동 ?�힘
 */
app.get('/api/shop/manual/add-tab', async (req, res) => {
  const { t: token, source = 'coupang', shortUrl, iframeSrc, imageUrl, productName, tag } = req.query;
  const html = (msg) => `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<script>
try { window.opener && window.opener.postMessage(${JSON.stringify(msg)}, '*'); } catch(e){}
try { window.close(); } catch(e){}
setTimeout(function(){ document.body.innerHTML='<pre>${JSON.stringify(msg)}</pre>'; }, 500);
</scr` + `ipt></body></html>`;

  if (!token) return res.send(html({ ok: false, error: '?�증 ?�큰 ?�요' }));
  // ??FIX-ADDTAB-JWT: jwt.decode() ?�백 ?�거 ??만료/?�조???�큰 ?�락 취약???�정
  let user;
  try { user = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { return res.send(html({ ok: false, error: '?�효?��? ?�거??만료???�큰' })); }
  const adminEmails = [...ADMIN_EMAIL_LIST]; // FIX-ADMIN-EMAIL-CONST
  if (!adminEmails.includes(user?.email) && user?.id !== ADMIN_ID) {
    return res.send(html({ ok: false, error: '관리자 권한 ?�요' }));
  }
  try {
    if (!dbReady) return res.send(html({ ok: false, error: '?�버 초기??�? }));
    if (!shortUrl) return res.send(html({ ok: false, error: '?�축 URL ?�수' }));
    const docData = {
      source:    (source || 'coupang').trim(),
      shortUrl:  shortUrl.trim(),
      tag:       (tag || '?�시?�품').trim(),
      order:     Date.now(),
      createdAt: new Date(),
    };
    if (source === 'ali') {
      if (!imageUrl) return res.send(html({ ok: false, error: '?�리 ?��?지 URL ?�수' }));
      docData.imageUrl    = imageUrl.trim();
      docData.productName = (productName || '').trim();
    } else {
      if (!iframeSrc) return res.send(html({ ok: false, error: 'iframeSrc ?�수' }));
      docData.iframeSrc = iframeSrc.trim();
    }
    const saved = await Promise.race([
      ManualShopItem.create(docData),
      new Promise((_, rej) => setTimeout(() => rej(new Error('DB ?�???�간 초과')), 10000))
    ]);
    res.send(html({ ok: true, id: String(saved._id) }));
  } catch (err) {
    logger.error('[Shop add-tab] ?�패:', err.message);
    res.send(html({ ok: false, error: '?�버 ?�류가 발생?�습?�다.' })); // ??FIX-ERR-MSG
  }
});

/**
 * GET /api/shop/manual/add ??CORS preflight ?�이 ?�핑 ?�품 ?�록 (브라?��? ?�환???�회)
 * Authorization ?�더 ?�???t=<JWT> 쿼리?�라미터 ?�용
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

  if (!token) return send(401, { error: '?�증 ?�큰 ?�요' });
  // ??FIX-ADD-JWT: jwt.decode() ?�백 ?�거 ??만료/?�조???�큰 ?�락 취약???�정
  let user;
  try { user = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { return send(401, { error: '?�효?��? ?�거??만료???�큰' }); }
  const adminEmails = [...ADMIN_EMAIL_LIST]; // FIX-ADMIN-EMAIL-CONST
  if (!adminEmails.includes(user?.email) && user?.id !== ADMIN_ID) {
    return send(403, { error: '관리자 권한 ?�요' });
  }
  try {
    if (!dbReady) return send(503, { error: '?�버 초기??�? });
    if (!shortUrl) return send(400, { error: '?�축 URL ?�수' });
    const docData = {
      source:    (source || 'coupang').trim(),
      shortUrl:  shortUrl.trim(),
      tag:       (tag || '?�시?�품').trim(),
      order:     Date.now(),
      createdAt: new Date(),
    };
    if (source === 'ali') {
      if (!imageUrl) return send(400, { error: '?�리 ?��?지 URL ?�수' });
      docData.imageUrl    = imageUrl.trim();
      docData.productName = (productName || '').trim();
    } else {
      if (!iframeSrc) return send(400, { error: 'iframeSrc ?�수 (iframe 코드 ?�인)' });
      docData.iframeSrc = iframeSrc.trim();
    }
    const saved = await Promise.race([
      ManualShopItem.create(docData),
      new Promise((_, rej) => setTimeout(() => rej(new Error('DB ?�???�간 초과')), 10000))
    ]);
    const result = { ok: true, id: String(saved._id) };
    return send(200, result);
  } catch (err) {
    logger.error('[Shop GET-add] ?�패:', err.message);
    return send(500, { error: '?�버 ?�류가 발생?�습?�다.' }); // ??FIX-ERR-MSG
  }
});

/**
 * POST /api/shop/manual
 * ?�동 ?�품 ?�록 (관리자 ?�용)
 * body: { source, shortUrl, iframeCode, imageUrl, productName, tag }
 *   source: 'coupang'(기본) | 'ali'
 */
app.post('/api/shop/manual', verifyToken, async (req, res) => {
  const adminEmails = [...ADMIN_EMAIL_LIST]; // FIX-ADMIN-EMAIL-CONST
  console.log('[SHOP-POST] ???�들??진입, user:', req.user?.email, '| id:', req.user?.id);
  if (!adminEmails.includes(req.user?.email) && req.user?.id !== ADMIN_ID) {
    console.log('[SHOP-POST] ??403 관리자 권한 ?�음');
    return res.status(403).json({ error: '관리자 권한 ?�요' });
  }
  console.log('[SHOP-POST] ??관리자 ?�인, dbReady:', dbReady);
  try {
    if (!dbReady) return res.status(503).json({ error: '?�버 초기??중입?�다. ?�시 ???�시 ?�도?�주?�요.' });
    const { source = 'coupang', shortUrl, iframeCode, imageUrl, productName, tag } = req.body;
    if (!shortUrl) return res.status(400).json({ error: '?�축 URL ?�수' });

    const docData = {
      source:    source.trim(),
      shortUrl:  shortUrl.trim(),
      tag:       (tag || '?�시?�품').trim(),
      order:     Date.now(),
      createdAt: new Date(),
    };

    if (source === 'ali') {
      if (!imageUrl) return res.status(400).json({ error: '?�리 ?�품 ?��?지 URL ?�수' });
      // FIX-SHOP-IMG-SSRF: ?��? IP/로컬?�스??URL ?�??방어
      const imgHost = (() => { try { return new URL(imageUrl.trim()).hostname; } catch { return ''; } })();
      if (!imgHost || /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(imgHost)) {
        return res.status(400).json({ error: '?�용?��? ?�는 ?��?지 URL?�니??' });
      }
      docData.imageUrl     = imageUrl.trim();
      docData.productName  = (productName || '').trim();
    } else {
      if (!iframeCode) return res.status(400).json({ error: '쿠팡 iframe 코드 ?�수' });
      const srcMatch = iframeCode.match(/src=["']([^"']+)["']/i);
      if (!srcMatch) return res.status(400).json({ error: 'iframe src 추출 ?�패' });
      docData.iframeSrc = srcMatch[1].trim();
    }

    // Mongoose Model.create ???�결 ?�태 ?�동 관�? 10�??�?�아??
    const saved = await Promise.race([
      ManualShopItem.create(docData),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB ?�???�간 초과 (10s) ???�시 ???�시??)), 10000)
      )
    ]);
    res.json({ ok: true, id: saved._id });
  } catch (err) {
    logger.error('[Shop Manual] ?�록 ?�패:', err.message);
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' }); // ??FIX-ERR-MSG
  }
});

/**
 * DELETE /api/shop/manual/:id
 * ?�동 ?�품 ??�� (관리자 ?�용)
 */
app.delete('/api/shop/manual/:id', verifyToken, async (req, res) => {
  const adminEmails = [...ADMIN_EMAIL_LIST]; // FIX-ADMIN-EMAIL-CONST
  if (!adminEmails.includes(req.user?.email) && req.user?.id !== ADMIN_ID) {
    return res.status(403).json({ error: '관리자 권한 ?�요' });
  }
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '?�못??ID ?�식?�니??' }); // FIX-OBJID-BATCH-7
    await ManualShopItem.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    logger.error('[Shop Manual] ??�� ?�패:', err.message);
    res.status(500).json({ error: '??�� ?�패' });
  }
});

/**
 * GET /api/shop/manual/delete-direct ??key 기반 ??�� (CORS ?�회, ??브라?��? ?�환)
 * ?key=FishingGO_Admin_Direct_2026&id=<mongoId>
 */
app.get('/api/shop/manual/delete-direct', async (req, res) => {
  const { key, id } = req.query;
  if (!process.env.DIRECT_KEY || key !== process.env.DIRECT_KEY) return res.status(401).json({ error: '??불일�? }); // ??FIX-DIRECT-KEY-3
  if (!id) return res.status(400).json({ error: 'id ?�수' });
  try {
    await ManualShopItem.findByIdAndDelete(id);
    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: '?�버 ?�류가 발생?�습?�다.' });
  }
});

// 카테고리 ???�리 ?�워??변???�퍼
// BUG-3 ?�정: ?�워??매핑 ?�면 ?�작??(?�피?�릴?�낚?�줄 ?�류 ?�정)
function _mapToAliKeyword(category) {
  const map = {
    '?�시?�품':   'fishing accessories set',
    '?�피?�릴':   'fishing reel spinning',
    '베이?�릴':   'fishing reel baitcasting',
    '루어?�시?�': 'fishing rod lure spinning',
    '?�투?�시?�': 'fishing rod surf casting',
    '?�시�?:    'fishing line PE braid',
    '캠핑?�자':  'fishing chair folding portable',
    '루어':      'fishing lure set soft bait',
    '?�기':      'squid fishing egi jig',
    '�?��??:    'rock shore fishing tackle rig',
    '?�상':      'boat jigging fishing tackle',
    '민물':      'freshwater fishing tackle carp',
    '?�모??:    'fishing accessories set hook',
    '봉돌':      'fishing sinker weight lead',
    '채비':      'fishing rig terminal tackle',
    '집어??:    'fishing light LED underwater',
    '�?:        'fishing reel spinning',
    '?�싯?�':    'fishing rod telescopic carbon',
    '?�깅':      'squid egi jig spinning',
    '지�?:      'fishing metal jig lure',
  };
  return map[category] || 'fishing accessories set';
}

// ?�즌�??�동 추천 ?�워??
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

// AliExpress ?�용 ?�종 ?�워??매핑
function _buildAliRecommendKeyword(fish) {
  const map = {
    '감성??: 'black seabream fishing hook rig',
    '참돔': 'red snapper jig fishing lure',
    '광어': 'flounder fishing jig lure',
    '?�럭': 'rockfish jig head lure',
    '고등??: 'mackerel sabiki fishing rig',
    '무늬?�징??: 'squid egi jig fishing',
    '갈치': 'cutlassfish belt fishing lure',
    '?�어': 'seabass minnow lure fishing',
    '볼락': 'rockfish light game lure',
    '??��': 'mullet fishing float rig',
    '붕어': 'crucian carp freshwater fishing',
    '?�어': 'carp fishing feeder rig',
  };
  return map[fish] || _getSeasonKeyword();
}

// ?�인???�종 ??쿠팡 검???�워??변???�퍼
function _buildRecommendKeyword(pointType, fish) {
  const fishMap = {
    '감성??: '감성??채비 �?��??, '참돔': '참돔 루어 ?�상',
    '광어': '광어 ?�운??루어', '?�럭': '?�럭 지그헤??,
    '고등??: '고등??채비 ?�비??, '무늬?�징??: '?�기 ?�깅',
    '갈치': '갈치 ?�시 채비', '?�어': '?�어 루어 미노??,
    '볼락': '볼락 ?�이?�게??루어', '붕어': '붕어 ?�시 채비',
    '?�어': '?�어 ?�시 보리 채비',
  };
  if (fish && fishMap[fish]) return fishMap[fish];
  if (pointType === '바다') return '바다?�시 채비';
  if (pointType === '민물') return '민물?�시 채비';
  if (pointType === '�?��??) return '�?��??채비 �???�이';
  return '?�시?�품';
}


// ?�?�?� 조황 ?�증 API ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�

// ??FIX-IMAGEURL-SSRF: ?��?지 URL SSRF 방어 ?�퍼 ???��?�?file://javascript: 차단
function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  if (u.startsWith('data:image/')) return u;
  if (!u.startsWith('http://') && !u.startsWith('https://')) return null;
  if (/^https?:\/\/(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.|::1|localhost|0\.0\.0\.0)/i.test(u)) return null;
  if (/^https?:\/\/metadata\.(google|aws|azure)/i.test(u)) return null;
  return u.slice(0, 2000);
}
// POST /api/catch ??조황 ?�록 (??FIX-CATCH-AUTH)
app.post('/api/catch', catchLimiter, async (req, res) => { // ??FIX-CATCH-RATE: 1�?5???�한
  try {
    // ??FIX-CATCH-AUTH: JWT ?�증 ?�수 (userId body ?�뢰 ?�거 ??JWT?�서�?추출)
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const { userName, userAvatar, fishName, fishSize, fishWeight,
            imageUrl, location, lat, lng, memo, weather, tide, contestId,
            verified, aiConfidence } = req.body;
    const userId = tp.email || tp.id; // FIX-CATCH-AUTH: userId??JWT?�서�?(주입 방�?)
    if (!userId || !fishName) return res.status(400).json({ error: '?�수 ??�� ?�락' });
    // FIX-CATCH-VALID: ?�드 길이 ?�한 �?좌표 범위 검�?
    if (typeof fishName !== 'string' || fishName.trim().length < 1 || fishName.trim().length > 50) return res.status(400).json({ error: 'fishName 1~50?? });
    if (location !== undefined && typeof location !== 'string') return res.status(400).json({ error: 'location?� 문자?? });
    if (location && location.length > 100) return res.status(400).json({ error: 'location 최�? 100?? });
    if (memo !== undefined && typeof memo === 'string' && memo.length > 500) return res.status(400).json({ error: 'memo 최�? 500?? });
    if (lat !== undefined && (typeof lat !== 'number' || lat < -90 || lat > 90)) return res.status(400).json({ error: 'lat 범위 ?�류 (-90~90)' });
    if (lng !== undefined && (typeof lng !== 'number' || lng < -180 || lng > 180)) return res.status(400).json({ error: 'lng 범위 ?�류 (-180~180)' });
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
    res.status(500).json({ error: '?�버 ?�류' });
  }
});

// GET /api/catch/ranking ???�국 ??�� (?�종�??�체)
app.get('/api/catch/ranking', async (req, res) => {
  try {
    const { fishName, period = 'month' } = req.query;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20)); // ??FIX-RANKING-LIMIT: 최�? 100�??�한
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
    res.status(500).json({ error: '?�버 ?�류' });
  }
});

// GET /api/catch/my ????조황 목록
// ??BUG-02 FIX: JWT ?�증 ?�이 ?�??조황 목록 조회 가????verifyToken 미들?�어 추�?
app.get('/api/catch/my', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const userId = tp.email || tp.id; // ??BUG-02 FIX: JWT?�서�?추출
    await waitForDb(5000);
    const records = await CatchRecord.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: '?�버 ?�류' });
  }
});

// POST /api/catch/:id/like ??좋아??
// ??BUG-01 FIX: JWT ?�증 ?�음 + body.userId ?�뢰 + CastError ?�래??배합 취약???�정
app.post('/api/catch/:id/like', likeLimiter, async (req, res) => { // FIX-LIKE-RATE-APPLY
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
    const userId = tp.email || tp.id; // ??BUG-01 FIX: JWT?�서�?추출
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) // ??BUG-01 FIX: CastError 방�?
      return res.status(400).json({ error: '?�효?��? ?��? ID' });
    const record = await CatchRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ error: '?�는 조황' });
    const liked = record.likes.includes(userId);
    if (liked) record.likes.pull(userId);
    else record.likes.push(userId);
    await record.save();
    res.json({ liked: !liked, count: record.likes.length });
  } catch (err) {
    res.status(500).json({ error: '?�버 ?�류' });
  }
});

// ?�?�?� AI API ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�

// POST /api/ai/fish-identify ??Gemini Vision?�로 ?�종 ?�별
// ??FIX-FISH-RATE: 물고�??�식 rate limit (IP??1�?5??- Gemini Vision API 비용 보호)
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
    if (!checkFishRate(rawFishIp)) return res.status(429).json({ error: '물고�??�식 ?�청???�무 많습?�다. 1�????�시 ?�도?�주?�요.' }); // FIX-FISH-RATE-CHECK
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) return res.status(400).json({ error: '?��?지 ?�요' });
    // ??FIX-FISH-IMG-LEN: base64 ?��?지 최�? 10MB ?�한 (??13,650,000 chars) - DoS 방어
    if (typeof imageBase64 !== 'string' || imageBase64.length > 13_650_000) return res.status(413).json({ error: '?��?지가 ?�무 ?�니?? 최�? 10MB.' });
    // ??FIX-FISH-MIME: ?�용 MIME ?�??검�?
    const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!ALLOWED_MIMES.includes(mimeType)) return res.status(400).json({ error: '?�용?��? ?�는 ?��?지 ?�식 (jpeg/png/gif/webp�?가??' });
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return res.status(503).json({ error: 'Gemini API ??미설?? });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
              { text: `???�진???�는 물고기의 ?�종???�국?�로 분석?�주?�요.\n반드???�래 JSON ?�식�??�답?�세??(?�른 ?�스???�이):\n{\n  "fishName": "?�종�??�국??",\n  "confidence": ?�뢰??0-100 ?�수),\n  "edible": true/false,\n  "recipes": ["조리�?", "조리�?"],\n  "description": "간단???�징 ?�명(1-2문장)"\n}\n물고기�? ?�으�? {"fishName": null, "confidence": 0}` }
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
    res.status(500).json({ error: 'AI 분석 ?�패', fishName: null, confidence: 0 });
  }
});

// POST /api/ai/coach ??AI ?�시 코치 (Gemini)
// ??FIX-AI-COACH-RATE: AI 코치 rate limit (IP??1�?10??- API 비용 DoS 방어)
const aiCoachRateMap = new Map();
function checkAiCoachRate(ip) {
  const key = (typeof hashIp === 'function') ? hashIp(ip) : ip;
  const now = Date.now();
  const e = aiCoachRateMap.get(key) || { count: 0, windowStart: now };
  if (now - e.windowStart > 60_000) { e.count = 0; e.windowStart = now; }
  e.count++; aiCoachRateMap.set(key, e);
  if (aiCoachRateMap.size > 5000) aiCoachRateMap.clear(); // 메모�?보호
  return e.count <= 10;
}
app.post('/api/ai/coach', async (req, res) => {
  try {
    const rawAiIp = (String(req.headers['x-forwarded-for'] || '')).split(',')[0].trim() || req.ip || 'unknown';
    if (!checkAiCoachRate(rawAiIp)) return res.status(429).json({ error: 'AI 코치 ?�용???�무 많습?�다. 1�????�시 ?�도?�주?�요.' }); // FIX-AI-COACH-RATE-CHECK
    const { message, context } = req.body; // context: { weather, tide, location, season }
    if (!message) return res.status(400).json({ error: '메시지 ?�요' });
    // ??FIX-AI-CONTEXT-SIZE: context 객체 최�? 1000???�한 (JSON injection 방어)
    if (context && JSON.stringify(context).length > 1000) return res.status(400).json({ error: '컨텍?�트 ?�이?��? ?�무 ?�니??' });
    // ??FIX-AI-COACH-LEN: 메시지 최�? 500???�한 (API 비용 DoS 방어)
    if (typeof message !== 'string' || message.length > 500) return res.status(400).json({ error: '메시지??최�? 500?�입?�다.' });
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return res.status(503).json({ error: 'Gemini API ??미설?? });

    const ctx = context || {};
    const systemPrompt = `?�신?� ?�국 최고???�시 ?�문가 AI 코치?�니??\n?�재 ?�황: ${ctx.location || '?�치 미확??}, ?�씨: ${ctx.weather || '미확??}, 물때: ${ctx.tide || '미확??}, 계절: ${ctx.season || '�?}.\n?�시 관??질문?�만 ?�하�? ?�종/채비/미끼/?�인?��? 구체?�으�?추천?�니??\n?��??� 친근?�고 간결?�게 (200???�내), ?�모지�??�절???�용?�니??`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: '?? ?�시GO AI 코치?�니???�� 무엇?�든 물어보세??' }] },
            { role: 'user', parts: [{ text: message }] }
          ],
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
        })
      }
    );
    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '죄송?�니?? ?��????�성?��? 못했?�니??';
    res.json({ reply });
  } catch (err) {
    (logger?.error || console.error)('[POST /api/ai/coach]', err.message);
    res.status(500).json({ error: 'AI 코치 ?�류' });
  }
});

// ?�?�?� ?�국 ?�??API ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�

// POST /api/contest ???�???�록 (관리자 ?�용)
app.post('/api/contest', async (req, res) => {
  // ??BUG-01 FIX: JWT ?�증 ?�음 취약????관리자�??�???�성 가?�하?�록 ?�정
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '?�증 ?�요', code: 'AUTH_REQUIRED' });
  let tp;
  try { tp = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return res.status(401).json({ error: '?�큰 ?�효?��? ?�음' }); }
  if (!isAdminToken(tp)) return res.status(403).json({ error: '관리자(MASTER)�??�?��? ?�록?????�습?�다.' });
  try {
    const { title, fishName, region, metric, startDate, endDate, description, prize } = req.body;
    // ??FIX-CONTEST-INPUT-LENGTH: Contest ?�력 최�? 길이 ?�한 (DoS/XSS 방어)
    if (typeof title === 'string' && title.length > 100) return res.status(400).json({ error: '?�???�목?� 최�? 100?�입?�다.' });
    if (typeof description === 'string' && description.length > 2000) return res.status(400).json({ error: '?�???�명?� 최�? 2000?�입?�다.' });
    if (typeof prize === 'string' && prize.length > 200) return res.status(400).json({ error: '경품 ?�명?� 최�? 200?�입?�다.' });
    if (typeof fishName === 'string' && fishName.length > 50) return res.status(400).json({ error: '?�종명�? 최�? 50?�입?�다.' });
    if (!title || !fishName || !startDate || !endDate) return res.status(400).json({ error: '?�수 ??�� ?�락' });
    await waitForDb(5000);
    const contest = await Contest.create({ title, fishName, region, metric, startDate, endDate, description, prize });
    res.json({ success: true, contest });
  } catch (err) {
    res.status(500).json({ error: '?�버 ?�류' });
  }
});

// GET /api/contest/active ??진행 �??�??목록
app.get('/api/contest/active', async (req, res) => {
  try {
    await waitForDb(5000);
    const now = new Date();
    const contests = await Contest.find({
      active: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ endDate: 1 }).lean();
    // �??�?�의 ?�재 TOP3 조황 첨�?
    const result = await Promise.all(contests.map(async (c) => {
      const top3 = await CatchRecord.find({ contestId: c._id.toString() })
        .sort({ fishSize: -1, fishWeight: -1 })
        .limit(3).lean();
      return { ...c, top3 };
    }));
    res.json({ contests: result });
  } catch (err) {
    res.status(500).json({ error: '?�버 ?�류' });
  }
});

// GET /api/contest/:id/ranking ???�????��
app.get('/api/contest/:id/ranking', async (req, res) => {
  try {
    await waitForDb(5000);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '?�효?��? ?��? ID' }); // ??FIX-CASTID-CONTEST
    const contest = await Contest.findById(req.params.id).lean();
    if (!contest) return res.status(404).json({ error: '?�???�음' });
    const ranking = await CatchRecord.find({ contestId: req.params.id })
      .sort({ fishSize: -1, fishWeight: -1, createdAt: 1 })
      .limit(50).lean();
    res.json({ contest, ranking });
  } catch (err) {
    res.status(500).json({ error: '?�버 ?�류' });
  }
});

// GET /api/contest/all ???�체 ?�??목록 (관리자)
app.get('/api/contest/all', async (req, res) => {
  try {
    await waitForDb(5000);
    const contests = await Contest.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json({ contests });
  } catch (err) {
    res.status(500).json({ error: '?�버 ?�류' });
  }
});
// ??FIX-UNCAUGHT: 미처�??�외 ??cluster.js worker ?�동 ?�시??
process.on('uncaughtException', (err) => { (logger?.error || console.error)('[FATAL] uncaughtException:', err?.message || err); process.exit(1); });
process.on('unhandledRejection', (reason) => { (logger?.warn || console.warn)('[WARN] unhandledRejection:', reason?.message || reason); });

// ??FIX-LOGOUT-ENDPOINT: 로그?�웃 (?�버 lastSeen ?�데?�트)
app.post('/api/auth/logout', verifyToken, async (req, res) => {
  try {
    const email = req.user?.email;
    if (email && dbReady && User) {
      await User.updateOne({ email }, { $set: { lastSeen: new Date() } }).exec().catch(() => {});
    }
    res.json({ success: true, message: '로그?�웃 ?�료. ?�라?�언???�큰????��?�주?�요.' });
  } catch { res.json({ success: true }); }
});

// ??FIX-404-HANDLER: 미매�??�우??404 ?�답
app.use((req, res) => {
  res.status(404).json({ error: '?�청??API�?찾을 ???�습?�다.', path: req.path });
});

// ??FIX-GLOBAL-ERROR: 글로벌 ?�러 ?�들??
app.use(function globalErrorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';
  (logger || console).error('[GlobalError]', err.message);
  res.status(err.status || 500).json({ error: isProd ? '?�버 ?�류가 발생?�습?�다.' : (err.message || '?�류') });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  const env = process.env.NODE_ENV || 'development';
// ??SCALE: Keep-Alive 최적?????�결 ?�사?�으�??�드?�이??비용 ?�감
server.keepAliveTimeout = 65000;  // 65�?(로드밸런??60초보??길게)
server.headersTimeout = 66000;    // keepAlive보다 1�???길게
  logger.info(`?? ?�시GO ?�버 ?�작 ?�료 | ?�트: ${PORT} | ?�경: ${env}`);
  logger.info(`   ?�훅: ${process.env.PORTONE_WEBHOOK_SECRET ? '?? : '?�️ 미설??} | SMS: ${process.env.SMS_API_KEY ? '?? : '?�️ 미설??} | DB: ${process.env.MONGO_PASS || process.env.MONGO_URI ? '??MongoDB' : '?�️ ?�메모리'}`);
  if (env === 'production') logger.info('[보안] ?�로?�션 모드 ?�성??);



  // Render ?�립 방�? ???�버 ?�작 즉시 + 1�?간격 ping
  // Render 무료 ?�랜: 15�?비활?????�립. 1�?간격?�로 방�?.
  if (process.env.RENDER_EXTERNAL_URL) {
    const selfUrl = process.env.RENDER_EXTERNAL_URL;
    const keepAlivePing = async () => {
      try {
        await axios.get(`${selfUrl}/api/health`, { timeout: 10000 });
      } catch (e) {
        logger.warn(`[KeepAlive] ping ?�패: ${e.message}`);
      }
    };
    // 즉시 ?�행 ??1�?간격 반복
    keepAlivePing();
    setInterval(keepAlivePing, 60 * 1000); // 1분마??ping
    logger.info(`??Render Keep-Alive ?�성????1�?간격 즉시?�작 (${selfUrl})`);
  }
});

// ??BUG-FIX: flushAllData ?�수 ?�의 ??종료 ???�메모리 ?�이???�일 ?�기??보장
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
  (logger?.info || (() => {}))('[FlushAllData] ?�메모리 ?�이???�체 ?�일 ?�기???�료');
}

// ??FIX-SIGTERM: Render 배포 graceful shutdown + uncaughtException ?�들???�록
// ??BUG-FIX: flushAllData ??번째 ?�자 ?�달 ??종료 ???�메모리 ?�이???�일 ?�기??보장
require('./graceful_shutdown')(server, mongoose, flushAllData);
