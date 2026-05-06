import React from 'react';
import { useUserStore } from '../store/useUserStore';
import { AD_CONFIG } from '../constants/adSettings';

// ✅ 18TH-C2: PREMIUM_TIERS 모듈 레벨 상수 — 매 렌더마다 배열 재생성 방지 (SubscriptionFailBanner.jsx PAID_TIERS 패턴 동일)
const PREMIUM_TIERS = ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'MASTER'];

export default function AdWrapper({ children, fallbackStyle }) {
  // ✅ 11TH-B6: canAccessPremium() 함수를 셀렉터 내 호출 → tier 직접 판별
  // canAccessPremium()은 내부에서 함수 호출 → Zustand memoization 미작동 (매 렌더마다 재구독)
  // tier를 직접 구독하면 stable shallow comparison으로 불필요 리렌더 방지
  // ✅ 18TH-B1: state.user?.tier → state.userTier 실제 버그 수정
  // user.tier는 useUserStore에 존재하지 않는 프로퍼티 — 항상 undefined → isPremium이 항상 false → 유료 사용자에게도 광고 노출
  const userTier = useUserStore((state) => state.userTier); // ✅ 올바른 참조: state.userTier
  const isPremium = PREMIUM_TIERS.includes(userTier);

  // ✅ 5TH-B6: AD_CONFIG.PRO_USER.ALL_ADS_HIDDEN 연결 — adSettings 실제 제어 반영
  if (isPremium && AD_CONFIG.PRO_USER.ALL_ADS_HIDDEN) {
    return null;
  }

  return (
    <div className="ad-container" style={fallbackStyle}>
      {children}
    </div>
  );
}
