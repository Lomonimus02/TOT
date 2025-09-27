const fs = require('fs');
const path = require('path');

// Функция для исправления путей к изображениям социальных сетей
function fixSocialImagePaths(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Определяем правильный путь к изображениям в зависимости от расположения файла
        const isInPagesFolder = filePath.includes('pages/');
        const imagePath = isInPagesFolder ? '../images/uploads/' : 'images/uploads/';
        
        // Исправляем пути к изображениям социальных сетей
        content = content.replace(
            new RegExp(`src="${imagePath.replace('../', '\\.\\./').replace('/', '\\/')}VK_Compact_Logo_\\(2021-present\\)\\.svg"`, 'g'),
            `src="${imagePath}VK_Compact_Logo_(2021-present).svg.png"`
        );
        
        content = content.replace(
            new RegExp(`src="${imagePath.replace('../', '\\.\\./').replace('/', '\\/')}Telegram_2019_Logo\\.svg"`, 'g'),
            `src="${imagePath}Telegram_2019_Logo.svg.webp"`
        );
        
        content = content.replace(
            new RegExp(`src="${imagePath.replace('../', '\\.\\./').replace('/', '\\/')}Rutube_icon\\.svg"`, 'g'),
            `src="${imagePath}Rutube_icon.svg.png"`
        );
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Пути к изображениям социальных сетей исправлены в ${filePath}`);
        
    } catch (error) {
        console.error(`❌ Ошибка при обработке ${filePath}:`, error.message);
    }
}

// Обрабатываем все страницы в папке pages
console.log('Исправление путей к изображениям социальных сетей в папке pages...');
const pagesDir = 'pages';
if (fs.existsSync(pagesDir)) {
    const files = fs.readdirSync(pagesDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    htmlFiles.forEach(file => {
        const filePath = path.join(pagesDir, file);
        fixSocialImagePaths(filePath);
    });
    
    console.log(`\n📊 Обработано ${htmlFiles.length} HTML файлов в папке pages`);
} else {
    console.log('❌ Папка pages не найдена');
}

console.log('\n🎉 Скрипт завершен!');
