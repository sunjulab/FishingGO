import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Wind, Waves, Droplets, Sunrise, Sunset, Navigation, Map as MapIcon, ChevronDown, Search, X, AlertCircle, Loader2 } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';
// ✅ 19TH-A1: recharts 제거(12TH-B1) — 순수 SVG TideChart로 교체하여 빌드 오류 해소
import { ALL_FISHING_POINTS, getPointSpecificData } from '../constants/fishingData';
import { evaluateFishingCondition } from '../utils/evaluator';
import apiClient from '../api/index';

const EMOJI_MAP = { '방파제': '⚓', '갯바위': '🪨', '선착장': '🚢', '항구': '🏖️' };

// 권역별 대표 관측소 ID (기존 서버 weatherCache 키와 매칭)
const REGION_STATION = {
  '동해': 'DT_0033',
  '서해': 'DT_0009',
  '남해': 'DT_0004',
  '제주': 'DT_0010',
};

// API 응답 → 표시용 객체 변환
function buildMarineDisplay(data) {
  if (!data) return null;
  const sst    = data.sst ?? data.layers?.upper;
  const wave   = data.wave?.coastal ?? data.wave;
  const speed  = data.wind?.speed ?? data.wind;
  const dir    = data.wind?.dir ?? '';
  const phase  = data.tide?.phase ?? data.tide;
  const score  = data.fishingScore ?? data.fishingIndex ?? 60;

  let status = '보통';
  if (score >= 80)      status = '최고';
  else if (score >= 65) status = '활발';
  else if (score >= 50) status = '보통';
  else if (score >= 35) status = '주의';
  else                  status = '경고';

  return {
    temp:  sst   != null ? `${sst}°C`                     : '-',
    wave:  wave  != null ? `${wave}m`                     : '-',
    wind:  speed != null ? `${dir ? dir + ' ' : ''}${speed}m/s` : '-',
    tide:  phase ?? '-',
    status,
    risk:  score < 40 ? '높음' : score < 55 ? '보통' : '낮음',
    tideHigh:       data.tide?.high,
    tideLow:        data.tide?.low,
    tidePredictions: data.tide_predictions,
    sunrise:        data.sunrise,
    sunset:         data.sunset,
  };
}

// getPointSpecificData 기반 로컬 fallback
function buildLocalFallback(point) {
  const pData = getPointSpecificData(point);
  const cond  = evaluateFishingCondition(pData, point);
  return {
    temp:  pData.sst           ? `${pData.sst}°C`           : '-',
    wave:  pData.wave?.coastal ? `${pData.wave.coastal}m`   : '-',
    wind:  pData.wind?.speed   ? `${pData.wind.speed}m/s`  : '-',
    tide:  pData.tide?.phase   ?? '-',
    status: cond.status,
    risk:  cond.score < 50 ? '주의' : '낮음',
    tideHigh: pData.tide?.high,
    tideLow:  pData.tide?.low,
  };
}

// NEW-B7: API 실패 시 fallback — REGIONAL_PROFILES 기반 지역별 기본 기상 특성 반영
const MARINE_FALLBACK = {
  '동해': { temp: '13.5°C', wave: '0.8m', wind: '4.5m/s', tide: '-', status: '보통', risk: '보통' },
  '서해': { temp: '12.2°C', wave: '1.1m', wind: '6.8m/s', tide: '-', status: '주의', risk: '높음' },
  '남해': { temp: '16.8°C', wave: '0.5m', wind: '3.2m/s', tide: '-', status: '활발', risk: '낮음' },
  '제주': { temp: '18.5°C', wave: '0.6m', wind: '3.5m/s', tide: '-', status: '보통', risk: '낮음' },
};

// ✅ 4TH-B1: calcSunrise 컴포넌트 외부 추출 — 순수함수, useMemo로 마운트 1회만 계산
// ✅ WARN-2: 일출/일몰 실제 날짜 기반 계산 (하드코딩 fallback 제거)
function calcSunrise() {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  // 위도 36° 기준 간략 계산식 (오차 ±15분)
  const baseRise = 6.0 + (1.2 * Math.sin((dayOfYear - 80) * Math.PI / 182.5));
  const baseSet  = 18.0 - (1.2 * Math.sin((dayOfYear - 80) * Math.PI / 182.5));
  const rH = Math.floor(baseRise);
  const rM = Math.round((baseRise - rH) * 60).toString().padStart(2, '0');
  const sH = Math.floor(baseSet);
  const sM = Math.round((baseSet  - sH) * 60).toString().padStart(2, '0');
  return { sunrise: `${rH}:${rM}`, sunset: `${sH}:${sM}` };
}

// ✅ 19TH-A1: recharts 의존성 없는 순수 SVG 조석 차트 컴포넌트
function TideChart({ data }) {
  if (!data || data.length < 2) return null;
  const W = 300, H = 120;
  const pad = { top: 18, right: 10, bottom: 22, left: 10 };
  const levels = data.map(d => d.level);
  const minL = Math.min(...levels) - 50;
  const maxL = Math.max(...levels) + 50;
  const range = maxL - minL || 1;
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;
  const xOf = (i) => pad.left + (i / (data.length - 1)) * cW;
  const yOf = (l) => pad.top + (1 - (l - minL) / range) * cH;
  const pts = data.map((d, i) => `${xOf(i).toFixed(1)},${yOf(d.level).toFixed(1)}`).join(' ');
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="tideGrad-wd" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1565C0" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#1565C0" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <polygon
        points={`${pts} ${xOf(data.length-1).toFixed(1)},${H} ${xOf(0).toFixed(1)},${H}`}
        fill="url(#tideGrad-wd)"
      />
      <polyline points={pts} fill="none" stroke="#1565C0" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={d.time}>
          <circle cx={xOf(i)} cy={yOf(d.level)} r="4" fill="#1565C0" stroke="#fff" strokeWidth="2" />
          <text x={xOf(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="#888" fontWeight="700">{d.time}</text>
        </g>
      ))}
    </svg>
  );
}

export default function WeatherDashboard() {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);

  const [activeRegion, setActiveRegion]     = useState('남해');
  const [searchQuery, setSearchQuery]       = useState('');
  const [searchResults, setSearchResults]   = useState([]);
  const [showSearch, setShowSearch]         = useState(false);
  const [selectedPoint, setSelectedPoint]   = useState(null);
  const [liveData, setLiveData]             = useState(null);
  const [apiLoading, setApiLoading]         = useState(false);
  const [lastUpdated, setLastUpdated]       = useState(null);
  // ENH6-B5: fallback 사용 여부 상태 — 사용자에게 데이터 출처 안내
  const [usingFallback, setUsingFallback]   = useState(false);

  const searchRef = useRef(null);
  const searchTimerRef = useRef(null); // ✅ 4TH-B2: 검색 디바운스 타이머 ref

  // ✅ 30TH-C2: searchTimerRef 언마운트 cleanup — 검색 중 페이지 이탈 시 setSearchResults setState-on-unmounted 방지
  useEffect(() => () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); }, []);

  // 외부 클릭 시 검색 드롭다운 닫기
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // 관측소 ID로 실시간 날씨 데이터 요청
  const fetchMarineData = useCallback(async (stationId) => {
    if (!stationId) return;
    setApiLoading(true);
    try {
      const res = await apiClient.get(`/api/weather/precision?stationId=${stationId}`);
      setLiveData(res.data);
      setLastUpdated(new Date());
      setUsingFallback(false);
    } catch (err) {
      // ENH6-A5: 프로덕션 console.warn 노출 방지
      if (!import.meta.env.PROD) console.warn('[WeatherDashboard] API 실패, fallback 사용:', err.message);
      setLiveData(null);
      setUsingFallback(true);
    } finally {
      setApiLoading(false);
    }
  }, []);

  // ENH6-C3: 두 useEffect 통합 — selectedPoint/activeRegion 변경을 한 곳에서 분기
  useEffect(() => {
    if (selectedPoint) {
      const sid = selectedPoint.obsCode
        || REGION_STATION[selectedPoint.region?.replace(/권$/, '')]
        || 'DT_0004';
      fetchMarineData(sid);
    } else {
      fetchMarineData(REGION_STATION[activeRegion]);
    }
  }, [selectedPoint, activeRegion, fetchMarineData]);

  // ✅ 4TH-B2: debounce — 250ms 대기 후 필터링 실행 (60+ 배열 매 타이핑마다 순회 방지)
  const handleSearch = (q) => {
    setSearchQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!q.trim()) { setSearchResults([]); setShowSearch(false); return; }
    searchTimerRef.current = setTimeout(() => {
      const low = q.toLowerCase();
      const filtered = ALL_FISHING_POINTS.filter(p =>
        p.name.toLowerCase().includes(low) ||
        p.fish.toLowerCase().includes(low) ||
        p.type.toLowerCase().includes(low) ||
        (p.region && p.region.toLowerCase().includes(low))
      );
      setSearchResults(filtered);
      setShowSearch(true);
    }, 250);
  };

  const handleSelect = (p) => {
    setSelectedPoint(p);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setActiveRegion('');
  };

  // ✅ 4TH-B3: 표시 데이터 가변 let 선언 → useMemo — 매 렌더 시 불필요한 재연산 제거
  const { current, currentTitle, tideChartData } = useMemo(() => {
    let _title, _cur, _chart = [];
    if (selectedPoint) {
      _title = selectedPoint.name;
      _cur = (liveData && !apiLoading)
        ? (buildMarineDisplay(liveData) || buildLocalFallback(selectedPoint))
        : buildLocalFallback(selectedPoint);
    } else {
      _title = `${activeRegion} 앞바다`;
      _cur = (liveData && !apiLoading)
        ? (buildMarineDisplay(liveData) || MARINE_FALLBACK[activeRegion])
        : MARINE_FALLBACK[activeRegion] || MARINE_FALLBACK['남해'];
    }
    // 조석 차트: API tide_predictions 우선 → tide high/low → 기본 패턴
    if (liveData?.tide_predictions?.length) {
      _chart = liveData.tide_predictions.map(t => ({ time: t.time, level: t.level, type: t.type }));
    } else if (_cur?.tideHigh || _cur?.tideLow) {
      _chart = [
        { time: '00:00', level: 250, type: '-' },
        { time: _cur.tideLow  || '05:30', level: 80,  type: '저' },
        { time: _cur.tideHigh || '11:45', level: 410, type: '고' },
        { time: '18:00', level: 120, type: '저' },
        { time: '23:50', level: 380, type: '고' },
      ];
    } else {
      _chart = [
        { time: '02:00', level: 54,  type: '저' },
        { time: '08:30', level: 412, type: '고' },
        { time: '14:40', level: 72,  type: '저' },
        { time: '21:10', level: 390, type: '고' },
      ];
    }
    return { current: _cur, currentTitle: _title, tideChartData: _chart };
  }, [selectedPoint, liveData, apiLoading, activeRegion]);

  // ✅ 4TH-B1: useMemo — 당일 일출/일몰은 세션 중 불변, 마운트 1회만 계산
  const localSun = useMemo(() => calcSunrise(), []);

  const statusIsWarn = current?.status === '주의' || current?.status === '경고';

  return (
    <div style={{ backgroundColor: '#F4F6FA', height: '100vh', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '480px', backgroundColor: '#F4F6FA', height: '100%', position: 'relative', overflowY: 'auto', paddingBottom: '30px', fontFamily: 'Pretendard, sans-serif', boxShadow: '0 0 40px rgba(0,0,0,0.05)' }}>

        {/* 헤더 */}
        <div style={{ background: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F0F0F5', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate(-1)}>
            <ChevronLeft size={24} color="#1A1A2E" />
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#1A1A2E' }}>전국 해양 기상</span>
          </div>
          {lastUpdated && (
            <span style={{ fontSize: '10px', color: '#AAB0BE', fontWeight: '700' }}>
              {lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 갱신
            </span>
          )}
        </div>
        {/* ENH6-B5: fallback 데이터 사용 시 안내 배너 */}
        {usingFallback && (
          <div style={{ background: '#FFF8E1', borderBottom: '1px solid #FFE082', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={13} color="#F59E0B" />
            <span style={{ fontSize: '11px', color: '#92400E', fontWeight: '700' }}>실시간 연결 실패 — 기본 해역 특성 데이터를 표시합니다.</span>
          </div>
        )}

        <div style={{ padding: '20px 20px' }}>

          {/* 검색바 */}
          <div style={{ position: 'relative', zIndex: 60, marginBottom: '20px' }} ref={searchRef}>
            <div style={{ height: '48px', backgroundColor: '#fff', borderRadius: '14px', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px', border: '1.5px solid #EBF2FF', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
              <Search size={16} color="#1565C0" strokeWidth={3} />
              <input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowSearch(true)}
                placeholder="포인트, 어종 검색하여 맞춤 날씨 보기"
                style={{ border: 'none', background: 'none', fontSize: '13.5px', fontWeight: '800', outline: 'none', width: '100%', color: '#1A1A2E' }}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearch(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AAB0BE', padding: 0 }}>
                  <X size={16} />
                </button>
              )}
            </div>
            {showSearch && searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', borderRadius: '14px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #F0F2F7', zIndex: 100, maxHeight: '280px', overflowY: 'auto', marginTop: '6px' }}>
                {searchResults.map((p, i) => (
                  <div key={p.id} onClick={() => handleSelect(p)}
                    style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: i < searchResults.length - 1 ? '1px solid #F8F9FC' : 'none', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8F9FC'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: '32px', height: '32px', background: '#EBF2FF', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                      {EMOJI_MAP[p.type] || '⚓'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '950', color: '#1A1A2E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize: '10px', color: '#8E8E93', fontWeight: '800', marginTop: '2px' }}>{p.region} · {p.type} · {p.fish.split(',')[0]}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showSearch && searchResults.length === 0 && searchQuery && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', borderRadius: '14px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #F0F2F7', zIndex: 100, padding: '20px', textAlign: 'center', marginTop: '6px' }}>
                <AlertCircle size={24} color="#AAB0BE" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '13px', color: '#8E8E93', fontWeight: '800' }}>검색 결과가 없어요</div>
              </div>
            )}
          </div>

          {/* 지역 탭 */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {['동해', '서해', '남해', '제주'].map(region => (
              <button key={region}
                onClick={() => { setSelectedPoint(null); setLiveData(null); setActiveRegion(region); }}
                style={{
                  padding: '10px 24px', borderRadius: '30px', border: 'none', cursor: 'pointer',
                  fontSize: '15px', fontWeight: '800', flexShrink: 0,
                  background: (!selectedPoint && activeRegion === region) ? '#1565C0' : '#fff',
                  color:  (!selectedPoint && activeRegion === region) ? '#fff' : '#555',
                  boxShadow: (!selectedPoint && activeRegion === region) ? '0 4px 15px rgba(21,101,192,0.3)' : '0 2px 10px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                }}
              >
                {region} 앞바다
              </button>
            ))}
          </div>

          {/* 메인 해양 기상 카드 */}
          <div style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)', borderRadius: '24px', padding: '24px', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, opacity: 0.1 }}>
              <MapIcon size={180} />
            </div>

            {/* 로딩 오버레이 — ✅ 4TH-A1: 인라인 @keyframes spin 제거 (ENH3-A1과 동일, index.css 전역 사용) */}
            {apiLoading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(22,33,62,0.75)', borderRadius: '24px', zIndex: 20 }}>
                <Loader2 size={32} color="#60a5fa" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', position: 'relative', zIndex: 10 }}>
              <div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: '700', marginBottom: '4px' }}>
                  실시간 기상 측정소 {liveData ? '🟢' : '🔴'}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '950', letterSpacing: '-0.03em' }}>{currentTitle}</div>
              </div>
              <div style={{ background: statusIsWarn ? 'rgba(255,59,48,0.2)' : 'rgba(0,196,140,0.2)', padding: '6px 12px', borderRadius: '20px', border: statusIsWarn ? '1px solid rgba(255,59,48,0.5)' : '1px solid rgba(0,196,140,0.5)' }}>
                <span style={{ fontSize: '13px', fontWeight: '900', color: statusIsWarn ? '#FF6B6B' : '#00C48C' }}>{current?.status ?? '-'}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', position: 'relative', zIndex: 10 }}>
              {[
                { icon: <Waves size={16} />,     label: '유의 파고', value: current?.wave },
                { icon: <Wind size={16} />,      label: '평균 풍속', value: current?.wind },
                { icon: <Droplets size={16} />,  label: '표층 수온', value: current?.temp },
                { icon: <Navigation size={16} />, label: '물때 / 조류', value: current?.tide },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', opacity: 0.8 }}>
                    {icon} <span style={{ fontSize: '12px', fontWeight: '700' }}>{label}</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '900' }}>{value ?? '-'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 조석 그래프 */}
          <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#1A1A2E', marginBottom: '14px', paddingLeft: '4px' }}>실시간 조석 그래프</h3>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginBottom: '24px', border: '1px solid #E5E8EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sunrise size={20} color="#FF9B26" />
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#555' }}>
                  일출 {current?.sunrise || liveData?.sunrise || localSun.sunrise}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sunset size={20} color="#FF5A5F" />
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#555' }}>
                  일몰 {current?.sunset || liveData?.sunset || localSun.sunset}
                </span>
              </div>
            </div>

            <div style={{ height: '160px', width: '100%', marginBottom: '16px' }}>
              <TideChart data={tideChartData} /> {/* ✅ 19TH-A1: recharts → 순수 SVG 조석 차트 */}
            </div>

            <button
              onClick={() => addToast('상세 해류도 및 기상 위성 영상은 유료 플랜에서 제공됩니다.', 'info')}
              style={{ width: '100%', padding: '14px', background: '#F4F6FA', color: '#1565C0', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              상세 위성 레이더망 보기 <ChevronDown size={16} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
