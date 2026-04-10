export const AD_CONFIG = {
  // 무료 사용자라도 쾌적하게! (UX 최적화 모드)
  FREE_USER: {
    FEED_AD_INTERVAL: 10, // 기존 2개마다 노출 -> 10개마다 노출로 대폭 완화
    SHOW_REWARD_AD_ON_POST: false, // 게시글 등록 시 광고 강제 삭제 (선택제로 변경)
    BOTTOM_SHEET_AD: true, // 정보 하단 한 줄 바텀시트 광고만 최소한 유지
  },
  // 유료/비즈니스 사용자는 아예 클린하게
  PRO_USER: {
    ALL_ADS_HIDDEN: true,
  }
};
