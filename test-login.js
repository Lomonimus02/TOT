// Тестовый скрипт для проверки авторизации
const fetch = require('node-fetch');

async function testLogin() {
    try {
        console.log('🔧 Тестирование авторизации...\n');
        
        const users = [
            { email: 'admin@gmail.com', password: 'admin123', name: 'Администратор' },
            { email: 'gaad@example.com', password: 'gaad123', name: 'GAAD User' },
            { email: 'gad@example.com', password: 'gad123', name: 'GAD User' }
        ];
        
        for (const user of users) {
            console.log(`Тестируем вход для ${user.email}...`);
            
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: user.email,
                    password: user.password
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                console.log(`✅ Успешный вход для ${user.email}`);
                console.log(`   Имя: ${result.user.name}`);
                console.log(`   Роль: ${result.user.role}`);
                console.log(`   Токен: ${result.token.substring(0, 20)}...`);
            } else {
                console.log(`❌ Ошибка входа для ${user.email}: ${result.error}`);
            }
            console.log('');
        }
        
    } catch (error) {
        console.error('❌ Ошибка тестирования:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Убедитесь, что сервер запущен на порту 3000');
            console.log('   Запустите: npm start или node server.js');
        }
    }
}

testLogin();
