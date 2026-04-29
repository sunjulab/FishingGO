import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CreditCard, X } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import apiClient from '../api/index';

/**
 * SubscriptionFailBanner
 * 정기결제 실패 시 로그인 후 상단에 표시되는 알림 배너
 */
export default function SubscriptionFailBanner() {
  const navigate = useNavigate();
  const { user, userTier } = useUserStore();
  const [failInfo, setFailInfo] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user || dismissed) return;
    // 구독자인데 상태가 failed인 경우만 조회
    const paidTiers = ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP'];
    if (!paidTiers.includes(userTier)) return;

    const userId = user.email || user.id;
    apiClient.get(`/api/payment/subscription/${encodeURIComponent(userId)}`)
      .then(res => {
        if (res.data.hasSubscription && res.data.status === 'failed') {
          setFailInfo(res.data);
        }
      })
      .catch(() => {});
  }, [user, userTier, dismissed]);

  if (!failInfo || dismissed) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: '480px', zIndex: 9999,
      background: 'linear-gradient(135deg, #FF3B30, #C0392B)',
      padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: '10px',
      boxShadow: '0 4px 20px rgba(255,59,48,0.4)',
    }}>
      <AlertTriangle size={18} color="#fff" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#fff', fontWeight: '900', lineHeight: 1.4 }}>
          정기결제 실패 — {failInfo.planId} 플랜 자동 결제에 실패했습니다.
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: '700' }}>
          카드 정보를 확인하고 구독을 재등록해주세요.
        </p>
      </div>
      <button
        onClick={() => { setDismissed(true); navigate('/vvip-subscribe'); }}
        style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', color: '#fff', padding: '6px 10px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', flexShrink: 0 }}
      >
        재등록
      </button>
      <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
        <X size={16} color="#fff" />
      </button>
    </div>
  );
}
