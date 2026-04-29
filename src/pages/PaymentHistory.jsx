import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, CheckCircle2, XCircle, Clock, RefreshCw, TrendingUp } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import apiClient from '../api/index';

const PG_LABEL = { kakaopay: '💛 카카오페이', naverpay: '🟢 네이버페이', tosspayments: '💙 토스페이먼츠', card: '💳 카드' };
const STATUS_CONFIG = {
  paid:      { label: '결제 완료', color: '#00C48C', icon: CheckCircle2 },
  failed:    { label: '결제 실패', color: '#FF3B30', icon: XCircle     },
  refunded:  { label: '환불 완료', color: '#8E8E93', icon: RefreshCw   },
  cancelled: { label: '취소',      color: '#FF9B26', icon: XCircle     },
};
const PLAN_LABEL = { LITE: 'LITE 멤버십', PRO: 'PRO 멤버십', VVIP: 'VVIP 항구 독점' };

export default function PaymentHistory() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const addToast = useToastStore(s => s.addToast);

  const [history, setHistory] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const userId = user.email || user.id;
    try {
      const [histRes, subRes] = await Promise.all([
        apiClient.get(`/api/payment/history?userId=${encodeURIComponent(userId)}`),
        apiClient.get(`/api/payment/subscription/${encodeURIComponent(userId)}`),
      ]);
      setHistory(histRes.data || []);
      if (subRes.data.hasSubscription) setSubscription(subRes.data);
    } catch {
      addToast('결제 내역을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      const userId = user.email || user.id;
      await apiClient.delete(`/api/payment/subscription/${encodeURIComponent(userId)}`, {
        data: { reason: cancelReason || '사용자 직접 취소' }
      });
      addToast('구독이 취소되었습니다. 현재 기간 종료 후 해지됩니다.', 'success');
      setSubscription(prev => ({ ...prev, status: 'cancelled' }));
      setCancelConfirm(false);
    } catch (err) {
      addToast(err.response?.data?.error || '취소 처리 실패', 'error');
    }
  };

  const totalPaid = history.filter(h => h.status === 'paid').reduce((s, h) => s + h.amount, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#0E0E1A', color: '#fff', fontFamily: 'Pretendard, sans-serif', paddingBottom: '40px' }}>
      {/* 헤더 */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={22} color="#fff" />
        </button>
        <span style={{ fontSize: '18px', fontWeight: '950' }}>결제 내역</span>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: '480px', margin: '0 auto' }}>

        {/* 현재 구독 카드 */}
        {subscription && (
          <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius: '20px', padding: '20px', marginBottom: '20px', border: '1px solid rgba(255,215,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '700' }}>현재 구독</span>
              <span style={{
                fontSize: '11px', fontWeight: '900', padding: '4px 10px', borderRadius: '20px',
                background: subscription.status === 'active' ? 'rgba(0,196,140,0.15)' : 'rgba(255,59,48,0.15)',
                color: subscription.status === 'active' ? '#00C48C' : '#FF3B30',
                border: `1px solid ${subscription.status === 'active' ? 'rgba(0,196,140,0.3)' : 'rgba(255,59,48,0.3)'}`,
              }}>
                {subscription.status === 'active' ? '✅ 활성' : subscription.status === 'failed' ? '❌ 결제실패' : subscription.status === 'cancelled' ? '🚫 취소됨' : subscription.status}
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '950', marginBottom: '4px' }}>
              {PLAN_LABEL[subscription.planId] || subscription.planId}
            </div>
            <div style={{ fontSize: '20px', fontWeight: '950', color: '#FFD700', marginBottom: '14px' }}>
              {subscription.amount?.toLocaleString()}원 <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>/ 월</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {[
                { label: '결제 수단', value: PG_LABEL[subscription.pgProvider] || subscription.pgProvider },
                { label: '다음 결제일', value: subscription.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString('ko-KR') : '-' },
                { label: '구독 시작', value: subscription.startedAt ? new Date(subscription.startedAt).toLocaleDateString('ko-KR') : '-' },
                { label: '마지막 결제', value: subscription.lastBilledAt ? new Date(subscription.lastBilledAt).toLocaleDateString('ko-KR') : '-' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontWeight: '700' }}>{label}</span>
                  <span style={{ fontSize: '13px', color: '#fff', fontWeight: '800' }}>{value}</span>
                </div>
              ))}
            </div>
            {subscription.status === 'active' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => navigate('/vvip-subscribe')}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(0,100,255,0.3)', background: 'rgba(0,100,255,0.1)', color: '#64B5F6', fontSize: '13px', fontWeight: '900', cursor: 'pointer' }}
                >
                  플랜 변경
                </button>
                <button
                  onClick={() => setCancelConfirm(true)}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,59,48,0.3)', background: 'rgba(255,59,48,0.1)', color: '#FF5A5F', fontSize: '13px', fontWeight: '900', cursor: 'pointer' }}
                >
                  구독 취소
                </button>
              </div>
            )}
            {subscription.status === 'failed' && (
              <button
                onClick={() => navigate('/vvip-subscribe')}
                style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#FF3B30,#C0392B)', color: '#fff', fontSize: '14px', fontWeight: '950', cursor: 'pointer' }}
              >
                결제 수단 재등록
              </button>
            )}
          </div>
        )}

        {/* 총 결제 통계 */}
        {history.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: '총 결제', value: `${totalPaid.toLocaleString()}원`, icon: TrendingUp, color: '#00C48C' },
              { label: '결제 횟수', value: `${history.filter(h=>h.status==='paid').length}회`, icon: CreditCard, color: '#64B5F6' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '14px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Icon size={16} color={color} style={{ marginBottom: '6px' }} />
                <div style={{ fontSize: '18px', fontWeight: '950', color }}>{value}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* 내역 리스트 */}
        <div style={{ marginBottom: '10px', fontSize: '13px', fontWeight: '800', color: 'rgba(255,255,255,0.5)' }}>결제 내역</div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
            <Clock size={32} style={{ marginBottom: '12px' }} /><br />불러오는 중...
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'rgba(255,255,255,0.3)' }}>
            <CreditCard size={40} style={{ marginBottom: '12px' }} />
            <p style={{ margin: 0, fontWeight: '700' }}>결제 내역이 없습니다.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {history.map((item, i) => {
              const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.paid;
              const Icon = cfg.icon;
              return (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '14px 16px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: `${cfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={cfg.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '900', color: '#fff', marginBottom: '2px' }}>
                      {PLAN_LABEL[item.planId] || item.planId || '구독 결제'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>
                      {PG_LABEL[item.pgProvider] || item.pgProvider} · {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                    {item.failReason && (
                      <div style={{ fontSize: '10px', color: '#FF5A5F', fontWeight: '700', marginTop: '2px' }}>사유: {item.failReason}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: '950', color: item.status === 'paid' ? '#fff' : cfg.color }}>
                      {item.status === 'refunded' ? '-' : ''}{item.amount?.toLocaleString()}원
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: cfg.color, marginTop: '2px' }}>{cfg.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 구독 취소 확인 모달 */}
      {cancelConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#1a1a2e', borderRadius: '24px 24px 0 0', padding: '28px 20px', width: '100%', maxWidth: '480px' }}>
            <div style={{ fontSize: '18px', fontWeight: '950', marginBottom: '8px' }}>구독을 취소하시겠습니까?</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginBottom: '18px', lineHeight: 1.6 }}>
              현재 결제 기간 종료 후 자동으로 해지됩니다.<br />
              남은 기간 동안은 서비스를 계속 이용하실 수 있습니다.
            </div>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="취소 사유 (선택 입력)"
              style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '13px', fontWeight: '700', resize: 'none', outline: 'none', height: '72px', boxSizing: 'border-box', marginBottom: '14px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setCancelConfirm(false)} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '15px', fontWeight: '900', cursor: 'pointer' }}>
                유지하기
              </button>
              <button onClick={handleCancel} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg,#FF3B30,#C0392B)', color: '#fff', fontSize: '15px', fontWeight: '950', cursor: 'pointer' }}>
                취소 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
