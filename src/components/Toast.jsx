import React from 'react';
import { useToastStore } from '../store/useToastStore';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none', width: '90%', maxWidth: '400px'
    }}>
      {toasts.map((toast) => {
        let Icon = Info;
        let color = '#0056D2';
        let bg = 'rgba(235, 245, 255, 0.95)';
        if (toast.type === 'error') { Icon = AlertCircle; color = '#FF3B30'; bg = 'rgba(255, 235, 235, 0.95)'; }
        else if (toast.type === 'success') { Icon = CheckCircle; color = '#00C48C'; bg = 'rgba(235, 255, 245, 0.95)'; }

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
