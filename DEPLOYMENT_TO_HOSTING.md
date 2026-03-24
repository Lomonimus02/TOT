# 🚀 Подробная инструкция по развертыванию сайта на хостинге

## 📋 Информация о сервере
- **IP-адрес**: 45.90.219.229
- **Пользователь**: root
- **Пароль**: f3I5nrI4959g

## 🎯 Обзор проекта
Ваш сайт "Пирамида ТОТА" - это Node.js приложение с:
- Express сервером
- PostgreSQL базой данных (Neon)
- Системой управления контентом
- Админ-панелью
- API для форм и блоков

## 🔧 Шаг 1: Подключение к серверу

### 1.1 Подключение по SSH
```bash
ssh root@45.90.219.229
# Введите пароль: f3I5nrI4959g
```

### 1.2 Обновление системы
```bash
# Обновляем пакеты
apt update && apt upgrade -y

# Устанавливаем необходимые пакеты
apt install -y curl wget git nginx certbot python3-certbot-nginx
```

## 🐳 Шаг 2: Установка Node.js

### 2.1 Установка Node.js 18.x
```bash
# Добавляем репозиторий NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Устанавливаем Node.js
apt install -y nodejs

# Проверяем версии
node --version
npm --version
```

### 2.2 Установка PM2 для управления процессами
```bash
npm install -g pm2
```

## 🗄️ Шаг 3: Настройка базы данных

### 3.1 Использование локальной SQLite базы данных
Ваш проект поддерживает SQLite базу данных, которая будет создана автоматически при первом запуске. Это упрощает развертывание, так как не требует настройки внешней базы данных.

### 3.2 Перенос локальной базы данных
Если у вас уже есть локальная база данных с данными, скопируйте файлы:
- `server/content.db` - основная база данных
- `server/database.db` - дополнительная база данных (если есть)

Эти файлы нужно будет загрузить на сервер в папку `/var/www/pyramid-tota/server/`

## 📁 Шаг 4: Загрузка проекта

### 4.1 Создание директории проекта
```bash
# Создаем директорию для проекта
mkdir -p /var/www/pyramid-tota
cd /var/www/pyramid-tota

# Устанавливаем права доступа
chown -R www-data:www-data /var/www/pyramid-tota
```

### 4.2 Загрузка файлов проекта
У вас есть несколько вариантов:

#### Вариант A: Загрузка через SCP (рекомендуется)
На вашем локальном компьютере выполните:
```bash
# Создайте архив проекта (исключив node_modules, но ВКЛЮЧИВ базы данных)
tar --exclude='node_modules' --exclude='.git' -czf pyramid-tota.tar.gz .

# Загрузите архив на сервер
scp pyramid-tota.tar.gz root@45.90.219.229:/var/www/pyramid-tota/

# На сервере распакуйте
cd /var/www/pyramid-tota
tar -xzf pyramid-tota.tar.gz
rm pyramid-tota.tar.gz
```

#### Вариант B: Клонирование из Git (если проект в репозитории)
```bash
cd /var/www/pyramid-tota
git clone https://github.com/your-username/your-repo.git .
```

#### Вариант C: Загрузка через FTP/SFTP
Используйте любой FTP клиент для загрузки файлов в `/var/www/pyramid-tota/`

**⚠️ ВАЖНО**: Убедитесь, что файлы базы данных (`server/content.db`, `server/database.db`) загружены вместе с проектом!

## 📊 Шаг 5: Перенос локальной базы данных

### 5.1 Подготовка локальной базы данных
Перед загрузкой на сервер убедитесь, что у вас есть файлы базы данных:
```bash
# Проверьте наличие файлов базы данных
ls -la server/
# Должны быть файлы:
# - content.db (основная база данных)
# - database.db (дополнительная база данных, если есть)
```

### 5.2 Создание архива с базой данных
```bash
# Создайте архив проекта ВКЛЮЧАЯ базы данных
tar --exclude='node_modules' --exclude='.git' -czf pyramid-tota-with-db.tar.gz .

# Проверьте размер архива (должен быть больше обычного)
ls -lh pyramid-tota-with-db.tar.gz
```

### 5.3 Загрузка архива на сервер
```bash
# Загрузите архив на сервер
scp pyramid-tota-with-db.tar.gz root@45.90.219.229:/var/www/pyramid-tota/

# На сервере распакуйте
cd /var/www/pyramid-tota
tar -xzf pyramid-tota-with-db.tar.gz
rm pyramid-tota-with-db.tar.gz

# Проверьте, что базы данных загружены
ls -la server/
```

## 🔧 Шаг 6: Настройка проекта

### 6.1 Установка зависимостей
```bash
cd /var/www/pyramid-tota
npm install
```

### 6.2 Создание файла переменных окружения
```bash
# Создаем файл .env для SQLite
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
JWT_SECRET=pyramid_tota_secret_key_2025_CHANGE_THIS
# Для SQLite базы данных не нужна DATABASE_URL
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN
TELEGRAM_CHAT_ID=YOUR_CHAT_ID
EOF
```

### 6.3 Настройка прав доступа
```bash
# Устанавливаем права на файлы
chown -R www-data:www-data /var/www/pyramid-tota
chmod -R 755 /var/www/pyramid-tota

# Права на папку uploads
chmod -R 777 /var/www/pyramid-tota/images/uploads

# Права на базу данных SQLite
chmod 666 /var/www/pyramid-tota/server/content.db 2>/dev/null || true
chmod 666 /var/www/pyramid-tota/server/database.db 2>/dev/null || true
```

## 🌐 Шаг 6: Настройка Nginx

### 6.1 Создание конфигурации Nginx
```bash
# Создаем конфигурацию сайта
cat > /etc/nginx/sites-available/pyramid-tota << 'EOF'
server {
    listen 80;
    server_name 45.90.219.229;

    # Логи
    access_log /var/log/nginx/pyramid-tota.access.log;
    error_log /var/log/nginx/pyramid-tota.error.log;

    # Основное приложение
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Статические файлы (оптимизация)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        root /var/www/pyramid-tota;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Загрузки изображений
    location /images/uploads/ {
        alias /var/www/pyramid-tota/images/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
EOF
```

### 6.2 Активация конфигурации
```bash
# Создаем символическую ссылку
ln -s /etc/nginx/sites-available/pyramid-tota /etc/nginx/sites-enabled/

# Удаляем дефолтную конфигурацию
rm -f /etc/nginx/sites-enabled/default

# Проверяем конфигурацию
nginx -t

# Перезапускаем Nginx
systemctl restart nginx
systemctl enable nginx
```

## 🔒 Шаг 7: Настройка SSL сертификата (опционально)

### 7.1 Важно: SSL только для доменов
**Let's Encrypt не выдает сертификаты для IP-адресов!** Для настройки SSL вам нужен домен.

### 7.2 Если у вас есть домен
```bash
# Получаем SSL сертификат для домена
certbot --nginx -d yourdomain.com

# Настраиваем автоматическое обновление
crontab -e
# Добавьте строку:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 7.3 Без SSL сертификата
Сайт будет работать по HTTP (не HTTPS). Это нормально для тестирования и разработки.

## 🚀 Шаг 8: Запуск приложения

### 8.1 Создание PM2 конфигурации
```bash
# Создаем файл конфигурации PM2
cat > /var/www/pyramid-tota/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'pyramid-tota',
    script: 'server.js',
    cwd: '/var/www/pyramid-tota',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/pyramid-tota-error.log',
    out_file: '/var/log/pm2/pyramid-tota-out.log',
    log_file: '/var/log/pm2/pyramid-tota-combined.log',
    time: true
  }]
};
EOF
```

### 8.2 Запуск приложения
```bash
cd /var/www/pyramid-tota

# Запускаем через PM2
pm2 start ecosystem.config.js

# Сохраняем конфигурацию PM2
pm2 save

# Настраиваем автозапуск PM2
pm2 startup
# Выполните команду, которую покажет PM2

# Проверяем статус
pm2 status
pm2 logs pyramid-tota
```

## 🔧 Шаг 9: Настройка файрвола

### 9.1 Настройка UFW
```bash
# Включаем файрвол
ufw enable

# Разрешаем SSH
ufw allow ssh

# Разрешаем HTTP и HTTPS
ufw allow 80
ufw allow 443

# Проверяем статус
ufw status
```

## ✅ Шаг 10: Проверка развертывания

### 10.1 Проверка сервисов
```bash
# Проверяем статус Nginx
systemctl status nginx

# Проверяем статус PM2
pm2 status

# Проверяем логи
pm2 logs pyramid-tota --lines 50
```

### 10.2 Тестирование сайта
1. Откройте браузер и перейдите по адресу: `http://45.90.219.229`
2. Проверьте основные функции:
   - Загрузка главной страницы
   - Переходы между страницами
   - Работа форм
   - Админ-панель (если настроена)

## 🔧 Дополнительные настройки

### Настройка Telegram бота (опционально)
1. Создайте бота через @BotFather в Telegram
2. Получите токен бота
3. Узнайте ваш Chat ID
4. Обновите переменные в файле `.env`:
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### Настройка домена (если есть)
1. Настройте DNS записи для вашего домена
2. Обновите конфигурацию Nginx:
```bash
# Отредактируйте файл конфигурации
nano /etc/nginx/sites-available/pyramid-tota

# Измените server_name на ваш домен
server_name yourdomain.com www.yourdomain.com;
```

## 📊 Мониторинг и обслуживание

### Просмотр логов
```bash
# Логи приложения
pm2 logs pyramid-tota

# Логи Nginx
tail -f /var/log/nginx/pyramid-tota.access.log
tail -f /var/log/nginx/pyramid-tota.error.log

# Системные логи
journalctl -u nginx -f
```

### Перезапуск сервисов
```bash
# Перезапуск приложения
pm2 restart pyramid-tota

# Перезапуск Nginx
systemctl restart nginx

# Перезагрузка всей системы
reboot
```

### Обновление приложения
```bash
# Остановка приложения
pm2 stop pyramid-tota

# Обновление файлов (загрузите новые файлы)
# Установка новых зависимостей
npm install

# Запуск приложения
pm2 start pyramid-tota
```

## 🛡️ Безопасность

### Настройка SSH ключей (рекомендуется)
```bash
# На вашем локальном компьютере
ssh-keygen -t rsa -b 4096

# Копируем публичный ключ на сервер
ssh-copy-id root@45.90.219.229

# Отключаем парольную аутентификацию (опционально)
# nano /etc/ssh/sshd_config
# PasswordAuthentication no
# systemctl restart ssh
```

### Регулярные обновления
```bash
# Создаем скрипт для обновлений
cat > /root/update-system.sh << 'EOF'
#!/bin/bash
apt update && apt upgrade -y
pm2 restart pyramid-tota
systemctl restart nginx
EOF

chmod +x /root/update-system.sh

# Добавляем в cron для еженедельных обновлений
crontab -e
# Добавьте: 0 2 * * 0 /root/update-system.sh
```

## 🆘 Устранение неполадок

### Проблема: Ошибка "ReferenceError: File is not defined" (undici)
Это проблема совместимости версий Node.js. Решение:

```bash
# Быстрое исправление
chmod +x quick-fix.sh
./quick-fix.sh

# Или полное исправление
chmod +x fix-node-version.sh
./fix-node-version.sh
```

### Проблема: Сайт не загружается
```bash
# Проверяем статус сервисов
systemctl status nginx
pm2 status

# Проверяем порты
netstat -tlnp | grep :80
netstat -tlnp | grep :3000

# Проверяем логи
pm2 logs pyramid-tota
tail -f /var/log/nginx/error.log
```

### Проблема: Ошибки базы данных
```bash
# Проверяем подключение к БД
cd /var/www/pyramid-tota
node -e "console.log(process.env.DATABASE_URL)"
```

### Проблема: Недостаточно памяти
```bash
# Проверяем использование памяти
free -h
pm2 monit

# Ограничиваем память для PM2
pm2 restart pyramid-tota --max-memory-restart 500M
```

## 📞 Поддержка

### Полезные команды
```bash
# Перезапуск всех сервисов
systemctl restart nginx && pm2 restart all

# Просмотр статуса
systemctl status nginx
pm2 status
ufw status

# Очистка логов
pm2 flush
> /var/log/nginx/pyramid-tota.access.log
> /var/log/nginx/pyramid-tota.error.log
```

### Контакты
- **Email**: support@pyramid-tota.ru
- **Telegram**: @pyramid_tota_support

---

## 🎉 Поздравляем!

Ваш сайт "Пирамида ТОТА" успешно развернут и доступен по адресу:
**http://45.90.219.229**

### ✅ Чек-лист развертывания
- [x] Сервер настроен
- [x] Node.js установлен
- [x] Проект загружен
- [x] Зависимости установлены
- [x] Nginx настроен
- [x] SSL сертификат установлен
- [x] Приложение запущено
- [x] Файрвол настроен
- [x] Сайт протестирован

**Ваш сайт готов к работе!** 🚀
