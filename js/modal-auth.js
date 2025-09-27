// Universal modal authentication handler for all devices
class ModalAuthHandler {
    constructor() {
        this.init();
    }

    init() {
        console.log('=== MODAL AUTH HANDLER INIT ===');
        this.setupAuthToggle();
        this.setupModalEvents();
        console.log('=== MODAL AUTH HANDLER INIT COMPLETE ===');
    }

    // Setup authentication toggle in modal for all devices
    setupAuthToggle() {
        console.log('Setting up auth toggle for all devices...');

        // Используем делегирование событий для надежности
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'showRegisterBtn') {
                e.preventDefault();
                e.stopPropagation();
                console.log('REGISTER BUTTON CLICKED');
                this.showRegisterForm();
            } else if (e.target && e.target.id === 'showLoginBtn') {
                e.preventDefault();
                e.stopPropagation();
                console.log('LOGIN BUTTON CLICKED');
                this.showLoginForm();
            }
        });

        // Также настраиваем прямые обработчики при открытии модального окна
        this.setupDirectHandlers();
    }

    setupDirectHandlers() {
        const trySetup = () => {
            const showLoginBtn = document.getElementById('showLoginBtn');
            const showRegisterBtn = document.getElementById('showRegisterBtn');

            if (showLoginBtn && showRegisterBtn) {
                showLoginBtn.onclick = (e) => {
                    e.preventDefault();
                    console.log('LOGIN BUTTON CLICKED (direct)');
                    this.showLoginForm();
                };

                showRegisterBtn.onclick = (e) => {
                    e.preventDefault();
                    console.log('REGISTER BUTTON CLICKED (direct)');
                    this.showRegisterForm();
                };

                console.log('Direct handlers assigned successfully');
                return true;
            }
            return false;
        };

        // Пробуем сразу и через небольшие интервалы
        if (!trySetup()) {
            setTimeout(trySetup, 100);
            setTimeout(trySetup, 500);
        }
    }

    // Show login form
    showLoginForm() {
        console.log('Showing login form...');

        const showLoginBtn = document.getElementById('showLoginBtn');
        const showRegisterBtn = document.getElementById('showRegisterBtn');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerFormInModal');
        const modalTitle = document.getElementById('modalTitle');

        // Обновляем кнопки переключения
        if (showLoginBtn) showLoginBtn.classList.add('active');
        if (showRegisterBtn) showRegisterBtn.classList.remove('active');

        // Показываем форму входа
        if (loginForm) {
            loginForm.style.display = 'block';
            loginForm.style.visibility = 'visible';
        }

        // Скрываем форму регистрации
        if (registerForm) {
            registerForm.style.display = 'none';
            registerForm.style.visibility = 'hidden';
        }

        // Обновляем заголовок
        if (modalTitle) modalTitle.textContent = 'Вход в систему';

        console.log('Login form displayed');
    }

    // Show register form
    showRegisterForm() {
        console.log('Showing register form...');

        const showLoginBtn = document.getElementById('showLoginBtn');
        const showRegisterBtn = document.getElementById('showRegisterBtn');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerFormInModal');
        const modalTitle = document.getElementById('modalTitle');

        // Обновляем кнопки переключения
        if (showRegisterBtn) showRegisterBtn.classList.add('active');
        if (showLoginBtn) showLoginBtn.classList.remove('active');

        // Скрываем форму входа
        if (loginForm) {
            loginForm.style.display = 'none';
            loginForm.style.visibility = 'hidden';
        }

        // Показываем форму регистрации
        if (registerForm) {
            registerForm.style.display = 'block';
            registerForm.style.visibility = 'visible';
        }

        // Обновляем заголовок
        if (modalTitle) modalTitle.textContent = 'Регистрация';

        console.log('Register form displayed');
    }

    // Setup modal events
    setupModalEvents() {
        // Обработчик открытия модального окна
        document.addEventListener('click', (e) => {
            if (e.target && (e.target.classList.contains('login-btn') || e.target.closest('.login-btn'))) {
                // При открытии модального окна всегда показываем форму входа
                setTimeout(() => {
                    this.showLoginForm();
                    this.setupDirectHandlers(); // Переустанавливаем обработчики
                }, 100);
            }
        });

        // Обработчик для кнопки входа в рамке
        const frameLoginZone = document.querySelector('.frame-login-zone');
        if (frameLoginZone) {
            frameLoginZone.addEventListener('click', () => {
                setTimeout(() => {
                    this.showLoginForm();
                    this.setupDirectHandlers();
                }, 100);
            });
        }
    }
}

// Инициализируем обработчик при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new ModalAuthHandler();
});

// Также инициализируем, если DOM уже загружен
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ModalAuthHandler();
    });
} else {
    new ModalAuthHandler();
}
