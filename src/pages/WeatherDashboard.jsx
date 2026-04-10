import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CloudRain, Wind, Waves, Droplets, Sunrise, Sunset, Navigation, Map as MapIcon, ChevronDown } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function WeatherDashboard() {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  const [activeRegion, setActiveRegion] = useState('남해');

  const marineData = {
    '동해': { temp: '14.5°C', wave: '1.2m ~ 2.0m', wind: '북동풍 8m/s', status: '주의', tide: '조금', risk: '높음' },
    '서해': { temp: '11.2°C', wave: '0.5m ~ 1.0m', wind: '서풍 4m/s', status: '양호', tide: '9물', risk: '낮음' },
    '남해': { temp: '16.8°C', wave: '0.8m ~ 1.5m', wind: '남서풍 5m/s', status: '좋음', tide: '7물 (사리)', risk: '보통' },
    '제주': { temp: '18.5°C', wave: '1.5m ~ 2.5m', wind: '남풍 10m/s', status: '경고', tide: '8물', risk: '아주 높음' }
  };

  const current = marineData[activeRegion];

  const handleAlert = () => {
    addToast('상세 해류도 및 기상 위성 영상은 유료 플랜에서 제공됩니다.', 'info');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F6FA', paddingBottom: '90px', fontFamily: 'Pretendard, sans-serif' }}>
      {/* 글로벌 헤더 대체용 커스텀 헤더 */}
      <div style={{ background: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F0F0F5', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} color="#1A1A2E" />
          <span style={{ fontSize: '18px', fontWeight: '900', color: '#1A1A2E' }}>전국 해양 기상</span>
        </div>
      </div>

      <div style={{ padding: '20px 20px' }}>
        {/* 지역 선택 탭 */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {Object.keys(marineData).map(region => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              style={{
                padding: '10px 24px', borderRadius: '30px', border: 'none', cursor: 'pointer',
                fontSize: '15px', fontWeight: '800', flexShrink: 0,
                background: activeRegion === region ? '#1565C0' : '#fff',
                color: activeRegion === region ? '#fff' : '#555',
                boxShadow: activeRegion === region ? '0 4px 15px rgba(21,101,192,0.3)' : '0 2px 10px rgba(0,0,0,0.05)',
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
              <div style={{ fontSize: '28px', fontWeight: '950', letterSpacing: '-0.03em' }}>{activeRegion} <span style={{ color: '#42A5F5' }}>종합 스코어</span></div>
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
              <LineChart data={[
                { time: '02:00', level: 54, type: '저' },
                { time: '08:30', level: 412, type: '고' },
                { time: '14:40', level: 72, type: '저' },
                { time: '21:10', level: 390, type: '고' }
              ]} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
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
  );
}
