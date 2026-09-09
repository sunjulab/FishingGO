// ✅ TIDE-API-REPLACE: 공공데이터포털 국립해양조사원 3종 API 통합
// 1. 조석예보(고·저조)  — https://apis.data.go.kr/1192136/tideFcstHghLw
// 2. 바다낚시지수       — https://apis.data.go.kr/1192136/fcstFishingv2
// 3. 조위관측소 실측 수온 — https://apis.data.go.kr/1192136/surveyWaterTemp
// 공통 인증키: VITE_TIDE_API_KEY 환경변수

const API_KEY = import.meta.env.VITE_TIDE_API_KEY || '';
if (!API_KEY && !import.meta.env.PROD) {
  console.warn('[marineApi] VITE_TIDE_API_KEY 미설정 — 해양 API 비활성화됨');
}

// Vite 프록시: 로컬은 /data-go-api, 프로덕션(웹)은 실제 도메인 직접 호출 (CORS 허용됨)
const PROXY = import.meta.env.PROD ? 'https://apis.data.go.kr' : '/data-go-api';

// ────────────────────────────────────────────
// 공통 fetch 헬퍼 — 10초 타임아웃 + 공공데이터포털 응답 파싱
// ────────────────────────────────────────────
async function fetchDataGo(endpoint, params) {
  // ✅ FIX-ENCODING: serviceKey를 URLSearchParams 외부에서 encodeURIComponent로 직접 처리
  // URLSearchParams는 '+' → ' '(공백)으로 인코딩 → 공공데이터포털 인증 실패 원인
  const extraParams = new URLSearchParams({
    numOfRows: '10',
    pageNo: '1',
    type: 'json',          // data.go.kr JSON 포맷 파라미터
    ...params,
  }).toString();
  // serviceKey는 별도 encodeURIComponent 처리 (특수문자 보존)
  const query = `serviceKey=${encodeURIComponent(API_KEY)}&${extraParams}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${PROXY}/${endpoint}?${query}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },  // JSON 명시 요청
    });

    if (!response.ok) {
      clearTimeout(timeoutId);
      if (!import.meta.env.PROD) console.warn(`[marineApi] ${endpoint} HTTP ${response.status}`);
      return null;
    }

    // ── 응답 텍스트 먼저 읽기 (XML 에러 처리용) ──────────────
    const text = await response.text();
    clearTimeout(timeoutId);

    // XML 에러 응답 감지 (data.go.kr 서비스 오류 시 XML 반환)
    if (text.trimStart().startsWith('<')) {
      if (!import.meta.env.PROD) {
        // XML에서 resultCode, resultMsg 추출
        const codeMatch = text.match(/<resultCode>([^<]+)<\/resultCode>/);
        const msgMatch  = text.match(/<resultMsg>([^<]+)<\/resultMsg>/);
        const code = codeMatch?.[1] ?? 'UNKNOWN';
        const msg  = msgMatch?.[1]  ?? text.slice(0, 120);
        console.warn(`[marineApi] ${endpoint} XML오류 [${code}]:`, msg);
      }
      return null;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      if (!import.meta.env.PROD) console.warn(`[marineApi] ${endpoint} JSON파싱실패:`, text.slice(0, 80));
      return null;
    }

    // 공공데이터포털 공통 응답 헤더 체크 (KHOA API는 response 래퍼 없이 header/body가 직결되는 경우가 있음)
    const header = data?.response?.header || data?.header;
    const resultCode = header?.resultCode;
    
    if (resultCode !== '00') {
      if (!import.meta.env.PROD)
        console.warn(`[marineApi] ${endpoint} 오류 [${resultCode}]:`, header?.resultMsg);
      return null;
    }

    const body = data?.response?.body || data?.body;
    const items = body?.items?.item;
    if (!items) return null;

    // item이 단일 객체로 올 수 있음 (공공데이터포털 XML→JSON 변환 특성)
    return Array.isArray(items) ? items : [items];
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      if (!import.meta.env.PROD) console.warn(`[marineApi] ${endpoint} 타임아웃 (10s)`);
    } else if (!import.meta.env.PROD) {
      console.error(`[marineApi] ${endpoint} 오류:`, error);
    }
    return null;
  }
}

// 실제 KHOA(해양수산부) 조위관측소 마스터 데이터 (프론트엔드 매핑용)
const REAL_KHOA_STATIONS = [
  { id: 'DT_0001', name: '인천', lat: 37.4519, lng: 126.5922 },
  { id: 'DT_0002', name: '평택', lat: 36.9669, lng: 126.8227 },
  { id: 'DT_0003', name: '영광', lat: 35.4261, lng: 126.4205 },
  { id: 'DT_0004', name: '제주', lat: 33.5275, lng: 126.5430 },
  { id: 'DT_0005', name: '부산', lat: 35.0963, lng: 129.0352 },
  { id: 'DT_0006', name: '묵호', lat: 37.5502, lng: 129.1163 },
  { id: 'DT_0007', name: '목포', lat: 34.7797, lng: 126.3755 },
  { id: 'DT_0008', name: '안산', lat: 37.1922, lng: 126.6472 },
  { id: 'DT_0010', name: '서귀포', lat: 33.2400, lng: 126.5616 },
  { id: 'DT_0011', name: '후포', lat: 36.6775, lng: 129.4530 },
  { id: 'DT_0012', name: '속초', lat: 38.2134, lng: 128.6010 },
  { id: 'DT_0013', name: '울릉도', lat: 37.4913, lng: 130.9136 },
  { id: 'DT_0014', name: '통영', lat: 34.8277, lng: 128.4347 },
  { id: 'DT_0016', name: '여수', lat: 34.7472, lng: 127.7655 },
  { id: 'DT_0017', name: '대산', lat: 37.0075, lng: 126.3527 },
  { id: 'DT_0018', name: '군산', lat: 35.9755, lng: 126.5630 },
  { id: 'DT_0020', name: '울산', lat: 35.5019, lng: 129.3872 },
  { id: 'DT_0021', name: '추자도', lat: 33.9619, lng: 126.3002 },
  { id: 'DT_0022', name: '성산포', lat: 33.4747, lng: 126.9277 },
  { id: 'DT_0023', name: '모슬포', lat: 33.2144, lng: 126.2511 },
  { id: 'DT_0024', name: '장항', lat: 36.0069, lng: 126.6875 },
  { id: 'DT_0025', name: '보령', lat: 36.4063, lng: 126.4861 },
  { id: 'DT_0026', name: '고흥발포', lat: 34.4811, lng: 127.3427 },
  { id: 'DT_0027', name: '완도', lat: 34.3155, lng: 126.7597 },
  { id: 'DT_0028', name: '진도', lat: 34.3777, lng: 126.3086 },
  { id: 'DT_0029', name: '거제도', lat: 34.8013, lng: 128.6991 },
  { id: 'DT_0031', name: '거문도', lat: 34.0283, lng: 127.3088 },
  { id: 'DT_0032', name: '강화대교', lat: 37.7319, lng: 126.5222 },
  { id: 'DT_0035', name: '흑산도', lat: 34.6841, lng: 125.4355 },
  { id: 'DT_0036', name: '대청도', lat: 37.8252, lng: 124.7180 },
  { id: 'DT_0037', name: '어청도', lat: 36.1172, lng: 125.9847 },
  { id: 'DT_0038', name: '굴업도', lat: 37.1944, lng: 125.9950 },
  { id: 'DT_0039', name: '왕돌초', lat: 36.7191, lng: 129.7325 },
  { id: 'DT_0041', name: '복사초', lat: 34.0983, lng: 126.1683 },
  { id: 'DT_0042', name: '교본초', lat: 34.7047, lng: 128.3063 },
  { id: 'DT_0043', name: '영흥도', lat: 37.2386, lng: 126.4286 },
  { id: 'DT_0046', name: '쌍정초', lat: 37.5561, lng: 130.9392 },
  { id: 'DT_0048', name: '속초등표', lat: 38.1994, lng: 128.6130 },
  { id: 'DT_0051', name: '서천마량', lat: 36.1288, lng: 126.4952 },
  { id: 'DT_0054', name: '진해', lat: 35.1472, lng: 128.6430 },
  { id: 'DT_0056', name: '부산항신항', lat: 35.0775, lng: 128.7847 },
  { id: 'DT_0057', name: '동해항', lat: 37.4947, lng: 129.1438 },
  { id: 'DT_0058', name: '경인항', lat: 37.5608, lng: 126.6011 },
  { id: 'DT_0060', name: '연평도', lat: 37.6576, lng: 125.7144 }
];

import { KHOA_OBSERVATORIES } from '../constants/fishingData';

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 프론트엔드 컴포넌트에서 넘기는 obsCode는 실제로는 KMA(기상청) 코드이므로 KHOA 코드로 변환
function getKhoaObsCode(kmaCode) {
  // ✅ 직접 KHOA 코드를 사용할 수 있도록 접두사(KHOA_) 지원
  if (kmaCode && kmaCode.startsWith('KHOA_')) {
    return kmaCode.replace('KHOA_', '');
  }

  const kmaStation = KHOA_OBSERVATORIES.find(s => s.id === kmaCode);
  if (!kmaStation) return kmaCode;
  
  let nearest = REAL_KHOA_STATIONS[0];
  let minDist = Infinity;
  for (const st of REAL_KHOA_STATIONS) {
    const d = getDistanceKm(kmaStation.lat, kmaStation.lng, st.lat, st.lng);
    if (d < minDist) { minDist = d; nearest = st; }
  }
  return nearest.id;
}

// ────────────────────────────────────────────
// 1. 조석예보 (고·저조)
// ────────────────────────────────────────────
/**
 * @param {string} obsCode - 관측소 코드 (예: 'DT_0004')
 * @param {string} date    - YYYYMMDD
 * @returns {Array|null}   - 고·저조 배열
 *   item: { obsCode, obsName, hl_code: 'H'|'L', hl_time: 'HH:mm', hl_level: '116' }
 */
export const fetchTideForecast = (obsCode, date) =>
  fetchDataGo('1192136/tideFcstHghLw/GetTideFcstHghLwApiService', { obsCode: getKhoaObsCode(obsCode), reqDate: date });

// ────────────────────────────────────────────
// 2. 조위관측소 실측 수온
// ────────────────────────────────────────────
/**
 * @param {string} obsCode - 관측소 코드 (예: 'DT_0004')
 * @param {string} date    - YYYYMMDD
 * @returns {string}       - 수온 문자열 (예: '17.3') 또는 '-'
 *   item: { obsCode, obsName, obs_time, water_temp }
 */
export const fetchWaterTemp = async (obsCode, date) => {
  const data = await fetchDataGo('1192136/surveyWaterTemp/GetSurveyWaterTempApiService', {
    obsCode: getKhoaObsCode(obsCode),
    date,
  });
  if (!data) return '-';
  // 가장 최근 관측값 (배열 마지막)
  const last = data[data.length - 1];
  const temp = last?.wtem ?? last?.water_temp ?? last?.waterTemp ?? null;
  return temp !== null && temp !== undefined ? String(temp) : '-';
};

// ────────────────────────────────────────────
// 3. 바다낚시지수 (7일 예측, 5단계 지수)
// ────────────────────────────────────────────
export const fetchFishingIndex = (obsCode) =>
  fetchDataGo('1192136/fcstFishingv2/GetFcstFishingApiServicev2', { obsCode: getKhoaObsCode(obsCode) }).catch(() => null);

// ────────────────────────────────────────────
// 4. 바다갈라짐 체험지수
// ────────────────────────────────────────────
export const fetchSeaSplitIndex = (obsCode, date) =>
  fetchDataGo('1192136/fcstSeaSplitv2/GetFcstSeaSplitApiServicev2', { obsCode: getKhoaObsCode(obsCode), reqDate: date });
