import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Calendar, MapPin, Waves, Wind, Anchor, ChevronLeft, Target, Ruler, Droplets } from 'lucide-react';

export default function CatchDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock data for detail
  const record = {
    id: 1,
    date: '2024-03-25',
    time: '14:30',
    location: '강릉 안목해변 방파제',
    fish: '감성돔',
    size: '35cm',
    weight: '1.2kg',
    weather: '맑음',
    wind: '3.5m/s',
    wave: '0.8m',
    gear: '다이와 레가리스 LT 스피닝릴 / 1.5호 목줄 / B찌 채비',
    content: '오후 만조 물때에 맞춰서 입질이 활발했습니다. 역시 안목 방파제는 기대를 저버리지 않네요.',
    img: 'https://images.unsplash.com/photo-1544551763-8dd44758c2dd?auto=format&fit=crop&w=800&q=80'
  };

  return (
    <div className="page-container" style={{ backgroundColor: '#fff', height: '100dvh', zIndex: 2000 }}>
       <div style={{ padding: '16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fff' }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', padding: '8px' }}>
          <ChevronLeft size={24} color="#1c1c1e" />
        </button>
        <h2 style={{ fontSize: '17px', fontWeight: '800', flex: 1, textAlign: 'center', marginRight: '40px' }}>나의 조과 기록</h2>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        <div style={{ padding: '0 0 24px 0' }}>
          <img src={record.img} alt="catch" style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
          
          <div style={{ padding: '24px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0056D2', fontSize: '13px', fontWeight: '800', marginBottom: '4px' }}>
                  <Calendar size={14} /> {record.date} ({record.time})
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: '800' }}>{record.fish} {record.size}</h1>
              </div>
              <div style={{ backgroundColor: '#f0f5ff', padding: '12px', borderRadius: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#0056D2', fontWeight: '800', marginBottom: '2px' }}>무게</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#0056D2' }}>{record.weight}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
               <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '16px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8e8e93', fontSize: '12px', marginBottom: '6px' }}>
                   <MapPin size={14} /> 낚시 장소
                 </div>
                 <div style={{ fontSize: '14px', fontWeight: '700' }}>{record.location}</div>
               </div>
               <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '16px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8e8e93', fontSize: '12px', marginBottom: '6px' }}>
                   <Anchor size={14} /> 사용 채비
                 </div>
                 <div style={{ fontSize: '13px', fontWeight: '700', lineHeight: '1.4' }}>{record.gear}</div>
               </div>
            </div>

            <div style={{ borderTop: '1px solid #f0f0f0', padding: '24px 0' }}>
               <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>당시 기상 실황</h3>
               <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', backgroundColor: '#fdfdff', border: '1px solid #ebf1ff', borderRadius: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Droplets size={20} color="#0056D2" style={{ marginBottom: '4px' }} />
                    <div style={{ fontSize: '11px', color: '#999' }}>날씨</div>
                    <div style={{ fontSize: '14px', fontWeight: '700' }}>{record.weather}</div>
                  </div>
                  <div style={{ textAlign: 'center', borderLeft: '1px solid #eee', borderRight: '1px solid #eee', padding: '0 24px' }}>
                    <Wind size={20} color="#0056D2" style={{ marginBottom: '4px' }} />
                    <div style={{ fontSize: '11px', color: '#999' }}>풍속</div>
                    <div style={{ fontSize: '14px', fontWeight: '700' }}>{record.wind}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <Waves size={20} color="#0056D2" style={{ marginBottom: '4px' }} />
                    <div style={{ fontSize: '11px', color: '#999' }}>파고</div>
                    <div style={{ fontSize: '14px', fontWeight: '700' }}>{record.wave}</div>
                  </div>
               </div>
            </div>

            <div style={{ borderTop: '1px solid #f0f0f0', padding: '24px 0' }}>
               <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '12px' }}>낚시 메모</h3>
               <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#444' }}>{record.content}</p>
            </div>
            
            <button style={{ width: '100%', padding: '18px', borderRadius: '16px', border: '1px solid #0056D2', color: '#0056D2', background: '#fff', fontSize: '15px', fontWeight: '800', marginTop: '12px' }}>
              이 기록 공유하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
