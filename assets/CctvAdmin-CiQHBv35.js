import { u as useUserStore, A as ADMIN_ID, a as ADMIN_EMAIL, b as useToastStore, c as apiClient, j as jsxRuntimeExports } from './index-C2ieaxTI.js';
import { u as useNavigate, r as reactExports } from './vendor-react-BzbiWsGG.js';
import { z as ArrowLeft, T as Tv, w as RotateCcw, as as Youtube, ar as Image, i as ChevronUp, j as ChevronDown, a0 as PenLine, at as Link, X, y as Check } from './vendor-icons-C5BxRig-.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

const YOUTUBE_REGEXP = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
function extractYoutubeId(str) {
  const match = str.match(YOUTUBE_REGEXP);
  return match && match[2].length === 11 ? match[2] : str;
}
const REGION_COLORS = {
  "강원": "#1565C0",
  "경북": "#6A1B9A",
  "경남": "#2E7D32",
  "부산": "#E65100",
  "전남": "#00838F",
  "전북": "#4E342E",
  "충남": "#37474F",
  "제주": "#FF6F00"
};
function CctvAdmin() {
  const navigate = useNavigate();
  const isAdmin = useUserStore(
    (s) => s.user?.id === ADMIN_ID || s.user?.email === ADMIN_EMAIL || s.user?.email === "sunjulab.k@gmail.com" || s.userTier === "MASTER"
  );
  const addToast = useToastStore((s) => s.addToast);
  const [cctvList, setCctvList] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [editingCode, setEditingCode] = reactExports.useState(null);
  const [editValues, setEditValues] = reactExports.useState({ youtubeId: "", type: "youtube", label: "" });
  const [confirmModal, setConfirmModal] = reactExports.useState(null);
  const [saving, setSaving] = reactExports.useState(false);
  const [syncing, setSyncing] = reactExports.useState(false);
  const [previewCode, setPreviewCode] = reactExports.useState(null);
  const [authChecked, setAuthChecked] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const timer = setTimeout(() => {
      setAuthChecked(true);
      const { user: currentUser, userTier } = useUserStore.getState();
      const ok = currentUser?.id === ADMIN_ID || currentUser?.email === ADMIN_EMAIL || currentUser?.email === "sunjulab.k@gmail.com" || userTier === "MASTER";
      if (!ok)
        navigate("/", { replace: true });
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const fetchList = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/api/admin/cctv");
      setCctvList(res.data.list || []);
    } catch (err) {
      addToast("CCTV 목록 불러오기 실패", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);
  reactExports.useEffect(() => {
    if (authChecked && isAdmin)
      fetchList();
  }, [authChecked, isAdmin, fetchList]);
  const startEdit = (item) => {
    if (editingCode && editingCode !== item.obsCode && !saving) {
      setConfirmModal({
        title: "편집 중인 내용이 있습니다",
        message: `[${editingCode}] 대한 변경사항이 저장되지 않았습니다.
다른 항목으로 이동하면 변경사항이 사라집니다.`,
        // ✅ 6TH-C4: 한글 직접 표기
        danger: false,
        onConfirm: () => {
          setEditingCode(item.obsCode);
          setEditValues({
            youtubeId: item.youtubeId || "",
            type: item.type || "youtube",
            label: item.label || ""
          });
          setPreviewCode(null);
        }
      });
      return;
    }
    setEditingCode(item.obsCode);
    setEditValues({
      youtubeId: item.youtubeId || "",
      type: item.type || "youtube",
      label: item.label || ""
    });
    setPreviewCode(null);
  };
  const cancelEdit = () => {
    setEditingCode(null);
    setEditValues({ youtubeId: "", type: "youtube", label: "" });
  };
  const saveEdit = async (obsCode) => {
    try {
      setSaving(true);
      const body = { ...editValues };
      if (body.type === "youtube" && body.youtubeId) {
        body.youtubeId = extractYoutubeId(body.youtubeId.trim());
      } else if (body.type === "iframe") {
        body.youtubeId = body.youtubeId.trim();
      } else if (body.type === "image") {
        body.youtubeId = "";
      }
      const res = await apiClient.put(`/api/admin/cctv/${obsCode}`, body);
      const data = res.data;
      if (data.success) {
        addToast(`✅ ${obsCode} 저장 완료!`, "success");
        cancelEdit();
        fetchList();
      } else {
        addToast("저장 실패", "error");
      }
    } catch {
      addToast("네트워크 오류", "error");
    } finally {
      setSaving(false);
    }
  };
  const resetOverride = (obsCode) => {
    setConfirmModal({
      title: "기본값으로 복원",
      message: `${obsCode}의 설정을 초기화하고
기본 해양수산부(MOF) 영상으로 복원할까요?`,
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/admin/cctv/${obsCode}`);
          addToast(`${obsCode} 기본값으로 복원됨`, "success");
          fetchList();
        } catch {
          addToast("초기화 실패", "error");
        }
      }
    });
  };
  const autoSyncCctvs = () => {
    setConfirmModal({
      title: "YouTube 자동 갱신",
      message: `유튜브 API를 사용하여 모든 지역의 라이브 URL을 최신화합니다.
YouTube Data API 쿼터가 소모됩니다. 계속할까요?`,
      onConfirm: async () => {
        try {
          setSyncing(true);
          const res = await apiClient.post("/api/admin/cctv/auto-sync", {});
          const data = res.data;
          if (data.success) {
            addToast(`✅ ${data.updatedCount}개 지역 실시간 영상 갱신 완료!`, "success");
            fetchList();
          } else {
            addToast(data.error || "자동 동기화에 실패했습니다.", "error");
          }
        } catch {
          addToast("네트워크 오류", "error");
        } finally {
          setSyncing(false);
        }
      }
    });
  };
  const handleResetAll = () => {
    setConfirmModal({
      title: "⚠️ 전체 설정 초기화",
      message: `모든 사용자 지정 CCTV 설정을 삭제하고
해양수산부(MOF) 기본값으로 복원합니다.

이 작업은 되돌릴 수 없습니다.`,
      danger: true,
      onConfirm: async () => {
        try {
          const res = await apiClient.post("/api/admin/cctv/reset-all", {});
          const data = res.data;
          if (data.success) {
            addToast(data.message, "success");
            fetchList();
          } else {
            addToast(data.error || "초기화 실패", "error");
          }
        } catch {
          addToast("서버 오류로 초기화 실패", "error");
        }
      }
    });
  };
  const getEmbedUrl = (youtubeId) => `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=1`;
  if (!authChecked)
    return null;
  if (!isAdmin)
    return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-container", style: { backgroundColor: "#0A0F1C", minHeight: "100vh", paddingBottom: "40px" }, children: [
    confirmModal && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.7)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px"
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
      backgroundColor: "#141824",
      borderRadius: "24px",
      padding: "28px 24px",
      width: "100%",
      maxWidth: "340px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
      border: `1.5px solid ${confirmModal.danger ? "rgba(255,59,48,0.4)" : "rgba(255,215,0,0.25)"}`
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "950", color: "#fff", marginBottom: "12px" }, children: confirmModal.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "rgba(255,255,255,0.6)", lineHeight: "1.7", whiteSpace: "pre-line", marginBottom: "24px" }, children: confirmModal.message }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "10px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setConfirmModal(null),
            style: { flex: 1, padding: "13px", background: "rgba(255,255,255,0.07)", border: "none", borderRadius: "14px", color: "rgba(255,255,255,0.6)", fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer" },
            children: "취소"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              setConfirmModal(null);
              confirmModal.onConfirm();
            },
            style: {
              flex: 1.5,
              padding: "13px",
              border: "none",
              borderRadius: "14px",
              background: confirmModal.danger ? "linear-gradient(135deg, #FF3B30, #C0392B)" : "linear-gradient(135deg, #FFD700, #FFA000)",
              color: confirmModal.danger ? "#fff" : "#1A1A2E",
              fontSize: `calc(14px * var(--fs, 1))`,
              fontWeight: "900",
              cursor: "pointer"
            },
            children: "확인"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "rgba(10,15,28,0.95)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      padding: "calc(env(safe-area-inset-top, 0px) + 16px) 20px 16px",
      display: "flex",
      alignItems: "center",
      gap: "12px"
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => navigate("/mypage"), style: { background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { size: 18, color: "#fff" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)", fontWeight: "700", letterSpacing: "0.08em" }, children: "MASTER ONLY" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "950", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tv, { size: 18, color: "#FFD700" }),
          " CCTV 채널 관리"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginLeft: "auto", fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.3)", fontWeight: "700" }, children: [
        cctvList.filter((c) => c.isOverride).length,
        "개 커스텀 / ",
        cctvList.length,
        "개 전체"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { margin: "16px 16px 0", padding: "14px 16px", background: "rgba(255,215,0,0.08)", borderRadius: "16px", border: "1px solid rgba(255,215,0,0.2)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "900", color: "#FFD700" }, children: "📺 사용 방법" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "6px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: handleResetAll, style: { background: "rgba(255,100,100,0.2)", border: "1px solid rgba(255,100,100,0.5)", color: "#FF7B7B", borderRadius: "12px", padding: "6px 12px", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { size: 12 }),
            " 설정 초기화(MOF)"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: autoSyncCctvs, disabled: syncing, style: { background: "linear-gradient(135deg, #00C48C, #0056D2)", color: "#fff", border: "none", borderRadius: "12px", padding: "6px 12px", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800", cursor: syncing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "4px", opacity: syncing ? 0.7 : 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Youtube, { size: 12, className: syncing ? "spin" : "" }),
            " ",
            syncing ? "탐색 중..." : "자동 갱신"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }, children: [
        "YouTube 라이브 URL에서 ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#FFD700", fontWeight: "800" }, children: "영상 ID(11자리)" }),
        "만 복사하여 입력하세요.",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "예: youtube.com/watch?v=",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#FFD700" }, children: "iCGFbFulG3Y" }),
        " → ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#FFD700" }, children: "iCGFbFulG3Y" }),
        " 입력"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "16px" }, children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)" }, children: "불러오는 중..." }) : cctvList.map((item) => {
      const isEditing = editingCode === item.obsCode;
      const isPreviewing = previewCode === item.obsCode;
      const regionColor = REGION_COLORS[item.region] || "#555";
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        background: "rgba(255,255,255,0.04)",
        borderRadius: "20px",
        marginBottom: "12px",
        border: isEditing ? "1.5px solid #FFD700" : item.isOverride ? "1.5px solid rgba(100,220,100,0.4)" : "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
        transition: "border 0.2s"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "14px 16px", display: "flex", alignItems: "center", gap: "10px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "36px", height: "36px", borderRadius: "10px", background: regionColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: item.type === "youtube" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Youtube, { size: 16, color: "#fff" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { size: 16, color: "#fff" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: "#fff" }, children: item.areaName }),
              item.isOverride && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, fontWeight: "900", background: "rgba(100,220,100,0.2)", color: "#64DC64", padding: "2px 6px", borderRadius: "6px" }, children: "수정됨" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)", fontWeight: "700" }, children: [
              item.obsCode,
              " · ",
              item.region,
              " ·",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: item.type === "youtube" ? "#FF6B6B" : "#64B5F6", marginLeft: "4px" }, children: item.type === "youtube" ? "▶ YouTube" : "🖼 이미지" })
            ] }),
            item.youtubeId && !isEditing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.25)", fontWeight: "600", fontFamily: "monospace", marginTop: "2px" }, children: [
              "ID: ",
              item.youtubeId
            ] })
          ] }),
          !isEditing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "6px", flexShrink: 0 }, children: [
            item.youtubeId && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setPreviewCode(isPreviewing ? null : item.obsCode),
                style: { background: "rgba(255,107,107,0.15)", border: "none", borderRadius: "10px", padding: "6px 10px", color: "#FF6B6B", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" },
                children: [
                  isPreviewing ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { size: 12 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 12 }),
                  "미리보기"
                ]
              }
            ),
            item.isOverride && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => resetOverride(item.obsCode), style: { background: "rgba(255,255,255,0.05)", border: "none", borderRadius: "10px", padding: "6px 10px", color: "rgba(255,255,255,0.4)", cursor: "pointer" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { size: 13 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => startEdit(item), style: { background: "rgba(255,215,0,0.15)", border: "none", borderRadius: "10px", padding: "6px 12px", color: "#FFD700", fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { size: 12 }),
              " 수정"
            ] })
          ] })
        ] }),
        isPreviewing && item.youtubeId && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "0 16px 14px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { borderRadius: "12px", overflow: "hidden", aspectRatio: "16/9" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "iframe",
          {
            src: getEmbedUrl(item.youtubeId),
            allow: "autoplay; encrypted-media",
            allowFullScreen: true,
            style: { width: "100%", height: "100%", border: "none", display: "block" }
          }
        ) }) }),
        isEditing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "0 16px 16px", borderTop: "1px solid rgba(255,215,0,0.15)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "8px", marginBottom: "12px", marginTop: "14px" }, children: ["youtube", "iframe", "image"].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setEditValues((v) => ({ ...v, type: t })), style: {
            flex: 1,
            padding: "10px",
            background: editValues.type === t ? t === "youtube" ? "rgba(255,107,107,0.2)" : t === "iframe" ? "rgba(100,220,100,0.2)" : "rgba(100,181,246,0.2)" : "rgba(255,255,255,0.04)",
            border: editValues.type === t ? `1.5px solid ${t === "youtube" ? "#FF6B6B" : t === "iframe" ? "#64DC64" : "#64B5F6"}` : "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            color: editValues.type === t ? t === "youtube" ? "#FF6B6B" : t === "iframe" ? "#64DC64" : "#64B5F6" : "rgba(255,255,255,0.4)",
            fontSize: `calc(11px * var(--fs, 1))`,
            fontWeight: "800",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px"
          }, children: [
            t === "youtube" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Youtube, { size: 12 }) : t === "iframe" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { size: 12 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { size: 12 }),
            t === "youtube" ? "YouTube" : t === "iframe" ? "커스텀 URL" : "이미지"
          ] }, t)) }),
          editValues.type === "youtube" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "10px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)", fontWeight: "800", marginBottom: "6px", display: "block" }, children: "YouTube 영상 ID (URL의 ?v= 뒤 11자리 또는 전체 URL)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                value: editValues.youtubeId,
                onChange: (e) => setEditValues((v) => ({ ...v, youtubeId: e.target.value.trim() })),
                placeholder: "예: iCGFbFulG3Y 또는 youtube.com/watch?v=iCGFbFulG3Y",
                style: {
                  width: "100%",
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: `calc(14px * var(--fs, 1))`,
                  fontWeight: "700",
                  outline: "none",
                  fontFamily: "monospace",
                  boxSizing: "border-box"
                }
              }
            ),
            editValues.youtubeId && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.3)", marginTop: "4px" }, children: [
              "미리보기: youtube.com/watch?v=",
              editValues.youtubeId
            ] })
          ] }),
          editValues.type === "iframe" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "10px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#64DC64", fontWeight: "800", marginBottom: "6px", display: "block" }, children: "🔗 커스텀 스트림 URL (iframe 임베드 가능한 모든 주소)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                value: editValues.youtubeId,
                onChange: (e) => setEditValues((v) => ({ ...v, youtubeId: e.target.value.trim() })),
                placeholder: "예: https://www.daum.net/embed/... 또는 https://cctv.example.com/stream",
                style: {
                  width: "100%",
                  padding: "12px 14px",
                  background: "rgba(100,220,100,0.06)",
                  border: "1px solid rgba(100,220,100,0.3)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: `calc(12px * var(--fs, 1))`,
                  fontWeight: "700",
                  outline: "none",
                  boxSizing: "border-box"
                }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(100,220,100,0.6)", marginTop: "6px", lineHeight: "1.5" }, children: [
              "⚠️ iframe 임베드를 허용하는 URL만 작동합니다.",
              /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
              "YouTube, HLS 스트림, 지자체 CCTV 포털 등 가능"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "14px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)", fontWeight: "800", marginBottom: "6px", display: "block" }, children: "표시 레이블 (선택)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                value: editValues.label,
                onChange: (e) => setEditValues((v) => ({ ...v, label: e.target.value })),
                placeholder: `기본: ${item.label}`,
                style: {
                  width: "100%",
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: `calc(13px * var(--fs, 1))`,
                  fontWeight: "700",
                  outline: "none",
                  boxSizing: "border-box"
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: cancelEdit, style: { flex: 1, padding: "12px", background: "rgba(255,255,255,0.05)", border: "none", borderRadius: "12px", color: "rgba(255,255,255,0.5)", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 14 }),
              " 취소"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => saveEdit(item.obsCode), disabled: saving, style: { flex: 2, padding: "12px", background: "linear-gradient(135deg, #FFD700, #FFA000)", border: "none", borderRadius: "12px", color: "#1A1A2E", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: saving ? 0.7 : 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 14 }),
              " ",
              saving ? "저장 중..." : "저장"
            ] })
          ] })
        ] })
      ] }, item.obsCode);
    }) })
  ] });
}

export { CctvAdmin as default };
