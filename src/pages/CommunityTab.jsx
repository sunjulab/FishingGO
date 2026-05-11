import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'; // ✅ 25TH-C2: useCallback named import 추가
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Heart, Lock, Users, PlusCircle, Phone, Award, Trash2, Edit2 } from 'lucide-react';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore'; // ✅ 7TH-A1: ADMIN_ID/ADMIN_EMAIL import
import { AD_CONFIG } from '../constants/adSettings';
import { useToastStore } from '../store/useToastStore';
import apiClient from '../api/index';
import SkeletonCard from '../components/SkeletonCard';
import { BannerAd, NativeAd } from '../components/AdUnit';

// ✅ 3RD-B5: InFeedAd 컴포넌트 함수 내부 인라인 정의 → 외부 추출 — 렌더마다 재생성 방지
function InFeedAd() {
  const addToast = useToastStore(s => s.addToast);
  return (
    <div
      onClick={() => addToast('제휴 낚시점 상세 페이지로 이동', 'info')}
      style={{ backgroundColor: '#F8F9FA', borderRadius: '16px', padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', border: '1px solid #E5E5EA' }}
    >
      <div style={{ width: '60px', height: '60px', backgroundColor: '#0056D2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Award size={24} color="#fff" />
      </div>
      <div>
        <div style={{ fontSize: '11px', color: '#0056D2', fontWeight: '900', marginBottom: '4px', display: 'inline-block', backgroundColor: 'rgba(0,86,210,0.1)', padding: '2px 8px', borderRadius: '6px' }}>가장 가까운 제휴 낚시점</div>
        <div style={{ fontSize: '15px', color: '#1c1c1e', fontWeight: '950', marginBottom: '4px' }}>동해 낚시 1번지 24시 할인마트</div>
        <div style={{ fontSize: '12px', color: '#555', fontWeight: '700' }}>현재 위치에서 2.4km (밑밥/미끼 상시 할인)</div>
      </div>
    </div>
  );
}

// ✅ 7TH-B1: OPEN_CATEGORIES 컴포넌트 외부 상수 — 불변 배열, 매 렌더마다 재생성 불필요
const OPEN_CATEGORIES = ['전체', '루어', '찌낚시', '원투', '릴찌', '선상', '에깅', '조황 공유'];

// ✅ 전국 실제 낚시배 출항지 — 동일 도시 항구 통합 (label: 표시명, key: 필터 prefix)
const HARBOR_DATA = [
  { region: '강원', emoji: '🏔️', harbors: [
    { label: '강릉·강문', key: '강원 강릉' },
    { label: '주문진', key: '강원 주문진' },
    { label: '속초', key: '강원 속초' },
    { label: '고성(거진)', key: '강원 고성' },
    { label: '양양(낙산·남애)', key: '강원 양양' },
    { label: '동해·묵호', key: '강원 동해' },
    { label: '삼척', key: '강원 삼척' },
  ]},
  { region: '경북', emoji: '🎭', harbors: [
    { label: '구룡포(포항)', key: '경북 구룡포' },
    { label: '감포(경주)', key: '경북 감포' },
    { label: '강구(영덕)', key: '경북 강구' },
    { label: '후포(울진)', key: '경북 후포' },
    { label: '죽변(울진)', key: '경북 죽변' },
  ]},
  { region: '경남', emoji: '🧭', harbors: [
    { label: '통영', key: '경남 통영' },
    { label: '거제(대포·금포)', key: '경남 거제' },
    { label: '남해(미조·상주)', key: '경남 남해' },
    { label: '고성', key: '경남 고성' },
  ]},
  { region: '전남', emoji: '🌺', harbors: [
    { label: '여수(국동)', key: '전남 여수' },
    { label: '목포', key: '전남 목포' },
    { label: '완도', key: '전남 완도' },
    { label: '고흥(나로도)', key: '전남 고흥' },
    { label: '진도', key: '전남 진도' },
  ]},
  { region: '전북', emoji: '🌾', harbors: [
    { label: '군산(비응·야미도)', key: '전북 군산' },
    { label: '부안(격포·위도)', key: '전북 부안' },
  ]},
  { region: '충남', emoji: '🌻', harbors: [
    { label: '태안(안흥·마검포)', key: '충남 태안' },
    { label: '보령(무창포·오천)', key: '충남 보령' },
    { label: '서산(삼길포)', key: '충남 서산' },
  ]},
  { region: '인천', emoji: '⛵', harbors: [
    { label: '남항부두', key: '인천 남항부두' },
    { label: '연안부두', key: '인천 연안부두' },
  ]},
  { region: '부산', emoji: '🏙️', harbors: [
    { label: '기장', key: '부산 기장' },
    { label: '다대포', key: '부산 다대포' },
    { label: '용호부두', key: '부산 용호부두' },
  ]},
  { region: '제주', emoji: '🌴', harbors: [
    { label: '도두항', key: '제주 도두항' },
    { label: '애월항', key: '제주 애월항' },
    { label: '서귀포', key: '제주 서귀포' },
    { label: '모슬포', key: '제주 모슬포' },
    { label: '성산항', key: '제주 성산항' },
  ]},
];

// — 디바운스 후 (7TH-B3: React.표기 제거, named import 사용)
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value); // ✅ 7TH-B3: React.useState → useState
  useEffect(() => {                                     // ✅ 7TH-B3: React.useEffect → useEffect
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
export default function CommunityTab() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('business');
  // ENH4-B3: DOM 직접 조작 대신 React state 기반 하이라이트
  const [highlightedPostId, setHighlightedPostId] = useState(null);
  const sentinelRef = useRef(null); // 무한스크롤 감지 sentinel
  // ✅ 25TH-C3: 하트 애니메이션 타이머 누수 방지 ref (5TH-A4 패턴)
  const likeTimerRef = useRef({});

  // URL 쿼리 파라미터 처리 (?tab=open&postId=xxx)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const postId = params.get('postId');
    if (tab) setActiveTab(tab);
    if (postId) {
      // ENH4-B3: DOM 직접 조작(el.style) 대신 state로 하이라이트 제어
      setHighlightedPostId(postId);
      // ✅ 7TH-C2: setTimeout 2개의 타이머 ID를 저장하여 cleanup에서 정리 — 언마운트 후 누수 방지
      const scrollTimer = setTimeout(() => {
        const el = document.getElementById(`post-${postId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 350);
      // 2.5초 후 하이라이트 해제
      const clearTimer = setTimeout(() => setHighlightedPostId(null), 2850);
      return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer); };
    }
  }, [location.search]);

  // ✅ 25TH-B2: canAccessPremium 셀렉터 실함 호출 → userTier 기반 useMemo 직접 판별 (16TH-B1 WritePost / 17TH-A1 FishingPointBottomSheet 패턴 통일)
  const userTier = useUserStore((state) => state.userTier);
  const user = useUserStore((state) => state.user);
  const canAccessPremium = useMemo(() => {
    if (user?.id === ADMIN_ID || user?.email === ADMIN_EMAIL || user?.email === ADMIN_ID) return true;
    return ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'MASTER'].includes(userTier);
  }, [userTier, user?.id, user?.email]); // eslint-disable-line react-hooks/exhaustive-deps
  // canAccessBusinessPromo: PRO 또는 BUSINESS_VIP만 허용
  const canAccessBusinessPromo = useMemo(() => {
    if (user?.id === ADMIN_ID || user?.email === ADMIN_EMAIL || user?.email === ADMIN_ID) return true;
    return ['PRO', 'BUSINESS_VIP', 'MASTER'].includes(userTier);
  }, [userTier, user?.id, user?.email]); // eslint-disable-line react-hooks/exhaustive-deps
  // ✅ FIX-ADMIN: isAdmin 4중 보장 — id/email(gmail)/email(ID)/MASTER tier
  const isAdmin = useUserStore(s =>
    s.user?.id === ADMIN_ID ||
    s.user?.email === ADMIN_EMAIL ||
    s.user?.email === ADMIN_ID ||
    s.userTier === 'MASTER'
  );


  const addToast = useToastStore((state) => state.addToast);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('community_liked_posts') || '{}'); } catch { return {}; }
  });
  const [likeAnimating, setLikeAnimating] = useState({}); // 애니메이션 트리거 state
  const [openCategory, setOpenCategory] = useState('전체'); // 오픈게시판 카테고리 필터
  const [searchQuery, setSearchQuery] = useState('');    // 검색어 (입력값)
  const debouncedSearch = useDebounce(searchQuery, 350); // 실제 API 호출에 사용
  const [page, setPage] = useState(1);                   // 현재 페이지
  const [totalPages, setTotalPages] = useState(1);       // 전체 페이지 수
  const [loadingMore, setLoadingMore] = useState(false); // 더보기 로딩
  // ✅ 7TH-B1: OPEN_CATEGORIES는 컴포넌트 외부 상수로 이동 (L31)
  const [crewPassModal, setCrewPassModal] = useState(null); // { crew } | null
  const [crewPassInput, setCrewPassInput]  = useState('');
  const [crewPassLoading, setCrewPassLoading] = useState(false);
  const [crews, setCrews] = useState([]);
  // ✅ CREW-ENH: 내가 가입한 크루 ID Set — 배지 표시 및 비번 스킵용
  const [myCrewIds, setMyCrewIds] = useState(new Set());
  const [crewSearch, setCrewSearch] = useState(''); // ✅ 크루명 검색어

  const [businessPosts, setBusinessPosts] = useState([]);
  const [selectedBusinessRegion, setSelectedBusinessRegion] = useState('전체'); // 시도 필터
  const [selectedHarbor, setSelectedHarbor] = useState(''); // 항구 필터 (비어있으면 시도에서 전체)
  const [selectedBusinessPost, setSelectedBusinessPost] = useState(null); // 상세 모달용


  // ✅ 7TH-C1: 서버 필터링 결과 직접 사용 — filteredPosts alias가 클라이언트 필터링 의도로 오해 유발
  // posts는 이미 서버에서 필터링된 결과를 포함함 (fetchPosts 수신 시 user.blockedUsers 필터 적용됨)

  // ✅ 실제 낚시배 출항지 2단계 필터 (시도 → 항구)
  const effectiveBusinessPosts = useMemo(() => {
    const now = new Date();
    const withPinCheck = businessPosts
      .map(post => {
        if (post.isPinned && post.expiresAt && new Date(post.expiresAt) < now) {
          return { ...post, isPinned: false, _expired: true };
        }
        return post;
      })
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    // 1단계: 시도 필터
    // ✅ '전국 (전체)' 게시글은 '전체' 탭에서만 노출, 지역 탭 선택 시에는 숨김
    if (selectedBusinessRegion === '전체') {
      const base = !selectedHarbor
        ? withPinCheck  // 전체 탭 + 항구 미선택: '전국 (전체)' 포함 전체 노출
        : withPinCheck.filter(p => (p.region || '') === selectedHarbor); // 항구 선택: 정확히 일치하는 항구만 (전국 제외)
      return base;
    }
    // 지역 탭 선택 시: '전국 (전체)' 게시글 허쟁 제외
    const byRegion = withPinCheck.filter(p =>
      p.region !== '전국 (전체)' && (p.region || '').startsWith(selectedBusinessRegion)
    );
    // 2단계: 항구 필터
    if (!selectedHarbor) return byRegion;
    return byRegion.filter(p => (p.region || '').startsWith(selectedHarbor));
  }, [businessPosts, selectedBusinessRegion, selectedHarbor]);

  // 선택된 시도의 항구 목록 ({label,key} 객체 배열)
  const currentHarbors = useMemo(() => {
    if (selectedBusinessRegion === '전체') return [];
    const found = HARBOR_DATA.find(h => h.region === selectedBusinessRegion);
    return found ? found.harbors : [];
  }, [selectedBusinessRegion]);

  const regionCounts = useMemo(() => {
    // '전국 (전체)' 게시글은 '전체' 카운트에만 포함
    const counts = { '전체': businessPosts.length };
    businessPosts.forEach(p => {
      if (p.region === '전국 (전체)') return; // 지역 별 카운트에는 제외
      const r = (p.region || '').split(' ')[0];
      if (r) counts[r] = (counts[r] || 0) + 1;
    });
    return counts;
  }, [businessPosts]);

  // 항구별 게시글 수 (key prefix 기준 startsWith)
  const harborCounts = useMemo(() => {
    const counts = {};
    HARBOR_DATA.forEach(rd => rd.harbors.forEach(h => {
      counts[h.key] = businessPosts.filter(p => (p.region || '').startsWith(h.key)).length;
    }));
    return counts;
  }, [businessPosts]);

  // 시도 탭 목록 (HARBOR_DATA에서 파생)
  const businessRegions = useMemo(() => ['전체', ...HARBOR_DATA.map(h => h.region)], []);


  const [noticePosts, setNoticePosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ 크루 검색 필터 — 이름·오너명 부분일치 (대소문자 무시)
  const filteredCrews = useMemo(() => {
    const q = crewSearch.trim().toLowerCase();
    if (!q) return crews;
    return crews.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.ownerName || '').toLowerCase().includes(q)
    );
  }, [crews, crewSearch]);

  // ✅ 7TH-A4: 내부 InFeedAd 화살표 함수 제거 — 파일 상단(L12) 외부 정의 사용
  // (렌더마다 새 함수 생성 제거 + 상단 정의는 dead code였음)

  // 2. 글쓰기/방만들기 권한 로직 (보상형 광고 및 방장 등급 체크)
  const handleFabClick = () => {
    if (user?.id === 'GUEST') {
      addToast("로그인이 필요한 기능입니다. 마이페이지에서 로그인해주세요.", "error");
      return;
    }

    if (activeTab === 'open') {
      navigate('/write'); // 무료 사용자도 글쓰기 허용 (글 작성 화면에서 광고 게이트 처리)

    } else if (activeTab === 'crew') {
      if (!canAccessPremium) {
        addToast("무료(Free) 멤버쉽은 '크루 개설 방장 권한'이 없습니다. 업그레이드 후 이용해보세요!", "error");
      } else {
        navigate('/create-crew');
      }
    } else if (activeTab === 'business') {
      if (!canAccessBusinessPromo) {
        addToast('선상 홍보글은 PRO 또는 항구 독점 VVIP 보유자만 작성 가능합니다. 구독 페이지로 이동합니다.', 'error');
        // ✅ 3RD-A5: setTimeout navigate race condition 제거 — 즉시 이동으로 대체
        navigate('/vvip-subscribe');
      } else {
        addToast('선장님 환영합니다! 및 비즈니스 홍보글을 작성합니다.', 'success');
        navigate('/write-business');
      }
    } else if (activeTab === 'notice') {
      if (!isAdmin) {
        addToast("❌ 공지사항은 Fishing GO 마스터(운영자)만 작성할 수 있습니다.", "error");
      } else {
        navigate('/write?type=notice');
      }
    }
  };

  // 게시글 로드 (페이지네이션 + 검색 지원)
  // ✅ 25TH-C2: React.useCallback → useCallback (7TH-B3 named import 패턴 통일)
  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      const params = new URLSearchParams();
      params.set('page', pageNum);
      params.set('limit', 20);
      if (openCategory !== '전체') params.set('category', openCategory);
      if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
      const res = await apiClient.get(`/api/community/posts?${params}`);
      const data = res.data;
      // 서버가 {posts, total, page, totalPages} 형식 반환
      const newPosts = data.posts || data; // 구버전 fallback
      const blocked = user?.blockedUsers || [];
      const filtered = Array.isArray(newPosts) ? newPosts.filter(p => !blocked.includes(p.author)) : [];
      if (append) {
        setPosts(prev => [...prev, ...filtered]);
      } else {
        setPosts(filtered);
      }
      setTotalPages(data.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      // ENH4-A2: 프로덕션 console.error 노출 방지
      if (!import.meta.env.PROD) console.error('Posts fetch error:', err);
    } finally {
      // 1페이지 로드 완료 시 초기 로딩 해제 (append=true인 무한스크롤은 제외)
      if (pageNum === 1 && !append) setLoading(false);
    }
  }, [openCategory, debouncedSearch, user?.blockedUsers]);

  // ✅ 7TH-B2: React.useEffect → useEffect 통일
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // ✅ FIX-COMMUNITY: Promise.all → Promise.allSettled
        // 하나의 API 실패가 나머지 크루/공지/사업글 로딩을 막지 않도록 독립 처리
        const baseRequests = [
          apiClient.get('/api/community/crews').catch(() => ({ data: [] })),
          apiClient.get('/api/community/notices').catch(() => ({ data: [] })),
          apiClient.get('/api/community/business').catch(() => ({ data: [] })),
        ];
        // ✅ CREW-ENH: 로그인 유저면 내 크루 목록도 함께 로드
        const myCrewsPromise = (user?.email && user.email !== 'guest@fishinggo.com')
          ? apiClient.get('/api/user/crews').catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] });

        const [crewsRes, noticesRes, businessRes, myCrewsRes] = await Promise.all([...baseRequests, myCrewsPromise]);
        const blocked = user?.blockedUsers || [];

        // ✅ FIX-EMPTY: ?.length 조건 제거 — 빈 배열([])도 항상 setState 호출
        // 이전: [].length === 0 (falsy) → setCrews 미호출 → 구버전 state 유지 버그
        if (Array.isArray(crewsRes.data)) setCrews(crewsRes.data.filter(c => !blocked.includes(c.ownerName)));
        if (Array.isArray(noticesRes.data)) setNoticePosts(noticesRes.data);
        if (Array.isArray(businessRes.data)) setBusinessPosts(businessRes.data.filter(p => !blocked.includes(p.author)));

        // ✅ CREW-ENH: 내 크루 ID Set 구성
        if (Array.isArray(myCrewsRes?.data) && myCrewsRes.data.length > 0) {
          const ids = new Set(myCrewsRes.data.map(c => String(c._id || c.id)));
          setMyCrewIds(ids);
        }
      } catch (err) {
        // ENH4-A2: 프로덕션 console.error 노출 방지
        if (!import.meta.env.PROD) console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // fetchPosts는 아래 useEffect가 마운트 시에도 실행하므로 여기서 중복 호출 제거
  }, [location.search, user?.email]);

  // 마운트·카테고리·검색어 변경 시 1페이지부터 재로드 (단 한 번만 실행됨)
  // ENH4-C2: location.search 변화 시 fetchPosts 중복 호출 가능성 업음 (openCategory/debouncedSearch가 파생 커버)
  // 현재는 오픈게시판 사용 시만 fetchPosts 호출, 탭 전환 시 URL이 바끼어도 연동 안 됨 — 탭 활성 조건을 없애면 중복 fetch 발생 감소
  // ✅ 7TH-B2: React.useEffect → useEffect 통일
  // ✅ 25TH-C1: fetchPosts가 useCallback으로 안정화 — eslint-disable 없이 deps에 명시적 포함
  useEffect(() => {
    if (activeTab === 'open') fetchPosts(1, false);
  }, [openCategory, debouncedSearch, activeTab, fetchPosts]);

  // 무한스크롤: sentinel div가 뷰포트에 들어오면 다음 페이지 자동 로드
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && page < totalPages) {
          setLoadingMore(true);
          fetchPosts(page + 1, true).finally(() => setLoadingMore(false));
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [page, totalPages, loadingMore, fetchPosts]);

  const handleLoadMore = async () => {
    if (page >= totalPages) return;
    setLoadingMore(true);
    await fetchPosts(page + 1, true);
    setLoadingMore(false);
  };


  const handleDeletePost = async (e, id, type) => {
    e.stopPropagation();
    const myEmail = user?.email || user?.id || null;
    const myName = user?.name || null;
    const isAuthorDelete =
      (type === 'open' && posts.find(p => String(p._id || p.id) === String(id))?.author_email === myEmail) ||
      (type === 'business' && businessPosts.find(p => String(p._id || p.id) === String(id))?.author_email === myEmail);
    if (!isAdmin && !isAuthorDelete) return;
    // window.confirm 제거 — 권한 체크 통과 시 즉시 삭제 (PostDetail에 인앱 확인 모달 있음)
    try {
      const endpoint =
        type === 'open' ? `/api/community/posts/${id}` :
          type === 'business' ? `/api/community/business/${id}` :
            type === 'notice' ? `/api/community/notices/${id}` : null;
      if (endpoint) await apiClient.delete(endpoint, {
        data: {
          email: myEmail,
        }
      });
      if (type === 'open') setPosts(prev => prev.filter(p => (p._id || p.id) !== id));
      if (type === 'business') setBusinessPosts(prev => prev.filter(p => (p._id || p.id) !== id));
      if (type === 'notice') setNoticePosts(prev => prev.filter(p => (p._id || p.id) !== id));
      addToast('게시물이 삭제되었습니다.', 'success');
    } catch (err) {
      const errMsg = err.response?.data?.error || '삭제에 실패했습니다. 다시 시도해주세요.';
      addToast(errMsg, 'error');
    }

  };



  // ✅ MASTER 전용: 크루 강제 삭제
  const handleAdminDeleteCrew = async (crewId, crewName) => {
    if (!window.confirm(`[MASTER] '${crewName}' 크루를 강제 삭제하시겠습니까?`)) return;
    try {
      await apiClient.delete(`/api/community/crews/${crewId}`, { data: { email: user?.email } });
      setCrews(prev => prev.filter(c => String(c._id || c.id) !== crewId));
      addToast(`[MASTER] '${crewName}' 크루가 삭제되었습니다.`, 'success');
    } catch (err) {
      addToast(err.response?.data?.error || '삭제에 실패했습니다.', 'error');
    }
  };

  const handleLike = async (e, postId) => {
    e.stopPropagation();
    if (!user || user.id === 'GUEST') { addToast('로그인 후 이용 가능합니다.', 'error'); return; }
    if (likedPosts[postId]) { addToast('이미 좋아요를 눌렀습니다. ❤️', 'info'); return; }

    // ✅ Optimistic UI — 즉시 로컬 반영
    const prevLiked = { ...likedPosts };
    const newLiked = { ...likedPosts, [postId]: true };
    setLikedPosts(newLiked);
    localStorage.setItem('community_liked_posts', JSON.stringify(newLiked));
    setPosts(prev => prev.map(p => (p._id || p.id) === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));

    // 하트 버스트 애니메이션 트리거
    setLikeAnimating(prev => ({ ...prev, [postId]: true }));
    // ✅ 25TH-C3: 언마운트 후 setState 누수 방지 — ref에 타이머 ID 저장하고 cleanup (5TH-A4 패턴)
    if (likeTimerRef.current[postId]) clearTimeout(likeTimerRef.current[postId]);
    likeTimerRef.current[postId] = setTimeout(() => {
      setLikeAnimating(prev => ({ ...prev, [postId]: false }));
      delete likeTimerRef.current[postId];
    }, 700);

    // ✅ 서버 동기화 (JWT 자동 주입 — apiClient interceptor)
    try {
      const res = await apiClient.post(`/api/community/posts/${postId}/like`);
      // 서버 응답의 정확한 likes 수로 동기화
      const serverLikes = res.data?.likes;
      if (typeof serverLikes === 'number') {
        setPosts(prev => prev.map(p => (p._id || p.id) === postId ? { ...p, likes: serverLikes } : p));
      }
    } catch (err) {
      const status = err.response?.status;
      const code = err.response?.data?.code;
      if (status === 409) {
        // 서버 기준 이미 좋아요 → 로컬 상태는 유지 (중복 방어 성공)
        const serverLikes = err.response?.data?.likes;
        if (typeof serverLikes === 'number') {
          setPosts(prev => prev.map(p => (p._id || p.id) === postId ? { ...p, likes: serverLikes } : p));
        }
        return;
      }
      if (status === 401 || code === 'AUTH_REQUIRED') {
        // JWT 만료 — Optimistic UI 롤백
        setLikedPosts(prevLiked);
        localStorage.setItem('community_liked_posts', JSON.stringify(prevLiked));
        setPosts(prev => prev.map(p => (p._id || p.id) === postId ? { ...p, likes: Math.max((p.likes || 1) - 1, 0) } : p));
        addToast('로그인이 필요합니다.', 'error');
        return;
      }
      // 네트워크 오류 등 — 로컬 상태는 유지 (낙관적 처리), 경고만 출력
      if (!import.meta.env.PROD) console.warn('[Like] 서버 동기화 실패 (로컬 반영 유지):', err.message);
    }
  };

  return (
    <div className="page-container" style={{ backgroundColor: '#F2F2F7' }}>
      {/* 프리미엄 헤더 */}
      <div style={{ backgroundColor: '#fff', padding: '24px 20px 0', borderBottom: '1px solid #F0F0F0' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '20px' }}>커뮤니티</h1>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('open')}
            style={{
              flex: 1, padding: '12px 0', backgroundColor: 'transparent',
              border: 'none', borderBottom: activeTab === 'open' ? '3px solid #0056D2' : '3px solid transparent',
              color: activeTab === 'open' ? '#0056D2' : '#999',
              fontWeight: activeTab === 'open' ? 'bold' : 'normal', fontSize: '1rem', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            오픈 게시판
          </button>
          <button
            onClick={() => setActiveTab('crew')}
            style={{
              flex: 1, padding: '12px 0', backgroundColor: 'transparent',
              border: 'none', borderBottom: activeTab === 'crew' ? '3px solid #0056D2' : '3px solid transparent',
              color: activeTab === 'crew' ? '#0056D2' : '#999',
              fontWeight: activeTab === 'crew' ? 'bold' : 'normal', fontSize: '1rem', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            크루
          </button>
          <button
            onClick={() => setActiveTab('notice')}
            style={{
              flex: 1, padding: '12px 0', backgroundColor: 'transparent',
              border: 'none', borderBottom: activeTab === 'notice' ? '3px solid #FF3B30' : '3px solid transparent',
              color: activeTab === 'notice' ? '#FF3B30' : '#999',
              fontWeight: activeTab === 'notice' ? '900' : 'bold', fontSize: '1rem', cursor: 'pointer',
              transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            공지사항
          </button>
          <button
            onClick={() => setActiveTab('business')}
            style={{
              flex: 1, padding: '12px 0', backgroundColor: 'transparent',
              border: 'none', borderBottom: activeTab === 'business' ? '3px solid #0056D2' : '3px solid transparent',
              color: activeTab === 'business' ? '#0056D2' : '#999',
              fontWeight: activeTab === 'business' ? '900' : 'bold', fontSize: '1rem', cursor: 'pointer',
              transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            선상 배 홍보
          </button>
        </div>
      </div>

      {/* 오픈게시판 카테고리 필터 + 검색 탭 */}
      {activeTab === 'open' && (
        <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #F0F0F0' }}>
          {/* 검색창 */}
          <div style={{ padding: '10px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F2F2F7', borderRadius: '12px', padding: '8px 14px' }}>
              <span style={{ fontSize: '16px' }}>🔍</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="게시글 검색 (내용, 작성자)"
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: '#1c1c1e' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#999', fontSize: '16px' }}>✕</button>
              )}
            </div>
          </div>
          {/* 카테고리 필터 */}
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ display: 'flex', gap: '6px', padding: '10px 16px', width: 'max-content' }}>
              {OPEN_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setOpenCategory(cat)}
                  style={{
                    padding: '7px 18px', borderRadius: '20px', border: 'none',
                    fontSize: '13px', fontWeight: openCategory === cat ? '900' : '700',
                    cursor: 'pointer',
                    backgroundColor: openCategory === cat ? '#0056D2' : '#F2F2F7',
                    color: openCategory === cat ? '#fff' : '#555',
                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                    boxShadow: openCategory === cat ? '0 2px 8px rgba(0,86,210,0.3)' : 'none',
                  }}
                >{cat}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 탭 내용 렌더링 영역 */}
      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ padding: '16px' }}><SkeletonCard count={5} /></div>
        ) : activeTab === 'notice' ? (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {noticePosts.map(notice => (
              <div
                key={String(notice._id || notice.id)}
                onClick={() => navigate(`/notice/${String(notice._id || notice.id)}`, { state: { notice } })}
                style={{ backgroundColor: notice.isPinned ? '#FFF1F0' : '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', position: 'relative', border: notice.isPinned ? '1px solid #FFCCC7' : '1px solid #E5E5EA', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  {notice.isPinned && <div style={{ padding: '4px 8px', backgroundColor: '#FF3B30', color: '#fff', fontSize: '10px', borderRadius: '6px', fontWeight: '900' }}>중요 필독</div>}
                  <div style={{ fontSize: '12px', color: '#888', fontWeight: 'bold' }}>{notice.date}</div>
                  <div style={{ fontSize: '11px', color: '#aaa', marginLeft: 'auto' }}>조회 {notice.views}</div>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#1c1c1e', marginBottom: '8px', wordBreak: 'keep-all' }}>{notice.title}</h3>
                <p style={{
                  fontSize: '14px', color: '#777', lineHeight: '1.6', paddingBottom: isAdmin ? '36px' : '0',
                  overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                }}>{notice.content}</p>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#0056D2', fontWeight: '700', paddingBottom: isAdmin ? '36px' : '0' }}>
                  자세히 보기 →
                </div>

                {isAdmin && (
                  <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', gap: '6px' }}>
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/write?type=notice&editId=${notice._id || notice.id}`); }} style={{ border: 'none', background: 'rgba(0,86,210,0.1)', color: '#0056D2', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Edit2 size={13} /> 수정
                    </button>
                    <button onClick={(e) => handleDeletePost(e, notice._id || notice.id, 'notice')} style={{ border: 'none', background: 'rgba(255,59,48,0.1)', color: '#FF3B30', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Trash2 size={13} /> 삭제
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : activeTab === 'open' ? (
          <div className="fade-in">
            <BannerAd style={{ marginBottom: '16px' }} />
            {posts.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#AAB0BE' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎣</div>
                <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '6px', color: '#555' }}>아직 게시글이 없습니다</div>
                <div style={{ fontSize: '13px' }}>첫 조황을 공유해보세요!</div>
              </div>
            )}
            {posts.map((post, index) => {
              const postId = post._id || post.id;
              return (
                <React.Fragment key={postId}>
                  <div
                    id={`post-${postId}`}
                    onClick={() => navigate(`/post/${postId}`, { state: { fromTab: 'open' } })}
                    style={{
                      backgroundColor: '#fff', padding: '16px', borderRadius: '16px', marginBottom: '12px',
                      boxShadow: highlightedPostId === postId ? '0 0 0 3px #0056D2' : '0 2px 10px rgba(0,0,0,0.03)',
                      border: highlightedPostId === postId ? '1px solid #0056D2' : '1px solid #f0f0f0',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.3s ease, border-color 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {(post.author === ADMIN_ID || post.author === 'sunjulab') ? ( // ✅ ADMIN_ID 상수 + 레거시 닉네임 호환
                          <span style={{ fontSize: '10px', background: 'linear-gradient(135deg, #E60000, #990000)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: '900' }}>MASTER</span>
                        ) : post.author_email === 'premium_user@fishinggo.com' ? (
                          <span style={{ fontSize: '10px', background: 'linear-gradient(135deg, #FFD700, #F57F17)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: '900' }}>PRO</span>
                        ) : null}
                        <span style={{ fontSize: '11px', backgroundColor: 'rgba(0,86,210,0.08)', color: '#0056D2', padding: '4px 8px', borderRadius: '6px', fontWeight: '800' }}>{post.category}</span>
                        <strong
                          onClick={(e) => { e.stopPropagation(); navigate(`/user/${encodeURIComponent(post.author)}`); }}
                          style={{ fontSize: '14px', color: '#333', cursor: 'pointer' }}
                        >{post.author}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#bbb' }}>{post.time}</span>
                        {(isAdmin || post.author_email === user?.email) && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/write?editId=${postId}`); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#0056D2' }}>
                              <Edit2 size={15} />
                            </button>
                            <button onClick={(e) => handleDeletePost(e, postId, 'open')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#FF3B30' }}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p style={{ margin: '8px 0 16px 0', fontSize: '15px', color: '#1c1c1e', lineHeight: '1.6', fontWeight: '400' }}>{post.content}</p>
                    {post.image && (
                      <div style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', border: '1px solid #f0f0f0' }}>
                        <img src={post.image} alt="post" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '16px', color: '#8e8e93', borderTop: '1px solid #f8f8f8', paddingTop: '12px' }}>
                      <span
                        onClick={(e) => handleLike(e, post._id || post.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px',
                          cursor: 'pointer', position: 'relative',
                          color: likedPosts[post._id || post.id] ? '#FF5A5F' : '#8e8e93',
                          fontWeight: likedPosts[post._id || post.id] ? '800' : '400',
                          transition: 'color 0.2s',
                          userSelect: 'none',
                        }}
                      >
                        <Heart
                          size={16}
                          color="#FF5A5F"
                          fill={likedPosts[post._id || post.id] ? '#FF5A5F' : 'none'}
                          style={{
                            transform: likeAnimating[post._id || post.id] ? 'scale(1.6)' : 'scale(1)',
                            transition: 'transform 0.25s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
                            filter: likeAnimating[post._id || post.id] ? 'drop-shadow(0 0 6px #FF5A5F)' : 'none',
                          }}
                        />
                        {post.likes || 0}
                        {/* 하트 버스트 파티클 */}
                        {likeAnimating[post._id || post.id] && (
                          <span style={{
                            position: 'absolute', top: '-18px', left: '0',
                            fontSize: '18px', pointerEvents: 'none',
                            animation: 'heartBurst 0.7s ease-out forwards',
                          }}>❤️</span>
                        )}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}><MessageSquare size={16} /> {post.comments?.length || 0}</span>
                    </div>
                  </div>
                  {/* [정지 방지] 4개 글당 1개 - 과도한 광고 도배 금지 */}
                  {(index + 1) % 4 === 0 && <NativeAd />}
                  {!canAccessPremium && (index + 1) % AD_CONFIG.FREE_USER.FEED_AD_INTERVAL === 0 && <InFeedAd />}
                </React.Fragment>
              )
            })}
          </div>
        ) : activeTab === 'crew' ? (
          // [프라이빗 크루 뷰]
          <div className="fade-in">
            {/* 크루 검색창 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', borderRadius: '14px', padding: '10px 16px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>🔍</span>
              <input
                value={crewSearch}
                onChange={e => setCrewSearch(e.target.value)}
                placeholder="크루명 검색"
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: '#1c1c1e', fontWeight: '600' }}
              />
              {crewSearch && (
                <button onClick={() => setCrewSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#bbb', fontSize: '16px', padding: 0, lineHeight: 1 }}>✕</button>
              )}
            </div>
            {/* 검색 결과 없음 */}
            {filteredCrews.length === 0 && crews.length > 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#555', marginBottom: '4px' }}>검색 결과가 없습니다</div>
                <div style={{ fontSize: '13px' }}>'{crewSearch}' 에 해당하는 크루가 없습니다</div>
              </div>
            )}
            {filteredCrews.map(crew => {
              const crewId = String(crew._id || crew.id);
              const isMyCrew = myCrewIds.has(crewId);
              return (
              <div key={crewId} style={{ backgroundColor: '#fff', padding: '18px', borderRadius: '16px', marginBottom: '12px', flexDirection: 'column', boxShadow: isMyCrew ? '0 2px 10px rgba(0,86,210,0.12)' : '0 2px 10px rgba(0,0,0,0.03)', border: isMyCrew ? '1.5px solid #0056D2' : '1px solid #f0f0f0' }}>
                {/* 상단: 정보 + 입장 버튼 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      {isMyCrew && <span style={{ fontSize: '9px', fontWeight: '900', background: '#0056D2', color: '#fff', padding: '2px 7px', borderRadius: '8px', flexShrink: 0 }}>내 크루</span>}
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1c1c1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{crew.name}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', color: '#8e8e93', fontSize: '13px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> 인원 {crew.members}/{crew.limit != null ? crew.limit : 1000}</span>
                      {crew.region && crew.region !== '전국' && <span style={{ color: '#bbb' }}>📍 {crew.region}</span>}
                    </div>
                  </div>
                  {/* 입장 버튼 */}
                  {isMyCrew ? (
                    <button onClick={() => navigate(`/crew/${crewId}/chat`)} style={{ backgroundColor: '#0056D2', border: 'none', padding: '8px 18px', borderRadius: '20px', color: '#fff', fontSize: '13px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,86,210,0.2)', flexShrink: 0, marginLeft: '8px' }}>
                      채팅 입장
                    </button>
                  ) : crew.isPrivate ? (
                    <button
                      onClick={() => {
                        if (user?.id === 'GUEST') { addToast('로그인이 필요한 기능입니다. 마이페이지에서 로그인해주세요.', 'error'); return; }
                        setCrewPassInput(''); setCrewPassModal({ crew });
                      }}
                      style={{ backgroundColor: '#f5f5f7', border: 'none', padding: '12px', borderRadius: '50%', color: '#0056D2', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0, marginLeft: '8px' }}
                    >
                      <Lock size={20} />
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        if (user?.id === 'GUEST') { addToast('로그인이 필요한 기능입니다. 마이페이지에서 로그인해주세요.', 'error'); return; }
                        try {
                          await apiClient.post(`/api/community/crews/${crewId}/join`, { email: user.email, name: user.name });
                          setMyCrewIds(prev => new Set([...prev, crewId]));
                        } catch { /* 실패해도 채팅 진입은 허용 */ }
                        navigate(`/crew/${crewId}/chat`);
                      }}
                      style={{ backgroundColor: '#0056D2', border: 'none', padding: '8px 18px', borderRadius: '20px', color: '#fff', fontSize: '13px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,86,210,0.2)', flexShrink: 0, marginLeft: '8px' }}
                    >
                      입장하기
                    </button>
                  )}
                </div>
                {/* ✅ MASTER 전용: 강제 삭제 영역 */}
                {isAdmin && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #FFE0E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#FF3B30', fontWeight: '900', background: 'rgba(255,59,48,0.08)', padding: '2px 8px', borderRadius: '6px' }}>MASTER 관리</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAdminDeleteCrew(crewId, crew.name); }}
                      style={{ border: 'none', background: 'rgba(255,59,48,0.1)', color: '#FF3B30', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Trash2 size={12} /> 강제 삭제
                    </button>
                  </div>
                )}
              </div>
              );
            })}

          </div>
        ) : (
          // [비즈니스: 선상 배 홍보 뷰]
          <div className="fade-in">
            <div style={{ padding: '16px', background: 'linear-gradient(135deg, #0A192F, #1A365D)', borderRadius: '16px', marginBottom: '20px', color: '#fff', boxShadow: '0 8px 24px rgba(10,25,47,0.2)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}><Award size={100} /></div>
              <div style={{ fontSize: '15px', fontWeight: '950', color: '#FFD700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={18} /> 프리미엄 선상 직거래
              </div>
              <p style={{ margin: '0 0 4px', fontSize: '12.5px', fontWeight: '700', lineHeight: '1.4' }}>비즈니스 인증을 거친 검증된 선장님들의 공간입니다.</p>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>게시물 하단의 [직통 전화] 버튼을 눌러 수수료 없이 다이렉트 예약하세요!</p>
            </div>
            {/* ✅ 1단계: 시도 칩 */}
            <div style={{
              display: 'flex', gap: '7px', overflowX: 'auto', paddingBottom: '4px',
              marginBottom: '8px', scrollbarWidth: 'none', msOverflowStyle: 'none',
            }}>
              {businessRegions.map(region => {
                const count = regionCounts[region] || 0;
                const isActive = selectedBusinessRegion === region;
                const hasPost = count > 0;
                const hd = HARBOR_DATA.find(h => h.region === region);
                return (
                  <button
                    key={region}
                    onClick={() => { setSelectedBusinessRegion(region); setSelectedHarbor(''); }}
                    style={{
                      flexShrink: 0, padding: '7px 13px', borderRadius: '20px',
                      border: isActive ? 'none' : `1.5px solid ${hasPost ? '#0056D2' : '#E5E5EA'}`,
                      fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.15s',
                      background: isActive ? 'linear-gradient(135deg, #0056D2, #0096FF)' : hasPost ? '#EEF4FF' : '#F5F5F7',
                      color: isActive ? '#fff' : hasPost ? '#0056D2' : '#bbb',
                      boxShadow: isActive ? '0 4px 12px rgba(0,86,210,0.3)' : 'none',
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}
                  >
                    {region === '전체' ? '🗺️ 전체' : `${hd?.emoji || '📍'} ${region}`}
                    {count > 0 && (
                      <span style={{
                        background: isActive ? 'rgba(255,255,255,0.3)' : '#0056D2',
                        color: '#fff', borderRadius: '10px', padding: '1px 6px',
                        fontSize: '10px', fontWeight: '900',
                      }}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ✅ 2단계: 항구 칩 — 시도 선택 시 슬라이드인 애니메이션으로 등장 */}
            {currentHarbors.length > 0 && (
              <div
                key={selectedBusinessRegion}
                style={{
                  display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px',
                  marginBottom: '14px', scrollbarWidth: 'none', msOverflowStyle: 'none',
                  animation: 'harborSlideIn 0.28s cubic-bezier(0.22,1,0.36,1)',
                  transformOrigin: 'top left',
                }}
              >
                <style>{`
                  @keyframes harborSlideIn {
                    from { opacity: 0; transform: translateY(-10px) scaleY(0.8); }
                    to   { opacity: 1; transform: translateY(0)    scaleY(1);   }
                  }
                `}</style>
                <button
                  onClick={() => setSelectedHarbor('')}
                  style={{
                    flexShrink: 0, padding: '5px 12px', borderRadius: '14px', border: 'none',
                    fontSize: '11px', fontWeight: '800', cursor: 'pointer',
                    background: !selectedHarbor ? '#1A1A2E' : '#F0F0F5',
                    color: !selectedHarbor ? '#fff' : '#555', transition: 'all 0.15s',
                  }}
                >전체 항구</button>
                {currentHarbors.map(harbor => {
                  const isActive = selectedHarbor === harbor.key;
                  const count = harborCounts[harbor.key] || 0;
                  return (
                    <button
                      key={harbor.key}
                      onClick={() => setSelectedHarbor(harbor.key)}
                      style={{
                        flexShrink: 0, padding: '5px 12px', borderRadius: '14px',
                        border: `1px solid ${isActive ? '#1A1A2E' : count > 0 ? '#888' : '#DDD'}`,
                        fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s',
                        background: isActive ? '#1A1A2E' : count > 0 ? '#F5F5F7' : '#FAFAFA',
                        color: isActive ? '#fff' : count > 0 ? '#333' : '#CCC',
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}
                    >
                      ⚓ {harbor.label}
                      {count > 0 && (
                        <span style={{
                          background: isActive ? 'rgba(255,255,255,0.25)' : '#555',
                          color: '#fff', borderRadius: '8px', padding: '0px 5px', fontSize: '9px', fontWeight: '900',
                        }}>{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {effectiveBusinessPosts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚢</div>
                <div style={{ fontSize: '13px', fontWeight: '700' }}>
                  {selectedBusinessRegion === '전체' ? '등록된 홍보글이 없습니다' : `${selectedBusinessRegion} 지역 홍보글이 없습니다`}
                </div>
              </div>
            )}


            {effectiveBusinessPosts.map((post) => (
              <React.Fragment key={post._id || post.id}>
                {post.isPinned ? (
                  /* VVIP 프리미엄 대형 카드 */
                  <div style={{ backgroundColor: '#FEFCF5', borderRadius: '20px', marginBottom: '20px', boxShadow: '0 12px 40px rgba(255,215,0,0.25)', border: '2.5px solid #FFD700', overflow: 'hidden' }}>
                    <div style={{ background: 'linear-gradient(90deg, #FFD700, #FF9B26)', color: '#5C3A00', padding: '10px 16px', fontSize: '12px', fontWeight: '950', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Award size={14} fill="#5C3A00" /> VVIP 프리미엄 스폰서 — 해당 항구 1위 독점</span>
                      {/* ✅ VVIP 카드: 작성자 or 마스터만 수정/삭제 */}
                      {(isAdmin || post.author_email === user?.email) && (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/write-business?editId=${post._id || post.id}`); }}
                            style={{ background: 'rgba(0,0,0,0.12)', border: 'none', cursor: 'pointer', color: '#5C3A00', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '3px' }}
                          ><Edit2 size={11} /> 수정</button>
                          <button
                            onClick={(e) => handleDeletePost(e, post._id || post.id, 'business')}
                            style={{ background: 'rgba(0,0,0,0.12)', border: 'none', cursor: 'pointer', color: '#5C3A00', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '3px' }}
                          ><Trash2 size={11} /> 삭제</button>
                        </div>
                      )}
                    </div>
                    <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setSelectedBusinessPost(post)}>
                      <img src={post.cover} style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} alt="배" />
                      <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.65)', color: '#FFD700', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '900' }}>
                        👑 {post.region || '항구 전용 VVIP'}
                      </div>
                      <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#FF5A5F', color: '#fff', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '950' }}>예약 모집중</div>
                    </div>
                    <div style={{ padding: '20px 18px', cursor: 'pointer' }} onClick={() => setSelectedBusinessPost(post)}>
                      <div style={{ fontSize: '22px', fontWeight: '950', color: '#1A1A2E', marginBottom: '10px' }}>{post.shipName}</div>
                      {/* ✅ WARN-CT1: post.content null guard */}
                      <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#333', lineHeight: '1.8', fontWeight: '600' }}>{(post.content || '').slice(0, 140)}{(post.content || '').length > 140 ? '...' : ''}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '13px' }}>
                        <span style={{ background: '#F4F6FA', padding: '7px 14px', borderRadius: '12px', color: '#333', fontWeight: '800' }}>🎣 {post.target}</span>
                        <span style={{ background: '#F4F6FA', padding: '7px 14px', borderRadius: '12px', color: '#333', fontWeight: '800' }}>📅 {post.date}</span>
                        <span style={{ background: '#FFF3E0', padding: '7px 14px', borderRadius: '12px', color: '#E65100', fontWeight: '950' }}>💰 {post.price}</span>
                      </div>
                    </div>
                    <div style={{ padding: '0 18px 20px', display: 'flex', gap: '12px' }}>
                      <button onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${post.phone || ''}`; }} style={{ flex: 1, backgroundColor: '#0056D2', color: '#fff', border: 'none', padding: '18px', borderRadius: '16px', fontWeight: '950', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 6px 18px rgba(0,86,210,0.3)' }}>
                        <Phone size={20} fill="#fff" /> 선장님께 즉시 전화
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); window.location.href = `sms:${post.phone || ''}?body=${encodeURIComponent(`안녕하세요! 낚시GO에서 [${post.shipName}] 선상낚시 예약 문의드립니다.\n\n▶ 원하는 날짜:\n▶ 인원:\n▶ 기타 문의:`)}` ; }} style={{ backgroundColor: '#fff', color: '#00875A', border: '2px solid #00875A', padding: '18px 20px', borderRadius: '16px', fontWeight: '900', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <MessageSquare size={20} /> 문자 보내기
                      </button>
                    </div>
                  </div>
                ) : null}
                {/* VVIP 카드 바로 아래 광고 */}
                {post.isPinned && <BannerAd style={{ marginBottom: '16px' }} />}
                {!post.isPinned && (

                  <div style={{
                    backgroundColor: '#fff', borderRadius: '16px', marginBottom: '12px',
                    boxShadow: post.region === '전국 (전체)'
                      ? '0 4px 16px rgba(0,86,210,0.15)'
                      : '0 2px 8px rgba(0,0,0,0.04)',
                    border: post.region === '전국 (전체)'
                      ? '1.5px solid #0056D2'
                      : '1px solid #F0F2F7',
                    overflow: 'hidden'
                  }}>
                    {/* ✅ 전국(전체) 게시글: 상단 MASTER 배지 헤더 */}
                    {post.region === '전국 (전체)' && (
                      <div style={{
                        background: 'linear-gradient(90deg, #0056D2, #0096FF)',
                        color: '#fff', padding: '7px 14px',
                        fontSize: '11px', fontWeight: '900',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                      }}>
                        <span>🌐 MASTER 공식 전국 홍보 &mdash; 모든 지역 출항 정보</span>
                        {/* ✅ 전국 게시글은 마스터만 작성 가능 → 작성자 or 관리자 수정/삭제 */}
                        {(isAdmin || post.author_email === user?.email) && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/write-business?editId=${post._id || post.id}`); }}
                              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', borderRadius: '6px', padding: '2px 7px', fontSize: '10px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '2px' }}
                            ><Edit2 size={10} /> 수정</button>
                            <button
                              onClick={(e) => handleDeletePost(e, post._id || post.id, 'business')}
                              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', borderRadius: '6px', padding: '2px 7px', fontSize: '10px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '2px' }}
                            ><Trash2 size={10} /> 삭제</button>
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ padding: '12px', cursor: 'pointer' }} onClick={() => setSelectedBusinessPost(post)}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <img src={post.cover} style={{ width: '76px', height: '76px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} alt="배" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '5px' }}>
                            <span style={{ fontSize: '9px', background: '#FF5A5F', color: '#fff', padding: '2px 6px', borderRadius: '5px', fontWeight: '950', flexShrink: 0 }}>모집중</span>
                            {/* ✅ 지역 배지 */}
                            {post.region === '전국 (전체)' ? (
                              <span style={{ fontSize: '9px', background: 'rgba(0,86,210,0.12)', color: '#0056D2', padding: '2px 7px', borderRadius: '5px', fontWeight: '900', flexShrink: 0 }}>🌐 전국</span>
                            ) : post.region ? (
                              <span style={{ fontSize: '9px', background: '#F0F0F5', color: '#555', padding: '2px 7px', borderRadius: '5px', fontWeight: '800', flexShrink: 0 }}>📍 {post.region}</span>
                            ) : null}
                            <span style={{ fontSize: '14px', fontWeight: '950', color: '#1A1A2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.shipName}</span>
                            {/* ✅ 작성자 or 마스터: 수정/삭제 (region 제한 없이 모든 카드에 표시) */}
                            {(isAdmin || post.author_email === user?.email) && post.region !== '전국 (전체)' && (
                              <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto', flexShrink: 0 }}>
                                <button onClick={(e) => { e.stopPropagation(); navigate(`/write-business?editId=${post._id || post.id}`); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#0056D2' }}><Edit2 size={14} /></button>
                                <button onClick={(e) => handleDeletePost(e, post._id || post.id, 'business')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#FF3B30' }}><Trash2 size={14} /></button>
                              </div>
                            )}
                          </div>
                          {/* ✅ WARN-CT1: post.content null guard (소형 카드) */}
                          <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#666', lineHeight: '1.5' }}>{(post.content || '').slice(0, 45)}...</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '10px' }}>
                            <span style={{ background: '#F4F6FA', padding: '3px 8px', borderRadius: '6px', color: '#333' }}>{post.target}</span>
                            <span style={{ background: '#FFF3E0', padding: '3px 8px', borderRadius: '6px', color: '#E65100', fontWeight: '800' }}>{post.price}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '8px 12px', background: '#F8F9FA', borderTop: '1px solid #F0F2F7', display: 'flex', gap: '6px' }}>
                      <button onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${post.phone || ''}`; }} style={{ flex: 1, backgroundColor: '#0056D2', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '950', fontSize: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <Phone size={13} fill="#fff" /> 즉시 전화
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); window.location.href = `sms:${post.phone || ''}?body=${encodeURIComponent(`안녕하세요! 낙시GO에서 [${post.shipName}] 예약 문의드립니다.\n▶ 날짜:\n▶ 인원:`)}` ; }} style={{ backgroundColor: '#fff', color: '#00875A', border: '1.5px solid #00875A', padding: '10px 12px', borderRadius: '10px', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <MessageSquare size={13} /> 문자
                      </button>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
            {/* 무한스크롤 sentinel (더 보기 버튼 대체) */}
            <div ref={sentinelRef} style={{ height: 20 }} />
            {loadingMore && (
              <div style={{ padding: '0 16px 12px' }}><SkeletonCard count={2} /></div>
            )}
            {page >= totalPages && posts.length > 0 && (
              <div style={{ textAlign: 'center', padding: '20px', fontSize: '13px', color: '#bbb' }}>
                모든 게시글을 불러왔습니다 🎣
              </div>
            )}
          </div>
        )}
      </div>

      {/* ✅ 선상배 게시글 상세 바텀시트 모달 */}
      {selectedBusinessPost && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 9990, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedBusinessPost(null); }}
        >
          <div style={{
            width: '100%', maxWidth: '480px', background: '#fff',
            borderRadius: '28px 28px 0 0', maxHeight: '92dvh', overflowY: 'auto',
            boxShadow: '0 -24px 80px rgba(0,0,0,0.4)',
            animation: 'bsSlideUp 0.32s cubic-bezier(0.22,1,0.36,1)',
          }}>
            <style>{`
              @keyframes bsSlideUp {
                from { transform: translateY(100%); opacity: 0; }
                to   { transform: translateY(0);    opacity: 1; }
              }
            `}</style>

            {/* 드래그 핸들 */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 0' }}>
              <div style={{ width: '44px', height: '5px', background: '#E0E0E8', borderRadius: '3px' }} />
            </div>

            {/* 헤더 닫기 버튼 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 16px 4px' }}>
              <button onClick={() => setSelectedBusinessPost(null)} style={{ border: 'none', background: '#F2F2F7', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#888', fontWeight: '900' }}>✕</button>
            </div>

            {/* 커버 이미지 */}
            <div style={{ position: 'relative', margin: '0 16px', borderRadius: '20px', overflow: 'hidden' }}>
              <img
                src={selectedBusinessPost.cover || 'https://picsum.photos/seed/fishingboat/600/300'}
                alt="선상 배"
                style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
                onError={(e) => { e.target.src = 'https://picsum.photos/seed/boat/600/300'; }}
              />
              {/* 그라디언트 오버레이 */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
              {/* 배지 */}
              {selectedBusinessPost.isPinned ? (
                <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'linear-gradient(90deg,#FFD700,#FF9B26)', color: '#5C3A00', padding: '5px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Award size={12} fill="#5C3A00" /> VVIP 독점
                </div>
              ) : (
                <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#FF5A5F', color: '#fff', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '950' }}>모집중</div>
              )}
              {/* 지역 */}
              <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '5px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '800' }}>
                📍 {selectedBusinessPost.region || '지역 미표시'}
              </div>
              {/* 가격 */}
              <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: '#0056D2', color: '#fff', padding: '5px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '950' }}>
                {selectedBusinessPost.price || '문의'}
              </div>
            </div>

            {/* 본문 */}
            <div style={{ padding: '20px 20px 0' }}>
              {/* 타입 + 선박명 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', background: '#F0F5FF', color: '#0056D2', padding: '3px 10px', borderRadius: '8px', fontWeight: '900', flexShrink: 0 }}>{selectedBusinessPost.type || '선상낚시'}</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '950', color: '#1A1A2E', marginBottom: '6px', lineHeight: 1.2 }}>{selectedBusinessPost.shipName}</div>
              <div style={{ fontSize: '13px', color: '#888', fontWeight: '700', marginBottom: '18px' }}>선장 · {selectedBusinessPost.author}</div>

              {/* 정보 그리드 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                {[
                  { icon: '🎣', label: '대상어종', value: selectedBusinessPost.target },
                  { icon: '📅', label: '운항 일정', value: selectedBusinessPost.date },
                  { icon: '👥', label: '모집 인원', value: selectedBusinessPost.capacity ? `${selectedBusinessPost.capacity}명` : '문의' },
                  { icon: '📞', label: '연락처', value: selectedBusinessPost.phone },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ background: '#F8F9FC', borderRadius: '14px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', color: '#AAB0BE', fontWeight: '800', marginBottom: '4px' }}>{icon} {label}</div>
                    <div style={{ fontSize: '13px', color: '#1A1A2E', fontWeight: '800', lineHeight: 1.3 }}>{value || '-'}</div>
                  </div>
                ))}
              </div>

              {/* 전체 소개글 */}
              <div style={{ background: '#F8F9FC', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: '#AAB0BE', fontWeight: '800', marginBottom: '10px' }}>🚢 선박 소개</div>
                <p style={{ fontSize: '14px', color: '#333', lineHeight: '1.8', fontWeight: '600', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {selectedBusinessPost.content || '소개 내용이 없습니다.'}
                </p>
              </div>
            </div>

            {/* 하단 액션 버튼 (고정) */}
            <div style={{ padding: '0 20px 36px', display: 'flex', gap: '12px', background: '#fff', borderTop: '1px solid #F0F2F7', paddingTop: '16px' }}>
              <button
                onClick={() => { window.location.href = `tel:${selectedBusinessPost.phone || ''}`; }}
                style={{ flex: 1, backgroundColor: '#0056D2', color: '#fff', border: 'none', padding: '17px', borderRadius: '16px', fontWeight: '950', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,86,210,0.35)' }}
              >
                <Phone size={20} fill="#fff" /> 선장님께 즉시 전화
              </button>
              <button
                onClick={() => { window.location.href = `sms:${selectedBusinessPost.phone || ''}?body=${encodeURIComponent(`안녕하세요! 낚시GO에서 [${selectedBusinessPost.shipName}] 선상낚시 예약 문의드립니다.\n\n▶ 원하는 날짜:\n▶ 인원:\n▶ 기타 문의:`)}` ; }}
                style={{ backgroundColor: '#fff', color: '#00875A', border: '2px solid #00875A', padding: '17px 20px', borderRadius: '16px', fontWeight: '900', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}
              >
                <MessageSquare size={20} /> 문자 보내기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 플로팅 글쓰기/방만들기 버튼 (FAB) */}
      {(!((activeTab === 'notice') && !isAdmin)) && (
        <button
          onClick={handleFabClick}
          style={{
            position: 'fixed',
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
            right: 'max(20px, calc(50% - 220px))',
            backgroundColor: activeTab === 'notice' ? '#FF3B30' : '#0056D2',
            color: '#fff',
            border: 'none', borderRadius: '50%', width: '56px', height: '56px',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            boxShadow: activeTab === 'notice' ? '0 8px 16px rgba(255,59,48,0.4)' : '0 8px 16px rgba(0,86,210,0.4)',
            cursor: 'pointer', zIndex: 100, transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <PlusCircle size={32} />
        </button>
      )}

      {/* ✅ OPT-4: 크루 입장 비밀번호 인앱 모달 (window.prompt 완전 대체) */}
      {crewPassModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setCrewPassModal(null); }}
        >
          <div style={{ width: '100%', maxWidth: '480px', background: 'linear-gradient(180deg,#1A1A2E,#0D1117)', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', border: '1px solid rgba(0,86,210,0.3)', borderBottom: 'none', boxShadow: '0 -20px 60px rgba(0,0,0,0.5)' }}>
            {/* 드래그 핸들 */}
            <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', margin: '0 auto 22px' }} />
            {/* 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(0,86,210,0.2)', border: '1px solid rgba(0,86,210,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={20} color="#64B5F6" />
              </div>
              <div>
                <div style={{ fontSize: '17px', fontWeight: '900', color: '#fff' }}>🔒 프라이빗 크루</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: '700', marginTop: '2px' }}>{crewPassModal.crew.name}</div>
              </div>
            </div>
            {/* 입력 */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>입장 코드 4자리</label>
              <input
                type="password"
                maxLength={20}
                autoFocus
                value={crewPassInput}
                onChange={e => setCrewPassInput(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && !crewPassLoading) {
                    if (!crewPassInput.trim()) return;
                    setCrewPassLoading(true);
                    try {
                      const crew = crewPassModal.crew;
                      const crewId = String(crew._id || crew.id);
                      // ✅ CREW-ENH: /verify 대신 /join API 호출 — 비번 검증 + DB 저장 동시 처리
                      await apiClient.post(`/api/community/crews/${crewId}/join`, { password: crewPassInput, email: user.email, name: user.name });
                      setMyCrewIds(prev => new Set([...prev, crewId]));
                      setCrewPassModal(null);
                      navigate(`/crew/${crewId}/chat`);
                    } catch (err) {
                      addToast(err.response?.data?.error || '입장 코드가 일치하지 않습니다.', 'error');
                    } finally { setCrewPassLoading(false); }
                  }
                }}
                placeholder="입장 코드를 입력하세요"
                style={{ width: '100%', padding: '16px 18px', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(0,86,210,0.4)', borderRadius: '16px', color: '#fff', fontSize: '16px', fontWeight: '800', outline: 'none', letterSpacing: '0.15em', boxSizing: 'border-box' }}
              />
            </div>
            {/* 버튼 */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setCrewPassModal(null)}
                style={{ flex: 1, padding: '15px', border: 'none', borderRadius: '16px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', fontSize: '15px', fontWeight: '800', cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                disabled={crewPassLoading || !crewPassInput.trim()}
                onClick={async () => {
                  if (!crewPassInput.trim() || crewPassLoading) return;
                  setCrewPassLoading(true);
                  try {
                    const crew = crewPassModal.crew;
                    const crewId = String(crew._id || crew.id);
                    // ✅ CREW-ENH: /join API로 비번 검증 + 멤버 DB 저장 통합
                    await apiClient.post(`/api/community/crews/${crewId}/join`, { password: crewPassInput, email: user.email, name: user.name });
                    setMyCrewIds(prev => new Set([...prev, crewId]));
                    setCrewPassModal(null);
                    navigate(`/crew/${crewId}/chat`);
                  } catch (err) {
                    addToast(err.response?.data?.error || '입장 코드가 일치하지 않습니다.', 'error');
                  } finally { setCrewPassLoading(false); }
                }}
                style={{ flex: 2, padding: '15px', border: 'none', borderRadius: '16px', background: crewPassLoading || !crewPassInput.trim() ? 'rgba(0,86,210,0.3)' : 'linear-gradient(135deg,#0056D2,#1565C0)', color: '#fff', fontSize: '15px', fontWeight: '950', cursor: crewPassLoading ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s' }}
              >
                {crewPassLoading ? '확인 중...' : '입장하기 🔓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
