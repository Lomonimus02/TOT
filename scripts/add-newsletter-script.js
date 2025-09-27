const fs = require('fs');
const path = require('path');

// Получаем список всех HTML файлов в папке pages
const pagesDir = path.join(__dirname, '..', 'pages');
const files = fs.readdirSync(pagesDir).filter(file => 
    file.endsWith('.html') && file !== 'template.html'
);

files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Проверяем, есть ли уже подключение newsletter.js
    if (content.includes('newsletter.js')) {
        console.log(`Newsletter.js уже подключен в ${file}`);
        return;
    }
    
    // Ищем место для вставки скрипта (перед закрывающим тегом body)
    const bodyCloseIndex = content.lastIndexOf('</body>');
    
    if (bodyCloseIndex !== -1) {
        // Вставляем скрипт перед </body>
        const scriptTag = '    <script src="../js/newsletter.js"></script>\n';
        content = content.slice(0, bodyCloseIndex) + scriptTag + content.slice(bodyCloseIndex);
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Newsletter.js добавлен в ${file}`);
    } else {
        console.log(`Не удалось найти место для вставки скрипта в ${file}`);
    }
});

console.log('Обработка завершена');
