// Скрипт для автоматического добавления режима редактирования во все страницы
const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

async function updatePagesForEditMode() {
    try {
        console.log('🔧 Обновление страниц для поддержки режима редактирования...\n');
        
        const pagesDir = path.join(__dirname, 'pages');
        const files = await fs.readdir(pagesDir);
        
        // Фильтруем только HTML файлы, исключая template.html и test файлы
        const htmlFiles = files.filter(file => 
            file.endsWith('.html') && 
            file !== 'template.html' && 
            !file.startsWith('test-')
        );
        
        console.log(`Найдено ${htmlFiles.length} HTML файлов для обновления:`);
        htmlFiles.forEach(file => console.log(`  - ${file}`));
        console.log('');
        
        for (const file of htmlFiles) {
            await updatePageFile(path.join(pagesDir, file), file);
        }
        
        console.log('\n✅ Все страницы успешно обновлены!');
        console.log('🚀 Теперь режим редактирования доступен на всех страницах сайта.');
        
    } catch (error) {
        console.error('❌ Ошибка обновления страниц:', error);
    }
}

async function updatePageFile(filePath, fileName) {
    try {
        console.log(`📝 Обновление ${fileName}...`);
        
        const content = await fs.readFile(filePath, 'utf8');
        const $ = cheerio.load(content);
        
        // 1. Добавляем кнопку редактирования в навигацию
        const navMenu = $('.nav-menu');
        if (navMenu.length > 0) {
            // Проверяем, есть ли уже кнопка редактирования
            if (!navMenu.find('#editModeBtn').length) {
                const loginBtn = navMenu.find('#loginBtn');
                if (loginBtn.length > 0) {
                    loginBtn.before('<a href="#" class="nav-link admin-only" id="editModeBtn" style="display: none;">Редактировать</a>');
                } else {
                    navMenu.prepend('<a href="#" class="nav-link admin-only" id="editModeBtn" style="display: none;">Редактировать</a>');
                }
            }
        }
        
        // 2. Добавляем data-edit-id к основным элементам
        const pageTitle = $('.page-title');
        if (pageTitle.length > 0 && !pageTitle.attr('data-edit-id')) {
            pageTitle.attr('data-edit-id', 'page-title');
        }
        
        const pageSubtitle = $('.page-subtitle');
        if (pageSubtitle.length > 0 && !pageSubtitle.attr('data-edit-id')) {
            pageSubtitle.attr('data-edit-id', 'page-subtitle');
        }
        
        // 3. Добавляем data-edit-id к контенту страницы
        const pageContent = $('.page-content');
        if (pageContent.length > 0) {
            // Если контент пустой, добавляем базовую структуру
            if (pageContent.text().trim() === '' || pageContent.text().includes('Контент добавляется через inline редактор')) {
                pageContent.html(`
                    <div class="content-section">
                        <p data-edit-id="intro-text">Добро пожаловать на эту страницу. Здесь вы можете добавить описание и информацию.</p>
                        
                        <h3 data-edit-id="section-title">Основная информация</h3>
                        <p data-edit-id="section-text">Здесь можно разместить подробную информацию о данном разделе.</p>
                    </div>
                `);
            } else {
                // Добавляем data-edit-id к существующим элементам
                pageContent.find('h1, h2, h3, h4, h5, h6').each((i, el) => {
                    if (!$(el).attr('data-edit-id')) {
                        $(el).attr('data-edit-id', `heading-${i + 1}`);
                    }
                });
                
                pageContent.find('p').each((i, el) => {
                    if (!$(el).attr('data-edit-id')) {
                        $(el).attr('data-edit-id', `paragraph-${i + 1}`);
                    }
                });
            }
        }
        
        // 4. Добавляем скрипты если их нет
        const scripts = $('script[src]').map((i, el) => $(el).attr('src')).get();
        
        const requiredScripts = [
            '../js/session.js',
            '../js/edit-mode.js'
        ];
        
        requiredScripts.forEach(scriptSrc => {
            if (!scripts.includes(scriptSrc)) {
                // Добавляем перед последним скриптом
                const lastScript = $('script[src]').last();
                if (lastScript.length > 0) {
                    lastScript.before(`<script src="${scriptSrc}"></script>`);
                } else {
                    $('body').append(`<script src="${scriptSrc}"></script>`);
                }
            }
        });
        
        // Сохраняем обновленный файл
        await fs.writeFile(filePath, $.html(), 'utf8');
        console.log(`✅ ${fileName} обновлен`);
        
    } catch (error) {
        console.error(`❌ Ошибка обновления ${fileName}:`, error);
    }
}

// Запуск скрипта
updatePagesForEditMode();
