import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { fetchTideForecast } from '../api/marineApi';

export default function DashboardTideWidget({ pointName, obsCode, isGolden, phase }) {
  const [tides, setTides] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!obsCode) {
      setTides([]);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // 어제와 오늘 데이터 로드 (첫 만조/간조의 단차 계산을 위해 어제 데이터 필요)
        const dates = [-1, 0].map(offset => {
          const d = new Date(Date.now() + 9 * 60 * 60 * 1000); // KST Base
          d.setDate(d.getDate() + offset);
          return d.toISOString().slice(0, 10).replace(/-/g, '');
        });

        const [yesterdayRes, todayRes] = await Promise.all([
          fetchTideForecast(obsCode, dates[0]).catch(() => []),
          fetchTideForecast(obsCode, dates[1]).catch(() => [])
        ]);

        if (!isMounted) return;

        const allTides = [];
        [ {date: dates[0], data: yesterdayRes}, {date: dates[1], data: todayRes} ].forEach(day => {
          if (day.data) {
            day.data.forEach(t => {
               allTides.push({
                 dateStr: day.date,
                 time: t.predcDt ? t.predcDt.split(' ')[1].slice(0, 5) : (t.hl_time || '').slice(0, 5),
                 level: parseInt(t.predcTdlvVl || t.hl_level || 0, 10),
                 type: (t.extrSe === '1' || t.extrSe === '3' || t.hl_code === 'H') ? '고조' : '간조',
                 dt: t.predcDt || `${day.date} ${t.hl_time || ''}`
               });
            });
          }
        });
        allTides.sort((a, b) => a.dt.localeCompare(b.dt));

        for (let i = 0; i < allTides.length; i++) {
           if (i === 0) {
             allTides[i].diffStr = '';
           } else {
             const diff = allTides[i].level - allTides[i-1].level;
             allTides[i].diffStr = diff > 0 ? `▲+${diff}` : `▼${diff}`;
           }
        }

        // 오늘 데이터만 필터링
        const todayTides = allTides.filter(t => t.dateStr === dates[1]);
        setTides(todayTides);
      } catch (e) {
        console.error(e);
        if (isMounted) setTides([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [obsCode]);

  return (
    <div style={{ padding: '10px 16px 6px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '12px 14px', border: '1.5px solid #F0F2F7' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <Zap size={13} color="#FFB300" fill="#FFB300" />
          <span style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', color: '#1A1A2E', marginLeft: '5px' }}>
            오늘의 물때 & 피딩타임 <span style={{ fontSize: `calc(9.5px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '800', marginLeft: '4px' }}>(📍 {pointName || '기준 포인트'})</span>
          </span>
          <span style={{ marginLeft: 'auto', fontSize: `calc(10px * var(--fs, 1))`, color: isGolden ? '#E65100' : '#8E8E93', fontWeight: '800' }}>
            {isGolden ? '🌟 황금물때' : phase?.split('(')[0] || ''}
          </span>
        </div>
        
        {loading || !tides ? (
          <div style={{ padding: '12px 0', textAlign: 'center', color: '#8E8E93', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '600' }}>
            실시간 물때 데이터 분석 중...
          </div>
        ) : tides.length === 0 ? (
          <div style={{ padding: '12px 0', textAlign: 'center', color: '#8E8E93', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '600' }}>
            수위 정보가 제공되지 않는 지역입니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tides.map((t, idx) => {
              const isHigh = t.type === '고조';
              const diffStr = t.diffStr;
              const isDiffUp = diffStr.includes('▲');
              
              return (
                <div key={idx} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '6px 12px', background: '#F8F9FC', borderRadius: '8px',
                  border: '1px solid #F0F2F7'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: `calc(11.5px * var(--fs, 1))`, fontWeight: '900', color: isHigh ? '#E53935' : '#1E88E5', width: '42px' }}>
                      {isHigh ? '만조 ▲' : '간조 ▼'}
                    </span>
                    <span style={{ fontSize: `calc(13.5px * var(--fs, 1))`, fontWeight: '850', color: '#1A1A2E' }}>
                      {t.time} <span style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '600' }}>({t.level})</span>
                    </span>
                  </div>
                  {diffStr && (
                    <span style={{ fontSize: `calc(11.5px * var(--fs, 1))`, fontWeight: '850', color: isDiffUp ? '#E53935' : '#1E88E5' }}>
                      {diffStr}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
