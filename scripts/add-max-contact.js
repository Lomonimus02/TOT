const fs = require('fs');

const maxContact = '                    <div class="footer-contact-item">\r\n                        <a href="https://maxln.ru/YcxBcz" target="_blank">Max: Пирамида Тота</a>\r\n                    </div>';

const target = '                    <div class="footer-contact-item">\r\n                        <a href="mailto:info@piramidaspb.ru">info@piramidaspb.ru</a>\r\n                    </div>';
const targetLF = '                    <div class="footer-contact-item">\n                        <a href="mailto:info@piramidaspb.ru">info@piramidaspb.ru</a>\n                    </div>';
const maxContactLF = '                    <div class="footer-contact-item">\n                        <a href="https://maxln.ru/YcxBcz" target="_blank">Max: Пирамида Тота</a>\n                    </div>';
const replacement = maxContact + '\n' + target;

const files = [
    'index.html',
    ...fs.readdirSync('pages').filter(f => f.endsWith('.html')).map(f => 'pages/' + f),
    'scripts/add-footer-to-all-pages.js',
    'scripts/add-footer-to-pages.js',
    'scripts/update-footer-in-pages.js'
];

let updated = 0;
files.forEach(f => {
    const content = fs.readFileSync(f, 'utf-8');
    if (content.includes('maxln.ru/YcxBcz" target="_blank">Max:')) return;
    if (content.includes(target)) {
        fs.writeFileSync(f, content.replace(target, maxContact + '\r\n' + target), 'utf-8');
        console.log('+ ' + f);
        updated++;
    } else if (content.includes(targetLF)) {
        fs.writeFileSync(f, content.replace(targetLF, maxContactLF + '\n' + targetLF), 'utf-8');
        console.log('+ ' + f);
        updated++;
    }
});
console.log('Updated: ' + updated);
