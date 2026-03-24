#!/bin/bash

# 🔄 Скрипт обновления сайта "Пирамида ТОТА"
# Использование: ./update.sh

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
    error "Запустите скрипт с правами root: sudo ./update.sh"
fi

log "🔄 Начинаем обновление сайта 'Пирамида ТОТА'"

# Переходим в директорию проекта
cd /var/www/pyramid-tota

# Шаг 1: Создание резервной копии
log "💾 Создаем резервную копию..."
BACKUP_DIR="/var/backups/pyramid-tota-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r /var/www/pyramid-tota "$BACKUP_DIR/"
success "Резервная копия создана: $BACKUP_DIR"

# Шаг 2: Остановка приложения
log "⏹️  Останавливаем приложение..."
pm2 stop pyramid-tota || true
success "Приложение остановлено"

# Шаг 3: Обновление файлов
log "📥 Обновляем файлы проекта..."
warning "Пожалуйста, загрузите новые файлы проекта в /var/www/pyramid-tota/"
warning "Или используйте git pull, если проект в репозитории"
read -p "Нажмите Enter после обновления файлов..."

# Шаг 4: Установка новых зависимостей
log "📦 Обновляем зависимости..."
npm install
success "Зависимости обновлены"

# Шаг 5: Настройка прав доступа
log "🔐 Настраиваем права доступа..."
chown -R www-data:www-data /var/www/pyramid-tota
chmod -R 755 /var/www/pyramid-tota
chmod -R 777 images/uploads
success "Права доступа настроены"

# Шаг 6: Запуск приложения
log "🚀 Запускаем приложение..."
pm2 start pyramid-tota
success "Приложение запущено"

# Шаг 7: Проверка статуса
log "🔍 Проверяем статус..."
echo ""
echo "=== Статус PM2 ==="
pm2 status
echo ""
echo "=== Последние логи ==="
pm2 logs pyramid-tota --lines 20

# Шаг 8: Информация о завершении
echo ""
success "🎉 Обновление завершено успешно!"
echo ""
echo "📋 Информация:"
echo "   🌐 URL сайта: http://45.90.219.229"
echo "   💾 Резервная копия: $BACKUP_DIR"
echo "   📊 Логи: pm2 logs pyramid-tota"
echo ""
success "🚀 Сайт обновлен и готов к работе!"
