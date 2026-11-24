import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, CreditCard, DollarSign, RefreshCw, AlertCircle, BellRing, Send, MessageSquare, CheckCircle, Clock, ChevronDown, ChevronUp, Filter, Wifi, UserPlus, Eye } from 'lucide-react';
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
        <span style={{ fontSize: `calc(12px * var(--fs, 1))`, color: 'rgba(255,255,255,0.45)', fontWeight: '700' }}>{label}</span>
        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div style={{ fontSize: `calc(26px * var(--fs, 1))`, fontWeight: '950', color: '#fff', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  // ✅ 4중 보장 (id/email/gmail/MASTER tier)
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

  // ✅ 알림 관련 state
  const [alertState, setAlertState] = useState({
    tab: 'broadcast', sending: false,
    msg: '', location: '',
    pushEmail: '', pushTitle: '', pushMsg: '',
  });

  // 쇼핑 상품 수동 등록 관련 로직 삭제 (Shop 탭으로 통합)

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
  useEffect(() => {
    // ✅ NEW-A5: setTimeout(0)으로 Zustand hydration 완료 대기
    // 핵심: isAdmin이 false→true 로 업데이트될 때 cleanup이 기존 타이머 취소 후 재실행 → 통과
    const t = setTimeout(() => {
      if (!isAdmin) { navigate('/'); return; }
      setAuthChecked(true);
      fetchStats();
    }, 0);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, navigate]);


  const fetchUserStats = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/admin/user-stats');
      setUserStats(res.data);
    } catch { /* 무시 */ }
  }, []);

  // ✅ INSTALL-PWA: 홈 화면 추가·앱 설치 안내 집계(최근 28일)
  const [installStat, setInstallStat] = useState(null);
  useEffect(() => {
    if (!authChecked) return;
    apiClient.get('/api/admin/install-events').then(r => setInstallStat(r.data)).catch(() => {});
  }, [authChecked]);

  // 자동 새로고침 (30초 간격, 관리자 확인 후에만)
  useEffect(() => {
    if (!authChecked) return;
    const id = setInterval(fetchUserStats, 30_000);
    return () => clearInterval(id);
  }, [authChecked, fetchUserStats]);

  // 심플 바 차트 (recharts 없이 CSS로 구현)
  const planBreakdown = stats?.planBreakdown || {};
  const maxPlanRevenue = Math.max(...Object.values(planBreakdown).map(p => p.revenue || 0), 1);

  // ✅ DASH-CLEAN(2026-11-11): 판매 중인 플랜만 표시 (PRO·VIP 판매 종료, MASTER는 관리자라 제외)
  // ✅ DASH-V2(2026-11-24): '라이트' 폐지 → 지금 파는 상품(PRO 멤버십) 기준. 무료는 막대 없이 숫자만
  const PLAN_ROWS = [
    ['BUSINESS_LITE', 'PRO 멤버십', '#64B5F6', true,  '월 9,900원 · 판매 중'],
    ['PRO',           '예전 PRO',   '#8E8E93', false, '판매종료'],
    ['BUSINESS_VIP',  'VIP',        '#8E8E93', false, '판매종료'],
    ['CAPTAIN',       '캡틴',       '#FF9B26', false, '무료 권한 · 매출 제외'],
  ];
  const tierBreakdown = userStats?.tierBreakdown || {};
  const PAY_PLAN_LABEL = { BASIC: 'PRO 멤버십', LITE: 'PRO 멤버십', BUSINESS_LITE: 'PRO 멤버십', PRO: '기존 PRO', VVIP: 'VIP', BUSINESS_VIP: 'VIP' }; // ✅ PRO-9900
  const fmt = (v) => (typeof v === 'number' ? v.toLocaleString() : '-');
  const maskId = (id) => { const s = String(id || ''); return s.length > 8 ? `${s.slice(0, 6)}…` : (s || '알 수 없음'); };
  const sectionTitle = { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '800', color: 'rgba(255,255,255,0.5)', margin: '0 0 10px' };
  const Tile = ({ icon: Icon, color, value, label, sub }) => (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={17} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: `calc(20px * var(--fs, 1))`, fontWeight: '950', color: '#fff', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.45)', fontWeight: '700', marginTop: '3px' }}>{label}</div>
        {sub && <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>{sub}</div>}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', background: '#070B14', color: '#fff', fontFamily: 'Pretendard, sans-serif', paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))' }}>
      {/* 헤더 — ✅ SAFE-AREA: 상단 상태바 자동 회피 */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#070B14', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => window.history.length <= 1 ? navigate('/', { replace: true }) : navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={22} color="#fff" />
          </button>
          <span style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '950' }}>수익 대시보드</span>
        </div>
        {/* ✅ DASH-CLEAN: 새로고침 버튼 하나로 통합 (사용자 현황은 30초마다 자동 갱신) */}
        <button onClick={fetchStats} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800' }}>
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
            <p style={{ margin: 0, fontSize: `calc(13px * var(--fs, 1))`, color: '#FF5A5F', fontWeight: '800' }}>{error}</p>
          </div>
        )}

        {/* ── 1. 매출 (DASH-V2: 이번 달 매출을 가장 크게) ── */}
        {stats && !loading && (
          <div style={{ marginBottom: '14px' }}>
            <div style={sectionTitle}>매출</div>
            <div style={{ background: 'rgba(100,181,246,0.10)', border: '1.5px solid rgba(100,181,246,0.45)', borderRadius: '16px', padding: '18px' }}>
              <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: 'rgba(255,255,255,0.55)', fontWeight: '800' }}>이번 달 매출</div>
              <div style={{ fontSize: `calc(34px * var(--fs, 1))`, fontWeight: '950', color: '#fff', lineHeight: 1.15, margin: '4px 0 14px' }}>{(stats.monthRevenue || 0).toLocaleString()}원</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.10)', paddingTop: '12px' }}>
                {[
                  ['누적 매출', `${(stats.totalRevenue || 0).toLocaleString()}원`],
                  ['결제 회원', `${stats.activePaidUsers || 0}명`],
                  ['결제 전환율', userStats?.totalUsers > 0 ? `${((stats.activePaidUsers || 0) / userStats.totalUsers * 100).toFixed(1)}%` : '-'],
                ].map(([k, v]) => (
                  <div key={k} style={{ minWidth: 0 }}>
                    <div style={{ fontSize: `calc(10.5px * var(--fs, 1))`, color: 'rgba(255,255,255,0.45)', fontWeight: '700' }}>{k}</div>
                    <div style={{ fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '900', color: '#fff', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: 'rgba(255,255,255,0.35)', fontWeight: '700', marginTop: '8px' }}>결제 회원 = 최근 31일 Google 확인을 통과한 실제 결제 · 누적 결제자 {stats.paidUsers || 0}명</div>
            </div>
            {/* ✅ DASH-V2: 확인 대기는 눈에 띄는 노란 카드로 (0건이면 숨김) */}
            {stats.unverifiedCount > 0 && (
              <div style={{ marginTop: '10px', background: 'rgba(255,193,7,0.10)', border: '1px solid rgba(255,193,7,0.45)', borderRadius: '14px', padding: '12px 14px' }}>
                <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: '#FFD54F' }}>결제사 확인 대기 {stats.unverifiedCount}건 · {(stats.unverifiedAmount || 0).toLocaleString()}원</div>
                <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.5)', fontWeight: '700', marginTop: '3px' }}>Google 확인이 끝나면 매출로 옮겨집니다 (지금은 합계에서 제외)</div>
              </div>
            )}
          </div>
        )}

        {/* ── 2. 유료 회원 (DASH-V2) ── */}
        {userStats?.tierBreakdown && (
          <div style={{ marginBottom: '24px', marginTop: '20px' }}>
            <div style={sectionTitle}>유료 회원</div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '4px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {PLAN_ROWS.filter(([tier, , , onSale]) => onSale || (tierBreakdown[tier] || 0) > 0).map(([tier, label, color, onSale, sub], idx) => {
                const cnt = tierBreakdown[tier] || 0;
                return (
                  <div key={tier} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '12px 0', borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', color: onSale ? color : '#fff' }}>{label}</div>
                      <div style={{ fontSize: `calc(10.5px * var(--fs, 1))`, color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginTop: '2px' }}>{sub}</div>
                    </div>
                    <span style={{ fontSize: `calc(17px * var(--fs, 1))`, color: cnt > 0 ? '#fff' : 'rgba(255,255,255,0.35)', fontWeight: '950', flexShrink: 0 }}>{cnt}명</span>
                  </div>
                );
              })}
              {/* DB 원시 티어 경고 — 예상 밖의 티어명이 있을 때만 표시 */}
              {userStats.rawTiers && Object.keys(userStats.rawTiers).some(r => !['FREE','BUSINESS_LITE','PRO','BUSINESS_VIP','MASTER','CAPTAIN'].includes(r)) && (
                <div style={{ padding: '8px 0 10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', color: '#FF5A5F', marginBottom: '4px' }}>⚠️ 정리가 필요한 티어 값</div>
                  {Object.entries(userStats.rawTiers)
                    .filter(([r]) => !['FREE','BUSINESS_LITE','PRO','BUSINESS_VIP','MASTER','CAPTAIN'].includes(r))
                    .map(([raw, cnt]) => (
                      <div key={raw} style={{ fontSize: `calc(10px * var(--fs, 1))`, color: 'rgba(255,100,100,0.7)', fontWeight: '700' }}>{raw}: {cnt}명</div>
                    ))
                  }
                </div>
              )}
            </div>
            <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginTop: '6px' }}>무료 회원 {fmt(tierBreakdown.FREE || 0)}명</div>
          </div>
        )}

        {/* ── 3. 방문·가입 (DASH-V2: 한 줄로 작게) ── */}
        {userStats && (
          <div style={{ marginBottom: '24px' }}>
            <div style={sectionTitle}>방문·가입</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '12px 6px' }}>
              {[
                ['오늘 방문', userStats.todayVisitors, `누적 ${fmt(userStats.totalVisitors)}`],
                ['지금 접속', userStats.onlineNow || 0, '60분 이내'],
                ['전체 가입', userStats.totalUsers || 0, null],
                ['신규 가입', userStats.newUsers7d || 0, '최근 7일'],
              ].map(([k, v, sub]) => (
                <div key={k} style={{ textAlign: 'center', minWidth: 0 }}>
                  <div style={{ fontSize: `calc(17px * var(--fs, 1))`, fontWeight: '950', color: '#fff' }}>{fmt(v)}</div>
                  <div style={{ fontSize: `calc(10.5px * var(--fs, 1))`, color: 'rgba(255,255,255,0.5)', fontWeight: '800', marginTop: '2px' }}>{k}</div>
                  {sub && <div style={{ fontSize: `calc(9.5px * var(--fs, 1))`, color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>{sub}</div>}
                </div>
              ))}
            </div>
            {installStat?.total && (
              <div style={{ marginTop: '8px', fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.45)', fontWeight: '700' }}>
                📲 홈 화면 추가 안내 · 최근 28일 노출 {fmt(installStat.total.shown)} · 누름 {fmt(installStat.total.click)} · 설치 {fmt(installStat.total.installed)}
              </div>
            )}
          </div>
        )}

        {/* ── 4. 플랜별 수익 (데이터 있을 때만) ── */}
        {stats && !loading && Object.keys(planBreakdown).length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={sectionTitle}>플랜별 수익</div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {Object.entries(planBreakdown).map(([plan, data]) => (
                <div key={plan} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', color: PLAN_COLOR[plan] || '#fff' }}>{PAY_PLAN_LABEL[plan] || plan}</span>
                    <span style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', color: '#fff' }}>
                      {(data.revenue || 0).toLocaleString()}원 <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>({data.count}건)</span>
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${((data.revenue || 0) / maxPlanRevenue) * 100}%`, background: PLAN_COLOR[plan] || '#64B5F6', borderRadius: '3px', transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 5. 최근 결제 (5건) ── */}
        {stats && !loading && stats.recentPayments?.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <div style={sectionTitle}>최근 결제 (결제사 확인분)</div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              {stats.recentPayments.slice(0, 5).map((p, i) => {
                const meta = [PAY_PLAN_LABEL[p.planId] || p.planId, PG_LABEL[p.pgProvider] || p.pgProvider, p.createdAt ? new Date(p.createdAt).toLocaleDateString('ko-KR') : null].filter(Boolean).join(' · ');
                const ok = p.status === 'paid';
                return (
                  <div key={String(p._id || p.merchant_uid || i)} style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: '#fff' }}>{p.userName || maskId(p.userId)}</div>
                      <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginTop: '2px' }}>{meta}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '950', color: ok ? '#00C48C' : '#FF5A5F' }}>{(p.amount || 0).toLocaleString()}원</div>
                      <div style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', color: ok ? 'rgba(0,196,140,0.8)' : '#FF5A5F', marginTop: '2px' }}>
                        {ok ? '완료' : p.status === 'failed' ? '실패' : p.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ✅ LOW-1: 관리자 알림 발송 패널 */}
        <div style={{ marginTop: '24px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BellRing size={18} color="#FFD700" />
            <span style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', color: '#fff' }}>실시간 알림 발송</span>
          </div>
          {/* 탭 */}
          <div style={{ display: 'flex', padding: '12px 18px 0', gap: '8px' }}>
            {[{ id: 'broadcast', label: '무선 전체' }, { id: 'push', label: '개인 푸시' }].map(t => (
              <button key={t.id} onClick={() => setAlertTab(t.id)} style={{ padding: '6px 14px', borderRadius: '10px', border: 'none', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer', background: alertTab === t.id ? '#FFD700' : 'rgba(255,255,255,0.08)', color: alertTab === t.id ? '#1A1A2E' : 'rgba(255,255,255,0.5)', transition: 'all 0.15s' }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '14px 18px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alertTab === 'broadcast' ? (
              <>
                <input value={alertMsg} onChange={e => setAlertMsg(e.target.value)} placeholder="알림 메시지 (ex: 서검 한치 조황 폭발화!)" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700', outline: 'none' }} />
                <input value={alertLocation} onChange={e => setAlertLocation(e.target.value)} placeholder="위치 (ex: 서검도 갯바위, 선택사항)" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700', outline: 'none' }} /> {/* ✅ 30TH-C3: '갌바위' → '갯바위' 오타 수정 */}
                <button
                  disabled={!alertMsg.trim() || alertSending}
                  onClick={async () => {
                    setAlertSending(true);
                    try {
                      await apiClient.post('/api/admin/alert', { message: alertMsg.trim(), location: alertLocation.trim() });
                      // ENH3-B6: '낚시' → '낚시' 오타 수정
                      addToast('🔔 전체 낚시 알림 발송 완료!', 'success');
                      setAlertMsg(''); setAlertLocation('');
                    } catch (err) { addToast(err.response?.data?.error || '발송 실패', 'error'); }
                    finally { setAlertSending(false); }
                  }}
                  style={{ padding: '13px', border: 'none', borderRadius: '12px', background: alertMsg.trim() ? 'linear-gradient(135deg,#FFD700,#FF9B26)' : 'rgba(255,255,255,0.06)', color: alertMsg.trim() ? '#1A1A2E' : 'rgba(255,255,255,0.25)', fontWeight: '950', fontSize: `calc(14px * var(--fs, 1))`, cursor: alertMsg.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                >
                  <Send size={16} />{alertSending ? '발송 중...' : '전체 알림 발송'}
                </button>
              </>
            ) : (
              <>
                <input value={pushEmail} onChange={e => setPushEmail(e.target.value)} placeholder="대상 이메일" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700', outline: 'none' }} />
                <input value={pushTitle} onChange={e => setPushTitle(e.target.value)} placeholder="알림 제목 (선택)" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700', outline: 'none' }} />
                <input value={pushMsg} onChange={e => setPushMsg(e.target.value)} placeholder="개인 메시지" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700', outline: 'none' }} />
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
                  style={{ padding: '13px', border: 'none', borderRadius: '12px', background: pushEmail.trim() && pushMsg.trim() ? 'linear-gradient(135deg,#64B5F6,#0056D2)' : 'rgba(255,255,255,0.06)', color: pushEmail.trim() && pushMsg.trim() ? '#fff' : 'rgba(255,255,255,0.25)', fontWeight: '950', fontSize: `calc(14px * var(--fs, 1))`, cursor: pushEmail.trim() && pushMsg.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                >
                  <Send size={16} />{alertSending ? '발송 중...' : '개인 푸시 발송'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ══ CS 1:1 문의 관리 패널 ══ */}
        <CsAdminPanel addToast={addToast} />

        {/* ══ 결제했는데 등급이 안 붙은 사용자 복구 (Google 결제 확인 후 적용) ══ */}
        <IapRecoverPanel addToast={addToast} />

        {/* ══ 불법 tier 강제 복원 패널 ══ */}
        <ForceTierPanel addToast={addToast} />

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
const CATS = ['전체', '일반 문의', '서비스 오류', '결제/구독', '계정 문의', '건의사항', '협업·제휴 제안', '신고/제재', '기타'];

function CsAdminPanel({ addToast }) {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [filterCat, setFilterCat] = useState('전체');
  const [filterSt, setFilterSt]   = useState('all');  // all | pending | answered
  const [expandId, setExpandId]   = useState(null);
  const [replyMap, setReplyMap]   = useState({});     // build: 2026-05-31 cache-bust
  const [sendingId, setSendingId] = useState(null);
  const [showFilter, setShowFilter] = useState(false);

  const [csError, setCsError] = useState(false); // ✅ FIX-CS: 토스트 대신 인라인 에러 상태
  const [dmStat, setDmStat] = useState(null);     // ✅ CS-DM: 인스타 DM 버튼 누른 횟수(최근 28일)
  const [csOpen, setCsOpen] = useState(false);    // ✅ DASH-V2: 일반 문의는 인스타 DM으로 → 앱 문의(결제·계정·신고)는 접어서 한 줄로

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/cs/inquiries');
      setItems(Array.isArray(res.data) ? res.data : []);
      setCsError(false);
      apiClient.get('/api/admin/cs/dm-clicks').then(r => setDmStat(r.data)).catch(() => {}); // ✅ CS-DM
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

  if (!csOpen) {
    return (
      <button onClick={() => setCsOpen(true)} style={{ marginTop: '24px', width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${pendingCnt > 0 ? 'rgba(255,90,95,0.45)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '14px', padding: '13px 16px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', textAlign: 'left' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <MessageSquare size={16} color="#64B5F6" />
          <span style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', whiteSpace: 'nowrap' }}>앱 문의</span>
          {pendingCnt > 0 && <span style={{ background: '#FF5A5F', color: '#fff', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', padding: '2px 8px', borderRadius: '20px', whiteSpace: 'nowrap' }}>미답변 {pendingCnt}</span>}
        </span>
        <span style={{ fontSize: `calc(10.5px * var(--fs, 1))`, color: 'rgba(255,255,255,0.4)', fontWeight: '700', whiteSpace: 'nowrap' }}>결제·계정·신고 · 열기 ›</span>
      </button>
    );
  }

  const inp = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '11px 14px', color: '#fff', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };

  return (
    <div style={{ marginTop: '24px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', overflow: 'hidden' }}>
      {/* 헤더 */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquare size={18} color="#64B5F6" />
          <span style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', color: '#fff' }}>앱 문의</span>
          {pendingCnt > 0 && (
            <span style={{ background: '#FF5A5F', color: '#fff', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', padding: '2px 8px', borderRadius: '20px' }}>
              미답변 {pendingCnt}건
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowFilter(f => !f)} style={{ background: showFilter ? 'rgba(100,181,246,0.2)' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '10px', padding: '7px 12px', cursor: 'pointer', color: '#64B5F6', display: 'flex', alignItems: 'center', gap: '5px', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800' }}>
            <Filter size={13} /> 필터
          </button>
          <button onClick={() => setCsOpen(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '10px', padding: '7px 12px', cursor: 'pointer', color: '#fff', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800' }}>접기</button>
          <button onClick={fetchAll} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '10px', padding: '7px 12px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '5px', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800' }}>
            <RefreshCw size={13} /> 새로고침
          </button>
        </div>
      {/* ✅ CS-DM: 인스타그램 DM 문의 버튼 사용량 — 실제 DM은 인스타그램 받은 메시지함(@sunju._.dev)에서 확인 */}
      {dmStat && (
        <div style={{ padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.75)', fontWeight: '700', lineHeight: 1.6 }}>
          📱 인스타 DM 문의 버튼 · 최근 28일 {dmStat.total || 0}회
          {Object.keys(dmStat.byCategory || {}).length > 0 && (
            <span style={{ color: 'rgba(255,255,255,0.5)' }}> ({Object.entries(dmStat.byCategory).map(([k, v]) => `${k} ${v}`).join(' · ')})</span>
          )}
        </div>
      )}
      </div>

      {/* 필터 패널 */}
      {showFilter && (
        <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['all', 'pending', 'answered'].map(s => (
              <button key={s} onClick={() => setFilterSt(s)}
                style={{ padding: '5px 12px', borderRadius: '10px', border: 'none', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer',
                  background: filterSt === s ? '#64B5F6' : 'rgba(255,255,255,0.08)',
                  color: filterSt === s ? '#0d1b3e' : 'rgba(255,255,255,0.55)' }}>
                {s === 'all' ? '전체' : s === 'pending' ? '⏳ 대기' : '✅ 완료'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setFilterCat(c)}
                style={{ padding: '5px 12px', borderRadius: '10px', border: 'none', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer',
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
        {loading && <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.4)', fontSize: `calc(13px * var(--fs, 1))` }}>불러오는 중...</div>}
        {!loading && csError && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,90,95,0.7)', fontSize: `calc(12px * var(--fs, 1))`, border: '1px dashed rgba(255,90,95,0.2)', borderRadius: '12px', fontWeight: '700' }}>
            ⚠️ 문의 목록을 불러오지 못했습니다. <button onClick={fetchAll} style={{ background: 'none', border: 'none', color: '#64B5F6', cursor: 'pointer', fontWeight: '800', fontSize: `calc(12px * var(--fs, 1))` }}>재시도</button>
          </div>
        )}
        {!loading && !csError && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.3)', fontSize: `calc(13px * var(--fs, 1))`, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>문의 내역이 없습니다.</div>
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
                    <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: 'rgba(100,181,246,0.2)', color: '#64B5F6', padding: '2px 7px', borderRadius: '6px', fontWeight: '800' }}>{item.category}</span>
                    <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: cfg.bg, color: cfg.color, padding: '2px 7px', borderRadius: '6px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {item.status === 'pending' ? <Clock size={9}/> : <CheckCircle size={9}/>}{cfg.label}
                    </span>
                    <span style={{ fontSize: `calc(10px * var(--fs, 1))`, color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>
                      {item.nickname ? `${item.nickname} (${item.authorEmail})` : item.authorEmail}
                    </span>
                    {item.phone && <span style={{ fontSize: `calc(10px * var(--fs, 1))`, color: '#FFD700', fontWeight: '700' }}>📞 {item.phone}</span>}
                  </div>
                  <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: '#fff' }}>{item.title}</div>
                  <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: 'rgba(255,255,255,0.35)', fontWeight: '600', marginTop: '3px' }}>
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
                    <div style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', color: '#64B5F6', marginBottom: '6px' }}>📝 문의 내용</div>
                    <pre style={{ fontSize: `calc(12px * var(--fs, 1))`, color: 'rgba(255,255,255,0.8)', fontFamily: 'inherit', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6 }}>{item.content}</pre>
                  </div>

                  {/* 기존 답변 표시 */}
                  {item.reply && (
                    <div style={{ background: 'rgba(0,196,140,0.1)', border: '1px solid rgba(0,196,140,0.25)', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                      <div style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', color: '#00C48C', marginBottom: '6px' }}>✅ 등록된 답변 · {new Date(item.repliedAt).toLocaleString('ko-KR')}</div>
                      <pre style={{ fontSize: `calc(12px * var(--fs, 1))`, color: 'rgba(255,255,255,0.8)', fontFamily: 'inherit', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6 }}>{item.reply}</pre>
                    </div>
                  )}

                  {/* 답변 작성 */}
                  <div>
                    <div style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
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
                      style={{ marginTop: '8px', width: '100%', padding: '12px', border: 'none', borderRadius: '12px', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', transition: 'all 0.2s',
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
            <div key={l} style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '800', color: 'rgba(255,255,255,0.4)' }}>
              {l}: <span style={{ color: c, fontWeight: '900' }}>{v}건</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── IAP-ADMIN-RECOVER(2026-11-25): 결제했는데 등급이 안 붙은 사용자 복구 ─── */
const IAP_STATE_KO = {
  SUBSCRIPTION_STATE_ACTIVE: '사용 중', SUBSCRIPTION_STATE_IN_GRACE_PERIOD: '결제 유예 중', SUBSCRIPTION_STATE_CANCELED: '해지 예약(만료일까지 사용)',
  SUBSCRIPTION_STATE_ON_HOLD: '결제 보류', SUBSCRIPTION_STATE_PAUSED: '일시중지', SUBSCRIPTION_STATE_EXPIRED: '만료', SUBSCRIPTION_STATE_PENDING: '결제 대기',
};
function IapRecoverPanel({ addToast }) {
  const [target, setTarget] = useState('');
  const [orderId, setOrderId] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState(null);
  const [err, setErr] = useState('');
  const inp = { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '10px 12px', color: '#fff', fontSize: `calc(13px * var(--fs, 1))`, outline: 'none' };
  const call = async (dryRun) => {
    const t = target.trim(), o = orderId.trim();
    if (!t || !o) { addToast('사용자와 주문 ID를 모두 입력하세요.', 'error'); return; }
    setBusy(true); setErr(''); if (dryRun) setInfo(null);
    try {
      const res = await apiClient.post('/api/admin/iap-recover', { targetEmail: t, orderId: o, dryRun });
      setInfo(res.data.info || null);
      if (!dryRun) { addToast(`✅ ${res.data.message}`, 'success'); setOrderId(''); }
    } catch (e) {
      setErr(e.response?.data?.error || '확인 실패'); setInfo(e.response?.data?.info || null);
    } finally { setBusy(false); }
  };
  const ok = info && !err;
  return (
    <div style={{ marginTop: '24px', background: 'rgba(100,181,246,0.06)', border: '1px solid rgba(100,181,246,0.25)', borderRadius: '18px', overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(100,181,246,0.15)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>🧾</span>
        <span style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', color: '#64B5F6' }}>결제 확인 후 멤버십 복구</span>
      </div>
      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
          Play Console › 주문 관리에서 주문 ID(GPA.…)를 복사해 넣으세요. Google에서 실제 결제를 확인한 뒤에만 적용되고, 만료일도 Google 기준으로 맞춰집니다.
        </div>
        <input style={inp} placeholder="사용자 이메일 / ID / 닉네임" value={target} onChange={e => setTarget(e.target.value)} />
        <input style={inp} placeholder="주문 ID (GPA.1234-5678-9012-34567)" value={orderId} onChange={e => setOrderId(e.target.value)} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => call(true)} disabled={busy} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px', fontWeight: '800', fontSize: `calc(12px * var(--fs, 1))`, cursor: 'pointer' }}>
            {busy ? '확인 중...' : '① Google에서 확인'}
          </button>
          <button onClick={() => call(false)} disabled={busy || !ok} style={{ flex: 1, background: ok ? '#64B5F6' : 'rgba(100,181,246,0.25)', color: '#0B1F3A', border: 'none', borderRadius: '10px', padding: '10px', fontWeight: '900', fontSize: `calc(12px * var(--fs, 1))`, cursor: ok ? 'pointer' : 'not-allowed' }}>
            ② 멤버십 적용
          </button>
        </div>
        {err && <div style={{ color: '#FF5A5F', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '700' }}>⚠️ {err}</div>}
        {info && (
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px 12px', fontSize: `calc(12px * var(--fs, 1))`, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
            <div>사용자: <b>{info.user?.name || '-'}</b> · {info.user?.email || info.user?.id} · 지금 {TIER_LABEL[info.user?.tier] || info.user?.tier}</div>
            <div>상품: <b>{info.plan}</b> · 상태: {IAP_STATE_KO[info.state] || info.state}{info.isTest ? ' · 테스트 결제' : ''}</div>
            <div>만료: {info.expiresAt ? new Date(info.expiresAt).toLocaleString('ko-KR') : '-'} · 결제 확인(ack): {info.acknowledged ? '완료' : <span style={{ color: '#FF9B26' }}>안 됨 → 적용 시 처리(안 하면 3일 뒤 자동 환불)</span>}</div>
            {info.accountMatch === true && <div style={{ color: '#00C48C' }}>앱 결제 때 기록된 계정과 일치</div>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 강제 Tier 변경 패널 (불법 획득 tier 복원) ─── */
const TIER_COLOR = { FREE: '#8E8E93', BUSINESS_LITE: '#64B5F6', PRO: '#00C48C', BUSINESS_VIP: '#FFD700', MASTER: '#FF9B26' };
const TIER_LABEL = { FREE: 'FREE', BUSINESS_LITE: 'PRO 멤버십', PRO: '예전 PRO', BUSINESS_VIP: 'VIP', CAPTAIN: 'CAPTAIN', MASTER: 'MASTER' }; // ✅ DASH-V2

function ForceTierPanel({ addToast }) {
  const [target, setTarget] = useState('');
  const [tier, setTier] = useState('FREE');
  const [loading, setLoading] = useState(false);

  // 의심 계정 목록
  const [suspects, setSuspects] = useState([]);
  const [suspectLoading, setSuspectLoading] = useState(false);
  const [suspectNote, setSuspectNote] = useState('');
  const [granted, setGranted] = useState([]); // ✅ TIER-GRANT-LOG(2026-11-24): 관리자가 직접 준 유료 등급(기록 있음)
  const [resettingId, setResettingId] = useState(null); // 클릭된 계정 row

  const [captains, setCaptains] = useState([]);
  const [captainLoading, setCaptainLoading] = useState(false);

  const loadSuspects = async () => {
    setSuspectLoading(true);
    try {
      const res = await apiClient.get('/api/admin/suspicious-tiers');
      setSuspects(res.data.suspects || []);
      setGranted(res.data.granted || []);
      setSuspectNote(res.data.note || '');
    } catch (err) {
      addToast(err.response?.data?.error || '목록 로드 실패', 'error');
    } finally { setSuspectLoading(false); }
  };

  const loadCaptains = async () => {
    setCaptainLoading(true);
    try {
      const res = await apiClient.get('/api/admin/captains');
      setCaptains(res.data.captains || []);
    } catch (err) {
      addToast(err.response?.data?.error || '목록 로드 실패', 'error');
    } finally { setCaptainLoading(false); }
  };

  // ✅ TIER-GRANT-LOG: 결제 없이 관리자가 준 등급이라고 기록만 남김 (등급은 그대로)
  const markGranted = async (uid) => {
    setResettingId(uid);
    try {
      await apiClient.post('/api/admin/tier-grant-note', { targetEmail: uid });
      addToast('✅ 관리자 지급으로 기록했습니다.', 'success');
      await loadSuspects();
    } catch (err) {
      addToast(err.response?.data?.error || '기록 실패', 'error');
    } finally { setResettingId(null); }
  };

  // 마운트 시 자동 로드
  useEffect(() => { loadSuspects(); loadCaptains(); }, []);

  const handleForce = async (targetEmail, targetTier = tier) => {
    const t = (targetEmail || target).trim();
    if (!t) { addToast('이메일/ID/닉네임 입력 필요', 'error'); return; }
    setLoading(true);
    if (targetEmail) setResettingId(targetEmail);
    try {
      const res = await apiClient.post('/api/admin/force-tier', { targetEmail: t, tier: targetTier });
      addToast(`✅ ${res.data.message}`, 'success');
      if (!targetEmail) setTarget('');
      // 목록에서 제거 후 다시 불러오기(관리자 지급 기록 반영)
      setSuspects(prev => prev.filter(s => s.email !== t && s.id !== t && s.name !== t));
      loadSuspects();
    } catch (err) {
      addToast(err.response?.data?.error || '변경 실패', 'error');
    } finally { setLoading(false); setResettingId(null); }
  };

  return (
    <>
    <div style={{ marginTop: '24px', background: 'rgba(0,196,140,0.06)', border: '1px solid rgba(0,196,140,0.2)', borderRadius: '18px', overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(0,196,140,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>👑</span>
          <span style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', color: '#00C48C' }}>특별 권한(CAPTAIN) 계정 목록</span>
          {captains.length > 0 && (
            <span style={{ background: '#00C48C', color: '#fff', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', padding: '2px 8px', borderRadius: '10px' }}>{captains.length}명</span>
          )}
        </div>
        <button onClick={loadCaptains} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '700', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <RefreshCw size={12} className={captainLoading ? 'spin' : ''} />새로고침
        </button>
      </div>
      <div style={{ padding: '16px 18px' }}>
        {captainLoading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: `calc(12px * var(--fs, 1))` }}>조회 중...</div>
        ) : captains.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', color: '#00C48C', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '700' }}>
            👑 현재 캡틴 권한이 부여된 계정이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {captains.map((u, i) => (
              <div key={u.id || u.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', color: '#fff' }}>{u.name || '이름없음'}</span>
                    <span style={{ fontSize: `calc(10px * var(--fs, 1))`, color: '#00C48C', fontWeight: '800' }}>{u.tier}</span>
                  </div>
                  <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.5)' }}>
                    {u.id !== u.email ? `${u.email} · ` : ''}{u.id} · 부여일: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ko-KR') : '알 수 없음'}
                  </div>
                </div>
                <button
                  onClick={() => handleForce(u.email || u.id, 'FREE')}
                  disabled={resettingId === (u.email || u.id)}
                  style={{ background: '#FF5A5F', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer' }}
                >
                  {resettingId === (u.email || u.id) ? '회수 중...' : '권한 회수 (FREE)'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    <div style={{ marginTop: '24px', background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: '18px', overflow: 'hidden' }}>
      {/* 헤더 */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,59,48,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>🚨</span>
          <span style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', color: '#FF5A5F' }}>불법 Tier 강제 복원</span>
          {suspects.length > 0 && (
            <span style={{ background: '#FF5A5F', color: '#fff', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', padding: '2px 8px', borderRadius: '20px' }}>
              의심 {suspects.length}건
            </span>
          )}
        </div>
        <button onClick={loadSuspects} disabled={suspectLoading}
          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
          🔄 {suspectLoading ? '...' : '새로고침'}
        </button>
      </div>

      {/* 미결제 유료 tier 목록 */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,59,48,0.1)' }}>
        <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginBottom: '10px' }}>
          🔍 결제기록 없이 유료 Tier를 보유한 계정 목록
          {suspectNote && <span style={{ color: '#FF9B26', marginLeft: '6px' }}>({suspectNote})</span>}
        </div>

        {suspectLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.3)', fontSize: `calc(12px * var(--fs, 1))` }}>
            불러오는 중...
          </div>
        ) : suspects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px', color: '#00C48C', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', border: '1px dashed rgba(0,196,140,0.3)', borderRadius: '10px' }}>
            ✅ 의심 계정 없음 — 결제했거나 관리자가 준 등급만 있음
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
            {suspects.map((s, i) => {
              const uid = s.email || s.id || s.name || '?';
              const isResetting = resettingId === uid;
              const joinDate = s.joinedAt ? new Date(s.joinedAt).toLocaleDateString('ko-KR') : '?';
              const expDate = s.expiresAt ? new Date(s.expiresAt).toLocaleDateString('ko-KR') : '없음';
              return (
                <div key={uid + i} style={{
                  background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.25)',
                  borderRadius: '12px', padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  {/* 순위 */}
                  <div style={{ minWidth: '22px', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>{i + 1}</div>

                  {/* 계정 정보 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: '#fff', wordBreak: 'break-all' }}>
                        {s.name || s.id || s.email || '?'}
                      </span>
                      <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: `${TIER_COLOR[s.tier] || '#888'}22`, color: TIER_COLOR[s.tier] || '#888', padding: '2px 7px', borderRadius: '6px', fontWeight: '900', border: `1px solid ${TIER_COLOR[s.tier] || '#888'}55` }}>
                        {TIER_LABEL[s.tier] || s.tier}
                      </span>
                    </div>
                    <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: 'rgba(255,255,255,0.35)', fontWeight: '700' }}>
                      {s.email || s.id} · 가입 {joinDate}
                    </div>
                    <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: '#FF9B26', fontWeight: '700', marginTop: '2px' }}>
                      ⚠️ 결제기록 없음 · 만료 {expDate}
                    </div>
                  </div>

                  {/* ✅ TIER-GRANT-LOG: 내가 직접 준 등급이면 기록으로 남기기 */}
                  <button
                    onClick={() => markGranted(uid)}
                    disabled={isResetting}
                    style={{ flexShrink: 0, padding: '7px 10px', border: '1px solid rgba(0,196,140,0.5)', borderRadius: '10px', background: 'rgba(0,196,140,0.12)', color: '#00C48C', fontWeight: '900', fontSize: `calc(11px * var(--fs, 1))`, cursor: isResetting ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                  >
                    내가 줌
                  </button>
                  {/* 빠른 FREE 복원 버튼 */}
                  <button
                    onClick={() => handleForce(uid, 'FREE')}
                    disabled={isResetting}
                    style={{
                      flexShrink: 0, padding: '7px 12px', border: 'none', borderRadius: '10px',
                      background: isResetting ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#FF5A5F,#cc2929)',
                      color: '#fff', fontWeight: '900', fontSize: `calc(11px * var(--fs, 1))`,
                      cursor: isResetting ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                      transition: 'all 0.15s',
                    }}
                  >
                    {isResetting ? '⏳' : '🔨 FREE'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ✅ TIER-GRANT-LOG: 관리자 지급 기록 목록 */}
      {granted.length > 0 && (
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,59,48,0.1)' }}>
          <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginBottom: '10px' }}>
            ✅ 관리자가 직접 준 유료 등급 {granted.length}명 (정상)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {granted.map((g, i) => {
              const uid = g.email || g.id || g.name || '?';
              return (
                <div key={uid + i} style={{ background: 'rgba(0,196,140,0.06)', border: '1px solid rgba(0,196,140,0.25)', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: '#fff', wordBreak: 'break-all' }}>{g.name || g.id || g.email} <span style={{ fontSize: `calc(10px * var(--fs, 1))`, color: TIER_COLOR[g.tier] || '#888' }}>{TIER_LABEL[g.tier] || g.tier}</span></div>
                    <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginTop: '2px' }}>
                      {g.grantedAt ? new Date(g.grantedAt).toLocaleDateString('ko-KR') : '날짜 없음'} 기록{g.note ? ` · ${g.note}` : ''}
                    </div>
                  </div>
                  <button onClick={() => handleForce(uid, 'FREE')} disabled={resettingId === uid}
                    style={{ flexShrink: 0, background: 'rgba(255,90,95,0.15)', color: '#FF5A5F', border: '1px solid rgba(255,90,95,0.4)', padding: '6px 10px', borderRadius: '8px', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {resettingId === uid ? '회수 중...' : '회수'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 수동 강제 변경 */}
      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>
          ✏️ 직접 입력해서 강제 변경
        </div>
        <input
          value={target}
          onChange={e => setTarget(e.target.value)}
          placeholder="이메일/ID/닉네임"
          style={{ padding: '11px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,59,48,0.3)', borderRadius: '12px', color: '#fff', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700', outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          {['FREE', 'BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'CAPTAIN'].map(t => (
            <button key={t} onClick={() => setTier(t)} style={{ flex: 1, padding: '7px 2px', borderRadius: '10px', border: 'none', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer', background: tier === t ? (t === 'FREE' ? '#FF5A5F' : '#00C48C') : 'rgba(255,255,255,0.08)', color: '#fff', transition: 'all 0.15s' }}>
              {t === 'FREE' ? 'FREE' : t === 'BUSINESS_LITE' ? '멤버십' : t === 'PRO' ? '예전PRO' : t === 'BUSINESS_VIP' ? 'VIP' : 'CAPTAIN'}
            </button>
          ))}
        </div>
        <button
          onClick={() => handleForce('', tier)}
          disabled={!target.trim() || loading}
          style={{ padding: '12px', border: 'none', borderRadius: '12px', background: target.trim() ? 'linear-gradient(135deg,#FF5A5F,#cc2929)' : 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: '950', fontSize: `calc(13px * var(--fs, 1))`, cursor: target.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
        >
          🔨 {loading ? '처리 중...' : `${target || '계정 입력'} → ${tier} 강제 변경`}
        </button>
      </div>
    </div>
    </>
  );
}
