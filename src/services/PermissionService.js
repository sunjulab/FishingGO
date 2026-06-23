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

    // ✅ BUG-3 FIX: Android 8+ 알림 채널 생성 (createChannel 없으면 무음/미표시 가능)
    // AndroidManifest의 default_notification_channel_id와 channelId 반드시 일치
    if (Capacitor.getPlatform() === 'android') {
      try {
        await PushNotifications.createChannel({
          id:          'fishing-go-default',
          name:        '낚시GO 알림',
          description: '낚시 조황, 기상 특보, 채팅 알림',
          importance:  5,          // IMPORTANCE_HIGH — 배너 + 소리
          sound:       'default',
          vibration:   true,
          visibility:  1,          // VISIBILITY_PUBLIC
        });
        console.log('[PUSH] ✅ Android 알림 채널 생성 완료');
      } catch (e) {
        console.warn('[PUSH] 채널 생성 실패 (무시):', e.message);
      }
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
// ✅ FIX: 화면 가리기/복교 때 마다 알림 업보끼 방지
//   - 뷀운스(3초): 연속 이벤트를 1당 1회로 제한
//   - 마운트 초기 2초: online 이벤트 무시 (앞 구동 시 오허 발화 방지)
//   - 실제 스테이터스 변경시에만 토스트 (offline→online 수서 보장)
export async function initNetworkMonitor(onOffline, onOnline) {
  let offlineTimer = null;
  let onlineTimer = null;
  let isCurrentlyOnline = navigator.onLine !== false; // 현재 실제 상태 추적
  const MOUNT_GUARD_MS = 2000; // 마운트 후 2초동안 online 이벤트 무시
  const DEBOUNCE_MS = 3000;    // 같은 종류의 이벤트는 3초 내 1번만
  const mountedAt = Date.now();

  const handleOffline = () => {
    if (onlineTimer) { clearTimeout(onlineTimer); onlineTimer = null; }
    if (offlineTimer) return; // 이미 대기 중 릴레이슱 🛃
    offlineTimer = setTimeout(() => {
      offlineTimer = null;
      if (isCurrentlyOnline) { // 실제로 오프라인이 된 경우만
        isCurrentlyOnline = false;
        onOffline?.();
      }
    }, DEBOUNCE_MS);
  };

  const handleOnline = () => {
    if (offlineTimer) { clearTimeout(offlineTimer); offlineTimer = null; }
    if (Date.now() - mountedAt < MOUNT_GUARD_MS) return; // 마운트 직후 무시
    if (onlineTimer) return; // 이미 대기 중
    onlineTimer = setTimeout(() => {
      onlineTimer = null;
      if (!isCurrentlyOnline) { // 실제 오프라인 중이었을 때만
        isCurrentlyOnline = true;
        onOnline?.();
      }
    }, DEBOUNCE_MS);
  };

  if (!Capacitor.isNativePlatform()) {
    // 웹 fallback
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (offlineTimer) clearTimeout(offlineTimer);
      if (onlineTimer) clearTimeout(onlineTimer);
    };
  }
  try {
    const { Network } = await import('@capacitor/network');
    const status = await Network.getStatus();
    isCurrentlyOnline = status.connected;
    if (!status.connected) onOffline?.(); // 시작시 오프라인이면 즉시 토스트

    const listener = await Network.addListener('networkStatusChange', (s) => {
      if (s.connected) handleOnline();
      else handleOffline();
    });
    return () => {
      listener.remove();
      if (offlineTimer) clearTimeout(offlineTimer);
      if (onlineTimer) clearTimeout(onlineTimer);
    };
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
