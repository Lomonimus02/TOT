// Менеджер полноэкранной египетской рамки
class FrameManager {
    constructor() {
        this.frame = null;
        this.isVisible = true;
        this.init();
    }

    init() {
        // Ждем загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.frame = document.querySelector('.fullscreen-frame');
        
        if (!this.frame) {
            console.warn('Полноэкранная рамка не найдена');
            return;
        }

        // Проверяем, загружено ли изображение рамки
        this.checkFrameImage();
        
        // Создаем интерактивную зону для входа
        this.createLoginZone();
        
        // Добавляем обработчики событий
        this.bindEvents();
        
        // Устанавливаем начальное состояние (статично, без анимации)
        this.updateFrameVisibility();

        // Обновляем статус зоны входа при инициализации
        setTimeout(() => {
            this.updateLoginZoneStatus();
        }, 100);

        console.log('✅ Полноэкранная египетская рамка инициализирована');
    }

    checkFrameImage() {
        // Создаем временное изображение для проверки загрузки
        const testImg = new Image();
        testImg.onload = () => {
            console.log('✅ Изображение рамки успешно загружено');
            this.frame.classList.add('loaded');
        };
        testImg.onerror = () => {
            console.error('❌ Ошибка загрузки изображения рамки');
            this.frame.style.display = 'none';
        };
        testImg.src = this.getFrameImagePath();
    }

    getFrameImagePath() {
        // Определяем правильный путь к изображению в зависимости от текущей страницы
        const currentPath = window.location.pathname;
        const isInPagesFolder = currentPath.includes('/pages/');
        return isInPagesFolder ? '../images/decor/frame_extracted.png' : 'images/decor/frame_extracted.png';
    }

    createLoginZone() {
        // Убеждаемся, что верхняя панель существует (создаем при отсутствии)
        this.ensureTopPhotoMenu();

        // Создаем интерактивную зону для входа в верхней части рамки
        // Это будет либо ссылка на форум, либо кнопка администратора
        const loginZone = document.createElement('a');
        loginZone.className = 'frame-login-zone';
        loginZone.id = 'frame-login-zone';
        loginZone.href = 'https://forum.piramidaspb.ru/index.php?/login/';
        loginZone.target = '_blank';
        loginZone.rel = 'noopener noreferrer';

        // Создаем текстовый элемент для отображения статуса
        const loginText = document.createElement('span');
        loginText.className = 'frame-login-text';
        loginText.textContent = 'Вход';
        loginZone.appendChild(loginText);

        // Устанавливаем начальный title
        loginZone.title = 'Перейти на форум для входа';

        // Добавляем обработчик клика
        loginZone.addEventListener('click', (e) => {
            this.handleLoginZoneClick(e);
        });

        // Добавляем зону в DOM: теперь напрямую в body для правого верхнего угла
        document.body.appendChild(loginZone);

        // Сохраняем ссылку на зону для обновления
        this.loginZone = loginZone;
        this.loginText = loginText;

        // Обновляем статус при загрузке
        this.updateLoginZoneStatus();

        // Обновляем статус при создании
        this.updateLoginZoneStatus();

        console.log('✅ Зона входа в рамке создана');
    }

    ensureTopPhotoMenu() {
        if (!document.querySelector('.top-photo-menu')) {
            const bar = document.createElement('div');
            bar.className = 'top-photo-menu';
            const slot = document.createElement('div');
            slot.className = 'top-photo-center-slot';
            bar.appendChild(slot);
            document.body.insertBefore(bar, document.body.firstChild);
        } else if (!document.querySelector('.top-photo-center-slot')) {
            const bar = document.querySelector('.top-photo-menu');
            const slot = document.createElement('div');
            slot.className = 'top-photo-center-slot';
            bar.appendChild(slot);
        }
    }

    handleLoginZoneClick(e) {
        // Проверяем, авторизован ли администратор
        const userData = this.getCurrentUser();

        if (userData && userData.role === 'admin') {
            // Администратор авторизован - предотвращаем переход по ссылке и показываем меню выхода
            e.preventDefault();
            e.stopPropagation();
            this.showAdminMenu();
        }
        // Если не администратор - ссылка работает как обычно (переход на форум)
    }

    getCurrentUser() {
        // Используем SessionManager если доступен
        if (window.sessionManager && typeof window.sessionManager.getCurrentUser === 'function') {
            return window.sessionManager.getCurrentUser();
        }

        // Fallback: получаем данные пользователя из localStorage
        try {
            const userData = localStorage.getItem('user');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            return null;
        }
    }

    showUserMenu() {
        // Показываем красивое модальное окно с информацией о пользователе
        const userData = this.getCurrentUser();
        const userName = userData?.name || userData?.username || 'Пользователь';
        const isAdmin = userData?.role === 'admin' || userData?.is_admin === true;

        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'user-menu-modal';
        modal.innerHTML = `
            <div class="user-menu-content">
                <h3>Профиль пользователя</h3>
                <p><strong>Имя:</strong> ${userName}</p>
                <p><strong>Роль:</strong> ${isAdmin ? 'Администратор' : 'Пользователь'}</p>
                <div class="user-menu-buttons">
                    <button class="user-menu-btn cancel">Отмена</button>
                    <button class="user-menu-btn logout">Выйти</button>
                </div>
            </div>
        `;

        // Добавляем обработчики событий
        const cancelBtn = modal.querySelector('.cancel');
        const logoutBtn = modal.querySelector('.logout');

        cancelBtn.addEventListener('click', () => {
            this.closeUserMenu(modal);
        });

        logoutBtn.addEventListener('click', () => {
            this.logout();
            this.closeUserMenu(modal);
        });

        // Закрытие по клику на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeUserMenu(modal);
            }
        });

        // Закрытие по Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeUserMenu(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Добавляем в DOM и показываем
        document.body.appendChild(modal);

        // Анимация появления
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
    }

    showAdminMenu() {
        // Показываем диалоговое окно с подтверждением выхода для администратора
        const userData = this.getCurrentUser();
        const userName = userData?.name || 'Администратор';

        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'user-menu-modal';
        modal.innerHTML = `
            <div class="user-menu-content">
                <h3>👑 Администратор</h3>
                <p><strong>Имя:</strong> ${userName}</p>
                <p><strong>Статус:</strong> Вы вошли как администратор</p>
                <p style="font-size: 0.9rem; color: rgba(255, 215, 0, 0.8); margin-top: 10px;">
                    У вас есть расширенные возможности на всех страницах сайта
                </p>
                <p style="font-size: 1rem; color: rgba(255, 255, 255, 0.9); margin-top: 15px; font-weight: bold;">
                    Вы действительно хотите выйти из аккаунта?
                </p>
                <div class="user-menu-buttons">
                    <button class="user-menu-btn cancel">Отмена</button>
                    <button class="user-menu-btn logout">Выйти из аккаунта</button>
                </div>
            </div>
        `;

        // Добавляем обработчики событий
        const cancelBtn = modal.querySelector('.cancel');
        const logoutBtn = modal.querySelector('.logout');

        cancelBtn.addEventListener('click', () => {
            this.closeUserMenu(modal);
        });

        logoutBtn.addEventListener('click', () => {
            this.logout();
            this.closeUserMenu(modal);
        });

        // Закрытие по клику на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeUserMenu(modal);
            }
        });

        // Закрытие по Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeUserMenu(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Добавляем в DOM и показываем
        document.body.appendChild(modal);

        // Анимация появления
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
    }

    closeUserMenu(modal) {
        // Анимация исчезновения
        modal.style.opacity = '0';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    logout() {
        // Используем SessionManager если доступен
        if (window.sessionManager && typeof window.sessionManager.destroySession === 'function') {
            window.sessionManager.destroySession();
        } else {
            // Fallback: очищаем данные вручную
            localStorage.removeItem('user');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userSession');
        }

        // Обновляем статус зоны входа
        this.updateLoginZoneStatus();

        // Перезагружаем страницу для сброса состояния
        window.location.reload();
    }

    updateLoginZoneStatus() {
        if (!this.loginText || !this.loginZone) {
            return;
        }

        const userData = this.getCurrentUser();

        if (userData && userData.role === 'admin') {
            // Администратор авторизован - меняем кнопку
            this.loginText.textContent = 'Администратор';
            this.loginZone.title = 'Вы вошли как администратор. Нажмите для выхода.';
            // Убираем ссылку на форум для администратора
            this.loginZone.removeAttribute('href');
            this.loginZone.removeAttribute('target');
            this.loginZone.removeAttribute('rel');
            this.loginZone.style.cursor = 'pointer';
        } else {
            // Обычный пользователь или не авторизован - кнопка ведет на форум
            this.loginText.textContent = 'Вход';
            this.loginZone.title = 'Перейти на форум для входа';
            // Восстанавливаем ссылку на форум
            this.loginZone.setAttribute('href', 'https://forum.piramidaspb.ru/index.php?/login/');
            this.loginZone.setAttribute('target', '_blank');
            this.loginZone.setAttribute('rel', 'noopener noreferrer');
            this.loginZone.style.cursor = 'pointer';
        }
    }

    openLoginModal() {
        // Открываем модальное окно входа
        console.log('🔐 Открытие модального окна входа через рамку');
        
        // Ищем существующее модальное окно
        const loginModal = document.getElementById('loginModal');
        
        if (loginModal && window.PyramidTOTA && window.PyramidTOTA.showModal) {
            // Используем существующую функцию
            window.PyramidTOTA.showModal(loginModal);
            console.log('✅ Модальное окно входа открыто через PyramidTOTA.showModal');
        } else if (loginModal) {
            // Простое открытие модального окна
            loginModal.style.display = 'block';
            loginModal.classList.add('show');
            document.body.style.overflow = 'hidden';
            console.log('✅ Модальное окно входа открыто простым способом');
        } else {
            // Если модального окна нет, создаем простое
            console.warn('⚠️ Модальное окно входа не найдено, создаем простое');
            this.createSimpleLoginModal();
        }
    }

    createSimpleLoginModal() {
        // Создаем простое модальное окно входа
        const modal = document.createElement('div');
        modal.className = 'modal login-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10002;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: var(--bg-dark);
            padding: 30px;
            border-radius: 15px;
            border: 2px solid var(--gold-color);
            max-width: 400px;
            width: 90%;
            text-align: center;
            color: var(--text-light);
        `;
        
        modalContent.innerHTML = `
            <h2 style="color: var(--gold-color); margin-bottom: 20px;">Вход в систему</h2>
            <form id="loginForm">
                <div style="margin-bottom: 15px;">
                    <input type="text" placeholder="Логин" style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid var(--gold-color); background: var(--bg-light); color: var(--text-dark);">
                </div>
                <div style="margin-bottom: 20px;">
                    <input type="password" placeholder="Пароль" style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid var(--gold-color); background: var(--bg-light); color: var(--text-dark);">
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button type="submit" style="background: var(--gold-color); color: var(--text-dark); border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">Войти</button>
                    <button type="button" onclick="this.closest('.modal').remove()" style="background: #666; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Отмена</button>
                </div>
            </form>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Закрытие по клику вне модального окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Уведомляем рамку о модальном окне
        this.onModalOpen();
        
        // Удаляем уведомление при закрытии
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
                    for (let node of mutation.removedNodes) {
                        if (node === modal) {
                            this.onModalClose();
                            observer.disconnect();
                        }
                    }
                }
            });
        });
        observer.observe(document.body, { childList: true });
    }

    bindEvents() {
        // Обработчик изменения размера окна
        window.addEventListener('resize', () => this.handleResize());
        
        // Обработчик для модальных окон
        document.addEventListener('modal-open', () => this.onModalOpen());
        document.addEventListener('modal-close', () => this.onModalClose());
        
        // Обработчик для полноэкранного режима
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        
        // Клавиатурные сочетания для управления рамкой (для разработки)
        if (this.isDevelopmentMode()) {
            document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        }
    }

    handleResize() {
        // Обновляем позиционирование рамки при изменении размера окна
        if (this.frame) {
            // Принудительно обновляем размеры
            this.frame.style.width = '100vw';
            this.frame.style.height = '100vh';
        }
    }

    onModalOpen() {
        // Делаем рамку менее заметной при открытии модальных окон
        if (this.frame) {
            this.frame.classList.add('modal-active');
        }
    }

    onModalClose() {
        // Возвращаем рамку в нормальное состояние
        if (this.frame) {
            this.frame.classList.remove('modal-active');
        }
    }

    handleFullscreenChange() {
        // Обрабатываем переход в/из полноэкранного режима
        const isFullscreen = document.fullscreenElement !== null;
        
        if (this.frame) {
            if (isFullscreen) {
                this.frame.style.position = 'fixed';
                this.frame.style.zIndex = '10000';
            } else {
                this.frame.style.position = 'fixed';
                this.frame.style.zIndex = '10000';
            }
        }
    }

    handleKeyboard(e) {
        // Горячие клавиши для разработки (Ctrl+Shift+F - переключить рамку)
        if (e.ctrlKey && e.shiftKey && e.key === 'F') {
            e.preventDefault();
            this.toggleFrame();
        }
    }

    toggleFrame() {
        // Переключает видимость рамки
        this.isVisible = !this.isVisible;
        this.updateFrameVisibility();
        console.log(`Рамка ${this.isVisible ? 'показана' : 'скрыта'}`);
    }

    showFrame() {
        // Показывает рамку
        this.isVisible = true;
        this.updateFrameVisibility();
    }

    hideFrame() {
        // Скрывает рамку
        this.isVisible = false;
        this.updateFrameVisibility();
    }

    updateFrameVisibility() {
        if (!this.frame) return;
        
        if (this.isVisible) {
            this.frame.classList.remove('hidden');
        } else {
            this.frame.classList.add('hidden');
        }
    }

    isDevelopmentMode() {
        // Проверяем, находимся ли мы в режиме разработки
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.protocol === 'file:';
    }

    // Публичные методы для внешнего использования
    setOpacity(opacity) {
        if (this.frame && opacity >= 0 && opacity <= 1) {
            this.frame.style.opacity = opacity;
        }
    }

    resetOpacity() {
        if (this.frame) {
            this.frame.style.opacity = '';
        }
    }
}

// Инициализируем менеджер рамки и делаем его глобальным
window.frameManager = new FrameManager();

// Экспортируем для глобального использования
window.FrameManager = frameManager;
window.frameManager = frameManager;