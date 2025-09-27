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

// Функция для обновления HTML файла
function updateHtmlFile(filePath) {
    try {
        const fullPath = path.join(__dirname, '..', filePath);
        
        if (!fs.existsSync(fullPath)) {
            console.log(`Файл не найден: ${filePath}`);
            return;
        }

        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Проверяем, есть ли уже подключение frame-manager.js
        if (content.includes('frame-manager.js')) {
            console.log(`Frame manager уже подключен в: ${filePath}`);
            return;
        }

        // Определяем правильный путь к JS файлу
        const isInPagesFolder = filePath.startsWith('pages/');
        const jsPath = isInPagesFolder ? '../js/frame-manager.js' : 'js/frame-manager.js';
        
        // Ищем первый script тег и вставляем перед ним
        const scriptRegex = /<script\s+src="[^"]*\.js"><\/script>/;
        const firstScriptMatch = content.match(scriptRegex);
        
        if (firstScriptMatch) {
            const frameScript = `    <script src="${jsPath}"></script>\n    `;
            content = content.replace(firstScriptMatch[0], frameScript + firstScriptMatch[0]);
        } else {
            // Если нет других скриптов, добавляем перед закрывающим body
            const bodyEndIndex = content.lastIndexOf('</body>');
            if (bodyEndIndex !== -1) {
                const frameScript = `\n    <!-- Подключение скриптов -->\n    <script src="${jsPath}"></script>\n`;
                content = content.slice(0, bodyEndIndex) + frameScript + content.slice(bodyEndIndex);
            }
        }

        // Сохраняем обновленный файл
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Добавлен frame-manager.js в: ${filePath}`);
        
    } catch (error) {
        console.error(`Ошибка при обновлении ${filePath}:`, error.message);
    }
}

// Обновляем все файлы
console.log('Начинаем добавление frame-manager.js во все HTML файлы...\n');

htmlFiles.forEach(updateHtmlFile);

console.log('\nГотово! Frame manager добавлен во все файлы.');