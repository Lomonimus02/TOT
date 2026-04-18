// ===== SEO ПОМОЩНИК ДЛЯ СИСТЕМЫ БЛОКОВ ПАПИРУСА =====
// Автоматическая SEO-оптимизация контента при добавлении и редактировании блоков

/**
 * Класс для управления SEO-оптимизацией блоков
 */
class SEOHelper {
    constructor() {
        this.keywords = {
            primary: [
                'пирамида тота', 'таро', 'магия', 'египет', 'боги египта',
                'реинкарнация', 'арканы', 'судьба', 'будущее', 'чудо'
            ],
            secondary: [
                'душа', 'магический', 'волшебный', 'экстрасенсы', 'зодиак',
                'пирамида', 'проклятье', 'перерождение', 'заклятье', 'аура', 'чакры'
            ],
            additional: [
                'эзотерика', 'мистика', 'оккультизм', 'предсказание', 'гадание',
                'карты таро', 'древние знания', 'храм исиды', 'духовное развитие',
                'энергетика', 'медитация', 'астрология', 'нумерология', 'руны',
                'мантика', 'ясновидение', 'целительство', 'биоэнергетика',
                'кармическая астрология', 'женская магия', 'богиня исида',
                'жезлы фараонов', 'место силы', 'древний египет', 'тайны египта',
                'мистерии египта', 'древние ритуалы', 'экстрасенс', 'предсказание будущего',
                'гадание на таро', 'школа магии', 'обучение таро', 'семинары по магии',
                'духовные практики', 'энергия места силы', 'исцеление души',
                'материнство', 'женская сила', 'магические артефакты'
            ]
        };
        
        this.translitMap = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
            'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
            'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
            'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };
    }

    /**
     * Анализ текста на наличие ключевых слов
     */
    analyzeText(text) {
        if (!text || typeof text !== 'string') {
            return { score: 0, keywords: [], hasKeywords: false };
        }
        
        const lowerText = text.toLowerCase();
        const foundKeywords = [];
        let score = 0;
        
        // Проверяем основные ключевые слова (вес 3)
        this.keywords.primary.forEach(keyword => {
            if (lowerText.includes(keyword.toLowerCase())) {
                foundKeywords.push({ keyword, weight: 3, category: 'primary' });
                score += 3;
            }
        });
        
        // Проверяем вторичные ключевые слова (вес 2)
        this.keywords.secondary.forEach(keyword => {
            if (lowerText.includes(keyword.toLowerCase())) {
                foundKeywords.push({ keyword, weight: 2, category: 'secondary' });
                score += 2;
            }
        });
        
        // Проверяем дополнительные ключевые слова (вес 1)
        this.keywords.additional.forEach(keyword => {
            if (lowerText.includes(keyword.toLowerCase())) {
                foundKeywords.push({ keyword, weight: 1, category: 'additional' });
                score += 1;
            }
        });
        
        return {
            score,
            keywords: foundKeywords,
            hasKeywords: foundKeywords.length > 0,
            keywordCount: foundKeywords.length,
            primaryCount: foundKeywords.filter(k => k.category === 'primary').length,
            secondaryCount: foundKeywords.filter(k => k.category === 'secondary').length,
            additionalCount: foundKeywords.filter(k => k.category === 'additional').length
        };
    }

    /**
     * Генерация SEO-дружественного ID для заголовков
     */
    generateSEOId(text) {
        if (!text) return '';
        
        return text
            .toLowerCase()
            .split('')
            .map(char => this.translitMap[char] || char)
            .join('')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50);
    }

    /**
     * Добавление SEO-атрибутов к элементу
     */
    addSEOAttributes(element, blockType) {
        if (!element) return null;
        
        const textContent = element.textContent || element.innerText || '';
        const seoAnalysis = this.analyzeText(textContent);
        
        // Добавляем data-атрибуты для SEO
        element.dataset.seoOptimized = 'true';
        element.dataset.seoScore = seoAnalysis.score;
        
        if (seoAnalysis.hasKeywords) {
            element.dataset.seoKeywords = seoAnalysis.keywords.map(k => k.keyword).join(',');
        }
        
        // Для заголовков добавляем itemprop для микроразметки
        if (blockType === 'heading-h2' || blockType === 'heading-h3') {
            element.setAttribute('itemprop', 'headline');
            
            // Генерируем SEO-дружественный ID
            const seoId = this.generateSEOId(textContent);
            if (seoId) {
                element.id = seoId;
            }
            
            // Если заголовок содержит ключевые слова, добавляем дополнительные атрибуты
            if (seoAnalysis.hasKeywords) {
                element.setAttribute('data-seo-relevant', 'true');
            }
        }
        
        // Для параграфов добавляем itemprop
        if (blockType === 'paragraph') {
            element.setAttribute('itemprop', 'text');
            
            // Если текст содержит много ключевых слов, помечаем как важный
            if (seoAnalysis.score >= 5) {
                element.setAttribute('data-seo-important', 'true');
            }
        }
        
        // Для списков добавляем itemprop
        if (blockType === 'list') {
            element.setAttribute('itemscope', '');
            element.setAttribute('itemtype', 'https://schema.org/ItemList');
            
            // Добавляем itemprop к элементам списка
            const listItems = element.querySelectorAll('li');
            listItems.forEach((li, index) => {
                li.setAttribute('itemprop', 'itemListElement');
                li.setAttribute('itemscope', '');
                li.setAttribute('itemtype', 'https://schema.org/ListItem');
                li.dataset.position = index + 1;
            });
        }
        
        // Для цитат добавляем микроразметку
        if (blockType === 'quote') {
            element.setAttribute('itemscope', '');
            element.setAttribute('itemtype', 'https://schema.org/Quotation');
            
            const cite = element.querySelector('cite');
            if (cite) {
                cite.setAttribute('itemprop', 'author');
            }
        }
        
        return seoAnalysis;
    }

    /**
     * Обновление SEO-атрибутов при редактировании
     */
    updateSEOOnEdit(element) {
        if (!element) return;
        
        const blockElement = element.closest('.content-block');
        if (!blockElement) return;
        
        const blockType = blockElement.dataset.blockType;
        if (!blockType) return;
        
        // Находим основной элемент для обновления
        let targetElement = element;
        if (element.tagName !== 'H2' && element.tagName !== 'H3' && 
            element.tagName !== 'P' && element.tagName !== 'BLOCKQUOTE' &&
            element.tagName !== 'UL' && element.tagName !== 'OL') {
            targetElement = element.querySelector('h2, h3, p, blockquote, ul, ol');
        }
        
        if (!targetElement) return;
        
        // Обновляем SEO-атрибуты
        const seoAnalysis = this.addSEOAttributes(targetElement, blockType);
        
        // Логируем для отладки
        if (seoAnalysis && seoAnalysis.hasKeywords) {
        }
        
        return seoAnalysis;
    }

    /**
     * Получение рекомендаций по SEO для блока
     */
    getSEORecommendations(text, blockType) {
        const analysis = this.analyzeText(text);
        const recommendations = [];
        
        if (!analysis.hasKeywords) {
            recommendations.push({
                type: 'warning',
                message: 'Текст не содержит ключевых слов для SEO',
                suggestion: 'Добавьте релевантные ключевые слова: таро, магия, египет, реинкарнация, арканы'
            });
        } else if (analysis.score < 3) {
            recommendations.push({
                type: 'info',
                message: 'Низкая плотность ключевых слов',
                suggestion: 'Добавьте больше релевантных ключевых слов для улучшения SEO'
            });
        } else if (analysis.score >= 5) {
            recommendations.push({
                type: 'success',
                message: 'Отличная SEO-оптимизация!',
                suggestion: 'Контент хорошо оптимизирован для поисковых систем'
            });
        }
        
        // Рекомендации для заголовков
        if (blockType === 'heading-h2' || blockType === 'heading-h3') {
            if (text.length < 20) {
                recommendations.push({
                    type: 'info',
                    message: 'Заголовок слишком короткий',
                    suggestion: 'Рекомендуемая длина заголовка: 20-60 символов'
                });
            } else if (text.length > 60) {
                recommendations.push({
                    type: 'warning',
                    message: 'Заголовок слишком длинный',
                    suggestion: 'Сократите заголовок до 60 символов для лучшей читаемости'
                });
            }
        }
        
        // Рекомендации для параграфов
        if (blockType === 'paragraph') {
            if (text.length < 50) {
                recommendations.push({
                    type: 'info',
                    message: 'Текст слишком короткий',
                    suggestion: 'Добавьте больше информативного контента (минимум 100 символов)'
                });
            }
        }
        
        return {
            analysis,
            recommendations,
            overallScore: this.calculateOverallScore(analysis, blockType)
        };
    }

    /**
     * Расчет общего SEO-балла
     */
    calculateOverallScore(analysis, blockType) {
        let score = 0;
        
        // Базовый балл за ключевые слова
        score += Math.min(analysis.score * 10, 50);
        
        // Бонус за основные ключевые слова
        score += analysis.primaryCount * 10;
        
        // Бонус за разнообразие ключевых слов
        if (analysis.primaryCount > 0 && analysis.secondaryCount > 0) {
            score += 10;
        }
        
        // Бонус для заголовков с ключевыми словами
        if ((blockType === 'heading-h2' || blockType === 'heading-h3') && analysis.hasKeywords) {
            score += 20;
        }
        
        return Math.min(score, 100);
    }

    /**
     * Показать SEO-индикатор для блока
     */
    showSEOIndicator(blockElement, analysis) {
        // Удаляем старый индикатор, если есть
        const oldIndicator = blockElement.querySelector('.seo-indicator');
        if (oldIndicator) {
            oldIndicator.remove();
        }
        
        // Создаем новый индикатор
        const indicator = document.createElement('div');
        indicator.className = 'seo-indicator';
        indicator.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
        `;
        
        if (analysis.score >= 5) {
            indicator.style.background = '#4CAF50';
            indicator.style.color = 'white';
            indicator.textContent = `SEO: ${analysis.score} ✓`;
        } else if (analysis.score >= 2) {
            indicator.style.background = '#FF9800';
            indicator.style.color = 'white';
            indicator.textContent = `SEO: ${analysis.score}`;
        } else {
            indicator.style.background = '#f44336';
            indicator.style.color = 'white';
            indicator.textContent = 'SEO: 0';
        }
        
        blockElement.style.position = 'relative';
        blockElement.appendChild(indicator);
        
        // Автоматически скрываем через 3 секунды
        setTimeout(() => {
            indicator.style.opacity = '0';
            indicator.style.transition = 'opacity 0.3s';
            setTimeout(() => indicator.remove(), 300);
        }, 3000);
    }
}

// Создаем глобальный экземпляр
window.seoHelper = new SEOHelper();

// Экспортируем для совместимости со старым кодом
window.analyzeTextForSEO = (text) => window.seoHelper.analyzeText(text);
window.generateSEOFriendlyId = (text) => window.seoHelper.generateSEOId(text);
window.addSEOAttributes = (element, blockType) => window.seoHelper.addSEOAttributes(element, blockType);
window.updateSEOOnEdit = (element) => window.seoHelper.updateSEOOnEdit(element);


