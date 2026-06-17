import React, { useState, useEffect } from 'react';
import { X, MapPin, Save, Trash2 } from 'lucide-react';
import apiClient from '../api/index';
import { useToastStore } from '../store/useToastStore';

export default function AddPointModal({ lat, lng, onClose, onSuccess, initialData = null, isCustom = false }) {
  const isEditMode = !!initialData;
  const [name, setName] = useState('');
  const [type, setType] = useState('방파제');
  const [fish, setFish] = useState('');
  const [loading, setLoading] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setType(initialData.type || '방파제');
      setFish(Array.isArray(initialData.targets) ? initialData.targets.join(', ') : (initialData.targets || ''));
    }
  }, [initialData]);

  const handleSave = async () => {
    if (!name.trim()) return addToast('포인트 이름을 입력해주세요.', 'error');
    if (!type) return addToast('포인트 타입을 선택해주세요.', 'error');

    setLoading(true);
    try {
      const targetsArray = fish.split(',').map(s => s.trim()).filter(Boolean);
      let res;
      
      if (!isEditMode) {
        // 신규 추가
        res = await apiClient.post('/api/custom-points', {
          name: name.trim(),
          type,
          lat,
          lng,
          fish: fish.trim() || '미확인'
        });
        addToast('신규 포인트가 등록되었습니다.', 'success');
        if (res.data?.autoStation) {
          addToast(`가까운 관측소(${res.data.autoStation.name})가 자동 매칭되었습니다.`, 'info');
        }
      } else {
        // 수정
        if (isCustom) {
          res = await apiClient.put(`/api/custom-points/${initialData.id}`, {
            name: name.trim(),
            type,
            lat: initialData.lat,
            lng: initialData.lng,
            targets: targetsArray
          });
        } else {
          // 기존 포인트 (오버라이드)
          res = await apiClient.post('/api/spot-location-overrides', {
            id: initialData.id,
            lat: initialData.lat,
            lng: initialData.lng,
            name: name.trim(),
            type,
            targets: targetsArray,
            isDeleted: false
          });
        }
        addToast('포인트 정보가 수정되었습니다.', 'success');
      }
      
      onSuccess(res?.data?.point || res?.data?.override || { ...initialData, name, type, targets: targetsArray }, isEditMode ? 'edit' : 'add');
      onClose();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || '포인트 처리에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 이 포인트를 삭제(숨김)하시겠습니까?')) return;
    setLoading(true);
    try {
      if (isCustom) {
        await apiClient.delete(`/api/custom-points/${initialData.id}`);
      } else {
        // 기존 포인트 (오버라이드 isDeleted: true)
        await apiClient.post('/api/spot-location-overrides', {
          id: initialData.id,
          isDeleted: true
        });
      }
      addToast('포인트가 삭제되었습니다.', 'success');
      onSuccess(initialData, 'delete');
      onClose();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || '포인트 삭제에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '400px',
        padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#111' }}>
            {isEditMode ? '포인트 관리' : '신규 포인트 등록'}
          </h3>
          <X size={24} color="#666" style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>

        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#F2F2F7', borderRadius: '8px' }}>
          <MapPin size={18} color="#0056D2" />
          <span style={{ fontSize: '14px', color: '#333' }}>
            위도: {lat.toFixed(4)} / 경도: {lng.toFixed(4)}
          </span>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px', fontWeight: '600' }}>포인트 이름</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)}
            placeholder="예: 강릉 안목해변 방파제"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '8px',
              border: '1px solid #E5E5EA', fontSize: '15px'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px', fontWeight: '600' }}>포인트 타입</label>
          <select 
            value={type} 
            onChange={e => setType(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '8px',
              border: '1px solid #E5E5EA', fontSize: '15px', background: '#fff'
            }}
          >
            <option value="방파제">방파제</option>
            <option value="갯바위">갯바위</option>
            <option value="항구">항구</option>
            <option value="민물">민물</option>
            <option value="비밀포인트">⭐ 비밀포인트 (VVIP 전용)</option>
          </select>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px', fontWeight: '600' }}>주요 대상 어종</label>
          <input 
            type="text" 
            value={fish} 
            onChange={e => setFish(e.target.value)}
            placeholder="예: 감성돔, 우럭, 광어 (쉼표로 구분)"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '8px',
              border: '1px solid #E5E5EA', fontSize: '15px'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {isEditMode && (
            <button 
              onClick={handleDelete}
              disabled={loading}
              style={{
                flex: 1, padding: '16px', background: '#FFF0F0', color: '#D32F2F',
                border: '1px solid #FFCDD2', borderRadius: '12px', fontSize: '15px', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <Trash2 size={18} />
              삭제
            </button>
          )}
          <button 
            onClick={handleSave}
            disabled={loading}
            style={{
              flex: isEditMode ? 2 : 1, padding: '16px', background: '#0056D2', color: '#fff',
              border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <Save size={18} />
            {loading ? '처리 중...' : (isEditMode ? '정보 수정하기' : '포인트 등록하기')}
          </button>
        </div>
      </div>
    </div>
  );
}

