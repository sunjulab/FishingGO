import React, { useState, useCallback } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import apiClient from '../api';
import { RewardGateModal } from './AdUnit';
import UpgradeModal from './UpgradeModal';

const YOUTUBE_REGEXP = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
function extractYoutubeId(str) {
  const match = str.match(YOUTUBE_REGEXP);
  return (match && match[2].length === 11) ? match[2] : str;
}

export default function CctvModal({ cctvData, setCctvData, selectedPoint, onClose }) {
  const addToast = useToastStore(state => state.addToast);
  const userTier = useUserStore(s => s.userTier);
  const canAccessPremium = userTier === 'LITE' || userTier === 'PRO' || userTier === 'VIP' || userTier === 'VVIP' || userTier === 'MASTER';
  const isAdmin = useUserStore(s =>
    s.user?.id === ADMIN_ID ||
    s.user?.email === ADMIN_EMAIL ||
    s.user?.email === ADMIN_ID ||
    s.userTier === 'MASTER'
  );

  const [isEditingCctv, setIsEditingCctv] = useState(false);
  const [editYoutubeId, setEditYoutubeId] = useState('');
  const [isSavingCctv, setIsSavingCctv] = useState(false);

  // ✅ AD-GATE: CCTV 광고 게이트 상태
  const [isCctvUnlocked, setIsCctvUnlocked] = useState(canAccessPremium || isAdmin);
  const [showRewardGate, setShowRewardGate] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // 실시간 연속 재생(스트리밍) 효과를 위한 타임스탬프 (mof 전용)
  const [mofTimestamp, setMofTimestamp] = useState(Date.now());
  React.useEffect(() => {
    if (cctvData?.type !== 'mof') return;
    const interval = setInterval(() => {
      setMofTimestamp(Date.now());
    }, 5000); // 프록시 응답 지연을 고려해 5초 주기로 늘림
    return () => clearInterval(interval);
  }, [cctvData?.type]);

  const saveCctvOverride = useCallback(async () => {
    if (!editYoutubeId.trim()) return;

    const trimmedInput = editYoutubeId.trim();
    let finalType = 'iframe';
    let finalYoutubeId = trimmedInput;
    
    if (/youtu\.be|youtube\.com|v\/|embed\//.test(trimmedInput)) {
      finalType = 'youtube';
      finalYoutubeId = extractYoutubeId(trimmedInput);
    } else if (trimmedInput.includes('d.kbs.co.kr/special/cctvShare')) {
      finalType = 'kbs_share';
      const match = trimmedInput.match(/cctvId=([a-zA-Z0-9_-]+)/);
      finalYoutubeId = match ? match[1] : trimmedInput;
    } else if (trimmedInput.endsWith('.m3u8') || trimmedInput.includes('.m3u8?')) {
      finalType = 'hls';
    } else if (trimmedInput.includes('coast.mof.go.kr')) {
      finalType = 'mof_custom';
      finalYoutubeId = trimmedInput;
    } else if (/^\d+$/.test(trimmedInput)) {
      finalType = 'kbs_share';
      finalYoutubeId = trimmedInput;
    }

    const sid = selectedPoint?.obsCode || 'DT_0001';
    const cctvOverrideId = selectedPoint?.id ? `point_${selectedPoint.id}` : sid;
    
    try {
      setIsSavingCctv(true);
      const res = await apiClient.put(`/api/admin/cctv/${cctvOverrideId}`, {
        type: finalType,
        youtubeId: finalYoutubeId,
        label: cctvData?.label || `${selectedPoint?.name || '포인트'} 수동업데이트`
      });
      if (res.data.success) {
        addToast('✅ CCTV 링크가 정상적으로 수정되었습니다.', 'success');
        setIsEditingCctv(false);
        const cctvResp = await apiClient.get(`/api/weather/cctv?stationId=${sid}&pointId=point_${selectedPoint?.id || ''}`);
        if (setCctvData) setCctvData(cctvResp.data);
      } else {
        addToast(res.data.error || '수정에 실패했습니다.', 'error');
      }
    } catch (err) {
      addToast('수정 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSavingCctv(false);
    }
  }, [editYoutubeId, selectedPoint, cctvData, addToast, setCctvData]);

  if (!cctvData) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1200, display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: 'rgba(255,255,255,0.45)', fontWeight: '700', marginBottom: '2px', letterSpacing: '0.05em' }}>
            📡 {cctvData.label || '실시간 현장 영상'}
          </div>
          <div style={{ fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '950', color: '#fff' }}>{selectedPoint?.name}</div>
          <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginTop: '2px' }}>
            {cctvData.areaName} · {cctvData.region}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={18} color="#fff" />
        </button>
      </div>

      {/* 영상/이미지 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
        
        {/* 마스터 전용 수정 버튼 */}
        {isAdmin && (
          <button 
            onClick={() => {
              setIsEditingCctv(!isEditingCctv);
              if (!isEditingCctv) {
                const isKbs = cctvData?.type === 'kbs_share' || (cctvData?.type === 'hls' && /^\d+$/.test(cctvData?.youtubeId || ''));
                const initValue = isKbs
                  ? `https://d.kbs.co.kr/special/cctvShare?cctvId=${cctvData.youtubeId}` 
                  : (cctvData?.youtubeId || '');
                setEditYoutubeId(initValue);
              }
            }}
            style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,215,0,0.9)', color: '#000', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', padding: '6px 10px', borderRadius: '8px', zIndex: 40, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
          >
            🔄 {isEditingCctv ? '수정 닫기' : `마스터 편집`}
          </button>
        )}

        {/* 마스터 전용 UI: 입력 폼 오버레이 */}
        {isAdmin && isEditingCctv && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
            <div style={{ color: '#FFD700', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', marginBottom: '16px' }}>🛠 [{selectedPoint?.name}] 실시간 영상 교체</div>
            <input 
              value={editYoutubeId}
              onChange={(e) => setEditYoutubeId(e.target.value)}
              placeholder="유튜브 또는 KBS 전체 주소 입력"
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #FFD700', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', marginBottom: '16px', textAlign: 'center', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button 
                onClick={() => setIsEditingCctv(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '800' }}
              >
                취소
              </button>
              <button 
                onClick={saveCctvOverride}
                disabled={isSavingCctv}
                style={{ flex: 2, padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #FFD700, #FFA000)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: '900', opacity: isSavingCctv ? 0.6 : 1 }}
              >
                {isSavingCctv ? '업데이트 중...' : '즉시 적용'}
              </button>
            </div>
          </div>
        )}

        {(cctvData.type === 'youtube' || cctvData.type === 'iframe') && cctvData.url ? (
          <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', aspectRatio: '16/9', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', background: '#000' }}>
            <iframe
              src={cctvData.url}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', opacity: isCctvUnlocked ? 1 : 0, transition: 'opacity 0.3s' }}
            />
            {!isCctvUnlocked && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
                <div style={{ fontSize: `calc(32px * var(--fs, 1))`, marginBottom: '12px' }}>🔒</div>
                <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800', color: '#fff', marginBottom: '8px' }}>실시간 영상이 준비되었습니다</div>
                <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>광고 시청 후 끊김 없이 바로 재생됩니다.</div>
                <button 
                  onClick={() => setShowRewardGate(true)}
                  style={{ background: 'linear-gradient(135deg, #0056D2, #0096FF)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '30px', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,86,210,0.4)' }}
                >
                  📺 30초 광고 보고 재생하기
                </button>
              </div>
            )}
          </div>
        ) : cctvData.fallbackImg ? (
          <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', background: '#000' }}>
            <img
              src={cctvData.fallbackImg.startsWith('http') ? `${cctvData.fallbackImg}?t=${mofTimestamp}` : `${import.meta.env.VITE_API_BASE_URL || 'https://fishing-go-backend.onrender.com'}${cctvData.fallbackImg}?t=${mofTimestamp}`}
              alt={cctvData.areaName}
              style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block', opacity: isCctvUnlocked ? 1 : 0, transition: 'opacity 0.3s' }}
            />
            {!isCctvUnlocked && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
                <div style={{ fontSize: `calc(32px * var(--fs, 1))`, marginBottom: '12px' }}>🔒</div>
                <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800', color: '#fff', marginBottom: '8px' }}>실시간 영상이 준비되었습니다</div>
                <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>광고 시청 후 끊김 없이 바로 재생됩니다.</div>
                <button 
                  onClick={() => setShowRewardGate(true)}
                  style={{ background: 'linear-gradient(135deg, #0056D2, #0096FF)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '30px', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,86,210,0.4)' }}
                >
                  📺 30초 광고 보고 재생하기
                </button>
              </div>
            )}
            {isCctvUnlocked && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#FFD700', fontWeight: '800' }}>📷 현장 실시간 영상</div>
                <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: '2px' }}>{cctvData.type === 'mof' ? '1.5초 간격으로 자동 새로고침 중' : '실시간 스트리밍 준비 중 · 연결 시 자동 업데이트'}</div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
            <AlertCircle size={40} style={{ margin: '0 auto 10px', display: 'block' }} />
            <div style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '700' }}>영상 준비 중입니다</div>
          </div>
        )}
      </div>

      {/* 하단 안내 */}
      <div style={{ padding: '12px 20px 30px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: 'rgba(255,255,255,0.3)', fontWeight: '700', textAlign: 'center' }}>
          {cctvData.type === 'youtube'
            ? '📺 YouTube 라이브 스트리밍 연동 (지자체 공식 채널)'
            : cctvData.type === 'iframe'
            ? '🔗 커스텀 스트림 연동 (관리자 직접 설정)'
            : '📡 지역 대표 해안 이미지 · 실시간 스트리밍 추가 예정'}
        </div>
      </div>

      <RewardGateModal
        isOpen={showRewardGate}
        context="cctv"
        onClose={() => setShowRewardGate(false)}
        onRewardComplete={() => {
          setShowRewardGate(false);
          setIsCctvUnlocked(true);
        }}
        onSubscribe={() => {
          setShowRewardGate(false);
          setShowUpgradeModal(true);
        }}
      />
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
    </div>
  );
}
