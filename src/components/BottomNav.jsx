import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlayCircle, MessageSquare, ShoppingBag, User } from 'lucide-react';

// ✅ WARN-BN1: aria-label 접근성 속성 추가 (WCAG 2.1 AA 준수)
export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="하단 메뉴">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} aria-label="홈 (지도)">
        <Home size={24} aria-hidden="true" />
        <span>홈(지도)</span>
      </NavLink>
      <NavLink to="/media" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} aria-label="낚시채널">{/* ✅ 5TH-C1: /channel → /media 수정 — App.jsx 라우트와 통일 */}
        <PlayCircle size={24} aria-hidden="true" />
        <span>낚시채널</span>
      </NavLink>
      <NavLink to="/community" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} aria-label="커뮤니티">
        <MessageSquare size={24} aria-hidden="true" />
        <span>커뮤니티</span>
      </NavLink>
      <NavLink to="/shop" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} aria-label="쇼핑">
        <ShoppingBag size={24} aria-hidden="true" />
        <span>쇼핑</span>
      </NavLink>
      <NavLink to="/mypage" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} aria-label="마이페이지">
        <User size={24} aria-hidden="true" />
        <span>MY</span>
      </NavLink>
    </nav>
  );
}
