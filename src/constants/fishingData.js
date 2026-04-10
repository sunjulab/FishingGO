export const ALL_FISHING_POINTS = [
  // ── 동해권 (Gangwon/Gyeongbuk) ──
  { id: 1, name: '묵호항 방파제', type: '방파제', region: '강원', lat: 37.5489, lng: 129.1170, fish: '감성돔, 우럭', score: 98, status: '피딩중', obsCode: 'DT_0033' },
  { id: 2, name: '속초항 방파제', type: '방파제', region: '강원', lat: 38.2134, lng: 128.6010, fish: '가자미, 우럭', score: 95, status: '최고', obsCode: 'DT_0021' },
  { id: 3, name: '강릉 안목항 방파제', type: '방파제', region: '강원', lat: 37.7725, lng: 128.9472, fish: '고등어, 오징어', score: 85, status: '보통', obsCode: 'DT_0001' },
  { id: 4, name: '주문진항 방파제', type: '방파제', region: '강원', lat: 37.8912, lng: 128.8475, fish: '도다리, 학꽁치', score: 92, status: '활발', obsCode: 'DT_0001' },
  { id: 5, name: '울진 후포항 방파제', type: '방파제', region: '경북', lat: 36.6785, lng: 129.4589, fish: '뱅에돔, 감성돔', score: 94, status: '피딩중', obsCode: 'DT_0002' },
  { id: 6, name: '영덕 강구항 방파제', type: '방파제', region: '경북', lat: 36.3612, lng: 129.3874, fish: '삼치, 전어', score: 88, status: '보통', obsCode: 'DT_0002' },
  { id: 7, name: '포항 영일만 신항방파제', type: '방파제', region: '경북', lat: 36.1154, lng: 129.4325, fish: '방어, 잿방어', score: 96, status: '최고', obsCode: 'DT_0021' },
  { id: 26, name: '고성 거진항 방파제', type: '방파제', region: '강원', lat: 38.4412, lng: 128.4612, fish: '이면수, 도다리', score: 89, status: '보통', obsCode: 'DT_0001' },
  { id: 27, name: '삼척 임원항 방파제', type: '방파제', region: '강원', lat: 37.2312, lng: 129.3512, fish: '감성돔, 학꽁치', score: 91, status: '활발', obsCode: 'DT_0003' },
  { id: 28, name: '경주 읍천항 방파제', type: '방파제', region: '경북', lat: 35.6812, lng: 129.4712, fish: '농어, 무늬오징어', score: 93, status: '피딩중', obsCode: 'DT_0036' },
  { id: 41, name: '속초 영금정 갯바위', type: '갯바위', region: '강원', lat: 38.2121, lng: 128.5954, fish: '감성돔, 돌참돔', score: 92, status: '활발', obsCode: 'DT_0021' },
  { id: 42, name: '양양 수산항 갯바위', type: '갯바위', region: '강원', lat: 38.0812, lng: 128.6712, fish: '학꽁치, 감성돔', score: 88, status: '보통', obsCode: 'DT_0001' },
  { id: 43, name: '강릉 사천진 갯바위', type: '갯바위', region: '강원', lat: 37.8312, lng: 128.8812, fish: '도다리, 놀래기', score: 86, status: '보통', obsCode: 'DT_0001' },
  { id: 44, name: '동해 추암 촛대바위', type: '갯바위', region: '강원', lat: 37.4712, lng: 129.1612, fish: '대물 감성돔, 우럭', score: 94, status: '최고', obsCode: 'DT_0033' },
  { id: 45, name: '삼척 장호항 갯바위', type: '갯바위', region: '강원', lat: 37.2812, lng: 129.3212, fish: '참돔, 부시리', score: 95, status: '피딩중', obsCode: 'DT_0003' },
  { id: 46, name: '울진 죽변 등대갯바위', type: '갯바위', region: '경북', lat: 37.0512, lng: 129.4212, fish: '뱅에돔, 감성돔, 벵에', score: 93, status: '활발', obsCode: 'DT_0002' },
  { id: 101, name: '속초 동명항', type: '항구', region: '강원', lat: 38.2144, lng: 128.5984, fish: '이면수, 가자미, 학꽁치', score: 90, status: '보통', obsCode: 'DT_0021' },
  { id: 102, name: '양양 하조대항', type: '항구', region: '강원', lat: 38.0212, lng: 128.7112, fish: '고등어, 전갱이', score: 88, status: '활발', obsCode: 'DT_0001' },
  { id: 103, name: '강릉 남항진항', type: '항구', region: '강원', lat: 37.7612, lng: 128.9612, fish: '도다리, 우럭', score: 86, status: '보통', obsCode: 'DT_0001' },
  { id: 104, name: '동해 어달항', type: '항구', region: '강원', lat: 37.5612, lng: 129.1254, fish: '감성돔, 광어', score: 92, status: '활발', obsCode: 'DT_0033' },
  { id: 105, name: '삼척 오분항', type: '항구', region: '강원', lat: 37.4212, lng: 129.1754, fish: '학꽁치, 우럭', score: 85, status: '보통', obsCode: 'DT_0033' },
  { id: 106, name: '울진 죽변항', type: '항구', region: '경북', lat: 37.0612, lng: 129.4254, fish: '벵에돔, 부시리, 전갱이', score: 94, status: '피딩중', obsCode: 'DT_0002' },
  { id: 107, name: '영덕 축산항', type: '항구', region: '경북', lat: 36.5112, lng: 129.4454, fish: '삼치, 농어', score: 91, status: '활발', obsCode: 'DT_0002' },
  { id: 108, name: '포항 구룡포항', type: '항구', region: '경북', lat: 35.9912, lng: 129.5654, fish: '대형 방어, 전갱이, 삼치', score: 93, status: '피딩중', obsCode: 'DT_0036' },
  { id: 109, name: '경주 감포항', type: '항구', region: '경북', lat: 35.8154, lng: 129.5054, fish: '참돔, 무늬오징어', score: 89, status: '보통', obsCode: 'DT_0036' },
  { id: 110, name: '울산 정자항', type: '항구', region: '울산', lat: 35.6154, lng: 129.4454, fish: '부시리, 삼치', score: 92, status: '최고', obsCode: 'DT_0036' },

  // ── 남해권 (Gyeongnam/Jeonnam/Busan) ──
  { id: 8, name: '부산 해운대 방파제', type: '방파제', region: '부산', lat: 35.1587, lng: 129.1603, fish: '농어, 전갱이', score: 91, status: '활발', obsCode: 'DT_0004' },
  { id: 9, name: '부산 백운포 방파제', type: '방파제', region: '부산', lat: 35.1051, lng: 129.1054, fish: '전갱이, 참돔', score: 89, status: '보통', obsCode: 'DT_0004' },
  { id: 10, name: '거제 지세포 방파제', type: '방파제', region: '경남', lat: 34.8215, lng: 128.7125, fish: '무늬오징어, 볼락', score: 97, status: '피딩중', obsCode: 'DT_0034' },
  { id: 11, name: '통영 도남동 방파제', type: '방파제', region: '경남', lat: 34.8154, lng: 128.4358, fish: '볼락, 갱이', score: 93, status: '활발', obsCode: 'DT_0016' },
  { id: 12, name: '사천 삼천포항 방파제', type: '방파제', region: '경남', lat: 34.9125, lng: 128.0658, fish: '갑오징어, 쭈꾸미', score: 90, status: '보통', obsCode: 'DT_0016' },
  { id: 13, name: '여수 국동항 방파제', type: '방파제', region: '전남', lat: 34.7258, lng: 127.7215, fish: '갈치, 풀치', score: 95, status: '최고', obsCode: 'DT_0005' },
  { id: 14, name: '완도항 방파제', type: '방파제', region: '전남', lat: 34.3125, lng: 126.7589, fish: '감성돔, 돌돔', score: 94, status: '활발', obsCode: 'DT_0018' },
  { id: 15, name: '목포 북항 방파제', type: '항구', region: '전남', lat: 34.8015, lng: 126.3584, fish: '민어, 숭어, 농어', score: 87, status: '보통', obsCode: 'DT_0006' },
  { id: 51, name: '부산 태종대 갯바위', type: '갯바위', region: '부산', lat: 35.0512, lng: 129.0812, fish: '부시리, 전갱이, 참돔', score: 95, status: '피딩중', obsCode: 'DT_0004' },
  { id: 53, name: '거제 다대 갯바위', type: '갯바위', region: '경남', lat: 34.7412, lng: 128.6312, fish: '무늬오징어, 참돔, 뱅에돔', score: 98, status: '최고', obsCode: 'DT_0034' },
  { id: 56, name: '남해 가천 갯바위', type: '갯바위', region: '경남', lat: 34.7254, lng: 127.8812, fish: '감성돔, 뱅에돔', score: 93, status: '활발', obsCode: 'DT_0016' },
  { id: 57, name: '여수 금오도 갯바위', type: '갯바위', region: '전남', lat: 34.5012, lng: 127.7812, fish: '감성돔, 참돔', score: 97, status: '최고', obsCode: 'DT_0005' },
  { id: 58, name: '완도 청산도 갯바위', type: '갯바위', region: '전남', lat: 34.1712, lng: 126.8812, fish: '돌돔, 감성돔', score: 98, status: '피딩중', obsCode: 'DT_0018' },
  { id: 59, name: '진도 가사도 갯바위', type: '갯바위', region: '전남', lat: 34.4512, lng: 126.0512, fish: '농어, 광어', score: 90, status: '보통', obsCode: 'DT_0006' },
  { id: 60, name: '보성 득량만 갯바위', type: '갯바위', region: '전남', lat: 34.6112, lng: 127.1512, fish: '숭어, 망둥어', score: 85, status: '보통', obsCode: 'DT_0005' },

  // ── 서해권 (Incheon/Gyeonggi/Chungnam/Jeonbuk) ──
  { id: 67, name: '보령 무창포 갯바위', type: '갯바위', region: '충남', lat: 36.2512, lng: 126.5412, fish: '쭈꾸미, 광어', score: 91, status: '활발', obsCode: 'DT_0008' },
  { id: 68, name: '군산 선유도 갯바위', type: '갯바위', region: '전북', lat: 35.8112, lng: 126.4112, fish: '참돔, 농어', score: 96, status: '최고', obsCode: 'DT_0009' },
  { id: 69, name: '서천 비인 갯바위', type: '갯바위', region: '충남', lat: 36.1412, lng: 126.5812, fish: '우럭, 도다리', score: 88, status: '보통', obsCode: 'DT_0008' },
  { id: 70, name: '부안 모항 갯바위', type: '갯바위', region: '전북', lat: 35.5812, lng: 126.4812, fish: '감성돔, 광어', score: 94, status: '활발', obsCode: 'DT_0009' },

  // ── 제주권 (Jeju) ──
  { id: 23, name: '제주 서귀포항 방파제', type: '방파제', region: '제주', lat: 33.2415, lng: 126.5612, fish: '벵에돔, 부시리', score: 98, status: '최고', obsCode: 'DT_0011' },
  { id: 24, name: '제주 성산포항 방파제', type: '방파제', region: '제주', lat: 33.4712, lng: 126.9312, fish: '무늬오징어, 한치', score: 95, status: '피딩중', obsCode: 'DT_0045' },
  { id: 25, name: '제주 한림항 방파제', type: '방파제', region: '제주', lat: 33.4125, lng: 126.2584, fish: '독가시치, 벵에돔', score: 91, status: '활발', obsCode: 'DT_0010' },
  { id: 38, name: '제주 모슬포항 방파제', type: '방파제', region: '제주', lat: 33.2112, lng: 126.2512, fish: '방어, 벵에돔', score: 94, status: '피딩중', obsCode: 'DT_0011' },
  { id: 39, name: '제주 김녕항 방파제', type: '방파제', region: '제주', lat: 33.5512, lng: 126.7512, fish: '무늬오징어, 전갱이', score: 92, status: '활발', obsCode: 'DT_0045' },
  { id: 40, name: '제주 위미항 방파제', type: '방파제', region: '제주', lat: 33.2712, lng: 126.6612, fish: '한치, 벵에돔', score: 90, status: '보통', obsCode: 'DT_0011' }
];

export const getPointSpecificData = (point) => {
  if (!point) return null;
  const reg = point.region || '남해';
  const profile = {
    '제주': { sst: 18.5, wind: 3.2, wave: 0.5 },
    '남해': { sst: 16.2, wind: 4.1, wave: 0.4 },
    '동해': { sst: 14.2, wind: 5.5, wave: 0.8 },
    '서해': { sst: 11.5, wind: 7.2, wave: 1.1 }
  };
  const p = profile[reg] || profile['남해'];
  
  const pointSeed = (point.id * 7 + Math.floor(point.lat * 100)) % 100;
  const microSst  = (p.sst + (pointSeed % 10 - 5) / 10).toFixed(1);
  const microWind = (p.wind + (pointSeed % 7 - 3) / 5).toFixed(1);
  const microWave = (p.wave + (pointSeed % 5 - 2) / 20).toFixed(1);
  
  return {
    stationId: point.obsCode || `LOC_${point.id}`,
    pointName: point.name,
    sst: microSst,
    temp: `${microSst}°C`,
    wind: { speed: parseFloat(microWind), dir: pointSeed % 2 === 0 ? 'NE' : 'SW' },
    wave: { coastal: parseFloat(microWave) },
    layers: { 
      upper: parseFloat(microSst), 
      middle: (parseFloat(microSst) - 1.2).toFixed(1), 
      lower: (parseFloat(microSst) - 3.4).toFixed(1) 
    },
    tide: { 
      phase: `${(pointSeed % 14) + 1}물`, 
      high: '15:20', low: '08:42', 
      current_level: `${(pointSeed * 3) % 200 + 40}cm` 
    },
    fish: point.fish
  };
};
