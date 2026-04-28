import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Search, MapPin, CheckCircle, Star, MousePointer, RotateCcw, Zap, Wifi, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SECRET_FISHING_POINTS } from '../constants/fishingData';
import apiClient from '../api/index';

export default function SecretPointAdmin() {
  const navigate = useNavigate();
  const markerRef       = useRef(null);
  const mapInstanceRef  = useRef(null);
  const clickListenerRef= useRef(null);
  const initDoneRef     = useRef(false);

  const [selectedPoint, setSelectedPoint] = useState(null);
  const [addressInput,  setAddressInput]  = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching,     setSearching]     = useState(false);
  const [previewCoords, setPreviewCoords] = useState(null);
  const [overrides,     setOverrides]     = useState({});
  const [mapReady,      setMapReady]      = useState(false);
  const [inputMode,     setInputMode]     = useState('click');
  const [saved,         setSaved]         = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [serverOnline,  setServerOnline]  = useState(true);

  /* ── 서버에서 오버라이드 불러오기 ── */
  const fetchOverrides = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/secret-point-overrides');
      setOverrides(res.data || {});
      setServerOnline(true);
    } catch {
      setServerOnline(false);
      // 서버 오프라인 시 localStorage fallback
      try { setOverrides(JSON.parse(localStorage.getItem('secretPointOverrides') || '{}')); } catch {}
    }
  }, []);

  useEffect(() => { fetchOverrides(); }, [fetchOverrides]);

  /* ── 지도 초기화: callback ref ── */
  const mapCallbackRef = useCallback((node) => {
    if (!node || initDoneRef.current) return;
    initDoneRef.current = true;
    const doInit = () => {
      const map = new window.kakao.maps.Map(node, {
        center: new window.kakao.maps.LatLng(36.0, 127.8),
        level: 7,
      });
      mapInstanceRef.current = map;
      setMapReady(true);
    };
    if (window.kakao?.maps?.Map) doInit();
    else window.kakao.maps.load(doInit);
  }, []);

  /* ── 클릭 모드 리스너 ── */
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    if (clickListenerRef.current) {
      window.kakao.maps.event.removeListener(mapInstanceRef.current, 'click', clickListenerRef.current);
      clickListenerRef.current = null;
    }
    if (inputMode === 'click') {
      const handler = (e) => placeMarker(e.latLng.getLat(), e.latLng.getLng(), '📍 선택 위치', 'click');
      window.kakao.maps.event.addListener(mapInstanceRef.current, 'click', handler);
      clickListenerRef.current = handler;
    }
    return () => {
      if (clickListenerRef.current && mapInstanceRef.current)
        window.kakao.maps.event.removeListener(mapInstanceRef.current, 'click', clickListenerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMode, mapReady]);

  /* ── 포인트 선택 → 지도 이동 ── */
  useEffect(() => {
    if (!selectedPoint || !mapInstanceRef.current || !mapReady) return;
    const ov = overrides[String(selectedPoint.id)];
    const lat = ov?.lat ?? selectedPoint.lat;
    const lng = ov?.lng ?? selectedPoint.lng;
    const latlng = new window.kakao.maps.LatLng(lat, lng);
    mapInstanceRef.current.setCenter(latlng);
    mapInstanceRef.current.setLevel(6);
    if (markerRef.current) markerRef.current.setMap(null);
    markerRef.current = new window.kakao.maps.Marker({ position: latlng, map: mapInstanceRef.current });
    setPreviewCoords(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoint, mapReady]);

  /* ── 마커 놓기 ── */
  const placeMarker = (lat, lng, label, source) => {
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
    setPreviewCoords({ lat, lng, source });
  };

  /* ── 주소 검색 ── */
  const handleSearch = () => {
    if (!addressInput.trim()) return;
    setSearching(true); setSearchResults([]);
    window.kakao.maps.load(() => {
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.addressSearch(addressInput, (result, st) => {
        if (st === window.kakao.maps.services.Status.OK && result.length > 0) {
          setSearchResults(result.map(r => ({ address: r.address_name, lat: parseFloat(r.y), lng: parseFloat(r.x) })));
          setSearching(false);
        } else {
          new window.kakao.maps.services.Places().keywordSearch(addressInput, (pResult, pSt) => {
            setSearching(false);
            if (pSt === window.kakao.maps.services.Status.OK)
              setSearchResults(pResult.slice(0, 6).map(r => ({ address: `${r.place_name} (${r.address_name})`, lat: parseFloat(r.y), lng: parseFloat(r.x) })));
          });
        }
      });
    });
  };

  /* ── 저장 → 서버 POST ── */
  const handleSave = async () => {
    if (!selectedPoint || !previewCoords) return;
    setSaving(true);
    try {
      await apiClient.post('/api/secret-point-overrides', {
        id: selectedPoint.id,
        lat: previewCoords.lat,
        lng: previewCoords.lng,
      });
      setServerOnline(true);
    } catch {
      // 서버 오프라인 시 localStorage fallback
      setServerOnline(false);
      const ov = JSON.parse(localStorage.getItem('secretPointOverrides') || '{}');
      ov[selectedPoint.id] = { lat: previewCoords.lat, lng: previewCoords.lng };
      localStorage.setItem('secretPointOverrides', JSON.stringify(ov));
    }
    setSaving(false);
    await fetchOverrides();
    setSaved(true);
    setTimeout(() => { window.location.reload(); }, 2200);
  };

  /* ── 초기화 → 서버 DELETE ── */
  const handleReset = async (id) => {
    try {
      await apiClient.delete(`/api/secret-point-overrides/${id}`);
    } catch {
      const ov = JSON.parse(localStorage.getItem('secretPointOverrides') || '{}');
      delete ov[id]; localStorage.setItem('secretPointOverrides', JSON.stringify(ov));
    }
    await fetchOverrides();
  };

  const overrideCount = Object.keys(overrides).length;

  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1C', color: '#fff', fontFamily: 'Pretendard, sans-serif' }}>

      {/* 저장 완료 오버레이 */}
      {saved && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, #00C48C, #007B5E)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={36} color="#fff" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900' }}>저장 완료!</div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{selectedPoint?.name?.replace('⭐ ', '')}</div>
          <div style={{ fontSize: '13px', color: '#00C48C', fontFamily: 'monospace' }}>{previewCoords?.lat.toFixed(5)}, {previewCoords?.lng.toFixed(5)}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>모든 사용자에게 실시간 반영됩니다 ✅</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>잠시 후 자동 새로고침...</div>
        </div>
      )}

      {/* 헤더 */}
      <div style={{ background: 'linear-gradient(135deg, #0A0F1C, #1A2340)', padding: '52px 20px 16px', borderBottom: '1px solid rgba(255,215,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/mypage')} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '12px', padding: '10px', cursor: 'pointer', color: '#fff', display: 'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,215,0,0.7)', fontWeight: '900', letterSpacing: '0.15em' }}>⚙️ MASTER ADMIN</div>
            <div style={{ fontSize: '18px', fontWeight: '900' }}>비밀포인트 위치 수정</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {serverOnline
              ? <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,196,140,0.15)', border: '1px solid rgba(0,196,140,0.3)', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', color: '#00C48C', fontWeight: '800' }}><Wifi size={12} />서버연결</div>
              : <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', color: '#FF6B6B', fontWeight: '800' }}><WifiOff size={12} />로컬저장</div>
            }
            {overrideCount > 0 && <div style={{ background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', color: '#FFD700', fontWeight: '800' }}>{overrideCount}개</div>}
          </div>
        </div>
      </div>

      {/* 지도 (항상 존재) */}
      <div style={{ position: 'relative' }}>
        <div ref={mapCallbackRef} style={{ width: '100%', height: selectedPoint ? '260px' : '180px', background: '#1a2340', transition: 'height 0.3s' }} />
        {selectedPoint && inputMode === 'click' && (
          <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,196,140,0.92)', color: '#fff', fontSize: '12px', fontWeight: '800', padding: '5px 16px', borderRadius: '20px', pointerEvents: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MousePointer size={13} /> 탭하여 위치 선택
          </div>
        )}
        {!selectedPoint && mapReady && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,15,28,0.5)', pointerEvents: 'none' }}>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>아래에서 포인트를 선택하세요</div>
          </div>
        )}
        {previewCoords && (
          <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', color: previewCoords.source === 'click' ? '#00C48C' : '#FFD700', fontSize: '12px', fontWeight: '800', padding: '6px 14px', borderRadius: '20px', pointerEvents: 'none', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
            {previewCoords.lat.toFixed(5)}, {previewCoords.lng.toFixed(5)}
          </div>
        )}
      </div>

      {/* 저장 버튼 */}
      {selectedPoint && previewCoords && (
        <div style={{ padding: '10px 20px', background: '#0A0F1C', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '14px', fontWeight: '900', fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', background: saving ? 'rgba(255,255,255,0.1)' : (previewCoords.source === 'click' ? 'linear-gradient(135deg, #00C48C, #007B5E)' : 'linear-gradient(135deg, #FFD700, #FFA000)'), color: saving ? 'rgba(255,255,255,0.4)' : (previewCoords.source === 'click' ? '#fff' : '#000'), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}
          >
            <CheckCircle size={18} />
            {saving ? '저장 중...' : (serverOnline ? '🌐 서버에 저장 (전체 반영)' : '💾 로컬 저장')}
          </button>
        </div>
      )}

      <div style={{ padding: '16px 20px', paddingBottom: '40px' }}>

        {/* 포인트 선택 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,215,0,0.8)', fontWeight: '900', letterSpacing: '0.12em', marginBottom: '10px' }}>
            📍 포인트 선택 {selectedPoint && <span style={{ color: '#FFD700', fontSize: '12px' }}>— {selectedPoint.name.replace('⭐ ', '')}</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '200px', overflowY: 'auto' }}>
            {SECRET_FISHING_POINTS.map(p => {
              const ov = overrides[String(p.id)];
              const isSelected = selectedPoint?.id === p.id;
              return (
                <button key={p.id} onClick={() => { setSelectedPoint(p); setAddressInput(''); setSearchResults([]); setPreviewCoords(null); }}
                  style={{ background: isSelected ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)', border: isSelected ? '1.5px solid rgba(255,215,0,0.5)' : '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '9px 13px', cursor: 'pointer', color: '#fff', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Star size={12} fill={isSelected ? '#FFD700' : 'none'} color={isSelected ? '#FFD700' : '#444'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: isSelected ? '#FFD700' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name.replace('⭐ ', '')}</div>
                    <div style={{ fontSize: '10px', fontFamily: 'monospace', marginTop: '1px', color: ov ? '#FFD700' : 'rgba(255,255,255,0.3)' }}>
                      {ov ? `🔧 ${ov.lat.toFixed(4)}, ${ov.lng.toFixed(4)}` : `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`}
                    </div>
                  </div>
                  {ov && (
                    <button onClick={e => { e.stopPropagation(); handleReset(p.id); }} style={{ fontSize: '10px', color: '#FF6B6B', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '6px', padding: '3px 7px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <RotateCcw size={9} />초기화
                    </button>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 모드 선택 */}
        {selectedPoint && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <button onClick={() => setInputMode('click')} style={{ flex: 1, padding: '11px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: inputMode === 'click' ? 'linear-gradient(135deg, #00C48C, #007B5E)' : 'rgba(255,255,255,0.07)', color: inputMode === 'click' ? '#fff' : 'rgba(255,255,255,0.5)' }}>
              <MousePointer size={14} /> 지도 직접 클릭
            </button>
            <button onClick={() => setInputMode('search')} style={{ flex: 1, padding: '11px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: inputMode === 'search' ? 'linear-gradient(135deg, #FFD700, #FFA000)' : 'rgba(255,255,255,0.07)', color: inputMode === 'search' ? '#000' : 'rgba(255,255,255,0.5)' }}>
              <Search size={14} /> 주소 검색
            </button>
          </div>
        )}

        {/* 주소 검색 UI */}
        {selectedPoint && inputMode === 'search' && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input type="text" value={addressInput} onChange={e => setAddressInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="장소명 또는 주소 입력"
                style={{ flex: 1, padding: '12px 14px', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.13)', borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none' }} />
              <button onClick={handleSearch} disabled={searching} style={{ padding: '0 16px', background: 'linear-gradient(135deg, #FFD700, #FFA000)', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '900', color: '#000', opacity: searching ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                {searching ? '...' : <><Search size={14} />검색</>}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
                {searchResults.map((r, i) => (
                  <button key={i} onClick={() => { placeMarker(r.lat, r.lng, r.address, 'search'); setSearchResults([]); setAddressInput(r.address); setInputMode('click'); }}
                    style={{ width: '100%', padding: '11px 14px', background: 'transparent', border: 'none', borderBottom: i < searchResults.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                    <MapPin size={13} color="#FFD700" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700' }}>{r.address}</div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{r.lat.toFixed(5)}, {r.lng.toFixed(5)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 수정된 포인트 목록 */}
        {overrideCount > 0 && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={12} color="#FFD700" /> 수정된 포인트 ({overrideCount}개) {serverOnline && <span style={{ color: '#00C48C', fontSize: '10px' }}>● 서버 반영됨</span>}
            </div>
            {Object.entries(overrides).map(([id, coords]) => {
              const p = SECRET_FISHING_POINTS.find(x => x.id === parseInt(id));
              if (!p) return null;
              return (
                <div key={id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,215,0,0.12)', borderRadius: '10px', padding: '9px 13px', marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#FFD700' }}>{p.name.replace('⭐ ', '')}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => { setSelectedPoint(p); if (mapInstanceRef.current) { mapInstanceRef.current.setCenter(new window.kakao.maps.LatLng(coords.lat, coords.lng)); mapInstanceRef.current.setLevel(5); } }}
                      style={{ fontSize: '11px', color: '#4FC3F7', background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.2)', borderRadius: '7px', padding: '4px 8px', cursor: 'pointer' }}>
                      보기
                    </button>
                    <button onClick={() => handleReset(parseInt(id))} style={{ fontSize: '11px', color: '#FF6B6B', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '7px', padding: '4px 8px', cursor: 'pointer' }}>초기화</button>
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
