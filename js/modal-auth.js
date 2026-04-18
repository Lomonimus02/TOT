// Universal modal authentication handler for all devices
class ModalAuthHandler {
    constructor() {
        this.init();
    }

    init() {
        this.setupAuthToggle();
        this.setupModalEvents();
    }

    // Setup authentication toggle in modal for all devices
    setupAuthToggle() {

        // Используем делегирование событий для надежности
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

        // Пробуем сразу и через небольшие интервалы
        if (!trySetup()) {
            setTimeout(trySetup, 100);
            setTimeout(trySetup, 500);
        }
    }

    // Show login form
    showLoginForm() {

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

    }

    // Show register form
    showRegisterForm() {

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
