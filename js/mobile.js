// Mobile-specific functionality for Pyramid TOTA website

class MobileHandler {
    constructor() {
        this.init();
    }

    init() {
        console.log('=== MOBILE HANDLER INIT ===');
        console.log('Window width:', window.innerWidth);
        console.log('Is mobile:', this.isMobile());

        // Инициализируем всегда, но функции будут работать только на мобильных
        console.log('Setting up mobile functionality...');
        this.setupCollapsibleSections();
        this.setupAuthToggle();
        this.setupMobileNavigation();
        console.log('=== MOBILE HANDLER INIT COMPLETE ===');
    }

    // Проверка, является ли устройство мобильным
    isMobile() {
        return window.innerWidth <= 768;
    }

    // Setup collapsible sections for mobile
    setupCollapsibleSections() {
        console.log('=== SETTING UP COLLAPSIBLE SECTIONS ===');

        // Используем делегирование событий для надежности
        document.addEventListener('click', (e) => {
            const header = e.target.closest('.collapsible-header');
            if (header && this.isMobile()) {
                e.preventDefault();
                e.stopPropagation();
                const headerTitle = header.querySelector('h2')?.textContent || 'Unknown';
                console.log(`COLLAPSIBLE HEADER CLICKED via delegation: ${headerTitle}`);
                this.toggleCollapsible(header);
            }
        });

        // Прямое назначение обработчиков как резерв
        const setupDirect = () => {
            const headers = document.querySelectorAll('.collapsible-header');
            console.log(`Found ${headers.length} collapsible headers`);

            if (headers.length === 0) {
                console.warn('No collapsible headers found for direct setup');
                return false;
            }

            headers.forEach((header, index) => {
                const title = header.querySelector('h2')?.textContent || `Header ${index}`;
                console.log(`Setting up direct handler for: ${title}`);

                header.onclick = (e) => {
                    if (this.isMobile()) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(`COLLAPSIBLE HEADER CLICKED via direct: ${title}`);
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

        console.log('=== COLLAPSIBLE SECTIONS SETUP COMPLETE ===');
    }

    // Initialize collapsed state on mobile
    initializeCollapsibleState() {
        if (!this.isMobile()) {
            console.log('Not mobile, skipping collapsed state initialization');
            return;
        }

        console.log('=== INITIALIZING COLLAPSED STATE ===');
        const collapsibleContents = document.querySelectorAll('.collapsible-content');
        const collapsibleHeaders = document.querySelectorAll('.collapsible-header');

        console.log('Found collapsible contents:', collapsibleContents.length);
        console.log('Found collapsible headers:', collapsibleHeaders.length);

        if (collapsibleContents.length === 0 || collapsibleHeaders.length === 0) {
            console.error('Collapsible elements not found!');
            console.log('All elements with collapsible classes:', {
                contents: document.querySelectorAll('[class*="collapsible-content"]'),
                headers: document.querySelectorAll('[class*="collapsible-header"]')
            });
            return;
        }

        collapsibleContents.forEach((content, index) => {
            console.log(`Setting up content ${index}: ${content.id}`);

            // Устанавливаем закрытое состояние (показываем только превью)
            content.classList.add('collapsed');
            content.classList.remove('expanded');

            // Скрываем полный список, показываем только превью
            const menuFull = content.querySelector('.menu-full');
            const menuPreview = content.querySelector('.menu-preview');

            if (menuFull) {
                menuFull.style.display = 'none';
                console.log(`Hidden full menu for content ${index}`);
            }

            if (menuPreview) {
                menuPreview.style.display = 'block';
                console.log(`Showing preview menu for content ${index}`);
            }
        });

        collapsibleHeaders.forEach((header, index) => {
            const targetId = header.getAttribute('data-target');
            console.log(`Setting header ${index} as collapsed: ${targetId}`);

            header.classList.add('collapsed');

            const arrow = header.querySelector('.collapse-arrow');
            if (arrow) {
                arrow.style.transform = 'rotate(-90deg)';
                arrow.style.display = 'inline-block';
                console.log(`Arrow ${index} set to collapsed state`);
            } else {
                console.warn(`No arrow found for header ${index}`);
            }
        });

        console.log('=== COLLAPSED STATE INITIALIZED ===');
    }

    // Reset to expanded state on desktop
    resetCollapsibleState() {
        console.log('Resetting to desktop state...');
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
        console.log('=== TOGGLE COLLAPSIBLE START ===');

        const targetId = header.getAttribute('data-target');
        const content = document.getElementById(targetId);
        const arrow = header.querySelector('.collapse-arrow');
        const headerTitle = header.querySelector('h2')?.textContent || 'Unknown';

        console.log(`Header: ${headerTitle}`);
        console.log(`Target ID: ${targetId}`);
        console.log(`Content found: ${!!content}`);
        console.log(`Arrow found: ${!!arrow}`);

        if (!content) {
            console.error(`CRITICAL: Content element not found for target: ${targetId}`);
            // Попробуем найти альтернативными способами
            const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
            console.log('Available IDs:', allIds);
            return;
        }

        const isCurrentlyCollapsed = header.classList.contains('collapsed');
        console.log(`Currently collapsed: ${isCurrentlyCollapsed}`);

        if (isCurrentlyCollapsed) {
            // EXPAND - показываем полный список
            console.log('>>> EXPANDING <<<');

            header.classList.remove('collapsed');
            content.classList.add('expanded');
            content.classList.remove('collapsed');

            // Показываем полный список
            const menuFull = content.querySelector('.menu-full');
            const menuPreview = content.querySelector('.menu-preview');

            if (menuFull) {
                menuFull.style.display = 'block';
                console.log('Showing full menu');
            }

            if (menuPreview) {
                menuPreview.style.display = 'block';
                console.log('Keeping preview menu visible');
            }

            if (arrow) {
                arrow.style.transform = 'rotate(0deg)';
            }

            console.log('EXPANDED successfully - full menu visible');
        } else {
            // COLLAPSE - показываем только превью (первые 3 элемента)
            console.log('>>> COLLAPSING <<<');

            header.classList.add('collapsed');
            content.classList.remove('expanded');
            content.classList.add('collapsed');

            // Скрываем полный список, оставляем только превью
            const menuFull = content.querySelector('.menu-full');
            const menuPreview = content.querySelector('.menu-preview');

            if (menuFull) {
                menuFull.style.display = 'none';
                console.log('Hidden full menu');
            }

            if (menuPreview) {
                menuPreview.style.display = 'block';
                console.log('Keeping preview menu visible');
            }

            if (arrow) {
                arrow.style.transform = 'rotate(-90deg)';
            }

            console.log('COLLAPSED successfully - only preview visible');
        }

        console.log('=== TOGGLE COLLAPSIBLE END ===');
    }

    // Setup authentication toggle in modal
    setupAuthToggle() {
        console.log('=== SETTING UP AUTH TOGGLE ===');

        // Простой и надежный подход - используем делегирование событий
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'showRegisterBtn') {
                e.preventDefault();
                e.stopPropagation();
                console.log('REGISTER BUTTON CLICKED via delegation');
                this.showRegisterForm();
            } else if (e.target && e.target.id === 'showLoginBtn') {
                e.preventDefault();
                e.stopPropagation();
                console.log('LOGIN BUTTON CLICKED via delegation');
                this.showLoginForm();
            }
        });

        // Также пробуем прямое назначение обработчиков
        const tryDirectSetup = () => {
            const showLoginBtn = document.getElementById('showLoginBtn');
            const showRegisterBtn = document.getElementById('showRegisterBtn');

            console.log('Direct setup - elements found:', {
                showLoginBtn: !!showLoginBtn,
                showRegisterBtn: !!showRegisterBtn
            });

            if (showLoginBtn && showRegisterBtn) {
                showLoginBtn.onclick = (e) => {
                    e.preventDefault();
                    console.log('LOGIN BUTTON CLICKED via direct');
                    this.showLoginForm();
                };

                showRegisterBtn.onclick = (e) => {
                    e.preventDefault();
                    console.log('REGISTER BUTTON CLICKED via direct');
                    this.showRegisterForm();
                };

                console.log('Direct handlers assigned');
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

        console.log('=== AUTH TOGGLE SETUP COMPLETE ===');
    }

    // Show login form
    showLoginForm() {
        console.log('=== SHOWING LOGIN FORM ===');

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

        console.log('Login form shown');
    }

    // Show register form
    showRegisterForm() {
        console.log('=== SHOWING REGISTER FORM ===');

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
            console.log('Register form shown - using existing forms.js handler');
        }

        if (modalTitle) modalTitle.textContent = 'Регистрация';

        console.log('Register form shown');
    }

    // Switch to login view
    switchToLogin(loginBtn, registerBtn, loginForm, registerForm, modalTitle) {
        console.log('Switching to login view...');

        try {
            loginBtn.classList.add('active');
            registerBtn.classList.remove('active');

            loginForm.style.display = 'block';
            loginForm.style.visibility = 'visible';

            registerForm.style.display = 'none';
            registerForm.style.visibility = 'hidden';

            modalTitle.textContent = 'Вход в систему';

            console.log('Successfully switched to login view');
        } catch (error) {
            console.error('Error switching to login view:', error);
        }
    }

    // Switch to register view
    switchToRegister(loginBtn, registerBtn, loginForm, registerForm, modalTitle) {
        console.log('Switching to register view...');

        try {
            registerBtn.classList.add('active');
            loginBtn.classList.remove('active');

            loginForm.style.display = 'none';
            loginForm.style.visibility = 'hidden';

            registerForm.style.display = 'block';
            registerForm.style.visibility = 'visible';

            modalTitle.textContent = 'Регистрация';

            console.log('Successfully switched to register view');
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
        console.log('Mobile navigation setup completed - using existing forms.js handlers');
    }
}

// Initialize mobile handler when DOM is loaded and other scripts are ready
document.addEventListener('DOMContentLoaded', () => {
    // Задержка для того, чтобы другие скрипты успели инициализироваться
    setTimeout(() => {
        console.log('Initializing mobile handler...');
        window.mobileHandler = new MobileHandler();

        // Дополнительная инициализация для случаев, когда DOM еще не готов
        setTimeout(() => {
            if (window.mobileHandler && window.innerWidth <= 768) {
                console.log('Re-initializing mobile state...');
                window.mobileHandler.initializeCollapsibleState();
            }
        }, 500);
    }, 100);
});

// Также инициализируем при изменении размера окна
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.mobileHandler && window.innerWidth <= 768) {
            console.log('Window loaded, re-checking mobile state...');
            window.mobileHandler.initializeCollapsibleState();
        }
    }, 200);
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileHandler;
}
