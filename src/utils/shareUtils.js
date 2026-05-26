/**
 * shareUtils.js - 낚시GO 외부 앱 공유 유틸리티 (고도화)
 *
 * ✅ SHARE-V2: 딥링크 기반 공유
 *   - 앱 설치됨 → fishinggo://post?postId=xxx → 게시글 직접 이동
 *   - 앱 미설치 → Play Store 내부 테스트 링크로 이동
 *   - 게시글 사진 있으면 표시, 없으면 낚시GO 앱 로고 표시
 */

const PLAY_STORE_URL = 'https://play.google.com/apps/internaltest/4701312289208373704';
const APP_LOGO_URL = 'https://fishing-go.vercel.app/og-image.png?v=20260526';
const APP_ID = 'kr.fishinggo.app'; // ✅ capacitor.config.json appId

// ✅ CLIPBOARD: Capacitor 전용 클립보드 → 브라우저 API → execCommand 순서로 폴백
async function copyToClipboard(text) {
  // 1순위: @capacitor/clipboard (Android Capacitor WebView에서 가장 신뢰)
  try {
    const { Clipboard } = await import('@capacitor/clipboard');
    await Clipboard.write({ string: text });
    return true;
  } catch { /* noop */ }
  // 2순위: 브라우저 Clipboard API (HTTPS 환경)
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch { /* noop */ }
  // 3순위: execCommand 폴백
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.cssText = 'position:fixed;top:-9999px;opacity:0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return true;
  } catch { return false; }
}

// ✅ KAKAO-OPEN: AppLauncher(공식) → window.open(_system) → location.href 순 폴백
async function openKakaoTalk() {
  // 1순위: @capacitor/app-launcher (Capacitor 공식 앱 실행 방법)
  try {
    const { AppLauncher } = await import('@capacitor/app-launcher');
    const { value: canOpen } = await AppLauncher.canOpenUrl({ url: 'kakaotalk://' });
    if (canOpen) {
      await AppLauncher.openUrl({ url: 'kakaotalk://' });
      return;
    }
  } catch { /* noop */ }
  // 2순위: window.open _system (Capacitor WebView 외부 URL 처리)
  try { window.open('kakaotalk://', '_system'); return; } catch { /* noop */ }
  // 3순위: location.href (브라우저 환경)
  try { window.location.href = 'kakaotalk://'; } catch { /* noop */ }
}

// ✅ KAKAO-INIT: 동기(sync) 초기화 — await 없이 user gesture context 보존
// sendDefault()는 반드시 user gesture 내 동기 호출이어야 함 (async 차단 대상)
function ensureKakaoReady() {
  if (!window.Kakao) return false;
  if (!window.Kakao.isInitialized()) {
    try {
      const key = window.__kakaoAppKey || 'd353be56977b1c13b03d8981bcf8b5ba';
      window.Kakao.init(key);
    } catch { return false; }
  }
  return window.Kakao.isInitialized();
}

/**
 * URL에서 postId / catchId 추출
 * /post/abc123  →  { type: 'post', id: 'abc123' }
 * /catch/xyz789 →  { type: 'catch', id: 'xyz789' }
 */
function extractIdFromUrl(url) {
  try {
    const u = new URL(url);
    const postMatch = u.pathname.match(/\/post\/([^/?#]+)/);
    if (postMatch) return { type: 'post', id: postMatch[1] };
    const catchMatch = u.pathname.match(/\/catch\/([^/?#]+)/);
    if (catchMatch) return { type: 'catch', id: catchMatch[1] };
  } catch { /* noop */ }
  return null;
}

/**
 * fishinggo:// 커스텀 딥링크 URL 생성
 * 앱 설치된 경우 이 URL로 앱을 실행해 해당 화면으로 이동
 */
function buildDeepLink(pageUrl) {
  const parsed = extractIdFromUrl(pageUrl);
  if (!parsed) return null;
  const { type, id } = parsed;
  return `fishinggo://${type}?${type}Id=${id}`;
}

/**
 * 카카오 ExecutionParams 문자열 생성
 * androidExecutionParams / iosExecutionParams 에 넣을 값
 * postId / catchId 명시 전달 시 URL 파싱보다 우선 사용
 */
function buildExecutionParams(pageUrl, explicitPostId, explicitCatchId) {
  if (explicitPostId) return `postId=${explicitPostId}`;
  if (explicitCatchId) return `catchId=${explicitCatchId}`;
  const parsed = extractIdFromUrl(pageUrl);
  if (!parsed) return `path=${encodeURIComponent(pageUrl)}`;
  const { type, id } = parsed;
  return `${type}Id=${id}`;
}

/**
 * 모바일 브라우저에서 앱 실행 시도 후 미설치 시 Play Store로 폴백
 * intent:// 스킴 사용
 */
function openAppOrStore(pageUrl) {
  const parsed = extractIdFromUrl(pageUrl);
  if (!parsed) {
    window.location.href = PLAY_STORE_URL;
    return;
  }
  const { type, id } = parsed;
  const deepLink = `fishinggo://${type}?${type}Id=${id}`;

  // intent:// 스킴: 앱 설치 → 앱 실행, 미설치 → Play Store
  const intentUrl = `intent:${deepLink}#Intent;scheme=fishinggo;package=${APP_ID};S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;
  window.location.href = intentUrl;
}

/**
 * 외부 앱 공유 (B안: OS 공유 시트 바로 실행)
 * @capacitor/share → intent:// → 링크 복사 순 fallback
 */
export async function shareExternal({ title, url, addToast }) {
  const pageUrl = url || window.location.href;
  const shareText = `${title || '낚시GO'}\n${pageUrl}`;
  const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();

  // 1순위: @capacitor/share (네이티브 OS 공유 시트)
  if (isNative) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title: title || '낚시GO',
        text: shareText,
        url: pageUrl,
        dialogTitle: '공유하기',
      });
      return;
    } catch (e) {
      const msg = e?.message || e?.errorMessage || '';
      if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('취소')) return;
      // 우회체: intent:// 직접 트리거
      try {
        const encoded = encodeURIComponent(shareText);
        const intentUrl = `intent://sharing#Intent;action=android.intent.action.SEND;type=text/plain;S.android.intent.extra.TEXT=${encoded};end`;
        window.location.href = intentUrl;
        return;
      } catch { /* 논이키지 않음 */ }
    }
  }

  // 2순위: navigator.share (브라우저 환경)
  if (navigator.share) {
    try {
      await navigator.share({ text: shareText });
      return;
    } catch (e) { if (e.name === 'AbortError') return; }
  }
  // 3순위: 링크 복사 + 카카오톡 열기
  const copied = await copyToClipboard(pageUrl);
  addToast?.(copied ? '🔗 링크가 복사됐어요!' : '복사 실패', copied ? 'success' : 'error');
  if (copied) setTimeout(() => { openKakaoTalk(); }, 400);
}

