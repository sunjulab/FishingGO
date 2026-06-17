import React, { useState } from 'react';
import { X, MapPin, Save } from 'lucide-react';
import apiClient from '../api/index';
import { useToastStore } from '../store/useToastStore';

export default function AddPointModal({ lat, lng, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('방파제');
  const [fish, setFish] = useState('');
  const [loading, setLoading] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  const handleSave = async () => {
    if (!name.trim()) return addToast('포인트 이름을 입력해주세요.', 'error');
    if (!type) return addToast('포인트 타입을 선택해주세요.', 'error');

    setLoading(true);
    try {
      const res = await apiClient.post('/api/custom-points', {
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
      onSuccess(res.data.point);
      onClose();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || '포인트 등록에 실패했습니다.', 'error');
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
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#111' }}>신규 포인트 등록</h3>
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
          <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px', fontWeight: '600' }}>주요 대상 어종 (선택)</label>
          <input 
            type="text" 
            value={fish} 
            onChange={e => setFish(e.target.value)}
            placeholder="예: 감성돔, 우럭, 광어"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '8px',
              border: '1px solid #E5E5EA', fontSize: '15px'
            }}
          />
        </div>

        <button 
          onClick={handleSave}
          disabled={loading}
          style={{
            width: '100%', padding: '16px', background: '#0056D2', color: '#fff',
            border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          <Save size={20} />
          {loading ? '저장 중...' : '포인트 등록하기'}
        </button>
      </div>
    </div>
  );
}
