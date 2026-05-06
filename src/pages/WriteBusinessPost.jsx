/**
 * WriteBusinessPost.jsx — 선상 배 홍보 전용 등록 폼
 * - 배 이름, 항구/지역, 출조 타입, 목표어종, 인원, 가격, 일정, 연락처 구조화 입력
 * - AI 홍보 문구 자동 생성
 * - 커버사진 업로드
 * - 등록 완료 시 businessPosts 피드에 전화 바로 연결되는 카드로 노출
 */
import React, { useState, useEffect, useMemo, useRef } from 'react'; // ✅ 7TH-B7: useMemo / ✅ 19TH-B2: useRef import 추가
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Phone, Image, Sparkles, ChevronDown, CheckCircle2, MapPin } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore'; // ✅ 7TH-A2: ADMIN_ID/ADMIN_EMAIL import
import { RewardGateModal } from '../components/AdUnit';
import apiClient from '../api/index';
import { fileToCompressedBase64 } from '../utils/imageUtils';

const FISH_TYPES = ['감성돔', '참돔', '방어', '광어', '대구', '문어', '쭈꾸미', '갑오징어', '우럭', '농어', '삼치', '고등어', '장어'];
const BOAT_TYPES = ['선상낚시', '야간선상', '에깅/문어', '선상루어', '캐스팅', '심해낚시', '갯바위 투어'];
const REGIONS = [
  // 강원 (동해) — 강릉·강문은 '강원 강릉'으로 통합
  '강원 강릉', '강원 주문진', '강원 속초', '강원 고성(거진)', '강원 양양(낙산)', '강원 양양(남애)', '강원 동해(묵호)', '강원 삼척',
  // 경북 (동해)
  '경북 구룡포(포항)', '경북 감포(경주)', '경북 강구(영덕)', '경북 후포(울진)', '경북 죽변(울진)',
  // 경남 (남해 동부)
  '경남 통영', '경남 거제(대포)', '경남 거제(금포)', '경남 남해(미조)', '경남 남해(상주)', '경남 고성',
  // 전남 (남해 서부)
  '전남 여수(국동)', '전남 목포', '전남 완도', '전남 고흥(나로도)', '전남 진도',
  // 전북 (서해)
  '전북 군산(비응)', '전북 군산(야미도)', '전북 부안(격포)', '전북 부안(위도)',
  // 충남 (서해)
  '충남 태안(안흥)', '충남 태안(마검포)', '충남 보령(무창포)', '충남 보령(오천)', '충남 서산(삼길포)',
  // 인천 (서해)
  '인천 남항부두', '인천 연안부두',
  // 부산 (동·남해)
  '부산 기장', '부산 다대포', '부산 용호부두',
  // 제주
  '제주 도두항', '제주 애월항', '제주 서귀포', '제주 모슬포', '제주 성산항',
];

// ✅ 7TH-B6: Math.random() 홍보문구 템플릿 선택 → 페이로드 해시 기반 결정론적 선택
// (shipName + region + boatType의 코드포인트 합산으로 일관된 템플릿 선택)
function generatePromoText({ shipName, region, boatType, targetFish, price, schedule, capacity, phone, extraMsg }) {
  const fishList = targetFish.join(', ');
  const templates = [
    `🚢 ${region}에서 출발하는 ${shipName}과 함께 ${boatType}을 즐겨보세요! ${fishList} 전문 포인트를 직접 안내해 드립니다.\n\n초보자부터 고수까지 모두 환영! 장비 대여 완비, 친절한 가이드로 최고의 하루를 만들어 드리겠습니다.\n\n📅 일정: ${schedule}\n👥 모집 인원: ${capacity}명\n💰 가격: ${price}\n📞 문의: ${phone}`,
    `✨ [${shipName}] ${boatType} — ${region} 출항\n\n타겟 어종: ${fishList}\n현지 베테랑 선장이 비밀 포인트로 직접 안내합니다. ${extraMsg || '여러분의 첫 대물을 저희와 함께 만나보세요.'}\n\n출조 일정: ${schedule} | 정원: ${capacity}명\n인당 요금: ${price} (미끼·음료 기본 제공)\n즉시 예약: ${phone}`,
    `🎣 ${region} ${boatType} 모집 — ${shipName}\n\n이번 시즌 가장 뜨거운 포인트, ${fishList} 조황 최고조!\n수십 년 경력 선장이 직접 운영하는 소규모 프리미엄 배낚시.\n\n📋 출조 정보\n• 일정: ${schedule}\n• 정원: ${capacity}명 (소수 정예)\n• 요금: ${price}\n• 출발: ${region}  \n📞 선착순 마감! 바로 연락 주세요: ${phone}`,
  ];
  // 결정론적 인덱스: shipName + region 코드포인트 합산 (Math.random 제거)
  const hash = [...(shipName + region)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return templates[hash % templates.length];
}

export default function WriteBusinessPost() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId'); // 수정 모드
  const isEditMode = !!editId;
  const addToast = useToastStore((s) => s.addToast);
  const user = useUserStore((s) => s.user);
  const userTier = useUserStore((s) => s.userTier);

  const isAdmin = useUserStore(s => s.user?.id === ADMIN_ID || s.user?.email === ADMIN_EMAIL); // ✅ 7TH-A2: ADMIN_ID/ADMIN_EMAIL 직접 비교
  const isPRO = userTier === 'PRO';
  const isVVIP = userTier === 'BUSINESS_VIP';

  // ✅ 7TH-C5: canWrite 접근 제어 확인 — 마스터+PRO+VIP만 등록가능, handlePostClick(L112)\uc5d0서 실제 가드 적용
  const canWrite = isAdmin || isPRO || isVVIP;

  const [shipName, setShipName] = useState('');
  const [region, setRegion] = useState('');
  const [boatType, setBoatType] = useState('');
  const [targetFish, setTargetFish] = useState([]);
  const [price, setPrice] = useState('');
  const [schedule, setSchedule] = useState('');
  const [capacity, setCapacity] = useState('');
  const [phone, setPhone] = useState('');
  const [extraMsg, setExtraMsg] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false); // VVIP 프리미엄 스폰서 고정
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);
  const generateTimerRef = useRef(null); // ✅ 19TH-B2: AI 생성 타이머 ref — 언마운트 후 setState 방지

  const isReady = shipName && region && boatType && targetFish.length > 0 && price && schedule && capacity && phone;

  // 수정 모드: 기존 데이터 불러오기
  useEffect(() => {
    if (!isEditMode) return;
    apiClient.get(`/api/community/business/${editId}`)
      .then(res => {
        const data = res.data;
        setShipName(data.shipName || '');
        setRegion(data.region || '');
        setBoatType(data.type || '');
        setTargetFish(data.target ? data.target.split('/').filter(Boolean) : []); // ✅ BUG-64: null guard + empty string 방어
        setPrice(data.price || '');
        setSchedule(data.date || '');
        setCapacity(String(data.capacity || ''));
        setPhone(data.phone || '');
        setExtraMsg('');
        setCoverImage(data.cover || '');
        setContent(data.content || '');
        setIsPinned(data.isPinned || false);
      })
      .catch((e) => { if (!import.meta.env.PROD) console.warn('[WriteBusinessPost] 수정 데이터 로드 실패:', e); }); // ✅ 19TH-B1: silent catch → 개발 환경 경고
  }, [editId]);

  const toggleFish = (fish) => {
    setTargetFish(prev =>
      prev.includes(fish) ? prev.filter(f => f !== fish) : (prev.length < 4 ? [...prev, fish] : prev)
    );
  };

  // ✅ 19TH-B2: 언마운트 시 AI 생성 타이머 정리
  useEffect(() => { return () => { if (generateTimerRef.current) clearTimeout(generateTimerRef.current); }; }, []);

  const handleGenerateAI = () => {
    if (!isReady) { addToast('모든 필수 항목을 먼저 입력해주세요.', 'error'); return; }
    if (generateTimerRef.current) clearTimeout(generateTimerRef.current); // 이전 타이머 정리
    setIsGenerating(true);
    // ENH6-B4: TODO — 실제 AI API(OpenAI GPT-4o 등) 연동 시 아래로 교체:
    // apiClient.post('/api/ai/generate-promo', { ... }).then(...).catch(...).finally(() => setIsGenerating(false));
    // 현재: 클라이언트 템플릿 선택 방식 (서버 AI 없음)
    generateTimerRef.current = setTimeout(() => { // ✅ 19TH-B2: ref로 타이머 추적
      const generated = generatePromoText({ shipName, region, boatType, targetFish, price, schedule, capacity, phone, extraMsg });
      setContent(generated);
      setIsGenerating(false);
      generateTimerRef.current = null;
      addToast('✨ AI가 홍보 문구를 완성했습니다!', 'success');
    }, 1200);
  };

  const handlePostClick = () => {
    if (!canWrite) {
      addToast('⚠️ 선상 홍보글은 PRO · VIP · 마스터만 등록 가능합니다.', 'error');
      // ENH6-C4: 불필요한 setTimeout(1500) 제거 — toast 후 즉시 navigate
      navigate('/community');
      return;
    }
    if (!isReady || !content.trim()) { addToast('모든 항목을 입력하고 홍보 문구를 생성해주세요.', 'error'); return; }
    // 인원 숫자 검증
    const cap = Number(capacity);
    if (!cap || isNaN(cap) || cap < 1 || cap > 200) {
      addToast('인원은 1~200사이의 숫자로 입력해주세요.', 'error');
      return;
    }
    // 전화번호 형식 검증
    const phoneRegex = /^(010|011|016|017|018|019)-?\d{3,4}-?\d{4}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      addToast('올바른 전화번호를 입력해주세요. (010-XXXX-XXXX)', 'error');
      return;
    }
    doPost();
  };

  const doPost = async () => {
    setIsSubmitting(true);
    const storedUser = user;
    if (!storedUser) { addToast('로그인이 필요합니다.', 'error'); setIsSubmitting(false); return; }
    try {
      const payload = {
        author: storedUser.name,
        author_email: storedUser.email,
        shipName, region,
        type: boatType,
        target: targetFish.join('/'),
        price, date: schedule,
        capacity: Number(capacity),
        phone, content,
        isPinned: isAdmin && isPinned, // ✅ 마스터만 isPinned 전송
        // ENH6-A3: Unsplash 외부 의존 제거 — picsum.photos placeholder 사용
        cover: coverImage || 'https://picsum.photos/seed/fishingboat/400/200'
      };
      if (isEditMode) {
        payload.email = storedUser.email;
      }
      const method = isEditMode ? 'put' : 'post';
      const url = isEditMode
        ? `/api/community/business/${editId}`
        : `/api/community/business`;
      await apiClient[method](url, isEditMode ? payload : { ...payload, category: '선상' });
      addToast(isEditMode ? '✅ 홍보글이 수정되었습니다!' : '🚢 선상 배 홍보글이 등록되었습니다!', 'success');
      navigate(isEditMode ? -1 : '/community?tab=business');
    } catch (err) {
      if (!import.meta.env.PROD) console.error('Business post error:', err);
      // ✅ 중복 등록(409) 처리 — 수정 페이지로 자동 이동
      if (err.response?.status === 409) {
        const existingId = err.response?.data?.existingId;
        addToast('이미 홍보글이 있습니다. 기존 글을 수정해주세요.', 'warning');
        if (existingId) navigate(`/write-business?editId=${existingId}`);
        else navigate('/community?tab=business');
      } else {
        const msg = err.response?.data?.error || '등록 실패. 다시 시도해주세요.';
        addToast(msg, 'error');
      }
    } finally { setIsSubmitting(false); }
  };

  return (
    <div style={{ backgroundColor: '#F2F2F7', minHeight: '100dvh', paddingBottom: '80px', maxWidth: '430px', margin: '0 auto', position: 'relative' }}>
      {/* 헤더 */}
      <div style={{ backgroundColor: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none' }}><X size={22} color="#1c1c1e" /></button>
        <h2 style={{ fontSize: '15px', fontWeight: '900', margin: 0 }}>{isEditMode ? '홍보글 수정' : '선상 배 홍보 등록'}</h2>
        <button
          disabled={!isReady || !content || isSubmitting}
          onClick={handlePostClick}
          style={{ border: 'none', background: isReady && content ? '#0056D2' : '#f0f0f0', color: isReady && content ? '#fff' : '#bbb', padding: '6px 14px', borderRadius: '16px', fontSize: '12px', fontWeight: '800', cursor: isReady && content ? 'pointer' : 'default' }}
        >{isSubmitting ? '저장 중...' : isEditMode ? '✅ 수정 완료' : '등록 ›'}</button>
      </div>

      {/* 권한 없는 사용자 안내 배너 */}
      {!canWrite && (
        <div style={{ margin: '12px 12px 0', background: 'linear-gradient(135deg,#FF5A5F,#FF3B30)', borderRadius: '14px', padding: '14px 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '22px' }}>🔒</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '900', marginBottom: '2px' }}>PRO · VIP · 마스터 전용</div>
            <div style={{ fontSize: '11px', opacity: 0.85 }}>선상 홍보글 등록은 PRO 이상 플랜만 가능합니다.</div>
          </div>
        </div>
      )}

      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* 커버 이미지 업로드 */}
        <section style={{ backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden' }}>
          <label htmlFor="cover-upload" style={{ display: 'block', cursor: 'pointer' }}>
            {coverImage ? (
              <img src={coverImage} alt="커버" style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
            ) : (
              <div style={{ height: '80px', backgroundColor: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#aaa' }}>
                <Image size={22} />
                <span style={{ fontSize: '13px', fontWeight: '700' }}>배 사진 등록 (클릭)</span>
              </div>
            )}
          </label>
          <input id="cover-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
            const f = e.target.files[0];
            e.target.value = ''; // 같은 파일 재선택 시 onChange 재발생
            if (f) {
              try {
                const compressed = await fileToCompressedBase64(f, { maxWidth: 1200, maxHeight: 900, quality: 0.85, preset: 'business' });
                setCoverImage(compressed);
              } catch (err) {
                const r = new FileReader();
                r.onloadend = () => setCoverImage(r.result);
                r.readAsDataURL(f);
              }
            }
          }} />
        </section>

        {/* 기본 정보 */}
        <section style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', marginBottom: '10px' }}>🚢 기본 정보</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input value={shipName} onChange={e => setShipName(e.target.value)} placeholder="배 이름 (예: 강릉 에이스호)" style={INPUT_STYLE} />
            <select value={region} onChange={e => setRegion(e.target.value)} style={INPUT_STYLE}>
              <option value="">📍 출항 지역 / 항구 선택</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={boatType} onChange={e => setBoatType(e.target.value)} style={INPUT_STYLE}>
              <option value="">🎣 출조 타입 선택</option>
              {BOAT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </section>

        {/* 목표어종 */}
        <section style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', marginBottom: '8px' }}>🐟 목표 어종 (최대 4종)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {FISH_TYPES.map(fish => {
              const selected = targetFish.includes(fish);
              return (
                <button key={fish} onClick={() => toggleFish(fish)} style={{ padding: '6px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '800', backgroundColor: selected ? '#0056D2' : '#F2F2F7', color: selected ? '#fff' : '#555', transition: 'all 0.15s' }}>
                  {selected && '✓ '}{fish}
                </button>
              );
            })}
          </div>
        </section>

        {/* 출조 상세 */}
        <section style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', marginBottom: '10px' }}>📌 출조 상세</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input value={price} onChange={e => setPrice(e.target.value)} placeholder="💰 인당 가격 (예: 인당 12만원)" style={INPUT_STYLE} />
            <input value={schedule} onChange={e => setSchedule(e.target.value)} placeholder="📅 출조 일정 (예: 매주 주말 오전 5시 출항)" style={INPUT_STYLE} />
            <input value={capacity} onChange={e => setCapacity(e.target.value.replace(/[^0-9]/g, ''))} placeholder="👥 모집 인원 (숫자만, 예: 8)" style={INPUT_STYLE} type="number" />
          </div>
        </section>

        {/* 연락처 */}
        <section style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', marginBottom: '8px' }}>📞 직통 연락처 (즉시 전화 연결)</div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#F0F7FF', borderRadius: '12px', padding: '12px 14px', border: '1.5px solid #0056D2' }}>
            <Phone size={18} color="#0056D2" />
            <input
              value={phone}
              onChange={e => {
                // ✅ 전화번호 자동 포맷: 010-1234-5678
                const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                let formatted = digits;
                if (digits.length >= 4 && digits.length <= 7) {
                  formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
                } else if (digits.length > 7) {
                  formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
                }
                setPhone(formatted);
              }}
              placeholder="010-0000-0000"
              type="tel"
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '15px', fontWeight: '800', outline: 'none', color: '#0056D2' }}
            />
          </div>
          {phone && (
            <a href={`tel:${phone}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px', padding: '10px', backgroundColor: '#0056D2', borderRadius: '10px', color: '#fff', fontWeight: '900', fontSize: '13px', textDecoration: 'none' }}>
              <Phone size={14} /> 테스트 통화
            </a>
          )}
        </section>

        {/* 추가 홍보 포인트 */}
        <section style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', marginBottom: '8px' }}>✏️ 추가 홍보 포인트 (선택)</div>
          <textarea value={extraMsg} onChange={e => setExtraMsg(e.target.value)} placeholder="예: 장비 무료 대여 / 점심 도시락 제공..." style={{ ...INPUT_STYLE, minHeight: '60px', resize: 'none' }} />
        </section>

        {/* AI 홍보 문구 생성 */}
        <section style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93' }}>🤖 AI 홍보 문구</div>
            <button
              onClick={handleGenerateAI}
              disabled={!isReady || isGenerating}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '16px', border: 'none', background: isReady ? 'linear-gradient(135deg, #7C3AED, #4F46E5)' : '#f0f0f0', color: isReady ? '#fff' : '#bbb', fontSize: '12px', fontWeight: '800', cursor: isReady ? 'pointer' : 'default' }}
            >
              <Sparkles size={12} />
              {isGenerating ? '생성 중...' : 'AI 자동 생성'}
            </button>
          </div>
          {content ? (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              style={{ ...INPUT_STYLE, minHeight: '160px', resize: 'none', lineHeight: '1.6', whiteSpace: 'pre-line', fontFamily: 'inherit' }}
            />
          ) : (
            <div style={{ height: '72px', backgroundColor: '#F8F9FA', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '12px' }}>
              위 정보 입력 후 'AI 자동 생성'을 눌러주세요
            </div>
          )}
        </section>

        {/* VVIP 전용: 프리미엄 스폰서 등록 체크박스 (마스터만 가능) */}
        {isAdmin && (
          <section
            onClick={() => setIsPinned(prev => !prev)}
            style={{
              borderRadius: '16px', padding: '14px 16px', cursor: 'pointer',
              background: isPinned
                ? 'linear-gradient(135deg, #1A1A2E, #0F3460)'
                : '#fff',
              border: isPinned ? '2px solid #FFD700' : '2px dashed #FFD700',
              transition: 'all 0.2s',
              userSelect: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* 커스텀 체크박스 */}
              <div style={{
                width: '24px', height: '24px', borderRadius: '8px', flexShrink: 0,
                border: isPinned ? 'none' : '2px solid #FFD700',
                background: isPinned ? 'linear-gradient(135deg, #FFD700, #FF9B26)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}>
                {isPinned && <span style={{ fontSize: '14px', fontWeight: '900' }}>✓</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '900', color: isPinned ? '#FFD700' : '#B8860B', marginBottom: '2px' }}>
                  👑 VVIP 프리미엄 스폰서로 등록하기
                </div>
                <div style={{ fontSize: '11px', color: isPinned ? 'rgba(255,215,0,0.8)' : '#999' }}>
                  선상 배 홍보 피드 최상단에 '금빛 테두리 + VVIP 뱃지'로 영구 고정 노출 됩니다
                </div>
                {isAdmin && !isVVIP && (
                  <div style={{ fontSize: '10px', color: '#FF9B26', marginTop: '3px', fontWeight: '700' }}>
                    🔧 마스터 전용 테스트 모드
                  </div>
                )}
              </div>
              {isPinned && <span style={{ fontSize: '18px' }}>📌</span>}
            </div>
          </section>
        )}

        {/* 최종 미리보기 카드 */}
        {isReady && content && (
          <section>
            <div style={{ fontSize: '13px', fontWeight: '900', color: '#8E8E93', marginBottom: '12px', paddingLeft: '4px' }}>📱 등록 후 보여지는 카드 미리보기</div>
            <div style={{ backgroundColor: '#fff', borderRadius: '20px', overflow: 'hidden', border: '1.5px solid #F0F2F7', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '16px', display: 'flex', gap: '14px' }}>
                {coverImage ? (
                  <img src={coverImage} style={{ width: '90px', height: '90px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0 }} alt="커버" />
                ) : (
                  <div style={{ width: '90px', height: '90px', borderRadius: '14px', flexShrink: 0, backgroundColor: '#F2F2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}><Image size={28} /></div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', background: '#FF5A5F', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontWeight: '950' }}>예약 모집중</span>
                    <span style={{ fontSize: '15px', fontWeight: '900', color: '#1A1A2E' }}>{shipName}</span>
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#555', lineHeight: '1.5' }}>{(content || '').slice(0, 52)}...</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11px' }}>
                    <span style={{ background: '#F4F6FA', padding: '4px 10px', borderRadius: '8px', color: '#333' }}>{targetFish.join('/')}</span>
                    <span style={{ background: '#F4F6FA', padding: '4px 10px', borderRadius: '8px', color: '#333' }}>{schedule}</span>
                    <span style={{ background: '#FFF3E0', padding: '4px 10px', borderRadius: '8px', color: '#E65100', fontWeight: '900' }}>인당 {price}</span>
                  </div>
                </div>
              </div>
              {/* CTA 미리보기 */}
              <div style={{ padding: '12px 16px', backgroundColor: '#F8F9FA', borderTop: '1px solid #F0F2F7', display: 'flex', gap: '8px' }}>
                <a href={`tel:${phone}`} onClick={e => e.preventDefault()} style={{ flex: 1, backgroundColor: '#0056D2', color: '#fff', padding: '13px', borderRadius: '12px', fontWeight: '950', fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                  <Phone size={15} fill="#fff" /> 선장님께 즉시 전화
                </a>
                <div style={{ backgroundColor: '#fff', color: '#0056D2', border: '1.5px solid #0056D2', padding: '13px 16px', borderRadius: '12px', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  💬 앱 채팅
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* 하단 고정 등록 버튼 */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', padding: '12px 16px', backgroundColor: '#fff', borderTop: '1px solid #f0f0f0', boxSizing: 'border-box' }}>
        <button
          disabled={!isReady || !content || isSubmitting || !canWrite}
          onClick={handlePostClick}
          style={{
            width: '100%', padding: '15px', borderRadius: '16px', border: 'none',
            background: (isReady && content && canWrite) ? 'linear-gradient(135deg, #0056D2, #0096FF)' : '#f0f0f0',
            color: (isReady && content && canWrite) ? '#fff' : '#bbb',
            fontSize: '15px', fontWeight: '900',
            cursor: (isReady && content && canWrite) ? 'pointer' : 'not-allowed',
            boxShadow: (isReady && content && canWrite) ? '0 6px 18px rgba(0,86,210,0.25)' : 'none'
          }}
        >
          {!canWrite ? '🔒 PRO · VIP · 마스터만 등록 가능' : isSubmitting ? '저장 중...' : isEditMode ? '✅ 홍보글 수정 완료' : '🚢 선상 홍보 카드 등록하기'}
        </button>
      </div>

      {/* PRO/VIP는 광고 게이트 없음 — RewardGateModal 미사용 */}
    </div>
  );
}

const INPUT_STYLE = {
  width: '100%', padding: '11px 13px', borderRadius: '12px',
  border: '1.5px solid #E5E5EA', backgroundColor: '#FAFAFA',
  fontSize: '14px', fontWeight: '600', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit'
};
