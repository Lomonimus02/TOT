/**
 * 📊 Скрипт миграции данных из облачной PostgreSQL (Neon) в локальную SQLite
 * 
 * Использование:
 *   node migrate-from-neon.js "postgresql://user:password@ep-xxx.region.neon.tech/neondb?sslmode=require"
 * 
 * Скрипт:
 * 1. Подключается к Neon PostgreSQL
 * 2. Читает все данные из всех таблиц
 * 3. Записывает их в локальную SQLite (server/content.db)
 * 4. Выводит отчёт о перенесённых данных
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Получаем DATABASE_URL из аргумента или переменной окружения
const DATABASE_URL = process.argv[2] || process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ Ошибка: не указан DATABASE_URL');
    console.error('');
    console.error('Использование:');
    console.error('  node migrate-from-neon.js "postgresql://user:password@host/database?sslmode=require"');
    console.error('');
    console.error('Или через переменную окружения:');
    console.error('  set DATABASE_URL=postgresql://...');
    console.error('  node migrate-from-neon.js');
    process.exit(1);
}

console.log('🚀 Миграция данных из Neon PostgreSQL в локальную SQLite');
console.log('=========================================================\n');

// Таблицы для миграции и их колонки
const TABLES = [
    {
        name: 'users',
        columns: ['id', 'name', 'email', 'password', 'role', 'created_at', 'updated_at'],
        createSQL: `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
    },
    {
        name: 'contact_forms',
        columns: ['id', 'name', 'email', 'phone', 'message', 'status', 'created_at'],
        createSQL: `
            CREATE TABLE IF NOT EXISTS contact_forms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                message TEXT NOT NULL,
                status TEXT DEFAULT 'new',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
    },
    {
        name: 'newsletter_subscriptions',
        columns: ['id', 'email', 'status', 'created_at'],
        createSQL: `
            CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
    },
    {
        name: 'program_bookings',
        columns: ['id', 'name', 'email', 'phone', 'program', 'date', 'message', 'status', 'created_at'],
        createSQL: `
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
            )`
    },
    {
        name: 'content_pages',
        columns: ['id', 'page_name', 'title', 'content', 'meta_description', 'updated_by', 'updated_at'],
        createSQL: `
            CREATE TABLE IF NOT EXISTS content_pages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page_name TEXT UNIQUE NOT NULL,
                title TEXT,
                content TEXT,
                meta_description TEXT,
                updated_by INTEGER REFERENCES users(id),
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
    },
    {
        name: 'content_changes',
        columns: ['id', 'page_id', 'element_id', 'element_type', 'content', 'selector', 'updated_at'],
        createSQL: `
            CREATE TABLE IF NOT EXISTS content_changes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page_id TEXT NOT NULL,
                element_id TEXT NOT NULL,
                element_type TEXT,
                content TEXT,
                selector TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(page_id, element_id)
            )`
    },
    {
        name: 'element_formatting',
        columns: ['id', 'page_id', 'element_id', 'css_classes', 'font_size', 'text_color', 'text_align', 'font_weight', 'font_style', 'created_at', 'updated_at'],
        createSQL: `
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
            )`
    },
    {
        name: 'deleted_elements',
        columns: ['id', 'page_id', 'element_id', 'deleted_at'],
        createSQL: `
            CREATE TABLE IF NOT EXISTS deleted_elements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page_id TEXT NOT NULL,
                element_id TEXT NOT NULL,
                deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(page_id, element_id)
            )`
    },
    {
        name: 'page_content',
        columns: ['id', 'page_id', 'element_id', 'element_type', 'content', 'selector', 'block_type', 'block_category', 'block_metadata', 'parent_block_id', 'css_styles', 'css_classes', 'container_selector', 'before_element_id', 'after_element_id', 'position_index', 'created_at', 'updated_at'],
        createSQL: `
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
            )`
    }
];

// Промисификация SQLite
function sqliteRun(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function sqliteAll(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function migrate() {
    let pgClient;
    let sqliteDb;

    try {
        // ======= Шаг 1: Подключение к PostgreSQL =======
        console.log('📡 Подключение к Neon PostgreSQL...');

        let pg;
        try {
            pg = require('pg');
        } catch (e) {
            console.log('📦 Пакет pg не установлен. Устанавливаю временно...');
            const { execSync } = require('child_process');
            execSync('npm install pg --no-save', { stdio: 'inherit' });
            pg = require('pg');
        }

        const { Client } = pg;
        pgClient = new Client({
            connectionString: DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await pgClient.connect();
        console.log('✅ Подключение к PostgreSQL установлено\n');

        // ======= Шаг 2: Подключение к SQLite =======
        const DB_PATH = path.join(__dirname, 'server', 'content.db');
        console.log(`📁 Подключение к SQLite: ${DB_PATH}`);

        sqliteDb = new sqlite3.Database(DB_PATH);
        await sqliteRun(sqliteDb, 'PRAGMA journal_mode=WAL');
        await sqliteRun(sqliteDb, 'PRAGMA foreign_keys=OFF'); // Отключаем на время миграции
        console.log('✅ Подключение к SQLite установлено\n');

        // ======= Шаг 3: Создание таблиц =======
        console.log('🔧 Создание таблиц в SQLite...');
        for (const table of TABLES) {
            await sqliteRun(sqliteDb, table.createSQL);
        }
        console.log('✅ Таблицы созданы\n');

        // ======= Шаг 4: Миграция данных =======
        console.log('📊 Начинаем перенос данных...');
        console.log('─'.repeat(60));

        const report = [];
        let totalRows = 0;

        for (const table of TABLES) {
            try {
                // Проверяем, существует ли таблица в PostgreSQL
                const tableCheck = await pgClient.query(
                    `SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = $1
                    )`,
                    [table.name]
                );

                if (!tableCheck.rows[0].exists) {
                    console.log(`  ⏭️  ${table.name}: таблица не найдена в PostgreSQL — пропускаем`);
                    report.push({ table: table.name, rows: 0, status: 'skipped' });
                    continue;
                }

                // Получаем данные из PostgreSQL
                const pgResult = await pgClient.query(`SELECT * FROM ${table.name} ORDER BY id`);
                const rows = pgResult.rows;

                if (rows.length === 0) {
                    console.log(`  📭 ${table.name}: пустая таблица`);
                    report.push({ table: table.name, rows: 0, status: 'empty' });
                    continue;
                }

                // Очищаем таблицу в SQLite перед вставкой
                await sqliteRun(sqliteDb, `DELETE FROM ${table.name}`);

                // Вставляем данные в SQLite
                await sqliteRun(sqliteDb, 'BEGIN TRANSACTION');

                let insertedCount = 0;
                for (const row of rows) {
                    // Определяем колонки, которые реально есть в данных
                    const availableColumns = table.columns.filter(col => col in row);
                    const values = availableColumns.map(col => {
                        const val = row[col];
                        // Преобразуем PostgreSQL массивы в JSON строки для SQLite
                        if (Array.isArray(val)) {
                            return JSON.stringify(val);
                        }
                        // Преобразуем объекты в JSON
                        if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
                            return JSON.stringify(val);
                        }
                        // Преобразуем Date в строку
                        if (val instanceof Date) {
                            return val.toISOString();
                        }
                        return val;
                    });

                    const placeholders = availableColumns.map(() => '?').join(', ');
                    const columnNames = availableColumns.join(', ');

                    try {
                        await sqliteRun(
                            sqliteDb,
                            `INSERT OR REPLACE INTO ${table.name} (${columnNames}) VALUES (${placeholders})`,
                            values
                        );
                        insertedCount++;
                    } catch (insertErr) {
                        console.error(`    ⚠️  Ошибка вставки строки id=${row.id}: ${insertErr.message}`);
                    }
                }

                await sqliteRun(sqliteDb, 'COMMIT');

                console.log(`  ✅ ${table.name}: ${insertedCount} записей перенесено`);
                report.push({ table: table.name, rows: insertedCount, status: 'ok' });
                totalRows += insertedCount;

            } catch (tableErr) {
                console.error(`  ❌ ${table.name}: ошибка — ${tableErr.message}`);
                report.push({ table: table.name, rows: 0, status: 'error', error: tableErr.message });
                // Откатываем транзакцию если была ошибка
                try { await sqliteRun(sqliteDb, 'ROLLBACK'); } catch (e) {}
            }
        }

        // ======= Шаг 5: Включаем foreign keys обратно =======
        await sqliteRun(sqliteDb, 'PRAGMA foreign_keys=ON');

        // ======= Отчёт =======
        console.log('\n' + '═'.repeat(60));
        console.log('📊 ОТЧЁТ О МИГРАЦИИ');
        console.log('═'.repeat(60));
        console.log('');

        const maxNameLen = Math.max(...report.map(r => r.table.length));
        for (const r of report) {
            const icon = r.status === 'ok' ? '✅' : r.status === 'empty' ? '📭' : r.status === 'skipped' ? '⏭️ ' : '❌';
            const rows = String(r.rows).padStart(5);
            console.log(`  ${icon} ${r.table.padEnd(maxNameLen + 2)} ${rows} записей`);
        }

        console.log('');
        console.log(`  📊 Всего перенесено: ${totalRows} записей`);
        console.log(`  📁 База данных: ${path.join(__dirname, 'server', 'content.db')}`);
        console.log('');
        console.log('✅ Миграция завершена успешно!');
        console.log('');
        console.log('Теперь можно запустить сервер:');
        console.log('  npm start');

    } catch (error) {
        console.error('\n❌ Критическая ошибка миграции:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        // Закрываем соединения
        if (pgClient) {
            try { await pgClient.end(); } catch (e) {}
        }
        if (sqliteDb) {
            sqliteDb.close();
        }
    }
}

migrate();
