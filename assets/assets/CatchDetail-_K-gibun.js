import { b as useToastStore, u as useUserStore, c as apiClient, j as jsxRuntimeExports, L as LoadingSpinner } from './index-C2ieaxTI.js';
import { u as useNavigate, h as useParams, r as reactExports, R as React } from './vendor-react-BzbiWsGG.js';
import { d as ChevronLeft, a3 as Calendar, n as MapPin, g as Anchor, ad as Droplets, o as Wind, W as Waves, K as Share2, u as Trash2 } from './vendor-icons-C5BxRig-.js';
import { s as shareExternal } from './shareUtils-C91mtvog.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

const PLAY_STORE_URL = "https://play.google.com/apps/internaltest/4701312289208373704";
const APP_ID = "kr.fishinggo.app";
function AppInstallBanner({ catchId }) {
  const [visible, setVisible] = React.useState(true);
  const isNative = typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();
  const isAndroid = /android/i.test(navigator.userAgent);
  if (isNative || !isAndroid || !visible)
    return null;
  const handleOpen = () => {
    const intentUrl = `intent://catch?catchId=${catchId}#Intent;scheme=fishinggo;package=${APP_ID};S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;
    window.location.href = intentUrl;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "linear-gradient(135deg, #0B1F3A, #0056D2)",
    padding: "10px 14px"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "/og-image.png", alt: "낚시GO", style: { width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0 } }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", fontWeight: "900", color: "#fff" }, children: "낚시GO 앱에서 보기" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.7)" }, children: "앱에서 더 편리하게 확인하세요!" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleOpen, style: { flexShrink: 0, background: "#FEE500", border: "none", borderRadius: "10px", padding: "7px 13px", fontSize: "12px", fontWeight: "900", color: "#191919", cursor: "pointer" }, children: "앱 열기" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setVisible(false), style: { flexShrink: 0, background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "18px", cursor: "pointer", padding: "0 4px", lineHeight: 1 }, children: "×" })
  ] });
}
const formatDate = (raw) => {
  try {
    return new Date(raw).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch {
    return raw || "";
  }
};
function CatchDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const addToast = useToastStore((s) => s.addToast);
  const user = useUserStore((s) => s.user);
  const [record, setRecord] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [deleting, setDeleting] = reactExports.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!id)
      return;
    setLoading(true);
    apiClient.get(`/api/records/${id}`).then((res) => setRecord(res.data)).catch((err) => {
      setRecord(null);
      const status = err.response?.status;
      if (status === 404) {
        addToast("해당 조과 기록을 찾을 수 없습니다.", "error");
      } else {
        addToast("데이터를 불러오지 못했습니다. 네트워크를 확인해주세요.", "error");
      }
    }).finally(() => setLoading(false));
  }, [id, addToast]);
  const handleShare = reactExports.useCallback(async () => {
    await shareExternal({
      title: `${record?.fish || record?.species || "조과"} 낚시 기록 | 낚시GO`,
      text: record?.content?.slice(0, 80) || "낚시GO에서 조과 기록을 확인하세요!",
      url: window.location.href,
      imgUrl: record?.image || null,
      // null이면 shareUtils에서 앱 로고로 대체
      addToast,
      catchId: id
    });
  }, [record?.fish, record?.species, record?.content, record?.image, addToast, id]);
  const handleDelete = reactExports.useCallback(async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/api/user/records/${id}`, { data: { email: user?.email } });
      addToast("해당 조과 기록을 삭제했습니다.", "success");
      if (window.history.length <= 1)
        navigate("/", { replace: true });
      else
        navigate(-1);
    } catch (err) {
      addToast(err.response?.data?.error || "삭제에 실패했습니다.", "error");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }, [id, user?.email, addToast, navigate]);
  const isMyRecord = record && user && (record.author_email === user.email || record.userId === user.id || record.email === user.email);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-container", style: { backgroundColor: "#fff", height: "100dvh", zIndex: 2e3 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AppInstallBanner, { catchId: id }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px", paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)", display: "flex", alignItems: "center", borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => window.history.length <= 1 ? navigate("/", { replace: true }) : navigate(-1), style: { border: "none", background: "none", padding: "8px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 24, color: "#1c1c1e" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontSize: `calc(17px * var(--fs, 1))`, fontWeight: "800", flex: 1, textAlign: "center", marginRight: "40px" }, children: "나의 조과 기록" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { overflowY: "auto", height: "calc(100dvh - 57px - env(safe-area-inset-top, 0px))" }, children: loading ? (
      // ENH5-A6: 인라인 spinner → 공통 LoadingSpinner 컴포넌트로 통일
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSpinner, { style: { height: "50vh" } })
    ) : !record ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50vh", gap: "16px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(48px * var(--fs, 1))` }, children: "🎣" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "800", color: "#1c1c1e" }, children: "기록을 찾을 수 없습니다" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => window.history.length <= 1 ? navigate("/", { replace: true }) : navigate(-1), style: { padding: "12px 24px", background: "#0056D2", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "800", cursor: "pointer" }, children: "돌아가기" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 40px)" }, children: [
      record.image && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: record.image,
          alt: "catch",
          loading: "lazy",
          style: {
            width: "100%",
            height: "300px",
            objectFit: "cover",
            filter: "blur(8px)",
            transition: "filter 0.4s ease"
          },
          onLoad: (e) => {
            e.target.style.filter = "none";
          }
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "24px 20px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", color: "#0056D2", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", marginBottom: "4px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 14 }),
              formatDate(record.date || record.createdAt),
              " ",
              record.time && `(${record.time})`
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { style: { fontSize: `calc(24px * var(--fs, 1))`, fontWeight: "800", margin: 0 }, children: [
              record.fish || record.species || "어종 미상",
              " ",
              record.size && record.size
            ] })
          ] }),
          record.weight && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#f0f5ff", padding: "12px", borderRadius: "16px", textAlign: "center" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#0056D2", fontWeight: "800", marginBottom: "2px" }, children: "무게" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "800", color: "#0056D2" }, children: record.weight })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }, children: [
          record.location && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#f8f9fa", padding: "16px", borderRadius: "16px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", color: "#8e8e93", fontSize: `calc(12px * var(--fs, 1))`, marginBottom: "6px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 14 }),
              " 낚시 장소"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "700" }, children: record.location })
          ] }),
          record.gear && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#f8f9fa", padding: "16px", borderRadius: "16px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", color: "#8e8e93", fontSize: `calc(12px * var(--fs, 1))`, marginBottom: "6px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Anchor, { size: 14 }),
              " 사용 채비"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700", lineHeight: "1.4" }, children: record.gear })
          ] })
        ] }),
        (record.weather || record.wind || record.wave) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { borderTop: "1px solid #f0f0f0", padding: "24px 0" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "800", marginBottom: "16px" }, children: "당시 기상 실황" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-around", padding: "16px", backgroundColor: "#fdfdff", border: "1px solid #ebf1ff", borderRadius: "16px" }, children: [
            record.weather && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Droplets, { size: 20, color: "#0056D2", style: { marginBottom: "4px" } }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#999" }, children: "날씨" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "700" }, children: record.weather })
            ] }),
            record.wind && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Wind, { size: 20, color: "#0056D2", style: { marginBottom: "4px" } }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#999" }, children: "풍속" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "700" }, children: record.wind })
            ] }),
            record.wave && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Waves, { size: 20, color: "#0056D2", style: { marginBottom: "4px" } }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#999" }, children: "파고" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "700" }, children: record.wave })
            ] })
          ] })
        ] }),
        record.content && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { borderTop: "1px solid #f0f0f0", padding: "24px 0" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "800", marginBottom: "12px" }, children: "낚시 메모" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(15px * var(--fs, 1))`, lineHeight: "1.7", color: "#444", margin: 0 }, children: record.content })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "10px", marginTop: "12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: handleShare,
              style: { flex: 1, padding: "18px", borderRadius: "16px", border: "1.5px solid #0056D2", color: "#0056D2", background: "#fff", fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { size: 18 }),
                " 이 기록 공유하기"
              ]
            }
          ),
          isMyRecord && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setShowDeleteConfirm(true),
              style: { padding: "18px 20px", borderRadius: "16px", border: "1.5px solid #FF3B30", color: "#FF3B30", background: "#FFF0F0", fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flexShrink: 0 },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 18 }),
                " 삭제"
              ]
            }
          )
        ] }),
        showDeleteConfirm && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            onClick: () => setShowDeleteConfirm(false),
            style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9e3, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" },
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: (e) => e.stopPropagation(), style: { width: "100%", maxWidth: "320px", background: "#fff", borderRadius: "24px", padding: "28px 24px", textAlign: "center" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(40px * var(--fs, 1))`, marginBottom: "12px" }, children: "🗑️" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(17px * var(--fs, 1))`, fontWeight: "900", color: "#1c1c1e", marginBottom: "8px" }, children: "조과 기록을 삭제하시겠어요?" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "600", marginBottom: "24px", lineHeight: "1.5" }, children: "삭제하면 복구할 수 없습니다." }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "10px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => setShowDeleteConfirm(false),
                    style: { flex: 1, padding: "14px", border: "1.5px solid #E5E5EA", borderRadius: "14px", background: "#fff", fontWeight: "800", fontSize: `calc(14px * var(--fs, 1))`, cursor: "pointer", color: "#1c1c1e" },
                    children: "취소"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: handleDelete,
                    disabled: deleting,
                    style: { flex: 1, padding: "14px", border: "none", borderRadius: "14px", background: deleting ? "#E5E5EA" : "#FF3B30", color: deleting ? "#AEAEB2" : "#fff", fontWeight: "900", fontSize: `calc(14px * var(--fs, 1))`, cursor: deleting ? "not-allowed" : "pointer" },
                    children: deleting ? "삭제 중..." : "삭제"
                  }
                )
              ] })
            ] })
          }
        )
      ] })
    ] }) })
  ] });
}

export { CatchDetail as default };
