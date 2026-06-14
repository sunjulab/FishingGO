import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/index';
import { compressAvatar } from '../utils/imageUtils';
import { useUserStore, TIER_CONFIG, getLevelInfo, EXP_REWARDS, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import { AdSenseDisplay } from '../components/ads/AdSenseAd';
import { 
  BookOpen, MapPin, Calendar, Scale, Settings, Bell, CreditCard, 
  ShieldAlert, ChevronRight, LayoutGrid, Edit3, Check, X, 
  Trophy, Star, Heart, MessageSquare, Camera, History, Target, Moon,
  ToggleLeft, ToggleRight, Lock, CreditCard as CardIcon, Users
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
const DEFAULT_NOTI = { score: true, comm: true, chat: true, nightMode: true };

// ✅ TIER-PROTECT: 티어 우선순위 맵 (0=무료, 4=마스터) — 컨포넌트 외부 상수
const TIER_RANK_CLIENT = { FREE: 0, BUSINESS_LITE: 1, PRO: 2, BUSINESS_VIP: 3, MASTER: 4 };
const PROTECTED_TIERS_CLIENT = ['PRO', 'BUSINESS_VIP', 'MASTER'];


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
  // - user.id === 'sunjulab.k' (서버 buildUserResponse가 MASTER 계정에 반환하는 resolved id)
  // - user.email === 'sunjulab.k' (마스터 계정 이메일)
  // - user.email === 'sunjulab.k@gmail.com' (구글 소셜 로그인)
  // - userTier === 'MASTER' (tier 서버에서 MASTER로 설정된 경우)
  const isAdmin = useUserStore(s =>
    s.user?.id === ADMIN_ID ||
    s.user?.email === ADMIN_EMAIL ||
    s.user?.email === 'sunjulab.k@gmail.com' ||
    s.userTier === 'MASTER'
  );

  const tierBadge = isAdmin ? TIER_CONFIG.MASTER : (TIER_CONFIG[userTier] || TIER_CONFIG.FREE);
  // ✅ FIX-VVIP-BADGE: VVIP는 항구명 포함 동적 label (user.vvipHarborName은 buildUserResponse에서 주입됨)
  const tierBadgeLabel = (userTier === 'BUSINESS_VIP' && user?.vvipHarborName)
    ? '\u{1F451} VVIP ' + user.vvipHarborName
    : tierBadge.label;
  const levelInfo  = getLevelInfo(user?.totalExp || 0);
  
  const [activeTab, setActiveTab] = useState('records');
  const [showModal, setShowModal] = useState(null); // 'noti', 'premium', 'security', 'level'
  
  const [realPosts, setRealPosts] = useState([]);
  const [realRecords, setRealRecords] = useState([]);
  // ✅ CREW-ENH: 내 크루 목록
  const [myCrews, setMyCrews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leavingCrewId, setLeavingCrewId] = useState(null); // 탈퇴 로딩 크루 ID

  // ✅ FOLLOW-ENH: 팔로워/팔로잉 모달 상태
  const [followModal, setFollowModal] = useState(null);
  const [followList, setFollowList]   = useState([]);
  const [followLoading, setFollowLoading] = useState(false);

  // ✅ BIZ-ENH: 비즈니스 파트너 센터 상태
  const [bizPhoneModal, setBizPhoneModal]       = useState(false);  // 연락처 확인 모달
  const [bizPhone, setBizPhone]                 = useState({ phone: '', shipName: '' });
  const [galleryModal, setGalleryModal]         = useState(false);  // 조과 갤러리 등록 모달
  const [galleryForm, setGalleryForm]           = useState({ fish: '', size: '', weight: '', location: '', memo: '', image: null });
  const [gallerySubmitting, setGallerySubmitting] = useState(false);
  const [myBizPosts, setMyBizPosts]             = useState([]);     // 내 선박 홍보글 목록
  const [bizPostsModal, setBizPostsModal]       = useState(false);  // 내 선박 홍보글 모달
  const [bizPostsLoading, setBizPostsLoading]   = useState(false);
  const [deletingBizId, setDeletingBizId]       = useState(null);
  const galleryFileRef = useRef(null);
  const isMountedRef = useRef(true); // ✅ BUG-M2 FIX: FileReader async 콜백 언마운트 체크용

  // ✅ BUG-M2: 언마운트 cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ✅ LEGAL-FETCH: 마운트 시 법적고지 불러오기 (서버 → localStorage → 기본값 순서)
  useEffect(() => {
    let cancelled = false;
    const LS_KEY = 'fishinggo_legal_info';
    const LS_PENDING_KEY = 'fishinggo_legal_pending'; // 서버 미동기 플래그
    const DEFAULT_LEGAL_CLIENT = [
      { label: '상호명',         key: 'company',  value: '선제이유랩 (SUN J.U. Lab)' },
      { label: '대표자',         key: 'ceo',      value: '김승철' },
      { label: '사업자등록번호', key: 'bizNo',    value: '865-10-03351' },
      { label: '사업장 주소',    key: 'address',  value: '강원특별자치도 강릉시 노가니남길 25, 202동 405호' },
      { label: '업태/종목',      key: 'bizType',  value: '정보통신업 · 전자상거래 소매업' },
      { label: '고객센터 이메일',key: 'email',    value: 'sunjulab.a1@gmail.com' },
      { label: '통신판매업',     key: 'salesReg', value: '신고 준비 중' },
    ];
    // ✅ LEGAL-LS: localStorage 캐시 먼저 확인
    let lsItems = null;
    let hasPending = false;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) lsItems = JSON.parse(raw);
      hasPending = localStorage.getItem(LS_PENDING_KEY) === 'true';
    } catch {}
    apiClient.get('/api/legal-info')
      .then(async r => {
        if (cancelled) return;
        // ✅ AUTO-SYNC: 서버 복구 + 미동기 로컬 데이터 있으면 자동 push
        const isAdminUser = useUserStore.getState().userTier === 'MASTER' ||
          useUserStore.getState().user?.id === 'sunjulab.k';
        if (hasPending && lsItems && isAdminUser) {
          try {
            await apiClient.put('/api/admin/legal-info', { items: lsItems });
            localStorage.removeItem(LS_PENDING_KEY);
            // DB 저장 성공 후 서버 최신값 사용
            const items = lsItems;
            try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
            if (!cancelled) { setLegalInfo(items); setLegalDraft(items); }
            return;
          } catch { /* 자동 동기화 실패 시 서버 값 사용 */ }
        }
        const items = r.data?.items?.length ? r.data.items : (lsItems || DEFAULT_LEGAL_CLIENT);
        try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
        if (!cancelled) { setLegalInfo(items); setLegalDraft(items); }
      })
      .catch(() => {
        // 서버 실패 → localStorage or 기본값
        if (!cancelled) {
          const items = lsItems || DEFAULT_LEGAL_CLIENT;
          setLegalInfo(items); setLegalDraft(items);
        }
      })
      .finally(() => { if (!cancelled) setLegalLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [error, setError] = useState('');

  // 설정 대시보드 상태 — 안전한 기본값으로 초기화 후 user 로드 시 동기화
  const [notiSetting, setNotiSetting] = useState(DEFAULT_NOTI);
  // ✅ FONT-SCALE: 리렌더 트리거용 (CSS 변수 변경 후 활성 버튼 상태 즉시 반영)
  const [fontScale, setFontScale] = useState(() => localStorage.getItem('fishinggo_fs') || '1');

  // ✅ LEGAL-EDIT: 사업자 법적고지 — localStorage 저장/불러오기 (마스터 수정 가능)
  const DEFAULT_LEGAL = [
    { label: '상호명',         key: 'company',    value: '선제이유랩 (SUN J.U. Lab)' },
    { label: '대표자',         key: 'ceo',        value: '김승철' },
    { label: '사업자등록번호', key: 'bizNo',      value: '865-10-03351' },
    { label: '사업장 주소',    key: 'address',    value: '강원특별자치도 강릉시 노가니남길 25, 202동 405호' },
    { label: '업태/종목',      key: 'bizType',    value: '정보통신업 · 전자상거래 소매업' },
    { label: '고객센터 이메일',key: 'email',      value: 'sunjulab.a1@gmail.com' },
    { label: '통신판매업',     key: 'salesReg',   value: '신고 준비 중' },
  ];
  const [legalInfo,    setLegalInfo]    = useState([]);
  const [legalLoading, setLegalLoading] = useState(true);
  const [editingLegal, setEditingLegal] = useState(false);
  const [legalDraft,   setLegalDraft]   = useState([]);
  const [legalSaving,  setLegalSaving]  = useState(false);

  // NEW-B3: 카메라 오버레이 hover 상태 — DOM 직접 조작 anti-pattern 제거
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);

  // 보안 대시보드 상태
  const [secTab, setSecTab] = useState(null); // 'pwd', 'block'
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState(''); // ✅ PWD-CONFIRM: 새 비밀번호 확인
  const [blockName, setBlockName] = useState('');
  const [blockedUsers, setBlockedUsers] = useState([]);

  const handlePasswordChange = async () => {
    if (!currentPwd || !newPwd.trim()) return addToast('비밀번호를 입력해주세요.', 'error');
    if (newPwd.trim().length < 8) return addToast('새 비밀번호는 8자 이상이어야 합니다.', 'error');
    if (currentPwd === newPwd.trim()) return addToast('새 비밀번호는 현재 비밀번호와 다른 것으로 설정해주세요.', 'error');
    // ✅ PWD-CONFIRM: 새 비밀번호 2회 입력 일치 검증
    if (newPwd.trim() !== confirmPwd.trim()) return addToast('새 비밀번호가 일치하지 않습니다. 다시 확인해주세요.', 'error');
    try {
      const res = await apiClient.put('/api/user/password', { email: user.email, currentPassword: currentPwd, newPassword: newPwd });
      if (res.data.success) {
        addToast('비밀번호가 성공적으로 변경되었습니다.', 'success');
        setSecTab(null);
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd(''); // ✅ PWD-CONFIRM: 확인 입력 초기화
      } else {
        // ✅ BUG-M3 FIX: success=false 또는 필드 없을 때 무음 실패 방지
        addToast(res.data?.error || '비밀번호 변경에 실패했습니다.', 'error');
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

  // ✅ TIER-PROTECT: TIER_RANK_CLIENT / PROTECTED_TIERS_CLIENT는 파일 상단 외부 상수 사용 (중복 선언 제거)

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

    // ✅ TIER-PROTECT: 유료 구독 중 다운그레이드 차단
    const currentRank = TIER_RANK_CLIENT[userTier] ?? 0;
    const targetRank  = TIER_RANK_CLIENT[tier] ?? 0;
    if (PROTECTED_TIERS_CLIENT.includes(userTier) && targetRank < currentRank) {
      addToast(
        `현재 ${userTier === 'BUSINESS_VIP' ? 'Business VIP' : userTier} 구독 중입니다.\n구독 해지는 고객센터를 통해 진행해주세요.`,
        'error'
      );
      return;
    }

    // 서버에 변경 요청 (먼저 서버 확인, 성공 시 로컬 반영)
    try {
      const identifier = user.email || user.id;
      const res = await apiClient.put('/api/user/tier', { email: identifier, tier });
      if (res.data.success) {
        const confirmedTier = res.data.tier || tier;
        // ✅ FIX-MED: setUserTier 제거 → updateUser 단일 원자 호출 (user.tier + userTier 동시 갱신)
        updateUser({ tier: confirmedTier });
        addToast(`${name} 플랜으로 변경됐습니다.`, 'success');
        setShowModal(null);
      }
    } catch (err) {
      const serverMsg = err.response?.data?.error;
      const serverTier = err.response?.data?.currentTier;
      if (err.response?.status === 403) {
        // 서버가 다운그레이드 거부 → 로컬 tier를 서버 기준으로 강제 복원
        if (serverTier) {
          // ✅ FIX-MED: setUserTier 제거 → updateUser 단일 원자 호출 (user.tier + userTier 동시 갱신)
          updateUser({ tier: serverTier });
        }
        addToast(serverMsg || '구독 변경이 차단되었습니다.', 'error');
      } else {
        addToast(serverMsg || '플랜 변경 중 오류가 발생했습니다.', 'error');
      }
      if (!import.meta.env.PROD) console.warn('[tierChange 실패]', err.response?.data || err.message);
    }
  };

  // ✅ FOLLOW-ENH: 팔로워/팔로잉 목록 모달 열기
  const handleOpenFollowModal = async (type) => {
    if (!user?.email) return;
    setFollowList([]);
    setFollowModal(type);
    setFollowLoading(true);
    try {
      const endpoint = type === 'followers' ? '/api/user/followers' : '/api/user/following';
      const res = await apiClient.get(`${endpoint}?email=${encodeURIComponent(user.email)}`);
      const list = type === 'followers' ? (res.data.followers || []) : (res.data.following || []);
      if (!isMountedRef.current) return; // ✅ BUG-MY02 FIX
      setFollowList(list);
    } catch (err) {
      if (!isMountedRef.current) return; // ✅ BUG-MY02 FIX
      addToast('목록을 불러오는 데 실패했습니다.', 'error');
      setFollowModal(null);
    } finally {
      if (isMountedRef.current) setFollowLoading(false); // ✅ BUG-MY02 FIX
    }
  };

  // ✅ BIZ-ENH: 연락처 확인 — 내 선박 등록 전화번호 조회
  const handleOpenBizPhone = async () => {
    try {
      const res = await apiClient.get('/api/business/my-phone');
      if (!isMountedRef.current) return; // BUG-MY03 FIX
      setBizPhone(res.data);
      setBizPhoneModal(true);
    } catch { addToast('연락처 정보를 불러오지 못했습니다.', 'error'); }
  };

  // ✅ BIZ-ENH: 내 선박 홍보글 목록 조회
  const handleOpenBizPosts = async () => {
    setBizPostsLoading(true);
    setBizPostsModal(true);
    try {
      const res = await apiClient.get('/api/business/my-posts');
      if (!isMountedRef.current) return; // BUG-MY03 FIX
      setMyBizPosts(Array.isArray(res.data) ? res.data : []);
    } catch { addToast('홍보글을 불러오지 못했습니다.', 'error'); }
    finally { setBizPostsLoading(false); }
  };

  // ✅ BIZ-ENH: 비즈니스 게시글 삭제
  const handleDeleteBizPost = async (id) => {
    if (!window.confirm('홍보글을 삭제하시겠습니까?')) return;
    setDeletingBizId(id);
    try {
      await apiClient.delete(`/api/business/posts/${id}`);
      setMyBizPosts(prev => prev.filter(p => String(p._id || p.id) !== String(id)));
      addToast('홍보글이 삭제되었습니다.', 'success');
    } catch (err) { addToast(err.response?.data?.error || '삭제 실패', 'error'); }
    finally { setDeletingBizId(null); }
  };

  // ✅ BIZ-ENH: 조과 갤러리 → 오픈게시판 선상 카테고리 자동 등록
  const handleGalleryImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { fileToCompressedBase64 } = await import('../utils/imageUtils');
      const b64 = await fileToCompressedBase64(file);
      setGalleryForm(prev => ({ ...prev, image: b64 }));
    } catch { addToast('이미지 처리 실패', 'error'); }
  };

  const handleGallerySubmit = async () => {
    if (!galleryForm.fish) { addToast('어종을 입력해주세요.', 'error'); return; }
    setGallerySubmitting(true);
    try {
      // 내 선박 정보 가져오기
      let shipInfo = bizPhone;
      if (!shipInfo.phone) {
        try { const r = await apiClient.get('/api/business/my-phone'); shipInfo = r.data; }
        catch { /* 무시 */ }
      }
      const res = await apiClient.post('/api/business/gallery-post', {
        author: user.name,
        ...galleryForm,
        shipName: shipInfo.shipName,
        phone: shipInfo.phone,
      });
      addToast(res.data.message || '오픈게시판 선상에 등록되었습니다! 🎣', 'success');
      setGalleryModal(false);
      setGalleryForm({ fish: '', size: '', weight: '', location: '', memo: '', image: null });
    } catch (err) { addToast(err.response?.data?.error || '등록 실패', 'error'); }
    finally { setGallerySubmitting(false); }
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
      if (!isMountedRef.current) return; // BUG-MY04 FIX
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
    if (!user?.email || user.email === 'guest@fishinggo.com' || user?.id === 'GUEST' || user?.id === 'guest') return;
    try {
      setLoading(true);
      // NEW-C2: Promise.all → Promise.allSettled — 하나 실패해도 나머지 탭 표시 가능
      const [postsResult, recordsResult, crewsResult] = await Promise.allSettled([
        apiClient.get(`/api/user/posts?email=${encodeURIComponent(user.email)}`),
        apiClient.get(`/api/user/records?email=${encodeURIComponent(user.email)}`),
        apiClient.get('/api/user/crews'),
      ]);
      if (postsResult.status === 'fulfilled') setRealPosts(postsResult.value.data);
      else if (!import.meta.env.PROD) console.warn('[MyPage] 게시글 로드 실패:', postsResult.reason?.message);
      if (recordsResult.status === 'fulfilled') setRealRecords(recordsResult.value.data);
      else if (!import.meta.env.PROD) console.warn('[MyPage] 조과 기록 로드 실패:', recordsResult.reason?.message);
      if (crewsResult.status === 'fulfilled') setMyCrews(crewsResult.value.data || []);
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
    const trimmed = newName.trim();
    if (trimmed.length < 2 || trimmed.length > 12) {
      addToast('닉네임은 2~12자 사이로 입력해주세요.', 'error');
      return;
    }
    const nicknameRegex = /^[a-zA-Z0-9가-힣]+$/;
    if (!nicknameRegex.test(trimmed)) {
      addToast('한글, 영어, 숫자만 사용 가능합니다.', 'error');
      return;
    }
    // ✅ NICK-CHK: 중복 사전 확인 (서버 API 사용, 본인 제외)
    try {
      const dupCheck = await apiClient.post('/api/auth/check-name', { name: trimmed, excludeEmail: user.email });
      if (!dupCheck.data.available) {
        if (dupCheck.data.banned) {
          addToast('이 닉네임은 사용할 수 없습니다. (운영 정책상 금지된 표현 포함)', 'error');
        } else {
          addToast('이미 사용 중인 닉네임입니다.', 'error');
        }
        return;
      }
    } catch {
      // 중복 확인 실패 시 서버에서 최종 처리
    }

    try {
      const res = await apiClient.put(`/api/user/nickname`, {
        email: user.email, newName: trimmed
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
        if (!isMountedRef.current) return; // ✅ BUG-M2 FIX: 압축 후 언마운트 체크

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
          if (!isMountedRef.current) return; // ✅ BUG-M2 FIX: API 응답 후 언마운트 체크
          if (res.data.success) {
            addToast('프로필 사진이 저장되었습니다! 📸', 'success');
          }
        } catch (err) {
          if (!isMountedRef.current) return; // ✅ 에러 처리 전도 체크
          if (!import.meta.env.PROD) console.error('Avatar server error:', err);
          // 서버 저장 실패해도 로컬은 이미 반영됨 → 성공 안내
          addToast('📸 프로필 사진이 변경되었습니다! (로컬 저장)', 'success');
        }
      } catch (compressErr) {
        if (!isMountedRef.current) return;
        if (!import.meta.env.PROD) console.error('이미지 압축 실패:', compressErr);
        addToast('이미지 처리 중 오류가 발생했습니다.', 'error');
      }
    };
    reader.onerror = () => {
      addToast('파일을 읽을 수 없습니다. 다른 파일을 선택해주세요.', 'error');
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
        <div style={{ fontSize: `calc(48px * var(--fs, 1))` }}>🎣</div>
        <p style={{ fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '800', color: '#1c1c1e' }}>로그인이 필요합니다</p>
        <button
          onClick={() => navigate('/login')}
          style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #0056D2, #003fa3)', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: `calc(15px * var(--fs, 1))`, cursor: 'pointer' }}
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
    <div className="page-container" style={{ backgroundColor: '#F8F9FA' }}>
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
            {tierBadgeLabel && (
              <div style={{
                position: 'absolute', top: '-8px', left: '-8px',
                background: tierBadge.bg,
                color: tierBadge.color,
                fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900',
                padding: '3px 9px', borderRadius: '12px',
                border: '2.5px solid #fff', letterSpacing: '0.02em',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                whiteSpace: 'nowrap',
              }}>{tierBadgeLabel}</div>
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
                  <input value={newName} onChange={e => setNewName(e.target.value)} style={{ background: '#fff', border: '2px solid #0056D2', borderRadius: '12px', padding: '8px 40px 8px 12px', fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '900', width: '100%', outline: 'none' }} />
                  <Check size={18} color="#00C48C" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} onClick={handleNicknameChange} />
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize: `calc(22px * var(--fs, 1))`, fontWeight: '950', color: '#1c1c1e' }}>{user.name}</h2>
                  <div onClick={() => setIsEditing(true)} style={{ backgroundColor: '#F2F2F7', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><Edit3 size={14} color="#8E8E93" /></div>
                </>
              )}
            </div>
            <p style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '600', marginTop: '2px' }}>{user.email}</p>

            {/* 레벨 카드 */}
            <div
              onClick={() => setShowModal('level')}
              style={{ marginTop: '14px', background: 'linear-gradient(135deg, #EBF2FF 0%, #F0FFF8 100%)', borderRadius: '18px', padding: '12px 16px', cursor: 'pointer', border: '1.5px solid #D0E4FF' }}
            >
              {/* 쫐호 + 이모지 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: `calc(18px * var(--fs, 1))` }}>{levelInfo.emoji}</span>
                  <div>
                    <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: '#0056D2', fontWeight: '900', letterSpacing: '0.04em' }}>LV.{levelInfo.level}</div>
                    <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', color: '#1c1c1e', lineHeight: 1.2 }}>{levelInfo.title}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {levelInfo.isMaxLevel ? (
                    <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', color: '#FFD700' }}>MAX LEVEL 🏆</span>
                  ) : (
                    <span style={{ fontSize: `calc(10px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '700' }}>
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

            </div>

            {/* 연속출석 */}
            {(user.streak || 0) > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: `calc(14px * var(--fs, 1))` }}>🔥</span>
                <span style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '800', color: '#FF5A5F' }}>{user.streak}일 연속 출석 중!</span>
                {(user.streak >= 7) && <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: '#FF5A5F', color: '#fff', padding: '2px 6px', borderRadius: '8px', fontWeight: '900' }}>+80 EXP 발동 중</span>}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', backgroundColor: '#F2F2F7', borderRadius: '24px', overflow: 'hidden', marginTop: '24px', border: '1.5px solid #F2F2F7' }}>
           {[
             { label: '조과기록', val: realRecords.length, icon: Trophy, color: '#FF9B26', onClick: () => setActiveTab('records') },
             { label: '팔로워', val: user.followers?.length || 0, icon: Star, color: '#0056D2', onClick: () => handleOpenFollowModal('followers') },
             { label: '팔로잉', val: user.following?.length || 0, icon: Heart, color: '#FF5A5F', onClick: () => handleOpenFollowModal('following') },
             { label: '연속출석', val: `${user.streak || 0}일`, icon: Calendar, color: '#00C48C', onClick: null },
           ].map(s => (
             <div key={s.label} onClick={s.onClick} style={{ backgroundColor: '#fff', padding: '14px 6px', textAlign: 'center', cursor: s.onClick ? 'pointer' : 'default' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', marginBottom: '4px' }}>
                   <s.icon size={11} color={s.color} fill={s.color} />
                   <span style={{ fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '950', color: '#1c1c1e' }}>{s.val}</span>
                </div>
                <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '700' }}>{s.label}</div>
             </div>
           ))}
        </div>
      </div>

      {/* ✅ ADSENSE: 프로필 헤더 아래 광고 (무료 유저만) */}
      {userTier === 'FREE' && (
        <div style={{ padding: '16px 24px 0' }}>
          <AdSenseDisplay style={{ borderRadius: '12px', overflow: 'hidden' }} />
        </div>
      )}

      {/* 🟦 Tabs Switcher 🟦 */}
      <div style={{ display: 'flex', padding: '20px 24px 10px', gap: '24px', overflowX: 'auto' }}>
         <div onClick={() => setActiveTab('records')} style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '950', color: activeTab === 'records' ? '#1c1c1e' : '#C7C7CC', position: 'relative', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            기록부 {activeTab === 'records' && <div style={{ position: 'absolute', bottom: '-8px', left: 0, width: '100%', height: '4px', backgroundColor: '#0056D2', borderRadius: '2px' }}></div>}
         </div>
         <div onClick={() => setActiveTab('posts')} style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '950', color: activeTab === 'posts' ? '#1c1c1e' : '#C7C7CC', position: 'relative', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            나의 피드 {activeTab === 'posts' && <div style={{ position: 'absolute', bottom: '-8px', left: 0, width: '100%', height: '4px', backgroundColor: '#0056D2', borderRadius: '2px' }}></div>}
         </div>
         <div onClick={() => setActiveTab('stats')} style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '950', color: activeTab === 'stats' ? '#1c1c1e' : '#C7C7CC', position: 'relative', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            조과통계 {activeTab === 'stats' && <div style={{ position: 'absolute', bottom: '-8px', left: 0, width: '100%', height: '4px', backgroundColor: '#FF9B26', borderRadius: '2px' }}></div>}
         </div>
         {/* ✅ CREW-ENH: 내 크루 탭 */}
         <div onClick={() => setActiveTab('crews')} style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '950', color: activeTab === 'crews' ? '#1c1c1e' : '#C7C7CC', position: 'relative', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users size={16} /> 내 크루 {myCrews.length > 0 && <span style={{ fontSize: `calc(11px * var(--fs, 1))`, background: '#0056D2', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontWeight: '900' }}>{myCrews.length}</span>} {activeTab === 'crews' && <div style={{ position: 'absolute', bottom: '-8px', left: 0, width: '100%', height: '4px', backgroundColor: '#0056D2', borderRadius: '2px' }}></div>}
         </div>
      </div>

      {/* 🟦 Tab Content 🟦 */}
      <div style={{ padding: '20px 24px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
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
                     <div style={{ fontSize: `calc(20px * var(--fs, 1))`, marginBottom: '4px' }}>{s.emoji}</div>
                     <div style={{ fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '950', color: s.color, wordBreak: 'keep-all' }}>{s.val}</div>
                     <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '700', marginTop: '2px' }}>{s.label}</div>
                   </div>
                 ))}
               </div>

               {/* 월별 조과 추이 */}
               <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', marginBottom: '14px', border: '1.5px solid #F2F2F7', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                 <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '950', marginBottom: '16px', color: '#1c1c1e' }}>📈 월별 조과 추이</div>
                 {realRecords.length === 0 ? (
                   <p style={{ color: '#8E8E93', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700', textAlign: 'center', padding: '20px 0' }}>조과 기록이 없습니다.</p>
                 ) : (
                   <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px' }}>
                     {monthEntries.map(([month, cnt]) => (
                       <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                         <div style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', color: '#0056D2' }}>{cnt > 0 ? cnt : ''}</div>
                         <div style={{
                           width: '100%', borderRadius: '6px 6px 0 0',
                           height: `${Math.max((cnt / maxMonth) * 60, cnt > 0 ? 8 : 2)}px`,
                           background: cnt > 0 ? 'linear-gradient(180deg, #0056D2, #42A5F5)' : '#F2F2F7',
                           transition: 'height 0.8s ease',
                           minHeight: '2px',
                         }} />
                         <div style={{ fontSize: `calc(9px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '700' }}>{month}</div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>

               {/* 어종별 바 차트 */}
               <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', marginBottom: '14px', border: '1.5px solid #F2F2F7', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                 <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '950', marginBottom: '16px', color: '#1c1c1e' }}>🐟 어종별 조과</div>
                 {entries.length === 0 ? (
                   <p style={{ color: '#8E8E93', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700', textAlign: 'center', padding: '20px 0' }}>조과 기록이 없습니다.</p>
                 ) : entries.map(([sp, cnt], i) => (
                   <div key={sp} style={{ marginBottom: '12px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                       <span style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '800', color: '#1c1c1e' }}>{sp}</span>
                       <span style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '950', color: BAR_COLORS[i] }}>{cnt}회</span>
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
                   <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '950', marginBottom: '14px', color: '#1c1c1e' }}>⭐ 단골 포인트 TOP3</div>
                   {topSpots.map(([spot, cnt], i) => (
                     <div key={spot} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: i < topSpots.length - 1 ? '12px' : 0 }}>
                       <div style={{
                         width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                         background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32',
                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                         fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', color: '#fff',
                       }}>{i + 1}</div>
                       <div style={{ flex: 1 }}>
                         <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: '#1c1c1e' }}>{spot}</div>
                       </div>
                       <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '950', color: '#0056D2' }}>{cnt}회</div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           );
         })() : activeTab === 'records' ? (
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              {realRecords.length > 0 ? realRecords.map(r => (
                <div key={String(r._id || r.id)}
                  onClick={() => navigate(`/catch/${String(r._id || r.id)}`)}
                  style={{ backgroundColor: '#fff', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', border: '1.5px solid #F2F2F7', cursor: 'pointer' }}
                >
                   {r.image
                     ? <img src={r.image} style={{ width: '100%', height: '140px', objectFit: 'cover' }} alt="" />
                     : <div style={{ width: '100%', height: '140px', background: 'linear-gradient(135deg,#EBF5FF,#F0FFF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `calc(36px * var(--fs, 1))` }}>🎣</div>
                   }
                   <div style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                        <span style={{ fontSize: `calc(12px * var(--fs, 1))`, background: '#EBF5FF', color: '#0056D2', padding: '2px 8px', borderRadius: '8px', fontWeight: '800' }}>{r.fish || '어종 미입력'}</span>
                      </div>
                      <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#555', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.location || r.memo || '장소 미입력'}</div>
                      <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: '#AEAEB2', fontWeight: '600', marginTop: '2px' }}>{r.date || (r.createdAt ? String(r.createdAt).slice(0,10) : '')}</div>
                   </div>
                </div>
              )) : (
                <div style={{ gridColumn: 'span 2', padding: '40px', textAlign: 'center', color: '#8E8E93' }}>
                   <div style={{ fontSize: `calc(40px * var(--fs, 1))`, marginBottom: '10px' }}>🎣</div>
                   <p style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '700' }}>아직 등록된 조과 기록이 없습니다.</p>
                   <p style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#AEAEB2', fontWeight: '600', marginTop: '4px' }}>첫 번째 조과를 등록해보세요!</p>
                </div>
              )}
              <div
                onClick={() => { addToast('지도에서 낚시 포인트를 선택하면 조과 기록을 남길 수 있습니다! 🎣', 'info'); navigate('/'); }}
                style={{ height: '190px', borderRadius: '28px', border: '2px dashed #00C48C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#00C48C', cursor: 'pointer', background: 'rgba(0,196,140,0.03)' }}
              >
                 <Camera size={28} color="#00C48C" />
                 <span style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', color: '#00C48C' }}>조과 기록 추가하기</span>
                 <span style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '700', color: '#8E8E93', textAlign: 'center' }}>낚시 포인트 선택 → 조과 기록 남기기</span>
              </div>
           </div>
          ) : activeTab === 'crews' ? (
           <div>
             {myCrews.length === 0 ? (
               <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                 <div style={{ fontSize: `calc(48px * var(--fs, 1))`, marginBottom: '12px' }}>⚓</div>
                 <p style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800', color: '#555', marginBottom: '6px' }}>아직 가입한 크루가 없습니다</p>
                 <p style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#8E8E93', marginBottom: '20px' }}>커뮤니티에서 크루에 참여해보세요!</p>
                 <button onClick={() => navigate('/community?tab=crew')} style={{ padding: '12px 28px', background: 'linear-gradient(135deg,#0056D2,#0096FF)', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: `calc(14px * var(--fs, 1))`, cursor: 'pointer' }}>크루 찾아보기 🎣</button>
               </div>
             ) : myCrews.map(crew => {
               const crewId = String(crew._id || crew.id);
               const isOwner = crew.owner === user?.email;
               return (
                 <div key={crewId} style={{ background: '#fff', borderRadius: '20px', padding: '18px 20px', border: '1.5px solid #F2F2F7', marginBottom: '12px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isOwner ? 0 : '10px' }}>
                     <div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                         {isOwner && <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: '#FFD700', color: '#1c1c1e', padding: '2px 6px', borderRadius: '6px', fontWeight: '900' }}>크루장</span>}
                         <span style={{ fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '900', color: '#1c1c1e' }}>{crew.name}</span>
                       </div>
                       <div style={{ display: 'flex', gap: '10px', fontSize: `calc(12px * var(--fs, 1))`, color: '#8e8e93' }}>
                         <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Users size={12} /> {crew.members}/{crew.limit || 20}명</span>
                         {crew.region && crew.region !== '전국' && <span>📍 {crew.region}</span>}
                       </div>
                     </div>
                     <button onClick={() => navigate(`/crew/${crewId}/chat`)} style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#0056D2,#0096FF)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer', flexShrink: 0 }}>채팅 입장</button>
                   </div>
                   {!isOwner && (
                     <button disabled={leavingCrewId === crewId} onClick={async () => {
                       setLeavingCrewId(crewId);
                       try {
                         await apiClient.post(`/api/community/crews/${crewId}/leave`, { email: user.email });
                         setMyCrews(prev => prev.filter(c => String(c._id || c.id) !== crewId));
                         addToast('크루에서 탈퇴했습니다.', 'success');
                       } catch (err) { addToast(err.response?.data?.error || '탈퇴 실패', 'error'); }
                       finally { setLeavingCrewId(null); }
                     }} style={{ width: '100%', padding: '8px', border: '1.5px solid #FFE5E5', borderRadius: '10px', background: '#FFF0F0', color: '#FF3B30', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer' }}>
                       {leavingCrewId === crewId ? '탈퇴 중...' : '크루 나가기'}
                     </button>
                   )}
                 </div>
               );
             })}
           </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {realPosts.length > 0 ? realPosts.map(p => (
                <div key={String(p._id || p.id)} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '28px', border: '1.5px solid #F2F2F7' }}>
                   <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '600', marginBottom: '8px' }}>{p.time}</div>
                   <p style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '700', color: '#1c1c1e', margin: '0 0 16px' }}>{p.content}</p>
                   <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: `calc(12px * var(--fs, 1))`, color: '#8e8e93', fontWeight: '700' }}><Heart size={14} color="#FF5A5F" /> {p.likes}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: `calc(12px * var(--fs, 1))`, color: '#8e8e93', fontWeight: '700' }}><MessageSquare size={14} /> {p.comments?.length ?? 0}</div>
                   </div>
                </div>
              )) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#8E8E93' }}>
                   <p style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '700' }}>등록된 게시글이 없습니다.</p>
                </div>
              )}
           </div>
         )}
      </div>

      {/* 🟦 비즈니스 파트너 센터 (BUSINESS LITE/PRO/VIP 한정) 🟦 */}
      {canAccessPartnerCenter && (
        <div className="fade-in" style={{ padding: '10px 24px 20px' }}>
          <h3 style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '950', marginBottom: '14px', color: '#1A1A2E', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: `calc(20px * var(--fs, 1))` }}>👑</span> 비즈니스 파트너 센터
          </h3>
          <div style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #2A2A4A 100%)', borderRadius: '28px', padding: '24px', color: '#fff', boxShadow: '0 12px 30px rgba(26,26,46,0.2)' }}>

            {/* 1. 연락처 확인 */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '18px', borderRadius: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <div style={{ fontSize: `calc(11.5px * var(--fs, 1))`, color: '#FFD700', fontWeight: '900', marginBottom: '6px', letterSpacing: '0.02em' }}>📞 문의 연락처 관리</div>
                <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '950', letterSpacing: '-0.02em' }}>전화·문자 연락처 확인</div>
                <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.55)', marginTop: '4px', fontWeight: '600' }}>예약 문의 시 노출되는 번호입니다</div>
              </div>
              <button
                onClick={handleOpenBizPhone}
                style={{ backgroundColor: '#FFD700', color: '#1A1A2E', border: 'none', padding: '12px 16px', borderRadius: '14px', fontWeight: '900', fontSize: `calc(13px * var(--fs, 1))`, cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,215,0,0.3)', whiteSpace: 'nowrap' }}
              >연락처 확인</button>
            </div>

            {/* 2. 액션 버튼 3개 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {/* 조과 갤러리 등록 */}
              <div
                onClick={() => setGalleryModal(true)}
                style={{ backgroundColor: 'rgba(0,196,140,0.12)', border: '1px solid rgba(0,196,140,0.3)', padding: '16px 10px', borderRadius: '18px', cursor: 'pointer', textAlign: 'center', transition: 'transform 0.15s' }}
              >
                <Camera size={24} color="#00C48C" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', marginBottom: '4px' }}>조과 갤러리</div>
                <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: 'rgba(255,255,255,0.55)', fontWeight: '600', lineHeight: '1.3' }}>선상 게시판에<br/>자동 노출</div>
              </div>
              {/* 내 선박 홍보글 관리 */}
              <div
                onClick={handleOpenBizPosts}
                style={{ backgroundColor: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', padding: '16px 10px', borderRadius: '18px', cursor: 'pointer', textAlign: 'center', transition: 'transform 0.15s' }}
              >
                <BookOpen size={24} color="#FFD700" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', marginBottom: '4px' }}>내 홍보글</div>
                <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: 'rgba(255,255,255,0.55)', fontWeight: '600', lineHeight: '1.3' }}>등록 게시글<br/>확인·삭제</div>
              </div>
              {/* 선박 홍보글 신규 등록 */}
              <div
                onClick={() => navigate('/write-business')}
                style={{ backgroundColor: 'rgba(0,86,210,0.15)', border: '1px solid rgba(0,86,210,0.3)', padding: '16px 10px', borderRadius: '18px', cursor: 'pointer', textAlign: 'center', transition: 'transform 0.15s' }}
              >
                <MapPin size={24} color="#4A9EFF" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', marginBottom: '4px' }}>홍보글 등록</div>
                <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: 'rgba(255,255,255,0.55)', fontWeight: '600', lineHeight: '1.3' }}>선박 홍보글<br/>새로 작성</div>
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
            <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: 'rgba(255,215,0,0.7)', fontWeight: '900', letterSpacing: '0.1em', marginBottom: '12px' }}>⚙️ MASTER ADMIN</div>
            <button
              onClick={() => navigate('/cctv-admin')}
              style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#fff', textAlign: 'left' }}
            >
              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #FFD700, #FFA000)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: `calc(18px * var(--fs, 1))` }}>📺</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', color: '#FFD700' }}>CCTV 채널 관리</div>
                <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginTop: '2px' }}>지역별 YouTube ID 직접 수정 · 미리보기</div>
              </div>
              <ChevronRight size={16} color="#FFD700" />
            </button>
            {/* 비밀포인트 위치 수정 버튼 */}
            <button
              onClick={() => navigate('/secret-admin')}
              style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#fff', textAlign: 'left', marginTop: '8px' }}
            >
              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #FF6B35, #E60000)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: `calc(18px * var(--fs, 1))` }}>⭐</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', color: '#FFD700' }}>비밀포인트 위치 수정</div>
                <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginTop: '2px' }}>주소 검색으로 정확한 좌표 직접 지정</div>
              </div>
              <ChevronRight size={16} color="#FFD700" />
            </button>
            {/* ✅ NEW: 일반 낚시 포인트 위치 수정 버튼 (항구/갯바위/방파제/민물 전체) */}
            <button
              onClick={() => navigate('/point-admin')}
              style={{ width: '100%', padding: '14px 16px', background: 'rgba(100,181,246,0.08)', border: '1px solid rgba(100,181,246,0.3)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#fff', textAlign: 'left', marginTop: '8px' }}
            >
              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #64B5F6, #0D47A1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: `calc(18px * var(--fs, 1))` }}>📍</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', color: '#64B5F6' }}>낚시 포인트 위치 수정</div>
                <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginTop: '2px' }}>항구 · 갯바위 · 방파제 · 민물 — 지도 클릭으로 이동</div>
              </div>
              <ChevronRight size={16} color="#64B5F6" />
            </button>
            {/* 수익 대시보드 버튼 */}
            <button
              onClick={() => navigate('/admin-dashboard')}
              style={{ width: '100%', padding: '14px 16px', background: 'rgba(0,196,140,0.1)', border: '1px solid rgba(0,196,140,0.3)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#fff', textAlign: 'left', marginTop: '8px' }}
            >
<div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #00C48C, #00897B)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: `calc(18px * var(--fs, 1))` }}>📊</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', color: '#00C48C' }}>수익 대시보드</div>
                <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginTop: '2px' }}>월 매출 · 플랜별 구독자 · 최근 결제내역</div>
              </div>
              <ChevronRight size={16} color="#00C48C" />
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: '10px 24px 40px' }}>
         {/* ✅ FONT-SCALE: 글씨 크기 설정 카드 */}
         {(() => {
           const LEVELS = [
             { key: '1',    label: '기본',   size: 14 },
             { key: '1.15', label: '크게',   size: 16 },
             { key: '1.3',  label: '더크게', size: 18 },
             { key: '1.5',  label: '최대',   size: 21 },
           ];
           const applyFs = (key) => {
             localStorage.setItem('fishinggo_fs', key);
             document.documentElement.setAttribute('data-fs', key);
             setFontScale(key); // 리렌더 → 활성 버튼 즉시 업데이트
           };
           return (
             <div style={{ backgroundColor: '#fff', borderRadius: '28px', overflow: 'hidden', border: '1.5px solid #F2F2F7', marginBottom: '12px' }}>
               <div style={{ padding: '18px 24px', borderBottom: '1px solid #F8F9FA' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                   <div style={{ backgroundColor: '#EBF2FF', padding: '10px', borderRadius: '12px' }}>
                     <span style={{ fontSize: `calc(20px * var(--fs, 1))` }}>🔤</span>
                   </div>
                   <div>
                     <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '850', color: '#1c1c1e' }}>글씨 크기</div>
                     <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '600' }}>눈에 편한 크기로 조절하세요</div>
                   </div>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                   {LEVELS.map(lv => (
                     <button
                       key={lv.key}
                       onClick={() => applyFs(lv.key)}
                       style={{
                         padding: '10px 4px', border: 'none', borderRadius: '14px', cursor: 'pointer',
                         background: fontScale === lv.key ? '#0056D2' : '#F2F2F7',
                         color: fontScale === lv.key ? '#fff' : '#555',
                         display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                         transition: 'all 0.2s',
                         boxShadow: fontScale === lv.key ? '0 4px 12px rgba(0,86,210,0.3)' : 'none',
                       }}
                     >
                       <span style={{ fontSize: `${lv.size}px`, fontWeight: '900', lineHeight: 1 }}>가</span>
                       <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800' }}>{lv.label}</span>
                     </button>
                   ))}
                 </div>
                 <div style={{ marginTop: '12px', padding: '10px 14px', background: '#F8F9FC', borderRadius: '10px', fontSize: 'calc(13px * var(--fs, 1))', color: '#555', fontWeight: '700' }}>
                   미리보기 — 낚시GO 글씨 크기가 이렇게 표시됩니다.
                 </div>
               </div>
             </div>
           );
         })()}

         <div style={{ backgroundColor: '#fff', borderRadius: '28px', overflow: 'hidden', border: '1.5px solid #F2F2F7' }}>
            {menuItems.map((item) => ( // ✅ 26TH-C3: key를 item.id로 교체
              <div key={item.id} onClick={() => item.id === 'history' ? navigate('/payment-history') : setShowModal(item.id)} style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: item.id !== 'security' ? '1px solid #F8F9FA' : 'none', cursor: 'pointer' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ backgroundColor: `${item.color}15`, padding: '10px', borderRadius: '12px' }}><item.icon size={20} color={item.color} strokeWidth={2.5} /></div>
                    <div>
                        <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '850', color: '#1c1c1e' }}>{item.title}</div>
                        <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '600' }}>{item.desc}</div>
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
             borderRadius: '24px', fontWeight: '900', fontSize: `calc(16px * var(--fs, 1))`, marginTop: '24px',
             boxShadow: user?.id === 'GUEST' ? '0 8px 20px rgba(0,86,210,0.3)' : 'none'
           }}
         >
           {user?.id === 'GUEST' ? '회원가입 / 로그인 하러가기' : '로그아웃'}
         </button>

         {/* ✅ LEGAL-INFO: 사업자 법적고지 — 서버 DB 저장, 전체 사용자 실시간 반영 */}
          <div style={{ marginTop: '32px', padding: '20px 4px 8px', borderTop: '1px solid #F0F0F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: `8px`, color: '#C7C7CC', fontWeight: '700', letterSpacing: '0.05em' }}>사업자 정보</div>
              {(user?.id === 'sunjulab.k' || user?.tier === 'MASTER' || userTier === 'MASTER') && !editingLegal && (
                <button onClick={() => { setLegalDraft([...legalInfo]); setEditingLegal(true); }}
                  style={{ fontSize: `10px`, fontWeight: '800', color: '#0056D2', background: 'rgba(0,86,210,0.07)', border: 'none', borderRadius: '7px', padding: '3px 10px', cursor: 'pointer' }}>
                  ✏️ 수정
                </button>
              )}
              {(user?.id === 'sunjulab.k' || user?.tier === 'MASTER' || userTier === 'MASTER') && editingLegal && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button disabled={legalSaving} onClick={async () => {
                    setLegalSaving(true);
                    const LS_KEY = 'fishinggo_legal_info';
                    try {
                      await apiClient.put('/api/admin/legal-info', { items: legalDraft });
                      // 서버 저장 성공 → localStorage도 동기화
                      try { localStorage.setItem(LS_KEY, JSON.stringify(legalDraft)); } catch {}
                      setLegalInfo(legalDraft); setEditingLegal(false);
                      addToast('✅ 서버에 저장되었습니다.', 'success');
                    } catch {
                      // 서버 실패 → localStorage에만 저장 + pending 플래그 (서버 복구 시 자동 동기화)
                      try {
                        localStorage.setItem(LS_KEY, JSON.stringify(legalDraft));
                        localStorage.setItem('fishinggo_legal_pending', 'true');
                      } catch {}
                      setLegalInfo(legalDraft); setEditingLegal(false);
                      addToast('📱 저장 완료 (이 기기에 저장됨 — 서버 복구 시 자동 동기화)', 'success');
                    }
                    finally { setLegalSaving(false); }

                  }} style={{ fontSize: `10px`, fontWeight: '900', color: '#fff', background: legalSaving ? '#99b8e8' : '#0056D2', border: 'none', borderRadius: '7px', padding: '3px 12px', cursor: legalSaving ? 'not-allowed' : 'pointer' }}>
                    {legalSaving ? '저장 중...' : '저장'}
                  </button>
                  <button onClick={() => setEditingLegal(false)}
                    style={{ fontSize: `10px`, fontWeight: '800', color: '#FF3B30', background: 'rgba(255,59,48,0.07)', border: 'none', borderRadius: '7px', padding: '3px 10px', cursor: 'pointer' }}>취소</button>
                </div>
              )}
            </div>
            {legalLoading ? (
              <div style={{ padding: '12px 0' }}>
                <span style={{ fontSize: `10px`, color: '#C7C7CC', fontWeight: '600' }}>불러오는 중...</span>
              </div>
            ) : (editingLegal ? legalDraft : legalInfo).map((item, idx) => (
              <div key={item.key} style={{ display: 'flex', gap: '8px', marginBottom: editingLegal ? '8px' : '5px', alignItems: editingLegal ? 'center' : 'flex-start' }}>
                <span style={{ fontSize: `8px`, color: '#C7C7CC', fontWeight: '700', flexShrink: 0, width: '88px', paddingTop: editingLegal ? '6px' : 0 }}>{item.label}</span>
                {editingLegal ? (
                  <input value={legalDraft[idx]?.value || ''}
                    onChange={e => { const n=[...legalDraft]; n[idx]={...n[idx],value:e.target.value}; setLegalDraft(n); }}
                    style={{ flex:1, fontSize:`11px`, fontWeight:'600', padding:'5px 10px', borderRadius:'8px', border:'1.5px solid #E5E5EA', outline:'none', color:'#AEAEB2', background:'#F8F9FC' }} />
                ) : (
                  <span style={{ fontSize: `8px`, color: '#AEAEB2', fontWeight: '600', lineHeight: '1.4', wordBreak: 'keep-all' }}>{item.value}</span>
                )}
              </div>
            ))}
            <div style={{ marginTop: '14px', fontSize: `9px`, color: '#D1D1D6', fontWeight: '600', lineHeight: '1.6' }}>
              ⓒ 2026 선제이유랩. All rights reserved. 본 서비스는 전자상거래법 및 정보통신망법에 따라 운영됩니다.
            </div>
          </div>
      </div>

      {/* 🟦 Settings Modals (Bottom Sheets) 🟦 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowModal(null)}>
           <div style={{ width: '100%', maxWidth: '480px', backgroundColor: '#fff', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '32px 24px 60px', borderRadius: 'inherit', animation: 'slideUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
              <div style={{ width: '40px', height: '5px', background: '#E5E5EA', borderRadius: '3px', margin: '0 auto 24px' }}></div>
              
              {showModal === 'noti' && (() => {
                // 브라우저 알림 권한 상태
                const notiPerm = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
                const permColor = notiPerm === 'granted' ? '#00C48C' : notiPerm === 'denied' ? '#FF3B30' : '#FF9B26';
                const permLabel = notiPerm === 'granted' ? '✅ 허용됨' : notiPerm === 'denied' ? '❌ 차단됨 (설정에서 허용 필요)' : '⚠️ 미설정 (탭하여 허용)';
                return (
                  <>
                    <h3 style={{ fontSize: `calc(20px * var(--fs, 1))`, fontWeight: '900', marginBottom: '8px' }}>알림 설정</h3>

                    {/* 브라우저 알림 권한 상태 */}
                    <div
                      onClick={async () => {
                        if (notiPerm === 'default') {
                          const result = await Notification.requestPermission();
                          if (result === 'granted') addToast('✅ 알림이 허용되었습니다!', 'success');
                          else addToast('알림 허용이 필요합니다. 브라우저 설정에서 허용해주세요.', 'error');
                        } else if (notiPerm === 'denied') {
                          addToast('브라우저 설정(주소창 자물쇠 아이콘)에서 직접 허용해주세요.', 'info');
                        }
                      }}
                      style={{
                        marginBottom: '20px', padding: '12px 16px',
                        background: notiPerm === 'granted' ? '#F0FFF8' : notiPerm === 'denied' ? '#FFF0F0' : '#FFF8E6',
                        border: `1.5px solid ${permColor}40`,
                        borderRadius: '14px', cursor: notiPerm !== 'granted' ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', gap: '10px',
                      }}
                    >
                      <Bell size={18} color={permColor} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', color: permColor }}>기기 알림 권한</div>
                        <div style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '700', color: '#555', marginTop: '2px' }}>{permLabel}</div>
                      </div>
                      {notiPerm !== 'granted' && <ChevronRight size={16} color={permColor} />}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {[
                          { key: 'score', label: '낚시 점수 (출조 추천) 알림', icon: Target },
                          { key: 'comm', label: '커뮤니티 댓글 알림',    icon: MessageSquare },
                          { key: 'chat', label: '채팅방 답장 · 멘션 알림', icon: Bell },
                          { key: 'nightMode', label: '야간 방해 금지 모드 (23시~07시)', icon: Moon },
                      ].map(n => (
                          <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <n.icon size={18} color="#8E8E93" />
                                  <span style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '750' }}>{n.label}</span>
                              </div>
                              <div onClick={() => handleToggleNoti(n.key)} style={{ cursor: 'pointer' }}>
                                  {notiSetting[n.key] !== false
                                    ? <ToggleRight size={32} color="#0056D2" fill="#0056D2" />
                                    : <ToggleLeft  size={32} color="#E5E5EA" />}
                              </div>
                          </div>
                      ))}
                    </div>

                  </>
                );
              })()}

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
                    <h3 style={{ fontSize: `calc(20px * var(--fs, 1))`, fontWeight: '900', marginBottom: '4px' }}>구독 관리</h3>
                    <p style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '600', marginBottom: '20px' }}>
                      현재 플랜: <strong style={{ color: '#0056D2' }}>{planNames[userTier] || '무료'}</strong>
                      {!isFree && <span style={{ marginLeft: '8px', fontSize: `calc(11px * var(--fs, 1))`, color: '#FF5A5F' }}>· 구독 중</span>}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                      {PLANS.map(plan => {
                        const isActive = userTier === plan.tier;
                        const currentRankUI = TIER_RANK_CLIENT[userTier] ?? 0;
                        const planRankUI    = TIER_RANK_CLIENT[plan.tier] ?? 0;
                        // 현재 유료 구독 중이고 이 플랜이 하위 플랜이면 잠금
                        const isLocked = PROTECTED_TIERS_CLIENT.includes(userTier) && planRankUI < currentRankUI;
                        return (
                          <div key={plan.tier}
                            onClick={() => handleTierChange(plan.tier, plan.name)}
                            style={{
                              padding: '16px 18px', borderRadius: '18px',
                              cursor: isLocked ? 'not-allowed' : 'pointer',
                              border: isActive ? '2px solid #0056D2' : isLocked ? '1.5px solid #E5E5EA' : plan.highlight ? '2px solid #0056D230' : '1.5px solid #F0F0F0',
                              background: isActive ? '#EBF2FF' : isLocked ? '#F8F8FA' : plan.highlight ? 'linear-gradient(135deg, #F0F5FF, #E8F0FF)' : '#fff',
                              transition: 'all 0.15s',
                              position: 'relative',
                              opacity: isLocked ? 0.55 : 1,
                            }}
                          >
                            {/* 잠금 배지 — 하위 플랜 */}
                            {isLocked && (
                              <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#8E8E93', color: '#fff', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', padding: '3px 12px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                                🔒 구독 유지 중
                              </div>
                            )}
                            {plan.highlight && !isActive && !isLocked && (
                              <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #0056D2, #003fa3)', color: '#fff', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', padding: '3px 12px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                                인기 플랜
                              </div>
                            )}
                            {plan.exclusive && !isActive && !isLocked && (
                              <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #FFD700, #FF9B26)', color: '#5C3A00', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', padding: '3px 14px', borderRadius: '20px', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(255,215,0,0.5)' }}>
                                항구 · 지역별 선착순 1명
                              </div>
                            )}
                            {plan.exclusive && isActive && (
                              <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #FFD700, #FF9B26)', color: '#5C3A00', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', padding: '3px 14px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                                항구 지역 독점 활성 중
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                                  {plan.badge && (
                                    <span style={{ fontSize: `calc(9px * var(--fs, 1))`, fontWeight: '900', padding: '2px 7px', borderRadius: '8px', background: isLocked ? '#C0C0C0' : plan.badgeBg, color: isLocked ? '#fff' : plan.badgeColor }}>{plan.badge}</span>
                                  )}
                                  <span style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '900', color: isLocked ? '#AEAEB2' : '#1c1c1e' }}>{plan.name}</span>
                                  {isActive && <span style={{ fontSize: `calc(10px * var(--fs, 1))`, color: '#0056D2', fontWeight: '800' }}>✓ 현재</span>}
                                </div>
                                <ul style={{ margin: 0, padding: '0 0 0 4px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                  {plan.features.map((f, i) => (
                                    <li key={i} style={{ fontSize: `calc(11px * var(--fs, 1))`, color: isLocked ? '#C0C0C0' : '#555', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                      <span style={{ color: isLocked ? '#C0C0C0' : '#0056D2', fontSize: `calc(10px * var(--fs, 1))` }}>✓</span> {f}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                                <div style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', color: isActive ? '#0056D2' : isLocked ? '#AEAEB2' : '#1c1c1e', whiteSpace: 'nowrap' }}>{plan.price}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    </div>

                    <p style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#AEAEB2', textAlign: 'center', fontWeight: '600' }}>
                      * 일반 피드 광고는 플랜과 무관하게 표시됩니다.<br/>
                      * 유료 플랜은 게시글·크루 등록 시 광고 시청이 면제됩니다.
                    </p>
                  </>
                );
              })()}


              {showModal === 'security' && (
                <>
                  <h3 style={{ fontSize: `calc(20px * var(--fs, 1))`, fontWeight: '900', marginBottom: '24px' }}>보안 및 차단 설정</h3>
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
                        <input type="password" placeholder="현재 비밀번호" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
                          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D1D6', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                        <input type="password" placeholder="새 비밀번호 (8자 이상)" value={newPwd} onChange={e => setNewPwd(e.target.value)}
                          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D1D6', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                        {/* ✅ PWD-CONFIRM: 새 비밀번호 확인 입력 */}
                        <div style={{ position: 'relative' }}>
                          <input type="password" placeholder="새 비밀번호 확인" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                            style={{
                              padding: '12px', paddingRight: '44px',
                              borderRadius: '8px', outline: 'none', width: '100%', boxSizing: 'border-box',
                              border: confirmPwd.length === 0
                                ? '1px solid #D1D1D6'
                                : newPwd.trim() === confirmPwd.trim()
                                  ? '1.5px solid #00C48C'
                                  : '1.5px solid #FF3B30',
                            }} />
                          {confirmPwd.length > 0 && (
                            <span style={{
                              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                              fontSize: '16px', pointerEvents: 'none',
                            }}>
                              {newPwd.trim() === confirmPwd.trim() ? '✅' : '❌'}
                            </span>
                          )}
                        </div>
                        {/* 일치 안내 문구 */}
                        {confirmPwd.length > 0 && newPwd.trim() !== confirmPwd.trim() && (
                          <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#FF3B30', fontWeight: '700', marginTop: '-4px', paddingLeft: '4px' }}>
                            ⚠️ 새 비밀번호가 일치하지 않습니다
                          </div>
                        )}
                        <button
                          onClick={handlePasswordChange}
                          disabled={!currentPwd || !newPwd || !confirmPwd || newPwd.trim() !== confirmPwd.trim()}
                          style={{
                            padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer',
                            background: (!currentPwd || !newPwd || !confirmPwd || newPwd.trim() !== confirmPwd.trim())
                              ? '#E5E5EA' : '#0056D2',
                            color: (!currentPwd || !newPwd || !confirmPwd || newPwd.trim() !== confirmPwd.trim())
                              ? '#AEAEB2' : '#fff',
                            transition: 'all 0.2s',
                          }}
                        >변경하기</button>
                      </div>
                    )}

                    {/* 차단 사용자 관리 탭 */}
                    <div 
                      onClick={() => setSecTab(secTab === 'block' ? null : 'block')} 
                      style={{ padding: '18px', border: '1px solid #F0F0F0', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: secTab === 'block' ? '#F8F9FA' : '#fff' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><ShieldAlert size={18} color="#8E8E93" /><span style={{ fontWeight: '750' }}>차단 사용자 관리</span></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#FF5A5F', fontWeight: '800' }}>{blockedUsers.length}명</span>
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
                              <span style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '700' }}>{bu}</span>
                              <button onClick={() => handleUnblockUser(bu)} style={{ padding: '6px 10px', fontSize: `calc(12px * var(--fs, 1))`, background: '#FF5A5F15', color: '#FF5A5F', border: 'none', borderRadius: '6px', fontWeight: '800', cursor: 'pointer' }}>해제</button>
                            </div>
                          ))}
                          {blockedUsers.length === 0 && <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#8E8E93', textAlign: 'center', padding: '10px' }}>차단한 사용자가 없습니다.</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              <button onClick={() => setShowModal(null)} style={{ width: '100%', marginTop: '32px', padding: '18px', background: '#1c1c1e', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: `calc(16px * var(--fs, 1))` }}>닫기</button>
           </div>
        </div>
      )}

      {/* 🟦 팔로워 / 팔로잉 목록 모달 🟦 */}
      {followModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setFollowModal(null)}
        >
          <div
            style={{ width: '100%', maxWidth: '480px', backgroundColor: '#fff', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '28px 24px 48px', animation: 'slideUp 0.3s ease-out' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: '40px', height: '5px', background: '#E5E5EA', borderRadius: '3px', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: `calc(20px * var(--fs, 1))`, fontWeight: '900', margin: 0 }}>
                {followModal === 'followers' ? '팔로워' : '팔로잉'}
                <span style={{ fontSize: `calc(14px * var(--fs, 1))`, color: '#0056D2', fontWeight: '800', marginLeft: '8px' }}>
                  {followList.length}명
                </span>
              </h3>
              <button onClick={() => setFollowModal(null)} style={{ background: 'none', border: 'none', fontSize: `calc(22px * var(--fs, 1))`, cursor: 'pointer', color: '#8E8E93' }}>✕</button>
            </div>

            {followLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#8E8E93', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '700' }}>불러오는 중...</div>
            ) : followList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: `calc(36px * var(--fs, 1))`, marginBottom: '10px' }}>👤</div>
                <p style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '700', color: '#8E8E93' }}>
                  {followModal === 'followers' ? '아직 팔로워가 없습니다.' : '팔로잉 중인 사용자가 없습니다.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto' }}>
                {followList.map(u => (
                  <div
                    key={u.email}
                    onClick={() => { setFollowModal(null); navigate(`/user/${encodeURIComponent(u.name)}`); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px', background: '#F8F9FA', borderRadius: '16px', cursor: 'pointer' }}
                  >
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                      background: 'linear-gradient(135deg, #0056D2, #00C48C)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900', fontSize: `calc(16px * var(--fs, 1))`,
                    }}>
                      {u.avatar || u.picture
                        ? <img src={u.avatar || u.picture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        : (u.name?.[0] || '?')
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800', color: '#1c1c1e' }}>{u.name || '이름 없음'}</div>
                      <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '600', marginTop: '2px' }}>{u.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


      {/* BIZ-ENH: 연락처 확인 모달 */}
      {bizPhoneModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:9100, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={() => setBizPhoneModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'28px 28px 0 0', padding:'28px 24px 40px', width:'100%', maxWidth:'480px' }}>
            <div style={{ width:'40px', height:'4px', background:'#E5E5EA', borderRadius:'2px', margin:'0 auto 20px' }} />
            <div style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight:'950', marginBottom:'6px' }}>📞 내 연락처 정보</div>
            <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color:'#8E8E93', fontWeight:'600', marginBottom:'20px' }}>예약 문의 고객에게 노출되는 번호입니다</div>
            {bizPhone.shipName && (
              <div style={{ background:'#F8F9FA', borderRadius:'16px', padding:'14px 18px', marginBottom:'12px' }}>
                <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color:'#8E8E93', fontWeight:'700', marginBottom:'4px' }}>선박명</div>
                <div style={{ fontSize: `calc(17px * var(--fs, 1))`, fontWeight:'900', color:'#1c1c1e' }}>🚢 {bizPhone.shipName}</div>
              </div>
            )}
            <div style={{ background:'#EBF5FF', borderRadius:'16px', padding:'18px', marginBottom:'20px', textAlign:'center' }}>
              {bizPhone.phone ? (
                <>
                  <div style={{ fontSize: `calc(26px * var(--fs, 1))`, fontWeight:'950', color:'#0056D2', letterSpacing:'0.02em', marginBottom:'12px' }}>{bizPhone.phone}</div>
                  <div style={{ display:'flex', gap:'10px' }}>
                    <a href={`tel:${bizPhone.phone}`} style={{ flex:1, padding:'13px', background:'#0056D2', color:'#fff', borderRadius:'14px', fontWeight:'900', fontSize: `calc(14px * var(--fs, 1))`, textDecoration:'none', textAlign:'center', display:'block' }}>📞 전화하기</a>
                    <a href={`sms:${bizPhone.phone}`} style={{ flex:1, padding:'13px', background:'#34C759', color:'#fff', borderRadius:'14px', fontWeight:'900', fontSize: `calc(14px * var(--fs, 1))`, textDecoration:'none', textAlign:'center', display:'block' }}>💬 문자하기</a>
                  </div>
                </>
              ) : (
                <div style={{ color:'#8E8E93', fontSize: `calc(14px * var(--fs, 1))`, fontWeight:'700', padding:'10px 0' }}>
                  <div style={{ fontSize: `calc(28px * var(--fs, 1))`, marginBottom:'8px' }}>📵</div>
                  등록된 연락처가 없습니다.<br/>선박 홍보글 등록 시 연락처를 입력해주세요.
                  <button onClick={() => { setBizPhoneModal(false); navigate('/write-business'); }} style={{ display:'block', width:'100%', marginTop:'14px', padding:'12px', background:'#0056D2', color:'#fff', border:'none', borderRadius:'14px', fontWeight:'900', cursor:'pointer' }}>홍보글 등록하기</button>
                </div>
              )}
            </div>
            <button onClick={() => setBizPhoneModal(false)} style={{ width:'100%', padding:'14px', border:'1.5px solid #E5E5EA', borderRadius:'14px', background:'#fff', fontWeight:'800', cursor:'pointer', color:'#666' }}>닫기</button>
          </div>
        </div>
      )}

      {/* BIZ-ENH: 내 선박 홍보글 목록 모달 */}
      {bizPostsModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:9100, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={() => setBizPostsModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'28px 28px 0 0', padding:'28px 24px 40px', width:'100%', maxWidth:'480px', maxHeight:'80vh', overflowY:'auto' }}>
            <div style={{ width:'40px', height:'4px', background:'#E5E5EA', borderRadius:'2px', margin:'0 auto 20px' }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <div style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight:'950', color:'#1c1c1e' }}>🚢 내 선박 홍보글</div>
              <button onClick={() => setBizPostsModal(false)} style={{ background:'none', border:'none', fontSize: `calc(22px * var(--fs, 1))`, cursor:'pointer', color:'#8E8E93' }}>✕</button>
            </div>
            {bizPostsLoading ? <div style={{ textAlign:'center', padding:'40px 0', color:'#8E8E93' }}>불러오는 중...</div>
            : myBizPosts.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0' }}>
                <div style={{ fontSize: `calc(36px * var(--fs, 1))`, marginBottom:'10px' }}>🚢</div>
                <p style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight:'700', color:'#8E8E93' }}>등록된 홍보글이 없습니다.</p>
                <button onClick={() => { setBizPostsModal(false); navigate('/write-business'); }} style={{ marginTop:'14px', padding:'12px 24px', background:'#0056D2', color:'#fff', border:'none', borderRadius:'14px', fontWeight:'900', cursor:'pointer' }}>홍보글 등록하기</button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {myBizPosts.map(p => (
                  <div key={String(p._id || p.id)} style={{ background:'#F8F9FA', borderRadius:'18px', padding:'16px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                      <div>
                        <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight:'900', color:'#1c1c1e' }}>{p.shipName || '선박명 미입력'}</div>
                        <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color:'#8E8E93', fontWeight:'600', marginTop:'2px' }}>{p.region} · {p.type || p.boatType}</div>
                      </div>
                      <div style={{ display:'flex', gap:'6px' }}>
                        <button onClick={() => { setBizPostsModal(false); navigate(`/write-business?editId=${p._id || p.id}`); }} style={{ padding:'6px 10px', background:'#EBF5FF', color:'#0056D2', border:'none', borderRadius:'8px', fontWeight:'800', fontSize: `calc(12px * var(--fs, 1))`, cursor:'pointer' }}>수정</button>
                        <button onClick={() => handleDeleteBizPost(p._id || p.id)} disabled={deletingBizId === (p._id || p.id)} style={{ padding:'6px 10px', background:'#FFF0F0', color:'#FF3B30', border:'none', borderRadius:'8px', fontWeight:'800', fontSize: `calc(12px * var(--fs, 1))`, cursor:'pointer' }}>{deletingBizId === (p._id || p.id) ? '...' : '삭제'}</button>
                      </div>
                    </div>
                    <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color:'#555', fontWeight:'600', lineHeight:'1.5', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{p.content}</div>
                    {p.phone && <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color:'#0056D2', fontWeight:'800', marginTop:'8px' }}>📞 {p.phone}</div>}
                  </div>
                ))}
                <button onClick={() => { setBizPostsModal(false); navigate('/write-business'); }} style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#0056D2,#0096FF)', color:'#fff', border:'none', borderRadius:'14px', fontWeight:'900', cursor:'pointer' }}>+ 새 홍보글 등록</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BIZ-ENH: 조과 갤러리 등록 모달 */}
      <input ref={galleryFileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleGalleryImageChange} />
      {galleryModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:9100, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={() => setGalleryModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'28px 28px 0 0', padding:'28px 24px', paddingBottom:'calc(env(safe-area-inset-bottom, 0px) + 40px)', width:'100%', maxWidth:'480px', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ width:'40px', height:'4px', background:'#E5E5EA', borderRadius:'2px', margin:'0 auto 20px' }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
              <div style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight:'950', color:'#1c1c1e' }}>🎣 조과 갤러리 등록</div>
              <button onClick={() => setGalleryModal(false)} style={{ background:'none', border:'none', fontSize: `calc(22px * var(--fs, 1))`, cursor:'pointer', color:'#8E8E93' }}>✕</button>
            </div>
            <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color:'#8E8E93', fontWeight:'600', marginBottom:'20px' }}>오픈게시판 선상 카테고리에 자동으로 등록됩니다 🚢</div>
            <div onClick={() => galleryFileRef.current?.click()} style={{ width:'100%', height:'150px', background:'#F8F9FA', borderRadius:'18px', border:'2px dashed #D1D1D6', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', marginBottom:'16px', overflow:'hidden' }}>
              {galleryForm.image
                ? <img src={galleryForm.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'16px' }} />
                : <div style={{ textAlign:'center', color:'#8E8E93' }}><Camera size={32} style={{ marginBottom:'8px' }} /><div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight:'700' }}>사진 추가 (선택)</div></div>
              }
            </div>
            {[
              { key:'fish', label:'어종 *', placeholder:'예: 감성돔, 광어' },
              { key:'size', label:'사이즈 (cm)', placeholder:'예: 45' },
              { key:'weight', label:'무게 (kg)', placeholder:'예: 2.3' },
              { key:'location', label:'포인트/장소', placeholder:'예: 통영 욕지도' },
              { key:'memo', label:'한마디', placeholder:'예: 새벽 출조 대박조과!' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom:'12px' }}>
                <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight:'800', color:'#444', marginBottom:'6px' }}>{label}</div>
                <input value={galleryForm[key]} onChange={e => setGalleryForm(prev => ({ ...prev, [key]: e.target.value }))} placeholder={placeholder} style={{ width:'100%', padding:'12px 14px', borderRadius:'12px', border:'1.5px solid #E5E5EA', fontSize: `calc(14px * var(--fs, 1))`, fontWeight:'600', outline:'none', boxSizing:'border-box' }} />
              </div>
            ))}
            <button onClick={handleGallerySubmit} disabled={gallerySubmitting} style={{ width:'100%', padding:'15px', background: gallerySubmitting ? '#ccc' : 'linear-gradient(135deg,#00C48C,#00897B)', color:'#fff', border:'none', borderRadius:'16px', fontWeight:'900', fontSize: `calc(15px * var(--fs, 1))`, cursor: gallerySubmitting ? 'not-allowed' : 'pointer', marginTop:'4px' }}>
              {gallerySubmitting ? '등록 중...' : '🎣 오픈게시판에 등록하기'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
