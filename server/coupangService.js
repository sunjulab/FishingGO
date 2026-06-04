/**
 * coupangService.js — 쿠팡 파트너스 Open API 연동 모듈 (실제 API 전용)
 *
 * [인증 방식] HMAC-SHA256
 * Authorization: CEA algorithm=HmacSHA256, access-key={key}, signed-date={datetime}, signature={sig}
 *
 * [Render 환경변수 등록 필요]
 * COUPANG_ACCESS_KEY  = 발급된 Access Key
 * COUPANG_SECRET_KEY  = 발급된 Secret Key
 * COUPANG_PARTNERS_ID = 파트너스 ID (예: AF3563639)
 */

'use strict';

const crypto = require('crypto');
const axios  = require('axios');

const COUPANG_BASE_URL = 'https://api-gateway.coupang.com';
const ACCESS_KEY   = process.env.COUPANG_ACCESS_KEY  || '';
const SECRET_KEY   = process.env.COUPANG_SECRET_KEY  || '';
const PARTNERS_ID  = process.env.COUPANG_PARTNERS_ID || '';

// 키 유효성 체크
const COUPANG_READY = ACCESS_KEY.length > 0 && SECRET_KEY.length > 0;

// ─── HMAC-SHA256 서명 생성 ────────────────────────────────────────────────────
function generateHmacSignature(method, path, query, datetime) {
  const messageToSign = `${datetime}${method}${path}${query ? '?' + query : ''}`;
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(messageToSign)
    .digest('hex');
}

function generateAuthHeader(method, urlPath, queryString = '') {
  const datetime  = new Date().toISOString().replace(/\..*$/, '');
  const signature = generateHmacSignature(method, urlPath, queryString, datetime);
  return {
    Authorization: `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${datetime}, signature=${signature}`,
    'Content-Type': 'application/json;charset=UTF-8',
  };
}

// ─── 상품 데이터 정규화 ────────────────────────────────────────────────────────
function normalizeProduct(item) {
  const url = item.productUrl || '';
  const coupangUrl = PARTNERS_ID
    ? `${url}${url.includes('?') ? '&' : '?'}lptag=${PARTNERS_ID}`
    : url;

  return {
    productId:    String(item.productId || ''),
    productName:  item.productName || '',
    productPrice: Number(item.productPrice || 0),
    discountRate: Number(item.discountRate || 0),
    productImage: item.productImage || '',
    coupangUrl,
    badge: item.isRocket ? '로켓배송' : '낚시GO 추천',
  };
}

// ─── 키워드 상품 검색 ─────────────────────────────────────────────────────────
async function searchCoupang(keyword, limit = 6) {
  if (!COUPANG_READY) {
    (global.logger?.warn || console.warn)('[쿠팡] API 키 미설정 — 상품 없음');
    return [];
  }

  try {
    const path    = '/v2/providers/affiliate_open_api/apis/openapi/v1/products/search';
    const query   = `keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
    const headers = generateAuthHeader('GET', path, query);

    const response = await axios.get(`${COUPANG_BASE_URL}${path}?${query}`, { headers, timeout: 8000 });
    const items    = response.data?.data?.productData || [];
    (global.logger?.info || console.info)(`[쿠팡] 검색 "${keyword}" → ${items.length}개`);
    return items.map(normalizeProduct);
  } catch (err) {
    (global.logger?.warn || console.warn)(`[쿠팡] searchCoupang 오류: ${err.message}`);
    return [];
  }
}

// ─── Shop 탭: 카테고리별 추천 상품 ───────────────────────────────────────────
async function getRecommendedProducts(category = '낚시용품') {
  const keyword = category.includes('낚시') ? category : `${category} 낚시`;
  return searchCoupang(keyword, 6);
}

// ─── 미디어 탭: 영상 카테고리 기반 연관 상품 ─────────────────────────────────
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

// ─── API 상태 확인 ────────────────────────────────────────────────────────────
function getCoupangStatus() {
  return {
    ready:      COUPANG_READY,
    accessKey:  ACCESS_KEY ? `${ACCESS_KEY.slice(0, 4)}****` : '미설정',
    partnersId: PARTNERS_ID || '미설정',
  };
}

module.exports = {
  searchCoupang,
  getRecommendedProducts,
  getProductsByVideoCategory,
  getCoupangStatus,
  PARTNERS_ID,
};
