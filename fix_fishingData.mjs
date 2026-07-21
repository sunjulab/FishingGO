import fs from 'fs';

const content = fs.readFileSync('src/constants/fishingData.js', 'utf8');

// 1. Remove all obsCode: 'DT_xxxx' from the objects
let newContent = content.replace(/,\s*obsCode:\s*'[^']+'/g, '');

// 2. Add the KHOA_OBSERVATORIES and getNearestObservatory logic at the end
const additionalLogic = `

// ✅ KHOA 전국 주요 조위관측소 마스터 데이터 (위경도 포함)
// 향후 낚시 포인트가 무한히 추가되어도, 위경도 기반으로 가장 가까운 물때 데이터가 자동 매핑됩니다.
export const KHOA_OBSERVATORIES = [
  { id: 'DT_0001', name: '인천', lat: 37.4519, lng: 126.5922 },
  { id: 'DT_0002', name: '평택', lat: 36.9567, lng: 126.8206 },
  { id: 'DT_0004', name: '제주', lat: 33.5272, lng: 126.5431 },
  { id: 'DT_0005', name: '부산', lat: 35.0964, lng: 129.0353 },
  { id: 'DT_0006', name: '묵호', lat: 37.5489, lng: 129.1170 },
  { id: 'DT_0007', name: '목포', lat: 34.7797, lng: 126.3756 },
  { id: 'DT_0010', name: '서귀포', lat: 33.2400, lng: 126.5611 },
  { id: 'DT_0012', name: '속초', lat: 38.2134, lng: 128.6010 },
  { id: 'DT_0014', name: '통영', lat: 34.8281, lng: 128.4336 },
  { id: 'DT_0016', name: '여수', lat: 34.7456, lng: 127.7444 },
  { id: 'DT_0018', name: '군산', lat: 35.9756, lng: 126.5631 },
  { id: 'DT_0020', name: '울산', lat: 35.5028, lng: 129.3872 },
  { id: 'DT_0025', name: '보령', lat: 36.3217, lng: 126.4950 },
  { id: 'DT_0027', name: '완도', lat: 34.3164, lng: 126.7583 },
  { id: 'DT_0029', name: '거제도', lat: 34.7933, lng: 128.6253 }
];

// Haversine 거리 계산 함수 (단위: km)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 가장 가까운 조위관측소 반환
export function getNearestObservatory(lat, lng) {
  let minDistance = Infinity;
  let nearest = KHOA_OBSERVATORIES[0];
  for (const obs of KHOA_OBSERVATORIES) {
    const dist = getDistanceFromLatLonInKm(lat, lng, obs.lat, obs.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = obs;
    }
  }
  return nearest;
}

// ✅ AUTO-MAPPING: 하드코딩 제거 후, 포인트 위치 기반으로 관측소 자동 매핑
SEA_FISHING_POINTS.forEach(p => {
  p.obsCode = getNearestObservatory(p.lat, p.lng).id;
});
SECRET_FISHING_POINTS.forEach(p => {
  p.obsCode = getNearestObservatory(p.lat, p.lng).id;
});
`;

newContent += additionalLogic;
fs.writeFileSync('src/constants/fishingData.js', newContent);
console.log('fishingData.js refactored successfully.');
