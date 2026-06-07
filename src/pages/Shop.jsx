import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Zap, ShoppingBag, Search, SlidersHorizontal, X, Plus, ChevronDown } from 'lucide-react';
import apiClient from '../api/index';
import { useUserStore } from '../store/useUserStore';

const API_BASE   = 'https://fishing-go-backend.onrender.com';
const DIRECT_KEY = 'FishingGO_Admin_Direct_2026';
const COUPANG_PARTNERS_ID = import.meta.env.VITE_COUPANG_PARTNERS_ID || '';

const SHOP_TAGS = ['추천','낚시용품','루어/채비','릴/로드','라인/원줄','낚시복','가방/케이스','액세서리','기타'];

// ── 카테고리 정의 ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',    name: '전체',         query: '낚시용품',    source: 'all'     },
  { id: 'rec',    name: '⭐ 추천',      query: '',           source: 'manual'  },
  { id: 'lure',   name: '🎣 루어/채비', query: '루어채비',   source: 'ali'     },
  { id: 'reel',   name: '🎡 릴/로드',   query: '낚시릴낚싯대', source: 'ali'   },
  { id: 'line',   name: '🧵 낚시줄',   query: '낚시줄',     source: 'ali'     },
  { id: 'hook',   name: '🪝 낚시바늘', query: '낚시바늘',   source: 'ali'     },
  { id: 'acc',    name: '🎒 액세서리', query: '낚시액세서리', source: 'ali'   },
  { id: 'cp',     name: '🛒 쿠팡',    query: '낚시용품',   source: 'coupang' },
];

const SOURCE_STYLE = {
  coupang: { bg: '#0056D2', text: '#fff', label: 'Coupang' },
  ali:     { bg: '#FF6900', text: '#fff', label: 'AliExpress' },
};

// ── 이미지 컴포넌트 (오류 시 emoji placeholder) ─────────────────────────────────
const CAT_EMOJI = { coupang: '🛒', ali: '🎣', default: '🎣' };
function ProductImage({ src, alt, source }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div style={{
        width: '100%', aspectRatio: '1/1', backgroundColor: '#E8F4FE',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
      }}>
        {CAT_EMOJI[source] || CAT_EMOJI.default}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt || '상품'}
      onError={() => setFailed(true)}
      style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }}
    />
  );
}

// ── CAT_MANUAL_FILTER ─────────────────────────────────────────────────────────
const CAT_MANUAL_FILTER = {
  '전체':          null,
  '⭐ 추천':       null,
  '🛒 쿠팡':       { source: 'coupang' },
  '🎣 루어/채비':  { tag: '루어/채비' },
  '🎡 릴/로드':    { tag: '릴/로드' },
  '🧵 낚시줄':     { tag: '라인/원줄' },
  '🪝 낚시바늘':   { tag: '낚시용품' },
  '🎒 액세서리':   { tag: '액세서리' },
};

export default function Shop() {
  const [products,    setProducts]    = useState([]);
  const [promos,      setPromos]      = useState([]);
  const [manualItems, setManualItems] = useState([]);
  const [search,      setSearch]      = useState('');
  const [activeCat,   setActiveCat]   = useState('전체');
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore,     setHasMore]     = useState(false);
  const [page,        setPage]        = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [promoLoading,setPromoLoading]= useState(true);

  // 현재 카테고리 params (무한 스크롤 시 참조)
  const curQueryRef  = useRef('낚시용품');
  const curSourceRef = useRef('all');
  const sentinelRef  = useRef(null);

  // ── MASTER 전용 ───────────────────────────────────────────────────────────────
  const isAdmin = useUserStore(s => s.isAdmin());
  const [showRegForm,    setShowRegForm]    = useState(false);
  const [regSrc,         setRegSrc]         = useState('coupang');
  const [regTag,         setRegTag]         = useState('추천');
  const [regShortUrl,    setRegShortUrl]    = useState('');
  const [regIframeCode,  setRegIframeCode]  = useState('');
  const [regImageUrl,    setRegImageUrl]    = useState('');
  const [regProductName, setRegProductName] = useState('');
  const [regMsg,         setRegMsg]         = useState('');
  const [regLoading,     setRegLoading]     = useState(false);
  const [regResolving,   setRegResolving]   = useState(false); // 자동조회 중
  const [regResolved,    setRegResolved]    = useState(false); // 조회 완료 상태
  const [regNeedManual,  setRegNeedManual]  = useState(false); // 직접 입력 필요

  // ── 상품 등록/삭제 ────────────────────────────────────────────────────────────
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

  // ── 상품 로드 ─────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (category, source, pageNum = 1) => {
    if (pageNum === 1) {
      setLoading(true);
      setProducts([]);
      setPage(1);
    } else {
      setLoadingMore(true);
    }
    try {
      const res = await apiClient.get(
        `/api/shop/products?category=${encodeURIComponent(category)}&source=${source}&page=${pageNum}&limit=9`
      );
      // 새 API: { items, hasMore, total } / 구 API: array
      const data = res.data;
      const newItems = Array.isArray(data) ? data : (data.items || []);
      const more     = Array.isArray(data) ? false : (data.hasMore || false);
      if (pageNum === 1) {
        setProducts(newItems);
      } else {
        setProducts(prev => {
          const existIds = new Set(prev.map(p => p.id));
          return [...prev, ...newItems.filter(p => !existIds.has(p.id))];
        });
      }
      setHasMore(more);
      setPage(pageNum);
    } catch (err) {
      if (!import.meta.env.PROD) console.error('[Shop] 상품 로드 실패', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // ── 알리 특가 ─────────────────────────────────────────────────────────────────
  const fetchPromo = useCallback(async () => {
    try {
      setPromoLoading(true);
      const res = await apiClient.get('/api/shop/promo');
      setPromos(res.data);
    } catch { /* silent */ } finally { setPromoLoading(false); }
  }, []);

  // ── 초기 로드 ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchProducts('낚시용품', 'all', 1);
    fetchPromo();
    apiClient.get('/api/shop/manual').then(r => setManualItems(r.data || [])).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 무한 스크롤: IntersectionObserver ────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    fetchProducts(curQueryRef.current, curSourceRef.current, page + 1);
  }, [hasMore, loadingMore, loading, page, fetchProducts]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMore();
    }, { threshold: 0.1 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // ── 검색 ──────────────────────────────────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const q = search.trim();
    if (!q) return;
    setSearchQuery(q);
    setActiveCat('');
    curQueryRef.current  = q;
    curSourceRef.current = 'all';
    fetchProducts(q, 'all', 1);
  };

  const clearSearch = () => {
    setSearch(''); setSearchQuery(''); setActiveCat('전체');
    curQueryRef.current  = '낚시용품';
    curSourceRef.current = 'all';
    fetchProducts('낚시용품', 'all', 1);
  };

  // ── 카테고리 클릭 ─────────────────────────────────────────────────────────────
  const handleCatClick = (cat) => {
    setActiveCat(cat.name);
    setSearchQuery(''); setSearch('');
    if (cat.source !== 'manual') {
      curQueryRef.current  = cat.query;
      curSourceRef.current = cat.source;
      fetchProducts(cat.query, cat.source, 1);
    }
  };

  // ── 상품 클릭 ────────────────────────────────────────────────────────────────
  const handleProductClick = (product) => {
    let url = product.link;
    if (product.source === 'coupang' && COUPANG_PARTNERS_ID && url && !url.includes('lptag=')) {
      url = `${url}${url.includes('?') ? '&' : '?'}lptag=${COUPANG_PARTNERS_ID}`;
    }
    apiClient.post('/api/shop/click', {
      productId: product.id,
      source: product.source || 'ali',
      keyword: searchQuery || activeCat || '쇼핑탭',
    }).catch(() => {});
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ── 수동 상품 필터 ────────────────────────────────────────────────────────────
  const filteredManualItems = useMemo(() => {
    const rule = CAT_MANUAL_FILTER[activeCat];
    if (!rule) return manualItems;
    return manualItems.filter(item => {
      if (rule.source) return item.source === rule.source;
      if (rule.tag)    return item.tag === rule.tag;
      return true;
    });
  }, [manualItems, activeCat]);

  // ── 헤더 타이틀 ───────────────────────────────────────────────────────────────
  const gridTitle = searchQuery
    ? `🔍 "${searchQuery}" 검색결과`
    : activeCat === '⭐ 추천'
    ? '⭐ 추천 낚시 상품'
    : activeCat === '전체'
    ? '전체 상품'
    : `${activeCat} 상품`;

  const isManualCat = activeCat === '⭐ 추천';

  return (
    <>
    <div className="page-container" style={{ backgroundColor: '#F8F9FA', paddingBottom: '80px' }}>

      {/* ── 헤더 + 검색 ── */}
      <div style={{ backgroundColor: '#fff', padding: '10px 16px 8px', position: 'sticky', top: 'calc(var(--safe-top) + 60px)', zIndex: 100, borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <ShoppingBag size={16} color="#0056D2" />
          <h1 style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '950', color: '#1c1c1e', letterSpacing: '-0.03em', margin: 0 }}>낚시 장비 쇼핑</h1>
          {isAdmin ? (
            <button
              onClick={() => setShowRegForm(true)}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '10px', background: 'linear-gradient(135deg,#FF9B26,#FF6B00)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', flexShrink: 0 }}
            >
              <Plus size={13} strokeWidth={3} /> 상품 등록
            </button>
          ) : (
            <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '700', color: '#8E8E93', marginLeft: 'auto' }}>
              🎣
            </span>
          )}
        </div>
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
          <input
            type="text" placeholder="낚시 장비 검색" value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 40px 10px 40px', backgroundColor: '#F2F2F7', border: `1.5px solid ${searchQuery ? '#0056D2' : 'transparent'}`, borderRadius: '14px', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
          />
          <Search size={16} color="#8E8E93" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          {(search || searchQuery) && (
            <button type="button" onClick={clearSearch} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: '#C7C7CC', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
              <X size={11} color="#fff" strokeWidth={3} />
            </button>
          )}
        </form>
        {searchQuery && <div style={{ marginTop: '6px', fontSize: `calc(11px * var(--fs, 1))`, color: '#0056D2', fontWeight: '800', paddingLeft: '4px' }}>🔍 검색 중</div>}
      </div>

      {/* ── 카테고리 탭 ── */}
      <div style={{ backgroundColor: '#fff', padding: '6px 16px 8px', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
          {CATEGORIES.map((c) => (
            <div key={c.name} onClick={() => handleCatClick(c)} style={{ padding: '6px 12px', backgroundColor: activeCat === c.name ? '#1c1c1e' : '#F2F2F7', borderRadius: '10px', color: activeCat === c.name ? '#fff' : '#8E8E93', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '850', whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}>
              {c.name}
            </div>
          ))}
        </div>
      </div>

      {/* ── AliExpress 특가 배너 ── */}
      {!searchQuery && !isManualCat && promos.length > 0 && (
        <div style={{ padding: '12px 12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Zap size={15} color="#FF6900" fill="#FF6900" />
            <span style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: '#1c1c1e' }}>낚시GO 오늘 특가 🔥</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '4px' }}>
            {promoLoading
              ? [1, 2, 3, 4, 5, 6].map(n => <div key={n} style={{ height: '110px', backgroundColor: '#eee', borderRadius: '14px', animation: 'pulse 1.5s infinite' }} />)
              : promos.slice(0, 6).map(p => (
                  <div key={p.id} onClick={() => handleProductClick(p)} style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#fff8f3', border: '1px solid #FFE0CC', borderRadius: '14px', padding: '8px', cursor: 'pointer' }}>
                    <div style={{ width: '54px', height: '54px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                      <ProductImage src={p.img} alt={p.name} source="ali" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: `calc(9px * var(--fs, 1))`, fontWeight: '900', marginBottom: '2px',
                        color: p.badge?.includes('역대') ? '#7B2FF7' : p.badge?.includes('초특가') ? '#0056D2' : '#FF6900' }}>
                        {p.badge}
                      </div>
                      <div style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', color: '#1c1c1e', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.name}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                        {p.price && p.price !== '0' && p.price !== '0원'
                          ? (<>
                              <span style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '950', color: '#FF5A5F' }}>{p.price}원</span>
                              {p.discount && p.discount !== '0%' && <span style={{ fontSize: `calc(9px * var(--fs, 1))`, color: '#FF6900', fontWeight: '800' }}>({p.discount}↓)</span>}
                            </>)
                          : (<span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', color: '#FF6900', background: '#FFF3EC', borderRadius: '6px', padding: '2px 7px', border: '1px solid #FFD4B0' }}>가격 확인하기 →</span>)
                        }
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      )}

      {/* ── ⭐ 추천 탭 ── */}
      {isManualCat && (
        <div style={{ padding: '12px 12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <span style={{ fontSize: '16px' }}>⭐</span>
            <span style={{ fontSize: 'calc(14px * var(--fs, 1))', fontWeight: '900', color: '#1c1c1e' }}>추천 낚시 상품</span>
            <span style={{ fontSize: 'calc(11px * var(--fs, 1))', color: '#8E8E93', fontWeight: '700' }}>({manualItems.length}개)</span>
          </div>
          {manualItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#C7C7CC', fontSize: 'calc(13px * var(--fs, 1))', fontWeight: '700' }}>등록된 추천 상품이 없습니다</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {manualItems.map(item => (
                <div key={item._id} style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', background: '#fff', border: '1px solid #F0F0F0' }}>
                  <a href={item.shortUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                    {item.source === 'ali' ? (
                      <>
                        <ProductImage src={item.imageUrl} alt={item.productName} source="ali" />
                        <div style={{ padding: '8px 10px 10px' }}>

                          {item.productName && <div style={{ fontSize: 'calc(11px * var(--fs, 1))', fontWeight: '700', color: '#1c1c1e', lineHeight: '1.35', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.productName}</div>}
                        </div>
                      </>
                    ) : (
                      <iframe src={item.iframeSrc} width="100%" height={240} frameBorder={0} scrolling="no" referrerPolicy="unsafe-url" title={`쿠팡 ${item.tag}`} style={{ display: 'block', pointerEvents: 'none' }} />
                    )}
                  </a>
                  {isAdmin && (
                    <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(item); }} style={{ position: 'absolute', top: '6px', right: '6px', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,59,48,0.93)', border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                      <X size={13} color="#fff" strokeWidth={3} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 상품 그리드 (추천 탭 제외) ── */}
      {!isManualCat && (
        <div style={{ padding: '12px 12px 0' }}>
          {/* 헤더 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px', paddingLeft: '4px' }}>
            <h3 style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', color: '#1c1c1e', margin: 0 }}>{gridTitle}</h3>
            <SlidersHorizontal size={15} color="#8E8E93" />
          </div>

          {/* 파트너스 공시 (최소화) */}
          <p style={{ margin: '0 0 10px 4px', fontSize: `calc(9px * var(--fs, 1))`, color: '#C7C7CC', fontWeight: '600', lineHeight: 1.4 }}>
            쿠팡 파트너스 · AliExpress 발생하는 소정의 수수료는 낚시GO 서비스 운영에 사용됩니다 🎣
          </p>

          {/* 수동 등록 관련 상품 (횡스크롤) */}
          {filteredManualItems.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px' }}>⭐</span>
                <span style={{ fontSize: 'calc(13px * var(--fs, 1))', fontWeight: '900', color: '#1c1c1e' }}>관련 등록 상품</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                {filteredManualItems.map(item => (
                  <div key={item._id} style={{ flexShrink: 0, position: 'relative' }}>
                    {item.source === 'ali' ? (
                      <a href={item.shortUrl} target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'flex', flexDirection: 'column', width: '110px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #F0F0F0', background: '#fff', textDecoration: 'none' }}>
                        <div style={{ position: 'relative', width: '110px', height: '110px', overflow: 'hidden' }}>
                          <ProductImage src={item.imageUrl} alt={item.productName} source="ali" />

                        </div>
                        {item.productName && <div style={{ padding: '5px 6px', fontSize: 'calc(10px * var(--fs, 1))', fontWeight: '700', color: '#1c1c1e', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.productName}</div>}
                      </a>
                    ) : (
                      <a href={item.shortUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #F0F0F0', background: '#fff', textDecoration: 'none' }}>
                        <iframe src={item.iframeSrc} width={110} height={220} frameBorder={0} scrolling="no" referrerPolicy="unsafe-url" title={`쿠팡 ${item.tag}`} style={{ display: 'block', pointerEvents: 'none' }} />
                      </a>
                    )}
                    {isAdmin && (
                      <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(item); }} style={{ position: 'absolute', top: '4px', right: '4px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,59,48,0.93)', border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        <X size={11} color="#fff" strokeWidth={3} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 상품 그리드 (3열) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {loading
              ? [1,2,3,4,5,6,7,8,9].map(n => (
                  <div key={n} style={{ height: '200px', backgroundColor: '#eee', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
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
                  const srcStyle = SOURCE_STYLE[p.source] || SOURCE_STYLE.ali;
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
                      <div style={{ position: 'relative', width: '100%' }}>
                        <ProductImage src={p.img} alt={p.name} source={p.source} />
                      </div>
                      {/* 정보 */}
                      <div style={{ padding: '8px' }}>
                        <div style={{ fontSize: `calc(9px * var(--fs, 1))`, color: srcStyle.bg, fontWeight: '900', marginBottom: '2px' }}>{p.badge}</div>
                        <h3 style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '850', color: '#1c1c1e', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', margin: '0 0 4px' }}>
                          {p.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginTop: '2px' }}>
                          {p.price && p.price !== '0' && p.price !== '0원'
                            ? (<>
                                <span style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '950', color: '#FF5A5F' }}>{p.price}</span>
                                <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', color: '#1c1c1e' }}>원</span>
                              </>)
                            : (<span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', color: '#FF6900', background: '#FFF3EC', borderRadius: '6px', padding: '2px 7px', border: '1px solid #FFD4B0' }}>가격 확인하기 →</span>)
                          }
                        </div>
                        {/* 수수료율: 마스터 로그인 시에만 표시 */}
                        {isAdmin && p.source === 'ali' && p.commission && (
                          <div style={{ fontSize: `calc(8px * var(--fs, 1))`, color: '#FF6900', fontWeight: '800', marginTop: '2px', background: '#FFF3EC', borderRadius: '4px', padding: '1px 4px', display: 'inline-block' }}>
                            수수료 {p.commission}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>

          {/* 추가 로딩 스켈레톤 */}
          {loadingMore && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px' }}>
              {[1,2,3].map(n => <div key={n} style={{ height: '200px', backgroundColor: '#eee', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />)}
            </div>
          )}

          {/* 더 보기 버튼 (IntersectionObserver 대체용) */}
          {hasMore && !loadingMore && (
            <button
              onClick={loadMore}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', margin: '16px 0', padding: '12px', borderRadius: '14px', background: '#F2F2F7', border: 'none', cursor: 'pointer', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: '#1c1c1e' }}
            >
              <ChevronDown size={16} /> 더 보기
            </button>
          )}

          {/* 무한 스크롤 sentinel */}
          <div ref={sentinelRef} style={{ height: '1px' }} />
        </div>
      )}

      {/* 파트너스 공시 */}
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
      <div onClick={() => setShowRegForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 16px 40px', maxHeight: '85vh', overflowY: 'auto' }}>
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
              <button key={s} onClick={() => setRegSrc(s)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: `2px solid ${regSrc===s?(s==='coupang'?'#0056D2':'#FF6900'):'#F2F2F7'}`, background: regSrc===s?(s==='coupang'?'#EFF5FF':'#FFF3EC'):'#F2F2F7', fontWeight: '900', fontSize: '13px', cursor: 'pointer', color: regSrc===s?(s==='coupang'?'#0056D2':'#FF6900'):'#8E8E93' }}>
                {s==='coupang'?'🛒 쿠팡':'💰 알리'}
              </button>
            ))}
          </div>
          {/* 쿠팡일 때만 단축 URL 필드 표시 (알리는 위 자동조회 박스에 통합) */}
          {regSrc === 'coupang' && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '6px' }}>단축 URL *</div>
              <input value={regShortUrl} onChange={e=>setRegShortUrl(e.target.value)} placeholder="https://link.coupang.com/a/xxxx" style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}
          {regSrc==='coupang' && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '6px' }}>iframe 코드 *</div>
              <textarea value={regIframeCode} onChange={e=>setRegIframeCode(e.target.value)} placeholder='<iframe src="https://coupa.ng/xxxx" ...></iframe>' rows={3} style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: '12px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'monospace' }} />
            </div>
          )}
          {regSrc==='ali' && (<>
            {/* 🔄 자동 조회 버튼 */}
            <div style={{ marginBottom: '14px', background: 'linear-gradient(135deg,#FFF3EC,#FFF8F5)', border: '1.5px solid #FFD0B0', borderRadius: '14px', padding: '12px 14px' }}>
              <div style={{ fontSize: '12px', fontWeight: '900', color: '#FF6900', marginBottom: '8px' }}>⚡ 트래킹 링크 자동 조회</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  value={regShortUrl}
                  onChange={e => setRegShortUrl(e.target.value)}
                  placeholder="https://s.click.aliexpress.com/e/_xxx"
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #FFB080', fontSize: '12px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  disabled={regResolving || !regShortUrl.trim()}
                  onClick={async () => {
                    if (!regShortUrl.trim()) return;
                    setRegResolving(true); setRegMsg('🔍 상품 정보 조회 중...');
                    try {
                      const res = await fetch(`${API_BASE}/api/shop/ali-resolve?key=${DIRECT_KEY}&url=${encodeURIComponent(regShortUrl.trim())}`);
                      const data = await res.json();
                      if (data.ok) {
                        if (data.imageUrl) setRegImageUrl(data.imageUrl);
                        if (data.title)    setRegProductName(data.title);
                        // 이미지/제목 없으면 직접 입력 안내
                        if (!data.imageUrl || !data.title) {
                          setRegNeedManual(true);
                          setRegMsg(`✅ 상품 ID ${data.productId} 확인! 이미지/제목을 직접 입력해주세요 ↓`);
                        } else {
                          setRegNeedManual(false);
                          setRegMsg(`✅ 조회 완료! ${data.title?.slice(0,20) || ''}`);
                        }
                        setRegResolved(true);
                      } else {
                        setRegNeedManual(true);
                        setRegResolved(false);
                        setRegMsg(`⚠️ ${data.error || '조회 실패 — 직접 입력해주세요'}`);
                      }
                    } catch(e) { setRegMsg(`❌ 오류: ${e.message}`); }
                    finally { setRegResolving(false); }
                  }}
                  style={{ padding: '10px 14px', borderRadius: '10px', background: regResolving ? '#C7C7CC' : 'linear-gradient(135deg,#FF9B26,#FF6900)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: '900', cursor: regResolving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {regResolving ? '⏳' : '🔍 자동조회'}
                </button>
              </div>
              <div style={{ fontSize: '11px', color: '#FF8040', fontWeight: '700', marginTop: '6px' }}>포털 Product Link (s.click.aliexpress.com/e/...)를 붙여넣으세요</div>
            </div>
            {/* 미리보기 */}
            {regImageUrl && (
              <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center', background: '#F9F9F9', borderRadius: '12px', padding: '10px' }}>
                <img src={regImageUrl} alt="미리보기" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #E5E5EA' }} onError={e => e.target.style.display='none'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#FF6900', marginBottom: '2px' }}>상품 미리보기</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1c1c1e', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{regProductName || '상품명 없음'}</div>
                </div>
              </div>
            )}
            {/* 수동 입력 (자동조회 실패 시 또는 이미지 없을 때 자동 표시) */}
            <details open={regNeedManual} style={{ marginBottom: '10px' }}>
              <summary style={{ fontSize: '12px', fontWeight: '800', color: regNeedManual ? '#FF6900' : '#8E8E93', cursor: 'pointer', padding: '4px 0' }}>
                {regNeedManual ? '⚠️ 이미지/제목 직접 입력 필요' : '✏️ 직접 입력 (자동조회 실패 시)'}
              </summary>
              {regNeedManual && (
                <div style={{ background: '#FFF3EC', border: '1px solid #FFD0B0', borderRadius: '10px', padding: '8px 10px', marginTop: '6px', marginBottom: '8px', fontSize: '11px', color: '#FF6900', fontWeight: '700', lineHeight: 1.6 }}>
                  💡 서버 IP 문제로 이미지를 자동 추출하지 못합니다.<br/>
                  AliExpress 상품 페이지 → 이미지 우클릭 → "이미지 주소 복사" 후 아래 입력
                </div>
              )}
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#8E8E93', marginBottom: '4px' }}>이미지 URL</div>
                <input value={regImageUrl} onChange={e=>setRegImageUrl(e.target.value)} placeholder="https://ae01.alicdn.com/..." style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1.5px solid ${regNeedManual && !regImageUrl ? '#FF6900' : '#E5E5EA'}`, fontSize: '12px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }} />
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#8E8E93', marginBottom: '4px' }}>상품명</div>
                <input value={regProductName} onChange={e=>setRegProductName(e.target.value)} placeholder="낚시 루어 세트 10개입" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1.5px solid ${regNeedManual && !regProductName ? '#FF6900' : '#E5E5EA'}`, fontSize: '12px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </details>
          </>)}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '8px' }}>카테고리</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SHOP_TAGS.map(t => (
                <button key={t} onClick={() => setRegTag(t)} style={{ padding: '7px 12px', borderRadius: '10px', border: 'none', background: regTag===t?'#1c1c1e':'#F2F2F7', color: regTag===t?'#fff':'#8E8E93', fontSize: '12px', fontWeight: '850', cursor: 'pointer' }}>{t}</button>
              ))}
            </div>
          </div>
          {regMsg && <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: '800', color: regMsg.startsWith('✅')?'#00C48C':regMsg.startsWith('⏳')?'#FF9B26':'#FF3B30', marginBottom: '12px' }}>{regMsg}</div>}
          <button onClick={handleRegSubmit} disabled={regLoading} style={{ width: '100%', padding: '15px', borderRadius: '14px', border: 'none', background: regLoading?'#C7C7CC':'linear-gradient(135deg,#0056D2,#003899)', color: '#fff', fontSize: '15px', fontWeight: '900', cursor: regLoading?'not-allowed':'pointer' }}>
            {regLoading?'⏳ 등록 중...':'+ 쇼핑탭에 등록'}
          </button>
        </div>
      </div>
    )}
    </>
  );
}