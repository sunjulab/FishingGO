import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Heart, MessageSquare, Share2, Send, ChevronLeft, MapPin, Clock } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function PostDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/community/posts/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data);
      } else {
        setError(`에러 발생: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      console.error(err);
      setError(`네트워크 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const res = await fetch(`${API}/api/community/posts/${id}/like`, { method: 'POST' });
      if (res.ok) {
        const updatedPost = await res.json();
        setPost(updatedPost);
      }
    } catch (err) { console.error(err); }
  };

  const submitComment = async () => {
    if (!comment) return;
    try {
      const storedUser = JSON.parse(localStorage.getItem('user')) || { name: '주문진낚시꾼' };
      const res = await fetch(`${API}/api/community/posts/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: storedUser.name, text: comment })
      });
      if (res.ok) {
        const updatedPost = await res.json();
        setPost(updatedPost);
        setComment('');
      }
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>데이터를 불러오는 중...</div>;
  if (error || !post) return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>{error || '게시글을 찾을 수 없습니다.'}</div>
      <div style={{ fontSize: '13px', color: '#bbb', marginBottom: '24px' }}>요청 ID: {id}</div>
      <button onClick={() => navigate(-1)} style={{ padding: '12px 24px', backgroundColor: '#0056D2', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800' }}>뒤로 가기</button>
    </div>
  );

  return (
    <div className="page-container" style={{ backgroundColor: '#fff', height: '100dvh', display: 'flex', flexDirection: 'column' }}>
       <div style={{ padding: '16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', padding: '8px', cursor: 'pointer' }}>
          <ChevronLeft size={24} color="#1c1c1e" />
        </button>
        <h2 style={{ fontSize: '17px', fontWeight: '800', flex: 1, textAlign: 'center', marginRight: '40px' }}>게시글 상세</h2>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '80px' }}>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#0056D2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800' }}>{post.author[0]}</div>
              <div>
                <div style={{ fontWeight: '800', fontSize: '15px' }}>{post.author} <span style={{ color: '#0056D2', fontSize: '11px', background: 'rgba(0,86,210,0.05)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>PRO</span></div>
                <div style={{ fontSize: '12px', color: '#bbb', marginTop: '2px' }}>{post.time} • {post.category}</div>
              </div>
            </div>
            <button style={{ height: 'fit-content', padding: '6px 12px', border: '1px solid #eee', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#666', cursor: 'pointer' }}>팔로우</button>
          </div>

          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#333', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
            {post.content}
          </p>

          {post.image && (
            <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
              <img src={post.image} alt="fishing" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
            </div>
          )}

          <div style={{ display: 'flex', gap: '20px', padding: '16px 0', borderTop: '1px solid #f8f8f8', borderBottom: '1px solid #f8f8f8' }}>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#FF5A5F', cursor: 'pointer' }}
              onClick={handleLike}
            >
              <Heart size={20} fill={post.likes > 0 ? "#FF5A5F" : "none"} /> {post.likes}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#666' }}>
              <MessageSquare size={20} /> {post.comments.length}
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#f9f9f9', padding: '20px', minHeight: '200px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px' }}>댓글 {post.comments.length}</h3>
          {post.comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
               <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>{c.author[0]}</div>
               <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '700', fontSize: '13px' }}>{c.author}</span>
                    <span style={{ fontSize: '11px', color: '#bbb' }}>{c.time}</span>
                  </div>
                  <p style={{ fontSize: '14px', marginTop: '4px', lineHeight: '1.4' }}>{c.text}</p>
               </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input 
          placeholder="칭찬과 응원의 댓글을 남겨주세요." 
          style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', backgroundColor: '#f8f9fa', border: '1px solid #eee', outline: 'none', fontSize: '14px' }}
          onChange={(e) => setComment(e.target.value)}
          value={comment}
          onKeyPress={(e) => e.key === 'Enter' && submitComment()}
        />
        <button 
          onClick={submitComment}
          style={{ border: 'none', background: 'none', color: comment ? '#0056D2' : '#bbb', cursor: 'pointer' }}
        >
          <Send size={24} />
        </button>
      </div>
    </div>
  );
}
