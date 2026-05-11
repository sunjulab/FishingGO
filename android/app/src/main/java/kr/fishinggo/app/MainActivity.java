package kr.fishinggo.app;

import com.getcapacitor.BridgeActivity;
import android.webkit.WebView;

public class MainActivity extends BridgeActivity {

    /**
     * ✅ BACK-FIX: 하드웨어 뒤로가기 완전 제어
     * - WebView에 히스토리가 있으면(React Router pushState 포함) → webView.goBack()
     * - 홈 화면(최상위)이면 → super.onBackPressed() → Capacitor JS 'backButton' 이벤트 발생
     *   → JS에서 "한 번 더 누르면 종료" 토스트 처리
     */
    @Override
    public void onBackPressed() {
        WebView webView = (getBridge() != null) ? getBridge().getWebView() : null;
        if (webView != null && webView.canGoBack()) {
            webView.goBack();   // React Router popstate 자동 반응 → navigate 불필요
        } else {
            super.onBackPressed();  // Capacitor → JS backButton 이벤트 발생
        }
    }
}

