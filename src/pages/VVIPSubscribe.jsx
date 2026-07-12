import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Crown, Lock, MapPin, Star, CheckCircle2, RefreshCw, Smartphone, Zap } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import apiClient from '../api/index';
import { initIAP, purchasePlan, restorePurchases, IAP_PRODUCTS, isStoreReady, resetIAP } from '../services/GoogleIAPService';
import { UCB_ENABLED, openPayplePayment } from '../services/PaypleService';

/* ── 항구 목록 ──────────────────────────────────────────────────── */
const HARBORS_STATIC = [
  { id: 'gangneung',  name: '강릉·강문',        region: '동해권', area: '강원', desc: '안목·강문항, 감성돔·방어·가자미' },
  { id: 'jumunjin',   name: '주문진',            region: '동해권', area: '강원', desc: '오징어·대구 최대 어항, 야간선상 유명' },
  { id: 'sokcho',     name: '속초',              region: '동해권', area: '강원', desc: '대구·명태·가자미, 동해 북부 거점' },
  { id: 'goseong',    name: '고성(거진)',         region: '동해권', area: '강원', desc: '공현진·거진항, 도루묵·가자미' },
  { id: 'yangyang',   name: '양양(낙산·남애)',   region: '동해권', area: '강원', desc: '낙산·남애·동산항, 연어·명태·방어' },
  { id: 'donghae',    name: '동해·묵호',         region: '동해권', area: '강원', desc: '묵호항, 오징어 야간선상 성지' },
  { id: 'samcheok',   name: '삼척',              region: '동해권', area: '강원', desc: '임원·장호항, 돌돔·열기 청정 어장' },
  { id: 'guryongpo',  name: '구룡포(포항)',      region: '동해권', area: '경북', desc: '구룡포·영일만, 참돔·대게 유명' },
  { id: 'gampo',      name: '감포(경주)',        region: '동해권', area: '경북', desc: '감포·양포, 붉바리·감성돔' },
  { id: 'ganggu',     name: '강구(영덕)',        region: '동해권', area: '경북', desc: '강구항, 대게·문어 선상낚시' },
  { id: 'hupo',       name: '후포(울진)',        region: '동해권', area: '경북', desc: '후포항 일대, 볼락·방어' },
  { id: 'jukbyeon',   name: '죽변(울진)',        region: '동해권', area: '경북', desc: '죽변항, 대구·오징어·가자미' },
  { id: 'gijang',     name: '기장',              region: '남해권', area: '부산', desc: '대변항, 멸치·참돔 최대 어장' },
  { id: 'dadaepo',    name: '다대포',            region: '남해권', area: '부산', desc: '다대포항, 주꾸미·갑오징어' },
  { id: 'yongho',     name: '용호부두',          region: '남해권', area: '부산', desc: '용호부두, 참돔·삼치 루어' },
  { id: 'tongyeong',  name: '통영',              region: '남해권', area: '경남', desc: '한려수도 중심, 섬·선상낚시 천국' },
  { id: 'geoje',      name: '거제(대포·금포)',   region: '남해권', area: '경남', desc: '대포·금포항, 감성돔·참돔 대물' },
  { id: 'namhae',     name: '남해(미조·상주)',   region: '남해권', area: '경남', desc: '미조·상주항, 참돔·삼치·방어' },
  { id: 'goseong_s',  name: '고성',              region: '남해권', area: '경남', desc: '자란만·당항포, 갑오징어·감성돔' },
  { id: 'yeosu',      name: '여수(국동)',        region: '남해권', area: '전남', desc: '돌산·거문도, 붉바리·참돔 대물' },
  { id: 'wando',      name: '완도',              region: '남해권', area: '전남', desc: '보길도·청산도, 돌돔·참돔' },
  { id: 'goheung',    name: '고흥(나로도)',      region: '남해권', area: '전남', desc: '나로도항, 감성돔·참돔' },
  { id: 'jindo',      name: '진도',              region: '남해권', area: '전남', desc: '명량수도, 부시리·방어 시즌' },
  { id: 'incheon_n',  name: '인천 남항부두',    region: '서해권', area: '인천', desc: '남항부두, 우럭·광어 선상 중심지' },
  { id: 'incheon_y',  name: '인천 연안부두',    region: '서해권', area: '인천', desc: '연안부두, 소래·영종도 출항' },
  { id: 'taean',      name: '태안(안흥·마검포)', region: '서해권', area: '충남', desc: '안흥·마검포항, 주꾸미·꽃게' },
  { id: 'boryeong',   name: '보령(무창포·오천)', region: '서해권', area: '충남', desc: '무창포·오천항, 광어·우럭' },
  { id: 'seosan',     name: '서산(삼길포)',      region: '서해권', area: '충남', desc: '삼길포항, 광어·도다리' },
  { id: 'gunsan',     name: '군산(비응·야미도)', region: '서해권', area: '전북', desc: '비응·야미도, 벵에돔·참돔' },
  { id: 'buan',       name: '부안(격포·위도)',   region: '서해권', area: '전북', desc: '격포·위도, 우럭·도다리' },
  { id: 'mokpo',      name: '목포',              region: '서해권', area: '전남', desc: '흑산도·홍도 거점, 참돔·벵에돔' },
  { id: 'jeju_dodu',  name: '도두항(제주시)',   region: '제주권', area: '제주', desc: '도두항, 자리돔·갈치·방어' },
  { id: 'jeju_aewol', name: '애월항(제주시)',   region: '제주권', area: '제주', desc: '애월항, 다금바리·벵에돔 성지' },
  { id: 'seogwipo',   name: '서귀포',            region: '제주권', area: '제주', desc: '서귀포항, 참돔·방어·다금바리' },
  { id: 'mosulpo',    name: '모슬포',            region: '제주권', area: '제주', desc: '마라도·가파도 거점, 방어·참돔' },
  { id: 'sungsan',    name: '성산항',            region: '제주권', area: '제주', desc: '성산일출봉 인근, 돌돔·감성돔' },
];
const REGION_TABS  = ['전체', '동해권', '남해권', '서해권', '제주권'];
const REGION_EMOJI = { '동해권': '🌊', '남해권': '⚓', '서해권': '🦀', '제주권': '🌺' };

/* ── 플랜 정의 ──────────────────────────────────────────────────── */
const PLANS = [
  {
    key: 'VVIP',
    label: 'VVIP 프리미엄',
    price: '₩59,000',
    period: '/ 월',
    color: '#FFD700',
    border: 'rgba(255,215,0,0.4)',
    bg: 'rgba(255,215,0,0.08)',
    tier: 'BUSINESS_VIP',
    badge: '최고 권한',
    features: [
      { icon: '👑', text: '앱 내 모든 프리미엄 기능 무제한' },
      { icon: '🗺️', text: '전국 모든 VVIP 비밀 포인트 열람' },
      { icon: '🌟', text: '커뮤니티 및 랭킹 최상단 VVIP 노출' },
      { icon: '📞', text: '전담 어드바이저 1:1 매칭 지원' },
    ],
  }
];

/* ══════════════════════════════════════════════════════════════════
   메인 컴포넌트
══════════════════════════════════════════════════════════════════ */
export default function VVIPSubscribe() {
  const user     = useUserStore(s => s.user);
  const setUser  = useUserStore(s => s.setUser);
  const addToast = useToastStore(s => s.addToast);

  const [view, setView]                   = useState('plan'); // 'plan' | 'harbor'
  const [iapReady, setIapReady]           = useState(false);
  const [storeReady, setStoreReady]       = useState(false); // ✅ React 재렌더용 - isStoreReady()는 모듈변수라 React 추적 불가
  const [iapProgress, setIapProgress]     = useState(0);  // ✅ IAP 수버 로딩중 % 표시
  const [loading, setLoading]             = useState(null);  // 로딩 중인 planKey
  const [restoring, setRestoring]         = useState(false);
  // UCB 결제 선택 다이얼로그
  const [payDialog, setPayDialog]         = useState(null);  // planKey | null
  // VVIP 항구
  const [takenMap, setTakenMap]           = useState({});
  const [mySlot, setMySlot]               = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [selectedHarbor, setSelectedHarbor] = useState(null);
  const [showHarborConfirm, setShowHarborConfirm] = useState(false);

  const isNative     = !!(window?.Capacitor?.isNativePlatform?.());
  const isMountedRef = useRef(true);       // ✅ BUG-4 FIX: 언마운트 후 setState 호출 방지
  const reconnectTimerRef = useRef(null);  // 재연결 setTimeout ID 저장 (cleanup용)

  const currentTier  = user?.tier || 'FREE';
  const TIER_RANK    = { FREE: 0, CAPTAIN: 0.5, BUSINESS_LITE: 1, PRO: 2, BUSINESS_VIP: 3, MASTER: 4 };
  const TIER_LABELS  = { CAPTAIN: '선장', BUSINESS_LITE: 'PRO', PRO: '기존 PRO', BUSINESS_VIP: 'VVIP', MASTER: '마스터' };
  const isVVIP       = (TIER_RANK[currentTier] || 0) >= 3; // BUSINESS_VIP 이상

  const isPlanOwned = (planTier) =>
    (TIER_RANK[currentTier] || 0) >= (TIER_RANK[planTier] || 0);

  // ✅ BUG-4 FIX: 컴포넌트 언마운트 시 isMountedRef 해제 + setTimeout 초소
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, []);

  /* ── IAP 초기화 ───────────────────────────────────────────── */
  useEffect(() => {
    if (!isNative) return;
    let isMounted = true;
    
    // 무한 대기 방지: 최대 8초 대기 후 결제 모듈 준비 상태로 전환 (deviceready 5초 + 초기화 시간)
    const timer = setTimeout(() => {
      if (isMounted) setIapReady(true);
    }, 8000);

    const doInit = () => {
      initIAP({
        onSuccess: async () => {
          if (!isMountedRef.current) return; // ✅ BUG-V1 FIX: 언마운트 확인
          // ✅ 결제 완료 후 tier 반영까지 최대 3회 재시도 (서버 DB 반영 지연 대비)
          addToast('✅ 구독이 완료되었습니다! 등급을 갱신합니다.', 'success');
          let tierUpdated = false;
          for (let i = 0; i < 3; i++) {
            if (!isMountedRef.current) break; // ✅ 루프 중 언마운트 체크
            try {
              const res = await apiClient.get('/api/user/me');
              // ✅ /api/user/me는 플랫 객체 반환 ({ id, email, tier, ... })
              if (res.data?.tier && res.data.tier !== 'FREE') {
                if (isMountedRef.current) setUser(res.data);
                const label = TIER_LABELS[res.data.tier] || res.data.tier;
                if (isMountedRef.current) addToast(`🎉 ${label} 등급이 적용되었습니다!`, 'success');
                tierUpdated = true;
                break;
              } else if (res.data?.email && isMountedRef.current) {
                setUser(res.data); // tier가 FREE여도 최신 정보 반영
              }
            } catch {}
            if (i < 2) await new Promise(r => setTimeout(r, 1500)); // 1.5초 대기
          }
          if (isMountedRef.current) {
            if (!tierUpdated) {
              addToast('⚠️ 등급 적용이 지연됩니다. 앱을 재시작해주세요.', 'info');
            }
            setLoading(null);
          }
        },
        onError: (err) => {
          if (err?.isVerifyFailure) {
            // ✅ BUG-2 FIX: 결제는 완료됐으나 서버 검증 실패 → 재시도 유도 안 함
            addToast('✅ 결제 완료! 앱 재시작 시 자동으로 등급이 적용됩니다.', 'info');
          } else if (err?.code !== 6) {
            addToast('결제 중 오류가 발생했습니다.', 'error');
          }
          setLoading(null);
        },
      })
      .then(() => {
        clearTimeout(timer); // ✅ 성공 시 8초 타이머 즉시 해제
        if (isMounted) {
          setIapReady(true);
          setStoreReady(isStoreReady());
        }
      })
      .catch((err) => {
        clearTimeout(timer); // ✅ 실패 시도 타이머 해제
        const errMsg = err?.message || String(err);
        if (!import.meta.env.PROD) console.warn('[IAP] init fail:', errMsg); // ✅ FIX: PROD 가드 추가
        if (isMounted) {
          setIapReady(true);
          setStoreReady(false);
          addToast('결제 초기화 실패: ' + errMsg.slice(0, 80), 'error');
        }
      });
    };
    doInit();

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isNative, addToast, setUser]);

  /* ── IAP 결제 진행률 % 표시 ──────────────────────── */
  useEffect(() => {
    if (!isNative || iapReady) return;
    const start = Date.now();
    const total = 8000; // ✅ 8초 타임아웃과 일치
    const timer = setInterval(() => {
      const pct = Math.min(95, Math.round(((Date.now() - start) / total) * 100));
      setIapProgress(pct);
      if (pct >= 95) clearInterval(timer);
    }, 100);
    return () => clearInterval(timer);
  }, [isNative, iapReady]);

  useEffect(() => {
    if (iapReady) setIapProgress(100);
  }, [iapReady]);

  /* ── VVIP 항구 데이터 (실시간 폴링) ──────────────────────────── */
  const fetchHarborData = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/vvip/harbors');
      if (!isMountedRef.current) return; // ✅ BUG-V3 FIX: 응답 후 언마운트 체크
      const map = {};
      (res.data.harbors || []).forEach(h => {
        if (h.isTaken) map[h.id] = { takenBy: h.takenBy, expiresAt: h.expiresAt, daysLeft: h.daysLeft };
      });
      setTakenMap(map);
      // ✅ FIX-COLD-START: 서버 DB 로드 미완료(slotsReady:false) 시 2초 후 자동 재시도
      if (res.data.slotsReady === false) {
        setTimeout(() => { if (isMountedRef.current) fetchHarborData(); }, 2000);
      }

    } catch {} // ✅ 폴링 실패 시 old 데이터 유지 (네트워크 오류마다 깜빡임 방지)
    if (user && isMountedRef.current) { // ✅ BUG-V3 FIX: 언마운트 후 2차 API 호출 방지
      try {
        const res2 = await apiClient.get('/api/vvip/my-slot');
        if (!isMountedRef.current) return; // ✅ 2차 응답 후 언마운트 체크
        if (res2.data.hasSlot) {
          setMySlot({ harborId: res2.data.harbor?.id, harborName: res2.data.harbor?.name, expiresAt: res2.data.slot?.expiresAt });
        } else {
          setMySlot(null); // ✅ 슬롯 해제 시 null 반영
        }
      } catch {}
    }
  // ✅ BUG-6 FIX: user 전체 대신 user?.email만 의존 (객체 참조 변경으로 interval 재등록 맜음)
  }, [user?.email]);

  useEffect(() => {
    fetchHarborData(); // 즉시 로드
    const id = setInterval(fetchHarborData, 10000); // ✅ 10초 폴링
    const onFocus = () => fetchHarborData();
    window.addEventListener('focus', onFocus); // ✅ 포커스 시 즉시 갱신
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus); };
  }, [fetchHarborData]);

  /* ── VVIP 항구 슬롯 선점 (VVIP 유저 전용) ─────────────────────── */
  const handleHarborPurchase = useCallback(async (harbor) => {
    setShowHarborConfirm(false);
    try {
      const res = await apiClient.post('/api/vvip/purchase', {
        harborId: harbor.id,
        // ✅ BUG-5 FIX: userId에 이메일 대신 name 사용 (개인정보 노옶 방지)
        // 서버는 JWT로 이엤 식별 — userId는 표시용 닉네임만 사용
        userId: user?.name || user?.email || '선장',
        userName: user?.name || '선장',
      });
      if (!isMountedRef.current) return; // ✅ 언마운트 후 응답 도착 방어
      addToast(`👑 ${harbor.name} 독점 선점 완료!`, 'success');
      setMySlot({ harborId: harbor.id, harborName: harbor.name, expiresAt: res.data?.expiresAt });
      fetchHarborData(); // 잔여 현황 즉시 갱신
    } catch (err) {
      if (!isMountedRef.current) return; // ✅ 언마운트 후 에러 토스트 방어
      const msg = err?.response?.data?.error || '항구 선점 실패. 다시 시도해주세요.';
      addToast(msg, 'error');
    }
  }, [user?.name, user?.email, addToast, fetchHarborData]);

  /* ── VVIP 항구 선택 ────────────────────────────────────────── */
  const handleSelectHarbor = (harbor) => {
    // 내 항구 클릭 → 정보만 표시
    if (harbor.isMyHarbor) {
      addToast(`👑 ${harbor.name} — 내 VVIP 독점 항구입니다.`, 'info');
      return;
    }
    if (harbor.isTaken) return addToast(`${harbor.name}은 이미 선점된 자리입니다.`, 'error');
    if (mySlot) return addToast('이미 다른 항구를 선점 중입니다.', 'error');
    // VVIP/비VVIP 모두 다이얼로그 진입 (다이얼로그 내부에서 분기)
    setSelectedHarbor(harbor);
    setShowHarborConfirm(true);
  };

  const harbors = HARBORS_STATIC.map(h => ({ ...h, isTaken: !!takenMap[h.id], takenBy: takenMap[h.id]?.takenBy || null, daysLeft: takenMap[h.id]?.daysLeft ?? null, expiresAtSlot: takenMap[h.id]?.expiresAt || null, isMyHarbor: mySlot?.harborId === h.id }));
  const filtered = selectedRegion === '전체' ? harbors : harbors.filter(h => h.region === selectedRegion);
  const takenCount = Object.keys(takenMap).length;
  const availableCount = HARBORS_STATIC.length - takenCount; // ✅ 점유 해제 시 즉시 반영

  /* ── 결제 버튼 클릭 ──────────────────────────────────────── */
  const handlePlanClick = useCallback((planKey) => {
    if (!user) return addToast('로그인이 필요합니다.', 'error');
    if (!isNative) return addToast('앱에서만 구독 가능합니다.', 'info');
    // ✅ storeReady state로 체크 (모듈 변수 isStoreReady() 대신)
    if (!storeReady) {
      // ✅ BUG-V2 FIX: 재연결 중 버튼 연타 → 중복 initIAP 방지
      if (reconnectTimerRef.current) return;
      addToast('Google Play 재연결 중...', 'info');
      resetIAP();
      setIapReady(false);
      setStoreReady(false);
      setIapProgress(0);
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null; // ✅ 완료 후 반드시 초기화 (재시도 허용)
        if (!isMountedRef.current) return; // ✅ 언마운트 후 실행 방지
        // ✅ 재연결 시에도 FULL 콜백으로 initIAP 호출
        // - 재연결 중 결제 완료 시에도 tier 업데이트 정상 동작
        initIAP({
          onSuccess: async () => {
            if (!isMountedRef.current) return; // ✅ 언마운트 확인
            addToast('✅ 구독이 완료되었습니다! 등급을 갱신합니다.', 'success');
            let tierUpdated = false;
            for (let i = 0; i < 3; i++) {
              if (!isMountedRef.current) break; // ✅ 재시도 루프 중 언마운트 체크
              try {
                const res = await apiClient.get('/api/user/me');
                // ✅ /api/user/me는 플랫 객체 반환 ({ id, email, tier, ... })
                if (res.data?.tier && res.data.tier !== 'FREE') {
                  if (isMountedRef.current) setUser(res.data);
                  const label = { BUSINESS_LITE: '베이직', PRO: 'PRO', BUSINESS_VIP: 'VVIP', MASTER: '마스터' }[res.data.tier] || res.data.tier;
                  if (isMountedRef.current) addToast(`🎉 ${label} 등급이 적용되었습니다!`, 'success');
                  tierUpdated = true;
                  break;
                } else if (res.data?.email && isMountedRef.current) setUser(res.data);
              } catch {}
              if (i < 2) await new Promise(r => setTimeout(r, 1500));
            }
            if (isMountedRef.current) {
              if (!tierUpdated) addToast('⚠️ 등급 적용이 지연됩니다. 앱을 재시작해주세요.', 'info');
              setLoading(null);
            }
          },
          onError: (err) => {
            if (!isMountedRef.current) return; // ✅ 언마운트 확인
            if (err?.isVerifyFailure) {
              // ✅ BUG-2 FIX: 결제는 완료됐으나 서버 검증 실패
              addToast('✅ 결제 완료! 앱 재시작 시 자동으로 등급이 적용됩니다.', 'info');
            } else if (err?.code !== 6) {
              addToast('결제 중 오류가 발생했습니다.', 'error');
            }
            setLoading(null);
          },
        })
        .then(() => {
          if (!isMountedRef.current) return; // ✅ 언마운트 확인
          setIapReady(true);
          setStoreReady(isStoreReady());
          if (isStoreReady()) addToast('✅ Google Play 재연결 완료. 다시 시도해주세요.', 'success');
        })
        .catch(() => { if (isMountedRef.current) { setIapReady(true); setStoreReady(false); } });
      }, 300);
      return;
    }
    if (UCB_ENABLED) {
      setPayDialog(planKey);
    } else {
      handleIAPPurchase(planKey);
    }
  }, [user, isNative, addToast, storeReady, setUser]); // handleIAPPurchase는 클로저로 최신값 참조 (deps 불필요)

  /* ── IAP 결제 ─────────────────────────────────────────────── */
  const handleIAPPurchase = useCallback(async (planKey) => {
    setPayDialog(null);
    // ✅ iapReady 차단 제거 — purchasePlan이 직접 에러 반환
    setLoading(planKey);
    try {
      await purchasePlan(planKey);
    } catch (err) {
      if (err?.message !== 'NATIVE_ONLY') addToast(err?.message || '결제를 시작할 수 없습니다.', 'error');
      setLoading(null);
    }
  }, [addToast]);

  /* ── UCB 페이플 결제 ──────────────────────────────────────── */
  const handlePayplePurchase = useCallback(async (planKey) => {
    setPayDialog(null);
    if (!UCB_ENABLED) return;
    setLoading(planKey);
    try {
      await openPayplePayment(planKey, { email: user?.email, name: user?.name });
      addToast('웹 브라우저에서 결제를 완료해 주세요.', 'info');
    } catch (err) {
      addToast(err?.message || '페이플 결제 오류', 'error');
    } finally {
      setLoading(null);
    }
  }, [user]);

  /* ── 복원 ─────────────────────────────────────────────────── */
  const handleRestore = useCallback(async () => {
    setRestoring(true);
    try {
      await restorePurchases();
      if (!isMountedRef.current) return; // ✅ FIX: 복원 중 언마운트 방어
      addToast('구독 복원을 시도했습니다. 잠시 후 등급이 갱신됩니다.', 'info');
      // ✅ 복원 후 3초 뒤 user 정보 갱신 (복원 처리 시간 대기)
      await new Promise(r => setTimeout(r, 3000));
      if (!isMountedRef.current) return; // ✅ FIX: 3초 대기 후 언마운트 방어
      try {
        const res = await apiClient.get('/api/user/me');
        if (!isMountedRef.current) return; // ✅ FIX: API 응답 후 언마운트 방어
        if (res.data?.email) {
          setUser(res.data);
          if (res.data.tier !== 'FREE') {
            const label = { BUSINESS_LITE: '베이직', PRO: 'PRO', BUSINESS_VIP: 'VVIP', MASTER: '마스터' }[res.data.tier] || res.data.tier;
            addToast(`✅ ${label} 등급 복원 완료!`, 'success');
          }
        }
      } catch {}
    }
    catch { if (isMountedRef.current) addToast('복원 중 오류가 발생했습니다.', 'error'); } // ✅ FIX
    finally { if (isMountedRef.current) setRestoring(false); } // ✅ FIX
  }, [addToast, setUser]);

  /* ════════════════════════════════════════════════════════════
     렌더
  ════════════════════════════════════════════════════════════ */
  return (
    <div style={{ backgroundColor: '#0A0F1C', minHeight: '100dvh', paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 40px)' }}>

      {/* 헤더 */}
      <div style={{ backgroundColor: 'rgba(10,15,28,0.97)', padding: '16px 20px', paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(200,212,0,0.15)' }}>
        <button onClick={() => view === 'harbor' ? setView('plan') : window.history.back()} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
          <X size={24} color="#C8D400" />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: `calc(17px * var(--fs,1))`, fontWeight: '900', margin: 0, color: '#C8D400' }}>
            {view === 'harbor' ? '👑 VVIP 항구 독점' : '🎣 프리미엄 멤버십'}
          </h1>
          {view === 'harbor' && <div style={{ fontSize: `calc(11px * var(--fs,1))`, color: 'rgba(200,212,0,0.5)', marginTop: '2px' }}>← 플랜 선택으로 돌아가기</div>}
        </div>
        {/* UCB 상태 뱃지 */}
        <div style={{ padding: '4px 10px', borderRadius: '20px', fontSize: `calc(10px * var(--fs,1))`, fontWeight: '900', background: UCB_ENABLED ? 'rgba(0,196,140,0.15)' : 'rgba(255,255,255,0.06)', color: UCB_ENABLED ? '#00C48C' : 'rgba(255,255,255,0.3)', border: `1px solid ${UCB_ENABLED ? 'rgba(0,196,140,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
          {UCB_ENABLED ? '⚡ UCB 활성' : '🔒 UCB 준비중'}
        </div>
      </div>

      {/* ══ 플랜 화면 ══════════════════════════════════════════ */}
      {view === 'plan' && (
        <div style={{ padding: '20px 16px 0' }}>

          {/* 현재 등급 배지 */}
          {currentTier !== 'FREE' && (
            <div style={{ background: 'rgba(200,212,0,0.08)', border: '1.5px solid rgba(200,212,0,0.3)', borderRadius: '14px', padding: '12px 16px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={18} color="#C8D400" />
              <div style={{ color: '#C8D400', fontWeight: '800', fontSize: `calc(13px * var(--fs,1))` }}>현재 등급: {currentTier}</div>
            </div>
          )}

          {/* 플랜 카드 */}
          {PLANS.map(plan => {
            const owned   = isPlanOwned(plan.tier);
            const isLoading = loading === plan.key;

            return (
              <div key={plan.key} style={{ background: plan.bg, border: `1.5px solid ${plan.border}`, borderRadius: '20px', padding: '20px', marginBottom: '12px', position: 'relative', overflow: 'hidden' }}>

                {/* 배지 */}
                {plan.badge && (
                  <div style={{ position: 'absolute', top: '16px', right: '16px', background: plan.key === 'VVIP' ? 'linear-gradient(135deg,#FFD700,#FFA000)' : plan.key === 'PRO' ? '#1565C0' : 'rgba(200,212,0,0.2)', color: plan.key === 'VVIP' ? '#5C3A00' : '#fff', fontSize: `calc(10px * var(--fs,1))`, fontWeight: '900', padding: '3px 10px', borderRadius: '12px' }}>{plan.badge}</div>
                )}

                {/* 헤더 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ width: '44px', height: '44px', background: `linear-gradient(135deg,${plan.color},${plan.color}88)`, borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${plan.color}44` }}>
                    <Crown size={22} color={plan.key === 'VVIP' ? '#5C3A00' : '#0A1628'} />
                  </div>
                  <div>
                    <div style={{ fontSize: `calc(16px * var(--fs,1))`, fontWeight: '950', color: plan.color }}>{plan.label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                      <span style={{ fontSize: `calc(22px * var(--fs,1))`, fontWeight: '950', color: '#fff' }}>{plan.price}</span>
                      <span style={{ fontSize: `calc(12px * var(--fs,1))`, color: 'rgba(255,255,255,0.4)' }}>{plan.period}</span>
                    </div>
                  </div>
                </div>

                {/* 혜택 태그 */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 10px', fontSize: `calc(11px * var(--fs,1))`, color: 'rgba(255,255,255,0.7)', fontWeight: '700' }}>{f.icon} {f.text}</div>
                  ))}
                </div>

                {/* VVIP: 잔여 항구 구독하기 (통합 버튼) */}
                {plan.key === 'VVIP' && (
                  mySlot ? (
                    // 이미 구독 중: 내 항구명 표시 + 버튼 역할
                    <button onClick={() => { setView('harbor'); fetchHarborData(); }} style={{ width: '100%', padding: '11px', border: `1.5px solid #FFD700`, borderRadius: '12px', background: 'rgba(255,215,0,0.12)', color: '#FFD700', fontWeight: '900', fontSize: `calc(13px * var(--fs,1))`, cursor: 'pointer', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Crown size={14} color="#FFD700" /> 👑 {mySlot.harborName} 구독 중 · 관리하기
                    </button>
                  ) : (
                    // 미구독: 잔여 항구 구독하기
                    <button onClick={() => { setView('harbor'); fetchHarborData(); }} style={{ width: '100%', padding: '11px', border: `1px solid ${plan.border}`, borderRadius: '12px', background: availableCount > 0 ? 'rgba(255,215,0,0.09)' : 'rgba(255,90,95,0.08)', color: availableCount > 0 ? '#FFD700' : '#FF5A5F', fontWeight: '900', fontSize: `calc(13px * var(--fs,1))`, cursor: 'pointer', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      {availableCount > 0 ? `🏖️ 잔여 항구 구독하기 (${availableCount}/${HARBORS_STATIC.length}석)` : `🔒 전 항구 마감 (잔여 0석)`}
                    </button>
                  )
                )}

                {/* 구매 버튼 — VVIP는 위의 '잔여 항구 구독하기' 버튼으로 통합, 별도 버튼 숨김 */}
                {owned ? (
                  <div style={{ width: '100%', padding: '13px', borderRadius: '14px', background: `rgba(${plan.color === '#C8D400' ? '200,212,0' : plan.color === '#64B5F6' ? '100,181,246' : '255,215,0'},0.1)`, border: `1px solid ${plan.border}`, textAlign: 'center', color: plan.color, fontWeight: '900', fontSize: `calc(14px * var(--fs,1))` }}>
                    ✅ 현재 이용 중
                  </div>
                ) : plan.key === 'VVIP' ? null : (
                  <button
                    onClick={() => handlePlanClick(plan.key)}
                    disabled={owned || isLoading || !iapReady}
                    style={{
                      width: '100%', padding: isNative && !iapReady ? '10px 14px 10px' : '14px', borderRadius: '14px', border: 'none',
                      background: isLoading
                        ? `rgba(${plan.color === '#C8D400' ? '200,212,0' : plan.color === '#64B5F6' ? '100,181,246' : '255,215,0'},0.3)`
                        : plan.key === 'VVIP'
                          ? 'linear-gradient(135deg,#FFD700,#FFA000)'
                          : plan.key === 'PRO'
                            ? 'linear-gradient(135deg,#64B5F6,#1565C0)'
                            : 'linear-gradient(135deg,#C8D400,#a8b200)',
                      color: plan.key === 'VVIP' ? '#1A1A2E' : plan.key === 'BASIC' ? '#0A1628' : '#fff',
                      fontSize: `calc(14px * var(--fs,1))`, fontWeight: '950',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      overflow: 'hidden', position: 'relative',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      boxShadow: `0 4px 16px ${plan.color}33`,
                    }}
                  >
                    {/* ✅ IAP 켈로딩 진행률 표시 */}
                    {isNative && !iapReady && !isLoading && (
                      <>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:`calc(13px * var(--fs,1))` }}>
                          <RefreshCw size={14} style={{ animation:'spin 1s linear infinite' }} />
                          결제 준비 중... {iapProgress}%
                        </div>
                        {/* 프로그레스 바 */}
                        <div style={{ width:'100%', height:'3px', background:'rgba(0,0,0,0.2)', borderRadius:'2px', overflow:'hidden' }}>
                          <div style={{ width:`${iapProgress}%`, height:'100%', background:'rgba(255,255,255,0.7)', borderRadius:'2px', transition:'width 0.1s linear' }} />
                        </div>
                      </>
                    )}
                    {isLoading ? (
                      <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> 결제 진행 중...</>
                    ) : !isNative ? (
                      <><Smartphone size={16} /> 앱에서만 구독 가능</>
                    ) : iapReady && storeReady ? (
                      <>{plan.label} 구독 시작하기</>
                    ) : iapReady && !storeReady ? (
                      <><RefreshCw size={14} /> Google Play 재연결</>
                    ) : null}
                  </button>
                )}
              </div>
            );
          })}

          {/* 구독 복원 */}
          <button onClick={handleRestore} disabled={restoring} style={{ width: '100%', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: `calc(13px * var(--fs,1))`, cursor: 'pointer', marginTop: '4px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <RefreshCw size={14} style={restoring ? { animation: 'spin 1s linear infinite' } : {}} />
            {restoring ? '복원 중...' : '이전 구독 복원하기'}
          </button>

          {/* UCB 준비중 안내 (비활성 시만) */}
          {!UCB_ENABLED && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px 16px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Zap size={14} color="rgba(255,255,255,0.3)" />
                <div style={{ fontSize: `calc(12px * var(--fs,1))`, fontWeight: '800', color: 'rgba(255,255,255,0.3)' }}>카드/카카오/토스 결제 — 준비중</div>
              </div>
              <div style={{ fontSize: `calc(11px * var(--fs,1))`, color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
                현재 구글 플레이 결제만 지원됩니다.<br />
                카드·카카오페이·토스 결제는 곧 업데이트됩니다.
              </div>
            </div>
          )}

          {/* 구독 안내 */}
          <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', marginBottom: '8px' }}>
            <div style={{ fontSize: `calc(11px * var(--fs,1))`, color: 'rgba(255,255,255,0.25)', lineHeight: 1.7 }}>
              · 구글 플레이 계정으로 자동 결제됩니다.<br />
              · 다음 결제일 24시간 전까지 구글 플레이에서 해지 가능합니다.<br />
              · 해지 후에도 기간 만료 전까지 혜택이 유지됩니다.<br />
              · 구독 문의: fishing.go.kr@gmail.com
            </div>
          </div>
        </div>
      )}

      {/* ══ VVIP 항구 현황 화면 ══════════════════════════════ */}
      {view === 'harbor' && (<>
        {mySlot && (
          <div style={{ margin: '12px 16px 0', background: 'linear-gradient(135deg,#FFD700,#FF9B26)', borderRadius: '18px', padding: '16px 18px' }}>
            <div style={{ fontSize: `calc(10px * var(--fs,1))`, fontWeight: '900', color: '#5C3A00', marginBottom: '3px' }}>내 VVIP 독점 항구</div>
            <div style={{ fontSize: `calc(20px * var(--fs,1))`, fontWeight: '950', color: '#1A1A2E' }}>👑 {mySlot.harborName}</div>
            {mySlot.expiresAt && <div style={{ fontSize: `calc(11px * var(--fs,1))`, color: '#5C3A00', fontWeight: '700', marginTop: '4px' }}>만료: {new Date(mySlot.expiresAt).toLocaleDateString('ko-KR')}</div>}
          </div>
        )}
        {!mySlot && (
          <div style={{ margin: '12px 16px 0', background: 'linear-gradient(135deg,#1A1A2E,#0F3460)', borderRadius: '18px', padding: '18px 20px', color: '#fff' }}>
            <Crown size={28} color="#FFD700" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: `calc(16px * var(--fs,1))`, fontWeight: '900', marginBottom: '4px' }}>항구별 선착순 1명 독점</div>
            <div style={{ fontSize: `calc(12px * var(--fs,1))`, opacity: 0.75, lineHeight: 1.6, marginBottom: '12px' }}>선상 홍보 피드 <strong style={{ color: '#FFD700' }}>최상단 고정</strong></div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div><div style={{ fontSize: `calc(20px * var(--fs,1))`, fontWeight: '950', color: '#FFD700' }}>₩550,000</div><div style={{ fontSize: `calc(10px * var(--fs,1))`, opacity: 0.65 }}>월 정액</div></div>
              <div>
                <div style={{ fontSize: `calc(20px * var(--fs,1))`, fontWeight: '950', color: availableCount > 0 ? '#00C48C' : '#FF5A5F' }}>{availableCount}석</div>
                <div style={{ fontSize: `calc(10px * var(--fs,1))`, opacity: 0.65 }}>전국 잔여</div>
              </div>
              <div>
                <div style={{ fontSize: `calc(20px * var(--fs,1))`, fontWeight: '950', color: '#aaa' }}>{takenCount}석</div>
                <div style={{ fontSize: `calc(10px * var(--fs,1))`, opacity: 0.65 }}>점유 중</div>
              </div>
            </div>
          </div>
        )}
        {/* 권역 탭 */}
        <div style={{ padding: '14px 16px 8px', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {REGION_TABS.map(tab => {
            const tabTaken = tab === '전체' ? takenCount : harbors.filter(h => h.region === tab && h.isTaken).length;
            const tabTotal = tab === '전체' ? HARBORS_STATIC.length : HARBORS_STATIC.filter(h => h.region === tab).length;
            const tabAvail = tabTotal - tabTaken;
            return (
              <button key={tab} onClick={() => setSelectedRegion(tab)} style={{ padding: '7px 14px', borderRadius: '20px', fontSize: `calc(12px * var(--fs,1))`, fontWeight: '800', whiteSpace: 'nowrap', cursor: 'pointer', border: selectedRegion === tab ? '1.5px solid #FFD700' : '1.5px solid rgba(255,255,255,0.1)', background: selectedRegion === tab ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)', color: selectedRegion === tab ? '#FFD700' : 'rgba(255,255,255,0.5)' }}>
                {tab === '전체' ? `전체 (${tabAvail}/${tabTotal}석)` : `${REGION_EMOJI[tab]} ${tab} (${tabAvail}/${tabTotal})`}
              </button>
            );
          })}
        </div>
        {/* 항구 목록 */}
        <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(harbor => {
            // ✅ 비활성화 조건: 타인 점유 OR (이미 다른 항구 선점 중 && 내 항구 아님)
            const isTakenByOther = harbor.isTaken && !harbor.isMyHarbor;
            const isOtherSlot = !!mySlot && !harbor.isMyHarbor;
            const disabled = isTakenByOther || isOtherSlot;
            const daysLeft = harbor.daysLeft;
            const expiryText = harbor.expiresAtSlot
              ? `${new Date(harbor.expiresAtSlot).toLocaleDateString('ko-KR')} 만료${daysLeft !== null ? ` (D-${daysLeft})` : ''}`
              : null;
            return (
              <div key={harbor.id}
                onClick={() => !disabled && handleSelectHarbor(harbor)}
                style={{
                  background: harbor.isMyHarbor
                    ? 'rgba(255,215,0,0.1)'
                    : isTakenByOther
                      ? 'rgba(255,90,95,0.04)'
                      : isOtherSlot
                        ? 'rgba(255,255,255,0.02)'
                        : 'rgba(255,255,255,0.06)',
                  border: harbor.isMyHarbor
                    ? '1.5px solid #FFD700'
                    : isTakenByOther
                      ? '1px solid rgba(255,90,95,0.2)'
                      : isOtherSlot
                        ? '1px solid rgba(255,255,255,0.05)'
                        : '1.5px solid rgba(255,215,0,0.25)',
                  borderRadius: '16px', padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.15s, opacity 0.15s',
                  opacity: harbor.isMyHarbor ? 1 : isTakenByOther ? 0.6 : isOtherSlot ? 0.35 : 1,
                }}
                onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* 아이콘 */}
                <div style={{ width: '44px', height: '44px', borderRadius: '13px', flexShrink: 0, background: harbor.isMyHarbor ? 'linear-gradient(135deg,#FFD700,#FF9B26)' : isTakenByOther ? 'rgba(255,90,95,0.12)' : 'rgba(255,215,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {harbor.isMyHarbor ? <Crown size={20} color="#1A1A2E" /> : isTakenByOther ? <Lock size={18} color="#FF5A5F" /> : isOtherSlot ? <Lock size={16} color="rgba(255,255,255,0.2)" /> : <Crown size={20} color="#FFD700" />}
                </div>
                {/* 정보 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: `calc(10px * var(--fs,1))`, background: harbor.isMyHarbor ? 'rgba(255,215,0,0.25)' : isTakenByOther ? 'rgba(255,90,95,0.12)' : 'rgba(255,215,0,0.15)', color: harbor.isMyHarbor ? '#FFD700' : isTakenByOther ? '#FF5A5F' : '#FFD700', padding: '2px 7px', borderRadius: '5px', fontWeight: '800' }}>{harbor.area}</span>
                    <span style={{ fontSize: `calc(15px * var(--fs,1))`, fontWeight: '900', color: harbor.isMyHarbor ? '#FFD700' : isTakenByOther ? 'rgba(255,255,255,0.4)' : '#fff' }}>{harbor.name}</span>
                    {harbor.isMyHarbor && <span style={{ fontSize: `calc(10px * var(--fs,1))`, background: '#FFD700', color: '#1A1A2E', padding: '2px 8px', borderRadius: '5px', fontWeight: '900' }}>내 자리</span>}
                    {isTakenByOther && <span style={{ fontSize: `calc(10px * var(--fs,1))`, background: 'rgba(255,90,95,0.15)', color: '#FF5A5F', padding: '2px 8px', borderRadius: '5px', fontWeight: '900' }}>마감</span>}
                  </div>
                  <div style={{ fontSize: `calc(11px * var(--fs,1))`, color: 'rgba(255,255,255,0.35)', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <MapPin size={9} style={{ marginRight: '3px', verticalAlign: 'middle' }} />{harbor.desc}
                  </div>
                  <div style={{ fontSize: `calc(11px * var(--fs,1))`, marginTop: '5px', fontWeight: '700' }}>
                    {harbor.isMyHarbor
                      ? <span style={{ color: '#FFD700', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={11} /> 독점 활성 중{mySlot?.expiresAt ? ` · ${new Date(mySlot.expiresAt).toLocaleDateString('ko-KR')} 만료` : ''}</span>
                      : isTakenByOther
                        ? <span style={{ color: '#FF5A5F' }}>🔒 {harbor.takenBy} 선장 독점 중{expiryText ? ` · ${expiryText}` : ''}</span>
                      : isOtherSlot
                        ? <span style={{ color: 'rgba(255,255,255,0.2)' }}>🔒 다른 항구 선점 중</span>
                        : <span style={{ color: '#00C48C', display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={10} fill="#00C48C" /> 선착순 구독 가능</span>}
                  </div>
                </div>
                {/* 우측 상태 아이콘 */}
                {!disabled && !harbor.isMyHarbor && <div style={{ color: '#FFD700', fontSize: `calc(20px * var(--fs,1))`, fontWeight: '900', flexShrink: 0 }}>›</div>}
                {harbor.isMyHarbor && <CheckCircle2 size={20} color="#FFD700" style={{ flexShrink: 0 }} />}
                {isTakenByOther && <Lock size={16} color="rgba(255,90,95,0.5)" style={{ flexShrink: 0 }} />}
                {isOtherSlot && !isTakenByOther && <Lock size={14} color="rgba(255,255,255,0.15)" style={{ flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      </>)}

      {/* ══ UCB 결제 선택 다이얼로그 (UCB_ENABLED=true 시 표시) ══ */}
      {payDialog && UCB_ENABLED && (() => {
        const plan = PLANS.find(p => p.key === payDialog);
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '480px', background: 'linear-gradient(180deg,#1A1A2E,#0A0F1C)', borderRadius: '28px 28px 0 0', padding: '28px 24px 44px', border: '1px solid rgba(200,212,0,0.2)', borderBottom: 'none' }}>
              <div style={{ width: '40px', height: '4px', background: 'rgba(200,212,0,0.3)', borderRadius: '2px', margin: '0 auto 22px' }} />
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: `calc(15px * var(--fs,1))`, fontWeight: '900', color: '#fff' }}>결제 방법을 선택하세요</div>
                <div style={{ fontSize: `calc(13px * var(--fs,1))`, color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{plan?.label} {plan?.price}{plan?.period}</div>
              </div>
              {/* 구글 플레이 결제 */}
              <button onClick={() => handleIAPPurchase(payDialog)} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid rgba(100,181,246,0.3)', background: 'rgba(100,181,246,0.08)', color: '#fff', fontSize: `calc(14px * var(--fs,1))`, fontWeight: '800', cursor: 'pointer', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '22px' }}>🎮</span>
                  <div style={{ textAlign: 'left' }}>
                    <div>구글 플레이로 결제</div>
                    <div style={{ fontSize: `calc(11px * var(--fs,1))`, color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>구글 계정 자동결제</div>
                  </div>
                </div>
                <div style={{ fontSize: `calc(11px * var(--fs,1))`, color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>수수료 15%</div>
              </button>
              {/* 페이플 결제 */}
              <button onClick={() => handlePayplePurchase(payDialog)} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid rgba(200,212,0,0.3)', background: 'rgba(200,212,0,0.08)', color: '#fff', fontSize: `calc(14px * var(--fs,1))`, fontWeight: '800', cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '22px' }}>💳</span>
                  <div style={{ textAlign: 'left' }}>
                    <div>카드 / 카카오 / 토스로 결제</div>
                    <div style={{ fontSize: `calc(11px * var(--fs,1))`, color: 'rgba(200,212,0,0.6)', fontWeight: '600' }}>수수료 절약</div>
                  </div>
                </div>
                <div style={{ fontSize: `calc(11px * var(--fs,1))`, color: '#C8D400', fontWeight: '700' }}>수수료 6.5%</div>
              </button>
              <button onClick={() => setPayDialog(null)} style={{ width: '100%', padding: '12px', border: 'none', background: 'none', color: 'rgba(255,255,255,0.3)', fontSize: `calc(14px * var(--fs,1))`, cursor: 'pointer' }}>취소</button>
            </div>
          </div>
        );
      })()}

      {/* VVIP 항구 선점 확인 */}
      {showHarborConfirm && selectedHarbor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '480px', background: 'linear-gradient(180deg,#1A1A2E,#0A0F1C)', borderRadius: '28px 28px 0 0', padding: '28px 24px 44px', border: '1px solid rgba(255,215,0,0.2)', borderBottom: 'none' }}>
            <div style={{ width: '40px', height: '4px', background: 'rgba(255,215,0,0.3)', borderRadius: '2px', margin: '0 auto 22px' }} />
            <Crown size={40} color="#FFD700" style={{ display: 'block', margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: `calc(20px * var(--fs,1))`, fontWeight: '950', color: '#fff', margin: '0 0 4px', textAlign: 'center' }}>{selectedHarbor.name}</h2>
            <p style={{ fontSize: `calc(12px * var(--fs,1))`, color: 'rgba(255,255,255,0.45)', margin: '0 0 20px', textAlign: 'center' }}>{selectedHarbor.area} · {REGION_EMOJI[selectedHarbor.region]} {selectedHarbor.region}</p>
            {isVVIP ? (
              // ✅ VVIP 유저 → 항구 선점 API 호출
              <>
                <div style={{ fontSize: `calc(12px * var(--fs,1))`, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, background: 'rgba(255,215,0,0.06)', borderRadius: '14px', padding: '14px', marginBottom: '18px' }}>
                  이 항구를 <strong style={{ color: '#FFD700' }}>30일간 독점 선점</strong>하시겠습니까?<br />
                  선상 홍보 게시물이 이 항구에서 <strong style={{ color: '#FFD700' }}>최상단 고정</strong>됩니다.
                </div>
                <button onClick={() => handleHarborPurchase(selectedHarbor)} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg,#FFD700,#FF9B26)', color: '#1A1A2E', fontSize: `calc(15px * var(--fs,1))`, fontWeight: '950', cursor: 'pointer', marginBottom: '10px' }}>
                  👑 선점하기
                </button>
              </>
            ) : (
              // ✅ 비 VVIP 유저 → VVIP 구독 유도
              <>
                <div style={{ fontSize: `calc(12px * var(--fs,1))`, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, background: 'rgba(255,215,0,0.06)', borderRadius: '14px', padding: '14px', marginBottom: '18px' }}>
                  VVIP 항구 독점 선점은 <strong style={{ color: '#FFD700' }}>VVIP 구독 후</strong> 가능합니다.<br />
                  월 ₩550,000으로 항구 독점 + 선상 최상단 고정을 누리세요.
                </div>
                <button onClick={() => { setShowHarborConfirm(false); setView('plan'); handlePlanClick('VVIP'); }} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg,#FFD700,#FF9B26)', color: '#1A1A2E', fontSize: `calc(15px * var(--fs,1))`, fontWeight: '950', cursor: 'pointer', marginBottom: '10px' }}>
                  VVIP 구독하기
                </button>
              </>
            )}
            <button onClick={() => setShowHarborConfirm(false)} style={{ width: '100%', padding: '12px', border: 'none', background: 'none', color: 'rgba(255,255,255,0.35)', fontSize: `calc(14px * var(--fs,1))`, cursor: 'pointer' }}>취소</button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
