import { j as jsxRuntimeExports } from './index-rdBGUi8d.js';
import { r as reactExports } from './vendor-react-BzbiWsGG.js';

const PUB_ID = "ca-pub-9774243773523817";
const isNativeApp = () => {
  try {
    return typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
};
const pushAd = () => {
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (e) {
  }
};
function AdSenseDisplay({ style = {} }) {
  const insRef = reactExports.useRef(null);
  const pushed = reactExports.useRef(false);
  reactExports.useEffect(() => {
    if (isNativeApp())
      return;
    if (pushed.current || !insRef.current)
      return;
    pushed.current = true;
    pushAd();
    return () => {
      pushed.current = false;
    };
  }, []);
  if (isNativeApp())
    return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { overflow: "hidden", margin: "8px 0", minHeight: "50px", ...style }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    "ins",
    {
      ref: insRef,
      className: "adsbygoogle",
      style: { display: "block" },
      "data-ad-client": PUB_ID,
      "data-ad-slot": "4975909941",
      "data-ad-format": "auto",
      "data-full-width-responsive": "true"
    }
  ) });
}
function AdSenseInFeed({ style = {} }) {
  const insRef = reactExports.useRef(null);
  const pushed = reactExports.useRef(false);
  reactExports.useEffect(() => {
    if (isNativeApp())
      return;
    if (pushed.current || !insRef.current)
      return;
    pushed.current = true;
    pushAd();
    return () => {
      pushed.current = false;
    };
  }, []);
  if (isNativeApp())
    return null;
  return (
    // ⚠️ height 고정 금지 — 인피드 광고 크기는 AdSense가 자동 결정
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { overflow: "hidden", margin: "8px 0", ...style }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "ins",
      {
        ref: insRef,
        className: "adsbygoogle",
        style: { display: "block" },
        "data-ad-format": "fluid",
        "data-ad-layout-key": "-6t+ed+2i-1n-4w",
        "data-ad-client": PUB_ID,
        "data-ad-slot": "8319268904"
      }
    ) })
  );
}

export { AdSenseDisplay as A, AdSenseInFeed as a };
