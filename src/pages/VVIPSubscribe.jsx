/**
 * VVIPSubscribe.jsx — VVIP 항구 선착순 독점 구독 페이지
 * - 55만원/년, 항구당 1명 한정
 * - 이미 선점된 항구는 '마감' 표시
 * - 구매 완료 시 해당 항구 VVIP 홍보글 무제한 작성 권한 부여
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, Crown, Lock, CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const REGIONS = ['전체', '강원', '부산', '경남', '전남', '제주', '인천', '충남'];

export default function VVIPSubscribe() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const setUserTier = useUserStore((state) => state.setUserTier);
  const addToast = useToastStore((state) => state.addToast);

  const [harbors, setHarbors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [selectedHarbor, setSelectedHarbor] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/vvip/harbors`)
      .then(r => r.json())
      .then(data => { setHarbors(data.harbors || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = selectedRegion === '전체'
    ? harbors
    : harbors.filter(h => h.region === selectedRegion);

  const handleSelectHarbor = (harbor) => {
    if (harbor.isTaken) {
      addToast(`${harbor.name}은 이미 다른 선장님이 선점하셨습니다.`, 'error');
      return;
    }
    setSelectedHarbor(harbor);
    setShowConfirm(true);
  };

  const handlePurchase = async () => {
    if (!user) { addToast('로그인이 필요합니다.', 'error'); return; }
    setPurchasing(true);
    try {
      const res = await fetch(`${API}/api/vvip/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          harborId: selectedHarbor.id,
          userId: user.id || user.email,
          userName: user.name || user.id
        })
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || '구매 실패. 다시 시도해주세요.', 'error');
        return;
      }
      setUserTier('BUSINESS_VIP');
      addToast(`🎉 ${selectedHarbor.name} VVIP 독점 선상 홍보 권한 획득!`, 'success');
      setShowConfirm(false);
      navigate('/community');
    } catch (err) {
      addToast('서버 오류. 잠시 후 다시 시도해주세요.', 'error');
    } finally {
      setPurchasing(false);
    }
  };

  const takenCount = harbors.filter(h => h.isTaken).length;
  const availableCount = harbors.length - takenCount;

  return (
    <div style={{ backgroundColor: '#F2F2F7', minHeight: '100dvh', paddingBottom: '40px' }}>
      {/* 헤더 */}
      <div style={{ backgroundColor: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', padding: 0 }}>
          <X size={24} color="#1c1c1e" />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>👑 VVIP 항구 독점 구독</h1>
      </div>

      {/* 히어로 배너 */}
      <div style={{
        background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
        margin: '16px', borderRadius: '24px', padding: '28px 24px',
        color: '#fff', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: '120px', height: '120px', backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -10, width: '80px', height: '80px', backgroundColor: 'rgba(255,215,0,0.05)', borderRadius: '50%' }} />
        <Crown size={36} color="#FFD700" style={{ marginBottom: '12px' }} />
        <div style={{ fontSize: '24px', fontWeight: '900', marginBottom: '6px' }}>항구별 전용 선상 광고</div>
        <div style={{ fontSize: '14px', opacity: 0.85, lineHeight: '1.6', marginBottom: '20px' }}>
          원하는 항구 1자리를 선점하면, 해당 항구의 선상 배 홍보 피드 최상단에 <strong>월 구독 유지 시 고정</strong>됩니다.<br />
          전국 낚시인들이 포인트 검색 시 가장 먼저 노출되는 프리미엄 광고 자리입니다.
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#FFD700' }}>₩550,000</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>월 정액 · 세금계산서 발행</div>
          </div>
          <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: availableCount > 0 ? '#00C48C' : '#FF5A5F' }}>{availableCount}석</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>잔여 자리 ({harbors.length}개 항구 중)</div>
          </div>
        </div>
      </div>

      {/* 혜택 리스트 */}
      <div style={{ margin: '0 16px 16px', backgroundColor: '#fff', borderRadius: '20px', padding: '20px' }}>
        <div style={{ fontSize: '15px', fontWeight: '900', marginBottom: '14px' }}>✨ VVIP 독점 혜택</div>
        {[
          { icon: '📌', text: '선택한 항구 피드 최상단 영구 고정 노출' },
          { icon: '🚢', text: '선상 배 홍보글 무제한 작성 (광고 없이)' },
          { icon: '🔒', text: '해당 항구 내 경쟁 광고 완전 차단 (1명 독점)' },
          { icon: '📞', text: '마스터 전용 카카오 컨설팅 채널 연결' },
          { icon: '📊', text: '월별 홍보글 조회수 · 클릭 리포트 제공' },
        ].map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <span style={{ fontSize: '20px' }}>{b.icon}</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#1c1c1e' }}>{b.text}</span>
          </div>
        ))}
      </div>

      {/* 지역 필터 */}
      <div style={{ padding: '0 16px 12px', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {REGIONS.map(region => (
          <button key={region} onClick={() => setSelectedRegion(region)}
            style={{
              padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '800', whiteSpace: 'nowrap',
              border: 'none', cursor: 'pointer',
              backgroundColor: selectedRegion === region ? '#1A1A2E' : '#fff',
              color: selectedRegion === region ? '#FFD700' : '#555',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >{region}</button>
        ))}
      </div>

      {/* 항구 목록 */}
      <div style={{ padding: '0 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>항구 정보 로딩 중...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(harbor => (
              <div
                key={harbor.id}
                onClick={() => handleSelectHarbor(harbor)}
                style={{
                  backgroundColor: harbor.isTaken ? '#F8F8F8' : '#fff',
                  borderRadius: '16px', padding: '18px',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  cursor: harbor.isTaken ? 'default' : 'pointer',
                  border: harbor.isTaken ? '1px solid #E5E5EA' : '1.5px solid transparent',
                  boxShadow: harbor.isTaken ? 'none' : '0 4px 16px rgba(0,0,0,0.06)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  opacity: harbor.isTaken ? 0.6 : 1
                }}
                onMouseEnter={e => { if (!harbor.isTaken) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                  background: harbor.isTaken
                    ? 'linear-gradient(135deg, #ccc, #aaa)'
                    : 'linear-gradient(135deg, #FFD700, #FF9B26)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {harbor.isTaken ? <Lock size={22} color="#fff" /> : <Crown size={22} color="#fff" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', backgroundColor: '#f0f0f5', color: '#555', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>{harbor.region}</span>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: harbor.isTaken ? '#aaa' : '#1c1c1e' }}>{harbor.name}</span>
                  </div>
                  {harbor.isTaken ? (
                    <div style={{ fontSize: '12px', color: '#FF3B30', fontWeight: '700' }}>
                      🔒 선점 완료 — {harbor.takenBy} 선장
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#00C48C', fontWeight: '700' }}>
                      ✅ 선착순 구매 가능 · 연 ₩550,000
                    </div>
                  )}
                </div>
                {!harbor.isTaken && (
                  <div style={{ fontSize: '22px', color: '#FFD700' }}>›</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 구매 확인 모달 */}
      {showConfirm && selectedHarbor && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '480px', backgroundColor: '#fff', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px' }}>
            <div style={{ width: '40px', height: '4px', backgroundColor: '#E5E5EA', borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '24px', textAlign: 'center', marginBottom: '8px' }}>👑</div>
            <h2 style={{ fontSize: '20px', fontWeight: '900', textAlign: 'center', marginBottom: '6px' }}>{selectedHarbor.name}</h2>
            <p style={{ fontSize: '14px', color: '#888', textAlign: 'center', marginBottom: '24px' }}>아래 항구의 VVIP 독점 광고 자리를 선점하시겠습니까?</p>

            <div style={{ backgroundColor: '#FFFBF0', borderRadius: '16px', padding: '18px', marginBottom: '20px', border: '1px solid #FFE58F' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#555' }}>선택 항구</span>
                <strong style={{ fontSize: '14px' }}>{selectedHarbor.region} · {selectedHarbor.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#555' }}>구독 기간</span>
                <strong style={{ fontSize: '14px' }}>1년 (365일)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: '#555' }}>결제 금액</span>
                <strong style={{ fontSize: '18px', color: '#FF9B26' }}>₩550,000</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', backgroundColor: '#FFF1F0', borderRadius: '12px', padding: '12px', marginBottom: '20px' }}>
              <AlertTriangle size={16} color="#FF3B30" style={{ marginTop: '2px', flexShrink: 0 }} />
              <p style={{ fontSize: '12px', color: '#FF3B30', margin: 0, lineHeight: '1.6' }}>
                실제 결제는 마스터가 확인 후 계좌 또는 카드 결제 안내를 드립니다. 선착순 예약 완료 시 자리가 즉시 확보됩니다.
              </p>
            </div>

            <button
              onClick={handlePurchase}
              disabled={purchasing}
              style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #FFD700, #FF9B26)', color: '#1A1A2E', fontSize: '17px', fontWeight: '900', cursor: 'pointer', marginBottom: '10px', boxShadow: '0 8px 24px rgba(255,155,38,0.3)' }}
            >
              {purchasing ? '예약 처리 중...' : '🔐 지금 선착순 예약하기'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              style={{ width: '100%', padding: '14px', border: 'none', background: 'none', color: '#aaa', fontSize: '14px', cursor: 'pointer' }}
            >취소</button>
          </div>
        </div>
      )}
    </div>
  );
}
