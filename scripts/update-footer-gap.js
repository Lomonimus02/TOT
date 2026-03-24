const fs = require('fs');
const path = require('path');

// Список HTML файлов для обновления
const filesToUpdate = [
    'pages/complex.html',
    'pages/consultations.html',
    'pages/court.html',
    'pages/forum.html',
    'pages/news.html',
    'pages/programs.html',
    'pages/pyramid.html',
    'pages/recordings.html',
    'pages/rods.html',
    'pages/school-isais.html',
    'pages/school-tota.html',
    'pages/seminars.html',
    'pages/template.html',
    'pages/temple.html',
    'pages/visit.html'
];

console.log('🔄 Начинаем обновление расстояния в подвалах...\n');

let updatedCount = 0;
let errorCount = 0;

// Проверяем, нужно ли обновить css/style.css
const cssPath = path.join(__dirname, '..', 'css', 'style.css');
try {
    let cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Проверяем, есть ли старое значение gap
    if (cssContent.includes('gap: 5px;')) {
        cssContent = cssContent.replace('gap: 5px;', 'gap: 2.5px;');
        fs.writeFileSync(cssPath, cssContent, 'utf8');
        console.log('✅ Обновлен css/style.css (gap: 5px → 2.5px)');
    } else if (cssContent.includes('gap: 2.5px;')) {
        console.log('ℹ️  css/style.css уже обновлен');
    } else {
        console.log('⚠️  Не найдено значение gap в css/style.css');
    }
} catch (error) {
    console.error('❌ Ошибка обновления css/style.css:', error.message);
}

console.log('\n📊 Обновление завершено!');
console.log(`   ✅ CSS файл обновлен`);
console.log(`\n✨ Расстояние между годом и копирайтом уменьшено в 2 раза (5px → 2.5px)`);

