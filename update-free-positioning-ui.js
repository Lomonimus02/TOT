const fs = require('fs');
const path = require('path');

// Список страниц для обновления
const pages = [
    'pages/artifacts.html',
    'pages/programs.html',
    'pages/complex.html',
    'pages/seminars.html',
    'pages/about-isais.html',
    'pages/rods.html',
    'pages/school-isais.html',
    'pages/school-tota.html',
    'pages/pyramid.html',
    'pages/news.html'
];

console.log('🔧 Начинаем обновление страниц...\n');

pages.forEach(pagePath => {
    if (!fs.existsSync(pagePath)) {
        console.log(`⚠️  Файл не найден: ${pagePath}`);
        return;
    }

    let content = fs.readFileSync(pagePath, 'utf8');
    let modified = false;

    // 1. Удаляем пункт меню свободного позиционирования из контекстного меню
    const menuItemPattern = /\s*<div class="context-menu-separator"><\/div>\s*<div class="context-menu-item" data-action="toggle-free-positioning">[\s\S]*?<\/div>\s*<div class="context-menu-separator"><\/div>\s*(?=<div class="context-menu-item danger" data-action="delete">)/;
    
    if (content.match(menuItemPattern)) {
        content = content.replace(menuItemPattern, '\n            <div class="context-menu-separator"></div>\n            ');
        modified = true;
        console.log(`✅ ${pagePath} - удален пункт меню из контекстного меню`);
    }

    // 2. Добавляем кнопку в панель блоков, если её еще нет
    if (!content.includes('free-positioning-toggle') && content.includes('blocks-panel-header')) {
        const buttonHTML = `            <!-- Кнопка переключения режима свободного позиционирования -->
            <button class="free-positioning-toggle" id="freePositioningToggle" title="Включить/выключить свободное позиционирование">
                <span class="toggle-icon">🎯</span>
                <span class="toggle-text">Свободное позиционирование</span>
            </button>`;

        // Ищем закрывающий тег blocks-panel-header и добавляем кнопку перед ним
        const headerPattern = /(<p class="blocks-panel-subtitle">.*?<\/p>)\s*(<\/div>\s*<div class="blocks-panel-content">)/;
        
        if (content.match(headerPattern)) {
            content = content.replace(headerPattern, `$1\n${buttonHTML}\n        $2`);
            modified = true;
            console.log(`✅ ${pagePath} - добавлена кнопка в панель блоков`);
        }
    }

    // Сохраняем файл, если были изменения
    if (modified) {
        fs.writeFileSync(pagePath, content, 'utf8');
        console.log(`💾 ${pagePath} - сохранен\n`);
    } else {
        console.log(`ℹ️  ${pagePath} - изменений не требуется\n`);
    }
});

console.log('✅ Обновление завершено!');

