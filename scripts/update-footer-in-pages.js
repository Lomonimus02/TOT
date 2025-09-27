const fs = require('fs');
const path = require('path');

// Новый HTML для подвала - минималистичный дизайн
const newFooterHTML = `    <!-- Подвал сайта -->
    <footer class="site-footer">
        <div class="footer-content">
            <!-- Контакты -->
            <div class="footer-section">
                <h3>Контакты</h3>
                <div class="footer-contacts">
                    <div class="footer-contact-item">
                        <a href="tel:+78129050207">+7 (812) 905 02 07</a>
                    </div>
                    <div class="footer-contact-item">
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
                        <img src="../images/uploads/VK_Compact_Logo_(2021-present).svg.png" alt="ВКонтакте">
                    </a>
                    <a href="https://t.me/piramidatota" class="social-link" target="_blank" title="Телеграм">
                        <img src="../images/uploads/Telegram_2019_Logo.svg.webp" alt="Телеграм">
                    </a>
                    <a href="https://rutube.ru/channel/42454841" class="social-link" target="_blank" title="РуТуб">
                        <img src="../images/uploads/Rutube_icon.svg.png" alt="РуТуб">
                    </a>
                </div>
            </div>

            <!-- Копирайт -->
            <div class="footer-copyright">
                2019 - 2025г. Все права защищены, Isais ©
            </div>
        </div>
    </footer>`;

// Функция для обновления подвала в файле
function updateFooterInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Регулярное выражение для поиска подвала
        const footerRegex = /\s*<!-- Подвал сайта -->[\s\S]*?<\/footer>/;
        
        if (footerRegex.test(content)) {
            // Заменяем старый подвал на новый
            content = content.replace(footerRegex, newFooterHTML);
            
            // Записываем обновленный контент
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✓ Обновлен подвал в файле: ${filePath}`);
            return true;
        } else {
            console.log(`⚠ Подвал не найден в файле: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`✗ Ошибка при обработке файла ${filePath}:`, error.message);
        return false;
    }
}

// Основная функция
function main() {
    const pagesDir = path.join(__dirname, '..', 'pages');
    
    if (!fs.existsSync(pagesDir)) {
        console.error('Папка pages не найдена!');
        return;
    }
    
    const files = fs.readdirSync(pagesDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    console.log(`Найдено ${htmlFiles.length} HTML файлов для обновления...`);
    
    let updatedCount = 0;
    
    htmlFiles.forEach(file => {
        const filePath = path.join(pagesDir, file);
        if (updateFooterInFile(filePath)) {
            updatedCount++;
        }
    });
    
    console.log(`\nОбновление завершено. Обновлено файлов: ${updatedCount} из ${htmlFiles.length}`);
}

// Запуск скрипта
main();
