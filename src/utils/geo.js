/**
 * 기상청 단기예보(동네예보) 격자 좌표 변환 유틸리티 함수
 *
 * @param {'toXY'|'toLatLng'} code - 변환 방향
 *   - 'toXY'    : WGS84 위경도 (lat, lng) → 기상청 격자 (x, y)
 *   - 'toLatLng': 기상청 격자 (x, y)       → WGS84 위경도 (lat, lng)
 * @param {number} v1 - toXY: 위도(lat) / toLatLng: 격자 X
 * @param {number} v2 - toXY: 경도(lng) / toLatLng: 격자 Y
 * @returns {{ lat?, lng?, x?, y? }}
 *
 * @example
 * // 위경도 → 격자
 * const { x, y } = dfs_xy_conv('toXY', 37.5665, 126.9780); // 서울
 *
 * // 격자 → 위경도 (역변환)
 * const { lat, lng } = dfs_xy_conv('toLatLng', 60, 127);
 */

const RE = 6371.00877; // 지구 반경(km)
const GRID = 5.0; // 격자 간격(km)
const SLAT1 = 30.0; // 투영 위도1(degree)
const SLAT2 = 60.0; // 투영 위도2(degree)
const OLON = 126.0; // 기준점 경도(degree)
const OLAT = 38.0; // 기준점 위도(degree)
const XO = 43; // 기준점 X좌표(GRID)
const YO = 136; // 기점 Y좌표(GRID)

// ENH5-C3: 투영 상수 모듈 레벨 1회 계산 캐싱 — dfs_xy_conv 반복 호출 시 재계산 비용 제거
const _DEGRAD = Math.PI / 180.0;
const _RADDEG = 180.0 / Math.PI;
const _re = RE / GRID;
const _slat1 = SLAT1 * _DEGRAD;
const _slat2 = SLAT2 * _DEGRAD;
const _olon = OLON * _DEGRAD;
const _olat = OLAT * _DEGRAD;

// ✅ 10TH-C1: let 재할당 → 계산 단계 const 분리 (가독성 개선)
// _sn: 원추 투영 상수 (람베르트 정형원추도법)
const _snRatio = Math.tan(Math.PI * 0.25 + _slat2 * 0.5) / Math.tan(Math.PI * 0.25 + _slat1 * 0.5);
const _sn = Math.log(Math.cos(_slat1) / Math.cos(_slat2)) / Math.log(_snRatio);
// _sf: 축척 인수
const _sfBase = Math.tan(Math.PI * 0.25 + _slat1 * 0.5);
const _sf = Math.pow(_sfBase, _sn) * Math.cos(_slat1) / _sn;
// _ro: 기준점 투영 반경
const _roBase = Math.tan(Math.PI * 0.25 + _olat * 0.5);
const _ro = _re * _sf / Math.pow(_roBase, _sn);

export function dfs_xy_conv(code, v1, v2) {
  const rs = {};

  if (code === 'toXY') {
    rs['lat'] = v1;
    rs['lng'] = v2;

    let ra = Math.tan(Math.PI * 0.25 + v1 * _DEGRAD * 0.5);
    ra = _re * _sf / Math.pow(ra, _sn);
    let theta = v2 * _DEGRAD - _olon;

    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= _sn;

    rs['x'] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
    rs['y'] = Math.floor(_ro - ra * Math.cos(theta) + YO + 0.5);

  } else if (code === 'toLatLng') {
    const xn = v1 - XO;
    const yn = _ro - (v2 - YO);

    let ra = Math.sqrt(xn * xn + yn * yn);
    if (_sn < 0) ra = -ra;

    let alat = Math.pow((_re * _sf) / ra, 1.0 / _sn);
    alat = 2.0 * Math.atan(alat) - Math.PI * 0.5;

    let theta = 0;
    if (Math.abs(xn) <= 0.0) {
      theta = 0.0;
    } else {
      if (Math.abs(yn) <= 0.0) {
        theta = Math.PI * 0.5;
        if (xn < 0) theta = -theta;
      } else {
        theta = Math.atan2(xn, yn);
      }
    }

    const alon = theta / _sn + _olon;

    rs['lat'] = parseFloat((alat * _RADDEG).toFixed(6));
    rs['lng'] = parseFloat((alon * _RADDEG).toFixed(6));
  }

  return rs;
}

