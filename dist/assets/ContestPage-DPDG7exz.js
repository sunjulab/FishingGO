import { u as useUserStore, c as apiClient, j as jsxRuntimeExports } from './index-CUv3Hibb.js';
import { u as useNavigate, r as reactExports } from './vendor-react-BzbiWsGG.js';
import { d as ChevronLeft, l as Clock } from './vendor-icons-C5BxRig-.js';
import { a as getFishEmoji } from './fishRules-C-ea2o-Y.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

const MEDAL = ["🥇", "🥈", "🥉"];
function ContestCard({ contest, onPress }) {
  const now = /* @__PURE__ */ new Date();
  const endDate = new Date(contest.endDate);
  const msLeft = endDate - now;
  const daysLeft = Math.ceil(msLeft / (1e3 * 60 * 60 * 24));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: onPress, style: {
    background: "linear-gradient(135deg,#0a1628,#0056D2)",
    borderRadius: "20px",
    padding: "18px",
    marginBottom: "12px",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(0,86,210,0.3)"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "rgba(255,255,255,0.2)", borderRadius: "20px", padding: "4px 12px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#FDE68A", fontWeight: "900", fontSize: `calc(12px * var(--fs,1))` }, children: [
        "🏆 ",
        contest.region || "전국",
        " 대회"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: daysLeft <= 3 ? "#FF6B6B" : "#4ade80", fontWeight: "800", fontSize: `calc(12px * var(--fs,1))` }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 12, style: { verticalAlign: "middle", marginRight: "3px" } }),
        daysLeft,
        "일 남음"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#fff", fontWeight: "900", fontSize: `calc(18px * var(--fs,1))`, marginBottom: "6px" }, children: contest.title }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "24px" }, children: getFishEmoji(contest.fishName) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#BAE6FD", fontSize: `calc(13px * var(--fs,1))`, fontWeight: "700" }, children: [
          "대상 어종: ",
          contest.fishName
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "rgba(255,255,255,0.6)", fontSize: `calc(11px * var(--fs,1))` }, children: contest.metric === "size" ? "📏 크기(cm) 기준" : "⚖️ 무게(kg) 기준" })
      ] })
    ] }),
    contest.top3?.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(0,0,0,0.3)", borderRadius: "12px", padding: "10px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "rgba(255,255,255,0.6)", fontSize: `calc(10px * var(--fs,1))`, fontWeight: "700", marginBottom: "6px" }, children: "현재 순위" }),
      contest.top3.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "3px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#FDE68A", fontSize: `calc(12px * var(--fs,1))`, fontWeight: "700" }, children: [
          MEDAL[i],
          " ",
          r.userName || "익명"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#fff", fontSize: `calc(12px * var(--fs,1))`, fontWeight: "700" }, children: contest.metric === "size" ? `${r.fishSize}cm` : `${r.fishWeight}kg` })
      ] }, i))
    ] }),
    contest.prize && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: "10px", background: "rgba(253,230,138,0.2)", borderRadius: "8px", padding: "6px 10px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#FDE68A", fontSize: `calc(12px * var(--fs,1))`, fontWeight: "700" }, children: [
      "🎁 상품: ",
      contest.prize
    ] }) })
  ] });
}
function ContestPage() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const isAdmin = useUserStore((s) => s.userTier === "MASTER" || s.user?.email === "sunjulab.k@gmail.com");
  const [contests, setContests] = reactExports.useState([]);
  const [selected, setSelected] = reactExports.useState(null);
  const [ranking, setRanking] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [showAdmin, setShowAdmin] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({ title: "", fishName: "감성돔", region: "전국", metric: "size", startDate: "", endDate: "", description: "", prize: "" });
  reactExports.useEffect(() => {
    apiClient.get("/api/contest/active").then((r) => setContests(r.data.contests || [])).catch(() => {
    }).finally(() => setLoading(false));
  }, []);
  const loadRanking = async (contest) => {
    setSelected(contest);
    try {
      const res = await apiClient.get(`/api/contest/${contest._id}/ranking`);
      setRanking(res.data.ranking || []);
    } catch {
      setRanking([]);
    }
  };
  const handleCreateContest = async () => {
    if (!form.title || !form.startDate || !form.endDate)
      return alert("필수 항목을 입력하세요");
    try {
      await apiClient.post("/api/contest", form);
      alert("대회 등록 완료!");
      setShowAdmin(false);
      const res = await apiClient.get("/api/contest/active");
      setContests(res.data.contests || []);
    } catch (e) {
      alert("오류: " + (e.response?.data?.error || e.message));
    }
  };
  const inputSt = { width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e0e0e0", fontSize: `calc(14px * var(--fs,1))`, fontFamily: "inherit", boxSizing: "border-box", marginTop: "4px" };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { minHeight: "100dvh", background: "#f8fafc", paddingBottom: "100px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "linear-gradient(135deg,#0a1628,#0056D2)", padding: "16px", paddingTop: "calc(env(safe-area-inset-top,0px) + 16px)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [
        selected ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
          setSelected(null);
          setRanking([]);
        }, style: { background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 20 }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => navigate(-1), style: { background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 20 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { style: { color: "#fff", fontWeight: "900", fontSize: `calc(18px * var(--fs,1))`, margin: 0 }, children: [
            "🏆 ",
            selected ? selected.title : "전국 낚시 대회"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "rgba(255,255,255,0.7)", fontSize: `calc(11px * var(--fs,1))`, margin: 0 }, children: selected ? `${selected.fishName} · ${selected.metric === "size" ? "크기" : "무게"} 기준` : "어종별 월간 대회 · 시즌 랭킹" })
        ] })
      ] }),
      isAdmin && !selected && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowAdmin(!showAdmin), style: { background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "10px", padding: "6px 12px", color: "#fff", fontWeight: "700", fontSize: `calc(12px * var(--fs,1))`, cursor: "pointer" }, children: "+ 대회 등록" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px" }, children: [
      showAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "16px", padding: "16px", marginBottom: "16px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: "900", fontSize: `calc(16px * var(--fs,1))`, marginBottom: "12px" }, children: "대회 등록" }),
        [
          { label: "대회명", key: "title", placeholder: "5월 감성돔 왕중왕전" },
          { label: "상금/상품", key: "prize", placeholder: "낚시 용품 세트" },
          { label: "설명", key: "description", placeholder: "대회 상세 설명" }
        ].map(({ label, key, placeholder }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: { fontSize: `calc(11px * var(--fs,1))`, fontWeight: "700", color: "#64748b" }, children: label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { style: inputSt, placeholder, value: form[key], onChange: (e) => setForm((p) => ({ ...p, [key]: e.target.value })) })
        ] }, key)),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: { fontSize: `calc(11px * var(--fs,1))`, fontWeight: "700", color: "#64748b" }, children: "어종" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("select", { style: inputSt, value: form.fishName, onChange: (e) => setForm((p) => ({ ...p, fishName: e.target.value })), children: ["감성돔", "광어", "우럭", "참돔", "볼락", "농어", "방어", "고등어", "붕어"].map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: f }, f)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: { fontSize: `calc(11px * var(--fs,1))`, fontWeight: "700", color: "#64748b" }, children: "지역" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("select", { style: inputSt, value: form.region, onChange: (e) => setForm((p) => ({ ...p, region: e.target.value })), children: ["전국", "남해", "서해", "동해", "제주", "내수면"].map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: r }, r)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: { fontSize: `calc(11px * var(--fs,1))`, fontWeight: "700", color: "#64748b" }, children: "시작일" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "date", style: inputSt, value: form.startDate, onChange: (e) => setForm((p) => ({ ...p, startDate: e.target.value })) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: { fontSize: `calc(11px * var(--fs,1))`, fontWeight: "700", color: "#64748b" }, children: "종료일" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "date", style: inputSt, value: form.endDate, onChange: (e) => setForm((p) => ({ ...p, endDate: e.target.value })) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleCreateContest, style: { width: "100%", padding: "12px", borderRadius: "12px", border: "none", background: "#0056D2", color: "#fff", fontWeight: "900", cursor: "pointer", fontSize: `calc(14px * var(--fs,1))` }, children: "대회 등록하기" })
      ] }),
      !selected && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "40px", color: "#94a3b8" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "36px", marginBottom: "8px" }, children: "🏆" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: "700" }, children: "대회 정보 로딩 중..." })
        ] }) : contests.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "40px", color: "#94a3b8" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "36px", marginBottom: "8px" }, children: "🎣" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: "700" }, children: "현재 진행 중인 대회가 없습니다" }),
          isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs,1))`, marginTop: "4px" }, children: "관리자 버튼으로 대회를 등록하세요" })
        ] }) : contests.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(ContestCard, { contest: c, onPress: () => loadRanking(c) }, c._id)),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => navigate("/catch-upload"), style: {
          width: "100%",
          padding: "14px",
          borderRadius: "14px",
          border: "none",
          marginTop: "8px",
          background: "linear-gradient(135deg,#0056D2,#003fa3)",
          color: "#fff",
          fontWeight: "900",
          fontSize: `calc(15px * var(--fs,1))`,
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(0,86,210,0.3)"
        }, children: "📸 내 조황 인증하고 대회 참가하기" })
      ] }),
      selected && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => navigate("/catch-upload"), style: {
          width: "100%",
          padding: "13px",
          borderRadius: "13px",
          border: "none",
          marginBottom: "14px",
          background: "linear-gradient(135deg,#0056D2,#003fa3)",
          color: "#fff",
          fontWeight: "900",
          fontSize: `calc(14px * var(--fs,1))`,
          cursor: "pointer"
        }, children: "📸 조황 인증하고 이 대회 참가하기" }),
        ranking.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "40px", color: "#94a3b8" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "36px", marginBottom: "8px" }, children: "🐟" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: "700" }, children: "아직 참가자가 없습니다" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: ranking.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
          background: i < 3 ? "linear-gradient(135deg,#FEF9C3,#FEF3C7)" : "#fff",
          borderRadius: "14px",
          padding: "12px 14px",
          border: i < 3 ? "2px solid #F59E0B" : "1.5px solid #f1f5f9",
          display: "flex",
          gap: "12px",
          alignItems: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { minWidth: "36px", textAlign: "center", fontSize: i < 3 ? "24px" : `calc(16px * var(--fs,1))`, fontWeight: "900", color: "#94a3b8" }, children: i < 3 ? MEDAL[i] : i + 1 }),
          r.imageUrl && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: r.imageUrl, alt: "", style: { width: "48px", height: "48px", borderRadius: "10px", objectFit: "cover" } }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: "900", fontSize: `calc(15px * var(--fs,1))`, color: "#0d1b2a" }, children: r.userName || "익명" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(12px * var(--fs,1))`, color: "#64748b" }, children: [
              r.fishName,
              " · ",
              r.location || "장소 미입력"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: "900", fontSize: `calc(16px * var(--fs,1))`, color: "#0056D2" }, children: selected.metric === "size" ? `${r.fishSize}cm` : `${r.fishWeight}kg` })
        ] }, r._id)) })
      ] })
    ] })
  ] });
}

export { ContestPage as default };
