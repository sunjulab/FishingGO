/**
 * KakaoAd.jsx - 카카오 애드핏 광고 컴포넌트
 * 단위 ID: DAN-GlROpjPfXauFLUgU (320x50 배너)
 *
 * 사용법:
 *   <KakaoAd />                    // 기본 (320×50)
 *   <KakaoAd unitId="DAN-..." />   // 다른 단위 ID
 */
import { useEffect, useRef } from 'react';

// 네이티브 앱(Capacitor) 여부 — 앱에서는 AdMob이 광고 처리하므로 카카오 광고 스킵
const isNativeApp = (() => {
  try { return window?.Capacitor?.isNativePlatform?.() === true; } catch { return false; }
})();

const DEFAULT_UNIT   = 'DAN-GlROpjPfXauFLUgU';
const DEFAULT_WIDTH  = 320;
const DEFAULT_HEIGHT = 50;

/**
 * ba.min.js 로드 타이밍 문제 해결:
 * - SDK 먼저 로드: 즉시 display() 호출
 * - SDK 나중 로드: load 이벤트 대기 후 호출
 * - Fallback: 500ms / 1500ms 재시도
 */
function callKakaoDisplay(unitId) {
  const doDisplay = () => {
    try {
      if (typeof window.kakaoAd !== 'undefined') {
        window.kakaoAd.display(unitId);
      }
    } catch (_) {}
  };

  if (typeof window.kakaoAd !== 'undefined') {
    doDisplay();
  } else {
    const sdkScript = document.querySelector('script[src*="ba.min.js"]');
    if (sdkScript) {
      sdkScript.addEventListener('load', doDisplay, { once: true });
    }
    setTimeout(doDisplay, 500);
    setTimeout(doDisplay, 1500);
  }
}

export function KakaoAd({
  unitId  = DEFAULT_UNIT,
  width   = DEFAULT_WIDTH,
  height  = DEFAULT_HEIGHT,
  style   = {},
}) {
  // ✅ 네이티브 앱(Android/iOS)에서는 AdMob이 광고를 담당 → 카카오 광고 스킵
  if (isNativeApp) return null;

  const containerRef = useRef(null);
  const mountedRef   = useRef(false);

  useEffect(() => {
    if (mountedRef.current || !containerRef.current) return;
    mountedRef.current = true;

    const ins = document.createElement('ins');
    ins.className = 'kakao_ad_area';
    ins.style.display = 'none';
    ins.setAttribute('data-ad-unit',   unitId);
    ins.setAttribute('data-ad-width',  String(width));
    ins.setAttribute('data-ad-height', String(height));
    containerRef.current.appendChild(ins);

    callKakaoDisplay(unitId);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
      mountedRef.current = false;
    };
  }, [unitId, width, height]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      style={{
        textAlign: 'center',
        overflow: 'hidden',
        minHeight: `${height}px`,
        margin: '8px 0',
        ...style,
      }}
    />
  );
}

export default KakaoAd;
