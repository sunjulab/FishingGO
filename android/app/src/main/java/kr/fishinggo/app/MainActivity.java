package kr.fishinggo.app;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /**
     * ✅ BACK-LOCK v2: Android 전 버전 뒤로가기 완전 차단
     *
     * [Android 12+ / API 33+]
     * - onBackPressed()는 deprecated → 호출되지 않음
     * - OnBackPressedDispatcher가 LIFO(Last In First Out)로 콜백 실행
     * - super.onCreate() 이후 콜백 등록 → Capacitor 콜백보다 나중 등록 → 먼저 실행
     * - enabled=true + handleOnBackPressed()에서 아무것도 안 함 → 이벤트 소비, 전파 중단
     *
     * [Android 11 이하 / API 32-]
     * - onBackPressed() 오버라이드로 처리
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState); // Capacitor 콜백 등록됨

        // Capacitor 콜백보다 나중에 등록 → LIFO에 의해 먼저 실행 → 이벤트 소비
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                // 뒤로가기 완전 잠금: 아무 동작 없이 이벤트 소비 (앱 내 전파 없음)
            }
        });
    }

    /** Android 11 이하(API 32-) 대응 */
    @Override
    public void onBackPressed() {
        // 뒤로가기 완전 잠금
    }
}
