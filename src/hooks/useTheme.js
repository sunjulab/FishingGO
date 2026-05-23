/**
 * useTheme.js — 다크/라이트 모드 색상 토큰 훅
 *
 * [사용법]
 *   const T = useTheme();
 *   <div style={{ background: T.bg, color: T.text }}>
 *
 * [동작]
 *   - MutationObserver로 html[data-theme] 속성 변경 감지
 *   - 변경 즉시 리렌더 → 인라인 style 색상 자동 전환
 *   - 라이트(기본) / 다크 2종 토큰 세트 제공
 */
import { useState, useEffect } from 'react';

const LIGHT = {
  // ── 배경
  bg:          '#F8F9FA',   // 페이지 전체 배경
  bgDeep:      '#FFFFFF',   // 카드/모달 배경
  card:        '#FFFFFF',   // 카드
  cardSub:     '#F2F2F7',   // 2차 카드, 입력 배경
  input:       '#F8F9FA',   // 인풋 배경
  overlay:     'rgba(0,0,0,0.5)',  // 딤 레이어

  // ── 텍스트
  text:        '#1C1C1E',   // 본문
  textSub:     '#8E8E93',   // 보조
  textLight:   '#C7C7CC',   // 힌트/비활성
  textInvert:  '#FFFFFF',   // 반전 (어두운 배경 위)

  // ── 구분선/경계
  border:      '#F2F2F7',
  borderMid:   '#E5E5EA',
  borderStrong:'#D1D1D6',

  // ── 프라이머리
  primary:     '#0056D2',
  primaryBg:   'rgba(0,86,210,0.08)',
  primaryLight: '#EBF2FF',

  // ── 상태 색상
  success:     '#00C48C',
  successBg:   'rgba(0,196,140,0.1)',
  danger:      '#FF3B30',
  dangerBg:    'rgba(255,59,48,0.08)',
  warn:        '#FF9B26',
  warnBg:      'rgba(255,155,38,0.1)',

  // ── 전용 섹션
  navBg:       'rgba(255,255,255,0.85)',
  headerBg:    'rgba(255,255,255,0.85)',
  shimmer1:    '#f0f0f0',
  shimmer2:    '#e8e8e8',

  isDark: false,
};

const DARK = {
  // ── 배경
  bg:          '#000000',
  bgDeep:      '#000000',
  card:        '#1C1C1E',
  cardSub:     '#2C2C2E',
  input:       '#2C2C2E',
  overlay:     'rgba(0,0,0,0.85)',

  // ── 텍스트
  text:        '#F2F2F7',
  textSub:     '#AEAEB2',
  textLight:   '#636366',
  textInvert:  '#000000',

  // ── 구분선/경계
  border:      '#2C2C2E',
  borderMid:   '#3A3A3C',
  borderStrong:'#48484A',

  // ── 프라이머리
  primary:     '#4A9EFF',
  primaryBg:   'rgba(74,158,255,0.12)',
  primaryLight: 'rgba(74,158,255,0.1)',

  // ── 상태 색상
  success:     '#30D158',
  successBg:   'rgba(48,209,88,0.12)',
  danger:      '#FF453A',
  dangerBg:    'rgba(255,69,58,0.12)',
  warn:        '#FFD60A',
  warnBg:      'rgba(255,214,10,0.12)',

  // ── 전용 섹션
  navBg:       'rgba(18,18,18,0.92)',
  headerBg:    'rgba(12,12,12,0.92)',
  shimmer1:    '#2C2C2E',
  shimmer2:    '#3A3A3C',

  isDark: true,
};

function getCurrentTheme() {
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'dark' ? DARK : LIGHT;
}

export function useTheme() {
  const [theme, setTheme] = useState(getCurrentTheme);

  useEffect(() => {
    const obs = new MutationObserver(() => {
      setTheme(getCurrentTheme());
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => obs.disconnect();
  }, []);

  return theme;
}

// 색상 토큰 직접 참조 (non-reactive, 초기값용)
export { LIGHT, DARK };
