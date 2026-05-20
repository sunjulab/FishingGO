import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function UpgradeModal({ onClose }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={onClose}
      style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1200, backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'linear-gradient(160deg, #0a0a1a 0%, #0d1b3e 100%)', borderRadius: '28px', padding: '32px 28px', width: '100%', maxWidth: '380px', border: '1.5px solid rgba(100,160,255,0.25)', boxShadow: '0 24px 80px rgba(0,86,210,0.35)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: `calc(48px * var(--fs, 1))`, marginBottom: '14px' }}>🔒</div>
          <div style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '950', color: '#fff', letterSpacing: '-0.04em', marginBottom: '8px' }}>오늘 무료 입장 3회 완료</div>
          <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color: 'rgba(255,255,255,0.55)', fontWeight: '600', lineHeight: 1.6 }}>
            무료 플랜은 포인트 상세를 하루 3회까지 열람할 수 있어요.<br/>
            <strong style={{ color: '#64B5F6' }}>LITE 이상 플랜에서 무제한 입장</strong> 가능합니다.
          </div>
        </div>

        <div style={{ background: 'rgba(100,160,255,0.08)', borderRadius: '16px', padding: '16px', marginBottom: '20px', border: '1px solid rgba(100,160,255,0.15)' }}>
          <div style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', color: '#64B5F6', marginBottom: '10px', letterSpacing: '0.04em' }}>⭐ LITE 플랜 혜택</div>
          {[['🗺️ 포인트 상세', '무제한 입장'], ['📡 실시간 CCTV', '라이브 영상'], ['⭐ 비밀포인트', '황금 포인트 공개'], ['🔥 스마트 히트맵', '수온·조황 분석']].map(([icon, desc]) => (
            <div key={icon} style={{ display: 'flex', justifyContent: 'space-between', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '700', color: '#fff', marginBottom: '6px' }}>
              <span>{icon}</span>
              <span style={{ color: '#00C48C' }}>✓ {desc}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => { onClose(); navigate('/vvip-subscribe'); }}
          style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg, #1565C0, #0D47A1)', color: '#fff', border: 'none', borderRadius: '16px', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '950', cursor: 'pointer', marginBottom: '10px', boxShadow: '0 8px 24px rgba(21,101,192,0.5)', letterSpacing: '-0.03em' }}
        >
          🚀 LITE 플랜으로 업그레이드
        </button>
        <button
          onClick={onClose}
          style={{ width: '100%', padding: '12px', background: 'transparent', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700', cursor: 'pointer' }}
        >
          내일 다시 방문하기
        </button>
      </div>
    </div>
  );
}
