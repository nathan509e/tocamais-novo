const fs = require('fs');
const path = 'src/pages/artist/ArtistTip.jsx';
let c = fs.readFileSync(path, 'utf8');

// Find the exact block from <button to </button> around processTipPayment
const clickIdx = c.indexOf('onClick={() => processTipPayment(true)}');
if (clickIdx < 0) { console.log('NOT FOUND'); process.exit(1); }

// Go back to find <button
let start = c.lastIndexOf('<button', clickIdx);
// Go forward to find matching </button>
let end = c.indexOf('</button>', clickIdx) + '</button>'.length;

const oldBlock = c.substring(start, end);
console.log('OLD BLOCK:');
console.log(JSON.stringify(oldBlock));

const newBlock = `                <div className="w-full py-3 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #7B2EFF, #39FF6A)' }}
                >
                  <Loader className="w-4 h-4 animate-spin" />
                  Aguardando confirmação do pagamento...
                </div>`;

c = c.substring(0, start) + newBlock + c.substring(end);
fs.writeFileSync(path, c, 'utf8');
console.log('\nSUCCESS: Button replaced with spinner');
