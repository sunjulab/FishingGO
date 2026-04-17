import { create } from 'zustand';

// 티어 정의 (낮은 순 → 높은 순)
// FREE → PRO → BUSINESS_LITE → BUSINESS_PRO → BUSINESS_VIP
export const TIER_CONFIG = {
  FREE:           { label: null,       color: null,      bg: null },
  PRO:            { label: 'PRO',      color: '#fff',    bg: 'linear-gradient(135deg, #0056D2, #003fa3)' },
  BUSINESS_LITE:  { label: 'LITE',     color: '#1A1A2E', bg: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)' },
  BUSINESS_PRO:   { label: 'BIZ PRO',  color: '#fff',    bg: 'linear-gradient(135deg, #FF9B26, #E67E00)' },
  BUSINESS_VIP:   { label: 'VIP',      color: '#5C3A00', bg: 'linear-gradient(135deg, #FFD700, #FFA500)' },
};

export const useUserStore = create((set, get) => ({
  // 사용자 데이터 — localStorage에서 로드, 없으면 null
  user: JSON.parse(localStorage.getItem('user')) || null,

  // 티어 — localStorage에서 로드, 기본값 FREE
  userTier: localStorage.getItem('userTier') || 'FREE',

  updateUser: (newData) => set((state) => {
    const updatedUser = { ...state.user, ...newData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return { user: updatedUser };
  }),

  setUser: (newUser) => set(() => {
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
      // 로그인 응답에 tier가 있으면 함께 저장
      if (newUser.tier) localStorage.setItem('userTier', newUser.tier);
    } else {
      localStorage.removeItem('user');
    }
    return { user: newUser };
  }),

  setUserTier: (tier) => {
    localStorage.setItem('userTier', tier);
    set({ userTier: tier });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userTier');
    set({ user: null, userTier: 'FREE' });
  },

  // 권한 헬퍼
  canAccessPremium:      () => ['PRO', 'BUSINESS_LITE', 'BUSINESS_PRO', 'BUSINESS_VIP'].includes(get().userTier),
  canAccessBusinessPromo:() => ['BUSINESS_PRO', 'BUSINESS_VIP'].includes(get().userTier),
  canAccessBusinessShop: () => ['BUSINESS_LITE', 'BUSINESS_PRO', 'BUSINESS_VIP'].includes(get().userTier),
  canAccessVIP:          () => get().userTier === 'BUSINESS_VIP',
}));
