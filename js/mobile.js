// Mobile-specific functionality for Pyramid TOTA website

class MobileHandler {
    constructor() {
        this.init();
    }

    init() {

        // Инициализируем всегда, но функции будут работать только на мобильных
        this.setupCollapsibleSections();
        this.setupAuthToggle();
        this.setupMobileNavigation();
    }

    // Проверка, является ли устройство мобильным
    isMobile() {
        return window.innerWidth <= 768;
    }

    // Setup collapsible sections for mobile
    setupCollapsibleSections() {

        // Используем делегирование событий для надежности
        document.addEventListener('click', (e) => {
            const header = e.target.closest('.collapsible-header');
            if (header && this.isMobile()) {
                e.preventDefault();
                e.stopPropagation();
                const headerTitle = header.querySelector('h2')?.textContent || 'Unknown';
                this.toggleCollapsible(header);
            }
        });

        // Прямое назначение обработчиков как резерв
        const setupDirect = () => {
            const headers = document.querySelectorAll('.collapsible-header');

            if (headers.length === 0) {
                return false;
            }

            headers.forEach((header, index) => {
                const title = header.querySelector('h2')?.textContent || `Header ${index}`;

                header.onclick = (e) => {
                    if (this.isMobile()) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.toggleCollapsible(header);
                    }
                };
            });

            return true;
        };

        // Инициализируем состояние и обработчики
        if (this.isMobile()) {
            this.initializeCollapsibleState();
        }

        // Пробуем прямое назначение несколько раз
        if (!setupDirect()) {
            setTimeout(setupDirect, 100);
            setTimeout(setupDirect, 500);
            setTimeout(setupDirect, 1000);
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            setTimeout(() => {
                if (this.isMobile()) {
                    this.initializeCollapsibleState();
                } else {
                    this.resetCollapsibleState();
                }
            }, 100);
        });

    }

    // Initialize collapsed state on mobile
    initializeCollapsibleState() {
        if (!this.isMobile()) {
            return;
        }

        const collapsibleContents = document.querySelectorAll('.collapsible-content');
        const collapsibleHeaders = document.querySelectorAll('.collapsible-header');


        if (collapsibleContents.length === 0 || collapsibleHeaders.length === 0) {
            console.error('Collapsible elements not found!');
            return;
        }

        collapsibleContents.forEach((content, index) => {

            // Устанавливаем закрытое состояние (показываем только превью)
            content.classList.add('collapsed');
            content.classList.remove('expanded');

            // Скрываем полный список, показываем только превью
            const menuFull = content.querySelector('.menu-full');
            const menuPreview = content.querySelector('.menu-preview');

            if (menuFull) {
                menuFull.style.display = 'none';
            }

            if (menuPreview) {
                menuPreview.style.display = 'block';
            }
        });

        collapsibleHeaders.forEach((header, index) => {
            const targetId = header.getAttribute('data-target');

            header.classList.add('collapsed');

            const arrow = header.querySelector('.collapse-arrow');
            if (arrow) {
                arrow.style.transform = 'rotate(-90deg)';
                arrow.style.display = 'inline-block';
            } else {
            }
        });

    }

    // Reset to expanded state on desktop
    resetCollapsibleState() {
        const collapsibleContents = document.querySelectorAll('.collapsible-content');
        const collapsibleHeaders = document.querySelectorAll('.collapsible-header');

        collapsibleContents.forEach(content => {
            content.classList.remove('expanded');
            content.style.maxHeight = '';
            content.style.opacity = '';
            content.style.overflow = '';
        });

        collapsibleHeaders.forEach(header => {
            header.classList.remove('collapsed');
            const arrow = header.querySelector('.collapse-arrow');
            if (arrow) {
                arrow.style.display = 'none';
                arrow.style.transform = '';
            }
        });
    }

    // Toggle collapsible section
    toggleCollapsible(header) {

        const targetId = header.getAttribute('data-target');
        const content = document.getElementById(targetId);
        const arrow = header.querySelector('.collapse-arrow');
        const headerTitle = header.querySelector('h2')?.textContent || 'Unknown';


        if (!content) {
            console.error(`CRITICAL: Content element not found for target: ${targetId}`);
            // Попробуем найти альтернативными способами
            const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
            return;
        }

        const isCurrentlyCollapsed = header.classList.contains('collapsed');

        if (isCurrentlyCollapsed) {
            // EXPAND - показываем полный список

            header.classList.remove('collapsed');
            content.classList.add('expanded');
            content.classList.remove('collapsed');

            // Показываем полный список
            const menuFull = content.querySelector('.menu-full');
            const menuPreview = content.querySelector('.menu-preview');

            if (menuFull) {
                menuFull.style.display = 'block';
            }

            if (menuPreview) {
                menuPreview.style.display = 'block';
            }

            if (arrow) {
                arrow.style.transform = 'rotate(0deg)';
            }

        } else {
            // COLLAPSE - показываем только превью (первые 3 элемента)

            header.classList.add('collapsed');
            content.classList.remove('expanded');
            content.classList.add('collapsed');

            // Скрываем полный список, оставляем только превью
            const menuFull = content.querySelector('.menu-full');
            const menuPreview = content.querySelector('.menu-preview');

            if (menuFull) {
                menuFull.style.display = 'none';
            }

            if (menuPreview) {
                menuPreview.style.display = 'block';
            }

            if (arrow) {
                arrow.style.transform = 'rotate(-90deg)';
            }

        }

    }

    // Setup authentication toggle in modal
    setupAuthToggle() {

        // Простой и надежный подход - используем делегирование событий
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'showRegisterBtn') {
                e.preventDefault();
                e.stopPropagation();
                this.showRegisterForm();
            } else if (e.target && e.target.id === 'showLoginBtn') {
                e.preventDefault();
                e.stopPropagation();
                this.showLoginForm();
            }
        });

        // Также пробуем прямое назначение обработчиков
        const tryDirectSetup = () => {
            const showLoginBtn = document.getElementById('showLoginBtn');
            const showRegisterBtn = document.getElementById('showRegisterBtn');


            if (showLoginBtn && showRegisterBtn) {
                showLoginBtn.onclick = (e) => {
                    e.preventDefault();
                    this.showLoginForm();
                };

                showRegisterBtn.onclick = (e) => {
                    e.preventDefault();
                    this.showRegisterForm();
                };

                return true;
            }
            return false;
        };

        // Пробуем сразу и через таймауты
        if (!tryDirectSetup()) {
            setTimeout(tryDirectSetup, 100);
            setTimeout(tryDirectSetup, 500);
            setTimeout(tryDirectSetup, 1000);
        }

    }

    // Show login form
    showLoginForm() {

        const showLoginBtn = document.getElementById('showLoginBtn');
        const showRegisterBtn = document.getElementById('showRegisterBtn');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerFormInModal');
        const modalTitle = document.getElementById('modalTitle');

        if (showLoginBtn) showLoginBtn.classList.add('active');
        if (showRegisterBtn) showRegisterBtn.classList.remove('active');

        if (loginForm) {
            loginForm.style.display = 'block';
            loginForm.style.visibility = 'visible';
        }

        if (registerForm) {
            registerForm.style.display = 'none';
            registerForm.style.visibility = 'hidden';
        }

        if (modalTitle) modalTitle.textContent = 'Вход в систему';

    }

    // Show register form
    showRegisterForm() {

        const showLoginBtn = document.getElementById('showLoginBtn');
        const showRegisterBtn = document.getElementById('showRegisterBtn');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerFormInModal');
        const modalTitle = document.getElementById('modalTitle');

        if (showRegisterBtn) showRegisterBtn.classList.add('active');
        if (showLoginBtn) showLoginBtn.classList.remove('active');

        if (loginForm) {
            loginForm.style.display = 'none';
            loginForm.style.visibility = 'hidden';
        }

        if (registerForm) {
            registerForm.style.display = 'block';
            registerForm.style.visibility = 'visible';

            // НЕ добавляем обработчик - используем существующий из forms.js
        }

        if (modalTitle) modalTitle.textContent = 'Регистрация';

    }

    // Switch to login view
    switchToLogin(loginBtn, registerBtn, loginForm, registerForm, modalTitle) {

        try {
            loginBtn.classList.add('active');
            registerBtn.classList.remove('active');

            loginForm.style.display = 'block';
            loginForm.style.visibility = 'visible';

            registerForm.style.display = 'none';
            registerForm.style.visibility = 'hidden';

            modalTitle.textContent = 'Вход в систему';

        } catch (error) {
            console.error('Error switching to login view:', error);
        }
    }

    // Switch to register view
    switchToRegister(loginBtn, registerBtn, loginForm, registerForm, modalTitle) {

        try {
            registerBtn.classList.add('active');
            loginBtn.classList.remove('active');

            loginForm.style.display = 'none';
            loginForm.style.visibility = 'hidden';

            registerForm.style.display = 'block';
            registerForm.style.visibility = 'visible';

            modalTitle.textContent = 'Регистрация';

        } catch (error) {
            console.error('Error switching to register view:', error);
        }
    }

    // Регистрация теперь обрабатывается forms.js - эта функция больше не нужна

    // Validate registration data
    validateRegisterData(data) {
        const errors = [];
        
        if (!data.name || data.name.trim().length < 2) {
            errors.push('Имя должно содержать минимум 2 символа');
        }
        
        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push('Введите корректный email адрес');
        }
        
        if (!data.password || data.password.length < 6) {
            errors.push('Пароль должен содержать минимум 6 символов');
        }
        
        if (data.password !== data.confirmPassword) {
            errors.push('Пароли не совпадают');
        }
        
        if (errors.length > 0) {
            this.showMessage(errors.join('\n'), 'error');
            return false;
        }
        
        return true;
    }

    // Email validation
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Show message
    showMessage(message, type = 'info') {
        if (window.formHandler && window.formHandler.showSuccessMessage) {
            if (type === 'success') {
                window.formHandler.showSuccessMessage(message);
            } else {
                window.formHandler.showErrorMessage(message);
            }
        } else {
            alert(message);
        }
    }

    // Setup mobile navigation enhancements
    setupMobileNavigation() {
        // Не вмешиваемся в работу кнопки входа - это делает forms.js
        // Просто добавляем мобильные улучшения, если нужно
    }
}

// Initialize mobile handler when DOM is loaded and other scripts are ready
document.addEventListener('DOMContentLoaded', () => {
    // Задержка для того, чтобы другие скрипты успели инициализироваться
    setTimeout(() => {
        window.mobileHandler = new MobileHandler();

        // Дополнительная инициализация для случаев, когда DOM еще не готов
        setTimeout(() => {
            if (window.mobileHandler && window.innerWidth <= 768) {
                window.mobileHandler.initializeCollapsibleState();
            }
        }, 500);
    }, 100);
});

// Также инициализируем при изменении размера окна
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.mobileHandler && window.innerWidth <= 768) {
            window.mobileHandler.initializeCollapsibleState();
        }
    }, 200);
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileHandler;
}
