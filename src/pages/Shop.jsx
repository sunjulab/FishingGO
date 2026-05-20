import React, { useState, useEffect, useCallback } from 'react';
import { Zap, ShoppingBag, Search, SlidersHorizontal, X } from 'lucide-react';
import apiClient from '../api/index';

const COUPANG_PARTNERS_ID = import.meta.env.VITE_COUPANG_PARTNERS_ID || '';

// ── 카테고리 정의 ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: '전체',         query: '낚시용품',  source: 'all'     },
  { name: '🛒 Coupang',   query: '낚시용품',  source: 'coupang' },
  { name: '💰 AliExpress', query: '소모품',    source: 'ali'     },
  { name: '스피닝릴',    query: '스피닝릴',  source: 'coupang' },
  { name: '루어로드',    query: '루어낚시대', source: 'coupang' },
  { name: '루어/에기',   query: '루어',      source: 'ali'     },
  { name: '채비/바늘',   query: '채비',      source: 'ali'     },
  { name: '낚시줄',      query: '낚시줄',    source: 'ali'     },
];

// 플랫폼 뱃지 색상
const SOURCE_STYLE = {
  coupang: { bg: '#0056D2', text: '#fff', label: 'Coupang' },
  ali:     { bg: '#FF6900', text: '#fff', label: 'AliExpress' },
};

export default function Shop() {
  const [products,     setProducts]     = useState([]);
  const [promos,       setPromos]       = useState([]);
  const [search,       setSearch]       = useState('');
  const [activeCat,    setActiveCat]    = useState('전체');
  const [loading,      setLoading]      = useState(true);
  const [promoLoading, setPromoLoading] = useState(true);
  const [searchQuery,  setSearchQuery]  = useState(''); // ✅ 실제 검색 중인 키워드

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

  // ── 검색 → 내 쇼핑 채널(그리드)에 결과 표시 ──────────────────────────────
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const q = search.trim();
    if (!q) return;
    setSearchQuery(q);          // 검색어 저장 → 헤더에 표시
    setActiveCat('');            // 카테고리 칩 선택 해제
    fetchProducts(q, 'all');    // Coupang + AliExpress 동시 검색
  };

  // ── 검색 초기화 ────────────────────────────────────────────────────────────
  const clearSearch = () => {
    setSearch('');
    setSearchQuery('');
    setActiveCat('전체');
    fetchProducts('낚시용품', 'all');
  };

  // ── 카테고리 클릭 ────────────────────────────────────────────────────────────
  const handleCatClick = (cat) => {
    setActiveCat(cat.name);
    setSearchQuery('');    // 카테고리 클릭 시 검색어 초기화
    setSearch('');
    fetchProducts(cat.query, cat.source);
  };

  // ── 상품 클릭 ────────────────────────────────────────────────────────────────
  const handleProductClick = (product) => {
    let url = product.link;
    // Coupang: lptag 파트너스 ID 추가
    if (product.source === 'coupang' && COUPANG_PARTNERS_ID && url && !url.includes('lptag=')) {
      url = `${url}${url.includes('?') ? '&' : '?'}lptag=${COUPANG_PARTNERS_ID}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ── 그리드 헤더 텍스트 ──────────────────────────────────────────────────────
  const gridTitle = searchQuery
    ? `🔍 "${searchQuery}" 검색결과`
    : activeCat === '전체'
    ? '전체 상품 (Coupang + AliExpress)'
    : `${activeCat} 상품`;

  return (
    <div className="page-container" style={{ backgroundColor: '#F8F9FA', paddingBottom: '80px' }}>

      {/* ── 헤더 + 검색 ── */}
      <div style={{ backgroundColor: '#fff', padding: '10px 16px 8px', position: 'sticky', top: 'calc(var(--safe-top) + 60px)', zIndex: 100, borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <ShoppingBag size={16} color="#0056D2" />
          <h1 style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '950', color: '#1c1c1e', letterSpacing: '-0.03em', margin: 0 }}>
            낚시 장비 쇼핑
          </h1>
          <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '700', color: '#8E8E93', marginLeft: 'auto' }}>
            Coupang + AliExpress 🎣
          </span>
        </div>
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="낚시 장비 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 40px 10px 40px', backgroundColor: '#F2F2F7', border: `1.5px solid ${searchQuery ? '#0056D2' : 'transparent'}`, borderRadius: '14px', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
          />
          <Search size={16} color="#8E8E93" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          {/* 검색어 있을 때 X 버튼 */}
          {(search || searchQuery) && (
            <button
              type="button"
              onClick={clearSearch}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: '#C7C7CC', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
            >
              <X size={11} color="#fff" strokeWidth={3} />
            </button>
          )}
        </form>
        {/* 검색 활성 안내 */}
        {searchQuery && (
          <div style={{ marginTop: '6px', fontSize: `calc(11px * var(--fs, 1))`, color: '#0056D2', fontWeight: '800', paddingLeft: '4px' }}>
            🔍 Coupang + AliExpress 통합 검색 중
          </div>
        )}
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
                fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '850',
                whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
              }}
            >
              {c.name}
            </div>
          ))}
        </div>
      </div>

      {/* ── AliExpress 오늘 특가 배너 (검색 중엔 숨김) ── */}
      {!searchQuery && promos.length > 0 && (
        <div style={{ padding: '12px 12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Zap size={15} color="#FF6900" fill="#FF6900" />
            <span style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: '#1c1c1e' }}>AliExpress 오늘 특가 🔥</span>
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
                      <div style={{ fontSize: `calc(9px * var(--fs, 1))`, color: '#FF6900', fontWeight: '900', marginBottom: '2px' }}>{p.badge}</div>
                      <div style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', color: '#1c1c1e', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {p.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                        <span style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '950', color: '#FF5A5F' }}>{p.price}원</span>
                        <span style={{ fontSize: `calc(9px * var(--fs, 1))`, color: '#FF6900', fontWeight: '800' }}>({p.discount}↓)</span>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      )}

      {/* ── 상품 그리드 (Coupang + AliExpress 통합) ── */}
      <div style={{ padding: '12px 12px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingLeft: '4px' }}>
          <h3 style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', color: '#1c1c1e', margin: 0 }}>
            {gridTitle}
          </h3>
          <SlidersHorizontal size={15} color="#8E8E93" />
        </div>

        {/* ✅ 파트너스 수익 공시 */}
        <div style={{
          background: 'linear-gradient(135deg, #EEF4FF, #F5F0FF)',
          border: '1px solid #D0DEFF',
          borderRadius: '12px',
          padding: '10px 14px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '16px', flexShrink: 0 }}>💰</span>
          <p style={{ margin: 0, fontSize: '10px', color: '#4A4A8A', fontWeight: '700', lineHeight: 1.6 }}>
            이 채널의 상품 링크는 <strong>쿠팡 파트너스</strong> · <strong>AliExpress 어필리에이트</strong>와 연결되어 있으며,
            구매 시 발생하는 소정의 수수료는 <strong>낚시GO 서비스 운영</strong>에 사용됩니다. 🎣
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {loading
            ? [1,2,3,4,5,6].map(n => (
                <div key={n} style={{ height: '180px', backgroundColor: '#eee', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
              ))
            : products.length === 0
            ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: '#8E8E93' }}>
                  <div style={{ fontSize: `calc(36px * var(--fs, 1))`, marginBottom: '8px' }}>🎣</div>
                  <div style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', color: '#1c1c1e', marginBottom: '4px' }}>상품을 불러오지 못했습니다</div>
                  <div style={{ fontSize: `calc(12px * var(--fs, 1))` }}>잠시 후 다시 시도해주세요</div>
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
                    <div style={{ position: 'absolute', top: '6px', right: '6px', backgroundColor: srcStyle.bg, color: srcStyle.text, padding: '2px 5px', borderRadius: '5px', fontSize: `calc(8px * var(--fs, 1))`, fontWeight: '900', zIndex: 2 }}>
                      {srcStyle.label}
                    </div>
                    {/* 할인율 */}
                    {p.discount && p.discount !== '0%' && (
                      <div style={{ position: 'absolute', top: '6px', left: '6px', background: '#FF5A5F', color: '#fff', padding: '2px 6px', borderRadius: '6px', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', zIndex: 2 }}>
                        {p.discount}
                      </div>
                    )}
                    {/* 이미지 */}
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1' }}>
                      <img src={p.img} alt={p.name || '상품'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    {/* 정보 */}
                    <div style={{ padding: '8px' }}>
                      <div style={{ fontSize: `calc(9px * var(--fs, 1))`, color: srcStyle.bg, fontWeight: '900', marginBottom: '2px' }}>{p.badge}</div>
                      <h3 style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '850', color: '#1c1c1e', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', margin: '0 0 4px' }}>
                        {p.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                        <span style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '950', color: '#FF5A5F' }}>{p.price}</span>
                        <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', color: '#1c1c1e' }}>원</span>
                      </div>
                      {/* AliExpress: 수수료율 표시 */}
                      {p.source === 'ali' && p.commission && (
                        <div style={{ fontSize: `calc(8px * var(--fs, 1))`, color: '#FF6900', fontWeight: '800', marginTop: '2px' }}>
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
        <p style={{ fontSize: `calc(10px * var(--fs, 1))`, color: '#bbb', lineHeight: 1.7, fontWeight: '600' }}>
          이 포스팅은 쿠팡 파트너스 및 알리익스프레스 어필리에이트 활동의 일환으로,<br />
          이에 따른 일정액의 수수료를 제공받을 수 있습니다.
        </p>
      </div>
    </div>
  );
}
