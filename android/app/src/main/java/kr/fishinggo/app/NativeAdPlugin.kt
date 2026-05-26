package kr.fishinggo.app

import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * NativeAdPlugin — 네이티브 공유 시트 전용 플러그인
 * (광고 기능 제거, shareText만 유지)
 */
@CapacitorPlugin(name = "NativeAd")
class NativeAdPlugin : Plugin() {

    /**
     * Android OS 공유 시트 직접 실행
     * JS 호출: NativeAd.shareText({ text, title })
     */
    @PluginMethod
    fun shareText(call: PluginCall) {
        val text  = call.getString("text")  ?: ""
        val title = call.getString("title") ?: "공유하기"
        activity.runOnUiThread {
            val intent = android.content.Intent(android.content.Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(android.content.Intent.EXTRA_TEXT, text)
                putExtra(android.content.Intent.EXTRA_SUBJECT, title)
            }
            activity.startActivity(android.content.Intent.createChooser(intent, title))
            call.resolve()
        }
    }
}
