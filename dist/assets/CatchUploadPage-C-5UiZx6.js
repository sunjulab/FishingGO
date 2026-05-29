function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-CqYBvIKn.js","assets/index-rdBGUi8d.js","assets/vendor-react-BzbiWsGG.js","assets/vendor-icons-C5BxRig-.js","assets/vendor-store-DFdRS9Cc.js","assets/vendor-http-ChhVHlBG.js","assets/vendor-socket-FPM1Bwz4.js","assets/index-DKFtvhIq.css","assets/index-CijdeiDV.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
import { u as useNavigate, r as reactExports, R as React, _ as __vitePreload } from './vendor-react-BzbiWsGG.js';
import { u as useUserStore, b as useToastStore, c as apiClient, j as jsxRuntimeExports } from './index-rdBGUi8d.js';
import { X, $ as Camera, aF as Upload, b as AlertTriangle, K as Share2, a1 as Trophy } from './vendor-icons-C5BxRig-.js';
import { g as getFishRule, i as isClosedSeason, a as getFishEmoji } from './fishRules-C-ea2o-Y.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

async function copyToClipboard(text) {
  try {
    const { Clipboard } = await __vitePreload(() => import('./index-CqYBvIKn.js'),true?__vite__mapDeps([0,1,2,3,4,5,6,7]):void 0);
    await Clipboard.write({ string: text });
    return true;
  } catch {
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.cssText = "position:fixed;top:-9999px;opacity:0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    return true;
  } catch {
    return false;
  }
}
async function openKakaoTalk() {
  try {
    const { AppLauncher } = await __vitePreload(() => import('./index-CijdeiDV.js'),true?__vite__mapDeps([8,2,1,3,4,5,6,7]):void 0);
    const { value: canOpen } = await AppLauncher.canOpenUrl({ url: "kakaotalk://" });
    if (canOpen) {
      await AppLauncher.openUrl({ url: "kakaotalk://" });
      return;
    }
  } catch {
  }
  try {
    window.open("kakaotalk://", "_system");
    return;
  } catch {
  }
  try {
    window.location.href = "kakaotalk://";
  } catch {
  }
}
function ensureKakaoReady() {
  if (!window.Kakao)
    return false;
  if (!window.Kakao.isInitialized()) {
    try {
      window.Kakao.init(window.__kakaoAppKey || "d353be56977b1c13b03d8981bcf8b5ba");
    } catch {
      return false;
    }
  }
  return window.Kakao.isInitialized();
}
const PRIMARY = "#0056D2";
const GOLD = "#F59E0B";
async function generateShareCard({ fishName, fishSize, fishWeight, location, userName, imageUrl }) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 500;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 900, 500);
  grad.addColorStop(0, "#0a1628");
  grad.addColorStop(1, "#0056D2");
  ctx.fillStyle = grad;
  ctx.roundRect(0, 0, 900, 500, 20);
  ctx.fill();
  if (imageUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = imageUrl;
      });
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(20, 20, 420, 460, 16);
      ctx.clip();
      ctx.drawImage(img, 20, 20, 420, 460);
      ctx.restore();
    } catch {
    }
  }
  const x = imageUrl ? 460 : 50;
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.roundRect(x, 20, 420, 40, 8);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🎣 낚시GO 조황 인증", x + 210, 46);
  ctx.font = "bold 52px sans-serif";
  ctx.fillText(getFishEmoji(fishName), x + 210, 160);
  ctx.font = "bold 38px sans-serif";
  ctx.fillStyle = "#FDE68A";
  ctx.fillText(fishName || "미확인 어종", x + 210, 210);
  ctx.font = "24px sans-serif";
  ctx.fillStyle = "#E0F2FE";
  if (fishSize)
    ctx.fillText(`📏 ${fishSize} cm`, x + 210, 260);
  if (fishWeight)
    ctx.fillText(`⚖️  ${fishWeight} kg`, x + 210, 295);
  if (location) {
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "#BAE6FD";
    ctx.fillText(`📍 ${location}`, x + 210, 335);
  }
  ctx.font = "bold 18px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(`by ${userName || "낚시인"}`, x + 210, 410);
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.roundRect(x + 60, 440, 300, 40, 20);
  ctx.fill();
  ctx.font = "bold 16px sans-serif";
  ctx.fillStyle = "#fff";
  ctx.fillText("낚시GO 앱에서 확인하기 →", x + 210, 465);
  return canvas.toDataURL("image/png");
}
function CatchUploadPage() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);
  const fileRef = reactExports.useRef(null);
  const [step, setStep] = reactExports.useState(1);
  const [imageFile, setImageFile] = reactExports.useState(null);
  const [imagePreview, setImagePreview] = reactExports.useState(null);
  const [imageBase64, setImageBase64] = reactExports.useState(null);
  const [fishName, setFishName] = reactExports.useState("");
  const [fishSize, setFishSize] = reactExports.useState("");
  const [fishWeight, setFishWeight] = reactExports.useState("");
  const [location, setLocation] = reactExports.useState("");
  const [memo, setMemo] = reactExports.useState("");
  const [contestId, setContestId] = reactExports.useState("");
  const [contests, setContests] = reactExports.useState([]);
  const [uploading, setUploading] = reactExports.useState(false);
  const [shareCard, setShareCard] = reactExports.useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = reactExports.useState(null);
  const [catchUrl, setCatchUrl] = reactExports.useState(null);
  const fishRule = getFishRule(fishName);
  const closed = isClosedSeason(fishRule);
  React.useEffect(() => {
    apiClient.get("/api/contest/active").then((r) => setContests(r.data.contests || [])).catch(() => {
    });
  }, []);
  const handleFile = reactExports.useCallback((file) => {
    if (!file || !file.type.startsWith("image/"))
      return addToast("이미지 파일을 선택해주세요.", "error");
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      setImageBase64(e.target.result.split(",")[1]);
    };
    reader.readAsDataURL(file);
    setStep(2);
  }, [addToast]);
  const handleSubmit = async () => {
    if (!fishName.trim())
      return addToast("어종을 입력해주세요.", "error");
    setUploading(true);
    try {
      let imageUrl = null;
      if (imageBase64 && imageFile) {
        try {
          const imgRes = await apiClient.post("/api/user/avatar", {
            email: user?.email,
            avatar: `data:${imageFile.type};base64,${imageBase64}`
          }, { timeout: 6e4 });
          imageUrl = imgRes.data.avatar || null;
          setUploadedImageUrl(imageUrl);
        } catch {
        }
      }
      const catchRes = await apiClient.post("/api/catch", {
        userId: user?.id || user?._id,
        userName: user?.name,
        userAvatar: user?.avatar,
        fishName: fishName.trim(),
        fishSize: fishSize ? parseFloat(fishSize) : null,
        fishWeight: fishWeight ? parseFloat(fishWeight) : null,
        imageUrl,
        location: location.trim(),
        memo: memo.trim(),
        contestId: contestId || null
      });
      const catchId = catchRes.data?.record?._id || catchRes.data?.record?.id;
      const backendBase = "https://fishing-go-backend.onrender.com";
      if (catchId)
        setCatchUrl(`${backendBase}/og/catch/${catchId}`);
      else
        setCatchUrl("https://www.fishing-go.com");
      const card = await generateShareCard({
        fishName,
        fishSize,
        fishWeight,
        location,
        userName: user?.name,
        imageUrl: imagePreview
      });
      setShareCard(card);
      setStep(3);
      addToast("🎉 조황 등록 완료! +30 EXP 획득", "success");
    } catch (err) {
      addToast(err.response?.data?.error || "등록 실패. 다시 시도해주세요.", "error");
    } finally {
      setUploading(false);
    }
  };
  const handleShare = async () => {
    const shareLink = catchUrl || "https://www.fishing-go.com";
    const shareTitle = `🎣 ${fishName} 조황 인증!`;
    const shareText = `${shareTitle}
${shareLink}`;
    const isNative = window.Capacitor?.isNativePlatform?.();
    if (isNative) {
      try {
        const { registerPlugin } = await __vitePreload(() => import('./index-rdBGUi8d.js').then(n => n.i),true?__vite__mapDeps([1,2,3,4,5,6,7]):void 0);
        const NativeAd = registerPlugin("NativeAd");
        await NativeAd.shareText({ text: shareText, title: shareTitle });
        return;
      } catch (e) {
        const msg = e?.message || "";
        if (msg.toLowerCase().includes("cancel"))
          return;
      }
    }
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch (e) {
        if (e.name === "AbortError")
          return;
      }
    }
    const copied = await copyToClipboard(shareLink);
    addToast(copied ? "💛 링크 복사 완료! 카카오톡에서 붙여넣기 해주세요." : "공유를 지원하지 않는 환경입니다.", copied ? "success" : "error");
    if (copied)
      setTimeout(() => {
        openKakaoTalk();
      }, 400);
  };
  const st = { padding: "14px 16px", borderRadius: "14px", fontSize: `calc(15px * var(--fs,1))`, border: "1.5px solid #e0e0e0", background: "#fafafa", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
  const labelSt = { fontSize: `calc(11px * var(--fs,1))`, fontWeight: "700", color: "#94a3b8", display: "block", marginBottom: "4px", textTransform: "uppercase" };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { minHeight: "100dvh", background: "linear-gradient(160deg,#0a1628 0%,#0d2a4a 60%,#0056D2 100%)", paddingBottom: "80px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", padding: "16px", paddingTop: "calc(env(safe-area-inset-top,0px) + 16px)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => navigate(-1), style: { background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 20 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { style: { color: "#fff", fontWeight: "900", fontSize: `calc(18px * var(--fs,1))`, margin: 0 }, children: "📸 조황 인증" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "rgba(255,255,255,0.6)", fontSize: `calc(11px * var(--fs,1))`, margin: 0 }, children: "잡은 물고기를 인증하고 랭킹에 올리세요!" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "0 16px" }, children: [
      step === 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            ref: fileRef,
            type: "file",
            accept: "image/*",
            capture: "environment",
            style: { display: "none" },
            onChange: (e) => e.target.files[0] && handleFile(e.target.files[0])
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: { background: "rgba(255,255,255,0.08)", borderRadius: "24px", padding: "32px 16px", textAlign: "center", marginBottom: "16px", border: "2px dashed rgba(255,255,255,0.3)", cursor: "pointer" },
            onClick: () => fileRef.current?.click(),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "64px", marginBottom: "12px" }, children: "🐟" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#fff", fontWeight: "900", fontSize: `calc(18px * var(--fs,1))`, marginBottom: "6px" }, children: "물고기 사진 업로드" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "rgba(255,255,255,0.6)", fontSize: `calc(13px * var(--fs,1))` }, children: "사진을 찍고 어종/크기를 입력해 랭킹에 올리세요" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => fileRef.current?.click(), style: {
          width: "100%",
          padding: "16px",
          borderRadius: "16px",
          border: "none",
          background: "linear-gradient(135deg,#0056D2,#003fa3)",
          color: "#fff",
          fontWeight: "900",
          fontSize: `calc(16px * var(--fs,1))`,
          cursor: "pointer",
          boxShadow: "0 6px 20px rgba(0,86,210,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { size: 20 }),
          " 카메라로 찍기"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = (e) => handleFile(e.target.files[0]);
          input.click();
        }, style: {
          width: "100%",
          padding: "14px",
          borderRadius: "16px",
          border: "2px solid rgba(255,255,255,0.3)",
          background: "transparent",
          color: "#fff",
          fontWeight: "800",
          fontSize: `calc(15px * var(--fs,1))`,
          cursor: "pointer",
          marginTop: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { size: 18 }),
          " 갤러리에서 선택"
        ] })
      ] }),
      step === 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.97)", borderRadius: "24px", padding: "20px 16px", display: "flex", flexDirection: "column", gap: "12px" }, children: [
        imagePreview && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { borderRadius: "16px", overflow: "hidden", height: "200px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: imagePreview, alt: "preview", style: { width: "100%", height: "100%", objectFit: "cover" } }) }),
        closed && fishName && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#FFF3CD", borderRadius: "12px", padding: "12px", border: "1.5px solid #F59E0B", display: "flex", gap: "8px", alignItems: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { size: 20, color: GOLD }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(13px * var(--fs,1))`, color: "#92400E", fontWeight: "700" }, children: [
            "⚠️ ",
            fishName,
            " 금어기: ",
            fishRule?.closedSeason,
            " — 방류를 권장합니다"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: labelSt, children: "어종" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }, children: ["감성돔", "광어", "우럭", "볼락", "참돔", "농어", "방어", "고등어", "붕어", "잉어"].map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setFishName(f), style: {
            padding: "6px 12px",
            borderRadius: "20px",
            border: "none",
            cursor: "pointer",
            fontSize: `calc(12px * var(--fs,1))`,
            fontWeight: "700",
            background: fishName === f ? PRIMARY : "#f1f5f9",
            color: fishName === f ? "#fff" : "#475569"
          }, children: f }, f)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { style: st, type: "text", placeholder: "기타 어종 직접 입력", value: fishName, onChange: (e) => setFishName(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: labelSt, children: "크기 (cm)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { style: st, type: "number", inputMode: "decimal", placeholder: "예: 45", value: fishSize, onChange: (e) => setFishSize(e.target.value), min: 0, max: 500 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: labelSt, children: "무게 (kg)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { style: st, type: "number", inputMode: "decimal", placeholder: "예: 1.8", value: fishWeight, onChange: (e) => setFishWeight(e.target.value), min: 0, max: 100 })
          ] })
        ] }),
        fishRule?.minSize && fishSize && parseFloat(fishSize) < fishRule.minSize && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#FEE2E2", borderRadius: "10px", padding: "10px 12px", fontSize: `calc(12px * var(--fs,1))`, color: "#DC2626", fontWeight: "700" }, children: [
          "⚠️ ",
          fishName,
          " 최소 체장 ",
          fishRule.minSize,
          "cm 미만입니다. 방류를 권장합니다."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: labelSt, children: "낚시 장소" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { style: st, type: "text", placeholder: "예: 제주 성산포 갯바위", value: location, onChange: (e) => setLocation(e.target.value) })
        ] }),
        contests.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: labelSt, children: "대회 참가 (선택)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { style: st, value: contestId, onChange: (e) => setContestId(e.target.value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "참가 안함" }),
            contests.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: c._id, children: [
              "🏆 ",
              c.title,
              " (",
              c.fishName,
              ")"
            ] }, c._id))
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: labelSt, children: "한마디 (선택)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { style: st, type: "text", placeholder: "오늘의 채비, 미끼, 날씨 등...", value: memo, onChange: (e) => setMemo(e.target.value), maxLength: 100 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleSubmit, disabled: uploading || !fishName.trim(), style: {
          width: "100%",
          padding: "16px",
          borderRadius: "16px",
          border: "none",
          background: "linear-gradient(135deg,#0056D2,#003fa3)",
          color: "#fff",
          fontWeight: "900",
          fontSize: `calc(16px * var(--fs,1))`,
          cursor: "pointer",
          opacity: uploading || !fishName.trim() ? 0.6 : 1,
          boxShadow: "0 6px 20px rgba(0,86,210,0.35)"
        }, children: uploading ? "등록 중..." : "🎣 조황 등록하기" })
      ] }),
      step === 3 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.97)", borderRadius: "24px", padding: "24px 16px", textAlign: "center" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "56px", marginBottom: "8px" }, children: "🎉" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontWeight: "900", fontSize: `calc(22px * var(--fs,1))`, color: "#0d1b2a", marginBottom: "4px" }, children: "조황 인증 완료!" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "#64748b", fontSize: `calc(13px * var(--fs,1))`, marginBottom: "16px" }, children: "+30 EXP 획득 · 전국 랭킹에 등록되었습니다" }),
        shareCard && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: shareCard, alt: "share card", style: { width: "100%", borderRadius: "16px", marginBottom: "16px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "10px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: handleShare, style: {
            width: "100%",
            padding: "14px",
            borderRadius: "14px",
            border: "none",
            background: "linear-gradient(135deg,#FDE68A,#F59E0B)",
            color: "#78350F",
            fontWeight: "900",
            fontSize: `calc(15px * var(--fs,1))`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { size: 18 }),
            " 공유하기"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => navigate("/catch-ranking"), style: {
            width: "100%",
            padding: "14px",
            borderRadius: "14px",
            border: "none",
            background: "linear-gradient(135deg,#6366f1,#4f46e5)",
            color: "#fff",
            fontWeight: "900",
            fontSize: `calc(15px * var(--fs,1))`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { size: 18 }),
            " 전국 랭킹 보기"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => navigate("/"), style: {
            width: "100%",
            padding: "13px",
            borderRadius: "14px",
            border: "1.5px solid #e0e0e0",
            background: "#f8fafc",
            color: "#475569",
            fontWeight: "800",
            fontSize: `calc(14px * var(--fs,1))`,
            cursor: "pointer"
          }, children: "홈으로 돌아가기" })
        ] })
      ] })
    ] })
  ] });
}

export { CatchUploadPage as default };
