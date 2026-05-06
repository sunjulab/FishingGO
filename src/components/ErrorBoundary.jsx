import React from 'react';
import { useNavigate } from 'react-router-dom';

// ─── 글로벌 에러 바운더리 ────────────────────────────────────────────────────
// React 컴포넌트 트리에서 발생하는 오류를 잡아 화면 전체가 흰 화면이 되는 것을 방지합니다.
class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // 오류 리포팅 (추후 Sentry 등 연동 가능)
    if (!import.meta.env.PROD) console.error('[ErrorBoundary] 컴포넌트 오류 감지:', error, info);
  }

  // NEW-B6: window.location.href 풀 리로드 → React state 리셋 + Router 내부 이동
  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.navigate) {
      this.props.navigate('/');
    }
    // ENH5-C4: navigate prop이 없는 경우 리셋만 수행 (ErrorBoundary는 항상 Router 안에 래핑됨)
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', backgroundColor: '#F8F9FA',
          padding: '32px', textAlign: 'center'
        }}>
          {/* 아이콘 */}
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            backgroundColor: '#FFF0F0', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '32px', marginBottom: '20px'
          }}>
            🎣
          </div>

          {/* 제목 */}
          <h2 style={{
            fontSize: '20px', fontWeight: '800', color: '#1c1c1e',
            marginBottom: '8px'
          }}>
            잠시 문제가 발생했습니다
          </h2>

          {/* 설명 */}
          <p style={{
            fontSize: '14px', color: '#8E8E93', lineHeight: '1.6',
            marginBottom: '28px', maxWidth: '280px'
          }}>
            {/* ✅ 6TH-C6: {'\\n'} 줄바꿼 제거 — JSX에서는 실제 개행이 적용 안 됨, br 태그로 교체 */}
            일시적인 오류가 발생했습니다.<br />
            홈으로 돌아가서 다시 시도해주세요.
          </p>

          {/* 홈으로 버튼 */}
          <button
            onClick={this.handleReset}
            style={{
              padding: '14px 32px',
              backgroundColor: '#0056D2',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              marginBottom: '12px',
              width: '100%',
              maxWidth: '240px'
            }}
          >
            🏠 홈으로 돌아가기
          </button>

          {/* 새로고침 버튼 */}
          <button
            onClick={() => window.location.reload()} // ✅ 17TH-C2: 의도적 풀 리로드 — ErrorBoundary 복구 시 React 트리 전체 초기화가 목적이므로 navigate() 대신 reload() 사용이 정당함
            style={{
              padding: '14px 32px',
              backgroundColor: 'transparent',
              color: '#0056D2',
              border: '1.5px solid #0056D2',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
              maxWidth: '240px'
            }}
          >
            🔄 새로고침
          </button>

          {/* 오류 코드 (개발자용) */}
          {!import.meta.env.PROD && this.state.error && (
            <details style={{ marginTop: '24px', fontSize: '11px', color: '#C7C7CC', maxWidth: '320px' }}>
              <summary style={{ cursor: 'pointer' }}>오류 상세보기</summary>
              <pre style={{ textAlign: 'left', marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// ✅ 6TH-B7: rules-of-hooks 위반 제거 — ErrorBoundary는 항상 Router 내부에서만 사용됨
// (App.jsx에서 <Router> 최상위 래핑 확인) — try/catch 조건부 호출 제거, 직접 useNavigate 호출
function ErrorBoundary(props) {
  const navigate = useNavigate();
  return <ErrorBoundaryClass navigate={navigate} {...props} />;
}

export default ErrorBoundary;
