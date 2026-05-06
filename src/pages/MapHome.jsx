import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Map, Anchor, Droplets, Wind, Waves, Ship, Crown, Navigation,
  Search, Clock, Compass, BarChart2, Zap, ChevronRight, Bell,
  MapPin, Thermometer, Info, Fish, X, Tv, ArrowLeft, RefreshCw,
  AlertCircle, Star, Lock
} from 'lucide-react';
import { findNearestStation, calculateFishingIndex } from '../utils/weather';
import { evaluateFishingCondition } from '../utils/evaluator';
import ReactPlayer from 'react-player';
import FishingPointBottomSheet from '../components/FishingPointBottomSheet';
import apiClient from '../api/index';
import { useToastStore } from '../store/useToastStore';
import { ALL_FISHING_POINTS, SECRET_FISHING_POINTS, getPointSpecificData } from '../constants/fishingData';
import { useUserStore, TIER_CONFIG, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore';

// ✅ 5TH-C4: EMOJI_MAP — WeatherDashboard와 동일 객체; 향후 constants/ui.js 추출 검토 권장


const EMOJI_MAP = { '방파제': '⚓', '갯바위': '🪨', '선착장': '🚢', '항구': '🏖️' };
const STATUS_COLOR = { '최고': '#00C48C', '피딩중': '#FFB300', '활발': '#1565C0', '보통': '#8E8E93' };
// ✅ 26TH-B2: DEFAULT_AVATAR_SVG 모듈 레벨 상수 — pravatar.cc 외부 의존 제거 (6TH-A2 MyPage 패턴)
const DEFAULT_AVATAR_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23E5E5EA'/%3E%3Ccircle cx='20' cy='16' r='7' fill='%23AEAEB2'/%3E%3Cellipse cx='20' cy='36' rx='12' ry='9' fill='%23AEAEB2'/%3E%3C/svg%3E";

export default function MapHome() {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  const user = useUserStore((state) => state.user);
  const userTier = useUserStore((state) => state.userTier);
  // ✅ 26TH-B1: canAccessPremium 셀렉터 함수 호출 → userTier + useMemo 직접 판별 (25TH-B2 CommunityTab 패턴 통일)
  const canAccessPremium = useMemo(() => {
    if (user?.id === ADMIN_ID || user?.email === ADMIN_EMAIL || user?.email === ADMIN_ID) return true;
    return ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'MASTER'].includes(userTier);
  }, [userTier, user?.id, user?.email]); // eslint-disable-line react-hooks/exhaustive-deps
  // ✅ FIX-ADMIN: isAdmin 4중 보장 — id/email(gmail)/email(ID)/tier
  const isAdmin = useUserStore(s =>
    s.user?.id === ADMIN_ID ||
    s.user?.email === ADMIN_EMAIL ||
    s.user?.email === ADMIN_ID ||
    s.userTier === 'MASTER'
  );
  const currentTier = isAdmin ? TIER_CONFIG.MASTER : (TIER_CONFIG[userTier] || TIER_CONFIG.FREE);
  const [selectedPoint, setSelectedPoint]   = useState(null);
  const [mapLoaded, setMapLoaded]           = useState(false);
  const [mapLoadError, setMapLoadError]     = useState(false); // SDK 미설정 시 에러 표시
  const [loading, setLoading]               = useState(false);
  const [filter, setFilter]                 = useState('전체');
  const [showHeatmap, setShowHeatmap]       = useState(false);
  const [viewMode, setViewMode]             = useState('dashboard'); // 'dashboard' | 'map'
  const [searchQuery, setSearchQuery]       = useState('');
  const [searchResults, setSearchResults]   = useState([]);
  const [showSearch, setShowSearch]         = useState(false);
  const [recentPosts, setRecentPosts]       = useState([]);
  const [showCCTV, setShowCCTV]             = useState(false);
  const [cctvData, setCctvData]             = useState(null);
  const [cctvLoading, setCctvLoading]       = useState(false);
  const [sheetVisible, setSheetVisible]     = useState(false);
  const [heatmapMode, setHeatmapMode]       = useState('sst');
  const [effectiveSecretPoints, setEffectiveSecretPoints] = useState(SECRET_FISHING_POINTS);
  // ✅ 5TH-A5: currentTime 상태 제거 — 매분 전체 리렌더 방지, useClock hook으로 분리
  // 시간 표시는 컴포넌트 내 LiveClock 컴포넌트가 도맡
  const [showSecretPoints, setShowSecretPoints] = useState(false);
  const [precisionData, setPrecisionData]       = useState(null);
  // ── 즐겨찾기 (로컬 + DB 이중 동기화) ─────────────────────────
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fishing_favorites') || '[]'); } catch { return []; }
  });
  const secretMarkersRef = useRef([]);

  // ✅ 5TH-A5: currentTime setInterval 제거 — LiveClock 컴포넌트가 도맡하므로 MapHome 리렌더 불필요
  // 기존: setInterval(() => setCurrentTime(new Date()), 60000) 제거

  // 즐겨찾기 DB 동기화 (로그인 시 서버에서 불러오기)
  useEffect(() => {
    if (!user) return;
    const userId = user.email || user.id;
    if (!userId || userId === 'GUEST') return;
    apiClient.get(`/api/user/favorites?userId=${encodeURIComponent(userId)}`)
      .then(res => {
        if (res.data.favorites?.length > 0) {
          setFavorites(res.data.favorites);
          localStorage.setItem('fishing_favorites', JSON.stringify(res.data.favorites));
        }
      })
      .catch((err) => {
        // ✅ 26TH-C1: silent catch → 개발 환경 에러 가시화 (23TH-B3 패턴)
        if (!import.meta.env.PROD) console.warn('[MapHome] 즐겨찾기 로드 실패:', err?.message);
      });
  }, [user?.email]);

  // 즐겨찾기 토글 함수 (로컬 + DB 동기화)
  const toggleFavorite = (pointId) => {
    const isFav = favorites.includes(pointId);
    const next = isFav ? favorites.filter(f => f !== pointId) : [...favorites, pointId];
    setFavorites(next);
    localStorage.setItem('fishing_favorites', JSON.stringify(next));
    addToast(isFav ? '즐겨찾기 해제' : '⭐ 즐겨찾기 추가!', isFav ? 'info' : 'success');
    // ENH6-C1: isGuest 변수 추출 — GUEST 체크 중복 제거
    const userId = user?.email || user?.id;
    // ✅ 5TH-B8: isGuest 3중 중복 체크 단순화 — userId === 'GUEST'이면 user.id === 'GUEST'와 동일
    const isGuest = !userId || userId === 'GUEST';
    // 서버 동기화
    if (!isGuest) {
      apiClient.post('/api/user/favorites', { userId, pointId, action: isFav ? 'remove' : 'add' }).catch(() => {});
    }
    // EXP (포인트 방문)
    if (!isFav && !isGuest) {
      apiClient.post('/api/user/exp', { userId, action: 'point_visit' }).catch(() => {});
    }
  };


  const mapRef         = useRef(null);
  const clustererRef   = useRef(null);
  const markersRef     = useRef([]);
  const heatmapRef     = useRef([]);
  const searchRef      = useRef(null);
  const mapInitialized = useRef(false);

  /* ── 서버에서 비밀포인트 좌표 오버라이드 fetch (프리미엄 이상만 호출) ── */
  useEffect(() => {
    // 무료/GUEST 사용자는 401 발생 — 서버 미들웨어와 클라이언트 권한 일치
    if (!canAccessPremium && !isAdmin) return;
    apiClient.get('/api/secret-point-overrides')
      .then(res => {
        const ov = res.data || {};
        const applied = SECRET_FISHING_POINTS.map(p => {
          const key = String(p.id);
          return ov[key] ? { ...p, lat: ov[key].lat, lng: ov[key].lng } : p;
        });
        setEffectiveSecretPoints(applied);
      })
      .catch(() => {
        // 서버 오프라인 시 localStorage fallback
        try {
          const ov = JSON.parse(localStorage.getItem('secretPointOverrides') || '{}');
          setEffectiveSecretPoints(SECRET_FISHING_POINTS.map(p => ov[p.id] ? { ...p, lat: ov[p.id].lat, lng: ov[p.id].lng } : p));
        } catch { /* 기본값 유지 */ }
      });
  }, [canAccessPremium, isAdmin]);

  /* ── 카카오맵 초기화 (viewMode=map 진입 시, kakao.maps.load 공식 콜백) ── */
  useEffect(() => {
    if (viewMode !== 'map') return;

    // 이미 초기화됐으면 relayout만
    if (mapInitialized.current && mapRef.current) {
      requestAnimationFrame(() => { mapRef.current?.relayout(); });
      return;
    }

    const createMap = () => {
      const container = document.getElementById('kakao-map');
      if (!container) return;
      try {
        const map = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(36.5, 127.8),
          level: 11
        });
        map.addControl(new window.kakao.maps.ZoomControl(), window.kakao.maps.ControlPosition.RIGHT);
        map.addControl(new window.kakao.maps.MapTypeControl(), window.kakao.maps.ControlPosition.TOPRIGHT);
        map.setZoomable(true);
        map.setDraggable(true);
        mapRef.current = map;
        clustererRef.current = new window.kakao.maps.MarkerClusterer({
          map, averageCenter: true, minLevel: 10
        });
        mapInitialized.current = true;
        setMapLoaded(true);
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!mapRef.current) return;
              const cp = new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
              mapRef.current.panTo(cp);
              new window.kakao.maps.CustomOverlay({
                position: cp, map: mapRef.current,
                content: `<div style="width:14px;height:14px;background:#0056D2;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(0,86,180,0.5);z-index:100;"></div>`
              });
            },
            // ENH6-A1/B2: 위치 거부 시 PROD 가드 + 사용자 toast 피드백
            () => {
              if (!import.meta.env.PROD) console.warn('[MapHome] 위치 권한이 거부되었습니다.');
              addToast('현위치를 가져올 수 없습니다. 지도에서 직접 포인트를 타앱해 주세요.', 'info');
            },
            { timeout: 8000 }
          );
        }
      } catch (err) {
        // ENH6-A1: 지도 생성 오류 PROD 가드
        if (!import.meta.env.PROD) console.error('카카오맵 Map 생성 오류:', err);
      }
    };

    // kakao.maps.load() — autoload=false 일 때 SDK 준비 완료 콜백
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(createMap);
    } else {
      // SDK 스크립트가 로드되면 즉시 감지 (폴링 대신 script onload 이벤트)
      const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
      if (existingScript) {
        // 스크립트가 이미 주입됐으나 아직 실행 전 → onload 대기
        const onSdkLoad = () => {
          if (window.kakao?.maps) window.kakao.maps.load(createMap);
        };
        existingScript.addEventListener('load', onSdkLoad, { once: true });
        // 폴백: 이미 실행됐을 수도 있으므로 즉시 체크도 병행
        if (window.kakao?.maps) { window.kakao.maps.load(createMap); }
        // 5초 내 로드 없으면 에러 표시
        const errTimer = setTimeout(() => { if (!mapInitialized.current) setMapLoadError(true); }, 5000);
        return () => { existingScript.removeEventListener('load', onSdkLoad); clearTimeout(errTimer); };
      } else {
        // 스크립트 자체가 없는 경우 (KAKAO_KEY 미설정) — 3초 후 에러 표시
        const errTimer = setTimeout(() => { if (!mapInitialized.current) setMapLoadError(true); }, 3000);
        let retry = 0;
        const id = setInterval(() => {
          if (window.kakao?.maps) { clearInterval(id); clearTimeout(errTimer); window.kakao.maps.load(createMap); }
          else if (retry >= 5) { clearInterval(id); if (!import.meta.env.PROD) console.warn('[MapHome] 카카오맵 SDK 없음 — VITE_KAKAO_APP_KEY 확인 필요'); }
          retry++;
        }, 500);
        return () => { clearInterval(id); clearTimeout(errTimer); };
      }
    }
  }, [viewMode]);


  /* ── 포인트 클릭 ── */
  // ✅ 5TH-B1: useCallback — 마커 useEffect 업데이트 시 매 렌더마다 새 함수 생성 방지
  // ✅ FIX-TDZ: 마커 렌더링 useEffect보다 먼저 선언해야 TDZ(Cannot access before initialization) 방지
  const handlePointClick = useCallback(async (point, fromDashboard = false) => {
    setSelectedPoint(point);
    setPrecisionData(null);
    setLoading(true);
    if (!fromDashboard) {
      setSheetVisible(true);
      if (mapRef.current) mapRef.current.panTo(new window.kakao.maps.LatLng(point.lat, point.lng));
    }
    const nearest = findNearestStation(point.lat, point.lng);
    try {
      const res = await apiClient.get(`/api/weather/precision?stationId=${nearest.id}`);
      const dynamicTide = getPointSpecificData(point).tide;
      setPrecisionData({ ...res.data, pointName: point.name, tide: dynamicTide });
    } catch {
      setPrecisionData(getPointSpecificData(point));
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // ✅ 26TH-C2: handlePointClick이 useCallback으로 안정화됨 — eslint-disable 제거 후 deps에 명시적 포함
  }, [mapLoaded, filter, handlePointClick]);

  /* ── 비밀 포인트 마커 렌더링 (LITE 이상 전용) ── */
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    // 기존 비밀 마커 제거
    secretMarkersRef.current.forEach(m => { if (m?.setMap) m.setMap(null); });
    secretMarkersRef.current = [];

    if (!showSecretPoints) return;

    effectiveSecretPoints.forEach(point => {

      if (!window.kakao?.maps) return;

      // 황금 별 마커 (비밀포인트)
      const el = document.createElement('div');
      el.style.cssText = `
        width: 36px; height: 36px;
        display: flex; align-items: center; justify-content: center;
        font-size: 20px;
        filter: drop-shadow(0 0 8px rgba(255,215,0,0.9)) drop-shadow(0 0 3px rgba(255,160,0,0.8));
        cursor: pointer;
        animation: secretPulse 1.5s ease-in-out infinite;
        z-index: 9999;
      `;
      el.textContent = '⭐';
      el.onclick = () => handlePointClick(point);

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(point.lat, point.lng),
        content: el,
        zIndex: 9999
      });
      overlay.setMap(mapRef.current);
      secretMarkersRef.current.push(overlay);
    });
  }, [mapLoaded, showSecretPoints, effectiveSecretPoints]);


  /* ── 수온 및 조황 히트맵 렌더링 (Premium Feature) ── */
  // ✅ 5TH-B2: heatmapData useMemo 캐싱 — showHeatmap/heatmapMode 변경 시 60+ 재계산 방지
  // ✅ FIX-TDZ: useEffect deps에 heatmapData 포함되므로 useEffect보다 먼저 선언 필수
  const heatmapData = useMemo(() =>
    ALL_FISHING_POINTS.map(point => {
      const weatherData = getPointSpecificData(point);
      const sst = parseFloat(weatherData?.sst || 13);
      const condition = evaluateFishingCondition(weatherData, point);
      return { point, sst, score: condition.score };
    })
  , []); // 포인트 데이터는 앱 생명주기 내 불변

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    // 기존 히트맵 제거
    heatmapRef.current.forEach(item => {
      if (item?.setMap) item.setMap(null);
    });
    heatmapRef.current = [];

    if (!showHeatmap) return;

    const getSstColor = (sst) => {
      if (sst < 8)  return { fill: '#1a3c8f', text: '❄️ 극저',  opacity: 0.75 };
      if (sst < 10) return { fill: '#1565C0', text: '🥶 저수온', opacity: 0.70 };
      if (sst < 12) return { fill: '#29B6F6', text: '🌊 차가움', opacity: 0.65 };
      if (sst < 14) return { fill: '#26C6DA', text: '💧 서늘',   opacity: 0.60 };
      if (sst < 16) return { fill: '#66BB6A', text: '✅ 보통',   opacity: 0.60 };
      if (sst < 18) return { fill: '#FFCA28', text: '🎣 양호',   opacity: 0.65 };
      if (sst < 21) return { fill: '#FFA726', text: '🔥 적정',   opacity: 0.70 };
      if (sst < 24) return { fill: '#FF7043', text: '♨️ 고수온', opacity: 0.70 };
      return              { fill: '#B71C1C', text: '🌡 고수온!', opacity: 0.75 };
    };

    const getScoreColor = (score) => {
      if (score >= 90) return { fill: '#00E5A8', text: '🌟 황금물때', opacity: 0.85 };
      if (score >= 75) return { fill: '#42A5F5', text: '🎣 최고조황', opacity: 0.75 };
      if (score >= 50) return { fill: '#FFCA28', text: '👌 보통이상', opacity: 0.65 };
      if (score >= 30) return { fill: '#FF7043', text: '⚠️ 추천안함', opacity: 0.65 };
      return           { fill: '#D32F2F', text: '🛑 출조위험', opacity: 0.8 };
    };

    const getRadiusSst = (sst) => {
      if (sst >= 16 && sst < 21) return 5500;
      if (sst >= 14 && sst < 23) return 4000;
      return 2800;
    };

    const getRadiusScore = (score) => {
      if (score >= 90) return 6000;
      if (score >= 75) return 4500;
      if (score >= 50) return 3000;
      return 2000;
    };

    // ✅ 5TH-B2: heatmapData useMemo 사용 — getPointSpecificData 60+ 포인트 매 재계산 제거
    heatmapData.forEach(({ point, sst, score }) => {
      if (!window.kakao?.maps) return;

      const { fill, text, opacity } = heatmapMode === 'sst' ? getSstColor(sst) : getScoreColor(score);
      const baseRadius = heatmapMode === 'sst' ? getRadiusSst(sst) : getRadiusScore(score);

      const center = new window.kakao.maps.LatLng(point.lat, point.lng);
      const layers = [
        { r: baseRadius,        op: opacity * 0.15 },
        { r: baseRadius * 0.65, op: opacity * 0.35 },
        { r: baseRadius * 0.3,  op: opacity * 0.7 }
      ];
      layers.forEach(layer => {
        const circle = new window.kakao.maps.Circle({
          center, radius: layer.r, strokeWeight: 0,
          fillColor: fill, fillOpacity: layer.op,
        });
        circle.setMap(mapRef.current);
        heatmapRef.current.push(circle);
      });

      const mainFish = (point.fish || '').split(',')[0].trim();
      const mainValue = heatmapMode === 'sst' ? `${sst.toFixed(1)}°C` : `${score}점`;
      const content = [
        '<div style="',
          'background:rgba(0,0,0,0.85);color:#fff;',
          'padding:5px 10px;border-radius:12px;',
          'font-size:11px;font-weight:900;white-space:nowrap;line-height:1.4;',
          'border:1.5px solid ', fill, ';pointer-events:none;',
          'box-shadow: 0 4px 12px ', fill, '40;transform: translateY(-8px);">',
          '<div style="display:flex;align-items:center;gap:4px;">',
            '<span style="color:', fill, ';font-size:14px">', mainValue, '</span>',
            '<span style="font-size:10px;color:#eee">', text, '</span>',
          '</div>',
          '<div style="color:#aaa;font-size:9.5px;margin-top:2px;">', mainFish || point.name.slice(0,5), ' 포인트</div>',
        '</div>',
      ].join('');
      const overlay = new window.kakao.maps.CustomOverlay({ position: center, content, yAnchor: 2.2, zIndex: 3 });
      overlay.setMap(mapRef.current);
      heatmapRef.current.push(overlay);
    });
  }, [showHeatmap, heatmapMode, mapLoaded, heatmapData]);


  /* ── 맵 리사이즈 (selectedPoint 변경 시 panTo) ── */
  useEffect(() => {
    if (viewMode === 'map' && mapRef.current && selectedPoint) {
      const timer = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.panTo(new window.kakao.maps.LatLng(selectedPoint.lat, selectedPoint.lng));
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedPoint]);

  /* ── 커뮤니티 최신글 ── */
  // ENH6-B1: fetch_ 비표준명 → fetchRecentPosts 리팩토링
  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const res  = await apiClient.get('/api/community/posts?limit=3&page=1');
        const arr = Array.isArray(res.data) ? res.data : (res.data.posts || []);
        setRecentPosts(arr.slice(0, 3));
      } catch { /* 서버 미응답 시 빈 상태 유지 */ }
    };
    fetchRecentPosts();
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

  /* ── 낚시점수 원 색상 계산 ── */
  const getScoreCircleStyle = (s) => {
    if (s >= 90) return { bg: 'rgba(0,196,140,0.18)', border: 'rgba(0,196,140,0.7)', glow: '0 0 18px rgba(0,196,140,0.5)', numColor: '#00E5A8', label: 'PERFECT' };
    if (s >= 75) return { bg: 'rgba(21,101,192,0.18)', border: 'rgba(100,181,246,0.7)', glow: '0 0 18px rgba(21,101,192,0.4)', numColor: '#64B5F6', label: 'GOOD' };
    if (s >= 50) return { bg: 'rgba(255,155,38,0.18)', border: 'rgba(255,155,38,0.7)', glow: '0 0 14px rgba(255,155,38,0.4)', numColor: '#FFB74D', label: 'NORMAL' };
    if (s >= 30) return { bg: 'rgba(255,90,95,0.22)', border: 'rgba(255,90,95,0.8)', glow: '0 0 16px rgba(255,90,95,0.5)', numColor: '#FF7070', label: 'POOR' };
    return { bg: 'rgba(211,47,47,0.28)', border: 'rgba(211,47,47,0.9)', glow: '0 0 20px rgba(211,47,47,0.6)', numColor: '#FF4444', label: 'DANGER' };
  };
  const scoreStyle = getScoreCircleStyle(score);

  /* ── advice 줄바꿈 분리 ── */
  const adviceParts = cond.advice.split(/\[특보\]/);
  const mainAdvice  = adviceParts[0].trim();
  const alertAdvice = adviceParts[1]?.trim() || null;

  /* ── 동적 미끼 팁 ── */
  const getBaitTip = () => {
    const now      = new Date();
    const hour     = now.getHours();
    const month    = now.getMonth() + 1; // 1~12
    const isNight  = hour < 6 || hour >= 19;
    const wind     = parseFloat(tideData.wind?.speed ?? 0);
    const wave     = parseFloat(tideData.wave?.coastal ?? 0);
    const sst      = parseFloat(tideData.sst ?? 14);
    const isStrong = wind > 5 || wave > 0.7;
    const isCold   = sst < 12;
    const isWarm   = sst >= 18;
    const fish     = (selectedPoint?.fish || '').split(',')[0].trim() || '';

    // 야간
    if (isNight) return { icon: '🌙', text: '야간엔 야광 지렁이·형광 루어가 최고! 수면 가까이 띄워 공략하세요.' };
    // 풍랑 강함
    if (isStrong) return { icon: '🌊', text: `파고 ${wave}m · 풍속 ${wind}m/s — 무거운 봉돌로 고정하고 크릴 밀봉 채비가 유리합니다.` };
    // 조황 점수 위기
    if (score < 40) return { icon: '⚠️', text: '활성도가 낮아요. 갯지렁이 + 크릴 혼합 미끼로 냄새를 강하게 유인하세요.' };
    // 황금물때
    if (score >= 90) return { icon: '🌟', text: '황금물때! 루어·지렁이 모두 효과 MAX. 참돔엔 핑크색 타이라바가 대박입니다.' };
    // 어종별 팁
    if (fish.includes('감성돔'))  return { icon: '🎣', text: '감성돔은 크릴+파래 혼합 미끼! 조류 방향 맞춰 흘림낚시가 효과적.' };
    if (fish.includes('참돔'))    return { icon: '🔴', text: '참돔 시즌 — 타이라바(핑크/오렌지) 80~120g으로 중층 탐색 추천.' };
    if (fish.includes('루어') || fish.includes('부시리') || fish.includes('방어'))
      return { icon: '⚡', text: '회유어종 활성! 메탈지그 빠른 저킹 → 멈춤 콤보로 반사 입질 노리세요.' };
    if (fish.includes('오징어') || fish.includes('한치'))
      return { icon: '🦑', text: '오징어엔 에기(3.5호) 핑크/보라 계열! 착저 후 천천히 올리는 리프트&폴 액션.' };
    if (fish.includes('우럭') || fish.includes('볼락'))
      return { icon: '🐟', text: '저층 공략! 지렁이·새우 미끼로 바닥 천천히 끌어주세요. 갈색 루어도 효과적.' };
    // 수온별
    if (isCold)  return { icon: '❄️', text: `수온 ${sst.toFixed(1)}°C 저수온 — 활성 낮음. 크릴을 천천히 흘려 냄새로 유인하세요.` };
    if (isWarm)  return { icon: '♨️', text: `수온 ${sst.toFixed(1)}°C 고수온 — 표층 가까이에 물고기 밀집. 탑워터 루어 효과 UP!` };
    // 계절
    if (month >= 3 && month <= 5)  return { icon: '🌸', text: '봄 시즌 — 산란 직전 감성돔 활성 최고조! 갯지렁이+집어제 조합 추천.' };
    if (month >= 6 && month <= 8)  return { icon: '☀️', text: '여름 — 새벽 골든타임! 표층 포퍼·페더지그로 부시리·방어 공략.' };
    if (month >= 9 && month <= 11) return { icon: '🍂', text: '가을 대물 시즌 — 크릴+밑밥 집중 투척. 참돔·방어 대형급 기대!' };
    return { icon: '🎣', text: '크릴+지렁이 혼합 미끼로 다양한 어종을 공략해보세요!' };
  };
  const baitTip = getBaitTip();

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
                    if (!canAccessPremium) {
                      addToast('프리미엄 스마트 히트맵은 LITE 플랜 이상에서 제공됩니다.', 'error');
                      return;
                    }
                    setShowHeatmap(!showHeatmap);
                    if (!showHeatmap) addToast('📡 실시간 해양 히트맵 분석을 완료했습니다.', 'success');
                  }} 
                  style={{
                    padding: '5px 12px', borderRadius: '20px', border: '1.5px solid #FF3B30', cursor: 'pointer',
                    fontSize: '11px', fontWeight: '900', flexShrink: 0,
                    background: showHeatmap ? '#FF3B30' : '#fff',
                    color: showHeatmap ? '#fff' : '#FF3B30',
                    transition: 'all 0.2s',
                  }}>
                  {showHeatmap ? '🔥 히트맵 끄기' : `🔥 스마트 히트맵 (${isAdmin ? 'MASTER' : 'LITE+'})`}
                </button>
                {showHeatmap && (
                  <button 
                    onClick={() => {
                      const mode = heatmapMode === 'sst' ? 'score' : 'sst';
                      setHeatmapMode(mode);
                      addToast(mode === 'sst' ? '🌡️ 표층 수온 모드로 변경되었습니다.' : '🎣 실시간 조황 점수 모드로 변경되었습니다.', 'success');
                    }}
                    style={{
                      padding: '5px 12px', borderRadius: '20px', border: '1.5px solid #0056D2', cursor: 'pointer',
                      fontSize: '11px', fontWeight: '900', flexShrink: 0,
                      background: '#0056D2', color: '#fff',
                      transition: 'all 0.2s',
                    }}>
                    {heatmapMode === 'sst' ? '🎣 조황 점수별 보기' : '🌡️ 표층 수온별 보기'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Anchor size={22} color="#1565C0" strokeWidth={2.5} />
                <span style={{ fontSize: '19px', fontWeight: '950', color: '#0056D2', letterSpacing: '-0.04em' }}>낚시GO</span>
                {currentTier.label && (
                  <span style={{ background: currentTier.bg, fontSize: '8px', padding: '2px 7px', borderRadius: '20px', color: currentTier.color || '#fff', fontWeight: '900', marginLeft: '2px' }}>
                    {currentTier.label}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                {/* ✅ 26TH-B2: currentTime 미정의 참조 → new Date() 직접 사용 (5TH-A5: LiveClock이 없는 헤더에서 정적 표시) */}
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#1565C0', letterSpacing: '-0.02em', marginRight: '-6px' }}>
                  {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
                <div style={{ position: 'relative', cursor: 'pointer' }}>
                  <Bell size={20} color="#333" strokeWidth={2} />
                  <span style={{ position: 'absolute', top: '-1px', right: '-1px', width: '6px', height: '6px', background: '#FF3B30', borderRadius: '50%', border: '1.5px solid #fff' }} />
                </div>
                <div
                  onClick={() => navigate('/mypage')}
                  style={{ position: 'relative', cursor: 'pointer' }}
                >
                  <img
                    src={user?.avatar || user?.picture || DEFAULT_AVATAR_SVG}
                    alt="profile"
                    style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid #E8F0FE', objectFit: 'cover', transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                  <span style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', background: '#00C48C', borderRadius: '50%', border: '1.5px solid #fff' }} />
                </div>
              </div>
            </>
          )}
        </div>{/* 헤더 끝 */}

        {/* ── 지도 풀스크린 뷰 ── */}
        <div style={{ display: viewMode === 'map' ? 'flex' : 'none', flex: 1, flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div id="kakao-map" style={{ width: '100%', flex: 1, minHeight: '200px', background: '#e8edf5' }} />
            
            {/* 수온/조황 범례 (Legend) 고도화 */}
            {showHeatmap && (
              <div style={{
                position: 'absolute', bottom: '16px', left: '12px', zIndex: 10,
                background: 'rgba(255, 255, 255, 0.95)', border: '1.5px solid rgba(0,0,0,0.08)',
                borderRadius: '16px', padding: '12px 14px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                backdropFilter: 'blur(10px)', width: '220px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: '900', color: '#1A1A2E' }}>
                    {heatmapMode === 'sst' ? '🌡 표층 수온(SST) 범례' : '🎣 AI 낚시지도 조황 점수'}
                  </span>
                  <span style={{ fontSize: '9px', fontWeight: '800', background: isAdmin ? '#E60000' : '#FF3B30', color: '#fff', padding: '2px 6px', borderRadius: '8px' }}>PRO</span>
                </div>
                {heatmapMode === 'sst' ? (
                  <>
                    <div style={{ display: 'flex', width: '100%', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
                      <div style={{ flex: 1, background: '#1a3c8f' }} /><div style={{ flex: 1, background: '#1565C0' }} /><div style={{ flex: 1, background: '#29B6F6' }} />
                      <div style={{ flex: 1, background: '#26C6DA' }} /><div style={{ flex: 1, background: '#66BB6A' }} /><div style={{ flex: 1, background: '#FFCA28' }} />
                      <div style={{ flex: 1, background: '#FFA726' }} /><div style={{ flex: 1, background: '#FF7043' }} /><div style={{ flex: 1, background: '#B71C1C' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: '700', color: '#8E8E93' }}>
                      <span>&lt;8°C</span><span>(어종별 적정수온)</span><span>24°C&gt;</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: '800', color: '#555', marginTop: '2px' }}>
                      <span style={{ color: '#1565C0' }}>저수온</span>
                      <span style={{ color: '#FFA726' }}>🔥 최적 활성도</span>
                      <span style={{ color: '#B71C1C' }}>고수온</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', width: '100%', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
                      <div style={{ flex: 1, background: '#D32F2F' }} />
                      <div style={{ flex: 1, background: '#FF7043' }} />
                      <div style={{ flex: 1, background: '#FFCA28' }} />
                      <div style={{ flex: 1, background: '#42A5F5' }} />
                      <div style={{ flex: 1, background: '#00E5A8' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: '700', color: '#8E8E93' }}>
                      <span>0점</span><span>종합 낚시 점수</span><span>100점</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: '800', color: '#555', marginTop: '2px' }}>
                      <span style={{ color: '#D32F2F' }}>출조 보류</span>
                      <span style={{ color: '#FFCA28' }}>👌 무난함</span>
                      <span style={{ color: '#00E5A8' }}>✨ 황금물때</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {!mapLoaded && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F4F6FA', gap: '12px', zIndex: 10 }}>
                {mapLoadError ? (
                  <>
                    <div style={{ fontSize: '40px' }}>🗺️</div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#1A1A2E' }}>카카오맵 API 키 필요</div>
                    <div style={{ fontSize: '12px', color: '#888', fontWeight: '700', textAlign: 'center', lineHeight: 1.7, padding: '0 32px' }}>
                      .env.local 파일에 카카오 JavaScript 키를 입력하세요.<br />
                      <code style={{ background: '#F0F0F0', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', color: '#0056D2' }}>VITE_KAKAO_APP_KEY=여기에_키_입력</code>
                    </div>
                    <button
                      onClick={() => { window.open('https://developers.kakao.com', '_blank'); }}
                      style={{ marginTop: '8px', padding: '10px 22px', background: '#FAE100', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', color: '#1A1A2E' }}
                    >
                      카카오 개발자 콘솔 →
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #1565C0', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ fontSize: '13px', color: '#8E8E93', fontWeight: '700' }}>지도 로딩 중…</span>
                  </>
                )}
              </div>
            )}
          </div>

        {/* ── 대시보드 뷰 ── */}
        <div style={{ display: viewMode === 'dashboard' ? 'flex' : 'none', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>

          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '90px', scrollbarWidth: 'none' }}>

            {/* 검색바 + 드롭다운 (최상단 이동) */}
            <div style={{ padding: '16px 16px 0', position: 'relative', zIndex: 50 }} ref={searchRef}>
              <div style={{ height: '48px', backgroundColor: '#fff', borderRadius: '14px', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px', border: '1.5px solid #EBF2FF', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <Search size={16} color="#1565C0" strokeWidth={3} />
                <input
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQuery && setShowSearch(true)}
                  placeholder="포인트, 어종, 지역 검색하여 현재 화면에 반영"
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
                  position: 'absolute', top: '100%', left: '16px', right: '16px', background: '#fff',
                  borderRadius: '14px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #F0F2F7',
                  zIndex: 100, maxHeight: '280px', overflowY: 'auto', marginTop: '6px'
                }}>
                  {searchResults.map((p, i) => (
                    <div key={p.id}
                      onClick={() => {
                        handlePointClick(p, true); // Dashboard view 갱신
                        setShowSearch(false); setSearchQuery(''); setSearchResults([]);
                      }}
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
                      <div style={{ background: STATUS_COLOR[p.status] || '#8E8E93', borderRadius: '6px', padding: '3px 8px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '900', color: '#fff' }}>{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {showSearch && searchResults.length === 0 && searchQuery && (
                <div style={{ position: 'absolute', top: '100%', left: '16px', right: '16px', background: '#fff', borderRadius: '14px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #F0F2F7', zIndex: 100, padding: '20px', textAlign: 'center', marginTop: '6px' }}>
                  <AlertCircle size={24} color="#AAB0BE" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '13px', color: '#8E8E93', fontWeight: '800' }}>검색 결과가 없어요</div>
                </div>
              )}
            </div>

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '38px', fontWeight: '950', color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      {tideData.temp ? (typeof tideData.temp === 'string' ? tideData.temp.replace('°C', '') : tideData.temp) + '°' : '15.2°'}
                    </div>
                    {/* 조언 텍스트 */}
                    <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.85)', fontWeight: '700', marginTop: '6px', lineHeight: 1.5 }}>
                      {mainAdvice}
                    </div>
                    {/* 특보 */}
                    {alertAdvice && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'flex-start', gap: '5px',
                        marginTop: '6px', background: 'rgba(255,80,80,0.22)',
                        border: '1px solid rgba(255,80,80,0.5)', borderRadius: '8px',
                        padding: '5px 9px', lineHeight: 1.45,
                      }}>
                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#FF8080', flexShrink: 0, paddingTop: '1px' }}>⚠ 특보</span>
                        <span style={{ fontSize: '10px', color: 'rgba(255,200,200,0.95)', fontWeight: '700' }}>{alertAdvice}</span>
                      </div>
                    )}
                  </div>

                  {/* 낚시점수 원 */}
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
                    background: scoreStyle.bg,
                    border: `2px solid ${scoreStyle.border}`,
                    boxShadow: scoreStyle.glow,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(10px)', position: 'relative',
                  }}>
                    {/* 외곽 링 (점수 진행도 시각화) */}
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 72 72">
                      <circle cx="36" cy="36" r="32" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
                      <circle cx="36" cy="36" r="32" fill="none" stroke={scoreStyle.border}
                        strokeWidth="3" strokeLinecap="round"
                        strokeDasharray={`${(score / 100) * 201} 201`}
                        style={{ transition: 'stroke-dasharray 0.6s ease' }}
                      />
                    </svg>
                    <div style={{ fontSize: '22px', fontWeight: '950', color: scoreStyle.numColor, lineHeight: 1, position: 'relative' }}>{score}</div>
                    <div style={{ fontSize: '7.5px', fontWeight: '800', color: 'rgba(255,255,255,0.55)', marginTop: '2px', position: 'relative' }}>낚시점수</div>
                    <div style={{ fontSize: '6.5px', fontWeight: '900', color: scoreStyle.numColor, opacity: 0.9, position: 'relative', marginTop: '1px', letterSpacing: '0.02em' }}>{scoreStyle.label}</div>
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
                      if (!canAccessPremium) {
                        addToast('📺 실시간 해양 CCTV는 LITE 플랜 이상에서 제공됩니다.', 'error');
                        return; // 페이지 이동 없음 — 홈화면 유지
                      }
                      const sid = selectedPoint?.obsCode || 'DT_0001';
                      try {
                        const res = await apiClient.get(`/api/weather/cctv?stationId=${sid}`);
                        setCctvData(res.data);
                        setShowCCTV(true);
                      } catch {
                        addToast('영상 데이터를 불러오는 데 실패했습니다.', 'error');
                      }
                    }}
                    style={{ marginLeft: 'auto', background: canAccessPremium ? 'rgba(255,215,0,0.9)' : 'rgba(255,255,255,0.15)', border: canAccessPremium ? 'none' : '1px solid rgba(255,255,255,0.2)', borderRadius: '30px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                  >
                    <Tv size={12} color="#1A1A2E" />
                    <span style={{ fontSize: '10px', fontWeight: '900', color: '#1A1A2E' }}>실시간 영상</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── AI 낚시 적합도 게이지 카드 ── */}
            <div style={{ padding: '12px 16px 0' }}>
              <div style={{
                background: '#fff', borderRadius: '20px', padding: '16px 18px',
                border: '1.5px solid #F0F2F7', boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '15px' }}>🎯</span>
                    <span style={{ fontSize: '13px', fontWeight: '900', color: '#1A1A2E' }}>AI 낚시 적합도</span>
                  </div>
                  <div style={{
                    background: score >= 90 ? 'linear-gradient(135deg, #00C48C, #00897B)' : score >= 75 ? 'linear-gradient(135deg, #1565C0, #1E88E5)' : score >= 50 ? 'linear-gradient(135deg, #FF9B26, #F57F17)' : 'linear-gradient(135deg, #FF5A5F, #D32F2F)',
                    borderRadius: '20px', padding: '4px 12px',
                  }}>
                    <span style={{ fontSize: '10px', fontWeight: '900', color: '#fff' }}>
                      {score >= 90 ? '🔥 피딩 중!' : score >= 75 ? '✅ 출조 추천' : score >= 50 ? '🙂 보통' : '⚠ 재고 필요'}
                    </span>
                  </div>
                </div>

                {/* 게이지 바 */}
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <div style={{ height: '10px', background: '#F0F2F7', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${score}%`,
                      background: score >= 90 ? 'linear-gradient(90deg, #00C48C, #00E5A8)' : score >= 75 ? 'linear-gradient(90deg, #1565C0, #42A5F5)' : score >= 50 ? 'linear-gradient(90deg, #FF9B26, #FFD54F)' : 'linear-gradient(90deg, #FF5A5F, #FF8A80)',
                      borderRadius: '6px',
                      transition: 'width 1s cubic-bezier(0.25, 1, 0.5, 1)',
                      boxShadow: score >= 90 ? '0 0 8px rgba(0,196,140,0.6)' : 'none',
                    }} className={score >= 90 ? 'gauge-pulse' : ''} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                    <span style={{ fontSize: '9px', color: '#C7C7CC', fontWeight: '700' }}>0</span>
                    <span style={{ fontSize: '12px', fontWeight: '950', color: score >= 90 ? '#00C48C' : score >= 75 ? '#1565C0' : score >= 50 ? '#FF9B26' : '#FF5A5F' }}>{score}점</span>
                    <span style={{ fontSize: '9px', color: '#C7C7CC', fontWeight: '700' }}>100</span>
                  </div>
                </div>

                {/* 세부 지표 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '4px' }}>
                  {[
                    { label: '수온', val: `${parseFloat(tideData.sst || 14).toFixed(1)}°C`, ok: parseFloat(tideData.sst || 14) >= 12 && parseFloat(tideData.sst || 14) <= 22 },
                    { label: '파고', val: `${tideData.wave?.coastal || '0.4'}m`, ok: parseFloat(tideData.wave?.coastal || 0.4) <= 1.0 },
                    { label: '풍속', val: `${tideData.wind?.speed || '2.1'}m/s`, ok: parseFloat(tideData.wind?.speed || 2.1) <= 5 },
                    { label: '물때', val: phase.slice(0, 3), ok: !phase.includes('사리') },
                  ].map(item => (
                    <div key={item.label} style={{
                      background: item.ok ? 'rgba(0,196,140,0.08)' : 'rgba(255,90,95,0.08)',
                      border: `1px solid ${item.ok ? 'rgba(0,196,140,0.25)' : 'rgba(255,90,95,0.25)'}`,
                      borderRadius: '10px', padding: '7px 4px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '9px', color: '#8E8E93', fontWeight: '700' }}>{item.label}</div>
                      <div style={{ fontSize: '11px', fontWeight: '950', color: item.ok ? '#00C48C' : '#FF5A5F', marginTop: '2px' }}>{item.val}</div>
                      <div style={{ fontSize: '8px', color: item.ok ? '#00C48C' : '#FF5A5F', fontWeight: '800' }}>{item.ok ? '✓ 양호' : '✗ 주의'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

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
                        addToast('🔒 LITE 플랜 이상에서 비밀 포인트를 확인할 수 있어요!', 'error');
                        return;
                      }
                      setViewMode('map');
                      setShowSecretPoints(true);
                      addToast('⭐ 비밀 포인트 25곳이 지도에 표시됩니다!', 'success');
                    },
                    customIcon: (
                      <div style={{ position: 'relative', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{
                          fontSize: '22px',
                          filter: canAccessPremium
                            ? 'drop-shadow(0 0 6px rgba(255,200,0,0.9)) drop-shadow(0 0 2px rgba(255,160,0,0.6))'
                            : 'grayscale(1) opacity(0.5)',
                          animation: canAccessPremium ? 'secretPulse 2s ease-in-out infinite' : 'none',
                        }}>⭐</span>
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
                    <div style={{
                      width: '100%', aspectRatio: '1/1', backgroundColor: '#fff',
                      borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '5px',
                      boxShadow: (!m.locked && m.label === '비밀포인트')
                        ? '0 3px 14px rgba(255,200,0,0.25)'
                        : '0 2px 8px rgba(0,0,0,0.05)',
                      border: (!m.locked && m.label === '비밀포인트')
                        ? '1.5px solid rgba(255,215,0,0.45)'
                        : '1px solid #F0F2F7',
                      transition: 'transform 0.15s',
                    }}
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
                    <span style={{
                      fontSize: '9px', fontWeight: '800',
                      color: (!m.locked && m.label === '비밀포인트') ? '#B8860B' : '#555',
                    }}>{m.label}</span>
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
                {(() => {
                  // 실시간 피딩 타임 동적 계산
                  const now = new Date();
                  const nowMin = now.getHours() * 60 + now.getMinutes();

                  // 물때 만조/간조 시각 파싱 (HH:MM)
                  const parseTime = (str) => {
                    if (!str) return null;
                    const [h, m] = String(str).split(':').map(Number);
                    return isNaN(h) ? null : h * 60 + (m || 0);
                  };

                  const highMin = parseTime(tideData.tide?.high);
                  const lowMin  = parseTime(tideData.tide?.low);

                  // 피딩 타임: 간조, 만조(황금), 다음 물때로 정확히 분류 후 시간순 정렬
                  const goldenMin = highMin ?? 870;          // 만조 시각 (황금)
                  const lowMinVal = lowMin ?? 360;           // 간조 시각
                  const nextLowMin = (lowMinVal + 720) % 1440; // 다음 간조 시각

                  const fmt = (m) => {
                    const hh = Math.floor(((m % 1440) + 1440) % 1440 / 60);
                    const mm = ((m % 1440) + 1440) % 1440 % 60;
                    return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
                  };

                  // 현재 시각이 피딩 윈도우 안에 있으면 active
                  const isInWindow = (centerMin, windowMin = 40) =>
                    Math.abs(nowMin - centerMin) <= windowMin ||
                    Math.abs(nowMin - centerMin + 1440) <= windowMin ||
                    Math.abs(nowMin - centerMin - 1440) <= windowMin;

                  const slots = [
                    { label: '간조 물때', time: fmt(lowMinVal),    active: isInWindow(lowMinVal, 35), val: lowMinVal },
                    { label: '만조 (황금)✨', time: fmt(goldenMin), active: isInWindow(goldenMin, 40), val: goldenMin },
                    { label: '다음 물때', time: fmt(nextLowMin),   active: isInWindow(nextLowMin, 35), val: nextLowMin },
                  ];

                  // 시간 순으로 정렬하여 표시 오류 해결 (새벽이 18시에 나오는 현상 방지)
                  slots.sort((a, b) => a.val - b.val);

                  // 아무것도 active가 아니면 가장 가까운 미래 슬롯을 active (다음) 표시
                  const hasActive = slots.some(s => s.active);
                  if (!hasActive) {
                    const diffs = slots.map((s, i) => {
                      const diff = ((s.val - nowMin) + 1440) % 1440;
                      return { i, diff };
                    });
                    diffs.sort((a, b) => a.diff - b.diff);
                    slots[diffs[0].i].next = true;
                  }

                  return (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {slots.map((ft, i) => (
                        <div key={i} style={{
                          flex: 1, padding: '8px 2px', borderRadius: '12px', textAlign: 'center',
                          background: ft.active
                            ? 'linear-gradient(135deg, #FFD700, #FFA000)'
                            : ft.next
                              ? 'linear-gradient(135deg, #E8F4FF, #D0E8FF)'
                              : '#F8F9FC',
                          border: ft.active ? 'none' : ft.next ? '1px solid #90CAF9' : '1px solid #F0F2F7',
                        }}>
                          <div style={{ fontSize: '8px', fontWeight: '900', color: ft.active ? '#5C3A00' : ft.next ? '#1565C0' : '#AAB0BE', marginBottom: '2px' }}>
                            {ft.label}{ft.next ? ' (다음)' : ''}
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: '950', color: ft.active ? '#1A1A00' : ft.next ? '#1565C0' : '#8E8E93' }}>
                            {ft.time}
                          </div>
                          {ft.active && <div style={{ fontSize: '7px', color: '#5C3A00', fontWeight: '900', marginTop: '1px' }}>🔥 지금!</div>}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* 프리미엄 멤버십 구독 */}
            <div style={{ padding: '8px 16px 12px' }}>
              {canAccessPremium ? (
                /* ── 유료 회원: 현재 플랜 상태 카드 ── */
                <div style={{
                  position: 'relative', overflow: 'hidden',
                  background: 'linear-gradient(135deg, #111218 0%, #1E1F2E 100%)',
                  borderRadius: '20px', padding: '18px 20px',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,215,0,0.2)',
                }}>
                  <div style={{ position: 'absolute', top: '-40%', right: '-10%', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)', backgroundSize: '200% 100%', animation: 'shimmer 3s infinite linear', pointerEvents: 'none' }} />
                  <div style={{ position: 'relative', width: '46px', height: '46px', background: 'linear-gradient(135deg, #FFD700, #FFA000)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 6px 20px rgba(255,215,0,0.3)' }}>
                    <Crown size={24} color="#5C3A00" fill="#5C3A00" />
                    <div style={{ position: 'absolute', top: '-3px', right: '-3px', width: '12px', height: '12px', background: '#00C48C', borderRadius: '50%', border: '2px solid #1E1F2E', animation: 'pulse 2s infinite' }} />
                  </div>
                  <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '950', color: '#fff' }}>{currentTier.label || 'LITE'} 구독 중</span>
                      <span style={{ background: '#00C48C', fontSize: '8px', padding: '2px 6px', borderRadius: '10px', color: '#fff', fontWeight: '900' }}>활성</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', fontWeight: '600' }}>비밀 포인트 25곳 · 히트맵 · CCTV 이용 가능</div>
                  </div>
                  <div onClick={() => { setViewMode('map'); setShowSecretPoints(true); addToast('⭐ 비밀 포인트 25곳이 지도에 표시됩니다!', 'success'); }}
                    style={{ position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.1)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '30px', padding: '8px 12px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', backdropFilter: 'blur(5px)', whiteSpace: 'nowrap' }}>
                    비밀포인트 보기 ›
                  </div>
                </div>
              ) : (
                /* ── 무료 회원: 멤버십 구독 카드 ── */
                <div style={{ background: 'linear-gradient(135deg, #0D0D1A 0%, #1A1A2E 100%)', borderRadius: '22px', padding: '20px 18px', border: '1px solid rgba(255,215,0,0.18)', boxShadow: '0 14px 40px rgba(0,0,0,0.25)', position: 'relative', overflow: 'hidden' }}>
                  {/* 배경 글로우 */}
                  <div style={{ position: 'absolute', top: '-30%', right: '-15%', width: '140px', height: '140px', background: 'radial-gradient(circle, rgba(255,215,0,0.12) 0%, transparent 70%)', filter: 'blur(25px)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', bottom: '-40%', left: '-10%', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(0,196,140,0.1) 0%, transparent 70%)', filter: 'blur(18px)', pointerEvents: 'none' }} />

                  {/* 헤더 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #FFD700, #FFA000)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(255,215,0,0.35)', flexShrink: 0 }}>
                      <Crown size={20} color="#5C3A00" fill="#5C3A00" />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '950', color: '#fff', letterSpacing: '-0.02em' }}>프리미엄 멤버십</div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,215,0,0.7)', fontWeight: '700' }}>비밀 포인트 25곳 + 프리미엄 기능 전체 이용</div>
                    </div>
                  </div>

                  {/* 플랜 카드 3종 */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', position: 'relative', zIndex: 1 }}>
                    {[
                      { name: 'LITE', price: '₩9,900', period: '/월', color: '#A0A0A0', bg: 'rgba(160,160,160,0.1)', border: 'rgba(160,160,160,0.25)', features: ['비밀포인트 25곳', '히트맵 이용', 'CCTV 이용'], badge: null },
                      { name: 'PRO', price: '₩110,000', period: '/월', color: '#64B5F6', bg: 'rgba(21,101,192,0.15)', border: 'rgba(100,181,246,0.35)', features: ['LITE 전체 포함', '선상 홍보 게시', '우선 노출'], badge: '인기', hot: true },
                      { name: 'VVIP', price: '₩550,000', period: '/월', color: '#FFD700', bg: 'rgba(255,215,0,0.1)', border: 'rgba(255,215,0,0.35)', features: ['PRO 전체 포함', '항구 독점 선점', '전용 뱃지'], badge: '독점' },
                    ].map(plan => (
                      <div key={plan.name} onClick={() => navigate('/vvip-subscribe')} style={{ flex: 1, background: plan.bg, border: `1.5px solid ${plan.border}`, borderRadius: '14px', padding: '12px 8px', textAlign: 'center', cursor: 'pointer', position: 'relative', transition: 'transform 0.15s' }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {plan.badge && (
                          <div style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', background: plan.hot ? '#1565C0' : 'linear-gradient(135deg,#FFD700,#FFA000)', color: plan.hot ? '#fff' : '#5C3A00', fontSize: '8px', fontWeight: '900', padding: '2px 8px', borderRadius: '10px', whiteSpace: 'nowrap' }}>{plan.badge}</div>
                        )}
                        <div style={{ fontSize: '11px', fontWeight: '900', color: plan.color, marginBottom: '4px' }}>{plan.name}</div>
                        <div style={{ fontSize: '13px', fontWeight: '950', color: '#fff', lineHeight: 1 }}>{plan.price}</div>
                        <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px' }}>{plan.period}</div>
                        {plan.features.map((f, i) => (
                          <div key={i} style={{ fontSize: '8px', color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginTop: '2px' }}>✓ {f}</div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* 구독 CTA 버튼 */}
                  <button onClick={() => navigate('/vvip-subscribe')} style={{ position: 'relative', zIndex: 1, width: '100%', padding: '13px', background: 'linear-gradient(135deg, #FFD700, #FFA000)', border: 'none', borderRadius: '14px', fontSize: '13px', fontWeight: '950', color: '#1A1A2E', cursor: 'pointer', boxShadow: '0 6px 20px rgba(255,215,0,0.3)', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Crown size={15} color="#5C3A00" fill="#5C3A00" />
                    멤버십 구독하기
                    <span style={{ fontSize: '12px' }}>›</span>
                  </button>
                </div>
              )}
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



            {/* 조황 보고 */}
            <div style={{ padding: '10px 16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '950', color: '#1A1A2E', marginBottom: '10px' }}>방금 올라온 조황</h3>
              {recentPosts.length > 0 ? recentPosts.map(post => (
                <div
                  key={post._id || post.id}
                  onClick={() => navigate(`/community?tab=open&postId=${post._id || post.id}`)}
                  style={{
                    background: '#fff', borderRadius: '12px', padding: '10px 12px', marginBottom: '8px',
                    display: 'flex', gap: '10px', alignItems: 'center', border: '1px solid #F0F2F7',
                    cursor: 'pointer', transition: 'all 0.18s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,86,210,0.13)'; e.currentTarget.style.borderColor = '#C8D8F5'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#F0F2F7'; }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #0056D2, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '18px' }}>
                    🎣
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '12px', fontWeight: '900', color: '#1A1A2E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(post.content || '').slice(0, 80)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span style={{ fontSize: '10px', color: '#AAB0BE', fontWeight: '700' }}>@{post.author}</span>
                      <span style={{ fontSize: '9px', background: '#F0F5FF', color: '#0056D2', padding: '1px 6px', borderRadius: '6px', fontWeight: '800' }}>{post.category}</span>
                    </div>
                  </div>
                  <div style={{ color: '#C8D8F5', flexShrink: 0 }}>›</div>
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
                <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #FFD700, #FFA000)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                  {baitTip.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '9px', fontWeight: '900', color: '#FFB300', marginBottom: '3px' }}>
                    오늘의 미끼 팁 · {selectedPoint?.name?.slice(0, 8) || '현재 포인트'}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#fff', lineHeight: 1.45 }}>
                    {baitTip.text}
                  </div>
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
        {showCCTV && cctvData && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1200, display: 'flex', flexDirection: 'column' }}>
            {/* 헤더 */}
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontWeight: '700', marginBottom: '2px', letterSpacing: '0.05em' }}>
                  📡 {cctvData.label || '실시간 현장 영상'}
                </div>
                <div style={{ fontSize: '16px', fontWeight: '950', color: '#fff' }}>{selectedPoint?.name}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginTop: '2px' }}>
                  {cctvData.areaName} · {cctvData.region}
                </div>
              </div>
              <button onClick={() => { setShowCCTV(false); setCctvData(null); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} color="#fff" />
              </button>
            </div>

            {/* 영상/이미지 */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              {(cctvData.type === 'youtube' || cctvData.type === 'iframe') && cctvData.url ? (
                <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', aspectRatio: '16/9', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                  <iframe
                    src={cctvData.url}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              ) : cctvData.fallbackImg ? (
                <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                  <img
                    src={cctvData.fallbackImg}
                    alt={cctvData.areaName}
                    style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                    <div style={{ fontSize: '11px', color: '#FFD700', fontWeight: '800' }}>📷 현장 대표 이미지</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: '2px' }}>실시간 스트리밍 준비 중 · 연결 시 자동 업데이트</div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  <AlertCircle size={40} style={{ margin: '0 auto 10px', display: 'block' }} />
                  <div style={{ fontSize: '14px', fontWeight: '700' }}>영상 준비 중입니다</div>
                </div>
              )}
            </div>

            {/* 하단 안내 */}
            <div style={{ padding: '12px 20px 30px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', textAlign: 'center' }}>
                {cctvData.type === 'youtube' ? '📺 YouTube 라이브 스트리밍 연동 (지자체 공식 채널)' : cctvData.type === 'iframe' ? '🔗 커스텀 스트림 연동 (관리자 직접 설정)' : '📡 지역 대표 해안 이미지 · 실시간 스트리밍 추가 예정'}
              </div>
            </div>
          </div>
        )}

        {/* 스핀 및 특수효과 애니메이션 */}
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
          @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
          @keyframes secretPulse { 0% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(255,215,0,0.9)); } 50% { transform: scale(1.25); filter: drop-shadow(0 0 16px rgba(255,215,0,1)) drop-shadow(0 0 6px rgba(255,160,0,1)); } 100% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(255,215,0,0.9)); } }
          input::placeholder { color: #AAB0BE; }
          ::-webkit-scrollbar { display: none; }
        `}</style>
      </div>
    </div>
  );
}
