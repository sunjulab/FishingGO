# 낚시GO 메타(낚시 게임) 통합 계획

작성 2026-11-04 · 출처: 낚시메타 프로젝트(Cowork). 이 문서는 **계획과 결정 사항**입니다. 10절의 코드 변경은 반영됐고 **빌드·배포는 하지 않았습니다**.

## 1. 한 줄 요약
낚시 게임은 별도 앱이 아니라 **낚시GO 안의 새 화면 `/meta`** 로 넣는다. 로그인·포인트 저장·결제는 낚시GO 계정 하나로 쓴다.

## 2. 게임 원본 위치
- 게임 프로토타입: `Desktop\낚시메타\fishing-meta.html` (단일 HTML, Three.js r128)
- 원본 소스: `Desktop\낚시메타\src\template.html` + `build.py` (포인트 `spots.json`, 지도 `geo.json`, 날씨 `wx.json` 주입)
- 작업 규칙: `Desktop\낚시메타\CLAUDE.md`, 에이전트 정의 `Desktop\낚시메타\agents\`
- 포인트 데이터는 낚시GO `src/constants/fishingData.js`(바다 51) + `freshwaterData.js`(민물 101)에서 추출. 비밀 포인트 제외.
- 날씨는 낚시GO `/api/weather/precision` 값을 그대로 사용(파고 OpenMeteo 핀포인트, Math.max 금지 규칙 준수).

## 3. 하단 메뉴(카테고리) 방식 — 제안
현재 `src/App.jsx` `BottomNav` = 홈 · 낚시채널 · 커뮤니티 · 물때 · 마이 (5칸)

| 위치 | 탭 | 경로 | 비고 |
|---|---|---|---|
| 1 | 홈 | `/` | 그대로 |
| 2 | 물때 | `/tide` | 그대로 |
| 3 (가운데) | **낚시게임** | `/meta` | 새로 추가, 강조 아이콘 |
| 4 | 커뮤니티 | `/community` | 안에 '영상'(현 `/media` 낚시채널) 하위 탭 |
| 5 | 마이 | `/mypage` | 게임 레벨·어록·자동 낚시 남은 시간 표시 |

- 5칸 유지 이유: 메뉴 글씨 10px, 6칸이면 작은 화면에서 이름이 잘림.
- 대안: 낚시채널을 밖에 두고 물때를 홈 안으로. **접속 통계로 덜 쓰는 탭을 정해 결정**.
- `/media`는 경로를 유지하고(외부 링크 보호) 커뮤니티 하위 탭에서 같은 컴포넌트를 띄운다.

## 4. 게임 화면 규칙
- `/meta` 진입 시 하단 메뉴·헤더 숨김(전체 화면). `HIDE_OVERLAY_PATHS`에 `/meta` 추가, 화면 위 '← 나가기'.
- `ROOT_PATHS`에 `/meta` 추가(뒤로가기 동작 통일).
- 게임 랭킹은 이름을 **'게임 랭킹'** 으로 표기 — 실제 조과 랭킹(`/catch-ranking`)·대회(`/contest`)와 구분.

## 5. 다른 화면에서 게임으로 들어오는 길
- 홈 지도 포인트 정보창: "게임으로 이 포인트 가기" (`/meta?spot=<id>`) — **홈 화면 UI 변경이라 사용자 허락 후 진행**.
- 물때·날씨 화면: "지금 이 날씨로 낚시해 보기".
- 낚시채널 ↔ 게임: 카테고리(루어·찌낚시·원투·선상·에깅)가 게임 낚시법과 같으므로 서로 딥링크.
  - 게임 상점 채비 → `/media?cat=에깅` 등, 영상 카드 → `/meta?method=lure`.
  - 영상 시청에 게임 보상을 주지 않는다(유튜브 정책 위험).

## 6. 서버(계정 저장·검증) — 해야 할 일
- MongoDB 컬렉션 `MetaProfile` (userId, pt, inv, eq, dex, spots, rpg, rk, auto).
- API (`verifyToken` 사용):
  - `GET /api/meta/profile` 불러오기, 첫 로그인 시 브라우저 기록 1회 이전
  - `POST /api/meta/catch` 어종·크기·채비·포인트·시각 → 서버가 낚시법·크기 범위·금지체장·시간당 횟수 검증 후 포인트 지급
  - `POST /api/meta/buy` 상점 구매(서버 잔액 차감)
  - `GET /api/meta/rank?period=d|w|m&metric=pt|kg`
  - 자동 낚시 정산은 서버 시간 기준
- 결제 등급처럼 **포인트·랭킹·이용권은 서버 검증만 신뢰**.
- 백엔드 CORS: 현재 Origin 헤더 요청에 500 + CORS 헤더 없음 → 수정 필요(게임·실시간 날씨 공통).
- 동시 접속: socket.io 또는 Cloudflare Durable Objects. 서버비 비교: Render 구성 월 약 $380 vs Cloudflare 구성 월 약 $10~25(10만 가입자 가정).

## 7. 결제(24시간 자동 낚시 9,900원)
- 웹: 포트원(PG). 앱(Capacitor 웹뷰) 안 디지털 상품은 구글 결제 또는 대체결제/외부 링크 정책 준수 — 웹뷰 안 PG 결제창은 정책 위반 소지. 한국 새 수수료 2026년 12월 적용 예정(출시 시점 재확인).
- 청약철회 제한 표시 + 개시 전 환불, 통신판매업 신고, 미성년자 법정대리인 동의.

## 8. 출시 전 체크
- 등급분류: 구글 플레이판 IARC, 웹판은 별도 등급분류(대부분 GCRB).
- 개인정보처리방침에 게임 데이터·랭킹 닉네임 공개 명시, 공개 거부 옵션.
- 확률형 유료 상품 없으면 확률 표시 의무 해당 없음.

## 9. 진행 방식
- 하단 메뉴 수정 + `/meta` 연결은 별도 브랜치에서 작업, **배포·빌드는 사용자 지시 시에만**(CLAUDE.md 규칙).
- ✅ 결정(2026-11-04): 낚시채널을 커뮤니티 안 탭으로 이동 — 적용 완료(미배포). `App.jsx` 하단 메뉴에서 낚시채널 제거, `/media`는 `/community?tab=media`로 이동, `CommunityTab.jsx`에 '📺 낚시채널' 탭(MediaTab embedded) 추가. 지금 하단 메뉴는 홈·커뮤니티·물때·마이 4칸이고, 게임 페이지가 준비되면 가운데에 낚시게임을 넣는다.
- 결정 필요: ② 홈 지도 버튼 추가 허락 ③ 서버 구성(Render 확장 vs Cloudflare)

## 10. 반영 내역 (2026-11-04, 미배포)
- `src/App.jsx`: 하단 메뉴 홈·커뮤니티·**낚시게임(가운데)**·물때·마이. `/meta` 라우트 → `src/pages/MetaGame.jsx`. `HIDE_OVERLAY_PATHS`에 `/meta`(전체 화면), `ROOT_PATHS`에는 넣지 않음(뒤로가기로 이전 화면 복귀).
- `src/pages/MetaGame.jsx`: `public/meta/game.html`을 전체 화면 iframe으로 띄움(같은 출처라 `access_token` 공유). 게임 안 '낚시GO로' 버튼 → `postMessage({type:'meta-exit'})` → 이전 화면. `?spot=<id>` 전달.
- `public/meta/game.html`: 게임 빌드본. 첫 줄 `window.META_CONFIG={api:'',pay:null}` — 게임 서버(Cloudflare) 배포 후 `api` 주소, 포트원 개설 후 `pay:{storeId,channelKey}` 입력. 비어 있으면 브라우저 저장(오프라인) 모드로 동작.
- `server/index.js` CORS(✅ FIX-CORS-500): 허가 안 된 출처를 에러로 넘겨 500이 나던 문제 수정 — 허가 안 된 출처는 CORS 헤더만 빼고 정상 처리, 공개 날씨 GET(`/api/weather/*`)은 모든 출처 허용(쿠키 없이). 날씨 병합·조석 로직은 건드리지 않음.
- 게임 서버: `Desktop\낚시메타\server` (Cloudflare Workers, README에 배포 절차). 결제 비밀키·JWT_SECRET은 `wrangler secret`으로만.
- 배포 순서: ① 게임 서버 배포 → ② game.html `api` 입력 → ③ 낚시GO 빌드·배포(Render 백엔드 CORS 포함).
