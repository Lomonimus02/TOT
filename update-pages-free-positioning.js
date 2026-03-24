const fs = require('fs');
const path = require('path');

// Список страниц для обновления
const pages = [
    'pages/news.html',
    'pages/artifacts.html',
    'pages/programs.html',
    'pages/complex.html',
    'pages/seminars.html',
    'pages/about-isais.html',
    'pages/rods.html',
    'pages/school-isais.html',
    'pages/school-tota.html',
    'pages/pyramid.html',
    'pages/media.html',
    'pages/forum.html',
    'pages/news-pyramid.html'
];

// Обновление скриптов
pages.forEach(pagePath => {
    if (!fs.existsSync(pagePath)) {
        console.log(`⚠️  Файл не найден: ${pagePath}`);
        return;
    }

    let content = fs.readFileSync(pagePath, 'utf8');
    
    // Проверяем, есть ли уже free-positioning.js
    if (content.includes('free-positioning.js')) {
        console.log(`✅ ${pagePath} - уже обновлен`);
        return;
    }

    // Добавляем скрипт после new-blocks-system.js
    if (content.includes('new-blocks-system.js')) {
        content = content.replace(
            /<script src="\.\.\/js\/new-blocks-system\.js"><\/script>/g,
            '<script src="../js/new-blocks-system.js"></script>\n    <script src="../js/free-positioning.js"></script>'
        );
        
        fs.writeFileSync(pagePath, content, 'utf8');
        console.log(`✅ ${pagePath} - скрипт добавлен`);
    } else {
        console.log(`⚠️  ${pagePath} - не найден new-blocks-system.js`);
    }
});

// Обновление контекстного меню
pages.forEach(pagePath => {
    if (!fs.existsSync(pagePath)) {
        return;
    }

    let content = fs.readFileSync(pagePath, 'utf8');
    
    // Проверяем, есть ли уже пункт меню
    if (content.includes('toggle-free-positioning')) {
        console.log(`✅ ${pagePath} - меню уже обновлено`);
        return;
    }

    // Добавляем пункт меню перед удалением
    const menuItemToAdd = `            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="toggle-free-positioning">
                <span class="menu-icon">🎯</span>
                <span class="menu-text">Включить свободное позиционирование</span>
            </div>`;

    if (content.includes('data-action="duplicate"')) {
        content = content.replace(
            /(<div class="context-menu-item" data-action="duplicate">[\s\S]*?<\/div>)\s*(<div class="context-menu-separator"><\/div>\s*<div class="context-menu-item danger" data-action="delete">)/,
            `$1\n${menuItemToAdd}\n            $2`
        );
        
        fs.writeFileSync(pagePath, content, 'utf8');
        console.log(`✅ ${pagePath} - пункт меню добавлен`);
    } else {
        console.log(`⚠️  ${pagePath} - не найдено контекстное меню`);
    }
});

console.log('\n✅ Обновление завершено!');

