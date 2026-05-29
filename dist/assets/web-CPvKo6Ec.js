import { W as WebPlugin } from './index-CUv3Hibb.js';
import './vendor-react-BzbiWsGG.js';
import './vendor-icons-C5BxRig-.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

class AppUpdateWeb extends WebPlugin {
    async getAppUpdateInfo() {
        throw new Error('Web platform is not supported.');
    }
    async openAppStore() {
        throw new Error('Web platform is not supported.');
    }
    async performImmediateUpdate() {
        throw new Error('Web platform is not supported.');
    }
    async startFlexibleUpdate() {
        throw new Error('Web platform is not supported.');
    }
    async completeFlexibleUpdate() {
        throw new Error('Web platform is not supported.');
    }
}

export { AppUpdateWeb };
