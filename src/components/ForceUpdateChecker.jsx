import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AppUpdate } from '@capawesome/capacitor-app-update';

// ✅ AUTO-VERSION: 빌드 타임에 vite.config.js → package.json에서 자동 주입
// 앞으로 package.json의 "version"만 올리면 여기 자동 반영 (하드코딩 불필요)
// eslint-disable-next-line no-undef
const CURRENT_APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.1.11';

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

export default function ForceUpdateChecker() {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [storeUrl, setStoreUrl] = useState('https://play.google.com/apps/internaltest/4701312289208373704');

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/app-config`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.min_version && isVersionLower(CURRENT_APP_VERSION, data.min_version)) {
          if (data.store_url) setStoreUrl(data.store_url);
          
          // 1. Android 네이티브 환경인 경우 공식 In-App Update(Immediate) 시도
          if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
            try {
              const info = await AppUpdate.getAppUpdateInfo();
              if (info.updateAvailability !== 1) { // 1 = UPDATE_NOT_AVAILABLE
                // 즉시 업데이트 실행 시도
                await AppUpdate.performImmediateUpdate();
                return; // 성공적으로 구글 플레이 팝업이 덮었다면 모달을 렌더링하지 않음 (대기)
              }
            } catch (err) {
              console.warn('Native AppUpdate failed, falling back to custom modal:', err);
            }
          }
          
          // 2. 인앱 업데이트 실패 또는 미지원 환경(웹/iOS)일 경우 커스텀 강제 모달 표시
          setNeedsUpdate(true);
        }
      } catch (err) {
        console.error('Failed to check app config:', err);
      }
    };
    checkUpdate();
  }, []);

  if (!needsUpdate || dismissed) return null;

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
        <button style={styles.dismissButton} onClick={() => setDismissed(true)}>
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
