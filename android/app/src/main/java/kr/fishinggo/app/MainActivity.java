package kr.fishinggo.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;

import com.google.android.gms.ads.MobileAds;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // ✅ NATIVE-AD: 인피드 네이티브 광고 플러그인 등록 (super.onCreate 전에 호출)
        registerPlugin(NativeAdPlugin.class);
        super.onCreate(savedInstanceState);

        // ✅ ADMOB-INIT: AdMob SDK 초기화 (광고 로드 전 반드시 호출 필수)
        // initialize() 호출 없이 loadAd() 하면 광고 서버 연결 자체가 불가
        MobileAds.initialize(this, initializationStatus -> {
            android.util.Log.d("AdMob", "AdMob SDK initialized: " + initializationStatus);
        });

        // ✅ 결제 연동: intent:// / market:// URL 처리 (카카오페이, 네이버페이, 토스 등)
        // BridgeWebViewClient 상속 → Capacitor 기본 동작 유지 + 결제 앱 전환 추가
        getBridge().getWebView().setWebViewClient(new BridgeWebViewClient(getBridge()) {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();

                // intent:// URL — 네이티브 결제 앱으로 전환 (카카오, 네이버, 토스 등)
                if (url.startsWith("intent://")) {
                    try {
                        Intent intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                        startActivity(intent);
                        return true;
                    } catch (ActivityNotFoundException e) {
                        // 결제 앱 미설치 시 browser_fallback_url로 폴백
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

        // ✅ BACK-LOCK v2: 뒤로가기 완전 잠금 (Capacitor 콜백보다 나중 등록 → LIFO 우선)
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
