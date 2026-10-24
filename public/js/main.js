import { fetchCards, sendTurn } from './api.js';
import { showScreen, renderPool, renderDeck, renderBattleDeck, updateGameState, appendLog } from './ui.js';

// Estado global del cliente
const state = {
    chosenFaction: '',
    allCards: [],
    playerDeck: [],
    playerHp: 20,
    aiHp: 20,
    playerResources: 2,
    aiResources: 2,
    currentDiceResult: ''
};

// Eventos de Selección de Bando
document.getElementById('btnRebel').onclick = () => selectFaction('Alianza Rebelde');
document.getElementById('btnImperial').onclick = () => selectFaction('Imperio Galáctico');

async function selectFaction(faction) {
    state.chosenFaction = faction;
    showScreen('deck-screen');
    try {
        state.allCards = await fetchCards(faction);
        renderPool(state.allCards, addToDeck);
    } catch (err) {
        console.error(err);
        alert("Error al cargar las cartas para esta facción.");
    }
}

function addToDeck(card) {
    if (state.playerDeck.length >= 5) {
        alert("¡Tu mazo ya tiene 5 cartas!");
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
    if (state.playerDeck.length === 0) {
        alert("Selecciona al menos una carta para tu mazo.");
        return;
    }
    showScreen('battle-screen');
    document.getElementById('factionTitle').innerText = `Bando: ${state.chosenFaction}`;
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
            playerResources: state.playerResources,
            aiResources: state.aiResources,
            playerDeck: state.playerDeck
        });

        state.aiHp = Math.max(0, state.aiHp - (response.damageDealt || 1));
        state.playerHp = Math.max(0, state.playerHp - (response.damageTaken || 1));
        state.playerResources += (response.resourceChange || 0);

        updateGameState(state);
        appendLog(response.message, true);

        if (state.aiHp <= 0) alert("¡Victoria estelar! Has derrotado a las fuerzas enemigas.");
        if (state.playerHp <= 0) alert("¡Derrota! Tu escuadrón ha sido destruido.");

    } catch (err) {
        appendLog("[Error de comunicación táctica]", true);
    }
}