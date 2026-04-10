import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlayCircle, MessageSquare, ShoppingBag, User } from 'lucide-react';

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Home size={24} />
        <span>홈(지도)</span>
      </NavLink>
      <NavLink to="/channel" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <PlayCircle size={24} />
        <span>낚시채널</span>
      </NavLink>
      <NavLink to="/community" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <MessageSquare size={24} />
        <span>커뮤니티</span>
      </NavLink>
      <NavLink to="/shop" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <ShoppingBag size={24} />
        <span>쇼핑</span>
      </NavLink>
      <NavLink to="/mypage" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <User size={24} />
        <span>MY</span>
      </NavLink>
    </nav>
  );
}
