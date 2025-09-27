// Система блоков "Конструктор Пирамиды"
// Отдельный файл для избежания конфликтов

// Библиотека блоков
const BLOCKS_LIBRARY = {
    text: {
        name: '📝 Текстовые блоки',
        icon: '📝',
        blocks: [
            {
                id: 'heading-h2',
                name: 'Заголовок H2',
                icon: '🏷️',
                description: 'Крупный заголовок раздела',
                template: '<h2 class="content-heading">Новый заголовок</h2>',
                preview: 'Новый заголовок'
            },
            {
                id: 'heading-h3',
                name: 'Заголовок H3',
                icon: '🏷️',
                description: 'Средний заголовок подраздела',
                template: '<h3 class="content-subheading">Подзаголовок</h3>',
                preview: 'Подзаголовок'
            },
            {
                id: 'paragraph',
                name: 'Параграф',
                icon: '📄',
                description: 'Обычный текстовый блок',
                template: '<p class="content-text">Введите ваш текст здесь. Этот блок подходит для основного содержимого страницы.</p>',
                preview: 'Введите ваш текст здесь...'
            },
            {
                id: 'quote',
                name: 'Цитата',
                icon: '💬',
                description: 'Выделенная цитата с рамкой',
                template: '<blockquote class="content-quote">"Мудрость приходит к тем, кто ищет знания в древних текстах."<cite>— Древняя мудрость</cite></blockquote>',
                preview: '"Мудрость приходит к тем..."'
            },
            {
                id: 'list',
                name: 'Список',
                icon: '📋',
                description: 'Маркированный список',
                template: '<ul class="content-list"><li>Первый пункт</li><li>Второй пункт</li><li>Третий пункт</li></ul>',
                preview: '• Первый пункт\n• Второй пункт'
            }
        ]
    },
    media: {
        name: '🖼️ Медиа блоки',
        icon: '🖼️',
        blocks: [
            {
                id: 'image',
                name: 'Изображение',
                icon: '🖼️',
                description: 'Изображение с подписью',
                template: `<div class="content-image">
                    <div class="image-placeholder">
                        <div class="placeholder-content">
                            <span class="placeholder-icon">🖼️</span>
                            <span class="placeholder-text">Кликните для загрузки изображения</span>
                        </div>
                    </div>
                    <p class="image-caption" contenteditable="true">Подпись к изображению</p>
                </div>`,
                preview: '[Изображение - кликните для загрузки]'
            },
            {
                id: 'gallery',
                name: 'Галерея',
                icon: '🖼️',
                description: 'Галерея из нескольких изображений',
                template: `<div class="content-gallery">
                    <div class="gallery-grid">
                        <div class="image-placeholder">
                            <div class="placeholder-content">
                                <span class="placeholder-icon">🖼️</span>
                                <span class="placeholder-text">Изображение 1</span>
                            </div>
                        </div>
                        <div class="image-placeholder">
                            <div class="placeholder-content">
                                <span class="placeholder-icon">🖼️</span>
                                <span class="placeholder-text">Изображение 2</span>
                            </div>
                        </div>
                        <div class="image-placeholder">
                            <div class="placeholder-content">
                                <span class="placeholder-icon">🖼️</span>
                                <span class="placeholder-text">Изображение 3</span>
                            </div>
                        </div>
                    </div>
                </div>`,
                preview: '[Галерея - кликните для загрузки изображений]'
            },
            {
                id: 'youtube-video',
                name: 'YouTube видео',
                icon: '📺',
                description: 'Встроенное YouTube видео',
                template: `<div class="content-video youtube-video">
                    <div class="video-placeholder" data-video-type="youtube">
                        <div class="placeholder-content">
                            <span class="placeholder-icon">📺</span>
                            <span class="placeholder-text">Кликните для добавления YouTube видео</span>
                            <input type="text" class="video-url-input" placeholder="Вставьте ссылку на YouTube видео" style="display: none;">
                            <button class="video-add-btn" style="display: none;">Добавить видео</button>
                        </div>
                    </div>
                    <p class="video-caption" contenteditable="true">Описание видео</p>
                </div>`,
                preview: '[YouTube видео - кликните для добавления]'
            },
            {
                id: 'rutube-video',
                name: 'Rutube видео',
                icon: '📹',
                description: 'Встроенное Rutube видео',
                template: `<div class="content-video rutube-video">
                    <div class="video-placeholder" data-video-type="rutube">
                        <div class="placeholder-content">
                            <span class="placeholder-icon">📹</span>
                            <span class="placeholder-text">Кликните для добавления Rutube видео</span>
                            <input type="text" class="video-url-input" placeholder="Вставьте ссылку на Rutube видео" style="display: none;">
                            <button class="video-add-btn" style="display: none;">Добавить видео</button>
                        </div>
                    </div>
                    <p class="video-caption" contenteditable="true">Описание видео</p>
                </div>`,
                preview: '[Rutube видео - кликните для добавления]'
            },
            {
                id: 'local-video',
                name: 'Локальное видео',
                icon: '🎬',
                description: 'Загрузка видео файла',
                template: `<div class="content-video local-video">
                    <div class="video-placeholder" data-video-type="local">
                        <div class="placeholder-content">
                            <span class="placeholder-icon">🎬</span>
                            <span class="placeholder-text">Кликните для загрузки видео файла</span>
                            <input type="file" class="video-file-input" accept="video/*" style="display: none;">
                        </div>
                    </div>
                    <p class="video-caption" contenteditable="true">Описание видео</p>
                </div>`,
                preview: '[Локальное видео - кликните для загрузки]'
            },
            {
                id: 'iframe-video',
                name: 'Встроенное видео',
                icon: '🖥️',
                description: 'Видео через iframe код',
                template: `<div class="content-video iframe-video">
                    <div class="video-placeholder" data-video-type="iframe">
                        <div class="placeholder-content">
                            <span class="placeholder-icon">🖥️</span>
                            <span class="placeholder-text">Кликните для добавления iframe кода</span>
                            <textarea class="video-iframe-input" placeholder="Вставьте iframe код видео" style="display: none;"></textarea>
                            <button class="video-add-btn" style="display: none;">Добавить видео</button>
                        </div>
                    </div>
                    <p class="video-caption" contenteditable="true">Описание видео</p>
                </div>`,
                preview: '[Встроенное видео - кликните для добавления iframe]'
            }
        ]
    },
    structure: {
        name: '🏛️ Структурные блоки',
        icon: '🏛️',
        blocks: [
            {
                id: 'two-columns',
                name: 'Две колонки',
                icon: '📊',
                description: 'Блок с двумя колонками',
                template: '<div class="content-two-columns"><div class="column-left"><h3>Левая колонка</h3><p>Содержимое левой колонки.</p></div><div class="column-right"><h3>Правая колонка</h3><p>Содержимое правой колонки.</p></div></div>',
                preview: '[Левая колонка] [Правая колонка]'
            },
            {
                id: 'card',
                name: 'Карточка',
                icon: '🎴',
                description: 'Карточка с тенью и рамкой',
                template: '<div class="content-card"><h3 class="card-title">Заголовок карточки</h3><p class="card-text">Содержимое карточки с важной информацией.</p></div>',
                preview: 'Заголовок карточки\nСодержимое карточки...'
            }
        ]
    }
};

// Рендеринг библиотеки блоков
function renderBlocksLibrary() {
    const panelContent = document.querySelector('.blocks-panel-content');
    if (!panelContent) return;

    let html = '';

    // Поиск по блокам
    html += `
        <div class="blocks-search">
            <input type="text" id="blocksSearch" placeholder="🔍 Поиск блоков..." class="search-input">
        </div>
    `;

    // Категории блоков
    Object.keys(BLOCKS_LIBRARY).forEach(categoryKey => {
        const category = BLOCKS_LIBRARY[categoryKey];

        html += `
            <div class="blocks-category" data-category="${categoryKey}">
                <div class="category-header">
                    <span class="category-icon">${category.icon}</span>
                    <span class="category-name">${category.name}</span>
                    <span class="category-count">(${category.blocks.length})</span>
                </div>
                <div class="category-blocks">
        `;

        // Блоки в категории
        category.blocks.forEach(block => {
            html += `
                <div class="block-item"
                     data-block-id="${block.id}"
                     data-category="${categoryKey}"
                     draggable="true">
                    <div class="block-icon">${block.icon}</div>
                    <div class="block-info">
                        <div class="block-name">${block.name}</div>
                        <div class="block-description">${block.description}</div>
                        <div class="block-preview">${block.preview}</div>
                    </div>
                    <div class="block-actions">
                        <button class="add-block-btn" title="Добавить блок">+</button>
                        <div class="drag-handle" title="Перетащите на страницу">⋮⋮</div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    panelContent.innerHTML = html;

    // Привязываем обработчики
    bindBlocksEvents();
}

// Привязка обработчиков событий для блоков
function bindBlocksEvents() {
    // Поиск по блокам
    const searchInput = document.getElementById('blocksSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            filterBlocks(e.target.value);
        });
    }

    // Кнопки добавления блоков
    document.querySelectorAll('.add-block-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const blockItem = this.closest('.block-item');
            const blockId = blockItem.dataset.blockId;
            const categoryKey = blockItem.dataset.category;
            addBlockToPage(categoryKey, blockId);
        });
    });

    // Клик по блоку (альтернативный способ добавления)
    document.querySelectorAll('.block-item').forEach(item => {
        item.addEventListener('click', function(e) {
            // Не добавляем при клике на кнопку или drag handle
            if (e.target.closest('.add-block-btn') || e.target.closest('.drag-handle')) {
                return;
            }
            const blockId = this.dataset.blockId;
            const categoryKey = this.dataset.category;
            addBlockToPage(categoryKey, blockId);
        });
    });

    // Drag & Drop обработчики для блоков - ОТКЛЮЧЕНО (используется новая система)
    // bindDragDropEvents();
}

// Фильтрация блоков по поиску
function filterBlocks(searchTerm) {
    const blockItems = document.querySelectorAll('.block-item');
    const categories = document.querySelectorAll('.blocks-category');

    searchTerm = searchTerm.toLowerCase();

    blockItems.forEach(item => {
        const blockName = item.querySelector('.block-name').textContent.toLowerCase();
        const blockDescription = item.querySelector('.block-description').textContent.toLowerCase();

        const matches = blockName.includes(searchTerm) || blockDescription.includes(searchTerm);
        item.style.display = matches ? 'flex' : 'none';
    });

    // Скрываем пустые категории
    categories.forEach(category => {
        const visibleBlocks = category.querySelectorAll('.block-item[style*="flex"], .block-item:not([style])');
        category.style.display = visibleBlocks.length > 0 ? 'block' : 'none';
    });
}

// Привязка Drag & Drop событий - ОТКЛЮЧЕНО (используется новая система)
function bindDragDropEvents() {
    // Старая система отключена - используется новая система из new-blocks-system.js
    console.log('⚠️ Старая система drag & drop отключена');
}

// Начало перетаскивания
function handleDragStart(e) {
    const blockId = this.dataset.blockId;
    const categoryKey = this.dataset.category;

    // Сохраняем данные для передачи
    e.dataTransfer.setData('text/plain', JSON.stringify({
        blockId,
        categoryKey
    }));

    // Визуальные эффекты
    this.classList.add('dragging');
    document.body.classList.add('drag-active');

    // Если перетаскиваем изображение, добавляем специальный класс
    const isImage = isImageBlock(categoryKey, blockId);
    if (isImage) {
        document.body.classList.add('dragging-image');
        console.log('🖼️ Перетаскиваем изображение - показываем inline зоны');
    }

    // Создаем и показываем зоны вставки (для новых блоков из панели)
    createDropZonesForNewBlock();

    // Определяем тип блока для показа соответствующих зон
    const blockType = isImage ? 'image-block' : 'regular-block';
    console.log(`🔍 Блок ${blockId} из категории ${categoryKey}: isImage=${isImage}, blockType=${blockType}`);
    showDropZones(-1, blockType);

    console.log(`🎯 Начато перетаскивание блока: ${blockId}`);
}

// Конец перетаскивания
function handleDragEnd(e) {
    // Убираем визуальные эффекты
    this.classList.remove('dragging');
    document.body.classList.remove('drag-active', 'dragging-image');

    // Скрываем зоны вставки
    hideDropZones();

    // Скрываем динамические inline зоны
    hideDynamicInlineZone();

    console.log('🎯 Перетаскивание завершено');
}

// Создание зон вставки (только при необходимости)
function createDropZones() {
    const pageContent = document.querySelector('.page-content');
    if (!pageContent) return;

    // Удаляем старые зоны
    cleanupDropZones();

    // Добавляем drag handles к существующим блокам - ОТКЛЮЧЕНО (используется новая система)
    // addDragHandlesToExistingBlocks();

    const contentBlocks = pageContent.querySelectorAll('.content-block');

    // Если есть блоки - создаем зоны между ними
    if (contentBlocks.length > 0) {
        // Зона в начале страницы
        const topZone = createDropZone('top', 0);
        pageContent.insertBefore(topZone, pageContent.firstChild);

        // Зоны между существующими блоками
        contentBlocks.forEach((block, index) => {
            // Обычная зона после блока
            const zone = createDropZone(`after-${index}`, index + 1);
            block.parentNode.insertBefore(zone, block.nextSibling);

            // НЕ создаем inline зоны заранее - они будут создаваться динамически при наведении
        });
    }
    // Если блоков нет - НЕ создаем никаких зон (они появятся при перетаскивании)
}

// Добавление drag handles к существующим блокам
function addDragHandlesToExistingBlocks() {
    const contentBlocks = document.querySelectorAll('.content-block');

    contentBlocks.forEach((block, index) => {
        // Удаляем старые обработчики и handles
        const oldHandle = block.querySelector('.block-drag-handle');
        if (oldHandle) {
            oldHandle.remove();
        }

        // Удаляем старые обработчики событий
        block.removeEventListener('dragstart', handleBlockDragStart);
        block.removeEventListener('dragend', handleBlockDragEnd);

        // Создаем новый drag handle для блока
        const handle = document.createElement('div');
        handle.className = 'block-drag-handle';
        handle.innerHTML = '⋮⋮';
        handle.title = 'Перетащите для перемещения блока';
        handle.dataset.blockIndex = index;

        // Обновляем индекс блока
        block.draggable = true;
        block.dataset.blockIndex = index;

        // Добавляем класс для блоков, которые могут быть inline
        if (canBeInline(block)) {
            block.classList.add('can-inline');
        } else {
            block.classList.remove('can-inline');
        }

        // Добавляем handle в блок
        block.style.position = 'relative';
        block.appendChild(handle);

        // Добавляем новые обработчики для перетаскивания блока
        block.addEventListener('dragstart', handleBlockDragStart);
        block.addEventListener('dragend', handleBlockDragEnd);

        // Добавляем обработчики для динамических inline зон
        block.addEventListener('dragover', handleBlockDragOver);
        block.addEventListener('dragleave', handleBlockDragLeave);

        // Добавляем обработчик контекстного меню
        block.addEventListener('contextmenu', handleBlockContextMenu);

        console.log(`Drag handle добавлен к блоку ${index}`);
    });
}

// Начало перетаскивания существующего блока
function handleBlockDragStart(e) {
    // Проверяем, не находимся ли мы в режиме редактирования
    if (this.classList.contains('editing')) {
        e.preventDefault();
        console.log('🚫 Перетаскивание заблокировано - блок в режиме редактирования');
        return;
    }

    // Проверяем, не начинается ли перетаскивание с редактируемого элемента
    if (e.target.contentEditable === 'true' || e.target.closest('[contenteditable="true"]')) {
        e.preventDefault();
        console.log('🚫 Перетаскивание заблокировано - клик на редактируемом элементе');
        return;
    }

    const blockIndex = parseInt(this.dataset.blockIndex);

    console.log(`🎯 DRAG START: Блок #${blockIndex}`, this);

    // Сохраняем только индекс - не HTML!
    e.dataTransfer.setData('text/plain', JSON.stringify({
        type: 'existing-block',
        blockIndex: blockIndex
    }));

    // Визуальные эффекты
    this.classList.add('dragging-block');
    document.body.classList.add('drag-active');

    // Показываем зоны вставки (передаем индекс перетаскиваемого блока)
    const blockType = canBeInline(this) ? 'image-block' : 'regular-block';

    // Если перетаскиваем изображение, добавляем специальный класс
    if (blockType === 'image-block') {
        document.body.classList.add('dragging-image');
        console.log('🖼️ Перетаскиваем существующее изображение - показываем inline зоны');
    }

    showDropZones(blockIndex, blockType);

    console.log(`🎯 Начато перемещение блока #${blockIndex}`);
}

// Обработчик наведения на блок при перетаскивании изображения
function handleBlockDragOver(e) {
    e.preventDefault();

    // Проверяем, перетаскиваем ли мы изображение
    if (!document.body.classList.contains('dragging-image')) {
        return;
    }

    // Не показываем зоны для самого перетаскиваемого блока
    if (this.classList.contains('dragging-block')) {
        return;
    }

    // Получаем координаты мыши относительно блока
    const rect = this.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const blockWidth = rect.width;

    // Определяем, в какой части блока находится мышь
    // Увеличиваем зоны для большей стабильности
    const leftZone = blockWidth * 0.45; // 45% слева
    const rightZone = blockWidth * 0.55; // 55% справа

    let side = null;
    const currentSide = this.dataset.currentPreviewSide;

    // Гистерезис - если уже показываем preview, расширяем зону
    if (currentSide === 'left') {
        if (mouseX < blockWidth * 0.6) { // Расширенная зона для левого preview
            side = 'left';
        } else if (mouseX > blockWidth * 0.7) {
            side = 'right';
        }
    } else if (currentSide === 'right') {
        if (mouseX > blockWidth * 0.4) { // Расширенная зона для правого preview
            side = 'right';
        } else if (mouseX < blockWidth * 0.3) {
            side = 'left';
        }
    } else {
        // Первоначальное определение зоны
        if (mouseX < leftZone) {
            side = 'left';
        } else if (mouseX > rightZone) {
            side = 'right';
        }
    }

    // Если сторона не изменилась, не делаем ничего
    if (side === currentSide) {
        return;
    }

    if (side) {
        console.log(`📐 Показываем ${side} preview (mouseX: ${mouseX}/${blockWidth})`);
        this.dataset.currentPreviewSide = side;
        showDynamicInlineZone(this, side, e.clientX, e.clientY);
    } else if (currentSide) {
        console.log(`❌ Убираем preview (mouseX: ${mouseX}/${blockWidth})`);
        delete this.dataset.currentPreviewSide;
        hideDynamicInlineZone();
    }
}

// Обработчик ухода мыши с блока
function handleBlockDragLeave(e) {
    // Увеличиваем задержку для большей стабильности
    setTimeout(() => {
        // Проверяем, что мышь действительно покинула блок с запасом
        const rect = this.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        // Добавляем буферную зону вокруг блока
        const buffer = 20;
        const isOutside = mouseX < (rect.left - buffer) ||
                         mouseX > (rect.right + buffer) ||
                         mouseY < (rect.top - buffer) ||
                         mouseY > (rect.bottom + buffer);

        if (isOutside) {
            delete this.dataset.currentPreviewSide;
            hideDynamicInlineZone();
            console.log('🚪 Мышь покинула блок - убираем preview');
        }
    }, 200); // Увеличенная задержка
}

// Глобальная переменная для хранения текущей динамической зоны
let currentDynamicZone = null;

// Показать динамическую inline зону с preview эффектом
function showDynamicInlineZone(targetBlock, side, mouseX, mouseY) {
    // Удаляем предыдущую зону и preview
    hideDynamicInlineZone();

    // Создаем preview эффект
    createInlinePreview(targetBlock, side);

    // Создаем новую зону для drop
    const zone = document.createElement('div');
    zone.className = `drop-zone-inline dynamic ${side}`;
    zone.dataset.zoneId = `dynamic-${side}`;
    zone.dataset.targetBlock = targetBlock.dataset.blockIndex || '0';
    zone.dataset.side = side;

    // Позиционируем зону поверх preview области
    const rect = targetBlock.getBoundingClientRect();
    zone.style.position = 'fixed';

    if (side === 'left') {
        zone.style.left = rect.left + 'px';
        zone.style.width = (rect.width / 2) + 'px';
    } else {
        zone.style.left = (rect.left + rect.width / 2) + 'px';
        zone.style.width = (rect.width / 2) + 'px';
    }

    zone.style.top = rect.top + 'px';
    zone.style.height = rect.height + 'px';
    zone.style.zIndex = '100';
    zone.style.opacity = '0.8';
    zone.style.visibility = 'visible';
    zone.style.pointerEvents = 'auto';
    zone.style.background = 'rgba(74, 144, 226, 0.1)';
    zone.style.border = '2px dashed #4A90E2';
    zone.style.borderRadius = '8px';

    // Добавляем обработчики
    zone.addEventListener('dragover', handleInlineZoneDragOver);
    zone.addEventListener('dragleave', handleInlineZoneDragLeave);
    zone.addEventListener('drop', handleInlineZoneDrop);

    // Добавляем обработчик для поддержания preview при наведении на зону
    zone.addEventListener('mouseenter', () => {
        console.log('🎯 Мышь вошла в drop зону - сохраняем preview');
    });

    zone.addEventListener('mouseleave', () => {
        console.log('🚪 Мышь покинула drop зону');
        setTimeout(() => {
            hideDynamicInlineZone();
        }, 100);
    });

    // Добавляем в DOM
    document.body.appendChild(zone);
    currentDynamicZone = zone;

    console.log(`✅ Показан preview эффект ${side} для блока`);
}

// Глобальные переменные для preview
let currentPreviewBlock = null;
let currentPreview = null;

// Создать preview эффект
function createInlinePreview(targetBlock, side) {
    // Удаляем предыдущий preview
    removeInlinePreview();

    // Сдвигаем целевой блок
    if (side === 'left') {
        targetBlock.classList.add('preview-shift-right');
    } else {
        targetBlock.classList.add('preview-shift-left');
    }

    // Создаем preview элемент
    const preview = document.createElement('div');
    preview.className = `inline-preview ${side}`;

    // Позиционируем preview относительно блока
    targetBlock.style.position = 'relative';
    targetBlock.appendChild(preview);

    // Сохраняем ссылки
    currentPreviewBlock = targetBlock;
    currentPreview = preview;

    console.log(`✅ Создан preview эффект ${side}`);
}

// Удалить preview эффект
function removeInlinePreview() {
    if (currentPreviewBlock) {
        // Убираем классы сдвига
        currentPreviewBlock.classList.remove('preview-shift-right', 'preview-shift-left');
        currentPreviewBlock = null;
    }

    if (currentPreview) {
        currentPreview.remove();
        currentPreview = null;
    }
}

// Скрыть динамическую inline зону
function hideDynamicInlineZone() {
    if (currentDynamicZone) {
        currentDynamicZone.remove();
        currentDynamicZone = null;
        console.log(`❌ Скрыта динамическая зона`);
    }

    // Также убираем preview эффект
    removeInlinePreview();
}

// Конец перетаскивания существующего блока
function handleBlockDragEnd(e) {
    // Убираем визуальные эффекты
    this.classList.remove('dragging-block');
    document.body.classList.remove('drag-active', 'dragging-image');

    // Скрываем зоны вставки
    hideDropZones();

    // Скрываем динамические inline зоны
    hideDynamicInlineZone();

    console.log('🎯 Перемещение блока завершено');
}

// Создание отдельной зоны вставки
function createDropZone(id, position) {
    const zone = document.createElement('div');
    zone.className = 'drop-zone';
    zone.dataset.zoneId = id;
    zone.dataset.position = position;

    // Разные тексты для разных зон
    let zoneText = '⚱️ Перетащите блок сюда';
    if (id === 'top') zoneText = '🔝 Добавить в начало';
    else if (id === 'center') zoneText = '📜 Добавить первый блок';
    else if (id.startsWith('after-')) zoneText = '⬇️ Вставить после блока';

    zone.innerHTML = `
        <div class="drop-zone-line"></div>
        <div class="drop-zone-text">${zoneText}</div>
        <div class="drop-zone-preview"></div>
    `;

    // Обработчики событий
    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('dragenter', handleDragEnter);
    zone.addEventListener('dragleave', handleDragLeave);
    zone.addEventListener('drop', handleDrop);

    return zone;
}

// Показать зоны вставки
function showDropZones(draggingBlockIndex = -1, draggedBlockType = null) {
    const contentBlocks = document.querySelectorAll('.content-block');
    const totalBlocks = contentBlocks.length;

    // Обрабатываем обычные зоны
    document.querySelectorAll('.drop-zone').forEach(zone => {
        const zoneId = zone.dataset.zoneId;
        let shouldShow = true;

        // Если перетаскиваем существующий блок
        if (draggingBlockIndex >= 0) {
            // Не показываем зону "в начало" если перетаскиваем первый блок
            if (zoneId === 'top' && draggingBlockIndex === 0) {
                shouldShow = false;
            }

            // Не показываем зону "после последнего" если перетаскиваем последний блок
            if (zoneId.startsWith('after-')) {
                const afterIndex = parseInt(zoneId.replace('after-', ''));
                if (draggingBlockIndex === totalBlocks - 1 && afterIndex === totalBlocks - 1) {
                    shouldShow = false;
                }
            }

            // Не показываем зоны рядом с перетаскиваемым блоком
            if (zoneId.startsWith('after-')) {
                const afterIndex = parseInt(zoneId.replace('after-', ''));
                // Скрываем зону после блока, который мы тащим
                if (afterIndex === draggingBlockIndex) {
                    shouldShow = false;
                }
                // Скрываем зону перед блоком, который мы тащим
                if (afterIndex === draggingBlockIndex - 1) {
                    shouldShow = false;
                }
            }
        }

        if (shouldShow) {
            zone.classList.add('visible');
            zone.classList.remove('hidden');
        } else {
            zone.classList.add('hidden');
            zone.classList.remove('visible');
        }
    });

    // Обрабатываем inline зоны - показываем только для блоков изображений
    const inlineZones = document.querySelectorAll('.drop-zone-inline');
    console.log(`🔍 Найдено ${inlineZones.length} inline зон, draggedBlockType: ${draggedBlockType}`);

    inlineZones.forEach(zone => {
        const zoneId = zone.dataset.zoneId;
        let shouldShow = draggedBlockType === 'image-block';

        console.log(`🔍 Inline зона ${zoneId}: shouldShow=${shouldShow}`);

        // Дополнительные проверки для inline зон
        if (shouldShow && draggingBlockIndex >= 0) {
            if (zoneId.startsWith('inline-')) {
                const targetIndex = parseInt(zoneId.replace('inline-', ''));
                // Не показываем inline зону для самого перетаскиваемого блока
                if (targetIndex === draggingBlockIndex) {
                    shouldShow = false;
                    console.log(`🔍 Скрываем inline зону для самого перетаскиваемого блока ${targetIndex}`);
                }
            }
        }

        if (shouldShow) {
            zone.classList.add('visible');
            zone.classList.remove('hidden');
            // Принудительно устанавливаем стили для отладки
            zone.style.opacity = '1';
            zone.style.visibility = 'visible';
            zone.style.display = 'flex';
            zone.style.backgroundColor = 'rgba(74, 144, 226, 0.2)';
            zone.style.border = '3px dashed #4A90E2';
            console.log(`✅ Показываем inline зону ${zoneId}`, zone);
        } else {
            zone.classList.add('hidden');
            zone.classList.remove('visible');
            zone.style.opacity = '0';
            zone.style.visibility = 'hidden';
            console.log(`❌ Скрываем inline зону ${zoneId}`);
        }
    });
}

// Скрыть зоны вставки
function hideDropZones() {
    document.querySelectorAll('.drop-zone, .drop-zone-inline').forEach(zone => {
        zone.classList.remove('visible', 'drag-over', 'hidden');
    });
}

// Полная очистка зон вставки
function cleanupDropZones() {
    document.querySelectorAll('.drop-zone, .drop-zone-inline').forEach(zone => {
        zone.remove();
    });
    console.log('🧹 Старые зоны вставки удалены');
}

// Проверка, может ли блок быть размещен inline
function canBeInline(block) {
    // Блоки с изображениями могут быть размещены inline
    const hasImage = block.querySelector('.content-image, .image-placeholder, .uploaded-image') !== null;
    console.log(`🔍 canBeInline для блока:`, block, `hasImage: ${hasImage}`);
    return hasImage;
}

// Создание inline зоны вставки
function createInlineDropZone(id, targetBlock, side) {
    const zone = document.createElement('div');
    zone.className = `drop-zone-inline ${side}`;
    zone.dataset.zoneId = id;
    zone.dataset.targetBlock = targetBlock.dataset.blockIndex || '0';
    zone.dataset.side = side;

    // Обработчики для inline зоны
    zone.addEventListener('dragover', handleInlineZoneDragOver);
    zone.addEventListener('dragleave', handleInlineZoneDragLeave);
    zone.addEventListener('drop', handleInlineZoneDrop);

    return zone;
}

// Обработчики для inline зон
function handleInlineZoneDragOver(e) {
    e.preventDefault();
    e.stopPropagation();

    // Проверяем, что перетаскиваемый блок может быть inline
    const dragData = e.dataTransfer.getData('text/plain');
    if (dragData) {
        try {
            const data = JSON.parse(dragData);
            if (data.type === 'new-block' && isImageBlock(data.categoryKey, data.blockId)) {
                this.classList.add('drag-over');
            } else if (data.type === 'existing-block') {
                const draggedBlock = document.querySelector(`[data-block-index="${data.blockIndex}"]`);
                if (draggedBlock && canBeInline(draggedBlock)) {
                    this.classList.add('drag-over');
                }
            }
        } catch (e) {
            // Игнорируем ошибки парсинга
        }
    }
}

function handleInlineZoneDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('drag-over');
}

function handleInlineZoneDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    this.classList.remove('drag-over');

    const dragData = e.dataTransfer.getData('text/plain');
    if (!dragData) return;

    try {
        const data = JSON.parse(dragData);
        const targetBlockIndex = parseInt(this.dataset.targetBlock);
        const targetBlock = document.querySelector(`[data-block-index="${targetBlockIndex}"]`);

        if (!targetBlock) return;

        const side = this.dataset.side; // 'left' или 'right'

        if (data.type === 'new-block' && isImageBlock(data.categoryKey, data.blockId)) {
            // Добавляем новый блок inline
            addBlockInline(data.categoryKey, data.blockId, targetBlock, side);
        } else if (data.type === 'existing-block') {
            const draggedBlock = document.querySelector(`[data-block-index="${data.blockIndex}"]`);
            if (draggedBlock && canBeInline(draggedBlock)) {
                // Перемещаем существующий блок inline
                moveBlockInline(draggedBlock, targetBlock, side);
            }
        }
    } catch (error) {
        console.error('Ошибка при обработке inline drop:', error);
    }
}

// Проверка, является ли блок изображением
function isImageBlock(categoryKey, blockId) {
    const category = BLOCKS_LIBRARY[categoryKey];
    console.log(`🔍 isImageBlock: categoryKey=${categoryKey}, blockId=${blockId}, category:`, category);

    if (!category) {
        console.log(`❌ Категория ${categoryKey} не найдена`);
        return false;
    }

    const block = category.blocks.find(b => b.id === blockId);
    const isImage = block && (block.id === 'image' || block.id === 'gallery');
    console.log(`🔍 Найден блок:`, block, `isImage: ${isImage}`);

    return isImage;
}

// Проверка, является ли блок видео
function isVideoBlock(categoryKey, blockId) {
    const category = BLOCKS_LIBRARY[categoryKey];

    if (!category) {
        return false;
    }

    const block = category.blocks.find(b => b.id === blockId);
    const isVideo = block && (block.id === 'youtube-video' || block.id === 'rutube-video' ||
                             block.id === 'local-video' || block.id === 'iframe-video');

    return isVideo;
}

// Добавить новый блок inline рядом с существующим
function addBlockInline(categoryKey, blockId, targetBlock, side) {
    const block = BLOCKS_LIBRARY[categoryKey].blocks.find(b => b.id === blockId);
    if (!block) return;

    console.log(`📐 Добавление блока inline: ${block.name}, сторона: ${side}`);

    // Создаем новый элемент
    const newElement = document.createElement('div');
    newElement.className = 'content-block image-block';
    newElement.innerHTML = block.template;

    // Проверяем, находится ли целевой блок уже в inline контейнере
    const existingContainer = targetBlock.closest('.inline-container');

    if (existingContainer) {
        // Добавляем в существующий inline контейнер в нужную позицию
        if (side === 'left') {
            existingContainer.insertBefore(newElement, targetBlock);
        } else {
            existingContainer.appendChild(newElement);
        }
        console.log('✅ Блок добавлен в существующий inline контейнер');
    } else {
        // Создаем новый inline контейнер 50/50
        const inlineContainer = document.createElement('div');
        inlineContainer.className = 'inline-container';

        // Перемещаем целевой блок в контейнер
        targetBlock.parentNode.insertBefore(inlineContainer, targetBlock);

        if (side === 'left') {
            // Новый блок слева, целевой справа
            inlineContainer.appendChild(newElement);
            inlineContainer.appendChild(targetBlock);
        } else {
            // Целевой блок слева, новый справа
            inlineContainer.appendChild(targetBlock);
            inlineContainer.appendChild(newElement);
        }

        console.log('✅ Создан новый inline контейнер 50/50 с двумя блоками');
    }

    // Пересоздаем зоны
    setTimeout(() => {
        createDropZones();
    }, 100);

    // Закрываем панель блоков
    closeBlocksPanel();

    showBlockNotification(`Блок "${block.name}" размещен ${side === 'left' ? 'слева' : 'справа'}!`, 'success');
}

// Переместить существующий блок inline
function moveBlockInline(draggedBlock, targetBlock, side) {
    console.log('📐 Перемещение блока inline');

    // Удаляем блок из текущего места
    const oldParent = draggedBlock.parentNode;
    draggedBlock.remove();

    // Если старый родитель был inline контейнером и остался с одним блоком
    if (oldParent.classList.contains('inline-container')) {
        const remainingBlocks = oldParent.querySelectorAll('.content-block');
        if (remainingBlocks.length === 1) {
            // Перемещаем оставшийся блок наружу и удаляем контейнер
            const remainingBlock = remainingBlocks[0];
            oldParent.parentNode.insertBefore(remainingBlock, oldParent);
            oldParent.remove();
            console.log('🧹 Inline контейнер с одним блоком удален');
        }
    }

    // Проверяем, находится ли целевой блок в inline контейнере
    const existingContainer = targetBlock.closest('.inline-container');

    if (existingContainer) {
        // Добавляем в существующий inline контейнер
        existingContainer.appendChild(draggedBlock);
        console.log('✅ Блок перемещен в существующий inline контейнер');
    } else {
        // Создаем новый inline контейнер
        const inlineContainer = document.createElement('div');
        inlineContainer.className = 'inline-container';

        // Перемещаем целевой блок в контейнер
        targetBlock.parentNode.insertBefore(inlineContainer, targetBlock);
        inlineContainer.appendChild(targetBlock);
        inlineContainer.appendChild(draggedBlock);

        console.log('✅ Создан новый inline контейнер при перемещении');
    }

    // Пересоздаем зоны
    setTimeout(() => {
        createDropZones();
    }, 100);

    showBlockNotification('Блок перемещен рядом!', 'success');
}

// Создание зон для новых блоков (включая центральную зону для пустой страницы)
function createDropZonesForNewBlock() {
    const pageContent = document.querySelector('.page-content');
    if (!pageContent) return;

    // Удаляем старые зоны
    cleanupDropZones();

    const contentBlocks = pageContent.querySelectorAll('.content-block');

    if (contentBlocks.length === 0) {
        // Если страница пустая - создаем только центральную зону
        const centerZone = createDropZone('center', 0);
        centerZone.classList.add('drop-zone-center');
        pageContent.appendChild(centerZone);
    } else {
        // Если есть блоки - создаем все зоны
        createDropZones();
    }
}

// Обработчик dragover
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

// Обработчик dragenter
function handleDragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

// Обработчик dragleave
function handleDragLeave(e) {
    // Проверяем, что мы действительно покинули зону
    if (!this.contains(e.relatedTarget)) {
        this.classList.remove('drag-over');
    }
}

// Обработчик drop
function handleDrop(e) {
    e.preventDefault();

    console.log('🎯 DROP EVENT:', e);

    try {
        const dataString = e.dataTransfer.getData('text/plain');
        console.log('📦 Данные drop:', dataString);

        const data = JSON.parse(dataString);
        console.log('📦 Распарсенные данные:', data);

        if (data.type === 'existing-block') {
            console.log('🔄 Перемещение существующего блока');
            // Перемещение существующего блока
            moveExistingBlock(data.blockIndex, this);
        } else {
            console.log('➕ Добавление нового блока');
            // Добавление нового блока из панели
            const { blockId, categoryKey } = data;
            addBlockToPosition(categoryKey, blockId, this);
        }

        // Убираем визуальные эффекты
        this.classList.remove('drag-over');

    } catch (error) {
        console.error('❌ Ошибка при обработке drop:', error);
    }
}

// Перемещение существующего блока
function moveExistingBlock(fromIndex, dropZone) {
    console.log(`🔄 НАЧАЛО ПЕРЕМЕЩЕНИЯ: блок ${fromIndex} в зону ${dropZone.dataset.zoneId}`);

    const pageContent = document.querySelector('.page-content');
    const contentBlocks = Array.from(pageContent.querySelectorAll('.content-block'));
    const blockToMove = contentBlocks[fromIndex];

    if (!blockToMove) {
        console.error('❌ Блок для перемещения не найден:', fromIndex, 'Всего блоков:', contentBlocks.length);
        return;
    }

    console.log(`📦 Найден блок для перемещения:`, blockToMove.innerHTML.substring(0, 50) + '...');

    const zoneId = dropZone.dataset.zoneId;
    let moved = false;

    try {
        // ПРОСТОЙ ПОДХОД: просто перемещаем DOM элемент
        if (zoneId === 'top') {
            // В начало - перед всеми блоками
            const allBlocks = pageContent.querySelectorAll('.content-block');
            const firstBlock = allBlocks[0];
            if (firstBlock && firstBlock !== blockToMove) {
                pageContent.insertBefore(blockToMove, firstBlock);
                moved = true;
                console.log('✅ Блок перемещен в начало');
            }
        } else if (zoneId.startsWith('after-')) {
            // После определенного блока
            const afterIndex = parseInt(zoneId.replace('after-', ''));
            const targetBlock = contentBlocks[afterIndex];

            if (targetBlock && targetBlock !== blockToMove) {
                // Вставляем после целевого блока
                const nextElement = targetBlock.nextElementSibling;
                if (nextElement) {
                    pageContent.insertBefore(blockToMove, nextElement);
                } else {
                    pageContent.appendChild(blockToMove);
                }
                moved = true;
                console.log(`✅ Блок перемещен после блока ${afterIndex}`);
            }
        }

        if (!moved) {
            console.log('⚠️ Блок не был перемещен - возможно, уже в нужной позиции');
        }

    } catch (error) {
        console.error('❌ Ошибка при перемещении:', error);
    }

    // Пересоздаем зоны вставки
    setTimeout(() => {
        createDropZones();
        console.log('🔄 Зоны пересозданы');
    }, 100);

    // Показываем уведомление
    if (moved) {
        showBlockNotification('Блок перемещен!', 'success');
    }

    console.log(`✅ ПЕРЕМЕЩЕНИЕ ЗАВЕРШЕНО (moved: ${moved})`);
}

// ===== КОНТЕКСТНОЕ МЕНЮ БЛОКОВ =====

let currentContextBlock = null;

// Обработчик контекстного меню для блока
function handleBlockContextMenu(e) {
    e.preventDefault();

    const block = e.currentTarget;
    const blockIndex = parseInt(block.dataset.blockIndex);

    console.log(`🎯 Контекстное меню для блока #${blockIndex}`);

    // Сохраняем ссылку на текущий блок
    currentContextBlock = block;

    // Показываем контекстное меню
    showContextMenu(e.pageX, e.pageY, blockIndex);
}

// Показать контекстное меню
function showContextMenu(x, y, blockIndex) {
    const menu = document.getElementById('blockContextMenu');
    if (!menu) return;

    // Сначала показываем меню для получения размеров
    menu.classList.add('visible');
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';

    // Получаем размеры меню и окна
    const menuRect = menu.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Корректируем позицию, размещая меню выше точки клика
    let finalX = x;
    let finalY = y - menuRect.height - 20; // Поднимаем меню на высоту + 20px отступ

    // Проверяем правую границу
    if (menuRect.right > windowWidth) {
        finalX = windowWidth - menuRect.width - 10;
    }

    // Проверяем нижнюю границу (если меню все еще не помещается)
    if (finalY + menuRect.height > windowHeight) {
        finalY = windowHeight - menuRect.height - 10;
    }

    // Проверяем левую границу
    if (finalX < 10) {
        finalX = 10;
    }

    // Проверяем верхнюю границу (если поднятое меню ушло слишком высоко)
    if (finalY < 10) {
        finalY = y + 20; // Размещаем ниже точки клика с отступом
    }

    // Применяем скорректированную позицию
    menu.style.left = finalX + 'px';
    menu.style.top = finalY + 'px';

    // Проверяем доступность действий
    updateMenuItemsState(blockIndex);

    // Привязываем обработчики
    bindContextMenuEvents();

    console.log(`📋 Контекстное меню показано в позиции (${finalX}, ${finalY}) (исходная: ${x}, ${y})`);
}

// Скрыть контекстное меню
function hideContextMenu() {
    const menu = document.getElementById('blockContextMenu');
    if (!menu) return;

    menu.classList.remove('visible');
    currentContextBlock = null;

    // Убираем обработчики
    unbindContextMenuEvents();

    console.log('📋 Контекстное меню скрыто');
}

// Обновить состояние пунктов меню
function updateMenuItemsState(blockIndex) {
    const contentBlocks = document.querySelectorAll('.content-block');
    const totalBlocks = contentBlocks.length;

    // Кнопка "Переместить вверх"
    const moveUpItem = document.querySelector('[data-action="move-up"]');
    if (blockIndex === 0) {
        moveUpItem.classList.add('disabled');
    } else {
        moveUpItem.classList.remove('disabled');
    }

    // Кнопка "Переместить вниз"
    const moveDownItem = document.querySelector('[data-action="move-down"]');
    if (blockIndex === totalBlocks - 1) {
        moveDownItem.classList.add('disabled');
    } else {
        moveDownItem.classList.remove('disabled');
    }
}

// Привязать обработчики контекстного меню
function bindContextMenuEvents() {
    // Клики по пунктам меню
    document.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', handleContextMenuAction);
    });

    // Закрытие меню при клике вне его
    document.addEventListener('click', handleContextMenuOutsideClick);

    // Закрытие меню по ESC
    document.addEventListener('keydown', handleContextMenuKeydown);
}

// Убрать обработчики контекстного меню
function unbindContextMenuEvents() {
    document.querySelectorAll('.context-menu-item').forEach(item => {
        item.removeEventListener('click', handleContextMenuAction);
    });

    document.removeEventListener('click', handleContextMenuOutsideClick);
    document.removeEventListener('keydown', handleContextMenuKeydown);
}

// Обработчик действий контекстного меню
function handleContextMenuAction(e) {
    e.stopPropagation();

    const action = this.dataset.action;

    if (this.classList.contains('disabled')) {
        return;
    }

    console.log(`🎯 Выполнение действия: ${action}`);

    switch (action) {
        case 'edit':
            editBlock(currentContextBlock);
            break;
        case 'style':
            openStylePanel(currentContextBlock);
            break;
        case 'move-up':
            moveBlockUp(currentContextBlock);
            break;
        case 'move-down':
            moveBlockDown(currentContextBlock);
            break;
        case 'duplicate':
            duplicateBlock(currentContextBlock);
            break;
        case 'delete':
            deleteBlock(currentContextBlock);
            break;
    }

    hideContextMenu();
}

// Закрытие меню при клике вне его
function handleContextMenuOutsideClick(e) {
    const menu = document.getElementById('blockContextMenu');
    if (!menu.contains(e.target)) {
        hideContextMenu();
    }
}

// Закрытие меню по ESC
function handleContextMenuKeydown(e) {
    if (e.key === 'Escape') {
        hideContextMenu();
    }
}

// ===== ДЕЙСТВИЯ С БЛОКАМИ =====

// Редактирование блока
function editBlock(block) {
    if (!block) return;

    console.log('✏️ Начало редактирования блока');

    // Добавляем класс редактирования
    block.classList.add('editing');

    // Отключаем перетаскивание блока
    block.draggable = false;

    // Делаем текстовые элементы редактируемыми
    const editableElements = block.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, blockquote, cite');
    editableElements.forEach(element => {
        element.contentEditable = true;
        element.addEventListener('blur', handleEditableBlur);
        element.addEventListener('keydown', handleEditableKeydown);
    });

    // Фокусируемся на первом редактируемом элементе
    if (editableElements.length > 0) {
        editableElements[0].focus();
    }

    showBlockNotification('Режим редактирования активен. ESC для выхода.', 'info');
}

// Завершение редактирования при потере фокуса
function handleEditableBlur(e) {
    // Не завершаем редактирование, если фокус переходит на другой редактируемый элемент того же блока
    setTimeout(() => {
        const activeElement = document.activeElement;
        const currentBlock = e.target.closest('.content-block');

        if (!activeElement || !currentBlock || !currentBlock.contains(activeElement) || !activeElement.contentEditable) {
            finishEditing(currentBlock);
        }
    }, 100);
}

// Обработка клавиш в режиме редактирования
function handleEditableKeydown(e) {
    if (e.key === 'Escape') {
        const block = e.target.closest('.content-block');
        finishEditing(block);
        e.target.blur();
    } else if (e.key === 'Enter' && !e.shiftKey) {
        // Enter без Shift завершает редактирование
        e.preventDefault();
        const block = e.target.closest('.content-block');
        finishEditing(block);
        e.target.blur();
    }
}

// Завершение редактирования
function finishEditing(block) {
    if (!block || !block.classList.contains('editing')) return;

    console.log('✅ Завершение редактирования блока');

    // Убираем класс редактирования
    block.classList.remove('editing');

    // Включаем обратно перетаскивание блока
    block.draggable = true;

    // Убираем contentEditable и обработчики
    const editableElements = block.querySelectorAll('[contenteditable="true"]');
    editableElements.forEach(element => {
        element.contentEditable = false;
        element.removeEventListener('blur', handleEditableBlur);
        element.removeEventListener('keydown', handleEditableKeydown);
    });

    showBlockNotification('Изменения сохранены!', 'success');
}

// Перемещение блока вверх
function moveBlockUp(block) {
    if (!block) return;

    const pageContent = document.querySelector('.page-content');
    const contentBlocks = Array.from(pageContent.querySelectorAll('.content-block'));
    const currentIndex = contentBlocks.indexOf(block);

    console.log(`⬆️ Попытка переместить блок вверх. Текущий индекс: ${currentIndex}`);

    if (currentIndex > 0) {
        const prevBlock = contentBlocks[currentIndex - 1];
        pageContent.insertBefore(block, prevBlock);

        // Обновляем позиции в БД
        if (window.NewBlockSystem && window.NewBlockSystem.updatePositions) {
            setTimeout(() => {
                window.NewBlockSystem.updatePositions();
            }, 100);
        }

        // Пересоздаем зоны
        setTimeout(() => {
            createDropZones();
        }, 100);

        showBlockNotification('Блок перемещен вверх!', 'success');
        console.log('✅ Блок перемещен вверх');
    } else {
        console.log('🚫 Блок уже в начале');
    }
}

// Перемещение блока вниз
function moveBlockDown(block) {
    if (!block) return;

    const pageContent = document.querySelector('.page-content');
    const contentBlocks = Array.from(pageContent.querySelectorAll('.content-block'));
    const currentIndex = contentBlocks.indexOf(block);

    console.log(`⬇️ Попытка переместить блок вниз. Текущий индекс: ${currentIndex}, всего блоков: ${contentBlocks.length}`);

    if (currentIndex < contentBlocks.length - 1) {
        const nextBlock = contentBlocks[currentIndex + 1];
        pageContent.insertBefore(nextBlock, block);

        // Обновляем позиции в БД
        if (window.NewBlockSystem && window.NewBlockSystem.updatePositions) {
            setTimeout(() => {
                window.NewBlockSystem.updatePositions();
            }, 100);
        }

        // Пересоздаем зоны
        setTimeout(() => {
            createDropZones();
        }, 100);

        showBlockNotification('Блок перемещен вниз!', 'success');
        console.log('✅ Блок перемещен вниз');
    } else {
        console.log('🚫 Блок уже в конце');
    }
}

// Дублирование блока
function duplicateBlock(block) {
    if (!block) return;

    const clonedBlock = block.cloneNode(true);

    // Убираем режим редактирования с клона
    clonedBlock.classList.remove('editing');
    clonedBlock.querySelectorAll('[contenteditable="true"]').forEach(element => {
        element.contentEditable = false;
    });

    // Вставляем после оригинального блока
    block.parentNode.insertBefore(clonedBlock, block.nextSibling);

    // Пересоздаем зоны
    setTimeout(() => {
        createDropZones();
    }, 100);

    showBlockNotification('Блок дублирован!', 'success');
    console.log('📋 Блок дублирован');
}

// Удаление блока
function deleteBlock(block) {
    if (!block) return;

    // Подтверждение удаления
    if (confirm('Вы уверены, что хотите удалить этот блок?')) {
        block.remove();

        // Пересоздаем зоны
        setTimeout(() => {
            createDropZones();
        }, 100);

        showBlockNotification('Блок удален!', 'success');
        console.log('🗑️ Блок удален');
    }
}

// ===== ПАНЕЛЬ НАСТРОЕК СТИЛЕЙ =====

let currentStyledBlock = null;

// Открытие панели стилей
function openStylePanel(block) {
    if (!block) return;

    currentStyledBlock = block;
    const panel = document.getElementById('stylePanel');

    if (!panel) {
        console.error('Панель стилей не найдена');
        return;
    }

    // Показываем панель
    panel.classList.add('open');

    // Обновляем состояние элементов управления
    updateStyleControls(block);

    // Привязываем обработчики
    bindStylePanelEvents();

    console.log('🎨 Панель стилей открыта');
}

// Закрытие панели стилей
function closeStylePanel() {
    const panel = document.getElementById('stylePanel');
    if (!panel) return;

    panel.classList.remove('open');
    currentStyledBlock = null;

    // Убираем обработчики
    unbindStylePanelEvents();

    console.log('🎨 Панель стилей закрыта');
}

// Обновление состояния элементов управления
function updateStyleControls(block) {
    // Цветовые схемы
    document.querySelectorAll('.color-scheme').forEach(scheme => {
        const schemeType = scheme.dataset.scheme;
        if (block.classList.contains(`scheme-${schemeType}`) || (schemeType === 'default' && !hasColorScheme(block))) {
            scheme.classList.add('active');
        } else {
            scheme.classList.remove('active');
        }
    });

    // Выравнивание
    document.querySelectorAll('.align-btn').forEach(btn => {
        const align = btn.dataset.align;
        if (block.classList.contains(`align-${align}`) || (align === 'left' && !hasAlignment(block))) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Эффекты
    document.querySelectorAll('.effect-checkbox input').forEach(checkbox => {
        const effect = checkbox.dataset.effect;
        checkbox.checked = block.classList.contains(`effect-${effect}`);
    });
}

// Проверка наличия цветовой схемы
function hasColorScheme(block) {
    return block.classList.contains('scheme-gold') ||
           block.classList.contains('scheme-blue') ||
           block.classList.contains('scheme-red');
}



// Проверка наличия выравнивания
function hasAlignment(block) {
    return block.classList.contains('align-center') ||
           block.classList.contains('align-right');
}

// Привязка обработчиков панели стилей
function bindStylePanelEvents() {
    // Кнопка закрытия
    const closeBtn = document.getElementById('stylePanelClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeStylePanel);
    }

    // Цветовые схемы
    document.querySelectorAll('.color-scheme').forEach(scheme => {
        scheme.addEventListener('click', handleColorSchemeChange);
    });

    // Цвет текста
    const colorPicker = document.getElementById('textColorPicker');
    const resetColorBtn = document.getElementById('resetTextColor');
    if (colorPicker) {
        colorPicker.addEventListener('change', handleTextColorChange);
        console.log('✅ Color picker обработчик привязан');
    } else {
        console.error('❌ Color picker не найден');
    }
    if (resetColorBtn) {
        resetColorBtn.addEventListener('click', handleResetTextColor);
        console.log('✅ Reset color button обработчик привязан');
    } else {
        console.error('❌ Reset color button не найден');
    }

    // Размер шрифта
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    const decreaseBtn = document.getElementById('decreaseFontSize');
    const increaseBtn = document.getElementById('increaseFontSize');

    if (fontSizeSelect) {
        fontSizeSelect.addEventListener('change', handleFontSizeSelectChange);
        console.log('✅ Font size select обработчик привязан');
    } else {
        console.error('❌ Font size select не найден');
    }
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', handleDecreaseFontSize);
        console.log('✅ Decrease font size button обработчик привязан');
    } else {
        console.error('❌ Decrease font size button не найден');
    }
    if (increaseBtn) {
        increaseBtn.addEventListener('click', handleIncreaseFontSize);
        console.log('✅ Increase font size button обработчик привязан');
    } else {
        console.error('❌ Increase font size button не найден');
    }

    // Выравнивание
    document.querySelectorAll('.align-btn').forEach(btn => {
        btn.addEventListener('click', handleAlignChange);
    });

    // Эффекты
    document.querySelectorAll('.effect-checkbox input').forEach(checkbox => {
        checkbox.addEventListener('change', handleEffectChange);
    });

    // Закрытие по клику вне панели
    document.addEventListener('click', handleStylePanelOutsideClick);
}

// Убрать обработчики панели стилей
function unbindStylePanelEvents() {
    const closeBtn = document.getElementById('stylePanelClose');
    if (closeBtn) {
        closeBtn.removeEventListener('click', closeStylePanel);
    }

    document.querySelectorAll('.color-scheme').forEach(scheme => {
        scheme.removeEventListener('click', handleColorSchemeChange);
    });

    // Цвет текста
    const colorPicker = document.getElementById('textColorPicker');
    const resetColorBtn = document.getElementById('resetTextColor');
    if (colorPicker) {
        colorPicker.removeEventListener('change', handleTextColorChange);
    }
    if (resetColorBtn) {
        resetColorBtn.removeEventListener('click', handleResetTextColor);
    }

    // Размер шрифта
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    const decreaseBtn = document.getElementById('decreaseFontSize');
    const increaseBtn = document.getElementById('increaseFontSize');

    if (fontSizeSelect) {
        fontSizeSelect.removeEventListener('change', handleFontSizeSelectChange);
    }
    if (decreaseBtn) {
        decreaseBtn.removeEventListener('click', handleDecreaseFontSize);
    }
    if (increaseBtn) {
        increaseBtn.removeEventListener('click', handleIncreaseFontSize);
    }

    document.querySelectorAll('.align-btn').forEach(btn => {
        btn.removeEventListener('click', handleAlignChange);
    });

    document.querySelectorAll('.effect-checkbox input').forEach(checkbox => {
        checkbox.removeEventListener('change', handleEffectChange);
    });

    document.removeEventListener('click', handleStylePanelOutsideClick);
}

// Обработчики изменения стилей
function handleColorSchemeChange(e) {
    if (!currentStyledBlock) return;

    const scheme = this.dataset.scheme;

    // Убираем все цветовые схемы
    currentStyledBlock.classList.remove('scheme-gold', 'scheme-blue', 'scheme-red');

    // Добавляем новую схему (кроме default)
    if (scheme !== 'default') {
        currentStyledBlock.classList.add(`scheme-${scheme}`);
    }

    // Обновляем активные элементы
    document.querySelectorAll('.color-scheme').forEach(s => s.classList.remove('active'));
    this.classList.add('active');

    // Сохраняем изменения в БД
    if (window.NewBlockSystem && window.NewBlockSystem.saveBlockContent) {
        setTimeout(() => {
            window.NewBlockSystem.saveBlockContent(currentStyledBlock);
        }, 100);
    }

    showBlockNotification(`Цветовая схема изменена!`, 'success');
}



function handleAlignChange(e) {
    if (!currentStyledBlock) return;

    const align = this.dataset.align;

    // Убираем все выравнивания
    currentStyledBlock.classList.remove('align-center', 'align-right');

    // Добавляем новое выравнивание (кроме left)
    if (align !== 'left') {
        currentStyledBlock.classList.add(`align-${align}`);
    }

    // Обновляем активные элементы
    document.querySelectorAll('.align-btn').forEach(btn => btn.classList.remove('active'));
    this.classList.add('active');

    // Сохраняем изменения в БД без обновления позиций
    if (window.NewBlockSystem && window.NewBlockSystem.saveBlockContent) {
        setTimeout(() => {
            window.NewBlockSystem.saveBlockContent(currentStyledBlock);
        }, 100);
    }

    showBlockNotification(`Выравнивание изменено!`, 'success');
}

function handleEffectChange(e) {
    if (!currentStyledBlock) return;

    const effect = this.dataset.effect;
    const isChecked = this.checked;

    if (isChecked) {
        currentStyledBlock.classList.add(`effect-${effect}`);
    } else {
        currentStyledBlock.classList.remove(`effect-${effect}`);
    }

    // Сохраняем изменения в БД
    if (window.NewBlockSystem && window.NewBlockSystem.saveBlockContent) {
        setTimeout(() => {
            window.NewBlockSystem.saveBlockContent(currentStyledBlock);
        }, 100);
    }

    showBlockNotification(`Эффект ${isChecked ? 'добавлен' : 'убран'}!`, 'success');
}

function handleStylePanelOutsideClick(e) {
    const panel = document.getElementById('stylePanel');
    if (!panel.contains(e.target) && !e.target.closest('.context-menu-item[data-action="style"]')) {
        closeStylePanel();
    }
}

// Новые обработчики для цвета и размера шрифта
function handleTextColorChange(e) {
    console.log('🎨 handleTextColorChange вызван', e.target.value);

    const color = e.target.value;
    const selection = window.getSelection();

    console.log('Selection:', selection, 'Range count:', selection.rangeCount, 'Is collapsed:', selection.isCollapsed);

    if (selection.rangeCount > 0 && !selection.isCollapsed) {
        // Если есть выделенный текст
        console.log('Применяем цвет к выделенному тексту');
        applyColorToSelection(selection, color);
        showBlockNotification('Цвет текста изменен для выделенного текста!', 'success');
    } else if (currentStyledBlock) {
        // Если нет выделения, применяем ко всем текстовым элементам в блоке
        console.log('Применяем цвет ко всем текстовым элементам в блоке');
        applyColorToAllTextElements(currentStyledBlock, color);
        showBlockNotification('Цвет текста изменен для всего блока!', 'success');
    } else {
        console.error('Нет текущего блока для стилизации');
    }

    console.log(`🎨 Применен цвет текста: ${color}`);
}

function handleResetTextColor() {
    console.log('🔄 handleResetTextColor вызван');

    if (currentStyledBlock) {
        // Сбрасываем цвет всех текстовых элементов
        resetColorForAllTextElements(currentStyledBlock);
        showBlockNotification('Цвет текста сброшен!', 'success');
        console.log('✅ Цвет блока сброшен');
    } else {
        console.error('Нет текущего блока для сброса цвета');
    }

    // Сбрасываем значение color picker
    const colorPicker = document.getElementById('textColorPicker');
    if (colorPicker) {
        colorPicker.value = '#ffffff';
    }
}

function handleFontSizeSelectChange(e) {
    console.log('📐 handleFontSizeSelectChange вызван', e.target.value);

    const fontSize = e.target.value + 'px';

    if (currentStyledBlock) {
        // Применяем ко всем текстовым элементам в блоке
        applyFontSizeToAllTextElements(currentStyledBlock, fontSize);
        showBlockNotification(`Размер шрифта изменен: ${fontSize}!`, 'success');
        console.log(`✅ Размер шрифта применен к блоку: ${fontSize}`);
    } else {
        console.error('Нет текущего блока для изменения размера');
    }
}

function handleDecreaseFontSize() {
    console.log('📐 handleDecreaseFontSize вызван');

    if (currentStyledBlock) {
        // Уменьшаем размер всех текстовых элементов
        changeFontSizeForAllTextElements(currentStyledBlock, -2);
        showBlockNotification('Размер шрифта уменьшен!', 'success');
        console.log('✅ Размер шрифта уменьшен');
    } else {
        console.error('Нет текущего блока для уменьшения размера');
    }
}

function handleIncreaseFontSize() {
    console.log('📐 handleIncreaseFontSize вызван');

    if (currentStyledBlock) {
        // Увеличиваем размер всех текстовых элементов
        changeFontSizeForAllTextElements(currentStyledBlock, 2);
        showBlockNotification('Размер шрифта увеличен!', 'success');
        console.log('✅ Размер шрифта увеличен');
    } else {
        console.error('Нет текущего блока для увеличения размера');
    }
}

// Вспомогательные функции
function applyColorToSelection(selection, color) {
    console.log('🎨 applyColorToSelection вызван с цветом:', color);
    // Пока упростим - применим к родительскому элементу
    const range = selection.getRangeAt(0);
    const element = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer;

    if (element) {
        element.style.setProperty('color', color, 'important');
        console.log('✅ Цвет применен к элементу:', element);
    }
}

// Применить цвет ко всем текстовым элементам в блоке
function applyColorToAllTextElements(block, color) {
    const textElements = block.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, li, a, button, blockquote, cite');

    textElements.forEach((element) => {
        element.style.setProperty('color', color, 'important');
    });

    // Также применяем к самому блоку на случай прямого текста
    block.style.setProperty('color', color, 'important');

    // Сохраняем изменения в БД
    if (window.NewBlockSystem && window.NewBlockSystem.saveBlockContent) {
        setTimeout(() => {
            window.NewBlockSystem.saveBlockContent(block);
        }, 100);
    }
}

// Сбросить цвет для всех текстовых элементов
function resetColorForAllTextElements(block) {
    const textElements = block.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, li, a, button, blockquote, cite');
    console.log(`🔄 Сбрасываем цвет для ${textElements.length} текстовых элементов`);

    textElements.forEach((element, index) => {
        element.style.removeProperty('color');
        console.log(`✅ Цвет сброшен для элемента ${index + 1}:`, element.tagName);
    });

    // Также сбрасываем для самого блока
    block.style.removeProperty('color');
}

// Применить размер шрифта ко всем текстовым элементам
function applyFontSizeToAllTextElements(block, fontSize) {
    const textElements = block.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, li, a, button, blockquote, cite');
    console.log(`📐 Найдено ${textElements.length} текстовых элементов для изменения размера`);

    textElements.forEach((element, index) => {
        element.style.setProperty('font-size', fontSize, 'important');
        console.log(`✅ Размер применен к элементу ${index + 1}:`, element.tagName, fontSize);
    });

    // Также применяем к самому блоку
    block.style.setProperty('font-size', fontSize, 'important');
}

// Изменить размер шрифта для всех текстовых элементов
function changeFontSizeForAllTextElements(block, delta) {
    const textElements = block.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, li, a, button, blockquote, cite');

    textElements.forEach((element) => {
        const currentSize = parseInt(window.getComputedStyle(element).fontSize) || 16;
        const newSize = Math.max(8, Math.min(72, currentSize + delta));
        element.style.setProperty('font-size', newSize + 'px', 'important');
    });

    // Обновляем select с размером первого элемента
    if (textElements.length > 0) {
        const firstElementSize = parseInt(window.getComputedStyle(textElements[0]).fontSize);
        const fontSizeSelect = document.getElementById('fontSizeSelect');
        if (fontSizeSelect) {
            fontSizeSelect.value = firstElementSize;
        }
    }

    // Сохраняем изменения в БД
    if (window.NewBlockSystem && window.NewBlockSystem.saveBlockContent) {
        setTimeout(() => {
            window.NewBlockSystem.saveBlockContent(block);
        }, 100);
    }
}

// Эта функция теперь не используется, заменена на changeFontSizeForAllTextElements

// Добавление блока в конкретную позицию
function addBlockToPosition(categoryKey, blockId, dropZone) {
    const block = BLOCKS_LIBRARY[categoryKey].blocks.find(b => b.id === blockId);
    if (!block) return;

    // Создаем новый элемент
    const newElement = document.createElement('div');
    newElement.className = 'content-block';
    newElement.innerHTML = block.template;

    // Вставляем в нужную позицию
    if (dropZone.dataset.zoneId === 'top') {
        // В начало страницы
        dropZone.parentNode.insertBefore(newElement, dropZone.nextSibling);
    } else if (dropZone.dataset.zoneId === 'center') {
        // В центр пустой страницы
        dropZone.parentNode.insertBefore(newElement, dropZone);
        dropZone.remove(); // Удаляем центральную зону
    } else {
        // После определенного блока
        dropZone.parentNode.insertBefore(newElement, dropZone);
    }

    // Пересоздаем зоны вставки
    setTimeout(() => {
        createDropZones();
    }, 100);

    // Закрываем панель блоков
    closeBlocksPanel();

    // Показываем уведомление
    showBlockNotification(`Блок "${block.name}" добавлен!`, 'success');

    console.log(`✅ Блок добавлен через drag & drop: ${block.name}`);
}

// Добавление блока на страницу (старый метод для клика)
function addBlockToPage(categoryKey, blockId) {
    const block = BLOCKS_LIBRARY[categoryKey].blocks.find(b => b.id === blockId);
    if (!block) return;

    // Находим контейнер для вставки блоков
    const pageContent = document.querySelector('.page-content');
    if (!pageContent) {
        console.error('Контейнер .page-content не найден');
        return;
    }

    // Создаем новый элемент
    const newElement = document.createElement('div');
    newElement.className = 'content-block';
    newElement.innerHTML = block.template;

    // Добавляем в конец контейнера
    pageContent.appendChild(newElement);

    // Пересоздаем зоны вставки
    setTimeout(() => {
        createDropZones();
    }, 100);

    // Закрываем панель блоков
    closeBlocksPanel();

    // Показываем уведомление
    showBlockNotification(`Блок "${block.name}" добавлен!`, 'success');

    console.log(`✅ Добавлен блок: ${block.name}`);
}

// Показ уведомлений
function showBlockNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `block-notification block-notification-${type}`;
    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : '#2196f3'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 2000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Анимация появления
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Удаление через 3 секунды
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Проверка прав администратора
function isUserAdmin() {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            return false;
        }
        const user = JSON.parse(userStr);
        return user && user.role === 'admin';
    } catch (error) {
        console.error('Ошибка проверки прав администратора:', error);
        return false;
    }
}

// Инициализация системы блоков
function initializeBlocksSystem() {
    const trigger = document.getElementById('blocksTrigger');
    const panel = document.getElementById('blocksPanel');

    if (!trigger || !panel) {
        console.log('Элементы панели блоков не найдены на этой странице');
        return;
    }

    // КРИТИЧЕСКАЯ ПРОВЕРКА: Система блоков доступна ТОЛЬКО администраторам
    if (!isUserAdmin()) {
        console.log('Доступ к системе папирус блоков запрещен: пользователь не является администратором');
        // Скрываем элементы системы блоков
        if (trigger) trigger.style.display = 'none';
        if (panel) panel.style.display = 'none';
        return;
    }

    // Очищаем старые зоны вставки при инициализации
    cleanupDropZones();
    
    // Обработчик клика по триггеру
    trigger.addEventListener('click', function() {
        toggleBlocksPanel();
    });
    
    // Закрытие панели при клике вне её
    document.addEventListener('click', function(e) {
        if (!panel.contains(e.target) && !trigger.contains(e.target) && panel.classList.contains('open')) {
            closeBlocksPanel();
        }
    });
    
    // Закрытие панели по ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && panel.classList.contains('open')) {
            closeBlocksPanel();
        }
    });
    
    // Загружаем библиотеку блоков
    renderBlocksLibrary();

    // НЕ создаем зоны при инициализации - только при перетаскивании

    console.log('🏗️ Система блоков "Конструктор Пирамиды" инициализирована');

    // Инициализируем систему изображений
    initializeImageSystem();

    // Инициализируем систему видео
    initializeVideoSystem();

    // Инициализируем новую систему позиционирования блоков
    if (typeof window.NewBlockSystem !== 'undefined') {
        setTimeout(() => {
            window.NewBlockSystem.initialize();
            console.log('🚀 Новая система позиционирования блоков активирована');
        }, 500);
    }
}

// ===== СИСТЕМА ИЗОБРАЖЕНИЙ =====

function initializeImageSystem() {
    // Добавляем обработчики для существующих изображений
    document.addEventListener('click', handleImageClick);
    console.log('🖼️ Система изображений инициализирована');
}

// Обработчик клика по изображениям
function handleImageClick(e) {
    // Проверяем, клик по placeholder изображения
    if (e.target.classList.contains('image-placeholder') ||
        e.target.closest('.image-placeholder')) {

        e.preventDefault();
        e.stopPropagation();

        const placeholder = e.target.classList.contains('image-placeholder')
            ? e.target
            : e.target.closest('.image-placeholder');

        console.log('🖼️ Клик по placeholder изображения');
        openImageUploadDialog(placeholder);
    }

    // Проверяем, клик по загруженному изображению
    if (e.target.tagName === 'IMG' && e.target.closest('.content-block')) {
        e.preventDefault();
        e.stopPropagation();

        console.log('🖼️ Клик по загруженному изображению');
        openImageEditDialog(e.target);
    }
}

// Открыть диалог загрузки изображения
function openImageUploadDialog(placeholder) {
    // Создаем input для выбора файла
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            console.log('📁 Файл выбран:', file.name);
            loadImageFromFile(file, placeholder);
        }
        // Удаляем временный input
        document.body.removeChild(fileInput);
    });

    // Добавляем в DOM и кликаем
    document.body.appendChild(fileInput);
    fileInput.click();
}

// Загрузить изображение из файла
async function loadImageFromFile(file, placeholder) {
    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showBlockNotification('Файл слишком большой! Максимум 5MB.', 'error');
        return;
    }

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
        showBlockNotification('Выберите файл изображения!', 'error');
        return;
    }

    try {
        // Загружаем изображение на сервер
        const imageUrl = await uploadImageToServer(file);
        console.log('✅ Изображение загружено на сервер:', imageUrl);

        // Заменяем placeholder на реальное изображение
        replaceImagePlaceholder(placeholder, imageUrl, file.name);

        showBlockNotification('Изображение загружено!', 'success');
    } catch (error) {
        console.error('❌ Ошибка загрузки изображения:', error);
        showBlockNotification('Ошибка загрузки изображения!', 'error');
    }
}

// Загрузить изображение на сервер
async function uploadImageToServer(file) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('page_id', getCurrentPageId());

    const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.error || 'Ошибка загрузки изображения');
    }

    return result.imageUrl || result.url;
}

// Получить ID текущей страницы
function getCurrentPageId() {
    const path = window.location.pathname;
    const pageName = path.split('/').pop().replace('.html', '');
    if (pageName === 'index') return 'home';
    if (pageName === 'test-blocks-system') return 'test-blocks-system';
    return pageName || 'home';
}

// Заменить placeholder на реальное изображение
function replaceImagePlaceholder(placeholder, imageUrl, fileName) {
    // Создаем новый img элемент
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = fileName || 'Загруженное изображение';
    img.className = 'uploaded-image';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.borderRadius = '8px';
    img.style.cursor = 'pointer';
    img.title = 'Кликните для редактирования';

    // Заменяем placeholder
    placeholder.parentNode.replaceChild(img, placeholder);

    console.log('🖼️ Placeholder заменен на изображение');
}

// Открыть диалог редактирования изображения
function openImageEditDialog(img) {
    // Создаем простое меню для изображения
    const menu = document.createElement('div');
    menu.className = 'image-edit-menu';
    menu.innerHTML = `
        <div class="image-menu-header">
            <span>🖼️ Редактирование изображения</span>
            <button class="image-menu-close">✕</button>
        </div>
        <div class="image-menu-actions">
            <button class="image-action-btn" data-action="replace">
                <span>🔄</span> Заменить изображение
            </button>
            <button class="image-action-btn" data-action="resize">
                <span>📐</span> Изменить размер
            </button>
            <button class="image-action-btn danger" data-action="remove">
                <span>🗑️</span> Удалить изображение
            </button>
        </div>
    `;

    // Позиционируем меню рядом с изображением
    const rect = img.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.left = (rect.right + 10) + 'px';
    menu.style.top = rect.top + 'px';
    menu.style.zIndex = '2000';

    document.body.appendChild(menu);

    // Обработчики для меню
    menu.addEventListener('click', function(e) {
        const action = e.target.closest('[data-action]')?.dataset.action;

        switch (action) {
            case 'replace':
                replaceImage(img);
                break;
            case 'resize':
                resizeImage(img);
                break;
            case 'remove':
                removeImage(img);
                break;
        }

        // Закрываем меню
        document.body.removeChild(menu);
    });

    // Закрытие по клику на крестик или вне меню
    menu.querySelector('.image-menu-close').addEventListener('click', () => {
        document.body.removeChild(menu);
    });

    // Закрытие по клику вне меню
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && e.target !== img) {
                if (document.body.contains(menu)) {
                    document.body.removeChild(menu);
                }
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

// Заменить изображение
async function replaceImage(img) {
    console.log('🔄 Замена изображения');

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            try {
                // Загружаем новое изображение на сервер
                const imageUrl = await uploadImageToServer(file);
                img.src = imageUrl;
                img.alt = file.name;
                showBlockNotification('Изображение заменено!', 'success');
            } catch (error) {
                console.error('❌ Ошибка замены изображения:', error);
                showBlockNotification('Ошибка замены изображения!', 'error');
            }
        }
        document.body.removeChild(fileInput);
    });

    document.body.appendChild(fileInput);
    fileInput.click();
}

// Изменить размер изображения
function resizeImage(img) {
    console.log('📐 Изменение размера изображения');

    const currentWidth = img.style.width || '100%';
    const newWidth = prompt('Введите ширину изображения (например: 50%, 300px, auto):', currentWidth);

    if (newWidth !== null && newWidth.trim() !== '') {
        img.style.width = newWidth.trim();
        showBlockNotification('Размер изображения изменен!', 'success');
    }
}

// Удалить изображение
function removeImage(img) {
    console.log('🗑️ Удаление изображения');

    if (confirm('Вы уверены, что хотите удалить это изображение?')) {
        // Создаем новый placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.innerHTML = `
            <div class="placeholder-content">
                <span class="placeholder-icon">🖼️</span>
                <span class="placeholder-text">Кликните для загрузки изображения</span>
            </div>
        `;

        // Заменяем изображение на placeholder
        img.parentNode.replaceChild(placeholder, img);

        showBlockNotification('Изображение удалено!', 'success');
    }
}

// ===== СИСТЕМА ВИДЕО БЛОКОВ =====

function initializeVideoSystem() {
    // Добавляем обработчики для видео блоков
    document.addEventListener('click', handleVideoClick);
    console.log('📺 Система видео блоков инициализирована');
}

// Обработчик клика по видео блокам
function handleVideoClick(e) {
    // Проверяем, клик по placeholder видео
    if (e.target.classList.contains('video-placeholder') ||
        e.target.closest('.video-placeholder')) {

        e.preventDefault();
        e.stopPropagation();

        const placeholder = e.target.classList.contains('video-placeholder')
            ? e.target
            : e.target.closest('.video-placeholder');

        const videoType = placeholder.dataset.videoType;

        switch (videoType) {
            case 'youtube':
                handleYouTubeVideo(placeholder);
                break;
            case 'rutube':
                handleRutubeVideo(placeholder);
                break;
            case 'local':
                handleLocalVideo(placeholder);
                break;
            case 'iframe':
                handleIframeVideo(placeholder);
                break;
        }
    }

    // Обработчики для кнопок добавления видео
    if (e.target.classList.contains('video-add-btn')) {
        e.preventDefault();
        e.stopPropagation();

        const placeholder = e.target.closest('.video-placeholder');
        const videoType = placeholder.dataset.videoType;

        if (videoType === 'youtube') {
            processYouTubeUrl(placeholder);
        } else if (videoType === 'rutube') {
            processRutubeUrl(placeholder);
        } else if (videoType === 'iframe') {
            processIframeCode(placeholder);
        }
    }
}

// Обработка YouTube видео
function handleYouTubeVideo(placeholder) {
    const input = placeholder.querySelector('.video-url-input');
    const button = placeholder.querySelector('.video-add-btn');
    const text = placeholder.querySelector('.placeholder-text');

    if (input.style.display === 'none') {
        input.style.display = 'block';
        button.style.display = 'block';
        text.textContent = 'Вставьте ссылку на YouTube видео:';
        input.focus();
    }
}

// Обработка Rutube видео
function handleRutubeVideo(placeholder) {
    const input = placeholder.querySelector('.video-url-input');
    const button = placeholder.querySelector('.video-add-btn');
    const text = placeholder.querySelector('.placeholder-text');

    if (input.style.display === 'none') {
        input.style.display = 'block';
        button.style.display = 'block';
        text.textContent = 'Вставьте ссылку на Rutube видео:';
        input.focus();
    }
}

// Обработка локального видео
function handleLocalVideo(placeholder) {
    const fileInput = placeholder.querySelector('.video-file-input');

    // Удаляем старые обработчики, если есть
    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);

    newFileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            try {
                const videoUrl = await uploadVideoToServer(file);
                createVideoElement(placeholder, videoUrl, 'local');
                showBlockNotification('Видео загружено!', 'success');
            } catch (error) {
                console.error('❌ Ошибка загрузки видео:', error);
                showBlockNotification('Ошибка загрузки видео!', 'error');
            }
        }
    });

    newFileInput.click();
}

// Обработка iframe видео
function handleIframeVideo(placeholder) {
    const textarea = placeholder.querySelector('.video-iframe-input');
    const button = placeholder.querySelector('.video-add-btn');
    const text = placeholder.querySelector('.placeholder-text');

    if (textarea.style.display === 'none') {
        textarea.style.display = 'block';
        button.style.display = 'block';
        text.textContent = 'Вставьте iframe код видео:';
        textarea.focus();
    }
}

// Обработка URL YouTube
function processYouTubeUrl(placeholder) {
    const input = placeholder.querySelector('.video-url-input');
    const url = input.value.trim();

    if (!url) {
        showBlockNotification('Введите ссылку на видео!', 'error');
        return;
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
        showBlockNotification('Неверная ссылка на YouTube видео!', 'error');
        return;
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    createVideoElement(placeholder, embedUrl, 'youtube');
    showBlockNotification('YouTube видео добавлено!', 'success');
}

// Обработка URL Rutube
function processRutubeUrl(placeholder) {
    const input = placeholder.querySelector('.video-url-input');
    const url = input.value.trim();

    if (!url) {
        showBlockNotification('Введите ссылку на видео!', 'error');
        return;
    }

    const videoId = extractRutubeId(url);
    if (!videoId) {
        showBlockNotification('Неверная ссылка на Rutube видео!', 'error');
        return;
    }

    const embedUrl = `https://rutube.ru/play/embed/${videoId}`;
    createVideoElement(placeholder, embedUrl, 'rutube');
    showBlockNotification('Rutube видео добавлено!', 'success');
}

// Обработка iframe кода
function processIframeCode(placeholder) {
    const textarea = placeholder.querySelector('.video-iframe-input');
    const iframeCode = textarea.value.trim();

    if (!iframeCode) {
        showBlockNotification('Введите iframe код!', 'error');
        return;
    }

    if (!iframeCode.includes('<iframe') || !iframeCode.includes('</iframe>')) {
        showBlockNotification('Неверный iframe код!', 'error');
        return;
    }

    createVideoElement(placeholder, iframeCode, 'iframe');
    showBlockNotification('Видео добавлено!', 'success');
}

// Переключение состояния панели блоков
function toggleBlocksPanel() {
    // КРИТИЧЕСКАЯ ПРОВЕРКА: Только администраторы могут использовать панель блоков
    if (!isUserAdmin()) {
        console.warn('Попытка доступа к панели блоков без прав администратора');
        alert('Доступ к системе папирус блоков разрешен только администраторам');
        return;
    }

    const panel = document.getElementById('blocksPanel');
    const trigger = document.getElementById('blocksTrigger');

    if (panel.classList.contains('open')) {
        closeBlocksPanel();
    } else {
        openBlocksPanel();
    }
}

// Открытие панели блоков
function openBlocksPanel() {
    // КРИТИЧЕСКАЯ ПРОВЕРКА: Только администраторы могут открыть панель блоков
    if (!isUserAdmin()) {
        console.warn('Попытка открытия панели блоков без прав администратора');
        return;
    }

    const panel = document.getElementById('blocksPanel');
    const trigger = document.getElementById('blocksTrigger');

    panel.classList.add('open');
    trigger.classList.add('active');
    
    // Анимация появления с задержкой
    setTimeout(() => {
        panel.style.boxShadow = `
            4px 0 20px rgba(0, 0, 0, 0.4),
            inset -2px 0 4px rgba(0, 0, 0, 0.2),
            0 0 30px rgba(255, 215, 0, 0.2)
        `;
    }, 200);
    
    console.log('📜 Панель блоков открыта');
}

// Закрытие панели блоков
function closeBlocksPanel() {
    const panel = document.getElementById('blocksPanel');
    const trigger = document.getElementById('blocksTrigger');
    
    panel.classList.remove('open');
    trigger.classList.remove('active');
    
    // Убираем дополнительное свечение
    panel.style.boxShadow = `
        4px 0 20px rgba(0, 0, 0, 0.4),
        inset -2px 0 4px rgba(0, 0, 0, 0.2)
    `;
    
    console.log('📜 Панель блоков закрыта');
}

// Автоинициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    initializeBlocksSystem();
});

// Экспорт в глобальную область
window.BlocksSystem = {
    init: initializeBlocksSystem,
    toggle: toggleBlocksPanel,
    open: openBlocksPanel,
    close: closeBlocksPanel,
    handleBlockContextMenu: handleBlockContextMenu
};

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ВИДЕО =====

// Извлечение ID из YouTube URL
function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Извлечение ID из Rutube URL
function extractRutubeId(url) {
    const regExp = /rutube\.ru\/video\/([a-zA-Z0-9]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

// Создание видео элемента
function createVideoElement(placeholder, source, type) {
    const videoContainer = placeholder.closest('.content-video');

    // Создаем контейнер для видео
    const videoEmbed = document.createElement('div');
    videoEmbed.className = 'video-embed';

    if (type === 'iframe') {
        // Для iframe кода вставляем как есть
        videoEmbed.innerHTML = source;
    } else if (type === 'local') {
        // Для локального видео создаем video элемент
        videoEmbed.innerHTML = `
            <video controls>
                <source src="${source}" type="video/mp4">
                Ваш браузер не поддерживает видео.
            </video>
        `;
    } else {
        // Для YouTube и Rutube создаем iframe
        videoEmbed.innerHTML = `
            <iframe
                src="${source}"
                frameborder="0"
                allowfullscreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
            </iframe>
        `;
    }

    // Заменяем placeholder на видео
    placeholder.parentNode.replaceChild(videoEmbed, placeholder);

    // Сохраняем блок после создания видео
    const contentBlock = videoContainer.closest('.content-block');
    if (contentBlock && typeof window.NewBlockSystem !== 'undefined' && window.NewBlockSystem.saveBlockContent) {
        setTimeout(() => {
            window.NewBlockSystem.saveBlockContent(contentBlock);
            console.log('💾 Видео блок сохранен в базе данных');
        }, 100);
    }
}

// Загрузка видео на сервер
async function uploadVideoToServer(file) {
    const formData = new FormData();
    formData.append('video', file);

    try {
        const response = await fetch('/api/upload/video', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Ошибка загрузки видео на сервер');
        }

        const result = await response.json();
        return result.url;
    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
        // Fallback: создаем локальный URL для предварительного просмотра
        return URL.createObjectURL(file);
    }
}

// Экспорт библиотеки блоков для тестирования
window.blockLibrary = [];
Object.values(BLOCKS_LIBRARY).forEach(category => {
    if (category.blocks) {
        window.blockLibrary.push(...category.blocks);
    }
});
