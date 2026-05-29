function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/react-dac-Xgw1.js","assets/vendor-react-BzbiWsGG.js","assets/index-CUWt0Sfx.js","assets/hls-C7Hf2gZu.js","assets/react-CWCeQJvj.js","assets/index-BI0JMzmF.js","assets/react-CfWIGDDn.js","assets/index-DYnuIO1L.js","assets/react-BOWkPPN8.js","assets/react-K-E_iqpZ.js","assets/react-D7Ik7Q2Z.js","assets/react-BZ1rFq7s.js","assets/react-WbYFyPkL.js","assets/Preview-D9i1qEdv.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
import { u as useUserStore, A as ADMIN_ID, a as ADMIN_EMAIL, b as useToastStore, c as apiClient, j as jsxRuntimeExports, d as useNotifStore, T as TIER_CONFIG } from './index-rdBGUi8d.js';
import { R as React, r as reactExports, _ as __vitePreload, u as useNavigate } from './vendor-react-BzbiWsGG.js';
import { h as MessageSquare, i as ChevronUp, j as ChevronDown, L as Lock, k as Send, R as RefreshCw, l as Clock, C as CheckCircle, X, A as AlertCircle, m as Search, n as MapPin, W as Waves, o as Wind, T as Tv, p as Map, q as BarChart2, r as Ship, s as Crown, Z as Zap, c as CornerUpLeft, M as Megaphone, b as AlertTriangle, F as Fish, t as Bell, u as Trash2, v as CheckCheck, w as RotateCcw, x as Loader2, y as Check, z as ArrowLeft, g as Anchor } from './vendor-icons-C5BxRig-.js';
import { e as evaluateFishingCondition } from './evaluator-ZO7-HWnF.js';
import { N as NativeAd, R as RewardGateModal } from './AdUnit-BqORXC3x.js';
import { S as SECRET_FISHING_POINTS, A as ALL_FISHING_POINTS, g as getPointSpecificData } from './fishingData-DUAFbpZH.js';
import { A as AdSenseDisplay } from './AdSenseAd-CQtTSdZ4.js';
import './vendor-store-DFdRS9Cc.js';
import './vendor-http-ChhVHlBG.js';
import './vendor-socket-FPM1Bwz4.js';

const OBSERVATION_STATIONS = [
  // 동해권
  { id: "DT_0001", name: "강릉항 관측소", lat: 37.7715, lng: 128.9488 },
  { id: "DT_0002", name: "영덕 관측소", lat: 36.5258, lng: 129.4126 },
  { id: "DT_0003", name: "삼척항 관측소", lat: 37.449, lng: 129.166 },
  { id: "DT_0021", name: "속초항 관측소", lat: 38.2045, lng: 128.5944 },
  { id: "DT_0033", name: "묵호항 관측소", lat: 37.551, lng: 129.1158 },
  { id: "DT_0036", name: "울산 정자 관측소", lat: 35.67, lng: 129.464 },
  // 남해권
  { id: "DT_0004", name: "부산 해운대 관측소", lat: 35.1601, lng: 129.16 },
  { id: "DT_0016", name: "통영항 관측소", lat: 34.8544, lng: 128.4332 },
  { id: "DT_0034", name: "거제 관측소", lat: 34.88, lng: 128.62 },
  // 전남권
  { id: "DT_0005", name: "여수항 관측소", lat: 34.744, lng: 127.7276 },
  { id: "DT_0006", name: "목포항 관측소", lat: 34.79, lng: 126.393 },
  { id: "DT_0018", name: "완도 관측소", lat: 34.315, lng: 126.7554 },
  // 서해권
  { id: "DT_0008", name: "보령 대천 관측소", lat: 36.315, lng: 126.539 },
  { id: "DT_0009", name: "군산항 관측소", lat: 35.982, lng: 126.716 },
  // 제주권
  { id: "DT_0010", name: "제주 한림 관측소", lat: 33.41, lng: 126.258 },
  { id: "DT_0011", name: "서귀포 관측소", lat: 33.246, lng: 126.561 },
  { id: "DT_0045", name: "제주 성산 관측소", lat: 33.458, lng: 126.929 }
];
const RAD = Math.PI / 180;
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * RAD;
  const dLon = (lon2 - lon1) * RAD;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function findNearestStation(userLat, userLng) {
  const nearest = OBSERVATION_STATIONS.reduce((best, station) => {
    const dist = getDistance(userLat, userLng, station.lat, station.lng);
    return dist < best.distance ? { ...station, distance: dist } : best;
  }, { distance: Infinity });
  return { ...nearest, distance: nearest.distance.toFixed(2) };
}
function calculateFishingIndex(wind, wave, pressureTrend) {
  let score = 5;
  if (wind > 12)
    score -= 3;
  else if (wind > 8)
    score -= 1.5;
  else if (wind > 5)
    score -= 0.5;
  if (wave > 2)
    score -= 2;
  else if (wave > 1)
    score -= 1;
  if (pressureTrend === "down")
    score -= 1;
  else if (pressureTrend === "up")
    score += 0.5;
  return Math.max(1, Math.min(5, parseFloat(score.toFixed(1))));
}
function getTidePhase(date) {
  const phases = ["1물", "2물", "3물", "4물", "5물", "6물", "7물(사리)", "8물", "9물", "10물", "11물", "12물", "13물(조금)", "14물(무시)", "15물"];
  const day = (new Date(date).getDate() - 1) % 15;
  return phases[day];
}
const weatherCache = {
  save: (stationId, data) => {
    const cacheKey = `fishing_go_cache_${stationId}`;
    const payload = { timestamp: Date.now(), data };
    try {
      localStorage.setItem(cacheKey, JSON.stringify(payload));
    } catch (e) {
      if (false)
        console.warn("[weatherCache] 저장 실패:", e.message);
    }
  },
  get: (stationId) => {
    const cacheKey = `fishing_go_cache_${stationId}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached)
        return null;
      const { timestamp, data } = JSON.parse(cached);
      const threeDays = 3 * 24 * 60 * 60 * 1e3;
      if (Date.now() - timestamp > threeDays) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      return data;
    } catch {
      try {
        localStorage.removeItem(cacheKey);
      } catch {
      }
      return null;
    }
  }
};

const AUDIO_EXTENSIONS = /\.(m4a|m4b|mp4a|mpga|mp2|mp2a|mp3|m2a|m3a|wav|weba|aac|oga|spx)($|\?)/i;
const VIDEO_EXTENSIONS = /\.(mp4|og[gv]|webm|mov|m4v)(#t=[,\d+]+)?($|\?)/i;
const HLS_EXTENSIONS = /\.(m3u8)($|\?)/i;
const DASH_EXTENSIONS = /\.(mpd)($|\?)/i;
const MATCH_URL_MUX = /stream\.mux\.com\/(?!\w+\.m3u8)(\w+)/;
const MATCH_URL_YOUTUBE = /(?:youtu\.be\/|youtube(?:-nocookie|education)?\.com\/(?:embed\/|v\/|watch\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))((\w|-){11})|youtube\.com\/playlist\?list=|youtube\.com\/user\//;
const MATCH_URL_VIMEO = /vimeo\.com\/(?!progressive_redirect).+/;
const MATCH_URL_WISTIA = /(?:wistia\.(?:com|net)|wi\.st)\/(?:medias|embed)\/(?:iframe\/)?([^?]+)/;
const MATCH_URL_SPOTIFY = /open\.spotify\.com\/(\w+)\/(\w+)/i;
const MATCH_URL_TWITCH = /(?:www\.|go\.)?twitch\.tv\/([a-zA-Z0-9_]+|(videos?\/|\?video=)\d+)($|\?)/;
const MATCH_URL_TIKTOK = /tiktok\.com\/(?:player\/v1\/|share\/video\/|@[^/]+\/video\/)([0-9]+)/;
const canPlayFile = (url, test) => {
  if (Array.isArray(url)) {
    for (const item of url) {
      if (typeof item === "string" && canPlayFile(item, test)) {
        return true;
      }
      if (canPlayFile(item.src, test)) {
        return true;
      }
    }
    return false;
  }
  return test(url);
};
const canPlay = {
  html: (url) => canPlayFile(url, (u) => AUDIO_EXTENSIONS.test(u) || VIDEO_EXTENSIONS.test(u)),
  hls: (url) => canPlayFile(url, (u) => HLS_EXTENSIONS.test(u)),
  dash: (url) => canPlayFile(url, (u) => DASH_EXTENSIONS.test(u)),
  mux: (url) => MATCH_URL_MUX.test(url),
  youtube: (url) => MATCH_URL_YOUTUBE.test(url),
  vimeo: (url) => MATCH_URL_VIMEO.test(url) && !VIDEO_EXTENSIONS.test(url) && !HLS_EXTENSIONS.test(url),
  wistia: (url) => MATCH_URL_WISTIA.test(url),
  spotify: (url) => MATCH_URL_SPOTIFY.test(url),
  twitch: (url) => MATCH_URL_TWITCH.test(url),
  tiktok: (url) => MATCH_URL_TIKTOK.test(url)
};

const HtmlPlayer = React.forwardRef((props, ref) => {
  const Media = AUDIO_EXTENSIONS.test(`${props.src}`) ? "audio" : "video";
  return /* @__PURE__ */ React.createElement(Media, { ...props, ref }, props.children);
});
var HtmlPlayer_default = HtmlPlayer;

const Players = [
  {
    key: "hls",
    name: "hls.js",
    canPlay: canPlay.hls,
    canEnablePIP: () => true,
    player: reactExports.lazy(
      () => __vitePreload(() => import(
        /* webpackChunkName: 'reactPlayerHls' */
        './react-dac-Xgw1.js'
      ),true?__vite__mapDeps([0,1,2,3]):void 0)
    )
  },
  {
    key: "dash",
    name: "dash.js",
    canPlay: canPlay.dash,
    canEnablePIP: () => true,
    player: reactExports.lazy(
      () => __vitePreload(() => import(
        /* webpackChunkName: 'reactPlayerDash' */
        './react-CWCeQJvj.js'
      ),true?__vite__mapDeps([4,1,2]):void 0)
    )
  },
  {
    key: "mux",
    name: "Mux",
    canPlay: canPlay.mux,
    canEnablePIP: () => true,
    player: reactExports.lazy(
      () => __vitePreload(() => import(
        /* webpackChunkName: 'reactPlayerMux' */
        './index-BI0JMzmF.js'
      ),true?__vite__mapDeps([5,1,3,2]):void 0)
    )
  },
  {
    key: "youtube",
    name: "YouTube",
    canPlay: canPlay.youtube,
    player: reactExports.lazy(
      () => __vitePreload(() => import(
        /* webpackChunkName: 'reactPlayerYouTube' */
        './react-CfWIGDDn.js'
      ),true?__vite__mapDeps([6,1,7]):void 0)
    )
  },
  {
    key: "vimeo",
    name: "Vimeo",
    canPlay: canPlay.vimeo,
    player: reactExports.lazy(
      () => __vitePreload(() => import(
        /* webpackChunkName: 'reactPlayerVimeo' */
        './react-BOWkPPN8.js'
      ),true?__vite__mapDeps([8,1,7]):void 0)
    )
  },
  {
    key: "wistia",
    name: "Wistia",
    canPlay: canPlay.wistia,
    canEnablePIP: () => true,
    player: reactExports.lazy(
      () => __vitePreload(() => import(
        /* webpackChunkName: 'reactPlayerWistia' */
        './react-K-E_iqpZ.js'
      ),true?__vite__mapDeps([9,1]):void 0)
    )
  },
  {
    key: "spotify",
    name: "Spotify",
    canPlay: canPlay.spotify,
    canEnablePIP: () => false,
    player: reactExports.lazy(
      () => __vitePreload(() => import(
        /* webpackChunkName: 'reactPlayerSpotify' */
        './react-D7Ik7Q2Z.js'
      ),true?__vite__mapDeps([10,1]):void 0)
    )
  },
  {
    key: "twitch",
    name: "Twitch",
    canPlay: canPlay.twitch,
    canEnablePIP: () => false,
    player: reactExports.lazy(
      () => __vitePreload(() => import(
        /* webpackChunkName: 'reactPlayerTwitch' */
        './react-BZ1rFq7s.js'
      ),true?__vite__mapDeps([11,1]):void 0)
    )
  },
  {
    key: "tiktok",
    name: "TikTok",
    canPlay: canPlay.tiktok,
    canEnablePIP: () => false,
    player: reactExports.lazy(
      () => __vitePreload(() => import(
        /* webpackChunkName: 'reactPlayerTiktok' */
        './react-WbYFyPkL.js'
      ),true?__vite__mapDeps([12,1]):void 0)
    )
  },
  {
    key: "html",
    name: "html",
    canPlay: canPlay.html,
    canEnablePIP: () => true,
    player: HtmlPlayer_default
  }
];
var players_default = Players;

const defaultProps = {
  // Falsy values don't need to be defined
  //
  // native video attrs
  // src: undefined,
  // preload: undefined,
  // crossOrigin: undefined,
  // autoPlay: false,
  // muted: false,
  // loop: false,
  // controls: false,
  // playsInline: false,
  // disableRemotePlayback: false,
  width: "320px",
  height: "180px",
  // native video props
  volume: 1,
  playbackRate: 1,
  // custom props
  // playing: undefined,
  // pip: false,
  // light: false,
  // fallback: null,
  previewTabIndex: 0,
  previewAriaLabel: "",
  oEmbedUrl: "https://noembed.com/embed?url={url}"
};

const Player = React.forwardRef((props, ref) => {
  const { playing, pip } = props;
  const Player2 = props.activePlayer;
  const playerRef = reactExports.useRef(null);
  const startOnPlayRef = reactExports.useRef(true);
  reactExports.useEffect(() => {
    var _a, _b;
    if (!playerRef.current) return;
    if (playerRef.current.paused && playing === true) {
      playerRef.current.play();
    }
    if (!playerRef.current.paused && playing === false) {
      playerRef.current.pause();
    }
    playerRef.current.playbackRate = (_a = props.playbackRate) != null ? _a : 1;
    playerRef.current.volume = (_b = props.volume) != null ? _b : 1;
  });
  reactExports.useEffect(() => {
    var _a, _b, _c, _d, _e;
    if (!playerRef.current || !globalThis.document) return;
    if (pip && !document.pictureInPictureElement) {
      try {
        (_b = (_a = playerRef.current).requestPictureInPicture) == null ? void 0 : _b.call(_a);
      } catch (err) {
      }
    }
    if (!pip && document.pictureInPictureElement) {
      try {
        (_d = (_c = playerRef.current).exitPictureInPicture) == null ? void 0 : _d.call(_c);
        (_e = document.exitPictureInPicture) == null ? void 0 : _e.call(document);
      } catch (err) {
      }
    }
  }, [pip]);
  const handleLoadStart = (event) => {
    var _a, _b;
    startOnPlayRef.current = true;
    (_a = props.onReady) == null ? void 0 : _a.call(props);
    (_b = props.onLoadStart) == null ? void 0 : _b.call(props, event);
  };
  const handlePlay = (event) => {
    var _a, _b;
    if (startOnPlayRef.current) {
      startOnPlayRef.current = false;
      (_a = props.onStart) == null ? void 0 : _a.call(props, event);
    }
    (_b = props.onPlay) == null ? void 0 : _b.call(props, event);
  };
  if (!Player2) {
    return null;
  }
  const eventProps = {};
  const reactPlayerEventHandlers = ["onReady", "onStart"];
  for (const key in props) {
    if (key.startsWith("on") && !reactPlayerEventHandlers.includes(key)) {
      eventProps[key] = props[key];
    }
  }
  return /* @__PURE__ */ React.createElement(
    Player2,
    {
      ...eventProps,
      style: props.style,
      className: props.className,
      slot: props.slot,
      ref: reactExports.useCallback(
        (node) => {
          playerRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref !== null) {
            ref.current = node;
          }
        },
        [ref]
      ),
      src: props.src,
      crossOrigin: props.crossOrigin,
      preload: props.preload,
      controls: props.controls,
      muted: props.muted,
      autoPlay: props.autoPlay,
      loop: props.loop,
      playsInline: props.playsInline,
      disableRemotePlayback: props.disableRemotePlayback,
      config: props.config,
      onLoadStart: handleLoadStart,
      onPlay: handlePlay
    },
    props.children
  );
});
Player.displayName = "Player";
var Player_default = Player;

const Preview = reactExports.lazy(() => __vitePreload(() => import(
  /* webpackChunkName: 'reactPlayerPreview' */
  './Preview-D9i1qEdv.js'
),true?__vite__mapDeps([13,1]):void 0));
const customPlayers = [];
const createReactPlayer = (players, playerFallback) => {
  const getActivePlayer = (src) => {
    for (const player of [...customPlayers, ...players]) {
      if (src && player.canPlay(src)) {
        return player;
      }
    }
    if (playerFallback) {
      return playerFallback;
    }
    return null;
  };
  const ReactPlayer = React.forwardRef((_props, ref) => {
    const props = { ...defaultProps, ..._props };
    const { src, slot, className, style, width, height, fallback, wrapper } = props;
    const [showPreview, setShowPreview] = reactExports.useState(!!props.light);
    reactExports.useEffect(() => {
      if (props.light) {
        setShowPreview(true);
      } else {
        setShowPreview(false);
      }
    }, [props.light]);
    const handleClickPreview = (e) => {
      var _a;
      setShowPreview(false);
      (_a = props.onClickPreview) == null ? void 0 : _a.call(props, e);
    };
    const renderPreview = (src2) => {
      if (!src2) return null;
      const { light, playIcon, previewTabIndex, oEmbedUrl, previewAriaLabel } = props;
      return /* @__PURE__ */ React.createElement(
        Preview,
        {
          src: src2,
          light,
          playIcon,
          previewTabIndex,
          previewAriaLabel,
          oEmbedUrl,
          onClickPreview: handleClickPreview
        }
      );
    };
    const renderActivePlayer = (src2) => {
      var _a, _b;
      const player = getActivePlayer(src2);
      if (!player) return null;
      const { style: style2, width: width2, height: height2, wrapper: wrapper2 } = props;
      const config = (_a = props.config) == null ? void 0 : _a[player.key];
      return /* @__PURE__ */ React.createElement(
        Player_default,
        {
          ...props,
          ref,
          activePlayer: (_b = player.player) != null ? _b : player,
          slot: wrapper2 ? void 0 : slot,
          className: wrapper2 ? void 0 : className,
          style: wrapper2 ? { display: "block", width: "100%", height: "100%" } : { display: "block", width: width2, height: height2, ...style2 },
          config
        }
      );
    };
    const Wrapper = wrapper == null ? ForwardChildren : wrapper;
    const UniversalSuspense = fallback === false ? ForwardChildren : reactExports.Suspense;
    return /* @__PURE__ */ React.createElement(Wrapper, { slot, className, style: { width, height, ...style } }, /* @__PURE__ */ React.createElement(UniversalSuspense, { fallback }, showPreview ? renderPreview(src) : renderActivePlayer(src)));
  });
  ReactPlayer.displayName = "ReactPlayer";
  ReactPlayer.addCustomPlayer = (player) => {
    customPlayers.push(player);
  };
  ReactPlayer.removeCustomPlayers = () => {
    customPlayers.length = 0;
  };
  ReactPlayer.canPlay = (src) => {
    if (src) {
      for (const Player2 of [...customPlayers, ...players]) {
        if (Player2.canPlay(src)) {
          return true;
        }
      }
    }
    return false;
  };
  ReactPlayer.canEnablePIP = (src) => {
    var _a;
    if (src) {
      for (const Player2 of [...customPlayers, ...players]) {
        if (Player2.canPlay(src) && ((_a = Player2.canEnablePIP) == null ? void 0 : _a.call(Player2))) {
          return true;
        }
      }
    }
    return false;
  };
  return ReactPlayer;
};
const ForwardChildren = ({ children }) => children;

"use client";
const fallback = players_default[players_default.length - 1];
var src_default = createReactPlayer(players_default, fallback);

const API_KEY = "2c92debdb84cf6c2ca60816fa5e9acbbfa06a9ae502cc37919ebec6be629623a";
if (!API_KEY && false) {
  console.warn("[marineApi] VITE_TIDE_API_KEY 미설정 — 해양 API 비활성화됨");
}
const PROXY = "/data-go-api";
async function fetchDataGo(endpoint, params) {
  const extraParams = new URLSearchParams({
    numOfRows: "10",
    pageNo: "1",
    type: "json",
    // data.go.kr JSON 포맷 파라미터
    ...params
  }).toString();
  const query = `serviceKey=${encodeURIComponent(API_KEY)}&${extraParams}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1e4);
  try {
    const response = await fetch(`${PROXY}/${endpoint}?${query}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
      // JSON 명시 요청
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      if (false)
        console.warn(`[marineApi] ${endpoint} HTTP ${response.status}`);
      return null;
    }
    const text = await response.text();
    if (text.trimStart().startsWith("<")) {
      if (false) {
        const codeMatch = text.match(/<resultCode>([^<]+)<\/resultCode>/);
        const msgMatch = text.match(/<resultMsg>([^<]+)<\/resultMsg>/);
        const code = codeMatch?.[1] ?? "UNKNOWN";
        const msg = msgMatch?.[1] ?? text.slice(0, 120);
        console.warn(`[marineApi] ${endpoint} XML오류 [${code}]:`, msg);
      }
      return null;
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      if (false)
        console.warn(`[marineApi] ${endpoint} JSON파싱실패:`, text.slice(0, 80));
      return null;
    }
    const resultCode = data?.response?.header?.resultCode;
    if (resultCode !== "00") {
      if (false)
        console.warn(`[marineApi] ${endpoint} 오류 [${resultCode}]:`, data?.response?.header?.resultMsg);
      return null;
    }
    const items = data?.response?.body?.items?.item;
    if (!items)
      return null;
    return Array.isArray(items) ? items : [items];
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      if (false)
        console.warn(`[marineApi] ${endpoint} 타임아웃 (10s)`);
    } else if (false) {
      console.error(`[marineApi] ${endpoint} 오류:`, error);
    }
    return null;
  }
}
const fetchTideForecast = (obsCode, date) => fetchDataGo("1192136/tideFcstHghLw/GetTideFcstHghLwApiService", { obsCode, date });
const fetchWaterTemp = async (obsCode, date) => {
  const data = await fetchDataGo("1192136/surveyWaterTemp/GetSurveyWaterTempApiService", {
    obsCode,
    date
  });
  if (!data)
    return "-";
  const last = data[data.length - 1];
  const temp = last?.water_temp ?? last?.waterTemp ?? null;
  return temp !== null && temp !== void 0 ? String(temp) : "-";
};
const fetchFishingIndex = (obsCode) => fetchDataGo("1192136/fcstFishingv2/GetFcstFishingApiServicev2", { obsCode });

const API_BASE = "https://fishing-go-backend.onrender.com";
const YOUTUBE_REGEXP = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
function extractYoutubeId(str) {
  const match = str.match(YOUTUBE_REGEXP);
  return match && match[2].length === 11 ? match[2] : str;
}
function CatchRecordModal({ point, user, onClose, onSuccess }) {
  const addToast = useToastStore((s) => s.addToast);
  const fileRef = reactExports.useRef(null);
  const [form, setForm] = reactExports.useState({
    fish: (point?.fish || "").split(",")[0].trim(),
    size: "",
    weight: "",
    bait: "",
    weather: "",
    wind: "",
    wave: "",
    memo: "",
    image: null,
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    shareToBoard: false
    // ✅ SHARE-OPT: 오픈게시판 동시 공유 옵션
  });
  const [submitting, setSubmitting] = reactExports.useState(false);
  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file)
      return;
    try {
      const { fileToCompressedBase64 } = await __vitePreload(() => import('./imageUtils-BQ2gh6yW.js'),true?__vite__mapDeps([]):void 0);
      const b64 = await fileToCompressedBase64(file);
      setForm((p) => ({ ...p, image: b64 }));
    } catch {
      addToast("이미지 처리 실패", "error");
    }
  };
  const handleSubmit = async () => {
    if (!form.fish.trim()) {
      addToast("어종을 입력해주세요.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/api/user/records", {
        author: user?.name || user?.nickname || "anonymous",
        author_email: user?.email || "",
        fish: form.fish.trim(),
        size: form.size,
        weight: form.weight,
        location: point?.name || "",
        bait: form.bait,
        weather: form.weather,
        wind: form.wind,
        wave: form.wave,
        memo: form.memo,
        image: form.image,
        date: form.date,
        pointId: String(point?.id || "")
      });
      if (form.shareToBoard) {
        const sizeStr = form.size ? `${form.size}cm` : "";
        const weightStr = form.weight ? `${form.weight}kg` : "";
        const specLine = [sizeStr, weightStr].filter(Boolean).join(" / ");
        const weatherLine = [form.weather, form.wind && `풍속 ${form.wind}`, form.wave && `파고 ${form.wave}`].filter(Boolean).join(" · ");
        const boardContent = `🌊 [조과 공유] ${point?.name || ""} — ${form.date}
🐟 어종: ${form.fish.trim()}` + (specLine ? `  ${specLine}` : "") + "\n" + (form.bait ? `🎯 미끼/루어: ${form.bait}
` : "") + (weatherLine ? `🌤 날씨: ${weatherLine}
` : "") + (form.memo ? `
💬 ${form.memo}` : "");
        await apiClient.post("/api/community/posts", {
          author: user.name,
          author_email: user.email,
          category: "조황 공유",
          content: boardContent.trim(),
          image: form.image || null
        });
        addToast("🌊 조과 기록 + 오픈게시판 동시 등록 완료!", "success");
      } else {
        addToast("🎣 조과 기록이 저장되었습니다!", "success");
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || "저장 실패. 다시 시도해주세요.", "error");
    } finally {
      setSubmitting(false);
    }
  };
  const WEATHER_OPTIONS = ["맑음", "흐림", "비", "강풍", "안개"];
  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9200, display: "flex", alignItems: "flex-end", justifyContent: "center" }, onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: (e) => e.stopPropagation(), style: { background: "#fff", borderRadius: "28px 28px 0 0", padding: "28px 20px 48px", width: "100%", maxWidth: "480px", maxHeight: "92vh", overflowY: "auto" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "40px", height: "4px", background: "#E5E5EA", borderRadius: "2px", margin: "0 auto 20px" } }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "950", color: "#1c1c1e" }, children: "🎣 조과 기록 남기기" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, style: { background: "none", border: "none", fontSize: `calc(22px * var(--fs, 1))`, cursor: "pointer", color: "#8E8E93" }, children: "✕" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "600", marginBottom: "20px" }, children: [
      "📍 ",
      point?.name,
      " · 기록은 마이페이지 조과통계에 반영됩니다"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileRef, type: "file", accept: "image/*", style: { display: "none" }, onChange: handleImage }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { onClick: () => fileRef.current?.click(), style: { width: "100%", height: "140px", background: "#F8F9FA", borderRadius: "16px", border: "2px dashed #D1D1D6", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: "16px", overflow: "hidden" }, children: form.image ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: form.image, alt: "", style: { width: "100%", height: "100%", objectFit: "cover", borderRadius: "14px" } }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", color: "#8E8E93" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(28px * var(--fs, 1))`, marginBottom: "6px" }, children: "📷" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "700" }, children: "사진 추가 (선택)" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "12px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", color: "#444", marginBottom: "6px" }, children: "어종 *" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: form.fish, onChange: (e) => set("fish", e.target.value), placeholder: "예: 감성돔", style: { width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1.5px solid #E5E5EA", fontSize: `calc(14px * var(--fs, 1))`, outline: "none", boxSizing: "border-box" } })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", color: "#444", marginBottom: "6px" }, children: "사이즈 (cm)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: form.size, onChange: (e) => set("size", e.target.value), placeholder: "예: 45", type: "number", style: { width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1.5px solid #E5E5EA", fontSize: `calc(14px * var(--fs, 1))`, outline: "none", boxSizing: "border-box" } })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", color: "#444", marginBottom: "6px" }, children: "무게 (kg)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: form.weight, onChange: (e) => set("weight", e.target.value), placeholder: "예: 2.3", type: "number", step: "0.1", style: { width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1.5px solid #E5E5EA", fontSize: `calc(14px * var(--fs, 1))`, outline: "none", boxSizing: "border-box" } })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "12px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", color: "#444", marginBottom: "6px" }, children: "미끼/루어" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: form.bait, onChange: (e) => set("bait", e.target.value), placeholder: "예: 크릴, 갯지렁이, 타이라바", style: { width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1.5px solid #E5E5EA", fontSize: `calc(14px * var(--fs, 1))`, outline: "none", boxSizing: "border-box" } })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "12px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", color: "#444", marginBottom: "8px" }, children: "날씨" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" }, children: WEATHER_OPTIONS.map((w) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => set("weather", form.weather === w ? "" : w),
          style: { padding: "7px 14px", borderRadius: "20px", border: form.weather === w ? "2px solid #0056D2" : "1.5px solid #E5E5EA", background: form.weather === w ? "#EBF5FF" : "#fff", color: form.weather === w ? "#0056D2" : "#555", fontWeight: "800", fontSize: `calc(12px * var(--fs, 1))`, cursor: "pointer" },
          children: w
        },
        w
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "12px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", color: "#444", marginBottom: "6px" }, children: "출조 날짜" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: form.date, onChange: (e) => set("date", e.target.value), type: "date", style: { width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1.5px solid #E5E5EA", fontSize: `calc(14px * var(--fs, 1))`, outline: "none", boxSizing: "border-box" } })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "20px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", color: "#444", marginBottom: "6px" }, children: "한마디 메모" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: form.memo, onChange: (e) => set("memo", e.target.value), placeholder: "예: 새벽 4시 물때 맞춰 대박! 다음엔 타이라바 도전", rows: 3, style: { width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1.5px solid #E5E5EA", fontSize: `calc(14px * var(--fs, 1))`, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit" } })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        onClick: () => set("shareToBoard", !form.shareToBoard),
        style: {
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "14px 16px",
          borderRadius: "14px",
          cursor: "pointer",
          marginBottom: "16px",
          background: form.shareToBoard ? "linear-gradient(135deg, #EBF5FF, #F0FFF8)" : "#F8F9FA",
          border: `1.5px solid ${form.shareToBoard ? "#0056D2" : "#E5E5EA"}`,
          transition: "all 0.15s"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            width: "22px",
            height: "22px",
            borderRadius: "7px",
            flexShrink: 0,
            border: `2px solid ${form.shareToBoard ? "#0056D2" : "#C7C7CC"}`,
            background: form.shareToBoard ? "#0056D2" : "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s"
          }, children: form.shareToBoard && /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "11", height: "9", viewBox: "0 0 11 9", fill: "none", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M1 4.5L4 7.5L10 1", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: form.shareToBoard ? "#0056D2" : "#1c1c1e" }, children: "🌊 오픈게시판에도 공유하기" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#8E8E93", marginTop: "2px", fontWeight: "600" }, children: "체크 시 조과 내용이 오픈게시판 '조황 공유' 카테고리에 자동 등록됩니다" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(18px * var(--fs, 1))` }, children: form.shareToBoard ? "🌊" : "🔒" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: handleSubmit,
        disabled: submitting,
        style: { width: "100%", padding: "16px", background: submitting ? "#ccc" : "linear-gradient(135deg, #0056D2, #0096FF)", color: "#fff", border: "none", borderRadius: "16px", fontWeight: "950", fontSize: `calc(15px * var(--fs, 1))`, cursor: submitting ? "not-allowed" : "pointer", letterSpacing: "-0.02em" },
        children: submitting ? "저장 중..." : form.shareToBoard ? "🌊 기록 저장 + 게시판 공유" : "🎣 조과 기록 저장하기"
      }
    )
  ] }) });
}
function FishingPointBottomSheet({ selectedPoint, onClose, onConditionReady }) {
  const [marineData, setMarineData] = reactExports.useState({
    tide: null,
    waterTemp: "-",
    fishingIndex: null
  });
  const [loading, setLoading] = reactExports.useState(true);
  const [cctvData, setCctvData] = reactExports.useState(null);
  const [cctvLoading, setCctvLoading] = reactExports.useState(true);
  const [shoppingItems, setShoppingItems] = reactExports.useState([]);
  const [businessPosts, setBusinessPosts] = reactExports.useState([]);
  const [bizLoading, setBizLoading] = reactExports.useState(false);
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const userTier = useUserStore((state) => state.userTier);
  const canAccessPremium = reactExports.useMemo(() => {
    if (user?.id === ADMIN_ID || user?.email === ADMIN_EMAIL || user?.email === ADMIN_ID)
      return true;
    return ["BUSINESS_LITE", "PRO", "BUSINESS_VIP", "MASTER"].includes(userTier);
  }, [userTier, user?.id, user?.email]);
  const isAdmin = useUserStore(
    (s) => s.user?.id === ADMIN_ID || s.user?.email === ADMIN_EMAIL || s.user?.email === ADMIN_ID || s.userTier === "MASTER"
  );
  const addToast = useToastStore((state) => state.addToast);
  const [isEditingCctv, setIsEditingCctv] = reactExports.useState(false);
  const [editYoutubeId, setEditYoutubeId] = reactExports.useState("");
  const [isSavingCctv, setIsSavingCctv] = reactExports.useState(false);
  const [showCatchModal, setShowCatchModal] = reactExports.useState(false);
  const [mofTimestamp, setMofTimestamp] = reactExports.useState(Date.now());
  reactExports.useEffect(() => {
    if (cctvData?.type !== "mof")
      return;
    const interval = setInterval(() => {
      setMofTimestamp(Date.now());
    }, 1500);
    return () => clearInterval(interval);
  }, [cctvData?.type]);
  const saveCctvOverride = reactExports.useCallback(async () => {
    if (!editYoutubeId.trim())
      return;
    const finalYoutubeId = extractYoutubeId(editYoutubeId.trim());
    const sid = selectedPoint.obsCode || "DT_0001";
    try {
      setIsSavingCctv(true);
      const res = await apiClient.put(`/api/admin/cctv/${sid}`, {
        type: "youtube",
        youtubeId: finalYoutubeId,
        label: cctvData?.label || `${selectedPoint.name} 수동업데이트`
        // ✅ 7TH-C4: 한글 직접 표기
      });
      if (res.data.success) {
        addToast("✅ CCTV 링크가 정상적으로 수정되었습니다.", "success");
        setIsEditingCctv(false);
        setCctvLoading(true);
        const cctvResp = await apiClient.get(`/api/weather/cctv?stationId=${sid}`);
        setCctvData(cctvResp.data);
      } else {
        addToast(res.data.error || "수정에 실패했습니다.", "error");
      }
    } catch (err) {
      addToast("수정 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSavingCctv(false);
      setCctvLoading(false);
    }
  }, [editYoutubeId, selectedPoint, cctvData, addToast]);
  reactExports.useEffect(() => {
    if (!selectedPoint)
      return;
    const loadData = async () => {
      setLoading(true);
      setCctvLoading(true);
      const sid = selectedPoint.obsCode || "DT_0001";
      const keyword = selectedPoint.fish ? selectedPoint.fish.split(",")[0] + " 일람" : "낚시용품";
      const todayStr = (() => {
        const d = /* @__PURE__ */ new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}${m}${day}`;
      })();
      const cctvPromise = apiClient.get(`/api/weather/cctv?stationId=${sid}`).then((res) => {
        setCctvData(res.data);
      }).catch((err) => {
        if (false)
          console.error("CCTV Load Error:", err);
      }).finally(() => setCctvLoading(false));
      const shopPromise = apiClient.get(`/api/commerce/coupang/search?keyword=${encodeURIComponent(keyword)}&limit=3`).then((res) => {
        if (res.data?.products)
          setShoppingItems(res.data.products.slice(0, 3));
      }).catch((err) => {
        if (false)
          console.error("Shop Load Error:", err);
      });
      const marinePromise = apiClient.get(`/api/weather/precision?stationId=${sid}`).then((resp) => {
        setMarineData((prev) => ({ ...prev, ...resp.data, stationId: sid }));
      }).catch((err) => {
        if (false)
          console.error("Data Load Error:", err);
        const reg = selectedPoint.region || "남해";
        const profile = { "제주": 18.2, "남해": 16.5, "동해": 14.2, "서해": 11.8 };
        const baseSst = profile[reg] || 16;
        const seed = (parseInt(selectedPoint.id) % 10 - 5) / 10 || 0;
        const finalSst = (baseSst + seed).toFixed(1);
        setMarineData((prev) => ({
          ...prev,
          stationId: sid,
          sst: finalSst,
          temp: `${finalSst}°C`,
          layers: { upper: finalSst, middle: (finalSst - 1.2).toFixed(1), lower: (finalSst - 3.4).toFixed(1) },
          tide: { phase: "분석 중", high: "15:20", low: "08:42" },
          tide_predictions: [{ time: "14:20", type: "고조", level: 180 }]
        }));
      }).finally(() => setLoading(false));
      const tidePromise = fetchTideForecast(sid, todayStr).then((items) => {
        if (!items || items.length === 0)
          return;
        const predictions = items.map((item) => ({
          tph_time: item.hl_time || item.tph_time || "",
          hl_code: item.hl_code === "H" ? "고조" : "간조",
          tph_level: item.hl_level || item.tph_level || "",
          time: item.hl_time || "",
          type: item.hl_code === "H" ? "고조" : "간조",
          level: item.hl_level || ""
        }));
        setMarineData((prev) => ({
          ...prev,
          tide_predictions: predictions,
          tide: {
            ...prev.tide || {},
            phase: prev.tide?.phase || "조석 데이터",
            high: predictions.find((p) => p.hl_code === "고조")?.tph_time || prev.tide?.high || "-",
            low: predictions.find((p) => p.hl_code === "간조")?.tph_time || prev.tide?.low || "-"
          }
        }));
        if (false)
          console.info(`[BottomSheet] 조석예보 ${predictions.length}건 로드 완료`);
      }).catch((err) => {
        if (false)
          console.warn("[BottomSheet] 조석예보 실패:", err);
      });
      const waterTempPromise = fetchWaterTemp(sid, todayStr).then((temp) => {
        if (temp && temp !== "-") {
          setMarineData((prev) => ({ ...prev, waterTemp: temp, sst: temp }));
          if (false)
            console.info(`[BottomSheet] 실측 수온 ${temp}°C 로드 완료`);
        }
      }).catch((err) => {
        if (false)
          console.warn("[BottomSheet] 수온 실패:", err);
      });
      const fishingIdxPromise = fetchFishingIndex(sid).then((items) => {
        if (!items || items.length === 0)
          return;
        const today = items[0];
        const gradeMap = { "1": "매우좋음", "2": "좋음", "3": "보통", "4": "나쁨", "5": "매우나쁨" };
        const idx = today?.fishing_idx || today?.fishingIdx || "";
        const grade = today?.fishing_grade || gradeMap[idx] || idx;
        setMarineData((prev) => ({
          ...prev,
          fishingIndex: {
            등급: grade,
            수온: today?.wt ? `${today.wt}°C` : "-",
            파고: today?.wh ? `${today.wh}m` : "-",
            조류: today?.current_spd ? `${today.current_spd}m/s` : "-"
          }
        }));
        if (false)
          console.info(`[BottomSheet] 낚시지수 ${grade} 로드 완료`);
      }).catch((err) => {
        if (false)
          console.warn("[BottomSheet] 낚시지수 실패:", err);
      });
      await Promise.allSettled([marinePromise, cctvPromise, shopPromise, tidePromise, waterTempPromise, fishingIdxPromise]);
      setBizLoading(true);
      const regionKey = (selectedPoint.region || "").split(" ")[0];
      apiClient.get(`/api/community/business?region=${encodeURIComponent(regionKey)}&limit=3`).then((res) => {
        setBusinessPosts(Array.isArray(res.data) ? res.data : []);
      }).catch(() => setBusinessPosts([])).finally(() => setBizLoading(false));
    };
    loadData();
  }, [selectedPoint?.id]);
  if (!selectedPoint)
    return null;
  const fishingCondition = reactExports.useMemo(
    () => evaluateFishingCondition(marineData, selectedPoint),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [marineData, selectedPoint]
  );
  reactExports.useEffect(() => {
    if (fishingCondition && selectedPoint?.id && onConditionReady) {
      onConditionReady(fishingCondition, selectedPoint.id);
    }
  }, [fishingCondition, selectedPoint?.id]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "0", backgroundColor: "#fff", borderRadius: "24px 24px 0 0", height: "100%" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontSize: "1.4rem", margin: 0, fontWeight: "900", color: "#1A1A2E" }, children: selectedPoint.name }),
      onClose && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, style: { background: "#F0F2F7", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontWeight: "bold" }, children: "✕" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "0 20px 100px" }, children: [
      selectedPoint.secret && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "20px", background: "linear-gradient(135deg, #1a1200, #2d1f00)", borderRadius: "20px", padding: "20px", border: "1.5px solid #B8860B", boxShadow: "0 0 24px rgba(255,215,0,0.18)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(20px * var(--fs, 1))` }, children: "⭐" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: "#FFD700", letterSpacing: "0.04em" }, children: "비밀포인트 정보" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { marginLeft: "auto", fontSize: `calc(11px * var(--fs, 1))`, background: "rgba(255,215,0,0.15)", color: "#FFD700", padding: "3px 10px", borderRadius: "20px", fontWeight: "800", border: "1px solid rgba(255,215,0,0.3)" }, children: "PREMIUM ONLY" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "14px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#B8860B", fontWeight: "900", marginBottom: "8px" }, children: "🎣 주요 조황 어종" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px" }, children: (selectedPoint.fish || "").split(",").map((f) => (
            // ✅ 17TH-B2: 인덱스 key → 어종명 key
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", color: "#FFD700", background: "rgba(255,215,0,0.12)", padding: "4px 10px", borderRadius: "20px", border: "1px solid rgba(255,215,0,0.25)" }, children: f.trim() }, f.trim())
          )) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "14px", background: "rgba(255,215,0,0.06)", borderRadius: "12px", padding: "14px", border: "1px solid rgba(255,215,0,0.15)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#B8860B", fontWeight: "900", marginBottom: "8px" }, children: "💡 현지 고수 실전 팁" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#FFE066", fontWeight: "700", lineHeight: "1.7", whiteSpace: "pre-wrap" }, children: selectedPoint.tip })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "12px", border: "1px solid rgba(255,255,255,0.08)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#B8860B", fontWeight: "900", marginBottom: "6px" }, children: "🗺️ 접근 방법" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#ccc", fontWeight: "700", lineHeight: "1.6" }, children: selectedPoint.access })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", height: "230px", backgroundColor: "#0A0A0F", borderRadius: "18px", overflow: "hidden", marginBottom: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }, children: [
        isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => {
              setIsEditingCctv(!isEditingCctv);
              if (!isEditingCctv)
                setEditYoutubeId(cctvData?.youtubeId || "");
            },
            style: { position: "absolute", top: "12px", right: "12px", background: "rgba(255,215,0,0.9)", color: "#000", fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "900", padding: "6px 10px", borderRadius: "8px", zIndex: 40, cursor: "pointer", border: "none", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" },
            children: [
              "🔄 ",
              isEditingCctv ? "수정 닫기" : `마스터 편집 (${cctvData?.youtubeId || "미등록"})`
            ]
          }
        ),
        isAdmin && isEditingCctv && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)", zIndex: 30, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#FFD700", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", marginBottom: "16px" }, children: [
            "🛠 [",
            selectedPoint.name,
            "] 실시간 유튜브 영상 ID 교체"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: editYoutubeId,
              onChange: (e) => setEditYoutubeId(e.target.value),
              placeholder: "YouTube URL 뒤 11자리 (예: jfKfPfyJRdk)",
              style: { width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #FFD700", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "800", marginBottom: "16px", textAlign: "center", outline: "none" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "10px", width: "100%" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setIsEditingCctv(false),
                style: { flex: 1, padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", cursor: "pointer", fontWeight: "800" },
                children: "취소"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: saveCctvOverride,
                disabled: isSavingCctv,
                style: { flex: 2, padding: "12px", borderRadius: "10px", background: "linear-gradient(135deg, #FFD700, #FFA000)", color: "#000", border: "none", cursor: "pointer", fontWeight: "900", opacity: isSavingCctv ? 0.6 : 1 },
                children: isSavingCctv ? "업데이트 중..." : "즉시 적용 및 재생"
              }
            )
          ] })
        ] }),
        !canAccessPremium && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", inset: 0, backdropFilter: "blur(10px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, background: "rgba(10,10,15,0.7)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(32px * var(--fs, 1))`, marginBottom: "12px", filter: "drop-shadow(0 2px 8px rgba(255,255,255,0.2))" }, children: "🔐" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(16px * var(--fs, 1))`, color: "#fff", fontWeight: "950", marginBottom: "8px" }, children: "LITE 플랜 이상 전용 영상" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#aaa", fontWeight: "600", marginBottom: "20px", textAlign: "center", padding: "0 20px" }, children: [
            "현장의 파도와 분위기를 1초 단위로 ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            " 파악할 수 있는 인라인 라이브 시스템입니다."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => navigate("/vvip-subscribe"),
              style: { background: "linear-gradient(135deg, #FF3B30, #D32F2F)", color: "#fff", border: "none", borderRadius: "30px", padding: "10px 28px", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "950", cursor: "pointer", boxShadow: "0 6px 20px rgba(255,59,48,0.4)" },
              children: "LITE 플랜 업그레이드"
            }
          )
        ] }),
        cctvLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "32px", height: "32px", border: "3px solid #FF3B30", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#fff", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800" }, children: "📡 대상어 현장 영상 연결 중..." })
        ] }) : cctvData ? cctvData.type === "youtube" && cctvData.url ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { width: "100%", height: "100%", position: "relative" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "iframe",
            {
              src: cctvData.url,
              allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
              allowFullScreen: true,
              style: { width: "100%", height: "100%", border: "none" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => window.open(`https://www.youtube.com/watch?v=${cctvData.youtubeId}`, "_blank"),
              style: { position: "absolute", bottom: "12px", right: "12px", background: "rgba(255,0,0,0.85)", color: "#fff", border: "none", borderRadius: "20px", padding: "6px 12px", fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "900", cursor: "pointer", zIndex: 10, backdropFilter: "blur(4px)", display: "flex", alignItems: "center", gap: "4px", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M10 15l5.19-3-5.19-3v6zm11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" }) }),
                "앱으로 보기"
              ]
            }
          )
        ] }) : cctvData.fallbackImg ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { width: "100%", height: "100%", position: "relative" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: cctvData.type === "mof" ? `${API_BASE}${cctvData.fallbackImg}?t=${mofTimestamp}` : cctvData.fallbackImg,
              alt: cctvData.areaName,
              style: { width: "100%", height: "100%", objectFit: "cover" },
              onError: (e) => {
                if (cctvData.safeFallbackImg && e.target.src !== cctvData.safeFallbackImg) {
                  e.target.src = cctvData.safeFallbackImg;
                } else {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                }
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", bottom: "60px", left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 8px", color: "#fff", fontSize: `calc(13px * var(--fs, 1))`, fontFamily: "monospace", textShadow: "1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)", fontWeight: "bold", zIndex: 5 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#ff4444" }, children: "● REC" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "MOF_",
              selectedPoint?.obsCode
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", bottom: 0, left: 0, right: 0, padding: "36px 16px 12px", background: "linear-gradient(transparent, rgba(0,0,0,0.95))", zIndex: 6 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#00D1FF", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "900", display: "flex", alignItems: "center", gap: "4px" }, children: "🌊 해양수산부 공식 실시간 연안 모니터링" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#fff", fontSize: `calc(10px * var(--fs, 1))`, marginTop: "4px", fontWeight: "600", opacity: 0.8 }, children: "현장의 파고 및 연안침식 상태를 파악할 수 있는 해양수산부 공식 뷰어 시스템과 연동되어 있습니다." })
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#888", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700" }, children: "현재 송출 가능한 영상이 없습니다." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#888", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700" }, children: "시스템 오류 (데이터를 불러올 수 없습니다.)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", top: "14px", left: "14px", background: "rgba(230,0,0,0.95)", color: "#fff", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "950", padding: "5px 10px", borderRadius: "8px", zIndex: 5, display: "flex", alignItems: "center", boxShadow: "0 4px 12px rgba(230,0,0,0.5)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { display: "inline-block", width: "5px", height: "5px", background: "#fff", borderRadius: "50%", marginRight: "6px", animation: "pulse 1.2s infinite" } }),
          "L I V E"
        ] }),
        cctvData?.areaName && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", top: "14px", right: "14px", background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800", padding: "5px 10px", borderRadius: "8px", backdropFilter: "blur(8px)", zIndex: 5, border: "1px solid rgba(255,255,255,0.1)" }, children: [
          "📍 ",
          cctvData.areaName
        ] })
      ] }),
      loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "40px 20px", textAlign: "center", color: "#888", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "28px", height: "28px", border: "3px solid #1565C0", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "bold" }, children: "해양 데이터를 분석 중입니다..." })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "12px" }, children: [
        (() => {
          const cond = fishingCondition;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#fff", border: `2px solid ${cond.color}`, borderRadius: "20px", padding: "20px", marginBottom: "10px", boxShadow: `0 8px 24px ${cond.color}20`, position: "relative", overflow: "hidden" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "950", color: "#fff", background: cond.color, padding: "4px 12px", borderRadius: "30px", letterSpacing: "-0.02em", boxShadow: `0 2px 8px ${cond.color}40` }, children: "AI 낚시 컨디션" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(38px * var(--fs, 1))`, fontWeight: "950", color: cond.color, lineHeight: 1, letterSpacing: "-0.05em" }, children: [
                cond.score,
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "800" }, children: "점" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(17px * var(--fs, 1))`, fontWeight: "900", color: "#1A1A2E", marginBottom: "18px", lineHeight: 1.5, letterSpacing: "-0.04em", whiteSpace: "pre-line" }, children: [
              '"',
              cond.advice,
              '"'
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }, children: cond.tags.map((tag) => (
              // ✅ 17TH-B3: 인덱스 key → tag 값 key
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "800", color: cond.color, background: `${cond.color}10`, padding: "5px 10px", borderRadius: "10px", border: `1px solid ${cond.color}20` }, children: tag }, tag)
            )) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#F8F9FC", padding: "14px", borderRadius: "16px", border: "1px solid #F0F2F7", display: "flex", gap: "10px", alignItems: "start" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(20px * var(--fs, 1))`, flexShrink: 0 }, children: "🧰" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "900", color: "#8E8E93", marginBottom: "3px" }, children: "전문가 권장 채비" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12.5px * var(--fs, 1))`, fontWeight: "800", color: "#1A1A2E", lineHeight: 1.4 }, children: cond.gear })
              ] })
            ] }),
            Array.isArray(shoppingItems) && shoppingItems.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "14px", paddingTop: "14px", borderTop: "1px dashed rgba(0,0,0,0.06)" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "900", color: "#8E8E93", marginBottom: "10px", display: "flex", alignItems: "center", gap: "4px" }, children: "🛒 이 포인트 권장 채비 쇼핑" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "8px", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "4px" }, children: shoppingItems.map((item, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  onClick: () => window.open(item.link || item.coupangUrl, "_blank"),
                  style: {
                    minWidth: "120px",
                    width: "120px",
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    padding: "8px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                    border: "1px solid #EBF2FF",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "transform 0.15s"
                  },
                  onMouseOver: (e) => e.currentTarget.style.transform = "translateY(-2px)",
                  onMouseOut: (e) => e.currentTarget.style.transform = "none",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "img",
                      {
                        src: item.img || item.productImage,
                        alt: item.name || item.productName || "낚시용품",
                        style: { width: "100%", height: "80px", objectFit: "cover", borderRadius: "8px", marginBottom: "8px" },
                        onError: (e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = "none";
                        }
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800", color: "#1A1A2E", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.3, marginBottom: "6px", height: "26px" }, children: item.name || item.productName }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "950", color: "#E65100" }, children: item.price || `${(Number(item.productPrice) || 0).toLocaleString()}원` }) })
                  ]
                },
                item.productId || item.link || idx
              )) })
            ] })
          ] });
        })(),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", backgroundColor: "#F4F6FA", padding: "16px", borderRadius: "12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: "800", color: "#555" }, children: "현재 실측 수온" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#0056D2", fontWeight: "900", fontSize: `calc(18px * var(--fs, 1))` }, children: [
            marineData.sst || marineData.waterTemp || "-",
            "°C"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#F4F6FA", padding: "16px", borderRadius: "12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: "900", display: "block", marginBottom: "12px", color: "#333" }, children: "층별 수온 정보 (상/중/저)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "8px" }, children: [
            { label: "상층", val: marineData.sst || marineData.waterTemp || "-", color: "#64B5F6" },
            { label: "중층", val: marineData.sst ? (parseFloat(marineData.sst) - 1.2).toFixed(1) : "-", color: "#42A5F5" },
            { label: "저층", val: marineData.sst ? (parseFloat(marineData.sst) - 3.4).toFixed(1) : "-", color: "#1E88E5" }
          ].map((l) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, backgroundColor: "#fff", padding: "10px 6px", borderRadius: "10px", textAlign: "center", border: "1.5px solid #F0F2F7" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800", color: "#8E8E93", marginBottom: "4px" }, children: l.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "950", color: l.color }, children: l.val !== "-" ? `${l.val}°C` : "-" })
          ] }, l.label)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#F4F6FA", padding: "16px", borderRadius: "12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: "900", display: "block", marginBottom: "12px", color: "#333" }, children: "오늘의 물때 (만조/간조)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { style: { listStyle: "none", padding: 0, margin: 0, fontSize: "0.95rem", color: "#555" }, children: marineData.tide && (marineData.tide.phase || marineData.tide_predictions) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "800", borderBottom: "1px solid #ddd", paddingBottom: "4px", marginBottom: "4px" }, children: marineData.tide.phase || "조석 분석 중" }),
            marineData.tide_predictions && marineData.tide_predictions.slice(0, 4).map((t, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { style: { display: "flex", justifyContent: "space-between", fontSize: `calc(13px * var(--fs, 1))` }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: "700" }, children: t.tph_time || t.time }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: (t.hl_code || t.type) === "고조" ? "#E65100" : "#1565C0", fontWeight: "800" }, children: [
                (t.hl_code || t.type) === "고조" ? "▲ 만조" : "▼ 간조",
                " : ",
                t.tph_level || t.level,
                "cm"
              ] })
            ] }, idx))
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("li", { style: { color: "#888", fontSize: `calc(13px * var(--fs, 1))` }, children: "현장 물때 데이터를 실시간 분석 중입니다." }) })
        ] }),
        marineData.fishingIndex && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#F4F6FA", padding: "16px", borderRadius: "12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: "900", display: "block", marginBottom: "8px", color: "#333" }, children: "바다 낚시지수" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "0.9rem", color: "#555", lineHeight: 1.6 }, children: typeof marineData.fishingIndex === "object" ? Object.entries(marineData.fishingIndex).map(([k, v]) => `${k}: ${v}`).join(" · ") : String(marineData.fishingIndex) })
        ] }),
        false,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(18px * var(--fs, 1))` }, children: "🚢" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "950", color: "#1A1A2E", letterSpacing: "-0.03em" }, children: "이 구역 선상배 예약" }),
              selectedPoint.region && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800", background: "#EBF2FF", color: "#1565C0", padding: "3px 8px", borderRadius: "20px" }, children: (selectedPoint.region || "").split(" ")[0] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => navigate("/community"), style: { background: "none", border: "none", fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "800", color: "#8E8E93", cursor: "pointer" }, children: "전체보기 →" })
          ] }),
          bizLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", gap: "10px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "20px", height: "20px", border: "2.5px solid #1565C0", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "700" }, children: "선상배 정보 불러오는 중..." })
          ] }) : businessPosts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg, #F8F9FC, #F0F4FF)", borderRadius: "16px", padding: "24px", textAlign: "center", border: "1.5px dashed #D0D8F0" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(28px * var(--fs, 1))`, marginBottom: "8px" }, children: "⚓" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", color: "#8E8E93" }, children: "이 구역 등록된 선상배가 없습니다" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#AAB0BE", fontWeight: "600", marginTop: "4px" }, children: "VVIP 구독 후 내 선상을 등록해보세요!" })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexDirection: "column", gap: "10px" }, children: businessPosts.map((biz, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              style: {
                position: "relative",
                background: biz.isPinned ? "linear-gradient(135deg, #1a1200 0%, #2d1f00 50%, #1a1200 100%)" : "#fff",
                border: biz.isPinned ? "1.5px solid #B8860B" : "1.5px solid #F0F2F7",
                borderRadius: "18px",
                padding: "16px",
                boxShadow: biz.isPinned ? "0 8px 28px rgba(255,215,0,0.18)" : "0 4px 16px rgba(0,0,0,0.05)",
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.18s"
              },
              onMouseEnter: (e) => e.currentTarget.style.transform = "translateY(-2px)",
              onMouseLeave: (e) => e.currentTarget.style.transform = "none",
              onClick: () => navigate("/community"),
              children: [
                biz.isPinned && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", background: "radial-gradient(circle, rgba(255,215,0,0.12) 0%, transparent 70%)", pointerEvents: "none" } }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }, children: [
                  biz.isPinned ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", background: "linear-gradient(135deg, #FFD700, #FFA000)", color: "#000", padding: "3px 10px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "4px", boxShadow: "0 2px 8px rgba(255,215,0,0.4)" }, children: "👑 VVIP 협력 선상" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800", background: "#EBF2FF", color: "#1565C0", padding: "3px 10px", borderRadius: "20px" }, children: "🚢 선상배 홍보" }),
                  biz.region && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "700", color: biz.isPinned ? "#FFD700" : "#8E8E93" }, children: [
                    "📍 ",
                    biz.region
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "12px", alignItems: "flex-start" }, children: [
                  biz.cover ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "img",
                    {
                      src: biz.cover,
                      alt: biz.shipName,
                      style: { width: "72px", height: "72px", borderRadius: "12px", objectFit: "cover", flexShrink: 0, border: biz.isPinned ? "2px solid #B8860B" : "1px solid #F0F2F7" },
                      onError: (e) => {
                        e.target.style.display = "none";
                      }
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "72px", height: "72px", borderRadius: "12px", flexShrink: 0, background: biz.isPinned ? "rgba(255,215,0,0.12)" : "#F4F6FA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: `calc(28px * var(--fs, 1))`, border: biz.isPinned ? "2px solid rgba(255,215,0,0.3)" : "1.5px solid #F0F2F7" }, children: "⛵" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "950", color: biz.isPinned ? "#FFE066" : "#1A1A2E", marginBottom: "4px", letterSpacing: "-0.03em" }, children: biz.shipName }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "700", color: biz.isPinned ? "#B8860B" : "#8E8E93", marginBottom: "8px" }, children: [
                      biz.type,
                      " · ",
                      biz.target
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: "5px" }, children: [
                      biz.date && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800", background: biz.isPinned ? "rgba(255,215,0,0.12)" : "#F4F6FA", color: biz.isPinned ? "#FFD700" : "#555", padding: "3px 8px", borderRadius: "8px" }, children: [
                        "📅 ",
                        biz.date
                      ] }),
                      biz.price && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", background: biz.isPinned ? "rgba(255,165,0,0.15)" : "#FFF4E5", color: biz.isPinned ? "#FFA500" : "#E65100", padding: "3px 8px", borderRadius: "8px" }, children: [
                        "💰 ",
                        typeof biz.price === "number" ? `${biz.price.toLocaleString()}원` : biz.price
                      ] })
                    ] })
                  ] })
                ] }),
                biz.content && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: "10px", fontSize: `calc(12px * var(--fs, 1))`, color: biz.isPinned ? "rgba(255,230,100,0.8)" : "#666", fontWeight: "600", lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }, children: biz.content }),
                biz.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    onClick: (e) => {
                      e.stopPropagation();
                      window.location.href = `sms:${biz.phone.replace(/-/g, "")}?body=${encodeURIComponent(`[낚시GO] ${biz.shipName} 선상 예약 문의합니다.`)}`;
                    },
                    style: {
                      marginTop: "12px",
                      background: biz.isPinned ? "linear-gradient(135deg, #FFD700, #FFA000)" : "linear-gradient(135deg, #1565C0, #0D47A1)",
                      color: biz.isPinned ? "#000" : "#fff",
                      borderRadius: "12px",
                      padding: "10px 0",
                      textAlign: "center",
                      fontSize: `calc(12px * var(--fs, 1))`,
                      fontWeight: "950",
                      cursor: "pointer",
                      letterSpacing: "-0.02em",
                      boxShadow: biz.isPinned ? "0 4px 16px rgba(255,215,0,0.35)" : "0 4px 16px rgba(21,101,192,0.3)"
                    },
                    children: [
                      "📲 ",
                      biz.phone,
                      " · 문자로 예약하기"
                    ]
                  }
                )
              ]
            },
            String(biz._id || biz.id || idx)
          )) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(NativeAd, { style: { marginTop: "4px", marginBottom: "0" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #F0F0F5" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "950", color: "#1c1c1e", marginBottom: "10px" }, children: "🎣 이 포인트에서 잡으셨나요?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => {
                if (!user || user.email === "guest@fishinggo.com") {
                  addToast("조과 기록은 로그인 후 이용 가능합니다.", "error");
                  navigate("/login");
                  return;
                }
                setShowCatchModal(true);
              },
              style: {
                width: "100%",
                padding: "15px",
                background: "linear-gradient(135deg, #00C48C, #00897B)",
                color: "#fff",
                border: "none",
                borderRadius: "16px",
                fontWeight: "950",
                fontSize: `calc(15px * var(--fs, 1))`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 6px 20px rgba(0,196,140,0.35)",
                letterSpacing: "-0.02em"
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(18px * var(--fs, 1))` }, children: "🎣" }),
                "조과 기록 남기기"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "600", textAlign: "center", marginTop: "8px" }, children: "기록은 마이페이지 조과통계에 자동 반영됩니다" })
        ] })
      ] })
    ] }),
    showCatchModal && /* @__PURE__ */ jsxRuntimeExports.jsx(
      CatchRecordModal,
      {
        point: selectedPoint,
        user,
        onClose: () => setShowCatchModal(false),
        onSuccess: () => {
        }
      }
    )
  ] });
}

const CATEGORIES = ["일반 문의", "서비스 오류", "결제/구독", "계정 문의", "건의사항", "신고/제재", "기타"];
const TEMPLATE = `[문의 기본 양식]

• 문의 유형: 
• 발생 일시: 
• 기기/환경: 

[문의 내용]
(구체적으로 작성해주세요)

[기대하는 처리 결과]
`;
const STATUS_CONFIG = {
  pending: { label: "답변 대기", color: "#FF9B26", bg: "#FFF3E0", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 11 }) },
  answered: { label: "답변 완료", color: "#00C48C", bg: "#E8F5E9", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 11 }) },
  closed: { label: "처리 완료", color: "#8E8E93", bg: "#F5F5F5", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 11 }) }
};
function CsInquirySection({ user, isAdmin }) {
  const addToast = useToastStore((s) => s.addToast);
  const [open, setOpen] = reactExports.useState(false);
  const [tab, setTab] = reactExports.useState(isAdmin ? "list" : "write");
  const [loading, setLoading] = reactExports.useState(false);
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [inquiries, setInquiries] = reactExports.useState([]);
  const [expandedId, setExpandedId] = reactExports.useState(null);
  const [replyInput, setReplyInput] = reactExports.useState("");
  const [replyingId, setReplyingId] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState({
    realName: user?.realName || "",
    nickname: user?.name || "",
    phone: user?.phone || "",
    category: "일반 문의",
    title: "",
    content: TEMPLATE
  });
  reactExports.useEffect(() => {
    if (user)
      setForm((f) => ({
        ...f,
        realName: f.realName || user.realName || "",
        nickname: f.nickname || user.name || "",
        phone: f.phone || user.phone || ""
      }));
  }, [user]);
  const fetchInquiries = reactExports.useCallback(async () => {
    if (!user?.email || user.id === "GUEST")
      return;
    setLoading(true);
    try {
      const res = await apiClient.get("/api/cs/inquiries");
      setInquiries(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (err.response?.status !== 401)
        addToast("문의 목록 로드 실패", "error");
    } finally {
      setLoading(false);
    }
  }, [user?.email, addToast]);
  reactExports.useEffect(() => {
    if (open && tab === "list") {
      fetchInquiries();
      const id = setInterval(fetchInquiries, 6e4);
      return () => clearInterval(id);
    }
  }, [open, tab, fetchInquiries]);
  const handleSubmit = async () => {
    if (!user || user.id === "GUEST") {
      addToast("로그인이 필요합니다.", "error");
      return;
    }
    if (!form.title.trim()) {
      addToast("제목을 입력해주세요.", "error");
      return;
    }
    if (!form.content.trim() || form.content.trim() === TEMPLATE.trim()) {
      addToast("문의 내용을 작성해주세요.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post("/api/cs/inquiry", form);
      addToast(res.data.message || "문의가 접수되었습니다.", "success");
      setForm((f) => ({ ...f, title: "", content: TEMPLATE }));
      setTab("list");
      fetchInquiries();
    } catch (err) {
      addToast(err.response?.data?.error || "문의 등록 실패", "error");
    } finally {
      setSubmitting(false);
    }
  };
  const handleReply = async (id) => {
    if (!replyInput.trim()) {
      addToast("답변 내용을 입력해주세요.", "error");
      return;
    }
    try {
      await apiClient.put(`/api/cs/inquiry/${id}/reply`, { reply: replyInput });
      addToast("답변이 등록되었습니다.", "success");
      setReplyInput("");
      setReplyingId(null);
      fetchInquiries();
    } catch (err) {
      addToast(err.response?.data?.error || "답변 등록 실패", "error");
    }
  };
  const inp = (field) => ({ value: form[field], onChange: (e) => setForm((f) => ({ ...f, [field]: e.target.value })) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "4px 16px 20px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        onClick: () => setOpen((o) => !o),
        style: { background: "linear-gradient(135deg, #0056D2 0%, #003fa3 100%)", borderRadius: open ? "18px 18px 0 0" : "18px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", transition: "border-radius 0.25s" },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "38px", height: "38px", background: "rgba(255,255,255,0.15)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { size: 20, color: "#fff" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: "#fff" }, children: "1:1 고객센터 문의" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.65)", fontWeight: "600", marginTop: "1px" }, children: "🔒 비밀글 보호 · 빠른 답변 보장" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px" }, children: [
            inquiries.filter((i) => i.status === "answered").length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { background: "#00C48C", color: "#fff", fontSize: `calc(9px * var(--fs, 1))`, fontWeight: "900", padding: "2px 7px", borderRadius: "20px" }, children: [
              "답변 ",
              inquiries.filter((i) => i.status === "answered").length,
              "건"
            ] }),
            open ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { size: 18, color: "rgba(255,255,255,0.8)" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 18, color: "rgba(255,255,255,0.8)" })
          ] })
        ]
      }
    ),
    open && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "0 0 18px 18px", border: "1px solid #E8EDF5", borderTop: "none", overflow: "hidden" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", borderBottom: "1px solid #F0F2F7" }, children: (isAdmin ? ["list"] : ["write", "list"]).map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setTab(t), style: { flex: 1, padding: "12px", background: "none", border: "none", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "900", color: tab === t ? "#0056D2" : "#AEAEB2", borderBottom: tab === t ? "2px solid #0056D2" : "2px solid transparent", cursor: "pointer", transition: "all 0.15s" }, children: t === "write" ? "✏️ 문의 작성" : `📋 ${isAdmin ? "전체 문의" : "내 문의"}${inquiries.length > 0 ? ` (${inquiries.length})` : ""}` }, t)) }),
      isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "10px 14px", background: "#FFF8E1", borderBottom: "1px solid #FFE082", fontSize: `calc(11px * var(--fs, 1))`, color: "#F57F17", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }, children: [
        "⚙️ 관리자 답변은 ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "수익 대시보드 → 1:1 고객문의 관리" }),
        "에서 전담 처리합니다."
      ] }),
      tab === "write" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#F0F5FF", borderRadius: "12px", padding: "10px 14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { size: 13, color: "#0056D2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#0056D2", fontWeight: "700" }, children: "이 문의는 작성자 본인과 관리자만 볼 수 있는 비밀글입니다." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: labelStyle, children: "성함" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { style: inputStyle, placeholder: "홍길동", ...inp("realName") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: labelStyle, children: "닉네임" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { style: inputStyle, placeholder: "앱 닉네임", ...inp("nickname") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: labelStyle, children: "연락처" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { style: inputStyle, placeholder: "010-XXXX-XXXX", type: "tel", ...inp("phone") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: labelStyle, children: "문의 유형" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { style: { ...inputStyle, background: "#FAFAFA" }, value: form.category, onChange: (e) => setForm((f) => ({ ...f, category: e.target.value })), children: CATEGORIES.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: c, children: c }, c)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: labelStyle, children: "제목 *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { style: inputStyle, placeholder: "문의 제목을 입력해주세요", ...inp("title"), maxLength: 100 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "14px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { ...labelStyle, display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "문의 내용 *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontWeight: "600", color: "#AEAEB2" }, children: [
              form.content.length,
              "자"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              style: { ...inputStyle, height: "180px", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 },
              placeholder: "기본 양식을 참고하여 작성해주세요",
              ...inp("content")
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: handleSubmit,
            disabled: submitting,
            style: { width: "100%", padding: "14px", background: submitting ? "#AEAEB2" : "linear-gradient(135deg, #0056D2, #003fa3)", color: "#fff", border: "none", borderRadius: "14px", fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "900", cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 16 }),
              " ",
              submitting ? "제출 중..." : "문의 접수하기"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#AEAEB2", textAlign: "center", marginTop: "10px", fontWeight: "600" }, children: "※ 영업일 기준 1~2일 내 답변 | 긴급 문의: 앱 내 알림 확인" })
      ] }),
      tab === "list" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "900", color: "#1A1A2E" }, children: isAdmin ? `전체 문의 (${inquiries.length}건)` : `내 문의 내역 (${inquiries.length}건)` }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: fetchInquiries, style: { background: "none", border: "none", cursor: "pointer", color: "#0056D2", display: "flex", alignItems: "center", gap: "4px", fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "800" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 13 }),
            " 새로고침"
          ] })
        ] }),
        loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "30px", color: "#AEAEB2", fontSize: `calc(12px * var(--fs, 1))` }, children: "불러오는 중..." }) : inquiries.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "30px", color: "#AEAEB2", fontSize: `calc(12px * var(--fs, 1))`, border: "1px dashed #E0E0E0", borderRadius: "12px" }, children: [
          "📭 등록된 문의가 없습니다.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setTab("write"), style: { marginTop: "8px", background: "none", border: "none", color: "#0056D2", fontWeight: "800", cursor: "pointer", fontSize: `calc(12px * var(--fs, 1))` }, children: "첫 문의 작성하기 →" })
        ] }) : inquiries.map((item) => {
          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
          const isExpanded = expandedId === item.id;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { border: `1px solid ${item.status === "answered" ? "#C8F0E0" : "#F0F2F7"}`, borderRadius: "14px", marginBottom: "10px", overflow: "hidden", transition: "all 0.2s" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: () => setExpandedId(isExpanded ? null : item.id), style: { padding: "12px 14px", cursor: "pointer", background: item.status === "answered" ? "#F0FDF8" : "#FAFAFA", display: "flex", alignItems: "flex-start", gap: "10px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", flexWrap: "wrap" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, background: "#E8F0FF", color: "#0056D2", padding: "2px 7px", borderRadius: "6px", fontWeight: "800" }, children: item.category }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, background: cfg.bg, color: cfg.color, padding: "2px 7px", borderRadius: "6px", fontWeight: "800", display: "flex", alignItems: "center", gap: "3px" }, children: [
                    cfg.icon,
                    cfg.label
                  ] }),
                  isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, color: "#AEAEB2", fontWeight: "700" }, children: item.nickname || item.authorEmail })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: "#1A1A2E" }, children: item.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#AEAEB2", fontWeight: "600", marginTop: "3px" }, children: [
                  new Date(item.createdAt).toLocaleDateString("ko-KR"),
                  " · ",
                  item.id
                ] })
              ] }),
              isExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { size: 16, color: "#AEAEB2" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 16, color: "#AEAEB2" })
            ] }),
            isExpanded && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "14px", borderTop: "1px solid #F0F2F7" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#F8F9FA", borderRadius: "10px", padding: "12px", marginBottom: "10px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800", color: "#0056D2", marginBottom: "6px" }, children: "📝 문의 내용" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#444", fontFamily: "inherit", whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.6 }, children: item.content }),
                (item.realName || item.phone) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #E8EDF5", fontSize: `calc(10px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "700" }, children: [
                  item.realName && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    "성함: ",
                    item.realName,
                    " · "
                  ] }),
                  item.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    "연락처: ",
                    item.phone
                  ] })
                ] })
              ] }),
              item.reply && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg, #E8F5E9, #F1F8FF)", borderRadius: "10px", padding: "12px", marginBottom: "10px", border: "1px solid #C8F0E0" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800", color: "#00C48C", marginBottom: "6px" }, children: [
                  "✅ 관리자 답변 · ",
                  new Date(item.repliedAt).toLocaleDateString("ko-KR")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#1A1A2E", fontFamily: "inherit", whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.6 }, children: item.reply })
              ] }),
              isAdmin && item.status !== "answered" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: replyingId === item.id ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "textarea",
                  {
                    value: replyInput,
                    onChange: (e) => setReplyInput(e.target.value),
                    placeholder: "답변 내용을 입력하세요...",
                    style: { width: "100%", minHeight: "100px", padding: "10px", borderRadius: "10px", border: "1px solid #D1D5DB", fontSize: `calc(12px * var(--fs, 1))`, fontFamily: "inherit", lineHeight: 1.6, outline: "none", boxSizing: "border-box", resize: "vertical" }
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px", marginTop: "8px" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleReply(item.id), style: { flex: 1, padding: "10px", background: "#00C48C", color: "#fff", border: "none", borderRadius: "10px", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "900", cursor: "pointer" }, children: "답변 등록" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
                    setReplyingId(null);
                    setReplyInput("");
                  }, style: { padding: "10px 14px", background: "#F5F5F5", border: "none", borderRadius: "10px", fontSize: `calc(12px * var(--fs, 1))`, cursor: "pointer" }, children: "취소" })
                ] })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setReplyingId(item.id), style: { width: "100%", padding: "10px", background: "linear-gradient(135deg, #0056D2, #003fa3)", color: "#fff", border: "none", borderRadius: "10px", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "900", cursor: "pointer" }, children: "💬 답변 작성하기" }) })
            ] })
          ] }, item.id);
        })
      ] })
    ] })
  ] });
}
const labelStyle = { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "800", color: "#6B7280", display: "block", marginBottom: "4px", letterSpacing: "0.03em" };
const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #E5E7EB", fontSize: `calc(13px * var(--fs, 1))`, outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border 0.2s" };

function CctvModal({ cctvData, selectedPoint, onClose }) {
  if (!cctvData)
    return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 1200, display: "flex", flexDirection: "column" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.45)", fontWeight: "700", marginBottom: "2px", letterSpacing: "0.05em" }, children: [
          "📡 ",
          cctvData.label || "실시간 현장 영상"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "950", color: "#fff" }, children: selectedPoint?.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.4)", fontWeight: "600", marginTop: "2px" }, children: [
          cctvData.areaName,
          " · ",
          cctvData.region
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, style: { background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 18, color: "#fff" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }, children: (cctvData.type === "youtube" || cctvData.type === "iframe") && cctvData.url ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "100%", borderRadius: "16px", overflow: "hidden", aspectRatio: "16/9", position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "iframe",
      {
        src: cctvData.url,
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
        allowFullScreen: true,
        style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }
      }
    ) }) : cctvData.fallbackImg ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { width: "100%", borderRadius: "16px", overflow: "hidden", position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: cctvData.fallbackImg,
          alt: cctvData.areaName,
          style: { width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px", background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#FFD700", fontWeight: "800" }, children: "📷 현장 대표 이미지" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.6)", fontWeight: "600", marginTop: "2px" }, children: "실시간 스트리밍 준비 중 · 연결 시 자동 업데이트" })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", color: "rgba(255,255,255,0.4)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { size: 40, style: { margin: "0 auto 10px", display: "block" } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "700" }, children: "영상 준비 중입니다" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "12px 20px 30px", borderTop: "1px solid rgba(255,255,255,0.08)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.3)", fontWeight: "700", textAlign: "center" }, children: cctvData.type === "youtube" ? "📺 YouTube 라이브 스트리밍 연동 (지자체 공식 채널)" : cctvData.type === "iframe" ? "🔗 커스텀 스트림 연동 (관리자 직접 설정)" : "📡 지역 대표 해안 이미지 · 실시간 스트리밍 추가 예정" }) })
  ] });
}

function UpgradeModal({ onClose }) {
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      onClick: onClose,
      style: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1200, backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          onClick: (e) => e.stopPropagation(),
          style: { background: "linear-gradient(160deg, #0a0a1a 0%, #0d1b3e 100%)", borderRadius: "28px", padding: "32px 28px", width: "100%", maxWidth: "380px", border: "1.5px solid rgba(100,160,255,0.25)", boxShadow: "0 24px 80px rgba(0,86,210,0.35)" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", marginBottom: "24px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(48px * var(--fs, 1))`, marginBottom: "14px" }, children: "🔒" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(18px * var(--fs, 1))`, fontWeight: "950", color: "#fff", letterSpacing: "-0.04em", marginBottom: "8px" }, children: "오늘 무료 입장 3회 완료" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "rgba(255,255,255,0.55)", fontWeight: "600", lineHeight: 1.6 }, children: [
                "무료 플랜은 포인트 상세를 하루 3회까지 열람할 수 있어요.",
                /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { style: { color: "#64B5F6" }, children: "LITE 이상 플랜에서 무제한 입장" }),
                " 가능합니다."
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(100,160,255,0.08)", borderRadius: "16px", padding: "16px", marginBottom: "20px", border: "1px solid rgba(100,160,255,0.15)" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "900", color: "#64B5F6", marginBottom: "10px", letterSpacing: "0.04em" }, children: "⭐ LITE 플랜 혜택" }),
              [["🗺️ 포인트 상세", "무제한 입장"], ["📡 실시간 CCTV", "라이브 영상"], ["⭐ 비밀포인트", "황금 포인트 공개"], ["🔥 스마트 히트맵", "수온·조황 분석"]].map(([icon, desc]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "700", color: "#fff", marginBottom: "6px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: icon }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#00C48C" }, children: [
                  "✓ ",
                  desc
                ] })
              ] }, icon))
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => {
                  onClose();
                  navigate("/vvip-subscribe");
                },
                style: { width: "100%", padding: "15px", background: "linear-gradient(135deg, #1565C0, #0D47A1)", color: "#fff", border: "none", borderRadius: "16px", fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "950", cursor: "pointer", marginBottom: "10px", boxShadow: "0 8px 24px rgba(21,101,192,0.5)", letterSpacing: "-0.03em" },
                children: "🚀 LITE 플랜으로 업그레이드"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: onClose,
                style: { width: "100%", padding: "12px", background: "transparent", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700", cursor: "pointer" },
                children: "내일 다시 방문하기"
              }
            )
          ]
        }
      )
    }
  );
}

function DashboardView({
  viewMode,
  selectedPoint,
  tideData,
  precisionData,
  score,
  phase,
  isGolden,
  mainAdvice,
  alertAdvice,
  dynamicAlert,
  baitTip,
  scoreStyle,
  favorites,
  setViewMode,
  handlePointClick,
  canAccessPremium,
  showSecretPoints,
  setShowSecretPoints,
  addToast,
  weatherCache,
  PREMIUM_POINTS,
  recentPosts,
  user,
  isAdmin,
  currentTier,
  filter,
  setFilter,
  searchRef,
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
  showSearch,
  setShowSearch,
  handleSearch,
  DEFAULT_POINT,
  EMOJI_MAP,
  findNearestStation,
  evaluateFishingCondition,
  getPointSpecificData,
  setCctvData,
  setShowCCTV
}) {
  const navigate = useNavigate();
  const [showPointAdGate, setShowPointAdGate] = reactExports.useState(false);
  const [pendingPoint, setPendingPoint] = reactExports.useState(null);
  const [pointAdContext, setPointAdContext] = reactExports.useState("point");
  const [unlockedPoints, setUnlockedPoints] = reactExports.useState(() => /* @__PURE__ */ new Set());
  const handlePremiumPointClick = (point) => {
    if (canAccessPremium || unlockedPoints.has(point.id)) {
      setViewMode("map");
      handlePointClick(point);
      return;
    }
    setPendingPoint(point);
    setPointAdContext("point");
    setShowPointAdGate(true);
  };
  const handlePointAdComplete = () => {
    if (!pendingPoint)
      return;
    setUnlockedPoints((prev) => /* @__PURE__ */ new Set([...prev, pendingPoint.id]));
    addToast(`📍 ${pendingPoint.name} 포인트가 해제됐습니다! 🎉`, "success");
    if (pointAdContext === "secret") {
      setViewMode("map");
      setShowSecretPoints(true);
      addToast("⭐ 비밀 포인트 25곳이 지도에 표시됩니다!", "success");
    } else {
      setViewMode("map");
      handlePointClick(pendingPoint);
    }
    setPendingPoint(null);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: viewMode === "dashboard" ? "flex" : "none", flex: 1, flexDirection: "column", overflow: "hidden" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, overflowY: "auto", paddingBottom: "calc(90px + env(safe-area-inset-bottom, 0px))", scrollbarWidth: "none" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px 16px 0", position: "relative", zIndex: 50 }, ref: searchRef, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { height: "48px", backgroundColor: "#fff", borderRadius: "14px", display: "flex", alignItems: "center", padding: "0 16px", gap: "10px", border: "1.5px solid #EBF2FF", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 16, color: "#1565C0", strokeWidth: 3 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: searchQuery,
              onChange: (e) => handleSearch(e.target.value),
              onFocus: () => searchQuery && setShowSearch(true),
              placeholder: "포인트, 어종, 지역 검색하여 현재 화면에 반영",
              style: { border: "none", background: "none", fontSize: `calc(13.5px * var(--fs, 1))`, fontWeight: "800", outline: "none", width: "100%", color: "#1A1A2E" }
            }
          ),
          searchQuery && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
            setSearchQuery("");
            setSearchResults([]);
            setShowSearch(false);
          }, style: { background: "none", border: "none", cursor: "pointer", color: "#AAB0BE", padding: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16 }) })
        ] }),
        showSearch && searchResults.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "100%", left: "16px", right: "16px", background: "#fff", borderRadius: "14px", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", border: "1px solid #F0F2F7", zIndex: 100, maxHeight: "280px", overflowY: "auto", marginTop: "6px" }, children: searchResults.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            onClick: () => {
              handlePointClick(p, true);
              setShowSearch(false);
              setSearchQuery("");
              setSearchResults([]);
            },
            style: { padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px", borderBottom: i < searchResults.length - 1 ? "1px solid #F8F9FC" : "none", cursor: "pointer", transition: "background 0.15s" },
            onMouseEnter: (e) => e.currentTarget.style.background = "#F8F9FC",
            onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "32px", height: "32px", background: "#EBF2FF", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: `calc(16px * var(--fs, 1))`, flexShrink: 0 }, children: EMOJI_MAP[p.type] || "⚓" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "950", color: "#1A1A2E", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: p.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "800", marginTop: "2px" }, children: [
                  p.region,
                  " · ",
                  p.type,
                  " · ",
                  p.fish.split(",")[0]
                ] })
              ] }),
              (() => {
                const _st = findNearestStation(p.lat, p.lng);
                const _live = weatherCache[_st?.id];
                const _sd = getPointSpecificData(p);
                const _wd = _live ? { ..._live, stationId: _st.id, tide: _sd.tide, pointName: p.name } : _sd;
                const _sc = evaluateFishingCondition(_wd, p).score;
                const _label = _sc >= 90 ? "최고" : _sc >= 75 ? "활발" : _sc >= 50 ? "보통" : _sc >= 30 ? "저조" : "위험";
                const _col = _sc >= 90 ? "#00C48C" : _sc >= 75 ? "#1565C0" : _sc >= 50 ? "#FF9B26" : _sc >= 30 ? "#FF5A5F" : "#D32F2F";
                return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: _col, borderRadius: "6px", padding: "3px 8px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, fontWeight: "900", color: "#fff" }, children: _label }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, color: "#AAB0BE", fontWeight: "700" }, children: [
                    _sc,
                    "점"
                  ] })
                ] });
              })()
            ]
          },
          p.id
        )) }),
        showSearch && searchResults.length === 0 && searchQuery && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", top: "100%", left: "16px", right: "16px", background: "#fff", borderRadius: "14px", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", border: "1px solid #F0F2F7", zIndex: 100, padding: "20px", textAlign: "center", marginTop: "6px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { size: 24, color: "#AAB0BE", style: { margin: "0 auto 8px" } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "800" }, children: "검색 결과가 없어요" })
        ] })
      ] }),
      selectedPoint?.type === "민물" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "16px 16px 0" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg, #2E7D32 0%, #43A047 60%, #66BB6A 100%)", borderRadius: "20px", padding: "18px 18px 16px", boxShadow: "0 8px 30px rgba(46,125,50,0.25)", position: "relative", overflow: "hidden" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "4px", color: "rgba(255,255,255,0.75)", fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "700", marginBottom: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 10, color: "rgba(255,255,255,0.75)", fill: "rgba(255,255,255,0.4)" }),
          selectedPoint.name
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(36px * var(--fs, 1))` }, children: "🐟" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(16px * var(--fs, 1))`, fontWeight: "950", color: "#fff", lineHeight: 1.3 }, children: [
              selectedPoint.region,
              " 민물낚시 포인트"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "rgba(255,255,255,0.75)", fontWeight: "700", marginTop: "4px" }, children: selectedPoint.fish })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.12)", borderRadius: "12px", padding: "10px 14px", border: "1px solid rgba(255,255,255,0.15)", fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.8)", fontWeight: "700", lineHeight: 1.6 }, children: [
          "🌊 내수면 포인트로 날씨·수온·CCTV 정보가 제공되지 않습니다.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "장소 정보만 제공됩니다."
        ] })
      ] }) }),
      selectedPoint?.type !== "민물" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "16px 16px 0" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg, #1565C0 0%, #1E88E5 60%, #42A5F5 100%)", borderRadius: "20px", padding: "18px 18px 16px", boxShadow: "0 8px 30px rgba(21,101,192,0.25)", position: "relative", overflow: "hidden" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "4px", color: "rgba(255,255,255,0.75)", fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "700", marginBottom: "6px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 10, color: "rgba(255,255,255,0.75)", fill: "rgba(255,255,255,0.4)" }),
          precisionData?.pointName || selectedPoint?.name || DEFAULT_POINT.name
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", gap: "10px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(38px * var(--fs, 1))`, fontWeight: "950", color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }, children: tideData.temp ? (typeof tideData.temp === "string" ? tideData.temp.replace("°C", "") : tideData.temp) + "°" : "15.2°" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,255,255,0.88)", fontWeight: "700", marginTop: "6px", lineHeight: 1.7, whiteSpace: "pre-line" }, children: [
              mainAdvice,
              alertAdvice && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#FF8080", fontWeight: "900", fontSize: `calc(10px * var(--fs, 1))` }, children: "⚠ 특보 " }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "rgba(255,200,200,0.95)", fontWeight: "700", fontSize: `calc(10px * var(--fs, 1))` }, children: alertAdvice })
              ] })
            ] }),
            dynamicAlert && dynamicAlert !== alertAdvice && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "inline-flex", alignItems: "flex-start", gap: "5px", marginTop: "6px", background: "rgba(255,80,80,0.22)", border: "1px solid rgba(255,80,80,0.5)", borderRadius: "8px", padding: "5px 9px", lineHeight: 1.45 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", color: "#FF8080", flexShrink: 0, paddingTop: "1px" }, children: "🚨 기상" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,200,200,0.95)", fontWeight: "700" }, children: dynamicAlert })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { width: "72px", height: "72px", borderRadius: "50%", flexShrink: 0, background: scoreStyle.bg, border: `2px solid ${scoreStyle.border}`, boxShadow: scoreStyle.glow, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)", position: "relative" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { style: { position: "absolute", inset: 0, width: "100%", height: "100%", transform: "rotate(-90deg)" }, viewBox: "0 0 72 72", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "36", cy: "36", r: "32", fill: "none", stroke: "rgba(255,255,255,0.07)", strokeWidth: "3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "36", cy: "36", r: "32", fill: "none", stroke: scoreStyle.border, strokeWidth: "3", strokeLinecap: "round", strokeDasharray: `${score / 100 * 201} 201`, style: { transition: "stroke-dasharray 0.6s ease" } })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(22px * var(--fs, 1))`, fontWeight: "950", color: scoreStyle.numColor, lineHeight: 1, position: "relative" }, children: score }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(7.5px * var(--fs, 1))`, fontWeight: "800", color: "rgba(255,255,255,0.55)", marginTop: "2px", position: "relative" }, children: "낚시점수" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(6.5px * var(--fs, 1))`, fontWeight: "900", color: scoreStyle.numColor, opacity: 0.9, position: "relative", marginTop: "1px", letterSpacing: "0.02em" }, children: scoreStyle.label })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px", marginBottom: "14px" }, children: [
          { label: "상층", val: `${tideData.layers?.upper || "16.2"}°`, color: "#64B5F6" },
          { label: "중층", val: `${tideData.layers?.middle || "14.5"}°`, color: "#42A5F5" },
          { label: "저층", val: `${tideData.layers?.lower || "13.1"}°`, color: "#1E88E5" }
        ].map((l) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, background: "rgba(255,255,255,0.12)", borderRadius: "12px", padding: "8px 4px", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(9px * var(--fs, 1))`, color: "rgba(255,255,255,0.6)", fontWeight: "800", marginBottom: "2px" }, children: l.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#fff", fontWeight: "950" }, children: l.val })
        ] }, l.label)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "2px", flex: 1, alignItems: "center" }, children: [
            { Icon: Waves, label: "파고", val: `${tideData.wave?.coastal || "0.4"}m` },
            { Icon: Wind, label: "풍속", val: `${tideData.wind?.speed || "2.1"}m/s` },
            { Icon: Clock, label: "만조", val: tideData.tide?.high || "15:20" }
          ].map((chip) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, background: "rgba(255,255,255,0.14)", borderRadius: "30px", padding: "6px 12px", border: "1px solid rgba(255,255,255,0.15)" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(chip.Icon, { size: 11, color: "rgba(255,255,255,0.8)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, color: "rgba(255,255,255,0.6)", fontWeight: "700" }, children: chip.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#fff", fontWeight: "950" }, children: chip.val })
          ] }, chip.label)) }),
          selectedPoint?.type !== "민물" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              onClick: async () => {
                if (!canAccessPremium) {
                  addToast("📺 실시간 해양 CCTV는 LITE 플랜 이상에서 제공됩니다.", "error");
                  return;
                }
                const sid = selectedPoint?.obsCode || "DT_0001";
                try {
                  const res = await apiClient.get(`/api/weather/cctv?stationId=${sid}`);
                  setCctvData(res.data);
                  setShowCCTV(true);
                } catch {
                  addToast("영상 데이터를 불러오는 데 실패했습니다.", "error");
                }
              },
              style: { flexShrink: 0, background: canAccessPremium ? "rgba(255,215,0,0.9)" : "rgba(255,255,255,0.15)", border: canAccessPremium ? "none" : "1px solid rgba(255,255,255,0.2)", borderRadius: "30px", padding: "6px 14px", display: "inline-flex", flexDirection: "row", alignItems: "center", flexWrap: "nowrap", gap: "5px", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", userSelect: "none", WebkitUserSelect: "none" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Tv, { size: 13, color: "#1A1A2E", style: { flexShrink: 0, display: "block" } }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", color: "#1A1A2E", lineHeight: 1, flexShrink: 0, whiteSpace: "nowrap" }, children: "실시간 영상" })
              ]
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "12px 16px 0" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "20px", padding: "16px 18px", border: "1.5px solid #F0F2F7", boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(15px * var(--fs, 1))` }, children: "🎯" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", color: "#1A1A2E" }, children: "AI 낚시 적합도" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: score >= 90 ? "linear-gradient(135deg, #00C48C, #00897B)" : score >= 75 ? "linear-gradient(135deg, #1565C0, #1E88E5)" : score >= 50 ? "linear-gradient(135deg, #FF9B26, #F57F17)" : "linear-gradient(135deg, #FF5A5F, #D32F2F)", borderRadius: "20px", padding: "4px 12px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", color: "#fff" }, children: score >= 90 ? "🔥 피딩 중!" : score >= 75 ? "✅ 출조 추천" : score >= 50 ? "🙂 보통" : "⚠ 재고 필요" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", marginBottom: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: "10px", background: "#F0F2F7", borderRadius: "6px", overflow: "hidden" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: "100%", width: `${score}%`, background: score >= 90 ? "linear-gradient(90deg, #00C48C, #00E5A8)" : score >= 75 ? "linear-gradient(90deg, #1565C0, #42A5F5)" : score >= 50 ? "linear-gradient(90deg, #FF9B26, #FFD54F)" : "linear-gradient(90deg, #FF5A5F, #FF8A80)", borderRadius: "6px", transition: "width 1s cubic-bezier(0.25, 1, 0.5, 1)", boxShadow: score >= 90 ? "0 0 8px rgba(0,196,140,0.6)" : "none" }, className: score >= 90 ? "gauge-pulse" : "" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", marginTop: "5px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, color: "#C7C7CC", fontWeight: "700" }, children: "0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "950", color: score >= 90 ? "#00C48C" : score >= 75 ? "#1565C0" : score >= 50 ? "#FF9B26" : "#FF5A5F" }, children: [
              score,
              "점"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, color: "#C7C7CC", fontWeight: "700" }, children: "100" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginTop: "4px" }, children: [
          { label: "수온", val: `${parseFloat(tideData.sst || 14).toFixed(1)}°C`, ok: parseFloat(tideData.sst || 14) >= 12 && parseFloat(tideData.sst || 14) <= 22 },
          { label: "파고", val: `${tideData.wave?.coastal || "0.4"}m`, ok: parseFloat(tideData.wave?.coastal || 0.4) <= 1 },
          { label: "풍속", val: `${tideData.wind?.speed || "2.1"}m/s`, ok: parseFloat(tideData.wind?.speed || 2.1) <= 5 },
          { label: "물때", val: phase.slice(0, 3), ok: !phase.includes("조금") && !phase.includes("무시") && !phase.includes("13물") && !phase.includes("14물") && !phase.includes("15물") }
        ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: item.ok ? "rgba(0,196,140,0.08)" : "rgba(255,90,95,0.08)", border: `1px solid ${item.ok ? "rgba(0,196,140,0.25)" : "rgba(255,90,95,0.25)"}`, borderRadius: "10px", padding: "7px 4px", textAlign: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(9px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "700" }, children: item.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "950", color: item.ok ? "#00C48C" : "#FF5A5F", marginTop: "2px" }, children: item.val }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(8px * var(--fs, 1))`, color: item.ok ? "#00C48C" : "#FF5A5F", fontWeight: "800" }, children: item.ok ? "✓ 양호" : "✗ 주의" })
        ] }, item.label)) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "16px 16px 4px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }, children: [
        { Icon: Map, label: "포인트", color: "#1565C0", bg: "#EBF2FF", action: () => setViewMode("map"), locked: false },
        { Icon: BarChart2, label: "날씨", color: "#2E7D32", bg: "#EDF7EE", action: () => navigate("/weather"), locked: false },
        { Icon: Ship, label: "선상/크루", color: "#BF360C", bg: "#FFF3EE", action: () => navigate("/community"), locked: false },
        { Icon: Crown, label: "클럽", color: "#6A1B9A", bg: "#F5EEFF", action: () => navigate("/community"), locked: false },
        {
          label: "비밀포인트",
          locked: !canAccessPremium,
          action: () => {
            if (!canAccessPremium) {
              setPendingPoint({ id: "secret", name: "비밀 포인트" });
              setPointAdContext("secret");
              setShowPointAdGate(true);
              return;
            }
            setViewMode("map");
            setShowSecretPoints(true);
            addToast("⭐ 비밀 포인트 25곳이 지도에 표시됩니다!", "success");
          },
          customIcon: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(22px * var(--fs, 1))`, filter: canAccessPremium ? "drop-shadow(0 0 6px rgba(255,200,0,0.9)) drop-shadow(0 0 2px rgba(255,160,0,0.6))" : "grayscale(1) opacity(0.5)", animation: canAccessPremium ? "secretPulse 2s ease-in-out infinite" : "none" }, children: "⭐" }),
            !canAccessPremium && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", bottom: "-1px", right: "-1px", width: "13px", height: "13px", background: "#8E8E93", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #fff" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { size: 7, color: "#fff" }) })
          ] })
        }
      ].map((m, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: m.action, style: { textAlign: "center", cursor: "pointer" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: { width: "100%", aspectRatio: "1/1", backgroundColor: "#fff", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "5px", boxShadow: !m.locked && m.label === "비밀포인트" ? "0 3px 14px rgba(255,200,0,0.25)" : "0 2px 8px rgba(0,0,0,0.05)", border: !m.locked && m.label === "비밀포인트" ? "1.5px solid rgba(255,215,0,0.45)" : "1px solid #F0F2F7", transition: "transform 0.15s" },
            onMouseDown: (e) => e.currentTarget.style.transform = "scale(0.93)",
            onMouseUp: (e) => e.currentTarget.style.transform = "scale(1)",
            onMouseLeave: (e) => e.currentTarget.style.transform = "scale(1)",
            children: m.customIcon ? m.customIcon : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "36px", height: "36px", background: m.bg, borderRadius: "11px", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(m.Icon, { size: 19, color: m.color }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, fontWeight: "800", color: !m.locked && m.label === "비밀포인트" ? "#B8860B" : "#555" }, children: m.label })
      ] }, index)) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "10px 16px 6px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "16px", padding: "12px 14px", border: "1.5px solid #F0F2F7" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", marginBottom: "10px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 13, color: "#FFB300", fill: "#FFB300" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "900", color: "#1A1A2E", marginLeft: "5px" }, children: "피딩 타임" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { marginLeft: "auto", fontSize: `calc(10px * var(--fs, 1))`, color: isGolden ? "#E65100" : "#8E8E93", fontWeight: "800" }, children: isGolden ? "🌟 황금물때" : phase.split("(")[0] })
        ] }),
        (() => {
          const now = /* @__PURE__ */ new Date();
          const nowMin = now.getHours() * 60 + now.getMinutes();
          const parseTime = (str) => {
            if (!str)
              return null;
            const [h, m] = String(str).split(":").map(Number);
            return isNaN(h) ? null : h * 60 + (m || 0);
          };
          const highMin = parseTime(tideData.tide?.high);
          const lowMin = parseTime(tideData.tide?.low);
          const goldenMin = highMin ?? 870;
          const lowMinVal = lowMin ?? 360;
          const nextLowMin = (lowMinVal + 720) % 1440;
          const fmt = (mn) => {
            const hh = Math.floor((mn % 1440 + 1440) % 1440 / 60);
            const mm = (mn % 1440 + 1440) % 1440 % 60;
            return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
          };
          const isInWindow = (centerMin, windowMin = 40) => Math.abs(nowMin - centerMin) <= windowMin || Math.abs(nowMin - centerMin + 1440) <= windowMin || Math.abs(nowMin - centerMin - 1440) <= windowMin;
          const slots = [
            { label: "간조 물때", time: fmt(lowMinVal), active: isInWindow(lowMinVal, 35), val: lowMinVal },
            { label: "만조 (황금)✨", time: fmt(goldenMin), active: isInWindow(goldenMin, 40), val: goldenMin },
            { label: "다음 물때", time: fmt(nextLowMin), active: isInWindow(nextLowMin, 35), val: nextLowMin }
          ];
          slots.sort((a, b) => a.val - b.val);
          const hasActive = slots.some((s) => s.active);
          if (!hasActive) {
            const diffs = slots.map((s, i) => ({ i, diff: (s.val - nowMin + 1440) % 1440 }));
            diffs.sort((a, b) => a.diff - b.diff);
            slots[diffs[0].i].next = true;
          }
          return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px" }, children: slots.map((ft, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, padding: "8px 2px", borderRadius: "12px", textAlign: "center", background: ft.active ? "linear-gradient(135deg, #FFD700, #FFA000)" : ft.next ? "linear-gradient(135deg, #E8F4FF, #D0E8FF)" : "#F8F9FC", border: ft.active ? "none" : ft.next ? "1px solid #90CAF9" : "1px solid #F0F2F7" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(8px * var(--fs, 1))`, fontWeight: "900", color: ft.active ? "#5C3A00" : ft.next ? "#1565C0" : "#AAB0BE", marginBottom: "2px" }, children: [
              ft.label,
              ft.next ? " (다음)" : ""
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, fontWeight: "950", color: ft.active ? "#1A1A00" : ft.next ? "#1565C0" : "#8E8E93" }, children: ft.time }),
            ft.active && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(7px * var(--fs, 1))`, color: "#5C3A00", fontWeight: "900", marginTop: "1px" }, children: "🔥 지금!" })
          ] }, i)) });
        })()
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "8px 16px 12px" }, children: canAccessPremium ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #111218 0%, #1E1F2E 100%)", borderRadius: "20px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 12px 30px rgba(0,0,0,0.2)", border: "1px solid rgba(255,215,0,0.2)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "-40%", right: "-10%", width: "120px", height: "120px", background: "radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)", filter: "blur(20px)", pointerEvents: "none" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)", backgroundSize: "200% 100%", animation: "shimmer 3s infinite linear", pointerEvents: "none" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", width: "46px", height: "46px", background: "linear-gradient(135deg, #FFD700, #FFA000)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 6px 20px rgba(255,215,0,0.3)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { size: 24, color: "#5C3A00", fill: "#5C3A00" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "-3px", right: "-3px", width: "12px", height: "12px", background: "#00C48C", borderRadius: "50%", border: "2px solid #1E1F2E", animation: "pulse 2s infinite" } })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, position: "relative", zIndex: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "950", color: "#fff" }, children: [
              currentTier.label || "LITE",
              " 구독 중"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: "#00C48C", fontSize: `calc(8px * var(--fs, 1))`, padding: "2px 6px", borderRadius: "10px", color: "#fff", fontWeight: "900" }, children: "활성" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "rgba(255,255,255,0.55)", fontWeight: "600" }, children: "비밀 포인트 25곳 · 히트맵 · CCTV 이용 가능" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            onClick: () => {
              setViewMode("map");
              setShowSecretPoints(true);
              addToast("⭐ 비밀 포인트 25곳이 지도에 표시됩니다!", "success");
            },
            style: { position: "relative", zIndex: 1, background: "rgba(255,255,255,0.1)", color: "#FFD700", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "30px", padding: "8px 12px", fontSize: `calc(10px * var(--fs, 1))`, fontWeight: "900", cursor: "pointer", backdropFilter: "blur(5px)", whiteSpace: "nowrap" },
            children: "비밀포인트 보기 ›"
          }
        )
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          onClick: () => navigate("/vvip-subscribe"),
          style: { background: "linear-gradient(135deg, #0D0D1A 0%, #1A1A2E 100%)", borderRadius: "22px", padding: "18px 20px", border: "1px solid rgba(255,215,0,0.22)", boxShadow: "0 12px 32px rgba(0,0,0,0.22)", position: "relative", overflow: "hidden", cursor: "pointer", display: "flex", alignItems: "center", gap: "14px", transition: "transform 0.15s" },
          onMouseDown: (e) => e.currentTarget.style.transform = "scale(0.98)",
          onMouseUp: (e) => e.currentTarget.style.transform = "scale(1)",
          onMouseLeave: (e) => e.currentTarget.style.transform = "scale(1)",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "-40%", right: "-10%", width: "130px", height: "130px", background: "radial-gradient(circle, rgba(255,215,0,0.14) 0%, transparent 70%)", filter: "blur(22px)", pointerEvents: "none" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", bottom: "-40%", left: "-5%", width: "90px", height: "90px", background: "radial-gradient(circle, rgba(0,196,140,0.1) 0%, transparent 70%)", filter: "blur(16px)", pointerEvents: "none" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", width: "48px", height: "48px", background: "linear-gradient(135deg, #FFD700, #FFA000)", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 6px 18px rgba(255,215,0,0.35)", zIndex: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { size: 24, color: "#5C3A00", fill: "#5C3A00" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "-3px", right: "-3px", width: "11px", height: "11px", background: "#00C48C", borderRadius: "50%", border: "2px solid #1A1A2E", animation: "pulse 2s infinite" } })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, position: "relative", zIndex: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "950", color: "#fff", letterSpacing: "-0.02em", marginBottom: "4px" }, children: "프리미엄 멤버십" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(11px * var(--fs, 1))`, color: "rgba(255,215,0,0.75)", fontWeight: "700" }, children: "비밀 포인트 · CCTV · 히트맵 이용" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", zIndex: 1, background: "linear-gradient(135deg, #FFD700, #FFA000)", borderRadius: "30px", padding: "9px 16px", display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, boxShadow: "0 4px 14px rgba(255,215,0,0.4)" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "950", color: "#1A1A2E", whiteSpace: "nowrap" }, children: "구독하러 가기" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#1A1A2E", fontWeight: "900" }, children: "›" })
            ] })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "14px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "0 16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "950", color: "#1A1A2E", margin: 0, display: "flex", alignItems: "center", gap: "5px" }, children: [
            filter === "전체" ? "실시간 우수 포인트" : `${EMOJI_MAP[filter] || ""} ${filter} 점수 순위`,
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, background: "#E8F4FF", color: "#1565C0", padding: "2px 7px", borderRadius: "10px", fontWeight: "900" }, children: "LIVE" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { onClick: () => setViewMode("map"), style: { fontSize: `calc(11px * var(--fs, 1))`, color: "#1565C0", fontWeight: "800", cursor: "pointer" }, children: "지도보기 →" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", overflowX: "auto", gap: "10px", padding: "2px 16px 10px", scrollbarWidth: "none" }, children: PREMIUM_POINTS.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "24px 16px", textAlign: "center", color: "#AAB0BE", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "700" }, children: [
          filter,
          " 포인트 데이터가 없습니다.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(11px * var(--fs, 1))` }, children: "전체 보기로 전환하거나 다른 타입을 선택해주세요." })
        ] }) : PREMIUM_POINTS.map((point, rank) => {
          const liveScore = point._liveScore ?? 0;
          const scoreColor = liveScore >= 90 ? "#00C48C" : liveScore >= 75 ? "#1565C0" : liveScore >= 50 ? "#FF9B26" : "#FF5A5F";
          const statusLabel = liveScore >= 90 ? "최고" : liveScore >= 75 ? "활발" : liveScore >= 50 ? "보통" : "POOR";
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              onClick: () => handlePremiumPointClick(point),
              style: { minWidth: "140px", background: "#fff", borderRadius: "15px", overflow: "hidden", boxShadow: "0 3px 10px rgba(0,0,0,0.06)", border: `1px solid ${rank === 0 ? "rgba(0,196,140,0.35)" : "#F0F2F7"}`, cursor: "pointer", transition: "transform 0.15s" },
              onMouseDown: (e) => e.currentTarget.style.transform = "scale(0.96)",
              onMouseUp: (e) => e.currentTarget.style.transform = "scale(1)",
              onMouseLeave: (e) => e.currentTarget.style.transform = "scale(1)",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { width: "100%", height: "90px", background: rank === 0 ? "linear-gradient(135deg, #E0F7EF, #C8F0E0)" : "linear-gradient(135deg, #E8F0FE, #D2E3FC)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(32px * var(--fs, 1))` }, children: EMOJI_MAP[point.type] || "⚓" }),
                  rank === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "6px", left: "6px", background: "linear-gradient(135deg,#00C48C,#00897B)", borderRadius: "6px", padding: "2px 7px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(8px * var(--fs, 1))`, fontWeight: "900", color: "#fff" }, children: "🏆 1위" }) }),
                  rank > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "6px", left: "6px", background: scoreColor, borderRadius: "6px", padding: "2px 6px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(8px * var(--fs, 1))`, fontWeight: "900", color: "#fff" }, children: statusLabel }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: "6px", right: "6px", background: liveScore >= 75 ? "#FFD700" : "rgba(0,0,0,0.55)", borderRadius: "6px", padding: "2px 6px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, fontWeight: "900", color: liveScore >= 75 ? "#1A1A2E" : "#fff" }, children: [
                    liveScore,
                    "점"
                  ] }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "8px 10px" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "900", color: "#1A1A2E", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: point.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(8px * var(--fs, 1))`, background: "#F0F5FF", color: "#1565C0", padding: "1px 5px", borderRadius: "5px", fontWeight: "900", flexShrink: 0 }, children: point.type }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, color: "#AAB0BE", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: [
                      point.region,
                      " · ",
                      point.fish.split(",")[0]
                    ] })
                  ] })
                ] })
              ]
            },
            point.id
          );
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "10px 16px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "950", color: "#1A1A2E", marginBottom: "10px" }, children: "방금 올라온 조황" }),
        recentPosts.length > 0 ? recentPosts.map((post) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            onClick: () => navigate(`/community?tab=open&postId=${String(post._id || post.id)}`),
            style: { background: "#fff", borderRadius: "12px", padding: "10px 12px", marginBottom: "8px", display: "flex", gap: "10px", alignItems: "center", border: "1px solid #F0F2F7", cursor: "pointer", transition: "all 0.18s ease", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
            onMouseEnter: (e) => {
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,86,210,0.13)";
              e.currentTarget.style.borderColor = "#C8D8F5";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
              e.currentTarget.style.borderColor = "#F0F2F7";
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #0056D2, #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: `calc(18px * var(--fs, 1))` }, children: "🎣" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, overflow: "hidden" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "900", color: "#1A1A2E", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: (post.content || "").slice(0, 80) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: `calc(10px * var(--fs, 1))`, color: "#AAB0BE", fontWeight: "700" }, children: [
                    "@",
                    post.author
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, background: "#F0F5FF", color: "#0056D2", padding: "1px 6px", borderRadius: "6px", fontWeight: "800" }, children: post.category })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#C8D8F5", flexShrink: 0 }, children: "›" })
            ]
          },
          String(post._id || post.id)
        )) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "14px", textAlign: "center", color: "#AAB0BE", fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "700", border: "1px dotted #D0D5E0", borderRadius: "12px" }, children: "오늘의 첫 조황을 공유해보세요! 🎣" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "4px 16px 20px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { backgroundColor: "#1A1A2E", borderRadius: "16px", padding: "14px", display: "flex", gap: "12px", alignItems: "center" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "40px", height: "40px", background: "linear-gradient(135deg, #FFD700, #FFA000)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: `calc(20px * var(--fs, 1))`, flexShrink: 0 }, children: baitTip.icon }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(9px * var(--fs, 1))`, fontWeight: "900", color: "#FFB300", marginBottom: "3px" }, children: [
            "오늘의 미끼 팁 · ",
            selectedPoint?.name?.slice(0, 8) || "현재 포인트"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, fontWeight: "800", color: "#fff", lineHeight: 1.45 }, children: baitTip.text })
        ] })
      ] }) }),
      !canAccessPremium && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "0 16px 16px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdSenseDisplay, { style: { borderRadius: "12px", overflow: "hidden" } }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CsInquirySection, { user, isAdmin })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      RewardGateModal,
      {
        isOpen: showPointAdGate,
        onClose: () => {
          setShowPointAdGate(false);
          setPendingPoint(null);
        },
        onRewardComplete: handlePointAdComplete,
        onSubscribe: () => {
          setShowPointAdGate(false);
          navigate("/vvip-subscribe");
        },
        context: pointAdContext
      }
    )
  ] });
}

const TYPE_UI = {
  reply: { bg: "#EEF4FF", accent: "#0056D2", label: "답장 알림", Icon: CornerUpLeft },
  push: { bg: "#FFF0F8", accent: "#FF2D8B", label: "운영자 알림", Icon: Megaphone },
  alert: { bg: "#FFF8E6", accent: "#FF9B26", label: "기상 특보", Icon: AlertTriangle },
  info: { bg: "#F0FFF8", accent: "#00C48C", label: "낚시 정보", Icon: Fish },
  system: { bg: "#F5F5FA", accent: "#8E8E93", label: "시스템", Icon: Bell }
};
function getTypeUI(type) {
  return TYPE_UI[type] || TYPE_UI.system;
}
function NotifPanel({ onClose }) {
  const navigate = useNavigate();
  const notifs = useNotifStore((s) => s.notifs);
  const markAllRead = useNotifStore((s) => s.markAllRead);
  const markRead = useNotifStore((s) => s.markRead);
  const clearAll = useNotifStore((s) => s.clearAll);
  reactExports.useEffect(() => {
    markAllRead();
  }, [markAllRead]);
  const handleClick = (notif) => {
    markRead(notif.id);
    if (notif.link) {
      navigate(notif.link);
      onClose();
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 8e3, backdropFilter: "blur(2px)" },
        onClick: onClose
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      width: "100%",
      maxWidth: "380px",
      background: "#fff",
      zIndex: 8100,
      display: "flex",
      flexDirection: "column",
      boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
      animation: "slideInRight 0.25s cubic-bezier(0.34,1.2,0.64,1)",
      paddingTop: "env(safe-area-inset-top, 0px)"
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "20px 20px 14px", borderBottom: "1px solid #F0F0F5", display: "flex", alignItems: "center", gap: "10px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { size: 20, color: "#0056D2", strokeWidth: 2.5 }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "17px", fontWeight: "900", color: "#1c1c1e" }, children: "알림 센터" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#aaa", fontWeight: "700", marginTop: "2px" }, children: [
            notifs.length,
            "개 알림"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "6px" }, children: [
          notifs.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: clearAll,
              style: { border: "none", background: "#FFF0F0", padding: "7px 10px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "#FF3B30", fontSize: "12px", fontWeight: "800" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 13 }),
                " 전체 삭제"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, style: { border: "none", background: "#F5F5FA", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 18, color: "#666" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }, children: notifs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", paddingTop: "80px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "48px" }, children: "🔔" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "15px", fontWeight: "900", color: "#1c1c1e" }, children: "알림이 없습니다" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "13px", color: "#aaa", fontWeight: "700", textAlign: "center", lineHeight: "1.6" }, children: [
          "크루 채팅 답장, 운영자 메시지",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "기상 특보 등을 여기서 확인하세요"
        ] })
      ] }) : notifs.map((notif) => {
        const ui = getTypeUI(notif.type);
        const IconComp = ui.Icon;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            onClick: () => handleClick(notif),
            style: {
              background: notif.read ? "#FAFAFA" : ui.bg,
              border: `1.5px solid ${notif.read ? "#F0F0F5" : ui.accent + "30"}`,
              borderRadius: "16px",
              padding: "13px 14px",
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
              cursor: notif.link ? "pointer" : "default",
              transition: "all 0.15s",
              position: "relative",
              opacity: notif.read ? 0.7 : 1
            },
            onMouseEnter: (e) => {
              if (notif.link)
                e.currentTarget.style.transform = "scale(1.01)";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.transform = "scale(1)";
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: ui.accent, borderRadius: "10px", padding: "8px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(IconComp, { size: 15, color: "#fff" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "10px", fontWeight: "900", color: ui.accent }, children: ui.label }),
                  !notif.read && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { width: "6px", height: "6px", background: ui.accent, borderRadius: "50%", flexShrink: 0 } }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "10px", color: "#c0c0c0", marginLeft: "auto", flexShrink: 0 }, children: notif.time })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", fontWeight: "800", color: "#1c1c1e", marginBottom: "3px", lineHeight: "1.4" }, children: notif.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", color: "#555", fontWeight: "500", lineHeight: "1.5", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }, children: notif.body }),
                notif.link && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: ui.accent, fontWeight: "800", marginTop: "6px" }, children: "탭하여 이동 →" })
              ] })
            ]
          },
          notif.id
        );
      }) }),
      notifs.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "12px 20px 20px", borderTop: "1px solid #F0F0F5", display: "flex", alignItems: "center", gap: "8px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCheck, { size: 14, color: "#00C48C" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "12px", color: "#aaa", fontWeight: "700" }, children: "패널을 열면 자동으로 읽음 처리됩니다" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      ` })
  ] });
}

function SpotLocationEditor({ spot, onClose, onSaved }) {
  const addToast = useToastStore((s) => s.addToast);
  const mapRef = reactExports.useRef(null);
  const markerRef = reactExports.useRef(null);
  const kakaoMap = reactExports.useRef(null);
  const [lat, setLat] = reactExports.useState(String(spot.lat));
  const [lng, setLng] = reactExports.useState(String(spot.lng));
  const [saving, setSaving] = reactExports.useState(false);
  const [changed, setChanged] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!window.kakao?.maps)
      return;
    window.kakao.maps.load(() => {
      const container = mapRef.current;
      if (!container)
        return;
      const initLat = parseFloat(lat);
      const initLng = parseFloat(lng);
      const map = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(initLat, initLng),
        level: 4
      });
      kakaoMap.current = map;
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(initLat, initLng),
        draggable: true,
        map
      });
      markerRef.current = marker;
      window.kakao.maps.event.addListener(marker, "dragend", () => {
        const pos = marker.getPosition();
        const newLat = pos.getLat().toFixed(6);
        const newLng = pos.getLng().toFixed(6);
        setLat(newLat);
        setLng(newLng);
        setChanged(true);
      });
      window.kakao.maps.event.addListener(map, "click", (e) => {
        const pos = e.latLng;
        marker.setPosition(pos);
        const newLat = pos.getLat().toFixed(6);
        const newLng = pos.getLng().toFixed(6);
        setLat(newLat);
        setLng(newLng);
        setChanged(true);
      });
    });
  }, []);
  const applyManualCoords = reactExports.useCallback(() => {
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (isNaN(la) || isNaN(ln))
      return;
    if (!kakaoMap.current || !markerRef.current)
      return;
    const pos = new window.kakao.maps.LatLng(la, ln);
    markerRef.current.setPosition(pos);
    kakaoMap.current.setCenter(pos);
    setChanged(true);
  }, [lat, lng]);
  const handleSave = async () => {
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (isNaN(la) || isNaN(ln)) {
      addToast("올바른 좌표를 입력하세요.", "error");
      return;
    }
    setSaving(true);
    try {
      await apiClient.post("/api/spot-location-overrides", {
        id: spot.id,
        lat: la,
        lng: ln,
        name: spot.name
      });
      addToast(`✅ "${spot.name}" 위치 저장 완료`, "success");
      onSaved?.({ ...spot, lat: la, lng: ln });
      onClose();
    } catch (e) {
      addToast(e?.response?.data?.error || "저장 실패", "error");
    } finally {
      setSaving(false);
    }
  };
  const handleReset = async () => {
    if (!window.confirm("원래 좌표로 초기화하시겠습니까?"))
      return;
    setSaving(true);
    try {
      await apiClient.delete(`/api/spot-location-overrides/${spot.id}`);
      addToast("원래 위치로 초기화됐습니다.", "info");
      onSaved?.(spot);
      onClose();
    } catch (e) {
      addToast("초기화 실패", "error");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px"
  }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
    width: "100%",
    maxWidth: "480px",
    background: "#fff",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
      background: "linear-gradient(135deg, #1A1A2E, #0056D2)",
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 20, color: "#60a5fa" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#fff", fontWeight: "900", fontSize: "15px" }, children: "위치 수정 (MASTER)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: "700" }, children: spot.name })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, style: {
        background: "rgba(255,255,255,0.15)",
        border: "none",
        borderRadius: "50%",
        width: "32px",
        height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: "#fff"
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16 }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: mapRef, style: { width: "100%", height: "280px" } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
        position: "absolute",
        top: 10,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.7)",
        color: "#fff",
        borderRadius: "20px",
        padding: "6px 14px",
        fontSize: "12px",
        fontWeight: "700",
        whiteSpace: "nowrap",
        pointerEvents: "none"
      }, children: "📍 핀을 드래그하거나 지도를 클릭하세요" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px 20px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }, children: [
        { label: "위도 (Lat)", value: lat, setter: setLat },
        { label: "경도 (Lng)", value: lng, setter: setLng }
      ].map(({ label, value, setter }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", fontWeight: "800", color: "#666", marginBottom: "4px" }, children: label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            value,
            onChange: (e) => {
              setter(e.target.value);
              setChanged(true);
            },
            onBlur: applyManualCoords,
            style: {
              width: "100%",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1.5px solid #E0E7FF",
              fontSize: "14px",
              fontWeight: "800",
              outline: "none",
              boxSizing: "border-box",
              color: "#1A1A2E"
            }
          }
        )
      ] }, label)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        background: "#F8F9FC",
        borderRadius: "10px",
        padding: "8px 12px",
        fontSize: "11px",
        fontWeight: "700",
        color: "#888",
        marginBottom: "14px"
      }, children: [
        "원본: (",
        spot.lat,
        ", ",
        spot.lng,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: handleReset,
            disabled: saving,
            style: {
              flex: 1,
              padding: "12px",
              borderRadius: "12px",
              border: "1.5px solid #E5E7EB",
              background: "#fff",
              color: "#666",
              fontWeight: "800",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { size: 14 }),
              " 초기화"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleSave,
            disabled: saving || !changed,
            style: {
              flex: 2,
              padding: "12px",
              borderRadius: "12px",
              border: "none",
              background: saving || !changed ? "#E5E7EB" : "linear-gradient(135deg, #0056D2, #00C48C)",
              color: saving || !changed ? "#aaa" : "#fff",
              fontWeight: "900",
              fontSize: "14px",
              cursor: saving || !changed ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.2s"
            },
            children: saving ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, style: { animation: "spin 1s linear infinite" } }),
              " 저장 중..."
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 14 }),
              " 위치 저장"
            ] })
          }
        )
      ] })
    ] })
  ] }) });
}

const EMOJI_MAP = { "방파제": "⚓", "갯바위": "🪨", "선착장": "🚢", "항구": "🏖️", "민물": "📍" };
const STATUS_COLOR = { "최고": "#00C48C", "피딩중": "#FFB300", "활발": "#1565C0", "보통": "#8E8E93" };
const DEFAULT_AVATAR_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23E5E5EA'/%3E%3Ccircle cx='20' cy='16' r='7' fill='%23AEAEB2'/%3E%3Cellipse cx='20' cy='36' rx='12' ry='9' fill='%23AEAEB2'/%3E%3C/svg%3E";
function NotifBell() {
  const [open, setOpen] = React.useState(false);
  const notifs = useNotifStore((s) => s.notifs);
  const unread = notifs.filter((n) => !n.read).length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        onClick: () => setOpen(true),
        style: { position: "relative", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { size: 20, color: "#333", strokeWidth: 2 }),
          unread > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: {
            position: "absolute",
            top: "-2px",
            right: "-2px",
            minWidth: unread > 9 ? "16px" : "14px",
            height: "14px",
            background: "#FF3B30",
            borderRadius: "7px",
            border: "1.5px solid #fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "8px",
            fontWeight: "900",
            color: "#fff",
            padding: "0 2px"
          }, children: unread > 99 ? "99+" : unread }),
          unread === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { position: "absolute", top: "-1px", right: "-1px", width: "6px", height: "6px", background: "#E5E5EA", borderRadius: "50%", border: "1.5px solid #fff" } })
        ]
      }
    ),
    open && /* @__PURE__ */ jsxRuntimeExports.jsx(NotifPanel, { onClose: () => setOpen(false) })
  ] });
}
function HeaderClock() {
  const [clockStr, setClockStr] = React.useState(
    () => (/* @__PURE__ */ new Date()).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
  );
  React.useEffect(() => {
    const t = setInterval(
      () => setClockStr((/* @__PURE__ */ new Date()).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })),
      6e4
    );
    return () => clearInterval(t);
  }, []);
  return clockStr;
}
function MapHome() {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  const user = useUserStore((state) => state.user);
  const userTier = useUserStore((state) => state.userTier);
  const canAccessPremium = reactExports.useMemo(() => {
    if (user?.id === ADMIN_ID || user?.email === ADMIN_EMAIL || user?.email === ADMIN_ID)
      return true;
    return ["BUSINESS_LITE", "PRO", "BUSINESS_VIP", "MASTER"].includes(userTier);
  }, [userTier, user?.id, user?.email]);
  const isAdmin = useUserStore(
    (s) => s.user?.id === ADMIN_ID || s.user?.email === ADMIN_EMAIL || s.user?.email === ADMIN_ID || s.userTier === "MASTER"
  );
  const currentTier = isAdmin ? TIER_CONFIG.MASTER : TIER_CONFIG[userTier] || TIER_CONFIG.FREE;
  const [selectedPoint, setSelectedPoint] = reactExports.useState(null);
  const [mapLoaded, setMapLoaded] = reactExports.useState(false);
  const [mapLoadError, setMapLoadError] = reactExports.useState(false);
  const [loading, setLoading] = reactExports.useState(false);
  const [filter, setFilter] = reactExports.useState("전체");
  const [showHeatmap, setShowHeatmap] = reactExports.useState(false);
  const [viewMode, setViewMode] = reactExports.useState("dashboard");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [searchResults, setSearchResults] = reactExports.useState([]);
  const [showSearch, setShowSearch] = reactExports.useState(false);
  const [recentPosts, setRecentPosts] = reactExports.useState([]);
  const [showCCTV, setShowCCTV] = reactExports.useState(false);
  const [cctvData, setCctvData] = reactExports.useState(null);
  const [cctvLoading, setCctvLoading] = reactExports.useState(false);
  const [sheetVisible, setSheetVisible] = reactExports.useState(false);
  const [heatmapMode, setHeatmapMode] = reactExports.useState("sst");
  const [effectiveSecretPoints, setEffectiveSecretPoints] = reactExports.useState(SECRET_FISHING_POINTS);
  const [effectiveAllPoints, setEffectiveAllPoints] = reactExports.useState(ALL_FISHING_POINTS);
  const [spotLocOverrides, setSpotLocOverrides] = reactExports.useState({});
  const [showLocationEditor, setShowLocationEditor] = reactExports.useState(false);
  const [showSecretPoints, setShowSecretPoints] = reactExports.useState(false);
  const [precisionData, setPrecisionData] = reactExports.useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = reactExports.useState(false);
  const [showRewardGate, setShowRewardGate] = reactExports.useState(false);
  const [pendingPoint, setPendingPoint] = reactExports.useState(null);
  const [rankTick, setRankTick] = reactExports.useState(0);
  const [weatherCache, setWeatherCache] = reactExports.useState({});
  const [sharedCond, setSharedCond] = reactExports.useState(null);
  reactExports.useEffect(() => {
    const defaultPt = ALL_FISHING_POINTS.find((p) => p.id === 3) || ALL_FISHING_POINTS[0];
    const nearest = findNearestStation(defaultPt.lat, defaultPt.lng);
    const sid = nearest.id;
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "");
    (async () => {
      try {
        let base = getPointSpecificData(defaultPt);
        const [precRes, tideItems, waterTemp] = await Promise.allSettled([
          apiClient.get(`/api/weather/precision?stationId=${sid}`),
          fetchTideForecast(sid, todayStr),
          fetchWaterTemp(sid, todayStr)
        ]);
        if (precRes.status === "fulfilled") {
          base = { ...base, ...precRes.value.data, stationId: sid };
        }
        if (tideItems.status === "fulfilled" && tideItems.value?.length) {
          const preds = tideItems.value.map((t) => ({
            time: t.hl_time || "",
            type: t.hl_code === "H" ? "고조" : "간조",
            level: t.hl_level || ""
          }));
          base = {
            ...base,
            tide_predictions: preds,
            tide: {
              ...base.tide || {},
              phase: base.tide?.phase || "조석 데이터",
              high: preds.find((p) => p.type === "고조")?.time || base.tide?.high || "-",
              low: preds.find((p) => p.type === "간조")?.time || base.tide?.low || "-"
            }
          };
        }
        if (waterTemp.status === "fulfilled" && waterTemp.value && waterTemp.value !== "-") {
          base = { ...base, sst: waterTemp.value, waterTemp: waterTemp.value };
        }
        const initCond = evaluateFishingCondition(base, defaultPt);
        setSharedCond({ cond: initCond, pointId: defaultPt.id });
        if (false)
          console.log("[Init] 기본 포인트 AI 컨디션 로드 완료 →", defaultPt.name, initCond.score, "점");
      } catch (e) {
        if (false)
          console.warn("[Init] 기본 AI 컨디션 패치 실패 → fallback", e);
      }
    })();
  }, []);
  reactExports.useEffect(() => {
    if (selectedPoint && sharedCond && sharedCond.pointId !== selectedPoint.id) {
      setSharedCond(null);
    }
  }, [selectedPoint?.id]);
  const [favorites, setFavorites] = reactExports.useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fishing_favorites") || "[]");
    } catch {
      return [];
    }
  });
  const secretMarkersRef = reactExports.useRef([]);
  const closeSheetTimerRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const id = setInterval(() => setRankTick((t) => t + 1), 10 * 60 * 1e3);
    return () => {
      clearInterval(id);
      if (closeSheetTimerRef.current)
        clearTimeout(closeSheetTimerRef.current);
    };
  }, []);
  reactExports.useEffect(() => {
    if (!user)
      return;
    const userId = user.email || user.id;
    if (!userId || userId === "GUEST")
      return;
    apiClient.get(`/api/user/favorites?userId=${encodeURIComponent(userId)}`).then((res) => {
      if (res.data.favorites?.length > 0) {
        setFavorites(res.data.favorites);
        try {
          localStorage.setItem("fishing_favorites", JSON.stringify(res.data.favorites));
        } catch {
        }
      }
    }).catch((err) => {
      if (false)
        console.warn("[MapHome] 즐겨찾기 로드 실패:", err?.message);
    });
  }, [user?.email]);
  const toggleFavorite = (pointId) => {
    const isFav = favorites.includes(pointId);
    const next = isFav ? favorites.filter((f) => f !== pointId) : [...favorites, pointId];
    setFavorites(next);
    try {
      localStorage.setItem("fishing_favorites", JSON.stringify(next));
    } catch {
    }
    addToast(isFav ? "즐겨찾기 해제" : "⭐ 즐겨찾기 추가!", isFav ? "info" : "success");
    const userId = user?.email || user?.id;
    const isGuest = !userId || userId === "GUEST";
    if (!isGuest) {
      apiClient.post("/api/user/favorites", { userId, pointId, action: isFav ? "remove" : "add" }).catch(() => {
      });
    }
    if (!isFav && !isGuest) {
      apiClient.post("/api/user/exp", { userId, action: "point_visit" }).catch(() => {
      });
    }
  };
  const mapRef = reactExports.useRef(null);
  const clustererRef = reactExports.useRef(null);
  const markersRef = reactExports.useRef([]);
  const heatmapRef = reactExports.useRef([]);
  const searchRef = reactExports.useRef(null);
  const mapInitialized = reactExports.useRef(false);
  reactExports.useEffect(() => {
    if (!canAccessPremium && !isAdmin)
      return;
    apiClient.get("/api/secret-point-overrides").then((res) => {
      const ov = res.data || {};
      const applied = SECRET_FISHING_POINTS.map((p) => {
        const key = String(p.id);
        return ov[key] ? { ...p, lat: ov[key].lat, lng: ov[key].lng } : p;
      });
      setEffectiveSecretPoints(applied);
    }).catch(() => {
      try {
        const ov = JSON.parse(localStorage.getItem("secretPointOverrides") || "{}");
        setEffectiveSecretPoints(SECRET_FISHING_POINTS.map((p) => ov[p.id] ? { ...p, lat: ov[p.id].lat, lng: ov[p.id].lng } : p));
      } catch {
      }
    });
  }, [canAccessPremium, isAdmin]);
  reactExports.useEffect(() => {
    apiClient.get("/api/spot-location-overrides").then((res) => {
      const ov = res.data || {};
      setSpotLocOverrides(ov);
      const applied = ALL_FISHING_POINTS.map((p) => {
        const key = String(p.id);
        return ov[key] ? { ...p, lat: ov[key].lat, lng: ov[key].lng } : p;
      });
      setEffectiveAllPoints(applied);
    }).catch(() => {
    });
  }, []);
  reactExports.useEffect(() => {
    if (viewMode !== "map")
      return;
    if (mapInitialized.current && mapRef.current) {
      requestAnimationFrame(() => {
        mapRef.current?.relayout();
      });
      return;
    }
    const createMap = () => {
      const container = document.getElementById("kakao-map");
      if (!container)
        return;
      try {
        const map = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(36.5, 127.8),
          level: 11
        });
        map.addControl(new window.kakao.maps.ZoomControl(), window.kakao.maps.ControlPosition.RIGHT);
        map.addControl(new window.kakao.maps.MapTypeControl(), window.kakao.maps.ControlPosition.TOPRIGHT);
        map.setZoomable(true);
        map.setDraggable(true);
        mapRef.current = map;
        clustererRef.current = new window.kakao.maps.MarkerClusterer({
          map,
          averageCenter: true,
          minLevel: 10
        });
        mapInitialized.current = true;
        setMapLoaded(true);
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!mapRef.current)
                return;
              const cp = new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
              mapRef.current.panTo(cp);
              new window.kakao.maps.CustomOverlay({
                position: cp,
                map: mapRef.current,
                content: `<div style="width:14px;height:14px;background:#0056D2;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(0,86,180,0.5);z-index:100;"></div>`
              });
            },
            // ENH6-A1/B2: 위치 거부 시 PROD 가드 + 사용자 toast 피드백
            () => {
              if (false)
                console.warn("[MapHome] 위치 권한이 거부되었습니다.");
              addToast("현위치를 가져올 수 없습니다. 지도에서 직접 포인트를 탭해 주세요.", "info");
            },
            { timeout: 8e3 }
          );
        }
      } catch (err) {
        if (false)
          console.error("카카오맵 Map 생성 오류:", err);
      }
    };
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(createMap);
    } else {
      const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
      if (existingScript) {
        const onSdkLoad = () => {
          if (window.kakao?.maps)
            window.kakao.maps.load(createMap);
        };
        existingScript.addEventListener("load", onSdkLoad, { once: true });
        if (window.kakao?.maps) {
          window.kakao.maps.load(createMap);
        }
        const errTimer = setTimeout(() => {
          if (!mapInitialized.current)
            setMapLoadError(true);
        }, 5e3);
        return () => {
          existingScript.removeEventListener("load", onSdkLoad);
          clearTimeout(errTimer);
        };
      } else {
        const errTimer = setTimeout(() => {
          if (!mapInitialized.current)
            setMapLoadError(true);
        }, 3e3);
        let retry = 0;
        const id = setInterval(() => {
          if (window.kakao?.maps) {
            clearInterval(id);
            clearTimeout(errTimer);
            window.kakao.maps.load(createMap);
          } else if (retry >= 5) {
            clearInterval(id);
            if (false)
              console.warn("[MapHome] 카카오맵 SDK 없음 — VITE_KAKAO_APP_KEY 확인 필요");
          }
          retry++;
        }, 500);
        return () => {
          clearInterval(id);
          clearTimeout(errTimer);
        };
      }
    }
  }, [viewMode]);
  const checkDailyPointVisit = reactExports.useCallback(async () => {
    const userId = user?.email || user?.id;
    const isGuest = !userId || userId === "GUEST";
    if (isGuest) {
      const GUEST_LIMIT = 1;
      const KEY = "fg_guest_pv";
      const todayKst = (() => {
        const kstMs = Date.now() + 9 * 60 * 60 * 1e3;
        return new Date(kstMs).toISOString().split("T")[0];
      })();
      let rec = { count: 0, date: "" };
      try {
        rec = JSON.parse(sessionStorage.getItem(KEY) || "{}");
      } catch {
        rec = { count: 0, date: "" };
      }
      if (rec.date !== todayKst)
        rec = { count: 0, date: todayKst };
      if (rec.count >= GUEST_LIMIT)
        return false;
      rec.count += 1;
      try {
        sessionStorage.setItem(KEY, JSON.stringify(rec));
      } catch {
      }
      return true;
    }
    try {
      const res = await apiClient.post("/api/user/point-visit-check");
      return res.data?.allowed !== false;
    } catch {
      return true;
    }
  }, [user?.email, user?.id]);
  const _enterPoint = reactExports.useCallback(async (point, fromDashboard = false) => {
    setSelectedPoint(point);
    setPrecisionData(null);
    setLoading(true);
    if (!fromDashboard) {
      setSheetVisible(true);
      if (mapRef.current)
        mapRef.current.panTo(new window.kakao.maps.LatLng(point.lat, point.lng));
    }
    const nearest = findNearestStation(point.lat, point.lng);
    if (point.type === "민물") {
      setPrecisionData(null);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get(`/api/weather/precision?stationId=${nearest.id}`);
      const dynamicTide = getPointSpecificData(point).tide;
      setPrecisionData({ ...res.data, pointName: point.name, tide: dynamicTide, stationId: nearest.id });
    } catch {
      setPrecisionData(getPointSpecificData(point));
    } finally {
      setLoading(false);
    }
  }, []);
  const handlePointClick = reactExports.useCallback(async (point, fromDashboard = false) => {
    if (canAccessPremium || isAdmin) {
      await _enterPoint(point, fromDashboard);
      return;
    }
    setPendingPoint({ point, fromDashboard });
    setShowRewardGate(true);
  }, [canAccessPremium, isAdmin, _enterPoint]);
  reactExports.useEffect(() => {
    if (!mapLoaded || !mapRef.current)
      return;
    if (clustererRef.current) {
      clustererRef.current.clear();
    }
    const pts = filter === "전체" ? effectiveAllPoints : effectiveAllPoints.filter((p) => p.type === filter);
    const newMarkers = pts.map((point) => {
      if (!window.kakao?.maps)
        return null;
      const color = point.type === "방파제" ? "#00C48C" : point.type === "갯바위" ? "#0056D2" : point.type === "항구" ? "#9B59B6" : point.type === "민물" ? "#43A047" : "#FF9B26";
      const el = document.createElement("div");
      el.style.cssText = `
        background: ${color};
        width: 24px; height: 24px;
        display: flex; align-items: center; justify-content: center;
        color: #fff; font-weight: 950;
        border: 2px solid #fff; border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        cursor: pointer; font-size: calc(10px * var(--fs, 1));
        transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      `;
      el.textContent = point.type.charAt(0);
      el.onmouseenter = () => {
        el.style.transform = "scale(1.3) translateY(-2px)";
        el.style.zIndex = "50";
      };
      el.onmouseleave = () => {
        el.style.transform = "scale(1)";
        el.style.zIndex = "10";
      };
      el.onclick = () => handlePointClick(point);
      return new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(point.lat, point.lng),
        content: el,
        zIndex: 10
      });
    }).filter((m) => m !== null);
    if (clustererRef.current) {
      clustererRef.current.addMarkers(newMarkers);
    }
    markersRef.current = newMarkers;
  }, [mapLoaded, filter, handlePointClick]);
  reactExports.useEffect(() => {
    if (!mapLoaded || !mapRef.current)
      return;
    secretMarkersRef.current.forEach((m) => {
      if (m?.setMap)
        m.setMap(null);
    });
    secretMarkersRef.current = [];
    if (!showSecretPoints)
      return;
    effectiveSecretPoints.forEach((point) => {
      if (!window.kakao?.maps)
        return;
      const el = document.createElement("div");
      el.style.cssText = `
        width: 36px; height: 36px;
        display: flex; align-items: center; justify-content: center;
        font-size: calc(20px * var(--fs, 1));
        filter: drop-shadow(0 0 8px rgba(255,215,0,0.9)) drop-shadow(0 0 3px rgba(255,160,0,0.8));
        cursor: pointer;
        animation: secretPulse 1.5s ease-in-out infinite;
        z-index: 9999;
      `;
      el.textContent = "⭐";
      el.onclick = () => handlePointClick(point);
      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(point.lat, point.lng),
        content: el,
        zIndex: 9999
      });
      overlay.setMap(mapRef.current);
      secretMarkersRef.current.push(overlay);
    });
  }, [mapLoaded, showSecretPoints, effectiveSecretPoints, handlePointClick]);
  reactExports.useEffect(() => {
    const timer = setTimeout(() => {
      const uniqueStationIds = [...new Set(
        ALL_FISHING_POINTS.map((p) => findNearestStation(p.lat, p.lng).id)
      )];
      Promise.allSettled(
        uniqueStationIds.map(
          (id) => apiClient.get(`/api/weather/precision?stationId=${id}`).then((res) => ({ id, data: res.data }))
        )
      ).then((results) => {
        const newCache = {};
        results.forEach((r) => {
          if (r.status === "fulfilled" && r.value?.id) {
            newCache[r.value.id] = { ...r.value.data, stationId: r.value.id };
          }
        });
        if (Object.keys(newCache).length > 0) {
          setWeatherCache(newCache);
          if (false)
            console.log(`[Weather] ${Object.keys(newCache).length}개 관측소 실시간 날씨 로드 완료 → 히트맵+대시보드 점수 정확도 향상`);
        }
      }).catch(() => {
      });
    }, 2e3);
    return () => clearTimeout(timer);
  }, [rankTick]);
  const heatmapData = reactExports.useMemo(
    () => ALL_FISHING_POINTS.map((point) => {
      const st = findNearestStation(point.lat, point.lng);
      const staticData = getPointSpecificData(point);
      const liveData = weatherCache[st.id];
      const weatherData = liveData ? { ...liveData, stationId: st.id, tide: staticData.tide, pointName: point.name } : staticData;
      const sst = parseFloat(weatherData?.sst || 13);
      const condition = evaluateFishingCondition(weatherData, point);
      return { point, sst, score: condition.score };
    }),
    [rankTick, weatherCache]
  );
  reactExports.useEffect(() => {
    if (!mapLoaded || !mapRef.current)
      return;
    heatmapRef.current.forEach((item) => {
      if (item?.setMap)
        item.setMap(null);
    });
    heatmapRef.current = [];
    if (!showHeatmap)
      return;
    const getSstColor = (sst) => {
      if (sst < 8)
        return { fill: "#1a3c8f", text: "❄️ 극저", opacity: 0.75 };
      if (sst < 10)
        return { fill: "#1565C0", text: "🥶 저수온", opacity: 0.7 };
      if (sst < 12)
        return { fill: "#29B6F6", text: "🌊 차가움", opacity: 0.65 };
      if (sst < 14)
        return { fill: "#26C6DA", text: "💧 서늘", opacity: 0.6 };
      if (sst < 16)
        return { fill: "#66BB6A", text: "✅ 보통", opacity: 0.6 };
      if (sst < 18)
        return { fill: "#FFCA28", text: "🎣 양호", opacity: 0.65 };
      if (sst < 21)
        return { fill: "#FFA726", text: "🔥 적정", opacity: 0.7 };
      if (sst < 24)
        return { fill: "#FF7043", text: "♨️ 고수온", opacity: 0.7 };
      return { fill: "#B71C1C", text: "🌡 고수온!", opacity: 0.75 };
    };
    const getScoreColor = (score2) => {
      if (score2 >= 90)
        return { fill: "#00E5A8", text: "🌟 황금물때", opacity: 0.85 };
      if (score2 >= 75)
        return { fill: "#42A5F5", text: "🎣 최고조황", opacity: 0.75 };
      if (score2 >= 50)
        return { fill: "#FFCA28", text: "👌 보통이상", opacity: 0.65 };
      if (score2 >= 30)
        return { fill: "#FF7043", text: "⚠️ 추천안함", opacity: 0.65 };
      return { fill: "#D32F2F", text: "🛑 출조위험", opacity: 0.8 };
    };
    const getRadiusSst = (sst) => {
      if (sst >= 16 && sst < 21)
        return 5500;
      if (sst >= 14 && sst < 23)
        return 4e3;
      return 2800;
    };
    const getRadiusScore = (score2) => {
      if (score2 >= 90)
        return 6e3;
      if (score2 >= 75)
        return 4500;
      if (score2 >= 50)
        return 3e3;
      return 2e3;
    };
    heatmapData.forEach(({ point, sst, score: score2 }) => {
      if (!window.kakao?.maps)
        return;
      const { fill, text, opacity } = heatmapMode === "sst" ? getSstColor(sst) : getScoreColor(score2);
      const baseRadius = heatmapMode === "sst" ? getRadiusSst(sst) : getRadiusScore(score2);
      const center = new window.kakao.maps.LatLng(point.lat, point.lng);
      const layers = [
        { r: baseRadius, op: opacity * 0.15 },
        { r: baseRadius * 0.65, op: opacity * 0.35 },
        { r: baseRadius * 0.3, op: opacity * 0.7 }
      ];
      layers.forEach((layer) => {
        const circle = new window.kakao.maps.Circle({
          center,
          radius: layer.r,
          strokeWeight: 0,
          fillColor: fill,
          fillOpacity: layer.op
        });
        circle.setMap(mapRef.current);
        heatmapRef.current.push(circle);
      });
      const mainFish = (point.fish || "").split(",")[0].trim();
      const mainValue = heatmapMode === "sst" ? `${sst.toFixed(1)}°C` : `${score2}점`;
      const content = [
        '<div style="',
        "background:rgba(0,0,0,0.85);color:#fff;",
        "padding:5px 10px;border-radius:12px;",
        "font-size:11px;font-weight:900;white-space:nowrap;line-height:1.4;",
        "border:1.5px solid ",
        fill,
        ";pointer-events:none;",
        "box-shadow: 0 4px 12px ",
        fill,
        '40;transform: translateY(-8px);">',
        '<div style="display:flex;align-items:center;gap:4px;">',
        '<span style="color:',
        fill,
        ';font-size:14px">',
        mainValue,
        "</span>",
        '<span style="font-size:10px;color:#eee">',
        text,
        "</span>",
        "</div>",
        '<div style="color:#aaa;font-size:9.5px;margin-top:2px;">',
        mainFish || point.name.slice(0, 5),
        " 포인트</div>",
        "</div>"
      ].join("");
      const overlay = new window.kakao.maps.CustomOverlay({ position: center, content, yAnchor: 2.2, zIndex: 3 });
      overlay.setMap(mapRef.current);
      heatmapRef.current.push(overlay);
    });
  }, [showHeatmap, heatmapMode, mapLoaded, heatmapData]);
  reactExports.useEffect(() => {
    if (viewMode === "map" && mapRef.current && selectedPoint) {
      const timer = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.panTo(new window.kakao.maps.LatLng(selectedPoint.lat, selectedPoint.lng));
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedPoint]);
  reactExports.useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const res = await apiClient.get("/api/community/posts?limit=3&page=1");
        const arr = Array.isArray(res.data) ? res.data : res.data.posts || [];
        setRecentPosts(arr.slice(0, 3));
      } catch {
      }
    };
    fetchRecentPosts();
  }, []);
  reactExports.useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const handleSearch = (q) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    const low = q.toLowerCase();
    const filtered = ALL_FISHING_POINTS.filter(
      (p) => p.name.toLowerCase().includes(low) || p.fish.toLowerCase().includes(low) || p.type.toLowerCase().includes(low) || p.region?.toLowerCase().includes(low)
    );
    setSearchResults(filtered);
    setShowSearch(true);
  };
  const closeSheet = () => {
    setSheetVisible(false);
    if (closeSheetTimerRef.current)
      clearTimeout(closeSheetTimerRef.current);
    closeSheetTimerRef.current = setTimeout(() => {
      setSelectedPoint(null);
      closeSheetTimerRef.current = null;
    }, 350);
  };
  const DEFAULT_POINT = ALL_FISHING_POINTS.find((p) => p.id === 3) || ALL_FISHING_POINTS[0];
  const _selectedPt = selectedPoint || DEFAULT_POINT;
  const _nearestSt = findNearestStation(_selectedPt.lat, _selectedPt.lng);
  const _cachedLive = weatherCache[_nearestSt?.id];
  const _staticData = getPointSpecificData(_selectedPt);
  const currentData = precisionData || (_cachedLive ? { ..._cachedLive, stationId: _nearestSt?.id, tide: _staticData.tide, pointName: _selectedPt.name } : null) || _staticData;
  const cond = (sharedCond?.pointId === _selectedPt?.id ? sharedCond.cond : null) || evaluateFishingCondition(currentData, _selectedPt);
  const score = cond.score;
  const isGolden = score >= 90;
  const tideData = currentData;
  const phase = tideData.tide?.phase || "7물(사리)";
  const PREMIUM_POINTS = reactExports.useMemo(() => {
    const base = filter === "전체" ? ALL_FISHING_POINTS.filter((p) => p.type !== "민물") : ALL_FISHING_POINTS.filter((p) => p.type === filter);
    return base.map((p) => {
      const st = findNearestStation(p.lat, p.lng);
      const staticData = getPointSpecificData(p);
      const liveData = weatherCache[st.id];
      const weatherData = liveData ? { ...liveData, stationId: st.id, tide: staticData.tide, pointName: p.name } : staticData;
      const liveScore = evaluateFishingCondition(weatherData, p).score;
      return { ...p, _liveScore: liveScore };
    }).sort((a, b) => b._liveScore - a._liveScore).slice(0, 8);
  }, [rankTick, filter, weatherCache]);
  const getScoreCircleStyle = (s) => {
    if (s >= 90)
      return { bg: "rgba(0,196,140,0.18)", border: "rgba(0,196,140,0.7)", glow: "0 0 18px rgba(0,196,140,0.5)", numColor: "#00E5A8", label: "PERFECT" };
    if (s >= 75)
      return { bg: "rgba(21,101,192,0.18)", border: "rgba(100,181,246,0.7)", glow: "0 0 18px rgba(21,101,192,0.4)", numColor: "#64B5F6", label: "GOOD" };
    if (s >= 50)
      return { bg: "rgba(255,155,38,0.18)", border: "rgba(255,155,38,0.7)", glow: "0 0 14px rgba(255,155,38,0.4)", numColor: "#FFB74D", label: "NORMAL" };
    if (s >= 30)
      return { bg: "rgba(255,90,95,0.22)", border: "rgba(255,90,95,0.8)", glow: "0 0 16px rgba(255,90,95,0.5)", numColor: "#FF7070", label: "POOR" };
    return { bg: "rgba(211,47,47,0.28)", border: "rgba(211,47,47,0.9)", glow: "0 0 20px rgba(211,47,47,0.6)", numColor: "#FF4444", label: "DANGER" };
  };
  const scoreStyle = getScoreCircleStyle(score);
  const adviceParts = cond.advice.split(/\[특보\]/);
  const mainAdvice = adviceParts[0].trim();
  const alertAdvice = cond.fishAlert?.alert || adviceParts[1]?.trim() || null;
  const getDynamicAlert = () => {
    const hour = (/* @__PURE__ */ new Date()).getHours();
    const isNight = hour >= 19 || hour < 5;
    const isDawn = hour >= 4 && hour < 7;
    const wind = parseFloat(tideData.wind?.speed ?? 0);
    const wave = parseFloat(tideData.wave?.coastal ?? 0);
    const sst = parseFloat(tideData.sst ?? 13);
    const phase2 = tideData.tide?.phase || "";
    const mainFish = (selectedPoint?.fish || "").split(",")[0].trim();
    const month = (/* @__PURE__ */ new Date()).getMonth() + 1;
    if (wave > 2.5)
      return `파고 ${wave}m 너울 위험 — 갯바위·방파제 접근 금지! 즉시 대피하세요.`;
    if (wind > 12)
      return `풍속 ${wind.toFixed(1)}m/s 강풍 — 채비가 날아갑니다. 출조를 삼가세요.`;
    if (wave > 1.5)
      return `파고 ${wave}m 구름파 — 외해 노출 포인트는 위험. 안전한 코스로 이동하세요.`;
    if (sst < 9)
      return `수온 ${sst.toFixed(1)}°C 극저수온 — ${mainFish || "어류"} 동면 수준. 꽝 확률 95% 이상.`;
    if (sst < 11)
      return `수온 ${sst.toFixed(1)}°C 저수온 — ${mainFish ? `${mainFish}이 ` : ""}바닥에 바짝 붙었습니다. 지렁이+크릴 냄새로 유인하세요.`;
    if (phase2.includes("7물(사리)") || phase2.includes("6물") || phase2.includes("8물"))
      return `사리 물때 — 조류가 활발해 ${mainFish || "어류"} 입질 집중! 지금이 피딩 타임입니다.`;
    if (phase2.includes("13물") || phase2.includes("조금") || phase2.includes("무시"))
      return `조금·무시 물때 — 조류가 약해 ${mainFish || "어류"} 입질이 뜨문뜨문합니다. 인내심이 관건.`;
    if (score >= 90)
      return `황금 컨디션 — ${mainFish || "대물"} 입질 확률 최고! 지금 바로 출발하세요.`;
    if (score >= 75)
      return `우수 컨디션 — ${mainFish || "어류"} 활성 높음. 포인트 집중 공략으로 손맛 보세요.`;
    if (score < 30)
      return `출조 비권고 — 현재 기상·조건이 낚시에 매우 불리합니다. 다음 기회를 노리세요.`;
    if (isDawn && mainFish)
      return `새벽 돌풍 시간 — ${mainFish} 활성가 최고조! 해 뜨기 30분 전부터 준비하세요.`;
    if (isNight && (mainFish === "농어" || mainFish === "갈치" || mainFish === "볼락"))
      return `야간 피크 타임 — ${mainFish} 불빛 아래 집결합니다. 지금이 황금타임.`;
    if (month >= 3 && month <= 5 && mainFish)
      return `봄 시즌 — ${mainFish} 산란 직전 활성 최고조. 크릴+파래 혼합 미끼가 트립니다.`;
    if (month >= 9 && month <= 11 && mainFish)
      return `가을 대물 시즌 — ${mainFish} 대형급 기대! 밑밥으로 집중 투척하세요.`;
    return alertAdvice || null;
  };
  const dynamicAlert = getDynamicAlert();
  const getBaitTip = () => {
    const now = /* @__PURE__ */ new Date();
    const hour = now.getHours();
    const month = now.getMonth() + 1;
    const isNight = hour < 6 || hour >= 19;
    const wind = parseFloat(tideData.wind?.speed ?? 0);
    const wave = parseFloat(tideData.wave?.coastal ?? 0);
    const sst = parseFloat(tideData.sst ?? 14);
    const isStrong = wind > 5 || wave > 0.7;
    const isCold = sst < 12;
    const isWarm = sst >= 18;
    const fish = (selectedPoint?.fish || "").split(",")[0].trim() || "";
    if (isNight)
      return { icon: "🌙", text: "야간엔 야광 지렁이·형광 루어가 최고! 수면 가까이 띄워 공략하세요." };
    if (isStrong)
      return { icon: "🌊", text: `파고 ${wave}m · 풍속 ${wind}m/s — 무거운 봉돌로 고정하고 크릴 밀봉 채비가 유리합니다.` };
    if (score < 40)
      return { icon: "⚠️", text: "활성도가 낮아요. 갯지렁이 + 크릴 혼합 미끼로 냄새를 강하게 유인하세요." };
    if (score >= 90)
      return { icon: "🌟", text: "황금물때! 루어·지렁이 모두 효과 MAX. 참돔엔 핑크색 타이라바가 대박입니다." };
    if (fish.includes("감성돔"))
      return { icon: "🎣", text: "감성돔은 크릴+파래 혼합 미끼! 조류 방향 맞춰 흘림낚시가 효과적." };
    if (fish.includes("참돔"))
      return { icon: "🔴", text: "참돔 시즌 — 타이라바(핑크/오렌지) 80~120g으로 중층 탐색 추천." };
    if (fish.includes("루어") || fish.includes("부시리") || fish.includes("방어"))
      return { icon: "⚡", text: "회유어종 활성! 메탈지그 빠른 저킹 → 멈춤 콤보로 반사 입질 노리세요." };
    if (fish.includes("오징어") || fish.includes("한치"))
      return { icon: "🦑", text: "오징어엔 에기(3.5호) 핑크/보라 계열! 착저 후 천천히 올리는 리프트&폴 액션." };
    if (fish.includes("우럭") || fish.includes("볼락"))
      return { icon: "🐟", text: "저층 공략! 지렁이·새우 미끼로 바닥 천천히 끌어주세요. 갈색 루어도 효과적." };
    if (isCold)
      return { icon: "❄️", text: `수온 ${sst.toFixed(1)}°C 저수온 — 활성 낮음. 크릴을 천천히 흘려 냄새로 유인하세요.` };
    if (isWarm)
      return { icon: "♨️", text: `수온 ${sst.toFixed(1)}°C 고수온 — 표층 가까이에 물고기 밀집. 탑워터 루어 효과 UP!` };
    if (month >= 3 && month <= 5)
      return { icon: "🌸", text: "봄 시즌 — 산란 직전 감성돔 활성 최고조! 갯지렁이+집어제 조합 추천." };
    if (month >= 6 && month <= 8)
      return { icon: "☀️", text: "여름 — 새벽 골든타임! 표층 포퍼·페더지그로 부시리·방어 공략." };
    if (month >= 9 && month <= 11)
      return { icon: "🍂", text: "가을 대물 시즌 — 크릴+밑밥 집중 투척. 참돔·방어 대형급 기대!" };
    return { icon: "🎣", text: "크릴+지렁이 혼합 미끼로 다양한 어종을 공략해보세요!" };
  };
  const baitTip = getBaitTip();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { backgroundColor: "#F4F6FA", height: "100dvh", paddingTop: "env(safe-area-inset-top, 0px)", overflow: "hidden", display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
    width: "100%",
    maxWidth: "480px",
    backgroundColor: "#fff",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    boxShadow: "0 0 40px rgba(0,0,0,0.05)",
    fontFamily: "Pretendard, -apple-system, sans-serif"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { backgroundColor: "#fff", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F0F0F5", zIndex: 20, flexShrink: 0 }, children: viewMode === "map" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setViewMode("dashboard"), style: { display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", fontSize: `calc(14px * var(--fs, 1))`, fontWeight: "800", color: "#1565C0" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { size: 18 }),
        " 대시보드"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px", overflowX: "auto", scrollbarWidth: "none" }, children: [
        ["전체", "방파제", "갯바위", "항구", "민물"].map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setFilter(f), style: {
          padding: "5px 10px",
          borderRadius: "20px",
          border: "none",
          cursor: "pointer",
          fontSize: `calc(11px * var(--fs, 1))`,
          fontWeight: "800",
          flexShrink: 0,
          background: filter === f ? "#1565C0" : "#F0F2F7",
          color: filter === f ? "#fff" : "#555",
          transition: "all 0.2s"
        }, children: f }, f)),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              if (!canAccessPremium) {
                addToast("프리미엄 스마트 히트맵은 LITE 플랜 이상에서 제공됩니다.", "error");
                return;
              }
              setShowHeatmap(!showHeatmap);
              if (!showHeatmap)
                addToast("📡 실시간 해양 히트맵 분석을 완료했습니다.", "success");
            },
            style: {
              padding: "5px 12px",
              borderRadius: "20px",
              border: "1.5px solid #FF3B30",
              cursor: "pointer",
              fontSize: `calc(11px * var(--fs, 1))`,
              fontWeight: "900",
              flexShrink: 0,
              background: showHeatmap ? "#FF3B30" : "#fff",
              color: showHeatmap ? "#fff" : "#FF3B30",
              transition: "all 0.2s"
            },
            children: showHeatmap ? "🔥 히트맵 끄기" : `🔥 스마트 히트맵 (${isAdmin ? "MASTER" : "LITE+"})`
          }
        ),
        showHeatmap && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              const mode = heatmapMode === "sst" ? "score" : "sst";
              setHeatmapMode(mode);
              addToast(mode === "sst" ? "🌡️ 표층 수온 모드로 변경되었습니다." : "🎣 실시간 조황 점수 모드로 변경되었습니다.", "success");
            },
            style: {
              padding: "5px 12px",
              borderRadius: "20px",
              border: "1.5px solid #0056D2",
              cursor: "pointer",
              fontSize: `calc(11px * var(--fs, 1))`,
              fontWeight: "900",
              flexShrink: 0,
              background: "#0056D2",
              color: "#fff",
              transition: "all 0.2s"
            },
            children: heatmapMode === "sst" ? "🎣 조황 점수별 보기" : "🌡️ 표층 수온별 보기"
          }
        )
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Anchor, { size: 22, color: "#1565C0", strokeWidth: 2.5 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(19px * var(--fs, 1))`, fontWeight: "950", color: "#0056D2", letterSpacing: "-0.04em" }, children: "낚시GO" }),
        currentTier.label && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: currentTier.bg, fontSize: `calc(8px * var(--fs, 1))`, padding: "2px 7px", borderRadius: "20px", color: currentTier.color || "#fff", fontWeight: "900", marginLeft: "2px" }, children: currentTier.label })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "14px", alignItems: "center" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "800", color: "#1565C0", letterSpacing: "-0.02em", marginRight: "-6px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeaderClock, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(NotifBell, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            onClick: () => navigate("/mypage"),
            style: { position: "relative", cursor: "pointer" },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: user?.avatar || user?.picture || DEFAULT_AVATAR_SVG,
                  alt: "profile",
                  style: { width: "34px", height: "34px", borderRadius: "50%", border: "2px solid #E8F0FE", objectFit: "cover", transition: "transform 0.2s" },
                  onMouseEnter: (e) => e.currentTarget.style.transform = "scale(1.1)",
                  onMouseLeave: (e) => e.currentTarget.style.transform = "scale(1)"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { position: "absolute", bottom: 0, right: 0, width: "10px", height: "10px", background: "#00C48C", borderRadius: "50%", border: "1.5px solid #fff" } })
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: viewMode === "map" ? "flex" : "none", flex: 1, flexDirection: "column", position: "relative", overflow: "hidden" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { id: "kakao-map", style: { width: "100%", flex: 1, minHeight: "200px", background: "#e8edf5" } }),
      showHeatmap && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        position: "absolute",
        bottom: "16px",
        left: "12px",
        zIndex: 10,
        background: "rgba(255, 255, 255, 0.95)",
        border: "1.5px solid rgba(0,0,0,0.08)",
        borderRadius: "16px",
        padding: "12px 14px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
        backdropFilter: "blur(10px)",
        width: "220px"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(11.5px * var(--fs, 1))`, fontWeight: "900", color: "#1A1A2E" }, children: heatmapMode === "sst" ? "🌡 표층 수온(SST) 범례" : "🎣 AI 낚시지도 조황 점수" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(9px * var(--fs, 1))`, fontWeight: "800", background: isAdmin ? "#E60000" : "#FF3B30", color: "#fff", padding: "2px 6px", borderRadius: "8px" }, children: "PRO" })
        ] }),
        heatmapMode === "sst" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", width: "100%", height: "8px", borderRadius: "4px", overflow: "hidden", marginBottom: "6px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, background: "#1a3c8f" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, background: "#1565C0" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, background: "#29B6F6" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, background: "#26C6DA" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, background: "#66BB6A" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, background: "#FFCA28" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, background: "#FFA726" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, background: "#FF7043" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, background: "#B71C1C" } })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: `calc(9px * var(--fs, 1))`, fontWeight: "700", color: "#8E8E93" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "<8°C" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "(어종별 적정수온)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "24°C>" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: `calc(9px * var(--fs, 1))`, fontWeight: "800", color: "#555", marginTop: "2px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#1565C0" }, children: "저수온" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#FFA726" }, children: "🔥 최적 활성도" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#B71C1C" }, children: "고수온" })
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", width: "100%", height: "8px", borderRadius: "4px", overflow: "hidden", marginBottom: "6px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, background: "#D32F2F" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, background: "#FF7043" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, background: "#FFCA28" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, background: "#42A5F5" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, background: "#00E5A8" } })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: `calc(9px * var(--fs, 1))`, fontWeight: "700", color: "#8E8E93" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "0점" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "종합 낚시 점수" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "100점" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: `calc(9px * var(--fs, 1))`, fontWeight: "800", color: "#555", marginTop: "2px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#D32F2F" }, children: "출조 보류" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#FFCA28" }, children: "👌 무난함" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#00E5A8" }, children: "✨ 황금물때" })
          ] })
        ] })
      ] }),
      !mapLoaded && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F4F6FA", gap: "12px", zIndex: 10 }, children: mapLoadError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(40px * var(--fs, 1))` }, children: "🗺️" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: `calc(15px * var(--fs, 1))`, fontWeight: "900", color: "#1A1A2E" }, children: "카카오맵 API 키 필요" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: `calc(12px * var(--fs, 1))`, color: "#888", fontWeight: "700", textAlign: "center", lineHeight: 1.7, padding: "0 32px" }, children: [
          ".env.local 파일에 카카오 JavaScript 키를 입력하세요.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { style: { background: "#F0F0F0", padding: "2px 8px", borderRadius: "6px", fontSize: `calc(11px * var(--fs, 1))`, color: "#0056D2" }, children: "VITE_KAKAO_APP_KEY=여기에_키_입력" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              window.open("https://developers.kakao.com", "_blank");
            },
            style: { marginTop: "8px", padding: "10px 22px", background: "#FAE100", border: "none", borderRadius: "12px", fontSize: `calc(13px * var(--fs, 1))`, fontWeight: "900", cursor: "pointer", color: "#1A1A2E" },
            children: "카카오 개발자 콘솔 →"
          }
        )
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "40px", height: "40px", border: "3px solid #1565C0", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: `calc(13px * var(--fs, 1))`, color: "#8E8E93", fontWeight: "700" }, children: "지도 로딩 중…" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DashboardView,
      {
        viewMode,
        selectedPoint,
        tideData,
        precisionData,
        score,
        phase,
        isGolden,
        mainAdvice,
        alertAdvice,
        dynamicAlert,
        baitTip,
        scoreStyle,
        favorites,
        setViewMode,
        handlePointClick,
        canAccessPremium,
        showSecretPoints,
        setShowSecretPoints,
        addToast,
        weatherCache,
        PREMIUM_POINTS,
        recentPosts,
        user,
        isAdmin,
        currentTier,
        filter,
        setFilter,
        searchRef,
        searchQuery,
        setSearchQuery,
        searchResults,
        setSearchResults,
        showSearch,
        setShowSearch,
        handleSearch,
        DEFAULT_POINT,
        EMOJI_MAP,
        findNearestStation,
        evaluateFishingCondition,
        getPointSpecificData,
        setCctvData,
        setShowCCTV
      }
    ),
    showUpgradeModal && /* @__PURE__ */ jsxRuntimeExports.jsx(UpgradeModal, { onClose: () => setShowUpgradeModal(false) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      RewardGateModal,
      {
        isOpen: showRewardGate,
        context: "point",
        onClose: () => {
          setShowRewardGate(false);
          setPendingPoint(null);
        },
        onRewardComplete: () => {
          setShowRewardGate(false);
          if (pendingPoint) {
            _enterPoint(pendingPoint.point, pendingPoint.fromDashboard);
            setPendingPoint(null);
          }
        },
        onSubscribe: () => {
          setShowRewardGate(false);
          setShowUpgradeModal(true);
        }
      }
    ),
    sheetVisible && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        onClick: closeSheet,
        style: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1050, backdropFilter: "blur(2px)" }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      position: "absolute",
      bottom: sheetVisible ? 0 : "-100%",
      left: 0,
      width: "100%",
      background: "#fff",
      borderTopLeftRadius: "24px",
      borderTopRightRadius: "24px",
      transition: "bottom 0.38s cubic-bezier(0.34,1.56,0.64,1)",
      zIndex: 1100,
      maxHeight: "80%",
      overflowY: "auto"
    }, children: selectedPoint && /* @__PURE__ */ jsxRuntimeExports.jsx(
      FishingPointBottomSheet,
      {
        selectedPoint,
        onClose: closeSheet,
        onConditionReady: (cond2, pointId) => setSharedCond({ cond: cond2, pointId })
      }
    ) }),
    showCCTV && cctvData && /* @__PURE__ */ jsxRuntimeExports.jsx(
      CctvModal,
      {
        cctvData,
        selectedPoint,
        onClose: () => {
          setShowCCTV(false);
          setCctvData(null);
        }
      }
    ),
    isAdmin && selectedPoint && sheetVisible && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => setShowLocationEditor(true),
        style: {
          position: "absolute",
          bottom: "52%",
          right: "12px",
          zIndex: 1200,
          background: "linear-gradient(135deg, #1A1A2E, #0056D2)",
          border: "none",
          borderRadius: "50px",
          color: "#fff",
          fontWeight: "900",
          fontSize: "12px",
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          boxShadow: "0 4px 20px rgba(0,86,210,0.5)",
          cursor: "pointer",
          animation: "fadeInUp 0.3s ease"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 14 }),
          " 위치 수정"
        ]
      }
    ),
    showLocationEditor && selectedPoint && /* @__PURE__ */ jsxRuntimeExports.jsx(
      SpotLocationEditor,
      {
        spot: selectedPoint,
        onClose: () => setShowLocationEditor(false),
        onSaved: (updated) => {
          const key = String(updated.id);
          const newOv = { ...spotLocOverrides };
          if (updated.lat === updated._origLat && updated.lng === updated._origLng) {
            delete newOv[key];
          } else {
            newOv[key] = { lat: updated.lat, lng: updated.lng };
          }
          setSpotLocOverrides(newOv);
          setEffectiveAllPoints(ALL_FISHING_POINTS.map((p) => {
            const k = String(p.id);
            return newOv[k] ? { ...p, lat: newOv[k].lat, lng: newOv[k].lng } : p;
          }));
          setSelectedPoint(updated);
          setShowLocationEditor(false);
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
          @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
          @keyframes secretPulse { 0% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(255,215,0,0.9)); } 50% { transform: scale(1.25); filter: drop-shadow(0 0 16px rgba(255,215,0,1)) drop-shadow(0 0 6px rgba(255,160,0,1)); } 100% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(255,215,0,0.9)); } }
          input::placeholder { color: #AAB0BE; }
          ::-webkit-scrollbar { display: none; }
        ` })
  ] }) });
}

export { MapHome as default };
