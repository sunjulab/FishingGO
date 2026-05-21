import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { registerPlugin, Capacitor } from '@capacitor/core';

// ✅ BACK-FIX: 모듈 로드 시점(React 마운트 전)에 App 플러그인 등록 — 타이밍 문제 완전 해결
// registerPlugin은 @capacitor/core(이미 의존성)에서 제공 — @capacitor/app 패키지 불필요
const CapApp = Capacitor.isNativePlatform() ? registerPlugin('App') : null;
import { BrowserRouter, Routes, Route, Link, useLocation, NavLink, useNavigate, Navigate } from 'react-router-dom';

// import { GoogleOAuthProvider } from '@react-oauth/google'; // 추후 구글 로그인 연동 시 활성화
import { Home, Tv, Users, ShoppingBag, User, Anchor, Camera, Trophy, Bot } from 'lucide-react';
import Toast from './components/Toast';
import { useToastStore } from './store/useToastStore';
import { useUserStore, TIER_CONFIG, LEVEL_CONFIG, ADMIN_ID, ADMIN_EMAIL } from './store/useUserStore';
import LoadingSpinner from './components/LoadingSpinner';
import KakaoLoader from './components/KakaoLoader';
import { initAdMob } from './services/AdMobService';
import { initPushNotifications, setPushHandlers } from './services/PushNotificationService';

// ✅ ADMOB: 앱 시작 시 AdMob 초기화 (Capacitor 네이티브 환경에서만 동작)
initAdMob().catch(() => {}); // 웹 환경 실패는 무시

// ─── 카카오 JS SDK 초기화 (공유/소셜 기능용) ─────────────────────────────────
if (typeof window !== 'undefined' && window.Kakao && !window.Kakao.isInitialized()) {
  const kakaoKey = import.meta.env.VITE_KAKAO_APP_KEY || 'd353be56977b1c13b03d8981bcf8b5ba';
  if (kakaoKey) window.Kakao.init(kakaoKey);
}

// ✅ 3RD-A1: Header 프로필 fallback — pravatar.cc 외부 의존 제거 (LoginPage NEW-A2와 동일 패턴)
const DEFAULT_AVATAR_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23E5E5EA'/%3E%3Ccircle cx='20' cy='16' r='7' fill='%23AEAEB2'/%3E%3Cellipse cx='20' cy='36' rx='12' ry='9' fill='%23AEAEB2'/%3E%3C/svg%3E";

// ✅ 3RD-B2: hideNav/hideHeader 경로 배열 통합 — 한 곳에서 관리 (✅ 3RD-B1: /media 제거 — MediaTab 네비게이션 정상 노출)
const HIDE_OVERLAY_PATHS = ['/write', '/write-business', '/create-crew', '/post/', '/catch/', '/login', '/crew/', '/cctv-admin', '/notice/', '/secret-admin', '/payment-history', '/vvip-subscribe', '/admin-dashboard', '/weather', '/user/'];

// 라우트 레이지 로딩 (코드 스플리팅)
const MapHome = lazy(() => import('./pages/MapHome')); 
const MediaTab = lazy(() => import('./pages/MediaTab'));
const CommunityTab = lazy(() => import('./pages/CommunityTab'));
const Shop = lazy(() => import('./pages/Shop')); 
const MyPage = lazy(() => import('./pages/MyPage'));
const WritePost = lazy(() => import('./pages/WritePost'));
const CreateCrew = lazy(() => import('./pages/CreateCrew'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const CatchDetail = lazy(() => import('./pages/CatchDetail'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const CrewChat = lazy(() => import('./pages/CrewChat'));
const WeatherDashboard = lazy(() => import('./pages/WeatherDashboard'));
const VVIPSubscribe = lazy(() => import('./pages/VVIPSubscribe'));
const WriteBusinessPost = lazy(() => import('./pages/WriteBusinessPost'));
const CctvAdmin = lazy(() => import('./pages/CctvAdmin'));
const NoticeDetail = lazy(() => import('./pages/NoticeDetail'));
const SecretPointAdmin = lazy(() => import('./pages/SecretPointAdmin'));
const PaymentHistory   = lazy(() => import('./pages/PaymentHistory'));
const AdminDashboard   = lazy(() => import('./pages/AdminDashboard'));
const UserProfile      = lazy(() => import('./pages/UserProfile'));
// ✅ 로상 / AI / 대회 페이지
const CatchUploadPage  = lazy(() => import('./pages/CatchUploadPage'));
const CatchRankingPage = lazy(() => import('./pages/CatchRankingPage'));
const ContestPage      = lazy(() => import('./pages/ContestPage'));

import RealTimeAlert from './components/RealTimeAlert';
import ErrorBoundary from './components/ErrorBoundary';
import SubscriptionFailBanner from './components/SubscriptionFailBanner';
import AnnouncementPopup from './components/AnnouncementPopup'; // ✅ POPUP: 앱 시작 시 공지 이미지 팝업

// ENH3-A1: index.css의 @keyframes spin 사용 — 중복 인라인 <style> 제거
// ✅ 3RD-C2: PageLoading → LoadingSpinner 재사용 — 동일한 UI를 별도 인라인 정의 불필요
function PageLoading() {
  return <LoadingSpinner />;
}

// ✅ FONT-SCALE: 앱 시작 시 localStorage → html[data-fs] + CSS --fs 변수 동기화
function FontScaleInit() {
  useEffect(() => {
    const apply = (scale) => {
      const v = ['1', '1.15', '1.3', '1.5'].includes(scale) ? scale : '1';
      document.documentElement.setAttribute('data-fs', v);
    };
    // 초기 적용
    apply(localStorage.getItem('fishinggo_fs') || '1');
    // 다른 탭/창에서 변경 시 동기화
    const onStorage = (e) => { if (e.key === 'fishinggo_fs') apply(e.newValue || '1'); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  return null;
}


// ✅ BACK-FIX: 물리 뒤로가기 — 서브페이지(/post/,/crew/ 등)는 navigate(-1), 최상위 탭은 잠금
function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const ROOT_PATHS = ['/', '/community', '/media', '/shop', '/mypage', '/catch-ranking', '/catch-upload', '/ai-coach', '/contest'];
    const isRoot = ROOT_PATHS.includes(location.pathname);

    const handleBack = () => {
      if (isRoot) return;
      if (location.pathname.startsWith('/post/')) {
        const postId = location.pathname.split('/post/')[1]?.split('?')[0]?.split('#')[0];
        if (postId) {
          sessionStorage.setItem('community_return_post_id', postId);
          sessionStorage.setItem('community_return_tab', 'open');
        }
      }
      if (window.history.length <= 1) {
        navigate('/community', { replace: true });
      } else {
        navigate(-1);
      }
    };

    if (CapApp) {
      const listenerP = CapApp.addListener('backButton', handleBack);
      return () => { listenerP?.then?.(l => l?.remove?.()).catch?.(() => {}); };
    } else {
      const domBack = (e) => { e?.preventDefault?.(); handleBack(); };
      document.addEventListener('backbutton', domBack, false);
      return () => document.removeEventListener('backbutton', domBack, false);
    }
  }, [location.pathname, navigate]);

  return null;
}

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = [
    { path: '/',              name: '홈',       icon: Home },
    { path: '/catch-ranking', name: '조황랭킹', icon: Trophy },
    { path: '/catch-upload',  name: '조황인증', icon: null,   isCenter: true },
    { path: '/community',     name: '커뮤니티', icon: Users },
    { path: '/mypage',        name: '마이',     icon: User },
  ];

  const hideNav = HIDE_OVERLAY_PATHS.some(path => location.pathname.includes(path));
  if (hideNav) return null;

  return (
    <nav className="bottom-nav" style={{ display: 'flex', alignItems: 'center' }}>
      {navItems.map((item) => {
        const Icon = item.icon;

        if (item.isCenter) {
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className="nav-item"
              style={{
                background: 'linear-gradient(135deg,#0056D2,#003fa3)',
                border: 'none', borderRadius: '50%',
                width: '52px', height: '52px', marginTop: '-16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
                boxShadow: '0 4px 14px rgba(0,86,210,0.5)',
              }}
            >
              <Camera size={26} color="#fff" />
            </button>
          );
        }

        return (
          <NavLink
            to={item.path}
            key={item.name}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
            end={item.path === '/'}
          >
            <Icon size={22} />
            <span style={{ fontSize: `calc(10px * var(--fs, 1))`, marginTop: '3px', fontWeight: '700' }}>
              {item.name}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const userTier = useUserStore((state) => state.userTier);
  // ✅ FIX-ADMIN: isAdmin 4중 보장 (id/email/gmail/MASTER tier)
  const isAdmin = useUserStore(s =>
    s.user?.id === ADMIN_ID ||
    s.user?.email === ADMIN_EMAIL ||
    s.user?.email === 'sunjulab.k@gmail.com' ||
    s.userTier === 'MASTER'
  );

  // ✅ 3RD-B2: HIDE_OVERLAY_PATHS 상수 사용
  const hideHeader = HIDE_OVERLAY_PATHS.some(path => location.pathname !== '/' && location.pathname.includes(path)) || location.pathname === '/';
  if (hideHeader) return null;

  const currentTier = isAdmin ? TIER_CONFIG.MASTER : (TIER_CONFIG[userTier] || TIER_CONFIG.FREE);

  return (
    <div className="premium-header">
      <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <Anchor size={24} color="#0056D2" />
        낚시GO
        {currentTier.label && (
          <span 
            className="premium-badge" 
            style={{ background: currentTier.bg || undefined, color: currentTier.color || undefined }}
          >
            {currentTier.label}
          </span>
        )}
      </div>
      <div>
        <img 
        src={user?.avatar || user?.picture || DEFAULT_AVATAR_SVG} 
          alt="Profile" 
          onClick={() => navigate('/mypage')}
          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', cursor: 'pointer' }} 
        />
      </div>
    </div>
  );
}

function GlobalLevelUpListener() {
  const lastExpGain = useUserStore((state) => state.lastExpGain);
  const clearLastExpGain = useUserStore((state) => state.clearLastExpGain);
  const addToast = useToastStore((state) => state.addToast);
  const timerRef = React.useRef(null); // ✅ 15TH-B1: setTimeout cleanup ref

  React.useEffect(() => {
    if (lastExpGain && lastExpGain.leveledUp) {
      const { newLevel } = lastExpGain;
      const currentLevelIndex = (newLevel?.level || 1) - 1;
      const levelReward = LEVEL_CONFIG[currentLevelIndex]?.reward || '소정의 찌(포인트)';
      
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        addToast(`⭐ 레벨 ${newLevel?.level} 달성 기념 보상!`, 'success');
        addToast(`🎁 보상: [${levelReward}] 지급 완료!`, 'info');
      }, 500);

      clearLastExpGain();
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); }; // ✅ 15TH-B1: cleanup
  }, [lastExpGain, addToast, clearLastExpGain]);

  return null;
}

// PRO/VVIP 구독 만료 자동 체크 컴포넌트 (앱 시작 + 포커스 복귀 시)
function SubscriptionExpiryChecker() {
  const checkSubscriptionExpiry = useUserStore((s) => s.checkSubscriptionExpiry);
  const addToast = useToastStore((s) => s.addToast);
  const userTier = useUserStore((s) => s.userTier);
  // ENH3-A2: useNavigate 사용 — window.location.href 풀 리로드 대신 React Router 내부 이동
  const navigate = useNavigate();
  const navTimerRef = useRef(null); // ✅ 30TH-B1 보너스: React.useRef → useRef (named import 통일)

  useEffect(() => {
    // 앱 최초 시작 시 체크
    const prevTier = userTier;
    checkSubscriptionExpiry().then(() => {
      const newTier = useUserStore.getState().userTier;
      if (prevTier !== 'FREE' && newTier === 'FREE') {
        addToast('⚠️ 구독이 만료되어 권한이 해제되었습니다. 재구독해주세요.', 'error');
      }
    });

    // 탭 포커스 복귀 시 재체크
    const onFocus = () => checkSubscriptionExpiry();
    window.addEventListener('focus', onFocus);

    // 서버 미들웨어에서 SUBSCRIPTION_EXPIRED 응답 시 발행되는 이벤트 처리
    const onExpired = () => {
      addToast('⚠️ 구독이 만료되었습니다. 마이페이지에서 재구독해주세요.', 'error');
      // ENH3-A2: window.location.href 풀 리로드 → navigate 내부 이동으로 교체
      // ✅ WARN-APP1: 이미 /mypage에 있으면 리다이렉트 생략 (무한 루프 방지)
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      navTimerRef.current = setTimeout(() => { // ✅ 15TH-B2: ref 기반 타이머
        if (!window.location.pathname.includes('/mypage')) {
          navigate('/mypage', { replace: true });
        }
      }, 2000);
    };
    window.addEventListener('subscription_expired', onExpired);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('subscription_expired', onExpired);
      if (navTimerRef.current) clearTimeout(navTimerRef.current); // ✅ 15TH-B2: cleanup
    };
  }, [checkSubscriptionExpiry, addToast]);

  return null;
}

// 사용자 정보 실시간 동기화 (5분 주기 + 포커스 복귀 시)
function UserSyncChecker() {
  const syncFromServer = useUserStore((s) => s.syncFromServer);
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    if (!user?.email) return;

    // 즉시 1회 동기화
    syncFromServer();

    // 5분마다 주기적 동기화
    const interval = setInterval(syncFromServer, 5 * 60 * 1000);

    // 탭 포커스 복귀 시 즉시 동기화 (다른 기기에서 tier 변경 후 복귀)
    const onVisibility = () => { if (document.visibilityState === 'visible') syncFromServer(); };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user?.email, syncFromServer]); // ✅ 3RD-C1: syncFromServer는 store 함수로 안정적 — [user?.email] 단돁으로도 동일하나 명시적 등록 유지

  return null;
}

// ENH4-A1: auth_expired 이벤트 수신 → navigate로 /login 이동 (window.location.href 풀 리로드 방지)
function AuthExpiredChecker() {
  const navigate = useNavigate();
  const logout = useUserStore((s) => s.logout);
  useEffect(() => {
    const onAuthExpired = () => {
      logout();
      if (!window.location.pathname.includes('/login')) {
        navigate('/login', { replace: true });
      }
    };
    window.addEventListener('auth_expired', onAuthExpired);
    return () => window.removeEventListener('auth_expired', onAuthExpired);
  }, [navigate, logout]);
  return null;
}

// ✅ PUSH: 로그인 후 FCM 토큰 등록
function PushInitializer() {
  const user = useUserStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;
    setPushHandlers({ addToast, navigate });
    initPushNotifications(user.id);
  }, [user?.id]); // eslint-disable-line

  return null;
}

// ENH3-C1: 어드민 라우트 보호 컴포넌트 분리 — App() 에서 불필요한 리렌더 방지
// ✅ HYDRATION-FIX v2: reactive selector + 1tick hydration delay 조합
//   - 이전 방식(getState 1회): cleanup 경쟁조건으로 checked 영구 false → null 유지 버그
//   - 새 방식: Zustand selector(반응형) + hydrated flag(미수화 오판 방지)
function AdminRoute({ children }) {
  // ✅ 반응형: store 업데이트 시 자동 재계산 (setUser, syncFromServer 후에도 즉시 반영)
  const isAdmin = useUserStore(s =>
    s.user?.id === ADMIN_ID ||
    s.user?.email === ADMIN_EMAIL ||
    s.user?.email === 'sunjulab.k@gmail.com' ||
    s.userTier === 'MASTER'
  );
  // ✅ 미수화 오판 방지: 첫 렌더에서 isAdmin=false → 즉시 redirect 막음
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // 1tick 후 수화 완료 플래그 — localStorage 동기 초기화 완료 보장
    const t = setTimeout(() => setHydrated(true), 0);
    return () => clearTimeout(t);
  }, []);

  if (!hydrated) return null;                    // 수화 전: 빈 화면
  if (!isAdmin) return <Navigate to="/" replace />; // 수화 후: 권한 없으면 홈
  return children;                               // 권한 있으면 자식 렌더
}


export default function App() {

  return (
    // ✅ FIX-BLANK: BrowserRouter를 ErrorBoundary 바깥(최상위)으로 이동
    // ErrorBoundary 내부에서 useNavigate()를 사용하므로 반드시 Router context 안에 있어야 함
    // 이전 구조: <ErrorBoundary><BrowserRouter>... → useNavigate가 Router 바깥에서 호출돼 앱 전체 크래시
    <BrowserRouter>
      <ErrorBoundary>
        <FontScaleInit />
        <KakaoLoader />
        <Toast />
        <SubscriptionFailBanner />
        <RealTimeAlert />
        <SubscriptionExpiryChecker />
        <UserSyncChecker />
        {/* ENH4-A1: auth_expired 커스텀 이벤트 처리 컴포넌트 */}
        <AuthExpiredChecker />
        <GlobalLevelUpListener />
        {/* ✅ POPUP: 이미지 있는 공지 → 앱 시작 시 carousel 팝업 — useNavigate 사용으로 BrowserRouter 내부에 배치 */}
        <AnnouncementPopup />
        <BackButtonHandler />
        {/* ✅ PUSH: 로그인 후 FCM 토큰 자동 등록 */}
        <PushInitializer />
        <Header />
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/" element={<MapHome />} />
              <Route path="/media" element={<MediaTab />} />
              <Route path="/community" element={<CommunityTab />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/mypage" element={<MyPage />} />
              <Route path="/write" element={<WritePost />} />
              <Route path="/create-crew" element={<CreateCrew />} />
              <Route path="/post/:id" element={<PostDetail />} />
              <Route path="/catch/:id" element={<CatchDetail />} />
              <Route path="/crew/:id/chat" element={<CrewChat />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/weather" element={<WeatherDashboard />} />
              <Route path="/vvip-subscribe" element={<VVIPSubscribe />} />
              <Route path="/write-business" element={<WriteBusinessPost />} />
              {/* ENH3-C1: AdminRoute 컴포넌트로 분리 — App() 리렌더 수 절감 */}
              <Route path="/cctv-admin" element={<AdminRoute><CctvAdmin /></AdminRoute>} />
              <Route path="/notice/:id" element={<NoticeDetail />} />
              <Route path="/secret-admin" element={<AdminRoute><SecretPointAdmin /></AdminRoute>} />
              <Route path="/payment-history" element={<PaymentHistory />} />
              <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/user/:name" element={<UserProfile />} />
            </Routes>
          </Suspense>
        </div>
        <BottomNav />
      </ErrorBoundary>
    </BrowserRouter>
  );
}
