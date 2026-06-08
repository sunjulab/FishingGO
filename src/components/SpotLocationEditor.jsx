/**
 * SpotLocationEditor
 * MASTER 전용 — 낚시 포인트 위치를 카카오 지도에서 드래그로 수정
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, X, RotateCcw, Check, Loader2 } from 'lucide-react';
import apiClient from '../api/index';
import { useToastStore } from '../store/useToastStore';

export default function SpotLocationEditor({ spot, onClose, onSaved }) {
  const addToast = useToastStore(s => s.addToast);
  const mapRef   = useRef(null);
  const markerRef = useRef(null);
  const kakaoMap  = useRef(null);

  const [lat, setLat]     = useState(String(spot.lat));
  const [lng, setLng]     = useState(String(spot.lng));
  const [saving, setSaving] = useState(false);
  const [changed, setChanged] = useState(false);

  // 카카오 지도 초기화
  useEffect(() => {
    if (!window.kakao?.maps) return;
    let mapInst, markerInst;
    // ✅ BUG-02 FIX: 이벤트 핸들러 참조를 변수에 저장 → cleanup에서 removeListener 가능
    const handleDragEnd = () => {
      const pos = markerInst.getPosition();
      setLat(pos.getLat().toFixed(6));
      setLng(pos.getLng().toFixed(6));
      setChanged(true);
    };
    const handleMapClick = (e) => {
      const pos = e.latLng;
      markerInst.setPosition(pos);
      setLat(pos.getLat().toFixed(6));
      setLng(pos.getLng().toFixed(6));
      setChanged(true);
    };

    window.kakao.maps.load(() => {
      const container = mapRef.current;
      if (!container) return;
      const initLat = parseFloat(lat);
      const initLng = parseFloat(lng);
      mapInst = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(initLat, initLng),
        level: 4,
      });
      kakaoMap.current = mapInst;
      markerInst = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(initLat, initLng),
        draggable: true,
        map: mapInst,
      });
      markerRef.current = markerInst;
      // 마커 드래그 끝날 때 좌표 업데이트
      window.kakao.maps.event.addListener(markerInst, 'dragend', handleDragEnd);
      // 지도 클릭으로도 마커 이동
      window.kakao.maps.event.addListener(mapInst, 'click', handleMapClick);
    });
    return () => {
      // ✅ BUG-02 FIX: 언마운트 시 이벤트 리스너 제거 → 중복 누적 방지
      if (markerInst) window.kakao.maps.event.removeListener(markerInst, 'dragend', handleDragEnd);
      if (mapInst) window.kakao.maps.event.removeListener(mapInst, 'click', handleMapClick);
    };
  }, []); // eslint-disable-line

  // 수동 입력 시 지도 마커도 이동
  const applyManualCoords = useCallback(() => {
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (isNaN(la) || isNaN(ln)) return;
    if (!kakaoMap.current || !markerRef.current) return;
    const pos = new window.kakao.maps.LatLng(la, ln);
    markerRef.current.setPosition(pos);
    kakaoMap.current.setCenter(pos);
    setChanged(true);
  }, [lat, lng]);

  // 저장
  const handleSave = async () => {
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (isNaN(la) || isNaN(ln)) {
      addToast('올바른 좌표를 입력하세요.', 'error'); return;
    }
    setSaving(true);
    try {
      await apiClient.post('/api/spot-location-overrides', {
        id: spot.id, lat: la, lng: ln, name: spot.name,
      });
      addToast(`✅ "${spot.name}" 위치 저장 완료`, 'success');
      onSaved?.({ ...spot, lat: la, lng: ln });
      onClose();
    } catch (e) {
      addToast(e?.response?.data?.error || '저장 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 원래 위치로 초기화
  const handleReset = async () => {
    if (!window.confirm('원래 좌표로 초기화하시겠습니까?')) return;
    setSaving(true);
    try {
      await apiClient.delete(`/api/spot-location-overrides/${spot.id}`);
      addToast('원래 위치로 초기화됐습니다.', 'info');
      onSaved?.(spot); // 원본 좌표로 복원
      onClose();
    } catch (e) {
      addToast('초기화 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        width: '100%', maxWidth: '480px', background: '#fff',
        borderRadius: '20px', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* 헤더 */}
        <div style={{
          background: 'linear-gradient(135deg, #1A1A2E, #0056D2)',
          padding: '16px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPin size={20} color="#60a5fa" />
            <div>
              <div style={{ color: '#fff', fontWeight: '900', fontSize: '15px' }}>
                위치 수정 (MASTER)
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '700' }}>
                {spot.name}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: '50%', width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#fff',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* 지도 */}
        <div style={{ position: 'relative' }}>
          <div ref={mapRef} style={{ width: '100%', height: '280px' }} />
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)', color: '#fff', borderRadius: '20px',
            padding: '6px 14px', fontSize: '12px', fontWeight: '700',
            whiteSpace: 'nowrap', pointerEvents: 'none',
          }}>
            📍 핀을 드래그하거나 지도를 클릭하세요
          </div>
        </div>

        {/* 좌표 입력 */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            {[
              { label: '위도 (Lat)', value: lat, setter: setLat },
              { label: '경도 (Lng)', value: lng, setter: setLng },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#666', marginBottom: '4px' }}>
                  {label}
                </div>
                <input
                  value={value}
                  onChange={e => { setter(e.target.value); setChanged(true); }}
                  onBlur={applyManualCoords}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '10px',
                    border: '1.5px solid #E0E7FF', fontSize: '14px', fontWeight: '800',
                    outline: 'none', boxSizing: 'border-box', color: '#1A1A2E',
                  }}
                />
              </div>
            ))}
          </div>

          {/* 원본 좌표 표시 */}
          <div style={{
            background: '#F8F9FC', borderRadius: '10px', padding: '8px 12px',
            fontSize: '11px', fontWeight: '700', color: '#888', marginBottom: '14px',
          }}>
            원본: ({spot.lat}, {spot.lng})
          </div>

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleReset}
              disabled={saving}
              style={{
                flex: 1, padding: '12px', borderRadius: '12px',
                border: '1.5px solid #E5E7EB', background: '#fff',
                color: '#666', fontWeight: '800', fontSize: '13px',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px',
              }}
            >
              <RotateCcw size={14} /> 초기화
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !changed}
              style={{
                flex: 2, padding: '12px', borderRadius: '12px', border: 'none',
                background: (saving || !changed)
                  ? '#E5E7EB'
                  : 'linear-gradient(135deg, #0056D2, #00C48C)',
                color: (saving || !changed) ? '#aaa' : '#fff',
                fontWeight: '900', fontSize: '14px',
                cursor: (saving || !changed) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              {saving
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> 저장 중...</>
                : <><Check size={14} /> 위치 저장</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
