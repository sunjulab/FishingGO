/**
 * AdUnit.jsx - Fishing GO 광고 통합 모듈
 *
 * ✅ ADMOB-ONLY: AdSense 완전 제거 — AdMob 전용
 * - 앱(Android Capacitor): AdMob SDK 사용
 *   · NativeAd  → NativeAdPlugin.kt (오버레이 방식)
 *   · 보상형    → AdMobService.showRewardedAd()
 * - 웹 브라우저: 광고 없음 (AdSense Google 정책상 WebView 금지)
 *
 * [광고 정지 방지 규칙]
 * 1. 광고 클릭 유도 문구/화살표 금지
 * 2. 광고 영역 위/아래 빈 공간(padding) 최소 8px 확보
 * 3. 보상형 광고는 반드시 유저 자발적 클릭으로만 노출
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore';
import { showRewardedAd } from '../services/AdMobService';
// NativeAdService 제거 (네이티브 광고 기능 삭제)

// NativeAdPlugin 런타임 참조 — scroll 자가갱신용
function getNativeAdPlugin() {
  try {
    if (!Capacitor.isNativePlatform()) return { NativeAdPlugin: null };
    return { NativeAdPlugin: registerPlugin('NativeAd') };
  } catch { return { NativeAdPlugin: null }; }
}

// Capacitor 네이티브 환경 감지 (3중 체크)
const isCapacitorNative = () => {
  try { if (Capacitor.isNativePlatform()) return true; } catch (_) {}
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) return true;
  if (typeof navigator !== 'undefined' && /wv/.test(navigator.userAgent) && /Android/.test(navigator.userAgent)) return true;
  return false;
};

// AdSense는 완전히 제거됨 — 웹에서도 광고 없음 (AdMob 전용)
// eslint-disable-next-line no-unused-vars
function loadAdSense() { /* REMOVED: AdMob 전용으로 전환 */ }



// ─────────────────────────────────────────────────────────────────
// NativeAd — 네이티브 광고 제거됨, 하위호환을 위해 null 반환 유지
//  2. NativeAd — 완전 자가관리형 (Self-Contained) 인피드 광고 컴포넌트
//
//  ✅ 100점 구조 4원칙:
//  1. 초기 렌더부터 280px placeholder 확보 → Kotlin 좌표 즉시 유효
//  2. scroll + IntersectionObserver + ResizeObserver 내장
//     → 어느 페이지에 넣어도 스크롤 추적 자동 (페이지별 설정 불필요)
//  3. 광고 로드 실패 시에만 height collapse (adFailed → null)
//     → 빈 공간 완전 소멸
//  4. 언마운트(탭 전환·페이지 이동) 시 removeNativeAd 즉시 호출
//     → Kotlin 오버레이 즉시 정리 (선상배 빈 공간 버그 해결)
// ─────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
export function NativeAd({ style = {}, slotId = 'native_ad_default' }) {
  // 네이티브 광고 기능 제거 — 빈 컴포넌트 반환
  return null;
}

/** @deprecated 네이티브 광고 제거됨 — 아래 원본 코드는 참조 보존 */
function _NativeAdLegacy({ style = {}, slotId = 'native_ad_default' }) {
  const ref       = useRef(null);
  const loadedRef = useRef(false); // StrictMode 이중실행 방지
  const retryRef  = useRef(0);     // ✅ FIX-TIMING: 재시도 횟수 추적
  const retryTimerRef = useRef(null); // 재시도 타이머 ref (언마운트 시 정리)
  const IS_NATIVE = isCapacitorNative();
  const [adFailed, setAdFailed] = useState(false);

  const isPremium = useUserStore(s =>
    ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'MASTER'].includes(s.userTier) ||
    s.user?.id === ADMIN_ID || s.user?.email === ADMIN_EMAIL
  );

  useEffect(() => {
    if (!IS_NATIVE || isPremium || !ref.current) return;
    if (loadedRef.current) return;   // 이중 실행 방지
    loadedRef.current = true;

    const el = ref.current;

    // ── [1] 광고 로드 — SDK 초기화 타이밍 대비 재시도 1회 (2초 딜레이)
    // 보상형 광고(사용자 클릭 시 요청)와 달리 NativeAd는 렌더 즉시 요청하므로
    // MobileAds.initialize() 비동기 완료 전에 요청될 수 있음 → 2초 후 재시도로 해결
    const tryLoad = (attempt) => {
      loadNativeAd(slotId, el)
        .then(() => { retryRef.current = 0; }) // 성공 시 카운터 초기화
        .catch(() => {
          if (attempt < 2 && loadedRef.current) {
            // 2회 재시도: 3초 후 (SDK 초기화 대기 시간 늘림)
            retryTimerRef.current = setTimeout(() => tryLoad(attempt + 1), 3000);
          } else {
            // 재시도 실패 또는 언마운트됨 → 광고 공간 제거
            setAdFailed(true);
          }
        });
    };
    tryLoad(0);

    // ── [2] Kotlin 위치 자가갱신 헬퍼
    const { NativeAdPlugin } = getNativeAdPlugin();
    const updatePos = () => {
      if (!el) return;
      const dpr  = window.devicePixelRatio || 1;
      const rect = el.getBoundingClientRect();
      const x    = Math.round(rect.left   * dpr);
      const y    = Math.round(rect.top    * dpr);
      const inVP = rect.bottom > 0 && rect.top < window.innerHeight;
      try {
        NativeAdPlugin?.setVisible({ slotId, visible: inVP });
        if (inVP) NativeAdPlugin?.updatePosition({ slotId, x, y });
      } catch { /* 스크롤 중 오류 무시 */ }
    };

    // ── [3] 자동 위치 추적: scroll + IO + RO
    window.addEventListener('scroll', updatePos, { passive: true });
    const io = new IntersectionObserver(updatePos, { threshold: [0, 0.1, 1] });
    io.observe(el);
    const ro = new ResizeObserver(updatePos);
    ro.observe(el);

    // ── [4] 언마운트 즉시 정리 (탭 전환 시 오버레이 제거)
    return () => {
      window.removeEventListener('scroll', updatePos);
      io.disconnect();
      ro.disconnect();
      removeNativeAd(slotId);
      loadedRef.current = false;
      if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null; }
    };
  }, [IS_NATIVE, isPremium, slotId]); // eslint-disable-line react-hooks/exhaustive-deps


  // 프리미엄 유저: 광고 없음
  if (isPremium) return null;
  // 광고 로드 실패: 빈 공간 없음
  if (adFailed)  return null;
  // 웹 환경: 광고 없음
  if (!IS_NATIVE) return null;

  // ── 핵심: 초기부터 280px 고정 확보 → Kotlin 좌표 즉시 유효
  //    실패 시에만 adFailed=true → null 반환으로 공간 완전 소멸
  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: 280,
        margin: '4px 0 12px',
        borderRadius: '16px',
        background: 'transparent',
        overflow: 'hidden',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────
//  3. 보상형 광고 게이트 모달 (영상 시청 or 유료 구독)
//  [정지 방지] 유저 자발적 선택만 허용 — 강제 팝업 금지
// ─────────────────────────────────────────────────────────────────
export function RewardGateModal({ isOpen, onClose, onRewardComplete, onSubscribe, context = 'post' }) {
  const [adWatching, setAdWatching] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [adDone, setAdDone] = useState(false);
  const [autoCount, setAutoCount] = useState(0);
  const [webAdFullscreen, setWebAdFullscreen] = useState(false); // ✅ WEB-AD: 웹 전체화면 광고 오버레이
  const [skipVisible, setSkipVisible] = useState(false);        // ✅ WEB-AD: 5초 후 스킵 버튼 표시

  const [cctvAdCount, setCctvAdCount] = useState(0);

  const CONTEXT_TEXT = {
    post:  { title: '🎣 게시글 무료 등록', action: '글 등록 완료!' },
    crew:  { title: '🏕️ 크루 방 무료 개설', action: '크루 개설 완료!' },
    point: { title: '📍 낚시 포인트 확인', action: '포인트 확인 완료!' },
    secret: { title: '⭐ 비밀 포인트 확인', action: '비밀 포인트 오픈!' },
    cctv:  { title: '📺 실시간 현장 영상', action: '영상 재생 준비 완료!' }
  };
  const ctx = CONTEXT_TEXT[context] || CONTEXT_TEXT.post;

  // ✅ VVIP-NUDGE: 일일 시청 횟수 로드
  useEffect(() => {
    if (context === 'cctv') {
      const today = new Date().toLocaleDateString();
      const stored = localStorage.getItem(`cctvAdCount_${today}`);
      if (stored) setCctvAdCount(parseInt(stored, 10));
    }
  }, [context, isOpen]);

  const intervalRef  = useRef(null); // 광고 진행 타이머
  const autoTimerRef = useRef(null); // ✅ FIX-AUTO: 자동 등록 타이머
  const skipTimerRef = useRef(null); // ✅ BUG-04 FIX: skipTimer ref 관리 (누수 방지)
  const calledRef    = useRef(false); // ✅ FIX-DUP: handleComplete 중복 방지

  // ✅ FIX-RESET: isOpen이 true로 바뀔 때마다 상태 초기화 (adDone 잔류 방지)
  useEffect(() => {
    if (isOpen) {
      setAdWatching(false);
      setAdProgress(0);
      setAdDone(false);
      setAutoCount(0);
      setWebAdFullscreen(false);
      setSkipVisible(false);
      calledRef.current = false;
    } else {
      // 모달 닫힐 때 타이머 전부 정리
      if (intervalRef.current)  { clearInterval(intervalRef.current);  intervalRef.current  = null; }
      if (autoTimerRef.current) { clearInterval(autoTimerRef.current); autoTimerRef.current = null; }
    }
  }, [isOpen]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current)  clearInterval(intervalRef.current);
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      if (skipTimerRef.current) { clearTimeout(skipTimerRef.current); skipTimerRef.current = null; } // ✅ BUG-04 FIX
    };
  }, []);

  // ✅ FIX-TDZ: handleComplete를 adDone useEffect보다 앞에 선언 (TDZ 오류 방지)
  const handleComplete = useCallback(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    if (intervalRef.current)  { clearInterval(intervalRef.current);  intervalRef.current  = null; }
    if (autoTimerRef.current) { clearInterval(autoTimerRef.current); autoTimerRef.current = null; }
    if (skipTimerRef.current) { clearTimeout(skipTimerRef.current);  skipTimerRef.current = null; }

    // ✅ VVIP-NUDGE: 시청 완료 시 카운트 증가
    if (context === 'cctv') {
      const today = new Date().toLocaleDateString();
      const count = cctvAdCount + 1;
      localStorage.setItem(`cctvAdCount_${today}`, count.toString());
      setCctvAdCount(count);
    }

    onRewardComplete?.();
    onClose?.();
  }, [onRewardComplete, onClose, context, cctvAdCount]);

  // ✅ FIX-AUTO: adDone=true 시 1.5초 카운트다운 후 자동 등록
  useEffect(() => {
    if (!adDone) return;
    setAutoCount(2); // 2초 카운트다운
    const countId = setInterval(() => {
      setAutoCount(prev => {
        if (prev <= 1) {
          clearInterval(countId);
          autoTimerRef.current = null;
          handleComplete(); // 자동 등록 트리거
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    autoTimerRef.current = countId;
    return () => { clearInterval(countId); };
  }, [adDone, handleComplete]); // ✅ BUG-03 FIX: handleComplete deps 추가 (stale closure 해소)

  // ✅ WEB-AD: 웹 fallback 타이머 — 전체화면 오버레이와 함께 실행
  const startWebTimerFallback = () => {
    setAdWatching(true);
    setAdProgress(0);
    setSkipVisible(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (skipTimerRef.current) { clearTimeout(skipTimerRef.current); skipTimerRef.current = null; } // ✅ BUG-04 FIX: 이전 skipTimer 정리
    skipTimerRef.current = setTimeout(() => setSkipVisible(true), 5000); // ✅ BUG-04 FIX: ref에 저장
    const intervalId = setInterval(() => {
      setAdProgress(prev => {
        if (prev >= 100) {
          clearInterval(intervalId);
          if (skipTimerRef.current) { clearTimeout(skipTimerRef.current); skipTimerRef.current = null; } // ✅ BUG-04 FIX
          intervalRef.current = null;
          setAdWatching(false);
          setWebAdFullscreen(false);
          setAdDone(true);
          return 100;
        }
        return prev + (100 / 30);
      });
    }, 1000);
    intervalRef.current = intervalId;
  };

  // [광고 시청하기] 버튼 핸들러
  const handleWatchAd = () => {
    const isNativeApp = (() => {
      try { return Capacitor.isNativePlatform(); } catch { return false; }
    })();

    // ─ 1. 네이티브 앱 → AdMob SDK ─
    if (isNativeApp) {
      setAdWatching(true);
      showRewardedAd(
        () => { setAdWatching(false); setAdDone(true); },
        () => { setAdWatching(false); }
      );
      return;
    }

    // ─ 2. 웹 환경 → AdSense adBreak() 시도 → 없으면 전체화면 타이머 ─
    let googleAdShowing = false;
    let fallbackStarted = false;

    const startFallback = () => {
      if (fallbackStarted) return;
      fallbackStarted = true;
      setWebAdFullscreen(true);   // ← 전체화면 오버레이 ON
      startWebTimerFallback();    // ← 30초 타이머 시작
    };

    if (typeof window.adBreak === 'function') {
      window.adBreak({
        type: 'reward',
        name: 'fishing-point-reward',
        beforeReward: (showAdFn) => {
          googleAdShowing = true;
          showAdFn(); // AdSense가 자체 전체화면 광고 UI 표시
        },
        adViewed: () => {
          setAdWatching(false);
          setWebAdFullscreen(false);
          setAdDone(true);
        },
        adDismissed: () => {
          setAdWatching(false);
          setWebAdFullscreen(false);
        },
        afterAd: () => {
          if (!googleAdShowing) startFallback();
        },
      });
      // 800ms 내 adBreak 콜백 없으면 fallback 강제 실행
      setTimeout(() => { if (!googleAdShowing && !fallbackStarted) startFallback(); }, 800);
    } else {
      // adBreak 함수 자체가 없으면 즉시 fallback
      startFallback();
    }
  };


  if (!isOpen) return null;

  // ✅ WEB-AD: 웹 전체화면 광고 오버레이 (adBreak 실패 또는 fallback 시)
  const remaining = Math.ceil(30 - (adProgress / 100) * 30);

  if (webAdFullscreen) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <div style={{
          width: '100%', maxWidth: '480px', height: '100dvh',
          background: 'linear-gradient(135deg, #0A1628 0%, #0d2240 50%, #0A1628 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', position: 'relative',
        }}>
        {/* 상단: 광고 표시 배지 + 카운트다운 */}
        <div style={{
          position: 'absolute', top: 16, left: 0, right: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', zIndex: 10,
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.12)', borderRadius: '8px',
            padding: '5px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.8)',
            fontWeight: '700', backdropFilter: 'blur(4px)',
          }}>AD</div>
          {/* 원형 카운트다운 */}
          <div style={{ position: 'relative', width: 52, height: 52 }}>
            <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4"/>
              <circle cx="26" cy="26" r="22" fill="none" stroke="#00C48C" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - adProgress / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.9s linear' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '15px', fontWeight: '900', color: '#fff',
            }}>{remaining}</div>
          </div>
        </div>

        {/* 중앙: 낚시GO 화면 현시 */}
        <div style={{ textAlign: 'center', padding: '0 32px', marginTop: '-20px' }}>
          {/* 로고 영역 */}
          <div style={{
            width: 90, height: 90, borderRadius: '24px',
            background: 'linear-gradient(135deg, #0056D2, #00A3FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 0 40px rgba(0,86,210,0.5)',
            fontSize: '44px',
            animation: 'adPulse 2s ease-in-out infinite',
          }}>🎣</div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#fff', marginBottom: '10px', lineHeight: 1.2 }}>
            낚시GO
          </div>
          <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginBottom: '8px' }}>
            국내 최고 프리미엄 낚시 인텔리전스
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontWeight: '500' }}>
            실시간 물때 · 날씨 · 해양 CCTV · 낚시 포인트 지도
          </div>

          {/* 프로그레스 바 */}
          <div style={{ marginTop: '36px', width: '100%', maxWidth: 280, margin: '36px auto 0' }}>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${adProgress}%`,
                background: 'linear-gradient(90deg, #0056D2, #00C48C)',
                borderRadius: '2px', transition: 'width 0.9s linear',
              }}/>
            </div>
            <div style={{ marginTop: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
              {remaining > 0 ? `${remaining}초 시청 후 보상 지급` : '시청 완료!'}
            </div>
          </div>
        </div>

        {/* 하단: 스킵 버튼 (및 페이드인 애니메이션) */}
        {skipVisible && (
          <button
            onClick={() => {
              if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
              setAdWatching(false);
              setWebAdFullscreen(false);
              // 스킵 시 보상 없음
            }}
            style={{
              position: 'absolute', bottom: 40, right: 24,
              background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff', padding: '10px 20px', borderRadius: '24px',
              fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
          >
            광고 끄기 ›
          </button>
        )}

        <style>{`
          @keyframes adPulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(0,86,210,0.5); }
            50% { transform: scale(1.06); box-shadow: 0 0 60px rgba(0,163,255,0.7); }
          }
        `}</style>
      </div>{/* inner 480px container */}
    </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}> {/* PC 웹: 최대 480px 컨테이너 내 정렬 */}
      <div style={{
        width: '100%', maxWidth: '480px', backgroundColor: '#ffffff',
        borderRadius: '24px 24px 0 0', padding: '28px 24px 40px',
        animation: 'slideUp 0.3s ease'
      }}>
        {/* 핸들 */}
        <div style={{ width: '40px', height: '4px', backgroundColor: '#E5E5EA', borderRadius: '2px', margin: '0 auto 20px' }} />
        
        <h2 style={{ fontSize: `calc(22px * var(--fs, 1))`, fontWeight: '900', textAlign: 'center', marginBottom: '6px' }}>
          {ctx.title}
        </h2>
        <p style={{ fontSize: `calc(14px * var(--fs, 1))`, color: '#8E8E93', textAlign: 'center', marginBottom: '28px' }}>
          무료로 이용하거나 <strong>LITE 이상</strong>을 구독하세요
        </p>

        {/* 옵션 1: 비즈니스 라이트 구독 */}
        <div
          // ✅ 2ND-A4: onSubscribe optional guard — prop undefined 시 런타임 에러 방지
          onClick={() => onSubscribe?.()}
          style={{
            background: 'linear-gradient(135deg, #0056D2, #0096FF)',
            borderRadius: '18px', padding: '20px',
            color: '#fff', cursor: 'pointer', marginBottom: '12px',
            boxShadow: '0 8px 24px rgba(0,86,210,0.35)',
            transition: 'transform 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: `calc(12px * var(--fs, 1))`, opacity: 0.85, fontWeight: '700', marginBottom: '4px' }}>⭐ LITE 이상</div>
              <div style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '900', marginBottom: '4px' }}>
                {context === 'cctv' ? '광고 없이 1초 만에 바다 보기' : '광고 없이 무제한 등록'}
              </div>
              <div style={{ fontSize: `calc(12px * var(--fs, 1))`, opacity: 0.9 }}>
                {context === 'cctv' && cctvAdCount >= 3 
                  ? '☕ 오늘만 3번째! 커피 한 잔 값이면 평생 광고 제거'
                  : context === 'cctv'
                  ? '광고 없이 모든 포인트 CCTV 무제한 쾌속 시청'
                  : '광고 없이 무제한 등록 · 무료 게시글 작성 횟수 제한 없음'}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
              <div style={{ fontSize: `calc(22px * var(--fs, 1))`, fontWeight: '900' }}>₩9,900</div>
              <div style={{ fontSize: `calc(11px * var(--fs, 1))`, opacity: 0.85 }}>/월 구독</div>
            </div>
          </div>
          <div style={{ marginTop: '14px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '10px 16px', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', textAlign: 'center' }}>
            {context === 'cctv' && cctvAdCount >= 3 ? '🚀 1초만에 바다 보러가기' : '🚀 지금 구독하고 혜택받기'}
          </div>
        </div>

        {/* 옵션 2: 무료 광고 시청 */}
        {!adDone ? (
          <div style={{ border: `1.5px solid #E5E5EA`, borderRadius: '18px', padding: '20px' }}>
            <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800', marginBottom: '4px', color: '#1c1c1e' }}>
              📺 30초 광고 시청 후 {context === 'cctv' ? '실시간 영상 보기' : '무료 등록'}
            </div>
            <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#8E8E93', marginBottom: '16px' }}>
              광고를 시청하면 1회 무료로 이용하실 수 있어요.
            </div>

            {adWatching ? (
              <div>
                {/* 앱: AdMob 보상형 광고 실행 중 | 웹: 타이머 시뮬레이션 */}
                <div style={{ backgroundColor: '#F2F2F7', borderRadius: '12px', padding: '20px', marginBottom: '12px', textAlign: 'center', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: `calc(24px * var(--fs, 1))` }}>📺</span>
                  <span style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#8E8E93', marginLeft: '8px', fontWeight: '600' }}>시청 중...</span>
                </div>
                {/* 진행 바 */}
                <div style={{ height: '6px', backgroundColor: '#F2F2F7', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ height: '100%', width: `${adProgress}%`, backgroundColor: '#0056D2', borderRadius: '3px', transition: 'width 0.9s linear' }} />
                </div>
                <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#8E8E93', textAlign: 'center' }}>
                  {Math.ceil(30 - (adProgress / 100) * 30)}초 후 완료...
                </div>
              </div>
            ) : (
              <button
                onClick={handleWatchAd}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #0056D2', backgroundColor: 'rgba(0,86,210,0.05)', color: '#0056D2', fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer' }}
              >
                📺 광고 시청하기
              </button>
            )}
          </div>
        ) : (
          // ✅ FIX-AUTO: 시청 완료 후 자동 등록 카운트다운 표시
          <button
            onClick={handleComplete}
            style={{ width: '100%', padding: '16px', borderRadius: '18px', border: 'none', backgroundColor: '#00C48C', color: '#fff', fontSize: `calc(17px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,196,140,0.3)' }}
          >
            ✅ 시청 완료!{autoCount > 0 ? ` (${autoCount}초 후 자동 등록)` : ` ${ctx.action}`}
          </button>
        )}

        {/* 닫기 */}
        <button
          onClick={onClose}
          style={{ width: '100%', marginTop: '12px', padding: '14px', border: 'none', background: 'none', color: '#8E8E93', fontSize: `calc(14px * var(--fs, 1))`, cursor: 'pointer', fontWeight: '600' }}
        >
          취소
        </button>
      </div>
    </div>
  );
}
