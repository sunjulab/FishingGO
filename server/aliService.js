/**
 * aliService.js - 알리익스프레스 어필리에이트 API 연동 모듈
 *
 * [API 발급 방법]
 * 1. https://portals.aliexpress.com 에서 어필리에이트 계정 가입
 * 2. https://open.aliexpress.com → App Management → Create App
 * 3. 발급된 App Key / App Secret을 .env에 저장:
 *    ALI_APP_KEY=your_app_key
 *    ALI_APP_SECRET=your_app_secret
 *    ALI_TRACKING_ID=your_tracking_id
 *
 * [수수료]
 * - 일반 상품: 3~9%
 * - 프로모션 특가 상품: 최대 50~90%
 * - 월 상한선: 없음 (쿠팡 3,000만 원 한도 보완)
 */

const crypto = require('crypto');
const axios  = require('axios');

const ALI_APP_KEY    = process.env.ALI_APP_KEY    || 'TEST_ALI_APP_KEY';
const ALI_APP_SECRET = process.env.ALI_APP_SECRET || 'TEST_ALI_APP_SECRET';
const ALI_TRACKING   = process.env.ALI_TRACKING_ID || '';

// 실제 키 없으면 목업 모드
const IS_ALI_TEST = ALI_APP_KEY.startsWith('TEST_') || ALI_APP_SECRET.startsWith('TEST_');

// 알리 API Gateway URL
const ALI_API_URL = 'https://api-sg.aliexpress.com/sync';

// ─── HMAC-MD5 서명 생성 (알리 방식) ──────────────────────────────────────────
function signAliRequest(params) {
  // 1. 파라미터 정렬 후 문자열화
  const sorted = Object.keys(params).sort().map(k => `${k}${params[k]}`).join('');
  // 2. Secret으로 양쪽 래핑 후 MD5
  const str = `${ALI_APP_SECRET}${sorted}${ALI_APP_SECRET}`;
  return crypto.createHash('md5').update(str).digest('hex').toUpperCase();
}

function buildParams(method, extraParams = {}) {
  const params = {
    method,
    app_key: ALI_APP_KEY,
    timestamp: String(Date.now()),
    sign_method: 'md5',
    v: '2.0',
    ...extraParams,
  };
  params.sign = signAliRequest(params);
  return params;
}

// ─── 목업 데이터 (알리 스타일 — 낚시 소모품 특화) ────────────────────────────
const ALI_MOCK_IMG = (id) => `https://picsum.photos/seed/ali_fishing${id}/300/300`;

const ALI_MOCK_PRODUCTS = {
  '낚시바늘': [
    { productId: 'a001', title: '낚시 바늘 혼합 세트 500개입 갈치 볼락 광어', salePrice: '2,800', originalPrice: '5,600', discount: '50%', imageUrl: ALI_MOCK_IMG(1), productUrl: 'https://www.aliexpress.com/item/1005006', commissionRate: '50%', badge: '⚡ 특가' },
    { productId: 'a002', title: '묶음 낚시 바늘 강화 5호~15호 믹스 200개', salePrice: '1,900', originalPrice: '3,800', discount: '50%', imageUrl: ALI_MOCK_IMG(2), productUrl: 'https://www.aliexpress.com/item/1005007', commissionRate: '50%', badge: '🔥 인기' },
  ],
  '봉돌': [
    { productId: 'a003', title: '낚시 봉돌 무게별 세트 10g~50g 20개입', salePrice: '3,200', originalPrice: '6,000', discount: '47%', imageUrl: ALI_MOCK_IMG(3), productUrl: 'https://www.aliexpress.com/item/1005008', commissionRate: '45%', badge: '💰 가성비' },
    { productId: 'a004', title: '배낚시 봉돌 납추 30g 50g 100g 각 5개', salePrice: '4,500', originalPrice: '9,000', discount: '50%', imageUrl: ALI_MOCK_IMG(4), productUrl: 'https://www.aliexpress.com/item/1005009', commissionRate: '50%', badge: '⚡ 특가' },
  ],
  '루어': [
    { productId: 'a005', title: '소프트 웜 루어 15종 믹스 세트 갈치 우럭 볼락', salePrice: '4,200', originalPrice: '12,000', discount: '65%', imageUrl: ALI_MOCK_IMG(5), productUrl: 'https://www.aliexpress.com/item/1005010', commissionRate: '60%', badge: '🔥 최다판매' },
    { productId: 'a006', title: '메탈지그 10~40g 5색 믹스 선상낚시 광어', salePrice: '5,800', originalPrice: '14,000', discount: '59%', imageUrl: ALI_MOCK_IMG(6), productUrl: 'https://www.aliexpress.com/item/1005011', commissionRate: '55%', badge: '⭐ 추천' },
  ],
  '낚시줄': [
    { productId: 'a007', title: 'PE 합사 낚시줄 0.6~4호 150m 바다낚시 전용', salePrice: '6,900', originalPrice: '18,000', discount: '62%', imageUrl: ALI_MOCK_IMG(7), productUrl: 'https://www.aliexpress.com/item/1005012', commissionRate: '55%', badge: '💰 가성비' },
    { productId: 'a008', title: '카본 목줄 50m 민물 바다 겸용 2호~8호', salePrice: '3,100', originalPrice: '7,000', discount: '56%', imageUrl: ALI_MOCK_IMG(8), productUrl: 'https://www.aliexpress.com/item/1005013', commissionRate: '50%', badge: '⚡ 특가' },
  ],
  '채비': [
    { productId: 'a009', title: '갯바위 채비 완제품 감성돔 참돔 벵에돔 5세트', salePrice: '7,500', originalPrice: '20,000', discount: '63%', imageUrl: ALI_MOCK_IMG(9), productUrl: 'https://www.aliexpress.com/item/1005014', commissionRate: '60%', badge: '🔥 인기' },
    { productId: 'a010', title: '원투낚시 채비 세트 10조 황어 보리멸 도다리', salePrice: '5,200', originalPrice: '13,000', discount: '60%', imageUrl: ALI_MOCK_IMG(10), productUrl: 'https://www.aliexpress.com/item/1005015', commissionRate: '55%', badge: '⭐ 추천' },
  ],
  '소모품': [
    { productId: 'a011', title: '낚시 전용 집어등 LED 수중등 3W 야광 루어', salePrice: '3,800', originalPrice: '9,000', discount: '58%', imageUrl: ALI_MOCK_IMG(11), productUrl: 'https://www.aliexpress.com/item/1005016', commissionRate: '50%', badge: '💰 가성비' },
    { productId: 'a012', title: '야광 찌 케미 야간 낚시 형광 찌톱 50개입', salePrice: '2,200', originalPrice: '5,500', discount: '60%', imageUrl: ALI_MOCK_IMG(12), productUrl: 'https://www.aliexpress.com/item/1005017', commissionRate: '55%', badge: '⚡ 특가' },
    { productId: 'a013', title: '낚시바늘 묶음기 자동 훅 타이어 바늘 묶기', salePrice: '4,100', originalPrice: '9,800', discount: '58%', imageUrl: ALI_MOCK_IMG(13), productUrl: 'https://www.aliexpress.com/item/1005018', commissionRate: '50%', badge: '🔥 인기' },
    { productId: 'a014', title: '낚시 스냅 도래 세트 민물 바다 겸용 200개', salePrice: '1,800', originalPrice: '4,200', discount: '57%', imageUrl: ALI_MOCK_IMG(14), productUrl: 'https://www.aliexpress.com/item/1005019', commissionRate: '50%', badge: '💰 가성비' },
  ],
};

function getMockAliProducts(keyword = '소모품') {
  if (ALI_MOCK_PRODUCTS[keyword]) return ALI_MOCK_PRODUCTS[keyword];
  for (const [cat, items] of Object.entries(ALI_MOCK_PRODUCTS)) {
    if (keyword.includes(cat) || cat.includes(keyword)) return items;
  }
  return ALI_MOCK_PRODUCTS['소모품'];
}

// ─── 어필리에이트 링크 생성 ────────────────────────────────────────────────────
function buildAliAffiliateUrl(productUrl) {
  if (!ALI_TRACKING) return productUrl;
  // 알리 어필리에이트 링크: URL에 aff_fcid, aff_platform 파라미터 추가
  const sep = productUrl.includes('?') ? '&' : '?';
  return `${productUrl}${sep}aff_fcid=${ALI_TRACKING}&aff_platform=portals-tool&sk=_dTLBBxr`;
}

// ─── 실제 알리 API 호출 ────────────────────────────────────────────────────────
async function searchAliExpress(keyword, limit = 6) {
  if (IS_ALI_TEST) {
    if (process.env.NODE_ENV !== 'production') {
      (global.logger?.info || console.info)(`[알리 목업 모드] "${keyword}" 검색`);
    }
    return getMockAliProducts(keyword);
  }

  try {
    // aliexpress.affiliate.product.query API 호출
    const params = buildParams('aliexpress.affiliate.product.query', {
      keywords: keyword,
      page_size: String(limit),
      page_no: '1',
      tracking_id: ALI_TRACKING,
      target_currency: 'KRW',
      target_language: 'KO',
      sort: 'SALE_PRICE_ASC',
    });

    const queryStr = new URLSearchParams(params).toString();
    const response = await axios.get(`${ALI_API_URL}?${queryStr}`, { timeout: 8000 });

    const result = response.data?.aliexpress_affiliate_product_query_response?.resp_result;
    if (result?.resp_code !== 200) throw new Error(`알리 API 오류: ${result?.resp_msg}`);

    const items = result?.result?.products?.product || [];
    return items.map(item => ({
      productId:   String(item.product_id),
      title:       item.product_title,
      salePrice:   Number(item.app_sale_price || item.sale_price).toLocaleString('ko-KR'),
      originalPrice: Number(item.original_price).toLocaleString('ko-KR'),
      discount:    `${Math.round((1 - item.app_sale_price / item.original_price) * 100)}%`,
      imageUrl:    item.product_main_image_url,
      productUrl:  buildAliAffiliateUrl(item.product_detail_url),
      commissionRate: `${item.commission_rate || 5}%`,
      badge:       Number(item.commission_rate) >= 30 ? '⚡ 특가' : '💰 가성비',
    }));
  } catch (err) {
    (global.logger?.warn || (() => {}))(`[알리 API 오류]: ${err.message}`);
    return getMockAliProducts(keyword);
  }
}

// ─── 카테고리 키워드 매핑 ─────────────────────────────────────────────────────
const ALI_KEYWORD_MAP = {
  '낚시바늘':  '낚시바늘',
  '봉돌':     '봉돌',
  '루어':     '루어',
  '소프트웜':  '소프트웜',
  '낚시줄':   '낚시줄',
  '채비':     '채비',
  '집어등':   '소모품',
  '기본':     '소모품',
};

async function getAliProducts(category = '소모품') {
  const keyword = ALI_KEYWORD_MAP[category] || category;
  return searchAliExpress(keyword, 6);
}

// ─── 프로모션 특가 상품 (수수료 50%+ 상품만) ──────────────────────────────────
async function getAliPromoProducts(limit = 4) {
  if (IS_ALI_TEST) {
    // 목업: 높은 수수료 상품만 필터
    const allMock = Object.values(ALI_MOCK_PRODUCTS).flat();
    return allMock
      .filter(p => parseInt(p.commissionRate) >= 50)
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  }

  try {
    const params = buildParams('aliexpress.affiliate.hotproduct.query', {
      keywords: '낚시',
      page_size: String(limit),
      page_no: '1',
      tracking_id: ALI_TRACKING,
      target_currency: 'KRW',
      target_language: 'KO',
      min_commission_rate: '30',
    });
    const queryStr = new URLSearchParams(params).toString();
    const response = await axios.get(`${ALI_API_URL}?${queryStr}`, { timeout: 8000 });
    const result = response.data?.aliexpress_affiliate_hotproduct_query_response?.resp_result;
    const items = result?.result?.products?.product || [];
    return items.map(item => ({
      productId:    String(item.product_id),
      title:        item.product_title,
      salePrice:    Number(item.app_sale_price || item.sale_price).toLocaleString('ko-KR'),
      originalPrice: Number(item.original_price).toLocaleString('ko-KR'),
      discount:     `${Math.round((1 - item.app_sale_price / item.original_price) * 100)}%`,
      imageUrl:     item.product_main_image_url,
      productUrl:   buildAliAffiliateUrl(item.product_detail_url),
      commissionRate: `${item.commission_rate || 30}%`,
      badge:        '🔥 오늘 특가',
    }));
  } catch (err) {
    (global.logger?.warn || (() => {}))(`[알리 특가 API 오류]: ${err.message}`);
    return getAliPromoProducts.mock(limit);
  }
}
// 목업 fallback
getAliPromoProducts.mock = (limit = 4) => {
  const all = Object.values(ALI_MOCK_PRODUCTS).flat();
  return all.filter(p => parseInt(p.commissionRate) >= 50).slice(0, limit);
};

module.exports = {
  searchAliExpress,
  getAliProducts,
  getAliPromoProducts,
  IS_ALI_TEST,
};
