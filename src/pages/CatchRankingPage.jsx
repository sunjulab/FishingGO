
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ChevronLeft, X, ChevronRight, Trash2 } from 'lucide-react';
import apiClient from '../api/index';
import { useUserStore } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import { getFishEmoji } from '../data/fishRules';
import { NativeAd } from '../components/AdUnit';
import { AdSenseDisplay } from '../components/ads/AdSenseAd';

const FISH_TABS = ['전체', '감성돔', '광어', '우럭', '볼락', '참돔', '농어', '방어', '붕어', '고등어'];
const PERIOD_TABS = [{ key: 'week', label: '주간' }, { key: 'month', label: '월간' }, { key: 'all', label: '전체' }];
const MEDAL = ['🥇', '🥈', '🥉'];

/* ─── 풀스크린 뷰어 ─────────────────────────────────────────── */
function PhotoViewer({ records, initialIndex, onClose, onLike, onDelete, userId, isMaster }) {
  const [idx, setIdx]         = useState(initialIndex);
  const [animIn, setAnimIn]   = useState(false);
  const [sliding, setSliding] = useState(null);
  const touchStart = useRef(null);

  const r = records[idx];
  const liked = (r?.likes || []).includes(userId);

  useEffect(() => {
    requestAnimationFrame(() => setAnimIn(true));
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const goTo = useCallback((dir) => {
    const next = idx + dir;
    if (next < 0 || next >= records.length) return;
    setSliding(dir > 0 ? 'left' : 'right');
    setTimeout(() => { setIdx(next); setSliding(null); }, 200);
  }, [idx, records.length]);

  const handleClose = () => { setAnimIn(false); setTimeout(onClose, 200); };
  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e) => {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 50) goTo(dx < 0 ? 1 : -1);
    touchStart.current = null;
  };

  if (!r) return null;

  return (
    <div
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: `rgba(0,0,0,${animIn ? 0.95 : 0})`,
        transition: 'background 0.22s ease',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* 상단 바 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'calc(env(safe-area-inset-top,0px) + 12px) 16px 12px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)',
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1,
        transform: `translateY(${animIn ? 0 : -20}px)`,
        opacity: animIn ? 1 : 0, transition: 'all 0.25s ease',
      }}>
        <button onClick={handleClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', backdropFilter: 'blur(8px)' }}>
          <X size={20} />
        </button>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '800', fontSize: '14px' }}>{idx + 1} / {records.length}</span>
        {/* 마스터 삭제 */}
        {isMaster ? (
          <button onClick={() => { onDelete(r._id); handleClose(); }} style={{ background: 'rgba(220,38,38,0.3)', border: '1px solid rgba(220,38,38,0.5)', borderRadius: '20px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#fca5a5', backdropFilter: 'blur(8px)', fontSize: '13px', fontWeight: '700' }}>
            <Trash2 size={14} /> 삭제
          </button>
        ) : <div style={{ width: 38 }} />}
      </div>

      {/* 이미지 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {idx > 0 && (
          <button onClick={() => goTo(-1)} style={{ position: 'absolute', left: '12px', zIndex: 2, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', backdropFilter: 'blur(8px)' }}>
            <ChevronLeft size={22} />
          </button>
        )}
        {r.imageUrl ? (
          <img src={r.imageUrl} alt={r.fishName} style={{
            maxWidth: '100%', maxHeight: '62vh', objectFit: 'contain', borderRadius: '16px',
            transform: `translateX(${sliding === 'left' ? '-40px' : sliding === 'right' ? '40px' : animIn ? '0' : '30px'}) scale(${animIn ? 1 : 0.88})`,
            opacity: sliding ? 0 : animIn ? 1 : 0,
            transition: sliding ? 'all 0.2s ease' : 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          }} />
        ) : (
          <div style={{ width: 200, height: 200, borderRadius: '24px', background: 'linear-gradient(135deg,#1a2a4a,#0056D2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '76px', transform: `scale(${animIn ? 1 : 0.8})`, opacity: animIn ? 1 : 0, transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
            {getFishEmoji(r.fishName)}
          </div>
        )}
        {idx < records.length - 1 && (
          <button onClick={() => goTo(1)} style={{ position: 'absolute', right: '12px', zIndex: 2, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', backdropFilter: 'blur(8px)' }}>
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* 하단 정보 */}
      <div style={{ padding: '16px 20px calc(env(safe-area-inset-bottom,0px) + 20px)', background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)', transform: `translateY(${animIn ? 0 : 30}px)`, opacity: animIn ? 1 : 0, transition: 'all 0.28s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '26px' }}>{idx < 3 ? MEDAL[idx] : `#${idx + 1}`}</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: '900', fontSize: '20px' }}>{r.fishName}</div>
            {r.verified && <span style={{ fontSize: '11px', background: '#D1FAE5', color: '#065F46', borderRadius: '6px', padding: '2px 8px', fontWeight: '700' }}>AI인증 ✓</span>}
          </div>
          <button onClick={() => onLike(r._id)} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '20px', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: liked ? '#FF3B30' : '#fff', backdropFilter: 'blur(8px)' }}>
            <Heart size={17} fill={liked ? '#FF3B30' : 'none'} />
            <span style={{ fontWeight: '800', fontSize: '14px' }}>{(r.likes || []).length}</span>
          </button>
        </div>
        {(r.fishSize || r.fishWeight) && (
          <div style={{ color: '#C8D400', fontWeight: '800', fontSize: '15px', marginBottom: '6px' }}>
            {r.fishSize ? `📏 ${r.fishSize}cm` : ''}{r.fishSize && r.fishWeight ? '  ·  ' : ''}{r.fishWeight ? `⚖️ ${r.fishWeight}kg` : ''}
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>🎣 {r.userName || '익명'}</span>
          {r.location && <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>📍 {r.location}</span>}
          {r.baitUsed && <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>🪱 {r.baitUsed}</span>}
        </div>
        {/* 썸네일 스트립 */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {records.map((rec, j) => (
            <button key={rec._id} onClick={() => { setSliding(j > idx ? 'left' : 'right'); setTimeout(() => { setIdx(j); setSliding(null); }, 200); }} style={{ flexShrink: 0, width: '50px', height: '50px', borderRadius: '10px', padding: 0, border: j === idx ? '2.5px solid #C8D400' : '2px solid rgba(255,255,255,0.15)', overflow: 'hidden', background: '#1a2a4a', cursor: 'pointer', transform: j === idx ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.18s ease' }}>
              {rec.imageUrl ? <img src={rec.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{getFishEmoji(rec.fishName)}</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── 메인 페이지 ─────────────────────────────────────────────── */
export default function CatchRankingPage({ embedded = false }) {

  const navigate = useNavigate();
  const user     = useUserStore(s => s.user);
  const addToast = useToastStore(s => s.addToast);

  const [fish, setFish]         = useState('전체');
  const [period, setPeriod]     = useState('month');
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [contests, setContests] = useState([]);
  const [viewer, setViewer]     = useState(null);
  const [expanded, setExpanded] = useState(null);

  const isMaster = user?.tier === 'MASTER' || user?.tier === 'BUSINESS_VIP' || user?.role === 'admin';
  const canAccessPremium = ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'MASTER'].includes(user?.tier);

  const load = async () => {
    setLoading(true);
    try {
      const params = { period, limit: 30 };
      if (fish !== '전체') params.fishName = fish;
      const res = await apiClient.get('/api/catch/ranking', { params });
      setRecords(res.data.records || []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [fish, period]);
  useEffect(() => {
    apiClient.get('/api/contest/active').then(r => setContests(r.data.contests || [])).catch(() => {});
  }, []);

  const handleLike = async (id) => {
    if (!user?.id || user?.id === 'GUEST') return addToast('로그인 후 이용하세요.', 'error');
    try {
      const res = await apiClient.post(`/api/catch/${id}/like`, { userId: user.id });
      setRecords(prev => prev.map(r => r._id === id
        ? { ...r, likes: res.data.liked ? [...(r.likes || []), user.id] : (r.likes || []).filter(l => l !== user.id) }
        : r
      ));
    } catch { addToast('오류 발생', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!isMaster) return;
    if (!window.confirm('이 조황 기록을 삭제하시겠습니까?')) return;
    try {
      await apiClient.delete(`/api/user/records/${id}`, { data: { email: user?.email } });
      setRecords(prev => prev.filter(r => r._id !== id));
      setExpanded(null);
      addToast('조황 기록이 삭제되었습니다.', 'success');
    } catch { addToast('삭제 중 오류가 발생했습니다.', 'error'); }
  };

  // ── 색상 테마: embedded = 라이트, 독립 = 다크 ──────────
  const T = embedded ? {
    bg:        '#f8fafc',
    cardBg:    '#ffffff',
    cardBgTop: 'linear-gradient(135deg,#EEF2FF,#F0FDF4)',
    cardBorder:'1.5px solid #e2e8f0',
    cardBorderTop: '1.5px solid #C7D2FE',
    textPrimary:   '#0d1b2a',
    textSecondary: '#64748b',
    textAccent:    '#0056D2',
    rankColor:     '#94a3b8',
    medalBg:       'linear-gradient(135deg,#EEF2FF,#dbeafe)',
    tabActive:     '#0056D2', tabActiveTxt: '#fff',
    tabInactive:   '#f1f5f9', tabInactiveTxt: '#555',
    fishActive:    '#FDE68A', fishActiveTxt:  '#78350F',
    fishInactive:  '#f1f5f9', fishInactiveTxt:'#555',
    expandBg:      '#f8fafc',
    gridBg:        '#f1f5f9',
    gridAccent:    '#EEF2FF',
    gridAccentTxt: '#0056D2',
    btnMoreBg:     'rgba(0,86,210,0.08)', btnMoreTxt: '#0056D2',
    likeColor:     '#94a3b8',
    thumbBg:       '#e2e8f0',
    divider:       '1px solid #e2e8f0',
  } : {
    bg:        '#0a1628',
    cardBg:    'rgba(255,255,255,0.05)',
    cardBgTop: 'linear-gradient(135deg,#1a2a4a,#1e3460)',
    cardBorder:'1px solid rgba(255,255,255,0.08)',
    cardBorderTop:'1.5px solid rgba(200,212,0,0.35)',
    textPrimary:   '#ffffff',
    textSecondary: 'rgba(255,255,255,0.5)',
    textAccent:    '#C8D400',
    rankColor:     '#64748b',
    medalBg:       'linear-gradient(135deg,#1a3a6a,#0056D2)',
    tabActive:     '#C8D400', tabActiveTxt: '#0a1628',
    tabInactive:   'rgba(255,255,255,0.1)', tabInactiveTxt: '#fff',
    fishActive:    '#FDE68A', fishActiveTxt:  '#78350F',
    fishInactive:  'rgba(255,255,255,0.08)', fishInactiveTxt:'rgba(255,255,255,0.7)',
    expandBg:      'rgba(0,0,0,0.2)',
    gridBg:        'rgba(255,255,255,0.06)',
    gridAccent:    'rgba(200,212,0,0.12)',
    gridAccentTxt: '#C8D400',
    btnMoreBg:     'rgba(200,212,0,0.12)', btnMoreTxt: '#C8D400',
    likeColor:     'rgba(255,255,255,0.35)',
    thumbBg:       '#1a2a4a',
    divider:       '1px solid rgba(255,255,255,0.07)',
  };

  return (
    <>
      {viewer !== null && (
        <PhotoViewer
          records={records} initialIndex={viewer}
          onClose={() => setViewer(null)}
          onLike={handleLike} onDelete={handleDelete}
          userId={user?.id} isMaster={isMaster}
        />
      )}

      <div style={{ minHeight: embedded ? 'auto' : '100dvh', background: T.bg, paddingBottom: embedded ? 0 : '100px' }}>

        {/* ── 스탠드얼론 헤더 ── */}
        {!embedded && (
          <div style={{ background: 'linear-gradient(135deg,#0a1628 0%,#0d2a5c 100%)', padding: '16px', paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <ChevronLeft size={20} />
              </button>
              <div>
                <h1 style={{ color: '#fff', fontWeight: '900', fontSize: `calc(18px * var(--fs,1))`, margin: 0 }}>🏆 전국 조황 랭킹</h1>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: `calc(11px * var(--fs,1))`, margin: 0 }}>사진을 누르면 크게 볼 수 있어요</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              {PERIOD_TABS.map(t => (
                <button key={t.key} onClick={() => setPeriod(t.key)} style={{ padding: '6px 18px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: `calc(12px * var(--fs,1))`, background: period === t.key ? T.tabActive : T.tabInactive, color: period === t.key ? T.tabActiveTxt : T.tabInactiveTxt, transition: 'all 0.18s' }}>{t.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {FISH_TABS.map(f => (
                <button key={f} onClick={() => setFish(f)} style={{ padding: '5px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: `calc(11px * var(--fs,1))`, whiteSpace: 'nowrap', background: fish === f ? T.fishActive : T.fishInactive, color: fish === f ? T.fishActiveTxt : T.fishInactiveTxt, transition: 'all 0.18s' }}>{f}</button>
              ))}
            </div>
          </div>
        )}

        {/* ── embedded 필터 ── */}
        {embedded && (
          <div style={{ padding: '12px 16px 10px', background: T.card, borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              {PERIOD_TABS.map(t => (
                <button key={t.key} onClick={() => setPeriod(t.key)} style={{ padding: '5px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: `calc(12px * var(--fs,1))`, background: period === t.key ? T.tabActive : T.tabInactive, color: period === t.key ? T.tabActiveTxt : T.tabInactiveTxt, transition: 'all 0.18s' }}>{t.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
              {FISH_TABS.map(f => (
                <button key={f} onClick={() => setFish(f)} style={{ padding: '4px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: `calc(11px * var(--fs,1))`, whiteSpace: 'nowrap', background: fish === f ? T.fishActive : T.fishInactive, color: fish === f ? T.fishActiveTxt : T.fishInactiveTxt, transition: 'all 0.18s' }}>{f}</button>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: '14px 14px' }}>
          {/* 대회 배너 */}
          {contests.length > 0 && (
            <div style={{ background: 'linear-gradient(135deg,#FDE68A,#F59E0B)', borderRadius: '16px', padding: '13px 16px', marginBottom: '12px', cursor: 'pointer' }} onClick={() => navigate('/contest')}>
              <div style={{ fontWeight: '900', fontSize: `calc(14px * var(--fs,1))`, color: '#78350F' }}>🏆 진행 중인 대회 {contests.length}개</div>
              <div style={{ fontSize: `calc(12px * var(--fs,1))`, color: '#92400E', marginTop: '2px' }}>{contests[0]?.title} → 참가하기</div>
            </div>
          )}

          {/* 인증 버튼 */}
          <button onClick={() => navigate('/catch-upload')}
            style={{ width: '100%', padding: '13px', borderRadius: '14px', border: 'none', marginBottom: '14px', background: 'linear-gradient(135deg,#C8D400,#a8b200)', color: '#0a1628', fontWeight: '900', fontSize: `calc(15px * var(--fs,1))`, cursor: 'pointer', boxShadow: '0 4px 18px rgba(200,212,0,0.32)', transition: 'transform 0.14s, box-shadow 0.14s' }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            📸 내 조황 인증하러 가기
          </button>

          {/* ✅ ADSENSE: 조황 인증 버튼 아래 광고 (무료 유저만) */}
          {!canAccessPremium && (
            <div style={{ marginBottom: '14px' }}>
              <AdSenseDisplay style={{ borderRadius: '12px', overflow: 'hidden' }} />
            </div>
          )}

          {/* 랭킹 목록 */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎣</div>
              <div style={{ fontWeight: '700', color: T.textSecondary }}>불러오는 중...</div>
            </div>
          ) : records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '50px', marginBottom: '12px' }}>🐟</div>
              <div style={{ fontWeight: '700', color: T.textPrimary, fontSize: '16px' }}>아직 조황 기록이 없습니다</div>
              <div style={{ fontSize: '13px', marginTop: '6px', color: T.textSecondary }}>첫 번째 조황을 인증해보세요!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {records.map((r, i) => {
                const liked  = (r.likes || []).includes(user?.id);
                const isTop3 = i < 3;
                const isOpen = expanded === r._id;

                return (
                  <React.Fragment key={r._id}>
                    <div style={{
                    background: isTop3 ? T.cardBgTop : T.cardBg,
                    borderRadius: '18px',
                    border: isTop3 ? T.cardBorderTop : T.cardBorder,
                    overflow: 'hidden',
                    boxShadow: isTop3
                      ? (embedded ? '0 4px 20px rgba(0,86,210,0.12)' : '0 6px 28px rgba(200,212,0,0.1)')
                      : (embedded ? '0 2px 8px rgba(0,0,0,0.06)' : '0 2px 10px rgba(0,0,0,0.25)'),
                    transition: 'all 0.2s ease',
                  }}>
                    {/* 카드 메인 행 */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '13px', cursor: 'pointer' }}
                      onClick={() => setExpanded(isOpen ? null : r._id)}>

                      {/* 순위 */}
                      <div style={{ minWidth: '36px', textAlign: 'center' }}>
                        {isTop3
                          ? <div style={{ fontSize: '24px', lineHeight: 1 }}>{MEDAL[i]}</div>
                          : <div style={{ fontWeight: '900', fontSize: `calc(14px * var(--fs,1))`, color: T.rankColor }}>#{i+1}</div>}
                      </div>

                      {/* 썸네일 */}
                      <div onClick={e => { e.stopPropagation(); if (r.imageUrl) setViewer(i); }} style={{ flexShrink: 0, cursor: r.imageUrl ? 'zoom-in' : 'default', position: 'relative' }}>
                        {r.imageUrl ? (
                          <img src={r.imageUrl} alt={r.fishName} style={{ width: '68px', height: '68px', borderRadius: '13px', objectFit: 'cover', border: isTop3 ? `2px solid ${embedded ? '#818CF8' : '#C8D400'}` : `1.5px solid ${embedded ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`, transition: 'transform 0.18s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          />
                        ) : (
                          <div style={{ width: '68px', height: '68px', borderRadius: '13px', background: embedded ? '#EEF2FF' : 'linear-gradient(135deg,#1a3a6a,#0056D2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>{getFishEmoji(r.fishName)}</div>
                        )}
                        {r.imageUrl && (
                          <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.55)', borderRadius: '6px', padding: '1px 5px', fontSize: '10px', color: '#fff' }}>🔍</div>
                        )}
                      </div>

                      {/* 정보 */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                          <span style={{ fontWeight: '900', fontSize: `calc(16px * var(--fs,1))`, color: T.textPrimary }}>{r.fishName}</span>
                          {r.verified && <span style={{ fontSize: `calc(10px * var(--fs,1))`, background: '#D1FAE5', color: '#065F46', borderRadius: '6px', padding: '1px 6px', fontWeight: '700' }}>AI인증</span>}
                        </div>
                        {(r.fishSize || r.fishWeight) && (
                          <div style={{ fontSize: `calc(12px * var(--fs,1))`, color: T.textAccent, fontWeight: '800', marginBottom: '3px' }}>
                            {r.fishSize ? `📏 ${r.fishSize}cm` : ''}{r.fishSize && r.fishWeight ? ' · ' : ''}{r.fishWeight ? `⚖️ ${r.fishWeight}kg` : ''}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: `calc(11px * var(--fs,1))`, color: T.textSecondary }}>by {r.userName || '익명'}</span>
                          {r.location && <span style={{ fontSize: `calc(11px * var(--fs,1))`, color: T.textSecondary }}>📍 {r.location}</span>}
                        </div>
                      </div>

                      {/* 우측: 좋아요 + 삭제(마스터) + 화살표 */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <button onClick={e => { e.stopPropagation(); handleLike(r._id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: liked ? '#FF3B30' : T.likeColor, padding: '3px' }}>
                          <Heart size={17} fill={liked ? '#FF3B30' : 'none'} />
                          <span style={{ fontSize: `calc(11px * var(--fs,1))`, fontWeight: '700' }}>{(r.likes || []).length}</span>
                        </button>
                        {isMaster && (
                          <button onClick={e => { e.stopPropagation(); handleDelete(r._id); }} style={{ background: 'rgba(220,38,38,0.1)', border: 'none', borderRadius: '8px', padding: '4px 6px', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="삭제(마스터)">
                            <Trash2 size={13} />
                          </button>
                        )}
                        <span style={{ fontSize: '10px', color: T.textSecondary, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.22s', display: 'block' }}>▼</span>
                      </div>
                    </div>

                    {/* 확장 패널 */}
                    <div style={{ maxHeight: isOpen ? '420px' : '0px', overflow: 'hidden', transition: 'max-height 0.32s cubic-bezier(0.4,0,0.2,1)' }}>
                      <div style={{ padding: '0 14px 16px', borderTop: T.divider, background: T.expandBg }}>
                        {/* 큰 사진 */}
                        {r.imageUrl && (
                          <div style={{ position: 'relative', marginTop: '14px', borderRadius: '14px', overflow: 'hidden', cursor: 'zoom-in' }} onClick={() => setViewer(i)}>
                            <img src={r.imageUrl} alt={r.fishName} style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', display: 'block' }} />
                            <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: '10px', padding: '4px 10px', fontSize: '12px', fontWeight: '700', backdropFilter: 'blur(6px)' }}>🔍 크게 보기</div>
                          </div>
                        )}

                        {/* 정보 그리드 */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginTop: '12px' }}>
                          {[
                            r.fishSize    && { label: '길이',   value: `📏 ${r.fishSize}cm`,  accent: true  },
                            r.fishWeight  && { label: '무게',   value: `⚖️ ${r.fishWeight}kg`, accent: true  },
                            r.location    && { label: '장소',   value: `📍 ${r.location}`,     accent: false },
                            r.baitUsed    && { label: '미끼',   value: `🪱 ${r.baitUsed}`,     accent: false },
                            r.userName    && { label: '낚시꾼', value: `🎣 ${r.userName}`,     accent: false },
                            r.createdAt   && { label: '날짜',   value: `📅 ${new Date(r.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`, accent: false },
                          ].filter(Boolean).map((item, k) => (
                            <div key={k} style={{ background: item.accent ? T.gridAccent : T.gridBg, borderRadius: '11px', padding: '9px 11px' }}>
                              <div style={{ color: T.textSecondary, fontSize: '11px', marginBottom: '2px' }}>{item.label}</div>
                              <div style={{ color: item.accent ? T.gridAccentTxt : T.textPrimary, fontWeight: '800', fontSize: '13px' }}>{item.value}</div>
                            </div>
                          ))}
                        </div>

                        {r.memo && (
                          <div style={{ marginTop: '9px', background: T.gridBg, borderRadius: '11px', padding: '11px' }}>
                            <div style={{ color: T.textSecondary, fontSize: '11px', marginBottom: '3px' }}>한마디</div>
                            <div style={{ color: T.textPrimary, fontSize: '13px', lineHeight: 1.5 }}>💬 {r.memo}</div>
                          </div>
                        )}

                        {/* 하단 버튼 행 */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '11px' }}>
                          {r.imageUrl && (
                            <button onClick={() => setViewer(i)} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '11px', background: T.btnMoreBg, color: T.btnMoreTxt, fontWeight: '800', fontSize: `calc(13px * var(--fs,1))`, cursor: 'pointer', transition: 'opacity 0.15s' }}>
                              🖼️ 사진 크게 보기
                            </button>
                          )}
                          {isMaster && (
                            <button onClick={() => handleDelete(r._id)} style={{ padding: '9px 16px', border: 'none', borderRadius: '11px', background: 'rgba(220,38,38,0.1)', color: '#dc2626', fontWeight: '800', fontSize: `calc(13px * var(--fs,1))`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'background 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.2)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(220,38,38,0.1)'}
                            >
                              <Trash2 size={14} /> 삭제
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* 조황랭킹 목록 사이 네이티브 광고: 5개마다 1번 (무료 유저만) */}
                  {!canAccessPremium && (i + 1) % 5 === 0 && (
                    <NativeAd slotId={`ranking_native_${i}`} style={{ margin: '4px 0' }} />
                  )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
