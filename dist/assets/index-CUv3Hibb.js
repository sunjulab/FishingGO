function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/index-C0FNfKN7.js","assets/vendor-react-BzbiWsGG.js","assets/vendor-icons-C5BxRig-.js","assets/vendor-store-DFdRS9Cc.js","assets/vendor-http-ChhVHlBG.js","assets/vendor-socket-FPM1Bwz4.js","assets/index-Dr1tD_1f.js","assets/index-pstjdH-l.js","assets/index-BQZdZ9gP.js","assets/index-D42zMw9k.js","assets/web-CPvKo6Ec.js","assets/MapHome-DT_aiCHA.js","assets/evaluator-ZO7-HWnF.js","assets/AdUnit-BZ32X6Jd.js","assets/fishingData-DUAFbpZH.js","assets/AdSenseAd-DkzE279q.js","assets/MediaTab-CZqnNr9F.js","assets/CommunityTab-Cmkn9ETt.js","assets/ImageGallery-CzQMj38k.js","assets/shareUtils-DAfr_lha.js","assets/Shop-CXIHBu1z.js","assets/MyPage-CM8KlWOS.js","assets/imageUtils-BQ2gh6yW.js","assets/WritePost-BEAoG2kg.js","assets/MultiImageUpload-DwAHVzvW.js","assets/CreateCrew-DGsO-Uoh.js","assets/PostDetail-DGwJX3fA.js","assets/CatchDetail-CylneALv.js","assets/LoginPage-DPb6ZKu_.js","assets/CrewChat-CqXlwYhN.js","assets/WeatherDashboard-CwEIapdA.js","assets/VVIPSubscribe-CzxoRfi7.js","assets/WriteBusinessPost-DeTLuJP8.js","assets/CctvAdmin-CajC70dz.js","assets/NoticeDetail-TznXS_RQ.js","assets/SecretPointAdmin-AcK8yHhi.js","assets/PaymentHistory-Be6NezD6.js","assets/payment-DHpLMO2g.js","assets/AdminDashboard-56pTQgMV.js","assets/UserProfile-CHTL-jNn.js","assets/CatchUploadPage-BPNYcs4b.js","assets/fishRules-C-ea2o-Y.js","assets/CatchRankingPage-D1_nUfXj.js","assets/ContestPage-DPDG7exz.js","assets/PointLocationAdmin-oquIPcyg.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
import { r as reactExports, g as getDefaultExportFromCjs, a as reactDomExports, _ as __vitePreload, u as useNavigate, R as React, b as useLocation, N as NavLink, c as Navigate, B as BrowserRouter, d as Routes, e as Route } from './vendor-react-BzbiWsGG.js';
import { A as AlertCircle, C as CheckCircle, I as Info, X, a as CloudLightning, b as AlertTriangle, F as Fish, B as BellRing, c as CornerUpLeft, M as Megaphone, d as ChevronLeft, e as ChevronRight, H as Home, T as Tv, U as Users, S as ShoppingBag, f as User, g as Anchor } from './vendor-icons-C5BxRig-.js';
import { c as create } from './vendor-store-DFdRS9Cc.js';
import { a as axios } from './vendor-http-ChhVHlBG.js';
import { l as lookup } from './vendor-socket-FPM1Bwz4.js';

true&&(function polyfill() {
    const relList = document.createElement('link').relList;
    if (relList && relList.supports && relList.supports('modulepreload')) {
        return;
    }
    for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
        processPreload(link);
    }
    new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type !== 'childList') {
                continue;
            }
            for (const node of mutation.addedNodes) {
                if (node.tagName === 'LINK' && node.rel === 'modulepreload')
                    processPreload(node);
            }
        }
    }).observe(document, { childList: true, subtree: true });
    function getFetchOpts(link) {
        const fetchOpts = {};
        if (link.integrity)
            fetchOpts.integrity = link.integrity;
        if (link.referrerPolicy)
            fetchOpts.referrerPolicy = link.referrerPolicy;
        if (link.crossOrigin === 'use-credentials')
            fetchOpts.credentials = 'include';
        else if (link.crossOrigin === 'anonymous')
            fetchOpts.credentials = 'omit';
        else
            fetchOpts.credentials = 'same-origin';
        return fetchOpts;
    }
    function processPreload(link) {
        if (link.ep)
            // ep marker = processed
            return;
        link.ep = true;
        // prepopulate the load record
        const fetchOpts = getFetchOpts(link);
        fetch(link.href, fetchOpts);
    }
}());

var jsxRuntime$2 = {exports: {}};

var reactJsxRuntime_production_min = {};

/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';var f=reactExports,k=Symbol.for("react.element"),l=Symbol.for("react.fragment"),m$1=Object.prototype.hasOwnProperty,n=f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,p={key:!0,ref:!0,__self:!0,__source:!0};
function q(c,a,g){var b,d={},e=null,h=null;void 0!==g&&(e=""+g);void 0!==a.key&&(e=""+a.key);void 0!==a.ref&&(h=a.ref);for(b in a)m$1.call(a,b)&&!p.hasOwnProperty(b)&&(d[b]=a[b]);if(c&&c.defaultProps)for(b in a=c.defaultProps,a)void 0===d[b]&&(d[b]=a[b]);return {$$typeof:k,type:c,key:e,ref:h,props:d,_owner:n.current}}var Fragment = reactJsxRuntime_production_min.Fragment=l;var jsx = reactJsxRuntime_production_min.jsx=q;var jsxs = reactJsxRuntime_production_min.jsxs=q;

var jsxRuntime = jsxRuntime$2.exports;

"use strict";
if (true) {
  jsxRuntime$2.exports = reactJsxRuntime_production_min;
} else {
  module.exports = require("./cjs/react-jsx-runtime.development.js");
}

var jsxRuntimeExports = jsxRuntime$2.exports;
const jsxRuntime$1 = /*@__PURE__*/getDefaultExportFromCjs(jsxRuntimeExports);

var client = {};

var hydrateRoot;
var createRoot;
"use strict";
var m = reactDomExports;
if (true) {
  createRoot = client.createRoot = m.createRoot;
  hydrateRoot = client.hydrateRoot = m.hydrateRoot;
} else {
  var i = m.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  exports.createRoot = function(c, o) {
    i.usingClientEntryPoint = true;
    try {
      return m.createRoot(c, o);
    } finally {
      i.usingClientEntryPoint = false;
    }
  };
  exports.hydrateRoot = function(c, h, o) {
    i.usingClientEntryPoint = true;
    try {
      return m.hydrateRoot(c, h, o);
    } finally {
      i.usingClientEntryPoint = false;
    }
  };
}

/*! Capacitor: https://capacitorjs.com/ - MIT License */
var ExceptionCode;
(function (ExceptionCode) {
    /**
     * API is not implemented.
     *
     * This usually means the API can't be used because it is not implemented for
     * the current platform.
     */
    ExceptionCode["Unimplemented"] = "UNIMPLEMENTED";
    /**
     * API is not available.
     *
     * This means the API can't be used right now because:
     *   - it is currently missing a prerequisite, such as network connectivity
     *   - it requires a particular platform or browser version
     */
    ExceptionCode["Unavailable"] = "UNAVAILABLE";
})(ExceptionCode || (ExceptionCode = {}));
class CapacitorException extends Error {
    constructor(message, code, data) {
        super(message);
        this.message = message;
        this.code = code;
        this.data = data;
    }
}
const getPlatformId = (win) => {
    var _a, _b;
    if (win === null || win === void 0 ? void 0 : win.androidBridge) {
        return 'android';
    }
    else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
        return 'ios';
    }
    else {
        return 'web';
    }
};

const createCapacitor = (win) => {
    const capCustomPlatform = win.CapacitorCustomPlatform || null;
    const cap = win.Capacitor || {};
    const Plugins = (cap.Plugins = cap.Plugins || {});
    const getPlatform = () => {
        return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
    };
    const isNativePlatform = () => getPlatform() !== 'web';
    const isPluginAvailable = (pluginName) => {
        const plugin = registeredPlugins.get(pluginName);
        if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
            // JS implementation available for the current platform.
            return true;
        }
        if (getPluginHeader(pluginName)) {
            // Native implementation available.
            return true;
        }
        return false;
    };
    const getPluginHeader = (pluginName) => { var _a; return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName); };
    const handleError = (err) => win.console.error(err);
    const registeredPlugins = new Map();
    const registerPlugin = (pluginName, jsImplementations = {}) => {
        const registeredPlugin = registeredPlugins.get(pluginName);
        if (registeredPlugin) {
            console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
            return registeredPlugin.proxy;
        }
        const platform = getPlatform();
        const pluginHeader = getPluginHeader(pluginName);
        let jsImplementation;
        const loadPluginImplementation = async () => {
            if (!jsImplementation && platform in jsImplementations) {
                jsImplementation =
                    typeof jsImplementations[platform] === 'function'
                        ? (jsImplementation = await jsImplementations[platform]())
                        : (jsImplementation = jsImplementations[platform]);
            }
            else if (capCustomPlatform !== null && !jsImplementation && 'web' in jsImplementations) {
                jsImplementation =
                    typeof jsImplementations['web'] === 'function'
                        ? (jsImplementation = await jsImplementations['web']())
                        : (jsImplementation = jsImplementations['web']);
            }
            return jsImplementation;
        };
        const createPluginMethod = (impl, prop) => {
            var _a, _b;
            if (pluginHeader) {
                const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
                if (methodHeader) {
                    if (methodHeader.rtype === 'promise') {
                        return (options) => cap.nativePromise(pluginName, prop.toString(), options);
                    }
                    else {
                        return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
                    }
                }
                else if (impl) {
                    return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
                }
            }
            else if (impl) {
                return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
            }
            else {
                throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
            }
        };
        const createPluginMethodWrapper = (prop) => {
            let remove;
            const wrapper = (...args) => {
                const p = loadPluginImplementation().then((impl) => {
                    const fn = createPluginMethod(impl, prop);
                    if (fn) {
                        const p = fn(...args);
                        remove = p === null || p === void 0 ? void 0 : p.remove;
                        return p;
                    }
                    else {
                        throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
                    }
                });
                if (prop === 'addListener') {
                    p.remove = async () => remove();
                }
                return p;
            };
            // Some flair ✨
            wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
            Object.defineProperty(wrapper, 'name', {
                value: prop,
                writable: false,
                configurable: false,
            });
            return wrapper;
        };
        const addListener = createPluginMethodWrapper('addListener');
        const removeListener = createPluginMethodWrapper('removeListener');
        const addListenerNative = (eventName, callback) => {
            const call = addListener({ eventName }, callback);
            const remove = async () => {
                const callbackId = await call;
                removeListener({
                    eventName,
                    callbackId,
                }, callback);
            };
            const p = new Promise((resolve) => call.then(() => resolve({ remove })));
            p.remove = async () => {
                console.warn(`Using addListener() without 'await' is deprecated.`);
                await remove();
            };
            return p;
        };
        const proxy = new Proxy({}, {
            get(_, prop) {
                switch (prop) {
                    // https://github.com/facebook/react/issues/20030
                    case '$$typeof':
                        return undefined;
                    case 'toJSON':
                        return () => ({});
                    case 'addListener':
                        return pluginHeader ? addListenerNative : addListener;
                    case 'removeListener':
                        return removeListener;
                    default:
                        return createPluginMethodWrapper(prop);
                }
            },
        });
        Plugins[pluginName] = proxy;
        registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy,
            platforms: new Set([...Object.keys(jsImplementations), ...(pluginHeader ? [platform] : [])]),
        });
        return proxy;
    };
    // Add in convertFileSrc for web, it will already be available in native context
    if (!cap.convertFileSrc) {
        cap.convertFileSrc = (filePath) => filePath;
    }
    cap.getPlatform = getPlatform;
    cap.handleError = handleError;
    cap.isNativePlatform = isNativePlatform;
    cap.isPluginAvailable = isPluginAvailable;
    cap.registerPlugin = registerPlugin;
    cap.Exception = CapacitorException;
    cap.DEBUG = !!cap.DEBUG;
    cap.isLoggingEnabled = !!cap.isLoggingEnabled;
    return cap;
};
const initCapacitorGlobal = (win) => (win.Capacitor = createCapacitor(win));

const Capacitor = /*#__PURE__*/ initCapacitorGlobal(typeof globalThis !== 'undefined'
    ? globalThis
    : typeof self !== 'undefined'
        ? self
        : typeof window !== 'undefined'
            ? window
            : typeof global !== 'undefined'
                ? global
                : {});
const registerPlugin = Capacitor.registerPlugin;

/**
 * Base class web plugins should extend.
 */
class WebPlugin {
    constructor() {
        this.listeners = {};
        this.retainedEventArguments = {};
        this.windowListeners = {};
    }
    addListener(eventName, listenerFunc) {
        let firstListener = false;
        const listeners = this.listeners[eventName];
        if (!listeners) {
            this.listeners[eventName] = [];
            firstListener = true;
        }
        this.listeners[eventName].push(listenerFunc);
        // If we haven't added a window listener for this event and it requires one,
        // go ahead and add it
        const windowListener = this.windowListeners[eventName];
        if (windowListener && !windowListener.registered) {
            this.addWindowListener(windowListener);
        }
        if (firstListener) {
            this.sendRetainedArgumentsForEvent(eventName);
        }
        const remove = async () => this.removeListener(eventName, listenerFunc);
        const p = Promise.resolve({ remove });
        return p;
    }
    async removeAllListeners() {
        this.listeners = {};
        for (const listener in this.windowListeners) {
            this.removeWindowListener(this.windowListeners[listener]);
        }
        this.windowListeners = {};
    }
    notifyListeners(eventName, data, retainUntilConsumed) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
            if (retainUntilConsumed) {
                let args = this.retainedEventArguments[eventName];
                if (!args) {
                    args = [];
                }
                args.push(data);
                this.retainedEventArguments[eventName] = args;
            }
            return;
        }
        listeners.forEach((listener) => listener(data));
    }
    hasListeners(eventName) {
        var _a;
        return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
    }
    registerWindowListener(windowEventName, pluginEventName) {
        this.windowListeners[pluginEventName] = {
            registered: false,
            windowEventName,
            pluginEventName,
            handler: (event) => {
                this.notifyListeners(pluginEventName, event);
            },
        };
    }
    unimplemented(msg = 'not implemented') {
        return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
    }
    unavailable(msg = 'not available') {
        return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
    }
    async removeListener(eventName, listenerFunc) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
            return;
        }
        const index = listeners.indexOf(listenerFunc);
        this.listeners[eventName].splice(index, 1);
        // If there are no more listeners for this type of event,
        // remove the window listener
        if (!this.listeners[eventName].length) {
            this.removeWindowListener(this.windowListeners[eventName]);
        }
    }
    addWindowListener(handle) {
        window.addEventListener(handle.windowEventName, handle.handler);
        handle.registered = true;
    }
    removeWindowListener(handle) {
        if (!handle) {
            return;
        }
        window.removeEventListener(handle.windowEventName, handle.handler);
        handle.registered = false;
    }
    sendRetainedArgumentsForEvent(eventName) {
        const args = this.retainedEventArguments[eventName];
        if (!args) {
            return;
        }
        delete this.retainedEventArguments[eventName];
        args.forEach((arg) => {
            this.notifyListeners(eventName, arg);
        });
    }
}

const WebView = /*#__PURE__*/ registerPlugin('WebView');
/******** END WEB VIEW PLUGIN ********/
/******** COOKIES PLUGIN ********/
/**
 * Safely web encode a string value (inspired by js-cookie)
 * @param str The string value to encode
 */
const encode = (str) => encodeURIComponent(str)
    .replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent)
    .replace(/[()]/g, escape);
/**
 * Safely web decode a string value (inspired by js-cookie)
 * @param str The string value to decode
 */
const decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
class CapacitorCookiesPluginWeb extends WebPlugin {
    async getCookies() {
        const cookies = document.cookie;
        const cookieMap = {};
        cookies.split(';').forEach((cookie) => {
            if (cookie.length <= 0)
                return;
            // Replace first "=" with CAP_COOKIE to prevent splitting on additional "="
            let [key, value] = cookie.replace(/=/, 'CAP_COOKIE').split('CAP_COOKIE');
            key = decode(key).trim();
            value = decode(value).trim();
            cookieMap[key] = value;
        });
        return cookieMap;
    }
    async setCookie(options) {
        try {
            // Safely Encoded Key/Value
            const encodedKey = encode(options.key);
            const encodedValue = encode(options.value);
            // Clean & sanitize options
            const expires = options.expires ? `; expires=${options.expires.replace('expires=', '')}` : '';
            const path = (options.path || '/').replace('path=', ''); // Default is "path=/"
            const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : '';
            document.cookie = `${encodedKey}=${encodedValue || ''}${expires}; path=${path}; ${domain};`;
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    async deleteCookie(options) {
        try {
            document.cookie = `${options.key}=; Max-Age=0`;
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    async clearCookies() {
        try {
            const cookies = document.cookie.split(';') || [];
            for (const cookie of cookies) {
                document.cookie = cookie.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
            }
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    async clearAllCookies() {
        try {
            await this.clearCookies();
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
}
const CapacitorCookies = registerPlugin('CapacitorCookies', {
    web: () => new CapacitorCookiesPluginWeb(),
});
// UTILITY FUNCTIONS
/**
 * Read in a Blob value and return it as a base64 string
 * @param blob The blob value to convert to a base64 string
 */
const readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        const base64String = reader.result;
        // remove prefix "data:application/pdf;base64,"
        resolve(base64String.indexOf(',') >= 0 ? base64String.split(',')[1] : base64String);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
});
/**
 * Normalize an HttpHeaders map by lowercasing all of the values
 * @param headers The HttpHeaders object to normalize
 */
const normalizeHttpHeaders = (headers = {}) => {
    const originalKeys = Object.keys(headers);
    const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
    const normalized = loweredKeys.reduce((acc, key, index) => {
        acc[key] = headers[originalKeys[index]];
        return acc;
    }, {});
    return normalized;
};
/**
 * Builds a string of url parameters that
 * @param params A map of url parameters
 * @param shouldEncode true if you should encodeURIComponent() the values (true by default)
 */
const buildUrlParams = (params, shouldEncode = true) => {
    if (!params)
        return null;
    const output = Object.entries(params).reduce((accumulator, entry) => {
        const [key, value] = entry;
        let encodedValue;
        let item;
        if (Array.isArray(value)) {
            item = '';
            value.forEach((str) => {
                encodedValue = shouldEncode ? encodeURIComponent(str) : str;
                item += `${key}=${encodedValue}&`;
            });
            // last character will always be "&" so slice it off
            item.slice(0, -1);
        }
        else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key}=${encodedValue}`;
        }
        return `${accumulator}&${item}`;
    }, '');
    // Remove initial "&" from the reduce
    return output.substr(1);
};
/**
 * Build the RequestInit object based on the options passed into the initial request
 * @param options The Http plugin options
 * @param extra Any extra RequestInit values
 */
const buildRequestInit = (options, extra = {}) => {
    const output = Object.assign({ method: options.method || 'GET', headers: options.headers }, extra);
    // Get the content-type
    const headers = normalizeHttpHeaders(options.headers);
    const type = headers['content-type'] || '';
    // If body is already a string, then pass it through as-is.
    if (typeof options.data === 'string') {
        output.body = options.data;
    }
    // Build request initializers based off of content-type
    else if (type.includes('application/x-www-form-urlencoded')) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(options.data || {})) {
            params.set(key, value);
        }
        output.body = params.toString();
    }
    else if (type.includes('multipart/form-data') || options.data instanceof FormData) {
        const form = new FormData();
        if (options.data instanceof FormData) {
            options.data.forEach((value, key) => {
                form.append(key, value);
            });
        }
        else {
            for (const key of Object.keys(options.data)) {
                form.append(key, options.data[key]);
            }
        }
        output.body = form;
        const headers = new Headers(output.headers);
        headers.delete('content-type'); // content-type will be set by `window.fetch` to includy boundary
        output.headers = headers;
    }
    else if (type.includes('application/json') || typeof options.data === 'object') {
        output.body = JSON.stringify(options.data);
    }
    return output;
};
// WEB IMPLEMENTATION
class CapacitorHttpPluginWeb extends WebPlugin {
    /**
     * Perform an Http request given a set of options
     * @param options Options to build the HTTP request
     */
    async request(options) {
        const requestInit = buildRequestInit(options, options.webFetchExtra);
        const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
        const url = urlParams ? `${options.url}?${urlParams}` : options.url;
        const response = await fetch(url, requestInit);
        const contentType = response.headers.get('content-type') || '';
        // Default to 'text' responseType so no parsing happens
        let { responseType = 'text' } = response.ok ? options : {};
        // If the response content-type is json, force the response to be json
        if (contentType.includes('application/json')) {
            responseType = 'json';
        }
        let data;
        let blob;
        switch (responseType) {
            case 'arraybuffer':
            case 'blob':
                blob = await response.blob();
                data = await readBlobAsBase64(blob);
                break;
            case 'json':
                data = await response.json();
                break;
            case 'document':
            case 'text':
            default:
                data = await response.text();
        }
        // Convert fetch headers to Capacitor HttpHeaders
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });
        return {
            data,
            headers,
            status: response.status,
            url: response.url,
        };
    }
    /**
     * Perform an Http GET request given a set of options
     * @param options Options to build the HTTP request
     */
    async get(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: 'GET' }));
    }
    /**
     * Perform an Http POST request given a set of options
     * @param options Options to build the HTTP request
     */
    async post(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: 'POST' }));
    }
    /**
     * Perform an Http PUT request given a set of options
     * @param options Options to build the HTTP request
     */
    async put(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: 'PUT' }));
    }
    /**
     * Perform an Http PATCH request given a set of options
     * @param options Options to build the HTTP request
     */
    async patch(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: 'PATCH' }));
    }
    /**
     * Perform an Http DELETE request given a set of options
     * @param options Options to build the HTTP request
     */
    async delete(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: 'DELETE' }));
    }
}
const CapacitorHttp = registerPlugin('CapacitorHttp', {
    web: () => new CapacitorHttpPluginWeb(),
});
/******** END HTTP PLUGIN ********/
/******** SYSTEM BARS PLUGIN ********/
/**
 * Available status bar styles.
 */
var SystemBarsStyle;
(function (SystemBarsStyle) {
    /**
     * Light system bar content on a dark background.
     *
     * @since 8.0.0
     */
    SystemBarsStyle["Dark"] = "DARK";
    /**
     * For dark system bar content on a light background.
     *
     * @since 8.0.0
     */
    SystemBarsStyle["Light"] = "LIGHT";
    /**
     * The style is based on the device appearance or the underlying content.
     * If the device is using Dark mode, the system bars content will be light.
     * If the device is using Light mode, the system bars content will be dark.
     *
     * @since 8.0.0
     */
    SystemBarsStyle["Default"] = "DEFAULT";
})(SystemBarsStyle || (SystemBarsStyle = {}));
/**
 * Available system bar types.
 */
var SystemBarType;
(function (SystemBarType) {
    /**
     * The top status bar on both Android and iOS.
     *
     * @since 8.0.0
     */
    SystemBarType["StatusBar"] = "StatusBar";
    /**
     * The navigation bar (or gesture bar on iOS) on both Android and iOS.
     *
     * @since 8.0.0
     */
    SystemBarType["NavigationBar"] = "NavigationBar";
})(SystemBarType || (SystemBarType = {}));
class SystemBarsPluginWeb extends WebPlugin {
    async setStyle() {
        this.unavailable('not available for web');
    }
    async setAnimation() {
        this.unavailable('not available for web');
    }
    async show() {
        this.unavailable('not available for web');
    }
    async hide() {
        this.unavailable('not available for web');
    }
}
const SystemBars = registerPlugin('SystemBars', {
    web: () => new SystemBarsPluginWeb(),
});

const index$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    Capacitor,
    CapacitorCookies,
    CapacitorException,
    CapacitorHttp,
    get ExceptionCode () { return ExceptionCode; },
    get SystemBarType () { return SystemBarType; },
    SystemBars,
    get SystemBarsStyle () { return SystemBarsStyle; },
    WebPlugin,
    WebView,
    buildRequestInit,
    registerPlugin
}, Symbol.toStringTag, { value: 'Module' }));

// ✅ BUG-49: Date.now() ID 충돌 방지 — 단조 증가 카운터 사용
let _toastId = 0;
// ✅ 4TH-A3: setTimeout 타이머 추적 Map — removeToast 시 clearTimeout으로 메모리 누수 방지
const _timers = new Map();

const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = ++_toastId; // ✅ 단조 증가 정수 — 무한 유일성 보장
    // ✅ 4TH-C1: set(state => ({...})) 스타일 통일 — useUserStore 패턴 일치
    set(state => ({ toasts: [...state.toasts, { id, message, type }] }));
    const timer = setTimeout(() => {
      _timers.delete(id);
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 3000);
    _timers.set(id, timer);
  },
  removeToast: (id) => {
    // ✅ 4TH-A3: clearTimeout으로 타이머 정리 — 수동 닫기 시 지연 set 호출 방지
    if (_timers.has(id)) {
      clearTimeout(_timers.get(id));
      _timers.delete(id);
    }
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },
}));

const TOAST_CONFIG = {
  error: { Icon: AlertCircle, color: "#FF3B30", bg: "rgba(255, 235, 235, 0.95)" },
  success: { Icon: CheckCircle, color: "#00C48C", bg: "rgba(235, 255, 245, 0.95)" },
  info: { Icon: Info, color: "#0056D2", bg: "rgba(235, 245, 255, 0.95)" }
};
const DEFAULT_TOAST = TOAST_CONFIG.info;
function Toast() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
    position: "fixed",
    bottom: "90px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "90%",
    maxWidth: "400px",
    pointerEvents: toasts.length === 0 ? "none" : "auto"
  }, children: toasts.map((toast) => {
    const { Icon, color, bg } = TOAST_CONFIG[toast.type] || DEFAULT_TOAST;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "12px 16px",
      backgroundColor: bg,
      borderRadius: "12px",
      border: `1px solid ${color}33`,
      boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
      backdropFilter: "blur(8px)",
      pointerEvents: "auto",
      animation: "slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 20, color }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "800", color: "#1A1A2E", flex: 1 }, children: toast.message }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16, color: "#8E8E93", style: { cursor: "pointer" }, onClick: () => removeToast(toast.id) })
    ] }, toast.id);
  }) });
}

const TIER_CONFIG = {
  FREE: { label: null, color: null, bg: null, price: 0 },
  BUSINESS_LITE: { label: "LITE", color: "#1A1A2E", bg: "linear-gradient(135deg, #C0C0C0, #A0A0A0)", price: 9900 },
  PRO: { label: "PRO", color: "#fff", bg: "linear-gradient(135deg, #0056D2, #003fa3)", price: 11e4 },
  BUSINESS_VIP: { label: "👑 VVIP", color: "#5C3A00", bg: "linear-gradient(135deg, #FFD700, #FF9B26)", price: 55e4 },
  MASTER: { label: "MASTER", color: "#fff", bg: "linear-gradient(135deg, #E60000, #990000)", price: null }
};
const LEVEL_CONFIG = [
  { level: 1, title: "초보 낚시꾼", emoji: "🪱", expRequired: 0, color: "#8E8E93", reward: "가입 환영 500 P 지급" },
  { level: 2, title: "견습 낚시꾼", emoji: "🎣", expRequired: 100, color: "#8E8E93", reward: "1,000 P 지급" },
  { level: 3, title: "낚시 입문자", emoji: "🐟", expRequired: 250, color: "#34C759", reward: "입문자용 프로필 은장 테두리" },
  { level: 4, title: "낚시 애호가", emoji: "🐠", expRequired: 500, color: "#34C759", reward: "2,000 P 지급" },
  { level: 5, title: "베테랑 낚시인", emoji: "🐡", expRequired: 850, color: "#0056D2", reward: "커뮤니티 닉네임 블루 네온 글로우 효과" },
  { level: 6, title: "중급 낚시꾼", emoji: "🦈", expRequired: 1300, color: "#0056D2", reward: "커뮤니티 닉네임 볼드(Bold) 형광 효과" },
  { level: 7, title: "고수 낚시인", emoji: "🎯", expRequired: 1900, color: "#FF9B26", reward: "고강도 프로필 금장 테두리 + 5,000 P" },
  { level: 8, title: "낚시 장인", emoji: "⚓", expRequired: 2700, color: "#FF9B26", reward: "채팅 및 글 작성 무지개색 폰트 사용권" },
  { level: 9, title: "전설의 낚시인", emoji: "👑", expRequired: 3700, color: "#FF5A5F", reward: "전설 등급 한정판 뱃지 애니메이션" }
];
const EXP_REWARDS = {
  attendance: { exp: 20, label: "출석 체크", icon: "📅" },
  post_write: { exp: 30, label: "게시글 작성", icon: "📝" },
  record_write: { exp: 50, label: "조과 기록 등록", icon: "🐟" },
  comment_write: { exp: 10, label: "댓글 작성", icon: "💬" },
  like_receive: { exp: 5, label: "좋아요 획득", icon: "❤️" },
  point_visit: { exp: 15, label: "포인트 방문 확인", icon: "📍" },
  photo_upload: { exp: 25, label: "낚시 사진 등록", icon: "📸" },
  first_catch: { exp: 100, label: "첫 조과 기록", icon: "🏆" },
  weekly_streak: { exp: 80, label: "7일 연속 출석", icon: "🔥" },
  monthly_streak: { exp: 300, label: "30일 연속 출석", icon: "⭐" }
};
const ADMIN_ID = "sunjulab.k";
const ADMIN_EMAIL = "sunjulab.k";
const getLevelInfo = (totalExp = 0) => {
  let currentLevel;
  let nextLevel;
  if (totalExp < 5e3) {
    for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
      if (totalExp >= LEVEL_CONFIG[i].expRequired) {
        currentLevel = LEVEL_CONFIG[i];
        nextLevel = LEVEL_CONFIG[i + 1] || { level: 10, expRequired: 5e3 };
        break;
      }
    }
  } else {
    const baseExp = 5e3;
    const additionalExp = totalExp - baseExp;
    let extraLevelIndex = 0;
    let currentExpThreshold = 0;
    let nextStepExp = 1500;
    while (additionalExp >= currentExpThreshold + nextStepExp) {
      currentExpThreshold += nextStepExp;
      nextStepExp += 300;
      extraLevelIndex++;
    }
    const currentLvlNum = 10 + extraLevelIndex;
    const expForCurrent = baseExp + currentExpThreshold;
    const expForNext = baseExp + currentExpThreshold + nextStepExp;
    currentLevel = {
      level: currentLvlNum,
      title: `초월 낚시신 ${extraLevelIndex + 1}단계`,
      emoji: "🌌",
      expRequired: expForCurrent,
      color: "#FFD700",
      reward: `초월 ${extraLevelIndex + 1}단계 스페셜 뱃지`
    };
    nextLevel = {
      level: currentLvlNum + 1,
      expRequired: expForNext
    };
  }
  const expInCurrentLevel = totalExp - currentLevel.expRequired;
  const expNeededForNext = nextLevel.expRequired - currentLevel.expRequired;
  const progressPct = Math.min(100, Math.max(0, Math.round(expInCurrentLevel / expNeededForNext * 100)));
  return {
    ...currentLevel,
    totalExp,
    expInCurrentLevel,
    expNeededForNext,
    progressPct,
    nextLevel,
    isMaxLevel: false
    // 만렙 삭제
  };
};
function safeParseUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function safeGetTier(parsedUser) {
  try {
    const fromUser = parsedUser?.tier;
    const fromKey = localStorage.getItem("userTier");
    return fromUser || fromKey || "FREE";
  } catch {
    return "FREE";
  }
}
const _ls = {
  set: (key, val) => {
    try {
      localStorage.setItem(key, val);
    } catch {
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
    }
  }
};
const _initialUser = safeParseUser();
const useUserStore = create((set, get) => ({
  // 사용자 데이터
  user: _initialUser,
  // 구독 티어 — user.tier와 항상 일치하도록 초기화
  userTier: safeGetTier(_initialUser),
  // ── 기본 유저 업데이트 ──
  updateUser: (newData) => set((state) => {
    const updatedUser = { ...state.user, ...newData };
    _ls.set("user", JSON.stringify(updatedUser));
    const newState = { user: updatedUser };
    if (newData.tier) {
      _ls.set("userTier", newData.tier);
      newState.userTier = newData.tier;
    }
    return newState;
  }),
  setUser: (newUser) => set(() => {
    if (newUser) {
      _ls.set("user", JSON.stringify(newUser));
      if (newUser.tier)
        _ls.set("userTier", newUser.tier);
      return { user: newUser, userTier: newUser.tier || "FREE" };
    } else {
      _ls.remove("user");
      _ls.remove("userTier");
      _ls.remove("token");
      _ls.remove("access_token");
      _ls.remove("refresh_token");
      return { user: null, userTier: "FREE" };
    }
  }),
  // ── EXP 추가 (로컬 즉시 반영) ──
  addExp: (amount, activityKey = "") => set((state) => {
    if (!state.user)
      return {};
    const currentTotalExp = state.user.totalExp || 0;
    const newTotalExp = currentTotalExp + amount;
    const newLevelInfo = getLevelInfo(newTotalExp);
    const oldLevelInfo = getLevelInfo(currentTotalExp);
    const updatedUser = {
      ...state.user,
      totalExp: newTotalExp,
      level: newLevelInfo.level,
      exp: newLevelInfo.expInCurrentLevel,
      levelTitle: newLevelInfo.title
    };
    _ls.set("user", JSON.stringify(updatedUser));
    const leveledUp = newLevelInfo.level > oldLevelInfo.level;
    return { user: updatedUser, lastExpGain: { amount, activityKey, leveledUp, newLevel: newLevelInfo } };
  }),
  // ── 구독 티어 ──
  setUserTier: (tier) => {
    _ls.set("userTier", tier);
    set({ userTier: tier });
  },
  logout: () => {
    const state = get();
    const email = state.user?.email;
    _ls.remove("user");
    _ls.remove("userTier");
    _ls.remove("token");
    _ls.remove("access_token");
    _ls.remove("refresh_token");
    if (email)
      _ls.remove(`avatar_${email}`);
    set({ user: null, userTier: "FREE", lastExpGain: null });
  },
  // ── PRO/VVIP 구독 만료 자동 체크 (앱 시작 시 호출) ──
  checkSubscriptionExpiry: async () => {
    const state = get();
    const userId = state.user?.email || state.user?.id;
    if (!userId)
      return;
    if (get().isAdmin())
      return;
    const paidTiers = ["BUSINESS_LITE", "PRO", "BUSINESS_VIP"];
    if (!paidTiers.includes(state.userTier))
      return;
    try {
      const { default: apiClient } = await __vitePreload(() => Promise.resolve().then(() => index),true?void 0:void 0);
      const res = await apiClient.get(`/api/payment/subscription/${encodeURIComponent(userId)}`);
      const data = res.data;
      if (!data.hasSubscription || data.status === "failed") {
        if (false)
          console.log(`[구독 만료] ${state.userTier} → FREE (결제실패)`);
        _ls.set("userTier", "FREE");
        const currentUser = get().user;
        if (currentUser) {
          const updated = { ...currentUser, tier: "FREE" };
          _ls.set("user", JSON.stringify(updated));
          set({ userTier: "FREE", user: updated });
        } else {
          set({ userTier: "FREE" });
        }
        return;
      }
      if (data.status === "cancelled") {
        const expiry = data.nextBillingDate ? new Date(data.nextBillingDate) : null;
        if (!expiry || expiry < /* @__PURE__ */ new Date()) {
          _ls.set("userTier", "FREE");
          const currentUser = get().user;
          if (currentUser) {
            const updated = { ...currentUser, tier: "FREE" };
            _ls.set("user", JSON.stringify(updated));
            set({ userTier: "FREE", user: updated });
          } else {
            set({ userTier: "FREE" });
          }
          if (false)
            console.log(`[구독 만료] ${state.userTier} → FREE (취소 후 기간 종료)`);
        }
      }
    } catch (e) {
      if (false) {
        console.warn("[구독 체크] 네트워크 오류, 현재 tier 유지:", state.userTier, e?.message);
      }
    }
  },
  // ── 서버에서 최신 사용자 정보 동기화 (재로그인 없이 tier/avatar 갱신) ──
  syncFromServer: async () => {
    const state = get();
    const email = state.user?.email;
    if (!email || state.user?.id === "GUEST")
      return;
    if (get().isAdmin())
      return;
    const TIER_RANK = { FREE: 0, BUSINESS_LITE: 1, PRO: 2, BUSINESS_VIP: 3, MASTER: 4 };
    const currentTierRank = TIER_RANK[state.userTier] ?? 0;
    try {
      const { default: apiClient } = await __vitePreload(() => Promise.resolve().then(() => index),true?void 0:void 0);
      const res = await apiClient.get(`/api/user/me?email=${encodeURIComponent(email)}`);
      const fresh = res.data;
      const current = get().user;
      const serverTier = fresh.tier || "FREE";
      const serverTierRank = TIER_RANK[serverTier] ?? 0;
      if (serverTierRank < currentTierRank) {
        if (false) {
          console.warn("[syncFromServer] 서버 tier가 현재보다 낮음 — 업데이트 스킵 (", state.userTier, "->", serverTier, ")");
        }
        const avatarChanged2 = fresh.avatar && fresh.avatar !== current?.avatar;
        if (avatarChanged2) {
          const updated = { ...current, avatar: fresh.avatar };
          _ls.set("user", JSON.stringify(updated));
          set({ user: updated });
        }
        return;
      }
      const tierChanged = serverTier !== (current?.tier || "FREE");
      const avatarChanged = fresh.avatar && fresh.avatar !== current?.avatar;
      if (tierChanged || avatarChanged) {
        const updated = { ...current, ...fresh, tier: serverTier };
        _ls.set("user", JSON.stringify(updated));
        if (serverTier)
          _ls.set("userTier", serverTier);
        set({ user: updated, userTier: serverTier });
        if (false)
          console.log("[syncFromServer] 사용자 정보 갱신:", { tierChanged, avatarChanged });
      }
    } catch (e) {
    }
  },
  // ── 레벨 정보 헬퍼 ──
  getLevelInfo: () => getLevelInfo(get().user?.totalExp || 0),
  // 마지막 EXP 획득 이벤트 (레벨업 알림 등에 활용)
  lastExpGain: null,
  clearLastExpGain: () => set({ lastExpGain: null }),
  // ── 권한 헬퍼 ──
  // ✅ WARN-US2: name 필드 체크 제거 — 닉네임은 사용자가 직접 설정하므로 위조 가능
  // 어드민 판별은 반드시 id(서버 지정) 또는 email(고유값)만 사용
  // ✅ 3RD-A3: ADMIN_ID/ADMIN_EMAIL 상수 사용 — 5중 코드 중복 통합
  canAccessPremium: () => {
    const state = get();
    if (state.user?.id === ADMIN_ID || state.user?.email === ADMIN_EMAIL || state.user?.email === "sunjulab.k@gmail.com")
      return true;
    return ["BUSINESS_LITE", "PRO", "BUSINESS_VIP", "MASTER"].includes(state.userTier);
  },
  // 비즈니스 홍보글 작성: PRO 또는 VVIP만 허용 (Business Lite는 배제)
  canAccessBusinessPromo: () => {
    const state = get();
    if (state.user?.id === ADMIN_ID || state.user?.email === ADMIN_EMAIL || state.user?.email === "sunjulab.k@gmail.com" || state.userTier === "MASTER")
      return true;
    return ["PRO", "BUSINESS_VIP"].includes(state.userTier);
  },
  canAccessBusinessShop: () => {
    const state = get();
    if (state.user?.id === ADMIN_ID || state.user?.email === ADMIN_EMAIL || state.user?.email === "sunjulab.k@gmail.com" || state.userTier === "MASTER")
      return true;
    return ["BUSINESS_LITE", "PRO", "BUSINESS_VIP"].includes(state.userTier);
  },
  canAccessVIP: () => {
    const state = get();
    if (state.user?.id === ADMIN_ID || state.user?.email === ADMIN_EMAIL || state.user?.email === "sunjulab.k@gmail.com" || state.userTier === "MASTER")
      return true;
    return state.userTier === "BUSINESS_VIP";
  },
  isAdmin: () => {
    const state = get();
    return state.user?.id === ADMIN_ID || state.user?.email === ADMIN_EMAIL || state.user?.email === "sunjulab.k@gmail.com" || state.userTier === "MASTER";
  }
}));

const useUserStore$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    ADMIN_EMAIL,
    ADMIN_ID,
    EXP_REWARDS,
    LEVEL_CONFIG,
    TIER_CONFIG,
    getLevelInfo,
    useUserStore
}, Symbol.toStringTag, { value: 'Module' }));

function LoadingSpinner({ size = "40px", color = "#0056D2", label = "불러오는 중...", style }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        minHeight: "200px",
        // ✅ 4TH-C4: style prop 미전달 시 height:0 방지 — PageLoading 등 외부 style로 오버라이드 가능
        ...style
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              width: size,
              height: size,
              border: `3px solid ${color}`,
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite"
            }
          }
        ),
        label && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "800" }, children: label })
      ]
    }
  );
}

let sdkLoaded = false;
function KakaoLoader() {
  reactExports.useEffect(() => {
    if (sdkLoaded)
      return;
    if (window.kakao?.maps) {
      sdkLoaded = true;
      return;
    }
    const KAKAO_KEY = "d353be56977b1c13b03d8981bcf8b5ba";
    if (!KAKAO_KEY) {
      if (false)
        console.warn("[낚시GO] VITE_KAKAO_APP_KEY 미설정");
      return;
    }
    if (document.querySelector('script[src*="dapi.kakao.com/v2/maps"]')) {
      sdkLoaded = true;
      return;
    }
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services,clusterer&autoload=false`;
    document.head.appendChild(script);
    sdkLoaded = true;
  }, []);
  return null;
}

const ADMOB_CONFIG = {
  // 앱 ID (AndroidManifest.xml에도 등록 필요)
  APP_ID: "ca-app-pub-9774243773523817~7409873309",
  // 보상형 광고 — CCTV 1회 무료 보기, 비밀포인트 확인 등
  REWARDED_ID: true ? "ca-app-pub-9774243773523817/1020026097" : "ca-app-pub-3940256099942544/5224354917",
  // 개발 테스트 ID
  // 네이티브 광고 — 커뮤니티 피드 중간 삽입
  NATIVE_ID: true ? "ca-app-pub-9774243773523817/8130405525" : "ca-app-pub-3940256099942544/2247696110",
  // 개발 테스트 ID (표준형)
  // 배너 광고 — 인라인/고정 배너 (320×50)
  // ✅ 2026-05-29 신규 발급: AdMob 콘솔 > 광고 단위 > 배너
  BANNER_ID: true ? "ca-app-pub-9774243773523817/7590161071" : "ca-app-pub-3940256099942544/6300978111",
  // 구글 공식 테스트 배너 ID
  // 전면(인터스티셜) 광고 — 선상배홍보 탭 진입 시 FREE 유저
  INTERSTITIAL_ID: true ? "ca-app-pub-9774243773523817/1020026097" : "ca-app-pub-3940256099942544/1033173712"
  // 구글 공식 테스트 전면광고 ID
};
const AD_CONFIG = {
  // 무료 사용자라도 쾌적하게! (UX 최적화 모드)
  FREE_USER: {
    FEED_AD_INTERVAL: 5,
    // 5개 게시글마다 광고 1회 삽입 (기존 10)
    SHOW_REWARD_AD_ON_POST: false,
    BOTTOM_SHEET_AD: true
  },
  // 유료/비즈니스 사용자는 아예 클린하게
  PRO_USER: {
    ALL_ADS_HIDDEN: true
  }
};

const isNative = () => typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();
const IS_ADMOB_TESTING = true;
let AdMob = null;
async function initAdMob() {
  if (!isNative())
    return;
  try {
    const mod = await __vitePreload(() => import('./index-C0FNfKN7.js'),true?__vite__mapDeps([0,1,2,3,4,5]):void 0);
    AdMob = mod.AdMob;
    await AdMob.initialize({
      requestTrackingAuthorization: false,
      testingDevices: [],
      initializeForTesting: IS_ADMOB_TESTING
    });
    if (false)
      console.log(`[AdMob] 초기화 완료 (테스트모드: ${IS_ADMOB_TESTING})`);
  } catch (e) {
    if (false)
      console.warn("[AdMob] 초기화 실패 (웹 환경에서는 정상):", e.message);
  }
}
function showWebRewardedAd(onRewarded, onFailed, onNoAd) {
  if (typeof window.adBreak !== "function") {
    if (false)
      console.log("[AdSense] adBreak 함수 없음 → fallback");
    onNoAd?.();
    return;
  }
  let adShown = false;
  let rewarded = false;
  let adCompleted = false;
  window.adBreak({
    type: "reward",
    name: "fishing-point-reward",
    // 광고 준비됨 → 실행
    beforeReward: (showAdFn) => {
      adShown = true;
      if (false)
        console.log("[AdSense] 보상형 광고 준비됨 → 실행");
      showAdFn();
    },
    // 광고 완료 시청 → 보상 지급
    adViewed: () => {
      rewarded = true;
      if (false)
        console.log("[AdSense] 보상형 광고 시청 완료 → 보상 지급");
      onRewarded?.();
    },
    // 광고 스킵/닫기 → 보상 없음
    adDismissed: () => {
      if (false)
        console.log("[AdSense] 보상형 광고 스킵");
      if (!rewarded)
        onFailed?.();
    },
    // 광고 사이클 완료 (광고 없음 or 완료 후)
    afterAd: () => {
      adCompleted = true;
      if (!adShown) {
        if (false)
          console.log("[AdSense] 광고 없음 → 30초 타이머 fallback");
        onNoAd?.();
      }
    }
  });
}
async function showRewardedAd(onRewarded, onFailed) {
  if (isNative() && AdMob) {
    try {
      const options = {
        adId: ADMOB_CONFIG.REWARDED_ID,
        isTesting: IS_ADMOB_TESTING
      };
      await AdMob.prepareRewardVideoAd(options);
      let rewarded = false;
      const rewardListener = await AdMob.addListener(
        "onRewardedVideoAdReward",
        (reward) => {
          if (false)
            console.log("[AdMob] 보상 수령:", reward);
          rewarded = true;
          rewardListener.remove();
          onRewarded?.(reward);
        }
      );
      const closeListener = await AdMob.addListener(
        "onRewardedVideoAdDismissed",
        () => {
          closeListener.remove();
          if (!rewarded)
            onFailed?.();
        }
      );
      await AdMob.showRewardVideoAd();
      return { simulated: false };
    } catch (e) {
      if (false)
        console.error("[AdMob] 보상형 광고 오류:", e);
      onFailed?.(e);
      return { simulated: false };
    }
  }
  if (!isNative()) {
    let adSenseHandled = false;
    showWebRewardedAd(
      // onRewarded
      () => {
        adSenseHandled = true;
        onRewarded?.();
      },
      // onFailed
      () => {
        adSenseHandled = true;
        onFailed?.();
      },
      // onNoAd (광고 없음 → 타이머 fallback)
      () => {
        if (!adSenseHandled) {
          if (false)
            console.log("[AdSense] fallback → 30초 타이머 시뮬레이션");
        }
      }
    );
    return { simulated: !adSenseHandled };
  }
  if (false)
    console.log("[AdMob] AdMob 미초기화 → fallback");
  return { simulated: true };
}

const API_BASE_URL = "https://fishing-go-backend.onrender.com";
if (false) {
  console.warn("[apiClient] ⚠️ VITE_API_URL 미설정 — localhost:5000으로 요청 중. 배포 환경에서 반드시 설정하세요.");
}
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 6e4
  // 60s — Render 무료 플랜 콜드스타트(최대 50s) + 모바일 LTE 지연 대응
  // ENH-B1: heavy 요청(이미지 업로드 등)은 개별 호출 시 timeout 오버라이드 사용
  // 예: apiClient.post('/api/user/avatar', data, { timeout: 60000 })
});
apiClient.interceptors.request.use(
  (config) => {
    let token = null;
    try {
      token = localStorage.getItem("access_token");
    } catch {
    }
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
let isRefreshing = false;
let failedQueue = [];
const MAX_QUEUE = 10;
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error)
      prom.reject(error);
    else
      prom.resolve(token);
  });
  failedQueue = [];
};
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 403 && error.response?.data?.code === "SUBSCRIPTION_EXPIRED") {
      try {
        const { useUserStore } = await __vitePreload(() => Promise.resolve().then(() => useUserStore$1),true?void 0:void 0);
        useUserStore.getState().setUserTier("FREE");
        useUserStore.getState().updateUser({ tier: "FREE", subscriptionExpiresAt: null });
      } catch (e) {
        if (false)
          console.warn("[apiClient] 구독 만료 해제 실패:", e);
      }
      window.dispatchEvent(new CustomEvent("subscription_expired"));
      return Promise.reject(error);
    }
    const subscriptionCodes = ["AUTH_REQUIRED", "USER_UNKNOWN", "SUBSCRIPTION_REQUIRED"];
    if (error.response?.status === 401 && subscriptionCodes.includes(error.response?.data?.code)) {
      return Promise.reject(error);
    }
    const isAuthRoute = originalRequest.url?.includes("/api/auth/");
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      let refreshToken = null;
      try {
        refreshToken = localStorage.getItem("refresh_token");
      } catch {
      }
      if (!refreshToken) {
        if (false)
          console.warn("[Auth] Refresh Token 없음 → 로그인 필요");
        try {
          const stored = JSON.parse(localStorage.getItem("user") || "{}");
          if (stored?.id === "GUEST") {
            return Promise.reject(error);
          }
        } catch (e) {
          if (false)
            console.warn("[apiClient] localStorage 파싱 실패:", e);
        }
        window.dispatchEvent(new CustomEvent("auth_expired"));
        return Promise.reject(error);
      }
      if (isRefreshing) {
        if (failedQueue.length >= MAX_QUEUE) {
          return Promise.reject(new Error("요청 큐가 초과되었습니다. 잠시 후 다시 시도해주세요."));
        }
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch((err) => Promise.reject(err));
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken }, { timeout: 1e4 });
        const newAccessToken = response.data.accessToken || response.data.token;
        const { refreshToken: newRefreshToken } = response.data;
        if (!newAccessToken) {
          throw new Error("서버가 유효한 액세스 토큰을 반환하지 않았습니다.");
        }
        try {
          localStorage.setItem("access_token", newAccessToken);
        } catch {
        }
        if (newRefreshToken) {
          try {
            localStorage.setItem("refresh_token", newRefreshToken);
          } catch {
          }
        }
        apiClient.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        try {
          const { useUserStore } = await __vitePreload(() => Promise.resolve().then(() => useUserStore$1),true?void 0:void 0);
          useUserStore.getState().logout();
        } catch (e) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
        }
        if (false)
          console.warn("[Auth] Refresh Token 만료 → 자동 로그아웃");
        window.dispatchEvent(new CustomEvent("auth_expired"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

const index = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: apiClient
}, Symbol.toStringTag, { value: 'Module' }));

// ─── 1. 푸시 알림 권한 + FCM 토큰 등록 ────────────────────────────────────────
async function initPushPermission(userId) {
  if (!Capacitor.isNativePlatform()) return { ok: false, reason: 'web' };
  try {
    const { PushNotifications } = await __vitePreload(() => import('./index-Dr1tD_1f.js'),true?__vite__mapDeps([6,1,2,3,4,5]):void 0);

    // 기존 리스너 중복 방지
    await PushNotifications.removeAllListeners();

    // 권한 요청
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') {
      console.warn('[PUSH] 알림 권한 거부됨');
      return { ok: false, reason: 'denied' };
    }

    // FCM 등록
    await PushNotifications.register();

    // 토큰 수신 → 서버 저장
    PushNotifications.addListener('registration', async ({ value: token }) => {
      try {
        await apiClient.post('/api/user/push-token', {
          token,
          platform: Capacitor.getPlatform(), // 'android' | 'ios'
        });
        console.log('[PUSH] ✅ FCM 토큰 등록 완료 (userId:', userId, ')');
      } catch (e) {
        console.warn('[PUSH] 토큰 저장 실패:', e.message);
      }
    });

    // 등록 실패
    PushNotifications.addListener('registrationError', (err) => {
      console.error('[PUSH] FCM 등록 오류:', err.error);
    });

    // 포그라운드 알림 수신 → 알림 배지 표시
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[PUSH] 포그라운드 알림 수신:', notification.title);
      // 토스트 표시는 setPushHandlers 통해 주입
      if (window.__pushToast) {
        window.__pushToast(`🔔 ${notification.title}: ${notification.body}`, 'info');
      }
    });

    // 알림 탭 → 화면 이동
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const route = action.notification?.data?.route;
      if (route && window.__pushNavigate) {
        window.__pushNavigate(route);
      }
    });

    return { ok: true };
  } catch (err) {
    console.error('[PUSH] 초기화 실패:', err.message);
    return { ok: false, reason: err.message };
  }
}

// 푸시 핸들러 주입 (App.jsx에서 호출)
function setPushHandlers({ addToast, navigate }) {
  window.__pushToast = addToast;
  window.__pushNavigate = navigate;
}

// 토큰 해제 (로그아웃 시)
async function unregisterPushToken() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { PushNotifications } = await __vitePreload(() => import('./index-Dr1tD_1f.js'),true?__vite__mapDeps([6,1,2,3,4,5]):void 0);
    await PushNotifications.removeAllListeners();
    await apiClient.delete('/api/user/push-token');
    console.log('[PUSH] ✅ FCM 토큰 해제 완료');
  } catch (e) {
    console.warn('[PUSH] 토큰 해제 실패:', e.message);
  }
}

// ─── 2. 위치 권한 ──────────────────────────────────────────────────────────────
async function requestLocationPermission() {
  if (!Capacitor.isNativePlatform()) {
    // 웹: navigator.geolocation API
    if (!navigator.geolocation) return { ok: false, reason: 'not-supported' };
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve({ ok: true }),
        (err) => resolve({ ok: false, reason: err.message }),
        { timeout: 5000 }
      );
    });
  }
  try {
    const { Geolocation } = await __vitePreload(() => import('./index-pstjdH-l.js'),true?__vite__mapDeps([7,1,2,3,4,5]):void 0);
    const perm = await Geolocation.requestPermissions();
    // 'granted' | 'denied' | 'prompt'
    const ok = perm.location === 'granted' || perm.coarseLocation === 'granted';
    console.log('[GEO] 위치 권한:', perm.location);
    return { ok, status: perm.location };
  } catch (e) {
    console.warn('[GEO] 위치 권한 요청 실패:', e.message);
    return { ok: false, reason: e.message };
  }
}

// ─── 3. 카메라 / 사진 라이브러리 권한 ─────────────────────────────────────────
async function requestCameraPermission() {
  if (!Capacitor.isNativePlatform()) return { ok: true }; // 웹은 별도 권한 불필요
  try {
    const { Camera } = await __vitePreload(() => import('./index-BQZdZ9gP.js'),true?__vite__mapDeps([8,1,2,3,4,5]):void 0);
    const perm = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
    const cameraOk = perm.camera === 'granted' || perm.camera === 'limited';
    const photosOk = perm.photos === 'granted' || perm.photos === 'limited';
    console.log('[CAM] 카메라:', perm.camera, '/ 사진:', perm.photos);
    return { ok: cameraOk && photosOk, camera: perm.camera, photos: perm.photos };
  } catch (e) {
    console.warn('[CAM] 카메라 권한 요청 실패:', e.message);
    return { ok: false, reason: e.message };
  }
}

// ─── 4. 네트워크 상태 모니터링 ─────────────────────────────────────────────────
async function initNetworkMonitor(onOffline, onOnline) {
  if (!Capacitor.isNativePlatform()) {
    // 웹 fallback
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }
  try {
    const { Network } = await __vitePreload(() => import('./index-D42zMw9k.js'),true?__vite__mapDeps([9,1,2,3,4,5]):void 0);
    const status = await Network.getStatus();
    if (!status.connected) onOffline?.();

    const listener = await Network.addListener('networkStatusChange', (s) => {
      if (s.connected) onOnline?.();
      else onOffline?.();
    });
    return () => listener.remove();
  } catch (e) {
    console.warn('[NET] 네트워크 모니터 실패:', e.message);
    return () => {};
  }
}

// ─── 5. 전체 권한 초기화 (앱 시작/로그인 후 일괄 요청) ─────────────────────────
async function requestAllPermissions(userId) {
  if (!Capacitor.isNativePlatform()) return;

  console.log('[PERM] 권한 초기화 시작 (userId:', userId, ')');

  // 1) 푸시 알림 (가장 먼저 — 사용자 주목 유도)
  const push = await initPushPermission(userId);
  console.log('[PERM] 푸시:', push.ok ? '✅' : '❌', push.reason || '');

  // 2) 위치 (지도 기능 필수)
  const loc = await requestLocationPermission();
  console.log('[PERM] 위치:', loc.ok ? '✅' : '❌', loc.reason || '');

  // 3) 카메라/사진 (조과 등록 필수)
  const cam = await requestCameraPermission();
  console.log('[PERM] 카메라:', cam.ok ? '✅' : '❌', cam.reason || '');

  return { push, location: loc, camera: cam };
}

var define_import_meta_env_default = { VITE_API_URL: "https://fishing-go-backend.onrender.com", VITE_PORTONE_MERCHANT_ID: "imp31403032", VITE_PORTONE_CHANNEL_KEY: "channel-key-7adcd18e-3aa6-4938-8029-48f0f9943d55", VITE_KAKAO_APP_KEY: "d353be56977b1c13b03d8981bcf8b5ba", VITE_ADMOB_TESTING: "true", VITE_DISABLE_PWA: "true", VITE_ADSENSE_SLOT_DISPLAY: "4975909941", VITE_ADSENSE_SLOT_INFEED: "8319268904", VITE_TIDE_API_KEY: "2c92debdb84cf6c2ca60816fa5e9acbbfa06a9ae502cc37919ebec6be629623a", VITE_SITE_URL: "https://www.fishing-go.com", BASE_URL: "/", MODE: "production", DEV: false, PROD: true, SSR: false };
const reduxImpl = (reducer, initial) => (set, _get, api) => {
  api.dispatch = (action) => {
    set((state) => reducer(state, action), false, action);
    return action;
  };
  api.dispatchFromDevtools = true;
  return { dispatch: (...args) => api.dispatch(...args), ...initial };
};
const redux = reduxImpl;
const shouldDispatchFromDevtools = (api) => !!api.dispatchFromDevtools && typeof api.dispatch === "function";
const trackedConnections = /* @__PURE__ */ new Map();
const getTrackedConnectionState = (name) => {
  const api = trackedConnections.get(name);
  if (!api)
    return {};
  return Object.fromEntries(
    Object.entries(api.stores).map(([key, api2]) => [key, api2.getState()])
  );
};
const extractConnectionInformation = (store, extensionConnector, options) => {
  if (store === void 0) {
    return {
      type: "untracked",
      connection: extensionConnector.connect(options)
    };
  }
  const existingConnection = trackedConnections.get(options.name);
  if (existingConnection) {
    return { type: "tracked", store, ...existingConnection };
  }
  const newConnection = {
    connection: extensionConnector.connect(options),
    stores: {}
  };
  trackedConnections.set(options.name, newConnection);
  return { type: "tracked", store, ...newConnection };
};
const removeStoreFromTrackedConnections = (name, store) => {
  if (store === void 0)
    return;
  const connectionInfo = trackedConnections.get(name);
  if (!connectionInfo)
    return;
  delete connectionInfo.stores[store];
  if (Object.keys(connectionInfo.stores).length === 0) {
    trackedConnections.delete(name);
  }
};
const findCallerName = (stack) => {
  var _a, _b;
  if (!stack)
    return void 0;
  const traceLines = stack.split("\n");
  const apiSetStateLineIndex = traceLines.findIndex(
    (traceLine) => traceLine.includes("api.setState")
  );
  if (apiSetStateLineIndex < 0)
    return void 0;
  const callerLine = ((_a = traceLines[apiSetStateLineIndex + 1]) == null ? void 0 : _a.trim()) || "";
  return (_b = /.+ (.+) .+/.exec(callerLine)) == null ? void 0 : _b[1];
};
const devtoolsImpl = (fn, devtoolsOptions = {}) => (set, get, api) => {
  const { enabled, anonymousActionType, store, ...options } = devtoolsOptions;
  let extensionConnector;
  try {
    extensionConnector = (enabled != null ? enabled : (define_import_meta_env_default ? "production" : void 0) !== "production") && window.__REDUX_DEVTOOLS_EXTENSION__;
  } catch (e) {
  }
  if (!extensionConnector) {
    return fn(set, get, api);
  }
  const { connection, ...connectionInformation } = extractConnectionInformation(store, extensionConnector, options);
  let isRecording = true;
  api.setState = (state, replace, nameOrAction) => {
    const r = set(state, replace);
    if (!isRecording)
      return r;
    const action = nameOrAction === void 0 ? {
      type: anonymousActionType || findCallerName(new Error().stack) || "anonymous"
    } : typeof nameOrAction === "string" ? { type: nameOrAction } : nameOrAction;
    if (store === void 0) {
      connection == null ? void 0 : connection.send(action, get());
      return r;
    }
    connection == null ? void 0 : connection.send(
      {
        ...action,
        type: `${store}/${action.type}`
      },
      {
        ...getTrackedConnectionState(options.name),
        [store]: api.getState()
      }
    );
    return r;
  };
  api.devtools = {
    cleanup: () => {
      if (connection && typeof connection.unsubscribe === "function") {
        connection.unsubscribe();
      }
      removeStoreFromTrackedConnections(options.name, store);
    }
  };
  const setStateFromDevtools = (...a) => {
    const originalIsRecording = isRecording;
    isRecording = false;
    set(...a);
    isRecording = originalIsRecording;
  };
  const initialState = fn(api.setState, get, api);
  if (connectionInformation.type === "untracked") {
    connection == null ? void 0 : connection.init(initialState);
  } else {
    connectionInformation.stores[connectionInformation.store] = api;
    connection == null ? void 0 : connection.init(
      Object.fromEntries(
        Object.entries(connectionInformation.stores).map(([key, store2]) => [
          key,
          key === connectionInformation.store ? initialState : store2.getState()
        ])
      )
    );
  }
  if (shouldDispatchFromDevtools(api)) {
    let didWarnAboutReservedActionType = false;
    const originalDispatch = api.dispatch;
    api.dispatch = (...args) => {
      if ((define_import_meta_env_default ? "production" : void 0) !== "production" && args[0].type === "__setState" && !didWarnAboutReservedActionType) {
        console.warn(
          '[zustand devtools middleware] "__setState" action type is reserved to set state from the devtools. Avoid using it.'
        );
        didWarnAboutReservedActionType = true;
      }
      originalDispatch(...args);
    };
  }
  connection.subscribe((message) => {
    var _a;
    switch (message.type) {
      case "ACTION":
        if (typeof message.payload !== "string") {
          console.error(
            "[zustand devtools middleware] Unsupported action format"
          );
          return;
        }
        return parseJsonThen(
          message.payload,
          (action) => {
            if (action.type === "__setState") {
              if (store === void 0) {
                setStateFromDevtools(action.state);
                return;
              }
              if (Object.keys(action.state).length !== 1) {
                console.error(
                  `
                    [zustand devtools middleware] Unsupported __setState action format.
                    When using 'store' option in devtools(), the 'state' should have only one key, which is a value of 'store' that was passed in devtools(),
                    and value of this only key should be a state object. Example: { "type": "__setState", "state": { "abc123Store": { "foo": "bar" } } }
                    `
                );
              }
              const stateFromDevtools = action.state[store];
              if (stateFromDevtools === void 0 || stateFromDevtools === null) {
                return;
              }
              if (JSON.stringify(api.getState()) !== JSON.stringify(stateFromDevtools)) {
                setStateFromDevtools(stateFromDevtools);
              }
              return;
            }
            if (shouldDispatchFromDevtools(api)) {
              api.dispatch(action);
            }
          }
        );
      case "DISPATCH":
        switch (message.payload.type) {
          case "RESET":
            setStateFromDevtools(initialState);
            if (store === void 0) {
              return connection == null ? void 0 : connection.init(api.getState());
            }
            return connection == null ? void 0 : connection.init(getTrackedConnectionState(options.name));
          case "COMMIT":
            if (store === void 0) {
              connection == null ? void 0 : connection.init(api.getState());
              return;
            }
            return connection == null ? void 0 : connection.init(getTrackedConnectionState(options.name));
          case "ROLLBACK":
            return parseJsonThen(message.state, (state) => {
              if (store === void 0) {
                setStateFromDevtools(state);
                connection == null ? void 0 : connection.init(api.getState());
                return;
              }
              setStateFromDevtools(state[store]);
              connection == null ? void 0 : connection.init(getTrackedConnectionState(options.name));
            });
          case "JUMP_TO_STATE":
          case "JUMP_TO_ACTION":
            return parseJsonThen(message.state, (state) => {
              if (store === void 0) {
                setStateFromDevtools(state);
                return;
              }
              if (JSON.stringify(api.getState()) !== JSON.stringify(state[store])) {
                setStateFromDevtools(state[store]);
              }
            });
          case "IMPORT_STATE": {
            const { nextLiftedState } = message.payload;
            const lastComputedState = (_a = nextLiftedState.computedStates.slice(-1)[0]) == null ? void 0 : _a.state;
            if (!lastComputedState)
              return;
            if (store === void 0) {
              setStateFromDevtools(lastComputedState);
            } else {
              setStateFromDevtools(lastComputedState[store]);
            }
            connection == null ? void 0 : connection.send(
              null,
              // FIXME no-any
              nextLiftedState
            );
            return;
          }
          case "PAUSE_RECORDING":
            return isRecording = !isRecording;
        }
        return;
    }
  });
  return initialState;
};
const devtools = devtoolsImpl;
const parseJsonThen = (stringified, fn) => {
  let parsed;
  try {
    parsed = JSON.parse(stringified);
  } catch (e) {
    console.error(
      "[zustand devtools middleware] Could not parse the received json",
      e
    );
  }
  if (parsed !== void 0)
    fn(parsed);
};
const subscribeWithSelectorImpl = (fn) => (set, get, api) => {
  const origSubscribe = api.subscribe;
  api.subscribe = (selector, optListener, options) => {
    let listener = selector;
    if (optListener) {
      const equalityFn = (options == null ? void 0 : options.equalityFn) || Object.is;
      let currentSlice = selector(api.getState());
      listener = (state) => {
        const nextSlice = selector(state);
        if (!equalityFn(currentSlice, nextSlice)) {
          const previousSlice = currentSlice;
          optListener(currentSlice = nextSlice, previousSlice);
        }
      };
      if (options == null ? void 0 : options.fireImmediately) {
        optListener(currentSlice, currentSlice);
      }
    }
    return origSubscribe(listener);
  };
  const initialState = fn(set, get, api);
  return initialState;
};
const subscribeWithSelector = subscribeWithSelectorImpl;
function combine(initialState, create) {
  return (...args) => Object.assign({}, initialState, create(...args));
}
function createJSONStorage(getStorage, options) {
  let storage;
  try {
    storage = getStorage();
  } catch (e) {
    return;
  }
  const persistStorage = {
    getItem: (name) => {
      var _a;
      const parse = (str2) => {
        if (str2 === null) {
          return null;
        }
        return JSON.parse(str2, options == null ? void 0 : options.reviver);
      };
      const str = (_a = storage.getItem(name)) != null ? _a : null;
      if (str instanceof Promise) {
        return str.then(parse);
      }
      return parse(str);
    },
    setItem: (name, newValue) => storage.setItem(name, JSON.stringify(newValue, options == null ? void 0 : options.replacer)),
    removeItem: (name) => storage.removeItem(name)
  };
  return persistStorage;
}
const toThenable = (fn) => (input) => {
  try {
    const result = fn(input);
    if (result instanceof Promise) {
      return result;
    }
    return {
      then(onFulfilled) {
        return toThenable(onFulfilled)(result);
      },
      catch(_onRejected) {
        return this;
      }
    };
  } catch (e) {
    return {
      then(_onFulfilled) {
        return this;
      },
      catch(onRejected) {
        return toThenable(onRejected)(e);
      }
    };
  }
};
const persistImpl = (config, baseOptions) => (set, get, api) => {
  let options = {
    storage: createJSONStorage(() => window.localStorage),
    partialize: (state) => state,
    version: 0,
    merge: (persistedState, currentState) => ({
      ...currentState,
      ...persistedState
    }),
    ...baseOptions
  };
  let hasHydrated = false;
  let hydrationVersion = 0;
  const hydrationListeners = /* @__PURE__ */ new Set();
  const finishHydrationListeners = /* @__PURE__ */ new Set();
  let storage = options.storage;
  if (!storage) {
    return config(
      (...args) => {
        console.warn(
          `[zustand persist middleware] Unable to update item '${options.name}', the given storage is currently unavailable.`
        );
        set(...args);
      },
      get,
      api
    );
  }
  const setItem = () => {
    const state = options.partialize({ ...get() });
    return storage.setItem(options.name, {
      state,
      version: options.version
    });
  };
  const savedSetState = api.setState;
  api.setState = (state, replace) => {
    savedSetState(state, replace);
    return setItem();
  };
  const configResult = config(
    (...args) => {
      set(...args);
      return setItem();
    },
    get,
    api
  );
  api.getInitialState = () => configResult;
  let stateFromStorage;
  const hydrate = () => {
    var _a, _b;
    if (!storage)
      return;
    const currentVersion = ++hydrationVersion;
    hasHydrated = false;
    hydrationListeners.forEach((cb) => {
      var _a2;
      return cb((_a2 = get()) != null ? _a2 : configResult);
    });
    const postRehydrationCallback = ((_b = options.onRehydrateStorage) == null ? void 0 : _b.call(options, (_a = get()) != null ? _a : configResult)) || void 0;
    return toThenable(storage.getItem.bind(storage))(options.name).then((deserializedStorageValue) => {
      if (deserializedStorageValue) {
        if (typeof deserializedStorageValue.version === "number" && deserializedStorageValue.version !== options.version) {
          if (options.migrate) {
            const migration = options.migrate(
              deserializedStorageValue.state,
              deserializedStorageValue.version
            );
            if (migration instanceof Promise) {
              return migration.then((result) => [true, result]);
            }
            return [true, migration];
          }
          console.error(
            `State loaded from storage couldn't be migrated since no migrate function was provided`
          );
        } else {
          return [false, deserializedStorageValue.state];
        }
      }
      return [false, void 0];
    }).then((migrationResult) => {
      var _a2;
      if (currentVersion !== hydrationVersion) {
        return;
      }
      const [migrated, migratedState] = migrationResult;
      stateFromStorage = options.merge(
        migratedState,
        (_a2 = get()) != null ? _a2 : configResult
      );
      set(stateFromStorage, true);
      if (migrated) {
        return setItem();
      }
    }).then(() => {
      if (currentVersion !== hydrationVersion) {
        return;
      }
      postRehydrationCallback == null ? void 0 : postRehydrationCallback(get(), void 0);
      stateFromStorage = get();
      hasHydrated = true;
      finishHydrationListeners.forEach((cb) => cb(stateFromStorage));
    }).catch((e) => {
      if (currentVersion !== hydrationVersion) {
        return;
      }
      postRehydrationCallback == null ? void 0 : postRehydrationCallback(void 0, e);
    });
  };
  api.persist = {
    setOptions: (newOptions) => {
      options = {
        ...options,
        ...newOptions
      };
      if (newOptions.storage) {
        storage = newOptions.storage;
      }
    },
    clearStorage: () => {
      storage == null ? void 0 : storage.removeItem(options.name);
    },
    getOptions: () => options,
    rehydrate: () => hydrate(),
    hasHydrated: () => hasHydrated,
    onHydrate: (cb) => {
      hydrationListeners.add(cb);
      return () => {
        hydrationListeners.delete(cb);
      };
    },
    onFinishHydration: (cb) => {
      finishHydrationListeners.add(cb);
      return () => {
        finishHydrationListeners.delete(cb);
      };
    }
  };
  if (!options.skipHydration) {
    hydrate();
  }
  return stateFromStorage || configResult;
};
const persist = persistImpl;
function ssrSafe(config, isSSR = typeof window === "undefined") {
  return (set, get, api) => {
    if (!isSSR) {
      return config(set, get, api);
    }
    const ssrSet = () => {
      throw new Error("Cannot set state of Zustand store in SSR");
    };
    api.setState = ssrSet;
    return config(ssrSet, get, api);
  };
}

// ✅ NOTIF STORE: 미확인 개인 알람 저장 (최대 50개, localStorage 유지)
const useNotifStore = create(
  persist(
    (set, get) => ({
      notifs: [],    // { id, type, title, body, time, read, link, icon }

      // 알림 추가 (중복 방지: 동일 id 제외)
      addNotif: (n) => set(s => {
        const id = n.id || Date.now() + Math.random();
        if (s.notifs.some(x => x.id === id)) return s;
        const notif = {
          id,
          type:  n.type  || 'info',
          title: n.title || '알림',
          body:  n.body  || n.message || '',
          time:  n.time  || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          read:  false,
          link:  n.link  || null,
          icon:  n.icon  || '🔔',
        };
        return { notifs: [notif, ...s.notifs].slice(0, 50) };
      }),

      // 단건 읽음
      markRead: (id) => set(s => ({
        notifs: s.notifs.map(n => n.id === id ? { ...n, read: true } : n),
      })),

      // 전체 읽음 처리
      markAllRead: () => set(s => ({
        notifs: s.notifs.map(n => ({ ...n, read: true })),
      })),

      // 전체 삭제
      clearAll: () => set({ notifs: [] }),

      // 미읽음 수 (computed)
      getUnreadCount: () => get().notifs.filter(n => !n.read).length,
    }),
    {
      name: 'fg-notifications-v1',
      partialize: (s) => ({ notifs: s.notifs.slice(0, 30) }),
    }
  )
);

const SOCKET_URL = "https://fishing-go-backend.onrender.com";
const LEVEL_UI = {
  danger: { label: "⚡ 긴급 기상특보", iconBg: "#FF3B30", iconColor: "#fff", border: "rgba(255,59,48,0.4)", bg: "rgba(255,59,48,0.06)", labelColor: "#FF3B30", Icon: CloudLightning },
  warning: { label: "⚠️ 기상 위험 알림", iconBg: "#FF9B26", iconColor: "#fff", border: "rgba(255,155,38,0.35)", bg: "rgba(255,155,38,0.06)", labelColor: "#FF9B26", Icon: AlertTriangle },
  info: { label: "🎣 실시간 조황 알림", iconBg: "#0056D2", iconColor: "#fff", border: "rgba(0,86,210,0.3)", bg: "rgba(235,245,255,0.8)", labelColor: "#0056D2", Icon: Fish },
  season: { label: "🌊 어종 시즌 알림", iconBg: "#00C48C", iconColor: "#fff", border: "rgba(0,196,140,0.3)", bg: "rgba(235,255,245,0.8)", labelColor: "#00C48C", Icon: Fish },
  tip: { label: "📍 낚시 정보", iconBg: "#8E8E93", iconColor: "#fff", border: "rgba(142,142,147,0.25)", bg: "rgba(248,249,250,0.95)", labelColor: "#8E8E93", Icon: BellRing },
  reply: { label: "↩ 크루 채팅 답장", iconBg: "#0056D2", iconColor: "#fff", border: "rgba(0,86,210,0.35)", bg: "rgba(235,245,255,0.9)", labelColor: "#0056D2", Icon: CornerUpLeft },
  push: { label: "📣 운영자 메시지", iconBg: "#FF2D8B", iconColor: "#fff", border: "rgba(255,45,139,0.3)", bg: "rgba(255,240,248,0.9)", labelColor: "#FF2D8B", Icon: Megaphone }
};
function RealTimeAlert() {
  const [alert, setAlert] = reactExports.useState(null);
  const [isVisible, setIsVisible] = reactExports.useState(false);
  const navigate = useNavigate();
  const timerRef = reactExports.useRef(null);
  const userEmail = useUserStore((s) => s.user?.email);
  const addNotif = useNotifStore((s) => s.addNotif);
  const clearTimer = reactExports.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  const showAlert = reactExports.useCallback((data) => {
    setAlert(data);
    setIsVisible(true);
    clearTimer();
    timerRef.current = setTimeout(() => setIsVisible(false), 1e4);
  }, [clearTimer]);
  reactExports.useEffect(() => {
    let alive = true;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {
      });
    }
    let token = null;
    try {
      token = localStorage.getItem("access_token");
    } catch {
    }
    const socket = lookup(SOCKET_URL, {
      auth: token ? { token } : {},
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 5e3,
      reconnectionDelayMax: 15e3,
      timeout: 1e4
    });
    socket.on("fishing_alert", (data) => {
      if (!alive)
        return;
      const level2 = data.level || "warning";
      const time = data.time || (/* @__PURE__ */ new Date()).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
      showAlert({ ...data, level: level2, time });
      addNotif({
        type: level2 === "danger" ? "alert" : "info",
        icon: level2 === "danger" ? "⚡" : "🎣",
        title: LEVEL_UI[level2]?.label || "낚시 알림",
        body: data.message || "",
        time,
        link: data.link || null
      });
    });
    socket.on("push_notification", (data) => {
      const user = useUserStore.getState().user;
      if (!alive || !user || data.targetEmail !== user.email)
        return;
      const time = data.time || (/* @__PURE__ */ new Date()).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(data.title || "📣 운영자 메시지", { body: data.message, icon: "/favicon.ico" });
      }
      showAlert({ message: data.message, level: "push", time, link: data.link || null });
      addNotif({
        type: "push",
        icon: "📣",
        title: data.title || "운영자 메시지",
        body: data.message || "",
        time,
        link: data.link || null
      });
    });
    socket.on("crew_reply_notification", (data) => {
      const user = useUserStore.getState().user;
      if (!alive || !user)
        return;
      const myName = user.name || user.email;
      if (data.repliedToSender !== myName)
        return;
      if (data.fromSender === myName)
        return;
      if (user?.notiSettings?.chat === false)
        return;
      const time = data.time || (/* @__PURE__ */ new Date()).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
      const isInChat = data.crewId && window.location.pathname === `/crew/${data.crewId}/chat`;
      if (!isInChat) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`↩ ${data.fromSender}님이 답장했습니다`, {
            body: data.replyText || "",
            icon: "/favicon.ico"
          });
        }
        showAlert({
          message: `${data.fromSender}: "${(data.replyText || "").slice(0, 40)}"`,
          level: "reply",
          time,
          link: data.crewId ? `/crew/${data.crewId}/chat` : null
        });
      }
      addNotif({
        type: "reply",
        icon: "↩",
        title: `${data.fromSender}님이 답장했습니다`,
        body: data.replyText || "",
        time,
        link: data.crewId ? `/crew/${data.crewId}/chat` : null
      });
    });
    return () => {
      alive = false;
      clearTimer();
      socket.disconnect();
    };
  }, [userEmail, showAlert, clearTimer, addNotif]);
  if (!isVisible || !alert)
    return null;
  const level = alert.level || "info";
  const ui = LEVEL_UI[level] || LEVEL_UI.info;
  const IconComp = ui.Icon;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "premium-alert-toast",
      onClick: () => {
        if (alert.link)
          navigate(alert.link);
        setIsVisible(false);
      },
      style: {
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "92%",
        maxWidth: "420px",
        backgroundColor: ui.bg,
        backdropFilter: "blur(16px)",
        borderRadius: "20px",
        padding: "14px 16px",
        boxShadow: `0 12px 40px rgba(0,0,0,0.12), 0 0 0 1px ${ui.border}`,
        border: `1px solid ${ui.border}`,
        zIndex: 5e3,
        display: "flex",
        gap: "12px",
        alignItems: "center",
        animation: "slideDown 0.4s cubic-bezier(0.175,0.885,0.32,1.275)",
        cursor: alert.link ? "pointer" : "default"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { backgroundColor: ui.iconBg, padding: "9px", borderRadius: "12px", flexShrink: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(IconComp, { size: 20, color: ui.iconColor }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", color: ui.labelColor }, children: ui.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#bbb", flexShrink: 0, marginLeft: "8px" }, children: alert.time })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", color: "#1c1c1e", lineHeight: "1.45", wordBreak: "keep-all" }, children: alert.message }),
          alert.link && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: ui.labelColor, fontWeight: "800", marginTop: "4px" }, children: "탭하여 이동 →" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: (e) => {
              e.stopPropagation();
              setIsVisible(false);
            },
            style: { border: "none", background: "none", padding: "4px", cursor: "pointer", flexShrink: 0 },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 17, color: "#bbb" })
          }
        )
      ]
    }
  );
}

const RETRY_KEY = "eb_auto_retries";
const MAX_AUTO_RETRIES = 2;
class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, autoRetrying: false };
    this._reloadTimer = null;
    this._clearTimer = null;
  }
  static getDerivedStateFromError(error) {
    let retries = 0;
    try {
      retries = parseInt(sessionStorage.getItem(RETRY_KEY) || "0", 10);
    } catch {
    }
    const canAutoRetry = retries < MAX_AUTO_RETRIES;
    return { hasError: true, error, autoRetrying: canAutoRetry };
  }
  componentDidCatch(error, info) {
    this.setState({ errorInfo: info });
    if (false)
      console.error("[ErrorBoundary] 오류 감지:", error, info);
    let retries = 0;
    try {
      retries = parseInt(sessionStorage.getItem(RETRY_KEY) || "0", 10);
    } catch {
    }
    if (retries < MAX_AUTO_RETRIES) {
      try {
        sessionStorage.setItem(RETRY_KEY, String(retries + 1));
      } catch {
      }
      this._reloadTimer = setTimeout(() => window.location.reload(), 800);
    }
  }
  componentDidMount() {
    if (!this.state.hasError) {
      this._clearTimer = setTimeout(() => {
        try {
          sessionStorage.removeItem(RETRY_KEY);
        } catch {
        }
      }, 3e3);
    }
  }
  componentWillUnmount() {
    if (this._reloadTimer)
      clearTimeout(this._reloadTimer);
    if (this._clearTimer)
      clearTimeout(this._clearTimer);
  }
  // 홈으로 이동 + 상태 초기화
  handleGoHome = () => {
    try {
      sessionStorage.removeItem(RETRY_KEY);
    } catch {
    }
    this.setState({ hasError: false, error: null, errorInfo: null, autoRetrying: false });
    if (this.props.navigate)
      this.props.navigate("/");
  };
  // 뒤로가기 + 상태 초기화
  handleGoBack = () => {
    try {
      sessionStorage.removeItem(RETRY_KEY);
    } catch {
    }
    this.setState({ hasError: false, error: null, errorInfo: null, autoRetrying: false });
    if (this.props.navigate) {
      if (window.history.length <= 1) {
        this.props.navigate("/", { replace: true });
      } else {
        this.props.navigate(-1);
      }
    }
  };
  // 수동 새로고침 (재시도 카운트 초기화 후 reload)
  handleManualReload = () => {
    try {
      sessionStorage.removeItem(RETRY_KEY);
    } catch {
    }
    window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      if (this.state.autoRetrying) {
        let retries = 0;
        try {
          retries = parseInt(sessionStorage.getItem(RETRY_KEY) || "0", 10);
        } catch {
        }
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
          backgroundColor: "#F8F9FA"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            border: "4px solid #E5E5EA",
            borderTopColor: "#0056D2",
            animation: "spin 0.8s linear infinite",
            marginBottom: "20px"
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "800", color: "#1c1c1e", marginBottom: "6px" }, children: "🎣 재연결 중..." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "600" }, children: [
            "자동 복구 시도 중 (",
            retries,
            "/",
            MAX_AUTO_RETRIES,
            ")"
          ] })
        ] });
      }
      const isMaster = this.props.isMaster;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        backgroundColor: "#F8F9FA",
        padding: "32px",
        textAlign: "center",
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          backgroundColor: "#FFF0F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: `calc(32px * var(--fs, 1))`,
          marginBottom: "20px"
        }, children: "🎣" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontSize: `calc(20px * var(--fs, 1))`, fontWeight: "800", color: "#1c1c1e", marginBottom: "8px" }, children: "잠시 문제가 발생했습니다" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { fontSize: `calc(14px * var(--fs, 1))`, color: "#8E8E93", lineHeight: "1.6", marginBottom: "28px", maxWidth: "280px" }, children: [
          "자동 복구를 ",
          MAX_AUTO_RETRIES,
          "회 시도했지만 실패했습니다.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "아래 버튼을 눌러 다시 시도해주세요."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: this.handleGoBack,
            style: {
              padding: "14px 32px",
              backgroundColor: "#F2F2F7",
              color: "#1c1c1e",
              border: "none",
              borderRadius: "12px",
              fontSize: `calc(15px * var(--fs, 1))`,
              fontWeight: "700",
              cursor: "pointer",
              marginBottom: "10px",
              width: "100%",
              maxWidth: "240px"
            },
            children: "← 뒤로가기"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: this.handleGoHome,
            style: {
              padding: "14px 32px",
              backgroundColor: "#0056D2",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontSize: `calc(15px * var(--fs, 1))`,
              fontWeight: "700",
              cursor: "pointer",
              marginBottom: "10px",
              width: "100%",
              maxWidth: "240px"
            },
            children: "🏠 홈으로 돌아가기"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: this.handleManualReload,
            style: {
              padding: "14px 32px",
              backgroundColor: "transparent",
              color: "#0056D2",
              border: "1.5px solid #0056D2",
              borderRadius: "12px",
              fontSize: `calc(15px * var(--fs, 1))`,
              fontWeight: "600",
              cursor: "pointer",
              width: "100%",
              maxWidth: "240px"
            },
            children: "🔄 새로고침"
          }
        ),
        isMaster && this.state.error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
          marginTop: "28px",
          width: "100%",
          maxWidth: "360px",
          background: "rgba(220,38,38,0.06)",
          border: "1px solid rgba(220,38,38,0.2)",
          borderRadius: "16px",
          padding: "16px",
          textAlign: "left"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "900", color: "#DC2626", marginBottom: "8px" }, children: "🔐 MASTER 전용 — 오류 상세" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { open: true, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("summary", { style: { cursor: "pointer", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "700", color: "#DC2626", marginBottom: "8px" }, children: [
              this.state.error.name,
              ": ",
              this.state.error.message
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("pre", { style: {
              fontSize: `calc(10px * var(--fs, 1))`,
              color: "#7F1D1D",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              background: "rgba(0,0,0,0.04)",
              borderRadius: "8px",
              padding: "10px",
              margin: "8px 0 0",
              maxHeight: "200px",
              overflowY: "auto",
              fontFamily: "monospace",
              lineHeight: "1.5"
            }, children: [
              this.state.error.stack,
              this.state.errorInfo?.componentStack && "\n\n─── Component Stack ───\n" + this.state.errorInfo.componentStack
            ] })
          ] })
        ] })
      ] });
    }
    return this.props.children;
  }
}
function ErrorBoundary(props) {
  const navigate = useNavigate();
  const isMaster = useUserStore(
    (s) => s.user?.id === ADMIN_ID || s.user?.email === ADMIN_EMAIL || s.user?.email === "sunjulab.k@gmail.com" || s.userTier === "MASTER"
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorBoundaryClass, { navigate, isMaster, ...props });
}

const PAID_TIERS = ["BUSINESS_LITE", "PRO", "BUSINESS_VIP", "MASTER"];
function SubscriptionFailBanner() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const userTier = useUserStore((s) => s.userTier);
  const [failInfo, setFailInfo] = reactExports.useState(null);
  const [dismissed, setDismissed] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!user || dismissed)
      return;
    if (!PAID_TIERS.includes(userTier))
      return;
    const userId = user.email || user.id;
    if (!userId)
      return;
    apiClient.get(`/api/payment/subscription/${encodeURIComponent(userId)}`).then((res) => {
      if (res.data.hasSubscription && res.data.status === "failed") {
        setFailInfo(res.data);
      }
    }).catch((e) => {
      if (false)
        console.warn("[SubscriptionFailBanner] 결제 상태 조회 실패:", e);
    });
  }, [user, userTier, dismissed]);
  if (!failInfo || dismissed)
    return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
    position: "fixed",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: "480px",
    zIndex: 9999,
    background: "linear-gradient(135deg, #FF3B30, #C0392B)",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    boxShadow: "0 4px 20px rgba(255,59,48,0.4)"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { size: 18, color: "#fff", style: { flexShrink: 0 } }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { margin: 0, fontSize: `calc(12px * var(--fs, 1))`, color: "#fff", fontWeight: "900", lineHeight: 1.4 }, children: [
        "정기결제 실패 — ",
        failInfo.planId,
        " 플랜 자동 결제에 실패했습니다."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: "2px 0 0", fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.8)", fontWeight: "700" }, children: "카드 정보를 확인하고 구독을 재등록해주세요." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => {
          setDismissed(true);
          navigate("/vvip-subscribe");
        },
        style: { background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", color: "#fff", padding: "6px 10px", fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "900", cursor: "pointer", flexShrink: 0 },
        children: "재등록"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setDismissed(true), style: { background: "none", border: "none", cursor: "pointer", padding: "4px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16, color: "#fff" }) })
  ] });
}

function getTodayKST() {
  const kstMs = Date.now() + 9 * 60 * 60 * 1e3;
  return new Date(kstMs).toISOString().slice(0, 10);
}
function getTodayKey(noticeId) {
  return "popup_hidden_" + noticeId + "_" + getTodayKST();
}
function isHiddenToday(noticeId) {
  try {
    return !!localStorage.getItem(getTodayKey(noticeId));
  } catch {
    return false;
  }
}
function getHideAllKey() {
  return "popup_hidden_all_" + getTodayKST();
}
function AnnouncementPopup() {
  const navigate = useNavigate();
  const [notices, setNotices] = reactExports.useState([]);
  const [idx, setIdx] = reactExports.useState(0);
  const [hideToday, setHideToday] = reactExports.useState(false);
  const [visible, setVisible] = reactExports.useState(false);
  reactExports.useEffect(() => {
    try {
      if (localStorage.getItem(getHideAllKey()))
        return;
    } catch {
    }
    apiClient.get("/api/community/notices").then((res) => {
      const all = Array.isArray(res.data) ? res.data : [];
      const popups = all.filter((n) => (n.isPopup || n.image) && !isHiddenToday(String(n._id || n.id))).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (popups.length > 0) {
        setNotices(popups);
        setVisible(true);
      }
    }).catch(() => {
    });
  }, []);
  const handleClose = reactExports.useCallback(() => {
    if (hideToday) {
      try {
        const cur = notices[idx];
        if (cur)
          localStorage.setItem(getTodayKey(String(cur._id || cur.id)), "1");
      } catch {
      }
    }
    const remaining = notices.filter((_, i) => i !== idx);
    if (remaining.length > 0) {
      setNotices(remaining);
      setIdx(0);
      setHideToday(false);
    } else {
      setVisible(false);
    }
  }, [hideToday, notices, idx]);
  const handleHideAll = reactExports.useCallback(() => {
    try {
      localStorage.setItem(getHideAllKey(), "1");
      notices.forEach((n) => localStorage.setItem(getTodayKey(String(n._id || n.id)), "1"));
    } catch {
    }
    setVisible(false);
  }, [notices]);
  const handleNoticeClick = reactExports.useCallback(() => {
    const n = notices[idx];
    if (!n)
      return;
    setVisible(false);
    navigate("/notice/" + String(n._id || n.id), { state: { notice: n } });
  }, [notices, idx, navigate]);
  const goPrev = reactExports.useCallback((e) => {
    e.stopPropagation();
    setIdx((i) => Math.max(0, i - 1));
    setHideToday(false);
  }, []);
  const goNext = reactExports.useCallback((e) => {
    e.stopPropagation();
    setIdx((i) => Math.min(notices.length - 1, i + 1));
    setHideToday(false);
  }, [notices.length]);
  if (!visible || notices.length === 0)
    return null;
  const notice = notices[idx];
  const total = notices.length;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      onClick: handleClose,
      style: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.25s ease-out"
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          onClick: (e) => e.stopPropagation(),
          style: {
            width: "100%",
            maxWidth: "400px",
            background: "#fff",
            borderRadius: "24px",
            overflow: "hidden",
            boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
            animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            position: "relative"
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px", borderBottom: "1px solid #F0F0F0" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: "#FF3B30", color: "#fff", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", padding: "3px 8px", borderRadius: "6px" }, children: "📢 공지" }),
                notice.isPinned && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: "#FFF1F0", color: "#FF3B30", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", padding: "3px 8px", borderRadius: "6px", border: "1px solid #FFCCC7" }, children: "📌 필독" })
              ] }),
              total > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#AAB0BE", fontWeight: "700" }, children: [
                idx + 1,
                " / ",
                total
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleClose, style: { background: "#F2F2F7", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16, color: "#555" }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: handleNoticeClick, style: { position: "relative", cursor: "pointer", userSelect: "none" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: Array.isArray(notice.images) && notice.images.length > 0 ? notice.images[0] : notice.image,
                  alt: notice.title,
                  loading: "lazy",
                  style: { width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" },
                  onError: (e) => {
                    e.target.style.display = "none";
                  }
                }
              ),
              total > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                idx > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: goPrev, style: { position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: "34px", height: "34px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 18, color: "#fff" }) }),
                idx < total - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: goNext, style: { position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: "34px", height: "34px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 18, color: "#fff" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "5px" }, children: notices.map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: i === idx ? "18px" : "6px", height: "6px", borderRadius: "3px", background: i === idx ? "#fff" : "rgba(255,255,255,0.5)", transition: "all 0.25s ease" } }, i)) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.55))", padding: "24px 16px 12px", pointerEvents: "none" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#fff", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", opacity: 0.9 }, children: "탭하여 자세히 보기 →" }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: handleNoticeClick, style: { padding: "16px 20px 12px", cursor: "pointer" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontSize: `calc(17px * var(--fs, 1))`, fontWeight: "950", color: "#1c1c1e", margin: "0 0 8px", lineHeight: "1.4", wordBreak: "keep-all" }, children: notice.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#666", lineHeight: "1.6", margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }, children: notice.content })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "12px 20px 20px", borderTop: "1px solid #F8F8F8", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none", flex: 1 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    onClick: () => setHideToday((v) => !v),
                    style: { width: "20px", height: "20px", borderRadius: "5px", border: "2px solid " + (hideToday ? "#0056D2" : "#C7C7CC"), background: hideToday ? "#0056D2" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 },
                    children: hideToday && /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "11", height: "8", viewBox: "0 0 11 8", fill: "none", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M1 4L4 7L10 1", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#555", fontWeight: "700" }, children: "오늘 하루 안 보기" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px", flexShrink: 0 }, children: [
                total > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleHideAll, style: { padding: "9px 12px", border: "1.5px solid #E5E5EA", borderRadius: "12px", background: "#fff", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", color: "#888", cursor: "pointer", whiteSpace: "nowrap" }, children: "모두 닫기" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleClose, style: { padding: "9px 16px", border: "none", borderRadius: "12px", background: "#F2F2F7", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", color: "#555", cursor: "pointer" }, children: "닫기" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleNoticeClick, style: { padding: "9px 16px", border: "none", borderRadius: "12px", background: "linear-gradient(135deg, #0056D2, #003FA3)", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: "#fff", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(0,86,210,0.3)" }, children: "자세히 보기" })
              ] })
            ] })
          ]
        }
      )
    }
  );
}

var AppUpdateAvailability;
(function (AppUpdateAvailability) {
    AppUpdateAvailability[AppUpdateAvailability["UNKNOWN"] = 0] = "UNKNOWN";
    AppUpdateAvailability[AppUpdateAvailability["UPDATE_NOT_AVAILABLE"] = 1] = "UPDATE_NOT_AVAILABLE";
    AppUpdateAvailability[AppUpdateAvailability["UPDATE_AVAILABLE"] = 2] = "UPDATE_AVAILABLE";
    AppUpdateAvailability[AppUpdateAvailability["UPDATE_IN_PROGRESS"] = 3] = "UPDATE_IN_PROGRESS";
})(AppUpdateAvailability || (AppUpdateAvailability = {}));
var FlexibleUpdateInstallStatus;
(function (FlexibleUpdateInstallStatus) {
    FlexibleUpdateInstallStatus[FlexibleUpdateInstallStatus["UNKNOWN"] = 0] = "UNKNOWN";
    FlexibleUpdateInstallStatus[FlexibleUpdateInstallStatus["PENDING"] = 1] = "PENDING";
    FlexibleUpdateInstallStatus[FlexibleUpdateInstallStatus["DOWNLOADING"] = 2] = "DOWNLOADING";
    FlexibleUpdateInstallStatus[FlexibleUpdateInstallStatus["INSTALLING"] = 3] = "INSTALLING";
    FlexibleUpdateInstallStatus[FlexibleUpdateInstallStatus["INSTALLED"] = 4] = "INSTALLED";
    FlexibleUpdateInstallStatus[FlexibleUpdateInstallStatus["FAILED"] = 5] = "FAILED";
    FlexibleUpdateInstallStatus[FlexibleUpdateInstallStatus["CANCELED"] = 6] = "CANCELED";
    FlexibleUpdateInstallStatus[FlexibleUpdateInstallStatus["DOWNLOADED"] = 11] = "DOWNLOADED";
})(FlexibleUpdateInstallStatus || (FlexibleUpdateInstallStatus = {}));
var AppUpdateResultCode;
(function (AppUpdateResultCode) {
    /**
     * The user has accepted the update.
     */
    AppUpdateResultCode[AppUpdateResultCode["OK"] = 0] = "OK";
    /**
     * The user has denied or cancelled the update.
     */
    AppUpdateResultCode[AppUpdateResultCode["CANCELED"] = 1] = "CANCELED";
    /**
     * Some other error prevented either the user from providing consent or the update to proceed.
     */
    AppUpdateResultCode[AppUpdateResultCode["FAILED"] = 2] = "FAILED";
    /**
     * No update available.
     */
    AppUpdateResultCode[AppUpdateResultCode["NOT_AVAILABLE"] = 3] = "NOT_AVAILABLE";
    /**
     * Update type not allowed.
     */
    AppUpdateResultCode[AppUpdateResultCode["NOT_ALLOWED"] = 4] = "NOT_ALLOWED";
    /**
     * App update info missing.
     * You must call `getAppUpdateInfo()` before requesting an update.
     */
    AppUpdateResultCode[AppUpdateResultCode["INFO_MISSING"] = 5] = "INFO_MISSING";
})(AppUpdateResultCode || (AppUpdateResultCode = {}));

const AppUpdate = registerPlugin('AppUpdate', {
    web: () => __vitePreload(() => import('./web-CPvKo6Ec.js'),true?__vite__mapDeps([10,1,2,3,4,5]):void 0).then(m => new m.AppUpdateWeb()),
});

const CURRENT_APP_VERSION = true ? "2.1.48" : "2.1.17";
function isVersionLower(v1, v2) {
  const p1 = v1.split(".").map(Number);
  const p2 = v2.split(".").map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 < n2)
      return true;
    if (n1 > n2)
      return false;
  }
  return false;
}
const DISMISS_KEY = "fishing_update_dismissed_at";
const DISMISS_HOURS = 24;
function isDismissed() {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts)
      return false;
    return Date.now() - Number(ts) < DISMISS_HOURS * 60 * 60 * 1e3;
  } catch {
    return false;
  }
}
function setDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
  }
}
function ForceUpdateChecker() {
  const [needsUpdate, setNeedsUpdate] = reactExports.useState(false);
  const [hidden, setHidden] = reactExports.useState(false);
  const [storeUrl, setStoreUrl] = reactExports.useState("https://play.google.com/apps/internaltest/4701312289208373704");
  reactExports.useEffect(() => {
    const checkUpdate = async () => {
      try {
        const res = await fetch(`${"https://fishing-go-backend.onrender.com"}/api/app-config`);
        if (!res.ok)
          return;
        const data = await res.json();
        if (data.min_version && isVersionLower(CURRENT_APP_VERSION, data.min_version)) {
          if (data.store_url)
            setStoreUrl(data.store_url);
          if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
            try {
              const info = await AppUpdate.getAppUpdateInfo();
              if (info.updateAvailability !== 1) {
                await AppUpdate.performImmediateUpdate();
                return;
              }
            } catch (err) {
              console.warn("Native AppUpdate failed, falling back to custom modal:", err);
            }
          }
          setNeedsUpdate(true);
        }
      } catch (err) {
        console.error("Failed to check app config:", err);
      }
    };
    checkUpdate();
  }, []);
  if (!needsUpdate || hidden || isDismissed())
    return null;
  const handleUpdateClick = () => {
    window.location.href = storeUrl;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$1.overlay, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$1.modal, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$1.iconContainer, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "48", height: "48", viewBox: "0 0 24 24", fill: "none", stroke: "#0056D2", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "7 10 12 15 17 10" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "15", x2: "12", y2: "3" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: styles$1.title, children: "새로운 버전 출시!" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: styles$1.desc, children: [
      "안정적인 서비스 이용을 위해",
      /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
      "최신 버전으로 업데이트가 필요합니다."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: styles$1.button, onClick: handleUpdateClick, children: "업데이트 하러 가기" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: styles$1.dismissButton, onClick: () => {
      setDismissed();
      setHidden(true);
    }, children: "다음에 업데이트할게요" })
  ] }) });
}
const styles$1 = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    backdropFilter: "blur(4px)",
    zIndex: 99999,
    // 앱의 모든 UI(헤더, 바텀네비 등) 덮기
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px"
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "32px 24px",
    width: "100%",
    maxWidth: "340px",
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
  },
  iconContainer: {
    width: "80px",
    height: "80px",
    backgroundColor: "#F0F5FF",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px"
  },
  title: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#111",
    margin: "0 0 12px 0"
  },
  desc: {
    fontSize: "15px",
    color: "#666",
    lineHeight: "1.5",
    margin: "0 0 28px 0"
  },
  button: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#0056D2",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer"
  },
  dismissButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "transparent",
    color: "#999",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "400",
    cursor: "pointer",
    marginTop: "4px"
  }
};

const PLAY_STORE_URL$1 = "https://play.google.com/apps/internaltest/4701312289208373704";
const APP_ID = "kr.fishinggo.app";
function buildIntentUrl(pathname, search) {
  const postMatch = pathname.match(/\/post\/([^/?#]+)/);
  const catchMatch = pathname.match(/\/catch\/([^/?#]+)/);
  let deepTarget;
  if (postMatch)
    deepTarget = `post?postId=${postMatch[1]}`;
  else if (catchMatch)
    deepTarget = `catch?catchId=${catchMatch[1]}`;
  else
    deepTarget = "community";
  return `intent://${deepTarget}#Intent;scheme=fishinggo;package=${APP_ID};S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL$1)};end`;
}
function AppBanner() {
  const [visible, setVisible] = reactExports.useState(false);
  const location = useLocation();
  reactExports.useEffect(() => {
    try {
      if (window.Capacitor?.isNativePlatform?.())
        return;
    } catch {
    }
    if (!/android/i.test(navigator.userAgent))
      return;
    try {
      if (sessionStorage.getItem("fishing_banner_dismissed"))
        return;
    } catch {
    }
    setVisible(true);
  }, []);
  if (!visible)
    return null;
  const handleOpen = () => {
    window.location.href = buildIntentUrl(location.pathname, location.search);
  };
  const handleDismiss = () => {
    try {
      sessionStorage.setItem("fishing_banner_dismissed", "1");
    } catch {
    }
    setVisible(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles.banner, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: styles.closeBtn, onClick: handleDismiss, "aria-label": "배너 닫기", children: "✕" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: "/og-image.png",
          alt: "낚시GO",
          style: styles.icon,
          onError: (e) => {
            e.target.style.display = "none";
          }
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles.info, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles.appName, children: "낚시GO" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles.appDesc, children: "앱에서 더 편리하게 이용하세요 🎣" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: styles.openBtn, onClick: handleOpen, children: "앱에서 보기" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: "62px", flexShrink: 0 } })
  ] });
}
const styles = {
  banner: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99998,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    background: "linear-gradient(135deg, #0a1628 0%, #0d2144 100%)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
    borderBottom: "1px solid rgba(255,255,255,0.08)"
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.5)",
    fontSize: "14px",
    cursor: "pointer",
    padding: "4px",
    lineHeight: 1,
    flexShrink: 0
  },
  icon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    objectFit: "cover",
    flexShrink: 0,
    border: "1px solid rgba(255,255,255,0.15)"
  },
  info: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden"
  },
  appName: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#fff",
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  appDesc: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.6)",
    marginTop: "2px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  openBtn: {
    background: "linear-gradient(135deg, #0056D2, #0096FF)",
    color: "#fff",
    border: "none",
    borderRadius: "20px",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    flexShrink: 0,
    whiteSpace: "nowrap",
    boxShadow: "0 2px 8px rgba(0,86,210,0.4)"
  }
};

const CapApp = Capacitor.isNativePlatform() ? registerPlugin("App") : null;
const PLAY_STORE_URL = "https://play.google.com/apps/internaltest/4701312289208373704";
initAdMob().catch(() => {
});
(async () => {
  try {
    const apiBase = "https://fishing-go-backend.onrender.com";
    await fetch(`${apiBase}/api/health`, { signal: AbortSignal.timeout(55e3) });
  } catch {
  }
})();
try {
  localStorage.removeItem("fishinggo_theme");
  localStorage.removeItem("theme");
  localStorage.removeItem("darkMode");
  localStorage.removeItem("dark_mode");
  sessionStorage.removeItem("fishinggo_theme");
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.setAttribute("data-theme", "light");
  document.body.style.backgroundColor = "";
  document.body.style.color = "";
} catch {
}
function KakaoSdkInit() {
  reactExports.useEffect(() => {
    const key = "d353be56977b1c13b03d8981bcf8b5ba";
    const tryInit = () => {
      if (window.Kakao) {
        if (!window.Kakao.isInitialized()) {
          try {
            window.Kakao.init(key);
          } catch (e) {
          }
        }
        return true;
      }
      return false;
    };
    if (tryInit())
      return;
    const t1 = setTimeout(tryInit, 800);
    const t2 = setTimeout(tryInit, 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  return null;
}
const DEFAULT_AVATAR_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23E5E5EA'/%3E%3Ccircle cx='20' cy='16' r='7' fill='%23AEAEB2'/%3E%3Cellipse cx='20' cy='36' rx='12' ry='9' fill='%23AEAEB2'/%3E%3C/svg%3E";
const HIDE_OVERLAY_PATHS = ["/write", "/write-business", "/create-crew", "/post/", "/catch/", "/login", "/crew/", "/cctv-admin", "/notice/", "/secret-admin", "/payment-history", "/vvip-subscribe", "/admin-dashboard", "/weather", "/user/"];
const MapHome = reactExports.lazy(() => __vitePreload(() => import('./MapHome-DT_aiCHA.js'),true?__vite__mapDeps([11,1,2,12,13,14,15,3,4,5]):void 0));
const MediaTab = reactExports.lazy(() => __vitePreload(() => import('./MediaTab-CZqnNr9F.js'),true?__vite__mapDeps([16,1,2,3,4,5]):void 0));
const CommunityTab = reactExports.lazy(() => __vitePreload(() => import('./CommunityTab-Cmkn9ETt.js'),true?__vite__mapDeps([17,1,2,13,15,18,5,19,3,4]):void 0));
const Shop = reactExports.lazy(() => __vitePreload(() => import('./Shop-CXIHBu1z.js'),true?__vite__mapDeps([20,1,2,3,4,5]):void 0));
const MyPage = reactExports.lazy(() => __vitePreload(() => import('./MyPage-CM8KlWOS.js'),true?__vite__mapDeps([21,1,22,15,2,3,4,5]):void 0));
const WritePost = reactExports.lazy(() => __vitePreload(() => import('./WritePost-BEAoG2kg.js'),true?__vite__mapDeps([23,1,2,13,24,22,3,4,5]):void 0));
const CreateCrew = reactExports.lazy(() => __vitePreload(() => import('./CreateCrew-DGsO-Uoh.js'),true?__vite__mapDeps([25,1,2,13,3,4,5]):void 0));
const PostDetail = reactExports.lazy(() => __vitePreload(() => import('./PostDetail-DGwJX3fA.js'),true?__vite__mapDeps([26,1,2,18,19,15,3,4,5]):void 0));
const CatchDetail = reactExports.lazy(() => __vitePreload(() => import('./CatchDetail-CylneALv.js'),true?__vite__mapDeps([27,1,2,19,3,4,5]):void 0));
const LoginPage = reactExports.lazy(() => __vitePreload(() => import('./LoginPage-DPb6ZKu_.js'),true?__vite__mapDeps([28,1,2,3,4,5]):void 0));
const CrewChat = reactExports.lazy(() => __vitePreload(() => import('./CrewChat-CqXlwYhN.js'),true?__vite__mapDeps([29,1,5,2,22,3,4]):void 0));
const WeatherDashboard = reactExports.lazy(() => __vitePreload(() => import('./WeatherDashboard-CwEIapdA.js'),true?__vite__mapDeps([30,1,2,14,12,3,4,5]):void 0));
const VVIPSubscribe = reactExports.lazy(() => __vitePreload(() => import('./VVIPSubscribe-CzxoRfi7.js'),true?__vite__mapDeps([31,1,2,3,4,5]):void 0));
const WriteBusinessPost = reactExports.lazy(() => __vitePreload(() => import('./WriteBusinessPost-DeTLuJP8.js'),true?__vite__mapDeps([32,1,2,24,22,3,4,5]):void 0));
const CctvAdmin = reactExports.lazy(() => __vitePreload(() => import('./CctvAdmin-CajC70dz.js'),true?__vite__mapDeps([33,1,2,3,4,5]):void 0));
const NoticeDetail = reactExports.lazy(() => __vitePreload(() => import('./NoticeDetail-TznXS_RQ.js'),true?__vite__mapDeps([34,1,2,18,5,19,3,4]):void 0));
const SecretPointAdmin = reactExports.lazy(() => __vitePreload(() => import('./SecretPointAdmin-AcK8yHhi.js'),true?__vite__mapDeps([35,1,2,14,3,4,5]):void 0));
const PaymentHistory = reactExports.lazy(() => __vitePreload(() => import('./PaymentHistory-Be6NezD6.js'),true?__vite__mapDeps([36,1,2,37,3,4,5]):void 0));
const AdminDashboard = reactExports.lazy(() => __vitePreload(() => import('./AdminDashboard-56pTQgMV.js'),true?__vite__mapDeps([38,1,2,37,3,4,5]):void 0));
const UserProfile = reactExports.lazy(() => __vitePreload(() => import('./UserProfile-CHTL-jNn.js'),true?__vite__mapDeps([39,1,2,3,4,5]):void 0));
const CatchUploadPage = reactExports.lazy(() => __vitePreload(() => import('./CatchUploadPage-BPNYcs4b.js'),true?__vite__mapDeps([40,1,2,41,3,4,5]):void 0));
const CatchRankingPage = reactExports.lazy(() => __vitePreload(() => import('./CatchRankingPage-D1_nUfXj.js'),true?__vite__mapDeps([42,1,2,41,13,15,3,4,5]):void 0));
const ContestPage = reactExports.lazy(() => __vitePreload(() => import('./ContestPage-DPDG7exz.js'),true?__vite__mapDeps([43,1,2,41,3,4,5]):void 0));
const PointLocationAdmin = reactExports.lazy(() => __vitePreload(() => import('./PointLocationAdmin-oquIPcyg.js'),true?__vite__mapDeps([44,1,2,14,3,4,5]):void 0));
function PageLoading() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSpinner, {});
}
function FontScaleInit() {
  reactExports.useEffect(() => {
    const apply = (scale) => {
      const v = ["1", "1.15", "1.3", "1.5"].includes(scale) ? scale : "1";
      document.documentElement.setAttribute("data-fs", v);
    };
    apply(localStorage.getItem("fishinggo_fs") || "1");
    const onStorage = (e) => {
      if (e.key === "fishinggo_fs")
        apply(e.newValue || "1");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}
function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  reactExports.useEffect(() => {
    const ROOT_PATHS = ["/", "/community", "/media", "/shop", "/mypage", "/catch-ranking", "/catch-upload", "/contest"];
    const isRoot = ROOT_PATHS.includes(location.pathname);
    const handleBack = () => {
      if (isRoot)
        return;
      if (location.pathname.startsWith("/post/")) {
        const postId = location.pathname.split("/post/")[1]?.split("?")[0]?.split("#")[0];
        if (postId) {
          sessionStorage.setItem("community_return_post_id", postId);
          sessionStorage.setItem("community_return_tab", "open");
        }
      }
      if (window.history.length <= 1) {
        navigate("/community", { replace: true });
      } else {
        navigate(-1);
      }
    };
    if (CapApp) {
      const listenerP = CapApp.addListener("backButton", handleBack);
      return () => {
        listenerP?.then?.((l) => l?.remove?.()).catch?.(() => {
        });
      };
    } else {
      const domBack = (e) => {
        e?.preventDefault?.();
        handleBack();
      };
      document.addEventListener("backbutton", domBack, false);
      return () => document.removeEventListener("backbutton", domBack, false);
    }
  }, [location.pathname, navigate]);
  return null;
}
function DeepLinkHandler() {
  const navigate = useNavigate();
  reactExports.useEffect(() => {
    if (!CapApp)
      return;
    const parseAndNavigate = (url) => {
      try {
        const u = new URL(url);
        if (u.protocol === "fishinggo:") {
          const postId = u.searchParams.get("postId");
          const catchId = u.searchParams.get("catchId");
          if (postId) {
            navigate(`/post/${postId}`, { replace: true });
            return;
          }
          if (catchId) {
            navigate(`/catch/${catchId}`, { replace: true });
            return;
          }
          if (u.host === "community") {
            navigate("/community", { replace: true });
            return;
          }
        }
        const path = u.pathname + u.search;
        if (path && path !== "/") {
          navigate(path, { replace: true });
        }
      } catch {
      }
    };
    const listenerP = CapApp.addListener("appUrlOpen", (data) => {
      if (data?.url)
        parseAndNavigate(data.url);
    });
    CapApp.getLaunchUrl?.().then((res) => {
      if (res?.url)
        parseAndNavigate(res.url);
    }).catch(() => {
    });
    return () => {
      listenerP?.then?.((l) => l?.remove?.()).catch?.(() => {
      });
    };
  }, [navigate]);
  return null;
}
function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = [
    { path: "/", name: "홈", icon: Home },
    { path: "/media", name: "낚시채널", icon: Tv },
    { path: "/community", name: "커뮤니티", icon: Users },
    { path: "/shop", name: "쇼핑", icon: ShoppingBag },
    { path: "/mypage", name: "마이", icon: User }
  ];
  const hideNav = HIDE_OVERLAY_PATHS.some((path) => location.pathname.includes(path));
  if (hideNav)
    return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "bottom-nav", style: { display: "flex", alignItems: "center" }, children: navItems.map((item) => {
    const Icon = item.icon;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      NavLink,
      {
        to: item.path,
        className: ({ isActive }) => `nav-item ${isActive ? "active" : ""}`,
        style: { textDecoration: "none" },
        end: item.path === "/",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 22 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, marginTop: "3px", fontWeight: "700" }, children: item.name })
        ]
      },
      item.name
    );
  }) });
}
function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const userTier = useUserStore((state) => state.userTier);
  const isAdmin = useUserStore(
    (s) => s.user?.id === ADMIN_ID || s.user?.email === ADMIN_EMAIL || s.user?.email === "sunjulab.k@gmail.com" || s.userTier === "MASTER"
  );
  const hideHeader = HIDE_OVERLAY_PATHS.some((path) => location.pathname !== "/" && location.pathname.includes(path)) || location.pathname === "/";
  if (hideHeader)
    return null;
  const currentTier = isAdmin ? TIER_CONFIG.MASTER : TIER_CONFIG[userTier] || TIER_CONFIG.FREE;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "premium-header", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "logo", onClick: () => navigate("/"), style: { cursor: "pointer" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Anchor, { size: 24, color: "#0056D2" }),
      "낚시GO",
      currentTier.label && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          className: "premium-badge",
          style: { background: currentTier.bg || void 0, color: currentTier.color || void 0 },
          children: currentTier.label
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "img",
      {
        src: user?.avatar || user?.picture || DEFAULT_AVATAR_SVG,
        alt: "Profile",
        onClick: () => navigate("/mypage"),
        style: { width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)", cursor: "pointer" }
      }
    ) })
  ] });
}
function GlobalLevelUpListener() {
  const lastExpGain = useUserStore((state) => state.lastExpGain);
  const clearLastExpGain = useUserStore((state) => state.clearLastExpGain);
  const addToast = useToastStore((state) => state.addToast);
  const timerRef = React.useRef(null);
  React.useEffect(() => {
    if (lastExpGain && lastExpGain.leveledUp) {
      const { newLevel } = lastExpGain;
      const currentLevelIndex = (newLevel?.level || 1) - 1;
      const levelReward = LEVEL_CONFIG[currentLevelIndex]?.reward || "소정의 찌(포인트)";
      if (timerRef.current)
        clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        addToast(`⭐ 레벨 ${newLevel?.level} 달성 기념 보상!`, "success");
        addToast(`🎁 보상: [${levelReward}] 지급 완료!`, "info");
      }, 500);
      clearLastExpGain();
    }
    return () => {
      if (timerRef.current)
        clearTimeout(timerRef.current);
    };
  }, [lastExpGain, addToast, clearLastExpGain]);
  return null;
}
function SubscriptionExpiryChecker() {
  const checkSubscriptionExpiry = useUserStore((s) => s.checkSubscriptionExpiry);
  const addToast = useToastStore((s) => s.addToast);
  const userTier = useUserStore((s) => s.userTier);
  const navigate = useNavigate();
  const navTimerRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const prevTier = userTier;
    checkSubscriptionExpiry().then(() => {
      const newTier = useUserStore.getState().userTier;
      if (prevTier !== "FREE" && newTier === "FREE") {
        addToast("⚠️ 구독이 만료되어 권한이 해제되었습니다. 재구독해주세요.", "error");
      }
    });
    const onFocus = () => checkSubscriptionExpiry();
    window.addEventListener("focus", onFocus);
    const onExpired = () => {
      addToast("⚠️ 구독이 만료되었습니다. 마이페이지에서 재구독해주세요.", "error");
      if (navTimerRef.current)
        clearTimeout(navTimerRef.current);
      navTimerRef.current = setTimeout(() => {
        if (!window.location.pathname.includes("/mypage")) {
          navigate("/mypage", { replace: true });
        }
      }, 2e3);
    };
    window.addEventListener("subscription_expired", onExpired);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("subscription_expired", onExpired);
      if (navTimerRef.current)
        clearTimeout(navTimerRef.current);
    };
  }, [checkSubscriptionExpiry, addToast]);
  return null;
}
function UserSyncChecker() {
  const syncFromServer = useUserStore((s) => s.syncFromServer);
  const user = useUserStore((s) => s.user);
  reactExports.useEffect(() => {
    if (!user?.email)
      return;
    syncFromServer();
    const interval = setInterval(syncFromServer, 5 * 60 * 1e3);
    const onVisibility = () => {
      if (document.visibilityState === "visible")
        syncFromServer();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user?.email, syncFromServer]);
  return null;
}
function AuthExpiredChecker() {
  const navigate = useNavigate();
  const logout = useUserStore((s) => s.logout);
  reactExports.useEffect(() => {
    const onAuthExpired = () => {
      logout();
      if (!window.location.pathname.includes("/login")) {
        navigate("/login", { replace: true });
      }
    };
    window.addEventListener("auth_expired", onAuthExpired);
    return () => window.removeEventListener("auth_expired", onAuthExpired);
  }, [navigate, logout]);
  return null;
}
function PermissionInitializer() {
  const user = useUserStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();
  reactExports.useEffect(() => {
    setPushHandlers({ addToast, navigate });
  }, [addToast, navigate]);
  reactExports.useEffect(() => {
    if (!user?.id || user?.id === "GUEST")
      return;
    requestAllPermissions(user.id).catch(() => {
    });
  }, [user?.id]);
  reactExports.useEffect(() => {
    let cleanup = () => {
    };
    initNetworkMonitor(
      () => addToast("📶 네트워크 연결이 끊어졌습니다.", "error"),
      () => addToast("📶 네트워크가 다시 연결되었습니다.", "success")
    ).then((fn) => {
      cleanup = fn || (() => {
      });
    }).catch(() => {
    });
    return () => cleanup();
  }, []);
  return null;
}
function AdminRoute({ children }) {
  const isAdmin = useUserStore(
    (s) => s.user?.id === ADMIN_ID || s.user?.email === ADMIN_EMAIL || s.user?.email === "sunjulab.k@gmail.com" || s.userTier === "MASTER"
  );
  const [hydrated, setHydrated] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const t = setTimeout(() => setHydrated(true), 0);
    return () => clearTimeout(t);
  }, []);
  if (!hydrated)
    return null;
  if (!isAdmin)
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true });
  return children;
}
function App() {
  return (
    // ✅ FIX-BLANK: BrowserRouter를 ErrorBoundary 바깥(최상위)으로 이동
    // ErrorBoundary 내부에서 useNavigate()를 사용하므로 반드시 Router context 안에 있어야 함
    // 이전 구조: <ErrorBoundary><BrowserRouter>... → useNavigate가 Router 바깥에서 호출돼 앱 전체 크래시
    /* @__PURE__ */ jsxRuntimeExports.jsx(BrowserRouter, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(ErrorBoundary, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AppBanner, {}),
      "           ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(ForceUpdateChecker, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(FontScaleInit, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(KakaoSdkInit, {}),
      "     ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(KakaoLoader, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Toast, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SubscriptionFailBanner, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RealTimeAlert, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SubscriptionExpiryChecker, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(UserSyncChecker, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AuthExpiredChecker, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(GlobalLevelUpListener, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AnnouncementPopup, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BackButtonHandler, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DeepLinkHandler, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PermissionInitializer, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Header, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { minHeight: "100vh", display: "flex", flexDirection: "column" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx(PageLoading, {}), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Routes, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/", element: /* @__PURE__ */ jsxRuntimeExports.jsx(MapHome, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/media", element: /* @__PURE__ */ jsxRuntimeExports.jsx(MediaTab, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/community", element: /* @__PURE__ */ jsxRuntimeExports.jsx(CommunityTab, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/shop", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Shop, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/mypage", element: /* @__PURE__ */ jsxRuntimeExports.jsx(MyPage, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/write", element: /* @__PURE__ */ jsxRuntimeExports.jsx(WritePost, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/create-crew", element: /* @__PURE__ */ jsxRuntimeExports.jsx(CreateCrew, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/post/:id", element: /* @__PURE__ */ jsxRuntimeExports.jsx(PostDetail, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/catch/:id", element: /* @__PURE__ */ jsxRuntimeExports.jsx(CatchDetail, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/catch-upload", element: /* @__PURE__ */ jsxRuntimeExports.jsx(CatchUploadPage, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/catch-ranking", element: /* @__PURE__ */ jsxRuntimeExports.jsx(CatchRankingPage, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/crew/:id/chat", element: /* @__PURE__ */ jsxRuntimeExports.jsx(CrewChat, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/login", element: /* @__PURE__ */ jsxRuntimeExports.jsx(LoginPage, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/weather", element: /* @__PURE__ */ jsxRuntimeExports.jsx(WeatherDashboard, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/vvip-subscribe", element: /* @__PURE__ */ jsxRuntimeExports.jsx(VVIPSubscribe, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/write-business", element: /* @__PURE__ */ jsxRuntimeExports.jsx(WriteBusinessPost, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/cctv-admin", element: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CctvAdmin, {}) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/notice/:id", element: /* @__PURE__ */ jsxRuntimeExports.jsx(NoticeDetail, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/secret-admin", element: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SecretPointAdmin, {}) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/point-admin", element: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(PointLocationAdmin, {}) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/payment-history", element: /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentHistory, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/admin-dashboard", element: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminDashboard, {}) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/user/:name", element: /* @__PURE__ */ jsxRuntimeExports.jsx(UserProfile, {}) })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BottomNav, {})
    ] }) })
  );
}

client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {}) })
);

export { ADMIN_ID as A, Capacitor as C, LoadingSpinner as L, TIER_CONFIG as T, WebPlugin as W, ADMIN_EMAIL as a, useToastStore as b, apiClient as c, useNotifStore as d, LEVEL_CONFIG as e, CapacitorException as f, getLevelInfo as g, index$1 as i, jsxRuntimeExports as j, registerPlugin as r, showRewardedAd as s, useUserStore as u };
