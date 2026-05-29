function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-B7uyTVY1.js","assets/index-CUv3Hibb.js","assets/vendor-react-BzbiWsGG.js","assets/vendor-icons-C5BxRig-.js","assets/vendor-store-DFdRS9Cc.js","assets/vendor-http-ChhVHlBG.js","assets/vendor-socket-FPM1Bwz4.js","assets/index-DKFtvhIq.css","assets/index-Dd1n-iaY.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
import { _ as __vitePreload } from './vendor-react-BzbiWsGG.js';

const PLAY_STORE_URL = "https://play.google.com/apps/internaltest/4701312289208373704";
const APP_LOGO_URL = "https://www.fishing-go.com/og-image.png?v=20260526";
const SITE_URL = "https://www.fishing-go.com";
const APP_ID = "kr.fishinggo.app";
async function copyToClipboard(text) {
  try {
    const { Clipboard } = await __vitePreload(() => import('./index-B7uyTVY1.js'),true?__vite__mapDeps([0,1,2,3,4,5,6,7]):void 0);
    await Clipboard.write({ string: text });
    return true;
  } catch {
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.cssText = "position:fixed;top:-9999px;opacity:0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    return true;
  } catch {
    return false;
  }
}
async function openKakaoTalk() {
  try {
    const { AppLauncher } = await __vitePreload(() => import('./index-Dd1n-iaY.js'),true?__vite__mapDeps([8,2,1,3,4,5,6,7]):void 0);
    const { value: canOpen } = await AppLauncher.canOpenUrl({ url: "kakaotalk://" });
    if (canOpen) {
      await AppLauncher.openUrl({ url: "kakaotalk://" });
      return;
    }
  } catch {
  }
  try {
    window.open("kakaotalk://", "_system");
    return;
  } catch {
  }
  try {
    window.location.href = "kakaotalk://";
  } catch {
  }
}
function ensureKakaoReady() {
  if (!window.Kakao)
    return false;
  if (!window.Kakao.isInitialized()) {
    try {
      const key = window.__kakaoAppKey || "d353be56977b1c13b03d8981bcf8b5ba";
      window.Kakao.init(key);
    } catch {
      return false;
    }
  }
  return window.Kakao.isInitialized();
}
function extractIdFromUrl(url) {
  try {
    const u = new URL(url);
    const postMatch = u.pathname.match(/\/post\/([^/?#]+)/);
    if (postMatch)
      return { type: "post", id: postMatch[1] };
    const catchMatch = u.pathname.match(/\/catch\/([^/?#]+)/);
    if (catchMatch)
      return { type: "catch", id: catchMatch[1] };
  } catch {
  }
  return null;
}
function buildDeepLink(pageUrl) {
  const parsed = extractIdFromUrl(pageUrl);
  if (!parsed)
    return null;
  const { type, id } = parsed;
  return `fishinggo://${type}?${type}Id=${id}`;
}
function buildExecutionParams(pageUrl, explicitPostId, explicitCatchId) {
  if (explicitPostId)
    return `postId=${explicitPostId}`;
  if (explicitCatchId)
    return `catchId=${explicitCatchId}`;
  const parsed = extractIdFromUrl(pageUrl);
  if (!parsed)
    return `path=${encodeURIComponent(pageUrl)}`;
  const { type, id } = parsed;
  return `${type}Id=${id}`;
}
function openAppOrStore(pageUrl) {
  const parsed = extractIdFromUrl(pageUrl);
  if (!parsed) {
    window.location.href = PLAY_STORE_URL;
    return;
  }
  const { type, id } = parsed;
  const deepLink = `fishinggo://${type}?${type}Id=${id}`;
  const intentUrl = `intent:${deepLink}#Intent;scheme=fishinggo;package=${APP_ID};S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;
  window.location.href = intentUrl;
}
function toOgUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.hostname.includes("fishing-go.com"))
      return rawUrl;
    const ogPostMatch = u.pathname.match(/\/og\/post\/([^/?#]+)/);
    if (ogPostMatch)
      return `${SITE_URL}/post/${ogPostMatch[1]}`;
    const ogCatchMatch = u.pathname.match(/\/og\/catch\/([^/?#]+)/);
    if (ogCatchMatch)
      return `${SITE_URL}/catch/${ogCatchMatch[1]}`;
    const postMatch = u.pathname.match(/\/post\/([^/?#]+)/);
    if (postMatch)
      return `${SITE_URL}/post/${postMatch[1]}`;
    const catchMatch = u.pathname.match(/\/catch\/([^/?#]+)/);
    if (catchMatch)
      return `${SITE_URL}/catch/${catchMatch[1]}`;
  } catch {
  }
  return rawUrl;
}
async function shareExternal({ title, url, addToast }) {
  const rawUrl = url || window.location.href;
  const pageUrl = toOgUrl(rawUrl);
  const shareText = `${title || "낚시GO"}
${pageUrl}`;
  const isNative = typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();
  if (isNative) {
    try {
      const { registerPlugin } = await __vitePreload(() => import('./index-CUv3Hibb.js').then(n => n.i),true?__vite__mapDeps([1,2,3,4,5,6,7]):void 0);
      const NativeAd = registerPlugin("NativeAd");
      await NativeAd.shareText({ text: shareText, title: title || "낚시GO" });
      return;
    } catch (e) {
      const msg = e?.message || "";
      if (msg.toLowerCase().includes("cancel"))
        return;
    }
  }
  if (navigator.share) {
    try {
      await navigator.share({ text: shareText });
      return;
    } catch (e) {
      if (e.name === "AbortError")
        return;
    }
  }
  const copied = await copyToClipboard(pageUrl);
  addToast?.(copied ? "🔗 링크가 복사됐어요!" : "복사 실패", copied ? "success" : "error");
  if (copied)
    setTimeout(() => {
      openKakaoTalk();
    }, 400);
}

export { shareExternal as s };
