const fs = require('fs');
const path = require('path');

// Список всех HTML файлов для обновления
const htmlFiles = [
    'admin.html',
    'api-status.html', 
    'demo.html',
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
    'pages/temple.html',
    'pages/visit.html'
];

// Функция для удаления header из HTML файла
function removeHeaderFromFile(filePath) {
    try {
        const fullPath = path.join(__dirname, '..', filePath);
        
        if (!fs.existsSync(fullPath)) {
            console.log(`Файл не найден: ${filePath}`);
            return;
        }

        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Проверяем, есть ли египетская навигационная панель
        if (!content.includes('egyptian-navbar')) {
            console.log(`Header уже удален из: ${filePath}`);
            return;
        }

        // Удаляем весь блок египетской навигационной панели
        const headerRegex = /\s*<!-- Египетская навигационная панель -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;
        
        if (headerRegex.test(content)) {
            content = content.replace(headerRegex, '');
            console.log(`Удален header из: ${filePath}`);
        } else {
            // Альтернативный способ - удаляем по классу
            const altHeaderRegex = /<div class="egyptian-navbar">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;
            if (altHeaderRegex.test(content)) {
                content = content.replace(altHeaderRegex, '');
                console.log(`Удален header (альтернативный способ) из: ${filePath}`);
            } else {
                console.log(`Не удалось найти header в: ${filePath}`);
                return;
            }
        }

        // Сохраняем обновленный файл
        fs.writeFileSync(fullPath, content, 'utf8');
        
    } catch (error) {
        console.error(`Ошибка при обновлении ${filePath}:`, error.message);
    }
}

// Обновляем все файлы
console.log('Начинаем удаление header из всех HTML файлов...\n');

htmlFiles.forEach(removeHeaderFromFile);

console.log('\nГотово! Header удален из всех файлов.');