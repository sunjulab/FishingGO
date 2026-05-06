import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { BellRing, X, ChevronRight, Zap } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';

// NEW-C3: 환경변수는 불변 — 컴포넌트 외부 상수로 분리 (useEffect 내 매번 읽기 제거)
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function RealTimeAlert() {
  const [alert, setAlert] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  const timerRef = useRef(null); // ✅ 29TH-C1: React.useRef → useRef (L1 named import 통일)
  // ✅ 17TH-B4: clearTimer useCallback 적용 — showAlert deps에 안전하게 포함하여 eslint-disable 제거
  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []); // timerRef는 ref로 안정적 — deps 불필요

  // ✅ 5TH-C5: showAlert useCallback — useEffect deps에 안전하게 포함 가능
  const showAlert = useCallback((data) => {
    setAlert(data);
    setIsVisible(true);
    clearTimer();
    timerRef.current = setTimeout(() => setIsVisible(false), 8000);
  }, [clearTimer]); // ✅ 17TH-B4: clearTimer deps 적시 — eslint-disable 제거

  // user?.email을 의존성에 포함 → 로그인/로그아웃 시 소켓 재생성 (최신 토큰으로 재인증)
  const userEmail = useUserStore((s) => s.user?.email);

  useEffect(() => {
    let alive = true; // 이 effect 인스턴스의 생존 플래그

    // NEW-A3: requestPermission() 비동기 수동 취소에 대한 .catch() 처리 추가 — iOS Safari 예외 방지
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => { /* 권한 거부 시 무시 */ });
    }

    const token = localStorage.getItem('access_token');
    const socket = io(SOCKET_URL, {
      auth: token ? { token } : {},
      reconnection: true,
      reconnectionDelay: 3000,
    });

    socket.on('fishing_alert', (data) => {
      if (alive) showAlert({
        ...data,
        time: data.time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      });
    });

    socket.on('push_notification', (data) => {
      const user = useUserStore.getState().user;
      if (!alive || !user || data.targetEmail !== user.email) return;
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.title, { body: data.message, icon: '/favicon.ico' });
      }
      showAlert({
        message: data.message,
        time: data.time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      });
    });

    return () => {
      alive = false;
      clearTimer();
      socket.disconnect();
    };
  }, [userEmail, showAlert]);

  // ✅ 5TH-B5: 소켓은 isVisible 관계없이 항상 유지됨 — null 반환은 DOM 렌더만 방지 (소켓 생존에 영향 없음)
  if (!isVisible || !alert) return null;

  return (
    <div
      className="premium-alert-toast"
      onClick={() => { navigate(alert.link || '/'); setIsVisible(false); }}
      style={{
        position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
        width: '90%', maxWidth: '400px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
        borderRadius: '20px', padding: '16px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)', border: '1px solid rgba(0, 86, 210, 0.2)',
        zIndex: 5000, display: 'flex', gap: '12px', alignItems: 'center',
        animation: 'slideDown 0.5s ease-out', // ✅ 5TH-A1: index.css 전역 @keyframes slideDown 사용
        cursor: 'pointer'
      }}
    >
      <div style={{ backgroundColor: '#0056D2', padding: '10px', borderRadius: '12px' }}>
        <Zap size={22} color="#fff" fill="#fff" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#0056D2' }}>실시간 입질 알림</span>
          <span style={{ fontSize: '10px', color: '#bbb' }}>{alert.time}</span>
        </div>
        <div style={{ fontSize: '14px', fontWeight: '800', color: '#1c1c1e', lineHeight: '1.4' }}>{alert.message}</div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
        style={{ border: 'none', background: 'none', padding: '4px', cursor: 'pointer' }}
      >
        <X size={18} color="#bbb" />
      </button>
    </div>
  );
}
