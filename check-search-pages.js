const db = require('better-sqlite3')('./server/content.db');

console.log('📊 Страницы в базе данных (page_content):');
const pages = db.prepare('SELECT DISTINCT page_id, COUNT(*) as count FROM page_content GROUP BY page_id ORDER BY page_id').all();
pages.forEach(p => {
    console.log(`  - ${p.page_id}: ${p.count} элементов`);
});

console.log('\n📊 Страницы в базе данных (content_changes):');
const changes = db.prepare('SELECT DISTINCT page_id, COUNT(*) as count FROM content_changes GROUP BY page_id ORDER BY page_id').all();
changes.forEach(p => {
    console.log(`  - ${p.page_id}: ${p.count} элементов`);
});

console.log('\n🔍 Контент со страницы "home":');
const homeContent = db.prepare('SELECT element_id, content FROM page_content WHERE page_id = ? LIMIT 5').all('home');
homeContent.forEach(c => {
    console.log(`  - ${c.element_id}: ${c.content.substring(0, 100)}...`);
});

