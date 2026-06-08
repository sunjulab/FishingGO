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

/** 🔍 IAP 상태 진단 (디버그용) */
export function diagnoseIAP() {
  const info = {
    isNative:         isNative(),
    CdvPurchaseReady: !!window?.CdvPurchase,
    storeExists:      !!getStore(),
    storeInitialized,
    products:         {},
  };
  const store = getStore();
  if (store && storeInitialized) {
    Object.entries(IAP_PRODUCTS).forEach(([key, p]) => {
      const sp = store.get(p.id, window.CdvPurchase?.Platform?.GOOGLE_PLAY);
      info.products[key] = sp
        ? { found: true, state: sp.state, owned: sp.owned }
        : { found: false };
    });
  }
  console.log('[IAP 진단]', JSON.stringify(info, null, 2));
  return info;
}

/**
 * IAP 스토어 초기화 (앱 시작 시 1회)
 */
export async function initIAP({ onSuccess, onError, onRestore } = {}) {
  if (!isNative()) return;
  if (storeInitialized) return;

  const store = getStore();
  if (!store) {
    console.warn('[IAP] ❌ window.CdvPurchase.store 없음 — cordova.js 로드 확인 필요');
    return;
  }

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

  try {
    await store.initialize([window.CdvPurchase.Platform.GOOGLE_PLAY]);
    storeInitialized = true;
    console.log('[IAP] ✅ Google Play Billing 초기화 완료 (3개 상품)');
    diagnoseIAP(); // 초기화 후 자동 진단
  } catch (err) {
    console.error('[IAP] 초기화 실패:', err);
    throw new Error('구글 플레이 결제 모듈 초기화 실패');
  }
}

/** ✅ IAP 스토어 초기화 완료 여부 (VVIPSubscribe에서 사용) */
export function isStoreReady() {
  return storeInitialized;
}


/**
 * 플랜별 구매 시작
 * @param {'BASIC'|'PRO'|'VVIP'} planKey
 */
export async function purchasePlan(planKey) {
  if (!isNative()) throw new Error('NATIVE_ONLY');

  const store = getStore();

  // ── 상세 에러 메시지 ─────────────────────────────────────────
  if (!window?.CdvPurchase) {
    throw new Error('결제 플러그인 로드 실패\n앱을 재시작 후 다시 시도해주세요.');
  }
  if (!store) {
    throw new Error('결제 스토어 초기화 실패\n앱을 재시작 후 다시 시도해주세요.');
  }
  if (!storeInitialized) {
    throw new Error('구글 플레이 연결 중입니다.\n잠시 후 다시 시도해주세요.');
  }

  const product = IAP_PRODUCTS[planKey];
  if (!product) throw new Error('잘못된 플랜입니다.');

  const storeProduct = store.get(product.id, window.CdvPurchase.Platform.GOOGLE_PLAY);
  if (!storeProduct) {
    // Google Play Console에 상품이 없거나 미활성화 상태
    console.error('[IAP] 상품 없음:', product.id);
    diagnoseIAP();
    throw new Error(
      `상품을 찾을 수 없습니다.\n[${product.id}]\n\nGoogle Play Console에서\n구독 상품이 활성화됐는지 확인해주세요.`
    );
  }

  const offer = storeProduct.getOffer();
  if (!offer) {
    console.error('[IAP] Offer 없음:', product.id, '상태:', storeProduct.state);
    throw new Error(
      `구매 옵션을 불러올 수 없습니다.\n상품 상태: ${storeProduct.state}\n\n잠시 후 다시 시도해주세요.`
    );
  }

  console.log('[IAP] 구매 시작:', planKey, product.id);
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
