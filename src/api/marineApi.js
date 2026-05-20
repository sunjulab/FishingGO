// ✅ TIDE-API-REPLACE: 공공데이터포털 국립해양조사원 3종 API 통합
// 1. 조석예보(고·저조)  — https://apis.data.go.kr/1192136/tideFcstHghLw
// 2. 바다낚시지수       — https://apis.data.go.kr/1192136/fcstFishingv2
// 3. 조위관측소 실측 수온 — https://apis.data.go.kr/1192136/surveyWaterTemp
// 공통 인증키: VITE_TIDE_API_KEY 환경변수

const API_KEY = import.meta.env.VITE_TIDE_API_KEY || '';
if (!API_KEY && !import.meta.env.PROD) {
  console.warn('[marineApi] VITE_TIDE_API_KEY 미설정 — 해양 API 비활성화됨');
}

// Vite 프록시: /data-go-api → https://apis.data.go.kr
const PROXY = '/data-go-api';

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
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (!import.meta.env.PROD) console.warn(`[marineApi] ${endpoint} HTTP ${response.status}`);
      return null;
    }

    // ── 응답 텍스트 먼저 읽기 (XML 에러 처리용) ──────────────
    const text = await response.text();

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

    // 공공데이터포털 공통 응답 헤더 체크
    const resultCode = data?.response?.header?.resultCode;
    if (resultCode !== '00') {
      if (!import.meta.env.PROD)
        console.warn(`[marineApi] ${endpoint} 오류 [${resultCode}]:`, data?.response?.header?.resultMsg);
      return null;
    }

    const items = data?.response?.body?.items?.item;
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
  fetchDataGo('1192136/tideFcstHghLw/GetTideFcstHghLwApiService', { obsCode, date });

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
    obsCode,
    date,
  });
  if (!data) return '-';
  // 가장 최근 관측값 (배열 마지막)
  const last = data[data.length - 1];
  const temp = last?.water_temp ?? last?.waterTemp ?? null;
  return temp !== null && temp !== undefined ? String(temp) : '-';
};

// ────────────────────────────────────────────
// 3. 바다낚시지수 (7일 예측, 5단계 지수)
// ────────────────────────────────────────────
/**
 * @param {string} obsCode - 관측소 코드 (예: 'DT_0004')
 * @returns {Array|null}   - 낚시지수 배열 (7일치)
 *   item: { obsCode, obsName, fcst_time, wt, wh, current_spd,
 *            fishing_idx,  // 1~5 (1=매우좋음 ~ 5=매우나쁨)  ← 가이드 확인 필요
 *            fishing_grade }
 */
export const fetchFishingIndex = (obsCode) =>
  fetchDataGo('1192136/fcstFishingv2/GetFcstFishingApiServicev2', { obsCode });
