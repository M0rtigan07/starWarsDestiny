// Para pedir las cartas según el bando
export async function fetchCards(faction) {
    const res = await fetch(`/api?action=cards&faction=${encodeURIComponent(faction)}`);
    if (!res.ok) throw new Error("Error al consultar las cartas.");
    return await res.json();
}

// Para enviar la jugada a la IA
export async function sendTurn(payload) {
    const res = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Error de comunicación táctica.");
    return await res.json();
}