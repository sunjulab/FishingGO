// ✅ META-GAME (2026-11-04): 낚시 게임 화면. 게임은 public/meta/game.html(같은 출처라 로그인 토큰 localStorage 공유)
// 게임 안 '낚시GO로' 버튼 → postMessage('meta-exit') → 이전 화면으로
import React, { useEffect, useMemo, useRef } from 'react';

// ✅ META-PAY-TOP (2026-11-08, #62): 모바일에서 게임(iframe)이 결제를 요청하면 맨 위 창에서 포트원 V2 결제창을 연다.
// iframe 안에서는 PG 페이지·카드앱 전환이 막히는 경우가 있어서다. 비밀값은 오가지 않는다(storeId·channelKey는 공개 값, 금액·계정은 서버가 포트원 조회로 다시 확인).
// 요청 필드 이름: 포트원 V2 브라우저 SDK requestPayment(storeId, channelKey, paymentId, orderName, totalAmount, currency, payMethod, customData, windowType, redirectUrl)
const PORTONE_SDK = 'https://cdn.portone.io/v2/browser-sdk.js';
const PAY_AMOUNTS = [1000, 3000, 5000, 10000, 30000, 50000, 9900]; // 충전 6종 + 24시간 이용권(게임 TOPUP·PASS_PRICE와 같음)
let portoneLoad = null;
function loadPortOne() {
  if (window.PortOne) return Promise.resolve(window.PortOne);
  if (portoneLoad) return portoneLoad;
  portoneLoad = new Promise((ok, no) => {
    const s = document.createElement('script');
    s.src = PORTONE_SDK;
    s.onload = () => (window.PortOne ? ok(window.PortOne) : no(new Error('sdk')));
    s.onerror = () => { portoneLoad = null; no(new Error('sdk')); };
    document.head.appendChild(s);
  });
  return portoneLoad;
}
function payReqOk(r) {
  if (!r || typeof r !== 'object') return null;
  const str = (v, re) => typeof v === 'string' && re.test(v);
  if (!str(r.storeId, /^store-[\w-]{8,64}$/) || !str(r.channelKey, /^channel-key-[\w-]{8,80}$/)) return null;
  if (!str(r.paymentId, /^(topup|auto24)-\d{10,16}-[a-z0-9]{1,12}$/)) return null;
  if (typeof r.orderName !== 'string' || !r.orderName || r.orderName.length > 60) return null;
  if (!Number.isInteger(r.totalAmount) || !PAY_AMOUNTS.includes(r.totalAmount)) return null;
  if ((r.totalAmount === 9900) !== r.paymentId.startsWith('auto24-')) return null;
  if (r.currency !== 'KRW' || r.payMethod !== 'CARD') return null;
  // FIXUP2 LEGAL-4: 포트원 V2 SDK customData는 객체(Record<string, any>) — 문자열로 넘기면 두 번 인코딩될 수 있다. 정해진 키(uid·item·p)만 받는다
  const cd = r.customData; if (!cd || typeof cd !== 'object' || Array.isArray(cd)) return null;
  if (Object.keys(cd).some(k => !['uid', 'item', 'p'].includes(k)) || typeof cd.uid !== 'string' || !cd.uid || cd.uid.length > 128 || !['topup', 'auto24'].includes(cd.item)) return null;
  if ((cd.item === 'auto24') !== r.paymentId.startsWith('auto24-') || (cd.item === 'topup' ? cd.p !== r.totalAmount : cd.p !== undefined)) return null;
  const customData = cd.item === 'topup' ? { uid: cd.uid, item: 'topup', p: cd.p } : { uid: cd.uid, item: 'auto24' };
  return {
    storeId: r.storeId, channelKey: r.channelKey, paymentId: r.paymentId, orderName: r.orderName,
    totalAmount: r.totalAmount, currency: 'KRW', payMethod: 'CARD', customData,
    windowType: { pc: 'IFRAME', mobile: 'REDIRECTION' },
    redirectUrl: window.location.origin + '/meta?pay=return',
  };
}
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function MetaGame() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const src = useMemo(() => {
    const q = new URLSearchParams({ embed: '1' });
    ['spot', 'view'].forEach((k) => { const v = params.get(k); if (v && /^[\w가-힣-]{1,20}$/.test(v)) q.set(k, v); }); // view=draw(협찬 선물 추첨)·gold(황금 물고기)
    // ✅ META-PAY-RETURN (2026-11-07): 모바일 결제(리디렉션)가 /meta로 돌아오면 결제 결과를 게임으로 넘긴다(형식 확인 후)
    const PAYQ = { pay: /^(done|return)$/, paymentId: /^(topup|auto24)-\d{10,16}-[a-z0-9]{1,12}$/, code: /^[\w.-]{1,40}$/ };
    Object.keys(PAYQ).forEach((k) => { const v = params.get(k); if (v && PAYQ[k].test(v)) q.set(k, v); });
    const msg = params.get('message'); if (msg && q.get('code')) q.set('message', msg.slice(0, 200));
    return '/meta/game.html?' + q.toString();
  }, [params]);

  // ✅ META-EXIT-FIX (2026-11-07): 한 번만 처리. 게임(iframe)이 쌓은 기록(depth, 0~1)까지 함께 되돌린다.
  // history.length는 iframe 기록까지 세므로 쓰지 않고 React Router의 idx(첫 화면이면 0)로 판단
  const exitingRef = useRef(false);
  useEffect(() => {
    const onMsg = (e) => {
      if (e.origin !== window.location.origin) return;
      // ✅ META-PLAN (2026-11-16, V50): 게임의 '멤버십 보기' → 낚시GO PRO 멤버십 화면(자동 낚시 2배는 멤버십 혜택 · 게임 안 판매 없음)
      if (e.data && e.data.type === 'meta-plan') { navigate('/vvip-subscribe'); return; }
      if (!e.data || e.data.type !== 'meta-exit' || exitingRef.current) return;
      exitingRef.current = true;
      setTimeout(() => { exitingRef.current = false; }, 3000);
      const depth = Math.min(1, Math.max(0, e.data.depth | 0));
      if ((window.history.state?.idx || 0) > 0) window.history.go(-(depth + 1));
      else if (depth) {
        // 첫 화면(/meta로 바로 들어옴)인데 게임이 기록 1개를 쌓았으면 먼저 그 기록을 지우고 첫 화면으로 바꾼다(뒤로가기가 한 번 헛돌지 않게)
        let moved = false;
        const go = () => { if (moved) return; moved = true; window.removeEventListener('popstate', go); navigate('/', { replace: true }); };
        window.addEventListener('popstate', go);
        setTimeout(go, 800);
        window.history.go(-1);
      } else navigate('/', { replace: true });
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [navigate]);

  // ✅ META-PAY-TOP: 게임 → {type:'meta-pay', req} → 확인 → 'meta-pay-ack' → requestPayment. 모바일은 redirectUrl로 /meta에 돌아오고(META-PAY-RETURN이 결과를 iframe에 넘김),
  // 결제창이 응답을 돌려주면(PC·일부 결제수단) 'meta-pay-result'로 게임에 알린다. 형식이 틀리면 'meta-pay-fail'
  const frameRef = useRef(null);
  const payingRef = useRef(false);
  useEffect(() => {
    const onPay = async (e) => {
      if (e.origin !== window.location.origin || !e.data || e.data.type !== 'meta-pay') return;
      const fw = frameRef.current && frameRef.current.contentWindow;
      if (!fw || e.source !== fw) return;
      const pid = e.data.req && typeof e.data.req.paymentId === 'string' ? e.data.req.paymentId.slice(0, 80) : '';
      const reply = (m) => { try { fw.postMessage(m, window.location.origin); } catch (x) { /* iframe 사라짐 */ } };
      const req = payReqOk(e.data.req);
      if (!req) { reply({ type: 'meta-pay-fail', paymentId: pid, message: '결제 요청 형식이 올바르지 않습니다' }); return; }
      if (payingRef.current) { reply({ type: 'meta-pay-fail', paymentId: pid, message: '이미 결제 창이 열려 있습니다' }); return; }
      payingRef.current = true;
      reply({ type: 'meta-pay-ack', paymentId: req.paymentId });
      try {
        const PortOne = await loadPortOne();
        const resp = await PortOne.requestPayment(req);
        if (resp) reply({ type: 'meta-pay-result', paymentId: resp.paymentId || req.paymentId, code: resp.code != null ? String(resp.code) : null, message: resp.message ? String(resp.message).slice(0, 200) : '' });
      } catch (x) {
        reply({ type: 'meta-pay-fail', paymentId: req.paymentId, message: '결제 모듈을 불러오지 못했습니다' });
      } finally { payingRef.current = false; }
    };
    window.addEventListener('message', onPay);
    return () => window.removeEventListener('message', onPay);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: '#0b161d' }}>
      <iframe
        ref={frameRef}
        title="낚시게임"
        src={src}
        style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
        allow="autoplay; fullscreen; payment"
      />
    </div>
  );
}
