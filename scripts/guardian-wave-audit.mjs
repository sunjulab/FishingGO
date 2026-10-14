#!/usr/bin/env node
/**
 * guardian-wave-audit.mjs
 * 전 포인트 파고(wave) 전수조사 스크립트
 *
 *  1) 운영 서버의 모든 바다 포인트(정적 SEA_FISHING_POINTS + 좌표 오버라이드 + 커스텀 포인트)를 수집
 *  2) 앱과 동일한 경로(/api/weather/precision?stationId&lat&lng)로 파고를 조회
 *  3) Open-Meteo Marine 원시값(좌표 그대로) 조회 → 서버 변환 로직 검증
 *  4) 바다타임(badatime.com) 지점 3시간 예보 파고 + 기상청 앞바다 예보 범위와 대조
 *
 * 사용법: node scripts/guardian-wave-audit.mjs [--out report.json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const API = process.env.AUDIT_API || 'https://fishing-go-backend.onrender.com';
const OUT = (() => { const i = process.argv.indexOf('--out'); return i > 0 ? process.argv[i + 1] : null; })();
const UA = { 'User-Agent': 'Mozilla/5.0 (FishingGO wave audit)' };

const sleep = ms => new Promise(r => setTimeout(r, ms));
const haversine = (a, b, c, d) => {
  const R = 6371, t = x => x * Math.PI / 180;
  const dl = t(c - a), dg = t(d - b);
  const h = Math.sin(dl / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(dg / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
async function getJson(url, opt = {}, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { ...opt, headers: { ...UA, ...(opt.headers || {}) }, signal: AbortSignal.timeout(25000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) { if (i === tries - 1) throw e; await sleep(800 * (i + 1)); }
  }
}
async function getText(url, opt = {}, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { ...opt, headers: { ...UA, ...(opt.headers || {}) }, signal: AbortSignal.timeout(25000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.text();
    } catch (e) { if (i === tries - 1) throw e; await sleep(800 * (i + 1)); }
  }
}
async function pool(items, n, fn) {
  const out = new Array(items.length); let k = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (k < items.length) { const i = k++; out[i] = await fn(items[i], i); } }));
  return out;
}

// ── 1. 포인트 수집 ─────────────────────────────────────────────
function loadStaticSeaPoints() {
  const src = fs.readFileSync(path.join(ROOT, 'src/constants/fishingData.js'), 'utf8');
  const start = src.indexOf('const SEA_FISHING_POINTS');
  const end = src.indexOf('];', start);
  const block = src.slice(start, end);
  const pts = [];
  for (const m of block.matchAll(/\{\s*id:\s*(\d+)[^}]*?\}/g)) {
    const o = m[0];
    const g = k => (o.match(new RegExp(k + ":\\s*'([^']*)'")) || [])[1];
    const n = k => parseFloat((o.match(new RegExp(k + ':\\s*(-?[\\d.]+)')) || [])[1]);
    pts.push({ id: m[1], name: g('name'), region: g('region'), type: g('type'), lat: n('lat'), lng: n('lng'), obsCode: g('obsCode') || '' });
  }
  return pts;
}

// ── 2. 바다타임 ─────────────────────────────────────────────────
const btPageCache = new Map();
const btSearchCache = new Map();
async function btSearch(kw) {
  if (btSearchCache.has(kw)) return btSearchCache.get(kw);
  let res = [];
  try {
    const t = await getText('https://www.badatime.com/r/autoCompleteJson_260108.jsp?keyword=' + encodeURIComponent(kw), { headers: { Referer: 'https://www.badatime.com/', 'X-Requested-With': 'XMLHttpRequest' } });
    res = JSON.parse(t.trim() || '[]');
  } catch { res = []; }
  btSearchCache.set(kw, res);
  return res;
}
function parseBtPage(html, kstNow) {
  const ll = html.match(/LatLng\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
  const clean = html.replace(/<img[^>]*>/g, '').replace(/<[^>]+>/g, '|').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').replace(/(\|\s*)+/g, '|');
  const title = (html.match(/<title>\s*([^<]*)/i) || [])[1] || '';
  const mm = String(kstNow.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kstNow.getUTCDate()).padStart(2, '0');
  // 지점 3시간 예보 테이블
  const hourly = [];
  const di = clean.indexOf(`|${mm}.${dd}|날씨|`);
  if (di >= 0) {
    const seg = clean.slice(di, di + 3000);
    for (const m of seg.matchAll(/\|(\d{2})시\|(?:[^|]*\|){0,6}?([\d.]+) m\/s\|([\d.]+) m\|/g)) {
      const h = parseInt(m[1]);
      if (hourly.length && h <= hourly[hourly.length - 1].h) break;
      hourly.push({ h, wind: parseFloat(m[2]), wave: parseFloat(m[3]) });
    }
  }
  // 기상청 앞바다 예보 (오늘 오전/오후 범위)
  let zone = null;
  const zm = clean.match(/\|([가-힣]+(?:앞바다|먼바다))\|구분\|날씨\|풍향\|풍속\|파고\|(\d+)일\([^)]*\)\|오전\|(.*?)\|오후\|(.*?)\|\d+일\(/);
  if (zm) {
    const rng = s => { const r = s.match(/([\d.]+)-([\d.]+)\|?$/) || s.match(/([\d.]+)-([\d.]+)/g); if (!r) return null; const last = (Array.isArray(r) && r.length && typeof r[0] === 'string' && r[0].includes('-') && !r[1]?.match?.(/^\d/)) ? null : null; const all = [...s.matchAll(/(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/g)]; const w = all[all.length - 1]; return w ? [parseFloat(w[1]), parseFloat(w[2])] : null; };
    zone = { name: zm[1], day: parseInt(zm[2]), am: rng(zm[3]), pm: rng(zm[4]) };
  }
  return { lat: ll ? parseFloat(ll[1]) : null, lng: ll ? parseFloat(ll[2]) : null, title: title.split(' ')[0], hourly, zone };
}
async function btPage(idx, kstNow) {
  if (btPageCache.has(idx)) return btPageCache.get(idx);
  const p = (async () => {
    try { const html = await getText(`https://www.badatime.com/${idx}.html`); return { idx, ...parseBtPage(html, kstNow) }; }
    catch (e) { return { idx, error: e.message }; }
  })();
  btPageCache.set(idx, p);
  return p;
}
function interpHourly(hourly, hrFloat) {
  if (!hourly?.length) return null;
  let a = hourly[0], b = hourly[hourly.length - 1];
  for (let i = 0; i < hourly.length - 1; i++) if (hourly[i].h <= hrFloat && hourly[i + 1].h >= hrFloat) { a = hourly[i]; b = hourly[i + 1]; break; }
  if (a === b || b.h === a.h) return a.wave;
  const f = (hrFloat - a.h) / (b.h - a.h);
  return +(a.wave + (b.wave - a.wave) * f).toFixed(2);
}
function nameKeywords(name) {
  const base = (name || '').replace(/\(.*?\)/g, ' ').trim();
  const words = base.split(/\s+/).filter(Boolean);
  const strip = w => w.replace(/(방파제|갯바위|선착장|해수욕장|해변|항구|포구|등대|일대|인근|권|항|포|도)$/, '');
  const set = new Set();
  for (const w of words) { if (/방파제|갯바위|선착장|해수욕장|해변|등대/.test(w)) continue; set.add(w); const s = strip(w); if (s.length >= 2) set.add(s); }
  // 긴 단어 우선 (예: 모슬포항 > 제주)
  return [...set].filter(w => w.length >= 2).sort((x, y) => y.length - x.length);
}
async function findBadatime(pt, kstNow) {
  const cands = [];
  for (const kw of nameKeywords(pt.name).slice(0, 4)) {
    const r = await btSearch(kw);
    for (const it of r.slice(0, 6)) cands.push(it.idx);
    if (cands.length >= 6) break;
  }
  let best = null;
  for (const idx of [...new Set(cands)].slice(0, 8)) {
    const pg = await btPage(idx, kstNow);
    if (!pg.lat || !pg.hourly?.length) continue;
    const d = haversine(pt.lat, pt.lng, pg.lat, pg.lng);
    if (!best || d < best.dist) best = { ...pg, dist: d };
  }
  return best;
}

// ── 3. Open-Meteo 원시값 ───────────────────────────────────────
async function openMeteoRaw(lat, lng, hr) {
  try {
    const j = await getJson(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=wave_height,swell_wave_height,swell_wave_period&timezone=Asia%2FSeoul&forecast_days=1`);
    return { wh: j.hourly?.wave_height?.[hr] ?? null, swh: j.hourly?.swell_wave_height?.[hr] ?? null, swp: j.hourly?.swell_wave_period?.[hr] ?? null, gridLat: j.latitude, gridLng: j.longitude };
  } catch (e) { return { error: e.message }; }
}

// ── main ───────────────────────────────────────────────────────
(async () => {
  const kstNow = new Date(Date.now() + 9 * 3600000);
  const hr = kstNow.getUTCHours();
  const hrFloat = hr + kstNow.getUTCMinutes() / 60;
  console.log(`[WaveAudit] KST ${kstNow.toISOString().slice(0, 16)}  API=${API}`);

  const [overrides, customs] = await Promise.all([
    getJson(`${API}/api/spot-location-overrides`).catch(() => ({})),
    getJson(`${API}/api/custom-points`).catch(() => []),
  ]);
  const statics = loadStaticSeaPoints()
    .filter(p => !(overrides[p.id]?.isDeleted))
    .map(p => overrides[p.id] ? { ...p, lat: overrides[p.id].lat, lng: overrides[p.id].lng, name: overrides[p.id].name || p.name, src: 'static+ov' } : { ...p, src: 'static' });
  const custom = (Array.isArray(customs) ? customs : []).filter(c => c.lat && c.lng && !c.isDeleted)
    .map(c => ({ id: c.id, name: c.name, region: c.region, type: c.type, lat: +c.lat, lng: +c.lng, obsCode: c.obsCode || '', src: 'custom' }));
  const points = [...statics, ...custom];
  console.log(`[WaveAudit] 바다 포인트 ${points.length}개 (정적 ${statics.length} / 커스텀 ${custom.length})`);

  const rows = await pool(points, 4, async (pt, i) => {
    const row = { ...pt };
    try {
      const d = await getJson(`${API}/api/weather/precision?stationId=${encodeURIComponent(pt.obsCode || '')}&lat=${pt.lat}&lng=${pt.lng}`);
      row.appWave = d?.wave?.coastal != null ? parseFloat(d.wave.coastal) : null;
      row.appSwell = d?.wave?.swell ?? null;
      row.appOuter = d?.wave?.outerSeaWave ?? null;
      row.appWaveSrc = d?._sources?.wave || '(none)';
      row.appStation = d?.stationId || '';
    } catch (e) { row.appError = e.message; }
    row.om = await openMeteoRaw(pt.lat, pt.lng, hr);
    const bt = await findBadatime(pt, kstNow);
    if (bt) {
      row.bt = { idx: bt.idx, name: bt.title, dist: +bt.dist.toFixed(1), wave: interpHourly(bt.hourly, hrFloat), zone: bt.zone };
    }
    process.stdout.write(`\r  진행 ${i + 1}/${points.length}   `);
    return row;
  });
  console.log('');

  // ── 판정 ──
  const zoneNow = z => z ? (hr < 12 ? z.am : z.pm) : null;
  for (const r of rows) {
    const flags = [];
    if (r.appError) flags.push('API_ERROR');
    else if (r.appWave == null || isNaN(r.appWave)) flags.push('NO_WAVE');
    if (!r.appError && r.appWaveSrc !== 'OPENMETEO_POINT') flags.push('NOT_PINPOINT(' + r.appWaveSrc + ')');
    if (r.om && !r.om.error && r.om.wh == null) flags.push('OM_LAND_CELL');
    const btOk = r.bt && r.bt.dist <= 20 && r.bt.wave != null;
    if (!btOk) flags.push(r.bt ? `BT_FAR(${r.bt.dist}km)` : 'BT_NOMATCH');
    if (btOk && r.appWave != null) {
      r.diff = +(r.appWave - r.bt.wave).toFixed(2);
      if (Math.abs(r.diff) >= 0.5 && (Math.abs(r.diff) / Math.max(r.bt.wave, 0.3)) >= 0.5) flags.push(r.diff > 0 ? 'OVER' : 'UNDER');
    }
    const z = zoneNow(r.bt?.zone);
    if (z && r.appWave != null) { r.zoneRange = z; if (r.appWave > z[1] + 0.5) flags.push('ABOVE_KMA_ZONE'); }
    r.flags = flags;
  }

  // ── 출력 ──
  const pad = (s, n) => { s = String(s ?? '-'); let w = 0; for (const ch of s) w += ch.charCodeAt(0) > 255 ? 2 : 1; return s + ' '.repeat(Math.max(0, n - w)); };
  console.log('\n' + pad('ID', 20) + pad('포인트', 26) + pad('권역', 6) + pad('앱파고', 8) + pad('OM원시', 8) + pad('너울', 6) + pad('바다타임', 9) + pad('BT지점', 16) + pad('차이', 7) + pad('KMA앞바다', 11) + '판정');
  for (const r of rows.sort((a, b) => (a.region || '').localeCompare(b.region || '') || a.lat - b.lat)) {
    const z = r.zoneRange ? `${r.zoneRange[0]}-${r.zoneRange[1]}` : '-';
    console.log(pad(r.id, 20) + pad((r.name || '').slice(0, 12), 26) + pad(r.region, 6) + pad(r.appWave ?? 'ERR', 8) + pad(r.om?.wh ?? 'null', 8) + pad(r.om?.swh ?? '-', 6) + pad(r.bt?.wave ?? '-', 9) + pad(r.bt ? `${(r.bt.name || '').slice(0, 5)}(${r.bt.dist}k)` : '-', 16) + pad(r.diff ?? '-', 7) + pad(z, 11) + (r.flags.length ? r.flags.join(',') : 'OK'));
  }
  const cnt = f => rows.filter(r => r.flags.some(x => x.startsWith(f))).length;
  const cmp = rows.filter(r => r.diff != null);
  const mae = cmp.length ? (cmp.reduce((a, r) => a + Math.abs(r.diff), 0) / cmp.length).toFixed(2) : '-';
  const bias = cmp.length ? (cmp.reduce((a, r) => a + r.diff, 0) / cmp.length).toFixed(2) : '-';
  const byRegion = {};
  for (const r of cmp) { (byRegion[r.region] ||= []).push(r.diff); }
  console.log(`\n[요약] 총 ${rows.length} | API오류 ${cnt('API_ERROR')} | 파고없음 ${cnt('NO_WAVE')} | 핀포인트미적용 ${cnt('NOT_PINPOINT')} | OM육지격자 ${cnt('OM_LAND_CELL')}`);
  console.log(`[바다타임 대조] 비교가능 ${cmp.length} | MAE ${mae}m | 평균편향 ${bias}m | 과대 ${cnt('OVER')} | 과소 ${cnt('UNDER')} | KMA앞바다 상한초과 ${cnt('ABOVE_KMA_ZONE')} | 매칭실패/원거리 ${cnt('BT_')}`);
  for (const [rg, a] of Object.entries(byRegion)) console.log(`   - ${rg}: n=${a.length} 편향 ${(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2)}m  MAE ${(a.reduce((x, y) => x + Math.abs(y), 0) / a.length).toFixed(2)}m`);
  if (OUT) { fs.writeFileSync(OUT, JSON.stringify({ at: kstNow.toISOString(), rows }, null, 2)); console.log('saved', OUT); }
})();
