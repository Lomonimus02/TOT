/**
 * Миграция: извлечение base64 изображений из контента БД
 * Сохраняет их как файлы в images/uploads/ и заменяет на URL
 * 
 * Запуск: node scripts/extract-base64-images.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'server', 'content.db');
const UPLOADS_DIR = path.join(__dirname, '..', 'images', 'uploads');

// Убедимся что папка uploads существует
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
}

function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) { err ? reject(err) : resolve(this); });
    });
}

/**
 * Извлекает base64 из src="data:image/..." и сохраняет как файл
 */
function extractBase64Image(base64DataUrl) {
    // data:image/png;base64,iVBOR... или data:image/jpeg;base64,...
    const match = base64DataUrl.match(/^data:image\/([\w+]+);base64,(.+)$/);
    if (!match) return null;

    let ext = match[1].toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';
    if (ext === 'svg+xml') ext = 'svg';

    const buffer = Buffer.from(match[2], 'base64');

    // Генерируем уникальное имя файла по хешу содержимого (дедупликация)
    const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 12);
    const filename = `extracted-${hash}.${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    // Если файл уже существует (дедупликация) — не перезаписываем
    if (!fs.existsSync(filepath)) {
        fs.writeFileSync(filepath, buffer);
        console.log(`  💾 Сохранён: ${filename} (${(buffer.length / 1024).toFixed(1)} КБ)`);
    } else {
        console.log(`  ♻️ Дубликат: ${filename} (уже существует)`);
    }

    return `/images/uploads/${filename}`;
}

/**
 * Заменяет все base64 изображения в HTML контенте на URL
 */
function replaceBase64InContent(content) {
    let count = 0;
    let savedBytes = 0;

    const newContent = content.replace(
        /src="(data:image\/[^"]+)"/g,
        (fullMatch, dataUrl) => {
            const originalLength = fullMatch.length;
            const url = extractBase64Image(dataUrl);
            if (url) {
                count++;
                savedBytes += originalLength - `src="${url}"`.length;
                return `src="${url}"`;
            }
            return fullMatch; // Если не удалось — оставляем как есть
        }
    );

    return { newContent, count, savedBytes };
}

async function main() {
    console.log('🔍 Поиск записей с base64 изображениями...\n');

    const rows = await dbAll(
        `SELECT id, page_id, element_id, content, length(content) as size_bytes 
         FROM page_content 
         WHERE content LIKE '%data:image%' 
         ORDER BY size_bytes DESC`
    );

    if (rows.length === 0) {
        console.log('✅ Base64 изображений не найдено. Миграция не нужна.');
        db.close();
        return;
    }

    console.log(`📊 Найдено ${rows.length} записей с base64 изображениями:\n`);

    let totalSaved = 0;
    let totalImages = 0;

    for (const row of rows) {
        console.log(`\n📄 ${row.page_id}/${row.element_id} (${(row.size_bytes / 1024 / 1024).toFixed(1)} МБ)`);

        const { newContent, count, savedBytes } = replaceBase64InContent(row.content);

        if (count > 0) {
            // Обновляем запись в БД
            await dbRun(
                `UPDATE page_content SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [newContent, row.id]
            );

            totalImages += count;
            totalSaved += savedBytes;

            console.log(`  ✅ Извлечено ${count} изображений`);
            console.log(`  📉 Размер: ${(row.size_bytes / 1024 / 1024).toFixed(1)} МБ → ${(newContent.length / 1024).toFixed(0)} КБ`);
        }
    }

    console.log('\n' + '='.join ? '='.repeat(55) : '='.repeat(55));
    console.log(`📊 ИТОГО:`);
    console.log(`   Извлечено изображений: ${totalImages}`);
    console.log(`   Экономия в БД: ${(totalSaved / 1024 / 1024).toFixed(1)} МБ`);
    console.log('='.repeat(55));

    // Сжатие БД после удаления большого объема данных
    console.log('\n🗜️ Сжатие базы данных (VACUUM)...');
    await dbRun('VACUUM');
    console.log('✅ База данных сжата');

    db.close();
    console.log('\n🎉 Миграция завершена! Перезапустите сервер: pm2 restart pyramid-tota');
}

main().catch(err => {
    console.error('❌ Ошибка:', err);
    db.close();
    process.exit(1);
});
