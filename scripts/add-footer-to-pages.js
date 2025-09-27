const fs = require('fs');
const path = require('path');

// Получаем список всех HTML файлов в папке pages
const pagesDir = path.join(__dirname, '..', 'pages');
const files = fs.readdirSync(pagesDir).filter(file => 
    file.endsWith('.html') && file !== 'template.html'
);

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

files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Проверяем, есть ли уже подвал
    if (content.includes('site-footer')) {
        console.log(`Подвал уже есть в ${file}`);
        return;
    }
    
    // Ищем место для вставки подвала (перед закрывающими тегами body и html)
    const insertPosition = content.lastIndexOf('</body>');
    
    if (insertPosition !== -1) {
        // Вставляем подвал перед </body>
        content = content.slice(0, insertPosition) + footerHTML + '\n\n' + content.slice(insertPosition);
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Подвал добавлен в ${file}`);
    } else {
        console.log(`Не удалось найти место для вставки подвала в ${file}`);
    }
});

console.log('Обработка завершена');
