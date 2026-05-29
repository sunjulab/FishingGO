import { W as WebPlugin } from './index-CUv3Hibb.js';
import './vendor-react-BzbiWsGG.js';
import './vendor-icons-C5BxRig-.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

class AppLauncherWeb extends WebPlugin {
    async canOpenUrl(_options) {
        return { value: true };
    }
    async openUrl(options) {
        window.open(options.url, '_blank');
        return { completed: true };
    }
}

export { AppLauncherWeb };
