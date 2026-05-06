import React from 'react'; // ✅ 9TH-C2: JSX 명시적 React import 추가 (일관성)
/**
 * ✅ 18TH-C1: JSDoc /** 시작 기호 추가 — 기존 * 단독 시작으로 주석 미인식 수정
 * ENH4-A4: 공통 LoadingSpinner 컴포넌트
 * — PostDetail, App 등 인라인 스피너 패턴을 단일 컴포넌트로 통일
 * — index.css의 전역 @keyframes spin 사용 (중복 인라인 <style> 제거)
 *
 * @param {object} props
 * @param {string} [props.size='40px'] — 스피너 크기
 * @param {string} [props.color='#0056D2'] — 스피너 색상
 * @param {string} [props.label='불러오는 중...'] — 하단 텍스트 (null이면 미표시)
 * @param {object} [props.style] — 컨테이너 추가 스타일
 */
export default function LoadingSpinner({ size = '40px', color = '#0056D2', label = '불러오는 중...', style }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        minHeight: '200px', // ✅ 4TH-C4: style prop 미전달 시 height:0 방지 — PageLoading 등 외부 style로 오버라이드 가능
        ...style,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          border: `3px solid ${color}`,
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {label && (
        <span style={{ fontSize: '13px', color: '#8E8E93', fontWeight: '800' }}>
          {label}
        </span>
      )}
    </div>
  );
}
