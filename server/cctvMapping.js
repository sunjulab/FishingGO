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
  // ── 강원 동해 ──
  'DT_0021': { areaName: '속초/공현진', region: '강원', type: 'mof', beachCode: 57, label: '🎣 속초/고성 실시간' },
  'DT_0033': { areaName: '묵호/정동진', region: '강원', type: 'mof', beachCode: 56, label: '🎣 묵호/정동진 실시간' },
  'DT_0001': { areaName: '강릉 강문해변', region: '강원', type: 'mof', beachCode: 51, label: '🎣 강릉/주문진 실시간' },
  'DT_0003': { areaName: '삼척/소돌해변', region: '강원', type: 'mof', beachCode: 53, label: '🎣 삼척 실시간' },

  // ── 경북 동해 ──
  'DT_0002': { areaName: '영덕 고래불', region: '경북', type: 'mof', beachCode: null, label: '🎣 영덕/울진 실시간' }, // ✅ 9TH-C3: beachCode 0은 유효하지 않을 가능성 높음 — null로 명시적 미정의 처리
  'DT_0036': { areaName: '울산 정자',    region: '경북', type: 'mof', beachCode: 74, label: '🎣 경주/울산 실시간' },

  // ── 부산/남해 ──
  'DT_0004': { areaName: '부산 해운대',   region: '부산', type: 'mof', beachCode: 81, label: '🎣 부산 해운대 실시간' },
  // ✅ WARN-CM1: 거제 beachCode 2→84 (서귀포와 중복 방지)
  'DT_0034': { areaName: '거제 구조라',   region: '경남', type: 'mof', beachCode: 84, label: '🎣 거제 실시간' },
  'DT_0016': { areaName: '남해 상주',     region: '경남', type: 'mof', beachCode: 9, label: '🎣 남해/통영 실시간' },

  // ── 전남 ──
  // ✅ WARN-CM1: 여수(9→70), 완도(9→71) 중복 수정 (남해/통영과 중복이었음)
  'DT_0005': { areaName: '여수/보성 여역', region: '전남', type: 'mof', beachCode: 70, label: '🎣 여수 실시간' },
  'DT_0018': { areaName: '완도/청산 해역', region: '전남', type: 'mof', beachCode: 71, label: '🎣 완도 실시간' },
  // ✅ WARN-CM1 확장: 목포(63→65) 수정 — DT_0008 보령과 beachCode 63 중복 해소
  'DT_0006': { areaName: '목포/진도 해역',    region: '전남', type: 'mof', beachCode: 65, label: '🎣 목포/진도 실시간' },

  // ── 서해 ──
  'DT_0008': { areaName: '보령 대천해수욕장', region: '충남', type: 'mof', beachCode: 63, label: '🎣 보령/대천 실시간' },
  'DT_0009': { areaName: '태안 만리포/군산',  region: '전북', type: 'mof', beachCode: 79, label: '🎣 군산/태안 실시간' },

  // ── 제주 ──
  // ✅ WARN-CM1: 서귀포(2→83), 성산(81→82) 중복 수정
  'DT_0011': { areaName: '제주 서귀포해역', region: '제주', type: 'mof', beachCode: 83, label: '🎣 서귀포 실시간' },
  'DT_0010': { areaName: '제주 한림해역',   region: '제주', type: 'mof', beachCode: 80, label: '🎣 제주 한림 실시간' }, // ✅ 20TH-C1: DT_0004(해운대)와 beachCode 81 중복 → 80으로 수정
  'DT_0045': { areaName: '제주 성산해역',   region: '제주', type: 'mof', beachCode: 82, label: '🎣 성산포 실시간' },
};

// 기본 폴백
const DEFAULT_CCTV = {
  areaName: '전국 연안 모니터링',
  region: '기타',
  type: 'mof',
  beachCode: 51,
  label: '🎣 해양 실시간',
};

function getCctvInfo(obsCode) {
  const info = CCTV_MAP[obsCode] || DEFAULT_CCTV;

  if (info.type === 'youtube' && info.youtubeId) {
    return {
      ...info,
      embedUrl: `https://www.youtube.com/embed/${info.youtubeId}?autoplay=1&mute=1&controls=1&rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${info.youtubeId}/maxresdefault.jpg`,
    };
  }

  // ✅ 14TH-B3/C4: beachCode null 체크 — null 시 /stream/null URL 생성 방지 (404 요청 차단)
  if (info.beachCode == null) {
    return {
      ...info,
      embedUrl: null,
      thumbnailUrl: null,
      fallbackImg: null, // 호출 측에서 null 체크 후 지역 대표 이미지 fallback 사용
    };
  }

  // mof 타입: 해양수산부 연안포털 스트림 릴레이 (Mixed Content, CORS 회피를 위한 자체 백엔드 파이프라인)
  const mofUrl = `/api/weather/cctv/stream/${info.beachCode}`;
  
  return {
    ...info,
    embedUrl: null,
    thumbnailUrl: mofUrl,
    fallbackImg: mofUrl, // 기본 전달
  };
}

module.exports = { getCctvInfo, CCTV_MAP };
