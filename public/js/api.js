export async function initMatch(playerFaction) {
    const res = await fetch(`/api?action=init-match&playerFaction=${encodeURIComponent(playerFaction)}`);
    if (!res.ok) throw new Error("Error al inicializar la batalla.");
    return await res.json();
}

export async function sendTurn(payload) {
    const res = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Error de comunicación táctica.");
    return await res.json();
}