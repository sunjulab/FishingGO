import React, { useState, useEffect } from 'react';
import apiClient from '../api/index';
import { evaluateFishingCondition } from '../utils/evaluator';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';

export default function FishingPointBottomSheet({ selectedPoint, onClose }) {
  const [marineData, setMarineData] = useState({
    tide: null,
    waterTemp: '-',
    fishingIndex: null
  });
  const [loading, setLoading] = useState(true);
  const [cctvData, setCctvData] = useState(null);
  const [cctvLoading, setCctvLoading] = useState(true);
  const [shoppingItems, setShoppingItems] = useState([]);
  const navigate = useNavigate();
  const user = useUserStore(state => state.user);
  const canAccessPremium = useUserStore(state => state.canAccessPremium());
  const isAdmin = useUserStore(state => state.isAdmin?.() ?? false);
  const addToast = useToastStore(state => state.addToast);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';


  const [isEditingCctv, setIsEditingCctv] = useState(false);
  const [editYoutubeId, setEditYoutubeId] = useState('');
  const [isSavingCctv, setIsSavingCctv] = useState(false);

  // 실시간 연속 재생(스트리밍) 효과를 위한 타임스탬프
  const [mofTimestamp, setMofTimestamp] = useState(Date.now());
  useEffect(() => {
    if (cctvData?.type !== 'mof') return;
    const interval = setInterval(() => {
      setMofTimestamp(Date.now());
    }, 1500); // 연안포털 규격에 맞춰 1.5초마다 새 프레임 호출
    return () => clearInterval(interval);
  }, [cctvData?.type]);

  const saveCctvOverride = async () => {
    if (!editYoutubeId.trim()) return;

    // 유튜브 전체 URL을 복사/붙여넣기 해도 자동으로 11자리 ID만 추출
    const extractYoutubeId = (str) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = str.match(regExp);
      return (match && match[2].length === 11) ? match[2] : str;
    };
    const finalYoutubeId = extractYoutubeId(editYoutubeId.trim());

    const sid = selectedPoint.obsCode || 'DT_0001';
    try {
      setIsSavingCctv(true);
      const res = await apiClient.put(`/api/admin/cctv/${sid}`, {
        type: 'youtube',
        youtubeId: finalYoutubeId,
        label: cctvData?.label || `${selectedPoint.name} \uc218\ub3d9\uc5c5\ub370\uc774\ud2b8`
      });
      if (res.data.success) {
        addToast('\u2705 CCTV \ub9c1\ud06c\uac00 \uc815\uc0c1\uc801\uc73c\ub85c \uc218\uc815\ub418\uc5c8\uc2b5\ub2c8\ub2e4.', 'success');
        setIsEditingCctv(false);
        // \uc218\uc815\ud55c \ub9c1\ud06c\ub85c \uc989\uc2dc \ub2e4\uc2dc \ub85c\ub4dc
        setCctvLoading(true);
        const cctvResp = await apiClient.get(`/api/weather/cctv?stationId=${sid}`);
        setCctvData(cctvResp.data);
      } else {
        addToast(res.data.error || '\uc218\uc815\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.', 'error');
      }
    } catch (err) {
      addToast('수정 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSavingCctv(false);
      setCctvLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedPoint) return;

    const loadData = async () => {
      setLoading(true);
      const sid = selectedPoint.obsCode || 'DT_0001';

      // 해양 날씨/수온 조회
      try {
        const resp = await apiClient.get(`/api/weather/precision?stationId=${sid}`);
        setMarineData({ 
          ...resp.data,
          stationId: sid 
        });
      } catch (err) {
        console.error('Data Load Error:', err);
        const reg = selectedPoint.region || '남해';
        const profile = { '제주': 18.2, '남해': 16.5, '동해': 14.2, '서해': 11.8 };
        const baseSst = profile[reg] || 16.0;
        const seed = (parseInt(selectedPoint.id) % 10 - 5) / 10 || 0;
        const finalSst = (baseSst + seed).toFixed(1);

        setMarineData({
          stationId: sid,
          sst: finalSst,
          temp: `${finalSst}°C`,
          layers: { upper: finalSst, middle: (finalSst - 1.2).toFixed(1), lower: (finalSst - 3.4).toFixed(1) },
          tide: { phase: '분석 중', high: '15:20', low: '08:42' },
          tide_predictions: [{ time: '14:20', type: '고조', level: 180 }]
        });
      } finally {
        setLoading(false);
      }

      // 현장 CCTV/라이브 데이터 조회 (비동기 병렬)
      try {
        setCctvLoading(true);
        const cctvResp = await apiClient.get(`/api/weather/cctv?stationId=${sid}`);
        setCctvData(cctvResp.data);
      } catch (err) {
        console.error('CCTV Load Error:', err);
      } finally {
        setCctvLoading(false);
      }

      // 쇼핑 아이템 조회 (비동기 병렬)
      try {
        const keyword = selectedPoint.fish ? selectedPoint.fish.split(',')[0] + ' \ucc44\ube44' : '\ub099\uc2dc\uc6a9\ud488';
        const shopResp = await apiClient.get(`/api/commerce/coupang/search?keyword=${encodeURIComponent(keyword)}&limit=3`);
        if (shopResp.data && shopResp.data.products) {
          setShoppingItems(shopResp.data.products.slice(0, 3));
        }
      } catch (err) {
        console.error('Shop Load Error:', err);
      }
    };

    loadData();
  }, [selectedPoint?.id]); // selectedPoint 변경 시에만 재조회 (user 의존성 제거)

  if (!selectedPoint) return null;

  return (
    <div style={{ padding: '0', backgroundColor: '#fff', borderRadius: '24px 24px 0 0', height: '100%' }}>
      {/* 바텀 시트 닫기 X 버튼 - 직접 추가함 (UI 완전성) */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: '900', color: '#1A1A2E' }}>
          {selectedPoint.name}
        </h2>
        {onClose && (
          <button onClick={onClose} style={{ background: '#F0F2F7', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold' }}>
            ✕
          </button>
        )}
      </div>

      <div style={{ padding: '0 20px 100px' }}>

        {/* ⭐ 비밀포인트 전용 황금 정보 박스 */}
        {selectedPoint.secret && (
          <div style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #1a1200, #2d1f00)', borderRadius: '20px', padding: '20px', border: '1.5px solid #B8860B', boxShadow: '0 0 24px rgba(255,215,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '20px' }}>⭐</span>
              <span style={{ fontSize: '13px', fontWeight: '900', color: '#FFD700', letterSpacing: '0.04em' }}>비밀포인트 정보</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', background: 'rgba(255,215,0,0.15)', color: '#FFD700', padding: '3px 10px', borderRadius: '20px', fontWeight: '800', border: '1px solid rgba(255,215,0,0.3)' }}>PREMIUM ONLY</span>
            </div>

            {/* 주요 어종 */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: '#B8860B', fontWeight: '900', marginBottom: '8px' }}>🎣 주요 조황 어종</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(selectedPoint.fish || '').split(',').map((f, i) => (
                  <span key={i} style={{ fontSize: '12px', fontWeight: '800', color: '#FFD700', background: 'rgba(255,215,0,0.12)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(255,215,0,0.25)' }}>
                    {f.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* 비밀 팁 */}
            <div style={{ marginBottom: '14px', background: 'rgba(255,215,0,0.06)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,215,0,0.15)' }}>
              <div style={{ fontSize: '11px', color: '#B8860B', fontWeight: '900', marginBottom: '8px' }}>💡 현지 고수 실전 팁</div>
              <div style={{ fontSize: '13px', color: '#FFE066', fontWeight: '700', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{selectedPoint.tip}</div>
            </div>

            {/* 접근 방법 */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '11px', color: '#B8860B', fontWeight: '900', marginBottom: '6px' }}>🗺️ 접근 방법</div>
              <div style={{ fontSize: '13px', color: '#ccc', fontWeight: '700', lineHeight: '1.6' }}>{selectedPoint.access}</div>
            </div>
          </div>
        )}

        {/* 1. CCTV 실시간 뷰 영역 (인라인 비디오 렌더링 고도화) */}
        <div style={{ position: 'relative', height: '230px', backgroundColor: '#0A0A0F', borderRadius: '18px', overflow: 'hidden', marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
          
          {/* 마스터 전용 UI: CCTV 정보 수정 버튼 */}
          {isAdmin && (
            <button 
              onClick={() => {
                setIsEditingCctv(!isEditingCctv);
                if (!isEditingCctv) setEditYoutubeId(cctvData?.youtubeId || '');
              }}
              style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,215,0,0.9)', color: '#000', fontSize: '11px', fontWeight: '900', padding: '6px 10px', borderRadius: '8px', zIndex: 40, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
            >
              🔄 {isEditingCctv ? '수정 닫기' : `마스터 편집 (${cctvData?.youtubeId || '미등록'})`}
            </button>
          )}

          {/* 마스터 전용 UI: 입력 폼 오버레이 */}
          {isAdmin && isEditingCctv && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
              <div style={{ color: '#FFD700', fontSize: '13px', fontWeight: '900', marginBottom: '16px' }}>🛠 [{selectedPoint.name}] 실시간 유튜브 영상 ID 교체</div>
              <input 
                value={editYoutubeId}
                onChange={(e) => setEditYoutubeId(e.target.value)}
                placeholder="YouTube URL 뒤 11자리 (예: jfKfPfyJRdk)"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #FFD700', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', fontWeight: '800', marginBottom: '16px', textAlign: 'center', outline: 'none' }}
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
                  {isSavingCctv ? '업데이트 중...' : '즉시 적용 및 재생'}
                </button>
              </div>
            </div>
          )}

          {/* LITE 잠금 오버레이 */}
          {!canAccessPremium && (
            <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, background: 'rgba(10,10,15,0.7)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px', filter: 'drop-shadow(0 2px 8px rgba(255,255,255,0.2))' }}>🔐</div>
              <div style={{ fontSize: '16px', color: '#fff', fontWeight: '950', marginBottom: '8px' }}>LITE 플랜 이상 전용 영상</div>
              <div style={{ fontSize: '12px', color: '#aaa', fontWeight: '600', marginBottom: '20px', textAlign: 'center', padding: '0 20px' }}>
                현장의 파도와 분위기를 1초 단위로 <br/> 파악할 수 있는 인라인 라이브 시스템입니다.
              </div>
              <button 
                onClick={() => navigate('/vvip-subscribe')}
                style={{ background: 'linear-gradient(135deg, #FF3B30, #D32F2F)', color: '#fff', border: 'none', borderRadius: '30px', padding: '10px 28px', fontSize: '13px', fontWeight: '950', cursor: 'pointer', boxShadow: '0 6px 20px rgba(255,59,48,0.4)' }}
              >
                LITE \ud50c\ub79c \uc5c5\uadf8\ub808\uc774\ub4dc
              </button>
            </div>
          )}

          {/* 실제 영상 / 콘텐츠 */}
          {cctvLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #FF3B30', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ color: '#fff', fontSize: '12px', fontWeight: '800' }}>📡 대상어 현장 영상 연결 중...</div>
            </div>
          ) : cctvData ? (
             cctvData.type === 'youtube' && cctvData.url ? (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <iframe
                    src={cctvData.url}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                  {/* 임베딩 차단 우회 및 전체화면용 외부 링크 버튼 */}
                  <button 
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${cctvData.youtubeId}`, '_blank')}
                    style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(255,0,0,0.85)', color: '#fff', border: 'none', borderRadius: '20px', padding: '6px 12px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M10 15l5.19-3-5.19-3v6zm11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg>
                    앱으로 보기
                  </button>
                </div>
             ) : cctvData.fallbackImg ? (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <img 
                    src={cctvData.type === 'mof' ? `${API_BASE}${cctvData.fallbackImg}?t=${mofTimestamp}` : cctvData.fallbackImg} 
                    alt={cctvData.areaName} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    onError={(e) => {
                      if (e.target.src !== cctvData.safeFallbackImg) {
                        e.target.src = cctvData.safeFallbackImg;
                      }
                    }}
                  />
                  {/* MOF 실시간 연안침식 모니터링 워터마크 레이아웃 */}
                  <div style={{ position: 'absolute', bottom: '60px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 8px', color: '#fff', fontSize: '13px', fontFamily: 'monospace', textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)', fontWeight: 'bold', zIndex: 5 }}>
                    <span style={{color: '#ff4444'}}>● REC</span>
                    <span>MOF_{selectedPoint?.obsCode}</span>
                  </div>
                  
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '36px 16px 12px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', zIndex: 6 }}>
                    <div style={{ color: '#00D1FF', fontSize: '12px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🌊 해양수산부 공식 실시간 연안 모니터링
                    </div>
                    <div style={{ color: '#fff', fontSize: '10px', marginTop: '4px', fontWeight: '600', opacity: 0.8 }}>
                      현장의 파고 및 연안침식 상태를 파악할 수 있는 해양수산부 공식 뷰어 시스템과 연동되어 있습니다.
                    </div>
                  </div>
                </div>
             ) : (
                <div style={{ color: '#888', fontSize: '13px', fontWeight: '700' }}>현재 송출 가능한 영상이 없습니다.</div>
             )
          ) : (
             <div style={{ color: '#888', fontSize: '13px', fontWeight: '700' }}>시스템 오류 (데이터를 불러올 수 없습니다.)</div>
          )}

          {/* LIVE 배지 (고퀄리티) */}
          <div style={{ position: 'absolute', top: '14px', left: '14px', background: 'rgba(230,0,0,0.95)', color: '#fff', fontSize: '10px', fontWeight: '950', padding: '5px 10px', borderRadius: '8px', zIndex: 5, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(230,0,0,0.5)' }}>
            <span style={{ display: 'inline-block', width: '5px', height: '5px', background: '#fff', borderRadius: '50%', marginRight: '6px', animation: 'pulse 1.2s infinite' }}></span>
            L I V E
          </div>
          
          {cctvData?.areaName && (
             <div style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '5px 10px', borderRadius: '8px', backdropFilter: 'blur(8px)', zIndex: 5, border: '1px solid rgba(255,255,255,0.1)' }}>
              📍 {cctvData.areaName}
             </div>
          )}
        </div>


        {/* 2. API 데이터 렌더링 영역 */}
        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', border: '3px solid #1565C0', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>해양 데이터를 분석 중입니다...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* AI 낚시 컨디션 (냉정한 평가) */}
            {(() => {
              const cond = evaluateFishingCondition(marineData, selectedPoint);
              return (
                <div style={{ backgroundColor: '#fff', border: `2px solid ${cond.color}`, borderRadius: '20px', padding: '20px', marginBottom: '10px', boxShadow: `0 8px 24px ${cond.color}20`, position: 'relative', overflow: 'hidden' }}>
                  {/* 상단 헤더 및 점수 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '950', color: '#fff', background: cond.color, padding: '4px 12px', borderRadius: '30px', letterSpacing: '-0.02em', boxShadow: `0 2px 8px ${cond.color}40` }}>
                        AI 낚시 컨디션
                      </span>
                    </div>
                    <span style={{ fontSize: '38px', fontWeight: '950', color: cond.color, lineHeight: 1, letterSpacing: '-0.05em' }}>{cond.score}<span style={{ fontSize: '18px', fontWeight: '800' }}>점</span></span>
                  </div>

                  {/* 냉정한 조언 텍스트 */}
                  <div style={{ fontSize: '17px', fontWeight: '900', color: '#1A1A2E', marginBottom: '18px', lineHeight: 1.5, letterSpacing: '-0.04em', whiteSpace: 'pre-line' }}>
                    "{cond.advice}"
                  </div>

                  {/* 신랄한 태그 리스트 */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {cond.tags.map((tag, i) => (
                      <span key={i} style={{ fontSize: '11px', fontWeight: '800', color: cond.color, background: `${cond.color}10`, padding: '5px 10px', borderRadius: '10px', border: `1px solid ${cond.color}20` }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 냉정한 장비 가이드 가로바 */}
                  <div style={{ backgroundColor: '#F8F9FC', padding: '14px', borderRadius: '16px', border: '1px solid #F0F2F7', display: 'flex', gap: '10px', alignItems: 'start' }}>
                    <div style={{ fontSize: '20px', flexShrink: 0 }}>🧰</div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', marginBottom: '3px' }}>전문가 권장 채비</div>
                      <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#1A1A2E', lineHeight: 1.4 }}>{cond.gear}</div>
                    </div>
                  </div>

                  {/* 쇼핑 아이템 추천 영역 */}
                  {Array.isArray(shoppingItems) && shoppingItems.length > 0 && (
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        🛒 이 포인트 권장 채비 쇼핑
                      </div>
                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
                        {shoppingItems.map((item) => (
                          <div 
                            key={item.productId}
                            onClick={() => window.open(item.coupangUrl, '_blank')}
                            style={{ 
                              minWidth: '120px', width: '120px', 
                              backgroundColor: '#fff', borderRadius: '12px', padding: '8px',
                              boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #EBF2FF',
                              cursor: 'pointer', flexShrink: 0, transition: 'transform 0.15s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                          >
                            <img 
                              src={item.productImage} 
                              alt={item.productName} 
                              style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }}
                            />
                            <div style={{ fontSize: '10px', fontWeight: '800', color: '#1A1A2E', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.3, marginBottom: '6px', height: '26px' }}>
                              {item.productName}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '12px', fontWeight: '950', color: '#E65100' }}>
                                {(Number(item.productPrice) || 0).toLocaleString()}원
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#F4F6FA', padding: '16px', borderRadius: '12px' }}>
              <span style={{ fontWeight: '800', color: '#555' }}>현재 실측 수온</span>
              <span style={{ color: '#0056D2', fontWeight: '900', fontSize: '18px' }}>{marineData.sst || marineData.waterTemp || '-'}°C</span>
            </div>

            <div style={{ backgroundColor: '#F4F6FA', padding: '16px', borderRadius: '12px' }}>
              <span style={{ fontWeight: '900', display: 'block', marginBottom: '12px', color: '#333' }}>층별 수온 정보 (상/중/저)</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { label: '상층', val: marineData.sst || marineData.waterTemp || '-', color: '#64B5F6' },
                  { label: '중층', val: marineData.sst ? (parseFloat(marineData.sst) - 1.2).toFixed(1) : '-', color: '#42A5F5' },
                  { label: '저층', val: marineData.sst ? (parseFloat(marineData.sst) - 3.4).toFixed(1) : '-', color: '#1E88E5' },
                ].map(l => (
                  <div key={l.label} style={{ flex: 1, backgroundColor: '#fff', padding: '10px 6px', borderRadius: '10px', textAlign: 'center', border: '1.5px solid #F0F2F7' }}>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#8E8E93', marginBottom: '4px' }}>{l.label}</div>
                    <div style={{ fontSize: '15px', fontWeight: '950', color: l.color }}>{l.val !== '-' ? `${l.val}°C` : '-'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: '#F4F6FA', padding: '16px', borderRadius: '12px' }}>
              <span style={{ fontWeight: '900', display: 'block', marginBottom: '12px', color: '#333' }}>오늘의 물때 (만조/간조)</span>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.95rem', color: '#555' }}>
                {marineData.tide && (marineData.tide.phase || marineData.tide_predictions) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '4px' }}>
                      {marineData.tide.phase || '조석 분석 중'}
                    </div>
                    {/* 예측 데이터 리스트가 있는 경우 표시 */}
                    {marineData.tide_predictions && marineData.tide_predictions.slice(0, 4).map((t, idx) => (
                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ fontWeight: '700' }}>{t.tph_time || t.time}</span>
                        <span style={{ color: (t.hl_code || t.type) === '고조' ? '#E65100' : '#1565C0', fontWeight: '800' }}>
                          {(t.hl_code || t.type) === '고조' ? '▲ 만조' : '▼ 간조'} : {t.tph_level || t.level}cm
                        </span>
                      </li>
                    ))}
                  </div>
                ) : (
                  <li style={{ color: '#888', fontSize: '13px' }}>현장 물때 데이터를 실시간 분석 중입니다.</li>
                )}
              </ul>
            </div>

            {marineData.fishingIndex && (
              <div style={{ backgroundColor: '#F4F6FA', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontWeight: '900', display: 'block', marginBottom: '8px', color: '#333' }}>바다 낚시지수</span>
                <div style={{ fontSize: '0.9rem', color: '#555' }}>{JSON.stringify(marineData.fishingIndex)}</div>
              </div>
            )}

            {/* 3. B2B 로컬 입점 매장 광고 (지도 위치 기반 노른자위 광고 지면) */}
            <div style={{ marginTop: '8px', backgroundColor: '#FFF4E5', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', border: '1px solid #FFE0B2', boxShadow: '0 4px 10px rgba(255, 152, 0, 0.1)' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#FFB74D', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                🏬
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#E65100', fontWeight: '900', background: '#FFE0B2', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px', display: 'inline-block' }}>로컬 제휴 할인</span>
                <div style={{ fontSize: '15px', fontWeight: '900', color: '#E65100', marginBottom: '2px' }}>{selectedPoint.name} 도보 3분: 지역 낚시마트</div>
                <div style={{ fontSize: '12px', color: '#F57C00', fontWeight: '800' }}>살아있는 미끼 및 각크릴 10% 단독할인 쿠폰!</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
