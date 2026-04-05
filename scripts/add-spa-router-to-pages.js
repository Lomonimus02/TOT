// Скрипт для добавления SPA Router на все страницы
const fs = require('fs');
const path = require('path');

const rootDir = __dirname.replace(/[\\/]scripts$/, '');

// Файлы для обработки
const files = [
    path.join(rootDir, 'index.html'),
    ...fs.readdirSync(path.join(rootDir, 'pages'))
        .filter(f => f.endsWith('.html'))
        .map(f => path.join(rootDir, 'pages', f))
];

let modified = 0;

files.forEach(filePath => {
    let html = fs.readFileSync(filePath, 'utf8');
    const fileName = path.relative(rootDir, filePath);

    // Уже есть?
    if (html.includes('spa-router.js')) {
        console.log(`⏭️  ${fileName} — уже содержит spa-router.js`);
        return;
    }

    // Определяем путь к скрипту
    const isInPages = filePath.includes(path.sep + 'pages' + path.sep);
    const scriptSrc = isInPages ? '../js/spa-router.js' : 'js/spa-router.js';
    const scriptTag = `<script src="${scriptSrc}"></script>`;

    // Вставляем ПЕРЕД первым <script> (чтобы SPA Router загрузился до остальных скриптов)
    // Ищем секцию подключения скриптов
    const marker = '<!-- Подключение скриптов -->';
    if (html.includes(marker)) {
        html = html.replace(marker, `${marker}\n    ${scriptTag}`);
    } else {
        // Фоллбэк: вставляем перед </body>
        html = html.replace('</body>', `    ${scriptTag}\n</body>`);
    }

    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ ${fileName} — добавлен spa-router.js`);
    modified++;
});

console.log(`\n🏁 Обработано файлов: ${files.length}, изменено: ${modified}`);
