import { useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
};

function formatTime() {
  const date = new Date();
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function applyTypingKereta(text: string) {
  const words = text.split(" ");
  return words
    .map((word) => {
      if (!/[a-zA-Z]$/.test(word)) return word;
      const vowels = ["a", "i", "u", "e", "o"];
      const lastChar = word[word.length - 1];
      if (vowels.includes(lastChar.toLowerCase())) {
        const repeat = Math.floor(Math.random() * 2) + 2; // 2–3x ulang
        return word + lastChar.repeat(repeat);
      }
      return word;
    })
    .join(" ");
}

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("shazqi-messages");
    if (stored) {
      setMessages(JSON.parse(stored));
    } else {
      setMessages([
        {
          role: "assistant",
          content: "Hi hi~ I'm Shazqi! Siap nemenin kamu di sini 🩷\nTanya ajaa yaa, aku bantuin semampuku~",
          timestamp: formatTime(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("shazqi-messages", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const playNotif = () => {
    const audio = new Audio("/notif.mp3");
    audio.play().catch(() => {});
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: formatTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatgpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await res.json();

      const formatted = applyTypingKereta(data.result);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: formatted,
          timestamp: formatTime(),
        },
      ]);
      playNotif();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Aduhh gagal jawab, coba lagi yaa 😥",
          timestamp: formatTime(),
        },
      ]);
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: "Arial", padding: "1rem", maxWidth: "650px", margin: "auto", marginTop: "40px" }}>
      <h1 style={{ textAlign: "center", fontSize: "1.8rem", color: "#ff69b4" }}>🩷 Shazqi AI</h1>

      <div
        style={{
          marginTop: "20px",
          marginBottom: "80px",
          padding: "10px",
          border: "1px solid #ddd",
          borderRadius: "12px",
          background: "#fff",
          height: "500px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user" ? "#dcf8c6" : "#f0f0f0",
              borderRadius: "16px",
              padding: "10px 14px",
              marginBottom: "10px",
              maxWidth: "80%",
              whiteSpace: "pre-wrap",
            }}
          >
            <div>{msg.content}</div>
            <div style={{ fontSize: "0.7rem", color: "#888", textAlign: "right", marginTop: "5px" }}>
              {msg.timestamp}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "-60px" }}>
        <input
          type="text"
          placeholder="Tanya ke Shazqi~"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          style={{
            flexGrow: 1,
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            backgroundColor: "#ff69b4",
            color: "#fff",
            border: "none",
            padding: "0 18px",
            borderRadius: "12px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Kirim
        </button>
      </div>
    </div>
  );
}
