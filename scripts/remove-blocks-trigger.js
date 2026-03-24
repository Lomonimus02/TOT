/**
 * Скрипт для удаления триггера и панели блоков со страниц с Rich Text Editor
 */

const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'pages');

// Список страниц с Rich Text Editor
const richTextEditorPages = [
    'about-isais.html',
    'artifacts.html',
    'complex.html',
    'consultations.html',
    'court.html',
    'forum.html',
    'media.html',
    'news.html',
    'news-pyramid.html',
    'programs.html',
    'projects.html',
    'pyramid.html',
    'recordings.html',
    'rods.html',
    'school-isais.html',
    'school-tota.html',
    'seminars.html'
];

console.log('🧹 Начинаем удаление триггера и панели блоков со страниц с Rich Text Editor...\n');

let processedCount = 0;
let modifiedCount = 0;

richTextEditorPages.forEach(fileName => {
    const filePath = path.join(pagesDir, fileName);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Файл не найден: ${fileName}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Удаляем панель блоков (многострочный блок)
    const panelRegex = /\s*<!-- Панель блоков.*?-->\s*<div class="blocks-panel"[\s\S]*?<\/div>\s*<\/div>\s*/g;
    if (panelRegex.test(content)) {
        content = content.replace(panelRegex, '\n');
        modified = true;
        console.log(`  ✅ Удалена панель блоков из ${fileName}`);
    }
    
    // Удаляем триггер блоков (однострочный или многострочный)
    const triggerRegex1 = /\s*<!-- Кнопка-триггер панели блоков -->\s*<div class="blocks-trigger"[^>]*>[\s\S]*?<\/div>\s*/g;
    const triggerRegex2 = /\s*<div class="blocks-trigger"[^>]*>📜<\/div>\s*/g;
    
    if (triggerRegex1.test(content)) {
        content = content.replace(triggerRegex1, '\n');
        modified = true;
        console.log(`  ✅ Удален триггер блоков (с комментарием) из ${fileName}`);
    }
    
    // Сбрасываем lastIndex для повторного использования
    triggerRegex2.lastIndex = 0;
    
    if (triggerRegex2.test(content)) {
        content = content.replace(triggerRegex2, '\n');
        modified = true;
        console.log(`  ✅ Удален триггер блоков (без комментария) из ${fileName}`);
    }
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        modifiedCount++;
        console.log(`✅ Сохранен: ${fileName}\n`);
    } else {
        console.log(`ℹ️  Нет изменений: ${fileName}\n`);
    }
    
    processedCount++;
});

console.log('\n' + '='.repeat(60));
console.log(`✅ Обработано файлов: ${processedCount}`);
console.log(`✅ Изменено файлов: ${modifiedCount}`);
console.log('='.repeat(60));

