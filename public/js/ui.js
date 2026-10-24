export function showScreen(screenId) {
    document.querySelectorAll('#faction-screen, #deck-screen, #battle-screen').forEach(el => {
        el.classList.remove('active-screen');
    });
    document.getElementById(screenId).classList.add('active-screen');
}

// Función auxiliar para obtener la URL de la imagen de forma segura
function getCardImage(card) {
    const rawUrl = card.image_url || card.imagen || card.img || '';
    if (!rawUrl) return '';
    // Si ya trae la ruta completa o externa, la respeta; si no, añade el dominio de las cartas
    if (rawUrl.startsWith('http')) return rawUrl;
    return `https://www.swcardcollection.com${rawUrl}`;
}

// Función auxiliar para obtener el nombre de la carta
function getCardName(card) {
    return card.titulo || card.name || card.nombre || 'Carta';
}

export function renderPool(cards, onSelectCard) {
    const poolGrid = document.getElementById('poolGrid');
    poolGrid.innerHTML = '';
    
    cards.forEach(card => {
        const imgUrl = getCardImage(card);
        const name = getCardName(card);

        const el = document.createElement('div');
        el.className = 'card-item';
        el.innerHTML = `
            ${imgUrl ? `<img src="${imgUrl}" alt="${name}">` : ''}
            <p>${name}</p>
        `;
        el.onclick = () => onSelectCard(card);
        poolGrid.appendChild(el);
    });
}

export function renderDeck(deck, onRemoveCard) {
    const deckGrid = document.getElementById('deckGrid');
    deckGrid.innerHTML = '';
    document.getElementById('deckCount').innerText = deck.length;

    deck.forEach((card, index) => {
        const imgUrl = getCardImage(card);
        const name = getCardName(card);

        const el = document.createElement('div');
        el.className = 'card-item';
        el.innerHTML = `
            ${imgUrl ? `<img src="${imgUrl}" alt="${name}">` : ''}
            <p>${name}</p>
        `;
        el.onclick = () => onRemoveCard(index);
        deckGrid.appendChild(el);
    });
}

export function renderBattleDeck(deck, onPlayCard) {
    const grid = document.getElementById('battleDeckGrid');
    grid.innerHTML = '';

    deck.forEach(card => {
        const imgUrl = getCardImage(card);
        const name = getCardName(card);

        const el = document.createElement('div');
        el.className = 'battle-card';
        el.innerHTML = `
            ${imgUrl ? `<img src="${imgUrl}" alt="${name}">` : ''}
            <p>${name}</p>
        `;
        el.onclick = () => onPlayCard(card);
        grid.appendChild(el);
    });
}

export function updateGameState(state) {
    document.getElementById('playerHp').innerText = state.playerHp;
    document.getElementById('playerHpBar').style.width = (state.playerHp / 20) * 100 + '%';
    document.getElementById('playerResources').innerText = state.playerResources;

    document.getElementById('aiHp').innerText = state.aiHp;
    document.getElementById('aiHpBar').style.width = (state.aiHp / 20) * 100 + '%';
    document.getElementById('aiResources').innerText = state.aiResources;
}

export function appendLog(text, isAi = false) {
    const log = document.getElementById('combatLog');
    if (isAi) {
        log.innerHTML += `<br><span style="color: #f1c40f;"><strong>[IA Oponente]:</strong> ${text}</span>`;
    } else {
        log.innerHTML += `<br><strong>[Tú]:</strong> ${text}`;
    }
    log.scrollTop = log.scrollHeight;
}