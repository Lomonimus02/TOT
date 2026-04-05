const fs = require('fs');
const path = require('path');

// SVG icons
const VK_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.12-5.339-3.202-2.17-3.042-2.763-5.32-2.763-5.778 0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.864 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.27-1.422 2.17-3.625 2.17-3.625.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/></svg>`;

const TG_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`;

const RUTUBE_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm-2 16.5v-9l7 4.5-7 4.5z"/></svg>`;

const MAX_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zM7 17V7h2l3 5 3-5h2v10h-2v-6.5L12.5 13h-1L9 10.5V17H7z"/></svg>`;

const newSocialBlock = `<div class="social-links">
                    <a href="https://vk.com/club187535764" class="social-link" target="_blank" title="ВКонтакте">
                        ${VK_SVG}
                    </a>
                    <a href="https://t.me/piramidatota" class="social-link" target="_blank" title="Телеграм">
                        ${TG_SVG}
                    </a>
                    <a href="https://rutube.ru/channel/42454841" class="social-link" target="_blank" title="РуТуб">
                        ${RUTUBE_SVG}
                    </a>
                    <a href="https://maxln.ru/YcxBcz" class="social-link" target="_blank" title="Max">
                        ${MAX_SVG}
                    </a>
                </div>`;

// Regex to match the old social-links block (with img tags, any image path)
const socialBlockRegex = /<div class="social-links">\s*<a href="https:\/\/vk\.com\/club187535764"[\s\S]*?<\/a>\s*<a href="https:\/\/t\.me\/piramidatota"[\s\S]*?<\/a>\s*<a href="https:\/\/rutube\.ru\/channel\/42454841"[\s\S]*?<\/a>\s*<\/div>/g;

// Files to update
const files = [
    path.join(__dirname, '..', 'index.html'),
    ...fs.readdirSync(path.join(__dirname, '..', 'pages'))
        .filter(f => f.endsWith('.html'))
        .map(f => path.join(__dirname, '..', 'pages', f))
];

let updated = 0;
let skipped = 0;

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    if (socialBlockRegex.test(content)) {
        socialBlockRegex.lastIndex = 0; // reset regex
        const newContent = content.replace(socialBlockRegex, newSocialBlock);
        fs.writeFileSync(file, newContent, 'utf-8');
        console.log(`✓ Updated: ${path.relative(path.join(__dirname, '..'), file)}`);
        updated++;
    } else {
        console.log(`⚠ Skipped (no match): ${path.relative(path.join(__dirname, '..'), file)}`);
        skipped++;
    }
});

console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
