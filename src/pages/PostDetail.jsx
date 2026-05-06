import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, MessageSquare, Send, ChevronLeft, Share2, User, MoreVertical, Edit2, Trash2, X, Check } from 'lucide-react';

import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore'; // ✅ 11TH-A3: ADMIN_ID/EMAIL import
import { useToastStore } from '../store/useToastStore';
import apiClient from '../api/index';

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
const CATEGORIES = ['전체', '루어', '찌낚시', '원투', '릴찌', '선상', '에깅'];

export default function PostDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useUserStore((state) => state.user);
  const addToast = useToastStore((state) => state.addToast);
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 수정/삭제 상태
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [saving, setSaving] = useState(false);
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
  }, [id, user?.email, addToast]);

  // ✅ NEW-A4: user?.email deps 추가 — 로그인 직후 likedBy stale 방지
  // ✅ 24TH-B1: fetchPost가 useCallback으로 안정화되어 eslint-disable 없이 deps 포함
  useEffect(() => { fetchPost(); }, [fetchPost]);

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

  const openEdit = () => {
    setEditContent(post.content);
    setEditCategory(post.category);
    setShowEditModal(true);
    setShowMenu(false);
  };

  const saveEdit = async () => {
    if (!editContent.trim()) { addToast('내용을 입력해주세요.', 'error'); return; }
    setSaving(true);
    try {
      const res = await apiClient.put(`/api/community/posts/${id}`, {
        content: editContent.trim(),
        category: editCategory,
        email: user.email,
      });
      setPost(res.data);
      setShowEditModal(false);
      addToast('✅ 게시글이 수정되었습니다.', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || '수정 실패.', 'error');
    } finally { setSaving(false); }
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

  // ✅ NEW-B3: useCallback 적용 — 매 렌더마다 함수 재생성 방지
  const handleShare = useCallback(async () => {
    const title = `낚시GO | ${post?.author}님의 조황`;
    const text = post?.content?.slice(0, 80) || '낚시GO에서 조황을 확인하세요!';
    const pageUrl = window.location.href;
    const imgUrl = post?.image?.startsWith('http')
      ? post.image
      : `${window.location.origin}/og-image.png`;

    if (window.Kakao?.isInitialized()) {
      try {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title,
            description: text,
            imageUrl: imgUrl,
            link: { mobileWebUrl: pageUrl, webUrl: pageUrl },
          },
          buttons: [{ title: '조황 보러가기', link: { mobileWebUrl: pageUrl, webUrl: pageUrl } }],
        });
        return;
      } catch (e) { /* 카카오 실패 시 폴백 */ }
    }
    if (navigator.share) {
      try { await navigator.share({ title, text, url: pageUrl }); return; }
      catch (e) { /* 취소 무시 */ }
    }
    try {
      await navigator.clipboard.writeText(pageUrl);
      addToast('🔗 링크가 클립보드에 복사되었습니다!', 'success');
    } catch {
      addToast('링크 복사에 실패했습니다.', 'error');
    }
  }, [post?.author, post?.content, post?.image, addToast]);

  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #0056D2', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: '14px', color: '#AAB0BE', fontWeight: '700' }}>불러오는 중...</div>
    </div>
  );

  if (error || !post) return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center', gap: '16px' }}>
      <div style={{ fontSize: '48px' }}>🎣</div>
      <div style={{ fontSize: '16px', color: '#666', fontWeight: '700' }}>{error || '게시글을 찾을 수 없습니다.'}</div>
      <button onClick={() => navigate(-1)} style={{ padding: '12px 28px', backgroundColor: '#0056D2', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>뒤로 가기</button>
    </div>
  );

  const categoryColor = CATEGORY_COLORS[post.category] || '#666';
  const commentCount = Array.isArray(post.comments) ? post.comments.length : (post.comments || 0);

  return (
    <div className="page-container" style={{ backgroundColor: '#F2F2F7', height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', borderBottom: '1px solid #F0F2F7', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: '#F2F2F7', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex' }}>
          <ChevronLeft size={20} color="#1A1A2E" />
        </button>
        <span style={{ flex: 1, fontSize: '16px', fontWeight: '950', color: '#1A1A2E', textAlign: 'center' }}>조황 게시글</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={handleShare} style={{ border: 'none', background: '#F2F2F7', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex' }}>
            <Share2 size={18} color="#666" />
          </button>
          {canEdit && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowMenu(v => !v)} style={{ border: 'none', background: '#F2F2F7', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex' }}>
                <MoreVertical size={18} color="#666" />
              </button>
              {showMenu && (
                <div style={{ position: 'absolute', top: '44px', right: 0, background: '#fff', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #F0F2F7', zIndex: 200, minWidth: '130px', overflow: 'hidden' }}>
                  <button onClick={openEdit} style={{ width: '100%', padding: '13px 16px', border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '700', color: '#1A1A2E', cursor: 'pointer', textAlign: 'left' }}>
                    <Edit2 size={15} color="#0056D2" /> 수정하기
                  </button>
                  <div style={{ height: '1px', background: '#F0F2F7' }} />
                  <button onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }} style={{ width: '100%', padding: '13px 16px', border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '700', color: '#FF3B30', cursor: 'pointer', textAlign: 'left' }}>
                    <Trash2 size={15} color="#FF3B30" /> 삭제하기
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '90px' }} onClick={() => setShowMenu(false)}>
        {/* 게시글 카드 */}
        <div style={{ backgroundColor: '#fff', margin: '12px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '950', fontSize: '18px', flexShrink: 0 }}>
              {post.author?.[0] || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: '950', fontSize: '15px', color: '#1A1A2E' }}>{post.author}</span>
                <span style={{ fontSize: '10px', fontWeight: '900', padding: '2px 8px', borderRadius: '6px', background: `${categoryColor}18`, color: categoryColor }}>{post.category}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#AAB0BE', fontWeight: '700', marginTop: '2px' }}>{timeAgo(post.createdAt)}</div>
            </div>
          </div>

          {post.image && (
            <div style={{ width: '100%', maxHeight: '320px', overflow: 'hidden', marginBottom: '4px' }}>
              {/* ENH4-A3+B1: lazy loading + blur placeholder */}
              <img
                src={post.image}
                alt="조황 사진"
                loading="lazy"
                style={{ width: '100%', height: '320px', objectFit: 'cover', display: 'block', filter: 'blur(4px)', transition: 'filter 0.3s ease' }}
                onLoad={(e) => { e.target.style.filter = 'none'; }}
              />
            </div>
          )}

          <div style={{ padding: '16px 18px' }}>
            <p style={{ fontSize: '15px', lineHeight: '1.75', color: '#1A1A2E', fontWeight: '600', whiteSpace: 'pre-wrap', margin: 0 }}>{post.content}</p>
          </div>

          <div style={{ padding: '12px 18px 16px', display: 'flex', gap: '20px', borderTop: '1px solid #F8F8F8' }}>
            <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: liked ? '#FF5A5F' : '#AAB0BE', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
              <Heart size={18} fill={liked ? '#FF5A5F' : 'none'} color={liked ? '#FF5A5F' : '#AAB0BE'} />
              <span>{post.likes || 0}</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: '#AAB0BE' }}>
              <MessageSquare size={18} /><span>{commentCount}</span>
            </div>
          </div>
        </div>

        {/* 댓글 목록 */}
        <div style={{ margin: '0 12px', backgroundColor: '#fff', borderRadius: '20px', padding: '16px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '950', color: '#1A1A2E', marginBottom: '16px' }}>댓글 {commentCount}</h3>
          {Array.isArray(post.comments) && post.comments.length > 0 ? (
            post.comments.map((c, idx) => (
              <div key={c._id || idx} style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0, background: 'linear-gradient(135deg, #F0F5FF, #E0ECFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '900', color: '#0056D2' }}>
                  {c.author ? c.author[0] : <User size={16} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '800', fontSize: '13px', color: '#1A1A2E' }}>{c.author}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#D0D5E0', fontWeight: '700' }}>{timeAgo(c.createdAt)}</span>
                      {/* ✅ 본인 또는 어드민에게만 삭제 버튼 표시 */}
                      {(isAdmin || (user && c.author_email === user.email)) && (
                        <button
                          onClick={() => deleteComment(c._id?.toString() || c.id || String(c.createdAt))}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: '6px', color: '#FF3B30', fontSize: '11px', fontWeight: '900', lineHeight: 1 }}
                          title="댓글 삭제"
                        >×</button>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: '14px', color: '#444', lineHeight: '1.5', margin: 0, fontWeight: '600' }}>{c.text}</p>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#D0D5E0', fontSize: '13px', fontWeight: '700' }}>첫 댓글을 남겨보세요! 🎣</div>
          )}
        </div>
      </div>

      {/* 댓글 입력창 */}
      <div style={{ padding: '10px 16px 16px', backgroundColor: '#fff', borderTop: '1px solid #F0F2F7', display: 'flex', gap: '10px', alignItems: 'center', boxShadow: '0 -4px 16px rgba(0,0,0,0.06)' }}>
        <input
          placeholder="칭찬과 응원의 댓글을 남겨주세요 🎣"
          style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', backgroundColor: '#F2F2F7', border: 'none', outline: 'none', fontSize: '14px', fontWeight: '600', color: '#1A1A2E' }}
          value={comment} onChange={e => setComment(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitComment()}
        />
        <button onClick={submitComment} disabled={!comment.trim() || submitting}
          style={{ width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0, background: comment.trim() ? '#0056D2' : '#E5E5EA', border: 'none', cursor: comment.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
          <Send size={18} color={comment.trim() ? '#fff' : '#AAB0BE'} />
        </button>
      </div>

      {/* 수정 모달 */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '480px', background: '#fff', borderRadius: '24px 24px 0 0', padding: '20px 20px 36px', boxShadow: '0 -8px 30px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '16px', fontWeight: '900', color: '#1A1A2E' }}>게시글 수정</span>
              <button onClick={() => setShowEditModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={22} color="#666" /></button>
            </div>
            {/* 카테고리 선택 */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {CATEGORIES.filter(c => c !== '전체').map(c => (
                <button key={c} onClick={() => setEditCategory(c)}
                  style={{ padding: '6px 12px', borderRadius: '16px', border: 'none', fontSize: '12px', fontWeight: '800', cursor: 'pointer', background: editCategory === c ? '#0056D2' : '#F2F2F7', color: editCategory === c ? '#fff' : '#555' }}>
                  {c}
                </button>
              ))}
            </div>
            <textarea
              value={editContent} onChange={e => setEditContent(e.target.value)}
              style={{ width: '100%', minHeight: '160px', border: '1.5px solid #E5E5EA', borderRadius: '14px', padding: '14px', fontSize: '14px', fontWeight: '600', lineHeight: '1.6', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <button onClick={saveEdit} disabled={saving || !editContent.trim()}
              style={{ marginTop: '12px', width: '100%', padding: '15px', background: editContent.trim() ? '#0056D2' : '#E5E5EA', color: editContent.trim() ? '#fff' : '#bbb', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '900', cursor: editContent.trim() ? 'pointer' : 'default' }}>
              {saving ? '저장 중...' : '✅ 수정 완료'}
            </button>
          </div>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px 24px', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🗑️</div>
            <div style={{ fontSize: '17px', fontWeight: '900', color: '#1A1A2E', marginBottom: '8px' }}>게시글을 삭제할까요?</div>
            <div style={{ fontSize: '13px', color: '#AAB0BE', marginBottom: '24px' }}>삭제된 게시글은 복구할 수 없습니다.</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: '13px', border: '1.5px solid #E5E5EA', borderRadius: '12px', background: '#fff', fontSize: '14px', fontWeight: '800', cursor: 'pointer', color: '#666' }}>취소</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '13px', border: 'none', borderRadius: '12px', background: '#FF3B30', fontSize: '14px', fontWeight: '900', cursor: 'pointer', color: '#fff' }}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
