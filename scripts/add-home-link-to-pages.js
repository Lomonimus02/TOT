const fs = require('fs');
const path = require('path');

// Список страниц для обновления
const pages = [
    'complex.html',
    'consultations.html',
    'court.html',
    'forum.html',
    'news.html',
    'programs.html',
    'pyramid.html',
    'recordings.html',
    'rods.html',
    'school-isais.html',
    'school-tota.html',
    'seminars.html',
    'temple.html',
    'visit.html'
];

// Старый HTML логотипа
const oldLogoHTML = `    <!-- Логотип сайта -->
    <div class="site-logo">
        <a href="../index.html" title="Вернуться на главную страницу">
            <img src="../images/uploads/logo.png" alt="Пирамида ТОТА - Логотип">
        </a>
    </div>`;

// Новый HTML логотипа с надписью "Главная"
const newLogoHTML = `    <!-- Логотип сайта -->
    <div class="site-logo">
        <a href="../index.html" title="Вернуться на главную страницу">
            <img src="../images/uploads/logo.png" alt="Пирамида ТОТА - Логотип">
        </a>
        <a href="../index.html" class="home-link" title="Перейти на главную страницу">Главная</a>
    </div>`;

// Обрабатываем каждую страницу
pages.forEach(page => {
    const filePath = path.join(__dirname, '..', 'pages', page);
    
    try {
        // Читаем файл
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Проверяем, есть ли уже надпись "Главная"
        if (content.includes('class="home-link"')) {
            console.log(`✓ ${page} - уже содержит надпись "Главная", пропускаем`);
            return;
        }
        
        // Заменяем старый HTML на новый
        if (content.includes(oldLogoHTML)) {
            content = content.replace(oldLogoHTML, newLogoHTML);
            
            // Записываем обновленный файл
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✓ ${page} - успешно обновлен`);
        } else {
            console.log(`⚠ ${page} - не найден ожидаемый HTML логотипа`);
        }
    } catch (error) {
        console.error(`✗ ${page} - ошибка: ${error.message}`);
    }
});

console.log('\n✅ Обновление завершено!');

