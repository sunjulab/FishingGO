import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, Fish, MapPin, Ruler, Weight, Share2, Trophy, ChevronRight, X, CheckCircle, AlertTriangle, Loader } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useToastStore } from '../store/useToastStore';
import apiClient from '../api/index';
import { getFishRule, isClosedSeason, getFishEmoji, FISH_RULES } from '../data/fishRules';

const PRIMARY = '#0056D2';
const GREEN   = '#22c55e';
const RED     = '#FF3B30';
const GOLD    = '#F59E0B';

// ─── 공유 카드 생성 (Canvas) ────────────────────────────────────────────────
async function generateShareCard({ fishName, fishSize, fishWeight, location, weather, userName, imageUrl }) {
  const canvas = document.createElement('canvas');
  canvas.width  = 900;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');

  // 배경 그라디언트
  const grad = ctx.createLinearGradient(0, 0, 900, 500);
  grad.addColorStop(0, '#0a1628');
  grad.addColorStop(1, '#0056D2');
  ctx.fillStyle = grad;
  ctx.roundRect(0, 0, 900, 500, 20);
  ctx.fill();

  // 물고기 사진 (있으면 왼쪽에 표시)
  if (imageUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = imageUrl; });
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(20, 20, 420, 460, 16);
      ctx.clip();
      ctx.drawImage(img, 20, 20, 420, 460);
      ctx.restore();
    } catch { /* 이미지 로드 실패 시 무시 */ }
  }

  const x = imageUrl ? 460 : 50;

  // 낚시GO 로고
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.roundRect(x, 20, 420, 40, 8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎣 낚시GO 조황 인증', x + 210, 46);

  // 어종 이모지 + 이름
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(getFishEmoji(fishName), x + 210, 160);
  ctx.font = 'bold 38px sans-serif';
  ctx.fillStyle = '#FDE68A';
  ctx.fillText(fishName || '미확인 어종', x + 210, 210);

  // 크기 / 무게
  ctx.font = '24px sans-serif';
  ctx.fillStyle = '#E0F2FE';
  if (fishSize)   ctx.fillText(`📏 ${fishSize} cm`, x + 210, 260);
  if (fishWeight) ctx.fillText(`⚖️  ${fishWeight} kg`, x + 210, 295);

  // 장소
  if (location) {
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#BAE6FD';
    ctx.fillText(`📍 ${location}`, x + 210, 335);
  }
  if (weather) {
    ctx.fillStyle = '#BAE6FD';
    ctx.fillText(`${weather}`, x + 210, 365);
  }

  // 닉네임
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(`by ${userName || '낚시인'}`, x + 210, 410);

  // 앱 설치 유도
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.roundRect(x + 60, 440, 300, 40, 20);
  ctx.fill();
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText('낚시GO 앱에서 확인하기 →', x + 210, 465);

  return canvas.toDataURL('image/png');
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export default function CatchUploadPage() {
  const navigate    = useNavigate();
  const user        = useUserStore(s => s.user);
  const addToast    = useToastStore(s => s.addToast);

  const fileRef     = useRef(null);
  const canvasRef   = useRef(null);

  const [step, setStep]           = useState(1); // 1=사진, 2=정보입력, 3=완료
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64]   = useState(null);

  // AI 인식 결과
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiResult, setAiResult]     = useState(null);

  // 입력 폼
  const [fishName, setFishName]     = useState('');
  const [fishSize, setFishSize]     = useState('');
  const [fishWeight, setFishWeight] = useState('');
  const [location, setLocation]     = useState('');
  const [memo, setMemo]             = useState('');
  const [contestId, setContestId]   = useState('');
  const [contests, setContests]     = useState([]);

  // 결과
  const [uploading, setUploading]   = useState(false);
  const [shareCard, setShareCard]   = useState(null);
  const [savedRecord, setSavedRecord] = useState(null);

  const fishRule    = getFishRule(fishName);
  const closed      = isClosedSeason(fishRule);

  // 진행 중인 대회 불러오기
  React.useEffect(() => {
    apiClient.get('/api/contest/active')
      .then(r => setContests(r.data.contests || []))
      .catch(() => {});
  }, []);

  // 파일 선택 처리
  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return addToast('이미지 파일을 선택해주세요.', 'error');
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      // base64 (data:image/jpeg;base64,xxx → xxx만 추출)
      const b64 = e.target.result.split(',')[1];
      setImageBase64(b64);
    };
    reader.readAsDataURL(file);
    setStep(2);
    // AI 어종 자동 인식
    setAiLoading(true);
    try {
      const reader2 = new FileReader();
      const b64 = await new Promise((res) => { reader2.onload = (e) => res(e.target.result.split(',')[1]); reader2.readAsDataURL(file); });
      const res = await apiClient.post('/api/ai/fish-identify', { imageBase64: b64, mimeType: file.type }, { timeout: 30000 });
      setAiResult(res.data);
      if (res.data.fishName) {
        setFishName(res.data.fishName);
        addToast(`🐟 AI 인식: ${res.data.fishName} (신뢰도 ${res.data.confidence}%)`, 'success');
      } else {
        addToast('AI가 어종을 인식하지 못했습니다. 직접 입력해주세요.', 'info');
      }
    } catch {
      addToast('AI 인식 서버에 연결 중 오류. 직접 입력해주세요.', 'info');
    } finally {
      setAiLoading(false);
    }
  }, [addToast]);

  // 조황 등록
  const handleSubmit = async () => {
    if (!fishName.trim()) return addToast('어종을 입력해주세요.', 'error');
    setUploading(true);
    try {
      // 1. 이미지 서버 업로드 (base64로 전송)
      let imageUrl = null;
      if (imageBase64 && imageFile) {
        try {
          const imgRes = await apiClient.post('/api/user/avatar', {
            email: user?.email,
            avatar: `data:${imageFile.type};base64,${imageBase64}`,
          }, { timeout: 60000 });
          imageUrl = imgRes.data.avatar || null;
        } catch { /* 이미지 업로드 실패 시 URL 없이 진행 */ }
      }

      // 2. 조황 기록 저장
      const res = await apiClient.post('/api/catch', {
        userId:       user?.id || user?._id,
        userName:     user?.name,
        userAvatar:   user?.avatar,
        fishName:     fishName.trim(),
        fishSize:     fishSize ? parseFloat(fishSize) : null,
        fishWeight:   fishWeight ? parseFloat(fishWeight) : null,
        imageUrl,
        location:     location.trim(),
        memo:         memo.trim(),
        contestId:    contestId || null,
        verified:     !!(aiResult?.fishName),
        aiConfidence: aiResult?.confidence || 0,
      });

      setSavedRecord(res.data.record);

      // 3. 공유 카드 생성
      const card = await generateShareCard({
        fishName, fishSize, fishWeight, location,
        userName: user?.name,
        imageUrl: imagePreview,
      });
      setShareCard(card);
      setStep(3);
      addToast(`🎉 조황 등록 완료! +30 EXP 획득`, 'success');
    } catch (err) {
      addToast(err.response?.data?.error || '등록 실패. 다시 시도해주세요.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // 공유
  const handleShare = async () => {
    if (navigator.share && shareCard) {
      try {
        const blob = await (await fetch(shareCard)).blob();
        const file = new File([blob], 'catch.png', { type: 'image/png' });
        await navigator.share({ title: `낚시GO 조황 인증 - ${fishName}`, files: [file] });
        return;
      } catch { /* 파일 공유 실패 시 Kakao로 */}
    }
    // Kakao 공유
    if (window.Kakao?.isInitialized()) {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `🎣 ${fishName} 조황 인증!`,
          description: `${location ? location + ' · ' : ''}${fishSize ? fishSize + 'cm' : ''}${fishWeight ? ' / ' + fishWeight + 'kg' : ''}`,
          imageUrl: shareCard || 'https://fishinggo.vercel.app/logo.png',
          link: { mobileWebUrl: 'https://fishinggo.vercel.app', webUrl: 'https://fishinggo.vercel.app' },
        },
        buttons: [{ title: '낚시GO 앱 보기', link: { mobileWebUrl: 'https://fishinggo.vercel.app', webUrl: 'https://fishinggo.vercel.app' } }],
      });
    } else {
      // 링크 복사 폴백
      try {
        await navigator.clipboard.writeText(`🎣 낚시GO 조황 인증\n${fishName} ${fishSize ? fishSize + 'cm' : ''}\nhttps://fishinggo.vercel.app`);
        addToast('링크가 복사되었습니다!', 'success');
      } catch { addToast('공유를 지원하지 않는 환경입니다.', 'error'); }
    }
  };

  const st = { padding: '14px 16px', borderRadius: '14px', fontSize: `calc(15px * var(--fs,1))`, border: '1.5px solid #e0e0e0', background: '#fafafa', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };
  const labelSt = { fontSize: `calc(11px * var(--fs,1))`, fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px', textTransform: 'uppercase' };

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg,#0a1628 0%,#0d2a4a 60%,#0056D2 100%)', paddingBottom: '80px' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
          <X size={20} />
        </button>
        <div>
          <h1 style={{ color: '#fff', fontWeight: '900', fontSize: `calc(18px * var(--fs,1))`, margin: 0 }}>📸 조황 인증</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: `calc(11px * var(--fs,1))`, margin: 0 }}>잡은 물고기를 인증하고 랭킹에 올리세요!</p>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* ── STEP 1: 사진 선택 ── */}
        {step === 1 && (
          <div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
              onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />

            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px 16px', textAlign: 'center', marginBottom: '16px', border: '2px dashed rgba(255,255,255,0.3)', cursor: 'pointer' }}
              onClick={() => fileRef.current?.click()}>
              <div style={{ fontSize: '64px', marginBottom: '12px' }}>🐟</div>
              <div style={{ color: '#fff', fontWeight: '900', fontSize: `calc(18px * var(--fs,1))`, marginBottom: '6px' }}>물고기 사진 업로드</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: `calc(13px * var(--fs,1))` }}>사진을 찍으면 AI가 어종을 자동 인식합니다</div>
            </div>

            <button onClick={() => fileRef.current?.click()} style={{
              width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
              background: 'linear-gradient(135deg,#0056D2,#003fa3)', color: '#fff',
              fontWeight: '900', fontSize: `calc(16px * var(--fs,1))`, cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(0,86,210,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              <Camera size={20} /> 카메라로 찍기
            </button>
            <button onClick={() => { const input = document.createElement('input'); input.type='file'; input.accept='image/*'; input.onchange=(e)=>handleFile(e.target.files[0]); input.click(); }} style={{
              width: '100%', padding: '14px', borderRadius: '16px', border: '2px solid rgba(255,255,255,0.3)',
              background: 'transparent', color: '#fff', fontWeight: '800', fontSize: `calc(15px * var(--fs,1))`,
              cursor: 'pointer', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              <Upload size={18} /> 갤러리에서 선택
            </button>
          </div>
        )}

        {/* ── STEP 2: 정보 입력 ── */}
        {step === 2 && (
          <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: '24px', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* 사진 미리보기 */}
            {imagePreview && (
              <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', height: '200px' }}>
                <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {aiLoading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
                    <Loader size={32} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                    <div style={{ color: '#fff', fontWeight: '700', fontSize: `calc(13px * var(--fs,1))` }}>🤖 AI 어종 분석 중...</div>
                  </div>
                )}
                {aiResult && aiResult.fishName && !aiLoading && (
                  <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.75)', borderRadius: '10px', padding: '6px 10px' }}>
                    <span style={{ color: '#4ade80', fontSize: `calc(12px * var(--fs,1))`, fontWeight: '800' }}>
                      ✅ AI: {aiResult.fishName} ({aiResult.confidence}%)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 금어기 경고 */}
            {closed && fishName && (
              <div style={{ background: '#FFF3CD', borderRadius: '12px', padding: '12px', border: '1.5px solid #F59E0B', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <AlertTriangle size={20} color={GOLD} />
                <div style={{ fontSize: `calc(13px * var(--fs,1))`, color: '#92400E', fontWeight: '700' }}>
                  ⚠️ {fishName} 금어기: {fishRule?.closedSeason} — 방류를 권장합니다
                </div>
              </div>
            )}

            {/* 어종 */}
            <div>
              <span style={labelSt}>어종 {aiLoading && '(AI 분석 중...)'}</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                {['감성돔','광어','우럭','볼락','참돔','농어','방어','고등어','붕어','잉어'].map(f => (
                  <button key={f} onClick={() => setFishName(f)} style={{
                    padding: '6px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                    fontSize: `calc(12px * var(--fs,1))`, fontWeight: '700',
                    background: fishName === f ? PRIMARY : '#f1f5f9', color: fishName === f ? '#fff' : '#475569',
                  }}>{f}</button>
                ))}
              </div>
              <input style={st} type="text" placeholder="기타 어종 직접 입력" value={fishName} onChange={e => setFishName(e.target.value)} />
            </div>

            {/* 크기 / 무게 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <span style={labelSt}>크기 (cm)</span>
                <input style={st} type="number" inputMode="decimal" placeholder="예: 45" value={fishSize} onChange={e => setFishSize(e.target.value)} min={0} max={500} />
              </div>
              <div>
                <span style={labelSt}>무게 (kg)</span>
                <input style={st} type="number" inputMode="decimal" placeholder="예: 1.8" value={fishWeight} onChange={e => setFishWeight(e.target.value)} min={0} max={100} />
              </div>
            </div>

            {/* 최소 체장 안내 */}
            {fishRule?.minSize && fishSize && parseFloat(fishSize) < fishRule.minSize && (
              <div style={{ background: '#FEE2E2', borderRadius: '10px', padding: '10px 12px', fontSize: `calc(12px * var(--fs,1))`, color: '#DC2626', fontWeight: '700' }}>
                ⚠️ {fishName} 최소 체장 {fishRule.minSize}cm 미만입니다. 방류를 권장합니다.
              </div>
            )}

            {/* 장소 */}
            <div>
              <span style={labelSt}>낚시 장소</span>
              <input style={st} type="text" placeholder="예: 제주 성산포 갯바위" value={location} onChange={e => setLocation(e.target.value)} />
            </div>

            {/* 대회 참가 */}
            {contests.length > 0 && (
              <div>
                <span style={labelSt}>대회 참가 (선택)</span>
                <select style={st} value={contestId} onChange={e => setContestId(e.target.value)}>
                  <option value="">참가 안함</option>
                  {contests.map(c => (
                    <option key={c._id} value={c._id}>🏆 {c.title} ({c.fishName})</option>
                  ))}
                </select>
              </div>
            )}

            {/* 메모 */}
            <div>
              <span style={labelSt}>한마디 (선택)</span>
              <input style={st} type="text" placeholder="오늘의 채비, 미끼, 날씨 등..." value={memo} onChange={e => setMemo(e.target.value)} maxLength={100} />
            </div>

            {/* 등록 버튼 */}
            <button onClick={handleSubmit} disabled={uploading || !fishName.trim()} style={{
              width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
              background: 'linear-gradient(135deg,#0056D2,#003fa3)', color: '#fff',
              fontWeight: '900', fontSize: `calc(16px * var(--fs,1))`, cursor: 'pointer',
              opacity: (uploading || !fishName.trim()) ? 0.6 : 1,
              boxShadow: '0 6px 20px rgba(0,86,210,0.35)',
            }}>
              {uploading ? '등록 중...' : '🎣 조황 등록하기'}
            </button>
          </div>
        )}

        {/* ── STEP 3: 완료 + 공유 ── */}
        {step === 3 && (
          <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: '24px', padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '8px' }}>🎉</div>
            <h2 style={{ fontWeight: '900', fontSize: `calc(22px * var(--fs,1))`, color: '#0d1b2a', marginBottom: '4px' }}>조황 인증 완료!</h2>
            <p style={{ color: '#64748b', fontSize: `calc(13px * var(--fs,1))`, marginBottom: '16px' }}>+30 EXP 획득 · 전국 랭킹에 등록되었습니다</p>

            {/* 공유 카드 미리보기 */}
            {shareCard && (
              <img src={shareCard} alt="share card" style={{ width: '100%', borderRadius: '16px', marginBottom: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleShare} style={{
                width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg,#FDE68A,#F59E0B)', color: '#78350F',
                fontWeight: '900', fontSize: `calc(15px * var(--fs,1))`, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                <Share2 size={18} /> 카카오톡/SNS 공유
              </button>
              <button onClick={() => navigate('/catch-ranking')} style={{
                width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff',
                fontWeight: '900', fontSize: `calc(15px * var(--fs,1))`, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                <Trophy size={18} /> 전국 랭킹 보기
              </button>
              <button onClick={() => navigate('/')} style={{
                width: '100%', padding: '13px', borderRadius: '14px',
                border: '1.5px solid #e0e0e0', background: '#f8fafc', color: '#475569',
                fontWeight: '800', fontSize: `calc(14px * var(--fs,1))`, cursor: 'pointer',
              }}>
                홈으로 돌아가기
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
