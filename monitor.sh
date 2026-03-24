#!/bin/bash

# 📊 Скрипт мониторинга сайта "Пирамида ТОТА"
# Использование: ./monitor.sh

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
}

# Функция проверки статуса
check_status() {
    local service=$1
    local status=$2
    
    if [ "$status" = "active" ] || [ "$status" = "online" ]; then
        success "$service: Работает"
    else
        error "$service: Не работает"
    fi
}

# Функция проверки порта
check_port() {
    local port=$1
    local service=$2
    
    if netstat -tlnp | grep -q ":$port "; then
        success "$service (порт $port): Открыт"
    else
        error "$service (порт $port): Закрыт"
    fi
}

# Функция проверки дискового пространства
check_disk_space() {
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$usage" -lt 80 ]; then
        success "Дисковое пространство: ${usage}% (норма)"
    elif [ "$usage" -lt 90 ]; then
        warning "Дисковое пространство: ${usage}% (внимание)"
    else
        error "Дисковое пространство: ${usage}% (критично)"
    fi
}

# Функция проверки памяти
check_memory() {
    local total=$(free -m | awk 'NR==2{print $2}')
    local used=$(free -m | awk 'NR==2{print $3}')
    local usage=$((used * 100 / total))
    
    if [ "$usage" -lt 80 ]; then
        success "Память: ${usage}% (норма)"
    elif [ "$usage" -lt 90 ]; then
        warning "Память: ${usage}% (внимание)"
    else
        error "Память: ${usage}% (критично)"
    fi
}

# Функция проверки загрузки CPU
check_cpu() {
    local load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cores=$(nproc)
    local threshold=$(echo "$cores * 0.8" | bc)
    
    if (( $(echo "$load < $threshold" | bc -l) )); then
        success "Загрузка CPU: $load (норма)"
    else
        warning "Загрузка CPU: $load (высокая)"
    fi
}

# Функция проверки доступности сайта
check_website() {
    local url="http://45.90.219.229"
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$response" = "200" ]; then
        success "Сайт доступен: HTTP $response"
    else
        error "Сайт недоступен: HTTP $response"
    fi
}

# Функция проверки SSL сертификата
check_ssl() {
    local domain="45.90.219.229"
    local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain":443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [ -n "$cert_info" ]; then
        local expiry=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
        local expiry_date=$(date -d "$expiry" +%s)
        local current_date=$(date +%s)
        local days_left=$(( (expiry_date - current_date) / 86400 ))
        
        if [ "$days_left" -gt 30 ]; then
            success "SSL сертификат: Действителен ($days_left дней)"
        elif [ "$days_left" -gt 7 ]; then
            warning "SSL сертификат: Истекает через $days_left дней"
        else
            error "SSL сертификат: Истекает через $days_left дней"
        fi
    else
        warning "SSL сертификат: Не настроен"
    fi
}

# Основная функция мониторинга
main() {
    echo "📊 Мониторинг сайта 'Пирамида ТОТА' - $(date)"
    echo "=================================================="
    echo ""
    
    # Проверка системных сервисов
    log "🔍 Проверяем системные сервисы..."
    nginx_status=$(systemctl is-active nginx)
    check_status "Nginx" "$nginx_status"
    
    echo ""
    
    # Проверка портов
    log "🔍 Проверяем порты..."
    check_port 80 "HTTP"
    check_port 443 "HTTPS"
    check_port 3000 "Node.js приложение"
    
    echo ""
    
    # Проверка PM2
    log "🔍 Проверяем PM2..."
    pm2_status=$(pm2 jlist | jq -r '.[0].pm2_env.status' 2>/dev/null || echo "unknown")
    if [ "$pm2_status" = "online" ]; then
        success "PM2: Приложение работает"
        echo "   📊 Использование памяти: $(pm2 jlist | jq -r '.[0].monit.memory / 1024 / 1024' 2>/dev/null || echo "N/A") MB"
        echo "   📊 Использование CPU: $(pm2 jlist | jq -r '.[0].monit.cpu' 2>/dev/null || echo "N/A")%"
    else
        error "PM2: Приложение не работает"
    fi
    
    echo ""
    
    # Проверка ресурсов системы
    log "🔍 Проверяем ресурсы системы..."
    check_disk_space
    check_memory
    check_cpu
    
    echo ""
    
    # Проверка доступности сайта
    log "🔍 Проверяем доступность сайта..."
    check_website
    check_ssl
    
    echo ""
    
    # Проверка логов на ошибки
    log "🔍 Проверяем логи на ошибки..."
    error_count=$(pm2 logs pyramid-tota --lines 100 2>/dev/null | grep -i error | wc -l)
    if [ "$error_count" -eq 0 ]; then
        success "Логи: Ошибок не найдено"
    else
        warning "Логи: Найдено $error_count ошибок"
    fi
    
    echo ""
    
    # Статистика Nginx
    log "🔍 Статистика Nginx..."
    if [ -f "/var/log/nginx/pyramid-tota.access.log" ]; then
        local requests=$(tail -n 1000 /var/log/nginx/pyramid-tota.access.log | wc -l)
        local errors=$(tail -n 1000 /var/log/nginx/pyramid-tota.access.log | grep -c " [45][0-9][0-9] " || echo "0")
        success "Nginx: $requests запросов, $errors ошибок (последние 1000 записей)"
    else
        warning "Nginx: Лог файл не найден"
    fi
    
    echo ""
    
    # Рекомендации
    log "💡 Рекомендации:"
    echo "   🔧 Для перезапуска приложения: pm2 restart pyramid-tota"
    echo "   📊 Для просмотра логов: pm2 logs pyramid-tota"
    echo "   🌐 Для перезапуска Nginx: systemctl restart nginx"
    echo "   💾 Для создания резервной копии: ./backup.sh"
    echo "   🔄 Для обновления сайта: ./update.sh"
    
    echo ""
    success "🎉 Мониторинг завершен!"
}

# Запуск мониторинга
main
