import express from 'express';
import cors from 'cors';
import dbRoutes from './routes/db.js';

const app = express();
const PORT = 3000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Раздача статики — фронтенд в папке frontend
app.use(express.static('frontend'));

app.use('/api/db', dbRoutes);

app.use((err, req, res, next) => {
    console.error('Критическая системная ошибка:', err.stack);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера бэкенда' });
});

app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(` СЕРВЕР ЗАПУЩЕН! Откройте в браузере:`);
    console.log(` 👉 http://localhost:${PORT}`);
    console.log(`=================================================`);
});