import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ✅ NOTIF STORE: 미확인 개인 알람 저장 (최대 50개, localStorage 유지)
export const useNotifStore = create(
  persist(
    (set, get) => ({
      notifs: [],    // { id, type, title, body, time, read, link, icon }

      // 알림 추가 (중복 방지: 동일 id 제외)
      addNotif: (n) => set(s => {
        const id = n.id || Date.now() + Math.random();
        if (s.notifs.some(x => x.id === id)) return s;
        const notif = {
          id,
          type:  n.type  || 'info',
          title: n.title || '알림',
          body:  n.body  || n.message || '',
          time:  n.time  || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          read:  false,
          link:  n.link  || null,
          icon:  n.icon  || '🔔',
        };
        return { notifs: [notif, ...s.notifs].slice(0, 50) };
      }),

      // 단건 읽음
      markRead: (id) => set(s => ({
        notifs: s.notifs.map(n => n.id === id ? { ...n, read: true } : n),
      })),

      // 전체 읽음 처리
      markAllRead: () => set(s => ({
        notifs: s.notifs.map(n => ({ ...n, read: true })),
      })),

      // 전체 삭제
      clearAll: () => set({ notifs: [] }),

      // 미읽음 수 (computed)
      getUnreadCount: () => get().notifs.filter(n => !n.read).length,
    }),
    {
      name: 'fg-notifications-v1',
      partialize: (s) => ({ notifs: s.notifs.slice(0, 30) }),
    }
  )
);
