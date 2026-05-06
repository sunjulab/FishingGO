import { create } from 'zustand';

// ✅ BUG-49: Date.now() ID 충돌 방지 — 단조 증가 카운터 사용
let _toastId = 0;
// ✅ 4TH-A3: setTimeout 타이머 추적 Map — removeToast 시 clearTimeout으로 메모리 누수 방지
const _timers = new Map();

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = ++_toastId; // ✅ 단조 증가 정수 — 무한 유일성 보장
    // ✅ 4TH-C1: set(state => ({...})) 스타일 통일 — useUserStore 패턴 일치
    set(state => ({ toasts: [...state.toasts, { id, message, type }] }));
    const timer = setTimeout(() => {
      _timers.delete(id);
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 3000);
    _timers.set(id, timer);
  },
  removeToast: (id) => {
    // ✅ 4TH-A3: clearTimeout으로 타이머 정리 — 수동 닫기 시 지연 set 호출 방지
    if (_timers.has(id)) {
      clearTimeout(_timers.get(id));
      _timers.delete(id);
    }
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },
}));
