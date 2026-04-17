/**
 * 낚시GO - 정밀 낚시 점수 평가 엔진 v2.0
 *
 * 개선 사항:
 * 1. 어종별 특보 4종 → 24종으로 확대
 * 2. 물때(사리/조금) 점수 반영
 * 3. 계절 보정 (봄/여름/가을/겨울)
 * 4. 야간 낚시 시간대 보정
 * 5. 지점 유형별 보정 (방파제/갯바위/항구)
 * 6. 조언 메시지 대폭 확대
 */

// ── 조언 데이터베이스 ──────────────────────────────────────────
const ADVICE_DB = {
  PERFECT: [
    "지금 당장 캐스팅하세요. 이런 날 꽝치면 낚시 접어야 합니다.",
    "용왕님이 보우하사, 기록 갱신 99% 확정인 날씨입니다.",
    "낚싯대만 담가도 입질 옵니다. 옆 사람 부러워할 준비나 하세요.",
    "기막힌 물때! 예민한 찌낚시에 대물이 바로 반응할 겁니다.",
    "기름값이 전혀 아깝지 않은 황금 물때와 수온의 조화입니다.",
    "올해 최고의 출조 날입니다. 나중에 후회하지 말고 지금 떠나세요.",
    "전설급 컨디션. SNS에 올릴 사진 여러 장 준비하세요.",
  ],
  GOOD: [
    "충분히 손맛 볼 가능성이 높습니다. 집중력만 잃지 마세요.",
    "나쁘지 않은 상황입니다. 하지만 입질이 약할 수 있으니 예민하게 대응하세요.",
    "수온이 적당합니다. 미끼 운용만 잘하면 살림통 꽉 채웁니다.",
    "바람이 약간 있지만 채비 정렬에 문제없는 수준입니다.",
    "물고기들 활성도가 올라오고 있습니다. 피딩 타임을 노리세요.",
    "입질은 있으나 간헐적입니다. 포인트 이동보다는 인내심이 관건.",
    "준수한 컨디션이지만 방심 금물. 채비 점검 한 번 더 하세요.",
  ],
  NORMAL: [
    "평범한 하루입니다. 실력 80% 운 20%가 조과를 결정할 겁니다.",
    "가면 고생은 안 하겠지만, 대물을 기대하기엔 물때가 아쉽습니다.",
    "수온은 괜찮은데 바람이 낚시를 방해하네요. 채비를 무겁게 하세요.",
    "고기는 있지만 입을 닫았습니다. 유인력이 강한 미끼를 쓰세요.",
    "그냥 바람 쐬러 간다 생각하면 마음 편한 그런 날입니다.",
    "빈 살림통 들고 올 확률 50%. 기대치를 조금 낮추는 게 좋겠습니다.",
    "조황보다는 포인트 답사 목적으로 가면 실망은 없겠습니다.",
  ],
  POOR: [
    "기름값 버릴 확률 80%입니다. 기대치를 0으로 낮추세요.",
    "저수온으로 물고기들이 활동을 멈췄습니다. 꽝 칠 확률이 매우 높습니다.",
    "강한 바람이 채비를 다 날려버립니다. 낚시가 불가능할 정도입니다.",
    "입구가 텅 비어있을 겁니다. 조황 지도에도 소식이 없네요.",
    "차라리 집에서 장비 닦는 게 정신 건강에 이로운 날입니다.",
    "오늘의 주인공은 물고기입니다. 낚시꾼은 들러리.",
    "현지 낚시인들도 일찍 철수한다는 소식이 들립니다.",
  ],
  DANGER: [
    "뉴스에 나오고 싶으신가요? 너울성 파도가 위험한 수위입니다.",
    "초속 14m 강풍! 장비가 부러지는 게 아니라 당신이 날아갈 수 있습니다.",
    "해안가 접근 금지! 용왕님이 당신을 부르고 있습니다. 대피하세요.",
    "살아서 돌아오는 게 승리인 날씨입니다. 출조하지 마십시오.",
    "해경에 신고될 수 있습니다. 현재 기상특보 발효 중입니다.",
  ],
};

// ── 어종별 특보 데이터베이스 (24종) ────────────────────────────
const FISH_ALERTS = {
  '감성돔':    { alert: '현재 감성돔은 바닥에 바짝 붙었습니다. 바닥층 공략이 필수입니다.',       gear: '0~G2 찌낚시, 목줄 1.5호 이하' },
  '무늬오징어':{ alert: '에깅하기엔 너울이 심해 액션이 무너질 우려가 큽니다.',                   gear: 'Eg 3.5호 가을 컬러, 저크&폴 액션' },
  '벵에돔':    { alert: '벵에돔이 상층까지 부상하기 좋은 수온입니다. 전유동을 추천합니다.',       gear: '전유동 0호, 짧은 목줄(0.8~1호)' },
  '우럭':      { alert: '암초 사이에 짱박혀 있으니 과감한 싱커 운용이 필요합니다.',               gear: '지그헤드 14~21g, 슬러그 웜' },
  '농어':      { alert: '농어는 야간 서프에서 입질이 폭발합니다. 루어 캐스팅을 노리세요.',        gear: '미노우 110~130mm, 빠른 리트리브' },
  '방어':      { alert: '현재 수온에서 방어 떼가 표층 부근에 있을 가능성이 높습니다.',            gear: '15~40g 지그, 탑워터 펜슬' },
  '참돔':      { alert: '참돔은 조류가 바뀌는 전후 30분이 황금 타임입니다.',                     gear: '타이라바 60~100g, 슬로우 롤' },
  '부시리':    { alert: '부시리 떼가 물 표층에서 먹이 사냥을 하고 있습니다. 빠른 액션으로!',      gear: '탑워터 120~150mm, 강한 저킹' },
  '볼락':      { alert: '볼락은 야간 방파제 불빛 주변에 집결합니다. 해가 진 후를 노리세요.',      gear: '지그헤드 1~3g, 마이크로 웜' },
  '가자미':    { alert: '가자미는 모래 바닥층에 붙어 있습니다. 원투낚시가 최적입니다.',           gear: '원투낚시 50~80g 싱커, 청갯지렁이' },
  '학꽁치':    { alert: '학꽁치 떼가 표층 가까이 올라와 있습니다. 반층 채비를 노리세요.',         gear: '막대찌 전유동, 크릴 새우 미끼' },
  '삼치':      { alert: '삼치는 현재 빠른 스피드의 루어에 반응이 좋습니다..',                    gear: '스피너베이트, 빠른 리트리브' },
  '광어':      { alert: '광어는 바닥 레인지가 핵심입니다. 바닥을 긁는 느낌으로 리트리브 하세요.', gear: '플로팅 미노우+바닥 끌기, 지그헤드 21g' },
  '돌돔':      { alert: '돌돔은 갯바위 틈새 공략이 핵심입니다. 강한 채비가 필요합니다.',          gear: '돌돔 전용 채비 5~7호 목줄, 성게·소라' },
  '전갱이':    { alert: '전갱이 떼가 중층에 포진 중입니다. 사비키 채비가 가장 효과적입니다.',     gear: '사비키 4~6호, 집어등 필수' },
  '쭈꾸미':    { alert: '쭈꾸미는 물이 탁할 때 선명한 컬러 에기에 반응이 좋습니다.',              gear: '1.8~2.5호 에기, 핑크/오렌지 컬러' },
  '갈치':      { alert: '갈치는 야간 집어등 아래가 주요 포인트입니다. 야간 출조를 노리세요.',     gear: '지깅 채비, 갈치 전용 바늘 3~5호' },
  '숭어':      { alert: '숭어는 조류가 느릴수록 경계심이 높습니다. 최대한 가는 라인 사용 권장.',  gear: '찌낚시 0호, 목줄 1호 이하' },
  '한치':      { alert: '한치는 제주 밤바다의 집어등 주변에서 활발합니다. 여름 야간이 피크.',     gear: '한치 전용 에기 3~3.5호, 저속 폴링' },
  '전어':      { alert: '전어 시즌입니다. 방파제 인근에 떼가 몰려 있을 가능성이 높습니다.',       gear: '사비키 소형, 빵가루 집어제' },
  '도다리':    { alert: '도다리는 봄 산란기에 가장 활발합니다. 바닥 원투낚시로 공략하세요.',      gear: '원투낚시 3개 바늘, 청갯지렁이' },
  '고등어':    { alert: '고등어 떼가 표층을 유영 중입니다. 사비키나 루어로 쉽게 잡힙니다.',       gear: '사비키 6~8호, 루어 솔트웜' },
  '뱅에돔':    { alert: '뱅에돔은 조류가 흐르는 여울목에 집중됩니다. 찌 흘림 기술이 관건.',       gear: '0~B호 구멍찌, 목줄 1~1.5호' },
  '이면수':    { alert: '이면수는 겨울 동해 얕은 여에서 주로 낚입니다. 바닥 채비 위주로.',        gear: '바닥 채비 2~3호, 오징어/밀웜' },
};

// ── 물때 점수표 ────────────────────────────────────────────────
// 사리(6~8물)는 조류 강해서 고점, 조금(13~14물)은 조류 약해서 저점
const TIDE_BONUS = {
  '1물': +3, '2물': +5, '3물': +7, '4물': +9, '5물': +10,
  '6물': +10, '7물': +8, '8물': +6, '9물': +4, '10물': +2,
  '11물': -2, '12물': -4, '13물': -6, '14물': -8, '15물': -6,
  '7물(사리)': +8, '13물(조금)': -7, '14물(무시)': -9,
};

// ── 계절 수온 적정 범위 ─────────────────────────────────────────
const getSeasonalBonus = (sst) => {
  const month = new Date().getMonth() + 1; // 1~12
  // 봄(3~5): 수온 10~18도 적정
  // 여름(6~8): 수온 18~26도 적정
  // 가을(9~11): 수온 16~22도 적정
  // 겨울(12~2): 수온 8~14도 적정
  const seasons = {
    spring: { min: 10, max: 18, months: [3,4,5] },
    summer: { min: 18, max: 26, months: [6,7,8] },
    autumn: { min: 16, max: 22, months: [9,10,11] },
    winter: { min:  8, max: 14, months: [12,1,2] },
  };
  for (const [, s] of Object.entries(seasons)) {
    if (s.months.includes(month)) {
      if (sst >= s.min && sst <= s.max) return +8;
      if (sst < s.min - 4 || sst > s.max + 4) return -15;
      return 0;
    }
  }
  return 0;
};

// ── 야간 보정 ───────────────────────────────────────────────────
const getNightBonus = (point) => {
  const hour = new Date().getHours();
  const isNight = hour >= 19 || hour < 5;
  if (!isNight) return 0;
  // 밤낚시에 유리한 어종 포인트
  const nightFriendly = ['농어','갈치','볼락','한치','전갱이'];
  const mainFish = (point.fish || '').split(',')[0].trim();
  if (nightFriendly.includes(mainFish)) return +12;
  return -3; // 야간에 불리한 어종은 소폭 감점
};

// ── 지점 유형 보정 ──────────────────────────────────────────────
const getTypeBonus = (type, wind) => {
  // 갯바위: 바람에 취약, 방파제: 약간 방어, 항구: 가장 안전
  if (type === '갯바위' && wind > 5) return -8;
  if (type === '항구' && wind > 6) return +5; // 항구는 바람막이 효과
  return 0;
};

// ── TAG 풀 ─────────────────────────────────────────────────────
const TAG_POOL = [
  '🔥 활성도폭발', '✅ 장판수준', '🌟 대물주의', '🎣 피딩타임', '👍 준수한날씨',
  '💨 약한바람', '🌡️ 적정수온', '🌙 밤낚시적기', '🌊 너울주의', '🚨 강풍경보',
  '💤 입질전무', '🥶 저수온쇼크', '📉 조과하락', '💀 철수권고', '🌪️ 생존낚시',
  '🌸 봄 시즌 피크', '🏖️ 여름 대물 기대', '🍂 가을 황금어장', '❄️ 겨울 심층 공략',
  '🌊 사리 물때', '😴 조금 물때', '🌃 야간 낚시 적기', '⚡ 피딩 30분 전',
];

/**
 * 낚시 점수 계산 (v2.0)
 * @param {Object} data - 날씨 데이터 (sst, wind, wave, tide 등)
 * @param {Object} point - 지점 정보 (id, name, type, fish 등)
 */
export const calculateFishingScore = (data, point = {}) => {
  if (!data) return 45; // 데이터 없음 = 불확실 → 보수적으로

  // [1] 지점 고유 시드 (포인트마다 다른 특성)
  const pointKey = `${point.id || '0'}-${point.name || 'default'}-${data.stationId || 'DT_0001'}`;
  const seed = pointKey.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const microVar = ((seed % 14) - 7) / 10; // -0.7 ~ +0.7 (미세 변동 축소)

  // [2] 베이스 점수: 45 (중립 = NORMAL 하단)
  // 모든 날씨가 완벽해야 GOOD(75+) 도달, PERFECT(90+)는 극히 드물어야 함
  let score = 45 + (seed % 10) + microVar; // 45~55 범위에서 시작

  // [3] 풍속 보정 — 4m/s 이상부터 페널티, 한국 봄 평균 4~6m/s
  const wind = parseFloat(data.wind?.speed || 5.0);
  if      (wind > 14)  score -= 65;
  else if (wind > 10)  score -= 40;
  else if (wind >  8)  score -= 28;
  else if (wind >  6)  score -= 18; // 6m/s 이상: 일반인 낚시 불편
  else if (wind >  4)  score -= 8;  // 4~6m/s: 약간 불편
  else if (wind <  2)  score += 12; // 무풍: 드문 최적 조건
  else if (wind <  3)  score += 7;  // 미풍

  // [4] 파고 보정 — 한국 봄 연안 평균 0.5~1.0m
  const wave = parseFloat(data.wave?.coastal || 0.8);
  if      (wave > 2.5) score -= 60;
  else if (wave > 2.0) score -= 45;
  else if (wave > 1.5) score -= 30;
  else if (wave > 1.2) score -= 20;
  else if (wave > 0.8) score -= 10; // 0.8~1.2m: 낚시 가능하나 불편
  else if (wave < 0.3) score += 8;
  else if (wave < 0.5) score += 4;

  // [5] 수온 보정 — 4월 한국 실제 수온: 동해 11-14°C / 서해 9-12°C / 남해 13-17°C
  const sst = parseFloat(data.sst || 13);
  if      (sst < 8)               score -= 40; // 극저수온: 물고기 동면 수준
  else if (sst < 11)              score -= 25; // 저수온: 입질 거의 없음
  else if (sst < 14)              score -= 12; // 4월 동해: 아직 차가움
  else if (sst < 17)              score -= 3;  // 봄 남해: 회복 중
  else if (sst >= 17 && sst < 20) score += 10; // 최적 수온대
  else if (sst >= 20 && sst < 24) score += 6;  // 좋은 수온
  else if (sst >= 24 && sst < 27) score -= 5;  // 고수온 시작, 어종 따라 다름
  else if (sst >= 27)             score -= 25; // 고수온 쇼크

  // [6] 계절 보정
  score += getSeasonalBonus(sst);

  // [7] 물때 보정
  const tidePhase = data.tide?.phase || '';
  const tideKey = Object.keys(TIDE_BONUS).find(k => tidePhase.includes(k.replace('물(사리)','').replace('물(조금)','').replace('물(무시)',''))) || tidePhase;
  score += TIDE_BONUS[tidePhase] || TIDE_BONUS[tideKey] || 0;

  // [8] 야간 보정
  score += getNightBonus(point);

  // [9] 지점 유형 보정
  score += getTypeBonus(point.type, wind);

  return Math.min(100, Math.max(5, Math.round(score)));
};

/**
 * 낚시 조건 종합 평가
 */
export const evaluateFishingCondition = (data, point = {}) => {
  const score = calculateFishingScore(data, point);
  const pointKey = `${point.id || '0'}-${point.name || 'default'}-${data.stationId || 'DT_0001'}`;
  const seed = pointKey.split('').reduce((a, b) => a + b.charCodeAt(0), 0);

  let result = { score, color: '#8e8e93', status: 'NORMAL', advice: '', tags: [], gear: '', fishAlert: null };

  if (score >= 90) {
    result.status = 'PERFECT';
    result.color  = '#00C48C';
    result.advice = ADVICE_DB.PERFECT[seed % ADVICE_DB.PERFECT.length];
    result.gear   = '예민한 0~G2 찌낚시 채비로 아주 가볍게 공략하는 것을 추천합니다.';
  } else if (score >= 75) {
    result.status = 'GOOD';
    result.color  = '#0056D2';
    result.advice = ADVICE_DB.GOOD[seed % ADVICE_DB.GOOD.length];
    result.gear   = '여유를 가지고 목줄을 길게 써서 자연스러운 미끼 연출에 집중하세요.';
  } else if (score >= 50) {
    result.status = 'NORMAL';
    result.color  = '#FF9B26';
    result.advice = ADVICE_DB.NORMAL[seed % ADVICE_DB.NORMAL.length];
    result.gear   = '바람에 밀리지 않도록 고부력 찌(1호 이상)와 수중찌 조합이 필요합니다.';
  } else if (score >= 30) {
    result.status = 'POOR';
    result.color  = '#FF5A5F';
    result.advice = ADVICE_DB.POOR[seed % ADVICE_DB.POOR.length];
    result.gear   = '캐스팅 연습이라 생각하세요. 전유동보다는 반유동이나 원투 낚시가 유리합니다.';
  } else {
    result.status = 'DANGER';
    result.color  = '#D32F2F';
    result.advice = ADVICE_DB.DANGER[seed % ADVICE_DB.DANGER.length];
    result.gear   = '낚시용품 대신 구명센터 연락처를 확인하세요. 즉시 철수해야 합니다.';
  }

  // 어종별 특보 (24종)
  const mainFish = (point.fish || data.fish || '').split(',')[0].trim();
  const fishData = FISH_ALERTS[mainFish];
  if (fishData) {
    result.advice += ` \n[특보] ${fishData.alert}`;
    result.fishAlert = { fish: mainFish, alert: fishData.alert, gear: fishData.gear };
    // 어종별 채비 정보도 병합
    if (score >= 50) result.gear = `[${mainFish}] ${fishData.gear}`;
  }

  // 태그 2개 (지점 고유 조합)
  const tagIndices = [seed % TAG_POOL.length, (seed + 9) % TAG_POOL.length];
  result.tags = tagIndices.map(idx => TAG_POOL[idx]);

  return result;
};

/**
 * 점수 등급 정보 반환
 */
export const getScoreInfo = (score) => {
  if (score >= 90) return { label: 'PERFECT', color: '#00C48C', emoji: '🏆' };
  if (score >= 75) return { label: 'GOOD',    color: '#0056D2', emoji: '🎣' };
  if (score >= 50) return { label: 'NORMAL',  color: '#FF9B26', emoji: '😐' };
  if (score >= 30) return { label: 'POOR',    color: '#FF5A5F', emoji: '😞' };
  return              { label: 'DANGER',      color: '#D32F2F', emoji: '☠️' };
};

/**
 * 포인트 동적 점수 계산 (정적 score 대체용)
 * fishingData.js의 하드코딩 score를 대체하여 실시간 점수 반환
 */
export const getDynamicPointScore = (point) => {
  const { getPointSpecificData } = require('../constants/fishingData');
  const data = getPointSpecificData(point);
  return calculateFishingScore(data, point);
};
