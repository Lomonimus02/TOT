/**
 * Rich Text Editor - Система редактирования контента в стиле Microsoft Word
 * Использует Quill.js для создания полнофункционального редактора
 */

class RichTextEditor {
    constructor(containerId = 'rich-text-editor') {
        this.containerId = containerId;
        this.editor = null;
        this.saveTimeout = null;
        this.autoSaveDelay = 2000; // 2 секунды
        this.isInitialized = false;
        this._isLoadingContent = false;
    }

    /**
     * Инициализация редактора
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('⚠️ Редактор уже инициализирован');
            return;
        }

        console.log('📝 Инициализация Rich Text Editor...');

        // Проверяем наличие Quill
        if (typeof Quill === 'undefined') {
            console.error('❌ Quill.js не загружен!');
            return;
        }

        // Регистрируем кастомный Image Blot, сохраняющий style/width/height
        // ВАЖНО: value() должен возвращать строку (src), иначе Delta ломается.
        // Стили сохраняются через formats()/format() — Quill сам вызывает их при обработке HTML.
        const BaseImage = Quill.import('formats/image');
        class StyledImage extends BaseImage {
            static formats(node) {
                const formats = {};
                if (node.hasAttribute('style')) formats.style = node.getAttribute('style');
                if (node.hasAttribute('width')) formats.width = node.getAttribute('width');
                if (node.hasAttribute('height')) formats.height = node.getAttribute('height');
                if (node.hasAttribute('alt')) formats.alt = node.getAttribute('alt');
                return formats;
            }
            format(name, value) {
                if (['style', 'width', 'height', 'alt'].includes(name)) {
                    if (value) {
                        this.domNode.setAttribute(name, value);
                    } else {
                        this.domNode.removeAttribute(name);
                    }
                } else {
                    super.format(name, value);
                }
            }
        }
        StyledImage.blotName = 'image';
        StyledImage.tagName = 'IMG';
        Quill.register(StyledImage, true);

        // Регистрируем пользовательские шрифты
        const Font = Quill.import('formats/font');
        Font.whitelist = ['sans-serif', 'serif', 'monospace', 'cinzel', 'open-sans'];
        Quill.register(Font, true);

        // Регистрируем размеры шрифтов в пикселях (как в Word)
        const SizeStyle = Quill.import('attributors/style/size');
        SizeStyle.whitelist = ['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '22px', '24px', '26px', '28px', '36px', '48px', '72px'];
        Quill.register(SizeStyle, true);

        // Создаем контейнер редактора
        this.createEditorContainer();

        // Настройка панели инструментов (как в Word)
        const toolbarOptions = [
            // Шрифты и размеры
            [{ 'font': ['sans-serif', 'serif', 'monospace', 'cinzel', 'open-sans'] }],
            [{ 'size': ['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '22px', '24px', '26px', '28px', '36px', '48px', '72px'] }],

            // Заголовки
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

            // Форматирование текста
            ['bold', 'italic', 'underline', 'strike'],

            // Цвета (ВАЖНО: для изменения цвета текста и фона)
            [{ 'color': [] }, { 'background': [] }],

            // Выравнивание (3 отдельные кнопки: влево, по центру, вправо)
            [{ 'align': '' }, { 'align': 'center' }, { 'align': 'right' }],

            // Списки (включая чекбоксы для планов)
            [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],

            // Дополнительные элементы
            ['blockquote', 'code-block'],

            // Ссылки и изображения
            ['link', 'image', 'video'],

            // Очистка форматирования
            ['clean']
        ];

        // Инициализация Quill
        this.editor = new Quill(`#${this.containerId}`, {
            theme: 'snow',
            modules: {
                toolbar: {
                    container: toolbarOptions,
                    handlers: {
                        'image': this.imageHandler.bind(this),
                        'video': this.videoHandler.bind(this)
                    }
                },
                history: {
                    delay: 1000,
                    maxStack: 50,
                    userOnly: true
                },
                imageResize: {
                    // Модуль для изменения размера изображений и видео
                }
            },
            placeholder: 'Начните вводить текст... Используйте панель инструментов для форматирования.',
            readOnly: true // По умолчанию только для чтения
        });

        console.log('📋 Quill редактор создан:', {
            readOnly: this.editor.isEnabled() === false,
            hasToolbar: !!this.editor.getModule('toolbar')
        });

        // КРИТИЧЕСКИ ВАЖНО: Перемещаем тулбар в body, чтобы position:fixed работал
        // без влияния overflow/transform от родительских элементов
        const toolbar = document.querySelector('.ql-toolbar.ql-snow');
        if (toolbar) {
            document.body.appendChild(toolbar);
            console.log('📌 Тулбар перемещён в body');
        }

        // Загружаем сохраненный контент
        await this.loadContent();

        // Настраиваем автосохранение
        this.setupAutoSave();

        // Настраиваем обработку ссылок
        this.setupLinkHandling();

        // Настраиваем вставку из буфера и drag & drop
        this.setupClipboardPaste();
        this.setupDragAndDrop();

        this.isInitialized = true;
        console.log('✅ Rich Text Editor инициализирован');

        // КРИТИЧЕСКИ ВАЖНО: Предотвращаем прокрутку страницы вверх при вызове quill.focus()
        // Quill Snow theme вызывает focus() при закрытии tooltip ссылки — это скроллит к началу
        this._patchQuillFocus();

        // Активируем редактирование только в режиме редактирования
        this.updateEditMode();
    }

    /**
     * Патчим quill.focus() и ql-editor.focus() чтобы они не скроллили страницу
     */
    _patchQuillFocus() {
        const originalFocus = this.editor.focus.bind(this.editor);
        this.editor.focus = (...args) => {
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;
            originalFocus(...args);
            window.scrollTo(scrollX, scrollY);
        };

        // Патчим нативный focus() на DOM-элементе .ql-editor
        // Quill Snow theme вызывает this.quill.root.focus() напрямую при закрытии tooltip
        const editorRoot = this.editor.root;
        const nativeFocus = editorRoot.focus.bind(editorRoot);
        editorRoot.focus = function(opts) {
            const sy = window.scrollY;
            const sx = window.scrollX;
            nativeFocus(Object.assign({ preventScroll: true }, opts));
            window.scrollTo(sx, sy);
        };
    }

    /**
     * Создание контейнера редактора
     */
    createEditorContainer() {
        const pageContent = document.querySelector('.page-content');
        if (!pageContent) {
            console.error('❌ Контейнер .page-content не найден');
            return;
        }

        console.log('🧹 Очистка старого контента...');

        // КРИТИЧЕСКИ ВАЖНО: Полностью очищаем весь контент, включая текстовые узлы
        while (pageContent.firstChild) {
            pageContent.removeChild(pageContent.firstChild);
        }

        // Создаем новую структуру
        const container = document.createElement('div');
        container.className = 'rich-text-editor-container';

        const wrapper = document.createElement('div');
        wrapper.className = 'rich-text-editor-wrapper';

        const editorDiv = document.createElement('div');
        editorDiv.id = this.containerId;

        wrapper.appendChild(editorDiv);
        container.appendChild(wrapper);
        pageContent.appendChild(container);

        console.log('✅ Контейнер редактора создан');

        // Создаем индикатор сохранения
        this.createSaveIndicator();

        // КРИТИЧЕСКИ ВАЖНО: Защита от добавления JSON данных
        this.setupJsonProtection();
    }

    /**
     * Защита от добавления JSON данных в контейнер
     */
    setupJsonProtection() {
        const pageContent = document.querySelector('.page-content');
        if (!pageContent) return;

        console.log('🛡️ Активация защиты от JSON данных...');

        // Функция для проверки и удаления JSON
        const removeJsonNodes = (container) => {
            const walker = document.createTreeWalker(
                container,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function(node) {
                        const parent = node.parentElement;
                        if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        // Пропускаем узлы внутри редактора Quill
                        if (parent && parent.closest('.ql-editor')) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        return NodeFilter.FILTER_ACCEPT;
                    }
                },
                false
            );

            const nodesToRemove = [];
            let node;

            while (node = walker.nextNode()) {
                const text = node.textContent.trim();
                // Проверяем, является ли это JSON
                if (text.length > 10 && ((text.startsWith('{') && text.includes('"')) || (text.startsWith('[') && text.includes('"')))) {
                    try {
                        const parsed = JSON.parse(text);
                        if (typeof parsed === 'object' && parsed !== null) {
                            console.warn('🗑️ Обнаружены и удалены JSON данные:', text.substring(0, 100));
                            nodesToRemove.push(node);
                        }
                    } catch (e) {
                        // Не JSON, пропускаем
                    }
                }
            }

            // Удаляем найденные узлы
            nodesToRemove.forEach(node => {
                if (node.parentNode) {
                    node.parentNode.removeChild(node);
                }
            });

            return nodesToRemove.length > 0;
        };

        // MutationObserver для перехвата добавления JSON в реальном времени
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        // Пропускаем узлы редактора
                        if (node.nodeType === Node.ELEMENT_NODE && node.closest('.rich-text-editor-container')) {
                            return;
                        }

                        // Если добавлен текстовый узел
                        if (node.nodeType === Node.TEXT_NODE) {
                            const text = node.textContent.trim();
                            if (text.length > 10 && ((text.startsWith('{') && text.includes('"')) || (text.startsWith('[') && text.includes('"')))) {
                                try {
                                    const parsed = JSON.parse(text);
                                    if (typeof parsed === 'object' && parsed !== null) {
                                        console.warn('🗑️ Перехвачены и удалены JSON данные');
                                        if (node.parentNode) {
                                            node.parentNode.removeChild(node);
                                        }
                                    }
                                } catch (e) {
                                    // Не JSON
                                }
                            }
                        }
                        // Если добавлен элемент, проверяем его содержимое
                        else if (node.nodeType === Node.ELEMENT_NODE) {
                            removeJsonNodes(node);
                        }
                    });
                }
            });
        });

        // Начинаем наблюдение
        observer.observe(pageContent, {
            childList: true,
            subtree: true,
            characterData: true
        });

        // Немедленная очистка существующих JSON данных
        removeJsonNodes(pageContent);

        // Повторная очистка с задержками
        setTimeout(() => removeJsonNodes(pageContent), 100);
        setTimeout(() => removeJsonNodes(pageContent), 500);
        setTimeout(() => removeJsonNodes(pageContent), 1000);

        console.log('✅ Защита от JSON данных активирована');
    }

    /**
     * Обработчик загрузки изображений
     */
    imageHandler() {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return;

            console.log('📸 Загрузка изображения:', file.name);

            // Проверяем размер файла (максимум 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('Размер изображения не должен превышать 10MB');
                return;
            }

            // Создаем FormData для загрузки
            const formData = new FormData();
            formData.append('image', file);

            try {
                // Загружаем изображение на сервер
                const response = await fetch('/api/upload/image', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Ошибка загрузки изображения');
                }

                const data = await response.json();
                const imageUrl = data.url;

                console.log('✅ Изображение загружено:', imageUrl);

                // Вставляем изображение в редактор
                const scrollY = window.scrollY;
                const range = this.editor.getSelection() || { index: this.editor.getLength() - 1 };
                this.editor.insertEmbed(range.index, 'image', imageUrl);
                // Insert a newline after the image so cursor has somewhere to go
                this.editor.insertText(range.index + 1, '\n');
                this.editor.setSelection(range.index + 2, 0);
                // Restore scroll position
                window.scrollTo(0, scrollY);

            } catch (error) {
                console.error('❌ Ошибка загрузки изображения:', error);
                alert('Ошибка загрузки изображения. Попробуйте еще раз.');
            }
        };
    }

    /**
     * Обработчик загрузки видео
     */
    videoHandler() {
        // Показываем красивый диалог выбора
        this.showVideoChoiceDialog();
    }

    /**
     * Показать диалог выбора способа добавления видео
     */
    showVideoChoiceDialog() {
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'video-choice-modal';
        modal.innerHTML = `
            <div class="video-choice-dialog">
                <h2 class="video-choice-title">Добавить Видео</h2>
                <p class="video-choice-message">Выберите способ добавления видео:</p>
                <div class="video-choice-buttons">
                    <button class="video-choice-btn primary" data-action="upload">
                        📤 Загрузить с устройства
                    </button>
                    <button class="video-choice-btn secondary" data-action="url">
                        🔗 Вставить ссылку
                    </button>
                    <button class="video-choice-btn cancel" data-action="cancel">
                        ✖ Отмена
                    </button>
                </div>
            </div>
        `;

        // Добавляем в DOM
        document.body.appendChild(modal);

        // Показываем модальное окно с анимацией
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // Обработчики кнопок
        const buttons = modal.querySelectorAll('.video-choice-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;

                // Закрываем модальное окно
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.remove();
                }, 300);

                // Выполняем действие
                if (action === 'upload') {
                    this.uploadVideoFromDevice();
                } else if (action === 'url') {
                    this.insertVideoByUrl();
                }
            });
        });

        // Закрытие по клику вне диалога
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.remove();
                }, 300);
            }
        });
    }

    /**
     * Загрузка видео с устройства
     */
    uploadVideoFromDevice() {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'video/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return;

            console.log('🎥 Загрузка видео:', file.name);

            // Проверяем размер файла (максимум 100MB)
            if (file.size > 100 * 1024 * 1024) {
                alert('Размер видео не должен превышать 100MB');
                return;
            }

            // Создаем FormData для загрузки
            const formData = new FormData();
            formData.append('video', file);

            try {
                // Загружаем видео на сервер
                const response = await fetch('/api/upload/video', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Ошибка загрузки видео');
                }

                const data = await response.json();
                const videoUrl = data.url;

                console.log('✅ Видео загружено:', videoUrl);

                // Вставляем видео в редактор
                const scrollY = window.scrollY;
                const range = this.editor.getSelection() || { index: this.editor.getLength() - 1 };
                this.editor.insertEmbed(range.index, 'video', videoUrl);
                this.editor.setSelection(range.index + 1);
                window.scrollTo(0, scrollY);

                // КРИТИЧЕСКИ ВАЖНО: Устанавливаем начальные размеры для video элемента
                setTimeout(() => {
                    const videos = this.editor.root.querySelectorAll('video');
                    videos.forEach(video => {
                        if (!video.style.width) {
                            video.style.width = '800px';
                            video.style.height = '450px';
                            console.log('✅ Установлены начальные размеры для video:', video);
                        }
                    });
                    this.wrapVideoIframes();
                }, 100);

            } catch (error) {
                console.error('❌ Ошибка загрузки видео:', error);
                alert('Ошибка загрузки видео. Попробуйте еще раз.');
            }
        };
    }

    /**
     * Вставка видео по ссылке
     */
    insertVideoByUrl() {
        // Создаем модальное окно для ввода URL
        const modal = document.createElement('div');
        modal.className = 'video-choice-modal';
        modal.innerHTML = `
            <div class="video-choice-dialog">
                <h2 class="video-choice-title">Вставить Видео по Ссылке</h2>
                <p class="video-choice-message">Введите ссылку на видео с YouTube, Rutube, Vimeo или прямую ссылку на видео файл:</p>
                <div style="margin-bottom: 20px;">
                    <input type="text" id="video-url-input" placeholder="https://www.youtube.com/watch?v=..."
                           style="width: 100%; padding: 12px; border: 1px solid #d0c4a8; border-radius: 6px;
                                  font-size: 14px; color: #6b5d4f; background: #ffffff;">
                </div>
                <div class="video-choice-buttons">
                    <button class="video-choice-btn primary" data-action="insert">
                        ✓ Вставить
                    </button>
                    <button class="video-choice-btn cancel" data-action="cancel">
                        ✖ Отмена
                    </button>
                </div>
            </div>
        `;

        // Добавляем в DOM
        document.body.appendChild(modal);

        // Показываем модальное окно с анимацией
        setTimeout(() => {
            modal.classList.add('show');
            // Фокусируемся на поле ввода
            const input = modal.querySelector('#video-url-input');
            input.focus();
        }, 10);

        const input = modal.querySelector('#video-url-input');

        // Обработчик Enter в поле ввода
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.processVideoUrl(input.value, modal);
            }
        });

        // Обработчики кнопок
        const buttons = modal.querySelectorAll('.video-choice-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;

                if (action === 'insert') {
                    this.processVideoUrl(input.value, modal);
                } else {
                    // Закрываем модальное окно
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.remove();
                    }, 300);
                }
            });
        });

        // Закрытие по клику вне диалога
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.remove();
                }, 300);
            }
        });
    }

    /**
     * Обработка URL видео и вставка в редактор
     */
    processVideoUrl(url, modal) {
        if (!url || !url.trim()) {
            alert('Пожалуйста, введите ссылку на видео');
            return;
        }

        console.log('🎥 Вставка видео по ссылке:', url);

        try {
            // Преобразуем URL в embed формат
            const embedUrl = this.convertToEmbedUrl(url.trim());

            // Вставляем видео в редактор
            const scrollY2 = window.scrollY;
            const range = this.editor.getSelection() || { index: this.editor.getLength() - 1 };
            this.editor.insertEmbed(range.index, 'video', embedUrl);
            this.editor.setSelection(range.index + 1);
            window.scrollTo(0, scrollY2);

            console.log('✅ Видео вставлено по ссылке:', embedUrl);

            // КРИТИЧЕСКИ ВАЖНО: Устанавливаем начальные размеры для iframe
            setTimeout(() => {
                const iframes = this.editor.root.querySelectorAll('iframe.ql-video');
                iframes.forEach(iframe => {
                    if (!iframe.style.width) {
                        iframe.style.width = '800px';
                        iframe.style.height = '450px';
                        console.log('✅ Установлены начальные размеры для iframe:', iframe);
                    }
                });
                this.wrapVideoIframes();
            }, 100);

            // Закрываем модальное окно
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);

        } catch (error) {
            console.error('❌ Ошибка вставки видео:', error);
            alert('Ошибка вставки видео. Проверьте ссылку и попробуйте еще раз.');
        }
    }

    /**
     * Преобразование URL видео в embed формат
     */
    convertToEmbedUrl(url) {
        // YouTube
        const youtubeId = this.extractYouTubeId(url);
        if (youtubeId) {
            return `https://www.youtube.com/embed/${youtubeId}`;
        }

        // Rutube
        const rutubeId = this.extractRutubeId(url);
        if (rutubeId) {
            return `https://rutube.ru/play/embed/${rutubeId}`;
        }

        // Vimeo
        const vimeoId = this.extractVimeoId(url);
        if (vimeoId) {
            return `https://player.vimeo.com/video/${vimeoId}`;
        }

        // Если это уже embed URL или прямая ссылка на видео файл, возвращаем как есть
        return url;
    }

    /**
     * Извлечение YouTube ID из URL
     */
    extractYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    /**
     * Извлечение Rutube ID из URL
     */
    extractRutubeId(url) {
        const regExp = /rutube\.ru\/video\/([a-zA-Z0-9]+)/;
        const match = url.match(regExp);
        return match ? match[1] : null;
    }

    /**
     * Извлечение Vimeo ID из URL
     */
    extractVimeoId(url) {
        const regExp = /vimeo\.com\/(\d+)/;
        const match = url.match(regExp);
        return match ? match[1] : null;
    }

    /**
     * Создание индикатора сохранения
     */
    createSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'editor-save-indicator';
        indicator.id = 'editor-save-indicator';
        indicator.innerHTML = '<span class="indicator-icon">💾</span><span class="indicator-text">Сохранено</span>';
        document.body.appendChild(indicator);
    }

    /**
     * Показать индикатор сохранения
     */
    showSaveIndicator(type = 'success', message = 'Сохранено') {
        const indicator = document.getElementById('editor-save-indicator');
        if (!indicator) return;

        const icon = indicator.querySelector('.indicator-icon');
        const text = indicator.querySelector('.indicator-text');

        // Устанавливаем тип и сообщение
        indicator.className = `editor-save-indicator ${type} show`;
        text.textContent = message;

        if (type === 'success') {
            icon.textContent = '✅';
        } else if (type === 'error') {
            icon.textContent = '❌';
        } else {
            icon.textContent = '💾';
        }

        // Скрываем через 3 секунды
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 3000);
    }

    /**
     * УДАЛЕНО: Оборачивание больше не требуется
     * pointer-events: none в CSS решает проблему
     */
    wrapVideoIframes() {
        // Ничего не делаем - pointer-events: none в CSS достаточно
        console.log('✅ wrapVideoIframes: pointer-events управляется через CSS');
    }

    /**
     * Настройка автосохранения
     */
    setupAutoSave() {
        this.editor.on('text-change', (delta, oldDelta, source) => {
            // Игнорируем программные изменения во время загрузки контента
            if (this._isLoadingContent) return;

            // Очищаем предыдущий таймер
            if (this.saveTimeout) {
                clearTimeout(this.saveTimeout);
            }

            // Авто-float: когда картинка и текст в одном параграфе — обтекание как в Word
            this._autoFloatImages();

            // Устанавливаем новый таймер (только для пользовательских изменений)
            if (source === 'user') {
                // Перехватываем base64 изображения при вставке
                this._interceptBase64OnPaste();

                this.saveTimeout = setTimeout(() => {
                    this.saveContent();
                }, this.autoSaveDelay);
            }
        });
    }

    /**
     * Перехватывает base64 изображения, вставленные через Ctrl+V или drag&drop,
     * загружает на сервер и заменяет src на URL
     */
    _interceptBase64OnPaste() {
        if (!this.editor || this._uploadingBase64) return;
        const base64Images = this.editor.root.querySelectorAll('img[src^="data:image"]');
        if (base64Images.length === 0) return;

        this._uploadingBase64 = true;
        // Ожидаем чтоб не конфликтовать с текущим редактированием
        setTimeout(() => {
            this._uploadBase64Images().finally(() => {
                this._uploadingBase64 = false;
            });
        }, 500);
    }

    /**
     * Авто-float: если картинка и текст оказались в одном <p>, применяем float для обтекания
     */
    _autoFloatImages() {
        if (!this.editor || !this.editor.root) return;
        const blocks = this.editor.root.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
        blocks.forEach(block => {
            const imgs = block.querySelectorAll('img');
            if (imgs.length === 0) return;

            // Есть ли текстовое содержимое (не только картинки)?
            const hasText = block.textContent.trim().length > 0;
            if (!hasText) return;

            imgs.forEach(img => {
                // Не трогаем картинки с явным режимом выравнивания или явным inline
                if (img.classList.contains('align-center') ||
                    img.classList.contains('align-left') ||
                    img.classList.contains('align-right') ||
                    img.getAttribute('data-wrap') === 'inline') return;
                const cs = img.style;
                if (cs.float && cs.float !== 'none') return;

                // Применяем float:left для обтекания текстом
                cs.float = 'left';
                cs.marginRight = '1em';
                cs.marginBottom = '0.5em';
                cs.marginLeft = '0';
            });
        });
    }

    /**
     * Настройка обработки ссылок
     */
    setupLinkHandling() {
        // Добавляем обработчик для открытия ссылок в новой вкладке
        // ТОЛЬКО в режиме просмотра — в режиме редактирования Quill сам управляет ссылками
        const editorElement = document.querySelector(`#${this.containerId} .ql-editor`);
        if (editorElement) {
            editorElement.addEventListener('click', (e) => {
                const link = e.target.closest('a');
                if (link && !this.editor.isEnabled()) {
                    e.preventDefault();
                    window.open(link.href, '_blank');
                }
            });
        }

        // Предотвращаем потерю фокуса с tooltip input при кликах на тулбар
        const toolbar = document.querySelector('.ql-toolbar.ql-snow');
        if (toolbar) {
            toolbar.addEventListener('mousedown', (e) => {
                // Если открыт tooltip для ввода ссылки — не дать тулбару забрать фокус
                const tooltip = document.querySelector('.ql-tooltip.ql-editing');
                if (tooltip && !e.target.closest('.ql-tooltip')) {
                    // Разрешаем только клик по кнопкам тулбара
                }
            });
        }
    }

    /**
     * Вставка изображений из буфера обмена (Ctrl+V)
     */
    setupClipboardPaste() {
        this.editor.root.addEventListener('paste', (e) => {
            if (!this.editor.isEnabled()) return;
            const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
            if (!items) return;
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = item.getAsFile();
                    if (file) this._uploadAndInsertImage(file);
                    return;
                }
            }
        });
    }

    /**
     * Drag & Drop изображений с рабочего стола
     */
    setupDragAndDrop() {
        const root = this.editor.root;
        let dragCounter = 0;

        root.addEventListener('dragenter', (e) => {
            if (!this.editor.isEnabled()) return;
            e.preventDefault();
            dragCounter++;
            if (dragCounter === 1) root.classList.add('img-drop-active');
        });

        root.addEventListener('dragover', (e) => {
            if (!this.editor.isEnabled()) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        root.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter <= 0) { dragCounter = 0; root.classList.remove('img-drop-active'); }
        });

        root.addEventListener('drop', (e) => {
            dragCounter = 0;
            root.classList.remove('img-drop-active');
            if (!this.editor.isEnabled()) return;
            e.preventDefault();
            e.stopPropagation();
            const files = e.dataTransfer?.files;
            if (!files || files.length === 0) return;
            for (const file of files) {
                if (file.type.startsWith('image/')) {
                    this._uploadAndInsertImage(file);
                }
            }
        });
    }

    /**
     * Общий метод загрузки и вставки изображения
     */
    async _uploadAndInsertImage(file) {
        if (file.size > 10 * 1024 * 1024) {
            alert('Размер изображения не должен превышать 10MB');
            return;
        }
        const formData = new FormData();
        formData.append('image', file);
        try {
            const response = await fetch('/api/upload/image', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: formData
            });
            if (!response.ok) throw new Error('Ошибка загрузки');
            const data = await response.json();
            const scrollY = window.scrollY;
            const range = this.editor.getSelection() || { index: this.editor.getLength() - 1 };
            this.editor.insertEmbed(range.index, 'image', data.url);
            // Insert a newline after the image so cursor has somewhere to go
            this.editor.insertText(range.index + 1, '\n');
            this.editor.setSelection(range.index + 2, 0);
            // Restore scroll position
            window.scrollTo(0, scrollY);
        } catch (err) {
            console.error('❌ Ошибка загрузки изображения:', err);
            alert('Ошибка загрузки изображения. Попробуйте ещё раз.');
        }
    }

    /**
     * Получение текущего ID страницы
     */
    getCurrentPageId() {
        const path = window.location.pathname;
        console.log('🔍 Определение page_id:');
        console.log('   📍 fullPath:', path);
        console.log('   🌐 hostname:', window.location.hostname);
        console.log('   🔗 href:', window.location.href);

        // Проверяем разные варианты путей
        // Вариант 1: /pages/temple.html -> temple
        let match = path.match(/\/pages\/([^\/]+)\.html/);
        console.log('   🔎 Проверка паттерна /pages/*.html: match =', match);
        if (match) {
            console.log('✅ Найден page_id через /pages/*.html:', match[1]);
            return match[1];
        }

        // Вариант 2: /temple.html -> temple
        match = path.match(/\/([^\/]+)\.html/);
        console.log('   🔎 Проверка паттерна /*.html: match =', match);
        if (match && match[1] !== 'index') {
            console.log('✅ Найден page_id через /*.html:', match[1]);
            return match[1];
        }

        // Вариант 3: /temple (без расширения) -> temple
        match = path.match(/\/([^\/]+)$/);
        console.log('   🔎 Проверка паттерна /* (без расширения): match =', match);
        if (match && match[1] !== '' && match[1] !== 'index') {
            console.log('✅ Найден page_id через /* (без расширения):', match[1]);
            return match[1];
        }

        // Вариант 4: путь заканчивается на / или пустой -> index
        console.log('ℹ️ Используется page_id по умолчанию: index');
        return 'index';
    }

    /**
     * Получение базового URL API
     */
    getApiBaseUrl() {
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000'
            : '';
    }

    /**
     * Загрузка контента из базы данных
     */
    async loadContent() {
        this._isLoadingContent = true;
        try {
            const pageId = this.getCurrentPageId();
            const apiUrl = `${this.getApiBaseUrl()}/api/content/${pageId}/rich-text-content`;

            console.log(`📥 Загрузка контента для страницы: ${pageId}`);

            const response = await fetch(apiUrl);

            if (!response.ok) {
                console.warn(`⚠️ API вернул статус ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data && result.data.content) {
                let contentHtml = result.data.content;

                // Сохраняем стили изображений из исходного HTML до вставки
                const imgMatches = contentHtml.match(/<img[^>]*>/g);
                const savedImageStyles = [];
                if (imgMatches) {
                    imgMatches.forEach(imgTag => {
                        const srcMatch = imgTag.match(/src="([^"]*)"/);
                        const styleMatch = imgTag.match(/style="([^"]*)"/);
                        const widthMatch = imgTag.match(/width="([^"]*)"/);
                        const heightMatch = imgTag.match(/height="([^"]*)"/);
                        if (srcMatch && (styleMatch || widthMatch || heightMatch)) {
                            savedImageStyles.push({
                                src: srcMatch[1],
                                style: styleMatch ? styleMatch[1] : null,
                                width: widthMatch ? widthMatch[1] : null,
                                height: heightMatch ? heightMatch[1] : null
                            });
                        }
                    });
                }

                // ПРОГРЕССИВНАЯ ЗАГРУЗКА: разбиваем HTML на блоки
                const blocks = this._splitContentIntoBlocks(contentHtml);
                console.log(`📦 Контент разбит на ${blocks.length} блоков`);

                if (blocks.length > 3) {
                    // Загружаем первые 3 блока сразу (above the fold)
                    const firstBatch = blocks.slice(0, 3).join('');
                    this.editor.root.innerHTML = firstBatch;

                    // Остальные блоки подгружаем порциями через requestAnimationFrame
                    let currentBatch = 3;
                    const batchSize = 3;

                    const loadNextBatch = () => {
                        if (currentBatch >= blocks.length) {
                            // Всё загружено — завершающие действия
                            this._afterContentLoaded(savedImageStyles);
                            return;
                        }

                        const end = Math.min(currentBatch + batchSize, blocks.length);
                        const fragment = document.createRange().createContextualFragment(
                            blocks.slice(currentBatch, end).join('')
                        );
                        this.editor.root.appendChild(fragment);
                        currentBatch = end;

                        // Следующая порция через requestAnimationFrame (не блокирует UI)
                        requestAnimationFrame(loadNextBatch);
                    };

                    requestAnimationFrame(loadNextBatch);
                } else {
                    // Маленький контент — грузим целиком
                    this.editor.root.innerHTML = contentHtml;
                    this._afterContentLoaded(savedImageStyles);
                }

                console.log('✅ Контент загружен из БД');
            } else {
                console.log('ℹ️ Контент не найден, используется пустой редактор');
                this.editor.setText('');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки контента:', error);
            if (this.editor) {
                this.editor.setText('');
            }
        } finally {
            // Снимаем флаг загрузки после завершения всех setTimeout
            setTimeout(() => {
                this._isLoadingContent = false;
            }, 300);
        }
    }

    /**
     * Разбивает HTML на массив блоков верхнего уровня для прогрессивной загрузки
     */
    _splitContentIntoBlocks(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const blocks = [];
        for (const child of temp.children) {
            blocks.push(child.outerHTML);
        }
        // Если парсинг не дал результатов — возвращаем весь HTML как один блок
        return blocks.length > 0 ? blocks : [html];
    }

    /**
     * Завершающие действия после загрузки контента
     */
    _afterContentLoaded(savedImageStyles) {
        // Убираем класс выделения
        this.editor.root.querySelectorAll('img.img-selected').forEach(img => {
            img.classList.remove('img-selected');
        });

        // Lazy loading для изображений (кроме первых 2)
        const allImages = this.editor.root.querySelectorAll('img');
        allImages.forEach((img, i) => {
            if (i >= 2) {
                if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
                if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
            }
        });

        // Восстанавливаем стили изображений
        if (savedImageStyles.length > 0) {
            setTimeout(() => {
                this.editor.root.querySelectorAll('img').forEach(img => {
                    const saved = savedImageStyles.find(s =>
                        img.src.includes(s.src) || (s.src && s.src.includes(img.getAttribute('src')))
                    );
                    if (saved) {
                        if (saved.style && !img.getAttribute('style')) img.setAttribute('style', saved.style);
                        if (saved.width && !img.getAttribute('width')) img.setAttribute('width', saved.width);
                        if (saved.height && !img.getAttribute('height')) img.setAttribute('height', saved.height);
                    }
                });
            }, 50);
        }

        // Lazy loading для iframe (видео)
        setTimeout(() => {
            this.editor.root.querySelectorAll('iframe').forEach(iframe => {
                if (!iframe.hasAttribute('loading')) iframe.setAttribute('loading', 'lazy');
            });
        }, 200);

        // Автозагрузка base64 на сервер (если ещё остались)
        this._uploadBase64Images();
    }

    /**
     * Автоматически находит base64 изображения в контенте и загружает их на сервер
     * Заменяет base64 на URL (предотвращает раздувание БД)
     */
    async _uploadBase64Images() {
        if (!this.editor) return;
        const images = this.editor.root.querySelectorAll('img[src^="data:image"]');
        if (images.length === 0) return;

        console.log(`🔄 Найдено ${images.length} base64 изображений, загружаем на сервер...`);

        for (const img of images) {
            try {
                const dataUrl = img.src;
                // Конвертируем base64 в Blob
                const response = await fetch(dataUrl);
                const blob = await response.blob();

                const formData = new FormData();
                formData.append('image', blob, 'pasted-image.png');

                const uploadResponse = await fetch('/api/upload/image', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                });

                if (uploadResponse.ok) {
                    const data = await uploadResponse.json();
                    // Сохраняем стили перед заменой
                    const style = img.getAttribute('style');
                    const width = img.getAttribute('width');
                    const height = img.getAttribute('height');

                    img.src = data.url;

                    // Восстанавливаем стили
                    if (style) img.setAttribute('style', style);
                    if (width) img.setAttribute('width', width);
                    if (height) img.setAttribute('height', height);

                    console.log(`  ✅ base64 → ${data.url}`);
                }
            } catch (err) {
                console.warn('  ⚠️ Не удалось загрузить base64 изображение:', err.message);
            }
        }

        // Сохраняем обновлённый контент (без base64)
        if (images.length > 0) {
            console.log('💾 Сохраняем контент без base64...');
            this.saveContent();
        }
    }

    /**
     * Сохранение контента в базу данных
     */
    async saveContent() {
        try {
            const pageId = this.getCurrentPageId();

            // ОПТИМИЗАЦИЯ: Убираем служебные атрибуты и классы перед сохранением
            const clonedRoot = this.editor.root.cloneNode(true);
            clonedRoot.querySelectorAll('img[loading], img[decoding]').forEach(img => {
                img.removeAttribute('loading');
                img.removeAttribute('decoding');
            });
            clonedRoot.querySelectorAll('iframe[loading]').forEach(iframe => {
                iframe.removeAttribute('loading');
            });
            // Убираем класс выделения изображений из редактора
            clonedRoot.querySelectorAll('img.img-selected').forEach(img => {
                img.classList.remove('img-selected');
            });
            const content = clonedRoot.innerHTML;

            console.log('💾 Начало сохранения контента:', {
                pageId,
                contentLength: content.length,
                contentPreview: content.substring(0, 100) + '...'
            });

            // КРИТИЧЕСКИ ВАЖНО: Проверяем inline стили в изображениях перед сохранением
            const images = this.editor.root.querySelectorAll('img');
            console.log('🖼️ Изображений перед сохранением:', images.length);
            images.forEach((img, i) => {
                if (i < 3) {
                    console.log(`  Изображение ${i + 1}:`, {
                        src: img.src.substring(0, 50) + '...',
                        width: img.style.width || img.width || 'не задано',
                        height: img.style.height || img.height || 'не задано',
                        hasStyleAttr: img.hasAttribute('style'),
                        styleAttr: img.getAttribute('style')
                    });
                }
            });

            // Проверяем наличие inline стилей в HTML
            const imgMatches = content.match(/<img[^>]*>/g);
            if (imgMatches) {
                console.log('🖼️ Изображений в HTML:', imgMatches.length);
                imgMatches.slice(0, 3).forEach((img, i) => {
                    console.log(`  HTML изображения ${i + 1}:`, img);
                });
            }

            const response = await fetch(`${this.getApiBaseUrl()}/api/content/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    page_id: pageId,
                    element_id: 'rich-text-content',
                    element_type: 'rich-text',
                    selector: '.rich-text-editor-container',
                    content: content
                })
            });

            console.log('📡 Ответ сервера:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            const result = await response.json();

            if (result.success) {
                this.showSaveIndicator('success', 'Сохранено');
                console.log('✅ Контент успешно сохранен:', result);
            } else {
                this.showSaveIndicator('error', 'Ошибка сохранения');
                console.error('❌ Ошибка сохранения:', result.error);
            }
        } catch (error) {
            this.showSaveIndicator('error', 'Ошибка сохранения');
            console.error('❌ Ошибка сохранения контента:', error);
            console.error('Детали ошибки:', {
                message: error.message,
                stack: error.stack
            });
        }
    }

    /**
     * Обновление режима редактирования
     */
    updateEditMode() {
        const isEditMode = document.body.classList.contains('edit-mode');

        if (this.editor) {
            if (isEditMode) {
                this.editor.enable();
                setTimeout(() => {
                    this.wrapVideoIframes();
                }, 100);
            } else {
                this.editor.disable();
            }
        }
    }

    /**
     * Получение контента
     */
    getContent() {
        return this.editor ? this.editor.root.innerHTML : '';
    }

    /**
     * Установка контента
     */
    setContent(html) {
        if (this.editor) {
            this.editor.root.innerHTML = html;
        }
    }

    /**
     * Очистка редактора
     */
    clear() {
        if (this.editor) {
            this.editor.setText('');
        }
    }
}

// Глобальная инициализация
window.RichTextEditor = RichTextEditor;

// Автоматическая инициализация при загрузке страницы
// КРИТИЧЕСКИ ВАЖНО: Инициализируем НЕМЕДЛЕННО, ДО других скриптов
(function() {
    // Проверяем наличие .page-content сразу при загрузке скрипта
    const checkAndInit = () => {
        const pageContent = document.querySelector('.page-content');

        if (pageContent) {
            console.log('🚀 НЕМЕДЛЕННАЯ инициализация Rich Text Editor...');

            // КРИТИЧЕСКИ ВАЖНО: Немедленно очищаем контейнер от любого контента
            console.log('🧹 Предварительная очистка .page-content...');
            while (pageContent.firstChild) {
                pageContent.removeChild(pageContent.firstChild);
            }

            // Создаем глобальный флаг, что редактор активен
            window.__RICH_TEXT_EDITOR_ACTIVE__ = true;

            // Инициализируем редактор
            window.richTextEditor = new RichTextEditor();
            window.richTextEditor.initialize().then(() => {
                console.log('✅ Rich Text Editor полностью инициализирован');
            });

            // Слушаем изменения режима редактирования
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class' && window.richTextEditor) {
                        window.richTextEditor.updateEditMode();
                    }
                });
            });

            observer.observe(document.body, {
                attributes: true,
                attributeFilter: ['class']
            });
        }
    };

    // Пытаемся инициализировать сразу
    if (document.readyState === 'loading') {
        // DOM еще не готов, ждем
        document.addEventListener('DOMContentLoaded', checkAndInit);
    } else {
        // DOM уже готов, инициализируем немедленно
        checkAndInit();
    }
})();

