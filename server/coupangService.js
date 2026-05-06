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
const PARTNERS_ID = process.env.COUPANG_PARTNERS_ID || ''; // ✅ BUG-57: 하드코딩 파트너스 ID 제거

// 실제 키인지 판단 (TEST_ 접두어면 목업 모드)
// ✅ 20TH-B2: 프로덕션 환경에서는 실 키 설정시에도 목업 모드 강제 진입 방지 — NODE_ENV=production이면 실 API 강제 사용
const IS_TEST_MODE = process.env.NODE_ENV !== 'production'
  && (ACCESS_KEY.startsWith('TEST_') || SECRET_KEY.startsWith('TEST_'));

// ─── HMAC-SHA256 서명 생성 ────────────────────────────────────────────────────
function generateHmacSignature(method, path, query, datetime) {
  const messageToSign = `${datetime}${method}${path}${query ? '?' + query : ''}`;
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(messageToSign)
    .digest('hex');
}

function generateAuthHeader(method, urlPath, queryString = '') {
  const datetime = new Date().toISOString().replace(/\..*$/, ''); // ✅ INFO-CS1: 불필요한 .replace('T','T') 제거
  const signature = generateHmacSignature(method, urlPath, queryString, datetime);
  return {
    Authorization: `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${datetime}, signature=${signature}`,
    'Content-Type': 'application/json;charset=UTF-8',
  };
}

// ─── 목업 데이터 (실제 키 발급 전 테스트용) ───────────────────────────────────
// ENH5-B4: Unsplash 이미지 → picsum.photos placeholder로 교체 (외부 서비스 정책 의존성 최소화)
const MOCK_IMG = (id) => `https://picsum.photos/seed/fishing${id}/300/200`;

// ✅ 14TH-C1: MOCK_PRODUCTS 카테고리 키를 Shop.jsx categories[].query와 일치하도록 확장
const MOCK_PRODUCTS = {
  '낚시용품': [
    { productId: 'm001', productName: '[다이와] 레브로스 LT 스피닝릴 2500', productPrice: 89000, discountRate: 12, productImage: MOCK_IMG(1), coupangUrl: `https://www.coupang.com/np/search?q=스피닝릴&lptag=${PARTNERS_ID}`, badge: '낚시GO 추천' },
    { productId: 'm002', productName: '[시마노] 사이클론 카본 루어대 2-210', productPrice: 134000, discountRate: 8, productImage: MOCK_IMG(2), coupangUrl: `https://www.coupang.com/np/search?q=루어낚시대&lptag=${PARTNERS_ID}`, badge: '인기 급상승' },
    { productId: 'm003', productName: '[요즈리] 크리스탈 미노우 에기 5개 세트', productPrice: 18500, discountRate: 30, productImage: MOCK_IMG(3), coupangUrl: `https://www.coupang.com/np/search?q=에기세트&lptag=${PARTNERS_ID}`, badge: '할인 특가' },
    { productId: 'm004', productName: '[바낙스] 제우스 파워 원투낚시대 4.2m', productPrice: 67000, discountRate: 0, productImage: MOCK_IMG(4), coupangUrl: `https://www.coupang.com/np/search?q=원투낚시대&lptag=${PARTNERS_ID}`, badge: '낚시GO 추천' },
    { productId: 'm005', productName: '[YGK] 지크레이 오드라이브 PE라인 1.0호 200m', productPrice: 29800, discountRate: 5, productImage: MOCK_IMG(5), coupangUrl: `https://www.coupang.com/np/search?q=PE라인&lptag=${PARTNERS_ID}`, badge: '많이 찾는' },
    { productId: 'm006', productName: '[콜맨] 캠핑 폴딩 체어 낚시 의자', productPrice: 45000, discountRate: 20, productImage: MOCK_IMG(6), coupangUrl: `https://www.coupang.com/np/search?q=낚시의자&lptag=${PARTNERS_ID}`, badge: '할인 특가' },
  ],
  '스피닝릴': [
    { productId: 'm011', productName: '[다이와] 레브로스 LT 2500S 스피닝릴', productPrice: 89000, discountRate: 12, productImage: MOCK_IMG(11), coupangUrl: `https://www.coupang.com/np/search?q=스피닝릴&lptag=${PARTNERS_ID}`, badge: '낚시GO 추천' },
    { productId: 'm012', productName: '[시마노] 소어라 BB 2500S 스피닝릴', productPrice: 145000, discountRate: 5, productImage: MOCK_IMG(12), coupangUrl: `https://www.coupang.com/np/search?q=스피닝릴+바다낚시&lptag=${PARTNERS_ID}`, badge: '인기 급상승' },
  ],
  '베이트릴': [
    { productId: 'm013', productName: '[아부가르시아] 레보 베이트 릴', productPrice: 220000, discountRate: 8, productImage: MOCK_IMG(13), coupangUrl: `https://www.coupang.com/np/search?q=베이트릴&lptag=${PARTNERS_ID}`, badge: '낚시GO 추천' },
    { productId: 'm014', productName: '[시마노] SLX 베이트캐스팅릴', productPrice: 178000, discountRate: 0, productImage: MOCK_IMG(14), coupangUrl: `https://www.coupang.com/np/search?q=베이트캐스팅릴&lptag=${PARTNERS_ID}`, badge: '베이트 BEST' },
  ],
  '루어낚시대': [
    { productId: 'm015', productName: '[메이저크래프트] 크로스스테이지 루어로드 862M', productPrice: 132000, discountRate: 10, productImage: MOCK_IMG(15), coupangUrl: `https://www.coupang.com/np/search?q=루어낚시대&lptag=${PARTNERS_ID}`, badge: '루어 BEST' },
    { productId: 'm016', productName: '[바낙스] GT 루어낚시대 8피트', productPrice: 98000, discountRate: 15, productImage: MOCK_IMG(16), coupangUrl: `https://www.coupang.com/np/search?q=루어로드&lptag=${PARTNERS_ID}`, badge: '가성비 갑' },
  ],
  '원투낚시대': [
    { productId: 'm017', productName: '[다이와] 크로스비트 405 원투낚시대', productPrice: 87000, discountRate: 0, productImage: MOCK_IMG(17), coupangUrl: `https://www.coupang.com/np/search?q=원투낚시대&lptag=${PARTNERS_ID}`, badge: '낚시GO 추천' },
    { productId: 'm018', productName: '[바낙스] 제우스 파워 원투대 4.2m', productPrice: 67000, discountRate: 5, productImage: MOCK_IMG(18), coupangUrl: `https://www.coupang.com/np/search?q=원투대+갯바위&lptag=${PARTNERS_ID}`, badge: '원투 BEST' },
  ],
  '낚시줄': [
    { productId: 'm019', productName: '[YGK] 지크레이 오드라이브 PE 1.0호 200m', productPrice: 29800, discountRate: 5, productImage: MOCK_IMG(19), coupangUrl: `https://www.coupang.com/np/search?q=PE라인+낚시줄&lptag=${PARTNERS_ID}`, badge: '많이 찾는' },
    { productId: 'm020', productName: '[크레오라] 카본 목줄 2호 50m', productPrice: 12000, discountRate: 20, productImage: MOCK_IMG(20), coupangUrl: `https://www.coupang.com/np/search?q=카본목줄+낚시&lptag=${PARTNERS_ID}`, badge: '가성비 갑' },
  ],
  '캠핑의자': [
    { productId: 'm021', productName: '[콜맨] 컴팩트 폴딩 낚시 의자', productPrice: 45000, discountRate: 20, productImage: MOCK_IMG(21), coupangUrl: `https://www.coupang.com/np/search?q=낚시의자+캠핑&lptag=${PARTNERS_ID}`, badge: '캠핑 BEST' },
    { productId: 'm022', productName: '[네이처하이크] 초경량 낚시 캠핑의자', productPrice: 32000, discountRate: 10, productImage: MOCK_IMG(22), coupangUrl: `https://www.coupang.com/np/search?q=캠핑의자+낚시&lptag=${PARTNERS_ID}`, badge: '가성비 갑' },
  ],
  '루어': [
    { productId: 'm007', productName: '[잭슨] 루어 셋트 (5색)', productPrice: 22000, discountRate: 15, productImage: MOCK_IMG(7), coupangUrl: `https://www.coupang.com/np/search?q=루어세트&lptag=${PARTNERS_ID}`, badge: '루어 BEST' },
    { productId: 'm008', productName: '[메가배스] 비전 원텐 미노우 14cm', productPrice: 31500, discountRate: 0, productImage: MOCK_IMG(8), coupangUrl: `https://www.coupang.com/np/search?q=미노우&lptag=${PARTNERS_ID}`, badge: '낚시GO 추천' },
  ],
  '에기': [
    { productId: 'm009', productName: '[요즈리] 에기왕 Q LIVE 3.5호 4개 세트', productPrice: 41000, discountRate: 22, productImage: MOCK_IMG(9), coupangUrl: `https://www.coupang.com/np/search?q=에기왕&lptag=${PARTNERS_ID}`, badge: '에깅 BEST' },
    { productId: 'm010', productName: '[클라리스] 오징어 에기 10색 혼합 세트', productPrice: 15000, discountRate: 30, productImage: MOCK_IMG(10), coupangUrl: `https://www.coupang.com/np/search?q=에기세트&lptag=${PARTNERS_ID}`, badge: '가성비 갑' },
  ],
};


function getMockProducts(keyword = '낚시용품') {
  // ✅ 20TH-C4: exact match 우선, 부분 일치 fallback — 기존 includes(부분일치) 순서 의존으로 '루어낚시대'가 '루어'에 먼저 매칭되던 문제 해소
  if (MOCK_PRODUCTS[keyword]) return MOCK_PRODUCTS[keyword]; // exact match 우선
  for (const [cat, items] of Object.entries(MOCK_PRODUCTS)) {
    if (keyword.includes(cat)) return items;
  }
  return MOCK_PRODUCTS['낚시용품'];
}

// ─── 실제 쿠팡 파트너스 API 호출 ─────────────────────────────────────────────
async function searchCoupang(keyword, limit = 6) {
  if (IS_TEST_MODE) {
    // ✅ 9TH-B3: console.log → global.logger (Winston 통일) — 서버 로거와 일관성
    if (process.env.NODE_ENV !== 'production') {
      (global.logger?.info || console.info)(`[쿠팡 목업 모드] "${keyword}" 검색`);
    }
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
      coupangUrl:   PARTNERS_ID
        // ✅ 14TH-B2: lptag 중복 파라미터 방지 — URL에 이미 ? 포함 여부 확인 후 적절한 구분자 사용
        ? `${item.productUrl}${item.productUrl.includes('?') ? '&' : '?'}lptag=${PARTNERS_ID}`
        : item.productUrl,
      badge:        item.isRocket ? '로켓배송' : '낚시GO 추천',
    }));
  } catch (err) {
    // ENH5-A1: 프로덕션 console.error 노출 방지
    if (process.env.NODE_ENV !== 'production') console.error('[쿠팡 API 오류]:', err.message); // ✅ 14TH-B1: '쿠팬' → '쿠팡' 오타 수정
    return getMockProducts(keyword);
  }
}

// ─── Shop 탭용: 카테고리별 추천 상품 목록 ────────────────────────────────────
async function getRecommendedProducts(category = '낚시용품') {
  // ✅ 14TH-C3: '낚시' 키워드 중복 방지 — '낚시용품 낚시' 같은 중복 검색어 생성 방지
  const keyword = category.includes('낚시') ? category : `${category} 낚시`;
  return searchCoupang(keyword, 6);
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
