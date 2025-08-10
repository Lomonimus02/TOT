# API Сервер для Inline Редактора

Этот сервер обеспечивает автоматическое сохранение изменений inline редактора в базу данных SQLite.

## Установка и запуск

### Автоматический запуск (Windows)
1. Запустите файл `start-server.bat` в корневой папке проекта
2. Сервер автоматически установит зависимости и запустится

### Ручная установка
1. Перейдите в папку `server`:
   ```bash
   cd server
   ```

2. Установите зависимости:
   ```bash
   npm install
   ```

3. Запустите сервер:
   ```bash
   npm start
   ```

Сервер будет доступен по адресу: `http://localhost:3001`

## API Endpoints

### Сохранение контента
```
POST /api/content/save
Authorization: Bearer admin_token_123
Content-Type: application/json

{
  "page_id": "pyramid",
  "element_id": "edit_123456789",
  "element_type": "text",
  "content": "<p>Новый контент</p>",
  "selector": "p.content-text"
}
```

### Получение контента страницы
```
GET /api/content/{pageId}

Ответ:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "page_id": "pyramid",
      "element_id": "edit_123456789",
      "element_type": "text",
      "content": "<p>Контент элемента</p>",
      "selector": "p.content-text",
      "created_at": "2025-01-08T21:30:00Z",
      "updated_at": "2025-01-08T21:30:00Z"
    }
  ]
}
```

### Batch сохранение
```
POST /api/content/batch-save
Authorization: Bearer admin_token_123
Content-Type: application/json

{
  "changes": [
    {
      "page_id": "pyramid",
      "element_id": "edit_123456789",
      "element_type": "text",
      "content": "<p>Контент 1</p>",
      "selector": "p.content-text"
    },
    {
      "page_id": "pyramid", 
      "element_id": "edit_987654321",
      "element_type": "heading",
      "content": "<h2>Заголовок</h2>",
      "selector": "h2.section-title"
    }
  ]
}
```

### Удаление элемента
```
DELETE /api/content/{pageId}/{elementId}
Authorization: Bearer admin_token_123
```

### История изменений
```
GET /api/content/{pageId}/history?element_id={elementId}&limit=50
Authorization: Bearer admin_token_123
```

### Настройки страницы
```
POST /api/page-settings/{pageId}
GET /api/page-settings/{pageId}
Authorization: Bearer admin_token_123
```

### Проверка состояния
```
GET /api/health

Ответ:
{
  "status": "ok",
  "timestamp": "2025-01-08T21:30:00Z",
  "version": "1.0.0"
}
```

## База данных

Сервер использует SQLite базу данных `content.db` со следующими таблицами:

### page_content
- `id` - уникальный идентификатор
- `page_id` - идентификатор страницы
- `element_id` - идентификатор элемента
- `element_type` - тип элемента (text, heading, list, etc.)
- `content` - HTML контент
- `selector` - CSS селектор
- `position_index` - порядок элемента на странице
- `created_at` - дата создания
- `updated_at` - дата обновления

### content_versions
- `id` - уникальный идентификатор
- `page_id` - идентификатор страницы
- `element_id` - идентификатор элемента
- `content` - HTML контент версии
- `user_id` - идентификатор пользователя
- `created_at` - дата создания версии

### page_settings
- `id` - уникальный идентификатор
- `page_id` - идентификатор страницы
- `title` - заголовок страницы
- `subtitle` - подзаголовок
- `meta_description` - мета описание
- `meta_keywords` - мета ключевые слова
- `updated_at` - дата обновления

## Авторизация

Для демонстрации используется простой токен `admin_token_123`. 
В реальном проекте необходимо реализовать полноценную систему авторизации с JWT токенами.

## Автосохранение

Клиентская часть автоматически сохраняет изменения в БД с задержкой 1 секунда после последнего изменения элемента.

## Fallback режим

Если API сервер недоступен, редактор автоматически переключается на сохранение в localStorage.

## Разработка

Для разработки используйте:
```bash
npm run dev
```

Это запустит сервер с автоматической перезагрузкой при изменении файлов.
