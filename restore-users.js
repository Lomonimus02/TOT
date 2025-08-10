// Скрипт для восстановления пользователей
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Настройка подключения к базе данных
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_mE67QfaoVbGj@ep-rough-term-a92qmgeu-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: {
        rejectUnauthorized: false
    }
});

async function restoreUsers() {
    try {
        console.log('🔧 Восстановление пользователей...\n');
        
        // Пользователи для восстановления
        const users = [
            {
                name: 'Администратор',
                email: 'admin@gmail.com',
                password: 'admin123',
                role: 'admin'
            },
            {
                name: 'GAAD User',
                email: 'gaad@example.com',
                password: 'gaad123',
                role: 'user'
            },
            {
                name: 'GAD User', 
                email: 'gad@example.com',
                password: 'gad123',
                role: 'user'
            }
        ];
        
        for (const userData of users) {
            await createOrUpdateUser(userData);
        }
        
        // Показываем итоговый список пользователей
        console.log('\n📋 Итоговый список пользователей:');
        const result = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
        console.table(result.rows);
        
        console.log('\n✅ Восстановление пользователей завершено!');
        
    } catch (error) {
        console.error('❌ Ошибка восстановления пользователей:', error);
    } finally {
        await pool.end();
    }
}

async function createOrUpdateUser(userData) {
    try {
        const { name, email, password, role } = userData;
        
        // Проверяем, существует ли пользователь
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (existingUser.rows.length > 0) {
            console.log(`⚠️  Пользователь ${email} уже существует`);
            
            // Обновляем пароль и роль
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            
            await pool.query(
                'UPDATE users SET name = $1, password = $2, role = $3 WHERE email = $4',
                [name, hashedPassword, role, email]
            );
            
            console.log(`✅ Пользователь ${email} обновлен (роль: ${role})`);
        } else {
            // Создаем нового пользователя
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            
            const result = await pool.query(
                'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
                [name, email, hashedPassword, role]
            );
            
            const user = result.rows[0];
            console.log(`✅ Создан пользователь ${email} (ID: ${user.id}, роль: ${role})`);
        }
        
    } catch (error) {
        console.error(`❌ Ошибка обработки пользователя ${userData.email}:`, error);
    }
}

// Запуск скрипта
restoreUsers();
