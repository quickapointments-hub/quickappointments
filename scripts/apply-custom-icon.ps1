Add-Type -AssemblyName System.Drawing

$srcPath = "C:/Users/lenovo/.gemini/antigravity/brain/8daf8365-6c52-4b3c-b71b-518484236fb6/.user_uploaded/media_1794216666215_10635f38.jpg"
$baseDir = "E:/Bizools/Qucik Appoptiment/packages/customer-provider-mobile"

Write-Host "Loading source image from: $srcPath"
$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function Save-ResizedImage($source, $width, $height, $destPath) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($source, 0, 0, $width, $height)
    $g.Dispose()
    
    $parent = Split-Path -Parent $destPath
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $destPath ($width x $height)"
}

# 1. Generate master 1024x1024 icon.png and adaptive-icon.png
Save-ResizedImage $srcImg 1024 1024 "$baseDir/assets/icon.png"
Save-ResizedImage $srcImg 1024 1024 "$baseDir/assets/adaptive-icon.png"
Save-ResizedImage $srcImg 512 512 "$baseDir/public/logo.png"
Save-ResizedImage $srcImg 512 512 "$baseDir/public/app-icon.png"

# 2. Generate Android Mipmap Densities
$densities = @(
    @{ name = "mipmap-mdpi"; icon = 48; fg = 108 },
    @{ name = "mipmap-hdpi"; icon = 72; fg = 162 },
    @{ name = "mipmap-xhdpi"; icon = 96; fg = 216 },
    @{ name = "mipmap-xxhdpi"; icon = 144; fg = 324 },
    @{ name = "mipmap-xxxhdpi"; icon = 192; fg = 432 }
)

$resDir = "$baseDir/android/app/src/main/res"

foreach ($d in $densities) {
    $dirPath = "$resDir/$($d.name)"
    Save-ResizedImage $srcImg $d.icon $d.icon "$dirPath/ic_launcher.png"
    Save-ResizedImage $srcImg $d.icon $d.icon "$dirPath/ic_launcher_round.png"
    Save-ResizedImage $srcImg $d.fg $d.fg "$dirPath/ic_launcher_foreground.png"
}

$srcImg.Dispose()
Write-Host "✅ All custom app icons successfully generated and applied!"

