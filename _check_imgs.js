const http = require('http');
const pages = ['index','pyramid','school-tota','programs','seminars','consultations','media','recordings','temple','rods','school-isais','about-isais','artifacts','court','forum','projects','visit','complex'];
let i = 0;
function check() {
  if (i >= pages.length) return;
  const p = pages[i++];
  http.get('http://localhost:3000/api/content/' + p + '/rich-text-content', r => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => {
      try {
        const j = JSON.parse(d);
        const c = j.data && j.data.content ? j.data.content : '';
        const imgs = c.match(/src="([^"]*)"/g) || [];
        if (imgs.length > 0) console.log(p + ': ' + imgs.slice(0, 3).join(', '));
      } catch(e) {}
      check();
    });
  }).on('error', () => check());
}
check();
