/**
 * NativeAdService.js — 인피드 네이티브 광고 JS 브릿지
 *
 * NativeAdPlugin.kt와 통신하여:
 * 1. WebView 내 placeholder div 위치를 감지
 * 2. Kotlin에 좌표를 전달 → NativeAdView 오버레이
 * 3. 스크롤 시 좌표를 업데이트하여 광고가 콘텐츠와 함께 이동하는 것처럼 보이게 함
 */
import { Capacitor, registerPlugin } from '@capacitor/core';
import { ADMOB_CONFIG } from '../constants/adSettings';

// Capacitor 플러그인 등록 (NativeAdPlugin.kt의 @CapacitorPlugin(name = "NativeAd"))
const NativeAdPlugin = Capacitor.isNativePlatform()
  ? registerPlugin('NativeAd')
  : null;

const IS_NATIVE = Capacitor.isNativePlatform();

// 현재 활성 슬롯 Set (removeAll 시 정리용)
const activeSlots = new Set();

// AdMob 테스트 모드 여부 (AdMobService와 동일 기준)
const IS_TESTING = import.meta.env.VITE_ADMOB_TESTING !== 'false';

// 네이티브 광고 단위 ID
const AD_UNIT_ID = IS_TESTING
  ? 'ca-app-pub-3940256099942544/2247696110'   // Google 공식 테스트 Native ID (표준형)
  : (ADMOB_CONFIG.NATIVE_ID || 'ca-app-pub-3940256099942544/2247696110');

/**
 * placeholder div의 화면 좌표를 물리 픽셀(px)로 반환
 * @param {HTMLElement} el
 * @returns {{ x, y, width, height }} 물리 픽셀 기준
 */
function getPhysicalRect(el) {
  const rect = el.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  return {
    x: Math.round(rect.left * dpr),
    y: Math.round(rect.top * dpr),
    width: Math.round(rect.width * dpr),
    height: Math.round(rect.height * dpr),
  };
}

/**
 * 특정 슬롯 ID에 네이티브 광고를 로드하고 배치
 * @param {string} slotId    - 고유 슬롯 ID (예: 'business_ad_0')
 * @param {HTMLElement} el   - placeholder div 엘리먼트
 */
export async function loadNativeAd(slotId, el) {
  // ✅ AD-FIX: 비네이티브/엘리먼트 없음 → reject (호출자가 실패 감지 가능)
  if (!IS_NATIVE || !NativeAdPlugin || !el) throw new Error('not_native');
  const rect = getPhysicalRect(el);
  // ✅ AD-FIX: try-catch 제거 → Kotlin call.reject() 시 실제로 throw
  // Kotlin 성공: forNativeAd 콜백 → call.resolve({success:true}) → resolves
  // Kotlin 실패: onAdFailedToLoad → call.reject(msg) → throws
  await NativeAdPlugin.loadAd({
    slotId,
    adUnitId: AD_UNIT_ID,
    ...rect,
  });
  activeSlots.add(slotId);
  if (!import.meta.env.PROD) console.log(`[NativeAd] 로드 완료: ${slotId}`);
}

/**
 * 스크롤 이벤트 핸들러 — 모든 활성 슬롯의 위치를 업데이트
 * @param {Map<string, HTMLElement>} slotMap - slotId → el
 */
export async function updateNativeAdPositions(slotMap) {
  if (!IS_NATIVE || !NativeAdPlugin) return;
  for (const [slotId, el] of slotMap.entries()) {
    if (!el || !activeSlots.has(slotId)) continue;
    try {
      const rect = getPhysicalRect(el);
      // viewport 밖이면 숨김
      const inViewport = rect.y + rect.height > 0 && rect.y < window.innerHeight * window.devicePixelRatio;
      await NativeAdPlugin.setVisible({ slotId, visible: inViewport });
      if (inViewport) {
        await NativeAdPlugin.updatePosition({ slotId, x: rect.x, y: rect.y });
      }
    } catch { /* scroll 중 오류는 무시 */ }
  }
}

/**
 * 특정 슬롯 광고 제거
 */
export async function removeNativeAd(slotId) {
  if (!IS_NATIVE || !NativeAdPlugin) return;
  try {
    await NativeAdPlugin.removeAd({ slotId });
    activeSlots.delete(slotId);
  } catch { /* ignore */ }
}

/**
 * 모든 네이티브 광고 제거 (페이지 언마운트 시)
 */
export async function removeAllNativeAds() {
  if (!IS_NATIVE || !NativeAdPlugin) return;
  try {
    await NativeAdPlugin.removeAll();
    activeSlots.clear();
    if (!import.meta.env.PROD) console.log('[NativeAd] 전체 슬롯 제거');
  } catch { /* ignore */ }
}
