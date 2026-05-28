import React, { useState, useMemo, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Heart, Lock, Users, PlusCircle, Phone, Award, Trash2, Edit2, Share2, X as XIcon, Send } from 'lucide-react';
const CatchRankingPage = lazy(() => import('./CatchRankingPage'));
import { Capacitor } from '@capacitor/core';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore';
import { AD_CONFIG } from '../constants/adSettings';
import { useToastStore } from '../store/useToastStore';
import apiClient from '../api/index';
import SkeletonCard from '../components/SkeletonCard';
import { NativeAd } from '../components/AdUnit';
import { KakaoAd } from '../components/ads/KakaoAd';
// NativeAdService 제거됨 (네이티브 광고 기능 삭제)
import ImageGallery from '../components/ImageGallery';
import StorySlider from '../components/StorySlider';
import { io } from 'socket.io-client';
import { shareExternal } from '../utils/shareUtils';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ✅ CACHE-FIX: 모듈레벨 캐시 — 탭 재진입 시 스켈레톤 없이 즉시 이전 데이터 표시
// 언마운트/재마운트(뒤로가기 후 재진입) 시 데이터가 이미 있으면 loading=false로 시작
let _communityCache = { business: [], crews: [], notices: [], stories: [] };

// ✅ KAKAO-ADFIT: 실제 카카오 애드핏 인피드 광고 (DAN-M6CEA2Ch9AzCohm9 / 320×100)
// 더미 광고 → 실제 광고로 교체
function InFeedAd() {
  return (
    <KakaoAd
      unitId="DAN-M6CEA2Ch9AzCohm9"
      width={320}
      height={100}
      style={{ marginBottom: '12px', borderRadius: '12px', overflow: 'hidden' }}
    />
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
  // ✅ BUG-FIX: 복귀 시 sessionStorage에 returnTab이 있으면 'open'으로 시작, 즉시 삭제 (일반 진입 시 오염 방지)
  const [activeTab, setActiveTab] = useState(() => {
    const rt = sessionStorage.getItem('community_return_tab');
    if (rt) sessionStorage.removeItem('community_return_tab'); // 즉시 삭제
    return rt || 'business';
  });
  // ENH4-B3: DOM 직접 조작 대신 React state 기반 하이라이트
  const [highlightedPostId, setHighlightedPostId] = useState(null);
  const sentinelRef = useRef(null);
  const likeTimerRef = useRef({});

  // ✅ NATIVE-AD: 인피드 네이티브 광고 슬롯 맵 (slotId → placeholder el)
  const nativeAdSlotMapRef = useRef(new Map());
  const scrollToPostIdRef = useRef(null); // 복귀 시 해당 게시글로 scrollIntoView 대기용
  // ✅ INSTA-P1: 그리드/피드 뷰 전환
  const lastTapRef = useRef({}); // 더블탭 감지용 (postId → 마지막 탭 시각)
  const [heartBurstId, setHeartBurstId] = useState(null); // 더블탭 하트 폭발 표시용 postId

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

  // ✅ SCROLL-RETURN: 마운트 시 sessionStorage에서 반환 게시글ID 복원
  // ⚠️ activeTab은 useState() lazy init에서 이미 복원 및 삭제됨 — 여기서는 returnId만 처리
  useEffect(() => {
    const returnId = sessionStorage.getItem('community_return_post_id');
    if (returnId) {
      scrollToPostIdRef.current = returnId; // posts 로드 후 scrollIntoView
      sessionStorage.removeItem('community_return_post_id'); // ✅ ID-FIX: 설정 후 즉시 삭제 (다음 진입 시 재실행 방지)
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ 25TH-B2: canAccessPremium 셀렉터 실함 호출 → userTier 기반 useMemo 직접 판별
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
  // ✅ INSTA-P1: 그리드/피드 전환 + 인기순 정렬
  const [viewMode, setViewMode] = useState('feed');
  const [sortMode, setSortMode] = useState('latest');
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [slideIndexMap, setSlideIndexMap] = useState({});
  // ✅ SHARE: 게시글 → 크루 채팅 공유 모달
  const [shareModal, setShareModal] = useState(null); // { post } | null
  const [myCrews, setMyCrews] = useState([]);           // 내가 속한 크루 목록
  const [shareTarget, setShareTarget] = useState(null); // 선택된 크루
  const [sharing, setSharing] = useState(false);
  const shareSockets = useRef({});                      // crewId → socket 캐시
  const slideStartXRef = useRef({}); // postId → 터치 시작 X좌표
  const slideWrapperRefs = useRef(new Map()); // postId → 슬라이더 wrapper DOM 요소
  // ✅ INSTA-COMMENT: 인라인 댓글 입력창
  const [commentInputMap, setCommentInputMap] = useState({}); // postId → 입력 텍스트
  const [commentOpenMap, setCommentOpenMap] = useState({}); // postId → 입력창 열림 여부
  const [commentSubmittingMap, setCommentSubmittingMap] = useState({}); // postId → 제출 중
  // ✅ INSTA-P3: 스토리 상태
  const [stories, setStories] = useState(_communityCache.stories);
  const [storyViewer, setStoryViewer] = useState(null); // 현재 보고 있는 story
  // ✅ 7TH-B1: OPEN_CATEGORIES는 컴포넌트 외부 상수로 이동 (L31)
  const [crewPassModal, setCrewPassModal] = useState(null); // { crew } | null
  const [crewPassInput, setCrewPassInput]  = useState('');
  const [crewPassLoading, setCrewPassLoading] = useState(false);
  const [crews, setCrews] = useState(_communityCache.crews);
  // ✅ CREW-ENH: 내가 가입한 크루 ID Set — 배지 표시 및 비번 스킵용
  const [myCrewIds, setMyCrewIds] = useState(new Set());
  const [crewSearch, setCrewSearch] = useState(''); // ✅ 크루명 검색어

  const [businessPosts, setBusinessPosts] = useState(_communityCache.business);
  const [selectedBusinessRegion, setSelectedBusinessRegion] = useState('전체'); // 시도 필터
  const [selectedHarbor, setSelectedHarbor] = useState(''); // 항구 필터 (비어있으면 시도에서 전체)
  const [selectedBusinessPost, setSelectedBusinessPost] = useState(null); // 상세 모달용
  const [businessSearchQuery, setBusinessSearchQuery] = useState(''); // ✅ 지역/선박명/어종 텍스트 검색


  // ✅ 7TH-C1: 서버 필터링 결과 직접 사용 — filteredPosts alias가 클라이언트 필터링 의도로 오해 유발
  // posts는 이미 서버에서 필터링된 결과를 포함함 (fetchPosts 수신 시 user.blockedUsers 필터 적용됨)

  // ✅ 실제 낚시배 출항지 2단계 필터 (시도 → 항구) + 텍스트 검색
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

    // ✅ 텍스트 검색 필터 (지역명 / 선박명 / 어종 모두 포함)
    const q = businessSearchQuery.trim().toLowerCase();
    const searchFiltered = q
      ? withPinCheck.filter(p =>
          (p.region || '').toLowerCase().includes(q) ||
          (p.shipName || '').toLowerCase().includes(q) ||
          (p.target || '').toLowerCase().includes(q) ||
          (p.content || '').toLowerCase().includes(q)
        )
      : withPinCheck;

    // 1단계: 시도 필터
    // ✅ '전국 (전체)' 게시글은 '전체' 탭에서만 노출, 지역 탭 선택 시에는 숨김
    if (selectedBusinessRegion === '전체') {
      const base = !selectedHarbor
        ? searchFiltered  // 전체 탭 + 항구 미선택: '전국 (전체)' 포함 전체 노출
        : searchFiltered.filter(p => (p.region || '') === selectedHarbor); // 항구 선택: 정확히 일치하는 항구만 (전국 제외)
      return base;
    }
    // 지역 탭 선택 시: '전국 (전체)' 게시글 허쟁 제외
    const byRegion = searchFiltered.filter(p =>
      p.region !== '전국 (전체)' && (p.region || '').startsWith(selectedBusinessRegion)
    );
    // 2단계: 항구 필터
    if (!selectedHarbor) return byRegion;
    return byRegion.filter(p => (p.region || '').startsWith(selectedHarbor));
  }, [businessPosts, selectedBusinessRegion, selectedHarbor, businessSearchQuery]);

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


  const [noticePosts, setNoticePosts] = useState(_communityCache.notices);
  const [loading, setLoading] = useState(_communityCache.business.length === 0 && _communityCache.crews.length === 0);

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
      // ✅ INSTA-P2: 인기순 정렬 지원
      if (sortMode === 'popular') params.set('sort', 'popular');
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
  }, [openCategory, debouncedSearch, sortMode, user?.blockedUsers]);

  // ✅ SCROLL-APPLY: posts 로드 완료 후 반환 게시글으로 scrollIntoView
  // ⚠️ requestAnimationFrame만으로는 렌더 확정이 늘리면 실패 — setTimeout 150ms 보증 추가
  useEffect(() => {
    if (!scrollToPostIdRef.current || posts.length === 0) return;
    const targetId = scrollToPostIdRef.current;
    scrollToPostIdRef.current = null;
    sessionStorage.removeItem('community_return_post_id');
    const timer = setTimeout(() => {
      const el = document.getElementById(`post-${targetId}`);
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    }, 150); // DOM 렌더 충분한 시간 확보
    return () => clearTimeout(timer);
  }, [posts]);


  // ✅ 7TH-B2: React.useEffect → useEffect 통일
  useEffect(() => {
    const fetchData = async () => {
      // ✅ CACHE-FIX: 캐시된 데이터가 없을 때만 스켈레톤 표시 (재진입 시 깜빡임 방지)
      const hasCache = _communityCache.business.length > 0 || _communityCache.crews.length > 0;
      if (!hasCache) setLoading(true);
      try {
        // ✅ FIX-COMMUNITY: Promise.all → Promise.allSettled
        // 하나의 API 실패가 나머지 크루/공지/사업글 로딩을 막지 않도록 독립 처리
        const baseRequests = [
          apiClient.get('/api/community/crews').catch(() => ({ data: [] })),
          apiClient.get('/api/community/notices').catch(() => ({ data: [] })),
          apiClient.get('/api/community/business').catch(() => ({ data: [] })),
        ];
        // ✅ CREW-ENH: 로그인 유저면 내 크루 목록도 함께 로드
        // ✅ BUG-FIX: GUEST id 체크 추가 — 비로그인/GUEST 상태에서 401 콘솔 에러 방지
        const isLoggedIn = user?.email
          && user.email !== 'guest@fishinggo.com'
          && user?.id !== 'GUEST'
          && user?.id !== 'guest';
        const myCrewsPromise = isLoggedIn
          ? apiClient.get('/api/user/crews').catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] });

        const [crewsRes, noticesRes, businessRes, myCrewsRes] = await Promise.all([...baseRequests, myCrewsPromise]);
        const blocked = user?.blockedUsers || [];

        // ✅ FIX-EMPTY: ?.length 조건 제거 — 빈 배열([])도 항상 setState 호출
        // 이전: [].length === 0 (falsy) → setCrews 미호출 → 구버전 state 유지 버그
        // ✅ BUG-FIX: 차단 필터 ownerName → owner(이메일) — blockedUsers는 이메일 목록
        if (Array.isArray(crewsRes.data)) {
          const filtered = crewsRes.data.filter(c => !blocked.includes(c.owner));
          _communityCache.crews = filtered;
          setCrews(filtered);
        }
        if (Array.isArray(noticesRes.data)) {
          _communityCache.notices = noticesRes.data;
          setNoticePosts(noticesRes.data);
        }
        if (Array.isArray(businessRes.data)) {
          const filtered = businessRes.data.filter(p => !blocked.includes(p.author));
          _communityCache.business = filtered;
          setBusinessPosts(filtered);
        }

        // ✅ INSTA-P3: 24h 스토리 로드 (오류는 조용히 무시)
        apiClient.get('/api/stories').then(r => {
          if (Array.isArray(r.data)) {
            _communityCache.stories = r.data;
            setStories(r.data);
          }
        }).catch(() => { /* 스토리 API 없어도 무시 */ });

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
    // ✅ BUG-FIX: location.search 제거 — URL 쿼리 변경 시 크루/공지/선상배 API 중복 재호출 방지
    //             (postId 스크롤/탭 전환은 L131 useEffect에서 별도 처리)
  }, [user?.email]);



  // NativeAd 스크롤/언마운트 이벤트 제거 (네이티브 광고 삭제됨)

  // ✅ SHARE-SOCKET-CLEANUP: 언마운트 시 캐시된 모든 공유 소켓 연결 해제 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      Object.values(shareSockets.current).forEach(s => {
        try { s.disconnect(); } catch { }
      });
      shareSockets.current = {};
    };
  }, []);

  // 마운트·카테고리·검색어 변경 시 1페이지부터 재로드 (단 한 번만 실행됨)
  // ENH4-C2: location.search 변화 시 fetchPosts 중복 호출 가능성 업음 (openCategory/debouncedSearch가 파생 커버)
  // 현재는 오픈게시판 사용 시만 fetchPosts 호출, 탭 전환 시 URL이 바끼어도 연동 안 됨 — 탭 활성 조건을 없애면 중복 fetch 발생 감소
  // ✅ 7TH-B2: React.useEffect → useEffect 통일
  // ✅ 25TH-C1: fetchPosts가 useCallback으로 안정화 — eslint-disable 없이 deps에 명시적 포함
  useEffect(() => {
    if (activeTab === 'open') fetchPosts(1, false);
  }, [openCategory, debouncedSearch, activeTab, fetchPosts]);

  // 무한스크롤: sentinel div가 뷰포트에 들어오면 다음 페이지 자동 로드
  // ✅ BUG-FIX: activeTab !== 'open' 시에도 observer가 작동해 불필요한 API 호출 발생 → tab guard 추가
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && page < totalPages && activeTab === 'open') {
          setLoadingMore(true);
          fetchPosts(page + 1, true).finally(() => setLoadingMore(false));
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [page, totalPages, loadingMore, fetchPosts, activeTab]);

  const handleLoadMore = async () => {
    if (page >= totalPages) return;
    setLoadingMore(true);
    await fetchPosts(page + 1, true);
    setLoadingMore(false);
  };


  const handleDeletePost = async (e, id, type) => {
    e.stopPropagation();
    const myEmail = user?.email || user?.id || null;
    // ✅ BUG-FIX: myName 변수 제거 (dead code — handleDeletePost에서 미사용)
    const isAuthorDelete =
      (type === 'open' && posts.find(p => String(p._id || p.id) === String(id))?.author_email === myEmail) ||
      (type === 'business' && businessPosts.find(p => String(p._id || p.id) === String(id))?.author_email === myEmail);
    if (!isAdmin && !isAuthorDelete) return;
    // ✅ BUG-FIX: 즉시 삭제 → 확인 다이얼로그 추가 (PostDetail 모달 없이 카드에서 직접 삭제하므로 취소 기회 필요)
    if (!window.confirm('게시물을 삭제하시겠습니까?')) return;
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
      if (type === 'open') setPosts(prev => prev.filter(p => String(p._id || p.id) !== String(id)));
      if (type === 'business') setBusinessPosts(prev => prev.filter(p => String(p._id || p.id) !== String(id)));
      if (type === 'notice') setNoticePosts(prev => prev.filter(p => String(p._id || p.id) !== String(id)));
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
    try { localStorage.setItem('community_liked_posts', JSON.stringify(newLiked)); } catch { /* StorageError 무시 */ }
    setPosts(prev => prev.map(p => String(p._id || p.id) === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));

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
        setPosts(prev => prev.map(p => String(p._id || p.id) === postId ? { ...p, likes: serverLikes } : p));
      }
    } catch (err) {
      const status = err.response?.status;
      const code = err.response?.data?.code;
      if (status === 409) {
        // 서버 기준 이미 좋아요 → 로컬 상태는 유지 (중복 방어 성공)
        const serverLikes = err.response?.data?.likes;
        if (typeof serverLikes === 'number') {
          setPosts(prev => prev.map(p => String(p._id || p.id) === postId ? { ...p, likes: serverLikes } : p));
        }
        return;
      }
      if (status === 401 || code === 'AUTH_REQUIRED') {
        // JWT 만료 — Optimistic UI 롤백
        setLikedPosts(prevLiked);
        try { localStorage.setItem('community_liked_posts', JSON.stringify(prevLiked)); } catch { /* StorageError 무시 */ }
        setPosts(prev => prev.map(p => String(p._id || p.id) === postId ? { ...p, likes: Math.max((p.likes || 1) - 1, 0) } : p));
        addToast('로그인이 필요합니다.', 'error');
        return;
      }
      // 네트워크 오류 등 — 로컬 상태는 유지 (낙관적 처리), 경고만 출력
      if (!import.meta.env.PROD) console.warn('[Like] 서버 동기화 실패 (로컬 반영 유지):', err.message);
    }
  };

  // ✅ INSTA-COMMENT: 인라인 댓글 제출 핸들러
  const handleCommentSubmit = async (postId) => {
    const text = (commentInputMap[postId] || '').trim();
    if (!text) return;
    if (!user || user.id === 'GUEST') { addToast('로그인 후 이용 가능합니다.', 'error'); return; }
    setCommentSubmittingMap(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await apiClient.post(`/api/community/posts/${postId}/comments`, {
        author: user.name || user.id,
        author_email: user.email || user.id,
        text,
      });
      // ✅ BUG-FIX-COMMENT: 서버는 post 전체(comments 배열 포함)를 반환
      // comments[0]은 가장 오래된 댓글 → 전체 comments 배열로 교체해야 최신 댓글 반영
      const serverComments = res.data?.comments;
      if (Array.isArray(serverComments)) {
        setPosts(prev => prev.map(p =>
          String(p._id || p.id) === postId
            ? { ...p, comments: serverComments }
            : p
        ));
      }
      setCommentInputMap(prev => ({ ...prev, [postId]: '' }));
      addToast('댓글이 등록되었습니다! 💬', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || '댓글 등록에 실패했습니다.', 'error');
    } finally {
      setCommentSubmittingMap(prev => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <div className="page-container" style={{ backgroundColor: '#F2F2F7' }}>
      {/* 프리미엄 헤더 */}
      <div style={{ backgroundColor: '#fff', padding: '24px 20px 0', borderBottom: '1px solid #F0F0F0' }}>
        <h1 style={{ fontSize: `calc(24px * var(--fs, 1))`, fontWeight: '900', marginBottom: '20px' }}>커뮤니티</h1>
        <div style={{ display: 'flex', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', gap: '0' }}>
          {[
            { key: 'open',     label: '오픈게시판',  color: '#0056D2' },
            { key: 'crew',     label: '크루',       color: '#0056D2' },
            { key: 'notice',   label: '공지사항',   color: '#FF3B30' },
            { key: 'business', label: '선상배홍보', color: '#0056D2' },
            { key: 'ranking',  label: '🏆 조황랭킹', color: '#6366f1' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flexShrink: 0,
                padding: '12px 18px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.key ? `3px solid ${tab.color}` : '3px solid transparent',
                color: activeTab === tab.key ? tab.color : '#999',
                fontWeight: activeTab === tab.key ? '900' : '600',
                fontSize: `calc(14px * var(--fs, 1))`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 오픈게시판 카테고리 필터 + 검색 탭 */}
      {activeTab === 'open' && (
        <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #F0F0F0' }}>
          {/* 검색창 */}
          <div style={{ padding: '10px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F2F2F7', borderRadius: '12px', padding: '8px 14px' }}>
              <span style={{ fontSize: `calc(16px * var(--fs, 1))` }}>🔍</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="게시글 검색 (내용, 작성자)"
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: `calc(14px * var(--fs, 1))`, color: '#1c1c1e' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#999', fontSize: `calc(16px * var(--fs, 1))` }}>✕</button>
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
                    fontSize: `calc(13px * var(--fs, 1))`, fontWeight: openCategory === cat ? '900' : '700',
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
          {/* ✅ INSTA-P1+P2: 정렬 토글 + 뷰모드 전환 툴바 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 10px' }}>
            {/* 정렬 버튼 */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setSortMode('latest')}
                style={{
                  padding: '5px 12px', borderRadius: '16px', border: 'none', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800',
                  background: sortMode === 'latest' ? '#1c1c1e' : '#F2F2F7',
                  color: sortMode === 'latest' ? '#fff' : '#666', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >최신순</button>
              <button
                onClick={() => setSortMode('popular')}
                style={{
                  padding: '5px 12px', borderRadius: '16px', border: 'none', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800',
                  background: sortMode === 'popular' ? '#FF5A5F' : '#F2F2F7',
                  color: sortMode === 'popular' ? '#fff' : '#666', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >🔥 인기순</button>
            </div>
            {/* 뷰모드 전환 */}
            <button
              onClick={() => setViewMode(v => v === 'feed' ? 'grid' : 'feed')}
              style={{
                background: 'none', border: '1px solid #E5E5EA', borderRadius: '8px',
                padding: '5px 10px', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer',
                color: '#555', display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              {viewMode === 'feed' ? '⊞' : '≡'} {viewMode === 'feed' ? '그리드' : '피드'}
            </button>
          </div>
        </div>
      )}


      {/* 탭 내용 렌더링 영역 */}
      <div style={{ padding: activeTab === 'ranking' ? '0' : '16px' }}>
        {loading && activeTab !== 'ranking' ? (
          <div style={{ padding: '16px' }}><SkeletonCard count={5} /></div>
        ) : activeTab === 'ranking' ? (
          <Suspense fallback={<div style={{padding:'32px',textAlign:'center'}}>로딩 중...</div>}>
            <CatchRankingPage embedded />
          </Suspense>
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
                  {notice.isPinned && <div style={{ padding: '4px 8px', backgroundColor: '#FF3B30', color: '#fff', fontSize: `calc(10px * var(--fs, 1))`, borderRadius: '6px', fontWeight: '900' }}>중요 필독</div>}
                  <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#888', fontWeight: 'bold' }}>{notice.date}</div>
                  <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#aaa', marginLeft: 'auto' }}>조회 {notice.views}</div>
                </div>
                <h3 style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '900', color: '#1c1c1e', marginBottom: '8px', wordBreak: 'keep-all' }}>{notice.title}</h3>
                <p style={{
                  fontSize: `calc(14px * var(--fs, 1))`, color: '#777', lineHeight: '1.6', paddingBottom: isAdmin ? '36px' : '0',
                  overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                }}>{notice.content}</p>
                <div style={{ marginTop: '8px', fontSize: `calc(12px * var(--fs, 1))`, color: '#0056D2', fontWeight: '700', paddingBottom: isAdmin ? '36px' : '0' }}>
                  자세히 보기 →
                </div>

                {isAdmin && (
                  <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', gap: '6px' }}>
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/write?type=notice&editId=${String(notice._id || notice.id)}`); }} style={{ border: 'none', background: 'rgba(0,86,210,0.1)', color: '#0056D2', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Edit2 size={13} /> 수정
                    </button>
                    <button onClick={(e) => handleDeletePost(e, String(notice._id || notice.id), 'notice')} style={{ border: 'none', background: 'rgba(255,59,48,0.1)', color: '#FF3B30', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Trash2 size={13} /> 삭제
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : activeTab === 'open' ? (
          <div className="fade-in">
            {/* ✅ INSTA-P3: 24h 조황 스토리 슬라이더 */}
            {(stories.length > 0 || user?.id !== 'GUEST') && (
              <StorySlider
                stories={stories}
                onAddStory={() => {
                  if (!user || user.id === 'GUEST') { addToast('로그인이 필요합니다.', 'error'); return; }
                  addToast('스토리 등록: 사진을 선택해 24h 조황을 공유하세요!', 'info');
                  navigate('/write?story=1');
                }}
                onViewStory={(s) => setStoryViewer(s)}
              />
            )}


            {posts.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#AAB0BE' }}>
                <div style={{ fontSize: `calc(40px * var(--fs, 1))`, marginBottom: '12px' }}>🎣</div>
                <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800', marginBottom: '6px', color: '#555' }}>아직 게시글이 없습니다</div>
                <div style={{ fontSize: `calc(13px * var(--fs, 1))` }}>첫 조황을 공유해보세요!</div>
              </div>
            )}

            {/* ✅ INSTA-P1: 그리드 뷰 */}
            {viewMode === 'grid' && posts.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px', margin: '0 -16px' }}>
                {posts.map((post, index) => {
                  const postId = String(post._id || post.id);
                  const imgSrc = post.images?.[0] || post.image;
                  return (
                    <div
                      key={postId}
                      onClick={() => {
                        sessionStorage.setItem('community_return_tab', 'open');
                        sessionStorage.setItem('community_return_post_id', postId);
                        navigate(`/post/${postId}`, { state: { postIds: posts.map(p => String(p._id || p.id)), currentIndex: index } });
                      }}
                      style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative', cursor: 'pointer', background: '#F2F2F7' }}
                    >
                      {imgSrc ? (
                        <img src={imgSrc} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px', background: '#F8F9FA', fontSize: `calc(9px * var(--fs, 1))`, color: '#555', textAlign: 'center', lineHeight: 1.4 }}>
                          <span style={{ fontSize: `calc(18px * var(--fs, 1))`, marginBottom: '3px' }}>🎣</span>
                          {(post.content || '').slice(0, 28)}
                        </div>
                      )}
                      {post.images?.length > 1 && (
                        <div style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.6)', borderRadius: '4px', padding: '1px 5px', fontSize: `calc(8px * var(--fs, 1))`, color: '#fff', fontWeight: '900' }}>
                          ⊞ {post.images.length}
                        </div>
                      )}
                      {(post.likes > 0) && (
                        <div style={{ position: 'absolute', bottom: '4px', left: '4px', display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '2px 5px', fontSize: `calc(9px * var(--fs, 1))`, color: '#fff' }}>
                          ❤️ {post.likes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ✅ INSTA-EXPAND: 인스타그램형 피드 (인라인 확장 + 이미지 슬라이드) */}
            {viewMode === 'feed' && posts.map((post, index) => {
              const postId = String(post._id || post.id);
              const isExpanded = expandedPostId === postId;
              const allImages = Array.isArray(post.images) && post.images.length > 0
                ? post.images
                : post.image ? [post.image] : [];
              const slideIdx = slideIndexMap[postId] || 0;
              const imgCount = allImages.length;
              // ✅ FIX-EXPAND: 글자 수 OR 줄바꿈 3줄 초과 시 더보기 표시
              const contentLines = (post.content || '').split('\n');
              const needsExpand = (post.content || '').length > 80 || contentLines.length > 3;

              // ✅ FIX-NEWLINE: \n → <br> 변환 + 해시태그 파싱
              const renderContent = (text) => {
                if (!text) return null;
                // 먼저 줄바꿈으로 분리, 각 줄을 해시태그 파싱 후 <br> 삽입
                const lines = text.split('\n');
                return lines.map((line, lineIdx) => {
                  const parts = line.split(/(#[\w가-힣]+)/g).map((part, i) =>
                    part.startsWith('#') ? (
                      <span key={i} onClick={(e) => { e.stopPropagation(); setSearchQuery(part.slice(1)); }}
                        style={{ color: '#0056D2', fontWeight: '800', cursor: 'pointer' }}>{part}</span>
                    ) : part
                  );
                  return (
                    <React.Fragment key={lineIdx}>
                      {parts}
                      {lineIdx < lines.length - 1 && <br />}
                    </React.Fragment>
                  );
                });
              };

              // ✅ FIX-SLIDER: CSS transform 슬라이드 이동 헬퍼
              const goSlide = (e, dir) => {
                e.stopPropagation();
                setSlideIndexMap(prev => {
                  const cur = prev[postId] || 0;
                  const next = Math.max(0, Math.min(allImages.length - 1, cur + dir));
                  return { ...prev, [postId]: next };
                });
              };

              return (
                <React.Fragment key={postId}>
                  <div
                    id={`post-${postId}`}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: isExpanded ? '20px' : '16px',
                      marginBottom: '12px',
                      boxShadow: isExpanded
                        ? '0 8px 32px rgba(0,86,210,0.13)'
                        : highlightedPostId === postId ? '0 0 0 3px #0056D2' : '0 2px 10px rgba(0,0,0,0.03)',
                      border: isExpanded ? '1.5px solid #C8D9FF' : highlightedPostId === postId ? '1px solid #0056D2' : '1px solid #f0f0f0',
                      overflow: 'hidden',
                      transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
                    }}
                  >
                    {/* ── 헤더 (아바타 + 닉네임 + 위치 + 수정/삭제) ── */}
                    <div
                      style={{ padding: '14px 16px 0', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}
                      onClick={() => setExpandedPostId(isExpanded ? null : postId)}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', background: '#EEF4FF', flexShrink: 0, border: '2px solid #E0EAFF' }}>
                          {post.author_avatar
                            ? <img src={post.author_avatar} alt={post.author} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '900', color: '#0056D2' }}>{(post.author || '?').charAt(0).toUpperCase()}</div>
                          }
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {(post.author === ADMIN_ID || post.author === 'sunjulab') && (
                              <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: 'linear-gradient(135deg,#E60000,#990000)', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: '900' }}>MASTER</span>
                            )}
                            <span style={{ fontSize: `calc(11px * var(--fs, 1))`, backgroundColor: 'rgba(0,86,210,0.08)', color: '#0056D2', padding: '2px 7px', borderRadius: '6px', fontWeight: '800' }}>{post.category}</span>
                            <strong onClick={(e) => { e.stopPropagation(); navigate(`/user/${encodeURIComponent(post.author)}`); }}
                              style={{ fontSize: `calc(14px * var(--fs, 1))`, color: '#1c1c1e', cursor: 'pointer' }}>{post.author}</strong>
                          </div>
                          {post.location?.address && (
                            <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#8E8E93', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '1px' }}>
                              📍 {post.location.address}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#bbb' }}>{post.time}</span>
                        {(isAdmin || post.author_email === user?.email) && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/write?editId=${postId}`); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#0056D2' }}><Edit2 size={15} /></button>
                            <button onClick={(e) => handleDeletePost(e, postId, 'open')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#FF3B30' }}><Trash2 size={15} /></button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── 이미지 슬라이드 (인스타그램형 — CSS scroll-snap 방식) ── */}
                    {allImages.length > 0 && (
                      <div style={{ position: 'relative', marginTop: '12px', userSelect: 'none' }}>
                        {/* ✅ SLIDER-FINAL: scroll-snap 네이티브 방식 — px/% 계산 오류 원천 제거 */}
                        <div
                          ref={el => el ? slideWrapperRefs.current.set(postId, el) : slideWrapperRefs.current.delete(postId)}
                          className="insta-slider"
                          style={{
                            display: 'flex',
                            overflowX: 'auto',
                            scrollSnapType: 'x mandatory',
                            scrollBehavior: 'smooth',
                            WebkitOverflowScrolling: 'touch',
                          }}
                          onScroll={e => {
                            const el = e.currentTarget;
                            const newIdx = Math.round(el.scrollLeft / el.offsetWidth);
                            if (newIdx !== slideIdx) {
                              setSlideIndexMap(prev => ({ ...prev, [postId]: newIdx }));
                            }
                          }}
                          onClick={e => {
                            e.stopPropagation();
                            const now = Date.now();
                            if (now - (lastTapRef.current[postId] || 0) < 300) {
                              if (!likedPosts[postId]) {
                                handleLike({ stopPropagation: () => {} }, postId);
                                setHeartBurstId(postId);
                                setTimeout(() => setHeartBurstId(null), 800);
                              }
                            }
                            lastTapRef.current[postId] = now;
                          }}
                        >
                          {allImages.map((imgSrc, imgIdx) => (
                            <div
                              key={imgIdx}
                              style={{
                                flex: '0 0 100%',
                                scrollSnapAlign: 'start',
                                // ✅ RATIO-3/4: 3:4 고정 비율 컨테이너
                                aspectRatio: '3 / 4',
                                overflow: 'hidden',
                                position: 'relative',
                                background: '#000',
                              }}
                            >
                              <img
                                src={imgSrc}
                                alt={`사진 ${imgIdx + 1}`}
                                loading="lazy"
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  display: 'block',
                                  pointerEvents: 'none',
                                }}
                              />
                            </div>
                          ))}
                        </div>

                        {/* 좌우 화살표 버튼 */}
                        {allImages.length > 1 && (
                          <>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                const el = slideWrapperRefs.current.get(postId);
                                if (el) {
                                  const newIdx = Math.max(0, slideIdx - 1);
                                  el.scrollTo({ left: el.offsetWidth * newIdx, behavior: 'smooth' });
                                  setSlideIndexMap(prev => ({ ...prev, [postId]: newIdx }));
                                }
                              }}
                              disabled={slideIdx === 0}
                              style={{
                                position: 'absolute', left: '8px', top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(0,0,0,0.5)', border: 'none',
                                borderRadius: '50%', width: '34px', height: '34px',
                                color: '#fff', fontSize: `calc(20px * var(--fs, 1))`, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: slideIdx === 0 ? 0.2 : 1,
                                transition: 'opacity 0.2s', zIndex: 5,
                              }}
                            >‹</button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                const el = slideWrapperRefs.current.get(postId);
                                if (el) {
                                  const newIdx = Math.min(allImages.length - 1, slideIdx + 1);
                                  el.scrollTo({ left: el.offsetWidth * newIdx, behavior: 'smooth' });
                                  setSlideIndexMap(prev => ({ ...prev, [postId]: newIdx }));
                                }
                              }}
                              disabled={slideIdx === allImages.length - 1}
                              style={{
                                position: 'absolute', right: '8px', top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(0,0,0,0.5)', border: 'none',
                                borderRadius: '50%', width: '34px', height: '34px',
                                color: '#fff', fontSize: `calc(20px * var(--fs, 1))`, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: slideIdx === allImages.length - 1 ? 0.2 : 1,
                                transition: 'opacity 0.2s', zIndex: 5,
                              }}
                            >›</button>

                            {/* 점 인디케이터 */}
                            <div style={{
                              position: 'absolute', bottom: '10px', left: '50%',
                              transform: 'translateX(-50%)',
                              display: 'flex', gap: '5px', zIndex: 5,
                              pointerEvents: 'none',
                            }}>
                              {allImages.map((_, di) => (
                                <div
                                  key={di}
                                  style={{
                                    width: di === slideIdx ? '20px' : '6px',
                                    height: '6px', borderRadius: '3px',
                                    background: di === slideIdx ? '#fff' : 'rgba(255,255,255,0.5)',
                                    transition: 'all 0.22s',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                  }}
                                />
                              ))}
                            </div>

                            {/* 장 수 배지 */}
                            <div style={{
                              position: 'absolute', top: '10px', right: '10px',
                              background: 'rgba(0,0,0,0.6)', borderRadius: '12px',
                              padding: '2px 9px', fontSize: `calc(11px * var(--fs, 1))`, color: '#fff',
                              fontWeight: '800', zIndex: 5, pointerEvents: 'none',
                            }}>
                              {slideIdx + 1}/{allImages.length}
                            </div>
                          </>
                        )}

                        {/* 더블탭 하트 폭발 */}
                        {heartBurstId === postId && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10 }}>
                            <span style={{ fontSize: `calc(80px * var(--fs, 1))`, animation: 'heartPop 0.75s ease-out forwards' }}>❤️</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── 본문 (3줄 축소 / 인라인 확장) ── */}
                    <div style={{ padding: allImages.length > 0 ? '12px 16px 0' : '10px 16px 0' }}>
                      <p style={{ margin: 0, fontSize: `calc(15px * var(--fs, 1))`, color: '#1c1c1e', lineHeight: '1.65', fontWeight: '400',
                        ...(isExpanded ? {} : { overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' })
                      }}>
                        {renderContent(post.content)}
                      </p>
                      {needsExpand && !isExpanded && (
                        <span
                          onClick={e => { e.stopPropagation(); setExpandedPostId(postId); }}
                          style={{ fontSize: `calc(14px * var(--fs, 1))`, color: '#8E8E93', cursor: 'pointer', fontWeight: '700', marginLeft: '4px' }}
                        >더보기</span>
                      )}
                      {isExpanded && needsExpand && (
                        <span
                          onClick={e => { e.stopPropagation(); setExpandedPostId(null); }}
                          style={{ fontSize: `calc(14px * var(--fs, 1))`, color: '#8E8E93', cursor: 'pointer', fontWeight: '700', display: 'block', marginTop: '6px' }}
                        >접기 ↑</span>
                      )}
                    </div>

                    {/* ── 좋아요 + 댓글 + 공유 버튼 ── */}
                    <div style={{ padding: '10px 16px', display: 'flex', gap: '16px', alignItems: 'center', borderTop: '1px solid #f8f8f8', marginTop: '10px' }}>
                      <span onClick={(e) => handleLike(e, postId)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: `calc(13px * var(--fs, 1))`, cursor: 'pointer', position: 'relative', color: likedPosts[postId] ? '#FF5A5F' : '#8e8e93', fontWeight: likedPosts[postId] ? '800' : '400', transition: 'color 0.2s', userSelect: 'none' }}>
                        <Heart size={16} color="#FF5A5F" fill={likedPosts[postId] ? '#FF5A5F' : 'none'}
                          style={{ transform: likeAnimating[postId] ? 'scale(1.6)' : 'scale(1)', transition: 'transform 0.25s cubic-bezier(0.36,0.07,0.19,0.97)', filter: likeAnimating[postId] ? 'drop-shadow(0 0 6px #FF5A5F)' : 'none' }} />
                        {post.likes || 0}
                        {likeAnimating[postId] && <span style={{ position: 'absolute', top: '-18px', left: 0, fontSize: `calc(18px * var(--fs, 1))`, pointerEvents: 'none', animation: 'heartBurst 0.7s ease-out forwards' }}>❤️</span>}
                      </span>
                      <span
                        onClick={e => {
                          e.stopPropagation();
                          const nowOpen = !commentOpenMap[postId];
                          setCommentOpenMap(prev => ({ ...prev, [postId]: nowOpen }));
                          if (nowOpen) setExpandedPostId(postId);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: `calc(13px * var(--fs, 1))`, color: commentOpenMap[postId] ? '#0056D2' : '#8e8e93', cursor: 'pointer', fontWeight: commentOpenMap[postId] ? '800' : '400', transition: 'color 0.2s' }}>
                        <MessageSquare size={16} /> {post.comments?.length || 0}
                      </span>
                      {/* ✅ SHARE-BTN: 외부 앱 공유 + 크루 채팅방 공유 */}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
                        {/* 외부 앱 공유 (카카오톡·인스타 등 네이티브 공유 시트) */}
                        <span
                          onClick={e => {
                            e.stopPropagation();
                            // ✅ SHARE-V2: postId 명시 + 게시글 사진 또는 앱 로고 자동 처리
                            const firstImg = Array.isArray(post.images) && post.images.length > 0
                              ? post.images[0]
                              : (post.image || null);
                            shareExternal({
                              title: `낚시GO | ${post.author}님의 조황`,
                              text:  (post.content || '').slice(0, 80),
                              url:   `${window.location.origin}/post/${postId}`,
                              imgUrl: firstImg, // null이면 shareUtils에서 앱 로고로 대체
                              postId,
                              addToast,
                            });
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: `calc(13px * var(--fs, 1))`, color: '#8e8e93', cursor: 'pointer', transition: 'color 0.2s' }}
                          title="외부 앱에 공유">
                          <Share2 size={15} />
                        </span>
                        {/* 크루 채팅방 공유 */}
                        <span
                          onClick={async e => {
                            e.stopPropagation();
                            if (!user) { addToast('로그인 후 이용하세요.', 'error'); return; }
                            try {
                              const res = await apiClient.get('/api/user/crews');
                              setMyCrews(Array.isArray(res.data) ? res.data : []);
                            } catch { setMyCrews([]); }
                            setShareTarget(null);
                            setShareModal({ post });
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: `calc(12px * var(--fs, 1))`, color: '#8e8e93', cursor: 'pointer', transition: 'color 0.2s' }}
                          title="크루 채팅방에 공유">
                          💬<span style={{ fontSize: `calc(11px * var(--fs, 1))` }}>크루</span>
                        </span>
                      </span>
                    </div>

                    {/* ── 인라인 댓글 (축소: 2줄 / 확장: 전체) ── */}
                    {post.comments?.length > 0 && (
                      <div style={{ padding: '0 16px 10px', borderTop: '1px solid #f8f8f8', paddingTop: '10px' }}>
                        {post.comments.slice(0, isExpanded ? post.comments.length : 2).map((c, i) => (
                          <div key={i} style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#333', marginBottom: '5px',
                            ...(isExpanded ? {} : { overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' })
                          }}>
                            <strong style={{ color: '#1c1c1e', marginRight: '5px' }}>{c.author}</strong>
                            <span style={{ color: '#555' }}>{c.text || c.content}</span>
                          </div>
                        ))}
                        {!isExpanded && post.comments.length > 2 && (
                          <span
                            style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#8E8E93', cursor: 'pointer', fontWeight: '700' }}
                            onClick={e => { e.stopPropagation(); setExpandedPostId(postId); setCommentOpenMap(prev => ({ ...prev, [postId]: true })); }}>
                            댓글 {post.comments.length}개 모두 보기
                          </span>
                        )}
                      </div>
                    )}

                    {/* ✅ INSTA-COMMENT: 인라인 댓글 입력창 */}
                    {commentOpenMap[postId] && (
                      <div
                        style={{ padding: '8px 12px 12px', borderTop: '1px solid #f0f0f0' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          backgroundColor: '#F7F8FA', borderRadius: '24px',
                          padding: '8px 14px', border: '1.5px solid #E5E7EB',
                          transition: 'border-color 0.15s',
                        }}>
                          {/* 작성자 아바타 */}
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: '#EEF4FF', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: '#0056D2',
                          }}>
                            {(user?.name || user?.id || '?').charAt(0).toUpperCase()}
                          </div>
                          <input
                            autoFocus
                            value={commentInputMap[postId] || ''}
                            onChange={e => setCommentInputMap(prev => ({ ...prev, [postId]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommentSubmit(postId); } }}
                            placeholder="댓글을 입력하세요..."
                            style={{
                              flex: 1, border: 'none', background: 'transparent',
                              outline: 'none', fontSize: `calc(14px * var(--fs, 1))`, color: '#1c1c1e',
                              fontWeight: '400',
                            }}
                          />
                          <button
                            onClick={() => handleCommentSubmit(postId)}
                            disabled={commentSubmittingMap[postId] || !(commentInputMap[postId] || '').trim()}
                            style={{
                              background: (commentInputMap[postId] || '').trim() ? '#0056D2' : '#E5E7EB',
                              border: 'none', borderRadius: '50%',
                              width: '30px', height: '30px', flexShrink: 0,
                              cursor: (commentInputMap[postId] || '').trim() ? 'pointer' : 'default',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'background 0.15s',
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M22 2L11 13" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {(index + 1) % 4 === 0 && <NativeAd slotId={`feed_native_${index}`} />}
                  {!canAccessPremium && (index + 1) % 3 === 0 && <InFeedAd />}
                </React.Fragment>
              );
            })}
            {/* ✅ KAKAO-ADFIT: 게시글 목록 끝 고정 광고 — 게시글 수 무관 항상 1개 노출 */}
            {!canAccessPremium && posts.length > 0 && (
              <div style={{ padding: '0 16px 8px' }}>
                <KakaoAd
                  unitId="DAN-M6CEA2Ch9AzCohm9"
                  width={320}
                  height={100}
                  style={{ borderRadius: '12px', overflow: 'hidden' }}
                />
              </div>
            )}

            {/* 무한스크롤 sentinel */}
            <div ref={sentinelRef} style={{ height: 20 }} />
            {loadingMore && <div style={{ padding: '0 16px 12px' }}><SkeletonCard count={2} /></div>}
            {page >= totalPages && posts.length > 0 && (
              <div style={{ textAlign: 'center', padding: '20px', fontSize: `calc(13px * var(--fs, 1))`, color: '#bbb' }}>
                모든 게시글을 불러왔습니다 🎣
              </div>
            )}
          </div>

        ) : activeTab === 'crew' ? (
          // [프라이빗 크루 뷰]
          <div className="fade-in">
            {/* 크루 검색창 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', borderRadius: '14px', padding: '10px 16px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' }}>
              <span style={{ fontSize: `calc(16px * var(--fs, 1))`, flexShrink: 0 }}>🔍</span>
              <input
                value={crewSearch}
                onChange={e => setCrewSearch(e.target.value)}
                placeholder="크루명 검색"
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: `calc(14px * var(--fs, 1))`, color: '#1c1c1e', fontWeight: '600' }}
              />
              {crewSearch && (
                <button onClick={() => setCrewSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#bbb', fontSize: `calc(16px * var(--fs, 1))`, padding: 0, lineHeight: 1 }}>✕</button>
              )}
            </div>
            {/* 검색 결과 없음 */}
            {filteredCrews.length === 0 && crews.length > 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa' }}>
                <div style={{ fontSize: `calc(32px * var(--fs, 1))`, marginBottom: '10px' }}>🔍</div>
                <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800', color: '#555', marginBottom: '4px' }}>검색 결과가 없습니다</div>
                <div style={{ fontSize: `calc(13px * var(--fs, 1))` }}>'{crewSearch}' 에 해당하는 크루가 없습니다</div>
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
                      {isMyCrew && <span style={{ fontSize: `calc(9px * var(--fs, 1))`, fontWeight: '900', background: '#0056D2', color: '#fff', padding: '2px 7px', borderRadius: '8px', flexShrink: 0 }}>내 크루</span>}
                      <h3 style={{ margin: 0, fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '700', color: '#1c1c1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{crew.name}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', color: '#8e8e93', fontSize: `calc(13px * var(--fs, 1))` }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> 인원 {crew.members}/{crew.limit != null ? crew.limit : 1000}</span>
                      {crew.region && crew.region !== '전국' && <span style={{ color: '#bbb' }}>📍 {crew.region}</span>}
                    </div>
                  </div>
                  {/* 입장 버튼 */}
                  {isMyCrew ? (
                    <button onClick={() => navigate(`/crew/${crewId}/chat`)} style={{ backgroundColor: '#0056D2', border: 'none', padding: '8px 18px', borderRadius: '20px', color: '#fff', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,86,210,0.2)', flexShrink: 0, marginLeft: '8px' }}>
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
                      style={{ backgroundColor: '#0056D2', border: 'none', padding: '8px 18px', borderRadius: '20px', color: '#fff', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,86,210,0.2)', flexShrink: 0, marginLeft: '8px' }}
                    >
                      입장하기
                    </button>
                  )}
                </div>
                {/* ✅ MASTER 전용: 강제 삭제 영역 */}
                {isAdmin && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #FFE0E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: `calc(10px * var(--fs, 1))`, color: '#FF3B30', fontWeight: '900', background: 'rgba(255,59,48,0.08)', padding: '2px 8px', borderRadius: '6px' }}>MASTER 관리</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAdminDeleteCrew(crewId, crew.name); }}
                      style={{ border: 'none', background: 'rgba(255,59,48,0.1)', color: '#FF3B30', padding: '5px 12px', borderRadius: '8px', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Trash2 size={12} /> 강제 삭제
                    </button>
                  </div>
                )}
              {/* ✅ KAKAO-ADFIT: 크루 목록 5개마다 광고 */}
              {!canAccessPremium && (filteredCrews.indexOf(crew) + 1) % 5 === 0 && (
                <div style={{ margin: '4px 0 4px' }}>
                  <KakaoAd unitId="DAN-GlROpjPfXauFLUgU" width={320} height={50}
                    style={{ borderRadius: '12px', overflow: 'hidden' }} />
                </div>
              )}
              </div>
              );
            })}
            {/* ✅ KAKAO-ADFIT: 크루 목록 끝 고정 광고 */}
            {!canAccessPremium && filteredCrews.length > 0 && (
              <div style={{ margin: '8px 0' }}>
                <KakaoAd unitId="DAN-GlROpjPfXauFLUgU" width={320} height={50}
                  style={{ borderRadius: '12px', overflow: 'hidden' }} />
              </div>
            )}

          </div>
        ) : (
          // [비즈니스: 선상 배 홍보 뷰]
          <div className="fade-in">
            <div style={{ padding: '16px', background: 'linear-gradient(135deg, #0A192F, #1A365D)', borderRadius: '16px', marginBottom: '20px', color: '#fff', boxShadow: '0 8px 24px rgba(10,25,47,0.2)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}><Award size={100} /></div>
              <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '950', color: '#FFD700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={18} /> 프리미엄 선상 직거래
              </div>
              <p style={{ margin: '0 0 4px', fontSize: `calc(12.5px * var(--fs, 1))`, fontWeight: '700', lineHeight: '1.4' }}>비즈니스 인증을 거친 검증된 선장님들의 공간입니다.</p>
              <p style={{ margin: 0, fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.6)' }}>게시물 하단의 [직통 전화] 버튼을 눌러 수수료 없이 다이렉트 예약하세요!</p>
            </div>
            {/* ✅ 지역 검색 바 */}
            <div style={{ marginBottom: '12px', position: 'relative' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: '#fff', border: `1.5px solid ${businessSearchQuery ? '#0056D2' : '#E8EBF0'}`,
                borderRadius: '14px', padding: '11px 14px',
                boxShadow: businessSearchQuery ? '0 0 0 3px rgba(0,86,210,0.1)' : '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: `calc(16px * var(--fs, 1))`, flexShrink: 0 }}>🔍</span>
                <input
                  type="text"
                  value={businessSearchQuery}
                  onChange={e => setBusinessSearchQuery(e.target.value)}
                  placeholder="지역명·항구명·선박명·어종 검색"
                  style={{
                    flex: 1, border: 'none', outline: 'none', background: 'transparent',
                    fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '700', color: '#1c1c1e',
                    fontFamily: 'inherit',
                  }}
                />
                {businessSearchQuery && (
                  <button
                    onClick={() => setBusinessSearchQuery('')}
                    style={{
                      background: '#E5E5EA', border: 'none', borderRadius: '50%',
                      width: '22px', height: '22px', cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: `calc(12px * var(--fs, 1))`, color: '#666', fontWeight: '900',
                    }}
                  >✕</button>
                )}
              </div>
              {/* 검색 결과 수 표시 */}
              {businessSearchQuery && (
                <div style={{
                  marginTop: '6px', fontSize: `calc(11px * var(--fs, 1))`,
                  color: effectiveBusinessPosts.length > 0 ? '#0056D2' : '#FF5A5F',
                  fontWeight: '800', paddingLeft: '4px',
                }}>
                  {effectiveBusinessPosts.length > 0
                    ? `🎯 "${businessSearchQuery}" 검색 결과 ${effectiveBusinessPosts.length}건`
                    : `"${businessSearchQuery}" 검색 결과가 없습니다`}
                </div>
              )}
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
                      fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer', transition: 'all 0.15s',
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
                        fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900',
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
                    fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer',
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
                        fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s',
                        background: isActive ? '#1A1A2E' : count > 0 ? '#F5F5F7' : '#FAFAFA',
                        color: isActive ? '#fff' : count > 0 ? '#333' : '#CCC',
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}
                    >
                      ⚓ {harbor.label}
                      {count > 0 && (
                        <span style={{
                          background: isActive ? 'rgba(255,255,255,0.25)' : '#555',
                          color: '#fff', borderRadius: '8px', padding: '0px 5px', fontSize: `calc(9px * var(--fs, 1))`, fontWeight: '900',
                        }}>{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {effectiveBusinessPosts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>
                <div style={{ fontSize: `calc(32px * var(--fs, 1))`, marginBottom: '8px' }}>🚢</div>
                <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700' }}>
                  {selectedBusinessRegion === '전체' ? '등록된 홍보글이 없습니다' : `${selectedBusinessRegion} 지역 홍보글이 없습니다`}
                </div>
              </div>
            )}


            {effectiveBusinessPosts.map((post, index) => (
              <React.Fragment key={String(post._id || post.id)}>
                {post.isPinned ? (
                  /* VVIP 프리미엄 대형 카드 */
                  <div style={{ backgroundColor: '#FEFCF5', borderRadius: '20px', marginBottom: '20px', boxShadow: '0 12px 40px rgba(255,215,0,0.25)', border: '2.5px solid #FFD700', overflow: 'hidden' }}>
                    <div style={{ background: 'linear-gradient(90deg, #FFD700, #FF9B26)', color: '#5C3A00', padding: '10px 16px', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '950', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Award size={14} fill="#5C3A00" /> VVIP 프리미엄 스폰서 — 해당 항구 1위 독점</span>
                      {/* ✅ VVIP 카드: 작성자 or 마스터만 수정/삭제 */}
                      {(isAdmin || post.author_email === user?.email) && (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/write-business?editId=${String(post._id || post.id)}`); }}
                            style={{ background: 'rgba(0,0,0,0.12)', border: 'none', cursor: 'pointer', color: '#5C3A00', borderRadius: '6px', padding: '3px 8px', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', display: 'flex', alignItems: 'center', gap: '3px' }}
                          ><Edit2 size={11} /> 수정</button>
                          <button
                            onClick={(e) => handleDeletePost(e, String(post._id || post.id), 'business')}
                            style={{ background: 'rgba(0,0,0,0.12)', border: 'none', cursor: 'pointer', color: '#5C3A00', borderRadius: '6px', padding: '3px 8px', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', display: 'flex', alignItems: 'center', gap: '3px' }}
                          ><Trash2 size={11} /> 삭제</button>
                        </div>
                      )}
                    </div>
                    {/* ✅ MULTI-IMG: VVIP 대형 카드 이미지 갤러리 슬라이드 */}
                    <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setSelectedBusinessPost(post)}>
                      {(Array.isArray(post.images) && post.images.length > 0) || post.cover ? (
                        <div onClick={e => e.stopPropagation()}>
                          <ImageGallery
                            images={post.images}
                            image={post.cover}
                            maxHeight={220}
                            borderRadius="0"
                            showZoom={false}
                          />
                        </div>
                      ) : (
                        <div style={{ width: '100%', height: '220px', background: '#E8EBF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `calc(48px * var(--fs, 1))` }}>🚢</div>
                      )}
                      <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.65)', color: '#FFD700', padding: '5px 14px', borderRadius: '20px', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', pointerEvents: 'none' }}>
                        👑 {post.region || '항구 전용 VVIP'}
                      </div>
                      <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#FF5A5F', color: '#fff', padding: '5px 12px', borderRadius: '8px', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '950', pointerEvents: 'none' }}>예약 모집중</div>
                    </div>
                    <div style={{ padding: '20px 18px', cursor: 'pointer' }} onClick={() => setSelectedBusinessPost(post)}>
                      <div style={{ fontSize: `calc(22px * var(--fs, 1))`, fontWeight: '950', color: '#1A1A2E', marginBottom: '10px' }}>{post.shipName}</div>
                      {/* ✅ WARN-CT1: post.content null guard */}
                      <p style={{ margin: '0 0 16px', fontSize: `calc(14px * var(--fs, 1))`, color: '#333', lineHeight: '1.8', fontWeight: '600' }}>{(post.content || '').slice(0, 140)}{(post.content || '').length > 140 ? '...' : ''}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: `calc(13px * var(--fs, 1))` }}>
                        <span style={{ background: '#F4F6FA', padding: '7px 14px', borderRadius: '12px', color: '#333', fontWeight: '800' }}>🎣 {post.target}</span>
                        <span style={{ background: '#F4F6FA', padding: '7px 14px', borderRadius: '12px', color: '#333', fontWeight: '800' }}>📅 {post.date}</span>
                        <span style={{ background: '#FFF3E0', padding: '7px 14px', borderRadius: '12px', color: '#E65100', fontWeight: '950' }}>💰 {post.price}</span>
                      </div>
                    </div>
                    <div style={{ padding: '0 18px 20px', display: 'flex', gap: '12px' }}>
                      <button onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${post.phone || ''}`; }} style={{ flex: 1, backgroundColor: '#0056D2', color: '#fff', border: 'none', padding: '18px', borderRadius: '16px', fontWeight: '950', fontSize: `calc(16px * var(--fs, 1))`, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 6px 18px rgba(0,86,210,0.3)' }}>
                        <Phone size={20} fill="#fff" /> 선장님께 즉시 전화
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); window.location.href = `sms:${post.phone || ''}?body=${encodeURIComponent(`안녕하세요! 낚시GO에서 [${post.shipName}] 선상낚시 예약 문의드립니다.\n\n▶ 원하는 날짜:\n▶ 인원:\n▶ 기타 문의:`)}` ; }} style={{ backgroundColor: '#fff', color: '#00875A', border: '2px solid #00875A', padding: '18px 20px', borderRadius: '16px', fontWeight: '900', fontSize: `calc(15px * var(--fs, 1))`, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <MessageSquare size={20} /> 문자 보내기
                      </button>
                    </div>
                  </div>
                ) : null}
                {/* ✅ NATIVE-AD: VVIP 카드 아래 인피드 네이티브 광고 (앱 전용) */}
                {post.isPinned && !canAccessPremium && Capacitor.isNativePlatform() && (() => {
                  const slotId = `business_ad_${index}`;
                  return (
                    <div
                      ref={el => {
                        if (el && !nativeAdSlotMapRef.current.has(slotId)) {
                          nativeAdSlotMapRef.current.set(slotId, el);
                          loadNativeAd(slotId, el);
                        } else if (!el) {
                          nativeAdSlotMapRef.current.delete(slotId);
                          removeNativeAd(slotId);
                        }
                      }}
                      style={{
                        width: '100%', height: 300, marginBottom: 16,
                        borderRadius: 16, background: 'transparent',
                      }}
                    />
                  );
                })()}
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
                        fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                      }}>
                        <span>🌐 MASTER 공식 전국 홍보 &mdash; 모든 지역 출항 정보</span>
                        {/* ✅ 전국 게시글은 마스터만 작성 가능 → 작성자 or 관리자 수정/삭제 */}
                        {(isAdmin || post.author_email === user?.email) && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/write-business?editId=${String(post._id || post.id)}`); }}
                              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', borderRadius: '6px', padding: '2px 7px', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', display: 'flex', alignItems: 'center', gap: '2px' }}
                            ><Edit2 size={10} /> 수정</button>
                            <button
                              onClick={(e) => handleDeletePost(e, String(post._id || post.id), 'business')}
                              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', borderRadius: '6px', padding: '2px 7px', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', display: 'flex', alignItems: 'center', gap: '2px' }}
                            ><Trash2 size={10} /> 삭제</button>
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ padding: '12px', cursor: 'pointer' }} onClick={() => setSelectedBusinessPost(post)}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {/* ✅ MULTI-IMG: 일반 카드 썸네일 — 여러 장 있을 때 미니 갤러리 */}
                        <div style={{ width: '76px', height: '76px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: '#E8EBF0' }}
                          onClick={e => e.stopPropagation()}>
                          <ImageGallery
                            images={post.images}
                            image={post.cover}
                            maxHeight={76}
                            borderRadius="0"
                            showZoom={false}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '5px' }}>
                            <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: '#FF5A5F', color: '#fff', padding: '2px 6px', borderRadius: '5px', fontWeight: '950', flexShrink: 0 }}>모집중</span>
                            {/* ✅ 지역 배지 */}
                            {post.region === '전국 (전체)' ? (
                              <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: 'rgba(0,86,210,0.12)', color: '#0056D2', padding: '2px 7px', borderRadius: '5px', fontWeight: '900', flexShrink: 0 }}>🌐 전국</span>
                            ) : post.region ? (
                              <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: '#F0F0F5', color: '#555', padding: '2px 7px', borderRadius: '5px', fontWeight: '800', flexShrink: 0 }}>📍 {post.region}</span>
                            ) : null}
                            <span style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '950', color: '#1A1A2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.shipName}</span>
                            {/* ✅ 작성자 or 마스터: 수정/삭제 (region 제한 없이 모든 카드에 표시) */}
                            {(isAdmin || post.author_email === user?.email) && post.region !== '전국 (전체)' && (
                              <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto', flexShrink: 0 }}>
                                <button onClick={(e) => { e.stopPropagation(); navigate(`/write-business?editId=${String(post._id || post.id)}`); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#0056D2' }}><Edit2 size={14} /></button>
                                <button onClick={(e) => handleDeletePost(e, String(post._id || post.id), 'business')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#FF3B30' }}><Trash2 size={14} /></button>
                              </div>
                            )}
                          </div>
                          {/* ✅ WARN-CT1: post.content null guard (소형 카드) */}
                          <p style={{ margin: '0 0 6px', fontSize: `calc(11px * var(--fs, 1))`, color: '#666', lineHeight: '1.5' }}>{(post.content || '').slice(0, 45)}{(post.content || '').length > 45 ? '...' : ''}</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: `calc(10px * var(--fs, 1))` }}>
                            <span style={{ background: '#F4F6FA', padding: '3px 8px', borderRadius: '6px', color: '#333' }}>{post.target}</span>
                            <span style={{ background: '#FFF3E0', padding: '3px 8px', borderRadius: '6px', color: '#E65100', fontWeight: '800' }}>{post.price}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '8px 12px', background: '#F8F9FA', borderTop: '1px solid #F0F2F7', display: 'flex', gap: '6px' }}>
                      <button onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${post.phone || ''}`; }} style={{ flex: 1, backgroundColor: '#0056D2', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '950', fontSize: `calc(12px * var(--fs, 1))`, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <Phone size={13} fill="#fff" /> 즉시 전화
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); window.location.href = `sms:${post.phone || ''}?body=${encodeURIComponent(`안녕하세요! 낚시GO에서 [${post.shipName}] 예약 문의드립니다.\n▶ 날짜:\n▶ 인원:`)}`; }} style={{ backgroundColor: '#fff', color: '#00875A', border: '1.5px solid #00875A', padding: '10px 12px', borderRadius: '10px', fontWeight: '900', fontSize: `calc(12px * var(--fs, 1))`, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <MessageSquare size={13} /> 문자
                      </button>
                    </div>
                  </div>
                )}
              {/* ✅ KAKAO-ADFIT: 선상배 홍보 5개마다 광고 */}
              {!canAccessPremium && (index + 1) % 5 === 0 && (
                <div style={{ margin: '4px 0 12px' }}>
                  <KakaoAd unitId="DAN-M6CEA2Ch9AzCohm9" width={320} height={100}
                    style={{ borderRadius: '12px', overflow: 'hidden' }} />
                </div>
              )}
              </React.Fragment>
            ))}
            {/* ✅ KAKAO-ADFIT: 선상배 목록 끝 고정 광고 */}
            {!canAccessPremium && effectiveBusinessPosts.length > 0 && (
              <div style={{ margin: '4px 0 12px' }}>
                <KakaoAd unitId="DAN-GlROpjPfXauFLUgU" width={320} height={50}
                  style={{ borderRadius: '12px', overflow: 'hidden' }} />
              </div>
            )}
            {/* 무한스크롤 sentinel (더 보기 버튼 대체) */}
            <div ref={sentinelRef} style={{ height: 20 }} />
            {loadingMore && (
              <div style={{ padding: '0 16px 12px' }}><SkeletonCard count={2} /></div>
            )}
            {page >= totalPages && posts.length > 0 && (
              <div style={{ textAlign: 'center', padding: '20px', fontSize: `calc(13px * var(--fs, 1))`, color: '#bbb' }}>
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
              <button onClick={() => setSelectedBusinessPost(null)} style={{ border: 'none', background: '#F2F2F7', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `calc(18px * var(--fs, 1))`, color: '#888', fontWeight: '900' }}>✕</button>
            </div>

            {/* ✅ MULTI-IMG: 모달 이미지 갤러리 슬라이드 (images[] 우선, cover 하위호환) */}
            <div style={{ position: 'relative', margin: '0 16px', borderRadius: '20px', overflow: 'hidden' }}>
              {(Array.isArray(selectedBusinessPost.images) && selectedBusinessPost.images.length > 0) || selectedBusinessPost.cover ? (
                <ImageGallery
                  images={selectedBusinessPost.images}
                  image={selectedBusinessPost.cover}
                  maxHeight={220}
                  borderRadius="0"
                  showZoom={true}
                />
              ) : (
                <div style={{ width: '100%', height: '200px', background: '#E8EBF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `calc(56px * var(--fs, 1))`, borderRadius: '20px' }}>🚢</div>
              )}
              {/* 배지 오버레이 — 갤러리 위에 절대 위치 */}
              <div style={{ position: 'absolute', top: '12px', left: '12px', pointerEvents: 'none', zIndex: 2 }}>
                {selectedBusinessPost.isPinned ? (
                  <div style={{ background: 'linear-gradient(90deg,#FFD700,#FF9B26)', color: '#5C3A00', padding: '5px 14px', borderRadius: '20px', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '950', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Award size={12} fill="#5C3A00" /> VVIP 독점
                  </div>
                ) : (
                  <div style={{ background: '#FF5A5F', color: '#fff', padding: '5px 12px', borderRadius: '20px', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '950' }}>모집중</div>
                )}
              </div>
              {/* 지역·가격 배지 */}
              <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '5px 12px', borderRadius: '12px', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', pointerEvents: 'none', zIndex: 2 }}>
                📍 {selectedBusinessPost.region || '지역 미표시'}
              </div>
              <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: '#0056D2', color: '#fff', padding: '5px 12px', borderRadius: '12px', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '950', pointerEvents: 'none', zIndex: 2 }}>
                {selectedBusinessPost.price || '문의'}
              </div>
            </div>

            {/* 본문 */}
            <div style={{ padding: '20px 20px 0' }}>
              {/* 타입 + 선박명 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: `calc(11px * var(--fs, 1))`, background: '#F0F5FF', color: '#0056D2', padding: '3px 10px', borderRadius: '8px', fontWeight: '900', flexShrink: 0 }}>{selectedBusinessPost.type || '선상낚시'}</span>
              </div>
              <div style={{ fontSize: `calc(24px * var(--fs, 1))`, fontWeight: '950', color: '#1A1A2E', marginBottom: '6px', lineHeight: 1.2 }}>{selectedBusinessPost.shipName}</div>
              <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#888', fontWeight: '700', marginBottom: '18px' }}>선장 · {selectedBusinessPost.author}</div>

              {/* 정보 그리드 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                {[
                  { icon: '🎣', label: '대상어종', value: selectedBusinessPost.target },
                  { icon: '📅', label: '운항 일정', value: selectedBusinessPost.date },
                  { icon: '👥', label: '모집 인원', value: selectedBusinessPost.capacity != null ? `${selectedBusinessPost.capacity}명` : '문의' },
                  { icon: '📞', label: '연락처', value: selectedBusinessPost.phone },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ background: '#F8F9FC', borderRadius: '14px', padding: '12px 14px' }}>
                    <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#AAB0BE', fontWeight: '800', marginBottom: '4px' }}>{icon} {label}</div>
                    <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#1A1A2E', fontWeight: '800', lineHeight: 1.3 }}>{value || '-'}</div>
                  </div>
                ))}
              </div>

              {/* 전체 소개글 */}
              <div style={{ background: '#F8F9FC', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#AAB0BE', fontWeight: '800', marginBottom: '10px' }}>🚢 선박 소개</div>
                <p style={{ fontSize: `calc(14px * var(--fs, 1))`, color: '#333', lineHeight: '1.8', fontWeight: '600', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {selectedBusinessPost.content || '소개 내용이 없습니다.'}
                </p>
              </div>
            </div>

            {/* 하단 액션 버튼 (고정) */}
            <div style={{ padding: '0 20px 36px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#fff', borderTop: '1px solid #F0F2F7', paddingTop: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => { window.location.href = `tel:${selectedBusinessPost.phone || ''}`; }}
                  style={{ flex: 1, backgroundColor: '#0056D2', color: '#fff', border: 'none', padding: '17px', borderRadius: '16px', fontWeight: '950', fontSize: `calc(16px * var(--fs, 1))`, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,86,210,0.35)' }}
                >
                  <Phone size={20} fill="#fff" /> 선장님께 즉시 전화
                </button>
                <button
                  onClick={() => { window.location.href = `sms:${selectedBusinessPost.phone || ''}?body=${encodeURIComponent(`안녕하세요! 낚시GO에서 [${selectedBusinessPost.shipName}] 선상낚시 예약 문의드립니다.\n\n▶ 원하는 날짜:\n▶ 인원:\n▶ 기타 문의:`)}` ; }}
                  style={{ backgroundColor: '#fff', color: '#00875A', border: '2px solid #00875A', padding: '17px 20px', borderRadius: '16px', fontWeight: '900', fontSize: `calc(15px * var(--fs, 1))`, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}
                >
                  <MessageSquare size={20} /> 문자 보내기
                </button>
              </div>
              {/* ✅ 공유 버튼 2개: 외부 앱 공유 + 크루 채팅방 공유 */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {/* 외부 앱 공유 (카카오톡·인스타 등) */}
                <button
                  onClick={() => shareExternal({
                    title: `🚢 ${selectedBusinessPost.shipName} | 낚시GO 선상배 홍보`,
                    text:  `${selectedBusinessPost.region || ''} · ${selectedBusinessPost.target || ''} · ${selectedBusinessPost.price || ''}`,
                    url:   window.location.href,
                    imgUrl: selectedBusinessPost.images?.[0] || selectedBusinessPost.cover,
                    addToast,
                  })}
                  style={{ flex: 1, padding: '14px', border: '1.5px solid #0056D2', borderRadius: '16px', background: 'rgba(0,86,210,0.05)', color: '#0056D2', fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Share2 size={18} /> 공유하기
                </button>
                {/* 크루 채팅방 공유 */}
                <button
                  onClick={async () => {
                    if (!user) { addToast('로그인 후 이용하세요.', 'error'); return; }
                    try {
                      const res = await apiClient.get('/api/user/crews');
                      setMyCrews(Array.isArray(res.data) ? res.data : []);
                    } catch { setMyCrews([]); }
                    setShareTarget(null);
                    setShareModal({ post: { ...selectedBusinessPost, _bizShare: true } });
                  }}
                  style={{ flex: 1, padding: '14px', border: '1.5px solid #00875A', borderRadius: '16px', background: 'rgba(0,135,90,0.05)', color: '#00875A', fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  💬 크루 채팅방
                </button>
              </div>
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
                <div style={{ fontSize: `calc(17px * var(--fs, 1))`, fontWeight: '900', color: '#fff' }}>🔒 프라이빗 크루</div>
                <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: 'rgba(255,255,255,0.45)', fontWeight: '700', marginTop: '2px' }}>{crewPassModal.crew.name}</div>
              </div>
            </div>
            {/* 입력 */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.4)', fontWeight: '800', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>입장 코드 4자리</label>
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
                style={{ width: '100%', padding: '16px 18px', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(0,86,210,0.4)', borderRadius: '16px', color: '#fff', fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '800', outline: 'none', letterSpacing: '0.15em', boxSizing: 'border-box' }}
              />
            </div>
            {/* 버튼 */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setCrewPassModal(null)}
                style={{ flex: 1, padding: '15px', border: 'none', borderRadius: '16px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer' }}
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
                style={{ flex: 2, padding: '15px', border: 'none', borderRadius: '16px', background: crewPassLoading || !crewPassInput.trim() ? 'rgba(0,86,210,0.3)' : 'linear-gradient(135deg,#0056D2,#1565C0)', color: '#fff', fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '950', cursor: crewPassLoading ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s' }}
              >
                {crewPassLoading ? '확인 중...' : '입장하기 🔓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ SHARE-MODAL: 게시글 → 크루 채팅방 공유 */}
      {shareModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShareModal(null)}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', background: '#fff', borderRadius: '24px 24px 0 0', padding: '20px 20px 32px', boxShadow: '0 -8px 32px rgba(0,0,0,0.18)', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '900', color: '#1c1c1e' }}>📤 크루 채팅방에 공유</span>
              <button onClick={() => setShareModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <XIcon size={20} color="#8e8e93" />
              </button>
            </div>
            <div style={{ background: '#F8F9FA', borderRadius: '14px', padding: '12px 14px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center', border: '1px solid #E5E5EA' }}>
              {(shareModal.post.images?.[0] || shareModal.post.image || shareModal.post.cover) && (
                <img src={shareModal.post.images?.[0] || shareModal.post.image || shareModal.post.cover} alt="" style={{ width: '52px', height: '52px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#0056D2', fontWeight: '800', marginBottom: '3px' }}>
                  {shareModal.post._bizShare
                    ? `🚢 선상배 홍보 • ${shareModal.post.author || shareModal.post.shipName || ''}`
                    : `${shareModal.post.category || '전체'} • ${shareModal.post.author}`}
                </div>
                <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#1c1c1e', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {shareModal.post._bizShare
                    ? `${shareModal.post.shipName || '선상낚시'} — ${shareModal.post.target || ''} (${shareModal.post.region || ''})`
                    : ((shareModal.post.content || '').slice(0, 60) || '(내용 없음)')}
                </div>
              </div>
            </div>
            <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#8e8e93', fontWeight: '700', marginBottom: '8px' }}>내가 속한 크루 ({myCrews.length})</div>
            {myCrews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#aaa', fontSize: `calc(14px * var(--fs, 1))` }}>가입된 크루가 없습니다.</div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {myCrews.map(crew => {
                  const crewId = String(crew._id || crew.id);
                  const selected = String(shareTarget?._id || shareTarget?.id) === crewId;
                  return (
                    <div key={crewId} onClick={() => setShareTarget(crew)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '14px', cursor: 'pointer', background: selected ? '#EEF4FF' : '#F8F9FA', border: selected ? '2px solid #0056D2' : '1.5px solid transparent', transition: 'all 0.15s' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: selected ? '#0056D2' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: `calc(20px * var(--fs, 1))` }}>{crew.emoji || '🎣'}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', color: selected ? '#0056D2' : '#1c1c1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{crew.name}</div>
                        <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#8e8e93' }}>멤버 {crew.memberList?.length || crew.members || 0}명</div>
                      </div>
                      {selected && <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#0056D2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: `calc(12px * var(--fs, 1))` }}>✓</span></div>}
                    </div>
                  );
                })}
              </div>
            )}
            <button
              disabled={!shareTarget || sharing}
              onClick={async () => {
                if (!shareTarget || sharing) return;
                setSharing(true);
                const crewId = String(shareTarget._id || shareTarget.id);
                const post = shareModal.post;
                try {
                  if (!shareSockets.current[crewId] || !shareSockets.current[crewId].connected) {
                    let tok; try { tok = localStorage.getItem('access_token') || undefined; } catch { tok = undefined; }
                    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'], auth: { token: tok } });
                    shareSockets.current[crewId] = s;
                    await new Promise((res, rej) => {
                      const t = setTimeout(() => rej(new Error('연결 타임아웃')), 5000);
                      s.once('connect', () => { clearTimeout(t); res(); });
                      s.once('connect_error', (e) => { clearTimeout(t); rej(e); });
                    });
                    s.emit('join_crew', crewId);
                  }
                  shareSockets.current[crewId].emit('send_msg', {
                    crewId, type: 'post_share',
                    postId: String(post._id || post.id),
                    postTitle: post._bizShare
                      ? `🚢 ${post.shipName || '선상낚시'} — ${post.target || ''} (${post.region || ''})`
                      : ((post.content || '').slice(0, 60) || '(내용 없음)'),
                    postPreview: post._bizShare
                      ? `${post.type || '선상낚시'} · ${post.price || '문의'} · 정원 ${post.capacity || '?'}명`
                      : (post.content || '').slice(0, 120),
                    postImage: post.images?.[0] || post.image || post.cover || '',
                    postCategory: post._bizShare ? '🚢 선상배 홍보' : (post.category || '전체'),
                  });
                  addToast(`✅ ${shareTarget.name} 채팅방에 공유했습니다!`, 'success');
                  setShareModal(null);
                } catch (err) {
                  // 연결 실패한 소켓 캐시 정리
                  if (shareSockets.current[crewId]) {
                    try { shareSockets.current[crewId].disconnect(); } catch { }
                    delete shareSockets.current[crewId];
                  }
                  addToast('공유에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
                }
                finally { setSharing(false); }
              }}
              style={{ width: '100%', padding: '16px', border: 'none', borderRadius: '16px', background: (!shareTarget || sharing) ? '#E5E5EA' : 'linear-gradient(135deg,#0056D2,#1565C0)', color: (!shareTarget || sharing) ? '#aaa' : '#fff', fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '900', cursor: (!shareTarget || sharing) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
            >
              <Send size={18} />
              {sharing ? '공유 중...' : shareTarget ? `${shareTarget.name}에 공유하기` : '크루를 선택하세요'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
