/**
 * Система управления сессиями для сайта "Пирамида ТОТА"
 * Обеспечивает безопасное управление пользовательскими сессиями
 */

class SessionManager {
    constructor() {
        this.sessionDuration = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
        this.checkInterval = 5 * 60 * 1000; // Проверка каждые 5 минут
        this.warningTime = 10 * 60 * 1000; // Предупреждение за 10 минут до истечения
        
        this.init();
    }

    init() {
        console.log('Инициализация системы сессий');
        
        // Проверяем существующую сессию при загрузке
        this.validateSession();
        
        // Запускаем периодическую проверку сессий
        this.startSessionMonitoring();
        
        // Обновляем активность при действиях пользователя
        this.setupActivityTracking();
    }

    // Создание новой сессии
    createSession(user) {
        console.log('Создание новой сессии для пользователя:', user.email);
        
        const sessionData = {
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role || 'user',
            createdAt: Date.now(),
            lastActivity: Date.now(),
            expiresAt: Date.now() + this.sessionDuration,
            token: this.generateSessionToken()
        };

        // Сохраняем сессию
        localStorage.setItem('userSession', JSON.stringify(sessionData));
        localStorage.setItem('authToken', sessionData.token);
        localStorage.setItem('user', JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }));

        console.log('Сессия создана:', {
            token: sessionData.token,
            expiresAt: new Date(sessionData.expiresAt).toLocaleString()
        });

        return sessionData;
    }

    // Валидация существующей сессии
    validateSession() {
        console.log('Проверка существующей сессии...');
        
        const sessionData = this.getSessionData();
        
        if (!sessionData) {
            console.log('Сессия не найдена');
            return false;
        }

        const now = Date.now();
        
        // Проверяем, не истекла ли сессия
        if (now > sessionData.expiresAt) {
            console.log('Сессия истекла');
            this.destroySession();
            return false;
        }

        // Обновляем последнюю активность
        this.updateActivity();
        
        console.log('Сессия действительна');
        return true;
    }

    // Получение данных сессии
    getSessionData() {
        try {
            const sessionJson = localStorage.getItem('userSession');
            return sessionJson ? JSON.parse(sessionJson) : null;
        } catch (error) {
            console.error('Ошибка парсинга данных сессии:', error);
            this.destroySession();
            return null;
        }
    }

    // Получение текущего пользователя
    getCurrentUser() {
        const sessionData = this.getSessionData();
        if (sessionData && this.validateSession()) {
            return {
                id: sessionData.userId,
                name: sessionData.name,
                email: sessionData.email,
                role: sessionData.role
            };
        }
        return null;
    }

    // Обновление активности пользователя
    updateActivity() {
        const sessionData = this.getSessionData();
        if (sessionData) {
            sessionData.lastActivity = Date.now();
            localStorage.setItem('userSession', JSON.stringify(sessionData));
        }
    }

    // Продление сессии
    extendSession() {
        const sessionData = this.getSessionData();
        if (sessionData) {
            sessionData.expiresAt = Date.now() + this.sessionDuration;
            sessionData.lastActivity = Date.now();
            localStorage.setItem('userSession', JSON.stringify(sessionData));
            console.log('Сессия продлена до:', new Date(sessionData.expiresAt).toLocaleString());
        }
    }

    // Уничтожение сессии
    destroySession() {
        console.log('Уничтожение сессии');

        // Отправляем событие для отключения режима редактирования
        const logoutEvent = new CustomEvent('userLoggedOut', {
            detail: { reason: 'session_expired' }
        });
        document.dispatchEvent(logoutEvent);

        localStorage.removeItem('userSession');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');

        // Уведомляем об окончании сессии
        if (window.formHandler && typeof window.formHandler.logout === 'function') {
            window.formHandler.logout();
        }
    }

    // Генерация токена сессии
    generateSessionToken() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 64; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }

    // Мониторинг сессий
    startSessionMonitoring() {
        setInterval(() => {
            const sessionData = this.getSessionData();
            if (sessionData) {
                const now = Date.now();
                const timeLeft = sessionData.expiresAt - now;
                
                // Предупреждение за 10 минут до истечения
                if (timeLeft <= this.warningTime && timeLeft > 0) {
                    this.showSessionWarning(Math.floor(timeLeft / 60000));
                }
                
                // Автоматическое уничтожение истекшей сессии
                if (timeLeft <= 0) {
                    console.log('Сессия автоматически истекла');
                    this.destroySession();
                }
            }
        }, this.checkInterval);
    }

    // Отслеживание активности пользователя
    setupActivityTracking() {
        const events = ['click', 'keypress', 'scroll', 'mousemove'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.updateActivity();
            }, { passive: true });
        });
    }

    // Предупреждение об истечении сессии
    showSessionWarning(minutesLeft) {
        if (window.formHandler && typeof window.formHandler.showWarningMessage === 'function') {
            window.formHandler.showWarningMessage(
                `Ваша сессия истечет через ${minutesLeft} минут. Выполните любое действие для продления.`
            );
        }
    }

    // Получение времени до истечения сессии
    getTimeUntilExpiry() {
        const sessionData = this.getSessionData();
        if (sessionData) {
            return Math.max(0, sessionData.expiresAt - Date.now());
        }
        return 0;
    }

    // Проверка, авторизован ли пользователь
    isAuthenticated() {
        return this.validateSession();
    }
}

// Создаем глобальный экземпляр менеджера сессий
window.sessionManager = new SessionManager();

// Экспортируем для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionManager;
}
