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
        
        // Проверяем, есть ли уже рамка
        if (content.includes('fullscreen-frame')) {
            console.log(`Рамка уже добавлена в: ${filePath}`);
            return;
        }

        // Добавляем CSS для рамки
        const isInPagesFolder = filePath.startsWith('pages/');
        const cssPath = isInPagesFolder ? '../css/frame.css' : 'css/frame.css';
        
        if (!content.includes('frame.css')) {
            // Ищем место для вставки CSS
            const cssInsertPoint = content.indexOf('</head>');
            if (cssInsertPoint !== -1) {
                const cssLink = `    <link rel="stylesheet" href="${cssPath}">\n`;
                content = content.slice(0, cssInsertPoint) + cssLink + content.slice(cssInsertPoint);
            }
        }

        // Добавляем HTML элемент рамки
        const bodyStartIndex = content.indexOf('<body>');
        if (bodyStartIndex !== -1) {
            const insertPoint = content.indexOf('>', bodyStartIndex) + 1;
            const frameHtml = `\n    <!-- Полноэкранная египетская рамка -->\n    <div class="fullscreen-frame"></div>\n`;
            content = content.slice(0, insertPoint) + frameHtml + content.slice(insertPoint);
        }

        // Сохраняем обновленный файл
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Обновлен файл: ${filePath}`);
        
    } catch (error) {
        console.error(`Ошибка при обновлении ${filePath}:`, error.message);
    }
}

// Обновляем все файлы
console.log('Начинаем добавление рамки во все HTML файлы...\n');

htmlFiles.forEach(updateHtmlFile);

console.log('\nГотово! Рамка добавлена во все файлы.');