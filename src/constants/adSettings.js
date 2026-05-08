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
};

export const AD_CONFIG = {
  // 무료 사용자라도 쾌적하게! (UX 최적화 모드)
  FREE_USER: {
    FEED_AD_INTERVAL: 10, // 10개 게시글마다 광고 1회 삽입
    SHOW_REWARD_AD_ON_POST: false,
    BOTTOM_SHEET_AD: true,
  },
  // 유료/비즈니스 사용자는 아예 클린하게
  PRO_USER: {
    ALL_ADS_HIDDEN: true,
  }
};
