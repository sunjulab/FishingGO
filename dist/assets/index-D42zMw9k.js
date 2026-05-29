function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/web-CfZF7qRU.js","assets/index-CUv3Hibb.js","assets/vendor-react-BzbiWsGG.js","assets/vendor-icons-C5BxRig-.js","assets/vendor-store-DFdRS9Cc.js","assets/vendor-http-ChhVHlBG.js","assets/vendor-socket-FPM1Bwz4.js","assets/index-DKFtvhIq.css"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
import { _ as __vitePreload } from './vendor-react-BzbiWsGG.js';
import { r as registerPlugin } from './index-CUv3Hibb.js';
import './vendor-icons-C5BxRig-.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

const Network = registerPlugin('Network', {
    web: () => __vitePreload(() => import('./web-CfZF7qRU.js'),true?__vite__mapDeps([0,1,2,3,4,5,6,7]):void 0).then((m) => new m.NetworkWeb()),
});

export { Network };
