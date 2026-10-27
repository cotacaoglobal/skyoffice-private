Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Dev\sowork-assets\sprites\Male_2001-1.png"
$srcBmp = [System.Drawing.Bitmap]::FromFile($srcPath)

$outWidth = 52 * 32
$outHeight = 48
$outBmp = New-Object System.Drawing.Bitmap($outWidth, $outHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($outBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor

function Draw-Frame([int]$fIdx, [int]$sc, [int]$sr, [int]$yOff = 16) {
    $dx = $fIdx * 32
    $destRect = New-Object System.Drawing.Rectangle($dx, $yOff, 32, 32)
    $srcRect = New-Object System.Drawing.Rectangle(($sc * 32), ($sr * 32), 32, 32)
    $g.DrawImage($srcBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
}

# 0..5: idle right (Row 2, Col 1)
for ($i = 0; $i -le 5; $i++) { Draw-Frame $i 1 2 }

# 6..11: idle up (Row 3, Col 1)
for ($i = 6; $i -le 11; $i++) { Draw-Frame $i 1 3 }

# 12..17: idle left (Row 1, Col 1)
for ($i = 12; $i -le 17; $i++) { Draw-Frame $i 1 1 }

# 18..23: idle down (Row 0, Col 1)
for ($i = 18; $i -le 23; $i++) { Draw-Frame $i 1 0 }

# 24..29: run right (Row 2: col 0, 1, 2, 1, 0, 1)
$cycle = @(0, 1, 2, 1, 0, 1)
for ($i = 0; $i -le 5; $i++) { Draw-Frame (24 + $i) $cycle[$i] 2 }

# 30..35: run up (Row 3)
for ($i = 0; $i -le 5; $i++) { Draw-Frame (30 + $i) $cycle[$i] 3 }

# 36..41: run left (Row 1)
for ($i = 0; $i -le 5; $i++) { Draw-Frame (36 + $i) $cycle[$i] 1 }

# 42..47: run down (Row 0)
for ($i = 0; $i -le 5; $i++) { Draw-Frame (42 + $i) $cycle[$i] 0 }

# 48..51: sit (down, left, right, up)
Draw-Frame 48 1 0 20
Draw-Frame 49 1 1 20
Draw-Frame 50 1 2 20
Draw-Frame 51 1 3 20

$g.Dispose()

$charSheetPath = "c:\Dev\skyoffice\client\public\assets\character\felipe.png"
$outBmp.Save($charSheetPath, [System.Drawing.Imaging.ImageFormat]::Png)
$outBmp.Dispose()
Write-Output "felipe.png spritesheet generated successfully: 1664x48"

# 2. Preview de login 48x72
$loginBmp = New-Object System.Drawing.Bitmap(48, 72, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gLogin = [System.Drawing.Graphics]::FromImage($loginBmp)
$gLogin.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor

$destLogin = New-Object System.Drawing.Rectangle(0, 12, 48, 48)
$srcLogin = New-Object System.Drawing.Rectangle(32, 0, 32, 32)
$gLogin.DrawImage($srcBmp, $destLogin, $srcLogin, [System.Drawing.GraphicsUnit]::Pixel)
$gLogin.Dispose()

$loginPreviewPath = "c:\Dev\skyoffice\client\src\images\login\Felipe_login.png"
$loginBmp.Save($loginPreviewPath, [System.Drawing.Imaging.ImageFormat]::Png)
$loginBmp.Dispose()
Write-Output "Felipe_login.png generated successfully: 48x72"

$srcBmp.Dispose()
