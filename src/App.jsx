import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, NavLink } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Home, Tv, Users, ShoppingBag, User, Anchor } from 'lucide-react';
import Toast from './components/Toast';

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
  const hideNav = ['/write', '/create-crew', '/post/', '/catch/', '/login', '/crew/'].some(path => location.pathname.includes(path));
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
  const hideHeader = ['/write', '/create-crew', '/post/', '/catch/', '/login', '/crew/'].some(path => location.pathname !== '/' && location.pathname.includes(path)) || location.pathname === '/';
  if (hideHeader) return null;

  return (
    <div className="premium-header">
      <div className="logo">
        <Anchor size={24} color="#0056D2" />
        낚시GO
        <span className="premium-badge">PREMIUM</span>
      </div>
      <div>
        <img src="https://i.pravatar.cc/150?img=11" alt="Profile" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
      </div>
    </div>
  );
}

export default function App() {
  const GOOGLE_CLIENT_ID = "779696124026-7dgp86dmo15jjsvm1dds31j2eim00pgb.apps.googleusercontent.com"; 

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Toast />
        <RealTimeAlert />
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
            </Routes>
          </Suspense>
        </div>
        <BottomNav />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
