import React from 'react';
import { useToastStore } from '../store/useToastStore';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

// ✅ 7TH-B8: if-else 타입 분기 → TOAST_CONFIG 상수 맵 교체 — 확장성 개선 (warn 등 신규 타입 추가 용이)
const TOAST_CONFIG = {
  error:   { Icon: AlertCircle, color: '#FF3B30', bg: 'rgba(255, 235, 235, 0.95)' },
  success: { Icon: CheckCircle, color: '#00C48C', bg: 'rgba(235, 255, 245, 0.95)' },
  info:    { Icon: Info,        color: '#0056D2', bg: 'rgba(235, 245, 255, 0.95)' },
};
const DEFAULT_TOAST = TOAST_CONFIG.info;

export default function Toast() {
  // ✅ 3RD-C5: 전체 store 구독 → 분리 셀렉터 — 불필요한 리렌더 방지
  const toasts = useToastStore(s => s.toasts);
  const removeToast = useToastStore(s => s.removeToast);

  // NEW-B4: null 반환 대신 container 항상 마운트 — mount/unmount 레이아웃 shift 제거
  return (
    <div style={{
      position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px',
      width: '90%', maxWidth: '400px',
      pointerEvents: toasts.length === 0 ? 'none' : 'auto',
    }}>
      {toasts.map((toast) => {
        const { Icon, color, bg } = TOAST_CONFIG[toast.type] || DEFAULT_TOAST;

        return (
          <div key={toast.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
            backgroundColor: bg, borderRadius: '12px', border: `1px solid ${color}33`,
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)', pointerEvents: 'auto',
            animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <Icon size={20} color={color} />
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#1A1A2E', flex: 1 }}>{toast.message}</span>
            <X size={16} color="#8E8E93" style={{ cursor: 'pointer' }} onClick={() => removeToast(toast.id)} />
          </div>
        );
      })}
    </div>
  );
}
