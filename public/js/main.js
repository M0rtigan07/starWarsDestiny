import { initMatch, sendTurn } from './api.js';
import { showScreen, renderPool, renderDeck, renderBattleDeck, updateGameState, appendLog } from './ui.js';

// Estado global del cliente
const state = {
    chosenFaction: '',
    aiFaction: '',
    playerDeck: [],
    aiDeck: [],
    playerHp: 20,
    aiHp: 20,
    playerResources: 2,
    aiResources: 2,
    currentDiceResult: ''
};

const DECK_SIZE = 15;

// Eventos de Selección de Bando
document.getElementById('btnRebel').onclick = () => selectFaction('Alianza Rebelde');
document.getElementById('btnImperial').onclick = () => selectFaction('Imperio Galáctico');

async function selectFaction(faction) {
    state.chosenFaction = faction;
    showScreen('deck-screen');
    
    // Actualizar texto visual para 15 cartas
    document.querySelector('#deck-screen p').innerText = `Elige ${DECK_SIZE} cartas para llevar al combate estelar:`;

    try {
        // Inicializar partida completa en el backend (crea mazos de 15 para ambos)
        const matchData = await initMatch(faction);
        state.aiFaction = matchData.aiFaction;
        state.aiDeck = matchData.aiDeck;

        // Mostrar el pool de cartas disponibles del jugador (su mazo generado por el servidor)
        renderPool(matchData.playerDeck, addToDeck);
    } catch (err) {
        console.error(err);
        alert("Error al inicializar los mazos de la batalla.");
    }
}

let availablePoolTemp = []; // Guardamos temporalmente las disponibles si hace falta

function addToDeck(card, cardElement) {
    if (state.playerDeck.length >= DECK_SIZE) {
        alert(`¡Tu mazo ya ha alcanzado el límite de ${DECK_SIZE} cartas!`);
        return;
    }
    state.playerDeck.push(card);
    renderDeck(state.playerDeck, removeFromDeck);
}

function removeFromDeck(index) {
    state.playerDeck.splice(index, 1);
    renderDeck(state.playerDeck, removeFromDeck);
}

// Iniciar Batalla
document.getElementById('btnStartBattle').onclick = () => {
    if (state.playerDeck.length < DECK_SIZE) {
        alert(`Debes seleccionar exactamente ${DECK_SIZE} cartas para iniciar la batalla (Llevas ${state.playerDeck.length}).`);
        return;
    }
    showScreen('battle-screen');
    document.getElementById('factionTitle').innerText = `Tú: ${state.chosenFaction} vs IA: ${state.aiFaction}`;
    document.getElementById('playerName').innerText = 
        state.chosenFaction === 'Alianza Rebelde' ? 'Héroe Rebelde' : 'Comandante Imperial';

    renderBattleDeck(state.playerDeck, playCardDirectly);
};

// Lanzar Dados
document.getElementById('btnRollDice').onclick = () => {
    const options = [
        "⚔️ +2 Daño de Ataque",
        "🛡️ +1 Escudo de Defensa",
        "💎 +1 Recurso Táctico",
        "💥 +3 Daño Crítico"
    ];
    const r1 = options[Math.floor(Math.random() * options.length)];
    const r2 = options[Math.floor(Math.random() * options.length)];
    state.currentDiceResult = `[ ${r1} ] y [ ${r2} ]`;
    
    document.getElementById('diceResult').innerHTML = `Resultado de Dados: <b>${state.currentDiceResult}</b>`;
    executeTurn(`Lanzamiento de dados tácticos con resultado: ${state.currentDiceResult}`);
};

function playCardDirectly(card) {
    const cardName = card.titulo || card.name || 'Carta';
    let actionText = `Juego la carta: ${cardName}`;
    if (state.currentDiceResult) {
        actionText += ` aprovechando dados: ${state.currentDiceResult}`;
    }
    executeTurn(actionText);
}

async function executeTurn(actionText) {
    appendLog(actionText, false);

    try {
        const response = await sendTurn({
            playerAction: actionText,
            playerHp: state.playerHp,
            aiHp: state.aiHp,
            faction: state.chosenFaction,
            aiFaction: state.aiFaction,
            playerResources: state.playerResources,
            aiResources: state.aiResources,
            aiDeck: state.aiDeck
        });

        state.aiHp = Math.max(0, state.aiHp - (response.damageDealt || 1));
        state.playerHp = Math.max(0, state.playerHp - (response.damageTaken || 1));
        state.playerResources += (response.resourceChange || 0);

        updateGameState(state);
        
        const aiMsg = `[Carta usada: ${response.aiCardPlayed}] - ${response.message}`;
        appendLog(aiMsg, true);

        if (state.aiHp <= 0) alert("¡Victoria estelar! Has derrotado a las fuerzas enemigas.");
        if (state.playerHp <= 0) alert("¡Derrota! Tu escuadrón ha sido destruido.");

    } catch (err) {
        console.error(err);
        appendLog("[Error de comunicación táctica]", true);
    }
}