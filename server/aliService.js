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

// ─── HMAC-MD5 서명 생성 ───────────────────────────────────────────────────────
function signAliRequest(params) {
  const sorted = Object.keys(params).sort().map(k => `${k}${params[k]}`).join('');
  const str = `${ALI_APP_SECRET}${sorted}${ALI_APP_SECRET}`;
  return crypto.createHash('md5').update(str).digest('hex').toUpperCase();
}

function buildParams(method, extraParams = {}) {
  const params = {
    method,
    app_key:     ALI_APP_KEY,
    timestamp:   String(Date.now()),
    sign_method: 'md5',
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

// ─── 상품 데이터 정규화 ────────────────────────────────────────────────────────
function normalizeProduct(item) {
  const salePrice     = Number(item.app_sale_price || item.sale_price || 0);
  const originalPrice = Number(item.original_price || salePrice);
  const discount      = originalPrice > 0
    ? `${Math.round((1 - salePrice / originalPrice) * 100)}%`
    : '0%';
  const commission    = Number(item.commission_rate || 0);

  return {
    productId:      String(item.product_id),
    title:          item.product_title || '',
    salePrice:      salePrice.toLocaleString('ko-KR'),
    originalPrice:  originalPrice.toLocaleString('ko-KR'),
    discount,
    imageUrl:       item.product_main_image_url || '',
    productUrl:     buildAliAffiliateUrl(item.product_detail_url || ''),
    commissionRate: `${commission}%`,
    badge: commission >= 50 ? '⚡ 특가' : commission >= 30 ? '🔥 인기' : '💰 가성비',
    stars:          Number(item.evaluate_rate || 0),
    orders:         Number(item.lastest_volume || 0),
  };
}

// ─── 키워드 상품 검색 ─────────────────────────────────────────────────────────
async function searchAliExpress(keyword, limit = 6) {
  if (!ALI_READY) {
    (global.logger?.warn || console.warn)('[ALI] API 키 미설정 — 상품 없음');
    return [];
  }
  try {
    const params = buildParams('aliexpress.affiliate.product.query', {
      keywords:        keyword,
      page_size:       String(limit),
      page_no:         '1',
      tracking_id:     ALI_TRACKING,
      target_currency: 'KRW',
      target_language: 'KO',
      sort:            'SALE_PRICE_ASC',
    });
    const queryStr = new URLSearchParams(params).toString();
    const response = await axios.get(`${ALI_API_URL}?${queryStr}`, { timeout: 8000 });
    const result   = response.data?.aliexpress_affiliate_product_query_response?.resp_result;

    if (result?.resp_code !== 200) {
      (global.logger?.warn || console.warn)(`[ALI] API 오류: ${result?.resp_msg}`);
      return [];
    }
    const items = result?.result?.products?.product || [];
    (global.logger?.info || console.info)(`[ALI] 검색 "${keyword}" → ${items.length}개`);
    return items.map(normalizeProduct);
  } catch (err) {
    (global.logger?.warn || console.warn)(`[ALI] searchAliExpress 오류: ${err.message}`);
    return [];
  }
}

// ─── 카테고리별 상품 조회 ─────────────────────────────────────────────────────
const ALI_KEYWORD_MAP = {
  '낚시바늘': 'fishing hook set',
  '봉돌':    'fishing sinker weight',
  '루어':    'fishing lure set',
  '소프트웜': 'soft lure worm fishing',
  '낚시줄':  'fishing line PE braid',
  '채비':    'fishing tackle rig set',
  '집어등':  'fishing light LED',
  '릴':     'fishing reel spinning',
  '낚싯대':  'fishing rod telescopic',
  '기본':    'fishing tackle accessories',
  '소모품':  'fishing accessories set',
};

async function getAliProducts(category = '소모품') {
  const keyword = ALI_KEYWORD_MAP[category] || `${category} fishing`;
  return searchAliExpress(keyword, 6);
}

// ─── 특가/인기 상품 (고수수료) ────────────────────────────────────────────────
async function getAliPromoProducts(limit = 4) {
  if (!ALI_READY) return [];
  try {
    const params = buildParams('aliexpress.affiliate.hotproduct.query', {
      keywords:           'fishing tackle',
      page_size:          String(limit),
      page_no:            '1',
      tracking_id:        ALI_TRACKING,
      target_currency:    'KRW',
      target_language:    'KO',
      min_commission_rate: '20',
      sort:               'LAST_VOLUME_DESC',
    });
    const queryStr = new URLSearchParams(params).toString();
    const response = await axios.get(`${ALI_API_URL}?${queryStr}`, { timeout: 8000 });
    const result   = response.data?.aliexpress_affiliate_hotproduct_query_response?.resp_result;
    const items    = result?.result?.products?.product || [];
    (global.logger?.info || console.info)(`[ALI] 특가상품 → ${items.length}개`);
    return items.map(p => ({ ...normalizeProduct(p), badge: '🔥 오늘 특가' }));
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
