#!/bin/bash

# 📊 Скрипт переноса локальной базы данных на сервер
# Использование: ./transfer-database.sh

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

# Параметры сервера
SERVER_IP="45.90.219.229"
SERVER_USER="root"
SERVER_PATH="/var/www/pyramid-tota"

log "📊 Начинаем перенос локальной базы данных на сервер"

# Шаг 1: Проверка локальных файлов базы данных
log "🔍 Проверяем локальные файлы базы данных..."
if [ ! -f "server/content.db" ]; then
    error "Файл server/content.db не найден!"
fi

if [ -f "server/database.db" ]; then
    success "Найдены файлы: server/content.db и server/database.db"
else
    success "Найден файл: server/content.db"
fi

# Шаг 2: Создание архива с базой данных
log "📦 Создаем архив с базой данных..."
ARCHIVE_NAME="pyramid-tota-with-db-$(date +%Y%m%d-%H%M%S).tar.gz"

# Создаем архив, исключая node_modules и .git, но включая базы данных
tar --exclude='node_modules' --exclude='.git' --exclude='*.log' -czf "$ARCHIVE_NAME" .

# Проверяем размер архива
ARCHIVE_SIZE=$(du -h "$ARCHIVE_NAME" | cut -f1)
success "Архив создан: $ARCHIVE_NAME (размер: $ARCHIVE_SIZE)"

# Шаг 3: Загрузка архива на сервер
log "📤 Загружаем архив на сервер..."
scp "$ARCHIVE_NAME" "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"

if [ $? -eq 0 ]; then
    success "Архив загружен на сервер"
else
    error "Ошибка загрузки архива на сервер"
fi

# Шаг 4: Распаковка на сервере
log "📦 Распаковываем архив на сервере..."
ssh "$SERVER_USER@$SERVER_IP" "cd $SERVER_PATH && tar -xzf $ARCHIVE_NAME && rm $ARCHIVE_NAME"

if [ $? -eq 0 ]; then
    success "Архив распакован на сервере"
else
    error "Ошибка распаковки архива на сервере"
fi

# Шаг 5: Проверка базы данных на сервере
log "🔍 Проверяем базу данных на сервере..."
ssh "$SERVER_USER@$SERVER_IP" "ls -la $SERVER_PATH/server/"

# Шаг 6: Настройка прав доступа на базу данных
log "🔐 Настраиваем права доступа на базу данных..."
ssh "$SERVER_USER@$SERVER_IP" "chmod 666 $SERVER_PATH/server/content.db 2>/dev/null || true"
ssh "$SERVER_USER@$SERVER_IP" "chmod 666 $SERVER_PATH/server/database.db 2>/dev/null || true"
ssh "$SERVER_USER@$SERVER_IP" "chown www-data:www-data $SERVER_PATH/server/*.db 2>/dev/null || true"

success "Права доступа настроены"

# Шаг 7: Перезапуск приложения
log "🔄 Перезапускаем приложение..."
ssh "$SERVER_USER@$SERVER_IP" "cd $SERVER_PATH && pm2 restart pyramid-tota"

if [ $? -eq 0 ]; then
    success "Приложение перезапущено"
else
    warning "Не удалось перезапустить приложение (возможно, оно еще не запущено)"
fi

# Шаг 8: Очистка локального архива
log "🧹 Очищаем локальный архив..."
rm "$ARCHIVE_NAME"
success "Локальный архив удален"

# Шаг 9: Информация о завершении
echo ""
success "🎉 Перенос базы данных завершен успешно!"
echo ""
echo "📋 Информация:"
echo "   🌐 URL сайта: http://$SERVER_IP"
echo "   📊 База данных: SQLite (server/content.db)"
echo "   📁 Директория: $SERVER_PATH"
echo ""
echo "🔧 Полезные команды:"
echo "   ssh $SERVER_USER@$SERVER_IP 'pm2 logs pyramid-tota'  # Просмотр логов"
echo "   ssh $SERVER_USER@$SERVER_IP 'pm2 status'            # Статус приложения"
echo "   ssh $SERVER_USER@$SERVER_IP 'pm2 restart pyramid-tota'  # Перезапуск"
echo ""
echo "📊 Проверка базы данных:"
echo "   ssh $SERVER_USER@$SERVER_IP 'ls -la $SERVER_PATH/server/'"
echo ""
success "🚀 Ваш сайт с перенесенной базой данных готов к работе!"
