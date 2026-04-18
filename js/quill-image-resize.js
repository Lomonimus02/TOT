/**
 * Quill Image & Video Resize Module — Word-like experience
 * Изменение размера с сохранением пропорций, тулбар обтекания,
 * индикатор размера, свойства картинки, удаление, scroll-tracking
 */

class ImageResize {
    constructor(quill, options = {}) {
        this.quill = quill;
        this.options = options;
        this.currentElement = null;
        this.resizeContainer = null;
        this.sizeIndicator = null;
        this.isResizing = false;

        // Resize state
        this.startX = 0;
        this.startY = 0;
        this.startWidth = 0;
        this.startHeight = 0;
        this.aspectRatio = 1;
        this.currentHandle = null;

        // Bound handlers (for proper removal)
        this._onEditorClick = this._handleEditorClick.bind(this);
        this._onDocClick = this._handleDocClick.bind(this);
        this._onScroll = this._updateOverlayPosition.bind(this);
        this._onKeyDown = this._handleKeyDown.bind(this);

        this.init();
    }

    /* ========== INIT ========== */
    init() {
        // Clicks inside editor
        this.quill.root.addEventListener('click', this._onEditorClick, true);
        // Clicks outside editor
        document.addEventListener('click', this._onDocClick);
        // Scroll tracking
        window.addEventListener('scroll', this._onScroll, true);
        // Keyboard: Delete/Backspace удаляют выбранную картинку, Escape снимает выделение
        document.addEventListener('keydown', this._onKeyDown);

        // Ensure trailing paragraph after content changes (so user can always type below images)
        this.quill.on('text-change', (delta, oldDelta, source) => {
            // Не вмешиваемся при программной загрузке контента
            if (window.richTextEditor && window.richTextEditor._isLoadingContent) return;
            // Только если в delta есть вставка/удаление медиа (не на каждое нажатие клавиши)
            const hasMedia = delta && delta.ops && delta.ops.some(op =>
                (op.insert && typeof op.insert === 'object' && (op.insert.image || op.insert.video)) ||
                (op.delete !== undefined)
            );
            if (hasMedia) this._ensureTrailingParagraph();
        });
        // Also check on init — only when editor is enabled (not readOnly)
        setTimeout(() => { if (this.quill.isEnabled()) this._ensureTrailingParagraph(); }, 500);

        // Context menu (right-click)
        this._initContextMenu();
        // Hover tooltip showing dimensions
        this._initHoverTooltip();

        // Double-click opens properties
        this.quill.root.addEventListener('dblclick', (e) => {
            const el = this._findMedia(e);
            if (el && el.tagName === 'IMG' && this.quill.isEnabled()) {
                e.preventDefault();
                e.stopPropagation();
                this.showResizeHandles(el);
                this._openProperties();
            }
        }, true);
    }

    /* ========== EVENT HELPERS ========== */
    _findMedia(e) {
        if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') return e.target;
        if (e.target.tagName === 'IFRAME' && e.target.classList.contains('ql-video')) return e.target;
        // Check iframes under cursor (pointer-events:none in edit mode)
        const iframes = this.quill.root.querySelectorAll('iframe.ql-video');
        for (const iframe of iframes) {
            const r = iframe.getBoundingClientRect();
            if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) return iframe;
        }
        return null;
    }

    _handleEditorClick(e) {
        const media = this._findMedia(e);
        if (media && this.quill.isEnabled()) {
            e.preventDefault();
            e.stopPropagation();
            this.showResizeHandles(media);
        } else if (!e.target.closest('.resize-container') && !e.target.closest('.img-props-modal')) {
            this.hideResizeHandles();
        }
    }

    _handleDocClick(e) {
        if (!this.quill.root.contains(e.target) &&
            !e.target.closest('.resize-container') &&
            !e.target.closest('.img-props-modal') &&
            !e.target.closest('.ql-tooltip')) {
            this.hideResizeHandles();
        }
    }

    _handleKeyDown(e) {
        if (!this.currentElement) return;
        // Skip if typing in a dialog input
        if (e.target.closest('input, textarea, [contenteditable="true"]:not(.ql-editor)')) return;
        if (document.querySelector('.img-props-modal')) return;

        if (e.key === 'Escape') {
            const el = this.currentElement;
            this.hideResizeHandles();
            this._placeCursorNear(el, 'after');
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            this._handleEnterOnImage();
            return;
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            this._deleteCurrentElement();
            return;
        }
        // Ctrl+C / Ctrl+X / Ctrl+V for images
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            this._copyImage();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
            e.preventDefault();
            this._cutImage();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'v' && ImageResize._clipboard) {
            e.preventDefault();
            this._pasteImage();
            return;
        }
        // Arrow keys: deselect image and move cursor
        if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(e.key)) {
            const el = this.currentElement;
            this.hideResizeHandles();
            const dir = (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? 'before' : 'after';
            this._placeCursorNear(el, dir);
            return;
        }
        // Any printable char: deselect image, place cursor after it, let the char be typed
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const el = this.currentElement;
            this.hideResizeHandles();
            this._placeCursorNear(el, 'after');
            // Don't prevent — let the keystroke pass through to Quill
        }
    }

    /* ========== SHOW / HIDE OVERLAY ========== */
    showResizeHandles(element) {
        this.hideResizeHandles();
        if (!this.quill.isEnabled()) return;

        this.currentElement = element;
        this.aspectRatio = element.naturalWidth
            ? element.naturalWidth / element.naturalHeight
            : element.offsetWidth / (element.offsetHeight || 1);

        const container = this.quill.root.parentElement;
        if (!container) return;

        // Overlay
        this.resizeContainer = document.createElement('div');
        this.resizeContainer.className = 'resize-container active';
        this.resizeContainer.style.position = 'absolute';
        this.resizeContainer.style.zIndex = '1999';
        this._positionOverlay();

        // 8 handles
        ['nw','n','ne','e','se','s','sw','w'].forEach(pos => {
            const h = document.createElement('div');
            h.className = `resize-handle resize-handle-${pos}`;
            h.dataset.position = pos;
            this.resizeContainer.appendChild(h);
        });

        // Toolbar
        this._addToolbar();

        // Size indicator
        this.sizeIndicator = document.createElement('div');
        this.sizeIndicator.className = 'resize-size-indicator';
        this.sizeIndicator.style.display = 'none';
        this.resizeContainer.appendChild(this.sizeIndicator);

        container.appendChild(this.resizeContainer);

        // Mouse handlers on overlay
        this.resizeContainer.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('resize-handle')) {
                this._startResize(e);
            }
        });

        // Mark image visually selected
        element.classList.add('img-selected');
    }

    hideResizeHandles() {
        if (this.currentElement) this.currentElement.classList.remove('img-selected');
        if (this.resizeContainer) { this.resizeContainer.remove(); this.resizeContainer = null; }
        this.sizeIndicator = null;
        this.currentElement = null;
        // Возвращаем фокус редактору ТОЛЬКО если:
        // — редактор активен (edit-mode, не readOnly)
        // — не открыт tooltip ссылки
        // — DOM-элемент редактора ещё в документе (не SPA-навигация)
        // — фокус сейчас не в другом интерактивном элементе (input/textarea/select)
        const activeTag = document.activeElement && document.activeElement.tagName;
        const focusInInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT' ||
            (document.activeElement && document.activeElement.isContentEditable && !document.activeElement.classList.contains('ql-editor'));
        const tooltip = document.querySelector('.ql-tooltip.ql-editing');
        if (!tooltip && !focusInInput && this.quill.isEnabled() && this.quill.root && document.contains(this.quill.root)) {
            const scrollY = window.scrollY;
            this.quill.focus();
            window.scrollTo(0, scrollY);
        }
    }

    /**
     * Снять все глобальные обработчики (вызывается при SPA-навигации)
     */
    destroy() {
        this.hideResizeHandles();
        this.quill.root.removeEventListener('click', this._onEditorClick, true);
        document.removeEventListener('click', this._onDocClick);
        window.removeEventListener('scroll', this._onScroll, true);
        document.removeEventListener('keydown', this._onKeyDown);
        this.quill.off('text-change');
    }

    _positionOverlay() {
        if (!this.resizeContainer || !this.currentElement) return;
        const elRect = this.currentElement.getBoundingClientRect();
        const parentRect = this.quill.root.parentElement.getBoundingClientRect();
        Object.assign(this.resizeContainer.style, {
            left: (elRect.left - parentRect.left) + 'px',
            top: (elRect.top - parentRect.top) + 'px',
            width: elRect.width + 'px',
            height: elRect.height + 'px'
        });
    }

    _updateOverlayPosition() {
        if (this.resizeContainer && this.currentElement) this._positionOverlay();
    }

    /* ========== TOOLBAR ========== */
    _addToolbar() {
        const bar = document.createElement('div');
        bar.className = 'media-resize-toolbar';

        // — Wrap modes (как в Word) —
        const wrapModes = [
            { name: 'inline',  icon: '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="1" y="5" width="7" height="8" rx="1" fill="currentColor" opacity=".35"/><line x1="10" y1="8" x2="17" y2="8" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="11" x2="17" y2="11" stroke="currentColor" stroke-width="1.5"/><line x1="1" y1="15" x2="17" y2="15" stroke="currentColor" stroke-width="1.5"/></svg>', title: 'В тексте' },
            { name: 'left',    icon: '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="1" y="1" width="7" height="7" rx="1" fill="currentColor" opacity=".35"/><line x1="10" y1="2" x2="17" y2="2" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="5" x2="17" y2="5" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="8" x2="17" y2="8" stroke="currentColor" stroke-width="1.5"/><line x1="1" y1="11" x2="17" y2="11" stroke="currentColor" stroke-width="1.5"/><line x1="1" y1="14" x2="17" y2="14" stroke="currentColor" stroke-width="1.5"/></svg>', title: 'Обтекание слева' },
            { name: 'center',  icon: '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="5.5" y="1" width="7" height="7" rx="1" fill="currentColor" opacity=".35"/><line x1="1" y1="11" x2="17" y2="11" stroke="currentColor" stroke-width="1.5"/><line x1="1" y1="14" x2="17" y2="14" stroke="currentColor" stroke-width="1.5"/></svg>', title: 'По центру' },
            { name: 'right',   icon: '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="10" y="1" width="7" height="7" rx="1" fill="currentColor" opacity=".35"/><line x1="1" y1="2" x2="8" y2="2" stroke="currentColor" stroke-width="1.5"/><line x1="1" y1="5" x2="8" y2="5" stroke="currentColor" stroke-width="1.5"/><line x1="1" y1="8" x2="8" y2="8" stroke="currentColor" stroke-width="1.5"/><line x1="1" y1="11" x2="17" y2="11" stroke="currentColor" stroke-width="1.5"/><line x1="1" y1="14" x2="17" y2="14" stroke="currentColor" stroke-width="1.5"/></svg>', title: 'Обтекание справа' }
        ];

        wrapModes.forEach(mode => {
            const btn = document.createElement('button');
            btn.className = 'media-toolbar-btn';
            btn.innerHTML = mode.icon;
            btn.title = mode.title;
            // Highlight active
            if (this.currentElement) {
                const isActive =
                    (mode.name === 'left' && this.currentElement.classList.contains('align-left')) ||
                    (mode.name === 'center' && this.currentElement.classList.contains('align-center')) ||
                    (mode.name === 'right' && this.currentElement.classList.contains('align-right')) ||
                    (mode.name === 'inline' && !this.currentElement.classList.contains('align-left') && !this.currentElement.classList.contains('align-center') && !this.currentElement.classList.contains('align-right'));
                if (isActive) btn.classList.add('active');
            }
            btn.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); };
            btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this._setWrapMode(mode.name); };
            bar.appendChild(btn);
        });

        // Separator
        const sep1 = document.createElement('span');
        sep1.className = 'media-toolbar-sep';
        bar.appendChild(sep1);

        // — Quick size presets —
        const presets = [
            { label: '¼', pct: 25, title: '25% ширины' },
            { label: '½', pct: 50, title: '50% ширины' },
            { label: '¾', pct: 75, title: '75% ширины' },
            { label: '⬛', pct: 100, title: '100% ширины' },
        ];
        presets.forEach(p => {
            const btn = document.createElement('button');
            btn.className = 'media-toolbar-btn media-toolbar-btn-sm';
            btn.textContent = p.label;
            btn.title = p.title;
            btn.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); };
            btn.onclick = (e) => {
                e.preventDefault(); e.stopPropagation();
                if (p.pct === 100) this._fitToPageWidth();
                else this._setSizePercent(p.pct);
            };
            bar.appendChild(btn);
        });

        // — Original size button (for IMG only) —
        if (this.currentElement && this.currentElement.tagName === 'IMG') {
            const origBtn = document.createElement('button');
            origBtn.className = 'media-toolbar-btn media-toolbar-btn-sm';
            origBtn.textContent = '↺';
            origBtn.title = 'Оригинальный размер';
            origBtn.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); };
            origBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this._resetToOriginalSize(); };
            bar.appendChild(origBtn);
        }

        // Separator
        const sep2 = document.createElement('span');
        sep2.className = 'media-toolbar-sep';
        bar.appendChild(sep2);

        // — Properties button —
        if (this.currentElement && this.currentElement.tagName === 'IMG') {
            const propsBtn = document.createElement('button');
            propsBtn.className = 'media-toolbar-btn';
            propsBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="9" y1="5" x2="9" y2="5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="9" y1="8" x2="9" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
            propsBtn.title = 'Свойства изображения';
            propsBtn.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); };
            propsBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this._openProperties(); };
            bar.appendChild(propsBtn);
        }

        // — Delete button —
        const delBtn = document.createElement('button');
        delBtn.className = 'media-toolbar-btn media-toolbar-btn-danger';
        delBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18"><polyline points="4,5 5,15 13,15 14,5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/><line x1="3" y1="5" x2="15" y2="5" stroke="currentColor" stroke-width="1.5"/><polyline points="7,5 7,3 11,3 11,5" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>';
        delBtn.title = 'Удалить';
        delBtn.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); };
        delBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this._deleteCurrentElement(); };
        bar.appendChild(delBtn);

        this.resizeContainer.appendChild(bar);
    }

    /* ========== WRAP / ALIGNMENT ========== */
    _setWrapMode(mode) {
        if (!this.currentElement) return;
        this.currentElement.classList.remove('align-left', 'align-center', 'align-right');
        // Всегда очищаем инлайн-стили позиционирования, чтобы CSS-классы работали корректно
        this.currentElement.style.float = '';
        this.currentElement.style.display = '';
        this.currentElement.style.marginRight = '';
        this.currentElement.style.marginBottom = '';
        this.currentElement.style.marginLeft = '';
        if (mode === 'inline') {
            // Пользователь явно выбрал inline — метим
            this.currentElement.setAttribute('data-wrap', 'inline');
        } else {
            this.currentElement.removeAttribute('data-wrap');
            this.currentElement.classList.add(`align-${mode}`);
        }
        // Sync style attr for Quill blot
        this._syncBlotStyle();
        // Re-show to update active state in toolbar
        const el = this.currentElement;
        setTimeout(() => { this.showResizeHandles(el); }, 60);
    }

    /* ========== DELETE ========== */
    _deleteCurrentElement() {
        if (!this.currentElement) return;
        const blot = Quill.find(this.currentElement);
        let cursorIdx = 0;
        if (blot) {
            cursorIdx = this.quill.getIndex(blot);
            this.quill.deleteText(cursorIdx, 1);
        } else {
            this.currentElement.remove();
        }
        this.hideResizeHandles();
        // Place cursor where the image was
        this.quill.setSelection(cursorIdx, 0);
        this._ensureTrailingParagraph();
    }

    /* ========== RESIZE ========== */
    _startResize(e) {
        e.preventDefault();
        e.stopPropagation();

        this.isResizing = true;
        this.currentHandle = e.target.dataset.position;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.startWidth = this.currentElement.offsetWidth;
        this.startHeight = this.currentElement.offsetHeight;
        this.aspectRatio = this.startWidth / (this.startHeight || 1);

        // Show size indicator
        if (this.sizeIndicator) {
            this.sizeIndicator.style.display = 'block';
            this.sizeIndicator.textContent = `${Math.round(this.startWidth)} × ${Math.round(this.startHeight)}`;
        }

        this._boundResize = this._handleResize.bind(this);
        this._boundStopResize = this._stopResize.bind(this);
        document.addEventListener('mousemove', this._boundResize);
        document.addEventListener('mouseup', this._boundStopResize);

        // Add body class for cursor override
        document.body.classList.add('img-resizing');
    }

    _handleResize(e) {
        if (!this.isResizing || !this.currentElement) return;
        e.preventDefault();

        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;
        const isCorner = ['nw','ne','se','sw'].includes(this.currentHandle);
        const lockAspect = isCorner && !e.shiftKey; // Corners lock ratio; Shift unlocks
        let newW = this.startWidth;
        let newH = this.startHeight;

        switch (this.currentHandle) {
            case 'e':  newW = this.startWidth + dx; break;
            case 'w':  newW = this.startWidth - dx; break;
            case 's':  newH = this.startHeight + dy; break;
            case 'n':  newH = this.startHeight - dy; break;
            case 'se': newW = this.startWidth + dx; newH = this.startHeight + dy; break;
            case 'sw': newW = this.startWidth - dx; newH = this.startHeight + dy; break;
            case 'ne': newW = this.startWidth + dx; newH = this.startHeight - dy; break;
            case 'nw': newW = this.startWidth - dx; newH = this.startHeight - dy; break;
        }

        newW = Math.max(30, newW);
        newH = Math.max(30, newH);

        if (lockAspect) {
            // Use the dimension with the larger delta to drive the other
            const dxAbs = Math.abs(dx);
            const dyAbs = Math.abs(dy);
            if (dxAbs >= dyAbs) {
                newH = newW / this.aspectRatio;
            } else {
                newW = newH * this.aspectRatio;
            }
            newW = Math.max(30, newW);
            newH = Math.max(30, newH);
        }

        this.currentElement.style.width = Math.round(newW) + 'px';
        if (this.currentElement.tagName === 'IMG' && lockAspect) {
            this.currentElement.style.height = 'auto';
        } else {
            this.currentElement.style.height = Math.round(newH) + 'px';
        }

        // Size indicator — показываем px и %
        const displayW = Math.round(this.currentElement.offsetWidth);
        const displayH = Math.round(this.currentElement.offsetHeight);
        const editorW = this.quill.root.clientWidth;
        const displayPct = editorW > 0 ? Math.round((displayW / editorW) * 100) : 0;
        if (this.sizeIndicator) {
            this.sizeIndicator.textContent = `${displayW} × ${displayH} (${displayPct}%)`;
        }

        this._positionOverlay();
    }

    _stopResize() {
        this.isResizing = false;
        document.removeEventListener('mousemove', this._boundResize);
        document.removeEventListener('mouseup', this._boundStopResize);
        document.body.classList.remove('img-resizing');

        if (this.sizeIndicator) this.sizeIndicator.style.display = 'none';

        // Конвертируем финальную ширину в % относительно редактора.
        // ВАЖНО: берём значение из style.width (то, что задал пользователь),
        // а не из offsetWidth — иначе при max-width: 100% размер "схлопывается" до 100%.
        if (this.currentElement) {
            const editorWidth = this.quill.root.clientWidth;
            const styleW = this.currentElement.style.width;
            let pxWidth = null;
            if (styleW && styleW.endsWith('px')) {
                pxWidth = parseFloat(styleW);
            }
            if (pxWidth === null || isNaN(pxWidth)) {
                pxWidth = this.currentElement.offsetWidth;
            }
            if (editorWidth > 0 && pxWidth > 0) {
                const pct = Math.round((pxWidth / editorWidth) * 1000) / 10; // до 0.1%
                this.currentElement.style.width = pct + '%';
                this.currentElement.style.height = 'auto';
            }
        }

        this._syncBlotStyle();
        // Refresh overlay after final sizing
        if (this.currentElement) {
            setTimeout(() => this._positionOverlay(), 30);
        }
    }

    /* ========== SYNC QUILL BLOT ========== */
    _syncBlotStyle() {
        if (!this.currentElement) return;
        const blot = Quill.find(this.currentElement);
        if (!blot) return;
        const style = this.currentElement.getAttribute('style');
        if (style) blot.format('style', style);
    }

    /* ========== PROPERTIES DIALOG ========== */
    _openProperties() {
        if (!this.currentElement || this.currentElement.tagName !== 'IMG') return;
        // Remove existing dialog
        document.querySelectorAll('.img-props-modal').forEach(m => m.remove());

        const img = this.currentElement;
        const editorWidth = this.quill.root.clientWidth;
        const currentPct = editorWidth > 0 ? Math.round((img.offsetWidth / editorWidth) * 10) / 10 : 100;
        const modal = document.createElement('div');
        modal.className = 'img-props-modal';
        modal.innerHTML = `
            <div class="img-props-dialog">
                <h3 class="img-props-title">Свойства изображения</h3>
                <div class="img-props-preview">
                    <img src="${img.src}" alt="">
                </div>
                <div class="img-props-fields">
                    <label>Ширина (% от страницы)
                        <input type="number" id="img-prop-w" value="${currentPct}" min="1" max="100" step="0.5">
                    </label>
                    <label>Высота
                        <input type="text" id="img-prop-h" value="авто" disabled>
                    </label>
                    <label class="img-props-full">Альтернативный текст
                        <input type="text" id="img-prop-alt" value="${img.alt || ''}" placeholder="Описание изображения">
                    </label>
                    <label>Отступ (px)
                        <input type="number" id="img-prop-margin" value="${parseInt(img.style.margin) || 8}" min="0" max="200">
                    </label>
                    <label>Скругление (px)
                        <input type="number" id="img-prop-radius" value="${parseInt(img.style.borderRadius) || 8}" min="0" max="200">
                    </label>
                </div>
                <div class="img-props-buttons">
                    <button class="img-props-btn primary" id="img-prop-apply">Применить</button>
                    <button class="img-props-btn" id="img-prop-cancel">Отмена</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);

        const wInput = modal.querySelector('#img-prop-w');

        // Apply
        modal.querySelector('#img-prop-apply').onclick = () => {
            img.style.width = wInput.value + '%';
            img.style.height = 'auto';
            img.alt = modal.querySelector('#img-prop-alt').value;
            const m = modal.querySelector('#img-prop-margin').value;
            img.style.margin = m + 'px';
            const r = modal.querySelector('#img-prop-radius').value;
            img.style.borderRadius = r + 'px';
            this._syncBlotStyle();
            // Update alt in blot
            const blot = Quill.find(img);
            if (blot) blot.format('alt', img.alt);
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 200);
            setTimeout(() => this.showResizeHandles(img), 80);
        };

        // Cancel / close
        const close = () => { modal.classList.remove('show'); setTimeout(() => modal.remove(), 200); };
        modal.querySelector('#img-prop-cancel').onclick = close;
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    }

    /* ========== CONTEXT MENU (right-click) ========== */
    _initContextMenu() {
        this.quill.root.addEventListener('contextmenu', (e) => {
            const media = this._findMedia(e);
            if (!media || !this.quill.isEnabled()) return;
            e.preventDefault();
            e.stopPropagation();
            this.showResizeHandles(media);
            this._showContextMenu(e.clientX, e.clientY);
        }, true);
    }

    _showContextMenu(x, y) {
        this._hideContextMenu();
        const menu = document.createElement('div');
        menu.className = 'img-context-menu';

        const isImg = this.currentElement && this.currentElement.tagName === 'IMG';
        const items = [
            ...(isImg ? [
                { label: 'Вырезать', icon: '✂', action: () => this._cutImage() },
                { label: 'Копировать', icon: '📋', action: () => this._copyImage() },
            ] : []),
            { label: '---' },
            ...(isImg ? [
                { label: 'Оригинальный размер', icon: '↺', action: () => this._resetToOriginalSize() },
            ] : []),
            { label: 'По ширине страницы', icon: '↔', action: () => this._fitToPageWidth() },
            { label: '50%', icon: '½', action: () => this._setSizePercent(50) },
            { label: '25%', icon: '¼', action: () => this._setSizePercent(25) },
            { label: '---' },
            ...(isImg ? [
                { label: 'Свойства...', icon: 'ⓘ', action: () => this._openProperties() },
            ] : []),
            { label: 'Удалить', icon: '🗑', action: () => this._deleteCurrentElement(), danger: true },
        ];

        items.forEach(item => {
            if (item.label === '---') {
                const sep = document.createElement('div');
                sep.className = 'img-ctx-sep';
                menu.appendChild(sep);
                return;
            }
            const row = document.createElement('div');
            row.className = 'img-ctx-item' + (item.danger ? ' danger' : '');
            row.innerHTML = `<span class="img-ctx-icon">${item.icon}</span><span>${item.label}</span>`;
            row.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); };
            row.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._hideContextMenu();
                item.action();
            };
            menu.appendChild(row);
        });

        // Position
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        document.body.appendChild(menu);

        // Adjust if off-screen
        requestAnimationFrame(() => {
            const rect = menu.getBoundingClientRect();
            if (rect.right > window.innerWidth) menu.style.left = (x - rect.width) + 'px';
            if (rect.bottom > window.innerHeight) menu.style.top = (y - rect.height) + 'px';
        });

        // Close on any click outside
        this._ctxCloseHandler = (e) => {
            if (!menu.contains(e.target)) this._hideContextMenu();
        };
        setTimeout(() => document.addEventListener('mousedown', this._ctxCloseHandler), 0);
    }

    _hideContextMenu() {
        document.querySelectorAll('.img-context-menu').forEach(m => m.remove());
        if (this._ctxCloseHandler) {
            document.removeEventListener('mousedown', this._ctxCloseHandler);
            this._ctxCloseHandler = null;
        }
    }

    /* ========== COPY / CUT ========== */
    _copyImage() {
        if (!this.currentElement || this.currentElement.tagName !== 'IMG') return;
        // Store src in a module-level clipboard (browser clipboard API requires user gesture for images)
        ImageResize._clipboard = {
            src: this.currentElement.src,
            style: this.currentElement.getAttribute('style') || '',
            alt: this.currentElement.alt || ''
        };
        this._showToast('Изображение скопировано');
    }

    _cutImage() {
        this._copyImage();
        this._deleteCurrentElement();
    }

    _pasteImage() {
        if (!ImageResize._clipboard) return;
        const clip = ImageResize._clipboard;
        const scrollY = window.scrollY;
        const range = this.quill.getSelection() || { index: this.quill.getLength() - 1 };
        this.quill.insertEmbed(range.index, 'image', clip.src);
        // Restore style
        setTimeout(() => {
            const imgs = this.quill.root.querySelectorAll('img');
            for (const img of imgs) {
                if (img.src === clip.src && !img.getAttribute('style')) {
                    if (clip.style) img.setAttribute('style', clip.style);
                    if (clip.alt) img.alt = clip.alt;
                    const blot = Quill.find(img);
                    if (blot && clip.style) blot.format('style', clip.style);
                    break;
                }
            }
        }, 50);
        this.quill.insertText(range.index + 1, '\n');
        this.quill.setSelection(range.index + 2, 0);
        window.scrollTo(0, scrollY);
    }

    /* ========== SIZE PRESETS ========== */
    _resetToOriginalSize() {
        if (!this.currentElement || this.currentElement.tagName !== 'IMG') return;
        const img = this.currentElement;
        if (img.naturalWidth) {
            // Сохраняем оригинальный размер как % от ширины редактора
            const editorWidth = this.quill.root.clientWidth;
            const pct = editorWidth > 0 ? Math.round((img.naturalWidth / editorWidth) * 1000) / 10 : 100;
            img.style.width = Math.min(pct, 100) + '%';
            img.style.height = 'auto';
            this._syncBlotStyle();
            setTimeout(() => this.showResizeHandles(img), 60);
            this._showToast(`${img.naturalWidth} × ${img.naturalHeight}`);
        }
    }

    _fitToPageWidth() {
        if (!this.currentElement) return;
        this.currentElement.style.width = '100%';
        if (this.currentElement.tagName === 'IMG') {
            this.currentElement.style.height = 'auto';
        }
        this._syncBlotStyle();
        const el = this.currentElement;
        setTimeout(() => this.showResizeHandles(el), 60);
    }

    _setSizePercent(pct) {
        if (!this.currentElement) return;
        this.currentElement.style.width = pct + '%';
        if (this.currentElement.tagName === 'IMG') {
            this.currentElement.style.height = 'auto';
        }
        this._syncBlotStyle();
        const el = this.currentElement;
        setTimeout(() => this.showResizeHandles(el), 60);
        this._showToast(`${pct}%`);
    }

    /* ========== ENTER KEY ========== */
    _handleEnterOnImage() {
        if (!this.currentElement) return;
        const el = this.currentElement;
        this.hideResizeHandles();
        const blot = Quill.find(el);
        if (blot) {
            const idx = this.quill.getIndex(blot) + 1;
            this.quill.insertText(idx, '\n');
            this.quill.setSelection(idx + 1, 0);
        }
    }

    /* ========== TOAST NOTIFICATION ========== */
    _showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'img-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 200);
        }, 1200);
    }

    /* ========== HOVER TOOLTIP (dimensions) ========== */
    _initHoverTooltip() {
        let tip = null;
        this.quill.root.addEventListener('mouseover', (e) => {
            if (!this.quill.isEnabled()) return;
            if (this.currentElement) return; // Don't show while selected
            const el = (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') ? e.target : null;
            if (!el) return;
            if (tip) tip.remove();
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            tip = document.createElement('div');
            tip.className = 'img-hover-tip';
            tip.textContent = `${w} × ${h}`;
            const rect = el.getBoundingClientRect();
            tip.style.left = (rect.left + rect.width / 2) + 'px';
            tip.style.top = (rect.top - 28) + 'px';
            document.body.appendChild(tip);
            requestAnimationFrame(() => tip && tip.classList.add('show'));
        });
        this.quill.root.addEventListener('mouseout', (e) => {
            if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
                if (tip) { tip.remove(); tip = null; }
            }
        });
    }

    /* ========== CURSOR HELPERS ========== */

    /**
     * Place Quill cursor before or after a given element
     */
    _placeCursorNear(element, direction) {
        if (!element) return;
        const blot = Quill.find(element);
        if (!blot) return;
        const index = this.quill.getIndex(blot);
        const pos = direction === 'after' ? index + 1 : index;
        this._ensureTrailingParagraph();
        // Clamp to valid range
        const len = this.quill.getLength();
        this.quill.setSelection(Math.min(pos, len - 1), 0);
    }

    /**
     * Ensure the editor ends with an empty paragraph so user can always
     * click/type below the last image (like Word's trailing ¶)
     */
    _ensureTrailingParagraph() {
        // Не трогаем DOM в режиме readOnly — иначе mutation → updateEditMode → setSelection(0,0)
        if (!this.quill.isEnabled()) return;
        const root = this.quill.root;
        const last = root.lastElementChild;
        // If last child is an image, video, iframe, or an element containing only an image
        const needsParagraph = !last ||
            last.tagName === 'IMG' ||
            last.tagName === 'VIDEO' ||
            last.tagName === 'IFRAME' ||
            (last.querySelector && last.querySelector('img, video, iframe') && !last.textContent.trim());
        if (needsParagraph) {
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            root.appendChild(p);
        }
    }
}

// Static clipboard
ImageResize._clipboard = null;

// Register module
if (window.Quill) {
    window.Quill.register('modules/imageResize', ImageResize);
}

