const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/web-2XxMMvuk.js","assets/index-CgWp8qy4.js","assets/vendor-react-vfOo6a0P.js","assets/vendor-icons-Bsle_tIe.js","assets/vendor-store-wmv-LjAu.js","assets/vendor-http-ChhVHlBG.js","assets/vendor-socket-DJUzVLd_.js","assets/index-Dy2mt0G_.css"])))=>i.map(i=>d[i]);
import { r as registerPlugin, _ as __vitePreload } from './index-CgWp8qy4.js';
import './vendor-react-vfOo6a0P.js';
import './vendor-icons-Bsle_tIe.js';
import './vendor-store-wmv-LjAu.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-DJUzVLd_.js';

const Network = registerPlugin('Network', {
    web: () => __vitePreload(() => import('./web-2XxMMvuk.js'),true?__vite__mapDeps([0,1,2,3,4,5,6,7]):void 0).then((m) => new m.NetworkWeb()),
});

export { Network };
