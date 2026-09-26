# ✅ FishingGO ProGuard Rules — Capacitor + React WebView + AdMob
# ✅ DEX 최적화 개선 (2026-09-26): 불필요한 -keep 범위 축소로 난독화/최적화/축소 비율 향상

# ── 디버그 정보 유지 (비정상 종료 분석용) ──────────────────────────
-keepattributes SourceFile,LineNumberTable
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
-keepattributes InnerClasses

# ── 소스 파일명 숨김 ──────────────────────────────────────────────
-renamesourcefileattribute SourceFile

# ── FishingGO App Package (최소 범위로 축소) ───────────────────────
-keep class kr.fishinggo.app.MainActivity { *; }
-keep class kr.fishinggo.app.NativeAdPlugin { *; }
-keep class kr.fishinggo.app.** extends com.getcapacitor.Plugin { *; }

# ── Capacitor Core (인터페이스만 보호, 내부 구현은 최적화 허용) ────
-keep public class com.getcapacitor.BridgeActivity { *; }
-keep public class com.getcapacitor.BridgeWebViewClient { *; }
-keep public class com.getcapacitor.Bridge { *; }
-keep public class com.getcapacitor.Plugin { *; }
-keep public class com.getcapacitor.PluginCall { *; }
-keep public class com.getcapacitor.JSObject { *; }
-keep public class com.getcapacitor.JSArray { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { *; }
-keep @com.getcapacitor.annotation.PluginMethod public class * { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.annotation.PluginMethod <methods>;
}
-dontwarn com.getcapacitor.**

# ── Cordova (결제 플러그인용, 핵심 클래스만 보호) ──────────────────
-keep class org.apache.cordova.CordovaPlugin { *; }
-keep class org.apache.cordova.CordovaInterface { *; }
-keep class org.apache.cordova.CordovaWebView { *; }
-dontwarn org.apache.cordova.**

# ── WebView JavaScript Interface ──────────────────────────────────
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
    public boolean *(android.webkit.WebView, java.lang.String);
}

# ── Google AdMob (필수 공개 API만 보호) ──────────────────────────
-keep public class com.google.android.gms.ads.MobileAds { *; }
-keep public class com.google.android.gms.ads.AdRequest { *; }
-keep public class com.google.android.gms.ads.AdView { *; }
-keep public class com.google.android.gms.ads.InterstitialAd { *; }
-keep public class com.google.android.gms.ads.rewarded.** { *; }
-keep public class com.google.android.gms.ads.AdListener { *; }
-keep public class com.google.android.gms.ads.initialization.** { *; }
-dontwarn com.google.android.gms.ads.**

# ── Google Play Services (필수만, 전체 keep 제거) ─────────────────
-keep public class com.google.android.gms.common.GoogleApiAvailability { *; }
-keep public class com.google.android.gms.tasks.** { *; }
-dontwarn com.google.android.gms.**

# ── Firebase / FCM ────────────────────────────────────────────────
-keep class com.google.firebase.messaging.FirebaseMessagingService { *; }
-keep class com.google.firebase.messaging.RemoteMessage { *; }
-dontwarn com.google.firebase.**

# ── AndroidX (전체 keep 제거 → 필수 인터페이스만 보호) ───────────
-keep class androidx.core.view.WindowCompat { *; }
-keep class androidx.core.view.WindowInsetsCompat { *; }
-keep class androidx.activity.OnBackPressedCallback { *; }
-dontwarn androidx.**

# ── Material (DatePicker 등 Android 15 지원 중단 API 경고 억제) ──
# android.view.Window.setStatusBarColor/setNavigationBarColor 는
# Material 라이브러리 내부 사용 → 앱 코드에서 직접 호출 안 함
-dontwarn android.view.Window
-dontwarn com.google.android.material.**

# ── Capacitor Camera (BitmapFactory 사용 경고 억제) ──────────────
# io.ionic.libs.ioncameralib 내부 BitmapFactory 사용은 서드파티 이슈
-dontwarn io.ionic.libs.**
-keep class io.ionic.libs.** { *; }

# ── JSON ────────────────────────────────────────────────────────
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class org.json.** { *; }
-dontwarn org.json.**

# ── Enum 보호 ─────────────────────────────────────────────────────
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# ── Kotlin 코루틴 ─────────────────────────────────────────────────
-keepclassmembernames class kotlinx.** {
    volatile <fields>;
}
-dontwarn kotlin.**
-dontwarn kotlinx.**

# ── R8 최적화 명시적 활성화 (중요: 이 파일에 -dontoptimize 없어야 함)
# -dontoptimize  ← 이 줄이 있으면 최적화 0% → 절대 추가 금지!
# -dontobfuscate ← 이 줄이 있으면 난독화 0% → 절대 추가 금지!
# -dontshrink    ← 이 줄이 있으면 축소 0%   → 절대 추가 금지!
