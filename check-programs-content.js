const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'content.db');
const db = new sqlite3.Database(dbPath);

function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function checkContent() {
    try {
        console.log('Checking content for programs page...\n');
        
        const rows = await dbAll(
            `SELECT page_id, element_id, content 
             FROM content_changes 
             WHERE page_id LIKE '%program%'
             ORDER BY updated_at DESC`
        );
        
        console.log(`Found ${rows.length} records:\n`);
        rows.forEach(row => {
            console.log(`Page: ${row.page_id}`);
            console.log(`Element: ${row.element_id}`);
            console.log(`Content: ${row.content.substring(0, 100)}...`);
            console.log('---');
        });
        
        // Also check page_content table
        const rows2 = await dbAll(
            `SELECT page_id, element_id, content 
             FROM page_content 
             WHERE page_id LIKE '%program%'
             ORDER BY updated_at DESC`
        );
        
        console.log(`\nFound ${rows2.length} records in page_content:\n`);
        rows2.forEach(row => {
            console.log(`Page: ${row.page_id}`);
            console.log(`Element: ${row.element_id}`);
            console.log(`Content: ${row.content ? row.content.substring(0, 100) : 'NULL'}...`);
            console.log('---');
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        db.close();
    }
}

checkContent();