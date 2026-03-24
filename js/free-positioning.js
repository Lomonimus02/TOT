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
                block.style.setProperty('position', 'absolute', 'important');
                block.style.setProperty('left', left + 'px', 'important');
                block.style.setProperty('top', top + 'px', 'important');
                // Устанавливаем CSS переменную для адаптивности
                block.style.setProperty('--free-left', left + 'px');
                block.style.setProperty('--free-top', top + 'px');
                block.classList.add('free-positioned');
            }
        }

        // Если есть inline стили, но нет dataset - сохраняем в dataset
        if (hasInlinePosition && !hasSavedPosition) {
            const left = parseFloat(block.style.left);
            const top = parseFloat(block.style.top);

            if (!isNaN(left) && !isNaN(top)) {
                block.dataset.freeLeft = left;
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

        // Применяем абсолютное позиционирование
        block.style.setProperty('position', 'absolute', 'important');
        block.style.setProperty('top', top + 'px', 'important');
        block.style.setProperty('left', left + 'px', 'important');
        // Устанавливаем CSS переменные для адаптивности
        block.style.setProperty('--free-left', left + 'px');
        block.style.setProperty('--free-top', top + 'px');
        block.style.width = currentWidth + 'px';
        block.classList.add('free-positioned');

        // КРИТИЧЕСКИ ВАЖНО: Сохраняем в dataset И в оригинальные позиции
        block.dataset.freeTop = top;
        block.dataset.freeLeft = left;
        block.dataset.originalTop = top;
        block.dataset.originalLeft = left;
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
        console.log('⚠️ Изображение в режиме изменения размера - перетаскивание заблокировано');
        return;
    }

    // КРИТИЧЕСКИ ВАЖНО: Проверяем, не клик ли по resize handle
    if (e.target.classList.contains('resize-handle')) {
        console.log('⚠️ Клик по resize handle - перетаскивание заблокировано');
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
        console.log(`📏 Страница растянута до ${newContainerHeight}px`);

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
    currentDraggedBlock.style.setProperty('left', newLeft + 'px', 'important');
    currentDraggedBlock.style.setProperty('top', newTop + 'px', 'important');
    // Устанавливаем CSS переменные для адаптивности
    currentDraggedBlock.style.setProperty('--free-left', newLeft + 'px');
    currentDraggedBlock.style.setProperty('--free-top', newTop + 'px');

    // КРИТИЧЕСКИ ВАЖНО: Сохраняем в dataset И в оригинальные позиции
    currentDraggedBlock.dataset.freeLeft = newLeft;
    currentDraggedBlock.dataset.freeTop = newTop;
    currentDraggedBlock.dataset.originalLeft = newLeft;
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
                // Формируем cssStyles ЯВНО с позициями
                cssStyles = `position: absolute; left: ${left}px; top: ${top}px;`;

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
                freeTop: block.dataset.freeTop
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
    // КРИТИЧЕСКИ ВАЖНО: Убеждаемся, что контейнер имеет position: relative
    const pageContent = document.querySelector('.page-content');
    if (pageContent && !pageContent.style.position) {
        pageContent.style.position = 'relative';
        pageContent.style.minHeight = '100vh';
    }

    const blocks = document.querySelectorAll('.content-block');

    blocks.forEach(block => {
        // Проверяем, есть ли класс free-positioned (восстановленный из БД)
        const hasFreePositionedClass = block.classList.contains('free-positioned');

        // Проверяем, есть ли сохраненные позиции в dataset
        const freeLeft = block.dataset.freeLeft;
        const freeTop = block.dataset.freeTop;

        if (hasFreePositionedClass || (freeLeft !== undefined && freeTop !== undefined)) {
            const left = parseFloat(freeLeft);
            const top = parseFloat(freeTop);

            if (!isNaN(left) && !isNaN(top)) {
                // КРИТИЧЕСКИ ВАЖНО: Применяем позиционирование с !important через setAttribute
                block.style.setProperty('position', 'absolute', 'important');
                block.style.setProperty('left', left + 'px', 'important');
                block.style.setProperty('top', top + 'px', 'important');
                // Устанавливаем CSS переменные для адаптивности
                block.style.setProperty('--free-left', left + 'px');
                block.style.setProperty('--free-top', top + 'px');

                // КРИТИЧЕСКИ ВАЖНО: Сохраняем оригинальные позиции при восстановлении из БД
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
 * Корректирует позиции блоков, чтобы они не выходили за границы контейнера
 * КРИТИЧЕСКИ ВАЖНО: Учитывает изменение высоты блоков при переносе текста
 */
function adjustBlockPositionsForViewport() {
    const blocks = document.querySelectorAll('.content-block.free-positioned');
    const pageContent = document.querySelector('.page-content');

    if (!pageContent || blocks.length === 0) {
        return;
    }

    // КРИТИЧЕСКИ ВАЖНО: Получаем размеры КОНТЕЙНЕРА, а не viewport!
    const containerWidth = pageContent.offsetWidth;
    const containerHeight = pageContent.offsetHeight;

    // КРИТИЧЕСКИ ВАЖНО: Сортируем блоки по их Y-позиции (сверху вниз)
    // Это позволит избежать перекрытия при корректировке
    const blocksArray = Array.from(blocks);
    blocksArray.sort((a, b) => {
        const aTop = parseFloat(a.dataset.originalTop || a.dataset.freeTop || a.style.top || '0');
        const bTop = parseFloat(b.dataset.originalTop || b.dataset.freeTop || b.style.top || '0');
        return aTop - bTop;
    });

    // Массив для отслеживания занятых областей
    const occupiedAreas = [];

    blocksArray.forEach((block) => {
        // КРИТИЧЕСКИ ВАЖНО: НЕ сбрасываем margin и размеры изображений!
        // Вместо этого просто получаем текущие размеры блока с учетом изображения

        // КРИТИЧЕСКИ ВАЖНО: ВСЕГДА используем текущие размеры блока для расчетов
        // Размеры могут измениться из-за:
        // 1. Переноса текста при изменении ширины экрана
        // 2. Изменения размера изображения администратором
        const blockWidth = block.offsetWidth;
        const blockHeight = block.offsetHeight;

        // КРИТИЧЕСКИ ВАЖНО: Используем ОРИГИНАЛЬНЫЕ позиции, а не скорректированные!
        // Сохраняем оригинальные позиции при первом вызове
        if (!block.dataset.originalLeft || !block.dataset.originalTop) {
            block.dataset.originalLeft = block.dataset.freeLeft || block.style.left || '0';
            block.dataset.originalTop = block.dataset.freeTop || block.style.top || '0';
        }

        // Берем ОРИГИНАЛЬНЫЕ позиции для расчета
        let originalLeft = parseFloat(block.dataset.originalLeft);
        let originalTop = parseFloat(block.dataset.originalTop);

        if (isNaN(originalLeft)) originalLeft = 0;
        if (isNaN(originalTop)) originalTop = 0;

        // КРИТИЧЕСКИ ВАЖНО: Вычисляем максимальные допустимые позиции относительно КОНТЕЙНЕРА
        // БЕЗ отступов - блоки могут доходить до самых краев экрана
        const margin = 0; // Отступ от края = 0
        const maxLeft = Math.max(margin, containerWidth - blockWidth - margin);
        const maxTop = Math.max(margin, containerHeight - blockHeight - margin);

        // КРИТИЧЕСКИ ВАЖНО: Корректируем ОРИГИНАЛЬНЫЕ позиции
        let newLeft = originalLeft;
        let newTop = originalTop;

        // Ограничиваем left между margin и maxLeft
        if (newLeft + blockWidth > containerWidth - margin) {
            // Блок выходит за правую границу контейнера - сдвигаем влево
            newLeft = maxLeft;
        }
        if (newLeft < margin) {
            // Блок выходит за левую границу контейнера - сдвигаем вправо
            newLeft = margin;
        }

        // Ограничиваем top между margin и maxTop
        if (newTop + blockHeight > containerHeight - margin) {
            // Блок выходит за нижнюю границу контейнера - сдвигаем вверх
            newTop = maxTop;
        }
        if (newTop < margin) {
            // Блок выходит за верхнюю границу контейнера - сдвигаем вниз
            newTop = margin;
        }

        // КРИТИЧЕСКИ ВАЖНО: Проверяем пересечение с другими блоками
        // Если блок пересекается, сдвигаем его вниз
        let attempts = 0;
        const maxAttempts = 50; // Максимум попыток, чтобы избежать бесконечного цикла
        let maxBottomPosition = containerHeight; // Отслеживаем максимальную нижнюю позицию

        while (attempts < maxAttempts) {
            const currentArea = {
                left: newLeft,
                top: newTop,
                right: newLeft + blockWidth,
                bottom: newTop + blockHeight
            };

            // Проверяем пересечение с уже размещенными блоками
            const hasOverlap = occupiedAreas.some(area => {
                return !(currentArea.right < area.left ||
                        currentArea.left > area.right ||
                        currentArea.bottom < area.top ||
                        currentArea.top > area.bottom);
            });

            if (!hasOverlap) {
                // Нет пересечения - позиция найдена
                break;
            }

            // Есть пересечение - сдвигаем блок вниз
            newTop += 20;

            // КРИТИЧЕСКИ ВАЖНО: Отслеживаем максимальную нижнюю позицию
            // Вместо того чтобы сдвигать блок вправо, растягиваем страницу вниз
            if (newTop + blockHeight > maxBottomPosition) {
                maxBottomPosition = newTop + blockHeight;
            }

            attempts++;
        }

        // КРИТИЧЕСКИ ВАЖНО: Если блок вышел за пределы контейнера, растягиваем контейнер
        if (newTop + blockHeight > containerHeight) {
            const newContainerHeight = newTop + blockHeight + 200; // Добавляем запас 200px
            const pageContent = document.querySelector('.page-content');
            if (pageContent) {
                pageContent.style.minHeight = newContainerHeight + 'px';
                saveContainerHeight(newContainerHeight);
                console.log(`📏 Страница растянута для размещения блока: ${containerHeight}px → ${newContainerHeight}px`);
            }
        }

        // Сохраняем занятую область
        occupiedAreas.push({
            left: newLeft,
            top: newTop,
            right: newLeft + blockWidth,
            bottom: newTop + blockHeight
        });

        // КРИТИЧЕСКИ ВАЖНО: НЕ обновляем dataset.freeLeft/freeTop - это оригинальные позиции!
        // Применяем только визуальные стили

        // Применяем стили с !important
        block.style.setProperty('left', newLeft + 'px', 'important');
        block.style.setProperty('top', newTop + 'px', 'important');
        block.style.setProperty('position', 'absolute', 'important');

        // Устанавливаем CSS переменные
        block.style.setProperty('--free-left', newLeft + 'px');
        block.style.setProperty('--free-top', newTop + 'px');

        // НЕ сохраняем в БД - это временная корректировка для адаптивности!
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
        console.log(`💾 Высота контейнера сохранена: ${height}px`);
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
                console.log(`📏 Высота контейнера восстановлена: ${height}px`);
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
                console.log(`📏 Высота контейнера обновлена: ${currentHeight}px → ${minHeight}px`);
            }
        }
    } else {
        // КРИТИЧЕСКИ ВАЖНО: Если нет блоков со свободным позиционированием, сбрасываем до минимальной высоты
        const pageContent = document.querySelector('.page-content');
        if (pageContent) {
            const minHeight = window.innerHeight;
            pageContent.style.minHeight = minHeight + 'px';
            saveContainerHeight(minHeight);
            console.log(`📏 Высота контейнера сброшена до минимальной: ${minHeight}px`);
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
