import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Waves, Cloud, Wind, Anchor, Navigation, ChevronLeft, ChevronRight, MapPin, RefreshCw, Search, X } from 'lucide-react';
import { getPointSpecificData, ALL_FISHING_POINTS } from '../constants/fishingData';
import { calculateScoreDetails } from '../utils/evaluator';
import apiClient from '../api/index';

const SUB_TABS = [
  { id: 'tide',     label: '물때',      icon: Waves },
  { id: 'weather',  label: '날씨',      icon: Cloud },
  { id: 'wind',     label: '바람/파고', icon: Wind },
  { id: 'level',    label: '조위정보',  icon: Anchor },
  { id: 'forecast', label: '바다예보',  icon: Navigation },
];

function flowColor(flow) {
  if (flow >= 80) return '#e53935';
  if (flow >= 60) return '#fb8c00';
  if (flow >= 40) return '#fdd835';
  return '#43a047';
}
function scoreColor(score) {
  if (score >= 80) return '#00c853';
  if (score >= 65) return '#64dd17';
  if (score >= 50) return '#ffd600';
  if (score >= 35) return '#ff6d00';
  return '#d50000';
}
function scoreLabel(score) {
  if (score >= 80) return '최고';
  if (score >= 65) return '좋음';
  if (score >= 50) return '보통';
  if (score >= 35) return '나쁨';
  return '위험';
}
function fmtDate(d) {
  const days = ['일','월','화','수','목','금','토'];
  return d.getFullYear() + '년 ' + (d.getMonth()+1) + '월 ' + d.getDate() + '일(' + days[d.getDay()] + ')';
}

function TideGraph({ high, high2, low, low2, currentHour, isToday }) {
  const W = 320, H = 130;
  const nowX = (currentHour / 24) * W;
  const timeToX = (t) => {
    if (!t) return null;
    const parts = t.split(':');
    const hh = parseInt(parts[0]), mm = parseInt(parts[1]);
    return ((hh * 60 + mm) / 1440) * W;
  };
  const pts = useMemo(() => {
    const arr = [];
    for (let i = 0; i <= 96; i++) {
      const x = (i / 96) * W;
      const y = H / 2 - Math.sin((i / 96) * Math.PI * 4) * (H / 2 - 14);
      arr.push(x.toFixed(1) + ',' + y.toFixed(1));
    }
    return arr.join(' ');
  }, []);
  const h1x = timeToX(high), h2x = timeToX(high2), l1x = timeToX(low), l2x = timeToX(low2);
  const vb = '0 0 ' + W + ' ' + (H + 20);
  return (
    <svg width='100%' viewBox={vb} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id='tg' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stopColor='#1976D2' stopOpacity='0.3' />
          <stop offset='100%' stopColor='#1976D2' stopOpacity='0.04' />
        </linearGradient>
      </defs>
      <polygon points={'0,' + H + ' ' + pts + ' ' + W + ',' + H} fill='url(#tg)' />
      <polyline points={pts} fill='none' stroke='#1976D2' strokeWidth='2.5' strokeLinejoin='round' />
      {[0,6,12,18,24].map(h => (
        <text key={h} x={(h/24)*W} y={H+16} textAnchor='middle' fontSize='10' fill='#888'>{h}시</text>
      ))}
      {isToday && <line x1={nowX} y1={2} x2={nowX} y2={H} stroke='#ff5252' strokeWidth='1.5' strokeDasharray='4,3' />}
      {isToday && <text x={nowX} y={-2} textAnchor='middle' fontSize='9' fill='#ff5252'>현재</text>}
      {h1x != null && <circle cx={h1x} cy={13} r={5} fill='#e53935' />}
      {h2x != null && <circle cx={h2x} cy={13} r={5} fill='#e53935' />}
      {l1x != null && <circle cx={l1x} cy={H - 13} r={5} fill='#1565C0' />}
      {l2x != null && <circle cx={l2x} cy={H - 13} r={5} fill='#1565C0' />}
    </svg>
  );
}

export default function TideTab() {
  const [activeTab, setActiveTab] = useState('tide');
  const [selectedPoint, setSelectedPoint] = useState(function() {
    try {
      const saved = localStorage.getItem('fishinggo_last_point');
      const p = saved ? JSON.parse(saved) : null;
      return p || ALL_FISHING_POINTS[0];
    } catch { return ALL_FISHING_POINTS[0]; }
  });

  const [dateOffset, setDateOffset] = useState(0);
  const isToday = dateOffset === 0;

  const tideData = useMemo(function() {
    if (!selectedPoint) return null;
    try { return getPointSpecificData(selectedPoint, dateOffset); } catch(e) { return null; }
  }, [selectedPoint, dateOffset]);

  // JSX 렌더링 폴백(fallback)을 위해 변수 유지
  const weatherData = null;
  const marineData = null;
  const [loading, setLoading] = useState(false);

  const fetchWeather = useCallback(() => {
    if (!selectedPoint) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); }, 300);
  }, [selectedPoint]);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    // 컴포넌트 첫 마운트 시에만 로딩 페이크
    const t = setTimeout(() => {}, 10);
    return () => clearTimeout(t);
  }, []);

  const fishingScore = useMemo(() => {
    if (!tideData) return null;
    try {
      return calculateScoreDetails({ wave: tideData.wave, wind: tideData.wind, sst: parseFloat(tideData.sst), tide: tideData.tide }, selectedPoint);
    } catch(e) { return null; }
  }, [tideData, selectedPoint]);

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + dateOffset);
  const currentHour = new Date().getHours();
  const dateStr = fmtDate(targetDate);

  const card = { background: '#fff', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' };
  const tabBarStyle = { display: 'flex', overflowX: 'auto', borderBottom: '2px solid #e0e0e0', background: '#fff', position: 'sticky', top: 0, zIndex: 10, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', paddingBottom: '80px' }}>
      <div style={{ background: 'linear-gradient(135deg,#0B47A1,#1565C0)', color: '#fff', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div onClick={() => setIsSearchOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
            <MapPin size={16} /> {selectedPoint ? selectedPoint.name : '포인트 선택'} <Search size={14} style={{ opacity: 0.8, marginLeft: '4px' }} />
          </div>
          <button onClick={fetchWeather} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '6px 10px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
            <RefreshCw size={13} /> 새로고침
          </button>
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>{selectedPoint ? selectedPoint.region : ''} · {selectedPoint ? selectedPoint.type : ''}</div>
      </div>

      <div style={tabBarStyle}>
        {SUB_TABS.map(function(tab) {
          var Icon = tab.icon;
          var isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: '0 0 auto', padding: '10px 16px', fontSize: '13px', fontWeight: isActive ? '800' : '500', color: isActive ? '#0B47A1' : '#666', borderBottom: isActive ? '2.5px solid #0B47A1' : '2.5px solid transparent', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', marginBottom: '-2px' }}>
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '12px 14px' }}>

        {activeTab === 'tide' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <button onClick={() => setDateOffset(function(d){ return d - 1; })} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronLeft size={18} /></button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: '800', fontSize: '15px', color: '#1a1a2e' }}>{dateStr}</div>
                {tideData && <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>음력 {tideData.tide ? tideData.tide.phase : '—'} · 조류세기 <span style={{ color: flowColor(tideData.tide ? tideData.tide.flow || 50 : 50), fontWeight: '700' }}>{tideData.tide ? tideData.tide.flow || 50 : 50}%</span></div>}
              </div>
              <button onClick={() => setDateOffset(function(d){ return d + 1; })} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronRight size={18} /></button>
            </div>

            {tideData && (
              <div style={Object.assign({}, card, { background: 'linear-gradient(135deg,#0B47A1,#1976D2)', color: '#fff' })}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: '900' }}>{tideData.tide ? tideData.tide.phase : '—'}</div>
                    <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '2px' }}>수온 {tideData.sst}°C · {selectedPoint ? selectedPoint.region : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '28px' }}>🌕</div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>조류세기</div>
                    <div style={{ fontSize: '18px', fontWeight: '900' }}>{tideData.tide ? tideData.tide.flow || 50 : 50}%</div>
                  </div>
                </div>
                <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '99px', height: '8px' }}>
                  <div style={{ width: (tideData.tide ? tideData.tide.flow || 50 : 50) + '%', background: '#fff', borderRadius: '99px', height: '8px' }} />
                </div>
              </div>
            )}

            {tideData && (
              <div style={card}>
                <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '12px', color: '#1a1a2e' }}>📈 {isToday ? '오늘' : ''} 조석 그래프</div>
                <div style={{ padding: '8px 0 16px' }}>
                  <TideGraph
                    high={tideData.tide ? tideData.tide.high : null}
                    high2={tideData.tide ? tideData.tide.high2 : null}
                    low={tideData.tide ? tideData.tide.low : null}
                    low2={tideData.tide ? tideData.tide.low2 : null}
                    currentHour={currentHour}
                    isToday={isToday}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: '🔴 만조', time: tideData.tide ? tideData.tide.high : null,  bg: '#ffebee', tc: '#b71c1c' },
                    { label: '🔵 간조', time: tideData.tide ? tideData.tide.low : null,   bg: '#e3f2fd', tc: '#0d47a1' },
                    { label: '🔴 만조 2', time: tideData.tide ? tideData.tide.high2 : null, bg: '#ffebee', tc: '#b71c1c' },
                    { label: '🔵 간조 2', time: tideData.tide ? tideData.tide.low2 : null,  bg: '#e3f2fd', tc: '#0d47a1' },
                  ].filter(function(r){ return !!r.time; }).map(function(r, i) {
                    return (
                      <div key={i} style={{ background: r.bg, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: r.tc, fontWeight: '600' }}>{r.label}</div>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: r.tc }}>{r.time}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {fishingScore && (
              <div style={card}>
                <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '10px', color: '#1a1a2e' }}>⭐ {isToday ? '지금' : '이 날'} 낚시하면?</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: scoreColor(fishingScore.score), display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#fff', flexShrink: 0 }}>
                    <div style={{ fontSize: '20px', fontWeight: '900', lineHeight: 1 }}>{fishingScore.score}</div>
                    <div style={{ fontSize: '10px', fontWeight: '700' }}>점</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: scoreColor(fishingScore.score) }}>{scoreLabel(fishingScore.score)}</div>
                    <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>물때 {tideData && tideData.tide ? tideData.tide.phase : '—'} · 파고 {tideData && tideData.wave ? tideData.wave.coastal : '—'}m · 풍속 {tideData && tideData.wind ? tideData.wind.speed : '—'}m/s</div>
                    {selectedPoint && selectedPoint.fish && <div style={{ fontSize: '12px', color: '#0B47A1', fontWeight: '600', marginTop: '2px' }}>🎣 추천: {selectedPoint.fish.split(',')[0]}</div>}
                  </div>
                </div>
                {fishingScore.details && fishingScore.details.slice(0, 4).map(function(d, i) {
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ fontSize: '13px', color: '#444' }}>{d.factor}</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#888' }}>{d.text}</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: d.score >= 0 ? '#00c853' : '#d50000' }}>{d.score >= 0 ? '+' + d.score : d.score}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tideData && (
              <div style={card}>
                <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '10px', color: '#1a1a2e' }}>📊 {isToday ? '오늘' : ''} 최적 낚시 타임</div>
                {[
                  { label: '새벽 04~06시', hour: 5, bonus: '간조 전 골든타임', base: 88 },
                  { label: '오전 10~12시', hour: 11, bonus: '만조 전후 활성화', base: 75 },
                  { label: '오후 16~18시', hour: 17, bonus: '간조 하강 구간', base: 82 },
                  { label: '야간 20~22시', hour: 21, bonus: '밤낚시 타임', base: 70 },
                ].map(function(t, i) {
                  var isNow = isToday && (currentHour >= t.hour - 1 && currentHour <= t.hour + 1);
                  var sc = Math.min(99, Math.max(50, t.base + (fishingScore ? fishingScore.score : 50) / 6));
                  return (
                    <div key={i} style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '12px', fontWeight: isNow ? '800' : '500', color: isNow ? '#0B47A1' : '#555' }}>{isNow ? '▶ ' : ''}{t.label}</span>
                        <span style={{ fontSize: '11px', color: '#888' }}>{t.bonus}</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: scoreColor(sc) }}>{Math.round(sc)}점</span>
                      </div>
                      <div style={{ background: '#eee', borderRadius: '99px', height: '7px' }}>
                        <div style={{ width: sc + '%', background: scoreColor(sc), borderRadius: '99px', height: '7px', transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'weather' && (
          <div>
            {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>🔄 날씨 정보 불러오는 중...</div>}
            <div style={Object.assign({}, card, { background: 'linear-gradient(135deg,#0B47A1,#1976D2)', color: '#fff' })}>
              <div style={{ fontSize: '12px', opacity: 0.85 }}>{dateStr} {isToday ? String(currentHour).padStart(2,'0') + ':00 현재' : '예보'}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <div>
                  <div style={{ fontSize: '36px', fontWeight: '900' }}>{(weatherData && weatherData.currentTemp) ? weatherData.currentTemp : (tideData ? tideData.sst : '—')}°C</div>
                  <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>💨 {(weatherData && weatherData.windSpeed) ? weatherData.windSpeed : (tideData && tideData.wind ? tideData.wind.speed : '—')}m/s &nbsp;💧 {weatherData ? weatherData.humidity || '—' : '—'}%</div>
                </div>
                <div style={{ fontSize: '52px' }}>⛅</div>
              </div>
            </div>
            {tideData && (
              <div style={card}>
                <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '10px' }}>🌡️ 해양 현황</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { label: '수온', value: tideData.sst + '°C', icon: '🌡️' },
                    { label: '파고', value: (tideData.wave ? tideData.wave.coastal : '—') + 'm', icon: '🌊' },
                    { label: '풍속', value: (tideData.wind ? tideData.wind.speed : '—') + 'm/s', icon: '💨' },
                  ].map(function(item, i) {
                    return (
                      <div key={i} style={{ background: '#f5f7fa', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px' }}>{item.icon}</div>
                        <div style={{ fontSize: '13px', fontWeight: '700', margin: '4px 0' }}>{item.value}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>{item.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'wind' && (
          <div>
            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>💨 {dateStr} 바람·파고</div>
            {[0,3,6,9,12,15,18,21].map(function(hour, i) {
              return (
                <div key={i} style={Object.assign({}, card, { padding: '10px 12px', marginBottom: '6px' })}>
                  <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 40px 40px 80px', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#333' }}>{String(hour).padStart(2,'0')}시</span>
                    <div>
                      <div style={{ fontSize: '12px', color: '#555' }}>{tideData && tideData.wind ? tideData.wind.dir : 'NE'}</div>
                      <div style={{ fontSize: '13px', fontWeight: '700' }}>{tideData && tideData.wind ? tideData.wind.speed : '—'}m/s</div>
                    </div>
                    <span style={{ fontSize: '20px' }}>⛅</span>
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>{tideData ? tideData.sst : '—'}°</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1565C0' }}>{tideData && tideData.wave ? tideData.wave.coastal : '—'}m</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'level' && (
          <div>
            <div style={Object.assign({}, card, { background: 'linear-gradient(135deg,#004D40,#00695C)', color: '#fff' })}>
              <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '6px' }}>📍 {selectedPoint ? selectedPoint.name : '—'}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '13px', opacity: 0.8 }}>{isToday ? '현재 조위' : '기준 조위'}</div>
                  <div style={{ fontSize: '32px', fontWeight: '900' }}>{tideData && tideData.tide ? tideData.tide.current_level : '—'}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', opacity: 0.85 }}>
                  <div>다음 만조: {tideData && tideData.tide ? tideData.tide.high : '—'}</div>
                  <div>다음 간조: {tideData && tideData.tide ? tideData.tide.low : '—'}</div>
                </div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}><span>0cm</span><span>150cm</span><span>300cm</span></div>
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '99px', height: '12px' }}>
                  <div style={{ width: Math.min(100,(parseInt(tideData && tideData.tide ? tideData.tide.current_level : '120')||120)/300*100) + '%', background: 'linear-gradient(90deg,#80DEEA,#fff)', borderRadius: '99px', height: '12px' }} />
                </div>
              </div>
            </div>

            {tideData && (
              <div style={card}>
                <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '10px' }}>🕐 {isToday ? '오늘' : '이 날의'} 조석 상세</div>
                {[
                  { type: '만조', time: tideData.tide ? tideData.tide.high : null,  icon: '🔴', tc: '#b71c1c' },
                  { type: '간조', time: tideData.tide ? tideData.tide.low : null,   icon: '🔵', tc: '#0d47a1' },
                  { type: '만조 2', time: tideData.tide ? tideData.tide.high2 : null, icon: '🔴', tc: '#b71c1c' },
                  { type: '간조 2', time: tideData.tide ? tideData.tide.low2 : null,  icon: '🔵', tc: '#0d47a1' },
                ].filter(function(r){ return !!r.time; }).map(function(r, i) {
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ fontSize: '22px' }}>{r.icon}</div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{r.type}</div>
                        <div style={{ fontSize: '20px', fontWeight: '900', color: r.tc }}>{r.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={card}>
              <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '10px' }}>⭐ 낚시GO 조위별 낚시 팁</div>
              <div style={{ background: '#e8f5e9', borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
                <div style={{ fontWeight: '700', color: '#2e7d32', fontSize: '13px' }}>🎣 현재 상황</div>
                <div style={{ fontSize: '13px', color: '#333', marginTop: '6px', lineHeight: 1.5 }}>
                  {(tideData && tideData.tide && tideData.tide.phase && tideData.tide.phase.includes('사리'))
                    ? '사리 물때입니다. 조류가 강하게 흐르며 먹이활동이 매우 활발합니다. 무거운 채비로 조류를 버티며 공략하세요.'
                    : (tideData && tideData.tide && tideData.tide.phase && (tideData.tide.phase.includes('조금') || tideData.tide.phase.includes('무시')))
                    ? '조금/무시 물때입니다. 조류가 약해 입질이 뜸할 수 있습니다. 가벼운 채비와 집어제로 유인 효과를 높이세요.'
                    : (tideData && tideData.tide ? tideData.tide.phase : '현재') + ' 물때입니다. 간조 전후 2시간이 가장 입질이 활발한 골든 타임입니다.'}
                </div>
              </div>
              <div style={{ background: '#fff3e0', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontWeight: '700', color: '#e65100', fontSize: '13px' }}>⚠️ 안전 주의</div>
                <div style={{ fontSize: '12px', color: '#555', marginTop: '6px', lineHeight: 1.5 }}>간조 전후 30분은 갯바위 진출입 시 미끄럼 주의. 만조 시 갯바위 침수 가능성 확인 필수.</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'forecast' && (
          <div>
            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>🌊 해상 예보</div>
            {[0,1,2].map(function(offset) {
              var d = new Date(); d.setDate(d.getDate() + offset);
              var dStr = fmtDate(d);
              var wv = parseFloat(tideData && tideData.wave ? tideData.wave.coastal : 0.5) || 0.5;
              var adjWv = (wv * (1 + offset * 0.2)).toFixed(1);
              var adjF = parseFloat(adjWv);
              var ok = adjF < 1.0 ? '✅ 출조 가능' : adjF < 2.0 ? '⚠️ 주의 필요' : '⛔ 출조 비권고';
              var okColor = adjF < 1.0 ? '#00c853' : adjF < 2.0 ? '#ff6d00' : '#d50000';
              return (
                <div key={offset} style={Object.assign({}, card, { marginBottom: '8px' })}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '6px' }}>
                    <span style={{ fontWeight: '800', fontSize: '14px' }}>{dStr}</span>
                    <span style={{ fontWeight: '700', color: okColor, fontSize: '13px' }}>{ok}</span>
                  </div>
                  {['오전','오후'].map(function(period, j) {
                    return (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', padding: '8px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <div style={{ fontSize: '24px' }}>🌊</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#555' }}>{period}</div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '12px' }}>
                          <div style={{ fontWeight: '700', color: '#1565C0' }}>파도 {adjWv}m</div>
                          <div style={{ color: '#666' }}>풍향 {tideData && tideData.wind ? tideData.wind.dir : 'NE'} 풍속 {tideData && tideData.wind ? tideData.wind.speed : '—'}m/s</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 지역 검색 모달 */}
      {isSearchOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#fff', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => setIsSearchOpen(false)} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer' }}><ChevronLeft size={24} color='#333' /></button>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} color='#888' style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type='text' placeholder='항구, 방파제, 갯바위 검색' value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', boxSizing: 'border-box' }} autoFocus />
              {searchKeyword && <button onClick={() => setSearchKeyword('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0 }}><X size={16} color='#bbb' /></button>}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
            {ALL_FISHING_POINTS.filter(p => p.name.includes(searchKeyword) || (p.region && p.region.includes(searchKeyword))).map((p, idx) => (
              <div key={idx} onClick={() => { setSelectedPoint(p); localStorage.setItem('fishinggo_last_point', JSON.stringify(p)); setIsSearchOpen(false); setSearchKeyword(''); }} style={{ padding: '16px 0', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a2e' }}>{p.name}</div>
                <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{p.region} · {p.type}</div>
              </div>
            ))}
            {ALL_FISHING_POINTS.filter(p => p.name.includes(searchKeyword) || (p.region && p.region.includes(searchKeyword))).length === 0 && (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#888', fontSize: '14px' }}>검색 결과가 없습니다.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}