@echo off
echo ========================================
echo   API Сервер для Inline Редактора
echo   Пирамида ТОТА - Веб-сайт
echo ========================================
echo.

REM Проверяем наличие Node.js
echo Проверяем Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ОШИБКА: Node.js не установлен!
    echo.
    echo Пожалуйста, установите Node.js с https://nodejs.org/
    echo Рекомендуемая версия: LTS (Long Term Support)
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Node.js найден
)

REM Проверяем, не запущен ли уже сервер
echo Проверяем порт 3001...
netstat -an | findstr :3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Порт 3001 уже используется!
    echo Возможно, сервер уже запущен.
    echo.
    choice /C YN /M "Продолжить запуск? (Y/N)"
    if errorlevel 2 exit /b 0
)

REM Переходим в папку сервера
echo Переходим в папку сервера...
cd /d "%~dp0server"

REM Проверяем наличие node_modules
if not exist "node_modules" (
    echo 📦 Устанавливаем зависимости...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ ОШИБКА: Не удалось установить зависимости!
        echo.
        pause
        exit /b 1
    )
    echo ✅ Зависимости установлены
) else (
    echo ✅ Зависимости уже установлены
)

echo.
echo ========================================
echo 🚀 Запускаем API сервер...
echo.
echo 📍 API будет доступен по адресу: http://localhost:3001
echo 🌐 Проверка состояния: http://localhost:3001/api/health
echo.
echo ⚠️  Для остановки нажмите Ctrl+C
echo ========================================
echo.

npm start

echo.
echo Сервер остановлен.
pause
