/**
 * api/og.js — 낚시GO 동적 OG 태그 (Vercel Serverless Function)
 * CommonJS 형식 — Vercel에서 안정적으로 동작
 */

const BACKEND_URL = 'https://fishing-go-backend.onrender.com';
const SITE_URL    = 'https://fishing-go.vercel.app';
// 사진 없을 경우 앱 아이콘으로 대체 (182KB — og-image.png 2MB보다 훨씬 작음)
const DEFAULT_IMG = `${SITE_URL}/icon-192.png`;

function isBot(ua) {
  if (!ua) return false;
  return /facebookexternalhit|Twitterbot|WhatsApp|KakaoTalk|Kakaotalk|Kakao|Telegram|Slack|Discord|LinkedInBot|googlebot|bingbot|yandexbot|Applebot|crawl|spider|bot|python|curl|wget|scrapy|DaumApps/i.test(ua);
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function fetchJson(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    clearTimeout(t);
    return null;
  }
}

module.exports = async function handler(req, res) {
  const { type, id } = req.query;
  if (!type || !id) return res.status(400).send('type and id required');

  const pageUrl = `${SITE_URL}/${type}/${id}`;
  const spaUrl  = `${pageUrl}?ref=og`;
  const ua = req.headers['user-agent'] || '';

  // 봇이 아니면 SPA로 리다이렉트 (무한루프 방지: ?ref=og → vercel.json missing 조건으로 index.html 서빙)
  if (!isBot(ua)) {
    res.setHeader('Location', spaUrl);
    return res.status(302).end();
  }

  // 봇: DB에서 데이터 조회 후 OG HTML 반환
  let title = '낚시GO';
  let desc  = '낚시GO에서 조황·커뮤니티 기록을 확인하세요 🎣';
  let img   = DEFAULT_IMG;  // 기본: 앱 아이콘

  try {
    if (type === 'catch') {
      const data = await fetchJson(`${BACKEND_URL}/api/records/${id}`);
      const r = data?.record || data;
      if (r) {
        const fish = r.fishName || r.fish || '조황';
        const size = r.fishSize ? ` ${r.fishSize}cm` : '';
        title = `🎣 ${fish}${size} 조황 인증! | 낚시GO`;
        desc  = [r.memo, r.location].filter(Boolean).join(' · ') || desc;
        if (r.imageUrl?.startsWith('http')) img = r.imageUrl;  // 사진 있으면 사진, 없으면 앱 아이콘
      }
    } else if (type === 'post') {
      const data = await fetchJson(`${BACKEND_URL}/api/community/posts/${id}`);
      const p = data?.post || data;
      if (p) {
        title = `${p.title || p.content?.slice(0, 40) || '게시글'} | 낚시GO`;
        desc  = p.content?.slice(0, 100) || desc;
        const postImg = p.image || (Array.isArray(p.images) ? p.images[0] : null);
        if (postImg?.startsWith('http')) img = postImg;  // 사진 있으면 사진, 없으면 앱 아이콘
      }
    }
  } catch (_) { /* 데이터 조회 실패 시 기본값 사용 */ }

  const t = esc(title), d = esc(desc), i = esc(img), u = esc(pageUrl), s = esc(spaUrl);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=300');

  return res.status(200).send(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${t}</title>
<meta name="description" content="${d}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="낚시GO">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:image" content="${i}">
<meta property="og:image:width" content="512">
<meta property="og:image:height" content="512">
<meta property="og:url" content="${u}">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${i}">
<meta http-equiv="refresh" content="0;url=${s}">
</head>
<body>
<script>window.location.replace('${s}');</script>
<a href="${s}">낚시GO에서 보기</a>
</body>
</html>`);
};
