import { b as useToastStore, u as useUserStore, A as ADMIN_ID, a as ADMIN_EMAIL, c as apiClient, j as jsxRuntimeExports } from './index-rdBGUi8d.js';
import { u as useNavigate, r as reactExports } from './vendor-react-BzbiWsGG.js';
import { C as CheckCircle, z as ArrowLeft, aj as Wifi, ak as WifiOff, av as MousePointer, m as Search, X, aB as Filter, n as MapPin, w as RotateCcw, Z as Zap } from './vendor-icons-C5BxRig-.js';
import { A as ALL_FISHING_POINTS } from './fishingData-DUAFbpZH.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

const LS_KEY = "pointLocationOverrides";
const getLocal = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
};
const setLocal = (v) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(v));
  } catch {
  }
};
const TYPE_META = {
  "방파제": { emoji: "🚧", color: "#64B5F6", bg: "rgba(100,181,246,0.15)", border: "rgba(100,181,246,0.35)" },
  "갯바위": { emoji: "🪨", color: "#FFD700", bg: "rgba(255,215,0,0.12)", border: "rgba(255,215,0,0.35)" },
  "항구": { emoji: "⚓", color: "#00C48C", bg: "rgba(0,196,140,0.12)", border: "rgba(0,196,140,0.35)" },
  "민물": { emoji: "🌊", color: "#A78BFA", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.35)" }
};
const DEFAULT_META = { emoji: "📍", color: "#8E8E93", bg: "rgba(142,142,147,0.12)", border: "rgba(142,142,147,0.3)" };
const getMeta = (type) => TYPE_META[type] || DEFAULT_META;
const ALL_POINTS = ALL_FISHING_POINTS.filter((p) => !p.secret);
const ALL_TYPES = ["전체", ...new Set(ALL_POINTS.map((p) => p.type))];
const ALL_REGIONS = ["전체", ...new Set(ALL_POINTS.map((p) => p.region))];
function PointLocationAdmin() {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const isAdmin = useUserStore(
    (s) => s.user?.id === ADMIN_ID || s.user?.email === ADMIN_EMAIL || s.user?.email === "sunjulab.k@gmail.com" || s.userTier === "MASTER"
  );
  const [authChecked, setAuthChecked] = reactExports.useState(false);
  const [debugMsg, setDebugMsg] = reactExports.useState(null);
  reactExports.useEffect(() => {
    const t = setTimeout(() => {
      setAuthChecked(true);
      const { user, userTier } = useUserStore.getState();
      const ok = user?.id === ADMIN_ID || user?.email === ADMIN_EMAIL || user?.email === "sunjulab.k@gmail.com" || userTier === "MASTER";
      if (!ok) {
        setDebugMsg(JSON.stringify({ id: user?.id, email: user?.email, tier: userTier }, null, 2));
        addToast("❗ 마스터 권한 필요", "error");
        setTimeout(() => navigate("/", { replace: true }), 4e3);
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);
  const [filterType, setFilterType] = reactExports.useState("전체");
  const [filterRegion, setFilterRegion] = reactExports.useState("전체");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [showFilter, setShowFilter] = reactExports.useState(false);
  const [selectedPoint, setSelectedPoint] = reactExports.useState(null);
  const [previewCoords, setPreviewCoords] = reactExports.useState(null);
  const [inputMode, setInputMode] = reactExports.useState("click");
  const [addrInput, setAddrInput] = reactExports.useState("");
  const [addrResults, setAddrResults] = reactExports.useState([]);
  const [addrSearching, setAddrSearching] = reactExports.useState(false);
  const [overrides, setOverrides] = reactExports.useState({});
  const [serverOnline, setServerOnline] = reactExports.useState(true);
  const [saving, setSaving] = reactExports.useState(false);
  const [saved, setSaved] = reactExports.useState(false);
  const [saveError, setSaveError] = reactExports.useState(null);
  const savedTimerRef = reactExports.useRef(null);
  const markerRef = reactExports.useRef(null);
  const mapInstanceRef = reactExports.useRef(null);
  const clickListenerRef = reactExports.useRef(null);
  const initDoneRef = reactExports.useRef(false);
  const [mapReady, setMapReady] = reactExports.useState(false);
  const fetchOverrides = reactExports.useCallback(async () => {
    try {
      const res = await apiClient.get("/api/spot-location-overrides");
      setOverrides(res.data || {});
      setServerOnline(true);
      setSaveError(null);
    } catch (err) {
      const st = err?.response?.status;
      if (st === 401) {
        setSaveError("토큰 만료. 다시 로그인해주세요.");
        return;
      }
      if (st === 403) {
        setSaveError("관리자 권한이 필요합니다.");
        return;
      }
      setServerOnline(false);
      setOverrides(getLocal());
    }
  }, []);
  reactExports.useEffect(() => {
    if (authChecked && isAdmin)
      fetchOverrides();
  }, [authChecked, isAdmin, fetchOverrides]);
  const mapCallbackRef = reactExports.useCallback((node) => {
    if (!node || initDoneRef.current)
      return;
    initDoneRef.current = true;
    const doInit = () => {
      const map = new window.kakao.maps.Map(node, {
        center: new window.kakao.maps.LatLng(36.5, 127.8),
        level: 8
      });
      mapInstanceRef.current = map;
      setMapReady(true);
    };
    if (window.kakao?.maps?.Map)
      doInit();
    else if (window.kakao?.maps)
      window.kakao.maps.load(doInit);
    else {
      const retry = setInterval(() => {
        if (window.kakao?.maps?.Map) {
          clearInterval(retry);
          doInit();
        } else if (window.kakao?.maps) {
          clearInterval(retry);
          window.kakao.maps.load(doInit);
        }
      }, 200);
    }
  }, []);
  const placeMarker = reactExports.useCallback((lat, lng, label, source) => {
    if (!mapInstanceRef.current)
      return;
    const latlng = new window.kakao.maps.LatLng(lat, lng);
    mapInstanceRef.current.setCenter(latlng);
    if (markerRef.current)
      markerRef.current.setMap(null);
    const marker = new window.kakao.maps.Marker({ position: latlng, map: mapInstanceRef.current });
    const iw = new window.kakao.maps.InfoWindow({
      content: `<div style="padding:5px 9px;font-size:11px;font-weight:700">${label}<br/><span style="font-size:10px;color:#555;font-family:monospace">${lat.toFixed(5)}, ${lng.toFixed(5)}</span></div>`
    });
    iw.open(mapInstanceRef.current, marker);
    markerRef.current = marker;
    setPreviewCoords({ lat, lng, source });
  }, []);
  reactExports.useEffect(() => {
    if (!mapReady || !mapInstanceRef.current)
      return;
    if (clickListenerRef.current) {
      window.kakao.maps.event.removeListener(mapInstanceRef.current, "click", clickListenerRef.current);
      clickListenerRef.current = null;
    }
    if (inputMode === "click") {
      const handler = (e) => placeMarker(e.latLng.getLat(), e.latLng.getLng(), "📍 선택 위치", "click");
      window.kakao.maps.event.addListener(mapInstanceRef.current, "click", handler);
      clickListenerRef.current = handler;
    }
    return () => {
      if (clickListenerRef.current && mapInstanceRef.current)
        window.kakao.maps.event.removeListener(mapInstanceRef.current, "click", clickListenerRef.current);
    };
  }, [inputMode, mapReady, placeMarker]);
  reactExports.useEffect(() => {
    if (!selectedPoint || !mapReady || !mapInstanceRef.current)
      return;
    const ov = overrides[String(selectedPoint.id)];
    const lat = ov?.lat ?? selectedPoint.lat;
    const lng = ov?.lng ?? selectedPoint.lng;
    mapInstanceRef.current.setCenter(new window.kakao.maps.LatLng(lat, lng));
    mapInstanceRef.current.setLevel(5);
    if (markerRef.current)
      markerRef.current.setMap(null);
    markerRef.current = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(lat, lng),
      map: mapInstanceRef.current
    });
    setPreviewCoords(null);
  }, [selectedPoint, mapReady]);
  const handleAddrSearch = () => {
    if (!addrInput.trim())
      return;
    setAddrSearching(true);
    setAddrResults([]);
    window.kakao.maps.load(() => {
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.addressSearch(addrInput, (result, st) => {
        if (st === window.kakao.maps.services.Status.OK && result.length > 0) {
          setAddrResults(result.map((r) => ({ address: r.address_name, lat: parseFloat(r.y), lng: parseFloat(r.x) })));
          setAddrSearching(false);
        } else {
          new window.kakao.maps.services.Places().keywordSearch(addrInput, (pRes, pSt) => {
            setAddrSearching(false);
            if (pSt === window.kakao.maps.services.Status.OK)
              setAddrResults(pRes.slice(0, 6).map((r) => ({ address: `${r.place_name} (${r.address_name})`, lat: parseFloat(r.y), lng: parseFloat(r.x) })));
          });
        }
      });
    });
  };
  const handleSave = async () => {
    if (!selectedPoint || !previewCoords)
      return;
    setSaving(true);
    setSaveError(null);
    try {
      await apiClient.post("/api/spot-location-overrides", {
        id: selectedPoint.id,
        lat: previewCoords.lat,
        lng: previewCoords.lng,
        type: selectedPoint.type,
        name: selectedPoint.name
      });
      setServerOnline(true);
    } catch (err) {
      const st = err?.response?.status;
      if (st === 401) {
        setSaveError("⚠️ 토큰 만료. 로그아웃 후 재로그인 필요.");
        setSaving(false);
        return;
      }
      if (st === 403) {
        setSaveError("⚠️ 관리자 권한 필요.");
        setSaving(false);
        return;
      }
      setServerOnline(false);
      const local = getLocal();
      local[selectedPoint.id] = { lat: previewCoords.lat, lng: previewCoords.lng, type: selectedPoint.type, name: selectedPoint.name };
      setLocal(local);
    } finally {
      setSaving(false);
    }
    await fetchOverrides();
    if (savedTimerRef.current)
      clearTimeout(savedTimerRef.current);
    setSaved(true);
    savedTimerRef.current = setTimeout(() => {
      setSaved(false);
      savedTimerRef.current = null;
    }, 2200);
  };
  const handleReset = async (id) => {
    try {
      await apiClient.delete(`/api/spot-location-overrides/${id}`);
      setSaveError(null);
    } catch (err) {
      const st = err?.response?.status;
      if (st === 401 || st === 403) {
        setSaveError("⚠️ 권한 오류로 초기화 실패.");
        return;
      }
      const local = getLocal();
      delete local[id];
      setLocal(local);
    }
    await fetchOverrides();
  };
  const filteredPoints = ALL_POINTS.filter((p) => {
    if (filterType !== "전체" && p.type !== filterType)
      return false;
    if (filterRegion !== "전체" && p.region !== filterRegion)
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.region.toLowerCase().includes(q))
        return false;
    }
    return true;
  });
  const overrideCount = Object.keys(overrides).length;
  if (!authChecked || debugMsg)
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { minHeight: "100vh", background: "#0A0F1C", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }, children: debugMsg ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "22px", marginBottom: "12px" }, children: "🔐 권한 확인 실패" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "20px" }, children: "4초 후 홈으로 이동" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(220,38,38,0.97)", backdropFilter: "blur(12px)", padding: "20px", borderRadius: "20px 20px 0 0" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { style: { fontSize: "11px", color: "rgba(255,255,255,0.85)", background: "rgba(0,0,0,0.3)", borderRadius: "10px", padding: "12px", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }, children: debugMsg }) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "rgba(255,255,255,0.3)", fontSize: "14px" }, children: "인증 확인 중..." }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { minHeight: "100vh", background: "#0A0F1C", color: "#fff", fontFamily: "Pretendard, sans-serif" }, children: [
    saveError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 1e4, background: "rgba(220,38,38,0.95)", backdropFilter: "blur(8px)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#fff", fontSize: "14px", fontWeight: "800" }, children: saveError }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setSaveError(null), style: { background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", color: "#fff", padding: "4px 10px", cursor: "pointer", fontSize: "13px", fontWeight: "700" }, children: "닫기" })
    ] }),
    saved && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "72px", height: "72px", background: "linear-gradient(135deg,#00C48C,#007B5E)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 36, color: "#fff" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "22px", fontWeight: "900" }, children: "저장 완료!" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "14px", color: "rgba(255,255,255,0.6)" }, children: selectedPoint?.name }),
      previewCoords && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "13px", color: "#00C48C", fontFamily: "monospace" }, children: [
        previewCoords.lat.toFixed(5),
        ", ",
        previewCoords.lng.toFixed(5)
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", color: "rgba(255,255,255,0.3)", marginTop: "6px" }, children: "모든 사용자에게 실시간 반영됩니다 ✅" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.2)" }, children: "2초 후 자동 닫힙니다..." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg,#0A0F1C,#1A2340)", padding: "52px 20px 14px", borderBottom: "1px solid rgba(255,215,0,0.15)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => navigate("/mypage"), style: { background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "12px", padding: "10px", cursor: "pointer", color: "#fff", display: "flex" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { size: 20 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "10px", color: "rgba(255,215,0,0.7)", fontWeight: "900", letterSpacing: "0.15em" }, children: "⚙️ MASTER ADMIN" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "18px", fontWeight: "900" }, children: "낚시 포인트 위치 수정" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
          serverOnline ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "4px", background: "rgba(0,196,140,0.15)", border: "1px solid rgba(0,196,140,0.3)", borderRadius: "20px", padding: "4px 10px", fontSize: "11px", color: "#00C48C", fontWeight: "800" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Wifi, { size: 12 }),
            "서버연결"
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,107,107,0.15)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "20px", padding: "4px 10px", fontSize: "11px", color: "#FF6B6B", fontWeight: "800" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(WifiOff, { size: 12 }),
            "로컬저장"
          ] }),
          overrideCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "20px", padding: "4px 10px", fontSize: "11px", color: "#FFD700", fontWeight: "800" }, children: [
            overrideCount,
            "개 수정됨"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }, children: Object.entries(TYPE_META).map(([type, meta]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "4px", background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", color: meta.color, fontWeight: "800" }, children: [
        meta.emoji,
        " ",
        type
      ] }, type)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: mapCallbackRef, style: { width: "100%", height: selectedPoint ? "260px" : "160px", background: "#1a2340", transition: "height 0.3s" } }),
      selectedPoint && inputMode === "click" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)", background: "rgba(0,196,140,0.92)", color: "#fff", fontSize: "12px", fontWeight: "800", padding: "5px 16px", borderRadius: "20px", pointerEvents: "none", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "5px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MousePointer, { size: 13 }),
        " 탭하여 새 위치 선택"
      ] }),
      previewCoords && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", color: previewCoords.source === "click" ? "#00C48C" : "#FFD700", fontSize: "12px", fontWeight: "800", padding: "6px 14px", borderRadius: "20px", pointerEvents: "none", whiteSpace: "nowrap", fontFamily: "monospace" }, children: [
        previewCoords.lat.toFixed(5),
        ", ",
        previewCoords.lng.toFixed(5)
      ] })
    ] }),
    selectedPoint && previewCoords && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "10px 20px", background: "#0A0F1C", borderBottom: "1px solid rgba(255,255,255,0.06)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: handleSave,
        disabled: saving,
        style: { width: "100%", padding: "14px", border: "none", borderRadius: "14px", fontWeight: "900", fontSize: "15px", cursor: saving ? "not-allowed" : "pointer", background: saving ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#00C48C,#007B5E)", color: saving ? "rgba(255,255,255,0.4)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 6px 20px rgba(0,0,0,0.4)" },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 18 }),
          saving ? "저장 중..." : serverOnline ? "🌐 서버에 저장 (전체 반영)" : "💾 로컬 저장"
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px 20px", paddingBottom: "60px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "14px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px", marginBottom: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, position: "relative" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14, style: { position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", pointerEvents: "none" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                placeholder: "포인트명 또는 지역 검색...",
                style: { width: "100%", boxSizing: "border-box", padding: "10px 12px 10px 34px", background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: "12px", color: "#fff", fontSize: "13px", outline: "none" }
              }
            ),
            searchQuery && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setSearchQuery(""), style: { position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 14 }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setShowFilter((f) => !f), style: { padding: "10px 14px", background: showFilter ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.07)", border: `1px solid ${showFilter ? "rgba(255,215,0,0.4)" : "rgba(255,255,255,0.12)"}`, borderRadius: "12px", color: showFilter ? "#FFD700" : "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: "800" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Filter, { size: 14 }),
            " 필터"
          ] })
        ] }),
        showFilter && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "14px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: "900", marginBottom: "6px" }, children: "포인트 타입" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" }, children: ALL_TYPES.map((t) => {
              const meta = TYPE_META[t];
              const active = filterType === t;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setFilterType(t), style: { padding: "5px 12px", borderRadius: "10px", border: active ? `1px solid ${meta?.border || "rgba(255,215,0,0.4)"}` : "1px solid transparent", fontSize: "12px", fontWeight: "900", cursor: "pointer", background: active ? meta?.bg || "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.07)", color: active ? meta?.color || "#FFD700" : "rgba(255,255,255,0.5)" }, children: [
                meta?.emoji || "",
                " ",
                t
              ] }, t);
            }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: "900", marginBottom: "6px" }, children: "지역" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" }, children: ALL_REGIONS.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setFilterRegion(r), style: { padding: "5px 12px", borderRadius: "10px", border: "none", fontSize: "12px", fontWeight: "900", cursor: "pointer", background: filterRegion === r ? "rgba(100,181,246,0.2)" : "rgba(255,255,255,0.07)", color: filterRegion === r ? "#64B5F6" : "rgba(255,255,255,0.5)" }, children: r }, r)) })
          ] })
        ] })
      ] }),
      selectedPoint && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "16px", padding: "14px" }, children: [
        (() => {
          const meta = getMeta(selectedPoint.type);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "36px", height: "36px", background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }, children: meta.emoji }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "14px", fontWeight: "900", color: meta.color }, children: selectedPoint.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: "700" }, children: [
                selectedPoint.region,
                " · ",
                selectedPoint.type
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
              setSelectedPoint(null);
              setPreviewCoords(null);
            }, style: { background: "rgba(255,255,255,0.07)", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: "800" }, children: "해제" })
          ] });
        })(),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px", marginBottom: "12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setInputMode("click"), style: { flex: 1, padding: "10px", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "800", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", background: inputMode === "click" ? "linear-gradient(135deg,#00C48C,#007B5E)" : "rgba(255,255,255,0.07)", color: inputMode === "click" ? "#fff" : "rgba(255,255,255,0.5)" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MousePointer, { size: 14 }),
            " 지도 클릭"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setInputMode("search"), style: { flex: 1, padding: "10px", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "800", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", background: inputMode === "search" ? "linear-gradient(135deg,#FFD700,#FFA000)" : "rgba(255,255,255,0.07)", color: inputMode === "search" ? "#000" : "rgba(255,255,255,0.5)" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14 }),
            " 주소 검색"
          ] })
        ] }),
        inputMode === "search" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px", marginBottom: "8px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: addrInput,
                onChange: (e) => setAddrInput(e.target.value),
                onKeyDown: (e) => e.key === "Enter" && handleAddrSearch(),
                placeholder: "장소명 또는 주소",
                style: { flex: 1, padding: "10px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#fff", fontSize: "13px", outline: "none" }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleAddrSearch, disabled: addrSearching, style: { padding: "0 14px", background: "linear-gradient(135deg,#FFD700,#FFA000)", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "900", color: "#000", fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }, children: addrSearching ? "..." : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 13 }),
              "검색"
            ] }) })
          ] }),
          addrResults.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "rgba(255,255,255,0.05)", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }, children: addrResults.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => {
                placeMarker(r.lat, r.lng, r.address, "search");
                setAddrResults([]);
                setAddrInput(r.address);
                setInputMode("click");
              },
              style: { width: "100%", padding: "10px 12px", background: "transparent", border: "none", borderBottom: i < addrResults.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none", color: "#fff", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: "8px" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 12, color: "#FFD700", style: { marginTop: "2px", flexShrink: 0 } }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "700" }, children: r.address }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "10px", color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }, children: [
                    r.lat.toFixed(5),
                    ", ",
                    r.lng.toFixed(5)
                  ] })
                ] })
              ]
            },
            r.address
          )) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "16px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.35)", fontWeight: "800", marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "📍 포인트 선택 (",
            filteredPoints.length,
            "개)"
          ] }),
          (filterType !== "전체" || filterRegion !== "전체" || searchQuery) && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
            setFilterType("전체");
            setFilterRegion("전체");
            setSearchQuery("");
          }, style: { background: "none", border: "none", color: "#FF6B6B", cursor: "pointer", fontSize: "11px", fontWeight: "800" }, children: "필터 초기화" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "5px", maxHeight: "360px", overflowY: "auto" }, children: [
          filteredPoints.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "30px", color: "rgba(255,255,255,0.3)", fontSize: "13px", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "12px" }, children: "검색 결과가 없습니다." }),
          filteredPoints.map((p) => {
            const ov = overrides[String(p.id)];
            const isSelected = selectedPoint?.id === p.id;
            const meta = getMeta(p.type);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => {
                  setSelectedPoint(p);
                  setAddrInput("");
                  setAddrResults([]);
                  setPreviewCoords(null);
                  setInputMode("click");
                },
                style: { background: isSelected ? meta.bg : "rgba(255,255,255,0.03)", border: `${isSelected ? "1.5px" : "1px"} solid ${isSelected ? meta.border : "rgba(255,255,255,0.07)"}`, borderRadius: "12px", padding: "9px 12px", cursor: "pointer", color: "#fff", textAlign: "left", display: "flex", alignItems: "center", gap: "9px" },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "16px", flexShrink: 0 }, children: meta.emoji }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", fontWeight: "700", color: isSelected ? meta.color : "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: p.name }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "10px", color: ov ? meta.color : "rgba(255,255,255,0.3)", fontFamily: "monospace", marginTop: "1px" }, children: [
                      ov ? `🔧 ${ov.lat.toFixed(4)}, ${ov.lng.toFixed(4)}` : `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`,
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { marginLeft: "6px", color: "rgba(255,255,255,0.25)", fontFamily: "inherit", fontWeight: "700" }, children: p.region })
                    ] })
                  ] }),
                  ov && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      onClick: (e) => {
                        e.stopPropagation();
                        handleReset(p.id);
                      },
                      style: { fontSize: "10px", color: "#FF6B6B", background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "6px", padding: "3px 7px", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: "2px" },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { size: 9 }),
                        "초기화"
                      ]
                    }
                  )
                ]
              },
              p.id
            );
          })
        ] })
      ] }),
      overrideCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "8px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.3)", fontWeight: "700", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 12, color: "#FFD700" }),
          " 수정된 포인트 (",
          overrideCount,
          "개) ",
          serverOnline && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#00C48C", fontSize: "10px" }, children: "● 서버 반영됨" })
        ] }),
        Object.entries(overrides).map(([id, coords]) => {
          const p = ALL_POINTS.find((x) => String(x.id) === String(id));
          if (!p)
            return null;
          const meta = getMeta(p.type);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,215,0,0.12)", borderRadius: "10px", padding: "9px 13px", marginBottom: "5px", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "14px" }, children: meta.emoji }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "700", color: meta.color }, children: p.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "10px", color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }, children: [
                  coords.lat.toFixed(5),
                  ", ",
                  coords.lng.toFixed(5)
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "5px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => {
                    setSelectedPoint(p);
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.setCenter(new window.kakao.maps.LatLng(coords.lat, coords.lng));
                      mapInstanceRef.current.setLevel(5);
                    }
                  },
                  style: { fontSize: "11px", color: "#4FC3F7", background: "rgba(79,195,247,0.08)", border: "1px solid rgba(79,195,247,0.2)", borderRadius: "7px", padding: "4px 8px", cursor: "pointer" },
                  children: "보기"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => handleReset(parseInt(id)),
                  style: { fontSize: "11px", color: "#FF6B6B", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "7px", padding: "4px 8px", cursor: "pointer" },
                  children: "초기화"
                }
              )
            ] })
          ] }, id);
        })
      ] })
    ] })
  ] });
}

export { PointLocationAdmin as default };
