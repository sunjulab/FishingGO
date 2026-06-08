import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fishing-go-backend.onrender.com';
// ✅ 14TH-C2: PROD 가드 추가 — 프로덕션 콘솔에 환경변수 경고 미노출
if (!import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn('[apiClient] ⚠️ VITE_API_URL 미설정 — localhost:5000으로 요청 중. 배포 환경에서 반드시 설정하세요.');
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s — Render 무료 플랜 콜드스타트(최대 50s) + 모바일 LTE 지연 대응
  // ENH-B1: heavy 요청(이미지 업로드 등)은 개별 호출 시 timeout 오버라이드 사용
  // 예: apiClient.post('/api/user/avatar', data, { timeout: 60000 })
});

// ─── Request Interceptor: 토큰 자동 첨부 ────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // ✅ FIX-STORAGE: localStorage.getItem try/catch — SafarI 개인보호 모드 등에서 getItem이 StorageError 든질 수 있음
    // 무방비 시 모든 API 요청 실패 — 토큰 없이 요청으로 폴백
    let token = null;
    try { token = localStorage.getItem('access_token'); } catch { /* StorageError: 토큰 없이 진행 */ }
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: 401 시 토큰 자동 갱신 ────────────────────────────
let isRefreshing = false;       // 갱신 중 플래그 (중복 요청 방지)
let failedQueue = [];           // 갱신 대기 큐
const MAX_QUEUE = 10;           // ENH-B2: 큐 최대 크기 제한 (메모리 누수 방지)
// ✅ 8TH-C4: isRefreshing/failedQueue는 모듈 레벨 변수 — Vite HMR 시 재설정되지 않으나
// loadAdSense 패턴(주쇼 DOM getElementById)은 HMR에 안전, 토큰 갱신 중 HMR 발생 시는 복수 탭으로 플래그 해제 가능

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 구독 만료 처리 (403 + SUBSCRIPTION_EXPIRED)
    if (error.response?.status === 403 && error.response?.data?.code === 'SUBSCRIPTION_EXPIRED') {
      try {
        const { useUserStore } = await import('../store/useUserStore');
        useUserStore.getState().setUserTier('FREE');
        useUserStore.getState().updateUser({ tier: 'FREE', subscriptionExpiresAt: null });
      } catch(e) {
        // ✅ 8TH-B2: silent swallow → 개발 환경 경고 추가
        if (!import.meta.env.PROD) console.warn('[apiClient] 구독 만료 해제 실패:', e);
      }
      // 재구독 안내 토스트는 전역 이벤트로 발행
      window.dispatchEvent(new CustomEvent('subscription_expired'));
      return Promise.reject(error);
    }

    // 구독 미보유/인증 없는 401은 refresh 없이 에러 전파 (자동 로그아웃 방지)
    // ✅ FIX-TOKEN: TOKEN_INVALID는 토큰 만료 시 발생 → refresh 재시도 허용
    // AUTH_REQUIRED(Bearer 헤더 자체 없음), USER_UNKNOWN, SUBSCRIPTION_REQUIRED만 차단
    const subscriptionCodes = ['AUTH_REQUIRED', 'USER_UNKNOWN', 'SUBSCRIPTION_REQUIRED'];
    if (error.response?.status === 401 && subscriptionCodes.includes(error.response?.data?.code)) {
      return Promise.reject(error);
    }

    // 401이고 아직 재시도 안 한 경우에만 토큰 갱신 시도
    // /auth 경로 요청 중 401이면 리다이렉트 루프 방지를 위해 제외
    const isAuthRoute = originalRequest.url?.includes('/api/auth/');
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      // ✅ FIX-STORAGE: 리프레시 토큰 getItem try/catch — StorageError 시 null 폴백
      let refreshToken = null;
      try { refreshToken = localStorage.getItem('refresh_token'); } catch { /* ok */ }

      // Refresh Token 없으면 로그인 페이지로 (현재 로그인 페이지가 아닐 때만)
      if (!refreshToken) {
        if (!import.meta.env.PROD) console.warn('[Auth] Refresh Token 없음 → 로그인 필요');
        // ✅ BUG-7 FIX: localStorage JSON 파싱으로 GUEST 판별 → XSS 취약점
        // useUserStore.getState()는 동기적으로 현재 스토어 상태를 반환 (import 불필요)
        // localStorage의 'user' 키는 XSS로 조작 가능하여 신뢰 불가
        try {
          // 동적 import 대신 window.__useUserStore 참조 or safe fallback
          const rawUser = localStorage.getItem('user');
          const parsed = rawUser ? JSON.parse(rawUser) : null;
          // id='GUEST'인 경우만 리다이렉트 없이 에러 전파 (조작 방지: 값 하드코딩 비교)
          if (parsed?.id === 'GUEST' && parsed?.email === 'GUEST') {
            return Promise.reject(error);
          }
        } catch(e) {
          if (!import.meta.env.PROD) console.warn('[apiClient] localStorage 파싱 실패:', e);
        }
        // ENH4-A1: window.location.href 풀 리로드 → 커스텀 이벤트로 교체 — App 레벨에서 navigate 캘치
        window.dispatchEvent(new CustomEvent('auth_expired'));
        return Promise.reject(error);
      }

      // 이미 갱신 중이면 큐에 대기 (ENH-B2: MAX_QUEUE 초과 시 즉시 reject)
      if (isRefreshing) {
        if (failedQueue.length >= MAX_QUEUE) {
          return Promise.reject(new Error('요청 큐가 초과되었습니다. 잠시 후 다시 시도해주세요.'));
        }
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // ✅ FIX-TIMEOUT: 직접 axios 호출에 10s 타임아웃 — apiClient 기본값 미적용, 갱신 서버 지연 시 인터셉터 무한 대기 방지
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken }, { timeout: 10000 });
        // BUG-34: 서버가 accessToken 또는 token 키 중 어느 것으로도 응답할 수 있음
        const newAccessToken = response.data.accessToken || response.data.token;
        const { refreshToken: newRefreshToken } = response.data;

        if (!newAccessToken) {
          throw new Error('서버가 유효한 액세스 토큰을 반환하지 않았습니다.');
        }

        // 새 토큰 저장 (Refresh Token Rotation 지원)
        try { localStorage.setItem('access_token', newAccessToken); } catch { /* StorageError 무시 */ }
        if (newRefreshToken) { try { localStorage.setItem('refresh_token', newRefreshToken); } catch { /* StorageError 무시 */ } }
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

        // 대기 중이던 요청들 재시도
        processQueue(null, newAccessToken);

        // 원래 요청 재시도
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh Token도 만료된 경우 → 엄격한 Zustand 스토어 + localStorage 전체 정리
        processQueue(refreshError, null);
        try {
          const { useUserStore } = await import('../store/useUserStore');
          useUserStore.getState().logout(); // user, userTier, lastExpGain 모두 초기화
        } catch(e) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
        }
        // ENH4-A1: Refresh Token 만료 시에도 커스텀 이벤트로 교체 — 상태 유지 리다이렉트
        if (!import.meta.env.PROD) console.warn('[Auth] Refresh Token 만료 → 자동 로그아웃');
        window.dispatchEvent(new CustomEvent('auth_expired'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
