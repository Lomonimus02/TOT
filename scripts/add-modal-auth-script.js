const fs = require('fs');
const path = require('path');

// Функция для добавления modal-auth.js скрипта в HTML файл
function addModalAuthScript(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Проверяем, есть ли уже modal-auth.js
        if (content.includes('modal-auth.js')) {
            console.log(`⚠️  modal-auth.js уже подключен в ${filePath}`);
            return;
        }
        
        // Ищем строку с main.js и добавляем modal-auth.js после неё
        const mainJsPattern = /(\s*<script src="\.\.\/js\/main\.js"><\/script>)/;
        const match = content.match(mainJsPattern);

        if (match) {
            const replacement = match[1] + '\n    <script src="../js/modal-auth.js"></script>';
            content = content.replace(mainJsPattern, replacement);

            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ modal-auth.js добавлен в ${filePath}`);
        } else {
            console.log(`⚠️  Не найден main.js в ${filePath}`);
        }
        
    } catch (error) {
        console.error(`❌ Ошибка при обработке ${filePath}:`, error.message);
    }
}

// Обрабатываем все страницы в папке pages
console.log('Добавление modal-auth.js в папку pages...');
const pagesDir = 'pages';
if (fs.existsSync(pagesDir)) {
    const files = fs.readdirSync(pagesDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    htmlFiles.forEach(file => {
        const filePath = path.join(pagesDir, file);
        addModalAuthScript(filePath);
    });
    
    console.log(`\n📊 Обработано ${htmlFiles.length} HTML файлов в папке pages`);
} else {
    console.log('❌ Папка pages не найдена');
}

console.log('\n🎉 Скрипт завершен!');
