# ✅ FishingGO ProGuard Rules — Capacitor + React WebView + AdMob

# ── 디버그 정보 유지 (비정상 종료 분석용) ──────────────────────────
-keepattributes SourceFile,LineNumberTable
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions

# ── Capacitor Core ────────────────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.community.** { *; }
-dontwarn com.getcapacitor.**

# ── FishingGO App Package ─────────────────────────────────────────
-keep class kr.fishinggo.app.** { *; }

# ── WebView JavaScript Interface ──────────────────────────────────
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
    public boolean *(android.webkit.WebView, java.lang.String);
}

# ── Google AdMob ──────────────────────────────────────────────────
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.ads.** { *; }
-dontwarn com.google.android.gms.ads.**

# ── Google Play Services ──────────────────────────────────────────
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# ── AndroidX / Support Library ───────────────────────────────────
-keep class androidx.** { *; }
-dontwarn androidx.**

# ── Cordova Plugins ───────────────────────────────────────────────
-keep class org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**

# ── JSON (Gson / org.json) ────────────────────────────────────────
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class org.json.** { *; }

# ── Enum 보호 ─────────────────────────────────────────────────────
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# ── 소스 파일명 숨김 ──────────────────────────────────────────────
-renamesourcefileattribute SourceFile
