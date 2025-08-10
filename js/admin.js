// Админ-панель для сайта "Пирамида ТОТА"

class AdminPanel {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.token = localStorage.getItem('authToken');
        this.currentTab = 'contacts';
        
        this.init();
    }
    
    init() {
        this.checkAdminAccess();
        this.setupTabs();
        this.setupLogout();
        this.loadDashboardData();
    }
    
    // Проверка прав администратора
    async checkAdminAccess() {
        if (!this.token) {
            this.redirectToLogin();
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Unauthorized');
            }
            
            const user = await response.json();
            
            if (user.role !== 'admin') {
                alert('У вас нет прав администратора');
                window.location.href = 'index.html';
                return;
            }
            
            // Обновить информацию о пользователе
            const userInfo = document.getElementById('adminUserInfo');
            if (userInfo) {
                userInfo.textContent = `${user.name} (Администратор)`;
            }
            
        } catch (error) {
            console.error('Ошибка проверки доступа:', error);
            this.redirectToLogin();
        }
    }
    
    redirectToLogin() {
        alert('Необходима авторизация администратора');
        window.location.href = 'index.html';
    }
    
    // Настройка вкладок
    setupTabs() {
        const tabs = document.querySelectorAll('.admin-tab');
        const contents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // Убрать активный класс со всех вкладок
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => {
                    c.classList.remove('active');
                    c.style.display = 'none';
                });
                
                // Активировать выбранную вкладку
                tab.classList.add('active');
                const content = document.getElementById(`${tabName}-content`);
                if (content) {
                    content.classList.add('active');
                    content.style.display = 'block';
                }
                
                this.currentTab = tabName;
                this.loadTabData(tabName);
            });
        });
    }
    
    // Настройка выхода
    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            });
        }
    }
    
    // Загрузка данных дашборда
    async loadDashboardData() {
        try {
            // Загрузить статистику
            await this.loadStats();
            
            // Загрузить данные текущей вкладки
            await this.loadTabData(this.currentTab);
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        }
    }
    
    // Загрузка статистики
    async loadStats() {
        try {
            const [contacts, bookings, subscribers, users] = await Promise.all([
                this.fetchData('/api/admin/contacts/count'),
                this.fetchData('/api/admin/bookings/count'),
                this.fetchData('/api/admin/subscribers/count'),
                this.fetchData('/api/admin/users/count')
            ]);
            
            document.getElementById('contactCount').textContent = contacts.count || 0;
            document.getElementById('bookingCount').textContent = bookings.count || 0;
            document.getElementById('subscriberCount').textContent = subscribers.count || 0;
            document.getElementById('userCount').textContent = users.count || 0;
            
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        }
    }
    
    // Загрузка данных вкладки
    async loadTabData(tabName) {
        try {
            let data;
            
            switch (tabName) {
                case 'contacts':
                    data = await this.fetchData('/api/admin/contacts');
                    this.renderContactsTable(data);
                    break;
                case 'bookings':
                    data = await this.fetchData('/api/admin/bookings');
                    this.renderBookingsTable(data);
                    break;
                case 'subscribers':
                    data = await this.fetchData('/api/admin/subscribers');
                    this.renderSubscribersTable(data);
                    break;
                case 'users':
                    data = await this.fetchData('/api/admin/users');
                    this.renderUsersTable(data);
                    break;
            }
        } catch (error) {
            console.error(`Ошибка загрузки данных ${tabName}:`, error);
        }
    }
    
    // Универсальный метод для запросов к API
    async fetchData(endpoint) {
        const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
    
    // Отрисовка таблицы сообщений
    renderContactsTable(data) {
        const tbody = document.getElementById('contactsTable');
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Нет данных</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(contact => `
            <tr>
                <td>${this.formatDate(contact.created_at)}</td>
                <td>${contact.name}</td>
                <td>${contact.email}</td>
                <td>${contact.phone || 'Не указан'}</td>
                <td title="${contact.message}">${this.truncateText(contact.message, 50)}</td>
                <td><span class="status-${contact.status}">${this.getStatusText(contact.status)}</span></td>
                <td>
                    <div class="admin-actions">
                        <button class="admin-btn" onclick="adminPanel.updateStatus('contacts', ${contact.id}, 'resolved')">
                            Обработано
                        </button>
                        <button class="admin-btn danger" onclick="adminPanel.deleteItem('contacts', ${contact.id})">
                            Удалить
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    // Отрисовка таблицы записей
    renderBookingsTable(data) {
        const tbody = document.getElementById('bookingsTable');
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Нет данных</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(booking => `
            <tr>
                <td>${this.formatDate(booking.created_at)}</td>
                <td>${booking.name}</td>
                <td>${booking.email}</td>
                <td>${booking.program}</td>
                <td>${booking.date ? this.formatDate(booking.date) : 'Не указана'}</td>
                <td><span class="status-${booking.status}">${this.getStatusText(booking.status)}</span></td>
                <td>
                    <div class="admin-actions">
                        <button class="admin-btn" onclick="adminPanel.updateStatus('bookings', ${booking.id}, 'confirmed')">
                            Подтвердить
                        </button>
                        <button class="admin-btn danger" onclick="adminPanel.deleteItem('bookings', ${booking.id})">
                            Удалить
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    // Отрисовка таблицы подписчиков
    renderSubscribersTable(data) {
        const tbody = document.getElementById('subscribersTable');
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Нет данных</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(subscriber => `
            <tr>
                <td>${this.formatDate(subscriber.created_at)}</td>
                <td>${subscriber.email}</td>
                <td><span class="status-${subscriber.status}">${this.getStatusText(subscriber.status)}</span></td>
                <td>
                    <div class="admin-actions">
                        <button class="admin-btn danger" onclick="adminPanel.deleteItem('subscribers', ${subscriber.id})">
                            Удалить
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    // Отрисовка таблицы пользователей
    renderUsersTable(data) {
        const tbody = document.getElementById('usersTable');
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Нет данных</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(user => `
            <tr>
                <td>${this.formatDate(user.created_at)}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>
                    <div class="admin-actions">
                        ${user.role !== 'admin' ? `
                            <button class="admin-btn" onclick="adminPanel.changeUserRole(${user.id}, 'admin')">
                                Сделать админом
                            </button>
                        ` : ''}
                        <button class="admin-btn danger" onclick="adminPanel.deleteItem('users', ${user.id})">
                            Удалить
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    // Обновление статуса записи
    async updateStatus(type, id, status) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/${type}/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            
            if (response.ok) {
                this.loadTabData(this.currentTab);
                this.loadStats();
            } else {
                throw new Error('Ошибка обновления статуса');
            }
        } catch (error) {
            console.error('Ошибка обновления статуса:', error);
            alert('Ошибка обновления статуса');
        }
    }
    
    // Удаление записи
    async deleteItem(type, id) {
        if (!confirm('Вы уверены, что хотите удалить эту запись?')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/${type}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                this.loadTabData(this.currentTab);
                this.loadStats();
            } else {
                throw new Error('Ошибка удаления');
            }
        } catch (error) {
            console.error('Ошибка удаления:', error);
            alert('Ошибка удаления записи');
        }
    }
    
    // Изменение роли пользователя
    async changeUserRole(userId, role) {
        if (!confirm(`Изменить роль пользователя на "${role}"?`)) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role })
            });
            
            if (response.ok) {
                this.loadTabData('users');
            } else {
                throw new Error('Ошибка изменения роли');
            }
        } catch (error) {
            console.error('Ошибка изменения роли:', error);
            alert('Ошибка изменения роли пользователя');
        }
    }
    
    // Вспомогательные методы
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    getStatusText(status) {
        const statusMap = {
            'new': 'Новое',
            'pending': 'В обработке',
            'resolved': 'Обработано',
            'confirmed': 'Подтверждено',
            'active': 'Активен',
            'inactive': 'Неактивен'
        };
        return statusMap[status] || status;
    }
}

// Инициализация админ-панели
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});
