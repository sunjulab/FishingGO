function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/web-DpfSANXg.js","assets/index-C2ieaxTI.js","assets/vendor-react-BzbiWsGG.js","assets/vendor-icons-C5BxRig-.js","assets/vendor-store-DFdRS9Cc.js","assets/vendor-http-ChhVHlBG.js","assets/vendor-socket-FPM1Bwz4.js","assets/index-DKFtvhIq.css"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
import { _ as __vitePreload } from './vendor-react-BzbiWsGG.js';
import { r as registerPlugin } from './index-C2ieaxTI.js';
import './vendor-icons-C5BxRig-.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

function s(t) {
  t.CapacitorUtils.Synapse = new Proxy(
    {},
    {
      get(e, n) {
        return new Proxy({}, {
          get(w, o) {
            return (c, p, r) => {
              const i = t.Capacitor.Plugins[n];
              if (i === void 0) {
                r(new Error(`Capacitor plugin ${n} not found`));
                return;
              }
              if (typeof i[o] != "function") {
                r(new Error(`Method ${o} not found in Capacitor plugin ${n}`));
                return;
              }
              (async () => {
                try {
                  const a = await i[o](c);
                  p(a);
                } catch (a) {
                  r(a);
                }
              })();
            };
          }
        });
      }
    }
  );
}
function u(t) {
  t.CapacitorUtils.Synapse = new Proxy(
    {},
    {
      get(e, n) {
        return t.cordova.plugins[n];
      }
    }
  );
}
function f(t = !1) {
  typeof window > "u" || (window.CapacitorUtils = window.CapacitorUtils || {}, window.Capacitor !== void 0 && !t ? s(window) : window.cordova !== void 0 && u(window));
}

const Geolocation = registerPlugin('Geolocation', {
    web: () => __vitePreload(() => import('./web-DpfSANXg.js'),true?__vite__mapDeps([0,1,2,3,4,5,6,7]):void 0).then((m) => new m.GeolocationWeb()),
});
f();

export { Geolocation };
