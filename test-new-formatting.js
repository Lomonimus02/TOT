const puppeteer = require('puppeteer');

class NewFormattingTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = [];
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async init() {
        console.log('🚀 Тестирование новой системы форматирования...');
        this.browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1200, height: 800 }
        });
        this.page = await this.browser.newPage();
    }

    async runTests() {
        try {
            await this.init();
            
            // Подготовка
            await this.setupPage();
            
            // Тест 1: Проверка новых API
            await this.testNewAPIs();
            
            // Тест 2: Тестирование форматирования
            await this.testFormatting();
            
            // Тест 3: Проверка сохранения
            await this.testPersistence();
            
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Ошибка тестирования:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    async setupPage() {
        console.log('📄 Подготовка страницы...');
        
        await this.page.goto('http://localhost:3000/pyramid.html', { waitUntil: 'networkidle0' });
        
        // Авторизация
        await this.page.evaluate(() => {
            localStorage.setItem('user', JSON.stringify({
                email: 'admin@pyramid-tota.ru',
                role: 'admin',
                token: 'test-token'
            }));
        });
        
        await this.page.reload({ waitUntil: 'networkidle0' });
        await this.wait(1000);
        
        // Включаем режим редактирования
        const editButton = await this.page.$('#toggleEditMode');
        if (editButton) {
            await editButton.click();
            await this.wait(1000);
        }
    }

    async testNewAPIs() {
        console.log('🔌 Тест 1: Проверка новых API...');
        
        // Тестируем API форматирования
        const apiResponse = await this.page.evaluate(async () => {
            try {
                const response = await fetch('/api/formatting/pyramid');
                const data = await response.json();
                return { success: true, data };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
        
        this.addResult('API Formatting Endpoint', apiResponse.success, 
            apiResponse.success ? 'API работает' : `Ошибка: ${apiResponse.error}`);
    }

    async testFormatting() {
        console.log('🎨 Тест 2: Тестирование форматирования...');
        
        const titleElement = await this.page.$('h1.page-title');
        if (!titleElement) {
            this.addResult('Title Element', false, 'Заголовок не найден');
            return;
        }
        
        // Открываем контекстное меню
        await titleElement.click({ button: 'right' });
        await this.wait(500);
        
        // Тестируем размер шрифта
        const fontSizeSelect = await this.page.$('[data-action="fontSize"]');
        if (fontSizeSelect) {
            await fontSizeSelect.select('24');
            await this.wait(1000);
            
            const hasClass = await this.page.evaluate(() => {
                const title = document.querySelector('h1.page-title');
                return title ? title.classList.contains('font-size-24') : false;
            });
            
            this.addResult('Font Size Application', hasClass, 
                hasClass ? 'Класс font-size-24 применен' : 'Класс не применен');
        }
        
        // Тестируем выравнивание
        const centerBtn = await this.page.$('[data-action="alignCenter"]');
        if (centerBtn) {
            await centerBtn.click();
            await this.wait(1000);
            
            const hasClass = await this.page.evaluate(() => {
                const title = document.querySelector('h1.page-title');
                return title ? title.classList.contains('text-align-center') : false;
            });
            
            this.addResult('Text Alignment', hasClass, 
                hasClass ? 'Класс text-align-center применен' : 'Класс не применен');
        }
        
        // Проверяем сохранение в новую БД
        await this.wait(2000); // Ждем автосохранения
        
        const dbSave = await this.page.evaluate(async () => {
            try {
                // Проверяем, что данные сохранились в новую таблицу
                const response = await fetch('/api/formatting/pyramid');
                const data = await response.json();
                return { 
                    success: true, 
                    hasFormatting: data.success && Object.keys(data.data.formatting || {}).length > 0,
                    data: data.data
                };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
        
        this.addResult('Database Save', dbSave.hasFormatting, 
            dbSave.hasFormatting ? 'Форматирование сохранено в БД' : 'Форматирование не сохранено');
    }

    async testPersistence() {
        console.log('💾 Тест 3: Проверка сохранения...');
        
        // Получаем классы перед перезагрузкой
        const classesBeforeReload = await this.page.evaluate(() => {
            const title = document.querySelector('h1.page-title');
            return title ? title.className : '';
        });
        
        // Перезагружаем страницу
        await this.page.reload({ waitUntil: 'networkidle0' });
        await this.wait(2000);
        
        // Проверяем классы после перезагрузки
        const classesAfterReload = await this.page.evaluate(() => {
            const title = document.querySelector('h1.page-title');
            return title ? title.className : '';
        });
        
        const fontSizePersisted = classesAfterReload.includes('font-size-24');
        const alignmentPersisted = classesAfterReload.includes('text-align-center');
        
        this.addResult('Font Size Persistence', fontSizePersisted, 
            `Before: ${classesBeforeReload} | After: ${classesAfterReload}`);
        
        this.addResult('Alignment Persistence', alignmentPersisted, 
            `Before: ${classesBeforeReload} | After: ${classesAfterReload}`);
    }

    addResult(name, passed, details) {
        this.results.push({ name, passed, details });
        console.log(`${passed ? '✅' : '❌'} ${name}: ${details}`);
    }

    generateReport() {
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        
        console.log('\n📊 ОТЧЕТ ПО НОВОЙ СИСТЕМЕ ФОРМАТИРОВАНИЯ');
        console.log('='.repeat(50));
        console.log(`Всего тестов: ${totalTests}`);
        console.log(`Пройдено: ${passedTests}`);
        console.log(`Провалено: ${failedTests}`);
        console.log(`Успешность: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`);
        
        console.log('\n📋 ДЕТАЛИ ТЕСТОВ:');
        this.results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.passed ? '✅' : '❌'} ${result.name}`);
            console.log(`   ${result.details}`);
        });
        
        const fs = require('fs');
        fs.writeFileSync('new-formatting-report.json', JSON.stringify(this.results, null, 2));
        console.log('\n💾 Отчет сохранен в new-formatting-report.json');
    }
}

const tester = new NewFormattingTester();
tester.runTests().then(() => {
    console.log('\n🎉 Тестирование завершено!');
    process.exit(0);
}).catch(error => {
    console.error('💥 Ошибка тестирования:', error);
    process.exit(1);
});
