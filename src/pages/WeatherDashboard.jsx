import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CloudRain, Wind, Waves, Droplets, Sunrise, Sunset, Navigation, Map as MapIcon, ChevronDown, Search, X, AlertCircle } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ALL_FISHING_POINTS, getPointSpecificData } from '../constants/fishingData';
import { evaluateFishingCondition } from '../utils/evaluator';

const EMOJI_MAP = { '방파제': '⚓', '갯바위': '🪨', '선착장': '🚢', '항구': '🏖️' };
const STATUS_COLOR = { '최고': '#00C48C', '피딩중': '#FFB300', '활발': '#1565C0', '보통': '#8E8E93', '주의': '#FF9B26', '경고': '#FF3B30' };

export default function WeatherDashboard() {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  
  const [activeRegion, setActiveRegion] = useState('남해');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); setShowSearch(false); return; }
    const low = q.toLowerCase();
    const filtered = ALL_FISHING_POINTS.filter(p =>
      p.name.toLowerCase().includes(low) ||
      p.fish.toLowerCase().includes(low) ||
      p.type.toLowerCase().includes(low) ||
      (p.region && p.region.toLowerCase().includes(low))
    );
    setSearchResults(filtered);
    setShowSearch(true);
  };

  const handleSelect = (p) => {
    setSelectedPoint(p);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setActiveRegion(''); // 지역 탭 비활성화 효과
  };

  const marineData = {
    '동해': { temp: '14.5°C', wave: '1.2m ~ 2.0m', wind: '북동풍 8m/s', status: '주의', tide: '조금', risk: '높음' },
    '서해': { temp: '11.2°C', wave: '0.5m ~ 1.0m', wind: '서풍 4m/s', status: '양호', tide: '9물', risk: '낮음' },
    '남해': { temp: '16.8°C', wave: '0.8m ~ 1.5m', wind: '남서풍 5m/s', status: '좋음', tide: '7물 (사리)', risk: '보통' },
    '제주': { temp: '18.5°C', wave: '1.5m ~ 2.5m', wind: '남풍 10m/s', status: '경고', tide: '8물', risk: '아주 높음' }
  };

  let currentTitle = '';
  let current;
  let tideChartData = [];

  if (selectedPoint) {
    const pData = getPointSpecificData(selectedPoint);
    const cond = evaluateFishingCondition(pData, selectedPoint);
    currentTitle = selectedPoint.name;
    current = {
      temp: `${pData.sst || '14.5'}°C`,
      wave: `${pData.wave?.coastal || '0.5'}m`,
      wind: `${pData.wind?.speed || '3.2'}m/s`,
      status: cond.status,
      tide: pData.tide?.phase || '7물(사리)',
      risk: cond.score < 50 ? '주의' : '낮음'
    };
    
    const lowTime = pData.tide?.low || '05:30';
    const highTime = pData.tide?.high || '11:45';
    
    tideChartData = [
      { time: '00:00', level: 250, type: '-' },
      { time: lowTime, level: 80, type: '저' },
      { time: highTime, level: 410, type: '고' },
      { time: '18:00', level: 120, type: '저' },
      { time: '23:50', level: 380, type: '고' }
    ];
  } else {
    currentTitle = `${activeRegion} 앞바다`;
    current = marineData[activeRegion] || marineData['남해'];
    tideChartData = [
      { time: '02:00', level: 54, type: '저' },
      { time: '08:30', level: 412, type: '고' },
      { time: '14:40', level: 72, type: '저' },
      { time: '21:10', level: 390, type: '고' }
    ];
  }

  const handleAlert = () => {
    addToast('상세 해류도 및 기상 위성 영상은 유료 플랜에서 제공됩니다.', 'info');
  };

  return (
    <div style={{ backgroundColor: '#F4F6FA', height: '100vh', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
      <div style={{ 
        width: '100%', maxWidth: '480px', backgroundColor: '#F4F6FA', height: '100%', 
        position: 'relative', overflowY: 'auto', paddingBottom: '30px', 
        fontFamily: 'Pretendard, sans-serif', boxShadow: '0 0 40px rgba(0,0,0,0.05)' 
      }}>
      {/* 글로벌 헤더 대체용 커스텀 헤더 */}
      <div style={{ background: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F0F0F5', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} color="#1A1A2E" />
          <span style={{ fontSize: '18px', fontWeight: '900', color: '#1A1A2E' }}>전국 해양 기상</span>
        </div>
      </div>

      <div style={{ padding: '20px 20px' }}>
        {/* 검색바 + 드롭다운 */}
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

          {/* 검색 결과 드롭다운 */}
          {showSearch && searchResults.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
              borderRadius: '14px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #F0F2F7',
              zIndex: 100, maxHeight: '280px', overflowY: 'auto', marginTop: '6px'
            }}>
              {searchResults.map((p, i) => (
                <div key={p.id}
                  onClick={() => handleSelect(p)}
                  style={{
                    padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px',
                    borderBottom: i < searchResults.length - 1 ? '1px solid #F8F9FC' : 'none',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
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

        {/* 지역 선택 탭 */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {['동해', '서해', '남해', '제주'].map(region => (
            <button
              key={region}
              onClick={() => {
                setSelectedPoint(null);
                setActiveRegion(region);
              }}
              style={{
                padding: '10px 24px', borderRadius: '30px', border: 'none', cursor: 'pointer',
                fontSize: '15px', fontWeight: '800', flexShrink: 0,
                background: (!selectedPoint && activeRegion === region) ? '#1565C0' : '#fff',
                color: (!selectedPoint && activeRegion === region) ? '#fff' : '#555',
                boxShadow: (!selectedPoint && activeRegion === region) ? '0 4px 15px rgba(21,101,192,0.3)' : '0 2px 10px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease'
              }}
            >
              {region} 앞바다
            </button>
          ))}
        </div>

        {/* 메인 요약 해양 정보 카드 */}
        <div style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)', borderRadius: '24px', padding: '24px', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, opacity: 0.1 }}>
            <MapIcon size={180} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', position: 'relative', zIndex: 10 }}>
            <div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: '700', marginBottom: '4px' }}>실시간 기상 측정소</div>
              <div style={{ fontSize: '24px', fontWeight: '950', letterSpacing: '-0.03em' }}>{currentTitle}</div>
            </div>
            <div style={{ background: current.status === '주의' || current.status === '경고' ? 'rgba(255,59,48,0.2)' : 'rgba(0,196,140,0.2)', padding: '6px 12px', borderRadius: '20px', border: current.status === '주의' || current.status === '경고' ? '1px solid rgba(255,59,48,0.5)' : '1px solid rgba(0,196,140,0.5)' }}>
              <span style={{ fontSize: '13px', fontWeight: '900', color: current.status === '주의' || current.status === '경고' ? '#FF6B6B' : '#00C48C' }}>{current.status}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', position: 'relative', zIndex: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', opacity: 0.8 }}>
                <Waves size={16} /> <span style={{ fontSize: '12px', fontWeight: '700' }}>유의 파고</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900' }}>{current.wave}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', opacity: 0.8 }}>
                <Wind size={16} /> <span style={{ fontSize: '12px', fontWeight: '700' }}>평균 풍속</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900' }}>{current.wind}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', opacity: 0.8 }}>
                <Droplets size={16} /> <span style={{ fontSize: '12px', fontWeight: '700' }}>표층 수온</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900' }}>{current.temp}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', opacity: 0.8 }}>
                <Navigation size={16} /> <span style={{ fontSize: '12px', fontWeight: '700' }}>물때 / 조류</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900' }}>{current.tide}</div>
            </div>
          </div>
        </div>

        {/* 조석/물때 상세 차트 Placeholder */}
        <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#1A1A2E', marginBottom: '14px', paddingLeft: '4px' }}>실시간 조석 그래프</h3>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginBottom: '24px', border: '1px solid #E5E8EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sunrise size={20} color="#FF9B26" />
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#555' }}>일출 06:21</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sunset size={20} color="#FF5A5F" />
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#555' }}>일몰 19:14</span>
             </div>
          </div>
          
          <div style={{ height: '160px', width: '100%', marginBottom: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tideChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                <YAxis hide domain={['dataMin - 50', 'dataMax + 50']} />
                <Tooltip cursor={false} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '800' }} />
                <Line type="monotone" dataKey="level" stroke="#1565C0" strokeWidth={3} dot={{ r: 4, fill: '#1565C0', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} animationDuration={1500} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <button onClick={handleAlert} style={{ width: '100%', padding: '14px', background: '#F4F6FA', color: '#1565C0', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            상세 위성 레이더망 보기 <ChevronDown size={16} />
          </button>
        </div>

      </div>
      </div>
    </div>
  );
}
