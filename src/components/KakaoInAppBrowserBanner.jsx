import { useState, useEffect } from 'react';

/**
 * KakaoInAppBrowser Banner
 * 카카오톡 내부 브라우저(WebView) 감지 시 상단에 배너 표시
 * → Safari/Chrome 외부 브라우저로 유도 (캐시 격리 문제 해결)
 *
 * 감지 기준: navigator.userAgent에 'KAKAOTALK' 포함
 * iOS:     우측 상단 ··· → Safari로 열기
 * Android: 우측 상단 ··· → 다른 브라우저로 열기
 */
export default function KakaoInAppBrowserBanner() {
  const [show, setShow]       = useState(false);
  const [isIos, setIsIos]     = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    const isKakao = /KAKAOTALK/i.test(ua);
    if (!isKakao) return;

    // ✅ KAKAO-FIX: 카카오톡 WebView 진입 시 탭 세션스토리지 잔류값 모두 초기화
    // → CommunityTab이 항상 낚시그램 탭으로 시작되도록 보장
    sessionStorage.removeItem('community_return_tab');
    sessionStorage.removeItem('lastTab');
    sessionStorage.removeItem('activeTab');

    // 이미 닫은 적 있으면 세션 동안 다시 안 보임
    if (sessionStorage.getItem('kakao_banner_dismissed') === '1') return;

    setIsIos(/iP(hone|ad|od)/i.test(ua));
    setShow(true);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('kakao_banner_dismissed', '1');
    setDismissed(true);
    setShow(false);
  };

  // Android: Chrome으로 직접 열기 시도
  const handleOpenExternal = () => {
    if (!isIos) {
      // Android → intent 스킴으로 Chrome 강제 오픈
      const url = window.location.href;
      window.location.href = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
    }
    // iOS는 코드로 Safari 강제 오픈 불가 → 안내만 표시
  };

  if (!show || dismissed) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 99999,
      background: 'linear-gradient(135deg, #FEE500 0%, #FFCD00 100%)',
      padding: '10px 14px 10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
      fontFamily: "'Pretendard', -apple-system, sans-serif",
    }}>
      {/* 카카오톡 아이콘 */}
      <span style={{ fontSize: '22px', flexShrink: 0 }}>💬</span>

      {/* 안내 텍스트 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '800',
          color: '#191600',
          lineHeight: 1.3,
          marginBottom: '2px',
        }}>
          최신 버전으로 보려면 외부 브라우저에서 여세요
        </div>
        <div style={{
          fontSize: '11px',
          color: '#5a4800',
          lineHeight: 1.3,
        }}>
          {isIos
            ? '우측 하단 공유(↑) → Safari로 열기'
            : '우측 상단 ⋮ → 다른 앱으로 열기'}
        </div>
      </div>

      {/* Android: Chrome 바로 열기 버튼 */}
      {!isIos && (
        <button
          onClick={handleOpenExternal}
          style={{
            flexShrink: 0,
            background: '#191600',
            color: '#FEE500',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '11px',
            fontWeight: '800',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Chrome으로 열기
        </button>
      )}

      {/* 닫기 버튼 */}
      <button
        onClick={handleDismiss}
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '18px',
          color: '#5a4800',
          padding: '0 2px',
          lineHeight: 1,
        }}
        aria-label="배너 닫기"
      >
        ✕
      </button>
    </div>
  );
}
