/**
 * GoogleIAPService.js
 * cordova-plugin-purchase v13 기반 구글 플레이 인앱 결제 서비스
 * LITE 플랜(9,900원) 월간 구독 전용
 */

// 구글 플레이 콘솔에 등록한 상품 ID
export const IAP_PRODUCT_ID = 'kr.fishinggo.app.lite_monthly';

let storeInitialized = false;
let _onPurchaseSuccess = null;
let _onPurchaseError   = null;
let _onRestore         = null;

/**
 * 네이티브 플랫폼 여부 확인
 */
function isNative() {
  return !!(window?.Capacitor?.isNativePlatform?.());
}

/**
 * CdvPurchase.store 접근 (window.CdvPurchase.store)
 */
function getStore() {
  return window?.CdvPurchase?.store;
}

/**
 * IAP 스토어 초기화
 * 앱 시작 시 1회 호출. 콜백을 등록한 뒤 initialize()
 * @param {Object} handlers { onSuccess, onError, onRestore }
 */
export async function initIAP({ onSuccess, onError, onRestore } = {}) {
  if (!isNative()) {
    console.log('[IAP] 웹 환경 — IAP 비활성화');
    return;
  }
  if (storeInitialized) return;

  const store = getStore();
  if (!store) {
    console.warn('[IAP] CdvPurchase.store 없음 — 플러그인 로드 실패');
    return;
  }

  _onPurchaseSuccess = onSuccess;
  _onPurchaseError   = onError;
  _onRestore         = onRestore;

  // 상품 등록 (PAID_SUBSCRIPTION = 구글 정기구독)
  store.register([{
    id:       IAP_PRODUCT_ID,
    type:     window.CdvPurchase.ProductType.PAID_SUBSCRIPTION,
    platform: window.CdvPurchase.Platform.GOOGLE_PLAY,
  }]);

  // ── 이벤트 핸들러 ──────────────────────────────────────

  // 영수증 검증 완료 → 승인(finish) + 콜백
  store.when()
    .approved(async (transaction) => {
      try {
        // 서버 영수증 검증
        await verifyReceiptOnServer(transaction);
        transaction.finish();
        _onPurchaseSuccess?.(transaction);
      } catch (err) {
        console.error('[IAP] 영수증 검증 실패:', err);
        _onPurchaseError?.(err);
      }
    })
    .verified((receipt) => {
      // 구독 복원 성공
      _onRestore?.(receipt);
    })
    .error((err) => {
      console.error('[IAP] 스토어 에러:', err);
      _onPurchaseError?.(err);
    });

  // 스토어 초기화 실행
  await store.initialize([window.CdvPurchase.Platform.GOOGLE_PLAY]);
  storeInitialized = true;
  console.log('[IAP] ✅ Google Play Billing 초기화 완료');
}

/**
 * LITE 구독 구매 시작
 */
export async function purchaseLite() {
  if (!isNative()) {
    console.warn('[IAP] 웹 환경에서는 실제 결제 불가');
    throw new Error('NATIVE_ONLY');
  }
  const store = getStore();
  if (!store || !storeInitialized) throw new Error('IAP_NOT_INITIALIZED');

  const product = store.get(IAP_PRODUCT_ID, window.CdvPurchase.Platform.GOOGLE_PLAY);
  if (!product) throw new Error('PRODUCT_NOT_FOUND');

  const offer = product.getOffer();
  if (!offer) throw new Error('OFFER_NOT_FOUND');

  return offer.order();
}

/**
 * 기존 구독 복원 (앱 재설치 등)
 */
export async function restorePurchases() {
  const store = getStore();
  if (!store || !storeInitialized) return;
  await store.restorePurchases();
}

/**
 * 현재 LITE 구독 상태 확인
 * @returns {boolean}
 */
export function isLiteActive() {
  const store = getStore();
  if (!store) return false;
  const product = store.get(IAP_PRODUCT_ID, window.CdvPurchase.Platform.GOOGLE_PLAY);
  return product?.owned ?? false;
}

/**
 * 서버에 구글 영수증 전송 → 검증 후 tier 업데이트
 */
async function verifyReceiptOnServer(transaction) {
  // 구글 플레이 구독 토큰 추출
  const purchaseToken = transaction?.purchaseId
    || transaction?.nativePurchase?.purchaseToken
    || transaction?.transactionId;

  const productId = IAP_PRODUCT_ID;

  const res = await fetch(
    (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/payment/google-iap/verify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ purchaseToken, productId }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '서버 영수증 검증 실패');
  }
  return res.json();
}
