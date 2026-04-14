// Компонент поиска контента на сайте
class SearchComponent {
    constructor() {
        this.searchBox = null;
        this.searchInput = null;
        this.resultsDropdown = null;
        this.debounceTimer = null;
        this.debounceDelay = 300;
        this.minChars = 2;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Создаем компонент поиска
        this.createSearchComponent();
        
        // Добавляем обработчики событий
        this.bindEvents();
        
        console.log('✅ Компонент поиска инициализирован');
    }

    createSearchComponent() {
        // Проверяем, есть ли уже компонент поиска
        if (document.querySelector('.search-component')) {
            this.searchBox = document.querySelector('.search-component');
            this.searchInput = this.searchBox.querySelector('.search-input');
            this.resultsDropdown = this.searchBox.querySelector('.search-results-dropdown');
            return;
        }

        // Создаем контейнер поиска
        this.searchBox = document.createElement('div');
        this.searchBox.className = 'search-component';

        // Создаем input поиска
        this.searchInput = document.createElement('input');
        this.searchInput.type = 'text';
        this.searchInput.className = 'search-input';
        this.searchInput.placeholder = 'Поиск...';
        this.searchInput.setAttribute('aria-label', 'Поиск контента');

        // Создаем иконку поиска (простая SVG)
        const searchIcon = document.createElement('span');
        searchIcon.className = 'search-icon';
        searchIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>`;

        // Создаем кнопку очистки
        const clearBtn = document.createElement('button');
        clearBtn.className = 'search-clear-btn';
        clearBtn.type = 'button';
        clearBtn.innerHTML = '✕';
        clearBtn.title = 'Очистить поиск';
        clearBtn.style.display = 'none';

        // Создаем dropdown для результатов
        this.resultsDropdown = document.createElement('div');
        this.resultsDropdown.className = 'search-results-dropdown';

        // Собираем компонент
        this.searchBox.appendChild(searchIcon);
        this.searchBox.appendChild(this.searchInput);
        this.searchBox.appendChild(clearBtn);
        this.searchBox.appendChild(this.resultsDropdown);

        // Добавляем в DOM — в обёртку с кнопкой входа
        const wrapper = document.querySelector('.search-login-wrapper');
        if (wrapper) {
            const loginZone = wrapper.querySelector('.frame-login-zone');
            if (loginZone) {
                wrapper.insertBefore(this.searchBox, loginZone);
            } else {
                wrapper.prepend(this.searchBox);
            }
        } else {
            // Fallback: добавляем в body
            document.body.appendChild(this.searchBox);
        }

        console.log('✅ Компонент поиска создан в DOM');
    }

    bindEvents() {
        if (!this.searchInput) return;

        // Обработчик ввода с debounce
        this.searchInput.addEventListener('input', (e) => {
            this.handleInput(e);
        });

        // Очистка при Escape
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSearch();
            }
        });

        // Закрытие dropdown при клике вне
        document.addEventListener('click', (e) => {
            if (!this.searchBox.contains(e.target)) {
                this.closeResults();
            }
        });

        // Обработчик кнопки очистки
        const clearBtn = this.searchBox.querySelector('.search-clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearSearch();
            });
        }
    }

    handleInput(e) {
        const query = e.target.value.trim();
        const clearBtn = this.searchBox.querySelector('.search-clear-btn');

        // Показываем/скрываем кнопку очистки
        if (clearBtn) {
            clearBtn.style.display = query.length > 0 ? 'block' : 'none';
        }

        // Очищаем предыдущий таймер
        clearTimeout(this.debounceTimer);

        if (query.length < this.minChars) {
            this.closeResults();
            return;
        }

        // Устанавливаем новый таймер для поиска
        this.debounceTimer = setTimeout(() => {
            this.performSearch(query);
        }, this.debounceDelay);
    }

    async performSearch(query) {
        try {
            const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&limit=15`);
            
            const data = await response.json();
            
            // Проверяем наличие ошибки в ответе
            if (data.error) {
                console.error('Ошибка API:', data.error);
                this.showNoResults();
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка поиска');
            }

            if (data.success && data.data && data.data.length > 0) {
                this.displayResults(data.data, query);
            } else {
                this.showNoResults();
            }
        } catch (error) {
            console.error('Ошибка выполнения поиска:', error);
            this.showNoResults();
        }
    }

    displayResults(results, query) {
        // Группируем результаты по страницам
        const groupedByPage = {};
        
        results.forEach(result => {
            if (!groupedByPage[result.page_id]) {
                groupedByPage[result.page_id] = [];
            }
            groupedByPage[result.page_id].push(result);
        });

        // Генерируем HTML результатов
        let html = '<div class="search-results">';

        Object.entries(groupedByPage).forEach(([pageId, items]) => {
            // Определяем название страницы
            const pageName = this.getPageName(pageId);
            
            html += `<div class="search-result-group">`;
            html += `<div class="search-result-page-name">${pageName}</div>`;
            
            items.forEach(item => {
                const highlighted = this.highlightQuery(item.context, query);
                html += `
                    <div class="search-result-item" data-page-id="${pageId}" data-element-id="${item.element_id}">
                        <div class="search-result-context">${highlighted}</div>
                    </div>
                `;
            });
            
            html += `</div>`;
        });

        html += '</div>';

        this.resultsDropdown.innerHTML = html;
        this.resultsDropdown.style.display = 'block';

        // Добавляем обработчики кликов на результаты
        const items = this.resultsDropdown.querySelectorAll('.search-result-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                const pageId = item.getAttribute('data-page-id');
                const elementId = item.getAttribute('data-element-id');
                this.closeResults();
                this.searchInput.value = '';
                const clearBtn = this.searchBox.querySelector('.search-clear-btn');
                if (clearBtn) clearBtn.style.display = 'none';
                this.navigateToPage(pageId, elementId);
            });
        });
    }

    showNoResults() {
        this.resultsDropdown.innerHTML = `
            <div class="search-results">
                <div class="search-result-empty">Результатов не найдено</div>
            </div>
        `;
        this.resultsDropdown.style.display = 'block';
    }

    showError() {
        this.resultsDropdown.innerHTML = `
            <div class="search-results">
                <div class="search-result-error">Ошибка при поиске. Попробуйте позже.</div>
            </div>
        `;
        this.resultsDropdown.style.display = 'block';
    }

    highlightQuery(text, query) {
        // Экранируем специальные символы в регулярном выражении
        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>').substring(0, 150);
    }

    getPageName(pageId) {
        // Преобразуем ID страницы в читаемое название
        const pageNames = {
            'index': 'Главная страница',
            'pyramid': 'Пирамида ТОТА',
            'temple': 'Храм Исиды',
            'complex': 'Комплекс ТОТА',
            'court': 'Суд фараона',
            'forum': 'Форум',
            'news': 'Новости',
            'programs': 'Программы',
            'seminars': 'Семинары',
            'school-tota': 'Школа ТОТА',
            'school-isais': 'Школа Исаис',
            'rods': 'Жезлы',
            'visit': 'Посещение',
            'recordings': 'Записи',
            'consultations': 'Консультации'
        };

        // Получаем базовое имя (без расширения)
        const baseName = pageId.replace(/\.html$/, '').split('/').pop();
        return pageNames[baseName] || baseName.toUpperCase();
    }

    navigateToPage(pageId, elementId) {
        // Определяем, находимся ли уже на целевой странице
        const currentPath = window.location.pathname;
        const currentPageId = currentPath
            .replace(/^\/pages\//, '')
            .replace(/\.html$/, '')
            .replace(/\/$/, '') || 'index';

        if (currentPageId === pageId || (pageId === 'index' && (currentPath === '/' || currentPath.endsWith('index.html')))) {
            // Уже на нужной странице — плавно промотаем к элементу
            this._scrollToElement(elementId);
            return;
        }

        // На другой странице — навигируем через SPA, затем промотка
        if (elementId) {
            const onNavigate = () => {
                document.removeEventListener('spa:navigate', onNavigate);
                // Даём время на загрузку контента из БД (RTE initialize)
                setTimeout(() => this._scrollToElement(elementId), 600);
            };
            document.addEventListener('spa:navigate', onNavigate);
        }

        let url = pageId;
        if (!url.endsWith('.html')) url += '.html';
        if (url !== 'index.html' && !url.startsWith('pages/')) url = 'pages/' + url;

        if (window.SPARouter) {
            const fullUrl = new URL(url, location.href).href;
            if (window.SPARouter.isInternalPage(fullUrl)) {
                const cleanUrl = window.SPARouter.normalizePageUrl(fullUrl);
                window.SPARouter.navigate(cleanUrl);
                return;
            }
        }
        window.location.href = url;
    }

    _scrollToElement(elementId) {
        if (!elementId) return;

        // Для rich-text-content — скроллим к .page-content (.ql-editor)
        let el = null;
        if (elementId === 'rich-text-content') {
            el = document.querySelector('.ql-editor') ||
                 document.querySelector('.rich-text-editor-container') ||
                 document.querySelector('.page-content');
        } else {
            // Блоки системы: [data-block-id="..."] или #id
            el = document.querySelector(`[data-block-id="${elementId}"]`) ||
                 document.getElementById(elementId);
        }

        if (!el) return;

        el.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Лёгкая подсветка элемента
        el.style.transition = 'box-shadow 0.4s';
        el.style.boxShadow = '0 0 0 3px rgba(218,165,32,0.6)';
        setTimeout(() => { el.style.boxShadow = ''; }, 1800);
    }

    clearSearch() {
        this.searchInput.value = '';
        this.closeResults();
        
        const clearBtn = this.searchBox.querySelector('.search-clear-btn');
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }

        this.searchInput.focus();
    }

    closeResults() {
        this.resultsDropdown.style.display = 'none';
        this.resultsDropdown.innerHTML = '';
    }
}

// Инициализируем компонент при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.searchComponent) {
            window.searchComponent = new SearchComponent();
        }
    });
} else {
    if (!window.searchComponent) {
        window.searchComponent = new SearchComponent();
    }
}