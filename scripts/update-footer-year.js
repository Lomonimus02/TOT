const fs = require('fs');
const path = require('path');

// Список HTML файлов для обновления (все кроме temple.html, который уже обновлен)
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
    'pages/visit.html'
];

// Регулярное выражение для поиска старого копирайта (с любыми отступами)
const oldCopyrightRegex = /(\s*)<!-- Копирайт -->\s*\n\s*<div class="footer-copyright">\s*\n\s*2019 - 2025г\. Все права защищены, Isais ©\s*\n\s*<\/div>/;

// Функция для создания нового копирайта с правильными отступами
function getNewCopyright(indent) {
    return `${indent}<!-- Копирайт -->
${indent}<div class="footer-copyright">
${indent}    <div class="footer-year">2017 - <span id="currentYear">2025</span>г.</div>
${indent}    <div class="footer-rights">Все права защищены, Isais ©</div>
${indent}</div>`;
}

// Скрипт для автоматического обновления года
const yearUpdateScript = `
    <!-- Автоматическое обновление года в подвале -->
    <script>
        // Обновляем год в подвале при загрузке страницы
        document.addEventListener('DOMContentLoaded', function() {
            const currentYearElement = document.getElementById('currentYear');
            if (currentYearElement) {
                const currentYear = new Date().getFullYear();
                currentYearElement.textContent = currentYear;
            }
        });
    </script>

</body>`;

console.log('🔄 Начинаем обновление подвалов на всех страницах...\n');

let updatedCount = 0;
let errorCount = 0;

filesToUpdate.forEach(file => {
    try {
        const filePath = path.join(__dirname, '..', file);
        
        // Проверяем существование файла
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  Файл не найден: ${file}`);
            errorCount++;
            return;
        }

        // Читаем содержимое файла
        let content = fs.readFileSync(filePath, 'utf8');

        // Проверяем, есть ли старый копирайт
        const match = content.match(oldCopyrightRegex);

        if (match) {
            // Получаем отступ из найденного совпадения
            const indent = match[1] || '            ';

            // Заменяем старый копирайт на новый с правильными отступами
            content = content.replace(oldCopyrightRegex, getNewCopyright(indent));

            // Добавляем скрипт обновления года перед закрывающим тегом </body>
            if (!content.includes('Автоматическое обновление года в подвале')) {
                content = content.replace(/\n<\/body>/, yearUpdateScript);
            }

            // Записываем обновленное содержимое
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Обновлен: ${file}`);
            updatedCount++;
        } else {
            console.log(`⚠️  Старый копирайт не найден в ${file}`);
            errorCount++;
        }
    } catch (error) {
        console.error(`❌ Ошибка при обработке ${file}:`, error.message);
        errorCount++;
    }
});

console.log(`\n📊 Результаты обновления:`);
console.log(`   ✅ Успешно обновлено: ${updatedCount} файлов`);
console.log(`   ❌ Ошибок: ${errorCount}`);
console.log(`\n✨ Готово!`);

