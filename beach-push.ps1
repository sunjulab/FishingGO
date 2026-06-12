# ============================================================
# beach-push.ps1 - 기상청 해수욕장 수온 → Render 서버 푸시
# 실행: 매 1시간마다 Windows 작업 스케줄러에서 자동 실행
# ============================================================

$KK  = "2c92debdb84cf6c2ca60816fa5e9acbbfa06a9ae502cc37919ebec6be629623a"
$SERVER = "https://fishing-go-backend.onrender.com"
$PUSH_KEY = "fishinggo-beach-2024"
$LOG = "$PSScriptRoot\beach-push.log"

function Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts $msg" | Tee-Object -FilePath $LOG -Append | Out-Null
}

Log "=== beach-push 시작 ==="

# 1. KMA 해수욕장 API 호출 (한국 IP)
try {
    $url = "https://apis.data.go.kr/1360000/BeachInfoservice/getBeachCurrentWeather?serviceKey=$KK&numOfRows=200&dataType=JSON"
    $r = Invoke-RestMethod $url -TimeoutSec 15
    $rc = $r.response.header.resultCode
    $items = $r.response.body.items.item

    if ($rc -ne "00" -or -not $items) {
        Log "❌ KMA API 실패: resultCode=$rc"
        exit 1
    }
    Log "✅ KMA API 성공: $($items.Count)개 해수욕장"
} catch {
    Log "❌ KMA API 오류: $_"
    exit 1
}

# 2. Render 서버로 POST
try {
    # 필요한 필드만 추출 (beachNm, wTemp, reginNm)
    $minItems = $items | ForEach-Object {
        @{ beachNm = $_.beachNm; wTemp = $_.wTemp; reginNm = $_.reginNm }
    }
    $body = @{ items = $minItems } | ConvertTo-Json -Depth 3 -Compress
    $headers = @{ "x-push-key" = $PUSH_KEY; "Content-Type" = "application/json" }

    $resp = Invoke-RestMethod "$SERVER/api/internal/beach-push" `
        -Method POST -Body $body -Headers $headers -TimeoutSec 15

    if ($resp.ok) {
        Log "✅ 서버 푸시 성공: $($resp.count)개 → $($resp.updated)"
    } else {
        Log "❌ 서버 응답 오류: $($resp | ConvertTo-Json -Compress)"
    }
} catch {
    Log "❌ 서버 연결 오류: $_"
    exit 1
}

Log "=== beach-push 완료 ==="
