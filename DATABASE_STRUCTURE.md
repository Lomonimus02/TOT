# Структура баз данных проекта "Пирамида ТОТА"

## 📊 Обзор

Проект использует **PostgreSQL (Neon Cloud)** как основную базу данных для продакшена.

### Основной сервер: `server.js` (порт 3000)
- **БД:** PostgreSQL (Neon Cloud)
- **Подключение:** через пул соединений с настройками keep-alive
- **Используется для:** продакшен, все API endpoints

### Альтернативный сервер: `server/api.js` (порт 3001)
- **БД:** SQLite (`server/content.db`)
- **Статус:** НЕ используется в продакшене, только для разработки/тестирования

---

## 🗄️ Таблицы PostgreSQL

### 1. **users** - Пользователи системы
- `id` - уникальный идентификатор (SERIAL PRIMARY KEY)
- `name` - имя пользователя (VARCHAR 100)
- `email` - email (VARCHAR 100, UNIQUE)
- `password` - хешированный пароль (VARCHAR 255)
- `role` - роль (VARCHAR 20, по умолчанию 'user')
- `created_at` - дата создания
- `updated_at` - дата обновления

### 2. **contact_forms** - Контактные формы
- `id` - уникальный идентификатор
- `name` - имя отправителя
- `email` - email отправителя
- `phone` - телефон
- `message` - сообщение
- `status` - статус (по умолчанию 'new')
- `created_at` - дата создания

### 3. **newsletter_subscriptions** - Подписки на рассылку
- `id` - уникальный идентификатор
- `email` - email подписчика (UNIQUE)
- `status` - статус (по умолчанию 'active')
- `created_at` - дата создания

### 4. **program_bookings** - Записи на программы
- `id` - уникальный идентификатор
- `name` - имя
- `email` - email
- `phone` - телефон
- `program` - название программы
- `date` - дата программы
- `message` - дополнительное сообщение
- `status` - статус (по умолчанию 'pending')
- `created_at` - дата создания

### 5. **content_pages** - Страницы контента (для админ-панели)
- `id` - уникальный идентификатор
- `page_name` - название страницы (UNIQUE)
- `title` - заголовок
- `content` - контент
- `meta_description` - мета-описание
- `updated_by` - ID пользователя, обновившего страницу
- `updated_at` - дата обновления

### 6. **content_changes** - Изменения элементов (старая система блоков)
- `id` - уникальный идентификатор
- `page_id` - ID страницы
- `element_id` - ID элемента
- `element_type` - тип элемента
- `content` - контент
- `selector` - CSS селектор
- `updated_at` - дата обновления
- **UNIQUE:** (page_id, element_id)

### 7. **element_formatting** - Форматирование элементов
- `id` - уникальный идентификатор
- `page_id` - ID страницы
- `element_id` - ID элемента
- `css_classes` - CSS классы (массив TEXT[])
- `font_size` - размер шрифта
- `text_color` - цвет текста
- `text_align` - выравнивание текста
- `font_weight` - жирность шрифта
- `font_style` - стиль шрифта
- `created_at` - дата создания
- `updated_at` - дата обновления
- **UNIQUE:** (page_id, element_id)

### 8. **deleted_elements** - Удаленные элементы
- `id` - уникальный идентификатор
- `page_id` - ID страницы
- `element_id` - ID элемента
- `deleted_at` - дата удаления
- **UNIQUE:** (page_id, element_id)

### 9. **page_content** - Контент страниц и блоки (Rich Text Editor + Папирус блоки)
- `id` - уникальный идентификатор
- `page_id` - ID страницы
- `element_id` - ID элемента
- `element_type` - тип элемента
- `content` - HTML контент
- `selector` - CSS селектор
- `block_type` - тип блока (для папирус блоков)
- `block_category` - категория блока
- `block_metadata` - метаданные блока (JSONB)
- `parent_block_id` - ID родительского блока
- `css_styles` - CSS стили
- `css_classes` - CSS классы
- `container_selector` - селектор контейнера (по умолчанию '.page-content')
- `before_element_id` - ID элемента, перед которым размещен блок
- `after_element_id` - ID элемента, после которого размещен блок
- `position_index` - индекс позиции (по умолчанию 0)
- `created_at` - дата создания
- `updated_at` - дата обновления
- **UNIQUE:** (page_id, element_id)

---

## 🔧 Исправления (2025-11-15)

### Проблема
При переходе на страницу из результатов поиска контент не отображался из-за ошибки:
```
Error: Connection terminated unexpectedly
```

### Причина
Neon PostgreSQL закрывает неактивные соединения, и при запросе к закрытому соединению возникала ошибка.

### Решение
1. **Добавлены настройки пула соединений:**
   - `max: 20` - максимум 20 соединений
   - `idleTimeoutMillis: 30000` - закрывать неактивные через 30 сек
   - `connectionTimeoutMillis: 10000` - таймаут подключения 10 сек
   - `keepAlive: true` - поддерживать соединение активным
   - `keepAliveInitialDelayMillis: 10000` - задержка для keep-alive

2. **Добавлены обработчики событий пула:**
   - `pool.on('error')` - обработка ошибок
   - `pool.on('connect')` - логирование подключений
   - `pool.on('remove')` - логирование удаления соединений

3. **Добавлена retry логика для API endpoints:**
   - `/api/content/:pageId` - до 3 попыток с экспоненциальной задержкой
   - `/api/content/:pageId/:elementId` - до 3 попыток с экспоненциальной задержкой
   - Автоматическое переподключение при ошибках соединения

---

## 📝 Примечания

- **Rich Text Editor** использует endpoint `/api/content/:pageId/:elementId` для загрузки контента
- **Старая система блоков** использует endpoint `/api/content/:pageId` для загрузки изменений
- **Поиск** работает с обеими таблицами: `content_changes` и `page_content`
- **SQLite база** (`server/content.db`) не используется в продакшене

