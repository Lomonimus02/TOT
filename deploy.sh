#!/bin/bash

# 🚀 Скрипт автоматического развертывания сайта "Пирамида ТОТА"
# Использование: ./deploy.sh

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Проверка прав root
if [ "$EUID" -ne 0 ]; then
    error "Запустите скрипт с правами root: sudo ./deploy.sh"
fi

log "🚀 Начинаем развертывание сайта 'Пирамида ТОТА'"

# Шаг 1: Обновление системы
log "📦 Обновляем систему..."
apt update && apt upgrade -y
success "Система обновлена"

# Шаг 2: Установка необходимых пакетов
log "🔧 Устанавливаем необходимые пакеты..."
apt install -y curl wget git nginx certbot python3-certbot-nginx ufw
success "Пакеты установлены"

# Шаг 3: Установка Node.js
log "📦 Устанавливаем Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
success "Node.js установлен: $(node --version)"

# Шаг 4: Установка PM2
log "🔧 Устанавливаем PM2..."
npm install -g pm2
success "PM2 установлен"

# Шаг 5: Создание директории проекта
log "📁 Создаем директорию проекта..."
mkdir -p /var/www/pyramid-tota
cd /var/www/pyramid-tota
chown -R www-data:www-data /var/www/pyramid-tota
success "Директория создана"

# Шаг 6: Загрузка проекта
log "📥 Загружаем файлы проекта..."
warning "Пожалуйста, загрузите файлы проекта в /var/www/pyramid-tota/"
warning "Вы можете использовать SCP, FTP или любой другой способ"
read -p "Нажмите Enter после загрузки файлов..."

# Проверяем наличие основных файлов
if [ ! -f "server.js" ]; then
    error "Файл server.js не найден. Убедитесь, что файлы проекта загружены в /var/www/pyramid-tota/"
fi

# Шаг 7: Установка зависимостей
log "📦 Устанавливаем зависимости Node.js..."
npm install
success "Зависимости установлены"

# Шаг 8: Создание файла .env
log "⚙️  Создаем файл переменных окружения..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
JWT_SECRET=pyramid_tota_secret_key_2025_CHANGE_THIS
# Для SQLite базы данных не нужна DATABASE_URL
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN
TELEGRAM_CHAT_ID=YOUR_CHAT_ID
EOF
success "Файл .env создан"

# Шаг 9: Настройка прав доступа
log "🔐 Настраиваем права доступа..."
chown -R www-data:www-data /var/www/pyramid-tota
chmod -R 755 /var/www/pyramid-tota
mkdir -p images/uploads
chmod -R 777 images/uploads
success "Права доступа настроены"

# Шаг 10: Настройка Nginx
log "🌐 Настраиваем Nginx..."
cat > /etc/nginx/sites-available/pyramid-tota << 'EOF'
server {
    listen 80;
    server_name 45.90.219.229;

    access_log /var/log/nginx/pyramid-tota.access.log;
    error_log /var/log/nginx/pyramid-tota.error.log;

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

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        root /var/www/pyramid-tota;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /images/uploads/ {
        alias /var/www/pyramid-tota/images/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
EOF

# Активируем конфигурацию
ln -sf /etc/nginx/sites-available/pyramid-tota /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверяем конфигурацию
nginx -t
systemctl restart nginx
systemctl enable nginx
success "Nginx настроен и запущен"

# Шаг 11: Настройка файрвола
log "🛡️  Настраиваем файрвол..."
ufw --force enable
ufw allow ssh
ufw allow 80
ufw allow 443
success "Файрвол настроен"

# Шаг 12: Создание PM2 конфигурации
log "🔧 Создаем конфигурацию PM2..."
cat > ecosystem.config.js << 'EOF'
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
success "Конфигурация PM2 создана"

# Шаг 13: Запуск приложения
log "🚀 Запускаем приложение..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup
success "Приложение запущено"

# Шаг 14: Финальная проверка
log "🔍 Проверяем статус сервисов..."
echo ""
echo "=== Статус PM2 ==="
pm2 status
echo ""
echo "=== Статус Nginx ==="
systemctl status nginx --no-pager -l
echo ""
echo "=== Статус файрвола ==="
ufw status

# Шаг 15: Информация о завершении
echo ""
success "🎉 Развертывание завершено успешно!"
echo ""
echo "📋 Информация о развертывании:"
echo "   🌐 URL сайта: http://45.90.219.229"
echo "   📁 Директория проекта: /var/www/pyramid-tota"
echo "   🔧 Управление приложением: pm2 status/restart/stop pyramid-tota"
echo "   📊 Логи приложения: pm2 logs pyramid-tota"
echo "   📊 Логи Nginx: tail -f /var/log/nginx/pyramid-tota.access.log"
echo ""
echo "🔧 Полезные команды:"
echo "   pm2 restart pyramid-tota    # Перезапуск приложения"
echo "   pm2 logs pyramid-tota       # Просмотр логов"
echo "   systemctl restart nginx     # Перезапуск Nginx"
echo "   ufw status                 # Статус файрвола"
echo ""
warning "⚠️  Не забудьте:"
echo "   1. Настроить SSL сертификат: certbot --nginx -d 45.90.219.229"
echo "   2. Обновить переменные в файле .env (особенно JWT_SECRET)"
echo "   3. Настроить Telegram бота (если нужно)"
echo ""
success "🚀 Ваш сайт готов к работе!"
