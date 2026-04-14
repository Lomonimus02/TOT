// SPA Router для сайта "Пирамида ТОТА"
// Навигация без перезагрузки — хэдер, футер и фон остаются на месте
(function() {
    'use strict';

    // Известные страницы сайта (имя → true)
    const KNOWN_PAGES = new Set([
        'about-isais', 'artifacts', 'complex', 'consultations', 'court',
        'forum', 'media', 'news-pyramid', 'news', 'programs', 'projects',
        'pyramid', 'recordings', 'rods', 'school-isais', 'school-tota',
        'seminars', 'temple', 'visit'
    ]);

    const SPA = {
        cache: new Map(),
        loadedScripts: new Set(),
        transitioning: false,

        init() {
            // Запоминаем уже загруженные скрипты
            document.querySelectorAll('script[src]').forEach(s => {
                const src = s.src || s.getAttribute('src');
                if (src) this.loadedScripts.add(this.normalizeSrc(src));
            });

            // Перехват кликов по ссылкам (capture phase — срабатывает первым)
            document.addEventListener('click', this.onClick.bind(this), true);

            // Кнопка "Назад/Вперёд" в браузере
            window.addEventListener('popstate', this.onPopState.bind(this));

            // Запоминаем текущую страницу в history
            history.replaceState(
                { spa: true, url: location.href },
                document.title,
                location.href
            );

            console.log('🔄 SPA Router инициализирован');
        },

        // === URL утилиты ===

        normalizeSrc(src) {
            try {
                const u = new URL(src, location.origin);
                return u.pathname;
            } catch {
                return src.replace(/^\.\.\//, '/').replace(/^\.\//, '/');
            }
        },

        // Преобразование любого URL страницы в чистый вид (/programs вместо /pages/programs.html)
        normalizePageUrl(url) {
            const u = new URL(url, location.origin);
            let path = u.pathname;

            // /index.html → /
            if (path === '/index.html') return u.origin + '/';

            // /pages/X.html → /X
            let m = path.match(/^\/pages\/([\w-]+)\.html$/);
            if (m && KNOWN_PAGES.has(m[1])) return u.origin + '/' + m[1];

            // /X.html → /X
            m = path.match(/^\/([\w-]+)\.html$/);
            if (m && KNOWN_PAGES.has(m[1])) return u.origin + '/' + m[1];

            return u.href;
        },

        // Является ли URL внутренней страницей сайта
        isInternalPage(url) {
            try {
                const u = new URL(url, location.origin);
                if (u.origin !== location.origin) return false;
                // Если есть хеш на той же странице — не перехватываем
                if (u.hash && u.pathname === location.pathname) return false;

                const path = u.pathname;

                // Главная
                if (path === '/' || path === '/index.html') return true;

                // Короткий URL: /pageName
                let m = path.match(/^\/([\w-]+)$/);
                if (m && KNOWN_PAGES.has(m[1])) return true;

                // /pageName.html
                m = path.match(/^\/([\w-]+)\.html$/);
                if (m && KNOWN_PAGES.has(m[1])) return true;

                // /pages/pageName.html
                m = path.match(/^\/pages\/([\w-]+)\.html$/);
                if (m && KNOWN_PAGES.has(m[1])) return true;

                return false;
            } catch {
                return false;
            }
        },

        // === Обработка кликов ===

        onClick(e) {
            // Пропускаем если уже обработано
            if (e.defaultPrevented) return;
            // Пропускаем модификаторы (Ctrl+Click = новая вкладка)
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            if (e.button !== 0) return;

            const link = e.target.closest('a[href]');
            if (!link) return;

            // Пропускаем ссылки в новом окне
            if (link.target === '_blank') return;

            const href = link.getAttribute('href');
            if (!href) return;

            // Пропускаем нестраничные ссылки
            if (href.startsWith('#') || href.startsWith('mailto:') ||
                href.startsWith('tel:') || href.startsWith('javascript:')) return;

            // Определяем полный URL
            const fullUrl = new URL(href, location.href).href;
            if (!this.isInternalPage(fullUrl)) return;

            // Нормализуем URL
            const cleanUrl = this.normalizePageUrl(fullUrl);
            if (cleanUrl === location.href) return;

            // Перехватываем!
            e.preventDefault();
            e.stopPropagation();

            this.navigate(cleanUrl);
        },

        // === Навигация ===

        async navigate(url, pushState = true) {
            if (this.transitioning) return;
            this.transitioning = true;

            try {
                // Проверка несохранённых изменений (для админов)
                if (window.pageEditor && window.pageEditor.changes &&
                    Object.keys(window.pageEditor.changes).length > 0) {
                    if (!confirm('У вас есть несохранённые изменения. Покинуть страницу?')) {
                        this.transitioning = false;
                        return;
                    }
                }

                const mainEl = document.querySelector('main.main-content');
                if (!mainEl) {
                    window.location.href = url;
                    return;
                }

                // Плавное скрытие контента
                mainEl.classList.add('spa-fade-out');
                await this.wait(250);

                // Загрузка новой страницы
                const html = await this.fetchPage(url);
                if (!html) throw new Error('Пустой ответ');

                // Парсинг ответа
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const newMain = doc.querySelector('main.main-content');
                if (!newMain) throw new Error('Нет <main> в ответе');

                // Замена контента
                mainEl.innerHTML = newMain.innerHTML;

                // Перемещаем .page-navigation из main в body (перед footer),
                // чтобы навигация не зависела от flex-высоты main
                const oldExternalNav = document.querySelector('body > .page-navigation');
                if (oldExternalNav) oldExternalNav.remove();
                const pageNav = mainEl.querySelector('.page-navigation');
                const siteFooter = document.querySelector('.site-footer');
                if (pageNav && siteFooter) {
                    siteFooter.parentNode.insertBefore(pageNav, siteFooter);
                }

                // ОПТИМИЗАЦИЯ: Lazy loading для всех изображений
                mainEl.querySelectorAll('img').forEach(img => {
                    if (!img.hasAttribute('loading')) {
                        img.setAttribute('loading', 'lazy');
                    }
                    if (!img.hasAttribute('decoding')) {
                        img.setAttribute('decoding', 'async');
                    }
                });

                // Обновление <title>
                if (doc.title) document.title = doc.title;

                // Обновление meta description
                const newDesc = doc.querySelector('meta[name="description"]');
                const curDesc = document.querySelector('meta[name="description"]');
                if (newDesc && curDesc) curDesc.content = newDesc.content;

                // Обновление canonical
                const newCanon = doc.querySelector('link[rel="canonical"]');
                const curCanon = document.querySelector('link[rel="canonical"]');
                if (newCanon && curCanon) curCanon.href = newCanon.href;

                // КРИТИЧЕСКИ ВАЖНО: Уничтожаем старый редактор ДО смены className,
                // чтобы MutationObserver не вызвал updateEditMode на отсоединённом DOM
                if (window.richTextEditor) {
                    if (window.richTextEditor.destroy) window.richTextEditor.destroy();
                    window.richTextEditor = null;
                }

                // Обновление class на body
                document.body.className = doc.body.className;

                // Загрузка новых скриптов (если нужны)
                await this.loadNewScripts(doc);

                // Флаги из inline-скриптов
                this.processInlineScripts(doc);

                // Загрузка новых CSS (если нужны)
                this.loadNewStyles(doc);

                // Обновление URL в браузере
                if (pushState) {
                    history.pushState(
                        { spa: true, url: url },
                        document.title,
                        url
                    );
                }

                // Скролл наверх
                window.scrollTo({ top: 0, behavior: 'instant' });

                // Плавное появление
                mainEl.classList.remove('spa-fade-out');
                mainEl.classList.add('spa-fade-in');

                // Реинициализация компонентов страницы
                this.reinitPage();

                // Убираем класс анимации после завершения
                setTimeout(() => {
                    mainEl.classList.remove('spa-fade-in');
                }, 300);

            } catch (err) {
                console.error('SPA Router — ошибка навигации:', err);
                // Фоллбэк на обычную навигацию
                window.location.href = url;
            } finally {
                this.transitioning = false;
            }
        },

        // === Загрузка страницы ===

        async fetchPage(url) {
            const res = await fetch(url, {
                headers: { 'X-SPA-Request': '1' },
                credentials: 'same-origin'
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return await res.text();
        },

        // === Скрипты и стили ===

        async loadNewScripts(doc) {
            const scripts = doc.querySelectorAll('script[src]');
            for (const script of scripts) {
                const rawSrc = script.getAttribute('src');
                if (!rawSrc) continue;

                const normalizedSrc = this.normalizeSrc(
                    rawSrc.startsWith('http') ? rawSrc : new URL(rawSrc, location.origin).href
                );

                if (this.loadedScripts.has(normalizedSrc)) continue;

                // Получаем полный URL для загрузки
                let fullSrc = rawSrc;
                if (!rawSrc.startsWith('http')) {
                    // Переводим относительные пути (../js/xxx.js) в абсолютные (/js/xxx.js)
                    fullSrc = rawSrc.replace(/^\.\.\//, '/').replace(/^\.\//, '/');
                    if (!fullSrc.startsWith('/')) fullSrc = '/' + fullSrc;
                }

                try {
                    await this.loadScript(fullSrc);
                    this.loadedScripts.add(normalizedSrc);
                    console.log('📜 SPA: Загружен скрипт', fullSrc);
                } catch (err) {
                    console.warn('📜 SPA: Не удалось загрузить скрипт', fullSrc, err);
                }
            }
        },

        loadScript(src) {
            return new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = src;
                s.onload = resolve;
                s.onerror = reject;
                document.body.appendChild(s);
            });
        },

        loadNewStyles(doc) {
            const currentStyles = new Set();
            document.querySelectorAll('link[rel="stylesheet"]').forEach(l => {
                const href = l.getAttribute('href');
                if (href) currentStyles.add(this.normalizeSrc(href));
            });

            doc.querySelectorAll('link[rel="stylesheet"]').forEach(l => {
                const rawHref = l.getAttribute('href');
                if (!rawHref) return;

                const normalized = this.normalizeSrc(
                    rawHref.startsWith('http') ? rawHref : new URL(rawHref, location.origin).href
                );

                if (currentStyles.has(normalized)) return;

                // Добавляем новый CSS
                let fullHref = rawHref;
                if (!rawHref.startsWith('http')) {
                    fullHref = rawHref.replace(/^\.\.\//, '/').replace(/^\.\//, '/');
                    if (!fullHref.startsWith('/')) fullHref = '/' + fullHref;
                }

                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = fullHref;
                document.head.appendChild(link);
                console.log('🎨 SPA: Загружен стиль', fullHref);
            });
        },

        processInlineScripts(doc) {
            // Сбрасываем флаг перед проверкой новой страницы
            window.__RICH_TEXT_EDITOR_ACTIVE__ = false;
            doc.querySelectorAll('script:not([src])').forEach(script => {
                const text = script.textContent;
                if (text.includes('__RICH_TEXT_EDITOR_ACTIVE__')) {
                    window.__RICH_TEXT_EDITOR_ACTIVE__ = true;
                }
            });
        },

        // === Реинициализация после навигации ===

        reinitPage() {
            // Реинициализация функций из main.js
            if (typeof initializeNavigation === 'function') initializeNavigation();
            if (typeof initializeModals === 'function') initializeModals();
            if (typeof initializeSmoothScrolling === 'function') initializeSmoothScrolling();
            if (typeof initializeButtonClicks === 'function') initializeButtonClicks();
            if (typeof hideEmptyPageHeaders === 'function') hideEmptyPageHeaders();
            if (typeof hideEmptyContentSections === 'function') hideEmptyContentSections();

            // Пересоздание InlinePageEditor
            const oldToggle = document.querySelector('.edit-mode-toggle');
            if (oldToggle) oldToggle.remove();

            if (typeof InlinePageEditor === 'function') {
                try {
                    window.pageEditor = new InlinePageEditor();
                } catch (err) {
                    console.warn('SPA: Ошибка инициализации InlinePageEditor:', err);
                }
            }

            // Реинициализация Rich Text Editor
            if (window.__RICH_TEXT_EDITOR_ACTIVE__ && typeof RichTextEditor === 'function') {
                try {
                    // Старый экземпляр уже уничтожен до смены body.className (см. выше)
                    const oldToolbar = document.querySelector('body > .ql-toolbar.ql-snow');
                    if (oldToolbar) oldToolbar.remove();

                    window.richTextEditor = new RichTextEditor();
                    window.richTextEditor.initialize().then(() => {
                        console.log('✅ SPA: Rich Text Editor реинициализирован');
                    });
                } catch (err) {
                    console.warn('SPA: Ошибка инициализации RichTextEditor:', err);
                }
            }

            // Обновление года в подвале
            const yearEl = document.getElementById('currentYear');
            if (yearEl) yearEl.textContent = new Date().getFullYear();

            // Событие для остальных скриптов
            document.dispatchEvent(new CustomEvent('spa:navigate', {
                detail: { url: location.href }
            }));

            console.log('🔄 SPA: Страница реинициализирована —', location.pathname);
        },

        // === Кнопка «Назад/Вперёд» ===

        onPopState(e) {
            if (e.state && e.state.spa) {
                this.navigate(e.state.url, false);
            } else {
                this.navigate(location.href, false);
            }
        },

        // === Утилиты ===

        wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        // Очистка кеша (можно вызвать при сохранении контента из админки)
        clearCache() {
            this.cache.clear();
            console.log('🔄 SPA: Кеш очищен');
        }
    };

    // Инициализация
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SPA.init());
    } else {
        SPA.init();
    }

    // Глобальный доступ
    window.SPARouter = SPA;
})();
