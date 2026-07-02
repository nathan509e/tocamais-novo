const fs = require('fs');
const path = 'c:\\Users\\Nathan\\Documents\\GitHub\\tocamais-novo\\src\\pages\\artist\\ArtistTip.jsx';
let c = fs.readFileSync(path, 'utf8');

// Remove the userCpf state line
c = c.replace(/  const \[userCpf, setUserCpf\] = useState\(''\);\r?\n/, '');

// Also remove any remaining setUserCpf references
c = c.replace(/.*setUserCpf.*\n/g, '');

fs.writeFileSync(path, c);
console.log('Done - removed all userCpf references');
