import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Search, MapPin, CheckCircle, Star, MousePointer,
  RotateCcw, Zap, Wifi, WifiOff, Filter, X, Plus, Trash2, Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ALL_FISHING_POINTS } from '../constants/fishingData';
import { findNearestStation } from '../utils/weather';
import apiClient from '../api/index';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';

// ── 로컬 오버라이드 헬퍼 ────────────────────────────────────────────────
const LS_KEY = 'pointLocationOverrides';
const getLocal = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; } };
const setLocal = (v)  => { try { localStorage.setItem(LS_KEY, JSON.stringify(v)); } catch {} };

// ── 포인트 타입 정보 (아이콘 + 색상) ───────────────────────────────────
const TYPE_META = {
  '방파제': { emoji: '🚧', color: '#64B5F6', bg: 'rgba(100,181,246,0.15)', border: 'rgba(100,181,246,0.35)' },
  '갯바위': { emoji: '🪨', color: '#FFD700', bg: 'rgba(255,215,0,0.12)',   border: 'rgba(255,215,0,0.35)'   },
  '항구':   { emoji: '⚓', color: '#00C48C', bg: 'rgba(0,196,140,0.12)',   border: 'rgba(0,196,140,0.35)'   },
  '민물':   { emoji: '🌊', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.35)' },
};
const DEFAULT_META = { emoji: '📍', color: '#8E8E93', bg: 'rgba(142,142,147,0.12)', border: 'rgba(142,142,147,0.3)' };
const getMeta = (type) => TYPE_META[type] || DEFAULT_META;

// ── 전체 포인트 (시크릿 제외, 일반 포인트만) ───────────────────────────
const ALL_POINTS = ALL_FISHING_POINTS.filter(p => !p.secret);
const ALL_TYPES  = ['전체', ...new Set(ALL_POINTS.map(p => p.type))];
const ALL_REGIONS = ['전체', ...new Set(ALL_POINTS.map(p => p.region))];
const POINT_TYPES = ['방파제', '갯바위', '항구', '민물'];
const REGIONS_LIST = ['강원', '경북', '경남', '부산', '전남', '전북', '충남', '인천', '경기', '제주', '울산', '대구', '광주', '서울', '세종', '기타'];

export default function PointLocationAdmin() {
  const navigate  = useNavigate();
  const addToast  = useToastStore(s => s.addToast);

  // ── 인증 ──────────────────────────────────────────────────────────────
  const isAdmin = useUserStore(s =>
    s.user?.id === ADMIN_ID || s.user?.email === ADMIN_EMAIL ||
    s.user?.email === 'sunjulab.k@gmail.com' || s.userTier === 'MASTER'
  );
  const [authChecked, setAuthChecked] = useState(false);
  const [debugMsg,    setDebugMsg]    = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setAuthChecked(true);
      const { user, userTier } = useUserStore.getState();
      const ok = user?.id === ADMIN_ID || user?.email === ADMIN_EMAIL ||
                 user?.email === 'sunjulab.k@gmail.com' || userTier === 'MASTER';
      if (!ok) {
        setDebugMsg(JSON.stringify({ id: user?.id, email: user?.email, tier: userTier }, null, 2));
        addToast('❗ 마스터 권한 필요', 'error');
        setTimeout(() => navigate('/', { replace: true }), 4000);
      }
    }, 0);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  // ── 탭 ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'add'

  // ── 필터 state ────────────────────────────────────────────────────────
  const [filterType,   setFilterType]   = useState('전체');
  const [filterRegion, setFilterRegion] = useState('전체');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [showFilter,   setShowFilter]   = useState(false);

  // ── 선택 / 미리보기 ─────────────────────────────────────────────────
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [previewCoords, setPreviewCoords] = useState(null);
  const [inputMode,     setInputMode]     = useState('click'); // 'click' | 'search'
  const [addrInput,     setAddrInput]     = useState('');
  const [addrResults,   setAddrResults]   = useState([]);
  const [addrSearching, setAddrSearching] = useState(false);

  // ── 저장 state ────────────────────────────────────────────────────────
  const [overrides,    setOverrides]    = useState({});
  const [serverOnline, setServerOnline] = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [saveError,    setSaveError]    = useState(null);
  const savedTimerRef = useRef(null);

  // ── 새 포인트 추가 state ──────────────────────────────────────────────
  const [newPoint, setNewPoint] = useState({ name: '', type: '방파제', region: '경남', lat: null, lng: null });
  const [addCoords,    setAddCoords]    = useState(null); // 지도 클릭 좌표
  const [aiInfo,       setAiInfo]       = useState(null); // AI 생성 정보
  const [aiLoading,    setAiLoading]    = useState(false);
  const [customList,   setCustomList]   = useState([]); // 기존 커스텀 포인트 목록
  const [addSaving,    setAddSaving]    = useState(false);
  const [addSaved,     setAddSaved]     = useState(false);

  // ── 지도 refs ─────────────────────────────────────────────────────────
  const markerRef        = useRef(null);
  const mapInstanceRef   = useRef(null);
  const clickListenerRef = useRef(null);
  const initDoneRef      = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  // ── 오버라이드 로드 (서버 → localStorage fallback) ─────────────────
  const fetchOverrides = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/spot-location-overrides');
      setOverrides(res.data || {});
      setServerOnline(true);
      setSaveError(null);
    } catch (err) {
      const st = err?.response?.status;
      if (st === 401) { setSaveError('토큰 만료. 다시 로그인해주세요.'); return; }
      if (st === 403) { setSaveError('관리자 권한이 필요합니다.'); return; }
      setServerOnline(false);
      setOverrides(getLocal());
    }
  }, []);

  // ── 커스텀 포인트 목록 로드 ──────────────────────────────────────────
  const fetchCustomList = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/custom-points');
      setCustomList(Array.isArray(res.data) ? res.data : []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { if (authChecked && isAdmin) { fetchOverrides(); fetchCustomList(); } }, [authChecked, isAdmin, fetchOverrides, fetchCustomList]);

  // ── 지도 초기화 (callback ref) ───────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mapCallbackRef = useCallback((node) => {
    if (!node || initDoneRef.current) return;
    initDoneRef.current = true;
    const doInit = () => {
      const map = new window.kakao.maps.Map(node, {
        center: new window.kakao.maps.LatLng(36.5, 127.8),
        level: 8,
      });
      mapInstanceRef.current = map;
      setMapReady(true);
    };
    if (window.kakao?.maps?.Map)        doInit();
    else if (window.kakao?.maps)        window.kakao.maps.load(doInit);
    else {
      const retry = setInterval(() => {
        if (window.kakao?.maps?.Map)    { clearInterval(retry); doInit(); }
        else if (window.kakao?.maps)    { clearInterval(retry); window.kakao.maps.load(doInit); }
      }, 200);
    }
  }, []);

  // ── 마커 배치 ──────────────────────────────────────────────────────
  const placeMarker = useCallback((lat, lng, label, source) => {
    if (!mapInstanceRef.current) return;
    const latlng = new window.kakao.maps.LatLng(lat, lng);
    mapInstanceRef.current.setCenter(latlng);
    if (markerRef.current) markerRef.current.setMap(null);
    const marker = new window.kakao.maps.Marker({ position: latlng, map: mapInstanceRef.current });
    const iw = new window.kakao.maps.InfoWindow({
      content: `<div style="padding:5px 9px;font-size:11px;font-weight:700">${label}<br/><span style="font-size:10px;color:#555;font-family:monospace">${lat.toFixed(5)}, ${lng.toFixed(5)}</span></div>`,
    });
    iw.open(mapInstanceRef.current, marker);
    markerRef.current = marker;
    if (activeTab === 'add') {
      setAddCoords({ lat, lng });
      setNewPoint(prev => ({ ...prev, lat, lng }));
    } else {
      setPreviewCoords({ lat, lng, source });
    }
  }, [activeTab]);

  // ── 클릭 모드 리스너 ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    if (clickListenerRef.current) {
      window.kakao.maps.event.removeListener(mapInstanceRef.current, 'click', clickListenerRef.current);
      clickListenerRef.current = null;
    }
    if (inputMode === 'click' || activeTab === 'add') {
      const handler = (e) => placeMarker(e.latLng.getLat(), e.latLng.getLng(), '📍 선택 위치', 'click');
      window.kakao.maps.event.addListener(mapInstanceRef.current, 'click', handler);
      clickListenerRef.current = handler;
    }
    return () => {
      if (clickListenerRef.current && mapInstanceRef.current)
        window.kakao.maps.event.removeListener(mapInstanceRef.current, 'click', clickListenerRef.current);
    };
  }, [inputMode, mapReady, placeMarker, activeTab]);

  // ── 탭 전환 시 지도 높이 변경 → relayout 필수 (CSS transition 후 실행) ──
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const t = setTimeout(() => mapInstanceRef.current?.relayout(), 310); // 300ms transition 완료 후
    return () => clearTimeout(t);
  }, [activeTab, mapReady]);


  useEffect(() => {
    if (!selectedPoint || !mapReady || !mapInstanceRef.current) return;
    const ov = overrides[String(selectedPoint.id)];
    const lat = ov?.lat ?? selectedPoint.lat;
    const lng = ov?.lng ?? selectedPoint.lng;
    mapInstanceRef.current.setCenter(new window.kakao.maps.LatLng(lat, lng));
    mapInstanceRef.current.setLevel(5);
    if (markerRef.current) markerRef.current.setMap(null);
    markerRef.current = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(lat, lng),
      map: mapInstanceRef.current,
    });
    setPreviewCoords(null);
  }, [selectedPoint, mapReady]); // eslint-disable-line

  // ── 주소 검색 ────────────────────────────────────────────────────────
  const handleAddrSearch = () => {
    if (!addrInput.trim()) return;
    setAddrSearching(true); setAddrResults([]);
    window.kakao.maps.load(() => {
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.addressSearch(addrInput, (result, st) => {
        if (st === window.kakao.maps.services.Status.OK && result.length > 0) {
          setAddrResults(result.map(r => ({ address: r.address_name, lat: parseFloat(r.y), lng: parseFloat(r.x) })));
          setAddrSearching(false);
        } else {
          new window.kakao.maps.services.Places().keywordSearch(addrInput, (pRes, pSt) => {
            setAddrSearching(false);
            if (pSt === window.kakao.maps.services.Status.OK)
              setAddrResults(pRes.slice(0, 6).map(r => ({ address: `${r.place_name} (${r.address_name})`, lat: parseFloat(r.y), lng: parseFloat(r.x) })));
          });
        }
      });
    });
  };

  // ── 저장 ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedPoint || !previewCoords) return;
    setSaving(true); setSaveError(null);
    try {
      await apiClient.post('/api/spot-location-overrides', {
        id: selectedPoint.id, lat: previewCoords.lat, lng: previewCoords.lng,
        type: selectedPoint.type, name: selectedPoint.name,
      });
      setServerOnline(true);
    } catch (err) {
      const st = err?.response?.status;
      if (st === 401) { setSaveError('⚠️ 토큰 만료. 로그아웃 후 재로그인 필요.'); setSaving(false); return; }
      if (st === 403) { setSaveError('⚠️ 관리자 권한 필요.'); setSaving(false); return; }
      // 네트워크 오류 → 로컬 저장
      setServerOnline(false);
      const local = getLocal();
      local[selectedPoint.id] = { lat: previewCoords.lat, lng: previewCoords.lng, type: selectedPoint.type, name: selectedPoint.name };
      setLocal(local);
    } finally { setSaving(false); }
    await fetchOverrides();
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    setSaved(true);
    savedTimerRef.current = setTimeout(() => { setSaved(false); savedTimerRef.current = null; }, 2200);
  };

  // ── 초기화 ────────────────────────────────────────────────────────────
  const handleReset = async (id) => {
    try {
      await apiClient.delete(`/api/spot-location-overrides/${id}`);
      setSaveError(null);
    } catch (err) {
      const st = err?.response?.status;
      if (st === 401 || st === 403) { setSaveError('⚠️ 권한 오류로 초기화 실패.'); return; }
      const local = getLocal(); delete local[id]; setLocal(local);
    }
    await fetchOverrides();
  };

  // ── AI 낚시 정보 자동 생성 ───────────────────────────────────────────
  const handleAiGenerate = async () => {
    if (!newPoint.name || !newPoint.type) { addToast('포인트 이름과 타입을 먼저 입력하세요.', 'error'); return; }
    setAiLoading(true); setAiInfo(null);
    try {
      const nearest = (newPoint.lat && newPoint.lng)
        ? findNearestStation(newPoint.lat, newPoint.lng)
        : null;
      const res = await apiClient.post('/api/ai/generate-point-info', {
        name: newPoint.name,
        type: newPoint.type,
        region: newPoint.region,
        lat: newPoint.lat,
        lng: newPoint.lng,
        obsCode: nearest?.id || null,
      });
      setAiInfo(res.data);
      addToast('✨ AI 낚시 정보 생성 완료!', 'success');
    } catch (err) {
      addToast('AI 생성 실패. 다시 시도해주세요.', 'error');
    } finally { setAiLoading(false); }
  };

  // ── 새 포인트 저장 ───────────────────────────────────────────────────
  const handleAddPoint = async () => {
    if (!newPoint.name.trim()) { addToast('포인트 이름을 입력하세요.', 'error'); return; }
    if (!newPoint.lat || !newPoint.lng) { addToast('지도를 탭하여 위치를 선택하세요.', 'error'); return; }
    setAddSaving(true);
    try {
      const nearest = findNearestStation(newPoint.lat, newPoint.lng);
      await apiClient.post('/api/custom-points', {
        name: newPoint.name,
        type: newPoint.type,
        region: newPoint.region,
        lat: newPoint.lat,
        lng: newPoint.lng,
        fish: aiInfo?.fish || '미확인',
        obsCode: nearest?.id || null,
        aiDescription: aiInfo?.description || null,
        season: aiInfo?.season || null,
        recommend: aiInfo?.recommend || null,
        status: aiInfo?.status || '보통',
      });
      setAddSaved(true);
      addToast(`✅ "${newPoint.name}" 포인트 추가 완료!`, 'success');
      // 초기화
      setNewPoint({ name: '', type: '방파제', region: '경남', lat: null, lng: null });
      setAddCoords(null);
      setAiInfo(null);
      if (markerRef.current) { markerRef.current.setMap(null); markerRef.current = null; }
      await fetchCustomList();
      setTimeout(() => setAddSaved(false), 2000);
    } catch (err) {
      addToast('저장 실패. 다시 시도해주세요.', 'error');
    } finally { setAddSaving(false); }
  };

  // ── 커스텀 포인트 삭제 ───────────────────────────────────────────────
  const handleDeleteCustom = async (id, name) => {
    if (!window.confirm(`"${name}" 포인트를 삭제하시겠습니까?`)) return;
    try {
      await apiClient.delete(`/api/custom-points/${id}`);
      addToast('포인트 삭제 완료', 'success');
      await fetchCustomList();
    } catch { addToast('삭제 실패', 'error'); }
  };

  // ── 필터된 포인트 목록 ────────────────────────────────────────────────
  const filteredPoints = ALL_POINTS.filter(p => {
    if (filterType !== '전체' && p.type !== filterType) return false;
    if (filterRegion !== '전체' && p.region !== filterRegion) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.region.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const overrideCount = Object.keys(overrides).length;

  // ── 인증 실패 화면 ────────────────────────────────────────────────────
  if (!authChecked || debugMsg) return (
    <div style={{ minHeight: '100vh', background: '#0A0F1C', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      {debugMsg ? (
        <>
          <div style={{ fontSize: '22px', marginBottom: '12px' }}>🔐 권한 확인 실패</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '20px' }}>4초 후 홈으로 이동</div>
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(220,38,38,0.97)', backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '20px 20px 0 0' }}>
            <pre style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{debugMsg}</pre>
          </div>
        </>
      ) : (
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>인증 확인 중...</div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1C', color: '#fff', fontFamily: 'Pretendard, sans-serif' }}>

      {/* ── 오류 배너 ── */}
      {saveError && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, background: 'rgba(220,38,38,0.95)', backdropFilter: 'blur(8px)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{ color: '#fff', fontSize: '14px', fontWeight: '800' }}>{saveError}</span>
          <button onClick={() => setSaveError(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', color: '#fff', padding: '4px 10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>닫기</button>
        </div>
      )}

      {/* ── 저장 완료 오버레이 ── */}
      {saved && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg,#00C48C,#007B5E)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={36} color="#fff" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900' }}>저장 완료!</div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{selectedPoint?.name}</div>
          {previewCoords && <div style={{ fontSize: '13px', color: '#00C48C', fontFamily: 'monospace' }}>{previewCoords.lat.toFixed(5)}, {previewCoords.lng.toFixed(5)}</div>}
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>모든 사용자에게 실시간 반영됩니다 ✅</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>2초 후 자동 닫힙니다...</div>
        </div>
      )}

      {/* ── 포인트 추가 완료 오버레이 ── */}
      {addSaved && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg,#FF6B35,#FF3D00)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={36} color="#fff" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900' }}>포인트 추가 완료!</div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{newPoint.name || '새 포인트'}</div>
          <div style={{ fontSize: '12px', color: '#FF6B35', marginTop: '6px' }}>지도에 ★ 마커로 표시됩니다</div>
        </div>
      )}

      {/* ── 헤더 ── */}
      <div style={{ background: 'linear-gradient(135deg,#0A0F1C,#1A2340)', padding: '52px 20px 14px', borderBottom: '1px solid rgba(255,215,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/mypage')} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '12px', padding: '10px', cursor: 'pointer', color: '#fff', display: 'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,215,0,0.7)', fontWeight: '900', letterSpacing: '0.15em' }}>⚙️ MASTER ADMIN</div>
            <div style={{ fontSize: '18px', fontWeight: '900' }}>낚시 포인트 관리</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {serverOnline
              ? <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,196,140,0.15)', border: '1px solid rgba(0,196,140,0.3)', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', color: '#00C48C', fontWeight: '800' }}><Wifi size={12} />서버연결</div>
              : <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', color: '#FF6B6B', fontWeight: '800' }}><WifiOff size={12} />로컬저장</div>
            }
          </div>
        </div>

        {/* ── 탭 메뉴 ── */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
          <button onClick={() => setActiveTab('edit')} style={{ flex: 1, padding: '10px', borderRadius: '12px', cursor: 'pointer', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: activeTab === 'edit' ? 'rgba(100,181,246,0.18)' : 'rgba(255,255,255,0.06)', color: activeTab === 'edit' ? '#64B5F6' : 'rgba(255,255,255,0.45)', border: activeTab === 'edit' ? '1.5px solid rgba(100,181,246,0.4)' : '1px solid transparent' }}>
            <MapPin size={14} /> 위치 수정 {overrideCount > 0 && <span style={{ background: '#64B5F6', color: '#000', borderRadius: '10px', padding: '1px 6px', fontSize: '10px' }}>{overrideCount}</span>}
          </button>
          <button onClick={() => setActiveTab('add')} style={{ flex: 1, padding: '10px', borderRadius: '12px', cursor: 'pointer', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: activeTab === 'add' ? 'rgba(255,107,53,0.18)' : 'rgba(255,255,255,0.06)', color: activeTab === 'add' ? '#FF6B35' : 'rgba(255,255,255,0.45)', border: activeTab === 'add' ? '1.5px solid rgba(255,107,53,0.4)' : '1px solid transparent' }}>
            <Plus size={14} /> 포인트 추가 {customList.length > 0 && <span style={{ background: '#FF6B35', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '10px' }}>{customList.length}</span>}
          </button>
        </div>
      </div>

      {/* ── 지도 ── */}
      <div style={{ position: 'relative' }}>
        <div ref={mapCallbackRef} style={{ width: '100%', height: activeTab === 'add' ? '220px' : (selectedPoint ? '260px' : '160px'), background: '#1a2340', transition: 'height 0.3s' }} />
        {activeTab === 'add' && (
          <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,107,53,0.92)', color: '#fff', fontSize: '12px', fontWeight: '800', padding: '5px 16px', borderRadius: '20px', pointerEvents: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MousePointer size={13} /> 지도를 탭하여 포인트 위치 선택
          </div>
        )}
        {activeTab === 'edit' && selectedPoint && inputMode === 'click' && (
          <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,196,140,0.92)', color: '#fff', fontSize: '12px', fontWeight: '800', padding: '5px 16px', borderRadius: '20px', pointerEvents: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MousePointer size={13} /> 탭하여 새 위치 선택
          </div>
        )}
        {(previewCoords || addCoords) && (
          <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', color: activeTab === 'add' ? '#FF6B35' : '#00C48C', fontSize: '12px', fontWeight: '800', padding: '6px 14px', borderRadius: '20px', pointerEvents: 'none', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
            {(activeTab === 'add' ? addCoords : previewCoords)?.lat.toFixed(5)}, {(activeTab === 'add' ? addCoords : previewCoords)?.lng.toFixed(5)}
          </div>
        )}
      </div>

      {/* ═══════════ 탭: 위치 수정 ═══════════ */}
      {activeTab === 'edit' && (
        <>
          {/* ── 저장 버튼 ── */}
          {selectedPoint && previewCoords && (
            <div style={{ padding: '10px 20px', background: '#0A0F1C', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '14px', fontWeight: '900', fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', background: saving ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#00C48C,#007B5E)', color: saving ? 'rgba(255,255,255,0.4)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}
              >
                <CheckCircle size={18} />
                {saving ? '저장 중...' : (serverOnline ? '🌐 서버에 저장 (전체 반영)' : '💾 로컬 저장')}
              </button>
            </div>
          )}

          <div style={{ padding: '16px 20px', paddingBottom: '60px' }}>

            {/* ── 검색 + 필터 ── */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="포인트명 또는 지역 검색..."
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 34px', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff', fontSize: '13px', outline: 'none' }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex' }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button onClick={() => setShowFilter(f => !f)} style={{ padding: '10px 14px', background: showFilter ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.07)', border: `1px solid ${showFilter ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.12)'}`, borderRadius: '12px', color: showFilter ? '#FFD700' : 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '800' }}>
                  <Filter size={14} /> 필터
                </button>
              </div>

              {showFilter && (
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', marginBottom: '6px' }}>포인트 타입</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {ALL_TYPES.map(t => {
                        const meta = TYPE_META[t];
                        const active = filterType === t;
                        return (
                          <button key={t} onClick={() => setFilterType(t)} style={{ padding: '5px 12px', borderRadius: '10px', border: active ? `1px solid ${meta?.border || 'rgba(255,215,0,0.4)'}` : '1px solid transparent', fontSize: '12px', fontWeight: '900', cursor: 'pointer', background: active ? (meta?.bg || 'rgba(255,215,0,0.2)') : 'rgba(255,255,255,0.07)', color: active ? (meta?.color || '#FFD700') : 'rgba(255,255,255,0.5)' }}>
                            {meta?.emoji || ''} {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', marginBottom: '6px' }}>지역</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {ALL_REGIONS.map(r => (
                        <button key={r} onClick={() => setFilterRegion(r)} style={{ padding: '5px 12px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: '900', cursor: 'pointer', background: filterRegion === r ? 'rgba(100,181,246,0.2)' : 'rgba(255,255,255,0.07)', color: filterRegion === r ? '#64B5F6' : 'rgba(255,255,255,0.5)' }}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── 선택된 포인트 입력 모드 ── */}
            {selectedPoint && (
              <div style={{ marginBottom: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '16px', padding: '14px' }}>
                {(() => { const meta = getMeta(selectedPoint.type); return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '36px', height: '36px', background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{meta.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: meta.color }}>{selectedPoint.name}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{selectedPoint.region} · {selectedPoint.type}</div>
                    </div>
                    <button onClick={() => { setSelectedPoint(null); setPreviewCoords(null); }} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '800' }}>해제</button>
                  </div>
                ); })()}

                {/* 모드 탭 */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button onClick={() => setInputMode('click')} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: inputMode === 'click' ? 'linear-gradient(135deg,#00C48C,#007B5E)' : 'rgba(255,255,255,0.07)', color: inputMode === 'click' ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                    <MousePointer size={14} /> 지도 클릭
                  </button>
                  <button onClick={() => setInputMode('search')} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: inputMode === 'search' ? 'linear-gradient(135deg,#FFD700,#FFA000)' : 'rgba(255,255,255,0.07)', color: inputMode === 'search' ? '#000' : 'rgba(255,255,255,0.5)' }}>
                    <Search size={14} /> 주소 검색
                  </button>
                </div>

                {/* 주소 검색 UI */}
                {inputMode === 'search' && (
                  <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input type="text" value={addrInput} onChange={e => setAddrInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddrSearch()} placeholder="장소명 또는 주소"
                        style={{ flex: 1, padding: '10px 12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none' }} />
                      <button onClick={handleAddrSearch} disabled={addrSearching} style={{ padding: '0 14px', background: 'linear-gradient(135deg,#FFD700,#FFA000)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '900', color: '#000', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {addrSearching ? '...' : <><Search size={13} />검색</>}
                      </button>
                    </div>
                    {addrResults.length > 0 && (
                      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {addrResults.map((r, i) => (
                          <button key={r.address} onClick={() => { placeMarker(r.lat, r.lng, r.address, 'search'); setAddrResults([]); setAddrInput(r.address); setInputMode('click'); }}
                            style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', borderBottom: i < addrResults.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <MapPin size={12} color="#FFD700" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: '700' }}>{r.address}</div>
                              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{r.lat.toFixed(5)}, {r.lng.toFixed(5)}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── 포인트 목록 ── */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>📍 포인트 선택 ({filteredPoints.length}개)</span>
                {(filterType !== '전체' || filterRegion !== '전체' || searchQuery) && (
                  <button onClick={() => { setFilterType('전체'); setFilterRegion('전체'); setSearchQuery(''); }} style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', fontSize: '11px', fontWeight: '800' }}>필터 초기화</button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '360px', overflowY: 'auto' }}>
                {filteredPoints.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.3)', fontSize: '13px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>검색 결과가 없습니다.</div>
                )}
                {filteredPoints.map(p => {
                  const ov = overrides[String(p.id)];
                  const isSelected = selectedPoint?.id === p.id;
                  const meta = getMeta(p.type);
                  return (
                    <button key={p.id}
                      onClick={() => { setSelectedPoint(p); setAddrInput(''); setAddrResults([]); setPreviewCoords(null); setInputMode('click'); }}
                      style={{ background: isSelected ? meta.bg : 'rgba(255,255,255,0.03)', border: `${isSelected ? '1.5px' : '1px'} solid ${isSelected ? meta.border : 'rgba(255,255,255,0.07)'}`, borderRadius: '12px', padding: '9px 12px', cursor: 'pointer', color: '#fff', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <span style={{ fontSize: '16px', flexShrink: 0 }}>{meta.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: isSelected ? meta.color : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: '10px', color: ov ? meta.color : 'rgba(255,255,255,0.3)', fontFamily: 'monospace', marginTop: '1px' }}>
                          {ov ? `🔧 ${ov.lat.toFixed(4)}, ${ov.lng.toFixed(4)}` : `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`}
                          <span style={{ marginLeft: '6px', color: 'rgba(255,255,255,0.25)', fontFamily: 'inherit', fontWeight: '700' }}>{p.region}</span>
                        </div>
                      </div>
                      {ov && (
                        <button onClick={e => { e.stopPropagation(); handleReset(p.id); }}
                          style={{ fontSize: '10px', color: '#FF6B6B', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '6px', padding: '3px 7px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <RotateCcw size={9} />초기화
                        </button>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── 수정된 포인트 요약 ── */}
            {overrideCount > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={12} color="#FFD700" /> 수정된 포인트 ({overrideCount}개) {serverOnline && <span style={{ color: '#00C48C', fontSize: '10px' }}>● 서버 반영됨</span>}
                </div>
                {Object.entries(overrides).map(([id, coords]) => {
                  const p = ALL_POINTS.find(x => String(x.id) === String(id));
                  if (!p) return null;
                  const meta = getMeta(p.type);
                  return (
                    <div key={id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,215,0,0.12)', borderRadius: '10px', padding: '9px 13px', marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>{meta.emoji}</span>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: meta.color }}>{p.name}</div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => { setSelectedPoint(p); if (mapInstanceRef.current) { mapInstanceRef.current.setCenter(new window.kakao.maps.LatLng(coords.lat, coords.lng)); mapInstanceRef.current.setLevel(5); } }}
                          style={{ fontSize: '11px', color: '#4FC3F7', background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.2)', borderRadius: '7px', padding: '4px 8px', cursor: 'pointer' }}>보기</button>
                        <button onClick={() => handleReset(parseInt(id))}
                          style={{ fontSize: '11px', color: '#FF6B6B', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '7px', padding: '4px 8px', cursor: 'pointer' }}>초기화</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════ 탭: 새 포인트 추가 ═══════════ */}
      {activeTab === 'add' && (
        <div style={{ padding: '16px 20px', paddingBottom: '80px' }}>

          {/* ── 입력 폼 ── */}
          <div style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#FF6B35', fontWeight: '900', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} /> 새 낚시 포인트 추가
            </div>

            {/* 이름 */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '5px', fontWeight: '700' }}>포인트 이름 *</div>
              <input
                type="text"
                value={newPoint.name}
                onChange={e => setNewPoint(p => ({ ...p, name: e.target.value }))}
                placeholder="예: 통영 사량도 갯바위"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
            </div>

            {/* 타입 + 지역 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '5px', fontWeight: '700' }}>타입 *</div>
                <select
                  value={newPoint.type}
                  onChange={e => setNewPoint(p => ({ ...p, type: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', background: '#1A2340', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none' }}
                >
                  {POINT_TYPES.map(t => <option key={t} value={t}>{TYPE_META[t]?.emoji} {t}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '5px', fontWeight: '700' }}>지역 *</div>
                <select
                  value={newPoint.region}
                  onChange={e => setNewPoint(p => ({ ...p, region: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', background: '#1A2340', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none' }}
                >
                  {REGIONS_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* 좌표 표시 */}
            <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={14} color={addCoords ? '#FF6B35' : 'rgba(255,255,255,0.3)'} />
              <div style={{ fontSize: '12px', color: addCoords ? '#FF6B35' : 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontWeight: '700' }}>
                {addCoords ? `${addCoords.lat.toFixed(5)}, ${addCoords.lng.toFixed(5)}` : '위 지도를 탭하여 위치 선택'}
              </div>
            </div>

            {/* AI 자동 생성 버튼 */}
            <button
              onClick={handleAiGenerate}
              disabled={aiLoading || !newPoint.name || !newPoint.type}
              style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '12px', cursor: (!newPoint.name || aiLoading) ? 'not-allowed' : 'pointer', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', marginBottom: '10px', background: (!newPoint.name || aiLoading) ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg,#7C3AED,#4C1D95)', color: (!newPoint.name || aiLoading) ? 'rgba(255,255,255,0.3)' : '#fff', boxShadow: (!newPoint.name || aiLoading) ? 'none' : '0 4px 16px rgba(124,58,237,0.4)' }}
            >
              <Sparkles size={15} />
              {aiLoading ? '🤖 AI가 낚시 정보 생성 중...' : '✨ AI 낚시 정보 자동 생성'}
            </button>

            {/* AI 결과 미리보기 */}
            {aiInfo && (
              <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '12px', padding: '12px', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#A78BFA', fontWeight: '900', marginBottom: '8px' }}>🤖 AI 생성 낚시 정보</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>🐟 어종: </span><span style={{ fontSize: '12px', color: '#fff', fontWeight: '700' }}>{aiInfo.fish}</span></div>
                  {aiInfo.description && <div><span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>📝 특징: </span><span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{aiInfo.description}</span></div>}
                  {aiInfo.season && <div><span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>🗓 시즌: </span><span style={{ fontSize: '12px', color: '#FFD700' }}>{aiInfo.season}</span></div>}
                  {aiInfo.recommend && <div><span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>🎣 채비: </span><span style={{ fontSize: '12px', color: '#00C48C' }}>{aiInfo.recommend}</span></div>}
                  {aiInfo.status && <div><span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>📊 컨디션: </span><span style={{ fontSize: '12px', color: '#FF9B26', fontWeight: '800' }}>{aiInfo.status}</span></div>}
                </div>
              </div>
            )}

            {/* 저장 버튼 */}
            <button
              onClick={handleAddPoint}
              disabled={addSaving || !newPoint.name || !addCoords}
              style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '14px', cursor: (addSaving || !newPoint.name || !addCoords) ? 'not-allowed' : 'pointer', fontWeight: '900', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: (addSaving || !newPoint.name || !addCoords) ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#FF6B35,#FF3D00)', color: (addSaving || !newPoint.name || !addCoords) ? 'rgba(255,255,255,0.3)' : '#fff', boxShadow: (addSaving || !newPoint.name || !addCoords) ? 'none' : '0 6px 20px rgba(255,107,53,0.4)' }}
            >
              <Plus size={18} />
              {addSaving ? '저장 중...' : '🗺 포인트 추가 (지도에 ★ 표시)'}
            </button>
          </div>

          {/* ── 기존 커스텀 포인트 목록 ── */}
          {customList.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Star size={12} color="#FF6B35" /> 추가된 커스텀 포인트 ({customList.length}개)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {customList.map(p => {
                  const meta = getMeta(p.type);
                  return (
                    <div key={p.id} style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.15)', borderRadius: '12px', padding: '10px 13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>★</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#FF6B35', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', marginTop: '1px' }}>
                          {meta.emoji} {p.type} · {p.region} · {p.lat?.toFixed(4)}, {p.lng?.toFixed(4)}
                        </div>
                        {p.fish && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>🐟 {p.fish}</div>}
                      </div>
                      <button
                        onClick={() => handleDeleteCustom(p.id, p.name)}
                        style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', color: '#FF6B6B', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: '800', flexShrink: 0 }}
                      >
                        <Trash2 size={12} /> 삭제
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {customList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.2)', fontSize: '13px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '14px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗺</div>
              <div>아직 추가된 커스텀 포인트가 없습니다.</div>
              <div style={{ fontSize: '11px', marginTop: '4px', color: 'rgba(255,255,255,0.15)' }}>위 양식에서 새 포인트를 추가하세요</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
