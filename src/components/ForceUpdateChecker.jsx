import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AppUpdate } from '@capawesome/capacitor-app-update';

// ✅ AUTO-VERSION: 빌드 타임에 vite.config.js → package.json에서 자동 주입
// 앞으로 package.json의 "version"만 올리면 여기 자동 반영 (하드코딩 불필요)
// eslint-disable-next-line no-undef
const CURRENT_APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.1.17';

// semver 단순 비교 헬퍼 (v1이 v2보다 작으면 true)
function isVersionLower(v1, v2) {
  const p1 = v1.split('.').map(Number);
  const p2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 < n2) return true;
    if (n1 > n2) return false;
  }
  return false;
}

// ✅ UPDATE-DISMISS: localStorage에 24시간 쿨다운 저장 — 앱 재시작해도 하루 한 번만 표시
const DISMISS_KEY    = 'fishing_update_dismissed_at';
const DISMISS_HOURS  = 24; // 24시간 후 다시 알림
function isDismissed() {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    return (Date.now() - Number(ts)) < DISMISS_HOURS * 60 * 60 * 1000;
  } catch { return false; }
}
function setDismissed() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* noop */ }
}

export default function ForceUpdateChecker() {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [hidden, setHidden]           = useState(false); // 이번 세션에서 X 클릭 시
  const [storeUrl, setStoreUrl] = useState('https://play.google.com/apps/internaltest/4701312289208373704');

  useEffect(() => {
    let cancelled = false; // ✅ BUG-02 FIX: 언마운트 후 setState 방지
    const checkUpdate = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/app-config`);
        if (!res.ok || cancelled) return; // ✅ BUG-02 FIX
        const data = await res.json();
        if (cancelled) return; // ✅ BUG-02 FIX: fetch 후 취소 체크
        
        if (data.min_version && isVersionLower(CURRENT_APP_VERSION, data.min_version)) {
          if (data.store_url && !cancelled) setStoreUrl(data.store_url); // ✅ BUG-02 FIX
          
          if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
            try {
              const info = await AppUpdate.getAppUpdateInfo();
              if (info.updateAvailability !== 1) {
                await AppUpdate.performImmediateUpdate();
                return;
              }
            } catch (err) {
              if (!import.meta.env.PROD) console.warn('Native AppUpdate failed, falling back to custom modal:', err);
            }
          }
          
          if (!cancelled) setNeedsUpdate(true); // ✅ BUG-02 FIX
        }
      } catch (err) {
        if (!import.meta.env.PROD) console.warn('Failed to check app config:', err); // ✅ BUG-02 FIX: prod에서 콘솔 노출 방지
      }
    };
    checkUpdate();
    return () => { cancelled = true; }; // ✅ BUG-02 FIX
  }, []);

  // 24시간 내 이미 닫은 경우 또는 이번 세션에서 닫은 경우
  if (!needsUpdate || hidden || isDismissed()) return null;

  const handleUpdateClick = () => {
    window.location.href = storeUrl;
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.iconContainer}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0056D2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </div>
        <h2 style={styles.title}>새로운 버전 출시!</h2>
        <p style={styles.desc}>
          안정적인 서비스 이용을 위해<br />최신 버전으로 업데이트가 필요합니다.
        </p>
        <button style={styles.button} onClick={handleUpdateClick}>
          업데이트 하러 가기
        </button>
        <button style={styles.dismissButton} onClick={() => { setDismissed(); setHidden(true); }}>
          다음에 업데이트할게요
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(4px)',
    zIndex: 99999, // 앱의 모든 UI(헤더, 바텀네비 등) 덮기
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '32px 24px',
    width: '100%',
    maxWidth: '340px',
    textAlign: 'center',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  },
  iconContainer: {
    width: '80px',
    height: '80px',
    backgroundColor: '#F0F5FF',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#111',
    margin: '0 0 12px 0',
  },
  desc: {
    fontSize: '15px',
    color: '#666',
    lineHeight: '1.5',
    margin: '0 0 28px 0',
  },
  button: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#0056D2',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  dismissButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#999',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '400',
    cursor: 'pointer',
    marginTop: '4px',
  }
};
