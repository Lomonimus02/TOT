const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addTestFormatting() {
    try {
        console.log('🧪 Добавляем тестовое форматирование...');
        
        // Получаем существующие элементы из content_changes
        const contentResult = await pool.query(
            'SELECT * FROM content_changes WHERE page_id = $1',
            ['pyramid']
        );
        
        console.log(`📋 Найдено ${contentResult.rows.length} элементов контента для pyramid`);
        
        if (contentResult.rows.length === 0) {
            console.log('❌ Нет элементов контента для добавления форматирования');
            return;
        }
        
        // Добавляем тестовое форматирование для первого элемента
        const firstElement = contentResult.rows[0];
        console.log(`🎯 Добавляем форматирование для элемента:`, firstElement);
        
        const testFormatting = {
            page_id: 'pyramid',
            element_id: firstElement.element_id,
            css_classes: ['font-size-32', 'text-align-center', 'font-weight-bold'],
            font_size: '32',
            text_color: null,
            text_align: 'center',
            font_weight: 'bold',
            font_style: null
        };
        
        // Вставляем тестовое форматирование
        const result = await pool.query(`
            INSERT INTO element_formatting (page_id, element_id, css_classes, font_size, text_color, text_align, font_weight, font_style)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
        `, [
            testFormatting.page_id,
            testFormatting.element_id,
            testFormatting.css_classes,
            testFormatting.font_size,
            testFormatting.text_color,
            testFormatting.text_align,
            testFormatting.font_weight,
            testFormatting.font_style
        ]);
        
        console.log('✅ Тестовое форматирование добавлено:', result.rows[0]);
        
        // Проверяем, что данные сохранились
        const checkResult = await pool.query(
            'SELECT * FROM element_formatting WHERE page_id = $1',
            ['pyramid']
        );
        
        console.log(`📊 Всего записей форматирования для pyramid: ${checkResult.rows.length}`);
        checkResult.rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.element_id}: ${row.css_classes.join(', ')}`);
        });
        
    } catch (error) {
        console.error('❌ Ошибка добавления тестового форматирования:', error);
    } finally {
        await pool.end();
    }
}

addTestFormatting();
