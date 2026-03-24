const fs = require('fs');
const path = require('path');

// Список страниц для обновления
const pages = [
    'pages/temple.html',
    'pages/school-isais.html',
    'pages/school-tota.html',
    'pages/seminars.html',
    'pages/programs.html',
    'pages/recordings.html',
    'pages/rods.html',
    'pages/visit.html',
    'pages/consultations.html',
    'pages/court.html',
    'pages/complex.html',
    'pages/news.html',
    'pages/forum.html'
];

console.log('🔧 Добавление SEO Helper на страницы...\n');

pages.forEach(pagePath => {
    try {
        // Читаем файл
        let content = fs.readFileSync(pagePath, 'utf8');
        
        // Проверяем, не добавлен ли уже seo-helper.js
        if (content.includes('seo-helper.js')) {
            console.log(`⏭️  ${pagePath} - SEO Helper уже добавлен`);
            return;
        }
        
        // Ищем строку с blocks-system.js
        const blocksSystemPattern = /(\s*<script src="\.\.\/js\/blocks-system\.js"><\/script>)/;
        
        if (blocksSystemPattern.test(content)) {
            // Добавляем seo-helper.js ПЕРЕД blocks-system.js
            content = content.replace(
                blocksSystemPattern,
                '\n    <!-- SEO Helper для системы блоков (загружается ПЕРЕД blocks-system.js) -->\n    <script src="../js/seo-helper.js"></script>\n    \n$1'
            );
            
            // Сохраняем файл
            fs.writeFileSync(pagePath, content, 'utf8');
            console.log(`✅ ${pagePath} - SEO Helper добавлен`);
        } else {
            // Если blocks-system.js не найден, ищем другое место для вставки
            const scriptPattern = /(\s*<script src="\.\.\/js\/mobile\.js"><\/script>)/;
            
            if (scriptPattern.test(content)) {
                content = content.replace(
                    scriptPattern,
                    '$1\n\n    <!-- SEO Helper для системы блоков -->\n    <script src="../js/seo-helper.js"></script>'
                );
                
                fs.writeFileSync(pagePath, content, 'utf8');
                console.log(`✅ ${pagePath} - SEO Helper добавлен (после mobile.js)`);
            } else {
                console.log(`⚠️  ${pagePath} - Не найдено подходящее место для вставки`);
            }
        }
        
    } catch (error) {
        console.error(`❌ Ошибка обработки ${pagePath}:`, error.message);
    }
});

console.log('\n✨ Готово!');

