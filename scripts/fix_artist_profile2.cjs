const fs = require('fs');
let c = fs.readFileSync('src/pages/artist/ArtistProfile.jsx', 'utf8');

// Replace all remaining handleSaveWalletId references
c = c.replace(/handleSaveWalletId/g, 'handleConnectAsaas');

// Replace the disabled prop
c = c.replace(
  /disabled=\{!asaasWalletId\.trim\(\) \|\| !asaasWalletId\.trim\(\)\.startsWith\('wal_'\)\}/g,
  'disabled={connectingAsaas}'
);

// Replace the button text
c = c.replace(
  /<Wallet className="w-4 h-4" \/>\n\s*Conectar Conta Asaas/g,
  '<Wallet className="w-4 h-4" />\n                  {connectingAsaas ? \'Conectando...\' : \'Conectar Conta Asaas\'}'
);

// Replace success message
c = c.replace('Wallet ID salvo com sucesso!', 'Conta Asaas conectada com sucesso!');

// Remove the input field and related elements (keep only the button)
const inputBlock = [
  '                <div className="space-y-2">',
  '                  <label className="text-[10px] text-gray-400 font-bold block">Wallet ID do Asaas</label>',
  '                  <input',
  '                    type="text"',
  '                    value={asaasWalletId}',
  '                    onChange={e => setAsaasWalletId(e.target.value)}',
  '                    placeholder="wal_xxxxxxxxxxxxxxxxxxxxxxxx"',
  '                    className={`w-full p-2.5 rounded-xl border text-xs outline-none ${',
  "                      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'",
  '                    }`}',
  '                  />',
  "                  <p className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>",
  "                    Crie sua conta em{' '}",
  '                    <a href="https://www.asaas.com" target="_blank" rel="noopener noreferrer" className="text-neon-purple font-bold hover:underline">',
  '                      asaas.com',
  '                    </a>',
  "                    {' '}e copie o Wallet ID em Integrações.",
  '                  </p>'
].join('\n');

// Just remove the label + input + help text, keep the button
c = c.replace(
  /                  <label className="text-\[10px\] text-gray-400 font-bold block">Wallet ID do Asaas<\/label>\n\s*<input[\s\S]*?e copie o Wallet ID em Integrações\.\n\s*<\/p>\n/,
  ''
);

fs.writeFileSync('src/pages/artist/ArtistProfile.jsx', c, 'utf8');

console.log('Done!');
console.log('  handleConnectAsaas:', c.includes('handleConnectAsaas'));
console.log('  handleSaveWalletId:', c.includes('handleSaveWalletId'));
console.log('  asaasWalletId input:', c.includes('value={asaasWalletId}'));
