/**
 * Smart Image Loader — Безопасная подмена PNG→WebP
 * 
 * Стратегия:
 * - НЕ меняем DOM-структуру (не оборачиваем, не удаляем src)
 * - Просто подменяем src на оптимизированный WebP когда он готов
 * - Серверный middleware уже отдаёт WebP автоматически (Accept negotiation)
 * - Этот скрипт — дополнительная клиентская оптимизация + LQIP  
 */

(function() {
    'use strict';

    let lqipData = {};
    let supportsWebP = false;

    /**
     * Загрузка LQIP данных
     */
    async function loadLQIPData() {
        try {
            const response = await fetch('/images/optimized/lqip-data.json');
            if (response.ok) {
                lqipData = await response.json();
            }
        } catch (e) {
            // Не критично
        }
    }

    /**
     * Проверка поддержки WebP
     */
    function checkWebPSupport() {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = function() { supportsWebP = img.height === 1; resolve(); };
            img.onerror = function() { supportsWebP = false; resolve(); };
            img.src = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiTjN/gD/AAA=';
        });
    }

    /**
     * Получает WebP путь для изображения
     */
    function getWebPPath(originalSrc) {
        // Нормализуем путь (убираем origin если есть)
        const normalized = originalSrc.replace(window.location.origin + '/', '').replace(/^\//, '');
        const data = lqipData[normalized];
        if (data && data.webp) {
            return data.webp;
        }
        // Стандартный путь
        return normalized
            .replace(/^images\//, 'images/optimized/')
            .replace(/\.(png|jpg|jpeg)$/i, '.webp');
    }

    /**
     * Безопасная подмена src на WebP (без изменения DOM)
     */
    function upgradeToWebP(img) {
        if (img.dataset.upgraded) return;
        img.dataset.upgraded = 'true';

        const originalSrc = img.getAttribute('src');
        if (!originalSrc) return;
        if (!/\.(png|jpe?g)$/i.test(originalSrc)) return;

        const webpPath = getWebPPath(originalSrc);
        
        // Предзагружаем WebP, подменяем только если успешно
        const loader = new Image();
        loader.onload = function() {
            img.src = webpPath;
        };
        // При ошибке — оставляем оригинальный src, ничего не ломается
        loader.src = webpPath;
    }

    /**
     * Добавляет LQIP placeholder к картуш-изображениям
     */
    function addLQIP(img) {
        const src = img.getAttribute('src');
        if (!src) return;
        
        const normalized = src.replace(window.location.origin + '/', '').replace(/^\//, '');
        const data = lqipData[normalized];
        if (!data || !data.lqip) return;

        const container = img.closest('.image-container');
        if (!container) return;
        if (container.querySelector('.img-lqip')) return; // уже есть

        // Добавляем размытый placeholder ПОД основное изображение
        const lqipEl = document.createElement('img');
        lqipEl.className = 'img-lqip';
        lqipEl.src = data.lqip;
        lqipEl.alt = '';
        lqipEl.setAttribute('aria-hidden', 'true');
        container.insertBefore(lqipEl, container.firstChild);

        // Когда основная картинка загрузится — убираем LQIP
        if (img.complete && img.naturalWidth > 0) {
            fadeOutLQIP(lqipEl);
        } else {
            img.addEventListener('load', function() {
                fadeOutLQIP(lqipEl);
            }, { once: true });
        }
    }

    function fadeOutLQIP(lqipEl) {
        lqipEl.style.transition = 'opacity 0.4s ease';
        lqipEl.style.opacity = '0';
        setTimeout(() => lqipEl.remove(), 500);
    }

    /**
     * Инициализация
     */
    async function init() {
        await checkWebPSupport();
        await loadLQIPData();

        if (!supportsWebP) {
            console.log('ℹ️ Браузер не поддерживает WebP, используем оригиналы');
            return;
        }

        // Подменяем src у всех подходящих изображений
        const images = document.querySelectorAll(
            '.cartouche-image, .overlay-image, .symbols-image, .site-logo img'
        );

        images.forEach(img => {
            // LQIP для фоновых картушей
            if (img.classList.contains('cartouche-image')) {
                addLQIP(img);
            }
            // Подмена на WebP
            upgradeToWebP(img);
        });

        console.log('🚀 Smart Image Loader: ' + images.length + ' изображений оптимизировано');
    }

    // Запуск после DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.SmartImageLoader = {
        upgradeToWebP: upgradeToWebP,
        getLQIPData: () => lqipData
    };

})();
