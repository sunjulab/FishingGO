/**
 * Fishing GO - Precision Weather & Tide Utility
 * Handles coordinate conversion, nearest station matching, and fishing index calculation.
 */

// 1. 전국 주요 관측소 데이터 — cctvMapping.js와 동기화된 16개 관측소
// ✅ WARN-WX1: 기존 동해 4개 → 전국 16개로 확장 (서해/남해/제주 정밀도 대폭 향상)
const OBSERVATION_STATIONS = [
  // 동해권
  { id: 'DT_0001', name: '강릉항 관측소',    lat: 37.7715, lng: 128.9488 },
  { id: 'DT_0002', name: '영덕 관측소',       lat: 36.5258, lng: 129.4126 },
  { id: 'DT_0003', name: '삼척항 관측소',     lat: 37.4490, lng: 129.1660 },
  { id: 'DT_0021', name: '속초항 관측소',     lat: 38.2045, lng: 128.5944 },
  { id: 'DT_0033', name: '묵호항 관측소',     lat: 37.5510, lng: 129.1158 },
  { id: 'DT_0036', name: '울산 정자 관측소',  lat: 35.6700, lng: 129.4640 },
  // 남해권
  { id: 'DT_0004', name: '부산 해운대 관측소', lat: 35.1601, lng: 129.1600 },
  { id: 'DT_0016', name: '통영항 관측소',      lat: 34.8544, lng: 128.4332 },
  { id: 'DT_0034', name: '거제 관측소',        lat: 34.8800, lng: 128.6200 },
  // 전남권
  { id: 'DT_0005', name: '여수항 관측소',      lat: 34.7440, lng: 127.7276 },
  { id: 'DT_0006', name: '목포항 관측소',      lat: 34.7900, lng: 126.3930 },
  { id: 'DT_0018', name: '완도 관측소',        lat: 34.3150, lng: 126.7554 },
  // 서해권
  { id: 'DT_0008', name: '보령 대천 관측소',   lat: 36.3150, lng: 126.5390 },
  { id: 'DT_0009', name: '군산항 관측소',      lat: 35.9820, lng: 126.7160 },
  // 제주권
  { id: 'DT_0010', name: '제주 한림 관측소',   lat: 33.4100, lng: 126.2580 },
  { id: 'DT_0011', name: '서귀포 관측소',      lat: 33.2460, lng: 126.5610 },
  { id: 'DT_0045', name: '제주 성산 관측소',   lat: 33.4580, lng: 126.9290 },
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
  const phases = ['1물', '2물', '3물', '4물', '5물', '6물', '7물(사리)', '8물', '9물', '10물', '11물', '12물', '13물(조금)', '14물(무시)', '15물'];
  const day = new Date(date).getDate() % 15;
  return phases[day];
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
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    // ✅ WARN-WC1: JSON.parse 실패(데이터 손상) 시 자동 삭제 후 null 반환
    try {
      const { timestamp, data } = JSON.parse(cached);
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp > threeDays) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      return data;
    } catch (e) {
      // JSON 파싱 실패 → 손상된 캐시 자동 제거
      localStorage.removeItem(cacheKey);
      return null;
    }
  }
};
