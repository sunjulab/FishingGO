import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Tv, Flame, Search, X, ShoppingBag as BagIcon, Maximize2, Clock, User2, Loader2 } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';

const CATEGORIES = ['전체', '루어', '찌낚시', '원투', '선상', '에깅'];
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// 카테고리 → 검색 키워드 매핑
const CATEGORY_KEYWORDS = {
  '루어':  ['루어낚시', '배스낚시', '루어 낚시 포인트'],
  '찌낚시': ['찌낚시', '갯바위 찌낚시', '방파제 찌낚시'],
  '원투':  ['원투낚시', '투낚시 포인트', '원투 채비'],
  '선상':  ['선상낚시', '배낚시', '선상 포인트'],
  '에깅':  ['에깅낚시', '쭈꾸미낚시', '갑오징어 에깅'],
};
// 전체 무한스크롤 키워드 풀
const SEARCH_KEYWORDS = ['바다낚시', '루어낚시', '민물낚시', '선상낚시', '에깅낚시', '찌낚시', '갯바위낚시', '강낚시', '배스낚시', '돌돔낚시'];


function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;
  return `${Math.floor(diff / 2592000)}개월 전`;
}

export default function MediaTab() {
  const [activeChip, setActiveChip] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // 무한스크롤 상태
  const [nextPageToken, setNextPageToken] = useState(null);
  const [searchKeyIndex, setSearchKeyIndex] = useState(0);
  const [catKeyIndex, setCatKeyIndex] = useState(0);
  const [mode, setMode] = useState('rss'); // 'rss' | 'category' | 'search'
  const [hasMore, setHasMore] = useState(true);

  const sentinelRef = useRef(null);
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  // 쿠팡 연동
  useEffect(() => {
    if (!selectedVideo) return;
    const kw = selectedVideo.category && !['전체','최신','검색결과'].includes(selectedVideo.category)
      ? selectedVideo.category + ' 낚시 장비'
      : selectedVideo.title.split(' ')[0].replace(/[^가-힣a-zA-Z0-9]/g, '') + ' 낚시';
    fetch(`${API}/api/commerce/coupang/search?keyword=${encodeURIComponent(kw)}`)
      .then(r => r.json())
      .then(d => { if (d.products?.length) setSelectedVideo(p => ({ ...p, products: d.products })); })
      .catch(() => {});
  }, [selectedVideo?.id]);

  // 최초 로드
  useEffect(() => { loadByChip('전체', true); }, []);

  // 칩/검색에 따라 로드 분기
  const loadByChip = async (chip, isFirst = false) => {
    setLoading(true);
    setVideos([]);
    setHasMore(true);
    setCatKeyIndex(0);
    setSearchKeyIndex(0);

    if (chip === '전체') {
      // 전체: 낚시 최신순 검색 (RSS 대신 직접 search API 사용 - 다양한 채널 최신순)
      setMode('search');
      setNextPageToken(null);
      const vids = await fetchSearchQuery('낚시');
      setVideos(vids);
    } else {
      // 카테고리: 해당 키워드로 검색
      setMode('category');
      const kws = CATEGORY_KEYWORDS[chip] || [chip + '낚시'];
      const vids = await fetchSearchQuery(kws[0]);
      setVideos(vids); // 빈 배열이면 빈 화면 표시
      setCatKeyIndex(1); // 다음 키워드부터
    }
    setLoading(false);
  };

  // RSS에서 영상 로드
  const fetchRss = async (token) => {
    try {
      const url = `${API}/api/media/youtube` + (token ? `?pageToken=${token}` : '');
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      // 실제 영상이 있을 때만 반환, 폭백 X
      return { vids: data.videos?.length ? data.videos : [], token: data.nextPageToken || null };
    } catch {
      return { vids: [], token: null };
    }
  };

  // 키워드로 검색
  const fetchSearchQuery = async (kw) => {
    try {
      const res = await fetch(`${API}/api/media/youtube/search?q=${encodeURIComponent(kw)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      return data.videos?.length ? data.videos : [];
    } catch { return []; }
  };

  // 추가 로드
  const loadMore = async () => {
    if (loadingMore || !hasMore || activeChip === '검색결과') return;
    setLoadingMore(true);

    if (mode === 'category') {
      // 카테고리 모드: 해당 카테고리 키워드 순환
      const kws = CATEGORY_KEYWORDS[activeChip] || [activeChip + '낚시'];
      const kw = kws[catKeyIndex % kws.length];
      const vids = await fetchSearchQuery(kw);
      if (vids.length > 0) {
        setVideos(p => [...p, ...vids]);
        setCatKeyIndex(i => i + 1);
      } else {
        // 키워드 소진 → SEARCH_KEYWORDS에서 보완
        const fallbackKw = SEARCH_KEYWORDS[searchKeyIndex % SEARCH_KEYWORDS.length];
        const fallbackVids = await fetchSearchQuery(fallbackKw + ' ' + activeChip);
        setVideos(p => [...p, ...(fallbackVids.length ? fallbackVids : [])]);
        setSearchKeyIndex(i => i + 1);
        if (!fallbackVids.length) setHasMore(false);
      }
    } else if (mode === 'rss' && nextPageToken) {
      const { vids, token } = await fetchRss(nextPageToken);
      setVideos(p => [...p, ...vids]);
      setNextPageToken(token || null);
      if (!token) setMode('search');
    } else {
      // 전체 검색 키워드 순환
      const kw = SEARCH_KEYWORDS[searchKeyIndex % SEARCH_KEYWORDS.length];
      const vids = await fetchSearchQuery(kw);
      setVideos(p => [...p, ...(vids.length ? vids : [])]);
      setSearchKeyIndex(i => i + 1);
      if (searchKeyIndex + 1 >= SEARCH_KEYWORDS.length) setSearchKeyIndex(0);
      if (!vids.length) setHasMore(false);
    }

    setLoadingMore(false);
  };

  // Intersection Observer
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '300px' }
    );
    if (sentinelRef.current) obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loadingMore, hasMore, mode, nextPageToken, searchKeyIndex, catKeyIndex, activeChip]);

  // 검색 (Enter)
  const handleSearch = async (e) => {
    if (e.key !== 'Enter') return;
    const q = searchQuery.trim();
    if (!q) { setActiveChip('전체'); return loadByChip('전체', true); }
    setLoading(true);
    setActiveChip('검색결과');
    setHasMore(false);
    setVideos([]);
    try {
      const res = await fetch(`${API}/api/media/youtube/search?q=${encodeURIComponent(q)}`);
      const data = res.ok ? await res.json() : {};
      setVideos(data.videos?.length ? data.videos : FALLBACK_VIDEOS);
    } catch { setVideos(FALLBACK_VIDEOS); }
    setLoading(false);
  };

  // 카테고리 클릭
  const handleChipClick = (chip) => {
    setActiveChip(chip);
    loadByChip(chip, true);
  };

  // 필터: 이미 서버에서 걸러 오지만 로컬 안전망
  const filteredVideos = videos;

  return (
    <div className="page-container" style={{ backgroundColor: '#F2F2F7', paddingBottom: '100px', overflowX: 'hidden' }}>

      {/* 전체화면 모달 */}
      {selectedVideo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10001, background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
            <div style={{ color: '#fff', flex: 1, paddingRight: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#60a5fa', marginBottom: '4px' }}>{selectedVideo.channelTitle || selectedVideo.category}</div>
              <div style={{ fontSize: '16px', fontWeight: '900' }}>{selectedVideo.title}</div>
            </div>
            <button onClick={() => setSelectedVideo(null)} style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
              <X size={22} />
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <iframe style={{ width: '100vw', height: '56.25vw', maxHeight: '85vh', border: 'none' }}
              src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            <button onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`, '_blank')}
              style={{ marginTop: '14px', padding: '10px 20px', borderRadius: '24px', backgroundColor: '#FF0000', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
              <Play size={14} fill="#fff" /> YouTube에서 보기
            </button>
          </div>
          <div style={{ padding: '20px', background: 'linear-gradient(to top, rgba(0,0,0,1), transparent)', display: 'flex', alignItems: 'center', gap: '16px', color: '#fff' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>이 기술에 필요한 장비</div>
              <div style={{ fontSize: '15px', fontWeight: '900' }}>{selectedVideo.products?.[0]?.name} 외</div>
            </div>
            <button onClick={() => navigate('/shop')} style={{ backgroundColor: '#0056D2', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '14px', fontSize: '14px', fontWeight: '900', whiteSpace: 'nowrap' }}>
              쇼핑하기
            </button>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div style={{ backgroundColor: '#fff', padding: '30px 20px 10px', borderBottom: '1px solid #E5E5EA' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', backgroundColor: '#0056D2', borderRadius: '14px', color: '#fff' }}><Tv size={22} /></div>
            <h1 style={{ fontSize: '24px', fontWeight: '950', color: '#1C1C1E', margin: 0 }}>낚시채널</h1>
          </div>
          <div style={{ padding: '6px 12px', backgroundColor: '#F2F2F7', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Flame size={13} color="#FF5A5F" fill="#FF5A5F" />
            <span style={{ fontSize: '11px', fontWeight: '900', color: '#1C1C1E' }}>인기순</span>
          </div>
        </div>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#8E8E93' }} size={18} />
          <input type="text" placeholder="검색어 입력 후 Enter (예: 돌돔 낚시)"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={handleSearch}
            style={{ width: '100%', padding: '16px 16px 16px 48px', backgroundColor: '#F2F2F7', border: 'none', borderRadius: '18px', fontSize: '15px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* 카테고리 */}
      <div style={{ backgroundColor: '#fff', padding: '0 0 14px', borderBottom: '1px solid #E5E5EA', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', padding: '0 20px', scrollbarWidth: 'none' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => handleChipClick(c)} style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', fontSize: '14px', fontWeight: '800', backgroundColor: activeChip === c ? '#0056D2' : '#F2F2F7', color: activeChip === c ? '#fff' : '#8E8E93', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 로딩 */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: '14px' }}>
          <Loader2 size={32} style={{ animation: 'spin 0.8s linear infinite' }} color="#0056D2" />
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#8E8E93' }}>인기 낚시 영상 불러오는 중... 🐟</span>
        </div>
      )}

      {/* 카드 리스트 */}
      <div style={{ padding: '16px' }}>
        {!loading && filteredVideos.map((video, i) => (
          <div key={`${video.id}_${i}`} className="card fade-up" style={{ marginBottom: '24px', backgroundColor: '#fff', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
            {/* 썸네일 */}
            <div style={{ position: 'relative', paddingTop: '56.25%', backgroundColor: '#000', cursor: 'pointer' }} onClick={() => setSelectedVideo(video)}>
              <img src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} alt={video.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} loading="lazy" />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.1)' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
                  <Play fill="#0056D2" color="#0056D2" size={28} />
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: '12px', right: '12px', backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: '8px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px', color: '#fff' }}>
                <Maximize2 size={12} /><span style={{ fontSize: '10px', fontWeight: '900' }}>전체화면</span>
              </div>
              {video.channelTitle && (
                <div style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(0,86,210,0.85)', borderRadius: '6px', padding: '4px 8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: '#fff' }}>{video.channelTitle}</span>
                </div>
              )}
            </div>

            {/* 카드 본문 */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                {video.channelTitle && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#0056D2', fontWeight: '800' }}>
                    <User2 size={12} />{video.channelTitle}
                  </div>
                )}
                {video.publishedAt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: '#8E8E93', fontWeight: '700' }}>
                    <Clock size={11} />{timeAgo(video.publishedAt)}
                  </div>
                )}
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: '950', color: '#1C1C1E', marginBottom: '8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{video.title}</h2>
              <p style={{ fontSize: '14px', color: '#8E8E93', fontWeight: '600', marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{video.description}</p>

              {/* 상품 */}
              {video.products?.length > 0 && (
                <div style={{ borderTop: '1px solid #F2F2F7', paddingTop: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
                    <BagIcon size={16} color="#FF5A5F" />
                    <span style={{ fontSize: '14px', fontWeight: '950', color: '#1C1C1E' }}>필수 장비 <span style={{ color: '#FF5A5F' }}>{video.products.length}</span>종</span>
                  </div>
                  {video.products.slice(0, 1).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: '#F8F9FA', padding: '12px', borderRadius: '20px', border: '1.5px solid #F2F2F7' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0 }}>
                        <img src={item.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: '#1C1C1E', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <span style={{ fontSize: '15px', fontWeight: '950' }}>{item.price}</span>
                          <span style={{ fontSize: '12px', fontWeight: '900', color: '#FF5A5F', backgroundColor: 'rgba(255,90,95,0.1)', padding: '2px 6px', borderRadius: '6px' }}>{item.discount} ↓</span>
                        </div>
                      </div>
                      <button onClick={() => navigate('/shop')} style={{ padding: '10px 16px', borderRadius: '14px', backgroundColor: '#0056D2', color: '#fff', border: 'none', fontSize: '13px', fontWeight: '900' }}>구매</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 무한스크롤 감지 영역 */}
        <div ref={sentinelRef} style={{ height: '1px' }} />

        {/* 추가 로딩 */}
        {loadingMore && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px 0', gap: '10px' }}>
            <Loader2 size={22} style={{ animation: 'spin 0.8s linear infinite' }} color="#0056D2" />
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#8E8E93' }}>더 불러오는 중...</span>
          </div>
        )}

        {/* 영상 없음 */}
        {!loading && !loadingMore && filteredVideos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8E8E93' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎣</div>
            <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px', color: '#1C1C1E' }}>영상을 불러오는 중입니다</div>
            <div style={{ fontSize: '13px', fontWeight: '600' }}>잠시 후 다시 시도해주세요</div>
          </div>
        )}

        {!loading && !loadingMore && !hasMore && filteredVideos.length > 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#C7C7CC', fontSize: '13px', fontWeight: '700' }}>
            🎣 모든 영상을 불러왔습니다
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

