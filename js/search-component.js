// Компонент поиска контента на сайте
class SearchComponent {
    constructor() {
        this.searchBox = null;
        this.searchInput = null;
        this.resultsDropdown = null;
        this.debounceTimer = null;
        this.debounceDelay = 300;
        this.minChars = 2;
        this.activeSearchHighlight = null;
        this.highlightCleanupTimer = null;
        this.highlightName = 'search-highlight-inline';
        this.activeSearchController = null;
        this.searchRequestId = 0;
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
        const normalizedQuery = query.trim();
        const requestId = ++this.searchRequestId;

        if (this.activeSearchController) {
            this.activeSearchController.abort();
        }

        this.activeSearchController = new AbortController();

        try {
            const response = await fetch(`/api/search?query=${encodeURIComponent(normalizedQuery)}&limit=15`, {
                signal: this.activeSearchController.signal
            });
            
            const data = await response.json();

            if (requestId !== this.searchRequestId) {
                return;
            }

            if (!this.searchInput || this.searchInput.value.trim() !== normalizedQuery) {
                return;
            }
            
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
                this.displayResults(data.data, normalizedQuery);
            } else {
                this.showNoResults();
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                return;
            }

            console.error('Ошибка выполнения поиска:', error);
            this.showNoResults();
        } finally {
            if (requestId === this.searchRequestId) {
                this.activeSearchController = null;
            }
        }
    }

    displayResults(results, query) {
        // Группируем результаты по страницам
        const groupedByPage = {};
        const renderedItems = [];
        
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
                const highlighted = this.highlightQuery(item.context, query, item.match_start, item.match_length);
                renderedItems.push({
                    pageId,
                    elementId: item.element_id,
                    context: item.context,
                    matchStart: item.match_start,
                    matchLength: item.match_length
                });
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
        items.forEach((item, index) => {
            item.addEventListener('click', () => {
                const renderedItem = renderedItems[index];
                if (!renderedItem) return;

                this.closeResults();
                this.searchInput.value = '';
                const clearBtn = this.searchBox.querySelector('.search-clear-btn');
                if (clearBtn) clearBtn.style.display = 'none';
                this.navigateToPage(renderedItem.pageId, renderedItem.elementId, query, renderedItem.context);
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

    highlightQuery(text, query, matchStart = -1, matchLength = 0) {
        return this._highlightSnippet(text, query, matchStart, matchLength);
    }

    _highlightSnippet(text, query, matchStart = -1, matchLength = 0) {
        const truncated = text.length > 200 ? text.substring(0, 200) : text;
        const safeMatchLength = matchLength || query.length;

        if (
            Number.isInteger(matchStart) &&
            matchStart >= 0 &&
            safeMatchLength > 0 &&
            matchStart + safeMatchLength <= truncated.length
        ) {
            const before = truncated.slice(0, matchStart);
            const matched = truncated.slice(matchStart, matchStart + safeMatchLength);
            const after = truncated.slice(matchStart + safeMatchLength);

            return `${this._escapeHtml(before)}<mark>${this._escapeHtml(matched)}</mark>${this._escapeHtml(after)}`;
        }

        const escapedText = this._escapeHtml(truncated);
        const escapedQuery = this._escapeRegex(this._escapeHtml(query));
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        return escapedText.replace(regex, '<mark>$1</mark>');
    }

    _escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    _escapeRegex(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    getPageName(pageId) {
        // Преобразуем ID страницы в читаемое название
        const pageNames = {
            'index': 'Главная страница',
            'home': 'Главная страница',
            'pyramid': 'Пирамида ТОТА',
            'temple': 'Храм Исиды',
            'complex': 'Комплекс ТОТА',
            'court': 'Храмовый мистериальный двор',
            'forum': 'Форум',
            'news': 'Новости',
            'news-pyramid': 'Новости Пирамиды',
            'programs': 'Программы обучения',
            'seminars': 'Въездные семинары',
            'school-tota': 'Школа Пирамиды ТОТА',
            'school-isais': 'Женская Школа Isais',
            'about-isais': 'Об Исаис',
            'rods': 'Жезлы Фараонов',
            'visit': 'Посетить пирамиду',
            'recordings': 'Записи лекций',
            'consultations': 'Личные приёмы',
            'media': 'СМИ о Пирамиде',
            'artifacts': 'Артефакты',
            'projects': 'Проекты'
        };

        // Получаем базовое имя (без расширения)
        const baseName = pageId.replace(/\.html$/, '').split('/').pop();
        return pageNames[baseName] || baseName;
    }

    navigateToPage(pageId, elementId, query = '', context = '') {
        // Определяем, находимся ли уже на целевой странице
        const currentPath = window.location.pathname;
        // Нормализуем: убираем /pages/, .html, ведущий /, хвостовой /
        const currentPageId = currentPath
            .replace(/\/pages\//, '')
            .replace(/^\//, '')
            .replace(/\.html$/, '')
            .replace(/\/$/, '') || 'index';

        // Нормализуем target pageId тем же способом
        const targetPageId = pageId
            .replace(/\/pages\//, '')
            .replace(/^\//, '')
            .replace(/\.html$/, '')
            .replace(/\/$/, '') || 'index';


        if (currentPageId === targetPageId) {
            // Уже на нужной странице — плавно промотаем к элементу
            this._scrollToElement(elementId, query, context);
            return;
        }

        // На другой странице — навигируем через SPA, затем промотка
        if (elementId) {
            const onNavigate = () => {
                document.removeEventListener('spa:navigate', onNavigate);
                // Даём время на загрузку контента из БД (RTE initialize)
                setTimeout(() => this._scrollToElement(elementId, query, context), 600);
            };
            document.addEventListener('spa:navigate', onNavigate);
        }

        // Используем чистые URL (совпадающие с маршрутами сервера)
        const cleanPath = (targetPageId === 'index' || targetPageId === 'home')
            ? '/'
            : `/${targetPageId}`;

        if (window.SPARouter) {
            const fullUrl = new URL(cleanPath, location.origin).href;
            if (window.SPARouter.isInternalPage(fullUrl)) {
                window.SPARouter.navigate(fullUrl);
                return;
            }
        }
        window.location.href = cleanPath;
    }

    _scrollToElement(elementId, query = '', context = '') {
        if (!elementId) return;

        const el = this._resolveTargetElement(elementId) || this._resolveTargetElement('rich-text-content');

        if (!el) return;

        const matchTarget = query ? this._highlightTextMatch(el, query, context) : null;
        const scrollTarget = matchTarget || el;

        this._scrollNodeToViewportCenter(scrollTarget);

        if (!matchTarget) {
            this._pulseElement(el);
        }
    }

    _resolveTargetElement(elementId) {
        if (elementId === 'rich-text-content') {
            return document.querySelector('.ql-editor') ||
                   document.querySelector('.rich-text-editor-container') ||
                   document.querySelector('.page-content');
        }

        return document.querySelector(`[data-block-id="${elementId}"]`) ||
               document.getElementById(elementId);
    }

    _highlightTextMatch(container, query, context = '') {
        this._clearActiveHighlight();

        const match = this._findBestTextMatch(container, query, context);
        if (!match) return null;

        const highlightTarget = this._createMatchHighlight(match.node, match.index, match.length);
        if (!highlightTarget) return null;

        clearTimeout(this.highlightCleanupTimer);
        this.highlightCleanupTimer = setTimeout(() => this._clearActiveHighlight(), 2200);

        return highlightTarget;
    }

    _findBestTextMatch(container, query, context = '') {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return null;

        const normalizedQuery = trimmedQuery.toLowerCase();
        const normalizedContext = this._normalizeSearchText(context);
        const candidates = [];
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => {
                if (!node.nodeValue || !node.nodeValue.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }

                const parent = node.parentElement;
                if (!parent) {
                    return NodeFilter.FILTER_REJECT;
                }

                if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
                    return NodeFilter.FILTER_REJECT;
                }

                return NodeFilter.FILTER_ACCEPT;
            }
        });

        let node = walker.nextNode();
        let order = 0;

        while (node) {
            const nodeText = node.nodeValue;
            const lowerText = nodeText.toLowerCase();
            let fromIndex = 0;

            while (fromIndex < lowerText.length) {
                const index = lowerText.indexOf(normalizedQuery, fromIndex);
                if (index === -1) break;

                const preview = nodeText.substring(
                    Math.max(0, index - 40),
                    Math.min(nodeText.length, index + trimmedQuery.length + 80)
                );

                candidates.push({
                    node,
                    index,
                    length: trimmedQuery.length,
                    score: this._scoreTextCandidate(preview, normalizedContext, order)
                });

                fromIndex = index + trimmedQuery.length;
            }

            order += 1;
            node = walker.nextNode();
        }

        if (candidates.length === 0) {
            return null;
        }

        candidates.sort((left, right) => right.score - left.score);
        return candidates[0];
    }

    _scoreTextCandidate(preview, normalizedContext, order) {
        if (!normalizedContext) {
            return -order;
        }

        const normalizedPreview = this._normalizeSearchText(preview);
        const contextWords = normalizedContext.split(' ').filter(word => word.length > 2);
        let score = 0;

        if (normalizedPreview && (normalizedPreview.includes(normalizedContext) || normalizedContext.includes(normalizedPreview))) {
            score += 100;
        }

        contextWords.forEach(word => {
            if (normalizedPreview.includes(word)) {
                score += 5;
            }
        });

        return score - order;
    }

    _normalizeSearchText(text = '') {
        return text
            .replace(/\.\.\./g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    _createMatchHighlight(node, index, length) {
        const text = node.nodeValue || '';
        const matched = text.slice(index, index + length);
        if (!matched) return null;

        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + length);

        if (window.Highlight && window.CSS && CSS.highlights) {
            const highlight = new Highlight(range);
            CSS.highlights.set(this.highlightName, highlight);
            this.activeSearchHighlight = {
                type: 'css-highlight',
                range
            };
            return range;
        }

        const sourceElement = node.parentElement;
        if (!sourceElement) {
            range.detach?.();
            return null;
        }

        const rects = Array.from(range.getClientRects()).filter(rect => rect.width > 0 && rect.height > 0);
        const sourceRects = rects.length > 0
            ? rects
            : [range.getBoundingClientRect()].filter(rect => rect.width > 0 && rect.height > 0);

        if (sourceRects.length === 0) {
            range.detach?.();
            return null;
        }

        const computed = window.getComputedStyle(sourceElement);
        const overlays = sourceRects.map((rect) => {
            const overlay = document.createElement('span');
            overlay.className = 'search-highlight-inline';
            overlay.setAttribute('aria-hidden', 'true');
            overlay.style.left = `${window.scrollX + rect.left - 4}px`;
            overlay.style.top = `${window.scrollY + rect.top - 2}px`;
            overlay.style.minWidth = `${Math.max(rect.width + 8, 14)}px`;
            overlay.style.height = `${rect.height + 4}px`;
            overlay.style.font = computed.font;
            overlay.style.letterSpacing = computed.letterSpacing;
            overlay.style.textTransform = computed.textTransform;
            overlay.style.textDecoration = 'none';
            overlay.style.textAlign = 'left';
            overlay.style.lineHeight = `${rect.height}px`;
            document.body.appendChild(overlay);
            return overlay;
        });

        range.detach?.();
        this.activeSearchHighlight = {
            type: 'overlay',
            overlays
        };

        return overlays[0] || null;
    }

    _clearActiveHighlight() {
        clearTimeout(this.highlightCleanupTimer);
        this.highlightCleanupTimer = null;

        if (!this.activeSearchHighlight) {
            return;
        }

        if (this.activeSearchHighlight.type === 'css-highlight') {
            CSS.highlights.delete(this.highlightName);
            this.activeSearchHighlight.range?.detach?.();
        } else if (this.activeSearchHighlight.type === 'overlay') {
            this.activeSearchHighlight.overlays.forEach(marker => marker.remove());
        }

        this.activeSearchHighlight = null;
    }

    _scrollNodeToViewportCenter(node) {
        const headerOffset = this._getHeaderOffset();
        const nodeRect = node.getBoundingClientRect();
        const nodeCenterY = nodeRect.top + nodeRect.height / 2;
        const viewportH = window.innerHeight;
        const availableH = viewportH - headerOffset;
        const targetCenterY = headerOffset + availableH / 2;
        const scrollDelta = nodeCenterY - targetCenterY;

        window.scrollBy({ top: scrollDelta, behavior: 'smooth' });
    }

    _getHeaderOffset() {
        let maxBottom = 0;

        document.querySelectorAll('.search-login-wrapper, .site-logo').forEach(fixed => {
            const rect = fixed.getBoundingClientRect();
            if (rect.bottom > maxBottom) maxBottom = rect.bottom;
        });

        return maxBottom > 0 ? maxBottom + 16 : 140;
    }

    _pulseElement(el) {
        el.classList.add('search-highlight');
        setTimeout(() => el.classList.remove('search-highlight'), 2000);
    }

    clearSearch() {
        if (this.activeSearchController) {
            this.activeSearchController.abort();
            this.activeSearchController = null;
        }

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