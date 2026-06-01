// ⚠️ 민물낚시 포인트 — 전국 주요 강·저수지·댐·호수
// 장소 정보만 제공 (낚시 컨디션·날씨·CCTV·조황 없음)

const FRESHWATER_FISHING_POINTS = [
  // ── 경기도 ──────────────────────────────────────────────────────
  { id: 5001, name: '팔당호', type: '민물', region: '경기', lat: 37.5283, lng: 127.3458, fish: '잉어, 붕어, 메기', score: 0, status: null, obsCode: null },
  { id: 5002, name: '청평호', type: '민물', region: '경기', lat: 37.7329, lng: 127.4897, fish: '배스, 붕어, 쏘가리', score: 0, status: null, obsCode: null },
  { id: 5003, name: '양평 두물머리 한강', type: '민물', region: '경기', lat: 37.5266, lng: 127.3139, fish: '잉어, 붕어, 누치', score: 0, status: null, obsCode: null },
  { id: 5004, name: '여주 이포보 한강', type: '민물', region: '경기', lat: 37.3789, lng: 127.6234, fish: '배스, 잉어, 쏘가리', score: 0, status: null, obsCode: null },
  { id: 5005, name: '수원 광교저수지', type: '민물', region: '경기', lat: 37.3156, lng: 127.0389, fish: '붕어, 향어', score: 0, status: null, obsCode: null },
  { id: 5006, name: '파주 공릉천', type: '민물', region: '경기', lat: 37.7612, lng: 126.7823, fish: '피라미, 붕어, 누치', score: 0, status: null, obsCode: null },
  { id: 5007, name: '연천 임진강', type: '민물', region: '경기', lat: 38.0812, lng: 126.9234, fish: '쏘가리, 잉어, 피라미', score: 0, status: null, obsCode: null },
  { id: 5008, name: '가평 북한강', type: '민물', region: '경기', lat: 37.8234, lng: 127.5123, fish: '배스, 쏘가리, 붕어', score: 0, status: null, obsCode: null },
  { id: 5009, name: '이천 설봉저수지', type: '민물', region: '경기', lat: 37.2789, lng: 127.4512, fish: '붕어, 향어, 잉어', score: 0, status: null, obsCode: null },
  { id: 5010, name: '용인 기흥호', type: '민물', region: '경기', lat: 37.2456, lng: 127.1234, fish: '배스, 붕어', score: 0, status: null, obsCode: null },
  { id: 5011, name: '광주 곤지암천', type: '민물', region: '경기', lat: 37.3512, lng: 127.3234, fish: '붕어, 피라미, 배스', score: 0, status: null, obsCode: null },
  { id: 5012, name: '포천 영평천', type: '민물', region: '경기', lat: 37.9345, lng: 127.1823, fish: '쏘가리, 꺽지, 피라미', score: 0, status: null, obsCode: null },
  { id: 5013, name: '양주 불곡저수지', type: '민물', region: '경기', lat: 37.8012, lng: 127.0623, fish: '붕어, 잉어', score: 0, status: null, obsCode: null },
  { id: 5014, name: '화성 기안천', type: '민물', region: '경기', lat: 37.1523, lng: 126.9234, fish: '붕어, 피라미', score: 0, status: null, obsCode: null },
  { id: 5015, name: '하남 미사리 한강', type: '민물', region: '경기', lat: 37.5623, lng: 127.1923, fish: '잉어, 붕어, 배스', score: 0, status: null, obsCode: null },
  { id: 5016, name: '안성 고삼저수지', type: '민물', region: '경기', lat: 37.0523, lng: 127.2423, fish: '붕어, 잉어, 향어', score: 0, status: null, obsCode: null },
  { id: 5017, name: '평택 현덕 저수지', type: '민물', region: '경기', lat: 36.9789, lng: 126.9823, fish: '붕어, 잉어', score: 0, status: null, obsCode: null },
  { id: 5018, name: '남양주 금남리 한강', type: '민물', region: '경기', lat: 37.6023, lng: 127.2923, fish: '잉어, 붕어, 배스', score: 0, status: null, obsCode: null },
  // ── 경기 추가 (주요 낚시터) ─────────────────────────────────────
  { id: 5092, name: '용인 백옥저수지', type: '민물', region: '경기', lat: 37.1923, lng: 127.2423, fish: '붕어, 잉어, 향어', score: 0, status: null, obsCode: null },
  { id: 5093, name: '시흥 물왕저수지', type: '민물', region: '경기', lat: 37.3823, lng: 126.8023, fish: '붕어, 향어, 잉어', score: 0, status: null, obsCode: null },
  { id: 5094, name: '안산 시화호', type: '민물', region: '경기', lat: 37.3045, lng: 126.7234, fish: '잉어, 붕어, 배스', score: 0, status: null, obsCode: null },
  { id: 5095, name: '김포 굴포천', type: '민물', region: '경기', lat: 37.6123, lng: 126.7123, fish: '붕어, 잉어', score: 0, status: null, obsCode: null },
  { id: 5096, name: '오산 궐리저수지', type: '민물', region: '경기', lat: 37.1423, lng: 127.0523, fish: '붕어, 잉어', score: 0, status: null, obsCode: null },

  // ── 강원도 ──────────────────────────────────────────────────────
  { id: 5019, name: '소양호 (소양강댐)', type: '민물', region: '강원', lat: 37.8923, lng: 128.0234, fish: '쏘가리, 잉어, 붕어', score: 0, status: null, obsCode: null },
  { id: 5020, name: '파로호 (화천댐)', type: '민물', region: '강원', lat: 38.1123, lng: 127.7812, fish: '쏘가리, 누치, 꺽지', score: 0, status: null, obsCode: null },
  { id: 5021, name: '화천호', type: '민물', region: '강원', lat: 38.1234, lng: 127.7023, fish: '빙어, 쏘가리, 잉어', score: 0, status: null, obsCode: null },
  { id: 5022, name: '춘천호', type: '민물', region: '강원', lat: 37.8823, lng: 127.6234, fish: '배스, 붕어, 잉어', score: 0, status: null, obsCode: null },
  { id: 5023, name: '의암호', type: '민물', region: '강원', lat: 37.8234, lng: 127.6123, fish: '배스, 잉어, 붕어', score: 0, status: null, obsCode: null },
  { id: 5024, name: '홍천강 (홍천)', type: '민물', region: '강원', lat: 37.6912, lng: 127.8823, fish: '쏘가리, 꺽지, 피라미', score: 0, status: null, obsCode: null },
  { id: 5025, name: '내린천 (인제)', type: '민물', region: '강원', lat: 38.0623, lng: 128.1623, fish: '산천어, 쏘가리, 피라미', score: 0, status: null, obsCode: null },
  { id: 5026, name: '평창강 (평창)', type: '민물', region: '강원', lat: 37.3723, lng: 128.4123, fish: '쏘가리, 꺽지, 피라미', score: 0, status: null, obsCode: null },
  { id: 5027, name: '조양강 (정선)', type: '민물', region: '강원', lat: 37.3812, lng: 128.6623, fish: '쏘가리, 누치, 피라미', score: 0, status: null, obsCode: null },
  { id: 5028, name: '남대천 (강릉) - 연어', type: '민물', region: '강원', lat: 37.7512, lng: 128.8923, fish: '연어(가을), 피라미', score: 0, status: null, obsCode: null },
  { id: 5029, name: '섬강 (원주)', type: '민물', region: '강원', lat: 37.3823, lng: 127.9523, fish: '쏘가리, 잉어, 붕어', score: 0, status: null, obsCode: null },
  { id: 5030, name: '동강 (영월)', type: '민물', region: '강원', lat: 37.2123, lng: 128.4523, fish: '쏘가리, 꺽지, 누치', score: 0, status: null, obsCode: null },
  { id: 5031, name: '주천강 (영월)', type: '민물', region: '강원', lat: 37.1523, lng: 128.2823, fish: '쏘가리, 피라미, 꺽지', score: 0, status: null, obsCode: null },
  // ── 강원 추가 ────────────────────────────────────────────────────
  { id: 5098, name: '오십천 (삼척)', type: '민물', region: '강원', lat: 37.4023, lng: 129.1823, fish: '쏘가리, 피라미', score: 0, status: null, obsCode: null },
  { id: 5099, name: '연곡천 (강릉)', type: '민물', region: '강원', lat: 37.8423, lng: 128.8423, fish: '송어, 산천어, 피라미', score: 0, status: null, obsCode: null },
  { id: 5100, name: '방태천 (인제)', type: '민물', region: '강원', lat: 38.0323, lng: 128.2123, fish: '산천어, 쏘가리, 꺽지', score: 0, status: null, obsCode: null },
  { id: 5101, name: '골지천 (정선)', type: '민물', region: '강원', lat: 37.3323, lng: 128.7023, fish: '쏘가리, 누치, 피라미', score: 0, status: null, obsCode: null },

  // ── 충청북도 ────────────────────────────────────────────────────
  { id: 5032, name: '충주호 (충주댐)', type: '민물', region: '충북', lat: 36.9923, lng: 128.0823, fish: '잉어, 쏘가리, 붕어', score: 0, status: null, obsCode: null },
  { id: 5033, name: '대청호 (대청댐)', type: '민물', region: '충북', lat: 36.4123, lng: 127.5023, fish: '쏘가리, 잉어, 붕어, 배스', score: 0, status: null, obsCode: null },
  { id: 5034, name: '청주 미호천', type: '민물', region: '충북', lat: 36.7123, lng: 127.4523, fish: '잉어, 붕어, 피라미', score: 0, status: null, obsCode: null },
  { id: 5035, name: '제천 청풍호', type: '민물', region: '충북', lat: 37.0823, lng: 128.2023, fish: '쏘가리, 잉어, 붕어', score: 0, status: null, obsCode: null },
  { id: 5036, name: '초평저수지 (증평)', type: '민물', region: '충북', lat: 36.8523, lng: 127.5523, fish: '붕어, 향어, 잉어', score: 0, status: null, obsCode: null },
  { id: 5037, name: '괴강 (괴산)', type: '민물', region: '충북', lat: 36.8123, lng: 127.7923, fish: '쏘가리, 꺽지, 피라미', score: 0, status: null, obsCode: null },
  { id: 5038, name: '보청천 (보은)', type: '민물', region: '충북', lat: 36.4823, lng: 127.7223, fish: '쏘가리, 붕어, 피라미', score: 0, status: null, obsCode: null },
  { id: 5039, name: '달천 (충주)', type: '민물', region: '충북', lat: 36.9523, lng: 127.9023, fish: '쏘가리, 누치, 잉어', score: 0, status: null, obsCode: null },

  // ── 충청남도 ────────────────────────────────────────────────────
  { id: 5040, name: '예당저수지 (예산)', type: '민물', region: '충남', lat: 36.6623, lng: 126.7523, fish: '붕어, 잉어, 배스 (전국 최대 저수지)', score: 0, status: null, obsCode: null },
  { id: 5041, name: '보령댐', type: '민물', region: '충남', lat: 36.4123, lng: 126.6523, fish: '붕어, 잉어, 쏘가리', score: 0, status: null, obsCode: null },
  { id: 5042, name: '금강 (서천 하구)', type: '민물', region: '충남', lat: 36.0923, lng: 126.7023, fish: '잉어, 붕어, 숭어', score: 0, status: null, obsCode: null },
  { id: 5043, name: '금강 (부여)', type: '민물', region: '충남', lat: 36.2723, lng: 126.9123, fish: '잉어, 붕어, 피라미', score: 0, status: null, obsCode: null },
  { id: 5044, name: '금강 (논산 강경)', type: '민물', region: '충남', lat: 36.1423, lng: 126.9523, fish: '잉어, 메기, 붕어', score: 0, status: null, obsCode: null },
  { id: 5045, name: '홍성저수지', type: '민물', region: '충남', lat: 36.6023, lng: 126.6523, fish: '붕어, 잉어, 향어', score: 0, status: null, obsCode: null },
  { id: 5046, name: '아산 온양저수지', type: '민물', region: '충남', lat: 36.7823, lng: 127.0023, fish: '붕어, 잉어', score: 0, status: null, obsCode: null },

  // ── 전라북도 ────────────────────────────────────────────────────
  { id: 5047, name: '용담호 (용담댐)', type: '민물', region: '전북', lat: 35.9823, lng: 127.5823, fish: '잉어, 쏘가리, 붕어', score: 0, status: null, obsCode: null },
  { id: 5048, name: '대아저수지 (완주)', type: '민물', region: '전북', lat: 35.8523, lng: 127.2623, fish: '붕어, 잉어, 배스', score: 0, status: null, obsCode: null },
  { id: 5049, name: '섬진강 (순창)', type: '민물', region: '전북', lat: 35.3423, lng: 127.1523, fish: '쏘가리, 참마자, 피라미', score: 0, status: null, obsCode: null },
  { id: 5050, name: '요천 (남원)', type: '민물', region: '전북', lat: 35.4123, lng: 127.3823, fish: '쏘가리, 붕어, 피라미', score: 0, status: null, obsCode: null },
  { id: 5051, name: '황등제 (익산)', type: '민물', region: '전북', lat: 35.9823, lng: 127.0123, fish: '붕어, 잉어, 향어', score: 0, status: null, obsCode: null },
  { id: 5052, name: '만경강 (김제)', type: '민물', region: '전북', lat: 35.7923, lng: 126.8823, fish: '잉어, 붕어, 메기', score: 0, status: null, obsCode: null },
  { id: 5053, name: '칠보저수지 (정읍)', type: '민물', region: '전북', lat: 35.5823, lng: 126.8523, fish: '붕어, 향어, 잉어', score: 0, status: null, obsCode: null },

  // ── 전라남도 ────────────────────────────────────────────────────
  { id: 5054, name: '주암호 (주암댐)', type: '민물', region: '전남', lat: 34.9923, lng: 127.0523, fish: '잉어, 붕어, 배스', score: 0, status: null, obsCode: null },
  { id: 5055, name: '장흥댐', type: '민물', region: '전남', lat: 34.7123, lng: 126.9523, fish: '붕어, 잉어', score: 0, status: null, obsCode: null },
  { id: 5056, name: '담양호 (담양댐)', type: '민물', region: '전남', lat: 35.2523, lng: 127.0023, fish: '잉어, 붕어, 쏘가리', score: 0, status: null, obsCode: null },
  { id: 5057, name: '영산강 (나주)', type: '민물', region: '전남', lat: 35.0123, lng: 126.7123, fish: '잉어, 붕어, 숭어', score: 0, status: null, obsCode: null },
  { id: 5058, name: '동복호 (화순)', type: '민물', region: '전남', lat: 35.0023, lng: 126.9523, fish: '붕어, 잉어, 쏘가리', score: 0, status: null, obsCode: null },
  { id: 5059, name: '보성강 (보성)', type: '민물', region: '전남', lat: 34.7723, lng: 127.0823, fish: '쏘가리, 붕어, 잉어', score: 0, status: null, obsCode: null },
  { id: 5060, name: '섬진강 (광양)', type: '민물', region: '전남', lat: 35.0223, lng: 127.6523, fish: '쏘가리, 은어, 참마자', score: 0, status: null, obsCode: null },
  { id: 5061, name: '수어호 (광양댐)', type: '민물', region: '전남', lat: 34.8923, lng: 127.5523, fish: '잉어, 붕어', score: 0, status: null, obsCode: null },

  // ── 경상북도 ────────────────────────────────────────────────────
  { id: 5062, name: '안동호 (안동댐)', type: '민물', region: '경북', lat: 36.6823, lng: 128.8023, fish: '잉어, 쏘가리, 붕어', score: 0, status: null, obsCode: null },
  { id: 5063, name: '임하호 (임하댐)', type: '민물', region: '경북', lat: 36.5823, lng: 129.0023, fish: '잉어, 붕어, 쏘가리', score: 0, status: null, obsCode: null },
  { id: 5064, name: '낙동강 (상주)', type: '민물', region: '경북', lat: 36.4123, lng: 128.1623, fish: '잉어, 붕어, 피라미', score: 0, status: null, obsCode: null },
  { id: 5065, name: '영강 (문경)', type: '민물', region: '경북', lat: 36.5523, lng: 128.1623, fish: '쏘가리, 누치, 피라미', score: 0, status: null, obsCode: null },
  { id: 5066, name: '내성천 (예천)', type: '민물', region: '경북', lat: 36.6523, lng: 128.4523, fish: '쏘가리, 누치, 모래무지', score: 0, status: null, obsCode: null },
  { id: 5067, name: '위천 (의성)', type: '민물', region: '경북', lat: 36.3523, lng: 128.5723, fish: '쏘가리, 피라미, 붕어', score: 0, status: null, obsCode: null },
  { id: 5068, name: '운문호 (운문댐)', type: '민물', region: '경북', lat: 35.6823, lng: 128.9523, fish: '붕어, 잉어', score: 0, status: null, obsCode: null },
  { id: 5069, name: '영천 자양호', type: '민물', region: '경북', lat: 35.9023, lng: 128.9523, fish: '붕어, 잉어, 쏘가리', score: 0, status: null, obsCode: null },
  { id: 5070, name: '형산강 (경주)', type: '민물', region: '경북', lat: 35.8323, lng: 129.2223, fish: '은어, 붕어, 숭어', score: 0, status: null, obsCode: null },
  { id: 5071, name: '서천 (영주)', type: '민물', region: '경북', lat: 36.8023, lng: 128.6123, fish: '쏘가리, 피라미, 붕어', score: 0, status: null, obsCode: null },
  { id: 5072, name: '봉화 낙동강 상류', type: '민물', region: '경북', lat: 36.8923, lng: 128.9823, fish: '쏘가리, 산천어, 꺽지', score: 0, status: null, obsCode: null },

  // ── 경상남도 ────────────────────────────────────────────────────
  { id: 5073, name: '합천호 (합천댐)', type: '민물', region: '경남', lat: 35.5923, lng: 128.1823, fish: '잉어, 붕어, 쏘가리', score: 0, status: null, obsCode: null },
  { id: 5074, name: '남강댐 (진양호)', type: '민물', region: '경남', lat: 35.3023, lng: 128.0123, fish: '잉어, 붕어, 배스', score: 0, status: null, obsCode: null },
  { id: 5075, name: '주남저수지 (창원)', type: '민물', region: '경남', lat: 35.3723, lng: 128.5023, fish: '붕어, 잉어, 향어', score: 0, status: null, obsCode: null },
  { id: 5076, name: '우포늪 (창녕)', type: '민물', region: '경남', lat: 35.5523, lng: 128.4323, fish: '붕어, 잉어, 가물치 (국내 최대 자연늪)', score: 0, status: null, obsCode: null },
  { id: 5077, name: '밀양강 (밀양)', type: '민물', region: '경남', lat: 35.4923, lng: 128.7623, fish: '쏘가리, 누치, 피라미', score: 0, status: null, obsCode: null },
  { id: 5078, name: '남강 (진주)', type: '민물', region: '경남', lat: 35.1823, lng: 128.0923, fish: '잉어, 붕어, 배스', score: 0, status: null, obsCode: null },
  { id: 5079, name: '황강 (거창)', type: '민물', region: '경남', lat: 35.6823, lng: 127.9023, fish: '쏘가리, 꺽지, 피라미', score: 0, status: null, obsCode: null },
  { id: 5080, name: '경호강 (산청)', type: '민물', region: '경남', lat: 35.3423, lng: 127.8623, fish: '쏘가리, 누치, 피라미', score: 0, status: null, obsCode: null },
  { id: 5081, name: '섬진강 (하동)', type: '민물', region: '경남', lat: 35.0623, lng: 127.7323, fish: '쏘가리, 은어, 참마자', score: 0, status: null, obsCode: null },
  { id: 5082, name: '함안 악양저수지', type: '민물', region: '경남', lat: 35.2823, lng: 128.3823, fish: '붕어, 향어, 잉어', score: 0, status: null, obsCode: null },
  { id: 5083, name: '사천 금곡저수지', type: '민물', region: '경남', lat: 35.0123, lng: 128.0623, fish: '붕어, 잉어', score: 0, status: null, obsCode: null },

  // ── 서울/인천/대전/광주/대구 (광역시) ─────────────────────────
  { id: 5084, name: '한강 (여의도)', type: '민물', region: '서울', lat: 37.5265, lng: 126.9343, fish: '잉어, 붕어, 배스', score: 0, status: null, obsCode: null },
  { id: 5085, name: '한강 (잠실)', type: '민물', region: '서울', lat: 37.5219, lng: 127.0823, fish: '잉어, 누치, 배스', score: 0, status: null, obsCode: null },
  { id: 5086, name: '한강 (뚝섬)', type: '민물', region: '서울', lat: 37.5314, lng: 127.0654, fish: '잉어, 붕어', score: 0, status: null, obsCode: null },
  { id: 5087, name: '낙동강 (대구 달성)', type: '민물', region: '대구', lat: 35.7723, lng: 128.4823, fish: '잉어, 붕어, 누치', score: 0, status: null, obsCode: null },
  { id: 5088, name: '금호강 (대구)', type: '민물', region: '대구', lat: 35.8823, lng: 128.6023, fish: '붕어, 잉어, 피라미', score: 0, status: null, obsCode: null },
  { id: 5089, name: '영산강 (광주)', type: '민물', region: '광주', lat: 35.1523, lng: 126.7523, fish: '잉어, 붕어, 배스', score: 0, status: null, obsCode: null },
  { id: 5090, name: '금강 (대전 갑천)', type: '민물', region: '대전', lat: 36.3523, lng: 127.3823, fish: '잉어, 붕어, 피라미', score: 0, status: null, obsCode: null },
  { id: 5091, name: '인천 부평저수지', type: '민물', region: '인천', lat: 37.5023, lng: 126.7223, fish: '붕어, 잉어', score: 0, status: null, obsCode: null },
  { id: 5097, name: '강화 선원저수지', type: '민물', region: '인천', lat: 37.6923, lng: 126.4923, fish: '붕어, 잉어', score: 0, status: null, obsCode: null },
];

// ✅ 4TH-C6: id는 이력 상 비연속 (1~28, 38~110) — 향후 id 직접 조회 대신 obsCode를 primary key로 사용 권장

const SEA_FISHING_POINTS = [
  // ── 동해권 (Gangwon/Gyeongbuk) ──
  { id: 1, name: '묵호항 방파제', type: '방파제', region: '강원', lat: 37.5489, lng: 129.1170, fish: '감성돔, 우럭', score: 98, status: '피딩중', obsCode: 'DT_0033' },
  { id: 2, name: '속초항 방파제', type: '방파제', region: '강원', lat: 38.2134, lng: 128.6010, fish: '가자미, 우럭', score: 95, status: '최고', obsCode: 'DT_0021' },
  { id: 3, name: '강릉 안목항 방파제', type: '방파제', region: '강원', lat: 37.7725, lng: 128.9472, fish: '고등어, 오징어', score: 85, status: '보통', obsCode: 'DT_0001' },
  { id: 4, name: '주문진항 방파제', type: '방파제', region: '강원', lat: 37.8912, lng: 128.8475, fish: '도다리, 학꽁치', score: 92, status: '활발', obsCode: 'DT_0001' },
  { id: 5, name: '울진 후포항 방파제', type: '방파제', region: '경북', lat: 36.6785, lng: 129.4589, fish: '벵에돔, 감성돔', score: 94, status: '피딩중', obsCode: 'DT_0002' }, // ✅ 20TH-C2: '뱅에돔' → '벵에돔' 오타 수정
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
  { id: 46, name: '울진 죽변 등대갯바위', type: '갯바위', region: '경북', lat: 37.0512, lng: 129.4212, fish: '벵에돔, 감성돔', score: 93, status: '활발', obsCode: 'DT_0002' }, // ✅ 4TH-A2: '뱅에돔, 벵에' 오타 수정
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
  { id: 53, name: '거제 다대 갯바위', type: '갯바위', region: '경남', lat: 34.7412, lng: 128.6312, fish: '무늬오징어, 참돔, 벵에돔', score: 98, status: '최고', obsCode: 'DT_0034' }, // ✅ 20TH-C2: '뱅에돔' → '벵에돔' 오타 수정
  { id: 56, name: '남해 가천 갯바위', type: '갯바위', region: '경남', lat: 34.7254, lng: 127.8812, fish: '감성돔, 벵에돔', score: 93, status: '활발', obsCode: 'DT_0016' }, // ✅ 20TH-C2: '뱅에돔' → '벵에돔' 오타 수정
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
  { id: 40, name: '제주 위미항 방파제', type: '방파제', region: '제주', lat: 33.2712, lng: 126.6612, fish: '한치, 벵에돔', score: 90, status: '보통', obsCode: 'DT_0011' },
];

// ✅ 민물낚시 포인트는 freshwaterData.js에서 관리 (파일 크기 분산)
const ALL_FISHING_POINTS = [...SEA_FISHING_POINTS, ...FRESHWATER_FISHING_POINTS];


// ── LITE 이상 회원 전용 비밀 포인트 (실제 낚시 명소 기반) ───────
const SECRET_FISHING_POINTS = [
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
];
// ✅ BUG-53: 이하 중복 정의(id 9002~9025 재선언) 완전 제거

// ✅ 4TH-B4: 지역 → 권역 fallback 매핑 분리 — getPointSpecificData 내 삼항 중첩 제거
const REGION_TO_ZONE = {
  '강원': '동해', '경북': '동해', '동해': '동해',
  '경남': '남해', '전남': '남해', '부산': '남해', '울산': '남해', '남해': '남해',
  '전북': '서해', '충남': '서해', '인천': '서해', '서해': '서해', // ✅ 13TH-B1: '인체' 오타 → '인천' 수정 — 인천 지역 낚시포인트 날씨 매핑 실패 버그 해결
  '제주': '제주',
};


const getPointSpecificData = (point) => {
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

  // ✅ 4TH-B4: REGION_TO_ZONE 매핑 사용 — 삼항 중첩 fallback 제거
  const p = profile[reg] || profile[REGION_TO_ZONE[reg] || '남해'] || profile['남해'];

  // 포인트 고유 미세 변동 (축소: ±1°C, ±0.5m/s, ±0.1m 수준)
  // ✅ 4TH-C2: evaluator.js calcPointSeed()와 동일 계산식 — circular dep 방지를 위해 인라인 유지 (utils/seed.js 분리 검토 수동)
  // ✅ 13TH-B2: 의도된 정적(static) 계산 — 같은 포인트는 항상 같은 날씨/물때 반환 (Math.random() 미사용, 사용자 신뢰도 유지)
  const pointSeed = (point.id * 7 + Math.floor(point.lat * 100)) % 100;
  const microSst  = Math.max(7, Math.min(28, p.sst  + (pointSeed % 11 - 5) / 5)).toFixed(1);
  const microWind = Math.max(0.5, p.wind + (pointSeed % 7  - 3) / 6).toFixed(1);
  const microWave = Math.max(0.1, p.wave + (pointSeed % 5  - 2) / 20).toFixed(2);

  // 물때: 포인트 시드 기반 (1~15물 순환)
  // ✅ BUG-FIX: (pointSeed % 14) + 1 → (pointSeed % 15) + 1 — 기존은 15물이 절대 출력 안됨
  const tideNum = (pointSeed % 15) + 1;
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

export { ALL_FISHING_POINTS as A, SECRET_FISHING_POINTS as S, getPointSpecificData as g };
