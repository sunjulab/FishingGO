import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ShoppingBag, Tv, Flame, Search, X, TrendingUp, ChevronRight, Star, ShoppingCart, ShoppingBag as BagIcon, ExternalLink, Maximize2 } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';

const CATEGORIES = ['전체', '최신', '루어', '찌낚시', '원투', '선상', '에깅'];
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function MediaTab() {
  const [activeChip, setActiveChip] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/media/youtube`);
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
      }
    } catch (err) {
      addToast('유튜브 채널 연동에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      const matchCategory = activeChip === '전체' || video.category === activeChip;
      const matchSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [videos, activeChip, searchQuery]);

  return (
    <div className="page-container" style={{ backgroundColor: '#F2F2F7', paddingBottom: '100px', overflowX: 'hidden' }}>
      
      {/* 🔴 전체화면 영상 오버레이 모달 */}
      {selectedVideo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
           {/* 모달 상단 헤더 */}
           <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10001, background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
             <div style={{ color: '#fff' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0056D2', marginBottom: '4px' }}>{selectedVideo.category} 강좌 실시간</div>
                <div style={{ fontSize: '18px', fontWeight: '950' }}>{selectedVideo.title}</div>
             </div>
             <button onClick={() => setSelectedVideo(null)} style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                <X size={24} />
             </button>
           </div>
           
           {/* 비디오 본체 영역 */}
           <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <iframe 
                style={{ width: '100vw', height: '56.25vw', maxHeight: '100vh', border: 'none' }}
                src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
           </div>

           {/* 모달 하단 상품 유도 바 */}
           <div style={{ padding: '24px 20px', background: 'linear-gradient(to top, rgba(0,0,0,1), transparent)', display: 'flex', alignItems: 'center', gap: '16px', color: '#fff' }}>
              <div style={{ flex: 1 }}>
                 <div style={{ fontSize: '13px', fontWeight: '700', opacity: 0.8 }}>이 기술에 필요한 장비 구매하기</div>
                 <div style={{ fontSize: '16px', fontWeight: '900', marginTop: '4px' }}>{selectedVideo.products[0].name} 외</div>
              </div>
              <button 
                onClick={() => navigate('/shop')}
                style={{ backgroundColor: '#0056D2', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '16px', fontSize: '14px', fontWeight: '900' }}
              >
                쇼핑하러 가기
              </button>
           </div>
        </div>
      )}

      {/* 헤더 및 검색창 */}
      <div style={{ backgroundColor: '#fff', padding: '30px 20px 10px', borderBottom: '1px solid #E5E5EA' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <div style={{ padding: '8px', backgroundColor: '#0056D2', borderRadius: '14px', color: '#fff' }}>
                <Tv size={22} />
             </div>
             <h1 style={{ fontSize: '24px', fontWeight: '950', color: '#1C1C1E' }}>낚시채널</h1>
          </div>
          <div style={{ padding: '6px 12px', backgroundColor: '#F2F2F7', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
             <Flame size={14} color="#FF5A5F" fill="#FF5A5F" />
             <span style={{ fontSize: '11px', fontWeight: '900', color: '#1C1C1E' }}>프리미엄 세션</span>
          </div>
        </div>

        <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#8E8E93' }} size={18} />
            <input 
              type="text" 
              placeholder="영상 제목을 검색하세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '16px 16px 16px 48px', backgroundColor: '#F2F2F7', border: 'none', borderRadius: '18px', fontSize: '15px', fontWeight: '700', outline: 'none' }}
            />
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div style={{ backgroundColor: '#fff', padding: '0 0 16px', borderBottom: '1px solid #E5E5EA', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', padding: '0 20px', scrollbarWidth: 'none' }}>
           {CATEGORIES.map(c => (
              <button key={c} onClick={() => setActiveChip(c)} style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', fontSize: '14px', fontWeight: '800', backgroundColor: activeChip === c ? '#0056D2' : '#F2F2F7', color: activeChip === c ? '#fff' : '#8E8E93', whiteSpace: 'nowrap' }}>
                {c}
              </button>
           ))}
        </div>
      </div>

      {/* 카테고리 로딩 및 빈 상태 */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#8E8E93', fontSize: '15px' }}>
          유튜브 채널 연동 중... 🐟
        </div>
      )}

      {/* 영상 카드 리스트 */}
      <div style={{ padding: '16px' }}>
        {!loading && filteredVideos.map(video => (
          <div key={video.id} className="card fade-up" style={{ marginBottom: '24px', backgroundColor: '#fff', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
             {/* 영상 썸네일 영역 - 클릭 시 전체화면 오버레이 */}
             <div 
               style={{ position: 'relative', paddingTop: '56.25%', backgroundColor: '#000', cursor: 'pointer' }}
               onClick={() => setSelectedVideo(video)}
             >
               <img src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
               <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.1)' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
                     <Play fill="#0056D2" color="#0056D2" size={28} />
                  </div>
               </div>
               <div style={{ position: 'absolute', bottom: '16px', right: '16px', backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: '8px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#fff' }}>
                  <Maximize2 size={14} /> <span style={{ fontSize: '11px', fontWeight: '900' }}>전체화면 재생</span>
               </div>
             </div>

             <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                   <div style={{ fontSize: '12px', fontWeight: '950', color: '#0056D2', letterSpacing: '0.05em' }}>{video.category} 프리미엄</div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#8E8E93', fontWeight: '700' }}>
                      <Star size={14} fill="#FFD700" color="#FFD700" /> 4.9 실시간 만족도
                   </div>
                </div>
                <h2 style={{ fontSize: '19px', fontWeight: '950', color: '#1C1C1E', marginBottom: '8px', lineHeight: 1.4 }}>{video.title}</h2>
                <p style={{ fontSize: '14px', color: '#8E8E93', fontWeight: '600', marginBottom: '24px' }}>{video.description}</p>

                {/* 🛒 상품 구매 유도 리스트 */}
                <div style={{ borderTop: '1px solid #F2F2F7', paddingTop: '20px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <BagIcon size={18} color="#FF5A5F" />
                      <span style={{ fontSize: '14px', fontWeight: '950', color: '#1C1C1E' }}>마릿수를 보장하는 필수 제품 <span style={{ color: '#FF5A5F' }}>{video.products.length}</span></span>
                   </div>
                   
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     {video.products.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#F8F9FA', padding: '12px', borderRadius: '24px', border: '1.5px solid #F2F2F7', transition: 'all 0.2s' }}>
                           <div style={{ width: '64px', height: '64px', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                              <img src={item.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                           </div>
                           <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '14px', fontWeight: '900', color: '#1C1C1E', marginBottom: '4px' }}>{item.name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                 <span style={{ fontSize: '16px', fontWeight: '950', color: '#1C1C1E' }}>{item.price}</span>
                                 <span style={{ fontSize: '13px', fontWeight: '900', color: '#FF5A5F', backgroundColor: 'rgba(255,90,95,0.1)', padding: '2px 6px', borderRadius: '6px' }}>{item.discount} ↓</span>
                              </div>
                           </div>
                           <button 
                             onClick={() => navigate('/shop')}
                             style={{ padding: '10px 18px', borderRadius: '14px', backgroundColor: '#0056D2', color: '#fff', border: 'none', fontSize: '13px', fontWeight: '900', boxShadow: '0 4px 12px rgba(0,86,210,0.2)' }}
                           >
                             구매
                           </button>
                        </div>
                     ))}
                   </div>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
