import React from 'react';

const AD_DATA = {
  coupang: {
    iconText: '쿠팡 앱에서 구매하기 >',
    title: '로켓배송 오늘주문 내일도착',
    badge: 'AD',
    provider: 'Appier',
    imageUrls: ['/shop-images/reel.png', '/shop-images/rod.png', '/shop-images/line.png', '/shop-images/tackle.png', '/shop-images/hooks.png'],
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
    provider: 'Appier',
    imageUrls: ['/shop-images/lures.png', '/shop-images/hooks.png', '/shop-images/line.png'],
    link: 'https://s.click.aliexpress.com/e/_Dk12345', // Replace with real affiliate link
    brandColor: '#FFF0ED',
    textColor: '#FF4747'
  }
};

export default function KakaoAdBanner({ type = 'coupang', style = {} }) {
  const ad = AD_DATA[type];
  const images = ad.imageUrls || [ad.imageUrl];
  // useMemo ensures the image doesn't change on re-renders, but is random on mount
  const displayImg = React.useMemo(() => images[Math.floor(Math.random() * images.length)], []);

  return (
    <div 
      onClick={() => {
        const targetLink = ad.links ? ad.links[Math.floor(Math.random() * ad.links.length)] : ad.link;
        window.open(targetLink, '_blank');
      }}
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
        margin: '12px 16px 0', // Default margin matching DashboardView padding
        ...style // Override margin if passed
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: `calc(11px * var(--fs, 1))`, color: ad.textColor, fontWeight: '800' }}>
            {ad.iconText}
          </span>
        </div>
        <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '950', color: '#1A1A2E', marginTop: '4px', lineHeight: 1.3, whiteSpace: 'pre-line' }}>
          {ad.title}
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
      
      {/* Right-side image covering the right edge like Kakao */}
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '135px', zIndex: 1 }}>
        <img 
          src={displayImg} 
          alt="광고상품" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
        {/* Soft gradient fade on the left side of the image to blend into white */}
        <div style={{ position: 'absolute', left: -2, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(to right, #ffffff 0%, rgba(255,255,255,0.7) 40%, transparent 100%)' }} />
      </div>
    </div>
  );
}
