import { b as useToastStore, u as useUserStore, A as ADMIN_ID, a as ADMIN_EMAIL, c as apiClient, j as jsxRuntimeExports } from './index-C2ieaxTI.js';
import { u as useNavigate, r as reactExports } from './vendor-react-BzbiWsGG.js';
import { X, L as Lock, aa as HelpCircle } from './vendor-icons-C5BxRig-.js';
import { R as RewardGateModal } from './AdUnit-B8AAt_Ku.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

function CreateCrew() {
  const navigate = useNavigate();
  const [name, setName] = reactExports.useState("");
  const [isPrivate, setIsPrivate] = reactExports.useState(true);
  const [password, setPassword] = reactExports.useState("");
  const [limit, setLimit] = reactExports.useState(100);
  const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
  const [showAdGate, setShowAdGate] = reactExports.useState(false);
  const addToast = useToastStore((state) => state.addToast);
  const userTier = useUserStore((state) => state.userTier);
  const user = useUserStore((state) => state.user);
  const isAdmin = useUserStore((s) => s.user?.id === ADMIN_ID || s.user?.email === ADMIN_EMAIL);
  const isBusinessLite = isAdmin || ["BUSINESS_LITE", "PRO", "BUSINESS_VIP", "MASTER"].includes(userTier);
  const doCreateCrew = reactExports.useCallback(async () => {
    if (!name.trim())
      return;
    if (!user || user.id === "GUEST") {
      addToast("로그인이 필요합니다.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiClient.post("/api/community/crews", {
        name,
        isPrivate,
        password: isPrivate ? password : null,
        members: 1,
        limit,
        owner: user?.email || user?.id || "",
        ownerName: user?.name || user?.nickname || user?.id || ""
      });
      if (res.data) {
        const data = res.data;
        addToast("크루가 성공적으로 개설되었습니다!", "success");
        navigate(`/crew/${String(data.id || data._id || "CREW_001")}/chat`);
      }
    } catch (err) {
      if (false)
        console.error("Create crew error:", err);
      addToast("크루 생성 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [name, isPrivate, password, limit, user, addToast, navigate]);
  const handleCreateCrew = () => {
    if (!name.trim())
      return;
    if (name.trim().length < 2 || name.trim().length > 20) {
      addToast("크루명은 2~20자 사이로 입력해주세요.", "error");
      return;
    }
    if (isPrivate && password.length < 4) {
      addToast("프라이빗 크루는 4자리 비밀번호가 필수입니다.", "error");
      return;
    }
    if (isBusinessLite) {
      doCreateCrew();
    } else {
      setShowAdGate(true);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-container", style: { backgroundColor: "#fff", height: "100dvh", zIndex: 2e3 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px", paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => window.history.length <= 1 ? navigate("/community", { replace: true }) : navigate(-1), style: { border: "none", background: "none" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 24, color: "#1c1c1e" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontSize: `calc(17px * var(--fs, 1))`, fontWeight: "800" }, children: isPrivate ? "프라이빗 크루 만들기" : "공개 크루 만들기" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "24px" } })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "24px 20px", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "32px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: { display: "block", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", color: "#8e8e93", marginBottom: "8px" }, children: "크루 명칭" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            placeholder: "예: 강원권 루어 정기출조 모임",
            maxLength: 20,
            style: {
              width: "100%",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #eee",
              backgroundColor: "#f8f9fa",
              fontSize: `calc(16px * var(--fs, 1))`,
              fontWeight: "600",
              outline: "none"
            },
            onChange: (e) => setName(e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "32px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", color: "#8e8e93" }, children: "입장 유형" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setIsPrivate(false),
                style: { padding: "6px 12px", borderRadius: "8px", border: !isPrivate ? "1px solid #0056D2" : "1px solid #eee", backgroundColor: !isPrivate ? "rgba(0,86,210,0.05)" : "#fff", color: !isPrivate ? "#0056D2" : "#999", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800" },
                children: "공개"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setIsPrivate(true),
                style: { padding: "6px 12px", borderRadius: "8px", border: isPrivate ? "1px solid #0056D2" : "1px solid #eee", backgroundColor: isPrivate ? "rgba(0,86,210,0.05)" : "#fff", color: isPrivate ? "#0056D2" : "#999", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800" },
                children: "프라이빗"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#f8f9fa", padding: "16px", borderRadius: "16px", display: "flex", gap: "12px", alignItems: "flex-start" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { size: 18, color: "#0056D2", style: { marginTop: "2px" } }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "700", marginBottom: "4px" }, children: "보안 입장 모드" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#8e8e93", lineHeight: "1.5", marginBottom: isPrivate ? "12px" : 0 }, children: "초대 링크가 있거나 비밀번호를 아는 사용자만 참여할 수 있는 폐쇄형 모임입니다." }),
            isPrivate && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "password",
                placeholder: "입장 코드 4자리 입력",
                maxLength: 4,
                style: {
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #eee",
                  outline: "none",
                  fontSize: `calc(14px * var(--fs, 1))`,
                  fontWeight: "800",
                  letterSpacing: "4px",
                  textAlign: "center"
                },
                value: password,
                onChange: (e) => setPassword(e.target.value.replace(/[^0-9]/g, ""))
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "40px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: { display: "block", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", color: "#8e8e93", marginBottom: "16px" }, children: "최대 인원 설정 (3 ~ 1000명)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "range", min: "3", max: "1000", step: "1", value: limit, onChange: (e) => setLimit(Number(e.target.value)), style: { flex: 1, accentColor: "#0056D2" } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "800", color: "#0056D2", width: "45px", textAlign: "right" }, children: limit }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "700", color: "#8e8e93" }, children: "명" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          disabled: !name.trim() || isSubmitting,
          onClick: handleCreateCrew,
          style: {
            width: "100%",
            padding: "18px",
            borderRadius: "16px",
            backgroundColor: name.trim() ? "#0056D2" : "#f0f0f0",
            color: name.trim() ? "#fff" : "#bbb",
            border: "none",
            fontSize: `calc(16px * var(--fs, 1))`,
            fontWeight: "800",
            boxShadow: name.trim() ? "0 10px 20px rgba(0, 86, 210, 0.2)" : "none"
          },
          children: isSubmitting ? "생성 중..." : "크루 생성하기"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginTop: "20px", color: "#bbb" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(HelpCircle, { size: 14 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(12px * var(--fs, 1))` }, children: "크루 운영 정책 자세히 보기" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      RewardGateModal,
      {
        isOpen: showAdGate,
        onClose: () => setShowAdGate(false),
        onRewardComplete: doCreateCrew,
        onSubscribe: () => {
          setShowAdGate(false);
          navigate("/vvip-subscribe");
        },
        context: "crew"
      }
    )
  ] });
}

export { CreateCrew as default };
