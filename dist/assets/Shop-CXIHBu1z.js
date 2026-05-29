import { c as apiClient, j as jsxRuntimeExports } from './index-CUv3Hibb.js';
import { r as reactExports } from './vendor-react-BzbiWsGG.js';
import { S as ShoppingBag, m as Search, X, Z as Zap, V as SlidersHorizontal } from './vendor-icons-C5BxRig-.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

var define_import_meta_env_default = { VITE_API_URL: "https://fishing-go-backend.onrender.com", VITE_PORTONE_MERCHANT_ID: "imp31403032", VITE_PORTONE_CHANNEL_KEY: "channel-key-7adcd18e-3aa6-4938-8029-48f0f9943d55", VITE_KAKAO_APP_KEY: "d353be56977b1c13b03d8981bcf8b5ba", VITE_ADMOB_TESTING: "true", VITE_DISABLE_PWA: "true", VITE_ADSENSE_SLOT_DISPLAY: "4975909941", VITE_ADSENSE_SLOT_INFEED: "8319268904", VITE_TIDE_API_KEY: "2c92debdb84cf6c2ca60816fa5e9acbbfa06a9ae502cc37919ebec6be629623a", VITE_SITE_URL: "https://www.fishing-go.com", BASE_URL: "/", MODE: "production", DEV: false, PROD: true, SSR: false };
const COUPANG_PARTNERS_ID = define_import_meta_env_default.VITE_COUPANG_PARTNERS_ID || "";
const CATEGORIES = [
  { name: "전체", query: "낚시용품", source: "all" },
  { name: "🛒 Coupang", query: "낚시용품", source: "coupang" },
  { name: "💰 AliExpress", query: "소모품", source: "ali" },
  { name: "스피닝릴", query: "스피닝릴", source: "coupang" },
  { name: "루어로드", query: "루어낚시대", source: "coupang" },
  { name: "루어/에기", query: "루어", source: "ali" },
  { name: "채비/바늘", query: "채비", source: "ali" },
  { name: "낚시줄", query: "낚시줄", source: "ali" }
];
const SOURCE_STYLE = {
  coupang: { bg: "#0056D2", text: "#fff", label: "Coupang" },
  ali: { bg: "#FF6900", text: "#fff", label: "AliExpress" }
};
function Shop() {
  const [products, setProducts] = reactExports.useState([]);
  const [promos, setPromos] = reactExports.useState([]);
  const [search, setSearch] = reactExports.useState("");
  const [activeCat, setActiveCat] = reactExports.useState("전체");
  const [loading, setLoading] = reactExports.useState(true);
  const [promoLoading, setPromoLoading] = reactExports.useState(true);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  reactExports.useEffect(() => {
    fetchProducts("낚시용품", "all");
    fetchPromo();
  }, []);
  const fetchProducts = reactExports.useCallback(async (category = "낚시용품", source = "all") => {
    try {
      setLoading(true);
      const res = await apiClient.get(
        `/api/shop/products?category=${encodeURIComponent(category)}&source=${source}`
      );
      setProducts(res.data);
    } catch (err) {
      if (false)
        console.error("[Shop] 상품 로드 실패", err);
    } finally {
      setLoading(false);
    }
  }, []);
  const fetchPromo = reactExports.useCallback(async () => {
    try {
      setPromoLoading(true);
      const res = await apiClient.get("/api/shop/promo");
      setPromos(res.data);
    } catch (err) {
      if (false)
        console.error("[Shop] 특가 로드 실패", err);
    } finally {
      setPromoLoading(false);
    }
  }, []);
  const handleSearchSubmit = (e) => {
    if (e)
      e.preventDefault();
    const q = search.trim();
    if (!q)
      return;
    setSearchQuery(q);
    setActiveCat("");
    fetchProducts(q, "all");
  };
  const clearSearch = () => {
    setSearch("");
    setSearchQuery("");
    setActiveCat("전체");
    fetchProducts("낚시용품", "all");
  };
  const handleCatClick = (cat) => {
    setActiveCat(cat.name);
    setSearchQuery("");
    setSearch("");
    fetchProducts(cat.query, cat.source);
  };
  const handleProductClick = (product) => {
    let url = product.link;
    if (product.source === "coupang" && COUPANG_PARTNERS_ID && url && !url.includes("lptag=")) {
      url = `${url}${url.includes("?") ? "&" : "?"}lptag=${COUPANG_PARTNERS_ID}`;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const gridTitle = searchQuery ? `🔍 "${searchQuery}" 검색결과` : activeCat === "전체" ? "전체 상품 (Coupang + AliExpress)" : `${activeCat} 상품`;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-container", style: { backgroundColor: "#F8F9FA", paddingBottom: "80px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#fff", padding: "10px 16px 8px", position: "sticky", top: "calc(var(--safe-top) + 60px)", zIndex: 100, borderBottom: "1px solid #F0F0F0" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingBag, { size: 16, color: "#0056D2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "950", color: "#1c1c1e", letterSpacing: "-0.03em", margin: 0 }, children: "낚시 장비 쇼핑" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "700", color: "#8E8E93", marginLeft: "auto" }, children: "Coupang + AliExpress 🎣" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSearchSubmit, style: { position: "relative" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            placeholder: "낚시 장비 검색",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            style: { width: "100%", padding: "10px 40px 10px 40px", backgroundColor: "#F2F2F7", border: `1.5px solid ${searchQuery ? "#0056D2" : "transparent"}`, borderRadius: "14px", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 16, color: "#8E8E93", style: { position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" } }),
        (search || searchQuery) && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: clearSearch,
            style: { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "#C7C7CC", border: "none", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 11, color: "#fff", strokeWidth: 3 })
          }
        )
      ] }),
      searchQuery && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: "6px", fontSize: `calc(11px * var(--fs, 1))`, color: "#0056D2", fontWeight: "800", paddingLeft: "4px" }, children: "🔍 Coupang + AliExpress 통합 검색 중" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { backgroundColor: "#fff", padding: "6px 16px 8px", borderBottom: "1px solid #F0F0F0" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px", scrollbarWidth: "none" }, children: CATEGORIES.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        onClick: () => handleCatClick(c),
        style: {
          padding: "6px 12px",
          backgroundColor: activeCat === c.name ? "#1c1c1e" : "#F2F2F7",
          borderRadius: "10px",
          color: activeCat === c.name ? "#fff" : "#8E8E93",
          fontSize: `calc(12px * var(--fs, 1))`,
          fontWeight: "850",
          whiteSpace: "nowrap",
          cursor: "pointer",
          flexShrink: 0
        },
        children: c.name
      },
      c.name
    )) }) }),
    !searchQuery && promos.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "12px 12px 0" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 15, color: "#FF6900", fill: "#FF6900" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: "#1c1c1e" }, children: "AliExpress 오늘 특가 🔥" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "4px" }, children: promoLoading ? [1, 2].map((n) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: "110px", backgroundColor: "#eee", borderRadius: "14px", animation: "pulse 1.5s infinite" } }, n)) : promos.slice(0, 4).map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          onClick: () => handleProductClick(p),
          style: { display: "flex", gap: "8px", alignItems: "center", backgroundColor: "#fff8f3", border: "1px solid #FFE0CC", borderRadius: "14px", padding: "8px", cursor: "pointer" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: p.img, alt: p.name, style: { width: "54px", height: "54px", objectFit: "cover", borderRadius: "10px", flexShrink: 0 } }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(9px * var(--fs, 1))`, color: "#FF6900", fontWeight: "900", marginBottom: "2px" }, children: p.badge }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800", color: "#1c1c1e", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }, children: p.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "baseline", gap: "4px", marginTop: "4px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "950", color: "#FF5A5F" }, children: [
                  p.price,
                  "원"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, color: "#FF6900", fontWeight: "800" }, children: [
                  "(",
                  p.discount,
                  "↓)"
                ] })
              ] })
            ] })
          ]
        },
        p.id
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "12px 12px 0" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", paddingLeft: "4px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "900", color: "#1c1c1e", margin: 0 }, children: gridTitle }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersHorizontal, { size: 15, color: "#8E8E93" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        background: "linear-gradient(135deg, #EEF4FF, #F5F0FF)",
        border: "1px solid #D0DEFF",
        borderRadius: "12px",
        padding: "10px 14px",
        marginBottom: "12px",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "16px", flexShrink: 0 }, children: "💰" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { margin: 0, fontSize: "10px", color: "#4A4A8A", fontWeight: "700", lineHeight: 1.6 }, children: [
          "이 채널의 상품 링크는 ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "쿠팡 파트너스" }),
          " · ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "AliExpress 어필리에이트" }),
          "와 연결되어 있으며, 구매 시 발생하는 소정의 수수료는 ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "낚시GO 서비스 운영" }),
          "에 사용됩니다. 🎣"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }, children: loading ? [1, 2, 3, 4, 5, 6].map((n) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: "180px", backgroundColor: "#eee", borderRadius: "16px", animation: "pulse 1.5s infinite" } }, n)) : products.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px", color: "#8E8E93" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(36px * var(--fs, 1))`, marginBottom: "8px" }, children: "🎣" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "800", color: "#1c1c1e", marginBottom: "4px" }, children: "상품을 불러오지 못했습니다" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))` }, children: "잠시 후 다시 시도해주세요" })
      ] }) : products.map((p) => {
        const srcStyle = SOURCE_STYLE[p.source] || SOURCE_STYLE.coupang;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            onClick: () => handleProductClick(p),
            style: { backgroundColor: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #F2F2F7", cursor: "pointer", position: "relative" },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "6px", right: "6px", backgroundColor: srcStyle.bg, color: srcStyle.text, padding: "2px 5px", borderRadius: "5px", fontSize: `calc(8px * var(--fs, 1))`, fontWeight: "900", zIndex: 2 }, children: srcStyle.label }),
              p.discount && p.discount !== "0%" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "6px", left: "6px", background: "#FF5A5F", color: "#fff", padding: "2px 6px", borderRadius: "6px", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", zIndex: 2 }, children: p.discount }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "relative", width: "100%", aspectRatio: "1/1" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: p.img, alt: p.name || "상품", style: { width: "100%", height: "100%", objectFit: "cover" } }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "8px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(9px * var(--fs, 1))`, color: srcStyle.bg, fontWeight: "900", marginBottom: "2px" }, children: p.badge }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "850", color: "#1c1c1e", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", margin: "0 0 4px" }, children: p.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "baseline", gap: "2px" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "950", color: "#FF5A5F" }, children: p.price }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800", color: "#1c1c1e" }, children: "원" })
                ] }),
                p.source === "ali" && p.commission && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(8px * var(--fs, 1))`, color: "#FF6900", fontWeight: "800", marginTop: "2px" }, children: [
                  "수수료 ",
                  p.commission
                ] })
              ] })
            ]
          },
          p.id
        );
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "24px 24px 0", textAlign: "center" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "100%", height: "1px", backgroundColor: "#F0F0F0", marginBottom: "16px" } }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#bbb", lineHeight: 1.7, fontWeight: "600" }, children: [
        "이 포스팅은 쿠팡 파트너스 및 알리익스프레스 어필리에이트 활동의 일환으로,",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "이에 따른 일정액의 수수료를 제공받을 수 있습니다."
      ] })
    ] })
  ] });
}

export { Shop as default };
