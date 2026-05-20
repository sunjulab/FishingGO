/**
 * ImagePositionEditor.jsx
 * 3:4 비율 프레임 안에서 이미지를 드래그로 위치 조정 후 Canvas로 크롭 저장
 * onConfirm(newBase64) 으로 크롭된 base64 반환
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Check, Maximize2 } from 'lucide-react';

const FRAME_W = 300;   // 미리보기 캔버스 너비 (px)
const FRAME_H = 400;   // 3:4 비율 (300 × 4/3 = 400)

export default function ImagePositionEditor({ src, onConfirm, onCancel }) {
  const canvasRef = useRef(null);
  const [imgEl, setImgEl]   = useState(null);
  const [layout, setLayout] = useState(null);   // { drawW, drawH, minX, maxX, minY, maxY }
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  /* ── 이미지 로드 & 레이아웃 계산 ── */
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const imgRatio   = img.naturalWidth / img.naturalHeight;
      const frameRatio = FRAME_W / FRAME_H;          // 0.75

      let drawW, drawH;
      if (imgRatio > frameRatio) {
        // 가로가 더 넓음 → 높이를 프레임에 맞춤, 좌우 드래그
        drawH = FRAME_H;
        drawW = drawH * imgRatio;
      } else {
        // 세로가 더 긺 → 너비를 프레임에 맞춤, 상하 드래그
        drawW = FRAME_W;
        drawH = drawW / imgRatio;
      }

      const minX = FRAME_W - drawW;
      const maxX = 0;
      const minY = FRAME_H - drawH;
      const maxY = 0;

      setImgEl(img);
      setLayout({ drawW, drawH, minX, maxX, minY, maxY });
      // 초기 중앙 배치
      setOffset({ x: (FRAME_W - drawW) / 2, y: (FRAME_H - drawH) / 2 });
    };
    img.src = src;
  }, [src]);

  /* ── 캔버스 렌더링 ── */
  useEffect(() => {
    if (!imgEl || !layout || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, FRAME_W, FRAME_H);
    ctx.drawImage(imgEl, offset.x, offset.y, layout.drawW, layout.drawH);
  }, [imgEl, layout, offset]);

  /* ── 드래그 헬퍼 ── */
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const getPoint = (e) => {
    const t = e.touches?.[0] ?? e;
    return { x: t.clientX, y: t.clientY };
  };

  const onDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    const p = getPoint(e);
    dragStart.current = { x: p.x - offset.x, y: p.y - offset.y };
  }, [offset]);

  const onMove = useCallback((e) => {
    if (!dragging.current || !layout) return;
    e.preventDefault();
    const p = getPoint(e);
    setOffset({
      x: clamp(p.x - dragStart.current.x, layout.minX, layout.maxX),
      y: clamp(p.y - dragStart.current.y, layout.minY, layout.maxY),
    });
  }, [layout]);

  const onUp = useCallback(() => { dragging.current = false; }, []);

  /* ── 완료: Canvas → base64 고해상도 내보내기 ── */
  const handleConfirm = () => {
    if (!imgEl || !layout || !canvasRef.current) return;

    // 출력 캔버스: 실제 이미지 픽셀 기반 고해상도 크롭
    const scale  = imgEl.naturalWidth / layout.drawW;  // 프레임 → 원본 비율
    const cropX  = -offset.x * scale;
    const cropY  = -offset.y * scale;
    const cropW  = FRAME_W * scale;
    const cropH  = FRAME_H * scale;

    const out = document.createElement('canvas');
    out.width  = Math.round(cropW);
    out.height = Math.round(cropH);
    const ctx  = out.getContext('2d');
    ctx.drawImage(imgEl, cropX, cropY, cropW, cropH, 0, 0, out.width, out.height);

    onConfirm(out.toDataURL('image/jpeg', 0.88));
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.94)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      {/* 헤더 */}
      <div style={{
        width: '100%', maxWidth: `${FRAME_W + 40}px`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px', color: '#fff',
      }}>
        <button
          onClick={onCancel}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
        >
          <X size={22} />
        </button>
        <span style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800', letterSpacing: '-0.3px' }}>
          📐 사진 위치 조정
        </span>
        <button
          onClick={handleConfirm}
          style={{
            background: '#0056D2', border: 'none', color: '#fff',
            borderRadius: '10px', padding: '8px 18px',
            fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '5px',
          }}
        >
          <Check size={15} /> 완료
        </button>
      </div>

      {/* 3:4 캔버스 */}
      <div
        style={{
          width: FRAME_W, height: FRAME_H,
          borderRadius: '12px', overflow: 'hidden',
          cursor: 'grab', boxShadow: '0 0 0 2px rgba(255,255,255,0.18)',
          touchAction: 'none',
        }}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={onDown}
        onTouchMove={onMove}
        onTouchEnd={onUp}
      >
        <canvas
          ref={canvasRef}
          width={FRAME_W}
          height={FRAME_H}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      </div>

      {/* 안내 */}
      <div style={{ marginTop: '18px', display: 'flex', alignItems: 'center', gap: '6px', color: '#aaa', fontSize: `calc(13px * var(--fs, 1))` }}>
        <Maximize2 size={14} />
        드래그하여 보이는 영역을 조정하세요
      </div>
    </div>
  );
}
