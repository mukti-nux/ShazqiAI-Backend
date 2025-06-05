import { searchSerper } from '@/lib/searchSerper';
import { getWeather } from '@/lib/weatherAPI';
import applyCors from '@/utils/cors';

const ALLOWED_ORIGINS = [
  "https://portofoliomukti.framer.website",
  "https://portofolioku2-astro-theme.vercel.app",
];

export default async function handler(req, res) {
  // Terapkan CORS dulu
  await applyCors(req, res);

  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { message } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Tidak ada pesan yang dikirim." });
  }

  const keyword = message.toLowerCase();

  // Cuaca
  if (keyword.includes("cuaca") || keyword.includes("weather")) {
    try {
      const weather = await getWeather();
      return res.status(200).json({
        role: "assistant",
        content: weather,
      });
    } catch (err) {
      console.error("❌ Cuaca error:", err);
      return res.status(500).json({ error: "Gagal mengambil data cuaca." });
    }
  }

  // Serper Search
  if (
    keyword.startsWith("cari ") ||
    keyword.startsWith("search ") ||
    keyword.includes("apa itu") ||
    keyword.includes("jelaskan") ||
    keyword.includes("dimana")
  ) {
    try {
      const results = await searchSerper(message);
      const formatted = results.length > 0
        ? `🔎 **${results[0].title}**\n${results[0].snippet}\n🔗 ${results[0].link}`
        : "Tidak ditemukan hasil yang relevan.";
      return res.status(200).json({
        role: "assistant",
        content: formatted,
      });
    } catch (err) {
      console.error("❌ Serper error:", err);
      return res.status(500).json({ error: "Gagal mengambil data pencarian." });
    }
  }

  // Fallback ke ChatGPT
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    return res.status(200).json({
      role: "assistant",
      content: data.choices?.[0]?.message?.content || "(Tidak ada balasan)",
    });
  } catch (err) {
    console.error("❌ ChatGPT error:", err);
    return res.status(500).json({ error: "Gagal mendapatkan respons dari ChatGPT." });
  }
}
