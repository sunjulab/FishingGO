/**
 * 낚시GO - 정밀 낚시 점수 평가 엔진 v2.1
 *
 * 개선 사항:
 * 1. 어종별 특보 4종 → 24종으로 확대
 * 2. 물때(사리/조금) 점수 반영
 * 3. 계절 보정 (봄/여름/가을/겨울)
 * 4. 야간 낚시 시간대 보정
 * 5. 지점 유형별 보정 (방파제/갯바위/항구)
 * 6. 조언 메시지 대폭 확대
 * 7. [v2.1] 계절별 실시간 어종 자동 반영 (월+권역 기반)
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
  '삼치':      { alert: '삼치는 현재 빠른 스피드의 루어에 반응이 좋습니다.',                     gear: '스피너베이트, 빠른 리트리브' }, // ✅ 18TH-B3: 마침표 2개 오타 수정
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
  // ✅ 2ND-A6: '뱅에돔' 중복 키 제거 — L64 '벵에돔'이 표준 표기, 오타성 중복 병합
  '이면수':    { alert: '이면수는 겨울 동해 얕은 여에서 주로 낚입니다. 바닥 채비 위주로.',        gear: '바닥 채비 2~3호, 오징어/밀웜' },

};

// 사리(6~8물)는 조류 강해서 고점, 조금(13~14물)은 조류 약해서 저점
const TIDE_BONUS = {
  '1물': +3, '2물': +5, '3물': +7, '4물': +9, '5물': +10,
  '6물': +10,                      '8물': +6, '9물': +4, '10물': +2,
  // '7물'은 '7물(사리)'로 표기되므로 아래 전용 키 사용 (L211 정규식 매핑 참조)
  '11물': -2, '12물': -4,         '14물': -8, '15물': -6,
  // 정식 표기: getTidePhase/fishingData.js가 반환하는 실제 값과 일치
  '7물(사리)': +8, '13물(조금)': -7, '14물(무시)': -9,
};

// ── [v2.2] 계절별 실시간 어종 데이터 (월 × 권역) ────────────────────
// 출처: 국립수산과학원 월별 어황 + 낚시커뮤니티(어부지리·바다타임·낚시in) 실시간 조황
// ⚠️ 금어기 반영: 삼치 6~7월 | 쭈꾸미 5/11~8/31 | 갈치 7월(북위33도이북) | 전어 5~7/15
const SEASONAL_FISH = {
  '동해': {
    1:  ['가자미', '이면수', '도다리'],
    2:  ['가자미', '도다리', '이면수'],
    3:  ['도다리', '학꽁치', '가자미'],
    4:  ['도다리', '학꽁치', '감성돔'],
    5:  ['감성돔', '학꽁치', '벵에돔'],
    6:  ['가자미', '볼락', '농어'],       // 실제조황: 가자미⭐⭐⭐ 볼락⭐⭐ 농어⭐⭐ / 삼치 금어기(6~7월)
    7:  ['오징어', '전갱이', '볼락'],     // 오징어·한치 시즌 본격화 / 삼치 금어기
    8:  ['오징어', '전갱이', '삼치'],     // 8/1~ 삼치 해금
    9:  ['방어', '전갱이', '무늬오징어'],
    10: ['방어', '무늬오징어', '감성돔'],
    11: ['감성돔', '우럭', '방어'],
    12: ['가자미', '이면수', '우럭'],
  },
  '서해': {
    1:  ['우럭', '숭어', '도다리'],
    2:  ['우럭', '도다리', '숭어'],
    3:  ['도다리', '광어', '숭어'],
    4:  ['광어', '도다리', '우럭'],       // 쭈꾸미 5/11 금어기, 4월까지 가능
    5:  ['광어', '우럭', '농어'],         // 쭈꾸미 5/11~ 금어기
    6:  ['광어', '우럭', '참돔'],         // 쭈꾸미·삼치 금어기 → 광어·우럭·참돔 실제조황⭐⭐⭐
    7:  ['광어', '농어', '갑오징어'],     // 쭈꾸미·삼치 금어기 / 갑오징어 마무리 씨알 굵음
    8:  ['농어', '광어', '우럭'],         // 쭈꾸미 금어기 / 갑오징어 시즌 종료
    9:  ['쭈꾸미', '갑오징어', '광어'],   // 9/1~ 쭈꾸미 해금!
    10: ['쭈꾸미', '광어', '우럭'],
    11: ['우럭', '광어', '감성돔'],
    12: ['우럭', '광어', '숭어'],
  },
  '남해': {
    1:  ['감성돔', '볼락', '우럭'],
    2:  ['감성돔', '볼락', '도다리'],
    3:  ['도다리', '감성돔', '볼락'],
    4:  ['감성돔', '참돔', '벵에돔'],
    5:  ['참돔', '감성돔', '전갱이'],
    6:  ['참돔', '한치', '감성돔'],       // 실조황: 참돔⭐⭐⭐ 한치⭐⭐⭐ / 삼치·갈치 금어기
    7:  ['한치', '전갱이', '참돔'],       // 한치 최성기 / 갈치·삼치 금어기
    8:  ['갈치', '부시리', '삼치'],       // 8/1~ 갈치·삼치 해금
    9:  ['갈치', '방어', '부시리'],
    10: ['방어', '감성돔', '삼치'],
    11: ['감성돔', '방어', '볼락'],
    12: ['감성돔', '볼락', '우럭'],
  },
  '제주': {
    1:  ['벵에돔', '감성돔', '볼락'],
    2:  ['벵에돔', '감성돔', '볼락'],
    3:  ['벵에돔', '감성돔', '자리돔'],
    4:  ['벵에돔', '참돔', '자리돔'],
    5:  ['자리돔', '무늬오징어', '참돔'],
    6:  ['한치', '벵에돔', '농어'],       // 실조황: 한치⭐⭐⭐ 벵에돔⭐⭐⭐ 농어⭐⭐⭐
    7:  ['한치', '자리돔', '부시리'],     // 한치 최성기
    8:  ['한치', '방어', '부시리'],
    9:  ['방어', '삼치', '무늬오징어'],
    10: ['방어', '벵에돔', '무늬오징어'],
    11: ['벵에돔', '방어', '감성돔'],
    12: ['벵에돔', '감성돔', '볼락'],
  },
};

// 지역명 → 권역 매핑 (fishingData.js와 독립적으로 유지)
const REGION_TO_ZONE_EVAL = {
  '강원': '동해', '경북': '동해',
  '경남': '남해', '전남': '남해', '부산': '남해', '울산': '남해',
  '전북': '서해', '충남': '서해', '인천': '서해', '경기': '서해',
  '제주': '제주',
  // 권역 직접 입력도 지원
  '동해': '동해', '서해': '서해', '남해': '남해',
};

/**
 * [v2.1] 현재 월과 지역 기반으로 계절 어종 반환
 * @param {string} region - 지역명 또는 권역명
 * @param {number} [month] - 월 (1~12, 기본값: 현재 월)
 * @returns {string} - 대표 어종명 (단일 문자열)
 */
export const getSeasonalFish = (region, month) => {
  const m = month || (new Date().getMonth() + 1);
  const zone = REGION_TO_ZONE_EVAL[region] || '남해';
  const fishList = SEASONAL_FISH[zone]?.[m] || SEASONAL_FISH['남해'][m] || ['감성돔'];
  return fishList[0]; // 대표 어종 1개 반환
};

/**
 * [v2.1] 계절 어종 목록 전체 반환 (최대 3종)
 * @param {string} region - 지역명 또는 권역명
 * @param {number} [month] - 월 (1~12)
 * @returns {string[]} - 어종 배열
 */
export const getSeasonalFishList = (region, month) => {
  const m = month || (new Date().getMonth() + 1);
  const zone = REGION_TO_ZONE_EVAL[region] || '남해';
  return SEASONAL_FISH[zone]?.[m] || SEASONAL_FISH['남해'][m] || ['감성돔'];
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
  for (const s of Object.values(seasons)) { // ✅ 18TH-C3: 사용하지 않는 키 제거 — Object.values로 쿠린 (lint no-unused-vars 경고 제거)
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

// ✅ 2ND-C5: 포인트 시드 계산 공유 유틸 — 두 함수에서 동일 로직 중복 제거
const calcPointSeed = (point, data) => {
  const key = `${point.id || '0'}-${point.name || 'default'}-${data?.stationId || 'DT_0001'}`;
  return key.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
};

/**
 * 낚시 점수 계산 (v2.0)
 * @param {Object} data - 날씨 데이터 (sst, wind, wave, tide 등)
 * @param {Object} point - 지점 정보 (id, name, type, fish 등)
 */
export const calculateFishingScore = (data, point = {}) => {
  if (!data) return 45; // 데이터 없음 = 불확실 → 보수적으로

  // [1] 지점 고유 시드 (포인트마다 다른 특성)
  // ✅ 2ND-C5: calcPointSeed 유틸 사용 — evaluateFishingCondition과 공유
  const seed = calcPointSeed(point, data);
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
  // ✅ 2ND-B7: 정규식 기반 물때 매핑 — replace 체인 취약점 보완 ('7물(사리)' → '7물' 추출)
  const tideMatch = tidePhase.match(/(\d+물)/);
  const tideKey = tideMatch ? tideMatch[1] : tidePhase;
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
  // ✅ 2ND-C5: calcPointSeed 유틸 사용 — calculateFishingScore와 seed 공유
  const seed = calcPointSeed(point, data);


  let result = { score, color: '#8e8e93', status: 'NORMAL', advice: '', tags: [], gear: '', fishAlert: null };

  // ── 동적 멘트 생성 (수온·파고·풍속·물때·어종·시간·계절 반영) ──
  // [v2.1] 계절 어종 우선 → point.fish → data.fish 순서로 결정
  const _month   = new Date().getMonth() + 1;
  const _region  = point?.region || data?.region || '남해';
  const _seasonalFish = getSeasonalFish(_region, _month);
  // 포인트 고유 어종이 있고 계절 어종과 다르면 계절 어종 우선 (실시간성)
  const _pointFish = (point?.fish || data?.fish || '').split(',')[0].trim();
  const _fish  = _seasonalFish || _pointFish; // 계절 어종 우선
  const _sst   = parseFloat(data?.sst ?? data?.waterTemp ?? 13);
  const _wind  = parseFloat(data?.wind?.speed ?? 0);
  const _wave  = parseFloat(data?.wave?.coastal ?? 0);
  const _phase = data?.tide?.phase || '';
  const _hour  = new Date().getHours();
  const _isNight = _hour >= 19 || _hour < 5;

  const _buildAdvice = () => {
    const parts = [];

    // 점수 기반 핵심 멘트 (수온·파고·풍속은 카드 하단에 이미 표시 — 중복 제거)

    if (score >= 90) {
      if (_fish) parts.push(`${_fish} 입질 황금 컨디션! 지금 바로 출발하세요.`);
      else       parts.push('황금 컨디션! 지금 당장 캐스팅하세요.');
    } else if (score >= 75) {
      if (_fish) parts.push(`${_fish} 활성 높음. 포인트 집중 공략으로 손맛 보세요.`);
      else       parts.push('좋은 컨디션. 집중하면 손맛 볼 수 있습니다.');
    } else if (score >= 50) {
      if (_sst < 12)   parts.push(`저수온 영향으로 ${_fish || '어류'} 입질이 간헐적입니다. 밑밥으로 유인하세요.`);
      else if (_wave > 1.5) parts.push(`파고 ${_wave}m — 채비가 흔들립니다. 고부력 채비를 사용하세요.`);
      else if (_phase.includes('조금') || _phase.includes('무시'))
        parts.push(`조금 물때로 ${_fish || '어류'} 입질이 뜸합니다. 인내심이 관건.`);
      else if (_fish) parts.push(`${_fish}이 입을 약간 닫은 상태입니다. 유인력 강한 미끼로 승부하세요.`);
      else parts.push('입질이 간헐적입니다. 기대치를 조금 낮추세요.');
    } else if (score >= 30) {
      if (_sst < 11)   parts.push(`수온 ${_sst.toFixed(1)}°C 저수온 — ${_fish || '어류'} 활동 급감. 꽝 확률 높습니다.`);
      else if (_wind > 8) parts.push(`풍속 ${_wind.toFixed(1)}m/s 강풍 — 채비 운용이 어렵습니다. 출조를 재고하세요.`);
      else if (_phase.includes('조금') || _phase.includes('무시'))
        parts.push('조금·무시 물때 — 조류가 거의 없어 입질이 매우 드뭅니다.');
      else parts.push('전반적으로 낚시 조건이 나쁩니다. 기대치를 크게 낮추세요.');
    } else {
      if (_wave > 2)   parts.push(`파고 ${_wave}m 너울 위험 — 즉시 철수! 절대 출조 금지.`);
      else if (_wind > 12) parts.push(`풍속 ${_wind.toFixed(1)}m/s 강풍 — 사람이 날아갈 수 있습니다. 출조 금지.`);
      else parts.push('출조 비권고. 기상 악화로 낚시가 불가능한 상황입니다.');
    }

    // 시간대 보너스 힌트
    if (_isNight && ['농어','갈치','볼락'].includes(_fish))
      parts.push(`야간 ${_fish} 황금 타임 — 불빛 주변 집중 공략.`);
    else if (_hour >= 5 && _hour <= 7 && _fish)
      parts.push(`새벽 돌풍 시간 — ${_fish} 활성 최고조.`);

    // 계절 힌트
    if ([3,4,5].includes(_month) && _fish)
      parts.push(`봄 산란기 — ${_fish} 집중 시즌.`);
    else if ([9,10,11].includes(_month) && _fish)
      parts.push(`가을 대물 시즌 — ${_fish} 대형급 기대.`);

    return parts.join('\n');
  };

  const _dynamicAdvice = _buildAdvice();

  if (score >= 90) {
    result.status = 'PERFECT';
    result.color  = '#00C48C';
    result.advice = _dynamicAdvice;
    result.gear   = '예민한 0~G2 찌낚시 채비로 아주 가볍게 공략하는 것을 추천합니다.';
  } else if (score >= 75) {
    result.status = 'GOOD';
    result.color  = '#0056D2';
    result.advice = _dynamicAdvice;
    result.gear   = '여유를 가지고 목줄을 길게 써서 자연스러운 미끼 연출에 집중하세요.';
  } else if (score >= 50) {
    result.status = 'NORMAL';
    result.color  = '#FF9B26';
    result.advice = _dynamicAdvice;
    result.gear   = '바람에 밀리지 않도록 고부력 찌(1호 이상)와 수중찌 조합이 필요합니다.';
  } else if (score >= 30) {
    result.status = 'POOR';
    result.color  = '#FF5A5F';
    result.advice = _dynamicAdvice;
    result.gear   = '캐스팅 연습이라 생각하세요. 전유동보다는 반유동이나 원투 낚시가 유리합니다.';
  } else {
    result.status = 'DANGER';
    result.color  = '#D32F2F';
    result.advice = _dynamicAdvice;
    result.gear   = '낚시용품 대신 구명센터 연락처를 확인하세요. 즉시 철수해야 합니다.';
  }


  // [v2.1] 어종별 특보 — 계절 어종 우선, fallback: point.fish
  const mainFish = _fish || (point.fish || data.fish || '').split(',')[0].trim();
  const fishData = FISH_ALERTS[mainFish];
  if (fishData) {
    result.advice += ` \n[특보] ${fishData.alert}`;
    result.fishAlert = { fish: mainFish, alert: fishData.alert, gear: fishData.gear };
    // 어종별 채비 정보도 병합
    if (score >= 50) result.gear = `[${mainFish}] ${fishData.gear}`;
  }
  // [v2.1] 계절 어종 태그 추가
  const seasonFishList = getSeasonalFishList(_region, _month);
  if (seasonFishList.length > 0) {
    result.seasonFish = seasonFishList; // 호출부에서 활용 가능
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
 * @param {Object} point - 낚시 포인트 정보
 * @param {Function} [getPointSpecificDataFn] - fishingData.js의 getPointSpecificData 함수 (ESModule 호환 주입)
 */
export const getDynamicPointScore = (point, getPointSpecificDataFn = null) => {
  // Vite ESModule 환경에서 require() 사용 불가 → 함수 주입 방식으로 변경
  if (!getPointSpecificDataFn) {
    // fallback: 기본 데이터 구조 반환
    const fallbackData = {
      sst: 14, wind: { speed: 4 }, wave: { coastal: 0.8 },
      tide: { phase: '' }, stationId: 'DT_0001',
    };
    return calculateFishingScore(fallbackData, point);
  }
  const data = getPointSpecificDataFn(point);
  return calculateFishingScore(data, point);
};
