#!/usr/bin/env node
/**
 * guardian-tide-full-audit.mjs  —  전 포인트 물때(만조/간조/물때단계) 전수조사
 *
 * 앱이 물때를 표시하는 3개 경로를 각각 재현하여 바다타임(badatime.com)과 대조한다.
 *   A. 정적 바다타임 캐시(TIDE_CALENDAR)  : getPointSpecificData() — 물때탭/대시보드/지도 카드
 *   B. 포인트 팝업(FishingPointBottomSheet): KHOA 예보(/api/tide/obs, getKhoaObsCode 매핑) + 서버 phase(/api/weather/precision)
 *   C. 서버 폴백(/api/weather/precision tide) — 시각/단계
 *
 * 사용법: node scripts/guardian-tide-full-audit.mjs [--out report.txt] [--json report.json]
 * 환경변수: AUDIT_API (기본: 운영 서버)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const API = process.env.AUDIT_API || 'https://fishing-go-backend.onrender.com';
const argv = process.argv;
const OUT = (() => { const i = argv.indexOf('--out'); return i > 0 ? argv[i + 1] : null; })();
const JSON_OUT = (() => { const i = argv.indexOf('--json'); return i > 0 ? argv[i + 1] : null; })();
const UA = { 'User-Agent': 'Mozilla/5.0 (FishingGO tide audit)' };

const lines = [];
const log = (...a) => { const s = a.join(' '); lines.push(s); console.log(s); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const haversine = (a, b, c, d) => { const R = 6371, t = x => x * Math.PI / 180; const dl = t(c - a), dg = t(d - b); const h = Math.sin(dl / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(dg / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
async function fetchRetry(url, opt = {}, kind = 'json', tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { ...opt, headers: { ...UA, ...(opt.headers || {}) }, signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return kind === 'json' ? await r.json() : await r.text();
    } catch (e) { if (i === tries - 1) throw e; await sleep(700 * (i + 1)); }
  }
}
async function pool(items, n, fn) { const out = new Array(items.length); let k = 0; await Promise.all(Array.from({ length: n }, async () => { while (k < items.length) { const i = k++; out[i] = await fn(items[i], i); } })); return out; }

// ── 앱 코드 로드 ───────────────────────────────────────────────
const fd = await import(pathToFileURL(path.join(ROOT, 'src/constants/fishingData.js')).href);
const { ALL_FISHING_POINTS, getPointSpecificData, KHOA_OBSERVATORIES } = fd;
const marineSrc = fs.readFileSync(path.join(ROOT, 'src/api/marineApi.js'), 'utf8');
const REAL_KHOA_STATIONS = eval(marineSrc.match(/REAL_KHOA_STATIONS\s*=\s*(\[[\s\S]*?\]);/)[1]);
const syncSrc = fs.readFileSync(path.join(ROOT, 'scripts/syncTides.mjs'), 'utf8');
const BADATIME_MAP = Object.fromEntries([...syncSrc.match(/BADATIME_MAP\s*=\s*\{([\s\S]*?)\};/)[1].matchAll(/'(DT_\d+)'\s*:\s*(\d+)/g)].map(m => [m[1], +m[2]]));

// marineApi.getKhoaObsCode 재현
function getKhoaObsCode(code) {
  if (code && code.startsWith('KHOA_')) return { id: code.replace('KHOA_', ''), dist: 0 };
  const s = KHOA_OBSERVATORIES.find(x => x.id === code);
  if (!s) return { id: code, dist: null };
  let best = REAL_KHOA_STATIONS[0], md = Infinity;
  for (const st of REAL_KHOA_STATIONS) { const d = haversine(s.lat, s.lng, st.lat, st.lng); if (d < md) { md = d; best = st; } }
  return { id: best.id, dist: md, name: best.name };
}

// ── 바다타임 ───────────────────────────────────────────────────
const kst = new Date(Date.now() + 9 * 3600000);
const TODAY = kst.getUTCDate();
const YMD = `${kst.getUTCFullYear()}${String(kst.getUTCMonth() + 1).padStart(2, '0')}${String(TODAY).padStart(2, '0')}`;
const btPageCache = new Map(), btSearchCache = new Map();
function parseBtTide(html) {
  const m = html.match(/동경\s*(\d+):(\d+)\s*북위\s*(\d+):(\d+)/);
  const lng = m ? +m[1] + +m[2] / 60 : null, lat = m ? +m[3] + +m[4] / 60 : null;
  const name = ((html.match(/<title>\s*([^<]*)/i) || [])[1] || '').split(/[ ,-]/)[0];
  const days = {};
  for (const tr of html.split(/<tr[^>]*class="day-row"[^>]*>/).slice(1)) {
    const seg = tr.split('</tr>')[0];
    const day = +((seg.match(/id="week"[^>]*>\s*(\d{1,2})\(/) || [])[1]);
    if (!day) continue;
    const phase = ((seg.match(/<div class="tide-text">\s*<b>\s*([^<]*?)\s*<\/b>/) || [])[1] || '').replace(/\s+/g, '');
    const grab = cls => { const cell = (seg.match(new RegExp('<td class="' + cls + '"[^>]*>([\\s\\S]*?)</td>')) || [])[1] || ''; return [...cell.matchAll(/<b>\s*(\d{2}:\d{2})/g)].map(x => x[1]); };
    days[day] = { phase, highs: grab('manjo'), lows: grab('ganjo') };
  }
  return { lat, lng, name, days };
}
async function btPage(idx) {
  if (btPageCache.has(idx)) return btPageCache.get(idx);
  const p = (async () => { try { return { idx, ...parseBtTide(await fetchRetry(`https://www.badatime.com/${idx}/tide`, {}, 'text')) }; } catch (e) { return { idx, error: e.message }; } })();
  btPageCache.set(idx, p); return p;
}
async function btSearch(kw) {
  if (btSearchCache.has(kw)) return btSearchCache.get(kw);
  let r = [];
  try { r = JSON.parse((await fetchRetry('https://www.badatime.com/r/autoCompleteJson_260108.jsp?keyword=' + encodeURIComponent(kw), { headers: { Referer: 'https://www.badatime.com/', 'X-Requested-With': 'XMLHttpRequest' } }, 'text')).trim() || '[]'); } catch { r = []; }
  btSearchCache.set(kw, r); return r;
}
function nameKeywords(name) {
  const base = (name || '').replace(/\(.*?\)/g, ' ').trim();
  const strip = w => w.replace(/(방파제|갯바위|선착장|해수욕장|해변|항구|포구|등대|일대|인근|권|항|포|도)$/, '');
  const set = new Set();
  for (const w of base.split(/\s+/).filter(Boolean)) { if (/방파제|갯바위|선착장|해수욕장|해변|등대/.test(w)) continue; set.add(w); const s = strip(w); if (s.length >= 2) set.add(s); }
  return [...set].filter(w => w.length >= 2).sort((a, b) => b.length - a.length);
}
async function findBadatime(pt) {
  const cands = [];
  for (const kw of nameKeywords(pt.name).slice(0, 4)) { for (const it of (await btSearch(kw)).slice(0, 6)) cands.push(it.idx); if (cands.length >= 6) break; }
  let best = null;
  for (const idx of [...new Set(cands)].slice(0, 8)) {
    const pg = await btPage(idx);
    if (!pg.lat || !pg.days?.[TODAY]) continue;
    const d = haversine(pt.lat, pt.lng, pg.lat, pg.lng);
    if (!best || d < best.dist) best = { ...pg, dist: d };
  }
  return best;
}

// ── 비교 유틸 ─────────────────────────────────────────────────
const toMin = s => +s.slice(0, 2) * 60 + +s.slice(3, 5);
// 자정 경계(23:53 ↔ 00:05)를 12분 차이로 계산하기 위해 원형 거리 사용
const circ = (a, b) => { const d = Math.abs(toMin(a) - toMin(b)); return Math.min(d, 1440 - d); };
function cmpList(bt, app) {
  if (!bt?.length && !app?.length) return { max: 0, miss: 0 };
  if (!bt?.length || !app?.length) return { max: null, miss: Math.max(bt?.length || 0, app?.length || 0) };
  let max = 0, miss = 0;
  for (const t of bt) { const d = Math.min(...app.map(a => circ(a, t))); max = Math.max(max, d); if (d > 60) miss++; }
  for (const t of app) { const d = Math.min(...bt.map(a => circ(a, t))); max = Math.max(max, d); if (d > 60) miss++; }
  return { max, miss };
}
function cmpTide(bt, app) {
  if (!bt || !app) return { grade: 'N/A', max: null };
  const h = cmpList(bt.highs, app.highs), l = cmpList(bt.lows, app.lows);
  const max = (h.max == null || l.max == null) ? null : Math.max(h.max, l.max);
  const miss = h.miss + l.miss;
  const grade = max == null ? 'BAD' : (max <= 15 && !miss) ? 'OK' : (max <= 40 && !miss) ? 'WARN' : 'BAD';
  return { grade, max, miss };
}
const normPhase = s => String(s || '').replace(/\(.*?\)/g, '').replace(/\s+/g, '');
const cleanTimes = a => (a || []).filter(t => /^\d{2}:\d{2}$/.test(t || '')).sort();

// ── 포인트 수집 ───────────────────────────────────────────────
const [overrides, customs] = await Promise.all([fetchRetry(`${API}/api/spot-location-overrides`).catch(() => ({})), fetchRetry(`${API}/api/custom-points`).catch(() => [])]);
const statics = ALL_FISHING_POINTS.filter(p => p.type !== '민물' && p.obsCode && !(overrides[String(p.id)]?.isDeleted))
  .map(p => { const o = overrides[String(p.id)]; return { ...p, ...(o ? { lat: o.lat, lng: o.lng, name: o.name || p.name } : {}), src: 'static' }; });
const customP = (Array.isArray(customs) ? customs : []).filter(c => c.lat && c.lng && !c.isDeleted).map(c => ({ id: c.id, name: c.name, region: c.region, type: c.type, lat: +c.lat, lng: +c.lng, obsCode: c.obsCode || null, fish: c.fish, src: 'custom' }));
const points = [...statics, ...customP];
log(`[TideAudit] KST ${kst.toISOString().slice(0, 16)} / 바다 포인트 ${points.length}개 (정적 ${statics.length} + 커스텀 ${customP.length}) / API=${API}`);

// ── 1단계: 관측소(21개) 단위 근본 원인 분석 ──────────────────────
const stationIds = [...new Set(points.map(p => p.obsCode).filter(Boolean))];
const stationInfo = {};
await pool(stationIds, 4, async sid => {
  const khoa = getKhoaObsCode(sid);
  const obs = KHOA_OBSERVATORIES.find(o => o.id === sid);
  const [khoaLive, prec, btStd] = await Promise.all([
    fetchRetry(`${API}/api/tide/obs?obsCode=${khoa.id}&date=${YMD}`).catch(e => ({ error: e.message })),
    fetchRetry(`${API}/api/weather/precision?stationId=${sid}`).catch(e => ({ error: e.message })),
    BADATIME_MAP[sid] ? btPage(BADATIME_MAP[sid]) : null,
  ]);
  const raw = khoaLive.rawData || [];
  const kh = { highs: cleanTimes(raw.filter(t => t.hl_code === 'H').map(t => (t.tph_time || '').slice(11, 16))), lows: cleanTimes(raw.filter(t => t.hl_code === 'L').map(t => (t.tph_time || '').slice(11, 16))) };
  const srv = prec.tide ? { phase: prec.tide.phase, highs: cleanTimes([prec.tide.high]), lows: cleanTimes([prec.tide.low]), src: prec._sources?.tide } : null;
  stationInfo[sid] = { sid, name: obs?.name, khoa, khoaLive: kh, khoaErr: khoaLive.error, srv, bt: btStd?.days?.[TODAY] ? { ...btStd.days[TODAY], name: btStd.name, idx: btStd.idx, lat: btStd.lat, lng: btStd.lng, distFromStation: obs ? haversine(obs.lat, obs.lng, btStd.lat, btStd.lng) : null } : null };
});
for (const sid of Object.keys(stationInfo)) {
  const s = stationInfo[sid];
  const staticTide = getPointSpecificData({ id: 0, name: s.name, region: '동해', lat: KHOA_OBSERVATORIES.find(o => o.id === sid)?.lat || 0, lng: 0, obsCode: sid }, 0).tide;
  s.static = { phase: staticTide.phase, highs: cleanTimes([staticTide.high, staticTide.high2]), lows: cleanTimes([staticTide.low, staticTide.low2]), isReal: !!staticTide.isReal };
}

// ── 2단계: 포인트별 대조 ──────────────────────────────────────
const rows = await pool(points, 4, async (pt, i) => {
  const row = { id: pt.id, name: pt.name, region: pt.region, src: pt.src, lat: pt.lat, lng: pt.lng, obsCode: pt.obsCode, flags: [] };
  if (!pt.obsCode) { row.flags.push('NO_OBSCODE'); }
  const st = pt.obsCode ? stationInfo[pt.obsCode] : null;
  const bt = await findBadatime(pt);
  row.bt = bt ? { idx: bt.idx, name: bt.name, dist: +bt.dist.toFixed(1), ...bt.days[TODAY] } : null;
  if (!row.bt || row.bt.dist > 20) { row.flags.push(row.bt ? `BT_FAR(${row.bt.dist}km)` : 'BT_NOMATCH'); }
  // A. 정적 바다타임 캐시 (실제 앱 함수)
  try {
    const t = getPointSpecificData({ ...pt }, 0).tide;
    row.A = { phase: t.phase, highs: cleanTimes([t.high, t.high2]), lows: cleanTimes([t.low, t.low2]), isReal: !!t.isReal };
  } catch (e) { row.A = null; }
  // B. 포인트 팝업: KHOA(매핑) 시각 + 서버 phase
  if (st) row.B = { phase: st.srv?.phase, highs: st.khoaLive.highs, lows: st.khoaLive.lows, khoaStation: st.khoa.id, khoaName: st.khoa.name, khoaDist: st.khoa.dist != null ? +st.khoa.dist.toFixed(1) : null, srvTideSrc: st.srv?.src };
  // C. 서버 폴백 시각
  if (st?.srv) row.C = { phase: st.srv.phase, highs: st.srv.highs, lows: st.srv.lows };
  const ok = row.bt && row.bt.dist <= 20;
  if (ok) {
    const btt = row.bt;
    row.cmp = {
      A_time: cmpTide(btt, row.A), B_time: cmpTide(btt, row.B), C_time: cmpTide(btt, row.C),
      A_phase: row.A ? normPhase(row.A.phase) === normPhase(btt.phase) : null,
      B_phase: row.B ? normPhase(row.B.phase) === normPhase(btt.phase) : null,
    };
  }
  process.stdout.write(`\r  진행 ${i + 1}/${points.length}  `);
  return row;
});
console.log('');

// ── 3단계: 15일 물때 단계(phase) 정합성 — 정적 캐시 vs 바다타임 ────────
const phaseDaily = {};
await pool(Object.keys(stationInfo), 3, async sid => {
  const s = stationInfo[sid]; const pg = BADATIME_MAP[sid] ? await btPage(BADATIME_MAP[sid]) : null; if (!pg?.days) return;
  const obs = KHOA_OBSERVATORIES.find(o => o.id === sid);
  const res = [];
  for (const d of Object.keys(pg.days).map(Number).sort((a, b) => a - b)) {
    if (d < TODAY) continue;
    const t = getPointSpecificData({ id: 0, name: s.name, region: '동해', lat: obs.lat, lng: obs.lng, obsCode: sid }, d - TODAY).tide;
    res.push({ day: d, bt: normPhase(pg.days[d].phase), app: normPhase(t.phase), timesOk: cmpTide(pg.days[d], { highs: cleanTimes([t.high, t.high2]), lows: cleanTimes([t.low, t.low2]) }).grade });
  }
  phaseDaily[sid] = res;
});

// ── 출력 ───────────────────────────────────────────────────────
const pad = (s, n) => { s = String(s ?? '-'); let w = 0; for (const ch of s) w += ch.charCodeAt(0) > 255 ? 2 : 1; return s + ' '.repeat(Math.max(0, n - w)); };
const T = a => (a && a.length) ? a.join('/') : '-';
log('\n══ [1] 관측소(21) 단위 — 오늘 ' + kst.toISOString().slice(0, 10) + ' ══');
log(pad('앱관측소', 10) + pad('명칭', 14) + pad('바다타임(캐시원본)', 34) + pad('A.정적캐시', 34) + pad('B.KHOA(팝업)', 34) + 'KHOA 매핑');
for (const sid of Object.keys(stationInfo)) {
  const s = stationInfo[sid];
  const f = x => x ? `${x.phase || '-'} H:${T(x.highs)} L:${T(x.lows)}` : '-';
  log(pad(sid, 10) + pad((s.name || '').slice(0, 6), 14) + pad(f(s.bt && { phase: s.bt.phase, highs: s.bt.highs, lows: s.bt.lows }), 34) + pad(f(s.static), 34) + pad(f({ phase: s.srv?.phase, highs: s.khoaLive.highs, lows: s.khoaLive.lows }), 34) + `${s.khoa.id}(${s.khoa.name || '?'}, ${s.khoa.dist != null ? s.khoa.dist.toFixed(0) : '?'}km) 서버tide=${s.srv?.src || '-'}`);
}
log('\n══ [2] 15일 물때 단계/시각 — 정적캐시 vs 바다타임 (불일치 일수 / 총일수) ══');
for (const sid of Object.keys(phaseDaily)) {
  const r = phaseDaily[sid]; const bad = r.filter(x => x.bt !== x.app);
  log(pad(sid, 10) + pad((stationInfo[sid].name || '').slice(0, 6), 14) + `단계불일치 ${bad.length}/${r.length}` + (bad.length ? '  예) ' + bad.slice(0, 4).map(x => `${x.day}일 BT=${x.bt} 앱=${x.app}`).join(', ') : '') + `  시각WARN/BAD ${r.filter(x => x.timesOk !== 'OK').length}`);
}
log('\n══ [3] 포인트별 대조(바다타임 지점 ≤20km) ══');
log(pad('ID', 20) + pad('포인트', 24) + pad('바다타임지점', 16) + pad('BT단계', 8) + pad('A단계', 10) + pad('B단계', 10) + pad('A시각', 14) + pad('B시각', 14) + '비고');
const sorted = rows.slice().sort((a, b) => (a.region || '').localeCompare(b.region || '') || a.lat - b.lat);
for (const r of sorted) {
  const c = r.cmp;
  const fl = [...r.flags];
  if (c) {
    if (c.A_phase === false) fl.push('A단계≠BT'); if (c.B_phase === false) fl.push('B단계≠BT');
    if (c.A_time.grade === 'BAD' || c.A_time.grade === 'WARN') fl.push('A시각' + c.A_time.grade);
    if (c.B_time.grade === 'BAD' || c.B_time.grade === 'WARN') fl.push('B시각' + c.B_time.grade);
  }
  r.finalFlags = fl;
  log(pad(String(r.id), 20) + pad((r.name || '').slice(0, 12), 24) + pad(r.bt ? `${(r.bt.name || '').slice(0, 5)}(${r.bt.dist}k)` : '-', 16) + pad(r.bt?.phase, 8) + pad(r.A?.phase, 10) + pad(r.B?.phase, 10) + pad(c ? `${c.A_time.grade}${c.A_time.max != null ? '(' + c.A_time.max + 'm)' : ''}` : '-', 14) + pad(c ? `${c.B_time.grade}${c.B_time.max != null ? '(' + c.B_time.max + 'm)' : ''}` : '-', 14) + (fl.length ? fl.join(',') : 'OK'));
}
const cmpRows = rows.filter(r => r.cmp);
const cnt = (f) => cmpRows.filter(f).length;
log(`\n[요약] 총 ${rows.length}개 | 바다타임 대조 가능 ${cmpRows.length} | obsCode 없음 ${rows.filter(r => r.flags.includes('NO_OBSCODE')).length}`);
log(`  A(정적캐시)  단계 불일치 ${cnt(r => r.cmp.A_phase === false)} / 시각 OK ${cnt(r => r.cmp.A_time.grade === 'OK')} WARN ${cnt(r => r.cmp.A_time.grade === 'WARN')} BAD ${cnt(r => r.cmp.A_time.grade === 'BAD')}`);
log(`  B(팝업/KHOA) 단계 불일치 ${cnt(r => r.cmp.B_phase === false)} / 시각 OK ${cnt(r => r.cmp.B_time.grade === 'OK')} WARN ${cnt(r => r.cmp.B_time.grade === 'WARN')} BAD ${cnt(r => r.cmp.B_time.grade === 'BAD')}`);
log(`  C(서버폴백)  시각 OK ${cnt(r => r.cmp.C_time.grade === 'OK')} WARN ${cnt(r => r.cmp.C_time.grade === 'WARN')} BAD ${cnt(r => r.cmp.C_time.grade === 'BAD')}`);
if (OUT) fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ at: kst.toISOString(), stationInfo, phaseDaily, rows }, null, 2), 'utf8');
