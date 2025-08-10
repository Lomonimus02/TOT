const puppeteer = require('puppeteer');

class FormattingSystemAnalyzer {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            tests: [],
            issues: [],
            summary: {}
        };
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async init() {
        console.log('🚀 Запуск анализа системы форматирования...');
        this.browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1200, height: 800 }
        });
        this.page = await this.browser.newPage();
        
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                this.addIssue('JavaScript Error', msg.text());
            }
        });
        
        this.page.on('response', response => {
            if (!response.ok() && !response.url().includes('favicon') && !response.url().includes('cosmic-bg')) {
                this.addIssue('Network Error', `${response.status()} ${response.url()}`);
            }
        });
    }

    async runFullAnalysis() {
        try {
            await this.init();
            
            await this.testPageLoad();
            await this.testContextMenu();
            await this.testFontSizeFormatting();
            await this.testTextAlignment();
            await this.testPersistence();
            
            this.generateReport();
            
        } catch (error) {
            this.addIssue('Critical Error', error.message);
            console.error('❌ Критическая ошибка:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    async testPageLoad() {
        console.log('📄 Тест 1: Загрузка страницы...');
        
        try {
            await this.page.goto('http://localhost:3000/pyramid.html', { waitUntil: 'networkidle0' });
            
            const title = await this.page.title();
            this.addTest('Page Load', title.includes('Пирамида'), `Заголовок: ${title}`);
            
            // Проверяем авторизацию
            await this.page.evaluate(() => {
                localStorage.setItem('user', JSON.stringify({
                    email: 'admin@pyramid-tota.ru',
                    role: 'admin',
                    token: 'test-token'
                }));
            });
            
            await this.page.reload({ waitUntil: 'networkidle0' });
            await this.wait(1000);
            
            const editButton = await this.page.$('#toggleEditMode');
            this.addTest('Edit Button Present', !!editButton, 'Кнопка редактирования найдена');
            
            if (editButton) {
                await editButton.click();
                await this.wait(1000);
                
                const bodyClass = await this.page.evaluate(() => document.body.className);
                this.addTest('Edit Mode Activated', bodyClass.includes('edit-mode'), `Body classes: ${bodyClass}`);
            }
            
        } catch (error) {
            this.addIssue('Page Load Error', error.message);
        }
    }

    async testContextMenu() {
        console.log('🖱️ Тест 2: Контекстное меню...');
        
        try {
            const titleElement = await this.page.$('h1.page-title');
            this.addTest('Title Element Found', !!titleElement, 'Заголовок страницы найден');
            
            if (titleElement) {
                await titleElement.click({ button: 'right' });
                await this.wait(500);
                
                const contextEditor = await this.page.$('.context-editor.visible');
                this.addTest('Context Menu Appears', !!contextEditor, 'Контекстное меню появляется при правом клике');
                
                if (contextEditor) {
                    const boldBtn = await contextEditor.$('[data-action="bold"]');
                    const italicBtn = await contextEditor.$('[data-action="italic"]');
                    const fontSizeSelect = await contextEditor.$('[data-action="fontSize"]');
                    const colorSelect = await contextEditor.$('[data-action="textColor"]');
                    const alignButtons = await contextEditor.$$('[data-action^="align"]');
                    
                    this.addTest('Bold Button Present', !!boldBtn, 'Кнопка Bold найдена');
                    this.addTest('Italic Button Present', !!italicBtn, 'Кнопка Italic найдена');
                    this.addTest('Font Size Select Present', !!fontSizeSelect, 'Селект размера шрифта найден');
                    this.addTest('Color Select Present', !!colorSelect, 'Селект цвета найден');
                    this.addTest('Align Buttons Present', alignButtons.length >= 3, `Найдено ${alignButtons.length} кнопок выравнивания`);
                }
            }
            
        } catch (error) {
            this.addIssue('Context Menu Error', error.message);
        }
    }

    async testFontSizeFormatting() {
        console.log('📝 Тест 3: Размер шрифта...');
        
        try {
            const titleElement = await this.page.$('h1.page-title');
            if (!titleElement) {
                this.addIssue('Font Size Test', 'Заголовок не найден');
                return;
            }
            
            // Получаем исходные классы
            const originalClasses = await this.page.evaluate(() => {
                const title = document.querySelector('h1.page-title');
                return title ? title.className : '';
            });
            
            await titleElement.click({ button: 'right' });
            await this.wait(500);
            
            const fontSizeSelect = await this.page.$('[data-action="fontSize"]');
            if (fontSizeSelect) {
                await fontSizeSelect.select('32');
                await this.wait(1000);
                
                const titleClasses = await this.page.evaluate(() => {
                    const title = document.querySelector('h1.page-title');
                    return title ? title.className : '';
                });
                
                this.addTest('Font Size Class Applied', titleClasses.includes('font-size-32'), `Original: ${originalClasses} -> New: ${titleClasses}`);
                
                const computedFontSize = await this.page.evaluate(() => {
                    const title = document.querySelector('h1.page-title');
                    return title ? window.getComputedStyle(title).fontSize : '';
                });
                
                this.addTest('Font Size Visual Effect', computedFontSize === '32px', `Computed font-size: ${computedFontSize}`);
            }
            
        } catch (error) {
            this.addIssue('Font Size Test Error', error.message);
        }
    }

    async testTextAlignment() {
        console.log('↔️ Тест 4: Выравнивание текста...');
        
        try {
            const titleElement = await this.page.$('h1.page-title');
            if (!titleElement) return;
            
            await titleElement.click({ button: 'right' });
            await this.wait(500);
            
            const centerBtn = await this.page.$('[data-action="alignCenter"]');
            if (centerBtn) {
                await centerBtn.click();
                await this.wait(1000);
                
                const titleClasses = await this.page.evaluate(() => {
                    const title = document.querySelector('h1.page-title');
                    return title ? title.className : '';
                });
                
                this.addTest('Center Alignment Class', titleClasses.includes('text-align-center'), `Classes: ${titleClasses}`);
                
                const computedTextAlign = await this.page.evaluate(() => {
                    const title = document.querySelector('h1.page-title');
                    return title ? window.getComputedStyle(title).textAlign : '';
                });
                
                this.addTest('Center Alignment Visual', computedTextAlign === 'center', `Computed text-align: ${computedTextAlign}`);
            }
            
        } catch (error) {
            this.addIssue('Text Alignment Error', error.message);
        }
    }

    async testPersistence() {
        console.log('💾 Тест 5: Сохранение после перезагрузки...');
        
        try {
            // Ждем автосохранения
            await this.wait(3000);
            
            // Получаем классы перед перезагрузкой
            const classesBeforeReload = await this.page.evaluate(() => {
                const title = document.querySelector('h1.page-title');
                return title ? title.className : '';
            });
            
            console.log(`Классы перед перезагрузкой: ${classesBeforeReload}`);
            
            // Перезагружаем страницу
            await this.page.reload({ waitUntil: 'networkidle0' });
            await this.wait(2000);
            
            // Проверяем классы после перезагрузки
            const classesAfterReload = await this.page.evaluate(() => {
                const title = document.querySelector('h1.page-title');
                return title ? title.className : '';
            });
            
            console.log(`Классы после перезагрузки: ${classesAfterReload}`);
            
            this.addTest('Font Size Persistence', classesAfterReload.includes('font-size-32'), `Before: ${classesBeforeReload} | After: ${classesAfterReload}`);
            this.addTest('Alignment Persistence', classesAfterReload.includes('text-align-center'), `Before: ${classesBeforeReload} | After: ${classesAfterReload}`);
            
            // Проверяем содержимое БД
            const dbContent = await this.page.evaluate(async () => {
                try {
                    const response = await fetch('/api/content/pyramid');
                    const data = await response.json();
                    return data;
                } catch (error) {
                    return { error: error.message };
                }
            });
            
            this.addTest('Database Content Available', !!dbContent.success, `DB Response: ${JSON.stringify(dbContent).substring(0, 200)}...`);
            
        } catch (error) {
            this.addIssue('Persistence Error', error.message);
        }
    }

    addTest(name, passed, details) {
        this.results.tests.push({
            name,
            passed,
            details,
            timestamp: new Date().toISOString()
        });
        console.log(`${passed ? '✅' : '❌'} ${name}: ${details}`);
    }

    addIssue(category, description) {
        this.results.issues.push({
            category,
            description,
            timestamp: new Date().toISOString()
        });
        console.log(`⚠️ ${category}: ${description}`);
    }

    generateReport() {
        const totalTests = this.results.tests.length;
        const passedTests = this.results.tests.filter(t => t.passed).length;
        const failedTests = totalTests - passedTests;
        
        this.results.summary = {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
            issuesCount: this.results.issues.length
        };
        
        console.log('\n📊 ОТЧЕТ ПО АНАЛИЗУ СИСТЕМЫ ФОРМАТИРОВАНИЯ');
        console.log('='.repeat(50));
        console.log(`Всего тестов: ${totalTests}`);
        console.log(`Пройдено: ${passedTests}`);
        console.log(`Провалено: ${failedTests}`);
        console.log(`Успешность: ${this.results.summary.successRate}%`);
        console.log(`Обнаружено проблем: ${this.results.issues.length}`);
        
        if (this.results.issues.length > 0) {
            console.log('\n🚨 ОБНАРУЖЕННЫЕ ПРОБЛЕМЫ:');
            this.results.issues.forEach((issue, index) => {
                console.log(`${index + 1}. [${issue.category}] ${issue.description}`);
            });
        }
        
        console.log('\n📋 ДЕТАЛИ ТЕСТОВ:');
        this.results.tests.forEach((test, index) => {
            console.log(`${index + 1}. ${test.passed ? '✅' : '❌'} ${test.name}`);
            console.log(`   ${test.details}`);
        });
        
        const fs = require('fs');
        fs.writeFileSync('formatting-analysis-report.json', JSON.stringify(this.results, null, 2));
        console.log('\n💾 Отчет сохранен в formatting-analysis-report.json');
    }
}

const analyzer = new FormattingSystemAnalyzer();
analyzer.runFullAnalysis().then(() => {
    console.log('\n🎉 Анализ завершен!');
    process.exit(0);
}).catch(error => {
    console.error('💥 Ошибка анализа:', error);
    process.exit(1);
});
