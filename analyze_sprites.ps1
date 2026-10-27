Add-Type -AssemblyName System.Drawing

function Analyze-Sprite($name, $path) {
    $bmp = [System.Drawing.Bitmap]::FromFile($path)
    $w = $bmp.Width
    $h = $bmp.Height
    
    # Encontra bounding box de pixels não transparentes
    $minX = $w; $maxX = 0; $minY = $h; $maxY = 0;
    for ($x = 0; $x -lt $w; $x++) {
        for ($y = 0; $y -lt $h; $y++) {
            $pixel = $bmp.GetPixel($x, $y)
            if ($pixel.A -gt 10) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    $bmp.Dispose()
    Write-Output "$name : ${w}x${h} | Visible Box: X=[$minX..$maxX] (W=$($maxX-$minX+1)), Y=[$minY..$maxY] (H=$($maxY-$minY+1))"
}

Analyze-Sprite "bodyHead" "c:\Dev\skyoffice\test_bodyHead.png"
Analyze-Sprite "hair"     "c:\Dev\skyoffice\test_hair.png"
Analyze-Sprite "eyes"     "c:\Dev\skyoffice\test_eyes.png"
Analyze-Sprite "mouth"    "c:\Dev\skyoffice\test_mouth.png"
Analyze-Sprite "shirt"    "c:\Dev\skyoffice\test_shirt.png"
Analyze-Sprite "pants"    "c:\Dev\skyoffice\test_pants.png"
Analyze-Sprite "shoes"    "c:\Dev\skyoffice\test_shoes.png"
