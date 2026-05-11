/**
 * usePayment — 포트원(구 아임포트) V1 기반 결제 유틸
 * KG이니시스 단일 채널 → 카드 + 카카오페이 + 네이버페이 + 토스페이 모두 지원
 *
 * 환경변수:
 *   VITE_PORTONE_MERCHANT_ID  : 포트원 가맹점 식별코드 (imp코드)
 *   VITE_PORTONE_CHANNEL_KEY  : 포트원 채널키
 */

const MERCHANT_ID = import.meta.env.VITE_PORTONE_MERCHANT_ID || 'imp31403032';
const CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY || 'channel-key-7adcd18e-3aa6-4938-8029-48f0f9943d55';

if (import.meta.env.DEV && !import.meta.env.VITE_PORTONE_MERCHANT_ID) {
  console.info('[paymentUtils] 개발 환경: 기본 테스트 결제 ID 사용 중.');
}

/**
 * 결제수단별 표시 설정
 * KG이니시스 단일 채널 → pay_method로 결제창 분기
 */
export const PG_CONFIG = {
  kakao: {
    pay_method: 'kakaopay',
    label:      '카카오페이',
    emoji:      '💛',
    color:      '#FEE500',
    textColor:  '#3C1E1E',
  },
  naver: {
    pay_method: 'naverpay',
    label:      '네이버페이',
    emoji:      '🟢',
    color:      '#03C75A',
    textColor:  '#fff',
  },
  toss: {
    pay_method: 'tosspay',
    label:      '토스페이',
    emoji:      '💙',
    color:      '#0064FF',
    textColor:  '#fff',
  },
  card: {
    pay_method: 'card',
    label:      '신용/체크카드',
    emoji:      '💳',
    color:      '#444',
    textColor:  '#fff',
  },
};

export const PG_OPTIONS = ['kakao', 'naver', 'toss', 'card'];

/**
 * 단건 결제 요청
 * @deprecated 현재 VVIPSubscribe는 requestBillingPayment만 사용
 */
export function requestPayment({ pgKey, planId, planLabel, amount, user }) {
  return new Promise((resolve, reject) => {
    const IMP = window.IMP;
    if (!IMP) { reject(new Error('결제 모듈이 로드되지 않았습니다. 페이지를 새로고침 해주세요.')); return; }
    IMP.init(MERCHANT_ID);

    const uid = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const merchant_uid = `fishing_${planId}_${(user?.email || 'u').replace(/[^a-zA-Z0-9]/g, '')}_${uid}`;
    const cfg = PG_CONFIG[pgKey] || PG_CONFIG.card;

    IMP.request_pay(
      {
        channelKey:    CHANNEL_KEY,          // ✅ pg(deprecated) 대체
        pay_method:    cfg.pay_method,
        merchant_uid,
        name:          `낚시GO ${planLabel} 구독`,
        amount,
        buyer_email:   user?.email || '',
        buyer_name:    user?.name  || '낚시GO 회원',
        buyer_tel:     user?.phone || '01000000000',
        m_redirect_url: window.location.origin + '/vvip-subscribe',
      },
      (rsp) => {
        if (rsp.success) resolve({ imp_uid: rsp.imp_uid, merchant_uid: rsp.merchant_uid });
        else reject(new Error(rsp.error_msg || '결제가 취소되었거나 실패했습니다.'));
      }
    );
  });
}

/**
 * 정기결제 빌링키 등록 + 첫 결제 동시 실행
 * customer_uid를 포트원에 등록 → 이후 서버가 매월 자동 청구
 *
 * @param {object} options
 * @param {string} options.pgKey       - 'kakao' | 'naver' | 'toss' | 'card'
 * @param {string} options.planId      - 'LITE' | 'PRO' | 'VVIP'
 * @param {string} options.planLabel   - 표시 이름
 * @param {number} options.amount      - 첫 결제 금액 (이후 매월 동일)
 * @param {object} options.user        - { name, email, phone }
 * @param {string} [options.harborId]  - VVIP 항구 ID
 * @returns {Promise<{imp_uid, customer_uid, merchant_uid}>}
 */
export function requestBillingPayment({ pgKey, planId, planLabel, amount, user, harborId }) {
  return new Promise((resolve, reject) => {
    const IMP = window.IMP;
    if (!IMP) { reject(new Error('결제 모듈이 로드되지 않았습니다. 페이지를 새로고침 해주세요.')); return; }
    IMP.init(MERCHANT_ID);

    const safeId       = (user?.email || user?.id || 'user').replace(/[^a-zA-Z0-9]/g, '_');
    const safePlanId   = (planId || 'PLAN').replace(/[^a-zA-Z0-9]/g, '_');
    const customer_uid = `fishing_bill_${safeId}_${safePlanId}`;

    const uid = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const merchant_uid = `fishing_first_${planId}_${uid}`;
    const cfg          = PG_CONFIG[pgKey] || PG_CONFIG.card;

    IMP.request_pay(
      {
        channelKey:    CHANNEL_KEY,          // ✅ pg(deprecated) 대체
        pay_method:    cfg.pay_method,
        merchant_uid,
        customer_uid,                        // ← 빌링키 자동 발급
        name:          `낚시GO ${planLabel} 정기구독 (첫 결제)`,
        amount,
        buyer_email:   user?.email || '',
        buyer_name:    user?.name  || '낚시GO 회원',
        buyer_tel:     user?.phone || '01000000000',
        m_redirect_url: window.location.origin + '/vvip-subscribe',
      },
      (rsp) => {
        if (rsp.success) {
          resolve({
            imp_uid:      rsp.imp_uid,
            customer_uid: rsp.customer_uid || customer_uid,
            merchant_uid: rsp.merchant_uid,
          });
        } else {
          reject(new Error(rsp.error_msg || '정기결제 등록이 취소되었거나 실패했습니다.'));
        }
      }
    );
  });
}
