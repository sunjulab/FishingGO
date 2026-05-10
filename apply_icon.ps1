Add-Type -AssemblyName System.Drawing

# Source icon path (no Korean in this path)
$src = "C:\Users\palin\.gemini\antigravity\brain\d88533c3-7b95-44f1-be6f-49b55e00aead\fishinggo_icon_source_1778382679701.png"

# Build res path using byte array to avoid Korean encoding issues
$resBase = $PSScriptRoot + "\android\app\src\main\res"

Write-Host "[CHECK] Source: $src"
if (-not (Test-Path $src)) {
    Write-Host "ERROR: Source icon not found!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Source found" -ForegroundColor Green

# Function: Resize image and save to Korean path safely
function Save-IconSafe {
    param($srcImg, $size, $destPath)
    
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($srcImg, 0, 0, $size, $size)
    $g.Dispose()
    
    # Save to MemoryStream first (avoids Korean path issue with .Save())
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    
    # Write bytes directly (handles Korean paths correctly)
    [System.IO.File]::WriteAllBytes($destPath, $ms.ToArray())
    $ms.Dispose()
}

# Function: Save solid color background icon
function Save-SolidIcon {
    param($size, $destPath, $r, $g, $b)
    
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $gr = [System.Drawing.Graphics]::FromImage($bmp)
    $gr.Clear([System.Drawing.Color]::FromArgb(255, $r, $g, $b))
    $gr.Dispose()
    
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    [System.IO.File]::WriteAllBytes($destPath, $ms.ToArray())
    $ms.Dispose()
}

# Density map: dir name -> px size
$densities = @(
    @{ dir = "mipmap-ldpi";    size = 36  }
    @{ dir = "mipmap-mdpi";    size = 48  }
    @{ dir = "mipmap-hdpi";    size = 72  }
    @{ dir = "mipmap-xhdpi";   size = 96  }
    @{ dir = "mipmap-xxhdpi";  size = 144 }
    @{ dir = "mipmap-xxxhdpi"; size = 192 }
)

Write-Host ""
Write-Host "Loading source image..." -ForegroundColor Cyan
$srcImg = [System.Drawing.Image]::FromFile($src)
Write-Host "  Source size: $($srcImg.Width) x $($srcImg.Height)" -ForegroundColor Gray

foreach ($d in $densities) {
    $dir  = $d.dir
    $size = $d.size
    $destDir = Join-Path $resBase $dir

    Write-Host ""
    Write-Host "[$dir] size=${size}px" -ForegroundColor Yellow

    # ic_launcher.png
    $p = Join-Path $destDir "ic_launcher.png"
    Save-IconSafe $srcImg $size $p
    Write-Host "  ic_launcher.png       OK" -ForegroundColor Green

    # ic_launcher_round.png
    $p = Join-Path $destDir "ic_launcher_round.png"
    Save-IconSafe $srcImg $size $p
    Write-Host "  ic_launcher_round.png OK" -ForegroundColor Green

    # ic_launcher_foreground.png (icon centered with 12% padding for adaptive safe zone)
    $fgBmp = New-Object System.Drawing.Bitmap($size, $size)
    $fgG = [System.Drawing.Graphics]::FromImage($fgBmp)
    $fgG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $fgG.Clear([System.Drawing.Color]::Transparent)
    $pad  = [int]($size * 0.12)
    $inner = $size - ($pad * 2)
    $fgG.DrawImage($srcImg, $pad, $pad, $inner, $inner)
    $fgG.Dispose()
    $ms = New-Object System.IO.MemoryStream
    $fgBmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $fgBmp.Dispose()
    $p = Join-Path $destDir "ic_launcher_foreground.png"
    [System.IO.File]::WriteAllBytes($p, $ms.ToArray())
    $ms.Dispose()
    Write-Host "  ic_launcher_foreground.png OK" -ForegroundColor Green

    # ic_launcher_background.png (solid navy #0B1F3A)
    $p = Join-Path $destDir "ic_launcher_background.png"
    Save-SolidIcon $size $p 11 31 58
    Write-Host "  ic_launcher_background.png OK" -ForegroundColor Green
}

$srcImg.Dispose()

Write-Host ""
Write-Host "All icons applied successfully!" -ForegroundColor Cyan
Write-Host "Run build_release.ps1 to rebuild AAB." -ForegroundColor Yellow
