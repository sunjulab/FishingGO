/**
 * CCTV 관리 어드민 API (56차 — OPT-1 MongoDB 영속화 완성)
 * JWT 인증 기반 — x-admin-id 평문 헤더 방식 완전 제거
 *
 * [저장 전략 — 3단계 레이어]
 *  1순위: MongoDB (dbReady && CctvOverrideModel)  → 영구 저장, 재시작 후에도 유지
 *  2순위: JSON 파일 (cctv_overrides.json)         → DB 연결 실패 시 fallback
 *  3순위: global.cctvOverrides (메모리)            → 최후 fallback (서버 재시작 시 초기화)
 *
 * [서버 시작 시 로드 우선순위]
 *  MongoDB가 준비된 경우 → DB에서 로드하여 global 동기화
 *  MongoDB 미연결 시     → JSON 파일에서 로드 (기존 방식 유지)
 */
const jwt  = require('jsonwebtoken');
const fs   = require('fs');
const path = require('path');

// ✅ 10TH-A1: isAdminToken 로컈 헬퍼 — server/index.js와 동일 로직 유지 (순환 import 방지)
// 레거시 id 'sunjulab' + 실제 이메일 'sunjulab.k@gmail.com' 모두 허용
function isAdminToken(tp) {
  if (!tp) return false;
  return tp.id === 'sunjulab'
    || tp.email === 'sunjulab'
    || tp.email === 'sunjulab.k@gmail.com';
}

// ✅ SEC-03: 하드코딩된 JWT_SECRET fallback 제거 — 환경변수 미설정 시 검증 실패 (위조 방지)
const JWT_SECRET     = process.env.JWT_SECRET;
if (!JWT_SECRET) console.error('[CCTV] CRITICAL: JWT_SECRET 환경변수가 설정되지 않았습니다!');
const OVERRIDES_FILE = path.join(__dirname, 'cctv_overrides.json');

// ✅ 27TH-B2: 모듈 레벨 logger shim — registerCctvAdminRoutes({ logger }) 주입 전 기본값 console
// 주입 후에는 Winston logger로 투명하게 교체됨 (헬퍼 함수들이 공유 사용)
const _log = {
  info:  console.info.bind(console),
  warn:  console.warn.bind(console),
  error: console.error.bind(console),
};

// ── JSON 파일 헬퍼 (DB fallback용) ───────────────────────────────────────────

function loadOverridesFromFile() {
  try {
    if (fs.existsSync(OVERRIDES_FILE)) {
      return JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8'));
    }
  } catch (e) {
    _log.warn('[CCTV] JSON 파일 로드 실패:', e.message);
  }
  return {};
}

function saveOverridesToFile(overrides) {
  try {
    fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(overrides, null, 2), 'utf8');
  } catch (e) {
    _log.error('[CCTV] JSON 파일 저장 실패:', e.message);
  }
}

// global 메모리 초기화 (서버 시작 시 JSON 파일에서 사전 로드)
if (!global.cctvOverrides) global.cctvOverrides = loadOverridesFromFile();

// ── DB 헬퍼 함수 ─────────────────────────────────────────────────────────────

/**
 * MongoDB에서 오버라이드 전체 로드 → global 동기화
 * dbReady && CctvOverrideModel 이 true인 경우에만 호출
 */
async function syncFromDb(CctvOverrideModel) {
  try {
    const docs = await CctvOverrideModel.find({});
    const map = {};
    docs.forEach(d => {
      map[d.obsCode] = { youtubeId: d.youtubeId, type: d.type, label: d.label };
    });
    global.cctvOverrides = map;
    saveOverridesToFile(map); // JSON도 동기화
    _log.info(`[CCTV] ✅ MongoDB 동기화 완료 (오버라이드 ${docs.length}건)`);
  } catch (e) {
    _log.warn('[CCTV] DB 동기화 실패, 기존 메모리 유지:', e.message);
  }
}

/**
 * MongoDB에 단건 upsert 저장 (없으면 insert, 있으면 update)
 */
async function saveToDb(CctvOverrideModel, obsCode, data) {
  try {
    await CctvOverrideModel.findOneAndUpdate(
      { obsCode },
      { ...data, updatedAt: new Date() },
      { upsert: true, new: true }
    );
  } catch (e) {
    _log.error('[CCTV] DB 저장 실패:', e.message);
    throw e; // 상위에서 JSON fallback 처리
  }
}

/**
 * MongoDB에서 단건 삭제
 */
async function deleteFromDb(CctvOverrideModel, obsCode) {
  try {
    await CctvOverrideModel.deleteOne({ obsCode });
  } catch (e) {
    _log.error('[CCTV] DB 삭제 실패:', e.message);
    throw e;
  }
}

/**
 * MongoDB 전체 초기화
 */
async function resetDb(CctvOverrideModel) {
  try {
    await CctvOverrideModel.deleteMany({});
  } catch (e) {
    _log.error('[CCTV] DB 전체 초기화 실패:', e.message);
    throw e;
  }
}

// ── 어드민 인증 미들웨어 ──────────────────────────────────────────────────────

function verifyCctvAdmin(req, res) {
  // ✅ SEC-03: JWT_SECRET 미설정 시 서버 에러 반환 (undefined 전달로 인한 위조 방지)
  if (!JWT_SECRET) { res.status(503).json({ error: '서버 보안 설정 오류' }); return null; }
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) { res.status(401).json({ error: '인증 필요' }); return null; }
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET);
    if (!isAdminToken(p)) { // ✅ 10TH-A1: isAdminToken() 헬퍼로 통일
      res.status(403).json({ error: '관리자 권한 필요' }); return null;
    }
    return p;
  } catch {
    res.status(401).json({ error: '토큰 유효하지 않음' }); return null;
  }
}

// ── CCTV 기본 목록 ───────────────────────────────────────────────────────────

const BASE_CCTV_MAP = [
  { obsCode: 'KW001', areaName: '속초',     region: '강원', type: 'image', youtubeId: null, label: '속초 해수욕장' },
  { obsCode: 'KW002', areaName: '강릉',     region: '강원', type: 'image', youtubeId: null, label: '강릉 경포대' },
  { obsCode: 'KW003', areaName: '동해',     region: '강원', type: 'image', youtubeId: null, label: '동해 묵호항' },
  { obsCode: 'BS001', areaName: '부산 기장', region: '부산', type: 'image', youtubeId: null, label: '기장 대변항' },
  { obsCode: 'GN001', areaName: '거제',     region: '경남', type: 'image', youtubeId: null, label: '거제 구조라' },
  { obsCode: 'GN002', areaName: '통영',     region: '경남', type: 'image', youtubeId: null, label: '통영 한려수도' },
  { obsCode: 'JN001', areaName: '여수',     region: '전남', type: 'image', youtubeId: null, label: '여수 돌산' },
  { obsCode: 'JN002', areaName: '완도',     region: '전남', type: 'image', youtubeId: null, label: '완도 청산도' },
  { obsCode: 'JJ001', areaName: '제주',     region: '제주', type: 'image', youtubeId: null, label: '제주 한림항' },
  { obsCode: 'JJ002', areaName: '서귀포',   region: '제주', type: 'image', youtubeId: null, label: '서귀포 마라도' },
];

// ── 라우트 등록 ───────────────────────────────────────────────────────────────

module.exports = function registerCctvAdminRoutes(app, { getDbReady = () => false, CctvOverrideModel, logger } = {}) {
  // ✅ 27TH-B2: logger 파라미터 주입 패턴 — Winston logger 전달 시 표준화, 미전달 시 console fallback
  // 사용: registerCctvAdminRoutes(app, { ..., logger: winstonLogger })
  _log.info = (logger?.info  || console.info ).bind(logger || console);
  _log.warn = (logger?.warn  || console.warn ).bind(logger || console);
  _log.error = (logger?.error || console.error).bind(logger || console);

  // ✅ 10TH-B3: setTimeout(5000) 고정 대기 → retry 기반 폔링 (100ms 주기, 최대 60회 = 6초)
  // Mongoose connection.once('open',...) 이벤트는 외부 mongoose 인스턴스 필요하므로 폴링으로 대체
  let _syncRetries = 0;
  const _trySync = () => {
    if (getDbReady() && CctvOverrideModel) {
      syncFromDb(CctvOverrideModel)
        .catch(e => _log.warn('[CCTV] DB 실시간 동기화 실패 (시작 시):', e.message));
    } else if (_syncRetries < 60) {
      _syncRetries++;
      setTimeout(_trySync, 1000); // 1초 간격으로 재시도
    } else {
      _log.warn('[CCTV] DB 연결 대기 시간 초과 (60초) — JSON 파일에서만 동작');
    }
  };
  setTimeout(_trySync, 500); // ✅ 27TH-B3: '딘춘' 오타 수정 — 첫 시도 0.5초 딜레이

  /** GET /api/admin/cctv — 전체 목록 (오버라이드 병합) */
  app.get('/api/admin/cctv', (req, res) => {
    if (!verifyCctvAdmin(req, res)) return;
    const list = BASE_CCTV_MAP.map(item => {
      const ov = global.cctvOverrides[item.obsCode];
      return ov ? { ...item, ...ov, isOverride: true } : { ...item, isOverride: false };
    });
    res.json({ list });
  });

  /** PUT /api/admin/cctv/:obsCode — YouTube ID 설정 (MongoDB 우선, JSON fallback) */
  app.put('/api/admin/cctv/:obsCode', async (req, res) => {
    if (!verifyCctvAdmin(req, res)) return;
    const { obsCode } = req.params;
    const { youtubeId, type, label } = req.body;
    const base = BASE_CCTV_MAP.find(b => b.obsCode === obsCode);
    if (!base) return res.status(404).json({ error: '존재하지 않는 CCTV 코드입니다.' });
    if (type === 'youtube' && youtubeId && !/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) {
      return res.status(400).json({ error: 'YouTube ID는 정확히 11자리여야 합니다.' });
    }

    const data = {
      youtubeId: youtubeId || '',
      type:      type || 'image',
      label:     label || base.label,
    };

    // 1순위: MongoDB 저장
    if (getDbReady() && CctvOverrideModel) {
      try {
        await saveToDb(CctvOverrideModel, obsCode, { ...data, areaName: base.areaName });
      } catch (e) {
        // DB 실패 시 JSON fallback으로 계속 진행
        console.warn('[CCTV PUT] DB 실패 → JSON fallback');
      }
    }

    // 메모리 + JSON 동기화 (항상 실행 — DB 성공 여부 무관)
    global.cctvOverrides[obsCode] = data;
    saveOverridesToFile(global.cctvOverrides);

    res.json({ success: true, obsCode, storage: getDbReady() && CctvOverrideModel ? 'mongodb' : 'json' });
  });

  /** DELETE /api/admin/cctv/:obsCode — 오버라이드 제거 (MongoDB 우선, JSON fallback) */
  app.delete('/api/admin/cctv/:obsCode', async (req, res) => {
    if (!verifyCctvAdmin(req, res)) return;
    const { obsCode } = req.params;

    // 1순위: MongoDB 삭제
    if (getDbReady() && CctvOverrideModel) {
      try {
        await deleteFromDb(CctvOverrideModel, obsCode);
      } catch (e) {
        console.warn('[CCTV DELETE] DB 실패 → JSON fallback');
      }
    }

    // 메모리 + JSON 동기화
    delete global.cctvOverrides[obsCode];
    saveOverridesToFile(global.cctvOverrides);

    res.json({ success: true });
  });

  /** POST /api/admin/cctv/auto-sync — YouTube API 자동 동기화 (미구현) */
  app.post('/api/admin/cctv/auto-sync', (req, res) => {
    if (!verifyCctvAdmin(req, res)) return;
    // ✅ 10TH-B6: 항상 200 성공 반환 → 501 Not Implemented — 클라이언트가 성공으로 오인 방지
    res.status(501).json({
      success: false,
      code: 'NOT_IMPLEMENTED',
      message: 'YouTube API 자동 동기화 미구현 — 수동 입력을 사용하세요.'
    });
  });

  /** POST /api/admin/cctv/reset-all — 전체 초기화 (MongoDB 우선, JSON fallback) */
  app.post('/api/admin/cctv/reset-all', async (req, res) => {
    if (!verifyCctvAdmin(req, res)) return;

    // 1순위: MongoDB 전체 삭제
    if (getDbReady() && CctvOverrideModel) {
      try {
        await resetDb(CctvOverrideModel);
      } catch (e) {
        console.warn('[CCTV RESET] DB 실패 → JSON fallback');
      }
    }

    // 메모리 + JSON 초기화
    global.cctvOverrides = {};
    saveOverridesToFile({});

    res.json({ success: true, message: '모든 CCTV 설정이 초기화되었습니다.' });
  });
};
