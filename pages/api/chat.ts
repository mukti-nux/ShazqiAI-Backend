import { searchSerper } from '@/lib/searchSerper';
import { getWeather } from '@/lib/weatherAPI';
import applyCors from '@/utils/cors';

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

  const { messages } = req.body || {};

  // ✅ Validasi input
  if (!messages || !Array.isArray(messages)) {
    console.error("⛔️ Invalid body:", req.body);
    return res.status(400).json({ error: "Pesan tidak valid." });
  }

  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
  if (!lastMessage) {
    console.error("⛔️ Tidak ada konten pesan terakhir:", messages);
    return res.status(400).json({ error: "Tidak ada konten pesan terakhir." });
  }

  console.log("✅ Pesan terakhir:", lastMessage);

  // 🌤 Cuaca
  if (lastMessage.includes("cuaca") || lastMessage.includes("weather")) {
    try {
      const weather = await getWeather();
      console.log("✅ Cuaca berhasil diambil.");
      return res.status(200).json({
        role: "assistant",
        content: weather,
      });
    } catch (err) {
      console.error("❌ Gagal mengambil cuaca:", err);
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

      console.log("✅ Pencarian berhasil.");
      return res.status(200).json({
        role: "assistant",
        content: formatted,
      });
    } catch (err) {
      console.error("❌ Gagal mengambil pencarian Serper:", err);
      return res.status(500).json({ error: "Gagal mengambil data pencarian." });
    }
  }

  // 🤖 Fallback ke GPT
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    console.log("✅ GPT response:", data);

    return res.status(200).json({
      role: "assistant",
      content: data.choices?.[0]?.message?.content || "(Tidak ada balasan)",
    });
  } catch (err) {
    console.error("❌ Gagal terhubung ke ChatGPT:", err);
    return res.status(500).json({ error: "Gagal mendapatkan respons dari ChatGPT." });
  }
}
