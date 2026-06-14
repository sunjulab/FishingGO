import React from 'react';
import { Award, Phone, MessageSquare } from 'lucide-react';
import ImageGallery from './ImageGallery';

/**
 * 선상배 홍보 카드 (순수 광고용)
 * - 클릭 시 팝업 및 삭제/수정 버튼이 제거된 단순화된 컴포넌트
 */
export default function BusinessAdCard({ post }) {
  if (!post) return null;

  return (
    <div style={{ pointerEvents: 'auto' }}>
      {post.isPinned ? (
        /* VVIP 프리미엄 대형 카드 */
        <div style={{ backgroundColor: '#FEFCF5', borderRadius: '0 0 16px 16px', borderTop: 'none', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(90deg, #FFD700, #FF9B26)', color: '#5C3A00', padding: '10px 16px', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '950', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Award size={14} fill="#5C3A00" /> VVIP 프리미엄 스폰서</span>
          </div>
          <div style={{ position: 'relative' }}>
            {(Array.isArray(post.images) && post.images.length > 0) || post.cover ? (
              <ImageGallery
                images={post.images}
                image={post.cover}
                maxHeight={220}
                borderRadius="0"
                showZoom={false}
              />
            ) : (
              <div style={{ width: '100%', height: '220px', background: '#E8EBF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `calc(48px * var(--fs, 1))` }}>🚢</div>
            )}
            <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.65)', color: '#FFD700', padding: '5px 14px', borderRadius: '20px', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', pointerEvents: 'none' }}>
              👑 {post.region || '항구 전용 VVIP'}
            </div>
            <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#FF5A5F', color: '#fff', padding: '5px 12px', borderRadius: '8px', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '950', pointerEvents: 'none' }}>예약 모집중</div>
          </div>
          <div style={{ padding: '20px 18px' }}>
            <div style={{ fontSize: `calc(22px * var(--fs, 1))`, fontWeight: '950', color: '#1A1A2E', marginBottom: '10px' }}>{post.shipName}</div>
            <p style={{ margin: '0 0 16px', fontSize: `calc(14px * var(--fs, 1))`, color: '#333', lineHeight: '1.8', fontWeight: '600' }}>{(post.content || '').slice(0, 140)}{(post.content || '').length > 140 ? '...' : ''}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: `calc(13px * var(--fs, 1))` }}>
              <span style={{ background: '#F4F6FA', padding: '7px 14px', borderRadius: '12px', color: '#333', fontWeight: '800' }}>🎣 {post.target}</span>
              <span style={{ background: '#F4F6FA', padding: '7px 14px', borderRadius: '12px', color: '#333', fontWeight: '800' }}>📅 {post.date}</span>
              <span style={{ background: '#FFF3E0', padding: '7px 14px', borderRadius: '12px', color: '#E65100', fontWeight: '950' }}>💰 {post.price}</span>
            </div>
          </div>
          <div style={{ padding: '0 18px 20px', display: 'flex', gap: '12px' }}>
            <button onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${post.phone || ''}`; }} style={{ flex: 1, backgroundColor: '#0056D2', color: '#fff', border: 'none', padding: '18px', borderRadius: '16px', fontWeight: '950', fontSize: `calc(16px * var(--fs, 1))`, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 6px 18px rgba(0,86,210,0.3)' }}>
              <Phone size={20} fill="#fff" /> 즉시 전화 연결
            </button>
            <button onClick={(e) => { e.stopPropagation(); window.location.href = `sms:${post.phone || ''}?body=${encodeURIComponent(`안녕하세요! 낚시GO에서 [${post.shipName}] 선상낚시 예약 문의드립니다.\n\n▶ 원하는 날짜:\n▶ 인원:\n▶ 기타 문의:`)}`; }} style={{ backgroundColor: '#fff', color: '#00875A', border: '2px solid #00875A', padding: '18px 20px', borderRadius: '16px', fontWeight: '900', fontSize: `calc(15px * var(--fs, 1))`, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <MessageSquare size={20} /> 문자 예약
            </button>
          </div>
        </div>
      ) : (
        /* 일반 소형 카드 */
        <div style={{ backgroundColor: '#fff', borderRadius: '0 0 16px 16px', borderTop: 'none', overflow: 'hidden' }}>
          {post.region === '전국 (전체)' && (
            <div style={{
              background: 'linear-gradient(90deg, #0056D2, #0096FF)',
              color: '#fff', padding: '7px 14px',
              fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span>🌐 MASTER 공식 전국 홍보</span>
            </div>
          )}
          <div style={{ padding: '12px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ width: '76px', height: '76px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: '#E8EBF0' }}>
                <ImageGallery
                  images={post.images}
                  image={post.cover}
                  maxHeight={76}
                  borderRadius="0"
                  showZoom={false}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: '#FF5A5F', color: '#fff', padding: '2px 6px', borderRadius: '5px', fontWeight: '950', flexShrink: 0 }}>모집중</span>
                  {post.region === '전국 (전체)' ? (
                    <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: 'rgba(0,86,210,0.12)', color: '#0056D2', padding: '2px 7px', borderRadius: '5px', fontWeight: '900', flexShrink: 0 }}>🌐 전국</span>
                  ) : post.region ? (
                    <span style={{ fontSize: `calc(9px * var(--fs, 1))`, background: '#F0F0F5', color: '#555', padding: '2px 7px', borderRadius: '5px', fontWeight: '800', flexShrink: 0 }}>📍 {post.region}</span>
                  ) : null}
                  <span style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '950', color: '#1A1A2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.shipName}</span>
                </div>
                <p style={{ margin: '0 0 6px', fontSize: `calc(11px * var(--fs, 1))`, color: '#666', lineHeight: '1.5' }}>{(post.content || '').slice(0, 45)}{(post.content || '').length > 45 ? '...' : ''}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: `calc(10px * var(--fs, 1))` }}>
                  <span style={{ background: '#F4F6FA', padding: '3px 8px', borderRadius: '6px', color: '#333' }}>{post.target}</span>
                  <span style={{ background: '#FFF3E0', padding: '3px 8px', borderRadius: '6px', color: '#E65100', fontWeight: '800' }}>{post.price}</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: '8px 12px', background: '#F8F9FA', borderTop: '1px solid #F0F2F7', display: 'flex', gap: '6px' }}>
            <button onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${post.phone || ''}`; }} style={{ flex: 1, backgroundColor: '#0056D2', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '950', fontSize: `calc(12px * var(--fs, 1))`, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <Phone size={13} fill="#fff" /> 즉시 전화
            </button>
            <button onClick={(e) => { e.stopPropagation(); window.location.href = `sms:${post.phone || ''}?body=${encodeURIComponent(`안녕하세요! 낚시GO에서 [${post.shipName}] 예약 문의드립니다.\n▶ 날짜:\n▶ 인원:`)}`; }} style={{ backgroundColor: '#fff', color: '#00875A', border: '1.5px solid #00875A', padding: '10px 12px', borderRadius: '10px', fontWeight: '900', fontSize: `calc(12px * var(--fs, 1))`, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <MessageSquare size={13} /> 문자 예약
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
