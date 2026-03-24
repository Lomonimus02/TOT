const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_mE67QfaoVbGj@ep-rough-term-a92qmgeu-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkContent() {
    try {
        console.log('Checking content for programs page...\n');
        
        const result = await pool.query(
            `SELECT page_id, element_id, content 
             FROM content_changes 
             WHERE page_id LIKE '%program%'
             ORDER BY updated_at DESC`
        );
        
        console.log(`Found ${result.rows.length} records:\n`);
        result.rows.forEach(row => {
            console.log(`Page: ${row.page_id}`);
            console.log(`Element: ${row.element_id}`);
            console.log(`Content: ${row.content.substring(0, 100)}...`);
            console.log('---');
        });
        
        // Also check page_content table
        const result2 = await pool.query(
            `SELECT page_id, element_id, content 
             FROM page_content 
             WHERE page_id LIKE '%program%'
             ORDER BY updated_at DESC`
        );
        
        console.log(`\nFound ${result2.rows.length} records in page_content:\n`);
        result2.rows.forEach(row => {
            console.log(`Page: ${row.page_id}`);
            console.log(`Element: ${row.element_id}`);
            console.log(`Content: ${row.content ? row.content.substring(0, 100) : 'NULL'}...`);
            console.log('---');
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkContent();