import { u as useUserStore, A as ADMIN_ID, a as ADMIN_EMAIL, b as useToastStore, c as apiClient, j as jsxRuntimeExports } from './index-C2ieaxTI.js';
import { u as useNavigate, r as reactExports } from './vendor-react-BzbiWsGG.js';
import { C as CheckCircle, z as ArrowLeft, aj as Wifi, ak as WifiOff, av as MousePointer, a2 as Star, w as RotateCcw, m as Search, n as MapPin, Z as Zap } from './vendor-icons-C5BxRig-.js';
import { S as SECRET_FISHING_POINTS } from './fishingData-DUAFbpZH.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

const getLocalOverrides = () => {
  try {
    return JSON.parse(localStorage.getItem("secretPointOverrides") || "{}");
  } catch {
    return {};
  }
};
const setLocalOverrides = (ov) => {
  try {
    localStorage.setItem("secretPointOverrides", JSON.stringify(ov));
  } catch {
  }
};
function SecretPointAdmin() {
  const navigate = useNavigate();
  const isAdmin = useUserStore(
    (s) => s.user?.id === ADMIN_ID || s.user?.email === ADMIN_EMAIL || s.user?.email === "sunjulab.k@gmail.com" || s.userTier === "MASTER"
  );
  const addToast = useToastStore((s) => s.addToast);
  const [authChecked, setAuthChecked] = reactExports.useState(false);
  const [debugMsg, setDebugMsg] = reactExports.useState(null);
  reactExports.useEffect(() => {
    const timer = setTimeout(() => {
      setAuthChecked(true);
      const { user: currentUser, userTier } = useUserStore.getState();
      const isAdm = currentUser?.id === ADMIN_ID || currentUser?.email === ADMIN_EMAIL || currentUser?.email === "sunjulab.k@gmail.com" || userTier === "MASTER";
      if (!isAdm) {
        const info = JSON.stringify({
          id: currentUser?.id,
          email: currentUser?.email,
          tier: userTier,
          ADMIN_ID,
          ADMIN_EMAIL
        }, null, 2);
        setDebugMsg(info);
        addToast(`❗ 권한없음: ${currentUser?.id || "미로그인"} / ${currentUser?.email || "-"}`, "error");
        setTimeout(() => navigate("/", { replace: true }), 4e3);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const markerRef = reactExports.useRef(null);
  const mapInstanceRef = reactExports.useRef(null);
  const clickListenerRef = reactExports.useRef(null);
  const initDoneRef = reactExports.useRef(false);
  const [selectedPoint, setSelectedPoint] = reactExports.useState(null);
  const [addressInput, setAddressInput] = reactExports.useState("");
  const [searchResults, setSearchResults] = reactExports.useState([]);
  const [searching, setSearching] = reactExports.useState(false);
  const [previewCoords, setPreviewCoords] = reactExports.useState(null);
  const [overrides, setOverrides] = reactExports.useState({});
  const [mapReady, setMapReady] = reactExports.useState(false);
  const [inputMode, setInputMode] = reactExports.useState("click");
  const [saved, setSaved] = reactExports.useState(false);
  const [saving, setSaving] = reactExports.useState(false);
  const [serverOnline, setServerOnline] = reactExports.useState(true);
  const [saveError, setSaveError] = reactExports.useState(null);
  const savedTimerRef = reactExports.useRef(null);
  const fetchOverrides = reactExports.useCallback(async () => {
    try {
      const res = await apiClient.get("/api/secret-point-overrides");
      setOverrides(res.data || {});
      setServerOnline(true);
      setSaveError(null);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setSaveError("토큰이 만료되었습니다. 다시 로그인해주세요.");
      } else if (status === 403) {
        setSaveError("관리자 권한이 필요합니다.");
      } else {
        setServerOnline(false);
        setOverrides(getLocalOverrides());
      }
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
        center: new window.kakao.maps.LatLng(36, 127.8),
        level: 7
      });
      mapInstanceRef.current = map;
      setMapReady(true);
    };
    if (window.kakao?.maps?.Map) {
      doInit();
    } else if (window.kakao?.maps) {
      window.kakao.maps.load(doInit);
    } else {
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
      content: `<div style="padding:5px 9px;font-size:calc(11px * var(--fs, 1));font-weight:700">${label}<br/><span style="font-size:calc(10px * var(--fs, 1));color:#555;font-family:monospace">${lat.toFixed(5)}, ${lng.toFixed(5)}</span></div>`
    });
    iw.open(mapInstanceRef.current, marker);
    markerRef.current = marker;
    setPreviewCoords({ lat, lng, source });
  }, []);
  reactExports.useEffect(() => {
    if (!mapInstanceRef.current || !mapReady)
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
    if (!selectedPoint || !mapInstanceRef.current || !mapReady)
      return;
    const ov = overrides[String(selectedPoint.id)];
    const lat = ov?.lat ?? selectedPoint.lat;
    const lng = ov?.lng ?? selectedPoint.lng;
    const latlng = new window.kakao.maps.LatLng(lat, lng);
    mapInstanceRef.current.setCenter(latlng);
    mapInstanceRef.current.setLevel(6);
    if (markerRef.current)
      markerRef.current.setMap(null);
    markerRef.current = new window.kakao.maps.Marker({ position: latlng, map: mapInstanceRef.current });
    setPreviewCoords(null);
  }, [selectedPoint, mapReady]);
  const handleSearch = () => {
    if (!addressInput.trim())
      return;
    setSearching(true);
    setSearchResults([]);
    window.kakao.maps.load(() => {
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.addressSearch(addressInput, (result, st) => {
        if (st === window.kakao.maps.services.Status.OK && result.length > 0) {
          setSearchResults(result.map((r) => ({ address: r.address_name, lat: parseFloat(r.y), lng: parseFloat(r.x) })));
          setSearching(false);
        } else {
          new window.kakao.maps.services.Places().keywordSearch(addressInput, (pResult, pSt) => {
            setSearching(false);
            if (pSt === window.kakao.maps.services.Status.OK)
              setSearchResults(pResult.slice(0, 6).map((r) => ({ address: `${r.place_name} (${r.address_name})`, lat: parseFloat(r.y), lng: parseFloat(r.x) })));
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
      await apiClient.post("/api/secret-point-overrides", {
        id: selectedPoint.id,
        lat: previewCoords.lat,
        lng: previewCoords.lng
      });
      setServerOnline(true);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setSaveError("⚠️ 토큰 만료. 로그아웃 후 다시 로그인해주세요.");
        setSaving(false);
        return;
      } else if (status === 403) {
        setSaveError("⚠️ 관리자 권한이 필요합니다.");
        setSaving(false);
        return;
      }
      setServerOnline(false);
      const ov = getLocalOverrides();
      ov[selectedPoint.id] = { lat: previewCoords.lat, lng: previewCoords.lng };
      setLocalOverrides(ov);
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
      await apiClient.delete(`/api/secret-point-overrides/${id}`);
      setSaveError(null);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setSaveError("⚠️ 권한 오류로 초기화에 실패했습니다.");
        return;
      }
      const ov = getLocalOverrides();
      delete ov[id];
      setLocalOverrides(ov);
    }
    await fetchOverrides();
  };
  const overrideCount = Object.keys(overrides).length;
  if (!authChecked || debugMsg)
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { minHeight: "100vh", background: "#0A0F1C", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }, children: debugMsg ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(22px * var(--fs, 1))`, marginBottom: "12px" }, children: "🔐 권한 확인 실패" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "rgba(255,255,255,0.5)", marginBottom: "20px" }, children: "4초 후 홈으로 이동합니다" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(220,38,38,0.97)",
        backdropFilter: "blur(12px)",
        padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 20px)",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -8px 32px rgba(220,38,38,0.4)"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: "#fff", marginBottom: "10px" }, children: "❗ 오류 보기 — 인증 실패 상세" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { style: {
          fontSize: `calc(11px * var(--fs, 1))`,
          color: "rgba(255,255,255,0.85)",
          background: "rgba(0,0,0,0.3)",
          borderRadius: "10px",
          padding: "12px",
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          fontFamily: "monospace",
          lineHeight: "1.6"
        }, children: debugMsg }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.5)", marginTop: "10px" }, children: "위 값이 ADMIN_ID / ADMIN_EMAIL과 다르면 로그인 계정을 확인하세요" })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "rgba(255,255,255,0.3)", fontSize: `calc(14px * var(--fs, 1))` }, children: "인증 확인 중..." }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { minHeight: "100vh", background: "#0A0F1C", color: "#fff", fontFamily: "Pretendard, sans-serif" }, children: [
    saveError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 1e4, background: "rgba(220,38,38,0.95)", backdropFilter: "blur(8px)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#fff", fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "800" }, children: saveError }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setSaveError(null), style: { background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", color: "#fff", padding: "4px 10px", cursor: "pointer", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700" }, children: "닫기" })
    ] }),
    saved && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "72px", height: "72px", background: "linear-gradient(135deg, #00C48C, #007B5E)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 36, color: "#fff" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(22px * var(--fs, 1))`, fontWeight: "900" }, children: "저장 완료!" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(14px * var(--fs, 1))`, color: "rgba(255,255,255,0.6)" }, children: selectedPoint?.name?.replace("⭐ ", "") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#00C48C", fontFamily: "monospace" }, children: [
        previewCoords?.lat.toFixed(5),
        ", ",
        previewCoords?.lng.toFixed(5)
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "rgba(255,255,255,0.3)", marginTop: "6px" }, children: "모든 사용자에게 실시간 반영됩니다 ✅" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.2)" }, children: "2초 후 자동 닫힙니다..." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "linear-gradient(135deg, #0A0F1C, #1A2340)", padding: "52px 20px 16px", borderBottom: "1px solid rgba(255,215,0,0.15)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => navigate("/mypage"), style: { background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "12px", padding: "10px", cursor: "pointer", color: "#fff", display: "flex" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { size: 20 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,215,0,0.7)", fontWeight: "900", letterSpacing: "0.15em" }, children: "⚙️ MASTER ADMIN" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "900" }, children: "비밀포인트 위치 수정" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
        serverOnline ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "4px", background: "rgba(0,196,140,0.15)", border: "1px solid rgba(0,196,140,0.3)", borderRadius: "20px", padding: "4px 10px", fontSize: `calc(11px * var(--fs, 1))`, color: "#00C48C", fontWeight: "800" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Wifi, { size: 12 }),
          "서버연결"
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,107,107,0.15)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "20px", padding: "4px 10px", fontSize: `calc(11px * var(--fs, 1))`, color: "#FF6B6B", fontWeight: "800" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(WifiOff, { size: 12 }),
          "로컬저장"
        ] }),
        overrideCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "20px", padding: "4px 10px", fontSize: `calc(11px * var(--fs, 1))`, color: "#FFD700", fontWeight: "800" }, children: [
          overrideCount,
          "개"
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: mapCallbackRef, style: { width: "100%", height: selectedPoint ? "260px" : "180px", background: "#1a2340", transition: "height 0.3s" } }),
      selectedPoint && inputMode === "click" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)", background: "rgba(0,196,140,0.92)", color: "#fff", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", padding: "5px 16px", borderRadius: "20px", pointerEvents: "none", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "5px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MousePointer, { size: 13 }),
        " 탭하여 위치 선택"
      ] }),
      !selectedPoint && mapReady && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,15,28,0.5)", pointerEvents: "none" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)", fontWeight: "700" }, children: "아래에서 포인트를 선택하세요" }) }),
      previewCoords && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", color: previewCoords.source === "click" ? "#00C48C" : "#FFD700", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", padding: "6px 14px", borderRadius: "20px", pointerEvents: "none", whiteSpace: "nowrap", fontFamily: "monospace" }, children: [
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
        style: { width: "100%", padding: "14px", border: "none", borderRadius: "14px", fontWeight: "900", fontSize: `calc(15px * var(--fs, 1))`, cursor: saving ? "not-allowed" : "pointer", background: saving ? "rgba(255,255,255,0.1)" : previewCoords.source === "click" ? "linear-gradient(135deg, #00C48C, #007B5E)" : "linear-gradient(135deg, #FFD700, #FFA000)", color: saving ? "rgba(255,255,255,0.4)" : previewCoords.source === "click" ? "#fff" : "#000", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 6px 20px rgba(0,0,0,0.4)" },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 18 }),
          saving ? "저장 중..." : serverOnline ? "🌐 서버에 저장 (전체 반영)" : "💾 로컬 저장"
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px 20px", paddingBottom: "40px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "16px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,215,0,0.8)", fontWeight: "900", letterSpacing: "0.12em", marginBottom: "10px" }, children: [
          "📍 포인트 선택 ",
          selectedPoint && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#FFD700", fontSize: `calc(12px * var(--fs, 1))` }, children: [
            "— ",
            selectedPoint.name.replace("⭐ ", "")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexDirection: "column", gap: "5px", maxHeight: "200px", overflowY: "auto" }, children: SECRET_FISHING_POINTS.map((p) => {
          const ov = overrides[String(p.id)];
          const isSelected = selectedPoint?.id === p.id;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => {
                setSelectedPoint(p);
                setAddressInput("");
                setSearchResults([]);
                setPreviewCoords(null);
              },
              style: { background: isSelected ? "rgba(255,215,0,0.12)" : "rgba(255,255,255,0.04)", border: isSelected ? "1.5px solid rgba(255,215,0,0.5)" : "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "9px 13px", cursor: "pointer", color: "#fff", textAlign: "left", display: "flex", alignItems: "center", gap: "9px" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { size: 12, fill: isSelected ? "#FFD700" : "none", color: isSelected ? "#FFD700" : "#444" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700", color: isSelected ? "#FFD700" : "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: p.name.replace("⭐ ", "") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontFamily: "monospace", marginTop: "1px", color: ov ? "#FFD700" : "rgba(255,255,255,0.3)" }, children: ov ? `🔧 ${ov.lat.toFixed(4)}, ${ov.lng.toFixed(4)}` : `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}` })
                ] }),
                ov && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: (e) => {
                  e.stopPropagation();
                  handleReset(p.id);
                }, style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#FF6B6B", background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "6px", padding: "3px 7px", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: "2px" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { size: 9 }),
                  "초기화"
                ] })
              ]
            },
            String(p.id)
          );
        }) })
      ] }),
      selectedPoint && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px", marginBottom: "14px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setInputMode("click"), style: { flex: 1, padding: "11px", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "800", fontSize: `calc(13px * var(--fs, 1))`, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", background: inputMode === "click" ? "linear-gradient(135deg, #00C48C, #007B5E)" : "rgba(255,255,255,0.07)", color: inputMode === "click" ? "#fff" : "rgba(255,255,255,0.5)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MousePointer, { size: 14 }),
          " 지도 직접 클릭"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setInputMode("search"), style: { flex: 1, padding: "11px", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "800", fontSize: `calc(13px * var(--fs, 1))`, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", background: inputMode === "search" ? "linear-gradient(135deg, #FFD700, #FFA000)" : "rgba(255,255,255,0.07)", color: inputMode === "search" ? "#000" : "rgba(255,255,255,0.5)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14 }),
          " 주소 검색"
        ] })
      ] }),
      selectedPoint && inputMode === "search" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "14px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px", marginBottom: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: addressInput,
              onChange: (e) => setAddressInput(e.target.value),
              onKeyDown: (e) => e.key === "Enter" && handleSearch(),
              placeholder: "장소명 또는 주소 입력",
              style: { flex: 1, padding: "12px 14px", background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.13)", borderRadius: "12px", color: "#fff", fontSize: `calc(14px * var(--fs, 1))`, outline: "none" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleSearch, disabled: searching, style: { padding: "0 16px", background: "linear-gradient(135deg, #FFD700, #FFA000)", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "900", color: "#000", opacity: searching ? 0.6 : 1, display: "flex", alignItems: "center", gap: "4px", fontSize: `calc(13px * var(--fs, 1))` }, children: searching ? "..." : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14 }),
            "검색"
          ] }) })
        ] }),
        searchResults.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", overflow: "hidden" }, children: searchResults.map((r, idx) => (
          // ✅ 19TH-C1: 인덱스 key → 주소 값 key
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => {
                placeMarker(r.lat, r.lng, r.address, "search");
                setSearchResults([]);
                setAddressInput(r.address);
                setInputMode("click");
              },
              style: { width: "100%", padding: "11px 14px", background: "transparent", border: "none", borderBottom: idx < searchResults.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none", color: "#fff", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: "9px" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 13, color: "#FFD700", style: { marginTop: "2px", flexShrink: 0 } }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700" }, children: r.address }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }, children: [
                    r.lat.toFixed(5),
                    ", ",
                    r.lng.toFixed(5)
                  ] })
                ] })
              ]
            },
            r.address
          )
        )) })
      ] }),
      overrideCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "8px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.3)", fontWeight: "700", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 12, color: "#FFD700" }),
          " 수정된 포인트 (",
          overrideCount,
          "개) ",
          serverOnline && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#00C48C", fontSize: `calc(10px * var(--fs, 1))` }, children: "● 서버 반영됨" })
        ] }),
        Object.entries(overrides).map(([id, coords]) => {
          const p = SECRET_FISHING_POINTS.find((x) => x.id === parseInt(id));
          if (!p)
            return null;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,215,0,0.12)", borderRadius: "10px", padding: "9px 13px", marginBottom: "5px", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "700", color: "#FFD700" }, children: p.name.replace("⭐ ", "") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }, children: [
                coords.lat.toFixed(5),
                ", ",
                coords.lng.toFixed(5)
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
                  style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#4FC3F7", background: "rgba(79,195,247,0.08)", border: "1px solid rgba(79,195,247,0.2)", borderRadius: "7px", padding: "4px 8px", cursor: "pointer" },
                  children: "보기"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleReset(parseInt(id)), style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#FF6B6B", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "7px", padding: "4px 8px", cursor: "pointer" }, children: "초기화" })
            ] })
          ] }, id);
        })
      ] })
    ] })
  ] });
}

export { SecretPointAdmin as default };
