const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/web-3kgOQgA3.js","assets/index-CgWp8qy4.js","assets/vendor-react-vfOo6a0P.js","assets/vendor-icons-Bsle_tIe.js","assets/vendor-store-wmv-LjAu.js","assets/vendor-http-ChhVHlBG.js","assets/vendor-socket-DJUzVLd_.js","assets/index-Dy2mt0G_.css"])))=>i.map(i=>d[i]);
import { r as registerPlugin, _ as __vitePreload } from './index-CgWp8qy4.js';
import './vendor-react-vfOo6a0P.js';
import './vendor-icons-Bsle_tIe.js';
import './vendor-store-wmv-LjAu.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-DJUzVLd_.js';

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
    web: () => __vitePreload(() => import('./web-3kgOQgA3.js'),true?__vite__mapDeps([0,1,2,3,4,5,6,7]):void 0).then((m) => new m.GeolocationWeb()),
});
f();

export { Geolocation };
