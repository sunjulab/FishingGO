import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, NavLink, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Home, Tv, Users, ShoppingBag, User, Anchor } from 'lucide-react';
import Toast from './components/Toast';
import { useToastStore } from './store/useToastStore';
import { useUserStore, TIER_CONFIG, LEVEL_CONFIG } from './store/useUserStore';

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
import RealTimeAlert from './components/RealTimeAlert';

// 스켈레톤 로딩 뼈대
function PageLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#F8F9FA' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid #0056D2', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ marginTop: '16px', fontSize: '13px', color: '#8E8E93', fontWeight: '800' }}>불러오는 중...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function BottomNav() {
  const location = useLocation();
  const navItems = [
    { path: '/', name: '홈', icon: Home },
    { path: '/media', name: '낚시채널', icon: Tv },
    { path: '/community', name: '커뮤니티', icon: Users },
    { path: '/shop', name: '쇼핑', icon: ShoppingBag },
    { path: '/mypage', name: '마이', icon: User },
  ];

  // 상세/글쓰기 페이지에서는 내비게이션 숨김
  const hideNav = ['/write', '/create-crew', '/post/', '/catch/', '/login', '/crew/', '/cctv-admin'].some(path => location.pathname.includes(path));
  if (hideNav) return null;

  return (
    <nav className="bottom-nav" style={{ height: '70px', paddingBottom: '10px' }}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        return (
          <NavLink 
            to={item.path} 
            key={item.name} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <Icon size={24} />
            <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: '700' }}>
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
  const isAdmin = user?.id === 'sunjulab' || user?.email === 'sunjulab' || user?.name === 'sunjulab';
  
  const hideHeader = ['/write', '/create-crew', '/post/', '/catch/', '/login', '/crew/', '/cctv-admin'].some(path => location.pathname !== '/' && location.pathname.includes(path)) || location.pathname === '/';
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
          src={user?.avatar || user?.picture || 'https://i.pravatar.cc/150?img=11'} 
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

  React.useEffect(() => {
    if (lastExpGain && lastExpGain.leveledUp) {
      const { newLevel } = lastExpGain;
      const currentLevelIndex = (newLevel?.level || 1) - 1;
      const levelReward = LEVEL_CONFIG[currentLevelIndex]?.reward || '소정의 찌(포인트)';
      
      setTimeout(() => {
        addToast(`⭐ 레벨 ${newLevel?.level} 달성 기념 보상!`, 'success');
        addToast(`🎁 보상: [${levelReward}] 지급 완료!`, 'info');
      }, 500);

      clearLastExpGain();
    }
  }, [lastExpGain, addToast, clearLastExpGain]);

  return null;
}

// PRO/VVIP 구독 만료 자동 체크 컴포넌트 (앱 시작 + 포커스 복귀 시)
function SubscriptionExpiryChecker() {
  const checkSubscriptionExpiry = useUserStore((s) => s.checkSubscriptionExpiry);
  const addToast = useToastStore((s) => s.addToast);
  const userTier = useUserStore((s) => s.userTier);

  useEffect(() => {
    // 앱 최초 시작 시 체크
    const prevTier = userTier;
    checkSubscriptionExpiry().then(() => {
      const newTier = useUserStore.getState().userTier;
      if (prevTier !== 'FREE' && newTier === 'FREE') {
        addToast('⚠️ 구독이 만료되어 권한이 해제되었습니다. 재구독해주세요.', 'error');
      }
    });

    // 탭 포커스 복귀 시 재체크 (백그라운드 복귀)
    const onFocus = () => checkSubscriptionExpiry();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return null;
}

export default function App() {
  const GOOGLE_CLIENT_ID = "779696124026-7dgp86dmo15jjsvm1dds31j2eim00pgb.apps.googleusercontent.com"; 

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Toast />
        <RealTimeAlert />
        <SubscriptionExpiryChecker />
        <GlobalLevelUpListener />
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
              <Route path="/cctv-admin" element={<CctvAdmin />} />
            </Routes>
          </Suspense>
        </div>
        <BottomNav />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
