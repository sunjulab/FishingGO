import React from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function CctvModal({ cctvData, selectedPoint, onClose }) {
  if (!cctvData) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1200, display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: 'rgba(255,255,255,0.45)', fontWeight: '700', marginBottom: '2px', letterSpacing: '0.05em' }}>
            📡 {cctvData.label || '실시간 현장 영상'}
          </div>
          <div style={{ fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '950', color: '#fff' }}>{selectedPoint?.name}</div>
          <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginTop: '2px' }}>
            {cctvData.areaName} · {cctvData.region}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
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
              <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#FFD700', fontWeight: '800' }}>📷 현장 대표 이미지</div>
              <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: '2px' }}>실시간 스트리밍 준비 중 · 연결 시 자동 업데이트</div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
            <AlertCircle size={40} style={{ margin: '0 auto 10px', display: 'block' }} />
            <div style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '700' }}>영상 준비 중입니다</div>
          </div>
        )}
      </div>

      {/* 하단 안내 */}
      <div style={{ padding: '12px 20px 30px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: `calc(10px * var(--fs, 1))`, color: 'rgba(255,255,255,0.3)', fontWeight: '700', textAlign: 'center' }}>
          {cctvData.type === 'youtube'
            ? '📺 YouTube 라이브 스트리밍 연동 (지자체 공식 채널)'
            : cctvData.type === 'iframe'
            ? '🔗 커스텀 스트림 연동 (관리자 직접 설정)'
            : '📡 지역 대표 해안 이미지 · 실시간 스트리밍 추가 예정'}
        </div>
      </div>
    </div>
  );
}
