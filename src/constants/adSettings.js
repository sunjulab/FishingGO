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
    : 'ca-app-pub-3940256099942544/2247696110', // 개발 테스트 ID (표준형)
  // 배너 광고 — 인라인/고정 배너 (320×50)
  // ✅ 2026-05-29 신규 발급: AdMob 콘솔 > 광고 단위 > 배너
  BANNER_ID: import.meta.env.PROD
    ? 'ca-app-pub-9774243773523817/7590161071'  // ✅ 배너 전용 단위 (신규 발급)
    : 'ca-app-pub-3940256099942544/6300978111', // 구글 공식 테스트 배너 ID
  // 전면(인터스티셜) 광고 — 선상예약 탭 진입 시 FREE 유저
  INTERSTITIAL_ID: import.meta.env.PROD
    ? 'ca-app-pub-9774243773523817/1020026097'  // 보상형과 동일 단위 사용 (전면용 별도 단위 없을 때)
    : 'ca-app-pub-3940256099942544/1033173712', // 구글 공식 테스트 전면광고 ID
  // 보상형 전면 광고 — 포인트 진입 및 3회마다
  REWARDED_INTERSTITIAL_ID: import.meta.env.PROD
    ? 'ca-app-pub-9774243773523817/9339731137'
    : 'ca-app-pub-3940256099942544/5354046379', // 구글 공식 테스트 보상형전면광고 ID
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

