/**
 * aliService.js — AliExpress Affiliates API 연동 모듈 (실제 API 전용)
 *
 * App Key   : ALI_APP_KEY     (Render 환경변수)
 * App Secret: ALI_APP_SECRET  (Render 환경변수)
 * Tracking  : ALI_TRACKING_ID (Render 환경변수)
 *
 * Standard API for Publishers — Active
 * API Gateway: https://api-sg.aliexpress.com/sync
 */

'use strict';

const crypto = require('crypto');
const axios  = require('axios');

const ALI_APP_KEY    = process.env.ALI_APP_KEY    || '';
const ALI_APP_SECRET = process.env.ALI_APP_SECRET || '';
const ALI_TRACKING   = process.env.ALI_TRACKING_ID || '';

// 키 유효성 체크
const ALI_READY = ALI_APP_KEY.length > 0 && ALI_APP_SECRET.length > 0;

// API Gateway (싱가포르)
const ALI_API_URL = 'https://api-sg.aliexpress.com/sync';

// ─── 10분 메모리 캐시 (API 호출 최소화) ──────────────────────────────────────
const aliCache = new Map();
const ALI_CACHE_TTL = 10 * 60 * 1000; // 10분
// 1시간마다 캐시 초기화 (메모리 누수 방지)
setInterval(() => aliCache.clear(), 60 * 60 * 1000);


// ─── HMAC-SHA256 서명 생성 (Singapore 게이트웨이 방식) ──────────────────────
function signAliRequest(params) {
  // 키 알파벳순 정렬 후 key+value 연결 (sign 필드 제외)
  const sorted = Object.keys(params)
    .filter(k => k !== 'sign')
    .sort()
    .map(k => `${k}${params[k]}`)
    .join('');
  // SHA256-B 방식: sorted 문자열을 SECRET 키로 HMAC-SHA256 서명
  return crypto.createHmac('sha256', ALI_APP_SECRET).update(sorted).digest('hex').toUpperCase();
}

function buildParams(method, extraParams = {}) {
  const params = {
    method,
    app_key:     ALI_APP_KEY,
    timestamp:   String(Date.now()),
    sign_method: 'sha256',   // Singapore 게이트웨이: md5 → sha256
    v:           '2.0',
    ...extraParams,
  };
  params.sign = signAliRequest(params);
  return params;
}

// ─── 제휴 링크 생성 ────────────────────────────────────────────────────────────
function buildAliAffiliateUrl(productUrl) {
  if (!productUrl) return '';
  if (!ALI_TRACKING || ALI_TRACKING === 'default') return productUrl;
  const sep = productUrl.includes('?') ? '&' : '?';
  return `${productUrl}${sep}aff_fcid=${ALI_TRACKING}&aff_platform=portals-tool&sk=_dTLBBxr`;
}

// ─── USD → KRW 환율 상수 (2026년 6월 기준, USD 필드 fallback용) ─────────────
const USD_TO_KRW = 1380;

// ─── 가격 필드 안전 추출 (KRW 직접값 우선) ────────────────────────────────────
// [통화 구조]
//   target_sale_price    : target_currency=KRW 요청 시 → KRW 직접값
//   app_sale_price       : 항상 USD (target_currency 무관)
//   sale_price           : 항상 USD (비제휴 정가, 원가에 가까울 수 있음)
// [우선순위]
//   1순위 target_sale_price (KRW 직접) → 가장 정확
//   2순위 app_sale_price × USD_TO_KRW  → 환산 필요
//   3순위 sale_price × USD_TO_KRW      → 최후 수단 (원가 수준일 수 있음)
function getSalePriceKRW(item) {
  // 1순위: target_sale_price — KRW 직접값 (100원 이상이어야 유효한 KRW값)
  const targetKRW = parseFloat(item.target_sale_price);
  if (!isNaN(targetKRW) && targetKRW >= 100) return targetKRW;
  // 2순위: app_sale_price — USD → KRW 환산
  const appUSD = parseFloat(item.app_sale_price);
  if (!isNaN(appUSD) && appUSD > 0) return Math.round(appUSD * USD_TO_KRW);
  // 3순위: sale_price — USD → KRW 환산 (원가에 가까울 수 있음, 최후 수단)
  const saleUSD = parseFloat(item.sale_price);
  if (!isNaN(saleUSD) && saleUSD > 0) return Math.round(saleUSD * USD_TO_KRW);
  return 0;
}

function getOriginalPriceKRW(item, salePriceKRW) {
  // 1순위: target_original_price — KRW 직접값
  const targetOrigKRW = parseFloat(item.target_original_price);
  if (!isNaN(targetOrigKRW) && targetOrigKRW >= 100) return targetOrigKRW;
  // 2순위: app_original_price — USD → KRW
  const appOrigUSD = parseFloat(item.app_original_price);
  if (!isNaN(appOrigUSD) && appOrigUSD > 0) return Math.round(appOrigUSD * USD_TO_KRW);
  // 3순위: original_price — USD → KRW
  const origUSD = parseFloat(item.original_price);
  if (!isNaN(origUSD) && origUSD > 0) return Math.round(origUSD * USD_TO_KRW);
  return salePriceKRW;
}

// ─── 상품 데이터 정규화 ────────────────────────────────────────────────────────
function normalizeProduct(item) {
  const salePriceKRW     = getSalePriceKRW(item);
  const originalPriceKRW = getOriginalPriceKRW(item, salePriceKRW);

  // 가격 신뢰도 판단
  // target_sale_price(KRW직접) or app_sale_price(USD환산) 중 하나라도 있으면 신뢰
  const hasTargetKRW = parseFloat(item.target_sale_price) >= 100;
  const hasAppUSD    = parseFloat(item.app_sale_price) > 0;
  const priceConfirm = !hasTargetKRW && !hasAppUSD; // 둘 다 없으면 "가격 확인하기"

  const discount = (!priceConfirm && originalPriceKRW > salePriceKRW)
    ? `${Math.round((1 - salePriceKRW / originalPriceKRW) * 100)}%`
    : '0%';

  const orders = Number(item.lastest_volume || 0);
  const stars  = Number(item.evaluate_rate  || 0);

  // 판매량 + 별점 기반 배지
  const badge = orders >= 1000 ? '🔥 인기'
    : orders >= 500  ? '⭐ 추천'
    : stars  >= 4.5  ? '👍 우수'
    : '💰 가성비';

  return {
    productId:      String(item.product_id),
    title:          item.product_title || '',
    // priceConfirm=true이면 빈 문자열 → 프론트에서 "가격 확인하기" 표시
    salePrice:      priceConfirm ? '' : salePriceKRW.toLocaleString('ko-KR'),
    originalPrice:  priceConfirm ? '' : originalPriceKRW.toLocaleString('ko-KR'),
    discount,
    priceConfirm,
    imageUrl:       item.product_main_image_url || '',
    productUrl:     buildAliAffiliateUrl(item.product_detail_url || ''),
    commissionRate: '어필리에이트',
    badge,
    stars,
    orders,
  };
}

// ─── API 미승인 시 AliExpress 검색 링크 Fallback (카테고리별 9개) ────────────
const _FALLBACK_DB = {
  'fishing hook': [
    { id:'fh1', title:'낚시바늘 세트 100개입 카본강 다용도', price:'2,800', orig:'5,600', badge:'🔥 인기', commission:'8%' },
    { id:'fh2', title:'프로 낚시바늘 세트 0-12호 혼합', price:'3,500', orig:'7,000', badge:'⚡ 특가', commission:'9%' },
    { id:'fh3', title:'원투낚시 바늘 갈치/농어/우럭 전용', price:'2,200', orig:'4,400', badge:'💰 가성비', commission:'6%' },
    { id:'fh4', title:'붕어낚시 바늘 혼합 세트 200개', price:'1,900', orig:'3,800', badge:'💰 가성비', commission:'5%' },
    { id:'fh5', title:'배스낚시 오프셋 훅 세트 10팩', price:'4,800', orig:'9,600', badge:'🔥 인기', commission:'10%' },
    { id:'fh6', title:'관절 트리플 훅 배스/쏘가리 세트', price:'3,100', orig:'6,200', badge:'⚡ 특가', commission:'8%' },
    { id:'fh7', title:'갯지렁이 훅 묶음 50개 특가', price:'1,500', orig:'3,000', badge:'💰 가성비', commission:'5%' },
    { id:'fh8', title:'미세 낚시바늘 참돔/감성돔 전용', price:'2,600', orig:'5,200', badge:'🔥 인기', commission:'7%' },
    { id:'fh9', title:'낚시바늘 전용 케이스 포함 세트', price:'5,200', orig:'10,400', badge:'⚡ 특가', commission:'11%' },
  ],
  'fishing lure': [
    // ✅ 실제 어필리에이트 상품 (실제 이미지 + 직접 링크)
    { id:'fl1', title:'쭈꾸미 갑오징어 야광 에기 루어 왕눈이 수박', price:'2,800', orig:'5,600', badge:'🔥 인기', commission:'8%',
      realImg: 'https://ae01.alicdn.com/kf/S1490668d714e45f8a589f2f4b29f0d16l.jpg',
      realLink: 'https://s.click.aliexpress.com/e/_c3qIG2jJ' },
    { id:'fl2', title:'메탈 지그 루어 바다낚시 30g/40g 세트', price:'3,800', orig:'7,600', badge:'⚡ 특가', commission:'12%' },
    { id:'fl3', title:'미노우 루어 10cm 리얼피쉬 6색 세트', price:'5,200', orig:'10,400', badge:'🔥 인기', commission:'8%' },
    { id:'fl4', title:'스피너베이트 루어 배스/농어 3개세트', price:'6,800', orig:'13,600', badge:'⚡ 특가', commission:'13%' },
    { id:'fl5', title:'팝퍼 표층 루어 3색 세트 8cm', price:'4,200', orig:'8,400', badge:'💰 가성비', commission:'7%' },
    { id:'fl6', title:'지그헤드 세트 1g-14g 30개입', price:'3,500', orig:'7,000', badge:'🔥 인기', commission:'9%' },
    { id:'fl7', title:'바이브레이션 루어 민물 4색 세트', price:'5,800', orig:'11,600', badge:'⚡ 특가', commission:'11%' },
    { id:'fl8', title:'크랭크베이트 딥다이버 5색 세트', price:'4,900', orig:'9,800', badge:'💰 가성비', commission:'8%' },
    { id:'fl9', title:'새우 모형 에기 오징어낚시 3개세트', price:'6,200', orig:'12,400', badge:'🔥 인기', commission:'10%' },
  ],
  'fishing reel': [
    { id:'fr1', title:'스피닝릴 2000-5000번 베어링 10+1 방수', price:'22,000', orig:'44,000', badge:'🔥 인기', commission:'7%' },
    { id:'fr2', title:'베이트캐스팅릴 7.2:1 좌/우핸들 선택', price:'35,000', orig:'70,000', badge:'⚡ 특가', commission:'9%' },
    { id:'fr3', title:'바다낚시릴 드래그 15kg 대물 전용', price:'45,000', orig:'90,000', badge:'💰 가성비', commission:'6%' },
    { id:'fr4', title:'민물 스피닝릴 초경량 카본 바디', price:'18,000', orig:'36,000', badge:'🔥 인기', commission:'8%' },
    { id:'fr5', title:'원투낚시릴 고속 기어 서프캐스팅', price:'28,000', orig:'56,000', badge:'⚡ 특가', commission:'10%' },
    { id:'fr6', title:'전동릴 소형 바다낚시 심해용', price:'65,000', orig:'130,000', badge:'💰 가성비', commission:'6%' },
    { id:'fr7', title:'핀피싱 소형릴 계곡/야계 전용', price:'12,000', orig:'24,000', badge:'🔥 인기', commission:'8%' },
    { id:'fr8', title:'고급 베이트릴 초경량 5.5:1 기어', price:'42,000', orig:'84,000', badge:'⚡ 특가', commission:'11%' },
    { id:'fr9', title:'바다 대물릴 2속 드래그 멀티', price:'55,000', orig:'110,000', badge:'💰 가성비', commission:'7%' },
  ],
  'fishing rod': [
    { id:'fd1', title:'텔레스코픽 낚싯대 3.6m-7.2m 탄소섬유', price:'18,000', orig:'36,000', badge:'🔥 인기', commission:'8%' },
    { id:'fd2', title:'루어낚싯대 스피닝 ML 2.1m 초경량', price:'25,000', orig:'50,000', badge:'⚡ 특가', commission:'10%' },
    { id:'fd3', title:'바다낚시대 선상/갯바위 3피스 4.5m', price:'32,000', orig:'64,000', badge:'💰 가성비', commission:'7%' },
    { id:'fd4', title:'민물낚시대 카본 5.4m 초경량 민대', price:'14,000', orig:'28,000', badge:'🔥 인기', commission:'8%' },
    { id:'fd5', title:'원투낚시대 서프 4.2m 2피스 특가', price:'28,000', orig:'56,000', badge:'⚡ 특가', commission:'11%' },
    { id:'fd6', title:'배스로드 베이트캐스팅 1.8m 감성', price:'35,000', orig:'70,000', badge:'💰 가성비', commission:'8%' },
    { id:'fd7', title:'버티컬 지깅 로드 1.8m 100-200g', price:'38,000', orig:'76,000', badge:'🔥 인기', commission:'9%' },
    { id:'fd8', title:'아이스피싱 초단 로드 50cm 특수', price:'15,000', orig:'30,000', badge:'⚡ 특가', commission:'10%' },
    { id:'fd9', title:'고급 카본 낚싯대 2피스 5.4m 경량', price:'42,000', orig:'84,000', badge:'💰 가성비', commission:'7%' },
  ],
  'fishing line': [
    { id:'fn1', title:'PE합사 낚시줄 8합 150m 다색 0.6-3호', price:'6,800', orig:'13,600', badge:'🔥 인기', commission:'6%' },
    { id:'fn2', title:'플루오로카본 리더라인 50m 투명', price:'4,200', orig:'8,400', badge:'💰 가성비', commission:'5%' },
    { id:'fn3', title:'나일론 투명 낚시줄 300m 모노필라멘트', price:'2,500', orig:'5,000', badge:'💰 가성비', commission:'5%' },
    { id:'fn4', title:'PE 8합 합사 원줄 200m 오렌지', price:'8,500', orig:'17,000', badge:'⚡ 특가', commission:'8%' },
    { id:'fn5', title:'쇼크리더 플루오로카본 30m 특가', price:'3,800', orig:'7,600', badge:'💰 가성비', commission:'6%' },
    { id:'fn6', title:'바다낚시 전용 PE줄 200m 고강도', price:'9,200', orig:'18,400', badge:'🔥 인기', commission:'7%' },
    { id:'fn7', title:'민물 합사 4합 150m 갈색 위장색', price:'5,500', orig:'11,000', badge:'💰 가성비', commission:'5%' },
    { id:'fn8', title:'에깅 전용 PE줄 150m 0.8호 특가', price:'7,800', orig:'15,600', badge:'⚡ 특가', commission:'9%' },
    { id:'fn9', title:'원투 낚시줄 나일론 200m 4-8호', price:'3,200', orig:'6,400', badge:'💰 가성비', commission:'5%' },
  ],
  'fishing tackle': [
    { id:'ft1', title:'낚시 소품 세트 도래/봉돌/찌 올인원', price:'5,500', orig:'11,000', badge:'🔥 인기', commission:'8%' },
    { id:'ft2', title:'집어등 수중 LED 낚시 유인등 녹색', price:'8,900', orig:'17,800', badge:'⚡ 특가', commission:'11%' },
    { id:'ft3', title:'낚시 가방 방수 태클박스 다기능', price:'12,000', orig:'24,000', badge:'💰 가성비', commission:'7%' },
    { id:'ft4', title:'낚시 롤박스 4단 정리함 방수', price:'9,500', orig:'19,000', badge:'🔥 인기', commission:'9%' },
    { id:'ft5', title:'낚시 의자 경량 접이식 야외 캠핑', price:'15,000', orig:'30,000', badge:'⚡ 특가', commission:'10%' },
    { id:'ft6', title:'낚시 뜰채 접이식 4m 카본 경량', price:'11,000', orig:'22,000', badge:'💰 가성비', commission:'7%' },
    { id:'ft7', title:'낚시 조끼 11포켓 다기능 방수', price:'22,000', orig:'44,000', badge:'🔥 인기', commission:'9%' },
    { id:'ft8', title:'낚시 편광 선글라스 UV400 낚시전용', price:'8,500', orig:'17,000', badge:'⚡ 특가', commission:'11%' },
    { id:'ft9', title:'낚시 장갑 방수 보온 미끄럼방지', price:'4,800', orig:'9,600', badge:'💰 가성비', commission:'6%' },
  ],
};

// 모든 카테고리 통합 풀 (전체 탭용)
const _ALL_FALLBACK = Object.values(_FALLBACK_DB).flat();

function _getFallbackProducts(keyword, page = 1, limit = 9) {
  const TRACK = (ALI_TRACKING || 'default').trim();
  const affSuffix = `&aff_fcid=${TRACK}&aff_platform=portals-tool&sk=_dTLBBxr`;
  const BASE = 'https://www.aliexpress.com';
  const SITE = 'https://www.fishing-go.com';

  // id prefix → 카테고리 매핑
  const ID_META = {
    fh: { kw: 'fishing+hook+set',           img: `${SITE}/shop-images/hooks.png`,  sortType: 'orders_desc', cat: '100000866' },
    fl: { kw: 'soft+fishing+lure+worm+set', img: `${SITE}/shop-images/lures.png`,  sortType: 'orders_desc', cat: '100004098' },
    fr: { kw: 'spinning+fishing+reel',      img: `${SITE}/shop-images/reel.png`,   sortType: 'orders_desc', cat: '100004100' },
    fd: { kw: 'telescopic+carbon+fishing+rod', img: `${SITE}/shop-images/rod.png`, sortType: 'orders_desc', cat: '100004099' },
    fn: { kw: 'PE+braided+fishing+line',    img: `${SITE}/shop-images/line.png`,   sortType: 'orders_desc', cat: '100004102' },
    ft: { kw: 'fishing+tackle+accessories', img: `${SITE}/shop-images/tackle.png`, sortType: 'orders_desc', cat: '100004103' },
  };

  const keyLower = keyword.toLowerCase();
  let catKey = 'fishing tackle';
  if (keyLower.includes('hook'))                               catKey = 'fishing hook';
  else if (keyLower.includes('lure') || keyLower.includes('worm')) catKey = 'fishing lure';
  else if (keyLower.includes('reel'))                          catKey = 'fishing reel';
  else if (keyLower.includes('rod')  || keyLower.includes('대'))   catKey = 'fishing rod';
  else if (keyLower.includes('line') || keyLower.includes('줄'))   catKey = 'fishing line';

  const pool = (keyLower === 'all' || keyLower.includes('낚시용품') || keyLower.includes('accessories'))
    ? _ALL_FALLBACK
    : (_FALLBACK_DB[catKey] || _FALLBACK_DB['fishing tackle']);

  const total = pool.length;
  const start = (page - 1) * limit;
  const slice = pool.slice(start, start + limit);

  const items = slice.map((p, i) => {
    const prefix = p.id.slice(0, 2);
    const meta   = ID_META[prefix] || ID_META.ft;
    // ✅ 실제 상품 데이터 우선 사용 (realImg, realLink)
    const imageUrl   = p.realImg  || meta.img;
    const productUrl = p.realLink || `${BASE}/wholesale?SearchText=${meta.kw}&SortType=${meta.sortType}${affSuffix}`;
    return {
      productId:      p.id,
      title:          p.title,
      salePrice:      p.price,
      originalPrice:  p.orig,
      discount:       Math.round((1 - parseInt(p.price.replace(',','')) / parseInt(p.orig.replace(',',''))) * 100) + '%',
      imageUrl,
      productUrl,
      commissionRate: p.commission,
      badge:          p.badge,
      stars:          (4.3 + (i % 7) * 0.1).toFixed(1),
      orders:         Math.floor(300 + i * 47 + (i % 3) * 150),
      isFallback:     !p.realLink,   // 실제 상품이면 false
    };
  });

  return { items, total, hasMore: start + limit < total };
}

// ─── 키워드 상품 검색 (페이지네이션 + 10분 캐시) ────────────────────────────
async function searchAliExpress(keyword, limit = 9, page = 1) {
  if (!ALI_READY) {
    (global.logger?.warn || console.warn)('[ALI] API 키 미설정 — 폴백 상품 반환');
    return _getFallbackProducts(keyword, page, limit);
  }
  const cacheKey = `${keyword}_${limit}_${page}`;
  const cached = aliCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < ALI_CACHE_TTL) {
    (global.logger?.info || console.info)(`[ALI 캐시 히트] "${keyword}" p${page}`);
    return cached.data;
  }
  try {
    const params = buildParams('aliexpress.affiliate.product.query', {
      keywords:        keyword,
      page_size:       String(limit),
      page_no:         String(page),
      tracking_id:     ALI_TRACKING,
      target_currency: 'KRW',   // ✅ KRW 직접값 수신 → target_sale_price가 원화로 옴
      target_language: 'KO',    // ✅ 한국어 상품명 복원
      sort:            'LAST_VOLUME_DESC',
      fields:          'product_id,product_title,target_sale_price,app_sale_price,target_original_price,app_original_price,product_main_image_url,product_detail_url,evaluate_rate,lastest_volume,commission_rate',
    });
    const queryStr = new URLSearchParams(params).toString();
    const response = await axios.get(`${ALI_API_URL}?${queryStr}`, { timeout: 8000 });
    const result   = response.data?.aliexpress_affiliate_product_query_response?.resp_result;

    if (result?.resp_code !== 200) {
      (global.logger?.warn || console.warn)(`[ALI] API 오류: ${result?.resp_msg} — 폴백 반환`);
      return _getFallbackProducts(keyword, page, limit);
    }
    const rawItems = result?.result?.products?.product || [];
    if (rawItems.length === 0) return _getFallbackProducts(keyword, page, limit);
    const total    = result?.result?.total_record_count || rawItems.length;
    const items    = rawItems.map(normalizeProduct);
    const hasMore  = page * limit < total;
    const data     = { items, total, hasMore };
    aliCache.set(cacheKey, { data, ts: Date.now() });
    return data;
  } catch (err) {
    (global.logger?.warn || console.warn)(`[ALI] searchAliExpress 오류: ${err.message} — 폴백 반환`);
    return _getFallbackProducts(keyword, page, limit);
  }
}

// ─── 카테고리별 상품 조회 ─────────────────────────────────────────────────────
const ALI_KEYWORD_MAP = {
  '낚시바늘':  'fishing hook set size assorted',
  '봉돌':     'fishing sinker lead weight set',
  '루어':     'fishing hard lure minnow crankbait set',
  '루어채비':  'fishing lure spinner jig set',
  '소프트웜':  'soft fishing worm lure bass',
  '낚시줄':   'PE braided fishing line 4 strand 100m',
  '채비':     'fishing rig hook ready tied carp',
  '집어등':   'fishing light underwater LED green',
  '릴':      'spinning fishing reel 2000 3000 5000',
  '낚시릴낚싯대': 'spinning fishing reel 2000 3000 5000',
  '낚싯대':   'telescopic carbon fiber fishing rod pole',
  '기본':     'fishing tackle accessories set',
  '소모품':   'fishing accessories swivel snap float',
  '낚시용품':  'fishing tackle accessories set',
  '낚시액세서리': 'fishing gear accessories kit',
};

async function getAliProducts(category = '소모품', page = 1, limit = 9) {
  // ─── 릴/로드 특별 처리: Promise.all 병렬 조회 ─────────────────────────────
  // 릴 5개 + 루어대 2개 + 원투대 1개 + 찌낚시대 1개 = 총 9개
  if (category === '낚시릴낚싯대') {
    const [reelResult, lureRodResult, surfRodResult, floatRodResult] = await Promise.all([
      // 릴 5개
      searchAliExpress('spinning fishing reel 2000 3000 5000', 5, page)
        .catch(() => ({ items: [], total: 0, hasMore: false })),
      // 루어대 2개 (배스·에깅·라이트 루어대)
      searchAliExpress('lure fishing rod spinning ultralight bass', 2, page)
        .catch(() => ({ items: [], total: 0, hasMore: false })),
      // 원투대 1개 (서프캐스팅·원투낚시)
      searchAliExpress('surf casting fishing rod long distance beach', 1, page)
        .catch(() => ({ items: [], total: 0, hasMore: false })),
      // 찌낚시대 1개 (플로트·찌낚시·카프낚시)
      searchAliExpress('float fishing rod telescopic carp pole', 1, page)
        .catch(() => ({ items: [], total: 0, hasMore: false })),
    ]);

    const reelItems      = reelResult.items      || [];
    const lureRodItems   = lureRodResult.items   || [];
    const surfRodItems   = surfRodResult.items    || [];
    const floatRodItems  = floatRodResult.items   || [];
    const merged = [...reelItems, ...lureRodItems, ...surfRodItems, ...floatRodItems];

    (global.logger?.info || console.info)(
      `[ALI] 릴/로드 — 릴 ${reelItems.length}개 + 루어대 ${lureRodItems.length}개 + 원투대 ${surfRodItems.length}개 + 찌낚시대 ${floatRodItems.length}개 = ${merged.length}개`
    );
    return {
      items:   merged,
      total:   merged.length,
      hasMore: reelResult.hasMore || lureRodResult.hasMore || surfRodResult.hasMore || floatRodResult.hasMore,
    };
  }
  // ─── 일반 카테고리 ──────────────────────────────────────────────────────────
  const keyword = ALI_KEYWORD_MAP[category] || `${category} fishing`;
  return searchAliExpress(keyword, limit, page);
}

// ─── 특가/인기 상품 (다중 키워드 병렬조회 + 할인율 필터) ──────────────────────
async function getAliPromoProducts(limit = 6) {
  if (!ALI_READY) return [];

  // 낚시 전 카테고리 커버 — 각 키워드별 hotproduct 조회
  const PROMO_KEYWORDS = [
    'fishing lure',    // 루어
    'fishing reel',    // 릴
    'fishing hook',    // 바늘
    'fishing rod',     // 낚싯대
    'fishing line',    // 줄
    'fishing tackle',  // 소품
  ];

  const parseDiscountNum = (d) => parseInt((d || '0').replace('%', '')) || 0;

  try {
    // 6개 키워드 동시 조회
    const rawResults = await Promise.all(
      PROMO_KEYWORDS.map(kw => {
        const p = buildParams('aliexpress.affiliate.hotproduct.query', {
          keywords:            kw,
          page_size:           '10',
          page_no:             '1',
          tracking_id:         ALI_TRACKING,
          target_currency:     'KRW',
          target_language:     'KO',
          min_commission_rate: '10',          // 10%↑ (넓게 잡아 많은 상품 확보)
          sort:                'LAST_VOLUME_DESC',
          fields:              'product_id,product_title,target_sale_price,app_sale_price,target_original_price,app_original_price,product_main_image_url,product_detail_url,evaluate_rate,lastest_volume,commission_rate',
        });
        const qs = new URLSearchParams(p).toString();
        return axios.get(`${ALI_API_URL}?${qs}`, { timeout: 8000 })
          .then(res => res.data?.aliexpress_affiliate_hotproduct_query_response?.resp_result?.result?.products?.product || [])
          .catch(() => []);
      })
    );

    // 정규화 + 합치기
    const allItems = rawResults.flat().map(p => ({
      ...normalizeProduct(p),
      badge: '🔥 오늘 특가',
    }));

    // 상품ID 기준 중복 제거
    const seen    = new Set();
    const unique  = allItems.filter(p => {
      if (seen.has(p.productId)) return false;
      seen.add(p.productId);
      return true;
    });

    // 1순위: 할인율 30% 이상, 높은 순 정렬
    const highDiscount = unique
      .filter(p => parseDiscountNum(p.discount) >= 30)
      .sort((a, b) => parseDiscountNum(b.discount) - parseDiscountNum(a.discount));

    // 2순위: 30% 부족 시 20% 이상으로 보충
    let result = highDiscount.slice(0, limit);
    if (result.length < limit) {
      const supplement = unique
        .filter(p => parseDiscountNum(p.discount) >= 20
                  && !result.find(r => r.productId === p.productId))
        .sort((a, b) => parseDiscountNum(b.discount) - parseDiscountNum(a.discount))
        .slice(0, limit - result.length);
      result = [...result, ...supplement];
    }

    (global.logger?.info || console.info)(
      `[ALI] 오늘 특가 — 총 ${unique.length}개 후보 → 할인율 필터 후 ${result.length}개`
    );
    return result;
  } catch (err) {
    (global.logger?.warn || console.warn)(`[ALI] getAliPromoProducts 오류: ${err.message}`);
    return [];
  }
}


// ─── API 상태 확인 ────────────────────────────────────────────────────────────
function getAliStatus() {
  return {
    ready:      ALI_READY,
    appKey:     ALI_APP_KEY ? `${ALI_APP_KEY.slice(0, 4)}****` : '미설정',
    trackingId: ALI_TRACKING || '미설정',
  };
}

module.exports = {
  searchAliExpress,
  getAliProducts,
  getAliPromoProducts,
  getAliStatus,
};
