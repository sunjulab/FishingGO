import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/index';
import { compressAvatar } from '../utils/imageUtils';
import { useUserStore, TIER_CONFIG, getLevelInfo, EXP_REWARDS } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import { 
  BookOpen, MapPin, Calendar, Scale, Settings, Bell, CreditCard, 
  ShieldAlert, ChevronRight, LayoutGrid, Edit3, Check, X, 
  Trophy, Star, Heart, MessageSquare, Camera, History,
  ToggleLeft, ToggleRight, Lock, CreditCard as CardIcon
} from 'lucide-react';

export default function MyPage() {
  const navigate = useNavigate();
  const { user, updateUser, logout, canAccessBusinessShop, userTier } = useUserStore();
  const addToast = useToastStore((state) => state.addToast);
  const canAccessPartnerCenter = canAccessBusinessShop();
  const fileInputRef = useRef(null);
  const isAdmin = user?.id === 'sunjulab' || user?.email === 'sunjulab' || user?.name === 'sunjulab';
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

  // 설정 대시보드 상태
  const [notiSetting, setNotiSetting] = useState(user?.notiSettings || { flow: true, bait: true, comm: true });

  // 보안 대시보드 상태
  const [secTab, setSecTab] = useState(null); // 'pwd', 'block'
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [blockName, setBlockName] = useState('');
  const [blockedUsers, setBlockedUsers] = useState(user?.blockedUsers || []);

  const handlePasswordChange = async () => {
    if (!currentPwd || !newPwd) return addToast('비밀번호를 입력해주세요.', 'error');
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
      console.warn('[tierChange 서버 동기화 실패]', err.response?.data || err.message);
      // 서버 동기화 실패해도 로컬 변경은 이미 반영됨 — 토스트 없음
    }
  };

  const handleToggleNoti = async (key) => {
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
      setNotiSetting(notiSetting); // 롤백
      updateUser({ notiSettings: notiSetting });
    }
  };

  const nextLevelExp = user?.level ? user.level * 100 : 100;
  const expPercentage = user?.exp ? (user.exp / nextLevelExp) * 100 : 0;

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [postsRes, recordsRes] = await Promise.all([
        apiClient.get(`/api/user/posts?email=${user?.email || 'guest'}`),
        apiClient.get(`/api/user/records?email=${user?.email || 'guest'}`)
      ]);
      setRealPosts(postsRes.data);
      setRealRecords(recordsRes.data);
    } catch (err) {
      console.error('Failed to fetch my activity', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNicknameChange = async () => {
    const nicknameRegex = /^[a-zA-Z0-9가-힣]+$/;
    if (!nicknameRegex.test(newName)) {
      addToast('한글, 영어, 숫자만 사용 가능합니다.', 'error');
      return;
    }
    try {
      const res = await apiClient.post(`/api/user/nickname`, {
        email: user.email, newNickname: newName
      });
      if (res.data.success) {
        updateUser({ name: res.data.name });
        setIsEditing(false);
        addToast('닉네임이 성공적으로 변경되었습니다.', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.error || '서버 연결 실패', 'error');
    }
  };

  /* ── 프로필 사진 변경 ── */
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
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

        // email 기반 별도 키로 저장 → 로그아웃 후에도 유지됨
        try {
          const stored = JSON.parse(localStorage.getItem('user') || '{}');
          stored.avatar = base64;
          stored.picture = base64;
          localStorage.setItem('user', JSON.stringify(stored));
          if (user?.email) {
            localStorage.setItem(`avatar_${user.email}`, base64);
          }
        } catch(e) {}

        try {
          const res = await apiClient.post('/api/user/avatar', {
            email: user.email,
            avatar: base64
          });
          if (res.data.success) {
            addToast('프로필 사진이 저장되었습니다! 📸', 'success');
          }
        } catch (err) {
          console.error('Avatar server error:', err);
          // 서버 저장 실패해도 로컬은 이미 반영됨 → 성공 안내
          addToast('📸 프로필 사진이 변경되었습니다! (로컬 저장)', 'success');
        }
      } catch (compressErr) {
        console.error('이미지 압축 실패:', compressErr);
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

  const menuItems = [
    { id: 'noti', icon: Bell, title: '알림 설정', color: '#0056D2', desc: '물때 및 커뮤니티 알림' },
    { id: 'premium', icon: CreditCard, title: '프리미엄 구독 관리', color: '#FF9B26', desc: '포인트 및 구독권 요금' },
    { id: 'security', icon: ShieldAlert, title: '보안 및 차단 설정', color: '#FF5A5F', desc: '계정 보안 및 차단 목록' }
  ];

  return (
    <div className="page-container" style={{ backgroundColor: '#F8F9FA', paddingBottom: '120px' }}>
      {/* 🟦 Top Profile Card 🟦 */}
      <div style={{ background: 'linear-gradient(180deg, #fff 0%, #F8F9FA 100%)', padding: '40px 24px 30px', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {/* 프로필 사진 + 수정 버튼 */}
          <div
            style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
            onClick={() => fileInputRef.current?.click()}
            title="사진 변경"
          >
            <img
              src={user.avatar || user.picture || 'https://i.pravatar.cc/150?img=11'}
              alt="P"
              style={{ width: '100px', height: '100px', borderRadius: '35px', objectFit: 'cover', border: '4px solid #fff', boxShadow: '0 15px 30px rgba(0,86,210,0.1)', transition: 'filter 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.75)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
            />
            {/* 카메라 오버레이 */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '35px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0)', transition: 'background 0.2s',
              pointerEvents: 'none',
            }}>
              <Camera size={26} color="#fff" style={{ opacity: 0, transition: 'opacity 0.2s' }}
                ref={el => {
                  if (el) {
                    el.closest('div[title="사진 변경"]')?.addEventListener('mouseenter', () => { el.style.opacity = '1'; el.parentElement.style.background = 'rgba(0,0,0,0.35)'; });
                    el.closest('div[title="사진 변경"]')?.addEventListener('mouseleave', () => { el.style.opacity = '0'; el.parentElement.style.background = 'rgba(0,0,0,0)'; });
                  }
                }}
              />
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
      </div>

      {/* 🟦 Tab Content 🟦 */}
      <div style={{ padding: '20px 24px' }}>
         {activeTab === 'records' ? (
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              {realRecords.length > 0 ? realRecords.map(r => (
                <div key={r.id} style={{ backgroundColor: '#fff', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', border: '1.5px solid #F2F2F7' }}>
                   <img src={r.image} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
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
          </div>
        </div>
      )}

      <div style={{ padding: '10px 24px 40px' }}>
         <div style={{ backgroundColor: '#fff', borderRadius: '28px', overflow: 'hidden', border: '1.5px solid #F2F2F7' }}>
            {menuItems.map((item, idx) => (
              <div key={idx} onClick={() => setShowModal(item.id)} style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx === menuItems.length - 1 ? 'none' : '1px solid #F8F9FA', cursor: 'pointer' }}>
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
