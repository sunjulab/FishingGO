import React, { useState, useEffect, useMemo } from 'react'; // ✅ 12TH-B5: useMemo 추가
import ReactPlayer from 'react-player';
// ✅ 12TH-B3: Info, Star dead import 2개 제거
import { Play, ShoppingBag, ChevronRight, Video, Bookmark, ExternalLink } from 'lucide-react';
import apiClient from '../api/index';

// NEW-A2: 얉팔 파트너스 타겟 타입닝 파라미터 (수익 완결)
const COUPANG_PID = import.meta.env.VITE_COUPANG_PARTNERS_ID || '';

// ✅ 12TH-B4: 장비 link '#' 폴백 → 쿠팡 최적화 검색어 URL — 검색 정확도 향상
const _coupang = (kw) => `https://www.coupang.com/np/search?q=${encodeURIComponent(kw)}`;

const TUTORIAL_VIDEOS = [
  {
    id: 1,
    title: '감성돔 찌낚시 채비법 (반유동/전유동) 완전정복',
    category: '감성돔',
    url: 'https://www.youtube.com/watch?v=Xvj2T6U8WqI',
    thumbnail: 'https://img.youtube.com/vi/Xvj2T6U8WqI/maxresdefault.jpg',
    duration: '15:20',
    description: '입문자가 가장 어려워하는 수심 측정부터 채비 정렬까지 상세히 설명합니다.',
    gear: [
      { name: '1호 갯바위 낚싯대', price: '120,000원', link: _coupang('갯바위 낚싯대 1호 배대') },
      { name: '2500번 스피닝 릴', price: '158,000원', link: _coupang('스피닝릴 2500번 바다낚시') }
    ]
  },
  {
    id: 2,
    title: '무늬오징어 에깅 낚시 입문 - 기본 액션과 장비 세팅',
    category: '무늬오징어',
    url: 'https://www.youtube.com/watch?v=pY5m4A2f-3Y',
    thumbnail: 'https://img.youtube.com/vi/pY5m4A2f-3Y/maxresdefault.jpg',
    duration: '10:45',
    description: '박선비tv가 알려주는 무늬오징어 시즌 대비 기초 에깅 낚시법입니다.',
    gear: [
      { name: '에깅 전용 로드 8.6ft', price: '210,000원', link: _coupang('에깅 낚싯대 8피트 스피닝 로드') },
      { name: '3.5호 야마시타 에기', price: '12,000원', link: _coupang('에깅 에기 3.5호 에깅레일') }
    ]
  },
  {
    id: 3,
    title: '광어 다운샷 채비법 - 웜 끼우는 법과 단차 조절',
    category: '광어/우럭',
    url: 'https://www.youtube.com/watch?v=XWghA2gO2A8',
    thumbnail: 'https://img.youtube.com/vi/XWghA2gO2A8/maxresdefault.jpg',
    duration: '08:30',
    description: '선상 낚시 필수 코스! 광어 다운샷에서 마릿수를 올리는 채비 비결입니다.',
    gear: [
      { name: '다운샷 전용 낚싯대', price: '185,000원', link: _coupang('광어 다운샷 낚싯대 선상') },
      { name: '광어 전용 스트레이트 웜', price: '8,500원', link: _coupang('광어 다운샷 지렁이 웜') }
    ]
  },
  {
    id: 4,
    title: '쭈꾸미 갑오징어 낚시 입문 - 기본 채비와 낚시 방법',
    category: '쭈꾸미/갑오징어',
    url: 'https://www.youtube.com/watch?v=Lq1tK6fD_O0',
    thumbnail: 'https://img.youtube.com/vi/Lq1tK6fD_O0/maxresdefault.jpg',
    duration: '12:15',
    description: '삼분선생의 쭈꾸미 낚시 기초 레슨. 이 영상 하나로 쭈꾸미 낚시 끝!',
    gear: [
      { name: '쭈꾸미 전용 로드', price: '95,000원', link: _coupang('쭈꾸미 낚싯대 에깅 로드') },
      { name: '수평 에기 세트 10개입', price: '25,000원', link: _coupang('쭈꾸미 수평에기 세트') }
    ]
  }
];


const CATEGORIES = ['전체', '감성돔', '무늬오징어', '광어/우럭', '쭈꾸미/갑오징어', '루어'];

export default function Channel() {
  const [filter, setFilter] = useState('전체');
  const [playingVideo, setPlayingVideo] = useState(null);
  // NEW-C1: 서버 fetch + 정적 fallback
  const [videos, setVideos] = useState(TUTORIAL_VIDEOS);
  // NEW-B1: localStorage 기반 로컈 북마크
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('channel_bookmarks') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    // NEW-C1: 서버에서 영상 목록 가져오기 (실패 시 정적 데이터 유지)
    apiClient.get('/api/channel/videos')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setVideos(res.data);
          // ✅ 2ND-B4: 서버 갱신 후 유효하지 않은 북마크 자동 정리
          const validIds = new Set(res.data.map(v => v.id));
          setBookmarks(prev => {
            const cleaned = prev.filter(b => validIds.has(b));
            if (cleaned.length !== prev.length) {
              try { localStorage.setItem('channel_bookmarks', JSON.stringify(cleaned)); } catch {}
            }
            return cleaned;
          });
        }
      })
      .catch((err) => {
        // ✅ 23TH-B3: silent catch → 개발 환경 에러 우선 노옵 (18TH-B2 패턴)
        if (!import.meta.env.PROD) console.warn('[Channel] /api/channel/videos 로드 실패 — 정적 TUTORIAL_VIDEOS 사용:', err?.message);
      });
  }, []);

  const toggleBookmark = (videoId) => {
    setBookmarks(prev => {
      const next = prev.includes(videoId)
        ? prev.filter(b => b !== videoId)
        : [...prev, videoId];
      try { localStorage.setItem('channel_bookmarks', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // ESC 키로 동영상 오버레이 닫기
  useEffect(() => {
    if (!playingVideo) return;
    const handleKey = (e) => { if (e.key === 'Escape') setPlayingVideo(null); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [playingVideo]);

  // ✅ 12TH-B5: useMemo 적용 — videos/filter 변경 시에만 재계산 (갰 렌더 방지)
  const filteredVideos = useMemo(() =>
    filter === '전체' ? videos : videos.filter(v => v.category === filter),
    [videos, filter]
  );

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* Premium Header */}
      <div style={{ background: 'linear-gradient(135deg, #0056D2 0%, #00308F 100%)', padding: '60px 24px 40px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Video size={20} color="#FFD700" />
            <span style={{ fontSize: '13px', fontWeight: '800', opacity: 0.8, letterSpacing: '0.1em' }}>PREMIUM ACADEMY</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '950', marginBottom: '24px', letterSpacing: '-0.02em' }}>실전 채비 마스터 🎓</h1>
        
        {/* Horizontal Category Scroll */}
        <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', scrollbarWidth: 'none', paddingBottom: '5px' }}>
            {CATEGORIES.map(c => (
                <button
                    key={c}
                    onClick={() => setFilter(c)}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '16px',
                        border: 'none',
                        backgroundColor: filter === c ? '#fff' : 'rgba(255,255,255,0.15)',
                        color: filter === c ? '#0056D2' : '#fff',
                        fontSize: '14px',
                        fontWeight: '800',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    {c}
                </button>
            ))}
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Video Player Modal/Overlay if playing */}
        {playingVideo && (
           <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
               <button onClick={() => setPlayingVideo(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '24px' }}>✕</button>
               <div style={{ width: '100%', maxWidth: '800px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                    <ReactPlayer url={playingVideo.url} playing width="100%" height="450px" controls />
               </div>
               <div style={{ width: '100%', maxWidth: '800px', marginTop: '24px', color: '#fff' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>{playingVideo.title}</h2>
                    <p style={{ fontSize: '14px', opacity: 0.7 }}>{playingVideo.description}</p>
               </div>
           </div>
        )}

        {/* Video List */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            {filteredVideos.map(video => (
                <div key={video.id} style={{ backgroundColor: '#fff', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,0.04)', border: '1.5px solid #F2F2F7' }}>
                    {/* Thumbnail Area */}
                    <div style={{ position: 'relative', width: '100%', height: '200px', cursor: 'pointer' }} onClick={() => setPlayingVideo(video)}>
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.style.background = '#e0e0e0'; e.currentTarget.src = ''; }}
                        />
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}>
                                <Play fill="#0056D2" color="#0056D2" size={24} />
                            </div>
                        </div>
                        <span style={{ position: 'absolute', bottom: '12px', right: '12px', padding: '4px 8px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '11px', fontWeight: '700', borderRadius: '8px' }}>{video.duration}</span>
                    </div>

                    <div style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                             <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#1C1C1E', flex: 1, marginRight: '10px' }}>{video.title}</h3>
                             {/* NEW-B1: 북마크 버튼 — localStorage 저장 */}
                             <Bookmark
                               size={18}
                               color={bookmarks.includes(video.id) ? '#0056D2' : '#8E8E93'}
                               fill={bookmarks.includes(video.id) ? '#0056D2' : 'none'}
                               onClick={(e) => { e.stopPropagation(); toggleBookmark(video.id); }}
                               style={{ cursor: 'pointer', flexShrink: 0, transition: 'color 0.2s' }}
                             />
                        </div>
                        <p style={{ fontSize: '13px', color: '#8E8E93', fontWeight: '500', marginBottom: '20px', lineHeight: 1.4 }}>{video.description}</p>
                        
                        {/* Shopping Tag Section (Coupang Partners Structure) */}
                        <div style={{ backgroundColor: '#F8F9FA', borderRadius: '24px', padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <ShoppingBag size={16} color="#0056D2" />
                                <span style={{ fontSize: '13px', fontWeight: '800', color: '#0056D2' }}>영상 속 추천 장비</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                             {video.gear.map(item => (
                                    <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '10px 16px', borderRadius: '16px', border: '1px solid #F2F2F7' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '13px', fontWeight: '800' }}>{item.name}</span>
                                            <span style={{ fontSize: '12px', color: '#FF5A5F', fontWeight: '900' }}>{item.price}</span>
                                        </div>
                                        <button
                                          onClick={() => {
                                            const searchUrl = item.link && item.link !== '#'
                                              ? item.link
                                              // NEW-A2: 쿠팡 파트너스 추적 ID 삽입 — 수익 완결
                                              : `https://www.coupang.com/np/search?q=${encodeURIComponent(item.name)}${COUPANG_PID ? `&sourceType=affiliate&affiliateCode=${COUPANG_PID}` : ''}`;
                                            window.open(searchUrl, '_blank', 'noopener,noreferrer');
                                          }}
                                          style={{ padding: '8px 12px', borderRadius: '12px', backgroundColor: '#F2F2F7', border: 'none', color: '#1C1C1E', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                                        >
                                            보러가기 <ExternalLink size={12} />
                                        </button>
                                    </div>
                                ))}

                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* NEW-B2: 프리미엄 Empty State */}
        {filteredVideos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '32px', border: '1.5px dashed #E0E0E0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
            <p style={{ fontSize: '17px', fontWeight: '900', color: '#1C1C1E', marginBottom: '8px' }}>영상을 준비 중입니다</p>
            <p style={{ fontSize: '13px', color: '#8E8E93', fontWeight: '700', lineHeight: 1.5 }}>
              [<span style={{ fontWeight: '900' }}>{filter}</span>] 카테고리의 튜토리얼이<br />준비 중입니다. 다른 카테고리를 확인해보세요!
              {/* ✅ 2ND-C2: "공비" → "준비" 오타 수정 */}
            </p>
            <button
              onClick={() => setFilter('전체')}
              style={{ marginTop: '16px', padding: '10px 24px', background: '#0056D2', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
            >
              전체 보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
