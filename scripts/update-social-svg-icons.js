const fs = require('fs');
const path = require('path');

// Функция для обновления иконок социальных сетей на SVG в HTML файле
function updateSocialSVGIcons(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Определяем правильный путь к изображениям в зависимости от расположения файла
        const isInPagesFolder = filePath.includes('pages/');
        const imagePath = isInPagesFolder ? '../images/uploads/' : 'images/uploads/';
        
        // Заменяем текстовые иконки на SVG изображения
        content = content.replace(
            /<a href="https:\/\/vk\.com\/club187535764" class="social-link" target="_blank" title="ВКонтакте">\s*<span>ВК<\/span>\s*<\/a>/g,
            `<a href="https://vk.com/club187535764" class="social-link" target="_blank" title="ВКонтакте">
                        <img src="${imagePath}VK_Compact_Logo_(2021-present).svg" alt="ВКонтакте">
                    </a>`
        );
        
        content = content.replace(
            /<a href="#" class="social-link disabled" title="Телеграм \(скоро\)">\s*<span>ТГ<\/span>\s*<\/a>/g,
            `<a href="#" class="social-link disabled" title="Телеграм (скоро)">
                        <img src="${imagePath}Telegram_2019_Logo.svg" alt="Телеграм">
                    </a>`
        );
        
        content = content.replace(
            /<a href="#" class="social-link disabled" title="РуТуб \(скоро\)">\s*<span>РТ<\/span>\s*<\/a>/g,
            `<a href="#" class="social-link disabled" title="РуТуб (скоро)">
                        <img src="${imagePath}Rutube_icon.svg" alt="РуТуб">
                    </a>`
        );
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ SVG иконки социальных сетей обновлены в ${filePath}`);
        
    } catch (error) {
        console.error(`❌ Ошибка при обработке ${filePath}:`, error.message);
    }
}

// Обрабатываем все страницы в папке pages
console.log('Обновление SVG иконок социальных сетей в папке pages...');
const pagesDir = 'pages';
if (fs.existsSync(pagesDir)) {
    const files = fs.readdirSync(pagesDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    htmlFiles.forEach(file => {
        const filePath = path.join(pagesDir, file);
        updateSocialSVGIcons(filePath);
    });
    
    console.log(`\n📊 Обработано ${htmlFiles.length} HTML файлов в папке pages`);
} else {
    console.log('❌ Папка pages не найдена');
}

console.log('\n🎉 Скрипт завершен!');
