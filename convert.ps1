Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName System.Drawing

$inputPath = "c:\Dev\skyoffice\client\public\assets\tileset\marble_floor.webp"
$outputPath = "c:\Dev\skyoffice\client\public\assets\tileset\marble_floor.png"

$uri = New-Object System.Uri($inputPath)
$dec = [System.Windows.Media.Imaging.BitmapDecoder]::Create($uri, [System.Windows.Media.Imaging.BitmapCreateOptions]::None, [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
$frame = $dec.Frames[0]

$enc = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
$enc.Frames.Add($frame)
$fs = [System.IO.File]::Create($outputPath)
$enc.Save($fs)
$fs.Dispose()

Write-Output "DONE_CONVERSION"
