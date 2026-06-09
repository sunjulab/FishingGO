import { W as WebPlugin } from './index-CgWp8qy4.js';
import './vendor-react-vfOo6a0P.js';
import './vendor-icons-Bsle_tIe.js';
import './vendor-store-wmv-LjAu.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-DJUzVLd_.js';

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
