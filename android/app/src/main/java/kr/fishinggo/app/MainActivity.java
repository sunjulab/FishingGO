package kr.fishinggo.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /**
     * ✅ BACK-LOCK: 하드웨어 뒤로가기 완전 비활성화
     * - onBackPressed()를 빈 메서드로 오버라이드 → 아무 동작 없이 이벤트 소비
     * - WebView goBack() 미호출 → 내부 네비게이션 차단
     * - super.onBackPressed() 미호출 → Capacitor JS 이벤트도 미발생
     * - 앱 종료 불가 (홈 버튼으로만 홈 화면 이동 가능)
     */
    @Override
    public void onBackPressed() {
        // 뒤로가기 완전 잠금 — 의도적으로 비워둠 (do nothing)
    }
}
