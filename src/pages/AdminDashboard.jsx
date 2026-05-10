import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, CreditCard, DollarSign, RefreshCw, AlertCircle, BellRing, Send, MessageSquare, CheckCircle, Clock, ChevronDown, ChevronUp, Filter, Wifi, WifiOff, UserCheck, UserPlus, Activity } from 'lucide-react';
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
  // ✅ FIX-ADMIN: 4중 보장 (id/email/gmail/MASTER tier) — 이전 2중체크로 인해 Gmail 로그인 시 리다이렉트 버그 수정
  const isAdmin = useUserStore((state) =>
    state.user?.id === ADMIN_ID ||
    state.user?.email === ADMIN_EMAIL ||
    state.user?.email === 'sunjulab.k@gmail.com' ||
    state.userTier === 'MASTER'
  );

  const addToast = useToastStore((s) => s.addToast);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [userStatsLoading, setUserStatsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true); // ✅ REALTIME-FIX: 진입 시 개시 자동갱신

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
      const [revenueRes, userStatsRes] = await Promise.allSettled([
        apiClient.get('/api/admin/revenue'),
        apiClient.get('/api/admin/user-stats'),
      ]);
      if (revenueRes.status === 'fulfilled') setStats(revenueRes.value.data);
      else setError(revenueRes.reason?.response?.data?.error || '수익 데이터 로드 실패');
      if (userStatsRes.status === 'fulfilled') setUserStats(userStatsRes.value.data);
    } catch (err) {
      setError(err.response?.data?.error || '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = useCallback(async () => {
    setUserStatsLoading(true);
    try {
      const res = await apiClient.get('/api/admin/user-stats');
      setUserStats(res.data);
    } catch { /* 무시 */ }
    finally { setUserStatsLoading(false); }
  }, []);

  // 자동 새로고침 (30초 간격)
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchUserStats, 30_000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchUserStats]);

  // 심플 바 차트 (recharts 없이 CSS로 구현)
  const planBreakdown = stats?.planBreakdown || {};
  const maxPlanRevenue = Math.max(...Object.values(planBreakdown).map(p => p.revenue || 0), 1);

  return (
    <div style={{ minHeight: '100dvh', background: '#070B14', color: '#fff', fontFamily: 'Pretendard, sans-serif', paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))' }}>
      {/* 헤더 — ✅ SAFE-AREA: 상단 상태바 자동 회피 */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#070B14', position: 'sticky', top: 0, zIndex: 100 }}>
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

        {/* ── 사용자 현황 통계 (userStats 독립 조건 — stats 실패해도 표시) ── */}
        {userStats && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>👥 사용자 현황</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => setAutoRefresh(r => !r)} style={{ background: autoRefresh ? 'rgba(0,196,140,0.2)' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', color: autoRefresh ? '#00C48C' : 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: '800' }}>
                  {autoRefresh ? '🔴 자동갱신 중' : '⏸ 자동갱신'}
                </button>
                <button onClick={fetchUserStats} disabled={userStatsLoading} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={11} />{userStatsLoading ? '...' : '갱신'}
                </button>
              </div>
            </div>
            {/* 주요 지표 3개 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
              <div style={{ background: 'rgba(100,181,246,0.08)', border: '1px solid rgba(100,181,246,0.2)', borderRadius: '14px', padding: '14px 10px', textAlign: 'center' }}>
                <Users size={18} color="#64B5F6" style={{ marginBottom: '6px' }} />
                <div style={{ fontSize: '22px', fontWeight: '950', color: '#fff', lineHeight: 1 }}>{(userStats.totalUsers || 0).toLocaleString()}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginTop: '4px' }}>전체 가입자</div>
              </div>
              <div style={{ background: 'rgba(0,196,140,0.08)', border: '1px solid rgba(0,196,140,0.25)', borderRadius: '14px', padding: '14px 10px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '6px', right: '8px', width: '7px', height: '7px', borderRadius: '50%', background: '#00C48C', boxShadow: '0 0 0 2px rgba(0,196,140,0.3)', animation: 'pulse 2s infinite' }} />
                <Wifi size={18} color="#00C48C" style={{ marginBottom: '6px' }} />
                <div style={{ fontSize: '22px', fontWeight: '950', color: '#00C48C', lineHeight: 1 }}>{userStats.onlineNow || 0}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginTop: '4px' }}>현재 접속 중</div>
                <div style={{ fontSize: '9px', color: 'rgba(0,196,140,0.6)', fontWeight: '600' }}>5분 이내 활동</div>
              </div>
              <div style={{ background: 'rgba(255,90,95,0.08)', border: '1px solid rgba(255,90,95,0.2)', borderRadius: '14px', padding: '14px 10px', textAlign: 'center' }}>
                <WifiOff size={18} color="#FF5A5F" style={{ marginBottom: '6px' }} />
                <div style={{ fontSize: '22px', fontWeight: '950', color: '#FF5A5F', lineHeight: 1 }}>{(userStats.offlineUsers || 0).toLocaleString()}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginTop: '4px' }}>미접속 (24h)</div>
              </div>
            </div>
            {/* 보조 지표 2개 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={16} color="#FFD700" />
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '950', color: '#FFD700' }}>{userStats.onlineToday || 0}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>오늘 접속자</div>
                </div>
              </div>
              <div style={{ background: 'rgba(255,155,38,0.06)', border: '1px solid rgba(255,155,38,0.15)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserPlus size={16} color="#FF9B26" />
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '950', color: '#FF9B26' }}>{userStats.newUsers7d || 0}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>신규 가입 (7일)</div>
                </div>
              </div>
            </div>
            {/* 티어별 분포 미니 바 */}
            {userStats.tierBreakdown && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>플랜별 가입자</div>
                {[
                  ['FREE',          '무료',           '#8E8E93'],
                  ['BUSINESS_LITE', '라이트',         '#64B5F6'],
                  ['PRO',           '프로',           '#00C48C'],
                  ['BUSINESS_VIP',  'VIP',            '#FFD700'],
                  ['MASTER',        '마스터',         '#FF9B26'],
                ].map(([tier, label, color]) => {
                  const cnt = userStats.tierBreakdown[tier] || 0;
                  const pct = userStats.totalUsers > 0 ? Math.round(cnt / userStats.totalUsers * 100) : 0;
                  return (
                    <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ width: '68px', flexShrink: 0 }}>
                        <div style={{ fontSize: '10px', fontWeight: '900', color }}>{label}</div>
                        <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.25)', fontWeight: '600' }}>{tier}</div>
                      </div>
                      <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: cnt > 0 ? color : 'rgba(255,255,255,0.3)', fontWeight: '900', minWidth: '28px', textAlign: 'right' }}>{cnt}명</span>
                    </div>
                  );
                })}
                {/* DB 원시 티어 디버그 — 예상 밖의 티어명 발견 시 표시 */}
                {userStats.rawTiers && Object.keys(userStats.rawTiers).some(r => !['FREE','BUSINESS_LITE','PRO','BUSINESS_VIP','MASTER'].includes(r)) && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: '#FF5A5F', marginBottom: '4px' }}>⚠️ DB 원시 티어 (정규화 필요)</div>
                    {Object.entries(userStats.rawTiers)
                      .filter(([r]) => !['FREE','BUSINESS_LITE','PRO','BUSINESS_VIP','MASTER'].includes(r))
                      .map(([raw, cnt]) => (
                        <div key={raw} style={{ fontSize: '9px', color: 'rgba(255,100,100,0.7)', fontWeight: '700' }}>{raw}: {cnt}명</div>
                      ))
                    }
                  </div>
                )}
              </div>
            )}
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

        {/* ══ CS 1:1 문의 관리 패널 ══ */}
        <CsAdminPanel addToast={addToast} />

      </div>
    </div>
  );
}

/* ─── CS 문의 관리 컴포넌트 (마스터 전용) ─── */
const STATUS_CFG = {
  pending:  { label: '답변 대기', color: '#FF9B26', bg: 'rgba(255,155,38,0.15)' },
  answered: { label: '답변 완료', color: '#00C48C', bg: 'rgba(0,196,140,0.12)' },
  closed:   { label: '처리 완료', color: '#8E8E93', bg: 'rgba(142,142,147,0.15)' },
};
const CATS = ['전체', '일반 문의', '서비스 오류', '결제/구독', '계정 문의', '건의사항', '신고/제재', '기타'];

function CsAdminPanel({ addToast }) {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [filterCat, setFilterCat] = useState('전체');
  const [filterSt, setFilterSt]   = useState('all');  // all | pending | answered
  const [expandId, setExpandId]   = useState(null);
  const [replyMap, setReplyMap]   = useState({});     // id → reply text
  const [sendingId, setSendingId] = useState(null);
  const [showFilter, setShowFilter] = useState(false);

  const [csError, setCsError] = useState(false); // ✅ FIX-CS: 토스트 대신 인라인 에러 상태

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/cs/inquiries');
      setItems(Array.isArray(res.data) ? res.data : []);
      setCsError(false);
    } catch {
      // ✅ FIX-CS: 60초 폴링 실패 시 매번 토스트 대신 인라인 표시
      setCsError(true);
    }
    finally { setLoading(false); }
  }, []);

  // ✅ REALTIME-FIX: 마운트 시 즉시 fetch + 60초 자동 폴링
  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const sendReply = async (id) => {
    const reply = (replyMap[id] || '').trim();
    if (!reply) { addToast('답변 내용을 입력하세요.', 'error'); return; }
    setSendingId(id);
    try {
      await apiClient.put(`/api/cs/inquiry/${id}/reply`, { reply });
      addToast('✅ 답변이 등록되었습니다.', 'success');
      setReplyMap(m => ({ ...m, [id]: '' }));
      setExpandId(null);
      fetchAll();
    } catch (err) { addToast(err.response?.data?.error || '답변 실패', 'error'); }
    finally { setSendingId(null); }
  };

  const filtered = items.filter(i => {
    const catOk = filterCat === '전체' || i.category === filterCat;
    const stOk  = filterSt === 'all' || i.status === filterSt;
    return catOk && stOk;
  });

  const pendingCnt = items.filter(i => i.status === 'pending').length;

  const inp = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '11px 14px', color: '#fff', fontSize: '13px', fontWeight: '700', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };

  return (
    <div style={{ marginTop: '24px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', overflow: 'hidden' }}>
      {/* 헤더 */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquare size={18} color="#64B5F6" />
          <span style={{ fontSize: '14px', fontWeight: '900', color: '#fff' }}>1:1 고객문의 관리</span>
          {pendingCnt > 0 && (
            <span style={{ background: '#FF5A5F', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '2px 8px', borderRadius: '20px' }}>
              미답변 {pendingCnt}건
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowFilter(f => !f)} style={{ background: showFilter ? 'rgba(100,181,246,0.2)' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '10px', padding: '7px 12px', cursor: 'pointer', color: '#64B5F6', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '800' }}>
            <Filter size={13} /> 필터
          </button>
          <button onClick={fetchAll} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '10px', padding: '7px 12px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '800' }}>
            <RefreshCw size={13} /> 새로고침
          </button>
        </div>
      </div>

      {/* 필터 패널 */}
      {showFilter && (
        <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['all', 'pending', 'answered'].map(s => (
              <button key={s} onClick={() => setFilterSt(s)}
                style={{ padding: '5px 12px', borderRadius: '10px', border: 'none', fontSize: '11px', fontWeight: '900', cursor: 'pointer',
                  background: filterSt === s ? '#64B5F6' : 'rgba(255,255,255,0.08)',
                  color: filterSt === s ? '#0d1b3e' : 'rgba(255,255,255,0.55)' }}>
                {s === 'all' ? '전체' : s === 'pending' ? '⏳ 대기' : '✅ 완료'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setFilterCat(c)}
                style={{ padding: '5px 12px', borderRadius: '10px', border: 'none', fontSize: '11px', fontWeight: '900', cursor: 'pointer',
                  background: filterCat === c ? '#FFD700' : 'rgba(255,255,255,0.08)',
                  color: filterCat === c ? '#1A1A2E' : 'rgba(255,255,255,0.55)' }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 목록 */}
      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading && <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>불러오는 중...</div>}
        {!loading && csError && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,90,95,0.7)', fontSize: '12px', border: '1px dashed rgba(255,90,95,0.2)', borderRadius: '12px', fontWeight: '700' }}>
            ⚠️ 문의 목록을 불러오지 못했습니다. <button onClick={fetchAll} style={{ background: 'none', border: 'none', color: '#64B5F6', cursor: 'pointer', fontWeight: '800', fontSize: '12px' }}>재시도</button>
          </div>
        )}
        {!loading && !csError && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.3)', fontSize: '13px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>문의 내역이 없습니다.</div>
        )}
        {filtered.map(item => {
          const cfg = STATUS_CFG[item.status] || STATUS_CFG.pending;
          const isExp = expandId === item.id;
          return (
            <div key={item.id} style={{ border: `1px solid ${item.status === 'pending' ? 'rgba(255,155,38,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '14px', overflow: 'hidden' }}>
              {/* 항목 헤더 */}
              <div onClick={() => setExpandId(isExp ? null : item.id)}
                style={{ padding: '12px 14px', cursor: 'pointer', background: item.status === 'pending' ? 'rgba(255,155,38,0.05)' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '5px' }}>
                    <span style={{ fontSize: '9px', background: 'rgba(100,181,246,0.2)', color: '#64B5F6', padding: '2px 7px', borderRadius: '6px', fontWeight: '800' }}>{item.category}</span>
                    <span style={{ fontSize: '9px', background: cfg.bg, color: cfg.color, padding: '2px 7px', borderRadius: '6px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {item.status === 'pending' ? <Clock size={9}/> : <CheckCircle size={9}/>}{cfg.label}
                    </span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{item.nickname || item.authorEmail}</span>
                    {item.phone && <span style={{ fontSize: '10px', color: '#FFD700', fontWeight: '700' }}>📞 {item.phone}</span>}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#fff' }}>{item.title}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: '600', marginTop: '3px' }}>
                    {item.realName && `${item.realName} · `}{new Date(item.createdAt).toLocaleString('ko-KR')} · {item.id}
                  </div>
                </div>
                {isExp ? <ChevronUp size={16} color="rgba(255,255,255,0.4)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.4)" />}
              </div>

              {/* 상세 패널 */}
              {isExp && (
                <div style={{ padding: '14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  {/* 문의 내용 */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#64B5F6', marginBottom: '6px' }}>📝 문의 내용</div>
                    <pre style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontFamily: 'inherit', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6 }}>{item.content}</pre>
                  </div>

                  {/* 기존 답변 표시 */}
                  {item.reply && (
                    <div style={{ background: 'rgba(0,196,140,0.1)', border: '1px solid rgba(0,196,140,0.25)', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#00C48C', marginBottom: '6px' }}>✅ 등록된 답변 · {new Date(item.repliedAt).toLocaleString('ko-KR')}</div>
                      <pre style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontFamily: 'inherit', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6 }}>{item.reply}</pre>
                    </div>
                  )}

                  {/* 답변 작성 */}
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
                      {item.reply ? '✏️ 답변 수정' : '💬 답변 작성'}
                    </div>
                    <textarea
                      value={replyMap[item.id] || ''}
                      onChange={e => setReplyMap(m => ({ ...m, [item.id]: e.target.value }))}
                      placeholder={item.reply ? '수정할 답변을 입력하세요...' : '고객 문의에 대한 답변을 입력하세요...\n\n안녕하세요, 낚시GO 운영팀입니다.\n\n'}
                      rows={5}
                      style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
                    />
                    <button
                      onClick={() => sendReply(item.id)}
                      disabled={sendingId === item.id || !(replyMap[item.id] || '').trim()}
                      style={{ marginTop: '8px', width: '100%', padding: '12px', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', transition: 'all 0.2s',
                        background: (replyMap[item.id] || '').trim() ? 'linear-gradient(135deg, #00C48C, #00897B)' : 'rgba(255,255,255,0.06)',
                        color: (replyMap[item.id] || '').trim() ? '#fff' : 'rgba(255,255,255,0.25)' }}>
                      <Send size={14} />{sendingId === item.id ? '전송 중...' : '답변 등록'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 통계 요약 */}
      {items.length > 0 && (
        <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '16px' }}>
          {[['전체', items.length, '#fff'], ['미답변', pendingCnt, '#FF9B26'], ['완료', items.filter(i=>i.status==='answered').length, '#00C48C']].map(([l, v, c]) => (
            <div key={l} style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.4)' }}>
              {l}: <span style={{ color: c, fontWeight: '900' }}>{v}건</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
