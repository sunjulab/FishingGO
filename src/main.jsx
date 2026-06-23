// ??18TH-A1: React.StrictMode??紐낆떆??媛앹껜 李몄“?대?濡?import ?꾩닔 ??JSX transform怨?蹂꾧컻
import React from 'react';
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ??AUTO-UPDATE: 諛고룷 ?쒕쭏??version.json ?먮룞 ?앹꽦 ?????쒖옉 ??泥댄겕 ??援щ쾭?꾩씠硫?媛뺤젣 ?덈줈怨좎묠
// ?꾩씠??Safari ??/ ?덈뱶濡쒖씠??Chrome ??/ APK WebView 紐⑤몢 ?묐룞 (???ㅼ튂 遺덊븘??
async function checkVersion() {
  try {
    // ?t=timestamp 濡?CDN/釉뚮씪?곗? 罹먯떆 ?꾩쟾 ?고쉶
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return; // ?뚯씪 ?놁쑝硫?臾댁떆
    const { version } = await res.json();
    if (!version) return;

    const stored = localStorage.getItem('app_version');
    if (stored && stored !== version) {
      // ????踰꾩쟾 媛먯? ??localStorage ?낅뜲?댄듃 ??媛뺤젣 ?덈줈怨좎묠
      localStorage.setItem('app_version', version);
      // location.reload(true) ??deprecated ??location.href ?ы븷?뱀쑝濡??섎뱶 由щ줈??
      window.location.href = window.location.href.split('?')[0] + '?reload=' + version;
      return; // 由щ줈??以????댄븯 ?뚮뜑 肄붾뱶 ?ㅽ뻾 ????
    }
    // 理쒖큹 諛⑸Ц ?먮뒗 理쒖떊 踰꾩쟾 ?????
    localStorage.setItem('app_version', version);
  } catch (_) {
    // ?ㅽ봽?쇱씤 ?먮뒗 fetch ?ㅽ뙣 ??臾댁떆?섍퀬 ?뺤긽 ?ㅽ뻾
  }
}

// 踰꾩쟾 泥댄겕 ???뚮뜑 (checkVersion??reload ?섎㈃ ?댄썑 肄붾뱶 誘몄떎??
checkVersion().finally(() => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );

  // ??PRELOADER: React 留덉슫???꾨즺 ??濡쒕뵫 ?붾㈃ ?쒓굅
  const preloader = document.getElementById('app-preloader');
  if (preloader) {
    preloader.style.transition = 'opacity 0.3s';
    preloader.style.opacity = '0';
    setTimeout(() => preloader.remove(), 300);
  }
});

