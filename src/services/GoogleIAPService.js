/**
 * GoogleIAPService.js — 100점 완전판
 * cordova-plugin-purchase v13 — 구글 플레이 인앱결제
 * BASIC(9,900/월) · PRO(110,000/월) · VVIP(550,000/월)
 */

// ── 상품 ID (Google Play Console에 등록된 값과 동일) ─────────────
export const IAP_PRODUCTS = {
  BASIC: { id: 'kr.fishinggo.app.lite_monthly',  type: 'PAID_SUBSCRIPTION', price: 9900,   label: 'BASIC', tier: 'BUSINESS_LITE' },
  PRO:   { id: 'kr.fishinggo.app.pro_monthly',   type: 'PAID_SUBSCRIPTION', price: 110000, label: 'PRO',   tier: 'PRO'           },
  VVIP:  { id: 'kr.fishinggo.app.vvip_monthly',  type: 'PAID_SUBSCRIPTION', price: 550000, label: 'VVIP',  tier: 'BUSINESS_VIP'  },
};

// ── 모듈 레벨 상태 ────────────────────────────────────────────────
let storeInitialized       = false; // 초기화 완료 여부
let storeListenersRegistered = false; // 이벤트 리스너 중복 등록 방지
let storeProductsRegistered  = false; // 상품 등록 중복 방지
let _initInProgress        = false; // 동시 초기화 방어 mutex
let _onPurchaseSuccess     = null;
let _onPurchaseError       = null;
let _onRestore             = null;

function isNative() {
  return !!(window?.Capacitor?.isNativePlatform?.());
}
function getStore() {
  return window?.CdvPurchase?.store;
}

// ── 상태 진단 (디버그) ───────────────────────────────────────────
export function diagnoseIAP() {
  const info = {
    isNative:         isNative(),
    CdvPurchaseReady: !!window?.CdvPurchase,
    storeExists:      !!getStore(),
    storeInitialized,
    storeListenersRegistered,
    storeProductsRegistered,
    products: {},
  };
  const store = getStore();
  if (store && storeInitialized) {
    Object.entries(IAP_PRODUCTS).forEach(([key, p]) => {
      const sp = store.get(p.id, window.CdvPurchase?.Platform?.GOOGLE_PLAY);
      info.products[key] = sp
        ? { found: true, state: sp.state, owned: sp.owned, hasOffer: !!sp.getOffer?.() }
        : { found: false };
    });
  }
  console.log('[IAP 진단]', JSON.stringify(info, null, 2));
  return info;
}

// ── 초기화 ───────────────────────────────────────────────────────
export async function initIAP({ onSuccess, onError, onRestore } = {}) {
  if (!isNative()) return;
  if (storeInitialized) return;
  if (_initInProgress) return; // ✅ 동시 호출 방어
  _initInProgress = true;

  try {
    // ① deviceready 대기 (최대 5초)
    if (!window.CdvPurchase) {
      await new Promise((resolve) => {
        const onReady = () => { document.removeEventListener('deviceready', onReady); resolve(); };
        document.addEventListener('deviceready', onReady, { once: true });
        setTimeout(resolve, 5000);
      });
    }

    const store = getStore();
    if (!store) {
      console.warn('[IAP] ❌ window.CdvPurchase.store 없음');
      throw new Error('IAP-ERR-PLUGIN: cordova.js 로드 실패. 앱을 재시작해주세요.');
    }

    // ② 콜백 등록
    _onPurchaseSuccess = onSuccess;
    _onPurchaseError   = onError;
    _onRestore         = onRestore;

    // ③ 상품 등록 (중복 방지)
    if (!storeProductsRegistered) {
      store.register(
        Object.values(IAP_PRODUCTS).map(p => ({
          id:       p.id,
          type:     window.CdvPurchase.ProductType.PAID_SUBSCRIPTION,
          platform: window.CdvPurchase.Platform.GOOGLE_PLAY,
        }))
      );
      storeProductsRegistered = true;
    }

    // ④ 이벤트 리스너 등록 (중복 방지)
    if (!storeListenersRegistered) {
      store.when()
        .approved(async (transaction) => {
          console.log('[IAP] 승인됨:', transaction.transactionId);
          try {
            await verifyReceiptOnServer(transaction);
            transaction.finish();
            _onPurchaseSuccess?.(transaction);
          } catch (err) {
            console.error('[IAP] 영수증 검증 실패:', err);
            // 검증 실패: finish 호출 안함 → 다음 앱 실행 시 재시도
            _onPurchaseError?.(err);
          }
        })
        .verified((receipt) => {
          console.log('[IAP] 검증됨:', receipt);
          _onRestore?.(receipt);
        })
        .error((err) => {
          console.error('[IAP] 스토어 에러:', err);
          _onPurchaseError?.(err);
        });
      storeListenersRegistered = true;
    }

    // ⑤ 스토어 초기화 — IError[] 반환 (throw 안함)
    const initErrors = await store.initialize([window.CdvPurchase.Platform.GOOGLE_PLAY]);
    if (initErrors && initErrors.length > 0) {
      const code = initErrors[0]?.code ?? 'UNKNOWN';
      const msg  = initErrors[0]?.message || '알 수 없는 오류';
      console.error('[IAP] 초기화 오류:', code, msg);
      // ✅ 에러 코드 그대로 전파 → VVIPSubscribe에서 toast에 표시
      throw new Error(`IAP-ERR-${code}: ${msg}`);
    }

    storeInitialized = true;
    console.log('[IAP] ✅ Google Play Billing 초기화 완료');
    diagnoseIAP();

  } catch (err) {
    console.error('[IAP] 초기화 실패:', err?.message || err);
    throw err; // ✅ 원본 에러 그대로 전파
  } finally {
    _initInProgress = false; // ✅ 항상 mutex 해제
  }
}

// ── 상태 조회 ─────────────────────────────────────────────────────
export function isStoreReady() {
  return storeInitialized;
}

// ── 재시도용 상태 초기화 ──────────────────────────────────────────
export function resetIAP() {
  storeInitialized = false;
  // 리스너/상품 등록은 유지 (재시도 시 중복 등록 방지)
}

// ── 구매 시작 ─────────────────────────────────────────────────────
export async function purchasePlan(planKey) {
  if (!isNative()) throw new Error('NATIVE_ONLY');

  const store = getStore();

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

  // ✅ offer.order() IError 반환값 체크 (v13: 에러 시 IError 반환, 성공 시 undefined)
  const orderResult = await offer.order();
  if (orderResult && orderResult.isError) {
    throw new Error(`결제 요청 실패: ${orderResult.message || JSON.stringify(orderResult)}`);
  }
  return orderResult;
}

// ── 구독 복원 ─────────────────────────────────────────────────────
export async function restorePurchases() {
  const store = getStore();
  if (!store || !storeInitialized) return;
  await store.restorePurchases();
}

// ── 특정 플랜 구독 여부 확인 ──────────────────────────────────────
export function isPlanActive(planKey) {
  const store = getStore();
  if (!store) return false;
  const product = store.get(IAP_PRODUCTS[planKey]?.id, window.CdvPurchase.Platform.GOOGLE_PLAY);
  return product?.owned ?? false;
}

// ── 서버 영수증 검증 ──────────────────────────────────────────────
async function verifyReceiptOnServer(transaction) {
  // ✅ v13 정확한 purchaseToken 필드: nativePurchase.purchaseToken (Google Play)
  const purchaseToken =
    transaction?.nativePurchase?.purchaseToken   // ✅ 최우선 (Google Play 정식 필드)
    || transaction?.purchaseId                    // 폴백 1
    || transaction?.transactionId;                // 폴백 2

  const productId =
    transaction?.nativePurchase?.productId        // ✅ 최우선
    || transaction?.products?.[0]?.id             // 폴백
    || '';

  console.log('[IAP] 서버 검증 요청:', { productId, hasToken: !!purchaseToken });

  if (!purchaseToken) {
    throw new Error('purchaseToken 없음 — 영수증 검증 불가');
  }

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
    throw new Error(err.error || `서버 검증 실패 (HTTP ${res.status})`);
  }
  return res.json();
}
