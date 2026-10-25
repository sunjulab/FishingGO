# 낚시GO — Claude 작업 규칙

안티그래비티(Gemini)에서 개발하다가 2026-10-25에 Claude(Cowork)로 넘어온 프로젝트입니다.
전체 히스토리와 현재 상태는 `docs/HANDOVER_from_Antigravity.md`에 있습니다. 작업 전에 먼저 읽으세요.

## 절대 수정 금지 (기존 Antigravity 규칙 승계)

- `docs/AI_GUIDELINES.md`, `.agents/rules/tide-guardian.md`, `.agents/rules/weather-wave-safety.md`를 그대로 따릅니다.
- 조석 프록시(`server/routes/tide.js`의 `/api/tide/obs`, `tideFcstHghLw` 호출)와 `server/index.js`의 `getNearestKhoaStation()`, +372 오프셋은 건드리지 않습니다. (2026-10-25에 tide.js는 깨진 오류 문구와 기본 날짜 형식만 고쳤고 조회 로직은 그대로입니다)
- 물때 계산(`src/constants/fishingData.js`)은 `lunar-javascript` 기반입니다. 단순 `% 29.53` 계산으로 되돌리지 않습니다. KST 음력 보정과 서해 7물식 분기도 유지합니다.
- 파고는 OpenMeteo 핀포인트 값이 우선입니다. KMA 먼바다 부이 값과 `Math.max`로 섞지 않습니다. 부이 값은 `outerSeaWave` 참고용으로만 씁니다.
- 위 두 파일에 기능을 추가할 때는 조석·기상 영역 밖의 새 줄에 넣습니다.
- 물때가 틀렸을 때는 엔진을 고치지 말고 `src/constants/tideOverrideData.js` 오버라이드나 바다타임 캐시(`tideCalendarData.js`, `scripts/syncTides.mjs`)로 처리합니다.

## 사용자 고정 지시

- 홈 화면 UI 디자인은 사용자가 허락할 때까지 바꾸지 않습니다. 기능 수정은 괜찮습니다.
- 이미지와 아이콘 디자인도 임의로 바꾸지 않습니다.
- 빌드(AAB/APK)는 사용자가 "빌드하라"고 할 때만 합니다. 빌드할 때는 이전 AAB를 지우고 버전을 올려서 새로 만듭니다.
- 고친 뒤에는 오류를 다시 점검합니다. 오류를 고쳤으면 한 번 더 재점검합니다.
- 보고는 원인 → 조치 → 검증 결과 순서로 하고, 사용자가 결정해야 할 것은 따로 표시합니다.

## 빌드와 배포

- 프론트 빌드는 `npm run build:esbuild`를 씁니다. `npm run build`(vite)는 메시지 없이 실패하는 문제가 남아 있습니다.
- 통합 배포: `npm run deploy` (esbuild 빌드 → cap sync → 자동 커밋 → `release:patch`로 push, gh-pages, Render 재배포).
- GitHub Actions의 push 자동 배포(deploy-pages, main)는 중복이라 수동 실행으로 바꿨습니다. 웹 배포는 `npm run deploy`, 서버는 Render autoDeploy가 담당합니다.
- 웹은 GitHub Pages(`gh-pages` 브랜치, www.fishing-go.com)에 올라갑니다. `main`만 push하면 사이트에 반영되지 않습니다.
- 백엔드는 Render(`fishing-go-backend.onrender.com`, free 플랜)입니다. 재기동에 1~3분 걸립니다.
- 안드로이드 앱(Capacitor, `kr.fishinggo.app`)은 `capacitor.config.json`의 `server.url`로 실서버를 불러옵니다. 그래서 웹 배포만 해도 앱 화면이 바뀝니다. 네이티브 변경(플러그인, 아이콘, MainActivity 등)이 있을 때만 AAB가 필요합니다.
- 사용자 PC는 Windows PowerShell입니다. 안내할 명령에 `&&`를 쓰지 않습니다.
- 파일 패치는 UTF-8로 읽고 씁니다. 예전에 PowerShell 패치로 한글이 깨진 적이 있습니다.

## 보안

- API 키, 토큰, 비밀번호를 코드나 문서에 새로 하드코딩하지 않습니다. `.env`, Render 환경변수, GitHub Secrets를 씁니다.
- 2026-10-25에 하드코딩 키(텔레그램 봇 토큰, Render API 키)를 코드에서 제거했습니다. 예전 키는 git 이력에 남아 있으므로 재발급이 필요합니다.
- 필요한 환경변수: Render `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `GITHUB_DISPATCH_TOKEN`, `GOOGLE_PLAY_SERVICE_ACCOUNT` / GitHub Secrets `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `RENDER_API_KEY` / 로컬 `.env`의 `RENDER_API_KEY`
- 결제 등급은 서버 검증으로만 부여합니다. 요청 본문의 `tier` 값을 신뢰하는 코드를 다시 만들지 않습니다.
