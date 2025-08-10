// Обработка форм для сайта "Пирамида ТОТА"

class FormHandler {
    constructor() {
        this.apiBaseUrl = window.location.origin; // Используем текущий домен
        this.token = localStorage.getItem('authToken');

        this.init();
    }
    
    init() {
        this.setupContactForm();
        this.setupNewsletterForm();
        this.setupAuthForms();
        this.setupBookingForms();
        this.setupFormValidation();

        // Проверяем авторизацию с задержкой, чтобы DOM успел загрузиться
        setTimeout(() => {
            this.checkAuthStatus();
        }, 500);
    }

    // Настройка форм записи на программы
    setupBookingForms() {
        const bookingForms = document.querySelectorAll('#bookingForm, #templeBookingForm, #schoolBookingForm');

        bookingForms.forEach(form => {
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleBookingForm(form);
                });
            }
        });
    }

    // Проверка статуса авторизации при загрузке
    checkAuthStatus() {
        console.log('Проверка статуса авторизации');

        // Используем систему сессий для проверки
        if (window.sessionManager && window.sessionManager.isAuthenticated()) {
            const user = window.sessionManager.getCurrentUser();
            console.log('Пользователь авторизован через сессию:', user);

            this.token = localStorage.getItem('authToken');

            // Проверяем наличие элементов навигации
            const loginBtn = document.getElementById('loginBtn');

            if (loginBtn) {
                console.log('Элементы навигации найдены, обновляем интерфейс');
                this.updateAuthUI(user);
            } else {
                console.log('Элементы навигации не найдены, повторная попытка через 200мс');
                setTimeout(() => {
                    this.checkAuthStatus();
                }, 200);
            }
        } else {
            console.log('Пользователь не авторизован или сессия истекла');

            // Очищаем старые данные если сессия недействительна
            const token = localStorage.getItem('authToken');
            if (token) {
                console.log('Очистка недействительной сессии');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                localStorage.removeItem('userSession');
            }
        }
    }
    
    // Настройка формы обратной связи
    setupContactForm() {
        const contactForm = document.getElementById('contactForm');
        
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactForm(contactForm);
            });
        }
    }
    
    // Обработка формы обратной связи
    async handleContactForm(form) {
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            message: formData.get('message')
        };

        // Валидация
        if (!this.validateContactForm(data)) {
            return;
        }

        // Показать индикатор загрузки
        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Отправка...';
        submitBtn.disabled = true;

        try {
            // Отправка через API
            const response = await fetch(`${this.apiBaseUrl}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                this.showSuccessMessage('Ваше сообщение отправлено! Мы свяжемся с вами в ближайшее время.');
                form.reset();
            } else {
                throw new Error(result.error || 'Ошибка отправки');
            }

        } catch (error) {
            console.error('Ошибка отправки:', error);
            this.showErrorMessage('Произошла ошибка при отправке. Попробуйте позже.');
        } finally {
            // Восстановить кнопку
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    // Валидация формы обратной связи
    validateContactForm(data) {
        const errors = [];
        
        if (!data.name || data.name.trim().length < 2) {
            errors.push('Имя должно содержать минимум 2 символа');
        }
        
        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push('Введите корректный email адрес');
        }
        
        if (!data.message || data.message.trim().length < 10) {
            errors.push('Сообщение должно содержать минимум 10 символов');
        }
        
        if (data.phone && !this.isValidPhone(data.phone)) {
            errors.push('Введите корректный номер телефона');
        }
        
        if (errors.length > 0) {
            this.showErrorMessage(errors.join('\n'));
            return false;
        }
        
        return true;
    }
    
    // Настройка формы подписки
    setupNewsletterForm() {
        const newsletterForm = document.getElementById('newsletterForm');
        
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterForm(newsletterForm);
            });
        }
    }
    
    // Обработка формы подписки
    async handleNewsletterForm(form) {
        const formData = new FormData(form);
        const email = formData.get('email');

        if (!this.isValidEmail(email)) {
            this.showErrorMessage('Введите корректный email адрес');
            return;
        }

        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Подписка...';
        submitBtn.disabled = true;

        try {
            // Отправка через API
            const response = await fetch(`${this.apiBaseUrl}/api/newsletter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (response.ok) {
                this.showSuccessMessage('Вы успешно подписались на рассылку!');
                form.reset();
            } else {
                throw new Error(result.error || 'Ошибка подписки');
            }

        } catch (error) {
            console.error('Ошибка подписки:', error);
            this.showErrorMessage('Произошла ошибка при подписке. Попробуйте позже.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    // Настройка форм авторизации
    setupAuthForms() {
        // Настройка кнопок навигации
        this.setupNavigationButtons();

        // Настройка форм
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const registerFormInModal = document.getElementById('registerFormInModal');

        console.log('Настройка форм авторизации:', {
            loginForm: !!loginForm,
            registerForm: !!registerForm,
            registerFormInModal: !!registerFormInModal
        });

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Отправка формы входа');
                this.handleLoginForm(loginForm);
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Отправка формы регистрации (основная)');
                this.handleRegisterForm(registerForm);
            });
        }

        // КРИТИЧЕСКИ ВАЖНО: Обработчик для формы регистрации в модальном окне
        if (registerFormInModal) {
            registerFormInModal.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Отправка формы регистрации (модальная)');
                this.handleRegisterForm(registerFormInModal);
            });
            console.log('Обработчик модальной формы регистрации установлен');
        } else {
            console.warn('Модальная форма регистрации не найдена');
        }
    }

    // Настройка кнопок навигации
    setupNavigationButtons() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');

        console.log('Настройка кнопок навигации:', {
            loginBtn: !!loginBtn,
            registerBtn: !!registerBtn,
            loginModal: !!loginModal,
            registerModal: !!registerModal
        });

        if (loginBtn && loginModal) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Клик по кнопке входа (forms.js)');
                if (window.PyramidTOTA && window.PyramidTOTA.showModal) {
                    window.PyramidTOTA.showModal(loginModal);
                }
            });
        }

        if (registerBtn && registerModal) {
            registerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Клик по кнопке регистрации (forms.js)');
                if (window.PyramidTOTA && window.PyramidTOTA.showModal) {
                    window.PyramidTOTA.showModal(registerModal);
                }
            });
        }
    }
    
    // Обработка формы входа
    async handleLoginForm(form) {
        const formData = new FormData(form);
        const data = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        if (!this.validateLoginForm(data)) {
            return;
        }

        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Вход...';
        submitBtn.disabled = true;

        try {
            console.log('Серверная авторизация:', data);

            // Серверная авторизация через API
            const response = await fetch(`${this.apiBaseUrl}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.user) {
                // Очищаем флаг выхода при успешном входе
                sessionStorage.removeItem('userLoggedOut');

                // Создаем сессию через SessionManager
                if (window.sessionManager) {
                    const sessionData = window.sessionManager.createSession(result.user);
                    this.token = result.token;
                    console.log('Сессия создана успешно');
                } else {
                    // Fallback для старой системы
                    localStorage.setItem('authToken', result.token);
                    localStorage.setItem('user', JSON.stringify(result.user));
                    this.token = result.token;
                }

                console.log('Авторизация успешна');
                this.showSuccessMessage(`Добро пожаловать, ${result.user.name}!`);

                // Обновить интерфейс
                console.log('Обновление интерфейса для пользователя:', result.user);
                this.updateAuthUI({
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    role: result.user.role
                });

                // Закрыть модальное окно
                const modal = form.closest('.modal');
                if (modal && window.PyramidTOTA) {
                    console.log('Закрытие модального окна');
                    setTimeout(() => {
                        window.PyramidTOTA.hideModal(modal);
                    }, 500);
                } else {
                    console.log('Модальное окно не найдено или PyramidTOTA недоступен');
                }
            } else {
                console.error('Ошибка авторизации:', result.error);
                throw new Error(result.error || 'Неверный email или пароль');
            }

        } catch (error) {
            console.error('Ошибка входа:', error);
            this.showErrorMessage(error.message || 'Неверный email или пароль');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    // Обработка формы регистрации
    async handleRegisterForm(form) {
        console.log('=== HANDLING REGISTER FORM ===');
        console.log('Form element:', form);
        console.log('Form ID:', form.id);

        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirm-password')
        };

        console.log('Form data extracted:', data);
        console.log('Name:', data.name);
        console.log('Email:', data.email);
        console.log('Password length:', data.password ? data.password.length : 'null');
        console.log('Confirm password length:', data.confirmPassword ? data.confirmPassword.length : 'null');
        console.log('Passwords match:', data.password === data.confirmPassword);

        if (!this.validateRegisterForm(data)) {
            console.log('Validation failed');
            return;
        }

        console.log('Validation passed, proceeding with registration...');

        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Регистрация...';
        submitBtn.disabled = true;

        try {
            // Серверная регистрация через API
            console.log('Регистрация пользователя через API:', data);

            const response = await fetch(`${this.apiBaseUrl}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password
                })
            });

            const result = await response.json();

            if (response.ok && result.user) {
                // Создаем сессию через SessionManager
                if (window.sessionManager) {
                    const sessionData = window.sessionManager.createSession(result.user);
                    this.token = result.token;
                    console.log('Сессия создана успешно');
                } else {
                    // Fallback для старой системы
                    localStorage.setItem('authToken', result.token);
                    localStorage.setItem('user', JSON.stringify(result.user));
                    this.token = result.token;
                }

                console.log('Пользователь успешно зарегистрирован:', result.user);
                this.showSuccessMessage(`Добро пожаловать, ${result.user.name}! Регистрация прошла успешно.`);

                // Обновить интерфейс - пользователь автоматически входит в систему
                this.updateAuthUI({
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    role: result.user.role
                });

                // Закрыть модальное окно
                const modal = form.closest('.modal');
                if (modal && window.PyramidTOTA) {
                    setTimeout(() => {
                        window.PyramidTOTA.hideModal(modal);
                    }, 1000);
                }
            } else {
                console.error('Ошибка регистрации:', result.error);
                throw new Error(result.error || 'Произошла ошибка при регистрации');
            }

        } catch (error) {
            console.error('Ошибка регистрации:', error);
            this.showErrorMessage(error.message || 'Произошла ошибка при регистрации. Попробуйте позже.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    // Валидация формы входа
    validateLoginForm(data) {
        const errors = [];
        
        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push('Введите корректный email адрес');
        }
        
        if (!data.password || data.password.length < 6) {
            errors.push('Пароль должен содержать минимум 6 символов');
        }
        
        if (errors.length > 0) {
            this.showErrorMessage(errors.join('\n'));
            return false;
        }
        
        return true;
    }
    
    // Валидация формы регистрации
    validateRegisterForm(data) {
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
            this.showErrorMessage(errors.join('\n'));
            return false;
        }
        
        return true;
    }
    
    // Обновление интерфейса после авторизации
    updateAuthUI(user) {
        console.log('=== updateAuthUI НАЧАЛО ===');
        console.log('Пользователь:', user);
        console.log('DOM готов:', document.readyState);

        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const navMenu = document.querySelector('.nav-menu');

        console.log('Найдены элементы:', {
            loginBtn: !!loginBtn,
            registerBtn: !!registerBtn,
            navMenu: !!navMenu
        });

        if (loginBtn) console.log('loginBtn HTML:', loginBtn.outerHTML);
        if (registerBtn) console.log('registerBtn HTML:', registerBtn.outerHTML);
        if (navMenu) console.log('navMenu HTML:', navMenu.innerHTML);

        if (loginBtn && navMenu) {
            console.log('Элементы найдены, начинаем обновление...');

            // Удаляем кнопку входа
            console.log('Удаление кнопки входа...');
            loginBtn.remove();

            // Удаляем кнопку регистрации если есть
            if (registerBtn) {
                console.log('Удаление кнопки регистрации...');
                registerBtn.remove();
            }

            // Добавляем иконку аккаунта
            console.log('Добавление иконки аккаунта...');
            const accountIcon = document.createElement('div');
            accountIcon.className = 'account-icon';
            accountIcon.id = 'accountIcon';
            accountIcon.innerHTML = '👤';
            accountIcon.title = user.name;
            navMenu.appendChild(accountIcon);
            console.log('Добавлена иконка аккаунта:', accountIcon.outerHTML);

            // Создаем выпадающее меню аккаунта
            const accountDropdown = document.createElement('div');
            accountDropdown.className = 'account-dropdown';
            accountDropdown.id = 'accountDropdown';
            accountDropdown.style.display = 'none';

            accountDropdown.innerHTML = `
                <div class="dropdown-header">
                    <strong>${user.name}</strong>
                    <div class="user-email">${user.email}</div>
                </div>
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item" id="logoutBtn">Выход</a>
            `;

            // Добавляем админ-панель для администраторов (без кнопки редактирования в навигации)
            if (user.role === 'admin') {
                console.log('Пользователь администратор - добавляем админ-панель');

                // Создаем плавающую кнопку редактирования для страниц
                this.createFloatingEditButton();

                // Добавляем админ-панель в выпадающее меню
                const currentPath = window.location.pathname;
                const adminPath = currentPath.includes('/pages/') ? '../admin.html' : 'admin.html';

                const adminItem = document.createElement('a');
                adminItem.href = adminPath;
                adminItem.className = 'dropdown-item';
                adminItem.textContent = 'Админ-панель';
                adminItem.setAttribute('data-admin-link', 'true');

                accountDropdown.insertBefore(adminItem, accountDropdown.querySelector('.dropdown-divider'));
            }

            navMenu.appendChild(accountDropdown);
            console.log('Добавлено выпадающее меню:', accountDropdown.outerHTML);

            // Обработчик клика по иконке аккаунта
            accountIcon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Клик по иконке аккаунта');
                this.toggleAccountDropdown();
            });

            // Обработчик выхода
            const logoutBtn = accountDropdown.querySelector('#logoutBtn');
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Клик по кнопке выхода');
                this.logout();
            });

            // Закрытие выпадающего меню при клике вне его
            document.addEventListener('click', (e) => {
                if (!accountIcon.contains(e.target) && !accountDropdown.contains(e.target)) {
                    if (accountDropdown.style.display === 'block') {
                        accountDropdown.classList.remove('show');
                        setTimeout(() => {
                            accountDropdown.style.display = 'none';
                        }, 200);
                    }
                }
            });

            console.log('Финальное состояние navMenu:', navMenu.innerHTML);
            console.log('=== updateAuthUI УСПЕШНО ЗАВЕРШЕНО ===');
        } else {
            console.log('=== updateAuthUI ОШИБКА: НЕ ВСЕ ЭЛЕМЕНТЫ НАЙДЕНЫ ===');
            console.log('Попытка повторного поиска через 500мс...');

            setTimeout(() => {
                console.log('Повторная попытка updateAuthUI...');
                this.updateAuthUI(user);
            }, 500);
        }
    }

    // Переключение выпадающего меню аккаунта
    toggleAccountDropdown() {
        const dropdown = document.getElementById('accountDropdown');
        if (dropdown) {
            const isVisible = dropdown.style.display === 'block';

            if (isVisible) {
                // Скрываем с анимацией
                dropdown.classList.remove('show');
                setTimeout(() => {
                    dropdown.style.display = 'none';
                }, 200);
            } else {
                // Показываем с анимацией
                dropdown.style.display = 'block';
                setTimeout(() => {
                    dropdown.classList.add('show');
                }, 10);
            }

            console.log('Account dropdown toggled:', !isVisible);
        }
    }

    // Выход из системы
    logout() {
        console.log('Выход из системы');

        // Отправляем событие для отключения режима редактирования
        const logoutEvent = new CustomEvent('userLoggedOut', {
            detail: { reason: 'manual_logout' }
        });
        document.dispatchEvent(logoutEvent);

        // Устанавливаем флаг выхода для предотвращения автоматического входа
        sessionStorage.setItem('userLoggedOut', 'true');

        // Полная очистка всех данных авторизации
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userSession');
        this.token = null;

        // Уничтожаем сессию через SessionManager
        if (window.sessionManager) {
            window.sessionManager.destroySession();
        }

        // Удалить элементы авторизованного пользователя
        const accountIcon = document.getElementById('accountIcon');
        const accountDropdown = document.getElementById('accountDropdown');
        const adminLink = document.querySelector('a[data-admin-link="true"]');

        if (accountIcon) accountIcon.remove();
        if (accountDropdown) accountDropdown.remove();
        if (adminLink) adminLink.remove();

        // Восстановить кнопки входа и регистрации
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            // Создать кнопку входа
            const loginBtn = document.createElement('a');
            loginBtn.href = '#';
            loginBtn.className = 'nav-link';
            loginBtn.id = 'loginBtn';
            loginBtn.textContent = 'Вход';
            navMenu.appendChild(loginBtn);

            // Создать кнопку регистрации для desktop
            const registerBtn = document.createElement('a');
            registerBtn.href = '#';
            registerBtn.className = 'nav-link desktop-only';
            registerBtn.id = 'registerBtn';
            registerBtn.textContent = 'Регистрация';
            navMenu.appendChild(registerBtn);

            // Переинициализировать обработчики
            setTimeout(() => {
                this.setupNavigationButtons();
            }, 100);
        }

        this.showSuccessMessage('Вы успешно вышли из системы');
        console.log('Выход завершен, интерфейс восстановлен');

        // Удаляем плавающую кнопку редактирования
        this.removeFloatingEditButton();

        // Перенаправляем на главную страницу через 1 секунду
        setTimeout(() => {
            console.log('Перенаправление на главную страницу...');
            window.location.href = '/';
        }, 1000);
    }

    // Создание плавающей кнопки редактирования
    createFloatingEditButton() {
        // Удаляем существующую кнопку если есть
        const existingBtn = document.getElementById('floatingEditBtn');
        if (existingBtn) {
            existingBtn.remove();
        }

        // Создаем плавающую кнопку только для страниц с контентом
        const isContentPage = document.querySelector('.page-content') ||
                             document.querySelector('.main-content') ||
                             window.location.pathname.includes('/pages/');

        if (isContentPage) {
            const floatingBtn = document.createElement('button');
            floatingBtn.id = 'floatingEditBtn';
            floatingBtn.className = 'floating-edit-btn';
            floatingBtn.innerHTML = '✏️ Редактировать';
            floatingBtn.title = 'Включить режим редактирования';

            // Добавляем кнопку в body
            document.body.appendChild(floatingBtn);

            // Обработчик клика
            floatingBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.editMode) {
                    window.editMode.toggleEditMode();
                }
            });

            console.log('Плавающая кнопка редактирования создана');
        }
    }

    // Удаление плавающей кнопки редактирования
    removeFloatingEditButton() {
        const floatingBtn = document.getElementById('floatingEditBtn');
        if (floatingBtn) {
            floatingBtn.remove();
            console.log('Плавающая кнопка редактирования удалена');
        }
    }

    // Обработка форм записи на программы
    async handleBookingForm(form) {
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            program: formData.get('program') || formData.get('ceremony') || formData.get('course'),
            date: formData.get('date'),
            message: formData.get('message') || formData.get('experience')
        };

        // Валидация
        if (!data.name || !data.email || !data.program) {
            this.showErrorMessage('Заполните все обязательные поля');
            return;
        }

        if (!this.isValidEmail(data.email)) {
            this.showErrorMessage('Введите корректный email адрес');
            return;
        }

        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Отправка...';
        submitBtn.disabled = true;

        try {
            // Отправка через API
            const response = await fetch(`${this.apiBaseUrl}/api/booking`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                this.showSuccessMessage('Ваша заявка принята! Мы свяжемся с вами в ближайшее время.');
                form.reset();
            } else {
                throw new Error(result.error || 'Ошибка отправки заявки');
            }

        } catch (error) {
            console.error('Ошибка записи:', error);
            this.showErrorMessage('Произошла ошибка при отправке заявки. Попробуйте позже.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    // Имитация авторизации (заменить на реальную логику)
    async simulateAuth(data) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Простая проверка для демонстрации
                if (data.email === 'admin@pyramid-tota.ru' && data.password === 'admin123') {
                    resolve({ success: true, user: { email: data.email } });
                } else {
                    reject(new Error('Неверные данные'));
                }
            }, 1000);
        });
    }
    
    // Имитация регистрации (заменить на реальную логику)
    async simulateRegistration(data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, user: { name: data.name, email: data.email } });
            }, 1000);
        });
    }
    
    // Настройка валидации в реальном времени
    setupFormValidation() {
        const inputs = document.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });
    }
    
    // Валидация отдельного поля
    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        switch (field.type) {
            case 'email':
                isValid = this.isValidEmail(value);
                errorMessage = 'Введите корректный email адрес';
                break;
            case 'tel':
                isValid = !value || this.isValidPhone(value);
                errorMessage = 'Введите корректный номер телефона';
                break;
            case 'password':
                isValid = value.length >= 6;
                errorMessage = 'Пароль должен содержать минимум 6 символов';
                break;
            default:
                if (field.required) {
                    isValid = value.length > 0;
                    errorMessage = 'Это поле обязательно для заполнения';
                }
        }
        
        if (!isValid) {
            this.showFieldError(field, errorMessage);
        } else {
            this.clearFieldError(field);
        }
        
        return isValid;
    }
    
    // Показать ошибку поля
    showFieldError(field, message) {
        field.classList.add('error');
        
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
    }
    
    // Очистить ошибку поля
    clearFieldError(field) {
        field.classList.remove('error');
        
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    // Валидация email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Валидация телефона
    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }
    
    // Показать сообщение об успехе
    showSuccessMessage(message) {
        if (window.PyramidTOTA && window.PyramidTOTA.showNotification) {
            window.PyramidTOTA.showNotification(message, 'success');
        } else {
            alert(message);
        }
    }
    
    // Показать сообщение об ошибке
    showErrorMessage(message) {
        if (window.PyramidTOTA && window.PyramidTOTA.showNotification) {
            window.PyramidTOTA.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }
}

// Добавление стилей для валидации
const validationStyles = `
    .form-group input.error,
    .form-group textarea.error {
        border-color: #e94560;
        box-shadow: 0 0 10px rgba(233, 69, 96, 0.3);
    }
    
    .field-error {
        color: #e94560;
        font-size: 0.8rem;
        margin-top: 0.5rem;
        animation: fadeInUp 0.3s ease;
    }
    
    .notification-success {
        border-left-color: #4caf50;
    }
    
    .notification-error {
        border-left-color: #e94560;
    }
`;

// Добавление стилей в документ
const styleSheet = document.createElement('style');
styleSheet.textContent = validationStyles;
document.head.appendChild(styleSheet);

// Глобальная переменная для доступа к FormHandler
let formHandler;

// Инициализация обработчика форм
document.addEventListener('DOMContentLoaded', () => {
    formHandler = new FormHandler();

    // Глобальная функция для тестирования
    window.testAuth = function() {
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            console.log('Принудительное обновление интерфейса для:', user);
            formHandler.updateAuthUI(user);
        } else {
            console.log('Пользователь не авторизован');
        }
    };

    // Глобальная функция для проверки статуса
    window.checkAuth = function() {
        formHandler.checkAuthStatus();
    };
});
