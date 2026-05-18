import { Router } from 'express';
import { createConnection, initializeDatabase } from '../db.js';

const router = Router();

router.post('/test', async (req, res) => {
    let connection;
    try {
        console.log('📥 Получена конфигурация для теста:', req.body);
        const config = req.body;
        // Убедимся, что хост не пустой
        if (!config.dbHost || config.dbHost === '') {
            console.warn('⚠️ Хост не указан, будет использовано значение по умолчанию: localhost');
        }
        connection = await createConnection(config);
        await connection.query('SELECT 1');
        console.log('✅ Тест подключения успешен');
        res.json({ success: true, message: 'Соединение успешно установлено!' });
    } catch (error) {
        console.error('❌ Ошибка теста подключения:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

router.post('/export', async (req, res) => {
    const { config, data } = req.body;
    console.log('📤 Экспорт, конфиг:', config);
    if (!config || !data) {
        return res.status(400).json({ success: false, message: 'Отсутствуют конфигурация или данные для экспорта' });
    }

    let connection;
    try {
        connection = await createConnection(config);
        await initializeDatabase(connection);

        const keys = ['calendar', 'monthlyRates', 'accounts', 'expenseTransactions'];
        
        for (const key of keys) {
            const valueJson = JSON.stringify(data[key] || {});
            await connection.query(
                `INSERT INTO system_state (state_key, state_value) 
                 VALUES (?, ?) 
                 ON DUPLICATE KEY UPDATE state_value = ?`,
                [key, valueJson, valueJson]
            );
        }

        res.json({ success: true, message: 'Все модули успешно синхронизированы с БД!' });
    } catch (error) {
        console.error('❌ Ошибка экспорта:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

router.post('/import', async (req, res) => {
    console.log('📥 Импорт, конфиг:', req.body);
    let connection;
    try {
        connection = await createConnection(req.body);
        await initializeDatabase(connection);

        const [rows] = await connection.query('SELECT state_key, state_value FROM system_state');
        
        const payload = {
            calendar: {},
            monthlyRates: {},
            accounts: [],
            expenseTransactions: []
        };

        rows.forEach(row => {
            try {
                payload[row.state_key] = JSON.parse(row.state_value);
            } catch (e) {
                payload[row.state_key] = row.state_key === 'accounts' || row.state_key === 'expenseTransactions' ? [] : {};
            }
        });

        res.json({ success: true, data: payload });
    } catch (error) {
        console.error('❌ Ошибка импорта:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) await connection.end();
    }
});

export default router;