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
 * 결제 요청
 * @param {object} options
 * @param {string} options.pgKey        - 'kakao' | 'toss' | 'card'
 * @param {string} options.planId       - 'LITE' | 'PRO' | 'VVIP'
 * @param {string} options.planLabel    - 표시용 이름
 * @param {number} options.amount       - 금액 (원)
 * @param {object} options.user         - { name, email }
 * @param {string} [options.harborId]   - VVIP 항구 ID
 * @returns {Promise<{imp_uid, merchant_uid}>}
 */
export function requestPayment({ pgKey, planId, planLabel, amount, user, harborId }) {
  return new Promise((resolve, reject) => {
    const IMP = window.IMP;
    if (!IMP) {
      reject(new Error('결제 모듈이 로드되지 않았습니다. 페이지를 새로고침 해주세요.'));
      return;
    }

    IMP.init(MERCHANT_ID);

    const merchant_uid = `fishing_${planId}_${harborId || 'sub'}_${Date.now()}`;

    const cfg = PG_CONFIG[pgKey] || PG_CONFIG.toss;

    IMP.request_pay(
      {
        pg:           cfg.pg,
        pay_method:   cfg.pay_method,
        merchant_uid,
        name:         `낚시GO ${planLabel} 구독`,
        amount,
        buyer_email:  user?.email  || '',
        buyer_name:   user?.name   || '낚시GO 회원',
        buyer_tel:    user?.phone  || '010-0000-0000',
        m_redirect_url: window.location.origin + '/vvip-subscribe', // 모바일 복귀
      },
      (rsp) => {
        if (rsp.success) {
          resolve({ imp_uid: rsp.imp_uid, merchant_uid: rsp.merchant_uid });
        } else {
          reject(new Error(rsp.error_msg || '결제가 취소되었거나 실패했습니다.'));
        }
      }
    );
  });
}
