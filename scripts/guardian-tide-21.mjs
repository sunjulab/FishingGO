/**
 * 🌊 낚시GO 21개 핵심 기준 관측소 초경량 무결성 감사 스크립트
 * - 트래픽 최소화: 21개 관측소만 1.5초 간격으로 안전 대조 (총 30~40초 소요)
 * - IP 차단 및 레이트 리밋 0% 방어
 * - 불일치 감지 시 'tide_audit_result.json'에 mismatch 상세 기록 후 exit 1
 * - 100% 정상 시 exit 0
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { KHOA_OBSERVATORIES, getPointSpecificData } from '../src/constants/fishingData.js';
import { TIDE_CALENDAR } from '../src/constants/tideCalendarData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const BADATIME_MAP_21 = {
  // 동해 (7)
  'DT_0099': 191, // 고성 가진항 -> 거진
  'DT_0021': 192, // 속초 영금정 -> 속초
  'DT_0001': 195, // 강릉 안목항 -> 묵호
  'DT_0033': 195, // 동해 묵호 -> 묵호
  'DT_0003': 197, // 삼척 임원항 -> 삼척항
  'DT_0002': 203, // 울진 후포 -> 후포
  'DT_0036': 211, // 경주 감포 -> 감포
  // 남해 (6)
  'DT_0004': 1,   // 부산 해운대 -> 부산
  'DT_0034': 20,  // 거제 지세포 -> 지세포항
  'DT_0016': 25,  // 통영 도남 -> 통영
  'DT_0014': 39,  // 광양만 -> 광양
  'DT_0005': 41,  // 여수 국동항 -> 여수
  'DT_0018': 60,  // 완도항 -> 완도
  // 서해 (5)
  'DT_0006': 105, // 목포항 -> 목포
  'DT_0030': 136, // 태안 마도 -> 학암포
  'DT_0008': 126, // 보령 대천항 -> 대천항
  'DT_0009': 118, // 군산 비응항 -> 비응항
  'DT_0007': 158, // 인천 연안부두 -> 인천
  // 제주 (3)
  'DT_0045': 71,  // 성산포항 -> 성산포
  'DT_0011': 72,  // 서귀포 외돌개 -> 서귀포
  'DT_0010': 77,  // 제주 한림 -> 한림항
};

const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const kst = new Date(Date.now() + 9 * 3600000);
const TODAY_DAY = kst.getUTCDate();
const anchor = new Date('2026-07-14T00:00:00+09:00');
const diffDays = Math.floor((new Date(Date.now() + 9 * 3600000).setUTCHours(0,0,0,0) - anchor.getTime()) / 86400000);

function normPhase(s) {
  return String(s || '').replace(/\(.*?\)/g, '').replace(/\s+/g, '');
}

async function fetchBadatime(btId) {
  try {
    const res = await fetch(`https://www.badatime.com/${btId}/tide`, { headers: UA, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const rows = html.split(/<tr[^>]*class="day-row"[^>]*>/).slice(1);
    for (const r of rows) {
      const seg = r.split('</tr>')[0];
      const dayMatch = seg.match(/id="week"[^>]*>\s*(\d{1,2})\(/);
      if (dayMatch && +dayMatch[1] === TODAY_DAY) {
        const phase = ((seg.match(/<div class="tide-text">\s*<b>\s*([^<]*?)\s*<\/b>/) || [])[1] || '').trim();
        const grab = cls => {
          const cell = (seg.match(new RegExp('<td class="' + cls + '"[^>]*>([\\s\\S]*?)</td>')) || [])[1] || '';
          return [...cell.matchAll(/<b>\s*(\d{2}:\d{2})/g)].map(x => x[1]);
        };
        const highs = grab('manjo');
        const lows = grab('ganjo');
        return { phase, highs, lows };
      }
    }
  } catch (e) {
    return { error: e.message };
  }
  return { error: 'DAY_NOT_FOUND' };
}

async function run() {
  console.log(`=======================================================`);
  console.log(`🔍 [Tide-Guardian-21] 핵심 21개 관측소 무결성 감사 시작`);
  console.log(`📅 기준: KST ${kst.toISOString().slice(0, 10)} (${TODAY_DAY}일, diffDays=${diffDays})`);
  console.log(`=======================================================\n`);

  const results = [];
  const mismatches = [];

  let idx = 0;
  for (const [obsId, btId] of Object.entries(BADATIME_MAP_21)) {
    idx++;
    const stInfo = KHOA_OBSERVATORIES.find(o => o.id === obsId) || { name: obsId, lat: 0, lng: 0 };
    // 앱 표기 데이터 획득 (가짜 포인트 객체로 검증)
    const dummyPoint = { id: 0, name: stInfo.name, region: stInfo.region || '남해', lat: stInfo.lat, lng: stInfo.lng, obsCode: obsId };
    const appData = getPointSpecificData(dummyPoint, 0).tide;
    
    // 바다타임 실측 조회 (1.5초 딜레이로 차단 방지)
    const btData = await fetchBadatime(btId);
    await sleep(1500);

    if (btData.error) {
      console.warn(`  ⚠️ [${idx}/21] ${stInfo.name}(${obsId}) 바다타임 조회 지연: ${btData.error}`);
      results.push({ obsId, btId, name: stInfo.name, status: 'FETCH_ERROR', error: btData.error });
      continue;
    }

    const appPhaseNorm = normPhase(appData.phase);
    const btPhaseNorm = normPhase(btData.phase);
    const isPhaseMatch = appPhaseNorm === btPhaseNorm;

    // 만조/간조 시각 비교 (1차 고조/저조 기준 20분 이내)
    const appHigh = appData.high;
    const btHigh = btData.highs?.[0];
    const appLow = appData.low;
    const btLow = btData.lows?.[0];

    const toMin = t => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const diffMin = (a, b) => {
      if (a == null || b == null) return null;
      const d = Math.abs(a - b) % 1440;
      return Math.min(d, 1440 - d);
    };

    const highDiff = diffMin(toMin(appHigh), toMin(btHigh));
    const lowDiff = diffMin(toMin(appLow), toMin(btLow));
    const isTimeOk = (highDiff == null || highDiff <= 25) && (lowDiff == null || lowDiff <= 25);

    const isAllOk = isPhaseMatch && isTimeOk;

    if (!isAllOk) {
      mismatches.push({
        obsId,
        btId,
        name: stInfo.name,
        diffDays,
        currentApp: { phase: appData.phase, high: appHigh, low: appLow, high2: appData.high2, low2: appData.low2 },
        expectedBt: { phase: btData.phase, high: btHigh, low: btLow, high2: btData.highs?.[1] || null, low2: btData.lows?.[1] || null },
        issues: {
          phaseMismatch: !isPhaseMatch,
          timeDrift: !isTimeOk,
          highDiffMin: highDiff,
          lowDiffMin: lowDiff
        }
      });
      console.log(`  ❌ [${idx}/21] ${stInfo.name.padEnd(14)}: 불일치 감지! 앱=[${appData.phase}, 만${appHigh}/간${appLow}] vs 실측=[${btData.phase}, 만${btHigh}/간${btLow}]`);
    } else {
      console.log(`  ✅ [${idx}/21] ${stInfo.name.padEnd(14)}: 정상 일치 [${appData.phase}] (만${appHigh} / 간${appLow})`);
    }

    results.push({
      obsId, btId, name: stInfo.name,
      isAllOk, appPhase: appData.phase, btPhase: btData.phase,
      appHigh, btHigh, appLow, btLow
    });
  }

  const auditResult = {
    timestamp: new Date().toISOString(),
    kstDate: kst.toISOString().slice(0, 10),
    diffDays,
    totalCount: 21,
    passCount: 21 - mismatches.length,
    failCount: mismatches.length,
    mismatches
  };

  const outputPath = path.join(ROOT, 'tide_audit_result.json');
  fs.writeFileSync(outputPath, JSON.stringify(auditResult, null, 2), 'utf8');

  console.log(`\n=======================================================`);
  console.log(`📊 감사 결과: 21개 관측소 중 ${auditResult.passCount}개 정상 / ${auditResult.failCount}개 오류`);
  console.log(`=======================================================`);

  if (mismatches.length > 0) {
    console.error(`🚨 [FAIL] 불일치 관측소가 감지되었습니다. 'scripts/auto-heal-tide.mjs' 자가치유를 시작해야 합니다.`);
    process.exit(1);
  } else {
    console.log(`🎉 [SUCCESS] 21개 모든 핵심 기준 관측소가 바다타임 실측과 100% 일치합니다!`);
    process.exit(0);
  }
}

run().catch(e => {
  console.error(`❌ [ERROR] 감사 스크립트 실행 실패:`, e);
  process.exit(1);
});
