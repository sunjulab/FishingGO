/**
 * AdSenseAd.jsx — Google AdSense 광고 컴포넌트 (웹 브라우저 전용)
 *
 * ⚠️  Capacitor 네이티브 앱(isNativePlatform=true)에서는 절대 렌더링 금지
 *      → Google AdSense 정책 위반 (WebView 사용 금지)
 *
 * 📦 포함 광고 단위:
 *   · <AdSenseDisplay />  — 디스플레이(반응형) 광고, 슬롯 4975909941
 *                           KakaoAd 배너(320×50) 자리 대체
 *   · <AdSenseInFeed />   — 인피드(fluid) 광고, 슬롯 8319268904
 *                           커뮤니티 목록 사이 삽입 (InFeedAd 자리 대체)
 *
 * 발급 정보:
 *   퍼블리셔 ID : ca-pub-9774243773523817
 *   디스플레이  : 4975909941  (data-ad-format="auto", 반응형)
 *   인피드      : 8319268904  (data-ad-format="fluid", layout-key="-6t+ed+2i-1n-4w")
 */
import { useEffect, useRef } from 'react';

const PUB_ID = 'ca-pub-9774243773523817';

// ─── 플랫폼 감지 (렌더 시점 호출용) ─────────────────────────────────────────
// 모듈 레벨 상수가 아닌 함수로 유지 → Capacitor 초기화 완료 후 호출 보장
const isNativeApp = () => {
  try {
    // window.Capacitor 먼저 확인 (import 없이도 동작, SSR 안전)
    return typeof window !== 'undefined' &&
      (window.Capacitor?.isNativePlatform?.() === true);
  } catch {
    return false;
  }
};

// AdSense push 헬퍼 — 중복 push 방지 + 오류 무시
const pushAd = () => {
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (e) {
    // adsbygoogle 로드 전이거나 이미 push된 경우 무시
  }
};

// ─────────────────────────────────────────────────────────────────────
// 1. 디스플레이(반응형) 광고
//    AdSense 콘솔 발급 코드:
//      data-ad-slot="4975909941"
//      data-ad-format="auto"
//      data-full-width-responsive="true"
//
//    사용 위치:
//      · DashboardView.jsx  — 홈화면 하단
//      · MyPage.jsx         — 프로필 아래
//      · PostDetail.jsx     — 게시글 아래
//      · CatchRankingPage.jsx — 조황 버튼 아래
//      · CommunityTab.jsx   — 목록 끝 고정 광고 (×3)
// ─────────────────────────────────────────────────────────────────────
export function AdSenseDisplay({ style = {} }) {
  const insRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    // ① 네이티브 앱이면 아무것도 하지 않음
    if (isNativeApp()) return;
    // ② 이미 push했거나 ins 요소가 없으면 스킵
    if (pushed.current || !insRef.current) return;
    pushed.current = true;
    pushAd();
    return () => { pushed.current = false; };
  }, []);

  // 네이티브 앱: DOM 렌더링 자체를 차단 (AdSense 정책)
  if (isNativeApp()) return null;

  return (
    <div style={{ overflow: 'hidden', margin: '8px 0', minHeight: '50px', ...style }}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={PUB_ID}
        data-ad-slot="4975909941"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 2. 인피드(fluid) 광고
//    AdSense 콘솔 발급 코드:
//      data-ad-format="fluid"
//      data-ad-layout-key="-6t+ed+2i-1n-4w"
//      data-ad-slot="8319268904"
//
//    사용 위치:
//      · CommunityTab.jsx — 게시글/크루/선상배 목록 N개마다 삽입 (×2)
//
//    ⚠️ 높이 고정 금지: 컨테이너 height 지정 시 광고 왜곡 발생
// ─────────────────────────────────────────────────────────────────────
export function AdSenseInFeed({ style = {} }) {
  const insRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (isNativeApp()) return;
    if (pushed.current || !insRef.current) return;
    pushed.current = true;
    pushAd();
    return () => { pushed.current = false; };
  }, []);

  // 네이티브 앱: DOM 렌더링 차단
  if (isNativeApp()) return null;

  return (
    // ⚠️ height 고정 금지 — 인피드 광고 크기는 AdSense가 자동 결정
    <div style={{ overflow: 'hidden', margin: '8px 0', ...style }}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-format="fluid"
        data-ad-layout-key="-6t+ed+2i-1n-4w"
        data-ad-client={PUB_ID}
        data-ad-slot="8319268904"
      />
    </div>
  );
}
