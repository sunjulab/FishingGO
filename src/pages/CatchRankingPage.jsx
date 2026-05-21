import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Fish, MapPin, Heart, ChevronLeft, Filter } from 'lucide-react';
import apiClient from '../api/index';
import { useUserStore } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import { getFishEmoji } from '../data/fishRules';

const FISH_TABS = ['전체', '감성돔', '광어', '우럭', '볼락', '참돔', '농어', '방어', '붕어', '고등어'];
const PERIOD_TABS = [{ key: 'week', label: '주간' }, { key: 'month', label: '월간' }, { key: 'all', label: '전체' }];

const MEDAL = ['🥇', '🥈', '🥉'];

export default function CatchRankingPage({ embedded = false }) {
  const navigate   = useNavigate();
  const user       = useUserStore(s => s.user);
  const addToast   = useToastStore(s => s.addToast);

  const [fish, setFish]       = useState('전체');
  const [period, setPeriod]   = useState('month');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contests, setContests] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { period, limit: 30 };
      if (fish !== '전체') params.fishName = fish;
      const res = await apiClient.get('/api/catch/ranking', { params });
      setRecords(res.data.records || []);
    } catch {
      setRecords([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [fish, period]);

  useEffect(() => {
    apiClient.get('/api/contest/active').then(r => setContests(r.data.contests || [])).catch(() => {});
  }, []);

  const handleLike = async (id) => {
    if (!user?.id || user?.id === 'GUEST') return addToast('로그인 후 이용하세요.', 'error');
    try {
      const res = await apiClient.post(`/api/catch/${id}/like`, { userId: user.id });
      setRecords(prev => prev.map(r => r._id === id ? { ...r, likes: res.data.liked ? [...(r.likes||[]), user.id] : (r.likes||[]).filter(l => l !== user.id) } : r));
    } catch { addToast('오류 발생', 'error'); }
  };

  return (
    <div style={{ minHeight: embedded ? 'auto' : '100dvh', background: embedded ? 'transparent' : '#f8fafc', paddingBottom: '100px' }}>
      {/* 헤더 — embedded 모드에서는 숨김 */}
      {!embedded && (
      <div style={{ background: 'linear-gradient(135deg,#0a1628,#0056D2)', padding: '16px', paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 style={{ color: '#fff', fontWeight: '900', fontSize: `calc(18px * var(--fs,1))`, margin: 0 }}>🏆 전국 조황 랭킹</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: `calc(11px * var(--fs,1))`, margin: 0 }}>어종별 · 기간별 · 전국 순위</p>
          </div>
        </div>

        {/* 기간 탭 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          {PERIOD_TABS.map(t => (
            <button key={t.key} onClick={() => setPeriod(t.key)} style={{
              padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              fontWeight: '800', fontSize: `calc(12px * var(--fs,1))`,
              background: period === t.key ? '#fff' : 'rgba(255,255,255,0.2)',
              color: period === t.key ? '#0056D2' : '#fff',
            }}>{t.label}</button>
          ))}
        </div>

        {/* 어종 탭 */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {FISH_TABS.map(f => (
            <button key={f} onClick={() => setFish(f)} style={{
              padding: '5px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              fontWeight: '700', fontSize: `calc(11px * var(--fs,1))`, whiteSpace: 'nowrap',
              background: fish === f ? '#FDE68A' : 'rgba(255,255,255,0.15)',
              color: fish === f ? '#78350F' : '#fff',
            }}>{f}</button>
          ))}
        </div>
      </div>
      )}

      {/* embedded 모드 필터 */}
      {embedded && (
        <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            {PERIOD_TABS.map(t => (
              <button key={t.key} onClick={() => setPeriod(t.key)} style={{
                padding: '5px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                fontWeight: '800', fontSize: `calc(12px * var(--fs,1))`,
                background: period === t.key ? '#0056D2' : '#f1f5f9',
                color: period === t.key ? '#fff' : '#555',
              }}>{t.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {FISH_TABS.map(f => (
              <button key={f} onClick={() => setFish(f)} style={{
                padding: '4px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                fontWeight: '700', fontSize: `calc(11px * var(--fs,1))`, whiteSpace: 'nowrap',
                background: fish === f ? '#FDE68A' : '#f1f5f9',
                color: fish === f ? '#78350F' : '#555',
              }}>{f}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: '16px' }}>
        {/* 진행 중 대회 배너 */}
        {contests.length > 0 && (
          <div style={{ background: 'linear-gradient(135deg,#FDE68A,#F59E0B)', borderRadius: '16px', padding: '14px 16px', marginBottom: '14px', cursor: 'pointer' }}
            onClick={() => navigate('/contest')}>
            <div style={{ fontWeight: '900', fontSize: `calc(14px * var(--fs,1))`, color: '#78350F' }}>
              🏆 진행 중인 대회 {contests.length}개
            </div>
            <div style={{ fontSize: `calc(12px * var(--fs,1))`, color: '#92400E', marginTop: '2px' }}>
              {contests[0]?.title} → 참가하기
            </div>
          </div>
        )}

        {/* 내 조황 등록 버튼 */}
        <button onClick={() => navigate('/catch-upload')} style={{
          width: '100%', padding: '14px', borderRadius: '14px', border: 'none', marginBottom: '16px',
          background: 'linear-gradient(135deg,#0056D2,#003fa3)', color: '#fff',
          fontWeight: '900', fontSize: `calc(15px * var(--fs,1))`, cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0,86,210,0.3)',
        }}>
          📸 내 조황 인증하러 가기
        </button>

        {/* 랭킹 목록 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎣</div>
            <div style={{ fontWeight: '700' }}>랭킹 불러오는 중...</div>
          </div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🐟</div>
            <div style={{ fontWeight: '700' }}>아직 조황 기록이 없습니다</div>
            <div style={{ fontSize: `calc(13px * var(--fs,1))`, marginTop: '4px' }}>첫 번째 조황을 인증해보세요!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {records.map((r, i) => {
              const liked = (r.likes || []).includes(user?.id);
              const isTop3 = i < 3;
              return (
                <div key={r._id} style={{
                  background: '#fff', borderRadius: '16px', padding: '14px',
                  boxShadow: isTop3 ? '0 4px 16px rgba(245,158,11,0.2)' : '0 2px 8px rgba(0,0,0,0.06)',
                  border: isTop3 ? '2px solid #FDE68A' : '1.5px solid #f1f5f9',
                  display: 'flex', gap: '12px', alignItems: 'center',
                }}>
                  {/* 순위 */}
                  <div style={{ minWidth: '40px', textAlign: 'center' }}>
                    {isTop3 ? (
                      <div style={{ fontSize: '24px' }}>{MEDAL[i]}</div>
                    ) : (
                      <div style={{ fontWeight: '900', fontSize: `calc(16px * var(--fs,1))`, color: '#94a3b8' }}>{i + 1}</div>
                    )}
                  </div>

                  {/* 물고기 사진 */}
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt={r.fishName} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#EBF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>
                      {getFishEmoji(r.fishName)}
                    </div>
                  )}

                  {/* 정보 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontWeight: '900', fontSize: `calc(16px * var(--fs,1))`, color: '#0d1b2a' }}>{r.fishName}</span>
                      {r.verified && <span style={{ fontSize: `calc(10px * var(--fs,1))`, background: '#D1FAE5', color: '#065F46', borderRadius: '6px', padding: '1px 6px', fontWeight: '700' }}>AI인증</span>}
                    </div>
                    <div style={{ fontSize: `calc(13px * var(--fs,1))`, color: '#0056D2', fontWeight: '800', marginBottom: '2px' }}>
                      {r.fishSize ? `📏 ${r.fishSize}cm` : ''}{r.fishSize && r.fishWeight ? ' · ' : ''}{r.fishWeight ? `⚖️ ${r.fishWeight}kg` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: `calc(11px * var(--fs,1))`, color: '#94a3b8' }}>by {r.userName || '익명'}</span>
                      {r.location && <span style={{ fontSize: `calc(11px * var(--fs,1))`, color: '#94a3b8' }}>📍 {r.location}</span>}
                    </div>
                  </div>

                  {/* 좋아요 */}
                  <button onClick={() => handleLike(r._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: liked ? '#FF3B30' : '#94a3b8', padding: '4px' }}>
                    <Heart size={18} fill={liked ? '#FF3B30' : 'none'} />
                    <span style={{ fontSize: `calc(11px * var(--fs,1))`, fontWeight: '700' }}>{(r.likes || []).length}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
