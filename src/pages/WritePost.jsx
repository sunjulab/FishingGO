import React, { useState, useEffect, useMemo, useRef } from 'react'; // ✅ 16TH-C1: useRef 추가
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Image, MapPin, Send, ChevronDown, CheckCircle2, Scan } from 'lucide-react';
import { RewardGateModal } from '../components/AdUnit';
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
  const [image, setImage] = useState('');
  const [imageLoading, setImageLoading] = useState(false); // 압축 중 상태
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false); // ✅ BUG-58: DOM 직접조작 → state 교체
  const [showDraftBanner, setShowDraftBanner] = useState(false); // 임시저장 복원 배너
  const imageInputRef = useRef(null); // ✅ 16TH-C1: DOM 직접 접근 제거 — useRef 패턴

  const categories = ['전체', '루어', '찌낚시', '원투', '릴찌', '선상', '에깅'];
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
  // ✅ NEW-B2: isNoticeType deps 추가 — type 쿼리 변경 시 stale 데이터 방지
  useEffect(() => {
    if (!isEditMode) return;
    const endpoint = isNoticeType
      ? `/api/community/notices/${editId}`
      : `/api/community/posts/${editId}`;
    apiClient.get(endpoint)
      .then(res => {
        setContent(res.data.content || '');
        setTitle(res.data.title || '');
        setCategory(res.data.category || '전체');
      })
      .catch((err) => {
        // ✅ 24TH-B3: silent catch → 에러 피드백 추가 (19TH-B1 패턴)
        if (!import.meta.env.PROD) console.warn('[WritePost] 수정 데이터 로드 실패:', err?.message);
        addToast('게시글 정보를 불러오지 못했습니다.', 'error');
      });
  }, [editId, isNoticeType]);

  // ✅ 6TH-B3: DRAFT_KEY useMemo — 매 렌더마다 재정의 방지 (postType이 렌더 중 불변)
  const DRAFT_KEY = useMemo(() => `draft_post_${postType}`, [postType]);

  useEffect(() => {
    if (isEditMode || isNoticeType) return; // 수정모드·공지는 draft 비활성화
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved && saved.trim().length > 0) setShowDraftBanner(true);
  }, [DRAFT_KEY, isEditMode, isNoticeType]);

  // ✅ DRAFT-2: 내용 변경 시 자동 저장 (500ms debounce)
  useEffect(() => {
    if (isEditMode || isNoticeType) return;
    const timer = setTimeout(() => {
      if (content.trim().length > 0) {
        localStorage.setItem(DRAFT_KEY, content);
      } else {
        localStorage.removeItem(DRAFT_KEY);
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
    if (isBusinessLite) { doPost(); } else { setShowAdGate(true); }
  };


  const doPost = async () => {
    setIsSubmitting(true);
    const storedUser = user;
    // ✅ FIX: 비회원(GUEST) 글쓰기 차단 — storedUser null 체크 + GUEST id 체크 이중 방어
    if (!storedUser || storedUser.id === 'GUEST') {
      addToast('로그인이 필요합니다. 마이페이지에서 로그인해주세요.', 'error');
      setIsSubmitting(false);
      return;
    }
    try {
      if (isNoticeType) {
        const method = isEditMode ? 'put' : 'post';
        const url = isEditMode ? `/api/community/notices/${editId}` : `/api/community/notices`;
        // ✅ POPUP: 공지 이미지를 payload에 포함 — 첫 이미지가 앱 시작 팝업 이미지로 자동 사용
        // image는 1MB 이하로 제한 (base64 DB 저장 MongoDB 용량 대비)
        const safeNoticeImage = (image && image.length > 1024 * 1024) ? null : (image || null);
        // ✅ BUG-41: 수정 모드에서 isPinned를 false로 덮어쓰지 않도록 제거
        const noticePayload = isEditMode
          ? { title: title.trim(), content, image: safeNoticeImage }
          : { title: title.trim(), content, isPinned: false, image: safeNoticeImage };
        await apiClient[method](url, noticePayload);
        addToast(isEditMode ? '📢 공지사항이 수정되었습니다!' : '📢 공지사항이 등록되었습니다!', 'success');
        navigate(isEditMode ? -1 : '/community?tab=notice');

      } else {
        const method = isEditMode ? 'put' : 'post';
        const url = isEditMode ? `/api/community/posts/${editId}` : `/api/community/posts`;
        // 이미지가 1MB 초과면 제외하고 전송 (MongoDB 16MB 제한 대비)
        const safeImage = (image && image.length > 1024 * 1024) ? null : (image || null);
        const body = isEditMode
          ? { content, category, email: storedUser.email }
          : { author: storedUser.name, author_email: storedUser.email, category, content, image: safeImage };
        await apiClient[method](url, body);
        // ✅ DRAFT-3: 등록 성공 시 draft 삭제
        if (!isEditMode) localStorage.removeItem(DRAFT_KEY);
        // EXP 서버 등록
        if (!isEditMode) {
          const userId = storedUser.email || storedUser.id;
          if (userId) apiClient.post('/api/user/exp', { userId, action: 'post_write' }).catch(() => { });
        }
        addToast(isEditMode ? '✅ 게시글이 수정되었습니다!' : '게시글이 등록되었습니다! 🎉', 'success');
        navigate(isEditMode ? -1 : '/community?tab=open');
      }
    } catch (err) {
      // ENH3-A4: 프로덕션에서 콘솔 스택 트레이스 노출 방지
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
      <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none' }}>
          <X size={24} color="#1c1c1e" />
        </button>
        <h2 style={{ fontSize: '17px', fontWeight: '800' }}>
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
            fontSize: '13px',
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
            <div style={{ fontSize: '24px' }}>👑</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '900', color: '#fff' }}>비즈니스 라이트 — 월 ₩9,900</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)' }}>광고 없이 무제한 등록 (홍보글 제외)</div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: '18px' }}>›</div>
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
            <div style={{ fontSize: '20px' }}>📝</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '900', color: '#7A5900' }}>임시저장된 글이 있습니다</div>
              <div style={{ fontSize: '11px', color: '#A07010', marginTop: '2px' }}>이전에 작성하다 중단된 내용을 복원할 수 있습니다.</div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => {
                  const saved = localStorage.getItem(DRAFT_KEY);
                  if (saved) { setContent(saved); addToast('✅ 임시저장 내용을 복원했습니다.', 'success'); }
                  setShowDraftBanner(false);
                }}
                style={{ padding: '6px 12px', borderRadius: '10px', border: 'none', background: '#FFD60A', color: '#1A1A2E', fontSize: '12px', fontWeight: '900', cursor: 'pointer' }}
              >복원</button>
              <button
                onClick={() => {
                  localStorage.removeItem(DRAFT_KEY);
                  setShowDraftBanner(false);
                }}
                style={{ padding: '6px 10px', borderRadius: '10px', border: '1px solid #E5E5EA', background: '#fff', color: '#8E8E93', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
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
            marginBottom: '20px', cursor: 'pointer', border: '1px solid #eee'
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: '800', color: '#0056D2' }}>{category}</span>
          <ChevronDown size={14} color="#0056D2" />
        </div>

        {/* 공지사항 제목 입력 */}
        {isNoticeType && (
          <input
            placeholder="공지 제목을 입력하세요"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: '100%', border: 'none', borderBottom: '1.5px solid #eee', fontSize: '18px', fontWeight: '800', padding: '0 0 14px', marginBottom: '14px', outline: 'none', color: '#1A1A2E' }}
          />
        )}

        {/* 텍스트 입력 영역 */}
        <textarea
          placeholder={isNoticeType ? '공지 내용을 입력하세요.' : '현장 상황이나 조과를 자유롭게 공유해보세요. (예: 현재 강릉항 파고가 높습니다!)'}
          style={{ width: '100%', minHeight: '200px', border: 'none', fontSize: '16px', lineHeight: '1.6', outline: 'none', resize: 'none' }}
          onChange={(e) => setContent(e.target.value)}
          value={content}
        />

        {/* 하단 툴바 */}
        <div style={{
          position: 'fixed', bottom: 0,
          left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: '480px',
          padding: '16px 20px', backgroundColor: '#fff',
          borderTop: '1px solid #f0f0f0', display: 'flex', gap: '20px',
          zIndex: 200,
        }}>
          <div
            onClick={() => imageInputRef.current?.click()} // ✅ 16TH-C1: document.getElementById → useRef
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: image ? '#0056D2' : '#666', fontSize: '14px', cursor: 'pointer' }}
          >
            <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
              const file = e.target.files[0];
              e.target.value = ''; // 동일 파일 재선택 가능하도록 초기화
              if (file) {
                setImageLoading(true);
                try {
                  const compressed = await fileToCompressedBase64(file, { maxWidth: 800, maxHeight: 800, quality: 0.80, preset: 'post' });
                  setImage(compressed);
                } catch (err) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImage(reader.result);
                  reader.readAsDataURL(file);
                } finally {
                  setImageLoading(false);
                }
              }
            }} />
            <div style={{ width: '36px', height: '36px', backgroundColor: image ? 'rgba(0,86,210,0.05)' : '#f8f9fa', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {imageLoading ? <span style={{ fontSize: '11px', color: '#0056D2', fontWeight: '800' }}>압축중</span> : <Image size={20} />}
            </div>
            <span style={{ fontWeight: '600' }}>{imageLoading ? '사진 처리 중...' : image ? '사진 추가됨' : '사진 추가'}</span>
          </div>
          {/* ENH3-B1: 위치 추가 준비 중 토스트 피드백 추가 */}
          <div
            onClick={() => addToast('📍 위치 추가 기능은 준비 중입니다.', 'info')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '14px', cursor: 'pointer' }}
          >
            <div style={{ width: '36px', height: '36px', backgroundColor: '#f8f9fa', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MapPin size={20} /></div>
            <span style={{ fontWeight: '600' }}>위치 추가</span>
          </div>
          <div
            onClick={async () => {
              if (!image) { addToast('사진을 먼저 올려주세요.', 'error'); return; }
              setAiAnalyzing(true);
              const sampleText = '\n\n🤖 [AI 샘플 분석 — 실제 연동 준비 중]\n- 어종: 감성돔 (참고용 예시)\n- 예상 길이: 약 45~50cm\n- 기상 데이터 연동 매핑 완료\n※ 현재 AI 기능은 샘플 모드입니다. 정확한 분석은 추후 업데이트됩니다.';
              // ENH3-B2: 서버 /api/ai/analyze 우선 시도 — 실패 시 샘플 fallback
              try {
                const res = await apiClient.post('/api/ai/analyze', { image }, { timeout: 15000 });
                if (res.data?.text) {
                  setContent((prev) => prev + '\n\n🤖 [AI 자동 일지]\n' + res.data.text);
                } else {
                  setContent((prev) => prev + sampleText);
                }
              } catch {
                // AI 서비스 미연동 또는 실패 시 샘플 텍스트 삽입
                setContent((prev) => prev + sampleText);
              } finally {
                setAiAnalyzing(false);
              }
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1565C0', fontSize: '13px', cursor: 'pointer', background: 'rgba(21,101,192,0.1)', padding: '6px 12px', borderRadius: '16px', marginLeft: 'auto', border: '1px solid rgba(21,101,192,0.3)' }}
          >
            <Scan size={16} />
            <span style={{ fontWeight: '800', color: aiAnalyzing ? '#FF9B26' : undefined }}>
              {aiAnalyzing ? 'AI 판별 중...' : 'AI 자동 일지'}
            </span>
          </div>
        </div>

        {image && (
          <div style={{ marginTop: '20px', position: 'relative', width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden' }}>
            <img src={image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div onClick={(e) => { e.stopPropagation(); setImage(''); }} style={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', padding: '4px', cursor: 'pointer' }}>
              <X size={12} />
            </div>
          </div>
        )}
      </div>

      {/* 카테고리 모달 */}
      {showCategoryPopup && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div className="bottom-sheet open" style={{ height: 'auto', padding: '24px 20px', maxWidth: '480px', margin: '0 auto' }}>
            <div className="sheet-handle"></div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>장르 선택</h3>
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
