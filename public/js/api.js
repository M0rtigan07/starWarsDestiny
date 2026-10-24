export async function fetchCards(faction) {
    const res = await fetch(`/api/cards?faction=${encodeURIComponent(faction)}`);
    if (!res.ok) throw new Error("Error al consultar las cartas.");
    return await res.json();
}

export async function sendTurn(payload) {
    const res = await fetch('/api/game/play-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Error de comunicación táctica.");
    return await res.json();
}