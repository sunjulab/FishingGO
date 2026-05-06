import React, { useState, useEffect, useRef, useCallback } from 'react'; // ✅ 11TH-B1: useRef/useCallback 추가
import { useNavigate } from 'react-router-dom';
import { X, Crown, Lock, AlertTriangle, MapPin, Star, CheckCircle2 } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import apiClient from '../api/index';
import { requestBillingPayment, PG_OPTIONS, PG_CONFIG } from '../utils/paymentUtils';

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
  const navigate = useNavigate();
  const user = useUserStore(s => s.user);
  const setUserTier = useUserStore(s => s.setUserTier);
  const updateUser = useUserStore(s => s.updateUser);
  const addToast = useToastStore(s => s.addToast);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPg, setSelectedPg] = useState('kakao'); // 'kakao' | 'toss' | 'card'

  const [takenMap, setTakenMap] = useState({});
  const [mySlot, setMySlot] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [selectedHarbor, setSelectedHarbor] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLiteProConfirm, setShowLiteProConfirm] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  // ✅ 11TH-B1: navigate 타이머 ref — 언마운트 후 타이머 누수 방지 (5TH-A4 패턴)
  const navTimerRef = useRef(null);
  useEffect(() => () => { if (navTimerRef.current) clearTimeout(navTimerRef.current); }, []);
  // ✅ 11TH-B5: takenMap 업데이트 useCallback 래핑
  const markHarborTaken = useCallback((harborId, ownerName) => {
    setTakenMap(prev => ({ ...prev, [harborId]: { takenBy: ownerName } }));
  }, []);

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
        .then(res => { if (res.data.hasSlot) setMySlot(res.data); })
        .catch((err) => {
          // ✅ 24TH-B2: my-slot silent catch → 개발 환경 에러 가시화
          if (!import.meta.env.PROD) console.warn('[VVIPSubscribe] /api/vvip/my-slot 로드 실패:', err?.message);
        });
    }
  }, [user?.email]);

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

  // LITE / PRO 정기결제(빌링) 등록
  const handleLiteProPurchase = async (plan) => {
    if (!user) { addToast('로그인이 필요합니다.', 'error'); return; }
    setPurchasing(true);
    try {
      // ① 포트원 빌링키 등록 + 첫 결제
      const { imp_uid, customer_uid, merchant_uid } = await requestBillingPayment({
        pgKey:     selectedPg,
        planId:    plan.id,
        planLabel: plan.label,
        amount:    plan.priceNum,
        user,
      });

      // ② 서버에 빌링키 등록
      const res = await apiClient.post('/api/payment/billing/register', {
        imp_uid, customer_uid,
        planId:     plan.id,
        pgProvider: selectedPg,
        userId:     user.email || user.id,
        userName:   user.name,
      });

      if (res.data.success) {
        setUserTier(plan.tier);
        updateUser({ tier: plan.tier });
        addToast(`🎉 ${plan.label} 정기구독 등록 완료!`, 'success');
        addToast(`✅ 다음 결제일: ${new Date(res.data.nextBillingDate).toLocaleDateString('ko-KR')}`, 'info');
        // 결제 내역 자동 저장
        apiClient.post('/api/payment/history/record', {
          userId:      user.email || user.id,
          userName:    user.name,
          planId:      plan.id,
          pgProvider:  selectedPg,
          paymentType: 'billing_first',
          amount:      plan.priceNum,
          status:      'paid',
          imp_uid,
          merchant_uid,
        }).catch(() => {});
        setShowLiteProConfirm(false);
        // ✅ 11TH-B1: 이전 타이머 정리 후 재등록
        if (navTimerRef.current) clearTimeout(navTimerRef.current);
        navTimerRef.current = setTimeout(() => navigate('/', { replace: true }), 1200);
      }
    } catch (err) {
      addToast(err.message || '정기결제 등록에 실패했습니다. 다시 시도해주세요.', 'error');
    } finally {
      setPurchasing(false);
    }
  };

  // VVIP 항구 독점 정기결제 등록
  const handlePurchase = async () => {
    if (!user) { addToast('로그인이 필요합니다.', 'error'); return; }
    setPurchasing(true);
    try {
      // ① 포트원 빌링키 등록 + 첫 결제
      const { imp_uid, customer_uid, merchant_uid } = await requestBillingPayment({
        pgKey:     selectedPg,
        planId:    'VVIP',
        planLabel: `VVIP - ${selectedHarbor.name}`,
        amount:    550000,
        user,
        harborId:  selectedHarbor.id,
      });

      // ② 서버에 빌링키 + 항구 선점 등록
      const res = await apiClient.post('/api/payment/billing/register', {
        imp_uid, customer_uid,
        planId:     'VVIP',
        pgProvider: selectedPg,
        harborId:   selectedHarbor.id,
        userId:     user.email || user.id,
        userName:   user.name,
      });

      if (res.data.success) {
        setUserTier('BUSINESS_VIP');
        updateUser({ tier: 'BUSINESS_VIP' });
        // ✅ 11TH-B5: markHarborTaken useCallback
        markHarborTaken(selectedHarbor.id, user.name);
        setMySlot({ harborId: selectedHarbor.id, harborName: selectedHarbor.name, expiresAt: res.data.nextBillingDate });
        addToast(`🎉 ${selectedHarbor.name} VVIP 정기구독 등록 완료!`, 'success');
        addToast(`✅ 매월 ${new Date(res.data.nextBillingDate).getDate()}일 자동 청구됩니다.`, 'info');
        // 결제 내역 자동 저장
        apiClient.post('/api/payment/history/record', {
          userId:      user.email || user.id,
          userName:    user.name,
          planId:      'VVIP',
          pgProvider:  selectedPg,
          paymentType: 'billing_first',
          amount:      550000,
          status:      'paid',
          imp_uid,
          merchant_uid,
        }).catch(() => {});
        setShowConfirm(false);
        // ✅ 11TH-B1: 이전 타이머 정리 후 재등록
        if (navTimerRef.current) clearTimeout(navTimerRef.current);
        navTimerRef.current = setTimeout(() => navigate('/', { replace: true }), 1200);
      }
    } catch (err) {
      addToast(err.message || '정기결제 등록 실패. 다시 시도해주세요.', 'error');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#0A0F1C', minHeight: '100dvh', paddingBottom: '40px' }}>
      {/* 헤더 */}
      <div style={{ backgroundColor: 'rgba(10,15,28,0.97)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,215,0,0.12)' }}>
        <button onClick={() => selectedPlan ? setSelectedPlan(null) : navigate(-1)} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
          <X size={24} color="#FFD700" />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '17px', fontWeight: '900', margin: 0, color: '#FFD700' }}>
            {selectedPlan === 'VVIP' ? '👑 VVIP 항구 독점 구독' : '👑 프리미엄 멤버십 구독'}
          </h1>
          {selectedPlan === 'VVIP' && (
            <div style={{ fontSize: '11px', color: 'rgba(255,215,0,0.5)', marginTop: '2px' }}>← 플랜 선택으로 돌아가기</div>
          )}
        </div>
        {selectedPlan === 'VVIP' && (
          <div style={{ fontSize: '12px', color: 'rgba(255,215,0,0.7)', fontWeight: '800', textAlign: 'right' }}>
            잔여<br />
            <span style={{ fontSize: '18px', color: availableCount > 0 ? '#00C48C' : '#FF5A5F', fontWeight: '900' }}>{availableCount}</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>/{HARBORS_STATIC.length}</span>{/* ✅ 24TH-C4: 하드코딩 /23 → HARBORS_STATIC.length */}
          </div>
        )}
      </div>

      {/* ── STEP 1: 플랜 선택 화면 ── */}
      {!selectedPlan && (
        <div style={{ padding: '20px 16px 0' }}>
          {/* 안내 헤더 */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎣</div>
            <div style={{ fontSize: '20px', fontWeight: '950', color: '#fff', marginBottom: '6px' }}>멤버십 플랜 선택</div>
            {/* ✅ NEW-C5: 포트원 자동결제 구현 완료 — 기존 '마스터 안내' 문구 제거 */}
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>낚시GO 프리미엄 기능을 이용하세요<br />플랜 선택 후 즉시 정기구독이 시작됩니다</div>
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
                <div style={{ position: 'absolute', top: '16px', right: '16px', background: plan.hot ? '#1565C0' : 'linear-gradient(135deg,#FFD700,#FFA000)', color: plan.hot ? '#fff' : '#5C3A00', fontSize: '10px', fontWeight: '900', padding: '3px 10px', borderRadius: '12px' }}>{plan.badge}</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                <div style={{ width: '48px', height: '48px', background: `linear-gradient(135deg, ${plan.color}, ${plan.color}88)`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 14px ${plan.color}44` }}>
                  <Crown size={24} color={plan.id === 'VVIP' ? '#5C3A00' : '#fff'} fill={plan.id === 'VVIP' ? '#5C3A00' : 'none'} />
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '950', color: plan.color }}>{plan.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                    <span style={{ fontSize: '22px', fontWeight: '950', color: '#fff' }}>{plan.price}</span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{plan.period}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: '700' }}>✓ {f}</div>
                ))}
              </div>
              <div style={{ marginTop: '14px', width: '100%', padding: '12px', background: plan.id === 'VVIP' ? 'linear-gradient(135deg,#FFD700,#FFA000)' : `${plan.color}22`, border: `1px solid ${plan.border}`, borderRadius: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '900', color: plan.id === 'VVIP' ? '#1A1A2E' : plan.color }}>
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
                <h2 style={{ fontSize: '20px', fontWeight: '950', color: '#fff', margin: '0 0 4px' }}>{plan.label} 멤버십</h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>월 {plan.price} 정기 구독</p>
              </div>
              <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '16px', padding: '18px', marginBottom: '14px' }}>
                {[{ label: '플랜', value: plan.label }, { label: '구독 기간', value: '31일 (익월 자동갱신 알림)' }, { label: '결제 금액', value: plan.price, highlight: true }].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i < 2 ? '10px' : 0, paddingTop: i === 2 ? '10px' : 0, borderTop: i === 2 ? '1px solid rgba(255,215,0,0.15)' : 'none' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{row.label}</span>
                    <strong style={{ fontSize: row.highlight ? '17px' : '13px', color: row.highlight ? plan.color : '#fff' }}>{row.value}</strong>
                  </div>
                ))}
              </div>
              {/* PG 선택 */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '8px', fontWeight: '700' }}>결제 수단 선택</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {PG_OPTIONS.map(pgKey => {
                    const cfg = PG_CONFIG[pgKey];
                    const active = selectedPg === pgKey;
                    return (
                      <button key={pgKey} onClick={() => setSelectedPg(pgKey)}
                        style={{
                          flex: 1, padding: '10px 4px', borderRadius: '12px', border: 'none',
                          background: active ? cfg.color : 'rgba(255,255,255,0.07)',
                          color: active ? cfg.textColor : 'rgba(255,255,255,0.5)',
                          fontSize: '12px', fontWeight: '900', cursor: 'pointer',
                          transition: 'all 0.15s',
                          boxShadow: active ? `0 4px 12px ${cfg.color}55` : 'none',
                        }}
                      >
                        {cfg.emoji} {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: 'rgba(0,100,255,0.08)', border: '1px solid rgba(0,100,255,0.2)', borderRadius: '12px', padding: '12px', marginBottom: '18px' }}>
                <p style={{ fontSize: '12px', color: 'rgba(200,220,255,0.85)', margin: 0, lineHeight: '1.7', fontWeight: '600' }}>
                  {PG_CONFIG[selectedPg].emoji} <strong>{PG_CONFIG[selectedPg].label}</strong>로 즉시 결제됩니다.<br />
                  결제 완료 즉시 플랜이 자동 활성화됩니다.
                </p>
              </div>
              <button onClick={() => handleLiteProPurchase(plan)} disabled={purchasing} style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: `linear-gradient(135deg, ${plan.color}, ${plan.color}aa)`, color: plan.id === 'VVIP' ? '#1A1A2E' : '#fff', fontSize: '16px', fontWeight: '950', cursor: 'pointer', marginBottom: '10px', opacity: purchasing ? 0.7 : 1 }}>
                {purchasing ? '결제 진행 중...' : `${PG_CONFIG[selectedPg].emoji} ${plan.label} 정기구독 시작`}
              </button>
              <button onClick={() => { setShowLiteProConfirm(false); setSelectedPlan(null); }} style={{ width: '100%', padding: '13px', border: 'none', background: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '14px', cursor: 'pointer' }}>취소</button>
            </div>
          </div>
        );
      })()}


      {/* ── STEP 2: VVIP 항구 선택 화면 ── */}
      {selectedPlan === 'VVIP' && (<>
      {mySlot && (
        <div style={{ margin: '12px 16px 0', background: 'linear-gradient(135deg, #FFD700, #FF9B26)', borderRadius: '18px', padding: '16px 18px' }}>
          <div style={{ fontSize: '10px', fontWeight: '900', color: '#5C3A00', marginBottom: '3px', letterSpacing: '0.06em' }}>내 VVIP 독점 항구</div>
          <div style={{ fontSize: '20px', fontWeight: '950', color: '#1A1A2E' }}>👑 {mySlot.harborName}</div>
          {mySlot.expiresAt && (
            <div style={{ fontSize: '11px', color: '#5C3A00', fontWeight: '700', marginTop: '4px' }}>
              만료: {new Date(mySlot.expiresAt).toLocaleDateString('ko-KR')}
            </div>
          )}
        </div>
      )}

      {/* 안내 배너 */}
      {!mySlot && (
        <div style={{ margin: '12px 16px 0', background: 'linear-gradient(135deg, #1A1A2E, #0F3460)', borderRadius: '18px', padding: '18px 20px', color: '#fff' }}>
          <Crown size={28} color="#FFD700" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '16px', fontWeight: '900', marginBottom: '4px' }}>항구별 선착순 1명 독점</div>
          <div style={{ fontSize: '12px', opacity: 0.75, lineHeight: 1.6 }}>
            선택한 항구의 선상 홍보 피드 <strong style={{ color: '#FFD700' }}>최상단 영구 고정</strong>.<br />
            전국 낚시인 포인트 검색 시 가장 먼저 노출됩니다.
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '950', color: '#FFD700' }}>₩550,000</div>
              <div style={{ fontSize: '10px', opacity: 0.65 }}>월 정액 · 세금계산서</div>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '950', color: availableCount > 0 ? '#00C48C' : '#FF5A5F' }}>{availableCount}석</div>
              <div style={{ fontSize: '10px', opacity: 0.65 }}>전국 잔여 자리</div>
            </div>
          </div>
        </div>
      )}

      {/* 권역 탭 */}
      <div style={{ padding: '14px 16px 8px', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {REGION_TABS.map(tab => (
          <button key={tab} onClick={() => setSelectedRegion(tab)} style={{
            padding: '7px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '800', whiteSpace: 'nowrap', cursor: 'pointer',
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
          const disabled = harbor.isTaken && !harbor.isMyHarbor;
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
                  <span style={{ fontSize: '10px', background: 'rgba(255,215,0,0.15)', color: '#FFD700', padding: '2px 7px', borderRadius: '5px', fontWeight: '800' }}>{harbor.area}</span>
                  <span style={{ fontSize: '15px', fontWeight: '900', color: harbor.isMyHarbor ? '#FFD700' : disabled ? 'rgba(255,255,255,0.25)' : '#fff' }}>
                    {harbor.name}
                  </span>
                  {harbor.isMyHarbor && (
                    <span style={{ fontSize: '10px', background: '#FFD700', color: '#1A1A2E', padding: '2px 8px', borderRadius: '5px', fontWeight: '900' }}>내 자리</span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <MapPin size={9} style={{ marginRight: '3px', verticalAlign: 'middle' }} />{harbor.desc}
                </div>
                <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: '700' }}>
                  {harbor.isMyHarbor
                    ? <span style={{ color: '#FFD700', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={11} /> 독점 활성 중</span>
                    : disabled
                      ? <span style={{ color: '#FF5A5F' }}>🔒 마감 — {harbor.takenBy} 선장</span>
                      : <span style={{ color: '#00C48C', display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={10} fill="#00C48C" /> 선착순 구매 가능 · ₩550,000/월</span>}
                </div>
              </div>

              {!disabled && !harbor.isMyHarbor && (
                <div style={{ color: '#FFD700', fontSize: '20px', fontWeight: '900', flexShrink: 0 }}>›</div>
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
              <h2 style={{ fontSize: '20px', fontWeight: '950', color: '#fff', margin: '0 0 4px' }}>{selectedHarbor.name}</h2>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{selectedHarbor.area} · {REGION_EMOJI[selectedHarbor.region]} {selectedHarbor.region}</p>
            </div>

            <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '16px', padding: '18px', marginBottom: '14px' }}>
              {[
                { label: '선택 항구', value: `${selectedHarbor.area} · ${selectedHarbor.name}` },
                { label: '독점 인원', value: '해당 항구 내 유일 1명' },
                { label: '구독 기간', value: '31일 (익월 자동갱신 알림)' },
                { label: '결제 금액', value: '₩550,000', highlight: true },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i < 3 ? '10px' : 0, paddingTop: i === 3 ? '10px' : 0, borderTop: i === 3 ? '1px solid rgba(255,215,0,0.15)' : 'none' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{row.label}</span>
                  <strong style={{ fontSize: row.highlight ? '17px' : '13px', color: row.highlight ? '#FFD700' : '#fff' }}>{row.value}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: '12px', padding: '12px', marginBottom: '18px' }}>
              <AlertTriangle size={14} color="#FF5A5F" style={{ marginTop: '2px', flexShrink: 0 }} />
              <p style={{ fontSize: '12px', color: 'rgba(100,200,255,0.9)', margin: 0, lineHeight: '1.7', fontWeight: '600' }}>
                🔄 카드 등록 후 <strong>매월 자동 청구</strong>됩니다.<br />언제든지 마이페이지에서 취소 가능합니다.
              </p>
            </div>

            <button onClick={handlePurchase} disabled={purchasing}
              style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg,#FFD700,#FF9B26)', color: '#1A1A2E', fontSize: '16px', fontWeight: '950', cursor: 'pointer', marginBottom: '10px', opacity: purchasing ? 0.7 : 1 }}>
              {purchasing ? '결제 진행 중...' : `${PG_CONFIG[selectedPg].emoji} ${selectedHarbor?.name} 정기구독 시작`}
            </button>
            <button onClick={() => setShowConfirm(false)}
              style={{ width: '100%', padding: '13px', border: 'none', background: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '14px', cursor: 'pointer' }}>
              취소
            </button>
          </div>
        </div>
      )}
      </>)}
    </div>
  );
}
