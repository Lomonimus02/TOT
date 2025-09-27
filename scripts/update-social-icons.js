const fs = require('fs');
const path = require('path');

// Функция для обновления иконок социальных сетей в HTML файле
function updateSocialIcons(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Заменяем старые иконки на новые
        content = content.replace(/<span>VK<\/span>/g, '<span>ВК</span>');
        content = content.replace(/<span>TG<\/span>/g, '<span>ТГ</span>');
        content = content.replace(/<span>RT<\/span>/g, '<span>РТ</span>');
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Иконки социальных сетей обновлены в ${filePath}`);
        
    } catch (error) {
        console.error(`❌ Ошибка при обработке ${filePath}:`, error.message);
    }
}

// Обрабатываем все страницы в папке pages
console.log('Обновление иконок социальных сетей в папке pages...');
const pagesDir = 'pages';
if (fs.existsSync(pagesDir)) {
    const files = fs.readdirSync(pagesDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    htmlFiles.forEach(file => {
        const filePath = path.join(pagesDir, file);
        updateSocialIcons(filePath);
    });
    
    console.log(`\n📊 Обработано ${htmlFiles.length} HTML файлов в папке pages`);
} else {
    console.log('❌ Папка pages не найдена');
}

console.log('\n🎉 Скрипт завершен!');
