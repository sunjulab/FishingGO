import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Map, BarChart2, Ship, Crown, Zap, Search, Clock,
  Waves, Wind, Tv, AlertCircle, X, MapPin, Lock, Play,
} from 'lucide-react';
import apiClient from '../api/index';
import CsInquirySection from '../components/CsInquirySection';
import { RewardGateModal } from '../components/AdUnit';
import { AdSenseDisplay } from '../components/ads/AdSenseAd';

export default function DashboardView({
  viewMode,
  selectedPoint,
  tideData,
  precisionData,
  score,
  phase,
  isGolden,
  mainAdvice,
  alertAdvice,
  dynamicAlert,
  baitTip,
  scoreStyle,
  favorites,
  setViewMode,
  handlePointClick,
  canAccessPremium,
  showSecretPoints,
  setShowSecretPoints,
  addToast,
  weatherCache,
  PREMIUM_POINTS,
  recentPosts,
  user,
  isAdmin,
  currentTier,
  filter,
  setFilter,
  searchRef,
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
  showSearch,
  setShowSearch,
  handleSearch,
  DEFAULT_POINT,
  EMOJI_MAP,
  findNearestStation,
  evaluateFishingCondition,
  getPointSpecificData,
  setCctvData,
  setShowCCTV,
}) {
  const navigate = useNavigate();

  // ── 포인트 확인 광고 게이트 ──────────────────────────────────────────
  const [showPointAdGate, setShowPointAdGate] = useState(false);
  const [pendingPoint, setPendingPoint] = useState(null);
  const [pointAdContext, setPointAdContext] = useState('point');
  // 이번 세션에서 광고로 잠금 해제된 포인트 ID Set
  const [unlockedPoints, setUnlockedPoints] = useState(() => new Set());

  // 포인트 카드 클릭 핸들러 (비프리미엄: 광고 게이트)
  const handlePremiumPointClick = (point) => {
    if (canAccessPremium || unlockedPoints.has(point.id)) {
      setViewMode('map');
      handlePointClick(point);
      return;
    }
    setPendingPoint(point);
    setPointAdContext('point');
    setShowPointAdGate(true);
  };

  // 보상 광고 완료 후 포인트 언락
  const handlePointAdComplete = () => {
    if (!pendingPoint) return;
    setUnlockedPoints(prev => new Set([...prev, pendingPoint.id]));
    addToast(`📍 ${pendingPoint.name} 포인트가 해제됐습니다! 🎉`, 'success');
    if (pointAdContext === 'secret') {
      setViewMode('map');
      setShowSecretPoints(true);
      addToast('⭐ 비밀 포인트 25곳이 지도에 표시됩니다!', 'success');
    } else {
      setViewMode('map');
      handlePointClick(pendingPoint);
    }
    setPendingPoint(null);
  };
  // ──────────────────────────────────────────────────────────────────


  return (
    <>
    <div style={{ display: viewMode === 'dashboard' ? 'flex' : 'none', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))', scrollbarWidth: 'none' }}>

        {/* 검색바 + 드롭다운 */}
        <div style={{ padding: '16px 16px 0', position: 'relative', zIndex: 50 }} ref={searchRef}>
          <div style={{ height: '48px', backgroundColor: '#fff', borderRadius: '14px', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px', border: '1.5px solid #EBF2FF', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <Search size={16} color="#1565C0" strokeWidth={3} />
            <input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery && setShowSearch(true)}
              placeholder="포인트, 어종, 지역 검색하여 현재 화면에 반영"
              style={{ border: 'none', background: 'none', fontSize: `calc(13.5px * var(--fs, 1))`, fontWeight: '800', outline: 'none', width: '100%', color: '#1A1A2E' }}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearch(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AAB0BE', padding: 0 }}>
                <X size={16} />
              </button>
            )}
          </div>

          {showSearch && searchResults.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: '16px', right: '16px', background: '#fff', borderRadius: '14px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #F0F2F7', zIndex: 100, maxHeight: '280px', overflowY: 'auto', marginTop: '6px' }}>
              {searchResults.map((p, i) => (
                <div key={p.id}
                  onClick={() => { handlePointClick(p, true); setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}
                  style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: i < searchResults.length - 1 ? '1px solid #F8F9FC' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8F9FC'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: '32px', height: '32px', background: '#EBF2FF', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `calc(16px * var(--fs, 1))`, flexShrink: 0 }}>
                    {EMOJI_MAP[p.type] || '⚓'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '950', color: '#1A1A2E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '800', marginTop: '2px' }}>{p.region} · {p.type} · {(p.fish || (p.targets && p.targets.length > 0 ? p.targets.join(',') : '')).split(',')[0]}</div>
                  </div>
                  {(() => {
                    const _st = findNearestStation(p.lat, p.lng);
                    const _live = weatherCache[_st?.id];
                    const _sd = getPointSpecificData(p);
                    const _wd = _live ? { ..._live, stationId: _st.id, tide: _live.tide || _sd?.tide, pointName: p.name } : _sd; // ✅ tide 실시간 우선
                    // ✅ _serverScore 활용: sst 없을 때 서버 계산 점수 즉시 사용
                    const _sc = (_live?._serverScore && !_live?.sst)
                      ? _live._serverScore
                      : evaluateFishingCondition(_wd, p).score;
                    const _label = _sc >= 90 ? '최고' : _sc >= 75 ? '활발' : _sc >= 50 ? '보통' : _sc >= 30 ? '저조' : '위험';
                    const _col   = _sc >= 90 ? '#00C48C' : _sc >= 75 ? '#1565C0' : _sc >= 50 ? '#FF9B26' : _sc >= 30 ? '#FF5A5F' : '#D32F2F';
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                        <div style={{ background: _col, borderRadius: '6px', padding: '3px 8px' }}>
                          <span style={{ fontSize: `calc(9px * var(--fs, 1))`, fontWeight: '900', color: '#fff' }}>{_label}</span>
                        </div>
                        <span style={{ fontSize: `calc(9px * var(--fs, 1))`, color: '#AAB0BE', fontWeight: '700' }}>{_sc}점</span>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
          {showSearch && searchResults.length === 0 && searchQuery && (
            <div style={{ position: 'absolute', top: '100%', left: '16px', right: '16px', background: '#fff', borderRadius: '14px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #F0F2F7', zIndex: 100, padding: '20px', textAlign: 'center', marginTop: '6px' }}>
              <AlertCircle size={24} color="#AAB0BE" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '800' }}>검색 결과가 없어요</div>
            </div>
          )}
        </div>

        {/* 민물 포인트 카드 */}
        {selectedPoint?.type === '민물' && (
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #43A047 60%, #66BB6A 100%)', borderRadius: '20px', padding: '18px 18px 16px', boxShadow: '0 8px 30px rgba(46,125,50,0.25)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.75)', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '700', marginBottom: '8px' }}>
                <MapPin size={10} color="rgba(255,255,255,0.75)" fill="rgba(255,255,255,0.4)" />
                {selectedPoint.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: `calc(36px * var(--fs, 1))` }}>🐟</span>
                <div>
                  <div style={{ fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '950', color: '#fff', lineHeight: 1.3 }}>{selectedPoint.region} 민물낚시 포인트</div>
                  <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: 'rgba(255,255,255,0.75)', fontWeight: '700', marginTop: '4px' }}>{selectedPoint.fish || (selectedPoint.targets ? selectedPoint.targets.join(', ') : '')}</div>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 14px', border: '1px solid rgba(255,255,255,0.15)', fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.8)', fontWeight: '700', lineHeight: 1.6 }}>
                🌊 내수면 포인트로 날씨·수온·CCTV 정보가 제공되지 않습니다.<br />장소 정보만 제공됩니다.
              </div>
            </div>
          </div>
        )}

        {/* 바다 포인트 메인 카드 */}
        {selectedPoint?.type !== '민물' && (
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ background: 'linear-gradient(135deg, #1565C0 0%, #1E88E5 60%, #42A5F5 100%)', borderRadius: '20px', padding: '18px 18px 16px', boxShadow: '0 8px 30px rgba(21,101,192,0.25)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.75)', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '700', marginBottom: '6px' }}>
                <MapPin size={10} color="rgba(255,255,255,0.75)" fill="rgba(255,255,255,0.4)" />
                {precisionData?.pointName || selectedPoint?.name || DEFAULT_POINT.name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: `calc(38px * var(--fs, 1))`, fontWeight: '950', color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {tideData.temp
                    ? (typeof tideData.temp === 'string' ? tideData.temp.replace('°C', '') : tideData.temp) + '°'
                    : (tideData.sst ? parseFloat(tideData.sst).toFixed(1) + '°' : '-')}{/* ✅ BUG-4 FIX */}
                  </div>
                  <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.88)', fontWeight: '700', marginTop: '6px', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {mainAdvice}
                    {alertAdvice && (<><br /><span style={{ color: '#FF8080', fontWeight: '900', fontSize: `calc(10px * var(--fs, 1))` }}>⚠ 특보 </span><span style={{ color: 'rgba(255,200,200,0.95)', fontWeight: '700', fontSize: `calc(10px * var(--fs, 1))` }}>{alertAdvice}</span></>)}
                  </div>
                  {dynamicAlert && dynamicAlert !== alertAdvice && (
                    <div style={{ display: 'inline-flex', alignItems: 'flex-start', gap: '5px', marginTop: '6px', background: 'rgba(255,80,80,0.22)', border: '1px solid rgba(255,80,80,0.5)', borderRadius: '8px', padding: '5px 9px', lineHeight: 1.45 }}>
                      <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', color: '#FF8080', flexShrink: 0, paddingTop: '1px' }}>🚨 기상</span>
                      <span style={{ fontSize: `calc(10px * var(--fs, 1))`, color: 'rgba(255,200,200,0.95)', fontWeight: '700' }}>{dynamicAlert}</span>
                    </div>
                  )}
                </div>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0, background: scoreStyle.bg, border: `2px solid ${scoreStyle.border}`, boxShadow: scoreStyle.glow, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', position: 'relative' }}>
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="32" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
                    <circle cx="36" cy="36" r="32" fill="none" stroke={scoreStyle.border} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(score / 100) * 201} 201`} style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                  </svg>
                  <div style={{ fontSize: `calc(22px * var(--fs, 1))`, fontWeight: '950', color: scoreStyle.numColor, lineHeight: 1, position: 'relative' }}>{score}</div>
                  <div style={{ fontSize: `calc(7.5px * var(--fs, 1))`, fontWeight: '800', color: 'rgba(255,255,255,0.55)', marginTop: '2px', position: 'relative' }}>낚시점수</div>
                  <div style={{ fontSize: `calc(6.5px * var(--fs, 1))`, fontWeight: '900', color: scoreStyle.numColor, opacity: 0.9, position: 'relative', marginTop: '1px', letterSpacing: '0.02em' }}>{scoreStyle.label}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                {[
                  { label: '상층', val: tideData.layers?.upper ? `${tideData.layers.upper}°` : (tideData.sst ? `${parseFloat(tideData.sst).toFixed(1)}°` : '-'), color: '#64B5F6' },
                  { label: '중층', val: tideData.layers?.middle ? `${tideData.layers.middle}°` : (tideData.sst ? `${(parseFloat(tideData.sst)-1.2).toFixed(1)}°` : '-'), color: '#42A5F5' },
                  { label: '저층', val: tideData.layers?.lower  ? `${tideData.layers.lower}°`  : (tideData.sst ? `${(parseFloat(tideData.sst)-3.4).toFixed(1)}°` : '-'), color: '#1E88E5' },
                ].map(l => (
                  <div key={l.label} style={{ flex: 1, background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '8px 4px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: `calc(9px * var(--fs, 1))`, color: 'rgba(255,255,255,0.6)', fontWeight: '800', marginBottom: '2px' }}>{l.label}</div>
                    <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#fff', fontWeight: '950' }}>{l.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px', flex: 1, alignItems: 'center' }}>
                  {[
                    { Icon: Waves, label: '파고', val: `${tideData.wave?.coastal || '0.4'}m` },
                    { Icon: Wind,  label: '풍속', val: `${tideData.wind?.speed || '2.1'}m/s` },
                    { Icon: Clock, label: '만조', val: tideData.tide?.high || '15:20' },
                  ].map(chip => (
                    <div key={chip.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, background: 'rgba(255,255,255,0.14)', borderRadius: '30px', padding: '6px 12px', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <chip.Icon size={11} color="rgba(255,255,255,0.8)" />
                      <span style={{ fontSize: `calc(9px * var(--fs, 1))`, color: 'rgba(255,255,255,0.6)', fontWeight: '700' }}>{chip.label}</span>
                      <span style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#fff', fontWeight: '950' }}>{chip.val}</span>
                    </div>
                  ))}
                </div>
                {selectedPoint?.type !== '민물' && (
                  <div
                    onClick={async () => {
                      if (!canAccessPremium) { addToast('📺 실시간 해양 CCTV는 LITE 플랜 이상에서 제공됩니다.', 'error'); return; }
                      const sid = selectedPoint?.obsCode || 'DT_0001';
                      try {
                        const pointIdQuery = selectedPoint?.id ? `&pointId=point_${selectedPoint.id}` : '';
                        const res = await apiClient.get(`/api/weather/cctv?stationId=${sid}${pointIdQuery}`);
                        setCctvData(res.data); setShowCCTV(true);
                      } catch { addToast('영상 데이터를 불러오는 데 실패했습니다.', 'error'); }
                    }}
                    style={{ flexShrink: 0, background: canAccessPremium ? 'rgba(255,215,0,0.9)' : 'rgba(255,255,255,0.15)', border: canAccessPremium ? 'none' : '1px solid rgba(255,255,255,0.2)', borderRadius: '30px', padding: '6px 14px', display: 'inline-flex', flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap', gap: '5px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', userSelect: 'none', WebkitUserSelect: 'none' }}
                  >
                    <Tv size={13} color="#1A1A2E" style={{ flexShrink: 0, display: 'block' }} />
                    <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', color: '#1A1A2E', lineHeight: 1, flexShrink: 0, whiteSpace: 'nowrap' }}>실시간 영상</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}



        {/* AI 낚시 적합도 게이지 — 민물 포인트 제외 */}
        {selectedPoint?.type !== '민물' && (
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '16px 18px', border: '1.5px solid #F0F2F7', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: `calc(15px * var(--fs, 1))` }}>🎯</span>
                <span style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: '#1A1A2E' }}>AI 낚시 적합도</span>
              </div>
              <div style={{ background: score >= 90 ? 'linear-gradient(135deg, #00C48C, #00897B)' : score >= 75 ? 'linear-gradient(135deg, #1565C0, #1E88E5)' : score >= 50 ? 'linear-gradient(135deg, #FF9B26, #F57F17)' : 'linear-gradient(135deg, #FF5A5F, #D32F2F)', borderRadius: '20px', padding: '4px 12px' }}>
                <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', color: '#fff' }}>
                  {score >= 90 ? '🔥 피딩 중!' : score >= 75 ? '✅ 출조 추천' : score >= 50 ? '🙂 보통' : '⚠ 재고 필요'}
                </span>
              </div>
            </div>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <div style={{ height: '10px', background: '#F0F2F7', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${score}%`, background: score >= 90 ? 'linear-gradient(90deg, #00C48C, #00E5A8)' : score >= 75 ? 'linear-gradient(90deg, #1565C0, #42A5F5)' : score >= 50 ? 'linear-gradient(90deg, #FF9B26, #FFD54F)' : 'linear-gradient(90deg, #FF5A5F, #FF8A80)', borderRadius: '6px', transition: 'width 1s cubic-bezier(0.25, 1, 0.5, 1)', boxShadow: score >= 90 ? '0 0 8px rgba(0,196,140,0.6)' : 'none' }} className={score >= 90 ? 'gauge-pulse' : ''} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                <span style={{ fontSize: `calc(9px * var(--fs, 1))`, color: '#C7C7CC', fontWeight: '700' }}>0</span>
                <span style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '950', color: score >= 90 ? '#00C48C' : score >= 75 ? '#1565C0' : score >= 50 ? '#FF9B26' : '#FF5A5F' }}>{score}점</span>
                <span style={{ fontSize: `calc(9px * var(--fs, 1))`, color: '#C7C7CC', fontWeight: '700' }}>100</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '4px' }}>
              {[
                { label: '수온', val: `${parseFloat(tideData.sst || 14).toFixed(1)}°C`, ok: parseFloat(tideData.sst || 14) >= 12 && parseFloat(tideData.sst || 14) <= 22 },
                { label: '파고', val: `${tideData.wave?.coastal || '0.4'}m`, ok: parseFloat(tideData.wave?.coastal || 0.4) <= 1.0 },
                { label: '풍속', val: `${tideData.wind?.speed || '2.1'}m/s`, ok: parseFloat(tideData.wind?.speed || 2.1) <= 5 },
                { label: '물때', val: phase.slice(0, 3), ok: !phase.includes('조금') && !phase.includes('무시') && !phase.includes('13물') && !phase.includes('14물') && !phase.includes('15물') },
              ].map(item => (
                <div key={item.label} style={{ background: item.ok ? 'rgba(0,196,140,0.08)' : 'rgba(255,90,95,0.08)', border: `1px solid ${item.ok ? 'rgba(0,196,140,0.25)' : 'rgba(255,90,95,0.25)'}`, borderRadius: '10px', padding: '7px 4px', textAlign: 'center' }}>
                  <div style={{ fontSize: `calc(9px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '700' }}>{item.label}</div>
                  <div style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '950', color: item.ok ? '#00C48C' : '#FF5A5F', marginTop: '2px' }}>{item.val}</div>
                  <div style={{ fontSize: `calc(8px * var(--fs, 1))`, color: item.ok ? '#00C48C' : '#FF5A5F', fontWeight: '800' }}>{item.ok ? '✓ 양호' : '✗ 주의'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* 퀵메뉴 */}
        <div style={{ padding: '16px 16px 4px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {[
              { Icon: Map,       label: '포인트',   color: '#1565C0', bg: '#EBF2FF',  action: () => setViewMode('map'),     locked: false },
              { Icon: BarChart2, label: '날씨',     color: '#2E7D32', bg: '#EDF7EE',  action: () => navigate('/weather'),   locked: false },
              { Icon: Ship,      label: '선상/크루', color: '#BF360C', bg: '#FFF3EE', action: () => navigate('/community'), locked: false },
              { Icon: Crown,     label: '클럽',     color: '#6A1B9A', bg: '#F5EEFF',  action: () => navigate('/community'), locked: false },
              {
                label: '비밀포인트',
                locked: !canAccessPremium,
                action: () => {
                  if (!canAccessPremium) {
                    setPendingPoint({ id: 'secret', name: '비밀 포인트' });
                    setPointAdContext('secret');
                    setShowPointAdGate(true);
                    return;
                  }
                  setViewMode('map'); setShowSecretPoints(true); addToast('⭐ 비밀 포인트 25곳이 지도에 표시됩니다!', 'success');
                },
                customIcon: (
                  <div style={{ position: 'relative', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: `calc(22px * var(--fs, 1))`, filter: canAccessPremium ? 'drop-shadow(0 0 6px rgba(255,200,0,0.9)) drop-shadow(0 0 2px rgba(255,160,0,0.6))' : 'grayscale(1) opacity(0.5)', animation: canAccessPremium ? 'secretPulse 2s ease-in-out infinite' : 'none' }}>⭐</span>
                    {!canAccessPremium && (
                      <div style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '13px', height: '13px', background: '#8E8E93', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff' }}>
                        <Lock size={7} color="#fff" />
                      </div>
                    )}
                  </div>
                ),
              },
            ].map((m, index) => (
              <div key={index} onClick={m.action} style={{ textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#fff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '5px', boxShadow: (!m.locked && m.label === '비밀포인트') ? '0 3px 14px rgba(255,200,0,0.25)' : '0 2px 8px rgba(0,0,0,0.05)', border: (!m.locked && m.label === '비밀포인트') ? '1.5px solid rgba(255,215,0,0.45)' : '1px solid #F0F2F7', transition: 'transform 0.15s' }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {m.customIcon ? m.customIcon : (
                    <div style={{ width: '36px', height: '36px', background: m.bg, borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <m.Icon size={19} color={m.color} />
                    </div>
                  )}
                </div>
                <span style={{ fontSize: `calc(9px * var(--fs, 1))`, fontWeight: '800', color: (!m.locked && m.label === '비밀포인트') ? '#B8860B' : '#555' }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 피딩 타임 */}
        <div style={{ padding: '10px 16px 6px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '12px 14px', border: '1.5px solid #F0F2F7' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <Zap size={13} color="#FFB300" fill="#FFB300" />
              <span style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', color: '#1A1A2E', marginLeft: '5px' }}>피딩 타임</span>
              <span style={{ marginLeft: 'auto', fontSize: `calc(10px * var(--fs, 1))`, color: isGolden ? '#E65100' : '#8E8E93', fontWeight: '800' }}>
                {isGolden ? '🌟 황금물때' : phase.split('(')[0]}
              </span>
            </div>
            {(() => {
              const now = new Date();
              const nowMin = now.getHours() * 60 + now.getMinutes();
              const parseTime = (str) => { if (!str) return null; const [h, m] = String(str).split(':').map(Number); return isNaN(h) ? null : h * 60 + (m || 0); };
              const highMin = parseTime(tideData.tide?.high);
              const lowMin  = parseTime(tideData.tide?.low);
              const goldenMin = highMin ?? 870;
              const lowMinVal = lowMin ?? 360;
              const nextLowMin = (lowMinVal + 720) % 1440;
              const fmt = (mn) => { const hh = Math.floor(((mn % 1440) + 1440) % 1440 / 60); const mm = ((mn % 1440) + 1440) % 1440 % 60; return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; };
              const isInWindow = (centerMin, windowMin = 40) => Math.abs(nowMin - centerMin) <= windowMin || Math.abs(nowMin - centerMin + 1440) <= windowMin || Math.abs(nowMin - centerMin - 1440) <= windowMin;
              const slots = [
                { label: '간조 물때', time: fmt(lowMinVal), active: isInWindow(lowMinVal, 35), val: lowMinVal },
                { label: '만조 (황금)✨', time: fmt(goldenMin), active: isInWindow(goldenMin, 40), val: goldenMin },
                { label: '다음 물때', time: fmt(nextLowMin), active: isInWindow(nextLowMin, 35), val: nextLowMin },
              ];
              slots.sort((a, b) => a.val - b.val);
              const hasActive = slots.some(s => s.active);
              if (!hasActive) { const diffs = slots.map((s, i) => ({ i, diff: ((s.val - nowMin) + 1440) % 1440 })); diffs.sort((a, b) => a.diff - b.diff); slots[diffs[0].i].next = true; }
              return (
                <div style={{ display: 'flex', gap: '6px' }}>
                  {slots.map((ft, i) => (
                    <div key={i} style={{ flex: 1, padding: '8px 2px', borderRadius: '12px', textAlign: 'center', background: ft.active ? 'linear-gradient(135deg, #FFD700, #FFA000)' : ft.next ? 'linear-gradient(135deg, #E8F4FF, #D0E8FF)' : '#F8F9FC', border: ft.active ? 'none' : ft.next ? '1px solid #90CAF9' : '1px solid #F0F2F7' }}>
                      <div style={{ fontSize: `calc(8px * var(--fs, 1))`, fontWeight: '900', color: ft.active ? '#5C3A00' : ft.next ? '#1565C0' : '#AAB0BE', marginBottom: '2px' }}>{ft.label}{ft.next ? ' (다음)' : ''}</div>
                      <div style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '950', color: ft.active ? '#1A1A00' : ft.next ? '#1565C0' : '#8E8E93' }}>{ft.time}</div>
                      {ft.active && <div style={{ fontSize: `calc(7px * var(--fs, 1))`, color: '#5C3A00', fontWeight: '900', marginTop: '1px' }}>🔥 지금!</div>}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {/* 프리미엄 멤버십 */}
        <div style={{ padding: '8px 16px 12px' }}>
          {canAccessPremium ? (
            <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #111218 0%, #1E1F2E 100%)', borderRadius: '20px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 12px 30px rgba(0,0,0,0.2)', border: '1px solid rgba(255,215,0,0.2)' }}>
              <div style={{ position: 'absolute', top: '-40%', right: '-10%', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)', backgroundSize: '200% 100%', animation: 'shimmer 3s infinite linear', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', width: '46px', height: '46px', background: 'linear-gradient(135deg, #FFD700, #FFA000)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 6px 20px rgba(255,215,0,0.3)' }}>
                <Crown size={24} color="#5C3A00" fill="#5C3A00" />
                <div style={{ position: 'absolute', top: '-3px', right: '-3px', width: '12px', height: '12px', background: '#00C48C', borderRadius: '50%', border: '2px solid #1E1F2E', animation: 'pulse 2s infinite' }} />
              </div>
              <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <span style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '950', color: '#fff' }}>{currentTier.label || 'LITE'} 구독 중</span>
                  <span style={{ background: '#00C48C', fontSize: `calc(8px * var(--fs, 1))`, padding: '2px 6px', borderRadius: '10px', color: '#fff', fontWeight: '900' }}>활성</span>
                </div>
                <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: 'rgba(255,255,255,0.55)', fontWeight: '600' }}>비밀 포인트 25곳 · 히트맵 · CCTV 이용 가능</div>
              </div>
              <div onClick={() => { setViewMode('map'); setShowSecretPoints(true); addToast('⭐ 비밀 포인트 25곳이 지도에 표시됩니다!', 'success'); }}
                style={{ position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.1)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '30px', padding: '8px 12px', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer', backdropFilter: 'blur(5px)', whiteSpace: 'nowrap' }}>
                비밀포인트 보기 ›
              </div>
            </div>
          ) : (
            <div onClick={() => navigate('/vvip-subscribe')} style={{ background: 'linear-gradient(135deg, #0D0D1A 0%, #1A1A2E 100%)', borderRadius: '22px', padding: '18px 20px', border: '1px solid rgba(255,215,0,0.22)', boxShadow: '0 12px 32px rgba(0,0,0,0.22)', position: 'relative', overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', transition: 'transform 0.15s' }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ position: 'absolute', top: '-40%', right: '-10%', width: '130px', height: '130px', background: 'radial-gradient(circle, rgba(255,215,0,0.14) 0%, transparent 70%)', filter: 'blur(22px)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-40%', left: '-5%', width: '90px', height: '90px', background: 'radial-gradient(circle, rgba(0,196,140,0.1) 0%, transparent 70%)', filter: 'blur(16px)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', width: '48px', height: '48px', background: 'linear-gradient(135deg, #FFD700, #FFA000)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 6px 18px rgba(255,215,0,0.35)', zIndex: 1 }}>
                <Crown size={24} color="#5C3A00" fill="#5C3A00" />
                <div style={{ position: 'absolute', top: '-3px', right: '-3px', width: '11px', height: '11px', background: '#00C48C', borderRadius: '50%', border: '2px solid #1A1A2E', animation: 'pulse 2s infinite' }} />
              </div>
              <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '950', color: '#fff', letterSpacing: '-0.02em', marginBottom: '4px' }}>프리미엄 멤버십</div>
                <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,215,0,0.75)', fontWeight: '700' }}>비밀 포인트 · CCTV · 히트맵 이용</div>
              </div>
              <div style={{ position: 'relative', zIndex: 1, background: 'linear-gradient(135deg, #FFD700, #FFA000)', borderRadius: '30px', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, boxShadow: '0 4px 14px rgba(255,215,0,0.4)' }}>
                <span style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '950', color: '#1A1A2E', whiteSpace: 'nowrap' }}>구독하러 가기</span>
                <span style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#1A1A2E', fontWeight: '900' }}>›</span>
              </div>
            </div>
          )}
        </div>

        {/* 우수 포인트 랭킹 */}
        <div style={{ marginTop: '14px' }}>
          <div style={{ padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '950', color: '#1A1A2E', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
              {filter === '전체' ? '실시간 우수 포인트' : `${EMOJI_MAP[filter] || ''} ${filter} 점수 순위`}
              <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: '#E8F4FF', color: '#1565C0', padding: '2px 7px', borderRadius: '10px', fontWeight: '900' }}>LIVE</span>
            </h3>
            <span onClick={() => setViewMode('map')} style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#1565C0', fontWeight: '800', cursor: 'pointer' }}>지도보기 →</span>
          </div>
          <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', padding: '2px 16px 10px', scrollbarWidth: 'none' }}>
            {PREMIUM_POINTS.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#AAB0BE', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700' }}>
                {filter} 포인트 데이터가 없습니다.<br />
                <span style={{ fontSize: `calc(11px * var(--fs, 1))` }}>전체 보기로 전환하거나 다른 타입을 선택해주세요.</span>
              </div>
            ) : PREMIUM_POINTS.map((point, rank) => {
              const liveScore = point._liveScore ?? 0;
              const scoreColor = liveScore >= 90 ? '#00C48C' : liveScore >= 75 ? '#1565C0' : liveScore >= 50 ? '#FF9B26' : '#FF5A5F';
              const statusLabel = liveScore >= 90 ? '최고' : liveScore >= 75 ? '활발' : liveScore >= 50 ? '보통' : 'POOR';
              return (
                <div key={point.id}
                  onClick={() => handlePremiumPointClick(point)}
                  style={{ minWidth: '140px', background: '#fff', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 3px 10px rgba(0,0,0,0.06)', border: `1px solid ${rank === 0 ? 'rgba(0,196,140,0.35)' : '#F0F2F7'}`, cursor: 'pointer', transition: 'transform 0.15s' }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ width: '100%', height: '90px', background: rank === 0 ? 'linear-gradient(135deg, #E0F7EF, #C8F0E0)' : 'linear-gradient(135deg, #E8F0FE, #D2E3FC)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: `calc(32px * var(--fs, 1))` }}>{EMOJI_MAP[point.type] || '⚓'}</span>
                    {rank === 0 && <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'linear-gradient(135deg,#00C48C,#00897B)', borderRadius: '6px', padding: '2px 7px' }}><span style={{ fontSize: `calc(8px * var(--fs, 1))`, fontWeight: '900', color: '#fff' }}>🏆 1위</span></div>}
                    {rank > 0 && <div style={{ position: 'absolute', top: '6px', left: '6px', background: scoreColor, borderRadius: '6px', padding: '2px 6px' }}><span style={{ fontSize: `calc(8px * var(--fs, 1))`, fontWeight: '900', color: '#fff' }}>{statusLabel}</span></div>}
                    <div style={{ position: 'absolute', top: '6px', right: '6px', background: liveScore >= 75 ? '#FFD700' : 'rgba(0,0,0,0.55)', borderRadius: '6px', padding: '2px 6px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                      <span style={{ fontSize: `calc(9px * var(--fs, 1))`, fontWeight: '900', color: liveScore >= 75 ? '#1A1A2E' : '#fff' }}>{liveScore}점</span>
                    </div>
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', color: '#1A1A2E', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{point.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: `calc(8px * var(--fs, 1))`, background: '#F0F5FF', color: '#1565C0', padding: '1px 5px', borderRadius: '5px', fontWeight: '900', flexShrink: 0 }}>{point.type}</span>
                      <span style={{ fontSize: `calc(9px * var(--fs, 1))`, color: '#AAB0BE', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{point.region} · {(point.fish || '').split(',')[0]}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 조황 보고 */}
        <div style={{ padding: '10px 16px' }}>
          <h3 style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '950', color: '#1A1A2E', marginBottom: '10px' }}>방금 올라온 조황</h3>
          {recentPosts.length > 0 ? recentPosts.map(post => (
            <div
              key={String(post._id || post.id)}
              onClick={() => navigate(`/community?tab=open&postId=${String(post._id || post.id)}`)}
              style={{ background: '#fff', borderRadius: '12px', padding: '10px 12px', marginBottom: '8px', display: 'flex', gap: '10px', alignItems: 'center', border: '1px solid #F0F2F7', cursor: 'pointer', transition: 'all 0.18s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,86,210,0.13)'; e.currentTarget.style.borderColor = '#C8D8F5'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#F0F2F7'; }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #0056D2, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: `calc(18px * var(--fs, 1))` }}>🎣</div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', color: '#1A1A2E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(post.content || '').slice(0, 80)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: `calc(10px * var(--fs, 1))`, color: '#AAB0BE', fontWeight: '700' }}>@{post.author}</span>
                  <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: '#F0F5FF', color: '#0056D2', padding: '1px 6px', borderRadius: '6px', fontWeight: '800' }}>{post.category}</span>
                </div>
              </div>
              <div style={{ color: '#C8D8F5', flexShrink: 0 }}>›</div>
            </div>
          )) : (
            <div style={{ padding: '14px', textAlign: 'center', color: '#AAB0BE', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '700', border: '1px dotted #D0D5E0', borderRadius: '12px' }}>
              오늘의 첫 조황을 공유해보세요! 🎣
            </div>
          )}
        </div>



        {/* 미끼 팁 */}
        <div style={{ padding: '4px 16px 20px' }}>
          <div style={{ backgroundColor: '#1A1A2E', borderRadius: '16px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #FFD700, #FFA000)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `calc(20px * var(--fs, 1))`, flexShrink: 0 }}>
              {baitTip.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: `calc(9px * var(--fs, 1))`, fontWeight: '900', color: '#FFB300', marginBottom: '3px' }}>
                오늘의 미끼 팁 · {selectedPoint?.name?.slice(0, 8) || '현재 포인트'}
              </div>
              <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', color: '#fff', lineHeight: 1.45 }}>
                {baitTip.text}
              </div>
            </div>
          </div>
        </div>

        {/* ✅ ADSENSE: 홈화면 하단 고정 광고 (무료 유저만) */}
        {!canAccessPremium && (
          <div style={{ padding: '0 16px 16px' }}>
            <AdSenseDisplay style={{ borderRadius: '12px', overflow: 'hidden' }} />
          </div>
        )}

        {/* 1:1 고객센터 */}
        <CsInquirySection user={user} isAdmin={isAdmin} />

      </div>
    </div>

    {/* 포인트 확인 보상형 광고 게이트 */}
    <RewardGateModal
      isOpen={showPointAdGate}
      onClose={() => { setShowPointAdGate(false); setPendingPoint(null); }}
      onRewardComplete={handlePointAdComplete}
      onSubscribe={() => { setShowPointAdGate(false); navigate('/vvip-subscribe'); }}
      context={pointAdContext}
    />
    </>
  );
}
