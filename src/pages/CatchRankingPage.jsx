import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Fish, MapPin, Heart, ChevronLeft, X, ChevronRight, Share2, Download } from 'lucide-react';
import apiClient from '../api/index';
import { useUserStore } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import { getFishEmoji } from '../data/fishRules';

const FISH_TABS = ['전체', '감성돔', '광어', '우럭', '볼락', '참돔', '농어', '방어', '붕어', '고등어'];
const PERIOD_TABS = [{ key: 'week', label: '주간' }, { key: 'month', label: '월간' }, { key: 'all', label: '전체' }];
const MEDAL = ['🥇', '🥈', '🥉'];

/* ── 사진 확장 뷰어 ─────────────────────────────────────────── */
function PhotoViewer({ records, initialIndex, onClose, onLike, userId }) {
  const [idx, setIdx]         = useState(initialIndex);
  const [animIn, setAnimIn]   = useState(false);
  const [sliding, setSliding] = useState(null); // 'left' | 'right' | null
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
    setTimeout(() => { setIdx(next); setSliding(null); }, 220);
  }, [idx, records.length]);

  const handleClose = () => {
    setAnimIn(false);
    setTimeout(onClose, 200);
  };

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
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1,
        transform: `translateY(${animIn ? 0 : -20}px)`,
        opacity: animIn ? 1 : 0, transition: 'all 0.25s ease',
      }}>
        <button onClick={handleClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', backdropFilter: 'blur(8px)' }}>
          <X size={20} />
        </button>
        <div style={{ color: '#fff', fontWeight: '800', fontSize: '15px' }}>
          {idx + 1} / {records.length}
        </div>
        <div style={{ width: 38 }} />
      </div>

      {/* 이미지 영역 */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* 이전 버튼 */}
        {idx > 0 && (
          <button onClick={() => goTo(-1)} style={{
            position: 'absolute', left: '12px', zIndex: 2, background: 'rgba(255,255,255,0.18)', border: 'none',
            borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: '#fff', backdropFilter: 'blur(8px)',
          }}>
            <ChevronLeft size={22} />
          </button>
        )}

        {/* 이미지 */}
        {r.imageUrl ? (
          <img
            src={r.imageUrl} alt={r.fishName}
            style={{
              maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '16px',
              transform: `translateX(${sliding === 'left' ? '-40px' : sliding === 'right' ? '40px' : animIn ? '0px' : '30px'}) scale(${animIn ? 1 : 0.88})`,
              opacity: sliding ? 0 : animIn ? 1 : 0,
              transition: sliding ? 'all 0.22s ease' : 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            }}
          />
        ) : (
          <div style={{
            width: '220px', height: '220px', borderRadius: '24px',
            background: 'linear-gradient(135deg,#1a2a4a,#0056D2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px',
            transform: `scale(${animIn ? 1 : 0.8})`, opacity: animIn ? 1 : 0,
            transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {getFishEmoji(r.fishName)}
          </div>
        )}

        {/* 다음 버튼 */}
        {idx < records.length - 1 && (
          <button onClick={() => goTo(1)} style={{
            position: 'absolute', right: '12px', zIndex: 2, background: 'rgba(255,255,255,0.18)', border: 'none',
            borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: '#fff', backdropFilter: 'blur(8px)',
          }}>
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* 하단 정보 카드 */}
      <div style={{
        padding: '16px 20px calc(env(safe-area-inset-bottom,0px) + 20px)',
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
        transform: `translateY(${animIn ? 0 : 30}px)`, opacity: animIn ? 1 : 0,
        transition: 'all 0.28s ease',
      }}>
        {/* 순위 + 어종 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '26px' }}>{idx < 3 ? MEDAL[idx] : `#${idx + 1}`}</span>
          <div>
            <div style={{ color: '#fff', fontWeight: '900', fontSize: '20px' }}>{r.fishName}</div>
            {r.verified && (
              <span style={{ fontSize: '11px', background: '#D1FAE5', color: '#065F46', borderRadius: '6px', padding: '2px 8px', fontWeight: '700' }}>AI인증 ✓</span>
            )}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            {/* 좋아요 */}
            <button onClick={() => onLike(r._id)} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '20px',
              padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px',
              cursor: 'pointer', color: liked ? '#FF3B30' : '#fff', backdropFilter: 'blur(8px)',
            }}>
              <Heart size={18} fill={liked ? '#FF3B30' : 'none'} />
              <span style={{ fontWeight: '800', fontSize: '14px' }}>{(r.likes || []).length}</span>
            </button>
          </div>
        </div>

        {/* 사이즈/무게 */}
        {(r.fishSize || r.fishWeight) && (
          <div style={{ color: '#C8D400', fontWeight: '800', fontSize: '16px', marginBottom: '6px' }}>
            {r.fishSize ? `📏 ${r.fishSize}cm` : ''}{r.fishSize && r.fishWeight ? '  ·  ' : ''}{r.fishWeight ? `⚖️ ${r.fishWeight}kg` : ''}
          </div>
        )}

        {/* 작성자 · 위치 */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>🎣 {r.userName || '익명'}</span>
          {r.location && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>📍 {r.location}</span>}
          {r.baitUsed && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>🪱 {r.baitUsed}</span>}
        </div>

        {/* 썸네일 스트립 */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px', overflowX: 'auto', paddingBottom: '2px' }}>
          {records.map((rec, j) => (
            <button key={rec._id} onClick={() => { setSliding(j > idx ? 'left' : 'right'); setTimeout(() => { setIdx(j); setSliding(null); }, 220); }} style={{
              flexShrink: 0, width: '52px', height: '52px', borderRadius: '10px', padding: 0, border: j === idx ? '2.5px solid #C8D400' : '2px solid rgba(255,255,255,0.2)',
              overflow: 'hidden', background: '#1a2a4a', cursor: 'pointer',
              transform: j === idx ? 'scale(1.08)' : 'scale(1)', transition: 'all 0.18s ease',
            }}>
              {rec.imageUrl ? (
                <img src={rec.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{getFishEmoji(rec.fishName)}</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 메인 페이지 ─────────────────────────────────────────────── */
export default function CatchRankingPage({ embedded = false }) {
  const navigate = useNavigate();
  const user     = useUserStore(s => s.user);
  const addToast = useToastStore(s => s.addToast);

  const [fish, setFish]         = useState('전체');
  const [period, setPeriod]     = useState('month');
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [contests, setContests] = useState([]);
  const [viewer, setViewer]     = useState(null); // index | null

  // 카드 확장 상태
  const [expanded, setExpanded] = useState(null); // record._id

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

  return (
    <>
      {/* ── 풀스크린 뷰어 ── */}
      {viewer !== null && (
        <PhotoViewer
          records={records}
          initialIndex={viewer}
          onClose={() => setViewer(null)}
          onLike={handleLike}
          userId={user?.id}
        />
      )}

      <div style={{ minHeight: embedded ? 'auto' : '100dvh', background: embedded ? 'transparent' : '#0a1628', paddingBottom: '100px' }}>

        {/* ── 헤더 (스탠드얼론) ── */}
        {!embedded && (
          <div style={{ background: 'linear-gradient(135deg,#0a1628 0%,#0d2a5c 100%)', padding: '16px', paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <ChevronLeft size={20} />
              </button>
              <div>
                <h1 style={{ color: '#fff', fontWeight: '900', fontSize: `calc(18px * var(--fs,1))`, margin: 0 }}>🏆 전국 조황 랭킹</h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: `calc(11px * var(--fs,1))`, margin: 0 }}>사진 클릭 시 크게 볼 수 있어요</p>
              </div>
            </div>
            {/* 기간 탭 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              {PERIOD_TABS.map(t => (
                <button key={t.key} onClick={() => setPeriod(t.key)} style={{
                  padding: '6px 18px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                  fontWeight: '800', fontSize: `calc(12px * var(--fs,1))`,
                  background: period === t.key ? '#C8D400' : 'rgba(255,255,255,0.12)',
                  color: period === t.key ? '#0a1628' : '#fff',
                  transition: 'all 0.18s',
                }}>{t.label}</button>
              ))}
            </div>
            {/* 어종 탭 */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {FISH_TABS.map(f => (
                <button key={f} onClick={() => setFish(f)} style={{
                  padding: '5px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                  fontWeight: '700', fontSize: `calc(11px * var(--fs,1))`, whiteSpace: 'nowrap',
                  background: fish === f ? '#FDE68A' : 'rgba(255,255,255,0.1)',
                  color: fish === f ? '#78350F' : '#fff',
                  transition: 'all 0.18s',
                }}>{f}</button>
              ))}
            </div>
          </div>
        )}

        {/* ── embedded 필터 ── */}
        {embedded && (
          <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              {PERIOD_TABS.map(t => (
                <button key={t.key} onClick={() => setPeriod(t.key)} style={{
                  padding: '5px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                  fontWeight: '800', fontSize: `calc(12px * var(--fs,1))`,
                  background: period === t.key ? '#0056D2' : '#f1f5f9', color: period === t.key ? '#fff' : '#555',
                }}>{t.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
              {FISH_TABS.map(f => (
                <button key={f} onClick={() => setFish(f)} style={{
                  padding: '4px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                  fontWeight: '700', fontSize: `calc(11px * var(--fs,1))`, whiteSpace: 'nowrap',
                  background: fish === f ? '#FDE68A' : '#f1f5f9', color: fish === f ? '#78350F' : '#555',
                }}>{f}</button>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: '16px' }}>
          {/* 대회 배너 */}
          {contests.length > 0 && (
            <div style={{ background: 'linear-gradient(135deg,#FDE68A,#F59E0B)', borderRadius: '16px', padding: '14px 16px', marginBottom: '14px', cursor: 'pointer' }}
              onClick={() => navigate('/contest')}>
              <div style={{ fontWeight: '900', fontSize: `calc(14px * var(--fs,1))`, color: '#78350F' }}>🏆 진행 중인 대회 {contests.length}개</div>
              <div style={{ fontSize: `calc(12px * var(--fs,1))`, color: '#92400E', marginTop: '2px' }}>{contests[0]?.title} → 참가하기</div>
            </div>
          )}

          {/* 조황 인증 버튼 */}
          <button onClick={() => navigate('/catch-upload')} style={{
            width: '100%', padding: '14px', borderRadius: '14px', border: 'none', marginBottom: '16px',
            background: 'linear-gradient(135deg,#C8D400,#a0aa00)', color: '#0a1628',
            fontWeight: '900', fontSize: `calc(15px * var(--fs,1))`, cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(200,212,0,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            📸 내 조황 인증하러 가기
          </button>

          {/* 랭킹 목록 */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 40px', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px', animation: 'spin 1s linear infinite' }}>🎣</div>
              <div style={{ fontWeight: '700', color: '#fff' }}>랭킹 불러오는 중...</div>
              <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
            </div>
          ) : records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 40px' }}>
              <div style={{ fontSize: '50px', marginBottom: '12px' }}>🐟</div>
              <div style={{ fontWeight: '700', color: '#fff', fontSize: '16px' }}>아직 조황 기록이 없습니다</div>
              <div style={{ fontSize: `calc(13px * var(--fs,1))`, marginTop: '6px', color: 'rgba(255,255,255,0.5)' }}>첫 번째 조황을 인증해보세요!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {records.map((r, i) => {
                const liked   = (r.likes || []).includes(user?.id);
                const isTop3  = i < 3;
                const isOpen  = expanded === r._id;

                return (
                  <div key={r._id} style={{
                    background: isTop3
                      ? 'linear-gradient(135deg,#1a2a4a,#1e3460)'
                      : 'rgba(255,255,255,0.06)',
                    borderRadius: '20px',
                    border: isTop3 ? '1.5px solid rgba(200,212,0,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                    boxShadow: isTop3 ? '0 8px 32px rgba(200,212,0,0.12)' : '0 2px 12px rgba(0,0,0,0.3)',
                    transition: 'all 0.22s ease',
                  }}>
                    {/* ── 카드 메인 행 ── */}
                    <div
                      style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '14px', cursor: 'pointer' }}
                      onClick={() => setExpanded(isOpen ? null : r._id)}
                    >
                      {/* 순위 */}
                      <div style={{ minWidth: '38px', textAlign: 'center' }}>
                        {isTop3
                          ? <div style={{ fontSize: '26px', lineHeight: 1 }}>{MEDAL[i]}</div>
                          : <div style={{ fontWeight: '900', fontSize: `calc(15px * var(--fs,1))`, color: '#94a3b8' }}>#{i + 1}</div>
                        }
                      </div>

                      {/* 썸네일 — 클릭 시 뷰어 열기 */}
                      <div
                        onClick={e => { e.stopPropagation(); if (r.imageUrl) setViewer(i); }}
                        style={{ position: 'relative', flexShrink: 0, cursor: r.imageUrl ? 'zoom-in' : 'default' }}
                      >
                        {r.imageUrl ? (
                          <>
                            <img
                              src={r.imageUrl} alt={r.fishName}
                              style={{
                                width: '72px', height: '72px', borderRadius: '14px', objectFit: 'cover',
                                border: isTop3 ? '2px solid #C8D400' : '1.5px solid rgba(255,255,255,0.1)',
                                transition: 'transform 0.18s ease',
                              }}
                              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            />
                            {/* 확대 아이콘 */}
                            <div style={{
                              position: 'absolute', inset: 0, borderRadius: '14px',
                              background: 'rgba(0,0,0,0.28)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              opacity: 0, transition: 'opacity 0.18s',
                            }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                            >
                              <span style={{ color: '#fff', fontSize: '20px' }}>🔍</span>
                            </div>
                          </>
                        ) : (
                          <div style={{
                            width: '72px', height: '72px', borderRadius: '14px',
                            background: 'linear-gradient(135deg,#1a3a6a,#0056D2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
                          }}>{getFishEmoji(r.fishName)}</div>
                        )}
                      </div>

                      {/* 정보 */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                          <span style={{ fontWeight: '900', fontSize: `calc(17px * var(--fs,1))`, color: '#fff' }}>{r.fishName}</span>
                          {r.verified && <span style={{ fontSize: `calc(10px * var(--fs,1))`, background: '#D1FAE5', color: '#065F46', borderRadius: '6px', padding: '1px 7px', fontWeight: '700' }}>AI인증</span>}
                        </div>
                        <div style={{ fontSize: `calc(13px * var(--fs,1))`, color: '#C8D400', fontWeight: '800', marginBottom: '3px' }}>
                          {r.fishSize ? `📏 ${r.fishSize}cm` : ''}{r.fishSize && r.fishWeight ? ' · ' : ''}{r.fishWeight ? `⚖️ ${r.fishWeight}kg` : ''}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: `calc(11px * var(--fs,1))`, color: 'rgba(255,255,255,0.5)' }}>by {r.userName || '익명'}</span>
                          {r.location && <span style={{ fontSize: `calc(11px * var(--fs,1))`, color: 'rgba(255,255,255,0.5)' }}>📍 {r.location}</span>}
                        </div>
                      </div>

                      {/* 좋아요 + 펼치기 화살표 */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={e => { e.stopPropagation(); handleLike(r._id); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: liked ? '#FF3B30' : 'rgba(255,255,255,0.45)', padding: '4px' }}
                        >
                          <Heart size={18} fill={liked ? '#FF3B30' : 'none'} />
                          <span style={{ fontSize: `calc(11px * var(--fs,1))`, fontWeight: '700' }}>{(r.likes || []).length}</span>
                        </button>
                        <span style={{
                          fontSize: '11px', color: 'rgba(255,255,255,0.4)',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.22s ease', display: 'block',
                        }}>▼</span>
                      </div>
                    </div>

                    {/* ── 확장 패널 (더보기) ── */}
                    <div style={{
                      maxHeight: isOpen ? '400px' : '0px',
                      overflow: 'hidden',
                      transition: 'max-height 0.32s cubic-bezier(0.4,0,0.2,1)',
                    }}>
                      <div style={{ padding: '0 14px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        {/* 큰 사진 */}
                        {r.imageUrl && (
                          <div
                            style={{ position: 'relative', marginTop: '14px', borderRadius: '16px', overflow: 'hidden', cursor: 'zoom-in' }}
                            onClick={() => setViewer(i)}
                          >
                            <img
                              src={r.imageUrl} alt={r.fishName}
                              style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', display: 'block' }}
                            />
                            {/* 풀스크린 힌트 */}
                            <div style={{
                              position: 'absolute', bottom: '10px', right: '10px',
                              background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '10px',
                              padding: '4px 10px', fontSize: '12px', fontWeight: '700', backdropFilter: 'blur(6px)',
                            }}>🔍 크게 보기</div>
                          </div>
                        )}

                        {/* 상세 정보 그리드 */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                          {r.fishSize && (
                            <div style={{ background: 'rgba(200,212,0,0.1)', borderRadius: '12px', padding: '10px 12px' }}>
                              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '2px' }}>길이</div>
                              <div style={{ color: '#C8D400', fontWeight: '900', fontSize: '16px' }}>📏 {r.fishSize}cm</div>
                            </div>
                          )}
                          {r.fishWeight && (
                            <div style={{ background: 'rgba(200,212,0,0.1)', borderRadius: '12px', padding: '10px 12px' }}>
                              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '2px' }}>무게</div>
                              <div style={{ color: '#C8D400', fontWeight: '900', fontSize: '16px' }}>⚖️ {r.fishWeight}kg</div>
                            </div>
                          )}
                          {r.location && (
                            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '10px 12px' }}>
                              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '2px' }}>장소</div>
                              <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px' }}>📍 {r.location}</div>
                            </div>
                          )}
                          {r.baitUsed && (
                            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '10px 12px' }}>
                              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '2px' }}>미끼</div>
                              <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px' }}>🪱 {r.baitUsed}</div>
                            </div>
                          )}
                          {r.userName && (
                            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '10px 12px' }}>
                              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '2px' }}>낚시꾼</div>
                              <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px' }}>🎣 {r.userName}</div>
                            </div>
                          )}
                          {r.createdAt && (
                            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '10px 12px' }}>
                              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '2px' }}>날짜</div>
                              <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px' }}>📅 {new Date(r.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</div>
                            </div>
                          )}
                        </div>

                        {/* 코멘트 */}
                        {r.memo && (
                          <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px' }}>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '4px' }}>한마디</div>
                            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', lineHeight: 1.5 }}>💬 {r.memo}</div>
                          </div>
                        )}

                        {/* 풀스크린 버튼 */}
                        {r.imageUrl && (
                          <button
                            onClick={() => setViewer(i)}
                            style={{
                              width: '100%', marginTop: '12px', padding: '10px', border: 'none', borderRadius: '12px',
                              background: 'rgba(200,212,0,0.15)', color: '#C8D400', fontWeight: '800',
                              fontSize: `calc(13px * var(--fs,1))`, cursor: 'pointer',
                              transition: 'background 0.18s',
                            }}
                          >
                            🖼️ 사진 크게 보기
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
