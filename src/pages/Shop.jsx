import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Zap, ShoppingBag, Search, SlidersHorizontal, X, Plus } from 'lucide-react';
import apiClient from '../api/index';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore';

const COUPANG_PARTNERS_ID = import.meta.env.VITE_COUPANG_PARTNERS_ID || '';
const API_BASE   = 'https://fishing-go-backend.onrender.com';
const DIRECT_KEY = 'FishingGO_Admin_Direct_2026';
const SHOP_TAGS  = ['추천','낚시용품','루어/채비','릴/로드','라인/원줄','낚시복','가방/케이스','액세서리','기타'];

// ── 카테고리 정의 ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: '⭐ 추천',       query: '',           source: 'manual'  },
  { name: '전체',         query: '낚시용품',   source: 'all'     },
  { name: '🛒 Coupang',   query: '낚시용품',   source: 'coupang' },
  { name: '💰 AliExpress', query: '소모품',     source: 'ali'     },
  { name: '루어/채비',   query: '루어채비',   source: 'coupang' },
  { name: '릴/로드',     query: '낚시릴낚싯대', source: 'coupang' },
  { name: '라인/원줄',   query: '낚시줄',     source: 'ali'     },
  { name: '낚시용품',   query: '낚시용품',   source: 'coupang' },
  { name: '낚시복',     query: '낚시복',     source: 'coupang' },
  { name: '액세서리',   query: '낚시액세서리', source: 'ali'     },
];

// 카테고리 → manualItems 필터 규칙
const CAT_MANUAL_FILTER = {
  '⭐ 추천':      { tag: '추천' },
  '전체':         null,
  '🛒 Coupang':   { source: 'coupang' },
  '💰 AliExpress': { source: 'ali' },
  '루어/채비':   { tag: '루어/채비' },
  '릴/로드':     { tag: '릴/로드' },
  '라인/원줄':   { tag: '라인/원줄' },
  '낚시용품':   { tag: '낚시용품' },
  '낚시복':     { tag: '낚시복' },
  '가방/케이스': { tag: '가방/케이스' },
  '액세서리':   { tag: '액세서리' },
  '기타':       { tag: '기타' },
};

// 플랫폼 뱃지 색상
const SOURCE_STYLE = {
  coupang: { bg: '#0056D2', text: '#fff', label: 'Coupang' },
  ali:     { bg: '#FF6900', text: '#fff', label: 'AliExpress' },
};

export default function Shop() {
  const [products,     setProducts]     = useState([]);
  const [promos,       setPromos]       = useState([]);
  const [manualItems,  setManualItems]  = useState([]);  // ✅ 수동 등록 상품
  const [search,       setSearch]       = useState('');
  const [activeCat,    setActiveCat]    = useState('전체');
  const [loading,      setLoading]      = useState(true);
  const [promoLoading, setPromoLoading] = useState(true);
  const [searchQuery,  setSearchQuery]  = useState(''); // ✅ 실제 검색 중인 키워드

  // ── MASTER 전용 ────────────────────────────────────────────────────
  const isAdmin = useUserStore(s => s.isAdmin());
  const [showRegForm, setShowRegForm] = useState(false);
  const [regSrc,  setRegSrc]  = useState('coupang');
  const [regTag,  setRegTag]  = useState('추천');
  const [regShortUrl,    setRegShortUrl]    = useState('');
  const [regIframeCode,  setRegIframeCode]  = useState('');
  const [regImageUrl,    setRegImageUrl]    = useState('');
  const [regProductName, setRegProductName] = useState('');
  const [regMsg,   setRegMsg]   = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleRegSubmit = async () => {
    if (!regShortUrl.trim()) { setRegMsg('❌ 단축 URL 필수'); return; }
    setRegLoading(true); setRegMsg('⏳ 등록 중...');
    try {
      const iframeSrc = regSrc === 'coupang'
        ? (regIframeCode.match(/src=["']([^"']+)["']/i)?.[1] || '')
        : '';
      if (regSrc === 'coupang' && !iframeSrc) {
        setRegMsg('❌ iframe 코드에서 src를 찾을 수 없습니다'); setRegLoading(false); return;
      }
      const params = new URLSearchParams({
        key: DIRECT_KEY, source: regSrc,
        shortUrl: regShortUrl.trim(), iframeSrc,
        imageUrl: regImageUrl.trim(), productName: regProductName.trim(), tag: regTag,
      });
      const res  = await fetch(`${API_BASE}/api/shop/manual/direct?${params}`);
      const data = await res.json();
      if (data.ok) {
        setRegMsg('✅ 등록 완료!');
        setRegShortUrl(''); setRegIframeCode(''); setRegImageUrl(''); setRegProductName('');
        apiClient.get('/api/shop/manual').then(r => setManualItems(r.data || [])).catch(() => {});
        setTimeout(() => { setShowRegForm(false); setRegMsg(''); }, 1500);
      } else { setRegMsg(`❌ ${data.error || '등록 실패'}`); }
    } catch (e) { setRegMsg(`❌ 오류: ${e.message}`); }
    finally { setRegLoading(false); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.tag || item.source}" 상품을 삭제할까요?`)) return;
    try {
      const params = new URLSearchParams({ key: DIRECT_KEY, id: item._id });
      const res  = await fetch(`${API_BASE}/api/shop/manual/delete-direct?${params}`);
      const data = await res.json();
      if (data.ok) setManualItems(prev => prev.filter(i => i._id !== item._id));
      else alert(`삭제 실패: ${data.error}`);
    } catch (e) { alert(`오류: ${e.message}`); }
  };

  useEffect(() => {
    fetchProducts('낚시용품', 'all');
    fetchPromo();
    // 수동 등록 상품 로드
    apiClient.get('/api/shop/manual').then(r => setManualItems(r.data || [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 수동 상품 카테고리 필터링 ───────────────────────────────────────────────
  const filteredManualItems = useMemo(() => {
    const rule = CAT_MANUAL_FILTER[activeCat];
    if (!rule) return manualItems; // 전체 or 미정의 → 전체 표시
    return manualItems.filter(item => {
      if (rule.source) return item.source === rule.source;
      if (rule.tag)    return item.tag === rule.tag;
      return true;
    });
  }, [manualItems, activeCat]);

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
    setSearchQuery('');
    setSearch('');
    if (cat.source !== 'manual') {
      fetchProducts(cat.query, cat.source);
    }
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
    : activeCat === '⭐ 추천'
    ? '⭐ 추천 낚시 상품'
    : activeCat === '전체'
    ? '전체 상품 (Coupang + AliExpress)'
    : `${activeCat} 상품`;

  return (
    <>
    <div className="page-container" style={{ backgroundColor: '#F8F9FA', paddingBottom: '80px' }}>

      {/* ── 헤더 + 검색 ── */}
      <div style={{ backgroundColor: '#fff', padding: '10px 16px 8px', position: 'sticky', top: 'calc(var(--safe-top) + 60px)', zIndex: 100, borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <ShoppingBag size={16} color="#0056D2" />
          <h1 style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '950', color: '#1c1c1e', letterSpacing: '-0.03em', margin: 0 }}>
            낚시 장비 쇼핑
          </h1>
          {isAdmin ? (
            <button
              onClick={() => setShowRegForm(true)}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '10px', background: 'linear-gradient(135deg,#FF9B26,#FF6B00)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', flexShrink: 0 }}
            >
              <Plus size={13} strokeWidth={3} />
              상품 등록
            </button>
          ) : (
            <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '700', color: '#8E8E93', marginLeft: 'auto' }}>
              Coupang + AliExpress 🎣
            </span>
          )}
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
      {!searchQuery && activeCat !== '⭐ 추천' && promos.length > 0 && (
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


      {/* ── ⭐ 추천 탭: 수동 등록 상품 그리드 ── */}
      {activeCat === '⭐ 추천' && (
        <div style={{ padding: '12px 12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <span style={{ fontSize: '16px' }}>⭐</span>
            <span style={{ fontSize: 'calc(14px * var(--fs, 1))', fontWeight: '900', color: '#1c1c1e' }}>추천 낚시 상품</span>
            <span style={{ fontSize: 'calc(11px * var(--fs, 1))', color: '#8E8E93', fontWeight: '700' }}>({filteredManualItems.length}개)</span>
          </div>
          {filteredManualItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#C7C7CC', fontSize: 'calc(13px * var(--fs, 1))', fontWeight: '700' }}>
              등록된 추천 상품이 없습니다
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {filteredManualItems.map(item => (
                <div key={item._id} style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', background: '#fff', border: '1px solid #F0F0F0' }}>
                  <a href={item.shortUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                    {item.source === 'ali' ? (
                      <>
                        <img src={item.imageUrl} alt={item.productName || '상품'} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
                        <div style={{ padding: '8px 10px 10px' }}>
                          <span style={{ display: 'inline-block', background: '#FF6900', color: '#fff', fontSize: '8px', fontWeight: '900', padding: '2px 5px', borderRadius: '4px', marginBottom: '4px' }}>AliExpress</span>
                          {item.productName && (
                            <div style={{ fontSize: 'calc(11px * var(--fs, 1))', fontWeight: '700', color: '#1c1c1e', lineHeight: '1.35', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.productName}</div>
                          )}
                        </div>
                      </>
                    ) : (
                      <iframe src={item.iframeSrc} width="100%" height={240} frameBorder={0} scrolling="no" referrerPolicy="unsafe-url" title={`쿠팡 상품 ${item.tag}`} style={{ display: 'block', pointerEvents: 'none' }} />
                    )}
                  </a>
                  {isAdmin && (
                    <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(item); }} style={{ position: 'absolute', top: '6px', right: '6px', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,59,48,0.93)', border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }} title="삭제">
                      <X size={13} color="#fff" strokeWidth={3} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
{activeCat !== '⭐ 추천' && (
      <>
      {/* ── 카테고리별 추천 상품 (수동 등록) ── */}
      {filteredManualItems.length > 0 && (
        <div style={{ padding: '12px 12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px' }}>⭐</span>
            <span style={{ fontSize: 'calc(13px * var(--fs, 1))', fontWeight: '900', color: '#1c1c1e' }}>관련 등록 상품</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
            {filteredManualItems.map(item => (
              <div key={item._id} style={{ flexShrink: 0, position: 'relative' }}>
                {item.source === 'ali' ? (
                  <a href={item.shortUrl} target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'flex', flexDirection: 'column', width: '110px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #F0F0F0', background: '#fff', textDecoration: 'none' }}>
                    <div style={{ position: 'relative' }}>
                      <img src={item.imageUrl} alt={item.productName || '상품'} style={{ width: '110px', height: '110px', objectFit: 'cover', display: 'block' }} />
                      <span style={{ position: 'absolute', top: '4px', left: '4px', background: '#FF6900', color: '#fff', fontSize: '8px', fontWeight: '900', padding: '2px 5px', borderRadius: '4px' }}>AliExpress</span>
                    </div>
                    {item.productName && <div style={{ padding: '5px 6px', fontSize: 'calc(10px * var(--fs, 1))', fontWeight: '700', color: '#1c1c1e', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.productName}</div>}
                  </a>
                ) : (
                  <a href={item.shortUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #F0F0F0', background: '#fff', textDecoration: 'none' }}>
                    <iframe src={item.iframeSrc} width={110} height={220} frameBorder={0} scrolling="no" referrerPolicy="unsafe-url" title={쿠팡 } style={{ display: 'block', pointerEvents: 'none' }} />
                  </a>
                )}
                {isAdmin && (
                  <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(item); }} style={{ position: 'absolute', top: '4px', right: '4px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,59,48,0.93)', border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }} title="삭제">
                    <X size={11} color="#fff" strokeWidth={3} />
                  </button>
                )}
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

      </>
      )}

      {/* ── 파트너스 공시 ── */}
      <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
        <div style={{ width: '100%', height: '1px', backgroundColor: '#F0F0F0', marginBottom: '16px' }} />
        <p style={{ fontSize: `calc(10px * var(--fs, 1))`, color: '#bbb', lineHeight: 1.7, fontWeight: '600' }}>
          이 포스팅은 쿠팡 파트너스 및 알리익스프레스 어필리에이트 활동의 일환으로,<br />
          이에 따른 일정액의 수수료를 제공받을 수 있습니다.
        </p>
      </div>
    </div>

      {/* ── MASTER 상품 등록 모달 ── */}
      {isAdmin && showRegForm && (
        <div
          onClick={() => setShowRegForm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '480px', background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 16px 40px', maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🛒</span>
                <span style={{ fontSize: '16px', fontWeight: '900', color: '#1c1c1e' }}>상품 등록</span>
                <span style={{ fontSize: '10px', background: 'linear-gradient(135deg,#FF9B26,#FF6B00)', color: '#fff', padding: '2px 7px', borderRadius: '6px', fontWeight: '900' }}>MASTER</span>
              </div>
              <button onClick={() => setShowRegForm(false)} style={{ background: '#F2F2F7', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#1c1c1e" />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {['coupang','ali'].map(s => (
                <button key={s} onClick={() => setRegSrc(s)}
                  style={{ flex: 1, padding: '10px', borderRadius: '12px', border: `2px solid ${regSrc===s?(s==='coupang'?'#0056D2':'#FF6900'):'#F2F2F7'}`, background: regSrc===s?(s==='coupang'?'#EFF5FF':'#FFF3EC'):'#F2F2F7', fontWeight: '900', fontSize: '13px', cursor: 'pointer', color: regSrc===s?(s==='coupang'?'#0056D2':'#FF6900'):'#8E8E93' }}
                >{s==='coupang'?'🛒 쿠팡':'💰 알리'}</button>
              ))}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '6px' }}>단축 URL *</div>
              <input value={regShortUrl} onChange={e=>setRegShortUrl(e.target.value)} placeholder="https://link.coupang.com/a/xxxx"
                style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {regSrc==='coupang' && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '6px' }}>iframe 코드 *</div>
                <textarea value={regIframeCode} onChange={e=>setRegIframeCode(e.target.value)}
                  placeholder='<iframe src="https://coupa.ng/xxxx" ...></iframe>' rows={3}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: '12px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'monospace' }} />
              </div>
            )}
            {regSrc==='ali' && (<>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '6px' }}>상품 이미지 URL *</div>
                <input value={regImageUrl} onChange={e=>setRegImageUrl(e.target.value)} placeholder="https://ae01.alicdn.com/..."
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '6px' }}>상품명</div>
                <input value={regProductName} onChange={e=>setRegProductName(e.target.value)} placeholder="낚시 루어 세트 10개입"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </>)}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '8px' }}>카테고리</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {SHOP_TAGS.map(t => (
                  <button key={t} onClick={() => setRegTag(t)}
                    style={{ padding: '7px 12px', borderRadius: '10px', border: 'none', background: regTag===t?'#1c1c1e':'#F2F2F7', color: regTag===t?'#fff':'#8E8E93', fontSize: '12px', fontWeight: '850', cursor: 'pointer' }}
                  >{t}</button>
                ))}
              </div>
            </div>
            {regMsg && (
              <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: '800', color: regMsg.startsWith('✅')?'#00C48C':regMsg.startsWith('⏳')?'#FF9B26':'#FF3B30', marginBottom: '12px' }}>
                {regMsg}
              </div>
            )}
            <button onClick={handleRegSubmit} disabled={regLoading}
              style={{ width: '100%', padding: '15px', borderRadius: '14px', border: 'none', background: regLoading?'#C7C7CC':'linear-gradient(135deg,#0056D2,#003899)', color: '#fff', fontSize: '15px', fontWeight: '900', cursor: regLoading?'not-allowed':'pointer' }}
            >{regLoading?'⏳ 등록 중...':'+ 쇼핑탭에 등록'}</button>
          </div>
        </div>
      )}

    </>
  );
}