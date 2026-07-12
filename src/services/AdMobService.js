/**
 * AdMobService.js - Google AdMob SDK 연동 서비스
 *
 * - Capacitor 네이티브 앱: @capacitor-community/admob 사용 (실제 광고)
 * - 웹 브라우저: Google AdSense H5 Ad Placement API (adBreak) 사용
 *   · 퍼블리셔 ID: ca-pub-9774243773523817
 *   · AdSense 미승인/광고 없음 시: 30초 타이머 fallback
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


// ─── 웹 환경: AdSense H5 Ad Placement API (adBreak) ─────────────
/**
 * 웹 보상형 광고 (AdSense H5 Ad Placement API)
 * - AdSense 승인 후 실제 광고 표시
 * - 광고 없거나 미승인 시 → 30초 타이머 fallback으로 자동 전환
 */
function showWebRewardedAd(onRewarded, onFailed, onNoAd) {
  if (typeof window.adBreak !== 'function') {
    if (!import.meta.env.PROD) console.log('[AdSense] adBreak 함수 없음 → fallback');
    onNoAd?.();
    return;
  }

  let adShown = false;
  let rewarded = false;
  let adCompleted = false;

  window.adBreak({
    type: 'reward',
    name: 'fishing-point-reward',

    // 광고 준비됨 → 실행
    beforeReward: (showAdFn) => {
      adShown = true;
      if (!import.meta.env.PROD) console.log('[AdSense] 보상형 광고 준비됨 → 실행');
      showAdFn();
    },

    // 광고 완료 시청 → 보상 지급
    adViewed: () => {
      rewarded = true;
      if (!import.meta.env.PROD) console.log('[AdSense] 보상형 광고 시청 완료 → 보상 지급');
      onRewarded?.();
    },

    // 광고 스킵/닫기 → 보상 없음
    adDismissed: () => {
      if (!import.meta.env.PROD) console.log('[AdSense] 보상형 광고 스킵');
      if (!rewarded) onFailed?.();
    },

    // 광고 사이클 완료 (광고 없음 or 완료 후)
    afterAd: () => {
      adCompleted = true;
      if (!adShown) {
        // 광고를 표시하지 못한 경우 (재고 없음, 미승인 등) → fallback
        if (!import.meta.env.PROD) console.log('[AdSense] 광고 없음 → 30초 타이머 fallback');
        onNoAd?.();
      }
    },
  });
}


// ─── 보상형 광고 (통합 진입점) ──────────────────────────────────
/**
 * 보상형 광고 표시
 * - 네이티브 앱: AdMob SDK
 * - 웹 브라우저: AdSense H5 Ad Placement API → fallback(타이머)
 *
 * @param {function} onRewarded  - 광고 시청 완료 콜백 (보상 지급)
 * @param {function} onFailed    - 실패/취소 콜백 (UI 잠금 해제)
 * @returns {{ simulated: boolean } | undefined}
 *   simulated=true → 호출자(AdUnit.jsx)가 30초 타이머 UI 표시
 *   simulated=false → AdMob/AdSense가 직접 처리 (콜백으로만 결과 전달)
 */
export async function showRewardedAd(onRewarded, onFailed) {
  // ── 1. 네이티브 앱 (Android/iOS Capacitor) ──
  if (isNative() && AdMob) {
    try {
      const options = {
        adId: ADMOB_CONFIG.REWARDED_ID,
        isTesting: IS_ADMOB_TESTING,
      };

      // 광고 로드
      await AdMob.prepareRewardVideoAd(options);

      let rewarded = false;

      // 보상 수령 리스너
      const rewardListener = await AdMob.addListener(
        'onRewardedVideoAdReward',
        (reward) => {
          if (!import.meta.env.PROD) console.log('[AdMob] 보상 수령:', reward);
          rewarded = true;
          rewardListener.remove();
          onRewarded?.(reward);
        }
      );

      // 광고 종료(스킵/닫기) 리스너
      const closeListener = await AdMob.addListener(
        'onRewardedVideoAdDismissed',
        () => {
          closeListener.remove();
          // ✅ 닫힐 때 rewardListener도 안전하게 제거 (rewarded=true면 이미 제거됐으나 중복 호출 무해)
          if (!rewarded) {
            rewardListener?.remove();
            onFailed?.();
          }
        }
      );

      // 광고 표시
      await AdMob.showRewardVideoAd();
      return { simulated: false };

    } catch (e) {
      // ✅ BUG-3 FIX: 광고 실패 시 리스너 명시적 제거 (누수 방지)
      try { rewardListener?.remove(); } catch {}
      try { closeListener?.remove(); } catch {}
      if (!import.meta.env.PROD) console.error('[AdMob] 보상형 광고 오류:', e);
      onFailed?.(e);
      return { simulated: false };
    }
  }

  // ── 2. 웹 환경 → AdSense H5 Ad Placement API 시도 ──
  if (!isNative()) {
    let adSenseHandled = false;

    showWebRewardedAd(
      // onRewarded
      () => { adSenseHandled = true; onRewarded?.(); },
      // onFailed
      () => { adSenseHandled = true; onFailed?.(); },
      // onNoAd (광고 없음 → 타이머 fallback)
      () => {
        if (!adSenseHandled) {
          if (!import.meta.env.PROD) console.log('[AdSense] fallback → 30초 타이머 시뮬레이션');
          // simulated:true 반환 → AdUnit.jsx가 30초 타이머 UI 표시
        }
      }
    );

    // AdSense가 beforeReward를 호출하지 않은 경우(광고 없음) → 타이머 fallback
    // afterAd는 동기적으로 실행되므로 adSenseHandled로 체크
    return { simulated: !adSenseHandled };
  }

  // ── 3. 최종 fallback (네이티브지만 AdMob 미초기화) ──
  if (!import.meta.env.PROD) console.log('[AdMob] AdMob 미초기화 → fallback');
  return { simulated: true };
}

// ─── 보상형 전면광고 (포인트 진입 시 3회마다) ─────────────────────
/**
 * 보상형 전면광고 표시
 * - 3번 확인마다 보여주는 전면 + 보상형 하이브리드 광고
 */
export async function showRewardedInterstitialAd(onRewarded, onFailed) {
  if (isNative() && AdMob) {
    try {
      const options = {
        adId: ADMOB_CONFIG.REWARDED_INTERSTITIAL_ID,
        isTesting: IS_ADMOB_TESTING,
      };

      await AdMob.prepareRewardInterstitialAd(options);

      let rewarded = false;

      const rewardListener = await AdMob.addListener(
        'onRewardedInterstitialAdReward',
        (reward) => {
          if (!import.meta.env.PROD) console.log('[AdMob] 보상형 전면광고 보상:', reward);
          rewarded = true;
          rewardListener.remove();
          onRewarded?.(reward);
        }
      );

      const closeListener = await AdMob.addListener(
        'onRewardedInterstitialAdDismissed',
        () => {
          closeListener.remove();
          if (!rewarded) {
            rewardListener?.remove();
            onFailed?.();
          }
        }
      );

      await AdMob.showRewardInterstitialAd();
      return { simulated: false };
    } catch (e) {
      if (!import.meta.env.PROD) console.error('[AdMob] 보상형 전면광고 오류:', e);
      onFailed?.(e);
      return { simulated: false };
    }
  }

  // 웹 브라우저 등 네이티브 아닐 때는 그냥 넘어감 (전면 광고이므로 fallback 보상은 생략)
  onRewarded?.();
  return { simulated: false };
}
