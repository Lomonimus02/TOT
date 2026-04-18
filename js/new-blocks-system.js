// ===== НОВАЯ СИСТЕМА ПОЗИЦИОНИРОВАНИЯ БЛОКОВ =====
// Полностью переработанная система с поддержкой 4-направленного позиционирования

// ===== ГЛОБАЛЬНЫЙ ОБЪЕКТ ДЛЯ ИНТЕГРАЦИИ =====
window.NewBlockSystem = window.NewBlockSystem || {};

// ===== КОНСТАНТЫ И КОНФИГУРАЦИЯ =====

const POSITION_TYPES = {
    ABOVE: 'above',
    BELOW: 'below', 
    LEFT: 'left',
    RIGHT: 'right'
};

const BLOCK_LAYOUT_TYPES = {
    FULL_WIDTH: 'full-width',      // Блок занимает всю ширину
    HALF_WIDTH: 'half-width',      // Блок занимает половину ширины
    FLEXIBLE: 'flexible'           // Блок адаптируется к содержимому
};

// Глобальные переменные для системы
let draggedBlockData = null;
let currentDropZones = [];
let blockIdCounter = 0;
let lastZonePosition = null; // Для оптимизации пересоздания зон

// ===== ОТЛАДОЧНЫЕ ФУНКЦИИ =====

/**
 * Включение/выключение режима отладки границ блоков
 */
function toggleDebugMode(enable = null) {
    const body = document.body;
    // Debug visuals are fully disabled in production
    body.classList.remove('debug-block-boundaries');
    return false;
}

/**
 * Логирование координат всех блоков на странице
 */
function logBlockCoordinates() {
    // Функция оставлена для совместимости, но без вывода в консоль
}

// Отладочные функции недоступны глобально в продакшене
// window.toggleDebugMode = toggleDebugMode;
// window.logBlockCoordinates = logBlockCoordinates;

// ===== ФУНКЦИИ НОРМАЛИЗАЦИИ ИЗОБРАЖЕНИЙ =====

/**
 * Нормализация изображений в блоке
 * Убирает отрицательный margin и корректирует позицию блока
 */
function normalizeImagesInBlock(block) {
    if (!block || !block.classList.contains('free-positioned')) {
        return;
    }

    const images = block.querySelectorAll('img:not(.image-placeholder)');

    images.forEach(img => {
        const currentMarginLeft = parseFloat(img.style.marginLeft) || 0;
        const currentMarginTop = parseFloat(img.style.marginTop) || 0;

        // Если margin отрицательный, нормализуем
        if (currentMarginLeft < 0 || currentMarginTop < 0) {
            // Получаем текущую позицию блока
            const currentLeft = parseFloat(block.dataset.freeLeft) || parseFloat(block.style.left) || 0;
            const currentTop = parseFloat(block.dataset.freeTop) || parseFloat(block.style.top) || 0;

            // Вычисляем новую позицию блока (сдвигаем на величину отрицательного margin)
            const newLeft = currentLeft + currentMarginLeft;
            const newTop = currentTop + currentMarginTop;

            // Получаем размеры изображения
            const imgWidth = parseFloat(img.style.width) || img.offsetWidth;
            const imgHeight = parseFloat(img.style.height) || img.offsetHeight;

            // Вычисляем новый размер блока
            const newBlockWidth = imgWidth + Math.abs(currentMarginLeft);
            const newBlockHeight = imgHeight + Math.abs(currentMarginTop);

            // Применяем новую позицию блока
            block.style.setProperty('left', newLeft + 'px', 'important');
            block.style.setProperty('top', newTop + 'px', 'important');
            block.dataset.freeLeft = newLeft;
            block.dataset.freeTop = newTop;

            // Сбрасываем margin изображения
            img.style.marginLeft = '0px';
            img.style.marginTop = '0px';

            // Устанавливаем новый размер блока
            block.style.width = newBlockWidth + 'px';
            block.style.height = newBlockHeight + 'px';

        }
    });
}

/**
 * Кастомное диалоговое окно подтверждения удаления блока
 */
function showDeleteConfirmation(message = 'Вы уверены, что хотите удалить этот блок?') {
    return new Promise((resolve) => {
        // Создаем HTML для диалогового окна
        const overlay = document.createElement('div');
        overlay.className = 'delete-confirmation-overlay';
        overlay.innerHTML = `
            <div class="delete-confirmation-dialog">
                <h3 class="delete-confirmation-title">Подтверждение удаления</h3>
                <p class="delete-confirmation-message">${message}</p>
                <div class="delete-confirmation-buttons">
                    <button class="delete-confirmation-btn cancel" data-action="cancel">Отмена</button>
                    <button class="delete-confirmation-btn confirm" data-action="confirm">Удалить</button>
                </div>
            </div>
        `;

        // Добавляем в DOM
        document.body.appendChild(overlay);

        // Показываем с анимацией
        setTimeout(() => {
            overlay.classList.add('show');
        }, 10);

        // Обработчики кнопок
        overlay.addEventListener('click', (e) => {
            const action = e.target.dataset.action;

            if (action === 'confirm') {
                // Скрываем диалог
                overlay.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    resolve(true);
                }, 300);
            } else if (action === 'cancel' || e.target === overlay) {
                // Скрываем диалог
                overlay.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    resolve(false);
                }, 300);
            }
        });

        // Закрытие по Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                overlay.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    resolve(false);
                }, 300);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

/**
 * Удаление отладочных JSON данных со страницы
 */
function removeDebugJsonData() {
    const pageContent = document.querySelector('.page-content');
    if (!pageContent) return;

    // КРИТИЧЕСКИ ВАЖНО: Удаляем JSON данные из ВСЕГО документа, не только из .page-content
    const containers = [pageContent, document.body];

    containers.forEach(container => {
        if (!container) return;

        // Ищем и удаляем JSON данные в текстовых узлах
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Пропускаем текстовые узлы внутри script и style тегов
                    const parent = node.parentElement;
                    if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );

        const textNodesToRemove = [];
        let node;

        while (node = walker.nextNode()) {
            const text = node.textContent.trim();

            // Более агрессивная проверка - любой текст, начинающийся с { или [ и содержащий кавычки
            if ((text.startsWith('{') || text.startsWith('[')) && text.includes('"')) {
                // Проверяем, является ли это JSON объектом или массивом
                try {
                    const parsed = JSON.parse(text);
                    // Если парсится как JSON и это объект или массив - это отладочные данные, удаляем
                    if (typeof parsed === 'object' && parsed !== null) {
                        textNodesToRemove.push(node);
                    }
                } catch (e) {
                    // Не JSON, пропускаем
                }
            }
        }

        // Удаляем найденные текстовые узлы
        textNodesToRemove.forEach(node => {
            if (node.parentNode) {
                node.parentNode.removeChild(node);
            }
        });
    });
}

// ===== ОСНОВНЫЕ ФУНКЦИИ СИСТЕМЫ =====

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

/**
 * Инициализация новой системы блоков
 */
async function initializeNewBlockSystem() {
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Загружаем блоки для ВСЕХ пользователей
    // Блоки должны быть видны всем, независимо от роли

    // КРИТИЧЕСКИ ВАЖНО: Удаляем JSON данные СРАЗУ, ДО загрузки блоков
    removeDebugJsonData();

    // КРИТИЧЕСКИ ВАЖНО: Восстанавливаем высоту контейнера ДО загрузки блоков
    // Это предотвращает дерганую подгрузку страницы
    if (window.FreePositioning && typeof window.FreePositioning.restoreContainerHeight === 'function') {
        window.FreePositioning.restoreContainerHeight();
    }

    // КРИТИЧЕСКИ ВАЖНО: Загружаем блоки АСИНХРОННО, не блокируя выполнение
    // Это позволяет функции завершиться, даже если fetch зависнет
    loadBlocksFromDatabase().then(() => {
        // КРИТИЧЕСКИ ВАЖНО: Удаляем JSON данные ПОСЛЕ загрузки блоков
        removeDebugJsonData();

        // И еще раз через небольшую задержку
        setTimeout(() => {
            removeDebugJsonData();
        }, 100);

        setTimeout(() => {
            removeDebugJsonData();
        }, 300);
    }).catch(error => {
        // Удаляем JSON данные даже при ошибке
        removeDebugJsonData();
    });

    // Функции редактирования и создания блоков только для администраторов
    if (isUserAdmin()) {

        // Очищаем старые обработчики
        cleanupOldSystem();

        // Инициализируем новые обработчики для редактирования
        setupDragAndDropHandlers();
        setupBlockInteractions();

        // Обновляем систему блоков (переиндексируем существующие блоки)
        updateBlockSystem();

        // Интеграция режима редактирования: сделать содержимое блоков редактируемым при активном режиме
        if (document.body.classList.contains('edit-mode') && typeof window.App !== 'undefined' && typeof window.App.makeElementsEditable === 'function') {
            try {
                window.App.makeElementsEditable();
            } catch (e) {
                // Игнорируем ошибки интеграции
            }
        }

        // Настраиваем автосохранение для блоков
        setupBlockAutoSave();

        // Отключаем отладочный режим по умолчанию
        toggleDebugMode(false);

        // Удаляем отладочные JSON данные, если они есть
        removeDebugJsonData();

    } else {
        // Убираем все drag handles для не-администраторов
        removeAllDragHandles();

        // Удаляем отладочные JSON данные для не-администраторов
        removeDebugJsonData();

    }
}

/**
 * Очистка старой системы
 */
function cleanupOldSystem() {
    // Удаляем старые зоны
    document.querySelectorAll('.drop-zone, .drop-zone-inline, .drop-zone-center').forEach(zone => {
        zone.remove();
    });
    
    // Удаляем старые обработчики drag handles (все типы)
    removeAllDragHandles();
    
    // Очищаем классы
    document.querySelectorAll('.content-block').forEach(block => {
        block.classList.remove('dragging', 'preview-shift-left', 'preview-shift-right', 'dragging-block');
        block.removeAttribute('draggable');
        
        // Удаляем старые обработчики событий
        const clonedBlock = block.cloneNode(true);
        block.parentNode.replaceChild(clonedBlock, block);
    });
    
    // Удаляем глобальные обработчики старой системы
    document.body.classList.remove('drag-active', 'dragging-image');
    
    // Отключаем старую функцию bindDragDropEvents если она существует
    if (typeof bindDragDropEvents === 'function') {
        // Функция существует, но отключена
    }
}

/**
 * Настройка обработчиков drag & drop
 */
function setupDragAndDropHandlers() {
    // Используем делегирование событий для блоков в панели
    document.addEventListener('dragstart', function(e) {
        if (e.target.classList.contains('block-item') && e.target.draggable) {
            handleNewBlockDragStart.call(e.target, e);
        }
    });

    document.addEventListener('dragend', function(e) {
        if (e.target.classList.contains('block-item') && e.target.draggable) {
            handleDragEnd.call(e.target, e);
        }
    });

    // Добавляем глобальный обработчик движения мыши для динамических зон
    document.addEventListener('dragover', handleGlobalDragOver);

    // КРИТИЧЕСКИ ВАЖНО: Добавляем обработчик drop на .page-content для свободного размещения
    const pageContent = document.querySelector('.page-content');
    if (pageContent) {
        pageContent.addEventListener('dragover', handlePageContentDragOver);
        pageContent.addEventListener('drop', handlePageContentDrop);
    }

    // Добавляем drag handles к существующим блокам
    addDragHandlesToBlocks();
}

/**
 * Удаление всех drag handles с блоков
 */
function removeAllDragHandles() {
    document.querySelectorAll('.block-drag-handle, .new-drag-handle').forEach(handle => {
        handle.remove();
    });
}

/**
 * Добавление drag handles к блокам на странице
 */
function addDragHandlesToBlocks() {
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Drag handles только для администраторов
    if (!isUserAdmin()) {
        // Убираем все drag handles для не-администраторов
        removeAllDragHandles();
        return;
    }

    const contentBlocks = document.querySelectorAll('.content-block');

    contentBlocks.forEach((block, index) => {

        // Удаляем старый handle если есть
        const oldHandle = block.querySelector('.new-drag-handle');
        if (oldHandle) oldHandle.remove();

        // Создаем новый handle
        const dragHandle = document.createElement('div');
        dragHandle.className = 'new-drag-handle';
        dragHandle.innerHTML = '⋮⋮';
        dragHandle.title = 'Перетащите для перемещения блока';

        // Устанавливаем индекс блока
        block.dataset.blockIndex = index;

        // Добавляем handle в блок
        block.style.position = 'relative';
        block.appendChild(dragHandle);

        
        // Делаем блок перетаскиваемым через handle
        dragHandle.addEventListener('mousedown', (e) => {
            block.draggable = true;
            block.addEventListener('dragstart', handleExistingBlockDragStart);
            block.addEventListener('dragend', handleDragEnd);
        });
        
        // Убираем draggable после отпускания мыши
        dragHandle.addEventListener('mouseup', () => {
            setTimeout(() => {
                block.draggable = false;
                block.removeEventListener('dragstart', handleExistingBlockDragStart);
                block.removeEventListener('dragend', handleDragEnd);
            }, 100);
        });

        // Добавляем обработчик контекстного меню для блока
        // Проверяем, что функция handleBlockContextMenu доступна из старой системы
        if (typeof handleBlockContextMenu === 'function') {
            block.addEventListener('contextmenu', handleBlockContextMenu);
        } else if (typeof window.BlocksSystem !== 'undefined' && typeof window.BlocksSystem.handleBlockContextMenu === 'function') {
            block.addEventListener('contextmenu', window.BlocksSystem.handleBlockContextMenu);
        }
    });
}

/**
 * Обработчик начала перетаскивания нового блока из панели
 */
function handleNewBlockDragStart(e) {
    const blockId = this.dataset.blockId;
    const categoryKey = this.dataset.category;

    draggedBlockData = {
        type: 'new-block',
        blockId,
        categoryKey,
        element: this
    };

    // Визуальные эффекты
    this.classList.add('dragging');
    document.body.classList.add('drag-active');

    // КРИТИЧЕСКИ ВАЖНО: НЕ создаем центральную зону - разрешаем свободное размещение всегда
}

/**
 * Обработчик начала перетаскивания существующего блока
 */
function handleExistingBlockDragStart(e) {
    const blockIndex = parseInt(this.dataset.blockIndex);
    
    draggedBlockData = {
        type: 'existing-block',
        blockIndex,
        element: this
    };
    
    // Визуальные эффекты
    this.classList.add('dragging');
    document.body.classList.add('drag-active');
}

/**
 * Обработчик окончания перетаскивания
 */
function handleDragEnd(e) {
    // Убираем визуальные эффекты
    document.querySelectorAll('.dragging').forEach(el => {
        el.classList.remove('dragging');
    });
    document.body.classList.remove('drag-active');

    // Удаляем зоны позиционирования
    removePositioningZones();

    // Обновляем позиции блоков после перемещения
    setTimeout(() => {
        updateAllBlockPositions();
    }, 100);

    // Очищаем данные
    draggedBlockData = null;
    lastZonePosition = null;
}

/**
 * Глобальный обработчик движения при перетаскивании
 * Создает зоны динамически в зависимости от позиции курсора
 */
function handleGlobalDragOver(e) {
    if (!draggedBlockData) return;

    e.preventDefault();

    // КРИТИЧЕСКИ ВАЖНО: НЕ создаем зоны - разрешаем свободное размещение всегда
    // Удаляем все существующие зоны
    removePositioningZones();
    return;
}

/**
 * Обработчик dragover на .page-content для свободного размещения
 */
function handlePageContentDragOver(e) {
    // КРИТИЧЕСКИ ВАЖНО: Разрешаем drop в любом месте для новых блоков
    if (draggedBlockData && draggedBlockData.type === 'new-block') {
        e.preventDefault();
        e.stopPropagation();
    }
}

/**
 * Обработчик drop на .page-content для свободного размещения
 */
function handlePageContentDrop(e) {
    // Проверяем, что перетаскиваем новый блок из панели
    if (!draggedBlockData || draggedBlockData.type !== 'new-block') {
        return;
    }

    // Проверяем, что drop не на зону вставки
    if (e.target.classList.contains('new-drop-zone')) {
        // Drop на зону - пусть обрабатывает handleZoneDrop
        return;
    }

    e.preventDefault();
    e.stopPropagation();

    // КРИТИЧЕСКИ ВАЖНО: Получаем позицию курсора относительно .page-content
    const pageContent = document.querySelector('.page-content');
    const rect = pageContent.getBoundingClientRect();

    // КРИТИЧЕСКИ ВАЖНО: Вычисляем позицию относительно контейнера БЕЗ скролла
    // Позиция должна быть относительно самого контейнера, а не viewport
    const dropX = e.clientX - rect.left;
    const dropY = e.clientY - rect.top;

    // Ограничиваем позицию внутри контейнера
    const containerWidth = pageContent.offsetWidth;
    const containerHeight = pageContent.offsetHeight;

    // Предполагаем размер блока ~200x100 для корректного позиционирования
    const estimatedBlockWidth = 200;
    const estimatedBlockHeight = 100;

    const finalX = Math.max(0, Math.min(dropX, containerWidth - estimatedBlockWidth));
    const finalY = Math.max(0, Math.min(dropY, containerHeight - estimatedBlockHeight));

    // Создаем блок в позиции курсора
    addNewBlockAtFreePosition(draggedBlockData, finalX, finalY);
}

/**
 * Создание динамических зон в зависимости от позиции курсора
 */
function createDynamicZonesForPosition(mouseX, mouseY, contentBlocks) {
    let targetBlock = null;
    let targetIndex = -1;
    let positionType = null;
    
    // Находим блок и определяем позицию относительно него
    for (let i = 0; i < contentBlocks.length; i++) {
        const block = contentBlocks[i];
        
        // Пропускаем перетаскиваемый блок
        if (draggedBlockData.type === 'existing-block' && i === draggedBlockData.blockIndex) {
            continue;
        }
        
        const rect = block.getBoundingClientRect();
        
        // Увеличиваем зону чувствительности для более удобного использования
        const horizontalMargin = 80; // Зона для левого/правого позиционирования
        const verticalMargin = 40;   // Зона для верхнего/нижнего позиционирования
        
        // Расширенная зона для определения близости к блоку
        const expandedRect = {
            left: rect.left - horizontalMargin,
            right: rect.right + horizontalMargin,
            top: rect.top - verticalMargin,
            bottom: rect.bottom + verticalMargin
        };
        
        // Проверяем, находится ли курсор в расширенной зоне блока
        if (mouseX >= expandedRect.left && mouseX <= expandedRect.right &&
            mouseY >= expandedRect.top && mouseY <= expandedRect.bottom) {
            
            targetBlock = block;
            targetIndex = i;
            
            // Определяем позицию более точно, основываясь на том, в какой зоне находится курсор
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // Определяем, в какой зоне относительно блока находится курсор
            const isInTopZone = mouseY < rect.top;
            const isInBottomZone = mouseY > rect.bottom;
            const isInLeftZone = mouseX < rect.left;
            const isInRightZone = mouseX > rect.right;
            const isOverBlock = mouseX >= rect.left && mouseX <= rect.right && 
                               mouseY >= rect.top && mouseY <= rect.bottom;
            
            if (isInTopZone) {
                positionType = POSITION_TYPES.ABOVE;
            } else if (isInBottomZone) {
                positionType = POSITION_TYPES.BELOW;
            } else if (isInLeftZone) {
                positionType = POSITION_TYPES.LEFT;
            } else if (isInRightZone) {
                positionType = POSITION_TYPES.RIGHT;
            } else if (isOverBlock) {
                // Курсор над блоком - определяем ближайший край
                const distanceToTop = mouseY - rect.top;
                const distanceToBottom = rect.bottom - mouseY;
                const distanceToLeft = mouseX - rect.left;
                const distanceToRight = rect.right - mouseX;
                
                const minDistance = Math.min(distanceToTop, distanceToBottom, distanceToLeft, distanceToRight);
                
                // Используем пороговые значения для более четкого определения
                const edgeThreshold = 30; // Пикселей от края для активации зоны
                
                if (minDistance === distanceToTop && distanceToTop <= edgeThreshold) {
                    positionType = POSITION_TYPES.ABOVE;
                } else if (minDistance === distanceToBottom && distanceToBottom <= edgeThreshold) {
                    positionType = POSITION_TYPES.BELOW;
                } else if (minDistance === distanceToLeft && distanceToLeft <= edgeThreshold) {
                    positionType = POSITION_TYPES.LEFT;
                } else if (minDistance === distanceToRight && distanceToRight <= edgeThreshold) {
                    positionType = POSITION_TYPES.RIGHT;
                }
            }
            
            break;
        }
    }
    
    // Оптимизация: проверяем, изменилась ли позиция
    const currentPosition = targetBlock && positionType ? `${targetIndex}-${positionType}` : null;
    if (currentPosition === lastZonePosition) {
        return; // Позиция не изменилась, не пересоздаем зону
    }
    
    // Удаляем старые зоны
    removePositioningZones();
    lastZonePosition = currentPosition;
    
    // Создаем зону только если определили позицию
    if (targetBlock && positionType) {
        // Проверяем, не дублируется ли зона с соседним блоком
        if (!shouldCreateZone(positionType, targetIndex, contentBlocks)) {
            return;
        }
        
        createSingleDropZone(targetBlock, targetIndex, positionType);
    }
}

/**
 * Проверка, нужно ли создавать зону (избегаем дублирования)
 */
function shouldCreateZone(positionType, targetIndex, contentBlocks) {
    const excludeIndex = draggedBlockData.type === 'existing-block' ? draggedBlockData.blockIndex : -1;
    
    switch (positionType) {
        case POSITION_TYPES.ABOVE:
            // Не создаем зону "выше" если предыдущий блок существует и не является перетаскиваемым
            // (это означает, что зона "ниже" предыдущего блока будет дублировать эту позицию)
            if (targetIndex === 0) return true; // Первый блок - всегда можно разместить выше
            if (excludeIndex >= 0 && targetIndex - 1 === excludeIndex) return true; // Предыдущий блок перетаскивается
            return false; // В остальных случаях не создаем, чтобы избежать дублирования
            
        case POSITION_TYPES.BELOW:
            // Не создаем зону "ниже" если следующий блок существует и не является перетаскиваемым
            // (это означает, что зона "выше" следующего блока будет дублировать эту позицию)
            if (targetIndex === contentBlocks.length - 1) return true; // Последний блок - всегда можно разместить ниже
            if (excludeIndex >= 0 && targetIndex + 1 === excludeIndex) return true; // Следующий блок перетаскивается
            return false; // В остальных случаях не создаем, чтобы избежать дублирования
            
        case POSITION_TYPES.LEFT:
        case POSITION_TYPES.RIGHT:
            // Горизонтальные зоны всегда можно создавать (они не дублируются)
            return true;
            
        default:
            return false;
    }
}

/**
 * Создание одной зоны позиционирования
 */
/**
 * Получение абсолютной позиции элемента относительно документа
 */
function getAbsolutePosition(element) {
    if (!element) {
        return { top: 0, left: 0 };
    }
    
    let top = 0;
    let left = 0;
    let currentElement = element;
    
    while (currentElement) {
        top += currentElement.offsetTop || 0;
        left += currentElement.offsetLeft || 0;
        currentElement = currentElement.offsetParent;
    }
    
    return { top, left };
}

function createSingleDropZone(targetBlock, blockIndex, positionType) {
    // Получаем абсолютную позицию блока
    const absolutePos = getAbsolutePosition(targetBlock);
    const blockWidth = targetBlock.offsetWidth;
    const blockHeight = targetBlock.offsetHeight;
    

    
    let config;
    
    switch (positionType) {
        case POSITION_TYPES.ABOVE:
            config = {
                type: POSITION_TYPES.ABOVE,
                x: absolutePos.left,            // Абсолютная позиция слева
                y: absolutePos.top - 30,        // 30px выше блока
                width: blockWidth,              // Точная ширина блока
                height: 25,                     // Тонкая зона
                label: '⬆️ Выше'
            };
            break;
            
        case POSITION_TYPES.BELOW:
            config = {
                type: POSITION_TYPES.BELOW,
                x: absolutePos.left,            // Абсолютная позиция слева
                y: absolutePos.top + blockHeight + 5, // 5px ниже блока
                width: blockWidth,              // Точная ширина блока
                height: 25,                     // Тонкая зона
                label: '⬇️ Ниже'
            };
            break;
            
        case POSITION_TYPES.LEFT:
            config = {
                type: POSITION_TYPES.LEFT,
                x: absolutePos.left - 80,       // 80px слева от блока
                y: absolutePos.top,             // Точно по верхнему краю блока
                width: 75,                      // Узкая зона
                height: blockHeight,            // Точная высота блока
                label: '⬅️ Слева'
            };
            break;
            
        case POSITION_TYPES.RIGHT:
            config = {
                type: POSITION_TYPES.RIGHT,
                x: absolutePos.left + blockWidth + 5, // 5px справа от блока
                y: absolutePos.top,             // Точно по верхнему краю блока
                width: 75,                      // Узкая зона
                height: blockHeight,            // Точная высота блока
                label: '➡️ Справа'
            };
            break;
            
        default:
            return;
    }
    
    // Проверяем валидность координат
    if (config.x == null || config.y == null || isNaN(config.x) || isNaN(config.y)) {
        return;
    }
    
    const zone = createDropZone(config, targetBlock, blockIndex);
    currentDropZones.push(zone);
    document.body.appendChild(zone);
}

/**
 * Создание отдельной зоны позиционирования
 */
function createDropZone(config, targetBlock, blockIndex) {
    const zone = document.createElement('div');
    zone.className = 'new-drop-zone';
    zone.dataset.positionType = config.type || 'unknown';
    zone.dataset.targetBlockIndex = blockIndex != null ? blockIndex : 'unknown';
    
    // Позиционирование
    zone.style.position = 'absolute';
    zone.style.left = config.x + 'px';
    zone.style.top = config.y + 'px';
    zone.style.width = config.width + 'px';
    zone.style.height = config.height + 'px';
    zone.style.zIndex = '1000';
    
    // Стили
    zone.style.background = 'rgba(74, 144, 226, 0.1)';
    zone.style.border = '2px dashed rgba(74, 144, 226, 0.5)';
    zone.style.borderRadius = '8px';
    zone.style.display = 'flex';
    zone.style.alignItems = 'center';
    zone.style.justifyContent = 'center';
    zone.style.opacity = '0';
    zone.style.visibility = 'hidden';
    zone.style.transition = 'all 0.3s ease';
    zone.style.pointerEvents = 'auto';
    
    // Текст зоны
    const label = document.createElement('div');
    label.className = 'zone-label';
    label.textContent = config.label;
    label.style.color = '#4A90E2';
    label.style.fontWeight = 'bold';
    label.style.fontSize = '14px';
    label.style.textAlign = 'center';
    label.style.pointerEvents = 'none';
    zone.appendChild(label);
    
    // Обработчики событий
    zone.addEventListener('dragover', handleZoneDragOver);
    zone.addEventListener('dragenter', handleZoneDragEnter);
    zone.addEventListener('dragleave', handleZoneDragLeave);
    zone.addEventListener('drop', handleZoneDrop);
    
    // Показываем зону с анимацией
    setTimeout(() => {
        zone.style.opacity = '1';
        zone.style.visibility = 'visible';
    }, 50);
    
    return zone;
}

/**
 * Создание центральной зоны для пустой страницы
 */
function createCenterDropZone() {
    const pageContent = document.querySelector('.page-content');
    
    // Используем абсолютное позиционирование
    const absolutePos = getAbsolutePosition(pageContent);
    const offsetWidth = pageContent.offsetWidth;
    const offsetHeight = pageContent.offsetHeight;
    
    const zone = document.createElement('div');
    zone.className = 'new-drop-zone center-zone';
    zone.dataset.positionType = 'center';
    zone.dataset.targetBlockIndex = '-1';
    
    // Позиционирование в центре страницы
    zone.style.position = 'absolute';
    zone.style.left = (absolutePos.left + offsetWidth / 2 - 200) + 'px';
    zone.style.top = (absolutePos.top + offsetHeight / 2 - 100) + 'px';
    zone.style.width = '400px';
    zone.style.height = '200px';
    zone.style.zIndex = '1000';
    
    // Стили
    zone.style.background = 'rgba(255, 215, 0, 0.1)';
    zone.style.border = '3px dashed rgba(255, 215, 0, 0.6)';
    zone.style.borderRadius = '16px';
    zone.style.display = 'flex';
    zone.style.alignItems = 'center';
    zone.style.justifyContent = 'center';
    zone.style.opacity = '1';
    zone.style.visibility = 'visible';
    zone.style.pointerEvents = 'auto';
    
    // Текст зоны
    const label = document.createElement('div');
    label.className = 'zone-label';
    label.textContent = '✨ Разместить первый блок';
    label.style.color = '#FFD700';
    label.style.fontWeight = 'bold';
    label.style.fontSize = '18px';
    label.style.textAlign = 'center';
    label.style.pointerEvents = 'none';
    zone.appendChild(label);
    
    // Обработчики событий
    zone.addEventListener('dragover', handleZoneDragOver);
    zone.addEventListener('dragenter', handleZoneDragEnter);
    zone.addEventListener('dragleave', handleZoneDragLeave);
    zone.addEventListener('drop', handleZoneDrop);
    
    currentDropZones.push(zone);
    document.body.appendChild(zone);
}

/**
 * Удаление всех зон позиционирования
 */
function removePositioningZones() {
    currentDropZones.forEach(zone => {
        if (zone.parentNode) {
            zone.parentNode.removeChild(zone);
        }
    });
    currentDropZones = [];
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ ЗОНЫ =====

function handleZoneDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

function handleZoneDragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
    this.style.background = 'rgba(74, 144, 226, 0.3)';
    this.style.borderColor = '#4A90E2';
    this.style.transform = 'scale(1.05)';
}

function handleZoneDragLeave(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    this.style.background = 'rgba(74, 144, 226, 0.1)';
    this.style.borderColor = 'rgba(74, 144, 226, 0.5)';
    this.style.transform = 'scale(1)';
}

function handleZoneDrop(e) {
    e.preventDefault();
    
    const positionType = this.dataset.positionType;
    const targetBlockIndex = parseInt(this.dataset.targetBlockIndex);
    
    if (draggedBlockData.type === 'new-block') {
        // Добавляем новый блок
        addNewBlockAtPosition(draggedBlockData, positionType, targetBlockIndex);
    } else if (draggedBlockData.type === 'existing-block') {
        // Перемещаем существующий блок
        moveExistingBlockToPosition(draggedBlockData, positionType, targetBlockIndex);
    }
    
    // Убираем визуальные эффекты
    this.classList.remove('drag-over');
}

// ===== ФУНКЦИИ ДОБАВЛЕНИЯ И ПЕРЕМЕЩЕНИЯ БЛОКОВ =====

/**
 * Добавление нового блока в указанную позицию
 */
function addNewBlockAtPosition(blockData, positionType, targetBlockIndex) {
    // КРИТИЧЕСКАЯ ПРОВЕРКА: Только администраторы могут добавлять блоки
    if (!isUserAdmin()) {
        alert('Добавление блоков разрешено только администраторам');
        return;
    }

    // Получаем шаблон блока
    const blockTemplate = getBlockTemplate(blockData.categoryKey, blockData.blockId);
    if (!blockTemplate) {
        console.error('❌ Шаблон блока не найден');
        return;
    }

    // Создаем новый блок
    const newBlock = createBlockElement(blockTemplate, blockData.categoryKey, blockData.blockId);

    // Размещаем блок в зависимости от типа позиции
    placeBlockAtPosition(newBlock, positionType, targetBlockIndex);

    // Сохраняем блок сразу для корректного позиционирования
    // Помечаем блок как новый для последующего обновления контента
    newBlock.dataset.isNew = 'true';

    saveBlockToDatabase(newBlock, blockData.categoryKey, blockData.blockId, {
        positionType,
        targetBlockIndex,
        containerSelector: '.page-content'
    });

    // Активируем редактирование для нового блока
    if (document.body.classList.contains('edit-mode') && typeof window.App !== 'undefined') {
        setTimeout(() => {
            try {
                window.App.makeElementsEditable();
                // Фокусируемся на новом блоке для редактирования
                const editableElement = newBlock.querySelector('h1, h2, h3, p') || newBlock;
                if (editableElement && editableElement.contentEditable === 'true') {
                    editableElement.focus();
                }
            } catch (e) {
                // Игнорируем ошибки
            }
        }, 100);
    }

    // Обновляем систему
    updateBlockSystem();

    showBlockNotification('Блок добавлен!', 'success');
}

/**
 * КРИТИЧЕСКИ ВАЖНО: Добавление нового блока в свободную позицию (режим свободного позиционирования)
 */
function addNewBlockAtFreePosition(blockData, x, y) {
    // КРИТИЧЕСКАЯ ПРОВЕРКА: Только администраторы могут добавлять блоки
    if (!isUserAdmin()) {
        alert('Добавление блоков разрешено только администраторам');
        return;
    }

    // Получаем шаблон блока
    const blockTemplate = getBlockTemplate(blockData.categoryKey, blockData.blockId);
    if (!blockTemplate) {
        console.error('❌ Шаблон блока не найден');
        return;
    }

    // Создаем новый блок
    const newBlock = createBlockElement(blockTemplate, blockData.categoryKey, blockData.blockId);

    // КРИТИЧЕСКИ ВАЖНО: Добавляем блок в .page-content
    const pageContent = document.querySelector('.page-content');
    pageContent.appendChild(newBlock);

    // КРИТИЧЕСКИ ВАЖНО: Применяем свободное позиционирование
    newBlock.classList.add('free-positioned');
    newBlock.style.setProperty('position', 'absolute', 'important');
    newBlock.style.setProperty('left', x + 'px', 'important');
    newBlock.style.setProperty('top', y + 'px', 'important');
    newBlock.style.setProperty('--free-left', x + 'px');
    newBlock.style.setProperty('--free-top', y + 'px');

    // Сохраняем позиции в dataset
    newBlock.dataset.freeLeft = x;
    newBlock.dataset.freeTop = y;
    newBlock.dataset.originalLeft = x;
    newBlock.dataset.originalTop = y;

    // Помечаем блок как новый для последующего обновления контента
    newBlock.dataset.isNew = 'true';

    // Сохраняем блок в БД с метаданными о свободном позиционировании
    saveBlockToDatabase(newBlock, blockData.categoryKey, blockData.blockId, {
        freePositioned: true,
        freeLeft: x,
        freeTop: y,
        containerSelector: '.page-content'
    });

    // Активируем редактирование для нового блока
    if (document.body.classList.contains('edit-mode') && typeof window.App !== 'undefined') {
        setTimeout(() => {
            try {
                window.App.makeElementsEditable();
                // Фокусируемся на новом блоке для редактирования
                const editableElement = newBlock.querySelector('h1, h2, h3, p') || newBlock;
                if (editableElement && editableElement.contentEditable === 'true') {
                    editableElement.focus();
                }
            } catch (e) {
                // Игнорируем ошибки
            }
        }, 100);
    }

    // Обновляем систему
    updateBlockSystem();

    showBlockNotification('Блок добавлен в свободной позиции!', 'success');
}

/**
 * Перемещение существующего блока в новую позицию
 */
function moveExistingBlockToPosition(blockData, positionType, targetBlockIndex) {

    
    const pageContent = document.querySelector('.page-content');
    const contentBlocks = Array.from(pageContent.querySelectorAll('.content-block'));
    const blockToMove = contentBlocks[blockData.blockIndex];
    
    if (!blockToMove) {
        console.error('❌ Блок для перемещения не найден');
        return;
    }
    
    // Временно удаляем блок из DOM
    blockToMove.remove();
    
    // Размещаем блок в новой позиции
    placeBlockAtPosition(blockToMove, positionType, targetBlockIndex, blockData.blockIndex);

    // Обновляем систему
    updateBlockSystem();

    // Обновляем позиции в БД
    setTimeout(() => {
        updateAllBlockPositions();
    }, 100);

    showBlockNotification('Блок перемещен!', 'success');
}

/**
 * Размещение блока в указанной позиции
 */
function placeBlockAtPosition(block, positionType, targetBlockIndex, originalIndex = -1) {
    const pageContent = document.querySelector('.page-content');
    const contentBlocks = Array.from(pageContent.querySelectorAll('.content-block'));
    
    // Корректируем индекс если перемещаем существующий блок
    let adjustedTargetIndex = targetBlockIndex;
    if (originalIndex >= 0 && originalIndex < targetBlockIndex) {
        adjustedTargetIndex = targetBlockIndex - 1;
    }
    
    switch (positionType) {
        case POSITION_TYPES.ABOVE:
            placeBlockAbove(block, adjustedTargetIndex);
            break;
            
        case POSITION_TYPES.BELOW:
            placeBlockBelow(block, adjustedTargetIndex);
            break;
            
        case POSITION_TYPES.LEFT:
            placeBlockLeft(block, adjustedTargetIndex);
            break;
            
        case POSITION_TYPES.RIGHT:
            placeBlockRight(block, adjustedTargetIndex);
            break;
            
        case 'center':
            placeBlockCenter(block);
            break;
            
        default:
            console.error('❌ Неизвестный тип позиции:', positionType);
    }
}

/**
 * Размещение блока выше целевого
 */
function placeBlockAbove(block, targetIndex) {
    const pageContent = document.querySelector('.page-content');
    const contentBlocks = Array.from(pageContent.querySelectorAll('.content-block'));
    const targetBlock = contentBlocks[targetIndex];
    
    if (targetBlock) {
        pageContent.insertBefore(block, targetBlock);
    } else {
        pageContent.appendChild(block);
    }
    

}

/**
 * Размещение блока ниже целевого
 */
function placeBlockBelow(block, targetIndex) {
    const pageContent = document.querySelector('.page-content');
    const contentBlocks = Array.from(pageContent.querySelectorAll('.content-block'));
    const targetBlock = contentBlocks[targetIndex];
    
    if (targetBlock && targetBlock.nextSibling) {
        pageContent.insertBefore(block, targetBlock.nextSibling);
    } else {
        pageContent.appendChild(block);
    }
    

}

/**
 * Размещение блока слева от целевого
 */
function placeBlockLeft(block, targetIndex) {
    const pageContent = document.querySelector('.page-content');
    const contentBlocks = Array.from(pageContent.querySelectorAll('.content-block'));
    const targetBlock = contentBlocks[targetIndex];
    
    if (!targetBlock) {
        pageContent.appendChild(block);
        return;
    }
    
    // Проверяем, находится ли целевой блок уже в горизонтальном контейнере
    const existingContainer = targetBlock.closest('.horizontal-container');
    
    if (existingContainer) {
        // Добавляем в существующий контейнер слева
        existingContainer.insertBefore(block, targetBlock);
    } else {
        // Создаем новый горизонтальный контейнер
        const container = document.createElement('div');
        container.className = 'horizontal-container';
        
        // Заменяем целевой блок контейнером
        targetBlock.parentNode.insertBefore(container, targetBlock);
        targetBlock.remove();
        
        // Добавляем блоки в контейнер
        container.appendChild(block);
        container.appendChild(targetBlock);
    }

    // Обновляем позиции в БД после изменения
    setTimeout(() => {
        updateAllBlockPositions();
    }, 100);
}

/**
 * Размещение блока справа от целевого
 */
function placeBlockRight(block, targetIndex) {
    const pageContent = document.querySelector('.page-content');
    const contentBlocks = Array.from(pageContent.querySelectorAll('.content-block'));
    const targetBlock = contentBlocks[targetIndex];
    
    if (!targetBlock) {
        pageContent.appendChild(block);
        return;
    }
    
    // Проверяем, находится ли целевой блок уже в горизонтальном контейнере
    const existingContainer = targetBlock.closest('.horizontal-container');
    
    if (existingContainer) {
        // Добавляем в существующий контейнер справа
        if (targetBlock.nextSibling) {
            existingContainer.insertBefore(block, targetBlock.nextSibling);
        } else {
            existingContainer.appendChild(block);
        }
    } else {
        // Создаем новый горизонтальный контейнер
        const container = document.createElement('div');
        container.className = 'horizontal-container';
        
        // Заменяем целевой блок контейнером
        targetBlock.parentNode.insertBefore(container, targetBlock);
        targetBlock.remove();
        
        // Добавляем блоки в контейнер
        container.appendChild(targetBlock);
        container.appendChild(block);
    }

    // Обновляем позиции в БД после изменения
    setTimeout(() => {
        updateAllBlockPositions();
    }, 100);
    

}

/**
 * Размещение блока в центре (для пустой страницы)
 */
function placeBlockCenter(block) {
    const pageContent = document.querySelector('.page-content');
    pageContent.appendChild(block);
    

}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

/**
 * Получение шаблона блока
 */
function getBlockTemplate(categoryKey, blockId) {
    // Проверяем, доступна ли библиотека блоков из старой системы
    if (typeof BLOCKS_LIBRARY === 'undefined') {
        return getFallbackTemplate(categoryKey, blockId);
    }
    
    const category = BLOCKS_LIBRARY[categoryKey];
    if (!category) return getFallbackTemplate(categoryKey, blockId);
    
    const block = category.blocks.find(b => b.id === blockId);
    return block ? block.template : getFallbackTemplate(categoryKey, blockId);
}

/**
 * Fallback шаблоны для тестирования (с SEO-оптимизацией)
 */
function getFallbackTemplate(categoryKey, blockId) {
    const fallbackTemplates = {
        'text': {
            'heading-h2': '<h2 class="content-heading" itemprop="headline" data-seo-optimized="true">Новый заголовок H2</h2>',
            'heading-h3': '<h3 class="content-subheading" itemprop="headline" data-seo-optimized="true">Новый заголовок H3</h3>',
            'paragraph': '<p class="content-text" itemprop="text" data-seo-optimized="true">Новый параграф текста. Этот блок был добавлен с помощью новой системы позиционирования.</p>',
            'quote': '<blockquote class="content-quote" itemscope itemtype="https://schema.org/Quotation" data-seo-optimized="true">"Новая цитата добавлена через улучшенную систему блоков."<cite itemprop="author">— Система блоков</cite></blockquote>',
            'list': '<ul class="content-list" itemscope itemtype="https://schema.org/ItemList" data-seo-optimized="true"><li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">Первый пункт списка</li><li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">Второй пункт списка</li><li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">Третий пункт списка</li></ul>'
        },
        'media': {
            'image': '<div class="content-image-placeholder" style="background: rgba(74, 144, 226, 0.2); border: 2px dashed #4A90E2; padding: 40px; text-align: center; border-radius: 8px; color: #4A90E2;"><p>🖼️ Изображение</p><p style="font-size: 12px; opacity: 0.7;">Блок изображения добавлен</p></div>'
        }
    };

    return fallbackTemplates[categoryKey]?.[blockId] || `<div class="content-block-placeholder">Блок ${blockId} (${categoryKey})</div>`;
}

/**
 * Создание элемента блока с метаданными
 */
function createBlockElement(template, categoryKey = null, blockId = null) {
    const wrapper = document.createElement('div');
    wrapper.className = 'content-block';
    wrapper.innerHTML = template;

    // Добавляем уникальный ID
    const uniqueId = 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    wrapper.dataset.blockId = uniqueId;
    wrapper.dataset.editId = uniqueId;

    // Добавляем метаданные блока
    if (categoryKey && blockId) {
        wrapper.dataset.blockType = blockId;
        wrapper.dataset.blockCategory = categoryKey;
        wrapper.dataset.isBlock = 'true';
    }

    // ===== SEO ОПТИМИЗАЦИЯ =====
    // Применяем SEO-атрибуты к содержимому блока
    if (blockId && typeof addSEOAttributes === 'function') {
        // Находим основной элемент внутри блока
        const mainElement = wrapper.querySelector('h2, h3, p, blockquote, ul, ol');
        if (mainElement) {
            addSEOAttributes(mainElement, blockId);

            // Для заголовков генерируем SEO-дружественный ID
            if (mainElement.tagName === 'H2' || mainElement.tagName === 'H3') {
                if (typeof generateSEOFriendlyId === 'function') {
                    const seoId = generateSEOFriendlyId(mainElement.textContent);
                    if (seoId) {
                        mainElement.id = seoId;
                    }
                }
            }
        }
    }

    // Добавляем атрибуты для редактирования
    wrapper.setAttribute('contenteditable', 'false');

    // Если режим редактирования активен, делаем блок редактируемым
    if (document.body.classList.contains('edit-mode') && typeof window.App !== 'undefined') {
        setTimeout(() => {
            try {
                window.App.makeElementsEditable();
            } catch (e) {
                // Игнорируем ошибки
            }
        }, 100);
    }

    return wrapper;
}

/**
 * Обновление системы блоков
 */
function updateBlockSystem() {
    // Переиндексируем блоки
    reindexBlocks();

    // Обновляем drag handles (функция сама решит, добавлять или удалять)
    addDragHandlesToBlocks();
    
    // Очищаем пустые контейнеры
    cleanupEmptyContainers();

    // Если активен режим редактирования — активируем редактирование контента внутри новых/перемещенных блоков
    if (document.body.classList.contains('edit-mode')) {
        // Предпочтительно используем существующую систему редактирования из main.js (App)
        if (typeof window.App !== 'undefined' && typeof window.App.makeElementsEditable === 'function') {
            try { window.App.makeElementsEditable(); } catch (_) {}
        }
        // Также поддержим классический EditMode, если он подключен на странице
        if (typeof window.EditMode !== 'undefined' && window.EditMode && typeof window.EditMode.makeElementsEditable === 'function') {
            try { window.EditMode.makeElementsEditable(); } catch (_) {}
        }
    }

    // Обновляем позиции всех блоков в БД
    updateAllBlockPositions();
}

/**
 * Переиндексация блоков
 */
function reindexBlocks() {
    const contentBlocks = document.querySelectorAll('.content-block');
    contentBlocks.forEach((block, index) => {
        block.dataset.blockIndex = index;
    });
}

/**
 * Очистка пустых контейнеров
 */
function cleanupEmptyContainers() {
    document.querySelectorAll('.horizontal-container').forEach(container => {
        const blocks = container.querySelectorAll('.content-block');
        
        if (blocks.length === 0) {
            // Удаляем пустой контейнер
            container.remove();
        } else if (blocks.length === 1) {
            // Если остался один блок, выносим его из контейнера
            const singleBlock = blocks[0];
            container.parentNode.insertBefore(singleBlock, container);
            container.remove();
        }
    });
}

/**
 * Настройка взаимодействий с блоками
 */
function setupBlockInteractions() {
    // Добавляем обработчики для кнопок добавления блоков
    // Используем делегирование событий для динамически создаваемых элементов
    document.addEventListener('click', async function(e) {
        if (e.target.classList.contains('add-block-btn')) {
            e.stopPropagation();
            const blockItem = e.target.closest('.block-item');
            if (blockItem) {
                const blockId = blockItem.dataset.blockId;
                const categoryKey = blockItem.dataset.category;

                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Правильная обработка асинхронной функции
                try {
                    await addBlockToEndOfPage(categoryKey, blockId);
                    showBlockNotification('Блок успешно добавлен!', 'success');
                } catch (error) {
                    console.error('❌ Ошибка добавления блока:', error);
                    showBlockNotification('Ошибка добавления блока!', 'error');
                }
            }
        }
    });
}

/**
 * Добавление блока в конец страницы (для кнопки добавления)
 */
async function addBlockToEndOfPage(categoryKey, blockId) {
    // КРИТИЧЕСКАЯ ПРОВЕРКА: Только администраторы могут добавлять блоки
    if (!isUserAdmin()) {
        alert('Добавление блоков разрешено только администраторам');
        return;
    }

    const blockTemplate = getBlockTemplate(categoryKey, blockId);
    if (!blockTemplate) {
        console.error('❌ Шаблон блока не найден');
        return;
    }

    const newBlock = createBlockElement(blockTemplate, categoryKey, blockId);
    const pageContent = document.querySelector('.page-content');

    if (!pageContent) {
        console.error('❌ Контейнер .page-content не найден');
        showBlockNotification('Ошибка: контейнер не найден!', 'error');
        return;
    }

    pageContent.appendChild(newBlock);

    // Сохраняем блок сразу для корректного позиционирования
    // Помечаем блок как новый для последующего обновления контента
    newBlock.dataset.isNew = 'true';
    newBlock.dataset.saved = 'false';

    const saveResult = await saveBlockToDatabase(newBlock, categoryKey, blockId, {
        positionType: 'end',
        containerSelector: '.page-content'
    });

    if (!saveResult.success) {
        console.error('❌ Ошибка сохранения блока:', saveResult.error);
        // Удаляем блок из DOM если сохранение не удалось
        newBlock.remove();
        // Выбрасываем ошибку для правильной обработки в вызывающем коде
        throw new Error(`Не удалось сохранить блок в базе данных: ${saveResult.error}`);
    }

    // Активируем редактирование для нового блока
    if (document.body.classList.contains('edit-mode') && typeof window.App !== 'undefined') {
        setTimeout(() => {
            try {
                window.App.makeElementsEditable();
                // Фокусируемся на новом блоке для редактирования
                const editableElement = newBlock.querySelector('h1, h2, h3, p') || newBlock;
                if (editableElement && editableElement.contentEditable === 'true') {
                    editableElement.focus();
                }
            } catch (e) {
                // Игнорируем ошибки
            }
        }, 100);
    }

    updateBlockSystem();

    // Возвращаем успешный результат
    return { success: true, block: newBlock };
}

/**
 * Показ уведомления
 */
function showBlockNotification(message, type = 'info') {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `block-notification ${type}`;
    notification.textContent = message;
    
    // Стили уведомления
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '8px';
    notification.style.color = 'white';
    notification.style.fontWeight = 'bold';
    notification.style.zIndex = '10000';
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    notification.style.transition = 'all 0.3s ease';
    
    // Цвета в зависимости от типа
    switch (type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #f44336, #da190b)';
            break;
        default:
            notification.style.background = 'linear-gradient(135deg, #2196F3, #0b7dda)';
    }
    
    // Добавляем в DOM
    document.body.appendChild(notification);
    
    // Показываем с анимацией
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ===== ФУНКЦИИ ЗАГРУЗКИ ИЗ БД =====

/**
 * Получение базового URL API
 */
function getApiBaseUrl() {
    // Определяем базовый URL в зависимости от окружения
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000';
    } else {
        // Для продакшена используем текущий домен
        return window.location.origin;
    }
}

/**
 * Загрузка блоков из базы данных
 */
async function loadBlocksFromDatabase() {
    try {
        const pageId = getCurrentPageId();
        const apiUrl = `${getApiBaseUrl()}/api/blocks/${pageId}`;

        // Добавляем таймаут для fetch запроса
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 10000);

        const response = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        const result = await response.json();

        if (result.success && result.data.length > 0) {
            // Сортируем блоки по позиции
            const sortedBlocks = result.data.sort((a, b) => a.position_index - b.position_index);

            // ОПТИМИЗАЦИЯ: Прогрессивная загрузка блоков
            // Первые блоки (видимые на экране) рендерим сразу,
            // остальные — порциями через requestAnimationFrame
            const FIRST_BATCH = 4; // Первая порция — сразу
            const CHUNK_SIZE = 3;  // Остальные — по 3 за кадр

            const firstBatch = sortedBlocks.slice(0, FIRST_BATCH);
            const restBatches = sortedBlocks.slice(FIRST_BATCH);

            // Рендерим первую порцию сразу
            const createdBlocks = [];
            for (const blockData of firstBatch) {
                const blockElement = await createBlockFromData(blockData);
                if (blockElement) {
                    createdBlocks.push({ element: blockElement, data: blockData });
                }
            }

            // Размещаем первую порцию немедленно
            await restoreBlockLayout(createdBlocks);

            // Остальные блоки рендерим порциями
            if (restBatches.length > 0) {
                const renderChunk = (startIdx) => {
                    return new Promise(resolve => {
                        requestAnimationFrame(async () => {
                            const chunk = restBatches.slice(startIdx, startIdx + CHUNK_SIZE);
                            const chunkBlocks = [];
                            for (const blockData of chunk) {
                                const blockElement = await createBlockFromData(blockData);
                                if (blockElement) {
                                    chunkBlocks.push({ element: blockElement, data: blockData });
                                }
                            }
                            if (chunkBlocks.length > 0) {
                                await restoreBlockLayout(chunkBlocks);
                            }
                            resolve();
                        });
                    });
                };

                // Последовательно рендерим порции
                for (let i = 0; i < restBatches.length; i += CHUNK_SIZE) {
                    await renderChunk(i);
                }
            }

            // Активируем редактирование для загруженных блоков
            if (document.body.classList.contains('edit-mode') && typeof window.App !== 'undefined') {
                setTimeout(() => {
                    try {
                        window.App.makeElementsEditable();
                    } catch (e) {
                        // Игнорируем ошибки
                    }
                }, 200);
            }

            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Убираем drag handles для не-администраторов после загрузки блоков
            if (!isUserAdmin()) {
                setTimeout(() => {
                    removeAllDragHandles();
                }, 300);
            }

            // ВАЖНО: Восстановление позиций и режима свободного позиционирования
            // происходит в free-positioning.js через DOMContentLoaded
            // Не вызываем здесь, чтобы избежать конфликтов

            // КРИТИЧЕСКИ ВАЖНО: Отправляем событие о завершении загрузки блоков
            // Это позволит free-positioning.js дождаться загрузки перед восстановлением позиций
            window.dispatchEvent(new CustomEvent('blocksLoaded', {
                detail: { count: sortedBlocks.length }
            }));
        } else {
            // Отправляем событие даже если блоков нет
            window.dispatchEvent(new CustomEvent('blocksLoaded', {
                detail: { count: 0 }
            }));
        }

    } catch (error) {
        // Отправляем событие даже при ошибке
        window.dispatchEvent(new CustomEvent('blocksLoaded', {
            detail: { count: 0, error: true }
        }));
    }
}

/**
 * Восстановление структуры блоков с горизонтальными контейнерами
 */
async function restoreBlockLayout(createdBlocks) {
    const container = document.querySelector('.page-content');
    if (!container) return;

    const blocksByContainer = new Map();
    const singleBlocks = [];
    const freePositionedBlocks = []; // НОВОЕ: Отдельный массив для блоков со свободным позиционированием

    for (const { element, data } of createdBlocks) {
        const layoutInfo = data.block_metadata?.layoutInfo;
        const isFreePositioned = element.classList.contains('free-positioned');

        // КРИТИЧЕСКИ ВАЖНО: Блоки со свободным позиционированием обрабатываем отдельно!
        if (isFreePositioned) {
            freePositionedBlocks.push({ element, data });
            continue; // Пропускаем обычную логику размещения
        }

        if (layoutInfo?.isInHorizontalContainer) {
            const containerPos = layoutInfo.containerPosition;
            if (!blocksByContainer.has(containerPos)) {
                blocksByContainer.set(containerPos, []);
            }
            blocksByContainer.get(containerPos).push({ element, data, horizontalPos: layoutInfo.horizontalPosition || 0 });
        } else {
            singleBlocks.push({ element, data, containerPos: layoutInfo?.containerPosition || 0 });
        }
    }

    const allItems = [];

    for (const [containerPos, blocks] of blocksByContainer) {
        if (blocks.length > 1) {
            blocks.sort((a, b) => a.horizontalPos - b.horizontalPos);
            allItems.push({ type: 'horizontal', containerPos, blocks: blocks.map(b => b.element) });
        } else {
            allItems.push({ type: 'single', containerPos, element: blocks[0].element });
        }
    }

    singleBlocks.forEach(({ element, containerPos }) => {
        allItems.push({ type: 'single', containerPos, element });
    });

    allItems.sort((a, b) => a.containerPos - b.containerPos);

    for (const item of allItems) {
        if (item.type === 'single') {
            // КРИТИЧЕСКИ ВАЖНО: Сохраняем стили перед добавлением в DOM
            const savedStyles = item.element.style.cssText;
            const savedClasses = item.element.className;
            const savedDataset = { ...item.element.dataset };
            const isFreePositioned = item.element.classList.contains('free-positioned');
            const savedLeft = item.element.style.left;
            const savedTop = item.element.style.top;

            container.appendChild(item.element);

            // Восстанавливаем стили после добавления в DOM
            item.element.style.cssText = savedStyles;
            item.element.className = savedClasses;
            Object.assign(item.element.dataset, savedDataset);

            // Если блок имеет свободное позиционирование, применяем позиции с !important
            if (isFreePositioned && savedLeft && savedTop) {
                item.element.style.setProperty('position', 'absolute', 'important');
                item.element.style.setProperty('left', savedLeft, 'important');
                item.element.style.setProperty('top', savedTop, 'important');
            }
        } else {
            const horizontalContainer = document.createElement('div');
            horizontalContainer.className = 'horizontal-container';

            item.blocks.forEach(block => {
                // КРИТИЧЕСКИ ВАЖНО: Сохраняем стили перед добавлением в DOM
                const savedStyles = block.style.cssText;
                const savedClasses = block.className;
                const savedDataset = { ...block.dataset };
                const isFreePositioned = block.classList.contains('free-positioned');
                const savedLeft = block.style.left;
                const savedTop = block.style.top;

                horizontalContainer.appendChild(block);

                // Восстанавливаем стили после добавления в DOM
                block.style.cssText = savedStyles;
                block.className = savedClasses;
                Object.assign(block.dataset, savedDataset);

                // Если блок имеет свободное позиционирование, применяем позиции с !important
                if (isFreePositioned && savedLeft && savedTop) {
                    block.style.setProperty('position', 'absolute', 'important');
                    block.style.setProperty('left', savedLeft, 'important');
                    block.style.setProperty('top', savedTop, 'important');
                }
            });

            container.appendChild(horizontalContainer);
        }
    }

    // КРИТИЧЕСКИ ВАЖНО: Размещаем блоки со свободным позиционированием В КОНЦЕ
    // Для них не важен порядок в DOM, они позиционируются по координатам
    for (const { element, data } of freePositionedBlocks) {
        const savedStyles = element.style.cssText;
        const savedClasses = element.className;
        const savedDataset = { ...element.dataset };
        let savedLeft = element.style.left;
        let savedTop = element.style.top;

        // КРИТИЧЕСКИ ВАЖНО: Если позиций нет в стилях, берем из dataset
        if ((!savedLeft || !savedTop) && element.dataset.freeLeft && element.dataset.freeTop) {
            savedLeft = element.dataset.freeLeft + 'px';
            savedTop = element.dataset.freeTop + 'px';
        }

        container.appendChild(element);

        // Восстанавливаем ВСЕ стили
        element.style.cssText = savedStyles;
        element.className = savedClasses;
        Object.assign(element.dataset, savedDataset);

        // Применяем позиции с !important для гарантии
        if (savedLeft && savedTop) {
            element.style.setProperty('position', 'absolute', 'important');
            element.style.setProperty('left', savedLeft, 'important');
            element.style.setProperty('top', savedTop, 'important');
        }
    }
}

/**
 * Восстановление блока на странице
 */
async function restoreBlockOnPage(blockData) {
    try {
        const {
            element_id,
            block_type,
            block_category,
            content,
            selector,
            position_index,
            block_metadata,
            container_selector,
            css_classes,
            css_styles
        } = blockData;

        // Проверяем, не существует ли уже элемент с таким ID
        const existingElement = document.querySelector(`[data-edit-id="${element_id}"]`) ||
                               document.querySelector(`[data-block-id="${element_id}"]`);

        if (existingElement) {
            return;
        }

        // Создаем элемент блока
        const blockElement = document.createElement('div');
        // Всегда добавляем базовый класс content-block для правильной работы системы
        const baseClass = 'content-block';
        const additionalClasses = css_classes && css_classes !== baseClass ? css_classes : '';
        blockElement.className = additionalClasses ? `${baseClass} ${additionalClasses}` : baseClass;

        // Используем сохраненный контент, а не шаблон
        blockElement.innerHTML = content;

        // Устанавливаем атрибуты
        blockElement.dataset.editId = element_id;
        blockElement.dataset.blockId = element_id;
        blockElement.dataset.blockType = block_type;
        blockElement.dataset.blockCategory = block_category;
        blockElement.dataset.isBlock = 'true';
        blockElement.dataset.saved = 'true';
        blockElement.setAttribute('contenteditable', 'false');

        // Применяем стили
        if (css_styles) {
            blockElement.style.cssText = css_styles;
        }

        // Находим контейнер для размещения
        const container = document.querySelector(container_selector || '.page-content');
        if (!container) {
            return;
        }

        // Размещаем блок в правильной позиции
        placeBlockAtCorrectPosition(blockElement, container, position_index);

    } catch (error) {
        // Игнорируем ошибки восстановления
    }
}

/**
 * Создание блока из данных БД (без размещения)
 */
async function createBlockFromData(blockData) {
    try {
        const {
            element_id,
            block_type,
            block_category,
            content,
            css_classes,
            css_styles,
            block_metadata
        } = blockData;

        // Проверяем, не существует ли уже элемент с таким ID
        const existingElement = document.querySelector(`[data-edit-id="${element_id}"]`) ||
                               document.querySelector(`[data-block-id="${element_id}"]`);

        if (existingElement) {
            return null;
        }

        // Создаем элемент блока
        const blockElement = document.createElement('div');
        // Всегда добавляем базовый класс content-block для правильной работы системы
        const baseClass = 'content-block';
        const additionalClasses = css_classes && css_classes !== baseClass ? css_classes : '';
        blockElement.className = additionalClasses ? `${baseClass} ${additionalClasses}` : baseClass;

        // Используем сохраненный контент
        blockElement.innerHTML = content;

        // Устанавливаем атрибуты
        blockElement.dataset.editId = element_id;
        blockElement.dataset.blockId = element_id;
        blockElement.dataset.blockType = block_type;
        blockElement.dataset.blockCategory = block_category;
        blockElement.dataset.isBlock = 'true';
        blockElement.dataset.saved = 'true';
        blockElement.setAttribute('contenteditable', 'false');

        // Восстанавливаем данные о свободном позиционировании из metadata СНАЧАЛА
        if (block_metadata) {
            if (block_metadata.freePositioned) {
                blockElement.classList.add('free-positioned');
            }
            if (block_metadata.freeLeft !== undefined && block_metadata.freeLeft !== null) {
                blockElement.dataset.freeLeft = block_metadata.freeLeft;
            }
            if (block_metadata.freeTop !== undefined && block_metadata.freeTop !== null) {
                blockElement.dataset.freeTop = block_metadata.freeTop;
            }
            if (block_metadata.positionUnit) {
                blockElement.dataset.positionUnit = block_metadata.positionUnit;
            }
        }

        // Применяем стили ПОСЛЕ восстановления metadata
        if (css_styles) {
            blockElement.style.cssText = css_styles;
        }

        // КРИТИЧЕСКИ ВАЖНО: Если блок имеет свободное позиционирование,
        // применяем позиции с !important для переопределения CSS правил
        if (blockElement.classList.contains('free-positioned')) {
            let left = blockElement.style.left;
            let top = blockElement.style.top;

            // Если позиций нет в css_styles, берем из dataset (из metadata)
            if ((!left || !top) && blockElement.dataset.freeLeft && blockElement.dataset.freeTop) {
                const isPercent = blockElement.dataset.positionUnit === 'percent';
                left = blockElement.dataset.freeLeft + (isPercent ? '%' : 'px');
                top = blockElement.dataset.freeTop + 'px';
            }

            if (left && top) {
                blockElement.style.setProperty('position', 'absolute', 'important');
                blockElement.style.setProperty('left', left, 'important');
                blockElement.style.setProperty('top', top, 'important');
            }
        }

        // КРИТИЧЕСКИ ВАЖНО: Нормализуем изображения в блоке
        // Убираем отрицательный margin и корректируем позицию блока
        normalizeImagesInBlock(blockElement);

        // ОПТИМИЗАЦИЯ: Lazy loading для всех изображений в блоке
        blockElement.querySelectorAll('img').forEach(img => {
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            if (!img.hasAttribute('decoding')) {
                img.setAttribute('decoding', 'async');
            }
        });

        // КРИТИЧЕСКИ ВАЖНО: Добавляем обработчик контекстного меню для администраторов
        if (isUserAdmin()) {
            if (typeof handleBlockContextMenu === 'function') {
                blockElement.addEventListener('contextmenu', handleBlockContextMenu);
            } else if (typeof window.BlocksSystem !== 'undefined' && typeof window.BlocksSystem.handleBlockContextMenu === 'function') {
                blockElement.addEventListener('contextmenu', window.BlocksSystem.handleBlockContextMenu);
            }
        }

        return blockElement;

    } catch (error) {
        return null;
    }
}

/**
 * Размещение блока в правильной позиции
 */
function placeBlockAtCorrectPosition(blockElement, container, positionIndex) {

    // Получаем все существующие элементы в контейнере (не только блоки)
    const allElements = Array.from(container.children);

    // Преобразуем positionIndex в реальный индекс
    // positionIndex хранится с шагом 100, поэтому делим на 100
    let targetIndex;

    if (typeof positionIndex === 'number' && positionIndex >= 0) {
        // Интерпретируем positionIndex с шагом 100
        targetIndex = Math.floor(positionIndex / 100);
    } else {
        // Если позиция не определена, добавляем в конец
        targetIndex = allElements.length;
    }

    // Убеждаемся, что блок не находится уже в контейнере
    if (blockElement.parentNode === container) {
        container.removeChild(blockElement);
    }

    if (targetIndex >= allElements.length) {
        // Добавляем в конец
        container.appendChild(blockElement);
    } else if (targetIndex <= 0) {
        // Добавляем в начало
        if (allElements.length > 0) {
            container.insertBefore(blockElement, allElements[0]);
        } else {
            container.appendChild(blockElement);
        }
    } else {
        // Вставляем в указанную позицию
        const targetElement = allElements[targetIndex];
        if (targetElement) {
            container.insertBefore(blockElement, targetElement);
        } else {
            container.appendChild(blockElement);
        }
    }
}

// ===== ФУНКЦИИ СОХРАНЕНИЯ В БД =====

/**
 * Сохранение блока в базу данных
 */
async function saveBlockToDatabase(blockElement, categoryKey, blockId, positionData = {}) {
    try {
        // Получаем данные блока
        const elementId = blockElement.dataset.editId || blockElement.dataset.blockId;
        const content = blockElement.innerHTML;
        const selector = getElementSelector(blockElement);

        // Вычисляем позицию блока
        const positionIndex = calculateBlockPosition(blockElement);
        const containerPosition = Math.floor(positionIndex / 100);

        // Получаем информацию о блоке из библиотеки
        const blockInfo = getBlockInfo(categoryKey, blockId);

        // Определяем информацию о позиционировании
        const horizontalContainer = blockElement.closest('.horizontal-container');
        const layoutInfo = {
            containerPosition: containerPosition,
            isInHorizontalContainer: !!horizontalContainer
        };

        if (horizontalContainer) {
            // Дополнительная информация для горизонтальных контейнеров
            const blocksInContainer = Array.from(horizontalContainer.querySelectorAll('.content-block'));
            layoutInfo.horizontalPosition = blocksInContainer.indexOf(blockElement);
            layoutInfo.totalBlocksInContainer = blocksInContainer.length;
        }

        // ===== SEO ОПТИМИЗАЦИЯ =====
        // Анализируем контент блока на наличие ключевых слов
        let seoData = { score: 0, keywords: [], hasKeywords: false };
        if (typeof analyzeTextForSEO === 'function') {
            const textContent = blockElement.textContent || blockElement.innerText || '';
            seoData = analyzeTextForSEO(textContent);
        }

        // Подготавливаем данные для сохранения
        const blockData = {
            elementId: elementId,
            blockType: blockId,
            blockCategory: categoryKey,
            content: content,
            selector: selector,
            positionIndex: positionIndex,
            metadata: {
                blockName: blockInfo?.name || blockId,
                blockDescription: blockInfo?.description || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...positionData,
                layoutInfo: layoutInfo,
                // Добавляем SEO-метаданные
                seo: {
                    score: seoData.score,
                    keywords: seoData.keywords.map(k => k.keyword),
                    keywordDetails: seoData.keywords,
                    hasKeywords: seoData.hasKeywords,
                    optimized: true,
                    analyzedAt: new Date().toISOString()
                }
            },
            containerSelector: positionData.containerSelector || '.page-content',
            cssClasses: blockElement.className,
            cssStyles: blockElement.style.cssText || null
        };


        // Подготавливаем данные для отправки
        const requestData = {
            page_id: getCurrentPageId(),
            block_data: blockData
        };

        // Отправляем запрос на сохранение
        const response = await fetch(`${getApiBaseUrl()}/api/blocks/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });


        const result = await response.json();

        if (result.success) {
            blockElement.dataset.saved = 'true';
        }

        return result;

    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Получение информации о блоке из библиотеки
 */
function getBlockInfo(categoryKey, blockId) {
    if (typeof BLOCKS_LIBRARY === 'undefined') return null;

    const category = BLOCKS_LIBRARY[categoryKey];
    if (!category) return null;

    return category.blocks.find(block => block.id === blockId);
}

/**
 * Вычисление позиции блока на странице
 */
function calculateBlockPosition(blockElement) {
    const pageContent = document.querySelector('.page-content');
    if (!pageContent) return 0;

    // Проверяем, находится ли блок в горизонтальном контейнере
    const horizontalContainer = blockElement.closest('.horizontal-container');

    if (horizontalContainer) {
        // Блок в горизонтальном контейнере
        const allElements = Array.from(pageContent.children);
        const containerIndex = allElements.indexOf(horizontalContainer);
        const blocksInContainer = Array.from(horizontalContainer.querySelectorAll('.content-block'));
        const blockIndexInContainer = blocksInContainer.indexOf(blockElement);

        // Возвращаем позицию как containerIndex * 100 + blockIndexInContainer
        return containerIndex * 100 + blockIndexInContainer;
    } else {
        // Обычный блок
        const allElements = Array.from(pageContent.children);
        const blockIndex = allElements.indexOf(blockElement);
        return blockIndex * 100;
    }
}

/**
 * Получение селектора элемента
 */
function getElementSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.dataset.editId) return `[data-edit-id="${element.dataset.editId}"]`;
    if (element.dataset.blockId) return `[data-block-id="${element.dataset.blockId}"]`;
    return `.${element.className.split(' ').join('.')}`;
}

/**
 * Получение ID текущей страницы
 */
function getCurrentPageId() {
    const path = window.location.pathname;
    const pageName = path.split('/').pop().replace('.html', '');
    let pageId;
    if (pageName === 'index') pageId = 'home';
    else if (pageName === 'test-blocks-system') pageId = 'test-blocks-system';
    else pageId = pageName || 'home';


    return pageId;
}

/**
 * Получение токена пользователя
 */
function getUserToken() {
    return localStorage.getItem('authToken') ||
           sessionStorage.getItem('authToken') ||
           localStorage.getItem('auth_token') ||
           'admin_token_123';
}

/**
 * Настройка автосохранения для блоков
 */
function setupBlockAutoSave() {
    // Отслеживаем изменения в блоках
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                const target = mutation.target;
                const blockElement = target.closest('.content-block[data-is-block="true"]');

                if (blockElement) {
                    // Сохраняем изменения с задержкой для всех блоков папируса
                    clearTimeout(blockElement.saveTimeout);
                    blockElement.saveTimeout = setTimeout(() => {
                        saveBlockContentToDatabase(blockElement);
                    }, 1000);
                }
            }
        });
    });

    // Наблюдаем за изменениями в контенте страницы
    const pageContent = document.querySelector('.page-content');
    if (pageContent) {
        observer.observe(pageContent, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    // Дополнительные обработчики событий для более надежного автосохранения
    document.addEventListener('input', (e) => {
        const blockElement = e.target.closest('.content-block[data-is-block="true"]');
        if (blockElement) {
            clearTimeout(blockElement.saveTimeout);
            blockElement.saveTimeout = setTimeout(() => {
                saveBlockContentToDatabase(blockElement);
            }, 1000);
        }
    });

    document.addEventListener('blur', (e) => {
        const blockElement = e.target.closest('.content-block[data-is-block="true"]');
        if (blockElement) {
            // ===== SEO ОПТИМИЗАЦИЯ =====
            // Обновляем SEO-атрибуты при потере фокуса
            if (typeof updateSEOOnEdit === 'function') {
                const editedElement = e.target;
                updateSEOOnEdit(editedElement);
            }

            // Сохраняем сразу при потере фокуса
            saveBlockContentToDatabase(blockElement);
        }
    }, true);

    document.addEventListener('keyup', (e) => {
        const blockElement = e.target.closest('.content-block[data-is-block="true"]');
        if (blockElement) {
            clearTimeout(blockElement.saveTimeout);
            blockElement.saveTimeout = setTimeout(() => {
                // ===== SEO ОПТИМИЗАЦИЯ =====
                // Обновляем SEO-атрибуты при редактировании
                if (typeof updateSEOOnEdit === 'function') {
                    const editedElement = e.target;
                    updateSEOOnEdit(editedElement);
                }

                saveBlockContentToDatabase(blockElement);
            }, 1000);
        }
    });
}

/**
 * Сохранение только контента блока (при редактировании)
 */
async function saveBlockContentToDatabase(blockElement) {
    try {
        const elementId = blockElement.dataset.editId || blockElement.dataset.blockId;
        const content = blockElement.innerHTML;
        const positionIndex = calculateBlockPosition(blockElement);

        // Проверяем, является ли блок новым (только что созданным)
        const isNewBlock = blockElement.dataset.isNew === 'true';

        // Собираем inline стили
        const inlineStyles = blockElement.style.cssText || null;

        // Определяем информацию о позиционировании
        const horizontalContainer = blockElement.closest('.horizontal-container');
        const layoutInfo = horizontalContainer ? {
            isInHorizontalContainer: true,
            horizontalPosition: Array.from(horizontalContainer.querySelectorAll('.content-block')).indexOf(blockElement),
            containerPosition: Array.from(document.querySelector('.page-content').children).indexOf(horizontalContainer)
        } : {
            isInHorizontalContainer: false,
            containerPosition: Array.from(document.querySelector('.page-content').children).indexOf(blockElement)
        };

        // ===== SEO ОПТИМИЗАЦИЯ =====
        // Анализируем контент на наличие ключевых слов
        let seoData = { score: 0, keywords: [], hasKeywords: false };
        if (typeof analyzeTextForSEO === 'function') {
            const textContent = blockElement.textContent || blockElement.innerText || '';
            seoData = analyzeTextForSEO(textContent);
        }

        const blockData = {
            elementId: elementId,
            blockType: blockElement.dataset.blockType || 'text',
            blockCategory: blockElement.dataset.blockCategory || 'content',
            content: content,
            selector: getElementSelector(blockElement),
            positionIndex: positionIndex,
            metadata: {
                updatedAt: new Date().toISOString(),
                layoutInfo: layoutInfo,
                // Добавляем данные о свободном позиционировании
                freePositioned: blockElement.classList.contains('free-positioned'),
                freeLeft: blockElement.dataset.freeLeft || null,
                freeTop: blockElement.dataset.freeTop || null,
                // Добавляем SEO-метаданные
                seo: {
                    score: seoData.score,
                    keywords: seoData.keywords.map(k => k.keyword),
                    hasKeywords: seoData.hasKeywords,
                    optimized: true,
                    analyzedAt: new Date().toISOString()
                }
            },
            cssClasses: blockElement.className || 'content-block',
            cssStyles: inlineStyles
        };

        // Для новых блоков добавляем дополнительные метаданные
        if (isNewBlock) {
            blockData.metadata.createdAt = new Date().toISOString();
            blockData.containerSelector = '.page-content';
        }

        const response = await fetch(`${getApiBaseUrl()}/api/blocks/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                page_id: getCurrentPageId(),
                block_data: blockData
            })
        });

        const result = await response.json();
        if (result.success) {
            blockElement.dataset.saved = 'true';
            // Убираем флаг нового блока
            if (isNewBlock) {
                delete blockElement.dataset.isNew;
            }
            return { success: true };
        } else {
            return { success: false, error: result.error };
        }

    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Обновление позиций всех блоков с учетом горизонтальных контейнеров
 */
async function updateAllBlockPositions() {
    const pageContent = document.querySelector('.page-content');
    const allElements = Array.from(pageContent.children);
    let containerPosition = 0;

    for (const element of allElements) {
        if (element.classList.contains('horizontal-container')) {
            const blocksInContainer = Array.from(element.querySelectorAll('.content-block[data-is-block="true"]'));

            for (let i = 0; i < blocksInContainer.length; i++) {
                const block = blocksInContainer[i];
                const elementId = block.dataset.editId || block.dataset.blockId;

                if (elementId) {
                    await saveBlockWithPosition(block, elementId, containerPosition * 100 + i, {
                        isInHorizontalContainer: true,
                        horizontalPosition: i,
                        containerPosition: containerPosition
                    });
                }
            }
            containerPosition++;
        } else if (element.classList.contains('content-block') && element.dataset.isBlock === 'true') {
            const elementId = element.dataset.editId || element.dataset.blockId;

            if (elementId) {
                await saveBlockWithPosition(element, elementId, containerPosition * 100, {
                    isInHorizontalContainer: false,
                    containerPosition: containerPosition
                });
            }
            containerPosition++;
        }
    }
}

/**
 * Сохранение блока с позиционной информацией
 */
async function saveBlockWithPosition(block, elementId, position, layoutInfo) {
    try {
        await fetch(`${getApiBaseUrl()}/api/blocks/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                page_id: getCurrentPageId(),
                block_data: {
                    elementId: elementId,
                    blockType: block.dataset.blockType || 'text',
                    blockCategory: block.dataset.blockCategory || 'content',
                    content: block.innerHTML,
                    selector: getElementSelector(block),
                    positionIndex: position,
                    metadata: {
                        updatedAt: new Date().toISOString(),
                        layoutInfo: layoutInfo
                    },
                    cssClasses: block.className || 'content-block'
                }
            })
        });
    } catch (error) {
        // Игнорируем ошибки
    }
}

/**
 * Принудительное сохранение всех блоков (для отладки)
 */
async function forceAllBlocksSave() {
    const blocks = document.querySelectorAll('.content-block[data-is-block="true"]');

    for (const block of blocks) {
        try {
            const result = await saveBlockContentToDatabase(block);
        } catch (error) {
            console.error(`❌ Ошибка сохранения блока ${block.dataset.editId || block.dataset.blockId}:`, error);
        }
    }

}

/**
 * Удаление блока из базы данных
 */
async function deleteBlockFromDatabase(blockElement) {
    try {
        const elementId = blockElement.dataset.editId || blockElement.dataset.blockId;
        if (!elementId) return { success: false, error: 'Нет ID элемента' };

        const response = await fetch(`${getApiBaseUrl()}/api/blocks/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                page_id: getCurrentPageId(),
                element_id: elementId
            })
        });

        const result = await response.json();
        return result;

    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Удаление блока с подтверждением и удалением из БД
 */
async function deleteBlock(blockElement) {
    if (!blockElement) return;

    // Подтверждение удаления через кастомное диалоговое окно
    const confirmed = await showDeleteConfirmation('Вы уверены, что хотите удалить этот блок? Это действие нельзя отменить.');

    if (confirmed) {
        // Удаляем из БД
        const result = await deleteBlockFromDatabase(blockElement);

        // Удаляем из DOM
        blockElement.remove();

        // Обновляем позиции оставшихся блоков
        await updateAllBlockPositions();

        // КРИТИЧЕСКИ ВАЖНО: Обновляем высоту контейнера после удаления блока
        if (window.FreePositioning && typeof window.FreePositioning.updateContainerHeight === 'function') {
            setTimeout(() => {
                window.FreePositioning.updateContainerHeight();
            }, 100);
        }

        if (result.success) {
            showBlockNotification('Блок удален!', 'success');
        } else {
            showBlockNotification('Блок удален из интерфейса, но возможна ошибка удаления из БД', 'warning');
        }
    }
}

// ===== ЭКСПОРТ ФУНКЦИЙ =====

// Экспортируем основные функции для использования в других модулях
window.NewBlockSystem = {
    initialize: initializeNewBlockSystem,
    addBlock: addBlockToEndOfPage,
    updateSystem: updateBlockSystem,
    saveBlock: saveBlockToDatabase,
    saveBlockContent: saveBlockContentToDatabase,
    loadBlocks: loadBlocksFromDatabase,
    restoreBlock: restoreBlockOnPage,
    updatePositions: updateAllBlockPositions,
    deleteBlock: deleteBlock,
    deleteBlockFromDatabase: deleteBlockFromDatabase,
    forceAllBlocksSave: forceAllBlocksSave,
    addDragHandles: addDragHandlesToBlocks,
    removeDragHandles: removeAllDragHandles,
    removeDebugJsonData: removeDebugJsonData
};

// Если на странице присутствует InlinePageEditor из main.js, сохраним ссылку глобально
if (typeof window.InlinePageEditor === 'function') {
    // Найдём экземпляр, если он уже создан разработчиком
    // Допустим, он создает window.App = new InlinePageEditor()
    if (typeof window.App === 'undefined') {
        // Не создаём автоматически, чтобы не ломать логику страницы
        // Ожидаем, что страница сама создаёт экземпляр
    }
}

// Переопределяем глобальную функцию deleteBlock для интеграции с БД
window.deleteBlock = deleteBlock;

// Экспортируем функции для тестирования
window.NewBlockSystem = {
    initialize: initializeNewBlockSystem,
    createBlock: async function(blockType) {
        // Находим блок в библиотеке
        const blockData = window.blockLibrary?.find(block => block.id === blockType);
        if (!blockData) {
            throw new Error(`Блок типа ${blockType} не найден в библиотеке`);
        }

        // Создаем блок
        const blockElement = createBlockElement(blockData, 'center', -1, '.page-content');

        // Добавляем на страницу
        const container = document.querySelector('.page-content') || document.querySelector('.test-content') || document.body;
        container.appendChild(blockElement);

        // Сохраняем в БД
        await saveBlockToDatabase(blockElement, blockData);

        return blockElement;
    },
    loadBlocks: loadBlocksFromDatabase,
    saveBlockContent: saveBlockContentToDatabase,
    forceAllBlocksSave: forceAllBlocksSave,
    updatePositions: updateAllBlockPositions,
    removeDebugJsonData: removeDebugJsonData,
    moveBlockDown: function(blockElement) {
        return moveBlockDown(blockElement);
    },
    moveBlockUp: function(blockElement) {
        return moveBlockUp(blockElement);
    },
    deleteBlock: function(blockId) {
        const blockElement = document.getElementById(blockId);
        if (blockElement) {
            return deleteBlock(blockElement);
        }
        throw new Error(`Блок с ID ${blockId} не найден`);
    }
};

