/**
 * WriteBusinessPost.jsx — 선상 배 홍보 전용 등록 폼
 * - 배 이름, 항구/지역, 출조 타입, 목표어종, 인원, 가격, 일정, 연락처 구조화 입력
 * - AI 홍보 문구 자동 생성
 * - 커버사진 업로드
 * - 등록 완료 시 businessPosts 피드에 전화 바로 연결되는 카드로 노출
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Phone, Image, Sparkles, ChevronDown, CheckCircle2, MapPin } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';
import { useUserStore } from '../store/useUserStore';
import { RewardGateModal } from '../components/AdUnit';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const FISH_TYPES = ['감성돔', '참돔', '방어', '광어', '대구', '문어', '쭈꾸미', '갑오징어', '우럭', '농어', '삼치', '고등어', '장어'];
const BOAT_TYPES = ['선상낚시', '야간선상', '에깅/문어', '선상루어', '캐스팅', '심해낚시', '갯바위 투어'];
const REGIONS = ['강원 주문진', '강원 속초', '강원 동해', '강원 묵호', '부산 다대포', '부산 기장', '경남 통영', '경남 거제', '경남 사천', '전남 목포', '전남 완도', '전남 여수', '제주 제주시', '제주 서귀포', '인천 인천항', '충남 대천'];

// 완전 자연스러운 AI 홍보문구 자동 생성
function generatePromoText({ shipName, region, boatType, targetFish, price, schedule, capacity, phone, extraMsg }) {
  const fishList = targetFish.join(', ');
  const templates = [
    `🚢 ${region}에서 출발하는 ${shipName}과 함께 ${boatType}을 즐겨보세요! ${fishList} 전문 포인트를 직접 안내해 드립니다.\n\n초보자부터 고수까지 모두 환영! 장비 대여 완비, 친절한 가이드로 최고의 하루를 만들어 드리겠습니다.\n\n📅 일정: ${schedule}\n👥 모집 인원: ${capacity}명\n💰 가격: ${price}\n📞 문의: ${phone}`,
    `✨ [${shipName}] ${boatType} — ${region} 출항\n\n타겟 어종: ${fishList}\n현지 베테랑 선장이 비밀 포인트로 직접 안내합니다. ${extraMsg || '여러분의 첫 대물을 저희와 함께 만나보세요.'}\n\n출조 일정: ${schedule} | 정원: ${capacity}명\n인당 요금: ${price} (미끼·음료 기본 제공)\n즉시 예약: ${phone}`,
    `🎣 ${region} ${boatType} 모집 — ${shipName}\n\n이번 시즌 가장 뜨거운 포인트, ${fishList} 조황 최고조!\n수십 년 경력 선장이 직접 운영하는 소규모 프리미엄 배낚시.\n\n📋 출조 정보\n• 일정: ${schedule}\n• 정원: ${capacity}명 (소수 정예)\n• 요금: ${price}\n• 출발: ${region}  \n📞 선착순 마감! 바로 연락 주세요: ${phone}`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

export default function WriteBusinessPost() {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const user = useUserStore((s) => s.user);
  const isBusinessLite = user?.plan === 'business_lite' || user?.plan === 'pro' || user?.plan === 'vip';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);

  const isReady = shipName && region && boatType && targetFish.length > 0 && price && schedule && capacity && phone;

  const toggleFish = (fish) => {
    setTargetFish(prev =>
      prev.includes(fish) ? prev.filter(f => f !== fish) : (prev.length < 4 ? [...prev, fish] : prev)
    );
  };

  const handleGenerateAI = () => {
    if (!isReady) { addToast('모든 필수 항목을 먼저 입력해주세요.', 'error'); return; }
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generatePromoText({ shipName, region, boatType, targetFish, price, schedule, capacity, phone, extraMsg });
      setContent(generated);
      setIsGenerating(false);
      addToast('✨ AI가 홍보 문구를 완성했습니다!', 'success');
    }, 1200);
  };

  const handlePostClick = () => {
    if (!isReady || !content) { addToast('모든 항목을 입력하고 홍보 문구를 생성해주세요.', 'error'); return; }
    setShowAdGate(true);
  };

  const doPost = async () => {
    setIsSubmitting(true);
    const storedUser = JSON.parse(localStorage.getItem('user')) || { name: '선장님' };
    try {
      const response = await fetch(`${API}/api/community/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: storedUser.name,
          author_email: storedUser.email,
          category: '선상',
          type: 'business',
          shipName,
          region,
          boatType,
          target: targetFish.join('/'),
          price,
          date: schedule,
          capacity: Number(capacity),
          phone,
          content,
          cover: coverImage || `https://images.unsplash.com/photo-1544427920-549b6d60a5e5?auto=format&fit=crop&w=400&q=80`
        })
      });
      if (response.ok) {
        addToast('🚢 선상 배 홍보글이 등록되었습니다!', 'success');
        navigate('/community');
      } else { addToast('등록 중 오류가 발생했습니다.', 'error'); }
    } catch (err) {
      addToast('서버 오류. 잠시 후 다시 시도해주세요.', 'error');
    } finally { setIsSubmitting(false); }
  };

  return (
    <div style={{ backgroundColor: '#F2F2F7', minHeight: '100dvh', paddingBottom: '80px' }}>
      {/* 헤더 */}
      <div style={{ backgroundColor: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none' }}><X size={22} color="#1c1c1e" /></button>
        <h2 style={{ fontSize: '15px', fontWeight: '900', margin: 0 }}>선상 배 홍보 등록</h2>
        <button
          disabled={!isReady || !content || isSubmitting}
          onClick={handlePostClick}
          style={{ border: 'none', background: isReady && content ? '#0056D2' : '#f0f0f0', color: isReady && content ? '#fff' : '#bbb', padding: '6px 14px', borderRadius: '16px', fontSize: '12px', fontWeight: '800', cursor: isReady && content ? 'pointer' : 'default' }}
        >{isSubmitting ? '등록 중...' : '등록 ›'}</button>
      </div>

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
          <input id="cover-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
            const f = e.target.files[0];
            if (f) { const r = new FileReader(); r.onloadend = () => setCoverImage(r.result); r.readAsDataURL(f); }
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
          <div style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', marginBottom: '8px' }}>📞 직통 연락저 (즉시 전화 연결)</div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#F0F7FF', borderRadius: '12px', padding: '12px 14px', border: '1.5px solid #0056D2' }}>
            <Phone size={18} color="#0056D2" />
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000" type="tel" style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '15px', fontWeight: '800', outline: 'none', color: '#0056D2' }} />
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
                  <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#555', lineHeight: '1.5' }}>{content.slice(0, 52)}...</p>
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
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '12px 16px', backgroundColor: '#fff', borderTop: '1px solid #f0f0f0' }}>
        <button
          disabled={!isReady || !content || isSubmitting}
          onClick={handlePostClick}
          style={{ width: '100%', padding: '15px', borderRadius: '16px', border: 'none', background: isReady && content ? 'linear-gradient(135deg, #0056D2, #0096FF)' : '#f0f0f0', color: isReady && content ? '#fff' : '#bbb', fontSize: '15px', fontWeight: '900', cursor: isReady && content ? 'pointer' : 'default', boxShadow: isReady && content ? '0 6px 18px rgba(0,86,210,0.25)' : 'none' }}
        >
          {isSubmitting ? '등록 중...' : '🚢 선상 홍보 카드 등록하기'}
        </button>
      </div>

      <RewardGateModal
        isOpen={showAdGate}
        onClose={() => setShowAdGate(false)}
        onRewardComplete={doPost}
        onSubscribe={() => { setShowAdGate(false); navigate('/subscribe?plan=pro'); }}
        context="post"
      />
    </div>
  );
}

const INPUT_STYLE = {
  width: '100%', padding: '11px 13px', borderRadius: '12px',
  border: '1.5px solid #E5E5EA', backgroundColor: '#FAFAFA',
  fontSize: '14px', fontWeight: '600', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit'
};
