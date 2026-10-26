const fs = require('fs');
const code = fs.readFileSync('/tmp/ref_bundle.js', 'utf8');
console.log('Bundle length:', code.length);

// Let's search for route definitions, navigation, title, headers, buttons, tabs
const titleMatch = code.match(/<title>([^<]+)<\/title>/);
console.log('Title in code?', titleMatch);

// Look for strings like navigation items or tabs
const strRegex = /"([A-Za-z0-9 _\-\/&:,?.!]{3,40})"/g;
let m;
const stringCounts = {};
while ((m = strRegex.exec(code)) !== null) {
  const s = m[1];
  stringCounts[s] = (stringCounts[s] || 0) + 1;
}

// Check common legal process server terminology
const terms = ['Dashboard', 'Orders', 'Intake', 'Clients', 'Servers', 'Users', 'Invoices', 'Accounting', 'Pricing', 'Reports', 'Affidavit', 'Attempt', 'Documents', 'Sign', 'Account', 'Profile', 'Process Servers Solution', 'Court'];
terms.forEach(t => {
  const count = (code.match(new RegExp(t, 'gi')) || []).length;
  console.log(`${t}: ${count}`);
});
