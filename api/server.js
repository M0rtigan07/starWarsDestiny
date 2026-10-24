const express = require('express');
const path = require('path');
require('dotenv').config();

const cardsRouter = require('./routes/cards');
const marvelRouter = require('./routes/marvel');
const gameRouter = require('./routes/game');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON y servir archivos estáticos
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Rutas de la API
app.use('/api/cards', cardsRouter);
app.use('/api/marvel', marvelRouter);
app.use('/api/game', gameRouter);

// Manejo para entorno local (si no estamos en Vercel)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(` Servidor local listo en http://localhost:${PORT}`);
        console.log(`====================================================`);
    });
}

// Exportación obligatoria para que Vercel maneje la app como Serverless Function
module.exports = app;