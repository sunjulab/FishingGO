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
 * 공유 바텀시트 표시
 * @param {Object} options
 * @param {string} options.title      - 공유 제목
 * @param {string} options.text       - 공유 설명
 * @param {string} options.url        - 게시글 웹 URL
 * @param {string} [options.imgUrl]   - 게시글 사진 URL (없으면 앱 로고)
 * @param {string} [options.postId]   - 게시글 ID (명시적으로 넘길 수 있음)
 * @param {Function} [options.addToast]
 */
export async function shareExternal({ title, text, url, imgUrl, postId, catchId, addToast }) {
  const pageUrl = url || window.location.href;

  // ✅ SHARE-IMG: 게시글 사진 있으면 표시, 없으면 낚시GO 앱 로고
  const shareImg = (imgUrl && imgUrl.startsWith('http')) ? imgUrl : APP_LOGO_URL;

  // ✅ SHARE-PARAMS: 명시 전달된 ID 우선, 없으면 URL 파싱
  const execParams = buildExecutionParams(pageUrl, postId, catchId);

  return new Promise((resolve) => {
    // ── 바텀시트 DOM 생성 ──────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      display: flex; align-items: flex-end; justify-content: center;
      opacity: 0; transition: opacity 0.2s ease;
    `;

    const sheet = document.createElement('div');
    sheet.style.cssText = `
      width: 100%; max-width: 480px; background: #fff;
      border-radius: 24px 24px 0 0; padding: 24px 20px 40px;
      transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.1, 0.9, 0.2, 1);
      display: flex; flex-direction: column; gap: 10px;
    `;

    // 핸들
    const handle = document.createElement('div');
    handle.style.cssText = 'width: 40px; height: 4px; background: #E5E5EA; border-radius: 2px; margin: 0 auto 12px;';
    sheet.appendChild(handle);

    // 미리보기 카드 (게시글 사진 또는 앱 로고)
    const previewCard = document.createElement('div');
    previewCard.style.cssText = `
      display: flex; align-items: center; gap: 12px;
      background: #F7F8FA; border-radius: 16px; padding: 12px 14px;
      margin-bottom: 8px; border: 1px solid #EFEFEF;
    `;
    const previewImg = document.createElement('img');
    previewImg.src = shareImg;
    previewImg.alt = '낚시GO';
    previewImg.style.cssText = 'width: 52px; height: 52px; border-radius: 12px; object-fit: cover; flex-shrink: 0;';
    const previewText = document.createElement('div');
    previewText.style.cssText = 'flex: 1; min-width: 0;';
    previewText.innerHTML = `
      <div style="font-size:14px;font-weight:800;color:#1c1c1e;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${title || '낚시GO 조황 기록'}</div>
      <div style="font-size:12px;color:#8E8E93;margin-top:2px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${text ? text.slice(0, 40) : '낚시GO에서 조과 기록을 확인하세요!'}</div>
      <div style="font-size:11px;color:#0056D2;margin-top:3px;font-weight:700;">🎣 낚시GO</div>
    `;
    previewCard.appendChild(previewImg);
    previewCard.appendChild(previewText);
    sheet.appendChild(previewCard);

    const titleEl = document.createElement('h3');
    titleEl.innerText = '공유하기';
    titleEl.style.cssText = 'font-size: 16px; font-weight: 800; text-align: center; margin-bottom: 4px; color: #1c1c1e;';
    sheet.appendChild(titleEl);

    // 닫기 헬퍼
    const closeSheet = () => {
      overlay.style.opacity = '0';
      sheet.style.transform = 'translateY(100%)';
      setTimeout(() => { if (document.body.contains(overlay)) document.body.removeChild(overlay); resolve(false); }, 300);
    };
    overlay.onclick = (e) => { if (e.target === overlay) closeSheet(); };

    // 버튼 생성 헬퍼
    const createBtn = (html, bgColor, color, onClick) => {
      const btn = document.createElement('button');
      btn.innerHTML = html;
      btn.style.cssText = `
        width: 100%; padding: 15px 16px; border-radius: 16px; border: none;
        background: ${bgColor}; color: ${color}; font-size: 15px; font-weight: 800;
        cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
        transition: transform 0.1s; text-align: center;
      `;
      btn.onmousedown = () => btn.style.transform = 'scale(0.97)';
      btn.onmouseup = () => btn.style.transform = 'scale(1)';
      btn.ontouchstart = () => btn.style.transform = 'scale(0.97)';
      btn.ontouchend = () => btn.style.transform = 'scale(1)';
      btn.onclick = () => { onClick(); closeSheet(); resolve(true); };
      return btn;
    };

    // ① 카카오톡 공유 — 링크 텍스트로 전달 (이미지 카드 없음)
    const btnKakao = createBtn(
      `<span style="font-size:20px;">💛</span> 카카오톡으로 공유`,
      '#FEE500', '#191919',
      async () => {
        // navigator.share(text만) → OS 공유 시트 → 카톡 선택 시 링크 텍스트로 전달
        if (navigator.share) {
          try {
            await navigator.share({ text: `${title || '낚시GO'}\n${pageUrl}` });
            return;
          } catch (e) { if (e.name === 'AbortError') return; }
        }
        // fallback: 링크 복사 + 카카오톡 열기
        const copied = await copyToClipboard(pageUrl);
        addToast?.(
          copied ? '💛 링크가 복사됐어요! 카카오톡에서 붙여넣기 해주세요.' : '💛 카카오톡을 열어 링크를 붙여넣기 해주세요.',
          'success'
        );
        setTimeout(() => { openKakaoTalk(); }, 400);
      }
    );


    // ② 일반 외부 앱 공유 (Web Share API)
    const btnOther = createBtn(
      `<span style="font-size:18px;">🔗</span> 다른 앱으로 공유`,
      '#F2F2F7', '#1c1c1e',
      async () => {
        if (navigator.share) {
          try { await navigator.share({ title, text, url: pageUrl }); } catch {}
        } else {
          addToast?.('지원하지 않는 브라우저입니다.', 'error');
        }
      }
    );

    // ③ 링크 복사
    const btnCopy = createBtn(
      `<span style="font-size:18px;">📋</span> 링크 복사`,
      '#F2F2F7', '#1c1c1e',
      async () => {
        try {
          await navigator.clipboard.writeText(pageUrl);
          addToast?.('🔗 링크가 클립보드에 복사됐습니다!', 'success');
        } catch { addToast?.('복사 실패', 'error'); }
      }
    );

    // ④ 앱 설치 유도 (브라우저 환경에서만 표시)
    const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
    const isAndroid = /android/i.test(navigator.userAgent);

    sheet.appendChild(btnKakao);
    if (navigator.share) sheet.appendChild(btnOther);
    sheet.appendChild(btnCopy);

    // 앱 미설치 환경(모바일 브라우저)에서만 스토어 유도 버튼 표시
    if (!isNative && isAndroid) {
      const btnStore = createBtn(
        `<span style="font-size:18px;">📱</span> 낚시GO 앱 설치하기`,
        'linear-gradient(135deg, #0056D2, #0096FF)', '#fff',
        () => { window.open(PLAY_STORE_URL, '_blank'); }
      );
      sheet.appendChild(btnStore);
    }

    // 취소 버튼
    const btnCancel = document.createElement('button');
    btnCancel.innerText = '취소';
    btnCancel.style.cssText = 'width: 100%; padding: 14px; border: none; background: transparent; color: #8E8E93; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 4px;';
    btnCancel.onclick = closeSheet;
    sheet.appendChild(btnCancel);

    overlay.appendChild(sheet);
    document.body.appendChild(overlay);

    // 애니메이션 트리거
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      sheet.style.transform = 'translateY(0)';
    });
  });
}
