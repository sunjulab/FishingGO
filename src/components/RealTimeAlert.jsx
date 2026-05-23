import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { BellRing, X, Fish, CloudLightning, AlertTriangle } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ✅ CLEAN-ALERT: 하드코딩 ALERT_POOL 완전 제거 — 서버 실시간 push만 수신
// 자동 로테이션(가짜 메시지) 삭제. fishing_alert / push_notification 소켓만 사용.

const LEVEL_UI = {
  danger:  { label: '🚨 긴급 기상특보',    iconBg: '#FF3B30', iconColor: '#fff', border: 'rgba(255,59,48,0.4)',   bg: 'rgba(255,59,48,0.06)',  labelColor: '#FF3B30', Icon: CloudLightning },
  warning: { label: '⚠️ 현지 낚시 소식',   iconBg: '#FF9B26', iconColor: '#fff', border: 'rgba(255,155,38,0.35)', bg: 'rgba(255,155,38,0.06)', labelColor: '#FF9B26', Icon: AlertTriangle },
  info:    { label: '🎣 실시간 조황 소식',  iconBg: '#0056D2', iconColor: '#fff', border: 'rgba(0,86,210,0.3)',    bg: 'rgba(235,245,255,0.8)', labelColor: '#0056D2', Icon: Fish },
  season:  { label: '🌊 어종 시즌 알림',   iconBg: '#00C48C', iconColor: '#fff', border: 'rgba(0,196,140,0.3)',  bg: 'rgba(235,255,245,0.8)', labelColor: '#00C48C', Icon: Fish },
  tip:     { label: '💡 낚시 정보',         iconBg: '#8E8E93', iconColor: '#fff', border: 'rgba(142,142,147,0.25)', bg: 'rgba(248,249,250,0.95)', labelColor: '#8E8E93', Icon: BellRing },
};

export default function RealTimeAlert() {
  const [alert, setAlert]     = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate  = useNavigate();
  const timerRef  = useRef(null);
  const userEmail = useUserStore((s) => s.user?.email);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const showAlert = useCallback((data) => {
    setAlert(data);
    setIsVisible(true);
    clearTimer();
    // 10초 후 자동 닫기
    timerRef.current = setTimeout(() => setIsVisible(false), 10000);
  }, [clearTimer]);

  useEffect(() => {
    let alive = true;

    // 브라우저 Notification 권한 요청 (관리자 push 대응)
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    let token = null;
    try { token = localStorage.getItem('access_token'); } catch { /* 스토리지 차단 */ }

    const socket = io(SOCKET_URL, {
      auth: token ? { token } : {},
      reconnection: true,
      reconnectionAttempts: 3,       // 최대 3번만 재시도 (무한 스피너 방지)
      reconnectionDelay: 5000,        // 5초 간격 (기존 3초 → 더 여유)
      reconnectionDelayMax: 15000,    // 최대 15초 대기
      timeout: 10000,                 // 10초 연결 타임아웃
    });

    // ✅ 서버 실시간 낚시 알람 (관리자/서버 push — 실제 기상·조황 정보)
    socket.on('fishing_alert', (data) => {
      if (!alive) return;
      showAlert({
        ...data,
        level: data.level || 'warning',
        time: data.time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      });
    });

    // ✅ 개인 타겟 푸시 알림 (관리자 → 특정 유저 직접 발송)
    socket.on('push_notification', (data) => {
      const user = useUserStore.getState().user;
      if (!alive || !user || data.targetEmail !== user.email) return;
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.title, { body: data.message, icon: '/favicon.ico' });
      }
      showAlert({
        message: data.message,
        level: 'info',
        time: data.time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      });
    });

    return () => {
      alive = false;
      clearTimer();
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail, showAlert, clearTimer]);

  if (!isVisible || !alert) return null;

  const level  = alert.level || 'info';
  const ui     = LEVEL_UI[level] || LEVEL_UI.info;
  const IconComp = ui.Icon;

  return (
    <div
      className="premium-alert-toast"
      onClick={() => { if (alert.link) navigate(alert.link); setIsVisible(false); }}
      style={{
        position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
        width: '92%', maxWidth: '420px',
        backgroundColor: ui.bg,
        backdropFilter: 'blur(16px)',
        borderRadius: '20px', padding: '14px 16px',
        boxShadow: `0 12px 40px rgba(0,0,0,0.12), 0 0 0 1px ${ui.border}`,
        border: `1px solid ${ui.border}`,
        zIndex: 5000, display: 'flex', gap: '12px', alignItems: 'center',
        animation: 'slideDown 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
        cursor: alert.link ? 'pointer' : 'default',
      }}
    >
      <div style={{ backgroundColor: ui.iconBg, padding: '9px', borderRadius: '12px', flexShrink: 0 }}>
        <IconComp size={20} color={ui.iconColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
          <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', color: ui.labelColor }}>{ui.label}</span>
          <span style={{ fontSize: `calc(10px * var(--fs, 1))`, color: '#bbb', flexShrink: 0, marginLeft: '8px' }}>{alert.time}</span>
        </div>
        <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '800', color: '#1c1c1e', lineHeight: '1.45', wordBreak: 'keep-all' }}>
          {alert.message}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
        style={{ border: 'none', background: 'none', padding: '4px', cursor: 'pointer', flexShrink: 0 }}
      >
        <X size={17} color="#bbb" />
      </button>
    </div>
  );
}
