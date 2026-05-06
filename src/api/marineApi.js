// ✅ SEC-07: KHOA API 키 하드코딩 제거 → 환경변수로 전환
// Render 대시보드: 백엔드 서비스 Environment → VITE_KHOA_API_KEY 등록
const API_KEY = import.meta.env.VITE_KHOA_API_KEY || '';
if (!API_KEY && !import.meta.env.PROD) console.warn('[marineApi] VITE_KHOA_API_KEY 미설정 — 조석/수온 API 비활성화됨');
const BASE_URL = '/khoa-api/oceangrid'; // 로컬 CORS 우회를 위한 Vite 프록시 경로

// ✅ 4TH-B5: fetchKhoa 공통 헬퍼 — 3개 함수의 fetch+catch boilerplate 중복 제거
async function fetchKhoa(path, params) {
  const query = new URLSearchParams({ ServiceKey: API_KEY, ResultType: 'json', ...params }).toString();
  try {
    const response = await fetch(`${BASE_URL}/${path}?${query}`);
    // ✅ 8TH-B6: response.ok 체크 추가 — 4xx/5xx 응답에서 JSON 파싱 시도 방지
    if (!response.ok) {
      if (!import.meta.env.PROD) console.warn(`[marineApi] ${path} HTTP ${response.status}`);
      return null;
    }
    const data = await response.json();
    return data.result?.data ?? null;
  } catch (error) {
    if (!import.meta.env.PROD) console.error(`[marineApi] ${path} 오류:`, error);
    return null;
  }
}

// 1. 조석예보 (물때표) 호출
export const fetchTideForecast = (obsCode, date) =>
  fetchKhoa('tideObsPre/search.do', { ObsCode: obsCode, Date: date });

// 2. 실측 수온 (조위관측소 실시간 데이터) 호출 — 가장 최근 관측값 반환
export const fetchWaterTemp = async (obsCode, date) => {
  const data = await fetchKhoa('tideObs/search.do', { ObsCode: obsCode, Date: date });
  if (!data) return '-';
  return data[data.length - 1]?.water_temp ?? '-';
};

// 3. 바다 낚시지수 호출
export const fetchFishingIndex = (obsCode) =>
  fetchKhoa('seaFishingIndex/search.do', { ObsCode: obsCode });
