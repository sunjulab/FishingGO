const fs = require('fs');
let content = fs.readFileSync('src/constants/fishingData.js', 'utf8');

const searchStr = `  { id: 9020, name: '⭐ 통영 미륵도 진송말 갯바위'`;
const badStart = content.indexOf(searchStr);
const badEndStr = `e, tip: '암남공원 끝 갯바위. 도심 접근성 최고. 밤낚시 농어 명당.', access: '암남공원(부산 서구 암남공원로 185) 공영주차장 이용' },`;
const badEnd = content.indexOf(badEndStr);

if (badStart !== -1 && badEnd !== -1) {
  const replacement = `  { id: 9020, name: '⭐ 통영 미륵도 진송말 갯바위', type: '갯바위', region: '경남', lat: 34.7732, lng: 128.4156, fish: '감성돔, 벵에돔, 참돔', score: 96, status: '활발', obsCode: 'DT_0034', secret: true, tip: '미륵도 끝자락 조류 소통 좋은 곳. 가을 감성돔/참돔 찌낚시.', access: '통영 산양읍 영운리 주차 후 도보 진입' },
  // 부산 추가
  { id: 9021, name: '⭐ 부산 가덕도 천성항 방파제', type: '방파제', region: '부산', lat: 35.0345, lng: 128.8234, fish: '감성돔, 볼락, 무늬오징어', score: 96, status: '피딩중', obsCode: 'DT_0004', secret: true, tip: '가덕도 서쪽 방파제. 에깅과 찌낚시 모두 가능. 주차 후 도보 접근성 훌륭.', access: '천성항(부산 강서구 천성동) 주차장 이용' },
  { id: 9022, name: '⭐ 부산 암남공원 갯바위', type: '갯바위', region: '부산', lat: 35.0678, lng: 129.0123, fish: '감성돔, 농어, 전갱이', score: 94, status: '보통', obsCode: 'DT_0004', secret: true, tip: '암남공원 끝 갯바위. 도심 접근성 최고. 밤낚시 농어 명당.', access: '암남공원(부산 서구 암남공원로 185) 공영주차장 이용' },`;

  const endSlice = badEnd + badEndStr.length;
  content = content.slice(0, badStart) + replacement + content.slice(endSlice);
  
  fs.writeFileSync('src/constants/fishingData.js', content, 'utf8');
  console.log('Fixed fishingData.js array corruption!');
} else {
  console.log('Could not find bad pattern', badStart, badEnd);
}
