import mysql from 'mysql2/promise';

export async function createConnection(config) {
    const connectionConfig = {
        host: config.dbHost || 'localhost',
        user: config.dbUser || 'root',
        password: config.dbPassword || '',
        database: config.dbName || 'typo_budget',
        connectTimeout: 5000
    };
    console.log('🔌 Попытка подключения с параметрами:', {
        host: connectionConfig.host,
        user: connectionConfig.user,
        database: connectionConfig.database,
        // пароль не выводим в целях безопасности
    });
    return await mysql.createConnection(connectionConfig);
}

export async function initializeDatabase(connection) {
    await connection.query(`
        CREATE TABLE IF NOT EXISTS system_state (
            state_key VARCHAR(50) PRIMARY KEY,
            state_value LONGTEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
}