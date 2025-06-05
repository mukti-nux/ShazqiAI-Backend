import { searchSerper } from '@/lib/searchSerper';
import { getWeather } from '@/lib/weatherAPI';

const ALLOWED_ORIGINS = [
  "https://portofoliomukti.framer.website",
  "https://portofolioku2-astro-theme.vercel.app",
];

export default async function handler(req, res) {
  const origin = req.headers.origin;

  // Handle CORS
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // Jika origin tidak diizinkan, bisa dikasih header kosong atau di-block (optional)
    res.setHeader("Access-Control-Allow-Origin", "null");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    // Preflight CORS request
    return res.status(204).end(); // 204 No Content lebih tepat daripada 200
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Gunakan POST." });
  }

  const { message } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Pesan (message) wajib berupa string." });
  }

  const keyword = message.toLowerCase();

  try {
    // 1. Cek Cuaca
    if (keyword.includes("cuaca") || keyword.includes("weather")) {
      const weather = await getWeather();
      return res.status(200).json({
        role: "assistant",
        content: weather,
      });
    }

    // 2. Cek Search Serper
    if (
      keyword.startsWith("cari ") ||
      keyword.startsWith("search ") ||
      keyword.includes("apa itu") ||
      keyword.includes("jelaskan") ||
      keyword.includes("dimana")
    ) {
      const results = await searchSerper(message);
      const formatted = results.length > 0
        ? `🔎 **${results[0].title}**\n${results[0].snippet}\n🔗 ${results[0].link}`
        : "Tidak ditemukan hasil yang relevan.";

      return res.status(200).json({
        role: "assistant",
        content: formatted,
      });
    }

    // 3. Fallback ke ChatGPT
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

    if (!response.ok) {
      console.error("❌ ChatGPT API error:", await response.text());
      return res.status(500).json({ error: "Gagal mendapatkan respons dari ChatGPT." });
    }

    const data = await response.json();

    return res.status(200).json({
      role: "assistant",
      content: data.choices?.[0]?.message?.content || "(Tidak ada balasan)",
    });
  } catch (err) {
    console.error("❌ Error handler:", err);
    return res.status(500).json({ error: "Terjadi kesalahan pada server." });
  }
}
