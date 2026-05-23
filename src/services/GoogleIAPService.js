/**
 * GoogleIAPService.js
 * cordova-plugin-purchase v13 — 구글 플레이 인앱결제
 * BASIC(9,900/월) · PRO(110,000/월) · VVIP(550,000/월) 전 플랜 지원
 */

// ── 상품 ID (Google Play Console에 등록된 값과 동일해야 함) ──────
export const IAP_PRODUCTS = {
  BASIC: { id: 'kr.fishinggo.app.lite_monthly',  type: 'PAID_SUBSCRIPTION', price: 9900,   label: 'BASIC', tier: 'BUSINESS_LITE' },
  PRO:   { id: 'kr.fishinggo.app.pro_monthly',   type: 'PAID_SUBSCRIPTION', price: 110000, label: 'PRO',   tier: 'PRO'           },
  VVIP:  { id: 'kr.fishinggo.app.vvip_monthly',  type: 'PAID_SUBSCRIPTION', price: 550000, label: 'VVIP',  tier: 'BUSINESS_VIP'  },
};

let storeInitialized = false;
let _onPurchaseSuccess = null;
let _onPurchaseError   = null;
let _onRestore         = null;

function isNative() {
  return !!(window?.Capacitor?.isNativePlatform?.());
}
function getStore() {
  return window?.CdvPurchase?.store;
}

/**
 * IAP 스토어 초기화 (앱 시작 시 1회)
 */
export async function initIAP({ onSuccess, onError, onRestore } = {}) {
  if (!isNative()) return;
  if (storeInitialized) return;

  const store = getStore();
  if (!store) { console.warn('[IAP] CdvPurchase.store 없음'); return; }

  _onPurchaseSuccess = onSuccess;
  _onPurchaseError   = onError;
  _onRestore         = onRestore;

  // 3개 상품 동시 등록
  store.register(
    Object.values(IAP_PRODUCTS).map(p => ({
      id:       p.id,
      type:     window.CdvPurchase.ProductType.PAID_SUBSCRIPTION,
      platform: window.CdvPurchase.Platform.GOOGLE_PLAY,
    }))
  );

  store.when()
    .approved(async (transaction) => {
      try {
        await verifyReceiptOnServer(transaction);
        transaction.finish();
        _onPurchaseSuccess?.(transaction);
      } catch (err) {
        console.error('[IAP] 영수증 검증 실패:', err);
        _onPurchaseError?.(err);
      }
    })
    .verified((receipt) => { _onRestore?.(receipt); })
    .error((err) => {
      console.error('[IAP] 에러:', err);
      _onPurchaseError?.(err);
    });

  await store.initialize([window.CdvPurchase.Platform.GOOGLE_PLAY]);
  storeInitialized = true;
  console.log('[IAP] ✅ Google Play Billing 초기화 완료 (3개 상품)');
}

/**
 * 플랜별 구매 시작
 * @param {'BASIC'|'PRO'|'VVIP'} planKey
 */
export async function purchasePlan(planKey) {
  if (!isNative()) throw new Error('NATIVE_ONLY');
  const store = getStore();
  if (!store || !storeInitialized) throw new Error('IAP_NOT_INITIALIZED');

  const product = IAP_PRODUCTS[planKey];
  if (!product) throw new Error('INVALID_PLAN');

  const storeProduct = store.get(product.id, window.CdvPurchase.Platform.GOOGLE_PLAY);
  if (!storeProduct) throw new Error('PRODUCT_NOT_FOUND');

  const offer = storeProduct.getOffer();
  if (!offer) throw new Error('OFFER_NOT_FOUND');

  return offer.order();
}

/** 구독 복원 */
export async function restorePurchases() {
  const store = getStore();
  if (!store || !storeInitialized) return;
  await store.restorePurchases();
}

/** 특정 플랜 구독 여부 확인 */
export function isPlanActive(planKey) {
  const store = getStore();
  if (!store) return false;
  const product = store.get(IAP_PRODUCTS[planKey]?.id, window.CdvPurchase.Platform.GOOGLE_PLAY);
  return product?.owned ?? false;
}

/** 서버 영수증 검증 */
async function verifyReceiptOnServer(transaction) {
  // 어떤 상품인지 판별
  const productId = transaction?.products?.[0]?.id
    || transaction?.nativePurchase?.productId
    || '';

  const purchaseToken = transaction?.purchaseId
    || transaction?.nativePurchase?.purchaseToken
    || transaction?.transactionId;

  const res = await fetch(
    (import.meta.env.VITE_API_URL || 'https://fishing-go-backend.onrender.com') + '/api/payment/google-iap/verify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ purchaseToken, productId }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '서버 검증 실패');
  }
  return res.json();
}
