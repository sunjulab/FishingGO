function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = []
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
import { u as useNavigate, r as reactExports, R as React, _ as __vitePreload } from './vendor-react-BzbiWsGG.js';
import { u as useUserStore, b as useToastStore, A as ADMIN_ID, a as ADMIN_EMAIL, g as getLevelInfo, c as apiClient, j as jsxRuntimeExports, T as TIER_CONFIG } from './index-rdBGUi8d.js';
import { compressAvatar } from './imageUtils-BQ2gh6yW.js';
import { A as AdSenseDisplay } from './AdSenseAd-CQtTSdZ4.js';
import { t as Bell, Y as CreditCard, _ as ShieldAlert, $ as Camera, y as Check, a0 as PenLine, a1 as Trophy, a2 as Star, J as Heart, a3 as Calendar, U as Users, h as MessageSquare, a4 as BookOpen, n as MapPin, e as ChevronRight, a5 as History, a6 as ToggleRight, a7 as ToggleLeft, L as Lock } from './vendor-icons-C5BxRig-.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

const MENU_ITEMS = [
  {
    id: "noti",
    title: "알림 설정",
    color: "#0056D2",
    desc: "물때 및 커뮤니티 알림",
    icon: null
    /* 아이콘은 JSX 렌더 시 동적 연결 */
  },
  { id: "premium", title: "프리미엄 구독 관리", color: "#FF9B26", desc: "포인트 및 구독권 요금", icon: null },
  { id: "history", title: "결제 내역", color: "#00C48C", desc: "자동청구 현황 및 구독 취소", icon: null },
  { id: "security", title: "보안 및 차단 설정", color: "#FF5A5F", desc: "계정 보안 및 차단 목록", icon: null }
];
const DEFAULT_AVATAR_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23E5E5EA'/%3E%3Ccircle cx='20' cy='16' r='7' fill='%23AEAEB2'/%3E%3Cellipse cx='20' cy='36' rx='12' ry='9' fill='%23AEAEB2'/%3E%3C/svg%3E";
const safeLS = {
  set: (key, val) => {
    try {
      localStorage.setItem(key, val);
    } catch {
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
    }
  }
};
const DEFAULT_NOTI = { flow: true, bait: true, comm: true, chat: true };
const TIER_RANK_CLIENT = { FREE: 0, BUSINESS_LITE: 1, PRO: 2, BUSINESS_VIP: 3, MASTER: 4 };
const PROTECTED_TIERS_CLIENT = ["PRO", "BUSINESS_VIP", "MASTER"];
function MyPage() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const logout = useUserStore((s) => s.logout);
  const userTier = useUserStore((s) => s.userTier);
  const canAccessPartnerCenter = useUserStore((s) => s.canAccessBusinessShop?.());
  const addToast = useToastStore((s) => s.addToast);
  const fileInputRef = reactExports.useRef(null);
  const isAdmin = useUserStore(
    (s) => s.user?.id === ADMIN_ID || s.user?.email === ADMIN_EMAIL || s.user?.email === "sunjulab.k@gmail.com" || s.userTier === "MASTER"
  );
  const tierBadge = isAdmin ? TIER_CONFIG.MASTER : TIER_CONFIG[userTier] || TIER_CONFIG.FREE;
  const tierBadgeLabel = userTier === "BUSINESS_VIP" && user?.vvipHarborName ? "👑 VVIP " + user.vvipHarborName : tierBadge.label;
  const levelInfo = getLevelInfo(user?.totalExp || 0);
  const [activeTab, setActiveTab] = reactExports.useState("records");
  const [showModal, setShowModal] = reactExports.useState(null);
  const [realPosts, setRealPosts] = reactExports.useState([]);
  const [realRecords, setRealRecords] = reactExports.useState([]);
  const [myCrews, setMyCrews] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [leavingCrewId, setLeavingCrewId] = reactExports.useState(null);
  const [followModal, setFollowModal] = reactExports.useState(null);
  const [followList, setFollowList] = reactExports.useState([]);
  const [followLoading, setFollowLoading] = reactExports.useState(false);
  const [bizPhoneModal, setBizPhoneModal] = reactExports.useState(false);
  const [bizPhone, setBizPhone] = reactExports.useState({ phone: "", shipName: "" });
  const [galleryModal, setGalleryModal] = reactExports.useState(false);
  const [galleryForm, setGalleryForm] = reactExports.useState({ fish: "", size: "", weight: "", location: "", memo: "", image: null });
  const [gallerySubmitting, setGallerySubmitting] = reactExports.useState(false);
  const [myBizPosts, setMyBizPosts] = reactExports.useState([]);
  const [bizPostsModal, setBizPostsModal] = reactExports.useState(false);
  const [bizPostsLoading, setBizPostsLoading] = reactExports.useState(false);
  const [deletingBizId, setDeletingBizId] = reactExports.useState(null);
  const galleryFileRef = reactExports.useRef(null);
  const [isEditing, setIsEditing] = reactExports.useState(false);
  const [newName, setNewName] = reactExports.useState(user?.name || "");
  const [error, setError] = reactExports.useState("");
  const [notiSetting, setNotiSetting] = reactExports.useState(DEFAULT_NOTI);
  const [fontScale, setFontScale] = reactExports.useState(() => localStorage.getItem("fishinggo_fs") || "1");
  const [isHoveringAvatar, setIsHoveringAvatar] = reactExports.useState(false);
  const [secTab, setSecTab] = reactExports.useState(null);
  const [currentPwd, setCurrentPwd] = reactExports.useState("");
  const [newPwd, setNewPwd] = reactExports.useState("");
  const [confirmPwd, setConfirmPwd] = reactExports.useState("");
  const [blockName, setBlockName] = reactExports.useState("");
  const [blockedUsers, setBlockedUsers] = reactExports.useState([]);
  const handlePasswordChange = async () => {
    if (!currentPwd || !newPwd.trim())
      return addToast("비밀번호를 입력해주세요.", "error");
    if (newPwd.trim().length < 8)
      return addToast("새 비밀번호는 8자 이상이어야 합니다.", "error");
    if (currentPwd === newPwd.trim())
      return addToast("새 비밀번호는 현재 비밀번호와 다른 것으로 설정해주세요.", "error");
    if (newPwd.trim() !== confirmPwd.trim())
      return addToast("새 비밀번호가 일치하지 않습니다. 다시 확인해주세요.", "error");
    try {
      const res = await apiClient.put("/api/user/password", { email: user.email, currentPassword: currentPwd, newPassword: newPwd });
      if (res.data.success) {
        addToast("비밀번호가 성공적으로 변경되었습니다.", "success");
        setSecTab(null);
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
      }
    } catch (err) {
      addToast(err.response?.data?.error || "비밀번호 변경 실패", "error");
    }
  };
  const handleBlockUser = async () => {
    if (!blockName.trim())
      return addToast("차단할 사용자 닉네임을 입력해주세요.", "error");
    try {
      const res = await apiClient.post("/api/user/block", { email: user.email, blockTargetName: blockName.trim() });
      if (res.data.success) {
        addToast(`${blockName}님을 차단했습니다.`, "success");
        setBlockedUsers(res.data.blockedUsers);
        updateUser({ blockedUsers: res.data.blockedUsers });
        setBlockName("");
      }
    } catch (err) {
      addToast(err.response?.data?.error || "차단 실패", "error");
    }
  };
  const handleUnblockUser = async (targetName) => {
    try {
      const res = await apiClient.post("/api/user/unblock", { email: user.email, unblockTargetName: targetName });
      if (res.data.success) {
        addToast(`${targetName}님의 차단을 해제했습니다.`, "success");
        setBlockedUsers(res.data.blockedUsers);
        updateUser({ blockedUsers: res.data.blockedUsers });
      }
    } catch (err) {
      addToast("차단 해제 실패", "error");
    }
  };
  const handleTierChange = async (tier, name) => {
    if (tier === "BUSINESS_VIP") {
      setShowModal(null);
      navigate("/vvip-subscribe");
      return;
    }
    if (userTier === tier) {
      addToast("이미 해당 플랜을 이용 중입니다.", "info");
      return;
    }
    if (!user) {
      addToast("로그인이 필요합니다.", "error");
      return;
    }
    const currentRank = TIER_RANK_CLIENT[userTier] ?? 0;
    const targetRank = TIER_RANK_CLIENT[tier] ?? 0;
    if (PROTECTED_TIERS_CLIENT.includes(userTier) && targetRank < currentRank) {
      addToast(
        `현재 ${userTier === "BUSINESS_VIP" ? "Business VIP" : userTier} 구독 중입니다.
구독 해지는 고객센터를 통해 진행해주세요.`,
        "error"
      );
      return;
    }
    try {
      const identifier = user.email || user.id;
      const res = await apiClient.put("/api/user/tier", { email: identifier, tier });
      if (res.data.success) {
        const confirmedTier = res.data.tier || tier;
        useUserStore.getState().setUserTier(confirmedTier);
        updateUser({ tier: confirmedTier });
        addToast(`${name} 플랜으로 변경됐습니다.`, "success");
        setShowModal(null);
      }
    } catch (err) {
      const serverMsg = err.response?.data?.error;
      const serverTier = err.response?.data?.currentTier;
      if (err.response?.status === 403) {
        if (serverTier) {
          useUserStore.getState().setUserTier(serverTier);
          updateUser({ tier: serverTier });
        }
        addToast(serverMsg || "구독 변경이 차단되었습니다.", "error");
      } else {
        addToast(serverMsg || "플랜 변경 중 오류가 발생했습니다.", "error");
      }
      if (false)
        console.warn("[tierChange 실패]", err.response?.data || err.message);
    }
  };
  const handleOpenFollowModal = async (type) => {
    if (!user?.email)
      return;
    setFollowList([]);
    setFollowModal(type);
    setFollowLoading(true);
    try {
      const endpoint = type === "followers" ? "/api/user/followers" : "/api/user/following";
      const res = await apiClient.get(`${endpoint}?email=${encodeURIComponent(user.email)}`);
      const list = type === "followers" ? res.data.followers || [] : res.data.following || [];
      setFollowList(list);
    } catch (err) {
      addToast("목록을 불러오는 데 실패했습니다.", "error");
      setFollowModal(null);
    } finally {
      setFollowLoading(false);
    }
  };
  const handleOpenBizPhone = async () => {
    try {
      const res = await apiClient.get("/api/business/my-phone");
      setBizPhone(res.data);
      setBizPhoneModal(true);
    } catch {
      addToast("연락처 정보를 불러오지 못했습니다.", "error");
    }
  };
  const handleOpenBizPosts = async () => {
    setBizPostsLoading(true);
    setBizPostsModal(true);
    try {
      const res = await apiClient.get("/api/business/my-posts");
      setMyBizPosts(Array.isArray(res.data) ? res.data : []);
    } catch {
      addToast("홍보글을 불러오지 못했습니다.", "error");
    } finally {
      setBizPostsLoading(false);
    }
  };
  const handleDeleteBizPost = async (id) => {
    if (!window.confirm("홍보글을 삭제하시겠습니까?"))
      return;
    setDeletingBizId(id);
    try {
      await apiClient.delete(`/api/business/posts/${id}`);
      setMyBizPosts((prev) => prev.filter((p) => String(p._id || p.id) !== String(id)));
      addToast("홍보글이 삭제되었습니다.", "success");
    } catch (err) {
      addToast(err.response?.data?.error || "삭제 실패", "error");
    } finally {
      setDeletingBizId(null);
    }
  };
  const handleGalleryImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file)
      return;
    try {
      const { fileToCompressedBase64 } = await __vitePreload(() => import('./imageUtils-BQ2gh6yW.js'),true?__vite__mapDeps([]):void 0);
      const b64 = await fileToCompressedBase64(file);
      setGalleryForm((prev) => ({ ...prev, image: b64 }));
    } catch {
      addToast("이미지 처리 실패", "error");
    }
  };
  const handleGallerySubmit = async () => {
    if (!galleryForm.fish) {
      addToast("어종을 입력해주세요.", "error");
      return;
    }
    setGallerySubmitting(true);
    try {
      let shipInfo = bizPhone;
      if (!shipInfo.phone) {
        try {
          const r = await apiClient.get("/api/business/my-phone");
          shipInfo = r.data;
        } catch {
        }
      }
      const res = await apiClient.post("/api/business/gallery-post", {
        author: user.name,
        ...galleryForm,
        shipName: shipInfo.shipName,
        phone: shipInfo.phone
      });
      addToast(res.data.message || "오픈게시판 선상에 등록되었습니다! 🎣", "success");
      setGalleryModal(false);
      setGalleryForm({ fish: "", size: "", weight: "", location: "", memo: "", image: null });
    } catch (err) {
      addToast(err.response?.data?.error || "등록 실패", "error");
    } finally {
      setGallerySubmitting(false);
    }
  };
  const handleToggleNoti = async (key) => {
    const prevSettings = { ...notiSetting };
    const newSettings = { ...notiSetting, [key]: !notiSetting[key] };
    setNotiSetting(newSettings);
    updateUser({ notiSettings: newSettings });
    try {
      await apiClient.post("/api/user/settings", {
        email: user.email,
        notiSettings: newSettings
      });
    } catch (err) {
      addToast("설정 저장 실패", "error");
      setNotiSetting(prevSettings);
      updateUser({ notiSettings: prevSettings });
    }
  };
  const expPercentage = levelInfo.progressPct ?? 0;
  reactExports.useEffect(() => {
    if (!user)
      return;
    if (user.notiSettings)
      setNotiSetting(user.notiSettings);
    if (user.blockedUsers)
      setBlockedUsers(user.blockedUsers);
    if (user.name)
      setNewName(user.name);
  }, [user?.email]);
  const fetchUserData = React.useCallback(async () => {
    if (!user?.email || user.email === "guest@fishinggo.com" || user?.id === "GUEST" || user?.id === "guest")
      return;
    try {
      setLoading(true);
      const [postsResult, recordsResult, crewsResult] = await Promise.allSettled([
        apiClient.get(`/api/user/posts?email=${encodeURIComponent(user.email)}`),
        apiClient.get(`/api/user/records?email=${encodeURIComponent(user.email)}`),
        apiClient.get("/api/user/crews")
      ]);
      if (postsResult.status === "fulfilled")
        setRealPosts(postsResult.value.data);
      else if (false)
        console.warn("[MyPage] 게시글 로드 실패:", postsResult.reason?.message);
      if (recordsResult.status === "fulfilled")
        setRealRecords(recordsResult.value.data);
      else if (false)
        console.warn("[MyPage] 조과 기록 로드 실패:", recordsResult.reason?.message);
      if (crewsResult.status === "fulfilled")
        setMyCrews(crewsResult.value.data || []);
    } catch (err) {
      if (false)
        console.error("Failed to fetch my activity", err);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);
  reactExports.useEffect(() => {
    if (user?.email) {
      fetchUserData();
    }
  }, [user?.email, fetchUserData]);
  const handleNicknameChange = async () => {
    const trimmed = newName.trim();
    if (trimmed.length < 2 || trimmed.length > 12) {
      addToast("닉네임은 2~12자 사이로 입력해주세요.", "error");
      return;
    }
    const nicknameRegex = /^[a-zA-Z0-9가-힣]+$/;
    if (!nicknameRegex.test(trimmed)) {
      addToast("한글, 영어, 숫자만 사용 가능합니다.", "error");
      return;
    }
    try {
      const dupCheck = await apiClient.post("/api/auth/check-name", { name: trimmed, excludeEmail: user.email });
      if (!dupCheck.data.available) {
        if (dupCheck.data.banned) {
          addToast("이 닉네임은 사용할 수 없습니다. (운영 정책상 금지된 표현 포함)", "error");
        } else {
          addToast("이미 사용 중인 닉네임입니다.", "error");
        }
        return;
      }
    } catch {
    }
    try {
      const res = await apiClient.put(`/api/user/nickname`, {
        email: user.email,
        newName: trimmed
      });
      if (res.data.success) {
        updateUser({ name: res.data.name });
        setIsEditing(false);
        try {
          safeLS.remove("community_liked_posts");
        } catch {
        }
        addToast("닉네임이 성공적으로 변경되었습니다.", "success");
      }
    } catch (err) {
      addToast(err.response?.data?.error || "서버 연결 실패", "error");
    }
  };
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file)
      return;
    if (file.size > 5 * 1024 * 1024) {
      addToast("파일 크기는 5MB 이하만 가능합니다.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const base64 = await compressAvatar(ev.target.result);
        updateUser({ avatar: base64, picture: base64 });
        if (user?.email)
          safeLS.set(`avatar_${user.email}`, base64);
        try {
          const res = await apiClient.post("/api/user/avatar", {
            email: user.email,
            avatar: base64
          }, { timeout: 3e4 });
          if (res.data.success) {
            addToast("프로필 사진이 저장되었습니다! 📸", "success");
          }
        } catch (err) {
          if (false)
            console.error("Avatar server error:", err);
          addToast("📸 프로필 사진이 변경되었습니다! (로컬 저장)", "success");
        }
      } catch (compressErr) {
        if (false)
          console.error("이미지 압축 실패:", compressErr);
        addToast("이미지 처리 중 오류가 발생했습니다.", "error");
      }
    };
    reader.onerror = () => {
      addToast("파일을 읽을 수 없습니다. 다른 파일을 선택해주세요.", "error");
    };
    reader.readAsDataURL(file);
  };
  const handleLogout = () => {
    logout();
    if (user?.id === "GUEST") {
      addToast("로그인 페이지로 이동합니다.", "success");
    } else {
      addToast("로그아웃 되었습니다.", "success");
    }
    navigate("/login");
  };
  if (!user) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F8F9FA", gap: "16px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(48px * var(--fs, 1))` }, children: "🎣" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "800", color: "#1c1c1e" }, children: "로그인이 필요합니다" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => navigate("/login"),
          style: { padding: "14px 32px", background: "linear-gradient(135deg, #0056D2, #003fa3)", color: "#fff", border: "none", borderRadius: "16px", fontWeight: "900", fontSize: `calc(15px * var(--fs, 1))`, cursor: "pointer" },
          children: "로그인 / 회원가입"
        }
      )
    ] });
  }
  const menuItems = MENU_ITEMS.map((item) => ({
    ...item,
    icon: item.id === "noti" ? Bell : item.id === "premium" ? CreditCard : item.id === "history" ? CreditCard : ShieldAlert
  }));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-container", style: { backgroundColor: "#F8F9FA" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(180deg, #fff 0%, #F8F9FA 100%)", padding: "40px 24px 30px", borderBottom: "1px solid #F0F0F0" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "20px", alignItems: "center" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: { position: "relative", cursor: "pointer", flexShrink: 0 },
            onClick: () => fileInputRef.current?.click(),
            title: "사진 변경",
            onMouseEnter: () => setIsHoveringAvatar(true),
            onMouseLeave: () => setIsHoveringAvatar(false),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: user.avatar || user.picture || DEFAULT_AVATAR_SVG,
                  alt: "P",
                  style: {
                    width: "100px",
                    height: "100px",
                    borderRadius: "35px",
                    objectFit: "cover",
                    border: "4px solid #fff",
                    boxShadow: "0 15px 30px rgba(0,86,210,0.1)",
                    transition: "filter 0.2s",
                    filter: isHoveringAvatar ? "brightness(0.75)" : "brightness(1)"
                  }
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
                position: "absolute",
                inset: 0,
                borderRadius: "35px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isHoveringAvatar ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0)",
                transition: "background 0.2s",
                pointerEvents: "none"
              }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { size: 26, color: "#fff", style: { opacity: isHoveringAvatar ? 1 : 0, transition: "opacity 0.2s" } }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
                position: "absolute",
                bottom: "-6px",
                right: "-6px",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0056D2, #003fa3)",
                border: "2.5px solid #fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 10px rgba(0,86,210,0.35)"
              }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { size: 14, color: "#fff" }) }),
              tierBadgeLabel && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
                position: "absolute",
                top: "-8px",
                left: "-8px",
                background: tierBadge.bg,
                color: tierBadge.color,
                fontSize: `calc(10px * var(--fs, 1))`,
                fontWeight: "900",
                padding: "3px 9px",
                borderRadius: "12px",
                border: "2.5px solid #fff",
                letterSpacing: "0.02em",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                whiteSpace: "nowrap"
              }, children: tierBadgeLabel }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  ref: fileInputRef,
                  type: "file",
                  accept: "image/*",
                  style: { display: "none" },
                  onChange: handleAvatarChange
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", width: "100%" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: newName, onChange: (e) => setNewName(e.target.value), style: { background: "#fff", border: "2px solid #0056D2", borderRadius: "12px", padding: "8px 40px 8px 12px", fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "900", width: "100%", outline: "none" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 18, color: "#00C48C", style: { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }, onClick: handleNicknameChange })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontSize: `calc(22px * var(--fs, 1))`, fontWeight: "950", color: "#1c1c1e" }, children: user.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { onClick: () => setIsEditing(true), style: { backgroundColor: "#F2F2F7", padding: "6px", borderRadius: "8px", cursor: "pointer" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { size: 14, color: "#8E8E93" }) })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "600", marginTop: "2px" }, children: user.email }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              onClick: () => setShowModal("level"),
              style: { marginTop: "14px", background: "linear-gradient(135deg, #EBF2FF 0%, #F0FFF8 100%)", borderRadius: "18px", padding: "12px 16px", cursor: "pointer", border: "1.5px solid #D0E4FF" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px" }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(18px * var(--fs, 1))` }, children: levelInfo.emoji }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#0056D2", fontWeight: "900", letterSpacing: "0.04em" }, children: [
                        "LV.",
                        levelInfo.level
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "900", color: "#1c1c1e", lineHeight: 1.2 }, children: levelInfo.title })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "right" }, children: levelInfo.isMaxLevel ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", color: "#FFD700" }, children: "MAX LEVEL 🏆" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "700" }, children: [
                    levelInfo.expInCurrentLevel,
                    " / ",
                    levelInfo.expNeededForNext,
                    " XP"
                  ] }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "100%", height: "7px", background: "rgba(0,86,210,0.15)", borderRadius: "4px", overflow: "hidden" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
                  width: `${levelInfo.progressPct}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${levelInfo.color}, #00C48C)`,
                  borderRadius: "4px",
                  transition: "width 0.6s ease"
                } }) })
              ]
            }
          ),
          (user.streak || 0) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(14px * var(--fs, 1))` }, children: "🔥" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "800", color: "#FF5A5F" }, children: [
              user.streak,
              "일 연속 출석 중!"
            ] }),
            user.streak >= 7 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, background: "#FF5A5F", color: "#fff", padding: "2px 6px", borderRadius: "8px", fontWeight: "900" }, children: "+80 EXP 발동 중" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", backgroundColor: "#F2F2F7", borderRadius: "24px", overflow: "hidden", marginTop: "24px", border: "1.5px solid #F2F2F7" }, children: [
        { label: "조과기록", val: realRecords.length, icon: Trophy, color: "#FF9B26", onClick: () => setActiveTab("records") },
        { label: "팔로워", val: user.followers?.length || 0, icon: Star, color: "#0056D2", onClick: () => handleOpenFollowModal("followers") },
        { label: "팔로잉", val: user.following?.length || 0, icon: Heart, color: "#FF5A5F", onClick: () => handleOpenFollowModal("following") },
        { label: "연속출석", val: `${user.streak || 0}일`, icon: Calendar, color: "#00C48C", onClick: null }
      ].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: s.onClick, style: { backgroundColor: "#fff", padding: "14px 6px", textAlign: "center", cursor: s.onClick ? "pointer" : "default" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", marginBottom: "4px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(s.icon, { size: 11, color: s.color, fill: s.color }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "950", color: "#1c1c1e" }, children: s.val })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "700" }, children: s.label })
      ] }, s.label)) })
    ] }),
    userTier === "FREE" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "16px 24px 0" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdSenseDisplay, { style: { borderRadius: "12px", overflow: "hidden" } }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", padding: "20px 24px 10px", gap: "24px", overflowX: "auto" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: () => setActiveTab("records"), style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "950", color: activeTab === "records" ? "#1c1c1e" : "#C7C7CC", position: "relative", cursor: "pointer", whiteSpace: "nowrap" }, children: [
        "기록부 ",
        activeTab === "records" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", bottom: "-8px", left: 0, width: "100%", height: "4px", backgroundColor: "#0056D2", borderRadius: "2px" } })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: () => setActiveTab("posts"), style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "950", color: activeTab === "posts" ? "#1c1c1e" : "#C7C7CC", position: "relative", cursor: "pointer", whiteSpace: "nowrap" }, children: [
        "나의 피드 ",
        activeTab === "posts" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", bottom: "-8px", left: 0, width: "100%", height: "4px", backgroundColor: "#0056D2", borderRadius: "2px" } })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: () => setActiveTab("stats"), style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "950", color: activeTab === "stats" ? "#1c1c1e" : "#C7C7CC", position: "relative", cursor: "pointer", whiteSpace: "nowrap" }, children: [
        "조과통계 ",
        activeTab === "stats" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", bottom: "-8px", left: 0, width: "100%", height: "4px", backgroundColor: "#FF9B26", borderRadius: "2px" } })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: () => setActiveTab("crews"), style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "950", color: activeTab === "crews" ? "#1c1c1e" : "#C7C7CC", position: "relative", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "4px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 16 }),
        " 내 크루 ",
        myCrews.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(11px * var(--fs, 1))`, background: "#0056D2", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontWeight: "900" }, children: myCrews.length }),
        " ",
        activeTab === "crews" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", bottom: "-8px", left: 0, width: "100%", height: "4px", backgroundColor: "#0056D2", borderRadius: "2px" } })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "20px 24px", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)" }, children: activeTab === "stats" ? (() => {
      const speciesMap = {};
      realRecords.forEach((r) => {
        const sp = r.species || r.fish || r.content?.match(/(감성돔|벵에돔|숭어|고등어|참돔|농어|갈치|볼락|우럭|학공치|삼치|방어|광어|도다리|붕어|잉어|배스|쏘가리|민어|청어)/)?.[0] || "기타";
        speciesMap[sp] = (speciesMap[sp] || 0) + 1;
      });
      const entries = Object.entries(speciesMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
      const max = entries[0]?.[1] || 1;
      const BAR_COLORS = ["#0056D2", "#FF9B26", "#FF5A5F", "#00C48C", "#7C3AED", "#FFD700"];
      const monthMap = {};
      const now = /* @__PURE__ */ new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getMonth() + 1}월`;
        monthMap[key] = 0;
      }
      realRecords.forEach((r) => {
        if (!r.time && !r.createdAt)
          return;
        const d = new Date(r.time || r.createdAt);
        if (isNaN(d.getTime()))
          return;
        const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        if (diff >= 0 && diff < 6) {
          const key = `${d.getMonth() + 1}월`;
          if (key in monthMap)
            monthMap[key]++;
        }
      });
      const monthEntries = Object.entries(monthMap);
      const maxMonth = Math.max(...monthEntries.map(([, v]) => v), 1);
      const spotMap = {};
      realRecords.forEach((r) => {
        const spot = r.location || r.point || "기타";
        spotMap[spot] = (spotMap[spot] || 0) + 1;
      });
      const topSpots = Object.entries(spotMap).sort((a, b) => b[1] - a[1]).slice(0, 3);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "14px" }, children: [
          { label: "총 조과", val: realRecords.length, emoji: "📊", color: "#0056D2" },
          { label: "어종 수", val: entries.length, emoji: "🐟", color: "#FF9B26" },
          { label: "대표 어종", val: entries[0]?.[0] || "-", emoji: "🏆", color: "#FF5A5F" }
        ].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "16px", padding: "14px 10px", textAlign: "center", border: "1.5px solid #F2F2F7", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(20px * var(--fs, 1))`, marginBottom: "4px" }, children: s.emoji }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "950", color: s.color, wordBreak: "keep-all" }, children: s.val }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "700", marginTop: "2px" }, children: s.label })
        ] }, s.label)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "24px", padding: "20px", marginBottom: "14px", border: "1.5px solid #F2F2F7", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "950", marginBottom: "16px", color: "#1c1c1e" }, children: "📈 월별 조과 추이" }),
          realRecords.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "#8E8E93", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700", textAlign: "center", padding: "20px 0" }, children: "조과 기록이 없습니다." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", alignItems: "flex-end", gap: "6px", height: "80px" }, children: monthEntries.map(([month, cnt]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", color: "#0056D2" }, children: cnt > 0 ? cnt : "" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
              width: "100%",
              borderRadius: "6px 6px 0 0",
              height: `${Math.max(cnt / maxMonth * 60, cnt > 0 ? 8 : 2)}px`,
              background: cnt > 0 ? "linear-gradient(180deg, #0056D2, #42A5F5)" : "#F2F2F7",
              transition: "height 0.8s ease",
              minHeight: "2px"
            } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(9px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "700" }, children: month })
          ] }, month)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "24px", padding: "20px", marginBottom: "14px", border: "1.5px solid #F2F2F7", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "950", marginBottom: "16px", color: "#1c1c1e" }, children: "🐟 어종별 조과" }),
          entries.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "#8E8E93", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700", textAlign: "center", padding: "20px 0" }, children: "조과 기록이 없습니다." }) : entries.map(([sp, cnt], i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "12px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "5px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", color: "#1c1c1e" }, children: sp }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "950", color: BAR_COLORS[i] }, children: [
                cnt,
                "회"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: "8px", background: "#F2F2F7", borderRadius: "4px", overflow: "hidden" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: "100%", width: `${cnt / max * 100}%`, background: BAR_COLORS[i], borderRadius: "4px", transition: "width 0.8s ease" } }) })
          ] }, sp))
        ] }),
        topSpots.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "24px", padding: "20px", border: "1.5px solid #F2F2F7", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "950", marginBottom: "14px", color: "#1c1c1e" }, children: "⭐ 단골 포인트 TOP3" }),
          topSpots.map(([spot, cnt], i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: i < topSpots.length - 1 ? "12px" : 0 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              flexShrink: 0,
              background: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : "#CD7F32",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: `calc(12px * var(--fs, 1))`,
              fontWeight: "900",
              color: "#fff"
            }, children: i + 1 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: "#1c1c1e" }, children: spot }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "950", color: "#0056D2" }, children: [
              cnt,
              "회"
            ] })
          ] }, spot))
        ] })
      ] });
    })() : activeTab === "records" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }, children: [
      realRecords.length > 0 ? realRecords.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          onClick: () => navigate(`/catch/${String(r._id || r.id)}`),
          style: { backgroundColor: "#fff", borderRadius: "28px", overflow: "hidden", boxShadow: "0 8px 20px rgba(0,0,0,0.04)", border: "1.5px solid #F2F2F7", cursor: "pointer" },
          children: [
            r.image ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: r.image, style: { width: "100%", height: "140px", objectFit: "cover" }, alt: "" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "100%", height: "140px", background: "linear-gradient(135deg,#EBF5FF,#F0FFF8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: `calc(36px * var(--fs, 1))` }, children: "🎣" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "14px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(12px * var(--fs, 1))`, background: "#EBF5FF", color: "#0056D2", padding: "2px 8px", borderRadius: "8px", fontWeight: "800" }, children: r.fish || "어종 미입력" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#555", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: r.location || r.memo || "장소 미입력" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#AEAEB2", fontWeight: "600", marginTop: "2px" }, children: r.date || (r.createdAt ? String(r.createdAt).slice(0, 10) : "") })
            ] })
          ]
        },
        String(r._id || r.id)
      )) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { gridColumn: "span 2", padding: "40px", textAlign: "center", color: "#8E8E93" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(40px * var(--fs, 1))`, marginBottom: "10px" }, children: "🎣" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "700" }, children: "아직 등록된 조과 기록이 없습니다." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#AEAEB2", fontWeight: "600", marginTop: "4px" }, children: "첫 번째 조과를 등록해보세요!" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          onClick: () => {
            addToast("지도에서 낚시 포인트를 선택하면 조과 기록을 남길 수 있습니다! 🎣", "info");
            navigate("/");
          },
          style: { height: "190px", borderRadius: "28px", border: "2px dashed #00C48C", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", color: "#00C48C", cursor: "pointer", background: "rgba(0,196,140,0.03)" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { size: 28, color: "#00C48C" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "900", color: "#00C48C" }, children: "조과 기록 추가하기" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "700", color: "#8E8E93", textAlign: "center" }, children: "낚시 포인트 선택 → 조과 기록 남기기" })
          ]
        }
      )
    ] }) : activeTab === "crews" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: myCrews.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "48px 20px", textAlign: "center" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(48px * var(--fs, 1))`, marginBottom: "12px" }, children: "⚓" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "800", color: "#555", marginBottom: "6px" }, children: "아직 가입한 크루가 없습니다" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#8E8E93", marginBottom: "20px" }, children: "커뮤니티에서 크루에 참여해보세요!" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => navigate("/community?tab=crew"), style: { padding: "12px 28px", background: "linear-gradient(135deg,#0056D2,#0096FF)", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "800", fontSize: `calc(14px * var(--fs, 1))`, cursor: "pointer" }, children: "크루 찾아보기 🎣" })
    ] }) : myCrews.map((crew) => {
      const crewId = String(crew._id || crew.id);
      const isOwner = crew.owner === user?.email;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "20px", padding: "18px 20px", border: "1.5px solid #F2F2F7", marginBottom: "12px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isOwner ? 0 : "10px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }, children: [
              isOwner && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, background: "#FFD700", color: "#1c1c1e", padding: "2px 6px", borderRadius: "6px", fontWeight: "900" }, children: "크루장" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "900", color: "#1c1c1e" }, children: crew.name })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "10px", fontSize: `calc(12px * var(--fs, 1))`, color: "#8e8e93" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { display: "flex", alignItems: "center", gap: "3px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 12 }),
                " ",
                crew.members,
                "/",
                crew.limit || 20,
                "명"
              ] }),
              crew.region && crew.region !== "전국" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "📍 ",
                crew.region
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => navigate(`/crew/${crewId}/chat`), style: { padding: "8px 16px", background: "linear-gradient(135deg,#0056D2,#0096FF)", color: "#fff", border: "none", borderRadius: "12px", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer", flexShrink: 0 }, children: "채팅 입장" })
        ] }),
        !isOwner && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { disabled: leavingCrewId === crewId, onClick: async () => {
          setLeavingCrewId(crewId);
          try {
            await apiClient.post(`/api/community/crews/${crewId}/leave`, { email: user.email });
            setMyCrews((prev) => prev.filter((c) => String(c._id || c.id) !== crewId));
            addToast("크루에서 탈퇴했습니다.", "success");
          } catch (err) {
            addToast(err.response?.data?.error || "탈퇴 실패", "error");
          } finally {
            setLeavingCrewId(null);
          }
        }, style: { width: "100%", padding: "8px", border: "1.5px solid #FFE5E5", borderRadius: "10px", background: "#FFF0F0", color: "#FF3B30", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", cursor: "pointer" }, children: leavingCrewId === crewId ? "탈퇴 중..." : "크루 나가기" })
      ] }, crewId);
    }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexDirection: "column", gap: "12px" }, children: realPosts.length > 0 ? realPosts.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#fff", padding: "20px", borderRadius: "28px", border: "1.5px solid #F2F2F7" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "600", marginBottom: "8px" }, children: p.time }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "700", color: "#1c1c1e", margin: "0 0 16px" }, children: p.content }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "16px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "4px", fontSize: `calc(12px * var(--fs, 1))`, color: "#8e8e93", fontWeight: "700" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { size: 14, color: "#FF5A5F" }),
          " ",
          p.likes
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "4px", fontSize: `calc(12px * var(--fs, 1))`, color: "#8e8e93", fontWeight: "700" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { size: 14 }),
          " ",
          p.comments.length
        ] })
      ] })
    ] }, String(p._id || p.id))) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "40px", textAlign: "center", color: "#8E8E93" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "700" }, children: "등록된 게시글이 없습니다." }) }) }) }),
    canAccessPartnerCenter && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fade-in", style: { padding: "10px 24px 20px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "950", marginBottom: "14px", color: "#1A1A2E", display: "flex", alignItems: "center", gap: "8px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(20px * var(--fs, 1))` }, children: "👑" }),
        " 비즈니스 파트너 센터"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg, #1A1A2E 0%, #2A2A4A 100%)", borderRadius: "28px", padding: "24px", color: "#fff", boxShadow: "0 12px 30px rgba(26,26,46,0.2)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "rgba(255,255,255,0.1)", padding: "18px", borderRadius: "20px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(255,255,255,0.1)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11.5px * var(--fs, 1))`, color: "#FFD700", fontWeight: "900", marginBottom: "6px", letterSpacing: "0.02em" }, children: "📞 문의 연락처 관리" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "950", letterSpacing: "-0.02em" }, children: "전화·문자 연락처 확인" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.55)", marginTop: "4px", fontWeight: "600" }, children: "예약 문의 시 노출되는 번호입니다" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: handleOpenBizPhone,
              style: { backgroundColor: "#FFD700", color: "#1A1A2E", border: "none", padding: "12px 16px", borderRadius: "14px", fontWeight: "900", fontSize: `calc(13px * var(--fs, 1))`, cursor: "pointer", boxShadow: "0 4px 12px rgba(255,215,0,0.3)", whiteSpace: "nowrap" },
              children: "연락처 확인"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              onClick: () => setGalleryModal(true),
              style: { backgroundColor: "rgba(0,196,140,0.12)", border: "1px solid rgba(0,196,140,0.3)", padding: "16px 10px", borderRadius: "18px", cursor: "pointer", textAlign: "center", transition: "transform 0.15s" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { size: 24, color: "#00C48C", style: { marginBottom: "8px" } }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "900", marginBottom: "4px" }, children: "조과 갤러리" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.55)", fontWeight: "600", lineHeight: "1.3" }, children: [
                  "선상 게시판에",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
                  "자동 노출"
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              onClick: handleOpenBizPosts,
              style: { backgroundColor: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.25)", padding: "16px 10px", borderRadius: "18px", cursor: "pointer", textAlign: "center", transition: "transform 0.15s" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { size: 24, color: "#FFD700", style: { marginBottom: "8px" } }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "900", marginBottom: "4px" }, children: "내 홍보글" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.55)", fontWeight: "600", lineHeight: "1.3" }, children: [
                  "등록 게시글",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
                  "확인·삭제"
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              onClick: () => navigate("/write-business"),
              style: { backgroundColor: "rgba(0,86,210,0.15)", border: "1px solid rgba(0,86,210,0.3)", padding: "16px 10px", borderRadius: "18px", cursor: "pointer", textAlign: "center", transition: "transform 0.15s" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 24, color: "#4A9EFF", style: { marginBottom: "8px" } }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "900", marginBottom: "4px" }, children: "홍보글 등록" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.55)", fontWeight: "600", lineHeight: "1.3" }, children: [
                  "선박 홍보글",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
                  "새로 작성"
                ] })
              ]
            }
          )
        ] })
      ] })
    ] }),
    isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "0 24px 16px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg, #0A0F1C, #1A2340)", borderRadius: "20px", padding: "16px 18px", border: "1.5px solid rgba(255,215,0,0.25)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,215,0,0.7)", fontWeight: "900", letterSpacing: "0.1em", marginBottom: "12px" }, children: "⚙️ MASTER ADMIN" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => navigate("/cctv-admin"),
          style: { width: "100%", padding: "14px 16px", background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "14px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", color: "#fff", textAlign: "left" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "36px", height: "36px", background: "linear-gradient(135deg, #FFD700, #FFA000)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(18px * var(--fs, 1))` }, children: "📺" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "900", color: "#FFD700" }, children: "CCTV 채널 관리" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.5)", fontWeight: "600", marginTop: "2px" }, children: "지역별 YouTube ID 직접 수정 · 미리보기" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 16, color: "#FFD700" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => navigate("/secret-admin"),
          style: { width: "100%", padding: "14px 16px", background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "14px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", color: "#fff", textAlign: "left", marginTop: "8px" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "36px", height: "36px", background: "linear-gradient(135deg, #FF6B35, #E60000)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(18px * var(--fs, 1))` }, children: "⭐" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "900", color: "#FFD700" }, children: "비밀포인트 위치 수정" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.5)", fontWeight: "600", marginTop: "2px" }, children: "주소 검색으로 정확한 좌표 직접 지정" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 16, color: "#FFD700" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => navigate("/point-admin"),
          style: { width: "100%", padding: "14px 16px", background: "rgba(100,181,246,0.08)", border: "1px solid rgba(100,181,246,0.3)", borderRadius: "14px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", color: "#fff", textAlign: "left", marginTop: "8px" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "36px", height: "36px", background: "linear-gradient(135deg, #64B5F6, #0D47A1)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(18px * var(--fs, 1))` }, children: "📍" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "900", color: "#64B5F6" }, children: "낚시 포인트 위치 수정" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.5)", fontWeight: "600", marginTop: "2px" }, children: "항구 · 갯바위 · 방파제 · 민물 — 지도 클릭으로 이동" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 16, color: "#64B5F6" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => navigate("/admin-dashboard"),
          style: { width: "100%", padding: "14px 16px", background: "rgba(0,196,140,0.1)", border: "1px solid rgba(0,196,140,0.3)", borderRadius: "14px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", color: "#fff", textAlign: "left", marginTop: "8px" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "36px", height: "36px", background: "linear-gradient(135deg, #00C48C, #00897B)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(18px * var(--fs, 1))` }, children: "📊" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "900", color: "#00C48C" }, children: "수익 대시보드" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.5)", fontWeight: "600", marginTop: "2px" }, children: "월 매출 · 플랜별 구독자 · 최근 결제내역" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 16, color: "#00C48C" })
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "10px 24px 40px" }, children: [
      (() => {
        const LEVELS = [
          { key: "1", label: "기본", size: 14 },
          { key: "1.15", label: "크게", size: 16 },
          { key: "1.3", label: "더크게", size: 18 },
          { key: "1.5", label: "최대", size: 21 }
        ];
        const applyFs = (key) => {
          localStorage.setItem("fishinggo_fs", key);
          document.documentElement.setAttribute("data-fs", key);
          setFontScale(key);
        };
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { backgroundColor: "#fff", borderRadius: "28px", overflow: "hidden", border: "1.5px solid #F2F2F7", marginBottom: "12px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "18px 24px", borderBottom: "1px solid #F8F9FA" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { backgroundColor: "#EBF2FF", padding: "10px", borderRadius: "12px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(20px * var(--fs, 1))` }, children: "🔤" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "850", color: "#1c1c1e" }, children: "글씨 크기" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "600" }, children: "눈에 편한 크기로 조절하세요" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }, children: LEVELS.map((lv) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => applyFs(lv.key),
              style: {
                padding: "10px 4px",
                border: "none",
                borderRadius: "14px",
                cursor: "pointer",
                background: fontScale === lv.key ? "#0056D2" : "#F2F2F7",
                color: fontScale === lv.key ? "#fff" : "#555",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.2s",
                boxShadow: fontScale === lv.key ? "0 4px 12px rgba(0,86,210,0.3)" : "none"
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `${lv.size}px`, fontWeight: "900", lineHeight: 1 }, children: "가" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800" }, children: lv.label })
              ]
            },
            lv.key
          )) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: "12px", padding: "10px 14px", background: "#F8F9FC", borderRadius: "10px", fontSize: "calc(13px * var(--fs, 1))", color: "#555", fontWeight: "700" }, children: "미리보기 — 낚시GO 글씨 크기가 이렇게 표시됩니다." })
        ] }) });
      })(),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { backgroundColor: "#fff", borderRadius: "28px", overflow: "hidden", border: "1.5px solid #F2F2F7" }, children: menuItems.map((item) => (
        // ✅ 26TH-C3: key를 item.id로 교체
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: () => item.id === "history" ? navigate("/payment-history") : setShowModal(item.id), style: { padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: item.id !== "security" ? "1px solid #F8F9FA" : "none", cursor: "pointer" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "14px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { backgroundColor: `${item.color}15`, padding: "10px", borderRadius: "12px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(item.icon, { size: 20, color: item.color, strokeWidth: 2.5 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "850", color: "#1c1c1e" }, children: item.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "600" }, children: item.desc })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 18, color: "#C7C7CC" })
        ] }, item.id)
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: handleLogout,
          style: {
            width: "100%",
            padding: "20px",
            background: user?.id === "GUEST" ? "#0056D2" : "transparent",
            color: user?.id === "GUEST" ? "#fff" : "#FF5A5F",
            border: user?.id === "GUEST" ? "none" : "2px solid #FF5A5F22",
            borderRadius: "24px",
            fontWeight: "900",
            fontSize: `calc(16px * var(--fs, 1))`,
            marginTop: "24px",
            boxShadow: user?.id === "GUEST" ? "0 8px 20px rgba(0,86,210,0.3)" : "none"
          },
          children: user?.id === "GUEST" ? "회원가입 / 로그인 하러가기" : "로그아웃"
        }
      )
    ] }),
    showModal && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1e3, display: "flex", alignItems: "flex-end", justifyContent: "center" }, onClick: () => setShowModal(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { width: "100%", maxWidth: "480px", backgroundColor: "#fff", borderTopLeftRadius: "32px", borderTopRightRadius: "32px", padding: "32px 24px 60px", borderRadius: "inherit", animation: "slideUp 0.3s ease-out" }, onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "40px", height: "5px", background: "#E5E5EA", borderRadius: "3px", margin: "0 auto 24px" } }),
      showModal === "noti" && (() => {
        const notiPerm = typeof Notification !== "undefined" ? Notification.permission : "unsupported";
        const permColor = notiPerm === "granted" ? "#00C48C" : notiPerm === "denied" ? "#FF3B30" : "#FF9B26";
        const permLabel = notiPerm === "granted" ? "✅ 허용됨" : notiPerm === "denied" ? "❌ 차단됨 (설정에서 허용 필요)" : "⚠️ 미설정 (탭하여 허용)";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { fontSize: `calc(20px * var(--fs, 1))`, fontWeight: "900", marginBottom: "8px" }, children: "알림 설정" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              onClick: async () => {
                if (notiPerm === "default") {
                  const result = await Notification.requestPermission();
                  if (result === "granted")
                    addToast("✅ 알림이 허용되었습니다!", "success");
                  else
                    addToast("알림 허용이 필요합니다. 브라우저 설정에서 허용해주세요.", "error");
                } else if (notiPerm === "denied") {
                  addToast("브라우저 설정(주소창 자물쇠 아이콘)에서 직접 허용해주세요.", "info");
                }
              },
              style: {
                marginBottom: "20px",
                padding: "12px 16px",
                background: notiPerm === "granted" ? "#F0FFF8" : notiPerm === "denied" ? "#FFF0F0" : "#FFF8E6",
                border: `1.5px solid ${permColor}40`,
                borderRadius: "14px",
                cursor: notiPerm !== "granted" ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { size: 18, color: permColor }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "900", color: permColor }, children: "기기 알림 권한" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "700", color: "#555", marginTop: "2px" }, children: permLabel })
                ] }),
                notiPerm !== "granted" && /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 16, color: permColor })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexDirection: "column", gap: "20px" }, children: [
            { key: "flow", label: "물때 및 피딩 타임 알림", icon: History },
            { key: "bait", label: "실시간 미끼 추천 알림", icon: Trophy },
            { key: "comm", label: "커뮤니티 댓글 알림", icon: MessageSquare },
            { key: "chat", label: "채팅방 답장 · 멘션 알림", icon: Bell }
          ].map((n) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(n.icon, { size: 18, color: "#8E8E93" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "750" }, children: n.label })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { onClick: () => handleToggleNoti(n.key), style: { cursor: "pointer" }, children: notiSetting[n.key] !== false ? /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleRight, { size: 32, color: "#0056D2", fill: "#0056D2" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleLeft, { size: 32, color: "#E5E5EA" }) })
          ] }, n.key)) })
        ] });
      })(),
      showModal === "premium" && (() => {
        const planNames = {
          FREE: "무료",
          BUSINESS_LITE: "Business Lite",
          PRO: "PRO",
          BUSINESS_VIP: "Business VIP"
        };
        const isFree = userTier === "FREE";
        const PLANS = [
          {
            tier: "FREE",
            name: "무료",
            price: "₩0",
            badge: null,
            badgeColor: null,
            badgeBg: null,
            features: ["낚시 포인트 검색", "커뮤니티 열람", "조과 기록 등록", "게시글 등록 시 광고 시청 필요"],
            highlight: false
          },
          {
            tier: "BUSINESS_LITE",
            name: "Business Lite",
            price: "₩9,900/월",
            badge: "LITE",
            badgeColor: "#1A1A2E",
            badgeBg: "linear-gradient(135deg, #C0C0C0, #A0A0A0)",
            features: ["무료 기능 전체 포함", "게시글·크루 등록 시 광고 없음", "CCTV · 히트맵 · 비밀 포인트 열람", "비즈니스 파트너 센터 이용"],
            highlight: false
          },
          {
            tier: "PRO",
            name: "PRO",
            price: "₩110,000/월",
            badge: "PRO",
            badgeColor: "#fff",
            badgeBg: "linear-gradient(135deg, #0056D2, #003fa3)",
            features: ["Lite 기능 전체 포함", "선상 홍보글 작성 가능", "조과 갤러리 우선 노출", "전담 PRO 고객지원"],
            highlight: true
          },
          {
            tier: "BUSINESS_VIP",
            name: "Business VIP",
            price: "₩550,000/월",
            badge: "👑 VVIP",
            badgeColor: "#5C3A00",
            badgeBg: "linear-gradient(135deg, #FFD700, #FF9B26)",
            features: ["PRO 기능 전체 포함", "항구 독점 상단 고정 광고", "VIP 전용 1:1 운영자 채널", "월별 정산 리포트 제공"],
            highlight: false,
            exclusive: true
          }
        ];
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { fontSize: `calc(20px * var(--fs, 1))`, fontWeight: "900", marginBottom: "4px" }, children: "구독 관리" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "600", marginBottom: "20px" }, children: [
            "현재 플랜: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { style: { color: "#0056D2" }, children: planNames[userTier] || "무료" }),
            !isFree && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { marginLeft: "8px", fontSize: `calc(11px * var(--fs, 1))`, color: "#FF5A5F" }, children: "· 구독 중" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }, children: PLANS.map((plan) => {
            const isActive = userTier === plan.tier;
            const currentRankUI = TIER_RANK_CLIENT[userTier] ?? 0;
            const planRankUI = TIER_RANK_CLIENT[plan.tier] ?? 0;
            const isLocked = PROTECTED_TIERS_CLIENT.includes(userTier) && planRankUI < currentRankUI;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                onClick: () => handleTierChange(plan.tier, plan.name),
                style: {
                  padding: "16px 18px",
                  borderRadius: "18px",
                  cursor: isLocked ? "not-allowed" : "pointer",
                  border: isActive ? "2px solid #0056D2" : isLocked ? "1.5px solid #E5E5EA" : plan.highlight ? "2px solid #0056D230" : "1.5px solid #F0F0F0",
                  background: isActive ? "#EBF2FF" : isLocked ? "#F8F8FA" : plan.highlight ? "linear-gradient(135deg, #F0F5FF, #E8F0FF)" : "#fff",
                  transition: "all 0.15s",
                  position: "relative",
                  opacity: isLocked ? 0.55 : 1
                },
                children: [
                  isLocked && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", background: "#8E8E93", color: "#fff", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", padding: "3px 12px", borderRadius: "20px", whiteSpace: "nowrap" }, children: "🔒 구독 유지 중" }),
                  plan.highlight && !isActive && !isLocked && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #0056D2, #003fa3)", color: "#fff", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", padding: "3px 12px", borderRadius: "20px", whiteSpace: "nowrap" }, children: "인기 플랜" }),
                  plan.exclusive && !isActive && !isLocked && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #FFD700, #FF9B26)", color: "#5C3A00", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", padding: "3px 14px", borderRadius: "20px", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(255,215,0,0.5)" }, children: "항구 · 지역별 선착순 1명" }),
                  plan.exclusive && isActive && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #FFD700, #FF9B26)", color: "#5C3A00", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", padding: "3px 14px", borderRadius: "20px", whiteSpace: "nowrap" }, children: "항구 지역 독점 활성 중" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "7px", marginBottom: "6px" }, children: [
                        plan.badge && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, fontWeight: "900", padding: "2px 7px", borderRadius: "8px", background: isLocked ? "#C0C0C0" : plan.badgeBg, color: isLocked ? "#fff" : plan.badgeColor }, children: plan.badge }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "900", color: isLocked ? "#AEAEB2" : "#1c1c1e" }, children: plan.name }),
                        isActive && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#0056D2", fontWeight: "800" }, children: "✓ 현재" })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { style: { margin: 0, padding: "0 0 0 4px", listStyle: "none", display: "flex", flexDirection: "column", gap: "3px" }, children: plan.features.map((f, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: isLocked ? "#C0C0C0" : "#555", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px" }, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: isLocked ? "#C0C0C0" : "#0056D2", fontSize: `calc(10px * var(--fs, 1))` }, children: "✓" }),
                        " ",
                        f
                      ] }, i)) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "right", flexShrink: 0, marginLeft: "12px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "900", color: isActive ? "#0056D2" : isLocked ? "#AEAEB2" : "#1c1c1e", whiteSpace: "nowrap" }, children: plan.price }) })
                  ] })
                ]
              },
              plan.tier
            );
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#AEAEB2", textAlign: "center", fontWeight: "600" }, children: [
            "* 일반 피드 광고는 플랜과 무관하게 표시됩니다.",
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            "* 유료 플랜은 게시글·크루 등록 시 광고 시청이 면제됩니다."
          ] })
        ] });
      })(),
      showModal === "security" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { fontSize: `calc(20px * var(--fs, 1))`, fontWeight: "900", marginBottom: "24px" }, children: "보안 및 차단 설정" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              onClick: () => setSecTab(secTab === "pwd" ? null : "pwd"),
              style: { padding: "18px", border: "1px solid #F0F0F0", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: secTab === "pwd" ? "#F8F9FA" : "#fff" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { size: 18, color: "#8E8E93" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: "750" }, children: "비밀번호 변경" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 18, color: "#C7C7CC", style: { transform: secTab === "pwd" ? "rotate(90deg)" : "none", transition: "0.2s" } })
              ]
            }
          ),
          secTab === "pwd" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px", background: "#F8F9FA", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "10px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "password",
                placeholder: "현재 비밀번호",
                value: currentPwd,
                onChange: (e) => setCurrentPwd(e.target.value),
                style: { padding: "12px", borderRadius: "8px", border: "1px solid #D1D1D6", outline: "none", width: "100%", boxSizing: "border-box" }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "password",
                placeholder: "새 비밀번호 (8자 이상)",
                value: newPwd,
                onChange: (e) => setNewPwd(e.target.value),
                style: { padding: "12px", borderRadius: "8px", border: "1px solid #D1D1D6", outline: "none", width: "100%", boxSizing: "border-box" }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "password",
                  placeholder: "새 비밀번호 확인",
                  value: confirmPwd,
                  onChange: (e) => setConfirmPwd(e.target.value),
                  style: {
                    padding: "12px",
                    paddingRight: "44px",
                    borderRadius: "8px",
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                    border: confirmPwd.length === 0 ? "1px solid #D1D1D6" : newPwd.trim() === confirmPwd.trim() ? "1.5px solid #00C48C" : "1.5px solid #FF3B30"
                  }
                }
              ),
              confirmPwd.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: {
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "16px",
                pointerEvents: "none"
              }, children: newPwd.trim() === confirmPwd.trim() ? "✅" : "❌" })
            ] }),
            confirmPwd.length > 0 && newPwd.trim() !== confirmPwd.trim() && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#FF3B30", fontWeight: "700", marginTop: "-4px", paddingLeft: "4px" }, children: "⚠️ 새 비밀번호가 일치하지 않습니다" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: handlePasswordChange,
                disabled: !currentPwd || !newPwd || !confirmPwd || newPwd.trim() !== confirmPwd.trim(),
                style: {
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "800",
                  cursor: "pointer",
                  background: !currentPwd || !newPwd || !confirmPwd || newPwd.trim() !== confirmPwd.trim() ? "#E5E5EA" : "#0056D2",
                  color: !currentPwd || !newPwd || !confirmPwd || newPwd.trim() !== confirmPwd.trim() ? "#AEAEB2" : "#fff",
                  transition: "all 0.2s"
                },
                children: "변경하기"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              onClick: () => setSecTab(secTab === "block" ? null : "block"),
              style: { padding: "18px", border: "1px solid #F0F0F0", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: secTab === "block" ? "#F8F9FA" : "#fff" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { size: 18, color: "#8E8E93" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: "750" }, children: "차단 사용자 관리" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#FF5A5F", fontWeight: "800" }, children: [
                    blockedUsers.length,
                    "명"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 18, color: "#C7C7CC", style: { transform: secTab === "block" ? "rotate(90deg)" : "none", transition: "0.2s" } })
                ] })
              ]
            }
          ),
          secTab === "block" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px", background: "#F8F9FA", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "10px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { placeholder: "차단할 닉네임 입력", value: blockName, onChange: (e) => setBlockName(e.target.value), style: { flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #D1D1D6", outline: "none" } }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleBlockUser, style: { padding: "12px 16px", background: "#1c1c1e", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }, children: "차단" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }, children: [
              blockedUsers.map((bu) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "10px 14px", borderRadius: "8px", border: "1px solid #F0F0F0" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "700" }, children: bu }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleUnblockUser(bu), style: { padding: "6px 10px", fontSize: `calc(12px * var(--fs, 1))`, background: "#FF5A5F15", color: "#FF5A5F", border: "none", borderRadius: "6px", fontWeight: "800", cursor: "pointer" }, children: "해제" })
              ] }, bu)),
              blockedUsers.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#8E8E93", textAlign: "center", padding: "10px" }, children: "차단한 사용자가 없습니다." })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowModal(null), style: { width: "100%", marginTop: "32px", padding: "18px", background: "#1c1c1e", color: "#fff", border: "none", borderRadius: "20px", fontWeight: "900", fontSize: `calc(16px * var(--fs, 1))` }, children: "닫기" })
    ] }) }),
    followModal && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1100, display: "flex", alignItems: "flex-end", justifyContent: "center" },
        onClick: () => setFollowModal(null),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: { width: "100%", maxWidth: "480px", backgroundColor: "#fff", borderTopLeftRadius: "32px", borderTopRightRadius: "32px", padding: "28px 24px 48px", animation: "slideUp 0.3s ease-out" },
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "40px", height: "5px", background: "#E5E5EA", borderRadius: "3px", margin: "0 auto 20px" } }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { style: { fontSize: `calc(20px * var(--fs, 1))`, fontWeight: "900", margin: 0 }, children: [
                  followModal === "followers" ? "팔로워" : "팔로잉",
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(14px * var(--fs, 1))`, color: "#0056D2", fontWeight: "800", marginLeft: "8px" }, children: [
                    followList.length,
                    "명"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setFollowModal(null), style: { background: "none", border: "none", fontSize: `calc(22px * var(--fs, 1))`, cursor: "pointer", color: "#8E8E93" }, children: "✕" })
              ] }),
              followLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "40px 0", color: "#8E8E93", fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "700" }, children: "불러오는 중..." }) : followList.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "40px 0" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(36px * var(--fs, 1))`, marginBottom: "10px" }, children: "👤" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "700", color: "#8E8E93" }, children: followModal === "followers" ? "아직 팔로워가 없습니다." : "팔로잉 중인 사용자가 없습니다." })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexDirection: "column", gap: "10px", maxHeight: "60vh", overflowY: "auto" }, children: followList.map((u) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  onClick: () => {
                    setFollowModal(null);
                    navigate(`/user/${encodeURIComponent(u.name)}`);
                  },
                  style: { display: "flex", alignItems: "center", gap: "14px", padding: "12px 14px", background: "#F8F9FA", borderRadius: "16px", cursor: "pointer" },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      overflow: "hidden",
                      background: "linear-gradient(135deg, #0056D2, #00C48C)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: "900",
                      fontSize: `calc(16px * var(--fs, 1))`
                    }, children: u.avatar || u.picture ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: u.avatar || u.picture, style: { width: "100%", height: "100%", objectFit: "cover" }, alt: "" }) : u.name?.[0] || "?" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "800", color: "#1c1c1e" }, children: u.name || "이름 없음" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "600", marginTop: "2px" }, children: u.email })
                    ] })
                  ]
                },
                u.email
              )) })
            ]
          }
        )
      }
    ),
    bizPhoneModal && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9100, display: "flex", alignItems: "flex-end", justifyContent: "center" }, onClick: () => setBizPhoneModal(false), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: (e) => e.stopPropagation(), style: { background: "#fff", borderRadius: "28px 28px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: "480px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "40px", height: "4px", background: "#E5E5EA", borderRadius: "2px", margin: "0 auto 20px" } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "950", marginBottom: "6px" }, children: "📞 내 연락처 정보" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "600", marginBottom: "20px" }, children: "예약 문의 고객에게 노출되는 번호입니다" }),
      bizPhone.shipName && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#F8F9FA", borderRadius: "16px", padding: "14px 18px", marginBottom: "12px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "700", marginBottom: "4px" }, children: "선박명" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(17px * var(--fs, 1))`, fontWeight: "900", color: "#1c1c1e" }, children: [
          "🚢 ",
          bizPhone.shipName
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "#EBF5FF", borderRadius: "16px", padding: "18px", marginBottom: "20px", textAlign: "center" }, children: bizPhone.phone ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(26px * var(--fs, 1))`, fontWeight: "950", color: "#0056D2", letterSpacing: "0.02em", marginBottom: "12px" }, children: bizPhone.phone }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "10px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `tel:${bizPhone.phone}`, style: { flex: 1, padding: "13px", background: "#0056D2", color: "#fff", borderRadius: "14px", fontWeight: "900", fontSize: `calc(14px * var(--fs, 1))`, textDecoration: "none", textAlign: "center", display: "block" }, children: "📞 전화하기" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `sms:${bizPhone.phone}`, style: { flex: 1, padding: "13px", background: "#34C759", color: "#fff", borderRadius: "14px", fontWeight: "900", fontSize: `calc(14px * var(--fs, 1))`, textDecoration: "none", textAlign: "center", display: "block" }, children: "💬 문자하기" })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#8E8E93", fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "700", padding: "10px 0" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(28px * var(--fs, 1))`, marginBottom: "8px" }, children: "📵" }),
        "등록된 연락처가 없습니다.",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "선박 홍보글 등록 시 연락처를 입력해주세요.",
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
          setBizPhoneModal(false);
          navigate("/write-business");
        }, style: { display: "block", width: "100%", marginTop: "14px", padding: "12px", background: "#0056D2", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "900", cursor: "pointer" }, children: "홍보글 등록하기" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setBizPhoneModal(false), style: { width: "100%", padding: "14px", border: "1.5px solid #E5E5EA", borderRadius: "14px", background: "#fff", fontWeight: "800", cursor: "pointer", color: "#666" }, children: "닫기" })
    ] }) }),
    bizPostsModal && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9100, display: "flex", alignItems: "flex-end", justifyContent: "center" }, onClick: () => setBizPostsModal(false), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: (e) => e.stopPropagation(), style: { background: "#fff", borderRadius: "28px 28px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: "480px", maxHeight: "80vh", overflowY: "auto" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "40px", height: "4px", background: "#E5E5EA", borderRadius: "2px", margin: "0 auto 20px" } }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "950", color: "#1c1c1e" }, children: "🚢 내 선박 홍보글" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setBizPostsModal(false), style: { background: "none", border: "none", fontSize: `calc(22px * var(--fs, 1))`, cursor: "pointer", color: "#8E8E93" }, children: "✕" })
      ] }),
      bizPostsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "40px 0", color: "#8E8E93" }, children: "불러오는 중..." }) : myBizPosts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "40px 0" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(36px * var(--fs, 1))`, marginBottom: "10px" }, children: "🚢" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "700", color: "#8E8E93" }, children: "등록된 홍보글이 없습니다." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
          setBizPostsModal(false);
          navigate("/write-business");
        }, style: { marginTop: "14px", padding: "12px 24px", background: "#0056D2", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "900", cursor: "pointer" }, children: "홍보글 등록하기" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "12px" }, children: [
        myBizPosts.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#F8F9FA", borderRadius: "18px", padding: "16px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "900", color: "#1c1c1e" }, children: p.shipName || "선박명 미입력" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "600", marginTop: "2px" }, children: [
                p.region,
                " · ",
                p.type || p.boatType
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "6px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
                setBizPostsModal(false);
                navigate(`/write-business?editId=${p._id || p.id}`);
              }, style: { padding: "6px 10px", background: "#EBF5FF", color: "#0056D2", border: "none", borderRadius: "8px", fontWeight: "800", fontSize: `calc(12px * var(--fs, 1))`, cursor: "pointer" }, children: "수정" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleDeleteBizPost(p._id || p.id), disabled: deletingBizId === (p._id || p.id), style: { padding: "6px 10px", background: "#FFF0F0", color: "#FF3B30", border: "none", borderRadius: "8px", fontWeight: "800", fontSize: `calc(12px * var(--fs, 1))`, cursor: "pointer" }, children: deletingBizId === (p._id || p.id) ? "..." : "삭제" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#555", fontWeight: "600", lineHeight: "1.5", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }, children: p.content }),
          p.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#0056D2", fontWeight: "800", marginTop: "8px" }, children: [
            "📞 ",
            p.phone
          ] })
        ] }, String(p._id || p.id))),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
          setBizPostsModal(false);
          navigate("/write-business");
        }, style: { width: "100%", padding: "14px", background: "linear-gradient(135deg,#0056D2,#0096FF)", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "900", cursor: "pointer" }, children: "+ 새 홍보글 등록" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: galleryFileRef, type: "file", accept: "image/*", style: { display: "none" }, onChange: handleGalleryImageChange }),
    galleryModal && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9100, display: "flex", alignItems: "flex-end", justifyContent: "center" }, onClick: () => setGalleryModal(false), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: (e) => e.stopPropagation(), style: { background: "#fff", borderRadius: "28px 28px 0 0", padding: "28px 24px", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 40px)", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "40px", height: "4px", background: "#E5E5EA", borderRadius: "2px", margin: "0 auto 20px" } }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "950", color: "#1c1c1e" }, children: "🎣 조과 갤러리 등록" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setGalleryModal(false), style: { background: "none", border: "none", fontSize: `calc(22px * var(--fs, 1))`, cursor: "pointer", color: "#8E8E93" }, children: "✕" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "600", marginBottom: "20px" }, children: "오픈게시판 선상 카테고리에 자동으로 등록됩니다 🚢" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { onClick: () => galleryFileRef.current?.click(), style: { width: "100%", height: "150px", background: "#F8F9FA", borderRadius: "18px", border: "2px dashed #D1D1D6", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: "16px", overflow: "hidden" }, children: galleryForm.image ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: galleryForm.image, alt: "", style: { width: "100%", height: "100%", objectFit: "cover", borderRadius: "16px" } }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", color: "#8E8E93" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { size: 32, style: { marginBottom: "8px" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700" }, children: "사진 추가 (선택)" })
      ] }) }),
      [
        { key: "fish", label: "어종 *", placeholder: "예: 감성돔, 광어" },
        { key: "size", label: "사이즈 (cm)", placeholder: "예: 45" },
        { key: "weight", label: "무게 (kg)", placeholder: "예: 2.3" },
        { key: "location", label: "포인트/장소", placeholder: "예: 통영 욕지도" },
        { key: "memo", label: "한마디", placeholder: "예: 새벽 출조 대박조과!" }
      ].map(({ key, label, placeholder }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "12px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", color: "#444", marginBottom: "6px" }, children: label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: galleryForm[key], onChange: (e) => setGalleryForm((prev) => ({ ...prev, [key]: e.target.value })), placeholder, style: { width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1.5px solid #E5E5EA", fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "600", outline: "none", boxSizing: "border-box" } })
      ] }, key)),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleGallerySubmit, disabled: gallerySubmitting, style: { width: "100%", padding: "15px", background: gallerySubmitting ? "#ccc" : "linear-gradient(135deg,#00C48C,#00897B)", color: "#fff", border: "none", borderRadius: "16px", fontWeight: "900", fontSize: `calc(15px * var(--fs, 1))`, cursor: gallerySubmitting ? "not-allowed" : "pointer", marginTop: "4px" }, children: gallerySubmitting ? "등록 중..." : "🎣 오픈게시판에 등록하기" })
    ] }) })
  ] });
}

export { MyPage as default };
