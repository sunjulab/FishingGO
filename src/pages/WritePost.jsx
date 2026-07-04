import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, MapPin, Send, ChevronDown, CheckCircle2, Scan } from 'lucide-react';
import { RewardGateModal } from '../components/AdUnit';
import MultiImageUpload from '../components/MultiImageUpload';
import { useToastStore } from '../store/useToastStore';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore';
import apiClient from '../api/index';
import { fileToCompressedBase64 } from '../utils/imageUtils';

export default function WritePost() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const postType = searchParams.get('type') || 'open';
  const editId = searchParams.get('editId'); // 수정 모드
  const [category, setCategory] = useState('전체');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]); // ✅ MULTI-IMG: 다중 이미지 배열 (최대 5장)
  const [imageLoading, setImageLoading] = useState(false);
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [isPopup, setIsPopup] = useState(false);
  // ✅ LOC-1: 위치 상태 — { lat, lng, address }
  const [location, setLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locEditMode, setLocEditMode] = useState(false);
  const [locDraft, setLocDraft] = useState('');
  const locInputRef = useRef(null);
  const isMountedRef = useRef(true); // ✅ BUG-WP01 FIX: Geolocation/AI 콜백 언마운트 보호
  // ✅ MASTER-AUTHOR-EDIT: 마스터 전용 작성자 닉네임 수정 state
  const [editAuthor, setEditAuthor] = useState('');

  // ✅ BUG-WP01: 언마운트 cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const categories = ['전체', '루어', '찌낚시', '원투', '릴찌', '선상', '에깅', '조황 공유'];
  const addToast = useToastStore((state) => state.addToast);
  const userTier = useUserStore((state) => state.userTier);
  const storeUser = useUserStore((state) => state.user);
  // ✅ 16TH-B1: canAccessPremium() 함수 셋렉터 호출 → userTier 기반 직접 판별 (Zustand memoization 정상 작동)
  const canAccessPremium = useMemo(() => {
    const u = storeUser;
    if (u?.id === ADMIN_ID || u?.email === ADMIN_EMAIL) return true;
    return ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'MASTER'].includes(userTier);
  }, [userTier, storeUser?.id, storeUser?.email]); // eslint-disable-line react-hooks/exhaustive-deps
  // ✅ 16TH-B1: user 전체 구독 제거 — user 객체를 별도 셀렉터로 분리
  const user = useUserStore((state) => state.user);
  // ✅ FIX-ADMIN: isAdmin 4중 보장 (id/email-gmail/email-id/tier)
  const isAdmin = useUserStore((s) =>
    s.user?.id === ADMIN_ID ||
    s.user?.email === ADMIN_EMAIL ||
    s.user?.email === ADMIN_ID ||
    s.userTier === 'MASTER'
  );
  const isNoticeType = postType === 'notice';
  const isBusinessLite = canAccessPremium;
  const isEditMode = !!editId;

  // 수정 모드: 기존 데이터 불러오기
  useEffect(() => {
    if (!isEditMode) return;
    let isMounted = true; // ✅ BUG-6 FIX: 수정 모드 이탈 시 다중 setState 방지
    const endpoint = isNoticeType
      ? `/api/community/notices/${editId}`
      : `/api/community/posts/${editId}`;
    apiClient.get(endpoint)
      .then(res => {
        if (!isMounted) return;
        setContent(res.data.content || '');
        setTitle(res.data.title || '');
        setCategory(res.data.category || '전체');
        // ✅ MASTER-AUTHOR-EDIT: 수정 모드에서 현재 author 복원
        setEditAuthor(res.data.author || '');
        // ✅ MULTI-IMG: 수정 모드에서 기존 이미지 배열 복원 (하위호환: image 단일 필드도 지원)
        const existingImages = Array.isArray(res.data.images) && res.data.images.length > 0
          ? res.data.images
          : res.data.image ? [res.data.image] : [];
        setImages(existingImages);
        // ✅ BUG-WP04 FIX: 수정 모드에서 location 필드 복원 (누락 시 저장 시 위치 유실)
        if (res.data.location) setLocation(res.data.location);
        if (res.data.isPopup !== undefined) setIsPopup(!!res.data.isPopup);
      })
      .catch((err) => {
        if (!isMounted) return;
        if (!import.meta.env.PROD) console.warn('[WritePost] 수정 데이터 로드 실패:', err?.message);
        addToast('게시글 정보를 불러오지 못했습니다.', 'error');
      });
    return () => { isMounted = false; };
  }, [editId, isNoticeType, addToast]); // ✅ BUG-6 FIX: addToast deps 추가


  // ✅ 6TH-B3: DRAFT_KEY useMemo — 매 렌더마다 재정의 방지 (postType이 렌더 중 불변)
  const DRAFT_KEY = useMemo(() => `draft_post_${postType}`, [postType]);

  useEffect(() => {
    if (isEditMode || isNoticeType) return; // 수정모드·공지는 draft 비활성화
    let saved = null;
    try { saved = localStorage.getItem(DRAFT_KEY); } catch { /* StorageError 무시 */ }
    if (saved && saved.trim().length > 0) setShowDraftBanner(true);
  }, [DRAFT_KEY, isEditMode, isNoticeType]);

  // ✅ DRAFT-2: 내용 변경 시 자동 저장 (500ms debounce)
  useEffect(() => {
    if (isEditMode || isNoticeType) return;
    const timer = setTimeout(() => {
      if (content.trim().length > 0) {
        try { localStorage.setItem(DRAFT_KEY, content); } catch { /* StorageError 무시 */ }
      } else {
        try { localStorage.removeItem(DRAFT_KEY); } catch { /* StorageError 무시 */ }
        setShowDraftBanner(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [content, isEditMode, isNoticeType]);

  // 공지사항 페이지에 비마스터가 접근하면 즉시 차단
  // ✅ 6TH-C3: React.useEffect → useEffect 통일 (L37, L60과 일관성)
  useEffect(() => {
    if (isNoticeType && !isAdmin) {
      addToast('❌ 공지사항은 운영자(마스터)만 작성할 수 있습니다.', 'error');
      navigate('/community');
    }
  }, [isNoticeType, isAdmin, addToast, navigate]);


  // '등록' 버튼 클릭 시
  const handlePostClick = () => {
    // ✅ FIX: GUEST 비회원 최선단 차단 — doPost/AdGate 진입 전 방어
    if (!user || user.id === 'GUEST') {
      addToast('로그인이 필요합니다. 마이페이지에서 로그인해주세요.', 'error');
      return;
    }
    const trimmedContent = content.trim();
    if (!trimmedContent) return addToast('내용을 입력해주세요.', 'error');
    if (trimmedContent.length > 2000) return addToast('게시글은 2,000자 이하로 작성해주세요.', 'error');
    if (isNoticeType && !title.trim()) { addToast('제목을 입력해주세요.', 'error'); return; }
    // if (isBusinessLite) { doPost(); } else { setShowAdGate(true); }
    doPost(); // ✅ TWEAK: 임시로 광고 게이트 해제 (무료 유저도 즉시 등록)
  };


  const doPost = async () => {
    setIsSubmitting(true);
    const storedUser = user;
    if (!storedUser || storedUser.id === 'GUEST') {
      addToast('로그인이 필요합니다. 마이페이지에서 로그인해주세요.', 'error');
      setIsSubmitting(false);
      return;
    }
    try {
      // ✅ BUG-FIX: img.length는 Base64 문자 수 (byte수 아님) — 3MB 바이너리 = 4MB Base64
      // 기존 3*1024*1024 문자수 기준은 실제 2.25MB 바이너리만 허용 → 4*1024*1024로 수정
      const safeImages = images.filter(img => img && img.length <= 4 * 1024 * 1024);
      const safeImage = safeImages[0] || null;

      if (isNoticeType) {
        const method = isEditMode ? 'put' : 'post';
        const url = isEditMode ? `/api/community/notices/${editId}` : `/api/community/notices`;
        const noticePayload = isEditMode
          ? { title: title.trim(), content, images: safeImages, image: safeImage, isPopup }
          : { title: title.trim(), content, isPinned: false, images: safeImages, image: safeImage, isPopup };
        await apiClient[method](url, noticePayload);
        addToast(isEditMode ? '📢 공지사항이 수정되었습니다!' : '📢 공지사항이 등록되었습니다!', 'success');
        navigate(isEditMode ? -1 : '/community?tab=notice');

      } else {
        const method = isEditMode ? 'put' : 'post';
        const url = isEditMode ? `/api/community/posts/${editId}` : `/api/community/posts`;
        const body = isEditMode
          ? {
              content, category, email: storedUser.email, images: safeImages, image: safeImage,
              // ✅ MASTER-AUTHOR-EDIT: 마스터일 때만 author 포함 (일반 사용자는 전송 안 함)
              ...(isAdmin && editAuthor.trim() ? { author: editAuthor.trim() } : {}),
            }
          : { author: storedUser.name, author_email: storedUser.email, category, content, images: safeImages, image: safeImage, location: location || null };
        await apiClient[method](url, body);
        if (!isEditMode) { try { localStorage.removeItem(DRAFT_KEY); } catch { /* StorageError 무시 */ } }
        if (!isEditMode) {
          const userId = storedUser.email || storedUser.id;
          if (userId) apiClient.post('/api/user/exp', { userId, action: 'post_write' }).catch(() => { });
        }
        addToast(isEditMode ? '✅ 게시글이 수정되었습니다!' : '게시글이 등록되었습니다! 🎉', 'success');
        navigate(isEditMode ? -1 : '/community?tab=open');
      }
    } catch (err) {
      if (!import.meta.env.PROD) console.error('Post error:', err);
      const msg = err.response?.data?.error || '등록 실패. 서버를 확인해주세요.';
      addToast(msg, 'error');
    } finally { setIsSubmitting(false); }
  };

  const handleSubscribe = () => {
    setShowAdGate(false);
    addToast('비즈니스 라이트 구독 페이지로 이동합니다.', 'info');
    navigate('/vvip-subscribe');
  };

  return (
    <div className="page-container" style={{ backgroundColor: '#fff', height: '100dvh', zIndex: 2000 }}>
      {/* 고정 헤더 */}
      <div style={{ padding: '16px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
        <button onClick={() => window.history.length <= 1 ? navigate('/community', { replace: true }) : navigate(-1)} style={{ border: 'none', background: 'none' }}>
          <X size={24} color="#1c1c1e" />
        </button>
        <h2 style={{ fontSize: `calc(17px * var(--fs, 1))`, fontWeight: '800' }}>
          {isNoticeType ? '📢 공지사항 작성' : postType === 'business' ? '선상 배 홍보 등록' : '새 조황 공유하기'}
        </h2>
        <button
          disabled={!content.trim() || isSubmitting}
          style={{
            border: 'none',
            background: content.trim() ? '#0056D2' : '#f0f0f0',
            color: content.trim() ? '#fff' : '#bbb',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: `calc(13px * var(--fs, 1))`,
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onClick={handlePostClick}
        >
          {isSubmitting ? '저장 중...' : isEditMode ? '✅ 수정 완료' : '등록'} <Send size={14} />
        </button>
      </div>

      <div style={{ padding: '20px' }}>
        {/* 구독 혜택 배너 — 비즈니스라이트 미구독자에게만 표시 */}
        {!isBusinessLite && (
          <div
            onClick={handleSubscribe}
            style={{
              background: 'linear-gradient(135deg, #0056D2, #0096FF)',
              borderRadius: '14px', padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: '12px',
              marginBottom: '16px', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,86,210,0.2)'
            }}
          >
            <div style={{ fontSize: `calc(24px * var(--fs, 1))` }}>👑</div>
            <div>
              <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: '#fff' }}>비즈니스 라이트 — 월 ₩9,900</div>
              <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.85)' }}>광고 없이 무제한 등록 (홍보글 제외)</div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: `calc(18px * var(--fs, 1))` }}>›</div>
          </div>
        )}

        {/* ✅ DRAFT 임시저장 복원 배너 */}
        {showDraftBanner && (
          <div style={{
            background: 'linear-gradient(135deg, #FFF3CD, #FFFBE6)',
            border: '1.5px solid #FFD60A',
            borderRadius: '14px', padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '14px',
          }}>
            <div style={{ fontSize: `calc(20px * var(--fs, 1))` }}>📝</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: '#7A5900' }}>임시저장된 글이 있습니다</div>
              <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#A07010', marginTop: '2px' }}>이전에 작성하다 중단된 내용을 복원할 수 있습니다.</div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => {
                  let saved = null;
                  try { saved = localStorage.getItem(DRAFT_KEY); } catch { /* StorageError 무시 */ }
                  if (saved) { setContent(saved); addToast('✅ 임시저장 내용을 복원했습니다.', 'success'); }
                  setShowDraftBanner(false);
                }}
                style={{ padding: '6px 12px', borderRadius: '10px', border: 'none', background: '#FFD60A', color: '#1A1A2E', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer' }}
              >복원</button>
              <button
                onClick={() => {
                  try { localStorage.removeItem(DRAFT_KEY); } catch { /* StorageError 무시 */ }
                  setShowDraftBanner(false);
                }}
                style={{ padding: '6px 10px', borderRadius: '10px', border: '1px solid #E5E5EA', background: '#fff', color: '#8E8E93', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer' }}
              >삭제</button>
            </div>
          </div>
        )}

        {/* 카테고리 선택 */}
        <div
          onClick={() => setShowCategoryPopup(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', backgroundColor: '#f8f9fa', borderRadius: '12px',
            marginBottom: '16px', cursor: 'pointer', border: '1px solid #eee'
          }}
        >
          <span style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '800', color: '#0056D2' }}>{category}</span>
          <ChevronDown size={14} color="#0056D2" />
        </div>

        {/* ✅ MASTER-AUTHOR-EDIT: 마스터 전용 작성자 닉네임 수정 필드 */}
        {isAdmin && isEditMode && (
          <div style={{ marginBottom: '16px', padding: '10px 14px', backgroundColor: '#FFF3CD', borderRadius: '10px', border: '1.5px solid #FFC107' }}>
            <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#856404', fontWeight: '900', marginBottom: '6px' }}>
              🔑 MASTER 전용 — 작성자 닉네임 수정
            </div>
            <input
              type="text"
              value={editAuthor}
              onChange={(e) => setEditAuthor(e.target.value.slice(0, 12))}
              placeholder="변경할 닉네임 (2~12자)"
              maxLength={12}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '8px',
                border: '1px solid #FFC107', fontSize: `calc(14px * var(--fs, 1))`,
                fontWeight: '700', backgroundColor: '#fff', boxSizing: 'border-box', outline: 'none',
              }}
            />
            <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: '#856404', marginTop: '4px' }}>
              ⚠️ author_email(인증정보)은 변경되지 않습니다. 표시 닉네임만 변경됩니다.
            </div>
          </div>
        )}

        {/* ✅ PHOTO-UX: 사진 업로드를 스크롤 본문에 배치 — fixed 툴바 실록 제거 */}
        {/* 사진이 늘어나도 textarea가 키보드에 가려지지 않음 */}
        <MultiImageUpload
          images={images}
          onChange={setImages}
          maxCount={5}
          isLoading={imageLoading}
          label="사진 추가"
        />

        {/* 공지사항 제목 입력 */}
        {isNoticeType && (
          <>
            <input
              placeholder="공지 제목을 입력하세요"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', border: 'none', borderBottom: '1.5px solid #eee', fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '800', padding: '0 0 14px', marginBottom: '10px', outline: 'none', color: '#1A1A2E' }}
            />
            {/* ✅ POPUP-CTRL: 홈화면 팝업 지정 체크박스 */}
            <div
              onClick={() => setIsPopup(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', marginBottom: '14px',
                borderRadius: '12px', cursor: 'pointer', userSelect: 'none',
                background: isPopup ? 'rgba(255,59,48,0.06)' : '#F8F9FA',
                border: `1.5px solid ${isPopup ? '#FF3B30' : '#E5E5EA'}`,
                transition: 'all 0.15s',
              }}
            >
              {/* 커스텀 체크박스 */}
              <div style={{
                width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                border: `2px solid ${isPopup ? '#FF3B30' : '#C7C7CC'}`,
                background: isPopup ? '#FF3B30' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {isPopup && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: isPopup ? '#FF3B30' : '#1c1c1e' }}>
                  🔔 홈화면 팝업으로 노출
                </div>

                <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#8E8E93', marginTop: '2px' }}>
                  체크 시 홈화면 시작 시 팝업으로 표시됩니다 (이미지 첨부 권장)
                </div>
              </div>
              <span style={{ fontSize: `calc(18px * var(--fs, 1))` }}>{isPopup ? '🔔' : '🔕'}</span>
            </div>
          </>
        )}

        {/* 텍스트 입력 영역 */}
        <textarea
          placeholder={isNoticeType ? '공지 내용을 입력하세요.' : '현장 상황이나 조과를 자유롭게 공유해보세요. (예: 현재 강릉항 파고가 높습니다!)'}
          style={{ width: '100%', minHeight: '160px', border: 'none', fontSize: `calc(16px * var(--fs, 1))`, lineHeight: '1.6', outline: 'none', resize: 'none', boxSizing: 'border-box', marginTop: '12px' }}
          onChange={(e) => setContent(e.target.value)}
          value={content}
        />

        {/* ✅ LOC-2: 위치 UI — 3상태: [없음|순수입력], [수정중], [확정] */}
        {/* ── 직접 텍스트 입력 모드 (GPS 없이 주소 타이핑) ── */}
        {!location && !locEditMode && null /* 직접입력은 툴바 버튼으로 진입 */}

        {/* ── 직접 입력 모드 (locEditMode=true, location=null) ── */}
        {locEditMode && !location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(0,86,210,0.06)', border: '1.5px solid #0056D2',
              borderRadius: '20px', padding: '6px 12px',
            }}>
              <MapPin size={13} color="#0056D2" style={{ flexShrink: 0 }} />
              <input
                ref={locInputRef}
                type="text"
                value={locDraft}
                onChange={e => setLocDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const addr = locDraft.trim();
                    if (addr) { setLocation({ lat: null, lng: null, address: addr }); setLocEditMode(false); addToast(`📍 위치 저장: ${addr}`, 'success'); }
                    else { setLocEditMode(false); }
                  }
                  if (e.key === 'Escape') { setLocEditMode(false); setLocDraft(''); }
                }}
                placeholder="낚시 위치를 입력하세요 (ex. 강릉항 방파제)"
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '700', color: '#0056D2', background: 'transparent' }}
                autoFocus
              />
            </div>
            {/* 확인 버튼 */}
            <button
              onClick={() => {
                const addr = locDraft.trim();
                if (addr) { setLocation({ lat: null, lng: null, address: addr }); setLocEditMode(false); addToast(`📍 위치 저장: ${addr}`, 'success'); }
                else { setLocEditMode(false); }
              }}
              style={{ flexShrink: 0, padding: '5px 12px', borderRadius: '16px', border: 'none', background: '#0056D2', color: '#fff', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer' }}
            >확인</button>
            {/* 취소 버튼 */}
            <button
              onClick={() => { setLocEditMode(false); setLocDraft(''); }}
              style={{ flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#f0f0f0', color: '#888', fontSize: `calc(14px * var(--fs, 1))`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            ><X size={14} /></button>
          </div>
        )}

        {/* ── 위치 확정 상태 (locEditMode=true, location 있음) ── 수정중 */}
        {locEditMode && location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(0,86,210,0.06)', border: '1.5px solid #0056D2',
              borderRadius: '20px', padding: '6px 12px',
            }}>
              <MapPin size={13} color="#0056D2" style={{ flexShrink: 0 }} />
              <input
                ref={locInputRef}
                type="text"
                value={locDraft}
                onChange={e => setLocDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const addr = locDraft.trim();
                    if (addr) { setLocation(prev => ({ ...prev, address: addr })); }
                    setLocEditMode(false);
                    if (addr) addToast(`📍 수정 완료: ${addr}`, 'success');
                  }
                  if (e.key === 'Escape') { setLocEditMode(false); }
                }}
                placeholder="낚시 위치를 수정하세요"
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '700', color: '#0056D2', background: 'transparent' }}
                autoFocus
              />
            </div>
            {/* 확인 */}
            <button
              onClick={() => {
                const addr = locDraft.trim();
                if (addr) { setLocation(prev => ({ ...prev, address: addr })); addToast(`📍 수정 완료: ${addr}`, 'success'); }
                setLocEditMode(false);
              }}
              style={{ flexShrink: 0, padding: '5px 12px', borderRadius: '16px', border: 'none', background: '#0056D2', color: '#fff', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer' }}
            >확인</button>
            {/* 취소 */}
            <button
              onClick={() => setLocEditMode(false)}
              style={{ flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#f0f0f0', color: '#888', fontSize: `calc(14px * var(--fs, 1))`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            ><X size={14} /></button>
          </div>
        )}

        {/* ── 위치 확정 배지 (수정 모드 아닐 때) ── */}
        {location && !locEditMode && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '10px', maxWidth: '100%' }}>
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: 'rgba(0,86,210,0.08)', border: '1.5px solid rgba(0,86,210,0.25)',
                borderRadius: '20px', padding: '6px 12px',
                fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '700', color: '#0056D2',
                maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              <MapPin size={13} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{location.address}</span>
            </div>
            {/* ✏️ 수정 버튼 */}
            <button
              onClick={() => { setLocDraft(location.address); setLocEditMode(true); }}
              style={{ flexShrink: 0, padding: '4px 10px', borderRadius: '14px', border: '1px solid rgba(0,86,210,0.3)', background: 'rgba(0,86,210,0.06)', color: '#0056D2', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer' }}
            >✏️ 수정</button>
            {/* ❌ 제거 버튼 */}
            <button
              onClick={() => { setLocation(null); setLocDraft(''); addToast('📍 위치가 제거되었습니다.', 'info'); }}
              style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%', border: 'none', background: '#f0f0f0', color: '#888', fontSize: `calc(12px * var(--fs, 1))`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            ><X size={12} /></button>
          </div>
        )}

        {/* 하단 툴바 */}
        <div style={{
          position: 'fixed', bottom: 0,
          left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: '480px',
          padding: '12px 20px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
          backgroundColor: '#fff',
          borderTop: '1px solid #f0f0f0',
          zIndex: 200,
        }}>
          {/* 툴바: 위치 추가 + AI 자동 일지만 유지 (사진은 본문 영역으로 이동됨) */}

          {/* 하단 액션 행 */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px', alignItems: 'center' }}>
            {/* 위치 추가 버튼 */}
            <div
              onClick={async () => {
                if (location) { setLocDraft(location.address); setLocEditMode(true); return; }
                if (locEditMode) { setLocEditMode(false); setLocDraft(''); return; }
                if (!navigator.geolocation) { setLocEditMode(true); return; }
                setLocLoading(true);
                navigator.geolocation.getCurrentPosition(
                  async (pos) => {
                    if (!isMountedRef.current) return; // ✅ BUG-WP01 FIX: GPS 응답 전 언마운트 확인
                    const { latitude: lat, longitude: lng } = pos.coords;
                    let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                    try {
                      await new Promise((resolve) => {
                        if (window.kakao?.maps?.services?.Geocoder) { resolve(); return; }
                        // ✅ BUG-WP02 FIX: window.kakao.maps가 undefined일 수 있음 (Kakao SDK 부분 로드)
                        if (!window.kakao?.maps?.load) { resolve(); return; }
                        window.kakao.maps.load(resolve);
                      });
                      if (!window.kakao?.maps?.services?.Geocoder) throw new Error('Geocoder not available');
                      const geocoder = new window.kakao.maps.services.Geocoder();
                      await new Promise((resolve) => {
                        geocoder.coord2Address(lng, lat, (result, status) => {
                          if (status === window.kakao.maps.services.Status.OK && result[0]) {
                            const road = result[0].road_address?.address_name;
                            const jibun = result[0].address?.address_name;
                            address = road || jibun || address;
                          }
                          resolve();
                        });
                      });
                    } catch { /* 역지오코딩 실패 시 좌표 문자열 사용 */ }
                    if (!isMountedRef.current) return; // ✅ BUG-WP01 FIX: 역지오코딩 완료 후 언마운트 재확인
                    setLocation({ lat, lng, address });
                    setLocLoading(false);
                    addToast(`📍 위치 추가: ${address}`, 'success');
                  },
                  (err) => {
                    if (!isMountedRef.current) return; // ✅ BUG-WP01 FIX: 에러 캐릭백도 언마운트 확인
                    setLocLoading(false);
                    addToast('GPS 권한이 없습니다. 직접 입력해주세요.', 'info');
                    setLocEditMode(true);
                  },
                  { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
                );
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: (location || locEditMode) ? '#0056D2' : locLoading ? '#FF9B26' : '#666', fontSize: `calc(13px * var(--fs, 1))`, cursor: locLoading ? 'not-allowed' : 'pointer' }}
            >
              <MapPin size={16} color={(location || locEditMode) ? '#0056D2' : locLoading ? '#FF9B26' : '#666'} />
              <span style={{ fontWeight: '600' }}>
                {locLoading ? '위치 가져오는 중...' : location ? '위치 수정' : locEditMode ? '입력 중...' : '위치 추가'}
              </span>
            </div>

            {/* AI 자동 일지 버튼 */}
            <div
              onClick={async () => {
                if (!images.length) { addToast('사진을 먼저 올려주세요.', 'error'); return; }
                setAiAnalyzing(true);
                const template = `\n\n🤖 AI 조황 일지\n\n📍 낚시 장소: \n🐟 어종: \n📏 씨알 / 마릿수: \n🎣 채비 / 미끼: \n🌊 날씨 / 파고: \n💬 현장 메모: `;
                try {
                  const res = await apiClient.post('/api/ai/analyze', { image: images[0] }, { timeout: 15000 });
                  if (res.data?.text) {
                    setContent((prev) => prev + '\n\n🤖 [AI 자동 일지]\n' + res.data.text);
                  } else {
                    setContent((prev) => prev + template);
                  }
                } catch {
                  setContent((prev) => prev + template);
                } finally {
                  setAiAnalyzing(false);
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1565C0', fontSize: `calc(13px * var(--fs, 1))`, cursor: 'pointer', background: 'rgba(21,101,192,0.1)', padding: '6px 12px', borderRadius: '16px', marginLeft: 'auto', border: '1px solid rgba(21,101,192,0.3)' }}
            >
              <Scan size={16} />
              <span style={{ fontWeight: '800', color: aiAnalyzing ? '#FF9B26' : undefined }}>
                {aiAnalyzing ? 'AI 판별 중...' : 'AI 자동 일지'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 카테고리 모달 */}
      {showCategoryPopup && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div className="bottom-sheet open" style={{ height: 'auto', padding: '24px 20px', maxWidth: '480px', margin: '0 auto' }}>
            <div className="sheet-handle"></div>
            <h3 style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '800', marginBottom: '20px' }}>장르 선택</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {categories.map(c => (
                <div key={c} onClick={() => { setCategory(c); setShowCategoryPopup(false); }}
                  style={{ padding: '16px', borderRadius: '12px', backgroundColor: category === c ? 'rgba(0,86,210,0.05)' : '#f8f9fa', border: category === c ? '1.5px solid #0056D2' : '1.5px solid transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <span style={{ fontWeight: category === c ? '800' : '600', color: category === c ? '#0056D2' : '#333' }}>{c}</span>
                  {category === c && <CheckCircle2 size={16} color="#0056D2" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 보상형 광고 게이트 모달 */}
      <RewardGateModal
        isOpen={showAdGate}
        onClose={() => setShowAdGate(false)}
        onRewardComplete={doPost}
        onSubscribe={handleSubscribe}
        context="post"
      />
    </div>
  );
}
