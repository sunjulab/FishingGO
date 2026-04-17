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
  const [showPaywallPopup, setShowPaywallPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCrewRequest = () => {
    if (!name) return;
    if (isPrivate && password.length !== 4) {
      alert('프라이빗 크루는 4자리 비밀번호가 필수입니다.');
      return;
    }
    // 제출 전 리워드 광고 정책에 따른 모달 강제 팝업
    setShowPaywallPopup(true);
  };

  const executeCreateCrew = async () => {
    setShowPaywallPopup(false);
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

  const handleWatchAd = () => {
    alert('동영상 광고가 재생됩니다 (15초)... 🎬\n(테스트 모드: 즉시 스킵됨)');
    setTimeout(() => {
      executeCreateCrew();
    }, 1500);
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
           <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#8e8e93', marginBottom: '16px' }}>최대 인원 설정 (3 ~ 1000명)</label>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="range" min="3" max="1000" step="1" value={limit} onChange={(e) => setLimit(e.target.value)} style={{ flex: 1, accentColor: '#0056D2' }} />
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0056D2', width: '45px', textAlign: 'right' }}>{limit}</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#8e8e93' }}>명</div>
           </div>
        </div>

        <button 
          disabled={!name || isSubmitting}
          onClick={handleCreateCrewRequest}
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

      {/* 🚀 수익화 바운더리: 비즈니스 라이트 구독 / 리워드 영상 시청 모달 */}
      {showPaywallPopup && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '30px 24px', maxWidth: '340px', width: '90%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button onClick={() => setShowPaywallPopup(false)} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#999' }}>
               <X size={24} />
            </button>
            <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #0056D2 0%, #00C48C 100%)', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Users size={32} color="#fff" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1c1c1e', marginBottom: '8px' }}>나만의 크루를 개설할까요?</h3>
            <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.5', marginBottom: '24px' }}>
              서버 트래픽 과부하를 방지하기 위해 개설 시 광고 시청이 필요합니다.
            </p>

            {/* 비즈니스 구독 티켓 옵션 */}
            <div 
              onClick={() => { alert('비즈니스 라이트 구독(월 9,900원) 구글 플레이 결제창 연결...'); }}
              style={{ padding: '16px', borderRadius: '16px', border: '2px solid #0056D2', backgroundColor: 'rgba(0,86,210,0.05)', marginBottom: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <div style={{ backgroundColor: '#0056D2', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '4px 8px', borderRadius: '4px', marginBottom: '8px' }}>PROMOTION</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0056D2', marginBottom: '4px' }}>비즈니스 라이트 패스</div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>크루 개설 무제한! <b>쇼핑 태그를 내 쿠팡 링크로 자동 치환</b>하여 수동적 현금 수익(Passive Income) 창출 대시보드 추가!</div>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#1c1c1e' }}>월 9,900원</div>
            </div>

            {/* 단건 영상 시청 (무료) 옵션 */}
            <button 
              onClick={handleWatchAd}
              style={{ width: '100%', padding: '16px', borderRadius: '16px', backgroundColor: '#F2F2F7', border: 'none', fontSize: '14px', fontWeight: '800', color: '#1c1c1e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              ▶ 15초 영상 시청하고 1회 무료 개설하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
