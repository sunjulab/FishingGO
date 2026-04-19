import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, MessageSquare, Send, ChevronLeft, Share2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)  return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

const CATEGORY_COLORS = {
  '찌낚시':   '#0056D2',
  '루어':     '#FF5A5F',
  '선상':     '#FF9B26',
  '에깅':     '#7C3AED',
  '원투':     '#059669',
  '갯바위':   '#DC2626',
  '민물':     '#0891B2',
};

export default function PostDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchPost(); }, [id]);

  const fetchPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/community/posts/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data);
      } else {
        setError('게시글을 찾을 수 없습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (liked) return;
    try {
      const res = await fetch(`${API}/api/community/posts/${id}/like`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setPost(updated);
        setLiked(true);
      }
    } catch (err) { console.error(err); }
  };

  const submitComment = async () => {
    if (!comment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('user')) || { name: '낚시고수' };
      const res = await fetch(`${API}/api/community/posts/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: storedUser.name, text: comment.trim() })
      });
      if (res.ok) {
        const updated = await res.json();
        setPost(updated);
        setComment('');
      }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: `낚시GO | ${post?.author}님의 조황`, url: window.location.href });
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

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
      <div style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px',
        backgroundColor: '#fff', borderBottom: '1px solid #F0F2F7',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: '#F2F2F7', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex' }}>
          <ChevronLeft size={20} color="#1A1A2E" />
        </button>
        <span style={{ flex: 1, fontSize: '16px', fontWeight: '950', color: '#1A1A2E', textAlign: 'center', marginRight: '36px' }}>
          조황 게시글
        </span>
        <button onClick={handleShare} style={{ border: 'none', background: '#F2F2F7', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex' }}>
          <Share2 size={18} color="#666" />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '90px' }}>
        {/* 게시글 카드 */}
        <div style={{ backgroundColor: '#fff', margin: '12px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          {/* 작성자 정보 */}
          <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '46px', height: '46px', borderRadius: '14px',
              background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}88)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: '950', fontSize: '18px', flexShrink: 0
            }}>
              {post.author?.[0] || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: '950', fontSize: '15px', color: '#1A1A2E' }}>{post.author}</span>
                <span style={{
                  fontSize: '10px', fontWeight: '900', padding: '2px 8px', borderRadius: '6px',
                  background: `${categoryColor}18`, color: categoryColor
                }}>{post.category}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#AAB0BE', fontWeight: '700', marginTop: '2px' }}>
                {timeAgo(post.createdAt)}
              </div>
            </div>
          </div>

          {/* 이미지 */}
          {post.image && (
            <div style={{ width: '100%', maxHeight: '320px', overflow: 'hidden', marginBottom: '4px' }}>
              <img src={post.image} alt="조황 사진" style={{ width: '100%', height: '320px', objectFit: 'cover', display: 'block' }} />
            </div>
          )}

          {/* 본문 */}
          <div style={{ padding: '16px 18px' }}>
            <p style={{ fontSize: '15px', lineHeight: '1.75', color: '#1A1A2E', fontWeight: '600', whiteSpace: 'pre-wrap', margin: 0 }}>
              {post.content}
            </p>
          </div>

          {/* 좋아요 / 댓글 */}
          <div style={{ padding: '12px 18px 16px', display: 'flex', gap: '20px', borderTop: '1px solid #F8F8F8' }}>
            <button
              onClick={handleLike}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px',
                fontWeight: '800', color: liked ? '#FF5A5F' : '#AAB0BE',
                border: 'none', background: 'none', cursor: 'pointer',
                transition: 'all 0.2s', padding: 0
              }}
            >
              <Heart size={18} fill={liked ? '#FF5A5F' : 'none'} color={liked ? '#FF5A5F' : '#AAB0BE'} />
              <span>{post.likes || 0}</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: '#AAB0BE' }}>
              <MessageSquare size={18} />
              <span>{commentCount}</span>
            </div>
          </div>
        </div>

        {/* 댓글 목록 */}
        <div style={{ margin: '0 12px', backgroundColor: '#fff', borderRadius: '20px', padding: '16px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '950', color: '#1A1A2E', marginBottom: '16px' }}>
            댓글 {commentCount}
          </h3>
          {Array.isArray(post.comments) && post.comments.length > 0 ? (
            post.comments.map((c, idx) => (
              <div key={c._id || idx} style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                  background: 'linear-gradient(135deg, #F0F5FF, #E0ECFF)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: '900', color: '#0056D2'
                }}>
                  {c.author?.[0] || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '800', fontSize: '13px', color: '#1A1A2E' }}>{c.author}</span>
                    <span style={{ fontSize: '11px', color: '#D0D5E0', fontWeight: '700' }}>{timeAgo(c.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#444', lineHeight: '1.5', margin: 0, fontWeight: '600' }}>{c.text}</p>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#D0D5E0', fontSize: '13px', fontWeight: '700' }}>
              첫 댓글을 남겨보세요! 🎣
            </div>
          )}
        </div>
      </div>

      {/* 댓글 입력창 */}
      <div style={{
        padding: '10px 16px 16px',
        backgroundColor: '#fff', borderTop: '1px solid #F0F2F7',
        display: 'flex', gap: '10px', alignItems: 'center',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.06)'
      }}>
        <input
          placeholder="칭찬과 응원의 댓글을 남겨주세요 🎣"
          style={{
            flex: 1, padding: '12px 16px', borderRadius: '24px',
            backgroundColor: '#F2F2F7', border: 'none', outline: 'none',
            fontSize: '14px', fontWeight: '600', color: '#1A1A2E'
          }}
          value={comment}
          onChange={e => setComment(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && submitComment()}
        />
        <button
          onClick={submitComment}
          disabled={!comment.trim() || submitting}
          style={{
            width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
            background: comment.trim() ? '#0056D2' : '#E5E5EA',
            border: 'none', cursor: comment.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s'
          }}
        >
          <Send size={18} color={comment.trim() ? '#fff' : '#AAB0BE'} />
        </button>
      </div>
    </div>
  );
}
