/**
 * SkeletonCard - 게시글 로딩 중 shimmer 애니메이션 뼈대 UI
 * CSS .skeleton 클래스는 index.css에 정의됨
 */
export default function SkeletonCard({ count = 5 }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="fade-in"
          style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          {/* 작성자 행 */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '12px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 13, width: '45%', borderRadius: 6, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 10, width: '28%', borderRadius: 6 }} />
            </div>
            <div className="skeleton" style={{ width: 52, height: 24, borderRadius: 8 }} />
          </div>

          {/* 본문 */}
          <div className="skeleton" style={{ height: 13, width: '100%', borderRadius: 6, marginBottom: 7 }} />
          <div className="skeleton" style={{ height: 13, width: '88%',  borderRadius: 6, marginBottom: 7 }} />
          <div className="skeleton" style={{ height: 13, width: '65%',  borderRadius: 6, marginBottom: 14 }} />

          {/* 이미지 자리 (랜덤으로 일부만 표시) */}
          {i % 3 === 0 && (
            <div className="skeleton" style={{ height: 160, width: '100%', borderRadius: 12, marginBottom: 14 }} />
          )}

          {/* 하단 액션 바 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="skeleton" style={{ height: 28, width: 60, borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 28, width: 60, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </>
  );
}
