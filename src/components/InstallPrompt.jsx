// ✅ INSTALL-PWA (2026-11-25): 홈 화면 바로가기·앱 설치 안내
// - 안드로이드: Play 스토어 낚시GO 앱 설치 (게임 앱이 출시되면 ANDROID_APP_ID.game만 바꾸면 됨)
// - 아이폰: 크롬·사파리별 '공유 → 홈 화면에 추가' 그림 안내 (애플 정책상 자동 설치 불가)
// - PC(크롬·엣지): '바탕화면에 추가' 버튼 → 브라우저 설치 창
// - 카톡·인스타 등 앱 속 브라우저: 크롬·사파리로 열기 안내
// 띄우는 규칙: 두 번째 방문부터(또는 화면을 하나 더 열어 본 뒤) · 하루 1번 · 닫으면 7일(3번 닫으면 30일) · 앱 안/설치됨/결제·로그인·관리자 화면 제외
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import apiClient from '../api/index';

// 게임 앱(kr.fishinggo.game)이 Play에 나오면 game 값만 'kr.fishinggo.game'으로 바꾼다.
export const ANDROID_APP_ID = { home: 'kr.fishinggo.app', game: 'kr.fishinggo.app' };

const BLOCK_PATHS = ['/login', '/vvip-subscribe', '/payment-history', '/admin-dashboard', '/secret-admin', '/point-admin', '/cctv-admin', '/write', '/write-business', '/catch-upload'];
const DAY = 86400000;

const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* 무시 */ } },
};
const ss = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* 무시 */ } },
};
const todayKST = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);

function detect() {
  const ua = navigator.userAgent || '';
  const iOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  const kakao = /KAKAOTALK/i.test(ua);
  const inApp = kakao || /Instagram|FBAN|FBAV|NAVER\(inapp|Line\/|DaumApps|everytimeApp|; wv\)/i.test(ua);
  const criOS = /CriOS/i.test(ua);
  const m = ua.match(/OS (\d+)_(\d+)/);
  const iosVer = m ? Number(m[1]) + Number(m[2]) / 100 : 0;
  const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  const device = iOS ? 'ios' : android ? 'android' : 'pc';
  return { device, kakao, inApp, criOS, iosVer, standalone };
}

const isNativeApp = () => {
  try { if (Capacitor.isNativePlatform()) return true; } catch { /* 무시 */ }
  return /BangGusukApp\//.test(navigator.userAgent || '');
};

function track(event, device, game) {
  try { apiClient.post('/api/stats/install-event', { event, device, target: game ? 'game' : 'home' }).catch(() => {}); } catch { /* 무시 */ }
}

const ShareGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0056D2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px' }} aria-hidden="true">
    <path d="M12 3v12" /><path d="M7 8l5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </svg>
);

export default function InstallPrompt() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false); // 마이 탭에서 직접 연 경우(규칙 무시)
  const [canPrompt, setCanPrompt] = useState(!!window.__fgInstallEvent);
  const [copied, setCopied] = useState(false);
  const [sheet, setSheet] = useState(true); // false면 게임 화면용 작은 버튼
  const navCount = useRef(0);
  const env = useRef(null);
  if (!env.current) env.current = detect();
  const { device, kakao, inApp, criOS, iosVer, standalone } = env.current;
  const game = location.pathname.startsWith('/meta');

  // 방문 수 (탭 단위로 한 번만 센다)
  useEffect(() => {
    if (!ss.get('fg_install_counted')) {
      ss.set('fg_install_counted', '1');
      ls.set('fg_install_visits', String(Number(ls.get('fg_install_visits') || 0) + 1));
    }
    const onReady = () => setCanPrompt(true);
    const onDone = () => { setOpen(false); setCanPrompt(false); };
    const onManual = () => { setManual(true); setSheet(true); setOpen(true); };
    window.addEventListener('fg-install-ready', onReady);
    window.addEventListener('fg-installed', onDone);
    window.addEventListener('fg-open-install-guide', onManual);
    return () => {
      window.removeEventListener('fg-install-ready', onReady);
      window.removeEventListener('fg-installed', onDone);
      window.removeEventListener('fg-open-install-guide', onManual);
    };
  }, []);

  // 자동으로 띄울지 판단
  useEffect(() => {
    navCount.current += 1;
    if (open || isNativeApp() || standalone) return;
    if (ls.get('fg_install_done') === '1') return;
    if (BLOCK_PATHS.some(p => location.pathname.startsWith(p))) return;
    if (ss.get('fg_install_shown_session')) return;
    if (ls.get('fg_install_last_day') === todayKST()) return;
    if (Number(ls.get('fg_install_snooze_until') || 0) > Date.now()) return;
    if (device === 'pc' && !inApp && !window.__fgInstallEvent) return; // PC는 설치 창이 준비된 브라우저에서만
    const visits = Number(ls.get('fg_install_visits') || 0);
    if (visits < 2 && navCount.current < 2 && !game) return; // 첫 방문은 화면을 하나 더 열어 본 뒤

    // 게임은 플레이를 막지 않도록 60초 뒤 작은 버튼만, 나머지는 4초 뒤 카드
    const wait = game ? 60000 : 4000;
    const t = setTimeout(() => {
      if (window.__fgAnnouncementOpen) return; // 공지 팝업이 떠 있으면 이번엔 넘김
      ss.set('fg_install_shown_session', '1');
      ls.set('fg_install_last_day', todayKST());
      setManual(false);
      setSheet(!game);
      setOpen(true);
      track('shown', device, game);
    }, wait);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, canPrompt]);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    if (manual) return;
    const n = Number(ls.get('fg_install_dismiss') || 0) + 1;
    ls.set('fg_install_dismiss', String(n));
    ls.set('fg_install_snooze_until', String(Date.now() + (n >= 3 ? 30 : 7) * DAY));
    track('dismiss', device, game);
  };

  const runBrowserInstall = async () => {
    const ev = window.__fgInstallEvent;
    if (!ev) return false;
    track('click', device, game);
    try {
      ev.prompt();
      const r = await ev.userChoice;
      window.__fgInstallEvent = null;
      setCanPrompt(false);
      if (r && r.outcome === 'accepted') { ls.set('fg_install_done', '1'); track('installed', device, game); setOpen(false); }
    } catch { /* 무시 */ }
    return true;
  };

  const openPlay = () => {
    track('click', device, game);
    const id = game ? ANDROID_APP_ID.game : ANDROID_APP_ID.home;
    window.location.href = `https://play.google.com/store/apps/details?id=${id}&referrer=utm_source%3Dweb_install%26utm_medium%3D${game ? 'game' : 'home'}`;
  };

  const openExternal = () => {
    track('click', device, game);
    const url = window.location.href;
    if (kakao) { window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url); return; }
    if (device === 'android') {
      window.location.href = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
    }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); } catch { setCopied(false); }
  };

  const name = game ? '방구석 낚시꾼' : '낚시GO';
  const eun = game ? '은' : '는'; const eul = game ? '을' : '를'; // 조사
  const icon = game ? '/icons/game-192.png' : '/icons/app-192.png';

  // ── 내용 ──
  let title; let body; let actions;
  const primary = { width: '100%', padding: '15px', border: 'none', borderRadius: '14px', background: '#0056D2', color: '#fff', fontWeight: 900, fontSize: 'calc(16px * var(--fs, 1))', cursor: 'pointer' };
  const ghost = { background: 'none', border: 'none', color: '#8E8E93', fontWeight: 700, fontSize: 'calc(13px * var(--fs, 1))', cursor: 'pointer', padding: '10px', textDecoration: 'underline' };
  const step = { display: 'flex', gap: '10px', alignItems: 'center', fontSize: 'calc(15px * var(--fs, 1))', fontWeight: 700, color: '#1C1C1E', padding: '7px 0' };
  const num = { width: '24px', height: '24px', borderRadius: '50%', background: '#E8F0FE', color: '#0056D2', fontWeight: 900, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };

  if (inApp) {
    title = '크롬이나 사파리에서 열어 주세요';
    body = `지금 화면(${kakao ? '카카오톡' : '앱 속 브라우저'})에서는 홈 화면에 추가할 수 없어요.`;
    actions = kakao || device === 'android' ? (
      <button style={primary} onClick={openExternal}>{device === 'ios' ? '사파리로 열기' : '크롬으로 열기'}</button>
    ) : (
      <>
        <div style={step}><span style={num}>1</span>오른쪽 위 <b>⋯</b> 버튼</div>
        <div style={step}><span style={num}>2</span><b>외부 브라우저로 열기</b>(또는 Safari로 열기)</div>
        <button style={{ ...primary, background: '#F2F2F7', color: '#1C1C1E', marginTop: '8px' }} onClick={copyLink}>{copied ? '링크 복사됨 ✓' : '링크 복사하기'}</button>
      </>
    );
  } else if (device === 'android') {
    const gameAppReady = ANDROID_APP_ID.game !== ANDROID_APP_ID.home; // 게임 앱 출시 전에는 낚시GO 앱으로 안내
    if (game && !gameAppReady) {
      title = '낚시GO 앱으로 게임까지 바로';
      body = '낚시GO 앱 가운데 낚시게임 탭에서 같은 아이디로 이어서 할 수 있어요.';
    } else {
      title = `${name}${eun} 앱이 더 빨라요`;
      body = game ? '앱으로 받으면 홈 화면에서 바로 게임이 열려요.' : '물때 알림·조황 푸시를 받을 수 있어요.';
    }
    actions = (
      <>
        <button style={primary} onClick={openPlay}>무료로 앱 설치</button>
        {canPrompt && <button style={ghost} onClick={runBrowserInstall}>앱 없이 홈 화면에만 추가</button>}
      </>
    );
  } else if (device === 'ios') {
    const oldChrome = criOS && iosVer > 0 && iosVer < 16.4;
    title = `홈 화면에 ${name}${eul} 추가하면 앱처럼 열려요`;
    if (oldChrome) {
      body = '이 아이폰의 크롬에서는 홈 화면 추가가 안 돼요. 사파리에서 열어 주세요.';
      actions = <button style={primary} onClick={copyLink}>{copied ? '링크 복사됨 ✓ 사파리에 붙여넣기' : '링크 복사하기'}</button>;
    } else {
      body = criOS ? '크롬에서 이렇게 해 주세요.' : '사파리에서 이렇게 해 주세요.';
      actions = (
        <>
          <div style={step}><span style={num}>1</span>{criOS ? '주소창 오른쪽' : '화면 아래'} <ShareGlyph /> <b>공유</b> 버튼</div>
          <div style={step}><span style={num}>2</span>메뉴를 내려 <b>홈 화면에 추가</b></div>
          <div style={step}><span style={num}>3</span>오른쪽 위 <b>추가</b></div>
        </>
      );
    }
  } else {
    title = `바탕화면에서 바로 여는 ${name}`;
    body = '설치하면 바탕화면·시작 메뉴에 아이콘이 생기고 따로 창으로 열려요.';
    actions = canPrompt ? (
      <button style={primary} onClick={runBrowserInstall}>바탕화면에 추가</button>
    ) : (
      <div style={{ fontSize: 'calc(14px * var(--fs, 1))', color: '#3A3A3C', lineHeight: 1.6 }}>
        크롬이나 엣지 주소창 오른쪽의 <b>설치</b> 아이콘을 누르거나, 메뉴(⋮) → <b>저장 및 공유</b> → <b>설치</b>를 눌러 주세요.
      </div>
    );
  }

  // 게임 화면에서 자동으로 뜰 때는 플레이를 가리지 않는 작은 버튼만
  if (!sheet) {
    return (
      <button
        onClick={() => setSheet(true)}
        style={{ position: 'fixed', right: '12px', bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))', zIndex: 9000, padding: '9px 14px', borderRadius: '999px', border: 'none', background: 'rgba(0,86,210,0.92)', color: '#fff', fontWeight: 900, fontSize: 'calc(13px * var(--fs, 1))', boxShadow: '0 4px 14px rgba(0,0,0,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        📲 홈 화면에 추가
        <span onClick={(e) => { e.stopPropagation(); close(); }} style={{ marginLeft: '4px', opacity: 0.8, padding: '0 2px' }} aria-label="닫기">✕</span>
      </button>
    );
  }

  return (
    <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}
        style={{ width: '100%', maxWidth: '480px', background: '#fff', borderRadius: '24px 24px 0 0', padding: '22px 22px calc(18px + env(safe-area-inset-bottom, 0px))', boxSizing: 'border-box', fontFamily: 'Pretendard, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
          <img src={icon} alt="" width="52" height="52" style={{ borderRadius: '13px', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'calc(17px * var(--fs, 1))', fontWeight: 900, color: '#1C1C1E', lineHeight: 1.35 }}>{title}</div>
            <div style={{ fontSize: 'calc(13px * var(--fs, 1))', color: '#636366', fontWeight: 600, marginTop: '4px', lineHeight: 1.5 }}>{body}</div>
          </div>
          <button onClick={close} aria-label="닫기" style={{ background: '#F2F2F7', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '16px', color: '#8E8E93', cursor: 'pointer', flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>{actions}</div>
      </div>
    </div>
  );
}
