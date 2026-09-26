# Safe FishingGO ProGuard Rules

# ── 디버그 정보 유지 ──
-keepattributes SourceFile,LineNumberTable
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
-keepattributes InnerClasses
-renamesourcefileattribute SourceFile

# ── FishingGO App ──
-keep class kr.fishinggo.app.** { *; }

# ── Capacitor & Cordova ──
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { *; }
-keep @com.getcapacitor.annotation.PluginMethod public class * { *; }
-keep class org.apache.cordova.** { *; }
-keep class cc.fovea.** { *; }

# ── Google Billing ──
-keep class com.android.billingclient.** { *; }

# ── 서드파티 경고 억제 ──
-dontwarn android.view.Window
-dontwarn io.ionic.libs.**
-dontwarn org.apache.cordova.**
