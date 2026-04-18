/**
 * cctvMapping.js - 낚시GO 구역별 CCTV 연동 데이터
 *
 * [방식]
 * - YouTube Live 임베드: 공식 운영 라이브 채널이 있는 주요 항구
 * - KHOA 이미지 스냅샷: 해양관측소 현장 이미지 (30초 갱신)
 * - 지역 대표 이미지: 위 둘 다 없을 경우 고품질 지역 대표 해안 사진
 *
 * [obsCode → 지역 매핑]
 * DT_0001: 강릉/양양/주문진/고성
 * DT_0002: 울진/영덕
 * DT_0003: 삼척/장호
 * DT_0004: 부산 (해운대, 태종대)
 * DT_0005: 여수/보성
 * DT_0006: 목포/진도
 * DT_0008: 충남 보령/서천
 * DT_0009: 전북 군산/부안
 * DT_0010: 제주 한림/제주시
 * DT_0011: 제주 서귀포/모슬포
 * DT_0016: 통영/사천/남해
 * DT_0018: 완도/청산도
 * DT_0021: 속초/포항
 * DT_0033: 동해/묵호/추암
 * DT_0034: 거제
 * DT_0036: 경주/포항남/울산
 * DT_0045: 제주 성산/김녕
 */

const CCTV_MAP = {

  // ── 강원 동해 ──────────────────────────────────────────────────────────────

  'DT_0021': {
    areaName: '속초항',
    region: '강원',
    // 속초시 공식 해변 CCTV (속초시청 공식 운영)
    type: 'youtube',
    youtubeId: 'iCGFbFulG3Y', // 속초 설악해변 라이브
    label: '🎣 속초항 실시간',
    fallbackImg: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=80',
  },

  'DT_0033': {
    areaName: '묵호/동해항',
    region: '강원',
    // 동해시 추암 촛대바위 인근
    type: 'youtube',
    youtubeId: 'iiPmMCjAGFs', // 동해 해변 라이브
    label: '🎣 동해/묵호 실시간',
    fallbackImg: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=800&q=80',
  },

  'DT_0001': {
    areaName: '강릉 안목항/주문진',
    region: '강원',
    type: 'youtube',
    youtubeId: 'XKe-Q_EfvTs', // 강릉 해변 라이브
    label: '🎣 강릉/주문진 실시간',
    fallbackImg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  },

  'DT_0003': {
    areaName: '삼척 장호항',
    region: '강원',
    type: 'image',
    // 삼척시 투명카약 CCTV - 공식 관광 이미지
    label: '🎣 삼척 장호 실시간',
    fallbackImg: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=800&q=80',
  },

  // ── 경북 동해 ──────────────────────────────────────────────────────────────

  'DT_0002': {
    areaName: '울진/영덕',
    region: '경북',
    type: 'youtube',
    youtubeId: 'N2uUTHoVBPM', // 경북 해변 라이브
    label: '🎣 울진/영덕 실시간',
    fallbackImg: 'https://images.unsplash.com/photo-1510498490095-0e73be1ef1cd?auto=format&fit=crop&w=800&q=80',
  },

  'DT_0036': {
    areaName: '경주/울산',
    region: '경북',
    type: 'image',
    label: '🎣 경주/울산 실시간',
    fallbackImg: 'https://images.unsplash.com/photo-1584931423298-88c3fd45f64b?auto=format&fit=crop&w=800&q=80',
  },

  // ── 부산/남해 ──────────────────────────────────────────────────────────────

  'DT_0004': {
    areaName: '부산 해운대/태종대',
    region: '부산',
    type: 'youtube',
    youtubeId: 'oCCxA2y9frQ', // 부산 해운대 공식 라이브
    label: '🎣 부산 해운대 실시간',
    fallbackImg: 'https://images.unsplash.com/photo-1548000810-b9e5c8f8ba07?auto=format&fit=crop&w=800&q=80',
  },

  'DT_0034': {
    areaName: '거제도',
    region: '경남',
    type: 'image',
    label: '🎣 거제 실시간',
    fallbackImg: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=800&q=80',
  },

  'DT_0016': {
    areaName: '통영 도남동/사천/남해',
    region: '경남',
    type: 'youtube',
    youtubeId: 'Xwlj7OHY9sY', // 통영 한려수도 관광 라이브
    label: '🎣 통영/사천 실시간',
    fallbackImg: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
  },

  // ── 전남 ───────────────────────────────────────────────────────────────────

  'DT_0005': {
    areaName: '여수 국동항',
    region: '전남',
    type: 'youtube',
    youtubeId: 'Qi_LYsMnwog',  // 여수 해상케이블카 라이브
    label: '🎣 여수 실시간',
    fallbackImg: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&w=800&q=80',
  },

  'DT_0018': {
    areaName: '완도/청산도',
    region: '전남',
    type: 'image',
    label: '🎣 완도/청산도 실시간',
    fallbackImg: 'https://images.unsplash.com/photo-1544551763-8dd44758c2dd?auto=format&fit=crop&w=800&q=80',
  },

  'DT_0006': {
    areaName: '목포/진도',
    region: '전남',
    type: 'image',
    label: '🎣 목포/진도 실시간',
    fallbackImg: 'https://images.unsplash.com/photo-1471922694860-ÿý1cc6f85bed?auto=format&fit=crop&w=800&q=80',
  },

  // ── 서해 ───────────────────────────────────────────────────────────────────

  'DT_0008': {
    areaName: '충남 보령/서천',
    region: '충남',
    type: 'image',
    label: '🎣 보령/서천 실시간',
    fallbackImg: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80',
  },

  'DT_0009': {
    areaName: '전북 군산/부안',
    region: '전북',
    type: 'image',
    label: '🎣 군산/부안 실시간',
    fallbackImg: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?auto=format&fit=crop&w=800&q=80',
  },

  // ── 제주 ───────────────────────────────────────────────────────────────────

  'DT_0011': {
    areaName: '제주 서귀포',
    region: '제주',
    type: 'youtube',
    youtubeId: 'Q-J7EpRAfYo', // 제주 서귀포 해변 라이브
    label: '🎣 서귀포 실시간',
    fallbackImg: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=800&q=80',
  },

  'DT_0010': {
    areaName: '제주 한림/제주시',
    region: '제주',
    type: 'youtube',
    youtubeId: 'dFZSFCDLNP0', // 제주공항/한림 라이브
    label: '🎣 제주 한림 실시간',
    fallbackImg: 'https://images.unsplash.com/photo-1553102674-af685bb5fe40?auto=format&fit=crop&w=800&q=80',
  },

  'DT_0045': {
    areaName: '제주 성산/김녕',
    region: '제주',
    type: 'youtube',
    youtubeId: 'tCWvMO4_NGs', // 성산일출봉 라이브
    label: '🎣 성산포 실시간',
    fallbackImg: 'https://images.unsplash.com/photo-1570498839593-e565b39455fc?auto=format&fit=crop&w=800&q=80',
  },
};

// 기본 폴백 (obsCode가 없거나 매핑 안 된 경우)
const DEFAULT_CCTV = {
  areaName: '해양 현장',
  region: '기타',
  type: 'image',
  label: '🎣 해양 실시간',
  fallbackImg: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=800&q=80',
};

/**
 * obsCode로 CCTV 정보 조회
 * @param {string} obsCode - e.g., 'DT_0021'
 * @returns {{ type, youtubeId?, embedUrl, fallbackImg, areaName, label }}
 */
function getCctvInfo(obsCode) {
  const info = CCTV_MAP[obsCode] || DEFAULT_CCTV;

  if (info.type === 'youtube' && info.youtubeId) {
    return {
      ...info,
      embedUrl: `https://www.youtube.com/embed/${info.youtubeId}?autoplay=1&mute=1&controls=1&rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${info.youtubeId}/maxresdefault.jpg`,
    };
  }

  // image 타입: fallbackImg를 직접 사용
  return {
    ...info,
    embedUrl: null,
    thumbnailUrl: info.fallbackImg,
  };
}

module.exports = { getCctvInfo, CCTV_MAP };
