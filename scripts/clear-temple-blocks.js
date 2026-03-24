/**
 * Скрипт для очистки старых блоков со страницы temple
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'server', 'content.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Ошибка подключения к БД:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Подключение к БД установлено');
    }
});

// Удаляем все блоки со страницы temple
db.run(`DELETE FROM page_content WHERE page_id = ?`, ['temple'], function(err) {
    if (err) {
        console.error('❌ Ошибка удаления блоков:', err.message);
    } else {
        console.log(`✅ Удалено ${this.changes} записей для страницы temple`);
    }
    
    db.close((err) => {
        if (err) {
            console.error('❌ Ошибка закрытия БД:', err.message);
        } else {
            console.log('✅ Соединение с БД закрыто');
        }
    });
});

