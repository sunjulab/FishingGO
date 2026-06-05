// analyze_link.cjs - 알리익스프레스 단축링크 분석
const https = require('https');
const http = require('http');

const TARGET_URL = 'https://s.click.aliexpress.com/e/_c4P0Pz2p';
const KNOWN_URL  = 'https://s.click.aliexpress.com/e/_c3qIG2jJ'; // 작동하는 링크

function headRedirects(startUrl, label, maxHops = 20) {
  return new Promise((resolve) => {
    const chain = [startUrl];
    let hops = 0;

    function doHead(currentUrl) {
      if (hops++ > maxHops) return resolve({ label, chain, productId: null, error: '홉 초과' });

      let parsed;
      try { parsed = new URL(currentUrl); } catch { return resolve({ label, chain, productId: null, error: '잘못된 URL' }); }

      const mod = parsed.protocol === 'https:' ? https : http;
      const req = mod.request({
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'HEAD',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'ko-KR,ko;q=0.9',
        },
      }, (r) => {
        r.resume();
        if ([301,302,303,307,308].includes(r.statusCode) && r.headers.location) {
          const next = r.headers.location.startsWith('http')
            ? r.headers.location
            : `${parsed.protocol}//${parsed.host}${r.headers.location}`;
          chain.push({ status: r.statusCode, to: next.slice(0, 120) });

          const idMatch = next.match(/\/item\/(\d{8,})/);
          if (idMatch) return resolve({ label, chain, productId: idMatch[1], finalUrl: next, error: null });
          return doHead(next);
        }
        // 최종 도착 (리다이렉트 없음)
        const idNow = currentUrl.match(/\/item\/(\d{8,})/);
        resolve({ label, chain, productId: idNow ? idNow[1] : null, finalUrl: currentUrl, status: r.statusCode, error: null });
      });

      req.on('error', (e) => resolve({ label, chain, error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ label, chain, error: '타임아웃' }); });
      req.end();
    }

    doHead(startUrl);
  });
}

function fetchPage(productId) {
  return new Promise((resolve) => {
    if (!productId) return resolve({ html: '', error: '상품ID없음' });
    let hops = 0;
    function doGet(url) {
      if (hops++ > 5) return resolve({ html: '', error: '리다이렉트초과' });
      let parsed; try { parsed = new URL(url); } catch { return resolve({ html: '', error: '잘못된URL' }); }
      const req = https.request({
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'GET', timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
          'Accept-Language': 'ko-KR,ko;q=0.9',
          'Accept': 'text/html,*/*',
        },
      }, (r) => {
        if ([301,302,303,307,308].includes(r.statusCode) && r.headers.location) {
          r.resume();
          const next = r.headers.location.startsWith('http') ? r.headers.location : `https://${parsed.host}${r.headers.location}`;
          return doGet(next);
        }
        let body = ''; r.setEncoding('utf8');
        r.on('data', c => { if (body.length < 300000) body += c; });
        r.on('end', () => resolve({ html: body, status: r.statusCode }));
      });
      req.on('error', e => resolve({ html: '', error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ html: '', error: '타임아웃' }); });
      req.end();
    }
    doGet(`https://www.aliexpress.com/item/${productId}.html`);
  });
}

function extractMeta(html) {
  const img   = (html.match(/property="og:image" content="([^"]+)"/) || [])[1] || null;
  const title = (html.match(/property="og:title" content="([^"]+)"/) || [])[1] || null;
  const price = (html.match(/"minAmount":\{"value":"([^"]+)"/) || [])[1] || null;
  return { img: img ? img.split('?')[0] : null, title: title ? title.replace(/ - AliExpress\s*\d*/, '').trim() : null, price };
}

async function main() {
  console.log('=== 알리익스프레스 링크 분석 보고서 ===\n');
  console.log('분석 시각:', new Date().toLocaleString('ko-KR'));
  console.log('');

  // 두 링크 동시 HEAD 추적
  const [r1, r2] = await Promise.all([
    headRedirects(KNOWN_URL,  '✅ 기존 링크 (작동)'),
    headRedirects(TARGET_URL, '❓ 문제 링크'),
  ]);

  for (const r of [r1, r2]) {
    console.log(`--- ${r.label} ---`);
    if (r.error) console.log('  오류:', r.error);
    console.log('  상품 ID:', r.productId || '❌ 없음');
    console.log('  최종 URL:', (r.finalUrl || '').slice(0, 100));
    console.log('  리다이렉트 체인:');
    r.chain.forEach((c, i) => {
      if (typeof c === 'string') console.log(`    [0] ${c}`);
      else console.log(`    [${i}] ${c.status} → ${c.to}`);
    });
    console.log('');
  }

  // 각 링크 상품 페이지 조회
  console.log('=== 상품 페이지 메타데이터 조회 ===\n');

  const [p1, p2] = await Promise.all([
    fetchPage(r1.productId),
    fetchPage(r2.productId),
  ]);

  const m1 = extractMeta(p1.html);
  const m2 = extractMeta(p2.html);

  console.log('✅ 기존 링크 상품 (ID:', r1.productId, ')');
  console.log('  이미지:', m1.img || '❌ 없음');
  console.log('  제목:', m1.title || '❌ 없음');
  console.log('  가격:', m1.price || '없음');
  console.log('');

  console.log('❓ 문제 링크 상품 (ID:', r2.productId, ')');
  console.log('  이미지:', m2.img || '❌ 없음');
  console.log('  제목:', m2.title || '❌ 없음');
  console.log('  가격:', m2.price || '없음');
  console.log('');

  // DB에서 해당 상품 등록 상태 확인
  console.log('=== DB 등록 데이터 확인 ===');
  const https2 = require('https');
  const dbReq = new Promise((resolve) => {
    https2.get('https://fishing-go-backend.onrender.com/api/shop/manual', (r) => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => {
        try {
          const items = JSON.parse(d);
          console.log('DB 등록 상품 수:', items.length);
          items.forEach((item, i) => {
            console.log(`  [${i+1}] source:${item.source} | shortUrl:${(item.shortUrl||'').slice(0,60)} | imageUrl:${(item.imageUrl||'없음').slice(0,60)} | name:${(item.productName||'없음').slice(0,30)}`);
          });
          resolve();
        } catch { console.log('DB 조회 실패:', d.slice(0,100)); resolve(); }
      });
    }).on('error', e => { console.log('DB 오류:', e.message); resolve(); });
  });
  await dbReq;
}

main().catch(console.error);
