import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import apiClient from '../api/index';
import { evaluateFishingCondition } from '../utils/evaluator';
import { useNavigate } from 'react-router-dom';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import { NativeAd, RewardGateModal } from './AdUnit';
import UpgradeModal from './UpgradeModal';

import { Capacitor } from '@capacitor/core';
// ??TIDE-API: 怨듦났?곗씠?고룷???댁뼇 3醫?API
import { fetchTideForecast, fetchWaterTemp, fetchFishingIndex } from '../api/marineApi';

// ENH3-B5: ?섍꼍蹂?섎뒗 遺덈? ??而댄룷?뚰듃 ?몃? ?곸닔濡?遺꾨━
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import ReactPlayer from 'react-player';

// ??7TH-B4: extractYoutubeId 而댄룷?뚰듃 ?몃? 異붿텧 ??saveCctvOverride ?몄텧留덈떎 ?ъ젙???쒓굅
const YOUTUBE_REGEXP = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
function extractYoutubeId(str) {
  const match = str.match(YOUTUBE_REGEXP);
  return (match && match[2].length === 11) ? match[2] : str;
}

// ?렍 議곌낵 湲곕줉 ?낅젰 紐⑤떖 (FishingPointBottomSheet ?꾩슜)
function CatchRecordModal({ point, user, onClose, onSuccess }) {
  const addToast = useToastStore(s => s.addToast);
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    fish: (point?.fish || '').split(',')[0].trim(),
    size: '', weight: '', bait: '', weather: '', wind: '', wave: '', memo: '', image: null,
    date: (() => { const d = new Date(Date.now() + 9 * 60 * 60 * 1000); return d.toISOString().split('T')[0]; })(),
    shareToBoard: false, // ??SHARE-OPT: ?ㅽ뵂寃뚯떆???숈떆 怨듭쑀 ?듭뀡
  });
  const [submitting, setSubmitting] = useState(false);

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { fileToCompressedBase64 } = await import('../utils/imageUtils');
      const b64 = await fileToCompressedBase64(file);
      setForm(p => ({ ...p, image: b64 }));
    } catch { addToast('?대?吏 泥섎━ ?ㅽ뙣', 'error'); }
  };

  const handleSubmit = async () => {
    if (!form.fish.trim()) { addToast('?댁쥌???낅젰?댁＜?몄슂.', 'error'); return; }
    setSubmitting(true);
    try {
      // ??議곌낵 湲곕줉 ???
      await apiClient.post('/api/user/records', {
        author: user?.name || user?.nickname || 'anonymous',
        author_email: user?.email || '',
        fish: form.fish.trim(),
        size: form.size,
        weight: form.weight,
        location: point?.name || '',
        bait: form.bait,
        weather: form.weather,
        wind: form.wind,
        wave: form.wave,
        memo: form.memo,
        image: form.image,
        date: form.date,
        pointId: String(point?.id || ''),
      });

      // ???ㅽ뵂寃뚯떆???숈떆 怨듭쑀 (?듭뀡 泥댄겕 ??
      if (form.shareToBoard) {
        const sizeStr  = form.size   ? `${form.size}cm`    : '';
        const weightStr = form.weight ? `${form.weight}kg` : '';
        const specLine = [sizeStr, weightStr].filter(Boolean).join(' / ');
        const weatherLine = [form.weather, form.wind && `?띿냽 ${form.wind}`, form.wave && `?뚭퀬 ${form.wave}`].filter(Boolean).join(' 쨌 ');
        const boardContent =
          `?뙄 [議곌낵 怨듭쑀] ${point?.name || ''} ??${form.date}\n` +
          `?맅 ?댁쥌: ${form.fish.trim()}` + (specLine ? `  ${specLine}` : '') + '\n' +
          (form.bait    ? `?렞 誘몃겮/猷⑥뼱: ${form.bait}\n`   : '') +
          (weatherLine  ? `?뙟 ?좎뵪: ${weatherLine}\n`       : '') +
          (form.memo    ? `\n?뮠 ${form.memo}` : '');
        await apiClient.post('/api/community/posts', {
          author: user?.name || 'anonymous', // ??BUG-05 FIX: user null 媛??
          author_email: user?.email || '',    // ??BUG-05 FIX: user null 媛??
          category: '議고솴 怨듭쑀',
          content: boardContent.trim(),
          image: form.image || null,
        });
        addToast('?뙄 議곌낵 湲곕줉 + ?맅 ?싳떆洹몃옩 ?숈떆 ?깅줉 ?꾨즺!', 'success');
      } else {
        addToast('?렍 議곌낵 湲곕줉????λ릺?덉뒿?덈떎!', 'success');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || '????ㅽ뙣. ?ㅼ떆 ?쒕룄?댁＜?몄슂.', 'error');
    } finally { setSubmitting(false); }
  };

  const WEATHER_OPTIONS = ['留묒쓬', '?먮┝', '鍮?, '媛뺥뭾', '?덇컻'];
  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '28px 28px 0 0', padding: '28px 20px 48px', width: '100%', maxWidth: '480px', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ width: '40px', height: '4px', background: '#E5E5EA', borderRadius: '2px', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '950', color: '#1c1c1e' }}>?렍 議곌낵 湲곕줉 ?④린湲?/div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: `calc(22px * var(--fs, 1))`, cursor: 'pointer', color: '#8E8E93' }}>??/button>
        </div>
        <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '600', marginBottom: '20px' }}>
          ?뱧 {point?.name} 쨌 湲곕줉? 留덉씠?섏씠吏 議곌낵?듦퀎??諛섏쁺?⑸땲??
        </div>

        {/* ?ъ쭊 ?낅줈??*/}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
        <div onClick={() => fileRef.current?.click()} style={{ width: '100%', height: '140px', background: '#F8F9FA', borderRadius: '16px', border: '2px dashed #D1D1D6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '16px', overflow: 'hidden' }}>
          {form.image
            ? <img src={form.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
            : <div style={{ textAlign: 'center', color: '#8E8E93' }}>
                <div style={{ fontSize: `calc(28px * var(--fs, 1))`, marginBottom: '6px' }}>?벜</div>
                <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '700' }}>?ъ쭊 異붽? (?좏깮)</div>
              </div>
          }
        </div>

        {/* ?댁쥌 */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', color: '#444', marginBottom: '6px' }}>?댁쥌 *</div>
          <input value={form.fish} onChange={e => set('fish', e.target.value)} placeholder="?? 媛먯꽦?? style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: `calc(14px * var(--fs, 1))`, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* ?ъ씠利?/ 臾닿쾶 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', color: '#444', marginBottom: '6px' }}>?ъ씠利?(cm)</div>
            <input value={form.size} onChange={e => set('size', e.target.value)} placeholder="?? 45" type="number" style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: `calc(14px * var(--fs, 1))`, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', color: '#444', marginBottom: '6px' }}>臾닿쾶 (kg)</div>
            <input value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="?? 2.3" type="number" step="0.1" style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: `calc(14px * var(--fs, 1))`, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* 誘몃겮 */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', color: '#444', marginBottom: '6px' }}>誘몃겮/猷⑥뼱</div>
          <input value={form.bait} onChange={e => set('bait', e.target.value)} placeholder="?? ?щ┫, 媛???곸씠, ??대씪諛? style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: `calc(14px * var(--fs, 1))`, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* ?좎뵪 ?좏깮 */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', color: '#444', marginBottom: '8px' }}>?좎뵪</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {WEATHER_OPTIONS.map(w => (
              <button key={w} onClick={() => set('weather', form.weather === w ? '' : w)}
                style={{ padding: '7px 14px', borderRadius: '20px', border: form.weather === w ? '2px solid #0056D2' : '1.5px solid #E5E5EA', background: form.weather === w ? '#EBF5FF' : '#fff', color: form.weather === w ? '#0056D2' : '#555', fontWeight: '800', fontSize: `calc(12px * var(--fs, 1))`, cursor: 'pointer' }}>
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* ?좎쭨 */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', color: '#444', marginBottom: '6px' }}>異쒖“ ?좎쭨</div>
          <input value={form.date} onChange={e => set('date', e.target.value)} type="date" style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: `calc(14px * var(--fs, 1))`, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* 硫붾え */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', color: '#444', marginBottom: '6px' }}>?쒕쭏??硫붾え</div>
          <textarea value={form.memo} onChange={e => set('memo', e.target.value)} placeholder="?? ?덈꼍 4??臾쇰븣 留욎떠 ?諛? ?ㅼ쓬????대씪諛??꾩쟾" rows={3} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: `calc(14px * var(--fs, 1))`, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>

        {/* ??SHARE-OPT: ?ㅽ뵂寃뚯떆???숈떆 怨듭쑀 泥댄겕 ?듭뀡 */}
        <div
          onClick={() => set('shareToBoard', !form.shareToBoard)}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
            marginBottom: '16px',
            background: form.shareToBoard ? 'linear-gradient(135deg, #EBF5FF, #F0FFF8)' : '#F8F9FA',
            border: `1.5px solid ${form.shareToBoard ? '#0056D2' : '#E5E5EA'}`,
            transition: 'all 0.15s',
          }}
        >
          {/* 而ㅼ뒪? 泥댄겕諛뺤뒪 */}
          <div style={{
            width: '22px', height: '22px', borderRadius: '7px', flexShrink: 0,
            border: `2px solid ${form.shareToBoard ? '#0056D2' : '#C7C7CC'}`,
            background: form.shareToBoard ? '#0056D2' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>
            {form.shareToBoard && (
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                <path d="M1 4.5L4 7.5L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: form.shareToBoard ? '#0056D2' : '#1c1c1e' }}>
              ?뙄 ?싳떆洹몃옩?먮룄 怨듭쑀?섍린
            </div>
            <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#8E8E93', marginTop: '2px', fontWeight: '600' }}>
              泥댄겕 ??議곌낵 ?댁슜???싳떆洹몃옩 '議고솴 怨듭쑀' 移댄뀒怨좊━???먮룞 ?깅줉?⑸땲??
            </div>
          </div>
          <span style={{ fontSize: `calc(18px * var(--fs, 1))` }}>{form.shareToBoard ? '?뙄' : '?뵏'}</span>
        </div>

        <button onClick={handleSubmit} disabled={submitting}
          style={{ width: '100%', padding: '16px', background: submitting ? '#ccc' : 'linear-gradient(135deg, #0056D2, #0096FF)', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '950', fontSize: `calc(15px * var(--fs, 1))`, cursor: submitting ? 'not-allowed' : 'pointer', letterSpacing: '-0.02em' }}>
          {submitting ? '???以?..' : form.shareToBoard ? '?뙄 湲곕줉 ???+ 寃뚯떆??怨듭쑀' : '?렍 議곌낵 湲곕줉 ??ν븯湲?}
        </button>
      </div>
    </div>
  );
}

export default function FishingPointBottomSheet({ selectedPoint, onClose, onConditionReady }) {
  const [marineData, setMarineData] = useState({
    tide: null,
    waterTemp: '-',
    fishingIndex: null
  });
  const [loading, setLoading] = useState(true);
  const [cctvData, setCctvData] = useState(null);
  const [cctvLoading, setCctvLoading] = useState(true);
  const [shoppingItems, setShoppingItems] = useState([]);
  const [businessPosts, setBusinessPosts] = useState([]);
  const [bizLoading, setBizLoading] = useState(false);
  const navigate = useNavigate();
  const user = useUserStore(state => state.user);
  const userTier = useUserStore(state => state.userTier);
  // ??FIX-CCTV: isAdmin(MASTER tier ?ы븿) ??canAccessPremium??MASTER tier 紐낆떆??異붽?
  const canAccessPremium = useMemo(() => {
    if (user?.id === ADMIN_ID || user?.email === ADMIN_EMAIL || user?.email === ADMIN_ID) return true;
    return ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'MASTER'].includes(userTier);
  }, [userTier, user?.id, user?.email]); // eslint-disable-line react-hooks/exhaustive-deps
  // ??7TH-A3: isAdmin 吏곸젒 鍮꾧탳 ??ADMIN_ID/ADMIN_EMAIL/MASTER tier 4以?蹂댁옣
  const isAdmin = useUserStore(s =>
    s.user?.id === ADMIN_ID ||
    s.user?.email === ADMIN_EMAIL ||
    s.user?.email === ADMIN_ID ||
    s.userTier === 'MASTER'
  );
  const addToast = useToastStore(state => state.addToast);
  // ENH3-B5: 紐⑤뱢 ?덈꺼 API_BASE ?곸닔 ?ъ슜
  // isEditingCctv: CCTV ?섏젙 UI ?곹깭 (?꾨옒 useState濡?愿由?


  const [isEditingCctv, setIsEditingCctv] = useState(false);
  const [editYoutubeId, setEditYoutubeId] = useState('');
  const [isSavingCctv, setIsSavingCctv] = useState(false);
  const [showCatchModal, setShowCatchModal] = useState(false);

  // ??AD-GATE: CCTV 愿묎퀬 寃뚯씠???곹깭
  const [isCctvUnlocked, setIsCctvUnlocked] = useState(canAccessPremium || isAdmin);
  const [showRewardGate, setShowRewardGate] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);



  // ?ㅼ떆媛??곗냽 ?ъ깮(?ㅽ듃由щ컢) ?④낵瑜??꾪븳 ??꾩뒪?ы봽
  const [mofTimestamp, setMofTimestamp] = useState(Date.now());
  useEffect(() => {
    if (cctvData?.type !== 'mof') return;
    const interval = setInterval(() => {
      setMofTimestamp(Date.now());
    }, 5000); // ?꾨줉???ㅼ슫濡쒕뱶 ?쒓컙 怨좊젮 (1.5珥?-> 5珥?
    return () => clearInterval(interval);
  }, [cctvData?.type]);

  // ??17TH-B1: saveCctvOverride useCallback ?곸슜 ??editYoutubeId/selectedPoint/cctvData stale closure ?꾪뿕 ?쒓굅
  const saveCctvOverride = useCallback(async () => {
    if (!editYoutubeId.trim()) return;

    const trimmedInput = editYoutubeId.trim();
    
    let finalType = 'iframe';
    let finalYoutubeId = trimmedInput;
    
    if (/youtu\.be|youtube\.com|v\/|embed\//.test(trimmedInput)) {
      finalType = 'youtube';
      finalYoutubeId = extractYoutubeId(trimmedInput);
    } else if (trimmedInput.includes('d.kbs.co.kr/special/cctvShare')) {
      finalType = 'kbs_share';
      const match = trimmedInput.match(/cctvId=([a-zA-Z0-9_-]+)/);
      finalYoutubeId = match ? match[1] : trimmedInput;
    } else if (trimmedInput.endsWith('.m3u8') || trimmedInput.includes('.m3u8?')) {
      finalType = 'hls';
    } else if (trimmedInput.includes('coast.mof.go.kr')) {
      finalType = 'mof_custom';
      finalYoutubeId = trimmedInput;
    } else if (trimmedInput.replace(/\s+/g, '').includes('以鍮?) || trimmedInput.toLowerCase().includes('fishinggo')) {
      finalType = 'fishinggo_placeholder';
      finalYoutubeId = 'placeholder';
    } else if (/^\d+$/.test(trimmedInput)) {
      finalType = 'kbs_share';
      finalYoutubeId = trimmedInput;
    }

    // 蹂댁븞: iframe ??낆씤??http濡??쒖옉?섏? ?딆쑝硫??ㅻ쪟 諛⑹?瑜??꾪빐 placeholder濡?媛뺤젣 ?꾪솚
    if (finalType === 'iframe' && !finalYoutubeId.startsWith('http') && !finalYoutubeId.startsWith('//')) {
      finalType = 'fishinggo_placeholder';
      finalYoutubeId = 'placeholder';
    }

    const sid = selectedPoint.obsCode || '';
    const cctvOverrideId = selectedPoint.id ? `point_${selectedPoint.id}` : sid;
    try {
      setIsSavingCctv(true);
      const res = await apiClient.put(`/api/admin/cctv/${cctvOverrideId}`, {
        type: finalType,
        youtubeId: finalYoutubeId,
        label: cctvData?.label || `${selectedPoint.name} ?섎룞?낅뜲?댄듃` // ??7TH-C4: ?쒓? 吏곸젒 ?쒓린
      });
      if (res.data.success) {
        addToast('??CCTV 留곹겕媛 ?뺤긽?곸쑝濡??섏젙?섏뿀?듬땲??', 'success'); // ??7TH-C4: ?쒓? 吏곸젒 ?쒓린
        setIsEditingCctv(false);
        // ?섏젙??留곹겕濡?利됱떆 ?ㅼ떆 濡쒕뱶
        setCctvLoading(true);
        const cctvResp = await apiClient.get(`/api/weather/cctv?stationId=${sid}&pointId=point_${selectedPoint.id || ''}`);
        setCctvData(cctvResp.data);
      } else {
        addToast(res.data.error || '?섏젙???ㅽ뙣?덉뒿?덈떎.', 'error'); // ??7TH-C4: ?쒓? 吏곸젒 ?쒓린
      }
    } catch (err) {
      addToast('?섏젙 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.', 'error');
    } finally {
      setIsSavingCctv(false);
      setCctvLoading(false);
    }
  }, [editYoutubeId, selectedPoint, cctvData, addToast]); // ??17TH-B1: 紐⑤뱺 ?대줈? 蹂??deps ?곸떆

  // ??AUTO-REFRESH: ?좎뵪쨌?섏삩쨌臾쇰븣 30遺??먮룞 媛깆떊 (silent ??濡쒕뵫 ?ㅽ뵾???놁씠 諛깃렇?쇱슫???덈줈怨좎묠)
  const [lastRefreshed, setLastRefreshed] = useState(null);      // 留덉?留?媛깆떊 ?쒓컖
  const [nextRefreshIn, setNextRefreshIn] = useState(null);      // ?ㅼ쓬 媛깆떊源뚯? ?⑥? 珥?
  const autoRefreshRef = useRef(null);                           // setInterval ref (cleanup??
  const countdownRef  = useRef(null);                            // 1珥?移댁슫?몃떎??ref

  useEffect(() => {
    if (!selectedPoint) return;

    // ?? ?좎뵪 ?꾩슜 silent 媛깆떊 (CCTV쨌?쇳븨 ?쒖쇅 ??遺덊븘?뷀븳 API ?몄텧 諛⑹?) ??
    const silentRefresh = async () => {
      const sid = selectedPoint.obsCode || '';
      const kstDate = new Date(Date.now() + 9 * 60 * 60 * 1000);
      const todayStr = kstDate.toISOString().slice(0, 10).replace(/-/g, '');
      try {
        const [marine, tideItems, temp, fishIdx] = await Promise.allSettled([
          apiClient.get(`/api/weather/precision?stationId=${sid}&lat=${selectedPoint.lat || ''}&lng=${selectedPoint.lng || ''}`),
          fetchTideForecast(sid, todayStr),
          fetchWaterTemp(sid, todayStr),
          fetchFishingIndex(sid),
        ]);
        // 湲곗긽 ?곗씠??
        if (marine.status === 'fulfilled') {
          const data = marine.value.data;
          if (data?.wave?.coastal != null && !isNaN(parseFloat(data.wave.coastal))) {
            // ?쒕쾭?먯꽌 理쒕??뚭퀬(1.8諛?濡??대? 蹂?섎릺???ㅻ?濡??꾨줎?몄뿏??媛먯뇙 ?쒓굅
          }
          setMarineData(prev => ({ ...prev, ...data, stationId: sid }));
        }
        // 議곗꽍?덈낫
        if (tideItems.status === 'fulfilled' && tideItems.value?.length) {
          const predictions = tideItems.value.map(item => {
            const timeStr = item.predcDt ? item.predcDt.split(' ')[1] : (item.hl_time || item.tph_time || '');
            const typeStr = (item.extrSe === '1' || item.extrSe === '3' || item.hl_code === 'H') ? '怨좎“' : '媛꾩“';
            const levelVal = item.predcTdlvVl || item.hl_level || item.tph_level || '';
            return {
              tph_time: timeStr,
              hl_code: typeStr,
              tph_level: levelVal,
              time: timeStr,
              type: typeStr,
              level: levelVal,
            };
          });
          const highs = predictions.filter(p => p.type === '怨좎“').map(p => p.time).sort();
          const lows = predictions.filter(p => p.type === '媛꾩“').map(p => p.time).sort();
          setMarineData(prev => ({
            ...prev,
            tide_predictions: predictions,
            tide: {
              ...(prev.tide || {}),
              high: highs[0] || '-',
              high2: highs[1] || '-',
              low: lows[0] || '-',
              low2: lows[1] || '-',
            },
          }));
        }
        // ?섏삩
        if (temp.status === 'fulfilled' && temp.value && temp.value !== '-') {
          setMarineData(prev => ({ ...prev, waterTemp: temp.value, sst: temp.value }));
        }
        // ?싳떆吏??
        if (fishIdx.status === 'fulfilled' && fishIdx.value?.length) {
          const today = fishIdx.value[0];
          const gradeMap = { '1': '留ㅼ슦醫뗭쓬', '2': '醫뗭쓬', '3': '蹂댄넻', '4': '?섏겏', '5': '留ㅼ슦?섏겏' };
          const grade = today?.fishing_grade || gradeMap[today?.fishing_idx || today?.fishingIdx] || '';
          if (grade) setMarineData(prev => ({
            ...prev,
            fishingIndex: {
              ?깃툒: grade,
              ?섏삩: today?.wt ? `${today.wt}째C` : '-',
              ?뚭퀬: today?.wh ? `${parseFloat((parseFloat(today.wh) * 1.8).toFixed(1))}m` : '-',
              議곕쪟: today?.current_spd ? `${today.current_spd}m/s` : '-',
            },
          }));
        }
        setLastRefreshed(new Date());
        setNextRefreshIn(30 * 60); // 移댁슫?몃떎??由ъ뀑
        if (!import.meta.env.PROD) console.info('[AutoRefresh] 30遺??먮룞 媛깆떊 ?꾨즺');
      } catch (e) {
        if (!import.meta.env.PROD) console.warn('[AutoRefresh] 媛깆떊 ?ㅽ뙣:', e);
      }
    };

    // ?? 理쒖큹 濡쒕뵫 (?꾩껜 濡쒕뵫 ??CCTV쨌?쇳븨 ?ы븿) ??????????????????????????
    let cancelled = false; // ??BUG-01 FIX: ?ъ씤???꾪솚 ???댁쟾 ?붿껌 痍⑥냼???뚮옒洹?
    const loadData = async () => {
      setLoading(true);
      // ??FIX: obsCode ?놁쑝硫?CCTV 濡쒕뱶 ?먯껜 ?ㅽ궢 (?됰슧??DT_0001 諛⑹?)
      const sid = selectedPoint.obsCode || ''; // 鍮?臾몄옄????marineAPI??lat/lng濡??숈옉, CCTV留??ㅽ궢
      if (!sid) {
        setCctvLoading(false);
        setCctvData(null);
      }

      const kstDate = new Date(Date.now() + 9 * 60 * 60 * 1000);
      const todayStr = kstDate.toISOString().slice(0, 10).replace(/-/g, '');

      const cctvPromise = sid
        ? apiClient.get(`/api/weather/cctv?stationId=${sid}&pointId=point_${selectedPoint.id || ''}`)
            .then(res => {
              if (!cancelled) {
                // ??FIX: no_cctv ??낆씠硫?null 泥섎━ (?곸긽 ?놁쓬)
                if (res.data?.type === 'no_cctv' || (!res.data?.url && !res.data?.fallbackImg)) {
                  setCctvData(null);
                } else {
                  setCctvData(res.data);
                }
              }
            })
            .catch(err => { if (!import.meta.env.PROD) console.error('CCTV Load Error:', err); })
            .finally(() => { if (!cancelled) setCctvLoading(false); })
        : Promise.resolve(); // obsCode ?놁쑝硫?CCTV ?붿껌 ????

      const _fishStr = selectedPoint.fish || (selectedPoint.targets && selectedPoint.targets.length > 0 ? selectedPoint.targets.join(',') : '');
      const fish = _fishStr ? _fishStr.split(',')[0].trim() : '';
      const pointType = selectedPoint.region || '諛붾떎';
      const shopPromise = apiClient.get(
        `/api/shop/recommend?pointType=${encodeURIComponent(pointType)}&fish=${encodeURIComponent(fish)}`
      ).then(res => {
        const items = res.data?.products?.slice(0, 3) || [];
        if (items.length > 0 && !cancelled) setShoppingItems(items); // ??BUG-01 FIX
      }).catch(err => { if (!import.meta.env.PROD) console.error('Shop Load Error:', err); });

      const marinePromise = apiClient.get(`/api/weather/precision?stationId=${sid}&lat=${selectedPoint.lat || ''}&lng=${selectedPoint.lng || ''}`)
        .then(resp => {
          if (!cancelled) {
            const data = resp.data;
            if (data?.wave?.coastal != null && !isNaN(parseFloat(data.wave.coastal))) {
              // ?쒕쾭?먯꽌 理쒕??뚭퀬(1.8諛?濡??대? 蹂?섎릺???ㅻ?濡??꾨줎?몄뿏??媛먯뇙 ?쒓굅
            }
            setMarineData(prev => ({ ...prev, ...data, stationId: sid })); // ??BUG-01 FIX
          }
        })
        .catch(err => {
          if (!import.meta.env.PROD) console.error('Data Load Error:', err);
          if (cancelled) return;
          const reg = selectedPoint.region || '?⑦빐';
          const profile = { '?쒖＜': 18.2, '?⑦빐': 16.5, '?숉빐': 14.2, '?쒗빐': 11.8 };
          const baseSst = profile[reg] || 16.0;
          const _idNum = typeof selectedPoint.id === 'number'
            ? selectedPoint.id
            : String(selectedPoint.id).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
          const seed = (_idNum % 10 - 5) / 10;
          const finalSst = (baseSst + seed).toFixed(1);
          setMarineData(prev => ({
            ...prev,
            stationId: sid,
            sst: finalSst,
            temp: `${finalSst}째C`,
            layers: { upper: finalSst, middle: null, lower: null },
            tide: { phase: '遺꾩꽍 以?, high: '15:20', low: '08:42' },
            tide_predictions: [{ time: '14:20', type: '怨좎“', level: 180 }]
          }));
        })
        .finally(() => { if (!cancelled) setLoading(false); }); // ??BUG-01 FIX

      const tidePromise = fetchTideForecast(sid, todayStr)
        .then(items => {
          if (!items || items.length === 0 || cancelled) return;
          const predictions = items.map(item => {
            const timeStr = item.predcDt ? item.predcDt.split(' ')[1] : (item.hl_time || item.tph_time || '');
            const typeStr = (item.extrSe === '1' || item.extrSe === '3' || item.hl_code === 'H') ? '怨좎“' : '媛꾩“';
            const levelVal = item.predcTdlvVl || item.hl_level || item.tph_level || '';
            return {
              tph_time: timeStr,
              hl_code: typeStr,
              tph_level: levelVal,
              time: timeStr,
              type: typeStr,
              level: levelVal,
            };
          });
          const highs = predictions.filter(p => p.type === '怨좎“').map(p => p.time).sort();
          const lows = predictions.filter(p => p.type === '媛꾩“').map(p => p.time).sort();

          if (!cancelled) setMarineData(prev => ({ // ??BUG-01 FIX
            ...prev,
            tide_predictions: predictions,
            tide: {
              ...(prev.tide || {}),
              phase: prev.tide?.phase || '議곗꽍 ?곗씠??,
              high: highs[0] || '-',
              high2: highs[1] || '-',
              low: lows[0] || '-',
              low2: lows[1] || '-',
            },
          }));
          if (!import.meta.env.PROD) console.info(`[BottomSheet] 議곗꽍?덈낫 ${predictions.length}嫄?濡쒕뱶 ?꾨즺`);
        })
        .catch(err => { if (!import.meta.env.PROD) console.warn('[BottomSheet] 議곗꽍?덈낫 ?ㅽ뙣:', err); });

      const waterTempPromise = fetchWaterTemp(sid, todayStr)
        .then(temp => {
          if (temp && temp !== '-' && !cancelled) { // ??BUG-01 FIX
            setMarineData(prev => ({ ...prev, waterTemp: temp, sst: temp }));
            if (!import.meta.env.PROD) console.info(`[BottomSheet] ?ㅼ륫 ?섏삩 ${temp}째C 濡쒕뱶 ?꾨즺`);
          }
        })
        .catch(err => { if (!import.meta.env.PROD) console.warn('[BottomSheet] ?섏삩 ?ㅽ뙣:', err); });

      const fishingIdxPromise = fetchFishingIndex(sid)
        .then(items => {
          if (!items || items.length === 0 || cancelled) return; // ??BUG-01 FIX
          const today = items[0];
          const gradeMap = { '1': '留ㅼ슦醫뗭쓬', '2': '醫뗭쓬', '3': '蹂댄넻', '4': '?섏겏', '5': '留ㅼ슦?섏겏' };
          const idx = today?.fishing_idx || today?.fishingIdx || '';
          const grade = today?.fishing_grade || gradeMap[idx] || idx;
          if (!cancelled) setMarineData(prev => ({ // ??BUG-01 FIX
            ...prev,
            fishingIndex: {
              ?깃툒: grade,
              ?섏삩: today?.wt ? `${today.wt}째C` : '-',
              ?뚭퀬: today?.wh ? `${parseFloat((parseFloat(today.wh) * 1.8).toFixed(1))}m` : '-',
              議곕쪟: today?.current_spd ? `${today.current_spd}m/s` : '-',
            },
          }));
          if (!import.meta.env.PROD) console.info(`[BottomSheet] ?싳떆吏??${grade} 濡쒕뱶 ?꾨즺`);
        })
        .catch(err => { if (!import.meta.env.PROD) console.warn('[BottomSheet] ?싳떆吏???ㅽ뙣:', err); });

      await Promise.allSettled([marinePromise, cctvPromise, shopPromise, tidePromise, waterTempPromise, fishingIdxPromise]);

      if (!cancelled) { // ??BUG-10 FIX: fire-and-forget 鍮꾩쫰?덉뒪 寃뚯떆臾?setState ?몃쭏?댄듃 ???몄텧 諛⑹?
        setBizLoading(true);
        const regionKey = (selectedPoint.region || '').split(' ')[0];
        apiClient.get(`/api/community/business?region=${encodeURIComponent(regionKey)}&limit=3`)
          .then(res => { if (!cancelled) setBusinessPosts(Array.isArray(res.data) ? res.data : []); }) // ??BUG-10 FIX
          .catch(() => { if (!cancelled) setBusinessPosts([]); }) // ??BUG-10 FIX
          .finally(() => { if (!cancelled) setBizLoading(false); }); // ??BUG-10 FIX
      }

      // 理쒖큹 濡쒕뵫 ?꾨즺 ??媛깆떊 ?쒓컖 湲곕줉 + 移댁슫?몃떎???쒖옉
      if (!cancelled) {
        setLastRefreshed(new Date());
        setNextRefreshIn(30 * 60);
      }
    };

    loadData();

    // ?? 30遺??먮룞 媛깆떊 ????????????????????????????????????????????????????
    const INTERVAL_MS = 30 * 60 * 1000; // 30遺?
    autoRefreshRef.current = setInterval(silentRefresh, INTERVAL_MS);

    // ?? 1珥?移댁슫?몃떎??????????????????????????????????????????????????????
    countdownRef.current = setInterval(() => {
      setNextRefreshIn(prev => (prev > 0 ? prev - 1 : 30 * 60));
    }, 1000);

    return () => {
      cancelled = true; // ??BUG-01 FIX: ?ъ씤???꾪솚 ??loadData ??紐⑤뱺 setState 諛⑹?
      clearInterval(autoRefreshRef.current);
      clearInterval(countdownRef.current);
    };
  }, [selectedPoint?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // ??3RD-B8: addToast??store ?⑥닔濡??덉젙????selectedPoint?.id留뚯쑝濡?deps ?쒗븳 ?덉쟾

  // ??3RD-B7: AI ?싳떆 而⑤뵒???곗궛 IIFE ??useMemo ??留??뚮뜑留덈떎 ?ш퀎??諛⑹?
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fishingCondition = useMemo(
    () => evaluateFishingCondition(marineData, selectedPoint),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [marineData, selectedPoint]
  );

  // ??SHARE-COND: 諛뷀??쒗듃 理쒖쥌 AI 而⑤뵒?섏쓣 ?덊솕硫닿낵 怨듭쑀 (硫섑듃 ?꾩쟾 ?숆린??
  useEffect(() => {
    if (fishingCondition && selectedPoint?.id && onConditionReady) {
      onConditionReady(fishingCondition, selectedPoint.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fishingCondition, selectedPoint?.id]);

  if (!selectedPoint) return null;

  return (
    <div style={{ padding: '0', backgroundColor: '#fff', borderRadius: '24px 24px 0 0', height: '100%' }}>
      {/* 諛뷀? ?쒗듃 ?リ린 X 踰꾪듉 - 吏곸젒 異붽???(UI ?꾩쟾?? */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: '900', color: '#1A1A2E' }}>
          {selectedPoint.name}
        </h2>
        {onClose && (
          <button onClick={onClose} style={{ background: '#F0F2F7', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold' }}>
            ??
          </button>
        )}
      </div>

      <div style={{ padding: '0 20px 100px' }}>

        {/* 狩?鍮꾨??ъ씤???꾩슜 ?⑷툑 ?뺣낫 諛뺤뒪 */}
        {selectedPoint.secret && (
          <div style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #1a1200, #2d1f00)', borderRadius: '20px', padding: '20px', border: '1.5px solid #B8860B', boxShadow: '0 0 24px rgba(255,215,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: `calc(20px * var(--fs, 1))` }}>狩?/span>
              <span style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: '#FFD700', letterSpacing: '0.04em' }}>鍮꾨??ъ씤???뺣낫</span>
              <span style={{ marginLeft: 'auto', fontSize: `calc(11px * var(--fs, 1))`, background: 'rgba(255,215,0,0.15)', color: '#FFD700', padding: '3px 10px', borderRadius: '20px', fontWeight: '800', border: '1px solid rgba(255,215,0,0.3)' }}>PREMIUM ONLY</span>
            </div>

            {/* 二쇱슂 ?댁쥌 */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#B8860B', fontWeight: '900', marginBottom: '8px' }}>?렍 二쇱슂 議고솴 ?댁쥌</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(selectedPoint.fish || '').split(',').map((f) => ( // ??17TH-B2: ?몃뜳??key ???댁쥌紐?key
                  <span key={f.trim()} style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', color: '#FFD700', background: 'rgba(255,215,0,0.12)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(255,215,0,0.25)' }}>
                    {f.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* 鍮꾨? ??*/}
            <div style={{ marginBottom: '14px', background: 'rgba(255,215,0,0.06)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,215,0,0.15)' }}>
              <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#B8860B', fontWeight: '900', marginBottom: '8px' }}>?뮕 ?꾩? 怨좎닔 ?ㅼ쟾 ??/div>
              <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#FFE066', fontWeight: '700', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{selectedPoint.tip}</div>
            </div>

            {/* ?묎렐 諛⑸쾿 */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#B8860B', fontWeight: '900', marginBottom: '6px' }}>?뿺截??묎렐 諛⑸쾿</div>
              <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#ccc', fontWeight: '700', lineHeight: '1.6' }}>{selectedPoint.access}</div>
            </div>
          </div>
        )}

        {/* 1. CCTV ?ㅼ떆媛?酉??곸뿭 (?몃씪??鍮꾨뵒???뚮뜑留?怨좊룄?? */}
        <div style={{ position: 'relative', height: '230px', backgroundColor: '#0A0A0F', borderRadius: '18px', overflow: 'hidden', marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
          
          {/* 留덉뒪???꾩슜 UI: CCTV ?뺣낫 ?섏젙 踰꾪듉 */}
          {isAdmin && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingCctv(!isEditingCctv);
                if (!isEditingCctv) {
                  // backend changes kbs_share to iframe, so we must check for iframe + digits
                  const isKbs = cctvData?.type === 'kbs_share' || ((cctvData?.type === 'hls' || cctvData?.type === 'iframe') && /^\d+$/.test(cctvData?.youtubeId || ''));
                  const initValue = isKbs
                    ? `https://d.kbs.co.kr/special/cctvShare?cctvId=${cctvData.youtubeId}` 
                    : (cctvData?.youtubeId || '');
                  setEditYoutubeId(initValue);
                }
              }}
              style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,215,0,0.9)', color: '#000', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', padding: '6px 10px', borderRadius: '8px', zIndex: 40, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
            >
              ?봽 {isEditingCctv ? '?섏젙 ?リ린' : `留덉뒪???몄쭛`}
            </button>
          )}

          {/* 留덉뒪???꾩슜 UI: ?낅젰 ???ㅻ쾭?덉씠 */}
          {isAdmin && isEditingCctv && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
              <div style={{ color: '#FFD700', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', marginBottom: '16px' }}>?썱 [{selectedPoint.name}] ?ㅼ떆媛??좏뒠釉?KBS ?곸긽 二쇱냼 援먯껜</div>
              <input 
                value={editYoutubeId}
                onChange={(e) => setEditYoutubeId(e.target.value)}
                placeholder="?좏뒠釉??먮뒗 KBS ?꾩껜 二쇱냼 ?낅젰"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #FFD700', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', marginBottom: '16px', textAlign: 'center', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button 
                  onClick={() => setIsEditingCctv(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '800' }}
                >
                  痍⑥냼
                </button>
                <button 
                  onClick={saveCctvOverride}
                  disabled={isSavingCctv}
                  style={{ flex: 2, padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #FFD700, #FFA000)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: '900', opacity: isSavingCctv ? 0.6 : 1 }}
                >
                  {isSavingCctv ? '?낅뜲?댄듃 以?..' : '利됱떆 ?곸슜 諛??ъ깮'}
                </button>
              </div>
            </div>
          )}



          {/* ?ㅼ젣 ?곸긽 / 肄섑뀗痢?*/}
          {cctvLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #FF3B30', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ color: '#fff', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800' }}>?뱻 ??곸뼱 ?꾩옣 ?곸긽 ?곌껐 以?..</div>
            </div>
          ) : cctvData ? (
             (cctvData.type === 'hls') && cctvData.url ? (
                <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: isCctvUnlocked ? 1 : 0, transition: 'opacity 0.3s' }}>
                    <ReactPlayer 
                      url={cctvData.url} 
                      playing={true} 
                      controls={true} 
                      muted={true}
                      width="100%" 
                      height="100%"
                      style={{ position: 'absolute', top: 0, left: 0 }}
                      config={{ 
                        file: { 
                          forceHLS: true,
                          attributes: { style: { width: '100%', height: '100%', objectFit: 'cover' } }
                        } 
                      }}
                    />
                  </div>
                  {!isCctvUnlocked && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
                      <div style={{ fontSize: `calc(32px * var(--fs, 1))`, marginBottom: '12px' }}>?뵏</div>
                      <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800', color: '#fff', marginBottom: '8px' }}>?ㅼ떆媛??곸긽??以鍮꾨릺?덉뒿?덈떎</div>
                      <button 
                        onClick={() => setShowRewardGate(true)}
                        style={{ background: 'linear-gradient(135deg, #0056D2, #0096FF)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '30px', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,86,210,0.4)' }}
                      >
                        ?벟 30珥?愿묎퀬 蹂닿퀬 ?ъ깮?섍린
                      </button>
                    </div>
                  )}
                </div>
             ) : (cctvData.type === 'youtube' || cctvData.type === 'iframe') && cctvData.url ? (
                <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
                  <iframe
                    src={cctvData.url}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', opacity: isCctvUnlocked ? 1 : 0, transition: 'opacity 0.3s' }}
                  />
                  {!isCctvUnlocked && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
                      <div style={{ fontSize: `calc(32px * var(--fs, 1))`, marginBottom: '12px' }}>?뵏</div>
                      <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800', color: '#fff', marginBottom: '8px' }}>?ㅼ떆媛??곸긽??以鍮꾨릺?덉뒿?덈떎</div>
                      <button 
                        onClick={() => setShowRewardGate(true)}
                        style={{ background: 'linear-gradient(135deg, #0056D2, #0096FF)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '30px', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,86,210,0.4)' }}
                      >
                        ?벟 30珥?愿묎퀬 蹂닿퀬 ?ъ깮?섍린
                      </button>
                    </div>
                  )}
                  {isCctvUnlocked && (
                    <button 
                      onClick={() => window.open(cctvData.type === 'youtube' ? `https://www.youtube.com/watch?v=${cctvData.youtubeId}` : cctvData.type === 'kbs_share' ? `https://d.kbs.co.kr/special/cctvShare?cctvId=${cctvData.youtubeId}` : cctvData.url, '_blank')}
                      style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(255,0,0,0.85)', color: '#fff', border: 'none', borderRadius: '20px', padding: '6px 12px', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}
                    >
                      {cctvData.type === 'youtube' ? (
                        <><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M10 15l5.19-3-5.19-3v6zm11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg>?깆쑝濡?蹂닿린</>
                      ) : (
                        <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>?먮낯 蹂닿린</>
                      )}
                    </button>
                  )}
                </div>
             ) : cctvData.type === 'fishinggo_placeholder' ? (
                <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0B1221', borderRadius: '18px', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, #1A2942 0%, #0B1221 100%)', opacity: 0.8 }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                    <div style={{ fontSize: `calc(48px * var(--fs, 1))`, marginBottom: '16px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>?렍</div>
                    <div style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '900', color: '#fff', marginBottom: '8px', letterSpacing: '-0.5px' }}>?ъ씤???꾩옣 ?곸긽 以鍮?以묒엯?덈떎</div>
                    <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#A0B0D0', fontWeight: '600' }}>媛??鍮좊Ⅸ ?쒖씪 ?댁뿉 ?곕룞???꾨즺?섍쿋?듬땲??/div>
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 16px 14px', background: 'linear-gradient(transparent, rgba(11,18,33,0.95))', zIndex: 6 }}>
                    <div style={{ color: '#00D1FF', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{color: '#ff4444'}}>??REC</span> ?싳떆GO ?꾩슜 紐⑤땲?곕쭅 ?쒖뒪??
                    </div>
                  </div>
                </div>
             ) : cctvData.fallbackImg ? (
                <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
                  <img 
                    src={cctvData.type === 'mof' ? `${API_BASE}${cctvData.fallbackImg}?t=${mofTimestamp}` : cctvData.fallbackImg} 
                    alt={cctvData.areaName} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isCctvUnlocked ? 1 : 0, transition: 'opacity 0.3s' }} 
                    onError={(e) => {
                      if (cctvData.safeFallbackImg && e.target.src !== cctvData.safeFallbackImg) {
                        e.target.src = cctvData.safeFallbackImg;
                      } else {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }
                    }}
                  />
                  {!isCctvUnlocked && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
                      <div style={{ fontSize: `calc(32px * var(--fs, 1))`, marginBottom: '12px' }}>?뵏</div>
                      <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '800', color: '#fff', marginBottom: '8px' }}>?ㅼ떆媛??곸긽??以鍮꾨릺?덉뒿?덈떎</div>
                      <button 
                        onClick={() => setShowRewardGate(true)}
                        style={{ background: 'linear-gradient(135deg, #0056D2, #0096FF)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '30px', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,86,210,0.4)' }}
                      >
                        ?벟 30珥?愿묎퀬 蹂닿퀬 ?ъ깮?섍린
                      </button>
                    </div>
                  )}
                  {isCctvUnlocked && (
                    <>
                      {/* MOF ?ㅼ떆媛??곗븞移⑥떇 紐⑤땲?곕쭅 ?뚰꽣留덊겕 ?덉씠?꾩썐 */}
                      <div style={{ position: 'absolute', bottom: '60px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 8px', color: '#fff', fontSize: `calc(13px * var(--fs, 1))`, fontFamily: 'monospace', textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)', fontWeight: 'bold', zIndex: 5 }}>
                        <span style={{color: '#ff4444'}}>??REC</span>
                        <span>MOF_{selectedPoint?.obsCode}</span>
                      </div>
                      
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '36px 16px 12px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', zIndex: 6 }}>
                        <div style={{ color: '#00D1FF', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ?뙄 ?댁뼇?섏궛遺 怨듭떇 ?ㅼ떆媛??곗븞 紐⑤땲?곕쭅
                        </div>
                        <div style={{ color: '#fff', fontSize: `calc(10px * var(--fs, 1))`, marginTop: '4px', fontWeight: '600', opacity: 0.8 }}>
                          ?꾩옣???뚭퀬 諛??곗븞移⑥떇 ?곹깭瑜??뚯븙?????덈뒗 ?댁뼇?섏궛遺 怨듭떇 酉곗뼱 ?쒖뒪?쒓낵 ?곕룞?섏뼱 ?덉뒿?덈떎.
                        </div>
                      </div>
                    </>
                  )}
                </div>
             ) : (
                <div style={{ color: '#888', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700' }}>?꾩옱 ?≪텧 媛?ν븳 ?곸긽???놁뒿?덈떎.</div>
             )
           ) : (
             // ??FIX: cctvData null = obsCode ?녾굅??no_cctv ??"以鍮?以? 硫붿떆吏 (?ㅻ쪟 ?꾨떂)
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
               <div style={{ fontSize: `calc(36px * var(--fs, 1))` }}>?렍</div>
               <div style={{ color: '#aaa', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700' }}>?대떦 ?ъ씤?몄쓽 ?곸긽??以鍮?以묒엯?덈떎</div>
             </div>
           )}

          {/* LIVE 諛곗? (怨좏꾨━?? */}
          <div style={{ position: 'absolute', top: '14px', left: '14px', background: 'rgba(230,0,0,0.95)', color: '#fff', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '950', padding: '5px 10px', borderRadius: '8px', zIndex: 5, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(230,0,0,0.5)' }}>
            <span style={{ display: 'inline-block', width: '5px', height: '5px', background: '#fff', borderRadius: '50%', marginRight: '6px', animation: 'pulse 1.2s infinite' }}></span>
            L I V E
          </div>
          
          {cctvData?.areaName && (
             <div style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', padding: '5px 10px', borderRadius: '8px', backdropFilter: 'blur(8px)', zIndex: 5, border: '1px solid rgba(255,255,255,0.1)' }}>
              ?뱧 {cctvData.areaName}
             </div>
          )}
        </div>


        {/* 2. API ?곗씠???뚮뜑留??곸뿭 */}
        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', border: '3px solid #1565C0', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: 'bold' }}>?댁뼇 ?곗씠?곕? 遺꾩꽍 以묒엯?덈떎...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* AI ?싳떆 而⑤뵒??(?됱젙???됯?) ??誘쇰Ъ ?ъ씤???쒖쇅 */}
            {selectedPoint?.type === '誘쇰Ъ' ? (
              /* 誘쇰Ъ ?ъ씤?? AI ?싳떆 而⑤뵒??쨌 ?먯닔 ?놁쓬 ?덈궡 */
              <div style={{ backgroundColor: '#F0FFF4', border: '2px solid #43A047', borderRadius: '20px', padding: '20px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: `calc(36px * var(--fs, 1))`, flexShrink: 0 }}>?뙼</span>
                <div>
                  <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '950', color: '#2E7D32', marginBottom: '6px' }}>誘쇰Ъ ?싳떆 ?ъ씤??/div>
                  <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '700', color: '#388E3C', lineHeight: 1.6 }}>
                    ?댁닔硫??ъ씤?몃뒗 ?댁뼇 湲곗긽 ?곗씠???섏삩쨌?뚭퀬쨌臾쇰븣)媛<br/>
                    ?곸슜?섏? ?딆븘 AI ?싳떆 ?먯닔瑜??쒓났?섏? ?딆뒿?덈떎.
                  </div>
                </div>
              </div>
            ) : (() => {
              const cond = fishingCondition; // ??3RD-B7: useMemo ?곗궛 寃곌낵 ?ъ슜
              return (
                <div style={{ backgroundColor: '#fff', border: `2px solid ${cond.color}`, borderRadius: '20px', padding: '20px', marginBottom: '10px', boxShadow: `0 8px 24px ${cond.color}20`, position: 'relative', overflow: 'hidden' }}>
                  {/* ?곷떒 ?ㅻ뜑 諛??먯닔 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '950', color: '#fff', background: cond.color, padding: '4px 12px', borderRadius: '30px', letterSpacing: '-0.02em', boxShadow: `0 2px 8px ${cond.color}40` }}>
                        AI ?싳떆 而⑤뵒??
                      </span>
                      {/* ??AUTO-REFRESH 諛곗?: 30遺??먮룞 媛깆떊 移댁슫?몃떎??*/}
                      {nextRefreshIn !== null && (
                        <span style={{ fontSize: `calc(9px * var(--fs, 1))`, fontWeight: '800', color: '#8E8E93', background: '#F2F2F7', padding: '3px 8px', borderRadius: '20px', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          ?봽 {Math.floor(nextRefreshIn / 60)}:{String(nextRefreshIn % 60).padStart(2, '0')} ??媛깆떊
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: `calc(38px * var(--fs, 1))`, fontWeight: '950', color: cond.color, lineHeight: 1, letterSpacing: '-0.05em' }}>{cond.score}<span style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '800' }}>??/span></span>
                  </div>

                  {/* ?됱젙??議곗뼵 ?띿뒪??*/}
                  <div style={{ fontSize: `calc(17px * var(--fs, 1))`, fontWeight: '900', color: '#1A1A2E', marginBottom: '18px', lineHeight: 1.5, letterSpacing: '-0.04em', whiteSpace: 'pre-line' }}>
                    "{cond.advice}"
                  </div>

                  {/* ?좊엫???쒓렇 由ъ뒪??*/}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {cond.tags.map((tag) => ( // ??17TH-B3: ?몃뜳??key ??tag 媛?key
                      <span key={tag} style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '800', color: cond.color, background: `${cond.color}10`, padding: '5px 10px', borderRadius: '10px', border: `1px solid ${cond.color}20` }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* ?됱젙???λ퉬 媛?대뱶 媛濡쒕컮 */}
                  <div style={{ backgroundColor: '#F8F9FC', padding: '14px', borderRadius: '16px', border: '1px solid #F0F2F7', display: 'flex', gap: '10px', alignItems: 'start' }}>
                    <div style={{ fontSize: `calc(20px * var(--fs, 1))`, flexShrink: 0 }}>?㎞</div>
                    <div>
                      <div style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', color: '#8E8E93', marginBottom: '3px' }}>?꾨Ц媛 沅뚯옣 梨꾨퉬</div>
                      <div style={{ fontSize: `calc(12.5px * var(--fs, 1))`, fontWeight: '800', color: '#1A1A2E', lineHeight: 1.4 }}>{cond.gear}</div>
                    </div>
                  </div>

                  {/* AI 而⑤뵒???ъ링 由ы룷??(PRO ?꾩슜) */}
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${cond.color}20` }}>
                    <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: cond.color, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ?쭬 AI ?ъ링 遺꾩꽍 由ы룷??
                    </div>
                    {canAccessPremium ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {cond.details && cond.details.map((detail, i) => (
                          <div key={i} style={{ background: '#F8F9FC', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '800' }}>{detail.factor}</span>
                              <span style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', color: detail.score > 0 ? '#00C48C' : detail.score < 0 ? '#FF3B30' : '#8E8E93' }}>
                                {detail.score > 0 ? `+${detail.score}` : detail.score}??
                              </span>
                            </div>
                            <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', color: '#1A1A2E' }}>{detail.text}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ background: 'linear-gradient(135deg, rgba(0,86,210,0.05), rgba(0,150,255,0.05))', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '1px solid rgba(0,86,210,0.1)' }}>
                        <div style={{ fontSize: `calc(24px * var(--fs, 1))`, marginBottom: '8px' }}>?뵏</div>
                        <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: '#1A1A2E', marginBottom: '4px' }}>?ъ링 遺꾩꽍? PRO 硫ㅻ쾭???꾩슜?낅땲??/div>
                        <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '700', marginBottom: '12px' }}>?띿냽, ?뚭퀬, ?섏삩???곕Ⅸ ?뺥솗???먯닔 利앷컧 ?먯씤???뺤씤?섏꽭??</div>
                        <button onClick={() => navigate('/subscribe')} style={{ background: 'linear-gradient(135deg, #0056D2, #003fa3)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer' }}>
                          PRO ?뚯븘蹂닿린
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ?쇳븨 ?꾩씠??異붿쿇 ?곸뿭 */}
                  {Array.isArray(shoppingItems) && shoppingItems.length > 0 && (
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', color: '#8E8E93', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ?썟 ???ъ씤??沅뚯옣 梨꾨퉬 ?쇳븨
                      </div>
                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
                         {shoppingItems.map((item, idx) => (
                          <div
                            key={item.productId || item.link || idx}
                            onClick={() => window.open(item.link || item.coupangUrl, '_blank')}
                            style={{ 
                              minWidth: '120px', width: '120px', 
                              backgroundColor: '#fff', borderRadius: '12px', padding: '8px',
                              boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #EBF2FF',
                              cursor: 'pointer', flexShrink: 0, transition: 'transform 0.15s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                          >
                            {/* ??FIELD-FIX: server L4344 諛섑솚 ?꾨뱶(img/name/price) ?ъ슜 ??productImage/productName? L4827 dead code ?꾨뱶 */}
                            <img
                              src={item.img || item.productImage}
                              alt={item.name || item.productName || '?싳떆?⑺뭹'}
                              style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }}
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }}
                            />
                            <div style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', color: '#1A1A2E', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.3, marginBottom: '6px', height: '26px' }}>
                              {item.name || item.productName}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '950', color: '#E65100' }}>
                                {item.price || `${(Number(item.productPrice) || 0).toLocaleString()}??}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ??誘쇰Ъ ?ъ씤?? ?섏삩 ?뺣낫 ?놁쓬 ?쒓린 */}
            {selectedPoint?.type === '誘쇰Ъ' || !selectedPoint?.obsCode ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F4F6FA', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontWeight: '800', color: '#555' }}>?꾩옱 ?ㅼ륫 ?섏삩</span>
                <span style={{ color: '#8E8E93', fontWeight: '800', fontSize: `calc(13px * var(--fs, 1))` }}>誘쇰Ъ ?ъ씤??濡??섏삩 ?뺣낫 ?놁쓬</span>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#F4F6FA', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontWeight: '800', color: '#555' }}>?꾩옱 ?ㅼ륫 ?섏삩</span>
                <span style={{ color: '#0056D2', fontWeight: '900', fontSize: `calc(18px * var(--fs, 1))` }}>{marineData.sst || marineData.waterTemp || '-'}째C</span>
              </div>
            )}

            {/* ??誘쇰Ъ ?ъ씤?? 痢듬퀎 ?섏삩 ?놁쓬 ?쒓린 */}
            {selectedPoint?.type === '誘쇰Ъ' || !selectedPoint?.obsCode ? (
              <div style={{ backgroundColor: '#F4F6FA', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontWeight: '900', display: 'block', marginBottom: '8px', color: '#333' }}>痢듬퀎 ?섏삩 ?뺣낫 (??以??)</span>
                <div style={{ textAlign: 'center', color: '#8E8E93', fontWeight: '800', fontSize: `calc(13px * var(--fs, 1))`, padding: '8px 0' }}>誘쇰Ъ ?ъ씤?몃줈 ?댁닔 ?섏삩 ?뺣낫 ?놁쓬</div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#F4F6FA', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontWeight: '900', display: 'block', marginBottom: '12px', color: '#333' }}>痢듬퀎 ?섏삩 ?뺣낫 (??以??)</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { label: '?쒖링', val: marineData.layers?.upper || marineData.sst || marineData.waterTemp || '-', color: '#64B5F6' },
                    { label: '以묒링', val: marineData.layers?.middle ? marineData.layers.middle : '諛섏쁺以?, color: '#42A5F5' },
                    { label: '?痢?, val: marineData.layers?.lower ? marineData.layers.lower : '諛섏쁺以?, color: '#1E88E5' },
                  ].map(l => (
                    <div key={l.label} style={{ flex: 1, backgroundColor: '#fff', padding: '10px 6px', borderRadius: '10px', textAlign: 'center', border: '1.5px solid #F0F2F7' }}>
                      <div style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', color: '#8E8E93', marginBottom: '4px' }}>{l.label}</div>
                      <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '950', color: l.color }}>{l.val !== '-' && l.val !== '諛섏쁺以? ? `${l.val}째C` : l.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ??誘쇰Ъ ?ъ씤?? 臾쇰븣 ?뺣낫 ?놁쓬 ?쒓린 */}
            {selectedPoint?.type === '誘쇰Ъ' || !selectedPoint?.obsCode ? (
              <div style={{ backgroundColor: '#F4F6FA', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontWeight: '900', display: 'block', marginBottom: '8px', color: '#333' }}>?ㅻ뒛??臾쇰븣 (留뚯“/媛꾩“)</span>
                <div style={{ textAlign: 'center', color: '#8E8E93', fontWeight: '800', fontSize: `calc(13px * var(--fs, 1))`, padding: '8px 0' }}>誘쇰Ъ ?ъ씤?몃줈 議곗꽍 ?뺣낫 ?놁쓬</div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#F4F6FA', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontWeight: '900', display: 'block', marginBottom: '12px', color: '#333' }}>?ㅻ뒛??臾쇰븣 (留뚯“/媛꾩“)</span>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.95rem', color: '#555' }}>
                {marineData.tide && (marineData.tide.phase || marineData.tide_predictions) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '4px' }}>
                      {marineData.tide.phase || '議곗꽍 遺꾩꽍 以?}
                    </div>
                    {/* ?덉륫 ?곗씠??由ъ뒪?멸? ?덈뒗 寃쎌슦 ?쒖떆 */}
                    {marineData.tide_predictions && marineData.tide_predictions.slice(0, 4).map((t, idx) => (
                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: `calc(13px * var(--fs, 1))` }}>
                        <span style={{ fontWeight: '700' }}>{t.tph_time || t.time}</span>
                        <span style={{ color: (t.hl_code || t.type) === '怨좎“' ? '#E65100' : '#1565C0', fontWeight: '800' }}>
                          {(t.hl_code || t.type) === '怨좎“' ? '??留뚯“' : '??媛꾩“'} : {t.tph_level || t.level}cm
                        </span>
                      </li>
                    ))}
                  </div>
                ) : (
                  <li style={{ color: '#888', fontSize: `calc(13px * var(--fs, 1))` }}>?꾩옣 臾쇰븣 ?곗씠?곕? ?ㅼ떆媛?遺꾩꽍 以묒엯?덈떎.</li>
                )}
              </ul>
            </div>
            )}{/* ??誘쇰Ъ else ?リ린 */}

            {/* ?싳떆吏????誘쇰Ъ ?ъ씤???쒖쇅 */}
            {marineData.fishingIndex && (selectedPoint?.type !== '誘쇰Ъ' && selectedPoint?.obsCode) && (
              <div style={{ backgroundColor: '#F4F6FA', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontWeight: '900', display: 'block', marginBottom: '8px', color: '#333' }}>諛붾떎 ?싳떆吏??/span>
                {/* ??3RD-A4: JSON.stringify raw ?쒓굅 ??key:value ?쇰컲???쒖떆 */}
                <div style={{ fontSize: '0.9rem', color: '#555', lineHeight: 1.6 }}>
                  {typeof marineData.fishingIndex === 'object'
                    ? Object.entries(marineData.fishingIndex).map(([k, v]) => `${k}: ${v}`).join(' 쨌 ')
                    : String(marineData.fishingIndex)}
                </div>
              </div>
            )}

            {/* 3. B2B 濡쒖뺄 ?낆젏 留ㅼ옣 愿묎퀬 (吏???꾩튂 湲곕컲 ?몃Ⅸ?먯쐞 愿묎퀬 吏硫? */}
            {/* ??25TH-B3: /api/ads/local?stationId= ??API ?곕룞 ?꾧퉴吏 ?붾? ?뚮젅?댁뒪????④? 泥섎━ (3RD-C8 TODO)
                           ?ㅼ젣 ?쒗쑕 API ?곕룞 ?꾨즺 ???꾨옒 false ??localAd 議곌굔?쇰줈 援먯껜 */}
            {/* eslint-disable-next-line no-constant-condition */}
            {false ? (
              <div style={{ marginTop: '8px', backgroundColor: '#FFF4E5', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', border: '1px solid #FFE0B2', boxShadow: '0 4px 10px rgba(255, 152, 0, 0.1)' }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: '#FFB74D', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `calc(24px * var(--fs, 1))`, flexShrink: 0 }}>
                  ?룷
                </div>
                <div>
                  <span style={{ fontSize: `calc(10px * var(--fs, 1))`, color: '#E65100', fontWeight: '900', background: '#FFE0B2', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px', display: 'inline-block' }}>濡쒖뺄 ?쒗쑕 ?좎씤</span>
                  <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '900', color: '#E65100', marginBottom: '2px' }}>{selectedPoint.name} ?꾨낫 3遺? 吏???싳떆留덊듃</div>
                  <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#F57C00', fontWeight: '800' }}>?댁븘?덈뒗 誘몃겮 諛?媛곹겕由?10% ?⑤룆?좎씤 荑좏룿!</div>
                </div>
              </div>
            ) : null}

            {/* ?? VIP ?좎긽諛??띾낫 ?뱀뀡 ?? */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: `calc(18px * var(--fs, 1))` }}>?슓</span>
                  <span style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '950', color: '#1A1A2E', letterSpacing: '-0.03em' }}>??援ъ뿭 ?좎긽諛??덉빟</span>
                  {selectedPoint.region && (
                    <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', background: '#EBF2FF', color: '#1565C0', padding: '3px 8px', borderRadius: '20px' }}>
                      {(selectedPoint.region || '').split(' ')[0]}
                    </span>
                  )}
                </div>
                <button onClick={() => navigate('/community')} style={{ background: 'none', border: 'none', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '800', color: '#8E8E93', cursor: 'pointer' }}>
                  ?꾩껜蹂닿린 ??
                </button>
              </div>

              {bizLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '10px' }}>
                  <div style={{ width: '20px', height: '20px', border: '2.5px solid #1565C0', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '700' }}>?좎긽諛??뺣낫 遺덈윭?ㅻ뒗 以?..</span>
                </div>
              ) : businessPosts.length === 0 ? (
                <div style={{ background: 'linear-gradient(135deg, #F8F9FC, #F0F4FF)', borderRadius: '16px', padding: '24px', textAlign: 'center', border: '1.5px dashed #D0D8F0' }}>
                  <div style={{ fontSize: `calc(28px * var(--fs, 1))`, marginBottom: '8px' }}>??/div>
                  <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '800', color: '#8E8E93' }}>??援ъ뿭 ?깅줉???좎긽諛곌? ?놁뒿?덈떎</div>
                  <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#AAB0BE', fontWeight: '600', marginTop: '4px' }}>VVIP 援щ룆 ?????좎긽???깅줉?대낫?몄슂!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {businessPosts.map((biz, idx) => (
                    <div
                      key={String(biz._id || biz.id || idx)}
                      style={{
                        position: 'relative',
                        background: biz.isPinned ? 'linear-gradient(135deg, #1a1200 0%, #2d1f00 50%, #1a1200 100%)' : '#fff',
                        border: biz.isPinned ? '1.5px solid #B8860B' : '1.5px solid #F0F2F7',
                        borderRadius: '18px', padding: '16px',
                        boxShadow: biz.isPinned ? '0 8px 28px rgba(255,215,0,0.18)' : '0 4px 16px rgba(0,0,0,0.05)',
                        overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.18s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                      onClick={() => navigate('/community')}
                    >
                      {biz.isPinned && (
                        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(255,215,0,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        {biz.isPinned ? (
                          <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', background: 'linear-gradient(135deg, #FFD700, #FFA000)', color: '#000', padding: '3px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }}>
                            ?몣 VVIP ?묐젰 ?좎긽
                          </span>
                        ) : (
                          <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', background: '#EBF2FF', color: '#1565C0', padding: '3px 10px', borderRadius: '20px' }}>
                            ?슓 ?좎긽諛??띾낫
                          </span>
                        )}
                        {biz.region && (
                          <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '700', color: biz.isPinned ? '#FFD700' : '#8E8E93' }}>
                            ?뱧 {biz.region}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        {biz.cover ? (
                          <img src={biz.cover} alt={biz.shipName}
                            style={{ width: '72px', height: '72px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0, border: biz.isPinned ? '2px solid #B8860B' : '1px solid #F0F2F7' }}
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{ width: '72px', height: '72px', borderRadius: '12px', flexShrink: 0, background: biz.isPinned ? 'rgba(255,215,0,0.12)' : '#F4F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `calc(28px * var(--fs, 1))`, border: biz.isPinned ? '2px solid rgba(255,215,0,0.3)' : '1.5px solid #F0F2F7' }}>
                            ??
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '950', color: biz.isPinned ? '#FFE066' : '#1A1A2E', marginBottom: '4px', letterSpacing: '-0.03em' }}>
                            {biz.shipName}
                          </div>
                          <div style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '700', color: biz.isPinned ? '#B8860B' : '#8E8E93', marginBottom: '8px' }}>
                            {biz.type} 쨌 {biz.target}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            {biz.date && (
                              <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', background: biz.isPinned ? 'rgba(255,215,0,0.12)' : '#F4F6FA', color: biz.isPinned ? '#FFD700' : '#555', padding: '3px 8px', borderRadius: '8px' }}>
                                ?뱟 {biz.date}
                              </span>
                            )}
                            {biz.price && (
                              <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', background: biz.isPinned ? 'rgba(255,165,0,0.15)' : '#FFF4E5', color: biz.isPinned ? '#FFA500' : '#E65100', padding: '3px 8px', borderRadius: '8px' }}>
                                ?뮥 {typeof biz.price === 'number' ? `${biz.price.toLocaleString()}?? : biz.price}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {biz.content && (
                        <div style={{ marginTop: '10px', fontSize: `calc(12px * var(--fs, 1))`, color: biz.isPinned ? 'rgba(255,230,100,0.8)' : '#666', fontWeight: '600', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {biz.content}
                        </div>
                      )}
                      {biz.phone && (
                        <div
                          onClick={e => {
                            e.stopPropagation();
                            window.location.href = `sms:${biz.phone.replace(/-/g,'')}?body=${encodeURIComponent(`[?싳떆GO] ${biz.shipName} ?좎긽 ?덉빟 臾몄쓽?⑸땲??`)}`;
                          }}
                          style={{
                            marginTop: '12px',
                            background: biz.isPinned ? 'linear-gradient(135deg, #FFD700, #FFA000)' : 'linear-gradient(135deg, #1565C0, #0D47A1)',
                            color: biz.isPinned ? '#000' : '#fff',
                            borderRadius: '12px', padding: '10px 0',
                            textAlign: 'center', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '950',
                            cursor: 'pointer', letterSpacing: '-0.02em',
                            boxShadow: biz.isPinned ? '0 4px 16px rgba(255,215,0,0.35)' : '0 4px 16px rgba(21,101,192,0.3)',
                          }}
                        >
                          ?벒 {biz.phone} 쨌 臾몄옄濡??덉빟?섍린
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ??ADMOB-NATIVE: VIP ?좎긽諛??몄뀡 ?꾨옒 ?ㅼ씠?곕툕愿묎퀬 (??AdSense ?명뵾?쒗삎) */}
            <NativeAd style={{ marginTop: '4px', marginBottom: '0' }} />

            {/* ??CATCH-ENH: 議곌낵 湲곕줉 ?④린湲?踰꾪듉 */}
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #F0F0F5' }}>
              <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '950', color: '#1c1c1e', marginBottom: '10px' }}>
                ?렍 ???ъ씤?몄뿉???≪쑝?⑤굹??
              </div>
              <button
                onClick={() => {
                  if (!user || user.email === 'guest@fishinggo.com') {
                    addToast('議곌낵 湲곕줉? 濡쒓렇?????댁슜 媛?ν빀?덈떎.', 'error');
                    navigate('/login');
                    return;
                  }
                  setShowCatchModal(true);
                }}
                style={{
                  width: '100%', padding: '15px',
                  background: 'linear-gradient(135deg, #00C48C, #00897B)',
                  color: '#fff', border: 'none', borderRadius: '16px',
                  fontWeight: '950', fontSize: `calc(15px * var(--fs, 1))`, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 6px 20px rgba(0,196,140,0.35)',
                  letterSpacing: '-0.02em',
                }}
              >
                <span style={{ fontSize: `calc(18px * var(--fs, 1))` }}>?렍</span>
                議곌낵 湲곕줉 ?④린湲?
              </button>
              <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '600', textAlign: 'center', marginTop: '8px' }}>
                湲곕줉? 留덉씠?섏씠吏 議곌낵?듦퀎???먮룞 諛섏쁺?⑸땲??
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ??CATCH-ENH: 議곌낵 湲곕줉 ?묒꽦 紐⑤떖 */}
      {showCatchModal && (
        <CatchRecordModal
          point={selectedPoint}
          user={user}
          onClose={() => setShowCatchModal(false)}
          onSuccess={() => { /* ??????좎뒪?몃뒗 紐⑤떖 ?대??먯꽌 ?쒖떆 */ }}
        />
      )}

      {/* ?? CCTV 蹂댁긽??愿묎퀬 寃뚯씠???? */}
      <RewardGateModal
        isOpen={showRewardGate}
        context="cctv"
        onClose={() => setShowRewardGate(false)}
        onRewardComplete={() => {
          setShowRewardGate(false);
          setIsCctvUnlocked(true);
        }}
        onSubscribe={() => {
          setShowRewardGate(false);
          setShowUpgradeModal(true);
        }}
      />
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
    </div>
  );
}
