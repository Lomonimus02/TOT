// API сервер для inline редактора
const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('./database');

const app = express();
const db = new Database();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..')));

// Middleware для проверки авторизации
const checkAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    // Простая проверка токена (в реальном проекте нужна более сложная логика)
    const token = authHeader.substring(7);
    if (token === 'admin_token_123') {
        req.user = { id: 'admin', role: 'admin' };
        next();
    } else {
        res.status(403).json({ error: 'Недостаточно прав' });
    }
};

// API Routes

// Сохранение контента элемента (обновленная версия с поддержкой блоков)
app.post('/api/content/save', checkAuth, async (req, res) => {
    try {
        const {
            page_id,
            element_id,
            element_type,
            content,
            selector,
            // Новые поля для блоков
            block_data = {}
        } = req.body;

        if (!page_id || !element_id || !content) {
            return res.status(400).json({
                error: 'Отсутствуют обязательные поля: page_id, element_id, content'
            });
        }

        const result = await db.saveContent(
            page_id,
            element_id,
            element_type || 'text',
            content,
            selector,
            req.user.id,
            block_data
        );

        res.json({
            success: true,
            message: 'Контент сохранен',
            data: result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Ошибка сохранения контента:', error);
        res.status(500).json({
            error: 'Ошибка сервера при сохранении контента',
            details: error.message
        });
    }
});

// Специальный endpoint для сохранения блоков папируса
app.post('/api/blocks/save', async (req, res) => {
    try {
        const { page_id, block_data } = req.body;

        if (!page_id || !block_data || !block_data.elementId || !block_data.blockType) {
            return res.status(400).json({
                error: 'Отсутствуют обязательные поля: page_id, block_data.elementId, block_data.blockType'
            });
        }

        const result = await db.saveBlock(page_id, block_data, 'admin');

        res.json({
            success: true,
            message: 'Блок сохранен',
            data: result,
            block_type: block_data.blockType,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Ошибка сохранения блока:', error);
        res.status(500).json({
            error: 'Ошибка сервера при сохранении блока',
            details: error.message
        });
    }
});

// Получение контента страницы
app.get('/api/content/:pageId', async (req, res) => {
    try {
        const { pageId } = req.params;
        const content = await db.getPageContent(pageId);

        res.json({
            success: true,
            data: content,
            page_id: pageId
        });

    } catch (error) {
        console.error('Ошибка получения контента:', error);
        res.status(500).json({
            error: 'Ошибка сервера при получении контента',
            details: error.message
        });
    }
});

// Получение только блоков папируса для страницы
app.get('/api/blocks/:pageId', async (req, res) => {
    try {
        const { pageId } = req.params;
        const blocks = await db.getPageBlocks(pageId);

        res.json({
            success: true,
            data: blocks,
            page_id: pageId,
            blocks_count: blocks.length
        });

    } catch (error) {
        console.error('Ошибка получения блоков:', error);
        res.status(500).json({
            error: 'Ошибка сервера при получении блоков',
            details: error.message
        });
    }
});

// Удаление элемента
app.delete('/api/content/:pageId/:elementId', checkAuth, async (req, res) => {
    try {
        const { pageId, elementId } = req.params;
        const result = await db.deleteElement(pageId, elementId);
        
        res.json({ 
            success: true, 
            message: 'Элемент удален',
            data: result
        });

    } catch (error) {
        console.error('Ошибка удаления элемента:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера при удалении элемента',
            details: error.message 
        });
    }
});

// Получение истории изменений
app.get('/api/content/:pageId/history', checkAuth, async (req, res) => {
    try {
        const { pageId } = req.params;
        const { element_id, limit } = req.query;
        
        const history = await db.getContentHistory(
            pageId, 
            element_id || null, 
            parseInt(limit) || 50
        );
        
        res.json({ 
            success: true, 
            data: history,
            page_id: pageId
        });

    } catch (error) {
        console.error('Ошибка получения истории:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера при получении истории',
            details: error.message 
        });
    }
});

// Сохранение настроек страницы
app.post('/api/page-settings/:pageId', checkAuth, async (req, res) => {
    try {
        const { pageId } = req.params;
        const settings = req.body;
        
        const result = await db.savePageSettings(pageId, settings);
        
        res.json({ 
            success: true, 
            message: 'Настройки страницы сохранены',
            data: result
        });

    } catch (error) {
        console.error('Ошибка сохранения настроек:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера при сохранении настроек',
            details: error.message 
        });
    }
});

// Получение настроек страницы
app.get('/api/page-settings/:pageId', async (req, res) => {
    try {
        const { pageId } = req.params;
        const settings = await db.getPageSettings(pageId);
        
        res.json({ 
            success: true, 
            data: settings,
            page_id: pageId
        });

    } catch (error) {
        console.error('Ошибка получения настроек:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера при получении настроек',
            details: error.message 
        });
    }
});

// Batch операции для сохранения нескольких элементов
app.post('/api/content/batch-save', checkAuth, async (req, res) => {
    try {
        const { changes } = req.body;
        
        if (!Array.isArray(changes)) {
            return res.status(400).json({ 
                error: 'Поле changes должно быть массивом' 
            });
        }

        const results = [];
        
        for (const change of changes) {
            const { page_id, element_id, element_type, content, selector } = change;
            
            if (page_id && element_id && content) {
                try {
                    const result = await db.saveContent(
                        page_id, 
                        element_id, 
                        element_type || 'text', 
                        content, 
                        selector,
                        req.user.id
                    );
                    results.push({ element_id, success: true, data: result });
                } catch (error) {
                    results.push({ element_id, success: false, error: error.message });
                }
            } else {
                results.push({ 
                    element_id: element_id || 'unknown', 
                    success: false, 
                    error: 'Отсутствуют обязательные поля' 
                });
            }
        }

        res.json({ 
            success: true, 
            message: `Обработано ${changes.length} изменений`,
            results: results,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Ошибка batch сохранения:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера при batch сохранении',
            details: error.message 
        });
    }
});

// Проверка состояния сервера
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Необработанная ошибка:', err);
    res.status(500).json({ 
        error: 'Внутренняя ошибка сервера',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 для неизвестных маршрутов
app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`API сервер запущен на порту ${PORT}`);
    console.log(`Доступен по адресу: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Получен сигнал SIGINT, закрываем сервер...');
    db.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Получен сигнал SIGTERM, закрываем сервер...');
    db.close();
    process.exit(0);
});

module.exports = app;
