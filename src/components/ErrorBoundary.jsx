import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore';

// ─── 글로벌 에러 바운더리 ────────────────────────────────────────────────────
class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ errorInfo: info });
    if (!import.meta.env.PROD) console.error('[ErrorBoundary] 컴포넌트 오류 감지:', error, info);
  }

  // 홈으로 이동 + 상태 초기화
  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.navigate) this.props.navigate('/');
  };

  // 뒤로가기 + 상태 초기화
  handleGoBack = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.navigate) {
      // ✅ HISTORY-FIX: history가 없으면 홈 폴백 (에러 직후 히스토리 손상 방지)
      if (window.history.length <= 1) {
        this.props.navigate('/', { replace: true });
      } else {
        this.props.navigate(-1);
      }
    }
  };

  render() {
    if (this.state.hasError) {
      const isMaster = this.props.isMaster;

      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100dvh', backgroundColor: '#F8F9FA',
          padding: '32px', textAlign: 'center',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 32px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)',
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
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1c1c1e', marginBottom: '8px' }}>
            잠시 문제가 발생했습니다
          </h2>

          {/* 설명 */}
          <p style={{ fontSize: '14px', color: '#8E8E93', lineHeight: '1.6', marginBottom: '28px', maxWidth: '280px' }}>
            일시적인 오류가 발생했습니다.<br />
            뒤로가거나 홈으로 돌아가서 다시 시도해주세요.
          </p>

          {/* ✅ 뒤로가기 버튼 */}
          <button
            onClick={this.handleGoBack}
            style={{
              padding: '14px 32px', backgroundColor: '#F2F2F7',
              color: '#1c1c1e', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: '700', cursor: 'pointer',
              marginBottom: '10px', width: '100%', maxWidth: '240px'
            }}
          >
            ← 뒤로가기
          </button>

          {/* 홈으로 버튼 */}
          <button
            onClick={this.handleGoHome}
            style={{
              padding: '14px 32px', backgroundColor: '#0056D2',
              color: '#fff', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: '700', cursor: 'pointer',
              marginBottom: '10px', width: '100%', maxWidth: '240px'
            }}
          >
            🏠 홈으로 돌아가기
          </button>

          {/* 새로고침 버튼 */}
          <button
            onClick={() => window.location.reload()} // ✅ 17TH-C2: 의도적 풀 리로드
            style={{
              padding: '14px 32px', backgroundColor: 'transparent',
              color: '#0056D2', border: '1.5px solid #0056D2', borderRadius: '12px',
              fontSize: '15px', fontWeight: '600', cursor: 'pointer',
              width: '100%', maxWidth: '240px'
            }}
          >
            🔄 새로고침
          </button>

          {/* ✅ 오류 상세 — MASTER 계정에만 표시 */}
          {isMaster && this.state.error && (
            <div style={{
              marginTop: '28px', width: '100%', maxWidth: '360px',
              background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: '16px', padding: '16px', textAlign: 'left',
            }}>
              <div style={{ fontSize: '11px', fontWeight: '900', color: '#DC2626', marginBottom: '8px' }}>
                🔐 MASTER 전용 — 오류 상세
              </div>
              <details open>
                <summary style={{ cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#DC2626', marginBottom: '8px' }}>
                  {this.state.error.name}: {this.state.error.message}
                </summary>
                <pre style={{
                  fontSize: '10px', color: '#7F1D1D',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                  background: 'rgba(0,0,0,0.04)', borderRadius: '8px',
                  padding: '10px', margin: '8px 0 0', maxHeight: '200px', overflowY: 'auto',
                  fontFamily: 'monospace', lineHeight: '1.5',
                }}>
                  {this.state.error.stack}
                  {this.state.errorInfo?.componentStack && (
                    '\n\n─── Component Stack ───\n' + this.state.errorInfo.componentStack
                  )}
                </pre>
              </details>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// ✅ 6TH-B7: rules-of-hooks 위반 제거 — ErrorBoundary는 항상 Router 내부에서만 사용됨
function ErrorBoundary(props) {
  const navigate = useNavigate();
  // ✅ MASTER 여부: store에서 직접 읽기 (reactive)
  const isMaster = useUserStore(s =>
    s.user?.id === ADMIN_ID ||
    s.user?.email === ADMIN_EMAIL ||
    s.user?.email === 'sunjulab.k@gmail.com' ||
    s.userTier === 'MASTER'
  );
  return <ErrorBoundaryClass navigate={navigate} isMaster={isMaster} {...props} />;
}

export default ErrorBoundary;
