export const AD_CONFIG = {
  // 무료 사용자라도 쾌적하게! (UX 최적화 모드)
  FREE_USER: {
    // ✅ 29TH-B2: FEED_AD_INTERVAL 연결 현황 — CommunityTab은 현재 AdWrapper/NativeAd 직접 사용 없이
    // 자체 피드 렌더링 방식 사용 중. 피드 광고 삽입 시 이 값을 참조하도록 연결 권장
    // 연결 방법: import { AD_CONFIG } from '../constants/adSettings'; 후 인터벌 조건에 AD_CONFIG.FREE_USER.FEED_AD_INTERVAL 사용
    FEED_AD_INTERVAL: 10, // 10개 게시글마다 광고 1회 삽입 (기존 2개마다 → 완화)
    SHOW_REWARD_AD_ON_POST: false, // 게시글 등록 시 광고 강제 삭제 (선택제로 변경)
    BOTTOM_SHEET_AD: true, // 정보 하단 한 줄 바텀시트 광고만 최소한 유지
  },
  // 유료/비즈니스 사용자는 아예 클린하게
  // ✅ 8TH-B1: ALL_ADS_HIDDEN — AdUnit.jsx BannerAd/NativeAd에서 canAccessPremium() 체크로 연결 완료
  PRO_USER: {
    ALL_ADS_HIDDEN: true,
  }
};
