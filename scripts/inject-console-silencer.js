const fs = require('fs');
const path = require('path');
const files = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'Tot', 'images', 'videos', 'css', 'js', 'server', 'scripts'].includes(e.name)) continue;
      walk(p);
    } else if (e.name.endsWith('.html')) {
      files.push(p);
    }
  }
}
walk('.');
let changed = 0;
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes('console-silencer.js')) continue;
  const isPages = f.replace(/\\/g, '/').includes('/pages/');
  const src = isPages ? '../js/console-silencer.js' : 'js/console-silencer.js';
  const tag = '    <script src="' + src + '"></script>\n';
  const re = /(<meta\s+charset=[^>]*>\s*\n)/i;
  if (re.test(s)) s = s.replace(re, '$1' + tag);
  else s = s.replace(/<head>/i, '<head>\n' + tag);
  fs.writeFileSync(f, s);
  changed++;
  console.log('+ ' + f);
}
console.log('Updated:', changed, '/', files.length);
