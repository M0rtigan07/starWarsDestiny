const path = require('path');
const fs = require('fs');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

module.exports = async (req, res) => {
    const { action } = req.query;

    // 1. Endpoint para inicializar la partida (mazos de 15 cartas y facciones cruzadas)
    if (req.method === 'GET' && action === 'init-match') {
        try {
            const { playerFaction } = req.query;
            const dataDir = path.join(process.cwd(), 'data');

            const loadJson = (filename) => {
                const filePath = path.join(dataDir, filename);
                if (fs.existsSync(filePath)) {
                    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
                }
                return [];
            };

            const heroes = loadJson('heroes.json');
            const villanos = loadJson('villanos.json');
            const neutrales = loadJson('neutrales.json');

            // Determinar facción de la IA (la contraria)
            const aiFaction = playerFaction === 'Alianza Rebelde' ? 'Imperio Galáctico' : 'Alianza Rebelde';

            // Construir mazo del jugador (15 cartas: principales de su bando + neutrales)
            const playerPool = playerFaction === 'Alianza Rebelde' ? heroes : villanos;
            const playerDeck = [...playerPool, ...neutrales].sort(() => 0.5 - Math.random()).slice(0, 15);

            // Construir mazo de la IA (15 cartas: principales del bando contrario + neutrales)
            const aiPool = aiFaction === 'Alianza Rebelde' ? heroes : villanos;
            const aiDeck = [...aiPool, ...neutrales].sort(() => 0.5 - Math.random()).slice(0, 15);

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({
                playerFaction,
                aiFaction,
                playerDeck,
                aiDeck,
                playerHp: 20,
                aiHp: 20,
                playerResources: 2,
                aiResources: 2
            });

        } catch (error) {
            console.error("Error al inicializar la partida:", error);
            return res.status(500).json({ error: "Error al configurar los mazos de la partida." });
        }
    }

    // 2. Endpoint de Combate Táctico con la IA (Método POST)
    if (req.method === 'POST') {
        const { playerAction, playerHp, aiHp, faction, aiFaction, playerResources, aiResources, aiDeck } = req.body;

        try {
            // Seleccionar aleatoriamente una carta del mazo de la IA para este turno
            const randomAiCard = aiDeck && aiDeck.length > 0
                ? aiDeck[Math.floor(Math.random() * aiDeck.length)]
                : { name: "Tropas de Asalto", description: "Maniobra táctica estándar" };

            const chatCompletion = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: `Eres un oponente táctico de Star Wars: Destiny. Juegas bajo el bando ${aiFaction}. 
                        Responde EXTREMADAMENTE en formato JSON estricto con esta estructura exacta:
                        {
                            "aiCardPlayed": "${randomAiCard.name || 'Maniobra táctica'}",
                            "message": "Descripción inmersiva de tu contraataque usando la carta",
                            "damageDealt": 2,
                            "damageTaken": 1,
                            "resourceChange": 1
                        }`
                    },
                    {
                        role: "user",
                        content: `Recursos jugador: ${playerResources}, Recursos IA: ${aiResources}. HP Jugador: ${playerHp}, HP IA: ${aiHp}. Acción del jugador: "${playerAction}".`
                    }
                ],
                response_format: { type: "json_object" }
            });

            const parsed = JSON.parse(chatCompletion.choices[0].message.content);

            return res.status(200).json({
                aiCardPlayed: parsed.aiCardPlayed || randomAiCard.name || "Ataque táctico",
                message: parsed.message || "La IA ejecuta una maniobra táctica implacable.",
                damageDealt: Number(parsed.damageDealt) || 1,
                damageTaken: Number(parsed.damageTaken) || 1,
                resourceChange: Number(parsed.resourceChange) || 0
            });

        } catch (error) {
            console.error("Error en el turno de la IA:", error);
            return res.status(500).json({
                aiCardPlayed: "Contraataque de Emergencia",
                message: "Las fuerzas enemigas reorganizan sus líneas bajo fuego.",
                damageDealt: 1,
                damageTaken: 1,
                resourceChange: 0
            });
        }
    }

    return res.status(405).json({ error: 'Método no permitido' });
};