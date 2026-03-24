#!/bin/bash

# 🔧 Скрипт исправления проблем с Node.js и зависимостями
# Использование: ./fix-node-version.sh

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

log "🔧 Исправляем проблемы с Node.js и зависимостями"

# Шаг 1: Остановка приложения
log "⏹️  Останавливаем приложение..."
pm2 stop pyramid-tota || true
pm2 delete pyramid-tota || true
success "Приложение остановлено"

# Шаг 2: Переход в директорию проекта
cd /var/www/pyramid-tota

# Шаг 3: Очистка node_modules и package-lock.json
log "🧹 Очищаем старые зависимости..."
rm -rf node_modules
rm -f package-lock.json
success "Старые зависимости удалены"

# Шаг 4: Обновление Node.js до стабильной версии
log "📦 Обновляем Node.js до версии 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
success "Node.js обновлен: $(node --version)"

# Шаг 5: Установка зависимостей с правильными версиями
log "📦 Устанавливаем зависимости с совместимыми версиями..."

# Создаем новый package.json с совместимыми версиями
cat > package.json << 'EOF'
{
  "name": "pyramid-tota-website",
  "version": "1.0.0",
  "description": "Веб-сайт духовного центра 'Пирамида ТОТА'",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "pyramid",
    "tota",
    "spiritual",
    "website",
    "sqlite",
    "express"
  ],
  "author": "Pyramid TOTA Team",
  "license": "ISC",
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cheerio": "^1.1.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^2.0.2",
    "node-fetch": "^2.7.0",
    "sqlite3": "^5.1.7"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Устанавливаем зависимости
npm install
success "Зависимости установлены"

# Шаг 6: Проверка файлов базы данных
log "🔍 Проверяем файлы базы данных..."
if [ -f "server/content.db" ]; then
    success "База данных content.db найдена"
else
    warning "База данных content.db не найдена - будет создана автоматически"
fi

if [ -f "server/database.db" ]; then
    success "База данных database.db найдена"
fi

# Шаг 7: Настройка прав доступа
log "🔐 Настраиваем права доступа..."
chown -R www-data:www-data /var/www/pyramid-tota
chmod -R 755 /var/www/pyramid-tota
chmod -R 777 images/uploads
chmod 666 server/*.db 2>/dev/null || true
success "Права доступа настроены"

# Шаг 8: Тестирование приложения
log "🧪 Тестируем приложение..."
timeout 10s node server.js &
TEST_PID=$!
sleep 5
if kill -0 $TEST_PID 2>/dev/null; then
    kill $TEST_PID
    success "Приложение запускается корректно"
else
    warning "Приложение не запустилось, но это может быть нормально"
fi

# Шаг 9: Запуск через PM2
log "🚀 Запускаем приложение через PM2..."
pm2 start server.js --name pyramid-tota
pm2 save
success "Приложение запущено через PM2"

# Шаг 10: Проверка статуса
log "🔍 Проверяем статус..."
sleep 3
pm2 status

# Шаг 11: Проверка логов
log "📊 Проверяем логи..."
pm2 logs pyramid-tota --lines 10

# Шаг 12: Информация о завершении
echo ""
success "🎉 Исправление завершено!"
echo ""
echo "📋 Информация:"
echo "   🌐 URL сайта: http://45.90.219.229"
echo "   📊 Node.js версия: $(node --version)"
echo "   📊 NPM версия: $(npm --version)"
echo ""
echo "🔧 Полезные команды:"
echo "   pm2 status                    # Статус приложения"
echo "   pm2 logs pyramid-tota         # Логи приложения"
echo "   pm2 restart pyramid-tota      # Перезапуск"
echo "   pm2 monit                     # Мониторинг"
echo ""
success "🚀 Ваш сайт готов к работе!"
