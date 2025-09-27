/**
 * Режим редактирования для сайта "Пирамида ТОТА"
 * Позволяет администраторам редактировать контент страниц в реальном времени
 */

class EditMode {
    constructor() {
        this.isEditMode = false;
        this.editableElements = new Map();
        this.currentPageId = this.getPageId();
        this.apiBaseUrl = window.location.origin;
        this.token = localStorage.getItem('authToken');
        this.unsavedChanges = new Map();
        this.authCheckInterval = null;

        this.init();
    }

    async init() {
        console.log('Инициализация режима редактирования');
        this.setupEditButton();
        await this.loadExistingContent();
        await this.loadSavedFormatting();
        this.setupKeyboardShortcuts();
        this.startAuthMonitoring();
    }

    // Получение ID текущей страницы
    getPageId() {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') {
            return 'home';
        }
        
        const fileName = path.split('/').pop();
        return fileName.replace('.html', '');
    }

    // Настройка кнопки редактирования
    setupEditButton() {
        // Используем делегирование событий для плавающей кнопки
        document.addEventListener('click', (e) => {
            if (false) { // Плавающая кнопка удалена
                e.preventDefault();
                this.toggleEditMode();
            }
        });

        console.log('Обработчик плавающей кнопки редактирования настроен');
    }



    // Переключение режима редактирования
    toggleEditMode() {
        // Проверяем авторизацию перед переключением
        if (!this.checkAuthBeforeAction()) {
            return;
        }

        this.isEditMode = !this.isEditMode;

        // Плавающая кнопка удалена
        const floatingBtn = null;
        if (floatingBtn) {
            if (this.isEditMode) {
                floatingBtn.innerHTML = '❌ Выйти';
                floatingBtn.classList.add('edit-mode-active');
                floatingBtn.title = 'Выйти из режима редактирования';
                this.enableEditMode();
            } else {
                floatingBtn.innerHTML = '✏️ Редактировать';
                floatingBtn.classList.remove('edit-mode-active');
                floatingBtn.title = 'Включить режим редактирования';
                this.disableEditMode();
            }
        }
    }

    // Включение режима редактирования
    enableEditMode() {
        console.log('Включение режима редактирования');

        // Проверяем авторизацию перед включением
        if (!this.checkAuthBeforeAction()) {
            return;
        }

        // Запускаем мониторинг авторизации
        this.startAuthMonitoring();

        // Добавляем класс к body для стилизации
        document.body.classList.add('edit-mode');

        // Делаем элементы редактируемыми
        this.makeElementsEditable();

        // Показываем панель инструментов
        this.showEditToolbar();

        // Показываем подсказку для новых пользователей
        this.showEditModeHelp();

        // Показываем уведомление
        this.showNotification('Режим редактирования включен. Наведите курсор на элементы для управления.', 'info');
    }

    // Выключение режима редактирования
    async disableEditMode() {
        console.log('Выключение режима редактирования');

        // Останавливаем мониторинг авторизации
        this.stopAuthMonitoring();

        // Убираем класс с body
        document.body.classList.remove('edit-mode');

        // Убираем редактируемость с элементов
        this.makeElementsNonEditable();

        // Скрываем панель инструментов
        this.hideEditToolbar();

        // АВТОМАТИЧЕСКИ СОХРАНЯЕМ ВСЕ ИЗМЕНЕНИЯ
        if (this.unsavedChanges.size > 0) {
            const shouldSave = confirm('У вас есть несохраненные изменения. Сохранить их?');
            if (shouldSave) {
                await this.saveAllChanges();
            } else {
                this.discardAllChanges();
            }
        }
    }

    // Отмена всех изменений
    discardAllChanges() {
        this.unsavedChanges.clear();
        this.updateToolbarStatus();
        this.showNotification('Изменения отменены', 'info');
        // Перезагружаем страницу для восстановления исходного состояния
        window.location.reload();
    }

    // Делаем элементы редактируемыми
    makeElementsEditable() {
        // Ищем элементы с data-edit-id атрибутами
        const elementsWithEditId = document.querySelectorAll('[data-edit-id]');
        elementsWithEditId.forEach(element => {
            const elementId = element.getAttribute('data-edit-id');
            this.makeElementEditable(element, elementId);
        });

        // Дополнительно ищем элементы без data-edit-id
        const additionalSelectors = [
            'h1:not([data-edit-id])', 'h2:not([data-edit-id])', 'h3:not([data-edit-id])',
            'h4:not([data-edit-id])', 'h5:not([data-edit-id])', 'h6:not([data-edit-id])',
            'p:not([data-edit-id])', '.page-content p:not([data-edit-id])'
        ];

        additionalSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((element, index) => {
                // Пропускаем элементы в навигации, модальных окнах, подвале и логотипе
                if (element.closest('.navbar') ||
                    element.closest('.modal') ||
                    element.closest('.site-footer') ||
                    element.closest('.site-logo')) {
                    return;
                }
                this.makeElementEditable(element, `${selector.replace(/[^a-zA-Z0-9]/g, '-')}-${index}`);
            });
        });
    }

    // Делаем конкретный элемент редактируемым
    makeElementEditable(element, elementId) {
        // Пропускаем элементы навигации верхнего меню и служебные элементы
        if (element.closest('.navbar .nav-menu') ||
            element.closest('.modal') ||
            element.closest('.site-footer') ||
            element.closest('.site-logo') ||
            (element.classList.contains('nav-link') && !element.classList.contains('menu-link')) ||
            element.tagName === 'BUTTON') {
            return;
        }

        element.setAttribute('data-edit-id', elementId);
        element.classList.add('editable-element');

        // Добавляем контейнер для кнопок управления
        this.addElementControls(element);

        // Включаем drag-and-drop
        this.enableDragAndDrop(element);

        // Добавляем обработчики событий
        element.addEventListener('click', (e) => {
            if (this.isEditMode) {
                e.preventDefault();
                e.stopPropagation();
                this.selectElement(element);
            }
        });

        // Добавляем поддержку touch событий для мобильных устройств
        element.addEventListener('touchstart', (e) => {
            if (this.isEditMode) {
                e.preventDefault();
                this.selectElement(element);
            }
        });

        // Добавляем hover эффект
        element.addEventListener('mouseenter', () => {
            if (this.isEditMode) {
                element.classList.add('edit-hover');
                this.showElementControls(element);
            }
        });

        element.addEventListener('mouseleave', () => {
            element.classList.remove('edit-hover');
            if (!element.classList.contains('editing')) {
                this.hideElementControls(element);
            }
        });

        this.editableElements.set(elementId, element);
    }

    // Убираем редактируемость с элементов
    makeElementsNonEditable() {
        this.editableElements.forEach((element, elementId) => {
            element.classList.remove('editable-element', 'edit-hover', 'editing');
            element.removeAttribute('contenteditable');
        });
    }

    // Начало редактирования элемента
    startEditing(element) {
        // Убираем редактирование с других элементов
        this.editableElements.forEach(el => {
            el.classList.remove('editing');
            el.removeAttribute('contenteditable');
        });

        // Включаем редактирование для текущего элемента
        element.classList.add('editing');

        // Для ссылок редактируем только текстовое содержимое
        if (element.tagName === 'A') {
            // Создаем временный span для редактирования текста
            const textContent = element.textContent.trim();
            const tempSpan = document.createElement('span');
            tempSpan.textContent = textContent;
            tempSpan.setAttribute('contenteditable', 'true');
            tempSpan.style.display = 'inline';

            // Заменяем содержимое ссылки на редактируемый span
            const originalHTML = element.innerHTML;
            element.innerHTML = '';
            element.appendChild(tempSpan);
            tempSpan.focus();

            // Обработчик завершения редактирования ссылки
            tempSpan.addEventListener('blur', () => {
                const newText = tempSpan.textContent.trim();
                // Восстанавливаем оригинальную структуру с новым текстом
                const iconMatch = originalHTML.match(/<span class="menu-icon">[^<]*<\/span>/);
                const icon = iconMatch ? iconMatch[0] : '';
                element.innerHTML = icon + (icon ? '\n                                        ' : '') + newText;
                element.classList.remove('editing');

                // Сохраняем изменения
                const elementId = element.getAttribute('data-edit-id');
                this.unsavedChanges.set(elementId, {
                    original: originalHTML,
                    current: element.innerHTML,
                    element: element
                });
                this.updateToolbarStatus();
            });

            return;
        }

        // Для обычных элементов
        element.setAttribute('contenteditable', 'true');
        element.focus();

        // Сохраняем оригинальный контент
        const elementId = element.getAttribute('data-edit-id');
        if (!this.unsavedChanges.has(elementId)) {
            this.unsavedChanges.set(elementId, {
                original: element.innerHTML,
                current: element.innerHTML,
                element: element
            });
        }

        // Обработчик изменений
        const inputHandler = () => {
            const change = this.unsavedChanges.get(elementId);
            if (change) {
                change.current = element.innerHTML;
                this.updateToolbarStatus();
            }
        };

        element.addEventListener('input', inputHandler);

        // Обработчик завершения редактирования
        element.addEventListener('blur', () => {
            element.classList.remove('editing');
            element.removeAttribute('contenteditable');
            element.removeEventListener('input', inputHandler);
        });
    }

    // Показать панель инструментов
    showEditToolbar() {
        if (document.getElementById('editToolbar')) return;

        const toolbar = document.createElement('div');
        toolbar.id = 'editToolbar';
        toolbar.className = 'edit-toolbar';
        toolbar.innerHTML = `
            <div class="toolbar-content">
                <div class="toolbar-section">
                    <button class="toolbar-btn primary" id="saveChangesBtn" title="Сохранить все изменения (Ctrl+S)">
                        💾 Сохранить
                    </button>
                    <button class="toolbar-btn secondary" id="discardChangesBtn" title="Отменить все несохраненные изменения">
                        ❌ Отменить
                    </button>
                </div>

                <div class="toolbar-section">
                    <button class="toolbar-btn danger" id="deleteElementBtn" title="Удалить выбранный элемент (Delete)">
                        🗑️ Удалить
                    </button>
                    <button class="toolbar-btn" id="helpBtn" title="Показать справку">
                        ❓ Справка
                    </button>
                </div>
                <div class="toolbar-status">
                    <div class="status-item">
                        <span class="status-label">Изменений:</span>
                        <span class="status-value" id="changesCount">0</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Элементов:</span>
                        <span class="status-value" id="elementsCount">0</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(toolbar);

        // Обработчики событий для кнопок
        document.getElementById('saveChangesBtn').addEventListener('click', () => this.saveAllChanges());
        document.getElementById('discardChangesBtn').addEventListener('click', () => this.discardAllChanges());

        document.getElementById('deleteElementBtn').addEventListener('click', () => this.deleteSelectedElement());
        document.getElementById('helpBtn').addEventListener('click', () => this.showEditModeHelp());

        this.updateToolbarStatus();
    }

    // Скрыть панель инструментов
    hideEditToolbar() {
        const toolbar = document.getElementById('editToolbar');
        if (toolbar) {
            toolbar.remove();
        }
    }

    // Обновление статуса панели инструментов
    updateToolbarStatus() {
        const changesCount = document.getElementById('changesCount');
        const elementsCount = document.getElementById('elementsCount');
        const saveBtn = document.getElementById('saveChangesBtn');
        const discardBtn = document.getElementById('discardChangesBtn');

        if (changesCount) {
            changesCount.textContent = this.unsavedChanges.size;
            changesCount.className = this.unsavedChanges.size > 0 ? 'status-value changed' : 'status-value';
        }

        if (elementsCount) {
            elementsCount.textContent = this.editableElements.size;
        }

        // Обновляем состояние кнопок
        if (saveBtn && discardBtn) {
            const hasChanges = this.unsavedChanges.size > 0;
            saveBtn.disabled = !hasChanges;
            discardBtn.disabled = !hasChanges;

            if (hasChanges) {
                saveBtn.classList.add('has-changes');
                discardBtn.classList.add('has-changes');
            } else {
                saveBtn.classList.remove('has-changes');
                discardBtn.classList.remove('has-changes');
            }
        }
    }

    // Сохранение всех изменений
    async saveAllChanges() {
        // Проверяем авторизацию перед сохранением
        if (!this.checkAuthBeforeAction()) {
            return;
        }

        if (this.unsavedChanges.size === 0) {
            this.showNotification('Нет изменений для сохранения', 'info');
            return;
        }

        try {
            const changes = Array.from(this.unsavedChanges.entries()).map(([elementId, change]) => ({
                page_id: this.currentPageId,
                element_id: elementId,
                element_type: change.element.tagName.toLowerCase(),
                content: change.current,
                selector: this.getElementSelector(change.element)
            }));

            // Сохраняем контент
            const response = await fetch(`${this.apiBaseUrl}/api/content/batch-save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ changes })
            });

            if (response.ok) {
                // Также сохраняем форматирование для всех измененных элементов
                await this.saveAllFormatting();

                this.unsavedChanges.clear();
                this.updateToolbarStatus();
                this.showNotification('Изменения успешно сохранены!', 'success');
            } else {
                throw new Error('Ошибка сохранения');
            }
        } catch (error) {
            console.error('Ошибка сохранения изменений:', error);
            this.showNotification('Ошибка сохранения изменений', 'error');
        }
    }

    // Сохранение форматирования для всех элементов
    async saveAllFormatting() {
        const formattingPromises = [];

        this.unsavedChanges.forEach((change, elementId) => {
            const element = change.element;
            const formatting = this.extractFormattingFromElement(element);

            if (Object.keys(formatting).length > 0) {
                const promise = this.saveElementFormatting(elementId, formatting);
                formattingPromises.push(promise);
            }
        });

        if (formattingPromises.length > 0) {
            await Promise.all(formattingPromises);
            console.log('Форматирование сохранено для всех элементов');
        }
    }

    // Извлечение форматирования из элемента
    extractFormattingFromElement(element) {
        const formatting = {};
        const classList = Array.from(element.classList);

        // Извлекаем CSS классы форматирования
        classList.forEach(cls => {
            if (cls.startsWith('font-size-')) {
                formatting.fontSize = cls.replace('font-size-', '');
            } else if (cls.startsWith('text-color-')) {
                formatting.textColor = cls.replace('text-color-', '');
            } else if (cls.startsWith('text-align-')) {
                formatting.textAlign = cls.replace('text-align-', '');
            } else if (cls.startsWith('font-weight-')) {
                formatting.fontWeight = cls.replace('font-weight-', '');
            } else if (cls.startsWith('font-style-')) {
                formatting.fontStyle = cls.replace('font-style-', '');
            }
        });

        return formatting;
    }

    // Сохранение форматирования конкретного элемента
    async saveElementFormatting(elementId, formatting) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/formatting/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    page_id: this.currentPageId,
                    element_id: elementId,
                    formatting: formatting
                })
            });

            if (!response.ok) {
                throw new Error('Ошибка сохранения форматирования');
            }

            console.log(`Форматирование сохранено для ${elementId}:`, formatting);
        } catch (error) {
            console.error(`Ошибка сохранения форматирования для ${elementId}:`, error);
        }
    }

    // Загрузка сохраненного форматирования
    async loadSavedFormatting() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/formatting/load?page_id=${this.currentPageId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.formatting) {
                    this.applyLoadedFormatting(data.formatting);
                    console.log('Форматирование загружено:', data.formatting);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки форматирования:', error);
        }
    }

    // Применение загруженного форматирования
    applyLoadedFormatting(formattingData) {
        formattingData.forEach(item => {
            const element = document.querySelector(`[data-edit-id="${item.element_id}"]`);
            if (element && item.formatting) {
                // Применяем CSS классы форматирования
                Object.entries(item.formatting).forEach(([property, value]) => {
                    const className = `${property.replace(/([A-Z])/g, '-$1').toLowerCase()}-${value}`;
                    element.classList.add(className);
                });

                console.log(`Форматирование применено к ${item.element_id}:`, item.formatting);
            }
        });
    }

    // Отмена всех изменений
    discardAllChanges() {
        if (this.unsavedChanges.size === 0) return;

        if (confirm('Отменить все несохраненные изменения?')) {
            this.unsavedChanges.forEach((change, elementId) => {
                change.element.innerHTML = change.original;
            });
            
            this.unsavedChanges.clear();
            this.updateToolbarStatus();
            this.showNotification('Изменения отменены', 'info');
        }
    }

    // Получение селектора элемента
    getElementSelector(element) {
        if (element.id) {
            return `#${element.id}`;
        }
        
        const classes = Array.from(element.classList).filter(cls => 
            !cls.startsWith('editable-') && !cls.startsWith('edit-')
        );
        
        if (classes.length > 0) {
            return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
        }
        
        return element.tagName.toLowerCase();
    }

    // Загрузка существующего контента
    async loadExistingContent() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/content/${this.currentPageId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Контент и удаленные элементы уже применены на сервере через middleware
                    console.log('Существующий контент загружен (применен на сервере)');

                    // Удаленные элементы уже обработаны на сервере, клиентская обработка не нужна
                    if (data.data.deleted_elements && data.data.deleted_elements.length > 0) {
                        console.log('Удаленные элементы обработаны на сервере:', data.data.deleted_elements);
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки контента:', error);
        }
    }

    // Показать уведомление
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `edit-notification edit-notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Показать подсказку по режиму редактирования
    showEditModeHelp() {
        // Проверяем, показывали ли уже подсказку
        if (localStorage.getItem('editModeHelpShown') === 'true') {
            return;
        }

        const helpModal = document.createElement('div');
        helpModal.className = 'edit-help-modal';
        helpModal.innerHTML = `
            <div class="help-content">
                <div class="help-header">
                    <h3>🎯 Режим редактирования активен!</h3>
                    <button class="close-help">&times;</button>
                </div>
                <div class="help-body">
                    <div class="help-section">
                        <h4>🖱️ Управление элементами:</h4>
                        <ul>
                            <li><strong>Клик</strong> - выбрать элемент</li>
                            <li><strong>✏️</strong> - редактировать текст</li>
                            <li><strong>⬆️⬇️</strong> - перемещать вверх/вниз</li>
                            <li><strong>🗑️</strong> - удалить элемент</li>
                            <li><strong>Перетаскивание</strong> - изменить порядок</li>
                        </ul>
                    </div>
                    <div class="help-section">
                        <h4>⌨️ Горячие клавиши:</h4>
                        <ul>
                            <li><strong>Ctrl+S</strong> - сохранить изменения</li>
                            <li><strong>Escape</strong> - выйти из режима</li>
                        </ul>
                    </div>
                    <div class="help-section">
                        <h4>🛠️ Панель инструментов:</h4>
                        <p>Используйте кнопки внизу экрана для добавления новых элементов и управления изменениями.</p>
                    </div>
                </div>
                <div class="help-footer">
                    <label>
                        <input type="checkbox" id="dontShowAgain"> Больше не показывать
                    </label>
                    <button class="help-ok-btn">Понятно!</button>
                </div>
            </div>
        `;

        document.body.appendChild(helpModal);

        // Обработчики событий
        helpModal.querySelector('.close-help').addEventListener('click', () => {
            this.closeHelpModal(helpModal);
        });

        helpModal.querySelector('.help-ok-btn').addEventListener('click', () => {
            this.closeHelpModal(helpModal);
        });

        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                this.closeHelpModal(helpModal);
            }
        });
    }

    // Закрыть модальное окно помощи
    closeHelpModal(modal) {
        const dontShowAgain = modal.querySelector('#dontShowAgain').checked;
        if (dontShowAgain) {
            localStorage.setItem('editModeHelpShown', 'true');
        }
        modal.remove();
    }

    // Показать контекстную подсказку
    showContextualTip(element, message, duration = 3000) {
        const tip = document.createElement('div');
        tip.className = 'contextual-tip';
        tip.textContent = message;

        const rect = element.getBoundingClientRect();
        tip.style.position = 'fixed';
        tip.style.top = (rect.top - 40) + 'px';
        tip.style.left = rect.left + 'px';
        tip.style.zIndex = '10003';

        document.body.appendChild(tip);

        setTimeout(() => {
            tip.classList.add('show');
        }, 100);

        setTimeout(() => {
            tip.classList.remove('show');
            setTimeout(() => tip.remove(), 300);
        }, duration);
    }

    // Настройка горячих клавиш
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!this.isEditMode) return;

            // Ctrl+S для сохранения
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveAllChanges();
            }

            // Escape для выхода из режима редактирования
            if (e.key === 'Escape') {
                this.toggleEditMode();
            }

            // Delete для удаления выбранного элемента
            if (e.key === 'Delete') {
                const selectedElement = document.querySelector('.editable-element.selected');
                if (selectedElement) {
                    e.preventDefault();
                    this.deleteElement(selectedElement);
                }
            }

            // Стрелки для перемещения элементов
            if (e.ctrlKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                const selectedElement = document.querySelector('.editable-element.selected');
                if (selectedElement) {
                    e.preventDefault();
                    if (e.key === 'ArrowUp') {
                        this.moveElementUp(selectedElement);
                    } else {
                        this.moveElementDown(selectedElement);
                    }
                }
            }
        });
    }

    // Предложение сохранить изменения
    promptSaveChanges() {
        if (this.unsavedChanges.size > 0) {
            const save = confirm('У вас есть несохраненные изменения. Сохранить их?');
            if (save) {
                this.saveAllChanges();
            } else {
                this.discardAllChanges();
            }
        }
    }









    // Удаление выбранного элемента
    deleteSelectedElement() {
        const selectedElement = document.querySelector('.editable-element.editing');
        if (!selectedElement) {
            this.showNotification('Выберите элемент для удаления', 'info');
            return;
        }

        const elementId = selectedElement.getAttribute('data-edit-id');
        if (confirm('Удалить выбранный элемент?')) {
            // Удаляем из DOM
            selectedElement.remove();

            // Удаляем из несохраненных изменений
            this.unsavedChanges.delete(elementId);

            // Удаляем из карты редактируемых элементов
            this.editableElements.delete(elementId);

            // Отправляем запрос на сервер для удаления из БД
            this.deleteElementFromServer(elementId);

            this.updateToolbarStatus();
            this.showNotification('Элемент удален', 'success');
        }
    }

    // Удаление элемента с сервера
    async deleteElementFromServer(elementId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/content/${this.currentPageId}/${elementId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                console.error('Ошибка удаления элемента с сервера');
            }
        } catch (error) {
            console.error('Ошибка удаления элемента с сервера:', error);
        }
    }

    // Получение текущего выбранного элемента
    getSelectedElement() {
        return document.querySelector('.editable-element.editing');
    }

    // Добавление кнопок управления элементом
    addElementControls(element) {
        if (element.querySelector('.element-controls')) return;

        const controls = document.createElement('div');
        controls.className = 'element-controls';
        controls.innerHTML = `
            <button class="control-btn edit-btn" title="Редактировать">✏️</button>
            <button class="control-btn move-up-btn" title="Переместить вверх">⬆️</button>
            <button class="control-btn move-down-btn" title="Переместить вниз">⬇️</button>
            <button class="control-btn delete-btn" title="Удалить">🗑️</button>
        `;

        // Позиционируем контролы
        element.style.position = 'relative';
        element.appendChild(controls);

        // Добавляем обработчики событий
        controls.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.startEditing(element);
        });

        controls.querySelector('.move-up-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.moveElementUp(element);
        });

        controls.querySelector('.move-down-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.moveElementDown(element);
        });

        controls.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteElement(element);
        });
    }

    // Показать кнопки управления
    showElementControls(element) {
        const controls = element.querySelector('.element-controls');
        if (controls) {
            controls.style.display = 'flex';
        }
    }

    // Скрыть кнопки управления
    hideElementControls(element) {
        const controls = element.querySelector('.element-controls');
        if (controls) {
            controls.style.display = 'none';
        }
    }

    // Выделение элемента для редактирования
    selectElement(element) {
        // Убираем выделение с других элементов
        this.editableElements.forEach(el => {
            el.classList.remove('editing', 'selected');
            el.removeAttribute('contenteditable');
            this.hideElementControls(el);
        });

        // Выделяем текущий элемент
        element.classList.add('selected');
        this.showElementControls(element);

        // Обновляем статус панели инструментов
        this.updateToolbarStatus();
    }

    // Удаление элемента
    deleteElement(element) {
        // Проверяем авторизацию
        if (!this.checkAuthBeforeAction()) {
            return;
        }

        const elementId = element.getAttribute('data-edit-id');
        const elementType = this.getElementType(element);

        if (confirm(`Удалить ${elementType}?`)) {
            // Удаляем из DOM
            element.remove();

            // Удаляем из несохраненных изменений
            this.unsavedChanges.delete(elementId);

            // Удаляем из карты редактируемых элементов
            this.editableElements.delete(elementId);

            // Отправляем запрос на сервер для удаления из БД
            this.deleteElementFromServer(elementId);

            this.updateToolbarStatus();
            this.showNotification(`${elementType} удален`, 'success');
        }
    }

    // Получение типа элемента для отображения
    getElementType(element) {
        const tagName = element.tagName.toLowerCase();
        switch (tagName) {
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6':
                return 'заголовок';
            case 'p':
                return 'параграф';
            case 'ul':
            case 'ol':
                return 'список';
            case 'img':
                return 'изображение';
            case 'div':
                if (element.classList.contains('editable-image-container')) {
                    return 'изображение';
                }
                return 'блок';
            default:
                return 'элемент';
        }
    }

    // Перемещение элемента вверх
    moveElementUp(element) {
        const container = element.parentNode;
        const allElements = Array.from(container.children).filter(el => this.isEditableElement(el));
        const currentIndex = allElements.indexOf(element);

        if (currentIndex > 0) {
            const previousElement = allElements[currentIndex - 1];
            container.insertBefore(element, previousElement);
            this.markElementAsChanged(element);
            this.markElementAsChanged(previousElement);
            this.showNotification('Элемент перемещен вверх', 'success');
        } else {
            this.showNotification('Элемент уже в начале', 'info');
        }
    }

    // Перемещение элемента вниз
    moveElementDown(element) {
        const container = element.parentNode;
        const allElements = Array.from(container.children).filter(el => this.isEditableElement(el));
        const currentIndex = allElements.indexOf(element);

        if (currentIndex < allElements.length - 1) {
            const nextElement = allElements[currentIndex + 1];
            container.insertBefore(nextElement, element);
            this.markElementAsChanged(element);
            this.markElementAsChanged(nextElement);
            this.showNotification('Элемент перемещен вниз', 'success');
        } else {
            this.showNotification('Элемент уже в конце', 'info');
        }
    }

    // Добавление drag-and-drop функциональности
    enableDragAndDrop(element) {
        element.draggable = true;

        element.addEventListener('dragstart', (e) => {
            if (!this.isEditMode) return;

            element.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', element.outerHTML);
            this.draggedElement = element;
        });

        element.addEventListener('dragend', (e) => {
            element.classList.remove('dragging');
            this.draggedElement = null;

            // Убираем все индикаторы drop-zone
            document.querySelectorAll('.drop-zone-active').forEach(el => {
                el.classList.remove('drop-zone-active');
            });
        });

        element.addEventListener('dragover', (e) => {
            if (!this.isEditMode || !this.draggedElement || this.draggedElement === element) return;

            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const rect = element.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;

            if (e.clientY < midY) {
                element.classList.add('drop-zone-before');
                element.classList.remove('drop-zone-after');
            } else {
                element.classList.add('drop-zone-after');
                element.classList.remove('drop-zone-before');
            }
        });

        element.addEventListener('dragleave', (e) => {
            element.classList.remove('drop-zone-before', 'drop-zone-after');
        });

        element.addEventListener('drop', (e) => {
            if (!this.isEditMode || !this.draggedElement || this.draggedElement === element) return;

            e.preventDefault();

            const rect = element.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;

            if (e.clientY < midY) {
                element.parentNode.insertBefore(this.draggedElement, element);
            } else {
                element.parentNode.insertBefore(this.draggedElement, element.nextSibling);
            }

            this.markElementAsChanged(this.draggedElement);
            this.markElementAsChanged(element);

            element.classList.remove('drop-zone-before', 'drop-zone-after');
            this.showNotification('Элемент перемещен', 'success');
        });
    }

    // Проверка, является ли элемент редактируемым
    isEditableElement(element) {
        return element && element.classList && element.classList.contains('editable-element');
    }

    // Отметить элемент как измененный
    markElementAsChanged(element) {
        const elementId = element.getAttribute('data-edit-id');
        if (!this.unsavedChanges.has(elementId)) {
            this.unsavedChanges.set(elementId, {
                original: element.outerHTML,
                current: element.outerHTML,
                element: element
            });
        } else {
            const change = this.unsavedChanges.get(elementId);
            change.current = element.outerHTML;
        }
        this.updateToolbarStatus();
    }

    // Запуск мониторинга авторизации
    startAuthMonitoring() {
        // Проверяем авторизацию каждые 5 секунд
        this.authCheckInterval = setInterval(() => {
            this.checkAuthStatus();
        }, 5000);

        // Также слушаем события изменения localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'authToken' || e.key === 'user') {
                this.handleAuthChange();
            }
        });

        // Слушаем кастомные события выхода
        document.addEventListener('userLoggedOut', () => {
            this.handleLogout();
        });
    }

    // Остановка мониторинга авторизации
    stopAuthMonitoring() {
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
            this.authCheckInterval = null;
        }
    }

    // Проверка статуса авторизации
    async checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');

        // Если нет токена или данных пользователя
        if (!token || !userStr) {
            if (this.isEditMode) {
                console.log('Токен или данные пользователя отсутствуют - отключаем режим редактирования');
                this.handleLogout();
            }
            return;
        }

        try {
            const user = JSON.parse(userStr);

            // Если пользователь не администратор
            if (user.role !== 'admin') {
                if (this.isEditMode) {
                    console.log('Пользователь не администратор - отключаем режим редактирования');
                    this.handleLogout();
                }
                return;
            }

            // Проверяем валидность токена на сервере (опционально)
            // Можно добавить проверку через API, если нужно

        } catch (error) {
            console.error('Ошибка парсинга данных пользователя:', error);
            if (this.isEditMode) {
                this.handleLogout();
            }
        }
    }

    // Обработка изменения авторизации
    handleAuthChange() {
        console.log('Изменение авторизации обнаружено');
        this.checkAuthStatus();
    }

    // Обработка выхода из системы
    handleLogout() {
        console.log('Обработка выхода из системы - принудительное отключение режима редактирования');

        if (this.isEditMode) {
            // Отключаем режим редактирования без сохранения
            this.isEditMode = false;
            this.disableEditMode();



            // Показываем уведомление
            this.showNotification('Режим редактирования отключен: требуется авторизация администратора', 'warning');

            // Перезагружаем страницу через небольшую задержку
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    }

    // Проверка прав администратора
    isUserAdmin() {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                console.log('Нет данных пользователя в localStorage');
                return false;
            }

            const user = JSON.parse(userStr);
            console.log('Проверка прав пользователя:', user);
            return user && user.role === 'admin';
        } catch (error) {
            console.error('Ошибка проверки прав администратора:', error);
            return false;
        }
    }

    // Проверка авторизации перед выполнением действий
    checkAuthBeforeAction() {
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            console.log('Нет токена или данных пользователя');
            this.showNotification('Требуется авторизация администратора', 'warning');
            return false;
        }

        try {
            const user = JSON.parse(userStr);
            if (user.role !== 'admin') {
                console.log('Пользователь не администратор:', user.role);
                this.showNotification('Доступ только для администраторов', 'warning');
                return false;
            }

            // Обновляем токен в объекте
            this.token = token;
            return true;

        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
            this.showNotification('Ошибка проверки авторизации', 'error');
            return false;
        }
    }
}

// Создаем глобальный экземпляр режима редактирования
window.editMode = null;

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    window.editMode = new EditMode();
});
