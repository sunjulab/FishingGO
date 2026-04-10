/**
 * Fishing GO - Precision Weather & Tide Utility
 * Handles coordinate conversion, nearest station matching, and fishing index calculation.
 */

// 1. 전국 주요 관측소 데이터 (Sample Mapping)
// 실제 서비스 시 국립해양조사원(KHOA) 및 기상청 관측소 마스터 테이블 사용
const OBSERVATION_STATIONS = [
  { id: 'DT_0001', name: '강릉항 관측소', lat: 37.7715, lng: 128.9488 },
  { id: 'DT_0002', name: '묵호항 관측소', lat: 37.5510, lng: 129.1158 },
  { id: 'DT_0003', name: '속초항 관측소', lat: 38.2045, lng: 128.5944 },
  { id: 'DT_0004', name: '부산항 관측소', lat: 35.1051, lng: 129.0436 },
];

/**
 * 하버사인 공식(Haversine Formula)으로 두 좌표 사이의 거리(km) 계산
 */
export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 현재 GPS 위치기반 가장 가까운 관측소 매칭
 */
export function findNearestStation(userLat, userLng) {
  let nearest = null;
  let minDistance = Infinity;

  OBSERVATION_STATIONS.forEach(station => {
    const dist = getDistance(userLat, userLng, station.lat, station.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = station;
    }
  });

  return { ...nearest, distance: minDistance.toFixed(2) };
}

/**
 * 낚시 지수(Fishing Index) 산출 알고리즘 (자체 시뮬레이션)
 * 풍속, 파고, 기압 변화를 종합하여 1~5점 산출
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

  return Math.max(1, Math.min(5, score.toFixed(1)));
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
    localStorage.setItem(cacheKey, JSON.stringify(payload));
  },
  get: (stationId) => {
    const cacheKey = `fishing_go_cache_${stationId}`;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const { timestamp, data } = JSON.parse(cached);
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > threeDays) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return data;
  }
};
