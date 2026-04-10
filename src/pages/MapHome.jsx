import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Map, Anchor, Droplets, Wind, Waves, Ship, Crown, Navigation,
  Search, Clock, Compass, BarChart2, Zap, ChevronRight, Bell,
  MapPin, Thermometer, Info, Fish, X, Tv, ArrowLeft, RefreshCw,
  AlertCircle
} from 'lucide-react';
import { findNearestStation, calculateFishingIndex } from '../utils/weather';
import { evaluateFishingCondition } from '../utils/evaluator';
import ReactPlayer from 'react-player';
import FishingPointBottomSheet from '../components/FishingPointBottomSheet';
import apiClient from '../api/index';
import { useToastStore } from '../store/useToastStore';
import { ALL_FISHING_POINTS, getPointSpecificData } from '../constants/fishingData';

const EMOJI_MAP = { '방파제': '⚓', '갯바위': '🪨', '선착장': '🚢', '항구': '🏖️' };
const STATUS_COLOR = { '최고': '#00C48C', '피딩중': '#FFB300', '활발': '#1565C0', '보통': '#8E8E93' };

export default function MapHome() {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  const [selectedPoint, setSelectedPoint]   = useState(null);
  const [mapLoaded, setMapLoaded]           = useState(false);
  const [precisionData, setPrecisionData]   = useState(null);
  const [loading, setLoading]               = useState(false);
  const [filter, setFilter]                 = useState('전체');
  const [showHeatmap, setShowHeatmap]       = useState(false);
  const [viewMode, setViewMode]             = useState('dashboard'); // 'dashboard' | 'map'
  const [searchQuery, setSearchQuery]       = useState('');
  const [searchResults, setSearchResults]   = useState([]);
  const [showSearch, setShowSearch]         = useState(false);
  const [recentPosts, setRecentPosts]       = useState([]);
  const [showCCTV, setShowCCTV]             = useState(false);
  const [cctvUrl, setCctvUrl]               = useState('');
  const [cctvLoading, setCctvLoading]       = useState(false);
  const [sheetVisible, setSheetVisible]     = useState(false);

  const mapRef      = useRef(null);
  const clustererRef= useRef(null);
  const markersRef  = useRef([]);
  const heatmapRef  = useRef([]);
  const searchRef   = useRef(null);

  /* ── 카카오맵 초기화 ── */
  useEffect(() => {
    const initMap = () => {
      if (!window.kakao?.maps) return;
      const container = document.getElementById('kakao-map');
      if (!container) return;
      
      const options = { 
        center: new window.kakao.maps.LatLng(36.5, 127.8), // 대한민국 중심부
        level: 11 // 전국을 조망할 수 있는 레벨
      };
      
      const map = new window.kakao.maps.Map(container, options);
      
      // 지도 컨트롤 추가 (확대/축소 UI 추가로 더 부드러운 경험 제공)
      const zoomControl = new window.kakao.maps.ZoomControl();
      map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
      const mapTypeControl = new window.kakao.maps.MapTypeControl();
      map.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);
      
      // 줌 가능 및 드래그 가능 명시적 설정
      map.setZoomable(true);
      map.setDraggable(true);
      
      mapRef.current = map;
      
      // 클러스터러 초기화
      clustererRef.current = new window.kakao.maps.MarkerClusterer({
        map: map,
        averageCenter: true,
        minLevel: 10
      });
      
      setMapLoaded(true);
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          if (!window.kakao?.maps) return;
          const cp = new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
          map.panTo(cp);
          new window.kakao.maps.CustomOverlay({
            position: cp, map,
            content: `<div style="width:14px;height:14px;background:#0056D2;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(0,86,180,0.5);z-index:100;"></div>`
          });
        });
      }
    };

    let retry = 0;
    const interval = setInterval(() => {
      if (window.kakao?.maps) { 
        initMap(); 
        clearInterval(interval); 
      } else if (retry > 30) {
        clearInterval(interval);
      }
      retry++;
    }, 200); // 더 빠른 주기적 체크
    
    return () => clearInterval(interval);
  }, []);

  /* ── 마커 렌더링 (최적화) ── */
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    
    if (clustererRef.current) {
      clustererRef.current.clear();
    }
    
    const pts = filter === '전체' ? ALL_FISHING_POINTS : ALL_FISHING_POINTS.filter(p => p.type === filter);
    
    // 대규모 데이터 렌더링 최적화
    const newMarkers = pts.map(point => {
      if (!window.kakao?.maps) return null;
      
      const color = point.type === '방파제' ? '#00C48C' : point.type === '갯바위' ? '#0056D2' : '#FF9B26';
      const el = document.createElement('div');
      el.style.cssText = `
        background: ${color};
        width: 24px; height: 24px;
        display: flex; align-items: center; justify-content: center;
        color: #fff; font-weight: 950;
        border: 2px solid #fff; border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        cursor: pointer; font-size: 10px;
        transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      `;
      el.textContent = point.type.charAt(0);
      
      el.onmouseenter = () => { el.style.transform = 'scale(1.3) translateY(-2px)'; el.style.zIndex = '50'; };
      el.onmouseleave = () => { el.style.transform = 'scale(1)'; el.style.zIndex = '10'; };
      el.onclick = () => handlePointClick(point);
      
      return new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(point.lat, point.lng),
        content: el,
        zIndex: 10
      });
    }).filter(m => m !== null);
    
    if (clustererRef.current) {
      clustererRef.current.addMarkers(newMarkers);
    }
    markersRef.current = newMarkers;
  }, [mapLoaded, filter]);

  /* ── 수온 히트맵 렌더링 (Premium Feature) ── */
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    
    heatmapRef.current.forEach(c => c.setMap(null));
    heatmapRef.current = [];
    
    if (showHeatmap) {
      ALL_FISHING_POINTS.forEach(point => {
        if (!window.kakao?.maps) return;
        const temp = 10 + Math.random() * 10; // 10도 ~ 20도 시뮬레이션
        const color = temp > 17 ? '#FF3B30' : (temp > 14 ? '#FF9B26' : '#1565C0');
        const circle = new window.kakao.maps.Circle({
          center: new window.kakao.maps.LatLng(point.lat, point.lng),
          radius: 4000, 
          strokeWeight: 0,
          fillColor: color,
          fillOpacity: 0.35
        });
        circle.setMap(mapRef.current);
        heatmapRef.current.push(circle);
      });
    }
  }, [showHeatmap, mapLoaded]);

  /* ── 맵 리사이즈 (뷰모드 변경 시) ── */
  useEffect(() => {
    if (viewMode === 'map' && mapRef.current) {
      // 즉시 relayout 시도 및 지연 실행으로 안전성 확보
      mapRef.current.relayout();
      const timer = setTimeout(() => {
        mapRef.current.relayout();
        if (selectedPoint) {
          mapRef.current.panTo(new window.kakao.maps.LatLng(selectedPoint.lat, selectedPoint.lng));
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [viewMode, selectedPoint]);

  /* ── 커뮤니티 최신글 ── */
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res  = await apiClient.get('/api/community/posts');
        setRecentPosts(res.data.slice(0, 3));
      } catch { /* 서버 미응답 시 빈 상태 유지 */ }
    };
    fetch_();
  }, []);

  /* ── 검색 외부 클릭 닫기 ── */
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── 검색 ── */
  const handleSearch = (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); setShowSearch(false); return; }
    const low = q.toLowerCase();
    const filtered = ALL_FISHING_POINTS.filter(p =>
      p.name.toLowerCase().includes(low) ||
      p.fish.toLowerCase().includes(low) ||
      p.type.toLowerCase().includes(low) ||
      (p.region?.toLowerCase().includes(low))
    );
    setSearchResults(filtered);
    setShowSearch(true);
  };

  /* ── 포인트 클릭 ── */
  const handlePointClick = async (point) => {
    setSelectedPoint(point);
    setPrecisionData(null);
    setSheetVisible(true);
    if (mapRef.current) mapRef.current.panTo(new window.kakao.maps.LatLng(point.lat, point.lng));
    const nearest = findNearestStation(point.lat, point.lng);
    try {
      const res = await apiClient.get(`/api/weather/precision?stationId=${nearest.id}`);
      setPrecisionData({ ...res.data, pointName: point.name });
    } catch {
      setPrecisionData({
        pointName: point.name,
        name: '현장 측정(시뮬레이션)', sst: '14.2', temp: '15.2°C',
        wind: { speed: 2.8, dir: 'W' },
        wave: { coastal: 0.3 },
        tide: { phase: '7물(사리)', low: '08:42', high: '15:20', current_level: '120cm' },
        layers: { upper: 16.5, middle: 14.8, lower: 13.2 }
      });
    } finally { setLoading(false); }
  };

  /* ── CCTV 열기 ── */
  const handleCCTVOpen = (point) => {
    setShowCCTV(true);
    setCctvUrl(point.cctvUrl || null);
  };

  /* ── 바텀시트 닫기 ── */
  const closeSheet = () => {
    setSheetVisible(false);
    setTimeout(() => setSelectedPoint(null), 350);
  };

  /* ── 렌더링용 데이터 가공 ── */
  const currentData = precisionData || getPointSpecificData(selectedPoint || ALL_FISHING_POINTS[0]);
  const cond        = evaluateFishingCondition(currentData, selectedPoint || ALL_FISHING_POINTS[0]);
  const score       = cond.score;
  const isGolden    = score >= 90;
  const tideData    = currentData;
  const phase       = tideData.tide?.phase || '7물(사리)';
  const PREMIUM_POINTS = ALL_FISHING_POINTS.filter(p => p.score >= 90).slice(0, 8);

  return (
    <div style={{ backgroundColor: '#F4F6FA', height: '100vh', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: '100%', maxWidth: '480px', backgroundColor: '#fff', height: '100%',
        display: 'flex', flexDirection: 'column', position: 'relative',
        boxShadow: '0 0 40px rgba(0,0,0,0.05)',
        fontFamily: 'Pretendard, -apple-system, sans-serif'
      }}>

        {/* ── 헤더 ── */}
        <div style={{ backgroundColor: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0F0F5', zIndex: 20, flexShrink: 0 }}>
          {viewMode === 'map' ? (
            <>
              <button onClick={() => setViewMode('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '800', color: '#1565C0' }}>
                <ArrowLeft size={18} /> 대시보드
              </button>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {['전체', '방파제', '갯바위', '항구'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: '5px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                    fontSize: '11px', fontWeight: '800', flexShrink: 0,
                    background: filter === f ? '#1565C0' : '#F0F2F7',
                    color: filter === f ? '#fff' : '#555',
                    transition: 'all 0.2s',
                  }}>{f}</button>
                ))}
                <button 
                  onClick={() => {
                    setShowHeatmap(!showHeatmap);
                    if (!showHeatmap) addToast('🔥 프리미엄 표층 수온 히트맵 생성을 완료했습니다.', 'success');
                  }} 
                  style={{
                    padding: '5px 10px', borderRadius: '20px', border: '1.5px solid #FF3B30', cursor: 'pointer',
                    fontSize: '11px', fontWeight: '900', flexShrink: 0,
                    background: showHeatmap ? '#FF3B30' : '#fff',
                    color: showHeatmap ? '#fff' : '#FF3B30',
                    transition: 'all 0.2s',
                  }}>
                  {showHeatmap ? '🔥 히트맵 끄기' : '🔥 수온 히트맵 (PRO)'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Anchor size={22} color="#1565C0" strokeWidth={2.5} />
                <span style={{ fontSize: '19px', fontWeight: '950', color: '#1A1A2E', letterSpacing: '-0.04em' }}>낚시GO</span>
                <span style={{ background: 'linear-gradient(90deg, #FFD700, #FFA500)', fontSize: '8px', padding: '2px 7px', borderRadius: '20px', color: '#5C3A00', fontWeight: '900', marginLeft: '2px' }}>PREMIUM</span>
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ position: 'relative', cursor: 'pointer' }}>
                  <Bell size={20} color="#333" strokeWidth={2} />
                  <span style={{ position: 'absolute', top: '-1px', right: '-1px', width: '6px', height: '6px', background: '#FF3B30', borderRadius: '50%', border: '1.5px solid #fff' }} />
                </div>
                <img src="https://i.pravatar.cc/150?img=11" alt="profile" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1.5px solid #E8F0FE', objectFit: 'cover', cursor: 'pointer' }} />
              </div>
            </>
          )}
        </div>

        {/* ── 지도 풀스크린 뷰 ── */}
        <div style={{ display: viewMode === 'map' ? 'flex' : 'none', flex: 1, flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <div id="kakao-map" style={{ width: '100%', flex: 1, background: '#e8edf5' }} />
          {!mapLoaded && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F4F6FA', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid #1565C0', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: '13px', color: '#8E8E93', fontWeight: '700' }}>지도 로딩 중…</span>
            </div>
          )}
        </div>

        {/* ── 대시보드 뷰 ── */}
        <div style={{ display: viewMode === 'dashboard' ? 'flex' : 'none', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '90px', scrollbarWidth: 'none' }}>

            {/* 메인 블루 카드 */}
            <div style={{ padding: '16px 16px 0' }}>
              <div style={{
                background: 'linear-gradient(135deg, #1565C0 0%, #1E88E5 60%, #42A5F5 100%)',
                borderRadius: '20px', padding: '18px 18px 16px',
                boxShadow: '0 8px 30px rgba(21,101,192,0.25)', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.75)', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>
                  <MapPin size={10} color="rgba(255,255,255,0.75)" fill="rgba(255,255,255,0.4)" />
                  {precisionData?.pointName || selectedPoint?.name || '강릉 안목항 방파제'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '38px', fontWeight: '950', color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      {tideData.temp ? (typeof tideData.temp === 'string' ? tideData.temp.replace('°C', '') : tideData.temp) + '°' : '15.2°'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: '700', marginTop: '4px' }}>
                      {cond.advice}
                    </div>
                  </div>
                  <div style={{
                    width: '68px', height: '68px', borderRadius: '50%',
                    background: isGolden ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.12)',
                    border: isGolden ? '2px solid rgba(255,215,0,0.5)' : '1.5px solid rgba(255,255,255,0.2)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(8px)',
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: '950', color: isGolden ? '#FFD700' : '#fff', lineHeight: 1 }}>{score}</div>
                    <div style={{ fontSize: '8px', fontWeight: '800', color: isGolden ? 'rgba(255,215,0,0.8)' : 'rgba(255,255,255,0.6)', marginTop: '2px' }}>낚시점수</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                  {[
                    { label: '상층', val: `${tideData.layers?.upper || '16.2'}°`, color: '#64B5F6' },
                    { label: '중층', val: `${tideData.layers?.middle || '14.5'}°`, color: '#42A5F5' },
                    { label: '저층', val: `${tideData.layers?.lower || '13.1'}°`, color: '#1E88E5' },
                  ].map(l => (
                    <div key={l.label} style={{ flex: 1, background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '8px 4px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', fontWeight: '800', marginBottom: '2px' }}>{l.label}</div>
                      <div style={{ fontSize: '13px', color: '#fff', fontWeight: '950' }}>{l.val}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px', alignItems: 'center' }}>
                  {[
                    { Icon: Waves, label: '파고', val: `${tideData.wave?.coastal || '0.4'}m` },
                    { Icon: Wind,  label: '풍속', val: `${tideData.wind?.speed || '2.1'}m/s` },
                    { Icon: Clock, label: '만조', val: tideData.tide?.high || '15:20' },
                  ].map(chip => (
                    <div key={chip.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, background: 'rgba(255,255,255,0.14)', borderRadius: '30px', padding: '6px 12px', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <chip.Icon size={11} color="rgba(255,255,255,0.8)" />
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', fontWeight: '700' }}>{chip.label}</span>
                      <span style={{ fontSize: '11px', color: '#fff', fontWeight: '950' }}>{chip.val}</span>
                    </div>
                  ))}
                  {/* CCTV 링크 버튼 추가 */}
                  <button 
                    onClick={async () => {
                      const sid = selectedPoint?.obsCode || 'DT_0001';
                      try {
                        const res = await apiClient.get(`/api/weather/cctv?stationId=${sid}`);
                        if (res.data.url) {
                          setCctvUrl(res.data.url);
                          setShowCCTV(true);
                        } else {
                          addToast('현재 지점에 제공 가능한 실시간 영상이 없습니다.', 'error');
                        }
                      } catch {
                        addToast('영상 데이터를 불러오는 데 실패했습니다.', 'error');
                      }
                    }}
                    style={{ marginLeft: 'auto', background: 'rgba(255,215,0,0.9)', border: 'none', borderRadius: '30px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                  >
                    <Tv size={12} color="#1A1A2E" />
                    <span style={{ fontSize: '10px', fontWeight: '900', color: '#1A1A2E' }}>실시간 영상</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 퀵메뉴 */}
            <div style={{ padding: '16px 16px 4px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[
                  { Icon: Map,       label: '포인트',  color: '#1565C0', bg: '#EBF2FF', action: () => setViewMode('map') },
                  { Icon: BarChart2, label: '날씨',    color: '#2E7D32', bg: '#EDF7EE', action: () => navigate('/weather') },
                  { Icon: Ship,      label: '선상/크루', color: '#BF360C', bg: '#FFF3EE', action: () => navigate('/community') },
                  { Icon: Crown,     label: '클럽',    color: '#6A1B9A', bg: '#F5EEFF', action: () => navigate('/community') },
                ].map((m, index) => (
                  <div key={index} onClick={m.action} style={{ textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#fff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F2F7', transition: 'transform 0.15s', }}
                      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
                      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <div style={{ width: '40px', height: '40px', background: m.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <m.Icon size={20} color={m.color} />
                      </div>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#555' }}>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 피딩 스케줄 */}
            <div style={{ padding: '10px 16px 6px' }}>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '12px 14px', border: '1.5px solid #F0F2F7' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <Zap size={13} color="#FFB300" fill="#FFB300" />
                  <span style={{ fontSize: '12px', fontWeight: '900', color: '#1A1A2E', marginLeft: '5px' }}>피딩 타임</span>
                  <span style={{ marginLeft: 'auto', fontSize: '10px', color: isGolden ? '#E65100' : '#8E8E93', fontWeight: '800' }}>
                    {isGolden ? '🌟 황금물때' : phase.split('(')[0]}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { label: '새벽', time: tideData.tide?.low  || '06:10', active: false },
                    { label: '황금 ✨', time: '14:20',                      active: true  },
                    { label: '저녁', time: tideData.tide?.high || '19:30', active: false },
                  ].map((ft, i) => (
                    <div key={i} style={{
                      flex: 1, padding: '8px 2px', borderRadius: '12px', textAlign: 'center',
                      background: ft.active ? 'linear-gradient(135deg, #FFD700, #FFA000)' : '#F8F9FC',
                      border: ft.active ? 'none' : '1px solid #F0F2F7',
                    }}>
                      <div style={{ fontSize: '8px', fontWeight: '900', color: ft.active ? '#5C3A00' : '#AAB0BE', marginBottom: '2px' }}>{ft.label}</div>
                      <div style={{ fontSize: '11px', fontWeight: '950', color: ft.active ? '#1A1A00' : '#8E8E93' }}>{ft.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 프리미엄 멤버십 */}
            <div style={{ padding: '8px 16px 6px' }}>
              <div style={{ background: '#1A1A2E', borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #FFD700, #FFA000)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Crown size={18} color="#5C3A00" fill="#5C3A00" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#fff' }}>프리미엄 멤버십</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>비밀 포인트 대공개</div>
                </div>
                <button style={{ background: 'linear-gradient(90deg, #FF5A5F, #FF3B40)', color: '#fff', border: 'none', borderRadius: '20px', padding: '7px 12px', fontSize: '10px', fontWeight: '900', cursor: 'pointer' }}>알아보기</button>
              </div>
            </div>

            {/* 우수 포인트 카드 */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '950', color: '#1A1A2E', margin: 0 }}>실시간 우수 포인트</h3>
                <span onClick={() => setViewMode('map')} style={{ fontSize: '11px', color: '#1565C0', fontWeight: '800', cursor: 'pointer' }}>지도보기 →</span>
              </div>
              <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', padding: '2px 16px 10px', scrollbarWidth: 'none' }}>
                {PREMIUM_POINTS.map(point => {
                  const cond = evaluateFishingCondition({ stationId: point.obsCode, sst: point.score / 6 }, point);
                  return (
                    <div key={point.id}
                      onClick={() => { setViewMode('map'); handlePointClick(point); }}
                      style={{ minWidth: '140px', background: '#fff', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 3px 10px rgba(0,0,0,0.06)', border: '1px solid #F0F2F7', cursor: 'pointer', transition: 'transform 0.15s' }}
                      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <div style={{ width: '100%', height: '90px', background: 'linear-gradient(135deg, #E8F0FE, #D2E3FC)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '32px' }}>{EMOJI_MAP[point.type] || '⚓'}</span>
                        <div style={{ position: 'absolute', top: '6px', left: '6px', background: cond.color || '#8E8E93', borderRadius: '6px', padding: '2px 6px' }}>
                          <span style={{ fontSize: '8px', fontWeight: '900', color: '#fff' }}>{cond.status}</span>
                        </div>
                        <div style={{ position: 'absolute', top: '6px', right: '6px', background: '#FFD700', borderRadius: '6px', padding: '2px 6px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                          <span style={{ fontSize: '9px', fontWeight: '900', color: '#1A1A2E' }}>{cond.score}점</span>
                        </div>
                      </div>
                      <div style={{ padding: '8px 10px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '900', color: '#1A1A2E', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{point.name}</div>
                        <div style={{ fontSize: '9px', color: '#AAB0BE', fontWeight: '700' }}>{point.region} · {point.fish.split(',')[0]}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 검색바 + 드롭다운 */}
            <div style={{ padding: '4px 16px 6px', position: 'relative' }} ref={searchRef}>
              <div style={{ height: '46px', backgroundColor: '#F8F9FC', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 14px', gap: '10px', border: '1.5px solid #F0F2F7' }}>
                <Search size={15} color="#1565C0" strokeWidth={3} />
                <input
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQuery && setShowSearch(true)}
                  placeholder="포인트, 어종, 지역 검색"
                  style={{ border: 'none', background: 'none', fontSize: '13px', fontWeight: '700', outline: 'none', width: '100%' }}
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearch(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AAB0BE', padding: 0 }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* 검색 결과 드롭다운 */}
              {showSearch && searchResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: '16px', right: '16px', background: '#fff',
                  borderRadius: '14px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #F0F2F7',
                  zIndex: 100, maxHeight: '240px', overflowY: 'auto',
                }}>
                  {searchResults.map((p, i) => (
                    <div key={p.id}
                      onClick={() => { setViewMode('map'); handlePointClick(p); setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}
                      style={{
                        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px',
                        borderBottom: i < searchResults.length - 1 ? '1px solid #F8F9FC' : 'none',
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8F9FC'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: '30px', height: '30px', background: '#EBF2FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                        {EMOJI_MAP[p.type] || '⚓'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: '900', color: '#1A1A2E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ fontSize: '10px', color: '#AAB0BE', fontWeight: '700' }}>{p.region} · {p.type} · {p.fish.split(',')[0]}</div>
                      </div>
                      <div style={{ background: STATUS_COLOR[p.status] || '#8E8E93', borderRadius: '6px', padding: '2px 7px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '900', color: '#fff' }}>{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {showSearch && searchResults.length === 0 && searchQuery && (
                <div style={{ position: 'absolute', top: '100%', left: '16px', right: '16px', background: '#fff', borderRadius: '14px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #F0F2F7', zIndex: 100, padding: '20px', textAlign: 'center' }}>
                  <AlertCircle size={20} color="#AAB0BE" style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '12px', color: '#AAB0BE', fontWeight: '700' }}>검색 결과가 없어요</div>
                </div>
              )}
            </div>

            {/* 조황 보고 */}
            <div style={{ padding: '10px 16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '950', color: '#1A1A2E', marginBottom: '10px' }}>방금 올라온 조황</h3>
              {recentPosts.length > 0 ? recentPosts.map(post => (
                <div key={post.id} style={{ background: '#fff', borderRadius: '12px', padding: '10px 12px', marginBottom: '8px', display: 'flex', gap: '10px', alignItems: 'center', border: '1px solid #F0F2F7' }}>
                  <img src={`https://i.pravatar.cc/100?u=${post.author}`} style={{ width: '36px', height: '36px', borderRadius: '10px' }} alt="" />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '12px', fontWeight: '900', color: '#1A1A2E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.content}</div>
                    <div style={{ fontSize: '10px', color: '#AAB0BE', fontWeight: '700' }}>@{post.author}</div>
                  </div>
                </div>
              )) : (
                <div style={{ padding: '14px', textAlign: 'center', color: '#AAB0BE', fontSize: '12px', fontWeight: '700', border: '1px dotted #D0D5E0', borderRadius: '12px' }}>
                  오늘의 첫 조황을 공유해보세요! 🎣
                </div>
              )}
            </div>

            {/* 미끼 팁 */}
            <div style={{ padding: '4px 16px 20px' }}>
              <div style={{ backgroundColor: '#1A1A2E', borderRadius: '16px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #FFD700, #FFA000)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Fish size={20} color="#5C3A00" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '9px', fontWeight: '900', color: '#FFB300', marginBottom: '2px' }}>오늘의 미끼 팁</div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#fff', lineHeight: 1.3 }}>물살 빠른 오늘엔 크릴 조합이 최적!</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 바텀 시트 (포인트 상세) ── */}
        {/* 배경 오버레이 */}
        {sheetVisible && (
          <div
            onClick={closeSheet}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1050, backdropFilter: 'blur(2px)' }}
          />
        )}
        <div style={{
          position: 'absolute', bottom: sheetVisible ? 0 : '-100%', left: 0, width: '100%',
          background: '#fff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
          transition: 'bottom 0.38s cubic-bezier(0.34,1.56,0.64,1)',
          zIndex: 1100, maxHeight: '80%', overflowY: 'auto',
        }}>
          {/* 컴포넌트로 분리된 바텀 시트 화면 렌더링 */}
          {selectedPoint && (
            <FishingPointBottomSheet 
              selectedPoint={selectedPoint} 
              onClose={closeSheet} 
            />
          )}
        </div>

        {/* ── CCTV 모달 ── */}
        {showCCTV && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1200, display: 'flex', flexDirection: 'column' }}>
            {/* 모달 헤더 */}
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '700', marginBottom: '2px' }}>실시간 현장 영상</div>
                <div style={{ fontSize: '16px', fontWeight: '950', color: '#fff' }}>{selectedPoint?.name}</div>
              </div>
              <button onClick={() => { setShowCCTV(false); setCctvUrl(''); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} color="#fff" />
              </button>
            </div>

            {/* 플레이어 */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              {cctvUrl ? (
                <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', aspectRatio: '16/9', position: 'relative' }}>
                  <iframe 
                    src={cctvUrl} 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} 
                  />
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  <AlertCircle size={40} style={{ margin: '0 auto 10px', display: 'block', color: 'rgba(255,255,255,0.3)' }} />
                  <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>CCTV 실시간 영상을 준비 중입니다</div>
                  <div style={{ fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.4)' }}>해당 포인트는 안전상의 이유로 영상 송출이 제한되었습니다.</div>
                </div>
              )}
            </div>

            {/* 하단 안내 */}
            <div style={{ padding: '16px 20px 30px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: '700', textAlign: 'center' }}>
                📡 해양수산부 공공 CCTV 연동 · 일부 구간 지연 발생 가능
              </div>
            </div>
          </div>
        )}

        {/* 스핀 애니메이션 */}
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          input::placeholder { color: #AAB0BE; }
          ::-webkit-scrollbar { display: none; }
        `}</style>
      </div>
    </div>
  );
}
