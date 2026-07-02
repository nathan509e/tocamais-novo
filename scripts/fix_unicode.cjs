const fs = require('fs');
let c = fs.readFileSync('src/pages/artist/ArtistProfile.jsx', 'utf8');

// Fix unicode escapes that were written as literal strings
c = c.replace(/\\u2014/g, '\u2014');  // em dash —
c = c.replace(/\\u00e7/g, '\u00e7');  // ç
c = c.replace(/\\u00e3/g, '\u00e3');  // ã
c = c.replace(/\\u26a0/g, '\u26a0');  // ⚠
c = c.replace(/\\ufe0f/g, '\ufe0f');  // variation selector

fs.writeFileSync('src/pages/artist/ArtistProfile.jsx', c, 'utf8');
console.log('Fixed unicode escapes');
console.log('  Has literal \\u2014:', c.includes('\\u2014'));
console.log('  Has real —:', c.includes('\u2014'));
