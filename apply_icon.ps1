Add-Type -AssemblyName System.Drawing

$src = "C:\Users\palin\.gemini\antigravity\brain\d88533c3-7b95-44f1-be6f-49b55e00aead\fishinggo_app_icon_1024_1778303320172.png"
$resDir = "C:\Users\palin\Desktop\낚시GO\android\app\src\main\res"

$sizes = @{
    "mipmap-ldpi"     = 36
    "mipmap-mdpi"     = 48
    "mipmap-hdpi"     = 72
    "mipmap-xhdpi"    = 96
    "mipmap-xxhdpi"   = 144
    "mipmap-xxxhdpi"  = 192
}

Write-Host "🎨 낚시GO 앱 아이콘 적용 시작..." -ForegroundColor Cyan
$srcImg = [System.Drawing.Image]::FromFile($src)

foreach ($dir in $sizes.Keys) {
    $size = $sizes[$dir]
    $destDir = Join-Path $resDir $dir

    # ic_launcher.png & ic_launcher_round.png
    foreach ($name in @("ic_launcher.png", "ic_launcher_round.png")) {
        $bmp = New-Object System.Drawing.Bitmap($size, $size)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode    = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.DrawImage($srcImg, 0, 0, $size, $size)
        $g.Dispose()
        $bmp.Save((Join-Path $destDir $name), [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
    }

    # ic_launcher_foreground.png — 14% 여백으로 adaptive safe zone 준수
    $fgBmp = New-Object System.Drawing.Bitmap($size, $size)
    $fgG   = [System.Drawing.Graphics]::FromImage($fgBmp)
    $fgG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $fgG.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $fgG.Clear([System.Drawing.Color]::Transparent)
    $pad       = [int]($size * 0.14)
    $innerSize = $size - ($pad * 2)
    $fgG.DrawImage($srcImg, $pad, $pad, $innerSize, $innerSize)
    $fgG.Dispose()
    $fgBmp.Save((Join-Path $destDir "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $fgBmp.Dispose()

    # ic_launcher_background.png — 낚시GO 네이비 단색
    $bgBmp = New-Object System.Drawing.Bitmap($size, $size)
    $bgG   = [System.Drawing.Graphics]::FromImage($bgBmp)
    $bgG.Clear([System.Drawing.Color]::FromArgb(255, 11, 31, 58))
    $bgG.Dispose()
    $bgBmp.Save((Join-Path $destDir "ic_launcher_background.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bgBmp.Dispose()

    Write-Host "  ✅ $dir  ($size x $size)" -ForegroundColor Green
}

$srcImg.Dispose()
Write-Host ""
Write-Host "🎉 모든 아이콘 적용 완료! 이제 AAB를 다시 빌드하세요." -ForegroundColor Yellow
Write-Host "   cd android; .\gradlew bundleRelease" -ForegroundColor Gray
