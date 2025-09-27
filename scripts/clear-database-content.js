/**
 * Скрипт для очистки всего контента из базы данных
 * Удаляет все записи из таблиц content_changes, element_formatting и deleted_elements
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_mE67QfaoVbGj@ep-rough-term-a92qmgeu-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: {
        rejectUnauthorized: false
    }
});

async function clearAllContent() {
    try {
        console.log('🗑️ Начинаем полную очистку базы данных от всего контента...');

        // Сначала проверим, что есть в таблицах
        const contentCheck = await pool.query('SELECT COUNT(*) FROM content_changes');
        const formattingCheck = await pool.query('SELECT COUNT(*) FROM element_formatting');
        const deletedCheck = await pool.query('SELECT COUNT(*) FROM deleted_elements');

        console.log(`📊 Найдено записей:`);
        console.log(`   - content_changes: ${contentCheck.rows[0].count}`);
        console.log(`   - element_formatting: ${formattingCheck.rows[0].count}`);
        console.log(`   - deleted_elements: ${deletedCheck.rows[0].count}`);

        // Очищаем таблицу content_changes
        const contentResult = await pool.query('DELETE FROM content_changes');
        console.log(`✅ Удалено записей из content_changes: ${contentResult.rowCount}`);

        // Очищаем таблицу element_formatting
        const formattingResult = await pool.query('DELETE FROM element_formatting');
        console.log(`✅ Удалено записей из element_formatting: ${formattingResult.rowCount}`);

        // Очищаем таблицу deleted_elements
        const deletedResult = await pool.query('DELETE FROM deleted_elements');
        console.log(`✅ Удалено записей из deleted_elements: ${deletedResult.rowCount}`);

        // Также очистим таблицу content_pages если она есть
        try {
            const pagesResult = await pool.query('DELETE FROM content_pages');
            console.log(`✅ Удалено записей из content_pages: ${pagesResult.rowCount}`);
        } catch (err) {
            console.log('ℹ️ Таблица content_pages не найдена или пуста');
        }

        console.log('🎉 Полная очистка базы данных завершена успешно!');
        console.log('Теперь все страницы будут отображаться без динамически загружаемого контента.');

    } catch (error) {
        console.error('❌ Ошибка при очистке базы данных:', error);
    } finally {
        await pool.end();
    }
}

// Запускаем очистку
clearAllContent();
