const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/web-BQvzX2mn.js","assets/index-CprziR7w.js","assets/vendor-react-vfOo6a0P.js","assets/vendor-icons-Bsle_tIe.js","assets/vendor-store-wmv-LjAu.js","assets/vendor-http-ChhVHlBG.js","assets/vendor-socket-DJUzVLd_.js","assets/index-Iv7s_lDn.css"])))=>i.map(i=>d[i]);
import { r as registerPlugin, _ as __vitePreload } from './index-CprziR7w.js';
import './vendor-react-vfOo6a0P.js';
import './vendor-icons-Bsle_tIe.js';
import './vendor-store-wmv-LjAu.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-DJUzVLd_.js';

const AppLauncher = registerPlugin('AppLauncher', {
    web: () => __vitePreload(() => import('./web-BQvzX2mn.js'),true?__vite__mapDeps([0,1,2,3,4,5,6,7]):void 0).then((m) => new m.AppLauncherWeb()),
});

export { AppLauncher };
