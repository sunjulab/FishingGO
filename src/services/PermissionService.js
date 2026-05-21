// src/services/PermissionService.js
// ✅ 낚시GO 앱 권한 통합 관리 서비스
// - 푸시 알림 / 위치 / 카메라 / 저장소 권한 요청
// - Capacitor 네이티브 환경에서만 동작 (웹 환경 자동 스킵)

import { Capacitor } from '@capacitor/core';
import apiClient from '../api/index';

// ─── 1. 푸시 알림 권한 + FCM 토큰 등록 ────────────────────────────────────────
export async function initPushPermission(userId) {
  if (!Capacitor.isNativePlatform()) return { ok: false, reason: 'web' };
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // 기존 리스너 중복 방지
    await PushNotifications.removeAllListeners();

    // 권한 요청
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') {
      console.warn('[PUSH] 알림 권한 거부됨');
      return { ok: false, reason: 'denied' };
    }

    // FCM 등록
    await PushNotifications.register();

    // 토큰 수신 → 서버 저장
    PushNotifications.addListener('registration', async ({ value: token }) => {
      try {
        await apiClient.post('/api/user/push-token', {
          token,
          platform: Capacitor.getPlatform(), // 'android' | 'ios'
        });
        console.log('[PUSH] ✅ FCM 토큰 등록 완료 (userId:', userId, ')');
      } catch (e) {
        console.warn('[PUSH] 토큰 저장 실패:', e.message);
      }
    });

    // 등록 실패
    PushNotifications.addListener('registrationError', (err) => {
      console.error('[PUSH] FCM 등록 오류:', err.error);
    });

    // 포그라운드 알림 수신 → 알림 배지 표시
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[PUSH] 포그라운드 알림 수신:', notification.title);
      // 토스트 표시는 setPushHandlers 통해 주입
      if (window.__pushToast) {
        window.__pushToast(`🔔 ${notification.title}: ${notification.body}`, 'info');
      }
    });

    // 알림 탭 → 화면 이동
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const route = action.notification?.data?.route;
      if (route && window.__pushNavigate) {
        window.__pushNavigate(route);
      }
    });

    return { ok: true };
  } catch (err) {
    console.error('[PUSH] 초기화 실패:', err.message);
    return { ok: false, reason: err.message };
  }
}

// 푸시 핸들러 주입 (App.jsx에서 호출)
export function setPushHandlers({ addToast, navigate }) {
  window.__pushToast = addToast;
  window.__pushNavigate = navigate;
}

// 토큰 해제 (로그아웃 시)
export async function unregisterPushToken() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    await PushNotifications.removeAllListeners();
    await apiClient.delete('/api/user/push-token');
    console.log('[PUSH] ✅ FCM 토큰 해제 완료');
  } catch (e) {
    console.warn('[PUSH] 토큰 해제 실패:', e.message);
  }
}

// ─── 2. 위치 권한 ──────────────────────────────────────────────────────────────
export async function requestLocationPermission() {
  if (!Capacitor.isNativePlatform()) {
    // 웹: navigator.geolocation API
    if (!navigator.geolocation) return { ok: false, reason: 'not-supported' };
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve({ ok: true }),
        (err) => resolve({ ok: false, reason: err.message }),
        { timeout: 5000 }
      );
    });
  }
  try {
    const { Geolocation } = await import('@capacitor/geolocation');
    const perm = await Geolocation.requestPermissions();
    // 'granted' | 'denied' | 'prompt'
    const ok = perm.location === 'granted' || perm.coarseLocation === 'granted';
    console.log('[GEO] 위치 권한:', perm.location);
    return { ok, status: perm.location };
  } catch (e) {
    console.warn('[GEO] 위치 권한 요청 실패:', e.message);
    return { ok: false, reason: e.message };
  }
}

// ─── 3. 카메라 / 사진 라이브러리 권한 ─────────────────────────────────────────
export async function requestCameraPermission() {
  if (!Capacitor.isNativePlatform()) return { ok: true }; // 웹은 별도 권한 불필요
  try {
    const { Camera } = await import('@capacitor/camera');
    const perm = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
    const cameraOk = perm.camera === 'granted' || perm.camera === 'limited';
    const photosOk = perm.photos === 'granted' || perm.photos === 'limited';
    console.log('[CAM] 카메라:', perm.camera, '/ 사진:', perm.photos);
    return { ok: cameraOk && photosOk, camera: perm.camera, photos: perm.photos };
  } catch (e) {
    console.warn('[CAM] 카메라 권한 요청 실패:', e.message);
    return { ok: false, reason: e.message };
  }
}

// ─── 4. 네트워크 상태 모니터링 ─────────────────────────────────────────────────
export async function initNetworkMonitor(onOffline, onOnline) {
  if (!Capacitor.isNativePlatform()) {
    // 웹 fallback
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }
  try {
    const { Network } = await import('@capacitor/network');
    const status = await Network.getStatus();
    if (!status.connected) onOffline?.();

    const listener = await Network.addListener('networkStatusChange', (s) => {
      if (s.connected) onOnline?.();
      else onOffline?.();
    });
    return () => listener.remove();
  } catch (e) {
    console.warn('[NET] 네트워크 모니터 실패:', e.message);
    return () => {};
  }
}

// ─── 5. 전체 권한 초기화 (앱 시작/로그인 후 일괄 요청) ─────────────────────────
export async function requestAllPermissions(userId) {
  if (!Capacitor.isNativePlatform()) return;

  console.log('[PERM] 권한 초기화 시작 (userId:', userId, ')');

  // 1) 푸시 알림 (가장 먼저 — 사용자 주목 유도)
  const push = await initPushPermission(userId);
  console.log('[PERM] 푸시:', push.ok ? '✅' : '❌', push.reason || '');

  // 2) 위치 (지도 기능 필수)
  const loc = await requestLocationPermission();
  console.log('[PERM] 위치:', loc.ok ? '✅' : '❌', loc.reason || '');

  // 3) 카메라/사진 (조과 등록 필수)
  const cam = await requestCameraPermission();
  console.log('[PERM] 카메라:', cam.ok ? '✅' : '❌', cam.reason || '');

  return { push, location: loc, camera: cam };
}
