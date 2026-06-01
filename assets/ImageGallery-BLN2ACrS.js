import { j as jsxRuntimeExports } from './index-C2ieaxTI.js';
import { r as reactExports } from './vendor-react-BzbiWsGG.js';
import { d as ChevronLeft, e as ChevronRight, au as ZoomIn, X } from './vendor-icons-C5BxRig-.js';

function getImages(images, image) {
  if (Array.isArray(images) && images.length > 0)
    return images.filter(Boolean);
  if (image)
    return [image];
  return [];
}
function ImageGallery({ images, image, maxHeight = 300, borderRadius = "16px", showZoom = true }) {
  const list = getImages(images, image);
  const [idx, setIdx] = reactExports.useState(0);
  const [fullscreen, setFullscreen] = reactExports.useState(false);
  const touchStartX = reactExports.useRef(null);
  const touchStartY = reactExports.useRef(null);
  const goPrev = reactExports.useCallback((e) => {
    e?.stopPropagation();
    setIdx((i) => Math.max(0, i - 1));
  }, []);
  const goNext = reactExports.useCallback((e) => {
    e?.stopPropagation();
    setIdx((i) => Math.min(list.length - 1, i + 1));
  }, [list.length]);
  if (list.length === 0)
    return null;
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null)
      return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - (touchStartY.current || 0));
    if (Math.abs(dx) > 40 && dy < 60) {
      if (dx < 0)
        goNext();
      else
        goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        style: {
          position: "relative",
          overflow: "hidden",
          borderRadius,
          border: "1px solid #F0F0F0",
          marginBottom: "20px",
          userSelect: "none",
          backgroundColor: "#000",
          aspectRatio: "3 / 4"
        },
        onTouchStart: handleTouchStart,
        onTouchEnd: handleTouchEnd,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: list[idx],
              alt: `사진 ${idx + 1}`,
              style: {
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "opacity 0.2s"
              },
              onError: (e) => {
                e.currentTarget.parentElement.style.display = "none";
              }
            }
          ),
          list.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            idx > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: goPrev,
                style: {
                  position: "absolute",
                  left: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(0,0,0,0.5)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 20, color: "#fff" })
              }
            ),
            idx < list.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: goNext,
                style: {
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(0,0,0,0.5)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 20, color: "#fff" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", top: "8px", right: "8px", display: "flex", gap: "6px", alignItems: "center" }, children: [
            list.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: {
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              fontSize: `calc(12px * var(--fs, 1))`,
              fontWeight: "800",
              padding: "3px 8px",
              borderRadius: "10px"
            }, children: [
              idx + 1,
              " / ",
              list.length
            ] }),
            showZoom && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setFullscreen(true),
                style: {
                  background: "rgba(0,0,0,0.55)",
                  border: "none",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ZoomIn, { size: 14, color: "#fff" })
              }
            )
          ] }),
          list.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            position: "absolute",
            bottom: "8px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "5px"
          }, children: list.map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: (e) => {
                e.stopPropagation();
                setIdx(i);
              },
              style: {
                width: i === idx ? "18px" : "6px",
                height: "6px",
                borderRadius: "3px",
                background: i === idx ? "#fff" : "rgba(255,255,255,0.5)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.2s ease"
              }
            },
            i
          )) })
        ]
      }
    ),
    list.length >= 3 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      display: "flex",
      gap: "6px",
      marginBottom: "16px",
      overflowX: "auto",
      padding: "2px 0"
    }, children: list.map((src, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setIdx(i),
        style: {
          flexShrink: 0,
          width: "56px",
          height: "56px",
          borderRadius: "10px",
          overflow: "hidden",
          border: i === idx ? "2px solid #0056D2" : "2px solid transparent",
          padding: 0,
          cursor: "pointer",
          background: "#f0f0f0",
          transition: "border-color 0.15s"
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src, alt: "", style: { width: "100%", height: "100%", objectFit: "cover", display: "block" } })
      },
      i
    )) }),
    fullscreen && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        onClick: () => setFullscreen(false),
        style: {
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(0,0,0,0.94)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setFullscreen(false),
              style: {
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 22, color: "#fff" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: list[idx],
              alt: `사진 ${idx + 1}`,
              onClick: (e) => e.stopPropagation(),
              style: { maxWidth: "95vw", maxHeight: "85vh", objectFit: "contain", borderRadius: "8px" }
            }
          ),
          list.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "20px", marginTop: "20px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: goPrev,
                disabled: idx === 0,
                style: { background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "44px", height: "44px", cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center" },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 22, color: "#fff" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#fff", fontWeight: "800", fontSize: `calc(14px * var(--fs, 1))`, alignSelf: "center" }, children: [
              idx + 1,
              " / ",
              list.length
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: goNext,
                disabled: idx === list.length - 1,
                style: { background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "44px", height: "44px", cursor: idx === list.length - 1 ? "default" : "pointer", opacity: idx === list.length - 1 ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center" },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 22, color: "#fff" })
              }
            )
          ] })
        ]
      }
    )
  ] });
}

export { ImageGallery as I };
