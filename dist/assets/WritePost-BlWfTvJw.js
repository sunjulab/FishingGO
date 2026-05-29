import { b as useToastStore, u as useUserStore, A as ADMIN_ID, a as ADMIN_EMAIL, c as apiClient, j as jsxRuntimeExports } from './index-rdBGUi8d.js';
import { u as useNavigate, f as useSearchParams, r as reactExports } from './vendor-react-BzbiWsGG.js';
import { X, k as Send, j as ChevronDown, n as MapPin, a8 as Scan, a9 as CheckCircle2 } from './vendor-icons-C5BxRig-.js';
import { R as RewardGateModal } from './AdUnit-BqORXC3x.js';
import { M as MultiImageUpload } from './MultiImageUpload-BINsASJj.js';
import './imageUtils-BQ2gh6yW.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

function WritePost() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const postType = searchParams.get("type") || "open";
  const editId = searchParams.get("editId");
  const [category, setCategory] = reactExports.useState("전체");
  const [title, setTitle] = reactExports.useState("");
  const [content, setContent] = reactExports.useState("");
  const [images, setImages] = reactExports.useState([]);
  const [imageLoading, setImageLoading] = reactExports.useState(false);
  const [showCategoryPopup, setShowCategoryPopup] = reactExports.useState(false);
  const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
  const [showAdGate, setShowAdGate] = reactExports.useState(false);
  const [aiAnalyzing, setAiAnalyzing] = reactExports.useState(false);
  const [showDraftBanner, setShowDraftBanner] = reactExports.useState(false);
  const [isPopup, setIsPopup] = reactExports.useState(false);
  const [location, setLocation] = reactExports.useState(null);
  const [locLoading, setLocLoading] = reactExports.useState(false);
  const [locEditMode, setLocEditMode] = reactExports.useState(false);
  const [locDraft, setLocDraft] = reactExports.useState("");
  const locInputRef = reactExports.useRef(null);
  const categories = ["전체", "루어", "찌낚시", "원투", "릴찌", "선상", "에깅", "조황 공유"];
  const addToast = useToastStore((state) => state.addToast);
  const userTier = useUserStore((state) => state.userTier);
  const storeUser = useUserStore((state) => state.user);
  const canAccessPremium = reactExports.useMemo(() => {
    const u = storeUser;
    if (u?.id === ADMIN_ID || u?.email === ADMIN_EMAIL)
      return true;
    return ["BUSINESS_LITE", "PRO", "BUSINESS_VIP", "MASTER"].includes(userTier);
  }, [userTier, storeUser?.id, storeUser?.email]);
  const user = useUserStore((state) => state.user);
  const isAdmin = useUserStore(
    (s) => s.user?.id === ADMIN_ID || s.user?.email === ADMIN_EMAIL || s.user?.email === ADMIN_ID || s.userTier === "MASTER"
  );
  const isNoticeType = postType === "notice";
  const isBusinessLite = canAccessPremium;
  const isEditMode = !!editId;
  reactExports.useEffect(() => {
    if (!isEditMode)
      return;
    const endpoint = isNoticeType ? `/api/community/notices/${editId}` : `/api/community/posts/${editId}`;
    apiClient.get(endpoint).then((res) => {
      setContent(res.data.content || "");
      setTitle(res.data.title || "");
      setCategory(res.data.category || "전체");
      const existingImages = Array.isArray(res.data.images) && res.data.images.length > 0 ? res.data.images : res.data.image ? [res.data.image] : [];
      setImages(existingImages);
      if (res.data.isPopup !== void 0)
        setIsPopup(!!res.data.isPopup);
    }).catch((err) => {
      if (false)
        console.warn("[WritePost] 수정 데이터 로드 실패:", err?.message);
      addToast("게시글 정보를 불러오지 못했습니다.", "error");
    });
  }, [editId, isNoticeType]);
  const DRAFT_KEY = reactExports.useMemo(() => `draft_post_${postType}`, [postType]);
  reactExports.useEffect(() => {
    if (isEditMode || isNoticeType)
      return;
    let saved = null;
    try {
      saved = localStorage.getItem(DRAFT_KEY);
    } catch {
    }
    if (saved && saved.trim().length > 0)
      setShowDraftBanner(true);
  }, [DRAFT_KEY, isEditMode, isNoticeType]);
  reactExports.useEffect(() => {
    if (isEditMode || isNoticeType)
      return;
    const timer = setTimeout(() => {
      if (content.trim().length > 0) {
        try {
          localStorage.setItem(DRAFT_KEY, content);
        } catch {
        }
      } else {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
        }
        setShowDraftBanner(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [content, isEditMode, isNoticeType]);
  reactExports.useEffect(() => {
    if (isNoticeType && !isAdmin) {
      addToast("❌ 공지사항은 운영자(마스터)만 작성할 수 있습니다.", "error");
      navigate("/community");
    }
  }, [isNoticeType, isAdmin, addToast, navigate]);
  const handlePostClick = () => {
    if (!user || user.id === "GUEST") {
      addToast("로그인이 필요합니다. 마이페이지에서 로그인해주세요.", "error");
      return;
    }
    const trimmedContent = content.trim();
    if (!trimmedContent)
      return addToast("내용을 입력해주세요.", "error");
    if (trimmedContent.length > 2e3)
      return addToast("게시글은 2,000자 이하로 작성해주세요.", "error");
    if (isNoticeType && !title.trim()) {
      addToast("제목을 입력해주세요.", "error");
      return;
    }
    if (isBusinessLite) {
      doPost();
    } else {
      setShowAdGate(true);
    }
  };
  const doPost = async () => {
    setIsSubmitting(true);
    const storedUser = user;
    if (!storedUser || storedUser.id === "GUEST") {
      addToast("로그인이 필요합니다. 마이페이지에서 로그인해주세요.", "error");
      setIsSubmitting(false);
      return;
    }
    try {
      const safeImages = images.filter((img) => img && img.length <= 4 * 1024 * 1024);
      const safeImage = safeImages[0] || null;
      if (isNoticeType) {
        const method = isEditMode ? "put" : "post";
        const url = isEditMode ? `/api/community/notices/${editId}` : `/api/community/notices`;
        const noticePayload = isEditMode ? { title: title.trim(), content, images: safeImages, image: safeImage, isPopup } : { title: title.trim(), content, isPinned: false, images: safeImages, image: safeImage, isPopup };
        await apiClient[method](url, noticePayload);
        addToast(isEditMode ? "📢 공지사항이 수정되었습니다!" : "📢 공지사항이 등록되었습니다!", "success");
        navigate(isEditMode ? -1 : "/community?tab=notice");
      } else {
        const method = isEditMode ? "put" : "post";
        const url = isEditMode ? `/api/community/posts/${editId}` : `/api/community/posts`;
        const body = isEditMode ? { content, category, email: storedUser.email, images: safeImages, image: safeImage } : { author: storedUser.name, author_email: storedUser.email, category, content, images: safeImages, image: safeImage, location: location || null };
        await apiClient[method](url, body);
        if (!isEditMode) {
          try {
            localStorage.removeItem(DRAFT_KEY);
          } catch {
          }
        }
        if (!isEditMode) {
          const userId = storedUser.email || storedUser.id;
          if (userId)
            apiClient.post("/api/user/exp", { userId, action: "post_write" }).catch(() => {
            });
        }
        addToast(isEditMode ? "✅ 게시글이 수정되었습니다!" : "게시글이 등록되었습니다! 🎉", "success");
        navigate(isEditMode ? -1 : "/community?tab=open");
      }
    } catch (err) {
      if (false)
        console.error("Post error:", err);
      const msg = err.response?.data?.error || "등록 실패. 서버를 확인해주세요.";
      addToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSubscribe = () => {
    setShowAdGate(false);
    addToast("비즈니스 라이트 구독 페이지로 이동합니다.", "info");
    navigate("/vvip-subscribe");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-container", style: { backgroundColor: "#fff", height: "100dvh", zIndex: 2e3 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px", paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => window.history.length <= 1 ? navigate("/community", { replace: true }) : navigate(-1), style: { border: "none", background: "none" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 24, color: "#1c1c1e" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontSize: `calc(17px * var(--fs, 1))`, fontWeight: "800" }, children: isNoticeType ? "📢 공지사항 작성" : postType === "business" ? "선상 배 홍보 등록" : "새 조황 공유하기" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          disabled: !content.trim() || isSubmitting,
          style: {
            border: "none",
            background: content.trim() ? "#0056D2" : "#f0f0f0",
            color: content.trim() ? "#fff" : "#bbb",
            padding: "6px 16px",
            borderRadius: "20px",
            fontSize: `calc(13px * var(--fs, 1))`,
            fontWeight: "800",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          },
          onClick: handlePostClick,
          children: [
            isSubmitting ? "저장 중..." : isEditMode ? "✅ 수정 완료" : "등록",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 14 })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "20px" }, children: [
      !isBusinessLite && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          onClick: handleSubscribe,
          style: {
            background: "linear-gradient(135deg, #0056D2, #0096FF)",
            borderRadius: "14px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,86,210,0.2)"
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(24px * var(--fs, 1))` }, children: "👑" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: "#fff" }, children: "비즈니스 라이트 — 월 ₩9,900" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.85)" }, children: "광고 없이 무제한 등록 (홍보글 제외)" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginLeft: "auto", fontSize: `calc(18px * var(--fs, 1))` }, children: "›" })
          ]
        }
      ),
      showDraftBanner && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        background: "linear-gradient(135deg, #FFF3CD, #FFFBE6)",
        border: "1.5px solid #FFD60A",
        borderRadius: "14px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "14px"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(20px * var(--fs, 1))` }, children: "📝" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: "#7A5900" }, children: "임시저장된 글이 있습니다" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#A07010", marginTop: "2px" }, children: "이전에 작성하다 중단된 내용을 복원할 수 있습니다." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "6px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => {
                let saved = null;
                try {
                  saved = localStorage.getItem(DRAFT_KEY);
                } catch {
                }
                if (saved) {
                  setContent(saved);
                  addToast("✅ 임시저장 내용을 복원했습니다.", "success");
                }
                setShowDraftBanner(false);
              },
              style: { padding: "6px 12px", borderRadius: "10px", border: "none", background: "#FFD60A", color: "#1A1A2E", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "900", cursor: "pointer" },
              children: "복원"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => {
                try {
                  localStorage.removeItem(DRAFT_KEY);
                } catch {
                }
                setShowDraftBanner(false);
              },
              style: { padding: "6px 10px", borderRadius: "10px", border: "1px solid #E5E5EA", background: "#fff", color: "#8E8E93", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer" },
              children: "삭제"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          onClick: () => setShowCategoryPopup(true),
          style: {
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            backgroundColor: "#f8f9fa",
            borderRadius: "12px",
            marginBottom: "16px",
            cursor: "pointer",
            border: "1px solid #eee"
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", color: "#0056D2" }, children: category }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 14, color: "#0056D2" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MultiImageUpload,
        {
          images,
          onChange: setImages,
          maxCount: 5,
          isLoading: imageLoading,
          label: "사진 추가"
        }
      ),
      isNoticeType && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            placeholder: "공지 제목을 입력하세요",
            value: title,
            onChange: (e) => setTitle(e.target.value),
            style: { width: "100%", border: "none", borderBottom: "1.5px solid #eee", fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "800", padding: "0 0 14px", marginBottom: "10px", outline: "none", color: "#1A1A2E" }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            onClick: () => setIsPopup((v) => !v),
            style: {
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              marginBottom: "14px",
              borderRadius: "12px",
              cursor: "pointer",
              userSelect: "none",
              background: isPopup ? "rgba(255,59,48,0.06)" : "#F8F9FA",
              border: `1.5px solid ${isPopup ? "#FF3B30" : "#E5E5EA"}`,
              transition: "all 0.15s"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
                width: "20px",
                height: "20px",
                borderRadius: "6px",
                flexShrink: 0,
                border: `2px solid ${isPopup ? "#FF3B30" : "#C7C7CC"}`,
                background: isPopup ? "#FF3B30" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s"
              }, children: isPopup && /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "10", height: "8", viewBox: "0 0 10 8", fill: "none", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M1 4L3.5 6.5L9 1", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: isPopup ? "#FF3B30" : "#1c1c1e" }, children: "🔔 홈화면 팝업으로 노출" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#8E8E93", marginTop: "2px" }, children: "체크 시 홈화면 시작 시 팝업으로 표시됩니다 (이미지 첨부 권장)" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(18px * var(--fs, 1))` }, children: isPopup ? "🔔" : "🔕" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          placeholder: isNoticeType ? "공지 내용을 입력하세요." : "현장 상황이나 조과를 자유롭게 공유해보세요. (예: 현재 강릉항 파고가 높습니다!)",
          style: { width: "100%", minHeight: "160px", border: "none", fontSize: `calc(16px * var(--fs, 1))`, lineHeight: "1.6", outline: "none", resize: "none", boxSizing: "border-box", marginTop: "12px" },
          onChange: (e) => setContent(e.target.value),
          value: content
        }
      ),
      !location && !locEditMode && null,
      locEditMode && !location && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(0,86,210,0.06)",
          border: "1.5px solid #0056D2",
          borderRadius: "20px",
          padding: "6px 12px"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 13, color: "#0056D2", style: { flexShrink: 0 } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: locInputRef,
              type: "text",
              value: locDraft,
              onChange: (e) => setLocDraft(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter") {
                  const addr = locDraft.trim();
                  if (addr) {
                    setLocation({ lat: null, lng: null, address: addr });
                    setLocEditMode(false);
                    addToast(`📍 위치 저장: ${addr}`, "success");
                  } else {
                    setLocEditMode(false);
                  }
                }
                if (e.key === "Escape") {
                  setLocEditMode(false);
                  setLocDraft("");
                }
              },
              placeholder: "낚시 위치를 입력하세요 (ex. 강릉항 방파제)",
              style: { flex: 1, border: "none", outline: "none", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "700", color: "#0056D2", background: "transparent" },
              autoFocus: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              const addr = locDraft.trim();
              if (addr) {
                setLocation({ lat: null, lng: null, address: addr });
                setLocEditMode(false);
                addToast(`📍 위치 저장: ${addr}`, "success");
              } else {
                setLocEditMode(false);
              }
            },
            style: { flexShrink: 0, padding: "5px 12px", borderRadius: "16px", border: "none", background: "#0056D2", color: "#fff", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer" },
            children: "확인"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              setLocEditMode(false);
              setLocDraft("");
            },
            style: { flexShrink: 0, width: "28px", height: "28px", borderRadius: "50%", border: "none", background: "#f0f0f0", color: "#888", fontSize: `calc(14px * var(--fs, 1))`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 14 })
          }
        )
      ] }),
      locEditMode && location && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(0,86,210,0.06)",
          border: "1.5px solid #0056D2",
          borderRadius: "20px",
          padding: "6px 12px"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 13, color: "#0056D2", style: { flexShrink: 0 } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: locInputRef,
              type: "text",
              value: locDraft,
              onChange: (e) => setLocDraft(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter") {
                  const addr = locDraft.trim();
                  if (addr) {
                    setLocation((prev) => ({ ...prev, address: addr }));
                  }
                  setLocEditMode(false);
                  if (addr)
                    addToast(`📍 수정 완료: ${addr}`, "success");
                }
                if (e.key === "Escape") {
                  setLocEditMode(false);
                }
              },
              placeholder: "낚시 위치를 수정하세요",
              style: { flex: 1, border: "none", outline: "none", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "700", color: "#0056D2", background: "transparent" },
              autoFocus: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              const addr = locDraft.trim();
              if (addr) {
                setLocation((prev) => ({ ...prev, address: addr }));
                addToast(`📍 수정 완료: ${addr}`, "success");
              }
              setLocEditMode(false);
            },
            style: { flexShrink: 0, padding: "5px 12px", borderRadius: "16px", border: "none", background: "#0056D2", color: "#fff", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer" },
            children: "확인"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setLocEditMode(false),
            style: { flexShrink: 0, width: "28px", height: "28px", borderRadius: "50%", border: "none", background: "#f0f0f0", color: "#888", fontSize: `calc(14px * var(--fs, 1))`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 14 })
          }
        )
      ] }),
      location && !locEditMode && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "10px", maxWidth: "100%" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: "rgba(0,86,210,0.08)",
              border: "1.5px solid rgba(0,86,210,0.25)",
              borderRadius: "20px",
              padding: "6px 12px",
              fontSize: `calc(12px * var(--fs, 1))`,
              fontWeight: "700",
              color: "#0056D2",
              maxWidth: "200px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 13, style: { flexShrink: 0 } }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { overflow: "hidden", textOverflow: "ellipsis" }, children: location.address })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              setLocDraft(location.address);
              setLocEditMode(true);
            },
            style: { flexShrink: 0, padding: "4px 10px", borderRadius: "14px", border: "1px solid rgba(0,86,210,0.3)", background: "rgba(0,86,210,0.06)", color: "#0056D2", fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer" },
            children: "✏️ 수정"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              setLocation(null);
              setLocDraft("");
              addToast("📍 위치가 제거되었습니다.", "info");
            },
            style: { flexShrink: 0, width: "24px", height: "24px", borderRadius: "50%", border: "none", background: "#f0f0f0", color: "#888", fontSize: `calc(12px * var(--fs, 1))`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 12 })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "480px",
        padding: "12px 20px",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        backgroundColor: "#fff",
        borderTop: "1px solid #f0f0f0",
        zIndex: 200
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "12px", marginTop: "10px", alignItems: "center" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            onClick: async () => {
              if (location) {
                setLocDraft(location.address);
                setLocEditMode(true);
                return;
              }
              if (locEditMode) {
                setLocEditMode(false);
                setLocDraft("");
                return;
              }
              if (!navigator.geolocation) {
                setLocEditMode(true);
                return;
              }
              setLocLoading(true);
              navigator.geolocation.getCurrentPosition(
                async (pos) => {
                  const { latitude: lat, longitude: lng } = pos.coords;
                  let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                  try {
                    await new Promise((resolve) => {
                      if (window.kakao?.maps?.services?.Geocoder) {
                        resolve();
                        return;
                      }
                      window.kakao.maps.load(resolve);
                    });
                    const geocoder = new window.kakao.maps.services.Geocoder();
                    await new Promise((resolve) => {
                      geocoder.coord2Address(lng, lat, (result, status) => {
                        if (status === window.kakao.maps.services.Status.OK && result[0]) {
                          const road = result[0].road_address?.address_name;
                          const jibun = result[0].address?.address_name;
                          address = road || jibun || address;
                        }
                        resolve();
                      });
                    });
                  } catch {
                  }
                  setLocation({ lat, lng, address });
                  setLocLoading(false);
                  addToast(`📍 위치 추가: ${address}`, "success");
                },
                (err) => {
                  setLocLoading(false);
                  addToast("GPS 권한이 없습니다. 직접 입력해주세요.", "info");
                  setLocEditMode(true);
                },
                { enableHighAccuracy: true, timeout: 1e4, maximumAge: 6e4 }
              );
            },
            style: { display: "flex", alignItems: "center", gap: "6px", color: location || locEditMode ? "#0056D2" : locLoading ? "#FF9B26" : "#666", fontSize: `calc(13px * var(--fs, 1))`, cursor: locLoading ? "not-allowed" : "pointer" },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 16, color: location || locEditMode ? "#0056D2" : locLoading ? "#FF9B26" : "#666" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: "600" }, children: locLoading ? "위치 가져오는 중..." : location ? "위치 수정" : locEditMode ? "입력 중..." : "위치 추가" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            onClick: async () => {
              if (!images.length) {
                addToast("사진을 먼저 올려주세요.", "error");
                return;
              }
              setAiAnalyzing(true);
              const template = `

🤖 AI 조황 일지

📍 낚시 장소: 
🐟 어종: 
📏 씨알 / 마릿수: 
🎣 채비 / 미끼: 
🌊 날씨 / 파고: 
💬 현장 메모: `;
              try {
                const res = await apiClient.post("/api/ai/analyze", { image: images[0] }, { timeout: 15e3 });
                if (res.data?.text) {
                  setContent((prev) => prev + "\n\n🤖 [AI 자동 일지]\n" + res.data.text);
                } else {
                  setContent((prev) => prev + template);
                }
              } catch {
                setContent((prev) => prev + template);
              } finally {
                setAiAnalyzing(false);
              }
            },
            style: { display: "flex", alignItems: "center", gap: "6px", color: "#1565C0", fontSize: `calc(13px * var(--fs, 1))`, cursor: "pointer", background: "rgba(21,101,192,0.1)", padding: "6px 12px", borderRadius: "16px", marginLeft: "auto", border: "1px solid rgba(21,101,192,0.3)" },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Scan, { size: 16 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: "800", color: aiAnalyzing ? "#FF9B26" : void 0 }, children: aiAnalyzing ? "AI 판별 중..." : "AI 자동 일지" })
            ]
          }
        )
      ] }) })
    ] }),
    showCategoryPopup && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "fixed", bottom: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 3e3, display: "flex", alignItems: "flex-end", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bottom-sheet open", style: { height: "auto", padding: "24px 20px", maxWidth: "480px", margin: "0 auto" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sheet-handle" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "800", marginBottom: "20px" }, children: "장르 선택" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }, children: categories.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          onClick: () => {
            setCategory(c);
            setShowCategoryPopup(false);
          },
          style: { padding: "16px", borderRadius: "12px", backgroundColor: category === c ? "rgba(0,86,210,0.05)" : "#f8f9fa", border: category === c ? "1.5px solid #0056D2" : "1.5px solid transparent", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: category === c ? "800" : "600", color: category === c ? "#0056D2" : "#333" }, children: c }),
            category === c && /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { size: 16, color: "#0056D2" })
          ]
        },
        c
      )) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      RewardGateModal,
      {
        isOpen: showAdGate,
        onClose: () => setShowAdGate(false),
        onRewardComplete: doPost,
        onSubscribe: handleSubscribe,
        context: "post"
      }
    )
  ] });
}

export { WritePost as default };
