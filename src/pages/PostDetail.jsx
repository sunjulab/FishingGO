import { useTheme } from '../hooks/useTheme';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Heart, MessageSquare, Send, ChevronLeft, Share2, User, MoreVertical, Edit2, Trash2, MapPin, ShoppingBag, ChevronRight, ExternalLink } from 'lucide-react';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import apiClient from '../api/index';
import ImageGallery from '../components/ImageGallery';
import { shareExternal } from '../utils/shareUtils';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

const CATEGORY_COLORS = {
  '찌낚시': '#0056D2', '루어': '#FF5A5F', '선상': '#FF9B26',
  '에깅': '#7C3AED', '원투': '#059669', '갯바위': '#DC2626', '민물': '#0891B2',
};


export default function PostDetail() {
  const T = useTheme(); // ✅ DARK-MODE
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  // 이전글/다음글 네비게이션 (CommunityTab이 전달한 postIds 배열)
  const postIds = location.state?.postIds || [];
  const currentIndex = location.state?.currentIndex ?? -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < postIds.length - 1;

  // 뒤로가기: postId + 탭 저장 → CommunityTab이 'open' 탭 + 해당 게시글로 스크롤 복원
  const goBack = () => {
    sessionStorage.setItem('community_return_post_id', id);
    sessionStorage.setItem('community_return_tab', 'open');
    // ✅ HISTORY-FIX: 딥링크 직접 진입 시 history 없으면 /community 폴백
    if (window.history.length <= 1) {
      navigate('/community', { replace: true });
    } else {
      navigate(-1);
    }
  };

  // 이전글/다음글 이동 (replace로 히스토리 누적 방지)
  const navigateToPost = (newIndex) => {
    const targetId = postIds[newIndex];
    // ✅ NAV-FIX: postId + 탭 저장 — 뒤로가기 시 CommunityTab이 'open' 탭 + 마지막 본 글로 복원
    sessionStorage.setItem('community_return_post_id', targetId);
    sessionStorage.setItem('community_return_tab', 'open');
    navigate(`/post/${targetId}`, {
      replace: true,
      state: { postIds, currentIndex: newIndex },
    });
  };
  const user = useUserStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [coupangProducts, setCoupangProducts] = useState([]);

  // 게시글 키워드 추출 함수
  const extractKeyword = (p) => {
    if (!p) return '낚시 채비';
    const cat = p.category || '';
    const content = p.content || '';
    const fishMatch = content.match(/(감성돔|벵에돔|참돔|방어|광어|대구|우럭|농어|삼치|고등어|갈치|볼락|도다리|문어|쭈꾸미|갑오징어|배스|붕어|잉어|쏘가리|민어|돌돔|청어|숭어|학공치)/);
    const fish = fishMatch ? fishMatch[0] : '';
    if (fish && cat) return `${cat} ${fish} 채비`;
    if (cat) return `${cat} 낚시 장비`;
    if (fish) return `${fish} 낚시 채비`;
    return '낚시 채비 추천';
  };

  // 수정/삭제 상태
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ✅ 11TH-A3: state.isAdmin() 셉렉터 → ADMIN_ID/EMAIL 직접 비교 (3RD-A2 표준으로 통일)
  const isAdmin = useUserStore((state) =>
    state.user?.id === ADMIN_ID || state.user?.email === ADMIN_EMAIL
  );
  // ✅ NEW-C3: effectiveUser dead alias 제거 — user 직접 사용
  const isAuthor = post && user && post.author_email === user.email;
  const canEdit = isAdmin || isAuthor;

  // ENH4-C3: deleteComment 로컬 롤백 최적화 — fetchPost() 전체 재로드 제거
  const deleteComment = async (commentId) => {
    const originalComments = post?.comments ? [...post.comments] : [];
    try {
      // Optimistic UI: 즉시 제거
      setPost(prev => ({ ...prev, comments: originalComments.filter(c => (c._id?.toString() || c.id) !== commentId) }));
      await apiClient.delete(`/api/community/posts/${id}/comments/${commentId}`);
    } catch (err) {
      addToast(err.response?.data?.error || '삭제 실패했습니다.', 'error');
      // ENH4-C3: 로컬 댓글 상태만 복원 (fetchPost() 전체 재로드 제거)
      setPost(prev => ({ ...prev, comments: originalComments }));
    }
  };


  // ✅ 24TH-B1: fetchPost를 useCallback으로 감싸 — eslint-disable-line 없이 useEffect deps에 안전하게 포함 (23TH-C4 NoticeDetail 패턴)
  const fetchPost = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiClient.get(`/api/community/posts/${id}`);
      setPost(res.data);
      // 이미 좋아요한 경우 liked 상태 초기화 (새로고침 중복 방지)
      if (user?.email && Array.isArray(res.data.likedBy)) {
        setLiked(res.data.likedBy.includes(user.email));
      }
    } catch (err) {
      if (err.response?.status === 404) setError('게시글을 찾을 수 없습니다.');
      else setError('네트워크 오류가 발생했습니다.');
    } finally { setLoading(false); }
  }, [id, user?.email]); // ✅ BUG-FIX: addToast는 fetchPost 내부에서 미사용 — 불필요한 deps 제거

  // ✅ NAV-FIX: 이전글/다음글 이동 시 id 바뀌면 상태 즉시 초기화
  // setLoading(true) 필수 — post=null만 하면 252줄 if(!post) 조건에 걸려 에러화면 잠깐 표시됨
  useEffect(() => {
    setLoading(true);
    setPost(null);
    setError(null);
    setLiked(false);
    setComment('');
    setCoupangProducts([]);
  }, [id]);

  // ✅ NEW-A4: user?.email deps 추가 — 로그인 직후 likedBy stale 방지
  // ✅ 24TH-B1: fetchPost가 useCallback으로 안정화되어 eslint-disable 없이 deps 포함
  useEffect(() => { fetchPost(); }, [fetchPost]);

  // 게시글 로드 완료 후 쿠팡 상품 검색
  useEffect(() => {
    if (!post) return;
    const kw = extractKeyword(post);
    apiClient.get(`/api/commerce/coupang/search?keyword=${encodeURIComponent(kw)}`)
      .then(res => { if (res.data.products?.length) setCoupangProducts(res.data.products.slice(0, 5)); })
      .catch(() => {}); // 실패해도 UI에 영향 없음
  }, [String(post?._id)]); // eslint-disable-line react-hooks/exhaustive-deps // ✅ ID-FIX: ObjectId → string 비교

  const handleLike = async () => {
    if (user?.id === 'GUEST') { addToast('로그인이 필요한 기능입니다.', 'error'); return; }
    if (liked) { addToast('이미 좋아요를 눌렀습니다. ❤️', 'info'); return; }

    // ✅ Optimistic UI — 즉시 반영
    setLiked(true);
    setPost(prev => ({ ...prev, likes: (prev?.likes || 0) + 1 }));

    try {
      const res = await apiClient.patch(`/api/community/posts/${id}/like`);
      // 서버 실제 likes 수로 정밀 동기화
      if (typeof res.data?.likes === 'number') {
        setPost(prev => ({ ...prev, likes: res.data.likes }));
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        // 서버 기준 이미 좋아요 → liked 상태 유지, likes 수 서버값으로 동기화
        if (typeof err.response?.data?.likes === 'number') {
          setPost(prev => ({ ...prev, likes: err.response.data.likes }));
        }
        return;
      }
      // 401 / 네트워크 오류 → Optimistic 롤백
      setLiked(false);
      setPost(prev => ({ ...prev, likes: Math.max((prev?.likes || 1) - 1, 0) }));
      if (status === 401) addToast('로그인이 필요합니다.', 'error');
    }
  };

  const submitComment = async () => {
    if (!user) { addToast('로그인이 필요합니다.', 'error'); return; } // BUG-32: null 방어
    if (user?.id === 'GUEST') { addToast('로그인이 필요합니다.', 'error'); return; }
    if (!comment.trim() || submitting) return;
    if (comment.trim().length > 500) { addToast('댓글은 500자 이내로 작성해주세요.', 'error'); return; }
    setSubmitting(true);
    try {
      const res = await apiClient.post(`/api/community/posts/${id}/comments`, {
        author: user.name,
        author_email: user.email || '',
        text: comment.trim()
      });

      setPost(res.data);
      setComment('');
      const userId = user.email || user.id;
      if (userId) {
        apiClient.post('/api/user/exp', { userId, action: 'comment_write' }).catch(() => { });
      }
    } catch (err) {
      // ENH4-B2: 코멘트 등록 실패 시 에러 토스트 노출 (이전: 빈 catch)
      addToast(err.response?.data?.error || '코멘트 등록에 실패했습니다.', 'error');
    } finally { setSubmitting(false); }
  };

  // ✅ EDIT-FULL: 인라인 모달 → WritePost 전체화면 수정으로 교체
  const openEdit = () => {
    setShowMenu(false);
    navigate(`/write?type=open&editId=${id}`);
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/api/community/posts/${id}`, {
        data: { email: user.email }
      });
      addToast('삭제되었습니다.', 'success');
      navigate('/community');
    } catch (err) {
      addToast(err.response?.data?.error || '삭제 실패.', 'error');
    }
  };

  // ✅ SHARE-EXT: shareUtils 유틸 사용 — Web Share API(네이티브 공유 시트) 우선
  const handleShare = useCallback(async () => {
    await shareExternal({
      title: `낚시GO | ${post?.author}님의 조황`,
      text:  post?.content?.slice(0, 80) || '낚시GO에서 조황을 확인하세요!',
      url:   window.location.href,
      imgUrl: post?.image,
      addToast,
    });
  }, [post?.author, post?.content, post?.image, addToast]);

  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #0056D2', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: `calc(14px * var(--fs, 1))`, color: T.textLight, fontWeight: '700' }}>불러오는 중...</div>
    </div>
  );

  if (error || !post) return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center', gap: '16px' }}>
      <div style={{ fontSize: `calc(48px * var(--fs, 1))` }}>🎣</div>
      <div style={{ fontSize: `calc(16px * var(--fs, 1))`, color: T.textSub, fontWeight: '700' }}>{error || '게시글을 찾을 수 없습니다.'}</div>
      <button onClick={goBack} style={{ padding: '12px 28px', backgroundColor: '#0056D2', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: `calc(15px * var(--fs, 1))`, cursor: 'pointer' }}>뒤로 가기</button>
    </div>
  );

  const categoryColor = CATEGORY_COLORS[post.category] || '#666';
  const commentCount = Array.isArray(post.comments) ? post.comments.length : (post.comments || 0);

  return (
    <div className="page-container" style={{ backgroundColor: T.card, height: '100dvh', display: 'flex', flexDirection: 'column', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* 헤더 — ✅ SAFE-AREA: 노치/다이나믹아일랜드 자동 회피 */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: T.card, borderBottom: '1px solid #F0F2F7', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={goBack} style={{ border: 'none', background: T.cardSub, padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex' }}>
          <ChevronLeft size={20} color="#1A1A2E" />
        </button>
        <span style={{ flex: 1, fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '950', color: T.text, textAlign: 'center' }}>조황 게시글</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={handleShare} style={{ border: 'none', background: T.cardSub, padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex' }}>
            <Share2 size={18} color="#666" />
          </button>
          {canEdit && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowMenu(v => !v)} style={{ border: 'none', background: T.cardSub, padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex' }}>
                <MoreVertical size={18} color="#666" />
              </button>
              {showMenu && (
                <div style={{ position: 'absolute', top: '44px', right: 0, background: T.card, borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #F0F2F7', zIndex: 200, minWidth: '130px', overflow: 'hidden' }}>
                  <button onClick={openEdit} style={{ width: '100%', padding: '13px 16px', border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '700', color: T.text, cursor: 'pointer', textAlign: 'left' }}>
                    <Edit2 size={15} color="#0056D2" /> 수정하기
                  </button>
                  <div style={{ height: '1px', background: '#F0F2F7' }} />
                  <button onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }} style={{ width: '100%', padding: '13px 16px', border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '700', color: '#FF3B30', cursor: 'pointer', textAlign: 'left' }}>
                    <Trash2 size={15} color="#FF3B30" /> 삭제하기
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 이전글/다음글 네비게이션 바 */}
      {postIds.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', backgroundColor: T.cardSub, borderBottom: '1px solid #F0F2F7', flexShrink: 0 }}>
          <button
            onClick={() => hasPrev && navigateToPost(currentIndex - 1)}
            disabled={!hasPrev}
            style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '6px 12px', borderRadius: '10px', border: 'none', background: hasPrev ? '#E8F0FE' : 'transparent', color: hasPrev ? '#0056D2' : '#D0D5E0', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', cursor: hasPrev ? 'pointer' : 'default', transition: 'all 0.15s' }}
          >
            <ChevronLeft size={13} /> 이전글
          </button>
          <span style={{ fontSize: `calc(11px * var(--fs, 1))`, color: T.textLight, fontWeight: '700' }}>
            {currentIndex >= 0 ? `${currentIndex + 1} / ${postIds.length}` : `1 / ${postIds.length}`}
          </span>
          <button
            onClick={() => hasNext && navigateToPost(currentIndex + 1)}
            disabled={!hasNext}
            style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '6px 12px', borderRadius: '10px', border: 'none', background: hasNext ? '#E8F0FE' : 'transparent', color: hasNext ? '#0056D2' : '#D0D5E0', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', cursor: hasNext ? 'pointer' : 'default', transition: 'all 0.15s' }}
          >
            다음글 <ChevronRight size={13} />
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '90px' }} onClick={() => setShowMenu(false)}>
        {/* 게시글 카드 */}
        <div style={{ backgroundColor: T.card, margin: '12px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* ✅ FOLLOW-ENH: 작성자 아바타+닉네임 클릭 → 프로필 페이지 이동 */}
            <div
              onClick={() => navigate(`/user/${encodeURIComponent(post.author)}`)}
              style={{ width: '46px', height: '46px', borderRadius: '14px', background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '950', fontSize: `calc(18px * var(--fs, 1))`, flexShrink: 0, cursor: 'pointer' }}
            >
              {post.author?.[0] || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  onClick={() => navigate(`/user/${encodeURIComponent(post.author)}`)}
                  style={{ fontWeight: '950', fontSize: `calc(15px * var(--fs, 1))`, color: T.text, cursor: 'pointer' }}
                >{post.author}</span>
                <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', padding: '2px 8px', borderRadius: '6px', background: `${categoryColor}18`, color: categoryColor }}>{post.category}</span>
              </div>
              <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: T.textLight, fontWeight: '700', marginTop: '2px' }}>{timeAgo(post.createdAt)}</div>
            </div>
          </div>


          {/* ✅ MULTI-IMG: 다중 이미지 갤러리 (images 배열 우선, image 단일 필드 하위호환) */}
          {(Array.isArray(post.images) && post.images.length > 0) || post.image ? (
            <ImageGallery
              images={post.images}
              image={post.image}
              maxHeight={320}
              borderRadius="0"
              showZoom={true}
            />
          ) : null}

          <div style={{ padding: '16px 18px' }}>
            <p style={{ fontSize: `calc(15px * var(--fs, 1))`, lineHeight: '1.75', color: T.text, fontWeight: '600', whiteSpace: 'pre-wrap', margin: 0 }}>{post.content}</p>
            {/* ✅ LOC-3 + INSTA-P2: 위치 배지 — 앱 내 지도 + 카카오맵 연동 */}
            {post.location?.address && (
              <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                {/* 앱 내 지도 이동 */}
                {post.location.lat && (
                  <div
                    onClick={() => navigate(`/?lat=${post.location.lat}&lng=${post.location.lng}`)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      background: 'rgba(0,86,210,0.07)', border: '1px solid rgba(0,86,210,0.2)',
                      borderRadius: '20px', padding: '5px 11px',
                      fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '700', color: '#0056D2', cursor: 'pointer',
                    }}
                  >
                    <MapPin size={12} />
                    <span>{post.location.address}</span>
                    <span style={{ fontSize: `calc(10px * var(--fs, 1))`, opacity: 0.7 }}>→ 지도</span>
                  </div>
                )}
                {/* 카카오맵 */}
                {post.location.lat && (
                  <div
                    onClick={() => window.open(`https://map.kakao.com/link/map/${encodeURIComponent(post.location.address)},${post.location.lat},${post.location.lng}`, '_blank')}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      background: '#FFF9C4', border: '1px solid #F9C400',
                      borderRadius: '20px', padding: '5px 11px',
                      fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '700', color: '#7C5000', cursor: 'pointer',
                    }}
                  >
                    🗺️ 카카오맵
                  </div>
                )}
                {/* 좌표 없이 주소만 있을 때 */}
                {!post.location.lat && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(0,86,210,0.07)', border: '1px solid rgba(0,86,210,0.2)', borderRadius: '20px', padding: '5px 11px', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '700', color: '#0056D2' }}>
                    <MapPin size={12} /><span>{post.location.address}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ padding: '12px 18px 16px', display: 'flex', gap: '20px', borderTop: '1px solid #F8F8F8' }}>
            <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '800', color: liked ? '#FF5A5F' : '#AAB0BE', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
              <Heart size={18} fill={liked ? '#FF5A5F' : 'none'} color={liked ? '#FF5A5F' : '#AAB0BE'} />
              <span>{post.likes || 0}</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '800', color: T.textLight }}>
              <MessageSquare size={18} /><span>{commentCount}</span>
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────
            🛒 추천 낚시용품 (쿠팡) — 게시글 키워드 기반
        ────────────────────────────────────────── */}
        {coupangProducts.length > 0 && (
          <div style={{ margin: '8px 12px', backgroundColor: T.card, borderRadius: '20px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            {/* 섹션 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '3px', height: '18px', background: '#FF5A5F', borderRadius: '2px' }} />
                <ShoppingBag size={15} color="#FF5A5F" />
                <span style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '950', color: T.text }}>이 낚시에 어울리는 용품</span>
              </div>
              <button
                onClick={() => navigate('/shop')}
                style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '800', color: '#0056D2', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
              >
                전체보기 <ChevronRight size={13} />
              </button>
            </div>

            {/* 상품 가로 스크롤 */}
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
              {coupangProducts.map((item, idx) => (
                <div
                  key={String(item.productId || item.id || idx)}
                  onClick={() => navigate('/shop')}
                  style={{
                    flexShrink: 0, width: '130px', background: T.cardSub,
                    borderRadius: '16px', overflow: 'hidden', cursor: 'pointer',
                    border: '1.5px solid #F0F2F7', transition: 'transform 0.15s',
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {/* 상품 이미지 */}
                  <div style={{ width: '130px', height: '100px', overflow: 'hidden', background: '#eee' }}>
                    <img
                      src={item.img}
                      alt={item.name}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  {/* 상품 정보 */}
                  <div style={{ padding: '8px 8px 10px' }}>
                    <div style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '800', color: T.text, lineHeight: '1.35', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '950', color: T.text }}>{item.price}</span>
                      {item.discount && (
                        <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', color: '#FF5A5F', background: 'rgba(255,90,95,0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                          {item.discount}↓
                        </span>
                      )}
                    </div>
                    {/* 쿠팡 구매 버튼 */}
                    <div style={{ marginTop: '6px', padding: '5px 0', background: 'linear-gradient(135deg,#FF5A5F,#FF3B30)', borderRadius: '8px', textAlign: 'center', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                      <ExternalLink size={9} /> 쿠팡 구매
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: `calc(10px * var(--fs, 1))`, color: T.textLight, fontWeight: '600', textAlign: 'right', marginTop: '8px', margin: '8px 0 0' }}>
              이 포스팅은 쿠팡 파트너스 활동의 일환으로 수수료를 받을 수 있습니다
            </p>
          </div>
        )}

        {/* 댓글 목록 */}
        <div style={{ margin: '0 12px', backgroundColor: T.card, borderRadius: '20px', padding: '16px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '950', color: T.text, marginBottom: '16px' }}>댓글 {commentCount}</h3>
          {Array.isArray(post.comments) && post.comments.length > 0 ? (
            post.comments.map((c, idx) => (
              <div key={String(c._id || idx)} style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'flex-start' }}>
                <div
                  onClick={() => navigate(`/user/${encodeURIComponent(c.author)}`)}
                  style={{ width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0, background: 'linear-gradient(135deg, #F0F5FF, #E0ECFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', color: '#0056D2', cursor: 'pointer' }}
                >
                  {c.author ? c.author[0] : <User size={16} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span
                      onClick={() => navigate(`/user/${encodeURIComponent(c.author)}`)}
                      style={{ fontWeight: '800', fontSize: `calc(13px * var(--fs, 1))`, color: T.text, cursor: 'pointer' }}
                    >{c.author}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#D0D5E0', fontWeight: '700' }}>{timeAgo(c.createdAt)}</span>
                      {/* ✅ 본인 또는 어드민에게만 삭제 버튼 표시 */}
                      {(isAdmin || (user && c.author_email === user.email)) && (
                        <button
                          onClick={() => deleteComment(c._id?.toString() || c.id || String(c.createdAt))}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: '6px', color: '#FF3B30', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', lineHeight: 1 }}
                          title="댓글 삭제"
                        >×</button>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: `calc(14px * var(--fs, 1))`, color: '#444', lineHeight: '1.5', margin: 0, fontWeight: '600' }}>{c.text}</p>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#D0D5E0', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700' }}>첫 댓글을 남겨보세요! 🎣</div>
          )}
        </div>
      </div>

      {/* 댓글 입력창 — 컨테이너 safe-area padding이 이미 하단 처리 */}
      <div style={{ padding: '10px 16px', backgroundColor: T.card, borderTop: '1px solid #F0F2F7', display: 'flex', gap: '10px', alignItems: 'center', boxShadow: '0 -4px 16px rgba(0,0,0,0.06)' }}>
        <input
          placeholder="칭찬과 응원의 댓글을 남겨주세요 🎣"
          style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', backgroundColor: T.cardSub, border: 'none', outline: 'none', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '600', color: T.text }}
          value={comment} onChange={e => setComment(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitComment()}
        />
        <button onClick={submitComment} disabled={!comment.trim() || submitting}
          style={{ width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0, background: comment.trim() ? '#0056D2' : '#E5E5EA', border: 'none', cursor: comment.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
          <Send size={18} color={comment.trim() ? '#fff' : '#AAB0BE'} />
        </button>
      </div>


      {/* 삭제 확인 다이얼로그 */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: T.overlay, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: T.card, borderRadius: '20px', padding: '28px 24px', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
            <div style={{ fontSize: `calc(36px * var(--fs, 1))`, marginBottom: '12px' }}>🗑️</div>
            <div style={{ fontSize: `calc(17px * var(--fs, 1))`, fontWeight: '900', color: T.text, marginBottom: '8px' }}>게시글을 삭제할까요?</div>
            <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color: T.textLight, marginBottom: '24px' }}>삭제된 게시글은 복구할 수 없습니다.</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: '13px', border: `1.5px solid ${T.borderMid}`, borderRadius: '12px', background: T.card, fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer', color: T.textSub }}>취소</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '13px', border: 'none', borderRadius: '12px', background: '#FF3B30', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer', color: '#fff' }}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
