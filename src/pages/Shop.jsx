import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Star, Zap, ShoppingBag, ChevronRight, Bookmark, ArrowUpRight, Search, SlidersHorizontal, PackageOpen } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PARTNERS_ID = 'AF3563639';

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
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/products`);
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!search.trim()) return;
    const url = `https://www.coupang.com/np/search?q=${encodeURIComponent(search)}&lptag=${PARTNERS_ID}`;
    window.open(url, '_blank');
  };

  const handleCategoryClick = (cat) => {
    setActiveCat(cat.name);
    const url = `https://www.coupang.com/np/search?q=${encodeURIComponent(cat.query)}&lptag=${PARTNERS_ID}`;
    window.open(url, '_blank');
  };

  const handleProductClick = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div className="page-container" style={{ backgroundColor: '#F8F9FA', paddingBottom: '120px' }}>
      {/* 🟦 Dynamic Shop Header 🟦 */}
      <div style={{ backgroundColor: '#fff', padding: '32px 24px 24px', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '950', color: '#1c1c1e', letterSpacing: '-0.04em' }}>낚시 샵</h1>
          <ShoppingBag size={26} color="#0056D2" fill="#0056D2" style={{ opacity: 0.1 }} />
        </div>
        
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
           <input 
             type="text" 
             placeholder="찾고 있는 낚시 장비를 입력하세요" 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             style={{ width: '100%', padding: '18px 20px 18px 54px', backgroundColor: '#F2F2F7', border: 'none', borderRadius: '24px', fontSize: '15px', fontWeight: '700', outline: 'none' }} 
           />
           <Search size={20} color="#8E8E93" style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)' }} />
        </form>
      </div>

      {/* 🟦 Categories 🟦 */}
      <div style={{ backgroundColor: '#fff', padding: '0 24px 20px' }}>
         <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {categories.map((c, i) => (
              <div 
                key={i} 
                onClick={() => handleCategoryClick(c)}
                style={{ padding: '10px 18px', backgroundColor: activeCat === c.name ? '#1c1c1e' : '#F2F2F7', borderRadius: '16px', color: activeCat === c.name ? '#fff' : '#8E8E93', fontSize: '14px', fontWeight: '850', whiteSpace: 'nowrap', cursor: 'pointer' }}
              >
                {c.name}
              </div>
            ))}
         </div>
      </div>

      {/* 🟦 Product Grid 🟦 */}
      <div style={{ padding: '24px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#1c1c1e' }}>이달의 추천 상품 🌊</h3>
            <SlidersHorizontal size={18} color="#8E8E93" />
         </div>
         
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {loading ? [1,2,3,4].map(n => (
                <div key={n} style={{ height: '240px', backgroundColor: '#eee', borderRadius: '32px', animation: 'pulse 1.5s infinite' }}></div>
            )) : products.map(p => (
              <div 
                key={p.id} 
                onClick={() => handleProductClick(p.link)}
                style={{ backgroundColor: '#fff', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 8px 25px rgba(0,0,0,0.03)', border: '1.5px solid #F2F2F7', cursor: 'pointer' }}
              >
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1' }}>
                  <img src={p.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {p.discount !== '0%' && (
                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: '#FF5A5F', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '900' }}>{p.discount}</div>
                  )}
                </div>
                
                <div style={{ padding: '18px' }}>
                   <div style={{ fontSize: '11px', color: '#0056D2', fontWeight: '900', marginBottom: '4px' }}>{p.badge}</div>
                   <h3 style={{ fontSize: '15px', fontWeight: '850', color: '#1c1c1e', height: '40px', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', margin: 0 }}>
                     {p.name}
                   </h3>
                   <div style={{ marginTop: '14px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '950', color: '#FF5A5F' }}>{p.price}</span>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#1c1c1e' }}>원</span>
                   </div>
                </div>
              </div>
            ))}
         </div>
      </div>
      
      {/* 🟦 Partners Policy Disclosure 🟦 */}
      <div style={{ padding: '0 24px 60px', textAlign: 'center' }}>
         <div style={{ width: '100%', height: '1px', backgroundColor: '#F0F0F0', marginBottom: '32px' }}></div>
         <p style={{ fontSize: '11px', color: '#bbb', lineHeight: 1.6, fontWeight: '600' }}>
            이 포스팅은 쿠팡 파트너스 활동의 일환으로, <br/>
            이에 따른 일정액의 수수료를 제공받을 수 있습니다.<br/>
            <span style={{ color: '#DDD' }}>파트너스 ID: {PARTNERS_ID}</span>
         </p>
      </div>
    </div>
  );
}
