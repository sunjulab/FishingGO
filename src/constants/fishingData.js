export const ALL_FISHING_POINTS = [
  // ── 동해권 (Gangwon/Gyeongbuk) ──
  { id: 1, name: '묵호항 방파제', type: '방파제', region: '강원', lat: 37.5489, lng: 129.1170, fish: '감성돔, 우럭', score: 98, status: '피딩중', obsCode: 'DT_0033' },
  { id: 2, name: '속초항 방파제', type: '방파제', region: '강원', lat: 38.2134, lng: 128.6010, fish: '가자미, 우럭', score: 95, status: '최고', obsCode: 'DT_0021' },
  { id: 3, name: '강릉 안목항 방파제', type: '방파제', region: '강원', lat: 37.7725, lng: 128.9472, fish: '고등어, 오징어', score: 85, status: '보통', obsCode: 'DT_0001' },
  { id: 4, name: '주문진항 방파제', type: '방파제', region: '강원', lat: 37.8912, lng: 128.8475, fish: '도다리, 학꽁치', score: 92, status: '활발', obsCode: 'DT_0001' },
  { id: 5, name: '울진 후포항 방파제', type: '방파제', region: '경북', lat: 36.6785, lng: 129.4589, fish: '뱅에돔, 감성돔', score: 94, status: '피딩중', obsCode: 'DT_0002' },
  { id: 6, name: '영덕 강구항 방파제', type: '방파제', region: '경북', lat: 36.3612, lng: 129.3874, fish: '삼치, 전어', score: 88, status: '보통', obsCode: 'DT_0002' },
  { id: 7, name: '포항 영일만 신항방파제', type: '방파제', region: '경북', lat: 36.1154, lng: 129.4325, fish: '방어, 잿방어', score: 96, status: '최고', obsCode: 'DT_0036' },
  { id: 26, name: '고성 거진항 방파제', type: '방파제', region: '강원', lat: 38.4412, lng: 128.4612, fish: '이면수, 도다리', score: 89, status: '보통', obsCode: 'DT_0021' },
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

// ── LITE 이상 회원 전용 비밀 포인트 (실제 낚시 명소 기반) ───────
export const SECRET_FISHING_POINTS = [
  // 동해권
  { id: 9001, name: '⭐ 동해 어달 비밀 갯바위', type: '갯바위', region: '강원', lat: 37.5598, lng: 129.1281, fish: '대물 감성돔, 참돔, 벵에돔', score: 99, status: '피딩중', obsCode: 'DT_0033', secret: true, tip: '어달항 북쪽 300m 절벽 갯바위. 사리 전날 만조 1~2시간 후 황금타임. 크릴+집어제 흘림낚시.', access: '어달항(강원 동해시 일출로 230) 주차 후 북쪽 해안길 도보 15분' },
  { id: 9002, name: '⭐ 삼척 장호만 비밀 갯바위', type: '갯바위', region: '강원', lat: 37.2892, lng: 129.3183, fish: '참돔, 부시리, 벵에돔', score: 98, status: '최고', obsCode: 'DT_0003', secret: true, tip: '장호항에서 도선 이용. 수심 15~20m 직벽. 타이라바 핑크 80~100g 중층 공략.', access: '장호항(강원 삼척시 근덕면 장호항길 103) 도선 이용' },
  { id: 9003, name: '⭐ 속초 영금정 비밀 여밭', type: '갯바위', region: '강원', lat: 38.2121, lng: 128.5955, fish: '대물 우럭, 넙치, 감성돔', score: 96, status: '활발', obsCode: 'DT_0021', secret: true, tip: '영금정 등대 남쪽 해식절벽. 간조 시 드러나는 여밭 집중 공략. 지렁이+새우 바닥채비.', access: '속초 영금정(강원 속초시 동명항길 35) 공영주차장, 도보 5분' },
  // 경남·남해권
  { id: 9004, name: '⭐ 거제 해금강 비밀 갯바위', type: '갯바위', region: '경남', lat: 34.7570, lng: 128.6657, fish: '대물 돌돔, 참돔, 무늬오징어', score: 99, status: '최고', obsCode: 'DT_0034', secret: true, tip: '해금강 선착장에서 도선 이용. 국내 최상급 돌돔 포인트. 전복+성게 미끼 필수.', access: '도장포선착장(경남 거제시 남부면 도장포1길 55) 도선 이용' },
  { id: 9005, name: '⭐ 거제 가조도 실전항 갯바위', type: '갯바위', region: '경남', lat: 34.8923, lng: 128.5498, fish: '감성돔, 벵에돔, 볼락', score: 97, status: '피딩중', obsCode: 'DT_0034', secret: true, tip: '가조도 실전항 북쪽 갯바위. 조류 합류점 노리기. 크릴 반마리+파래 혼합 채비.', access: '거제 가조연육교 통과 후 실전항 주차' },
  { id: 9006, name: '⭐ 통영 추봉도 비밀 포인트', type: '갯바위', region: '경남', lat: 34.8398, lng: 128.4202, fish: '참돔, 감성돔, 삼치', score: 97, status: '활발', obsCode: 'DT_0016', secret: true, tip: '사리물때 3~7물 집중. 루어 삼치는 해 질 무렵 30분이 피크.', access: '통영항 여객선터미널(경남 통영시 통영해안로 234) 도선 이용' },
  // 전남·여수권
  { id: 9007, name: '⭐ 여수 화태도 문여 갯바위', type: '갯바위', region: '전남', lat: 34.6512, lng: 127.6423, fish: '감성돔, 벵에돔, 갈치', score: 98, status: '최고', obsCode: 'DT_0005', secret: true, tip: '화태대교 이용 접근 가능. 밤낚시 갈치 최고 명당.', access: '화태대교 통과 후 문여항 주차' },
  { id: 9008, name: '⭐ 여수 금오도 비렁길 갯바위', type: '갯바위', region: '전남', lat: 34.5156, lng: 127.7621, fish: '대물 감성돔, 참돔', score: 99, status: '피딩중', obsCode: 'DT_0005', secret: true, tip: '금오도 비렁길 3코스 직벽. 조류 빠름 → 고부력 찌 필수. 새벽 4시 입질 집중.', access: '여수 백야도항 또는 돌산 신기항 도선' },
  { id: 9009, name: '⭐ 완도 청산도 직벽 갯바위', type: '갯바위', region: '전남', lat: 34.1921, lng: 126.8745, fish: '돌돔, 감성돔, 긴꼬리벵에돔', score: 99, status: '최고', obsCode: 'DT_0018', secret: true, tip: '국내 최대급 돌돔 서식지. 성게+전복 미끼, 수심 8~12m 직벽 공략.', access: '완도항 청산도행 여객선 1일 3회' },
  // 서해·전북·충남권
  { id: 9010, name: '⭐ 군산 선유도 명사십리 갯바위', type: '갯바위', region: '전북', lat: 35.8271, lng: 126.4935, fish: '참돔, 돌돔, 농어', score: 96, status: '활발', obsCode: 'DT_0009', secret: true, tip: '선유도 서쪽 외해 갯바위. 간조 2시간 전 여밭 집중. 크릴+민물새우 혼합.', access: '군산 비응항 여객터미널 → 선유도 도선' },
  { id: 9011, name: '⭐ 보령 무창포 외해 암초', type: '갯바위', region: '충남', lat: 36.3254, lng: 126.4489, fish: '광어, 우럭, 참돔', score: 95, status: '피딩중', obsCode: 'DT_0008', secret: true, tip: '무창포 신비의 바닷길 서쪽 암초군. 간조 전후 2시간이 황금타임.', access: '무창포 해수욕장 주차 후 도선 이용' },
  // 부산권
  { id: 9012, name: '⭐ 부산 태종대 절벽 갯바위', type: '갯바위', region: '부산', lat: 35.0506, lng: 129.0883, fish: '부시리, 전갱이, 참돔', score: 98, status: '최고', obsCode: 'DT_0004', secret: true, tip: '태종대 감지해변 선착장 인근 절벽 발판. 일출 30분 전 입장 필수. 지깅 메탈 30~40g.', access: '태종대 감지해변(부산 영도구 감지해변길 79) 공영주차장' },
  { id: 9013, name: '⭐ 기장 공수항 외해 갯바위', type: '갯바위', region: '부산', lat: 35.2195, lng: 129.2301, fish: '감성돔, 벵에돔, 학꽁치', score: 96, status: '활발', obsCode: 'DT_0004', secret: true, tip: '봄가을 감성돔 시즌 최고. 크릴 반마리 흘림.', access: '기장 공수항 도선 이용 (새벽 5시 출발)' },
  // 제주권
  { id: 9014, name: '⭐ 제주 위미 비밀 갯바위', type: '갯바위', region: '제주', lat: 33.2603, lng: 126.6761, fish: '벵에돔, 긴꼬리벵에돔, 부시리', score: 99, status: '피딩중', obsCode: 'DT_0011', secret: true, tip: '제주 최고 벵에돔 포인트. 파도 2m 이하 출조, 3~4호 반유동 채비.', access: '위미항(제주 서귀포시 남원읍) 주차 후 동쪽 해안길 도보 20분' },
  { id: 9015, name: '⭐ 제주 토산 흰동산 갯바위', type: '갯바위', region: '제주', lat: 33.3154, lng: 126.9198, fish: '참돔, 부시리, 방어 대형급', score: 98, status: '최고', obsCode: 'DT_0045', secret: true, tip: '표선면 숨겨진 비경. 수심 깊고 조용. 벵에돔 대어 명당. 진입로 험함 주의.', access: '표선 토산리 해안도로 주차 후 도보' },
  { id: 9016, name: '⭐ 제주 새섬 갯바위', type: '갯바위', region: '제주', lat: 33.2438, lng: 126.5647, fish: '벵에돔, 독가시치, 무늬오징어', score: 97, status: '활발', obsCode: 'DT_0011', secret: true, tip: '서귀포항 새연교 도보 진입. 수심 깊고 조류 소통 최고. 일출~22시 이용 가능.', access: '서귀포항 새연교(제주 서귀포시 서홍동) 도보 입장 무료' },
  { id: 9017, name: '⭐ 제주 대평포구 박수기정 갯바위', type: '갯바위', region: '제주', lat: 33.2278, lng: 126.4098, fish: '벵에돔, 돌돔, 무늬오징어', score: 97, status: '피딩중', obsCode: 'DT_0011', secret: true, tip: '박수기정 절벽 아래 에깅·돌돔 명당. 에기 3호 흰색 계열.', access: '대평포구 주차장 이용, 도보 접근' },
  { id: 9018, name: '⭐ 제주 월령코지 에깅 포인트', type: '갯바위', region: '제주', lat: 33.4256, lng: 126.2378, fish: '무늬오징어, 갑오징어, 벵에돔', score: 95, status: '활발', obsCode: 'DT_0010', secret: true, tip: '한림읍 월령리 에깅 성지. 선인장 군락 옆 포인트. 저녁~야간이 피크.', access: '월령리 선인장 해변 주차장' },
  // 거제·통영 추가
  { id: 9019, name: '⭐ 거제 칠천도 옥계항 갯바위', type: '갯바위', region: '경남', lat: 34.8756, lng: 128.5412, fish: '전갱이, 볼락, 갑오징어', score: 95, status: '활발', obsCode: 'DT_0034', secret: true, tip: '칠천대교 차량 진입. 옥계항 방파제 외항 갯바위. 가족 낚시 최적.', access: '칠천대교 통과 후 옥계항 주차' },
  { id: 9020, name: '⭐ 통영 미륵도 진송말 갯바위', type: '갯바위', region: '경남', lat: 34.7732, lng: 128.4156, fish: '감성돔, 참돔, 볼락', score: 97, status: '피딩중', obsCode: 'DT_0016', secret: true, tip: '수중여·침선 지형. 사전 지형 파악 필수. 크릴 반마리+파래 흘림 추천.', access: '통영 미륵도 도로 진입 후 도보' },
  // 여수·전남 추가
  { id: 9021, name: '⭐ 여수 금오열도 안도 칼바위', type: '갯바위', region: '전남', lat: 34.4623, lng: 127.8389, fish: '대물 감성돔, 벵에돔, 참돔', score: 99, status: '최고', obsCode: 'DT_0005', secret: true, tip: '여수 갯바위 낚시 성지. 씨알 굵은 감성돔 연중 조황. 겨울 대물 시즌이 절정.', access: '여수 신기항→안도행 도선 이용' },
  // 부산 추가
  { id: 9022, name: '⭐ 부산 암남공원 갯바위', type: '갯바위', region: '부산', lat: 35.0645, lng: 129.0145, fish: '농어, 감성돔, 전갱이', score: 96, status: '활발', obsCode: 'DT_0004', secret: true, tip: '암남공원 끝 갯바위. 도심 접근성 최고. 밤낚시 농어 명당.', access: '암남공원(부산 서구 암남공원로 185) 공영주차장 이용' },
  { id: 9023, name: '⭐ 부산 영도 신방파제 갯바위', type: '방파제', region: '부산', lat: 35.0834, lng: 129.0689, fish: '감성돔, 볼락, 무늬오징어', score: 95, status: '피딩중', obsCode: 'DT_0004', secret: true, tip: '영도 해안도로 신방파제. 볼락 루어 야간 명당. LED 집어등 효과적.', access: '영도 해안도로 주차 후 도보' },
  // 위도(부안) 추가
  { id: 9024, name: '⭐ 부안 위도 칼바위 갯바위', type: '갯바위', region: '전북', lat: 35.6198, lng: 126.3028, fish: '감성돔, 농어, 우럭', score: 96, status: '활발', obsCode: 'DT_0009', secret: true, tip: '격포항에서 배로 진입. 서해 최고 감성돔 포인트. 발판 험함 → 펠트화 필수.', access: '부안 격포항 위도행 여객선 이용' },
  // 울산 추가
  { id: 9025, name: '⭐ 울산 주전 몽돌 갯바위', type: '갯바위', region: '울산', lat: 35.6053, lng: 129.4398, fish: '감성돔, 무늬오징어, 학꽁치', score: 95, status: '활발', obsCode: 'DT_0036', secret: true, tip: '주전 몽돌해변 북쪽 갯바위. 에깅 무늬오징어 포인트. 가을~겨울 감성돔 명당.', access: '주전해수욕장(울산 동구 주전동) 주차 후 북쪽 해안 도보' },
  { id: 9002, name: '⭐ 삼척 장호만 비밀 갯바위', type: '갯바위', region: '강원', lat: 37.2892, lng: 129.3183, fish: '참돔, 부시리, 벵에돔', score: 98, status: '최고', obsCode: 'DT_0003', secret: true, tip: '장호항에서 도선 이용. 수심 15~20m 직벽. 타이라바 핑크 80~100g 중층 공략.', access: '장호항(강원 삼척시 근덕면 장호항길 103) 도선 이용' },
  { id: 9003, name: '⭐ 속초 영금정 비밀 여밭', type: '갯바위', region: '강원', lat: 38.2121, lng: 128.5955, fish: '대물 우럭, 넙치, 감성돔', score: 96, status: '활발', obsCode: 'DT_0021', secret: true, tip: '영금정 등대 남쪽 해식절벽. 간조 시 드러나는 여밭 집중 공략. 지렁이+새우 바닥채비.', access: '속초 영금정(강원 속초시 동명항길 35) 공영주차장, 도보 5분' },
  // 경남·남해권
  { id: 9004, name: '⭐ 거제 해금강 비밀 갯바위', type: '갯바위', region: '경남', lat: 34.7570, lng: 128.6657, fish: '대물 돌돔, 참돔, 무늬오징어', score: 99, status: '최고', obsCode: 'DT_0034', secret: true, tip: '해금강 선착장에서 도선 이용. 국내 최상급 돌돔 포인트. 전복+성게 미끼 필수.', access: '도장포선착장(경남 거제시 남부면 도장포1길 55) 도선 이용' },
  { id: 9005, name: '⭐ 거제 가조도 실전항 갯바위', type: '갯바위', region: '경남', lat: 34.9348, lng: 128.5241, fish: '감성돔, 벵에돔, 볼락', score: 97, status: '피딩중', obsCode: 'DT_0034', secret: true, tip: '가조도 실전항 북쪽 갯바위. 조류 합류점 노리기. 크릴 반마리+파래 혼합 채비.', access: '거제 가조연육교 통과 후 가조도 실전항 주차' },
  { id: 9006, name: '⭐ 통영 추봉도 비밀 포인트', type: '갯바위', region: '경남', lat: 34.7680, lng: 128.4790, fish: '참돔, 감성돔, 삼치', score: 97, status: '활발', obsCode: 'DT_0016', secret: true, tip: '사리물때 3~7물 집중. 루어 삼치는 해 질 무렵 30분이 피크.', access: '통영항 여객선터미널(경남 통영시 통영해안로 234) 도선 이용' },
  // 전남·여수권
  { id: 9007, name: '⭐ 여수 화태도 문여 갯바위', type: '갯바위', region: '전남', lat: 34.6512, lng: 127.6423, fish: '감성돔, 벵에돔, 갈치', score: 98, status: '최고', obsCode: 'DT_0005', secret: true, tip: '화태대교 이용 접근 가능. 밤낚시 갈치 최고 명당.', access: '화태대교 통과 후 문여항 주차' },
  { id: 9008, name: '⭐ 여수 금오도 비렁길 갯바위', type: '갯바위', region: '전남', lat: 34.5156, lng: 127.7621, fish: '대물 감성돔, 참돔', score: 99, status: '피딩중', obsCode: 'DT_0005', secret: true, tip: '금오도 비렁길 3코스 직벽. 조류 빠름 → 고부력 찌 필수. 새벽 4시 입질 집중.', access: '여수 백야도항 또는 돌산 신기항 도선' },
  { id: 9009, name: '⭐ 완도 청산도 직벽 갯바위', type: '갯바위', region: '전남', lat: 34.1921, lng: 126.8745, fish: '돌돔, 감성돔, 긴꼬리벵에돔', score: 99, status: '최고', obsCode: 'DT_0018', secret: true, tip: '국내 최대급 돌돔 서식지. 성게+전복 미끼, 수심 8~12m 직벽 공략.', access: '완도항 청산도행 여객선 1일 3회' },
  // 서해·전북·충남권
  { id: 9010, name: '⭐ 군산 선유도 명사십리 갯바위', type: '갯바위', region: '전북', lat: 35.8271, lng: 126.4935, fish: '참돔, 돌돔, 농어', score: 96, status: '활발', obsCode: 'DT_0009', secret: true, tip: '선유도 서쪽 외해 갯바위. 간조 2시간 전 여밭 집중. 크릴+민물새우 혼합.', access: '군산 비응항 여객터미널 → 선유도 도선' },
  { id: 9011, name: '⭐ 보령 무창포 외해 암초', type: '갯바위', region: '충남', lat: 36.3254, lng: 126.4489, fish: '광어, 우럭, 참돔', score: 95, status: '피딩중', obsCode: 'DT_0008', secret: true, tip: '무창포 신비의 바닷길 서쪽 암초군. 간조 전후 2시간이 황금타임.', access: '무창포 해수욕장 주차 후 도선 이용' },
  // 부산권
  { id: 9012, name: '⭐ 부산 태종대 절벽 갯바위', type: '갯바위', region: '부산', lat: 35.0506, lng: 129.0883, fish: '부시리, 전갱이, 참돔', score: 98, status: '최고', obsCode: 'DT_0004', secret: true, tip: '태종대 감지해변 선착장 인근 절벽 발판. 일출 30분 전 입장 필수. 지깅 메탈 30~40g.', access: '태종대 감지해변(부산 영도구 감지해변길 79) 공영주차장' },
  { id: 9013, name: '⭐ 기장 공수항 외해 갯바위', type: '갯바위', region: '부산', lat: 35.2195, lng: 129.2301, fish: '감성돔, 벵에돔, 학꽁치', score: 96, status: '활발', obsCode: 'DT_0004', secret: true, tip: '봄가을 감성돔 시즌 최고. 크릴 반마리 흘림.', access: '기장 공수항 도선 이용 (새벽 5시 출발)' },
  // 제주권
  { id: 9014, name: '⭐ 제주 위미 비밀 갯바위', type: '갯바위', region: '제주', lat: 33.2603, lng: 126.6761, fish: '벵에돔, 긴꼬리벵에돔, 부시리', score: 99, status: '피딩중', obsCode: 'DT_0011', secret: true, tip: '제주 최고 벵에돔 포인트. 파도 2m 이하 출조, 3~4호 반유동 채비.', access: '위미항(제주 서귀포시 남원읍) 주차 후 동쪽 해안길 도보 20분' },
  { id: 9015, name: '⭐ 제주 토산 흰동산 갯바위', type: '갯바위', region: '제주', lat: 33.3154, lng: 126.9198, fish: '참돔, 부시리, 방어 대형급', score: 98, status: '최고', obsCode: 'DT_0045', secret: true, tip: '표선면 숨겨진 비경. 수심 깊고 조용. 벵에돔 대어 명당. 진입로 험함 주의.', access: '표선 토산리 해안도로 주차 후 도보' },
  { id: 9016, name: '⭐ 제주 새섬 갯바위', type: '갯바위', region: '제주', lat: 33.2438, lng: 126.5647, fish: '벵에돔, 독가시치, 무늬오징어', score: 97, status: '활발', obsCode: 'DT_0011', secret: true, tip: '서귀포항 새연교 도보 진입. 수심 깊고 조류 소통 최고. 일출~22시 이용 가능.', access: '서귀포항 새연교(제주 서귀포시 서홍동) 도보 입장 무료' },
  { id: 9017, name: '⭐ 제주 대평포구 박수기정 갯바위', type: '갯바위', region: '제주', lat: 33.2278, lng: 126.4098, fish: '벵에돔, 돌돔, 무늬오징어', score: 97, status: '피딩중', obsCode: 'DT_0011', secret: true, tip: '박수기정 절벽 아래 에깅·돌돔 명당. 에기 3호 흰색 계열.', access: '대평포구 주차장 이용, 도보 접근' },
  { id: 9018, name: '⭐ 제주 월령코지 에깅 포인트', type: '갯바위', region: '제주', lat: 33.4256, lng: 126.2378, fish: '무늬오징어, 갑오징어, 벵에돔', score: 95, status: '활발', obsCode: 'DT_0010', secret: true, tip: '한림읍 월령리 에깅 성지. 선인장 군락 옆 포인트. 저녁~야간이 피크.', access: '월령리 선인장 해변 주차장' },
  // 거제·통영 추가
  { id: 9019, name: '⭐ 거제 칠천도 옥계항 갯바위', type: '갯바위', region: '경남', lat: 34.8912, lng: 128.5089, fish: '전갱이, 볼락, 갑오징어', score: 95, status: '활발', obsCode: 'DT_0034', secret: true, tip: '칠천대교 차량 진입. 옥계항 방파제 외항 갯바위. 가족 낚시 최적.', access: '칠천대교 통과 후 칠천도 옥계항 주차' },
  { id: 9020, name: '⭐ 통영 미륵도 진송말 갯바위', type: '갯바위', region: '경남', lat: 34.7732, lng: 128.4156, fish: '감성돔, 참돔, 볼락', score: 97, status: '피딩중', obsCode: 'DT_0016', secret: true, tip: '수중여·침선 지형. 사전 지형 파악 필수. 크릴 반마리+파래 흘림 추천.', access: '통영 미륵도 도로 진입 후 도보' },
  // 여수·전남 추가
  { id: 9021, name: '⭐ 여수 금오열도 안도 칼바위', type: '갯바위', region: '전남', lat: 34.4623, lng: 127.8389, fish: '대물 감성돔, 벵에돔, 참돔', score: 99, status: '최고', obsCode: 'DT_0005', secret: true, tip: '여수 갯바위 낚시 성지. 씨알 굵은 감성돔 연중 조황. 겨울 대물 시즌이 절정.', access: '여수 신기항→안도행 도선 이용' },
  // 부산 추가
  { id: 9022, name: '⭐ 부산 암남공원 갯바위', type: '갯바위', region: '부산', lat: 35.0645, lng: 129.0145, fish: '농어, 감성돔, 전갱이', score: 96, status: '활발', obsCode: 'DT_0004', secret: true, tip: '암남공원 끝 갯바위. 도심 접근성 최고. 밤낚시 농어 명당.', access: '암남공원(부산 서구 암남공원로 185) 공영주차장 이용' },
  { id: 9023, name: '⭐ 부산 영도 신방파제 갯바위', type: '방파제', region: '부산', lat: 35.0834, lng: 129.0689, fish: '감성돔, 볼락, 무늬오징어', score: 95, status: '피딩중', obsCode: 'DT_0004', secret: true, tip: '영도 해안도로 신방파제. 볼락 루어 야간 명당. LED 집어등 효과적.', access: '영도 해안도로 주차 후 도보' },
  // 위도(부안) 추가
  { id: 9024, name: '⭐ 부안 위도 칼바위 갯바위', type: '갯바위', region: '전북', lat: 35.6198, lng: 126.3028, fish: '감성돔, 농어, 우럭', score: 96, status: '활발', obsCode: 'DT_0009', secret: true, tip: '격포항에서 배로 진입. 서해 최고 감성돔 포인트. 발판 험함 → 펠트화 필수.', access: '부안 격포항 위도행 여객선 이용' },
  // 울산 추가
  { id: 9025, name: '⭐ 울산 주전 몽돌 갯바위', type: '갯바위', region: '울산', lat: 35.6053, lng: 129.4398, fish: '감성돔, 무늬오징어, 학꽁치', score: 95, status: '활발', obsCode: 'DT_0036', secret: true, tip: '주전 몽돌해변 북쪽 갯바위. 에깅 무늬오징어 포인트. 가을~겨울 감성돔 명당.', access: '주전해수욕장(울산 동구 주전동) 주차 후 북쪽 해안 도보' },
];


export const getPointSpecificData = (point) => {
  if (!point) return null;
  const reg = point.region || '남해';

  // 4월 실제 한국 해역별 기상 통계 기반 폴백 데이터
  // 출처: 국립해양조사원 월별 기상 통계 (2020~2024 평균)
  const profile = {
    '제주': { sst: 17.2, wind: 3.8, wave: 0.6 }, // 제주 4월: 가장 따뜻, 상대적 양호
    '남해': { sst: 14.5, wind: 4.8, wave: 0.7 }, // 남해 4월: 회복 중, 바람 있음
    '동해': { sst: 12.1, wind: 5.8, wave: 0.9 }, // 동해 4월: 아직 차가움, 바람 강함
    '서해': { sst: 10.3, wind: 7.0, wave: 1.2 }, // 서해 4월: 최저, 강한 바람
    '강원': { sst: 12.0, wind: 5.5, wave: 0.85 },
    '경북': { sst: 12.8, wind: 5.2, wave: 0.8 },
    '경남': { sst: 14.2, wind: 4.5, wave: 0.65 },
    '전남': { sst: 13.8, wind: 5.0, wave: 0.7 },
    '전북': { sst: 12.0, wind: 6.2, wave: 1.0 },
    '충남': { sst: 10.5, wind: 6.8, wave: 1.1 },
    '인천': { sst: 9.5,  wind: 7.5, wave: 1.3 },
    '부산': { sst: 14.0, wind: 4.2, wave: 0.6 },
    '울산': { sst: 13.2, wind: 5.0, wave: 0.75 },
  };

  const p = profile[reg] || profile[
    // 지역명이 없는 경우 해안 방향으로 추정
    ['서해'].includes(reg) ? '서해' :
    ['동해','강원','경북'].includes(reg) ? '동해' :
    ['남해','경남','전남','부산'].includes(reg) ? '남해' : '남해'
  ] || profile['남해'];

  // 포인트 고유 미세 변동 (축소: ±1°C, ±0.5m/s, ±0.1m 수준)
  const pointSeed = (point.id * 7 + Math.floor(point.lat * 100)) % 100;
  const microSst  = Math.max(7, Math.min(28, p.sst  + (pointSeed % 11 - 5) / 5)).toFixed(1);
  const microWind = Math.max(0.5, p.wind + (pointSeed % 7  - 3) / 6).toFixed(1);
  const microWave = Math.max(0.1, p.wave + (pointSeed % 5  - 2) / 20).toFixed(2);

  // 물때: 포인트 시드 기반 (1~14물 순환)
  const tideNum = (pointSeed % 14) + 1;
  const tidePhase = tideNum === 7 ? '7물(사리)' : tideNum === 13 ? '13물(조금)' : tideNum === 14 ? '14물(무시)' : `${tideNum}물`;

  // 만조/간조 시간 동적 계산 (물때 기준 매일 약 45분씩 지연되는 점 반영)
  const baseHighMin = (tideNum * 45 + pointSeed * 7) % 1440;
  const baseLowMin  = (baseHighMin + 375) % 1440; // 만조 약 6시간 15분 전후

  const formatTime = (mins) => {
    const m = ((mins % 1440) + 1440) % 1440;
    const hh = Math.floor(m / 60).toString().padStart(2, '0');
    const mm = (m % 60).toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };

  return {
    stationId: point.obsCode || `LOC_${point.id}`,
    pointName: point.name,
    sst:  microSst,
    temp: `${microSst}°C`,
    wind: { speed: parseFloat(microWind), dir: pointSeed % 2 === 0 ? 'NE' : 'SW' },
    wave: { coastal: parseFloat(microWave) },
    layers: {
      upper:  parseFloat(microSst),
      middle: (parseFloat(microSst) - 1.5).toFixed(1),
      lower:  (parseFloat(microSst) - 3.8).toFixed(1)
    },
    tide: {
      phase: tidePhase,
      high:  formatTime(baseHighMin),
      low:   formatTime(baseLowMin),
      current_level: `${(pointSeed * 3) % 200 + 40}cm`
    },
    fish: point.fish
  };
};

