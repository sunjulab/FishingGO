import { create } from 'zustand';

export const useVideoStore = create((set) => ({
  isGlobalMuted: true, // 초기값: 음소거 (브라우저 자동재생 정책 준수)
  toggleMute: () => set((state) => ({ isGlobalMuted: !state.isGlobalMuted })),
  setMuted: (muted) => set({ isGlobalMuted: muted }),
}));
