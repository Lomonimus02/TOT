# Исправление контекстного меню блоков

## Проблема
При нажатии правой кнопкой мыши на добавленные блоки контекстное меню не появлялось. Меню работало только для блоков из раздела фото, но не для всех типов блоков.

## Причина
В новой системе блоков (`js/new-blocks-system.js`) не добавлялся обработчик события `contextmenu` к блокам. Функция `addDragHandlesToBlocks()` создавала drag handles и другие обработчики, но пропускала контекстное меню.

## Решение

### 1. Экспорт функции контекстного меню
В файле `js/blocks-system.js` добавлен экспорт функции `handleBlockContextMenu`:

```javascript
// Экспорт в глобальную область
window.BlocksSystem = {
    init: initializeBlocksSystem,
    toggle: toggleBlocksPanel,
    open: openBlocksPanel,
    close: closeBlocksPanel,
    handleBlockContextMenu: handleBlockContextMenu  // ← Добавлено
};
```

### 2. Добавление обработчика в новую систему
В файле `js/new-blocks-system.js` в функции `addDragHandlesToBlocks()` добавлен код для привязки обработчика контекстного меню:

```javascript
// Добавляем обработчик контекстного меню для блока
// Проверяем, что функция handleBlockContextMenu доступна из старой системы
if (typeof handleBlockContextMenu === 'function') {
    block.addEventListener('contextmenu', handleBlockContextMenu);
} else if (typeof window.BlocksSystem !== 'undefined' && typeof window.BlocksSystem.handleBlockContextMenu === 'function') {
    block.addEventListener('contextmenu', window.BlocksSystem.handleBlockContextMenu);
}
```

### 3. Подключение main.js
В файле `pages/temple.html` добавлено подключение `main.js` для корректной инициализации всех систем.

## Результат
Теперь при нажатии правой кнопкой мыши на любой добавленный блок появляется контекстное меню с действиями:
- ✏️ Редактировать
- 🎨 Настроить стиль  
- ⬆️ Переместить вверх
- ⬇️ Переместить вниз
- 📋 Дублировать
- 🗑️ Удалить

## Тестирование
Создан тестовый файл `test-context-menu.html` для проверки функциональности.

## Файлы изменены
1. `js/new-blocks-system.js` - добавлен обработчик контекстного меню
2. `js/blocks-system.js` - экспорт функции handleBlockContextMenu
3. `pages/temple.html` - подключение main.js
4. `test-context-menu.html` - тестовая страница (новый файл)
