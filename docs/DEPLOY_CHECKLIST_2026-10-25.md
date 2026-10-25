# 낚시GO 배포 전 체크리스트 (2026-10-25)

PowerShell은 낚시GO 폴더에서 엽니다: `cd C:\Users\palin\Desktop\낚시GO`

명령 안의 `<...>` 부분은 본인 값으로 바꿔 넣으세요. 키 값은 이 문서나 코드에 적지 마세요.

---

## 1. 새 비밀값 만들기 (1분)

아래 명령을 두 번 실행해 무작위 문자열 2개를 만듭니다. 첫 번째는 `JWT_SECRET`, 두 번째는 `TELEGRAM_WEBHOOK_SECRET`에 씁니다.

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 2. 키 재발급 (예전 값은 git 이력에 남아 있음)

| 대상 | 방법 |
| --- | --- |
| 텔레그램 봇 토큰 | 텔레그램에서 @BotFather → `/revoke` → @sunju_dev_bot 선택 → 새 토큰 복사 |
| Render API 키 | Render 대시보드 → 우측 상단 계정 → Account Settings → API Keys → 기존 키 삭제 → Create API Key |
| MongoDB 비밀번호 | MongoDB Atlas → Database Access → `fishinggo` 사용자 → Edit → Edit Password → 새 비밀번호 저장 |
| JWT_SECRET | 1번에서 만든 첫 번째 값. 바꾸면 모든 사용자가 한 번 다시 로그인해야 합니다 |

## 3. Render 환경변수 넣기

Render 대시보드 → `fishing-go-backend` → Environment에서 추가하거나 수정합니다.

| 이름 | 값 |
| --- | --- |
| `JWT_SECRET` | 1번의 첫 번째 값 |
| `MONGO_URI` 또는 `MONGO_PASS` | 새 MongoDB 비밀번호가 들어간 값 (지금 쓰는 키 이름 그대로) |
| `TELEGRAM_BOT_TOKEN` | 새 봇 토큰 |
| `TELEGRAM_CHAT_ID` | `8249592094` |
| `TELEGRAM_WEBHOOK_SECRET` | 1번의 두 번째 값 |
| `GITHUB_DISPATCH_TOKEN` | GitHub → Settings → Developer settings → Fine-grained tokens → FishingGO 저장소에 Contents: Read and write 권한을 줘서 발급 |
| `GOOGLE_PLAY_SERVICE_ACCOUNT` | 아래 4번 참고 (**없으면 배포 후 인앱결제가 "검증 대기"로 멈춤**) |

로컬 `server\.env`의 `JWT_SECRET`과 Mongo 비밀번호도 같은 값으로 바꾸고, 루트 `.env`에 `RENDER_API_KEY=<새 Render 키>` 한 줄을 추가합니다.

## 4. Google Play 서비스 계정 (인앱결제 검증용)

1. Google Cloud Console → IAM 및 관리자 → 서비스 계정 → 서비스 계정 만들기 → 키 → 키 추가 → JSON 다운로드
2. Google Play Console → 사용자 및 권한 → 새 사용자 초대 → 위 서비스 계정 이메일 입력 → 앱 권한에서 낚시GO 선택 → "재무 데이터 보기"와 "주문 및 구독 관리" 체크
3. 다운로드한 JSON 파일 내용 전체를 Render의 `GOOGLE_PLAY_SERVICE_ACCOUNT` 값에 붙여넣기

권한이 반영되기까지 최대 하루가 걸릴 수 있습니다. 그동안 결제한 사용자는 앱을 다시 켜면 자동으로 다시 검증됩니다.

## 5. GitHub Secrets 넣기

GitHub → sunjulab/FishingGO → Settings → Secrets and variables → Actions → New repository secret

- `TELEGRAM_BOT_TOKEN`: 새 봇 토큰
- `TELEGRAM_CHAT_ID`: `8249592094`
- `RENDER_API_KEY`: 새 Render 키

## 6. 워크플로우 파일 교체 (`.github` 폴더는 원격 도구로 쓸 수 없어 직접 해야 함)

```powershell
Copy-Item docs\workflow-fixes\*.yml .github\workflows\ -Force
```

교체하면 하드코딩된 키가 빠지고, 12시·24시 물때 자동 점검이 처음으로 동작합니다. 이전 파일은 문법 오류 때문에 한 번도 실행되지 않았습니다.

## 7. 배포

```powershell
npm run deploy
```

Render 재배포까지 1~3분 기다립니다.

## 8. 텔레그램 웹훅 다시 등록 (배포 후)

```powershell
$token = Read-Host "새 봇 토큰"
$secret = Read-Host "TELEGRAM_WEBHOOK_SECRET 값"
Invoke-RestMethod -Method Post -Uri "https://api.telegram.org/bot$token/setWebhook" -Body @{ url = "https://fishing-go-backend.onrender.com/api/telegram/webhook"; secret_token = $secret }
```

결과에 `ok : True`가 나오면 성공입니다. 텔레그램에서 `안녕`을 보내 응답을 확인하세요.

## 9. 배포 후 확인

- 웹: www.fishing-go.com에서 포인트를 열어 하단의 권장채비 쇼핑 상품이 뜨는지 확인
- 텔레그램: `/check`를 보내면 "접수 완료" 응답이 오고, 몇 분 뒤 점검 결과가 옵니다
- GitHub → Actions 탭에 "Tide Guardian 100" 워크플로우가 보이는지 확인
