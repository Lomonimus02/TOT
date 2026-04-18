// ===== СИСТЕМА СВОБОДНОГО ПОЗИЦИОНИРОВАНИЯ БЛОКОВ =====
// Позволяет перемещать блоки в любое место страницы, как в PowerPoint

// Глобальный объект для интеграции
window.FreePositioning = window.FreePositioning || {};

// Переменные для отслеживания перетаскивания
let isDraggingFree = false;
let currentDraggedBlock = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let originalPosition = null;

// Режим свободного позиционирования (включен/выключен)
let freePositioningMode = false;

// Порог для мобильного fallback
const MOBILE_BREAKPOINT = 768;

/**
 * Проверяет, является ли текущий вид мобильным
 */
function isMobileView() {
    return window.innerWidth < MOBILE_BREAKPOINT;
}

/**
 * Конвертирует px в % относительно ширины контейнера
 */
function pxToPercentX(px, containerWidth) {
    if (!containerWidth || containerWidth <= 0) return 0;
    return Math.round((px / containerWidth) * 10000) / 100; // точность до 0.01%
}

/**
 * Конвертирует % в px относительно ширины контейнера
 */
function percentToPxX(percent, containerWidth) {
    return (percent / 100) * containerWidth;
}

/**
 * Включение/выключение режима свободного позиционирования
 */
function toggleFreePositioning(enable = null, showNotification = true) {
    if (enable === null) {
        freePositioningMode = !freePositioningMode;
    } else {
        freePositioningMode = enable;
    }

    const pageContent = document.querySelector('.page-content');
    const blocks = document.querySelectorAll('.content-block');

    if (freePositioningMode) {
        // Сохраняем состояние в localStorage
        localStorage.setItem('freePositioningMode', 'true');

        // Добавляем класс к контейнеру для расширения области
        if (pageContent) {
            pageContent.classList.add('free-positioning-active');
            // Убеждаемся, что контейнер имеет правильное позиционирование
            pageContent.style.position = 'relative';
            pageContent.style.minHeight = '100vh';
        }

        // Включаем свободное позиционирование для всех блоков
        blocks.forEach(block => {
            enableFreePositioning(block);
        });

        // Показываем уведомление только если это ручное включение
        if (showNotification && window.BlocksSystem && window.BlocksSystem.showBlockNotification) {
            window.BlocksSystem.showBlockNotification('Режим свободного позиционирования включен! Перетаскивайте блоки мышью.', 'success');
        }
    } else {
        // Сохраняем состояние в localStorage
        localStorage.setItem('freePositioningMode', 'false');

        // Убираем класс с контейнера
        if (pageContent) {
            pageContent.classList.remove('free-positioning-active');
        }

        // Выключаем свободное позиционирование для всех блоков
        blocks.forEach(block => {
            disableFreePositioning(block);
        });

        if (showNotification && window.BlocksSystem && window.BlocksSystem.showBlockNotification) {
            window.BlocksSystem.showBlockNotification('Режим свободного позиционирования выключен', 'info');
        }
    }

    return freePositioningMode;
}

/**
 * Включить свободное позиционирование для блока
 */
function enableFreePositioning(block) {
    if (!block) return;

    // Проверяем, есть ли уже сохраненные позиции в dataset
    const hasSavedPosition = block.dataset.freeLeft !== undefined && block.dataset.freeTop !== undefined;

    // Проверяем, есть ли уже позиционирование в inline стилях
    const hasInlinePosition = block.style.position === 'absolute' && block.style.left && block.style.top;

    // Проверяем, есть ли класс free-positioned
    const hasFreePositionedClass = block.classList.contains('free-positioned');

    // Если у блока уже есть позиционирование, НЕ ТРОГАЕМ ЕГО!
    if (hasFreePositionedClass || hasSavedPosition || hasInlinePosition) {
        // Если есть dataset, но нет inline стилей - восстанавливаем
        if (hasSavedPosition && !hasInlinePosition) {
            const left = parseFloat(block.dataset.freeLeft);
            const top = parseFloat(block.dataset.freeTop);

            if (!isNaN(left) && !isNaN(top)) {
                const isPercent = block.dataset.positionUnit === 'percent';
                block.style.setProperty('position', 'absolute', 'important');
                block.style.setProperty('left', left + (isPercent ? '%' : 'px'), 'important');
                block.style.setProperty('top', top + 'px', 'important');
                block.classList.add('free-positioned');
            }
        }

        // Если есть inline стили, но нет dataset - сохраняем в dataset
        if (hasInlinePosition && !hasSavedPosition) {
            const leftStr = block.style.left;
            const topStr = block.style.top;
            const left = parseFloat(leftStr);
            const top = parseFloat(topStr);

            if (!isNaN(left) && !isNaN(top)) {
                // Определяем, в каких единицах сохранено
                if (leftStr.includes('%')) {
                    block.dataset.freeLeft = left;
                    block.dataset.positionUnit = 'percent';
                } else {
                    // Миграция px → %
                    const pageContent = document.querySelector('.page-content');
                    const containerWidth = pageContent ? pageContent.offsetWidth : 1200;
                    block.dataset.freeLeft = pxToPercentX(left, containerWidth);
                    block.dataset.positionUnit = 'percent';
                    block.style.setProperty('left', block.dataset.freeLeft + '%', 'important');
                }
                block.dataset.freeTop = top;
                block.classList.add('free-positioned');
            }
        }
    } else {
        // Блок впервые переводится в режим свободного позиционирования
        const pageContent = document.querySelector('.page-content');
        if (!pageContent) return;

        // Получаем текущую позицию блока ПЕРЕД изменением position
        const rect = block.getBoundingClientRect();
        const containerRect = pageContent.getBoundingClientRect();

        // Сохраняем текущую ширину
        const currentWidth = rect.width;

        // Вычисляем позицию относительно контейнера с учетом скролла
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        const top = rect.top + scrollTop - containerRect.top - scrollTop;
        const left = rect.left + scrollLeft - containerRect.left - scrollLeft;

        // Конвертируем left в % относительно контейнера
        const containerWidth = pageContent.offsetWidth;
        const leftPercent = pxToPercentX(left, containerWidth);

        // Применяем абсолютное позиционирование с left в %
        block.style.setProperty('position', 'absolute', 'important');
        block.style.setProperty('top', top + 'px', 'important');
        block.style.setProperty('left', leftPercent + '%', 'important');
        block.style.width = currentWidth + 'px';
        block.classList.add('free-positioned');

        // Сохраняем в dataset: left как %, top как px
        block.dataset.freeTop = top;
        block.dataset.freeLeft = leftPercent;
        block.dataset.positionUnit = 'percent';
        block.dataset.originalTop = top;
        block.dataset.originalLeft = leftPercent;
    }

    // Добавляем визуальный индикатор режима редактирования
    block.classList.add('free-positioning-enabled');

    // Добавляем обработчики перетаскивания на весь блок
    block.style.cursor = 'move';
    block.addEventListener('mousedown', handleFreePositioningMouseDown);
}

/**
 * Отключить свободное позиционирование для блока
 */
function disableFreePositioning(block) {
    if (!block) return;

    // Убираем ТОЛЬКО визуальный индикатор режима редактирования
    block.classList.remove('free-positioning-enabled');

    // НЕ УДАЛЯЕМ класс 'free-positioned' и позиции!
    // Блок должен оставаться на своем месте, просто без возможности перетаскивания

    // Убираем курсор перетаскивания
    block.style.cursor = '';

    // Убираем обработчики перетаскивания
    block.removeEventListener('mousedown', handleFreePositioningMouseDown);

    // ВАЖНО: НЕ удаляем dataset.freeTop и dataset.freeLeft
    // ВАЖНО: НЕ удаляем style.position, style.top, style.left
    // Блок должен остаться на своей позиции!
}

/**
 * Обработчик начала перетаскивания
 */
function handleFreePositioningMouseDown(e) {
    if (!freePositioningMode) return;

    // КРИТИЧЕСКИ ВАЖНО: Проверяем, не находится ли изображение в режиме изменения размера
    const img = e.target.closest('img');
    if (img && img.classList.contains('resizing-active')) {
        return;
    }

    // КРИТИЧЕСКИ ВАЖНО: Проверяем, не клик ли по resize handle
    if (e.target.classList.contains('resize-handle')) {
        return;
    }

    e.preventDefault();
    e.stopPropagation();

    currentDraggedBlock = e.target.closest('.content-block');
    if (!currentDraggedBlock) return;

    isDraggingFree = true;

    // Вычисляем смещение курсора относительно блока
    const rect = currentDraggedBlock.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;

    // Сохраняем исходную позицию
    originalPosition = {
        top: currentDraggedBlock.style.top,
        left: currentDraggedBlock.style.left
    };

    // Добавляем класс для визуального эффекта
    currentDraggedBlock.classList.add('dragging-free');

    // Поднимаем z-index
    currentDraggedBlock.style.zIndex = '10000';

    // Добавляем глобальные обработчики
    document.addEventListener('mousemove', handleFreePositioningMouseMove);
    document.addEventListener('mouseup', handleFreePositioningMouseUp);
}

/**
 * Обработчик движения мыши при перетаскивании
 */
function handleFreePositioningMouseMove(e) {
    if (!isDraggingFree || !currentDraggedBlock) return;

    e.preventDefault();
    e.stopPropagation();

    const pageContent = document.querySelector('.page-content');
    if (!pageContent) return;

    const containerRect = pageContent.getBoundingClientRect();

    // Получаем скролл
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // Вычисляем новую позицию относительно контейнера
    let newLeft = e.clientX - containerRect.left - dragOffsetX;
    let newTop = e.clientY - containerRect.top - dragOffsetY;

    // Получаем размеры для ограничений
    const blockWidth = currentDraggedBlock.offsetWidth;
    const blockHeight = currentDraggedBlock.offsetHeight;

    // КРИТИЧЕСКИ ВАЖНО: Используем offsetWidth/offsetHeight контейнера - это рабочая область
    const containerWidth = pageContent.offsetWidth;
    let containerHeight = pageContent.offsetHeight;

    // КРИТИЧЕСКИ ВАЖНО: Автоматическое растягивание страницы при перетаскивании к нижней границе
    const expandThreshold = 100; // Порог в пикселях от нижней границы
    const requiredHeight = newTop + blockHeight + expandThreshold;

    if (requiredHeight > containerHeight) {
        // Увеличиваем высоту контейнера
        const newContainerHeight = requiredHeight + 200; // Добавляем запас
        pageContent.style.minHeight = newContainerHeight + 'px';
        containerHeight = newContainerHeight;

        // КРИТИЧЕСКИ ВАЖНО: Сохраняем высоту контейнера в localStorage
        saveContainerHeight(newContainerHeight);
    }

    // КРИТИЧЕСКИ ВАЖНО: Ограничиваем позиции СТРОГО внутри рабочей области .page-content
    // Блоки НЕ могут выходить за границы контейнера
    const leftLimit = 0; // Левая граница контейнера
    const rightLimit = containerWidth - blockWidth; // Правая граница контейнера
    const topLimit = 0; // Верхняя граница контейнера
    const bottomLimit = containerHeight - blockHeight; // Нижняя граница контейнера

    // Применяем ограничения
    newLeft = Math.max(leftLimit, Math.min(newLeft, rightLimit));
    newTop = Math.max(topLimit, Math.min(newTop, bottomLimit));

    // Применяем новую позицию С !important для переопределения CSS
    // Во время перетаскивания используем px для плавности
    currentDraggedBlock.style.setProperty('left', newLeft + 'px', 'important');
    currentDraggedBlock.style.setProperty('top', newTop + 'px', 'important');

    // Сохраняем временные px-позиции (конвертируются в % при отпускании мыши)
    currentDraggedBlock.dataset.dragLeftPx = newLeft;
    currentDraggedBlock.dataset.freeTop = newTop;
    currentDraggedBlock.dataset.originalTop = newTop;
}

/**
 * Обработчик окончания перетаскивания
 */
function handleFreePositioningMouseUp(e) {
    if (!isDraggingFree || !currentDraggedBlock) return;

    e.preventDefault();

    // Убираем класс перетаскивания
    currentDraggedBlock.classList.remove('dragging-free');

    // Возвращаем нормальный z-index
    currentDraggedBlock.style.zIndex = '';

    // Конвертируем финальную px-позицию left в % перед сохранением
    const pageContent = document.querySelector('.page-content');
    if (pageContent) {
        const containerWidth = pageContent.offsetWidth;
        const leftPx = parseFloat(currentDraggedBlock.dataset.dragLeftPx || currentDraggedBlock.style.left);
        const leftPercent = pxToPercentX(leftPx, containerWidth);
        currentDraggedBlock.dataset.freeLeft = leftPercent;
        currentDraggedBlock.dataset.originalLeft = leftPercent;
        currentDraggedBlock.dataset.positionUnit = 'percent';
        // Применяем % для left в CSS
        currentDraggedBlock.style.setProperty('left', leftPercent + '%', 'important');
        delete currentDraggedBlock.dataset.dragLeftPx;
    }

    // Сохраняем позицию в БД
    saveBlockPosition(currentDraggedBlock);

    // КРИТИЧЕСКИ ВАЖНО: Обновляем высоту контейнера после перетаскивания
    setTimeout(() => {
        updateContainerHeightFromBlocks();
    }, 100);

    // Убираем глобальные обработчики
    document.removeEventListener('mousemove', handleFreePositioningMouseMove);
    document.removeEventListener('mouseup', handleFreePositioningMouseUp);

    // Сбрасываем переменные
    isDraggingFree = false;
    currentDraggedBlock = null;
    dragOffsetX = 0;
    dragOffsetY = 0;
    originalPosition = null;
}

/**
 * Применить свободное позиционирование ко всем блокам на странице
 */
function applyFreePositioningToAllBlocks() {
    const pageContent = document.querySelector('.page-content');
    if (!pageContent) return;
    
    // Делаем контейнер относительным для абсолютного позиционирования
    pageContent.style.position = 'relative';
    pageContent.style.minHeight = '100vh';
    
    const blocks = pageContent.querySelectorAll('.content-block');
    blocks.forEach(block => {
        if (freePositioningMode) {
            enableFreePositioning(block);
        }
    });
}

/**
 * Сохранение позиции блока в базу данных
 */
async function saveBlockPosition(block) {
    if (!block) return;

    try {
        const elementId = block.dataset.editId || block.dataset.blockId;
        if (!elementId) {
            return;
        }

        // КРИТИЧЕСКИ ВАЖНО: Для блоков со свободным позиционированием
        // нужно ЯВНО формировать cssStyles, потому что cssText может не включать
        // стили, примененные с !important
        let cssStyles = block.style.cssText;

        if (block.classList.contains('free-positioned')) {
            // Получаем позиции из dataset (они всегда актуальные)
            const left = block.dataset.freeLeft;
            const top = block.dataset.freeTop;

            if (left !== undefined && top !== undefined) {
                // Формируем cssStyles: left в %, top в px
                const isPercent = block.dataset.positionUnit === 'percent';
                const leftUnit = isPercent ? '%' : 'px';
                cssStyles = `position: absolute; left: ${left}${leftUnit}; top: ${top}px;`;

                // Добавляем другие стили, если они есть
                const otherStyles = [];
                for (let i = 0; i < block.style.length; i++) {
                    const prop = block.style[i];
                    if (prop !== 'position' && prop !== 'left' && prop !== 'top') {
                        otherStyles.push(`${prop}: ${block.style.getPropertyValue(prop)};`);
                    }
                }
                if (otherStyles.length > 0) {
                    cssStyles += ' ' + otherStyles.join(' ');
                }
            }
        }

        const cssClasses = block.className;

        // Получаем данные блока
        const blockType = block.dataset.blockType || 'text';
        const blockCategory = block.dataset.blockCategory || 'content';
        const content = block.innerHTML;

        // Вычисляем позицию блока в документе
        const positionIndex = calculateBlockPosition(block);

        // Подготавливаем данные для сохранения
        const blockData = {
            elementId: elementId,
            blockType: blockType,
            blockCategory: blockCategory,
            content: content,
            selector: `[data-edit-id="${elementId}"]`,
            positionIndex: positionIndex,
            cssStyles: cssStyles,
            cssClasses: cssClasses,
            metadata: {
                updatedAt: new Date().toISOString(),
                freePositioned: block.classList.contains('free-positioned'),
                freeLeft: block.dataset.freeLeft,
                freeTop: block.dataset.freeTop,
                positionUnit: block.dataset.positionUnit || 'px'
            }
        };

        // Отправляем запрос на сохранение
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
            block.dataset.saved = 'true';
        }

    } catch (error) {
        // Ошибка сохранения позиции
    }
}

/**
 * Вспомогательная функция для получения базового URL API
 */
function getApiBaseUrl() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : '';
}

/**
 * Вспомогательная функция для получения ID текущей страницы
 */
function getCurrentPageId() {
    const path = window.location.pathname;
    const fileName = path.split('/').pop().replace('.html', '');
    return fileName === 'index' ? 'home' : fileName;
}

/**
 * Вспомогательная функция для вычисления позиции блока
 */
function calculateBlockPosition(block) {
    const pageContent = document.querySelector('.page-content');
    if (!pageContent) return 0;

    const allBlocks = Array.from(pageContent.querySelectorAll('.content-block'));
    const index = allBlocks.indexOf(block);
    return index >= 0 ? index * 100 : 0;
}

/**
 * Восстановить сохраненные позиции блоков при загрузке страницы
 */
function restoreSavedPositions() {
    // Убеждаемся, что контейнер имеет position: relative
    const pageContent = document.querySelector('.page-content');
    if (pageContent && !pageContent.style.position) {
        pageContent.style.position = 'relative';
        pageContent.style.minHeight = '100vh';
    }

    // На мобильных устройствах не применяем абсолютное позиционирование
    // CSS media query обработает переключение на поточный лейаут
    if (isMobileView()) return;

    const blocks = document.querySelectorAll('.content-block');
    const containerWidth = pageContent ? pageContent.offsetWidth : 1200;

    blocks.forEach(block => {
        const hasFreePositionedClass = block.classList.contains('free-positioned');
        const freeLeft = block.dataset.freeLeft;
        const freeTop = block.dataset.freeTop;

        if (hasFreePositionedClass || (freeLeft !== undefined && freeTop !== undefined)) {
            let left = parseFloat(freeLeft);
            const top = parseFloat(freeTop);

            if (!isNaN(left) && !isNaN(top)) {
                // Миграция старого формата px → %
                const isPercent = block.dataset.positionUnit === 'percent';
                if (!isPercent) {
                    // Старые px-значения для left → конвертируем в %
                    left = pxToPercentX(left, containerWidth);
                    block.dataset.freeLeft = left;
                    block.dataset.positionUnit = 'percent';
                }

                // Применяем: left в %, top в px
                block.style.setProperty('position', 'absolute', 'important');
                block.style.setProperty('left', left + '%', 'important');
                block.style.setProperty('top', top + 'px', 'important');

                // Сохраняем оригинальные позиции при восстановлении из БД
                if (!block.dataset.originalLeft || !block.dataset.originalTop) {
                    block.dataset.originalLeft = left;
                    block.dataset.originalTop = top;
                }

                // Добавляем класс, если его нет
                if (!hasFreePositionedClass) {
                    block.classList.add('free-positioned');
                }
            }
        }
    });
}

// Экспортируем функции
window.FreePositioning = {
    toggleFreePositioning,
    enableFreePositioning,
    disableFreePositioning,
    applyFreePositioningToAllBlocks,
    restoreSavedPositions,
    get isEnabled() { return freePositioningMode; }
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // КРИТИЧЕСКИ ВАЖНО: Запасной механизм на случай, если событие blocksLoaded не придет
    // Это может произойти, если loadBlocksFromDatabase зависнет
    let blocksLoadedReceived = false;

    const fallbackTimeout = setTimeout(() => {
        if (!blocksLoadedReceived) {
            performPositionRestoration();
        }
    }, 5000);

    // Очищаем таймаут, если событие получено
    window.addEventListener('blocksLoaded', () => {
        blocksLoadedReceived = true;
        clearTimeout(fallbackTimeout);
    }, { once: true });
});

// Функция восстановления позиций (вынесена для переиспользования)
function performPositionRestoration() {
    // КРИТИЧЕСКИ ВАЖНО: Высота контейнера уже восстановлена в initializeNewBlockSystem
    // Это предотвращает дерганую подгрузку страницы

    restoreSavedPositions();

    // Даем время на применение стилей
    setTimeout(() => {
        restoreSavedPositions();

        // После восстановления позиций проверяем, нужно ли включить режим
        const savedMode = localStorage.getItem('freePositioningMode');
        if (savedMode === 'true') {
            // Включаем режим без уведомления
            setTimeout(() => {
                // КРИТИЧЕСКИ ВАЖНО: Сначала включаем режим БЕЗ уведомления
                toggleFreePositioning(true, false);

                // Затем еще раз восстанавливаем позиции
                setTimeout(() => {
                    restoreSavedPositions();

                    // КРИТИЧЕСКИ ВАЖНО: После восстановления корректируем позиции для текущего размера экрана
                    setTimeout(() => {
                        adjustBlockPositionsForViewport();
                        // КРИТИЧЕСКИ ВАЖНО: Обновляем высоту контейнера на основе позиций блоков
                        updateContainerHeightFromBlocks();
                    }, 100);
                }, 100);
            }, 100);
        } else {
            // КРИТИЧЕСКИ ВАЖНО: Даже если режим не включен, корректируем позиции блоков
            setTimeout(() => {
                adjustBlockPositionsForViewport();
                // КРИТИЧЕСКИ ВАЖНО: Обновляем высоту контейнера на основе позиций блоков
                updateContainerHeightFromBlocks();
            }, 100);
        }
    }, 200);
}

// КРИТИЧЕСКИ ВАЖНО: Ждем события blocksLoaded от new-blocks-system.js
// Это гарантирует, что блоки загружены из БД перед восстановлением позиций
window.addEventListener('blocksLoaded', (event) => {
    // Небольшая задержка для завершения рендеринга
    setTimeout(() => {
        performPositionRestoration();
    }, 100);
});

// ===== АДАПТИВНОСТЬ: КОРРЕКТИРОВКА ПОЗИЦИЙ ПРИ ИЗМЕНЕНИИ РАЗМЕРА ОКНА =====

/**
 * Корректирует позиции блоков при изменении размера экрана.
 * - На мобильном (<768px): переключает блоки в поточный лейаут (position: static)
 * - На десктопе/планшете: left в % масштабируется автоматически,
 *   проверяем только выход за границы и пересечения
 */
function adjustBlockPositionsForViewport() {
    const blocks = document.querySelectorAll('.content-block.free-positioned');
    const pageContent = document.querySelector('.page-content');

    if (!pageContent || blocks.length === 0) {
        return;
    }

    // === МОБИЛЬНЫЙ FALLBACK: поточный лейаут ===
    if (isMobileView()) {
        blocks.forEach(block => {
            block.style.setProperty('position', 'static', 'important');
            block.style.setProperty('left', 'auto', 'important');
            block.style.setProperty('top', 'auto', 'important');
            block.style.setProperty('width', '100%', 'important');
            block.style.setProperty('margin-bottom', '15px', 'important');
        });
        // Сбрасываем фиксированную высоту контейнера на мобильном
        pageContent.style.minHeight = 'auto';
        return;
    }

    // === ДЕСКТОП/ПЛАНШЕТ: абсолютное позиционирование с % для left ===
    const containerWidth = pageContent.offsetWidth;
    let containerHeight = pageContent.offsetHeight;

    // Сортируем блоки по Y-позиции (сверху вниз)
    const blocksArray = Array.from(blocks);
    blocksArray.sort((a, b) => {
        const aTop = parseFloat(a.dataset.originalTop || a.dataset.freeTop || '0');
        const bTop = parseFloat(b.dataset.originalTop || b.dataset.freeTop || '0');
        return aTop - bTop;
    });

    const occupiedAreas = [];

    blocksArray.forEach((block) => {
        // Восстанавливаем absolute на случай перехода с мобильного
        block.style.setProperty('position', 'absolute', 'important');
        block.style.removeProperty('margin-bottom');
        block.style.removeProperty('width');

        const blockWidth = block.offsetWidth;
        const blockHeight = block.offsetHeight;

        // Сохраняем оригинальные позиции при первом вызове
        if (!block.dataset.originalLeft || !block.dataset.originalTop) {
            block.dataset.originalLeft = block.dataset.freeLeft || '0';
            block.dataset.originalTop = block.dataset.freeTop || '0';
        }

        // Миграция старого формата px → %
        const isPercent = block.dataset.positionUnit === 'percent';
        let leftPercent = parseFloat(block.dataset.originalLeft);
        let topPx = parseFloat(block.dataset.originalTop);

        if (isNaN(leftPercent)) leftPercent = 0;
        if (isNaN(topPx)) topPx = 0;

        if (!isPercent) {
            // Старый формат: leftPercent на самом деле px — конвертируем
            leftPercent = pxToPercentX(leftPercent, containerWidth);
            block.dataset.freeLeft = leftPercent;
            block.dataset.originalLeft = leftPercent;
            block.dataset.positionUnit = 'percent';
        }

        // Вычисляем реальную left-позицию в px для проверки пересечений
        let realLeftPx = percentToPxX(leftPercent, containerWidth);
        let realTopPx = topPx;

        // Ограничиваем: блок не выходит за правую границу
        const maxLeftPx = Math.max(0, containerWidth - blockWidth);
        if (realLeftPx > maxLeftPx) {
            realLeftPx = maxLeftPx;
            leftPercent = pxToPercentX(realLeftPx, containerWidth);
        }
        if (realLeftPx < 0) {
            realLeftPx = 0;
            leftPercent = 0;
        }

        // Ограничиваем top
        if (realTopPx < 0) realTopPx = 0;

        // Проверяем пересечения с другими блоками
        let attempts = 0;
        while (attempts < 50) {
            const currentArea = {
                left: realLeftPx,
                top: realTopPx,
                right: realLeftPx + blockWidth,
                bottom: realTopPx + blockHeight
            };

            const hasOverlap = occupiedAreas.some(area => {
                return !(currentArea.right < area.left ||
                        currentArea.left > area.right ||
                        currentArea.bottom < area.top ||
                        currentArea.top > area.bottom);
            });

            if (!hasOverlap) break;
            realTopPx += 20;
            attempts++;
        }

        // Растягиваем контейнер при необходимости
        if (realTopPx + blockHeight > containerHeight) {
            const newContainerHeight = realTopPx + blockHeight + 200;
            pageContent.style.minHeight = newContainerHeight + 'px';
            containerHeight = newContainerHeight;
            saveContainerHeight(newContainerHeight);
        }

        // Сохраняем занятую область
        occupiedAreas.push({
            left: realLeftPx,
            top: realTopPx,
            right: realLeftPx + blockWidth,
            bottom: realTopPx + blockHeight
        });

        // Применяем: left в %, top в px
        block.style.setProperty('left', leftPercent + '%', 'important');
        block.style.setProperty('top', realTopPx + 'px', 'important');
        block.style.setProperty('position', 'absolute', 'important');
    });
}

// КРИТИЧЕСКИ ВАЖНО: Обработчик resize с немедленным вызовом и debounce
let resizeTimeout;
function handleResize() {
    // КРИТИЧЕСКИ ВАЖНО: Вызываем НЕМЕДЛЕННО для мгновенной реакции
    adjustBlockPositionsForViewport();

    // И еще раз с задержкой для финальной корректировки
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        adjustBlockPositionsForViewport();
    }, 100);
}

// КРИТИЧЕСКИ ВАЖНО: Слушаем изменение размера окна
window.addEventListener('resize', handleResize);

// КРИТИЧЕСКИ ВАЖНО: Слушаем изменение ориентации на мобильных устройствах
window.addEventListener('orientationchange', () => {
    // Даем время на завершение поворота экрана
    setTimeout(() => {
        adjustBlockPositionsForViewport();
    }, 100);
});

// КРИТИЧЕСКИ ВАЖНО: Вызываем корректировку при загрузке страницы
window.addEventListener('load', () => {
    setTimeout(() => {
        adjustBlockPositionsForViewport();
    }, 300);
});

// КРИТИЧЕСКИ ВАЖНО: Вызываем корректировку после загрузки блоков
window.addEventListener('blocksLoaded', () => {
    setTimeout(() => {
        adjustBlockPositionsForViewport();
    }, 200);
});

// ===== СОХРАНЕНИЕ И ВОССТАНОВЛЕНИЕ ВЫСОТЫ КОНТЕЙНЕРА =====

/**
 * Сохранить высоту контейнера в localStorage
 */
function saveContainerHeight(height) {
    try {
        const pageId = getCurrentPageId();
        localStorage.setItem(`containerHeight_${pageId}`, height.toString());
    } catch (error) {
        console.error('❌ Ошибка сохранения высоты контейнера:', error);
    }
}

/**
 * Восстановить высоту контейнера из localStorage
 */
function restoreContainerHeight() {
    try {
        const pageId = getCurrentPageId();
        const savedHeight = localStorage.getItem(`containerHeight_${pageId}`);

        if (savedHeight) {
            const pageContent = document.querySelector('.page-content');
            if (pageContent) {
                const height = parseInt(savedHeight);
                pageContent.style.minHeight = height + 'px';
            }
        }
    } catch (error) {
        console.error('❌ Ошибка восстановления высоты контейнера:', error);
    }
}

/**
 * Вычислить необходимую высоту контейнера на основе позиций блоков
 */
function calculateRequiredContainerHeight() {
    const pageContent = document.querySelector('.page-content');
    if (!pageContent) return null;

    const blocks = pageContent.querySelectorAll('.content-block.free-positioned');
    let maxBottom = 0;

    blocks.forEach(block => {
        const top = parseFloat(block.dataset.freeTop) || parseFloat(block.style.top) || 0;
        const height = block.offsetHeight;
        const bottom = top + height;

        if (bottom > maxBottom) {
            maxBottom = bottom;
        }
    });

    // Добавляем запас 200px
    return maxBottom > 0 ? maxBottom + 200 : null;
}

/**
 * Обновить высоту контейнера на основе позиций блоков
 */
function updateContainerHeightFromBlocks() {
    const requiredHeight = calculateRequiredContainerHeight();

    if (requiredHeight) {
        const pageContent = document.querySelector('.page-content');
        if (pageContent) {
            const currentHeight = pageContent.offsetHeight;
            const minHeight = Math.max(requiredHeight, window.innerHeight);

            // КРИТИЧЕСКИ ВАЖНО: Обновляем высоту в ОБОИХ направлениях (растягивание И сжатие)
            if (minHeight !== currentHeight) {
                pageContent.style.minHeight = minHeight + 'px';
                saveContainerHeight(minHeight);
            }
        }
    } else {
        // КРИТИЧЕСКИ ВАЖНО: Если нет блоков со свободным позиционированием, сбрасываем до минимальной высоты
        const pageContent = document.querySelector('.page-content');
        if (pageContent) {
            const minHeight = window.innerHeight;
            pageContent.style.minHeight = minHeight + 'px';
            saveContainerHeight(minHeight);
        }
    }
}

// ===== ЭКСПОРТ ФУНКЦИЙ ДЛЯ ИНТЕГРАЦИИ =====

/**
 * Проверка, включен ли режим свободного позиционирования
 */
window.FreePositioning.isFreePositioningMode = function() {
    return freePositioningMode;
};

/**
 * Экспорт функции переключения режима
 */
window.FreePositioning.toggle = toggleFreePositioning;

/**
 * Экспорт функции обновления высоты контейнера
 */
window.FreePositioning.updateContainerHeight = updateContainerHeightFromBlocks;

/**
 * Экспорт функции восстановления высоты контейнера
 */
window.FreePositioning.restoreContainerHeight = restoreContainerHeight;

/**
 * Экспорт функции сохранения позиции блока
 */
window.FreePositioning.saveBlockPosition = saveBlockPosition;
