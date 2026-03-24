/**
 * Quill Image & Video Resize Module
 * Позволяет изменять размер и позиционировать изображения и видео в Quill редакторе
 */

class ImageResize {
    constructor(quill, options = {}) {
        this.quill = quill;
        this.options = options;
        this.currentElement = null;
        this.resizeContainer = null;
        this.isResizing = false;
        this.isDragging = false;
        
        // Параметры для изменения размера
        this.startX = 0;
        this.startY = 0;
        this.startWidth = 0;
        this.startHeight = 0;
        this.currentHandle = null;
        
        // Параметры для перемещения
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.elementStartX = 0;
        this.elementStartY = 0;
        
        this.init();
    }
    
    init() {
        console.log('🔧 Инициализация Image Resize модуля...');

        // Слушаем клики на изображения и видео
        this.quill.root.addEventListener('click', (e) => {
            console.log('🖱️ Клик в редакторе:', {
                tagName: e.target.tagName,
                className: e.target.className,
                classList: Array.from(e.target.classList || []),
                parentTagName: e.target.parentElement?.tagName,
                parentClassName: e.target.parentElement?.className
            });

            // Проверяем клик на медиа элемент
            let mediaElement = null;

            if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
                mediaElement = e.target;
                console.log('📸 Клик на IMG/VIDEO:', mediaElement.tagName);
            } else if (e.target.tagName === 'IFRAME' && e.target.classList.contains('ql-video')) {
                // Клик на iframe.ql-video
                mediaElement = e.target;
                console.log('📸 Клик на IFRAME.ql-video');
            } else {
                // КРИТИЧЕСКИ ВАЖНО: Клик прошел сквозь iframe (pointer-events: none)
                // Ищем iframe под курсором
                const clickX = e.clientX;
                const clickY = e.clientY;

                console.log('🔍 Клик прошел сквозь элемент, ищем iframe под курсором:', {clickX, clickY});

                // Временно включаем pointer-events для всех iframe
                const iframes = this.quill.root.querySelectorAll('iframe.ql-video');
                iframes.forEach(iframe => {
                    const rect = iframe.getBoundingClientRect();
                    console.log('  📦 Проверяем iframe:', {
                        left: rect.left,
                        top: rect.top,
                        right: rect.right,
                        bottom: rect.bottom,
                        clickX,
                        clickY,
                        inside: clickX >= rect.left && clickX <= rect.right && clickY >= rect.top && clickY <= rect.bottom
                    });

                    if (clickX >= rect.left && clickX <= rect.right &&
                        clickY >= rect.top && clickY <= rect.bottom) {
                        mediaElement = iframe;
                        console.log('✅ Найден iframe под курсором!');
                    }
                });
            }

            if (mediaElement) {
                console.log('✅ Медиа элемент найден:', mediaElement.tagName, mediaElement);
                e.preventDefault();
                e.stopPropagation();
                this.showResizeHandles(mediaElement);
            } else if (!e.target.closest('.resize-container')) {
                console.log('❌ Клик вне медиа элемента, скрываем handles');
                this.hideResizeHandles();
            }
        }, true); // Используем capture phase

        // Скрываем handles при клике вне редактора
        document.addEventListener('click', (e) => {
            if (!this.quill.root.contains(e.target) && !e.target.closest('.resize-container')) {
                this.hideResizeHandles();
            }
        });

        console.log('✅ Quill Image Resize модуль инициализирован');
    }
    
    showResizeHandles(element) {
        console.log('📐 Попытка показать resize handles для:', element.tagName);

        // Скрываем предыдущие handles
        this.hideResizeHandles();

        // Проверяем, что редактор в режиме редактирования
        if (this.quill.isEnabled() === false) {
            console.log('⚠️ Редактор в режиме readOnly, handles не показываются');
            return;
        }

        console.log('✅ Редактор в режиме редактирования, показываем handles');

        this.currentElement = element;

        console.log('✅ Текущий элемент установлен:', element.tagName, element.className);
        
        // Создаем контейнер для resize handles
        this.resizeContainer = document.createElement('div');
        this.resizeContainer.className = 'resize-container active';

        // Позиционируем контейнер относительно родительского элемента
        const rect = element.getBoundingClientRect();
        const containerRect = this.quill.root.parentElement.getBoundingClientRect();

        this.resizeContainer.style.position = 'absolute';
        this.resizeContainer.style.left = (rect.left - containerRect.left) + 'px';
        this.resizeContainer.style.top = (rect.top - containerRect.top) + 'px';
        this.resizeContainer.style.width = rect.width + 'px';
        this.resizeContainer.style.height = rect.height + 'px';
        this.resizeContainer.style.zIndex = '1999';

        console.log('📦 Создан resize container:', {
            left: this.resizeContainer.style.left,
            top: this.resizeContainer.style.top,
            width: this.resizeContainer.style.width,
            height: this.resizeContainer.style.height
        });
        
        // Создаем 8 resize handles
        const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
        handles.forEach(position => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-handle-${position}`;
            handle.dataset.position = position;
            this.resizeContainer.appendChild(handle);
        });
        
        // Добавляем кнопки управления
        this.addControlButtons();

        // КРИТИЧЕСКИ ВАЖНО: Добавляем контейнер НЕ в quill.root, а в родительский контейнер
        // чтобы избежать конфликта с внутренней структурой Quill
        const editorContainer = this.quill.root.parentElement;
        if (editorContainer) {
            editorContainer.appendChild(this.resizeContainer);
            console.log('✅ Resize container добавлен в:', editorContainer.className);
        } else {
            console.error('❌ Не найден родительский контейнер для resize handles');
            return;
        }

        // Добавляем обработчики событий
        this.resizeContainer.addEventListener('mousedown', this.handleMouseDown.bind(this));

        console.log('📐 Показаны resize handles для', element.tagName);
    }
    
    addControlButtons() {
        const toolbar = document.createElement('div');
        toolbar.className = 'media-resize-toolbar';
        
        // Кнопки выравнивания
        const alignments = [
            { name: 'left', icon: '⬅️', title: 'Выровнять влево' },
            { name: 'center', icon: '↔️', title: 'Выровнять по центру' },
            { name: 'right', icon: '➡️', title: 'Выровнять вправо' }
        ];
        
        alignments.forEach(align => {
            const btn = document.createElement('button');
            btn.className = 'media-align-btn';
            btn.innerHTML = align.icon;
            btn.title = align.title;
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.setAlignment(align.name);
            };
            toolbar.appendChild(btn);
        });
        
        this.resizeContainer.appendChild(toolbar);
    }
    
    setAlignment(alignment) {
        if (!this.currentElement) return;

        // Удаляем предыдущие классы выравнивания
        this.currentElement.classList.remove('align-left', 'align-center', 'align-right');

        // Добавляем новый класс
        this.currentElement.classList.add(`align-${alignment}`);

        console.log(`📍 Выравнивание установлено: ${alignment} для`, this.currentElement.tagName);

        // Обновляем позицию контейнера после изменения выравнивания
        setTimeout(() => {
            this.updateContainerPosition();
        }, 50);
    }
    
    handleMouseDown(e) {
        if (e.target.classList.contains('resize-handle')) {
            this.startResize(e);
        } else if (e.target === this.resizeContainer || e.target.closest('.resize-container')) {
            this.startDrag(e);
        }
    }
    
    startResize(e) {
        e.preventDefault();
        e.stopPropagation();

        this.isResizing = true;
        this.currentHandle = e.target.dataset.position;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.startWidth = this.currentElement.offsetWidth;
        this.startHeight = this.currentElement.offsetHeight;

        // Сохраняем bound функции для правильного удаления слушателей
        this.boundHandleResize = this.handleResize.bind(this);
        this.boundStopResize = this.stopResize.bind(this);

        document.addEventListener('mousemove', this.boundHandleResize);
        document.addEventListener('mouseup', this.boundStopResize);

        console.log('🔧 Начато изменение размера:', {
            handle: this.currentHandle,
            startWidth: this.startWidth,
            startHeight: this.startHeight
        });
    }
    
    handleResize(e) {
        if (!this.isResizing) return;

        e.preventDefault();

        const deltaX = e.clientX - this.startX;
        const deltaY = e.clientY - this.startY;

        let newWidth = this.startWidth;
        let newHeight = this.startHeight;

        // Вычисляем новые размеры в зависимости от handle
        switch (this.currentHandle) {
            case 'e':
            case 'w':
                newWidth = this.currentHandle === 'e' ?
                    this.startWidth + deltaX :
                    this.startWidth - deltaX;
                break;
            case 'n':
            case 's':
                newHeight = this.currentHandle === 's' ?
                    this.startHeight + deltaY :
                    this.startHeight - deltaY;
                break;
            case 'ne':
                newWidth = this.startWidth + deltaX;
                newHeight = this.startHeight - deltaY;
                break;
            case 'nw':
                newWidth = this.startWidth - deltaX;
                newHeight = this.startHeight - deltaY;
                break;
            case 'se':
                newWidth = this.startWidth + deltaX;
                newHeight = this.startHeight + deltaY;
                break;
            case 'sw':
                newWidth = this.startWidth - deltaX;
                newHeight = this.startHeight + deltaY;
                break;
        }

        // Минимальные размеры
        newWidth = Math.max(50, newWidth);
        newHeight = Math.max(50, newHeight);

        // Применяем новые размеры
        this.currentElement.style.width = newWidth + 'px';

        // Для видео и iframe также устанавливаем высоту
        if (this.currentElement.tagName === 'VIDEO' || this.currentElement.tagName === 'IFRAME') {
            this.currentElement.style.height = newHeight + 'px';
            console.log('📏 Установлены размеры для', this.currentElement.tagName, ':', {
                width: newWidth + 'px',
                height: newHeight + 'px',
                actualWidth: this.currentElement.offsetWidth,
                actualHeight: this.currentElement.offsetHeight
            });
        } else {
            this.currentElement.style.height = 'auto';
        }

        // Обновляем позицию контейнера
        this.updateContainerPosition();
    }
    
    stopResize() {
        this.isResizing = false;

        // Удаляем слушатели используя сохраненные bound функции
        if (this.boundHandleResize) {
            document.removeEventListener('mousemove', this.boundHandleResize);
        }
        if (this.boundStopResize) {
            document.removeEventListener('mouseup', this.boundStopResize);
        }

        console.log('✅ Изменение размера завершено:', {
            finalWidth: this.currentElement.offsetWidth,
            finalHeight: this.currentElement.offsetHeight
        });
    }
    
    startDrag(e) {
        // Перемещение пока отключено, так как в Quill это сложнее реализовать
        // Можно использовать выравнивание вместо свободного позиционирования
    }
    
    updateContainerPosition() {
        if (!this.resizeContainer || !this.currentElement) return;

        const rect = this.currentElement.getBoundingClientRect();
        const containerRect = this.quill.root.parentElement.getBoundingClientRect();

        // Вычисляем позицию относительно родительского контейнера
        this.resizeContainer.style.left = (rect.left - containerRect.left) + 'px';
        this.resizeContainer.style.top = (rect.top - containerRect.top) + 'px';
        this.resizeContainer.style.width = rect.width + 'px';
        this.resizeContainer.style.height = rect.height + 'px';

        console.log('📍 Позиция контейнера обновлена:', {
            left: this.resizeContainer.style.left,
            top: this.resizeContainer.style.top,
            width: this.resizeContainer.style.width,
            height: this.resizeContainer.style.height
        });
    }
    
    hideResizeHandles() {
        if (this.resizeContainer) {
            this.resizeContainer.remove();
            this.resizeContainer = null;
        }
        this.currentElement = null;
        console.log('🔒 Resize handles скрыты');
    }
}

// Регистрируем модуль в Quill
if (window.Quill) {
    window.Quill.register('modules/imageResize', ImageResize);
    console.log('✅ Quill ImageResize модуль зарегистрирован');
}

