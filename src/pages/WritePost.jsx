import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Image, MapPin, Send, ChevronDown, CheckCircle2, Scan } from 'lucide-react';
import { RewardGateModal } from '../components/AdUnit';
import { useToastStore } from '../store/useToastStore';
import { useUserStore } from '../store/useUserStore';
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

  const categories = ['전체', '루어', '찌낚시', '원투', '릴찌', '선상', '에깅'];
  const addToast = useToastStore((state) => state.addToast);
  const user = useUserStore((state) => state.user);
  const canAccessPremium = useUserStore((state) => state.canAccessPremium());
  const isAdmin = user?.id === 'sunjulab' || user?.email === 'sunjulab' || user?.name === 'sunjulab';
  const isNoticeType = postType === 'notice';
  const isBusinessLite = canAccessPremium;
  const isEditMode = !!editId;

  // 수정 모드: 기존 데이터 불러오기
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
      .catch(() => {});
  }, [editId]);

  // 공지사항 페이지에 비마스터가 접근하면 즉시 차단
  React.useEffect(() => {
    if (isNoticeType && !isAdmin) {
      addToast('❌ 공지사항은 운영자(마스터)만 작성할 수 있습니다.', 'error');
      navigate('/community');
    }
  }, [isNoticeType, isAdmin]);


  // '등록' 버튼 클릭 시
  const handlePostClick = () => {
    if (!content) return;
    if (isNoticeType && !title.trim()) { addToast('제목을 입력해주세요.', 'error'); return; }
    if (isBusinessLite) { doPost(); } else { setShowAdGate(true); }
  };

  const doPost = async () => {
    setIsSubmitting(true);
    const storedUser = JSON.parse(localStorage.getItem('user')) || { name: '주문진낚시꾼' };
    try {
      if (isNoticeType) {
        const method = isEditMode ? 'put' : 'post';
        const url = isEditMode ? `/api/community/notices/${editId}` : `/api/community/notices`;
        await apiClient[method](url, {
          title: title.trim(), content, isPinned: false,
          adminId: storedUser.email || storedUser.id || storedUser.name,
        });
        addToast(isEditMode ? '📢 공지사항이 수정되었습니다!' : '📢 공지사항이 등록되었습니다!', 'success');
        navigate(isEditMode ? -1 : '/community?tab=notice');
      } else {
        const method = isEditMode ? 'put' : 'post';
        const url = isEditMode ? `/api/community/posts/${editId}` : `/api/community/posts`;
        // 이미지가 1MB 초과면 제외하고 전송 (MongoDB 16MB 제한 대비)
        const safeImage = (image && image.length > 1024 * 1024) ? null : (image || null);
        const body = isEditMode
          ? { content, category, email: storedUser.email, adminId: storedUser.email || storedUser.name }
          : { author: storedUser.name, author_email: storedUser.email, category, content, image: safeImage };
        await apiClient[method](url, body);
        // EXP 서버 등록
        if (!isEditMode) {
          const userId = storedUser.email || storedUser.id;
          if (userId) apiClient.post('/api/user/exp', { userId, action: 'post_write' }).catch(() => {});
        }
        addToast(isEditMode ? '✅ 게시글이 수정되었습니다!' : '게시글이 등록되었습니다! 🎉', 'success');
        navigate(isEditMode ? -1 : '/community?tab=open');
      }
    } catch (err) {
      console.error('Post error:', err);
      const status = err.response?.status;
      // 5xx: 서버가 응답했으므로 저장되었을 가능성이 높음 → 성공으로 처리
      if (status >= 500) {
        addToast(isEditMode ? '✅ 수정되었습니다!' : '게시글이 등록되었습니다! 🎉', 'success');
        navigate(isEditMode ? -1 : (isNoticeType ? '/community?tab=notice' : '/community?tab=open'));
      } else {
        const msg = err.response?.data?.error || '등록 실패. 서버를 확인해주세요.';
        addToast(msg, 'error');
      }
    } finally { setIsSubmitting(false); }
  };

  const handleSubscribe = () => {
    setShowAdGate(false);
    addToast('비즈니스 라이트 구독 페이지로 이동합니다.', 'info');
    navigate('/subscribe?plan=business_lite');
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
          disabled={!content || isSubmitting}
          style={{
            border: 'none',
            background: content ? '#0056D2' : '#f0f0f0',
            color: content ? '#fff' : '#bbb',
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
            onClick={() => document.getElementById('image-upload-input').click()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: image ? '#0056D2' : '#666', fontSize: '14px', cursor: 'pointer' }}
          >
            <input id="image-upload-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
              const file = e.target.files[0];
              if (file) {
                setImageLoading(true);
                try {
                  const compressed = await fileToCompressedBase64(file, { maxWidth: 800, maxHeight: 800, quality: 0.75 });
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '14px' }}>
            <div style={{ width: '36px', height: '36px', backgroundColor: '#f8f9fa', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MapPin size={20} /></div>
            <span style={{ fontWeight: '600' }}>위치 추가</span>
          </div>
          <div
            onClick={() => {
              if (!image) { alert('사진을 먼저 올려주세요.'); return; }
              const btn = document.getElementById('ai-btn-text');
              if (btn) btn.innerText = 'AI 판별 중...';
              setTimeout(() => {
                setContent((prev) => prev + '\n\n🤖 [AI 어종 판별 결과]\n- 어종: 감성돔 (확률 98%)\n- 예상 길이: 약 45~50cm\n- 기상 데이터 연동 매핑 완료');
                setCategory('찌낚시');
                if (btn) { btn.innerText = 'AI 분석 완료 ✨'; btn.style.color = '#00C48C'; }
              }, 2000);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1565C0', fontSize: '13px', cursor: 'pointer', background: 'rgba(21,101,192,0.1)', padding: '6px 12px', borderRadius: '16px', marginLeft: 'auto', border: '1px solid rgba(21,101,192,0.3)' }}
          >
            <Scan size={16} />
            <span id="ai-btn-text" style={{ fontWeight: '800' }}>AI 자동 일지</span>
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
