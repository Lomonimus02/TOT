/**
 * Скрипт для очистки всего контента из локальной SQLite базы данных
 * Удаляет все записи из таблиц content_changes, element_formatting и deleted_elements
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'server', 'content.db');
const db = new sqlite3.Database(dbPath);

function dbRun(sql) {
    return new Promise((resolve, reject) => {
        db.run(sql, function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
        });
    });
}

function dbGet(sql) {
    return new Promise((resolve, reject) => {
        db.get(sql, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

async function clearAllContent() {
    try {
        console.log('🗑️ Начинаем полную очистку базы данных от всего контента...');

        // Сначала проверим, что есть в таблицах
        const contentCheck = await dbGet('SELECT COUNT(*) as count FROM content_changes');
        const formattingCheck = await dbGet('SELECT COUNT(*) as count FROM element_formatting');
        const deletedCheck = await dbGet('SELECT COUNT(*) as count FROM deleted_elements');

        console.log(`📊 Найдено записей:`);
        console.log(`   - content_changes: ${contentCheck.count}`);
        console.log(`   - element_formatting: ${formattingCheck.count}`);
        console.log(`   - deleted_elements: ${deletedCheck.count}`);

        // Очищаем таблицу content_changes
        const contentResult = await dbRun('DELETE FROM content_changes');
        console.log(`✅ Удалено записей из content_changes: ${contentResult.changes}`);

        // Очищаем таблицу element_formatting
        const formattingResult = await dbRun('DELETE FROM element_formatting');
        console.log(`✅ Удалено записей из element_formatting: ${formattingResult.changes}`);

        // Очищаем таблицу deleted_elements
        const deletedResult = await dbRun('DELETE FROM deleted_elements');
        console.log(`✅ Удалено записей из deleted_elements: ${deletedResult.changes}`);

        // Также очистим таблицу content_pages если она есть
        try {
            const pagesResult = await dbRun('DELETE FROM content_pages');
            console.log(`✅ Удалено записей из content_pages: ${pagesResult.changes}`);
        } catch (err) {
            console.log('ℹ️ Таблица content_pages не найдена или пуста');
        }

        console.log('🎉 Полная очистка базы данных завершена успешно!');
        console.log('Теперь все страницы будут отображаться без динамически загружаемого контента.');

    } catch (error) {
        console.error('❌ Ошибка при очистке базы данных:', error);
    } finally {
        db.close();
    }
}

// Запускаем очистку
clearAllContent();
