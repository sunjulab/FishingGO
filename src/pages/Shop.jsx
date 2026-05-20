import React, { useState, useEffect, useCallback } from 'react';
import { Zap, ShoppingBag, Search, SlidersHorizontal } from 'lucide-react';
import apiClient from '../api/index';

const COUPANG_PARTNERS_ID = import.meta.env.VITE_COUPANG_PARTNERS_ID || '';

// ── 카테고리 정의 ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: '전체',    query: '낚시용품', source: 'all' },
  { name: '🛒 쿠팡',  query: '낚시용품', source: 'coupang' },
  { name: '💰 알리',  query: '소모품',   source: 'ali'    },
  { name: '스피닝릴', query: '스피닝릴', source: 'coupang' },
  { name: '루어로드', query: '루어낚시대', source: 'coupang' },
  { name: '루어/에기', query: '루어',    source: 'ali'    },
  { name: '채비/바늘', query: '채비',    source: 'ali'    },
  { name: '낚시줄',  query: '낚시줄',   source: 'ali'    },
];

// 플랫폼 뱃지 색상
const SOURCE_STYLE = {
  coupang: { bg: '#0056D2', text: '#fff', label: '쿠팡' },
  ali:     { bg: '#FF6900', text: '#fff', label: '알리' },
};

export default function Shop() {
  const [products,   setProducts]   = useState([]);
  const [promos,     setPromos]     = useState([]);
  const [search,     setSearch]     = useState('');
  const [activeCat,  setActiveCat]  = useState('전체');
  const [loading,    setLoading]    = useState(true);
  const [promoLoading, setPromoLoading] = useState(true);

  // 최초 마운트 시 전체 + 특가 동시 로드
  useEffect(() => {
    fetchProducts('낚시용품', 'all');
    fetchPromo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 상품 목록 로드 ───────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (category = '낚시용품', source = 'all') => {
    try {
      setLoading(true);
      const res = await apiClient.get(
        `/api/shop/products?category=${encodeURIComponent(category)}&source=${source}`
      );
      setProducts(res.data);
    } catch (err) {
      if (!import.meta.env.PROD) console.error('[Shop] 상품 로드 실패', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── 알리 특가 로드 ───────────────────────────────────────────────────────────
  const fetchPromo = useCallback(async () => {
    try {
      setPromoLoading(true);
      const res = await apiClient.get('/api/shop/promo');
      setPromos(res.data);
    } catch (err) {
      if (!import.meta.env.PROD) console.error('[Shop] 특가 로드 실패', err);
    } finally {
      setPromoLoading(false);
    }
  }, []);

  // ── 검색 ────────────────────────────────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!search.trim()) return;
    // 검색은 쿠팡으로 라우팅 (한국어 검색 UX)
    const url = `https://www.coupang.com/np/search?q=${encodeURIComponent(search)}&lptag=${COUPANG_PARTNERS_ID}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ── 카테고리 클릭 ────────────────────────────────────────────────────────────
  const handleCatClick = (cat) => {
    setActiveCat(cat.name);
    fetchProducts(cat.query, cat.source);
  };

  // ── 상품 클릭 ────────────────────────────────────────────────────────────────
  const handleProductClick = (product) => {
    let url = product.link;
    // 쿠팡: lptag 파트너스 ID 추가
    if (product.source === 'coupang' && COUPANG_PARTNERS_ID && url && !url.includes('lptag=')) {
      url = `${url}${url.includes('?') ? '&' : '?'}lptag=${COUPANG_PARTNERS_ID}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="page-container" style={{ backgroundColor: '#F8F9FA', paddingBottom: '80px' }}>

      {/* ── 헤더 + 검색 ── */}
      <div style={{ backgroundColor: '#fff', padding: '10px 16px 8px', position: 'sticky', top: 'calc(var(--safe-top) + 60px)', zIndex: 100, borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <ShoppingBag size={16} color="#0056D2" />
          <h1 style={{ fontSize: '15px', fontWeight: '950', color: '#1c1c1e', letterSpacing: '-0.03em', margin: 0 }}>
            낚시 장비 쇼핑
          </h1>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#8E8E93', marginLeft: 'auto' }}>
            쿠팡 + 알리 통합 🎣
          </span>
        </div>
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="낚시 장비 검색 (쿠팡으로 연결)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 40px', backgroundColor: '#F2F2F7', border: 'none', borderRadius: '14px', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
          />
          <Search size={16} color="#8E8E93" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        </form>
      </div>

      {/* ── 카테고리 탭 ── */}
      <div style={{ backgroundColor: '#fff', padding: '6px 16px 8px', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
          {CATEGORIES.map((c) => (
            <div
              key={c.name}
              onClick={() => handleCatClick(c)}
              style={{
                padding: '6px 12px',
                backgroundColor: activeCat === c.name ? '#1c1c1e' : '#F2F2F7',
                borderRadius: '10px',
                color: activeCat === c.name ? '#fff' : '#8E8E93',
                fontSize: '12px', fontWeight: '850',
                whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
              }}
            >
              {c.name}
            </div>
          ))}
        </div>
      </div>

      {/* ── 알리 오늘 특가 배너 ── */}
      {promos.length > 0 && (
        <div style={{ padding: '12px 12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Zap size={15} color="#FF6900" fill="#FF6900" />
            <span style={{ fontSize: '13px', fontWeight: '900', color: '#1c1c1e' }}>오늘 알리 특가 🔥</span>
            <span style={{ fontSize: '10px', color: '#FF6900', fontWeight: '800', marginLeft: 'auto' }}>
              수수료 50%+
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '4px' }}>
            {promoLoading
              ? [1, 2].map(n => (
                  <div key={n} style={{ height: '110px', backgroundColor: '#eee', borderRadius: '14px', animation: 'pulse 1.5s infinite' }} />
                ))
              : promos.slice(0, 4).map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleProductClick(p)}
                    style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#fff8f3', border: '1px solid #FFE0CC', borderRadius: '14px', padding: '8px', cursor: 'pointer' }}
                  >
                    <img src={p.img} alt={p.name} style={{ width: '54px', height: '54px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '9px', color: '#FF6900', fontWeight: '900', marginBottom: '2px' }}>{p.badge}</div>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#1c1c1e', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {p.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '950', color: '#FF5A5F' }}>{p.price}원</span>
                        <span style={{ fontSize: '9px', color: '#FF6900', fontWeight: '800' }}>({p.discount}↓)</span>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      )}

      {/* ── 상품 그리드 (쿠팡 + 알리 통합) ── */}
      <div style={{ padding: '12px 12px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingLeft: '4px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#1c1c1e', margin: 0 }}>
            {activeCat === '전체' ? '전체 상품 (쿠팡 + 알리)' : `${activeCat} 상품`}
          </h3>
          <SlidersHorizontal size={15} color="#8E8E93" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {loading
            ? [1,2,3,4,5,6].map(n => (
                <div key={n} style={{ height: '180px', backgroundColor: '#eee', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
              ))
            : products.length === 0
            ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: '#8E8E93' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎣</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#1c1c1e', marginBottom: '4px' }}>상품을 불러오지 못했습니다</div>
                  <div style={{ fontSize: '12px' }}>잠시 후 다시 시도해주세요</div>
                </div>
              )
            : products.map(p => {
                const srcStyle = SOURCE_STYLE[p.source] || SOURCE_STYLE.coupang;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleProductClick(p)}
                    style={{ backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F2F2F7', cursor: 'pointer', position: 'relative' }}
                  >
                    {/* 플랫폼 라벨 */}
                    <div style={{ position: 'absolute', top: '6px', right: '6px', backgroundColor: srcStyle.bg, color: srcStyle.text, padding: '2px 5px', borderRadius: '5px', fontSize: '8px', fontWeight: '900', zIndex: 2 }}>
                      {srcStyle.label}
                    </div>
                    {/* 할인율 */}
                    {p.discount && p.discount !== '0%' && (
                      <div style={{ position: 'absolute', top: '6px', left: '6px', background: '#FF5A5F', color: '#fff', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: '900', zIndex: 2 }}>
                        {p.discount}
                      </div>
                    )}
                    {/* 이미지 */}
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1' }}>
                      <img src={p.img} alt={p.name || '상품'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    {/* 정보 */}
                    <div style={{ padding: '8px' }}>
                      <div style={{ fontSize: '9px', color: srcStyle.bg, fontWeight: '900', marginBottom: '2px' }}>{p.badge}</div>
                      <h3 style={{ fontSize: '11px', fontWeight: '850', color: '#1c1c1e', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', margin: '0 0 4px' }}>
                        {p.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '950', color: '#FF5A5F' }}>{p.price}</span>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#1c1c1e' }}>원</span>
                      </div>
                      {/* 알리: 수수료율 표시 */}
                      {p.source === 'ali' && p.commission && (
                        <div style={{ fontSize: '8px', color: '#FF6900', fontWeight: '800', marginTop: '2px' }}>
                          수수료 {p.commission}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* ── 파트너스 공시 ── */}
      <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
        <div style={{ width: '100%', height: '1px', backgroundColor: '#F0F0F0', marginBottom: '16px' }} />
        <p style={{ fontSize: '10px', color: '#bbb', lineHeight: 1.7, fontWeight: '600' }}>
          이 포스팅은 쿠팡 파트너스 및 알리익스프레스 어필리에이트 활동의 일환으로,<br />
          이에 따른 일정액의 수수료를 제공받을 수 있습니다.
        </p>
      </div>
    </div>
  );
}
