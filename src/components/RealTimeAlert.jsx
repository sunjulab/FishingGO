import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { BellRing, X, Fish, CloudLightning, AlertTriangle, CornerUpLeft, Megaphone } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useNotifStore } from '../store/useNotifStore';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LEVEL_UI = {
  danger:  { label: '⚡ 긴급 기상특보',   iconBg: '#FF3B30', iconColor: '#fff', border: 'rgba(255,59,48,0.4)',   bg: 'rgba(255,59,48,0.06)',  labelColor: '#FF3B30', Icon: CloudLightning },
  warning: { label: '⚠️ 기상 위험 알림',  iconBg: '#FF9B26', iconColor: '#fff', border: 'rgba(255,155,38,0.35)', bg: 'rgba(255,155,38,0.06)', labelColor: '#FF9B26', Icon: AlertTriangle  },
  info:    { label: '🎣 실시간 조황 알림', iconBg: '#0056D2', iconColor: '#fff', border: 'rgba(0,86,210,0.3)',   bg: 'rgba(235,245,255,0.8)', labelColor: '#0056D2', Icon: Fish           },
  season:  { label: '🌊 어종 시즌 알림',   iconBg: '#00C48C', iconColor: '#fff', border: 'rgba(0,196,140,0.3)', bg: 'rgba(235,255,245,0.8)', labelColor: '#00C48C', Icon: Fish           },
  tip:     { label: '📍 낚시 정보',         iconBg: '#8E8E93', iconColor: '#fff', border: 'rgba(142,142,147,0.25)', bg: 'rgba(248,249,250,0.95)', labelColor: '#8E8E93', Icon: BellRing  },
  reply:   { label: '↩ 크루 채팅 답장',   iconBg: '#0056D2', iconColor: '#fff', border: 'rgba(0,86,210,0.35)',  bg: 'rgba(235,245,255,0.9)', labelColor: '#0056D2', Icon: CornerUpLeft  },
  push:    { label: '📣 운영자 메시지',    iconBg: '#FF2D8B', iconColor: '#fff', border: 'rgba(255,45,139,0.3)', bg: 'rgba(255,240,248,0.9)', labelColor: '#FF2D8B', Icon: Megaphone     },
};

export default function RealTimeAlert() {
  const [alert, setAlert]       = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate   = useNavigate();
  const timerRef   = useRef(null);
  const userEmail  = useUserStore((s) => s.user?.email);
  const addNotif   = useNotifStore((s) => s.addNotif);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const showAlert = useCallback((data) => {
    setAlert(data);
    setIsVisible(true);
    clearTimer();
    timerRef.current = setTimeout(() => setIsVisible(false), 10000);
  }, [clearTimer]);

  useEffect(() => {
    let alive = true;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    let token = null;
    try { token = localStorage.getItem('access_token'); } catch {}

    const socket = io(SOCKET_URL, {
      auth: token ? { token } : {},
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 15000,
      timeout: 10000,
    });

    // ── 전체 기상·조황 알림 ──────────────────────────────────
    socket.on('fishing_alert', (data) => {
      if (!alive) return;
      const level = data.level || 'warning';
      const time  = data.time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      showAlert({ ...data, level, time });

      // 알림 스토어에 저장
      addNotif({
        type:  level === 'danger' ? 'alert' : 'info',
        icon:  level === 'danger' ? '⚡' : '🎣',
        title: LEVEL_UI[level]?.label || '낚시 알림',
        body:  data.message || '',
        time,
        link:  data.link || null,
      });
    });

    // ── 운영자 개인 푸시 ────────────────────────────────────
    socket.on('push_notification', (data) => {
      const user = useUserStore.getState().user;
      if (!alive || !user || data.targetEmail !== user.email) return;

      const time = data.time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

      // 브라우저 Notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.title || '📣 운영자 메시지', { body: data.message, icon: '/favicon.ico' });
      }

      showAlert({ message: data.message, level: 'push', time, link: data.link || null });

      // 알림 스토어에 저장
      addNotif({
        type:  'push',
        icon:  '📣',
        title: data.title || '운영자 메시지',
        body:  data.message || '',
        time,
        link:  data.link || null,
      });
    });

    // ── 크루 채팅 답장 알림 ──────────────────────────────────
    // 서버가 reply 메시지 수신 시 crew 룸 전체에 브로드캐스트
    // 클라이언트에서 내 닉네임 일치 여부 확인
    socket.on('crew_reply_notification', (data) => {
      const user = useUserStore.getState().user;
      if (!alive || !user) return;
      const myName = user.name || user.email;
      if (data.repliedToSender !== myName) return; // 내 메시지에 답장한 경우만

      const time = data.time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

      // 브라우저 Notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`↩ ${data.fromSender}님이 답장했습니다`, {
          body: data.replyText || '',
          icon: '/favicon.ico',
        });
      }

      showAlert({
        message: `${data.fromSender}: "${(data.replyText || '').slice(0, 40)}"`,
        level:   'reply',
        time,
        link:    data.crewId ? `/crew/${data.crewId}/chat` : null,
      });

      // 알림 스토어에 저장
      addNotif({
        type:  'reply',
        icon:  '↩',
        title: `${data.fromSender}님이 답장했습니다`,
        body:  data.replyText || '',
        time,
        link:  data.crewId ? `/crew/${data.crewId}/chat` : null,
      });
    });

    return () => {
      alive = false;
      clearTimer();
      socket.disconnect();
    };
  }, [userEmail, showAlert, clearTimer, addNotif]);

  if (!isVisible || !alert) return null;

  const level    = alert.level || 'info';
  const ui       = LEVEL_UI[level] || LEVEL_UI.info;
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
        {alert.link && (
          <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: ui.labelColor, fontWeight: '800', marginTop: '4px' }}>
            탭하여 이동 →
          </div>
        )}
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
