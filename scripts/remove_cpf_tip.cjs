const fs = require('fs');
const path = 'c:\\Users\\Nathan\\Documents\\GitHub\\tocamais-novo\\src\\pages\\artist\\ArtistTip.jsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Remove customerTaxId line (replace with empty string)
c = c.replace(
  /customerTaxId: userCpf\.replace\(\/\\D\/g, ''\) \|\| '',/,
  "customerTaxId: '', // Auto-generated on backend"
);

// 2. Remove CPF input field (lines 571-595 area)
const cpfBlock = `            {/* CPF field */}
            <div className="mb-6">
              <label className={\`text-xs font-bold uppercase tracking-wider block mb-2 \${isDark ? 'text-gray-400' : 'text-gray-500'}\`}>
                CPF
              </label>
              <input
                type="text"
                value={userCpf}
                onChange={e => {
                  const raw = e.target.value.replace(/\\D/g, '').slice(0, 11);
                  let formatted = raw;
                  if (raw.length > 3) formatted = raw.slice(0, 3) + '.' + raw.slice(3);
                  if (raw.length > 6) formatted = formatted.slice(0, 7) + '.' + raw.slice(6);
                  if (raw.length > 9) formatted = formatted.slice(0, 11) + '-' + raw.slice(9);
                  setUserCpf(formatted);
                }}
                placeholder="000.000.000-00"
                maxLength={14}
                className={\`w-full p-4 rounded-2xl border-2 text-sm font-medium outline-none transition-all focus:border-neon-purple \${
                  isDark
                    ? 'bg-white/5 border-white/15 text-white placeholder:text-gray-500'
                    : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400'
                }\`}
              />
            </div>`;

if (c.includes(cpfBlock)) {
  c = c.replace(cpfBlock + '\n\n', '\n');
  console.log('Removed CPF input block');
} else {
  // Try partial match
  const cpfRegex = /\{\/\* CPF field \*\/\}[\s\S]*?setUserCpf\(formatted\);[\s\S]*?\/>\s*<\/div>/;
  if (cpfRegex.test(c)) {
    c = c.replace(cpfRegex, '');
    console.log('Removed CPF input block (regex)');
  } else {
    console.log('WARNING: Could not find CPF block to remove');
  }
}

fs.writeFileSync(path, c);
console.log('Done');
