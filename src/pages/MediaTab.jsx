import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Tv, Search, X, ShoppingBag as BagIcon, Maximize2, Clock, User2, Loader2, ChevronRight } from 'lucide-react';


import { useToastStore } from '../store/useToastStore';
import apiClient from '../api/index';

const CATEGORIES = ['전체', '루어', '찌낚시', '원투', '선상', '에깅'];
const COUPANG_PID = import.meta.env.VITE_COUPANG_PARTNERS_ID || '';

const CATEGORY_KEYWORDS = {
  '루어':  ['루어낚시', '배스낚시', '루어 낚시'],
  '찌낚시': ['찌낚시', '갯바위 찌낚시', '방파제 찌낚시'],
  '원투':  ['원투낚시', '투낚시', '원투 채비'],
  '선상':  ['선상낚시', '배낚시', '선상 포인트'],
  '에깅':  ['에깅낚시', '쭈꾸미낚시', '갑오징어 에깅'],
};

// ✅ BUG-FIX: VideoCard/SectionHeader 모듈 레벨 추출 — 내부 정의 시 렌더마다 새 컴포넌트 타입 생성 → 완전 재마운트 버그
// T를 props로 전달받아 모듈 레벨에서 useTheme() 미사용 문제 해결
function VideoCard({ video, onSelect, onNavigate, T }) {
  const isRecent = video.tag === 'recent';
  return (
    <div className="card fade-up" style={{ marginBottom: '20px', backgroundColor: '#fff', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.07)' }}>
      {/* 썸네일 */}
      <div style={{ position: 'relative', paddingTop: '56.25%', backgroundColor: '#000', cursor: 'pointer' }} onClick={() => onSelect(video)}>
        <img src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} alt={video.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} loading="lazy" />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.08)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.25)' }}>
            <Play fill="#0056D2" color="#0056D2" size={26} />
          </div>
        </div>
        {/* 전체화면 버튼 */}
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: '8px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', color: '#fff' }}>
          <Maximize2 size={11} /><span style={{ fontSize: `calc(9px * var(--fs, 1))`, fontWeight: '900' }}>전체화면</span>
        </div>
        {/* 채널명 */}
        {video.channelTitle && (
          <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(0,86,210,0.85)', borderRadius: '6px', padding: '3px 8px' }}>
            <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', color: '#fff' }}>{video.channelTitle}</span>
          </div>
        )}
        {/* 태그 뱃지 */}
        <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: isRecent ? 'rgba(52,199,89,0.9)' : 'rgba(255,59,48,0.9)', borderRadius: '6px', padding: '3px 7px' }}>
          <span style={{ fontSize: `calc(9px * var(--fs, 1))`, fontWeight: '900', color: '#fff' }}>
            {isRecent ? '🕐 최신' : '🔥 인기'}
          </span>
        </div>
      </div>

      {/* 카드 본문 */}
      <div style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '7px' }}>
          {video.channelTitle && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: `calc(12px * var(--fs, 1))`, color: '#0056D2', fontWeight: '800' }}>
              <User2 size={12} />{video.channelTitle}
            </div>
          )}
          {video.publishedAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: `calc(12px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '700' }}>
              <Clock size={11} />{timeAgo(video.publishedAt)}
            </div>
          )}
        </div>
        <h2 style={{ fontSize: `calc(17px * var(--fs, 1))`, fontWeight: '950', color: '#1C1C1E', marginBottom: '7px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{video.title}</h2>
        {video.description && (
          <p style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '600', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{video.description}</p>
        )}

        {/* 쿠팡 상품 */}
        {video.products?.length > 0 && (
          <div style={{ borderTop: '1px solid #F2F2F7', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <BagIcon size={15} color="#FF5A5F" />
              <span style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '950', color: '#1C1C1E' }}>필수 장비 <span style={{ color: '#FF5A5F' }}>{video.products.length}</span>종</span>
            </div>
            {video.products.slice(0, 1).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#F8F9FA', padding: '10px', borderRadius: '16px', border: '1.5px solid #F2F2F7' }}>
                <div style={{ width: '54px', height: '54px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={item.img} alt={item.name || '낚시 장비'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: '#1C1C1E', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '950' }}>{item.price}</span>
                    {item.discount && <span style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', color: '#FF5A5F', backgroundColor: 'rgba(255,90,95,0.1)', padding: '2px 5px', borderRadius: '5px' }}>{item.discount} ↓</span>}
                  </div>
                </div>
                <button onClick={() => window.open(item.link || item.productUrl, '_blank')} style={{ padding: '9px 14px', borderRadius: '12px', backgroundColor: item.source === 'ali' ? '#FF6900' : '#0056D2', color: '#fff', border: 'none', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer' }}>
                  {item.source === 'ali' ? 'AliExpress' : 'Coupang'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ✅ BUG-FIX: SectionHeader 모듈 레벨 추출
function SectionHeader({ icon, title, subtitle, color, T }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', marginTop: '8px' }}>
      <div style={{ width: '4px', height: '24px', backgroundColor: color, borderRadius: '2px' }} />
      <div>
        <div style={{ fontSize: `calc(17px * var(--fs, 1))`, fontWeight: '950', color: '#1C1C1E' }}>{icon} {title}</div>
        {subtitle && <div style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '700', color: '#8E8E93', marginTop: '2px' }}>{subtitle}</div>}
      </div>
    </div>
  );
}

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
  const [recentVideos, setRecentVideos] = useState([]);
  const [popularVideos, setPopularVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState(null); // null = 검색결과 없음
  const [searchChannelId, setSearchChannelId] = useState(null); // 채널 검색 여부

  // TODO: seenIds는 무한스크롤 페이지네이션 구현 시 중복 영상 제거에 사용 예정 (현재 미사용)
  const seenIds = useRef(new Set());
  // TTL 캐시 (4시간) — 서버 캐시와 동기화, 일일 쿼터 절약
  const unifiedCache = useRef(new Map()); // key → { recent, popular, ts }
  const CACHE_TTL = 4 * 60 * 60 * 1000; // ✅ 4시간
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  // 상점 연동 (Coupang + Ali 통합)
  useEffect(() => {
    if (!selectedVideo) return;
    const kw = ((selectedVideo.title || '낚시').split(' ')[0].replace(/[^가-힣a-zA-Z0-9]/g, '') || '낚시') + ' 낚시';
    apiClient.get(`/api/shop/products?category=${encodeURIComponent(kw)}&source=all&limit=5`)
      .then(res => { 
        const data = res.data;
        const items = Array.isArray(data) ? data : (data.items || []);
        if (items.length) setSelectedVideo(p => ({ ...p, products: items })); 
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVideo?.youtubeId || selectedVideo?.id]); // ✅ FIX: YouTube API 결과는 youtubeId, 정적 TUTORIAL은 id — 둘 다 체크

  useEffect(() => { loadUnified('전체'); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 통합 피드 로드 ────────────────────────────────────────────────────
  const loadUnified = useCallback(async (chip) => {
    setActiveChip(chip);
    setSearchResults(null);
    setLoading(true);
    seenIds.current.clear();

    const q = chip === '전체' ? '낚시' : (CATEGORY_KEYWORDS[chip]?.[0] || chip + '낚시');
    const cacheKey = `unified:${q}`;

    // TTL 캐시 히트
    if (unifiedCache.current.has(cacheKey)) {
      const entry = unifiedCache.current.get(cacheKey);
      if (Date.now() - entry.ts < CACHE_TTL) {
        setRecentVideos(entry.recent);
        setPopularVideos(entry.popular);
        setLoading(false);
        return;
      }
      unifiedCache.current.delete(cacheKey);
    }

    try {
      const res = await apiClient.get(`/api/media/youtube/unified?q=${encodeURIComponent(q)}`);
      if (res.data.error) {
        addToast(`YouTube API 오류: ${res.data.error}`, 'error');
        setRecentVideos([]);
        setPopularVideos([]);
      } else {
        const recent = res.data.recent || [];
        const popular = res.data.popular || [];
        setRecentVideos(recent);
        setPopularVideos(popular);
        unifiedCache.current.set(cacheKey, { recent, popular, ts: Date.now() });
      }
    } catch (e) {
      addToast('YouTube 영상 로드 실패: ' + (e.message || '연결 오류'), 'error');
      setRecentVideos([]);
      setPopularVideos([]);
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 검색 ────────────────────────────────────────────────────────────────
  const handleSearch = async (e) => {
    if (e.key !== 'Enter') return;
    const q = searchQuery.trim();
    if (!q) { setSearchResults(null); setSearchChannelId(null); return loadUnified(activeChip); }
    setLoading(true);
    setSearchResults([]);
    setSearchChannelId(null);
    try {
      const res = await apiClient.get(`/api/media/youtube/search?q=${encodeURIComponent(q)}&order=date&maxResults=15`);
      if (res.data.error) {
        addToast(`검색 오류: ${res.data.error}`, 'error');
        setSearchResults([]);
      } else {
        // ✅ 검색결과 최신순 보장: 서버 캐시 미정렬 방어 + publishedAt 내림차순 재정렬
        const raw = res.data.videos || [];
        const sorted = [...raw].sort((a, b) => {
          const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return tb - ta;
        });
        setSearchResults(sorted);
        setSearchChannelId(res.data.channelId || null); // 채널 특정 검색 여부
      }
    } catch (err) {
      if (err.response?.status === 429 || err.response?.status === 403) {
        addToast('YouTube API 쿼터를 초과했습니다. 잠시 후 다시 시도해주세요. 🐟', 'warning');
      } else {
        addToast('검색 실패: ' + (err.message || '연결 오류'), 'error');
      }
      setSearchResults([]);
    }
    setLoading(false);
  };

  const handleChipClick = (chip) => { loadUnified(chip); };

  // VideoCard, SectionHeader → 모듈 레벨 컴포넌트 (위로 이동됨 — 렌더마다 재생성 방지)

  return (
    <div className="page-container" style={{ backgroundColor: '#F2F2F7', overflowX: 'hidden' }}>

      {/* 전체화면 모달 */}
      {selectedVideo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 9999, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, padding: '24px 20px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10001, background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', pointerEvents: 'none' }}>
            <div style={{ color: '#fff', flex: 1, paddingRight: '12px' }}>
              <div style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '800', color: '#60a5fa', marginBottom: '4px' }}>{selectedVideo.channelTitle}</div>
              <div style={{ fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '900' }}>{selectedVideo.title}</div>
            </div>
            <button onClick={() => setSelectedVideo(null)} style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', pointerEvents: 'auto' }}>
              <X size={22} />
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '80px', minHeight: '100vh' }}>
            <iframe style={{ width: '100vw', height: '56.25vw', maxHeight: '75vh', border: 'none' }}
              src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            <button onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`, '_blank')}
              style={{ marginTop: '14px', padding: '10px 20px', borderRadius: '24px', backgroundColor: '#FF0000', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer' }}>
              <Play size={14} fill="#fff" /> YouTube에서 보기
            </button>
          </div>
          <div style={{ padding: '20px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)', background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 50%, transparent 100%)', display: 'flex', flexDirection: 'column', gap: '14px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BagIcon size={14} color="#00C48C" /> 이 영상에 필요한 추천 장비
              </div>
              <button onClick={() => navigate('/shop')} style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '6px 12px', borderRadius: '14px', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                쇼핑하기 <ChevronRight size={14} />
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', WebkitOverflowScrolling: 'touch' }} className="hide-scrollbar">
              {(selectedVideo.products || []).length > 0 ? selectedVideo.products.slice(0, 5).map((item, idx) => (
                <div key={idx} onClick={() => window.open(item.link || item.productUrl, '_blank')}
                  style={{ width: '130px', flexShrink: 0, backgroundColor: '#1C1C1E', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: '100%', height: '130px', backgroundColor: '#fff', position: 'relative' }}>
                    <img src={item.img || item.image || item.imageUrl} alt={item.name || item.title || '장비'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 6, left: 6, backgroundColor: item.source === 'ali' ? '#FF6900' : '#0056D2', color: '#fff', fontSize: '9px', fontWeight: '900', padding: '3px 6px', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                      {item.source === 'ali' ? 'AliExpress' : 'Coupang'}
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '700', color: '#E5E5EA', marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3, height: '2.6em' }}>
                      {item.name || item.title}
                    </div>
                    <div style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', color: '#fff' }}>
                      {item.price ? (typeof item.price === 'number' ? `₩${item.price.toLocaleString()}` : item.price) : '가격 확인'}
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ width: '100%', textAlign: 'center', padding: '24px 0', fontSize: `calc(13px * var(--fs, 1))`, color: 'rgba(255,255,255,0.6)', fontWeight: '700' }}>
                  관련 장비 검색 중... 🎣
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div style={{ backgroundColor: '#fff', padding: '30px 20px 10px', borderBottom: '1px solid #E5E5EA' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', backgroundColor: '#0056D2', borderRadius: '14px', color: '#fff' }}><Tv size={22} /></div>
            <h1 style={{ fontSize: `calc(24px * var(--fs, 1))`, fontWeight: '950', color: '#1C1C1E', margin: 0 }}>낚시채널</h1>
          </div>
          {/* 통합 피드 안내 뱃지 */}
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', backgroundColor: 'rgba(52,199,89,0.15)', color: '#34C759', padding: '4px 8px', borderRadius: '8px' }}>🕐 최신</span>
            <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', backgroundColor: 'rgba(255,59,48,0.12)', color: '#FF3B30', padding: '4px 8px', borderRadius: '8px' }}>🔥 인기</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <span style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '700' }}>📅 이번 주 최신 + 🔥 이달의 인기 · 2분 이상 영상</span>
        </div>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#8E8E93' }} size={18} />
          <input type="text" placeholder="검색어 입력 후 Enter (예: 돌돔 낚시)"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={handleSearch}
            style={{ width: '100%', padding: '16px 16px 16px 48px', backgroundColor: '#F2F2F7', border: 'none', borderRadius: '18px', fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* 카테고리 */}
      <div style={{ backgroundColor: '#fff', padding: '0 0 14px', borderBottom: '1px solid #E5E5EA', position: 'sticky', top: 'var(--header-height)', zIndex: 100 }}>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', padding: '12px 20px 0', scrollbarWidth: 'none' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => handleChipClick(c)} style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', backgroundColor: activeChip === c ? '#0056D2' : '#F2F2F7', color: activeChip === c ? '#fff' : '#8E8E93', whiteSpace: 'nowrap', transition: 'all 0.2s', cursor: 'pointer' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 로딩 */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: '14px' }}>
          <Loader2 size={32} style={{ animation: 'spin 0.8s linear infinite' }} color="#0056D2" />
          <span style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '700', color: '#8E8E93' }}>최신 + 인기 낚시 영상 불러오는 중... 🐟</span>
        </div>
      )}

      {/* 카드 리스트 */}
      {!loading && (
        <div style={{ padding: '16px', paddingBottom: 'var(--nav-height)' }}>

          {/* 검색 결과 */}
          {searchResults !== null ? (
            <>
              <SectionHeader
                icon={searchChannelId ? '📺' : '🔍'}
                title={searchChannelId ? `${searchQuery} 유튜브 채널` : '검색 결과'}
                subtitle={searchChannelId
                  ? `이 채널 전용 영상 ${searchResults.length}개 · 2분 이상`
                  : `"${searchQuery}" 결과 ${searchResults.length}개 · 2분 이상`}
                color={searchChannelId ? '#FF0000' : '#0056D2'}
              />
              {searchResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#8E8E93' }}>
                  <div style={{ fontSize: `calc(36px * var(--fs, 1))`, marginBottom: '12px' }}>🎣</div>
                  <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800' }}>검색 결과가 없습니다</div>
                </div>
              )}
              {searchResults.map(v => <VideoCard key={v.youtubeId} video={{ ...v, tag: 'recent' }} onSelect={setSelectedVideo} onNavigate={navigate} />)}
            </>
          ) : (
            <>
              {/* 이번 주 최신 영상 섹션 */}
              {recentVideos.length > 0 && (
                <>
                  <SectionHeader icon="🕐" title="이번 주 업로드" subtitle="최근 7일 · 2분 이상 낚시 영상" color="#34C759" />
                  {recentVideos.map(v => <VideoCard key={v.youtubeId} video={v} onSelect={setSelectedVideo} onNavigate={navigate} />)}
                </>
              )}

              {/* 인기 영상 섹션 */}
              {popularVideos.length > 0 && (
                <div style={{ marginTop: recentVideos.length > 0 ? '8px' : '0' }}>
                  <SectionHeader icon="🔥" title="이달의 인기 낚시 영상" subtitle="최근 1개월 최고 조회수 · 2분 이상" color="#FF3B30" />
                  {popularVideos.map(v => <VideoCard key={v.youtubeId} video={v} onSelect={setSelectedVideo} onNavigate={navigate} />)}
                </div>
              )}

              {/* 완전 비어있는 경우 */}
              {recentVideos.length === 0 && popularVideos.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8E8E93' }}>
                  <div style={{ fontSize: `calc(48px * var(--fs, 1))`, marginBottom: '16px' }}>🎣</div>
                  <div style={{ fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '800', marginBottom: '8px', color: '#1C1C1E' }}>영상을 불러오는 중입니다</div>
                  <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '600' }}>잠시 후 다시 시도해주세요</div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
