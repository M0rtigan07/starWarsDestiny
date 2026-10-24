const path = require('path');
const fs = require('fs');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

module.exports = async (req, res) => {
    const { action } = req.query; // Para diferenciar si piden cartas o juegan un turno

    // 1. Endpoint de Cartas (ej: /api?action=cards&faction=...)
    if (req.method === 'GET') {
        try {
            const { faction } = req.query;
            const dataDir = path.join(process.cwd(), 'data');

            const loadJson = (filename) => {
                const filePath = path.join(dataDir, filename);
                if (fs.existsSync(filePath)) {
                    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
                }
                return [];
            };

            let mainCards = [];
            const neutrales = loadJson('neutrales.json');

            if (faction === 'Alianza Rebelde') {
                mainCards = loadJson('heroes.json');
            } else if (faction === 'Imperio Galáctico') {
                mainCards = loadJson('villanos.json');
            } else {
                mainCards = [...loadJson('heroes.json'), ...loadJson('villanos.json')];
            }

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json([...mainCards, ...neutrales]);

        } catch (error) {
            return res.status(500).json({ error: "Error al cargar las cartas." });
        }
    }

    // 2. Endpoint de Combate con la IA (Método POST)
    if (req.method === 'POST') {
        const { playerAction, playerHp, aiHp, faction, playerResources, aiResources } = req.body;

        try {
            const chatCompletion = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: `Eres un oponente táctico en Star Wars: Destiny. 
                        Responde EXTREMADAMENTE en formato JSON estricto con esta estructura exacta:
                        {
                            "message": "Descripción inmersiva de tu acción o contraataque",
                            "damageDealt": 2,
                            "damageTaken": 1,
                            "resourceChange": 1
                        }`
                    },
                    {
                        role: "user",
                        content: `Bando: ${faction}. Recursos jugador: ${playerResources}, Recursos IA: ${aiResources}. HP Jugador: ${playerHp}, HP IA: ${aiHp}. Acción: "${playerAction}".`
                    }
                ],
                response_format: { type: "json_object" }
            });

            const parsed = JSON.parse(chatCompletion.choices[0].message.content);

            return res.status(200).json({
                message: parsed.message || "La IA ejecuta una maniobra táctica.",
                damageDealt: Number(parsed.damageDealt) || 1,
                damageTaken: Number(parsed.damageTaken) || 1,
                resourceChange: Number(parsed.resourceChange) || 0
            });

        } catch (error) {
            return res.status(500).json({
                message: "Las fuerzas enemigas reorganizan sus líneas.",
                damageDealt: 1,
                damageTaken: 1,
                resourceChange: 0
            });
        }
    }

    res.status(405).json({ error: 'Método no permitido' });
};