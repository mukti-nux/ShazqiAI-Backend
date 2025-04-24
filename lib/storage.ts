//lib/storage.ts
export type ChatMeta = { id: string; title: string; created: number };
export type Message  = { role: "user" | "assistant"; content: string };

export function loadMeta(): ChatMeta[] {
  return JSON.parse(localStorage.getItem("conversations") || "[]");
}

export function saveMeta(list: ChatMeta[]) {
  localStorage.setItem("conversations", JSON.stringify(list));
}

export function loadMessages(id: string): Message[] {
  return JSON.parse(localStorage.getItem(`conv_${id}`) || "[]");
}

export function saveMessages(id: string, msgs: Message[]) {
  localStorage.setItem(`conv_${id}`, JSON.stringify(msgs));
}

export function createConversation() {
  const id = crypto.randomUUID();
  const meta: ChatMeta = { id, title: "Percakapan Baru", created: Date.now() };
  const list = [meta, ...loadMeta()];
  saveMeta(list);
  saveMessages(id, []);
  return id;
}
