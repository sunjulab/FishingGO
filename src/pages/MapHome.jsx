import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Map, Anchor, Droplets, Wind, Waves, Ship, Crown, Navigation,
  Search, Clock, Compass, BarChart2, Zap, ChevronRight, Bell,
  MapPin, Thermometer, Info, Fish, X, Tv, ArrowLeft, RefreshCw,
  AlertCircle, Star, Lock, Settings
} from 'lucide-react';
import { findNearestStation, calculateFishingIndex } from '../utils/weather';
import { evaluateFishingCondition } from '../utils/evaluator';
import ReactPlayer from 'react-player';
import FishingPointBottomSheet from '../components/FishingPointBottomSheet';
import apiClient from '../api/index';
import { fetchTideForecast, fetchWaterTemp } from '../api/marineApi';
import { useToastStore } from '../store/useToastStore';
import { ALL_FISHING_POINTS, SECRET_FISHING_POINTS, getPointSpecificData } from '../constants/fishingData';
import { useUserStore, TIER_CONFIG, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore';
import CsInquirySection from '../components/CsInquirySection';
import { NativeAd, RewardGateModal } from '../components/AdUnit';
import CctvModal from '../components/CctvModal';
import UpgradeModal from '../components/UpgradeModal';
import DashboardView from './DashboardView';
import NotifPanel from '../components/NotifPanel';
import { useNotifStore } from '../store/useNotifStore';
import SpotLocationEditor from '../components/SpotLocationEditor';
import AddPointModal from '../components/AddPointModal';


// ✅ 5TH-C4: EMOJI_MAP — WeatherDashboard와 동일 객체; 향후 constants/ui.js 추출 검토 권장


const EMOJI_MAP = { '방파제': '⚓', '갯바위': '🪨', '선착장': '🚢', '항구': '🏖️', '민물': '📍' };
const STATUS_COLOR = { '최고': '#00C48C', '피딩중': '#FFB300', '활발': '#1565C0', '보통': '#8E8E93' };
// ✅ 26TH-B2: DEFAULT_AVATAR_SVG 모듈 레벨 상수 — pravatar.cc 외부 의존 제거 (6TH-A2 MyPage 패턴)
const DEFAULT_AVATAR_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23E5E5EA'/%3E%3Ccircle cx='20' cy='16' r='7' fill='%23AEAEB2'/%3E%3Cellipse cx='20' cy='36' rx='12' ry='9' fill='%23AEAEB2'/%3E%3C/svg%3E";

// ✅ NOTIF BELL: 알림 센터 버튼 (미읽음 수 뱃지 + 패널 슬라이드)
function NotifBell() {
  const [open, setOpen] = React.useState(false);
  const notifs = useNotifStore(s => s.notifs);
  const unread = notifs.filter(n => !n.read).length;
  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{ position: 'relative', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Bell size={20} color="#333" strokeWidth={2} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-2px', right: '-2px',
            minWidth: unread > 9 ? '16px' : '14px', height: '14px',
            background: '#FF3B30', borderRadius: '7px',
            border: '1.5px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '8px', fontWeight: '900', color: '#fff',
            padding: '0 2px',
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
        {unread === 0 && (
          <span style={{ position: 'absolute', top: '-1px', right: '-1px', width: '6px', height: '6px', background: '#E5E5EA', borderRadius: '50%', border: '1.5px solid #fff' }} />
        )}
      </div>
      {open && <NotifPanel onClose={() => setOpen(false)} />}
    </>
  );
}

// ✅ BUG-FIX: 헤더 시계 고정 버그 수정
function HeaderClock() {
  const [clockStr, setClockStr] = React.useState(() =>
    new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
  );
  React.useEffect(() => {
    const t = setInterval(() =>
      setClockStr(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }))
    , 60000);
    return () => clearInterval(t);
  }, []);
  return clockStr;
}

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
  // ✅ MASTER: 일반 포인트 좌표 오버라이드 (서버에서 로드)
  const [effectiveAllPoints, setEffectiveAllPoints] = useState(ALL_FISHING_POINTS);
  const [spotLocOverrides, setSpotLocOverrides]     = useState({});
  const [showLocationEditor, setShowLocationEditor] = useState(false);
  const [customPoints, setCustomPoints]             = useState([]); // ✅ MASTER 신규 커스텀 포인트
  // ✅ 5TH-A5: currentTime 상태 제거 — 매분 전체 리렌더 방지, useClock hook으로 분리
  // 시간 표시는 컴포넌트 내 LiveClock 컴포넌트가 도맡
  const [showSecretPoints, setShowSecretPoints] = useState(false);
  const [precisionData, setPrecisionData]       = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  // ✅ REWARD-GATE: 무료 유저 포인트 입장 시 보상형 광고 게이트
  const [showRewardGate, setShowRewardGate]     = useState(false);
  const [pendingPoint, setPendingPoint]         = useState(null); // { point, fromDashboard }
  // ✅ REALTIME-FIX: 실시간 점수 갱신 용 tick (10분마다 증가 → useMemo 재계산 트리거)
  const [rankTick, setRankTick] = useState(0);
  const [weatherCache, setWeatherCache]   = useState({}); // ✅ FIX-HEATMAP: 히트맵 실시간 날씨 캐시 (stationId → precisionData)
  // ✅ SHARE-COND: 바텀시트의 AI 낚시 컨디션 결과 공유 (홈화면 멘트 완전 동기화)
  const [sharedCond, setSharedCond]       = useState(null);  // { cond, pointId }
  const [isAddMode, setIsAddMode]         = useState(false);
  const [addModalPos, setAddModalPos]     = useState(null);
  const [showPointManager, setShowPointManager] = useState(false);

  /* ── 마운트 시 기본 포인트 AI 컨디션 전체 패치 (세로고침 대응) ── */
  useEffect(() => {
    let cancelled = false; // ✅ BUG-MAP01 FIX: 언마운트 후 setState 방지
    const defaultPt = ALL_FISHING_POINTS.find(p => p.id === 3) || ALL_FISHING_POINTS[0];
    const nearest   = findNearestStation(defaultPt.lat, defaultPt.lng);
    const sid       = nearest.id;
    const todayStr  = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    (async () => {
      try {
        let base = getPointSpecificData(defaultPt);
        const [precRes, tideItems, waterTemp] = await Promise.allSettled([
          apiClient.get(`/api/weather/precision?stationId=${sid}`),
          fetchTideForecast(sid, todayStr),
          fetchWaterTemp(sid, todayStr),
        ]);

        if (cancelled) return; // ✅ BUG-MAP01 FIX: await 후 취소 확인

        // precision 데이터 병합
        if (precRes.status === 'fulfilled') {
          base = { ...base, ...precRes.value.data, stationId: sid };
          // ✅ REALTIME-FAST: 초기 API 결과를 weatherCache에 즉시 반영 (기존 _serverScore 보존)
          setWeatherCache(prev => ({
            ...prev,
            [sid]: { _serverScore: prev[sid]?._serverScore, ...precRes.value.data, stationId: sid },
          }));
        }
        // 조석 예보 병합
        if (tideItems.status === 'fulfilled' && tideItems.value?.length) {
          const preds = tideItems.value.map(t => ({
            time: t.hl_time || '', type: t.hl_code === 'H' ? '고조' : '간조', level: t.hl_level || ''
          }));
          base = {
            ...base,
            tide_predictions: preds,
            tide: {
              ...(base.tide || {}),
              phase: base.tide?.phase || '조석 데이터',
              high: preds.find(p => p.type === '고조')?.time || base.tide?.high || '-',
              low:  preds.find(p => p.type === '간조')?.time || base.tide?.low  || '-',
            },
          };
          if (!cancelled) setWeatherCache(prev => ({
            ...prev,
            [sid]: { ...(prev[sid] || {}), tide_predictions: preds, tide: base.tide },
          }));
        }
        // 수온 갱신
        if (waterTemp.status === 'fulfilled' && waterTemp.value && waterTemp.value !== '-') {
          base = { ...base, sst: waterTemp.value, waterTemp: waterTemp.value };
          if (!cancelled) setWeatherCache(prev => ({ ...prev, [sid]: { ...(prev[sid] || {}), sst: waterTemp.value } }));
        }

        if (!cancelled) {
          const initCond = evaluateFishingCondition(base, defaultPt);
          setSharedCond({ cond: initCond, pointId: defaultPt.id, withPrecision: false });
          if (!import.meta.env.PROD)
            console.log('[Init] 기본 포인트 AI 컨디션 로드 완료 →', defaultPt.name, initCond.score, '점');
        }
      } catch (e) {
        if (!cancelled && !import.meta.env.PROD) console.warn('[Init] 기본 AI 컨디션 패치 실패 → fallback', e);
      }
    })();
    return () => { cancelled = true; }; // ✅ BUG-MAP01 FIX
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 선택된 포인트 변경 시 sharedCond 액정 (sheetVisible 닫힌 후 갱신될 때까지 이전 포인트 멘트 개시 방지) ── */
  useEffect(() => {
    if (selectedPoint && sharedCond && sharedCond.pointId !== selectedPoint.id) {
      setSharedCond(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoint?.id]);

  // ✅ REALTIME-SCORE-FIX: weatherCache 갱신 시 sharedCond 클리어 → 실시간 점수 즉시 반영
  // ✅ BUG-FIX: 바텔시트 정밀 AI(메세지/어류 정보) 기반 sharedCond는 보호 (withPrecision 플래그)
  //            초기 init sharedCond는 weatherCache 반영 후 clear괼도
  useEffect(() => {
    // precisionData 기반가 아닌 sharedCond(앱 시작 시 initCond)는 클리어
    if (sharedCond && !sharedCond.withPrecision) setSharedCond(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weatherCache]);

  // ── 즐겨찾기 (로컬 + DB 이중 동기화) ─────────────────────────
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fishing_favorites') || '[]'); } catch { return []; }
  });
  const secretMarkersRef = useRef([]);
  const closeSheetTimerRef = useRef(null); // ✅ FIX: closeSheet setTimeout 언마운트 정리

  // ✅ 5TH-A5: currentTime setInterval 제거 — LiveClock 컴포넌트가 도맡하므로 MapHome 리렌더 불필요
  // 기존: setInterval(() => setCurrentTime(new Date()), 60000) 제거

  // ✅ REALTIME-v2: 5분마다 rankTick 증가 (이전 10분 → 5분 단쳕) + 앱 포커스 복귀 시 즉시 강제 갱신
  useEffect(() => {
    // 5분 주기 자동 갱신
    const id = setInterval(() => setRankTick(t => t + 1), 5 * 60 * 1000);

    // ✅ VISIBILITY-FIX: 다른 탭 갔다 돌아올 때 / 앱 포그라운드에서 백그라운드 전환 후 복귀 시 즉시 재갱신
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        setRankTick(t => t + 1);
        if (!import.meta.env.PROD) console.info('[REALTIME] 사용자 앱 복귀 → 날씨 즉시 갱신');
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    // ✅ FOCUS-FIX: 모바일 홈 버튼 돌아올 때 window focus 이벤트도 커버
    const onFocus = () => setRankTick(t => t + 1);
    window.addEventListener('focus', onFocus);

    // ✅ FIX: closeSheet 타이머 언마운트 정리
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
      if (closeSheetTimerRef.current) clearTimeout(closeSheetTimerRef.current);
    };
  }, []);

  // 즐겨찾기 DB 동기화 (로그인 시 서버에서 불러오기)
  useEffect(() => {
    if (!user) return;
    const userId = user.email || user.id;
    if (!userId || userId === 'GUEST') return;
    apiClient.get(`/api/user/favorites?userId=${encodeURIComponent(userId)}`)
      .then(res => {
        if (res.data.favorites?.length > 0) {
          setFavorites(res.data.favorites);
          try { localStorage.setItem('fishing_favorites', JSON.stringify(res.data.favorites)); } catch { /* StorageError 무시 */ }
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
    try { localStorage.setItem('fishing_favorites', JSON.stringify(next)); } catch { /* StorageError 무시 */ }
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
    if (!canAccessPremium && !isAdmin) return;
    let cancelled = false; // ✅ FIX-MED: 언마운트 후 setState 방어
    apiClient.get('/api/secret-point-overrides')
      .then(res => {
        if (cancelled) return;
        const ov = res.data || {};
        const applied = SECRET_FISHING_POINTS.map(p => {
          const key = String(p.id);
          return ov[key] ? { ...p, lat: ov[key].lat, lng: ov[key].lng } : p;
        });
        setEffectiveSecretPoints(applied);
      })
      .catch(() => {
        if (cancelled) return;
        try {
          const ov = JSON.parse(localStorage.getItem('secretPointOverrides') || '{}');
          setEffectiveSecretPoints(SECRET_FISHING_POINTS.map(p => ov[p.id] ? { ...p, lat: ov[p.id].lat, lng: ov[p.id].lng } : p));
        } catch { /* 기본값 유지 */ }
      });
    return () => { cancelled = true; };
  }, [canAccessPremium, isAdmin]);

  /* ── MASTER 전용: 일반 포인트 좌표 오버라이드 로드 ── */
  useEffect(() => {
    let cancelled = false; // ✅ FIX-LOW: 언마운트 후 setState 방어
    apiClient.get('/api/spot-location-overrides')
      .then(res => {
        if (cancelled) return;
        const ov = res.data || {};
        setSpotLocOverrides(ov);
        const applied = ALL_FISHING_POINTS
          .filter(p => !ov[String(p.id)] || !ov[String(p.id)].isDeleted) // 삭제(숨김) 처리된 포인트 제거
          .map(p => {
            const key = String(p.id);
            if (ov[key]) {
              return { 
                ...p, 
                lat: ov[key].lat, 
                lng: ov[key].lng,
                name: ov[key].name || p.name,
                type: ov[key].type || p.type,
                targets: (ov[key].targets && ov[key].targets.length > 0) ? ov[key].targets : p.targets
              };
            }
            return p;
          });
        setEffectiveAllPoints(applied);
      })
      .catch(() => { /* 오버라이드 없으면 원본 사용 */ });
    return () => { cancelled = true; };
  }, []);

  /* ── 커스텀 포인트 로드 (신규 추가된 포인트) ── */
  useEffect(() => {
    let cancelled = false; // ✅ FIX-LOW: 언마운트 후 setState 방어
    apiClient.get('/api/custom-points')
      .then(res => { if (!cancelled && Array.isArray(res.data) && res.data.length > 0) setCustomPoints(res.data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

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
              // ✅ 서버에 최근 위치 (가까운 관측소) 갱신 (알림용)
              try {
                const nearest = findNearestStation(pos.coords.latitude, pos.coords.longitude);
                if (nearest && nearest.id) {
                  apiClient.post('/api/user/location', { stationId: nearest.id }).catch(() => {});
                }
              } catch (e) { /* ignore */ }
            },
            // ENH6-A1/B2: 위치 거부 시 PROD 가드 + 사용자 toast 피드백
            () => {
              if (!import.meta.env.PROD) console.warn('[MapHome] 위치 권한이 거부되었습니다.');
              addToast('현위치를 가져올 수 없습니다. 지도에서 직접 포인트를 탭해 주세요.', 'info');
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

  /* ── 맵 클릭 시 포인트 추가 모드 처리 ── */
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.kakao?.maps) return;
    const handler = (mouseEvent) => {
      if (!isAddMode) return;
      const latlng = mouseEvent.latLng;
      setAddModalPos({ lat: latlng.getLat(), lng: latlng.getLng() });
      setIsAddMode(false); // 한번 클릭하면 추가 모드 해제
    };
    window.kakao.maps.event.addListener(mapRef.current, 'click', handler);
    return () => {
      window.kakao.maps.event.removeListener(mapRef.current, 'click', handler);
    };
  }, [mapLoaded, isAddMode]);


  /* ── FREE 플랜 포인트 입장 일일 제한 체크 ── */
  // 로그인 사용자: 서버 API 기준 (DB 이중 기록, KST 자정 리셋)
  // GUEST: sessionStorage 기준 하루 1회 제한 (시크릿탭 우회 최소화)
  const checkDailyPointVisit = useCallback(async () => {
    const userId = user?.email || user?.id;
    const isGuest = !userId || userId === 'GUEST';

    if (isGuest) {
      // GUEST: sessionStorage 기반 — 탭 종료 시 리셋 (시크릿탭 어뷰징 차단 강화)
      const GUEST_LIMIT = 1;
      const KEY = 'fg_guest_pv'; // { count, date }
      const todayKst = (() => {
        const kstMs = Date.now() + 9 * 60 * 60 * 1000;
        return new Date(kstMs).toISOString().split('T')[0];
      })();
      let rec = { count: 0, date: '' };
      try { rec = JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch { rec = { count: 0, date: '' }; }
      if (rec.date !== todayKst) rec = { count: 0, date: todayKst };
      if (rec.count >= GUEST_LIMIT) return false;
      rec.count += 1;
      try { sessionStorage.setItem(KEY, JSON.stringify(rec)); } catch { /* 스토리지 차단 시 허용 */ }
      return true;
    }

    // 로그인 사용자: 서버 API 호출
    try {
      const res = await apiClient.post('/api/user/point-visit-check');
      return res.data?.allowed !== false;
    } catch {
      // 서버 오류 시 fail-open (UX 보호 우선)
      return true;
    }
  }, [user?.email, user?.id]);

  /* ── 포인트 실제 진입 (광고 완료 or 프리미엄 유저) ── */
  const _enterPoint = useCallback(async (point, fromDashboard = false) => {
    setSelectedPoint(point);
    setPrecisionData(null);
    setLoading(true);
    if (!fromDashboard) {
      setSheetVisible(true);
      // ✅ BUG-MAP03 FIX: window.kakao?.maps 널 체크 추가 (컨조 SDK 미로드 시 TypeError 크래시 방지)
      if (mapRef.current && window.kakao?.maps) {
        mapRef.current.panTo(new window.kakao.maps.LatLng(point.lat, point.lng));
      }
    }
    const nearest = findNearestStation(point.lat, point.lng);
    if (point.type === '민물') {
      setPrecisionData(null);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get(`/api/weather/precision?stationId=${nearest.id}`);
      // ✅ SCORE-SYNC: weatherCache도 동시 갱신 → 검색결과점수와 홈화면점수가 같은 데이터 기반으로 통일
      setWeatherCache(prev => ({
        ...prev,
        [nearest.id]: { _serverScore: prev[nearest.id]?._serverScore, ...res.data, stationId: nearest.id },
      }));
      // ✅ TIDE-SYNC: API 응답의 tide 우선 → 없으면 weatherCache tide → 없으면 정적 fallback
      const staticTide = getPointSpecificData(point).tide;
      const bestTide = res.data.tide || staticTide;
      setPrecisionData({ ...res.data, pointName: point.name, tide: bestTide, stationId: nearest.id });
    } catch {
      setPrecisionData(getPointSpecificData(point));
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 포인트 클릭 ── */
  // ✅ 5TH-B1: useCallback — 마커 useEffect 업데이트 시 매 렌더마다 새 함수 생성 방지
  // ✅ FIX-TDZ: 마커 렌더링 useEffect보다 먼저 선언해야 TDZ(Cannot access before initialization) 방지
  // ✅ REWARD-GATE: 무료 유저 → 보상형 광고 시청 후 입장 (3회 일일 제한 제거)
  const handlePointClick = useCallback(async (point, fromDashboard = false) => {
    // 프리미엄/관리자: 광고 없이 바로 입장
    if (canAccessPremium || isAdmin) {
      await _enterPoint(point, fromDashboard);
      return;
    }
    // 무료 유저: 보상형 광고 게이트 오픈
    setPendingPoint({ point, fromDashboard });
    setShowRewardGate(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccessPremium, isAdmin, _enterPoint]);

  /* ── 마커 렌더링 (일반 + 커스텀 포인트 병합) ── */
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    
    if (clustererRef.current) {
      clustererRef.current.clear();
    }
    
    const basePts   = filter === '전체' ? effectiveAllPoints : effectiveAllPoints.filter(p => p.type === filter);
    const customPts = (filter === '전체' ? customPoints : customPoints.filter(p => p.type === filter))
                      .filter(p => p.type !== '비밀포인트'); // 비밀포인트는 일반 마커에서 제외
    const pts = [...basePts, ...customPts];
    
    // 대규모 데이터 렌더링 최적화
    const newMarkers = pts.map(point => {
      if (!window.kakao?.maps) return null;
      const isSecret = point.type === '비밀포인트';
      const isCustom = !!point.isCustom;
      // ✅ 비밀포인트가 아닌 커스텀 포인트는 기본 포인트와 동일한 색상 적용
      const color = isSecret ? '#FF6B35'
        : point.type === '방파제' ? '#00C48C'
        : point.type === '갯바위' ? '#0056D2'
        : point.type === '항구' ? '#9B59B6'
        : point.type === '민물' ? '#43A047' : '#FF9B26';
        
      const isStar = isSecret; // 비밀포인트만 별(★) 모양
      
      const el = document.createElement('div');
      el.style.cssText = `
        background: ${color};
        width: ${isStar ? '28px' : '24px'}; height: ${isStar ? '28px' : '24px'};
        display: flex; align-items: center; justify-content: center;
        color: #fff; font-weight: 950;
        border: ${isStar ? '2.5px solid #FFD700' : '2px solid #fff'}; border-radius: 50%;
        box-shadow: ${isStar ? '0 4px 16px rgba(255,107,53,0.6)' : '0 4px 12px rgba(0,0,0,0.15)'};
        cursor: pointer; font-size: calc(${isStar ? '11px' : '10px'} * var(--fs, 1));
        transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      `;
      el.textContent = isStar ? '★' : (point.type || '?').charAt(0);
      
      el.onmouseenter = () => { el.style.transform = 'scale(1.3) translateY(-2px)'; el.style.zIndex = '50'; };
      el.onmouseleave = () => { el.style.transform = 'scale(1)'; el.style.zIndex = '10'; };
      el.onclick = () => handlePointClick(point);
      
      return new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(point.lat, point.lng),
        content: el,
        zIndex: isCustom ? 20 : 10
      });
    }).filter(m => m !== null);
    
    if (clustererRef.current) {
      clustererRef.current.addMarkers(newMarkers);
    }
    markersRef.current = newMarkers;
  // ✅ customPoints deps 추가 — 커스텀 포인트 추가 시 즉시 마커 갱신
  }, [mapLoaded, filter, handlePointClick, effectiveAllPoints, customPoints]);


  /* ── 비밀 포인트 마커 렌더링 (LITE 이상 전용) ── */
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    // 기존 비밀 마커 제거
    secretMarkersRef.current.forEach(m => { if (m?.setMap) m.setMap(null); });
    secretMarkersRef.current = [];

    if (!showSecretPoints) return;

    const allSecretPts = [...effectiveSecretPoints, ...customPoints.filter(p => p.type === '비밀포인트')];

    allSecretPts.forEach(point => {

      if (!window.kakao?.maps) return;

      // 황금 별 마커 (비밀포인트)
      const el = document.createElement('div');
      el.style.cssText = `
        width: 36px; height: 36px;
        display: flex; align-items: center; justify-content: center;
        font-size: calc(20px * var(--fs, 1));
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
  // \u2705 BUG-FIX: handlePointClick\uc744 deps\uc5d0 \ud3ec\ud568 \u2014 \ud074\ub85c\uc800 stale \ubc29\uc9c0 (canAccessPremium \ubcc0\uacbd \ud6c4 \uac31\uc2e0 \ubcf4\uc7a5)
  }, [mapLoaded, showSecretPoints, effectiveSecretPoints, handlePointClick]);



  /* ── 실시간 날씨 배치 패치 (히트맵 + 대시보드 미리보기 점수 통일) ── */
  // ✅ REALTIME-v2: 5분 주기 배치패치 + 홈 화면 대표 포인트 조석(tide)도 함께 fetch
  useEffect(() => {
    // ✅ FAST-SCORE: 서버가 미리 계산한 점수를 1번 API 호출로 수신 (50개 개별 → 1개)
    // 서버 /api/fishing-scores → weatherCache 기반 즉시 계산 → ~100ms 반환
    apiClient.get('/api/fishing-scores')
      .then(res => {
        const { scores } = res.data;
        // ✅ scores가 없거나 비어있으면 불필요한 setWeatherCache 호출 전진(→ useEffect[weatherCache] 굴시적 sharedCond clear 방지)
        if (!scores || Object.keys(scores).length === 0) return;
        setWeatherCache(prev => {
          const next = { ...prev };
          Object.keys(scores).forEach(sid => {
            next[sid] = {
              ...(prev[sid] || {}),
              stationId: sid,
              _serverScore: scores[sid],
            };
          });
          return next;
        });
      })
      .catch(() => {}); // 실패 시 기존 incremental fetch가 fallback

    // ✅ INCREMENTAL: 상세 날씨 데이터도 병렬로 취득 (히트맵/상세 뷰 용도)
    const uniqueStationIds = [...new Set([
      ...ALL_FISHING_POINTS.map(p => findNearestStation(p.lat, p.lng).id),
      ...customPoints.map(p => findNearestStation(p.lat, p.lng).id),
    ])];
    uniqueStationIds.forEach(id => {
      apiClient.get(`/api/weather/precision?stationId=${id}`)
        .then(res => {
          // ✅ _serverScore 보존: precision 응답이 덮어써도 서버점수는 유지
          setWeatherCache(prev => ({
            ...prev,
            [id]: { _serverScore: prev[id]?._serverScore, ...res.data, stationId: id },
          }));
        })
        .catch(() => {});
    });

    // ② ✅ TIDE-HOME: 홈 화면 대표 포인트 조석예보도 패치 (5분마다 갱신)
    (async () => {
      try {
        const defaultPt = ALL_FISHING_POINTS.find(p => p.id === 3) || ALL_FISHING_POINTS[0];
        const defaultSt = findNearestStation(defaultPt.lat, defaultPt.lng);
        const todayStr  = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const tideItems = await fetchTideForecast(defaultSt.id, todayStr);
        if (tideItems?.length) {
          const preds = tideItems.map(t => ({
            time: t.hl_time || '', type: t.hl_code === 'H' ? '고조' : '간조', level: t.hl_level || ''
          }));
          setWeatherCache(prev => ({
            ...prev,
            [defaultSt.id]: {
              ...(prev[defaultSt.id] || {}),
              tide_predictions: preds,
              tide: {
                ...(prev[defaultSt.id]?.tide || {}),
                phase: prev[defaultSt.id]?.tide?.phase || '조석 데이터',
                high: preds.find(p => p.type === '고조')?.time || '-',
                low:  preds.find(p => p.type === '간조')?.time  || '-',
              },
            }
          }));
        }
      } catch (e) { /* 조석 패치 실패 시 정적 fallback */ }
    })();
  }, [rankTick, customPoints]); // rankTick: 5분 + 앱 복귀 즉시, customPoints: 포인트 추가 시 즉시 갱신




  /* ── 수온 및 조황 히트맵 렌더링 (Premium Feature) ── */
  // ✅ FIX-HEATMAP-SCORE-v2: weatherCache 실시간 우선 → 서버 기상 데이터로 점수 계산
  // 캐시 없으면 정적 getPointSpecificData fallback (히트맵 첫 로드 전 임시 표시)
  // ✅ CUSTOM-MERGE: 커스텀 포인트(신규 추가)도 히트맵에 포함
  const heatmapData = useMemo(() => {
    // ✅ FIX-HEATMAP-FILTER: filter 카테고리 적용 (갯바위/민물/방파제/항구/전체)
    const allPts = [...ALL_FISHING_POINTS, ...customPoints];
    const filteredPts = filter === '전체' ? allPts : allPts.filter(p => p.type === filter);
    return filteredPts.map(point => {
      // ✅ 민물 포인트: 점수/수온 계산 없이 어종명만 전달
      if (point.type === '민물') {
        const fishList = (point.fish || '').split(',').map(f => f.trim()).filter(Boolean);
        return { point, sst: null, score: null, isFreshwater: true, fishList };
      }
      const st = findNearestStation(point.lat, point.lng);
      const staticData = getPointSpecificData(point);
      // 실시간 캐시 우선 사용, 없으면 정적 fallback
      const liveData = weatherCache[st.id];
      const weatherData = liveData
        ? {
            ...liveData,
            stationId: st.id,
            // ✅ NEW-1 FIX: 실시간 tide 우선, 없으면 정적 fallback (BUG-2와 동일 패턴 히트맵에 적용)
            tide: liveData.tide || staticData?.tide,
            pointName: point.name,
          }
        : staticData;
      const sst = parseFloat(weatherData?.sst || 13);
      const condition = evaluateFishingCondition(weatherData, point);
      return { point, sst, score: condition.score, isFreshwater: false, fishList: [] };
    });
  }, [filter, rankTick, weatherCache, customPoints]); // ✅ FIX: filter 추가 — 카테고리 전환 시 즉시 재계산


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
    heatmapData.forEach(({ point, sst, score, isFreshwater, fishList }) => {
      if (!window.kakao?.maps) return;

      const center = new window.kakao.maps.LatLng(point.lat, point.lng);

      // ✅ 민물 포인트: 점수/수온 없이 어종명만 녹색 라벨 표시
      if (isFreshwater) {
        if (!fishList || fishList.length === 0) return;
        const fishDisplay = fishList.slice(0, 3).join(' · ');
        const fwContent = [
          '<div style="',
            'background:rgba(27,94,32,0.92);color:#fff;',
            'padding:5px 10px;border-radius:12px;',
            'font-size:11px;font-weight:900;white-space:nowrap;line-height:1.4;',
            'border:1.5px solid #43A047;pointer-events:none;',
            'box-shadow:0 4px 12px rgba(67,160,71,0.4);transform:translateY(-8px);">',
            '<div style="display:flex;align-items:center;gap:4px;">',
              '<span style="font-size:13px;">🌿</span>',
              '<span style="color:#A5D6A7;font-size:11px;font-weight:900;">', fishDisplay, '</span>',
            '</div>',
            '<div style="color:#81C784;font-size:9.5px;margin-top:2px;">민물 낙시포인트</div>',
          '</div>',
        ].join('');
        const fwOverlay = new window.kakao.maps.CustomOverlay({ position: center, content: fwContent, yAnchor: 2.2, zIndex: 3 });
        fwOverlay.setMap(mapRef.current);
        heatmapRef.current.push(fwOverlay);
        return; // 바다 포인트 렌더링 실행 안 함
      }

      const { fill, text, opacity } = heatmapMode === 'sst' ? getSstColor(sst) : getScoreColor(score);
      const baseRadius = heatmapMode === 'sst' ? getRadiusSst(sst) : getRadiusScore(score);

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
      (p.fish || '').toLowerCase().includes(low) ||
      p.type.toLowerCase().includes(low) ||
      (p.region?.toLowerCase().includes(low))
    );
    const customFiltered = customPoints.filter(p =>
      p.name.toLowerCase().includes(low) ||
      (p.fish || '').toLowerCase().includes(low) ||
      p.type.toLowerCase().includes(low) ||
      (p.region?.toLowerCase().includes(low))
    );
    setSearchResults([...filtered, ...customFiltered]);
    setShowSearch(true);
  };



  const closeSheet = () => {
    setSheetVisible(false);
    // ✅ FIX: 이전 타이머 정리 후 ref 추적 — 언마운트 시 clearTimeout 보장
    if (closeSheetTimerRef.current) clearTimeout(closeSheetTimerRef.current);
    closeSheetTimerRef.current = setTimeout(() => {
      setSelectedPoint(null);
      closeSheetTimerRef.current = null;
    }, 350);
  };

  /* ── 렌더링용 데이터 가공 ── */
  // ✅ FIX-MAIN-SCORE: precisionData > weatherCache > 정적 순 우선순위
  // precisionData: 포인트 클릭 시 서버에서 받은 정밀 데이터
  // weatherCache:  앱 시작 2초 후 배치 패치된 실시간 날씨 (10분마다 갱신)
  // 정적 fallback: weatherCache 로드 전 임시 표시
  // ✅ DEFAULT-POINT: 홈화면 표시명(강릉 안목항 방파제)와 데이터 소스를 동일 포인트로 통일
  const DEFAULT_POINT = ALL_FISHING_POINTS.find(p => p.id === 3) || ALL_FISHING_POINTS[0];
  const _selectedPt   = selectedPoint || DEFAULT_POINT;
  const _nearestSt    = findNearestStation(_selectedPt.lat, _selectedPt.lng);
  const _cachedLive   = weatherCache[_nearestSt?.id];
  const _staticData   = getPointSpecificData(_selectedPt);
  const currentData   = precisionData
    || (_cachedLive ? {
        ..._cachedLive,
        stationId: _nearestSt?.id,
        // ✅ BUG-2 FIX: weatherCache의 실시간 조석 우선, 없으면 정적 fallback
        tide: _cachedLive.tide || _staticData?.tide,
        pointName: _selectedPt.name,
      } : null)
    || _staticData;
  // ✅ REALTIME-SCORE-FIX: score는 항상 currentData로 직접 계산 (실시간 반영)
  // 이전: sharedCond 우선 → weatherCache 바뀌어도 앱 시작 시 stale 점수 유지
  // 수정: evaluateFishingCondition(currentData) 직접 → weatherCache 변경 즉시 점수 갱신
  const freshCond = evaluateFishingCondition(currentData, _selectedPt);
  // ✅ SERVER-SCORE: /api/fishing-scores 응답의 _serverScore가 있으면 즉시 사용
  // 상세 날씨 데이터(sst/wind/wave)가 없는 경우에도 서버 계산 점수를 빠르게 표시
  const _stationServerScore = _cachedLive?._serverScore;
  const freshScore = (_stationServerScore && !_cachedLive?.sst) // 서버점수만 있고 날씨 상세 없을 때
    ? _stationServerScore
    : freshCond.score;
  // sharedCond는 바텀시트 AI 텍스트(advice/gear/fishAlert) 동기화에만 사용
  const sharedText = sharedCond?.pointId === _selectedPt?.id ? sharedCond.cond : null;
  const cond     = sharedText || freshCond;  // 텍스트는 바텀시트 정밀값 우선
  const score    = freshScore;               // ✅ 점수: 서버점수 or freshCond (항상 실시간)
  const isGolden = score >= 90;
  const tideData = currentData;
  const phase    = tideData.tide?.phase || '-'; // ✅ BUG-5 FIX


  // ✅ FILTER-FIX: filter 상태를 deps에 포함 + 필터 적용 후 실시간 점수 정렬
  // 이전: filter 누락으로 방파제/갯바위/항구 선택해도 목록 미변경 버그
  // ✅ CUSTOM-MERGE: 커스텀 포인트도 TOP 8 대시보드에 포함 (실시간 날씨/점수 반영)
  const PREMIUM_POINTS = useMemo(() => {
    const baseStatic = filter === '전체'
      ? ALL_FISHING_POINTS.filter(p => p.type !== '민물')
      : ALL_FISHING_POINTS.filter(p => p.type === filter);
    const baseCustom  = filter === '전체'
      ? customPoints.filter(p => p.type !== '민물' && p.type !== '비밀포인트')
      : customPoints.filter(p => p.type === filter && p.type !== '비밀포인트');
    const base = [...baseStatic, ...baseCustom];
    return base
      .map(p => {
        const st = findNearestStation(p.lat, p.lng);
        const staticData = getPointSpecificData(p);
        // ✅ FIX-SCORE-ALL: weatherCache 우선 → 히트맵·대시보드 점수 전체 동기화
        const liveData = weatherCache[st.id];
        const weatherData = liveData
          ? { ...liveData, stationId: st.id, tide: liveData.tide || staticData?.tide, pointName: p.name }
          : staticData;
        // ✅ _serverScore 활용: sst가 없어도 서버가 계산한 점수를 즉시 표시
        const liveScore = (liveData?._serverScore && !liveData?.sst)
          ? liveData._serverScore
          : evaluateFishingCondition(weatherData, p).score;
        return { ...p, _liveScore: liveScore };
      })
      .sort((a, b) => b._liveScore - a._liveScore || a.id - b.id) // ✅ 동점 시 id로 정렬 안정화
      .slice(0, 8);
  }, [filter, weatherCache, customPoints]); // ✅ rankTick 제거: weatherCache 변경 시 즉시 재계산

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
  // ✅ FIX-ALERT: split 파싱 실패 방지 — fishAlert.alert 직접 우선 사용
  const alertAdvice = cond.fishAlert?.alert || adviceParts[1]?.trim() || null;


  /* ── 동적 특보 생성 (기상 조건 기반 실시간 멘트) ── */
  const getDynamicAlert = () => {
    const hour     = new Date().getHours();
    const isNight  = hour >= 19 || hour < 5;
    const isDawn   = hour >= 4 && hour < 7;
    const wind     = parseFloat(tideData.wind?.speed ?? 0);
    const wave     = parseFloat(tideData.wave?.coastal ?? 0);
    const sst      = parseFloat(tideData.sst ?? 13);
    const phase    = tideData.tide?.phase || '';
    const mainFish = (selectedPoint?.fish || '').split(',')[0].trim();
    const month    = new Date().getMonth() + 1;

    // ① 위험 기상 최우선
    if (wave > 2.5) return `파고 ${wave}m 너울 위험 — 갯바위·방파제 접근 금지! 즉시 대피하세요.`;
    if (wind > 12)  return `풍속 ${wind.toFixed(1)}m/s 강풍 — 채비가 날아갑니다. 출조를 삼가세요.`;
    if (wave > 1.5) return `파고 ${wave}m 구름파 — 외해 노출 포인트는 위험. 안전한 코스로 이동하세요.`;

    // ② 수온 특보
    if (sst < 9)  return `수온 ${sst.toFixed(1)}°C 극저수온 — ${mainFish || '어류'} 동면 수준. 꽝 확률 95% 이상.`;
    if (sst < 11) return `수온 ${sst.toFixed(1)}°C 저수온 — ${mainFish ? `${mainFish}이 ` : ''}바닥에 바짝 붙었습니다. 지렁이+크릴 냄새로 유인하세요.`;

    // ③ 황금 물때
    // ✅ NEW-3 FIX: '7물' 단독 표기도 사리 마때로 감지 (phase 못 표기 포맷 대응)
    if (phase.includes('7물(사리)') || phase === '7물' || phase.includes('6물') || phase.includes('8물'))
      return `사리 물때 — 조류가 활발해 ${mainFish || '어류'} 입질 집중! 지금이 피딩 타임입니다.`;
    if (phase.includes('13물') || phase.includes('조금') || phase.includes('무시'))
      return `조금·무시 물때 — 조류가 약해 ${mainFish || '어류'} 입질이 뜨문뜨문합니다. 인내심이 관건.`;

    // ④ 점수 기반
    if (score >= 90) return `황금 컨디션 — ${mainFish || '대물'} 입질 확률 최고! 지금 바로 출발하세요.`;
    if (score >= 75) return `우수 컨디션 — ${mainFish || '어류'} 활성 높음. 포인트 집중 공략으로 손맛 보세요.`;
    if (score < 30)  return `출조 비권고 — 현재 기상·조건이 낚시에 매우 불리합니다. 다음 기회를 노리세요.`;

    // ⑤ 시간대
    if (isDawn && mainFish) return `새벽 돌풍 시간 — ${mainFish} 활성가 최고조! 해 뜨기 30분 전부터 준비하세요.`;
    if (isNight && (mainFish === '농어' || mainFish === '갈치' || mainFish === '볼락'))
      return `야간 피크 타임 — ${mainFish} 불빛 아래 집결합니다. 지금이 황금타임.`;

    // ⑥ 계절 세밀정보
    if (month >= 3 && month <= 5 && mainFish)
      return `봄 시즌 — ${mainFish} 산란 직전 활성 최고조. 크릴+파래 혼합 미끼가 트립니다.`;
    if (month >= 9 && month <= 11 && mainFish)
      return `가을 대물 시즌 — ${mainFish} 대형급 기대! 밑밥으로 집중 투척하세요.`;

    // ⑦ 어종 fallback (기존 고정 문구)
    return alertAdvice || null;
  };
  const dynamicAlert = getDynamicAlert();


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
    <div style={{ backgroundColor: '#F4F6FA', height: '100dvh', paddingTop: 'env(safe-area-inset-top, 0px)', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
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
              <button onClick={() => setViewMode('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', color: '#1565C0' }}>
                <ArrowLeft size={18} /> 대시보드
              </button>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {['전체', '방파제', '갯바위', '항구', '민물'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: '5px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                    fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '800', flexShrink: 0,
                    background: filter === f ? '#1565C0' : '#F0F2F7',
                    color: filter === f ? '#fff' : '#555',
                    transition: 'all 0.2s',
                  }}>{f}</button>
                ))}
                {isAdmin && (
                  <button 
                    onClick={() => {
                      setIsAddMode(!isAddMode);
                      if (!isAddMode) addToast('지도에서 원하는 위치를 터치하여 포인트를 추가하세요.', 'info');
                    }} 
                    style={{
                      padding: '5px 12px', borderRadius: '20px', border: '1.5px solid #FF9800', cursor: 'pointer',
                      fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', flexShrink: 0,
                      background: isAddMode ? '#FF9800' : '#fff',
                      color: isAddMode ? '#fff' : '#FF9800',
                      transition: 'all 0.2s',
                    }}>
                    {isAddMode ? '🎯 터치하여 추가 중...' : '🎯 포인트 추가 모드'}
                  </button>
                )}
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
                    fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', flexShrink: 0,
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
                      fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', flexShrink: 0,
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
                <span style={{ fontSize: `calc(19px * var(--fs, 1))`, fontWeight: '950', color: '#0056D2', letterSpacing: '-0.04em' }}>낚시GO</span>
                {currentTier.label && (
                  <span style={{ background: currentTier.bg, fontSize: `calc(8px * var(--fs, 1))`, padding: '2px 7px', borderRadius: '20px', color: currentTier.color || '#fff', fontWeight: '900', marginLeft: '2px' }}>
                    {currentTier.label}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                {/* ✅ BUG-FIX: HeaderClock 컴포넌트로 1분마다 갱신 (기존 new Date() 정적 시계 수정) */}
                <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '800', color: '#1565C0', letterSpacing: '-0.02em', marginRight: '-6px' }}>
                  <HeaderClock />
                </div>
                {/* ✅ NOTIF BELL: 알림 센터 오픈 버튼 */}
                <NotifBell />
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
                  <span style={{ fontSize: `calc(11.5px * var(--fs, 1))`, fontWeight: '900', color: '#1A1A2E' }}>
                    {heatmapMode === 'sst' ? '🌡 표층 수온(SST) 범례' : '🎣 AI 낚시지도 조황 점수'}
                  </span>
                  <span style={{ fontSize: `calc(9px * var(--fs, 1))`, fontWeight: '800', background: isAdmin ? '#E60000' : '#FF3B30', color: '#fff', padding: '2px 6px', borderRadius: '8px' }}>PRO</span>
                </div>
                {heatmapMode === 'sst' ? (
                  <>
                    <div style={{ display: 'flex', width: '100%', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
                      <div style={{ flex: 1, background: '#1a3c8f' }} /><div style={{ flex: 1, background: '#1565C0' }} /><div style={{ flex: 1, background: '#29B6F6' }} />
                      <div style={{ flex: 1, background: '#26C6DA' }} /><div style={{ flex: 1, background: '#66BB6A' }} /><div style={{ flex: 1, background: '#FFCA28' }} />
                      <div style={{ flex: 1, background: '#FFA726' }} /><div style={{ flex: 1, background: '#FF7043' }} /><div style={{ flex: 1, background: '#B71C1C' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: `calc(9px * var(--fs, 1))`, fontWeight: '700', color: '#8E8E93' }}>
                      <span>&lt;8°C</span><span>(어종별 적정수온)</span><span>24°C&gt;</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: `calc(9px * var(--fs, 1))`, fontWeight: '800', color: '#555', marginTop: '2px' }}>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: `calc(9px * var(--fs, 1))`, fontWeight: '700', color: '#8E8E93' }}>
                      <span>0점</span><span>종합 낚시 점수</span><span>100점</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: `calc(9px * var(--fs, 1))`, fontWeight: '800', color: '#555', marginTop: '2px' }}>
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
                    <div style={{ fontSize: `calc(40px * var(--fs, 1))` }}>🗺️</div>
                    <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '900', color: '#1A1A2E' }}>카카오맵 API 키 필요</div>
                    <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#888', fontWeight: '700', textAlign: 'center', lineHeight: 1.7, padding: '0 32px' }}>
                      .env.local 파일에 카카오 JavaScript 키를 입력하세요.<br />
                      <code style={{ background: '#F0F0F0', padding: '2px 8px', borderRadius: '6px', fontSize: `calc(11px * var(--fs, 1))`, color: '#0056D2' }}>VITE_KAKAO_APP_KEY=여기에_키_입력</code>
                    </div>
                    <button
                      onClick={() => { window.open('https://developers.kakao.com', '_blank'); }}
                      style={{ marginTop: '8px', padding: '10px 22px', background: '#FAE100', border: 'none', borderRadius: '12px', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer', color: '#1A1A2E' }}
                    >
                      카카오 개발자 콘솔 →
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #1565C0', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '700' }}>지도 로딩 중…</span>
                  </>
                )}
              </div>
            )}
          </div>

        {/* ── 대시보드 뷰 ── */}
        <DashboardView
          viewMode={viewMode}
          selectedPoint={selectedPoint}
          tideData={tideData}
          precisionData={precisionData}
          score={score}
          phase={phase}
          isGolden={isGolden}
          mainAdvice={mainAdvice}
          alertAdvice={alertAdvice}
          dynamicAlert={dynamicAlert}
          baitTip={baitTip}
          scoreStyle={scoreStyle}
          favorites={favorites}
          setViewMode={setViewMode}
          handlePointClick={handlePointClick}
          canAccessPremium={canAccessPremium}
          showSecretPoints={showSecretPoints}
          setShowSecretPoints={setShowSecretPoints}
          addToast={addToast}
          weatherCache={weatherCache}
          PREMIUM_POINTS={PREMIUM_POINTS}
          recentPosts={recentPosts}
          user={user}
          isAdmin={isAdmin}
          currentTier={currentTier}
          filter={filter}
          setFilter={setFilter}
          searchRef={searchRef}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          setSearchResults={setSearchResults}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          handleSearch={handleSearch}
          DEFAULT_POINT={DEFAULT_POINT}
          EMOJI_MAP={EMOJI_MAP}
          findNearestStation={findNearestStation}
          evaluateFishingCondition={evaluateFishingCondition}
          getPointSpecificData={getPointSpecificData}
          setCctvData={setCctvData}
          setShowCCTV={setShowCCTV}
        />

        {/* ── FREE 플랜 업그레이드 유도 모달 ── */}
        {showUpgradeModal && (
          <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
        )}

        {/* ── 보상형 광고 게이트 (무료 유저 포인트 입장) ── */}
        <RewardGateModal
          isOpen={showRewardGate}
          context="point"
          onClose={() => { setShowRewardGate(false); setPendingPoint(null); }}
          onRewardComplete={() => {
            setShowRewardGate(false);
            if (pendingPoint) {
              _enterPoint(pendingPoint.point, pendingPoint.fromDashboard);
              setPendingPoint(null);
            }
          }}
          onSubscribe={() => { setShowRewardGate(false); setShowUpgradeModal(true); }}
        />

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
              onConditionReady={(cond, pointId) => setSharedCond({ cond, pointId, withPrecision: true })}
            />
          )}
        </div>

        {/* ── CCTV 모달 ── */}
        {showCCTV && cctvData && (
          <CctvModal
            cctvData={cctvData}
            selectedPoint={selectedPoint}
            onClose={() => { setShowCCTV(false); setCctvData(null); }}
          />
        )}

        {/* ── MASTER 전용: 관리자 플로팅 버튼 모음 ── */}
        {isAdmin && selectedPoint && sheetVisible && (
          <div style={{
            position: 'absolute', bottom: '52%', right: '12px',
            zIndex: 1200, display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            <button
              onClick={() => setShowPointManager(true)}
              style={{
                background: 'linear-gradient(135deg, #1A1A2E, #00C48C)',
                border: 'none', borderRadius: '50px',
                color: '#fff', fontWeight: '900', fontSize: '12px',
                padding: '8px 14px',
                display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: '0 4px 20px rgba(0,196,140,0.5)',
                cursor: 'pointer',
                animation: 'fadeInUp 0.3s ease',
              }}
            >
              <Settings size={14} /> 정보 수정
            </button>
            <button
              onClick={() => setShowLocationEditor(true)}
              style={{
                background: 'linear-gradient(135deg, #1A1A2E, #0056D2)',
                border: 'none', borderRadius: '50px',
                color: '#fff', fontWeight: '900', fontSize: '12px',
                padding: '8px 14px',
                display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: '0 4px 20px rgba(0,86,210,0.5)',
                cursor: 'pointer',
                animation: 'fadeInUp 0.3s ease',
              }}
            >
              <MapPin size={14} /> 위치 수정
            </button>
          </div>
        )}

        {/* ── MASTER 위치 편집 모달 ── */}
        {showLocationEditor && selectedPoint && (
          <SpotLocationEditor
            spot={selectedPoint}
            onClose={() => setShowLocationEditor(false)}
            onSaved={(updated) => {
              // 오버라이드 적용 후 effectiveAllPoints 갱신
              const key = String(updated.id);
              const newOv = { ...spotLocOverrides };
              if (updated.lat === updated._origLat && updated.lng === updated._origLng) {
                delete newOv[key];
              } else {
                newOv[key] = { lat: updated.lat, lng: updated.lng };
              }
              setSpotLocOverrides(newOv);
              setEffectiveAllPoints(ALL_FISHING_POINTS.map(p => {
                const k = String(p.id);
                return newOv[k] ? { ...p, lat: newOv[k].lat, lng: newOv[k].lng } : p;
              }));
              setSelectedPoint(updated);
              setShowLocationEditor(false);
            }}
          />
        )}

        {/* ── MASTER 포인트 정보 관리 모달 ── */}
        {showPointManager && selectedPoint && (
          <AddPointModal
            lat={selectedPoint.lat}
            lng={selectedPoint.lng}
            initialData={selectedPoint}
            isCustom={customPoints.some(p => String(p.id) === String(selectedPoint.id))}
            onClose={() => setShowPointManager(false)}
            onSuccess={(updatedPt, action) => {
              const isCustom = customPoints.some(p => String(p.id) === String(selectedPoint.id));
              if (isCustom) {
                if (action === 'delete') {
                  setCustomPoints(prev => prev.filter(p => String(p.id) !== String(selectedPoint.id)));
                } else {
                  setCustomPoints(prev => prev.map(p => String(p.id) === String(updatedPt.id) ? updatedPt : p));
                }
              } else {
                // 기존 포인트 오버라이드
                const ovKey = String(updatedPt.id);
                const newOv = { ...spotLocOverrides };
                if (action === 'delete') {
                  newOv[ovKey] = { ...newOv[ovKey], isDeleted: true };
                } else {
                  newOv[ovKey] = { ...newOv[ovKey], ...updatedPt };
                }
                setSpotLocOverrides(newOv);
                setEffectiveAllPoints(prev => {
                  if (action === 'delete') return prev.filter(p => String(p.id) !== ovKey);
                  return prev.map(p => {
                    if (String(p.id) === ovKey) {
                      return { ...p, ...newOv[ovKey] };
                    }
                    return p;
                  });
                });
              }
              setSelectedPoint(null);
              setShowPointManager(false);
            }}
          />
        )}

        {/* ── 포인트 추가 모달 ── */}
        {addModalPos && (
          <AddPointModal
            lat={addModalPos.lat}
            lng={addModalPos.lng}
            onClose={() => setAddModalPos(null)}
            onSuccess={(newPt) => {
              setCustomPoints(prev => [...prev, newPt]);
            }}
          />
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
