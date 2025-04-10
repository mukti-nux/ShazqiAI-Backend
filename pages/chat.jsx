import { useState } from 'react';

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const handleSend = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: input }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });

    const data = await res.json();

    setMessages((prev) => [...prev, { role: data.role, content: data.content }]);
    setInput("");
  };

  return (
    <div style={{ padding: 20 }}>
      <div>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <strong>{msg.role === "user" ? "🧑 Kamu" : "🤖 Shazqi AI"}:</strong>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tulis sesuatu..."
        />
        <button onClick={handleSend}>Kirim</button>
      </div>
    </div>
  );
}
