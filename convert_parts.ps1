Add-Type -AssemblyName PresentationCore

function Convert-WebPToPng($inPath, $outPath) {
    $uri = New-Object System.Uri($inPath)
    $dec = [System.Windows.Media.Imaging.BitmapDecoder]::Create($uri, [System.Windows.Media.Imaging.BitmapCreateOptions]::None, [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
    $enc = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
    $enc.Frames.Add($dec.Frames[0])
    $fs = [System.IO.File]::Create($outPath)
    $enc.Save($fs)
    $fs.Dispose()
}

Convert-WebPToPng "c:\Dev\sowork-assets\sprites\characterA_bodyHead_v1_2BtypeA_bodyHead_idle_atlas_1.webp" "c:\Dev\skyoffice\test_bodyHead.png"
Convert-WebPToPng "c:\Dev\sowork-assets\sprites\characterA_hair_sondre_2Bbasecolor_hairFront_idle_atlas_1.webp" "c:\Dev\skyoffice\test_hair.png"
Convert-WebPToPng "c:\Dev\sowork-assets\sprites\characterA_eyes_eyes1_2Bblue_eyes_idle_atlas_4.webp" "c:\Dev\skyoffice\test_eyes.png"
Convert-WebPToPng "c:\Dev\sowork-assets\sprites\characterA_mouth_mouth1_2BtypeA_mouth_idle_atlas_4.webp" "c:\Dev\skyoffice\test_mouth.png"
Convert-WebPToPng "c:\Dev\sowork-assets\sprites\characterA_shirt_maleHoodie_2Bbasecolor_shirtFront_idle_atlas_2.webp" "c:\Dev\skyoffice\test_shirt.png"
Convert-WebPToPng "c:\Dev\sowork-assets\sprites\characterA_pants_nathanPants_2Bbasecolor_pantsFront_idle_atlas_2.webp" "c:\Dev\skyoffice\test_pants.png"
Convert-WebPToPng "c:\Dev\sowork-assets\sprites\characterA_shoes_nathanShoes_2Bbasecolor_shoesFront_idle_atlas_1.webp" "c:\Dev\skyoffice\test_shoes.png"

Write-Output "ALL_PARTS_CONVERTED"
