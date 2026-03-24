// Script to check database content
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'content.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking database content...\n');

// Check total records
db.get('SELECT COUNT(*) as count FROM page_content', (err, row) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    console.log(`Total records in database: ${row.count}\n`);
    
    if (row.count > 0) {
        // Show sample records
        db.all('SELECT page_id, element_id, SUBSTR(content, 1, 100) as content_preview, block_type FROM page_content LIMIT 10', (err, rows) => {
            if (err) {
                console.error('Error:', err);
                return;
            }
            
            console.log('Sample records:');
            console.log('================');
            rows.forEach((row, index) => {
                console.log(`\n${index + 1}. Page: ${row.page_id}`);
                console.log(`   Element: ${row.element_id}`);
                console.log(`   Block Type: ${row.block_type || 'N/A'}`);
                console.log(`   Content: ${row.content_preview}...`);
            });
            
            // Show pages with content
            db.all('SELECT page_id, COUNT(*) as count FROM page_content GROUP BY page_id', (err, rows) => {
                if (err) {
                    console.error('Error:', err);
                    db.close();
                    return;
                }
                
                console.log('\n\nContent by page:');
                console.log('================');
                rows.forEach(row => {
                    console.log(`${row.page_id}: ${row.count} items`);
                });
                
                db.close();
            });
        });
    } else {
        console.log('Database is empty. No content has been saved yet.');
        db.close();
    }
});