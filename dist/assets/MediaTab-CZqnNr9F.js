import { b as useToastStore, c as apiClient, j as jsxRuntimeExports } from './index-CUv3Hibb.js';
import { r as reactExports, u as useNavigate } from './vendor-react-BzbiWsGG.js';
import { X, P as Play, T as Tv, m as Search, x as Loader2, D as Maximize2, E as UserRound, l as Clock, S as ShoppingBag } from './vendor-icons-C5BxRig-.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

var define_import_meta_env_default = { VITE_API_URL: "https://fishing-go-backend.onrender.com", VITE_PORTONE_MERCHANT_ID: "imp31403032", VITE_PORTONE_CHANNEL_KEY: "channel-key-7adcd18e-3aa6-4938-8029-48f0f9943d55", VITE_KAKAO_APP_KEY: "d353be56977b1c13b03d8981bcf8b5ba", VITE_ADMOB_TESTING: "true", VITE_DISABLE_PWA: "true", VITE_ADSENSE_SLOT_DISPLAY: "4975909941", VITE_ADSENSE_SLOT_INFEED: "8319268904", VITE_TIDE_API_KEY: "2c92debdb84cf6c2ca60816fa5e9acbbfa06a9ae502cc37919ebec6be629623a", VITE_SITE_URL: "https://www.fishing-go.com", BASE_URL: "/", MODE: "production", DEV: false, PROD: true, SSR: false };
const CATEGORIES = ["전체", "루어", "찌낚시", "원투", "선상", "에깅"];
const COUPANG_PID = define_import_meta_env_default.VITE_COUPANG_PARTNERS_ID || "";
const CATEGORY_KEYWORDS = {
  "루어": ["루어낚시", "배스낚시", "루어 낚시"],
  "찌낚시": ["찌낚시", "갯바위 찌낚시", "방파제 찌낚시"],
  "원투": ["원투낚시", "투낚시", "원투 채비"],
  "선상": ["선상낚시", "배낚시", "선상 포인트"],
  "에깅": ["에깅낚시", "쭈꾸미낚시", "갑오징어 에깅"]
};
function VideoCard({ video, onSelect, onNavigate, T }) {
  const isRecent = video.tag === "recent";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card fade-up", style: { marginBottom: "20px", backgroundColor: "#fff", borderRadius: "28px", overflow: "hidden", boxShadow: "0 6px 24px rgba(0,0,0,0.07)" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", paddingTop: "56.25%", backgroundColor: "#000", cursor: "pointer" }, onClick: () => onSelect(video), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`,
          alt: video.title,
          style: { width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 },
          loading: "lazy"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.08)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.95)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(0,0,0,0.25)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { fill: "#0056D2", color: "#0056D2", size: 26 }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", bottom: "10px", right: "10px", backgroundColor: "rgba(0,0,0,0.65)", borderRadius: "8px", padding: "4px 8px", display: "flex", alignItems: "center", gap: "4px", color: "#fff" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Maximize2, { size: 11 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, fontWeight: "900" }, children: "전체화면" })
      ] }),
      video.channelTitle && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "10px", left: "10px", backgroundColor: "rgba(0,86,210,0.85)", borderRadius: "6px", padding: "3px 8px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", color: "#fff" }, children: video.channelTitle }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "10px", right: "10px", backgroundColor: isRecent ? "rgba(52,199,89,0.9)" : "rgba(255,59,48,0.9)", borderRadius: "6px", padding: "3px 7px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, fontWeight: "900", color: "#fff" }, children: isRecent ? "🕐 최신" : "🔥 인기" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "18px 22px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "7px" }, children: [
        video.channelTitle && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "4px", fontSize: `calc(12px * var(--fs, 1))`, color: "#0056D2", fontWeight: "800" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(UserRound, { size: 12 }),
          video.channelTitle
        ] }),
        video.publishedAt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "3px", fontSize: `calc(12px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "700" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 11 }),
          timeAgo(video.publishedAt)
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontSize: `calc(17px * var(--fs, 1))`, fontWeight: "950", color: "#1C1C1E", marginBottom: "7px", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }, children: video.title }),
      video.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "600", marginBottom: "16px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }, children: video.description }),
      video.products?.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { borderTop: "1px solid #F2F2F7", paddingTop: "16px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingBag, { size: 15, color: "#FF5A5F" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "950", color: "#1C1C1E" }, children: [
            "필수 장비 ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#FF5A5F" }, children: video.products.length }),
            "종"
          ] })
        ] }),
        video.products.slice(0, 1).map((item, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#F8F9FA", padding: "10px", borderRadius: "16px", border: "1.5px solid #F2F2F7" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "54px", height: "54px", borderRadius: "12px", overflow: "hidden", flexShrink: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: item.img, alt: item.name || "낚시 장비", style: { width: "100%", height: "100%", objectFit: "cover" } }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: "#1C1C1E", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: item.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "950" }, children: item.price }),
              item.discount && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "900", color: "#FF5A5F", backgroundColor: "rgba(255,90,95,0.1)", padding: "2px 5px", borderRadius: "5px" }, children: [
                item.discount,
                " ↓"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => onNavigate("/shop"), style: { padding: "9px 14px", borderRadius: "12px", backgroundColor: "#0056D2", color: "#fff", border: "none", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "900", cursor: "pointer" }, children: "구매" })
        ] }, idx))
      ] })
    ] })
  ] });
}
function SectionHeader({ icon, title, subtitle, color, T }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", marginTop: "8px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "4px", height: "24px", backgroundColor: color, borderRadius: "2px" } }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(17px * var(--fs, 1))`, fontWeight: "950", color: "#1C1C1E" }, children: [
        icon,
        " ",
        title
      ] }),
      subtitle && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "700", color: "#8E8E93", marginTop: "2px" }, children: subtitle })
    ] })
  ] });
}
function timeAgo(dateStr) {
  if (!dateStr)
    return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1e3);
  if (diff < 60)
    return "방금 전";
  if (diff < 3600)
    return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400)
    return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592e3)
    return `${Math.floor(diff / 86400)}일 전`;
  return `${Math.floor(diff / 2592e3)}개월 전`;
}
function MediaTab() {
  const [activeChip, setActiveChip] = reactExports.useState("전체");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [selectedVideo, setSelectedVideo] = reactExports.useState(null);
  const [recentVideos, setRecentVideos] = reactExports.useState([]);
  const [popularVideos, setPopularVideos] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [searchResults, setSearchResults] = reactExports.useState(null);
  const [searchChannelId, setSearchChannelId] = reactExports.useState(null);
  const seenIds = reactExports.useRef(/* @__PURE__ */ new Set());
  const unifiedCache = reactExports.useRef(/* @__PURE__ */ new Map());
  const CACHE_TTL = 4 * 60 * 60 * 1e3;
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  reactExports.useEffect(() => {
    if (!selectedVideo)
      return;
    const kw = ((selectedVideo.title || "낚시").split(" ")[0].replace(/[^가-힣a-zA-Z0-9]/g, "") || "낚시") + " 낚시";
    apiClient.get(`/api/commerce/coupang/search?keyword=${encodeURIComponent(kw)}${COUPANG_PID ? `&partnersId=${COUPANG_PID}` : ""}`).then((res) => {
      if (res.data.products?.length)
        setSelectedVideo((p) => ({ ...p, products: res.data.products }));
    }).catch(() => {
    });
  }, [selectedVideo?.youtubeId || selectedVideo?.id]);
  reactExports.useEffect(() => {
    loadUnified("전체");
  }, []);
  const loadUnified = reactExports.useCallback(async (chip) => {
    setActiveChip(chip);
    setSearchResults(null);
    setLoading(true);
    seenIds.current.clear();
    const q = chip === "전체" ? "낚시" : CATEGORY_KEYWORDS[chip]?.[0] || chip + "낚시";
    const cacheKey = `unified:${q}`;
    if (unifiedCache.current.has(cacheKey)) {
      const entry = unifiedCache.current.get(cacheKey);
      if (Date.now() - entry.ts < CACHE_TTL) {
        setRecentVideos(entry.recent);
        setPopularVideos(entry.popular);
        setLoading(false);
        return;
      }
      unifiedCache.current.delete(cacheKey);
    }
    try {
      const res = await apiClient.get(`/api/media/youtube/unified?q=${encodeURIComponent(q)}`);
      if (res.data.error) {
        addToast(`YouTube API 오류: ${res.data.error}`, "error");
        setRecentVideos([]);
        setPopularVideos([]);
      } else {
        const recent = res.data.recent || [];
        const popular = res.data.popular || [];
        setRecentVideos(recent);
        setPopularVideos(popular);
        unifiedCache.current.set(cacheKey, { recent, popular, ts: Date.now() });
      }
    } catch (e) {
      addToast("YouTube 영상 로드 실패: " + (e.message || "연결 오류"), "error");
      setRecentVideos([]);
      setPopularVideos([]);
    }
    setLoading(false);
  }, []);
  const handleSearch = async (e) => {
    if (e.key !== "Enter")
      return;
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      setSearchChannelId(null);
      return loadUnified(activeChip);
    }
    setLoading(true);
    setSearchResults([]);
    setSearchChannelId(null);
    try {
      const res = await apiClient.get(`/api/media/youtube/search?q=${encodeURIComponent(q)}&order=date&maxResults=15`);
      if (res.data.error) {
        addToast(`검색 오류: ${res.data.error}`, "error");
        setSearchResults([]);
      } else {
        const raw = res.data.videos || [];
        const sorted = [...raw].sort((a, b) => {
          const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return tb - ta;
        });
        setSearchResults(sorted);
        setSearchChannelId(res.data.channelId || null);
      }
    } catch (err) {
      if (err.response?.status === 429 || err.response?.status === 403) {
        addToast("YouTube API 쿼터를 초과했습니다. 잠시 후 다시 시도해주세요. 🐟", "warning");
      } else {
        addToast("검색 실패: " + (err.message || "연결 오류"), "error");
      }
      setSearchResults([]);
    }
    setLoading(false);
  };
  const handleChipClick = (chip) => {
    loadUnified(chip);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-container", style: { backgroundColor: "#F2F2F7", overflowX: "hidden" }, children: [
    selectedVideo && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#000", zIndex: 9999, display: "flex", flexDirection: "column" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", top: 0, left: 0, right: 0, padding: "24px 20px", paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10001, background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#fff", flex: 1, paddingRight: "12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "800", color: "#60a5fa", marginBottom: "4px" }, children: selectedVideo.channelTitle }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "900" }, children: selectedVideo.title })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setSelectedVideo(null), style: { backgroundColor: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 22 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "iframe",
          {
            style: { width: "100vw", height: "56.25vw", maxHeight: "85vh", border: "none" },
            src: `https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0`,
            allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
            allowFullScreen: true
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => window.open(`https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`, "_blank"),
            style: { marginTop: "14px", padding: "10px 20px", borderRadius: "24px", backgroundColor: "#FF0000", color: "#fff", border: "none", display: "flex", alignItems: "center", gap: "8px", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer" },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { size: 14, fill: "#fff" }),
              " YouTube에서 보기"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "20px", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)", background: "linear-gradient(to top, rgba(0,0,0,1), transparent)", display: "flex", alignItems: "center", gap: "16px", color: "#fff" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, opacity: 0.7 }, children: "이 기술에 필요한 장비" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "900" }, children: [
            selectedVideo.products?.[0]?.name || "관련 장비",
            " 외"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => navigate("/shop"), style: { backgroundColor: "#0056D2", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "14px", fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "900", whiteSpace: "nowrap" }, children: "쇼핑하기" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#fff", padding: "30px 20px 10px", borderBottom: "1px solid #E5E5EA" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "8px", backgroundColor: "#0056D2", borderRadius: "14px", color: "#fff" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Tv, { size: 22 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { style: { fontSize: `calc(24px * var(--fs, 1))`, fontWeight: "950", color: "#1C1C1E", margin: 0 }, children: "낚시채널" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "5px", alignItems: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", backgroundColor: "rgba(52,199,89,0.15)", color: "#34C759", padding: "4px 8px", borderRadius: "8px" }, children: "🕐 최신" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", backgroundColor: "rgba(255,59,48,0.12)", color: "#FF3B30", padding: "4px 8px", borderRadius: "8px" }, children: "🔥 인기" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "700" }, children: "📅 이번 주 최신 + 🔥 이달의 인기 · 2분 이상 영상" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", marginBottom: "16px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { style: { position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#8E8E93" }, size: 18 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            placeholder: "검색어 입력 후 Enter (예: 돌돔 낚시)",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            onKeyDown: handleSearch,
            style: { width: "100%", padding: "16px 16px 16px 48px", backgroundColor: "#F2F2F7", border: "none", borderRadius: "18px", fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "700", outline: "none", boxSizing: "border-box" }
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { backgroundColor: "#fff", padding: "0 0 14px", borderBottom: "1px solid #E5E5EA", position: "sticky", top: "calc(var(--safe-top) + 60px)", zIndex: 100 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", overflowX: "auto", gap: "8px", padding: "12px 20px 0", scrollbarWidth: "none" }, children: CATEGORIES.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleChipClick(c), style: { padding: "10px 20px", borderRadius: "20px", border: "none", fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "800", backgroundColor: activeChip === c ? "#0056D2" : "#F2F2F7", color: activeChip === c ? "#fff" : "#8E8E93", whiteSpace: "nowrap", transition: "all 0.2s", cursor: "pointer" }, children: c }, c)) }) }),
    loading && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 0", gap: "14px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 32, style: { animation: "spin 0.8s linear infinite" }, color: "#0056D2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "700", color: "#8E8E93" }, children: "최신 + 인기 낚시 영상 불러오는 중... 🐟" })
    ] }),
    !loading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "16px", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)" }, children: searchResults !== null ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SectionHeader,
        {
          icon: searchChannelId ? "📺" : "🔍",
          title: searchChannelId ? `${searchQuery} 유튜브 채널` : "검색 결과",
          subtitle: searchChannelId ? `이 채널 전용 영상 ${searchResults.length}개 · 2분 이상` : `"${searchQuery}" 결과 ${searchResults.length}개 · 2분 이상`,
          color: searchChannelId ? "#FF0000" : "#0056D2"
        }
      ),
      searchResults.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "40px 0", color: "#8E8E93" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(36px * var(--fs, 1))`, marginBottom: "12px" }, children: "🎣" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "800" }, children: "검색 결과가 없습니다" })
      ] }),
      searchResults.map((v) => /* @__PURE__ */ jsxRuntimeExports.jsx(VideoCard, { video: { ...v, tag: "recent" }, onSelect: setSelectedVideo, onNavigate: navigate }, v.youtubeId))
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      recentVideos.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "🕐", title: "이번 주 업로드", subtitle: "최근 7일 · 2분 이상 낚시 영상", color: "#34C759" }),
        recentVideos.map((v) => /* @__PURE__ */ jsxRuntimeExports.jsx(VideoCard, { video: v, onSelect: setSelectedVideo, onNavigate: navigate }, v.youtubeId))
      ] }),
      popularVideos.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: recentVideos.length > 0 ? "8px" : "0" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "🔥", title: "이달의 인기 낚시 영상", subtitle: "최근 1개월 최고 조회수 · 2분 이상", color: "#FF3B30" }),
        popularVideos.map((v) => /* @__PURE__ */ jsxRuntimeExports.jsx(VideoCard, { video: v, onSelect: setSelectedVideo, onNavigate: navigate }, v.youtubeId))
      ] }),
      recentVideos.length === 0 && popularVideos.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "60px 20px", color: "#8E8E93" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(48px * var(--fs, 1))`, marginBottom: "16px" }, children: "🎣" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "800", marginBottom: "8px", color: "#1C1C1E" }, children: "영상을 불러오는 중입니다" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "600" }, children: "잠시 후 다시 시도해주세요" })
      ] })
    ] }) })
  ] });
}

export { MediaTab as default };
