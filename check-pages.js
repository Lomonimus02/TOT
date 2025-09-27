// Скрипт для проверки всех страниц на наличие правильной инициализации
const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');
const files = fs.readdirSync(pagesDir).filter(file => file.endsWith('.html'));

console.log('🔍 Проверяем страницы на наличие системы блоков...\n');

files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const hasMainJs = content.includes('main.js');
    const hasBlockSystem = content.includes('new-blocks-system.js');
    const hasInitialization = content.includes('NewBlockSystem.initialize');
    const hasInlineEditor = content.includes('new InlinePageEditor');
    
    console.log(`📄 ${file}:`);
    console.log(`  main.js: ${hasMainJs ? '✅' : '❌'}`);
    console.log(`  new-blocks-system.js: ${hasBlockSystem ? '✅' : '❌'}`);
    console.log(`  Инициализация блоков: ${hasInitialization ? '✅' : '❌'}`);
    console.log(`  Создание редактора: ${hasInlineEditor ? '✅' : '❌'}`);
    
    if (hasMainJs && hasBlockSystem) {
        // Проверяем порядок загрузки
        const mainJsIndex = content.indexOf('main.js');
        const blockSystemIndex = content.indexOf('new-blocks-system.js');
        const correctOrder = mainJsIndex < blockSystemIndex;
        console.log(`  Правильный порядок: ${correctOrder ? '✅' : '❌'}`);
    }
    
    console.log('');
});
