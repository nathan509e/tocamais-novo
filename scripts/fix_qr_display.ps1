$file = 'c:\Users\Nathan\Documents\GitHub\tocamais-novo\src\pages\artist\ArtistTip.jsx'
$c = Get-Content $file -Raw

$old = @"
                  {pixQrCodeBase64 ? (
                    <img
                      src={`data:image/png;base64,`${pixQrCodeBase64}`}
                      alt="QR Code PIX"
                      className="w-40 h-40"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center">
                      <Loader className="w-8 h-8 animate-spin text-neon-purple" />
                    </div>
                  )}
"@

$new = @"
                  {pixKey ? (
                    <QRCodeSVG
                      value={pixKey}
                      size={160}
                      level="M"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center">
                      <Loader className="w-8 h-8 animate-spin text-neon-purple" />
                    </div>
                  )}
"@

if ($c.Contains($old)) {
    $c = $c.Replace($old, $new)
    Set-Content $file -Value $c -NoNewline
    Write-Host "SUCCESS: QR display replaced"
} else {
    Write-Host "ERROR: old content not found"
    # Show what's around line 585
    $lines = Get-Content $file
    for ($i = 582; $i -lt 598; $i++) {
        Write-Host "$($i+1): $($lines[$i])"
    }
}
