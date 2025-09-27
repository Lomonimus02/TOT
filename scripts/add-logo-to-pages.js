const fs = require('fs');
const path = require('path');

// Получаем список всех HTML файлов в папке pages
const pagesDir = path.join(__dirname, '..', 'pages');
const files = fs.readdirSync(pagesDir).filter(file => 
    file.endsWith('.html') && file !== 'template.html'
);

const logoHTML = `    
    <!-- Логотип сайта -->
    <div class="site-logo">
        <a href="../index.html" title="Вернуться на главную страницу">
            <img src="../images/uploads/logo.png" alt="Пирамида ТОТА - Логотип">
        </a>
    </div>`;

files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Проверяем, есть ли уже логотип
    if (content.includes('site-logo')) {
        console.log(`Логотип уже есть в ${file}`);
        return;
    }
    
    // Ищем место для вставки логотипа (после cosmic-background)
    const cosmicBgRegex = /(<div class="cosmic-background"><\/div>[\s\S]*?)([\s]*<\/div>)?[\s]*(<main|<!-- Основной)/;
    const match = content.match(cosmicBgRegex);
    
    if (match) {
        // Вставляем логотип после cosmic-background
        const replacement = match[1] + logoHTML + '\n\n    ' + match[3];
        content = content.replace(cosmicBgRegex, replacement);
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Логотип добавлен в ${file}`);
    } else {
        console.log(`Не удалось найти место для вставки логотипа в ${file}`);
    }
});

console.log('Обработка завершена');
