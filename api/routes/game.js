const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/play-turn', async (req, res) => {
    const { playerAction, playerHp, aiHp, faction, playerResources, aiResources } = req.body;

    try {
        const chatCompletion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
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
                    content: `Bando: ${faction}. Recursos del jugador: ${playerResources}, Recursos IA: ${aiResources}. HP Jugador: ${playerHp}, HP IA: ${aiHp}. Acción jugada: "${playerAction}".`
                }
            ],
            response_format: { type: "json_object" }
        });

        const parsed = JSON.parse(chatCompletion.choices[0].message.content);

        res.json({
            message: parsed.message || "La IA ejecuta una maniobra táctica.",
            damageDealt: Number(parsed.damageDealt) || 1,
            damageTaken: Number(parsed.damageTaken) || 1,
            resourceChange: Number(parsed.resourceChange) || 0
        });

    } catch (error) {
        console.error("Error con Groq:", error);
        res.json({
            message: "Las fuerzas enemigas reorganizan sus líneas.",
            damageDealt: 1,
            damageTaken: 1,
            resourceChange: 0
        });
    }
});

module.exports = router;