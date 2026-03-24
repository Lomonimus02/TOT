#!/bin/bash

# 💾 Скрипт резервного копирования сайта "Пирамида ТОТА"
# Использование: ./backup.sh

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

# Создаем директорию для резервных копий
BACKUP_BASE="/var/backups/pyramid-tota"
mkdir -p "$BACKUP_BASE"

# Генерируем имя файла с датой
BACKUP_NAME="pyramid-tota-backup-$(date +%Y%m%d-%H%M%S)"
BACKUP_PATH="$BACKUP_BASE/$BACKUP_NAME"

log "💾 Создаем резервную копию сайта 'Пирамида ТОТА'"

# Шаг 1: Создание резервной копии файлов
log "📁 Копируем файлы проекта..."
cp -r /var/www/pyramid-tota "$BACKUP_PATH"
success "Файлы скопированы"

# Шаг 2: Создание архива
log "📦 Создаем архив..."
cd "$BACKUP_BASE"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"
success "Архив создан: ${BACKUP_NAME}.tar.gz"

# Шаг 3: Создание резервной копии конфигурации Nginx
log "🌐 Копируем конфигурацию Nginx..."
cp /etc/nginx/sites-available/pyramid-tota "$BACKUP_BASE/nginx-config-$(date +%Y%m%d-%H%M%S).conf"
success "Конфигурация Nginx скопирована"

# Шаг 4: Создание резервной копии PM2 конфигурации
log "🔧 Копируем конфигурацию PM2..."
cp /var/www/pyramid-tota/ecosystem.config.js "$BACKUP_BASE/pm2-config-$(date +%Y%m%d-%H%M%S).js"
success "Конфигурация PM2 скопирована"

# Шаг 5: Создание резервной копии переменных окружения
log "⚙️  Копируем переменные окружения..."
cp /var/www/pyramid-tota/.env "$BACKUP_BASE/env-$(date +%Y%m%d-%H%M%S).env"
success "Переменные окружения скопированы"

# Шаг 6: Очистка старых резервных копий (старше 30 дней)
log "🧹 Очищаем старые резервные копии..."
find "$BACKUP_BASE" -name "*.tar.gz" -mtime +30 -delete
find "$BACKUP_BASE" -name "*.conf" -mtime +30 -delete
find "$BACKUP_BASE" -name "*.js" -mtime +30 -delete
find "$BACKUP_BASE" -name "*.env" -mtime +30 -delete
success "Старые копии удалены"

# Шаг 7: Информация о резервной копии
echo ""
success "🎉 Резервная копия создана успешно!"
echo ""
echo "📋 Информация о резервной копии:"
echo "   📁 Директория: $BACKUP_BASE"
echo "   📦 Архив: ${BACKUP_NAME}.tar.gz"
echo "   📊 Размер архива: $(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)"
echo ""
echo "🔧 Команды для восстановления:"
echo "   cd $BACKUP_BASE"
echo "   tar -xzf ${BACKUP_NAME}.tar.gz"
echo "   cp -r $BACKUP_NAME/* /var/www/pyramid-tota/"
echo "   pm2 restart pyramid-tota"
echo ""
echo "📊 Список всех резервных копий:"
ls -la "$BACKUP_BASE" | grep -E "\.(tar\.gz|conf|js|env)$"
echo ""
success "💾 Резервное копирование завершено!"
