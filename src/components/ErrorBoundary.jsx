import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore';

// 자동 재시도 횟수 키 (sessionStorage — 탭 닫으면 초기화)
const RETRY_KEY = 'eb_auto_retries';
const MAX_AUTO_RETRIES = 2;

// ─── 글로벌 에러 바운더리 ────────────────────────────────────────────────────
class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, autoRetrying: false };
    this._reloadTimer = null;
  }

  static getDerivedStateFromError(error) {
    // sessionStorage에서 현재 재시도 횟수 확인
    let retries = 0;
    try { retries = parseInt(sessionStorage.getItem(RETRY_KEY) || '0', 10); } catch { }
    const canAutoRetry = retries < MAX_AUTO_RETRIES;
    return { hasError: true, error, autoRetrying: canAutoRetry };
  }

  componentDidCatch(error, info) {
    this.setState({ errorInfo: info });
    if (!import.meta.env.PROD) console.error('[ErrorBoundary] 오류 감지:', error, info);

    // 자동 재시도 처리
    let retries = 0;
    try { retries = parseInt(sessionStorage.getItem(RETRY_KEY) || '0', 10); } catch { }

    if (retries < MAX_AUTO_RETRIES) {
      try { sessionStorage.setItem(RETRY_KEY, String(retries + 1)); } catch { }
      // 800ms 후 자동 새로고침 (스피너가 보이게 약간 딜레이)
      this._reloadTimer = setTimeout(() => window.location.reload(), 800);
    }
  }

  componentWillUnmount() {
    if (this._reloadTimer) clearTimeout(this._reloadTimer);
  }

  // 홈으로 이동 + 상태 초기화
  handleGoHome = () => {
    try { sessionStorage.removeItem(RETRY_KEY); } catch { }
    this.setState({ hasError: false, error: null, errorInfo: null, autoRetrying: false });
    if (this.props.navigate) this.props.navigate('/');
  };

  // 뒤로가기 + 상태 초기화
  handleGoBack = () => {
    try { sessionStorage.removeItem(RETRY_KEY); } catch { }
    this.setState({ hasError: false, error: null, errorInfo: null, autoRetrying: false });
    if (this.props.navigate) {
      // ✅ HISTORY-FIX: history가 없으면 홈 폴백 (에러 직후 히스토리 손상 방지)
      if (window.history.length <= 1) {
        this.props.navigate('/', { replace: true });
      } else {
        this.props.navigate(-1);
      }
    }
  };

  // 수동 새로고침 (재시도 카운트 초기화 후 reload)
  handleManualReload = () => {
    try { sessionStorage.removeItem(RETRY_KEY); } catch { }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {

      // ── 자동 재시도 중: 로딩 스피너만 표시 ──────────────────
      if (this.state.autoRetrying) {
        let retries = 0;
        try { retries = parseInt(sessionStorage.getItem(RETRY_KEY) || '0', 10); } catch { }
        return (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '100dvh', backgroundColor: '#F8F9FA',
          }}>
            {/* 회전 스피너 */}
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              border: '4px solid #E5E5EA', borderTopColor: '#0056D2',
              animation: 'spin 0.8s linear infinite', marginBottom: '20px',
            }} />
            <p style={{ fontSize: '15px', fontWeight: '800', color: '#1c1c1e', marginBottom: '6px' }}>
              🎣 재연결 중...
            </p>
            <p style={{ fontSize: '12px', color: '#8E8E93', fontWeight: '600' }}>
              자동 복구 시도 중 ({retries}/{MAX_AUTO_RETRIES})
            </p>
          </div>
        );
      }

      // ── 재시도 모두 실패: 오류 화면 표시 ─────────────────────
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
            자동 복구를 {MAX_AUTO_RETRIES}회 시도했지만 실패했습니다.<br />
            아래 버튼을 눌러 다시 시도해주세요.
          </p>

          {/* 뒤로가기 버튼 */}
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
            onClick={this.handleManualReload}
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

    // 정상 렌더: 재시도 카운터 초기화
    try { sessionStorage.removeItem(RETRY_KEY); } catch { }
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
