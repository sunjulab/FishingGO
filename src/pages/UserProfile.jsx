import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, UserCheck, UserPlus, Star, Trophy, FileText, Flame, Calendar } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import apiClient from '../api/index';

// 티어 뱃지 색상 매핑 (label은 VVIP만 동적으로 항구명 포함)
const TIER_BADGE = {
  MASTER:        { bg: 'linear-gradient(135deg,#E60000,#990000)', color: '#fff',    label: 'MASTER' },
  BUSINESS_VIP:  { bg: 'linear-gradient(135deg,#FFD700,#FF9B26)', color: '#5C3A00', label: '👑 VVIP' }, // label은 아래서 동적 생성
  PRO:           { bg: 'linear-gradient(135deg,#0056D2,#003fa3)', color: '#fff',    label: 'PRO' },
  BUSINESS_LITE: { bg: 'linear-gradient(135deg,#C0C0C0,#A0A0A0)', color: '#1A1A2E', label: 'LITE' },
  FREE:          { bg: '#F2F2F7',                                  color: '#8E8E93', label: 'FREE' },
};

export default function UserProfile() {
  const { name } = useParams();
  const navigate = useNavigate();
  const user    = useUserStore(s => s.user);
  const addToast = useToastStore(s => s.addToast);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isSelf = user?.name === decodeURIComponent(name || '');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await apiClient.get(`/api/user/profile/${encodeURIComponent(decodeURIComponent(name))}`);
      setProfile(res.data);
      setFollowing(res.data.isFollowing || false);
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [name]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleFollow = async () => {
    if (!user || user.id === 'GUEST') {
      addToast('로그인이 필요합니다.', 'error');
      return;
    }
    if (isSelf) { addToast('자기 자신은 팔로우할 수 없습니다.', 'info'); return; }

    setFollowLoading(true);
    try {
      const endpoint = following ? '/api/user/unfollow' : '/api/user/follow';
      const targetNickname = decodeURIComponent(name);
      await apiClient.post(endpoint, {
        email: user.email,
        // ✅ profile.email이 있을 때만 targetEmail 전달 (없으면 서버에서 targetName으로 조회)
        ...(profile?.email ? { targetEmail: profile.email } : {}),
        targetName: targetNickname,
      });
      const wasFollowing = following;
      setFollowing(!wasFollowing);
      setProfile(prev => ({
        ...prev,
        followerCount: (prev.followerCount || 0) + (wasFollowing ? -1 : 1),
      }));
      addToast(wasFollowing ? '팔로우를 취소했습니다.' : `${decodeURIComponent(name)}님을 팔로우했습니다. 👋`, 'success');
    } catch (err) {
      addToast(err.response?.data?.error || '요청에 실패했습니다.', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  // ✅ FIX-VVIP-BADGE: VVIP는 항구명 포함 동적 label
  const tierBadge = TIER_BADGE[profile?.tier] || TIER_BADGE.FREE;
  const badgeLabel = profile?.tier === 'BUSINESS_VIP' && profile?.vvipHarborName
    ? '\u{1F451} VVIP ' + profile.vvipHarborName
    : tierBadge.label;

  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '14px', background: '#F2F2F7' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #0056D2', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: `calc(14px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '700' }}>프로필 불러오는 중...</p>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#F2F2F7', textAlign: 'center' }}>
      <div style={{ fontSize: `calc(52px * var(--fs, 1))`, marginBottom: '12px' }}>👤</div>
      <p style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '900', color: '#1c1c1e', marginBottom: '8px' }}>사용자를 찾을 수 없습니다</p>
      <p style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#8E8E93', marginBottom: '24px' }}>탈퇴했거나 존재하지 않는 닉네임입니다.</p>
      <button onClick={() => window.history.length <= 1 ? navigate('/community', { replace: true }) : navigate(-1)} style={{ padding: '12px 28px', background: '#0056D2', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: `calc(14px * var(--fs, 1))`, cursor: 'pointer' }}>돌아가기</button>
    </div>
  );

  const displayName = profile?.name || decodeURIComponent(name || '');

  return (
    <div style={{ minHeight: '100dvh', background: '#F2F2F7', fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif" }}>
      {/* 헤더 — ✅ SAFE-AREA: 상단 상태바 자동 회피 */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #F0F2F7', padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={() => window.history.length <= 1 ? navigate('/community', { replace: true }) : navigate(-1)} style={{ border: 'none', background: '#F2F2F7', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex' }}>
          <ChevronLeft size={20} color="#1A1A2E" />
        </button>
        <span style={{ flex: 1, fontSize: `calc(16px * var(--fs, 1))`, fontWeight: '950', color: '#1A1A2E', textAlign: 'center' }}>프로필</span>
        <div style={{ width: '36px' }} />
      </div>

      <div style={{ padding: '20px 20px calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
        {/* 프로필 카드 */}
        <div style={{ background: '#fff', borderRadius: '28px', padding: '28px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
          {/* 아바타 + 정보 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '22px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '22px', flexShrink: 0, overflow: 'hidden',
              background: 'linear-gradient(135deg, #0056D2, #00C48C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: '950', fontSize: `calc(26px * var(--fs, 1))`,
              boxShadow: '0 6px 16px rgba(0,86,210,0.25)',
            }}>
              {profile?.avatar
                ? <img src={profile.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                : displayName?.[0] || '?'
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: `calc(20px * var(--fs, 1))`, fontWeight: '950', color: '#1c1c1e' }}>{displayName}</span>
                {profile?.tier && profile.tier !== 'FREE' && (
                  <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', padding: '3px 8px', borderRadius: '8px', background: tierBadge.bg, color: tierBadge.color }}>
                    {badgeLabel}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: `calc(12px * var(--fs, 1))`, background: '#EBF2FF', color: '#0056D2', padding: '3px 10px', borderRadius: '8px', fontWeight: '800' }}>
                  LV.{profile?.level || 1}
                </span>
                {(profile?.streak || 0) > 0 && (
                  <span style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#FF5A5F', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Flame size={12} fill="#FF5A5F" color="#FF5A5F" /> {profile.streak}일 연속
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 통계 4칸 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#F2F2F7', borderRadius: '16px', overflow: 'hidden', marginBottom: '18px' }}>
            {[
              { label: '팔로워',   val: profile?.followerCount  || 0, icon: Star },
              { label: '팔로잉',   val: profile?.followingCount || 0, icon: UserCheck },
              { label: '게시글',   val: profile?.postCount      || 0, icon: FileText },
              { label: '조과기록', val: profile?.recordCount    || 0, icon: Trophy },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', padding: '12px 6px', textAlign: 'center' }}>
                <s.icon size={12} color="#0056D2" style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '950', color: '#1c1c1e' }}>{s.val}</div>
                <div style={{ fontSize: `calc(9px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '700' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* 팔로우 버튼 */}
          {!isSelf && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              style={{
                width: '100%', padding: '14px', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: `calc(15px * var(--fs, 1))`, cursor: followLoading ? 'not-allowed' : 'pointer',
                background: following ? '#F2F2F7' : 'linear-gradient(135deg, #0056D2, #0096FF)',
                color: following ? '#1c1c1e' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s',
                opacity: followLoading ? 0.7 : 1,
              }}
            >
              {following
                ? <><UserCheck size={18} /> 팔로잉</>
                : <><UserPlus size={18} /> 팔로우</>
              }
            </button>
          )}
          {isSelf && (
            <button
              onClick={() => navigate('/mypage')}
              style={{ width: '100%', padding: '14px', border: '2px solid #0056D2', borderRadius: '16px', fontWeight: '900', fontSize: `calc(15px * var(--fs, 1))`, cursor: 'pointer', background: '#fff', color: '#0056D2', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              내 프로필 관리
            </button>
          )}
        </div>

        {/* 가입일 */}
        {profile?.joinedAt && (
          <div style={{ textAlign: 'center', fontSize: `calc(12px * var(--fs, 1))`, color: '#AEAEB2', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            <Calendar size={12} />
            {new Date(profile.joinedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 가입
          </div>
        )}
      </div>
    </div>
  );
}
