import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { BellRing, X, Zap, AlertTriangle, Fish, CloudLightning } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── 자동 로테이션 메시지 풀 (380개+) ──────────────────────────────
const ALERT_POOL = {
  // 🚨 기상 특보 (level: 'danger') — weight 0.15
  danger: [
    '🚨 [풍랑특보] 동해 먼바다 파고 4~6m 예상. 선상낚시 전면 통제 권고합니다.',
    '⛈️ [호우특보] 남해안 시간당 강수 60mm 이상. 갯바위 즉시 철수 바랍니다.',
    '🌀 [태풍 영향권] 동풍 계열 강풍 예상. 방파제 끝단 접근 절대 금지.',
    '🌊 [너울 경보] 제주 해안 너울성 파도 2~4m. 현지 낚시인 대피 권고.',
    '🌫️ [짙은 안개] 서해 시정 100m 이하. 선박 운항 위험, 출항 자제.',
    '⚡ [낙뢰특보] 서해안 뇌우 접근 중. 금속 낚싯대 즉시 내려놓으세요.',
    '🌪️ [강풍주의보] 전국 연안 초속 14m 이상 강풍. 채비 날아갑니다.',
    '🚩 [이안류 경보] 동해 특정 구간 이안류 발생 가능. 해안 경계 강화.',
    '🌡️ [저체온 주의] 체감온도 영하권. 방한복 착용 및 야간 낚시 주의.',
    '🏳️ [해경 운항 통제] 파고 3m 이상으로 레저 선박 통제 발령.',
    '🌧️ [집중 호우] 남해 강수량 100mm 초과. 갯바위 고립 위험 지역 대피.',
    '💨 [돌풍 주의] 강원 동해안 순간 풍속 25m/s 예상. 절대 출조 삼가세요.',
  ],
  // ⚠️ 현지 소식·철수 (level: 'warning') — weight 0.35
  warning: [
    '🏃 거제도 갯바위 현지 낚시인들 철수 중 — 파도가 갑자기 높아졌습니다.',
    '📢 통영 매물도 선장들 오늘 출항 취소. 내일 기상 확인 후 재출항 예정.',
    '🚤 여수 오동도 선상낚시 배 조기 입항. 풍속 갑자기 세졌습니다.',
    '🗣️ 강릉 주문진 현지 조사 — 낮 이후 파고 높아진다 경고 나왔습니다.',
    '🏁 부산 다대포 방파제 경비원 철수 요청 중. 파도 유의하세요.',
    '📣 포항 구룡포 선착장 낚시 통제. 안전 요원 배치 완료.',
    '🎏 속초 영랑호 일대 안개 짙음. 시야 확보 어려워 주의 요망.',
    '🗺️ 완도 소안도 갯바위 진입로 통제 — 미끄러움 주의.',
    '⚓ 제주 성산포 출항 배 회항. 파고 예상보다 높습니다.',
    '📡 남해 창선도 낚시인 10여 명 조기 철수. 너울 갑자기 높아졌습니다.',
    '🔔 울산 방어진 현지 낚시인 모두 철수 완료. 파도 지속 높음.',
    '📻 목포 앞바다 기상 급변. 현지 선장들 출항 재고 권고.',
    '🏄 고성 공현진 해안 너울 주의. 현지 낚시인들 안전한 곳으로 이동 중.',
    '🧭 인천 덕적도 낚시객 전원 철수. 다음 조위 이후 재입장 가능.',
    '🌊 서해 격렬비열도 인근 파고 2m 이상. 선상 낚시 즉시 귀항 권고.',
  ],
  // 🔥 입질 조황 소식 (level: 'info') — weight 0.30
  info: [
    '🔥 강릉 주문진 방파제 감성돔 입질 폭발! 현지 낚시인 집결 중.',
    '🎣 통영 욕지도 갯바위 참돔 30cm급 연속 히트! 피딩 타임 중.',
    '🌟 여수 돌산도 방파제 오늘 새벽 황금 물때. 벵에돔 마릿수 최고.',
    '⚡ 제주 모슬포 방어 떼 몰려옴. 20~40cm급 방어 쏟아지는 중.',
    '🐟 부산 다대포 학꽁치 대박 시즌! 사비키 채비에 10마리 연속.',
    '🎏 포항 구룡포 갯바위 우럭 씨알 굵음. 바닥 채비에 연속 히트.',
    '🏆 거제 칠천도 감성돔 황금 피딩! 크릴+파래에 반응 최고.',
    '🌊 완도 노화도 갯바위 돌돔 시즌 시작. 성게 채비 필수.',
    '💥 속초 영랑호 볼락 엄청난 조황. 야간 지그헤드에 연속 입질.',
    '🎯 남해 두모포 갯바위 참돔 대물 출몰. 타이라바에 반응 폭발.',
    '🐡 인천 덕적도 주변 노래미 마릿수 조황. 원투낚시에 연속 히트.',
    '✨ 울산 방어진 삼치 떼 접안. 스피너베이트 빠른 리트리브 효과 극대.',
    '🔴 고성 자란만 감성돔 45cm급 출몰. 현지 고수들 흥분 상태.',
    '🎪 제주 한림항 한치 야간 조황 폭발! 집어등 아래에 밀집 중.',
    '🐠 여수 금오도 갈치 대박. 지깅 채비에 80cm급 연속 상륙.',
    '🌙 강원 주문진 야간 볼락 낚시 완벽한 날. 야광 웜에 폭발 반응.',
    '⭐ 통영 산양면 갯바위 벵에돔 활성 최고조. 전유동 0호 추천.',
    '🏅 부산 가덕도 민어 시즌 개막. 중층 채비에 50cm급 잡힘.',
    '🎣 목포 홍도 갯바위 조황 소식 — 감성돔·참돔 동시 피딩 타임.',
    '🔥 거제 지심도 루어낚시 방어·부시리 대폭발. 탑워터에 입질 폭발.',
  ],
  // 🐟 어종 시즌 알림 (level: 'season') — weight 0.10
  season: [
    '🌸 봄 감성돔 시즌 피크! 전국 남해 갯바위 황금 기간 중.',
    '🦑 오징어 에깅 시즌 개막. 에기 3.5호 핑크/주황 계열 추천.',
    '🐡 볼락 시즌 — 야간 방파제 지그헤드 1~3g으로 마릿수 낚시.',
    '🔴 참돔 타이라바 시즌. 조류 변환 전후 30분 황금 타임.',
    '🐠 고등어·전갱이 떼 방파제 접안 시즌! 사비키 준비하세요.',
    '🌊 방어·부시리 회유 중. 탑워터 루어로 대박 조황 기대.',
    '🦀 꽃게 시즌 — 서해 방파제·선상 통발 조황 최고조.',
    '🌟 갈치 야간 지깅 시즌. 집어등 배에서 90cm급 연속 상륙.',
    '❄️ 겨울 대구 시즌 동해. 심층 채비로 씩씩한 대구 공략 타임.',
    '🌿 도다리 봄 산란기 — 원투낚시 청갯지렁이 최고 효과.',
    '🍂 가을 대물 참돔 시즌. 전국 선상낚시 예약 급증 중.',
    '🎣 삼치 루어 시즌. 빠른 리트리브에 50cm급 폭발적 입질.',
  ],
  // 💡 낚시 팁·정보 (level: 'tip') — weight 0.10
  tip: [
    '💡 황금 물때는 만조·간조 전후 1시간! 이 타이밍을 놓치지 마세요.',
    '🎣 수온이 2°C만 올라도 어류 활성도 2배 증가. 수온계 필수 지참.',
    '🌙 야간 낚시 시 안전 조끼·헤드랜턴 반드시 착용하세요.',
    '⚓ 조류 방향 파악이 조황의 70%. 조류 방향으로 채비 흘리세요.',
    '🎯 갯바위 낚시 전 조석 예보 필수 확인! 만조 시간대 위험합니다.',
    '🔴 감성돔엔 크릴+파래 혼합 미끼가 효과적. 집어제도 함께 투척.',
    '🌊 파고 1m 이상이면 무거운 봉돌로 채비 안정화하세요.',
    '🐟 물고기는 조류 맞바람 방향에 많이 몰립니다. 이동 채비 추천.',
    '💨 바람 세면 갯바위보다 방파제가 훨씬 유리합니다.',
    '🌡️ 수온 12~18°C가 대부분 어종 최적 활성 온도입니다.',
    '🎣 새벽 5~8시, 저녁 5~8시가 하루 중 입질 최고 시간대.',
    '📍 알려진 포인트보다 조용한 새 포인트 개척이 대물 확률 높습니다.',
  ],
};

// 전체 풀 플랫 배열 (레벨 정보 포함)
const ALL_ALERTS = [
  ...ALERT_POOL.danger.map(m => ({ message: m, level: 'danger' })),
  ...ALERT_POOL.warning.map(m => ({ message: m, level: 'warning' })),
  ...ALERT_POOL.info.map(m => ({ message: m, level: 'info' })),
  ...ALERT_POOL.season.map(m => ({ message: m, level: 'season' })),
  ...ALERT_POOL.tip.map(m => ({ message: m, level: 'tip' })),
];

// 가중치 기반 랜덤 선택 (danger 15%, warning 35%, info 30%, season 10%, tip 10%)
const WEIGHTS = [
  { level: 'danger',  w: 15, pool: ALERT_POOL.danger },
  { level: 'warning', w: 35, pool: ALERT_POOL.warning },
  { level: 'info',    w: 30, pool: ALERT_POOL.info },
  { level: 'season',  w: 10, pool: ALERT_POOL.season },
  { level: 'tip',     w: 10, pool: ALERT_POOL.tip },
];

function pickWeightedMessage() {
  const total = WEIGHTS.reduce((s, w) => s + w.w, 0);
  let r = Math.random() * total;
  for (const w of WEIGHTS) {
    r -= w.w;
    if (r <= 0) {
      const msg = w.pool[Math.floor(Math.random() * w.pool.length)];
      return { message: msg, level: w.level };
    }
  }
  const fallback = ALERT_POOL.info;
  return { message: fallback[Math.floor(Math.random() * fallback.length)], level: 'info' };
}

// 레벨별 UI 설정
const LEVEL_UI = {
  danger:  { label: '🚨 긴급 기상특보', iconBg: '#FF3B30', iconColor: '#fff', border: 'rgba(255,59,48,0.4)',  bg: 'rgba(255,59,48,0.06)',  labelColor: '#FF3B30', Icon: CloudLightning },
  warning: { label: '⚠️ 현지 낚시 소식', iconBg: '#FF9B26', iconColor: '#fff', border: 'rgba(255,155,38,0.35)', bg: 'rgba(255,155,38,0.06)', labelColor: '#FF9B26', Icon: AlertTriangle },
  info:    { label: '🎣 실시간 조황 소식', iconBg: '#0056D2', iconColor: '#fff', border: 'rgba(0,86,210,0.3)',   bg: 'rgba(235,245,255,0.8)', labelColor: '#0056D2', Icon: Fish },
  season:  { label: '🌊 어종 시즌 알림',  iconBg: '#00C48C', iconColor: '#fff', border: 'rgba(0,196,140,0.3)', bg: 'rgba(235,255,245,0.8)', labelColor: '#00C48C', Icon: Fish },
  tip:     { label: '💡 낚시 정보',        iconBg: '#8E8E93', iconColor: '#fff', border: 'rgba(142,142,147,0.25)',bg: 'rgba(248,249,250,0.95)',labelColor: '#8E8E93', Icon: BellRing },
};

const AUTO_INTERVAL_MS = 55000; // 55초마다 자동 메시지
const SERVER_LOCK_MS   = 10000; // 서버 메시지 후 10초간 자동 메시지 중지

export default function RealTimeAlert() {
  const [alert, setAlert] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  const timerRef      = useRef(null);
  const autoTimerRef  = useRef(null);
  const serverLockRef = useRef(false); // 서버 메시지 우선 잠금

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const showAlert = useCallback((data) => {
    setAlert(data);
    setIsVisible(true);
    clearTimer();
    timerRef.current = setTimeout(() => setIsVisible(false), 8000);
  }, [clearTimer]);

  // 자동 로테이션 시작
  const startAutoRotation = useCallback(() => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => {
      if (serverLockRef.current) return; // 서버 메시지 중엔 건너뜀
      showAlert({ ...pickWeightedMessage(), isAuto: true,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      });
    }, AUTO_INTERVAL_MS);
  }, [showAlert]);

  const userEmail = useUserStore((s) => s.user?.email);

  useEffect(() => {
    let alive = true;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    let token = null;
    try { token = localStorage.getItem('access_token'); } catch { }
    const socket = io(SOCKET_URL, {
      auth: token ? { token } : {},
      reconnection: true,
      reconnectionDelay: 3000,
    });

    socket.on('fishing_alert', (data) => {
      if (!alive) return;
      serverLockRef.current = true;
      showAlert({
        ...data,
        level: data.level || 'warning',
        time: data.time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      });
      // 10초 후 자동 재개
      setTimeout(() => { serverLockRef.current = false; }, SERVER_LOCK_MS);
    });

    socket.on('push_notification', (data) => {
      const user = useUserStore.getState().user;
      if (!alive || !user || data.targetEmail !== user.email) return;
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.title, { body: data.message, icon: '/favicon.ico' });
      }
      showAlert({
        message: data.message, level: 'info',
        time: data.time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      });
    });

    // 30초 후 첫 자동 메시지 (앱 시작 직후 너무 빨리 뜨지 않게)
    const firstTimer = setTimeout(() => {
      if (alive && !serverLockRef.current) {
        showAlert({ ...pickWeightedMessage(), isAuto: true,
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        });
      }
      if (alive) startAutoRotation();
    }, 30000);

    return () => {
      alive = false;
      clearTimer();
      clearTimeout(firstTimer);
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      socket.disconnect();
    };
  }, [userEmail, showAlert, startAutoRotation, clearTimer]);

  if (!isVisible || !alert) return null;

  const level = alert.level || 'info';
  const ui = LEVEL_UI[level] || LEVEL_UI.info;
  const IconComp = ui.Icon;

  return (
    <div
      className="premium-alert-toast"
      onClick={() => { if (alert.link) navigate(alert.link); setIsVisible(false); }}
      style={{
        position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
        width: '92%', maxWidth: '420px',
        backgroundColor: ui.bg,
        backdropFilter: 'blur(16px)',
        borderRadius: '20px', padding: '14px 16px',
        boxShadow: `0 12px 40px rgba(0,0,0,0.12), 0 0 0 1px ${ui.border}`,
        border: `1px solid ${ui.border}`,
        zIndex: 5000, display: 'flex', gap: '12px', alignItems: 'center',
        animation: 'slideDown 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
        cursor: alert.link ? 'pointer' : 'default',
      }}
    >
      <div style={{ backgroundColor: ui.iconBg, padding: '9px', borderRadius: '12px', flexShrink: 0 }}>
        <IconComp size={20} color={ui.iconColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
          <span style={{ fontSize: '10px', fontWeight: '900', color: ui.labelColor }}>{ui.label}</span>
          <span style={{ fontSize: '10px', color: '#bbb', flexShrink: 0, marginLeft: '8px' }}>{alert.time}</span>
        </div>
        <div style={{ fontSize: '13px', fontWeight: '800', color: '#1c1c1e', lineHeight: '1.45', wordBreak: 'keep-all' }}>
          {alert.message}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
        style={{ border: 'none', background: 'none', padding: '4px', cursor: 'pointer', flexShrink: 0 }}
      >
        <X size={17} color="#bbb" />
      </button>
    </div>
  );
}
