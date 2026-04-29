import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
      } catch(e) {}
      // 재구독 안내 토스트는 전역 이벤트로 발행
      window.dispatchEvent(new CustomEvent('subscription_expired'));
      return Promise.reject(error);
    }

    // 401이고 아직 재시도 안 한 경우에만 토큰 갱신 시도
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh_token');

      // Refresh Token 없으면 로그인 페이지로
      if (!refreshToken) {
        console.warn('[Auth] Refresh Token 없음 → 로그인 필요');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // 이미 갱신 중이면 큐에 대기
      if (isRefreshing) {
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
        const { accessToken } = response.data;

        // 새 토큰 저장
        localStorage.setItem('access_token', accessToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        // 대기 중이던 요청들 재시도
        processQueue(null, accessToken);

        // 원래 요청 재시도
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh Token도 만료된 경우 → 강제 로그아웃
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        console.warn('[Auth] Refresh Token 만료 → 자동 로그아웃');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
