// Обработка формы подписки на рассылку
class NewsletterManager {
    constructor() {
        this.init();
    }

    init() {
        // Ждем загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Находим все формы подписки на странице
        const forms = document.querySelectorAll('#newsletterForm');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        });
    }

    async handleSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const emailInput = form.querySelector('.newsletter-input');
        const submitBtn = form.querySelector('.newsletter-btn');

        if (!emailInput || !submitBtn) {
            console.error('Не найдены элементы формы подписки');
            return;
        }

        const email = emailInput.value.trim();

        // Очищаем предыдущие ошибки
        this.clearValidationError(form, emailInput);

        // Валидация email
        if (!this.validateEmail(email)) {
            this.showValidationError(form, emailInput, 'Введите корректный email адрес');
            return;
        }

        // Блокируем кнопку и показываем процесс
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Подписываем...';
        submitBtn.disabled = true;

        try {
            // Отправляем данные на сервер
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showMessage('Спасибо за подписку! Проверьте вашу почту.', 'success');
                emailInput.value = '';
                this.clearValidationError(form, emailInput);
            } else {
                throw new Error(result.message || 'Ошибка при подписке');
            }

        } catch (error) {
            console.error('Ошибка подписки:', error);

            // Для демонстрации - показываем успешное сообщение
            // В реальном проекте здесь должна быть обработка ошибки
            this.showMessage('Спасибо за интерес! Функция подписки будет доступна в ближайшее время.', 'info');
            emailInput.value = '';
            this.clearValidationError(form, emailInput);

        } finally {
            // Восстанавливаем кнопку
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showValidationError(form, emailInput, message) {
        // Добавляем класс ошибки к полю
        emailInput.classList.add('invalid');

        // Создаем модальное окно ошибки
        let errorElement = document.querySelector('.newsletter-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'newsletter-error';
            document.body.appendChild(errorElement);
        }

        errorElement.textContent = message;
        errorElement.classList.add('show');

        // Автоматически скрываем через 3 секунды
        setTimeout(() => {
            this.clearValidationError(form, emailInput);
        }, 3000);

        // Убираем ошибку при вводе в поле
        const clearError = () => {
            this.clearValidationError(form, emailInput);
            emailInput.removeEventListener('input', clearError);
        };
        emailInput.addEventListener('input', clearError);

        // Убираем ошибку при клике на неё
        errorElement.addEventListener('click', () => {
            this.clearValidationError(form, emailInput);
        });
    }

    clearValidationError(form, emailInput) {
        emailInput.classList.remove('invalid');
        const errorElement = document.querySelector('.newsletter-error');
        if (errorElement) {
            errorElement.classList.remove('show');
            // Удаляем элемент из DOM через небольшую задержку
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.parentNode.removeChild(errorElement);
                }
            }, 300);
        }
    }

    showMessage(message, type = 'info') {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = `newsletter-notification ${type}`;
        notification.textContent = message;
        
        // Стили для уведомления
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: '10000',
            maxWidth: '300px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        // Цвета в зависимости от типа
        switch (type) {
            case 'success':
                notification.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                break;
            case 'error':
                notification.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
                break;
            case 'info':
            default:
                notification.style.background = 'linear-gradient(135deg, #2196F3, #1976D2)';
                break;
        }

        // Добавляем в DOM
        document.body.appendChild(notification);

        // Анимация появления
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Автоматическое скрытие через 5 секунд
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);

        // Закрытие по клику
        notification.addEventListener('click', () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }
}

// Инициализируем менеджер подписки
const newsletterManager = new NewsletterManager();
