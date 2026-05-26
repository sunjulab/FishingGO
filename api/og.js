/**
 * api/og.js — 낚시GO 동적 OG 태그 서버리스 함수 (Vercel)
 *
 * 역할:
 *  - 크롤러(KakaoTalk, WhatsApp 등)가 /catch/:id 또는 /post/:id 요청 시 호출
 *  - 백엔드에서 게시글 데이터 조회 → OG 태그 포함 HTML 반환
 *  - 일반 브라우저는 ?ref=og 붙여서 SPA로 리다이렉트 (무한루프 방지)
 */

const BACKEND_URL = 'https://fishing-go-backend.onrender.com';
const SITE_URL    = 'https://fishing-go.vercel.app';
const DEFAULT_IMG = `${SITE_URL}/og-image.png`;
const TIMEOUT_MS  = 5000;

// 봇 User-Agent 감지
function isBot(ua = '') {
  return /facebookexternalhit|Twitterbot|WhatsApp|KakaoTalk|Kakao|Telegram|Slack|Discord|LinkedInBot|googlebot|bingbot|yandexbot|Applebot|crawl|spider|bot|python|curl/i.test(ua);
}

// HTML 특수문자 이스케이프 (XSS 방지)
function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// fetch with timeout
async function fetchWithTimeout(url, ms = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

export default async function handler(req, res) {
  const { type, id } = req.query;

  if (!type || !id) {
    return res.status(400).send('type and id required');
  }

  const pageUrl  = `${SITE_URL}/${type}/${id}`;
  const spaUrl   = `${pageUrl}?ref=og`; // 브라우저용: ?ref=og → SPA rewrite 제외

  // ── 브라우저는 SPA로 바로 리다이렉트 ──────────────────────────────
  const ua = req.headers['user-agent'] || '';
  if (!isBot(ua)) {
    res.setHeader('Location', spaUrl);
    return res.status(302).end();
  }

  // ── 봇: 데이터 조회 후 OG HTML 반환 ──────────────────────────────
  let title       = '낚시GO 조황 기록';
  let description = '낚시GO에서 조황 기록을 확인하세요! 🎣';
  let imageUrl    = DEFAULT_IMG;

  try {
    if (type === 'catch') {
      const data = await fetchWithTimeout(`${BACKEND_URL}/api/records/${id}`);
      const r = data?.record || data;
      const fish = r?.fishName || r?.fish || '조황';
      const size = r?.fishSize ? `${r.fishSize}cm` : '';
      const loc  = r?.location || '';
      title       = `🎣 ${fish}${size ? ' ' + size : ''} 조황 인증! | 낚시GO`;
      description = [r?.memo, loc].filter(Boolean).join(' · ') || description;
      if (r?.imageUrl?.startsWith('http')) imageUrl = r.imageUrl;

    } else if (type === 'post') {
      const data = await fetchWithTimeout(`${BACKEND_URL}/api/community/posts/${id}`);
      const p = data?.post || data;
      title       = `${p?.title || p?.content?.slice(0, 40) || '게시글'} | 낚시GO`;
      description = p?.content?.slice(0, 100) || description;
      const img   = p?.image || p?.images?.[0];
      if (img?.startsWith('http')) imageUrl = img;
    }
  } catch (e) {
    // 데이터 조회 실패 시 기본값 사용
  }

  const safeTitle = esc(title);
  const safeDesc  = esc(description);
  const safeImg   = esc(imageUrl);
  const safeUrl   = esc(pageUrl);
  const safeSpa   = esc(spaUrl);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=300');

  return res.status(200).send(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}">

  <!-- Open Graph -->
  <meta property="og:type"        content="article">
  <meta property="og:site_name"   content="낚시GO">
  <meta property="og:title"       content="${safeTitle}">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:image"       content="${safeImg}">
  <meta property="og:image:width"  content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url"         content="${safeUrl}">
  <meta property="og:locale"      content="ko_KR">

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  <meta name="twitter:image"       content="${safeImg}">

  <!-- 브라우저는 SPA로 즉시 이동 -->
  <meta http-equiv="refresh" content="0;url=${safeSpa}">
</head>
<body>
  <script>window.location.replace('${safeSpa}');</script>
  <p>낚시GO로 이동 중... <a href="${safeSpa}">여기를 클릭하세요</a></p>
</body>
</html>`);
}
