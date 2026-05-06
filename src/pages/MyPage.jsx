import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/index';
import { compressAvatar } from '../utils/imageUtils';
import { useUserStore, TIER_CONFIG, getLevelInfo, EXP_REWARDS, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import { 
  BookOpen, MapPin, Calendar, Scale, Settings, Bell, CreditCard, 
  ShieldAlert, ChevronRight, LayoutGrid, Edit3, Check, X, 
  Trophy, Star, Heart, MessageSquare, Camera, History,
  ToggleLeft, ToggleRight, Lock, CreditCard as CardIcon
} from 'lucide-react';

// ✅ 6TH-C1: MENU_ITEMS 컴포넌트 외부 상수 — 불변 배열이므로 매 렌더마다 재생성 불필요
// (아이콘은 모듈 레벨 import로 컴포넌트 외부에서 참조 가능)
const MENU_ITEMS = [
  { id: 'noti',     title: '알림 설정',         color: '#0056D2', desc: '물때 및 커뮤니티 알림',   icon: null /* 아이콘은 JSX 렌더 시 동적 연결 */ },
  { id: 'premium',  title: '프리미엄 구독 관리',   color: '#FF9B26', desc: '포인트 및 구독권 요금',   icon: null },
  { id: 'history',  title: '결제 내역',          color: '#00C48C', desc: '자동청구 현황 및 구독 취소', icon: null },
  { id: 'security', title: '보안 및 차단 설정',    color: '#FF5A5F', desc: '계정 보안 및 차단 목록',  icon: null },
];

// ✅ 6TH-A2: MyPage 아바타 fallback — pravatar.cc 외부 의존 제거 (App.jsx 3RD-A1과 동일 패턴)
const DEFAULT_AVATAR_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23E5E5EA'/%3E%3Ccircle cx='20' cy='16' r='7' fill='%23AEAEB2'/%3E%3Cellipse cx='20' cy='36' rx='12' ry='9' fill='%23AEAEB2'/%3E%3C/svg%3E";

// ✅ 6TH-B2: localStorage 안전 헬퍼 — 보안 예외를 조용히 실패 처리 (MyPage 내 중복 try/catch 통합)
const safeLS = {
  set: (key, val) => { try { localStorage.setItem(key, val); } catch { /* 저장 실패 무시 */ } },
  remove: (key) => { try { localStorage.removeItem(key); } catch { /* 삭제 실패 무시 */ } },
};

// 알림 설정 기본값 (컴포넌트 외부 상수 — 렌더마다 새 객체 생성 방지)
const DEFAULT_NOTI = { flow: true, bait: true, comm: true };


export default function MyPage() {
  const navigate = useNavigate();
  // ✅ 6TH-B1: 셀렉터별 분리 구독 — 전체 store 구독 시 store 내 어떤 값 변경도 57KB MyPage 전체 리렌더 유발
  const user              = useUserStore(s => s.user);
  const updateUser        = useUserStore(s => s.updateUser);
  const logout            = useUserStore(s => s.logout);
  const userTier          = useUserStore(s => s.userTier);
  const canAccessPartnerCenter = useUserStore(s => s.canAccessBusinessShop?.());
  const addToast = useToastStore(s => s.addToast);
  const fileInputRef = useRef(null);
  // ✅ FIX-ADMIN: isAdmin 4중 보장
  // - user.id === 'sunjulab' (ID 로 로그인 시 서버가 id를 'sunjulab'으로 고정 반환 후)
  // - user.email === 'sunjulab.k@gmail.com' (구글 소셜)
  // - user.email === 'sunjulab' (이메일 필드를 ID로 사용하여 가입한 경우)
  // - userTier === 'MASTER' (tier 서버에서 MASTER로 설정된 경우)
  const isAdmin = useUserStore(s =>
    s.user?.id === ADMIN_ID ||
    s.user?.email === ADMIN_EMAIL ||
    s.user?.email === ADMIN_ID ||
    s.userTier === 'MASTER'
  );
  const tierBadge = isAdmin ? TIER_CONFIG.MASTER : (TIER_CONFIG[userTier] || TIER_CONFIG.FREE);
  const levelInfo  = getLevelInfo(user?.totalExp || 0);
  
  const [activeTab, setActiveTab] = useState('records');
  const [showModal, setShowModal] = useState(null); // 'noti', 'premium', 'security', 'level'
  
  const [realPosts, setRealPosts] = useState([]);
  const [realRecords, setRealRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [error, setError] = useState('');

  // 설정 대시보드 상태 — 안전한 기본값으로 초기화 후 user 로드 시 동기화
  const [notiSetting, setNotiSetting] = useState(DEFAULT_NOTI);

  // NEW-B3: 카메라 오버레이 hover 상태 — DOM 직접 조작 anti-pattern 제거
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);

  // 보안 대시보드 상태
  const [secTab, setSecTab] = useState(null); // 'pwd', 'block'
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [blockName, setBlockName] = useState('');
  const [blockedUsers, setBlockedUsers] = useState([]);

  const handlePasswordChange = async () => {
    if (!currentPwd || !newPwd.trim()) return addToast('비밀번호를 입력해주세요.', 'error');
    if (newPwd.trim().length < 8) return addToast('새 비밀번호는 8자 이상이어야 합니다.', 'error'); // ✅ 6TH-C2: trim() 적용
    if (currentPwd === newPwd.trim()) return addToast('새 비밀번호는 현재 비밀번호와 다른 것으로 설정해주세요.', 'error');
    try {
      const res = await apiClient.put('/api/user/password', { email: user.email, currentPassword: currentPwd, newPassword: newPwd });
      if (res.data.success) {
        addToast('비밀번호가 성공적으로 변경되었습니다.', 'success');
        setSecTab(null);
        setCurrentPwd('');
        setNewPwd('');
      }
    } catch (err) {
      addToast(err.response?.data?.error || '비밀번호 변경 실패', 'error');
    }
  };

  const handleBlockUser = async () => {
    if (!blockName.trim()) return addToast('차단할 사용자 닉네임을 입력해주세요.', 'error');
    try {
      const res = await apiClient.post('/api/user/block', { email: user.email, blockTargetName: blockName.trim() });
      if (res.data.success) {
        addToast(`${blockName}님을 차단했습니다.`, 'success');
        setBlockedUsers(res.data.blockedUsers);
        updateUser({ blockedUsers: res.data.blockedUsers });
        setBlockName('');
      }
    } catch (err) {
      addToast(err.response?.data?.error || '차단 실패', 'error');
    }
  };

  const handleUnblockUser = async (targetName) => {
    try {
      const res = await apiClient.post('/api/user/unblock', { email: user.email, unblockTargetName: targetName });
      if (res.data.success) {
        addToast(`${targetName}님의 차단을 해제했습니다.`, 'success');
        setBlockedUsers(res.data.blockedUsers);
        updateUser({ blockedUsers: res.data.blockedUsers });
      }
    } catch (err) {
      addToast('차단 해제 실패', 'error');
    }
  };

  const handleTierChange = async (tier, name) => {
    // VIP 플랜은 항구 선택 페이지로 이동
    if (tier === 'BUSINESS_VIP') {
      setShowModal(null);
      navigate('/vvip-subscribe');
      return;
    }

    // 현재 플랜과 동일하면 무시
    if (userTier === tier) {
      addToast('이미 해당 플랜을 이용 중입니다.', 'info');
      return;
    }

    // 로그인 상태 확인
    if (!user) {
      addToast('로그인이 필요합니다.', 'error');
      return;
    }

    // 로컬 즉시 반영 (UX)
    useUserStore.getState().setUserTier(tier);
    updateUser({ tier });
    addToast(`${name} 플랜으로 변경됐습니다.`, 'success');
    setShowModal(null);

    // 서버 동기화 (백그라운드, 실패해도 로컬은 유지)
    try {
      const identifier = user.email || user.id;
      await apiClient.put('/api/user/tier', { email: identifier, tier });
    } catch (err) {
      if (!import.meta.env.PROD) console.warn('[tierChange 서버 동기화 실패]', err.response?.data || err.message);
      // 서버 동기화 실패해도 로컬 변경은 이미 반영됨 — 토스트 없음
    }
  };

  const handleToggleNoti = async (key) => {
    const prevSettings = { ...notiSetting }; // 롤백용 이전 상태 캡처 (클로저 안전)
    const newSettings = { ...notiSetting, [key]: !notiSetting[key] };
    setNotiSetting(newSettings);
    updateUser({ notiSettings: newSettings }); // 로컬 스토어 반영
    
    try {
      // 서버 DB에 영구 저장 요청
      await apiClient.post('/api/user/settings', {
        email: user.email,
        notiSettings: newSettings
      });
    } catch (err) {
      addToast('설정 저장 실패', 'error');
      setNotiSetting(prevSettings); // 캡처된 이전 상태로 안전하게 롤백
      updateUser({ notiSettings: prevSettings });
    }
  };


  // levelInfo.progressPct 활용 — LEVEL_CONFIG 기반 정확한 진행률 (레거시 level*100 공식 제거)
  const expPercentage = levelInfo.progressPct ?? 0;

  // user가 로드되거나 변경될 때 로컬 UI 상태 동기화
  useEffect(() => {
    if (!user) return;
    if (user.notiSettings) setNotiSetting(user.notiSettings);
    if (user.blockedUsers) setBlockedUsers(user.blockedUsers);
    if (user.name) setNewName(user.name);
  }, [user?.email]); // email 기준으로 실제 사용자 교체 시에만 동기화

  // ✅ 26TH-B3: fetchUserData를 useCallback으로 래핑 — stale closure 제거 및 useEffect deps 명시화
  // useEffect 호출보다 반드시 먼저 선언해야 함
  const fetchUserData = React.useCallback(async () => {
    // 이메일 없는 GUEST/비로그인 사용자는 API 호출 불필요
    if (!user?.email || user.email === 'guest@fishinggo.com') return;
    try {
      setLoading(true);
      // NEW-C2: Promise.all → Promise.allSettled — 하나 실패해도 나머지 탭 표시 가능
      const [postsResult, recordsResult] = await Promise.allSettled([
        apiClient.get(`/api/user/posts?email=${encodeURIComponent(user.email)}`),
        apiClient.get(`/api/user/records?email=${encodeURIComponent(user.email)}`)
      ]);
      if (postsResult.status === 'fulfilled') setRealPosts(postsResult.value.data);
      else if (!import.meta.env.PROD) console.warn('[MyPage] 게시글 로드 실패:', postsResult.reason?.message);
      if (recordsResult.status === 'fulfilled') setRealRecords(recordsResult.value.data);
      else if (!import.meta.env.PROD) console.warn('[MyPage] 조과 기록 로드 실패:', recordsResult.reason?.message);
    } catch (err) {
      if (!import.meta.env.PROD) console.error('Failed to fetch my activity', err);
    } finally {
      setLoading(false);
    }
  }, [user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user?.email) {
      fetchUserData();
    }
  }, [user?.email, fetchUserData]); // ✅ 26TH-B3: fetchUserData deps에 명시적 포함


  const handleNicknameChange = async () => {
    if (newName.trim().length < 2 || newName.trim().length > 12) {
      addToast('닉네임은 2~12자 사이로 입력해주세요.', 'error');
      return;
    }
    const nicknameRegex = /^[a-zA-Z0-9가-힣]+$/;
    if (!nicknameRegex.test(newName)) {
      addToast('한글, 영어, 숫자만 사용 가능합니다.', 'error');
      return;
    }
    try {
      const res = await apiClient.put(`/api/user/nickname`, {
        email: user.email, newName
      });
      if (res.data.success) {
        updateUser({ name: res.data.name });
        setIsEditing(false);
        // ✅ 6TH-B2: safeLS.remove 헬퍼 사용
        try { safeLS.remove('community_liked_posts'); } catch { }
        addToast('닉네임이 성공적으로 변경되었습니다.', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.error || '서버 연결 실패', 'error');
    }
  };


  /* ── 프로필 사진 변경 ── */
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일 재선택 시 onChange 재발생
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast('파일 크기는 5MB 이하만 가능합니다.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        // imageUtils.compressAvatar: 300x300 정사각형 크롭 + JPEG 0.8
        const base64 = await compressAvatar(ev.target.result);

        // 즉시 UI 반영 (서버 저장 전)
        updateUser({ avatar: base64, picture: base64 });

        // ✅ 6TH-B2: safeLS.set 헬퍼 사용 — 빈 try/catch(e) {} 패턴 없애기
        if (user?.email) safeLS.set(`avatar_${user.email}`, base64);

        try {
          // NEW-A1: base64 아바타 업로드 timeout 30초 (기본 10초 시간초과 위험 방지)
          const res = await apiClient.post('/api/user/avatar', {
            email: user.email,
            avatar: base64
          }, { timeout: 30000 });
          if (res.data.success) {
            addToast('프로필 사진이 저장되었습니다! 📸', 'success');
          }
        } catch (err) {
          if (!import.meta.env.PROD) console.error('Avatar server error:', err);
          // 서버 저장 실패해도 로컬은 이미 반영됨 → 성공 안내
          addToast('📸 프로필 사진이 변경되었습니다! (로컬 저장)', 'success');
        }
      } catch (compressErr) {
        if (!import.meta.env.PROD) console.error('이미지 압축 실패:', compressErr);
        addToast('이미지 처리 중 오류가 발생했습니다.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    logout();
    if (user?.id === 'GUEST') {
      addToast('로그인 페이지로 이동합니다.', 'success');
    } else {
      addToast('로그아웃 되었습니다.', 'success');
    }
    navigate('/login');
  };

  // 비로그인 상태면 로그인 페이지로
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8F9FA', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>🎣</div>
        <p style={{ fontSize: '16px', fontWeight: '800', color: '#1c1c1e' }}>로그인이 필요합니다</p>
        <button
          onClick={() => navigate('/login')}
          style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #0056D2, #003fa3)', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}
        >
          로그인 / 회원가입
        </button>
      </div>
    );
  }

  // ✅ 6TH-C1: MENU_ITEMS 외부 상수 사용 — 아이콘은 렌더 시 매핑
  const menuItems = MENU_ITEMS.map(item => ({
    ...item,
    icon: item.id === 'noti' ? Bell :
          item.id === 'premium' ? CreditCard :
          item.id === 'history' ? CardIcon :
          ShieldAlert,
  }));

  return (
    <div className="page-container" style={{ backgroundColor: '#F8F9FA', paddingBottom: '120px' }}>
      {/* 🟦 Top Profile Card 🟦 */}
      <div style={{ background: 'linear-gradient(180deg, #fff 0%, #F8F9FA 100%)', padding: '40px 24px 30px', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {/* 프로필 사진 + 수정 버튼 */}
          {/* NEW-B3: onMouseEnter/onMouseLeave state로 호버 제어 — DOM 직접 조작 anti-pattern 제거 */}
          <div
            style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
            onClick={() => fileInputRef.current?.click()}
            title="사진 변경"
            onMouseEnter={() => setIsHoveringAvatar(true)}
            onMouseLeave={() => setIsHoveringAvatar(false)}
          >
            <img
              src={user.avatar || user.picture || DEFAULT_AVATAR_SVG /* ✅ 6TH-A2: pravatar.cc 제거 */}
              alt="P"
              style={{
                width: '100px', height: '100px', borderRadius: '35px', objectFit: 'cover',
                border: '4px solid #fff', boxShadow: '0 15px 30px rgba(0,86,210,0.1)',
                transition: 'filter 0.2s',
                filter: isHoveringAvatar ? 'brightness(0.75)' : 'brightness(1)',
              }}
            />
            {/* 카메라 오버레이 — isHoveringAvatar state로 제어 */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '35px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isHoveringAvatar ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0)',
              transition: 'background 0.2s',
              pointerEvents: 'none',
            }}>
              <Camera size={26} color="#fff" style={{ opacity: isHoveringAvatar ? 1 : 0, transition: 'opacity 0.2s' }} />
            </div>
            {/* 카메라 뱃지 (항상 표시) */}
            <div style={{
              position: 'absolute', bottom: '-6px', right: '-6px',
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #0056D2, #003fa3)',
              border: '2.5px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,86,210,0.35)',
            }}>
              <Camera size={14} color="#fff" />
            </div>
            {/* PRO/VIP/FREE 등 티어 뱃지 (FREE면 표시 안 함) */}
            {tierBadge.label && (
              <div style={{
                position: 'absolute', top: '-8px', left: '-8px',
                background: tierBadge.bg,
                color: tierBadge.color,
                fontSize: '10px', fontWeight: '900',
                padding: '3px 9px', borderRadius: '12px',
                border: '2.5px solid #fff', letterSpacing: '0.02em',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                whiteSpace: 'nowrap',
              }}>{tierBadge.label}</div>
            )}
            {/* 숨겨진 파일 input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isEditing ? (
                <div style={{ position: 'relative', width: '100%' }}>
                  <input value={newName} onChange={e => setNewName(e.target.value)} style={{ background: '#fff', border: '2px solid #0056D2', borderRadius: '12px', padding: '8px 40px 8px 12px', fontSize: '18px', fontWeight: '900', width: '100%', outline: 'none' }} />
                  <Check size={18} color="#00C48C" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} onClick={handleNicknameChange} />
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize: '22px', fontWeight: '950', color: '#1c1c1e' }}>{user.name}</h2>
                  <div onClick={() => setIsEditing(true)} style={{ backgroundColor: '#F2F2F7', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><Edit3 size={14} color="#8E8E93" /></div>
                </>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#8E8E93', fontWeight: '600', marginTop: '2px' }}>{user.email}</p>

            {/* 레벨 카드 */}
            <div
              onClick={() => setShowModal('level')}
              style={{ marginTop: '14px', background: 'linear-gradient(135deg, #EBF2FF 0%, #F0FFF8 100%)', borderRadius: '18px', padding: '12px 16px', cursor: 'pointer', border: '1.5px solid #D0E4FF' }}
            >
              {/* 쫐호 + 이모지 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '18px' }}>{levelInfo.emoji}</span>
                  <div>
                    <div style={{ fontSize: '10px', color: '#0056D2', fontWeight: '900', letterSpacing: '0.04em' }}>LV.{levelInfo.level}</div>
                    <div style={{ fontSize: '12px', fontWeight: '900', color: '#1c1c1e', lineHeight: 1.2 }}>{levelInfo.title}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {levelInfo.isMaxLevel ? (
                    <span style={{ fontSize: '10px', fontWeight: '900', color: '#FFD700' }}>MAX LEVEL 🏆</span>
                  ) : (
                    <span style={{ fontSize: '10px', color: '#8E8E93', fontWeight: '700' }}>
                      {levelInfo.expInCurrentLevel} / {levelInfo.expNeededForNext} XP
                    </span>
                  )}
                </div>
              </div>
              {/* 프로그레스 바 */}
              <div style={{ width: '100%', height: '7px', background: 'rgba(0,86,210,0.15)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${levelInfo.progressPct}%`, height: '100%',
                  background: `linear-gradient(90deg, ${levelInfo.color}, #00C48C)`,
                  borderRadius: '4px', transition: 'width 0.6s ease'
                }} />
              </div>
              {/* 다음 레벨 보상 */}
              {levelInfo.nextLevel && (
                <div style={{ fontSize: '10px', color: '#0056D2', fontWeight: '700', marginTop: '6px' }}>
                  LV.{levelInfo.nextLevel.level} 달성 시: {levelInfo.nextLevel.reward || levelInfo.nextLevel.title}
                </div>
              )}
            </div>

            {/* 연속출석 */}
            {(user.streak || 0) > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>🔥</span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#FF5A5F' }}>{user.streak}일 연속 출석 중!</span>
                {(user.streak >= 7) && <span style={{ fontSize: '9px', background: '#FF5A5F', color: '#fff', padding: '2px 6px', borderRadius: '8px', fontWeight: '900' }}>+80 EXP 발동 중</span>}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', backgroundColor: '#F2F2F7', borderRadius: '24px', overflow: 'hidden', marginTop: '24px', border: '1.5px solid #F2F2F7' }}>
           {[
             { label: '조과기록', val: realRecords.length, icon: Trophy, color: '#FF9B26' },
             { label: '팔로워', val: user.followers?.length || 0, icon: Star, color: '#0056D2' },
             { label: '활동픽드', val: realPosts.length, icon: Heart, color: '#FF5A5F' },
             { label: '연속출석', val: `${user.streak || 0}일`, icon: Calendar, color: '#00C48C' },
           ].map(s => (
             <div key={s.label} style={{ backgroundColor: '#fff', padding: '14px 6px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', marginBottom: '4px' }}>
                   <s.icon size={11} color={s.color} fill={s.color} />
                   <span style={{ fontSize: '16px', fontWeight: '950', color: '#1c1c1e' }}>{s.val}</span>
                </div>
                <div style={{ fontSize: '10px', color: '#8E8E93', fontWeight: '700' }}>{s.label}</div>
             </div>
           ))}
        </div>
      </div>

      {/* 🟦 Tabs Switcher 🟦 */}
      <div style={{ display: 'flex', padding: '20px 24px 10px', gap: '24px' }}>
         <div onClick={() => setActiveTab('records')} style={{ fontSize: '18px', fontWeight: '950', color: activeTab === 'records' ? '#1c1c1e' : '#C7C7CC', position: 'relative', cursor: 'pointer' }}>
            기록부 {activeTab === 'records' && <div style={{ position: 'absolute', bottom: '-8px', left: 0, width: '100%', height: '4px', backgroundColor: '#0056D2', borderRadius: '2px' }}></div>}
         </div>
         <div onClick={() => setActiveTab('posts')} style={{ fontSize: '18px', fontWeight: '950', color: activeTab === 'posts' ? '#1c1c1e' : '#C7C7CC', position: 'relative', cursor: 'pointer' }}>
            나의 피드 {activeTab === 'posts' && <div style={{ position: 'absolute', bottom: '-8px', left: 0, width: '100%', height: '4px', backgroundColor: '#0056D2', borderRadius: '2px' }}></div>}
         </div>
         <div onClick={() => setActiveTab('stats')} style={{ fontSize: '18px', fontWeight: '950', color: activeTab === 'stats' ? '#1c1c1e' : '#C7C7CC', position: 'relative', cursor: 'pointer' }}>
            조과통계 {activeTab === 'stats' && <div style={{ position: 'absolute', bottom: '-8px', left: 0, width: '100%', height: '4px', backgroundColor: '#FF9B26', borderRadius: '2px' }}></div>}
         </div>
      </div>

      {/* 🟦 Tab Content 🟦 */}
      <div style={{ padding: '20px 24px' }}>
         {activeTab === 'stats' ? (() => {
           // 어종별 집계
           const speciesMap = {};
           realRecords.forEach(r => {
             const sp = r.species || r.fish || (r.content?.match(/(감성돔|벵에돔|숭어|고등어|참돔|농어|갈치|볼락|우럭|학공치|삼치|방어|광어|도다리|붕어|잉어|배스|쏘가리|민어|청어)/)?.[0]) || '기타';
             speciesMap[sp] = (speciesMap[sp] || 0) + 1;
           });
           const entries = Object.entries(speciesMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
           const max = entries[0]?.[1] || 1;
           const BAR_COLORS = ['#0056D2','#FF9B26','#FF5A5F','#00C48C','#7C3AED','#FFD700'];

           // 월별 조과 추이 집계 (최근 6개월)
           const monthMap = {};
           const now = new Date();
           for (let i = 5; i >= 0; i--) {
             const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
             const key = `${d.getMonth() + 1}월`;
             monthMap[key] = 0;
           }
           realRecords.forEach(r => {
             if (!r.time && !r.createdAt) return;
             const d = new Date(r.time || r.createdAt);
             if (isNaN(d.getTime())) return;
             const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
             if (diff >= 0 && diff < 6) {
               const key = `${d.getMonth() + 1}월`;
               if (key in monthMap) monthMap[key]++;
             }
           });
           const monthEntries = Object.entries(monthMap);
           const maxMonth = Math.max(...monthEntries.map(([, v]) => v), 1);

           // 포인트별 TOP3
           const spotMap = {};
           realRecords.forEach(r => {
             const spot = r.location || r.point || '기타';
             spotMap[spot] = (spotMap[spot] || 0) + 1;
           });
           const topSpots = Object.entries(spotMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

           return (
             <div>
               {/* 개인 하이라이트 카드 */}
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '14px' }}>
                 {[
                   { label: '총 조과', val: realRecords.length, emoji: '📊', color: '#0056D2' },
                   { label: '어종 수', val: entries.length, emoji: '🐟', color: '#FF9B26' },
                   { label: '대표 어종', val: entries[0]?.[0] || '-', emoji: '🏆', color: '#FF5A5F' },
                 ].map(s => (
                   <div key={s.label} style={{ background: '#fff', borderRadius: '16px', padding: '14px 10px', textAlign: 'center', border: '1.5px solid #F2F2F7', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                     <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.emoji}</div>
                     <div style={{ fontSize: '16px', fontWeight: '950', color: s.color, wordBreak: 'keep-all' }}>{s.val}</div>
                     <div style={{ fontSize: '10px', color: '#8E8E93', fontWeight: '700', marginTop: '2px' }}>{s.label}</div>
                   </div>
                 ))}
               </div>

               {/* 월별 조과 추이 */}
               <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', marginBottom: '14px', border: '1.5px solid #F2F2F7', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                 <div style={{ fontSize: '15px', fontWeight: '950', marginBottom: '16px', color: '#1c1c1e' }}>📈 월별 조과 추이</div>
                 {realRecords.length === 0 ? (
                   <p style={{ color: '#8E8E93', fontSize: '13px', fontWeight: '700', textAlign: 'center', padding: '20px 0' }}>조과 기록이 없습니다.</p>
                 ) : (
                   <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px' }}>
                     {monthEntries.map(([month, cnt]) => (
                       <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                         <div style={{ fontSize: '10px', fontWeight: '900', color: '#0056D2' }}>{cnt > 0 ? cnt : ''}</div>
                         <div style={{
                           width: '100%', borderRadius: '6px 6px 0 0',
                           height: `${Math.max((cnt / maxMonth) * 60, cnt > 0 ? 8 : 2)}px`,
                           background: cnt > 0 ? 'linear-gradient(180deg, #0056D2, #42A5F5)' : '#F2F2F7',
                           transition: 'height 0.8s ease',
                           minHeight: '2px',
                         }} />
                         <div style={{ fontSize: '9px', color: '#8E8E93', fontWeight: '700' }}>{month}</div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>

               {/* 어종별 바 차트 */}
               <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', marginBottom: '14px', border: '1.5px solid #F2F2F7', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                 <div style={{ fontSize: '15px', fontWeight: '950', marginBottom: '16px', color: '#1c1c1e' }}>🐟 어종별 조과</div>
                 {entries.length === 0 ? (
                   <p style={{ color: '#8E8E93', fontSize: '13px', fontWeight: '700', textAlign: 'center', padding: '20px 0' }}>조과 기록이 없습니다.</p>
                 ) : entries.map(([sp, cnt], i) => (
                   <div key={sp} style={{ marginBottom: '12px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                       <span style={{ fontSize: '13px', fontWeight: '800', color: '#1c1c1e' }}>{sp}</span>
                       <span style={{ fontSize: '13px', fontWeight: '950', color: BAR_COLORS[i] }}>{cnt}회</span>
                     </div>
                     <div style={{ height: '8px', background: '#F2F2F7', borderRadius: '4px', overflow: 'hidden' }}>
                       <div style={{ height: '100%', width: `${(cnt / max) * 100}%`, background: BAR_COLORS[i], borderRadius: '4px', transition: 'width 0.8s ease' }} />
                     </div>
                   </div>
                 ))}
               </div>

               {/* 단골 포인트 TOP3 */}
               {topSpots.length > 0 && (
                 <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', border: '1.5px solid #F2F2F7', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                   <div style={{ fontSize: '15px', fontWeight: '950', marginBottom: '14px', color: '#1c1c1e' }}>⭐ 단골 포인트 TOP3</div>
                   {topSpots.map(([spot, cnt], i) => (
                     <div key={spot} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: i < topSpots.length - 1 ? '12px' : 0 }}>
                       <div style={{
                         width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                         background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32',
                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                         fontSize: '12px', fontWeight: '900', color: '#fff',
                       }}>{i + 1}</div>
                       <div style={{ flex: 1 }}>
                         <div style={{ fontSize: '13px', fontWeight: '900', color: '#1c1c1e' }}>{spot}</div>
                       </div>
                       <div style={{ fontSize: '13px', fontWeight: '950', color: '#0056D2' }}>{cnt}회</div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           );
         })() : activeTab === 'records' ? (
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              {realRecords.length > 0 ? realRecords.map(r => (
                <div key={r.id} style={{ backgroundColor: '#fff', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', border: '1.5px solid #F2F2F7' }}>
                   {r.image
                     ? <img src={r.image} style={{ width: '100%', height: '140px', objectFit: 'cover' }} alt="" />
                     : <div style={{ width: '100%', height: '140px', background: '#F2F2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>🎣</div>
                   }
                   <div style={{ padding: '14px' }}>
                      <div style={{ fontSize: '11px', color: '#0056D2', fontWeight: '800' }}>{r.time}</div>
                      <div style={{ fontSize: '14px', fontWeight: '900', marginTop: '2px' }}>{r.content.substring(0,20)}...</div>
                   </div>
                </div>
              )) : (
                <div style={{ gridColumn: 'span 2', padding: '40px', textAlign: 'center', color: '#8E8E93' }}>
                   <p style={{ fontSize: '14px', fontWeight: '700' }}>아직 등록된 조과 기록이 없습니다.</p>
                </div>
              )}
              <div onClick={() => navigate('/write')} style={{ height: '190px', borderRadius: '28px', border: '2px dashed #D1D1D6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#8E8E93', cursor: 'pointer' }}>
                 <Camera size={24} /><span style={{ fontSize: '13px', fontWeight: '800' }}>기록 추가</span>
              </div>
           </div>
         ) : (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {realPosts.length > 0 ? realPosts.map(p => (
                <div key={p.id} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '28px', border: '1.5px solid #F2F2F7' }}>
                   <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: '600', marginBottom: '8px' }}>{p.time}</div>
                   <p style={{ fontSize: '14px', fontWeight: '700', color: '#1c1c1e', margin: '0 0 16px' }}>{p.content}</p>
                   <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#8e8e93', fontWeight: '700' }}><Heart size={14} color="#FF5A5F" /> {p.likes}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#8e8e93', fontWeight: '700' }}><MessageSquare size={14} /> {p.comments.length}</div>
                   </div>
                </div>
              )) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#8E8E93' }}>
                   <p style={{ fontSize: '14px', fontWeight: '700' }}>등록된 게시글이 없습니다.</p>
                </div>
              )}
           </div>
         )}
      </div>

      {/* 🟦 비즈니스 파트너 센터 (BUSINESS LITE/PRO/VIP 한정) 🟦 */}
      {canAccessPartnerCenter && (
        <div className="fade-in" style={{ padding: '10px 24px 20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '950', marginBottom: '14px', color: '#1A1A2E', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>👑</span> 비즈니스 파트너 센터
          </h3>
          <div style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #2A2A4A 100%)', borderRadius: '28px', padding: '24px', color: '#fff', boxShadow: '0 12px 30px rgba(26,26,46,0.2)' }}>
            
            {/* 1. 예약 현황 */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '18px', borderRadius: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: '#FFD700', fontWeight: '900', marginBottom: '6px', letterSpacing: '0.02em' }}>실시간 예약 현황</div>
                <div style={{ fontSize: '17px', fontWeight: '950', letterSpacing: '-0.02em' }}>신규 예약 문의 <span style={{ color: '#00C48C' }}>3건</span></div>
              </div>
              <button style={{ backgroundColor: '#FFD700', color: '#1A1A2E', border: 'none', padding: '12px 18px', borderRadius: '14px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,215,0,0.3)', transition: 'transform 0.15s' }}>
                연락처 확인
              </button>
            </div>

            {/* 2. 조과 타임라인 & 상품 관리 액션 버튼 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '18px', borderRadius: '20px', cursor: 'pointer' }}>
                <Camera size={26} color="#00C48C" style={{ marginBottom: '10px' }} />
                <div style={{ fontSize: '14.5px', fontWeight: '900', marginBottom: '6px' }}>조과 갤러리 등록</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4', fontWeight: '600' }}>홈 화면 '대박 선박'에 자동 노출되어 홍보됩니다.</div>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '18px', borderRadius: '20px', cursor: 'pointer' }}>
                <CardIcon size={26} color="#FFD700" style={{ marginBottom: '10px' }} />
                <div style={{ fontSize: '14.5px', fontWeight: '900', marginBottom: '6px' }}>승선권/상품 관리</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4', fontWeight: '600' }}>승선권 스케줄 조정 및 판매 비품을 추가합니다.</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 🟦 Settings Section 🟦 */}
      {/* ── 마스터 전용 관리 패널 ── */}
      {isAdmin && (
        <div style={{ padding: '0 24px 16px' }}>
          <div style={{ background: 'linear-gradient(135deg, #0A0F1C, #1A2340)', borderRadius: '20px', padding: '16px 18px', border: '1.5px solid rgba(255,215,0,0.25)' }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,215,0,0.7)', fontWeight: '900', letterSpacing: '0.1em', marginBottom: '12px' }}>⚙️ MASTER ADMIN</div>
            <button
              onClick={() => navigate('/cctv-admin')}
              style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#fff', textAlign: 'left' }}
            >
              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #FFD700, #FFA000)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '18px' }}>📺</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#FFD700' }}>CCTV 채널 관리</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginTop: '2px' }}>지역별 YouTube ID 직접 수정 · 미리보기</div>
              </div>
              <ChevronRight size={16} color="#FFD700" />
            </button>
            {/* 비밀포인트 위치 수정 버튼 */}
            <button
              onClick={() => navigate('/secret-admin')}
              style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#fff', textAlign: 'left', marginTop: '8px' }}
            >
              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #FF6B35, #E60000)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '18px' }}>⭐</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#FFD700' }}>비밀포인트 위치 수정</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginTop: '2px' }}>주소 검색으로 정확한 좌표 직접 지정</div>
              </div>
              <ChevronRight size={16} color="#FFD700" />
            </button>
            {/* 수익 대시보드 버튼 */}
            <button
              onClick={() => navigate('/admin-dashboard')}
              style={{ width: '100%', padding: '14px 16px', background: 'rgba(0,196,140,0.1)', border: '1px solid rgba(0,196,140,0.3)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#fff', textAlign: 'left', marginTop: '8px' }}
            >
              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #00C48C, #00897B)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '18px' }}>📊</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#00C48C' }}>수익 대시보드</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginTop: '2px' }}>월 매출 · 플랜별 구독자 · 최근 결제내역</div>
              </div>
              <ChevronRight size={16} color="#00C48C" />
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: '10px 24px 40px' }}>
         <div style={{ backgroundColor: '#fff', borderRadius: '28px', overflow: 'hidden', border: '1.5px solid #F2F2F7' }}>
            {menuItems.map((item) => ( // ✅ 26TH-C3: key를 item.id로 교체 (17TH-B2 패턴 — MENU_ITEMS는 외부 상수로 인덱스 연속성 보장됨)
              <div key={item.id} onClick={() => item.id === 'history' ? navigate('/payment-history') : setShowModal(item.id)} style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: item.id !== 'security' ? '1px solid #F8F9FA' : 'none', cursor: 'pointer' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ backgroundColor: `${item.color}15`, padding: '10px', borderRadius: '12px' }}><item.icon size={20} color={item.color} strokeWidth={2.5} /></div>
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: '850', color: '#1c1c1e' }}>{item.title}</div>
                        <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: '600' }}>{item.desc}</div>
                    </div>
                 </div>
                 <ChevronRight size={18} color="#C7C7CC" />
              </div>
            ))}
         </div>
         <button 
           onClick={handleLogout} 
           style={{ 
             width: '100%', padding: '20px', 
             background: user?.id === 'GUEST' ? '#0056D2' : 'transparent', 
             color: user?.id === 'GUEST' ? '#fff' : '#FF5A5F', 
             border: user?.id === 'GUEST' ? 'none' : '2px solid #FF5A5F22', 
             borderRadius: '24px', fontWeight: '900', fontSize: '16px', marginTop: '24px',
             boxShadow: user?.id === 'GUEST' ? '0 8px 20px rgba(0,86,210,0.3)' : 'none'
           }}
         >
           {user?.id === 'GUEST' ? '회원가입 / 로그인 하러가기' : '로그아웃'}
         </button>
      </div>

      {/* 🟦 Settings Modals (Bottom Sheets) 🟦 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowModal(null)}>
           <div style={{ width: '100%', maxWidth: '480px', backgroundColor: '#fff', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '32px 24px 60px', borderRadius: 'inherit', animation: 'slideUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
              <div style={{ width: '40px', height: '5px', background: '#E5E5EA', borderRadius: '3px', margin: '0 auto 24px' }}></div>
              
              {showModal === 'noti' && (
                <>
                  <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '24px' }}>알림 설정</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {[
                        { key: 'flow', label: '물때 및 피딩 타임 알림', icon: History },
                        { key: 'bait', label: '실시간 미끼 추천 알림', icon: Trophy },
                        { key: 'comm', label: '커뮤니티 댓글 알림', icon: MessageSquare }
                    ].map(n => (
                        <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <n.icon size={18} color="#8E8E93" /><span style={{ fontSize: '15px', fontWeight: '750' }}>{n.label}</span>
                            </div>
                            <div onClick={() => handleToggleNoti(n.key)} style={{ cursor: 'pointer' }}>
                                {notiSetting[n.key] ? <ToggleRight size={32} color="#0056D2" fill="#0056D2" /> : <ToggleLeft size={32} color="#E5E5EA" />}
                            </div>
                        </div>
                    ))}
                  </div>
                </>
              )}

              {showModal === 'premium' && (() => {
                const planNames = {
                  FREE: '무료',
                  BUSINESS_LITE: 'Business Lite',
                  PRO: 'PRO',
                  BUSINESS_VIP: 'Business VIP',
                };
                const isFree = userTier === 'FREE';
                const PLANS = [
                  {
                    tier: 'FREE',
                    name: '무료',
                    price: '₩0',
                    badge: null,
                    badgeColor: null,
                    badgeBg: null,
                    features: ['낚시 포인트 검색', '커뮤니티 열람', '조과 기록 등록', '게시글 등록 시 광고 시청 필요'],
                    highlight: false,
                  },
                  {
                    tier: 'BUSINESS_LITE',
                    name: 'Business Lite',
                    price: '₩9,900/월',
                    badge: 'LITE',
                    badgeColor: '#1A1A2E',
                    badgeBg: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)',
                    features: ['무료 기능 전체 포함', '게시글·크루 등록 시 광고 없음', 'CCTV · 히트맵 · 비밀 포인트 열람', '비즈니스 파트너 센터 이용'],
                    highlight: false,
                  },
                  {
                    tier: 'PRO',
                    name: 'PRO',
                    price: '₩110,000/월',
                    badge: 'PRO',
                    badgeColor: '#fff',
                    badgeBg: 'linear-gradient(135deg, #0056D2, #003fa3)',
                    features: ['Lite 기능 전체 포함', '선상 홍보글 작성 가능', '조과 갤러리 우선 노출', '전담 PRO 고객지원'],
                    highlight: true,
                  },
                  {
                    tier: 'BUSINESS_VIP',
                    name: 'Business VIP',
                    price: '₩550,000/월',
                    badge: '👑 VVIP',
                    badgeColor: '#5C3A00',
                    badgeBg: 'linear-gradient(135deg, #FFD700, #FF9B26)',
                    features: ['PRO 기능 전체 포함', '항구 독점 상단 고정 광고', 'VIP 전용 1:1 운영자 채널', '월별 정산 리포트 제공'],
                    highlight: false,
                    exclusive: true,
                  },
                ];
                return (
                  <>
                    <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '4px' }}>구독 관리</h3>
                    <p style={{ fontSize: '12px', color: '#8E8E93', fontWeight: '600', marginBottom: '20px' }}>
                      현재 플랜: <strong style={{ color: '#0056D2' }}>{planNames[userTier] || '무료'}</strong>
                      {!isFree && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#FF5A5F' }}>· 구독 중</span>}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                      {PLANS.map(plan => {
                        const isActive = userTier === plan.tier;
                        return (
                          <div key={plan.tier}
                            onClick={() => handleTierChange(plan.tier, plan.name)}
                            style={{
                              padding: '16px 18px', borderRadius: '18px', cursor: 'pointer',
                              border: isActive ? '2px solid #0056D2' : plan.highlight ? '2px solid #0056D230' : '1.5px solid #F0F0F0',
                              background: isActive ? '#EBF2FF' : plan.highlight ? 'linear-gradient(135deg, #F0F5FF, #E8F0FF)' : '#fff',
                              transition: 'all 0.15s',
                              position: 'relative',
                            }}
                          >
                            {plan.highlight && !isActive && (
                              <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #0056D2, #003fa3)', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '3px 12px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                                인기 플랜
                              </div>
                            )}
                            {plan.exclusive && !isActive && (
                              <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #FFD700, #FF9B26)', color: '#5C3A00', fontSize: '10px', fontWeight: '900', padding: '3px 14px', borderRadius: '20px', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(255,215,0,0.5)' }}>
                                항구 · 지역별 선착순 1명
                              </div>
                            )}
                            {plan.exclusive && isActive && (
                              <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #FFD700, #FF9B26)', color: '#5C3A00', fontSize: '10px', fontWeight: '900', padding: '3px 14px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                                항구 지역 독점 활성 중
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                                  {plan.badge && (
                                    <span style={{ fontSize: '9px', fontWeight: '900', padding: '2px 7px', borderRadius: '8px', background: plan.badgeBg, color: plan.badgeColor }}>{plan.badge}</span>
                                  )}
                                  <span style={{ fontSize: '15px', fontWeight: '900', color: '#1c1c1e' }}>{plan.name}</span>
                                  {isActive && <span style={{ fontSize: '10px', color: '#0056D2', fontWeight: '800' }}>✓ 현재</span>}
                                </div>
                                <ul style={{ margin: 0, padding: '0 0 0 4px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                  {plan.features.map((f, i) => (
                                    <li key={i} style={{ fontSize: '11px', color: '#555', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                      <span style={{ color: '#0056D2', fontSize: '10px' }}>✓</span> {f}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '900', color: isActive ? '#0056D2' : '#1c1c1e', whiteSpace: 'nowrap' }}>{plan.price}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <p style={{ fontSize: '11px', color: '#AEAEB2', textAlign: 'center', fontWeight: '600' }}>
                      * 일반 피드 광고는 플랜과 무관하게 표시됩니다.<br/>
                      * 유료 플랜은 게시글·크루 등록 시 광고 시청이 면제됩니다.
                    </p>
                  </>
                );
              })()}


              {showModal === 'security' && (
                <>
                  <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '24px' }}>보안 및 차단 설정</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* 비밀번호 변경 탭 */}
                    <div 
                      onClick={() => setSecTab(secTab === 'pwd' ? null : 'pwd')} 
                      style={{ padding: '18px', border: '1px solid #F0F0F0', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: secTab === 'pwd' ? '#F8F9FA' : '#fff' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Lock size={18} color="#8E8E93" /><span style={{ fontWeight: '750' }}>비밀번호 변경</span></div>
                        <ChevronRight size={18} color="#C7C7CC" style={{ transform: secTab === 'pwd' ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                    </div>
                    {secTab === 'pwd' && (
                      <div style={{ padding: '16px', background: '#F8F9FA', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input type="password" placeholder="현재 비밀번호" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D1D6', outline: 'none' }} />
                        <input type="password" placeholder="새 비밀번호" value={newPwd} onChange={e => setNewPwd(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D1D6', outline: 'none' }} />
                        <button onClick={handlePasswordChange} style={{ padding: '12px', background: '#0056D2', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>변경하기</button>
                      </div>
                    )}

                    {/* 차단 사용자 관리 탭 */}
                    <div 
                      onClick={() => setSecTab(secTab === 'block' ? null : 'block')} 
                      style={{ padding: '18px', border: '1px solid #F0F0F0', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: secTab === 'block' ? '#F8F9FA' : '#fff' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><ShieldAlert size={18} color="#8E8E93" /><span style={{ fontWeight: '750' }}>차단 사용자 관리</span></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', color: '#FF5A5F', fontWeight: '800' }}>{blockedUsers.length}명</span>
                          <ChevronRight size={18} color="#C7C7CC" style={{ transform: secTab === 'block' ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                        </div>
                    </div>
                    {secTab === 'block' && (
                      <div style={{ padding: '16px', background: '#F8F9FA', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input placeholder="차단할 닉네임 입력" value={blockName} onChange={e => setBlockName(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #D1D1D6', outline: 'none' }} />
                          <button onClick={handleBlockUser} style={{ padding: '12px 16px', background: '#1c1c1e', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>차단</button>
                        </div>
                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {blockedUsers.map(bu => (
                            <div key={bu} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #F0F0F0' }}>
                              <span style={{ fontSize: '14px', fontWeight: '700' }}>{bu}</span>
                              <button onClick={() => handleUnblockUser(bu)} style={{ padding: '6px 10px', fontSize: '12px', background: '#FF5A5F15', color: '#FF5A5F', border: 'none', borderRadius: '6px', fontWeight: '800', cursor: 'pointer' }}>해제</button>
                            </div>
                          ))}
                          {blockedUsers.length === 0 && <div style={{ fontSize: '12px', color: '#8E8E93', textAlign: 'center', padding: '10px' }}>차단한 사용자가 없습니다.</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              <button onClick={() => setShowModal(null)} style={{ width: '100%', marginTop: '32px', padding: '18px', background: '#1c1c1e', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '16px' }}>닫기</button>
           </div>
        </div>
      )}
    </div>
  );
}
