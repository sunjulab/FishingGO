import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * AppBanner.jsx — 스마트 앱 배너
 *
 * 동작:
 *   1. Android 모바일 브라우저에서 접속 시 상단에 배너 자동 표시
 *   2. 네이티브 앱 내부(Capacitor)에서는 절대 표시 안 함
 *   3. "앱에서 보기" 클릭 →
 *        앱 설치됨 : intent:// → 앱 실행 → 현재 게시글/화면으로 이동
 *        앱 미설치 : Play Store 이동
 *   4. X 클릭 → 세션 동안 배너 숨김
 */

const PLAY_STORE_URL = 'https://play.google.com/apps/internaltest/4701312289208373704';
const APP_ID         = 'kr.fishinggo.app';

/** 현재 경로에서 intent:// deep-link URL 생성 */
function buildIntentUrl(pathname, search) {
  const postMatch  = pathname.match(/\/post\/([^/?#]+)/);
  const catchMatch = pathname.match(/\/catch\/([^/?#]+)/);

  let deepTarget;
  if (postMatch)       deepTarget = `post?postId=${postMatch[1]}`;
  else if (catchMatch) deepTarget = `catch?catchId=${catchMatch[1]}`;
  else                 deepTarget = 'community';

  // intent:// 형식: 앱 설치 → 앱 실행, 미설치 → Play Store 폴백
  return (
    `intent://${deepTarget}` +
    `#Intent;scheme=fishinggo;package=${APP_ID}` +
    `;S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`
  );
}

export default function AppBanner() {
  const [visible, setVisible] = useState(false);
  const location  = useLocation();

  useEffect(() => {
    // ① 네이티브 앱(Capacitor) 내부에서는 표시 안 함
    try {
      if (window.Capacitor?.isNativePlatform?.()) return;
    } catch { /* noop */ }

    // ② Android 모바일 브라우저에서만 표시
    if (!/android/i.test(navigator.userAgent)) return;

    // ③ 이미 닫은 경우 세션 내에서 표시 안 함
    try {
      if (sessionStorage.getItem('fishing_banner_dismissed')) return;
    } catch { /* noop */ }

    setVisible(true);
  }, []);

  if (!visible) return null;

  const handleOpen = () => {
    window.location.href = buildIntentUrl(location.pathname, location.search);
  };

  const handleDismiss = () => {
    try { sessionStorage.setItem('fishing_banner_dismissed', '1'); } catch { /* noop */ }
    setVisible(false);
  };

  return (
    <>
      <div style={styles.banner}>
        {/* 닫기 버튼 */}
        <button style={styles.closeBtn} onClick={handleDismiss} aria-label="배너 닫기">
          ✕
        </button>

        {/* 앱 아이콘 */}
        <img
          src="/og-image.png"
          alt="낚시GO"
          style={styles.icon}
          onError={(e) => { e.target.style.display = 'none'; }}
        />

        {/* 앱 정보 */}
        <div style={styles.info}>
          <div style={styles.appName}>낚시GO</div>
          <div style={styles.appDesc}>앱에서 더 편리하게 이용하세요 🎣</div>
        </div>

        {/* CTA 버튼 */}
        <button style={styles.openBtn} onClick={handleOpen}>
          앱에서 보기
        </button>
      </div>
      {/* 배너 높이만큼 본문 밀기 — 콘텐츠가 배너에 가려지지 않도록 */}
      <div style={{ height: '62px', flexShrink: 0 }} />
    </>
  );
}

const styles = {
  banner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99998,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    background: 'linear-gradient(135deg, #0a1628 0%, #0d2144 100%)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '4px',
    lineHeight: 1,
    flexShrink: 0,
  },
  icon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    objectFit: 'cover',
    flexShrink: 0,
    border: '1px solid rgba(255,255,255,0.15)',
  },
  info: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  appName: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#fff',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  appDesc: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.6)',
    marginTop: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  openBtn: {
    background: 'linear-gradient(135deg, #0056D2, #0096FF)',
    color: '#fff',
    border: 'none',
    borderRadius: '20px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(0,86,210,0.4)',
  },
};
