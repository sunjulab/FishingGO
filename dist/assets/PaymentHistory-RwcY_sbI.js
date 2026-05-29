import { u as useUserStore, b as useToastStore, c as apiClient, j as jsxRuntimeExports } from './index-C2ieaxTI.js';
import { u as useNavigate, r as reactExports } from './vendor-react-BzbiWsGG.js';
import { z as ArrowLeft, aw as TrendingUp, Y as CreditCard, l as Clock, a9 as CheckCircle2, ae as XCircle, R as RefreshCw } from './vendor-icons-C5BxRig-.js';
import { P as PLAN_LABEL, a as PG_LABEL_FULL } from './payment-DHpLMO2g.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

const STATUS_CONFIG = {
  paid: { label: "결제 완료", color: "#00C48C", icon: CheckCircle2 },
  failed: { label: "결제 실패", color: "#FF3B30", icon: XCircle },
  refunded: { label: "환불 완료", color: "#8E8E93", icon: RefreshCw },
  cancelled: { label: "취소", color: "#FF9B26", icon: XCircle }
};
function PaymentHistory() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);
  const [history, setHistory] = reactExports.useState([]);
  const [subscription, setSubscription] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [cancelConfirm, setCancelConfirm] = reactExports.useState(false);
  const [cancelReason, setCancelReason] = reactExports.useState("");
  const fetchData = reactExports.useCallback(async () => {
    setLoading(true);
    const userId = user?.email || user?.id;
    if (!userId) {
      addToast("사용자 정보를 확인할 수 없습니다.", "error");
      setLoading(false);
      return;
    }
    try {
      const [histRes, subRes] = await Promise.all([
        apiClient.get(`/api/payment/history?userId=${encodeURIComponent(userId)}`),
        apiClient.get(`/api/payment/subscription/${encodeURIComponent(userId)}`)
      ]);
      setHistory(histRes.data || []);
      if (subRes.data.hasSubscription)
        setSubscription(subRes.data);
    } catch {
      addToast("결제 내역을 불러오지 못했습니다.", "error");
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.id, addToast]);
  reactExports.useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    fetchData();
  }, [user?.email, fetchData]);
  const handleCancel = async () => {
    try {
      const userId = user?.email || user?.id;
      if (!userId) {
        addToast("사용자 정보를 확인할 수 없습니다.", "error");
        return;
      }
      await apiClient.delete(`/api/payment/subscription/${encodeURIComponent(userId)}`, {
        data: { reason: cancelReason.trim() || "사용자 직접 취소" }
        // ✅ 6TH-C5: trim() 추가
      });
      addToast("구독이 취소되었습니다. 현재 기간 종료 후 해지됩니다.", "success");
      setSubscription((prev) => ({ ...prev, status: "cancelled" }));
      setCancelConfirm(false);
    } catch (err) {
      addToast(err.response?.data?.error || "취소 처리 실패", "error");
    }
  };
  const totalPaid = reactExports.useMemo(
    () => history.filter((h) => h.status === "paid").reduce((s, h) => s + h.amount, 0),
    [history]
  );
  const paidCount = reactExports.useMemo(() => history.filter((h) => h.status === "paid").length, [history]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { minHeight: "100vh", background: "#0E0E1A", color: "#fff", fontFamily: "Pretendard, sans-serif", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 40px)" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px 20px", paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => window.history.length <= 1 ? navigate("/mypage", { replace: true }) : navigate(-1), style: { background: "none", border: "none", cursor: "pointer" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { size: 22, color: "#fff" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "950" }, children: "결제 내역" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "20px 16px", maxWidth: "480px", margin: "0 auto" }, children: [
      subscription && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg,#1a1a2e,#16213e)", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,215,0,0.15)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "rgba(255,255,255,0.5)", fontWeight: "700" }, children: "현재 구독" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: {
            fontSize: `calc(11px * var(--fs, 1))`,
            fontWeight: "900",
            padding: "4px 10px",
            borderRadius: "20px",
            background: subscription.status === "active" ? "rgba(0,196,140,0.15)" : "rgba(255,59,48,0.15)",
            color: subscription.status === "active" ? "#00C48C" : "#FF3B30",
            border: `1px solid ${subscription.status === "active" ? "rgba(0,196,140,0.3)" : "rgba(255,59,48,0.3)"}`
          }, children: subscription.status === "active" ? "✅ 활성" : subscription.status === "failed" ? "❌ 결제실패" : subscription.status === "cancelled" ? "🚫 취소됨" : subscription.status })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(24px * var(--fs, 1))`, fontWeight: "950", marginBottom: "4px" }, children: PLAN_LABEL[subscription.planId] || subscription.planId }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(20px * var(--fs, 1))`, fontWeight: "950", color: "#FFD700", marginBottom: "14px" }, children: [
          subscription.amount?.toLocaleString(),
          "원 ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)" }, children: "/ 월" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }, children: [
          { label: "결제 수단", value: PG_LABEL_FULL[subscription.pgProvider] || subscription.pgProvider },
          { label: "다음 결제일", value: subscription.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString("ko-KR") : "-" },
          { label: "구독 시작", value: subscription.startedAt ? new Date(subscription.startedAt).toLocaleDateString("ko-KR") : "-" },
          { label: "마지막 결제", value: subscription.lastBilledAt ? new Date(subscription.lastBilledAt).toLocaleDateString("ko-KR") : "-" }
        ].map(({ label, value }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "rgba(255,255,255,0.45)", fontWeight: "700" }, children: label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#fff", fontWeight: "800" }, children: value })
        ] }, label)) }),
        subscription.status === "active" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => navigate("/vvip-subscribe"),
              style: { flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid rgba(0,100,255,0.3)", background: "rgba(0,100,255,0.1)", color: "#64B5F6", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", cursor: "pointer" },
              children: "플랜 변경"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setCancelConfirm(true),
              style: { flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,59,48,0.3)", background: "rgba(255,59,48,0.1)", color: "#FF5A5F", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", cursor: "pointer" },
              children: "구독 취소"
            }
          )
        ] }),
        subscription.status === "failed" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => navigate("/vvip-subscribe"),
            style: { width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#FF3B30,#C0392B)", color: "#fff", fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "950", cursor: "pointer" },
            children: "결제 수단 재등록"
          }
        )
      ] }),
      history.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "10px", marginBottom: "20px" }, children: [
        { label: "총 결제", value: `${totalPaid.toLocaleString()}원`, icon: TrendingUp, color: "#00C48C" },
        { label: "결제 횟수", value: `${paidCount}회`, icon: CreditCard, color: "#64B5F6" }
      ].map(({ label, value, icon: Icon, color }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: "14px", padding: "14px", border: "1px solid rgba(255,255,255,0.08)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 16, color, style: { marginBottom: "6px" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "950", color }, children: value }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)", fontWeight: "700", marginTop: "2px" }, children: label })
      ] }, label)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "3px", height: "16px", background: "linear-gradient(180deg, #FFD700, #FF9B26)", borderRadius: "2px" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", color: "rgba(255,255,255,0.5)" }, children: "결제 타임라인" })
      ] }),
      loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.3)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 32, style: { marginBottom: "12px" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "불러오는 중..."
      ] }) : history.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "48px 20px", color: "rgba(255,255,255,0.3)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { size: 40, style: { marginBottom: "12px" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: 0, fontWeight: "700" }, children: "결제 내역이 없습니다." })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", display: "flex", flexDirection: "column", gap: "0" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", left: "18px", top: "20px", bottom: "20px", width: "2px", background: "linear-gradient(180deg, rgba(255,215,0,0.4), rgba(255,255,255,0.05))", borderRadius: "1px" } }),
        history.map((item, i) => {
          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.paid;
          const Icon = cfg.icon;
          const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) : "-";
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: "14px", position: "relative" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              flexShrink: 0,
              background: `${cfg.color}20`,
              border: `2px solid ${cfg.color}60`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
              boxShadow: `0 0 10px ${cfg.color}30`
            }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 16, color: cfg.color }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
              flex: 1,
              background: "rgba(255,255,255,0.04)",
              borderRadius: "16px",
              padding: "14px 16px",
              border: `1px solid ${cfg.color}20`,
              transition: "background 0.15s"
            }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: "#fff", marginBottom: "2px" }, children: PLAN_LABEL[item.planId] || item.planId || "구독 결제" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.35)", fontWeight: "700" }, children: [
                    PG_LABEL_FULL[item.pgProvider] || item.pgProvider,
                    " · ",
                    dateStr
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "right" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "950", color: item.status === "paid" ? "#fff" : cfg.color }, children: [
                    item.status === "refunded" ? "-" : "",
                    item.amount?.toLocaleString(),
                    "원"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
                    fontSize: `calc(9px * var(--fs, 1))`,
                    fontWeight: "900",
                    color: cfg.color,
                    background: `${cfg.color}15`,
                    padding: "2px 7px",
                    borderRadius: "10px",
                    border: `1px solid ${cfg.color}30`,
                    display: "inline-block",
                    marginTop: "3px"
                  }, children: cfg.label })
                ] })
              ] }),
              item.failReason && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#FF5A5F", fontWeight: "700", marginTop: "4px", padding: "4px 8px", background: "rgba(255,90,95,0.1)", borderRadius: "6px" }, children: [
                "⚠ 사유: ",
                item.failReason
              ] })
            ] })
          ] }, String(item._id || item.merchant_uid || i));
        })
      ] })
    ] }),
    cancelConfirm && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "flex-end", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#1a1a2e", borderRadius: "24px 24px 0 0", padding: "28px 20px", width: "100%", maxWidth: "480px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "950", marginBottom: "8px" }, children: "구독을 취소하시겠습니까?" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "rgba(255,255,255,0.55)", marginBottom: "18px", lineHeight: 1.6 }, children: [
        "현재 결제 기간 종료 후 자동으로 해지됩니다.",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "남은 기간 동안은 서비스를 계속 이용하실 수 있습니다."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          value: cancelReason,
          onChange: (e) => setCancelReason(e.target.value),
          placeholder: "취소 사유 (선택 입력)",
          style: { width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px", color: "#fff", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700", resize: "none", outline: "none", height: "72px", boxSizing: "border-box", marginBottom: "14px" }
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "10px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setCancelConfirm(false), style: { flex: 1, padding: "14px", borderRadius: "14px", border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "900", cursor: "pointer" }, children: "유지하기" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleCancel, style: { flex: 1, padding: "14px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg,#FF3B30,#C0392B)", color: "#fff", fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "950", cursor: "pointer" }, children: "취소 확정" })
      ] })
    ] }) })
  ] });
}

export { PaymentHistory as default };
