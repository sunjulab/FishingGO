/**
 * CCTV 관리 어드민 API (54차 보안 강화)
 * JWT 인증 기반 — x-admin-id 평문 헤더 방식 완전 제거
 */
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fishinggo_secret_2024';

if (!global.cctvOverrides) global.cctvOverrides = {};

function verifyCctvAdmin(req, res) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) { res.status(401).json({ error: '인증 필요' }); return null; }
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET);
    if (p.id !== 'sunjulab' && p.email !== 'sunjulab') { res.status(403).json({ error: '관리자 권한 필요' }); return null; }
    return p;
  } catch { res.status(401).json({ error: '토큰 유효하지 않음' }); return null; }
}

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

module.exports = function registerCctvAdminRoutes(app) {
  app.get('/api/admin/cctv', (req, res) => {
    if (!verifyCctvAdmin(req, res)) return;
    const list = BASE_CCTV_MAP.map(item => {
      const ov = global.cctvOverrides[item.obsCode];
      return ov ? { ...item, ...ov, isOverride: true } : { ...item, isOverride: false };
    });
    res.json({ list });
  });

  app.put('/api/admin/cctv/:obsCode', (req, res) => {
    if (!verifyCctvAdmin(req, res)) return;
    const { obsCode } = req.params;
    const { youtubeId, type, label } = req.body;
    const base = BASE_CCTV_MAP.find(b => b.obsCode === obsCode);
    if (!base) return res.status(404).json({ error: '존재하지 않는 CCTV 코드입니다.' });
    if (type === 'youtube' && youtubeId && !/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) {
      return res.status(400).json({ error: 'YouTube ID는 정확히 11자리여야 합니다.' });
    }
    global.cctvOverrides[obsCode] = { youtubeId: youtubeId || '', type: type || 'image', label: label || base.label };
    res.json({ success: true, obsCode });
  });

  app.delete('/api/admin/cctv/:obsCode', (req, res) => {
    if (!verifyCctvAdmin(req, res)) return;
    delete global.cctvOverrides[req.params.obsCode];
    res.json({ success: true });
  });

  app.post('/api/admin/cctv/auto-sync', (req, res) => {
    if (!verifyCctvAdmin(req, res)) return;
    res.json({ success: true, updatedCount: 0, message: 'YouTube API 키 미설정 — 수동 입력을 사용하세요.' });
  });

  app.post('/api/admin/cctv/reset-all', (req, res) => {
    if (!verifyCctvAdmin(req, res)) return;
    global.cctvOverrides = {};
    res.json({ success: true, message: '모든 CCTV 설정이 초기화되었습니다.' });
  });
};
