import { useTheme } from '../hooks/useTheme';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../api/index';

// ─── helpers ──────────────────────────────────────────────────────────────────
// ✅ FIX-TZ: KST(UTC+9) 기준 날짜 코드 — toISOString()은 UTC이어서 한국에서 오후 6시 리셋 버그 방지
function getTodayKST() {
  const kstMs = Date.now() + 9 * 60 * 60 * 1000;
  return new Date(kstMs).toISOString().slice(0, 10); // 'YYYY-MM-DD' KST 기준
}
function getTodayKey(noticeId) {
  return 'popup_hidden_' + noticeId + '_' + getTodayKST();
}
function isHiddenToday(noticeId) {
  try { return !!localStorage.getItem(getTodayKey(noticeId)); } catch { return false; }
}
function getHideAllKey() {
  return 'popup_hidden_all_' + getTodayKST(); // ✅ FIX-TZ: KST 기준
}


// ─── AnnouncementPopup ────────────────────────────────────────────────────────
// 앱 시작 시 image 필드가 있는 공지를 carousel 팝업으로 노출.
// - 여러 공지는 좌우 화살표 + dot 인디케이터로 순서대로 탐색
// - "오늘 하루 안 보기": 해당 공지 ID + 날짜 키로 localStorage 저장
// - "모두 닫기": 오늘 전체 숨김
// - 이미지/제목/자세히보기 클릭 시 해당 공지 상세로 navigate
export default function AnnouncementPopup() {
  const T = useTheme(); // ✅ DARK-MODE
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);   // 팝업 대상 공지 배열
  const [idx, setIdx] = useState(0);             // 현재 표시 인덱스
  const [hideToday, setHideToday] = useState(false);
  const [visible, setVisible] = useState(false);

  // ── 공지 목록 로드 (마운트 1회) ──────────────────────────────────────────
  useEffect(() => {
    try { if (localStorage.getItem(getHideAllKey())) return; } catch { /* ok */ }

    apiClient.get('/api/community/notices')
      .then(res => {
        const all = Array.isArray(res.data) ? res.data : [];
        const popups = all
          // ✅ FIX-POPUP: isPopup=true OR image 있는 공지 표시 (하위호환)
          // 기존 공지(isPopup 체크 전 작성)도 이미지가 있으면 팝업으로 노출
          .filter(n => (n.isPopup || n.image) && !isHiddenToday(String(n._id || n.id)))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (popups.length > 0) {
          setNotices(popups);
          setVisible(true);
        }
      })
      .catch(() => { /* 팝업 로드 실패 무시 */ });
  }, []);

  // ── 닫기 (개별 "오늘 안보기" 처리 후 다음 팝업으로) ──────────────────────
  const handleClose = useCallback(() => {
    if (hideToday) {
      try {
        const cur = notices[idx];
        if (cur) localStorage.setItem(getTodayKey(String(cur._id || cur.id)), '1');
      } catch { /* ok */ }
    }
    const remaining = notices.filter((_, i) => i !== idx);
    if (remaining.length > 0) {
      setNotices(remaining);
      setIdx(0);
      setHideToday(false);
    } else {
      setVisible(false);
    }
  }, [hideToday, notices, idx]);

  // ── 전체 오늘 안보기 ──────────────────────────────────────────────────────
  const handleHideAll = useCallback(() => {
    try {
      localStorage.setItem(getHideAllKey(), '1');
      notices.forEach(n => localStorage.setItem(getTodayKey(String(n._id || n.id)), '1'));
    } catch { /* ok */ }
    setVisible(false);
  }, [notices]);

  // ── 공지 상세 이동 ────────────────────────────────────────────────────────
  const handleNoticeClick = useCallback(() => {
    const n = notices[idx];
    if (!n) return;
    setVisible(false);
    navigate('/notice/' + String(n._id || n.id), { state: { notice: n } });
  }, [notices, idx, navigate]);

  // ── carousel 이동 ─────────────────────────────────────────────────────────
  const goPrev = useCallback((e) => {
    e.stopPropagation();
    setIdx(i => Math.max(0, i - 1));
    setHideToday(false);
  }, []);

  const goNext = useCallback((e) => {
    e.stopPropagation();
    setIdx(i => Math.min(notices.length - 1, i + 1));
    setHideToday(false);
  }, [notices.length]);

  if (!visible || notices.length === 0) return null;

  const notice = notices[idx];
  const total = notices.length;

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '400px',
          background: T.card,
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          position: 'relative',
        }}
      >
        {/* ── 헤더 ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '1px solid #F0F0F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: '#FF3B30', color: '#fff', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', padding: '3px 8px', borderRadius: '6px' }}>
              📢 공지
            </span>
            {notice.isPinned && (
              <span style={{ background: '#FFF1F0', color: '#FF3B30', fontSize: `calc(10px * var(--fs, 1))`, fontWeight: '900', padding: '3px 8px', borderRadius: '6px', border: '1px solid #FFCCC7' }}>
                📌 필독
              </span>
            )}
          </div>
          {total > 1 && (
            <span style={{ fontSize: `calc(12px * var(--fs, 1))`, color: T.textLight, fontWeight: '700' }}>
              {idx + 1} / {total}
            </span>
          )}
          <button onClick={handleClose} style={{ background: T.cardSub, border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="#555" />
          </button>
        </div>

        {/* ── 이미지 (클릭시 공지로 이동) ── */}
        <div onClick={handleNoticeClick} style={{ position: 'relative', cursor: 'pointer', userSelect: 'none' }}>
          <img
            src={Array.isArray(notice.images) && notice.images.length > 0 ? notice.images[0] : notice.image}
            alt={notice.title}
            loading="lazy"
            style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.style.display = 'none'; }}
          />

          {/* carousel 화살표 */}
          {total > 1 && (
            <>
              {idx > 0 && (
                <button onClick={goPrev} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: T.overlay, border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeft size={18} color="#fff" />
                </button>
              )}
              {idx < total - 1 && (
                <button onClick={goNext} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: T.overlay, border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={18} color="#fff" />
                </button>
              )}
              {/* dot 인디케이터 */}
              <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px' }}>
                {notices.map((_, i) => (
                  <div key={i} style={{ width: i === idx ? '18px' : '6px', height: '6px', borderRadius: '3px', background: i === idx ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'all 0.25s ease' }} />
                ))}
              </div>
            </>
          )}

          {/* 이미지 위 힌트 오버레이 */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.55))', padding: '24px 16px 12px', pointerEvents: 'none' }}>
            <div style={{ color: '#fff', fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', opacity: 0.9 }}>탭하여 자세히 보기 →</div>
          </div>
        </div>

        {/* ── 제목 + 내용 요약 ── */}
        <div onClick={handleNoticeClick} style={{ padding: '16px 20px 12px', cursor: 'pointer' }}>
          <h2 style={{ fontSize: `calc(17px * var(--fs, 1))`, fontWeight: '950', color: T.text, margin: '0 0 8px', lineHeight: '1.4', wordBreak: 'keep-all' }}>
            {notice.title}
          </h2>
          <p style={{ fontSize: `calc(13px * var(--fs, 1))`, color: T.textSub, lineHeight: '1.6', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {notice.content}
          </p>
        </div>

        {/* ── 하단 액션 ── */}
        <div style={{ padding: '12px 20px 20px', borderTop: '1px solid #F8F8F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          {/* 오늘 하루 안 보기 */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', flex: 1 }}>
            <div
              onClick={() => setHideToday(v => !v)}
              style={{ width: '20px', height: '20px', borderRadius: '5px', border: '2px solid ' + (hideToday ? '#0056D2' : '#C7C7CC'), background: hideToday ? '#0056D2' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}
            >
              {hideToday && (
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                  <path d="M1 4L4 7L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: `calc(13px * var(--fs, 1))`, color: T.textSub, fontWeight: '700' }}>오늘 하루 안 보기</span>
          </label>

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {total > 1 && (
              <button onClick={handleHideAll} style={{ padding: '9px 12px', border: `1.5px solid ${T.borderMid}`, borderRadius: '12px', background: T.card, fontSize: `calc(12px * var(--fs, 1))`, fontWeight: '800', color: T.textSub, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                모두 닫기
              </button>
            )}
            <button onClick={handleClose} style={{ padding: '9px 16px', border: 'none', borderRadius: '12px', background: T.cardSub, fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '800', color: T.textSub, cursor: 'pointer' }}>
              닫기
            </button>
            <button onClick={handleNoticeClick} style={{ padding: '9px 16px', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #0056D2, #003FA3)', fontSize: `calc(13px * var(--fs, 1))`, fontWeight: '900', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,86,210,0.3)' }}>
              자세히 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
