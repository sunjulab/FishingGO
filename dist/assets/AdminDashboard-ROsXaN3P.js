import { u as useUserStore, A as ADMIN_ID, a as ADMIN_EMAIL, b as useToastStore, c as apiClient, j as jsxRuntimeExports, L as LoadingSpinner } from './index-rdBGUi8d.js';
import { u as useNavigate, r as reactExports } from './vendor-react-BzbiWsGG.js';
import { z as ArrowLeft, R as RefreshCw, A as AlertCircle, U as Users, aj as Wifi, ak as WifiOff, ax as Activity, ay as UserPlus, ag as Eye, az as Globe, aw as TrendingUp, aA as DollarSign, Y as CreditCard, B as BellRing, k as Send, h as MessageSquare, aB as Filter, l as Clock, C as CheckCircle, i as ChevronUp, j as ChevronDown } from './vendor-icons-C5BxRig-.js';
import { b as PLAN_COLOR, c as PG_LABEL_SHORT } from './payment-DHpLMO2g.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

function StatCard({ label, value, icon: Icon, color, sub }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "6px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "rgba(255,255,255,0.45)", fontWeight: "700" }, children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "32px", height: "32px", borderRadius: "10px", background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 16, color }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(26px * var(--fs, 1))`, fontWeight: "950", color: "#fff", lineHeight: 1 }, children: value }),
    sub && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)", fontWeight: "700" }, children: sub })
  ] });
}
function AdminDashboard() {
  const navigate = useNavigate();
  const isAdmin = useUserStore(
    (state) => state.user?.id === ADMIN_ID || state.user?.email === ADMIN_EMAIL || state.user?.email === "sunjulab.k@gmail.com" || state.userTier === "MASTER"
  );
  const addToast = useToastStore((s) => s.addToast);
  const [stats, setStats] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [authChecked, setAuthChecked] = reactExports.useState(false);
  const [userStats, setUserStats] = reactExports.useState(null);
  const [userStatsLoading, setUserStatsLoading] = reactExports.useState(false);
  const [autoRefresh, setAutoRefresh] = reactExports.useState(true);
  const [alertState, setAlertState] = reactExports.useState({
    tab: "broadcast",
    sending: false,
    msg: "",
    location: "",
    pushEmail: "",
    pushTitle: "",
    pushMsg: ""
  });
  const {
    tab: alertTab,
    sending: alertSending,
    msg: alertMsg,
    location: alertLocation,
    pushEmail,
    pushTitle,
    pushMsg
  } = alertState;
  const setAlertField = (field) => (val) => setAlertState((s) => ({ ...s, [field]: val }));
  const setAlertTab = setAlertField("tab");
  const setAlertSending = setAlertField("sending");
  const setAlertMsg = setAlertField("msg");
  const setAlertLocation = setAlertField("location");
  const setPushEmail = setAlertField("pushEmail");
  const setPushTitle = setAlertField("pushTitle");
  const setPushMsg = setAlertField("pushMsg");
  reactExports.useEffect(() => {
    const t = setTimeout(() => {
      if (!isAdmin) {
        navigate("/");
        return;
      }
      setAuthChecked(true);
      fetchStats();
    }, 0);
    return () => clearTimeout(t);
  }, [isAdmin, navigate]);
  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const [revenueRes, userStatsRes] = await Promise.allSettled([
        apiClient.get("/api/admin/revenue"),
        apiClient.get("/api/admin/user-stats")
      ]);
      if (revenueRes.status === "fulfilled")
        setStats(revenueRes.value.data);
      else
        setError(revenueRes.reason?.response?.data?.error || "수익 데이터 로드 실패");
      if (userStatsRes.status === "fulfilled")
        setUserStats(userStatsRes.value.data);
    } catch (err) {
      setError(err.response?.data?.error || "데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };
  const fetchUserStats = reactExports.useCallback(async () => {
    setUserStatsLoading(true);
    try {
      const res = await apiClient.get("/api/admin/user-stats");
      setUserStats(res.data);
    } catch {
    } finally {
      setUserStatsLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    if (!autoRefresh)
      return;
    const id = setInterval(fetchUserStats, 3e4);
    return () => clearInterval(id);
  }, [autoRefresh, fetchUserStats]);
  const planBreakdown = stats?.planBreakdown || {};
  const maxPlanRevenue = Math.max(...Object.values(planBreakdown).map((p) => p.revenue || 0), 1);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { minHeight: "100dvh", background: "#070B14", color: "#fff", fontFamily: "Pretendard, sans-serif", paddingBottom: "calc(40px + env(safe-area-inset-bottom, 0px))" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "calc(env(safe-area-inset-top, 0px) + 16px) 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#070B14", position: "sticky", top: 0, zIndex: 100 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => window.history.length <= 1 ? navigate("/", { replace: true }) : navigate(-1), style: { background: "none", border: "none", cursor: "pointer" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { size: 22, color: "#fff" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "950" }, children: "⚙️ 수익 대시보드" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: fetchStats, style: { background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "10px", padding: "8px 12px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", gap: "6px", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, color: "#fff" }),
        " 새로고침"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "20px 16px", maxWidth: "480px", margin: "0 auto" }, children: [
      (!authChecked || loading) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "60px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSpinner, {}) }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.2)", borderRadius: "14px", padding: "14px", marginBottom: "16px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { size: 18, color: "#FF5A5F" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: 0, fontSize: `calc(13px * var(--fs, 1))`, color: "#FF5A5F", fontWeight: "800" }, children: error })
      ] }),
      userStats && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "20px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", color: "rgba(255,255,255,0.5)", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "👥 사용자 현황" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setAutoRefresh((r) => !r), style: { background: autoRefresh ? "rgba(0,196,140,0.2)" : "rgba(255,255,255,0.08)", border: "none", borderRadius: "8px", padding: "4px 10px", cursor: "pointer", color: autoRefresh ? "#00C48C" : "rgba(255,255,255,0.5)", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800" }, children: autoRefresh ? "🔴 자동갱신 중" : "⏸ 자동갱신" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: fetchUserStats, disabled: userStatsLoading, style: { background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "8px", padding: "4px 10px", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800", display: "flex", alignItems: "center", gap: "4px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 11 }),
              userStatsLoading ? "..." : "갱신"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(100,181,246,0.08)", border: "1px solid rgba(100,181,246,0.2)", borderRadius: "14px", padding: "14px 10px", textAlign: "center" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 18, color: "#64B5F6", style: { marginBottom: "6px" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(22px * var(--fs, 1))`, fontWeight: "950", color: "#fff", lineHeight: 1 }, children: (userStats.totalUsers || 0).toLocaleString() }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)", fontWeight: "700", marginTop: "4px" }, children: "전체 가입자" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(0,196,140,0.08)", border: "1px solid rgba(0,196,140,0.25)", borderRadius: "14px", padding: "14px 10px", textAlign: "center", position: "relative", overflow: "hidden" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "6px", right: "8px", width: "7px", height: "7px", borderRadius: "50%", background: "#00C48C", boxShadow: "0 0 0 2px rgba(0,196,140,0.3)", animation: "pulse 2s infinite" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Wifi, { size: 18, color: "#00C48C", style: { marginBottom: "6px" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(22px * var(--fs, 1))`, fontWeight: "950", color: "#00C48C", lineHeight: 1 }, children: userStats.onlineNow || 0 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)", fontWeight: "700", marginTop: "4px" }, children: "현재 접속 중" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(9px * var(--fs, 1))`, color: "rgba(0,196,140,0.6)", fontWeight: "600" }, children: "5분 이내 활동" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,90,95,0.08)", border: "1px solid rgba(255,90,95,0.2)", borderRadius: "14px", padding: "14px 10px", textAlign: "center" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(WifiOff, { size: 18, color: "#FF5A5F", style: { marginBottom: "6px" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(22px * var(--fs, 1))`, fontWeight: "950", color: "#FF5A5F", lineHeight: 1 }, children: (userStats.offlineUsers || 0).toLocaleString() }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)", fontWeight: "700", marginTop: "4px" }, children: "미접속 (24h)" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.15)", borderRadius: "12px", padding: "12px", display: "flex", alignItems: "center", gap: "10px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { size: 16, color: "#FFD700" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "950", color: "#FFD700" }, children: userStats.onlineToday || 0 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)", fontWeight: "700" }, children: "오늘 접속자" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,155,38,0.06)", border: "1px solid rgba(255,155,38,0.15)", borderRadius: "12px", padding: "12px", display: "flex", alignItems: "center", gap: "10px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { size: 16, color: "#FF9B26" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "950", color: "#FF9B26" }, children: userStats.newUsers7d || 0 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)", fontWeight: "700" }, children: "신규 가입 (7일)" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(100,210,255,0.06)", border: "1px solid rgba(100,210,255,0.18)", borderRadius: "12px", padding: "12px", display: "flex", alignItems: "center", gap: "10px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 16, color: "#64D2FF" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "950", color: "#64D2FF" }, children: (userStats.todayVisitors ?? "-").toLocaleString?.() ?? userStats.todayVisitors ?? "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)", fontWeight: "700" }, children: "투데이 (IP 기준)" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.18)", borderRadius: "12px", padding: "12px", display: "flex", alignItems: "center", gap: "10px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { size: 16, color: "#A78BFA" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "950", color: "#A78BFA" }, children: (userStats.totalVisitors ?? "-").toLocaleString?.() ?? userStats.totalVisitors ?? "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)", fontWeight: "700" }, children: "토탈투데이 (누적)" })
            ] })
          ] })
        ] }),
        userStats.tierBreakdown && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "12px 14px", border: "1px solid rgba(255,255,255,0.07)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }, children: "플랜별 가입자" }),
          [
            ["FREE", "무료", "#8E8E93"],
            ["BUSINESS_LITE", "라이트", "#64B5F6"],
            ["PRO", "프로", "#00C48C"],
            ["BUSINESS_VIP", "VIP", "#FFD700"],
            ["MASTER", "마스터", "#FF9B26"]
          ].map(([tier, label, color]) => {
            const cnt = userStats.tierBreakdown[tier] || 0;
            const pct = userStats.totalUsers > 0 ? Math.round(cnt / userStats.totalUsers * 100) : 0;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { width: "68px", flexShrink: 0 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", color }, children: label }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(8px * var(--fs, 1))`, color: "rgba(255,255,255,0.25)", fontWeight: "600" }, children: tier })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, height: "5px", background: "rgba(255,255,255,0.07)", borderRadius: "3px", overflow: "hidden" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: "100%", width: `${pct}%`, background: color, borderRadius: "3px", transition: "width 0.6s ease" } }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: cnt > 0 ? color : "rgba(255,255,255,0.3)", fontWeight: "900", minWidth: "28px", textAlign: "right" }, children: [
                cnt,
                "명"
              ] })
            ] }, tier);
          }),
          userStats.rawTiers && Object.keys(userStats.rawTiers).some((r) => !["FREE", "BUSINESS_LITE", "PRO", "BUSINESS_VIP", "MASTER"].includes(r)) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.07)" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(9px * var(--fs, 1))`, fontWeight: "800", color: "#FF5A5F", marginBottom: "4px" }, children: "⚠️ DB 원시 티어 (정규화 필요)" }),
            Object.entries(userStats.rawTiers).filter(([r]) => !["FREE", "BUSINESS_LITE", "PRO", "BUSINESS_VIP", "MASTER"].includes(r)).map(([raw, cnt]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(9px * var(--fs, 1))`, color: "rgba(255,100,100,0.7)", fontWeight: "700" }, children: [
              raw,
              ": ",
              cnt,
              "명"
            ] }, raw))
          ] })
        ] })
      ] }),
      stats && !loading && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "20px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "이번 달 매출", value: `${(stats.monthRevenue || 0).toLocaleString()}원`, icon: TrendingUp, color: "#00C48C", sub: "당월 결제 합계" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "누적 매출", value: `${(stats.totalRevenue || 0).toLocaleString()}원`, icon: DollarSign, color: "#FFD700", sub: "전체 결제 합계" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "활성 구독자", value: `${stats.activeSubscriptions || 0}명`, icon: Users, color: "#64B5F6", sub: "현재 정기구독 중" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "최근 결제", value: `${stats.recentPayments?.length || 0}건`, icon: CreditCard, color: "#FF9B26", sub: "최근 10건 기준" })
        ] }),
        Object.keys(planBreakdown).length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "18px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.07)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", color: "rgba(255,255,255,0.5)", marginBottom: "14px" }, children: "플랜별 수익" }),
          Object.entries(planBreakdown).map(([plan, data]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "12px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "5px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: PLAN_COLOR[plan] || "#fff" }, children: plan }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "950", color: "#fff" }, children: [
                (data.revenue || 0).toLocaleString(),
                "원 ",
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "rgba(255,255,255,0.4)", fontWeight: "700" }, children: [
                  "(",
                  data.count,
                  "명)"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: "100%", width: `${(data.revenue || 0) / maxPlanRevenue * 100}%`, background: PLAN_COLOR[plan] || "#64B5F6", borderRadius: "3px", transition: "width 0.8s ease" } }) })
          ] }, plan))
        ] }),
        stats.recentPayments?.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", color: "rgba(255,255,255,0.5)", marginBottom: "10px" }, children: "최근 결제 내역" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: stats.recentPayments.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(255,255,255,0.06)" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: "#fff" }, children: p.userName || p.userId }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)", fontWeight: "700", marginTop: "2px" }, children: [
                p.planId,
                " · ",
                PG_LABEL_SHORT[p.pgProvider] || p.pgProvider,
                " · ",
                new Date(p.createdAt).toLocaleDateString("ko-KR")
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "right" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "950", color: p.status === "paid" ? "#00C48C" : "#FF5A5F" }, children: [
                (p.amount || 0).toLocaleString(),
                "원"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800", color: p.status === "paid" ? "#00C48C" : "#FF5A5F", marginTop: "2px" }, children: p.status === "paid" ? "완료" : p.status === "failed" ? "실패" : p.status })
            ] })
          ] }, String(p._id || p.merchant_uid || i))) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "24px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", overflow: "hidden" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: "10px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BellRing, { size: 18, color: "#FFD700" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "900", color: "#fff" }, children: "실시간 알림 발송" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", padding: "12px 18px 0", gap: "8px" }, children: [{ id: "broadcast", label: "무선 전체" }, { id: "push", label: "개인 푸시" }].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setAlertTab(t.id), style: { padding: "6px 14px", borderRadius: "10px", border: "none", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "900", cursor: "pointer", background: alertTab === t.id ? "#FFD700" : "rgba(255,255,255,0.08)", color: alertTab === t.id ? "#1A1A2E" : "rgba(255,255,255,0.5)", transition: "all 0.15s" }, children: t.label }, t.id)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "14px 18px 18px", display: "flex", flexDirection: "column", gap: "10px" }, children: alertTab === "broadcast" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: alertMsg, onChange: (e) => setAlertMsg(e.target.value), placeholder: "알림 메시지 (ex: 서검 한치 조황 폭발화!)", style: { padding: "12px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", color: "#fff", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700", outline: "none" } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: alertLocation, onChange: (e) => setAlertLocation(e.target.value), placeholder: "위치 (ex: 서검도 갯바위, 선택사항)", style: { padding: "12px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", color: "#fff", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700", outline: "none" } }),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              disabled: !alertMsg.trim() || alertSending,
              onClick: async () => {
                setAlertSending(true);
                try {
                  await apiClient.post("/api/admin/alert", { message: alertMsg.trim(), location: alertLocation.trim() });
                  addToast("🔔 전체 낚시 알림 발송 완료!", "success");
                  setAlertMsg("");
                  setAlertLocation("");
                } catch (err) {
                  addToast(err.response?.data?.error || "발송 실패", "error");
                } finally {
                  setAlertSending(false);
                }
              },
              style: { padding: "13px", border: "none", borderRadius: "12px", background: alertMsg.trim() ? "linear-gradient(135deg,#FFD700,#FF9B26)" : "rgba(255,255,255,0.06)", color: alertMsg.trim() ? "#1A1A2E" : "rgba(255,255,255,0.25)", fontWeight: "950", fontSize: `calc(14px * var(--fs, 1))`, cursor: alertMsg.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 16 }),
                alertSending ? "발송 중..." : "전체 알림 발송"
              ]
            }
          )
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: pushEmail, onChange: (e) => setPushEmail(e.target.value), placeholder: "대상 이메일", style: { padding: "12px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", color: "#fff", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700", outline: "none" } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: pushTitle, onChange: (e) => setPushTitle(e.target.value), placeholder: "알림 제목 (선택)", style: { padding: "12px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", color: "#fff", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700", outline: "none" } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: pushMsg, onChange: (e) => setPushMsg(e.target.value), placeholder: "개인 메시지", style: { padding: "12px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", color: "#fff", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700", outline: "none" } }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              disabled: !pushEmail.trim() || !pushMsg.trim() || alertSending,
              onClick: async () => {
                setAlertSending(true);
                try {
                  await apiClient.post("/api/admin/push", { targetEmail: pushEmail.trim(), title: pushTitle.trim() || "낚시GO 알림", message: pushMsg.trim() });
                  addToast(`🔔 ${pushEmail}님께 푸시 발송 완료!`, "success");
                  setPushEmail("");
                  setPushTitle("");
                  setPushMsg("");
                } catch (err) {
                  addToast(err.response?.data?.error || "발송 실패", "error");
                } finally {
                  setAlertSending(false);
                }
              },
              style: { padding: "13px", border: "none", borderRadius: "12px", background: pushEmail.trim() && pushMsg.trim() ? "linear-gradient(135deg,#64B5F6,#0056D2)" : "rgba(255,255,255,0.06)", color: pushEmail.trim() && pushMsg.trim() ? "#fff" : "rgba(255,255,255,0.25)", fontWeight: "950", fontSize: `calc(14px * var(--fs, 1))`, cursor: pushEmail.trim() && pushMsg.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 16 }),
                alertSending ? "발송 중..." : "개인 푸시 발송"
              ]
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CsAdminPanel, { addToast }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ForceTierPanel, { addToast })
    ] })
  ] });
}
const STATUS_CFG = {
  pending: { label: "답변 대기", color: "#FF9B26", bg: "rgba(255,155,38,0.15)" },
  answered: { label: "답변 완료", color: "#00C48C", bg: "rgba(0,196,140,0.12)" },
  closed: { label: "처리 완료", color: "#8E8E93", bg: "rgba(142,142,147,0.15)" }
};
const CATS = ["전체", "일반 문의", "서비스 오류", "결제/구독", "계정 문의", "건의사항", "신고/제재", "기타"];
function CsAdminPanel({ addToast }) {
  const [items, setItems] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [filterCat, setFilterCat] = reactExports.useState("전체");
  const [filterSt, setFilterSt] = reactExports.useState("all");
  const [expandId, setExpandId] = reactExports.useState(null);
  const [replyMap, setReplyMap] = reactExports.useState({});
  const [sendingId, setSendingId] = reactExports.useState(null);
  const [showFilter, setShowFilter] = reactExports.useState(false);
  const [csError, setCsError] = reactExports.useState(false);
  const fetchAll = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/cs/inquiries");
      setItems(Array.isArray(res.data) ? res.data : []);
      setCsError(false);
    } catch {
      setCsError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 6e4);
    return () => clearInterval(id);
  }, [fetchAll]);
  const sendReply = async (id) => {
    const reply = (replyMap[id] || "").trim();
    if (!reply) {
      addToast("답변 내용을 입력하세요.", "error");
      return;
    }
    setSendingId(id);
    try {
      await apiClient.put(`/api/cs/inquiry/${id}/reply`, { reply });
      addToast("✅ 답변이 등록되었습니다.", "success");
      setReplyMap((m) => ({ ...m, [id]: "" }));
      setExpandId(null);
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.error || "답변 실패", "error");
    } finally {
      setSendingId(null);
    }
  };
  const filtered = items.filter((i) => {
    const catOk = filterCat === "전체" || i.category === filterCat;
    const stOk = filterSt === "all" || i.status === filterSt;
    return catOk && stOk;
  });
  const pendingCnt = items.filter((i) => i.status === "pending").length;
  const inp = { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", padding: "11px 14px", color: "#fff", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700", outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "24px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", overflow: "hidden" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { size: 18, color: "#64B5F6" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "900", color: "#fff" }, children: "1:1 고객문의 관리" }),
        pendingCnt > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { background: "#FF5A5F", color: "#fff", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", padding: "2px 8px", borderRadius: "20px" }, children: [
          "미답변 ",
          pendingCnt,
          "건"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setShowFilter((f) => !f), style: { background: showFilter ? "rgba(100,181,246,0.2)" : "rgba(255,255,255,0.08)", border: "none", borderRadius: "10px", padding: "7px 12px", cursor: "pointer", color: "#64B5F6", display: "flex", alignItems: "center", gap: "5px", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Filter, { size: 13 }),
          " 필터"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: fetchAll, style: { background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "10px", padding: "7px 12px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", gap: "5px", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 13 }),
          " 새로고침"
        ] })
      ] })
    ] }),
    showFilter && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: "8px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" }, children: ["all", "pending", "answered"].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setFilterSt(s),
          style: {
            padding: "5px 12px",
            borderRadius: "10px",
            border: "none",
            fontSize: `calc(11px * var(--fs, 1))`,
            fontWeight: "900",
            cursor: "pointer",
            background: filterSt === s ? "#64B5F6" : "rgba(255,255,255,0.08)",
            color: filterSt === s ? "#0d1b3e" : "rgba(255,255,255,0.55)"
          },
          children: s === "all" ? "전체" : s === "pending" ? "⏳ 대기" : "✅ 완료"
        },
        s
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" }, children: CATS.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setFilterCat(c),
          style: {
            padding: "5px 12px",
            borderRadius: "10px",
            border: "none",
            fontSize: `calc(11px * var(--fs, 1))`,
            fontWeight: "900",
            cursor: "pointer",
            background: filterCat === c ? "#FFD700" : "rgba(255,255,255,0.08)",
            color: filterCat === c ? "#1A1A2E" : "rgba(255,255,255,0.55)"
          },
          children: c
        },
        c
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "14px 18px", display: "flex", flexDirection: "column", gap: "10px" }, children: [
      loading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "30px", color: "rgba(255,255,255,0.4)", fontSize: `calc(13px * var(--fs, 1))` }, children: "불러오는 중..." }),
      !loading && csError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "20px", color: "rgba(255,90,95,0.7)", fontSize: `calc(12px * var(--fs, 1))`, border: "1px dashed rgba(255,90,95,0.2)", borderRadius: "12px", fontWeight: "700" }, children: [
        "⚠️ 문의 목록을 불러오지 못했습니다. ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: fetchAll, style: { background: "none", border: "none", color: "#64B5F6", cursor: "pointer", fontWeight: "800", fontSize: `calc(12px * var(--fs, 1))` }, children: "재시도" })
      ] }),
      !loading && !csError && filtered.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "30px", color: "rgba(255,255,255,0.3)", fontSize: `calc(13px * var(--fs, 1))`, border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "12px" }, children: "문의 내역이 없습니다." }),
      filtered.map((item) => {
        const cfg = STATUS_CFG[item.status] || STATUS_CFG.pending;
        const isExp = expandId === item.id;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { border: `1px solid ${item.status === "pending" ? "rgba(255,155,38,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: "14px", overflow: "hidden" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              onClick: () => setExpandId(isExp ? null : item.id),
              style: { padding: "12px 14px", cursor: "pointer", background: item.status === "pending" ? "rgba(255,155,38,0.05)" : "rgba(255,255,255,0.03)", display: "flex", alignItems: "flex-start", gap: "10px" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "5px" }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, background: "rgba(100,181,246,0.2)", color: "#64B5F6", padding: "2px 7px", borderRadius: "6px", fontWeight: "800" }, children: item.category }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, background: cfg.bg, color: cfg.color, padding: "2px 7px", borderRadius: "6px", fontWeight: "800", display: "flex", alignItems: "center", gap: "3px" }, children: [
                      item.status === "pending" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 9 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 9 }),
                      cfg.label
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)", fontWeight: "700" }, children: item.nickname || item.authorEmail }),
                    item.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#FFD700", fontWeight: "700" }, children: [
                      "📞 ",
                      item.phone
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: "#fff" }, children: item.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.35)", fontWeight: "600", marginTop: "3px" }, children: [
                    item.realName && `${item.realName} · `,
                    new Date(item.createdAt).toLocaleString("ko-KR"),
                    " · ",
                    item.id
                  ] })
                ] }),
                isExp ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { size: 16, color: "rgba(255,255,255,0.4)" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 16, color: "rgba(255,255,255,0.4)" })
              ]
            }
          ),
          isExp && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "14px", borderTop: "1px solid rgba(255,255,255,0.07)" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px", marginBottom: "12px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800", color: "#64B5F6", marginBottom: "6px" }, children: "📝 문의 내용" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "rgba(255,255,255,0.8)", fontFamily: "inherit", whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.6 }, children: item.content })
            ] }),
            item.reply && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(0,196,140,0.1)", border: "1px solid rgba(0,196,140,0.25)", borderRadius: "10px", padding: "12px", marginBottom: "12px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800", color: "#00C48C", marginBottom: "6px" }, children: [
                "✅ 등록된 답변 · ",
                new Date(item.repliedAt).toLocaleString("ko-KR")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "rgba(255,255,255,0.8)", fontFamily: "inherit", whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.6 }, children: item.reply })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800", color: "rgba(255,255,255,0.5)", marginBottom: "6px" }, children: item.reply ? "✏️ 답변 수정" : "💬 답변 작성" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "textarea",
                {
                  value: replyMap[item.id] || "",
                  onChange: (e) => setReplyMap((m) => ({ ...m, [item.id]: e.target.value })),
                  placeholder: item.reply ? "수정할 답변을 입력하세요..." : "고객 문의에 대한 답변을 입력하세요...\n\n안녕하세요, 낚시GO 운영팀입니다.\n\n",
                  rows: 5,
                  style: { ...inp, resize: "vertical", lineHeight: 1.6 }
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => sendReply(item.id),
                  disabled: sendingId === item.id || !(replyMap[item.id] || "").trim(),
                  style: {
                    marginTop: "8px",
                    width: "100%",
                    padding: "12px",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: `calc(13px * var(--fs, 1))`,
                    fontWeight: "900",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "7px",
                    transition: "all 0.2s",
                    background: (replyMap[item.id] || "").trim() ? "linear-gradient(135deg, #00C48C, #00897B)" : "rgba(255,255,255,0.06)",
                    color: (replyMap[item.id] || "").trim() ? "#fff" : "rgba(255,255,255,0.25)"
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 14 }),
                    sendingId === item.id ? "전송 중..." : "답변 등록"
                  ]
                }
              )
            ] })
          ] })
        ] }, item.id);
      })
    ] }),
    items.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: "16px" }, children: [["전체", items.length, "#fff"], ["미답변", pendingCnt, "#FF9B26"], ["완료", items.filter((i) => i.status === "answered").length, "#00C48C"]].map(([l, v, c]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "800", color: "rgba(255,255,255,0.4)" }, children: [
      l,
      ": ",
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: c, fontWeight: "900" }, children: [
        v,
        "건"
      ] })
    ] }, l)) })
  ] });
}
const TIER_COLOR = { FREE: "#8E8E93", BUSINESS_LITE: "#64B5F6", PRO: "#00C48C", BUSINESS_VIP: "#FFD700", MASTER: "#FF9B26" };
function ForceTierPanel({ addToast }) {
  const [target, setTarget] = reactExports.useState("");
  const [tier, setTier] = reactExports.useState("FREE");
  const [loading, setLoading] = reactExports.useState(false);
  const [suspects, setSuspects] = reactExports.useState([]);
  const [suspectLoading, setSuspectLoading] = reactExports.useState(false);
  const [suspectNote, setSuspectNote] = reactExports.useState("");
  const [resettingId, setResettingId] = reactExports.useState(null);
  const loadSuspects = async () => {
    setSuspectLoading(true);
    try {
      const res = await apiClient.get("/api/admin/suspicious-tiers");
      setSuspects(res.data.suspects || []);
      setSuspectNote(res.data.note || "");
    } catch (err) {
      addToast(err.response?.data?.error || "목록 로드 실패", "error");
    } finally {
      setSuspectLoading(false);
    }
  };
  reactExports.useEffect(() => {
    loadSuspects();
  }, []);
  const handleForce = async (targetEmail, targetTier = tier) => {
    const t = (targetEmail || target).trim();
    if (!t) {
      addToast("이메일/ID/닉네임 입력 필요", "error");
      return;
    }
    setLoading(true);
    if (targetEmail)
      setResettingId(targetEmail);
    try {
      const res = await apiClient.post("/api/admin/force-tier", { targetEmail: t, tier: targetTier });
      addToast(`✅ ${res.data.message}`, "success");
      if (!targetEmail)
        setTarget("");
      setSuspects((prev) => prev.filter((s) => s.email !== t && s.id !== t && s.name !== t));
    } catch (err) {
      addToast(err.response?.data?.error || "변경 실패", "error");
    } finally {
      setLoading(false);
      setResettingId(null);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "24px", background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.2)", borderRadius: "18px", overflow: "hidden" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px 18px", borderBottom: "1px solid rgba(255,59,48,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "18px" }, children: "🚨" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "900", color: "#FF5A5F" }, children: "불법 Tier 강제 복원" }),
        suspects.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { background: "#FF5A5F", color: "#fff", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", padding: "2px 8px", borderRadius: "20px" }, children: [
          "의심 ",
          suspects.length,
          "건"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: loadSuspects,
          disabled: suspectLoading,
          style: { background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "8px", padding: "5px 10px", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "800", display: "flex", alignItems: "center", gap: "4px" },
          children: [
            "🔄 ",
            suspectLoading ? "..." : "새로고침"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "14px 18px", borderBottom: "1px solid rgba(255,59,48,0.1)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)", fontWeight: "700", marginBottom: "10px" }, children: [
        "🔍 결제기록 없이 유료 Tier를 보유한 계정 목록",
        suspectNote && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#FF9B26", marginLeft: "6px" }, children: [
          "(",
          suspectNote,
          ")"
        ] })
      ] }),
      suspectLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "20px", color: "rgba(255,255,255,0.3)", fontSize: `calc(12px * var(--fs, 1))` }, children: "불러오는 중..." }) : suspects.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "16px", color: "#00C48C", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", border: "1px dashed rgba(0,196,140,0.3)", borderRadius: "10px" }, children: "✅ 의심 계정 없음 — 모든 유료 티어 계정이 정상 결제됨" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexDirection: "column", gap: "8px", maxHeight: "320px", overflowY: "auto" }, children: suspects.map((s, i) => {
        const uid = s.email || s.id || s.name || "?";
        const isResetting = resettingId === uid;
        const joinDate = s.joinedAt ? new Date(s.joinedAt).toLocaleDateString("ko-KR") : "?";
        const expDate = s.expiresAt ? new Date(s.expiresAt).toLocaleDateString("ko-KR") : "없음";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
          background: "rgba(255,59,48,0.08)",
          border: "1px solid rgba(255,59,48,0.25)",
          borderRadius: "12px",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { minWidth: "22px", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "900", color: "rgba(255,255,255,0.3)", textAlign: "center" }, children: i + 1 }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px", flexWrap: "wrap" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: "#fff", wordBreak: "break-all" }, children: s.name || s.id || s.email || "?" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, background: `${TIER_COLOR[s.tier] || "#888"}22`, color: TIER_COLOR[s.tier] || "#888", padding: "2px 7px", borderRadius: "6px", fontWeight: "900", border: `1px solid ${TIER_COLOR[s.tier] || "#888"}55` }, children: s.tier })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.35)", fontWeight: "700" }, children: [
              s.email || s.id,
              " · 가입 ",
              joinDate
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#FF9B26", fontWeight: "700", marginTop: "2px" }, children: [
              "⚠️ 결제기록 없음 · 만료 ",
              expDate
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => handleForce(uid, "FREE"),
              disabled: isResetting,
              style: {
                flexShrink: 0,
                padding: "7px 12px",
                border: "none",
                borderRadius: "10px",
                background: isResetting ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#FF5A5F,#cc2929)",
                color: "#fff",
                fontWeight: "900",
                fontSize: `calc(11px * var(--fs, 1))`,
                cursor: isResetting ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s"
              },
              children: isResetting ? "⏳" : "🔨 FREE"
            }
          )
        ] }, uid + i);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "14px 18px", display: "flex", flexDirection: "column", gap: "10px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)", fontWeight: "700" }, children: "✏️ 직접 입력해서 강제 변경" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          value: target,
          onChange: (e) => setTarget(e.target.value),
          placeholder: "이메일/ID/닉네임",
          style: { padding: "11px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,59,48,0.3)", borderRadius: "12px", color: "#fff", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700", outline: "none" }
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "8px" }, children: ["FREE", "BUSINESS_LITE", "PRO", "BUSINESS_VIP"].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setTier(t), style: { flex: 1, padding: "7px 4px", borderRadius: "10px", border: "none", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", cursor: "pointer", background: tier === t ? t === "FREE" ? "#FF5A5F" : "#00C48C" : "rgba(255,255,255,0.08)", color: "#fff", transition: "all 0.15s" }, children: t === "FREE" ? "FREE" : t === "BUSINESS_LITE" ? "LITE" : t === "PRO" ? "PRO" : "VIP" }, t)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => handleForce("", tier),
          disabled: !target.trim() || loading,
          style: { padding: "12px", border: "none", borderRadius: "12px", background: target.trim() ? "linear-gradient(135deg,#FF5A5F,#cc2929)" : "rgba(255,255,255,0.06)", color: "#fff", fontWeight: "950", fontSize: `calc(13px * var(--fs, 1))`, cursor: target.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" },
          children: [
            "🔨 ",
            loading ? "처리 중..." : `${target || "계정 입력"} → ${tier} 강제 변경`
          ]
        }
      )
    ] })
  ] });
}

export { AdminDashboard as default };
