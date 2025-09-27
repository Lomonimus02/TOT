const fs = require('fs');
const path = require('path');

// HTML для подвала
const footerHTML = `
    <!-- Подвал сайта -->
    <footer class="site-footer">
        <div class="footer-content">
            <!-- Контакты -->
            <div class="footer-section">
                <h3>Контакты</h3>
                <div class="footer-contacts">
                    <div class="footer-contact-item">
                        <span>📞</span>
                        <a href="tel:+78129050207">+7 (812) 905 02 07</a>
                    </div>
                    <div class="footer-contact-item">
                        <span>✉️</span>
                        <a href="mailto:info@piramidaspb.ru">info@piramidaspb.ru</a>
                    </div>
                </div>
            </div>

            <!-- Подписка на рассылку -->
            <div class="footer-section">
                <h3>Подписка на рассылку</h3>
                <form class="newsletter-form" id="newsletterForm">
                    <input type="email" class="newsletter-input" placeholder="Ваш email" required>
                    <button type="submit" class="newsletter-btn">Подписаться</button>
                </form>
            </div>

            <!-- Социальные сети -->
            <div class="footer-section">
                <h3>Мы в социальных сетях</h3>
                <div class="social-links">
                    <a href="https://vk.com/club187535764" class="social-link" target="_blank" title="ВКонтакте">
                        <span>VK</span>
                    </a>
                    <a href="#" class="social-link disabled" title="Телеграм (скоро)">
                        <span>TG</span>
                    </a>
                    <a href="#" class="social-link disabled" title="РуТуб (скоро)">
                        <span>RT</span>
                    </a>
                </div>
            </div>

            <!-- Копирайт -->
            <div class="footer-copyright">
                2019 - 2025г. Все права защищены, Isais ©
            </div>
        </div>
    </footer>`;

// Функция для добавления подвала в HTML файл
function addFooterToFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Проверяем, есть ли уже подвал
        if (content.includes('class="site-footer"')) {
            console.log(`Подвал уже существует в ${filePath}`);
            return;
        }
        
        // Ищем закрывающий тег </main> и добавляем подвал после него
        const mainEndRegex = /<\/main>/;
        if (mainEndRegex.test(content)) {
            content = content.replace(mainEndRegex, '</main>\n' + footerHTML);
        } else {
            // Если нет </main>, добавляем перед модальными окнами или перед закрывающим body
            const modalRegex = /(\s*<!-- Модальные окна -->)/;
            const bodyEndRegex = /(\s*<\/body>)/;
            
            if (modalRegex.test(content)) {
                content = content.replace(modalRegex, '\n' + footerHTML + '\n$1');
            } else if (bodyEndRegex.test(content)) {
                content = content.replace(bodyEndRegex, '\n' + footerHTML + '\n$1');
            } else {
                console.log(`Не удалось найти подходящее место для вставки подвала в ${filePath}`);
                return;
            }
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Подвал добавлен в ${filePath}`);
        
    } catch (error) {
        console.error(`❌ Ошибка при обработке ${filePath}:`, error.message);
    }
}

// Обрабатываем главную страницу
console.log('Обработка главной страницы...');
addFooterToFile('index.html');

// Обрабатываем все страницы в папке pages
console.log('\nОбработка страниц в папке pages...');
const pagesDir = 'pages';
if (fs.existsSync(pagesDir)) {
    const files = fs.readdirSync(pagesDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    htmlFiles.forEach(file => {
        const filePath = path.join(pagesDir, file);
        addFooterToFile(filePath);
    });
    
    console.log(`\n📊 Обработано ${htmlFiles.length} HTML файлов в папке pages`);
} else {
    console.log('❌ Папка pages не найдена');
}

console.log('\n🎉 Скрипт завершен!');
