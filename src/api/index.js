import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// ✅ 14TH-C2: PROD 가드 추가 — 프로덕션 콘솔에 환경변수 경고 미노출
if (!import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn('[apiClient] ⚠️ VITE_API_URL 미설정 — localhost:5000으로 요청 중. 배포 환경에서 반드시 설정하세요.');
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  // ENH-B1: heavy 요청(이미지 업로드 등)은 개별 호출 시 timeout 오버라이드 사용
  // 예: apiClient.post('/api/user/avatar', data, { timeout: 30000 })
});

// ─── Request Interceptor: 토큰 자동 첨부 ────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
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
    // checkSubscriptionValid 미들웨어의 AUTH_REQUIRED, TOKEN_INVALID 코드 처리
    const subscriptionCodes = ['AUTH_REQUIRED', 'TOKEN_INVALID', 'USER_UNKNOWN', 'SUBSCRIPTION_REQUIRED'];
    if (error.response?.status === 401 && subscriptionCodes.includes(error.response?.data?.code)) {
      return Promise.reject(error);
    }

    // 401이고 아직 재시도 안 한 경우에만 토큰 갱신 시도
    // /auth 경로 요청 중 401이면 리다이렉트 루프 방지를 위해 제외
    const isAuthRoute = originalRequest.url?.includes('/api/auth/');
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      const refreshToken = localStorage.getItem('refresh_token');

      // Refresh Token 없으면 로그인 페이지로 (현재 로그인 페이지가 아닐 때만)
      if (!refreshToken) {
        if (!import.meta.env.PROD) console.warn('[Auth] Refresh Token 없음 → 로그인 필요');
        // GUEST 사용자는 리다이렉트 없이 에러만 전파 (공개 페이지 탐색 보호)
        try {
          const stored = JSON.parse(localStorage.getItem('user') || '{}');
          // ✅ 3RD-B4: name 기반 GUEST 체크 제거 — name은 변경 가능, id만으로 판별 (WARN-US2와 동일 원칙)
          if (stored?.id === 'GUEST') {
            return Promise.reject(error);
          }
        } catch(e) {
          // ✅ 8TH-B3: silent swallow → 개발 환경 경고 추가 (localStorage JSON.parse 실패)
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
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
        // BUG-34: 서버가 accessToken 또는 token 키 중 어느 것으로도 응답할 수 있음
        const newAccessToken = response.data.accessToken || response.data.token;
        const { refreshToken: newRefreshToken } = response.data;

        if (!newAccessToken) {
          throw new Error('서버가 유효한 액세스 토큰을 반환하지 않았습니다.');
        }

        // 새 토큰 저장 (Refresh Token Rotation 지원)
        localStorage.setItem('access_token', newAccessToken);
        if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken);
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
