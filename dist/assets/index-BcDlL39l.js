const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/web-CX0CE_uU.js","assets/index-DvZBU_x5.js","assets/vendor-react-vfOo6a0P.js","assets/vendor-icons-Bsle_tIe.js","assets/vendor-store-wmv-LjAu.js","assets/vendor-http-ChhVHlBG.js","assets/vendor-socket-DJUzVLd_.js","assets/index-Iv7s_lDn.css"])))=>i.map(i=>d[i]);
import { r as registerPlugin, _ as __vitePreload } from './index-DvZBU_x5.js';
import './vendor-react-vfOo6a0P.js';
import './vendor-icons-Bsle_tIe.js';
import './vendor-store-wmv-LjAu.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-DJUzVLd_.js';

const Network = registerPlugin('Network', {
    web: () => __vitePreload(() => import('./web-CX0CE_uU.js'),true?__vite__mapDeps([0,1,2,3,4,5,6,7]):void 0).then((m) => new m.NetworkWeb()),
});

export { Network };
