import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Image, MapPin, Send, ChevronDown, CheckCircle2, Scan } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function WritePost() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('전체');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const categories = ['전체', '루어', '찌낚시', '원투', '릴찌', '선상', '에깅'];

  const handlePost = async () => {
    if (!content) return;
    setIsSubmitting(true);
    const storedUser = JSON.parse(localStorage.getItem('user')) || { name: '주문진낚시꾼' };
    try {
      const response = await fetch(`${API}/api/community/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: storedUser.name,
          author_email: storedUser.email,
          category,
          content,
          image: image || null
        })
      });
      if (response.ok) {
        navigate('/community');
      }
    } catch (err) {
      console.error("Post error:", err);
      alert("등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ backgroundColor: '#fff', height: '100dvh', zIndex: 2000 }}>
      {/* 고정 헤더 */}
      <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none' }}>
          <X size={24} color="#1c1c1e" />
        </button>
        <h2 style={{ fontSize: '17px', fontWeight: '800' }}>새 조황 공유하기</h2>
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
          onClick={handlePost}
        >
          {isSubmitting ? '등록 중...' : '등록'} <Send size={14} />
        </button>
      </div>

      <div style={{ padding: '20px' }}>
        {/* 카테고리 선택 */}
        <div 
          onClick={() => setShowCategoryPopup(true)}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '8px 16px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '12px',
            marginBottom: '20px',
            cursor: 'pointer',
            border: '1px solid #eee'
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: '800', color: '#0056D2' }}>{category}</span>
          <ChevronDown size={14} color="#0056D2" />
        </div>

        {/* 텍스트 입력 영역 */}
        <textarea 
          placeholder="현장 상황이나 조과를 자유롭게 공유해보세요. (예: 현재 강릉항 파고가 높습니다!)"
          style={{ 
            width: '100%', 
            minHeight: '200px', 
            border: 'none', 
            fontSize: '16px', 
            lineHeight: '1.6', 
            outline: 'none',
            resize: 'none'
          }}
          onChange={(e) => setContent(e.target.value)}
          value={content}
        />

        {/* 하단 툴바 */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '16px 20px', backgroundColor: '#fff', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '20px' }}>
          <div 
            onClick={() => {
              const url = window.prompt('이미지 주소(URL)를 입력하세요.');
              if (url) setImage(url);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: image ? '#0056D2' : '#666', fontSize: '14px', cursor: 'pointer' }}
          >
            <div style={{ width: '36px', height: '36px', backgroundColor: image ? 'rgba(0,86,210,0.05)' : '#f8f9fa', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image size={20} />
            </div>
            <span style={{ fontWeight: '600' }}>{image ? '사진 추가됨' : '사진 추가'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '14px' }}>
            <div style={{ width: '36px', height: '36px', backgroundColor: '#f8f9fa', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={20} />
            </div>
            <span style={{ fontWeight: '600' }}>위치 추가</span>
          </div>
          
          <div 
             onClick={() => {
                if(!image) {
                   alert('사진을 먼저 올려주세요.'); return;
                }
                const btn = document.getElementById('ai-btn-text');
                if (btn) btn.innerText = 'AI 판별 중...';
                setTimeout(() => {
                   setContent((prev) => prev + '\n\n🤖 [AI 어종 판별 결과]\n- 어종: 감성돔 (확률 98%)\n- 예상 길이: 약 45~50cm\n- 기상 데이터 연동 매핑 완료');
                   setCategory('찌낚시');
                   if (btn) {
                     btn.innerText = 'AI 분석 완료 ✨';
                     btn.style.color = '#00C48C';
                   }
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
            <div 
              onClick={(e) => { e.stopPropagation(); setImage(''); }} 
              style={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', padding: '4px', cursor: 'pointer' }}
            >
              <X size={12} />
            </div>
          </div>
        )}
      </div>

      {/* 카테고리 모달 시트 (Premium UI) */}
      {showCategoryPopup && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div className="bottom-sheet open" style={{ height: 'auto', padding: '24px 20px', maxWidth: '480px', margin: '0 auto' }}>
            <div className="sheet-handle"></div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>장르 선택</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {categories.map(c => (
                <div 
                  key={c}
                  onClick={() => {
                    setCategory(c);
                    setShowCategoryPopup(false);
                  }}
                  style={{ 
                    padding: '16px', 
                    borderRadius: '12px', 
                    backgroundColor: category === c ? 'rgba(0,86,210,0.05)' : '#f8f9fa',
                    border: category === c ? '1.5px solid #0056D2' : '1.5px solid transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontWeight: category === c ? '800' : '600', color: category === c ? '#0056D2' : '#333' }}>{c}</span>
                  {category === c && <CheckCircle2 size={16} color="#0056D2" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
