/**
 * AdUnit.jsx - Fishing GO 광고 통합 모듈
 * 
 * [광고 정지 방지 규칙 적용 현황]
 * 1. 배너 자동 새로고침 최소 60초 간격 (Google 정책)
 * 2. 광고 클릭 유도 문구/화살표 금지
 * 3. 배너와 전면 광고 동시 렌더링 금지
 * 4. 광고 영역 위/아래 빈 공간(padding) 최소 8px 확보
 * 5. 광고 영역 숨김(hidden/opacity 0) 금지 - 테스트 키에서 실제 키로 교체만 하면 됨
 * 6. 보상형 광고는 반드시 유저 자발적 클릭으로만 노출
 * 
 * [키 교체 방법]
 * - 현재: 구글 공식 테스트 코드 (ca-pub-3940256099942544 / 테스트 슬롯)
 * - 실제 전환: VITE_ADSENSE_PUB_ID, VITE_ADSENSE_SLOT_BANNER 등 .env에 추가 후 아래 변수만 교체
 */
import React, { useEffect, useRef, useState } from 'react';

// ─── 광고 키 설정 (테스트 키 → 실제 키 교체 시 이곳만 수정) ───
const PUB_ID   = import.meta.env.VITE_ADSENSE_PUB_ID   || 'ca-pub-3940256099942544'; // 구글 공식 테스트 퍼블리셔
const SLOT_BANNER  = import.meta.env.VITE_ADSENSE_SLOT_BANNER  || '6300978111'; // 테스트 배너 슬롯
const SLOT_NATIVE  = import.meta.env.VITE_ADSENSE_SLOT_NATIVE  || '2247696314'; // 테스트 인피드 슬롯

// ─── 구글 애드센스 스크립트 1회 로드 유틸 (중복 방지) ───
let adSenseLoaded = false;
function loadAdSense() {
  if (adSenseLoaded || document.getElementById('adsense-script')) return;
  const script = document.createElement('script');
  script.id = 'adsense-script';
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUB_ID}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
  adSenseLoaded = true;
}

// ─── 공통 광고 렌더 훅 ───
function useAdPush(ref) {
  useEffect(() => {
    loadAdSense();
    try {
      const adsbygoogle = window.adsbygoogle || [];
      adsbygoogle.push({});
    } catch (e) { /* 테스트 환경 무시 */ }
  }, []);
}

// ─────────────────────────────────────────────────────────────────
//  1. 배너 광고 (하단 고정 or 섹션 사이 삽입형)
//  [정지 방지] 레이아웃 내부에 자연스럽게 녹아들게 배치 필수
// ─────────────────────────────────────────────────────────────────
export function BannerAd({ style = {} }) {
  const ref = useRef();
  useAdPush(ref);
  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        minHeight: '60px',
        overflow: 'hidden',
        margin: '8px 0',       // [정지 방지] 위아래 8px 여백 필수
        borderRadius: '12px',
        ...style
      }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minHeight: '60px' }}
        data-ad-client={PUB_ID}
        data-ad-slot={SLOT_BANNER}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  2. 네이티브(인피드) 광고 — 피드 사이 자연스러운 카드형
//  [정지 방지] 'Sponsored' 또는 'AD' 라벨 반드시 표시
// ─────────────────────────────────────────────────────────────────
export function NativeAd({ style = {} }) {
  const ref = useRef();
  useAdPush(ref);
  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        margin: '4px 0 12px',
        borderRadius: '16px',
        overflow: 'hidden',
        ...style
      }}
    >
      {/* [정지 방지] 광고임을 명시하는 라벨 — 삭제 절대 금지 */}
      <div style={{ fontSize: '10px', color: '#aaa', fontWeight: '700', padding: '4px 8px', textAlign: 'right' }}>
        광고 · Sponsored
      </div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-format="fluid"
        data-ad-layout="in-article"
        data-ad-client={PUB_ID}
        data-ad-slot={SLOT_NATIVE}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  3. 보상형 광고 게이트 모달 (영상 시청 or 유료 구독)
//  [정지 방지] 유저 자발적 선택만 허용 — 강제 팝업 금지
// ─────────────────────────────────────────────────────────────────
export function RewardGateModal({ isOpen, onClose, onRewardComplete, onSubscribe, context = 'post' }) {
  const [adWatching, setAdWatching] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [adDone, setAdDone] = useState(false);

  const CONTEXT_TEXT = {
    post:  { title: '🎣 게시글 무료 등록', action: '글 등록 완료!' },
    crew:  { title: '🏕️ 크루 방 무료 개설', action: '크루 개설 완료!' },
  };
  const ctx = CONTEXT_TEXT[context] || CONTEXT_TEXT.post;

  // [정지 방지] 광고 시청은 타이머 기반 시뮬레이션 (실제 애드몹 SDK 연동 시 교체)
  const handleWatchAd = () => {
    setAdWatching(true);
    setAdProgress(0);
    const interval = setInterval(() => {
      setAdProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setAdWatching(false);
          setAdDone(true);
          return 100;
        }
        return prev + (100 / 30); // 30초 광고
      });
    }, 1000);
  };

  const handleComplete = () => {
    onRewardComplete();
    onClose();
    setAdDone(false);
    setAdProgress(0);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div style={{
        width: '100%', maxWidth: '480px', backgroundColor: '#fff',
        borderRadius: '24px 24px 0 0', padding: '28px 24px 40px',
        animation: 'slideUp 0.3s ease'
      }}>
        {/* 핸들 */}
        <div style={{ width: '40px', height: '4px', backgroundColor: '#E5E5EA', borderRadius: '2px', margin: '0 auto 20px' }} />
        
        <h2 style={{ fontSize: '22px', fontWeight: '900', textAlign: 'center', marginBottom: '6px' }}>
          {ctx.title}
        </h2>
        <p style={{ fontSize: '14px', color: '#888', textAlign: 'center', marginBottom: '28px' }}>
          무료로 이용하거나 PRO / VVIP를 구독하세요
        </p>

        {/* 옵션 1: 비즈니스 라이트 구독 */}
        <div
          onClick={onSubscribe}
          style={{
            background: 'linear-gradient(135deg, #0056D2, #0096FF)',
            borderRadius: '18px', padding: '20px',
            color: '#fff', cursor: 'pointer', marginBottom: '12px',
            boxShadow: '0 8px 24px rgba(0,86,210,0.35)',
            transition: 'transform 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.85, fontWeight: '700', marginBottom: '4px' }}>👑 PRO / VVIP</div>
              <div style={{ fontSize: '18px', fontWeight: '900', marginBottom: '4px' }}>광고 없이 무제한 등록</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>광고 없이 무제한 등록 · 무료 게시글 작성 횟수 제한 없음</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
              <div style={{ fontSize: '22px', fontWeight: '900' }}>₩9,900</div>
              <div style={{ fontSize: '11px', opacity: 0.85 }}>/월 구독</div>
            </div>
          </div>
          <div style={{ marginTop: '14px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '10px 16px', fontSize: '14px', fontWeight: '800', textAlign: 'center' }}>
            🚀 지금 구독하고 바로 등록하기
          </div>
        </div>

        {/* 옵션 2: 무료 광고 시청 */}
        {!adDone ? (
          <div style={{ border: '1.5px solid #E5E5EA', borderRadius: '18px', padding: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '4px', color: '#1c1c1e' }}>
              📺 30초 광고 시청 후 무료 등록
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
              광고를 시청하면 1회 무료로 이용하실 수 있어요.
            </div>

            {adWatching ? (
              <div>
                {/* [정지 방지] 광고 슬롯 — 시청 중 배너 표시 */}
                <div style={{ backgroundColor: '#F2F2F7', borderRadius: '12px', padding: '12px', marginBottom: '12px', textAlign: 'center', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ins
                    className="adsbygoogle"
                    style={{ display: 'block', width: '100%', minHeight: '60px' }}
                    data-ad-client={PUB_ID}
                    data-ad-slot={SLOT_BANNER}
                    data-ad-format="auto"
                    data-full-width-responsive="true"
                  />
                </div>
                {/* 진행 바 */}
                <div style={{ height: '6px', backgroundColor: '#F2F2F7', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ height: '100%', width: `${adProgress}%`, backgroundColor: '#0056D2', borderRadius: '3px', transition: 'width 0.9s linear' }} />
                </div>
                <div style={{ fontSize: '12px', color: '#888', textAlign: 'center' }}>
                  {Math.ceil(30 - (adProgress / 100) * 30)}초 후 완료...
                </div>
              </div>
            ) : (
              <button
                onClick={handleWatchAd}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #0056D2', backgroundColor: 'rgba(0,86,210,0.05)', color: '#0056D2', fontSize: '15px', fontWeight: '800', cursor: 'pointer' }}
              >
                📺 광고 시청하기
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={handleComplete}
            style={{ width: '100%', padding: '16px', borderRadius: '18px', border: 'none', backgroundColor: '#00C48C', color: '#fff', fontSize: '17px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,196,140,0.3)' }}
          >
            ✅ 시청 완료! {ctx.action}
          </button>
        )}

        {/* 닫기 */}
        <button
          onClick={onClose}
          style={{ width: '100%', marginTop: '12px', padding: '14px', border: 'none', background: 'none', color: '#aaa', fontSize: '14px', cursor: 'pointer', fontWeight: '600' }}
        >
          취소
        </button>
      </div>
    </div>
  );
}
