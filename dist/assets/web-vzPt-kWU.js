import { W as WebPlugin } from './index-CprziR7w.js';
import { AdmobConsentStatus } from './index-T3FDAtA_.js';
import './vendor-react-vfOo6a0P.js';
import './vendor-icons-Bsle_tIe.js';
import './vendor-store-wmv-LjAu.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-DJUzVLd_.js';

/**
 *  For more information:
 *  https://developers.google.com/admob/unity/reference/namespace/google-mobile-ads/ump/api#privacyoptionsrequirementstatus
 *
 * */
var PrivacyOptionsRequirementStatus;
(function (PrivacyOptionsRequirementStatus) {
    /**
     * Privacy options entry point is not required.
     */
    PrivacyOptionsRequirementStatus["NOT_REQUIRED"] = "NOT_REQUIRED";
    /**
     * Privacy options entry point is required.
     */
    PrivacyOptionsRequirementStatus["REQUIRED"] = "REQUIRED";
    /**
     * Privacy options requirement status is unknown.
     */
    PrivacyOptionsRequirementStatus["UNKNOWN"] = "UNKNOWN";
})(PrivacyOptionsRequirementStatus || (PrivacyOptionsRequirementStatus = {}));

class AdMobWeb extends WebPlugin {
    async initialize() {
        console.log('initialize');
    }
    async requestTrackingAuthorization() {
        console.log('requestTrackingAuthorization');
    }
    async trackingAuthorizationStatus() {
        return {
            status: 'authorized',
        };
    }
    async requestConsentInfo(options) {
        console.log('requestConsentInfo', options);
        return {
            status: AdmobConsentStatus.REQUIRED,
            isConsentFormAvailable: true,
            canRequestAds: true,
            privacyOptionsRequirementStatus: PrivacyOptionsRequirementStatus.REQUIRED,
        };
    }
    async showPrivacyOptionsForm() {
        console.log('showPrivacyOptionsForm');
    }
    async showConsentForm() {
        console.log('showConsentForm');
        return {
            status: AdmobConsentStatus.REQUIRED,
            canRequestAds: true,
            privacyOptionsRequirementStatus: PrivacyOptionsRequirementStatus.REQUIRED,
        };
    }
    async resetConsentInfo() {
        console.log('resetConsentInfo');
    }
    async setApplicationMuted(options) {
        console.log('setApplicationMuted', options);
    }
    async setApplicationVolume(options) {
        console.log('setApplicationVolume', options);
    }
    async showBanner(options) {
        console.log('showBanner', options);
    }
    // Hide the banner, remove it from screen, but can show it later
    async hideBanner() {
        console.log('hideBanner');
    }
    // Resume the banner, show it after hide
    async resumeBanner() {
        console.log('resumeBanner');
    }
    // Destroy the banner, remove it from screen.
    async removeBanner() {
        console.log('removeBanner');
    }
    async prepareInterstitial(options) {
        console.log('prepareInterstitial', options);
        return {
            adUnitId: options.adId,
        };
    }
    async showInterstitial() {
        console.log('showInterstitial');
    }
    async prepareRewardVideoAd(options) {
        console.log(options);
        return {
            adUnitId: options.adId,
        };
    }
    async showRewardVideoAd() {
        return {
            type: '',
            amount: 0,
        };
    }
    async prepareRewardInterstitialAd(options) {
        console.log(options);
        return {
            adUnitId: options.adId,
        };
    }
    async showRewardInterstitialAd() {
        return {
            type: '',
            amount: 0,
        };
    }
}

export { AdMobWeb };
