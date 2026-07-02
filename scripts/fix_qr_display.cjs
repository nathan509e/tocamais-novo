const fs = require('fs');
const file = 'c:\\Users\\Nathan\\Documents\\GitHub\\tocamais-novo\\src\\pages\\artist\\ArtistTip.jsx';
let c = fs.readFileSync(file, 'utf8');

// Normalize for matching then re-add \r
const cr = c.includes('\r\n') ? '\r\n' : '\n';
const n = c.replace(/\r\n/g, '\n');

// Simple single-line replacements (no multiline matching needed)
let result = n;

// 1. Replace condition: pixQrCodeBase64 -> pixKey
result = result.replace('{pixQrCodeBase64 ? (', '{pixKey ? (');

// 2. Replace the img block with QRCodeSVG (lines 586-590)
result = result.replace(
  '<img\n                      src={`data:image/png;base64,${pixQrCodeBase64}`}\n                      alt="QR Code PIX"\n                      className="w-40 h-40"\n                    />',
  '<QRCodeSVG\n                      value={pixKey}\n                      size={160}\n                      level="M"\n                    />'
);

// Restore original line endings
const final = result.replace(/\n/g, cr);

if (final !== c) {
  fs.writeFileSync(file, final, 'utf8');
  console.log('SUCCESS: File updated');
} else {
  console.log('NO CHANGE: Content unchanged');
}

// Verify
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
for (let i = 582; i < 598; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
