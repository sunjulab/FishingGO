// src/services/PushNotificationService.js
// ✅ PUSH: Firebase Cloud Messaging 클라이언트 서비스
import { Capacitor } from '@capacitor/core';
import apiClient from '../api/index';

let _addToast = null;
let _navigate = null;

export function setPushHandlers({ addToast, navigate }) {
  _addToast = addToast;
  _navigate  = navigate;
}

export async function initPushNotifications(userId) {
  // 네이티브 앱이 아니면 스킵 (웹 브라우저 환경)
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // ── 권한 요청 ────────────────────────────────────────
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') {
      console.warn('[PUSH] 알림 권한 거부됨');
      return;
    }

    // ── FCM 등록 ─────────────────────────────────────────
    await PushNotifications.register();

    // ── 토큰 수신 → 서버 저장 ────────────────────────────
    PushNotifications.addListener('registration', async ({ value: token }) => {
      try {
        await apiClient.post('/api/user/push-token', { token, platform: 'android' });
        console.log('[PUSH] ✅ FCM 토큰 등록 완료');
      } catch (e) {
        console.warn('[PUSH] 토큰 저장 실패:', e.message);
      }
    });

    // ── 등록 실패 ────────────────────────────────────────
    PushNotifications.addListener('registrationError', (err) => {
      console.error('[PUSH] 등록 오류:', err.error);
    });

    // ── 포그라운드 알림 수신 → 인앱 토스트 ──────────────
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      const { title, body, data } = notification;
      if (_addToast) {
        _addToast(`${title}: ${body}`, 'info');
      }
    });

    // ── 알림 탭 → 화면 이동 ──────────────────────────────
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const data = action.notification.data;
      if (data?.route && _navigate) {
        _navigate(data.route);
      }
    });

    console.log('[PUSH] ✅ 푸시 알림 초기화 완료 (userId:', userId, ')');
  } catch (err) {
    console.error('[PUSH] 초기화 실패:', err.message);
  }
}

export async function unregisterPushToken() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    await PushNotifications.removeAllListeners();
    await apiClient.delete('/api/user/push-token');
  } catch (e) {
    console.warn('[PUSH] 토큰 해제 실패:', e.message);
  }
}
