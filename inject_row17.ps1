Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Dev\skyoffice\client\public\assets\tileset\marble_floor.png"
$targetNormal = "c:\Dev\skyoffice\client\public\assets\map\FloorAndGround.png"
$targetExtruded = "c:\Dev\skyoffice\client\public\assets\map\FloorAndGround_extruded.png"

$srcBmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$srcRect = New-Object System.Drawing.Rectangle(120, 40, 200, 110)

# 1. FloorAndGround.png
$bmpNormal = [System.Drawing.Bitmap]::FromFile($targetNormal)
$g1 = [System.Drawing.Graphics]::FromImage($bmpNormal)
$g1.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Ladrilho 2318 (col 14, row 36: x=448, y=1152) e 2319 (col 15, row 36: x=480, y=1152)
$destRect2318 = New-Object System.Drawing.Rectangle(448, 1152, 32, 32)
$destRect2319 = New-Object System.Drawing.Rectangle(480, 1152, 32, 32)

$g1.DrawImage($srcBmp, $destRect2318, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g1.DrawImage($srcBmp, $destRect2319, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

# Adiciona uma leve sombra suave da parede no topo dos ladrilhos (top 8px)
$shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(60, 0, 0, 0))
$g1.FillRectangle($shadowBrush, 448, 1152, 64, 8)
$shadowBrush.Dispose()

$g1.Dispose()
$tmpNormal = "c:\Dev\skyoffice\client\public\assets\map\FloorAndGround_tmp.png"
$bmpNormal.Save($tmpNormal, [System.Drawing.Imaging.ImageFormat]::Png)
$bmpNormal.Dispose()
Move-Item -Force $tmpNormal $targetNormal
Write-Output "FloorAndGround.png row 17 tiles updated"

# 2. FloorAndGround_extruded.png
$bmpExt = [System.Drawing.Bitmap]::FromFile($targetExtruded)
$g2 = [System.Drawing.Graphics]::FromImage($bmpExt)
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# col 14, row 36 -> x = 1 + 14 * 34 = 477, y = 1 + 36 * 34 = 1225
# col 15, row 36 -> x = 1 + 15 * 34 = 511, y = 1 + 36 * 34 = 1225
$destExt2318 = New-Object System.Drawing.Rectangle(477, 1225, 34, 34)
$destExt2319 = New-Object System.Drawing.Rectangle(511, 1225, 34, 34)

$g2.DrawImage($srcBmp, $destExt2318, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g2.DrawImage($srcBmp, $destExt2319, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

# Sombra no topo da parede
$shadowBrush2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(60, 0, 0, 0))
$g2.FillRectangle($shadowBrush2, 477, 1225, 68, 8)
$shadowBrush2.Dispose()

$g2.Dispose()
$tmpExt = "c:\Dev\skyoffice\client\public\assets\map\FloorAndGround_extruded_tmp.png"
$bmpExt.Save($tmpExt, [System.Drawing.Imaging.ImageFormat]::Png)
$bmpExt.Dispose()
Move-Item -Force $tmpExt $targetExtruded
Write-Output "FloorAndGround_extruded.png row 17 tiles updated"

$srcBmp.Dispose()
