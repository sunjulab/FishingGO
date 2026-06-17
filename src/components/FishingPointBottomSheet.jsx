import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import apiClient from '../api/index';
import { evaluateFishingCondition } from '../utils/evaluator';
import { useNavigate } from 'react-router-dom';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import { NativeAd } from './AdUnit';

import { Capacitor } from '@capacitor/core';
// ✅ TIDE-API: 공공데이터포털 해양 3종 API
import { fetchTideForecast, fetchWaterTemp, fetchFishingIndex } from '../api/marineApi';

// ENH3-B5: 환경변수는 불변 — 컴포넌트 외부 상수로 분리
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ✅ 7TH-B4: extractYoutubeId 컴포넌트 외부 추출 — saveCctvOverride 호출마다 재정의 제거
const YOUTUBE_REGEXP = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
function extractYoutubeId(str) {
  const match = str.match(YOUTUBE_REGEXP);
  return (match && match[2].length === 11) ? match[2] : str;
}

// 🎣 조과 기록 입력 모달 (FishingPointBottomSheet 전용)
function CatchRecordModal({ point, user, onClose, onSuccess }) {
  const addToast = useToastStore(s => s.addToast);
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    fish: (point?.fish || '').split(',')[0].trim(),
    size: '', weight: '', bait: '', weather: '', wind: '', wave: '', memo: '', image: null,
    date: new Date().toISOString().split('T')[0],
    shareToBoard: false, // ✅ SHARE-OPT: 오픈게시판 동시 공유 옵션
  });
  const [submitting, setSubmitting] = useState(false);

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { fileToCompressedBase64 } = await import('../utils/imageUtils');
      const b64 = await fileToCompressedBase64(file);
      setForm(p => ({ ...p, image: b64 }));
    } catch { addToast('이미지 처리 실패', 'error'); }
  };

  const handleSubmit = async () => {
    if (!form.fish.trim()) { addToast('어종을 입력해주세요.', 'error'); return; }
    setSubmitting(true);
    try {
      // ① 조과 기록 저장
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

      // ② 오픈게시판 동시 공유 (옵션 체크 시)
      if (form.shareToBoard) {
        const sizeStr  = form.size   ? `${form.size}cm`    : '';
        const weightStr = form.weight ? `${form.weight}kg` : '';
        const specLine = [sizeStr, weightStr].filter(Boolean).join(' / ');
        const weatherLine = [form.weather, form.wind && `풍속 ${form.wind}`, form.wave && `파고 ${form.wave}`].filter(Boolean).join(' · ');
        const boardContent =
          `🌊 [조과 공유] ${point?.name || ''} — ${form.date}\n` +
          `🐟 어종: ${form.fish.trim()}` + (specLine ? `  ${specLine}` : '') + '\n' +
          (form.bait    ? `🎯 미끼/루어: ${form.bait}\n`   : '') +
          (weatherLine  ? `🌤 날씨: ${weatherLine}\n`       : '') +
          (form.memo    ? `\n💬 ${form.memo}` : '');
        await apiClient.post('/api/community/posts', {
          author: user?.name || 'anonymous', // ✅ BUG-05 FIX: user null 가드
          author_email: user?.email || '',    // ✅ BUG-05 FIX: user null 가드
          category: '조황 공유',
          content: boardContent.trim(),
          image: form.image || null,
        });
        addToast('🌊 조과 기록 + 🐟 낚시그램 동시 등록 완료!', 'success');
      } else {
        addToast('🎣 조과 기록이 저장되었습니다!', 'success');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || '저장 실패. 다시 시도해주세요.', 'error');
    } finally { setSubmitting(false); }
  };

  const WEATHER_OPTIONS = ['맑음', '흐림', '비', '강풍', '안개'];
  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '28px 28px 0 0', padding: '28px 20px 48px', width: '100%', maxWidth: '480px', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ width: '40px', height: '4px', background: '#E5E5EA', borderRadius: '2px', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '950', color: '#1c1c1e' }}>🎣 조과 기록 남기기</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: `calc(22px * var(--fs, 1))`, cursor: 'pointer', color: '#8E8E93' }}>✕</button>
        </div>
        <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '600', marginBottom: '20px' }}>
          📍 {point?.name} · 기록은 마이페이지 조과통계에 반영됩니다
        </div>

        {/* 사진 업로드 */}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
        <div onClick={() => fileRef.current?.click()} style={{ width: '100%', height: '140px', background: '#F8F9FA', borderRadius: '16px', border: '2px dashed #D1D1D6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '16px', overflow: 'hidden' }}>
          {form.image
            ? <img src={form.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
            : <div style={{ textAlign: 'center', color: '#8E8E93' }}>
                <div style={{ fontSize: `calc(28px * var(--fs, 1))`, marginBottom: '6px' }}>📷</div>
                <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '700' }}>사진 추가 (선택)</div>
              </div>
          }
        </div>

        {/* 어종 */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', color: '#444', marginBottom: '6px' }}>어종 *</div>
          <input value={form.fish} onChange={e => set('fish', e.target.value)} placeholder="예: 감성돔" style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: `calc(14px * var(--fs, 1))`, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* 사이즈 / 무게 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', color: '#444', marginBottom: '6px' }}>사이즈 (cm)</div>
            <input value={form.size} onChange={e => set('size', e.target.value)} placeholder="예: 45" type="number" style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: `calc(14px * var(--fs, 1))`, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', color: '#444', marginBottom: '6px' }}>무게 (kg)</div>
            <input value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="예: 2.3" type="number" step="0.1" style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: `calc(14px * var(--fs, 1))`, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* 미끼 */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', color: '#444', marginBottom: '6px' }}>미끼/루어</div>
          <input value={form.bait} onChange={e => set('bait', e.target.value)} placeholder="예: 크릴, 갯지렁이, 타이라바" style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: `calc(14px * var(--fs, 1))`, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* 날씨 선택 */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', color: '#444', marginBottom: '8px' }}>날씨</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {WEATHER_OPTIONS.map(w => (
              <button key={w} onClick={() => set('weather', form.weather === w ? '' : w)}
                style={{ padding: '7px 14px', borderRadius: '20px', border: form.weather === w ? '2px solid #0056D2' : '1.5px solid #E5E5EA', background: form.weather === w ? '#EBF5FF' : '#fff', color: form.weather === w ? '#0056D2' : '#555', fontWeight: '800', fontSize: `calc(12px * var(--fs, 1))`, cursor: 'pointer' }}>
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* 날짜 */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', color: '#444', marginBottom: '6px' }}>출조 날짜</div>
          <input value={form.date} onChange={e => set('date', e.target.value)} type="date" style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: `calc(14px * var(--fs, 1))`, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* 메모 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', color: '#444', marginBottom: '6px' }}>한마디 메모</div>
          <textarea value={form.memo} onChange={e => set('memo', e.target.value)} placeholder="예: 새벽 4시 물때 맞춰 대박! 다음엔 타이라바 도전" rows={3} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E5E5EA', fontSize: `calc(14px * var(--fs, 1))`, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>

        {/* ✅ SHARE-OPT: 오픈게시판 동시 공유 체크 옵션 */}
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
          {/* 커스텀 체크박스 */}
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
              🌊 낚시그램에도 공유하기
            </div>
            <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#8E8E93', marginTop: '2px', fontWeight: '600' }}>
              체크 시 조과 내용이 낚시그램 '조황 공유' 카테고리에 자동 등록됩니다
            </div>
          </div>
          <span style={{ fontSize: `calc(18px * var(--fs, 1))` }}>{form.shareToBoard ? '🌊' : '🔒'}</span>
        </div>

        <button onClick={handleSubmit} disabled={submitting}
          style={{ width: '100%', padding: '16px', background: submitting ? '#ccc' : 'linear-gradient(135deg, #0056D2, #0096FF)', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '950', fontSize: `calc(15px * var(--fs, 1))`, cursor: submitting ? 'not-allowed' : 'pointer', letterSpacing: '-0.02em' }}>
          {submitting ? '저장 중...' : form.shareToBoard ? '🌊 기록 저장 + 게시판 공유' : '🎣 조과 기록 저장하기'}
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
  // ✅ FIX-CCTV: isAdmin(MASTER tier 포함) → canAccessPremium에 MASTER tier 명시적 추가
  const canAccessPremium = useMemo(() => {
    if (user?.id === ADMIN_ID || user?.email === ADMIN_EMAIL || user?.email === ADMIN_ID) return true;
    return ['BUSINESS_LITE', 'PRO', 'BUSINESS_VIP', 'MASTER'].includes(userTier);
  }, [userTier, user?.id, user?.email]); // eslint-disable-line react-hooks/exhaustive-deps
  // ✅ 7TH-A3: isAdmin 직접 비교 — ADMIN_ID/ADMIN_EMAIL/MASTER tier 4중 보장
  const isAdmin = useUserStore(s =>
    s.user?.id === ADMIN_ID ||
    s.user?.email === ADMIN_EMAIL ||
    s.user?.email === ADMIN_ID ||
    s.userTier === 'MASTER'
  );
  const addToast = useToastStore(state => state.addToast);
  // ENH3-B5: 모듈 레벨 API_BASE 상수 사용
  // isEditingCctv: CCTV 수정 UI 상태 (아래 useState로 관리)


  const [isEditingCctv, setIsEditingCctv] = useState(false);
  const [editYoutubeId, setEditYoutubeId] = useState('');
  const [isSavingCctv, setIsSavingCctv] = useState(false);
  const [showCatchModal, setShowCatchModal] = useState(false);



  // 실시간 연속 재생(스트리밍) 효과를 위한 타임스탬프
  const [mofTimestamp, setMofTimestamp] = useState(Date.now());
  useEffect(() => {
    if (cctvData?.type !== 'mof') return;
    const interval = setInterval(() => {
      setMofTimestamp(Date.now());
    }, 1500); // 연안포털 규격에 맞춰 1.5초마다 새 프레임 호출
    return () => clearInterval(interval);
  }, [cctvData?.type]);

  // ✅ 17TH-B1: saveCctvOverride useCallback 적용 — editYoutubeId/selectedPoint/cctvData stale closure 위험 제거
  const saveCctvOverride = useCallback(async () => {
    if (!editYoutubeId.trim()) return;

    const trimmedInput = editYoutubeId.trim();
    const isYoutube = /youtu\.be|youtube\.com|v\/|embed\//.test(trimmedInput);
    const finalType = isYoutube ? 'youtube' : 'iframe';
    const finalYoutubeId = isYoutube ? extractYoutubeId(trimmedInput) : trimmedInput;

    const sid = selectedPoint.obsCode || 'DT_0001';
    const cctvOverrideId = selectedPoint.id ? `point_${selectedPoint.id}` : sid;
    try {
      setIsSavingCctv(true);
      const res = await apiClient.put(`/api/admin/cctv/${cctvOverrideId}`, {
        type: finalType,
        youtubeId: finalYoutubeId,
        label: cctvData?.label || `${selectedPoint.name} 수동업데이트` // ✅ 7TH-C4: 한글 직접 표기
      });
      if (res.data.success) {
        addToast('✅ CCTV 링크가 정상적으로 수정되었습니다.', 'success'); // ✅ 7TH-C4: 한글 직접 표기
        setIsEditingCctv(false);
        // 수정한 링크로 즉시 다시 로드
        setCctvLoading(true);
        const cctvResp = await apiClient.get(`/api/weather/cctv?stationId=${sid}&pointId=point_${selectedPoint.id || ''}`);
        setCctvData(cctvResp.data);
      } else {
        addToast(res.data.error || '수정에 실패했습니다.', 'error'); // ✅ 7TH-C4: 한글 직접 표기
      }
    } catch (err) {
      addToast('수정 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSavingCctv(false);
      setCctvLoading(false);
    }
  }, [editYoutubeId, selectedPoint, cctvData, addToast]); // ✅ 17TH-B1: 모든 클로저 변수 deps 적시

  // ✅ AUTO-REFRESH: 날씨·수온·물때 30분 자동 갱신 (silent — 로딩 스피너 없이 백그라운드 새로고침)
  const [lastRefreshed, setLastRefreshed] = useState(null);      // 마지막 갱신 시각
  const [nextRefreshIn, setNextRefreshIn] = useState(null);      // 다음 갱신까지 남은 초
  const autoRefreshRef = useRef(null);                           // setInterval ref (cleanup용)
  const countdownRef  = useRef(null);                            // 1초 카운트다운 ref

  useEffect(() => {
    if (!selectedPoint) return;

    // ── 날씨 전용 silent 갱신 (CCTV·쇼핑 제외 — 불필요한 API 호출 방지) ──
    const silentRefresh = async () => {
      const sid = selectedPoint.obsCode || 'DT_0001';
      const todayStr = (() => {
        const d = new Date();
        return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
      })();
      try {
        const [marine, tideItems, temp, fishIdx] = await Promise.allSettled([
          apiClient.get(`/api/weather/precision?stationId=${sid}`),
          fetchTideForecast(sid, todayStr),
          fetchWaterTemp(sid, todayStr),
          fetchFishingIndex(sid),
        ]);
        // 기상 데이터
        if (marine.status === 'fulfilled') {
          setMarineData(prev => ({ ...prev, ...marine.value.data, stationId: sid }));
        }
        // 조석예보
        if (tideItems.status === 'fulfilled' && tideItems.value?.length) {
          const predictions = tideItems.value.map(item => ({
            tph_time: item.hl_time || item.tph_time || '',
            hl_code: item.hl_code === 'H' ? '고조' : '간조',
            tph_level: item.hl_level || item.tph_level || '',
            time: item.hl_time || '',
            type: item.hl_code === 'H' ? '고조' : '간조',
            level: item.hl_level || '',
          }));
          setMarineData(prev => ({
            ...prev,
            tide_predictions: predictions,
            tide: {
              ...(prev.tide || {}),
              high: predictions.find(p => p.hl_code === '고조')?.tph_time || prev.tide?.high || '-',
              low:  predictions.find(p => p.hl_code === '간조')?.tph_time || prev.tide?.low  || '-',
            },
          }));
        }
        // 수온
        if (temp.status === 'fulfilled' && temp.value && temp.value !== '-') {
          setMarineData(prev => ({ ...prev, waterTemp: temp.value, sst: temp.value }));
        }
        // 낚시지수
        if (fishIdx.status === 'fulfilled' && fishIdx.value?.length) {
          const today = fishIdx.value[0];
          const gradeMap = { '1': '매우좋음', '2': '좋음', '3': '보통', '4': '나쁨', '5': '매우나쁨' };
          const grade = today?.fishing_grade || gradeMap[today?.fishing_idx || today?.fishingIdx] || '';
          if (grade) setMarineData(prev => ({
            ...prev,
            fishingIndex: {
              등급: grade,
              수온: today?.wt ? `${today.wt}°C` : '-',
              파고: today?.wh ? `${today.wh}m` : '-',
              조류: today?.current_spd ? `${today.current_spd}m/s` : '-',
            },
          }));
        }
        setLastRefreshed(new Date());
        setNextRefreshIn(30 * 60); // 카운트다운 리셋
        if (!import.meta.env.PROD) console.info('[AutoRefresh] 30분 자동 갱신 완료');
      } catch (e) {
        if (!import.meta.env.PROD) console.warn('[AutoRefresh] 갱신 실패:', e);
      }
    };

    // ── 최초 로딩 (전체 로딩 — CCTV·쇼핑 포함) ──────────────────────────
    let cancelled = false; // ✅ BUG-01 FIX: 포인트 전환 시 이전 요청 취소용 플래그
    const loadData = async () => {
      setLoading(true);
      setCctvLoading(true);
      const sid = selectedPoint.obsCode || 'DT_0001';

      const todayStr = (() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}${m}${day}`;
      })();

      const cctvPromise = apiClient.get(`/api/weather/cctv?stationId=${sid}&pointId=point_${selectedPoint.id || ''}`)
        .then(res => { if (!cancelled) setCctvData(res.data); }) // ✅ BUG-01 FIX
        .catch(err => { if (!import.meta.env.PROD) console.error('CCTV Load Error:', err); })
        .finally(() => { if (!cancelled) setCctvLoading(false); }); // ✅ BUG-01 FIX

      const fish = selectedPoint.fish ? selectedPoint.fish.split(',')[0].trim() : '';
      const pointType = selectedPoint.region || '바다';
      const shopPromise = apiClient.get(
        `/api/shop/recommend?pointType=${encodeURIComponent(pointType)}&fish=${encodeURIComponent(fish)}`
      ).then(res => {
        const items = res.data?.products?.slice(0, 3) || [];
        if (items.length > 0 && !cancelled) setShoppingItems(items); // ✅ BUG-01 FIX
      }).catch(err => { if (!import.meta.env.PROD) console.error('Shop Load Error:', err); });

      const marinePromise = apiClient.get(`/api/weather/precision?stationId=${sid}`)
        .then(resp => {
          if (!cancelled) setMarineData(prev => ({ ...prev, ...resp.data, stationId: sid })); // ✅ BUG-01 FIX
        })
        .catch(err => {
          if (!import.meta.env.PROD) console.error('Data Load Error:', err);
          if (cancelled) return;
          const reg = selectedPoint.region || '남해';
          const profile = { '제주': 18.2, '남해': 16.5, '동해': 14.2, '서해': 11.8 };
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
            temp: `${finalSst}°C`,
            layers: { upper: finalSst, middle: (finalSst - 1.2).toFixed(1), lower: (finalSst - 3.4).toFixed(1) },
            tide: { phase: '분석 중', high: '15:20', low: '08:42' },
            tide_predictions: [{ time: '14:20', type: '고조', level: 180 }]
          }));
        })
        .finally(() => { if (!cancelled) setLoading(false); }); // ✅ BUG-01 FIX

      const tidePromise = fetchTideForecast(sid, todayStr)
        .then(items => {
          if (!items || items.length === 0 || cancelled) return;
          const predictions = items.map(item => ({
            tph_time: item.hl_time || item.tph_time || '',
            hl_code: item.hl_code === 'H' ? '고조' : '간조',
            tph_level: item.hl_level || item.tph_level || '',
            time: item.hl_time || '',
            type: item.hl_code === 'H' ? '고조' : '간조',
            level: item.hl_level || '',
          }));
          if (!cancelled) setMarineData(prev => ({ // ✅ BUG-01 FIX
            ...prev,
            tide_predictions: predictions,
            tide: {
              ...(prev.tide || {}),
              phase: prev.tide?.phase || '조석 데이터',
              high: predictions.find(p => p.hl_code === '고조')?.tph_time || prev.tide?.high || '-',
              low: predictions.find(p => p.hl_code === '간조')?.tph_time || prev.tide?.low || '-',
            },
          }));
          if (!import.meta.env.PROD) console.info(`[BottomSheet] 조석예보 ${predictions.length}건 로드 완료`);
        })
        .catch(err => { if (!import.meta.env.PROD) console.warn('[BottomSheet] 조석예보 실패:', err); });

      const waterTempPromise = fetchWaterTemp(sid, todayStr)
        .then(temp => {
          if (temp && temp !== '-' && !cancelled) { // ✅ BUG-01 FIX
            setMarineData(prev => ({ ...prev, waterTemp: temp, sst: temp }));
            if (!import.meta.env.PROD) console.info(`[BottomSheet] 실측 수온 ${temp}°C 로드 완료`);
          }
        })
        .catch(err => { if (!import.meta.env.PROD) console.warn('[BottomSheet] 수온 실패:', err); });

      const fishingIdxPromise = fetchFishingIndex(sid)
        .then(items => {
          if (!items || items.length === 0 || cancelled) return; // ✅ BUG-01 FIX
          const today = items[0];
          const gradeMap = { '1': '매우좋음', '2': '좋음', '3': '보통', '4': '나쁨', '5': '매우나쁨' };
          const idx = today?.fishing_idx || today?.fishingIdx || '';
          const grade = today?.fishing_grade || gradeMap[idx] || idx;
          if (!cancelled) setMarineData(prev => ({ // ✅ BUG-01 FIX
            ...prev,
            fishingIndex: {
              등급: grade,
              수온: today?.wt ? `${today.wt}°C` : '-',
              파고: today?.wh ? `${today.wh}m` : '-',
              조류: today?.current_spd ? `${today.current_spd}m/s` : '-',
            },
          }));
          if (!import.meta.env.PROD) console.info(`[BottomSheet] 낚시지수 ${grade} 로드 완료`);
        })
        .catch(err => { if (!import.meta.env.PROD) console.warn('[BottomSheet] 낚시지수 실패:', err); });

      await Promise.allSettled([marinePromise, cctvPromise, shopPromise, tidePromise, waterTempPromise, fishingIdxPromise]);

      if (!cancelled) { // ✅ BUG-10 FIX: fire-and-forget 비즈니스 게시물 setState 언마운트 후 호출 방지
        setBizLoading(true);
        const regionKey = (selectedPoint.region || '').split(' ')[0];
        apiClient.get(`/api/community/business?region=${encodeURIComponent(regionKey)}&limit=3`)
          .then(res => { if (!cancelled) setBusinessPosts(Array.isArray(res.data) ? res.data : []); }) // ✅ BUG-10 FIX
          .catch(() => { if (!cancelled) setBusinessPosts([]); }) // ✅ BUG-10 FIX
          .finally(() => { if (!cancelled) setBizLoading(false); }); // ✅ BUG-10 FIX
      }

      // 최초 로딩 완료 → 갱신 시각 기록 + 카운트다운 시작
      if (!cancelled) {
        setLastRefreshed(new Date());
        setNextRefreshIn(30 * 60);
      }
    };

    loadData();

    // ── 30분 자동 갱신 ────────────────────────────────────────────────────
    const INTERVAL_MS = 30 * 60 * 1000; // 30분
    autoRefreshRef.current = setInterval(silentRefresh, INTERVAL_MS);

    // ── 1초 카운트다운 ────────────────────────────────────────────────────
    countdownRef.current = setInterval(() => {
      setNextRefreshIn(prev => (prev > 0 ? prev - 1 : 30 * 60));
    }, 1000);

    return () => {
      cancelled = true; // ✅ BUG-01 FIX: 포인트 전환 시 loadData 내 모든 setState 방지
      clearInterval(autoRefreshRef.current);
      clearInterval(countdownRef.current);
    };
  }, [selectedPoint?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // ✅ 3RD-B8: addToast는 store 함수로 안정적 — selectedPoint?.id만으로 deps 제한 안전

  if (!selectedPoint) return null;

  // ✅ 3RD-B7: AI 낚시 컨디션 연산 IIFE → useMemo — 매 렌더마다 재계산 방지
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fishingCondition = useMemo(
    () => evaluateFishingCondition(marineData, selectedPoint),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [marineData, selectedPoint]
  );

  // ✅ SHARE-COND: 바텀시트 최종 AI 컨디션을 홈화면과 공유 (멘트 완전 동기화)
  useEffect(() => {
    if (fishingCondition && selectedPoint?.id && onConditionReady) {
      onConditionReady(fishingCondition, selectedPoint.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fishingCondition, selectedPoint?.id]);

  return (
    <div style={{ padding: '0', backgroundColor: '#fff', borderRadius: '24px 24px 0 0', height: '100%' }}>
      {/* 바텀 시트 닫기 X 버튼 - 직접 추가함 (UI 완전성) */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: '900', color: '#1A1A2E' }}>
          {selectedPoint.name}
        </h2>
        {onClose && (
          <button onClick={onClose} style={{ background: '#F0F2F7', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold' }}>
            ✕
          </button>
        )}
      </div>

      <div style={{ padding: '0 20px 100px' }}>

        {/* ⭐ 비밀포인트 전용 황금 정보 박스 */}
        {selectedPoint.secret && (
          <div style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #1a1200, #2d1f00)', borderRadius: '20px', padding: '20px', border: '1.5px solid #B8860B', boxShadow: '0 0 24px rgba(255,215,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: `calc(20px * var(--fs, 1))` }}>⭐</span>
              <span style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: '#FFD700', letterSpacing: '0.04em' }}>비밀포인트 정보</span>
              <span style={{ marginLeft: 'auto', fontSize: `calc(11px * var(--fs, 1))`, background: 'rgba(255,215,0,0.15)', color: '#FFD700', padding: '3px 10px', borderRadius: '20px', fontWeight: '800', border: '1px solid rgba(255,215,0,0.3)' }}>PREMIUM ONLY</span>
            </div>

            {/* 주요 어종 */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#B8860B', fontWeight: '900', marginBottom: '8px' }}>🎣 주요 조황 어종</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(selectedPoint.fish || '').split(',').map((f) => ( // ✅ 17TH-B2: 인덱스 key → 어종명 key
                  <span key={f.trim()} style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', color: '#FFD700', background: 'rgba(255,215,0,0.12)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(255,215,0,0.25)' }}>
                    {f.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* 비밀 팁 */}
            <div style={{ marginBottom: '14px', background: 'rgba(255,215,0,0.06)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,215,0,0.15)' }}>
              <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#B8860B', fontWeight: '900', marginBottom: '8px' }}>💡 현지 고수 실전 팁</div>
              <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#FFE066', fontWeight: '700', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{selectedPoint.tip}</div>
            </div>

            {/* 접근 방법 */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#B8860B', fontWeight: '900', marginBottom: '6px' }}>🗺️ 접근 방법</div>
              <div style={{ fontSize: `calc(13px * var(--fs, 1))`, color: '#ccc', fontWeight: '700', lineHeight: '1.6' }}>{selectedPoint.access}</div>
            </div>
          </div>
        )}

        {/* 1. CCTV 실시간 뷰 영역 (인라인 비디오 렌더링 고도화) */}
        <div style={{ position: 'relative', height: '230px', backgroundColor: '#0A0A0F', borderRadius: '18px', overflow: 'hidden', marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
          
          {/* 마스터 전용 UI: CCTV 정보 수정 버튼 */}
          {isAdmin && (
            <button 
              onClick={() => {
                setIsEditingCctv(!isEditingCctv);
                if (!isEditingCctv) setEditYoutubeId(cctvData?.youtubeId || '');
              }}
              style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,215,0,0.9)', color: '#000', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', padding: '6px 10px', borderRadius: '8px', zIndex: 40, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
            >
              🔄 {isEditingCctv ? '수정 닫기' : `마스터 편집 (${cctvData?.youtubeId || '미등록'})`}
            </button>
          )}

          {/* 마스터 전용 UI: 입력 폼 오버레이 */}
          {isAdmin && isEditingCctv && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
              <div style={{ color: '#FFD700', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', marginBottom: '16px' }}>🛠 [{selectedPoint.name}] 실시간 유튜브 영상 ID 교체</div>
              <input 
                value={editYoutubeId}
                onChange={(e) => setEditYoutubeId(e.target.value)}
                placeholder="YouTube URL 뒤 11자리 (예: jfKfPfyJRdk)"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #FFD700', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', marginBottom: '16px', textAlign: 'center', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button 
                  onClick={() => setIsEditingCctv(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '800' }}
                >
                  취소
                </button>
                <button 
                  onClick={saveCctvOverride}
                  disabled={isSavingCctv}
                  style={{ flex: 2, padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #FFD700, #FFA000)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: '900', opacity: isSavingCctv ? 0.6 : 1 }}
                >
                  {isSavingCctv ? '업데이트 중...' : '즉시 적용 및 재생'}
                </button>
              </div>
            </div>
          )}

          {/* LITE 잠금 오버레이 */}
          {!canAccessPremium && (
            <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, background: 'rgba(10,10,15,0.7)' }}>
              <div style={{ fontSize: `calc(32px * var(--fs, 1))`, marginBottom: '12px', filter: 'drop-shadow(0 2px 8px rgba(255,255,255,0.2))' }}>🔐</div>
              <div style={{ fontSize: `calc(16px * var(--fs, 1))`, color: '#fff', fontWeight: '950', marginBottom: '8px' }}>LITE 플랜 이상 전용 영상</div>
              <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#aaa', fontWeight: '600', marginBottom: '20px', textAlign: 'center', padding: '0 20px' }}>
                현장의 파도와 분위기를 1초 단위로 <br/> 파악할 수 있는 인라인 라이브 시스템입니다.
              </div>
              <button 
                onClick={() => navigate('/vvip-subscribe')}
                style={{ background: 'linear-gradient(135deg, #FF3B30, #D32F2F)', color: '#fff', border: 'none', borderRadius: '30px', padding: '10px 28px', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '950', cursor: 'pointer', boxShadow: '0 6px 20px rgba(255,59,48,0.4)' }}
              >
                LITE 플랜 업그레이드
              </button>
            </div>
          )}

          {/* 실제 영상 / 콘텐츠 */}
          {cctvLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #FF3B30', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ color: '#fff', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800' }}>📡 대상어 현장 영상 연결 중...</div>
            </div>
          ) : cctvData ? (
             (cctvData.type === 'youtube' || cctvData.type === 'iframe') && cctvData.url ? (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <iframe
                    src={cctvData.url}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                  {/* 임베딩 차단 우회 및 전체화면용 외부 링크 버튼 */}
                  <button 
                    onClick={() => window.open(cctvData.type === 'youtube' ? `https://www.youtube.com/watch?v=${cctvData.youtubeId}` : cctvData.url, '_blank')}
                    style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(255,0,0,0.85)', color: '#fff', border: 'none', borderRadius: '20px', padding: '6px 12px', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}
                  >
                    {cctvData.type === 'youtube' ? (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M10 15l5.19-3-5.19-3v6zm11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg>앱으로 보기</>
                    ) : (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>원본 보기</>
                    )}
                  </button>
                </div>
             ) : cctvData.fallbackImg ? (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <img 
                    src={cctvData.type === 'mof' ? `${API_BASE}${cctvData.fallbackImg}?t=${mofTimestamp}` : cctvData.fallbackImg} 
                    alt={cctvData.areaName} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    onError={(e) => {
                      if (cctvData.safeFallbackImg && e.target.src !== cctvData.safeFallbackImg) {
                        e.target.src = cctvData.safeFallbackImg;
                      } else {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }
                    }}
                  />
                  {/* MOF 실시간 연안침식 모니터링 워터마크 레이아웃 */}
                  <div style={{ position: 'absolute', bottom: '60px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 8px', color: '#fff', fontSize: `calc(13px * var(--fs, 1))`, fontFamily: 'monospace', textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)', fontWeight: 'bold', zIndex: 5 }}>
                    <span style={{color: '#ff4444'}}>● REC</span>
                    <span>MOF_{selectedPoint?.obsCode}</span>
                  </div>
                  
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '36px 16px 12px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', zIndex: 6 }}>
                    <div style={{ color: '#00D1FF', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🌊 해양수산부 공식 실시간 연안 모니터링
                    </div>
                    <div style={{ color: '#fff', fontSize: `calc(10px * var(--fs, 1))`, marginTop: '4px', fontWeight: '600', opacity: 0.8 }}>
                      현장의 파고 및 연안침식 상태를 파악할 수 있는 해양수산부 공식 뷰어 시스템과 연동되어 있습니다.
                    </div>
                  </div>
                </div>
             ) : (
                <div style={{ color: '#888', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700' }}>현재 송출 가능한 영상이 없습니다.</div>
             )
          ) : (
             <div style={{ color: '#888', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '700' }}>시스템 오류 (데이터를 불러올 수 없습니다.)</div>
          )}

          {/* LIVE 배지 (고퀄리티) */}
          <div style={{ position: 'absolute', top: '14px', left: '14px', background: 'rgba(230,0,0,0.95)', color: '#fff', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '950', padding: '5px 10px', borderRadius: '8px', zIndex: 5, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(230,0,0,0.5)' }}>
            <span style={{ display: 'inline-block', width: '5px', height: '5px', background: '#fff', borderRadius: '50%', marginRight: '6px', animation: 'pulse 1.2s infinite' }}></span>
            L I V E
          </div>
          
          {cctvData?.areaName && (
             <div style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', padding: '5px 10px', borderRadius: '8px', backdropFilter: 'blur(8px)', zIndex: 5, border: '1px solid rgba(255,255,255,0.1)' }}>
              📍 {cctvData.areaName}
             </div>
          )}
        </div>


        {/* 2. API 데이터 렌더링 영역 */}
        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', border: '3px solid #1565C0', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: 'bold' }}>해양 데이터를 분석 중입니다...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* AI 낚시 컨디션 (냉정한 평가) — 민물 포인트 제외 */}
            {selectedPoint?.type === '민물' ? (
              /* 민물 포인트: AI 낚시 컨디션 · 점수 없음 안내 */
              <div style={{ backgroundColor: '#F0FFF4', border: '2px solid #43A047', borderRadius: '20px', padding: '20px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: `calc(36px * var(--fs, 1))`, flexShrink: 0 }}>🌿</span>
                <div>
                  <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '950', color: '#2E7D32', marginBottom: '6px' }}>민물 낚시 포인트</div>
                  <div style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '700', color: '#388E3C', lineHeight: 1.6 }}>
                    내수면 포인트는 해양 기상 데이터(수온·파고·물때)가<br/>
                    적용되지 않아 AI 낚시 점수를 제공하지 않습니다.
                  </div>
                </div>
              </div>
            ) : (() => {
              const cond = fishingCondition; // ✅ 3RD-B7: useMemo 연산 결과 사용
              return (
                <div style={{ backgroundColor: '#fff', border: `2px solid ${cond.color}`, borderRadius: '20px', padding: '20px', marginBottom: '10px', boxShadow: `0 8px 24px ${cond.color}20`, position: 'relative', overflow: 'hidden' }}>
                  {/* 상단 헤더 및 점수 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '950', color: '#fff', background: cond.color, padding: '4px 12px', borderRadius: '30px', letterSpacing: '-0.02em', boxShadow: `0 2px 8px ${cond.color}40` }}>
                        AI 낚시 컨디션
                      </span>
                      {/* ✅ AUTO-REFRESH 배지: 30분 자동 갱신 카운트다운 */}
                      {nextRefreshIn !== null && (
                        <span style={{ fontSize: `calc(9px * var(--fs, 1))`, fontWeight: '800', color: '#8E8E93', background: '#F2F2F7', padding: '3px 8px', borderRadius: '20px', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          🔄 {Math.floor(nextRefreshIn / 60)}:{String(nextRefreshIn % 60).padStart(2, '0')} 후 갱신
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: `calc(38px * var(--fs, 1))`, fontWeight: '950', color: cond.color, lineHeight: 1, letterSpacing: '-0.05em' }}>{cond.score}<span style={{ fontSize: `calc(18px * var(--fs, 1))`, fontWeight: '800' }}>점</span></span>
                  </div>

                  {/* 냉정한 조언 텍스트 */}
                  <div style={{ fontSize: `calc(17px * var(--fs, 1))`, fontWeight: '900', color: '#1A1A2E', marginBottom: '18px', lineHeight: 1.5, letterSpacing: '-0.04em', whiteSpace: 'pre-line' }}>
                    "{cond.advice}"
                  </div>

                  {/* 신랄한 태그 리스트 */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {cond.tags.map((tag) => ( // ✅ 17TH-B3: 인덱스 key → tag 값 key
                      <span key={tag} style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '800', color: cond.color, background: `${cond.color}10`, padding: '5px 10px', borderRadius: '10px', border: `1px solid ${cond.color}20` }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 냉정한 장비 가이드 가로바 */}
                  <div style={{ backgroundColor: '#F8F9FC', padding: '14px', borderRadius: '16px', border: '1px solid #F0F2F7', display: 'flex', gap: '10px', alignItems: 'start' }}>
                    <div style={{ fontSize: `calc(20px * var(--fs, 1))`, flexShrink: 0 }}>🧰</div>
                    <div>
                      <div style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', color: '#8E8E93', marginBottom: '3px' }}>전문가 권장 채비</div>
                      <div style={{ fontSize: `calc(12.5px * var(--fs, 1))`, fontWeight: '800', color: '#1A1A2E', lineHeight: 1.4 }}>{cond.gear}</div>
                    </div>
                  </div>

                  {/* 쇼핑 아이템 추천 영역 */}
                  {Array.isArray(shoppingItems) && shoppingItems.length > 0 && (
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '900', color: '#8E8E93', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        🛒 이 포인트 권장 채비 쇼핑
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
                            {/* ✅ FIELD-FIX: server L4344 반환 필드(img/name/price) 사용 — productImage/productName은 L4827 dead code 필드 */}
                            <img
                              src={item.img || item.productImage}
                              alt={item.name || item.productName || '낚시용품'}
                              style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }}
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }}
                            />
                            <div style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', color: '#1A1A2E', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.3, marginBottom: '6px', height: '26px' }}>
                              {item.name || item.productName}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '950', color: '#E65100' }}>
                                {item.price || `${(Number(item.productPrice) || 0).toLocaleString()}원`}
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

            {/* ✅ 민물 포인트: 수온 정보 없음 표기 */}
            {selectedPoint?.type === '민물' || !selectedPoint?.obsCode ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F4F6FA', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontWeight: '800', color: '#555' }}>현재 실측 수온</span>
                <span style={{ color: '#8E8E93', fontWeight: '800', fontSize: `calc(13px * var(--fs, 1))` }}>민물 포인트 로 수온 정보 없음</span>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#F4F6FA', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontWeight: '800', color: '#555' }}>현재 실측 수온</span>
                <span style={{ color: '#0056D2', fontWeight: '900', fontSize: `calc(18px * var(--fs, 1))` }}>{marineData.sst || marineData.waterTemp || '-'}°C</span>
              </div>
            )}

            {/* ✅ 민물 포인트: 층별 수온 없음 표기 */}
            {selectedPoint?.type === '민물' || !selectedPoint?.obsCode ? (
              <div style={{ backgroundColor: '#F4F6FA', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontWeight: '900', display: 'block', marginBottom: '8px', color: '#333' }}>층별 수온 정보 (상/중/저)</span>
                <div style={{ textAlign: 'center', color: '#8E8E93', fontWeight: '800', fontSize: `calc(13px * var(--fs, 1))`, padding: '8px 0' }}>민물 포인트로 해수 수온 정보 없음</div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#F4F6FA', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontWeight: '900', display: 'block', marginBottom: '12px', color: '#333' }}>층별 수온 정보 (상/중/저)</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { label: '상층', val: marineData.sst || marineData.waterTemp || '-', color: '#64B5F6' },
                    { label: '중층', val: marineData.sst ? (parseFloat(marineData.sst) - 1.2).toFixed(1) : '-', color: '#42A5F5' },
                    { label: '저층', val: marineData.sst ? (parseFloat(marineData.sst) - 3.4).toFixed(1) : '-', color: '#1E88E5' },
                  ].map(l => (
                    <div key={l.label} style={{ flex: 1, backgroundColor: '#fff', padding: '10px 6px', borderRadius: '10px', textAlign: 'center', border: '1.5px solid #F0F2F7' }}>
                      <div style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', color: '#8E8E93', marginBottom: '4px' }}>{l.label}</div>
                      <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '950', color: l.color }}>{l.val !== '-' ? `${l.val}°C` : '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ✅ 민물 포인트: 물때 정보 없음 표기 */}
            {selectedPoint?.type === '민물' || !selectedPoint?.obsCode ? (
              <div style={{ backgroundColor: '#F4F6FA', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontWeight: '900', display: 'block', marginBottom: '8px', color: '#333' }}>오늘의 물때 (만조/간조)</span>
                <div style={{ textAlign: 'center', color: '#8E8E93', fontWeight: '800', fontSize: `calc(13px * var(--fs, 1))`, padding: '8px 0' }}>민물 포인트로 조석 정보 없음</div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#F4F6FA', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontWeight: '900', display: 'block', marginBottom: '12px', color: '#333' }}>오늘의 물때 (만조/간조)</span>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.95rem', color: '#555' }}>
                {marineData.tide && (marineData.tide.phase || marineData.tide_predictions) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '800', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '4px' }}>
                      {marineData.tide.phase || '조석 분석 중'}
                    </div>
                    {/* 예측 데이터 리스트가 있는 경우 표시 */}
                    {marineData.tide_predictions && marineData.tide_predictions.slice(0, 4).map((t, idx) => (
                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: `calc(13px * var(--fs, 1))` }}>
                        <span style={{ fontWeight: '700' }}>{t.tph_time || t.time}</span>
                        <span style={{ color: (t.hl_code || t.type) === '고조' ? '#E65100' : '#1565C0', fontWeight: '800' }}>
                          {(t.hl_code || t.type) === '고조' ? '▲ 만조' : '▼ 간조'} : {t.tph_level || t.level}cm
                        </span>
                      </li>
                    ))}
                  </div>
                ) : (
                  <li style={{ color: '#888', fontSize: `calc(13px * var(--fs, 1))` }}>현장 물때 데이터를 실시간 분석 중입니다.</li>
                )}
              </ul>
            </div>
            )}{/* ✅ 민물 else 닫기 */}

            {/* 낚시지수 — 민물 포인트 제외 */}
            {marineData.fishingIndex && (selectedPoint?.type !== '민물' && selectedPoint?.obsCode) && (
              <div style={{ backgroundColor: '#F4F6FA', padding: '16px', borderRadius: '12px' }}>
                <span style={{ fontWeight: '900', display: 'block', marginBottom: '8px', color: '#333' }}>바다 낚시지수</span>
                {/* ✅ 3RD-A4: JSON.stringify raw 제거 — key:value 일반어 표시 */}
                <div style={{ fontSize: '0.9rem', color: '#555', lineHeight: 1.6 }}>
                  {typeof marineData.fishingIndex === 'object'
                    ? Object.entries(marineData.fishingIndex).map(([k, v]) => `${k}: ${v}`).join(' · ')
                    : String(marineData.fishingIndex)}
                </div>
              </div>
            )}

            {/* 3. B2B 로컬 입점 매장 광고 (지도 위치 기반 노른자위 광고 지면) */}
            {/* ✅ 25TH-B3: /api/ads/local?stationId= 실 API 연동 전까지 더미 플레이스홀더 숨김 처리 (3RD-C8 TODO)
                           실제 제휴 API 연동 완료 후 아래 false → localAd 조건으로 교체 */}
            {false && (
              <div style={{ marginTop: '8px', backgroundColor: '#FFF4E5', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', border: '1px solid #FFE0B2', boxShadow: '0 4px 10px rgba(255, 152, 0, 0.1)' }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: '#FFB74D', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `calc(24px * var(--fs, 1))`, flexShrink: 0 }}>
                  🏬
                </div>
                <div>
                  <span style={{ fontSize: `calc(10px * var(--fs, 1))`, color: '#E65100', fontWeight: '900', background: '#FFE0B2', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px', display: 'inline-block' }}>로컬 제휴 할인</span>
                  <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '900', color: '#E65100', marginBottom: '2px' }}>{selectedPoint.name} 도보 3분: 지역 낚시마트</div>
                  <div style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#F57C00', fontWeight: '800' }}>살아있는 미끼 및 각크릴 10% 단독할인 쿠폰!</div>
                </div>
              </div>
            )}

            {/* ── VIP 선상배 홍보 섹션 ── */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: `calc(18px * var(--fs, 1))` }}>🚢</span>
                  <span style={{ fontSize: `calc(14px * var(--fs, 1))`, fontWeight: '950', color: '#1A1A2E', letterSpacing: '-0.03em' }}>이 구역 선상배 예약</span>
                  {selectedPoint.region && (
                    <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', background: '#EBF2FF', color: '#1565C0', padding: '3px 8px', borderRadius: '20px' }}>
                      {(selectedPoint.region || '').split(' ')[0]}
                    </span>
                  )}
                </div>
                <button onClick={() => navigate('/community')} style={{ background: 'none', border: 'none', fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '800', color: '#8E8E93', cursor: 'pointer' }}>
                  전체보기 →
                </button>
              </div>

              {bizLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '10px' }}>
                  <div style={{ width: '20px', height: '20px', border: '2.5px solid #1565C0', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: `calc(12px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '700' }}>선상배 정보 불러오는 중...</span>
                </div>
              ) : businessPosts.length === 0 ? (
                <div style={{ background: 'linear-gradient(135deg, #F8F9FC, #F0F4FF)', borderRadius: '16px', padding: '24px', textAlign: 'center', border: '1.5px dashed #D0D8F0' }}>
                  <div style={{ fontSize: `calc(28px * var(--fs, 1))`, marginBottom: '8px' }}>⚓</div>
                  <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '800', color: '#8E8E93' }}>이 구역 등록된 선상배가 없습니다</div>
                  <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#AAB0BE', fontWeight: '600', marginTop: '4px' }}>VVIP 구독 후 내 선상을 등록해보세요!</div>
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
                            👑 VVIP 협력 선상
                          </span>
                        ) : (
                          <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', background: '#EBF2FF', color: '#1565C0', padding: '3px 10px', borderRadius: '20px' }}>
                            🚢 선상배 홍보
                          </span>
                        )}
                        {biz.region && (
                          <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '700', color: biz.isPinned ? '#FFD700' : '#8E8E93' }}>
                            📍 {biz.region}
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
                            ⛵
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: `calc(15px * var(--fs, 1))`, fontWeight: '950', color: biz.isPinned ? '#FFE066' : '#1A1A2E', marginBottom: '4px', letterSpacing: '-0.03em' }}>
                            {biz.shipName}
                          </div>
                          <div style={{ fontSize: `calc(11px * var(--fs, 1))`, fontWeight: '700', color: biz.isPinned ? '#B8860B' : '#8E8E93', marginBottom: '8px' }}>
                            {biz.type} · {biz.target}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            {biz.date && (
                              <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '800', background: biz.isPinned ? 'rgba(255,215,0,0.12)' : '#F4F6FA', color: biz.isPinned ? '#FFD700' : '#555', padding: '3px 8px', borderRadius: '8px' }}>
                                📅 {biz.date}
                              </span>
                            )}
                            {biz.price && (
                              <span style={{ fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', background: biz.isPinned ? 'rgba(255,165,0,0.15)' : '#FFF4E5', color: biz.isPinned ? '#FFA500' : '#E65100', padding: '3px 8px', borderRadius: '8px' }}>
                                💰 {typeof biz.price === 'number' ? `${biz.price.toLocaleString()}원` : biz.price}
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
                            window.location.href = `sms:${biz.phone.replace(/-/g,'')}?body=${encodeURIComponent(`[낚시GO] ${biz.shipName} 선상 예약 문의합니다.`)}`;
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
                          📲 {biz.phone} · 문자로 예약하기
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ✅ ADMOB-NATIVE: VIP 선상배 세션 아래 네이티브광고 (웹 AdSense 인피드형) */}
            <NativeAd style={{ marginTop: '4px', marginBottom: '0' }} />

            {/* ✅ CATCH-ENH: 조과 기록 남기기 버튼 */}
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #F0F0F5' }}>
              <div style={{ fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '950', color: '#1c1c1e', marginBottom: '10px' }}>
                🎣 이 포인트에서 잡으셨나요?
              </div>
              <button
                onClick={() => {
                  if (!user || user.email === 'guest@fishinggo.com') {
                    addToast('조과 기록은 로그인 후 이용 가능합니다.', 'error');
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
                <span style={{ fontSize: `calc(18px * var(--fs, 1))` }}>🎣</span>
                조과 기록 남기기
              </button>
              <div style={{ fontSize: `calc(11px * var(--fs, 1))`, color: '#8E8E93', fontWeight: '600', textAlign: 'center', marginTop: '8px' }}>
                기록은 마이페이지 조과통계에 자동 반영됩니다
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ✅ CATCH-ENH: 조과 기록 작성 모달 */}
      {showCatchModal && (
        <CatchRecordModal
          point={selectedPoint}
          user={user}
          onClose={() => setShowCatchModal(false)}
          onSuccess={() => { /* 저장 후 토스트는 모달 내부에서 표시 */ }}
        />
      )}
    </div>
  );
}
