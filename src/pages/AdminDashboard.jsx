import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, CreditCard, DollarSign, RefreshCw, AlertCircle } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import apiClient from '../api/index';

const PG_LABEL = { kakaopay: '💛 카카오', naverpay: '🟢 네이버', tosspayments: '💙 토스', card: '💳 카드' };
const PLAN_COLOR = { LITE: '#8E8E93', PRO: '#0056D2', VVIP: '#FFD700' };

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: '700' }}>{label}</span>
        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div style={{ fontSize: '26px', fontWeight: '950', color: '#fff', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const isAdmin = user?.id === 'sunjulab' || user?.email === 'sunjulab' || user?.name === 'sunjulab';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true); setError('');
    try {
      const res = await apiClient.get('/api/admin/revenue');
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.error || '데이터를 불러오지 못했습니다.');
    } finally { setLoading(false); }
  };

  // 심플 바 차트 (recharts 없이 CSS로 구현)
  const planBreakdown = stats?.planBreakdown || {};
  const maxPlanRevenue = Math.max(...Object.values(planBreakdown).map(p => p.revenue || 0), 1);

  return (
    <div style={{ minHeight: '100vh', background: '#070B14', color: '#fff', fontFamily: 'Pretendard, sans-serif', paddingBottom: '40px' }}>
      {/* 헤더 */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={22} color="#fff" />
          </button>
          <span style={{ fontSize: '18px', fontWeight: '950' }}>⚙️ 수익 대시보드</span>
        </div>
        <button onClick={fetchStats} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800' }}>
          <RefreshCw size={14} color="#fff" /> 새로고침
        </button>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: '480px', margin: '0 auto' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
            <p style={{ fontWeight: '700' }}>데이터 로딩 중...</p>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
            <AlertCircle size={18} color="#FF5A5F" />
            <p style={{ margin: 0, fontSize: '13px', color: '#FF5A5F', fontWeight: '800' }}>{error}</p>
          </div>
        )}

        {stats && !loading && (
          <>
            {/* 주요 지표 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
              <StatCard label="이번 달 매출" value={`${(stats.monthRevenue || 0).toLocaleString()}원`} icon={TrendingUp} color="#00C48C" sub="당월 결제 합계" />
              <StatCard label="누적 매출" value={`${(stats.totalRevenue || 0).toLocaleString()}원`} icon={DollarSign} color="#FFD700" sub="전체 결제 합계" />
              <StatCard label="활성 구독자" value={`${stats.activeSubscriptions || 0}명`} icon={Users} color="#64B5F6" sub="현재 정기구독 중" />
              <StatCard label="최근 결제" value={`${stats.recentPayments?.length || 0}건`} icon={CreditCard} color="#FF9B26" sub="최근 10건 기준" />
            </div>

            {/* 플랜별 분포 */}
            {Object.keys(planBreakdown).length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '18px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', marginBottom: '14px' }}>플랜별 수익</div>
                {Object.entries(planBreakdown).map(([plan, data]) => (
                  <div key={plan} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: PLAN_COLOR[plan] || '#fff' }}>{plan}</span>
                      <span style={{ fontSize: '13px', fontWeight: '950', color: '#fff' }}>
                        {(data.revenue || 0).toLocaleString()}원 <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>({data.count}명)</span>
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${((data.revenue || 0) / maxPlanRevenue) * 100}%`, background: PLAN_COLOR[plan] || '#64B5F6', borderRadius: '3px', transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 최근 결제 내역 */}
            {stats.recentPayments?.length > 0 && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>최근 결제 내역</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {stats.recentPayments.map((p, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '900', color: '#fff' }}>{p.userName || p.userId}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginTop: '2px' }}>
                          {p.planId} · {PG_LABEL[p.pgProvider] || p.pgProvider} · {new Date(p.createdAt).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: '950', color: p.status === 'paid' ? '#00C48C' : '#FF5A5F' }}>
                          {(p.amount || 0).toLocaleString()}원
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: '800', color: p.status === 'paid' ? '#00C48C' : '#FF5A5F', marginTop: '2px' }}>
                          {p.status === 'paid' ? '완료' : p.status === 'failed' ? '실패' : p.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
