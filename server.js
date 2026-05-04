// Серверная часть для сайта "Пирамида ТОТА" — локальная SQLite база данных
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const cheerio = require('cheerio');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const compression = require('compression');
let sharp;
try { sharp = require('sharp'); } catch (e) { console.warn('Sharp не установлен — WebP-оптимизация отключена'); }
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка подключения к локальной SQLite базе данных
const DB_PATH = path.join(__dirname, 'server', 'content.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Ошибка подключения к SQLite:', err);
    } else {
        console.log('✅ Подключение к локальной SQLite базе данных установлено');
        console.log(`📁 Путь к БД: ${DB_PATH}`);
        // Включаем WAL режим для лучшей производительности
        db.run('PRAGMA journal_mode=WAL');
        db.run('PRAGMA foreign_keys=ON');
    }
});

// Обёртка для промисификации db.all
function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Обёртка для промисификации db.get
function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

// Обёртка для промисификации db.run
function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

// ПРИОРИТЕТНЫЕ РЕДИРЕКТЫ (должны быть ПЕРВЫМИ)
app.get('/pages/news.html', (req, res) => res.redirect(301, '/news'));
app.get('/pages/forum.html', (req, res) => res.redirect(301, '/forum'));

// Favicon — отдаём 204, чтобы браузер не получал 404
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Middleware
app.use(compression()); // Gzip сжатие всех ответов
app.use(cors());
// Увеличиваем лимит размера запроса для Rich Text Editor (до 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
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

// Настройка multer для загрузки видео
const videoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'videos', 'uploads');
        // Создаем папку если её нет
        fs.mkdir(uploadDir, { recursive: true }).then(() => {
            cb(null, uploadDir);
        }).catch(err => {
            console.error('Ошибка создания папки videos/uploads:', err);
            cb(err, uploadDir);
        });
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'video-' + uniqueSuffix + ext);
    }
});

const uploadVideo = multer({
    storage: videoStorage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB максимум для видео
    },
    fileFilter: function (req, file, cb) {
        // Проверяем тип файла
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Разрешены только видео файлы'));
        }
    }
});

// === Фоновая генерация WebP после загрузки изображений ===
const WEBP_CONFIG = {
    quality: 80,
    effort: 6,
    sizes: [400, 800, 1200],
    lqip: { width: 20, quality: 20, blur: 10 }
};

async function generateWebPInBackground(filePath, subdir) {
    if (!sharp) return;
    try {
        const optimizedDir = path.join(__dirname, 'images', 'optimized', subdir);
        await fs.mkdir(optimizedDir, { recursive: true });

        const basename = path.basename(filePath, path.extname(filePath));
        const metadata = await sharp(filePath).metadata();
        const originalWidth = metadata.width;

        // 1. WebP полный размер
        await sharp(filePath)
            .webp({ quality: WEBP_CONFIG.quality, effort: WEBP_CONFIG.effort })
            .toFile(path.join(optimizedDir, `${basename}.webp`));
        console.log(`[WebP] ✓ ${basename}.webp`);

        // 2. Responsive размеры
        for (const w of WEBP_CONFIG.sizes) {
            if (originalWidth <= w) continue;
            await sharp(filePath)
                .resize(w, null, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: WEBP_CONFIG.quality, effort: WEBP_CONFIG.effort })
                .toFile(path.join(optimizedDir, `${basename}-${w}w.webp`));
            console.log(`[WebP] ✓ ${basename}-${w}w.webp`);
        }

        // 3. LQIP
        const lqipBuffer = await sharp(filePath)
            .resize(WEBP_CONFIG.lqip.width, null, { fit: 'inside' })
            .blur(WEBP_CONFIG.lqip.blur)
            .webp({ quality: WEBP_CONFIG.lqip.quality })
            .toBuffer();
        const lqipBase64 = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

        // 4. Обновляем lqip-data.json
        const lqipJsonPath = path.join(__dirname, 'images', 'optimized', 'lqip-data.json');
        let lqipData = {};
        try {
            const raw = await fs.readFile(lqipJsonPath, 'utf-8');
            lqipData = JSON.parse(raw);
        } catch (e) { /* файла нет — создадим */ }

        const relPath = `images/${subdir}/${path.basename(filePath)}`;
        lqipData[relPath] = {
            lqip: lqipBase64,
            webp: { full: { path: `images/optimized/${subdir}/${basename}.webp` } }
        };
        for (const w of WEBP_CONFIG.sizes) {
            if (originalWidth > w) {
                lqipData[relPath].webp[`${w}w`] = { path: `images/optimized/${subdir}/${basename}-${w}w.webp` };
            }
        }
        await fs.writeFile(lqipJsonPath, JSON.stringify(lqipData, null, 2));
        console.log(`[WebP] ✓ lqip-data.json обновлён для ${relPath}`);
    } catch (err) {
        console.error(`[WebP] Ошибка генерации для ${filePath}:`, err.message);
    }
}

// Инициализация базы данных
async function initDatabase() {
    try {
        // Создание таблицы пользователей
        await dbRun(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Создание таблицы контактных форм
        await dbRun(`
            CREATE TABLE IF NOT EXISTS contact_forms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                message TEXT NOT NULL,
                status TEXT DEFAULT 'new',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Создание таблицы подписок
        await dbRun(`
            CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Создание таблицы записей на программы
        await dbRun(`
            CREATE TABLE IF NOT EXISTS program_bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                program TEXT NOT NULL,
                date TEXT,
                message TEXT,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Создание таблицы контента (для админ-панели)
        await dbRun(`
            CREATE TABLE IF NOT EXISTS content_pages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page_name TEXT UNIQUE NOT NULL,
                title TEXT,
                content TEXT,
                meta_description TEXT,
                updated_by INTEGER REFERENCES users(id),
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Создание таблицы для хранения изменений элементов
        await dbRun(`
            CREATE TABLE IF NOT EXISTS content_changes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page_id TEXT NOT NULL,
                element_id TEXT NOT NULL,
                element_type TEXT,
                content TEXT,
                selector TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(page_id, element_id)
            )
        `);

        // Создание таблицы для CSS-классов форматирования
        await dbRun(`
            CREATE TABLE IF NOT EXISTS element_formatting (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page_id TEXT NOT NULL,
                element_id TEXT NOT NULL,
                css_classes TEXT DEFAULT '[]',
                font_size TEXT,
                text_color TEXT,
                text_align TEXT,
                font_weight TEXT,
                font_style TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(page_id, element_id)
            )
        `);

        // Создаем таблицу для отслеживания удаленных элементов
        await dbRun(`
            CREATE TABLE IF NOT EXISTS deleted_elements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page_id TEXT NOT NULL,
                element_id TEXT NOT NULL,
                deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(page_id, element_id)
            )
        `);

        // Создаем расширенную таблицу для блоков папируса
        await dbRun(`
            CREATE TABLE IF NOT EXISTS page_content (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page_id TEXT NOT NULL,
                element_id TEXT NOT NULL,
                element_type TEXT,
                content TEXT,
                selector TEXT,
                block_type TEXT,
                block_category TEXT,
                block_metadata TEXT DEFAULT '{}',
                parent_block_id TEXT,
                css_styles TEXT,
                css_classes TEXT,
                container_selector TEXT DEFAULT '.page-content',
                before_element_id TEXT,
                after_element_id TEXT,
                position_index INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(page_id, element_id)
            )
        `);

        console.log('✅ Локальная SQLite база данных инициализирована успешно');
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
        const existingUser = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }

        // Хеширование пароля
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Создание пользователя
        const result = await dbRun(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        const user = { id: result.lastID, name, email, role: 'user' };
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
        const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
        console.log('Найдено пользователей:', user ? 1 : 0);

        if (!user) {
            console.log('Пользователь не найден');
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

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

        const result = await dbRun(
            'INSERT INTO contact_forms (name, email, phone, message) VALUES (?, ?, ?, ?)',
            [name, email, phone, message]
        );

        // Здесь можно добавить отправку в Telegram
        await sendToTelegram('contact', { name, email, phone, message });

        res.status(201).json({
            message: 'Сообщение успешно отправлено',
            data: { id: result.lastID, name, email, phone, message, status: 'new' }
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

        const existing = await dbGet('SELECT * FROM newsletter_subscriptions WHERE email = ?', [email]);
        if (existing) {
            return res.status(400).json({ error: 'Email уже подписан на рассылку' });
        }

        const result = await dbRun(
            'INSERT INTO newsletter_subscriptions (email) VALUES (?)',
            [email]
        );

        await sendToTelegram('newsletter', { email });

        res.status(201).json({
            message: 'Подписка оформлена успешно',
            data: { id: result.lastID, email, status: 'active' }
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

        const result = await dbRun(
            'INSERT INTO program_bookings (name, email, phone, program, date, message) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, phone, program, date, message]
        );

        await sendToTelegram('booking', { name, email, phone, program, date, message });

        res.status(201).json({
            message: 'Запись успешно оформлена',
            data: { id: result.lastID, name, email, phone, program, date, message, status: 'pending' }
        });
    } catch (error) {
        console.error('Ошибка записи на программу:', error);
        res.status(500).json({ error: 'Ошибка оформления записи' });
    }
});

// Получение профиля пользователя
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const row = await dbGet(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
            [req.user.userId]
        );

        if (!row) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json(row);
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
        const row = await dbGet('SELECT COUNT(*) as count FROM contact_forms');
        res.json({ count: row.count });
    } catch (error) {
        console.error('Ошибка получения статистики контактов:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.get('/api/admin/bookings/count', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const row = await dbGet('SELECT COUNT(*) as count FROM program_bookings');
        res.json({ count: row.count });
    } catch (error) {
        console.error('Ошибка получения статистики записей:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.get('/api/admin/subscribers/count', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const row = await dbGet('SELECT COUNT(*) as count FROM newsletter_subscriptions');
        res.json({ count: row.count });
    } catch (error) {
        console.error('Ошибка получения статистики подписчиков:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.get('/api/admin/users/count', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const row = await dbGet('SELECT COUNT(*) as count FROM users');
        res.json({ count: row.count });
    } catch (error) {
        console.error('Ошибка получения статистики пользователей:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение данных для таблиц
app.get('/api/admin/contacts', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const rows = await dbAll(
            'SELECT * FROM contact_forms ORDER BY created_at DESC LIMIT 100'
        );
        res.json(rows);
    } catch (error) {
        console.error('Ошибка получения контактов:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.get('/api/admin/bookings', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const rows = await dbAll(
            'SELECT * FROM program_bookings ORDER BY created_at DESC LIMIT 100'
        );
        res.json(rows);
    } catch (error) {
        console.error('Ошибка получения записей:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.get('/api/admin/subscribers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const rows = await dbAll(
            'SELECT * FROM newsletter_subscriptions ORDER BY created_at DESC LIMIT 100'
        );
        res.json(rows);
    } catch (error) {
        console.error('Ошибка получения подписчиков:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const rows = await dbAll(
            'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 100'
        );
        res.json(rows);
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

        await dbRun(
            'UPDATE contact_forms SET status = ? WHERE id = ?',
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

        await dbRun(
            'UPDATE program_bookings SET status = ? WHERE id = ?',
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
        await dbRun('DELETE FROM contact_forms WHERE id = ?', [id]);
        res.json({ message: 'Контакт удален' });
    } catch (error) {
        console.error('Ошибка удаления контакта:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.delete('/api/admin/bookings/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await dbRun('DELETE FROM program_bookings WHERE id = ?', [id]);
        res.json({ message: 'Запись удалена' });
    } catch (error) {
        console.error('Ошибка удаления записи:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.delete('/api/admin/subscribers/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await dbRun('DELETE FROM newsletter_subscriptions WHERE id = ?', [id]);
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

        await dbRun('DELETE FROM users WHERE id = ?', [id]);
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

        await dbRun(
            'UPDATE users SET role = ? WHERE id = ?',
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

// Функция поиска в базе данных
async function searchInDatabase(query, limit = 20) {
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
            'news-pyramid',
            'programs',
            'seminars',
            'school-tota',
            'school-isais',
            'about-isais',
            'rods',
            'visit',
            'recordings',
            'consultations',
            'media',
            'artifacts',
            'projects'
        ];

        const searchPattern = `%${query}%`;
        const placeholders = allowedPages.map(() => '?').join(',');

        // Ищем только в Quill rich-text контенте, сохраненном в page_content
        const richTextResults = await dbAll(
            `SELECT
                page_id,
                element_id,
                element_type,
                content,
                selector,
                updated_at
            FROM page_content
            WHERE content LIKE ? COLLATE NOCASE AND page_id IN (${placeholders})
            AND element_id = ?
            AND TRIM(REPLACE(content, ' ', '')) != '' AND LENGTH(content) > 10
            ORDER BY updated_at DESC
            LIMIT ?`,
            [searchPattern, ...allowedPages, 'rich-text-content', limit]
        );
        
        const normalizeSearchSnippet = (text) => text
            .replace(/\.\.\./g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();

        const deduplicateResults = (items) => {
            const uniqueResults = new Map();

            items.forEach(item => {
                const normalizedSnippet = normalizeSearchSnippet(item.snippet || item.context || '');
                const dedupeKey = `${item.page_id}::${normalizedSnippet}`;
                const existing = uniqueResults.get(dedupeKey);

                if (!existing) {
                    uniqueResults.set(dedupeKey, item);
                }
            });

            return Array.from(uniqueResults.values())
                .sort((left, right) => String(right.updated_at || '').localeCompare(String(left.updated_at || '')))
                .slice(0, limit)
                .map((item) => item);
        };

        // Убираем дубли по странице и сниппету внутри Quill rich-text выдачи
        const allRows = richTextResults;
        const searchTermLower = query.toLowerCase();

        const mappedResults = allRows
            .map(row => {
                // Удаляем HTML теги и лишние пробелы для поиска и snippet
                const textContent = row.content
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&[a-z]+;/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                // Фильтруем: если после снятия тегов текст не содержит запрос — пропускаем
                // (например запрос "img" матчил <img> тег, но в тексте слова нет)
                if (!textContent.toLowerCase().includes(searchTermLower)) return null;

                // Делаем сниппет так, чтобы совпадение оставалось видимым даже в узком dropdown
                const idx = textContent.toLowerCase().indexOf(searchTermLower);
                const preferredStart = Math.max(0, idx - 18);
                let start = preferredStart;
                if (start > 0) {
                    const nextWordBoundary = textContent.indexOf(' ', start);
                    if (nextWordBoundary !== -1 && nextWordBoundary < idx) {
                        start = nextWordBoundary + 1;
                    }
                }

                let end = Math.min(textContent.length, idx + searchTermLower.length + 100);
                if (end < textContent.length) {
                    const lastWordBoundary = textContent.lastIndexOf(' ', end);
                    if (lastWordBoundary > idx + searchTermLower.length) {
                        end = lastWordBoundary;
                    }
                }

                const prefix = start > 0 ? '...' : '';
                const suffix = end < textContent.length ? '...' : '';
                const snippet = prefix + textContent.substring(start, end) + suffix;
                const matchStart = prefix.length + (idx - start);

                return {
                    page_id: row.page_id,
                    page_name: row.page_id,
                    element_id: row.element_id,
                    element_type: row.element_type,
                    content: textContent,
                    context: snippet,
                    snippet: snippet,
                    match_start: matchStart,
                    match_length: query.length,
                    source: 'database',
                    updated_at: row.updated_at
                };
            })
            .filter(Boolean);

        return deduplicateResults(mappedResults);
    } catch (error) {
        console.error('Ошибка поиска в базе данных:', error);
        return [];
    }
}

// API endpoint для поиска
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q || req.query.query;
        const limit = parseInt(req.query.limit) || 20;

        if (!query || query.trim().length < 2) {
            return res.json({
                success: true,
                data: [],
                message: 'Поисковый запрос должен быть не менее 2 символов'
            });
        }

        console.log('Поиск:', query);

        // Ищем только в Quill rich-text контенте из page_content
        // Это гарантирует, что поиск не захватывает блоки и inline editor изменения
        const dbResults = await searchInDatabase(query, limit);

        // Ограничиваем общее количество результатов
        const finalResults = dbResults.slice(0, limit);

        console.log(`Найдено результатов: ${finalResults.length} (только из БД)`);

        res.json({
            success: true,
            data: finalResults,
            query: query,
            results_count: finalResults.length,
            sources: {
                database: dbResults.length,
                html: 0
            }
        });
        
    } catch (error) {
        console.error('Ошибка поиска:', error);
        res.json({ 
            success: false,
            data: [],
            error: 'Ошибка поиска контента',
            details: error.message
        });
    }
});

// API для работы с контентом страниц

// Получить контент страницы
app.get('/api/content/:pageId', async (req, res) => {
    console.log('GET /api/content/' + req.params.pageId + ' - получен запрос');

    try {
        const { pageId } = req.params;

        // Получаем контент
        const contentRows = await dbAll(
            'SELECT * FROM content_changes WHERE page_id = ?',
            [pageId]
        );

        // Получаем список удаленных элементов
        const deletedRows = await dbAll(
            'SELECT element_id FROM deleted_elements WHERE page_id = ?',
            [pageId]
        );

        const deletedElements = deletedRows.map(row => row.element_id);

        // Преобразуем в формат, ожидаемый фронтендом
        const changes = {};
        contentRows.forEach(row => {
            changes[row.element_id] = {
                element_type: row.element_type,
                content: row.content,
                selector: row.selector,
                updated_at: row.updated_at
            };
        });

        res.json({
            success: true,
            data: {
                changes,
                deleted_elements: deletedElements
            }
        });

    } catch (error) {
        console.error('❌ Ошибка чтения контента:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Получение контента rich text редактора для конкретного элемента
app.get('/api/content/:pageId/:elementId', async (req, res) => {
    const { pageId, elementId } = req.params;

    console.log('📥 GET /api/content/:pageId/:elementId - получен запрос:', {
        pageId,
        elementId
    });

    try {
        // Получаем элемент из базы данных
        const element = await dbGet(
            'SELECT * FROM page_content WHERE page_id = ? AND element_id = ? LIMIT 1',
            [pageId, elementId]
        );

        console.log('📦 Результат из БД:', {
            found: !!element,
            element_id: element ? element.element_id : null,
            contentLength: element && element.content ? element.content.length : 0
        });

        // ETag кэширование — если контент не изменился, отправляем 304
        if (element && element.updated_at) {
            const etag = `"${Buffer.from(element.updated_at + element.content.length).toString('base64')}"`;
            res.setHeader('ETag', etag);
            res.setHeader('Cache-Control', 'private, max-age=5, must-revalidate');
            if (req.headers['if-none-match'] === etag) {
                return res.status(304).end();
            }
        }

        // Парсим block_metadata если есть
        if (element && element.block_metadata && typeof element.block_metadata === 'string') {
            try {
                element.block_metadata = JSON.parse(element.block_metadata);
            } catch (e) {
                element.block_metadata = {};
            }
        }

        res.json({
            success: true,
            data: element || null,
            page_id: pageId,
            element_id: elementId
        });

    } catch (error) {
        console.error('❌ Ошибка получения элемента:', error.message);
        res.status(500).json({
            error: 'Ошибка сервера при получении элемента',
            details: error.message
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

        console.log('💾 Сохранение в page_content:', {
            page_id,
            element_id,
            element_type: element_type || 'rich-text',
            contentLength: content ? content.length : 0
        });

        // Используем INSERT OR REPLACE для таблицы page_content
        const result = await dbRun(`
            INSERT OR REPLACE INTO page_content (page_id, element_id, element_type, content, selector, updated_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
        `, [page_id, element_id, element_type || 'rich-text', content, selector]);

        console.log('✅ Контент успешно сохранен в page_content:', {
            id: result.lastID,
            page_id,
            element_id
        });

        res.json({
            success: true,
            message: 'Content saved successfully',
            data: {
                page_id,
                element_id,
                saved_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error saving content:', error);
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
        await dbRun('BEGIN TRANSACTION');

        try {
            for (const change of changes) {
                const { page_id, element_id, element_type, content, selector } = change;

                if (!page_id || !element_id) {
                    continue; // Пропускаем некорректные записи
                }

                await dbRun(`
                    INSERT OR REPLACE INTO content_changes (page_id, element_id, element_type, content, selector, updated_at)
                    VALUES (?, ?, ?, ?, ?, datetime('now'))
                `, [page_id, element_id, element_type, content, selector]);

                savedChanges.push({ page_id, element_id });
            }

            await dbRun('COMMIT');

        } catch (error) {
            await dbRun('ROLLBACK');
            throw error;
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
        // Получаем контент, форматирование и удаленные элементы
        const [contentRows, formattingRows, deletedRows] = await Promise.all([
            dbAll('SELECT * FROM content_changes WHERE page_id = ?', [pageId]),
            dbAll('SELECT * FROM element_formatting WHERE page_id = ?', [pageId]),
            dbAll('SELECT element_id FROM deleted_elements WHERE page_id = ?', [pageId])
        ]);

        // Если нет изменений, возвращаем оригинальный HTML
        if (contentRows.length === 0 && formattingRows.length === 0 && deletedRows.length === 0) {
            return htmlContent;
        }

        // Загружаем HTML в Cheerio
        const $ = cheerio.load(htmlContent);

        // СНАЧАЛА ПРИМЕНЯЕМ ИЗМЕНЕНИЯ КОНТЕНТА
        for (const row of contentRows) {
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

        // Получаем список удаленных элементов для исключения из форматирования
        const deletedElements = deletedRows.map(row => row.element_id);

        // Применяем форматирование CSS-классами
        console.log(`🎨 Найдено ${formattingRows.length} записей форматирования для ${pageId}`);

        for (const row of formattingRows) {
            const { element_id, css_classes } = row;

            // Пропускаем удаленные элементы
            if (deletedElements.includes(element_id)) {
                console.log(`⏭️ Пропускаем форматирование для удаленного элемента: ${element_id}`);
                continue;
            }

            console.log(`🔍 Обрабатываем форматирование для ${element_id}:`, css_classes);

            // Ищем элемент по data-edit-id или по селектору
            let $element = $(`[data-edit-id="${element_id}"]`);

            // Если не найден по data-edit-id, ищем в контенте
            if ($element.length === 0) {
                // Ищем среди элементов, которые были обновлены контентом
                const contentRow = contentRows.find(r => r.element_id === element_id);
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
                let formattingClasses;
                if (Array.isArray(css_classes)) {
                    formattingClasses = css_classes;
                } else if (typeof css_classes === 'string') {
                    try { formattingClasses = JSON.parse(css_classes); } catch (e) { formattingClasses = []; }
                } else {
                    formattingClasses = [];
                }

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

        // В КОНЦЕ УДАЛЯЕМ ЭЛЕМЕНТЫ, ПОМЕЧЕННЫЕ КАК УДАЛЕННЫЕ
        console.log(`🗑️ Найдено ${deletedElements.length} удаленных элементов для ${pageId}:`, deletedElements);

        for (const elementId of deletedElements) {
            // Ищем элемент по data-edit-id
            let $element = $(`[data-edit-id="${elementId}"]`);

            // Если не найден, ищем по id
            if ($element.length === 0) {
                $element = $(`#${elementId}`);
            }

            if ($element.length > 0) {
                console.log(`🗑️ Удаляем элемент из HTML: ${elementId}`);
                $element.remove();
            } else {
                console.log(`⚠️ Удаленный элемент не найден в HTML: ${elementId}`);
            }
        }

        // Добавляем маркер, что контент уже применен на сервере
        $('body').attr('data-server-content-applied', 'true');

        return $.html();
    } catch (error) {
        console.error('Ошибка применения изменений к HTML:', error);
        return htmlContent;
    }
}

// Функция для серверной инъекции rich-text контента из page_content для SEO
async function injectRichTextContent(htmlContent, pageId) {
    try {
        // Получаем rich-text контент из таблицы page_content
        const richTextRows = await dbAll(
            'SELECT content FROM page_content WHERE page_id = ? AND element_id = ?',
            [pageId, 'rich-text-content']
        );

        if (richTextRows.length === 0 || !richTextRows[0].content) {
            return htmlContent;
        }

        const $ = cheerio.load(htmlContent, { decodeEntities: false });
        const pageContent = $('.page-content');

        if (pageContent.length > 0) {
            // Инъектируем контент из БД в .page-content для индексации поисковиками
            // Класс ssr-content позволяет JS-редактору понять, что контент уже загружен с сервера
            pageContent.html(`<div class="ssr-content">${richTextRows[0].content}</div>`);
            console.log(`🔍 SEO: Инъектирован rich-text контент для страницы "${pageId}" (${richTextRows[0].content.length} символов)`);
        }

        return $.html();
    } catch (error) {
        console.error(`❌ Ошибка инъекции rich-text контента для ${pageId}:`, error.message);
        return htmlContent;
    }
}

// Функция для серверной инъекции блоков из new-blocks-system для SEO
async function injectBlocksContent(htmlContent, pageId) {
    try {
        // Получаем все блоки для этой страницы
        const blockRows = await dbAll(
            'SELECT content, element_type, block_metadata FROM page_content WHERE page_id = ? AND element_id != ? ORDER BY rowid',
            [pageId, 'rich-text-content']
        );

        if (blockRows.length === 0) {
            return htmlContent;
        }

        const $ = cheerio.load(htmlContent, { decodeEntities: false });
        const pageContent = $('.page-content');

        if (pageContent.length > 0 && pageContent.find('.ssr-content').length === 0) {
            // Если rich-text не был инъектирован, собираем контент из блоков
            let blocksHtml = '';
            for (const block of blockRows) {
                if (block.content) {
                    blocksHtml += block.content;
                }
            }
            if (blocksHtml) {
                pageContent.html(`<div class="ssr-content">${blocksHtml}</div>`);
                console.log(`🔍 SEO: Инъектированы блоки для страницы "${pageId}" (${blockRows.length} блоков)`);
            }
        }

        return $.html();
    } catch (error) {
        console.error(`❌ Ошибка инъекции блоков для ${pageId}:`, error.message);
        return htmlContent;
    }
}

// Функция для серверной корректировки SEO-тегов (canonical, og:url, twitter cards, structured data)
function fixSEOUrls(htmlContent, pageId) {
    const $ = cheerio.load(htmlContent, { decodeEntities: false });
    const baseUrl = 'https://pyramid-tota.ru';
    const cleanUrl = `${baseUrl}/${pageId}`;

    // Исправляем canonical URL
    const canonical = $('link[rel="canonical"]');
    if (canonical.length > 0) {
        const currentCanonical = canonical.attr('href');
        if (currentCanonical && currentCanonical.includes('/pages/')) {
            canonical.attr('href', cleanUrl);
        }
    }

    // Исправляем og:url
    const ogUrl = $('meta[property="og:url"]');
    if (ogUrl.length > 0) {
        const currentOgUrl = ogUrl.attr('content');
        if (currentOgUrl && currentOgUrl.includes('/pages/')) {
            ogUrl.attr('content', cleanUrl);
        }
    }

    // Исправляем Twitter Card: property= → name= (Twitter требует name=, не property=)
    $('meta[property^="twitter:"]').each((i, el) => {
        const prop = $(el).attr('property');
        $(el).removeAttr('property');
        $(el).attr('name', prop);
    });

    // Добавляем Twitter Card если отсутствует
    if ($('meta[name="twitter:card"]').length === 0) {
        const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text();
        const ogDesc = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
        const ogImage = $('meta[property="og:image"]').attr('content') || `${baseUrl}/images/uploads/logo.png`;

        $('head').append(`\n    <!-- Twitter Card (автогенерация) -->`);
        $('head').append(`\n    <meta name="twitter:card" content="summary_large_image">`);
        $('head').append(`\n    <meta name="twitter:url" content="${cleanUrl}">`);
        $('head').append(`\n    <meta name="twitter:title" content="${ogTitle}">`);
        $('head').append(`\n    <meta name="twitter:description" content="${ogDesc}">`);
        $('head').append(`\n    <meta name="twitter:image" content="${ogImage}">`);
    }

    // Добавляем расширенные мета-теги robots если упрощенные
    const robotsMeta = $('meta[name="robots"]');
    if (robotsMeta.length > 0) {
        const currentRobots = robotsMeta.attr('content');
        if (currentRobots === 'index, follow') {
            robotsMeta.attr('content', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
        }
    }

    // Добавляем Schema.org structured data если отсутствует
    const existingLD = $('script[type="application/ld+json"]');
    if (existingLD.length === 0) {
        const title = $('title').text() || '';
        const description = $('meta[name="description"]').attr('content') || '';
        const ogImage = $('meta[property="og:image"]').attr('content') || `${baseUrl}/images/uploads/logo.png`;

        const schemaData = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": title,
            "description": description,
            "url": cleanUrl,
            "image": ogImage,
            "isPartOf": {
                "@type": "WebSite",
                "name": "Пирамида ТОТА",
                "url": baseUrl
            },
            "publisher": {
                "@type": "Organization",
                "name": "Пирамида ТОТА",
                "logo": {
                    "@type": "ImageObject",
                    "url": `${baseUrl}/images/uploads/logo.png`
                }
            }
        };

        $('head').append(`\n    <script type="application/ld+json">${JSON.stringify(schemaData)}</script>`);
    }

    // Добавляем og:locale если отсутствует
    if ($('meta[property="og:locale"]').length === 0) {
        $('meta[property="og:image"]').after('\n    <meta property="og:locale" content="ru_RU">');
    }

    // Добавляем og:site_name если отсутствует
    if ($('meta[property="og:site_name"]').length === 0) {
        $('meta[property="og:image"]').after('\n    <meta property="og:site_name" content="Пирамида ТОТА">');
    }

    return $.html();
}

// Универсальная функция для отдачи страниц с SSR-контентом (SEO-оптимизация)
async function servePageWithSSR(pageName, req, res) {
    try {
        let htmlContent = await fs.readFile(path.join(__dirname, 'pages', `${pageName}.html`), 'utf8');

        // 1. Применяем content_changes (inline editor) через Cheerio
        htmlContent = await applyChangesToHTML(htmlContent, pageName);

        // 2. Инъектируем rich-text контент из page_content для SEO
        htmlContent = await injectRichTextContent(htmlContent, pageName);

        // 3. Инъектируем блоки если rich-text не найден
        htmlContent = await injectBlocksContent(htmlContent, pageName);

        // 4. Исправляем SEO-теги (canonical, og:url, twitter cards)
        htmlContent = fixSEOUrls(htmlContent, pageName);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.send(htmlContent);
    } catch (error) {
        console.error(`❌ Ошибка отдачи страницы ${pageName}:`, error);
        res.status(500).send('Ошибка: ' + error.message);
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

            // ВРЕМЕННО: для news и forum страниц — минимальная обработка с SSR для SEO
            if (pageId === 'news' || pageId === 'forum') {
                console.log(`🔧 Обработка ${pageId}.html с SSR для SEO`);
                let modifiedHTML = htmlContent;
                modifiedHTML = await injectRichTextContent(modifiedHTML, pageId);
                modifiedHTML = await injectBlocksContent(modifiedHTML, pageId);
                modifiedHTML = fixSEOUrls(modifiedHTML, pageId);
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.send(modifiedHTML);
                return;
            }

            // Применяем изменения из БД для остальных страниц
            let modifiedHTML = await applyChangesToHTML(htmlContent, pageId);

            // Инъектируем rich-text контент для SEO
            modifiedHTML = await injectRichTextContent(modifiedHTML, pageId);
            modifiedHTML = await injectBlocksContent(modifiedHTML, pageId);

            // Исправляем SEO-теги
            if (pageId !== 'home') {
                modifiedHTML = fixSEOUrls(modifiedHTML, pageId);
            }

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

// МАРШРУТЫ для news и forum (теперь с SSR для SEO)
app.get('/news', async (req, res) => servePageWithSSR('news', req, res));
app.get('/forum', async (req, res) => servePageWithSSR('forum', req, res));

// РЕДИРЕКТЫ с длинных URL на короткие
app.get('/pages/complex.html', (req, res) => res.redirect(301, '/complex'));
app.get('/pages/pyramid.html', (req, res) => res.redirect(301, '/pyramid'));
app.get('/pages/temple.html', (req, res) => res.redirect(301, '/temple'));
app.get('/pages/court.html', (req, res) => res.redirect(301, '/court'));
app.get('/pages/visit.html', (req, res) => res.redirect(301, '/visit'));
app.get('/pages/programs.html', (req, res) => res.redirect(301, '/programs'));
app.get('/pages/media.html', (req, res) => res.redirect(301, '/media'));
app.get('/pages/news-pyramid.html', (req, res) => res.redirect(301, '/news-pyramid'));
app.get('/pages/school-tota.html', (req, res) => res.redirect(301, '/school-tota'));
app.get('/pages/school-isais.html', (req, res) => res.redirect(301, '/school-isais'));
app.get('/pages/consultations.html', (req, res) => res.redirect(301, '/consultations'));
app.get('/pages/artifacts.html', (req, res) => res.redirect(301, '/artifacts'));
app.get('/pages/projects.html', (req, res) => res.redirect(301, '/projects'));
app.get('/pages/seminars.html', (req, res) => res.redirect(301, '/seminars'));
app.get('/pages/about-isais.html', (req, res) => res.redirect(301, '/about-isais'));
app.get('/pages/recordings.html', (req, res) => res.redirect(301, '/recordings'));
app.get('/pages/rods.html', (req, res) => res.redirect(301, '/rods'));

// МАРШРУТЫ для всех страниц (короткие URL) — с SSR для SEO индексации
const seoPages = [
    'complex', 'pyramid', 'temple', 'court', 'visit', 'programs',
    'media', 'news-pyramid', 'school-tota', 'school-isais',
    'consultations', 'artifacts', 'projects', 'seminars', 'about-isais',
    'recordings', 'rods'
];
for (const pageName of seoPages) {
    app.get(`/${pageName}`, async (req, res) => servePageWithSSR(pageName, req, res));
}

// Применяем middleware для HTML файлов ДО раздачи статических файлов
app.use(htmlMiddleware);

// === Middleware: автоматическая отдача WebP вместо PNG/JPG (если браузер поддерживает) ===
app.use('/images', (req, res, next) => {
    // Только для PNG/JPG запросов
    if (!/\.(png|jpe?g)$/i.test(req.path)) return next();

    // Проверяем Accept заголовок браузера
    const acceptsWebP = req.headers.accept && req.headers.accept.includes('image/webp');
    if (!acceptsWebP) return next();

    // Пытаемся найти оптимизированную WebP версию
    const webpPath = req.path
        .replace(/^\//, '/optimized/')
        .replace(/\.(png|jpe?g)$/i, '.webp');
    const fullWebpPath = path.join(__dirname, 'images', webpPath);

    // Проверяем существование WebP файла (синхронно для скорости)
    try {
        const fsStat = require('fs');
        if (fsStat.existsSync(fullWebpPath)) {
            res.setHeader('Content-Type', 'image/webp');
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            res.setHeader('Vary', 'Accept');
            return res.sendFile(fullWebpPath);
        }
    } catch (e) {
        // WebP версия не найдена — отдаём оригинал
    }

    next();
});

// === Кеширование: оптимизированные изображения кешируются на 1 год ===
app.use('/images/optimized', express.static(path.join(__dirname, 'images', 'optimized'), {
    maxAge: '365d',
    immutable: true,
    etag: true,
    lastModified: true,
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
}));

// === Кеширование: обычные изображения — 30 дней ===
app.use('/images', express.static(path.join(__dirname, 'images'), {
    maxAge: '30d',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        res.setHeader('Cache-Control', 'public, max-age=2592000');
        res.setHeader('Vary', 'Accept');
    }
}));

// ВАЖНО: раздачу статических файлов размещаем после htmlMiddleware,
// чтобы HTML сначала модифицировался контентом из БД и не отдавался как дефолтный
app.use(express.static('.', {
    setHeaders: (res, filePath) => {
        // Не кешируем HTML файлы, чтобы изменения применялись сразу
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
        // CSS/JS всегда должны перевалидироваться, чтобы браузер не держал старые версии после деплоя
        if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
            res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        }
    }
}));

// Главная страница
app.get('/', (req, res) => {
    // Обработка уже выполнена в middleware
});

// Страница входа администратора
app.get('/admin-login', async (req, res) => {
    try {
        const htmlContent = await fs.readFile(path.join(__dirname, 'admin-login.html'), 'utf8');
        console.log('🔐 Возвращаем страницу входа администратора');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.send(htmlContent);
    } catch (error) {
        console.error('Ошибка чтения admin-login.html:', error);
        res.status(500).send('Ошибка загрузки страницы входа');
    }
});

let startServerPromise = null;

// Запуск сервера
async function startServer() {
    if (startServerPromise) {
        return startServerPromise;
    }

    startServerPromise = initDatabase()
        .then(() => new Promise((resolve, reject) => {
            const server = app.listen(PORT);

            server.once('error', reject);
            server.once('listening', () => {
                console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
                console.log(`📊 Локальная SQLite база данных подключена`);
                console.log(`🌟 Сайт "Пирамида ТОТА" готов к работе!`);
                console.log(`🔐 Страница входа администратора: http://localhost:${PORT}/admin-login`);
                resolve(server);
            });
        }))
        .catch((error) => {
            startServerPromise = null;
            throw error;
        });

    return startServerPromise;
}

// ===== НОВЫЕ API ДЛЯ ФОРМАТИРОВАНИЯ (FUTURE-PROOF) =====

// Сохранение форматирования элемента (временно без авторизации)
app.post('/api/formatting/save', async (req, res) => {
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

        // Сохраняем в БД с использованием INSERT OR REPLACE
        const result = await dbRun(`
            INSERT OR REPLACE INTO element_formatting (page_id, element_id, css_classes, font_size, text_color, text_align, font_weight, font_style, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [page_id, element_id, JSON.stringify(cssClasses), fontSize, textColor, textAlign, fontWeight, fontStyle]);

        console.log(`Форматирование сохранено для ${page_id}:${element_id}:`, formatting);

        res.json({
            success: true,
            message: 'Форматирование сохранено',
            data: { id: result.lastID, page_id, element_id, css_classes: cssClasses }
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

        const rows = await dbAll(
            'SELECT * FROM element_formatting WHERE page_id = ?',
            [pageId]
        );

        const formatting = {};
        rows.forEach(row => {
            let parsedClasses;
            try { parsedClasses = JSON.parse(row.css_classes); } catch (e) { parsedClasses = []; }
            formatting[row.element_id] = {
                css_classes: parsedClasses,
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

// Загрузка форматирования (новый endpoint для edit-mode)
app.get('/api/formatting/load', async (req, res) => {
    try {
        const { page_id } = req.query;

        if (!page_id) {
            return res.status(400).json({
                success: false,
                error: 'page_id обязателен'
            });
        }

        const rows = await dbAll(
            'SELECT element_id, css_classes, font_size, text_color, text_align, font_weight, font_style, updated_at FROM element_formatting WHERE page_id = ?',
            [page_id]
        );

        const formattingData = rows.map(row => {
            const formatting = {};

            // Преобразуем данные из БД в формат для CSS классов
            if (row.font_size) formatting.fontSize = row.font_size;
            if (row.text_color) formatting.textColor = row.text_color;
            if (row.text_align) formatting.textAlign = row.text_align;
            if (row.font_weight) formatting.fontWeight = row.font_weight;
            if (row.font_style) formatting.fontStyle = row.font_style;

            return {
                element_id: row.element_id,
                formatting: formatting,
                updated_at: row.updated_at
            };
        });

        console.log(`Загружено форматирование для страницы ${page_id}:`, formattingData.length, 'элементов');

        res.json({
            success: true,
            formatting: formattingData
        });

    } catch (error) {
        console.error('Ошибка загрузки форматирования:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Удаление элемента (контента и форматирования)
app.delete('/api/content/delete', async (req, res) => {
    console.log('DELETE /api/content/delete - получен запрос:', req.body);
    try {
        const { page_id, element_id } = req.body;

        if (!page_id || !element_id) {
            return res.status(400).json({
                success: false,
                error: 'page_id и element_id обязательны'
            });
        }

        // Удаляем контент
        const contentResult = await dbRun(
            'DELETE FROM content_changes WHERE page_id = ? AND element_id = ?',
            [page_id, element_id]
        );

        // Удаляем форматирование
        const formattingResult = await dbRun(
            'DELETE FROM element_formatting WHERE page_id = ? AND element_id = ?',
            [page_id, element_id]
        );

        // Добавляем запись об удалении элемента
        const deletedResult = await dbRun(
            'INSERT OR REPLACE INTO deleted_elements (page_id, element_id, deleted_at) VALUES (?, ?, datetime(\'now\'))',
            [page_id, element_id]
        );

        console.log(`Удален элемент ${element_id} со страницы ${page_id}:`);
        console.log(`- Контент: ${contentResult.changes} записей`);
        console.log(`- Форматирование: ${formattingResult.changes} записей`);
        console.log(`- Отмечен как удаленный`);

        res.json({
            success: true,
            message: 'Элемент успешно удален',
            deleted: {
                content_records: contentResult.changes,
                formatting_records: formattingResult.changes,
                deleted_records: 1
            }
        });

    } catch (error) {
        console.error('Ошибка удаления элемента:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== API ДЛЯ РЕЖИМА РЕДАКТИРОВАНИЯ =====

// Загрузка изображения
app.post('/api/upload/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Файл не загружен'
            });
        }

        const imageUrl = `/images/uploads/${req.file.filename}`;

        res.json({
            success: true,
            message: 'Изображение загружено успешно',
            imageUrl: imageUrl,
            url: imageUrl,
            filename: req.file.filename
        });

        // Фоновая генерация WebP (не блокирует ответ клиенту)
        setImmediate(() => {
            generateWebPInBackground(req.file.path, 'uploads');
        });

    } catch (error) {
        console.error('Ошибка загрузки изображения:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Загрузка видео
app.post('/api/upload/video', uploadVideo.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Видео файл не загружен'
            });
        }

        console.log('🎥 Видео загружено:', {
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

        const videoUrl = `/videos/uploads/${req.file.filename}`;

        res.json({
            success: true,
            message: 'Видео загружено успешно',
            videoUrl: videoUrl,
            url: videoUrl,
            filename: req.file.filename
        });

    } catch (error) {
        console.error('❌ Ошибка загрузки видео:', error);
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

        await dbRun(
            'DELETE FROM content_changes WHERE page_id = ? AND element_id = ?',
            [pageId, elementId]
        );

        // Также удаляем форматирование
        await dbRun(
            'DELETE FROM element_formatting WHERE page_id = ? AND element_id = ?',
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
        const rows = await dbAll(`
            SELECT DISTINCT page_id, COUNT(*) as elements_count
            FROM content_changes
            GROUP BY page_id
            ORDER BY page_id
        `);

        res.json({
            success: true,
            pages: rows
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

// ===== API ДЛЯ БЛОКОВ ПАПИРУСА =====

// Сохранение блока
app.post('/api/blocks/save', async (req, res) => {
    console.log('🔄 POST /api/blocks/save - ПОЛУЧЕН ЗАПРОС НА СОХРАНЕНИЕ БЛОКА');
    console.log('📋 Request Body:', JSON.stringify(req.body, null, 2));

    try {
        const { page_id, block_data } = req.body;

        console.log('📊 Проверка обязательных полей:');
        console.log('- page_id:', page_id);
        console.log('- block_data:', !!block_data);
        console.log('- block_data.elementId:', block_data?.elementId);
        console.log('- block_data.blockType:', block_data?.blockType);

        if (!page_id || !block_data) {
            console.error('❌ ОШИБКА: Отсутствуют обязательные поля');
            return res.status(400).json({
                success: false,
                error: 'page_id и block_data обязательны'
            });
        }

        const {
            elementId: element_id,
            blockType: block_type,
            blockCategory: block_category,
            content,
            selector,
            positionIndex: position_index = 0,
            metadata: metadata_raw = {},
            parentBlockId: parent_block_id = null,
            cssStyles: css_styles = null,
            cssClasses: css_classes = null,
            containerSelector: container_selector = '.page-content',
            beforeElementId: before_element_id = null,
            afterElementId: after_element_id = null
        } = block_data;

        // Обрабатываем метаданные
        let block_metadata = {};
        if (typeof metadata_raw === 'string') {
            try {
                block_metadata = JSON.parse(metadata_raw);
            } catch (e) {
                block_metadata = {};
            }
        } else {
            block_metadata = metadata_raw || {};
        }

        const element_type = `block_${block_type}`;

        console.log('🔍 Извлеченные данные блока:');
        console.log('- element_id:', element_id);
        console.log('- block_type:', block_type);
        console.log('- block_category:', block_category);
        console.log('- element_type:', element_type);
        console.log('- position_index:', position_index);
        console.log('- block_metadata:', block_metadata);

        if (!element_id) {
            console.error('❌ ОШИБКА: element_id обязателен');
            return res.status(400).json({
                success: false,
                error: 'element_id обязателен'
            });
        }

        console.log('💾 ВЫПОЛНЕНИЕ ЗАПРОСА К БД...');
        // Используем INSERT OR REPLACE для сохранения блока
        const result = await dbRun(`
            INSERT OR REPLACE INTO page_content (
                page_id, element_id, element_type, content, selector,
                block_type, block_category, block_metadata, parent_block_id,
                css_styles, css_classes, container_selector,
                before_element_id, after_element_id, position_index,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
            page_id, element_id, element_type, content, selector,
            block_type, block_category, JSON.stringify(block_metadata), parent_block_id,
            css_styles, css_classes, container_selector,
            before_element_id, after_element_id, position_index
        ]);

        console.log('✅ БЛОК УСПЕШНО СОХРАНЕН В БД');
        console.log('📋 Результат:', { id: result.lastID });

        res.json({
            success: true,
            message: 'Блок сохранен успешно',
            data: { id: result.lastID, page_id, element_id, block_type }
        });

    } catch (error) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА СОХРАНЕНИЯ БЛОКА:', error);
        console.error('📋 Request Body:', req.body);
        console.error('🔍 Stack Trace:', error.stack);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Получение блоков страницы
app.get('/api/blocks/:pageId', async (req, res) => {
    try {
        const { pageId } = req.params;

        const rows = await dbAll(`
            SELECT * FROM page_content
            WHERE page_id = ? AND block_type IS NOT NULL
            ORDER BY position_index ASC, created_at ASC
        `, [pageId]);

        res.json({
            success: true,
            data: rows.map(row => ({
                ...row,
                block_metadata: typeof row.block_metadata === 'string'
                    ? JSON.parse(row.block_metadata)
                    : row.block_metadata
            }))
        });

    } catch (error) {
        console.error('Ошибка получения блоков:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Удаление блока
app.delete('/api/blocks/delete', async (req, res) => {
    try {
        const { page_id, element_id } = req.body;

        if (!page_id || !element_id) {
            return res.status(400).json({
                success: false,
                error: 'page_id и element_id обязательны'
            });
        }

        const deleteQuery = `
            DELETE FROM page_content
            WHERE page_id = ? AND element_id = ? AND block_type IS NOT NULL
        `;

        const result = await dbRun(deleteQuery, [page_id, element_id]);

        res.json({
            success: true,
            message: 'Блок удален',
            deleted_rows: result.changes,
            page_id: page_id,
            element_id: element_id
        });

    } catch (error) {
        console.error('Ошибка удаления блока:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при удалении блока',
            details: error.message
        });
    }
});

if (require.main === module) {
    startServer().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = {
    app,
    startServer
};
