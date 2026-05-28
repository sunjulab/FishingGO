/**
 * KakaoAd.jsx - 카카오 애드핏 광고 컴포넌트
 * 단위 ID: DAN-GlROpjPfXauFLUgU (320x50 배너)
 *
 * 사용법:
 *   <KakaoAd />                    // 기본 (320×50)
 *   <KakaoAd unitId="DAN-..." />   // 다른 단위 ID
 */
import { useEffect, useRef } from 'react';

// 기본 광고 단위 설정
const DEFAULT_UNIT = 'DAN-GlROpjPfXauFLUgU';
const DEFAULT_WIDTH  = 320;
const DEFAULT_HEIGHT = 50;

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

    // <ins> 엘리먼트 동적 생성 — React DOM과 충돌 없이 Kakao SDK가 직접 관리
    const ins = document.createElement('ins');
    ins.className = 'kakao_ad_area';
    ins.style.display = 'none';
    ins.setAttribute('data-ad-unit',   unitId);
    ins.setAttribute('data-ad-width',  String(width));
    ins.setAttribute('data-ad-height', String(height));
    containerRef.current.appendChild(ins);

    // SDK가 이미 로드된 경우 즉시 광고 렌더
    if (typeof window.kakaoAd !== 'undefined') {
      try { window.kakaoAd.display(unitId); } catch (_) {}
    }

    return () => {
      // 언마운트 시 정리
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      mountedRef.current = false;
    };
  }, [unitId, width, height]); // eslint-disable-line react-hooks/exhaustive-deps

  // 프리미엄 유저 체크는 부모에서 처리 — 이 컴포넌트는 단순 렌더만 담당
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
