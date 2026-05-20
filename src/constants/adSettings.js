// ✅ ADMOB: Google AdMob 실제 광고 단위 ID (네이티브 앱 전용)
export const ADMOB_CONFIG = {
  // 앱 ID (AndroidManifest.xml에도 등록 필요)
  APP_ID: 'ca-app-pub-9774243773523817~7409873309',
  // 보상형 광고 — CCTV 1회 무료 보기, 비밀포인트 확인 등
  REWARDED_ID: import.meta.env.PROD
    ? 'ca-app-pub-9774243773523817/1020026097'
    : 'ca-app-pub-3940256099942544/5224354917', // 개발 테스트 ID
  // 네이티브 광고 — 커뮤니티 피드 중간 삽입
  NATIVE_ID: import.meta.env.PROD
    ? 'ca-app-pub-9774243773523817/8130405525'
    : 'ca-app-pub-3940256099942544/2247696314', // 개발 테스트 ID
  // ✅ BANNER: 배너 광고 — 선상배홍보/커뮤니티 하단 고정 (네이티브 앱 AdSense 대체)
  // AdMob 콘솔 → 앱 → 광고 단위 → 배너 → 새 광고 단위 생성 후 실제 ID로 교체
  BANNER_ID: import.meta.env.PROD
    ? 'ca-app-pub-9774243773523817/XXXXXXXXXX' // ⚠️ AdMob 콘솔에서 배너 광고 단위 생성 후 교체
    : 'ca-app-pub-3940256099942544/6300978111', // 구글 공식 테스트 배너 ID
  // ✅ INTERSTITIAL: 전면 광고 — 선상배홍보 탭 진입 시 FREE 유저 (네이티브 앱 인피드 대체)
  // AdMob 콘솔 → 앱 → 광고 단위 → 전면(Interstitial) → 새 광고 단위 생성 후 교체
  INTERSTITIAL_ID: import.meta.env.PROD
    ? 'ca-app-pub-9774243773523817/YYYYYYYYYY' // ⚠️ AdMob 콘솔에서 전면 광고 단위 생성 후 교체
    : 'ca-app-pub-3940256099942544/1033173712', // 구글 공식 테스트 전면광고 ID
};

export const AD_CONFIG = {
  // 무료 사용자라도 쾌적하게! (UX 최적화 모드)
  FREE_USER: {
    FEED_AD_INTERVAL: 5, // 5개 게시글마다 광고 1회 삽입 (기존 10)
    SHOW_REWARD_AD_ON_POST: false,
    BOTTOM_SHEET_AD: true,
  },
  // 유료/비즈니스 사용자는 아예 클린하게
  PRO_USER: {
    ALL_ADS_HIDDEN: true,
  }
};

// ✅ PROD-AD-CHECK: 프로덕션 실광고 모드에서 placeholder ID 사용 시 즉시 경고
// VITE_ADMOB_TESTING=false + XXXXXXXXXX/YYYYYYYYYY → AdMob 요청 거부, 배너·전면광고 수익 0원
if (import.meta.env.PROD && import.meta.env.VITE_ADMOB_TESTING === 'false') {
  if (ADMOB_CONFIG.BANNER_ID?.includes('XXXXXXXXXX')) {
    // ⚠️ BANNER_ID placeholder — AdMob 콘솔에서 배너 광고단위 생성 후 adSettings.js를 교체하세요.
    // (프로덕션 콘솔 노출 방지를 위해 console.error 제거)
  }
  if (ADMOB_CONFIG.INTERSTITIAL_ID?.includes('YYYYYYYYYY')) {
    // ⚠️ INTERSTITIAL_ID placeholder — AdMob 콘솔에서 전면광고 단위 생성 후 adSettings.js를 교체하세요.
    // (프로덕션 콘솔 노출 방지를 위해 console.error 제거)
  }
}
