/**
 * ImageGallery.jsx — 다중 이미지 캐러셀 컴포넌트
 * - images 배열 또는 단일 image 필드 지원 (하위호환)
 * - 터치/드래그 스와이프, 도트 인디케이터, 좌우 화살표 네비게이션
 * - 전체화면(모달) 뷰
 */
import React, { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

/**
 * getImages: images 배열 또는 단일 image 필드에서 이미지 배열 반환
 * @param {string[]} images
 * @param {string} image
 */
export function getImages(images, image) {
  if (Array.isArray(images) && images.length > 0) return images.filter(Boolean);
  if (image) return [image];
  return [];
}

export default function ImageGallery({ images, image, maxHeight = 300, borderRadius = '16px', showZoom = true }) {
  const list = getImages(images, image);
  const [idx, setIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const goPrev = useCallback((e) => {
    e?.stopPropagation();
    setIdx(i => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback((e) => {
    e?.stopPropagation();
    setIdx(i => Math.min(list.length - 1, i + 1));
  }, [list.length]);

  // ✅ HOOKS-FIX: 조건부 return은 반드시 모든 hook 선언 이후에 위치해야 함 (Rules of Hooks)
  if (list.length === 0) return null;

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - (touchStartY.current || 0));
    if (Math.abs(dx) > 40 && dy < 60) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <>
      {/* ── 갤러리 컨테이너 ── */}
      <div
        style={{
          position: 'relative', overflow: 'hidden',
          borderRadius, border: '1px solid #F0F0F0',
          marginBottom: '20px', userSelect: 'none',
          backgroundColor: '#000',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* 현재 이미지 */}
        <img
          src={list[idx]}
          alt={`사진 ${idx + 1}`}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: `${maxHeight}px`,
            objectFit: 'contain',
            display: 'block',
            transition: 'opacity 0.2s',
          }}
          onError={e => { e.currentTarget.parentElement.style.display = 'none'; }}
        />

        {/* 좌우 화살표 (다중일 때만) */}
        {list.length > 1 && (
          <>
            {idx > 0 && (
              <button
                onClick={goPrev}
                style={{
                  position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                  width: '36px', height: '36px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ChevronLeft size={20} color="#fff" />
              </button>
            )}
            {idx < list.length - 1 && (
              <button
                onClick={goNext}
                style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                  width: '36px', height: '36px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ChevronRight size={20} color="#fff" />
              </button>
            )}
          </>
        )}

        {/* 상단 오른쪽: 카운터 + 줌 아이콘 */}
        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
          {list.length > 1 && (
            <span style={{
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              fontSize: '12px', fontWeight: '800',
              padding: '3px 8px', borderRadius: '10px',
            }}>
              {idx + 1} / {list.length}
            </span>
          )}
          {showZoom && (
            <button
              onClick={() => setFullscreen(true)}
              style={{
                background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
                width: '30px', height: '30px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ZoomIn size={14} color="#fff" />
            </button>
          )}
        </div>

        {/* 하단 도트 인디케이터 */}
        {list.length > 1 && (
          <div style={{
            position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: '5px',
          }}>
            {list.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                style={{
                  width: i === idx ? '18px' : '6px', height: '6px',
                  borderRadius: '3px',
                  background: i === idx ? '#fff' : 'rgba(255,255,255,0.5)',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 썸네일 스트립 (3장 이상일 때) */}
      {list.length >= 3 && (
        <div style={{
          display: 'flex', gap: '6px', marginBottom: '16px',
          overflowX: 'auto', padding: '2px 0',
        }}>
          {list.map((src, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{
                flexShrink: 0, width: '56px', height: '56px',
                borderRadius: '10px', overflow: 'hidden',
                border: i === idx ? '2px solid #0056D2' : '2px solid transparent',
                padding: 0, cursor: 'pointer', background: '#f0f0f0',
                transition: 'border-color 0.15s',
              }}
            >
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>
      )}

      {/* 전체화면 모달 */}
      {fullscreen && (
        <div
          onClick={() => setFullscreen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.94)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={() => setFullscreen(false)}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
              width: '40px', height: '40px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={22} color="#fff" />
          </button>

          {/* 전체화면 이미지 */}
          <img
            src={list[idx]}
            alt={`사진 ${idx + 1}`}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '95vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px' }}
          />

          {/* 전체화면 화살표 */}
          {list.length > 1 && (
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
              <button onClick={goPrev} disabled={idx === 0}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={22} color="#fff" />
              </button>
              <span style={{ color: '#fff', fontWeight: '800', fontSize: '14px', alignSelf: 'center' }}>{idx + 1} / {list.length}</span>
              <button onClick={goNext} disabled={idx === list.length - 1}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', cursor: idx === list.length - 1 ? 'default' : 'pointer', opacity: idx === list.length - 1 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={22} color="#fff" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
