const BASE_URL = "https://shazqi-ai-backend-deploy.vercel.app/api/storage"

export async function loadMeta() {
    const res = await fetch(`${BASE_URL}/meta`)
    return await res.json()
}

export async function saveMeta(list: any[]) {
    await fetch(`${BASE_URL}/meta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(list),
    })
}

export async function loadMessages(id: string) {
    const res = await fetch(`${BASE_URL}/messages?id=${id}`)
    return await res.json()
}

export async function saveMessages(id: string, msgs: any[]) {
    await fetch(`${BASE_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, messages: msgs }),
    })
}

export async function createConversation() {
    const res = await fetch(`${BASE_URL}/create`)
    const data = await res.json()
    return data.id
}
