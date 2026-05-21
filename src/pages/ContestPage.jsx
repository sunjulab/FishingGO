import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy, Clock, Fish, Award } from 'lucide-react';
import apiClient from '../api/index';
import { useUserStore } from '../store/useUserStore';
import { getFishEmoji } from '../data/fishRules';

const MEDAL = ['🥇', '🥈', '🥉'];

function ContestCard({ contest, onPress }) {
  const now     = new Date();
  const endDate = new Date(contest.endDate);
  const msLeft  = endDate - now;
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

  return (
    <div onClick={onPress} style={{
      background: 'linear-gradient(135deg,#0a1628,#0056D2)', borderRadius: '20px',
      padding: '18px', marginBottom: '12px', cursor: 'pointer',
      boxShadow: '0 6px 20px rgba(0,86,210,0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '4px 12px' }}>
          <span style={{ color: '#FDE68A', fontWeight: '900', fontSize: `calc(12px * var(--fs,1))` }}>
            🏆 {contest.region || '전국'} 대회
          </span>
        </div>
        <div style={{ color: daysLeft <= 3 ? '#FF6B6B' : '#4ade80', fontWeight: '800', fontSize: `calc(12px * var(--fs,1))` }}>
          <Clock size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
          {daysLeft}일 남음
        </div>
      </div>

      <div style={{ color: '#fff', fontWeight: '900', fontSize: `calc(18px * var(--fs,1))`, marginBottom: '6px' }}>
        {contest.title}
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '24px' }}>{getFishEmoji(contest.fishName)}</span>
        <div>
          <div style={{ color: '#BAE6FD', fontSize: `calc(13px * var(--fs,1))`, fontWeight: '700' }}>
            대상 어종: {contest.fishName}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: `calc(11px * var(--fs,1))` }}>
            {contest.metric === 'size' ? '📏 크기(cm) 기준' : '⚖️ 무게(kg) 기준'}
          </div>
        </div>
      </div>

      {/* TOP3 미리보기 */}
      {contest.top3?.length > 0 && (
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '10px' }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: `calc(10px * var(--fs,1))`, fontWeight: '700', marginBottom: '6px' }}>현재 순위</div>
          {contest.top3.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ color: '#FDE68A', fontSize: `calc(12px * var(--fs,1))`, fontWeight: '700' }}>
                {MEDAL[i]} {r.userName || '익명'}
              </span>
              <span style={{ color: '#fff', fontSize: `calc(12px * var(--fs,1))`, fontWeight: '700' }}>
                {contest.metric === 'size' ? `${r.fishSize}cm` : `${r.fishWeight}kg`}
              </span>
            </div>
          ))}
        </div>
      )}

      {contest.prize && (
        <div style={{ marginTop: '10px', background: 'rgba(253,230,138,0.2)', borderRadius: '8px', padding: '6px 10px' }}>
          <span style={{ color: '#FDE68A', fontSize: `calc(12px * var(--fs,1))`, fontWeight: '700' }}>🎁 상품: {contest.prize}</span>
        </div>
      )}
    </div>
  );
}

export default function ContestPage() {
  const navigate = useNavigate();
  const user     = useUserStore(s => s.user);
  const isAdmin  = useUserStore(s => s.userTier === 'MASTER' || s.user?.email === 'sunjulab.k@gmail.com');

  const [contests, setContests]   = useState([]);
  const [selected, setSelected]   = useState(null);
  const [ranking, setRanking]     = useState([]);
  const [loading, setLoading]     = useState(true);

  // 관리자 대회 등록
  const [showAdmin, setShowAdmin] = useState(false);
  const [form, setForm] = useState({ title: '', fishName: '감성돔', region: '전국', metric: 'size', startDate: '', endDate: '', description: '', prize: '' });

  useEffect(() => {
    apiClient.get('/api/contest/active')
      .then(r => setContests(r.data.contests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadRanking = async (contest) => {
    setSelected(contest);
    try {
      const res = await apiClient.get(`/api/contest/${contest._id}/ranking`);
      setRanking(res.data.ranking || []);
    } catch { setRanking([]); }
  };

  const handleCreateContest = async () => {
    if (!form.title || !form.startDate || !form.endDate) return alert('필수 항목을 입력하세요');
    try {
      await apiClient.post('/api/contest', form);
      alert('대회 등록 완료!');
      setShowAdmin(false);
      const res = await apiClient.get('/api/contest/active');
      setContests(res.data.contests || []);
    } catch (e) { alert('오류: ' + (e.response?.data?.error || e.message)); }
  };

  const inputSt = { width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e0e0e0', fontSize: `calc(14px * var(--fs,1))`, fontFamily: 'inherit', boxSizing: 'border-box', marginTop: '4px' };

  return (
    <div style={{ minHeight: '100dvh', background: '#f8fafc', paddingBottom: '100px' }}>
      {/* 헤더 */}
      <div style={{ background: 'linear-gradient(135deg,#0a1628,#0056D2)', padding: '16px', paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {selected ? (
              <button onClick={() => { setSelected(null); setRanking([]); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <ChevronLeft size={20} />
              </button>
            ) : (
              <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <ChevronLeft size={20} />
              </button>
            )}
            <div>
              <h1 style={{ color: '#fff', fontWeight: '900', fontSize: `calc(18px * var(--fs,1))`, margin: 0 }}>
                🏆 {selected ? selected.title : '전국 낚시 대회'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: `calc(11px * var(--fs,1))`, margin: 0 }}>
                {selected ? `${selected.fishName} · ${selected.metric === 'size' ? '크기' : '무게'} 기준` : '어종별 월간 대회 · 시즌 랭킹'}
              </p>
            </div>
          </div>
          {isAdmin && !selected && (
            <button onClick={() => setShowAdmin(!showAdmin)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', padding: '6px 12px', color: '#fff', fontWeight: '700', fontSize: `calc(12px * var(--fs,1))`, cursor: 'pointer' }}>
              + 대회 등록
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* 관리자 대회 등록 폼 */}
        {showAdmin && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <div style={{ fontWeight: '900', fontSize: `calc(16px * var(--fs,1))`, marginBottom: '12px' }}>대회 등록</div>
            {[
              { label: '대회명', key: 'title', placeholder: '5월 감성돔 왕중왕전' },
              { label: '상금/상품', key: 'prize', placeholder: '낚시 용품 세트' },
              { label: '설명', key: 'description', placeholder: '대회 상세 설명' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: `calc(11px * var(--fs,1))`, fontWeight: '700', color: '#64748b' }}>{label}</label>
                <input style={inputSt} placeholder={placeholder} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ fontSize: `calc(11px * var(--fs,1))`, fontWeight: '700', color: '#64748b' }}>어종</label>
                <select style={inputSt} value={form.fishName} onChange={e => setForm(p => ({ ...p, fishName: e.target.value }))}>
                  {['감성돔','광어','우럭','참돔','볼락','농어','방어','고등어','붕어'].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: `calc(11px * var(--fs,1))`, fontWeight: '700', color: '#64748b' }}>지역</label>
                <select style={inputSt} value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))}>
                  {['전국','남해','서해','동해','제주','내수면'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: `calc(11px * var(--fs,1))`, fontWeight: '700', color: '#64748b' }}>시작일</label>
                <input type="date" style={inputSt} value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: `calc(11px * var(--fs,1))`, fontWeight: '700', color: '#64748b' }}>종료일</label>
                <input type="date" style={inputSt} value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>
            <button onClick={handleCreateContest} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#0056D2', color: '#fff', fontWeight: '900', cursor: 'pointer', fontSize: `calc(14px * var(--fs,1))` }}>
              대회 등록하기
            </button>
          </div>
        )}

        {/* 대회 목록 */}
        {!selected && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏆</div>
                <div style={{ fontWeight: '700' }}>대회 정보 로딩 중...</div>
              </div>
            ) : contests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎣</div>
                <div style={{ fontWeight: '700' }}>현재 진행 중인 대회가 없습니다</div>
                {isAdmin && <div style={{ fontSize: `calc(13px * var(--fs,1))`, marginTop: '4px' }}>관리자 버튼으로 대회를 등록하세요</div>}
              </div>
            ) : (
              contests.map(c => (
                <ContestCard key={c._id} contest={c} onPress={() => loadRanking(c)} />
              ))
            )}

            {/* 조황 인증 유도 */}
            <button onClick={() => navigate('/catch-upload')} style={{
              width: '100%', padding: '14px', borderRadius: '14px', border: 'none', marginTop: '8px',
              background: 'linear-gradient(135deg,#0056D2,#003fa3)', color: '#fff',
              fontWeight: '900', fontSize: `calc(15px * var(--fs,1))`, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,86,210,0.3)',
            }}>📸 내 조황 인증하고 대회 참가하기</button>
          </>
        )}

        {/* 대회 상세 랭킹 */}
        {selected && (
          <div>
            <button onClick={() => navigate('/catch-upload')} style={{
              width: '100%', padding: '13px', borderRadius: '13px', border: 'none', marginBottom: '14px',
              background: 'linear-gradient(135deg,#0056D2,#003fa3)', color: '#fff',
              fontWeight: '900', fontSize: `calc(14px * var(--fs,1))`, cursor: 'pointer',
            }}>📸 조황 인증하고 이 대회 참가하기</button>

            {ranking.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>🐟</div>
                <div style={{ fontWeight: '700' }}>아직 참가자가 없습니다</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ranking.map((r, i) => (
                  <div key={r._id} style={{
                    background: i < 3 ? 'linear-gradient(135deg,#FEF9C3,#FEF3C7)' : '#fff',
                    borderRadius: '14px', padding: '12px 14px',
                    border: i < 3 ? '2px solid #F59E0B' : '1.5px solid #f1f5f9',
                    display: 'flex', gap: '12px', alignItems: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{ minWidth: '36px', textAlign: 'center', fontSize: i < 3 ? '24px' : `calc(16px * var(--fs,1))`, fontWeight: '900', color: '#94a3b8' }}>
                      {i < 3 ? MEDAL[i] : i + 1}
                    </div>
                    {r.imageUrl && <img src={r.imageUrl} alt="" style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '900', fontSize: `calc(15px * var(--fs,1))`, color: '#0d1b2a' }}>{r.userName || '익명'}</div>
                      <div style={{ fontSize: `calc(12px * var(--fs,1))`, color: '#64748b' }}>{r.fishName} · {r.location || '장소 미입력'}</div>
                    </div>
                    <div style={{ fontWeight: '900', fontSize: `calc(16px * var(--fs,1))`, color: '#0056D2' }}>
                      {selected.metric === 'size' ? `${r.fishSize}cm` : `${r.fishWeight}kg`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
