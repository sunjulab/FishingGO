# 낚시GO 인수인계 — Antigravity → Claude

작성일: 2026-10-25

출처는 세 가지입니다.

- 안티그래비티 대화 기록: 낚시GO 워크스페이스 대화 61개, 2026-03-29 ~ 10-18. `conversation_summaries.db`의 검색 색인에서 추출했습니다.
- 안티그래비티 brain 아티팩트: 계획서, 워크스루, 보고서.
- 프로젝트 폴더와 `.git` 로그: 커밋 이력 약 1,370건.

> **한계:** 대화 색인에는 매우 긴 대화의 일부만 들어 있습니다. 예를 들어 8월 14일 대화는 13,954단계 중 일부만 남아 있습니다. 사용자 요청은 전부 확인했고, 에이전트 응답은 각 구간의 결론부를 중심으로 확인했습니다. 이 세션에서는 PC에서 명령을 실행할 수 없어 `git status`, 커밋 안 된 변경 여부는 직접 확인하지 못했습니다.

---

## 1. 현재 상태 요약

- **최신 릴리스:** v1.0.149. 2026-10-18 배포됐고, 사이트 제목을 "대한민국 낚시인의 필수 플랫폼 (물때·CCTV·예보)"으로 바꾼 내용입니다. robots.txt와 sitemap.xml도 함께 정리했습니다.
- **직전 작업 (10/14~10/15):**
  - 파고 부이 번호 재매핑
  - 육지 격자 파고 보정, 캐시 오염 수정
  - 물때 음력 KST 보정, 서해 7물식, KHOA URL 오타 수정
  - 물때 가디언 자동 점검(12:00/24:00), 자가치유, 텔레그램 보고
  - 텔레그램 양방향 봇(@sunju_dev_bot) — 파고·풍속 브리핑
- **운영 주소:**
  - 웹: www.fishing-go.com (GitHub Pages)
  - 예전 주소: fishing-go.vercel.app
  - API: fishing-go-backend.onrender.com
- **저장소:** github.com/sunjulab/FishingGO. `main`이 소스, `gh-pages`가 웹 배포용입니다.
- **앱:** Android, Google Play Console 비공개 테스트 단계. iOS는 웹으로만 사용합니다.

## 2. 아키텍처

| 영역 | 구성 |
| --- | --- |
| 프론트 | React 18, Vite 5 (실제 배포 빌드는 `build-esbuild.mjs`), react-router 7, zustand, PWA, Kakao 지도 (Naver는 인증 문제로 보류) |
| 백엔드 | Node 20, Express, socket.io (`server/index.js` 약 600KB 단일 파일, `cluster.js`), MongoDB Atlas, JSON 파일 폴백, Cloudinary, Winston, Helmet, rate-limit, node-cron, firebase-admin(푸시), CoolSMS |
| 앱 | Capacitor 8. `server.url`이 실서버를 가리키는 라이브 웹 방식입니다. AdMob, IAP(cordova-plugin-purchase), 강제 업데이트(app-update), 푸시를 씁니다. |
| 배포 | `npm run deploy` (`scripts/deploy-all.mjs`): esbuild → cap sync → 커밋 → `release:patch` (`update-version.cjs --push`: push, gh-pages, Render 재배포) |
| CI | `.github/workflows`: main(Render 트리거), deploy-pages, keep-alive x2, beach-push, render-deploy-on-reset, tide-guardian-auto-heal |
| 품질 | husky와 lint-staged(ESLint) 커밋 차단, `scripts/guardian-check.cjs`(핵심 조석 로직이 훼손되면 배포 차단) |

주요 화면은 `src/pages`에 있습니다.

- MapHome (홈), DashboardView, TideTab, TideCalendar, WeatherDashboard
- MediaTab / Channel (낚시채널)
- CommunityTab (낚시그램, 크루, 공지, 선상배홍보), CrewChat
- Shop, MyPage, VVIPSubscribe, PaymentHistory
- 관리자 화면: AdminDashboard, CctvAdmin, PointLocationAdmin, SecretPointAdmin
- CatchRanking, Contest, AiCoach

## 3. 기능 현황 (개발 순서대로)

1. **기본 골격 (3월 말~4월 초):**
   - 하단 5탭 (홈, 낚시채널, 커뮤니티, 쇼핑, 마이)
   - 블루 그라디언트 홈, 낚시 점수, 황금 피딩타임 통합 카드
   - 홈 UI는 이때 사용자가 디자인을 고정했습니다.
2. **포인트·해양 데이터:**
   - 전국 항구, 방파제, 갯바위, 해수욕장, 민물 포인트 (바다 포인트 139개 기준으로 점검)
   - 수온 (층별, 히트맵), 물때, 파고, 풍속
   - 장소별 AI 낚시 컨디션 설명, 숨겨진(시크릿) 포인트
   - 마스터 포인트 추가·위치 편집
3. **CCTV:**
   - 연안포털(coast.mof) 영상이 기본이고, KBS cctvShare와 YouTube가 보조입니다.
   - 마스터가 포인트별로 링크를 수정할 수 있습니다. 우선순위는 포인트 → 관측소 → 기본입니다.
   - CCTV가 없으면 "준비중" 이미지를 보여줍니다. 유료 플랜이거나 광고를 시청한 뒤에 볼 수 있습니다.
4. **낚시채널:**
   - YouTube Data API 기반입니다. 인기순(한 달 이내), 유튜버 채널 검색, 무한 스크롤이 됩니다.
   - 검색은 분당 3회로 제한됩니다.
   - 맨 위에는 사용자 채널(UCeTWH8xNp0pg3qtI4Kz1yuQ)의 최신 롱폼 1개가 고정됩니다. 쇼츠는 제외하고 최근 50개까지 탐색합니다.
5. **커뮤니티:**
   - 낚시그램: 인스타그램처럼 목록에서 더보기로 펼치고, 여러 장 사진을 슬라이드로 봅니다. 기본 보기는 그리드입니다.
   - 공지(마스터만 작성), 선상배홍보, 댓글, 욕설·금지 닉네임 필터
   - 크루: 4자리 입장코드, 최대 인원 설정(1000명 이슈 수정), 강퇴·삭제, 원형 로고, 실시간 채팅(닉네임과 레벨 표시, 내 메시지는 오른쪽 파란색), 게시글·공지·선상배 공유
6. **선상배홍보:**
   - 권역을 고르면 항구 칩이 펼쳐집니다. 가로 안쪽 이름은 표기만 하고 하나로 묶었으며 37개입니다.
   - PRO와 VIP는 글 1개만 쓸 수 있고, VIP는 지역별 선착순 1명입니다.
   - AI 홍보문구 생성, 전화 연결, 작성자 수정·삭제, 사진 슬라이드
7. **마이페이지:**
   - 아이디 가입 (아이디·닉네임 중복확인, 이름·전화번호 저장)
   - 자동출석, 끝없는 레벨업 (보상은 배지), 조과기록, 팔로워, 프로필 사진
   - 알림 설정 (푸시), 차단, 구독 관리
   - 구글 로그인은 아이콘만 제거한 상태이고 나중에 연동합니다.
8. **쇼핑:**
   - 쿠팡 파트너스와 알리익스프레스 트래킹 링크
   - 마스터 상품 추가·삭제, 추천 카테고리를 맨 위에 두고 그 아래 전체 상품
   - 검색 키워드 매칭, 권장채비 아래 쇼핑 아이템 2~3개
9. **수익화:**
   - 플랜 4종: 무료, 베이직(라이트), PRO, VVIP
   - 상품 ID: `kr.fishinggo.app.lite_monthly`, `pro_monthly`, `vvip_monthly`. 모두 월 정기결제입니다.
   - 베이직 가격은 9/20에 Play Console과 맞춰 ₩3,300으로 바뀌었습니다 (원래 ₩9,900). PRO는 월 ₩110,000, VVIP는 월 ₩550,000입니다.
   - Google IAP는 연동됐습니다. UCB(외부결제)는 "준비중"으로 표시하고 코드만 준비해 두었습니다.
   - 결제가 갱신되지 않으면 권한을 자동 해제합니다.
   - 광고: AdMob(배너, 네이티브, 보상형), Kakao AdFit, AdSense. 낚시그램은 광고 시청 없이 글을 올릴 수 있습니다.
10. **앱 품질:**
    - 강제 업데이트, 딥링크 공유 (앱이 있으면 해당 화면으로, 없으면 설치 페이지로)
    - 카카오 인앱브라우저 대응, 오류가 나면 자동 새로고침 1~2회 (오류 코드는 마스터에게만 표시)
    - "네트워크 연결됨" 알림이 겹쳐 뜨지 않도록 억제
    - Android edge-to-edge safe-area 처리 (MainActivity)
11. **해양 데이터 정확도 (8월~10월 집중):**
    - 낚시 점수 엔진 `src/utils/evaluator.js`: 워킹 낚시 기준입니다. 풍속 6m/s 한계, 포말 구간 가점, 갯바위 −15 / 내항 +10 보정. 서버 점수와 동일하게 맞췄습니다.
    - 풍속: KMA 초단기실황을 1순위로 씁니다.
    - 파고: OpenMeteo 핀포인트를 우선합니다. 동해 연안 증폭은 조정했습니다. 8월에 포말 오프셋(×1.8 + 0.2)을 적용했는데, 10월 수정 뒤에도 남아 있는지는 확인이 필요합니다.
    - 수온: 데이터 신뢰도 등급 우선순위를 두고, 48시간이 지난 NIFS 값은 폐기합니다.
    - 물때: 바다타임 캐시(2026-08~2027-03, 21개 관측소)를 우선 쓰고, KHOA 직결, 이중 재매핑을 제거했습니다.

## 4. 자동화·가디언 체계

- **`.github/workflows/tide-guardian-auto-heal.yml`:** 매일 12:00과 24:00(KST)에 실행됩니다.
  1. `guardian-tide-21.mjs`로 21개 관측소를 바다타임과 대조합니다.
  2. 불일치가 있으면 `auto-heal-tide.mjs`가 `tideOverrideData.js`를 수정합니다.
  3. `guardian-check`와 3-way 검증을 거칩니다.
  4. **main에 자동 커밋하고, gh-pages와 Render에 자동 배포합니다.**
  5. 결과를 텔레그램으로 보고합니다.
- **텔레그램 봇 @sunju_dev_bot:** Render 웹훅입니다. "삼척 파고", "날씨", "특보" 같은 자연어에 응답하고 3색 안전 신호등을 보여줍니다.
- **재검증 스크립트 (`scripts/`):** `guardian-wave-audit.mjs`(파고), `guardian-tide-full-audit.mjs`, `syncTides.mjs`(바다타임 수집)

## 5. 사용자 고정 지시 (계속 지킬 것)

- 홈 화면 UI 디자인은 허락 전까지 변경 금지입니다. 이미지와 아이콘 디자인도 임의로 바꾸지 않습니다.
- 빌드는 사용자가 지시할 때만 합니다. AAB는 이전 파일을 지우고 버전을 올려 새로 만듭니다.
- 수정하면 재점검하고, 오류를 고쳤으면 다시 재점검합니다.
- 테스트 계정 등급:
  - `sunjulab.k`: 마스터
  - `sunjulab`: VIP
  - `sunjulab.a1`: PRO
  - `sunjulab.a2`: 라이트
- 관리자 이메일은 sunjulab.k@gmail.com입니다.
- "남은 이슈는 모아서 나중에 한 번에 해결한다" (5/13 지시)

## 6. 미해결·확인 필요 이슈

1. 🔴 **비밀값 하드코딩 (즉시 조치 권장)**
   - 어디에: `tide-guardian-auto-heal.yml`과 `scripts/notify-telegram.mjs`
   - 무엇이: 텔레그램 봇 토큰이 기본값으로, Render API 키가 평문으로 커밋되어 있습니다.
   - 조치: 둘 다 재발급하고 GitHub Secrets / Render 환경변수로 옮겨야 합니다.
   - 같은 문제가 있을 수 있는 곳: 안티그래비티 대화에서 여러 API 키(카카오, YouTube, 바다누리 등)를 평문으로 주고받았습니다. 코드에 하드코딩된 곳이 없는지 전수 확인이 필요합니다.
2. 🟠 **무인 자가치유가 프로덕션에 바로 배포됩니다.**
   - 안티그래비티도 자체 평가에서 위험하다고 했습니다. "자동 배포 금지, 알림 중심"이 60점짜리 평가에서 나온 결론입니다.
   - 제안만 되고 구현 여부를 모르는 것: 관리자 수동값을 보호하는 `ADMIN_PIN`, GitHub 토큰 사전 검증
3. 🟠 **AdMob 네이티브 광고 미노출 (5월부터 미해결)**
   - 빈 공간이 떴다가 사라집니다. 보상형 광고는 테스트 광고로 나옵니다.
   - `@capacitor-community/admob` 플러그인이 네이티브 광고를 지원하는지부터 확인해야 합니다.
4. 🟡 **파고 검증 미완**
   - 로컬 `KMA_KEY`가 401로 거부되어 부이 원시값을 직접 보지 못했습니다.
   - 222xx 부이(인천, 태안, 보령, 군산)는 아직 검증하지 않았습니다.
   - 18개 포인트는 바다타임 지점이 멀어서 간접 확인만 했습니다.
5. 🟡 **`npm run build`(vite)가 메시지 없이 실패합니다.** 배포는 esbuild로 우회하고 있습니다.
6. 🟡 **Render free 플랜 한계**
   - 15분 동안 요청이 없으면 슬립합니다.
   - 파이프라인 시간이 소진되어 배포가 막힌 적이 있습니다 (5/29).
   - 텔레그램 웹훅 응답 지연 위험도 있습니다.
7. 🟡 **UCB 외부결제는 아직 미연동입니다** (코드만 준비).
8. 🟢 **저장소 정리 필요**
   - 루트에 일회성 `fix_*`, `patch-*`, `scan_r*` 스크립트 수백 개가 있습니다.
   - 빌드 로그, AAB/APK, `old_index.js`(8MB), `temp.js`도 남아 있습니다.
   - `server/index.js`가 약 600KB 단일 파일입니다.

## 7. 안티그래비티 자료 위치 (원본 보관용)

- 대화 색인: `C:\Users\palin\.gemini\antigravity\conversation_summaries.db`
- 대화별 아티팩트: `C:\Users\palin\.gemini\antigravity\brain\<대화ID>\` (task.md, implementation_plan.md, walkthrough.md, 각종 보고서)
- 낚시GO 주요 대화 ID:

| ID | 내용 |
| --- | --- |
| a790d866 | 10/15 파고·물때 전수조사, 가디언, 텔레그램 |
| 83ba77bf | 10/05 바다타임 물때, 가디언 에이전트 |
| 819eb816 | 9/28 금진항 파도, CCTV, safe-area, 결제 |
| 8b23b704 | 8/14 수온, 배포 파이프라인 |
| 3d2ad4aa | 8/14 점수 엔진, 수익화 마스터플랜 |
| 4e418aa4 | 6/23 점수, 네트워크 알림, 카카오 링크 |
| 081e82c1 | 6/13 쇼핑, 수온, 공지 초안 |
| 64629828 / 1f0e07fa | 6월 알리·쿠팡, 가격, IAP 점수 |
| 07001ba5 | 5/28 딥링크, 애드센스, 카카오 광고 |
| 54640ec1 | 5/08 로고, APK, Play 스토어 가이드 |
| 2e625a10 | 5/18 수익 분석 보고서, 쿠팡 파트너스 수익화 보고서 |
