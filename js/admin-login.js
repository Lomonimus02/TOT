// Скрипт для страницы входа администратора
// Обеспечивает авторизацию администратора и предоставление всех прав

class AdminLoginManager {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.form = document.getElementById('adminLoginForm');
        this.emailInput = document.getElementById('adminEmail');
        this.passwordInput = document.getElementById('adminPassword');
        this.loginButton = document.getElementById('loginButton');
        this.errorMessage = document.getElementById('errorMessage');
        this.successMessage = document.getElementById('successMessage');
        this.loadingSpinner = document.getElementById('loadingSpinner');

        this.init();
    }

    init() {
        // Проверяем, не авторизован ли уже пользователь как администратор
        this.checkExistingAuth();

        // Обработчик отправки формы
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Автофокус на поле email
        if (this.emailInput) {
            this.emailInput.focus();
        }
    }

    // Проверка существующей авторизации
    checkExistingAuth() {
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.role === 'admin') {
                    // Пользователь уже авторизован как администратор
                    this.showSuccess('Вы уже авторизованы как администратор');
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                }
            } catch (error) {
                console.error('Ошибка проверки авторизации:', error);
            }
        }
    }

    // Обработка входа
    async handleLogin(e) {
        e.preventDefault();

        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;

        // Валидация
        if (!email || !password) {
            this.showError('Пожалуйста, заполните все поля');
            return;
        }

        // Показываем индикатор загрузки
        this.setLoading(true);
        this.hideMessages();

        try {
            // Отправляем запрос на сервер
            const response = await fetch(`${this.apiBaseUrl}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Ошибка авторизации');
            }

            // Проверяем, что пользователь является администратором
            if (result.user.role !== 'admin') {
                throw new Error('Доступ разрешен только для администраторов');
            }

            // Сохраняем данные авторизации через SessionManager
            if (window.sessionManager) {
                window.sessionManager.createSession(result.user);
            } else {
                // Fallback если SessionManager не загружен
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));

                const sessionData = {
                    userId: result.user.id,
                    email: result.user.email,
                    name: result.user.name,
                    role: result.user.role,
                    createdAt: Date.now(),
                    lastActivity: Date.now(),
                    expiresAt: Date.now() + (24 * 60 * 60 * 1000),
                    token: result.token
                };
                localStorage.setItem('userSession', JSON.stringify(sessionData));
            }


            // Показываем сообщение об успехе
            this.showSuccess(`Добро пожаловать, ${result.user.name}! Перенаправление на главную...`);

            // Перенаправляем на главную страницу (не на админ панель)
            // Администратор получает расширенные возможности на обычных страницах
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);

        } catch (error) {
            console.error('Ошибка входа:', error);
            this.showError(error.message || 'Неверный email или пароль');
            this.setLoading(false);
        }
    }

    // Валидация email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Показать ошибку
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.add('show');
        this.successMessage.classList.remove('show');

        // Автоматически скрыть через 5 секунд
        setTimeout(() => {
            this.errorMessage.classList.remove('show');
        }, 5000);
    }

    // Показать успех
    showSuccess(message) {
        this.successMessage.textContent = message;
        this.successMessage.classList.add('show');
        this.errorMessage.classList.remove('show');
    }

    // Скрыть все сообщения
    hideMessages() {
        this.errorMessage.classList.remove('show');
        this.successMessage.classList.remove('show');
    }

    // Установить состояние загрузки
    setLoading(isLoading) {
        if (isLoading) {
            this.loginButton.disabled = true;
            this.loginButton.textContent = 'Вход...';
            this.loadingSpinner.classList.add('show');
            this.emailInput.disabled = true;
            this.passwordInput.disabled = true;
        } else {
            this.loginButton.disabled = false;
            this.loginButton.textContent = 'Войти в панель управления';
            this.loadingSpinner.classList.remove('show');
            this.emailInput.disabled = false;
            this.passwordInput.disabled = false;
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new AdminLoginManager();
});

