import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bell, Trash2, CheckCheck, CornerUpLeft, Megaphone, Fish, AlertTriangle } from 'lucide-react';
import { useNotifStore } from '../store/useNotifStore';

// 알림 타입별 아이콘·색상 매핑
const TYPE_UI = {
  reply:  { bg: '#EEF4FF', accent: '#0056D2', label: '답장 알림',   Icon: CornerUpLeft },
  push:   { bg: '#FFF0F8', accent: '#FF2D8B', label: '운영자 알림', Icon: Megaphone    },
  alert:  { bg: '#FFF8E6', accent: '#FF9B26', label: '기상 특보',   Icon: AlertTriangle },
  info:   { bg: '#F0FFF8', accent: '#00C48C', label: '낚시 정보',   Icon: Fish         },
  system: { bg: '#F5F5FA', accent: '#8E8E93', label: '시스템',       Icon: Bell         },
};

function getTypeUI(type) {
  return TYPE_UI[type] || TYPE_UI.system;
}

export default function NotifPanel({ onClose }) {
  const navigate  = useNavigate();
  const notifs    = useNotifStore(s => s.notifs);
  const markAllRead = useNotifStore(s => s.markAllRead);
  const markRead  = useNotifStore(s => s.markRead);
  const clearAll  = useNotifStore(s => s.clearAll);

  // 패널 열면 전체 읽음 처리
  useEffect(() => { markAllRead(); }, [markAllRead]);

  const handleClick = (notif) => {
    markRead(notif.id);
    if (notif.link) { navigate(notif.link); onClose(); }
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 8000, backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* 패널 */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: '380px',
        background: '#fff',
        zIndex: 8100,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
        animation: 'slideInRight 0.25s cubic-bezier(0.34,1.2,0.64,1)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}>

        {/* 헤더 */}
        <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid #F0F0F5', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bell size={20} color="#0056D2" strokeWidth={2.5} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '17px', fontWeight: '900', color: '#1c1c1e' }}>알림 센터</div>
            <div style={{ fontSize: '11px', color: '#aaa', fontWeight: '700', marginTop: '2px' }}>
              {notifs.length}개 알림
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {notifs.length > 0 && (
              <button
                onClick={clearAll}
                style={{ border: 'none', background: '#FFF0F0', padding: '7px 10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: '#FF3B30', fontSize: '12px', fontWeight: '800' }}
              >
                <Trash2 size={13} /> 전체 삭제
              </button>
            )}
            <button onClick={onClose} style={{ border: 'none', background: '#F5F5FA', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} color="#666" />
            </button>
          </div>
        </div>

        {/* 알림 목록 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifs.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', paddingTop: '80px' }}>
              <div style={{ fontSize: '48px' }}>🔔</div>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#1c1c1e' }}>알림이 없습니다</div>
              <div style={{ fontSize: '13px', color: '#aaa', fontWeight: '700', textAlign: 'center', lineHeight: '1.6' }}>
                크루 채팅 답장, 운영자 메시지<br />기상 특보 등을 여기서 확인하세요
              </div>
            </div>
          ) : (
            notifs.map(notif => {
              const ui = getTypeUI(notif.type);
              const IconComp = ui.Icon;
              return (
                <div
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  style={{
                    background: notif.read ? '#FAFAFA' : ui.bg,
                    border: `1.5px solid ${notif.read ? '#F0F0F5' : ui.accent + '30'}`,
                    borderRadius: '16px',
                    padding: '13px 14px',
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    cursor: notif.link ? 'pointer' : 'default',
                    transition: 'all 0.15s',
                    position: 'relative',
                    opacity: notif.read ? 0.7 : 1,
                  }}
                  onMouseEnter={e => { if (notif.link) e.currentTarget.style.transform = 'scale(1.01)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {/* 아이콘 */}
                  <div style={{ background: ui.accent, borderRadius: '10px', padding: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconComp size={15} color="#fff" />
                  </div>

                  {/* 내용 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: ui.accent }}>{ui.label}</span>
                      {!notif.read && (
                        <span style={{ width: '6px', height: '6px', background: ui.accent, borderRadius: '50%', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: '10px', color: '#c0c0c0', marginLeft: 'auto', flexShrink: 0 }}>{notif.time}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#1c1c1e', marginBottom: '3px', lineHeight: '1.4' }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#555', fontWeight: '500', lineHeight: '1.5', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {notif.body}
                    </div>
                    {notif.link && (
                      <div style={{ fontSize: '11px', color: ui.accent, fontWeight: '800', marginTop: '6px' }}>
                        탭하여 이동 →
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 하단 */}
        {notifs.length > 0 && (
          <div style={{ padding: '12px 20px 20px', borderTop: '1px solid #F0F0F5', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCheck size={14} color="#00C48C" />
            <span style={{ fontSize: '12px', color: '#aaa', fontWeight: '700' }}>
              패널을 열면 자동으로 읽음 처리됩니다
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
