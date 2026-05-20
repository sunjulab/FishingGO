import React, { useState, useEffect } from 'react';
import { X, Crown, Lock, MapPin, Star, CheckCircle2 } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import apiClient from '../api/index';

// 외부 브라우저로 결제 페이지 오픈 (구글 수수료 0%)
const WEB_PAY_BASE = 'https://fishing-go.vercel.app';
function openExternalBrowser(url) {
  // Capacitor 환경: window.open with _system → 기기 기본 브라우저 강제 오픈
  // 웹 환경: 새 탭
  if (window?.Capacitor?.isNativePlatform?.()) {
    window.open(url, '_system');
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// ── 36개 항구 목록 (HARBOR_DATA와 동기화) ─────────────────────────────────
const HARBORS_STATIC = [
  // 동해권 — 강원 (7)
  { id: 'gangneung',  name: '강릉·강문',      region: '동해권', area: '강원', key: '강원 강릉',    desc: '안목·강문항, 감성돔·방어·가자미' },
  { id: 'jumunjin',   name: '주문진',          region: '동해권', area: '강원', key: '강원 주문진',  desc: '오징어·대구 최대 어항, 야간선상 유명' },
  { id: 'sokcho',     name: '속초',            region: '동해권', area: '강원', key: '강원 속초',    desc: '대구·명태·가자미, 동해 북부 거점' },
  { id: 'goseong',    name: '고성(거진)',       region: '동해권', area: '강원', key: '강원 고성',    desc: '공현진·거진항, 도루묵·가자미' },
  { id: 'yangyang',   name: '양양(낙산·남애)', region: '동해권', area: '강원', key: '강원 양양',    desc: '낙산·남애·동산항, 연어·명태·방어' },
  { id: 'donghae',    name: '동해·묵호',       region: '동해권', area: '강원', key: '강원 동해',    desc: '묵호항, 오징어 야간선상 성지' },
  { id: 'samcheok',   name: '삼척',            region: '동해권', area: '강원', key: '강원 삼척',    desc: '임원·장호항, 돌돔·열기 청정 어장' },
  // 동해권 — 경북 (5)
  { id: 'guryongpo',  name: '구룡포(포항)',    region: '동해권', area: '경북', key: '경북 구룡포',  desc: '구룡포·영일만, 참돔·대게 유명' },
  { id: 'gampo',      name: '감포(경주)',      region: '동해권', area: '경북', key: '경북 감포',    desc: '감포·양포, 붉바리·감성돔' },
  { id: 'ganggu',     name: '강구(영덕)',      region: '동해권', area: '경북', key: '경북 강구',    desc: '강구항, 대게·문어 선상낚시' },
  { id: 'hupo',       name: '후포(울진)',      region: '동해권', area: '경북', key: '경북 후포',    desc: '후포항 일대, 볼락·방어' },
  { id: 'jukbyeon',   name: '죽변(울진)',      region: '동해권', area: '경북', key: '경북 죽변',    desc: '죽변항, 대구·오징어·가자미' },
  // 남해권 — 부산 (3)
  { id: 'gijang',     name: '기장',            region: '남해권', area: '부산', key: '부산 기장',    desc: '대변항, 멸치·참돔 최대 어장' },
  { id: 'dadaepo',    name: '다대포',          region: '남해권', area: '부산', key: '부산 다대포',  desc: '다대포항, 주꾸미·갑오징어' },
  { id: 'yongho',     name: '용호부두',        region: '남해권', area: '부산', key: '부산 용호부두',desc: '용호부두, 참돔·삼치 루어' },
  // 남해권 — 경남 (4)
  { id: 'tongyeong',  name: '통영',            region: '남해권', area: '경남', key: '경남 통영',    desc: '한려수도 중심, 섬·선상낚시 천국' },
  { id: 'geoje',      name: '거제(대포·금포)', region: '남해권', area: '경남', key: '경남 거제',    desc: '대포·금포항, 감성돔·참돔 대물' },
  { id: 'namhae',     name: '남해(미조·상주)', region: '남해권', area: '경남', key: '경남 남해',    desc: '미조·상주항, 참돔·삼치·방어' },
  { id: 'goseong_s',  name: '고성',            region: '남해권', area: '경남', key: '경남 고성',    desc: '자란만·당항포, 갑오징어·감성돔' },
  // 남해권 — 전남 (5)
  { id: 'yeosu',      name: '여수(국동)',      region: '남해권', area: '전남', key: '전남 여수',    desc: '돌산·거문도, 붉바리·참돔 대물' },
  { id: 'wando',      name: '완도',            region: '남해권', area: '전남', key: '전남 완도',    desc: '보길도·청산도, 돌돔·참돔' },
  { id: 'goheung',    name: '고흥(나로도)',    region: '남해권', area: '전남', key: '전남 고흥',    desc: '나로도항, 감성돔·참돔' },
  { id: 'jindo',      name: '진도',            region: '남해권', area: '전남', key: '전남 진도',    desc: '명량수도, 부시리·방어 시즌' },
  // 서해권 — 인천 (2)
  { id: 'incheon_n',  name: '인천 남항부두',  region: '서해권', area: '인천', key: '인천 남항부두',desc: '남항부두, 우럭·광어 선상 중심지' },
  { id: 'incheon_y',  name: '인천 연안부두',  region: '서해권', area: '인천', key: '인천 연안부두',desc: '연안부두, 소래·영종도 출항' },
  // 서해권 — 충남 (3)
  { id: 'taean',      name: '태안(안흥·마검포)', region: '서해권', area: '충남', key: '충남 태안',  desc: '안흥·마검포항, 주꾸미·꽃게' },
  { id: 'boryeong',   name: '보령(무창포·오천)', region: '서해권', area: '충남', key: '충남 보령',  desc: '무창포·오천항, 광어·우럭' },
  { id: 'seosan',     name: '서산(삼길포)',    region: '서해권', area: '충남', key: '충남 서산',    desc: '삼길포항, 광어·도다리' },
  // 서해권 — 전북 (2)
  { id: 'gunsan',     name: '군산(비응·야미도)', region: '서해권', area: '전북', key: '전북 군산',  desc: '비응·야미도, 벵에돔·참돔' },
  { id: 'buan',       name: '부안(격포·위도)', region: '서해권', area: '전북', key: '전북 부안',    desc: '격포·위도, 우럭·도다리' },
  // 서해권 — 전남 서해 (1)
  { id: 'mokpo',      name: '목포',            region: '서해권', area: '전남', key: '전남 목포',    desc: '흑산도·홍도 거점, 참돔·벵에돔' },
  // 제주권 (5)
  { id: 'jeju_dodu',  name: '도두항(제주시)', region: '제주권', area: '제주', key: '제주 도두항',  desc: '도두항, 자리돔·갈치·방어' },
  { id: 'jeju_aewol', name: '애월항(제주시)', region: '제주권', area: '제주', key: '제주 애월항',  desc: '애월항, 다금바리·벵에돔 성지' },
  { id: 'seogwipo',   name: '서귀포',          region: '제주권', area: '제주', key: '제주 서귀포',  desc: '서귀포항, 참돔·방어·다금바리' },
  { id: 'mosulpo',    name: '모슬포',          region: '제주권', area: '제주', key: '제주 모슬포',  desc: '마라도·가파도 거점, 방어·참돔' },
  { id: 'sungsan',    name: '성산항',          region: '제주권', area: '제주', key: '제주 성산항',  desc: '성산일출봉 인근, 돌돔·감성돔' },
];

const REGION_TABS = ['전체', '동해권', '남해권', '서해권', '제주권'];
const REGION_EMOJI = { '동해권': '🌊', '남해권': '⚓', '서해권': '🦀', '제주권': '🌺' };

export default function VVIPSubscribe() {
  const user = useUserStore(s => s.user);
  const addToast = useToastStore(s => s.addToast);

  const [selectedPlan, setSelectedPlan] = useState(null);

  const [takenMap, setTakenMap] = useState({});
  const [mySlot, setMySlot] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [selectedHarbor, setSelectedHarbor] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLiteProConfirm, setShowLiteProConfirm] = useState(false);

  // 웹결제 전환으로 m_redirect 처리 useEffect 제거됨 (구글 수수료 0% 방식)

  const PLANS = [
    {
      id: 'LITE', tier: 'BUSINESS_LITE', label: 'LITE', price: '₩9,900', priceNum: 9900, period: '/월',
      color: '#A0A0A0', border: 'rgba(160,160,160,0.4)', bg: 'rgba(160,160,160,0.08)',
      features: [
        '비밀 포인트 25곳 지도 표시',
        '실시간 해양 히트맵',
        '해안 CCTV 실시간 영상',
        '조황 점수 모드',
      ],
      badge: null,
    },
    {
      id: 'PRO', tier: 'PRO', label: 'PRO', price: '₩110,000', priceNum: 110000, period: '/월',
      color: '#64B5F6', border: 'rgba(100,181,246,0.45)', bg: 'rgba(21,101,192,0.12)',
      features: [
        'LITE 전체 포함',
        '선상 홍보 게시 작성',
        '커뮤니티 우선 노출',
        '조황 보고 무제한',
      ],
      badge: '인기', hot: true,
    },
    {
      id: 'VVIP', tier: 'BUSINESS_VIP', label: 'VVIP', price: '₩550,000', priceNum: 550000, period: '/월',
      color: '#FFD700', border: 'rgba(255,215,0,0.45)', bg: 'rgba(255,215,0,0.08)',
      features: [
        'PRO 전체 포함',
        '항구 독점 선점 (1인)',
        '선상 최상단 영구 고정',
        'VVIP 전용 배지 제공',
      ],
      badge: '독점',
    },
  ];


  // 서버에서 선점 현황만 받아옴
  useEffect(() => {
    apiClient.get('/api/vvip/harbors')
      .then(res => {
        const map = {};
        (res.data.harbors || []).forEach(h => {
          if (h.isTaken) map[h.id] = { takenBy: h.takenBy, expiresAt: h.expiresAt };
        });
        setTakenMap(map);
      })
      .catch((err) => {
        // ✅ 24TH-B2: silent catch → 개발 환경 에러 가시화 (23TH-B3 패턴)
        if (!import.meta.env.PROD) console.warn('[VVIPSubscribe] /api/vvip/harbors 로드 실패:', err?.message);
      }); // 실패해도 정적 목록은 표시

    if (user) {
      // ✅ NEW-BUG-09: userId 쿼리파라미터 제거 — 서버가 JWT에서 자동 추출
      apiClient.get('/api/vvip/my-slot')
        .then(res => {
          if (res.data.hasSlot) {
            // ✅ FIX-SHAPE: 서버 응답 { harbor: { id, name }, slot: { expiresAt } }
            // → 쫖리 후 항상 harborId/harborName/expiresAt 형태로 저장
            setMySlot({
              harborId: res.data.harbor?.id,
              harborName: res.data.harbor?.name,
              expiresAt: res.data.slot?.expiresAt,
              daysLeft: res.data.daysLeft,
            });
          }
        })
        .catch((err) => {
          // ✅ 24TH-B2: my-slot silent catch → 개발 환경 에러 가시화
          if (!import.meta.env.PROD) console.warn('[VVIPSubscribe] /api/vvip/my-slot 로드 실패:', err?.message);
        });
    }
  }, [user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ FIX-REALTIME: 30초 폴링 — 다른 유저가 슬롯을 선점하면 실시간 품절 반영
  useEffect(() => {
    if (!user) return;
    const pollInterval = setInterval(() => {
      apiClient.get('/api/vvip/harbors')
        .then(res => {
          const map = {};
          (res.data.harbors || []).forEach(h => {
            if (h.isTaken) map[h.id] = { takenBy: h.takenBy, expiresAt: h.expiresAt };
          });
          setTakenMap(map);
        })
        .catch(() => {}); // 실패 시 조용히 스킵
    }, 30000); // 30초 주기
    return () => clearInterval(pollInterval); // 언마운트 시 폴링 자동 해제
  }, [user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  const harbors = HARBORS_STATIC.map(h => ({
    ...h,
    isTaken: !!takenMap[h.id],
    takenBy: takenMap[h.id]?.takenBy || null,
    isMyHarbor: mySlot?.harborId === h.id,
  }));

  const filtered = selectedRegion === '전체'
    ? harbors
    : harbors.filter(h => h.region === selectedRegion);

  const takenCount = Object.keys(takenMap).length;
  // ✅ NEW-B6: 하드코딩 23 → HARBORS_STATIC.length — 항구 수 변경 시 자동 동기화
  const availableCount = HARBORS_STATIC.length - takenCount;

  const handleSelect = (harbor) => {
    if (harbor.isTaken && !harbor.isMyHarbor) {
      addToast(`${harbor.name}은 이미 선점된 자리입니다.`, 'error');
      return;
    }
    if (mySlot && !harbor.isMyHarbor) {
      addToast('이미 다른 항구를 선점 중입니다.', 'error');
      return;
    }
    setSelectedHarbor(harbor);
    setShowConfirm(true);
  };

  // LITE / PRO 웹 결제 페이지로 이동 (구글 수수료 0% — 외부 브라우저)
  const handleLiteProPurchase = (plan) => {
    if (!user) { addToast('로그인이 필요합니다.', 'error'); return; }
    const params = new URLSearchParams({
      planId: plan.id,
      email:  user.email || user.id || '',
      name:   user.name  || '',
    });
    const url = `${WEB_PAY_BASE}/vvip-subscribe?${params.toString()}`;
    addToast('웹 브라우저에서 결제를 진행해주세요 🌐', 'info');
    openExternalBrowser(url);
    setShowLiteProConfirm(false);
    setSelectedPlan(null);
  };

  // VVIP 항구 독점 — 웹 결제 페이지로 이동 (구글 수수료 0%)
  const handlePurchase = () => {
    if (!user) { addToast('로그인이 필요합니다.', 'error'); return; }
    const params = new URLSearchParams({
      planId:     'VVIP',
      email:      user.email || user.id || '',
      name:       user.name  || '',
      harborId:   selectedHarbor?.id   || '',
      harborName: selectedHarbor?.name || '',
    });
    const url = `${WEB_PAY_BASE}/vvip-subscribe?${params.toString()}`;
    addToast('웹 브라우저에서 결제를 진행해주세요 🌐', 'info');
    openExternalBrowser(url);
    setShowConfirm(false);
  };

  return (
    <div style={{ backgroundColor: '#0A0F1C', minHeight: '100dvh', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 40px)' }}>
      {/* 헤더 */}
      <div style={{ backgroundColor: 'rgba(10,15,28,0.97)', padding: '16px 20px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,215,0,0.12)' }}>
        <button onClick={() => selectedPlan ? setSelectedPlan(null) : window.history.back()} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
          <X size={24} color="#FFD700" />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: `calc(17px * var(--fs, 1))`, fontWeight: '900', margin: 0, color: '#FFD700' }}>
            {selectedPlan === 'VVIP' ? '👑 VVIP 항구 독점 구독' : '👑 프리미엄 멤버십 구독'}
          </h1>
          {selectedPlan === 'VVIP' && (
            <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,215,0,0.5)', marginTop: '2px' }}>← 플랜 선택으로 돌아가기</div>
          )}
        </div>
        {selectedPlan === 'VVIP' && (
          <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: 'rgba(255,215,0,0.7)', fontWeight: '800', textAlign: 'right' }}>
            잔여<br />
            <span style={{ fontSize: `calc(18px * var(--fs, 1))`, color: availableCount > 0 ? '#00C48C' : '#FF5A5F', fontWeight: '900' }}>{availableCount}</span>
            <span style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.4)' }}>/{HARBORS_STATIC.length}</span>{/* ✅ 24TH-C4: 하드코딩 /23 → HARBORS_STATIC.length */}
          </div>
        )}
      </div>

      {/* ── STEP 1: 플랜 선택 화면 ── */}
      {!selectedPlan && (
        <div style={{ padding: '20px 16px 0' }}>
          {/* 안내 헤더 */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: `calc(28px * var(--fs, 1))`, marginBottom: '8px' }}>🎣</div>
            <div style={{ fontSize: `calc(20px * var(--fs, 1))`, fontWeight: '950', color: '#fff', marginBottom: '6px' }}>멤버십 플랜 선택</div>
            {/* ✅ NEW-C5: 포트원 자동결제 구현 완료 — 기존 '마스터 안내' 문구 제거 */}
            <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>낚시GO 프리미엄 기능을 이용하세요<br />플랜 선택 후 즉시 정기구독이 시작됩니다</div>
          </div>

          {/* 플랜 카드 */}
          {PLANS.map(plan => (
            <div key={plan.id}
              onClick={() => { setSelectedPlan(plan.id); if (plan.id !== 'VVIP') setShowLiteProConfirm(true); }}
              style={{
                background: plan.bg, border: `1.5px solid ${plan.border}`,
                borderRadius: '20px', padding: '20px', marginBottom: '12px',
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
                transition: 'transform 0.15s',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {plan.badge && (
                <div style={{ position: 'absolute', top: '16px', right: '16px', background: plan.hot ? '#1565C0' : 'linear-gradient(135deg,#FFD700,#FFA000)', color: plan.hot ? '#fff' : '#5C3A00', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', padding: '3px 10px', borderRadius: '12px' }}>{plan.badge}</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                <div style={{ width: '48px', height: '48px', background: `linear-gradient(135deg, ${plan.color}, ${plan.color}88)`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 14px ${plan.color}44` }}>
                  <Crown size={24} color={plan.id === 'VVIP' ? '#5C3A00' : '#fff'} fill={plan.id === 'VVIP' ? '#5C3A00' : 'none'} />
                </div>
                <div>
                  <div style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '950', color: plan.color }}>{plan.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                    <span style={{ fontSize: `calc(22px * var(--fs, 1))`, fontWeight: '950', color: '#fff' }}>{plan.price}</span>
                    <span style={{ fontSize: `calc(12px * var(--fs, 1))`, color: 'rgba(255,255,255,0.4)' }}>{plan.period}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 10px', fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.7)', fontWeight: '700' }}>✓ {f}</div>
                ))}
              </div>
              <div style={{ marginTop: '14px', width: '100%', padding: '12px', background: plan.id === 'VVIP' ? 'linear-gradient(135deg,#FFD700,#FFA000)' : `${plan.color}22`, border: `1px solid ${plan.border}`, borderRadius: '12px', textAlign: 'center', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: plan.id === 'VVIP' ? '#1A1A2E' : plan.color }}>
                {plan.id === 'VVIP' ? '항구 선택하러 가기 →' : `${plan.label} 구독 신청하기 →`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LITE / PRO 구독 확인 모달 */}
      {showLiteProConfirm && selectedPlan && selectedPlan !== 'VVIP' && (() => {
        const plan = PLANS.find(p => p.id === selectedPlan);
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '480px', background: 'linear-gradient(180deg,#1A1A2E,#0A0F1C)', borderRadius: '28px 28px 0 0', padding: '28px 24px 44px', border: '1px solid rgba(255,215,0,0.2)', borderBottom: 'none' }}>
              <div style={{ width: '40px', height: '4px', background: 'rgba(255,215,0,0.3)', borderRadius: '2px', margin: '0 auto 22px' }} />
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <Crown size={36} color={plan.color} style={{ marginBottom: '8px' }} />
                <h2 style={{ fontSize: `calc(20px * var(--fs, 1))`, fontWeight: '950', color: '#fff', margin: '0 0 4px' }}>{plan.label} 멤버십</h2>
                <p style={{ fontSize: `calc(13px * var(--fs, 1))`, color: 'rgba(255,255,255,0.45)', margin: 0 }}>월 {plan.price} 정기 구독</p>
              </div>
              <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '16px', padding: '18px', marginBottom: '14px' }}>
                {[{ label: '플랜', value: plan.label }, { label: '구독 기간', value: '31일 (익월 자동갱신 알림)' }, { label: '결제 금액', value: plan.price, highlight: true }].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i < 2 ? '10px' : 0, paddingTop: i === 2 ? '10px' : 0, borderTop: i === 2 ? '1px solid rgba(255,215,0,0.15)' : 'none' }}>
                    <span style={{ fontSize: `calc(13px * var(--fs, 1))`, color: 'rgba(255,255,255,0.5)' }}>{row.label}</span>
                    <strong style={{ fontSize: row.highlight ? `calc(17px * var(--fs, 1))` : `calc(13px * var(--fs, 1))`, color: row.highlight ? plan.color : '#fff' }}>{row.value}</strong>
                  </div>
                ))}
              </div>
              {/* 결제 수단: 웹 페이지에서 선택 */}
              <div style={{ marginBottom: '14px', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: 'rgba(255,215,0,0.8)', fontWeight: '800' }}>💳 결제 수단은 웹 결제 페이지에서 선택</div>
                <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>카카오페이 · 토스 · 신용카드 지원</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: 'rgba(0,100,255,0.08)', border: '1px solid rgba(0,100,255,0.2)', borderRadius: '12px', padding: '12px', marginBottom: '18px' }}>
                <p style={{ fontSize: `calc(12px * var(--fs, 1))`, color: 'rgba(200,220,255,0.85)', margin: 0, lineHeight: '1.7', fontWeight: '600' }}>
                  🌐 <strong>웹 브라우저</strong>에서 결제가 진행됩니다.<br />
                  결제 완료 후 앱에서 로그아웃 → 재로그인하면 플랜이 활성화됩니다.
                </p>
              </div>
              <button onClick={() => handleLiteProPurchase(plan)} style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: `linear-gradient(135deg, ${plan.color}, ${plan.color}aa)`, color: plan.id === 'VVIP' ? '#1A1A2E' : '#fff', fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '950', cursor: 'pointer', marginBottom: '10px' }}>
                🌐 {plan.label} 결제 페이지 열기
              </button>
              <button onClick={() => { setShowLiteProConfirm(false); setSelectedPlan(null); }} style={{ width: '100%', padding: '13px', border: 'none', background: 'none', color: 'rgba(255,255,255,0.35)', fontSize: `calc(14px * var(--fs, 1))`, cursor: 'pointer' }}>취소</button>
            </div>
          </div>
        );
      })()}


      {/* ── STEP 2: VVIP 항구 선택 화면 ── */}
      {selectedPlan === 'VVIP' && (<>
      {mySlot && (
        <div style={{ margin: '12px 16px 0', background: 'linear-gradient(135deg, #FFD700, #FF9B26)', borderRadius: '18px', padding: '16px 18px' }}>
          <div style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', color: '#5C3A00', marginBottom: '3px', letterSpacing: '0.06em' }}>내 VVIP 독점 항구</div>
          <div style={{ fontSize: `calc(20px * var(--fs, 1))`, fontWeight: '950', color: '#1A1A2E' }}>👑 {mySlot.harborName}</div>
          {mySlot.expiresAt && (
            <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#5C3A00', fontWeight: '700', marginTop: '4px' }}>
              만료: {new Date(mySlot.expiresAt).toLocaleDateString('ko-KR')}
            </div>
          )}
        </div>
      )}

      {/* 안내 배너 */}
      {!mySlot && (
        <div style={{ margin: '12px 16px 0', background: 'linear-gradient(135deg, #1A1A2E, #0F3460)', borderRadius: '18px', padding: '18px 20px', color: '#fff' }}>
          <Crown size={28} color="#FFD700" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '900', marginBottom: '4px' }}>항구별 선착순 1명 독점</div>
          <div style={{ fontSize: `calc(12px * var(--fs, 1))`, opacity: 0.75, lineHeight: 1.6 }}>
            선택한 항구의 선상 홍보 피드 <strong style={{ color: '#FFD700' }}>최상단 영구 고정</strong>.<br />
            전국 낚시인 포인트 검색 시 가장 먼저 노출됩니다.
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
            <div>
              <div style={{ fontSize: `calc(20px * var(--fs, 1))`, fontWeight: '950', color: '#FFD700' }}>₩550,000</div>
              <div style={{ fontSize: `calc(10px * var(--fs, 1))`, opacity: 0.65 }}>월 정액 · 세금계산서</div>
            </div>
            <div>
              <div style={{ fontSize: `calc(20px * var(--fs, 1))`, fontWeight: '950', color: availableCount > 0 ? '#00C48C' : '#FF5A5F' }}>{availableCount}석</div>
              <div style={{ fontSize: `calc(10px * var(--fs, 1))`, opacity: 0.65 }}>전국 잔여 자리</div>
            </div>
          </div>
        </div>
      )}

      {/* 권역 탭 */}
      <div style={{ padding: '14px 16px 8px', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {REGION_TABS.map(tab => (
          <button key={tab} onClick={() => setSelectedRegion(tab)} style={{
            padding: '7px 14px', borderRadius: '20px', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '800', whiteSpace: 'nowrap', cursor: 'pointer',
            border: selectedRegion === tab ? '1.5px solid #FFD700' : '1.5px solid rgba(255,255,255,0.1)',
            background: selectedRegion === tab ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)',
            color: selectedRegion === tab ? '#FFD700' : 'rgba(255,255,255,0.5)',
          }}>
            {tab === '전체' ? `전체 (${availableCount}석 가능)` : `${REGION_EMOJI[tab]} ${tab}`}
          </button>
        ))}
      </div>

      {/* 항구 전체 목록 */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map(harbor => {
          // ✅ FIX: 내 슬롯이 있으면 내 항구 외 모두 비활성 (클릭 후 토스트가 아닌 시각적 회색 처리)
          const disabled = !harbor.isMyHarbor && (harbor.isTaken || !!mySlot);
          return (
            <div key={harbor.id}
              onClick={() => !disabled && handleSelect(harbor)}
              style={{
                background: harbor.isMyHarbor
                  ? 'rgba(255,215,0,0.1)'
                  : disabled
                    ? 'rgba(255,255,255,0.02)'
                    : 'rgba(255,255,255,0.06)',
                border: harbor.isMyHarbor
                  ? '1.5px solid #FFD700'
                  : disabled
                    ? '1px solid rgba(255,255,255,0.06)'
                    : '1.5px solid rgba(255,215,0,0.22)',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.45 : 1,
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {/* 아이콘 */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '13px', flexShrink: 0,
                background: harbor.isMyHarbor
                  ? 'linear-gradient(135deg, #FFD700, #FF9B26)'
                  : disabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,215,0,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,215,0,0.2)',
              }}>
                {harbor.isMyHarbor
                  ? <Crown size={20} color="#1A1A2E" />
                  : disabled
                    ? <Lock size={18} color="rgba(255,255,255,0.25)" />
                    : <Crown size={20} color="#FFD700" />}
              </div>

              {/* 텍스트 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: `calc(10px * var(--fs, 1))`, background: 'rgba(255,215,0,0.15)', color: '#FFD700', padding: '2px 7px', borderRadius: '5px', fontWeight: '800' }}>{harbor.area}</span>
                  <span style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '900', color: harbor.isMyHarbor ? '#FFD700' : disabled ? 'rgba(255,255,255,0.25)' : '#fff' }}>
                    {harbor.name}
                  </span>
                  {harbor.isMyHarbor && (
                    <span style={{ fontSize: `calc(10px * var(--fs, 1))`, background: '#FFD700', color: '#1A1A2E', padding: '2px 8px', borderRadius: '5px', fontWeight: '900' }}>내 자리</span>
                  )}
                </div>
                <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.4)', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <MapPin size={9} style={{ marginRight: '3px', verticalAlign: 'middle' }} />{harbor.desc}
                </div>
                <div style={{ fontSize: `calc(11px * var(--fs, 1))`, marginTop: '4px', fontWeight: '700' }}>
                  {harbor.isMyHarbor
                    ? <span style={{ color: '#FFD700', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={11} /> 독점 활성 중</span>
                    : harbor.isTaken
                      ? <span style={{ color: '#FF5A5F' }}>🔒 마감 — {harbor.takenBy} 선장</span>
                      : mySlot
                        ? <span style={{ color: 'rgba(255,255,255,0.25)' }}>🔒 다른 항구 선점 중</span>
                        : <span style={{ color: '#00C48C', display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={10} fill="#00C48C" /> 선착순 구매 가능 · ₩550,000/월</span>}
                </div>
              </div>

              {!disabled && !harbor.isMyHarbor && (
                <div style={{ color: '#FFD700', fontSize: `calc(20px * var(--fs, 1))`, fontWeight: '900', flexShrink: 0 }}>›</div>
              )}
            </div>
          );
        })}
      </div>

      {/* 구매 확인 모달 */}
      {showConfirm && selectedHarbor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '480px', background: 'linear-gradient(180deg,#1A1A2E,#0A0F1C)', borderRadius: '28px 28px 0 0', padding: '28px 24px 44px', border: '1px solid rgba(255,215,0,0.2)', borderBottom: 'none' }}>
            <div style={{ width: '40px', height: '4px', background: 'rgba(255,215,0,0.3)', borderRadius: '2px', margin: '0 auto 22px' }} />
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <Crown size={40} color="#FFD700" style={{ marginBottom: '8px' }} />
              <h2 style={{ fontSize: `calc(20px * var(--fs, 1))`, fontWeight: '950', color: '#fff', margin: '0 0 4px' }}>{selectedHarbor.name}</h2>
              <p style={{ fontSize: `calc(12px * var(--fs, 1))`, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{selectedHarbor.area} · {REGION_EMOJI[selectedHarbor.region]} {selectedHarbor.region}</p>
            </div>

            <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '16px', padding: '18px', marginBottom: '14px' }}>
              {[
                { label: '선택 항구', value: `${selectedHarbor.area} · ${selectedHarbor.name}` },
                { label: '독점 인원', value: '해당 항구 내 유일 1명' },
                { label: '구독 기간', value: '31일 (익월 자동갱신 알림)' },
                { label: '결제 금액', value: '₩550,000', highlight: true },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i < 3 ? '10px' : 0, paddingTop: i === 3 ? '10px' : 0, borderTop: i === 3 ? '1px solid rgba(255,215,0,0.15)' : 'none' }}>
                  <span style={{ fontSize: `calc(13px * var(--fs, 1))`, color: 'rgba(255,255,255,0.5)' }}>{row.label}</span>
                  <strong style={{ fontSize: row.highlight ? `calc(17px * var(--fs, 1))` : `calc(13px * var(--fs, 1))`, color: row.highlight ? '#FFD700' : '#fff' }}>{row.value}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: 'rgba(0,100,255,0.08)', border: '1px solid rgba(0,100,255,0.2)', borderRadius: '12px', padding: '12px', marginBottom: '18px' }}>
              <p style={{ fontSize: `calc(12px * var(--fs, 1))`, color: 'rgba(200,220,255,0.85)', margin: 0, lineHeight: '1.7', fontWeight: '600' }}>
                🌐 <strong>웹 브라우저</strong>에서 결제가 진행됩니다.<br />
                결제 완료 후 앱에서 로그아웃 → 재로그인하면 항구가 활성화됩니다.
              </p>
            </div>

            <button onClick={handlePurchase}
              style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg,#FFD700,#FF9B26)', color: '#1A1A2E', fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '950', cursor: 'pointer', marginBottom: '10px' }}>
              🌐 {selectedHarbor?.name} 결제 페이지 열기
            </button>
            <button onClick={() => setShowConfirm(false)}
              style={{ width: '100%', padding: '13px', border: 'none', background: 'none', color: 'rgba(255,255,255,0.35)', fontSize: `calc(14px * var(--fs, 1))`, cursor: 'pointer' }}>
              취소
            </button>
          </div>
        </div>
      )}
      </>)}
    </div>
  );
}
