const fs = require('fs');
const path = require('path');

// Функция для добавления скрипта newsletter.js в HTML файл
function addNewsletterScript(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Проверяем, есть ли уже подключение newsletter.js
        if (content.includes('newsletter.js')) {
            console.log(`Скрипт newsletter.js уже подключен в ${filePath}`);
            return;
        }
        
        // Определяем правильный путь к скрипту в зависимости от расположения файла
        const isInPagesFolder = filePath.includes('pages/');
        const scriptPath = isInPagesFolder ? '../js/newsletter.js' : 'js/newsletter.js';
        const scriptTag = `    <script src="${scriptPath}"></script>`;
        
        // Ищем место для вставки скрипта (перед закрывающим </body>)
        const bodyEndRegex = /(\s*<\/body>)/;
        
        if (bodyEndRegex.test(content)) {
            content = content.replace(bodyEndRegex, `\n${scriptTag}\n$1`);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Скрипт newsletter.js добавлен в ${filePath}`);
        } else {
            console.log(`❌ Не удалось найти закрывающий тег </body> в ${filePath}`);
        }
        
    } catch (error) {
        console.error(`❌ Ошибка при обработке ${filePath}:`, error.message);
    }
}

// Обрабатываем главную страницу
console.log('Обработка главной страницы...');
addNewsletterScript('index.html');

// Обрабатываем все страницы в папке pages
console.log('\nОбработка страниц в папке pages...');
const pagesDir = 'pages';
if (fs.existsSync(pagesDir)) {
    const files = fs.readdirSync(pagesDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    htmlFiles.forEach(file => {
        const filePath = path.join(pagesDir, file);
        addNewsletterScript(filePath);
    });
    
    console.log(`\n📊 Обработано ${htmlFiles.length} HTML файлов в папке pages`);
} else {
    console.log('❌ Папка pages не найдена');
}

console.log('\n🎉 Скрипт завершен!');
