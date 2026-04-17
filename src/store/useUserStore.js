import { create } from 'zustand';

export const useUserStore = create((set, get) => ({
  // 사용자 데이터. 초기화 시 localStorage에서 로드
  user: JSON.parse(localStorage.getItem('user')) || {
    name: '강릉감성돔킬러', email: 'premium_user@fishinggo.com', level: 4, points: 12400, followers: 150, records: 12, picture: 'https://i.pravatar.cc/150?img=11'
  },
  
  // 시연용 계정 티어
  userTier: 'BUSINESS_VIP', 

  updateUser: (newData) => set((state) => {
    const updatedUser = { ...state.user, ...newData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return { user: updatedUser };
  }),

  setUser: (newUser) => set(() => {
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
    return { user: newUser };
  }),

  logout: () => {
    localStorage.removeItem('user');
    set({ user: null });
  },

  canAccessPremium: () => ['PRO', 'BUSINESS_PRO', 'BUSINESS_VIP'].includes(get().userTier),
  canAccessBusinessPromo: () => ['BUSINESS_PRO', 'BUSINESS_VIP'].includes(get().userTier),
  canAccessBusinessShop: () => ['BUSINESS_LITE', 'BUSINESS_PRO', 'BUSINESS_VIP'].includes(get().userTier),
  canAccessVIP: () => get().userTier === 'BUSINESS_VIP',
  setUserTier: (tier) => set({ userTier: tier }),
}));
