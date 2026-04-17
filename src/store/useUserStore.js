import { create } from 'zustand';

// ── 구독 티어 설정 ──────────────────────────────────────────────
export const TIER_CONFIG = {
  FREE:           { label: null,       color: null,      bg: null },
  PRO:            { label: 'PRO',      color: '#fff',    bg: 'linear-gradient(135deg, #0056D2, #003fa3)' },
  BUSINESS_LITE:  { label: 'LITE',     color: '#1A1A2E', bg: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)' },
  BUSINESS_PRO:   { label: 'BIZ PRO',  color: '#fff',    bg: 'linear-gradient(135deg, #FF9B26, #E67E00)' },
  BUSINESS_VIP:   { label: 'VIP',      color: '#5C3A00', bg: 'linear-gradient(135deg, #FFD700, #FFA500)' },
  MASTER:         { label: 'MASTER',   color: '#fff',    bg: 'linear-gradient(135deg, #E60000, #990000)' },
};

// ── 레벨 시스템 설정 ────────────────────────────────────────────
// 레벨별 필요 EXP: 레벨 N 달성에 필요한 누적 EXP
export const LEVEL_CONFIG = [
  { level: 1,  title: '초보 낚시꾼',   emoji: '🪱', expRequired: 0,    color: '#8E8E93', reward: '가입 환영 500 P 지급' },
  { level: 2,  title: '견습 낚시꾼',   emoji: '🎣', expRequired: 100,  color: '#8E8E93', reward: '1,000 P 지급' },
  { level: 3,  title: '낚시 입문자',   emoji: '🐟', expRequired: 250,  color: '#34C759', reward: '입문자용 프로필 은장 테두리' },
  { level: 4,  title: '낚시 애호가',   emoji: '🐠', expRequired: 500,  color: '#34C759', reward: '2,000 P 지급' },
  { level: 5,  title: '베테랑 낚시인', emoji: '🐡', expRequired: 850,  color: '#0056D2', reward: '낚시 쇼핑몰 5% 할인 쿠폰' },
  { level: 6,  title: '중급 낚시꾼',   emoji: '🦈', expRequired: 1300, color: '#0056D2', reward: '커뮤니티 닉네임 볼드(Bold) 효과' },
  { level: 7,  title: '고수 낚시인',   emoji: '🎯', expRequired: 1900, color: '#FF9B26', reward: '고강도 프로필 금장 테두리 + 5,000 P' },
  { level: 8,  title: '낚시 장인',     emoji: '⚓', expRequired: 2700, color: '#FF9B26', reward: '낚시 쇼핑몰 10% 할인 쿠폰' },
  { level: 9,  title: '전설의 낚시인', emoji: '👑', expRequired: 3700, color: '#FF5A5F', reward: '전설 등급 한정판 뱃지 이펙트' },
  { level: 10, title: '낚시의 신',     emoji: '🌊', expRequired: 5000, color: '#FFD700', reward: '명예의 전당 등재 및 VIP 멤버쉽 1개월권' },
];

// ── EXP 활동 보상표 ─────────────────────────────────────────────
export const EXP_REWARDS = {
  attendance:       { exp: 20,  label: '출석 체크',         icon: '📅' },
  post_write:       { exp: 30,  label: '게시글 작성',       icon: '📝' },
  record_write:     { exp: 50,  label: '조과 기록 등록',    icon: '🐟' },
  comment_write:    { exp: 10,  label: '댓글 작성',         icon: '💬' },
  like_receive:     { exp: 5,   label: '좋아요 획득',       icon: '❤️' },
  point_visit:      { exp: 15,  label: '포인트 방문 확인',  icon: '📍' },
  photo_upload:     { exp: 25,  label: '낚시 사진 등록',    icon: '📸' },
  first_catch:      { exp: 100, label: '첫 조과 기록',      icon: '🏆' },
  weekly_streak:    { exp: 80,  label: '7일 연속 출석',     icon: '🔥' },
  monthly_streak:   { exp: 300, label: '30일 연속 출석',    icon: '⭐' },
};

/**
 * 현재 레벨 정보 반환
 */
export const getLevelInfo = (totalExp = 0) => {
  let currentLevel = LEVEL_CONFIG[0];
  let nextLevel = LEVEL_CONFIG[1] || null;

  for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
    if (totalExp >= LEVEL_CONFIG[i].expRequired) {
      currentLevel = LEVEL_CONFIG[i];
      nextLevel = LEVEL_CONFIG[i + 1] || null;
      break;
    }
  }

  const expInCurrentLevel = totalExp - currentLevel.expRequired;
  const expNeededForNext = nextLevel
    ? nextLevel.expRequired - currentLevel.expRequired
    : 0;
  const progressPct = nextLevel
    ? Math.min(100, Math.round((expInCurrentLevel / expNeededForNext) * 100))
    : 100;

  return {
    ...currentLevel,
    totalExp,
    expInCurrentLevel,
    expNeededForNext,
    progressPct,
    nextLevel,
    isMaxLevel: !nextLevel,
  };
};

export const useUserStore = create((set, get) => ({
  // 사용자 데이터
  user: JSON.parse(localStorage.getItem('user')) || null,

  // 구독 티어
  userTier: localStorage.getItem('userTier') || 'FREE',

  // ── 기본 유저 업데이트 ──
  updateUser: (newData) => set((state) => {
    const updatedUser = { ...state.user, ...newData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return { user: updatedUser };
  }),

  setUser: (newUser) => set(() => {
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
      if (newUser.tier) localStorage.setItem('userTier', newUser.tier);
    } else {
      localStorage.removeItem('user');
    }
    return { user: newUser };
  }),

  // ── EXP 추가 (로컬 즉시 반영) ──
  addExp: (amount, activityKey = '') => set((state) => {
    if (!state.user) return {};
    const currentTotalExp = state.user.totalExp || 0;
    const newTotalExp = currentTotalExp + amount;
    const newLevelInfo = getLevelInfo(newTotalExp);
    const oldLevelInfo = getLevelInfo(currentTotalExp);

    const updatedUser = {
      ...state.user,
      totalExp: newTotalExp,
      level: newLevelInfo.level,
      exp: newLevelInfo.expInCurrentLevel,
      levelTitle: newLevelInfo.title,
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));

    const leveledUp = newLevelInfo.level > oldLevelInfo.level;
    return { user: updatedUser, lastExpGain: { amount, activityKey, leveledUp, newLevel: newLevelInfo } };
  }),

  // ── 구독 티어 ──
  setUserTier: (tier) => {
    localStorage.setItem('userTier', tier);
    set({ userTier: tier });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userTier');
    set({ user: null, userTier: 'FREE', lastExpGain: null });
  },

  // ── 레벨 정보 헬퍼 ──
  getLevelInfo: () => getLevelInfo(get().user?.totalExp || 0),

  // 마지막 EXP 획득 이벤트 (레벨업 알림 등에 활용)
  lastExpGain: null,
  clearLastExpGain: () => set({ lastExpGain: null }),

  // ── 권한 헬퍼 ──
  canAccessPremium:      () => {
    const state = get();
    if (state.user?.id === 'sunjulab' || state.user?.email === 'sunjulab') return true;
    return ['PRO', 'BUSINESS_LITE', 'BUSINESS_PRO', 'BUSINESS_VIP'].includes(state.userTier);
  },
  canAccessBusinessPromo:() => {
    const state = get();
    if (state.user?.id === 'sunjulab' || state.user?.email === 'sunjulab') return true;
    return ['BUSINESS_PRO', 'BUSINESS_VIP'].includes(state.userTier);
  },
  canAccessBusinessShop: () => {
    const state = get();
    if (state.user?.id === 'sunjulab' || state.user?.email === 'sunjulab') return true;
    return ['BUSINESS_LITE', 'BUSINESS_PRO', 'BUSINESS_VIP'].includes(state.userTier);
  },
  canAccessVIP:          () => {
    const state = get();
    if (state.user?.id === 'sunjulab' || state.user?.email === 'sunjulab') return true;
    return state.userTier === 'BUSINESS_VIP';
  },
}));
