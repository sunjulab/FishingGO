/**
 * KakaoLoader — 카카오맵 SDK를 동적으로 로드하는 컴포넌트
 * index.html의 define 플레이스홀더 방식 대신 import.meta.env로 키를 직접 읽음.
 * (Vite define은 JS만 치환하고 HTML은 치환하지 않음)
 */
import { useEffect } from 'react';

let sdkLoaded = false; // 모듈 스코프 — 중복 주입 방지

export default function KakaoLoader() {
  useEffect(() => {
    if (sdkLoaded) return;
    if (window.kakao?.maps) { sdkLoaded = true; return; }

    const KAKAO_KEY = import.meta.env.VITE_KAKAO_APP_KEY;
    if (!KAKAO_KEY) {
      console.warn('[낚시GO] VITE_KAKAO_APP_KEY 미설정 — .env.local을 확인하세요.');
      return;
    }

    // 이미 스크립트가 주입돼 있으면 스킵
    if (document.querySelector('script[src*="dapi.kakao.com/v2/maps"]')) {
      sdkLoaded = true;
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services,clusterer&autoload=false`;
    document.head.appendChild(script);
    sdkLoaded = true;
  }, []);

  return null; // UI 없음
}
