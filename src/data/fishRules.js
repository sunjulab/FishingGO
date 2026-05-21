// 한국 주요 낚시 어종 금어기 + 최소 체장 규정
// 출처: 수산자원관리법 시행령
export const FISH_RULES = {
  '감성돔':   { minSize: 25, closedSeason: '4/1~5/31',    edible: true,  recipes: ['회','구이','조림'] },
  '참돔':     { minSize: 24, closedSeason: '5/1~6/30',    edible: true,  recipes: ['회','탕','구이'] },
  '돌돔':     { minSize: 24, closedSeason: '없음',         edible: true,  recipes: ['회','구이'] },
  '광어':     { minSize: 35, closedSeason: '없음',         edible: true,  recipes: ['회','조림','탕'] },
  '우럭':     { minSize: 23, closedSeason: '없음',         edible: true,  recipes: ['매운탕','찜','구이'] },
  '볼락':     { minSize: 15, closedSeason: '없음',         edible: true,  recipes: ['매운탕','구이','조림'] },
  '조피볼락': { minSize: 23, closedSeason: '없음',         edible: true,  recipes: ['매운탕','찜','구이'] },
  '숭어':     { minSize: 30, closedSeason: '없음',         edible: true,  recipes: ['회','탕','무침'] },
  '농어':     { minSize: 30, closedSeason: '없음',         edible: true,  recipes: ['회','구이','탕'] },
  '황돔':     { minSize: 20, closedSeason: '없음',         edible: true,  recipes: ['회','구이','탕'] },
  '참조기':   { minSize: 15, closedSeason: '없음',         edible: true,  recipes: ['구이','탕','무침'] },
  '고등어':   { minSize: 21, closedSeason: '없음',         edible: true,  recipes: ['구이','조림','회'] },
  '삼치':     { minSize: 40, closedSeason: '없음',         edible: true,  recipes: ['구이','회','조림'] },
  '방어':     { minSize: 30, closedSeason: '없음',         edible: true,  recipes: ['회','샤브샤브'] },
  '부시리':   { minSize: 30, closedSeason: '없음',         edible: true,  recipes: ['회','샤브샤브'] },
  '참다랑어': { minSize: 40, closedSeason: '없음',         edible: true,  recipes: ['회','초밥'] },
  '전복':     { minSize: 10, closedSeason: '없음',         edible: true,  recipes: ['죽','찜','버터구이'] },
  '소라':     { minSize: 6,  closedSeason: '없음',         edible: true,  recipes: ['찜','구이'] },
  '문어':     { minSize: null, closedSeason: '없음',       edible: true,  recipes: ['숙회','볶음','탕'] },
  '낙지':     { minSize: null, closedSeason: '없음',       edible: true,  recipes: ['볶음','탕','회'] },
  '오징어':   { minSize: 9,  closedSeason: '없음',         edible: true,  recipes: ['회','볶음','구이'] },
  '쭈꾸미':   { minSize: null, closedSeason: '2/1~5/31',  edible: true,  recipes: ['볶음','숙회'] },
  '꽃게':     { minSize: 6.4, closedSeason: '6/21~8/20',  edible: true,  recipes: ['찜','탕','무침'] },
  '대게':     { minSize: 9,  closedSeason: '없음',         edible: true,  recipes: ['찜','탕'] },
  '붕어':     { minSize: null, closedSeason: '없음',       edible: true,  recipes: ['매운탕','구이'] },
  '잉어':     { minSize: null, closedSeason: '없음',       edible: true,  recipes: ['매운탕','회'] },
  '배스':     { minSize: null, closedSeason: '없음',       edible: false, recipes: ['방류 금지(외래종)'] },
  '블루길':   { minSize: null, closedSeason: '없음',       edible: false, recipes: ['방류 금지(외래종)'] },
  '송어':     { minSize: null, closedSeason: '없음',       edible: true,  recipes: ['회','구이'] },
  '산천어':   { minSize: null, closedSeason: '없음',       edible: true,  recipes: ['회','구이'] },
  '쏘가리':   { minSize: null, closedSeason: '6/1~6/30',  edible: true,  recipes: ['매운탕','회'] },
  '꺽지':     { minSize: null, closedSeason: '없음',       edible: true,  recipes: ['매운탕'] },
};

export function getFishRule(name) {
  if (!name) return null;
  // 정확히 일치
  if (FISH_RULES[name]) return FISH_RULES[name];
  // 포함 검색
  const key = Object.keys(FISH_RULES).find(k => name.includes(k) || k.includes(name));
  return key ? FISH_RULES[key] : null;
}

// 현재 날짜가 금어기인지 확인
export function isClosedSeason(rule) {
  if (!rule || !rule.closedSeason || rule.closedSeason === '없음') return false;
  try {
    const now = new Date();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const [start, end] = rule.closedSeason.split('~');
    const [sm, sd] = start.split('/').map(Number);
    const [em, ed] = end.split('/').map(Number);
    const nowVal  = m * 100 + d;
    const startVal = sm * 100 + sd;
    const endVal   = em * 100 + ed;
    return nowVal >= startVal && nowVal <= endVal;
  } catch { return false; }
}

export const FISH_EMOJI = {
  '감성돔': '🐟', '참돔': '🐠', '광어': '🐡', '우럭': '🐟', '볼락': '🐟',
  '농어': '🐟', '방어': '🐟', '부시리': '🐟', '고등어': '🐟', '삼치': '🐟',
  '붕어': '🐟', '잉어': '🐟', '쏘가리': '🐟', '오징어': '🦑', '문어': '🐙',
  '꽃게': '🦀', '대게': '🦀', '전복': '🐚', '송어': '🐟', '기본': '🎣',
};
export function getFishEmoji(name) {
  if (!name) return '🎣';
  const key = Object.keys(FISH_EMOJI).find(k => name.includes(k));
  return key ? FISH_EMOJI[key] : '🐟';
}
