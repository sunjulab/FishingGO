import { u as useUserStore, b as useToastStore, A as ADMIN_ID, a as ADMIN_EMAIL, c as apiClient, j as jsxRuntimeExports, L as LoadingSpinner } from './index-CUv3Hibb.js';
import { u as useNavigate, h as useParams, b as useLocation, r as reactExports } from './vendor-react-BzbiWsGG.js';
import { d as ChevronLeft, t as Bell, G as Pen, u as Trash2, K as Share2, a3 as Calendar, ag as Eye, X, k as Send } from './vendor-icons-C5BxRig-.js';
import { I as ImageGallery } from './ImageGallery-CzQMj38k.js';
import { l as lookup } from './vendor-socket-FPM1Bwz4.js';
import { s as shareExternal } from './shareUtils-DAfr_lha.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';

const SOCKET_URL = "https://fishing-go-backend.onrender.com";
function NoticeDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const user = useUserStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);
  const [notice, setNotice] = reactExports.useState(location.state?.notice || null);
  const [loading, setLoading] = reactExports.useState(!location.state?.notice);
  const [showDeleteConfirm, setShowDeleteConfirm] = reactExports.useState(false);
  const [shareModal, setShareModal] = reactExports.useState(false);
  const [myCrews, setMyCrews] = reactExports.useState([]);
  const [shareTarget, setShareTarget] = reactExports.useState(null);
  const [sharing, setSharing] = reactExports.useState(false);
  const shareSockets = reactExports.useRef({});
  const isAdmin = useUserStore(
    (state) => state.user?.id === ADMIN_ID || state.user?.email === ADMIN_EMAIL
  );
  const fetchNotice = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/community/notices/${id}`);
      setNotice(res.data);
    } catch (err) {
      if (false)
        console.error("Notice fetch error:", err.response?.status, err.message);
      addToast("공지사항을 불러올 수 없습니다.", "error");
      navigate("/community?tab=notice", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, addToast, navigate]);
  reactExports.useEffect(() => {
    if (location.state?.notice)
      return;
    fetchNotice();
  }, [fetchNotice, location.state?.notice]);
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
  const handleEditNavigate = () => {
    navigate(`/write?type=notice&editId=${id}`);
  };
  const handleDelete = async () => {
    try {
      await apiClient.delete(`/api/community/notices/${id}`);
      addToast("공지사항이 삭제되었습니다.", "success");
      navigate("/community?tab=notice");
    } catch (err) {
      addToast(err.response?.data?.error || "삭제 실패", "error");
    }
  };
  if (loading)
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#fff", gap: "12px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSpinner, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "700" }, children: "로드 중..." })
    ] });
  if (!notice)
    return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#fff", minHeight: "100dvh" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#fff", padding: "calc(env(safe-area-inset-top, 0px) + 16px) 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F0F0F0", position: "sticky", top: 0, zIndex: 100 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => window.history.length <= 1 ? navigate("/community?tab=notice", { replace: true }) : navigate(-1), style: { background: "none", border: "none", cursor: "pointer", padding: "8px", display: "flex", alignItems: "center", color: "#1c1c1e" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 26 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { size: 17, color: "#FF3B30" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(17px * var(--fs, 1))`, fontWeight: "900", color: "#1c1c1e" }, children: "공지사항" })
      ] }),
      isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: handleEditNavigate,
            style: { background: "rgba(0,86,210,0.08)", border: "none", borderRadius: "10px", padding: "8px 14px", cursor: "pointer", color: "#0056D2", fontWeight: "800", fontSize: `calc(14px * var(--fs, 1))`, display: "flex", alignItems: "center", gap: "5px" },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { size: 14 }),
              " 수정"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setShowDeleteConfirm(true),
            style: { background: "rgba(255,59,48,0.08)", border: "none", borderRadius: "10px", padding: "8px 14px", cursor: "pointer", color: "#FF3B30", fontWeight: "800", fontSize: `calc(14px * var(--fs, 1))`, display: "flex", alignItems: "center", gap: "5px" },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 14 }),
              " 삭제"
            ]
          }
        )
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "6px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => shareExternal({
              title: `[공지] ${notice?.title || ""} | 낚시GO`,
              text: (notice?.content || "").slice(0, 80),
              url: window.location.href,
              addToast
            }),
            style: { background: "rgba(0,86,210,0.08)", border: "none", borderRadius: "10px", padding: "8px 12px", cursor: "pointer", color: "#0056D2", fontWeight: "800", fontSize: `calc(13px * var(--fs, 1))`, display: "flex", alignItems: "center", gap: "4px" },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { size: 14 }),
              " 공유"
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
              setShareModal(true);
            },
            style: { background: "rgba(0,86,210,0.08)", border: "none", borderRadius: "10px", padding: "8px 12px", cursor: "pointer", color: "#0056D2", fontWeight: "800", fontSize: `calc(13px * var(--fs, 1))`, display: "flex", alignItems: "center", gap: "4px" },
            children: "💬 크루"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "28px 24px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }, children: [
        notice.isPinned && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { padding: "5px 12px", backgroundColor: "#FF3B30", color: "#fff", fontSize: `calc(12px * var(--fs, 1))`, borderRadius: "10px", fontWeight: "900" }, children: "📌 필독" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { padding: "5px 12px", backgroundColor: "#FFF1F0", color: "#FF3B30", fontSize: `calc(12px * var(--fs, 1))`, borderRadius: "10px", fontWeight: "900", border: "1px solid #FFCCC7" }, children: "공지" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { style: { fontSize: `calc(26px * var(--fs, 1))`, fontWeight: "950", color: "#1c1c1e", lineHeight: "1.4", marginBottom: "20px", wordBreak: "keep-all" }, children: notice.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "20px", marginBottom: "28px", paddingBottom: "24px", borderBottom: "2px solid #F2F2F7", alignItems: "center", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", color: "#888", fontSize: `calc(14px * var(--fs, 1))` }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 15 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: notice.date || (notice.createdAt ? new Date(notice.createdAt).toLocaleDateString("ko-KR") : "") })
        ] }),
        notice.views != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", color: "#888", fontSize: `calc(14px * var(--fs, 1))` }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 15 }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "조회 ",
            notice.views
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginLeft: "auto", fontSize: `calc(13px * var(--fs, 1))`, color: "#bbb", fontWeight: "700" }, children: "낚시GO 운영팀" })
      ] }),
      Array.isArray(notice.images) && notice.images.length > 0 || notice.image ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        ImageGallery,
        {
          images: notice.images,
          image: notice.image,
          maxHeight: 400,
          borderRadius: "16px",
          showZoom: true
        }
      ) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(17px * var(--fs, 1))`, color: "#222", lineHeight: "1.9", whiteSpace: "pre-wrap", wordBreak: "break-word", minHeight: "200px" }, children: notice.content })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "0 24px 48px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => navigate("/community?tab=notice"),
        style: { width: "100%", padding: "16px", backgroundColor: "#F2F2F7", border: "none", borderRadius: "16px", fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "800", color: "#555", cursor: "pointer" },
        children: "← 목록으로"
      }
    ) }),
    showDeleteConfirm && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#fff", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "340px", textAlign: "center" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(40px * var(--fs, 1))`, marginBottom: "12px" }, children: "🗑️" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "900", marginBottom: "8px" }, children: "공지사항 삭제" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { fontSize: `calc(14px * var(--fs, 1))`, color: "#666", marginBottom: "24px" }, children: [
        "이 공지사항을 삭제하시겠습니까?",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "삭제 후 복구할 수 없습니다."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "10px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowDeleteConfirm(false), style: { flex: 1, padding: "12px", borderRadius: "12px", border: "1.5px solid #E5E5EA", background: "#fff", fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer" }, children: "취소" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleDelete, style: { flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: "#FF3B30", color: "#fff", fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "900", cursor: "pointer" }, children: "삭제" })
      ] })
    ] }) }),
    shareModal && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        style: { position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" },
        onClick: () => setShareModal(false),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: (e) => e.stopPropagation(), style: { width: "100%", maxWidth: "480px", background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 20px 32px", boxShadow: "0 -8px 32px rgba(0,0,0,0.18)", maxHeight: "70vh", display: "flex", flexDirection: "column" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "900", color: "#1c1c1e" }, children: "📢 크루 채팅방에 공유" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShareModal(false), style: { background: "none", border: "none", cursor: "pointer" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 20, color: "#8e8e93" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#FFF5F5", borderRadius: "14px", padding: "12px 14px", marginBottom: "16px", border: "1px solid #FFD6D6" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#FF3B30", fontWeight: "900", marginBottom: "4px" }, children: "📢 공지사항" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "800", color: "#1c1c1e" }, children: notice.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#888", marginTop: "4px" }, children: (notice.content || "").slice(0, 60) })
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
                style: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "14px", cursor: "pointer", background: selected ? "#EEF4FF" : "#F8F9FA", border: selected ? "2px solid #0056D2" : "1.5px solid transparent" },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(24px * var(--fs, 1))` }, children: crew.emoji || "🎣" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "800", color: selected ? "#0056D2" : "#1c1c1e" }, children: crew.name }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#8e8e93" }, children: [
                      "멤버 ",
                      crew.memberList?.length || crew.members || 0,
                      "명"
                    ] })
                  ] }),
                  selected && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#0056D2", fontWeight: "900" }, children: "✓" })
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
                    postId: String(notice._id || id),
                    postTitle: notice.title || "(제목 없음)",
                    postPreview: (notice.content || "").slice(0, 120),
                    postImage: notice.images?.[0] || notice.image || "",
                    postCategory: "📢 공지사항"
                  });
                  addToast(`✅ ${shareTarget.name} 채팅방에 공유했습니다!`, "success");
                  setShareModal(false);
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
              style: { width: "100%", padding: "16px", border: "none", borderRadius: "16px", background: !shareTarget || sharing ? "#E5E5EA" : "linear-gradient(135deg,#FF3B30,#c0392b)", color: !shareTarget || sharing ? "#aaa" : "#fff", fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "900", cursor: !shareTarget || sharing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
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

export { NoticeDetail as default };
