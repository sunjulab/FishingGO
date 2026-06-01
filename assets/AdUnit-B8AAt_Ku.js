import { C as Capacitor, r as registerPlugin, u as useUserStore, A as ADMIN_ID, a as ADMIN_EMAIL, j as jsxRuntimeExports, s as showRewardedAd } from './index-C2ieaxTI.js';
import { r as reactExports } from './vendor-react-BzbiWsGG.js';

function getNativeAdPlugin() {
  try {
    if (!Capacitor.isNativePlatform())
      return { NativeAdPlugin: null };
    return { NativeAdPlugin: registerPlugin("NativeAd") };
  } catch {
    return { NativeAdPlugin: null };
  }
}
const isCapacitorNative = () => {
  try {
    if (Capacitor.isNativePlatform())
      return true;
  } catch (_) {
  }
  if (typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.())
    return true;
  if (typeof navigator !== "undefined" && /wv/.test(navigator.userAgent) && /Android/.test(navigator.userAgent))
    return true;
  return false;
};
function loadAdSense() {
}
function NativeAd({ style = {}, slotId = "native_ad_default" }) {
  return null;
}
function _NativeAdLegacy({ style = {}, slotId = "native_ad_default" }) {
  const ref = reactExports.useRef(null);
  const loadedRef = reactExports.useRef(false);
  const retryRef = reactExports.useRef(0);
  const retryTimerRef = reactExports.useRef(null);
  const IS_NATIVE = isCapacitorNative();
  const [adFailed, setAdFailed] = reactExports.useState(false);
  const isPremium = useUserStore(
    (s) => ["BUSINESS_LITE", "PRO", "BUSINESS_VIP", "MASTER"].includes(s.userTier) || s.user?.id === ADMIN_ID || s.user?.email === ADMIN_EMAIL
  );
  reactExports.useEffect(() => {
    if (!IS_NATIVE || isPremium || !ref.current)
      return;
    if (loadedRef.current)
      return;
    loadedRef.current = true;
    const el = ref.current;
    const tryLoad = (attempt) => {
      loadNativeAd(slotId, el).then(() => {
        retryRef.current = 0;
      }).catch(() => {
        if (attempt < 2 && loadedRef.current) {
          retryTimerRef.current = setTimeout(() => tryLoad(attempt + 1), 3e3);
        } else {
          setAdFailed(true);
        }
      });
    };
    tryLoad(0);
    const { NativeAdPlugin } = getNativeAdPlugin();
    const updatePos = () => {
      if (!el)
        return;
      const dpr = window.devicePixelRatio || 1;
      const rect = el.getBoundingClientRect();
      const x = Math.round(rect.left * dpr);
      const y = Math.round(rect.top * dpr);
      const inVP = rect.bottom > 0 && rect.top < window.innerHeight;
      try {
        NativeAdPlugin?.setVisible({ slotId, visible: inVP });
        if (inVP)
          NativeAdPlugin?.updatePosition({ slotId, x, y });
      } catch {
      }
    };
    window.addEventListener("scroll", updatePos, { passive: true });
    const io = new IntersectionObserver(updatePos, { threshold: [0, 0.1, 1] });
    io.observe(el);
    const ro = new ResizeObserver(updatePos);
    ro.observe(el);
    return () => {
      window.removeEventListener("scroll", updatePos);
      io.disconnect();
      ro.disconnect();
      removeNativeAd(slotId);
      loadedRef.current = false;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [IS_NATIVE, isPremium, slotId]);
  if (isPremium)
    return null;
  if (adFailed)
    return null;
  if (!IS_NATIVE)
    return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref,
      style: {
        width: "100%",
        height: 280,
        margin: "4px 0 12px",
        borderRadius: "16px",
        background: "transparent",
        overflow: "hidden",
        flexShrink: 0,
        ...style
      }
    }
  );
}
function RewardGateModal({ isOpen, onClose, onRewardComplete, onSubscribe, context = "post" }) {
  const [adWatching, setAdWatching] = reactExports.useState(false);
  const [adProgress, setAdProgress] = reactExports.useState(0);
  const [adDone, setAdDone] = reactExports.useState(false);
  const [autoCount, setAutoCount] = reactExports.useState(0);
  const [webAdFullscreen, setWebAdFullscreen] = reactExports.useState(false);
  const [skipVisible, setSkipVisible] = reactExports.useState(false);
  const CONTEXT_TEXT = {
    post: { title: "🎣 게시글 무료 등록", action: "글 등록 완료!" },
    crew: { title: "🏕️ 크루 방 무료 개설", action: "크루 개설 완료!" },
    point: { title: "📍 낚시 포인트 확인", action: "포인트 확인 완료!" },
    secret: { title: "⭐ 비밀 포인트 확인", action: "비밀 포인트 오픈!" }
  };
  const ctx = CONTEXT_TEXT[context] || CONTEXT_TEXT.post;
  const intervalRef = reactExports.useRef(null);
  const autoTimerRef = reactExports.useRef(null);
  const calledRef = reactExports.useRef(false);
  reactExports.useEffect(() => {
    if (isOpen) {
      setAdWatching(false);
      setAdProgress(0);
      setAdDone(false);
      setAutoCount(0);
      setWebAdFullscreen(false);
      setSkipVisible(false);
      calledRef.current = false;
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (autoTimerRef.current) {
        clearInterval(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    }
  }, [isOpen]);
  reactExports.useEffect(() => {
    return () => {
      if (intervalRef.current)
        clearInterval(intervalRef.current);
      if (autoTimerRef.current)
        clearInterval(autoTimerRef.current);
    };
  }, []);
  reactExports.useEffect(() => {
    if (!adDone)
      return;
    setAutoCount(2);
    const countId = setInterval(() => {
      setAutoCount((prev) => {
        if (prev <= 1) {
          clearInterval(countId);
          autoTimerRef.current = null;
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1e3);
    autoTimerRef.current = countId;
    return () => {
      clearInterval(countId);
    };
  }, [adDone]);
  const startWebTimerFallback = () => {
    setAdWatching(true);
    setAdProgress(0);
    setSkipVisible(false);
    if (intervalRef.current)
      clearInterval(intervalRef.current);
    const skipTimer = setTimeout(() => setSkipVisible(true), 5e3);
    const intervalId = setInterval(() => {
      setAdProgress((prev) => {
        if (prev >= 100) {
          clearInterval(intervalId);
          clearTimeout(skipTimer);
          intervalRef.current = null;
          setAdWatching(false);
          setWebAdFullscreen(false);
          setAdDone(true);
          return 100;
        }
        return prev + 100 / 30;
      });
    }, 1e3);
    intervalRef.current = intervalId;
  };
  const handleWatchAd = () => {
    const isNativeApp = (() => {
      try {
        return Capacitor.isNativePlatform();
      } catch {
        return false;
      }
    })();
    if (isNativeApp) {
      setAdWatching(true);
      showRewardedAd(
        () => {
          setAdWatching(false);
          setAdDone(true);
        },
        () => {
          setAdWatching(false);
        }
      );
      return;
    }
    let googleAdShowing = false;
    let fallbackStarted = false;
    const startFallback = () => {
      if (fallbackStarted)
        return;
      fallbackStarted = true;
      setWebAdFullscreen(true);
      startWebTimerFallback();
    };
    if (typeof window.adBreak === "function") {
      window.adBreak({
        type: "reward",
        name: "fishing-point-reward",
        beforeReward: (showAdFn) => {
          googleAdShowing = true;
          showAdFn();
        },
        adViewed: () => {
          setAdWatching(false);
          setWebAdFullscreen(false);
          setAdDone(true);
        },
        adDismissed: () => {
          setAdWatching(false);
          setWebAdFullscreen(false);
        },
        afterAd: () => {
          if (!googleAdShowing)
            startFallback();
        }
      });
      setTimeout(() => {
        if (!googleAdShowing && !fallbackStarted)
          startFallback();
      }, 800);
    } else {
      startFallback();
    }
  };
  const handleComplete = () => {
    if (calledRef.current)
      return;
    calledRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    onRewardComplete?.();
    onClose?.();
  };
  if (!isOpen)
    return null;
  const remaining = Math.ceil(30 - adProgress / 100 * 30);
  if (webAdFullscreen) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
      position: "fixed",
      inset: 0,
      zIndex: 99999,
      background: "linear-gradient(135deg, #0A1628 0%, #0d2240 50%, #0A1628 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        position: "absolute",
        top: 16,
        left: 0,
        right: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        zIndex: 10
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          background: "rgba(255,255,255,0.12)",
          borderRadius: "8px",
          padding: "5px 12px",
          fontSize: "12px",
          color: "rgba(255,255,255,0.8)",
          fontWeight: "700",
          backdropFilter: "blur(4px)"
        }, children: "AD" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", width: 52, height: 52 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "52", height: "52", viewBox: "0 0 52 52", style: { transform: "rotate(-90deg)" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "26", cy: "26", r: "22", fill: "none", stroke: "rgba(255,255,255,0.15)", strokeWidth: "4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "circle",
              {
                cx: "26",
                cy: "26",
                r: "22",
                fill: "none",
                stroke: "#00C48C",
                strokeWidth: "4",
                strokeDasharray: `${2 * Math.PI * 22}`,
                strokeDashoffset: `${2 * Math.PI * 22 * (1 - adProgress / 100)}`,
                strokeLinecap: "round",
                style: { transition: "stroke-dashoffset 0.9s linear" }
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "15px",
            fontWeight: "900",
            color: "#fff"
          }, children: remaining })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "0 32px", marginTop: "-20px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          width: 90,
          height: 90,
          borderRadius: "24px",
          background: "linear-gradient(135deg, #0056D2, #00A3FF)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          boxShadow: "0 0 40px rgba(0,86,210,0.5)",
          fontSize: "44px",
          animation: "adPulse 2s ease-in-out infinite"
        }, children: "🎣" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "28px", fontWeight: "900", color: "#fff", marginBottom: "10px", lineHeight: 1.2 }, children: "낚시GO" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "16px", color: "rgba(255,255,255,0.75)", fontWeight: "600", marginBottom: "8px" }, children: "국내 최고 프리미엄 낚시 인텔리전스" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", color: "rgba(255,255,255,0.45)", fontWeight: "500" }, children: "실시간 물때 · 날씨 · 해양 CCTV · 낚시 포인트 지도" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "36px", width: "100%", maxWidth: 280, margin: "36px auto 0" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: "4px", background: "rgba(255,255,255,0.15)", borderRadius: "2px", overflow: "hidden" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            height: "100%",
            width: `${adProgress}%`,
            background: "linear-gradient(90deg, #0056D2, #00C48C)",
            borderRadius: "2px",
            transition: "width 0.9s linear"
          } }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: "10px", fontSize: "13px", color: "rgba(255,255,255,0.5)", textAlign: "center" }, children: remaining > 0 ? `${remaining}초 시청 후 보상 지급` : "시청 완료!" })
        ] })
      ] }),
      skipVisible && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setAdWatching(false);
            setWebAdFullscreen(false);
          },
          style: {
            position: "absolute",
            bottom: 40,
            right: 24,
            background: "rgba(255,255,255,0.18)",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "24px",
            fontSize: "14px",
            fontWeight: "700",
            cursor: "pointer",
            backdropFilter: "blur(4px)"
          },
          children: "광고 끄기 ›"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
          @keyframes adPulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(0,86,210,0.5); }
            50% { transform: scale(1.06); box-shadow: 0 0 60px rgba(0,163,255,0.7); }
          }
        ` })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
    position: "fixed",
    inset: 0,
    zIndex: 9e3,
    backgroundColor: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center"
  }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
    width: "100%",
    maxWidth: "480px",
    backgroundColor: "#ffffff",
    borderRadius: "24px 24px 0 0",
    padding: "28px 24px 40px",
    animation: "slideUp 0.3s ease"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "40px", height: "4px", backgroundColor: "#E5E5EA", borderRadius: "2px", margin: "0 auto 20px" } }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontSize: `calc(22px * var(--fs, 1))`, fontWeight: "900", textAlign: "center", marginBottom: "6px" }, children: ctx.title }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { fontSize: `calc(14px * var(--fs, 1))`, color: "#8E8E93", textAlign: "center", marginBottom: "28px" }, children: [
      "무료로 이용하거나 ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "LITE 이상" }),
      "을 구독하세요"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        onClick: () => onSubscribe?.(),
        style: {
          background: "linear-gradient(135deg, #0056D2, #0096FF)",
          borderRadius: "18px",
          padding: "20px",
          color: "#fff",
          cursor: "pointer",
          marginBottom: "12px",
          boxShadow: "0 8px 24px rgba(0,86,210,0.35)",
          transition: "transform 0.15s"
        },
        onMouseEnter: (e) => e.currentTarget.style.transform = "scale(1.02)",
        onMouseLeave: (e) => e.currentTarget.style.transform = "scale(1)",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, opacity: 0.85, fontWeight: "700", marginBottom: "4px" }, children: "⭐ LITE 이상" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "900", marginBottom: "4px" }, children: "광고 없이 무제한 등록" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, opacity: 0.9 }, children: "광고 없이 무제한 등록 · 무료 게시글 작성 횟수 제한 없음" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "right", flexShrink: 0, marginLeft: "12px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(22px * var(--fs, 1))`, fontWeight: "900" }, children: "₩9,900" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, opacity: 0.85 }, children: "/월 구독" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: "14px", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "12px", padding: "10px 16px", fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "800", textAlign: "center" }, children: "🚀 지금 구독하고 바로 등록하기" })
        ]
      }
    ),
    !adDone ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { border: `1.5px solid #E5E5EA`, borderRadius: "18px", padding: "20px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "800", marginBottom: "4px", color: "#1c1c1e" }, children: "📺 30초 광고 시청 후 무료 등록" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#8E8E93", marginBottom: "16px" }, children: "광고를 시청하면 1회 무료로 이용하실 수 있어요." }),
      adWatching ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#F2F2F7", borderRadius: "12px", padding: "20px", marginBottom: "12px", textAlign: "center", minHeight: "80px", display: "flex", alignItems: "center", justifyContent: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(24px * var(--fs, 1))` }, children: "📺" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#8E8E93", marginLeft: "8px", fontWeight: "600" }, children: "시청 중..." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: "6px", backgroundColor: "#F2F2F7", borderRadius: "3px", overflow: "hidden", marginBottom: "8px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: "100%", width: `${adProgress}%`, backgroundColor: "#0056D2", borderRadius: "3px", transition: "width 0.9s linear" } }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#8E8E93", textAlign: "center" }, children: [
          Math.ceil(30 - adProgress / 100 * 30),
          "초 후 완료..."
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: handleWatchAd,
          style: { width: "100%", padding: "14px", borderRadius: "12px", border: "1.5px solid #0056D2", backgroundColor: "rgba(0,86,210,0.05)", color: "#0056D2", fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer" },
          children: "📺 광고 시청하기"
        }
      )
    ] }) : (
      // ✅ FIX-AUTO: 시청 완료 후 자동 등록 카운트다운 표시
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: handleComplete,
          style: { width: "100%", padding: "16px", borderRadius: "18px", border: "none", backgroundColor: "#00C48C", color: "#fff", fontSize: `calc(17px * var(--fs, 1))`, fontWeight: "900", cursor: "pointer", boxShadow: "0 8px 20px rgba(0,196,140,0.3)" },
          children: [
            "✅ 시청 완료!",
            autoCount > 0 ? ` (${autoCount}초 후 자동 등록)` : ` ${ctx.action}`
          ]
        }
      )
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: onClose,
        style: { width: "100%", marginTop: "12px", padding: "14px", border: "none", background: "none", color: "#8E8E93", fontSize: `calc(14px * var(--fs, 1))`, cursor: "pointer", fontWeight: "600" },
        children: "취소"
      }
    )
  ] }) });
}

export { NativeAd as N, RewardGateModal as R };
