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
import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore';
import { showRewardedAd } from '../services/AdMobService';
import { loadNativeAd, removeNativeAd } from '../services/NativeAdService';

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
export function NativeAd({ style = {}, slotId = 'native_ad_default' }) {
  const ref       = useRef(null);
  const loadedRef = useRef(false); // StrictMode 이중실행 방지
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

    // ── [1] 광고 로드 (placeholder는 이미 280px로 렌더됨 → Kotlin 좌표 즉시 유효)
    loadNativeAd(slotId, el).catch(() => setAdFailed(true));

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
  const T = useTheme(); // ✅ DARK-MODE
  const [adWatching, setAdWatching] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [adDone, setAdDone] = useState(false);
  const [autoCount, setAutoCount] = useState(0); // ✅ FIX-AUTO: 자동 등록 카운트다운

  const CONTEXT_TEXT = {
    post:  { title: '🎣 게시글 무료 등록', action: '글 등록 완료!' },
    crew:  { title: '🏕️ 크루 방 무료 개설', action: '크루 개설 완료!' },
  };
  const ctx = CONTEXT_TEXT[context] || CONTEXT_TEXT.post;

  const intervalRef  = useRef(null); // 광고 진행 타이머
  const autoTimerRef = useRef(null); // ✅ FIX-AUTO: 자동 등록 타이머
  const calledRef    = useRef(false); // ✅ FIX-DUP: handleComplete 중복 방지

  // ✅ FIX-RESET: isOpen이 true로 바뀔 때마다 상태 초기화 (adDone 잔류 방지)
  useEffect(() => {
    if (isOpen) {
      setAdWatching(false);
      setAdProgress(0);
      setAdDone(false);
      setAutoCount(0);
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
    };
  }, []);

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
  }, [adDone]); // eslint-disable-line react-hooks/exhaustive-deps

  // [정지 방지] 광고 시청은 타이머 기반 시뮬레이션 (실제 애드몹 SDK 연동 시 교체)
  const handleWatchAd = () => {
    // ✅ ADMOB: 네이티브 앱에서는 실제 AdMob 보상형 광고 실행
    const isNativeApp = (() => {
      try { return Capacitor.isNativePlatform(); } catch { return false; }
    })();

    if (isNativeApp) {
      setAdWatching(true);
      showRewardedAd(
        () => { setAdWatching(false); setAdDone(true); },  // 보상 수령
        () => { setAdWatching(false); }                   // 실패/취소
      );
      return;
    }


    // 웹 환경 — 30초 타이머 시뮬레이션 (광고 없음, 앱에서는 showRewardedAd로 실제 AdMob 보상형 실행)
    setAdWatching(true);
    setAdProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);

    const intervalId = setInterval(() => {
      setAdProgress(prev => {
        if (prev >= 100) {
          clearInterval(intervalId);
          intervalRef.current = null;
          setAdWatching(false);
          setAdDone(true);
          return 100;
        }
        return prev + (100 / 30); // 30초 광고
      });
    }, 1000);
    intervalRef.current = intervalId;
  };

  // ✅ FIX-DUP: calledRef로 중복 호출 방지 (자동 타이머 + 수동 버튼 동시 방지)
  const handleComplete = () => {
    if (calledRef.current) return;
    calledRef.current = true;
    if (intervalRef.current)  { clearInterval(intervalRef.current);  intervalRef.current  = null; }
    if (autoTimerRef.current) { clearInterval(autoTimerRef.current); autoTimerRef.current = null; }
    onRewardComplete?.();
    onClose?.();
  };


  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div style={{
        width: '100%', maxWidth: '480px', backgroundColor: T.card,
        borderRadius: '24px 24px 0 0', padding: '28px 24px 40px',
        animation: 'slideUp 0.3s ease'
      }}>
        {/* 핸들 */}
        <div style={{ width: '40px', height: '4px', backgroundColor: '#E5E5EA', borderRadius: '2px', margin: '0 auto 20px' }} />
        
        <h2 style={{ fontSize: `calc(22px * var(--fs, 1))`, fontWeight: '900', textAlign: 'center', marginBottom: '6px' }}>
          {ctx.title}
        </h2>
        <p style={{ fontSize: `calc(14px * var(--fs, 1))`, color: T.textSub, textAlign: 'center', marginBottom: '28px' }}>
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
              <div style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '900', marginBottom: '4px' }}>광고 없이 무제한 등록</div>
              <div style={{ fontSize: `calc(12px * var(--fs, 1))`, opacity: 0.9 }}>광고 없이 무제한 등록 · 무료 게시글 작성 횟수 제한 없음</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
              <div style={{ fontSize: `calc(22px * var(--fs, 1))`, fontWeight: '900' }}>₩9,900</div>
              <div style={{ fontSize: `calc(11px * var(--fs, 1))`, opacity: 0.85 }}>/월 구독</div>
            </div>
          </div>
          <div style={{ marginTop: '14px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '10px 16px', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', textAlign: 'center' }}>
            🚀 지금 구독하고 바로 등록하기
          </div>
        </div>

        {/* 옵션 2: 무료 광고 시청 */}
        {!adDone ? (
          <div style={{ border: `1.5px solid ${T.borderMid}`, borderRadius: '18px', padding: '20px' }}>
            <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800', marginBottom: '4px', color: T.text }}>
              📺 30초 광고 시청 후 무료 등록
            </div>
            <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: T.textSub, marginBottom: '16px' }}>
              광고를 시청하면 1회 무료로 이용하실 수 있어요.
            </div>

            {adWatching ? (
              <div>
                {/* 앱: AdMob 보상형 광고 실행 중 | 웹: 타이머 시뮬레이션 */}
                <div style={{ backgroundColor: T.cardSub, borderRadius: '12px', padding: '20px', marginBottom: '12px', textAlign: 'center', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: `calc(24px * var(--fs, 1))` }}>📺</span>
                  <span style={{ fontSize: `calc(13px * var(--fs, 1))`, color: T.textSub, marginLeft: '8px', fontWeight: '600' }}>시청 중...</span>
                </div>
                {/* 진행 바 */}
                <div style={{ height: '6px', backgroundColor: T.cardSub, borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ height: '100%', width: `${adProgress}%`, backgroundColor: '#0056D2', borderRadius: '3px', transition: 'width 0.9s linear' }} />
                </div>
                <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: T.textSub, textAlign: 'center' }}>
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
          style={{ width: '100%', marginTop: '12px', padding: '14px', border: 'none', background: 'none', color: T.textLight, fontSize: `calc(14px * var(--fs, 1))`, cursor: 'pointer', fontWeight: '600' }}
        >
          취소
        </button>
      </div>
    </div>
  );
}
