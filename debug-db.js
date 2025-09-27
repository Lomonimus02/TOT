const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Подключение к базе данных
const dbPath = path.join(__dirname, 'server', 'content.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Проверка содержимого базы данных...');

// Проверяем структуру таблицы
db.all("PRAGMA table_info(page_content)", (err, rows) => {
    if (err) {
        console.error('❌ Ошибка получения структуры таблицы:', err);
        return;
    }
    
    console.log('\n📋 Структура таблицы page_content:');
    rows.forEach(row => {
        console.log(`  ${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULL'}`);
    });
});

// Проверяем все записи
db.all("SELECT * FROM page_content", (err, rows) => {
    if (err) {
        console.error('❌ Ошибка получения данных:', err);
        return;
    }
    
    console.log(`\n📊 Всего записей в таблице: ${rows.length}`);
    
    if (rows.length > 0) {
        console.log('\n📝 Все записи:');
        rows.forEach((row, index) => {
            console.log(`\n--- Запись ${index + 1} ---`);
            console.log(`ID: ${row.id}`);
            console.log(`Page ID: ${row.page_id}`);
            console.log(`Element ID: ${row.element_id}`);
            console.log(`Element Type: ${row.element_type}`);
            console.log(`Block Type: ${row.block_type}`);
            console.log(`Block Category: ${row.block_category}`);
            console.log(`Content: ${row.content ? row.content.substring(0, 100) + '...' : 'NULL'}`);
            console.log(`Position Index: ${row.position_index}`);
            console.log(`CSS Classes: ${row.css_classes}`);
            console.log(`Container Selector: ${row.container_selector}`);
            console.log(`Created At: ${row.created_at}`);
            console.log(`Updated At: ${row.updated_at}`);
        });
    }
});

// Проверяем только блоки
db.all("SELECT * FROM page_content WHERE block_type IS NOT NULL", (err, rows) => {
    if (err) {
        console.error('❌ Ошибка получения блоков:', err);
        return;
    }
    
    console.log(`\n🧱 Блоков в базе: ${rows.length}`);
    
    if (rows.length > 0) {
        console.log('\n📦 Блоки:');
        rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ${row.block_type} (${row.block_category}) - Page: ${row.page_id}, Element: ${row.element_id}`);
        });
    }
});

// Закрываем соединение через 2 секунды
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error('❌ Ошибка закрытия БД:', err);
        } else {
            console.log('\n✅ Соединение с БД закрыто');
        }
    });
}, 2000);
