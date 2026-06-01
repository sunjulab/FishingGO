function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/CatchRankingPage-D1aFcxHc.js","assets/index-C2ieaxTI.js","assets/vendor-react-BzbiWsGG.js","assets/vendor-icons-C5BxRig-.js","assets/vendor-store-DFdRS9Cc.js","assets/vendor-http-ChhVHlBG.js","assets/vendor-socket-FPM1Bwz4.js","assets/index-DKFtvhIq.css","assets/fishRules-C-ea2o-Y.js","assets/AdUnit-B8AAt_Ku.js","assets/AdSenseAd-BKj4OeVC.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
import { r as reactExports, u as useNavigate, b as useLocation, R as React, _ as __vitePreload } from './vendor-react-BzbiWsGG.js';
import { j as jsxRuntimeExports, u as useUserStore, A as ADMIN_ID, a as ADMIN_EMAIL, b as useToastStore, c as apiClient } from './index-C2ieaxTI.js';
import { G as Pen, u as Trash2, J as Heart, h as MessageSquare, K as Share2, U as Users, L as Lock, N as Award, O as Phone, Q as PlusCircle, X, k as Send } from './vendor-icons-C5BxRig-.js';
import { N as NativeAd } from './AdUnit-B8AAt_Ku.js';
import { A as AdSenseDisplay, a as AdSenseInFeed } from './AdSenseAd-BKj4OeVC.js';
import { I as ImageGallery } from './ImageGallery-BLN2ACrS.js';
import { l as lookup } from './vendor-socket-FPM1Bwz4.js';
import { s as shareExternal } from './shareUtils-C91mtvog.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';

function SkeletonCard({ count = 5 }) {
  const items = reactExports.useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: items.map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "fade-in",
      style: {
        background: "#fff",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "12px", marginBottom: "16px", alignItems: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton", style: { width: 44, height: 44, borderRadius: "12px", flexShrink: 0 } }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton", style: { height: 13, width: "45%", borderRadius: 6, marginBottom: 8 } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton", style: { height: 10, width: "28%", borderRadius: 6 } })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton", style: { width: 52, height: 24, borderRadius: 8 } })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton", style: { height: 13, width: "100%", borderRadius: 6, marginBottom: 7 } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton", style: { height: 13, width: "88%", borderRadius: 6, marginBottom: 7 } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton", style: { height: 13, width: "65%", borderRadius: 6, marginBottom: 14 } }),
        i % 3 === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton", style: { height: 160, width: "100%", borderRadius: 12, marginBottom: 14 } }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton", style: { height: 28, width: 60, borderRadius: 8 } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton", style: { height: 28, width: 60, borderRadius: 8 } })
        ] })
      ]
    },
    `skeleton-${i}`
  )) });
}

function StorySlider({ stories = [], onAddStory, onViewStory }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
    display: "flex",
    gap: "14px",
    overflowX: "auto",
    padding: "14px 16px 10px",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    borderBottom: "1px solid #F2F2F7",
    backgroundColor: "#fff",
    marginBottom: "4px"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        onClick: onAddStory,
        style: { flexShrink: 0, textAlign: "center", cursor: "pointer", minWidth: "58px" },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            width: "58px",
            height: "58px",
            borderRadius: "50%",
            border: "2px dashed #0056D2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `calc(26px * var(--fs, 1))`,
            background: "#EEF4FF",
            margin: "0 auto"
          }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#0056D2", fontWeight: "900", fontSize: `calc(24px * var(--fs, 1))`, lineHeight: 1 }, children: "+" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, marginTop: "5px", color: "#0056D2", fontWeight: "800" }, children: "오늘 조황" })
        ]
      }
    ),
    stories.map((story) => {
      const storyId = String(story._id || story.id);
      const hoursLeft = story.expiresAt ? Math.max(0, Math.round((new Date(story.expiresAt) - Date.now()) / 36e5)) : 24;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          onClick: () => onViewStory?.(story),
          style: { flexShrink: 0, textAlign: "center", cursor: "pointer", minWidth: "58px" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
              width: "58px",
              height: "58px",
              borderRadius: "50%",
              overflow: "hidden",
              margin: "0 auto",
              padding: "2.5px",
              background: "linear-gradient(135deg, #FF5A5F, #FF9B26)"
            }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", border: "2px solid #fff" }, children: story.image ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: story.image,
                alt: story.author,
                loading: "lazy",
                style: { width: "100%", height: "100%", objectFit: "cover" }
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
              width: "100%",
              height: "100%",
              background: "#F2F2F7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: `calc(20px * var(--fs, 1))`,
              fontWeight: "900",
              color: "#0056D2"
            }, children: story.author?.charAt(0) || "?" }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
              fontSize: `calc(10px * var(--fs, 1))`,
              marginTop: "5px",
              color: "#1c1c1e",
              fontWeight: "700",
              maxWidth: "58px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }, children: story.author }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(9px * var(--fs, 1))`, color: "#aaa", marginTop: "1px" }, children: [
              hoursLeft,
              "h"
            ] })
          ]
        },
        storyId
      );
    })
  ] });
}

const CatchRankingPage = reactExports.lazy(() => __vitePreload(() => import('./CatchRankingPage-D1aFcxHc.js'),true?__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10]):void 0));
const SOCKET_URL = "https://fishing-go-backend.onrender.com";
let _communityCache = { business: [], crews: [], notices: [], stories: [] };
function InFeedAd() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AdSenseInFeed, { style: { marginBottom: "12px", borderRadius: "12px", overflow: "hidden" } });
}
const OPEN_CATEGORIES = ["전체", "루어", "찌낚시", "원투", "릴찌", "선상", "에깅", "조황 공유"];
const HARBOR_DATA = [
  { region: "강원", emoji: "🏔️", harbors: [
    { label: "강릉·강문", key: "강원 강릉" },
    { label: "주문진", key: "강원 주문진" },
    { label: "속초", key: "강원 속초" },
    { label: "고성(거진)", key: "강원 고성" },
    { label: "양양(낙산·남애)", key: "강원 양양" },
    { label: "동해·묵호", key: "강원 동해" },
    { label: "삼척", key: "강원 삼척" }
  ] },
  { region: "경북", emoji: "🎭", harbors: [
    { label: "구룡포(포항)", key: "경북 구룡포" },
    { label: "감포(경주)", key: "경북 감포" },
    { label: "강구(영덕)", key: "경북 강구" },
    { label: "후포(울진)", key: "경북 후포" },
    { label: "죽변(울진)", key: "경북 죽변" }
  ] },
  { region: "경남", emoji: "🧭", harbors: [
    { label: "통영", key: "경남 통영" },
    { label: "거제(대포·금포)", key: "경남 거제" },
    { label: "남해(미조·상주)", key: "경남 남해" },
    { label: "고성", key: "경남 고성" }
  ] },
  { region: "전남", emoji: "🌺", harbors: [
    { label: "여수(국동)", key: "전남 여수" },
    { label: "목포", key: "전남 목포" },
    { label: "완도", key: "전남 완도" },
    { label: "고흥(나로도)", key: "전남 고흥" },
    { label: "진도", key: "전남 진도" }
  ] },
  { region: "전북", emoji: "🌾", harbors: [
    { label: "군산(비응·야미도)", key: "전북 군산" },
    { label: "부안(격포·위도)", key: "전북 부안" }
  ] },
  { region: "충남", emoji: "🌻", harbors: [
    { label: "태안(안흥·마검포)", key: "충남 태안" },
    { label: "보령(무창포·오천)", key: "충남 보령" },
    { label: "서산(삼길포)", key: "충남 서산" }
  ] },
  { region: "인천", emoji: "⛵", harbors: [
    { label: "남항부두", key: "인천 남항부두" },
    { label: "연안부두", key: "인천 연안부두" }
  ] },
  { region: "부산", emoji: "🏙️", harbors: [
    { label: "기장", key: "부산 기장" },
    { label: "다대포", key: "부산 다대포" },
    { label: "용호부두", key: "부산 용호부두" }
  ] },
  { region: "제주", emoji: "🌴", harbors: [
    { label: "도두항", key: "제주 도두항" },
    { label: "애월항", key: "제주 애월항" },
    { label: "서귀포", key: "제주 서귀포" },
    { label: "모슬포", key: "제주 모슬포" },
    { label: "성산항", key: "제주 성산항" }
  ] }
];
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = reactExports.useState(value);
  reactExports.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
function CommunityTab() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = reactExports.useState(() => {
    const rt = sessionStorage.getItem("community_return_tab");
    if (rt)
      sessionStorage.removeItem("community_return_tab");
    return rt || "business";
  });
  const [highlightedPostId, setHighlightedPostId] = reactExports.useState(null);
  const sentinelRef = reactExports.useRef(null);
  const likeTimerRef = reactExports.useRef({});
  const nativeAdSlotMapRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const scrollToPostIdRef = reactExports.useRef(null);
  const lastTapRef = reactExports.useRef({});
  const [heartBurstId, setHeartBurstId] = reactExports.useState(null);
  reactExports.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    const postId = params.get("postId");
    if (tab)
      setActiveTab(tab);
    if (postId) {
      setHighlightedPostId(postId);
      const scrollTimer = setTimeout(() => {
        const el = document.getElementById(`post-${postId}`);
        if (el)
          el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 350);
      const clearTimer = setTimeout(() => setHighlightedPostId(null), 2850);
      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [location.search]);
  reactExports.useEffect(() => {
    const returnId = sessionStorage.getItem("community_return_post_id");
    if (returnId) {
      scrollToPostIdRef.current = returnId;
      sessionStorage.removeItem("community_return_post_id");
    }
  }, []);
  const userTier = useUserStore((state) => state.userTier);
  const user = useUserStore((state) => state.user);
  const canAccessPremium = reactExports.useMemo(() => {
    if (user?.id === ADMIN_ID || user?.email === ADMIN_EMAIL || user?.email === ADMIN_ID)
      return true;
    return ["BUSINESS_LITE", "PRO", "BUSINESS_VIP", "MASTER"].includes(userTier);
  }, [userTier, user?.id, user?.email]);
  const canAccessBusinessPromo = reactExports.useMemo(() => {
    if (user?.id === ADMIN_ID || user?.email === ADMIN_EMAIL || user?.email === ADMIN_ID)
      return true;
    return ["PRO", "BUSINESS_VIP", "MASTER"].includes(userTier);
  }, [userTier, user?.id, user?.email]);
  const isAdmin = useUserStore(
    (s) => s.user?.id === ADMIN_ID || s.user?.email === ADMIN_EMAIL || s.user?.email === ADMIN_ID || s.userTier === "MASTER"
  );
  const addToast = useToastStore((state) => state.addToast);
  const [posts, setPosts] = reactExports.useState([]);
  const [likedPosts, setLikedPosts] = reactExports.useState(() => {
    try {
      return JSON.parse(localStorage.getItem("community_liked_posts") || "{}");
    } catch {
      return {};
    }
  });
  const [likeAnimating, setLikeAnimating] = reactExports.useState({});
  const [openCategory, setOpenCategory] = reactExports.useState("전체");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [page, setPage] = reactExports.useState(1);
  const [totalPages, setTotalPages] = reactExports.useState(1);
  const [loadingMore, setLoadingMore] = reactExports.useState(false);
  const [viewMode, setViewMode] = reactExports.useState("feed");
  const [sortMode, setSortMode] = reactExports.useState("latest");
  const [expandedPostId, setExpandedPostId] = reactExports.useState(null);
  const [slideIndexMap, setSlideIndexMap] = reactExports.useState({});
  const [shareModal, setShareModal] = reactExports.useState(null);
  const [myCrews, setMyCrews] = reactExports.useState([]);
  const [shareTarget, setShareTarget] = reactExports.useState(null);
  const [sharing, setSharing] = reactExports.useState(false);
  const shareSockets = reactExports.useRef({});
  const slideStartXRef = reactExports.useRef({});
  const slideWrapperRefs = reactExports.useRef(/* @__PURE__ */ new Map());
  const [commentInputMap, setCommentInputMap] = reactExports.useState({});
  const [commentOpenMap, setCommentOpenMap] = reactExports.useState({});
  const [commentSubmittingMap, setCommentSubmittingMap] = reactExports.useState({});
  const [stories, setStories] = reactExports.useState(_communityCache.stories);
  const [storyViewer, setStoryViewer] = reactExports.useState(null);
  const [crewPassModal, setCrewPassModal] = reactExports.useState(null);
  const [crewPassInput, setCrewPassInput] = reactExports.useState("");
  const [crewPassLoading, setCrewPassLoading] = reactExports.useState(false);
  const [crews, setCrews] = reactExports.useState(_communityCache.crews);
  const [myCrewIds, setMyCrewIds] = reactExports.useState(/* @__PURE__ */ new Set());
  const [crewSearch, setCrewSearch] = reactExports.useState("");
  const [businessPosts, setBusinessPosts] = reactExports.useState(_communityCache.business);
  const [selectedBusinessRegion, setSelectedBusinessRegion] = reactExports.useState("전체");
  const [selectedHarbor, setSelectedHarbor] = reactExports.useState("");
  const [selectedBusinessPost, setSelectedBusinessPost] = reactExports.useState(null);
  const [businessSearchQuery, setBusinessSearchQuery] = reactExports.useState("");
  const effectiveBusinessPosts = reactExports.useMemo(() => {
    const now = /* @__PURE__ */ new Date();
    const withPinCheck = businessPosts.map((post) => {
      if (post.isPinned && post.expiresAt && new Date(post.expiresAt) < now) {
        return { ...post, isPinned: false, _expired: true };
      }
      return post;
    }).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    const q = businessSearchQuery.trim().toLowerCase();
    const searchFiltered = q ? withPinCheck.filter(
      (p) => (p.region || "").toLowerCase().includes(q) || (p.shipName || "").toLowerCase().includes(q) || (p.target || "").toLowerCase().includes(q) || (p.content || "").toLowerCase().includes(q)
    ) : withPinCheck;
    if (selectedBusinessRegion === "전체") {
      const base = !selectedHarbor ? searchFiltered : searchFiltered.filter((p) => (p.region || "") === selectedHarbor);
      return base;
    }
    const byRegion = searchFiltered.filter(
      (p) => p.region !== "전국 (전체)" && (p.region || "").startsWith(selectedBusinessRegion)
    );
    if (!selectedHarbor)
      return byRegion;
    return byRegion.filter((p) => (p.region || "").startsWith(selectedHarbor));
  }, [businessPosts, selectedBusinessRegion, selectedHarbor, businessSearchQuery]);
  const currentHarbors = reactExports.useMemo(() => {
    if (selectedBusinessRegion === "전체")
      return [];
    const found = HARBOR_DATA.find((h) => h.region === selectedBusinessRegion);
    return found ? found.harbors : [];
  }, [selectedBusinessRegion]);
  const regionCounts = reactExports.useMemo(() => {
    const counts = { "전체": businessPosts.length };
    businessPosts.forEach((p) => {
      if (p.region === "전국 (전체)")
        return;
      const r = (p.region || "").split(" ")[0];
      if (r)
        counts[r] = (counts[r] || 0) + 1;
    });
    return counts;
  }, [businessPosts]);
  const harborCounts = reactExports.useMemo(() => {
    const counts = {};
    HARBOR_DATA.forEach((rd) => rd.harbors.forEach((h) => {
      counts[h.key] = businessPosts.filter((p) => (p.region || "").startsWith(h.key)).length;
    }));
    return counts;
  }, [businessPosts]);
  const businessRegions = reactExports.useMemo(() => ["전체", ...HARBOR_DATA.map((h) => h.region)], []);
  const [noticePosts, setNoticePosts] = reactExports.useState(_communityCache.notices);
  const [loading, setLoading] = reactExports.useState(_communityCache.business.length === 0 && _communityCache.crews.length === 0);
  const filteredCrews = reactExports.useMemo(() => {
    const q = crewSearch.trim().toLowerCase();
    if (!q)
      return crews;
    return crews.filter(
      (c) => (c.name || "").toLowerCase().includes(q) || (c.ownerName || "").toLowerCase().includes(q)
    );
  }, [crews, crewSearch]);
  const handleFabClick = () => {
    if (user?.id === "GUEST") {
      addToast("로그인이 필요한 기능입니다. 마이페이지에서 로그인해주세요.", "error");
      return;
    }
    if (activeTab === "open") {
      navigate("/write");
    } else if (activeTab === "crew") {
      if (!canAccessPremium) {
        addToast("무료(Free) 멤버쉽은 '크루 개설 방장 권한'이 없습니다. 업그레이드 후 이용해보세요!", "error");
      } else {
        navigate("/create-crew");
      }
    } else if (activeTab === "business") {
      if (!canAccessBusinessPromo) {
        addToast("선상 홍보글은 PRO 또는 항구 독점 VVIP 보유자만 작성 가능합니다. 구독 페이지로 이동합니다.", "error");
        navigate("/vvip-subscribe");
      } else {
        addToast("선장님 환영합니다! 및 비즈니스 홍보글을 작성합니다.", "success");
        navigate("/write-business");
      }
    } else if (activeTab === "notice") {
      if (!isAdmin) {
        addToast("❌ 공지사항은 Fishing GO 마스터(운영자)만 작성할 수 있습니다.", "error");
      } else {
        navigate("/write?type=notice");
      }
    }
  };
  const fetchPosts = reactExports.useCallback(async (pageNum = 1, append = false) => {
    try {
      const params = new URLSearchParams();
      params.set("page", pageNum);
      params.set("limit", 20);
      if (openCategory !== "전체")
        params.set("category", openCategory);
      if (debouncedSearch.trim())
        params.set("q", debouncedSearch.trim());
      if (sortMode === "popular")
        params.set("sort", "popular");
      const res = await apiClient.get(`/api/community/posts?${params}`);
      const data = res.data;
      const newPosts = data.posts || data;
      const blocked = user?.blockedUsers || [];
      const filtered = Array.isArray(newPosts) ? newPosts.filter((p) => !blocked.includes(p.author)) : [];
      if (append) {
        setPosts((prev) => [...prev, ...filtered]);
      } else {
        setPosts(filtered);
      }
      setTotalPages(data.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      if (false)
        console.error("Posts fetch error:", err);
    } finally {
      if (pageNum === 1 && !append)
        setLoading(false);
    }
  }, [openCategory, debouncedSearch, sortMode, user?.blockedUsers]);
  reactExports.useEffect(() => {
    if (!scrollToPostIdRef.current || posts.length === 0)
      return;
    const targetId = scrollToPostIdRef.current;
    scrollToPostIdRef.current = null;
    sessionStorage.removeItem("community_return_post_id");
    const timer = setTimeout(() => {
      const el = document.getElementById(`post-${targetId}`);
      if (el)
        el.scrollIntoView({ behavior: "instant", block: "center" });
    }, 150);
    return () => clearTimeout(timer);
  }, [posts]);
  reactExports.useEffect(() => {
    const fetchData = async () => {
      const hasCache = _communityCache.business.length > 0 || _communityCache.crews.length > 0;
      if (!hasCache)
        setLoading(true);
      try {
        const baseRequests = [
          apiClient.get("/api/community/crews").catch(() => ({ data: [] })),
          apiClient.get("/api/community/notices").catch(() => ({ data: [] })),
          apiClient.get("/api/community/business").catch(() => ({ data: [] }))
        ];
        const isLoggedIn = user?.email && user.email !== "guest@fishinggo.com" && user?.id !== "GUEST" && user?.id !== "guest";
        const myCrewsPromise = isLoggedIn ? apiClient.get("/api/user/crews").catch(() => ({ data: [] })) : Promise.resolve({ data: [] });
        const [crewsRes, noticesRes, businessRes, myCrewsRes] = await Promise.all([...baseRequests, myCrewsPromise]);
        const blocked = user?.blockedUsers || [];
        if (Array.isArray(crewsRes.data)) {
          const filtered = crewsRes.data.filter((c) => !blocked.includes(c.owner));
          _communityCache.crews = filtered;
          setCrews(filtered);
        }
        if (Array.isArray(noticesRes.data)) {
          _communityCache.notices = noticesRes.data;
          setNoticePosts(noticesRes.data);
        }
        if (Array.isArray(businessRes.data)) {
          const filtered = businessRes.data.filter((p) => !blocked.includes(p.author));
          _communityCache.business = filtered;
          setBusinessPosts(filtered);
        }
        apiClient.get("/api/stories").then((r) => {
          if (Array.isArray(r.data)) {
            _communityCache.stories = r.data;
            setStories(r.data);
          }
        }).catch(() => {
        });
        if (Array.isArray(myCrewsRes?.data) && myCrewsRes.data.length > 0) {
          const ids = new Set(myCrewsRes.data.map((c) => String(c._id || c.id)));
          setMyCrewIds(ids);
        }
      } catch (err) {
        if (false)
          console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.email]);
  reactExports.useEffect(() => {
    return () => {
      Object.values(shareSockets.current).forEach((s) => {
        try {
          s.disconnect();
        } catch {
        }
      });
      shareSockets.current = {};
    };
  }, []);
  reactExports.useEffect(() => {
    if (activeTab === "open")
      fetchPosts(1, false);
  }, [openCategory, debouncedSearch, activeTab, fetchPosts]);
  reactExports.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel)
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && page < totalPages && activeTab === "open") {
          setLoadingMore(true);
          fetchPosts(page + 1, true).finally(() => setLoadingMore(false));
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [page, totalPages, loadingMore, fetchPosts, activeTab]);
  const handleLoadMore = async () => {
    if (page >= totalPages)
      return;
    setLoadingMore(true);
    await fetchPosts(page + 1, true);
    setLoadingMore(false);
  };
  const handleDeletePost = async (e, id, type) => {
    e.stopPropagation();
    const myEmail = user?.email || user?.id || null;
    const isAuthorDelete = type === "open" && posts.find((p) => String(p._id || p.id) === String(id))?.author_email === myEmail || type === "business" && businessPosts.find((p) => String(p._id || p.id) === String(id))?.author_email === myEmail;
    if (!isAdmin && !isAuthorDelete)
      return;
    if (!window.confirm("게시물을 삭제하시겠습니까?"))
      return;
    try {
      const endpoint = type === "open" ? `/api/community/posts/${id}` : type === "business" ? `/api/community/business/${id}` : type === "notice" ? `/api/community/notices/${id}` : null;
      if (endpoint)
        await apiClient.delete(endpoint, {
          data: {
            email: myEmail
          }
        });
      if (type === "open")
        setPosts((prev) => prev.filter((p) => String(p._id || p.id) !== String(id)));
      if (type === "business")
        setBusinessPosts((prev) => prev.filter((p) => String(p._id || p.id) !== String(id)));
      if (type === "notice")
        setNoticePosts((prev) => prev.filter((p) => String(p._id || p.id) !== String(id)));
      addToast("게시물이 삭제되었습니다.", "success");
    } catch (err) {
      const errMsg = err.response?.data?.error || "삭제에 실패했습니다. 다시 시도해주세요.";
      addToast(errMsg, "error");
    }
  };
  const handleAdminDeleteCrew = async (crewId, crewName) => {
    if (!window.confirm(`[MASTER] '${crewName}' 크루를 강제 삭제하시겠습니까?`))
      return;
    try {
      await apiClient.delete(`/api/community/crews/${crewId}`, { data: { email: user?.email } });
      setCrews((prev) => prev.filter((c) => String(c._id || c.id) !== crewId));
      addToast(`[MASTER] '${crewName}' 크루가 삭제되었습니다.`, "success");
    } catch (err) {
      addToast(err.response?.data?.error || "삭제에 실패했습니다.", "error");
    }
  };
  const handleLike = async (e, postId) => {
    e.stopPropagation();
    if (!user || user.id === "GUEST") {
      addToast("로그인 후 이용 가능합니다.", "error");
      return;
    }
    if (likedPosts[postId]) {
      addToast("이미 좋아요를 눌렀습니다. ❤️", "info");
      return;
    }
    const prevLiked = { ...likedPosts };
    const newLiked = { ...likedPosts, [postId]: true };
    setLikedPosts(newLiked);
    try {
      localStorage.setItem("community_liked_posts", JSON.stringify(newLiked));
    } catch {
    }
    setPosts((prev) => prev.map((p) => String(p._id || p.id) === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
    setLikeAnimating((prev) => ({ ...prev, [postId]: true }));
    if (likeTimerRef.current[postId])
      clearTimeout(likeTimerRef.current[postId]);
    likeTimerRef.current[postId] = setTimeout(() => {
      setLikeAnimating((prev) => ({ ...prev, [postId]: false }));
      delete likeTimerRef.current[postId];
    }, 700);
    try {
      const res = await apiClient.post(`/api/community/posts/${postId}/like`);
      const serverLikes = res.data?.likes;
      if (typeof serverLikes === "number") {
        setPosts((prev) => prev.map((p) => String(p._id || p.id) === postId ? { ...p, likes: serverLikes } : p));
      }
    } catch (err) {
      const status = err.response?.status;
      const code = err.response?.data?.code;
      if (status === 409) {
        const serverLikes = err.response?.data?.likes;
        if (typeof serverLikes === "number") {
          setPosts((prev) => prev.map((p) => String(p._id || p.id) === postId ? { ...p, likes: serverLikes } : p));
        }
        return;
      }
      if (status === 401 || code === "AUTH_REQUIRED") {
        setLikedPosts(prevLiked);
        try {
          localStorage.setItem("community_liked_posts", JSON.stringify(prevLiked));
        } catch {
        }
        setPosts((prev) => prev.map((p) => String(p._id || p.id) === postId ? { ...p, likes: Math.max((p.likes || 1) - 1, 0) } : p));
        addToast("로그인이 필요합니다.", "error");
        return;
      }
      if (false)
        console.warn("[Like] 서버 동기화 실패 (로컬 반영 유지):", err.message);
    }
  };
  const handleCommentSubmit = async (postId) => {
    const text = (commentInputMap[postId] || "").trim();
    if (!text)
      return;
    if (!user || user.id === "GUEST") {
      addToast("로그인 후 이용 가능합니다.", "error");
      return;
    }
    setCommentSubmittingMap((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await apiClient.post(`/api/community/posts/${postId}/comments`, {
        author: user.name || user.id,
        author_email: user.email || user.id,
        text
      });
      const serverComments = res.data?.comments;
      if (Array.isArray(serverComments)) {
        setPosts((prev) => prev.map(
          (p) => String(p._id || p.id) === postId ? { ...p, comments: serverComments } : p
        ));
      }
      setCommentInputMap((prev) => ({ ...prev, [postId]: "" }));
      addToast("댓글이 등록되었습니다! 💬", "success");
    } catch (err) {
      addToast(err.response?.data?.error || "댓글 등록에 실패했습니다.", "error");
    } finally {
      setCommentSubmittingMap((prev) => ({ ...prev, [postId]: false }));
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-container", style: { backgroundColor: "#F2F2F7" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#fff", padding: "24px 20px 0", borderBottom: "1px solid #F0F0F0" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { style: { fontSize: `calc(24px * var(--fs, 1))`, fontWeight: "900", marginBottom: "20px" }, children: "커뮤니티" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", gap: "0" }, children: [
        { key: "open", label: "오픈게시판", color: "#0056D2" },
        { key: "crew", label: "크루", color: "#0056D2" },
        { key: "notice", label: "공지사항", color: "#FF3B30" },
        { key: "business", label: "선상배홍보", color: "#0056D2" },
        { key: "ranking", label: "🏆 조황랭킹", color: "#6366f1" }
      ].map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setActiveTab(tab.key),
          style: {
            flexShrink: 0,
            padding: "12px 18px",
            backgroundColor: "transparent",
            border: "none",
            borderBottom: activeTab === tab.key ? `3px solid ${tab.color}` : "3px solid transparent",
            color: activeTab === tab.key ? tab.color : "#999",
            fontWeight: activeTab === tab.key ? "900" : "600",
            fontSize: `calc(14px * var(--fs, 1))`,
            cursor: "pointer",
            transition: "all 0.2s",
            whiteSpace: "nowrap"
          },
          children: tab.label
        },
        tab.key
      )) })
    ] }),
    activeTab === "open" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#fff", borderBottom: "1px solid #F0F0F0" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "10px 16px 0" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#F2F2F7", borderRadius: "12px", padding: "8px 14px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(16px * var(--fs, 1))` }, children: "🔍" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            placeholder: "게시글 검색 (내용, 작성자)",
            style: { flex: 1, border: "none", background: "transparent", outline: "none", fontSize: `calc(14px * var(--fs, 1))`, color: "#1c1c1e" }
          }
        ),
        searchQuery && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setSearchQuery(""), style: { border: "none", background: "none", cursor: "pointer", color: "#999", fontSize: `calc(16px * var(--fs, 1))` }, children: "✕" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { overflowX: "auto", WebkitOverflowScrolling: "touch" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px", padding: "10px 16px", width: "max-content" }, children: OPEN_CATEGORIES.map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setOpenCategory(cat),
          style: {
            padding: "7px 18px",
            borderRadius: "20px",
            border: "none",
            fontSize: `calc(13px * var(--fs, 1))`,
            fontWeight: openCategory === cat ? "900" : "700",
            cursor: "pointer",
            backgroundColor: openCategory === cat ? "#0056D2" : "#F2F2F7",
            color: openCategory === cat ? "#fff" : "#555",
            transition: "all 0.15s",
            whiteSpace: "nowrap",
            boxShadow: openCategory === cat ? "0 2px 8px rgba(0,86,210,0.3)" : "none"
          },
          children: cat
        },
        cat
      )) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 10px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "6px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setSortMode("latest"),
              style: {
                padding: "5px 12px",
                borderRadius: "16px",
                border: "none",
                fontSize: `calc(12px * var(--fs, 1))`,
                fontWeight: "800",
                background: sortMode === "latest" ? "#1c1c1e" : "#F2F2F7",
                color: sortMode === "latest" ? "#fff" : "#666",
                cursor: "pointer",
                transition: "all 0.15s"
              },
              children: "최신순"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setSortMode("popular"),
              style: {
                padding: "5px 12px",
                borderRadius: "16px",
                border: "none",
                fontSize: `calc(12px * var(--fs, 1))`,
                fontWeight: "800",
                background: sortMode === "popular" ? "#FF5A5F" : "#F2F2F7",
                color: sortMode === "popular" ? "#fff" : "#666",
                cursor: "pointer",
                transition: "all 0.15s"
              },
              children: "🔥 인기순"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setViewMode((v) => v === "feed" ? "grid" : "feed"),
            style: {
              background: "none",
              border: "1px solid #E5E5EA",
              borderRadius: "8px",
              padding: "5px 10px",
              fontSize: `calc(13px * var(--fs, 1))`,
              fontWeight: "800",
              cursor: "pointer",
              color: "#555",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            },
            children: [
              viewMode === "feed" ? "⊞" : "≡",
              " ",
              viewMode === "feed" ? "그리드" : "피드"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: activeTab === "ranking" ? "0" : "16px" }, children: loading && activeTab !== "ranking" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "16px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonCard, { count: 5 }) }) : activeTab === "ranking" ? /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "32px", textAlign: "center" }, children: "로딩 중..." }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(CatchRankingPage, { embedded: true }) }) : activeTab === "notice" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fade-in", style: { display: "flex", flexDirection: "column", gap: "16px" }, children: noticePosts.map((notice) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        onClick: () => navigate(`/notice/${String(notice._id || notice.id)}`, { state: { notice } }),
        style: { backgroundColor: notice.isPinned ? "#FFF1F0" : "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.03)", position: "relative", border: notice.isPinned ? "1px solid #FFCCC7" : "1px solid #E5E5EA", cursor: "pointer", transition: "box-shadow 0.15s" },
        onMouseEnter: (e) => e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)",
        onMouseLeave: (e) => e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.03)",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }, children: [
            notice.isPinned && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "4px 8px", backgroundColor: "#FF3B30", color: "#fff", fontSize: `calc(10px * var(--fs, 1))`, borderRadius: "6px", fontWeight: "900" }, children: "중요 필독" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#888", fontWeight: "bold" }, children: notice.date }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#aaa", marginLeft: "auto" }, children: [
              "조회 ",
              notice.views
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "900", color: "#1c1c1e", marginBottom: "8px", wordBreak: "keep-all" }, children: notice.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: {
            fontSize: `calc(14px * var(--fs, 1))`,
            color: "#777",
            lineHeight: "1.6",
            paddingBottom: isAdmin ? "36px" : "0",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical"
          }, children: notice.content }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: "8px", fontSize: `calc(12px * var(--fs, 1))`, color: "#0056D2", fontWeight: "700", paddingBottom: isAdmin ? "36px" : "0" }, children: "자세히 보기 →" }),
          isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", bottom: "16px", right: "16px", display: "flex", gap: "6px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: (e) => {
              e.stopPropagation();
              navigate(`/write?type=notice&editId=${String(notice._id || notice.id)}`);
            }, style: { border: "none", background: "rgba(0,86,210,0.1)", color: "#0056D2", padding: "6px 12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { size: 13 }),
              " 수정"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: (e) => handleDeletePost(e, String(notice._id || notice.id), "notice"), style: { border: "none", background: "rgba(255,59,48,0.1)", color: "#FF3B30", padding: "6px 12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 13 }),
              " 삭제"
            ] })
          ] })
        ]
      },
      String(notice._id || notice.id)
    )) }) : activeTab === "open" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fade-in", children: [
      (stories.length > 0 || user?.id !== "GUEST") && /* @__PURE__ */ jsxRuntimeExports.jsx(
        StorySlider,
        {
          stories,
          onAddStory: () => {
            if (!user || user.id === "GUEST") {
              addToast("로그인이 필요합니다.", "error");
              return;
            }
            addToast("스토리 등록: 사진을 선택해 24h 조황을 공유하세요!", "info");
            navigate("/write?story=1");
          },
          onViewStory: (s) => setStoryViewer(s)
        }
      ),
      posts.length === 0 && !loading && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "48px 20px", color: "#AAB0BE" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(40px * var(--fs, 1))`, marginBottom: "12px" }, children: "🎣" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "800", marginBottom: "6px", color: "#555" }, children: "아직 게시글이 없습니다" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))` }, children: "첫 조황을 공유해보세요!" })
      ] }),
      viewMode === "grid" && posts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px", margin: "0 -16px" }, children: posts.map((post, index) => {
        const postId = String(post._id || post.id);
        const imgSrc = post.images?.[0] || post.image;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            onClick: () => {
              sessionStorage.setItem("community_return_tab", "open");
              sessionStorage.setItem("community_return_post_id", postId);
              navigate(`/post/${postId}`, { state: { postIds: posts.map((p) => String(p._id || p.id)), currentIndex: index } });
            },
            style: { aspectRatio: "1", overflow: "hidden", position: "relative", cursor: "pointer", background: "#F2F2F7" },
            children: [
              imgSrc ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: imgSrc, alt: "", loading: "lazy", style: { width: "100%", height: "100%", objectFit: "cover" } }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px", background: "#F8F9FA", fontSize: `calc(9px * var(--fs, 1))`, color: "#555", textAlign: "center", lineHeight: 1.4 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(18px * var(--fs, 1))`, marginBottom: "3px" }, children: "🎣" }),
                (post.content || "").slice(0, 28)
              ] }),
              post.images?.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", top: "5px", right: "5px", background: "rgba(0,0,0,0.6)", borderRadius: "4px", padding: "1px 5px", fontSize: `calc(8px * var(--fs, 1))`, color: "#fff", fontWeight: "900" }, children: [
                "⊞ ",
                post.images.length
              ] }),
              post.likes > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", bottom: "4px", left: "4px", display: "flex", alignItems: "center", gap: "2px", background: "rgba(0,0,0,0.5)", borderRadius: "8px", padding: "2px 5px", fontSize: `calc(9px * var(--fs, 1))`, color: "#fff" }, children: [
                "❤️ ",
                post.likes
              ] })
            ]
          },
          postId
        );
      }) }),
      viewMode === "feed" && posts.map((post, index) => {
        const postId = String(post._id || post.id);
        const isExpanded = expandedPostId === postId;
        const allImages = Array.isArray(post.images) && post.images.length > 0 ? post.images : post.image ? [post.image] : [];
        const slideIdx = slideIndexMap[postId] || 0;
        const imgCount = allImages.length;
        const contentLines = (post.content || "").split("\n");
        const needsExpand = (post.content || "").length > 80 || contentLines.length > 3;
        const renderContent = (text) => {
          if (!text)
            return null;
          const lines = text.split("\n");
          return lines.map((line, lineIdx) => {
            const parts = line.split(/(#[\w가-힣]+)/g).map(
              (part, i) => part.startsWith("#") ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    setSearchQuery(part.slice(1));
                  },
                  style: { color: "#0056D2", fontWeight: "800", cursor: "pointer" },
                  children: part
                },
                i
              ) : part
            );
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(React.Fragment, { children: [
              parts,
              lineIdx < lines.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("br", {})
            ] }, lineIdx);
          });
        };
        const goSlide = (e, dir) => {
          e.stopPropagation();
          setSlideIndexMap((prev) => {
            const cur = prev[postId] || 0;
            const next = Math.max(0, Math.min(allImages.length - 1, cur + dir));
            return { ...prev, [postId]: next };
          });
        };
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(React.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              id: `post-${postId}`,
              style: {
                backgroundColor: "#fff",
                borderRadius: isExpanded ? "20px" : "16px",
                marginBottom: "12px",
                boxShadow: isExpanded ? "0 8px 32px rgba(0,86,210,0.13)" : highlightedPostId === postId ? "0 0 0 3px #0056D2" : "0 2px 10px rgba(0,0,0,0.03)",
                border: isExpanded ? "1.5px solid #C8D9FF" : highlightedPostId === postId ? "1px solid #0056D2" : "1px solid #f0f0f0",
                overflow: "hidden",
                transition: "all 0.28s cubic-bezier(0.4,0,0.2,1)"
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    style: { padding: "14px 16px 0", display: "flex", justifyContent: "space-between", cursor: "pointer" },
                    onClick: () => setExpandedPostId(isExpanded ? null : postId),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "10px", alignItems: "center" }, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "38px", height: "38px", borderRadius: "50%", overflow: "hidden", background: "#EEF4FF", flexShrink: 0, border: "2px solid #E0EAFF" }, children: post.author_avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: post.author_avatar, alt: post.author, style: { width: "100%", height: "100%", objectFit: "cover" } }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "900", color: "#0056D2" }, children: (post.author || "?").charAt(0).toUpperCase() }) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "5px" }, children: [
                            (post.author === ADMIN_ID || post.author === "sunjulab") && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, background: "linear-gradient(135deg,#E60000,#990000)", color: "#fff", padding: "1px 5px", borderRadius: "4px", fontWeight: "900" }, children: "MASTER" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(11px * var(--fs, 1))`, backgroundColor: "rgba(0,86,210,0.08)", color: "#0056D2", padding: "2px 7px", borderRadius: "6px", fontWeight: "800" }, children: post.category }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "strong",
                              {
                                onClick: (e) => {
                                  e.stopPropagation();
                                  navigate(`/user/${encodeURIComponent(post.author)}`);
                                },
                                style: { fontSize: `calc(14px * var(--fs, 1))`, color: "#1c1c1e", cursor: "pointer" },
                                children: post.author
                              }
                            )
                          ] }),
                          post.location?.address && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#8E8E93", display: "flex", alignItems: "center", gap: "2px", marginTop: "1px" }, children: [
                            "📍 ",
                            post.location.address
                          ] })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#bbb" }, children: post.time }),
                        (isAdmin || post.author_email === user?.email) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "4px" }, children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: (e) => {
                            e.stopPropagation();
                            navigate(`/write?editId=${postId}`);
                          }, style: { background: "none", border: "none", padding: 0, cursor: "pointer", color: "#0056D2" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { size: 15 }) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: (e) => handleDeletePost(e, postId, "open"), style: { background: "none", border: "none", padding: 0, cursor: "pointer", color: "#FF3B30" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 15 }) })
                        ] })
                      ] })
                    ]
                  }
                ),
                allImages.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", marginTop: "12px", userSelect: "none" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      ref: (el) => el ? slideWrapperRefs.current.set(postId, el) : slideWrapperRefs.current.delete(postId),
                      className: "insta-slider",
                      style: {
                        display: "flex",
                        overflowX: "auto",
                        scrollSnapType: "x mandatory",
                        scrollBehavior: "smooth",
                        WebkitOverflowScrolling: "touch"
                      },
                      onScroll: (e) => {
                        const el = e.currentTarget;
                        const newIdx = Math.round(el.scrollLeft / el.offsetWidth);
                        if (newIdx !== slideIdx) {
                          setSlideIndexMap((prev) => ({ ...prev, [postId]: newIdx }));
                        }
                      },
                      onClick: (e) => {
                        e.stopPropagation();
                        const now = Date.now();
                        if (now - (lastTapRef.current[postId] || 0) < 300) {
                          if (!likedPosts[postId]) {
                            handleLike({ stopPropagation: () => {
                            } }, postId);
                            setHeartBurstId(postId);
                            setTimeout(() => setHeartBurstId(null), 800);
                          }
                        }
                        lastTapRef.current[postId] = now;
                      },
                      children: allImages.map((imgSrc, imgIdx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "div",
                        {
                          style: {
                            flex: "0 0 100%",
                            scrollSnapAlign: "start",
                            // ✅ RATIO-3/4: 3:4 고정 비율 컨테이너
                            aspectRatio: "3 / 4",
                            overflow: "hidden",
                            position: "relative",
                            background: "#000"
                          },
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "img",
                            {
                              src: imgSrc,
                              alt: `사진 ${imgIdx + 1}`,
                              loading: "lazy",
                              style: {
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                                pointerEvents: "none"
                              }
                            }
                          )
                        },
                        imgIdx
                      ))
                    }
                  ),
                  allImages.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          const el = slideWrapperRefs.current.get(postId);
                          if (el) {
                            const newIdx = Math.max(0, slideIdx - 1);
                            el.scrollTo({ left: el.offsetWidth * newIdx, behavior: "smooth" });
                            setSlideIndexMap((prev) => ({ ...prev, [postId]: newIdx }));
                          }
                        },
                        disabled: slideIdx === 0,
                        style: {
                          position: "absolute",
                          left: "8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "rgba(0,0,0,0.5)",
                          border: "none",
                          borderRadius: "50%",
                          width: "34px",
                          height: "34px",
                          color: "#fff",
                          fontSize: `calc(20px * var(--fs, 1))`,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: slideIdx === 0 ? 0.2 : 1,
                          transition: "opacity 0.2s",
                          zIndex: 5
                        },
                        children: "‹"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          const el = slideWrapperRefs.current.get(postId);
                          if (el) {
                            const newIdx = Math.min(allImages.length - 1, slideIdx + 1);
                            el.scrollTo({ left: el.offsetWidth * newIdx, behavior: "smooth" });
                            setSlideIndexMap((prev) => ({ ...prev, [postId]: newIdx }));
                          }
                        },
                        disabled: slideIdx === allImages.length - 1,
                        style: {
                          position: "absolute",
                          right: "8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "rgba(0,0,0,0.5)",
                          border: "none",
                          borderRadius: "50%",
                          width: "34px",
                          height: "34px",
                          color: "#fff",
                          fontSize: `calc(20px * var(--fs, 1))`,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: slideIdx === allImages.length - 1 ? 0.2 : 1,
                          transition: "opacity 0.2s",
                          zIndex: 5
                        },
                        children: "›"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
                      position: "absolute",
                      bottom: "10px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                      gap: "5px",
                      zIndex: 5,
                      pointerEvents: "none"
                    }, children: allImages.map((_, di) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        style: {
                          width: di === slideIdx ? "20px" : "6px",
                          height: "6px",
                          borderRadius: "3px",
                          background: di === slideIdx ? "#fff" : "rgba(255,255,255,0.5)",
                          transition: "all 0.22s",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
                        }
                      },
                      di
                    )) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      background: "rgba(0,0,0,0.6)",
                      borderRadius: "12px",
                      padding: "2px 9px",
                      fontSize: `calc(11px * var(--fs, 1))`,
                      color: "#fff",
                      fontWeight: "800",
                      zIndex: 5,
                      pointerEvents: "none"
                    }, children: [
                      slideIdx + 1,
                      "/",
                      allImages.length
                    ] })
                  ] }),
                  heartBurstId === postId && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(80px * var(--fs, 1))`, animation: "heartPop 0.75s ease-out forwards" }, children: "❤️" }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: allImages.length > 0 ? "12px 16px 0" : "10px 16px 0" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: {
                    margin: 0,
                    fontSize: `calc(15px * var(--fs, 1))`,
                    color: "#1c1c1e",
                    lineHeight: "1.65",
                    fontWeight: "400",
                    ...isExpanded ? {} : { overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }
                  }, children: renderContent(post.content) }),
                  needsExpand && !isExpanded && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      onClick: (e) => {
                        e.stopPropagation();
                        setExpandedPostId(postId);
                      },
                      style: { fontSize: `calc(14px * var(--fs, 1))`, color: "#8E8E93", cursor: "pointer", fontWeight: "700", marginLeft: "4px" },
                      children: "더보기"
                    }
                  ),
                  isExpanded && needsExpand && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      onClick: (e) => {
                        e.stopPropagation();
                        setExpandedPostId(null);
                      },
                      style: { fontSize: `calc(14px * var(--fs, 1))`, color: "#8E8E93", cursor: "pointer", fontWeight: "700", display: "block", marginTop: "6px" },
                      children: "접기 ↑"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "10px 16px", display: "flex", gap: "16px", alignItems: "center", borderTop: "1px solid #f8f8f8", marginTop: "10px" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "span",
                    {
                      onClick: (e) => handleLike(e, postId),
                      style: { display: "flex", alignItems: "center", gap: "6px", fontSize: `calc(13px * var(--fs, 1))`, cursor: "pointer", position: "relative", color: likedPosts[postId] ? "#FF5A5F" : "#8e8e93", fontWeight: likedPosts[postId] ? "800" : "400", transition: "color 0.2s", userSelect: "none" },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Heart,
                          {
                            size: 16,
                            color: "#FF5A5F",
                            fill: likedPosts[postId] ? "#FF5A5F" : "none",
                            style: { transform: likeAnimating[postId] ? "scale(1.6)" : "scale(1)", transition: "transform 0.25s cubic-bezier(0.36,0.07,0.19,0.97)", filter: likeAnimating[postId] ? "drop-shadow(0 0 6px #FF5A5F)" : "none" }
                          }
                        ),
                        post.likes || 0,
                        likeAnimating[postId] && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { position: "absolute", top: "-18px", left: 0, fontSize: `calc(18px * var(--fs, 1))`, pointerEvents: "none", animation: "heartBurst 0.7s ease-out forwards" }, children: "❤️" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "span",
                    {
                      onClick: (e) => {
                        e.stopPropagation();
                        const nowOpen = !commentOpenMap[postId];
                        setCommentOpenMap((prev) => ({ ...prev, [postId]: nowOpen }));
                        if (nowOpen)
                          setExpandedPostId(postId);
                      },
                      style: { display: "flex", alignItems: "center", gap: "6px", fontSize: `calc(13px * var(--fs, 1))`, color: commentOpenMap[postId] ? "#0056D2" : "#8e8e93", cursor: "pointer", fontWeight: commentOpenMap[postId] ? "800" : "400", transition: "color 0.2s" },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { size: 16 }),
                        " ",
                        post.comments?.length || 0
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { display: "flex", alignItems: "center", gap: "10px", marginLeft: "auto" }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          const firstImg = Array.isArray(post.images) && post.images.length > 0 ? post.images[0] : post.image || null;
                          shareExternal({
                            title: `낚시GO | ${post.author}님의 조황`,
                            text: (post.content || "").slice(0, 80),
                            url: `${window.location.origin}/post/${postId}`,
                            imgUrl: firstImg,
                            // null이면 shareUtils에서 앱 로고로 대체
                            postId,
                            addToast
                          });
                        },
                        style: { display: "flex", alignItems: "center", gap: "4px", fontSize: `calc(13px * var(--fs, 1))`, color: "#8e8e93", cursor: "pointer", transition: "color 0.2s" },
                        title: "외부 앱에 공유",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { size: 15 })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "span",
                      {
                        onClick: async (e) => {
                          e.stopPropagation();
                          if (!user) {
                            addToast("로그인 후 이용하세요.", "error");
                            return;
                          }
                          try {
                            const res = await apiClient.get("/api/user/crews");
                            setMyCrews(Array.isArray(res.data) ? res.data : []);
                          } catch {
                            setMyCrews([]);
                          }
                          setShareTarget(null);
                          setShareModal({ post });
                        },
                        style: { display: "flex", alignItems: "center", gap: "3px", fontSize: `calc(12px * var(--fs, 1))`, color: "#8e8e93", cursor: "pointer", transition: "color 0.2s" },
                        title: "크루 채팅방에 공유",
                        children: [
                          "💬",
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(11px * var(--fs, 1))` }, children: "크루" })
                        ]
                      }
                    )
                  ] })
                ] }),
                post.comments?.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "0 16px 10px", borderTop: "1px solid #f8f8f8", paddingTop: "10px" }, children: [
                  post.comments.slice(0, isExpanded ? post.comments.length : 2).map((c, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
                    fontSize: `calc(13px * var(--fs, 1))`,
                    color: "#333",
                    marginBottom: "5px",
                    ...isExpanded ? {} : { overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }
                  }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { style: { color: "#1c1c1e", marginRight: "5px" }, children: c.author }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#555" }, children: c.text || c.content })
                  ] }, i)),
                  !isExpanded && post.comments.length > 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "span",
                    {
                      style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#8E8E93", cursor: "pointer", fontWeight: "700" },
                      onClick: (e) => {
                        e.stopPropagation();
                        setExpandedPostId(postId);
                        setCommentOpenMap((prev) => ({ ...prev, [postId]: true }));
                      },
                      children: [
                        "댓글 ",
                        post.comments.length,
                        "개 모두 보기"
                      ]
                    }
                  )
                ] }),
                commentOpenMap[postId] && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    style: { padding: "8px 12px 12px", borderTop: "1px solid #f0f0f0" },
                    onClick: (e) => e.stopPropagation(),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor: "#F7F8FA",
                      borderRadius: "24px",
                      padding: "8px 14px",
                      border: "1.5px solid #E5E7EB",
                      transition: "border-color 0.15s"
                    }, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "#EEF4FF",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: `calc(13px * var(--fs, 1))`,
                        fontWeight: "900",
                        color: "#0056D2"
                      }, children: (user?.name || user?.id || "?").charAt(0).toUpperCase() }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          autoFocus: true,
                          value: commentInputMap[postId] || "",
                          onChange: (e) => setCommentInputMap((prev) => ({ ...prev, [postId]: e.target.value })),
                          onKeyDown: (e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleCommentSubmit(postId);
                            }
                          },
                          placeholder: "댓글을 입력하세요...",
                          style: {
                            flex: 1,
                            border: "none",
                            background: "transparent",
                            outline: "none",
                            fontSize: `calc(14px * var(--fs, 1))`,
                            color: "#1c1c1e",
                            fontWeight: "400"
                          }
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          onClick: () => handleCommentSubmit(postId),
                          disabled: commentSubmittingMap[postId] || !(commentInputMap[postId] || "").trim(),
                          style: {
                            background: (commentInputMap[postId] || "").trim() ? "#0056D2" : "#E5E7EB",
                            border: "none",
                            borderRadius: "50%",
                            width: "30px",
                            height: "30px",
                            flexShrink: 0,
                            cursor: (commentInputMap[postId] || "").trim() ? "pointer" : "default",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "background 0.15s"
                          },
                          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M22 2L11 13", stroke: "#fff", strokeWidth: "2.5", strokeLinecap: "round" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M22 2L15 22L11 13L2 9L22 2Z", stroke: "#fff", strokeWidth: "2.5", strokeLinejoin: "round" })
                          ] })
                        }
                      )
                    ] })
                  }
                )
              ]
            }
          ),
          !canAccessPremium && (index + 1) % 4 === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(NativeAd, { slotId: `feed_native_${index}` }),
          !canAccessPremium && (index + 1) % 3 === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(InFeedAd, {})
        ] }, postId);
      }),
      !canAccessPremium && posts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "0 16px 8px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdSenseDisplay, { style: { borderRadius: "12px", overflow: "hidden" } }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: sentinelRef, style: { height: 20 } }),
      loadingMore && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "0 16px 12px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonCard, { count: 2 }) }),
      page >= totalPages && posts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "20px", fontSize: `calc(13px * var(--fs, 1))`, color: "#bbb" }, children: "모든 게시글을 불러왔습니다 🎣" })
    ] }) : activeTab === "crew" ? (
      // [프라이빗 크루 뷰]
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fade-in", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#fff", borderRadius: "14px", padding: "10px 16px", marginBottom: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #F0F0F0" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(16px * var(--fs, 1))`, flexShrink: 0 }, children: "🔍" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: crewSearch,
              onChange: (e) => setCrewSearch(e.target.value),
              placeholder: "크루명 검색",
              style: { flex: 1, border: "none", background: "transparent", outline: "none", fontSize: `calc(14px * var(--fs, 1))`, color: "#1c1c1e", fontWeight: "600" }
            }
          ),
          crewSearch && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setCrewSearch(""), style: { border: "none", background: "none", cursor: "pointer", color: "#bbb", fontSize: `calc(16px * var(--fs, 1))`, padding: 0, lineHeight: 1 }, children: "✕" })
        ] }),
        filteredCrews.length === 0 && crews.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "40px 20px", color: "#aaa" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(32px * var(--fs, 1))`, marginBottom: "10px" }, children: "🔍" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "800", color: "#555", marginBottom: "4px" }, children: "검색 결과가 없습니다" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(13px * var(--fs, 1))` }, children: [
            "'",
            crewSearch,
            "' 에 해당하는 크루가 없습니다"
          ] })
        ] }),
        filteredCrews.map((crew) => {
          const crewId = String(crew._id || crew.id);
          const isMyCrew = myCrewIds.has(crewId);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#fff", padding: "18px", borderRadius: "16px", marginBottom: "12px", flexDirection: "column", boxShadow: isMyCrew ? "0 2px 10px rgba(0,86,210,0.12)" : "0 2px 10px rgba(0,0,0,0.03)", border: isMyCrew ? "1.5px solid #0056D2" : "1px solid #f0f0f0" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                flexShrink: 0,
                overflow: "hidden",
                background: crew.logo ? "transparent" : "linear-gradient(135deg, #0056D2, #00C48C)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #E5E5EA"
              }, children: crew.logo ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: crew.logo, alt: "크루 로고", style: { width: "100%", height: "100%", objectFit: "cover" } }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "22px" }, children: "⚓" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }, children: [
                  isMyCrew && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, fontWeight: "900", background: "#0056D2", color: "#fff", padding: "2px 7px", borderRadius: "8px", flexShrink: 0 }, children: "내 크루" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: 0, fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "700", color: "#1c1c1e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: crew.name })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "12px", color: "#8e8e93", fontSize: `calc(13px * var(--fs, 1))` }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { display: "flex", alignItems: "center", gap: "4px" }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 14 }),
                    " 인원 ",
                    crew.members,
                    "/",
                    crew.limit != null ? crew.limit : 1e3
                  ] }),
                  crew.region && crew.region !== "전국" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#bbb" }, children: [
                    "📍 ",
                    crew.region
                  ] })
                ] })
              ] }),
              isMyCrew ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => navigate(`/crew/${crewId}/chat`), style: { backgroundColor: "#0056D2", border: "none", padding: "8px 18px", borderRadius: "20px", color: "#fff", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 10px rgba(0,86,210,0.2)", flexShrink: 0, marginLeft: "8px" }, children: "채팅 입장" }) : crew.isPrivate ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => {
                    if (user?.id === "GUEST") {
                      addToast("로그인이 필요한 기능입니다. 마이페이지에서 로그인해주세요.", "error");
                      return;
                    }
                    setCrewPassInput("");
                    setCrewPassModal({ crew });
                  },
                  style: { backgroundColor: "#f5f5f7", border: "none", padding: "12px", borderRadius: "50%", color: "#0056D2", cursor: "pointer", transition: "background 0.2s", flexShrink: 0, marginLeft: "8px" },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { size: 20 })
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: async () => {
                    if (user?.id === "GUEST") {
                      addToast("로그인이 필요한 기능입니다. 마이페이지에서 로그인해주세요.", "error");
                      return;
                    }
                    try {
                      await apiClient.post(`/api/community/crews/${crewId}/join`, { email: user.email, name: user.name });
                      setMyCrewIds((prev) => /* @__PURE__ */ new Set([...prev, crewId]));
                    } catch {
                    }
                    navigate(`/crew/${crewId}/chat`);
                  },
                  style: { backgroundColor: "#0056D2", border: "none", padding: "8px 18px", borderRadius: "20px", color: "#fff", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 10px rgba(0,86,210,0.2)", flexShrink: 0, marginLeft: "8px" },
                  children: "입장하기"
                }
              )
            ] }),
            isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "10px", paddingTop: "10px", borderTop: "1px dashed #FFE0E0", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#FF3B30", fontWeight: "900", background: "rgba(255,59,48,0.08)", padding: "2px 8px", borderRadius: "6px" }, children: "MASTER 관리" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    handleAdminDeleteCrew(crewId, crew.name);
                  },
                  style: { border: "none", background: "rgba(255,59,48,0.1)", color: "#FF3B30", padding: "5px 12px", borderRadius: "8px", fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 12 }),
                    " 강제 삭제"
                  ]
                }
              )
            ] }),
            !canAccessPremium && (filteredCrews.indexOf(crew) + 1) % 5 === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { margin: "4px 0 4px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdSenseDisplay, { style: { borderRadius: "12px", overflow: "hidden" } }) })
          ] }, crewId);
        }),
        !canAccessPremium && filteredCrews.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { margin: "8px 0" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdSenseDisplay, { style: { borderRadius: "12px", overflow: "hidden" } }) })
      ] })
    ) : (
      // [비즈니스: 선상 배 홍보 뷰]
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fade-in", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px", background: "linear-gradient(135deg, #0A192F, #1A365D)", borderRadius: "16px", marginBottom: "20px", color: "#fff", boxShadow: "0 8px 24px rgba(10,25,47,0.2)", position: "relative", overflow: "hidden" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "-10px", right: "-10px", opacity: 0.1 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { size: 100 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "950", color: "#FFD700", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { size: 18 }),
            " 프리미엄 선상 직거래"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: "0 0 4px", fontSize: `calc(12.5px * var(--fs, 1))`, fontWeight: "700", lineHeight: "1.4" }, children: "비즈니스 인증을 거친 검증된 선장님들의 공간입니다." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: 0, fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.6)" }, children: "게시물 하단의 [직통 전화] 버튼을 눌러 수수료 없이 다이렉트 예약하세요!" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "12px", position: "relative" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#fff",
            border: `1.5px solid ${businessSearchQuery ? "#0056D2" : "#E8EBF0"}`,
            borderRadius: "14px",
            padding: "11px 14px",
            boxShadow: businessSearchQuery ? "0 0 0 3px rgba(0,86,210,0.1)" : "0 2px 8px rgba(0,0,0,0.05)",
            transition: "all 0.2s"
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(16px * var(--fs, 1))`, flexShrink: 0 }, children: "🔍" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: businessSearchQuery,
                onChange: (e) => setBusinessSearchQuery(e.target.value),
                placeholder: "지역명·항구명·선박명·어종 검색",
                style: {
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: `calc(14px * var(--fs, 1))`,
                  fontWeight: "700",
                  color: "#1c1c1e",
                  fontFamily: "inherit"
                }
              }
            ),
            businessSearchQuery && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setBusinessSearchQuery(""),
                style: {
                  background: "#E5E5EA",
                  border: "none",
                  borderRadius: "50%",
                  width: "22px",
                  height: "22px",
                  cursor: "pointer",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: `calc(12px * var(--fs, 1))`,
                  color: "#666",
                  fontWeight: "900"
                },
                children: "✕"
              }
            )
          ] }),
          businessSearchQuery && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            marginTop: "6px",
            fontSize: `calc(11px * var(--fs, 1))`,
            color: effectiveBusinessPosts.length > 0 ? "#0056D2" : "#FF5A5F",
            fontWeight: "800",
            paddingLeft: "4px"
          }, children: effectiveBusinessPosts.length > 0 ? `🎯 "${businessSearchQuery}" 검색 결과 ${effectiveBusinessPosts.length}건` : `"${businessSearchQuery}" 검색 결과가 없습니다` })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          display: "flex",
          gap: "7px",
          overflowX: "auto",
          paddingBottom: "4px",
          marginBottom: "8px",
          scrollbarWidth: "none",
          msOverflowStyle: "none"
        }, children: businessRegions.map((region) => {
          const count = regionCounts[region] || 0;
          const isActive = selectedBusinessRegion === region;
          const hasPost = count > 0;
          const hd = HARBOR_DATA.find((h) => h.region === region);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => {
                setSelectedBusinessRegion(region);
                setSelectedHarbor("");
              },
              style: {
                flexShrink: 0,
                padding: "7px 13px",
                borderRadius: "20px",
                border: isActive ? "none" : `1.5px solid ${hasPost ? "#0056D2" : "#E5E5EA"}`,
                fontSize: `calc(12px * var(--fs, 1))`,
                fontWeight: "800",
                cursor: "pointer",
                transition: "all 0.15s",
                background: isActive ? "linear-gradient(135deg, #0056D2, #0096FF)" : hasPost ? "#EEF4FF" : "#F5F5F7",
                color: isActive ? "#fff" : hasPost ? "#0056D2" : "#bbb",
                boxShadow: isActive ? "0 4px 12px rgba(0,86,210,0.3)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              },
              children: [
                region === "전체" ? "🗺️ 전체" : `${hd?.emoji || "📍"} ${region}`,
                count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: {
                  background: isActive ? "rgba(255,255,255,0.3)" : "#0056D2",
                  color: "#fff",
                  borderRadius: "10px",
                  padding: "1px 6px",
                  fontSize: `calc(10px * var(--fs, 1))`,
                  fontWeight: "900"
                }, children: count })
              ]
            },
            region
          );
        }) }),
        currentHarbors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              paddingBottom: "4px",
              marginBottom: "14px",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              animation: "harborSlideIn 0.28s cubic-bezier(0.22,1,0.36,1)",
              transformOrigin: "top left"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
                  @keyframes harborSlideIn {
                    from { opacity: 0; transform: translateY(-10px) scaleY(0.8); }
                    to   { opacity: 1; transform: translateY(0)    scaleY(1);   }
                  }
                ` }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => setSelectedHarbor(""),
                  style: {
                    flexShrink: 0,
                    padding: "5px 12px",
                    borderRadius: "14px",
                    border: "none",
                    fontSize: `calc(11px * var(--fs, 1))`,
                    fontWeight: "800",
                    cursor: "pointer",
                    background: !selectedHarbor ? "#1A1A2E" : "#F0F0F5",
                    color: !selectedHarbor ? "#fff" : "#555",
                    transition: "all 0.15s"
                  },
                  children: "전체 항구"
                }
              ),
              currentHarbors.map((harbor) => {
                const isActive = selectedHarbor === harbor.key;
                const count = harborCounts[harbor.key] || 0;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => setSelectedHarbor(harbor.key),
                    style: {
                      flexShrink: 0,
                      padding: "5px 12px",
                      borderRadius: "14px",
                      border: `1px solid ${isActive ? "#1A1A2E" : count > 0 ? "#888" : "#DDD"}`,
                      fontSize: `calc(11px * var(--fs, 1))`,
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      background: isActive ? "#1A1A2E" : count > 0 ? "#F5F5F7" : "#FAFAFA",
                      color: isActive ? "#fff" : count > 0 ? "#333" : "#CCC",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    },
                    children: [
                      "⚓ ",
                      harbor.label,
                      count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: {
                        background: isActive ? "rgba(255,255,255,0.25)" : "#555",
                        color: "#fff",
                        borderRadius: "8px",
                        padding: "0px 5px",
                        fontSize: `calc(9px * var(--fs, 1))`,
                        fontWeight: "900"
                      }, children: count })
                    ]
                  },
                  harbor.key
                );
              })
            ]
          },
          selectedBusinessRegion
        ),
        effectiveBusinessPosts.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "40px 0", color: "#aaa" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(32px * var(--fs, 1))`, marginBottom: "8px" }, children: "🚢" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700" }, children: selectedBusinessRegion === "전체" ? "등록된 홍보글이 없습니다" : `${selectedBusinessRegion} 지역 홍보글이 없습니다` })
        ] }),
        effectiveBusinessPosts.map((post, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(React.Fragment, { children: [
          post.isPinned ? (
            /* VVIP 프리미엄 대형 카드 */
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#FEFCF5", borderRadius: "20px", marginBottom: "20px", boxShadow: "0 12px 40px rgba(255,215,0,0.25)", border: "2.5px solid #FFD700", overflow: "hidden" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(90deg, #FFD700, #FF9B26)", color: "#5C3A00", padding: "10px 16px", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "950", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { display: "flex", alignItems: "center", gap: "6px" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { size: 14, fill: "#5C3A00" }),
                  " VVIP 프리미엄 스폰서 — 해당 항구 1위 독점"
                ] }),
                (isAdmin || post.author_email === user?.email) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "6px", alignItems: "center" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      onClick: (e) => {
                        e.stopPropagation();
                        navigate(`/write-business?editId=${String(post._id || post.id)}`);
                      },
                      style: { background: "rgba(0,0,0,0.12)", border: "none", cursor: "pointer", color: "#5C3A00", borderRadius: "6px", padding: "3px 8px", fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "900", display: "flex", alignItems: "center", gap: "3px" },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { size: 11 }),
                        " 수정"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      onClick: (e) => handleDeletePost(e, String(post._id || post.id), "business"),
                      style: { background: "rgba(0,0,0,0.12)", border: "none", cursor: "pointer", color: "#5C3A00", borderRadius: "6px", padding: "3px 8px", fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "900", display: "flex", alignItems: "center", gap: "3px" },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 11 }),
                        " 삭제"
                      ]
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", cursor: "pointer" }, onClick: () => setSelectedBusinessPost(post), children: [
                Array.isArray(post.images) && post.images.length > 0 || post.cover ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ImageGallery,
                  {
                    images: post.images,
                    image: post.cover,
                    maxHeight: 220,
                    borderRadius: "0",
                    showZoom: false
                  }
                ) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "100%", height: "220px", background: "#E8EBF0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: `calc(48px * var(--fs, 1))` }, children: "🚢" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", bottom: "12px", left: "12px", background: "rgba(0,0,0,0.65)", color: "#FFD700", padding: "5px 14px", borderRadius: "20px", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "900", pointerEvents: "none" }, children: [
                  "👑 ",
                  post.region || "항구 전용 VVIP"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "12px", right: "12px", background: "#FF5A5F", color: "#fff", padding: "5px 12px", borderRadius: "8px", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "950", pointerEvents: "none" }, children: "예약 모집중" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "20px 18px", cursor: "pointer" }, onClick: () => setSelectedBusinessPost(post), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(22px * var(--fs, 1))`, fontWeight: "950", color: "#1A1A2E", marginBottom: "10px" }, children: post.shipName }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { margin: "0 0 16px", fontSize: `calc(14px * var(--fs, 1))`, color: "#333", lineHeight: "1.8", fontWeight: "600" }, children: [
                  (post.content || "").slice(0, 140),
                  (post.content || "").length > 140 ? "..." : ""
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px", fontSize: `calc(13px * var(--fs, 1))` }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { background: "#F4F6FA", padding: "7px 14px", borderRadius: "12px", color: "#333", fontWeight: "800" }, children: [
                    "🎣 ",
                    post.target
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { background: "#F4F6FA", padding: "7px 14px", borderRadius: "12px", color: "#333", fontWeight: "800" }, children: [
                    "📅 ",
                    post.date
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { background: "#FFF3E0", padding: "7px 14px", borderRadius: "12px", color: "#E65100", fontWeight: "950" }, children: [
                    "💰 ",
                    post.price
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "0 18px 20px", display: "flex", gap: "12px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: (e) => {
                  e.stopPropagation();
                  window.location.href = `tel:${post.phone || ""}`;
                }, style: { flex: 1, backgroundColor: "#0056D2", color: "#fff", border: "none", padding: "18px", borderRadius: "16px", fontWeight: "950", fontSize: `calc(16px * var(--fs, 1))`, display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", cursor: "pointer", boxShadow: "0 6px 18px rgba(0,86,210,0.3)" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 20, fill: "#fff" }),
                  " 선장님께 즉시 전화"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: (e) => {
                  e.stopPropagation();
                  window.location.href = `sms:${post.phone || ""}?body=${encodeURIComponent(`안녕하세요! 낚시GO에서 [${post.shipName}] 선상낚시 예약 문의드립니다.

▶ 원하는 날짜:
▶ 인원:
▶ 기타 문의:`)}`;
                }, style: { backgroundColor: "#fff", color: "#00875A", border: "2px solid #00875A", padding: "18px 20px", borderRadius: "16px", fontWeight: "900", fontSize: `calc(15px * var(--fs, 1))`, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { size: 20 }),
                  " 문자 보내기"
                ] })
              ] })
            ] })
          ) : null,
          !post.isPinned && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
            backgroundColor: "#fff",
            borderRadius: "16px",
            marginBottom: "12px",
            boxShadow: post.region === "전국 (전체)" ? "0 4px 16px rgba(0,86,210,0.15)" : "0 2px 8px rgba(0,0,0,0.04)",
            border: post.region === "전국 (전체)" ? "1.5px solid #0056D2" : "1px solid #F0F2F7",
            overflow: "hidden"
          }, children: [
            post.region === "전국 (전체)" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
              background: "linear-gradient(90deg, #0056D2, #0096FF)",
              color: "#fff",
              padding: "7px 14px",
              fontSize: `calc(11px * var(--fs, 1))`,
              fontWeight: "900",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "🌐 MASTER 공식 전국 홍보 — 모든 지역 출항 정보" }),
              (isAdmin || post.author_email === user?.email) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "4px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: (e) => {
                      e.stopPropagation();
                      navigate(`/write-business?editId=${String(post._id || post.id)}`);
                    },
                    style: { background: "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", color: "#fff", borderRadius: "6px", padding: "2px 7px", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", display: "flex", alignItems: "center", gap: "2px" },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { size: 10 }),
                      " 수정"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: (e) => handleDeletePost(e, String(post._id || post.id), "business"),
                    style: { background: "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", color: "#fff", borderRadius: "6px", padding: "2px 7px", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", display: "flex", alignItems: "center", gap: "2px" },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 10 }),
                      " 삭제"
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "12px", cursor: "pointer" }, onClick: () => setSelectedBusinessPost(post), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "12px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  style: { width: "76px", height: "76px", borderRadius: "12px", overflow: "hidden", flexShrink: 0, background: "#E8EBF0" },
                  onClick: (e) => e.stopPropagation(),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    ImageGallery,
                    {
                      images: post.images,
                      image: post.cover,
                      maxHeight: 76,
                      borderRadius: "0",
                      showZoom: false
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "5px", alignItems: "center", marginBottom: "5px" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, background: "#FF5A5F", color: "#fff", padding: "2px 6px", borderRadius: "5px", fontWeight: "950", flexShrink: 0 }, children: "모집중" }),
                  post.region === "전국 (전체)" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, background: "rgba(0,86,210,0.12)", color: "#0056D2", padding: "2px 7px", borderRadius: "5px", fontWeight: "900", flexShrink: 0 }, children: "🌐 전국" }) : post.region ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, background: "#F0F0F5", color: "#555", padding: "2px 7px", borderRadius: "5px", fontWeight: "800", flexShrink: 0 }, children: [
                    "📍 ",
                    post.region
                  ] }) : null,
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "950", color: "#1A1A2E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: post.shipName }),
                  (isAdmin || post.author_email === user?.email) && post.region !== "전국 (전체)" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "4px", marginLeft: "auto", flexShrink: 0 }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: (e) => {
                      e.stopPropagation();
                      navigate(`/write-business?editId=${String(post._id || post.id)}`);
                    }, style: { background: "none", border: "none", padding: 0, cursor: "pointer", color: "#0056D2" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { size: 14 }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: (e) => handleDeletePost(e, String(post._id || post.id), "business"), style: { background: "none", border: "none", padding: 0, cursor: "pointer", color: "#FF3B30" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 14 }) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { margin: "0 0 6px", fontSize: `calc(11px * var(--fs, 1))`, color: "#666", lineHeight: "1.5" }, children: [
                  (post.content || "").slice(0, 45),
                  (post.content || "").length > 45 ? "..." : ""
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: "4px", fontSize: `calc(10px * var(--fs, 1))` }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: "#F4F6FA", padding: "3px 8px", borderRadius: "6px", color: "#333" }, children: post.target }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: "#FFF3E0", padding: "3px 8px", borderRadius: "6px", color: "#E65100", fontWeight: "800" }, children: post.price })
                ] })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "8px 12px", background: "#F8F9FA", borderTop: "1px solid #F0F2F7", display: "flex", gap: "6px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: (e) => {
                e.stopPropagation();
                window.location.href = `tel:${post.phone || ""}`;
              }, style: { flex: 1, backgroundColor: "#0056D2", color: "#fff", border: "none", padding: "10px", borderRadius: "10px", fontWeight: "950", fontSize: `calc(12px * var(--fs, 1))`, display: "flex", justifyContent: "center", alignItems: "center", gap: "5px", cursor: "pointer" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 13, fill: "#fff" }),
                " 즉시 전화"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: (e) => {
                e.stopPropagation();
                window.location.href = `sms:${post.phone || ""}?body=${encodeURIComponent(`안녕하세요! 낚시GO에서 [${post.shipName}] 예약 문의드립니다.
▶ 날짜:
▶ 인원:`)}`;
              }, style: { backgroundColor: "#fff", color: "#00875A", border: "1.5px solid #00875A", padding: "10px 12px", borderRadius: "10px", fontWeight: "900", fontSize: `calc(12px * var(--fs, 1))`, display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { size: 13 }),
                " 문자"
              ] })
            ] })
          ] }),
          !canAccessPremium && (index + 1) % 5 === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { margin: "4px 0 12px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdSenseInFeed, { style: { borderRadius: "12px", overflow: "hidden" } }) })
        ] }, String(post._id || post.id))),
        !canAccessPremium && effectiveBusinessPosts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { margin: "4px 0 12px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdSenseDisplay, { style: { borderRadius: "12px", overflow: "hidden" } }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: sentinelRef, style: { height: 20 } }),
        loadingMore && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "0 16px 12px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonCard, { count: 2 }) }),
        page >= totalPages && posts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "20px", fontSize: `calc(13px * var(--fs, 1))`, color: "#bbb" }, children: "모든 게시글을 불러왔습니다 🎣" })
      ] })
    ) }),
    selectedBusinessPost && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", zIndex: 9990, display: "flex", alignItems: "flex-end", justifyContent: "center" },
        onClick: (e) => {
          if (e.target === e.currentTarget)
            setSelectedBusinessPost(null);
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
          width: "100%",
          maxWidth: "480px",
          background: "#fff",
          borderRadius: "28px 28px 0 0",
          maxHeight: "92dvh",
          overflowY: "auto",
          boxShadow: "0 -24px 80px rgba(0,0,0,0.4)",
          animation: "bsSlideUp 0.32s cubic-bezier(0.22,1,0.36,1)"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
              @keyframes bsSlideUp {
                from { transform: translateY(100%); opacity: 0; }
                to   { transform: translateY(0);    opacity: 1; }
              }
            ` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", justifyContent: "center", padding: "14px 0 0" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "44px", height: "5px", background: "#E0E0E8", borderRadius: "3px" } }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", justifyContent: "flex-end", padding: "8px 16px 4px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setSelectedBusinessPost(null), style: { border: "none", background: "#F2F2F7", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: `calc(18px * var(--fs, 1))`, color: "#888", fontWeight: "900" }, children: "✕" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", margin: "0 16px", borderRadius: "20px", overflow: "hidden" }, children: [
            Array.isArray(selectedBusinessPost.images) && selectedBusinessPost.images.length > 0 || selectedBusinessPost.cover ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              ImageGallery,
              {
                images: selectedBusinessPost.images,
                image: selectedBusinessPost.cover,
                maxHeight: 220,
                borderRadius: "0",
                showZoom: true
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "100%", height: "200px", background: "#E8EBF0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: `calc(56px * var(--fs, 1))`, borderRadius: "20px" }, children: "🚢" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "12px", left: "12px", pointerEvents: "none", zIndex: 2 }, children: selectedBusinessPost.isPinned ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(90deg,#FFD700,#FF9B26)", color: "#5C3A00", padding: "5px 14px", borderRadius: "20px", fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "950", display: "flex", alignItems: "center", gap: "5px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { size: 12, fill: "#5C3A00" }),
              " VVIP 독점"
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "#FF5A5F", color: "#fff", padding: "5px 12px", borderRadius: "20px", fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "950" }, children: "모집중" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", bottom: "12px", left: "12px", background: "rgba(0,0,0,0.6)", color: "#fff", padding: "5px 12px", borderRadius: "12px", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", pointerEvents: "none", zIndex: 2 }, children: [
              "📍 ",
              selectedBusinessPost.region || "지역 미표시"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", bottom: "12px", right: "12px", background: "#0056D2", color: "#fff", padding: "5px 12px", borderRadius: "12px", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "950", pointerEvents: "none", zIndex: 2 }, children: selectedBusinessPost.price || "문의" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "20px 20px 0" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(11px * var(--fs, 1))`, background: "#F0F5FF", color: "#0056D2", padding: "3px 10px", borderRadius: "8px", fontWeight: "900", flexShrink: 0 }, children: selectedBusinessPost.type || "선상낚시" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(24px * var(--fs, 1))`, fontWeight: "950", color: "#1A1A2E", marginBottom: "6px", lineHeight: 1.2 }, children: selectedBusinessPost.shipName }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#888", fontWeight: "700", marginBottom: "18px" }, children: [
              "선장 · ",
              selectedBusinessPost.author
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }, children: [
              { icon: "🎣", label: "대상어종", value: selectedBusinessPost.target },
              { icon: "📅", label: "운항 일정", value: selectedBusinessPost.date },
              { icon: "👥", label: "모집 인원", value: selectedBusinessPost.capacity != null ? `${selectedBusinessPost.capacity}명` : "문의" },
              { icon: "📞", label: "연락처", value: selectedBusinessPost.phone }
            ].map(({ icon, label, value }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#F8F9FC", borderRadius: "14px", padding: "12px 14px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#AAB0BE", fontWeight: "800", marginBottom: "4px" }, children: [
                icon,
                " ",
                label
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#1A1A2E", fontWeight: "800", lineHeight: 1.3 }, children: value || "-" })
            ] }, label)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#F8F9FC", borderRadius: "16px", padding: "16px", marginBottom: "20px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#AAB0BE", fontWeight: "800", marginBottom: "10px" }, children: "🚢 선박 소개" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(14px * var(--fs, 1))`, color: "#333", lineHeight: "1.8", fontWeight: "600", margin: 0, whiteSpace: "pre-wrap" }, children: selectedBusinessPost.content || "소개 내용이 없습니다." })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "0 20px 36px", display: "flex", flexDirection: "column", gap: "10px", background: "#fff", borderTop: "1px solid #F0F2F7", paddingTop: "16px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "12px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => {
                    window.location.href = `tel:${selectedBusinessPost.phone || ""}`;
                  },
                  style: { flex: 1, backgroundColor: "#0056D2", color: "#fff", border: "none", padding: "17px", borderRadius: "16px", fontWeight: "950", fontSize: `calc(16px * var(--fs, 1))`, display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", cursor: "pointer", boxShadow: "0 6px 20px rgba(0,86,210,0.35)" },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 20, fill: "#fff" }),
                    " 선장님께 즉시 전화"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => {
                    window.location.href = `sms:${selectedBusinessPost.phone || ""}?body=${encodeURIComponent(`안녕하세요! 낚시GO에서 [${selectedBusinessPost.shipName}] 선상낚시 예약 문의드립니다.

▶ 원하는 날짜:
▶ 인원:
▶ 기타 문의:`)}`;
                  },
                  style: { backgroundColor: "#fff", color: "#00875A", border: "2px solid #00875A", padding: "17px 20px", borderRadius: "16px", fontWeight: "900", fontSize: `calc(15px * var(--fs, 1))`, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", flexShrink: 0 },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { size: 20 }),
                    " 문자 보내기"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "10px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => shareExternal({
                    title: `🚢 ${selectedBusinessPost.shipName} | 낚시GO 선상배 홍보`,
                    text: `${selectedBusinessPost.region || ""} · ${selectedBusinessPost.target || ""} · ${selectedBusinessPost.price || ""}`,
                    url: window.location.href,
                    imgUrl: selectedBusinessPost.images?.[0] || selectedBusinessPost.cover,
                    addToast
                  }),
                  style: { flex: 1, padding: "14px", border: "1.5px solid #0056D2", borderRadius: "16px", background: "rgba(0,86,210,0.05)", color: "#0056D2", fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { size: 18 }),
                    " 공유하기"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: async () => {
                    if (!user) {
                      addToast("로그인 후 이용하세요.", "error");
                      return;
                    }
                    try {
                      const res = await apiClient.get("/api/user/crews");
                      setMyCrews(Array.isArray(res.data) ? res.data : []);
                    } catch {
                      setMyCrews([]);
                    }
                    setShareTarget(null);
                    setShareModal({ post: { ...selectedBusinessPost, _bizShare: true } });
                  },
                  style: { flex: 1, padding: "14px", border: "1.5px solid #00875A", borderRadius: "16px", background: "rgba(0,135,90,0.05)", color: "#00875A", fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
                  children: "💬 크루 채팅방"
                }
              )
            ] })
          ] })
        ] })
      }
    ),
    !(activeTab === "notice" && !isAdmin) && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: handleFabClick,
        style: {
          position: "fixed",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
          right: "max(20px, calc(50% - 220px))",
          backgroundColor: activeTab === "notice" ? "#FF3B30" : "#0056D2",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          width: "56px",
          height: "56px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: activeTab === "notice" ? "0 8px 16px rgba(255,59,48,0.4)" : "0 8px 16px rgba(0,86,210,0.4)",
          cursor: "pointer",
          zIndex: 100,
          transition: "transform 0.2s"
        },
        onMouseEnter: (e) => e.currentTarget.style.transform = "scale(1.05)",
        onMouseLeave: (e) => e.currentTarget.style.transform = "scale(1)",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(PlusCircle, { size: 32 })
      }
    ),
    crewPassModal && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" },
        onClick: (e) => {
          if (e.target === e.currentTarget)
            setCrewPassModal(null);
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { width: "100%", maxWidth: "480px", background: "linear-gradient(180deg,#1A1A2E,#0D1117)", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", border: "1px solid rgba(0,86,210,0.3)", borderBottom: "none", boxShadow: "0 -20px 60px rgba(0,0,0,0.5)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "40px", height: "4px", background: "rgba(255,255,255,0.2)", borderRadius: "2px", margin: "0 auto 22px" } }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "44px", height: "44px", borderRadius: "14px", background: "rgba(0,86,210,0.2)", border: "1px solid rgba(0,86,210,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { size: 20, color: "#64B5F6" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(17px * var(--fs, 1))`, fontWeight: "900", color: "#fff" }, children: "🔒 프라이빗 크루" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "rgba(255,255,255,0.45)", fontWeight: "700", marginTop: "2px" }, children: crewPassModal.crew.name })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "16px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)", fontWeight: "800", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }, children: "입장 코드 4자리" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "password",
                maxLength: 20,
                autoFocus: true,
                value: crewPassInput,
                onChange: (e) => setCrewPassInput(e.target.value),
                onKeyDown: async (e) => {
                  if (e.key === "Enter" && !crewPassLoading) {
                    if (!crewPassInput.trim())
                      return;
                    setCrewPassLoading(true);
                    try {
                      const crew = crewPassModal.crew;
                      const crewId = String(crew._id || crew.id);
                      await apiClient.post(`/api/community/crews/${crewId}/join`, { password: crewPassInput, email: user.email, name: user.name });
                      setMyCrewIds((prev) => /* @__PURE__ */ new Set([...prev, crewId]));
                      setCrewPassModal(null);
                      navigate(`/crew/${crewId}/chat`);
                    } catch (err) {
                      addToast(err.response?.data?.error || "입장 코드가 일치하지 않습니다.", "error");
                    } finally {
                      setCrewPassLoading(false);
                    }
                  }
                },
                placeholder: "입장 코드를 입력하세요",
                style: { width: "100%", padding: "16px 18px", background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(0,86,210,0.4)", borderRadius: "16px", color: "#fff", fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "800", outline: "none", letterSpacing: "0.15em", boxSizing: "border-box" }
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "10px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setCrewPassModal(null),
                style: { flex: 1, padding: "15px", border: "none", borderRadius: "16px", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)", fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer" },
                children: "취소"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                disabled: crewPassLoading || !crewPassInput.trim(),
                onClick: async () => {
                  if (!crewPassInput.trim() || crewPassLoading)
                    return;
                  setCrewPassLoading(true);
                  try {
                    const crew = crewPassModal.crew;
                    const crewId = String(crew._id || crew.id);
                    await apiClient.post(`/api/community/crews/${crewId}/join`, { password: crewPassInput, email: user.email, name: user.name });
                    setMyCrewIds((prev) => /* @__PURE__ */ new Set([...prev, crewId]));
                    setCrewPassModal(null);
                    navigate(`/crew/${crewId}/chat`);
                  } catch (err) {
                    addToast(err.response?.data?.error || "입장 코드가 일치하지 않습니다.", "error");
                  } finally {
                    setCrewPassLoading(false);
                  }
                },
                style: { flex: 2, padding: "15px", border: "none", borderRadius: "16px", background: crewPassLoading || !crewPassInput.trim() ? "rgba(0,86,210,0.3)" : "linear-gradient(135deg,#0056D2,#1565C0)", color: "#fff", fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "950", cursor: crewPassLoading ? "not-allowed" : "pointer", transition: "opacity 0.2s" },
                children: crewPassLoading ? "확인 중..." : "입장하기 🔓"
              }
            )
          ] })
        ] })
      }
    ),
    shareModal && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        style: { position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" },
        onClick: () => setShareModal(null),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: (e) => e.stopPropagation(), style: { width: "100%", maxWidth: "480px", background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 20px 32px", boxShadow: "0 -8px 32px rgba(0,0,0,0.18)", maxHeight: "70vh", display: "flex", flexDirection: "column" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "900", color: "#1c1c1e" }, children: "📤 크루 채팅방에 공유" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShareModal(null), style: { background: "none", border: "none", cursor: "pointer", padding: 4 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 20, color: "#8e8e93" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#F8F9FA", borderRadius: "14px", padding: "12px 14px", marginBottom: "16px", display: "flex", gap: "10px", alignItems: "center", border: "1px solid #E5E5EA" }, children: [
            (shareModal.post.images?.[0] || shareModal.post.image || shareModal.post.cover) && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: shareModal.post.images?.[0] || shareModal.post.image || shareModal.post.cover, alt: "", style: { width: "52px", height: "52px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 } }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#0056D2", fontWeight: "800", marginBottom: "3px" }, children: shareModal.post._bizShare ? `🚢 선상배 홍보 • ${shareModal.post.author || shareModal.post.shipName || ""}` : `${shareModal.post.category || "전체"} • ${shareModal.post.author}` }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#1c1c1e", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: shareModal.post._bizShare ? `${shareModal.post.shipName || "선상낚시"} — ${shareModal.post.target || ""} (${shareModal.post.region || ""})` : (shareModal.post.content || "").slice(0, 60) || "(내용 없음)" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#8e8e93", fontWeight: "700", marginBottom: "8px" }, children: [
            "내가 속한 크루 (",
            myCrews.length,
            ")"
          ] }),
          myCrews.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "24px", color: "#aaa", fontSize: `calc(14px * var(--fs, 1))` }, children: "가입된 크루가 없습니다." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }, children: myCrews.map((crew) => {
            const crewId = String(crew._id || crew.id);
            const selected = String(shareTarget?._id || shareTarget?.id) === crewId;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                onClick: () => setShareTarget(crew),
                style: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "14px", cursor: "pointer", background: selected ? "#EEF4FF" : "#F8F9FA", border: selected ? "2px solid #0056D2" : "1.5px solid transparent", transition: "all 0.15s" },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "40px", height: "40px", borderRadius: "50%", background: selected ? "#0056D2" : "#E0E0E0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(20px * var(--fs, 1))` }, children: crew.emoji || "🎣" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "800", color: selected ? "#0056D2" : "#1c1c1e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: crew.name }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#8e8e93" }, children: [
                      "멤버 ",
                      crew.memberList?.length || crew.members || 0,
                      "명"
                    ] })
                  ] }),
                  selected && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "20px", height: "20px", borderRadius: "50%", background: "#0056D2", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#fff", fontSize: `calc(12px * var(--fs, 1))` }, children: "✓" }) })
                ]
              },
              crewId
            );
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              disabled: !shareTarget || sharing,
              onClick: async () => {
                if (!shareTarget || sharing)
                  return;
                setSharing(true);
                const crewId = String(shareTarget._id || shareTarget.id);
                const post = shareModal.post;
                try {
                  if (!shareSockets.current[crewId] || !shareSockets.current[crewId].connected) {
                    let tok;
                    try {
                      tok = localStorage.getItem("access_token") || void 0;
                    } catch {
                      tok = void 0;
                    }
                    const s = lookup(SOCKET_URL, { transports: ["websocket", "polling"], auth: { token: tok } });
                    shareSockets.current[crewId] = s;
                    await new Promise((res, rej) => {
                      const t = setTimeout(() => rej(new Error("연결 타임아웃")), 5e3);
                      s.once("connect", () => {
                        clearTimeout(t);
                        res();
                      });
                      s.once("connect_error", (e) => {
                        clearTimeout(t);
                        rej(e);
                      });
                    });
                    s.emit("join_crew", crewId);
                  }
                  shareSockets.current[crewId].emit("send_msg", {
                    crewId,
                    type: "post_share",
                    postId: String(post._id || post.id),
                    postTitle: post._bizShare ? `🚢 ${post.shipName || "선상낚시"} — ${post.target || ""} (${post.region || ""})` : (post.content || "").slice(0, 60) || "(내용 없음)",
                    postPreview: post._bizShare ? `${post.type || "선상낚시"} · ${post.price || "문의"} · 정원 ${post.capacity || "?"}명` : (post.content || "").slice(0, 120),
                    postImage: post.images?.[0] || post.image || post.cover || "",
                    postCategory: post._bizShare ? "🚢 선상배 홍보" : post.category || "전체"
                  });
                  addToast(`✅ ${shareTarget.name} 채팅방에 공유했습니다!`, "success");
                  setShareModal(null);
                } catch (err) {
                  if (shareSockets.current[crewId]) {
                    try {
                      shareSockets.current[crewId].disconnect();
                    } catch {
                    }
                    delete shareSockets.current[crewId];
                  }
                  addToast("공유에 실패했습니다. 잠시 후 다시 시도해주세요.", "error");
                } finally {
                  setSharing(false);
                }
              },
              style: { width: "100%", padding: "16px", border: "none", borderRadius: "16px", background: !shareTarget || sharing ? "#E5E5EA" : "linear-gradient(135deg,#0056D2,#1565C0)", color: !shareTarget || sharing ? "#aaa" : "#fff", fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "900", cursor: !shareTarget || sharing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 18 }),
                sharing ? "공유 중..." : shareTarget ? `${shareTarget.name}에 공유하기` : "크루를 선택하세요"
              ]
            }
          )
        ] })
      }
    )
  ] });
}

export { CommunityTab as default };
