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
