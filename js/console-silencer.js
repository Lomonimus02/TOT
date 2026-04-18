/**
 * Console Silencer
 * Глушит console.log / console.info / console.debug в production-режиме.
 * Чтобы вернуть логи — добавьте в URL ?debug=1 или установите localStorage.debug = '1'.
 * console.warn и console.error остаются без изменений.
 */
(function () {
    try {
        var params = new URLSearchParams(window.location.search);
        var debugQuery = params.get('debug');
        if (debugQuery === '1') {
            try { localStorage.setItem('debug', '1'); } catch (_) {}
        } else if (debugQuery === '0') {
            try { localStorage.removeItem('debug'); } catch (_) {}
        }
        var debugEnabled = false;
        try { debugEnabled = localStorage.getItem('debug') === '1'; } catch (_) {}
        if (debugQuery === '1') debugEnabled = true;

        if (!debugEnabled) {
            var noop = function () {};
            console.log = noop;
            console.info = noop;
            console.debug = noop;
            console.trace = noop;
            console.group = noop;
            console.groupCollapsed = noop;
            console.groupEnd = noop;
        }
    } catch (e) {
        // молча игнорируем
    }
})();
