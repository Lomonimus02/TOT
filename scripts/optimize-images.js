/**
 * Оптимизация изображений для быстрой загрузки
 * 
 * Создаёт:
 * 1. WebP версии (сжатие ~80-90% от PNG)
 * 2. LQIP (Low Quality Image Placeholders) — крошечные размытые превью (20px ширина, base64)
 * 3. Оптимизированные версии разных размеров для srcset
 * 
 * Запуск: node scripts/optimize-images.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'images');
const OPTIMIZED_DIR = path.join(IMAGES_DIR, 'optimized');
const LQIP_JSON = path.join(OPTIMIZED_DIR, 'lqip-data.json');

// Конфигурация качества
const CONFIG = {
    webp: {
        quality: 80,        // Хороший баланс качества/размера
        effort: 6           // Уровень сжатия (0-6)
    },
    // Размеры для responsive srcset
    sizes: [400, 800, 1200],
    // LQIP — крошечный placeholder
    lqip: {
        width: 20,          // 20px ширина → ~300-500 байт base64
        quality: 20,
        blur: 10
    }
};

// Папки для сканирования
const SCAN_DIRS = ['uploads', 'decor', 'backgrounds'];

// Расширения для обработки
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

async function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

async function getImageFiles() {
    const files = [];
    for (const subdir of SCAN_DIRS) {
        const fullDir = path.join(IMAGES_DIR, subdir);
        if (!fs.existsSync(fullDir)) continue;

        const entries = fs.readdirSync(fullDir);
        for (const entry of entries) {
            const ext = path.extname(entry).toLowerCase();
            if (IMAGE_EXTENSIONS.includes(ext)) {
                files.push({
                    subdir,
                    name: entry,
                    basename: path.basename(entry, ext),
                    fullPath: path.join(fullDir, entry),
                    relativePath: `images/${subdir}/${entry}`
                });
            }
        }
    }
    return files;
}

async function generateLQIP(inputPath) {
    const buffer = await sharp(inputPath)
        .resize(CONFIG.lqip.width, null, { fit: 'inside' })
        .blur(CONFIG.lqip.blur)
        .webp({ quality: CONFIG.lqip.quality })
        .toBuffer();

    return `data:image/webp;base64,${buffer.toString('base64')}`;
}

async function optimizeImage(file) {
    const outputDir = path.join(OPTIMIZED_DIR, file.subdir);
    await ensureDir(outputDir);

    const results = {
        original: file.relativePath,
        originalSize: fs.statSync(file.fullPath).size,
        webp: {},
        lqip: null
    };

    const metadata = await sharp(file.fullPath).metadata();
    const originalWidth = metadata.width;

    // 1. Генерация LQIP
    try {
        results.lqip = await generateLQIP(file.fullPath);
        console.log(`  ✓ LQIP: ${file.name} (${results.lqip.length} символов base64)`);
    } catch (e) {
        console.error(`  ✗ LQIP ошибка: ${file.name}`, e.message);
    }

    // 2. WebP полный размер
    const webpFullPath = path.join(outputDir, `${file.basename}.webp`);
    try {
        await sharp(file.fullPath)
            .webp(CONFIG.webp)
            .toFile(webpFullPath);

        const webpSize = fs.statSync(webpFullPath).size;
        results.webp.full = {
            path: `images/optimized/${file.subdir}/${file.basename}.webp`,
            size: webpSize,
            savings: Math.round((1 - webpSize / results.originalSize) * 100)
        };
        console.log(`  ✓ WebP: ${file.basename}.webp (${Math.round(webpSize / 1024)}KB, -${results.webp.full.savings}%)`);
    } catch (e) {
        console.error(`  ✗ WebP ошибка: ${file.name}`, e.message);
    }

    // 3. Responsive размеры (только для больших изображений)
    for (const targetWidth of CONFIG.sizes) {
        if (originalWidth <= targetWidth) continue;

        const resizedPath = path.join(outputDir, `${file.basename}-${targetWidth}w.webp`);
        try {
            await sharp(file.fullPath)
                .resize(targetWidth, null, { fit: 'inside', withoutEnlargement: true })
                .webp(CONFIG.webp)
                .toFile(resizedPath);

            const resizedSize = fs.statSync(resizedPath).size;
            results.webp[`${targetWidth}w`] = {
                path: `images/optimized/${file.subdir}/${file.basename}-${targetWidth}w.webp`,
                size: resizedSize
            };
            console.log(`  ✓ WebP ${targetWidth}w: ${Math.round(resizedSize / 1024)}KB`);
        } catch (e) {
            console.error(`  ✗ Resize ${targetWidth}w ошибка: ${file.name}`, e.message);
        }
    }

    return results;
}

async function main() {
    console.log('🖼️  Оптимизация изображений для "Пирамида ТОТА"');
    console.log('='.repeat(55));

    await ensureDir(OPTIMIZED_DIR);

    const files = await getImageFiles();
    console.log(`\nНайдено ${files.length} изображений для обработки\n`);

    const lqipData = {};
    let totalOriginal = 0;
    let totalOptimized = 0;

    for (const file of files) {
        console.log(`\n📷 ${file.relativePath}`);
        try {
            const result = await optimizeImage(file);

            totalOriginal += result.originalSize;
            if (result.webp.full) {
                totalOptimized += result.webp.full.size;
            }

            // Сохраняем LQIP данные по относительному пути
            if (result.lqip) {
                lqipData[result.original] = {
                    lqip: result.lqip,
                    webp: result.webp.full ? result.webp.full.path : null,
                    srcset: Object.entries(result.webp)
                        .filter(([key]) => key.endsWith('w'))
                        .map(([key, val]) => `${val.path} ${key}`)
                        .join(', ')
                };
            }
        } catch (e) {
            console.error(`  ✗ Фатальная ошибка: ${file.name}`, e.message);
        }
    }

    // Сохраняем JSON с LQIP данными
    fs.writeFileSync(LQIP_JSON, JSON.stringify(lqipData, null, 2));
    console.log(`\n✅ LQIP данные сохранены: ${LQIP_JSON}`);

    // Итого
    console.log('\n' + '='.repeat(55));
    console.log(`📊 ИТОГО:`);
    console.log(`   Оригинал:      ${(totalOriginal / 1024 / 1024).toFixed(1)} МБ`);
    console.log(`   Оптимизировано: ${(totalOptimized / 1024 / 1024).toFixed(1)} МБ`);
    console.log(`   Экономия:      ${((1 - totalOptimized / totalOriginal) * 100).toFixed(1)}%`);
    console.log('='.repeat(55));
}

main().catch(console.error);
