import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, CreditCard, DollarSign, RefreshCw, AlertCircle, BellRing, Send } from 'lucide-react';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore'; // ✅ 11TH-A1: ADMIN_ID/EMAIL import
import { useToastStore } from '../store/useToastStore';
import apiClient from '../api/index';
import LoadingSpinner from '../components/LoadingSpinner'; // ✅ 11TH-C1: LoadingSpinner import
// ✅ NEW-C4: 결제 관련 상수 공유 파일 사용 (PaymentHistory와 중복 선언 제거)
import { PG_LABEL_SHORT as PG_LABEL, PLAN_COLOR } from '../constants/payment';

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
  // ✅ 11TH-A1: 전체 store 구독 제거 — user가 직접 사용되지 않으므로 제거
  // isAdmin: state.isAdmin() 셉렉터 → ADMIN_ID/EMAIL 직접 비교 (3RD-A2 표준으로 통일)
  const isAdmin = useUserStore((state) =>
    state.user?.id === ADMIN_ID || state.user?.email === ADMIN_EMAIL
  );

  const addToast = useToastStore((s) => s.addToast);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // ✅ NEW-A5: Zustand hydration race 방지 — CctvAdmin(ENH6-B6)와 동일 패턴
  const [authChecked, setAuthChecked] = useState(false);

  // ✅ NEW-B7: 알림 관련 state 6개 → 단일 객체로 응집
  const [alertState, setAlertState] = useState({
    tab: 'broadcast', sending: false,
    msg: '', location: '',
    pushEmail: '', pushTitle: '', pushMsg: '',
  });
  const { tab: alertTab, sending: alertSending, msg: alertMsg, location: alertLocation,
    pushEmail, pushTitle, pushMsg } = alertState;
  const setAlertField = (field) => (val) => setAlertState(s => ({ ...s, [field]: val }));
  const setAlertTab      = setAlertField('tab');
  const setAlertSending  = setAlertField('sending');
  const setAlertMsg      = setAlertField('msg');
  const setAlertLocation = setAlertField('location');
  const setPushEmail     = setAlertField('pushEmail');
  const setPushTitle     = setAlertField('pushTitle');
  const setPushMsg       = setAlertField('pushMsg');

  useEffect(() => {
    // ✅ NEW-A5: setTimeout(0)으로 Zustand hydration 완료 대기 — isAdmin stale read 방지
    const t = setTimeout(() => {
      if (!isAdmin) { navigate('/'); return; }
      setAuthChecked(true);
      fetchStats();
    }, 0);
    return () => clearTimeout(t);
  }, [isAdmin, navigate]);

  const fetchStats = async () => {
    setLoading(true); setError('');
    try {
      // Authorization 헤더는 apiClient 인터셉터가 자동 주입 (access_token)
      // adminId 쿼리 파라미터 제거 — 서버가 JWT로만 인증하도록 변경
      const res = await apiClient.get('/api/admin/revenue');
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.error || '데이터를 불러오지 못했습니다.');
    } finally {
      // ENH3-C5: finally로 loading 해제 안전성 보장 — 중간 throw 시에도 true 고착 없음
      setLoading(false);
    }
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
        {/* ✅ 11TH-C1: 인라인 로딩 스피너 → LoadingSpinner 컴포넌트로 교체 */}
        {(!authChecked || loading) && (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <LoadingSpinner />
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
                    <div key={p._id || p.merchant_uid || i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
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

        {/* ✅ LOW-1: 관리자 알림 발송 패널 */}
        <div style={{ marginTop: '24px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BellRing size={18} color="#FFD700" />
            <span style={{ fontSize: '14px', fontWeight: '900', color: '#fff' }}>실시간 알림 발송</span>
          </div>
          {/* 탭 */}
          <div style={{ display: 'flex', padding: '12px 18px 0', gap: '8px' }}>
            {[{ id: 'broadcast', label: '무선 전체' }, { id: 'push', label: '개인 푸시' }].map(t => (
              <button key={t.id} onClick={() => setAlertTab(t.id)} style={{ padding: '6px 14px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: '900', cursor: 'pointer', background: alertTab === t.id ? '#FFD700' : 'rgba(255,255,255,0.08)', color: alertTab === t.id ? '#1A1A2E' : 'rgba(255,255,255,0.5)', transition: 'all 0.15s' }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '14px 18px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alertTab === 'broadcast' ? (
              <>
                <input value={alertMsg} onChange={e => setAlertMsg(e.target.value)} placeholder="알림 메시지 (ex: 서검 한치 조황 폭발화!)" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff', fontSize: '13px', fontWeight: '700', outline: 'none' }} />
                <input value={alertLocation} onChange={e => setAlertLocation(e.target.value)} placeholder="위치 (ex: 서검도 갯바위, 선택사항)" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff', fontSize: '13px', fontWeight: '700', outline: 'none' }} /> {/* ✅ 30TH-C3: '갌바위' → '갯바위' 오타 수정 */}
                <button
                  disabled={!alertMsg.trim() || alertSending}
                  onClick={async () => {
                    setAlertSending(true);
                    try {
                      await apiClient.post('/api/admin/alert', { message: alertMsg.trim(), location: alertLocation.trim() });
                      // ENH3-B6: '낙시' → '낚시' 오타 수정
                      addToast('🔔 전체 낚시 알림 발송 완료!', 'success');
                      setAlertMsg(''); setAlertLocation('');
                    } catch (err) { addToast(err.response?.data?.error || '발송 실패', 'error'); }
                    finally { setAlertSending(false); }
                  }}
                  style={{ padding: '13px', border: 'none', borderRadius: '12px', background: alertMsg.trim() ? 'linear-gradient(135deg,#FFD700,#FF9B26)' : 'rgba(255,255,255,0.06)', color: alertMsg.trim() ? '#1A1A2E' : 'rgba(255,255,255,0.25)', fontWeight: '950', fontSize: '14px', cursor: alertMsg.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                >
                  <Send size={16} />{alertSending ? '발송 중...' : '전체 알림 발송'}
                </button>
              </>
            ) : (
              <>
                <input value={pushEmail} onChange={e => setPushEmail(e.target.value)} placeholder="대상 이메일" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff', fontSize: '13px', fontWeight: '700', outline: 'none' }} />
                <input value={pushTitle} onChange={e => setPushTitle(e.target.value)} placeholder="알림 제목 (선택)" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff', fontSize: '13px', fontWeight: '700', outline: 'none' }} />
                <input value={pushMsg} onChange={e => setPushMsg(e.target.value)} placeholder="개인 메시지" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff', fontSize: '13px', fontWeight: '700', outline: 'none' }} />
                <button
                  disabled={!pushEmail.trim() || !pushMsg.trim() || alertSending}
                  onClick={async () => {
                    setAlertSending(true);
                    try {
                      await apiClient.post('/api/admin/push', { targetEmail: pushEmail.trim(), title: pushTitle.trim() || '낚시GO 알림', message: pushMsg.trim() }); // ✅ WARN-AD1: 오타 수정
                      addToast(`🔔 ${pushEmail}님께 푸시 발송 완료!`, 'success');
                      setPushEmail(''); setPushTitle(''); setPushMsg('');
                    } catch (err) { addToast(err.response?.data?.error || '발송 실패', 'error'); }
                    finally { setAlertSending(false); }
                  }}
                  style={{ padding: '13px', border: 'none', borderRadius: '12px', background: pushEmail.trim() && pushMsg.trim() ? 'linear-gradient(135deg,#64B5F6,#0056D2)' : 'rgba(255,255,255,0.06)', color: pushEmail.trim() && pushMsg.trim() ? '#fff' : 'rgba(255,255,255,0.25)', fontWeight: '950', fontSize: '14px', cursor: pushEmail.trim() && pushMsg.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                >
                  <Send size={16} />{alertSending ? '발송 중...' : '개인 푸시 발송'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
