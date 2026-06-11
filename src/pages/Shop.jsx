import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Zap, ShoppingBag, Search, SlidersHorizontal, X, Plus, ChevronDown } from 'lucide-react';
import apiClient from '../api/index';
import { useUserStore } from '../store/useUserStore';

const API_BASE   = 'https://fishing-go-backend.onrender.com';
const DIRECT_KEY = 'sunjulab_910414';
const COUPANG_PARTNERS_ID = import.meta.env.VITE_COUPANG_PARTNERS_ID || '';

const SHOP_TAGS = ['異붿쿇','?싳떆?⑺뭹','猷⑥뼱/梨꾨퉬','由?濡쒕뱶','?쇱씤/?먯쨪','?싳떆蹂?,'媛諛?耳?댁뒪','?≪꽭?쒕━','湲고?'];

// ?? 移댄뀒怨좊━ ?뺤쓽 ???????????????????????????????????????????????????????????????
const CATEGORIES = [
  { id: 'all',    name: '?꾩껜',         query: '?싳떆?⑺뭹',    source: 'all'     },
  { id: 'rec',    name: '狩?異붿쿇',      query: '',           source: 'manual'  },
  { id: 'lure',   name: '?렍 猷⑥뼱/梨꾨퉬', query: '猷⑥뼱梨꾨퉬',   source: 'ali'     },
  { id: 'reel',   name: '?렊 由?濡쒕뱶',   query: '?싳떆由대굾???', source: 'ali'   },
  { id: 'line',   name: '?㏊ ?싳떆以?,   query: '?싳떆以?,     source: 'ali'     },
  { id: 'hook',   name: '?첐 ?싳떆諛붾뒛', query: '?싳떆諛붾뒛',   source: 'ali'     },
  { id: 'acc',    name: '?럲 ?≪꽭?쒕━', query: '?싳떆?≪꽭?쒕━', source: 'ali'   },
  { id: 'cp',     name: '?썟 荑좏뙜',    query: '?싳떆?⑺뭹',   source: 'coupang' },
];

const SOURCE_STYLE = {
  coupang: { bg: '#0056D2', text: '#fff', label: 'Coupang' },
  ali:     { bg: '#FF6900', text: '#fff', label: 'AliExpress' },
};

// ?? ?대?吏 而댄룷?뚰듃 (?ㅻ쪟 ??emoji placeholder) ?????????????????????????????????
const CAT_EMOJI = { coupang: '?썟', ali: '?렍', default: '?렍' };
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
      alt={alt || '?곹뭹'}
      onError={() => setFailed(true)}
      style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }}
    />
  );
}

// ?? CAT_MANUAL_FILTER ?????????????????????????????????????????????????????????
const CAT_MANUAL_FILTER = {
  '?꾩껜':          null,
  '狩?異붿쿇':       null,
  '?썟 荑좏뙜':       { source: 'coupang' },
  '?렍 猷⑥뼱/梨꾨퉬':  { tag: '猷⑥뼱/梨꾨퉬' },
  '?렊 由?濡쒕뱶':    { tag: '由?濡쒕뱶' },
  '?㏊ ?싳떆以?:     { tag: '?쇱씤/?먯쨪' },
  '?첐 ?싳떆諛붾뒛':   { tag: '?싳떆?⑺뭹' },
  '?럲 ?≪꽭?쒕━':   { tag: '?≪꽭?쒕━' },
};

export default function Shop() {
  const [products,    setProducts]    = useState([]);
  const [promos,      setPromos]      = useState([]);
  const [manualItems, setManualItems] = useState([]);
  const [search,      setSearch]      = useState('');
  const [activeCat,   setActiveCat]   = useState('?꾩껜');
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore,     setHasMore]     = useState(false);
  const [page,        setPage]        = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [promoLoading,setPromoLoading]= useState(true);
  // ? ?ㅼ떆媛?媛寃?????????????????????????????????????????????????????????????
  // freshPrices: { [productId]: { price, discount, priceConfirm } }
  const [freshPrices,  setFreshPrices]  = useState({});
  const refreshTimerRef = useRef(null);
  const isFreshingRef   = useRef(false);

  // ?꾩옱 移댄뀒怨좊━ params (臾댄븳 ?ㅽ겕濡???李몄“)
  const curQueryRef  = useRef('?싳떆?⑺뭹');
  const curSourceRef = useRef('all');
  const sentinelRef  = useRef(null);

  // ?? MASTER ?꾩슜 ???????????????????????????????????????????????????????????????
  const isAdmin = useUserStore(s => s.isAdmin());
  const [showRegForm,    setShowRegForm]    = useState(false);
  const [regSrc,         setRegSrc]         = useState('coupang');
  const [regTag,         setRegTag]         = useState('異붿쿇');
  const [regShortUrl,    setRegShortUrl]    = useState('');
  const [regIframeCode,  setRegIframeCode]  = useState('');
  const [regImageUrl,    setRegImageUrl]    = useState('');
  const [regProductName, setRegProductName] = useState('');
  const [regMsg,         setRegMsg]         = useState('');
  const [regLoading,     setRegLoading]     = useState(false);
  const [regResolving,   setRegResolving]   = useState(false); // ?먮룞議고쉶 以?  const [regResolved,    setRegResolved]    = useState(false); // 議고쉶 ?꾨즺 ?곹깭
  const [regNeedManual,  setRegNeedManual]  = useState(false); // 吏곸젒 ?낅젰 ?꾩슂

  // ?? ?곹뭹 ?깅줉/??젣 ????????????????????????????????????????????????????????????
  const handleRegSubmit = async () => {
    if (!regShortUrl.trim()) { setRegMsg('???⑥텞 URL ?꾩닔'); return; }
    setRegLoading(true); setRegMsg('???깅줉 以?..');
    try {
      const iframeSrc = regSrc === 'coupang'
        ? (regIframeCode.match(/src=["']([^"']+)["']/i)?.[1] || '')
        : '';
      if (regSrc === 'coupang' && !iframeSrc) {
        setRegMsg('??iframe 肄붾뱶?먯꽌 src瑜?李얠쓣 ???놁뒿?덈떎'); setRegLoading(false); return;
      }
      const params = new URLSearchParams({
        key: DIRECT_KEY, source: regSrc,
        shortUrl: regShortUrl.trim(), iframeSrc,
        imageUrl: regImageUrl.trim(), productName: regProductName.trim(), tag: regTag,
      });
      const res  = await fetch(`${API_BASE}/api/shop/manual/direct?${params}`);
      const data = await res.json();
      if (data.ok) {
        setRegMsg('???깅줉 ?꾨즺!');
        setRegShortUrl(''); setRegIframeCode(''); setRegImageUrl(''); setRegProductName('');
        apiClient.get('/api/shop/manual').then(r => setManualItems(r.data || [])).catch(() => {});
        setTimeout(() => { setShowRegForm(false); setRegMsg(''); }, 1500);
      } else { setRegMsg(`??${data.error || '?깅줉 ?ㅽ뙣'}`); }
    } catch (e) { setRegMsg(`???ㅻ쪟: ${e.message}`); }
    finally { setRegLoading(false); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.tag || item.source}" ?곹뭹????젣?좉퉴??`)) return;
    try {
      const params = new URLSearchParams({ key: DIRECT_KEY, id: item._id });
      const res  = await fetch(`${API_BASE}/api/shop/manual/delete-direct?${params}`);
      const data = await res.json();
      if (data.ok) setManualItems(prev => prev.filter(i => i._id !== item._id));
      else alert(`??젣 ?ㅽ뙣: ${data.error}`);
    } catch (e) { alert(`?ㅻ쪟: ${e.message}`); }
  };

  // ?? ?곹뭹 濡쒕뱶 ?????????????????????????????????????????????????????????????????
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
      // ??API: { items, hasMore, total } / 援?API: array
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
      if (!import.meta.env.PROD) console.error('[Shop] ?곹뭹 濡쒕뱶 ?ㅽ뙣', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // ?? ?뚮━ ?밴? ?????????????????????????????????????????????????????????????????
  const fetchPromo = useCallback(async () => {
    try {
      setPromoLoading(true);
      const res = await apiClient.get('/api/shop/promo');
      setPromos(res.data);
    } catch { /* silent */ } finally { setPromoLoading(false); }
  }, []);

  // ? ?ㅼ떆媛?媛寃?諛깃렇?쇱슫??媛깆떊 (濡쒕뱶 2????productdetail.get ?몄텧) ???????
  const refreshPrices = useCallback(async (productList) => {
    if (isFreshingRef.current) return;
    const aliIds = productList
      .filter(p => p.source === 'ali' && p.id?.startsWith('ali_'))
      .map(p => p.id.replace('ali_', ''))
      .filter(Boolean)
      .slice(0, 50);
    if (aliIds.length === 0) return;
    isFreshingRef.current = true;
    try {
      const res = await apiClient.get(
        `/api/shop/price-check?ids=${aliIds.join(',')}`
      );
      const freshMap = {};
      (res.data || []).forEach(item => {
        if (item.productId) freshMap[item.productId] = item;
      });
      if (Object.keys(freshMap).length > 0) {
        setFreshPrices(prev => ({ ...prev, ...freshMap }));
      }
    } catch { /* silent */ } finally {
      isFreshingRef.current = false;
    }
  }, []);

  // ?곹뭹 濡쒕뱶 ?꾨즺 2珥????먮룞 ?ㅼ떆媛?媛깆떊
  useEffect(() => {
    if (products.length === 0) return;
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      refreshPrices(products);
    }, 2000);
    return () => clearTimeout(refreshTimerRef.current);
  }, [products, refreshPrices]);

  // ?? 珥덇린 濡쒕뱶 ?????????????????????????????????????????????????????????????????
  useEffect(() => {
    fetchProducts('?싳떆?⑺뭹', 'all', 1);
    fetchPromo();
    apiClient.get('/api/shop/manual').then(r => setManualItems(r.data || [])).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ? ?곹뭹 ?대┃: 諛붾줈 ?대룞 ??????????????????????????????????????????????????
  const handleProductClick = (product) => {
    let url = product.link;
    if (product.source === 'coupang' && COUPANG_PARTNERS_ID && url && !url.includes('lptag=')) {
      url = `${url}${url.includes('?') ? '&' : '?'}lptag=${COUPANG_PARTNERS_ID}`;
    }
    apiClient.post('/api/shop/click', {
      productId: product.id,
      source: product.source || 'ali',
      keyword: searchQuery || activeCat || '?쇳븨??,
    }).catch(() => {});
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ?? 臾댄븳 ?ㅽ겕濡? IntersectionObserver ????????????????????????????????????????
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

  // ?? 寃????????????????????????????????????????????????????????????????????????
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
    setSearch(''); setSearchQuery(''); setActiveCat('?꾩껜');
    curQueryRef.current  = '?싳떆?⑺뭹';
    curSourceRef.current = 'all';
    fetchProducts('?싳떆?⑺뭹', 'all', 1);
  };

  // ?? 移댄뀒怨좊━ ?대┃ ?????????????????????????????????????????????????????????????
  const handleCatClick = (cat) => {
    setActiveCat(cat.name);
    setSearchQuery(''); setSearch('');
    if (cat.source !== 'manual') {
      curQueryRef.current  = cat.query;
      curSourceRef.current = cat.source;
      fetchProducts(cat.query, cat.source, 1);
    }
  };


  // ?? ?섎룞 ?곹뭹 ?꾪꽣 ????????????????????????????????????????????????????????????
  const filteredManualItems = useMemo(() => {
    const rule = CAT_MANUAL_FILTER[activeCat];
    if (!rule) return manualItems;
    return manualItems.filter(item => {
      if (rule.source) return item.source === rule.source;
      if (rule.tag)    return item.tag === rule.tag;
      return true;
    });
  }, [manualItems, activeCat]);

  // ?? ?ㅻ뜑 ??댄? ???????????????????????????????????????????????????????????????
  const gridTitle = searchQuery
    ? `?뵇 "${searchQuery}" 寃?됯껐怨?
    : activeCat === '狩?異붿쿇'
    ? '狩?異붿쿇 ?싳떆 ?곹뭹'
    : activeCat === '?꾩껜'
    ? '?꾩껜 ?곹뭹'
    : `${activeCat} ?곹뭹`;

  const isManualCat = activeCat === '狩?異붿쿇';

  return (
    <>
    <div className="page-container" style={{ backgroundColor: '#F8F9FA', paddingBottom: '80px' }}>

      {/* ?? ?ㅻ뜑 + 寃???? */}
      <div style={{ backgroundColor: '#fff', padding: '10px 16px 8px', position: 'sticky', top: 'calc(var(--safe-top) + 60px)', zIndex: 100, borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <ShoppingBag size={16} color="#0056D2" />
          <h1 style={{ fontSize: `15px`, fontWeight: '950', color: '#1c1c1e', letterSpacing: '-0.03em', margin: 0 }}>?싳떆 ?λ퉬 ?쇳븨</h1>
          {isAdmin ? (
            <button
              onClick={() => setShowRegForm(true)}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '10px', background: 'linear-gradient(135deg,#FF9B26,#FF6B00)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: `11px`, fontWeight: '900', flexShrink: 0 }}
            >
              <Plus size={13} strokeWidth={3} /> ?곹뭹 ?깅줉
            </button>
          ) : (
            <span style={{ fontSize: `10px`, fontWeight: '700', color: '#8E8E93', marginLeft: 'auto' }}>
              ?렍
            </span>
          )}
        </div>
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
          <input
            type="text" placeholder="?싳떆 ?λ퉬 寃?? value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 40px 10px 40px', backgroundColor: '#F2F2F7', border: `1.5px solid ${searchQuery ? '#0056D2' : 'transparent'}`, borderRadius: '14px', fontSize: `13px`, fontWeight: '700', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
          />
          <Search size={16} color="#8E8E93" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          {(search || searchQuery) && (
            <button type="button" onClick={clearSearch} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: '#C7C7CC', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
              <X size={11} color="#fff" strokeWidth={3} />
            </button>
          )}
        </form>
        {searchQuery && <div style={{ marginTop: '6px', fontSize: `11px`, color: '#0056D2', fontWeight: '800', paddingLeft: '4px' }}>?뵇 寃??以?/div>}
      </div>

      {/* ?? 移댄뀒怨좊━ ???? */}
      <div style={{ backgroundColor: '#fff', padding: '6px 16px 8px', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
          {CATEGORIES.map((c) => (
            <div key={c.name} onClick={() => handleCatClick(c)} style={{ padding: '6px 12px', backgroundColor: activeCat === c.name ? '#1c1c1e' : '#F2F2F7', borderRadius: '10px', color: activeCat === c.name ? '#fff' : '#8E8E93', fontSize: `12px`, fontWeight: '850', whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}>
              {c.name}
            </div>
          ))}
        </div>
      </div>

      {/* ?? AliExpress ?밴? 諛곕꼫 ?? */}
      {!searchQuery && !isManualCat && promos.length > 0 && (
        <div style={{ padding: '12px 12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Zap size={15} color="#FF6900" fill="#FF6900" />
            <span style={{ fontSize: `13px`, fontWeight: '900', color: '#1c1c1e' }}>?싳떆GO ?ㅻ뒛 ?밴? ?뵦</span>
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
                      <div style={{ fontSize: `9px`, fontWeight: '900', marginBottom: '2px',
                        color: p.badge?.includes('???') ? '#7B2FF7' : p.badge?.includes('珥덊듅媛') ? '#0056D2' : '#FF6900' }}>
                        {p.badge}
                      </div>
                      <div style={{ fontSize: `10px`, fontWeight: '800', color: '#1c1c1e', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                          {p.discount && p.discount !== '0%' && (
                            <span style={{ fontSize: `11px`, fontWeight: '950', color: '#fff', background: 'linear-gradient(135deg,#FF5A5F,#FF6900)', borderRadius: '5px', padding: '1px 5px' }}>
                              {p.discount} ?좎씤
                            </span>
                          )}
                          <span style={{ fontSize: `9px`, fontWeight: '900', color: '#FF6900' }}>理쒖?媛 ?뺤씤 ??/span>
                        </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      )}

      {/* ?? 狩?異붿쿇 ???? */}
      {isManualCat && (
        <div style={{ padding: '12px 12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <span style={{ fontSize: '16px' }}>狩?/span>
            <span style={{ fontSize: '14px', fontWeight: '900', color: '#1c1c1e' }}>異붿쿇 ?싳떆 ?곹뭹</span>
            <span style={{ fontSize: '11px', color: '#8E8E93', fontWeight: '700' }}>({manualItems.length}媛?</span>
          </div>
          {manualItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#C7C7CC', fontSize: '13px', fontWeight: '700' }}>?깅줉??異붿쿇 ?곹뭹???놁뒿?덈떎</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {manualItems.map(item => (
                <div key={item._id} style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', background: '#fff', border: '1px solid #F0F0F0' }}>
                  <a href={item.shortUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                    {item.source === 'ali' ? (
                      <>
                        <ProductImage src={item.imageUrl} alt={item.productName} source="ali" />
                        <div style={{ padding: '8px 10px 10px' }}>

                          {item.productName && <div style={{ fontSize: '11px', fontWeight: '700', color: '#1c1c1e', lineHeight: '1.35', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.productName}</div>}
                        </div>
                      </>
                    ) : (
                      <iframe src={item.iframeSrc} width="100%" height={240} frameBorder={0} scrolling="no" referrerPolicy="unsafe-url" title={`荑좏뙜 ${item.tag}`} style={{ display: 'block', pointerEvents: 'none' }} />
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

      {/* ?? ?곹뭹 洹몃━??(異붿쿇 ???쒖쇅) ?? */}
      {!isManualCat && (
        <div style={{ padding: '12px 12px 0' }}>
          {/* ?ㅻ뜑 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px', paddingLeft: '4px' }}>
            <h3 style={{ fontSize: `14px`, fontWeight: '900', color: '#1c1c1e', margin: 0 }}>{gridTitle}</h3>
            <SlidersHorizontal size={15} color="#8E8E93" />
          </div>

          {/* ?뚰듃?덉뒪 怨듭떆 (理쒖냼?? */}
          <p style={{ margin: '0 0 10px 4px', fontSize: `9px`, color: '#C7C7CC', fontWeight: '600', lineHeight: 1.4 }}>
            荑좏뙜 ?뚰듃?덉뒪 쨌 AliExpress 諛쒖깮?섎뒗 ?뚯젙???섏닔猷뚮뒗 ?싳떆GO ?쒕퉬???댁쁺???ъ슜?⑸땲???렍
          </p>

          {/* ?섎룞 ?깅줉 愿???곹뭹 (?≪뒪?щ·) */}
          {filteredManualItems.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px' }}>狩?/span>
                <span style={{ fontSize: '13px', fontWeight: '900', color: '#1c1c1e' }}>愿???깅줉 ?곹뭹</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                {filteredManualItems.map(item => (
                  <div key={item._id} style={{ flexShrink: 0, position: 'relative' }}>
                    {item.source === 'ali' ? (
                      <a href={item.shortUrl} target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'flex', flexDirection: 'column', width: '110px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #F0F0F0', background: '#fff', textDecoration: 'none' }}>
                        <div style={{ position: 'relative', width: '110px', height: '110px', overflow: 'hidden' }}>
                          <ProductImage src={item.imageUrl} alt={item.productName} source="ali" />

                        </div>
                        {item.productName && <div style={{ padding: '5px 6px', fontSize: '10px', fontWeight: '700', color: '#1c1c1e', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.productName}</div>}
                      </a>
                    ) : (
                      <a href={item.shortUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #F0F0F0', background: '#fff', textDecoration: 'none' }}>
                        <iframe src={item.iframeSrc} width={110} height={220} frameBorder={0} scrolling="no" referrerPolicy="unsafe-url" title={`荑좏뙜 ${item.tag}`} style={{ display: 'block', pointerEvents: 'none' }} />
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

          {/* ?곹뭹 洹몃━??(3?? */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {loading
              ? [1,2,3,4,5,6,7,8,9].map(n => (
                  <div key={n} style={{ height: '200px', backgroundColor: '#eee', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
                ))
              : products.length === 0
              ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: '#8E8E93' }}>
                    <div style={{ fontSize: `36px`, marginBottom: '8px' }}>?렍</div>
                    <div style={{ fontSize: `14px`, fontWeight: '800', color: '#1c1c1e', marginBottom: '4px' }}>?곹뭹??遺덈윭?ㅼ? 紐삵뻽?듬땲??/div>
                    <div style={{ fontSize: `12px` }}>?좎떆 ???ㅼ떆 ?쒕룄?댁＜?몄슂</div>
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
                      {/* ?뚮옯???쇰꺼 */}
                      <div style={{ position: 'absolute', top: '6px', right: '6px', backgroundColor: srcStyle.bg, color: srcStyle.text, padding: '2px 5px', borderRadius: '5px', fontSize: `8px`, fontWeight: '900', zIndex: 2 }}>
                        {srcStyle.label}
                      </div>
                      {/* ?좎씤??*/}
                      {p.discount && p.discount !== '0%' && (
                        <div style={{ position: 'absolute', top: '6px', left: '6px', background: '#FF5A5F', color: '#fff', padding: '2px 6px', borderRadius: '6px', fontSize: `10px`, fontWeight: '900', zIndex: 2 }}>
                          {p.discount}
                        </div>
                      )}
                      {/* ?대?吏 */}
                      <div style={{ position: 'relative', width: '100%' }}>
                        <ProductImage src={p.img} alt={p.name} source={p.source} />
                      </div>
                      {/* ?뺣낫 */}
                      <div style={{ padding: '8px' }}>
                        <div style={{ fontSize: `9px`, color: srcStyle.bg, fontWeight: '900', marginBottom: '2px' }}>{p.badge}</div>
                        <h3 style={{ fontSize: `11px`, fontWeight: '850', color: '#1c1c1e', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', margin: '0 0 4px' }}>
                          {p.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                          {p.source === 'ali' ? (
                            // ?뚮━: ?좎씤??+ ?뺤씤?섍린 CTA
                            <>
                              {p.discount && p.discount !== '0%' && (
                                <span style={{ fontSize: `11px`, fontWeight: '950', color: '#fff', background: 'linear-gradient(135deg,#FF5A5F,#FF6900)', borderRadius: '5px', padding: '1px 6px' }}>
                                  {p.discount} ?좎씤
                                </span>
                              )}
                              <span style={{ fontSize: `10px`, fontWeight: '900', color: '#FF6900', background: '#FFF3EC', borderRadius: '6px', padding: '2px 7px', border: '1px solid #FFD4B0' }}>
                                理쒖?媛 ?뺤씤 ??                              </span>
                            </>
                          ) : (
                            // 荑좏뙵: 湲곗〈 媛寃??쒖떆
                            (!p.priceConfirm && p.price && p.price !== '0' && p.price !== '0??)
                              ? (<>
                                  <span style={{ fontSize: `13px`, fontWeight: '950', color: '#FF5A5F' }}>{p.price}</span>
                                  <span style={{ fontSize: `10px`, fontWeight: '800', color: '#1c1c1e' }}>??/span>
                                </>)
                              : (<span style={{ fontSize: `10px`, fontWeight: '900', color: '#0056D2', background: '#EEF3FF', borderRadius: '6px', padding: '2px 7px', border: '1px solid #C8D9FF' }}>媛寃??뺤씤?섍린 ??/span>)
                          )}
                        </div>
                        {/* ?섏닔猷뚯쑉: 留덉뒪??濡쒓렇???쒖뿉留??쒖떆 */}
                        {isAdmin && p.source === 'ali' && p.commission && (
                          <div style={{ fontSize: `8px`, color: '#FF6900', fontWeight: '800', marginTop: '2px', background: '#FFF3EC', borderRadius: '4px', padding: '1px 4px', display: 'inline-block' }}>
                            ?섏닔猷?{p.commission}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>

          {/* 異붽? 濡쒕뵫 ?ㅼ펷?덊넠 */}
          {loadingMore && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px' }}>
              {[1,2,3].map(n => <div key={n} style={{ height: '200px', backgroundColor: '#eee', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />)}
            </div>
          )}

          {/* ??蹂닿린 踰꾪듉 (IntersectionObserver ?泥댁슜) */}
          {hasMore && !loadingMore && (
            <button
              onClick={loadMore}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', margin: '16px 0', padding: '12px', borderRadius: '14px', background: '#F2F2F7', border: 'none', cursor: 'pointer', fontSize: `13px`, fontWeight: '900', color: '#1c1c1e' }}
            >
              <ChevronDown size={16} /> ??蹂닿린
            </button>
          )}

          {/* 臾댄븳 ?ㅽ겕濡?sentinel */}
          <div ref={sentinelRef} style={{ height: '1px' }} />
        </div>
      )}

      {/* ?뚰듃?덉뒪 怨듭떆 */}
      <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
        <div style={{ width: '100%', height: '1px', backgroundColor: '#F0F0F0', marginBottom: '16px' }} />
        <p style={{ fontSize: `10px`, color: '#bbb', lineHeight: 1.7, fontWeight: '600' }}>
          ???ъ뒪?낆? 荑좏뙜 ?뚰듃?덉뒪 諛??뚮━?듭뒪?꾨젅???댄븘由ъ뿉?댄듃 ?쒕룞???쇳솚?쇰줈,<br />
          ?댁뿉 ?곕Ⅸ ?쇱젙?≪쓽 ?섏닔猷뚮? ?쒓났諛쏆쓣 ???덉뒿?덈떎.
        </p>
      </div>
    </div>

    {/* ?? MASTER ?곹뭹 ?깅줉 紐⑤떖 ?? */}
    {isAdmin && showRegForm && (
      <div onClick={() => setShowRegForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 16px 40px', maxHeight: '85vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>?썟</span>
              <span style={{ fontSize: '16px', fontWeight: '900', color: '#1c1c1e' }}>?곹뭹 ?깅줉</span>
              <span style={{ fontSize: '10px', background: 'linear-gradient(135deg,#FF9B26,#FF6B00)', color: '#fff', padding: '2px 7px', borderRadius: '6px', fontWeight: '900' }}>MASTER</span>
            </div>
            <button onClick={() => setShowRegForm(false)} style={{ background: '#F2F2F7', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} color="#1c1c1e" />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            {['coupang','ali'].map(s => (
              <button key={s} onClick={() => setRegSrc(s)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: `2px solid ${regSrc===s?(s==='coupang'?'#0056D2':'#FF6900'):'#F2F2F7'}`, background: regSrc===s?(s==='coupang'?'#EFF5FF':'#FFF3EC'):'#F2F2F7', fontWeight: '900', fontSize: '13px', cursor: 'pointer', color: regSrc===s?(s==='coupang'?'#0056D2':'#FF6900'):'#8E8E93' }}>
                {s==='coupang'?'?썟 荑좏뙜':'?뮥 ?뚮━'}
              </button>
            ))}
          </div>
          {/* 荑좏뙜???뚮쭔 ?⑥텞 URL ?꾨뱶 ?쒖떆 (?뚮━?????먮룞議고쉶 諛뺤뒪???듯빀) */}
          {regSrc === 'coupang' && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '6px' }}>?⑥텞 URL *</div>
              <input value={regShortUrl} onChange={e=>setRegShortUrl(e.target.value)} placeholder="https://link.coupang.com/a/xxxx" style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}
          {regSrc==='coupang' && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '6px' }}>iframe 肄붾뱶 *</div>
              <textarea value={regIframeCode} onChange={e=>setRegIframeCode(e.target.value)} placeholder='<iframe src="https://coupa.ng/xxxx" ...></iframe>' rows={3} style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: '12px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'monospace' }} />
            </div>
          )}
          {regSrc==='ali' && (<>
            {/* ?봽 ?먮룞 議고쉶 踰꾪듉 */}
            <div style={{ marginBottom: '14px', background: 'linear-gradient(135deg,#FFF3EC,#FFF8F5)', border: '1.5px solid #FFD0B0', borderRadius: '14px', padding: '12px 14px' }}>
              <div style={{ fontSize: '12px', fontWeight: '900', color: '#FF6900', marginBottom: '8px' }}>???몃옒??留곹겕 ?먮룞 議고쉶</div>
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
                    setRegResolving(true); setRegMsg('?뵇 ?곹뭹 ?뺣낫 議고쉶 以?..');
                    try {
                      const res = await fetch(`${API_BASE}/api/shop/ali-resolve?key=${DIRECT_KEY}&url=${encodeURIComponent(regShortUrl.trim())}`);
                      const data = await res.json();
                      if (data.ok) {
                        if (data.imageUrl) setRegImageUrl(data.imageUrl);
                        if (data.title)    setRegProductName(data.title);
                        // ?대?吏/?쒕ぉ ?놁쑝硫?吏곸젒 ?낅젰 ?덈궡
                        if (!data.imageUrl || !data.title) {
                          setRegNeedManual(true);
                          setRegMsg(`???곹뭹 ID ${data.productId} ?뺤씤! ?대?吏/?쒕ぉ??吏곸젒 ?낅젰?댁＜?몄슂 ??);
                        } else {
                          setRegNeedManual(false);
                          setRegMsg(`??議고쉶 ?꾨즺! ${data.title?.slice(0,20) || ''}`);
                        }
                        setRegResolved(true);
                      } else {
                        setRegNeedManual(true);
                        setRegResolved(false);
                        setRegMsg(`?좑툘 ${data.error || '議고쉶 ?ㅽ뙣 ??吏곸젒 ?낅젰?댁＜?몄슂'}`);
                      }
                    } catch(e) { setRegMsg(`???ㅻ쪟: ${e.message}`); }
                    finally { setRegResolving(false); }
                  }}
                  style={{ padding: '10px 14px', borderRadius: '10px', background: regResolving ? '#C7C7CC' : 'linear-gradient(135deg,#FF9B26,#FF6900)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: '900', cursor: regResolving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {regResolving ? '?? : '?뵇 ?먮룞議고쉶'}
                </button>
              </div>
              <div style={{ fontSize: '11px', color: '#FF8040', fontWeight: '700', marginTop: '6px' }}>?ы꽭 Product Link (s.click.aliexpress.com/e/...)瑜?遺숈뿬?ｌ쑝?몄슂</div>
            </div>
            {/* 誘몃━蹂닿린 */}
            {regImageUrl && (
              <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center', background: '#F9F9F9', borderRadius: '12px', padding: '10px' }}>
                <img src={regImageUrl} alt="誘몃━蹂닿린" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #E5E5EA' }} onError={e => e.target.style.display='none'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#FF6900', marginBottom: '2px' }}>?곹뭹 誘몃━蹂닿린</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1c1c1e', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{regProductName || '?곹뭹紐??놁쓬'}</div>
                </div>
              </div>
            )}
            {/* ?섎룞 ?낅젰 (?먮룞議고쉶 ?ㅽ뙣 ???먮뒗 ?대?吏 ?놁쓣 ???먮룞 ?쒖떆) */}
            <details open={regNeedManual} style={{ marginBottom: '10px' }}>
              <summary style={{ fontSize: '12px', fontWeight: '800', color: regNeedManual ? '#FF6900' : '#8E8E93', cursor: 'pointer', padding: '4px 0' }}>
                {regNeedManual ? '?좑툘 ?대?吏/?쒕ぉ 吏곸젒 ?낅젰 ?꾩슂' : '?륅툘 吏곸젒 ?낅젰 (?먮룞議고쉶 ?ㅽ뙣 ??'}
              </summary>
              {regNeedManual && (
                <div style={{ background: '#FFF3EC', border: '1px solid #FFD0B0', borderRadius: '10px', padding: '8px 10px', marginTop: '6px', marginBottom: '8px', fontSize: '11px', color: '#FF6900', fontWeight: '700', lineHeight: 1.6 }}>
                  ?뮕 ?쒕쾭 IP 臾몄젣濡??대?吏瑜??먮룞 異붿텧?섏? 紐삵빀?덈떎.<br/>
                  AliExpress ?곹뭹 ?섏씠吏 ???대?吏 ?고겢由???"?대?吏 二쇱냼 蹂듭궗" ???꾨옒 ?낅젰
                </div>
              )}
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#8E8E93', marginBottom: '4px' }}>?대?吏 URL</div>
                <input value={regImageUrl} onChange={e=>setRegImageUrl(e.target.value)} placeholder="https://ae01.alicdn.com/..." style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1.5px solid ${regNeedManual && !regImageUrl ? '#FF6900' : '#E5E5EA'}`, fontSize: '12px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }} />
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#8E8E93', marginBottom: '4px' }}>?곹뭹紐?/div>
                <input value={regProductName} onChange={e=>setRegProductName(e.target.value)} placeholder="?싳떆 猷⑥뼱 ?명듃 10媛쒖엯" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1.5px solid ${regNeedManual && !regProductName ? '#FF6900' : '#E5E5EA'}`, fontSize: '12px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </details>
          </>)}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '8px' }}>移댄뀒怨좊━</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SHOP_TAGS.map(t => (
                <button key={t} onClick={() => setRegTag(t)} style={{ padding: '7px 12px', borderRadius: '10px', border: 'none', background: regTag===t?'#1c1c1e':'#F2F2F7', color: regTag===t?'#fff':'#8E8E93', fontSize: '12px', fontWeight: '850', cursor: 'pointer' }}>{t}</button>
              ))}
            </div>
          </div>
          {regMsg && <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: '800', color: regMsg.startsWith('??)?'#00C48C':regMsg.startsWith('??)?'#FF9B26':'#FF3B30', marginBottom: '12px' }}>{regMsg}</div>}
          <button onClick={handleRegSubmit} disabled={regLoading} style={{ width: '100%', padding: '15px', borderRadius: '14px', border: 'none', background: regLoading?'#C7C7CC':'linear-gradient(135deg,#0056D2,#003899)', color: '#fff', fontSize: '15px', fontWeight: '900', cursor: regLoading?'not-allowed':'pointer' }}>
            {regLoading?'???깅줉 以?..':'+ ?쇳븨??뿉 ?깅줉'}
          </button>
        </div>
      </div>
    )}
    </>
  );
}