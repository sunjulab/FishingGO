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

// AdMob 테스트 모드 (기본값: 테스트 ON — 플레이스토어 출시 후 VITE_ADMOB_TESTING=false 설정):
// - 미설정 또는 'true' → 테스트 광고 (개발·심사·내부테스트 단계)
// - VITE_ADMOB_TESTING=false → 실 광고 (플레이스토어 공식 출시 후)
const IS_ADMOB_TESTING = import.meta.env.VITE_ADMOB_TESTING !== 'false';

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
      initializeForTesting: IS_ADMOB_TESTING,
    });
    console.log(`[AdMob] 초기화 완료 (테스트모드: ${IS_ADMOB_TESTING})`);
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
      isTesting: IS_ADMOB_TESTING,
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


// ─── 전면(인터스티셜) 광고 ─────────────────────────────────────
/**
 * 전면 광고 표시 (게시글 클릭 시 등 자연스러운 전환 지점에 삽입)
 * @param {function} [onClosed] - 광고 닫힌 후 콜백
 */
export async function showInterstitialAd(onClosed) {
  if (!isNative() || !AdMob) {
    // 웹 환경 — 즉시 콜백 실행 (광고 없이 다음 동작 진행)
    onClosed?.();
    return;
  }
  try {
    const options = {
      adId: ADMOB_CONFIG.NATIVE_ID, // 피드용 광고 단위 재사용
      isTesting: !import.meta.env.PROD,
    };

    await AdMob.prepareInterstitial(options);

    // 닫힘 리스너
    const closeListener = await AdMob.addListener(
      'interstitialDidDismissScreen',
      () => {
        closeListener.remove();
        onClosed?.();
      }
    );

    await AdMob.showInterstitial();
  } catch (e) {
    console.warn('[AdMob] 전면광고 오류:', e.message);
    onClosed?.(); // 실패해도 다음 동작 진행
  }
}
