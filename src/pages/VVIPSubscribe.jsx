import React, { useState, useEffect, useCallback } from 'react';
import { X, Crown, Lock, MapPin, Star, CheckCircle2, RefreshCw, Smartphone } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import apiClient from '../api/index';
import {
  initIAP,
  purchaseLite,
  restorePurchases,
  isLiteActive,
  IAP_PRODUCT_ID,
} from '../services/GoogleIAPService';

/* ── 항구 목록 (VVIPSubscribe 전용 — 선점 현황 표시용) ─────────── */
const HARBORS_STATIC = [
  { id: 'gangneung',  name: '강릉·강문',       region: '동해권', area: '강원', desc: '안목·강문항, 감성돔·방어·가자미' },
  { id: 'jumunjin',   name: '주문진',           region: '동해권', area: '강원', desc: '오징어·대구 최대 어항, 야간선상 유명' },
  { id: 'sokcho',     name: '속초',             region: '동해권', area: '강원', desc: '대구·명태·가자미, 동해 북부 거점' },
  { id: 'goseong',    name: '고성(거진)',        region: '동해권', area: '강원', desc: '공현진·거진항, 도루묵·가자미' },
  { id: 'yangyang',   name: '양양(낙산·남애)',  region: '동해권', area: '강원', desc: '낙산·남애·동산항, 연어·명태·방어' },
  { id: 'donghae',    name: '동해·묵호',        region: '동해권', area: '강원', desc: '묵호항, 오징어 야간선상 성지' },
  { id: 'samcheok',   name: '삼척',             region: '동해권', area: '강원', desc: '임원·장호항, 돌돔·열기 청정 어장' },
  { id: 'guryongpo',  name: '구룡포(포항)',     region: '동해권', area: '경북', desc: '구룡포·영일만, 참돔·대게 유명' },
  { id: 'gampo',      name: '감포(경주)',       region: '동해권', area: '경북', desc: '감포·양포, 붉바리·감성돔' },
  { id: 'ganggu',     name: '강구(영덕)',       region: '동해권', area: '경북', desc: '강구항, 대게·문어 선상낚시' },
  { id: 'hupo',       name: '후포(울진)',       region: '동해권', area: '경북', desc: '후포항 일대, 볼락·방어' },
  { id: 'jukbyeon',   name: '죽변(울진)',       region: '동해권', area: '경북', desc: '죽변항, 대구·오징어·가자미' },
  { id: 'gijang',     name: '기장',             region: '남해권', area: '부산', desc: '대변항, 멸치·참돔 최대 어장' },
  { id: 'dadaepo',    name: '다대포',           region: '남해권', area: '부산', desc: '다대포항, 주꾸미·갑오징어' },
  { id: 'yongho',     name: '용호부두',         region: '남해권', area: '부산', desc: '용호부두, 참돔·삼치 루어' },
  { id: 'tongyeong',  name: '통영',             region: '남해권', area: '경남', desc: '한려수도 중심, 섬·선상낚시 천국' },
  { id: 'geoje',      name: '거제(대포·금포)', region: '남해권', area: '경남', desc: '대포·금포항, 감성돔·참돔 대물' },
  { id: 'namhae',     name: '남해(미조·상주)', region: '남해권', area: '경남', desc: '미조·상주항, 참돔·삼치·방어' },
  { id: 'goseong_s',  name: '고성',             region: '남해권', area: '경남', desc: '자란만·당항포, 갑오징어·감성돔' },
  { id: 'yeosu',      name: '여수(국동)',       region: '남해권', area: '전남', desc: '돌산·거문도, 붉바리·참돔 대물' },
  { id: 'wando',      name: '완도',             region: '남해권', area: '전남', desc: '보길도·청산도, 돌돔·참돔' },
  { id: 'goheung',    name: '고흥(나로도)',     region: '남해권', area: '전남', desc: '나로도항, 감성돔·참돔' },
  { id: 'jindo',      name: '진도',             region: '남해권', area: '전남', desc: '명량수도, 부시리·방어 시즌' },
  { id: 'incheon_n',  name: '인천 남항부두',   region: '서해권', area: '인천', desc: '남항부두, 우럭·광어 선상 중심지' },
  { id: 'incheon_y',  name: '인천 연안부두',   region: '서해권', area: '인천', desc: '연안부두, 소래·영종도 출항' },
  { id: 'taean',      name: '태안(안흥·마검포)', region: '서해권', area: '충남', desc: '안흥·마검포항, 주꾸미·꽃게' },
  { id: 'boryeong',   name: '보령(무창포·오천)', region: '서해권', area: '충남', desc: '무창포·오천항, 광어·우럭' },
  { id: 'seosan',     name: '서산(삼길포)',     region: '서해권', area: '충남', desc: '삼길포항, 광어·도다리' },
  { id: 'gunsan',     name: '군산(비응·야미도)', region: '서해권', area: '전북', desc: '비응·야미도, 벵에돔·참돔' },
  { id: 'buan',       name: '부안(격포·위도)', region: '서해권', area: '전북', desc: '격포·위도, 우럭·도다리' },
  { id: 'mokpo',      name: '목포',             region: '서해권', area: '전남', desc: '흑산도·홍도 거점, 참돔·벵에돔' },
  { id: 'jeju_dodu',  name: '도두항(제주시)',  region: '제주권', area: '제주', desc: '도두항, 자리돔·갈치·방어' },
  { id: 'jeju_aewol', name: '애월항(제주시)',  region: '제주권', area: '제주', desc: '애월항, 다금바리·벵에돔 성지' },
  { id: 'seogwipo',   name: '서귀포',           region: '제주권', area: '제주', desc: '서귀포항, 참돔·방어·다금바리' },
  { id: 'mosulpo',    name: '모슬포',           region: '제주권', area: '제주', desc: '마라도·가파도 거점, 방어·참돔' },
  { id: 'sungsan',    name: '성산항',           region: '제주권', area: '제주', desc: '성산일출봉 인근, 돌돔·감성돔' },
];
const REGION_TABS  = ['전체', '동해권', '남해권', '서해권', '제주권'];
const REGION_EMOJI = { '동해권': '🌊', '남해권': '⚓', '서해권': '🦀', '제주권': '🌺' };

/* ─── LITE 구독 혜택 목록 ────────────────────────────────────── */
const LITE_FEATURES = [
  { icon: '🗺️', label: '비밀 낚시 포인트', desc: '25곳 독점 좌표 지도 표시' },
  { icon: '📡', label: '실시간 해양 히트맵', desc: '조황 확률 실시간 시각화' },
  { icon: '📹', label: '해안 CCTV 영상', desc: '현장 실시간 날씨·파고 확인' },
  { icon: '⭐', label: '조황 점수 모드', desc: 'AI 기반 포인트별 점수 제공' },
  { icon: '🔔', label: '조황 알림 서비스', desc: '황금 시간대 푸시 알림' },
];

/* ─── 메인 컴포넌트 ──────────────────────────────────────────── */
export default function VVIPSubscribe() {
  const user     = useUserStore(s => s.user);
  const setUser  = useUserStore(s => s.setUser);
  const addToast = useToastStore(s => s.addToast);

  // ── VVIP 항구 관련 상태
  const [takenMap, setTakenMap]           = useState({});
  const [mySlot, setMySlot]               = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [selectedHarbor, setSelectedHarbor] = useState(null);
  const [showHarborConfirm, setShowHarborConfirm] = useState(false);
  const [view, setView]                   = useState('plan'); // 'plan' | 'harbor'

  // ── 구매 상태
  const [iapLoading, setIapLoading]     = useState(false);
  const [restoring, setRestoring]       = useState(false);
  const [iapReady, setIapReady]         = useState(false);

  const isNative = !!(window?.Capacitor?.isNativePlatform?.());
  const currentTier = user?.tier || 'FREE';
  const hasLite = ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'MASTER'].includes(currentTier);

  /* ── IAP 초기화 ─────────────────────────────────────────── */
  useEffect(() => {
    if (!isNative) return;
    initIAP({
      onSuccess: async (transaction) => {
        addToast('✅ 구독이 완료되었습니다! 잠시 후 혜택이 적용됩니다.', 'success');
        // 서버에서 최신 유저 정보 재조회
        try {
          const res = await apiClient.get('/api/user/me');
          if (res.data?.user) setUser(res.data.user);
        } catch {}
      },
      onError: (err) => {
        if (err?.code !== 6) { // 6 = 사용자 취소
          addToast('결제 중 오류가 발생했습니다.', 'error');
        }
      },
      onRestore: (receipt) => {
        addToast('구독이 복원되었습니다.', 'success');
      },
    }).then(() => setIapReady(true));
  }, [isNative]);

  /* ── VVIP 항구 데이터 로드 ──────────────────────────────── */
  useEffect(() => {
    apiClient.get('/api/vvip/harbors')
      .then(res => {
        const map = {};
        (res.data.harbors || []).forEach(h => { if (h.isTaken) map[h.id] = { takenBy: h.takenBy, expiresAt: h.expiresAt }; });
        setTakenMap(map);
      }).catch(() => {});

    if (user) {
      apiClient.get('/api/vvip/my-slot')
        .then(res => {
          if (res.data.hasSlot) {
            setMySlot({ harborId: res.data.harbor?.id, harborName: res.data.harbor?.name, expiresAt: res.data.slot?.expiresAt, daysLeft: res.data.daysLeft });
          }
        }).catch(() => {});
    }
  }, [user?.email]);

  /* ── 30초 폴링 ──────────────────────────────────────────── */
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      apiClient.get('/api/vvip/harbors').then(res => {
        const map = {};
        (res.data.harbors || []).forEach(h => { if (h.isTaken) map[h.id] = { takenBy: h.takenBy, expiresAt: h.expiresAt }; });
        setTakenMap(map);
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [user?.email]);

  const harbors = HARBORS_STATIC.map(h => ({ ...h, isTaken: !!takenMap[h.id], takenBy: takenMap[h.id]?.takenBy || null, isMyHarbor: mySlot?.harborId === h.id }));
  const filtered = selectedRegion === '전체' ? harbors : harbors.filter(h => h.region === selectedRegion);
  const takenCount = Object.keys(takenMap).length;
  const availableCount = HARBORS_STATIC.length - takenCount;

  /* ── 구글 IAP 구매 ──────────────────────────────────────── */
  const handleBuyLite = useCallback(async () => {
    if (!user) return addToast('로그인이 필요합니다.', 'error');
    if (!isNative) return addToast('앱에서만 결제 가능합니다.', 'info');
    if (!iapReady) return addToast('결제 시스템 준비 중입니다. 잠시 후 다시 시도해주세요.', 'info');
    setIapLoading(true);
    try {
      await purchaseLite();
    } catch (err) {
      if (err?.message !== 'NATIVE_ONLY') {
        addToast(err?.message || '결제를 시작할 수 없습니다.', 'error');
      }
    } finally {
      setIapLoading(false);
    }
  }, [user, isNative, iapReady]);

  /* ── 구독 복원 ──────────────────────────────────────────── */
  const handleRestore = useCallback(async () => {
    setRestoring(true);
    try {
      await restorePurchases();
      addToast('구독 복원을 시도했습니다.', 'info');
    } catch { addToast('복원 중 오류가 발생했습니다.', 'error'); }
    finally { setRestoring(false); }
  }, []);

  /* ── VVIP 항구 선택 핸들러 ──────────────────────────────── */
  const handleSelectHarbor = (harbor) => {
    if (harbor.isTaken && !harbor.isMyHarbor) return addToast(`${harbor.name}은 이미 선점된 자리입니다.`, 'error');
    if (mySlot && !harbor.isMyHarbor) return addToast('이미 다른 항구를 선점 중입니다.', 'error');
    setSelectedHarbor(harbor);
    setShowHarborConfirm(true);
  };

  // VVIP 항구 구매 — 관리자 문의 안내 (Stripe 미구현)
  const handleVVIPContact = () => {
    addToast('VVIP 플랜 문의: fishing.go.kr@gmail.com', 'info');
  };

  /* ══════════════════════════════════════════════════════════ */
  return (
    <div style={{ backgroundColor: '#0A0F1C', minHeight: '100dvh', paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 40px)' }}>

      {/* 헤더 */}
      <div style={{ backgroundColor: 'rgba(10,15,28,0.97)', padding: '16px 20px', paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(200,212,0,0.15)' }}>
        <button onClick={() => view === 'harbor' ? setView('plan') : window.history.back()} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
          <X size={24} color="#C8D400" />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: `calc(17px * var(--fs,1))`, fontWeight: '900', margin: 0, color: '#C8D400' }}>
            {view === 'harbor' ? '👑 VVIP 항구 독점' : '🎣 낚시GO 베이직 구독'}
          </h1>
          {view === 'harbor' && <div style={{ fontSize: `calc(11px * var(--fs,1))`, color: 'rgba(200,212,0,0.5)', marginTop: '2px' }}>← 플랜 선택으로 돌아가기</div>}
        </div>
        {view === 'harbor' && (
          <div style={{ fontSize: `calc(12px * var(--fs,1))`, color: 'rgba(200,212,0,0.7)', fontWeight: '800', textAlign: 'right' }}>
            잔여<br />
            <span style={{ fontSize: `calc(18px * var(--fs,1))`, color: availableCount > 0 ? '#00C48C' : '#FF5A5F', fontWeight: '900' }}>{availableCount}</span>
            <span style={{ fontSize: `calc(11px * var(--fs,1))`, color: 'rgba(255,255,255,0.4)' }}>/{HARBORS_STATIC.length}</span>
          </div>
        )}
      </div>

      {/* ══ 플랜 선택 화면 ══════════════════════════════════ */}
      {view === 'plan' && (
        <div style={{ padding: '24px 16px 0' }}>

          {/* 이미 구독 중 배지 */}
          {hasLite && (
            <div style={{ background: 'linear-gradient(135deg,rgba(200,212,0,0.15),rgba(200,212,0,0.05))', border: '1.5px solid rgba(200,212,0,0.4)', borderRadius: '16px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={22} color="#C8D400" />
              <div>
                <div style={{ color: '#C8D400', fontWeight: '900', fontSize: `calc(14px * var(--fs,1))` }}>베이직 구독 활성 중</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: `calc(12px * var(--fs,1))`, marginTop: '2px' }}>현재 등급: {currentTier}</div>
              </div>
            </div>
          )}

          {/* 타이틀 */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '44px', marginBottom: '10px' }}>🎣</div>
            <div style={{ fontSize: `calc(22px * var(--fs,1))`, fontWeight: '950', color: '#fff', marginBottom: '6px', letterSpacing: '-0.03em' }}>
              낚시GO <span style={{ color: '#C8D400' }}>베이직</span>
            </div>
            <div style={{ fontSize: `calc(13px * var(--fs,1))`, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              월 구독으로 프리미엄 낚시 데이터 무제한 이용<br />
              구글 플레이 정기결제 · 언제든 해지 가능
            </div>
          </div>

          {/* 가격 카드 */}
          <div style={{ background: 'linear-gradient(135deg,rgba(200,212,0,0.12),rgba(200,212,0,0.04))', border: '2px solid rgba(200,212,0,0.4)', borderRadius: '24px', padding: '24px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
            {/* 배경 데코 */}
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(200,212,0,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: `calc(36px * var(--fs,1))`, fontWeight: '950', color: '#fff', lineHeight: 1 }}>₩9,900</div>
                <div style={{ fontSize: `calc(13px * var(--fs,1))`, color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>/ 월 · 부가세 포함</div>
              </div>
              <div style={{ background: 'rgba(200,212,0,0.2)', border: '1px solid rgba(200,212,0,0.4)', borderRadius: '12px', padding: '6px 12px' }}>
                <div style={{ fontSize: `calc(10px * var(--fs,1))`, color: '#C8D400', fontWeight: '900' }}>BASIC</div>
              </div>
            </div>

            {/* 혜택 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {LITE_FEATURES.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', background: 'rgba(200,212,0,0.12)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize: `calc(13px * var(--fs,1))`, fontWeight: '800', color: '#fff' }}>{f.label}</div>
                    <div style={{ fontSize: `calc(11px * var(--fs,1))`, color: 'rgba(255,255,255,0.4)' }}>{f.desc}</div>
                  </div>
                  <CheckCircle2 size={16} color="#C8D400" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                </div>
              ))}
            </div>

            {/* 구매 버튼 */}
            {!hasLite ? (
              <button
                onClick={handleBuyLite}
                disabled={iapLoading || !iapReady}
                style={{
                  width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
                  background: iapLoading ? 'rgba(200,212,0,0.3)' : 'linear-gradient(135deg,#C8D400,#a8b200)',
                  color: '#0A1628', fontSize: `calc(16px * var(--fs,1))`, fontWeight: '950',
                  cursor: iapLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.15s',
                  boxShadow: '0 6px 24px rgba(200,212,0,0.3)',
                }}
              >
                {iapLoading ? (
                  <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> 결제 진행 중...</>
                ) : !isNative ? (
                  <><Smartphone size={18} /> 앱에서만 결제 가능</>
                ) : (
                  <><span>🎣</span> 베이직 구독 시작 — ₩9,900/월</>
                )}
              </button>
            ) : (
              <div style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'rgba(200,212,0,0.1)', border: '1.5px solid rgba(200,212,0,0.3)', textAlign: 'center', color: '#C8D400', fontWeight: '900', fontSize: `calc(15px * var(--fs,1))` }}>
                ✅ 현재 구독 중
              </div>
            )}
          </div>

          {/* 구독 복원 버튼 */}
          <button onClick={handleRestore} disabled={restoring} style={{ width: '100%', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: `calc(13px * var(--fs,1))`, cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <RefreshCw size={14} style={restoring ? { animation: 'spin 1s linear infinite' } : {}} />
            {restoring ? '복원 중...' : '이전 구독 복원하기'}
          </button>

          {/* PRO 플랜 안내 (₩110,000/년 — 웹 결제 채널 전용) */}
          <div style={{ background: 'linear-gradient(135deg,rgba(100,181,246,0.08),rgba(21,101,192,0.06))', border: '1.5px solid rgba(100,181,246,0.3)', borderRadius: '20px', padding: '20px', marginBottom: '12px' }}>
            {/* 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,#64B5F6,#1565C0)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(100,181,246,0.3)' }}>
                <Crown size={20} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: `calc(16px * var(--fs,1))`, fontWeight: '950', color: '#64B5F6' }}>PRO</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: `calc(20px * var(--fs,1))`, fontWeight: '950', color: '#fff' }}>₩110,000</span>
                  <span style={{ fontSize: `calc(11px * var(--fs,1))`, color: 'rgba(255,255,255,0.4)' }}>/년</span>
                </div>
              </div>
              <div style={{ background: 'rgba(100,181,246,0.15)', border: '1px solid rgba(100,181,246,0.3)', borderRadius: '10px', padding: '4px 10px', fontSize: `calc(10px * var(--fs,1))`, color: '#64B5F6', fontWeight: '900' }}>인기</div>
            </div>
            {/* 혜택 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
              {['베이직 전체 포함', '선상 홍보 게시', '커뮤니티 우선 노출', '조황 보고 무제한', '광고 없는 경험'].map((f, i) => (
                <div key={i} style={{ background: 'rgba(100,181,246,0.08)', border: '1px solid rgba(100,181,246,0.18)', borderRadius: '8px', padding: '4px 10px', fontSize: `calc(11px * var(--fs,1))`, color: 'rgba(255,255,255,0.7)', fontWeight: '700' }}>✓ {f}</div>
              ))}
            </div>
            {/* 안내 문구 + 문의 버튼 */}
            <div style={{ background: 'rgba(100,181,246,0.06)', borderRadius: '12px', padding: '10px 14px', marginBottom: '12px', fontSize: `calc(11px * var(--fs,1))`, color: 'rgba(200,220,255,0.7)', lineHeight: 1.6 }}>
              💡 PRO 플랜은 <strong style={{ color: '#64B5F6' }}>외부 채널</strong>을 통해 신청합니다.<br />
              유튜브·커뮤니티 링크 또는 이메일로 문의해 주세요.
            </div>
            <button onClick={() => { addToast('PRO 플랜 문의: fishing.go.kr@gmail.com', 'info'); }} style={{ width: '100%', padding: '12px', border: '1.5px solid rgba(100,181,246,0.4)', borderRadius: '12px', background: 'rgba(100,181,246,0.1)', color: '#64B5F6', fontWeight: '900', fontSize: `calc(13px * var(--fs,1))`, cursor: 'pointer' }}>
              📧 PRO 플랜 문의하기
            </button>
          </div>

          {/* VVIP 항구 섹션 (안내만) */}
          <div style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Crown size={22} color="#FFD700" />
              <div style={{ fontSize: `calc(15px * var(--fs,1))`, fontWeight: '900', color: '#FFD700' }}>VVIP 항구 독점</div>
              <div style={{ marginLeft: 'auto', fontSize: `calc(10px * var(--fs,1))`, background: 'rgba(255,215,0,0.15)', color: '#FFD700', borderRadius: '8px', padding: '2px 8px', fontWeight: '800' }}>₩550,000/월</div>
            </div>
            <div style={{ fontSize: `calc(12px * var(--fs,1))`, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: '14px' }}>
              전국 36개 항구 중 1개를 독점 선점.<br />
              선상 홍보 피드 <strong style={{ color: '#FFD700' }}>최상단 영구 고정</strong>으로 최대 노출.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setView('harbor')} style={{ flex: 1, padding: '11px', border: '1px solid rgba(255,215,0,0.35)', borderRadius: '12px', background: 'rgba(255,215,0,0.08)', color: '#FFD700', fontWeight: '800', fontSize: `calc(13px * var(--fs,1))`, cursor: 'pointer' }}>
                항구 현황 보기 →
              </button>
              <button onClick={handleVVIPContact} style={{ padding: '11px 16px', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '12px', background: 'transparent', color: 'rgba(255,215,0,0.6)', fontWeight: '700', fontSize: `calc(12px * var(--fs,1))`, cursor: 'pointer' }}>
                문의
              </button>
            </div>
          </div>

          {/* 구독 안내 */}
          <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', marginBottom: '8px' }}>
            <div style={{ fontSize: `calc(11px * var(--fs,1))`, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7 }}>
              · 구글 플레이 계정으로 월 자동 결제됩니다.<br />
              · 다음 결제일 24시간 전까지 구글 플레이에서 해지 가능합니다.<br />
              · 해지 후에도 기간 만료 전까지 혜택이 유지됩니다.<br />
              · 구독 관련 문의: fishing.go.kr@gmail.com
            </div>
          </div>
        </div>
      )}

      {/* ══ VVIP 항구 현황 화면 ══════════════════════════════ */}
      {view === 'harbor' && (<>
        {mySlot && (
          <div style={{ margin: '12px 16px 0', background: 'linear-gradient(135deg,#FFD700,#FF9B26)', borderRadius: '18px', padding: '16px 18px' }}>
            <div style={{ fontSize: `calc(10px * var(--fs,1))`, fontWeight: '900', color: '#5C3A00', marginBottom: '3px', letterSpacing: '0.06em' }}>내 VVIP 독점 항구</div>
            <div style={{ fontSize: `calc(20px * var(--fs,1))`, fontWeight: '950', color: '#1A1A2E' }}>👑 {mySlot.harborName}</div>
            {mySlot.expiresAt && <div style={{ fontSize: `calc(11px * var(--fs,1))`, color: '#5C3A00', fontWeight: '700', marginTop: '4px' }}>만료: {new Date(mySlot.expiresAt).toLocaleDateString('ko-KR')}</div>}
          </div>
        )}

        {!mySlot && (
          <div style={{ margin: '12px 16px 0', background: 'linear-gradient(135deg,#1A1A2E,#0F3460)', borderRadius: '18px', padding: '18px 20px', color: '#fff' }}>
            <Crown size={28} color="#FFD700" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: `calc(16px * var(--fs,1))`, fontWeight: '900', marginBottom: '4px' }}>항구별 선착순 1명 독점</div>
            <div style={{ fontSize: `calc(12px * var(--fs,1))`, opacity: 0.75, lineHeight: 1.6, marginBottom: '12px' }}>선택한 항구의 선상 홍보 피드 <strong style={{ color: '#FFD700' }}>최상단 영구 고정</strong></div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div><div style={{ fontSize: `calc(20px * var(--fs,1))`, fontWeight: '950', color: '#FFD700' }}>₩550,000</div><div style={{ fontSize: `calc(10px * var(--fs,1))`, opacity: 0.65 }}>월 정액 · 세금계산서</div></div>
              <div><div style={{ fontSize: `calc(20px * var(--fs,1))`, fontWeight: '950', color: availableCount > 0 ? '#00C48C' : '#FF5A5F' }}>{availableCount}석</div><div style={{ fontSize: `calc(10px * var(--fs,1))`, opacity: 0.65 }}>전국 잔여 자리</div></div>
            </div>
            <button onClick={handleVVIPContact} style={{ marginTop: '14px', padding: '10px 20px', border: '1px solid rgba(255,215,0,0.4)', borderRadius: '12px', background: 'rgba(255,215,0,0.1)', color: '#FFD700', fontWeight: '800', fontSize: `calc(13px * var(--fs,1))`, cursor: 'pointer' }}>
              📧 VVIP 구독 문의하기
            </button>
          </div>
        )}

        {/* 권역 탭 */}
        <div style={{ padding: '14px 16px 8px', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {REGION_TABS.map(tab => (
            <button key={tab} onClick={() => setSelectedRegion(tab)} style={{ padding: '7px 14px', borderRadius: '20px', fontSize: `calc(13px * var(--fs,1))`, fontWeight: '800', whiteSpace: 'nowrap', cursor: 'pointer', border: selectedRegion === tab ? '1.5px solid #FFD700' : '1.5px solid rgba(255,255,255,0.1)', background: selectedRegion === tab ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)', color: selectedRegion === tab ? '#FFD700' : 'rgba(255,255,255,0.5)' }}>
              {tab === '전체' ? `전체 (${availableCount}석)` : `${REGION_EMOJI[tab]} ${tab}`}
            </button>
          ))}
        </div>

        {/* 항구 목록 */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(harbor => {
            const disabled = !harbor.isMyHarbor && (harbor.isTaken || !!mySlot);
            return (
              <div key={harbor.id} onClick={() => !disabled && handleSelectHarbor(harbor)}
                style={{ background: harbor.isMyHarbor ? 'rgba(255,215,0,0.1)' : disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)', border: harbor.isMyHarbor ? '1.5px solid #FFD700' : disabled ? '1px solid rgba(255,255,255,0.06)' : '1.5px solid rgba(255,215,0,0.22)', borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, transition: 'transform 0.15s' }}
                onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '13px', flexShrink: 0, background: harbor.isMyHarbor ? 'linear-gradient(135deg,#FFD700,#FF9B26)' : disabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,215,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,215,0,0.2)' }}>
                  {harbor.isMyHarbor ? <Crown size={20} color="#1A1A2E" /> : disabled ? <Lock size={18} color="rgba(255,255,255,0.25)" /> : <Crown size={20} color="#FFD700" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: `calc(10px * var(--fs,1))`, background: 'rgba(255,215,0,0.15)', color: '#FFD700', padding: '2px 7px', borderRadius: '5px', fontWeight: '800' }}>{harbor.area}</span>
                    <span style={{ fontSize: `calc(15px * var(--fs,1))`, fontWeight: '900', color: harbor.isMyHarbor ? '#FFD700' : disabled ? 'rgba(255,255,255,0.25)' : '#fff' }}>{harbor.name}</span>
                    {harbor.isMyHarbor && <span style={{ fontSize: `calc(10px * var(--fs,1))`, background: '#FFD700', color: '#1A1A2E', padding: '2px 8px', borderRadius: '5px', fontWeight: '900' }}>내 자리</span>}
                  </div>
                  <div style={{ fontSize: `calc(11px * var(--fs,1))`, color: 'rgba(255,255,255,0.4)', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <MapPin size={9} style={{ marginRight: '3px', verticalAlign: 'middle' }} />{harbor.desc}
                  </div>
                  <div style={{ fontSize: `calc(11px * var(--fs,1))`, marginTop: '4px', fontWeight: '700' }}>
                    {harbor.isMyHarbor ? <span style={{ color: '#FFD700', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={11} /> 독점 활성 중</span>
                      : harbor.isTaken ? <span style={{ color: '#FF5A5F' }}>🔒 마감 — {harbor.takenBy} 선장</span>
                      : mySlot ? <span style={{ color: 'rgba(255,255,255,0.25)' }}>🔒 다른 항구 선점 중</span>
                      : <span style={{ color: '#00C48C', display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={10} fill="#00C48C" /> 선착순 구매 가능 · 문의 요망</span>}
                  </div>
                </div>
                {!disabled && !harbor.isMyHarbor && <div style={{ color: '#FFD700', fontSize: `calc(20px * var(--fs,1))`, fontWeight: '900', flexShrink: 0 }}>›</div>}
              </div>
            );
          })}
        </div>
      </>)}

      {/* 항구 선점 문의 모달 */}
      {showHarborConfirm && selectedHarbor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '480px', background: 'linear-gradient(180deg,#1A1A2E,#0A0F1C)', borderRadius: '28px 28px 0 0', padding: '28px 24px 44px', border: '1px solid rgba(255,215,0,0.2)', borderBottom: 'none' }}>
            <div style={{ width: '40px', height: '4px', background: 'rgba(255,215,0,0.3)', borderRadius: '2px', margin: '0 auto 22px' }} />
            <Crown size={40} color="#FFD700" style={{ display: 'block', margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: `calc(20px * var(--fs,1))`, fontWeight: '950', color: '#fff', margin: '0 0 4px', textAlign: 'center' }}>{selectedHarbor.name}</h2>
            <p style={{ fontSize: `calc(12px * var(--fs,1))`, color: 'rgba(255,255,255,0.45)', margin: '0 0 20px', textAlign: 'center' }}>{selectedHarbor.area} · {REGION_EMOJI[selectedHarbor.region]} {selectedHarbor.region}</p>
            <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '16px', padding: '16px', marginBottom: '18px', fontSize: `calc(13px * var(--fs,1))`, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              💡 VVIP 구독은 현재 <strong style={{ color: '#FFD700' }}>이메일 문의</strong>를 통해 진행됩니다.<br />
              아래 버튼을 눌러 관리자에게 문의해 주세요.<br />
              <strong>금액: ₩550,000/월</strong>
            </div>
            <button onClick={handleVVIPContact} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg,#FFD700,#FF9B26)', color: '#1A1A2E', fontSize: `calc(16px * var(--fs,1))`, fontWeight: '950', cursor: 'pointer', marginBottom: '10px' }}>
              📧 VVIP 구독 문의하기
            </button>
            <button onClick={() => setShowHarborConfirm(false)} style={{ width: '100%', padding: '13px', border: 'none', background: 'none', color: 'rgba(255,255,255,0.35)', fontSize: `calc(14px * var(--fs,1))`, cursor: 'pointer' }}>취소</button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
