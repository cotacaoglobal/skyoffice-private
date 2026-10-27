Add-Type -AssemblyName System.Drawing

function Find-Frames($name, $path) {
    $bmp = [System.Drawing.Bitmap]::FromFile($path)
    $w = $bmp.Width
    $h = $bmp.Height
    
    $segments = @()
    $inSegment = $false
    $start = 0
    
    for ($x = 0; $x -lt $w; $x++) {
        $hasPixel = $false
        for ($y = 0; $y -lt $h; $y++) {
            if ($bmp.GetPixel($x, $y).A -gt 15) {
                $hasPixel = $true
                break
            }
        }
        if ($hasPixel -and -not $inSegment) {
            $inSegment = $true
            $start = $x
        } elseif (-not $hasPixel -and $inSegment) {
            $inSegment = $false
            $segments += "$start..$($x-1) (w=$($x-$start))"
        }
    }
    if ($inSegment) {
        $segments += "$start..$($w-1) (w=$($w-$start))"
    }
    $bmp.Dispose()
    Write-Output "$name (Total W=$w, H=$h):"
    Write-Output ($segments -join " | ")
    Write-Output ""
}

Find-Frames "bodyHead (idle)" "c:\Dev\skyoffice\test_bodyHead.png"
Find-Frames "hair (idle)"     "c:\Dev\skyoffice\test_hair.png"
Find-Frames "eyes (idle)"     "c:\Dev\skyoffice\test_eyes.png"
Find-Frames "mouth (idle)"    "c:\Dev\skyoffice\test_mouth.png"
Find-Frames "shoes (idle)"    "c:\Dev\skyoffice\test_shoes.png"
