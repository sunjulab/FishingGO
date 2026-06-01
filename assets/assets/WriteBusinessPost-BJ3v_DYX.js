import { b as useToastStore, u as useUserStore, A as ADMIN_ID, a as ADMIN_EMAIL, c as apiClient, j as jsxRuntimeExports } from './index-C2ieaxTI.js';
import { u as useNavigate, f as useSearchParams, r as reactExports } from './vendor-react-BzbiWsGG.js';
import { X, O as Phone, aq as Sparkles, ar as Image } from './vendor-icons-C5BxRig-.js';
import { M as MultiImageUpload } from './MultiImageUpload-B1jhwcl6.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';
import './imageUtils-BQ2gh6yW.js';

const FISH_TYPES = ["감성돔", "참돔", "방어", "광어", "대구", "문어", "쭈꾸미", "갑오징어", "우럭", "농어", "삼치", "고등어", "장어"];
const BOAT_TYPES = ["선상낚시", "야간선상", "에깅/문어", "선상루어", "캐스팅", "심해낚시", "갯바위 투어"];
const REGIONS = [
  // ✅ 마스터 전용: 전국 공지
  "전국 (전체)",
  // 강원 (동해)
  "강원 강릉",
  "강원 주문진",
  "강원 속초",
  "강원 고성(거진)",
  "강원 양양(낙산)",
  "강원 양양(남애)",
  "강원 동해(묵호)",
  "강원 삼척",
  // 경북 (동해)
  "경북 구룡포(포항)",
  "경북 감포(경주)",
  "경북 강구(영덕)",
  "경북 후포(울진)",
  "경북 죽변(울진)",
  // 경남 (남해 동부)
  "경남 통영",
  "경남 거제(대포)",
  "경남 거제(금포)",
  "경남 남해(미조)",
  "경남 남해(상주)",
  "경남 고성",
  // 전남 (남해 서부)
  "전남 여수(국동)",
  "전남 목포",
  "전남 완도",
  "전남 고흥(나로도)",
  "전남 진도",
  // 전북 (서해)
  "전북 군산(비응)",
  "전북 군산(야미도)",
  "전북 부안(격포)",
  "전북 부안(위도)",
  // 충남 (서해)
  "충남 태안(안흥)",
  "충남 태안(마검포)",
  "충남 보령(무창포)",
  "충남 보령(오천)",
  "충남 서산(삼길포)",
  // 인천 (서해)
  "인천 남항부두",
  "인천 연안부두",
  // 부산 (동·남해)
  "부산 기장",
  "부산 다대포",
  "부산 용호부두",
  // 제주
  "제주 도두항",
  "제주 애월항",
  "제주 서귀포",
  "제주 모슬포",
  "제주 성산항"
];
function generatePromoText({ shipName, region, boatType, targetFish, price, schedule, capacity, phone, extraMsg }) {
  const fishList = targetFish || "미정";
  const templates = [
    `🚢 ${region}에서 출발하는 ${shipName}과 함께 ${boatType}을 즐겨보세요! ${fishList} 전문 포인트를 직접 안내해 드립니다.

초보자부터 고수까지 모두 환영! 장비 대여 완비, 친절한 가이드로 최고의 하루를 만들어 드리겠습니다.

📅 일정: ${schedule}
👥 모집 인원: ${capacity}명
💰 가격: ${price}
📞 문의: ${phone}`,
    `✨ [${shipName}] ${boatType} — ${region} 출항

타겟 어종: ${fishList}
현지 베테랑 선장이 비밀 포인트로 직접 안내합니다. ${extraMsg || "여러분의 첫 대물을 저희와 함께 만나보세요."}

출조 일정: ${schedule} | 정원: ${capacity}명
인당 요금: ${price} (미끼·음료 기본 제공)
즉시 예약: ${phone}`,
    `🎣 ${region} ${boatType} 모집 — ${shipName}

이번 시즌 가장 뜨거운 포인트, ${fishList} 조황 최고조!
수십 년 경력 선장이 직접 운영하는 소규모 프리미엄 배낚시.

📋 출조 정보
• 일정: ${schedule}
• 정원: ${capacity}명 (소수 정예)
• 요금: ${price}
• 출발: ${region}  
📞 선착순 마감! 바로 연락 주세요: ${phone}`
  ];
  const hash = [...shipName + region].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return templates[hash % templates.length];
}
function WriteBusinessPost() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("editId");
  const isEditMode = !!editId;
  const addToast = useToastStore((s) => s.addToast);
  const user = useUserStore((s) => s.user);
  const userTier = useUserStore((s) => s.userTier);
  const isAdmin = useUserStore(
    (s) => s.user?.id === ADMIN_ID || s.user?.email === ADMIN_EMAIL || s.user?.email === "sunjulab.k@gmail.com" || // Gmail OAuth
    s.userTier === "MASTER"
  );
  const isPRO = userTier === "PRO";
  const isVVIP = userTier === "BUSINESS_VIP";
  const canWrite = isAdmin || isPRO || isVVIP;
  const [shipName, setShipName] = reactExports.useState("");
  const [region, setRegion] = reactExports.useState("");
  const [boatType, setBoatType] = reactExports.useState("");
  const [targetFish, setTargetFish] = reactExports.useState("");
  const [price, setPrice] = reactExports.useState("");
  const [schedule, setSchedule] = reactExports.useState("");
  const [capacity, setCapacity] = reactExports.useState("");
  const [phone, setPhone] = reactExports.useState("");
  const [extraMsg, setExtraMsg] = reactExports.useState("");
  const [images, setImages] = reactExports.useState([]);
  const [content, setContent] = reactExports.useState("");
  const [isPinned, setIsPinned] = reactExports.useState(false);
  const [myVipHarbor, setMyVipHarbor] = reactExports.useState(null);
  const [isGenerating, setIsGenerating] = reactExports.useState(false);
  const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
  const generateTimerRef = reactExports.useRef(null);
  const isReady = shipName.trim() && region && boatType && targetFish.trim() && price.trim() && schedule.trim() && String(capacity).trim() !== "" && phone.replace(/[^0-9]/g, "").length >= 8;
  reactExports.useEffect(() => {
    if (!isVVIP || isEditMode)
      return;
    apiClient.get("/api/vvip/my-slot").then((res) => {
      if (res.data?.hasSlot && res.data?.harbor) {
        const h = res.data.harbor;
        setMyVipHarbor({ id: h.id, name: h.name, key: h.key });
        setRegion(h.key);
        setIsPinned(true);
      }
    }).catch(() => {
    });
  }, [isVVIP]);
  reactExports.useEffect(() => {
    if (!isEditMode)
      return;
    apiClient.get(`/api/community/business/${editId}`).then((res) => {
      const data = res.data;
      setShipName(data.shipName || "");
      setRegion(data.region || "");
      setBoatType(data.type || "");
      setTargetFish(data.target || "");
      setPrice(data.price != null ? String(data.price) : "");
      setSchedule(data.date || "");
      setCapacity(data.capacity != null ? String(data.capacity) : "");
      setPhone(data.phone || "");
      setExtraMsg("");
      const existingImages = Array.isArray(data.images) && data.images.length > 0 ? data.images : data.cover ? [data.cover] : [];
      setImages(existingImages);
      setContent(data.content || "");
      setIsPinned(data.isPinned || false);
    }).catch((e) => {
      if (false)
        console.warn("[WriteBusinessPost] 수정 데이터 로드 실패:", e);
    });
  }, [editId]);
  const appendFish = (fish) => {
    setTargetFish((prev) => {
      const parts = prev.split("/").map((s) => s.trim()).filter(Boolean);
      if (parts.includes(fish))
        return prev;
      if (parts.length >= 4)
        return prev;
      return prev.trim() ? `${prev.trim()} / ${fish}` : fish;
    });
  };
  reactExports.useEffect(() => {
    return () => {
      if (generateTimerRef.current)
        clearTimeout(generateTimerRef.current);
    };
  }, []);
  const handleGenerateAI = () => {
    if (!isReady) {
      addToast("모든 필수 항목을 먼저 입력해주세요.", "error");
      return;
    }
    if (generateTimerRef.current)
      clearTimeout(generateTimerRef.current);
    setIsGenerating(true);
    generateTimerRef.current = setTimeout(() => {
      const generated = generatePromoText({ shipName, region, boatType, targetFish, price, schedule, capacity, phone, extraMsg });
      setContent(generated);
      setIsGenerating(false);
      generateTimerRef.current = null;
      addToast("✨ AI가 홍보 문구를 완성했습니다!", "success");
    }, 1200);
  };
  const handlePostClick = () => {
    if (!canWrite) {
      addToast("⚠️ 선상 홍보글은 PRO · VIP · 마스터만 등록 가능합니다.", "error");
      navigate("/community");
      return;
    }
    if (!isReady || !content.trim()) {
      addToast("모든 항목을 입력하고 홍보 문구를 생성해주세요.", "error");
      return;
    }
    const cap = Number(capacity);
    const maxCap = isAdmin ? 1e3 : 200;
    if (String(capacity).trim() === "" || isNaN(cap) || cap < 1 || cap > maxCap) {
      addToast(`인원은 1~${maxCap}사이의 숫자로 입력해주세요.`, "error");
      return;
    }
    const digitsOnly = phone.replace(/[^0-9]/g, "");
    const phoneRegex = /^(02\d{7,8}|0[3-9]\d{7,8}|1[0-9]{3}\d{4}|[0-9]{3}\d{7,8})$/;
    if (digitsOnly.length < 8 || digitsOnly.length > 11 || !phoneRegex.test(digitsOnly)) {
      addToast("올바른 전화번호를 입력해주세요. (예: 010-1234-5678 / 02-1234-5678 / 1588-1234)", "error");
      return;
    }
    doPost();
  };
  const doPost = async () => {
    setIsSubmitting(true);
    const storedUser = user;
    if (!storedUser) {
      addToast("로그인이 필요합니다.", "error");
      setIsSubmitting(false);
      return;
    }
    try {
      const safeImages = images.filter((img) => img && img.length <= 4 * 1024 * 1024);
      const bizCover = safeImages[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23E8EBF0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='36' fill='%23B0B8C8'%3E%F0%9F%9A%A2%3C/text%3E%3C/svg%3E";
      const payload = {
        author: storedUser.name,
        author_email: storedUser.email,
        shipName,
        region,
        type: boatType,
        target: targetFish.trim() || "미정",
        price,
        date: schedule,
        capacity: Number(capacity),
        phone,
        content,
        isPinned: (isAdmin || isVVIP) && isPinned,
        cover: bizCover,
        images: safeImages
        // ✅ MULTI-IMG: 전체 배열
      };
      if (isEditMode) {
        payload.email = storedUser.email;
      }
      const method = isEditMode ? "put" : "post";
      const url = isEditMode ? `/api/community/business/${editId}` : `/api/community/business`;
      await apiClient[method](url, isEditMode ? payload : { ...payload, category: "선상" });
      addToast(isEditMode ? "✅ 홍보글이 수정되었습니다!" : "🚢 선상 배 홍보글이 등록되었습니다!", "success");
      navigate(isEditMode ? window.history.length <= 1 ? "/community" : -1 : "/community?tab=business");
    } catch (err) {
      if (false)
        console.error("Business post error:", err);
      if (err.response?.status === 409) {
        const existingId = err.response?.data?.existingId;
        addToast("이미 홍보글이 있습니다. 기존 글을 수정해주세요.", "warning");
        if (existingId)
          navigate(`/write-business?editId=${existingId}`);
        else
          navigate("/community?tab=business");
      } else {
        const msg = err.response?.data?.error || "등록 실패. 다시 시도해주세요.";
        addToast(msg, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#F2F2F7", minHeight: "100dvh", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)", maxWidth: "430px", margin: "0 auto", position: "relative" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#fff", padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0", position: "sticky", top: 0, zIndex: 100 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => window.history.length <= 1 ? navigate("/community", { replace: true }) : navigate(-1), style: { border: "none", background: "none" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 22, color: "#1c1c1e" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "900", margin: 0 }, children: isEditMode ? "홍보글 수정" : "선상 배 홍보 등록" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          disabled: !isReady || !content || isSubmitting,
          onClick: handlePostClick,
          style: { border: "none", background: isReady && content ? "#0056D2" : "#f0f0f0", color: isReady && content ? "#fff" : "#bbb", padding: "6px 14px", borderRadius: "16px", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", cursor: isReady && content ? "pointer" : "default" },
          children: isSubmitting ? "저장 중..." : isEditMode ? "✅ 수정 완료" : "등록 ›"
        }
      )
    ] }),
    !canWrite && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { margin: "12px 12px 0", background: "linear-gradient(135deg,#FF5A5F,#FF3B30)", borderRadius: "14px", padding: "14px 16px", color: "#fff", display: "flex", alignItems: "center", gap: "12px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(22px * var(--fs, 1))` }, children: "🔒" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", marginBottom: "2px" }, children: "PRO · VIP · 마스터 전용" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, opacity: 0.85 }, children: "선상 홍보글 등록은 PRO 이상 플랜만 가능합니다." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { backgroundColor: "#fff", borderRadius: "16px", padding: "14px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "900", color: "#8E8E93", marginBottom: "12px" }, children: "📸 배 사진 (최대 5장)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          MultiImageUpload,
          {
            images,
            onChange: setImages,
            maxCount: 5,
            label: "배 사진 추가"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { backgroundColor: "#fff", borderRadius: "16px", padding: "14px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "900", color: "#8E8E93", marginBottom: "10px" }, children: "🚢 기본 정보" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: shipName, onChange: (e) => setShipName(e.target.value), placeholder: "배 이름 (예: 강릉 에이스호)", style: INPUT_STYLE }),
          myVipHarbor && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 13px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #1A1A2E, #0F3460)",
            border: "1.5px solid #FFD700"
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(16px * var(--fs, 1))` }, children: "👑" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "900", color: "#FFD700" }, children: "내 VIP 항구 — 자동 설정됨" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", color: "#fff" }, children: [
                myVipHarbor.name,
                " VIP"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, backgroundColor: "#FFD700", color: "#1A1A2E", padding: "2px 8px", borderRadius: "8px", fontWeight: "900" }, children: "고정" })
          ] }),
          myVipHarbor ? (
            // VIP: 항구 고정 (변경 불가)
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { ...INPUT_STYLE, color: "#555", backgroundColor: "#F8F9FA", display: "flex", alignItems: "center", gap: "6px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(12px * var(--fs, 1))` }, children: "📍" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: myVipHarbor.key }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { marginLeft: "auto", fontSize: `calc(10px * var(--fs, 1))`, color: "#FFD700", fontWeight: "900" }, children: "VIP 고정" })
            ] })
          ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: region, onChange: (e) => setRegion(e.target.value), style: INPUT_STYLE, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "📍 출항 지역 / 항구 선택" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "option",
              {
                value: "전국 (전체)",
                disabled: !isAdmin,
                style: { fontWeight: "900", color: isAdmin ? "#0056D2" : "#ccc", background: isAdmin ? "#EFF7FF" : "#fafafa" },
                children: isAdmin ? "🌐 전국 (전체) — MASTER 전용" : "🔒 전국 (전체) — 마스터 전용"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { disabled: true, style: { color: "#ccc", fontSize: `calc(11px * var(--fs, 1))` }, children: "────────────────" }),
            REGIONS.filter((r) => r !== "전국 (전체)").map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: r, children: r }, r))
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: boatType, onChange: (e) => setBoatType(e.target.value), style: INPUT_STYLE, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "🎣 출조 타입 선택" }),
            BOAT_TYPES.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: t, children: t }, t))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { backgroundColor: "#fff", borderRadius: "16px", padding: "14px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "900", color: "#8E8E93", marginBottom: "8px" }, children: "🐟 목표 어종 (직접입력 또는 아래 선택)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            value: targetFish,
            onChange: (e) => setTargetFish(e.target.value),
            placeholder: "예: 감성돔 / 우럭 / 방어  (최대 4종, / 로 구분)",
            style: { ...INPUT_STYLE, marginBottom: "10px" }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#aaa", fontWeight: "700", marginBottom: "6px" }, children: "빠른 선택 (클릭 시 자동 추가)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px" }, children: FISH_TYPES.map((fish) => {
          const parts = targetFish.split("/").map((s) => s.trim()).filter(Boolean);
          const selected = parts.includes(fish);
          const maxed = parts.length >= 4 && !selected;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => appendFish(fish),
              disabled: maxed,
              style: {
                padding: "6px 12px",
                borderRadius: "20px",
                border: "none",
                cursor: maxed ? "not-allowed" : "pointer",
                fontSize: `calc(12px * var(--fs, 1))`,
                fontWeight: "800",
                backgroundColor: selected ? "#0056D2" : maxed ? "#F8F8F8" : "#F2F2F7",
                color: selected ? "#fff" : maxed ? "#ccc" : "#555",
                transition: "all 0.15s",
                opacity: maxed ? 0.5 : 1
              },
              children: [
                selected && "✓ ",
                fish
              ]
            },
            fish
          );
        }) }),
        targetFish && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setTargetFish(""),
            style: { marginTop: "8px", padding: "4px 10px", borderRadius: "10px", border: "1px solid #E5E5EA", background: "#fff", color: "#FF3B30", fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer" },
            children: "✕ 초기화"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { backgroundColor: "#fff", borderRadius: "16px", padding: "14px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "900", color: "#8E8E93", marginBottom: "10px" }, children: "📌 출조 상세" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: price, onChange: (e) => setPrice(e.target.value), placeholder: "💰 인당 가격 (예: 인당 12만원)", style: INPUT_STYLE }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: schedule, onChange: (e) => setSchedule(e.target.value), placeholder: "📅 출조 일정 (예: 매주 주말 오전 5시 출항)", style: INPUT_STYLE }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: capacity,
              onChange: (e) => setCapacity(e.target.value.replace(/[^0-9]/g, "")),
              placeholder: isAdmin ? "👥 모집 인원 (1~1000명, 전국 공지용)" : "👥 모집 인원 (숫자만, 최대 200명)",
              style: INPUT_STYLE,
              type: "text",
              inputMode: "numeric",
              pattern: "[0-9]*",
              min: "1",
              max: isAdmin ? 1e3 : 200
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { backgroundColor: "#fff", borderRadius: "16px", padding: "14px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "900", color: "#8E8E93", marginBottom: "8px" }, children: "📞 직통 연락처 (즉시 전화 연결)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "10px", alignItems: "center", backgroundColor: "#F0F7FF", borderRadius: "12px", padding: "12px 14px", border: "1.5px solid #0056D2" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 18, color: "#0056D2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: phone,
              onChange: (e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                let digits = raw;
                let formatted = digits;
                if (digits.startsWith("02")) {
                  digits = digits.slice(0, 10);
                  if (digits.length <= 2)
                    formatted = digits;
                  else if (digits.length <= 6)
                    formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`;
                  else
                    formatted = `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
                } else if (digits.startsWith("1") && digits.length <= 8) {
                  digits = digits.slice(0, 8);
                  if (digits.length <= 4)
                    formatted = digits;
                  else
                    formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
                } else {
                  digits = digits.slice(0, 11);
                  if (digits.length <= 3)
                    formatted = digits;
                  else if (digits.length <= 7)
                    formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
                  else
                    formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
                }
                setPhone(formatted);
              },
              placeholder: "010-0000-0000",
              type: "tel",
              style: { flex: 1, border: "none", background: "transparent", fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "800", outline: "none", color: "#0056D2" }
            }
          )
        ] }),
        phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `tel:${phone}`, style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "8px", padding: "10px", backgroundColor: "#0056D2", borderRadius: "10px", color: "#fff", fontWeight: "900", fontSize: `calc(13px * var(--fs, 1))`, textDecoration: "none" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 14 }),
          " 테스트 통화"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { backgroundColor: "#fff", borderRadius: "16px", padding: "14px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "900", color: "#8E8E93", marginBottom: "8px" }, children: "✏️ 추가 홍보 포인트 (선택)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: extraMsg, onChange: (e) => setExtraMsg(e.target.value), placeholder: "예: 장비 무료 대여 / 점심 도시락 제공...", style: { ...INPUT_STYLE, minHeight: "60px", resize: "none" } })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { backgroundColor: "#fff", borderRadius: "16px", padding: "14px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "900", color: "#8E8E93" }, children: "🤖 AI 홍보 문구" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: handleGenerateAI,
              disabled: !isReady || isGenerating,
              style: { display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "16px", border: "none", background: isReady ? "linear-gradient(135deg, #7C3AED, #4F46E5)" : "#f0f0f0", color: isReady ? "#fff" : "#bbb", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", cursor: isReady ? "pointer" : "default" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 12 }),
                isGenerating ? "생성 중..." : "AI 자동 생성"
              ]
            }
          )
        ] }),
        content ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: content,
            onChange: (e) => setContent(e.target.value),
            style: { ...INPUT_STYLE, minHeight: "160px", resize: "none", lineHeight: "1.6", whiteSpace: "pre-line", fontFamily: "inherit" }
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: "72px", backgroundColor: "#F8F9FA", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: `calc(12px * var(--fs, 1))` }, children: "위 정보 입력 후 'AI 자동 생성'을 눌러주세요" })
      ] }),
      (isAdmin || isVVIP) && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "section",
        {
          onClick: () => {
            if (isAdmin)
              setIsPinned((prev) => !prev);
          },
          style: {
            borderRadius: "16px",
            padding: "14px 16px",
            cursor: isAdmin ? "pointer" : "default",
            background: isPinned ? "linear-gradient(135deg, #1A1A2E, #0F3460)" : "#fff",
            border: isPinned ? "2px solid #FFD700" : "2px dashed #FFD700",
            transition: "all 0.2s",
            userSelect: "none"
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
              width: "24px",
              height: "24px",
              borderRadius: "8px",
              flexShrink: 0,
              border: isPinned ? "none" : "2px solid #FFD700",
              background: isPinned ? "linear-gradient(135deg, #FFD700, #FF9B26)" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }, children: isPinned && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "900" }, children: "✓" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: isPinned ? "#FFD700" : "#B8860B", marginBottom: "2px" }, children: "👑 VVIP 프리미엄 스폰서로 등록하기" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: isPinned ? "rgba(255,215,0,0.8)" : "#999" }, children: "선상 배 홍보 피드 최상단에 '금빛 테두리 + VVIP 뱃지'로 영구 고정 노출 됩니다" }),
              isVVIP && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#FFD700", marginTop: "3px", fontWeight: "700" }, children: "✅ VIP 구독자 — 자동 체크됨 (변경 불가)" }),
              isAdmin && !isVVIP && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#FF9B26", marginTop: "3px", fontWeight: "700" }, children: "🔧 마스터 전용 테스트 모드" })
            ] }),
            isPinned && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(18px * var(--fs, 1))` }, children: "📌" })
          ] })
        }
      ),
      isReady && content && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: "#8E8E93", marginBottom: "12px", paddingLeft: "4px" }, children: "📱 등록 후 보여지는 카드 미리보기" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#fff", borderRadius: "20px", overflow: "hidden", border: "1.5px solid #F0F2F7", boxShadow: "0 4px 14px rgba(0,0,0,0.05)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px", display: "flex", gap: "14px" }, children: [
            images[0] ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: images[0], style: { width: "90px", height: "90px", borderRadius: "14px", objectFit: "cover", flexShrink: 0 }, alt: "커버" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "90px", height: "90px", borderRadius: "14px", flexShrink: 0, backgroundColor: "#F2F2F7", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { size: 28 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "6px", alignItems: "center", marginBottom: "6px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, background: "#FF5A5F", color: "#fff", padding: "3px 8px", borderRadius: "6px", fontWeight: "950" }, children: "예약 모집중" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "900", color: "#1A1A2E" }, children: shipName })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { margin: "0 0 8px", fontSize: `calc(12px * var(--fs, 1))`, color: "#555", lineHeight: "1.5" }, children: [
                (content || "").slice(0, 52),
                "..."
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px", fontSize: `calc(11px * var(--fs, 1))` }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: "#F4F6FA", padding: "4px 10px", borderRadius: "8px", color: "#333" }, children: targetFish || "미정" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: "#F4F6FA", padding: "4px 10px", borderRadius: "8px", color: "#333" }, children: schedule }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { background: "#FFF3E0", padding: "4px 10px", borderRadius: "8px", color: "#E65100", fontWeight: "900" }, children: [
                  "인당 ",
                  price
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "12px 16px", backgroundColor: "#F8F9FA", borderTop: "1px solid #F0F2F7", display: "flex", gap: "8px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `tel:${phone}`, onClick: (e) => e.preventDefault(), style: { flex: 1, backgroundColor: "#0056D2", color: "#fff", padding: "13px", borderRadius: "12px", fontWeight: "950", fontSize: `calc(14px * var(--fs, 1))`, display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", textDecoration: "none" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 15, fill: "#fff" }),
              " 선장님께 즉시 전화"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { backgroundColor: "#fff", color: "#0056D2", border: "1.5px solid #0056D2", padding: "13px 16px", borderRadius: "12px", fontWeight: "900", fontSize: `calc(13px * var(--fs, 1))`, display: "flex", alignItems: "center", gap: "6px" }, children: "💬 앱 채팅" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px", padding: "12px 16px", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)", backgroundColor: "#fff", borderTop: "1px solid #f0f0f0", boxSizing: "border-box" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        disabled: !isReady || !content || isSubmitting || !canWrite,
        onClick: handlePostClick,
        style: {
          width: "100%",
          padding: "15px",
          borderRadius: "16px",
          border: "none",
          background: isReady && content && canWrite ? "linear-gradient(135deg, #0056D2, #0096FF)" : "#f0f0f0",
          color: isReady && content && canWrite ? "#fff" : "#bbb",
          fontSize: `calc(15px * var(--fs, 1))`,
          fontWeight: "900",
          cursor: isReady && content && canWrite ? "pointer" : "not-allowed",
          boxShadow: isReady && content && canWrite ? "0 6px 18px rgba(0,86,210,0.25)" : "none"
        },
        children: !canWrite ? "🔒 PRO · VIP · 마스터만 등록 가능" : isSubmitting ? "저장 중..." : isEditMode ? "✅ 홍보글 수정 완료" : "🚢 선상 홍보 카드 등록하기"
      }
    ) })
  ] });
}
const INPUT_STYLE = {
  width: "100%",
  padding: "11px 13px",
  borderRadius: "12px",
  border: "1.5px solid #E5E5EA",
  backgroundColor: "#FAFAFA",
  fontSize: `calc(14px * var(--fs, 1))`,
  fontWeight: "600",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit"
};

export { WriteBusinessPost as default };
