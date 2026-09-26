package kr.fishinggo.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;

import com.google.android.gms.ads.MobileAds;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.EdgeToEdge;
import androidx.core.graphics.Insets;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.ViewCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // ✅ EDGE-TO-EDGE (Android 15 대응): 지원 중단된 setStatusBarColor/setNavigationBarColor 대신
        // WindowCompat + EdgeToEdge API 사용 → Android 15 경고 해소
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Android 15(API 35)에서 지원 중단된 상태바/네비바 색상 직접 지정 방식 대신
        // 시스템이 자동으로 투명하게 처리하도록 위임 (Edge-to-Edge 표준)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setStatusBarContrastEnforced(false);
            getWindow().setNavigationBarContrastEnforced(false);
        }

        // ✅ NATIVE-AD: 인피드 네이티브 광고 플러그인 등록 (super.onCreate 전에 호출)
        registerPlugin(NativeAdPlugin.class);
        super.onCreate(savedInstanceState);

        // ✅ ADMOB-INIT: AdMob SDK 초기화 (광고 로드 전 반드시 호출 필수)
        MobileAds.initialize(this, initializationStatus -> {
            android.util.Log.d("AdMob", "AdMob SDK initialized: " + initializationStatus);
        });

        // ✅ 결제 연동: intent:// / market:// URL 처리 (카카오페이, 네이버페이, 토스 등)
        getBridge().getWebView().setWebViewClient(new BridgeWebViewClient(getBridge()) {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();

                // intent:// URL — 네이티브 결제 앱으로 전환
                if (url.startsWith("intent://")) {
                    try {
                        Intent intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                        if (Intent.ACTION_SEND.equals(intent.getAction())) {
                            startActivity(Intent.createChooser(intent, "공유하기"));
                        } else {
                            startActivity(intent);
                        }
                        return true;
                    } catch (ActivityNotFoundException e) {
                        String fallback = request.getUrl().getQueryParameter("browser_fallback_url");
                        if (fallback != null && !fallback.isEmpty()) {
                            view.loadUrl(fallback);
                        }
                        return true;
                    } catch (Exception e) {
                        return false;
                    }
                }

                // market:// URL — Play Store 이동
                if (url.startsWith("market://")) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                        return true;
                    } catch (Exception e) {
                        return false;
                    }
                }

                return super.shouldOverrideUrlLoading(view, request);
            }
        });

        // ✅ BACK-LOCK v2: 뒤로가기 완전 잠금
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                // 이벤트 소비, 전파 없음
            }
        });
    }

    /** Android 11 이하(API 32-) 대응 */
    @Override
    public void onBackPressed() {
        // 뒤로가기 완전 잠금
    }
}
