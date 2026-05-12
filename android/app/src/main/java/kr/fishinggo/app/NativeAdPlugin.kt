package kr.fishinggo.app

import android.graphics.Color
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.RatingBar
import android.widget.TextView
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.gms.ads.AdListener
import com.google.android.gms.ads.AdLoader
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.nativead.MediaView
import com.google.android.gms.ads.nativead.NativeAd
import com.google.android.gms.ads.nativead.NativeAdView

private const val TAG = "NativeAdPlugin"

// ✅ NATIVE-AD: 인피드 네이티브 광고 플러그인
// - WebView 콘텐츠의 placeholder div 위에 Google NativeAdView를 오버레이
// - JS에서 placeholder 좌표(getBoundingClientRect)를 받아 정확히 위치시킴
// - 스크롤 시 JS가 updatePosition()을 호출하여 실시간 위치 업데이트
@CapacitorPlugin(name = "NativeAd")
class NativeAdPlugin : Plugin() {

    // slotId → NativeAdView 맵 (복수 광고 슬롯 지원)
    private val adViews = mutableMapOf<String, NativeAdView>()

    /**
     * 네이티브 광고 로드 + 배치
     * JS 호출: NativeAd.loadAd({ slotId, adUnitId, x, y, width, height })
     */
    @PluginMethod
    fun loadAd(call: PluginCall) {
        val slotId = call.getString("slotId") ?: "slot_0"
        val adUnitId = call.getString("adUnitId") ?: "ca-app-pub-3940256099942544/2247696314"
        val x = call.getInt("x") ?: 0
        val y = call.getInt("y") ?: 0
        val width = call.getInt("width") ?: 0
        val height = call.getInt("height") ?: 300

        activity.runOnUiThread {
            // 기존 슬롯 제거
            removeSlot(slotId)

            val adLoader = AdLoader.Builder(context, adUnitId)
                .forNativeAd { nativeAd ->
                    activity.runOnUiThread {
                        placeNativeAd(slotId, nativeAd, x, y, width, height)
                        call.resolve(JSObject().put("success", true).put("slotId", slotId))
                    }
                }
                .withAdListener(object : AdListener() {
                    override fun onAdFailedToLoad(error: LoadAdError) {
                        Log.w(TAG, "네이티브 광고 로드 실패: ${error.message}")
                        call.reject(error.message)
                    }
                })
                .build()

            adLoader.loadAd(AdRequest.Builder().build())
        }
    }

    /**
     * 스크롤 시 광고 위치 업데이트
     * JS 호출: NativeAd.updatePosition({ slotId, x, y })
     */
    @PluginMethod
    fun updatePosition(call: PluginCall) {
        val slotId = call.getString("slotId") ?: return
        val x = call.getInt("x") ?: 0
        val y = call.getInt("y") ?: 0

        activity.runOnUiThread {
            val view = adViews[slotId] ?: return@runOnUiThread
            (view.layoutParams as? FrameLayout.LayoutParams)?.let { params ->
                params.leftMargin = x
                params.topMargin = y
                view.requestLayout()
            }
            call.resolve()
        }
    }

    /**
     * 광고 가시성 제어 (viewport 밖으로 나가면 숨김)
     */
    @PluginMethod
    fun setVisible(call: PluginCall) {
        val slotId = call.getString("slotId") ?: return
        val visible = call.getBoolean("visible") ?: true

        activity.runOnUiThread {
            adViews[slotId]?.visibility = if (visible) View.VISIBLE else View.INVISIBLE
            call.resolve()
        }
    }

    /**
     * 광고 슬롯 제거
     */
    @PluginMethod
    fun removeAd(call: PluginCall) {
        val slotId = call.getString("slotId") ?: return
        activity.runOnUiThread {
            removeSlot(slotId)
            call.resolve()
        }
    }

    /**
     * 모든 광고 슬롯 제거 (페이지 전환 시)
     */
    @PluginMethod
    fun removeAll(call: PluginCall) {
        activity.runOnUiThread {
            adViews.keys.toList().forEach { removeSlot(it) }
            call.resolve()
        }
    }

    // ─── Private helpers ────────────────────────────────────────────

    private fun placeNativeAd(slotId: String, nativeAd: NativeAd, x: Int, y: Int, w: Int, h: Int) {
        // NativeAdView 생성 (XML 레이아웃 inflate)
        val adView = LayoutInflater.from(context)
            .inflate(R.layout.native_ad_view, null) as NativeAdView

        // 광고 데이터 바인딩
        bindNativeAd(adView, nativeAd)

        // 화면 밀도 (이미 물리px로 받음)
        val params = FrameLayout.LayoutParams(if (w > 0) w else FrameLayout.LayoutParams.MATCH_PARENT, h).apply {
            leftMargin = x
            topMargin = y
            gravity = Gravity.TOP or Gravity.START
        }

        // 루트 뷰에 추가
        bridge.rootView.addView(adView, params)
        adViews[slotId] = adView
        Log.d(TAG, "네이티브 광고 배치: slotId=$slotId x=$x y=$y w=$w h=$h")
    }

    private fun bindNativeAd(adView: NativeAdView, nativeAd: NativeAd) {
        // 헤드라인
        adView.headlineView = adView.findViewById<TextView>(R.id.ad_headline).also {
            it.text = nativeAd.headline ?: ""
        }
        // 광고주
        adView.advertiserView = adView.findViewById<TextView>(R.id.ad_advertiser).also {
            it.text = nativeAd.advertiser ?: ""
            it.visibility = if (nativeAd.advertiser != null) View.VISIBLE else View.GONE
        }
        // 본문
        adView.bodyView = adView.findViewById<TextView>(R.id.ad_body).also {
            it.text = nativeAd.body ?: ""
            it.visibility = if (nativeAd.body != null) View.VISIBLE else View.GONE
        }
        // CTA 버튼
        adView.callToActionView = adView.findViewById<Button>(R.id.ad_call_to_action).also {
            it.text = nativeAd.callToAction ?: "더 보기"
            it.visibility = if (nativeAd.callToAction != null) View.VISIBLE else View.GONE
        }
        // 미디어 (이미지/영상)
        adView.mediaView = adView.findViewById<MediaView>(R.id.ad_media).also {
            nativeAd.mediaContent?.let { mc -> it.mediaContent = mc }
        }
        // 아이콘
        adView.iconView = adView.findViewById<ImageView>(R.id.ad_icon).also {
            val icon = nativeAd.icon
            if (icon != null) {
                it.setImageDrawable(icon.drawable)
                it.visibility = View.VISIBLE
            } else {
                it.visibility = View.GONE
            }
        }
        // 별점
        adView.starRatingView = adView.findViewById<RatingBar>(R.id.ad_stars).also {
            val stars = nativeAd.starRating
            if (stars != null) {
                it.rating = stars.toFloat()
                it.visibility = View.VISIBLE
            } else {
                it.visibility = View.GONE
            }
        }

        // NativeAd 최종 등록
        adView.setNativeAd(nativeAd)
    }

    private fun removeSlot(slotId: String) {
        adViews.remove(slotId)?.let { view ->
            bridge.rootView.removeView(view)
        }
    }
}
