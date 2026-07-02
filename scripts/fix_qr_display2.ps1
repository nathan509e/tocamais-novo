$file = 'c:\Users\Nathan\Documents\GitHub\tocamais-novo\src\pages\artist\ArtistTip.jsx'
$c = Get-Content $file -Raw

# Use simple string replace to avoid PowerShell interpolation issues
$c = $c.Replace('{pixQrCodeBase64 ? (', '{pixKey ? (')
$c = $c.Replace('<img', '<QRCodeSVG')
$c = $c.Replace("src={``data:image/png;base64,`${pixQrCodeBase64``}}", "value={pixKey}`n                      size={160}`n                      level=`"M`"")
$c = $c.Replace('alt="QR Code PIX"', '')
$c = $c.Replace('className="w-40 h-40"', '')

Set-Content $file -Value $c -NoNewline
Write-Host "Done. Checking result..."
$lines = Get-Content $file
for ($i = 582; $i -lt 598; $i++) {
    Write-Host "$($i+1): $($lines[$i])"
}
