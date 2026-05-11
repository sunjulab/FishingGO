import React, { useState, useEffect, useCallback } from 'react'; // ✅ 12TH-B6: useCallback 추가
import { useNavigate } from 'react-router-dom';
// ✅ 12TH-B2: Bookmark, ArrowUpRight, PackageOpen dead import 3개 제거
import { ShoppingCart, Star, Zap, ShoppingBag, Search, SlidersHorizontal } from 'lucide-react';
import apiClient from '../api/index';


// ✅ BUG-59: 하드코딩 파트너스 ID 제거 → 환경변수 전용
const PARTNERS_ID = import.meta.env.VITE_COUPANG_PARTNERS_ID || '';

const categories = [
  { name: '전체', query: '낚시용품' },
  { name: '스피닝릴', query: '스피닝릴' },
  { name: '베이트릴', query: '베이트릴' },
  { name: '루어로드', query: '루어낚시대' },
  { name: '원투로드', query: '원투낚시대' },
  { name: '라인/채비', query: '낚시줄' },
  { name: '캠핑/야영', query: '캠핑의자' }
];

export default function Shop() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('전체');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // ✅ 23TH-C1: fetchProducts는 useCallback([], [])으로 mount-only stable ref — deps [] 명시가 의미상 명확
  }, []);

  // ✅ 12TH-B6: useCallback 적용 — deps 포함 후 eslint-disable 제거
  const fetchProducts = useCallback(async (category = '낚시용품') => {
    try {
      setLoading(true);
      // ENH3-C4: 성공 응답 직전에 목록 교체 — 로딩 중 이전 상품 유지로 깜빡임 방지
      const res = await apiClient.get(`/api/products?category=${encodeURIComponent(category)}`);
      setProducts(res.data); // 성공 시에만 목록 교체
    } catch (err) {
      // ENH3-A5: 프로덕션에서 콘솔 스택 트레이스 노출 방지
      if (!import.meta.env.PROD) console.error('Failed to fetch products', err);
      // ENH3-C4: 실패 시 기존 목록 유지 (setProducts([]) 제거)
    } finally {
      setLoading(false);
    }
  }, []); // apiClient는 모듈 레벨 stable 참조 — 빈 deps 안전

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!search.trim()) return;
    const url = `https://www.coupang.com/np/search?q=${encodeURIComponent(search)}&lptag=${PARTNERS_ID}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCategoryClick = (cat) => {
    setActiveCat(cat.name);
    fetchProducts(cat.query); // 서버에서 해당 카테고리 상품 동적 로드
  };

  // ENH3-B3: 쿠팡 파트너스 ID URL에 삽입 — 클릭 수익 완결
  const handleProductClick = (url) => {
    const finalUrl = PARTNERS_ID && url && !url.includes('lptag=')
      ? `${url}${url.includes('?') ? '&' : '?'}lptag=${PARTNERS_ID}`
      : url;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="page-container" style={{ backgroundColor: '#F8F9FA' }}>
      {/* 🟦 Compact Shop Header 🟦 */}
      <div style={{ backgroundColor: '#fff', padding: '10px 16px 8px', position: 'sticky', top: 'calc(var(--safe-top) + 60px)', zIndex: 100, borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <ShoppingBag size={16} color="#0056D2" />
          <h1 style={{ fontSize: '15px', fontWeight: '950', color: '#1c1c1e', letterSpacing: '-0.03em', margin: 0 }}>지금 안 사면 후회해요</h1>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93', marginLeft: 'auto' }}>고민은 배송만 늦출 뿐 🎣</span>
        </div>
        
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
          <input 
            type="text" 
            placeholder="찾고 있는 낚시 장비 검색" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 40px', backgroundColor: '#F2F2F7', border: 'none', borderRadius: '14px', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} 
          />
          <Search size={16} color="#8E8E93" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        </form>
      </div>

      {/* 🟦 Categories 🟦 */}
      <div style={{ backgroundColor: '#fff', padding: '6px 16px 8px', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
          {categories.map((c) => (
            <div 
              key={c.name} 
              onClick={() => handleCategoryClick(c)}
              style={{ padding: '6px 12px', backgroundColor: activeCat === c.name ? '#1c1c1e' : '#F2F2F7', borderRadius: '10px', color: activeCat === c.name ? '#fff' : '#8E8E93', fontSize: '12px', fontWeight: '850', whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0 }}
            >
              {c.name}
            </div>
          ))}
        </div>
      </div>

      {/* 🟦 Product Grid 🟦 */}
      <div style={{ padding: '12px 12px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingLeft: '4px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#1c1c1e', margin: 0 }}>오늘의 찜 목록 🌊</h3>
          <SlidersHorizontal size={15} color="#8E8E93" />
        </div>
        
        {/* 3열 그리드 — 한 화면에 더 많은 상품 표시 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {loading ? [1,2,3,4,5,6].map(n => (
            <div key={n} style={{ height: '180px', backgroundColor: '#eee', borderRadius: '16px', animation: 'pulse 1.5s infinite' }}></div>
          )) : products.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: '#8E8E93' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎣</div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#1c1c1e', marginBottom: '4px' }}>상품을 불러오지 못했습니다</div>
              <div style={{ fontSize: '12px' }}>잠시 후 다시 시도해주세요</div>
            </div>
          ) : products.map(p => (
            <div 
              key={p.id} 
              onClick={() => handleProductClick(p.link)}
              style={{ backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F2F2F7', cursor: 'pointer' }}
            >
              {/* 상품 이미지 */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1' }}>
                <img src={p.img} alt={p.name || '상품 이미지'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {p.discount !== '0%' && (
                  <div style={{ position: 'absolute', top: '6px', left: '6px', background: '#FF5A5F', color: '#fff', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: '900' }}>{p.discount}</div>
                )}
              </div>
              {/* 상품 정보 */}
              <div style={{ padding: '8px' }}>
                <div style={{ fontSize: '9px', color: '#0056D2', fontWeight: '900', marginBottom: '2px' }}>{p.badge}</div>
                <h3 style={{ fontSize: '11px', fontWeight: '850', color: '#1c1c1e', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', margin: '0 0 4px' }}>
                  {p.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '950', color: '#FF5A5F' }}>{p.price}</span>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#1c1c1e' }}>원</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 🟦 Partners Policy Disclosure 🟦 */}
      <div style={{ padding: '0 24px 60px', textAlign: 'center' }}>
         <div style={{ width: '100%', height: '1px', backgroundColor: '#F0F0F0', marginBottom: '32px' }}></div>
         {/* ✅ 2ND-A3: 파트너스 ID UI 노출 제거 — 제3자 PID 도용 위험 방지 */}
         <p style={{ fontSize: '11px', color: '#bbb', lineHeight: 1.6, fontWeight: '600' }}>
            이 포스팅은 쿠팡 파트너스 활동의 일환으로, <br/>
            이에 따른 일정액의 수수료를 제공받을 수 있습니다.
         </p>
      </div>
    </div>
  );
}
