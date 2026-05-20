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
    if (!import.meta.env.PROD) console.log(`[AdMob] 초기화 완료 (테스트모드: ${IS_ADMOB_TESTING})`);
  } catch (e) {
    if (!import.meta.env.PROD) console.warn('[AdMob] 초기화 실패 (웹 환경에서는 정상):', e.message);
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
    if (!import.meta.env.PROD) console.log('[AdMob] 웹 환경 — 보상형 광고 시뮬레이션');
    return { simulated: true };
  }

  try {
    const options = {
      adId: ADMOB_CONFIG.REWARDED_ID,
      isTesting: IS_ADMOB_TESTING,
    };

    // 광고 로드
    await AdMob.prepareRewardVideoAd(options);

    // ✅ FIX-TDZ: rewarded 플래그를 리스너 등록 전에 선언 — 클로저 내 사용보다 늦은 선언 코드 순서 개선
    let rewarded = false;

    // 보상 수령 리스너
    const rewardListener = await AdMob.addListener(
      'onRewardedVideoAdReward',
      (reward) => {
        if (!import.meta.env.PROD) console.log('[AdMob] 보상 수령:', reward);
        rewarded = true; // ✅ FIX: 보상 수령 플래그 — 닫기 이벤트에서 onFailed 이중 호출 방지
        rewardListener.remove();
        onRewarded?.(reward);
      }
    );

    // 광고 종료(스킵/닫기) 리스너 — 보상 없이 닫힌 경우 onFailed 호출
    const closeListener = await AdMob.addListener(
      'onRewardedVideoAdDismissed',
      () => {
        closeListener.remove();
        if (!rewarded) onFailed?.(); // ✅ FIX: 보상 없이 닫힌 경우 onFailed 호출 → UI 잠금 해제
      }
    );

    // 광고 표시
    await AdMob.showRewardVideoAd();
  } catch (e) {
    if (!import.meta.env.PROD) console.error('[AdMob] 보상형 광고 오류:', e);
    onFailed?.(e);
  }
}


