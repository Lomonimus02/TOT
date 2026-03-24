#!/bin/bash

# ⚡ Быстрое исправление проблемы с undici
# Использование: ./quick-fix.sh

echo "🔧 Быстрое исправление проблемы с Node.js..."

# Остановка приложения
pm2 stop pyramid-tota
pm2 delete pyramid-tota

# Переход в директорию
cd /var/www/pyramid-tota

# Очистка зависимостей
rm -rf node_modules package-lock.json

# Установка совместимых версий
npm install express@4.18.2 cors@2.8.5 dotenv@16.3.1 sqlite3@5.1.7 bcrypt@5.1.1 cheerio@1.1.2 jsonwebtoken@9.0.2 multer@2.0.2 node-fetch@2.7.0

# Настройка прав
chmod 666 server/*.db 2>/dev/null || true
chown www-data:www-data server/*.db 2>/dev/null || true

# Запуск приложения
pm2 start server.js --name pyramid-tota
pm2 save

echo "✅ Исправление завершено!"
echo "🌐 Сайт: http://45.90.219.229"
echo "📊 Статус: pm2 status"
echo "📊 Логи: pm2 logs pyramid-tota"
