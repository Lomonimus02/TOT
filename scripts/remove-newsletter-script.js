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
    
    // Проверяем, есть ли подключение newsletter.js
    if (!content.includes('newsletter.js')) {
        console.log(`Newsletter.js отсутствует в ${file}`);
        return;
    }
    
    // Удаляем строку с подключением newsletter.js
    const scriptRegex = /\s*<script src="\.\.\/js\/newsletter\.js"><\/script>\s*/g;
    const newContent = content.replace(scriptRegex, '\n');
    
    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Newsletter.js удален из ${file}`);
    } else {
        console.log(`Не удалось удалить newsletter.js из ${file}`);
    }
});

console.log('Обработка завершена');
