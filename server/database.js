// Модуль для работы с базой данных SQLite
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'content.db');
        this.db = null;
        this.init();
    }

    init() {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('Ошибка подключения к базе данных:', err.message);
            } else {
                console.log('Подключение к SQLite базе данных установлено');
                this.createTables();
            }
        });
    }

    createTables() {
        // Расширенная таблица для хранения контента страниц и блоков
        const createPagesTable = `
            CREATE TABLE IF NOT EXISTS page_content (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page_id TEXT NOT NULL,
                element_id TEXT NOT NULL,
                element_type TEXT NOT NULL,
                content TEXT NOT NULL,
                selector TEXT,
                position_index INTEGER DEFAULT 0,

                -- Новые поля для полного сохранения блоков
                block_type TEXT,                    -- Тип блока из библиотеки (heading-h2, paragraph, etc.)
                block_category TEXT,                -- Категория блока (text, media, structure)
                block_metadata TEXT,                -- JSON с дополнительными параметрами блока
                parent_block_id TEXT,               -- ID родительского блока для вложенных структур
                css_styles TEXT,                    -- Inline CSS стили блока
                css_classes TEXT,                   -- CSS классы блока

                -- Поля для позиционирования
                container_selector TEXT,            -- Селектор контейнера, где размещен блок
                before_element_id TEXT,             -- ID элемента, перед которым размещен блок
                after_element_id TEXT,              -- ID элемента, после которого размещен блок

                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(page_id, element_id)
            )
        `;

        // Таблица для версионирования изменений
        const createVersionsTable = `
            CREATE TABLE IF NOT EXISTS content_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page_id TEXT NOT NULL,
                element_id TEXT NOT NULL,
                content TEXT NOT NULL,
                user_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Таблица для настроек страниц
        const createPageSettingsTable = `
            CREATE TABLE IF NOT EXISTS page_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page_id TEXT UNIQUE NOT NULL,
                title TEXT,
                subtitle TEXT,
                meta_description TEXT,
                meta_keywords TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        this.db.run(createPagesTable, (err) => {
            if (err) console.error('Ошибка создания таблицы page_content:', err);
        });

        this.db.run(createVersionsTable, (err) => {
            if (err) console.error('Ошибка создания таблицы content_versions:', err);
        });

        this.db.run(createPageSettingsTable, (err) => {
            if (err) console.error('Ошибка создания таблицы page_settings:', err);
        });
    }

    // Сохранение или обновление контента элемента (расширенная версия для блоков)
    async saveContent(pageId, elementId, elementType, content, selector, userId = null, blockData = {}) {
        return new Promise((resolve, reject) => {
            // Сначала сохраняем версию в историю
            this.saveVersion(pageId, elementId, content, userId);

            // Подготавливаем данные блока
            const {
                blockType = null,
                blockCategory = null,
                blockMetadata = null,
                parentBlockId = null,
                cssStyles = null,
                cssClasses = null,
                containerSelector = null,
                beforeElementId = null,
                afterElementId = null,
                positionIndex = 0
            } = blockData;

            // Затем обновляем или создаем основную запись с расширенными полями
            const query = `
                INSERT OR REPLACE INTO page_content
                (page_id, element_id, element_type, content, selector, position_index,
                 block_type, block_category, block_metadata, parent_block_id,
                 css_styles, css_classes, container_selector, before_element_id,
                 after_element_id, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `;

            const params = [
                pageId, elementId, elementType, content, selector, positionIndex,
                blockType, blockCategory,
                blockMetadata ? JSON.stringify(blockMetadata) : null,
                parentBlockId, cssStyles, cssClasses, containerSelector,
                beforeElementId, afterElementId
            ];

            this.db.run(query, params, function(err) {
                if (err) {
                    console.error('Ошибка сохранения контента:', err);
                    reject(err);
                } else {
                    console.log(`Контент сохранен: ${pageId}/${elementId}`, blockData.blockType ? `(блок: ${blockData.blockType})` : '');
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Специальный метод для сохранения блоков папируса
    async saveBlock(pageId, blockData, userId = null) {
        const {
            elementId,
            blockType,
            blockCategory,
            content,
            selector,
            positionIndex = 0,
            metadata = {},
            parentBlockId = null,
            cssStyles = null,
            cssClasses = null,
            containerSelector = '.page-content',
            beforeElementId = null,
            afterElementId = null
        } = blockData;

        const blockInfo = {
            blockType,
            blockCategory,
            blockMetadata: metadata,
            parentBlockId,
            cssStyles,
            cssClasses,
            containerSelector,
            beforeElementId,
            afterElementId,
            positionIndex
        };

        return this.saveContent(
            pageId,
            elementId,
            `block_${blockType}`,
            content,
            selector,
            userId,
            blockInfo
        );
    }

    // Сохранение версии в историю
    saveVersion(pageId, elementId, content, userId = null) {
        const query = `
            INSERT INTO content_versions (page_id, element_id, content, user_id)
            VALUES (?, ?, ?, ?)
        `;

        this.db.run(query, [pageId, elementId, content, userId], (err) => {
            if (err) {
                console.error('Ошибка сохранения версии:', err);
            }
        });
    }

    // Получение контента страницы с полной информацией о блоках
    async getPageContent(pageId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM page_content
                WHERE page_id = ?
                ORDER BY position_index ASC, created_at ASC
            `;

            this.db.all(query, [pageId], (err, rows) => {
                if (err) {
                    console.error('Ошибка получения контента:', err);
                    reject(err);
                } else {
                    // Обрабатываем JSON поля
                    const processedRows = rows.map(row => {
                        if (row.block_metadata) {
                            try {
                                row.block_metadata = JSON.parse(row.block_metadata);
                            } catch (e) {
                                console.warn('Ошибка парсинга block_metadata:', e);
                                row.block_metadata = {};
                            }
                        }
                        return row;
                    });
                    resolve(processedRows);
                }
            });
        });
    }

    // Получение только блоков папируса (исключая обычные элементы)
    async getPageBlocks(pageId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM page_content
                WHERE page_id = ? AND block_type IS NOT NULL
                ORDER BY position_index ASC, created_at ASC
            `;

            this.db.all(query, [pageId], (err, rows) => {
                if (err) {
                    console.error('Ошибка получения блоков:', err);
                    reject(err);
                } else {
                    // Обрабатываем JSON поля
                    const processedRows = rows.map(row => {
                        if (row.block_metadata) {
                            try {
                                row.block_metadata = JSON.parse(row.block_metadata);
                            } catch (e) {
                                console.warn('Ошибка парсинга block_metadata:', e);
                                row.block_metadata = {};
                            }
                        }
                        return row;
                    });
                    resolve(processedRows);
                }
            });
        });
    }

    // Получение конкретного элемента
    async getElement(pageId, elementId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM page_content
                WHERE page_id = ? AND element_id = ?
                LIMIT 1
            `;

            this.db.get(query, [pageId, elementId], (err, row) => {
                if (err) {
                    console.error('Ошибка получения элемента:', err);
                    reject(err);
                } else {
                    // Обрабатываем JSON поля
                    if (row && row.block_metadata) {
                        try {
                            row.block_metadata = JSON.parse(row.block_metadata);
                        } catch (e) {
                            console.warn('Ошибка парсинга block_metadata:', e);
                            row.block_metadata = {};
                        }
                    }
                    resolve(row || null);
                }
            });
        });
    }

    // Удаление элемента
    async deleteElement(pageId, elementId) {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM page_content WHERE page_id = ? AND element_id = ?`;

            this.db.run(query, [pageId, elementId], function(err) {
                if (err) {
                    console.error('Ошибка удаления элемента:', err);
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Получение истории изменений
    async getContentHistory(pageId, elementId = null, limit = 50) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT * FROM content_versions 
                WHERE page_id = ?
            `;
            let params = [pageId];

            if (elementId) {
                query += ` AND element_id = ?`;
                params.push(elementId);
            }

            query += ` ORDER BY created_at DESC LIMIT ?`;
            params.push(limit);

            this.db.all(query, params, (err, rows) => {
                if (err) {
                    console.error('Ошибка получения истории:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Сохранение настроек страницы
    async savePageSettings(pageId, settings) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR REPLACE INTO page_settings 
                (page_id, title, subtitle, meta_description, meta_keywords, updated_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `;

            const { title, subtitle, meta_description, meta_keywords } = settings;

            this.db.run(query, [pageId, title, subtitle, meta_description, meta_keywords], function(err) {
                if (err) {
                    console.error('Ошибка сохранения настроек страницы:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });
        });
    }

    // Получение настроек страницы
    async getPageSettings(pageId) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM page_settings WHERE page_id = ?`;

            this.db.get(query, [pageId], (err, row) => {
                if (err) {
                    console.error('Ошибка получения настроек страницы:', err);
                    reject(err);
                } else {
                    resolve(row || {});
                }
            });
        });
    }

    // Поиск контента по ключевому слову (только в базе данных)
    async searchContent(query, limit = 20) {
        return new Promise((resolve, reject) => {
            try {
                // Список доступных для пользователей страниц
                const allowedPages = [
                    'index',
                    'home',
                    'pyramid',
                    'temple',
                    'complex',
                    'court',
                    'forum',
                    'news',
                    'programs',
                    'seminars',
                    'school-tota',
                    'school-isais',
                    'rods',
                    'visit',
                    'recordings',
                    'consultations'
                ];

                const searchQuery = `%${query}%`;
                const sql = `
                    SELECT DISTINCT
                        page_id,
                        element_id,
                        content,
                        block_type,
                        created_at,
                        LENGTH(content) as content_length
                    FROM page_content
                    WHERE content LIKE ? AND page_id IN (${allowedPages.map(() => '?').join(',')})
                    ORDER BY
                        CASE
                            WHEN content LIKE ? THEN 1
                            WHEN content LIKE ? THEN 2
                            ELSE 3
                        END,
                        LENGTH(content) ASC,
                        created_at DESC
                    LIMIT ?
                `;

                // Поиск: точное совпадение в начале (вес 1), совпадение в слове (вес 2), любое совпадение (вес 3)
                const params = [
                    searchQuery,
                    ...allowedPages,       // Добавляем список доступных страниц
                    query + '%',           // Начинается с query
                    '% ' + query + '%',    // query в начале слова
                    limit
                ];

                this.db.all(sql, params, (err, rows) => {
                    if (err) {
                        console.error('Ошибка поиска контента:', err);
                        // Возвращаем пустой массив вместо ошибки
                        resolve([]);
                    } else {
                        // Группируем результаты по страницам и добавляем контекст
                        const results = (rows || []).map(row => {
                            try {
                                // Извлекаем фрагмент контекста
                                const contentStr = String(row.content || '');
                                const contentIndex = contentStr.toLowerCase().indexOf(query.toLowerCase());
                                let contextStart = Math.max(0, contentIndex - 50);
                                let contextEnd = Math.min(contentStr.length, contentIndex + query.length + 50);
                                let context = contentStr.substring(contextStart, contextEnd).trim();
                                
                                if (contextStart > 0) context = '...' + context;
                                if (contextEnd < contentStr.length) context = context + '...';

                                return {
                                    page_id: row.page_id,
                                    element_id: row.element_id,
                                    block_type: row.block_type,
                                    context: context,
                                    full_content: row.content,
                                    created_at: row.created_at,
                                    source: 'database'
                                };
                            } catch (mapErr) {
                                console.error('Ошибка обработки результата поиска:', mapErr);
                                return null;
                            }
                        }).filter(item => item !== null);

                        resolve(results);
                    }
                });
            } catch (err) {
                console.error('Ошибка в методе searchContent:', err);
                resolve([]);
            }
        });
    }

    // Поиск контента в HTML файлах
    async searchInHtmlFiles(query, limit = 20) {
        const fs = require('fs').promises;
        const cheerio = require('cheerio');
        
        try {
            const results = [];
            const pagesDir = path.join(__dirname, '..', 'pages');
            const indexFile = path.join(__dirname, '..', 'index.html');
            
            // Список всех HTML файлов для поиска
            const filesToSearch = [
                { path: indexFile, pageId: 'index' }
            ];
            
            // Добавляем файлы из папки pages
            try {
                const pageFiles = await fs.readdir(pagesDir);
                pageFiles.forEach(file => {
                    if (file.endsWith('.html') && file !== 'template.html') {
                        filesToSearch.push({
                            path: path.join(pagesDir, file),
                            pageId: file.replace('.html', '')
                        });
                    }
                });
            } catch (err) {
                console.error('Ошибка чтения папки pages:', err);
            }
            
            // Поиск в каждом файле
            for (const file of filesToSearch) {
                try {
                    const html = await fs.readFile(file.path, 'utf-8');
                    const $ = cheerio.load(html);
                    
                    // Удаляем скрипты и стили
                    $('script, style, noscript').remove();
                    
                    // Ищем в различных элементах
                    const searchableElements = [
                        { selector: 'title', weight: 1 },
                        { selector: 'h1, h2, h3', weight: 2 },
                        { selector: 'meta[name="description"]', attr: 'content', weight: 3 },
                        { selector: 'meta[name="keywords"]', attr: 'content', weight: 4 },
                        { selector: 'p, div, span, li, td, th', weight: 5 }
                    ];
                    
                    for (const { selector, attr, weight } of searchableElements) {
                        $(selector).each((i, elem) => {
                            const text = attr ? $(elem).attr(attr) : $(elem).text();
                            if (!text) return;
                            
                            const cleanText = text.trim().replace(/\s+/g, ' ');
                            const lowerText = cleanText.toLowerCase();
                            const lowerQuery = query.toLowerCase();
                            
                            if (lowerText.includes(lowerQuery)) {
                                const index = lowerText.indexOf(lowerQuery);
                                let contextStart = Math.max(0, index - 50);
                                let contextEnd = Math.min(cleanText.length, index + query.length + 50);
                                let context = cleanText.substring(contextStart, contextEnd).trim();
                                
                                if (contextStart > 0) context = '...' + context;
                                if (contextEnd < cleanText.length) context = context + '...';
                                
                                results.push({
                                    page_id: file.pageId,
                                    element_id: `html_${selector.replace(/[^a-z0-9]/gi, '_')}_${i}`,
                                    block_type: selector.split(',')[0].trim(),
                                    context: context,
                                    full_content: cleanText.substring(0, 500),
                                    weight: weight,
                                    source: 'html'
                                });
                                
                                // Ограничиваем количество результатов с одной страницы
                                if (results.filter(r => r.page_id === file.pageId).length >= 3) {
                                    return false; // break из each
                                }
                            }
                        });
                    }
                } catch (err) {
                    console.error(`Ошибка поиска в файле ${file.path}:`, err);
                }
            }
            
            // Сортируем по весу и ограничиваем количество
            results.sort((a, b) => a.weight - b.weight);
            return results.slice(0, limit);
            
        } catch (err) {
            console.error('Ошибка поиска в HTML файлах:', err);
            return [];
        }
    }

    // Комбинированный поиск (ТОЛЬКО база данных - контент, добавленный администратором)
    async searchAll(query, limit = 20) {
        try {
            // Поиск ТОЛЬКО в базе данных (page_content и content_changes)
            // Это гарантирует, что ищем только контент, добавленный администратором
            const dbResults = await this.searchContent(query, limit);

            // Возвращаем только результаты из БД
            // HTML файлы НЕ ищутся, так как они содержат служебный контент и скрытые элементы
            return dbResults.slice(0, limit);
            
        } catch (err) {
            console.error('Ошибка комбинированного поиска:', err);
            return [];
        }
    }

    // Закрытие соединения с базой данных
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Ошибка закрытия базы данных:', err);
                } else {
                    console.log('Соединение с базой данных закрыто');
                }
            });
        }
    }
}

module.exports = Database;
