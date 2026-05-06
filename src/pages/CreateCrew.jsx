import React, { useState, useCallback } from 'react'; // ✅ 8TH-C1: useCallback import 추가
import { useNavigate } from 'react-router-dom';
import { X, Lock, Users, ShieldCheck, ChevronRight, HelpCircle } from 'lucide-react';
import { RewardGateModal } from '../components/AdUnit';
import { useToastStore } from '../store/useToastStore';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore'; // ✅ 8TH-A1: ADMIN_ID/ADMIN_EMAIL import

import apiClient from '../api/index';

export default function CreateCrew() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [password, setPassword] = useState('');
  const [limit, setLimit] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);
  const addToast = useToastStore((state) => state.addToast);
  const userTier = useUserStore((state) => state.userTier);
  const user = useUserStore((state) => state.user);
  // ✅ 8TH-A1: isAdmin 직접 비교 — ADMIN_ID/ADMIN_EMAIL 패턴 통일 (전체 8번째 마지막 미통일 파일)
  const isAdmin = useUserStore(s => s.user?.id === ADMIN_ID || s.user?.email === ADMIN_EMAIL);
  // BUSINESS_LITE 이상이면 광고 게이트 없이 바로 크루 생성
  const isBusinessLite = isAdmin || ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'MASTER'].includes(userTier);

  // \u2705 19TH-C2: doCreateCrew useCallback \uc801\uc6a9 \u2014 handleCreateCrew \uc6a9 \ud074\ub85c\uc800 \uc548\uc815\uc131 \ud5a5\uc0c1
  const doCreateCrew = useCallback(async () => {
    if (!name.trim()) return;
    // GUEST \uc0ac\uc6a9\uc790 \ucc28\ub2e8
    if (!user || user.id === 'GUEST') {
      addToast('\ub85c\uadf8\uc778\uc774 \ud544\uc694\ud569\ub2c8\ub2e4.', 'error');
      return;
    }
    // ENH6-B3: \ube44\ubc00\ubc88\ud638 \uc720\ud6a8\uc131 \uc911\ubcf5 \uc81c\uac70 \u2014 handleCreateCrew\uc5d0\uc11c \uc774\ubbf8 \uc0ac\uc804 \uac80\uc99d \uc644\ub8cc
    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/api/community/crews', {
        name,
        isPrivate,
        password: isPrivate ? password : null,
        members: 1,
        limit,
        owner: user?.email || user?.id || '',
        ownerName: user?.name || user?.nickname || user?.id || '',
      });
      if (res.data) {
        const data = res.data;
        addToast('\ud06c\ub8e8\uac00 \uc131\uacf5\uc801\uc73c\ub85c \uac1c\uc124\ub418\uc5c8\uc2b5\ub2c8\ub2e4!', 'success');
        navigate(`/crew/${data.id || data._id || 'CREW_001'}/chat`);
      }
    } catch (err) {
      // ENH6-A2: \ud504\ub85c\ub355\uc158 console.error \uc2a4\ud0dd \ud2b8\ub808\uc774\uc2a4 \ub178\ucd9c \ubc29\uc9c0
      if (!import.meta.env.PROD) console.error('Create crew error:', err);
      addToast('\ud06c\ub8e8 \uc0dd\uc131 \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [name, isPrivate, password, limit, user, addToast, navigate]); // \u2705 19TH-C2: \ud074\ub85c\uc800 \ubcc0\uc218 deps \uba85\uc2dc

  // '크루 생성하기' 클릭 → 비즈니스 라이트 구독자는 바로, 일반 유저는 광고 게이트
  const handleCreateCrew = () => {
    if (!name.trim()) return;
    if (name.trim().length < 2 || name.trim().length > 20) {
      addToast('크루명은 2~20자 사이로 입력해주세요.', 'error');
      return;
    }
    // ✅ 8TH-B5: password.length !== 4 → < 4 — 정확히 4자가 아닌 조건에서 장성중 에러 발생 방지
    if (isPrivate && password.length < 4) {
      addToast('프라이빗 크루는 4자리 비밀번호가 필수입니다.', 'error');
      return;
    }
    if (isBusinessLite) {
      doCreateCrew();
    } else {
      setShowAdGate(true);
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
            maxLength={20}
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
              {/* Number() 변환 — e.target.value는 항상 문자열 */}
              <input type="range" min="3" max="1000" step="1" value={limit} onChange={(e) => setLimit(Number(e.target.value))} style={{ flex: 1, accentColor: '#0056D2' }} />
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0056D2', width: '45px', textAlign: 'right' }}>{limit}</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#8e8e93' }}>명</div>
           </div>
        </div>

        <button 
          disabled={!name.trim() || isSubmitting}
          onClick={handleCreateCrew}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: '16px',
            backgroundColor: name.trim() ? '#0056D2' : '#f0f0f0',
            color: name.trim() ? '#fff' : '#bbb',
            border: 'none',
            fontSize: '16px',
            fontWeight: '800',
            boxShadow: name.trim() ? '0 10px 20px rgba(0, 86, 210, 0.2)' : 'none'
          }}
        >
          {isSubmitting ? '생성 중...' : '크루 생성하기'}
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '20px', color: '#bbb' }}>
          <HelpCircle size={14} />
          <span style={{ fontSize: '12px' }}>크루 운영 정책 자세히 보기</span>
        </div>
      </div>

      {/* 보상형 광고 게이트 */}
      <RewardGateModal
        isOpen={showAdGate}
        onClose={() => setShowAdGate(false)}
        onRewardComplete={doCreateCrew}
        onSubscribe={() => { setShowAdGate(false); navigate('/vvip-subscribe'); }}
        context="crew"
      />
    </div>
  );
}
