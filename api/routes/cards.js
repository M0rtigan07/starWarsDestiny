const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Cargar cartas desde la carpeta data/
function getCardsFromFile(filename) {
    const jsonPath = path.join(__dirname, '../../data', filename);
    if (!fs.existsSync(jsonPath)) return [];
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(rawData);
}

// Endpoint GET /api/cards?faction=Alianza Rebelde
router.get('/', (req, res) => {
    try {
        const { faction } = req.query;
        let mainCards = [];
        const neutrales = getCardsFromFile('neutrales.json');

        if (faction === 'Alianza Rebelde') {
            mainCards = getCardsFromFile('heroes.json');
        } else if (faction === 'Imperio Galáctico') {
            mainCards = getCardsFromFile('villanos.json');
        } else {
            // Si no se especifica bando, devuelve todo
            const heroes = getCardsFromFile('heroes.json');
            const villanos = getCardsFromFile('villanos.json');
            mainCards = [...heroes, ...villanos];
        }

        const allCards = [...mainCards, ...neutrales];
        res.json(allCards);
    } catch (error) {
        console.error("Error al cargar cartas:", error);
        res.status(500).json({ error: "Error al cargar la base de datos de cartas." });
    }
});

module.exports = router;