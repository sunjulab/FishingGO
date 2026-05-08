/**
 * AdMobService.js - Google AdMob SDK 연동 서비스
 *
 * - Capacitor 네이티브 앱: @capacitor-community/admob 사용 (실제 광고)
 * - 웹 브라우저: 시뮬레이션 모드 (광고 SDK 없음)
 *
 * 광고 ID: adSettings.js의 ADMOB_CONFIG 참조
 */
import { ADMOB_CONFIG } from '../constants/adSettings';

// Capacitor 환경 감지
const isNative = () =>
  typeof window !== 'undefined' &&
  window.Capacitor?.isNativePlatform?.();

let AdMob = null;

// AdMob SDK 초기화 (앱 시작 시 1회 호출)
export async function initAdMob() {
  if (!isNative()) return;
  try {
    const mod = await import('@capacitor-community/admob');
    AdMob = mod.AdMob;
    await AdMob.initialize({
      requestTrackingAuthorization: false,
      testingDevices: [],
      initializeForTesting: !import.meta.env.PROD,
    });
    console.log('[AdMob] 초기화 완료');
  } catch (e) {
    console.warn('[AdMob] 초기화 실패 (웹 환경에서는 정상):', e.message);
  }
}

// ─── 보상형 광고 ─────────────────────────────────────────────────
/**
 * 보상형 광고 표시
 * @param {function} onRewarded - 광고 시청 완료 콜백
 * @param {function} onFailed   - 실패/취소 콜백
 */
export async function showRewardedAd(onRewarded, onFailed) {
  // 웹 브라우저 환경 — 시뮬레이션 (30초 카운트다운)
  if (!isNative() || !AdMob) {
    console.log('[AdMob] 웹 환경 — 보상형 광고 시뮬레이션');
    return { simulated: true };
  }

  try {
    const options = {
      adId: ADMOB_CONFIG.REWARDED_ID,
      isTesting: !import.meta.env.PROD,
    };

    // 광고 로드
    await AdMob.prepareRewardVideoAd(options);

    // 보상 수령 리스너
    const rewardListener = await AdMob.addListener(
      'onRewardedVideoAdRewarded',
      (reward) => {
        console.log('[AdMob] 보상 수령:', reward);
        rewardListener.remove();
        onRewarded?.(reward);
      }
    );

    // 광고 종료(스킵/닫기) 리스너
    const closeListener = await AdMob.addListener(
      'onRewardedVideoAdClosed',
      () => {
        closeListener.remove();
      }
    );

    // 광고 표시
    await AdMob.showRewardVideoAd();
  } catch (e) {
    console.error('[AdMob] 보상형 광고 오류:', e);
    onFailed?.(e);
  }
}

// ─── 네이티브 광고 (배너형 대체) ─────────────────────────────────
/**
 * 배너 광고 표시 (하단 고정)
 * 네이티브 광고는 Android SDK 레벨에서 처리 — 별도 View 불필요
 */
export async function showBannerAd() {
  if (!isNative() || !AdMob) return;
  try {
    const { BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob');
    await AdMob.showBanner({
      adId: ADMOB_CONFIG.NATIVE_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: !import.meta.env.PROD,
    });
  } catch (e) {
    console.warn('[AdMob] 배너 광고 오류:', e);
  }
}

export async function hideBannerAd() {
  if (!isNative() || !AdMob) return;
  try {
    await AdMob.hideBanner();
  } catch (e) {}
}

export async function removeBannerAd() {
  if (!isNative() || !AdMob) return;
  try {
    await AdMob.removeBanner();
  } catch (e) {}
}
