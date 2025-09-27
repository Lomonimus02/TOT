# ⚡ Быстрое развертывание на Render

## 🎯 Краткая инструкция (5 минут)

### 1️⃣ Подготовка базы данных
1. Зайдите на https://neon.tech/ → создайте проект
2. Скопируйте Connection String

### 2️⃣ Создание сервиса на Render
1. Зайдите на https://render.com/ → New + → Web Service
2. Подключите репозиторий: `Lomonimus02/TOT`, ветка `01`
3. Настройки:
   - **Name**: `pyramid-tota-website`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3️⃣ Переменные окружения
Добавьте в Environment Variables:
```
NODE_ENV=production
PORT=10000
JWT_SECRET=pyramid_tota_secret_key_2025_CHANGE_THIS
DATABASE_URL=your_neon_connection_string_here
```

### 4️⃣ Запуск
Нажмите **"Create Web Service"** и ждите 3-5 минут.

## ✅ Готово!
Ваш сайт будет доступен по URL, который покажет Render.

---
📖 **Подробная инструкция**: см. файл `RENDER_DEPLOYMENT_GUIDE.md`