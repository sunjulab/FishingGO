import { create } from 'zustand';

// ── 구독 티어 설정 ──────────────────────────────────────────────
export const TIER_CONFIG = {
  FREE:           { label: null,       color: null,      bg: null,       price: 0        },
  BUSINESS_LITE:  { label: 'LITE',     color: '#1A1A2E', bg: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)', price: 9900   },
  PRO:            { label: 'PRO',      color: '#fff',    bg: 'linear-gradient(135deg, #0056D2, #003fa3)', price: 110000 },
  BUSINESS_VIP:   { label: '👑 VVIP', color: '#5C3A00', bg: 'linear-gradient(135deg, #FFD700, #FF9B26)', price: 550000 },
  MASTER:         { label: 'MASTER',   color: '#fff',    bg: 'linear-gradient(135deg, #E60000, #990000)', price: null   },
};

// ── 레벨 시스템 설정 ────────────────────────────────────────────
// 레벨별 필요 EXP: 레벨 N 달성에 필요한 누적 EXP
export const LEVEL_CONFIG = [
  { level: 1,  title: '초보 낚시꾼',   emoji: '🪱', expRequired: 0,    color: '#8E8E93', reward: '가입 환영 500 P 지급' },
  { level: 2,  title: '견습 낚시꾼',   emoji: '🎣', expRequired: 100,  color: '#8E8E93', reward: '1,000 P 지급' },
  { level: 3,  title: '낚시 입문자',   emoji: '🐟', expRequired: 250,  color: '#34C759', reward: '입문자용 프로필 은장 테두리' },
  { level: 4,  title: '낚시 애호가',   emoji: '🐠', expRequired: 500,  color: '#34C759', reward: '2,000 P 지급' },
  { level: 5,  title: '베테랑 낚시인', emoji: '🐡', expRequired: 850,  color: '#0056D2', reward: '커뮤니티 닉네임 블루 네온 글로우 효과' },
  { level: 6,  title: '중급 낚시꾼',   emoji: '🦈', expRequired: 1300, color: '#0056D2', reward: '커뮤니티 닉네임 볼드(Bold) 형광 효과' },
  { level: 7,  title: '고수 낚시인',   emoji: '🎯', expRequired: 1900, color: '#FF9B26', reward: '고강도 프로필 금장 테두리 + 5,000 P' },
  { level: 8,  title: '낚시 장인',     emoji: '⚓', expRequired: 2700, color: '#FF9B26', reward: '채팅 및 글 작성 무지개색 폰트 사용권' },
  { level: 9,  title: '전설의 낚시인', emoji: '👑', expRequired: 3700, color: '#FF5A5F', reward: '전설 등급 한정판 뱃지 애니메이션' },
];

// ── EXP 활동 보상표 ─────────────────────────────────────────────
// ENH4-B7: 향후 운영 유연성을 위해 서버 /api/config/exp에서 동적 수신 고려
// (현재 하드코딩 수용 가능, 운영 중 보상값 조정 시 배포 없이 적용 가능해짐)
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

// ✅ 3RD-A3: 관리자 판별 상수 — 5중 중복 하드코딩 → 단일 지점 관리
// sunjulab.k = 마스터 계정 이메일 (DB 필드값), sunjulab = resolved-id
export const ADMIN_ID    = 'sunjulab';       // 서버가 어드민 로그인 시 반환하는 resolved id
export const ADMIN_EMAIL = 'sunjulab.k';     // ✅ 마스터 계정 이메일 (sunjulab.k@gmail.com도 호환)

/**
 * 현재 레벨 정보 반환
 */
export const getLevelInfo = (totalExp = 0) => {
  let currentLevel;
  let nextLevel;

  if (totalExp < 5000) {
    for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
      if (totalExp >= LEVEL_CONFIG[i].expRequired) {
        currentLevel = LEVEL_CONFIG[i];
        nextLevel = LEVEL_CONFIG[i + 1] || { level: 10, expRequired: 5000 };
        break;
      }
    }
  } else {
    // 5000 이상의 경험치부터는 끝이 없는 초월(Infinite) 레벨 적용 (레벨이 오를수록 요구 경험치가 기하급수적으로 증가)
    const baseExp = 5000;
    const additionalExp = totalExp - baseExp;
    
    let extraLevelIndex = 0;
    let currentExpThreshold = 0;
    let nextStepExp = 1500; // 11레벨 달성에는 1500 필요, 이후 300씩 난이도 상승
    
    while (additionalExp >= currentExpThreshold + nextStepExp) {
      currentExpThreshold += nextStepExp;
      nextStepExp += 300;
      extraLevelIndex++;
    }
    
    const currentLvlNum = 10 + extraLevelIndex;
    const expForCurrent = baseExp + currentExpThreshold;
    const expForNext = baseExp + currentExpThreshold + nextStepExp;
    
    currentLevel = {
      level: currentLvlNum,
      title: `초월 낚시신 ${extraLevelIndex + 1}단계`,
      emoji: '🌌',
      expRequired: expForCurrent,
      color: '#FFD700',
      reward: `초월 ${extraLevelIndex + 1}단계 스페셜 뱃지`
    };
    
    nextLevel = {
      level: currentLvlNum + 1,
      expRequired: expForNext,
    };
  }

  const expInCurrentLevel = totalExp - currentLevel.expRequired;
  const expNeededForNext = nextLevel.expRequired - currentLevel.expRequired;
  const progressPct = Math.min(100, Math.max(0, Math.round((expInCurrentLevel / expNeededForNext) * 100)));

  return {
    ...currentLevel,
    totalExp,
    expInCurrentLevel,
    expNeededForNext,
    progressPct,
    nextLevel,
    isMaxLevel: false, // 만렙 삭제
  };
};

// localStorage 안전 파서 — JSON.parse 실패/localStorage 미지원 환경 대응
function safeParseUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function safeGetTier(parsedUser) {
  try {
    // user.tier와 userTier 키 중 user.tier를 우선하여 불일치 방지
    const fromUser = parsedUser?.tier;
    const fromKey  = localStorage.getItem('userTier');
    return fromUser || fromKey || 'FREE';
  } catch { return 'FREE'; }
}

// ✅ 3RD-C3: safeParseUser() 2회 호출 → 단일 변수 공유
const _initialUser = safeParseUser();

export const useUserStore = create((set, get) => ({
  // 사용자 데이터
  user: _initialUser,

  // 구독 티어 — user.tier와 항상 일치하도록 초기화
  userTier: safeGetTier(_initialUser),

  // ── 기본 유저 업데이트 ──
  updateUser: (newData) => set((state) => {
    const updatedUser = { ...state.user, ...newData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    const newState = { user: updatedUser };
    if (newData.tier) {
      localStorage.setItem('userTier', newData.tier);
      newState.userTier = newData.tier;
    }
    return newState;
  }),

  setUser: (newUser) => set(() => {
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
      if (newUser.tier) localStorage.setItem('userTier', newUser.tier);
      return { user: newUser, userTier: newUser.tier || 'FREE' };
    } else {
      // ENH5-A4: 'token' 키도 정리 — LoginPage에서 저장하는 중복 키 누수 방지
      localStorage.removeItem('user');
      localStorage.removeItem('userTier');
      localStorage.removeItem('token');       // ENH5-A4
      localStorage.removeItem('access_token'); // 토큰도 함께 정리
      localStorage.removeItem('refresh_token');
      return { user: null, userTier: 'FREE' };
    }
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
    const state = get();
    const email = state.user?.email;
    localStorage.removeItem('user');
    localStorage.removeItem('userTier');
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // ✅ WARN-US1: 아바타 캐시 정리 — 다중 계정 사용 기기에서 이전 유저 아바타 노출 방지
    if (email) {
      try { localStorage.removeItem(`avatar_${email}`); } catch (e) {}
    }
    set({ user: null, userTier: 'FREE', lastExpGain: null });
  },

  // ── PRO/VVIP 구독 만료 자동 체크 (앱 시작 시 호출) ──
  checkSubscriptionExpiry: async () => {
    const state = get();
    const userId = state.user?.email || state.user?.id;
    if (!userId) return;
    // MASTER 어드민은 서버 관리자 계정으로 구독 체크 불필요 — ✅ 23TH-C2: 구조분해 제거, 직접 호출로 closure 혼동 방지
    if (get().isAdmin()) return;
    // ✅ BUG-60: 유료 구독자가 아니면 API 호출 불필요
    const paidTiers = ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP'];
    if (!paidTiers.includes(state.userTier)) return;

    try {
      const { default: apiClient } = await import('../api/index');
      const res = await apiClient.get(`/api/payment/subscription/${encodeURIComponent(userId)}`);
      const data = res.data;

      // ✅ 3RD-B3: hasSubscription:false와 status:'failed' 동일 처리 — 단일 분기 통합
      if (!data.hasSubscription || data.status === 'failed') {
        if (!import.meta.env.PROD && data.status === 'failed') {
          console.log(`[구독 만료] ${state.userTier} → FREE (결제실패)`);
        }
        localStorage.setItem('userTier', 'FREE');
        // ✅ 23TH-B1: user.tier와 userTier 동시 갱신 — 불일치로 인한 프리미엄 잠금 해제 버그 방지
        const currentUser = get().user;
        if (currentUser) {
          const updated = { ...currentUser, tier: 'FREE' };
          localStorage.setItem('user', JSON.stringify(updated));
          set({ userTier: 'FREE', user: updated });
        } else {
          set({ userTier: 'FREE' });
        }
        return;
      }
      if (data.status === 'cancelled') {
        const expiry = data.nextBillingDate ? new Date(data.nextBillingDate) : null;
        if (!expiry || expiry < new Date()) {
          localStorage.setItem('userTier', 'FREE');
          // ✅ 23TH-B1: 취소 후 만료 케이스도 user.tier 동시 갱신
          const currentUser = get().user;
          if (currentUser) {
            const updated = { ...currentUser, tier: 'FREE' };
            localStorage.setItem('user', JSON.stringify(updated));
            set({ userTier: 'FREE', user: updated });
          } else {
            set({ userTier: 'FREE' });
          }
          if (!import.meta.env.PROD) console.log(`[구독 만료] ${state.userTier} → FREE (취소 후 기간 종료)`);
        }
      }
    } catch (e) { /* 네트워크 오류 시 무시 */ }
  },

  // ── 서버에서 최신 사용자 정보 동기화 (재로그인 없이 tier/avatar 갱신) ──
  syncFromServer: async () => {
    const state = get();
    const email = state.user?.email;
    // GUEST 또는 미로그인 사용자는 동기화 불필요
    if (!email || state.user?.id === 'GUEST') return;

    try {
      const { default: apiClient } = await import('../api/index');
      const res = await apiClient.get(`/api/user/me?email=${encodeURIComponent(email)}`);
      const fresh = res.data;

      const current = get().user;
      const tierChanged   = fresh.tier   !== (current?.tier   || 'FREE');
      const avatarChanged = fresh.avatar && fresh.avatar !== current?.avatar;

      if (tierChanged || avatarChanged) {
        const updated = { ...current, ...fresh };
        localStorage.setItem('user', JSON.stringify(updated));
        if (fresh.tier) localStorage.setItem('userTier', fresh.tier);
        set({ user: updated, userTier: fresh.tier || get().userTier });
        if (!import.meta.env.PROD) console.log('[syncFromServer] 사용자 정보 갱신:', { tierChanged, avatarChanged });
      }
    } catch (e) { /* 네트워크 오류 시 무시 */ }
  },

  // ── 레벨 정보 헬퍼 ──
  getLevelInfo: () => getLevelInfo(get().user?.totalExp || 0),

  // 마지막 EXP 획득 이벤트 (레벨업 알림 등에 활용)
  lastExpGain: null,
  clearLastExpGain: () => set({ lastExpGain: null }),

  // ── 권한 헬퍼 ──
  // ✅ WARN-US2: name 필드 체크 제거 — 닉네임은 사용자가 직접 설정하므로 위조 가능
  // 어드민 판별은 반드시 id(서버 지정) 또는 email(고유값)만 사용
  // ✅ 3RD-A3: ADMIN_ID/ADMIN_EMAIL 상수 사용 — 5중 코드 중복 통합
  canAccessPremium:      () => {
    const state = get();
    if (state.user?.id === ADMIN_ID || state.user?.email === ADMIN_EMAIL || state.user?.email === 'sunjulab.k@gmail.com') return true;
    return ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'MASTER'].includes(state.userTier);
  },
  // 비즈니스 홍보글 작성: PRO 또는 VVIP만 허용 (Business Lite는 배제)
  canAccessBusinessPromo:() => {
    const state = get();
    if (state.user?.id === ADMIN_ID || state.user?.email === ADMIN_EMAIL) return true;
    return ['PRO', 'BUSINESS_VIP'].includes(state.userTier);
  },
  canAccessBusinessShop: () => {
    const state = get();
    if (state.user?.id === ADMIN_ID || state.user?.email === ADMIN_EMAIL) return true;
    return ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP'].includes(state.userTier);
  },
  canAccessVIP:          () => {
    const state = get();
    if (state.user?.id === ADMIN_ID || state.user?.email === ADMIN_EMAIL) return true;
    return state.userTier === 'BUSINESS_VIP';
  },
  isAdmin: () => {
    const state = get();
    // ✅ FIX-ADMIN: 어드민 판별 3중 보장
    // 1) user.id === 'sunjulab'               (서버가 반환하는 resolved-id)
    // 2) user.email === 'sunjulab.k'          (마스터 계정 이메일)
    // 3) user.email === 'sunjulab.k@gmail.com' (Gmail OAuth)
    // 4) userTier === 'MASTER'                (서버 설정 티어)
    // ⚠️ email===ADMIN_ID 체크 제거 — 'sunjulab' 이메일은 VIP 테스트 계정이므로 제외
    return (
      state.user?.id === ADMIN_ID ||
      state.user?.email === ADMIN_EMAIL ||
      state.user?.email === 'sunjulab.k@gmail.com' ||
      state.userTier === 'MASTER'
    );
  },
}));
