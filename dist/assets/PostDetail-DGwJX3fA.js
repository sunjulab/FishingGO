import { u as useUserStore, b as useToastStore, A as ADMIN_ID, a as ADMIN_EMAIL, c as apiClient, j as jsxRuntimeExports } from './index-CUv3Hibb.js';
import { u as useNavigate, h as useParams, b as useLocation, r as reactExports } from './vendor-react-BzbiWsGG.js';
import { d as ChevronLeft, K as Share2, ab as MoreVertical, G as Pen, u as Trash2, e as ChevronRight, n as MapPin, J as Heart, h as MessageSquare, S as ShoppingBag, ac as ExternalLink, f as User, k as Send } from './vendor-icons-C5BxRig-.js';
import { I as ImageGallery } from './ImageGallery-CzQMj38k.js';
import { s as shareExternal } from './shareUtils-DAfr_lha.js';
import { A as AdSenseDisplay } from './AdSenseAd-DkzE279q.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

const PLAY_STORE_URL = "https://play.google.com/apps/internaltest/4701312289208373704";
const APP_ID = "kr.fishinggo.app";
function AppInstallBanner({ postId }) {
  const [visible, setVisible] = reactExports.useState(true);
  const isNative = typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();
  const isAndroid = /android/i.test(navigator.userAgent);
  if (isNative || !isAndroid || !visible)
    return null;
  const handleOpen = () => {
    const intentUrl = `intent://post?postId=${postId}#Intent;scheme=fishinggo;package=${APP_ID};S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;
    window.location.href = intentUrl;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "linear-gradient(135deg, #0B1F3A, #0056D2)",
    padding: "10px 14px",
    position: "sticky",
    top: 0,
    zIndex: 200
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "/og-image.png", alt: "낚시GO", style: { width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0 } }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", fontWeight: "900", color: "#fff" }, children: "낚시GO 앱에서 보기" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.7)" }, children: "앱에서 더 편리하게 확인하세요!" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: handleOpen,
        style: { flexShrink: 0, background: "#FEE500", border: "none", borderRadius: "10px", padding: "7px 13px", fontSize: "12px", fontWeight: "900", color: "#191919", cursor: "pointer" },
        children: "앱 열기"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setVisible(false),
        style: { flexShrink: 0, background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "18px", cursor: "pointer", padding: "0 4px", lineHeight: 1 },
        children: "×"
      }
    )
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
  return `${Math.floor(diff / 86400)}일 전`;
}
const CATEGORY_COLORS = {
  "찌낚시": "#0056D2",
  "루어": "#FF5A5F",
  "선상": "#FF9B26",
  "에깅": "#7C3AED",
  "원투": "#059669",
  "갯바위": "#DC2626",
  "민물": "#0891B2"
};
function PostDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const postIds = location.state?.postIds || [];
  const currentIndex = location.state?.currentIndex ?? -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < postIds.length - 1;
  const goBack = () => {
    sessionStorage.setItem("community_return_post_id", id);
    sessionStorage.setItem("community_return_tab", "open");
    if (window.history.length <= 1) {
      navigate("/community", { replace: true });
    } else {
      navigate(-1);
    }
  };
  const navigateToPost = (newIndex) => {
    const targetId = postIds[newIndex];
    sessionStorage.setItem("community_return_post_id", targetId);
    sessionStorage.setItem("community_return_tab", "open");
    navigate(`/post/${targetId}`, {
      replace: true,
      state: { postIds, currentIndex: newIndex }
    });
  };
  const user = useUserStore((state) => state.user);
  const canAccessPremium = ["BUSINESS_LITE", "PRO", "BUSINESS_VIP", "MASTER"].includes(user?.tier);
  const addToast = useToastStore((state) => state.addToast);
  const [post, setPost] = reactExports.useState(null);
  const [comment, setComment] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [liked, setLiked] = reactExports.useState(false);
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [coupangProducts, setCoupangProducts] = reactExports.useState([]);
  const extractKeyword = (p) => {
    if (!p)
      return "낚시 채비";
    const cat = p.category || "";
    const content = p.content || "";
    const fishMatch = content.match(/(감성돔|벵에돔|참돔|방어|광어|대구|우럭|농어|삼치|고등어|갈치|볼락|도다리|문어|쭈꾸미|갑오징어|배스|붕어|잉어|쏘가리|민어|돌돔|청어|숭어|학공치)/);
    const fish = fishMatch ? fishMatch[0] : "";
    if (fish && cat)
      return `${cat} ${fish} 채비`;
    if (cat)
      return `${cat} 낚시 장비`;
    if (fish)
      return `${fish} 낚시 채비`;
    return "낚시 채비 추천";
  };
  const [showMenu, setShowMenu] = reactExports.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = reactExports.useState(false);
  const isAdmin = useUserStore(
    (state) => state.user?.id === ADMIN_ID || state.user?.email === ADMIN_EMAIL
  );
  const isAuthor = post && user && post.author_email === user.email;
  const canEdit = isAdmin || isAuthor;
  const deleteComment = async (commentId) => {
    const originalComments = post?.comments ? [...post.comments] : [];
    try {
      setPost((prev) => ({ ...prev, comments: originalComments.filter((c) => (c._id?.toString() || c.id) !== commentId) }));
      await apiClient.delete(`/api/community/posts/${id}/comments/${commentId}`);
    } catch (err) {
      addToast(err.response?.data?.error || "삭제 실패했습니다.", "error");
      setPost((prev) => ({ ...prev, comments: originalComments }));
    }
  };
  const fetchPost = reactExports.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/api/community/posts/${id}`);
      setPost(res.data);
      if (user?.email && Array.isArray(res.data.likedBy)) {
        setLiked(res.data.likedBy.includes(user.email));
      }
    } catch (err) {
      if (err.response?.status === 404)
        setError("게시글을 찾을 수 없습니다.");
      else
        setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id, user?.email]);
  reactExports.useEffect(() => {
    setLoading(true);
    setPost(null);
    setError(null);
    setLiked(false);
    setComment("");
    setCoupangProducts([]);
  }, [id]);
  reactExports.useEffect(() => {
    fetchPost();
  }, [fetchPost]);
  reactExports.useEffect(() => {
    if (!post)
      return;
    const kw = extractKeyword(post);
    apiClient.get(`/api/commerce/coupang/search?keyword=${encodeURIComponent(kw)}`).then((res) => {
      if (res.data.products?.length)
        setCoupangProducts(res.data.products.slice(0, 5));
    }).catch(() => {
    });
  }, [String(post?._id)]);
  const handleLike = async () => {
    if (user?.id === "GUEST") {
      addToast("로그인이 필요한 기능입니다.", "error");
      return;
    }
    if (liked) {
      addToast("이미 좋아요를 눌렀습니다. ❤️", "info");
      return;
    }
    setLiked(true);
    setPost((prev) => ({ ...prev, likes: (prev?.likes || 0) + 1 }));
    try {
      const res = await apiClient.patch(`/api/community/posts/${id}/like`);
      if (typeof res.data?.likes === "number") {
        setPost((prev) => ({ ...prev, likes: res.data.likes }));
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        if (typeof err.response?.data?.likes === "number") {
          setPost((prev) => ({ ...prev, likes: err.response.data.likes }));
        }
        return;
      }
      setLiked(false);
      setPost((prev) => ({ ...prev, likes: Math.max((prev?.likes || 1) - 1, 0) }));
      if (status === 401)
        addToast("로그인이 필요합니다.", "error");
    }
  };
  const submitComment = async () => {
    if (!user) {
      addToast("로그인이 필요합니다.", "error");
      return;
    }
    if (user?.id === "GUEST") {
      addToast("로그인이 필요합니다.", "error");
      return;
    }
    if (!comment.trim() || submitting)
      return;
    if (comment.trim().length > 500) {
      addToast("댓글은 500자 이내로 작성해주세요.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post(`/api/community/posts/${id}/comments`, {
        author: user.name,
        author_email: user.email || "",
        text: comment.trim()
      });
      setPost(res.data);
      setComment("");
      const userId = user.email || user.id;
      if (userId) {
        apiClient.post("/api/user/exp", { userId, action: "comment_write" }).catch(() => {
        });
      }
    } catch (err) {
      addToast(err.response?.data?.error || "코멘트 등록에 실패했습니다.", "error");
    } finally {
      setSubmitting(false);
    }
  };
  const openEdit = () => {
    setShowMenu(false);
    navigate(`/write?type=open&editId=${id}`);
  };
  const handleDelete = async () => {
    try {
      await apiClient.delete(`/api/community/posts/${id}`, {
        data: { email: user.email }
      });
      addToast("삭제되었습니다.", "success");
      navigate("/community");
    } catch (err) {
      addToast(err.response?.data?.error || "삭제 실패.", "error");
    }
  };
  const handleShare = reactExports.useCallback(async () => {
    await shareExternal({
      title: `낚시GO | ${post?.author}님의 조황`,
      text: post?.content?.slice(0, 80) || "낚시GO에서 조황을 확인하세요!",
      url: window.location.href,
      imgUrl: post?.image,
      addToast
    });
  }, [post?.author, post?.content, post?.image, addToast]);
  if (loading)
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-container", style: { display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "36px", height: "36px", border: "3px solid #0056D2", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(14px * var(--fs, 1))`, color: "#AAB0BE", fontWeight: "700" }, children: "불러오는 중..." })
    ] });
  if (error || !post)
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-container", style: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center", gap: "16px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(48px * var(--fs, 1))` }, children: "🎣" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(16px * var(--fs, 1))`, color: "#666", fontWeight: "700" }, children: error || "게시글을 찾을 수 없습니다." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: goBack, style: { padding: "12px 28px", backgroundColor: "#0056D2", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "800", fontSize: `calc(15px * var(--fs, 1))`, cursor: "pointer" }, children: "뒤로 가기" })
    ] });
  const categoryColor = CATEGORY_COLORS[post.category] || "#666";
  const commentCount = Array.isArray(post.comments) ? post.comments.length : post.comments || 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-container", style: { backgroundColor: "#fff", height: "100dvh", display: "flex", flexDirection: "column", paddingBottom: "env(safe-area-inset-bottom, 0px)" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AppInstallBanner, { postId: id }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px", display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#fff", borderBottom: "1px solid #F0F2F7", position: "sticky", top: 0, zIndex: 100 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: goBack, style: { border: "none", background: "#F2F2F7", padding: "8px", borderRadius: "10px", cursor: "pointer", display: "flex" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 20, color: "#1A1A2E" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { flex: 1, fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "950", color: "#1A1A2E", textAlign: "center" }, children: "조황 게시글" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "4px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleShare, style: { border: "none", background: "#F2F2F7", padding: "8px", borderRadius: "10px", cursor: "pointer", display: "flex" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { size: 18, color: "#666" }) }),
        canEdit && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowMenu((v) => !v), style: { border: "none", background: "#F2F2F7", padding: "8px", borderRadius: "10px", cursor: "pointer", display: "flex" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MoreVertical, { size: 18, color: "#666" }) }),
          showMenu && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", top: "44px", right: 0, background: "#fff", borderRadius: "14px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "1px solid #F0F2F7", zIndex: 200, minWidth: "130px", overflow: "hidden" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: openEdit, style: { width: "100%", padding: "13px 16px", border: "none", background: "none", display: "flex", alignItems: "center", gap: "10px", fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "700", color: "#1A1A2E", cursor: "pointer", textAlign: "left" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { size: 15, color: "#0056D2" }),
              " 수정하기"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: "1px", background: "#F0F2F7" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
              setShowDeleteConfirm(true);
              setShowMenu(false);
            }, style: { width: "100%", padding: "13px 16px", border: "none", background: "none", display: "flex", alignItems: "center", gap: "10px", fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "700", color: "#FF3B30", cursor: "pointer", textAlign: "left" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 15, color: "#FF3B30" }),
              " 삭제하기"
            ] })
          ] })
        ] })
      ] })
    ] }),
    postIds.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", backgroundColor: "#F8F9FA", borderBottom: "1px solid #F0F2F7", flexShrink: 0 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => hasPrev && navigateToPost(currentIndex - 1),
          disabled: !hasPrev,
          style: { display: "flex", alignItems: "center", gap: "3px", padding: "6px 12px", borderRadius: "10px", border: "none", background: hasPrev ? "#E8F0FE" : "transparent", color: hasPrev ? "#0056D2" : "#D0D5E0", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", cursor: hasPrev ? "pointer" : "default", transition: "all 0.15s" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 13 }),
            " 이전글"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#AAB0BE", fontWeight: "700" }, children: currentIndex >= 0 ? `${currentIndex + 1} / ${postIds.length}` : `1 / ${postIds.length}` }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => hasNext && navigateToPost(currentIndex + 1),
          disabled: !hasNext,
          style: { display: "flex", alignItems: "center", gap: "3px", padding: "6px 12px", borderRadius: "10px", border: "none", background: hasNext ? "#E8F0FE" : "transparent", color: hasNext ? "#0056D2" : "#D0D5E0", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", cursor: hasNext ? "pointer" : "default", transition: "all 0.15s" },
          children: [
            "다음글 ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 13 })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, overflowY: "auto", paddingBottom: "90px" }, onClick: () => setShowMenu(false), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#fff", margin: "12px", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "18px 18px 14px", display: "flex", alignItems: "center", gap: "12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              onClick: () => navigate(`/user/${encodeURIComponent(post.author)}`),
              style: { width: "46px", height: "46px", borderRadius: "14px", background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}88)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "950", fontSize: `calc(18px * var(--fs, 1))`, flexShrink: 0, cursor: "pointer" },
              children: post.author?.[0] || "?"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  onClick: () => navigate(`/user/${encodeURIComponent(post.author)}`),
                  style: { fontWeight: "950", fontSize: `calc(15px * var(--fs, 1))`, color: "#1A1A2E", cursor: "pointer" },
                  children: post.author
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", padding: "2px 8px", borderRadius: "6px", background: `${categoryColor}18`, color: categoryColor }, children: post.category })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#AAB0BE", fontWeight: "700", marginTop: "2px" }, children: timeAgo(post.createdAt) })
          ] })
        ] }),
        Array.isArray(post.images) && post.images.length > 0 || post.image ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          ImageGallery,
          {
            images: post.images,
            image: post.image,
            maxHeight: 320,
            borderRadius: "0",
            showZoom: true
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px 18px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(15px * var(--fs, 1))`, lineHeight: "1.75", color: "#1A1A2E", fontWeight: "600", whiteSpace: "pre-wrap", margin: 0 }, children: post.content }),
          post.location?.address && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "6px", marginTop: "12px", flexWrap: "wrap" }, children: [
            post.location.lat && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                onClick: () => navigate(`/?lat=${post.location.lat}&lng=${post.location.lng}`),
                style: {
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "rgba(0,86,210,0.07)",
                  border: "1px solid rgba(0,86,210,0.2)",
                  borderRadius: "20px",
                  padding: "5px 11px",
                  fontSize: `calc(12px * var(--fs, 1))`,
                  fontWeight: "700",
                  color: "#0056D2",
                  cursor: "pointer"
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 12 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: post.location.address }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, opacity: 0.7 }, children: "→ 지도" })
                ]
              }
            ),
            post.location.lat && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                onClick: () => window.open(`https://map.kakao.com/link/map/${encodeURIComponent(post.location.address)},${post.location.lat},${post.location.lng}`, "_blank"),
                style: {
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "#FFF9C4",
                  border: "1px solid #F9C400",
                  borderRadius: "20px",
                  padding: "5px 11px",
                  fontSize: `calc(12px * var(--fs, 1))`,
                  fontWeight: "700",
                  color: "#7C5000",
                  cursor: "pointer"
                },
                children: "🗺️ 카카오맵"
              }
            ),
            !post.location.lat && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "inline-flex", alignItems: "center", gap: "5px", background: "rgba(0,86,210,0.07)", border: "1px solid rgba(0,86,210,0.2)", borderRadius: "20px", padding: "5px 11px", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "700", color: "#0056D2" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 12 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: post.location.address })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "12px 18px 16px", display: "flex", gap: "20px", borderTop: "1px solid #F8F8F8" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: handleLike, style: { display: "flex", alignItems: "center", gap: "6px", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", color: liked ? "#FF5A5F" : "#AAB0BE", border: "none", background: "none", cursor: "pointer", padding: 0 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { size: 18, fill: liked ? "#FF5A5F" : "none", color: liked ? "#FF5A5F" : "#AAB0BE" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: post.likes || 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", color: "#AAB0BE" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { size: 18 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: commentCount })
          ] })
        ] })
      ] }),
      !canAccessPremium && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { margin: "8px 12px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdSenseDisplay, { style: { borderRadius: "12px", overflow: "hidden" } }) }),
      coupangProducts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { margin: "8px 12px", backgroundColor: "#fff", borderRadius: "20px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "3px", height: "18px", background: "#FF5A5F", borderRadius: "2px" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingBag, { size: 15, color: "#FF5A5F" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "950", color: "#1A1A2E" }, children: "이 낚시에 어울리는 용품" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => navigate("/shop"),
              style: { display: "flex", alignItems: "center", gap: "3px", fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "800", color: "#0056D2", border: "none", background: "none", cursor: "pointer", padding: 0 },
              children: [
                "전체보기 ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 13 })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "10px", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "4px" }, children: coupangProducts.map((item, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            onClick: () => navigate("/shop"),
            style: {
              flexShrink: 0,
              width: "130px",
              background: "#F8F9FA",
              borderRadius: "16px",
              overflow: "hidden",
              cursor: "pointer",
              border: "1.5px solid #F0F2F7",
              transition: "transform 0.15s"
            },
            onMouseDown: (e) => e.currentTarget.style.transform = "scale(0.97)",
            onMouseUp: (e) => e.currentTarget.style.transform = "scale(1)",
            onMouseLeave: (e) => e.currentTarget.style.transform = "scale(1)",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "130px", height: "100px", overflow: "hidden", background: "#eee" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: item.img,
                  alt: item.name,
                  loading: "lazy",
                  style: { width: "100%", height: "100%", objectFit: "cover" },
                  onError: (e) => {
                    e.target.style.display = "none";
                  }
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "8px 8px 10px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "800", color: "#1A1A2E", lineHeight: "1.35", marginBottom: "4px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }, children: item.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "950", color: "#1A1A2E" }, children: item.price }),
                  item.discount && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", color: "#FF5A5F", background: "rgba(255,90,95,0.1)", padding: "1px 5px", borderRadius: "4px" }, children: [
                    item.discount,
                    "↓"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "6px", padding: "5px 0", background: "linear-gradient(135deg,#FF5A5F,#FF3B30)", borderRadius: "8px", textAlign: "center", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { size: 9 }),
                  " 쿠팡 구매"
                ] })
              ] })
            ]
          },
          String(item.productId || item.id || idx)
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#AEAEB2", fontWeight: "600", textAlign: "right", marginTop: "8px", margin: "8px 0 0" }, children: "이 포스팅은 쿠팡 파트너스 활동의 일환으로 수수료를 받을 수 있습니다" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { margin: "0 12px", backgroundColor: "#fff", borderRadius: "20px", padding: "16px 18px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "950", color: "#1A1A2E", marginBottom: "16px" }, children: [
          "댓글 ",
          commentCount
        ] }),
        Array.isArray(post.comments) && post.comments.length > 0 ? post.comments.map((c, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "10px", marginBottom: "16px", alignItems: "flex-start" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              onClick: () => navigate(`/user/${encodeURIComponent(c.author)}`),
              style: { width: "34px", height: "34px", borderRadius: "10px", flexShrink: 0, background: "linear-gradient(135deg, #F0F5FF, #E0ECFF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "900", color: "#0056D2", cursor: "pointer" },
              children: c.author ? c.author[0] : /* @__PURE__ */ jsxRuntimeExports.jsx(User, { size: 16 })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  onClick: () => navigate(`/user/${encodeURIComponent(c.author)}`),
                  style: { fontWeight: "800", fontSize: `calc(13px * var(--fs, 1))`, color: "#1A1A2E", cursor: "pointer" },
                  children: c.author
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#D0D5E0", fontWeight: "700" }, children: timeAgo(c.createdAt) }),
                (isAdmin || user && c.author_email === user.email) && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => deleteComment(c._id?.toString() || c.id || String(c.createdAt)),
                    style: { border: "none", background: "none", cursor: "pointer", padding: "2px 4px", borderRadius: "6px", color: "#FF3B30", fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "900", lineHeight: 1 },
                    title: "댓글 삭제",
                    children: "×"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(14px * var(--fs, 1))`, color: "#444", lineHeight: "1.5", margin: 0, fontWeight: "600" }, children: c.text })
          ] })
        ] }, String(c._id || idx))) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "24px 0", color: "#D0D5E0", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700" }, children: "첫 댓글을 남겨보세요! 🎣" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "10px 16px", backgroundColor: "#fff", borderTop: "1px solid #F0F2F7", display: "flex", gap: "10px", alignItems: "center", boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          placeholder: "칭찬과 응원의 댓글을 남겨주세요 🎣",
          style: { flex: 1, padding: "12px 16px", borderRadius: "24px", backgroundColor: "#F2F2F7", border: "none", outline: "none", fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "600", color: "#1A1A2E" },
          value: comment,
          onChange: (e) => setComment(e.target.value),
          onKeyDown: (e) => e.key === "Enter" && !e.shiftKey && submitComment()
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: submitComment,
          disabled: !comment.trim() || submitting,
          style: { width: "42px", height: "42px", borderRadius: "50%", flexShrink: 0, background: comment.trim() ? "#0056D2" : "#E5E5EA", border: "none", cursor: comment.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 18, color: comment.trim() ? "#fff" : "#AAB0BE" })
        }
      )
    ] }),
    showDeleteConfirm && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9e3, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "20px", padding: "28px 24px", width: "100%", maxWidth: "320px", textAlign: "center" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(36px * var(--fs, 1))`, marginBottom: "12px" }, children: "🗑️" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(17px * var(--fs, 1))`, fontWeight: "900", color: "#1A1A2E", marginBottom: "8px" }, children: "게시글을 삭제할까요?" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#AAB0BE", marginBottom: "24px" }, children: "삭제된 게시글은 복구할 수 없습니다." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "10px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowDeleteConfirm(false), style: { flex: 1, padding: "13px", border: "1.5px solid #E5E5EA", borderRadius: "12px", background: "#fff", fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer", color: "#666" }, children: "취소" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleDelete, style: { flex: 1, padding: "13px", border: "none", borderRadius: "12px", background: "#FF3B30", fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "900", cursor: "pointer", color: "#fff" }, children: "삭제" })
      ] })
    ] }) })
  ] });
}

export { PostDetail as default };
