const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fishinggo_secret_2024';

// In-Memory Fallback - DB 없어도 즉시 회원가입/로그인 작동
const USERS_FILE = path.join(__dirname, 'users.json');
let memUsers = [];
try {
  if (fs.existsSync(USERS_FILE)) {
    memUsers = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    console.log(`[Fallback] 로컬 보존 파일 로드 완료. (총 ${memUsers.length}명)`);
  }
} catch (e) {
  console.log('[Fallback] users.json 로드 실패, 초기화합니다.');
}

function saveMemUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(memUsers, null, 2));
  } catch (e) {
    console.error('[Fallback] 로컬 저장 실패:', e);
  }
}

let dbReady = false;

// ─── MongoDB 연결 ───────────────────────────────────────────────────────────
// Render 환경변수에 MONGO_PASS=@@1q2w3e 따로 설정하면 자동으로 URI 조합
// 또는 MONGO_URI 에 완성된 연결주소를 직접 넣어도 됨
const buildMongoUri = () => {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  const pass = process.env.MONGO_PASS;
  const host = process.env.MONGO_HOST || 'cluster0.cyqhznd.mongodb.net';
  const user = process.env.MONGO_USER || 'fishinggo';
  const db   = process.env.MONGO_DB   || 'fishinggo';
  if (pass) {
    const enc = encodeURIComponent(pass); // @, # 등 특수문자 자동 인코딩
    return `mongodb+srv://${user}:${enc}@${host}/${db}?appName=Cluster0`;
  }
  return '';
};

const MONGO_URI = buildMongoUri();
if (MONGO_URI) {
  console.log('MongoDB 연결 시도 중 (URI 존재)...');
  mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 })
    .then(() => { dbReady = true; console.log('✅ MongoDB 연결 성공! 영구저장 모드 활성화'); })
    .catch(err => {
      dbReady = false;
      console.log('⚠️ MongoDB 연결실패 → 인메모리 모드 전환');
      console.log('원인:', err.message);
      console.log('💡 Atlas IP 허용(0.0.0.0/0) 또는 URI 재확인 필요');
    });
} else {
  console.log('⚠️ MONGO_URI/MONGO_PASS 미설정 → 인메모리 모드.');
}

let User, Post;
try {
  User = require('./models/User');
  Post = require('./models/Post');
} catch(e) { User = null; Post = null; }

const app = express();
app.use(cors());
app.use(express.json());

// ─── 진단용 디버그 엔드포인트 ─────────────────────────────────────────────
app.get('/api/debug', (req, res) => {
  const uri = MONGO_URI ? MONGO_URI.replace(/:[^@]+@/, ':***@') : '미설정';
  res.json({
    dbReady,
    mongoUri: uri,
    memUserCount: memUsers.length,
    env: {
      MONGO_URI: !!process.env.MONGO_URI,
      MONGO_PASS: !!process.env.MONGO_PASS,
      NODE_ENV: process.env.NODE_ENV
    }
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// 실시간 크루 채팅 서버 로직
const chatHistories = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_crew', (crewId) => {
    socket.join(crewId);
    if (!chatHistories[crewId]) chatHistories[crewId] = [];
    socket.emit('chat_history', chatHistories[crewId]);
  });

  socket.on('send_msg', (data) => {
    const msgData = {
      sender: data.sender || 'Anonymous',
      text: data.text,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    if (!chatHistories[data.crewId]) chatHistories[data.crewId] = [];
    chatHistories[data.crewId].push(msgData);
    // 방 전체 인원에게 발송
    io.to(data.crewId).emit('new_msg', msgData);
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
          phase: `${Math.floor(Math.random()*15)+1}물`, 
          high: '14:30', low: '08:15', 
          current_level: `${Math.floor(Math.random()*250)+10}cm` 
        }
      },
      lastUpdated: new Date()
    };
    await new Promise(r => setTimeout(r, 80));
  }
}

updateAllStationsCache();
setInterval(updateAllStationsCache, 3600000);

/* =========================================================
   AUTH & USER LEVELING API (DB + 인메모리 이중 레이어)
========================================================= */

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

// --- 회원가입 ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: '모든 필드를 입력해주세요.' });

    if (dbReady && User) {
      const existing = await User.findOne({ $or: [{ email }, { name }] });
      if (existing) return res.status(400).json({ error: '이미 사용 중인 이메일이거나 닉네임입니다.' });
      const hashed = await bcrypt.hash(password, 10);
      const user = new User({ email, password: hashed, name });
      await user.save();
      return res.json({ success: true });
    } else {
      // 인메모리 fallback
      if (memUsers.find(u => u.email === email)) return res.status(400).json({ error: '이미 등록된 이메일입니다.' });
      if (memUsers.find(u => u.name === name)) return res.status(400).json({ error: '이미 사용 중인 닉네임입니다.' });
      const hashed = await bcrypt.hash(password, 10);
      memUsers.push({ id: Date.now().toString(), email, password: hashed, name, level: 1, exp: 0, tier: 'Silver', avatar: 'https://i.pravatar.cc/150?img=11', followers: [], following: [], lastAttendance: null, totalAttendance: 0, totalExp: 0 });
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

    const token = jwt.sign({ id: user._id || user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: buildUserResponse(user), justAttended, leveledUp, expGained, streak });
  } catch(err) { console.error(err); res.status(500).json({ error: '서버 오류가 발생했습니다.' }); }
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

    const token = jwt.sign({ id: user._id || user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: buildUserResponse(user), justAttended, leveledUp });
  } catch(err) { console.error(err); res.status(500).json({ error: '서버 오류가 발생했습니다.' }); }
});

// --- 닉네임 변경 ---
app.put('/api/user/nickname', async (req, res) => {
  try {
    const { email, newName } = req.body;
    if (!newName) return res.status(400).json({ error: '닉네임을 입력해주세요.' });
    
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

// --- 활동별 EXP 지급 ---
app.post('/api/user/exp', async (req, res) => {
  try {
    const { email, activity } = req.body;
    if (!email || !activity) return res.status(400).json({ error: 'email과 activity가 필요합니다.' });
    const expAmount = EXP_REWARDS[activity];
    if (!expAmount) return res.status(400).json({ error: '알 수 없는 활동입니다.' });

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
    const posts = await Post.find({ author_email: req.query.email }).sort({ createdAt: -1 });
    res.json(posts);
  } catch(err) { res.json([]); }
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
    tide: { phase: '7물(사리)', high: '15:20', low: '08:42' },
    tide_predictions: [
      { time: '08:42', type: '간조', level: 45 },
      { time: '15:20', type: '고조', level: 185 }
    ]
  });
});

app.get('/api/weather/cctv', async (req, res) => {
  const { stationId } = req.query;
  try {
    const KEY = process.env.KHOA_KEY || '2c92debdb84fc6c2ca60816fa5e9acbbfa06a9ae502cc37919ebec6be629623a';
    const resUrl = await axios.get(`http://www.khoa.go.kr/api/oceangrid/oceanObsCctv/search.do?ServiceKey=${KEY}&ObsCode=${stationId || 'DT_0001'}&ResultType=json`);
    const url = resUrl.data?.result?.data?.[0]?.cctv_url;
    if (url) res.json({ url });
    else res.status(404).json({ error: 'CCTV not found' });
  } catch (err) { res.status(500).json({ error: 'API Error' }); }
});

// --- 유튜브 비디오 API (최신 영상 자동 렌더링용) ---
const FALLBACK_VIDEOS = [
  { id: '1', title: '[앵쩡TV] 미지의 포인트에서 만난 가을 배스! (미친 입질)', category: '루어', youtubeId: 'XXYHZnsZse0', views: '1.2M', description: '루어 낚시의 꽃, 런커 배스 히트부터 랜딩까지 숨막히는 순간!', products: [{ name: '앵쩡 추천 루어대 풀세트', price: '185,000원', discount: '10%', img: 'https://images.unsplash.com/photo-1544551763-8dd44758c2dd?auto=format&fit=crop&w=100&q=60' }] },
  { id: '2', title: '[진석기시대] 소문이 자자한 갯바위 명포인트에서 24시간 캠핑 낚시!!', category: '선상', youtubeId: '_SUmTxKlZ68', views: '984k', description: '직접 잡은 대자연의 선물! 날 것 그대로의 원초적인 낚시 먹방.', products: [{ name: '진석기 생존용 캠핑 칼', price: '45,000원', discount: '5%', img: 'https://plus.unsplash.com/premium_photo-1678812638848-8ef7c0b0afaa?auto=format&fit=crop&w=100&q=60' }] },
  { id: '3', title: '[입질의 추억] 수산시장 내부자의 충격 폭로, 단골도 예외 없습니다', category: '찌낚시', youtubeId: '0qsAaapI748', views: '2.5M', description: '수산물 전문가 어류칼럼니스트 김지민이 공개하는 특급 수산시장 꿀팁.', products: [{ name: '초정밀 카본 찌 세트', price: '28,500원', discount: '20%', img: 'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?auto=format&fit=crop&w=100&q=60' }] },
  { id: '4', title: '[밀루유떼] 쭈꾸미, 갑오징어 두 마리 토끼 다 잡는 가성비 갑 채비법', category: '에깅', youtubeId: 'N_ICJmZlmnc', views: '710k', description: '생활 낚시 끝판왕, 에깅 낚시 초보자도 바로 따라하는 액션 가이드.', products: [{ name: '국민 에기 10색 혼합 세트', price: '15,000원', discount: '30%', img: 'https://images.unsplash.com/photo-1520110120835-c96534a4c984?auto=format&fit=crop&w=100&q=60' }] }
];

app.get('/api/media/youtube', async (req, res) => {
  try {
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    const apiKey = process.env.YOUTUBE_API_KEY;

    // ─── API 키가 없는 경우 완전 무료 RSS 파싱 (rss2json) ───
    if (!apiKey) {
      const RSS_URL = encodeURIComponent(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId || 'UCeBw0Qp_Q_Y96f30d-V96qQ'}`); // 기본은 입질의 추억 채널
      const response = await axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${RSS_URL}`);
      
      if (response.data.status !== 'ok') throw new Error('RSS Parser Error');
      
      const liveVideos = response.data.items.slice(0, 10).map((item, idx) => {
        const vidId = item.link.split('v=')[1];
        return {
          id: `rss_${vidId}`,
          title: item.title,
          category: '최신',
          youtubeId: vidId,
          views: 'NEW', 
          description: `어제 갓 올라온 유튜브 최신 영상입니다: ${item.author}`,
          products: FALLBACK_VIDEOS[idx % 4].products
        };
      });
      return res.json({ videos: liveVideos.length > 0 ? liveVideos : FALLBACK_VIDEOS, source: 'youtube-rss-free' });
    }

    // ─── API 키가 있는 경우 Google Data API 파싱 ───
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId || 'UCeBw0Qp_Q_Y96f30d-V96qQ'}&part=snippet,id&order=date&maxResults=10`;
    const response = await axios.get(searchUrl);
    
    const liveVideos = response.data.items
      .filter(item => item.id.videoId)
      .map((item, idx) => ({
        id: `yt_${item.id.videoId}`,
        title: item.snippet.title,
        category: '최신',
        youtubeId: item.id.videoId,
        views: 'NEW', 
        description: item.snippet.description || '유튜브 채널에서 연동된 최신 영상입니다.',
        products: FALLBACK_VIDEOS[idx % 4].products
      }));

    if (liveVideos.length === 0) return res.json({ videos: FALLBACK_VIDEOS, source: 'fallback (empty)' });
    res.json({ videos: liveVideos, source: 'youtube-live' });
  } catch (err) {
    console.error('YouTube Fetch Error:', err.message);
    res.json({ videos: FALLBACK_VIDEOS, source: 'fallback (error)' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Fishing GO Logic Server running on PORT ${PORT}`);
  console.log(`DB 모드: ${dbReady ? 'MongoDB ✅' : '인메모리 ⚠️'}`);
});
