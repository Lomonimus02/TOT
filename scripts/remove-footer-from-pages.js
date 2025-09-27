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
    
    // Проверяем, есть ли подвал
    if (!content.includes('site-footer')) {
        console.log(`Подвал отсутствует в ${file}`);
        return;
    }
    
    // Удаляем подвал (от <!-- Подвал сайта --> до </footer>)
    const footerRegex = /\s*<!-- Подвал сайта -->[\s\S]*?<\/footer>\s*/g;
    const newContent = content.replace(footerRegex, '\n');
    
    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Подвал удален из ${file}`);
    } else {
        console.log(`Не удалось удалить подвал из ${file}`);
    }
});

console.log('Обработка завершена');
