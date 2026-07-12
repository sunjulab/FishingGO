import React from 'react';

const AD_DATA = {
  coupang: {
    iconText: '쿠팡 앱에서 구매하기 >',
    title: '선상/갯바위 낚시 필수템!\n특가 득템 찬스',
    badge: 'AD',
    provider: '쿠팡 파트너스',
    imageUrl: 'https://image9.coupangcdn.com/image/retail/images/2020/09/24/11/1/32be2476-79ba-47f6-9dd1-e4f8d6728cba.jpg',
    link: 'https://coupa.ng/cDqBvN', // Replace with real affiliate link
    brandColor: '#EBF2FF',
    textColor: '#8E8E93'
  },
  ali: {
    iconText: 'AliExpress 특가 보기 >',
    title: '글로벌 낚시용품 직구\n최대 80% 할인',
    badge: 'AD',
    provider: 'AliExpress',
    imageUrl: 'https://ae01.alicdn.com/kf/S1b0f5cd5a19842a2b0287ffdbb3086eb1/2-1.png', // Typical ali item img
    link: 'https://s.click.aliexpress.com/e/_Dk12345', // Replace with real affiliate link
    brandColor: '#FFF0ED',
    textColor: '#FF4747'
  }
};

export default function KakaoAdBanner({ type = 'coupang' }) {
  const ad = AD_DATA[type];

  return (
    <div 
      onClick={() => window.open(ad.link, '_blank')}
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
        margin: '12px 16px 0' // Default margin matching DashboardView padding
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
      
      {/* Right-side image overlapping the edge slightly like Kakao */}
      <div style={{ position: 'absolute', right: '-15px', top: '50%', transform: 'translateY(-50%)', zIndex: 1, width: '110px', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img 
          src={ad.imageUrl} 
          alt="광고상품" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
        {/* Soft gradient fade on the left side of the image to blend into white */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40px', background: 'linear-gradient(to right, #fff, transparent)' }} />
      </div>
    </div>
  );
}
