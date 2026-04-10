const API_KEY = 'UGmuI9XoFvrHmwYvM/8eQ==';
const BASE_URL = '/khoa-api/oceangrid'; // 로컬 CORS 우회를 위한 Vite 프록시 경로

// 1. 조석예보 (물때표) 호출
export const fetchTideForecast = async (obsCode, date) => {
  try {
    const response = await fetch(
      `${BASE_URL}/tideObsPre/search.do?ServiceKey=${API_KEY}&ObsCode=${obsCode}&Date=${date}&ResultType=json`
    );
    const data = await response.json();
    return data.result?.data || null; // 시간 및 조위 데이터 배열 반환
  } catch (error) {
    console.error('조석예보 데이터 호출 에러:', error);
    return null;
  }
};

// 2. 실측 수온 (조위관측소 실시간 데이터) 호출
export const fetchWaterTemp = async (obsCode, date) => {
  try {
    const response = await fetch(
      `${BASE_URL}/tideObs/search.do?ServiceKey=${API_KEY}&ObsCode=${obsCode}&Date=${date}&ResultType=json`
    );
    const data = await response.json();
    if (!data.result?.data) return '-';
    // 가장 최근 관측된 수온 데이터 1개만 추출하여 반환
    const latestData = data.result.data[data.result.data.length - 1]; 
    return latestData.water_temp; 
  } catch (error) {
    console.error('실측 수온 데이터 호출 에러:', error);
    return '-';
  }
};

// 3. 바다 낚시지수 호출
export const fetchFishingIndex = async (obsCode) => {
  try {
    const response = await fetch(
      // 바다낚시지수는 별도의 코드나 좌표 체계를 사용할 수 있으므로, 해당 포인트의 지표를 요청
      `${BASE_URL}/seaFishingIndex/search.do?ServiceKey=${API_KEY}&ObsCode=${obsCode}&ResultType=json`
    );
    const data = await response.json();
    return data.result?.data || null; 
  } catch (error) {
    console.error('낚시지수 데이터 호출 에러:', error);
    return null;
  }
};
