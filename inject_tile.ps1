Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Dev\skyoffice\client\public\assets\tileset\marble_floor.png"
$targetNormal = "c:\Dev\skyoffice\client\public\assets\map\FloorAndGround.png"
$targetExtruded = "c:\Dev\skyoffice\client\public\assets\map\FloorAndGround_extruded.png"

$srcBmp = [System.Drawing.Bitmap]::FromFile($srcPath)

# 1. Atualiza FloorAndGround.png
# Tile 2382 fica em col 14, row 37 (x = 14*32 = 448, y = 37*32 = 1184, w=32, h=32)
$bmpNormal = [System.Drawing.Bitmap]::FromFile($targetNormal)
$g1 = [System.Drawing.Graphics]::FromImage($bmpNormal)
$g1.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
# O centro do ladrilho de mármore tem textura limpa
$destRect1 = New-Object System.Drawing.Rectangle(448, 1184, 32, 32)
# Pegamos uma porção central do topo do mármore (em torno de x: 100..340, y: 30..150)
$srcRect1 = New-Object System.Drawing.Rectangle(120, 40, 200, 110)
$g1.DrawImage($srcBmp, $destRect1, $srcRect1, [System.Drawing.GraphicsUnit]::Pixel)
$g1.Dispose()

$tmpNormal = "c:\Dev\skyoffice\client\public\assets\map\FloorAndGround_tmp.png"
$bmpNormal.Save($tmpNormal, [System.Drawing.Imaging.ImageFormat]::Png)
$bmpNormal.Dispose()
Move-Item -Force $tmpNormal $targetNormal
Write-Output "FloorAndGround.png updated"

# 2. Atualiza FloorAndGround_extruded.png
# Extrusão tem margin=1, spacing=2, cada célula vira 34x34 (com 1px de borda extrudada repetida)
# Para col 14, row 37:
# cellX = 1 + 14 * 34 = 477
# cellY = 1 + 37 * 34 = 1259
# tile interno: 478, 1260, 32x32
# célula total com borda extrudada: 477, 1259, 34x34
$bmpExt = [System.Drawing.Bitmap]::FromFile($targetExtruded)
$g2 = [System.Drawing.Graphics]::FromImage($bmpExt)
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$destRect2 = New-Object System.Drawing.Rectangle(477, 1259, 34, 34)
$g2.DrawImage($srcBmp, $destRect2, $srcRect1, [System.Drawing.GraphicsUnit]::Pixel)
$g2.Dispose()

$tmpExt = "c:\Dev\skyoffice\client\public\assets\map\FloorAndGround_extruded_tmp.png"
$bmpExt.Save($tmpExt, [System.Drawing.Imaging.ImageFormat]::Png)
$bmpExt.Dispose()
Move-Item -Force $tmpExt $targetExtruded
Write-Output "FloorAndGround_extruded.png updated"

$srcBmp.Dispose()
