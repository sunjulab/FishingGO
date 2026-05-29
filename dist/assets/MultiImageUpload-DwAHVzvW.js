import { j as jsxRuntimeExports } from './index-CUv3Hibb.js';
import { r as reactExports } from './vendor-react-BzbiWsGG.js';
import { X, y as Check, D as Maximize2, a2 as Star, G as Pen, ar as Image$1 } from './vendor-icons-C5BxRig-.js';
import { fileToCompressedBase64 } from './imageUtils-BQ2gh6yW.js';

const FRAME_W = 300;
const FRAME_H = 400;
function ImagePositionEditor({ src, onConfirm, onCancel }) {
  const canvasRef = reactExports.useRef(null);
  const [imgEl, setImgEl] = reactExports.useState(null);
  const [layout, setLayout] = reactExports.useState(null);
  const [offset, setOffset] = reactExports.useState({ x: 0, y: 0 });
  const dragging = reactExports.useRef(false);
  const dragStart = reactExports.useRef({ x: 0, y: 0 });
  reactExports.useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const frameRatio = FRAME_W / FRAME_H;
      let drawW, drawH;
      if (imgRatio > frameRatio) {
        drawH = FRAME_H;
        drawW = drawH * imgRatio;
      } else {
        drawW = FRAME_W;
        drawH = drawW / imgRatio;
      }
      const minX = FRAME_W - drawW;
      const maxX = 0;
      const minY = FRAME_H - drawH;
      const maxY = 0;
      setImgEl(img);
      setLayout({ drawW, drawH, minX, maxX, minY, maxY });
      setOffset({ x: (FRAME_W - drawW) / 2, y: (FRAME_H - drawH) / 2 });
    };
    img.src = src;
  }, [src]);
  reactExports.useEffect(() => {
    if (!imgEl || !layout || !canvasRef.current)
      return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, FRAME_W, FRAME_H);
    ctx.drawImage(imgEl, offset.x, offset.y, layout.drawW, layout.drawH);
  }, [imgEl, layout, offset]);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const getPoint = (e) => {
    const t = e.touches?.[0] ?? e;
    return { x: t.clientX, y: t.clientY };
  };
  const onDown = reactExports.useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    const p = getPoint(e);
    dragStart.current = { x: p.x - offset.x, y: p.y - offset.y };
  }, [offset]);
  const onMove = reactExports.useCallback((e) => {
    if (!dragging.current || !layout)
      return;
    e.preventDefault();
    const p = getPoint(e);
    setOffset({
      x: clamp(p.x - dragStart.current.x, layout.minX, layout.maxX),
      y: clamp(p.y - dragStart.current.y, layout.minY, layout.maxY)
    });
  }, [layout]);
  const onUp = reactExports.useCallback(() => {
    dragging.current = false;
  }, []);
  const handleConfirm = () => {
    if (!imgEl || !layout || !canvasRef.current)
      return;
    const scale = imgEl.naturalWidth / layout.drawW;
    const cropX = -offset.x * scale;
    const cropY = -offset.y * scale;
    const cropW = FRAME_W * scale;
    const cropH = FRAME_H * scale;
    const out = document.createElement("canvas");
    out.width = Math.round(cropW);
    out.height = Math.round(cropH);
    const ctx = out.getContext("2d");
    ctx.drawImage(imgEl, cropX, cropY, cropW, cropH, 0, 0, out.width, out.height);
    onConfirm(out.toDataURL("image/jpeg", 0.88));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.94)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
          width: "100%",
          maxWidth: `${FRAME_W + 40}px`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          color: "#fff"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: onCancel,
              style: { background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 22 })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "800", letterSpacing: "-0.3px" }, children: "📐 사진 위치 조정" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: handleConfirm,
              style: {
                background: "#0056D2",
                border: "none",
                color: "#fff",
                borderRadius: "10px",
                padding: "8px 18px",
                fontSize: `calc(14px * var(--fs, 1))`,
                fontWeight: "800",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 15 }),
                " 완료"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              width: FRAME_W,
              height: FRAME_H,
              borderRadius: "12px",
              overflow: "hidden",
              cursor: "grab",
              boxShadow: "0 0 0 2px rgba(255,255,255,0.18)",
              touchAction: "none"
            },
            onMouseDown: onDown,
            onMouseMove: onMove,
            onMouseUp: onUp,
            onMouseLeave: onUp,
            onTouchStart: onDown,
            onTouchMove: onMove,
            onTouchEnd: onUp,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "canvas",
              {
                ref: canvasRef,
                width: FRAME_W,
                height: FRAME_H,
                style: { display: "block", width: "100%", height: "100%" }
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "18px", display: "flex", alignItems: "center", gap: "6px", color: "#aaa", fontSize: `calc(13px * var(--fs, 1))` }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Maximize2, { size: 14 }),
          "드래그하여 보이는 영역을 조정하세요"
        ] })
      ]
    }
  );
}

function MultiImageUpload({
  images = [],
  onChange,
  maxCount = 5,
  isLoading = false,
  label = "사진 추가"
}) {
  const inputRef = reactExports.useRef(null);
  const [editingIdx, setEditingIdx] = reactExports.useState(null);
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length)
      return;
    const remaining = maxCount - images.length;
    const toProcess = files.slice(0, remaining);
    const compressed = await Promise.all(
      toProcess.map(async (file) => {
        try {
          return await fileToCompressedBase64(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.82, preset: "post" });
        } catch {
          return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
          }).catch(() => null);
        }
      })
    );
    onChange([...images, ...compressed.filter(Boolean)].slice(0, maxCount));
  };
  const removeImage = (idx) => {
    onChange(images.filter((_, i) => i !== idx));
  };
  const moveLeft = (idx) => {
    if (idx === 0)
      return;
    const next = [...images];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  };
  const moveRight = (idx) => {
    if (idx === images.length - 1)
      return;
    const next = [...images];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    images.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      marginBottom: "12px"
    }, children: images.map((src, idx) => (
      // ✅ BUG-FIX: 마지막 24바이트만 사용 시 base64 이미지 간 key 충돌 가능 → idx+앞12+뒤12 조합으로 안정화
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          style: {
            position: "relative",
            width: "80px",
            height: "80px",
            borderRadius: "12px",
            overflow: "visible",
            flexShrink: 0
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src,
                alt: `이미지 ${idx + 1}`,
                style: {
                  width: "80px",
                  height: "80px",
                  objectFit: "cover",
                  borderRadius: "12px",
                  border: idx === 0 ? "2.5px solid #0056D2" : "2px solid #E5E5EA",
                  display: "block"
                }
              }
            ),
            idx === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
              position: "absolute",
              bottom: "-6px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "#0056D2",
              color: "#fff",
              fontSize: `calc(9px * var(--fs, 1))`,
              fontWeight: "900",
              padding: "2px 6px",
              borderRadius: "8px",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "2px"
            }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { size: 8, fill: "#fff" }),
              " 대표"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setEditingIdx(idx),
                title: "위치 조정",
                style: {
                  position: "absolute",
                  top: "-6px",
                  left: "-6px",
                  background: "#0056D2",
                  border: "none",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { size: 11, color: "#fff" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => removeImage(idx),
                style: {
                  position: "absolute",
                  top: "-6px",
                  right: "-6px",
                  background: "#FF3B30",
                  border: "none",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 11, color: "#fff" })
              }
            ),
            images.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
              position: "absolute",
              bottom: "-22px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "2px"
            }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => moveLeft(idx),
                  disabled: idx === 0,
                  style: {
                    width: "18px",
                    height: "18px",
                    background: idx === 0 ? "#e0e0e0" : "#0056D2",
                    border: "none",
                    borderRadius: "4px",
                    cursor: idx === 0 ? "default" : "pointer",
                    color: "#fff",
                    fontSize: `calc(10px * var(--fs, 1))`,
                    fontWeight: "900",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  },
                  children: "‹"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => moveRight(idx),
                  disabled: idx === images.length - 1,
                  style: {
                    width: "18px",
                    height: "18px",
                    background: idx === images.length - 1 ? "#e0e0e0" : "#0056D2",
                    border: "none",
                    borderRadius: "4px",
                    cursor: idx === images.length - 1 ? "default" : "pointer",
                    color: "#fff",
                    fontSize: `calc(10px * var(--fs, 1))`,
                    fontWeight: "900",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  },
                  children: "›"
                }
              )
            ] })
          ]
        },
        `${idx}_${src.slice(0, 12)}_${src.slice(-12)}`
      )
    )) }),
    images.length < maxCount && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        onClick: () => !isLoading && inputRef.current?.click(),
        style: {
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: isLoading ? "#FF9B26" : images.length > 0 ? "#0056D2" : "#666",
          fontSize: `calc(14px * var(--fs, 1))`,
          cursor: isLoading ? "not-allowed" : "pointer",
          marginTop: images.length > 0 ? "28px" : 0
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: inputRef,
              type: "file",
              accept: "image/*",
              multiple: true,
              style: { display: "none" },
              onChange: handleFileChange
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            width: "36px",
            height: "36px",
            backgroundColor: images.length > 0 ? "rgba(0,86,210,0.05)" : "#f8f9fa",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: images.length > 0 ? "1.5px solid rgba(0,86,210,0.3)" : "none"
          }, children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#FF9B26", fontWeight: "800" }, children: "처리중" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Image$1, { size: 20 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: "700", fontSize: `calc(13px * var(--fs, 1))` }, children: isLoading ? "사진 처리 중..." : `${label} (${images.length}/${maxCount})` }),
            images.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#aaa", marginTop: "1px" }, children: [
              "최대 ",
              maxCount,
              "장 | 순서 변경 가능"
            ] })
          ] })
        ]
      }
    ),
    images.length >= maxCount && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
      fontSize: `calc(12px * var(--fs, 1))`,
      color: "#888",
      fontWeight: "700",
      marginTop: images.length > 1 ? "28px" : "8px",
      padding: "8px 12px",
      background: "#F8F9FA",
      borderRadius: "10px"
    }, children: [
      "📷 최대 ",
      maxCount,
      "장 등록 완료. 삭제 후 추가 가능합니다."
    ] }),
    editingIdx !== null && images[editingIdx] && /* @__PURE__ */ jsxRuntimeExports.jsx(
      ImagePositionEditor,
      {
        src: images[editingIdx],
        onConfirm: (newBase64) => {
          const next = [...images];
          next[editingIdx] = newBase64;
          onChange(next);
          setEditingIdx(null);
        },
        onCancel: () => setEditingIdx(null)
      }
    )
  ] });
}

export { MultiImageUpload as M };
