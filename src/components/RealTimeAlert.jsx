import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { BellRing, X, ChevronRight, Zap } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';

export default function RealTimeAlert() {
  const [alert, setAlert] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 앱 푸쉬 권한 요청
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(SOCKET_URL);

    socket.on('fishing_alert', (data) => {
      setAlert(data);
      setIsVisible(true);
      // 8초 후 자동 페이드 아웃
      setTimeout(() => setIsVisible(false), 8000);
    });

    socket.on('push_notification', (data) => {
      const user = useUserStore.getState().user;
      if (user && data.targetEmail === user.email) {
        // 시스템 네이티브 푸쉬 알림 띄우기
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(data.title, {
            body: data.message,
            icon: '/favicon.ico' // 루트에 있는 파비콘 등을 아이콘으로 사용
          });
        }
        
        // 앱 내 인앱 알림창도 띄우기
        setAlert({
          message: data.message,
          time: data.time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        });
        setIsVisible(true);
        setTimeout(() => setIsVisible(false), 8000);
      }
    });

    return () => socket.disconnect();
  }, []);

  if (!isVisible || !alert) return null;

  return (
    <div 
      className="premium-alert-toast"
      onClick={() => {
        navigate('/');
        setIsVisible(false);
      }}
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '400px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '16px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(0, 86, 210, 0.2)',
        zIndex: 5000,
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        animation: 'slideDown 0.5s ease-out',
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
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(false);
        }} 
        style={{ border: 'none', background: 'none', padding: '4px', cursor: 'pointer' }}
      >
        <X size={18} color="#bbb" />
      </button>

      <style>{`
        @keyframes slideDown {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .premium-alert-toast { transition: transform 0.2s; }
        .premium-alert-toast:hover { transform: translateX(-50%) scale(1.02); }
      `}</style>
    </div>
  );
}
