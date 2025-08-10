// Серверная часть для сайта "Пирамида ТОТА" с интеграцией Neon PostgreSQL
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const cheerio = require('cheerio');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка подключения к Neon PostgreSQL
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_mE67QfaoVbGj@ep-rough-term-a92qmgeu-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: {
        rejectUnauthorized: false
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Перенесено ниже после htmlMiddleware, чтобы HTML обрабатывался Cheerio перед отдачей
// app.use(express.static('.'));

// JWT секретный ключ
const JWT_SECRET = process.env.JWT_SECRET || 'pyramid_tota_secret_key_2025';

// Настройка multer для загрузки изображений
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'images', 'uploads');
        // Создаем папку если её нет
        fs.mkdir(uploadDir, { recursive: true }).then(() => {
            cb(null, uploadDir);
        }).catch(err => {
            console.error('Ошибка создания папки uploads:', err);
            cb(err);
        });
    },
    filename: function (req, file, cb) {
        // Генерируем уникальное имя файла
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'image-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB максимум
    },
    fileFilter: function (req, file, cb) {
        // Проверяем тип файла
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Разрешены только изображения'));
        }
    }
});

// Инициализация базы данных
async function initDatabase() {
    try {
        // Создание таблицы пользователей
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Создание таблицы контактных форм
        await pool.query(`
            CREATE TABLE IF NOT EXISTS contact_forms (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                message TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'new',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Создание таблицы подписок
        await pool.query(`
            CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
                id SERIAL PRIMARY KEY,
                email VARCHAR(100) UNIQUE NOT NULL,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Создание таблицы записей на программы
        await pool.query(`
            CREATE TABLE IF NOT EXISTS program_bookings (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                program VARCHAR(100) NOT NULL,
                date DATE,
                message TEXT,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Создание таблицы контента (для админ-панели)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS content_pages (
                id SERIAL PRIMARY KEY,
                page_name VARCHAR(100) UNIQUE NOT NULL,
                title VARCHAR(200),
                content TEXT,
                meta_description TEXT,
                updated_by INTEGER REFERENCES users(id),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Создание таблицы для хранения изменений элементов
        await pool.query(`
            CREATE TABLE IF NOT EXISTS content_changes (
                id SERIAL PRIMARY KEY,
                page_id VARCHAR(100) NOT NULL,
                element_id VARCHAR(100) NOT NULL,
                element_type VARCHAR(50),
                content TEXT,
                selector TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(page_id, element_id)
            )
        `);

        // Создание новой таблицы для CSS-классов форматирования (future-proof архитектура)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS element_formatting (
                id SERIAL PRIMARY KEY,
                page_id VARCHAR(100) NOT NULL,
                element_id VARCHAR(100) NOT NULL,
                css_classes TEXT[] DEFAULT '{}',
                font_size VARCHAR(20),
                text_color VARCHAR(50),
                text_align VARCHAR(20),
                font_weight VARCHAR(20),
                font_style VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(page_id, element_id)
            )
        `);

        console.log('База данных инициализирована успешно');
    } catch (error) {
        console.error('Ошибка инициализации базы данных:', error);
    }
}

// Middleware для проверки JWT токена
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Токен доступа отсутствует' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
}

// API маршруты

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Проверка существования пользователя
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }

        // Хеширование пароля
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Создание пользователя
        const result = await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, role',
            [name, email, hashedPassword]
        );

        const user = result.rows[0];
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            message: 'Пользователь успешно зарегистрирован',
            user: user,
            token: token
        });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Авторизация пользователя
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Попытка авторизации:', { email, password: '***' });

        // Поиск пользователя
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        console.log('Найдено пользователей:', result.rows.length);

        if (result.rows.length === 0) {
            console.log('Пользователь не найден');
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const user = result.rows[0];
        console.log('Найден пользователь:', { id: user.id, email: user.email, role: user.role });

        // Проверка пароля
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('Пароль корректен:', isValidPassword);

        if (!isValidPassword) {
            console.log('Неверный пароль');
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        // Создание JWT токена
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Авторизация успешна, токен создан');

        res.json({
            message: 'Успешная авторизация',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token: token
        });
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Отправка контактной формы
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        const result = await pool.query(
            'INSERT INTO contact_forms (name, email, phone, message) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, email, phone, message]
        );

        // Здесь можно добавить отправку в Telegram
        await sendToTelegram('contact', { name, email, phone, message });

        res.status(201).json({
            message: 'Сообщение успешно отправлено',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Ошибка отправки контактной формы:', error);
        res.status(500).json({ error: 'Ошибка отправки сообщения' });
    }
});

// Подписка на рассылку
app.post('/api/newsletter', async (req, res) => {
    try {
        const { email } = req.body;

        const result = await pool.query(
            'INSERT INTO newsletter_subscriptions (email) VALUES ($1) ON CONFLICT (email) DO NOTHING RETURNING *',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Email уже подписан на рассылку' });
        }

        await sendToTelegram('newsletter', { email });

        res.status(201).json({
            message: 'Подписка оформлена успешно',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Ошибка подписки:', error);
        res.status(500).json({ error: 'Ошибка оформления подписки' });
    }
});

// Запись на программу
app.post('/api/booking', async (req, res) => {
    try {
        const { name, email, phone, program, date, message } = req.body;

        const result = await pool.query(
            'INSERT INTO program_bookings (name, email, phone, program, date, message) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, email, phone, program, date, message]
        );

        await sendToTelegram('booking', { name, email, phone, program, date, message });

        res.status(201).json({
            message: 'Запись успешно оформлена',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Ошибка записи на программу:', error);
        res.status(500).json({ error: 'Ошибка оформления записи' });
    }
});

// Получение профиля пользователя
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка получения профиля:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Middleware для проверки прав администратора
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Требуются права администратора' });
    }
    next();
}

// API для админ-панели

// Статистика
app.get('/api/admin/contacts/count', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) as count FROM contact_forms');
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error('Ошибка получения статистики контактов:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.get('/api/admin/bookings/count', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) as count FROM program_bookings');
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error('Ошибка получения статистики записей:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.get('/api/admin/subscribers/count', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) as count FROM newsletter_subscriptions');
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error('Ошибка получения статистики подписчиков:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.get('/api/admin/users/count', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) as count FROM users');
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error('Ошибка получения статистики пользователей:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение данных для таблиц
app.get('/api/admin/contacts', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM contact_forms ORDER BY created_at DESC LIMIT 100'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения контактов:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.get('/api/admin/bookings', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM program_bookings ORDER BY created_at DESC LIMIT 100'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения записей:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.get('/api/admin/subscribers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM newsletter_subscriptions ORDER BY created_at DESC LIMIT 100'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения подписчиков:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 100'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения пользователей:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Обновление статуса записей
app.put('/api/admin/contacts/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await pool.query(
            'UPDATE contact_forms SET status = $1 WHERE id = $2',
            [status, id]
        );

        res.json({ message: 'Статус обновлен' });
    } catch (error) {
        console.error('Ошибка обновления статуса контакта:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.put('/api/admin/bookings/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await pool.query(
            'UPDATE program_bookings SET status = $1 WHERE id = $2',
            [status, id]
        );

        res.json({ message: 'Статус обновлен' });
    } catch (error) {
        console.error('Ошибка обновления статуса записи:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Удаление записей
app.delete('/api/admin/contacts/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM contact_forms WHERE id = $1', [id]);
        res.json({ message: 'Контакт удален' });
    } catch (error) {
        console.error('Ошибка удаления контакта:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.delete('/api/admin/bookings/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM program_bookings WHERE id = $1', [id]);
        res.json({ message: 'Запись удалена' });
    } catch (error) {
        console.error('Ошибка удаления записи:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.delete('/api/admin/subscribers/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM newsletter_subscriptions WHERE id = $1', [id]);
        res.json({ message: 'Подписчик удален' });
    } catch (error) {
        console.error('Ошибка удаления подписчика:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Нельзя удалить самого себя
        if (parseInt(id) === req.user.userId) {
            return res.status(400).json({ error: 'Нельзя удалить самого себя' });
        }

        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'Пользователь удален' });
    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Изменение роли пользователя
app.put('/api/admin/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Нельзя изменить роль самому себе
        if (parseInt(id) === req.user.userId) {
            return res.status(400).json({ error: 'Нельзя изменить роль самому себе' });
        }

        await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2',
            [role, id]
        );

        res.json({ message: 'Роль пользователя обновлена' });
    } catch (error) {
        console.error('Ошибка изменения роли:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Функция отправки в Telegram
async function sendToTelegram(type, data) {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN';
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID';

    if (TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN') {
        console.log('Telegram не настроен, сообщение сохранено в БД:', type, data);
        return;
    }

    let message = '';
    
    switch (type) {
        case 'contact':
            message = `🔔 Новое сообщение с сайта "Пирамида ТОТА"\n\n` +
                     `👤 Имя: ${data.name}\n` +
                     `📧 Email: ${data.email}\n` +
                     `📱 Телефон: ${data.phone || 'Не указан'}\n` +
                     `💬 Сообщение: ${data.message}`;
            break;
        case 'newsletter':
            message = `📬 Новая подписка на рассылку\n\n📧 Email: ${data.email}`;
            break;
        case 'booking':
            message = `📅 Новая запись на программу\n\n` +
                     `👤 Имя: ${data.name}\n` +
                     `📧 Email: ${data.email}\n` +
                     `📱 Телефон: ${data.phone || 'Не указан'}\n` +
                     `🎯 Программа: ${data.program}\n` +
                     `📅 Дата: ${data.date || 'Не указана'}\n` +
                     `💬 Сообщение: ${data.message || 'Нет'}`;
            break;
    }

    try {
        const fetch = (await import('node-fetch')).default;
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch (error) {
        console.error('Ошибка отправки в Telegram:', error);
    }
}

// Отладочный endpoint для проверки пользователей
app.get('/api/debug/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения пользователей:', error);
        res.status(500).json({ error: 'Ошибка базы данных' });
    }
});

// API для работы с контентом страниц

// Получить контент страницы
app.get('/api/content/:pageId', async (req, res) => {
    console.log('GET /api/content/' + req.params.pageId + ' - получен запрос');
    try {
        const { pageId } = req.params;
        const result = await pool.query(
            'SELECT * FROM content_changes WHERE page_id = $1',
            [pageId]
        );

        if (result.rows.length > 0) {
            // Преобразуем в формат, ожидаемый фронтендом
            const changes = {};
            result.rows.forEach(row => {
                changes[row.element_id] = {
                    element_type: row.element_type,
                    content: row.content,
                    selector: row.selector,
                    updated_at: row.updated_at
                };
            });

            res.json({
                success: true,
                data: { changes }
            });
        } else {
            res.json({
                success: false,
                message: 'Page not found'
            });
        }
    } catch (error) {
        console.error('Error reading content:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Сохранить изменение
app.post('/api/content/save', async (req, res) => {
    console.log('POST /api/content/save - получен запрос:', req.body);
    try {
        const { page_id, element_id, element_type, content, selector } = req.body;

        if (!page_id || !element_id) {
            return res.status(400).json({
                success: false,
                error: 'page_id and element_id are required'
            });
        }

        // Используем UPSERT (INSERT ... ON CONFLICT)
        const result = await pool.query(`
            INSERT INTO content_changes (page_id, element_id, element_type, content, selector, updated_at)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            ON CONFLICT (page_id, element_id)
            DO UPDATE SET
                element_type = EXCLUDED.element_type,
                content = EXCLUDED.content,
                selector = EXCLUDED.selector,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [page_id, element_id, element_type, content, selector]);

        res.json({
            success: true,
            message: 'Content saved successfully',
            data: {
                page_id,
                element_id,
                saved_at: result.rows[0].updated_at
            }
        });

    } catch (error) {
        console.error('Error saving content:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Batch сохранение
app.post('/api/content/batch-save', async (req, res) => {
    console.log('POST /api/content/batch-save - получен запрос:', req.body);
    try {
        const { changes } = req.body;

        if (!Array.isArray(changes)) {
            return res.status(400).json({
                success: false,
                error: 'changes must be an array'
            });
        }

        const savedChanges = [];

        // Используем транзакцию для batch операции
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            for (const change of changes) {
                const { page_id, element_id, element_type, content, selector } = change;

                if (!page_id || !element_id) {
                    continue; // Пропускаем некорректные записи
                }

                const result = await client.query(`
                    INSERT INTO content_changes (page_id, element_id, element_type, content, selector, updated_at)
                    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                    ON CONFLICT (page_id, element_id)
                    DO UPDATE SET
                        element_type = EXCLUDED.element_type,
                        content = EXCLUDED.content,
                        selector = EXCLUDED.selector,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING *
                `, [page_id, element_id, element_type, content, selector]);

                savedChanges.push({ page_id, element_id });
            }

            await client.query('COMMIT');

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        res.json({
            success: true,
            message: `Batch saved ${savedChanges.length} changes`,
            data: {
                saved_changes: savedChanges,
                saved_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error batch saving content:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Функция для применения изменений к HTML с использованием Cheerio (ПЕРЕРАБОТАННАЯ)
async function applyChangesToHTML(htmlContent, pageId) {
    try {
        // Получаем контент и форматирование отдельно
        const [contentResult, formattingResult] = await Promise.all([
            pool.query('SELECT * FROM content_changes WHERE page_id = $1', [pageId]),
            pool.query('SELECT * FROM element_formatting WHERE page_id = $1', [pageId])
        ]);

        // Если нет изменений, возвращаем оригинальный HTML
        if (contentResult.rows.length === 0 && formattingResult.rows.length === 0) {
            return htmlContent;
        }

        // Загружаем HTML в Cheerio
        const $ = cheerio.load(htmlContent);

        // Применяем изменения контента
        for (const row of contentResult.rows) {
            const { element_id, content, selector } = row;

            if (selector && content) {
                let $element = $(`[data-edit-id="${element_id}"]`);

                if ($element.length === 0) {
                    $element = $(selector);
                }

                if ($element.length > 0) {
                    const firstElement = $element.first();

                    // Очищаем контент от старых inline стилей
                    const cleanContent = cleanInlineStyles(content);

                    firstElement.html(cleanContent);
                    firstElement.attr('data-edit-id', element_id);

                    console.log(`Применен контент для ${pageId}: ${selector}`);
                }
            }
        }

        // Применяем форматирование CSS-классами
        console.log(`🎨 Найдено ${formattingResult.rows.length} записей форматирования для ${pageId}`);

        for (const row of formattingResult.rows) {
            const { element_id, css_classes } = row;

            console.log(`🔍 Обрабатываем форматирование для ${element_id}:`, css_classes);

            // Ищем элемент по data-edit-id или по селектору
            let $element = $(`[data-edit-id="${element_id}"]`);

            // Если не найден по data-edit-id, ищем в контенте
            if ($element.length === 0) {
                // Ищем среди элементов, которые были обновлены контентом
                const contentRow = contentResult.rows.find(r => r.element_id === element_id);
                if (contentRow && contentRow.selector) {
                    $element = $(contentRow.selector);
                    console.log(`🔍 Найден элемент по селектору ${contentRow.selector} для ${element_id}`);
                }
            }

            if ($element.length > 0) {
                const firstElement = $element.first();

                // Получаем существующие классы (кроме форматирования)
                const existingClasses = firstElement.attr('class') || '';
                const preservedClasses = existingClasses.split(' ').filter(cls =>
                    cls &&
                    !cls.startsWith('font-size-') &&
                    !cls.startsWith('text-color-') &&
                    !cls.startsWith('text-align-') &&
                    !cls.startsWith('font-weight-') &&
                    !cls.startsWith('font-style-')
                );

                // Убеждаемся, что css_classes это массив
                const formattingClasses = Array.isArray(css_classes) ? css_classes : [];

                // Добавляем CSS-классы форматирования
                const allClasses = [...preservedClasses, ...formattingClasses].filter(Boolean);

                if (allClasses.length > 0) {
                    firstElement.attr('class', allClasses.join(' '));
                    console.log(`✅ Применены классы к ${element_id}: ${allClasses.join(' ')}`);
                } else {
                    console.log(`⚠️ Нет классов для применения к ${element_id}`);
                }

                console.log(`🎯 Форматирование применено для ${pageId}: ${element_id} -> ${formattingClasses.join(' ')}`);
            } else {
                console.log(`❌ Элемент не найден для ${element_id}`);
            }
        }

        return $.html();
    } catch (error) {
        console.error('Ошибка применения изменений к HTML:', error);
        return htmlContent;
    }
}

// Функция для очистки inline стилей из контента
function cleanInlineStyles(content) {
    // Удаляем все inline стили из HTML контента
    return content
        .replace(/style="[^"]*"/gi, '')
        .replace(/<span[^>]*>\s*([^<]+)\s*<\/span>/gi, '$1')
        .replace(/\s+/g, ' ')
        .trim();
}

// Функция для извлечения CSS-классов из сохраненного контента
function extractClassesFromContent(content) {
    // Ищем классы форматирования в атрибутах элементов внутри контента
    const classRegex = /class="([^"]*(?:font-size-|text-color-|text-align-|font-weight-|font-style-)[^"]*)"/g;
    const classes = [];
    let match;

    while ((match = classRegex.exec(content)) !== null) {
        const elementClasses = match[1].split(' ');
        elementClasses.forEach(cls => {
            if (cls.startsWith('font-size-') ||
                cls.startsWith('text-color-') ||
                cls.startsWith('text-align-') ||
                cls.startsWith('font-weight-') ||
                cls.startsWith('font-style-')) {
                classes.push(cls);
            }
        });
    }

    return [...new Set(classes)]; // Убираем дубликаты
}

// Middleware для обработки HTML файлов с применением изменений
async function htmlMiddleware(req, res, next) {
    const filePath = req.path;

    // Проверяем, является ли запрос HTML файлом
    if (filePath.endsWith('.html') || filePath === '/') {
        try {
            let htmlFilePath;
            let pageId;

            if (filePath === '/') {
                htmlFilePath = path.join(__dirname, 'index.html');
                pageId = 'home';
            } else {
                // Для файлов в папке pages
                const fileName = path.basename(filePath, '.html');
                htmlFilePath = path.join(__dirname, 'pages', fileName + '.html');
                pageId = fileName;
            }

            // Читаем оригинальный HTML файл
            const htmlContent = await fs.readFile(htmlFilePath, 'utf8');

            // Применяем изменения из БД
            const modifiedHTML = await applyChangesToHTML(htmlContent, pageId);

            // Отправляем модифицированный HTML
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send(modifiedHTML);
            return;
        } catch (error) {
            console.error('Ошибка обработки HTML файла:', error);
            // Если файл не найден или произошла ошибка, продолжаем обычную обработку
        }
    }

    next();
}

// Применяем middleware для HTML файлов ДО раздачи статических файлов
app.use(htmlMiddleware);

// ВАЖНО: раздачу статических файлов размещаем после htmlMiddleware,
// чтобы HTML сначала модифицировался контентом из БД и не отдавался как дефолтный
app.use(express.static('.', {
    setHeaders: (res, filePath) => {
        // Не кешируем HTML файлы, чтобы изменения применялись сразу
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));

// Главная страница
app.get('/', (req, res) => {
    // Обработка уже выполнена в middleware
});

// Запуск сервера
async function startServer() {
    await initDatabase();
    
    app.listen(PORT, () => {
        console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
        console.log(`📊 База данных Neon PostgreSQL подключена`);
        console.log(`🌟 Сайт "Пирамида ТОТА" готов к работе!`);
    });
}

// ===== НОВЫЕ API ДЛЯ ФОРМАТИРОВАНИЯ (FUTURE-PROOF) =====

// Сохранение форматирования элемента
app.post('/api/formatting/save', authenticateToken, async (req, res) => {
    try {
        const { page_id, element_id, formatting } = req.body;

        if (!page_id || !element_id || !formatting) {
            return res.status(400).json({
                success: false,
                error: 'Отсутствуют обязательные поля: page_id, element_id, formatting'
            });
        }

        // Извлекаем CSS-классы и отдельные свойства
        const cssClasses = [];
        let fontSize = null;
        let textColor = null;
        let textAlign = null;
        let fontWeight = null;
        let fontStyle = null;

        if (formatting.fontSize) {
            fontSize = formatting.fontSize;
            cssClasses.push(`font-size-${formatting.fontSize}`);
        }
        if (formatting.textColor) {
            textColor = formatting.textColor;
            cssClasses.push(`text-color-${formatting.textColor}`);
        }
        if (formatting.textAlign) {
            textAlign = formatting.textAlign;
            cssClasses.push(`text-align-${formatting.textAlign}`);
        }
        if (formatting.fontWeight) {
            fontWeight = formatting.fontWeight;
            cssClasses.push(`font-weight-${formatting.fontWeight}`);
        }
        if (formatting.fontStyle) {
            fontStyle = formatting.fontStyle;
            cssClasses.push(`font-style-${formatting.fontStyle}`);
        }

        // Сохраняем в БД с использованием UPSERT
        const result = await pool.query(`
            INSERT INTO element_formatting (page_id, element_id, css_classes, font_size, text_color, text_align, font_weight, font_style, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
            ON CONFLICT (page_id, element_id)
            DO UPDATE SET
                css_classes = $3,
                font_size = $4,
                text_color = $5,
                text_align = $6,
                font_weight = $7,
                font_style = $8,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [page_id, element_id, cssClasses, fontSize, textColor, textAlign, fontWeight, fontStyle]);

        console.log(`Форматирование сохранено для ${page_id}:${element_id}:`, formatting);

        res.json({
            success: true,
            message: 'Форматирование сохранено',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Ошибка сохранения форматирования:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Получение форматирования для страницы
app.get('/api/formatting/:pageId', async (req, res) => {
    try {
        const { pageId } = req.params;

        const result = await pool.query(
            'SELECT * FROM element_formatting WHERE page_id = $1',
            [pageId]
        );

        const formatting = {};
        result.rows.forEach(row => {
            formatting[row.element_id] = {
                css_classes: row.css_classes,
                font_size: row.font_size,
                text_color: row.text_color,
                text_align: row.text_align,
                font_weight: row.font_weight,
                font_style: row.font_style,
                updated_at: row.updated_at
            };
        });

        res.json({
            success: true,
            data: { formatting }
        });

    } catch (error) {
        console.error('Ошибка получения форматирования:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== API ДЛЯ РЕЖИМА РЕДАКТИРОВАНИЯ =====

// Загрузка изображения
app.post('/api/upload/image', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Файл не загружен'
            });
        }

        const imageUrl = `/images/uploads/${req.file.filename}`;

        // Сохраняем информацию об изображении в БД
        await pool.query(`
            INSERT INTO content_changes (page_id, element_id, element_type, content, selector, updated_at)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        `, [
            req.body.page_id || 'unknown',
            `image-${Date.now()}`,
            'img',
            `<img src="${imageUrl}" alt="Загруженное изображение" class="editable-image">`,
            'img.editable-image'
        ]);

        res.json({
            success: true,
            message: 'Изображение загружено успешно',
            imageUrl: imageUrl,
            filename: req.file.filename
        });

    } catch (error) {
        console.error('Ошибка загрузки изображения:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Удаление элемента контента
app.delete('/api/content/:pageId/:elementId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { pageId, elementId } = req.params;

        await pool.query(
            'DELETE FROM content_changes WHERE page_id = $1 AND element_id = $2',
            [pageId, elementId]
        );

        // Также удаляем форматирование
        await pool.query(
            'DELETE FROM element_formatting WHERE page_id = $1 AND element_id = $2',
            [pageId, elementId]
        );

        res.json({
            success: true,
            message: 'Элемент удален успешно'
        });

    } catch (error) {
        console.error('Ошибка удаления элемента:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Получение списка всех страниц для редактирования
app.get('/api/admin/pages', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT page_id, COUNT(*) as elements_count
            FROM content_changes
            GROUP BY page_id
            ORDER BY page_id
        `);

        res.json({
            success: true,
            pages: result.rows
        });

    } catch (error) {
        console.error('Ошибка получения списка страниц:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Получение галереи изображений
app.get('/api/images/gallery', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, 'images', 'uploads');

        // Проверяем, существует ли папка
        try {
            await fs.access(uploadsDir);
        } catch {
            // Создаем папку если её нет
            await fs.mkdir(uploadsDir, { recursive: true });
        }

        const files = await fs.readdir(uploadsDir);
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
        });

        const images = imageFiles.map(file => ({
            name: file,
            url: `/images/uploads/${file}`,
            path: path.join(uploadsDir, file)
        }));

        // Сортируем по дате изменения (новые сначала)
        const imagesWithStats = await Promise.all(
            images.map(async (image) => {
                try {
                    const stats = await fs.stat(image.path);
                    return {
                        ...image,
                        modified: stats.mtime
                    };
                } catch {
                    return {
                        ...image,
                        modified: new Date(0)
                    };
                }
            })
        );

        imagesWithStats.sort((a, b) => b.modified - a.modified);

        res.json({
            success: true,
            images: imagesWithStats.map(img => ({
                name: img.name,
                url: img.url
            }))
        });

    } catch (error) {
        console.error('Ошибка получения галереи:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

startServer().catch(console.error);
