const express = require('express');
const http = require('http');
const dns = require('dns');

// 통신사/로컬망 DNS에서 SRV 레코드 조회를 차단하는 경우를 우회하기 위해 Google Public DNS 강제 사용
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  console.log('✅ 강제 DNS 설정 적용 (8.8.8.8)');
} catch (e) {
  console.log('⚠️ 강제 DNS 설정 실패:', e.message);
}

const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const coupang = require('./coupangService');

const JWT_SECRET = process.env.JWT_SECRET || 'fishinggo_secret_2024';
if (!process.env.JWT_SECRET) {
  console.warn('[SECURITY] ⚠️ JWT_SECRET 환경변수가 설정되지 않았습니다. 프로덕션에서는 반드시 환경변수로 설정하세요!');
}

// In-Memory Fallback - DB 없어도 작동
const USERS_FILE = path.join(__dirname, 'users.json');
const POSTS_FILE = path.join(__dirname, 'posts.json');
const RECORDS_FILE = path.join(__dirname, 'records.json');
const CREWS_FILE = path.join(__dirname, 'crews.json');
const CHATS_FILE = path.join(__dirname, 'chats.json');
const NOTICES_FILE   = path.join(__dirname, 'notices.json');
const BUSINESS_FILE  = path.join(__dirname, 'business.json');
const SECRET_OVERRIDES_FILE = path.join(__dirname, 'secretPointOverrides.json');
const CCTV_OVERRIDES_FILE   = path.join(__dirname, 'cctvOverrides.json');
const PRO_SUBS_FILE         = path.join(__dirname, 'proSubscriptions.json');
const VVIP_SLOTS_FILE       = path.join(__dirname, 'vvipSlots.json');

let memUsers = [];
let memPosts = [];
let memRecords = [];
let memCrews = [];
let chatHistories = {};
let memNotices = [
  { _id: 'n1', id: 'n1', title: '🎉 낚시GO 서비스 오픈 안내', content: '낚시GO 플랫폼이 정식 오픈되었습니다! 더 많은 기능이 업데이트될 예정입니다.\n\n✅ 주요 기능:\n- 실시간 물때 및 날씨 정보\n- 낚시 포인트 지도\n- 커뮤니티 게시판\n- 크루 채팅\n\n앞으로도 지속적으로 업데이트 예정이니 많은 이용 부탁드립니다.', isPinned: true,  author: 'MASTER', views: 1240, date: '2025-01-01', createdAt: '2025-01-01T00:00:00.000Z' },
  { _id: 'n2', id: 'n2', title: '⚠️ 서비스 점검 공지 (4월)',  content: '4월 20일 새벽 2시~4시 서버 업그레이드 점검이 있습니다.\n\n점검 시간: 04월 20일 02:00 ~ 04:00\n점검 내용: 서버 성능 최적화 및 DB 마이그레이션\n\n이용에 참고해주세요.', isPinned: false, author: 'MASTER', views: 482, date: '2025-04-15', createdAt: '2025-04-15T00:00:00.000Z' },
];
let memBusinessPosts = [
  { id: 'b3_vip', shipName: '묵호 VIP 크루즈', author: '박선장', author_email: 'park@demo.com', type: '선상/크루즈', target: '광어구', region: '강원 묵호항', date: '연중무휴', price: '1인 65,000원', phone: '010-1234-0001', content: 'VVIP 전용 묵호항 1위 독점 선상낚시! 광어, 우럭, 가자미 최고 포인트를 안내드립니다. 최신 FRP 낚시 전용선으로 안전하고 쾌적하게 즐기세요.', cover: 'https://images.unsplash.com/photo-1544551763-8dd44758c2dd?auto=format&fit=crop&w=600&q=80', isPinned: true, harborId: 'GN_005', createdAt: new Date() },
  { id: 'b1', shipName: '속초 이서호', author: '이사장', author_email: 'lee@demo.com', type: '선상낚시', target: '구럭/광어', region: '강원 속초', date: '매주 토/일', price: '1인 55,000원', phone: '010-1234-0002', content: '속초 대표 선상낚시! 동해 최고 포인트 직행. 장비 무료 대여, 초보자 환영합니다.', cover: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=600&q=80', isPinned: false, createdAt: new Date() },
  { id: 'b2', shipName: '통영 이선호크루', author: '통영호크루', author_email: 'ttg@demo.com', type: '중고선', target: '멕주바리/스나', region: '경남 통영', date: '매일 출항', price: '7시간 49,900원', phone: '010-1234-0003', content: '남해 통영의 황금 포인트! 참돔, 멱주바리 전문 선상낚시. 안전 장비 완비.', cover: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80', isPinned: false, createdAt: new Date() },
];

// ⚠️ 아래 4개 변수는 파일 로드 코드(55줄) 이전에 선언해야 TDZ 에러가 없습니다
let secretPointOverrides = {};
let cctvOverrides        = {};
let memProSubs           = {};
let memVvipSlots         = {};

try {
  if (fs.existsSync(USERS_FILE)) memUsers = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  if (fs.existsSync(POSTS_FILE)) memPosts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
  if (fs.existsSync(RECORDS_FILE)) memRecords = JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf-8'));
  if (fs.existsSync(CREWS_FILE)) memCrews = JSON.parse(fs.readFileSync(CREWS_FILE, 'utf-8'));
  if (fs.existsSync(CHATS_FILE)) chatHistories = JSON.parse(fs.readFileSync(CHATS_FILE, 'utf-8'));
  if (fs.existsSync(NOTICES_FILE)) memNotices = JSON.parse(fs.readFileSync(NOTICES_FILE, 'utf-8'));
  if (fs.existsSync(BUSINESS_FILE)) memBusinessPosts = JSON.parse(fs.readFileSync(BUSINESS_FILE, 'utf-8'));
  if (fs.existsSync(SECRET_OVERRIDES_FILE)) secretPointOverrides = JSON.parse(fs.readFileSync(SECRET_OVERRIDES_FILE, 'utf-8'));
  if (fs.existsSync(CCTV_OVERRIDES_FILE))   cctvOverrides        = JSON.parse(fs.readFileSync(CCTV_OVERRIDES_FILE, 'utf-8'));
  if (fs.existsSync(PRO_SUBS_FILE))         memProSubs           = JSON.parse(fs.readFileSync(PRO_SUBS_FILE, 'utf-8'));
  if (fs.existsSync(VVIP_SLOTS_FILE))       memVvipSlots         = JSON.parse(fs.readFileSync(VVIP_SLOTS_FILE, 'utf-8'));
  console.log(`[Fallback] 로컬 보존 파일 로드 완료. (유저:${memUsers.length}, 게시글:${memPosts.length}, 비밀포인트오버라이드:${Object.keys(secretPointOverrides).length}, CCTV오버라이드:${Object.keys(cctvOverrides).length}, PRO구독:${Object.keys(memProSubs).length}, VVIP슬롯:${Object.keys(memVvipSlots).length})`);
} catch (e) {
  console.log('[Fallback] 로컬 JSON 로드 실패, 빈 배열로 시작합니다.', e.message);
}

function saveMemUsers() { try { fs.writeFileSync(USERS_FILE, JSON.stringify(memUsers, null, 2)); } catch (e) {} }
function saveMemPosts() { try { fs.writeFileSync(POSTS_FILE, JSON.stringify(memPosts, null, 2)); } catch (e) {} }
function saveMemRecords() { try { fs.writeFileSync(RECORDS_FILE, JSON.stringify(memRecords, null, 2)); } catch (e) {} }
function saveMemCrews() { try { fs.writeFileSync(CREWS_FILE, JSON.stringify(memCrews, null, 2)); } catch (e) {} }
function saveChatHistories() { try { fs.writeFileSync(CHATS_FILE, JSON.stringify(chatHistories, null, 2)); } catch (e) {} }
function saveMemNotices() { try { fs.writeFileSync(NOTICES_FILE, JSON.stringify(memNotices, null, 2)); } catch (e) {} }
function saveMemBusinessPosts() { try { fs.writeFileSync(BUSINESS_FILE, JSON.stringify(memBusinessPosts, null, 2)); } catch (e) {} }
function saveSecretPointOverrides() { try { fs.writeFileSync(SECRET_OVERRIDES_FILE, JSON.stringify(secretPointOverrides, null, 2)); } catch (e) {} }
function saveCctvOverrides()        { try { fs.writeFileSync(CCTV_OVERRIDES_FILE,   JSON.stringify(cctvOverrides,        null, 2)); } catch (e) {} }
function saveProSubs()              { try { fs.writeFileSync(PRO_SUBS_FILE,          JSON.stringify(memProSubs,           null, 2)); } catch (e) {} }
function saveVvipSlots()            { try { fs.writeFileSync(VVIP_SLOTS_FILE,        JSON.stringify(memVvipSlots,         null, 2)); } catch (e) {} }

let dbReady = false;

// ─── MongoDB 연결 ─────────────────────────────────────────────────────────────
const buildMongoUri = () => {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  const pass = process.env.MONGO_PASS;
  const host = process.env.MONGO_HOST || 'cluster0.cyqhznd.mongodb.net';
  const user = process.env.MONGO_USER || 'fishinggo';
  const db   = process.env.MONGO_DB   || 'fishinggo';
  if (pass) {
    const enc = encodeURIComponent(pass);
    return `mongodb+srv://${user}:${enc}@${host}/${db}?appName=Cluster0`;
  }
  return '';
};

const MONGO_URI = buildMongoUri();
if (MONGO_URI) {
  console.log('MongoDB 연결 시도 중...');
  mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    family: 4, // IPv4 강제 (DNS SRV 에러 방지용)
    heartbeatFrequencyMS: 10000, // 10초마다 heartbeat
  })
    .then(() => { dbReady = true; console.log('✅ MongoDB 연결 성공! 영구저장 모드 활성화'); })
    .catch(err => {
      dbReady = false;
      console.log('⚠️ MongoDB 연결실패 → 인메모리 모드 전환');
      console.log('원인:', err.message);
    });

  // ─── 자동 재연결 이벤트 핸들러 ────────────────────────────────
  mongoose.connection.on('disconnected', () => {
    dbReady = false;
    console.warn('[MongoDB] 연결 끊김 → 인메모리 모드로 자동 전환');
  });
  mongoose.connection.on('reconnected', () => {
    dbReady = true;
    console.log('[MongoDB] ✅ 재연결 성공 → MongoDB 모드 복구');
  });
  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] 연결 오류:', err.message);
    if (mongoose.connection.readyState !== 1) dbReady = false;
  });
} else {
  console.log('⚠️ MONGO_URI/MONGO_PASS 미설정 → 인메모리 모드.');
}

// ─── 모델 로드 ────────────────────────────────────────────────────────────────
let User, Post, Crew, Notice, BusinessPost, CctvOverrideModel, CatchRecord, ChatMessage, Subscription, PaymentHistory;
try {
  User             = require('./models/User');
  Post             = require('./models/Post');
  Crew             = require('./models/Crew');
  Notice           = require('./models/Notice');
  BusinessPost     = require('./models/BusinessPost');
  CctvOverrideModel= require('./models/CctvOverride');
  CatchRecord      = require('./models/CatchRecord');
  ChatMessage      = require('./models/ChatMessage');
  Subscription     = require('./models/Subscription');
  PaymentHistory   = require('./models/PaymentHistory');
} catch(e) { User = Post = Crew = Notice = BusinessPost = CctvOverrideModel = CatchRecord = ChatMessage = Subscription = PaymentHistory = null; }

// ─── 정기결제 스케줄러 (node-cron 또는 자체 폴백) ─────────────────────────────
let cron = null;
try { cron = require('node-cron'); } catch(e) { console.warn('[Scheduler] node-cron 미설치 → 자체 인터벌 폴백 사용'); }

// ─── 인메모리 Fallback 저장소 이미 상단에서 선언 및 로드 완료 ──────────────
// (secretPointOverrides, cctvOverrides, memProSubs, memVvipSlots 모두 파일 로드 완료됨)


const app = express();

// ─── 보안 헤더 (Helmet) ────────────────────────────────────────
try {
  const helmet = require('helmet');
  app.use(helmet({ contentSecurityPolicy: false })); // CSP는 SPA 프론트 판단에 맡김으로 off
  console.log('✅ Helmet 보안 헤더 적용');
} catch(e) { console.log('⚠️ helmet 미설치 → npm install helmet'); }

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
  console.log('✅ Compression 응답 압축 적용');
} catch(e) { console.log('⚠️ compression 미설치 → npm install compression'); }

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
  console.log('✅ Winston 로거 초기화 완료');
} catch(e) {
  // winston 미설치 시 console로 fallback
  logger = {
    info:  (...a) => console.log('[INFO]',  ...a),
    warn:  (...a) => console.warn('[WARN]',  ...a),
    error: (...a) => console.error('[ERROR]', ...a),
  };
  console.log('⚠️ winston 미설치 → console fallback 사용 (npm install winston)');
}
global.logger = logger;

// ─── CORS: 허용 도메인 화이트리스트 ──────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://fishing-go.vercel.app',
  'https://fishing-go-mbqp.vercel.app',
  /\.vercel\.app$/,  // Vercel 프리덼 배포 URL
];

// Render 헬스체크 전용 (사전 등록 — CORS 이전에 응답)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: dbReady ? 'mongodb' : 'memory', uptime: Math.floor(process.uptime()), time: new Date().toISOString() });
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('[CORS] Origin 없는 요청 차단 (프로덕션)');
        return callback(new Error('직접 API 접근이 허용되지 않습니다.'));
      }
      return callback(null, true); // 개발환경: Postman/curl 허용
    }
    const allowed = ALLOWED_ORIGINS.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    if (allowed) return callback(null, true);
    console.warn(`[CORS] 차단된 origin: ${origin}`);
    return callback(new Error('CORS 차단'));
  },
  credentials: true,
}));

// ─── Rate Limiter ────────────────────────────────────────────────────
try {
  const rateLimit = require('express-rate-limit');
  // 로그인/회원가입/OTP: 10분당 20회
  const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20,
    message: { error: '너무 많은 요청입니다. 10분 후 다시 시도해주세요.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  // 일반 API: 1분당 100회
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
  });
  app.use('/api/auth/', authLimiter);
  app.use('/api/', apiLimiter);
  console.log('✅ Rate Limiter 적용 (로그인 10분/20회, 일반 1분/100회)');
} catch(e) { console.log('⚠️ express-rate-limit 미설치 → npm install express-rate-limit'); }

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ─── JWT 인증 미들웨어 (선택적 보호 엔드포인트용) ───────────────
function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증이 필요합니다.' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch(e) {
    return res.status(401).json({ error: '토큰이 유효하지 않거나 만료되었습니다.' });
  }
}

// ─── 진단용 디버그 엔드포인트 ────────────────────────────────────────────────
// ─── 비밀포인트 좌표 오버라이드 API (MASTER 전용) ──────────────────────────────
// GET: 전체 오버라이드 조회 (모든 클라이언트에서 호출)
app.get('/api/secret-point-overrides', (req, res) => {
  res.json(secretPointOverrides);
});

// POST: 특정 포인트 좌표 저장 (어드민 JWT 인증 필수)
app.post('/api/secret-point-overrides', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET);
    if (p.id !== 'sunjulab' && p.email !== 'sunjulab') return res.status(403).json({ error: '관리자 권한 필요' });
  } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
  const { id, lat, lng } = req.body;
  if (!id || lat == null || lng == null) return res.status(400).json({ error: 'id, lat, lng 필수' });
  secretPointOverrides[String(id)] = { lat: parseFloat(lat), lng: parseFloat(lng) };
  saveSecretPointOverrides();
  console.log(`[SecretPoint] id=${id} 좌표 업데이트: ${lat}, ${lng}`);
  res.json({ ok: true, overrides: secretPointOverrides });
});

// DELETE: 특정 포인트 초기화 (어드민 JWT 인증 필수)
app.delete('/api/secret-point-overrides/:id', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET);
    if (p.id !== 'sunjulab' && p.email !== 'sunjulab') return res.status(403).json({ error: '관리자 권한 필요' });
  } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
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

// 실시간 크루 채팅 서버 로직 (chatHistories는 상단에서 선언되었습니다)

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_crew', async (crewId) => {
    socket.join(crewId);
    // DB에서 최근 100개 메시지 로드
    if (dbReady && ChatMessage) {
      try {
        const msgs = await ChatMessage.find({ crewId }).sort({ createdAt: -1 }).limit(100);
        chatHistories[crewId] = msgs.reverse().map(m => ({ sender: m.sender, text: m.text, time: m.time }));
      } catch(e) {}
    }
    if (!chatHistories[crewId]) chatHistories[crewId] = [];
    socket.emit('chat_history', chatHistories[crewId]);
  });

  socket.on('send_msg', async (data) => {
    // ── 서버 사이드 유효성 검증 ──────────────────────────────
    const text = (data.text || '').toString().trim();
    if (!text || text.length > 500) return; // 빈값/500자 초과 차단
    if (!data.crewId || typeof data.crewId !== 'string') return;
    const sender = (data.sender || 'Anonymous').toString().slice(0, 30);

    const msgData = {
      sender,
      text,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    if (!chatHistories[data.crewId]) chatHistories[data.crewId] = [];
    chatHistories[data.crewId].push(msgData);
    // 방 전체 인원에게 발송
    io.to(data.crewId).emit('new_msg', msgData);
    // DB 영구저장
    if (dbReady && ChatMessage) {
      try {
        await new ChatMessage({ crewId: data.crewId, sender: msgData.sender, text: msgData.text, time: msgData.time }).save();
        // DB 모드에서도 일정 비율로 파일 백업 (서버 재시작 대비)
        if (chatHistories[data.crewId]?.length % 50 === 0) saveChatHistories();
      } catch(e) {}
    } else { saveChatHistories(); }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
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
};

async function getWaterTemp(sid) {
  const KEY = process.env.KHOA_KEY || '2c92debdb84fc6c2ca60816fa5e9acbbfa06a9ae502cc37919ebec6be629623a';
  
  // 경로 1: 공공데이터포털 공식 API (사용자 승인 경로)
  try {
    const url = `https://apis.data.go.kr/1192136/surveyWaterTemp/getSurveyWaterTempApiService?serviceKey=${KEY}&obsCode=${sid}&resultType=json`;
    const res = await axios.get(url, { timeout: 3000 });
    const sst = res.data?.response?.body?.items?.item?.[0]?.sst;
    if (sst && sst !== '-') return sst;
  } catch (e) { console.log(`[API 1 Fail] ${sid}`); }

  // 경로 2: 국립해양조사원 직결 API (백업 경로)
  try {
    const url = `http://www.khoa.go.kr/api/oceangrid/oceanObsSst/search.do?ServiceKey=${KEY}&ObsCode=${sid}&ResultType=json`;
    const res = await axios.get(url, { timeout: 3000 });
    const sst = res.data?.result?.data?.[0]?.sst;
    if (sst && sst !== '-') return sst;
  } catch (e) { console.log(`[API 2 Fail] ${sid}`); }

  return null;
}

async function updateAllStationsCache() {
  console.log(`[Batch] Updating ${ALL_STATIONS.length} stations...`);
  for (const sid of ALL_STATIONS) {
    const realSst = await getWaterTemp(sid);
    
    // 지점별 정보 또는 권역별 랜덤 프로파일 적용
    const base = observationData[sid] || { region: '남해', baseTemp: 16.5, baseWind: 3.0 };
    const profile = REGIONAL_PROFILES[base.region] || REGIONAL_PROFILES['남해'];
    
    // 지점별 고유성 부여
    const tempOffset = (Math.random() * 1.5 - 0.75).toFixed(1);
    const windOffset = (Math.random() * 3 - 1.5).toFixed(1);
    const waveOffset = (Math.random() * 0.6 - 0.3).toFixed(1);

    const finalTemp = realSst || (base.baseTemp + parseFloat(tempOffset)).toFixed(1);
    const finalWind = Math.max(0.2, (base.baseWind || profile.wind) + parseFloat(windOffset)).toFixed(1);
    const finalWave = Math.max(0.1, profile.wave + parseFloat(waveOffset)).toFixed(1);

    const seed = parseInt(sid.replace(/\D/g, '')) || 1;
    const tideNum = (seed % 14) + 1;
    const baseHighMin = (tideNum * 45 + seed * 7) % 1440;
    const baseLowMin  = (baseHighMin + 375) % 1440;
    const fmt = (mins) => {
      const m = ((mins % 1440) + 1440) % 1440;
      return `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
    };

    weatherCache[sid] = {
      data: {
        ...base,
        stationId: sid,
        sst: finalTemp,
        temp: `${finalTemp}°C`,
        wind: { speed: parseFloat(finalWind), dir: ['N','E','S','W','NE','SW'][Math.floor(Math.random()*6)] },
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
          current_level: `${Math.floor(Math.random()*250)+10}cm` 
        }
      },
      lastUpdated: new Date()
    };
    await new Promise(r => setTimeout(r, 80));
  }
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

// ─── Health Check (Render 슬립 방지 핑 수신용) ────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: dbReady ? 'mongodb' : 'memory',
    uptime: Math.floor(process.uptime()),
    time: new Date().toISOString(),
  });
});

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
    try { cloudinary = require('cloudinary').v2; } catch(e) {
      return res.json({ url: base64, type: 'base64' });
    }

    const result = await cloudinary.uploader.upload(base64, {
      folder,
      resource_type: 'auto',
      transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
    });
    res.json({ url: result.secure_url, type: 'cloudinary', publicId: result.public_id });
  } catch (err) {
    console.error('[Cloudinary Upload 실패]', err.message);
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
const PLAN_TIERS  = { LITE: 'BUSINESS_LITE', PRO: 'PRO', VVIP: 'BUSINESS_VIP' };

app.post('/api/payment/verify', async (req, res) => {
  try {
    const { imp_uid, merchant_uid, planId, tier, harborId, userId, userName } = req.body;
    if (!planId || !userId) return res.status(400).json({ error: '필수 항목 누락' });

    const expectedAmount = PLAN_PRICES[planId];
    const expectedTier   = tier || PLAN_TIERS[planId];
    const isTestMode     = !process.env.PORTONE_API_KEY;

    if (!isTestMode && imp_uid) {
      // ─── 실서비스: 포트원 API로 결제 금액 검증 ──────────────────
      try {
        const axios = require('axios');

        // 1) 액세스 토큰 발급
        const tokenRes = await axios.post('https://api.iamport.kr/users/getToken', {
          imp_key:    process.env.PORTONE_API_KEY,
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
        console.log(`[결제검증] ✅ ${userName} / ${planId} / ${payment.amount}원 / ${imp_uid}`);
      } catch (verifyErr) {
        console.error('[포트원 검증 오류]', verifyErr.message);
        return res.status(500).json({ error: '결제 검증 중 오류가 발생했습니다.' });
      }
    } else {
      // ─── 테스트 모드: 검증 생략, 즉시 구독 처리 ────────────────
      console.log(`[결제/테스트모드] ${userName} / ${planId} / ${expectedAmount}원`);
    }

    // ─── 구독 처리: DB 또는 인메모리 ────────────────────────────────
    const expiresAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(); // +31일

    if (dbReady && User) {
      await User.findOneAndUpdate(
        { $or: [{ email: userId }, { id: userId }] },
        { tier: expectedTier, subscriptionExpiresAt: expiresAt },
        { new: true }
      ).catch(e => console.warn('[결제] DB 업데이트 실패:', e.message));
    } else {
      const u = memUsers.find(u => u.email === userId || u.id === userId);
      if (u) { u.tier = expectedTier; u.subscriptionExpiresAt = expiresAt; saveMemUsers(); }
    }

    // VVIP 항구 선점 처리
    if (planId === 'VVIP' && harborId) {
      try {
        await apiClient?.post?.('/api/vvip/purchase', { harborId, userId, userName }).catch(() => {});
      } catch(e) {}
    }

    res.json({
      success:    true,
      tier:       expectedTier,
      expiresAt,
      planId,
      imp_uid:    imp_uid || 'test_mode',
      testMode:   isTestMode,
    });
  } catch (err) {
    console.error('[POST /api/payment/verify]', err.message);
    res.status(500).json({ error: '서버 오류: ' + err.message });
  }
});

// ─── 포트원 웹훅 (결제 완료 서버 측 이벤트) ──────────────────────────────────
// Render 설정: 포트원 콘솔 → 웹훅 URL = https://[your-server].onrender.com/api/payment/webhook
app.post('/api/payment/webhook', async (req, res) => {
  try {
    const { imp_uid, merchant_uid, status } = req.body;
    console.log(`[Webhook] imp_uid=${imp_uid} status=${status}`);

    if (status === 'paid') {
      // merchant_uid 패턴: fishing_PLANID_harborId_timestamp
      const parts   = (merchant_uid || '').split('_');
      const planId  = parts[1] || null;
      if (planId && PLAN_PRICES[planId]) {
        console.log(`[Webhook] ✅ 결제 완료 확인 - ${planId} / ${imp_uid}`);
      }
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[Webhook 오류]', err.message);
    res.status(200).json({ ok: false }); // 포트원 웹훅은 200 반환 필수
  }
});

// 레벨 설정 (서버와 프론트엔드를 자동 동기화)
const LEVEL_CONFIG = [
  { level: 1,  title: '초보 낙시꿼',   expRequired: 0    },
  { level: 2,  title: '견습 낙시꿼',   expRequired: 100  },
  { level: 3,  title: '낙시 입문자',   expRequired: 250  },
  { level: 4,  title: '낙시 애호가',   expRequired: 500  },
  { level: 5,  title: '베테랑 낙시인', expRequired: 850  },
  { level: 6,  title: '중급 낙시꿼',   expRequired: 1300 },
  { level: 7,  title: '고수 낙시인',   expRequired: 1900 },
  { level: 8,  title: '낙시 장인',     expRequired: 2700 },
  { level: 9,  title: '전설의 낙시인', expRequired: 3700 },
  { level: 10, title: '낙시의 신',     expRequired: 5000 },
];

// 활동별 EXP 보상
const EXP_REWARDS = {
  attendance:    20,
  post_write:    30,
  record_write:  50,
  comment_write: 10,
  like_receive:   5,
  point_visit:   15,
  photo_upload:  25,
  first_catch:  100,
  weekly_streak: 80,
  monthly_streak:300,
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
      title: `초월 낙시신 ${extraLevelIndex + 1}단계`,
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
  return {
    id:              user._id || user.id,
    email:           user.email,
    name:            user.name,
    level:           levelInfo.level,
    exp:             levelInfo.expInLevel,
    totalExp,
    levelTitle:      levelInfo.title,
    expNeeded:       levelInfo.expNeeded,
    tier:            user.tier || 'FREE',
    avatar:          user.avatar || null,
    picture:         user.picture || null,
    followers:       user.followers || [],
    following:       user.following || [],
    notiSettings:    user.notiSettings || { flow: true, bait: true, comm: true },
    totalAttendance: user.totalAttendance || 0,
    streak:          user.streak || 0,
  };
}

function applyAttendance(user) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let justAttended = false;
  let leveledUp = false;
  let expGained = 0;

  if (user.lastAttendance !== today) {
    // 연속 출석 스트릭
    if (user.lastAttendance === yesterday) {
      user.streak = (user.streak || 0) + 1;
    } else {
      user.streak = 1; // 출석 끄김 시 리셋
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
    const newLevel  = getLevelFromExp(user.totalExp).level;
    user.level = newLevel;

    if (newLevel > prevLevel) leveledUp = true;
    justAttended = true;
  }
  return { justAttended, leveledUp, expGained, streak: user.streak || 0 };
}

// --- 아이디(email 필드 활용) 중복 확인 ---
app.post('/api/auth/check-id', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) return res.status(400).json({ error: '아이디를 입력해주세요.' });
    const id = email.trim();
    // DB 모드 시도 → 실패하면 인메모리 fallback
    if (dbReady && User) {
      try {
        const existing = await User.findOne({ email: id });
        return res.json({ available: !existing });
      } catch (dbErr) {
        console.error('[check-id] DB 조회 실패, 인메모리 fallback:', dbErr.message);
      }
    }
    // 인메모리 fallback
    const existing = memUsers.find(u => u.email === id);
    return res.json({ available: !existing });
  } catch(err) {
    console.error('[check-id] 오류:', err.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// --- 프로필 사진 변경 ---
app.post('/api/user/avatar', async (req, res) => {
  try {
    const { email, avatar } = req.body;
    if (!email || !avatar) return res.status(400).json({ error: '이메일과 이미지 데이터가 필요합니다.' });
    
    if (dbReady && User) {
      const user = await User.findOneAndUpdate({ email }, { avatar, picture: avatar }, { new: true });
      if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return res.json({ success: true, avatar: user.avatar });
    }
    
    // 인메모리
    let memUser = memUsers.find(u => u.email === email);
    if (memUser) {
      memUser.avatar = avatar;
      memUser.picture = avatar;
    } else {
      // 프론트에 남아있는 로그인 유저 캐시용 인메모리 데이터 자동 생성
      memUser = { email, avatar, picture: avatar, name: email.split('@')[0], totalExp: 0 };
      memUsers.push(memUser);
    }
    saveMemUsers(); // 프로필 사진 파일 영구 저장
    return res.json({ success: true, avatar });
  } catch (err) {
    console.error('Avatar Update Error:', err.message);
    res.status(500).json({ error: '서버 에러가 발생했습니다.' });
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

    const isAdmin = tp.id === 'sunjulab' || tp.email === 'sunjulab';
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
  } catch(err) {
    res.status(500).json({ error: '서버 오류' });
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
    const isAdmin = tp.id === 'sunjulab' || tp.email === 'sunjulab';
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
    console.error('Settings Update Error:', err.message);
    res.status(500).json({ error: '서버 에러가 발생했습니다.' });
  }
});

// --- 닉네임 중복 확인 ---
app.post('/api/auth/check-name', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: '닉네임을 입력해주세요.' });
    const nm = name.trim();
    // DB 모드 시도 → 실패하면 인메모리 fallback
    if (dbReady && User) {
      try {
        const existing = await User.findOne({ name: nm });
        return res.json({ available: !existing });
      } catch (dbErr) {
        console.error('[check-name] DB 조회 실패, 인메모리 fallback:', dbErr.message);
      }
    }
    // 인메모리 fallback
    const existing = memUsers.find(u => u.name === nm);
    return res.json({ available: !existing });
  } catch(err) {
    console.error('[check-name] 오류:', err.message);
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
    console.log('✅ CoolSMS 클라이언트 초기화 완료');
  } else {
    console.log('⚠️ CoolSMS API 키 미설정 → 개발 모드(콘솔 출력)');
  }
} catch (e) {
  console.log('⚠️ CoolSMS SDK 미설치 → 개발 모드(콘솔 출력)');
}

async function sendAppPushNotification(userEmail, type, title, message) {
  let user = null;
  if (dbReady && User) {
    user = await User.findOne({ email: userEmail });
  } else {
    user = memUsers.find(u => u.email === userEmail);
  }
  
  if (!user) return;
  // 알림 설정 체크 (설정이 없으면 기본 true로 간주, 명시적으로 false인 경우만 발송 제외)
  if (user.notiSettings && user.notiSettings[type] === false) return;
  
  // socket.io broadcast to all clients. Client filters by targetEmail.
  io.emit('push_notification', {
    targetEmail: userEmail,
    title: title,
    message: message,
    type: type,
    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  });
  console.log(`[앱 푸쉬 알림 전송] 대상:${userEmail}, 제목:${title}`);
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
      console.log(`[SMS] 발송 완료 → ${normalized} : ${otp}`);
    } else {
      // 개발 모드: 콘솔 출력
      console.log(`[SMS 개발모드] 수신번호: ${normalized}, OTP: ${otp}`);
    }

    res.json({ success: true, message: '인증번호가 발송되었습니다.' });
  } catch (err) {
    console.error('[send-otp] 오류:', err.message);
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
      return res.status(400).json({ error: '인증번호가 올바르지 않습니다.' });
    }

    // 검증 성공: 플래그 표시 (회원가입 시 재확인)
    record.verified = true;
    otpStore.set(normalized, record);

    res.json({ success: true, message: '인증이 완료되었습니다.' });
  } catch (err) {
    console.error('[verify-otp] 오류:', err.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// --- 회원가입 ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    // 입력값 검증
    if (email.trim().length < 4)    return res.status(400).json({ error: 'ID는 4자 이상이어야 합니다.' });
    if (password.length < 6)        return res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다.' });
    if (name.trim().length < 2)     return res.status(400).json({ error: '닉네임은 2자 이상이어야 합니다.' });
    if (name.trim().length > 20)    return res.status(400).json({ error: '닉네임은 20자 이하여야 합니다.' });

    // 휴대폰 인증 여부 확인 (phone이 있으면 반드시 인증 완료여야 함)
    if (phone) {
      const normalized = phone.replace(/[^0-9]/g, '');
      const record = otpStore.get(normalized);
      if (!record || !record.verified) {
        return res.status(400).json({ error: '휴대폰 인증을 완료해주세요.' });
      }
    }

    if (dbReady && User) {
      const existing = await User.findOne({ $or: [{ email }, { name }] });
      if (existing) return res.status(400).json({ error: '이미 사용 중인 이메일이거나 닉네임입니다.' });
      const hashed = await bcrypt.hash(password, 10);
      const user = new User({ email, password: hashed, name, phone: phone || '' });
      await user.save();
      if (phone) otpStore.delete(phone.replace(/[^0-9]/g, '')); // OTP 사용 완료
      return res.json({ success: true });
    } else {
      // 인메모리 fallback
      if (memUsers.find(u => u.email === email)) return res.status(400).json({ error: '이미 등록된 이메일입니다.' });
      if (memUsers.find(u => u.name === name)) return res.status(400).json({ error: '이미 사용 중인 닉네임입니다.' });
      const hashed = await bcrypt.hash(password, 10);
      memUsers.push({ id: Date.now().toString(), email, password: hashed, name, phone: phone || '', level: 1, exp: 0, tier: 'Silver', avatar: 'https://i.pravatar.cc/150?img=11', followers: [], following: [], lastAttendance: null, totalAttendance: 0, totalExp: 0 });
      if (phone) otpStore.delete(phone.replace(/[^0-9]/g, '')); // OTP 사용 완료
      saveMemUsers(); // 영구 보존
      return res.json({ success: true });
    }
  } catch(err) { console.error(err); res.status(500).json({ error: '서버 오류가 발생했습니다.' }); }
});

// --- 이메일 로그인 ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    let user;
    if (dbReady && User) {
      user = await User.findOne({ email });
    } else {
      user = memUsers.find(u => u.email === email);
    }
    if (!user) return res.status(400).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });

    const { justAttended, leveledUp, expGained, streak } = applyAttendance(user);
    if (dbReady && User) {
      await user.save();
    } else {
      saveMemUsers(); // 출석 및 경험치 갱신 보존
    }

    const accessToken  = jwt.sign({ id: user._id || user.id }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user._id || user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: accessToken, accessToken, refreshToken, user: buildUserResponse(user), justAttended, leveledUp, expGained, streak });
  } catch(err) { console.error(err); res.status(500).json({ error: '서버 오류가 발생했습니다.' }); }
});

// --- 토큰 갱신 (Refresh Token) ---
app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh Token이 없습니다.' });
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    if (decoded.type !== 'refresh') return res.status(401).json({ error: '유효하지 않은 Refresh Token입니다.' });
    // 새 Access Token 발급 (1시간)
    const accessToken = jwt.sign({ id: decoded.id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ accessToken });
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
    if (dbReady && User) {
      user = await User.findOne({ email });
      if (!user) {
        let safeName = (name || 'Fisher').replace(/[^a-zA-Z0-9가-힣]/g, '');
        if (!safeName) safeName = 'Fisher';
        const dup = await User.findOne({ name: safeName });
        if (dup) safeName = safeName + Math.floor(Math.random() * 9999);
        user = new User({ email, name: safeName, password: 'google_oauth', avatar: picture || 'https://i.pravatar.cc/150?img=11' });
        await user.save();
      }
    } else {
      // 인메모리 fallback
      user = memUsers.find(u => u.email === email);
      if (!user) {
        let safeName = (name || 'Fisher').replace(/[^a-zA-Z0-9가-힣]/g, '');
        if (!safeName) safeName = 'Fisher';
        if (memUsers.find(u => u.name === safeName)) safeName = safeName + Math.floor(Math.random() * 9999);
        user = { id: Date.now().toString(), email, password: 'google_oauth', name: safeName, level: 1, exp: 0, tier: 'Silver', avatar: picture || 'https://i.pravatar.cc/150?img=11', followers: [], following: [], lastAttendance: null, totalAttendance: 0, totalExp: 0 };
        memUsers.push(user);
        saveMemUsers(); // 영구 보존
      }
    }

    const { justAttended, leveledUp } = applyAttendance(user);
    if (dbReady && User) {
      await user.save();
    } else {
      saveMemUsers(); // 로그인 시 출석 보존
    }

    const accessToken  = jwt.sign({ id: user._id || user.id }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user._id || user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: accessToken, accessToken, refreshToken, user: buildUserResponse(user), justAttended, leveledUp });
  } catch(err) { console.error(err); res.status(500).json({ error: '서버 오류가 발생했습니다.' }); }
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
    const isAdmin = tp.id === 'sunjulab' || tp.email === 'sunjulab';
    if (!isAdmin && tp.id !== email && tp.email !== email) return res.status(403).json({ error: '본인 정보만 변경 가능' });
    
    if (dbReady && User) {
      const dup = await User.findOne({ name: newName });
      if (dup) return res.status(400).json({ error: '이미 사용 중인 닉네임입니다.' });
      const user = await User.findOneAndUpdate({ email }, { name: newName }, { new: true });
      if (Post) await Post.updateMany({ author_email: email }, { author: newName });
      return res.json({ success: true, name: user.name });
    } else {
      const userIdx = memUsers.findIndex(u => u.email === email);
      if (userIdx === -1) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      if (memUsers.find(u => u.name === newName)) return res.status(400).json({ error: '이미 사용 중인 닉네임입니다.' });
      memUsers[userIdx].name = newName;
      saveMemUsers(); // 영구 보존
      return res.json({ success: true, name: newName });
    }
  } catch(err) { console.error(err); res.status(500).json({ error: '서버 오류가 발생했습니다.' }); }
});

// --- 비밀번호 변경 ---
app.put('/api/user/password', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { email, currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: '비밀번호를 모두 입력해주세요.' });
    const isAdmin = tp.id === 'sunjulab' || tp.email === 'sunjulab';
    if (!isAdmin && tp.id !== email && tp.email !== email) return res.status(403).json({ error: '본인 계정만 변경 가능' });

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
  } catch(err) { console.error(err); res.status(500).json({ error: '서버 오류' }); }
});

// --- 사용자 차단 ---
app.post('/api/user/block', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { email, blockTargetName } = req.body;
    if (!blockTargetName) return res.status(400).json({ error: '차단할 사용자 닉네임을 입력해주세요.' });
    const isAdmin = tp.id === 'sunjulab' || tp.email === 'sunjulab';
    if (!isAdmin && tp.id !== email && tp.email !== email) return res.status(403).json({ error: '본인 조작만 가능' });

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
  } catch(err) { console.error(err); res.status(500).json({ error: '서버 오류' }); }
});

// --- 차단 해제 ---
app.post('/api/user/unblock', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { email, unblockTargetName } = req.body;
    const isAdmin = tp.id === 'sunjulab' || tp.email === 'sunjulab';
    if (!isAdmin && tp.id !== email && tp.email !== email) return res.status(403).json({ error: '본인 조작만 가능' });
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
  } catch(err) { res.status(500).json({ error: '서버 오류' }); }
});

// --- 프리미엄 구독 (Tier) 변경 — 결제 서버 또는 어드민만 업그레이드 가능 ---
app.put('/api/user/tier', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); }
    catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { email, tier } = req.body;
    if (!email) return res.status(400).json({ error: '사용자 정보가 필요합니다.' });
    if (!tier)  return res.status(400).json({ error: '티어 정보가 필요합니다.' });
    // 허용 tier 값 화이트리스트
    const ALLOWED_TIERS = ['FREE', 'BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'MASTER'];
    if (!ALLOWED_TIERS.includes(tier)) return res.status(400).json({ error: '유효하지 않은 티어입니다.' });
    const isAdmin = tp.id === 'sunjulab' || tp.email === 'sunjulab';
    if (!isAdmin && tp.id !== email && tp.email !== email) return res.status(403).json({ error: '본인 정보만 변경 가능' });
    // 일반 사용자는 FREE 다운그레이드만 허용 — 업그레이드는 결제 서버(어드민)만
    if (!isAdmin && tier !== 'FREE') return res.status(403).json({ error: '프리미엄 업그레이드는 결제 후 자동 적용됩니다.' });

    if (dbReady && User) {
      // DB 모드: email 필드로만 조회 (id 필드 없음)
      const updated = await User.findOneAndUpdate({ email }, { tier }, { new: true });
      if (!updated) return res.status(404).json({ error: '사용자를 찾을 수 없습니다. 다시 로그인해주세요.' });
      return res.json({ success: true, tier: updated.tier });
    } else {
      // 인메모리 fallback: email 또는 id 필드로 조회
      const user = memUsers.find(u => u.email === email || u.id === email);
      if (user) {
        user.tier = tier;
        saveMemUsers();
        return res.json({ success: true, tier: user.tier });
      }
      // 인메모리에도 없으면 로컬 업데이트 허용 (오프라인 시뮬레이션)
      return res.json({ success: true, tier });
    }
  } catch(err) {
    console.error('[PUT /api/user/tier]', err.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
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
    const isAdmin = tp.id === 'sunjulab' || tp.email === 'sunjulab';
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
  } catch(err) {
    console.error('[POST /api/user/avatar]', err.message);
    res.status(500).json({ error: '프로필 사진 저장 실패: ' + err.message });
  }
});

// --- 활동별 EXP 지급 (일일 레이트 리밋 적용) ---
const EXP_DAILY_LIMIT = {
  comment: 5, post: 3, like_receive: 10, point_visit: 8,
  photo_upload: 3, first_catch: 1, weekly_streak: 1, monthly_streak: 1,
};
const expDailyCount = new Map();
setInterval(() => expDailyCount.clear(), 60 * 60 * 1000); // 매시간 초기화

app.post('/api/user/exp', async (req, res) => {
  try {
    const { email, activity } = req.body;
    if (!email || !activity) return res.status(400).json({ error: 'email과 activity가 필요합니다.' });
    const expAmount = EXP_REWARDS[activity];
    if (!expAmount) return res.status(400).json({ error: '알 수 없는 활동입니다.' });

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
  } catch(err) { console.error(err); res.status(500).json({ error: '서버 오류' }); }
});

// --- 내 게시글 목록 ---
app.get('/api/user/posts', async (req, res) => {
  try {
    if (dbReady && Post) {
      const posts = await Post.find({ author_email: req.query.email }).sort({ createdAt: -1 });
      return res.json(posts);
    }
    // 인메모리 fallback: 이메일로 필터링하여 실제 게시글 반환
    const email = req.query.email;
    const myPosts = email
      ? [...memPosts].filter(p => p.author_email === email).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      : [];
    res.json(myPosts);
  } catch(err) { res.status(500).json({ error: '서버 오류' }); }
});

// =================================================================
//  조과 기록 API (낚시 기록실)
//  MongoDB 영구저장 / 인메모리 fallback
// =================================================================
// memRecords는 상단에서 초기화되었습니다.

// ── 내 조과기록 조회 ──────────────────────────────────────────────────────────
app.get('/api/user/records', async (req, res) => {
  try {
    if (dbReady && CatchRecord) {
      const records = await CatchRecord.find({ author_email: req.query.email }).sort({ createdAt: -1 });
      return res.json(records);
    }
    res.json(memRecords.filter(r => r.author_email === req.query.email));
  } catch(err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 조과기록 작성 ──────────────────────────────────────────────────────────────
app.post('/api/user/records', async (req, res) => {
  try {
    const { author, author_email, fish, size, weight, location, bait, weather, wind, wave, memo, img, date, time, pointId } = req.body;
    if (!author || !author_email || !fish) return res.status(400).json({ error: '필수 항목 누락 (어종 필수)' });
    const data = { author, author_email, fish, size: size||'', weight: weight||'', location: location||'', bait: bait||'', weather: weather||'', wind: wind||'', wave: wave||'', memo: memo||'', img: img||null, date: date||'', time: time||'', pointId: pointId||null };
    if (dbReady && CatchRecord) {
      const record = new CatchRecord(data);
      await record.save();
      return res.json(record);
    }
    const record = { id: Date.now().toString(), _id: Date.now().toString(), ...data, createdAt: new Date() };
    memRecords.unshift(record);
    saveMemRecords();
    res.json(record);
  } catch(err) { console.error(err); res.status(500).json({ error: '서버 오류' }); }
});

// ── 조과기록 삭제 ──────────────────────────────────────────────────────────────
app.delete('/api/user/records/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { email } = req.body;
    const isAdmin = tp.id === 'sunjulab' || tp.email === 'sunjulab';
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
  } catch(err) { res.status(500).json({ error: '서버 오류' }); }
});

// =================================================================
//  커뮤니티 API (오픈게시판 / 크루 / 공지사항 / 선상배홍보)
//  MongoDB 연결 시 영구저장, 미연결 시 인메모리 fallback
// =================================================================


// ── 오픈게시판 전체 조회 (페이지네이션 + 검색 + 카테고리 필터) ──────────────
app.get('/api/community/posts', async (req, res) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page)  || 1);
    const limit    = Math.min(50, parseInt(req.query.limit) || 20);
    const skip     = (page - 1) * limit;
    const category = req.query.category || '';  // 카테고리 필터
    const q        = req.query.q || '';          // 검색어

    if (dbReady && Post) {
      const filter = {};
      if (category) filter.category = category;
      if (q) filter.$or = [
        { content: { $regex: q, $options: 'i' } },
        { author:  { $regex: q, $options: 'i' } },
      ];
      const [posts, total] = await Promise.all([
        Post.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Post.countDocuments(filter),
      ]);
      return res.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
    }

    // 인메모리 fallback
    let list = [...memPosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (category) list = list.filter(p => p.category === category);
    if (q) {
      const lq = q.toLowerCase();
      list = list.filter(p =>
        (p.content && p.content.toLowerCase().includes(lq)) ||
        (p.author  && p.author.toLowerCase().includes(lq))
      );
    }
    const total = list.length;
    const posts = list.slice(skip, skip + limit);
    return res.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch(err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 오픈게시판 단건 조회 ──────────────────────────────────────────────────────
app.get('/api/community/posts/:id', async (req, res) => {
  const pid = req.params.id;
  try {
    if (dbReady && Post) {
      let post = null;
      try { post = await Post.findById(pid); } catch(castErr) {}
      if (post) return res.json(post);
    }
    const mem = memPosts.find(p => p._id === pid || p.id === pid);
    if (mem) return res.json(mem);
    return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
  } catch(err) {
    const mem = memPosts.find(p => p._id === pid || p.id === pid);
    if (mem) return res.json(mem);
    res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
  }
});

// ── 오픈게시판 작성 ────────────────────────────────────────────────────────────
app.post('/api/community/posts', async (req, res) => {
  try {
    let { author, author_email, category, content, image } = req.body;
    if (!author || !category || !content) return res.status(400).json({ error: '필수 항목 누락' });
    if (!author_email) author_email = 'guest@fishinggo.kr';
    // 이미지 크기 제한: base64 1MB(≒750KB 실제) 초과 시 null 처리
    const safeImage = (image && image.length > 1024 * 1024) ? null : (image || null);

    if (dbReady && Post) {
      try {
        const post = new Post({ author, author_email, category, content, image: safeImage });
        await post.save();
        try {
          memPosts.unshift({ _id: post._id.toString(), id: post._id.toString(), author, author_email, category, content, image: safeImage, likes: 0, comments: [], createdAt: post.createdAt });
          if (memPosts.length > 200) memPosts.splice(200);
        } catch(syncErr) { /* memPosts 동기화 실패는 무시 */ }
        return res.json(post);
      } catch(dbErr) {
        console.error('[MongoDB 저장 실패, 인메모리 fallback]:', dbErr.message);
        // MongoDB 실패 시 이미지 제거 후 in-memory로 fallback
      }
    }
    const uid = Date.now().toString();
    const post = { _id: uid, id: uid, author, author_email, category, content, image: safeImage, likes: 0, comments: [], createdAt: new Date().toISOString() };
    memPosts.unshift(post);
    if (memPosts.length > 200) memPosts.splice(200);
    saveMemPosts();
    return res.json(post);
  } catch(err) { console.error('[POST /posts 오류]:', err.message); res.status(500).json({ error: '서버 오류: ' + err.message }); }
});

// ── 오픈게시판 글 삭제 ────────────────────────────────────────────────────────
app.delete('/api/community/posts/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { email } = req.body;
    const isAdmin = tp.id === 'sunjulab' || tp.email === 'sunjulab';

    // ─── 서버사이드 권한 검증 ───────────────────────────────────
    if (dbReady && Post) {
      let post = null;
      try { post = await Post.findById(req.params.id); } catch(e) {}
      if (post) {
        if (!isAdmin && post.author_email !== email)
          return res.status(403).json({ error: '삭제 권한이 없습니다.' });
        await post.deleteOne();
      }
    } else {
      // 인메모리 fallback 권한 체크
      const mem = memPosts.find(p => p._id === req.params.id || p.id === req.params.id);
      if (mem && !isAdmin && mem.author_email !== email)
        return res.status(403).json({ error: '삭제 권한이 없습니다.' });
    }
    memPosts = memPosts.filter(p => p._id !== req.params.id && p.id !== req.params.id);
    saveMemPosts();
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 오픈게시판 글 수정 (작성자 or JWT 어드민) ────────────────────────────────
app.put('/api/community/posts/:id', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요', code: 'AUTH_REQUIRED' });
    let tp;
    try { tp = jwt.verify(auth.slice(7), JWT_SECRET); } catch { return res.status(401).json({ error: '토큰 유효하지 않음' }); }
    const { content, category, image, email } = req.body;
    const isAdmin = tp.id === 'sunjulab' || tp.email === 'sunjulab';
    if (dbReady && Post) {
      let post;
      try { post = await Post.findById(req.params.id); } catch(e) {}
      if (!post) return res.status(404).json({ error: '게시글 없음' });
      if (!isAdmin && post.author_email !== email)
        return res.status(403).json({ error: '권한 없음' });
      if (content !== undefined) post.content = content;
      if (category !== undefined) post.category = category;
      if (image !== undefined) post.image = image;
      await post.save();
      const idx = memPosts.findIndex(p => p._id === req.params.id || p.id === req.params.id);
      if (idx !== -1) {
        memPosts[idx] = { ...memPosts[idx], content: post.content, category: post.category, image: post.image };
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
    if (image !== undefined) mem.image = image;
    saveMemPosts();
    res.json(mem);
  } catch(err) { console.error(err); res.status(500).json({ error: '서버 오류' }); }
});


// ── 오픈게시판 댓글 작성 ──────────────────────────────────────────────────────
app.post('/api/community/posts/:id/comments', async (req, res) => {
  try {
    const { author, text } = req.body;
    if (!author || !text) return res.status(400).json({ error: '작성자/내용 필수' });
    const newComment = { author, text, createdAt: new Date() };
    if (dbReady && Post) {
      let post = null;
      try { post = await Post.findById(req.params.id); } catch(e) {}
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
  } catch(err) { console.error(err); res.status(500).json({ error: '서버 오류' }); }
});

// ── 좋아요 POST/PATCH ─────────────────────────────────────────────────────────
app.post('/api/community/posts/:id/like', async (req, res) => {
  try {
    if (dbReady && Post) {
      let post = null;
      try { post = await Post.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true }); } catch(e) {}
      if (post) return res.json(post);
    }
    const mem = memPosts.find(p => p._id === req.params.id || p.id === req.params.id);
    if (mem) { mem.likes = (mem.likes || 0) + 1; saveMemPosts(); return res.json(mem); }
    res.json({ likes: 0 });
  } catch(err) { res.status(500).json({ error: '서버 오류' }); }
});

app.patch('/api/community/posts/:id/like', async (req, res) => {
  try {
    if (dbReady && Post) {
      let post = null;
      try { post = await Post.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true }); } catch(e) {}
      if (post) return res.json({ likes: post.likes });
    }
    const mem = memPosts.find(p => p._id === req.params.id || p.id === req.params.id);
    if (mem) { mem.likes = (mem.likes || 0) + 1; saveMemPosts(); return res.json({ likes: mem.likes }); }
    res.json({ likes: 0 });
  } catch(err) { res.status(500).json({ error: '서버 오류' }); }
});


// ── 크루 전체 조회 ────────────────────────────────────────────────────────────
app.get('/api/community/crews', async (req, res) => {
  try {
    if (dbReady && Crew) {
      const crews = await Crew.find().sort({ createdAt: -1 });
      return res.json(crews);
    }
    res.json(memCrews);
  } catch(err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 크루 생성 ─────────────────────────────────────────────────────────────────
app.post('/api/community/crews', async (req, res) => {
  try {
    const { name, region, isPrivate, password, owner, ownerName } = req.body;
    if (!name || !owner || !ownerName) return res.status(400).json({ error: '필수 항목 누락' });
    if (dbReady && Crew) {
      const crew = new Crew({ name, region: region||'전국', isPrivate: !!isPrivate, password: password||null, owner, ownerName });
      await crew.save();
      return res.json(crew);
    }
    const crew = { id: Date.now().toString(), _id: Date.now().toString(), name, region: region||'전국', isPrivate: !!isPrivate, password: password||null, owner, ownerName, members: 1, createdAt: new Date() };
    memCrews.unshift(crew);
    saveMemCrews();
    res.json(crew);
  } catch(err) { console.error(err); res.status(500).json({ error: '서버 오류' }); }
});

// ── 크루 삭제 (마스터 or 오너) ───────────────────────────────────────────────
app.delete('/api/community/crews/:id', async (req, res) => {
  try {
    const { email, adminId } = req.body;
    if (dbReady && Crew) {
      const crew = await Crew.findById(req.params.id);
      if (!crew) return res.status(404).json({ error: '크루 없음' });
      if (adminId !== 'sunjulab' && crew.owner !== email) return res.status(403).json({ error: '권한 없음' });
      await Crew.findByIdAndDelete(req.params.id);
      return res.json({ success: true });
    }
    memCrews = memCrews.filter(c => c.id !== req.params.id);
    saveMemCrews();
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: '서버 오류' }); }
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
  } catch(err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 공지사항 단건 조회 ────────────────────────────────────────────────────────
app.get('/api/community/notices/:id', async (req, res) => {
  const nid = req.params.id;
  try {
    if (dbReady && Notice) {
      let notice = null;
      try { notice = await Notice.findById(nid); } catch(e) {}
      if (notice) return res.json(notice);
    }
    const mem = memNotices.find(n => n._id === nid || n.id === nid);
    if (mem) return res.json(mem);
    return res.status(404).json({ error: '공지사항을 찾을 수 없습니다.' });
  } catch(err) {
    const mem = memNotices.find(n => n._id === nid || n.id === nid);
    if (mem) return res.json(mem);
    res.status(404).json({ error: '공지사항을 찾을 수 없습니다.' });
  }
});

// ── 공지사항 작성 (마스터 전용) ───────────────────────────────────────────────
app.post('/api/community/notices', async (req, res) => {
  try {
    const { title, content, isPinned, adminId } = req.body;
    // sunjulab 이메일, 이름, id 모두 허용
    const MASTER_IDS = ['sunjulab', 'sunjulab@gmail.com', 'sunjulab@naver.com'];
    const ismaster = adminId && MASTER_IDS.some(m => adminId === m || adminId.startsWith('sunjulab'));
    if (!ismaster) return res.status(403).json({ error: '마스터 권한 필요' });
    if (!title || !content) return res.status(400).json({ error: '제목과 내용 필수' });
    if (dbReady && Notice) {
      const notice = new Notice({ title, content, isPinned: !!isPinned, author: 'MASTER' });
      await notice.save();
      return res.json(notice);
    }
    const notice = { id: Date.now().toString(), title, content, isPinned: !!isPinned, author: 'MASTER', views: 0, date: new Date().toISOString().split('T')[0] };
    memNotices.unshift(notice);
    saveMemNotices();
    res.json(notice);
  } catch(err) { res.status(500).json({ error: '서버 오류' }); }
});


// ── 공지사항 삭제 (마스터 전용) ───────────────────────────────────────────────
app.delete('/api/community/notices/:id', async (req, res) => {
  try {
    const adminId = req.body?.adminId || req.query?.adminId;
    if (adminId !== 'sunjulab') return res.status(403).json({ error: '마스터 권한 필요' });
    if (dbReady && Notice) {
      await Notice.findByIdAndDelete(req.params.id);
      return res.json({ success: true });
    }
    memNotices = memNotices.filter(n => n.id !== req.params.id);
    saveMemNotices();
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 공지사항 조회수 증가 ──────────────────────────────────────────────────────
app.patch('/api/community/notices/:id/view', async (req, res) => {
  try {
    if (dbReady && Notice) {
      await Notice.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    } else {
      const n = memNotices.find(x => x.id === req.params.id);
      if (n) { n.views = (n.views||0) + 1; saveMemNotices(); }
    }
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 선상배홍보 게시글 전체 조회 ──────────────────────────────────────────────
app.get('/api/community/business', async (req, res) => {
  try {
    if (dbReady && BusinessPost) {
      const now = new Date();
      await BusinessPost.updateMany(
        { isPinned: true, expiresAt: { $ne: null, $lt: now } },
        { $set: { isPinned: false } }
      );
      const posts = await BusinessPost.find().sort({ isPinned: -1, createdAt: -1 });
      return res.json(posts);
    }
    const now = new Date();
    memBusinessPosts.forEach(p => {
      if (p.isPinned && p.expiresAt && new Date(p.expiresAt) < now) p.isPinned = false;
    });
    saveMemBusinessPosts();
    res.json([...memBusinessPosts].sort((a,b) => (b.isPinned?1:0)-(a.isPinned?1:0)));
  } catch(err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 선상배홍보 게시글 작성 (PRO/VVIP 전용) ───────────────────────────────────
app.post('/api/community/business', async (req, res) => {
  try {
    const { author, author_email, shipName, type, target, region, date, price, phone, content, cover, isPinned, harborId, expiresAt } = req.body;
    if (!author || !author_email || !shipName || !content)
      return res.status(400).json({ error: '필수 항목 누락' });
    const postData = { author, author_email, shipName, type: type||'선상낚시', target: target||'다수어종', region: region||'', date: date||'', price: price||'', phone: phone||'', content, cover: cover||'', isPinned: !!isPinned, harborId: harborId||null, expiresAt: expiresAt||null };
    if (dbReady && BusinessPost) {
      const post = new BusinessPost(postData);
      await post.save();
      return res.json(post);
    }
    const post = { id: Date.now().toString(), _id: Date.now().toString(), ...postData, createdAt: new Date() };
    memBusinessPosts.unshift(post);
    saveMemBusinessPosts();
    res.json(post);
  } catch(err) { console.error(err); res.status(500).json({ error: '서버 오류' }); }
});

// ── 선상배홍보 게시글 삭제 (마스터 or 작성자) ────────────────────────────────
app.delete('/api/community/business/:id', async (req, res) => {
  try {
    const { email, adminId } = req.body;
    if (dbReady && BusinessPost) {
      const post = await BusinessPost.findById(req.params.id);
      if (!post) return res.status(404).json({ error: '게시글 없음' });
      if (adminId !== 'sunjulab' && post.author_email !== email) return res.status(403).json({ error: '권한 없음' });
      await BusinessPost.findByIdAndDelete(req.params.id);
      return res.json({ success: true });
    }
    memBusinessPosts = memBusinessPosts.filter(p => p.id !== req.params.id);
    saveMemBusinessPosts();
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 공지사항 수정 (마스터 전용) ───────────────────────────────────────────────
app.put('/api/community/notices/:id', async (req, res) => {
  try {
    const { title, content, isPinned, adminId } = req.body;
    if (!adminId || !adminId.startsWith('sunjulab')) return res.status(403).json({ error: '마스터 권한 필요' });
    if (dbReady && Notice) {
      const upd = {};
      if (title !== undefined) upd.title = title;
      if (content !== undefined) upd.content = content;
      if (isPinned !== undefined) upd.isPinned = isPinned;
      const notice = await Notice.findByIdAndUpdate(req.params.id, upd, { new: true });
      if (!notice) return res.status(404).json({ error: '공지 없음' });
      return res.json(notice);
    }
    const mem = memNotices.find(n => n.id === req.params.id || n._id === req.params.id);
    if (!mem) return res.status(404).json({ error: '공지 없음' });
    if (title !== undefined) mem.title = title;
    if (content !== undefined) mem.content = content;
    if (isPinned !== undefined) mem.isPinned = isPinned;
    saveMemNotices();
    res.json(mem);
  } catch(err) { res.status(500).json({ error: '서버 오류' }); }
});

// ── 선상배홍보 수정 (작성자 or 마스터) ───────────────────────────────────────
app.put('/api/community/business/:id', async (req, res) => {
  try {
    const { email, adminId, ...fields } = req.body;
    const MASTER = (id) => id && id.startsWith('sunjulab');
    if (dbReady && BusinessPost) {
      const post = await BusinessPost.findById(req.params.id).catch(() => null);
      if (!post) return res.status(404).json({ error: '게시글 없음' });
      if (!MASTER(adminId) && post.author_email !== email) return res.status(403).json({ error: '권한 없음' });
      Object.assign(post, fields);
      await post.save();
      return res.json(post);
    }
    const mem = memBusinessPosts.find(p => p.id === req.params.id || p._id === req.params.id);
    if (!mem) return res.status(404).json({ error: '게시글 없음' });
    if (!MASTER(adminId) && mem.author_email !== email) return res.status(403).json({ error: '권한 없음' });
    Object.assign(mem, fields);
    saveMemBusinessPosts();
    res.json(mem);
  } catch(err) { console.error(err); res.status(500).json({ error: '서버 오류' }); }
});


/* =========================================================
   MARINE API & ROOT
========================================================= */
app.get('/', (req, res) => {
  res.send('<h1>Fishing GO Backend is running flawlessly! 🚀</h1><p>DB Status: ' + (dbReady ? 'MongoDB Connected ✅' : 'In-Memory Mode ⚠️') + '</p>');
});

app.get('/api/weather/precision', (req, res) => {
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
  const tideNum = (seed % 14) + 1;
  const tidePhase = tideNum === 7 ? '7물(사리)' : tideNum === 13 ? '13물(조금)' : tideNum === 14 ? '14물(무시)' : `${tideNum}물`;
  const baseHighMin = (tideNum * 45 + seed * 7) % 1440;
  const baseLowMin  = (baseHighMin + 375) % 1440;
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
      }
      info = merged;
    } else {
      info = getCctvInfo(stationId || 'DT_0001');
    }

    // -- MOF(해당수산부 연안침식) 하이브리드 대체 시스템 연동 --
    // 유튜브 오버라이드가 없을 경우 cctvMapping.js에서 정의한 mof 프록시 URL이 그대로 fallbackImg로 전달됩니다.
    if (info.type !== 'youtube' && info.type !== 'mof') {
      // 이미지 등 기타 타입용 안전망
      info.safeFallbackImg = 'https://images.unsplash.com/photo-1439405326854-014607f694d7?auto=format&fit=crop&w=800&q=80';
    }

    res.json({
      obsCode:      stationId,
      areaName:     info.areaName,
      region:       info.region,
      label:        info.label,
      type:         info.type,
      url:          info.embedUrl,
      thumbnailUrl: info.thumbnailUrl,
      fallbackImg:  info.fallbackImg,
      safeFallbackImg: info.safeFallbackImg || info.fallbackImg,
      youtubeId:    info.youtubeId || null,
      isOverride:   !!override,
    });
  } catch (err) {
    console.error('[CCTV API 오류]', err.message);
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
    console.log(`[CCTV] DB에서 ${overrides.length}개 오버라이드 로드 완료`);
    saveCctvOverrides(); // DB 로드 후 JSON 파일도 동기화
  } catch(e) { console.error('[CCTV] 오버라이드 로드 실패:', e.message); }
}
setTimeout(loadCctvOverridesFromDB, 3000); // DB 연결 후 3초 대기 후 로드


function isMaster(req) {
  const adminId = req.headers['x-admin-id'] || req.query.adminId || req.body?.adminId;
  return adminId === 'sunjulab';
}

// GET /api/admin/cctv — 전체 CCTV 목록 + 오버라이드 현황 조회
app.get('/api/admin/cctv', (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ error: '마스터 권한 필요' });
  const { CCTV_MAP } = require('./cctvMapping');
  const list = Object.entries(CCTV_MAP).map(([obsCode, base]) => ({
    obsCode,
    areaName:   base.areaName,
    region:     base.region,
    type:       (cctvOverrides[obsCode]?.type)       || base.type,
    youtubeId:  (cctvOverrides[obsCode]?.youtubeId)  || base.youtubeId || null,
    label:      (cctvOverrides[obsCode]?.label)      || base.label,
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
    ...(type      !== undefined && { type }),
    ...(label     !== undefined && { label }),
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
    } catch(e) { console.error('[CCTV DB 저장 실패]', e.message); }
  }

  console.log(`[마스터 CCTV 수정] ${obsCode}:`, cctvOverrides[obsCode]);
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
    catch(e) { console.error('[CCTV DB 삭제 실패]', e.message); }
  }
  console.log(`[마스터 CCTV 초기화] ${obsCode} 기본값으로 복원`);
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
    console.log(`[마스터 CCTV 초기화] 전체 DB 오버라이드 삭제 완료`);
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
        console.error(`[AutoSync Error] ${obsCode}:`, err.response ? err.response.data : err.message);
      }
    }
    console.log(`[CCTV AutoSync] ${updatedCount}개 지역 업데이트 완료`);
    saveCctvOverrides(); // 자동갱신 결과 파일 저장 (서버 재시작 후 복원)
    res.json({ success: true, updatedCount, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '자동 동기화 중 오류 발생' });
  }
});


// --- 유튜브 비디오 API (검색 및 최신 영상) ---
// ─── 서버 메모리 캐시 (키워드 → { videos, cachedAt }) ───────────────────────
const ytCache = new Map(); // key: query string, value: { videos, cachedAt }
const YT_CACHE_TTL = 60 * 60 * 1000; // 1시간 (ms)

function getCached(key) {
  const entry = ytCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > YT_CACHE_TTL) { ytCache.delete(key); return null; }
  return entry.videos;
}
function setCache(key, videos) {
  ytCache.set(key, { videos, cachedAt: Date.now() });
}

// ─── yt-search(무료) 폴백 ─────────────────────────────────────────────────────
async function searchByYts(q) {
  try {
    const yts = require('yt-search');
    const result = await yts(q + ' 낚시');
    return result.videos.slice(0, 15).map(item => ({
      id: `yts_${item.videoId}`,
      title: item.title,
      category: '검색결과',
      youtubeId: item.videoId,
      channelTitle: item.author?.name || '',
      publishedAt: item.uploadDate || null,
      views: item.views ? `${(item.views / 10000).toFixed(1)}만` : 'NEW',
      description: item.description || `${item.author?.name}의 낚시 영상입니다.`,
      products: []
    }));
  } catch { return []; }
}

app.get('/api/media/youtube/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'No query' });

  const cacheKey = `search:${q}`;
  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`[YT 캐시 HIT] ${q}`);
    return res.json({ videos: cached, source: 'cache' });
  }

  try {
    const _0x1a2b = [72, 80, 129, 104, 90, 128, 72, 105, 75, 75, 129, 116, 60, 74, 93, 75, 89, 125, 96, 110, 62, 64, 62, 80, 79, 80, 122, 118, 120, 106, 60, 97, 117, 73, 114, 81, 117, 96, 122];
    const _decode = (arr) => String.fromCharCode(...arr.map(c => c - 7));
    const apiKey = process.env.YOUTUBE_API_KEY || _decode(_0x1a2b);

    if (apiKey) {
      try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(q + ' 낚시')}&key=${apiKey}&type=video&order=viewCount&relevanceLanguage=ko&regionCode=KR`;
        const response = await axios.get(searchUrl);
        const videos = response.data.items.map(item => ({
          id: `search_${item.id.videoId}`,
          title: item.snippet.title,
          category: '검색결과',
          youtubeId: item.id.videoId,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          views: 'NEW',
          description: item.snippet.description?.slice(0, 100) || `${item.snippet.channelTitle}의 인기 낚시 영상입니다.`,
          products: []
        }));
        if (videos.length > 0) {
          setCache(cacheKey, videos);
          return res.json({ videos, source: 'youtube-api' });
        }
      } catch (apiErr) {
        // 403 = 할당량 초과 → yt-search 폴백
        const status = apiErr.response?.status;
        console.warn(`[YT API 오류] ${status} - yt-search 폴백 사용`);
      }
    }

    // ─── yt-search 폴백 ───────────────────────────────────────────────────────
    const ytVids = await searchByYts(q);
    if (ytVids.length > 0) setCache(cacheKey, ytVids);
    res.json({ videos: ytVids, source: 'yt-search' });

  } catch (err) {
    console.error('Search Error:', err.message);
    res.status(500).json({ videos: [], source: 'error' });
  }
});

app.get('/api/media/youtube', async (req, res) => {
  const cacheKey = `main:${req.query.pageToken || '0'}`;
  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`[YT 캐시 HIT] main`);
    return res.json({ videos: cached, nextPageToken: null, source: 'cache' });
  }

  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const pageToken = req.query.pageToken || '';
    const maxResults = 10;

    if (apiKey) {
      try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&part=snippet&type=video&q=낚시&order=viewCount&maxResults=${maxResults}&relevanceLanguage=ko&regionCode=KR` + (pageToken ? `&pageToken=${pageToken}` : '');
        const response = await axios.get(searchUrl);
        const { items, nextPageToken } = response.data;
        const videos = items.filter(i => i.id.videoId).map(item => ({
          id: `yt_${item.id.videoId}`,
          title: item.snippet.title,
          category: '인기',
          youtubeId: item.id.videoId,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          views: 'NEW',
          description: item.snippet.description?.slice(0, 100) || '유튜브 인기 낚시 영상입니다.',
          products: []
        }));
        if (videos.length > 0) setCache(cacheKey, videos);
        return res.json({ videos, nextPageToken: nextPageToken || null, source: 'youtube-api' });
      } catch (apiErr) {
        console.warn(`[YT Main API 오류] ${apiErr.response?.status} - yt-search 폴백`);
      }
    }

    // ─── RSS 폴백 ─────────────────────────────────────────────────────────────
    try {
      const chId = 'UCeBw0Qp_Q_Y96f30d-V96qQ'; // 입질의 추억
      const RSS_URL = encodeURIComponent(`https://www.youtube.com/feeds/videos.xml?channel_id=${chId}`);
      const rssRes = await axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${RSS_URL}`, { timeout: 5000 });
      if (rssRes.data.status === 'ok' && rssRes.data.items.length > 0) {
        const offset = parseInt(pageToken) || 0;
        const slice = rssRes.data.items.slice(offset, offset + maxResults);
        const nextTok = offset + maxResults < rssRes.data.items.length ? String(offset + maxResults) : null;
        const videos = slice.map((item, idx) => {
          const vidId = item.link.split('v=')[1]?.split('&')[0];
          return { id: `rss_${vidId}_${offset + idx}`, title: item.title, category: '최신', youtubeId: vidId, channelTitle: item.author || '낚시채널', publishedAt: item.pubDate, views: 'NEW', description: item.description?.replace(/<[^>]*>/g, '').slice(0, 100) || '', products: [] };
        });
        if (videos.length > 0) setCache(cacheKey, videos);
        return res.json({ videos, nextPageToken: nextTok, source: 'rss' });
      }
    } catch(e) { console.warn('[RSS 실패]', e.message); }

    // ─── 최후 yt-search 폴백 ─────────────────────────────────────────────────
    const ytVids = await searchByYts('낚시');
    if (ytVids.length > 0) setCache(cacheKey, ytVids);
    res.json({ videos: ytVids, nextPageToken: null, source: 'yt-search' });

  } catch (err) {
    console.error('YouTube Fetch Error:', err.message);
    res.json({ videos: [], nextPageToken: null, source: 'error' });
  }
});


// --- 쿠팡 파트너스 자동 연동 엔진 (HMAC Open API) ---
const crypto = require('crypto');

app.get('/api/commerce/coupang/search', async (req, res) => {
  const { keyword } = req.query;
  const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY;
  const SECRET_KEY = process.env.COUPANG_SECRET_KEY;
  const AFFILIATE_ID = 'AF3563639'; // 파트너스 추적 ID
  
  if (!keyword) return res.status(400).json({ error: '검색어가 필요합니다.' });
  
  if (!ACCESS_KEY || !SECRET_KEY) {
    console.warn('[Coupang] API Keys not provided. Returning fallback product.');
    // API 키 미세팅 시 임시 Mock 응답
    return res.json({
      products: [{
        name: `[쿠팡최저가] ${keyword} 입문자 올인원 세트 (API 키 등록 필요)`,
        price: '35,000원',
        discount: '15%',
        img: 'https://images.unsplash.com/photo-1544551763-8dd44758c2dd?auto=format&fit=crop&w=100&q=60',
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
    console.error('Coupang API Error:', err.message);
    res.status(500).json({ error: '쿠팡 파트너스 연동 중 오류가 발생했습니다.' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Fishing GO Logic Server running on PORT ${PORT}`);
  console.log(`DB 모드: ${dbReady ? 'MongoDB ✅' : '인메모리 ⚠️'}`);
});

// ─── 서버 종료 시 전체 데이터 강제 파일 플러시 (완전 안전망) ─────────────────
function flushAllData() {
  console.log('[서버 종료] 전체 데이터 파일 플러시 시작...');
  try { saveMemUsers(); }            catch(e) {}
  try { saveMemPosts(); }            catch(e) {}
  try { saveMemRecords(); }          catch(e) {}
  try { saveMemCrews(); }            catch(e) {}
  try { saveChatHistories(); }       catch(e) {}
  try { saveMemNotices(); }          catch(e) {}
  try { saveMemBusinessPosts(); }    catch(e) {}
  try { saveSecretPointOverrides(); } catch(e) {}
  try { saveCctvOverrides(); }       catch(e) {}
  try { saveProSubs(); }             catch(e) {}
  try { saveVvipSlots(); }           catch(e) {}
  console.log('[서버 종료] ✅ 모든 데이터 파일 저장 완료');
}

process.on('SIGTERM', () => { flushAllData(); process.exit(0); });
process.on('SIGINT',  () => { flushAllData(); process.exit(0); });
process.on('uncaughtException', (err) => {
  console.error('[크리티컬 오류]', err.message);
  flushAllData();
  process.exit(1);
});

// ─── 30분마다 전체 데이터 자동 백업 (예상치 못한 크래시 대비) ─────────────────
setInterval(() => {
  flushAllData();
  console.log('[자동백업] 30분 주기 전체 데이터 파일 백업 완료');
}, 30 * 60 * 1000);

// =================================================================
//  PRO 월정액 구독 관리 시스템 (MongoDB DB 영구저장)
// =================================================================
let proSubscriptions = memProSubs; // DB 연결 시 User 모델 tier 필드 활용

// PRO 구독 구매 (or 갱신)
app.post('/api/pro/purchase', async (req, res) => {
  const { userId, userName } = req.body;
  if (!userId) return res.status(400).json({ error: '필수 정보 누락' });

  const now = new Date();
  const existing = proSubscriptions[userId];
  let expiresAt;
  if (existing && new Date(existing.expiresAt) > now) {
    expiresAt = new Date(new Date(existing.expiresAt).getTime() + 30 * 24 * 60 * 60 * 1000);
  } else {
    expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  proSubscriptions[userId] = { userId, userName: userName||userId, purchasedAt: now.toISOString(), expiresAt: expiresAt.toISOString(), tier: 'PRO' };
  saveProSubs(); // 파일 영구 저장

  // DB에도 User.tier 업데이트
  if (dbReady && User) {
    try { await User.findOneAndUpdate({ email: userId }, { tier: 'PRO', proExpiresAt: expiresAt }); }
    catch(e) { console.error('[PRO DB 저장 실패]', e.message); }
  }

  const daysLeft = Math.ceil((expiresAt - now) / 86400000);
  res.json({ success: true, expiresAt: expiresAt.toISOString(), daysLeft,
    message: `PRO 구독 완료! (${expiresAt.toLocaleDateString('ko-KR')}까지 유효)` });
});

// PRO 구독 상태 확인 (만료 시 자동 FREE 다운그레이드)
app.get('/api/pro/status', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: '사용자 ID 필요' });

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

// PRO 구독 강제 해지 (관리자용)
app.delete('/api/pro/cancel', (req, res) => {
  const { userId, adminId } = req.body;
  if (adminId !== 'sunjulab') return res.status(403).json({ error: '관리자만 접근 가능' });
  if (proSubscriptions[userId]) {
    delete proSubscriptions[userId];
    saveProSubs(); // 파일 저장
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
      console.log(`[PRO 만료 정리] ${sub.userName} 구독 자동 해제`);
      delete proSubscriptions[userId];
      cleaned++;
    }
  });
  if (cleaned > 0) { saveProSubs(); console.log(`[PRO 클린업] ${cleaned}개 만료 구독 제거`); }
}, 24 * 60 * 60 * 1000);

// =================================================================
//  VVIP 선상 항구 선주은 슬롯 시스템
//  - 항구당 1명만 VVIP 슬롯 포지 가능 (55만원/년, 선착순)
//  - 슬롯 회사는 공개 API로 제공
// =================================================================

// 항구 목록 (한국 주요 낭시 항구 전수)
const HARBOR_LIST = [
  { id: 'GN_001', region: '강원', name: '주문진항', lat: 37.907, lng: 128.819 },
  { id: 'GN_002', region: '강원', name: '속초항', lat: 37.741, lng: 128.866 },
  { id: 'GN_003', region: '강원', name: '카리항', lat: 38.128, lng: 128.621 },
  { id: 'GN_004', region: '강원', name: '동해항 (동룡)', lat: 37.524, lng: 129.113 },
  { id: 'GN_005', region: '강원', name: '묵호항', lat: 37.423, lng: 129.168 },
  { id: 'BS_001', region: '부산', name: '부산신항', lat: 35.094, lng: 129.044 },
  { id: 'BS_002', region: '부산', name: '치좌항', lat: 35.121, lng: 129.092 },
  { id: 'GJ_001', region: '경남', name: '통영항', lat: 34.836, lng: 128.429 },
  { id: 'GJ_002', region: '경남', name: '거제항', lat: 34.946, lng: 128.621 },
  { id: 'GJ_003', region: '경남', name: '여수항', lat: 34.737, lng: 127.742 },
  { id: 'GJ_004', region: '경남', name: '사천항 ()삼천포)', lat: 35.002, lng: 128.065 },
  { id: 'JN_001', region: '전남', name: '목포항', lat: 34.812, lng: 126.380 },
  { id: 'JN_002', region: '전남', name: '완도항', lat: 34.312, lng: 126.754 },
  { id: 'JN_003', region: '전남', name: '여수도항', lat: 34.633, lng: 127.295 },
  { id: 'JJ_001', region: '제주', name: '제주연안항 (제주시)', lat: 33.521, lng: 126.527 },
  { id: 'JJ_002', region: '제주', name: '성산포항 (서귀포)', lat: 33.252, lng: 126.564 },
  { id: 'IC_001', region: '인천', name: '인천냘항', lat: 37.449, lng: 126.627 },
  { id: 'IC_002', region: '인천', name: '연안항 ()연평)', lat: 37.067, lng: 126.414 },
  { id: 'CB_001', region: '충남', name: '븴도항', lat: 36.776, lng: 126.421 },
  { id: 'CB_002', region: '충남', name: '주문진항 (말도)', lat: 36.511, lng: 126.151 },
];

// In-Memory VVIP 슬롯 저장소 (DB 연결 시 MongoDB에 영구저장)
let vvipSlots = memVvipSlots;

// DB 연결 시 VVIP 슬롯 불러오기
async function loadVvipSlotsFromDB() {
  if (!dbReady || !BusinessPost) return;
  try {
    const now = new Date();
    const vvipPosts = await BusinessPost.find({ isPinned: true, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] });
    vvipPosts.forEach(p => {
      if (p.harborId) vvipSlots[p.harborId] = { userId: p.author_email, userName: p.author, purchasedAt: p.createdAt?.toISOString(), expiresAt: p.expiresAt?.toISOString(), harborName: p.region };
    });
    console.log(`[VVIP] DB에서 ${vvipPosts.length}개 슬롯 복원`);
    saveVvipSlots(); // DB 로드 후 JSON 파일도 동기화
  } catch(e) { console.error('[VVIP] 슬롯 로드 실패:', e.message); }
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
      console.log(`[VVIP 만료] ${slot.harborName} 슬롯 자동 해제`);
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

// VVIP 슬롯 구매 (선착순) — 만료일 30일 자동 설정 + User DB 저장
app.post('/api/vvip/purchase', async (req, res) => {
  const { harborId, userId, userName } = req.body;
  if (!harborId || !userId) return res.status(400).json({ error: '필수 정보 누락' });

  const harbor = HARBOR_LIST.find(h => h.id === harborId);
  if (!harbor) return res.status(404).json({ error: '존재하지 않는 항구입니다.' });

  const now = new Date();
  if (vvipSlots[harborId]) {
    const slot = vvipSlots[harborId];
    if (!slot.expiresAt || new Date(slot.expiresAt) >= now) {
      return res.status(409).json({ error: '이미 다른 선장님이 선점하셨습니다.', takenBy: slot.userName });
    }
    console.log(`[VVIP 만료 재구매] ${harbor.name}`);
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
    } catch(e) { console.error('[VVIP DB 저장 실패]', e.message); }
  }

  res.json({
    success: true, harbor,
    expiresAt: expiresAt.toISOString(),
    message: `${harbor.name} VVIP 독점 예약 완료! (${expiresAt.toLocaleDateString('ko-KR')}까지 유효)`
  });
});

// 내 VVIP 슬롯 확인 (만료 여부 + 잔여일 포함)
app.get('/api/vvip/my-slot', (req, res) => {
  const { userId } = req.query;
  const now = new Date();
  const myEntry = Object.entries(vvipSlots).find(([, v]) => v.userId === userId);
  if (myEntry) {
    const [harborId, slot] = myEntry;
    const harbor = HARBOR_LIST.find(h => h.id === harborId);
    const isExpired = slot.expiresAt && new Date(slot.expiresAt) < now;
    if (isExpired) {
      delete vvipSlots[harborId];
      saveVvipSlots(); // 만료 파일 반영
      return res.json({ hasSlot: false, reason: 'expired', message: 'VVIP 구독이 만료되었습니다. 재구독 시 슬롯을 다시 선점하세요.' });
    }
    const daysLeft = Math.max(0, Math.ceil((new Date(slot.expiresAt) - now) / 86400000));
    res.json({ hasSlot: true, harbor, slot, daysLeft });
  } else {
    res.json({ hasSlot: false });
  }
});

// 24시간마다 만료된 VVIP 슬롯 자동 정리 (서버 백그라운드)
setInterval(() => {
  const now = new Date();
  let cleaned = 0;
  Object.keys(vvipSlots).forEach(harborId => {
    const slot = vvipSlots[harborId];
    if (slot.expiresAt && new Date(slot.expiresAt) < now) {
      console.log(`[VVIP 자동 만료 정리] ${slot.harborName} (${slot.userName})`);
      delete vvipSlots[harborId];
      cleaned++;
    }
  });
  if (cleaned > 0) { saveVvipSlots(); console.log(`[VVIP 클린업] ${cleaned}개 만료 슬롯 제거 완료`); }
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
      id:       p.productId,
      name:     p.productName,
      price:    p.productPrice?.toLocaleString('ko-KR') || '0',
      discount: p.discountRate > 0 ? `${p.discountRate}%` : '0%',
      img:      p.productImage,
      link:     p.coupangUrl,
      badge:    p.badge || '낙시GO 추천',
    }));

    res.json(formatted);
  } catch (err) {
    console.error('[/api/products] 오류:', err.message);
    res.status(500).json({ error: '상품 조회 실패' });
  }
});

/**
 * GET /api/commerce/coupang/search?keyword=루어 낙시 장비
 * 미디어 탭 영상 콴텐츠 연동 상품 (MediaTab.jsx 전용)
 */
app.get('/api/commerce/coupang/search', async (req, res) => {
  try {
    const keyword  = req.query.keyword  || '낙시용품';
    const category = req.query.category || '';
    
    const products = category
      ? await coupang.getProductsByVideoCategory(category)
      : await coupang.searchCoupang(keyword, 3);

    res.json({
      keyword,
      isMock: coupang.IS_TEST_MODE,
      products,
    });
  } catch (err) {
    console.error('[/api/commerce/coupang/search] 오류:', err.message);
    res.status(500).json({ error: '상품 검색 실패', products: [] });
  }
});

/**
 * GET /api/commerce/coupang/status
 * 쿠팡 API 코나테스트 / 키 상태 확인
 */
app.get('/api/commerce/coupang/status', (req, res) => {
  res.json({
    mode: coupang.IS_TEST_MODE ? 'MOCK (테스트 목업 데이터)' : 'LIVE (쿠팡 실상)' ,
    partnersId: coupang.PARTNERS_ID,
    hasAccessKey: process.env.COUPANG_ACCESS_KEY && !process.env.COUPANG_ACCESS_KEY.startsWith('TEST_'),
    hasSecretKey: process.env.COUPANG_SECRET_KEY && !process.env.COUPANG_SECRET_KEY.startsWith('TEST_'),
    note: '쿠팡 Access Key / Secret Key를 .env에 추가하면 자동으로 LIVE 모드로 전환됩니다.',
  });
});

// ═══════════════════════════════════════════════════════════════════
//  VVIP 항구 독점 슬롯 시스템 (23개 지역)
// ═══════════════════════════════════════════════════════════════════

const VVIP_HARBORS = [
  // 동해권 (8)
  { id: 'sokcho',    name: '속초항',    region: '동해권', area: '강원',   desc: '동해 북부 최대 어항, 가자미·대구 명소' },
  { id: 'gangneung', name: '강릉항',    region: '동해권', area: '강원',   desc: '강릉 안목항 일대, 감성돔·방어 명소' },
  { id: 'donghae',   name: '동해항',    region: '동해권', area: '강원',   desc: '묵호항·동해항, 오징어 야간 선상 유명' },
  { id: 'samcheok',  name: '삼척항',    region: '동해권', area: '강원',   desc: '삼척 공양왕릉 앞바다, 돌돔·열기' },
  { id: 'uljin',     name: '울진항',    region: '동해권', area: '경북',   desc: '후포항·울진 일대, 볼락·방어 다수' },
  { id: 'pohang',    name: '포항항',    region: '동해권', area: '경북',   desc: '구룡포·포항 영일만, 참돔·대게 유명' },
  { id: 'gampo',     name: '감포항',    region: '동해권', area: '경북',   desc: '경주 감포·양포, 붉바리·감성돔' },
  { id: 'ulsan',     name: '울산항',    region: '동해권', area: '울산',   desc: '방어진·주전 일대, 방어·부시리 대형급' },
  // 남해권 (8)
  { id: 'gijang',    name: '기장항',    region: '남해권', area: '부산',   desc: '기장 대변항, 멸치·참돔 최대 어장' },
  { id: 'geoje',     name: '거제도',    region: '남해권', area: '경남',   desc: '장목·외포·구조라, 대물 감성돔·참돔' },
  { id: 'tongyeong', name: '통영항',    region: '남해권', area: '경남',   desc: '한려수도 중심, 섬 낚시·선상낚시 천국' },
  { id: 'goseong',   name: '고성항',    region: '남해권', area: '경남',   desc: '자란만·당항포, 갑오징어·감성돔' },
  { id: 'namhae',    name: '남해도',    region: '남해권', area: '경남',   desc: '금산·노도, 참돔·삼치·방어 명소' },
  { id: 'yeosu',     name: '여수항',    region: '남해권', area: '전남',   desc: '돌산·거문도, 붉바리·참돔 대물 다수' },
  { id: 'wando',     name: '완도항',    region: '남해권', area: '전남',   desc: '보길도·청산도, 돌돔·참돔 다도해 명소' },
  { id: 'jindo',     name: '진도·해남', region: '남해권', area: '전남',   desc: '명량수도·오류항, 부시리·방어 시즌' },
  // 서해권 (5)
  { id: 'incheon',   name: '인천항',    region: '서해권', area: '인천',   desc: '소래·연평도, 우럭·광어 선상 명소' },
  { id: 'taean',     name: '태안항',    region: '서해권', area: '충남',   desc: '안면도·몽산포, 주꾸미·꽃게 시즌' },
  { id: 'boryeong',  name: '보령항',    region: '서해권', area: '충남',   desc: '대천항·외연도, 광어·우럭 최상급' },
  { id: 'gunsan',    name: '군산항',    region: '서해권', area: '전북',   desc: '선유도·어청도, 벵에돔·참돔' },
  { id: 'mokpo',     name: '목포항',    region: '서해권', area: '전남',   desc: '흑산도·홍도 출발 거점, 참돔·벵에돔' },
  // 제주권 (2)
  { id: 'jeju',      name: '제주시',    region: '제주권', area: '제주',   desc: '한림·애월, 다금바리·벵에돔 최대 성지' },
  { id: 'seogwipo',  name: '서귀포시',  region: '제주권', area: '제주',   desc: '마라도·가파도, 참돔·방어·다금바리' },
];

// --- VVIP: 23개 항구 목록 + 선점 현황 ---
app.get('/api/vvip/harbors', async (req, res) => {
  try {
    let slots = {};
    if (dbReady && User) {
      const vipUsers = await User.find({ tier: 'BUSINESS_VIP', vvipHarborId: { $exists: true, $ne: null } });
      vipUsers.forEach(u => {
        if (u.vvipHarborId) {
          slots[u.vvipHarborId] = { userId: u.email, userName: u.name, purchasedAt: u.vvipPurchasedAt, expiresAt: u.vvipExpiresAt };
        }
      });
    } else {
      slots = memVvipSlots || {};
    }
    const harbors = VVIP_HARBORS.map(h => {
      const slot = slots[h.id];
      return { ...h, isTaken: !!slot, takenBy: slot ? slot.userName : null, purchasedAt: slot?.purchasedAt || null, expiresAt: slot?.expiresAt || null };
    });
    res.json({ harbors, totalSlots: VVIP_HARBORS.length, takenCount: Object.keys(slots).length });
  } catch (err) {
    console.error('[vvip/harbors]', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// --- VVIP: 내 슬롯 확인 ---
app.get('/api/vvip/my-slot', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.json({ hasSlot: false });
    if (dbReady && User) {
      const user = await User.findOne({ $or: [{ email: userId }, { id: userId }] });
      if (user && user.vvipHarborId) {
        const harbor = VVIP_HARBORS.find(h => h.id === user.vvipHarborId);
        const isActive = user.tier === 'BUSINESS_VIP';
        return res.json({ hasSlot: isActive, harborId: user.vvipHarborId, harborName: harbor?.name || '', expiresAt: user.vvipExpiresAt });
      }
      return res.json({ hasSlot: false });
    } else {
      const entry = Object.entries(memVvipSlots || {}).find(([, v]) => v.userId === userId);
      if (entry) {
        const harbor = VVIP_HARBORS.find(h => h.id === entry[0]);
        return res.json({ hasSlot: true, harborId: entry[0], harborName: harbor?.name || '', expiresAt: entry[1].expiresAt });
      }
      return res.json({ hasSlot: false });
    }
  } catch (err) { res.status(500).json({ hasSlot: false }); }
});

// --- VVIP: 항구 선점 예약 ---
app.post('/api/vvip/purchase', async (req, res) => {
  try {
    const { harborId, userId, userName } = req.body;
    if (!harborId || !userId) return res.status(400).json({ error: '필수 데이터 누락' });
    const harbor = VVIP_HARBORS.find(h => h.id === harborId);
    if (!harbor) return res.status(404).json({ error: '존재하지 않는 항구입니다.' });
    const purchasedAt = new Date();
    const expiresAt = new Date(purchasedAt.getTime() + 31 * 24 * 60 * 60 * 1000);
    if (dbReady && User) {
      const existing = await User.findOne({ vvipHarborId: harborId, tier: 'BUSINESS_VIP' });
      if (existing && existing.email !== userId) return res.status(409).json({ error: `${harbor.name}은(는) 이미 선점된 자리입니다.` });
      await User.findOneAndUpdate(
        { $or: [{ email: userId }, { id: userId }] },
        { tier: 'BUSINESS_VIP', vvipHarborId: harborId, vvipPurchasedAt: purchasedAt, vvipExpiresAt: expiresAt }
      );
    } else {
      if (!memVvipSlots) memVvipSlots = {};
      const existing = memVvipSlots[harborId];
      if (existing && existing.userId !== userId) return res.status(409).json({ error: `${harbor.name}은(는) 이미 선점된 자리입니다.` });
      memVvipSlots[harborId] = { userId, userName, purchasedAt, expiresAt };
      saveVvipSlots(); // VVIP 슬롯 파일 저장
      const user = memUsers.find(u => u.email === userId || u.id === userId);
      if (user) { user.tier = 'BUSINESS_VIP'; user.vvipHarborId = harborId; user.vvipPurchasedAt = purchasedAt; user.vvipExpiresAt = expiresAt; saveMemUsers(); }
    }
    res.json({ success: true, harborId, harborName: harbor.name, purchasedAt, expiresAt });
  } catch (err) { console.error('[vvip/purchase]', err.message); res.status(500).json({ error: '서버 오류' }); }
});

// --- VVIP: 구독 해지 (관리자 전용) ---
app.post('/api/vvip/cancel', async (req, res) => {
  try {
    const { harborId, adminId } = req.body;
    if (adminId !== 'sunjulab') return res.status(403).json({ error: '권한 없음' });
    if (dbReady && User) {
      await User.findOneAndUpdate({ vvipHarborId: harborId }, { tier: 'FREE', vvipHarborId: null, vvipExpiresAt: null });
    } else {
      if (memVvipSlots && memVvipSlots[harborId]) {
        const uid = memVvipSlots[harborId].userId;
        delete memVvipSlots[harborId];
        saveVvipSlots(); // VVIP 슬롯 파일 저장
        const u = memUsers.find(x => x.email === uid || x.id === uid);
        if (u) { u.tier = 'FREE'; u.vvipHarborId = null; saveMemUsers(); }
      }
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: '서버 오류' }); }
});

// ─── 서버 종료 시 전체 데이터 강제 플러시 ────────────────────────────────────
function flushAllData() {
  console.log('[Flush] 서버 종료 감지 → 전체 데이터 파일 동기화 시작...');
  try { saveMemUsers();             console.log('[Flush] users.json ✅'); } catch(e) {}
  try { saveMemPosts();             console.log('[Flush] posts.json ✅'); } catch(e) {}
  try { saveMemRecords();           console.log('[Flush] records.json ✅'); } catch(e) {}
  try { saveMemCrews();             console.log('[Flush] crews.json ✅'); } catch(e) {}
  try { saveChatHistories();        console.log('[Flush] chats.json ✅'); } catch(e) {}
  try { saveMemNotices();           console.log('[Flush] notices.json ✅'); } catch(e) {}
  try { saveMemBusinessPosts();     console.log('[Flush] business.json ✅'); } catch(e) {}
  try { saveSecretPointOverrides(); console.log('[Flush] secretPointOverrides.json ✅'); } catch(e) {}
  try { saveCctvOverrides();        console.log('[Flush] cctvOverrides.json ✅'); } catch(e) {}
  try { saveProSubs();              console.log('[Flush] proSubscriptions.json ✅'); } catch(e) {}
  try { saveVvipSlots();            console.log('[Flush] vvipSlots.json ✅'); } catch(e) {}
  console.log('[Flush] ✅ 전체 데이터 동기화 완료.');
}

// 정상 종료 (Render/PM2 배포 환경 재시작)
process.on('SIGTERM', () => { flushAllData(); process.exit(0); });
process.on('SIGINT',  () => { flushAllData(); process.exit(0); });
// 예기치 못한 크래시 대비
process.on('uncaughtException', (err) => {
  console.error('[CRASH] 예기치 못한 에러:', err.message);
  flushAllData();
  process.exit(1);
});

// ─── 30분마다 자동 백업 (Render 무료플랜 sleep 대비) ──────────────────────────
setInterval(() => {
  console.log('[AutoBackup] 30분 주기 자동 백업 실행...');
  flushAllData();
}, 30 * 60 * 1000);

// ─── 서버 시작 ────────────────────────────────────────────────────────────────
server.listen(process.env.PORT || 5000, () => {
  const port = process.env.PORT || 5000;
  console.log(`🚀 Fishing GO 서버 실행 중 → http://localhost:${port}`);
  console.log(`📊 DB 상태: ${dbReady ? 'MongoDB ✅' : '인메모리 모드 ⚠️'}`);

  // ─── Render 슬립 방지 Self Keep-Alive ─────────────────────────────────
  if (process.env.RENDER_EXTERNAL_URL) {
    const selfUrl = process.env.RENDER_EXTERNAL_URL;
    setInterval(async () => {
      try {
        await axios.get(`${selfUrl}/api/health`);
        console.log('[KeepAlive] Self-ping 성공');
      } catch (e) {
        console.warn('[KeepAlive] Self-ping 실패:', e.message);
      }
    }, 10 * 60 * 1000);
    console.log(`✅ Render Keep-Alive 활성화 (${selfUrl})`);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ▣ 정기결제(빌링) 시스템 — 포트원 customer_uid 기반 자동 월 청구
// ══════════════════════════════════════════════════════════════════════════════

const BILLING_PLAN_MAP = {
  LITE: { tier: 'BUSINESS_LITE', amount: 9900  },
  PRO:  { tier: 'PRO',           amount: 110000 },
  VVIP: { tier: 'BUSINESS_VIP',  amount: 550000 },
};

// ── 포트원 액세스 토큰 발급 헬퍼 ──────────────────────────────────────────────
async function getPortoneToken() {
  if (!process.env.PORTONE_API_KEY) return null;
  const res = await axios.post('https://api.iamport.kr/users/getToken', {
    imp_key:    process.env.PORTONE_API_KEY,
    imp_secret: process.env.PORTONE_API_SECRET,
  });
  return res.data.response?.access_token || null;
}

// ── 빌링키로 실제 청구 실행 ───────────────────────────────────────────────────
async function chargeBilling(sub) {
  const token = await getPortoneToken();
  if (!token) {
    // 테스트모드: 실제 청구 없이 성공 처리
    console.log(`[BillingTest] 테스트모드 자동청구 성공 - ${sub.userId} / ${sub.planId}`);
    return { success: true, testMode: true };
  }
  const merchant_uid = `auto_${sub.planId}_${sub.userId.replace(/[^a-zA-Z0-9]/g,'')}_${Date.now()}`;
  const res = await axios.post('https://api.iamport.kr/subscribe/payments/again', {
    customer_uid: sub.customerUid,
    merchant_uid,
    amount:       sub.amount,
    name:         `낚시GO ${sub.planId} 정기구독`,
  }, { headers: { Authorization: token } });
  const payment = res.data.response;
  if (payment.status !== 'paid') throw new Error(payment.fail_reason || '결제 실패');
  return { success: true, imp_uid: payment.imp_uid };
}

// ── 구독 갱신 처리 (성공/실패 공통) ───────────────────────────────────────────
async function processSubscription(sub) {
  try {
    const result = await chargeBilling(sub);
    const next   = new Date(sub.nextBillingDate);
    next.setMonth(next.getMonth() + 1);

    if (dbReady && Subscription) {
      await Subscription.findByIdAndUpdate(sub._id, {
        status:          'active',
        lastBilledAt:    new Date(),
        nextBillingDate: next,
        failCount:       0,
        lastFailReason:  null,
      });
      // 유저 tier + 만료일 갱신
      await User?.findOneAndUpdate(
        { $or: [{ email: sub.userId }, { id: sub.userId }] },
        { tier: BILLING_PLAN_MAP[sub.planId]?.tier, subscriptionExpiresAt: next }
      ).catch(() => {});
    }
    console.log(`[Billing] ✅ 자동청구 성공 - ${sub.userId} / ${sub.planId} / ${sub.amount}원`);
  } catch (err) {
    const failCount = (sub.failCount || 0) + 1;
    const newStatus = failCount >= 3 ? 'failed' : 'active'; // 3회 실패 시 구독 정지
    if (dbReady && Subscription) {
      await Subscription.findByIdAndUpdate(sub._id, {
        status:         newStatus,
        failCount,
        lastFailedAt:   new Date(),
        lastFailReason: err.message,
      });
      // 3회 실패 시 유저 tier FREE로 강등
      if (newStatus === 'failed') {
        await User?.findOneAndUpdate(
          { $or: [{ email: sub.userId }, { id: sub.userId }] },
          { tier: 'FREE', subscriptionExpiresAt: null }
        ).catch(() => {});
      }
    }
    console.warn(`[Billing] ❌ 자동청구 실패(${failCount}회) - ${sub.userId}: ${err.message}`);
  }
}

// ── 스케줄러: 매일 오전 9시(KST) 만기 구독 일괄 청구 ─────────────────────────
async function runBillingScheduler() {
  if (!dbReady || !Subscription) return;
  const now   = new Date();
  const dueList = await Subscription.find({
    status:          'active',
    nextBillingDate: { $lte: now },
  }).lean().catch(() => []);

  if (dueList.length > 0) {
    console.log(`[Scheduler] 정기결제 대상 ${dueList.length}건 처리 시작`);
    for (const sub of dueList) {
      await processSubscription(sub);
      await new Promise(r => setTimeout(r, 300)); // 과부하 방지
    }
  }
}

// node-cron 또는 24시간 인터벌 폴백
if (cron) {
  cron.schedule('0 9 * * *', runBillingScheduler, { timezone: 'Asia/Seoul' });
  console.log('✅ [Billing Scheduler] node-cron 매일 09:00(KST) 자동청구 활성화');
} else {
  setInterval(runBillingScheduler, 24 * 60 * 60 * 1000); // 24시간 인터벌 폴백
  console.log('✅ [Billing Scheduler] 인터벌 폴백 자동청구 활성화 (24h)');
}

// ── API: 빌링키 등록 (최초 카드 등록 + 첫 결제) ──────────────────────────────
app.post('/api/payment/billing/register', async (req, res) => {
  try {
    const { imp_uid, customer_uid, planId, pgProvider, userId, userName, harborId } = req.body;
    if (!customer_uid || !planId || !userId)
      return res.status(400).json({ error: '필수 항목 누락 (customer_uid, planId, userId)' });

    const plan = BILLING_PLAN_MAP[planId];
    if (!plan) return res.status(400).json({ error: '유효하지 않은 플랜' });

    // 첫 결제 포트원 검증 (실서비스)
    if (process.env.PORTONE_API_KEY && imp_uid) {
      try {
        const token  = await getPortoneToken();
        const payRes = await axios.get(`https://api.iamport.kr/payments/${imp_uid}`, {
          headers: { Authorization: token },
        });
        const payment = payRes.data.response;
        if (payment.status !== 'paid' || payment.amount !== plan.amount)
          return res.status(400).json({ error: '첫 결제 금액 불일치' });
      } catch(e) {
        return res.status(500).json({ error: '첫 결제 검증 실패: ' + e.message });
      }
    }

    // 다음 결제일 계산 (가입일 +1개월)
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    const billingDay      = nextBillingDate.getDate();

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
      ).catch(() => {});
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

    console.log(`[Billing] ✅ 정기구독 등록 - ${userName}(${userId}) / ${planId} / ${plan.amount}원`);
    res.json({
      success: true, planId, tier: plan.tier,
      nextBillingDate: nextBillingDate.toISOString(),
      amount: plan.amount,
    });
  } catch (err) {
    console.error('[POST /api/payment/billing/register]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── API: 내 구독 정보 조회 ────────────────────────────────────────────────────
app.get('/api/payment/subscription/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let sub = null;
    if (dbReady && Subscription) {
      sub = await Subscription.findOne({ userId }).lean().catch(() => null);
    } else {
      sub = memProSubs[userId] || null;
    }
    if (!sub) return res.json({ hasSubscription: false });
    res.json({
      hasSubscription: true,
      planId:          sub.planId,
      tier:            sub.tier,
      amount:          sub.amount,
      status:          sub.status,
      pgProvider:      sub.pgProvider,
      nextBillingDate: sub.nextBillingDate,
      lastBilledAt:    sub.lastBilledAt,
      startedAt:       sub.startedAt,
      failCount:       sub.failCount || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: 구독 취소 ─────────────────────────────────────────────────────────────
app.delete('/api/payment/subscription/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
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
        } catch(e) { console.warn('[BillingCancel] 빌링키 삭제 실패:', e.message); }
      }

      await Subscription.findOneAndUpdate(
        { userId },
        { status: 'cancelled', cancelledAt: new Date(), cancelReason: reason || '사용자 직접 취소' }
      );
      // 유저 tier FREE로 강등
      await User?.findOneAndUpdate(
        { $or: [{ email: userId }, { id: userId }] },
        { tier: 'FREE', subscriptionExpiresAt: null }
      ).catch(() => {});
    } else {
      if (memProSubs[userId]) {
        memProSubs[userId].status = 'cancelled';
        saveProSubs();
        const u = memUsers.find(u => u.email === userId || u.id === userId);
        if (u) { u.tier = 'FREE'; saveMemUsers(); }
      }
    }

    console.log(`[Billing] 구독 취소 - ${userId} / 사유: ${reason || '직접취소'}`);
    res.json({ success: true, message: '구독이 취소되었습니다. 현재 기간 종료 후 해지됩니다.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: 구독 플랜 변경 (업그레이드/다운그레이드) ─────────────────────────────
app.put('/api/payment/subscription/:userId/plan', async (req, res) => {
  try {
    const { userId } = req.params;
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
      ).catch(() => {});
    } else {
      if (memProSubs[userId]) {
        memProSubs[userId].planId = newPlanId;
        memProSubs[userId].tier   = plan.tier;
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
  const safeId  = (userId || 'user').replace(/[^a-zA-Z0-9]/g, '');
  const rand    = Math.random().toString(36).slice(2, 7);
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
    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET || 'fishinggo_secret_2024');
    const userId  = payload.email || payload.id;
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
        ).catch(() => {});
      }
      return res.status(403).json({ error: '구독이 만료되었습니다. 재구독해주세요.', code: 'SUBSCRIPTION_EXPIRED' });
    }
    next();
  } catch { next(); }
}

// 프리미엄 전용 라우트에 미들웨어 적용
app.use(['/api/weather/precision', '/api/secret-point-overrides'], checkSubscriptionValid);

// ── (5) 결제 내역 조회 API ────────────────────────────────────────────────────
app.get('/api/payment/history', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId 필요' });

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
          planId:      sub.planId,
          pgProvider:  sub.pgProvider,
          paymentType: 'billing_first',
          amount:      sub.amount,
          status:      'paid',
          createdAt:   sub.lastBilledAt || new Date().toISOString(),
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
app.post('/api/payment/history/record', async (req, res) => {
  try {
    const { userId, userName, planId, pgProvider, paymentType, amount, status, imp_uid, merchant_uid, failReason } = req.body;
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
  attendance:    20, post_write:  30, record_write: 50,
  comment_write: 10, like_receive: 5, point_visit:  15,
  photo_upload:  25, first_catch: 100, weekly_streak: 80, monthly_streak: 300,
};

app.post('/api/user/exp', async (req, res) => {
  try {
    const { userId, action } = req.body;
    if (!userId || !action) return res.status(400).json({ error: '필수 항목 누락' });
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
  console.log('✅ Rate Limit 강화 적용 (결제/검색)');
} catch(e) { console.warn('[RateLimit] express-rate-limit 미설치 또는 적용 실패'); }

// ── (11) 커뮤니티 서버사이드 전문 검색 ──────────────────────────────────────
app.get('/api/community/search', async (req, res) => {
  try {
    const { q = '', page = 1, limit = 20, category } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let results = [];
    let total   = 0;

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
      total   = filtered.length;
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

app.post('/api/user/favorites', async (req, res) => {
  try {
    const { userId, pointId, action } = req.body; // action: 'add' | 'remove'
    if (!userId || !pointId || !action) return res.status(400).json({ error: '필수 항목 누락' });
    let favorites = [];
    if (dbReady && User) {
      const update = action === 'add'
        ? { $addToSet: { favorites: pointId } }
        : { $pull:     { favorites: pointId } };
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
    const jwtLib = require('jsonwebtoken');
    let payload;
    try { payload = jwtLib.verify(authHeader.replace('Bearer ', ''), process.env.JWT_SECRET || 'fishinggo_secret_2024'); }
    catch { return res.status(401).json({ error: '인증 필요' }); }
    const isAdmin = payload.id === 'sunjulab' || payload.email === 'sunjulab' || payload.name === 'sunjulab';
    if (!isAdmin) return res.status(403).json({ error: '접근 권한 없음' });

    const now    = new Date();
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

      stats.totalRevenue         = allPaid[0]?.total || 0;
      stats.monthRevenue         = monthPaid[0]?.total || 0;
      stats.activeSubscriptions  = activeSubs;
      stats.planBreakdown        = Object.fromEntries(breakdown.map(b => [b._id, { count: b.count, revenue: b.revenue }]));
      stats.recentPayments       = recentList;
    } else {
      // 인메모리 통계
      stats.activeSubscriptions = Object.values(memProSubs).filter(s => s.status === 'active').length;
      Object.values(memProSubs).forEach(s => { stats.totalRevenue += s.amount || 0; stats.monthRevenue += s.amount || 0; });
    }
    res.json(stats);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── CCTV 관리 어드민 API (JWT 인증 — 54차 보안 강화) ─────────────
require('./cctv_admin_routes')(app);
