import fs from "fs";
import path from "path";
import { searchSerper } from "@/lib/searchSerper";
import { getWeather } from "@/lib/weatherAPI";
import applyCors from "@/utils/cors";

const ALLOWED_ORIGINS = [
  "https://portofoliomukti.framer.website",
  "https://portofolioku2-astro-theme.vercel.app",
];

export default async function handler(req, res) {
  await applyCors(req, res);

  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { messages, username } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Pesan tidak valid." });
  }

  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
  if (!lastMessage) {
    return res.status(400).json({ error: "Tidak ada konten pesan terakhir." });
  }

  // 🌤 Cuaca
  if (lastMessage.includes("cuaca") || lastMessage.includes("weather")) {
    try {
      const weather = await getWeather();
      return res.status(200).json({
        role: "assistant",
        content: weather,
      });
    } catch (err) {
      return res.status(500).json({ error: "Gagal mengambil data cuaca." });
    }
  }

  // 🔎 Serper Search
  if (
    lastMessage.startsWith("cari ") ||
    lastMessage.startsWith("search ") ||
    lastMessage.includes("apa itu") ||
    lastMessage.includes("jelaskan") ||
    lastMessage.includes("dimana")
  ) {
    try {
      const results = await searchSerper(lastMessage);
      const formatted = results.length > 0
        ? `🔎 **${results[0].title}**\n${results[0].snippet}\n🔗 ${results[0].link}`
        : "Tidak ditemukan hasil yang relevan.";
      return res.status(200).json({
        role: "assistant",
        content: formatted,
      });
    } catch (err) {
      return res.status(500).json({ error: "Gagal mengambil data pencarian." });
    }
  }

  // 🧠 Load AI Profile + Tambahkan info pengguna
  let aiProfile = "";
  try {
    const aiProfilePath = path.join(process.cwd(), "data", "ai_profile.md");
    aiProfile = fs.readFileSync(aiProfilePath, "utf-8");
  } catch (err) {
    console.error("❌ Gagal membaca ai_profile.md:", err);
  }

  const personaInfo = username
    ? `Nama pengguna yang sedang berinteraksi denganmu adalah ${username}.`
    : "";

  const fullMessages = [
    { role: "system", content: `${aiProfile}\n\n${personaInfo}` },
    ...messages,
  ];

  // 🤖 Groq LLM
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: fullMessages,
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "(Tidak ada balasan)";
    return res.status(200).json({ role: "assistant", content: reply });
  } catch (err) {
    console.error("❌ Gagal menghubungi Groq:", err);
    return res.status(500).json({ error: "Gagal mendapatkan respons dari AI." });
  }
}