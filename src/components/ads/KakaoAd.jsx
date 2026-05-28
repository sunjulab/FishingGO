/**
 * KakaoAd.jsx - 카카오 애드핏 광고 컴포넌트
 * - 광고가 채워질 때만 공간 차지 (빈 공간 방지)
 * - MutationObserver로 ins 요소 변화 감지 → 광고 채워지면 컨테이너 표시
 * - 플랫폼: 모바일웹 ✅ / 데스크탑웹 ✅ / Android앱(WebView) ✅ / iPhone웹 ✅
 *   → capacitor.config.json server.url = fishing-go.com 이므로
 *     앱 WebView도 동일 도메인으로 작동, 카카오 SDK 정상 인식
 */
import { useEffect, useRef } from 'react';

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
  const containerRef = useRef(null);
  const mountedRef   = useRef(false);

  useEffect(() => {
    if (mountedRef.current || !containerRef.current) return;
    mountedRef.current = true;

    const container = containerRef.current;

    // ✅ 초기에는 완전히 숨김 (높이 0) — 광고 채워지면 표시
    container.style.height = '0';
    container.style.overflow = 'hidden';
    container.style.margin = '0';

    const ins = document.createElement('ins');
    ins.className = 'kakao_ad_area';
    ins.style.display = 'none';
    ins.setAttribute('data-ad-unit',   unitId);
    ins.setAttribute('data-ad-width',  String(width));
    ins.setAttribute('data-ad-height', String(height));
    container.appendChild(ins);

    // ✅ MutationObserver: ins가 채워지면(display: table/block) 컨테이너 공간 활성화
    const observer = new MutationObserver(() => {
      const filled = ins.style.display !== 'none' && ins.style.display !== '';
      const hasChild = ins.children.length > 0;
      if (filled || hasChild) {
        container.style.height = '';
        container.style.overflow = 'hidden';
        container.style.margin = '8px 0';
        observer.disconnect();
      }
    });
    observer.observe(ins, {
      attributes: true,
      attributeFilter: ['style'],
      childList: true,
      subtree: true,
    });

    callKakaoDisplay(unitId);

    return () => {
      observer.disconnect();
      if (containerRef.current) containerRef.current.innerHTML = '';
      mountedRef.current = false;
    };
  }, [unitId, width, height]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      style={{
        textAlign: 'center',
        borderRadius: style.borderRadius || '0',
        ...style,
        // 초기 높이 0 — useEffect에서 광고 채워지면 자동으로 복원
        height: 0,
        overflow: 'hidden',
        margin: 0,
      }}
    />
  );
}

export default KakaoAd;
