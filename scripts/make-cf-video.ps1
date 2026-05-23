$cfDir = "C:\Users\palin\Desktop\낚시GO\cf-final"
$outDir = "C:\Users\palin\Desktop\낚시GO\cf-video"
$tmpDir = "$outDir\tmp"

New-Item -Force -ItemType Directory $outDir | Out-Null
New-Item -Force -ItemType Directory $tmpDir | Out-Null

$scenes = @(
    "Scene_01_새벽항구_포인트확인.png",
    "Scene_02_선상_해양날씨.png",
    "Scene_03_방파제_포인트지도.png",
    "Scene_04_차안_커플.png",
    "Scene_05_낚싯대_알림.png",
    "Scene_06_파이팅_액션.png",
    "Scene_07_귀항_커플_업로드.png",
    "Scene_08_브랜드_엔딩.png"
)

Write-Host "[START] CF Video Creating..."
Write-Host "================================"

$clipFiles = @()
for ($i = 0; $i -lt $scenes.Count; $i++) {
    $imgPath = "$cfDir\$($scenes[$i])"
    $clipPath = "$tmpDir\clip_{0:D2}.mp4" -f $i
    $clipFiles += $clipPath

    $num = $i + 1
    Write-Host "  [Scene $num/8] Processing..."

    $fadeFilter = "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fade=t=in:st=0:d=0.4,fade=t=out:st=3.6:d=0.4"

    & ffmpeg -y -loop 1 -i $imgPath -t 4 `
        -vf $fadeFilter `
        -c:v libx264 -preset fast -crf 18 `
        -pix_fmt yuv420p -r 30 `
        $clipPath 2>&1 | Out-Null

    if (Test-Path $clipPath) {
        Write-Host "    [OK] clip_{0:D2}.mp4" -f $i
    } else {
        Write-Host "    [FAIL] Scene $num"
    }
}

Write-Host ""
Write-Host "[CONCAT] Merging all clips..."

$concatFile = "$tmpDir\concat.txt"
$concatContent = $clipFiles | ForEach-Object { "file '$($_ -replace '\\', '/')'" }
[System.IO.File]::WriteAllLines($concatFile, $concatContent, [System.Text.Encoding]::UTF8)

$finalOutput = "$outDir\FishingGO_CF_32sec.mp4"

& ffmpeg -y -f concat -safe 0 -i $concatFile `
    -c:v libx264 -preset fast -crf 18 `
    -pix_fmt yuv420p `
    $finalOutput 2>&1 | Out-Null

Write-Host ""
Write-Host "================================"
if (Test-Path $finalOutput) {
    $size = [math]::Round((Get-Item $finalOutput).Length / 1MB, 1)
    Write-Host "[DONE] Video created!"
    Write-Host "  Path : $finalOutput"
    Write-Host "  Size : ${size} MB"
    Write-Host "  Time : 32 seconds"
} else {
    Write-Host "[ERROR] Video creation failed"
}
