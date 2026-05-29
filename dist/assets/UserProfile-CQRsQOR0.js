import { u as useUserStore, b as useToastStore, c as apiClient, j as jsxRuntimeExports } from './index-rdBGUi8d.js';
import { h as useParams, u as useNavigate, r as reactExports } from './vendor-react-BzbiWsGG.js';
import { d as ChevronLeft, aC as Flame, a2 as Star, aD as UserCheck, aE as FileText, a1 as Trophy, ay as UserPlus, a3 as Calendar } from './vendor-icons-C5BxRig-.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

const TIER_BADGE = {
  MASTER: { bg: "linear-gradient(135deg,#E60000,#990000)", color: "#fff", label: "MASTER" },
  BUSINESS_VIP: { bg: "linear-gradient(135deg,#FFD700,#FF9B26)", color: "#5C3A00", label: "👑 VVIP" },
  // label은 아래서 동적 생성
  PRO: { bg: "linear-gradient(135deg,#0056D2,#003fa3)", color: "#fff", label: "PRO" },
  BUSINESS_LITE: { bg: "linear-gradient(135deg,#C0C0C0,#A0A0A0)", color: "#1A1A2E", label: "LITE" },
  FREE: { bg: "#F2F2F7", color: "#8E8E93", label: "FREE" }
};
function UserProfile() {
  const { name } = useParams();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);
  const [profile, setProfile] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [notFound, setNotFound] = reactExports.useState(false);
  const [following, setFollowing] = reactExports.useState(false);
  const [followLoading, setFollowLoading] = reactExports.useState(false);
  const isSelf = user?.name === decodeURIComponent(name || "");
  const fetchProfile = reactExports.useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await apiClient.get(`/api/user/profile/${encodeURIComponent(decodeURIComponent(name))}`);
      setProfile(res.data);
      setFollowing(res.data.isFollowing || false);
    } catch (err) {
      if (err.response?.status === 404)
        setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [name]);
  reactExports.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  const handleFollow = async () => {
    if (!user || user.id === "GUEST") {
      addToast("로그인이 필요합니다.", "error");
      return;
    }
    if (isSelf) {
      addToast("자기 자신은 팔로우할 수 없습니다.", "info");
      return;
    }
    setFollowLoading(true);
    try {
      const endpoint = following ? "/api/user/unfollow" : "/api/user/follow";
      const targetNickname = decodeURIComponent(name);
      await apiClient.post(endpoint, {
        email: user.email,
        // ✅ profile.email이 있을 때만 targetEmail 전달 (없으면 서버에서 targetName으로 조회)
        ...profile?.email ? { targetEmail: profile.email } : {},
        targetName: targetNickname
      });
      const wasFollowing = following;
      setFollowing(!wasFollowing);
      setProfile((prev) => ({
        ...prev,
        followerCount: (prev.followerCount || 0) + (wasFollowing ? -1 : 1)
      }));
      addToast(wasFollowing ? "팔로우를 취소했습니다." : `${decodeURIComponent(name)}님을 팔로우했습니다. 👋`, "success");
    } catch (err) {
      addToast(err.response?.data?.error || "요청에 실패했습니다.", "error");
    } finally {
      setFollowLoading(false);
    }
  };
  const tierBadge = TIER_BADGE[profile?.tier] || TIER_BADGE.FREE;
  const badgeLabel = profile?.tier === "BUSINESS_VIP" && profile?.vvipHarborName ? "👑 VVIP " + profile.vvipHarborName : tierBadge.label;
  if (loading)
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "14px", background: "#F2F2F7" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "36px", height: "36px", border: "3px solid #0056D2", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(14px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "700" }, children: "프로필 불러오는 중..." })
    ] });
  if (notFound)
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "#F2F2F7", textAlign: "center" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(52px * var(--fs, 1))`, marginBottom: "12px" }, children: "👤" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "900", color: "#1c1c1e", marginBottom: "8px" }, children: "사용자를 찾을 수 없습니다" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#8E8E93", marginBottom: "24px" }, children: "탈퇴했거나 존재하지 않는 닉네임입니다." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => window.history.length <= 1 ? navigate("/community", { replace: true }) : navigate(-1), style: { padding: "12px 28px", background: "#0056D2", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "800", fontSize: `calc(14px * var(--fs, 1))`, cursor: "pointer" }, children: "돌아가기" })
    ] });
  const displayName = profile?.name || decodeURIComponent(name || "");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { minHeight: "100dvh", background: "#F2F2F7", fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "sticky", top: 0, zIndex: 100, background: "#fff", borderBottom: "1px solid #F0F2F7", padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px", display: "flex", alignItems: "center", gap: "8px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => window.history.length <= 1 ? navigate("/community", { replace: true }) : navigate(-1), style: { border: "none", background: "#F2F2F7", padding: "8px", borderRadius: "10px", cursor: "pointer", display: "flex" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 20, color: "#1A1A2E" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { flex: 1, fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "950", color: "#1A1A2E", textAlign: "center" }, children: "프로필" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "36px" } })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 24px)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "28px", padding: "28px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", marginBottom: "16px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "18px", marginBottom: "22px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            width: "72px",
            height: "72px",
            borderRadius: "22px",
            flexShrink: 0,
            overflow: "hidden",
            background: "linear-gradient(135deg, #0056D2, #00C48C)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: "950",
            fontSize: `calc(26px * var(--fs, 1))`,
            boxShadow: "0 6px 16px rgba(0,86,210,0.25)"
          }, children: profile?.avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: profile.avatar, style: { width: "100%", height: "100%", objectFit: "cover" }, alt: "" }) : displayName?.[0] || "?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(20px * var(--fs, 1))`, fontWeight: "950", color: "#1c1c1e" }, children: displayName }),
              profile?.tier && profile.tier !== "FREE" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", padding: "3px 8px", borderRadius: "8px", background: tierBadge.bg, color: tierBadge.color }, children: badgeLabel })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(12px * var(--fs, 1))`, background: "#EBF2FF", color: "#0056D2", padding: "3px 10px", borderRadius: "8px", fontWeight: "800" }, children: [
                "LV.",
                profile?.level || 1
              ] }),
              (profile?.streak || 0) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#FF5A5F", fontWeight: "800", display: "flex", alignItems: "center", gap: "3px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Flame, { size: 12, fill: "#FF5A5F", color: "#FF5A5F" }),
                " ",
                profile.streak,
                "일 연속"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "#F2F2F7", borderRadius: "16px", overflow: "hidden", marginBottom: "18px" }, children: [
          { label: "팔로워", val: profile?.followerCount || 0, icon: Star },
          { label: "팔로잉", val: profile?.followingCount || 0, icon: UserCheck },
          { label: "게시글", val: profile?.postCount || 0, icon: FileText },
          { label: "조과기록", val: profile?.recordCount || 0, icon: Trophy }
        ].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", padding: "12px 6px", textAlign: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(s.icon, { size: 12, color: "#0056D2", style: { marginBottom: "4px" } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "950", color: "#1c1c1e" }, children: s.val }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(9px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "700" }, children: s.label })
        ] }, s.label)) }),
        !isSelf && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleFollow,
            disabled: followLoading,
            style: {
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "16px",
              fontWeight: "900",
              fontSize: `calc(15px * var(--fs, 1))`,
              cursor: followLoading ? "not-allowed" : "pointer",
              background: following ? "#F2F2F7" : "linear-gradient(135deg, #0056D2, #0096FF)",
              color: following ? "#1c1c1e" : "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s",
              opacity: followLoading ? 0.7 : 1
            },
            children: following ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(UserCheck, { size: 18 }),
              " 팔로잉"
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { size: 18 }),
              " 팔로우"
            ] })
          }
        ),
        isSelf && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => navigate("/mypage"),
            style: { width: "100%", padding: "14px", border: "2px solid #0056D2", borderRadius: "16px", fontWeight: "900", fontSize: `calc(15px * var(--fs, 1))`, cursor: "pointer", background: "#fff", color: "#0056D2", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
            children: "내 프로필 관리"
          }
        )
      ] }),
      profile?.joinedAt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", fontSize: `calc(12px * var(--fs, 1))`, color: "#AEAEB2", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 12 }),
        new Date(profile.joinedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }),
        " 가입"
      ] })
    ] })
  ] });
}

export { UserProfile as default };
