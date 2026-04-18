/**
 * coupangService.js - 쿠팡 파트너스 Open API 연동 모듈
 *
 * [인증 방식]
 * - HMAC-SHA256 서명 기반 인증
 * - Header: Authorization: CEA algorithm=HmacSHA256, access-key={key}, signed-date={datetime}, signature={sig}
 *
 * [실제 키 발급 후 .env에 추가할 항목]
 * COUPANG_ACCESS_KEY=your_access_key_here
 * COUPANG_SECRET_KEY=your_secret_key_here
 * COUPANG_PARTNERS_ID=your_partners_id (예: AF3563639)
 */

const crypto = require('crypto');
const axios  = require('axios');

const COUPANG_BASE_URL  = 'https://api-gateway.coupang.com';
const ACCESS_KEY  = process.env.COUPANG_ACCESS_KEY  || 'TEST_ACCESS_KEY';
const SECRET_KEY  = process.env.COUPANG_SECRET_KEY  || 'TEST_SECRET_KEY';
const PARTNERS_ID = process.env.COUPANG_PARTNERS_ID || 'AF3563639';

// 실제 키인지 판단 (TEST_ 접두어면 목업 모드)
const IS_TEST_MODE = ACCESS_KEY.startsWith('TEST_') || SECRET_KEY.startsWith('TEST_');

// ─── HMAC-SHA256 서명 생성 ────────────────────────────────────────────────────
function generateHmacSignature(method, path, query, datetime) {
  const messageToSign = `${datetime}${method}${path}${query ? '?' + query : ''}`;
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(messageToSign)
    .digest('hex');
}

function generateAuthHeader(method, urlPath, queryString = '') {
  const datetime = new Date().toISOString().replace(/\..*$/, '').replace('T', 'T') ;
  const signature = generateHmacSignature(method, urlPath, queryString, datetime);
  return {
    Authorization: `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${datetime}, signature=${signature}`,
    'Content-Type': 'application/json;charset=UTF-8',
  };
}

// ─── 목업 데이터 (실제 키 발급 전 테스트용) ───────────────────────────────────
const MOCK_PRODUCTS = {
  '낚시용품': [
    { productId: 'm001', productName: '[다이와] 레브로스 LT 스피닝릴 2500', productPrice: 89000, discountRate: 12, productImage: 'https://images.unsplash.com/photo-1544551763-8dd44758c2dd?w=300&q=80', coupangUrl: `https://www.coupang.com/np/search?q=스피닝릴&lptag=${PARTNERS_ID}`, badge: '낚시GO 추천' },
    { productId: 'm002', productName: '[시마노] 사이클론 카본 루어대 2-210', productPrice: 134000, discountRate: 8, productImage: 'https://images.unsplash.com/photo-1520110120835-c96534a4c984?w=300&q=80', coupangUrl: `https://www.coupang.com/np/search?q=루어낚시대&lptag=${PARTNERS_ID}`, badge: '인기 급상승' },
    { productId: 'm003', productName: '[요즈리] 크리스탈 미노우 에기 5개 세트', productPrice: 18500, discountRate: 30, productImage: 'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=300&q=80', coupangUrl: `https://www.coupang.com/np/search?q=에기세트&lptag=${PARTNERS_ID}`, badge: '할인 특가' },
    { productId: 'm004', productName: '[바낙스] 제우스 파워 원투낚시대 4.2m', productPrice: 67000, discountRate: 0, productImage: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=300&q=80', coupangUrl: `https://www.coupang.com/np/search?q=원투낚시대&lptag=${PARTNERS_ID}`, badge: '낚시GO 추천' },
    { productId: 'm005', productName: '[YGK] 지크레이 오드라이브 PE라인 1.0호 200m', productPrice: 29800, discountRate: 5, productImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=300&q=80', coupangUrl: `https://www.coupang.com/np/search?q=PE라인&lptag=${PARTNERS_ID}`, badge: '많이 찾는' },
    { productId: 'm006', productName: '[콜맨] 캠핑 폴딩 체어 낚시 의자', productPrice: 45000, discountRate: 20, productImage: 'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=300&q=80', coupangUrl: `https://www.coupang.com/np/search?q=낚시의자&lptag=${PARTNERS_ID}`, badge: '할인 특가' },
  ],
  '루어': [
    { productId: 'm007', productName: '[잭슨] 아ントレ 루어 셋트 (5색)', productPrice: 22000, discountRate: 15, productImage: 'https://images.unsplash.com/photo-1544551763-8dd44758c2dd?w=300&q=80', coupangUrl: `https://www.coupang.com/np/search?q=루어세트&lptag=${PARTNERS_ID}`, badge: '루어 BEST' },
    { productId: 'm008', productName: '[메가배스] 비전 원텐 미노우 14cm', productPrice: 31500, discountRate: 0, productImage: 'https://images.unsplash.com/photo-1502673530728-f79b4cab31b1?w=300&q=80', coupangUrl: `https://www.coupang.com/np/search?q=미노우&lptag=${PARTNERS_ID}`, badge: '낚시GO 추천' },
  ],
  '에기': [
    { productId: 'm009', productName: '[요즈리] 에기왕 Q LIVE 3.5호 4개 세트', productPrice: 41000, discountRate: 22, productImage: 'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=300&q=80', coupangUrl: `https://www.coupang.com/np/search?q=에기왕&lptag=${PARTNERS_ID}`, badge: '에깅 BEST' },
    { productId: 'm010', productName: '[클라리스] 오징어 에기 10색 혼합 세트', productPrice: 15000, discountRate: 30, productImage: 'https://images.unsplash.com/photo-1520110120835-c96534a4c984?w=300&q=80', coupangUrl: `https://www.coupang.com/np/search?q=에기세트&lptag=${PARTNERS_ID}`, badge: '가성비 갑' },
  ],
};

function getMockProducts(keyword = '낚시용품') {
  // 키워드에 맞는 카테고리 찾기
  for (const [cat, items] of Object.entries(MOCK_PRODUCTS)) {
    if (keyword.includes(cat)) return items;
  }
  return MOCK_PRODUCTS['낚시용품'];
}

// ─── 실제 쿠팡 파트너스 API 호출 ─────────────────────────────────────────────
async function searchCoupang(keyword, limit = 6) {
  if (IS_TEST_MODE) {
    console.log(`[쿠팡 목업 모드] "${keyword}" 검색 (실제 키 발급 후 자동으로 실제 API 호환)`);
    return getMockProducts(keyword);
  }

  try {
    const path    = '/v2/providers/affiliate_open_api/apis/openapi/v1/products/search';
    const query   = `keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
    const headers = generateAuthHeader('GET', path, query);

    const response = await axios.get(`${COUPANG_BASE_URL}${path}?${query}`, { headers, timeout: 8000 });
    
    const items = response.data?.data?.productData || [];
    return items.map(item => ({
      productId:    item.productId,
      productName:  item.productName,
      productPrice: item.productPrice,
      discountRate: item.discountRate || 0,
      productImage: item.productImage,
      coupangUrl:   item.productUrl + `&lptag=${PARTNERS_ID}`,
      badge:        item.isRocket ? '로켓배송' : '낚시GO 추천',
    }));
  } catch (err) {
    console.error('[쿠팡 API 오류] 목업 데이터로 전환:', err.message);
    return getMockProducts(keyword); // 실제 API 실패 시 목업 fallback
  }
}

// ─── Shop 탭용: 카테고리별 추천 상품 목록 ────────────────────────────────────
async function getRecommendedProducts(category = '낚시용품') {
  return searchCoupang(category + ' 낚시', 6);
}

// ─── 미디어 탭용: 영상 카테고리 기반 연관 상품 ───────────────────────────────
async function getProductsByVideoCategory(category) {
  const keywordMap = {
    '루어':  '루어낚시 장비',
    '찌낚시': '찌낚시 채비',
    '원투':  '원투낚시대',
    '선상':  '선상낚시 용품',
    '에깅':  '에기',
    '최신':  '낚시용품',
    '전체':  '낚시용품',
  };
  const keyword = keywordMap[category] || '낚시용품';
  return searchCoupang(keyword, 3);
}

module.exports = {
  searchCoupang,
  getRecommendedProducts,
  getProductsByVideoCategory,
  IS_TEST_MODE,
  PARTNERS_ID,
};
