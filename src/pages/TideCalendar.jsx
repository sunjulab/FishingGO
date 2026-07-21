import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar as CalIcon, MapPin, Loader2, Info } from 'lucide-react';
import { fetchTideForecast, fetchFishingIndex } from '../api/marineApi';

// 대표 관측소 매핑 (동해, 서해, 남해)
const REGION_STATIONS = {
  east: { id: 'DT_0006', name: '묵호(동해)', label: '동해' },
  west: { id: 'DT_0025', name: '보령(서해)', label: '서해' },
  south: { id: 'DT_0016', name: '여수(남해)', label: '남해' },
};

export default function TideCalendar() {
  const navigate = useNavigate();
  const [region, setRegion] = useState('west');
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const station = REGION_STATIONS[region];
        // 앞으로 7일치 날짜 생성
        const dates = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(Date.now() + 9 * 60 * 60 * 1000); // KST Base
          d.setDate(d.getDate() + i);
          return d;
        });

        const tidePromises = dates.map(d => {
          const dStr = d.toISOString().slice(0, 10).replace(/-/g, '');
          return fetchTideForecast(station.id, dStr).then(res => ({ date: dStr, tides: res })).catch(() => ({ date: dStr, tides: [] }));
        });
        
        // 낚시지수 API
        const fishPromise = fetchFishingIndex(station.id).catch(() => null);

        const [tidesArray, fishRes] = await Promise.all([
          Promise.all(tidePromises),
          fishPromise
        ]);

        if (isMounted) {
          const processed = dates.map(d => {
            const dStr = d.toISOString().slice(0, 10).replace(/-/g, '');
            const tideObj = tidesArray.find(t => t.date === dStr);
            let preds = [];
            if (tideObj && tideObj.tides) {
              preds = tideObj.tides.map(t => {
                const timeStr = t.predcDt ? t.predcDt.split(' ')[1] : (t.hl_time || '');
                const typeStr = (t.extrSe === '1' || t.extrSe === '3' || t.hl_code === 'H') ? '고조' : '간조';
                return { time: timeStr, type: typeStr };
              });
            }
            const highs = preds.filter(p => p.type === '고조').map(p => p.time).sort();
            const lows = preds.filter(p => p.type === '간조').map(p => p.time).sort();

            // 낚시지수 매핑
            let fishingGrade = '보통';
            let fishingIdx = 3;
            if (fishRes && Array.isArray(fishRes)) {
              // fcst_time ex: 2026-07-22 00:00:00 -> find by prefix
              const match = fishRes.find(f => f.fcst_time?.replace(/-/g, '').startsWith(dStr) || String(f.fcst_time) === dStr);
              if (match) {
                fishingGrade = match.fishing_grade || fishingGrade;
                fishingIdx = match.fishing_idx || fishingIdx;
              }
            }

            return {
              dateObj: d,
              dateStr: dStr,
              highs: [highs[0] || '--:--', highs[1] || '--:--'],
              lows: [lows[0] || '--:--', lows[1] || '--:--'],
              fishingGrade,
              fishingIdx
            };
          });
          setCalendarData(processed);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadData();
    return () => { isMounted = false; };
  }, [region]);

  const getGradeColor = (idx) => {
    switch(String(idx)) {
      case '1': return { bg: '#E3F2FD', text: '#1565C0', icon: '🔵', label: '매우좋음' };
      case '2': return { bg: '#E0F7FA', text: '#00838F', icon: '🟢', label: '좋음' };
      case '3': return { bg: '#FFF8E1', text: '#F57F17', icon: '🟡', label: '보통' };
      case '4': return { bg: '#FBE9E7', text: '#D84315', icon: '🟠', label: '나쁨' };
      case '5': return { bg: '#FFEBEE', text: '#C62828', icon: '🔴', label: '매우나쁨' };
      default:  return { bg: '#FFF8E1', text: '#F57F17', icon: '🟡', label: '보통' };
    }
  };

  return (
    <div style={{ paddingBottom: '30px', minHeight: '100vh', background: '#F8F9FC' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#fff', borderBottom: '1px solid #F0F2F7', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div onClick={() => navigate(-1)} style={{ cursor: 'pointer', padding: '4px', marginLeft: '-4px' }}>
            <ChevronLeft size={24} color="#1A1A2E" />
          </div>
          <span style={{ fontSize: `calc(17px * var(--fs, 1))`, fontWeight: '900', color: '#1A1A2E' }}>전국 물때 & 낚시 달력</span>
        </div>
        <CalIcon size={20} color="#8E8E93" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', padding: '10px 16px', gap: '8px', borderBottom: '1px solid #F0F2F7' }}>
        {Object.entries(REGION_STATIONS).map(([key, st]) => (
          <div 
            key={key}
            onClick={() => setRegion(key)}
            style={{ 
              flex: 1, textAlign: 'center', padding: '12px 0', borderRadius: '12px', cursor: 'pointer',
              background: region === key ? '#1A1A2E' : '#F0F2F7',
              color: region === key ? '#fff' : '#8E8E93',
              fontWeight: '900', fontSize: `calc(14px * var(--fs, 1))`
            }}
          >
            {st.label}
          </div>
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', background: '#E3F2FD', padding: '12px 16px', borderRadius: '12px' }}>
          <MapPin size={16} color="#1565C0" />
          <span style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#1565C0', fontWeight: '800' }}>
            기준 관측소: <strong>{REGION_STATIONS[region].name}</strong>
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Loader2 size={30} color="#42A5F5" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {calendarData.map((day, idx) => {
              const grade = getGradeColor(day.fishingIdx);
              const isToday = idx === 0;
              const dateText = `${day.dateObj.getMonth() + 1}월 ${day.dateObj.getDate()}일`;
              const dayName = ['일', '월', '화', '수', '목', '금', '토'][day.dateObj.getDay()];
              
              return (
                <div key={day.dateStr} style={{ background: '#fff', borderRadius: '16px', padding: '16px', border: isToday ? '2px solid #42A5F5' : '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '950', color: isToday ? '#1565C0' : '#1A1A2E' }}>
                        {dateText} ({dayName})
                      </span>
                      {isToday && <span style={{ background: '#E53935', color: '#fff', fontSize: `calc(10px * var(--fs, 1))`, padding: '2px 6px', borderRadius: '8px', fontWeight: '900' }}>오늘</span>}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: grade.bg, padding: '4px 10px', borderRadius: '12px' }}>
                      <span style={{ fontSize: `calc(12px * var(--fs, 1))` }}>{grade.icon}</span>
                      <span style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', color: grade.text }}>{grade.label}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ background: '#FFF5F5', padding: '10px', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#E53935', fontWeight: '900', marginBottom: '4px' }}>만조 ▲</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ fontSize: `calc(14px * var(--fs, 1))`, color: '#1A1A2E', fontWeight: '900' }}>{day.highs[0]}</span>
                        <span style={{ fontSize: `calc(14px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '800' }}>{day.highs[1]}</span>
                      </div>
                    </div>
                    <div style={{ background: '#F0F8FF', padding: '10px', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#1565C0', fontWeight: '900', marginBottom: '4px' }}>간조 ▼</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ fontSize: `calc(14px * var(--fs, 1))`, color: '#1A1A2E', fontWeight: '900' }}>{day.lows[0]}</span>
                        <span style={{ fontSize: `calc(14px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '800' }}>{day.lows[1]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
