// Основной JavaScript файл для сайта "Пирамида ТОТА"

// ===== СИСТЕМА БЛОКОВ "КОНСТРУКТОР ПИРАМИДЫ" =====
// Объявляем функции в самом начале файла

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

    console.log('🏗️ Система блоков "Конструктор Пирамиды" инициализирована');
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

document.addEventListener('DOMContentLoaded', async function() {
    // Добавляем верхнее фото-меню (фиксированная полоса с изображением)
    if (!document.querySelector('.top-photo-menu')) {
        const div = document.createElement('div');
        div.className = 'top-photo-menu';
        div.setAttribute('aria-hidden', 'true');
        document.body.prepend(div);
    }

    // Инициализация всех компонентов
    initializeNavigation();
    initializeModals();
    // initializeAnimations(); - отключено для устранения конфликтов
    // initializePageTransitions(); - отключено для устранения тряски
    initializeSmoothScrolling();
    // initializeParallaxEffect(); - убрано для статичного фона

    // Инициализация кликабельности кнопок
    initializeButtonClicks();

    // Скрываем пустые блоки заголовков и контента
    hideEmptyPageHeaders();
    hideEmptyContentSections();

    // Инициализация системы блоков (теперь в отдельном файле)
    // initializeBlocksSystem();

    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Инициализация новой системы папирус блоков
    // перенесена в каждую страницу (например, temple.html) для избежания двойного вызова
    // if (window.NewBlockSystem && window.NewBlockSystem.initialize) {
    //     await window.NewBlockSystem.initialize();
    //     console.log('Система папирус блоков инициализирована');
    // }

    // Инициализация встроенного редактора страниц
    // Контент уже применен на сервере, клиентская загрузка не нужна
    window.pageEditor = new InlinePageEditor();

    // ОПТИМИЗАЦИЯ: Lazy loading для всех изображений на странице
    document.querySelectorAll('img:not([loading])').forEach(img => {
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
    });

    console.log('Пирамида ТОТА - сайт загружен');
});

// Навигация и модальные окна
function initializeNavigation() {
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const closeBtns = document.querySelectorAll('.close');

    console.log('Инициализация навигации (main.js):', {
        loginModal: !!loginModal,
        registerModal: !!registerModal
    });

    // НЕ добавляем обработчики к кнопкам входа/регистрации - это делает forms.js
    // Только обработчики модальных окон

    // Закрытие модальных окон
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            hideModal(modal);
        });
    });

    // Закрытие модального окна при клике вне его
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            hideModal(e.target);
        }
    });
}

// Функции для работы с модальными окнами
function showModal(modal) {
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        modal.classList.remove('hide');
        document.body.style.overflowY = 'hidden';

        // Анимация появления
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
    }
}

function hideModal(modal) {
    if (modal) {
        modal.classList.add('hide');
        modal.classList.remove('show');

        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.opacity = '0';
            document.body.style.overflowY = '';
        }, 400);
    }
}

// Инициализация модальных окон
function initializeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.opacity = '0';
    });
}

// Анимации при загрузке страницы
function initializeAnimations() {
    // Анимация появления элементов при скролле
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Наблюдение за элементами
    const animatedElements = document.querySelectorAll('.additional-sections section');
    animatedElements.forEach(el => {
        observer.observe(el);
    });

    // Анимация для пунктов меню
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach((item, index) => {
        item.style.animationDelay = `${(index + 1) * 0.1}s`;
    });
}

// Переходы между страницами
function initializePageTransitions() {
    const links = document.querySelectorAll('a[href^="pages/"]');

    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');

            // Анимация выхода
            document.body.classList.add('page-exit');

            setTimeout(() => {
                window.location.href = href;
            }, 800);
        });
    });

    // Анимация входа на страницу
    document.body.classList.add('page-enter');
}

// Плавная прокрутка
function initializeSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Параллакс эффект убран - фон теперь полностью статичный

// Встроенный редактор страниц
class InlinePageEditor {
    constructor() {
        this.isEditMode = false;
        this.currentElement = null;
        this.originalContent = {};
        this.changes = {};
        this.contextEditor = null;
        this.selectedText = null;
        this.selectionRange = null;
        this.apiBaseUrl = this.getApiBaseUrl();
        this.saveTimeout = null;
        this.saveDelay = 1000; // Задержка автосохранения в миллисекундах

        this.init();
    }

    /**
     * Получение базового URL API
     */
    getApiBaseUrl() {
        // Определяем базовый URL в зависимости от окружения
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        } else {
            // Для продакшена используем текущий домен
            return window.location.origin;
        }
    }

    init() {
        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: НЕ показываем контент сразу, сначала загружаем из API

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Загружаем контент для ВСЕХ пользователей
        // Контент должен быть виден всем, независимо от роли
        if (!isHomePage()) {
            // Загружаем изменения для всех пользователей (контент виден всем)
            this.loadPageChanges();
            // Загружаем форматирование из новой системы для всех
            this.loadFormattingFromDatabase();
        } else {
            // На главной странице показываем контент сразу
            this.showContent();
        }

        // Функции редактирования только для админов и только НЕ на главной странице
        if (this.isAdmin() && !isHomePage()) {
            this.createEditToggle();
            this.setupEventListeners();
        } else {
            // Для не-админов или на главной странице гарантируем отсутствие режима редактирования
            this.isEditMode = false;
            this.disableEditing();
        }
    }

    isAdmin() {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                return user.role === 'admin';
            } catch (error) {
                console.error('Ошибка парсинга данных пользователя:', error);
                return false;
            }
        }
        return false;
    }

    createEditToggle() {
        // Создаем кнопку переключения режима редактирования
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'edit-mode-toggle';
        toggleContainer.innerHTML = `
            <button id="toggleEditMode" class="edit-toggle-btn">
                ✏️ Режим редактирования
            </button>
        `;

        document.body.appendChild(toggleContainer);

        // Добавляем обработчик клика
        const toggleBtn = document.getElementById('toggleEditMode');
        toggleBtn.addEventListener('click', () => this.toggleEditMode());
    }

    setupEventListeners() {
        // Обработчик для сохранения изменений при уходе со страницы
        window.addEventListener('beforeunload', (e) => {
            if (Object.keys(this.changes).length > 0) {
                e.preventDefault();
                e.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?';
            }
        });

        // Обработчик клавиш
        document.addEventListener('keydown', (e) => {
            if (this.isEditMode) {
                // Ctrl+S для сохранения
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    this.saveAllChanges();
                }
                // Escape для выхода из режима редактирования
                if (e.key === 'Escape') {
                    this.toggleEditMode();
                }
            }
        });
    }

    async toggleEditMode() {
        // КРИТИЧЕСКАЯ ПРОВЕРКА: Только администраторы могут переключать режим редактирования
        if (!this.isAdmin()) {
            console.warn('Попытка переключения режима редактирования без прав администратора');
            alert('Режим редактирования доступен только администраторам');
            return;
        }

        this.isEditMode = !this.isEditMode;
        const toggleBtn = document.getElementById('toggleEditMode');

        if (this.isEditMode) {
            document.body.classList.add('edit-mode');
            toggleBtn.textContent = '💾 Выйти из редактирования';
            toggleBtn.style.background = '#f44336';
            this.makeElementsEditable();
            this.showEditIndicators();
            this.createContextEditor();

            // Проверяем статус API и уведомляем пользователя
            await this.checkAndNotifyApiStatus();
        } else {
            document.body.classList.remove('edit-mode');
            toggleBtn.textContent = '✏️ Режим редактирования';
            toggleBtn.style.background = 'var(--gold-color)';
            this.disableEditing();
            this.hideEditIndicators();
            this.hideContextEditor();
        }
    }

    async checkAndNotifyApiStatus() {
        const isApiAvailable = await this.checkApiAvailability();

        if (isApiAvailable) {
            this.showMessage('✅ Подключение к базе данных установлено', 'success');
        } else {
            this.showMessage('⚠️ API сервер недоступен. Изменения будут сохраняться локально.', 'warning');
        }
    }

    makeElementsEditable() {
        // КРИТИЧЕСКАЯ ПРОВЕРКА: Только администраторы могут делать элементы редактируемыми
        if (!this.isAdmin()) {
            console.warn('Попытка активации редактирования элементов без прав администратора');
            return;
        }

        const editableSelectors = [
            // ВАЖНО: .page-title НЕ редактируется, это статичный заголовок страницы
            '.page-subtitle',
            '.content-section h2',
            '.content-section h3',
            '.content-section p',
            '.feature-list li',
            '.program-card h3',
            '.program-card p',
            '.timeline-content h4',
            '.timeline-content p',
            '.schedule-row div:last-child',
            // Добавляем поддержку блоков папируса
            '.content-block[data-is-block="true"] h1',
            '.content-block[data-is-block="true"] h2',
            '.content-block[data-is-block="true"] h3',
            '.content-block[data-is-block="true"] p',
            '.content-block[data-is-block="true"] li',
            '.content-block[data-is-block="true"] blockquote',
            '.content-block[data-is-block="true"]'
        ];

        editableSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                // Проверяем, что элемент не пустой, прежде чем делать его редактируемым
                if (element.textContent.trim() !== '' || element.hasAttribute('data-edit-id')) {
                    this.makeEditable(element);
                }
            });
        });

        // Добавляем кнопки для добавления новых блоков
        this.addBlockButtons();
    }

    makeEditable(element) {
        if (element.classList.contains('editable')) return; // Уже редактируемый

        element.classList.add('editable');
        element.contentEditable = true;
        element.addEventListener('focus', this.onElementFocus.bind(this));
        element.addEventListener('blur', this.onElementBlur.bind(this));
        element.addEventListener('input', this.onElementInput.bind(this));
        element.addEventListener('contextmenu', this.onElementContextMenu.bind(this));
        element.addEventListener('mouseup', this.onElementMouseUp.bind(this));
        element.addEventListener('keyup', this.onElementKeyUp.bind(this));

        // Добавляем индикатор
        this.addEditIndicator(element);
    }

    disableEditing() {
        document.querySelectorAll('.editable').forEach(element => {
            element.classList.remove('editable');
            element.contentEditable = false;
            element.removeEventListener('focus', this.onElementFocus.bind(this));
            element.removeEventListener('blur', this.onElementBlur.bind(this));
            element.removeEventListener('input', this.onElementInput.bind(this));
            element.removeEventListener('contextmenu', this.onElementContextMenu.bind(this));
            element.removeEventListener('mouseup', this.onElementMouseUp.bind(this));
            element.removeEventListener('keyup', this.onElementKeyUp.bind(this));
        });


    }

    onElementFocus(event) {
        this.currentElement = event.target;
        const elementId = this.getElementId(event.target);
        this.originalContent[elementId] = event.target.innerHTML;
        // Контекстный редактор будет показан при выделении текста или правом клике
    }

    onElementBlur(event) {
        // Скрываем контекстный редактор с задержкой
        setTimeout(() => {
            if (!this.contextEditor || !this.contextEditor.matches(':hover')) {
                this.hideContextEditor();
            }
        }, 200);

        // Автосохранение через 2 секунды после потери фокуса
        setTimeout(() => {
            if (this.currentElement === event.target) {
                this.autoSave(event.target);
            }
        }, 2000);
    }

    onElementContextMenu(event) {
        event.preventDefault();
        this.currentElement = event.target;

        // Показываем контекстный редактор в позиции курсора
        this.showContextEditor(event.pageX, event.pageY);
    }

    onElementMouseUp(event) {
        // Проверяем, есть ли выделенный текст
        const selection = window.getSelection();
        if (selection.toString().trim().length > 0) {
            this.selectedText = selection.toString();
            this.selectionRange = selection.getRangeAt(0);
            this.currentElement = event.target;

            // Показываем контекстный редактор рядом с выделением
            const rect = this.selectionRange.getBoundingClientRect();
            this.showContextEditor(rect.right + 10, rect.top);
        }
    }

    onElementKeyUp(event) {
        // Проверяем выделение при использовании клавиатуры
        const selection = window.getSelection();
        if (selection.toString().trim().length > 0) {
            this.selectedText = selection.toString();
            this.selectionRange = selection.getRangeAt(0);
        } else {
            this.selectedText = null;
            this.selectionRange = null;
        }
    }

    onElementInput(event) {
        const elementId = this.getElementId(event.target);
        this.changes[elementId] = {
            element: event.target,
            content: this.getCleanContent(event.target),
            type: this.getElementType(event.target),
            selector: this.getElementSelector(event.target)
        };

        // Показать индикатор несохраненных изменений
        this.showUnsavedIndicator(event.target);

        // Автосохранение с задержкой
        this.scheduleAutoSave(event.target);
    }

    scheduleAutoSave(element) {
        // Отменяем предыдущий таймер
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        // Устанавливаем новый таймер
        this.saveTimeout = setTimeout(() => {
            this.autoSave(element);
        }, this.saveDelay);
    }

    getElementId(element) {
        // Создаем уникальный ID для элемента
        if (!element.dataset.editId) {
            element.dataset.editId = 'edit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return element.dataset.editId;
    }

    getElementType(element) {
        if (element.classList.contains('page-title')) return 'title';
        if (element.classList.contains('page-subtitle')) return 'subtitle';
        if (element.tagName === 'H2') return 'heading2';
        if (element.tagName === 'H3') return 'heading3';
        if (element.tagName === 'H4') return 'heading4';
        if (element.tagName === 'P') return 'paragraph';
        if (element.tagName === 'LI') return 'list-item';
        return 'text';
    }

    getElementSelector(element) {
        // Создаем стабильный CSS селектор для элемента
        if (element.id) {
            return '#' + element.id;
        }

        let selector = element.tagName.toLowerCase();

        // Используем только основные классы для стабильности
        const importantClasses = ['page-title', 'page-subtitle', 'content-section', 'feature-list', 'program-card', 'timeline-content', 'schedule-row'];
        const elementClasses = element.className.split(' ').filter(cls =>
            cls && cls !== 'editable' && importantClasses.includes(cls)
        );

        if (elementClasses.length > 0) {
            selector += '.' + elementClasses.join('.');
        }

        return selector;
    }

    getCleanContent(element) {
        // Возвращает содержимое элемента без индикаторов редактирования, но с классами форматирования
        const clone = element.cloneNode(true);

        // Удаляем индикаторы редактирования
        const indicators = clone.querySelectorAll('.edit-indicator');
        indicators.forEach(indicator => indicator.remove());

        // Сохраняем классы форматирования в атрибуте data-format-classes
        const formatClasses = this.getFormatClasses(element);
        if (formatClasses.length > 0) {
            clone.setAttribute('data-format-classes', formatClasses.join(' '));
        }

        return clone.innerHTML;
    }

    getFormatClasses(element) {
        // Извлекаем только классы форматирования
        const allClasses = Array.from(element.classList);
        return allClasses.filter(cls =>
            cls.startsWith('font-size-') ||
            cls.startsWith('text-color-') ||
            cls.startsWith('text-align-') ||
            cls.startsWith('font-weight-') ||
            cls.startsWith('font-style-')
        );
    }

    async autoSave(element) {
        const elementId = this.getElementId(element);
        const pageId = this.getCurrentPageId();

        try {
            // Проверяем, является ли элемент блоком папируса
            const blockElement = element.closest('.content-block[data-is-block="true"]');

            if (blockElement && window.NewBlockSystem && window.NewBlockSystem.saveBlockContent) {
                // Сохраняем через систему блоков папируса
                const result = await window.NewBlockSystem.saveBlockContent(blockElement);
                if (result && result.success) {
                    this.showSavedIndicator(element);
                    console.log('Блок папируса автосохранен:', elementId);
                } else {
                    this.showErrorIndicator(element);
                    console.error('Ошибка автосохранения блока папируса');
                }
                return;
            }

            // Сохраняем контент через обычную систему
            const response = await fetch(`${this.apiBaseUrl}/api/content/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getUserToken()}`
                },
                body: JSON.stringify({
                    page_id: pageId,
                    element_id: elementId,
                    element_type: this.getElementType(element),
                    content: element.innerHTML,
                    selector: this.getElementSelector(element)
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSavedIndicator(element);
                console.log('Контент автосохранен:', elementId);

                // Также сохраняем форматирование
                if (this.currentElement === element) {
                    await this.saveFormattingToDatabase();
                }
            } else {
                this.showErrorIndicator(element);
                console.error('Ошибка автосохранения:', result.error);
            }
        } catch (error) {
            console.error('Ошибка автосохранения:', error);
            this.showErrorIndicator(element);
        }
    }

    async saveChange(change) {
        const pageId = this.getCurrentPageId();
        const saveData = {
            page_id: pageId,
            element_id: change.element.dataset.editId,
            element_type: change.type,
            content: change.content,
            selector: change.selector
        };

        try {
            // Проверяем доступность API сервера
            const isApiAvailable = await this.checkApiAvailability();

            if (!isApiAvailable) {
                console.log('API сервер недоступен, сохраняем в localStorage');
                this.saveToLocalStorage(saveData);
                return { success: true, source: 'localStorage' };
            }

            // Создаем AbortController для таймаута
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд

            const response = await fetch(`${this.apiBaseUrl}/api/content/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(saveData),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Изменение сохранено в БД:', result);

            return result;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('Превышено время ожидания ответа от сервера');
            } else {
                console.error('Ошибка сохранения в БД, переключаемся на localStorage:', error);
            }

            // Fallback: сохранение в localStorage
            this.saveToLocalStorage(saveData);
            return { success: true, source: 'localStorage', error: error.message };
        }
    }

    async checkApiAvailability() {
        try {
            // Создаем AbortController для таймаута
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 секунды

            const response = await fetch(`${this.apiBaseUrl}/api/health`, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            // Логируем только если это не таймаут или отмена
            if (error.name !== 'AbortError') {
                console.log('API недоступен:', error.message);
            }
            return false;
        }
    }

    getAuthToken() {
        // Простой токен для демонстрации (в реальном проекте нужна более сложная логика)
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user.role === 'admin') {
                    return 'admin_token_123';
                }
            } catch (error) {
                console.error('Ошибка парсинга данных пользователя:', error);
            }
        }
        return null;
    }

    // Возвращает JWT токен авторизованного пользователя из localStorage
    getUserToken() {
        try {
            const token = localStorage.getItem('authToken');
            return token || null;
        } catch (e) {
            return null;
        }
    }

    saveToLocalStorage(saveData) {
        const pageId = saveData.page_id;
        const pageData = this.getPageData(pageId);
        pageData.changes = pageData.changes || {};
        pageData.changes[saveData.element_id] = saveData;
        localStorage.setItem(`page_${pageId}`, JSON.stringify(pageData));
        console.log('Изменение сохранено в localStorage (fallback):', saveData);
    }

    async saveAllChanges() {
        const changeKeys = Object.keys(this.changes);
        if (changeKeys.length === 0) {
            this.showMessage('Нет изменений для сохранения', 'info');
            return;
        }

        try {
            // Пытаемся использовать batch API для быстрого сохранения
            const changesArray = changeKeys.map(elementId => {
                const change = this.changes[elementId];
                return {
                    page_id: this.getCurrentPageId(),
                    element_id: change.element.dataset.editId,
                    element_type: change.type,
                    content: change.content,
                    selector: change.selector
                };
            });

            // Создаем AbortController для таймаута
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 секунд для batch операции

            const response = await fetch(`${this.apiBaseUrl}/api/content/batch-save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ changes: changesArray }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const result = await response.json();
                console.log('Batch сохранение выполнено:', result);

                // Обновляем индикаторы для всех элементов
                changeKeys.forEach(elementId => {
                    const change = this.changes[elementId];
                    this.showSavedIndicator(change.element);
                });

                this.changes = {};
                this.showMessage(`Сохранено ${changeKeys.length} изменений`, 'success');
            } else {
                throw new Error(`Batch API error: ${response.status}`);
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('Превышено время ожидания batch сохранения, переходим к индивидуальному');
            } else {
                console.error('Ошибка batch сохранения, переходим к индивидуальному:', error);
            }

            // Fallback: индивидуальное сохранение
            let savedCount = 0;
            for (const elementId of changeKeys) {
                try {
                    const change = this.changes[elementId];
                    await this.saveChange(change);
                    this.showSavedIndicator(change.element);
                    savedCount++;
                } catch (saveError) {
                    console.error(`Ошибка сохранения элемента ${elementId}:`, saveError);
                    this.showErrorIndicator(this.changes[elementId].element);
                }
            }

            this.changes = {};
            if (savedCount > 0) {
                this.showMessage(`Сохранено ${savedCount} из ${changeKeys.length} изменений`, 'warning');
            } else {
                this.showMessage('Ошибка при сохранении изменений', 'error');
            }
        }
    }

    getCurrentPageId() {
        const path = window.location.pathname;
        const filename = path.split('/').pop().replace('.html', '');
        return filename === 'index' ? 'home' : filename;
    }

    getUserToken() {
        // Получаем токен из localStorage или sessionStorage
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
        console.log('🔑 Получен токен для форматирования:', token ? 'Токен найден' : 'Токен НЕ найден');
        return token;
    }

    showNotification(message, type = 'info') {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        // Цвета для разных типов
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Анимация появления
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Автоматическое скрытие
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getPageData(pageId) {
        const stored = localStorage.getItem(`page_${pageId}`);
        return stored ? JSON.parse(stored) : { changes: {} };
    }

    async loadPageChanges() {
        const pageId = this.getCurrentPageId();

        // КРИТИЧЕСКИ ВАЖНО: Проверяем, используется ли на странице Rich Text Editor
        // Если да, то НЕ загружаем контент через старую систему блоков
        const hasRichTextEditor = window.__RICH_TEXT_EDITOR_ACTIVE__ ||
                                  document.querySelector('.rich-text-editor-container') ||
                                  window.richTextEditor;

        if (hasRichTextEditor) {
            console.log('🚫 Обнаружен Rich Text Editor, пропускаем загрузку через старую систему блоков');
            this.showContent();
            return;
        }

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, был ли контент уже применен на сервере
        const isServerContentApplied = document.body.hasAttribute('data-server-content-applied');

        if (isServerContentApplied) {
            console.log('Контент уже применен на сервере, пропускаем загрузку из API');
            this.showContent();
            return;
        }

        // Если контент уже загружен быстрой загрузкой, просто проверяем API для обновлений
        const isContentAlreadyLoaded = document.body.classList.contains('content-loaded');

        try {
            // Проверяем доступность API
            const isApiAvailable = await this.checkApiAvailability();

            if (isApiAvailable) {
                // Пытаемся загрузить из API
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд для загрузки

                const response = await fetch(`${this.apiBaseUrl}/api/content/${pageId}`, {
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        this.applyContentFromAPI(result.data);
                        const changesCount = Object.keys(result.data.changes || {}).length;
                        console.log('Контент загружен из БД:', changesCount, 'элементов');

                        if (changesCount > 0) {
                            this.showMessage(`Контент обновлен из базы данных (${changesCount} элементов)`, 'success');
                        }

                        // ВСЕГДА показываем контент после применения изменений из API
                        this.showContent();
                        return;
                    }
                }
            } else {
                console.log('API сервер недоступен, используем localStorage');
            }
        } catch (error) {
            console.error('Ошибка загрузки из API:', error);
        }

        // Если API недоступен, загружаем из localStorage и показываем контент
        this.loadFromLocalStorage(pageId);
        this.showContent();
    }

    showContent() {
        // Показываем контент после загрузки изменений
        document.body.classList.add('content-loaded');
    }

    // Быстрая загрузка критического контента из localStorage
    static quickLoadFromLocalStorage() {
        const pageId = window.location.pathname.split('/').pop().replace('.html', '');
        const finalPageId = pageId === 'index' ? 'home' : pageId;

        try {
            const stored = localStorage.getItem(`page_${finalPageId}`);
            if (stored) {
                const pageData = JSON.parse(stored);
                const changes = pageData.changes || {};

                Object.keys(changes).forEach(elementId => {
                    const change = changes[elementId];
                    const element = document.querySelector(`[data-edit-id="${elementId}"]`) ||
                                   document.querySelector(change.selector);

                    if (element && change.content) {
                        element.innerHTML = change.content;
                        element.dataset.editId = elementId;
                    }
                });
            }
        } catch (error) {
            console.error('Ошибка быстрой загрузки из localStorage:', error);
        }

        // Показываем контент
        document.body.classList.add('content-loaded');
    }

    applyContentFromAPI(data) {
        // data содержит объект { changes: {...} }
        const changes = data.changes || {};

        Object.keys(changes).forEach(elementId => {
            const item = changes[elementId];

            // Сначала ищем элемент по data-edit-id
            let element = document.querySelector(`[data-edit-id="${elementId}"]`);

            if (!element && item.selector) {
                // Если не найден по ID, ищем по селектору
                element = document.querySelector(item.selector);

                // Если нашли по селектору, присваиваем ему правильный ID
                if (element) {
                    element.dataset.editId = elementId;
                }
            }

            if (!element) {
                // Если элемент все еще не найден, создаем его
                element = this.createElement({
                    element_id: elementId,
                    element_type: item.element_type,
                    content: item.content,
                    selector: item.selector
                });
                if (element) {
                    this.insertElementIntoPage(element, {
                        element_id: elementId,
                        element_type: item.element_type,
                        content: item.content,
                        selector: item.selector
                    });
                }
            }

            if (element) {
                element.innerHTML = item.content;
                element.dataset.editId = elementId;

                // ОПТИМИЗАЦИЯ: Lazy loading для изображений
                element.querySelectorAll('img').forEach(img => {
                    if (!img.hasAttribute('loading')) {
                        img.setAttribute('loading', 'lazy');
                    }
                    if (!img.hasAttribute('decoding')) {
                        img.setAttribute('decoding', 'async');
                    }
                });

                // Восстанавливаем классы форматирования из контента
                this.restoreFormatClasses(element, item.content);

                // Делать элементы редактируемыми только в активном режиме редактирования
                if (this.isEditMode && !element.classList.contains('editable')) {
                    this.makeEditable(element);
                } else {
                    // Вне режима редактирования гарантируем отсутствие редактирования
                    element.contentEditable = false;
                    element.classList.remove('editable');
                }
            }
        });
    }

    restoreFormatClasses(element, content) {
        // Ищем классы форматирования в сохраненном контенте
        const formatClassRegex = /data-format-classes="([^"]*)"/;
        const match = content.match(formatClassRegex);

        if (match && match[1]) {
            const formatClasses = match[1].split(' ');
            formatClasses.forEach(cls => {
                if (cls && (cls.startsWith('font-size-') ||
                           cls.startsWith('text-color-') ||
                           cls.startsWith('text-align-') ||
                           cls.startsWith('font-weight-') ||
                           cls.startsWith('font-style-'))) {
                    element.classList.add(cls);
                }
            });
        }

        // Также ищем классы в самом HTML контенте
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const elementsWithClasses = tempDiv.querySelectorAll('[class]');

        elementsWithClasses.forEach(el => {
            const classes = Array.from(el.classList);
            classes.forEach(cls => {
                if (cls.startsWith('font-size-') ||
                    cls.startsWith('text-color-') ||
                    cls.startsWith('text-align-') ||
                    cls.startsWith('font-weight-') ||
                    cls.startsWith('font-style-')) {
                    element.classList.add(cls);
                }
            });
        });
    }

    createElement(item) {
        const element = document.createElement(this.getTagFromType(item.element_type));
        element.dataset.editId = item.element_id;
        element.innerHTML = item.content;

        // Добавляем соответствующие классы
        if (item.selector) {
            const classes = item.selector.split('.').filter(cls => cls && cls !== 'editable');
            element.className = classes.join(' ');
        }

        return element;
    }

    getTagFromType(elementType) {
        const typeMap = {
            'title': 'h1',
            'subtitle': 'p',
            'heading': 'h2',
            'heading2': 'h2',
            'heading3': 'h3',
            'heading4': 'h4',
            'subheading': 'h3',
            'text': 'p',
            'paragraph': 'p',
            'list_item': 'li',
            'list-item': 'li',
            'new_heading': 'h3',
            'new_text': 'p',
            'new_title': 'h1'
        };
        return typeMap[elementType] || 'p';
    }

    insertElementIntoPage(element, item) {
        const pageContent = document.querySelector('.page-content');
        if (pageContent) {
            pageContent.appendChild(element);
        }
    }

    loadFromLocalStorage(pageId) {
        const pageData = this.getPageData(pageId);
        if (pageData.changes) {
            Object.values(pageData.changes).forEach(change => {
                const element = document.querySelector(`[data-edit-id="${change.element_id}"]`);
                if (element) {
                    element.innerHTML = change.content;
                }
            });
            console.log('Контент загружен из localStorage');
        }
    }

    addEditIndicator(element) {
        if (element.querySelector('.edit-indicator')) return; // Уже есть индикатор

        const indicator = document.createElement('div');
        indicator.className = 'edit-indicator';
        indicator.innerHTML = '✏️';
        element.style.position = 'relative';
        element.appendChild(indicator);
    }

    showUnsavedIndicator(element) {
        const indicator = element.querySelector('.edit-indicator');
        if (indicator) {
            indicator.className = 'edit-indicator unsaved';
            indicator.innerHTML = '⚠️';
        }
    }

    showSavedIndicator(element) {
        const indicator = element.querySelector('.edit-indicator');
        if (indicator) {
            indicator.className = 'edit-indicator saved';
            indicator.innerHTML = '✅';
            indicator.title = 'Сохранено в базе данных';

            // Убираем индикатор через 3 секунды
            setTimeout(() => {
                if (indicator) {
                    indicator.className = 'edit-indicator';
                    indicator.innerHTML = '✏️';
                    indicator.title = 'Редактируемый элемент';
                }
            }, 3000);
        }
    }

    showLocalStorageIndicator(element) {
        const indicator = element.querySelector('.edit-indicator');
        if (indicator) {
            indicator.className = 'edit-indicator localStorage';
            indicator.innerHTML = '💾';
            indicator.title = 'Сохранено локально (API сервер недоступен)';

            // Убираем индикатор через 5 секунд
            setTimeout(() => {
                if (indicator) {
                    indicator.className = 'edit-indicator';
                    indicator.innerHTML = '✏️';
                    indicator.title = 'Редактируемый элемент';
                }
            }, 5000);
        }
    }

    showErrorIndicator(element) {
        const indicator = element.querySelector('.edit-indicator');
        if (indicator) {
            indicator.className = 'edit-indicator error';
            indicator.innerHTML = '❌';
            indicator.title = 'Ошибка сохранения';
        }
    }

    showEditIndicators() {
        // Показываем все индикаторы редактирования
        document.querySelectorAll('.edit-indicator').forEach(indicator => {
            indicator.style.display = 'flex';
        });
    }

    hideEditIndicators() {
        // Скрываем все индикаторы редактирования
        document.querySelectorAll('.edit-indicator').forEach(indicator => {
            indicator.style.display = 'none';
        });
    }

    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.className = `edit-message edit-message-${type}`;
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 150px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            padding: 1rem;
            border-radius: 5px;
            z-index: 2002;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    createContextEditor() {
        if (this.contextEditor) return; // Уже создан

        this.contextEditor = document.createElement('div');
        this.contextEditor.className = 'context-editor';
        this.contextEditor.innerHTML = `
            <div class="context-editor-header">
                <span class="context-editor-title">Редактор</span>
                <button class="context-editor-close" title="Закрыть">×</button>
            </div>

            <div class="context-editor-group">
                <button class="context-tool-btn" data-action="bold" title="Жирный">
                    <strong>B</strong>
                </button>
                <button class="context-tool-btn" data-action="italic" title="Курсив">
                    <em>I</em>
                </button>
                <div class="context-editor-separator"></div>
                <select class="context-tool-select" data-action="fontSize" title="Размер шрифта">
                    <option value="">Размер</option>
                    <option value="12">12px</option>
                    <option value="14">14px</option>
                    <option value="16">16px</option>
                    <option value="18">18px</option>
                    <option value="20">20px</option>
                    <option value="24">24px</option>
                    <option value="28">28px</option>
                    <option value="32">32px</option>
                    <option value="36">36px</option>
                    <option value="42">42px</option>
                    <option value="48">48px</option>
                </select>
                <select class="context-tool-select" data-action="textColor" title="Цвет текста">
                    <option value="">Цвет</option>
                    <option value="white">Белый</option>
                    <option value="gold">Золотой</option>
                    <option value="accent">Акцент</option>
                    <option value="primary">Основной</option>
                    <option value="secondary">Вторичный</option>
                </select>
            </div>

            <div class="context-editor-group">
                <button class="context-tool-btn" data-action="alignLeft" title="По левому краю">
                    ⬅️
                </button>
                <button class="context-tool-btn" data-action="alignCenter" title="По центру">
                    ↔️
                </button>
                <button class="context-tool-btn" data-action="alignRight" title="По правому краю">
                    ➡️
                </button>
                <div class="context-editor-separator"></div>
                <button class="context-tool-btn danger" data-action="clear" title="Очистить контент">
                    🗑️
                </button>
            </div>
        `;

        document.body.appendChild(this.contextEditor);

        // Обработчики событий
        this.contextEditor.addEventListener('click', (e) => {
            if (e.target.classList.contains('context-tool-btn')) {
                this.handleContextAction(e.target.dataset.action);
            } else if (e.target.classList.contains('context-editor-close')) {
                this.hideContextEditor();
            }
        });

        this.contextEditor.addEventListener('change', (e) => {
            if (e.target.classList.contains('context-tool-select') || e.target.classList.contains('context-tool-input')) {
                this.handleContextAction(e.target.dataset.action, e.target.value);
            }
        });

        // Закрытие при клике вне редактора
        document.addEventListener('click', (e) => {
            if (!this.contextEditor.contains(e.target) && !e.target.classList.contains('editable')) {
                this.hideContextEditor();
            }
        });
    }

    showContextEditor(x, y) {
        if (!this.contextEditor) return;

        // Показываем редактор
        this.contextEditor.classList.add('visible');

        // Позиционируем редактор
        this.contextEditor.style.left = x + 'px';
        this.contextEditor.style.top = y + 'px';

        // Проверяем, не выходит ли редактор за границы экрана
        const rect = this.contextEditor.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        if (rect.right > windowWidth) {
            this.contextEditor.style.left = (windowWidth - rect.width - 10) + 'px';
        }
        if (rect.bottom > windowHeight) {
            this.contextEditor.style.top = (windowHeight - rect.height - 10) + 'px';
        }
        if (rect.left < 0) {
            this.contextEditor.style.left = '10px';
        }
        if (rect.top < 0) {
            this.contextEditor.style.top = '10px';
        }

        // Обновляем состояние кнопок
        this.updateContextEditorState();
    }

    hideContextEditor() {
        if (this.contextEditor) {
            this.contextEditor.classList.remove('visible');
        }
        this.selectedText = null;
        this.selectionRange = null;
    }

    updateContextEditorState() {
        if (!this.contextEditor || !this.currentElement) return;

        // Обновляем состояние кнопок форматирования
        const boldBtn = this.contextEditor.querySelector('[data-action="bold"]');
        const italicBtn = this.contextEditor.querySelector('[data-action="italic"]');

        if (boldBtn) {
            boldBtn.classList.toggle('active', this.getCurrentFormatting('fontWeight') === 'bold');
        }
        if (italicBtn) {
            italicBtn.classList.toggle('active', this.getCurrentFormatting('fontStyle') === 'italic');
        }

        // Обновляем выравнивание
        this.contextEditor.querySelectorAll('[data-action^="align"]').forEach(btn => {
            btn.classList.remove('active');
        });

        const currentAlign = this.getCurrentFormatting('textAlign');
        if (currentAlign) {
            const alignBtn = this.contextEditor.querySelector(`[data-action="align${currentAlign.charAt(0).toUpperCase() + currentAlign.slice(1)}"]`);
            if (alignBtn) alignBtn.classList.add('active');
        }

        // Обновляем размер шрифта
        const fontSizeSelect = this.contextEditor.querySelector('[data-action="fontSize"]');
        if (fontSizeSelect) {
            const currentFontSize = this.getCurrentFormatting('fontSize');
            fontSizeSelect.value = currentFontSize || '';
        }

        // Обновляем цвет текста
        const textColorSelect = this.contextEditor.querySelector('[data-action="textColor"]');
        if (textColorSelect) {
            const currentColor = this.getCurrentFormatting('textColor');
            textColorSelect.value = currentColor || '';
        }
    }

    // Старые функции удалены - используем универсальную getCurrentFormatting()

    handleContextAction(action, value = null) {
        console.log(`🎯 handleContextAction вызвана: action=${action}, value=${value}`);

        if (!this.currentElement) {
            console.log(`❌ Нет текущего элемента для форматирования`);
            return;
        }

        console.log(`📍 Текущий элемент:`, this.currentElement);

        switch (action) {
            case 'bold':
                console.log(`🔥 Применяем Bold`);
                this.toggleFormatting('fontWeight', 'bold', 'normal');
                break;
            case 'italic':
                console.log(`🔥 Применяем Italic`);
                this.toggleFormatting('fontStyle', 'italic', 'normal');
                break;
            case 'fontSize':
                if (value) {
                    console.log(`🔥 Применяем размер шрифта: ${value}`);
                    this.applyFormatting('fontSize', value);
                }
                break;
            case 'textColor':
                if (value) {
                    console.log(`🔥 Применяем цвет текста: ${value}`);
                    this.applyFormatting('textColor', value);
                }
                break;
            case 'alignLeft':
                console.log(`🔥 Применяем выравнивание влево`);
                this.applyFormatting('textAlign', 'left');
                break;
            case 'alignCenter':
                console.log(`🔥 Применяем выравнивание по центру`);
                this.applyFormatting('textAlign', 'center');
                break;
            case 'alignRight':
                console.log(`🔥 Применяем выравнивание вправо`);
                this.applyFormatting('textAlign', 'right');
                break;
            case 'clear':
                this.clearContent();
                break;
        }

        // Обновляем состояние кнопок
        this.updateContextEditorState();

        // ИНТЕГРАЦИЯ С ОСНОВНОЙ СИСТЕМОЙ СОХРАНЕНИЯ
        this.markElementAsChangedWithFormatting();

        // Также сохраняем форматирование отдельно
        this.saveFormattingToDatabase();
    }

    // Новая функция для интеграции с основной системой
    markElementAsChangedWithFormatting() {
        if (!this.currentElement) return;

        // Отмечаем элемент как измененный в основной системе edit-mode
        if (window.pageEditor && window.pageEditor.markElementAsChanged) {
            window.pageEditor.markElementAsChanged(this.currentElement);
        }

        // Также сохраняем через автосохранение
        this.scheduleAutoSave(this.currentElement);
    }

    // НОВАЯ СИСТЕМА ФОРМАТИРОВАНИЯ (FUTURE-PROOF)

    toggleFormatting(property, activeValue, inactiveValue) {
        console.log(`🔄 toggleFormatting: property=${property}, activeValue=${activeValue}, inactiveValue=${inactiveValue}`);

        const currentValue = this.getCurrentFormatting(property);
        console.log(`📊 Текущее значение ${property}: ${currentValue}`);

        const newValue = currentValue === activeValue ? inactiveValue : activeValue;
        console.log(`🎯 Новое значение ${property}: ${newValue}`);

        this.applyFormatting(property, newValue);
    }

    applyFormatting(property, value) {
        if (!this.currentElement || !value) {
            console.log(`❌ Не удалось применить форматирование: element=${!!this.currentElement}, value=${value}`);
            return;
        }

        console.log(`🎨 Применяем форматирование: ${property} = ${value} к элементу:`, this.currentElement);

        // Удаляем старые классы этого типа
        this.removeFormattingClasses(property);

        // Добавляем новый класс
        if (value !== 'normal' && value !== 'none') {
            const className = `${this.getPropertyPrefix(property)}-${value}`;
            this.currentElement.classList.add(className);
            console.log(`✅ Добавлен класс: ${className}`);
        }

        console.log(`📋 Текущие классы элемента:`, this.currentElement.className);
    }

    removeFormattingClasses(property) {
        const prefix = this.getPropertyPrefix(property);
        const classesToRemove = Array.from(this.currentElement.classList)
            .filter(cls => cls.startsWith(prefix + '-'));

        classesToRemove.forEach(cls => {
            this.currentElement.classList.remove(cls);
        });
    }

    getPropertyPrefix(property) {
        const prefixMap = {
            'fontSize': 'font-size',
            'textColor': 'text-color',
            'textAlign': 'text-align',
            'fontWeight': 'font-weight',
            'fontStyle': 'font-style'
        };
        return prefixMap[property] || property;
    }

    getCurrentFormatting(property) {
        const prefix = this.getPropertyPrefix(property);
        const classList = Array.from(this.currentElement.classList);

        for (const cls of classList) {
            if (cls.startsWith(prefix + '-')) {
                return cls.substring(prefix.length + 1);
            }
        }

        return null;
    }

    async saveFormattingToDatabase() {
        if (!this.currentElement) return;

        const elementId = this.getElementId(this.currentElement);
        const pageId = this.getCurrentPageId();
        const token = this.getUserToken();

        console.log('💾 Сохраняем форматирование:', {
            elementId,
            pageId,
            hasToken: !!token,
            tokenLength: token ? token.length : 0
        });

        if (!token) {
            console.error('❌ Нет токена авторизации для сохранения форматирования');
            return;
        }

        // Собираем текущее форматирование
        const formatting = {
            fontSize: this.getCurrentFormatting('fontSize'),
            textColor: this.getCurrentFormatting('textColor'),
            textAlign: this.getCurrentFormatting('textAlign'),
            fontWeight: this.getCurrentFormatting('fontWeight'),
            fontStyle: this.getCurrentFormatting('fontStyle')
        };

        // Удаляем null значения
        Object.keys(formatting).forEach(key => {
            if (!formatting[key]) {
                delete formatting[key];
            }
        });

        console.log('📝 Форматирование для сохранения:', formatting);

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/formatting/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    page_id: pageId,
                    element_id: elementId,
                    formatting: formatting
                })
            });

            console.log('📡 Ответ сервера на форматирование:', response.status, response.statusText);

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    console.log('✅ Форматирование сохранено в БД:', formatting);
                } else {
                    console.error('❌ Ошибка сохранения форматирования:', result.error);
                }
            } else {
                const errorText = await response.text();
                console.error('❌ HTTP ошибка сохранения форматирования:', response.status, errorText);
            }

        } catch (error) {
            console.error('❌ Ошибка отправки форматирования:', error);
        }
    }

    async loadFormattingFromDatabase() {
        const pageId = this.getCurrentPageId();

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/formatting/${pageId}`);
            const result = await response.json();

            if (result.success && result.data.formatting) {
                console.log('Загружено форматирование из БД:', result.data.formatting);

                // Применяем форматирование к элементам
                Object.keys(result.data.formatting).forEach(elementId => {
                    const formatting = result.data.formatting[elementId];
                    const element = document.querySelector(`[data-edit-id="${elementId}"]`);

                    if (element && formatting.css_classes) {
                        // Удаляем старые классы форматирования
                        const existingClasses = Array.from(element.classList);
                        existingClasses.forEach(cls => {
                            if (cls.startsWith('font-size-') ||
                                cls.startsWith('text-color-') ||
                                cls.startsWith('text-align-') ||
                                cls.startsWith('font-weight-') ||
                                cls.startsWith('font-style-')) {
                                element.classList.remove(cls);
                            }
                        });

                        // Добавляем новые классы форматирования
                        formatting.css_classes.forEach(cls => {
                            if (cls) {
                                element.classList.add(cls);
                            }
                        });

                        console.log(`Применено форматирование к ${elementId}:`, formatting.css_classes);
                    }
                });
            }

        } catch (error) {
            console.error('Ошибка загрузки форматирования:', error);
        }
    }

    // Старые функции удалены - используем новую систему форматирования

    async clearContent() {
        if (confirm('Вы уверены, что хотите удалить этот блок?')) {
            const elementId = this.getElementId(this.currentElement);
            const pageId = this.getCurrentPageId();

            console.log('🗑️ Удаляем элемент:', { elementId, pageId });

            // Удаляем из базы данных сначала
            try {
                const response = await fetch(`${this.apiBaseUrl}/api/content/delete`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        page_id: pageId,
                        element_id: elementId
                    })
                });

                console.log('📡 Ответ сервера на удаление:', response.status, response.statusText);

                if (response.ok) {
                    const result = await response.json();

                    if (result.success) {
                        console.log('✅ Элемент успешно удален из БД:', result);

                        // Удаляем элемент из DOM только после успешного удаления из БД
                        this.currentElement.remove();
                        this.hideContextEditor();
                        this.showNotification('Блок удален', 'success');
                    } else {
                        console.error('❌ Ошибка удаления из БД:', result.error);
                        this.showNotification('Ошибка удаления из БД', 'error');
                    }
                } else {
                    const errorText = await response.text();
                    console.error('❌ HTTP ошибка удаления:', response.status, errorText);
                    this.showNotification('Ошибка удаления', 'error');
                }
            } catch (error) {
                console.error('❌ Ошибка удаления элемента:', error);
                this.showNotification('Ошибка удаления', 'error');
            }
        }
    }

    scheduleAutoSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.saveTimeout = setTimeout(() => {
            if (this.currentElement) {
                this.autoSave(this.currentElement);
            }
        }, this.saveDelay);
    }

    handleToolbarAction(action) {
        if (!this.currentElement) return;

        switch (action) {
            case 'bold':
                document.execCommand('bold');
                break;
            case 'italic':
                document.execCommand('italic');
                break;
            case 'link':
                const url = prompt('Введите URL:');
                if (url) {
                    document.execCommand('createLink', false, url);
                }
                break;
            case 'save':
                this.autoSave(this.currentElement);
                break;
            case 'cancel':
                this.cancelEdit(this.currentElement);
                break;
        }
    }

    cancelEdit(element) {
        const elementId = this.getElementId(element);
        if (this.originalContent[elementId]) {
            element.innerHTML = this.originalContent[elementId];
            delete this.changes[elementId];
            delete this.originalContent[elementId];

            const indicator = element.querySelector('.edit-indicator');
            if (indicator) {
                indicator.className = 'edit-indicator';
                indicator.innerHTML = '✏️';
            }
        }
    }

    addBlockButtons() {
        const contentSections = document.querySelectorAll('.content-section');


    }



    async saveNewBlock(element, type) {
        const pageId = this.getCurrentPageId();
        const elementId = this.getElementId(element);

        const saveData = {
            page_id: pageId,
            element_id: elementId,
            element_type: 'new_' + type,
            content: this.getCleanContent(element), // Сохраняем только внутренний HTML без индикаторов
            selector: this.getElementSelector(element)
        };

        try {
            // Создаем AbortController для таймаута
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд

            const response = await fetch(`${this.apiBaseUrl}/api/content/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(saveData),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Новый блок сохранен в БД:', result);
            this.showMessage(`Добавлен новый блок: ${type}`, 'success');

        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('Превышено время ожидания при сохранении нового блока');
                this.showMessage('Превышено время ожидания. Блок сохранен локально.', 'warning');
            } else {
                console.error('Ошибка сохранения нового блока:', error);
            }

            // Fallback: сохранение в localStorage
            this.saveToLocalStorage(saveData);
            this.showMessage(`Блок добавлен (сохранен локально): ${type}`, 'warning');
        }
    }
}

// Функция для проверки, находимся ли на главной странице
function isHomePage() {
    const path = window.location.pathname;
    return path === '/' || path === '/index.html' || path.endsWith('/index.html');
}

// Убираем дублирующие обработчики для menu-link - они обрабатываются в animations.js

// Функция для воспроизведения звука при наведении (опционально)
function playHoverSound() {
    // Можно добавить звуковые эффекты
    // const audio = new Audio('sounds/hover.mp3');
    // audio.volume = 0.1;
    // audio.play().catch(e => console.log('Звук не может быть воспроизведен'));
}

// Анимация картушей при загрузке
function animateCartouches() {
    const leftCartouche = document.querySelector('.left-cartouche');
    const rightCartouche = document.querySelector('.right-cartouche');

    if (leftCartouche && rightCartouche) {
        setTimeout(() => {
            leftCartouche.classList.add('animate-fade-in-left');
        }, 500);

        setTimeout(() => {
            rightCartouche.classList.add('animate-fade-in-right');
        }, 700);
    }
}

// Эффект печатающегося текста для заголовка
function typewriterEffect(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';

    function typeWriter() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(typeWriter, speed);
        }
    }

    typeWriter();
}

// Инициализация эффекта печатающегося текста
document.addEventListener('DOMContentLoaded', function() {
    const siteTitle = document.querySelector('.site-title');
    if (siteTitle) {
        const originalText = siteTitle.textContent;
        setTimeout(() => {
            typewriterEffect(siteTitle, originalText, 150);
        }, 1000);
    }
});

// Функция для создания звездного неба
function createStars() {
    const starsContainer = document.createElement('div');
    starsContainer.className = 'stars-container';
    starsContainer.style.position = 'fixed';
    starsContainer.style.top = '0';
    starsContainer.style.left = '0';
    starsContainer.style.width = '100%';
    starsContainer.style.height = '100%';
    starsContainer.style.pointerEvents = 'none';
    starsContainer.style.zIndex = '-1';

    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.position = 'absolute';
        star.style.width = Math.random() * 3 + 'px';
        star.style.height = star.style.width;
        star.style.backgroundColor = '#fff';
        star.style.borderRadius = '50%';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.opacity = Math.random();
        star.style.animation = `twinkle ${Math.random() * 4 + 2}s ease-in-out infinite alternate`;

        starsContainer.appendChild(star);
    }

    document.body.appendChild(starsContainer);
}

// Инициализация звездного неба
document.addEventListener('DOMContentLoaded', createStars);



// Инициализация кликабельности кнопок
function initializeButtonClicks() {
    console.log('Инициализация кликабельности кнопок...');

    // Маппинг кнопок на страницы
    const buttonPageMap = {
        // Левый картуш - основное меню
        'button_01.png': 'pages/complex.html',      // Комплекс пирамида Тота и Храм Исиды
        'button_02.png': 'pages/pyramid.html',      // Пирамида Тота
        'button_03.png': 'pages/temple.html',       // Храм Исиды
        'button_04.png': 'pages/court.html',        // Храмовый мистериальный двор
        'button_05.png': 'pages/visit.html',        // Посетить пирамиду
        'button_06.png': 'pages/programs.html',     // Программы
        'button_07.png': 'pages/media.html',        // СМИ о Пирамиде Тота
        'button_08.png': 'pages/news-pyramid.html', // Новости Пирамиды Тота

        // Правый картуш - обучение
        'button_09.png': 'pages/school-tota.html',  // Школа пирамиды Тота
        'button_10.png': 'pages/school-isais.html', // Женская школа Isais
        'button_11.png': 'https://forum.piramidaspb.ru/', // Форум (внешняя ссылка)
        'button_12.png': 'pages/consultations.html',// Личные приемы
        'button_13.png': 'https://vk.com/clubisais',    // Артефакты из египта
        'button_14.png': 'pages/projects.html',     // Наши проекты
        'button_15.png': 'pages/seminars.html',     // Выездные семинары
        'button_16.png': 'pages/about-isais.html'   // Об isais
    };

    // Находим все кнопки overlay-image
    const overlayButtons = document.querySelectorAll('.overlay-column .overlay-image');
    console.log(`Найдено кнопок: ${overlayButtons.length}`);

    overlayButtons.forEach((button, index) => {
        const src = button.getAttribute('src');
        const filename = src ? src.split('/').pop() : null;

        console.log(`Кнопка ${index + 1}: ${filename}`);

        if (filename && buttonPageMap[filename]) {
            const targetPage = buttonPageMap[filename];

            // Добавляем обработчик клика
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`🖱️ КЛИК ПО КНОПКЕ: ${filename} -> ${targetPage}`);

                // Добавляем эффект клика
                this.style.transform = 'scale(0.95)';
                this.style.transition = 'transform 0.15s ease';

                setTimeout(() => {
                    this.style.transform = '';
                }, 150);

                // Переход на страницу (через SPA если доступен)
                setTimeout(() => {
                    console.log(`🔄 Переход на: ${targetPage}`);
                    if (targetPage.startsWith('http://') || targetPage.startsWith('https://')) {
                        window.open(targetPage, '_blank', 'noopener,noreferrer');
                    } else if (window.SPARouter && window.SPARouter.isInternalPage(new URL(targetPage, location.href).href)) {
                        const cleanUrl = window.SPARouter.normalizePageUrl(new URL(targetPage, location.href).href);
                        window.SPARouter.navigate(cleanUrl);
                    } else {
                        window.location.href = targetPage;
                    }
                }, 200);
            });

            // Добавляем обработчик для отладки hover
            button.addEventListener('mouseenter', function() {
                console.log(`🖱️ Hover на кнопке: ${filename}`);
            });

            // Добавляем стили для hover эффекта
            button.style.cursor = 'pointer';

            console.log(`Обработчик добавлен для: ${filename} -> ${targetPage}`);
        } else {
            console.warn(`Не найден маппинг для кнопки: ${filename}`);
        }
    });

    console.log('Инициализация кликабельности завершена');
}

// Обработка ошибок
window.addEventListener('error', function(e) {
    console.error('Ошибка на сайте:', e.error);
});

// Функция для показа уведомлений
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: rgba(22, 33, 62, 0.95);
        color: white;
        border-radius: 10px;
        border-left: 4px solid var(--gold-color);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 3000;
        max-width: 300px;
        backdrop-filter: blur(10px);
    `;

    notification.textContent = message;
    notification.classList.add('notification-enter');

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('notification-exit');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, duration);
}

// Функция для скрытия пустых блоков заголовков
function hideEmptyPageHeaders() {
    // Ждем немного, чтобы все скрипты загрузились
    setTimeout(() => {
        const pageHeaders = document.querySelectorAll('.page-header');

        pageHeaders.forEach(header => {
            const title = header.querySelector('.page-title');
            const subtitle = header.querySelector('.page-subtitle');

            // Проверяем, есть ли непустой контент
            const hasTitle = title && title.textContent.trim() !== '';
            const hasSubtitle = subtitle && subtitle.textContent.trim() !== '';

            // Если нет ни заголовка, ни подзаголовка, ПОЛНОСТЬЮ УДАЛЯЕМ блок
            if (!hasTitle && !hasSubtitle) {
                header.remove();
                console.log('Удален пустой блок page-header');
            }
        });

        // Также удаляем пустые заголовки и подзаголовки отдельно
        const emptyTitles = document.querySelectorAll('.page-title');
        emptyTitles.forEach(title => {
            if (title.textContent.trim() === '' && !title.hasAttribute('data-edit-id') && !title.hasAttribute('contenteditable')) {
                title.remove();
                console.log('Удален пустой page-title');
            }
        });

        const emptySubtitles = document.querySelectorAll('.page-subtitle');
        emptySubtitles.forEach(subtitle => {
            if (subtitle.textContent.trim() === '' && !subtitle.hasAttribute('data-edit-id') && !subtitle.hasAttribute('contenteditable')) {
                subtitle.remove();
                console.log('Удален пустой page-subtitle');
            }
        });

        // Дополнительная проверка через 1 секунду на случай динамического создания
        setTimeout(() => {
            const lateHeaders = document.querySelectorAll('.page-header');
            lateHeaders.forEach(header => {
                const title = header.querySelector('.page-title');
                const subtitle = header.querySelector('.page-subtitle');
                const hasTitle = title && title.textContent.trim() !== '';
                const hasSubtitle = subtitle && subtitle.textContent.trim() !== '';

                if (!hasTitle && !hasSubtitle) {
                    header.remove();
                    console.log('Удален поздно созданный пустой блок page-header');
                }
            });
        }, 1000);
    }, 100);
}

// Функция для скрытия пустых блоков контента
function hideEmptyContentSections() {
    setTimeout(() => {
        const contentSections = document.querySelectorAll('.content-section');

        contentSections.forEach(section => {
            // Проверяем, есть ли в секции реальный контент (не комментарии)
            const hasRealContent = Array.from(section.childNodes).some(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    return node.textContent.trim() !== '';
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    return node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE';
                }
                return false;
            });

            // Если нет реального контента, удаляем блок
            if (!hasRealContent) {
                section.remove();
                console.log('Удален пустой блок content-section');
            }
        });

        // Дополнительная проверка через 1 секунду
        setTimeout(() => {
            const lateSections = document.querySelectorAll('.content-section');
            lateSections.forEach(section => {
                const hasRealContent = Array.from(section.childNodes).some(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        return node.textContent.trim() !== '';
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        return node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE';
                    }
                    return false;
                });

                if (!hasRealContent) {
                    section.remove();
                    console.log('Удален поздно созданный пустой блок content-section');
                }
            });
        }, 1000);
    }, 100);
}



// Глобальная функция для переинициализации навигации
function reinitializeNavigation() {
    console.log('Переинициализация навигации');
    initializeNavigation();
}



// Экспорт функций для использования в других файлах
window.PyramidTOTA = {
    showModal,
    hideModal,
    showNotification,
    typewriterEffect,
    reinitializeNavigation,
    hideEmptyPageHeaders,
    hideEmptyContentSections,
    // Система блоков
    initializeBlocksSystem,
    toggleBlocksPanel,
    openBlocksPanel,
    closeBlocksPanel
};
