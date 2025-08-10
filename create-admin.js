// Скрипт для создания первого администратора
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const readline = require('readline');

// Настройка подключения к базе данных
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_mE67QfaoVbGj@ep-rough-term-a92qmgeu-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: {
        rejectUnauthorized: false
    }
});

// Интерфейс для ввода данных
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function createAdmin() {
    try {
        console.log('🔧 Создание администратора для сайта "Пирамида ТОТА"\n');

        // Предустановленные данные администратора
        const adminData = {
            name: 'Администратор',
            email: 'admin@gmail.com',
            password: 'admin123'
        };

        // Проверка существования пользователя с таким email
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [adminData.email]);
        if (existingUser.rows.length > 0) {
            console.log('⚠️  Администратор с email admin@gmail.com уже существует');
            console.log('Обновляем существующего пользователя до роли администратора...');

            // Обновляем роль существующего пользователя
            const updateResult = await pool.query(
                'UPDATE users SET role = $1 WHERE email = $2 RETURNING id, name, email, role',
                ['admin', adminData.email]
            );

            const admin = updateResult.rows[0];
            console.log('\n✅ Пользователь обновлен до администратора!');
            console.log('📋 Данные администратора:');
            console.log(`   ID: ${admin.id}`);
            console.log(`   Имя: ${admin.name}`);
            console.log(`   Email: ${admin.email}`);
            console.log(`   Роль: ${admin.role}`);
            return;
        }

        // Хеширование пароля
        console.log('\n🔐 Создание администратора...');
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);

        // Создание администратора
        const result = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [adminData.name, adminData.email, hashedPassword, 'admin']
        );

        const admin = result.rows[0];

        console.log('\n✅ Администратор успешно создан!');
        console.log('📋 Данные администратора:');
        console.log(`   ID: ${admin.id}`);
        console.log(`   Имя: ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Роль: ${admin.role}`);

        console.log('\n🌐 Теперь вы можете войти в админ-панель:');
        console.log('   URL: http://localhost:3000/admin.html');
        console.log(`   Email: ${admin.email}`);
        console.log('   Пароль: admin123');

        console.log('\n🚀 Для запуска сервера используйте: npm start');
        
    } catch (error) {
        console.error('❌ Ошибка создания администратора:', error.message);
        process.exit(1);
    } finally {
        rl.close();
        await pool.end();
    }
}

// Запуск скрипта
createAdmin();
