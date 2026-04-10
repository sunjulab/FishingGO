import React from 'react';
import { useUserStore } from '../store/useUserStore';

export default function AdWrapper({ children, fallbackStyle }) {
  const canAccessPremium = useUserStore((state) => state.canAccessPremium());
  
  // BUSINESS나 PRO 등급은 광고를 렌더링하지 않음 (상위 등급 자동 포함)
  if (canAccessPremium) {
    return null; 
  }

  return (
    <div className="ad-container" style={fallbackStyle}>
      {children}
    </div>
  );
}
