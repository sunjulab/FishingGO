import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Lock, Users, ShieldCheck, ChevronRight, HelpCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CreateCrew() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [password, setPassword] = useState('');
  const [limit, setLimit] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCrew = async () => {
    if (!name) return;
    if (isPrivate && password.length !== 4) {
      alert('프라이빗 크루는 4자리 비밀번호가 필수입니다.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API}/api/community/crews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          isPrivate,
          password: isPrivate ? password : null,
          members: 1,
          limit
        })
      });
      if (response.ok) {
        const data = await response.json();
        navigate(`/crew/${data.id}/chat`);
      }
    } catch (err) {
      console.error("Create crew error:", err);
      alert("크루 생성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ backgroundColor: '#fff', height: '100dvh', zIndex: 2000 }}>
       <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none' }}>
          <X size={24} color="#1c1c1e" />
        </button>
        <h2 style={{ fontSize: '17px', fontWeight: '800' }}>프라이빗 크루 만들기</h2>
        <div style={{ width: '24px' }}></div>
      </div>

      <div style={{ padding: '24px 20px' }}>
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#8e8e93', marginBottom: '8px' }}>크루 명칭</label>
          <input 
            type="text"
            placeholder="예: 강원권 루어 정기출조 모임"
            style={{ 
              width: '100%', 
              padding: '16px', 
              borderRadius: '12px', 
              border: '1px solid #eee', 
              backgroundColor: '#f8f9fa',
              fontSize: '16px',
              fontWeight: '600',
              outline: 'none'
            }}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '800', color: '#8e8e93' }}>입장 유형</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setIsPrivate(false)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: !isPrivate ? '1px solid #0056D2' : '1px solid #eee', backgroundColor: !isPrivate ? 'rgba(0,86,210,0.05)' : '#fff', color: !isPrivate ? '#0056D2' : '#999', fontSize: '12px', fontWeight: '800' }}
              >공개</button>
              <button 
                onClick={() => setIsPrivate(true)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: isPrivate ? '1px solid #0056D2' : '1px solid #eee', backgroundColor: isPrivate ? 'rgba(0,86,210,0.05)' : '#fff', color: isPrivate ? '#0056D2' : '#999', fontSize: '12px', fontWeight: '800' }}
              >프라이빗</button>
            </div>
          </div>
          
          <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Lock size={18} color="#0056D2" style={{ marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>보안 입장 모드</div>
              <div style={{ fontSize: '12px', color: '#8e8e93', lineHeight: '1.5', marginBottom: isPrivate ? '12px' : 0 }}>초대 링크가 있거나 비밀번호를 아는 사용자만 참여할 수 있는 폐쇄형 모임입니다.</div>
              {isPrivate && (
                <input 
                  type="password"
                  placeholder="입장 코드 4자리 입력"
                  maxLength={4}
                  style={{ 
                    width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eee', outline: 'none', fontSize: '14px', fontWeight: '800', letterSpacing: '4px', textAlign: 'center'
                  }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/[^0-9]/g, ''))}
                />
              )}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '40px' }}>
           <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#8e8e93', marginBottom: '16px' }}>최대 인원 성정 (3 ~ 100명)</label>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="range" min="3" max="100" value={limit} onChange={(e) => setLimit(e.target.value)} style={{ flex: 1, accentColor: '#0056D2' }} />
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0056D2', width: '40px' }}>{limit}</div>
           </div>
        </div>

        <button 
          disabled={!name || isSubmitting}
          onClick={handleCreateCrew}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: '16px',
            backgroundColor: name ? '#0056D2' : '#f0f0f0',
            color: name ? '#fff' : '#bbb',
            border: 'none',
            fontSize: '16px',
            fontWeight: '800',
            boxShadow: name ? '0 10px 20px rgba(0, 86, 210, 0.2)' : 'none'
          }}
        >
          {isSubmitting ? '생성 중...' : '크루 생성하기'}
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '20px', color: '#bbb' }}>
          <HelpCircle size={14} />
          <span style={{ fontSize: '12px' }}>크루 운영 정책 자세히 보기</span>
        </div>
      </div>
    </div>
  );
}
