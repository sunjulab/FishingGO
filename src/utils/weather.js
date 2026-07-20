/**
 * Fishing GO - Precision Weather & Tide Utility
 * Handles coordinate conversion, nearest station matching, and fishing index calculation.
 */

// 1. 전국 주요 관측소 데이터 — cctvMapping.js와 동기화된 16개 관측소
// ✅ WARN-WX1: 기존 동해 4개 → 전국 16개로 확장 (서해/남해/제주 정밀도 대폭 향상)
const OBSERVATION_STATIONS = [
  // 동해권
  { id: 'DT_0099', name: '고성 가진항 관측소', lat: 38.3740, lng: 128.5120 },
  { id: 'DT_0021', name: '속초 영금정 관측소', lat: 38.2048, lng: 128.5925 },
  { id: 'DT_0001', name: '강릉 안목항 관측소', lat: 37.7734, lng: 128.9406 },
  { id: 'DT_0033', name: '동해 묵호 관측소',   lat: 37.5484, lng: 129.1128 },
  { id: 'DT_0003', name: '삼척항 관측소',     lat: 37.4432, lng: 129.1639 },
  { id: 'DT_0002', name: '울진 후포 관측소',   lat: 36.6764, lng: 129.4627 },
  { id: 'DT_0036', name: '경주 감포 관측소',   lat: 35.8188, lng: 129.5012 },
  // 남해권
  { id: 'DT_0004', name: '부산 해운대 관측소', lat: 35.1586, lng: 129.1603 },
  { id: 'DT_0034', name: '거제 지세포 관측소', lat: 34.8101, lng: 128.7021 },
  { id: 'DT_0016', name: '통영 도남 관측소',   lat: 34.8512, lng: 128.4342 },
  { id: 'DT_0005', name: '여수 국동항 관측소', lat: 34.7462, lng: 127.7516 },
  { id: 'DT_0014', name: '광양만 관측소',      lat: 34.9123, lng: 127.7268 },
  { id: 'DT_0018', name: '완도항 관측소',      lat: 34.3108, lng: 126.7575 },
  { id: 'DT_0006', name: '목포항 관측소',      lat: 34.7891, lng: 126.3776 },
  // 서해권
  { id: 'DT_0007', name: '인천 연안부두 관측소', lat: 37.4643, lng: 126.6188 },
  { id: 'DT_0030', name: '태안 마도 관측소',   lat: 36.7265, lng: 126.1474 },
  { id: 'DT_0008', name: '보령 대천항 관측소', lat: 36.3523, lng: 126.5078 },
  { id: 'DT_0009', name: '군산 비응항 관측소', lat: 35.9697, lng: 126.5621 },
  // 제주권
  { id: 'DT_0010', name: '제주 한림 관측소',   lat: 33.4139, lng: 126.2636 },
  { id: 'DT_0011', name: '서귀포 외돌개 관측소', lat: 33.2460, lng: 126.5623 },
  { id: 'DT_0045', name: '성산포항 관측소',    lat: 33.4714, lng: 126.9248 },
];

// ✅ 3RD-B9: 변환 상수 캐싱 — geo.js _DEGRAD 패턴과 동일, 4회 반복 계산 제거
const RAD = Math.PI / 180;

/**
 * 하버사인 공식(Haversine Formula)으로 두 좌표 사이의 거리(km) 계산
 */
export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * RAD;
  const dLon = (lon2 - lon1) * RAD;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 현재 GPS 위치기반 가장 가까운 관측소 매칭
 */
export function findNearestStation(userLat, userLng) {
  // ENH5-B7: Array.reduce() 1-pass 리팩토링 — forEach + 외부 변수 패턴 제거
  const nearest = OBSERVATION_STATIONS.reduce((best, station) => {
    const dist = getDistance(userLat, userLng, station.lat, station.lng);
    return dist < best.distance ? { ...station, distance: dist } : best;
  }, { distance: Infinity });

  return { ...nearest, distance: nearest.distance.toFixed(2) };
}

/**
 * \ub099\uc2dc \uc9c0\uc218(Fishing Index) \uc0b0\ucd9c \uc54c\uace0\ub9ac\uc998 (\uc790\uccb4 \uc2dc\ubbac\ub808\uc774\uc158)
 * \ud48d\uc18d, \ud30c\uace0, \uae30\uc555 \ubcc0\ud654\ub97c \uc885\ud569\ud558\uc5ec 1~5\uc810 \uc0b0\ucd9c
 * \u2705 19TH-C3: TODO \u2014 evaluator.js\uc758 calculateFishingScore(0~100)'\uc640 \ub2e4\ub978 \uc2a4\ucf00\uc77c(1~5)\uc774\uc9c0\ub9cc \uc720\uc0ac \ub85c\uc9c1 \uc911\ubcf5
 * \uc7a5\uae30\uc801\uc73c\ub85c evaluator.js \uc2a4\ucf54\ub9c1\uc744 5\uc810 \uc2a4\ucf00\uc77c\ub85c \ub9c4\ud551\ud558\uc5ec \ub2e8\uc77c \uc18c\uc2a4\ub85c \ud1b5\ud569 \uad8c\uc7a5
 */
export function calculateFishingIndex(wind, wave, pressureTrend) {
  let score = 5;
  
  // 풍속 페널티 (10m/s 이상 시 급격한 하락)
  if (wind > 12) score -= 3;
  else if (wind > 8) score -= 1.5;
  else if (wind > 5) score -= 0.5;

  // 파고 페널티
  if (wave > 2.0) score -= 2;
  else if (wave > 1.0) score -= 1;

  // 기압 변화 (하강 시 활성도 저하)
  if (pressureTrend === 'down') score -= 1;
  else if (pressureTrend === 'up') score += 0.5;

  // ✅ BUG-50: .toFixed(1)는 string 반환 → Math.max/min 비교 전 parseFloat 명시 변환
  return Math.max(1, Math.min(5, parseFloat(score.toFixed(1))));
}

/**
 * 15물때(Tide Cycle) 계산기 (Simple Mock)
 */
export function getTidePhase(date) {
  // ✅ FIX-LUNAR v2: 바다타임 비교 검증 완료 기준일 재보정 (2026-06-26 = 신월)
  const anchor = new Date('2026-06-26T00:00:00+09:00');
  const anchorLunar = 29;
  const diffFromAnchor = (new Date(date).getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24);
  const rawLunar = anchorLunar + diffFromAnchor;
  const cycled = ((rawLunar - 1) % 29.530588 + 29.530588) % 29.530588;
  const lunarDay = Math.floor(cycled) + 1;
  const lunarToTide = (day) => {
    if (day >= 28) return day - 27;
    if (day >= 14) return day - 13;
    return ((day + 2 - 1) % 15) + 1;
  };
  const tideNum = lunarToTide(lunarDay);
  const phaseMap = { 7: '7물(사리)', 8: '8물(사리)', 9: '9물', 13: '13물(조금)', 14: '14물(무시)', 15: '15물' };
  return phaseMap[tideNum] || `${tideNum}물`;
}

/**
 * 로컬 캐싱 (오프라인 모드 대응 3일치 데이터)
 */
export const weatherCache = {
  save: (stationId, data) => {
    const cacheKey = `fishing_go_cache_${stationId}`;
    const payload = { timestamp: Date.now(), data };
    try {
      localStorage.setItem(cacheKey, JSON.stringify(payload));
    } catch (e) {
      // localStorage 용량 초과 등 저장 실패 — 무시
      if (!import.meta.env.PROD) console.warn('[weatherCache] 저장 실패:', e.message);
    }
  },
  get: (stationId) => {
    const cacheKey = `fishing_go_cache_${stationId}`;
    // ✅ FIX-STORAGE: getItem + JSON.parse 모두 단일 try/catch로 보호
    // — Safari 개인정보 보호 모드 등에서 getItem()이 StorageError를 던질 수 있음 (WARN-WC1)
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;
      const { timestamp, data } = JSON.parse(cached);
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp > threeDays) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      return data;
    } catch {
      // JSON 파싱 실패 또는 Storage 접근 거부 → 손상된 캐시 자동 제거
      try { localStorage.removeItem(cacheKey); } catch { /* 삭제도 실패하면 무시 */ }
      return null;
    }
  }

};
