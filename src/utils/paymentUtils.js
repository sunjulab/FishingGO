/**
 * usePayment — 포트원(구 아임포트) 기반 결제 유틸
 * 카카오페이 + 토스페이먼츠 + 네이버페이 + 신용카드 동시 지원
 *
 * 환경변수 설정:
 *   VITE_PORTONE_MERCHANT_ID  : 포트원 가맹점 식별코드 (기본: imp00000000 테스트)
 *   VITE_TOSS_PG_CODE         : 토스 PG 코드          (기본: tosspayments 테스트)
 *   VITE_NAVER_PG_CODE        : 네이버페이 PG 코드     (기본: naverpay 테스트)
 *
 * 실서비스 전환 시: .env에 실제 값만 교체하면 됩니다.
 */

const MERCHANT_ID = import.meta.env.VITE_PORTONE_MERCHANT_ID || 'imp00000000';
const TOSS_PG     = import.meta.env.VITE_TOSS_PG_CODE        || 'tosspayments';
const NAVER_PG    = import.meta.env.VITE_NAVER_PG_CODE        || 'naverpay';

/** PG별 설정 */
const PG_CONFIG = {
  kakao: {
    pg:         'kakaopay',
    pay_method: 'card',
    label:      '카카오페이',
    emoji:      '💛',
    color:      '#FEE500',
    textColor:  '#3C1E1E',
  },
  naver: {
    pg:         NAVER_PG,
    pay_method: 'card',
    label:      '네이버페이',
    emoji:      '🟢',
    color:      '#03C75A',
    textColor:  '#fff',
  },
  toss: {
    pg:         TOSS_PG,
    pay_method: 'card',
    label:      '토스페이먼츠',
    emoji:      '💙',
    color:      '#0064FF',
    textColor:  '#fff',
  },
  card: {
    pg:         TOSS_PG,
    pay_method: 'card',
    label:      '신용/체크카드',
    emoji:      '💳',
    color:      '#444',
    textColor:  '#fff',
  },
};

export const PG_OPTIONS = ['kakao', 'naver', 'toss', 'card'];
export { PG_CONFIG };

/**
 * 단건 결제 요청 (기존 방식 — 호환 유지)
 */
export function requestPayment({ pgKey, planId, planLabel, amount, user, harborId }) {
  return new Promise((resolve, reject) => {
    const IMP = window.IMP;
    if (!IMP) { reject(new Error('결제 모듈이 로드되지 않았습니다. 페이지를 새로고침 해주세요.')); return; }
    IMP.init(MERCHANT_ID);
    const rand = Math.random().toString(36).slice(2, 7);
    const merchant_uid = `fishing_${planId}_${(user?.email||'u').replace(/[^a-zA-Z0-9]/g,'')}_${Date.now()}_${rand}`;
    const cfg = PG_CONFIG[pgKey] || PG_CONFIG.toss;
    IMP.request_pay(
      {
        pg: cfg.pg, pay_method: cfg.pay_method, merchant_uid,
        name: `낚시GO ${planLabel} 구독`, amount,
        buyer_email: user?.email || '', buyer_name: user?.name || '낚시GO 회원',
        buyer_tel: user?.phone || '010-0000-0000',
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
 * @param {object} options.user        - { name, email }
 * @param {string} [options.harborId]  - VVIP 항구 ID
 * @returns {Promise<{imp_uid, customer_uid, merchant_uid}>}
 */
export function requestBillingPayment({ pgKey, planId, planLabel, amount, user, harborId }) {
  return new Promise((resolve, reject) => {
    const IMP = window.IMP;
    if (!IMP) { reject(new Error('결제 모듈이 로드되지 않았습니다. 페이지를 새로고침 해주세요.')); return; }
    IMP.init(MERCHANT_ID);

    // customer_uid: 사용자별 고유 빌링키 식별자 (email 기반)
    const safeId      = (user?.email || user?.id || 'user').replace(/[^a-zA-Z0-9]/g, '_');
    const customer_uid = `fishing_bill_${safeId}`;
    const rand = Math.random().toString(36).slice(2, 7);
    const merchant_uid = `fishing_first_${planId}_${Date.now()}_${rand}`;
    const cfg          = PG_CONFIG[pgKey] || PG_CONFIG.toss;

    IMP.request_pay(
      {
        pg:           cfg.pg,
        pay_method:   cfg.pay_method,
        merchant_uid,
        customer_uid, // ← 이 값이 있으면 포트원이 빌링키 자동 발급
        name:         `낚시GO ${planLabel} 정기구독 (첫 결제)`,
        amount,
        buyer_email:  user?.email || '',
        buyer_name:   user?.name  || '낚시GO 회원',
        buyer_tel:    user?.phone || '010-0000-0000',
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
