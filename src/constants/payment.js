// ✅ NEW-C4: 결제 관련 공유 상수 — AdminDashboard/PaymentHistory 중복 선언 통합
// AdminDashboard는 축약형(SHORT), PaymentHistory는 전체형(FULL) 사용

export const PG_LABEL_SHORT = {
  kakaopay: '💛 카카오',
  naverpay: '🟢 네이버',
  tosspayments: '💙 토스',
  card: '💳 카드',
};

export const PG_LABEL_FULL = {
  kakaopay: '💛 카카오페이',
  naverpay: '🟢 네이버페이',
  tosspayments: '💙 토스페이먼츠',
  card: '💳 카드',
};

// ✅ 4TH-C5: BUSINESS_VIP 키 추가 — useUserStore TIER_CONFIG 키와 동기화 (VVIP는 하위 호환용 유지)
// ✅ 25TH-C4: BUSINESS_LITE 키 추가 — PaymentHistory에서 undefined 표시 버그 수정
export const PLAN_LABEL = {
  LITE: 'LITE 멤버십',
  BUSINESS_LITE: 'LITE 멤버십', // ✅ 25TH-C4: TIER_CONFIG 키 직접 매핑
  PRO: 'PRO 멤버십',
  VVIP: 'VVIP 항구 독점',
  BUSINESS_VIP: 'VVIP 항구 독점', // TIER_CONFIG 키 직접 매핑
};

export const PLAN_COLOR = {
  LITE: '#8E8E93',
  PRO: '#0056D2',
  VVIP: '#FFD700',
  BUSINESS_VIP: '#FFD700', // ✅ 8TH-B4: PLAN_LABEL과 키 동기화 — undefined 반환 버그 해결
};
