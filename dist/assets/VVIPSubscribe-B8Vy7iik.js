import { u as useUserStore, b as useToastStore, c as apiClient, j as jsxRuntimeExports } from './index-rdBGUi8d.js';
import { r as reactExports } from './vendor-react-BzbiWsGG.js';
import { X, a9 as CheckCircle2, s as Crown, R as RefreshCw, ap as Smartphone, Z as Zap, L as Lock, n as MapPin, a2 as Star } from './vendor-icons-C5BxRig-.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

const IAP_PRODUCTS = {
  BASIC: { id: "kr.fishinggo.app.lite_monthly", type: "PAID_SUBSCRIPTION", price: 9900, label: "BASIC", tier: "BUSINESS_LITE" },
  PRO: { id: "kr.fishinggo.app.pro_monthly", type: "PAID_SUBSCRIPTION", price: 11e4, label: "PRO", tier: "PRO" },
  VVIP: { id: "kr.fishinggo.app.vvip_monthly", type: "PAID_SUBSCRIPTION", price: 55e4, label: "VVIP", tier: "BUSINESS_VIP" }
};
let storeInitialized = false;
let _onPurchaseSuccess = null;
let _onPurchaseError = null;
let _onRestore = null;
function isNative() {
  return !!window?.Capacitor?.isNativePlatform?.();
}
function getStore() {
  return window?.CdvPurchase?.store;
}
function diagnoseIAP() {
  const info = {
    isNative: isNative(),
    CdvPurchaseReady: !!window?.CdvPurchase,
    storeExists: !!getStore(),
    storeInitialized,
    products: {}
  };
  const store = getStore();
  if (store && storeInitialized) {
    Object.entries(IAP_PRODUCTS).forEach(([key, p]) => {
      const sp = store.get(p.id, window.CdvPurchase?.Platform?.GOOGLE_PLAY);
      info.products[key] = sp ? { found: true, state: sp.state, owned: sp.owned } : { found: false };
    });
  }
  console.log("[IAP 진단]", JSON.stringify(info, null, 2));
  return info;
}
async function initIAP({ onSuccess, onError, onRestore } = {}) {
  if (!isNative())
    return;
  if (storeInitialized)
    return;
  const store = getStore();
  if (!store) {
    console.warn("[IAP] ❌ window.CdvPurchase.store 없음 — cordova.js 로드 확인 필요");
    return;
  }
  _onPurchaseSuccess = onSuccess;
  _onPurchaseError = onError;
  _onRestore = onRestore;
  store.register(
    Object.values(IAP_PRODUCTS).map((p) => ({
      id: p.id,
      type: window.CdvPurchase.ProductType.PAID_SUBSCRIPTION,
      platform: window.CdvPurchase.Platform.GOOGLE_PLAY
    }))
  );
  store.when().approved(async (transaction) => {
    try {
      await verifyReceiptOnServer(transaction);
      transaction.finish();
      _onPurchaseSuccess?.(transaction);
    } catch (err) {
      console.error("[IAP] 영수증 검증 실패:", err);
      _onPurchaseError?.(err);
    }
  }).verified((receipt) => {
    _onRestore?.(receipt);
  }).error((err) => {
    console.error("[IAP] 에러:", err);
    _onPurchaseError?.(err);
  });
  try {
    await store.initialize([window.CdvPurchase.Platform.GOOGLE_PLAY]);
    storeInitialized = true;
    console.log("[IAP] ✅ Google Play Billing 초기화 완료 (3개 상품)");
    diagnoseIAP();
  } catch (err) {
    console.error("[IAP] 초기화 실패:", err);
    throw new Error("구글 플레이 결제 모듈 초기화 실패");
  }
}
async function purchasePlan(planKey) {
  if (!isNative())
    throw new Error("NATIVE_ONLY");
  const store = getStore();
  if (!window?.CdvPurchase) {
    throw new Error("결제 플러그인 로드 실패\n앱을 재시작 후 다시 시도해주세요.");
  }
  if (!store) {
    throw new Error("결제 스토어 초기화 실패\n앱을 재시작 후 다시 시도해주세요.");
  }
  if (!storeInitialized) {
    throw new Error("구글 플레이 연결 중입니다.\n잠시 후 다시 시도해주세요.");
  }
  const product = IAP_PRODUCTS[planKey];
  if (!product)
    throw new Error("잘못된 플랜입니다.");
  const storeProduct = store.get(product.id, window.CdvPurchase.Platform.GOOGLE_PLAY);
  if (!storeProduct) {
    console.error("[IAP] 상품 없음:", product.id);
    diagnoseIAP();
    throw new Error(
      `상품을 찾을 수 없습니다.
[${product.id}]

Google Play Console에서
구독 상품이 활성화됐는지 확인해주세요.`
    );
  }
  const offer = storeProduct.getOffer();
  if (!offer) {
    console.error("[IAP] Offer 없음:", product.id, "상태:", storeProduct.state);
    throw new Error(
      `구매 옵션을 불러올 수 없습니다.
상품 상태: ${storeProduct.state}

잠시 후 다시 시도해주세요.`
    );
  }
  console.log("[IAP] 구매 시작:", planKey, product.id);
  return offer.order();
}
async function restorePurchases() {
  const store = getStore();
  if (!store || !storeInitialized)
    return;
  await store.restorePurchases();
}
function isPlanActive(planKey) {
  const store = getStore();
  if (!store)
    return false;
  const product = store.get(IAP_PRODUCTS[planKey]?.id, window.CdvPurchase.Platform.GOOGLE_PLAY);
  return product?.owned ?? false;
}
async function verifyReceiptOnServer(transaction) {
  const productId = transaction?.products?.[0]?.id || transaction?.nativePurchase?.productId || "";
  const purchaseToken = transaction?.purchaseId || transaction?.nativePurchase?.purchaseToken || transaction?.transactionId;
  const res = await fetch(
    "https://fishing-go-backend.onrender.com/api/payment/google-iap/verify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ purchaseToken, productId })
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "서버 검증 실패");
  }
  return res.json();
}

var define_import_meta_env_default = { VITE_API_URL: "https://fishing-go-backend.onrender.com", VITE_PORTONE_MERCHANT_ID: "imp31403032", VITE_PORTONE_CHANNEL_KEY: "channel-key-7adcd18e-3aa6-4938-8029-48f0f9943d55", VITE_KAKAO_APP_KEY: "d353be56977b1c13b03d8981bcf8b5ba", VITE_ADMOB_TESTING: "true", VITE_DISABLE_PWA: "true", VITE_ADSENSE_SLOT_DISPLAY: "4975909941", VITE_ADSENSE_SLOT_INFEED: "8319268904", VITE_TIDE_API_KEY: "2c92debdb84cf6c2ca60816fa5e9acbbfa06a9ae502cc37919ebec6be629623a", VITE_SITE_URL: "https://www.fishing-go.com", BASE_URL: "/", MODE: "production", DEV: false, PROD: true, SSR: false };
const UCB_ENABLED = define_import_meta_env_default.VITE_UCB_ENABLED === "true";
const PAYPLE_PRODUCTS = {
  BASIC: { planId: "BASIC", price: 9900, label: "BASIC 월 구독", period: "월", tier: "BUSINESS_LITE" },
  PRO: { planId: "PRO", price: 11e4, label: "PRO 연간 구독", period: "년", tier: "PRO" },
  VVIP: { planId: "VVIP", price: 55e4, label: "VVIP 월 구독", period: "월", tier: "BUSINESS_VIP" }
};
async function openPayplePayment(planKey, userInfo) {
  if (!UCB_ENABLED) {
    throw new Error("UCB_NOT_ENABLED");
  }
  const product = PAYPLE_PRODUCTS[planKey];
  if (!product)
    throw new Error("INVALID_PLAN");
  const res = await fetch(
    "https://fishing-go-backend.onrender.com/api/payment/payple/request",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        planId: planKey,
        price: product.price,
        goodsName: `낚시GO ${product.label}`,
        email: userInfo.email,
        name: userInfo.name
      })
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "페이플 결제 요청 실패");
  }
  const { paymentUrl, token } = await res.json();
  if (window?.Capacitor?.isNativePlatform?.()) {
    window.open(paymentUrl, "_system");
  } else {
    window.open(paymentUrl, "_blank", "noopener,noreferrer");
  }
  return token;
}

const HARBORS_STATIC = [
  { id: "gangneung", name: "강릉·강문", region: "동해권", area: "강원", desc: "안목·강문항, 감성돔·방어·가자미" },
  { id: "jumunjin", name: "주문진", region: "동해권", area: "강원", desc: "오징어·대구 최대 어항, 야간선상 유명" },
  { id: "sokcho", name: "속초", region: "동해권", area: "강원", desc: "대구·명태·가자미, 동해 북부 거점" },
  { id: "goseong", name: "고성(거진)", region: "동해권", area: "강원", desc: "공현진·거진항, 도루묵·가자미" },
  { id: "yangyang", name: "양양(낙산·남애)", region: "동해권", area: "강원", desc: "낙산·남애·동산항, 연어·명태·방어" },
  { id: "donghae", name: "동해·묵호", region: "동해권", area: "강원", desc: "묵호항, 오징어 야간선상 성지" },
  { id: "samcheok", name: "삼척", region: "동해권", area: "강원", desc: "임원·장호항, 돌돔·열기 청정 어장" },
  { id: "guryongpo", name: "구룡포(포항)", region: "동해권", area: "경북", desc: "구룡포·영일만, 참돔·대게 유명" },
  { id: "gampo", name: "감포(경주)", region: "동해권", area: "경북", desc: "감포·양포, 붉바리·감성돔" },
  { id: "ganggu", name: "강구(영덕)", region: "동해권", area: "경북", desc: "강구항, 대게·문어 선상낚시" },
  { id: "hupo", name: "후포(울진)", region: "동해권", area: "경북", desc: "후포항 일대, 볼락·방어" },
  { id: "jukbyeon", name: "죽변(울진)", region: "동해권", area: "경북", desc: "죽변항, 대구·오징어·가자미" },
  { id: "gijang", name: "기장", region: "남해권", area: "부산", desc: "대변항, 멸치·참돔 최대 어장" },
  { id: "dadaepo", name: "다대포", region: "남해권", area: "부산", desc: "다대포항, 주꾸미·갑오징어" },
  { id: "yongho", name: "용호부두", region: "남해권", area: "부산", desc: "용호부두, 참돔·삼치 루어" },
  { id: "tongyeong", name: "통영", region: "남해권", area: "경남", desc: "한려수도 중심, 섬·선상낚시 천국" },
  { id: "geoje", name: "거제(대포·금포)", region: "남해권", area: "경남", desc: "대포·금포항, 감성돔·참돔 대물" },
  { id: "namhae", name: "남해(미조·상주)", region: "남해권", area: "경남", desc: "미조·상주항, 참돔·삼치·방어" },
  { id: "goseong_s", name: "고성", region: "남해권", area: "경남", desc: "자란만·당항포, 갑오징어·감성돔" },
  { id: "yeosu", name: "여수(국동)", region: "남해권", area: "전남", desc: "돌산·거문도, 붉바리·참돔 대물" },
  { id: "wando", name: "완도", region: "남해권", area: "전남", desc: "보길도·청산도, 돌돔·참돔" },
  { id: "goheung", name: "고흥(나로도)", region: "남해권", area: "전남", desc: "나로도항, 감성돔·참돔" },
  { id: "jindo", name: "진도", region: "남해권", area: "전남", desc: "명량수도, 부시리·방어 시즌" },
  { id: "incheon_n", name: "인천 남항부두", region: "서해권", area: "인천", desc: "남항부두, 우럭·광어 선상 중심지" },
  { id: "incheon_y", name: "인천 연안부두", region: "서해권", area: "인천", desc: "연안부두, 소래·영종도 출항" },
  { id: "taean", name: "태안(안흥·마검포)", region: "서해권", area: "충남", desc: "안흥·마검포항, 주꾸미·꽃게" },
  { id: "boryeong", name: "보령(무창포·오천)", region: "서해권", area: "충남", desc: "무창포·오천항, 광어·우럭" },
  { id: "seosan", name: "서산(삼길포)", region: "서해권", area: "충남", desc: "삼길포항, 광어·도다리" },
  { id: "gunsan", name: "군산(비응·야미도)", region: "서해권", area: "전북", desc: "비응·야미도, 벵에돔·참돔" },
  { id: "buan", name: "부안(격포·위도)", region: "서해권", area: "전북", desc: "격포·위도, 우럭·도다리" },
  { id: "mokpo", name: "목포", region: "서해권", area: "전남", desc: "흑산도·홍도 거점, 참돔·벵에돔" },
  { id: "jeju_dodu", name: "도두항(제주시)", region: "제주권", area: "제주", desc: "도두항, 자리돔·갈치·방어" },
  { id: "jeju_aewol", name: "애월항(제주시)", region: "제주권", area: "제주", desc: "애월항, 다금바리·벵에돔 성지" },
  { id: "seogwipo", name: "서귀포", region: "제주권", area: "제주", desc: "서귀포항, 참돔·방어·다금바리" },
  { id: "mosulpo", name: "모슬포", region: "제주권", area: "제주", desc: "마라도·가파도 거점, 방어·참돔" },
  { id: "sungsan", name: "성산항", region: "제주권", area: "제주", desc: "성산일출봉 인근, 돌돔·감성돔" }
];
const REGION_TABS = ["전체", "동해권", "남해권", "서해권", "제주권"];
const REGION_EMOJI = { "동해권": "🌊", "남해권": "⚓", "서해권": "🦀", "제주권": "🌺" };
const PLANS = [
  {
    key: "BASIC",
    label: "BASIC",
    price: "₩9,900",
    period: "/ 월",
    color: "#C8D400",
    border: "rgba(200,212,0,0.4)",
    bg: "rgba(200,212,0,0.08)",
    tier: "BUSINESS_LITE",
    badge: null,
    features: [
      { icon: "🗺️", text: "비밀 낚시 포인트 25곳" },
      { icon: "📡", text: "실시간 해양 히트맵" },
      { icon: "📹", text: "해안 CCTV 영상" },
      { icon: "⭐", text: "조황 점수 모드" },
      { icon: "🔔", text: "조황 알림 서비스" }
    ]
  },
  {
    key: "PRO",
    label: "PRO",
    price: "₩110,000",
    period: "/ 월",
    color: "#64B5F6",
    border: "rgba(100,181,246,0.4)",
    bg: "rgba(21,101,192,0.08)",
    tier: "PRO",
    badge: "인기",
    features: [
      { icon: "✅", text: "BASIC 전체 포함" },
      { icon: "📢", text: "선상 홍보 게시 작성" },
      { icon: "🔝", text: "커뮤니티 우선 노출" },
      { icon: "📊", text: "조황 보고 무제한" },
      { icon: "🚫", text: "광고 없는 경험" }
    ]
  },
  {
    key: "VVIP",
    label: "VVIP",
    price: "₩550,000",
    period: "/ 월",
    color: "#FFD700",
    border: "rgba(255,215,0,0.4)",
    bg: "rgba(255,215,0,0.05)",
    tier: "BUSINESS_VIP",
    badge: "독점",
    features: [
      { icon: "✅", text: "PRO 전체 포함" },
      { icon: "👑", text: "항구 독점 선점 (1인)" },
      { icon: "📌", text: "선상 최상단 고정" },
      { icon: "🏅", text: "VVIP 전용 배지" }
    ]
  }
];
function VVIPSubscribe() {
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const addToast = useToastStore((s) => s.addToast);
  const [view, setView] = reactExports.useState("plan");
  const [iapReady, setIapReady] = reactExports.useState(false);
  const [loading, setLoading] = reactExports.useState(null);
  const [restoring, setRestoring] = reactExports.useState(false);
  const [payDialog, setPayDialog] = reactExports.useState(null);
  const [takenMap, setTakenMap] = reactExports.useState({});
  const [mySlot, setMySlot] = reactExports.useState(null);
  const [selectedRegion, setSelectedRegion] = reactExports.useState("전체");
  const [selectedHarbor, setSelectedHarbor] = reactExports.useState(null);
  const [showHarborConfirm, setShowHarborConfirm] = reactExports.useState(false);
  const isNative = !!window?.Capacitor?.isNativePlatform?.();
  const currentTier = user?.tier || "FREE";
  const TIER_RANK = { FREE: 0, BUSINESS_LITE: 1, PRO: 2, BUSINESS_VIP: 3, MASTER: 4 };
  const isPlanOwned = (planTier) => (TIER_RANK[currentTier] || 0) >= (TIER_RANK[planTier] || 0);
  reactExports.useEffect(() => {
    if (!isNative)
      return;
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted)
        setIapReady(true);
    }, 3e3);
    initIAP({
      onSuccess: async () => {
        addToast("✅ 구독이 완료되었습니다!", "success");
        try {
          const res = await apiClient.get("/api/user/me");
          if (res.data?.user)
            setUser(res.data.user);
        } catch {
        }
        setLoading(null);
      },
      onError: (err) => {
        if (err?.code !== 6)
          addToast("결제 중 오류가 발생했습니다.", "error");
        setLoading(null);
      }
    }).then(() => {
      if (isMounted)
        setIapReady(true);
    }).catch((err) => {
      console.warn("[IAP] init fail:", err);
      if (isMounted)
        setIapReady(true);
    });
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isNative, addToast, setUser]);
  reactExports.useEffect(() => {
    apiClient.get("/api/vvip/harbors").then((res) => {
      const map = {};
      (res.data.harbors || []).forEach((h) => {
        if (h.isTaken)
          map[h.id] = { takenBy: h.takenBy, expiresAt: h.expiresAt };
      });
      setTakenMap(map);
    }).catch(() => {
    });
    if (user) {
      apiClient.get("/api/vvip/my-slot").then((res) => {
        if (res.data.hasSlot)
          setMySlot({ harborId: res.data.harbor?.id, harborName: res.data.harbor?.name, expiresAt: res.data.slot?.expiresAt });
      }).catch(() => {
      });
    }
  }, [user?.email]);
  reactExports.useEffect(() => {
    if (!user)
      return;
    const id = setInterval(() => {
      apiClient.get("/api/vvip/harbors").then((res) => {
        const map = {};
        (res.data.harbors || []).forEach((h) => {
          if (h.isTaken)
            map[h.id] = { takenBy: h.takenBy };
        });
        setTakenMap(map);
      }).catch(() => {
      });
    }, 3e4);
    return () => clearInterval(id);
  }, [user?.email]);
  const harbors = HARBORS_STATIC.map((h) => ({ ...h, isTaken: !!takenMap[h.id], takenBy: takenMap[h.id]?.takenBy || null, isMyHarbor: mySlot?.harborId === h.id }));
  const filtered = selectedRegion === "전체" ? harbors : harbors.filter((h) => h.region === selectedRegion);
  const availableCount = HARBORS_STATIC.length - Object.keys(takenMap).length;
  const handlePlanClick = reactExports.useCallback((planKey) => {
    if (!user)
      return addToast("로그인이 필요합니다.", "error");
    if (!isNative)
      return addToast("앱에서만 구독 가능합니다.", "info");
    if (UCB_ENABLED) {
      setPayDialog(planKey);
    } else {
      handleIAPPurchase(planKey);
    }
  }, [user, isNative]);
  const handleIAPPurchase = reactExports.useCallback(async (planKey) => {
    setPayDialog(null);
    if (!iapReady)
      return addToast("결제 시스템 준비 중입니다. 잠시 후 다시 시도해주세요.", "info");
    setLoading(planKey);
    try {
      await purchasePlan(planKey);
    } catch (err) {
      if (err?.message !== "NATIVE_ONLY")
        addToast(err?.message || "결제를 시작할 수 없습니다.", "error");
      setLoading(null);
    }
  }, [iapReady]);
  const handlePayplePurchase = reactExports.useCallback(async (planKey) => {
    setPayDialog(null);
    if (!UCB_ENABLED)
      return;
    setLoading(planKey);
    try {
      await openPayplePayment(planKey, { email: user?.email, name: user?.name });
      addToast("웹 브라우저에서 결제를 완료해 주세요.", "info");
    } catch (err) {
      addToast(err?.message || "페이플 결제 오류", "error");
    } finally {
      setLoading(null);
    }
  }, [user]);
  const handleRestore = reactExports.useCallback(async () => {
    setRestoring(true);
    try {
      await restorePurchases();
      addToast("구독 복원을 시도했습니다.", "info");
    } catch {
      addToast("복원 중 오류가 발생했습니다.", "error");
    } finally {
      setRestoring(false);
    }
  }, []);
  const handleSelectHarbor = (harbor) => {
    if (harbor.isTaken && !harbor.isMyHarbor)
      return addToast(`${harbor.name}은 이미 선점된 자리입니다.`, "error");
    if (mySlot && !harbor.isMyHarbor)
      return addToast("이미 다른 항구를 선점 중입니다.", "error");
    setSelectedHarbor(harbor);
    setShowHarborConfirm(true);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#0A0F1C", minHeight: "100dvh", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 40px)" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "rgba(10,15,28,0.97)", padding: "16px 20px", paddingTop: "calc(env(safe-area-inset-top,0px) + 16px)", display: "flex", alignItems: "center", gap: "12px", position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid rgba(200,212,0,0.15)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => view === "harbor" ? setView("plan") : window.history.back(), style: { border: "none", background: "none", padding: 0, cursor: "pointer" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 24, color: "#C8D400" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { style: { fontSize: `calc(17px * var(--fs,1))`, fontWeight: "900", margin: 0, color: "#C8D400" }, children: view === "harbor" ? "👑 VVIP 항구 독점" : "🎣 프리미엄 멤버십" }),
        view === "harbor" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs,1))`, color: "rgba(200,212,0,0.5)", marginTop: "2px" }, children: "← 플랜 선택으로 돌아가기" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "4px 10px", borderRadius: "20px", fontSize: `calc(10px * var(--fs,1))`, fontWeight: "900", background: UCB_ENABLED ? "rgba(0,196,140,0.15)" : "rgba(255,255,255,0.06)", color: UCB_ENABLED ? "#00C48C" : "rgba(255,255,255,0.3)", border: `1px solid ${UCB_ENABLED ? "rgba(0,196,140,0.3)" : "rgba(255,255,255,0.1)"}` }, children: UCB_ENABLED ? "⚡ UCB 활성" : "🔒 UCB 준비중" })
    ] }),
    view === "plan" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "20px 16px 0" }, children: [
      currentTier !== "FREE" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(200,212,0,0.08)", border: "1.5px solid rgba(200,212,0,0.3)", borderRadius: "14px", padding: "12px 16px", marginBottom: "18px", display: "flex", alignItems: "center", gap: "10px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { size: 18, color: "#C8D400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#C8D400", fontWeight: "800", fontSize: `calc(13px * var(--fs,1))` }, children: [
          "현재 등급: ",
          currentTier
        ] })
      ] }),
      PLANS.map((plan) => {
        const owned = isPlanOwned(plan.tier);
        const isLoading = loading === plan.key;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: plan.bg, border: `1.5px solid ${plan.border}`, borderRadius: "20px", padding: "20px", marginBottom: "12px", position: "relative", overflow: "hidden" }, children: [
          plan.badge && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "16px", right: "16px", background: plan.key === "VVIP" ? "linear-gradient(135deg,#FFD700,#FFA000)" : plan.key === "PRO" ? "#1565C0" : "rgba(200,212,0,0.2)", color: plan.key === "VVIP" ? "#5C3A00" : "#fff", fontSize: `calc(10px * var(--fs,1))`, fontWeight: "900", padding: "3px 10px", borderRadius: "12px" }, children: plan.badge }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "44px", height: "44px", background: `linear-gradient(135deg,${plan.color},${plan.color}88)`, borderRadius: "13px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 12px ${plan.color}44` }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { size: 22, color: plan.key === "VVIP" ? "#5C3A00" : "#0A1628" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(16px * var(--fs,1))`, fontWeight: "950", color: plan.color }, children: plan.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "baseline", gap: "3px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(22px * var(--fs,1))`, fontWeight: "950", color: "#fff" }, children: plan.price }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(12px * var(--fs,1))`, color: "rgba(255,255,255,0.4)" }, children: plan.period })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }, children: plan.features.map((f, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "4px 10px", fontSize: `calc(11px * var(--fs,1))`, color: "rgba(255,255,255,0.7)", fontWeight: "700" }, children: [
            f.icon,
            " ",
            f.text
          ] }, i)) }),
          plan.key === "VVIP" && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setView("harbor"), style: { width: "100%", padding: "10px", border: `1px solid ${plan.border}`, borderRadius: "12px", background: "rgba(255,215,0,0.06)", color: "#FFD700", fontWeight: "800", fontSize: `calc(12px * var(--fs,1))`, cursor: "pointer", marginBottom: "8px" }, children: [
            "🏖️ 항구 잔여 현황 보기 (",
            availableCount,
            "/",
            HARBORS_STATIC.length,
            "석)"
          ] }),
          owned ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "100%", padding: "13px", borderRadius: "14px", background: `rgba(${plan.color === "#C8D400" ? "200,212,0" : plan.color === "#64B5F6" ? "100,181,246" : "255,215,0"},0.1)`, border: `1px solid ${plan.border}`, textAlign: "center", color: plan.color, fontWeight: "900", fontSize: `calc(14px * var(--fs,1))` }, children: "✅ 현재 이용 중" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => handlePlanClick(plan.key),
              disabled: isLoading || !isNative && !UCB_ENABLED,
              style: {
                width: "100%",
                padding: "14px",
                borderRadius: "14px",
                border: "none",
                background: isLoading ? `rgba(${plan.color === "#C8D400" ? "200,212,0" : plan.color === "#64B5F6" ? "100,181,246" : "255,215,0"},0.3)` : plan.key === "VVIP" ? "linear-gradient(135deg,#FFD700,#FFA000)" : plan.key === "PRO" ? "linear-gradient(135deg,#64B5F6,#1565C0)" : "linear-gradient(135deg,#C8D400,#a8b200)",
                color: plan.key === "VVIP" ? "#1A1A2E" : plan.key === "BASIC" ? "#0A1628" : "#fff",
                fontSize: `calc(14px * var(--fs,1))`,
                fontWeight: "950",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: `0 4px 16px ${plan.color}33`
              },
              children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 16, style: { animation: "spin 1s linear infinite" } }),
                " 결제 진행 중..."
              ] }) : !isNative ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { size: 16 }),
                " 앱에서만 구독 가능"
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                plan.label,
                " 구독 시작하기"
              ] })
            }
          )
        ] }, plan.key);
      }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: handleRestore, disabled: restoring, style: { width: "100%", padding: "12px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: `calc(13px * var(--fs,1))`, cursor: "pointer", marginTop: "4px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, style: restoring ? { animation: "spin 1s linear infinite" } : {} }),
        restoring ? "복원 중..." : "이전 구독 복원하기"
      ] }),
      !UCB_ENABLED && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "14px 16px", marginBottom: "12px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 14, color: "rgba(255,255,255,0.3)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs,1))`, fontWeight: "800", color: "rgba(255,255,255,0.3)" }, children: "카드/카카오/토스 결제 — 준비중" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(11px * var(--fs,1))`, color: "rgba(255,255,255,0.2)", lineHeight: 1.6 }, children: [
          "현재 구글 플레이 결제만 지원됩니다.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "카드·카카오페이·토스 결제는 곧 업데이트됩니다."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "14px", background: "rgba(255,255,255,0.02)", borderRadius: "14px", marginBottom: "8px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(11px * var(--fs,1))`, color: "rgba(255,255,255,0.25)", lineHeight: 1.7 }, children: [
        "· 구글 플레이 계정으로 자동 결제됩니다.",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "· 다음 결제일 24시간 전까지 구글 플레이에서 해지 가능합니다.",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "· 해지 후에도 기간 만료 전까지 혜택이 유지됩니다.",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "· 구독 문의: fishing.go.kr@gmail.com"
      ] }) })
    ] }),
    view === "harbor" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      mySlot && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { margin: "12px 16px 0", background: "linear-gradient(135deg,#FFD700,#FF9B26)", borderRadius: "18px", padding: "16px 18px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs,1))`, fontWeight: "900", color: "#5C3A00", marginBottom: "3px" }, children: "내 VVIP 독점 항구" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(20px * var(--fs,1))`, fontWeight: "950", color: "#1A1A2E" }, children: [
          "👑 ",
          mySlot.harborName
        ] }),
        mySlot.expiresAt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(11px * var(--fs,1))`, color: "#5C3A00", fontWeight: "700", marginTop: "4px" }, children: [
          "만료: ",
          new Date(mySlot.expiresAt).toLocaleDateString("ko-KR")
        ] })
      ] }),
      !mySlot && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { margin: "12px 16px 0", background: "linear-gradient(135deg,#1A1A2E,#0F3460)", borderRadius: "18px", padding: "18px 20px", color: "#fff" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { size: 28, color: "#FFD700", style: { marginBottom: "8px" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(16px * var(--fs,1))`, fontWeight: "900", marginBottom: "4px" }, children: "항구별 선착순 1명 독점" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(12px * var(--fs,1))`, opacity: 0.75, lineHeight: 1.6, marginBottom: "12px" }, children: [
          "선상 홍보 피드 ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { style: { color: "#FFD700" }, children: "최상단 고정" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "16px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(20px * var(--fs,1))`, fontWeight: "950", color: "#FFD700" }, children: "₩550,000" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs,1))`, opacity: 0.65 }, children: "월 정액" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(20px * var(--fs,1))`, fontWeight: "950", color: availableCount > 0 ? "#00C48C" : "#FF5A5F" }, children: [
              availableCount,
              "석"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs,1))`, opacity: 0.65 }, children: "전국 잔여" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "14px 16px 8px", display: "flex", gap: "8px", overflowX: "auto", scrollbarWidth: "none" }, children: REGION_TABS.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setSelectedRegion(tab), style: { padding: "7px 14px", borderRadius: "20px", fontSize: `calc(13px * var(--fs,1))`, fontWeight: "800", whiteSpace: "nowrap", cursor: "pointer", border: selectedRegion === tab ? "1.5px solid #FFD700" : "1.5px solid rgba(255,255,255,0.1)", background: selectedRegion === tab ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.04)", color: selectedRegion === tab ? "#FFD700" : "rgba(255,255,255,0.5)" }, children: tab === "전체" ? `전체 (${availableCount}석)` : `${REGION_EMOJI[tab]} ${tab}` }, tab)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "0 16px", display: "flex", flexDirection: "column", gap: "8px" }, children: filtered.map((harbor) => {
        const disabled = !harbor.isMyHarbor && (harbor.isTaken || !!mySlot);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            onClick: () => !disabled && handleSelectHarbor(harbor),
            style: { background: harbor.isMyHarbor ? "rgba(255,215,0,0.1)" : disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.06)", border: harbor.isMyHarbor ? "1.5px solid #FFD700" : disabled ? "1px solid rgba(255,255,255,0.06)" : "1.5px solid rgba(255,215,0,0.22)", borderRadius: "16px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "14px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1, transition: "transform 0.15s" },
            onMouseEnter: (e) => {
              if (!disabled)
                e.currentTarget.style.transform = "translateY(-2px)";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.transform = "translateY(0)";
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "44px", height: "44px", borderRadius: "13px", flexShrink: 0, background: harbor.isMyHarbor ? "linear-gradient(135deg,#FFD700,#FF9B26)" : disabled ? "rgba(255,255,255,0.05)" : "rgba(255,215,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }, children: harbor.isMyHarbor ? /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { size: 20, color: "#1A1A2E" }) : disabled ? /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { size: 18, color: "rgba(255,255,255,0.25)" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { size: 20, color: "#FFD700" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px", flexWrap: "wrap" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs,1))`, background: "rgba(255,215,0,0.15)", color: "#FFD700", padding: "2px 7px", borderRadius: "5px", fontWeight: "800" }, children: harbor.area }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(15px * var(--fs,1))`, fontWeight: "900", color: harbor.isMyHarbor ? "#FFD700" : disabled ? "rgba(255,255,255,0.25)" : "#fff" }, children: harbor.name }),
                  harbor.isMyHarbor && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs,1))`, background: "#FFD700", color: "#1A1A2E", padding: "2px 8px", borderRadius: "5px", fontWeight: "900" }, children: "내 자리" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(11px * var(--fs,1))`, color: "rgba(255,255,255,0.4)", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 9, style: { marginRight: "3px", verticalAlign: "middle" } }),
                  harbor.desc
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs,1))`, marginTop: "4px", fontWeight: "700" }, children: harbor.isMyHarbor ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#FFD700", display: "flex", alignItems: "center", gap: "4px" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { size: 11 }),
                  " 독점 활성 중"
                ] }) : harbor.isTaken ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#FF5A5F" }, children: [
                  "🔒 마감 — ",
                  harbor.takenBy,
                  " 선장"
                ] }) : mySlot ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "rgba(255,255,255,0.25)" }, children: "🔒 다른 항구 선점 중" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#00C48C", display: "flex", alignItems: "center", gap: "4px" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { size: 10, fill: "#00C48C" }),
                  " 선착순 구매 가능"
                ] }) })
              ] }),
              !disabled && !harbor.isMyHarbor && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#FFD700", fontSize: `calc(20px * var(--fs,1))`, fontWeight: "900", flexShrink: 0 }, children: "›" })
            ]
          },
          harbor.id
        );
      }) })
    ] }),
    payDialog && UCB_ENABLED && (() => {
      const plan = PLANS.find((p) => p.key === payDialog);
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 9e3, display: "flex", alignItems: "flex-end", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { width: "100%", maxWidth: "480px", background: "linear-gradient(180deg,#1A1A2E,#0A0F1C)", borderRadius: "28px 28px 0 0", padding: "28px 24px 44px", border: "1px solid rgba(200,212,0,0.2)", borderBottom: "none" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "40px", height: "4px", background: "rgba(200,212,0,0.3)", borderRadius: "2px", margin: "0 auto 22px" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", marginBottom: "24px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(15px * var(--fs,1))`, fontWeight: "900", color: "#fff" }, children: "결제 방법을 선택하세요" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(13px * var(--fs,1))`, color: "rgba(255,255,255,0.4)", marginTop: "4px" }, children: [
            plan?.label,
            " ",
            plan?.price,
            plan?.period
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => handleIAPPurchase(payDialog), style: { width: "100%", padding: "16px", borderRadius: "16px", border: "1.5px solid rgba(100,181,246,0.3)", background: "rgba(100,181,246,0.08)", color: "#fff", fontSize: `calc(14px * var(--fs,1))`, fontWeight: "800", cursor: "pointer", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "22px" }, children: "🎮" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "left" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "구글 플레이로 결제" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs,1))`, color: "rgba(255,255,255,0.4)", fontWeight: "600" }, children: "구글 계정 자동결제" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs,1))`, color: "rgba(255,255,255,0.3)", fontWeight: "600" }, children: "수수료 15%" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => handlePayplePurchase(payDialog), style: { width: "100%", padding: "16px", borderRadius: "16px", border: "1.5px solid rgba(200,212,0,0.3)", background: "rgba(200,212,0,0.08)", color: "#fff", fontSize: `calc(14px * var(--fs,1))`, fontWeight: "800", cursor: "pointer", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "22px" }, children: "💳" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "left" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "카드 / 카카오 / 토스로 결제" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs,1))`, color: "rgba(200,212,0,0.6)", fontWeight: "600" }, children: "수수료 절약" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs,1))`, color: "#C8D400", fontWeight: "700" }, children: "수수료 6.5%" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setPayDialog(null), style: { width: "100%", padding: "12px", border: "none", background: "none", color: "rgba(255,255,255,0.3)", fontSize: `calc(14px * var(--fs,1))`, cursor: "pointer" }, children: "취소" })
      ] }) });
    })(),
    showHarborConfirm && selectedHarbor && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", zIndex: 9e3, display: "flex", alignItems: "flex-end", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { width: "100%", maxWidth: "480px", background: "linear-gradient(180deg,#1A1A2E,#0A0F1C)", borderRadius: "28px 28px 0 0", padding: "28px 24px 44px", border: "1px solid rgba(255,215,0,0.2)", borderBottom: "none" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "40px", height: "4px", background: "rgba(255,215,0,0.3)", borderRadius: "2px", margin: "0 auto 22px" } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { size: 40, color: "#FFD700", style: { display: "block", margin: "0 auto 12px" } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontSize: `calc(20px * var(--fs,1))`, fontWeight: "950", color: "#fff", margin: "0 0 4px", textAlign: "center" }, children: selectedHarbor.name }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { fontSize: `calc(12px * var(--fs,1))`, color: "rgba(255,255,255,0.45)", margin: "0 0 20px", textAlign: "center" }, children: [
        selectedHarbor.area,
        " · ",
        REGION_EMOJI[selectedHarbor.region],
        " ",
        selectedHarbor.region
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(12px * var(--fs,1))`, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, background: "rgba(255,215,0,0.06)", borderRadius: "14px", padding: "14px", marginBottom: "18px" }, children: [
        "VVIP 항구 독점 구독은 ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { style: { color: "#FFD700" }, children: "VVIP 구독 후" }),
        " 자동 배정됩니다.",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "VVIP 플랜을 먼저 구독해 주세요."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
        setShowHarborConfirm(false);
        handlePlanClick("VVIP");
      }, style: { width: "100%", padding: "16px", borderRadius: "16px", border: "none", background: "linear-gradient(135deg,#FFD700,#FF9B26)", color: "#1A1A2E", fontSize: `calc(15px * var(--fs,1))`, fontWeight: "950", cursor: "pointer", marginBottom: "10px" }, children: "VVIP 구독하기" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowHarborConfirm(false), style: { width: "100%", padding: "12px", border: "none", background: "none", color: "rgba(255,255,255,0.35)", fontSize: `calc(14px * var(--fs,1))`, cursor: "pointer" }, children: "취소" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }` })
  ] });
}

export { VVIPSubscribe as default };
