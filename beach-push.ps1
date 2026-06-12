# ============================================================
# beach-push.ps1 - 기상청 해수욕장 수온 → Render 서버 푸시
# Windows 작업 스케줄러 - 1시간마다 자동 실행
# ============================================================

$KK     = "2c92debdb84cf6c2ca60816fa5e9acbbfa06a9ae502cc37919ebec6be629623a"
$SERVER = "https://fishing-go-backend.onrender.com"
$PUSH_KEY = "fishinggo-beach-2024"
$LOG    = "$PSScriptRoot\beach-push.log"

function Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts $msg" | Tee-Object -FilePath $LOG -Append | Out-Null
}

Log "=== beach-push 시작 ==="

# 1. KMA 해수욕장 API 호출 (최대 3회 재시도)
$items = $null
for ($retry = 1; $retry -le 3; $retry++) {
    try {
        $url = "https://apis.data.go.kr/1360000/BeachInfoservice/getBeachCurrentWeather?serviceKey=$KK&numOfRows=200&dataType=JSON"
        $r = Invoke-RestMethod $url -TimeoutSec 15
        $rc = $r.response.header.resultCode
        $items = $r.response.body.items.item

        if ($rc -eq "00" -and $items -and $items.Count -gt 0) {
            Log "✅ KMA API 성공: $($items.Count)개 해수욕장 (시도 $retry)"
            break
        } else {
            Log "⚠️ KMA API 응답 이상: resultCode=$rc items=$($items.Count) (시도 $retry/$retry)"
        }
    } catch {
        Log "❌ KMA API 오류: $_ (시도 $retry/3)"
    }
    if ($retry -lt 3) { Start-Sleep -Seconds 10 }
}

if (-not $items) {
    Log "❌ KMA API 3회 모두 실패. 종료."
    exit 1
}

# 2. Render 서버로 POST (최대 3회 재시도)
$minItems = $items | ForEach-Object {
    @{ beachNm = $_.beachNm; wTemp = $_.wTemp; reginNm = $_.reginNm }
}
$body    = @{ items = $minItems } | ConvertTo-Json -Depth 3 -Compress
$headers = @{ "x-push-key" = $PUSH_KEY; "Content-Type" = "application/json" }

for ($retry = 1; $retry -le 3; $retry++) {
    try {
        $resp = Invoke-RestMethod "$SERVER/api/internal/beach-push" `
            -Method POST -Body $body -Headers $headers -TimeoutSec 15

        if ($resp.ok) {
            Log "✅ 서버 푸시 성공: $($resp.count)개 → $($resp.updated)"
            break
        } else {
            Log "❌ 서버 오류 응답 (시도 $retry/3)"
        }
    } catch {
        Log "❌ 서버 연결 오류: $_ (시도 $retry/3)"
    }
    if ($retry -lt 3) { Start-Sleep -Seconds 10 }
}

Log "=== beach-push 완료 ==="
