import { b as useToastStore, u as useUserStore, A as ADMIN_ID, a as ADMIN_EMAIL, c as apiClient, j as jsxRuntimeExports } from './index-rdBGUi8d.js';
import { u as useNavigate, r as reactExports } from './vendor-react-BzbiWsGG.js';
import { d as ChevronLeft, A as AlertCircle, m as Search, X, p as Map, x as Loader2, W as Waves, o as Wind, ad as Droplets, am as Navigation, an as Sunrise, ao as Sunset, j as ChevronDown } from './vendor-icons-C5BxRig-.js';
import { g as getPointSpecificData, A as ALL_FISHING_POINTS } from './fishingData-DUAFbpZH.js';
import { e as evaluateFishingCondition } from './evaluator-ZO7-HWnF.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

const EMOJI_MAP = { "방파제": "⚓", "갯바위": "🪨", "선착장": "🚢", "항구": "🏖️" };
const REGION_STATION = {
  "동해": "DT_0033",
  "서해": "DT_0009",
  "남해": "DT_0004",
  "제주": "DT_0010"
};
function buildMarineDisplay(data) {
  if (!data)
    return null;
  const sst = data.sst ?? data.layers?.upper;
  const wave = data.wave?.coastal ?? data.wave;
  const speed = data.wind?.speed ?? data.wind;
  const dir = data.wind?.dir ?? "";
  const phase = data.tide?.phase ?? data.tide;
  const score = data.fishingScore ?? data.fishingIndex ?? 60;
  let status = "보통";
  if (score >= 80)
    status = "최고";
  else if (score >= 65)
    status = "활발";
  else if (score >= 50)
    status = "보통";
  else if (score >= 35)
    status = "주의";
  else
    status = "경고";
  return {
    temp: sst != null ? `${sst}°C` : "-",
    wave: wave != null ? `${wave}m` : "-",
    wind: speed != null ? `${dir ? dir + " " : ""}${speed}m/s` : "-",
    tide: phase ?? "-",
    status,
    risk: score < 40 ? "높음" : score < 55 ? "보통" : "낮음",
    tideHigh: data.tide?.high,
    tideLow: data.tide?.low,
    tidePredictions: data.tide_predictions,
    sunrise: data.sunrise,
    sunset: data.sunset
  };
}
function buildLocalFallback(point) {
  const pData = getPointSpecificData(point);
  const cond = evaluateFishingCondition(pData, point);
  return {
    temp: pData.sst ? `${pData.sst}°C` : "-",
    wave: pData.wave?.coastal ? `${pData.wave.coastal}m` : "-",
    wind: pData.wind?.speed ? `${pData.wind.speed}m/s` : "-",
    tide: pData.tide?.phase ?? "-",
    status: cond.status,
    risk: cond.score < 50 ? "주의" : "낮음",
    tideHigh: pData.tide?.high,
    tideLow: pData.tide?.low
  };
}
const MARINE_FALLBACK = {
  "동해": { temp: "13.5°C", wave: "0.8m", wind: "4.5m/s", tide: "-", status: "보통", risk: "보통" },
  "서해": { temp: "12.2°C", wave: "1.1m", wind: "6.8m/s", tide: "-", status: "주의", risk: "높음" },
  "남해": { temp: "16.8°C", wave: "0.5m", wind: "3.2m/s", tide: "-", status: "활발", risk: "낮음" },
  "제주": { temp: "18.5°C", wave: "0.6m", wind: "3.5m/s", tide: "-", status: "보통", risk: "낮음" }
};
function calcSunrise() {
  const now = /* @__PURE__ */ new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
  const baseRise = 6 + 1.2 * Math.sin((dayOfYear - 80) * Math.PI / 182.5);
  const baseSet = 18 - 1.2 * Math.sin((dayOfYear - 80) * Math.PI / 182.5);
  const rH = Math.floor(baseRise);
  const rM = Math.round((baseRise - rH) * 60).toString().padStart(2, "0");
  const sH = Math.floor(baseSet);
  const sM = Math.round((baseSet - sH) * 60).toString().padStart(2, "0");
  return { sunrise: `${rH}:${rM}`, sunset: `${sH}:${sM}` };
}
function TideChart({ data }) {
  if (!data || data.length < 2)
    return null;
  const W = 300, H = 120;
  const pad = { top: 18, right: 10, bottom: 22, left: 10 };
  const levels = data.map((d) => d.level);
  const minL = Math.min(...levels) - 50;
  const maxL = Math.max(...levels) + 50;
  const range = maxL - minL || 1;
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;
  const xOf = (i) => pad.left + i / (data.length - 1) * cW;
  const yOf = (l) => pad.top + (1 - (l - minL) / range) * cH;
  const pts = data.map((d, i) => `${xOf(i).toFixed(1)},${yOf(d.level).toFixed(1)}`).join(" ");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "100%", height: "100%", viewBox: `0 0 ${W} ${H}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "tideGrad-wd", x1: "0", y1: "0", x2: "0", y2: "1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "#1565C0", stopOpacity: "0.18" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "#1565C0", stopOpacity: "0.01" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "polygon",
      {
        points: `${pts} ${xOf(data.length - 1).toFixed(1)},${H} ${xOf(0).toFixed(1)},${H}`,
        fill: "url(#tideGrad-wd)"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: pts, fill: "none", stroke: "#1565C0", strokeWidth: "2.5", strokeLinejoin: "round", strokeLinecap: "round" }),
    data.map((d, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: xOf(i), cy: yOf(d.level), r: "4", fill: "#1565C0", stroke: "#fff", strokeWidth: "2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: xOf(i), y: H - 4, textAnchor: "middle", fontSize: "9", fill: "#888", fontWeight: "700", children: d.time })
    ] }, d.time))
  ] });
}
function WeatherDashboard() {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  const canAccessSatellite = useUserStore(
    (s) => ["PRO", "BUSINESS_VIP", "MASTER"].includes(s.userTier) || s.user?.id === ADMIN_ID || s.user?.email === ADMIN_EMAIL
  );
  const [activeRegion, setActiveRegion] = reactExports.useState("남해");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [searchResults, setSearchResults] = reactExports.useState([]);
  const [showSearch, setShowSearch] = reactExports.useState(false);
  const [selectedPoint, setSelectedPoint] = reactExports.useState(null);
  const [liveData, setLiveData] = reactExports.useState(null);
  const [apiLoading, setApiLoading] = reactExports.useState(false);
  const [lastUpdated, setLastUpdated] = reactExports.useState(null);
  const [usingFallback, setUsingFallback] = reactExports.useState(false);
  const searchRef = reactExports.useRef(null);
  const searchTimerRef = reactExports.useRef(null);
  reactExports.useEffect(() => () => {
    if (searchTimerRef.current)
      clearTimeout(searchTimerRef.current);
  }, []);
  reactExports.useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const fetchMarineData = reactExports.useCallback(async (stationId) => {
    if (!stationId)
      return;
    setApiLoading(true);
    try {
      const res = await apiClient.get(`/api/weather/precision?stationId=${stationId}`);
      setLiveData(res.data);
      setLastUpdated(/* @__PURE__ */ new Date());
      setUsingFallback(false);
    } catch (err) {
      if (false)
        console.warn("[WeatherDashboard] API 실패, fallback 사용:", err.message);
      setLiveData(null);
      setUsingFallback(true);
    } finally {
      setApiLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    if (selectedPoint) {
      const sid = selectedPoint.obsCode || REGION_STATION[selectedPoint.region?.replace(/권$/, "")] || "DT_0004";
      fetchMarineData(sid);
    } else {
      fetchMarineData(REGION_STATION[activeRegion]);
    }
  }, [selectedPoint, activeRegion, fetchMarineData]);
  const handleSearch = (q) => {
    setSearchQuery(q);
    if (searchTimerRef.current)
      clearTimeout(searchTimerRef.current);
    if (!q.trim()) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    searchTimerRef.current = setTimeout(() => {
      const low = q.toLowerCase();
      const filtered = ALL_FISHING_POINTS.filter(
        (p) => p.name.toLowerCase().includes(low) || p.fish.toLowerCase().includes(low) || p.type.toLowerCase().includes(low) || p.region && p.region.toLowerCase().includes(low)
      );
      setSearchResults(filtered);
      setShowSearch(true);
    }, 250);
  };
  const handleSelect = (p) => {
    setSelectedPoint(p);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    setActiveRegion("");
  };
  const { current, currentTitle, tideChartData } = reactExports.useMemo(() => {
    let _title, _cur, _chart = [];
    if (selectedPoint) {
      _title = selectedPoint.name;
      _cur = liveData && !apiLoading ? buildMarineDisplay(liveData) || buildLocalFallback(selectedPoint) : buildLocalFallback(selectedPoint);
    } else {
      _title = `${activeRegion} 앞바다`;
      _cur = liveData && !apiLoading ? buildMarineDisplay(liveData) || MARINE_FALLBACK[activeRegion] : MARINE_FALLBACK[activeRegion] || MARINE_FALLBACK["남해"];
    }
    if (liveData?.tide_predictions?.length) {
      _chart = liveData.tide_predictions.map((t) => ({ time: t.time, level: t.level, type: t.type }));
    } else if (_cur?.tideHigh || _cur?.tideLow) {
      _chart = [
        { time: "00:00", level: 250, type: "-" },
        { time: _cur.tideLow || "05:30", level: 80, type: "저" },
        { time: _cur.tideHigh || "11:45", level: 410, type: "고" },
        { time: "18:00", level: 120, type: "저" },
        { time: "23:50", level: 380, type: "고" }
      ];
    } else {
      _chart = [
        { time: "02:00", level: 54, type: "저" },
        { time: "08:30", level: 412, type: "고" },
        { time: "14:40", level: 72, type: "저" },
        { time: "21:10", level: 390, type: "고" }
      ];
    }
    return { current: _cur, currentTitle: _title, tideChartData: _chart };
  }, [selectedPoint, liveData, apiLoading, activeRegion]);
  const localSun = reactExports.useMemo(() => calcSunrise(), []);
  const statusIsWarn = current?.status === "주의" || current?.status === "경고";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { backgroundColor: "#F4F6FA", height: "100vh", overflow: "hidden", display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { width: "100%", maxWidth: "480px", backgroundColor: "#F4F6FA", height: "100%", position: "relative", overflowY: "auto", paddingBottom: "30px", fontFamily: "Pretendard, sans-serif", boxShadow: "0 0 40px rgba(0,0,0,0.05)" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", padding: "calc(env(safe-area-inset-top, 0px) + 16px) 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F0F0F5", position: "sticky", top: 0, zIndex: 100 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }, onClick: () => window.history.length <= 1 ? navigate("/", { replace: true }) : navigate(-1), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 24, color: "#1A1A2E" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "900", color: "#1A1A2E" }, children: "전국 해양 기상" })
      ] }),
      lastUpdated && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#AAB0BE", fontWeight: "700" }, children: [
        lastUpdated.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        " 갱신"
      ] })
    ] }),
    usingFallback && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#FFF8E1", borderBottom: "1px solid #FFE082", padding: "8px 20px", display: "flex", alignItems: "center", gap: "6px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { size: 13, color: "#F59E0B" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#92400E", fontWeight: "700" }, children: "실시간 연결 실패 — 기본 해역 특성 데이터를 표시합니다." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "20px 20px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", zIndex: 60, marginBottom: "20px" }, ref: searchRef, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { height: "48px", backgroundColor: "#fff", borderRadius: "14px", display: "flex", alignItems: "center", padding: "0 16px", gap: "10px", border: "1.5px solid #EBF2FF", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 16, color: "#1565C0", strokeWidth: 3 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: searchQuery,
              onChange: (e) => handleSearch(e.target.value),
              onFocus: () => searchQuery && setShowSearch(true),
              placeholder: "포인트, 어종 검색하여 맞춤 날씨 보기",
              style: { border: "none", background: "none", fontSize: `calc(13.5px * var(--fs, 1))`, fontWeight: "800", outline: "none", width: "100%", color: "#1A1A2E" }
            }
          ),
          searchQuery && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
            setSearchQuery("");
            setSearchResults([]);
            setShowSearch(false);
          }, style: { background: "none", border: "none", cursor: "pointer", color: "#AAB0BE", padding: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16 }) })
        ] }),
        showSearch && searchResults.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", borderRadius: "14px", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", border: "1px solid #F0F2F7", zIndex: 100, maxHeight: "280px", overflowY: "auto", marginTop: "6px" }, children: searchResults.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            onClick: () => handleSelect(p),
            style: { padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px", borderBottom: i < searchResults.length - 1 ? "1px solid #F8F9FC" : "none", cursor: "pointer" },
            onMouseEnter: (e) => e.currentTarget.style.background = "#F8F9FC",
            onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "32px", height: "32px", background: "#EBF2FF", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: `calc(16px * var(--fs, 1))`, flexShrink: 0 }, children: EMOJI_MAP[p.type] || "⚓" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "950", color: "#1A1A2E", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: p.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "800", marginTop: "2px" }, children: [
                  p.region,
                  " · ",
                  p.type,
                  " · ",
                  p.fish.split(",")[0]
                ] })
              ] })
            ]
          },
          p.id
        )) }),
        showSearch && searchResults.length === 0 && searchQuery && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", borderRadius: "14px", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", border: "1px solid #F0F2F7", zIndex: 100, padding: "20px", textAlign: "center", marginTop: "6px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { size: 24, color: "#AAB0BE", style: { margin: "0 auto 8px" } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "800" }, children: "검색 결과가 없어요" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "10px", marginBottom: "24px", overflowX: "auto", scrollbarWidth: "none" }, children: ["동해", "서해", "남해", "제주"].map((region) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => {
            setSelectedPoint(null);
            setLiveData(null);
            setActiveRegion(region);
          },
          style: {
            padding: "10px 24px",
            borderRadius: "30px",
            border: "none",
            cursor: "pointer",
            fontSize: `calc(15px * var(--fs, 1))`,
            fontWeight: "800",
            flexShrink: 0,
            background: !selectedPoint && activeRegion === region ? "#1565C0" : "#fff",
            color: !selectedPoint && activeRegion === region ? "#fff" : "#555",
            boxShadow: !selectedPoint && activeRegion === region ? "0 4px 15px rgba(21,101,192,0.3)" : "0 2px 10px rgba(0,0,0,0.05)",
            transition: "all 0.2s ease"
          },
          children: [
            region,
            " 앞바다"
          ]
        },
        region
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)", borderRadius: "24px", padding: "24px", color: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", position: "relative", overflow: "hidden", marginBottom: "24px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: -40, right: -40, opacity: 0.1 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Map, { size: 180 }) }),
        apiLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(22,33,62,0.75)", borderRadius: "24px", zIndex: 20 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 32, color: "#60a5fa", style: { animation: "spin 1s linear infinite" } }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", position: "relative", zIndex: 10 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "rgba(255,255,255,0.7)", fontWeight: "700", marginBottom: "4px" }, children: [
              "실시간 기상 측정소 ",
              liveData ? "🟢" : "🔴"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(24px * var(--fs, 1))`, fontWeight: "950", letterSpacing: "-0.03em" }, children: currentTitle })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: statusIsWarn ? "rgba(255,59,48,0.2)" : "rgba(0,196,140,0.2)", padding: "6px 12px", borderRadius: "20px", border: statusIsWarn ? "1px solid rgba(255,59,48,0.5)" : "1px solid rgba(0,196,140,0.5)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: statusIsWarn ? "#FF6B6B" : "#00C48C" }, children: current?.status ?? "-" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", position: "relative", zIndex: 10 }, children: [
          { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Waves, { size: 16 }), label: "유의 파고", value: current?.wave },
          { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Wind, { size: 16 }), label: "평균 풍속", value: current?.wind },
          { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Droplets, { size: 16 }), label: "표층 수온", value: current?.temp },
          { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Navigation, { size: 16 }), label: "물때 / 조류", value: current?.tide }
        ].map(({ icon, label, value }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.08)", borderRadius: "16px", padding: "16px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", opacity: 0.8 }, children: [
            icon,
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "700" }, children: label })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "900" }, children: value ?? "-" })
        ] }, label)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { fontSize: `calc(17px * var(--fs, 1))`, fontWeight: "900", color: "#1A1A2E", marginBottom: "14px", paddingLeft: "4px" }, children: "실시간 조석 그래프" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "20px", padding: "24px", boxShadow: "0 4px 15px rgba(0,0,0,0.03)", marginBottom: "24px", border: "1px solid #E5E8EB" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sunrise, { size: 20, color: "#FF9B26" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "800", color: "#555" }, children: [
              "일출 ",
              current?.sunrise || liveData?.sunrise || localSun.sunrise
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sunset, { size: 20, color: "#FF5A5F" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "800", color: "#555" }, children: [
              "일몰 ",
              current?.sunset || liveData?.sunset || localSun.sunset
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { height: "160px", width: "100%", marginBottom: "16px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TideChart, { data: tideChartData }),
          " "
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => {
              if (canAccessSatellite) {
                window.open("https://www.weather.go.kr/weather/radar/local.jsp", "_blank");
              } else {
                addToast("상세 해류도 및 기상 위성 영상은 PRO 이상 플랜에서 제공됩니다.", "info");
              }
            },
            style: {
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              fontSize: `calc(14px * var(--fs, 1))`,
              fontWeight: "800",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              border: "none",
              background: canAccessSatellite ? "linear-gradient(135deg, #0056D2, #00C48C)" : "#F4F6FA",
              color: canAccessSatellite ? "#fff" : "#1565C0",
              boxShadow: canAccessSatellite ? "0 4px 15px rgba(0,86,210,0.3)" : "none"
            },
            children: [
              canAccessSatellite ? "🛰️ 위성 레이더 보기" : "상세 위성 레이더망 보기",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 16 })
            ]
          }
        )
      ] })
    ] })
  ] }) });
}

export { WeatherDashboard as default };
