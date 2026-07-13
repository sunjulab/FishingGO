import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/index';

const AD_DATA = {
  coupang: {
    iconText: '쿠팡 낚시용품 특가전 >',
    title: '선상/갯바위 낚시\n인기 필수템 모음',
    badge: 'AD',
    provider: 'Coupang Partners',
    imageUrls: ['/shop-images/reel.png', '/shop-images/rod.png', '/shop-images/line.png', '/shop-images/tackle.png', '/shop-images/hooks.png', '/shop-images/lures.png'],
    links: [
      'https://link.coupang.com/a/fj9wDlMOE8',
      'https://link.coupang.com/a/fj9zrP7SLc',
      'https://link.coupang.com/a/fj9AYN5hRs',
      'https://link.coupang.com/a/fj9CJoRBTg',
      'https://link.coupang.com/a/fj9DqyOfCK',
      'https://link.coupang.com/a/fj9EBJ79iM',
      'https://link.coupang.com/a/fj9FbS4zoy',
      'https://link.coupang.com/a/fj9F0Z0nwO',
      'https://link.coupang.com/a/fj9Hj42o7o',
      'https://link.coupang.com/a/fj9JpybAho',
      'https://link.coupang.com/a/fj9Kdmo7R6',
      'https://link.coupang.com/a/fj9LqlC3kO',
      'https://link.coupang.com/a/fj9MdF1ySq',
      'https://link.coupang.com/a/fj9MXF6Xjo',
      'https://link.coupang.com/a/fj9NMkiBtA',
      'https://link.coupang.com/a/fj9OxlBLG0',
      'https://link.coupang.com/a/fj9PfJyPKu',
      'https://link.coupang.com/a/fj9P5bIt6i',
      'https://link.coupang.com/a/fj9Q7q1spE',
      'https://link.coupang.com/a/fj9RJMMxcy',
      'https://link.coupang.com/a/fj9SrsJL52',
      'https://link.coupang.com/a/fj9SWJr4uG'
    ],
    brandColor: '#EBF2FF',
    textColor: '#8E8E93'
  },
  ali: {
    iconText: 'AliExpress 특가 보기 >',
    title: '글로벌 낚시용품 직구\n최대 80% 할인',
    badge: 'AD',
    provider: 'AliExpress Affiliate',
    // 실제 API 로드 전 fallback 이미지 (로컬)
    imageUrls: ['/shop-images/lures.png', '/shop-images/hooks.png', '/shop-images/line.png'],
    link: 'https://s.click.aliexpress.com/e/_oBn3bJh', // fallback
    brandColor: '#FFF0ED',
    textColor: '#FF4747'
  }
};

// ✅ 모듈 레벨 캐시: 컴포넌트 여러 개가 마운트되어도 API는 1회만 호출
let _aliPromoCache = null; // { items: [...], fetchedAt: timestamp }
const ALI_CACHE_TTL = 10 * 60 * 1000; // 10분

export default function KakaoAdBanner({ type = 'coupang', style = {} }) {
  const ad = AD_DATA[type];

  // ✅ 알리 광고: 실제 API 상품으로 동적 교체
  const [aliProduct, setAliProduct] = useState(null); // { img, link, name }
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (type !== 'ali') return;
    let cancelled = false;

    const loadAliProduct = async () => {
      // 캐시 유효하면 바로 사용
      if (_aliPromoCache && (Date.now() - _aliPromoCache.fetchedAt < ALI_CACHE_TTL)) {
        if (!cancelled && isMountedRef.current) {
          const items = _aliPromoCache.items;
          if (items.length > 0) {
            const pick = items[Math.floor(Math.random() * items.length)];
            setAliProduct({ img: pick.img, link: pick.link, name: pick.name });
          }
        }
        return;
      }

      try {
        const res = await apiClient.get('/api/shop/promo');
        const items = (res.data || [])
          .filter(p => p.img && p.link) // 이미지 + 링크 있는 것만
          .slice(0, 20);

        if (items.length > 0) {
          _aliPromoCache = { items, fetchedAt: Date.now() };
          if (!cancelled && isMountedRef.current) {
            const pick = items[Math.floor(Math.random() * items.length)];
            setAliProduct({ img: pick.img, link: pick.link, name: pick.name });
          }
        }
      } catch {
        // API 실패 시 fallback (로컬 이미지 유지)
      }
    };

    loadAliProduct();
    return () => { cancelled = true; };
  }, [type]);

  // ✅ 쿠팡: 이미지↔링크 매칭 세트로 고정
  const { displayImg, targetLink } = React.useMemo(() => {
    if (type === 'ali') {
      // ali는 useEffect로 비동기 로드 — useMemo는 fallback만 결정
      const imgs = ad.imageUrls;
      const img = imgs[Math.floor(Math.random() * imgs.length)];
      return { displayImg: img, targetLink: ad.link };
    }
    const images = ad.imageUrls || [];
    const links  = ad.links  || [];
    // ✅ 쿠팡 기획전: 링크 22개와 이미지 6개를 완전히 무작위로 독립 렌덤 매칭
    const imgIdx = Math.floor(Math.random() * images.length);
    const linkIdx = Math.floor(Math.random() * links.length);
    return { displayImg: images[imgIdx] || images[0], targetLink: links[linkIdx] || links[0] };
  }, [type, ad]);

  // 최종 표시값: ali는 API 로드 성공 시 덮어쓰기
  const finalImg  = (type === 'ali' && aliProduct?.img)  ? aliProduct.img  : displayImg;
  const finalLink = (type === 'ali' && aliProduct?.link) ? aliProduct.link : targetLink;

  return (
    <div
      onClick={() => { window.open(finalLink, '_blank', 'noopener,noreferrer'); }}
      style={{
        display: 'flex',
        background: '#fff',
        borderRadius: '16px',
        padding: '16px 20px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        cursor: 'pointer',
        border: `1px solid ${ad.brandColor}`,
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        margin: '12px 16px 0',
        ...style
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: `calc(11px * var(--fs, 1))`, color: ad.textColor, fontWeight: '800' }}>
            {ad.iconText}
          </span>
        </div>
        <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '950', color: '#1A1A2E', marginTop: '4px', lineHeight: 1.3, whiteSpace: 'pre-line' }}>
          {/* 알리: API로 로드한 실제 상품명 표시 */}
          {(type === 'ali' && aliProduct?.name)
            ? aliProduct.name.slice(0, 30) + (aliProduct.name.length > 30 ? '…' : '')
            : ad.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
          <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: '#F2F2F7', color: '#8E8E93', padding: '2px 5px', borderRadius: '4px', fontWeight: '900' }}>
            {ad.badge}
          </span>
          <span style={{ fontSize: `calc(10px * var(--fs, 1))`, color: '#8E8E93', marginLeft: '6px', fontWeight: '700' }}>
            {ad.provider} 광고입니다
          </span>
        </div>
      </div>

      {/* Right-side image — 알리: 실제 API 상품 이미지, 쿠팡: 로컬 이미지 */}
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '135px', zIndex: 1 }}>
        <img
          src={finalImg}
          alt="광고상품"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => {
            // 이미지 로드 실패 시 로컬 fallback
            if (type === 'ali') e.currentTarget.src = '/shop-images/lures.png';
          }}
        />
        {/* Soft gradient fade on the left side to blend into white */}
        <div style={{ position: 'absolute', left: -2, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(to right, #ffffff 0%, rgba(255,255,255,0.7) 40%, transparent 100%)' }} />
      </div>
    </div>
  );
}
