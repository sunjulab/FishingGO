import { W as WebPlugin } from './index-NI8adjLZ.js';
import './vendor-react-vfOo6a0P.js';
import './vendor-icons-Bsle_tIe.js';
import './vendor-store-wmv-LjAu.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-DJUzVLd_.js';

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
