/**
 * PaypleService.js
 * 페이플(Payple) UCB 결제 서비스
 *
 * ── 활성화 방법 ──────────────────────────────────────────────────
 * .env 또는 Render 환경변수에 추가:
 *   VITE_UCB_ENABLED=true
 *   VITE_PAYPLE_CST_ID=발급받은_CST_ID
 *   VITE_PAYPLE_CUST_KEY=발급받은_CUST_KEY
 * ────────────────────────────────────────────────────────────────
 */

/** UCB 활성화 여부 (환경변수 1개로 제어) */
export const UCB_ENABLED = import.meta.env.VITE_UCB_ENABLED === 'true';

/** 페이플 상품 정보 */
export const PAYPLE_PRODUCTS = {
  BASIC: { planId: 'BASIC', price: 9900,   label: 'BASIC 월 구독',  period: '월',  tier: 'BUSINESS_LITE' },
  PRO:   { planId: 'PRO',   price: 110000, label: 'PRO 월 구독',   period: '월',  tier: 'PRO'           },
  VVIP:  { planId: 'VVIP',  price: 550000, label: 'VVIP 월 구독',  period: '월',  tier: 'BUSINESS_VIP'  },
};

/**
 * 페이플 결제창 열기
 * @param {'BASIC'|'PRO'|'VVIP'} planKey
 * @param {{ email: string, name: string }} userInfo
 */
export async function openPayplePayment(planKey, userInfo) {
  if (!UCB_ENABLED) {
    throw new Error('UCB_NOT_ENABLED');
  }

  const product = PAYPLE_PRODUCTS[planKey];
  if (!product) throw new Error('INVALID_PLAN');

  // 서버에서 페이플 결제 요청 토큰 발급
  const res = await fetch(
    (import.meta.env.VITE_API_URL || 'https://fishing-go-backend.onrender.com') + '/api/payment/payple/request',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        planId: planKey,
        price: product.price,
        goodsName: `낚시GO ${product.label}`,
        email: userInfo.email,
        name: userInfo.name,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '페이플 결제 요청 실패');
  }

  const { paymentUrl, token } = await res.json();

  // 네이티브: 외부 브라우저 → 결제 완료 후 딥링크 복귀
  // 웹: 새 탭
  if (window?.Capacitor?.isNativePlatform?.()) {
    window.open(paymentUrl, '_system');
  } else {
    window.open(paymentUrl, '_blank', 'noopener,noreferrer');
  }

  return token;
}
